import { executeQuotaJob, persistVerifiedPurchase, processWebhookEvent } from '../../src/billing/runtime';
import type { EntitlementSnapshot, QuotaReservation, VerifiedPurchase, WebhookEventEnvelope } from '../../src/billing/types';

const purchase: VerifiedPurchase = {
  userId: 'user-1',
  provider: 'apple',
  planCode: 'paid_monthly',
  entitlementState: 'active',
  productId: 'oneiros.monthly',
  transactionKey: 'apple:tx-1',
  externalTransactionId: 'tx-1',
  originalTransactionId: 'orig-1',
  transactionType: 'INITIAL_BUY',
  transactionTime: '2026-07-10T10:00:00.000Z',
  currentPeriodStart: '2026-07-10T10:00:00.000Z',
  currentPeriodEnd: '2026-08-10T10:00:00.000Z',
  autoRenewStatus: true,
  environment: 'Production',
  appAccountToken: 'account-token',
  raw: { transactionId: 'tx-1' },
};

const snapshot: EntitlementSnapshot = {
  userId: 'user-1',
  provider: 'apple',
  planCode: 'paid_monthly',
  entitlementState: 'active',
  productId: 'oneiros.monthly',
  originalTransactionId: 'orig-1',
  latestTransactionId: 'tx-1',
  currentPeriodStart: '2026-07-10T10:00:00.000Z',
  currentPeriodEnd: '2026-08-10T10:00:00.000Z',
  autoRenewStatus: true,
  environment: 'Production',
  raw: { transactionId: 'tx-1' },
};

const appleEnvelope: WebhookEventEnvelope = {
  provider: 'apple',
  eventId: 'apple-event-1',
  eventType: 'DID_RENEW',
  payload: { notificationType: 'DID_RENEW' },
  receivedAt: '2026-07-10T12:00:00.000Z',
};

const googleEnvelope: WebhookEventEnvelope = {
  provider: 'google',
  eventId: 'pubsub-message-1',
  eventType: '4',
  payload: { subscriptionNotification: { notificationType: 4 } },
  receivedAt: '2026-07-10T12:00:00.000Z',
};

describe('subscription billing runtime flow', () => {
  it('persists a verified purchase by ensuring account, then transaction, then entitlement', async () => {
    const calls: string[] = [];
    const port = {
      ensureBillingAccount: jest.fn(async () => {
        calls.push('account');
      }),
      upsertTransaction: jest.fn(async () => {
        calls.push('transaction');
      }),
      upsertEntitlement: jest.fn(async () => {
        calls.push('entitlement');
      }),
    };

    await persistVerifiedPurchase(port, purchase, snapshot);

    expect(calls).toEqual(['account', 'transaction', 'entitlement']);
  });

  it('short-circuits duplicate Apple webhook events before any persistence work', async () => {
    const port = {
      ensureBillingAccount: jest.fn(),
      upsertTransaction: jest.fn(),
      upsertEntitlement: jest.fn(),
      recordIncomingWebhook: jest.fn(async () => ({ duplicate: true })),
      markWebhookProcessed: jest.fn(),
      markWebhookFailed: jest.fn(),
    };

    const result = await processWebhookEvent(port, appleEnvelope, purchase, snapshot);

    expect(result).toEqual({ duplicate: true });
    expect(port.upsertTransaction).not.toHaveBeenCalled();
    expect(port.markWebhookProcessed).not.toHaveBeenCalled();
  });

  it('dedupes Google RTDN events by message id and marks successful processing', async () => {
    const port = {
      ensureBillingAccount: jest.fn(async () => undefined),
      upsertTransaction: jest.fn(async () => undefined),
      upsertEntitlement: jest.fn(async () => undefined),
      recordIncomingWebhook: jest.fn(async () => ({ duplicate: false })),
      markWebhookProcessed: jest.fn(async () => undefined),
      markWebhookFailed: jest.fn(async () => undefined),
    };

    const result = await processWebhookEvent(port, googleEnvelope, purchase, snapshot);

    expect(result).toEqual({ duplicate: false });
    expect(port.recordIncomingWebhook).toHaveBeenCalledWith(googleEnvelope);
    expect(port.markWebhookProcessed).toHaveBeenCalledWith(googleEnvelope);
  });

  it('marks webhook processing as failed if persistence throws', async () => {
    const port = {
      ensureBillingAccount: jest.fn(async () => undefined),
      upsertTransaction: jest.fn(async () => {
        throw new Error('write failed');
      }),
      upsertEntitlement: jest.fn(async () => undefined),
      recordIncomingWebhook: jest.fn(async () => ({ duplicate: false })),
      markWebhookProcessed: jest.fn(async () => undefined),
      markWebhookFailed: jest.fn(async () => undefined),
    };

    await expect(processWebhookEvent(port, appleEnvelope, purchase, snapshot)).rejects.toThrow('write failed');
    expect(port.markWebhookFailed).toHaveBeenCalledWith(appleEnvelope, 'write failed');
  });

  it('commits a reserved quota action after successful work', async () => {
    const reservation: QuotaReservation = {
      status: 'pending',
      quotaEventId: 'quota-1',
    };

    const reserve = jest.fn(async () => reservation);
    const commit = jest.fn(async () => undefined);
    const release = jest.fn(async () => undefined);
    const work = jest.fn(async () => ({
      value: { reflection: 'ok' },
      result: { interpretation_id: 'interp-1' },
    }));

    const result = await executeQuotaJob({ reserve, commit, release, work });

    expect(result.value).toEqual({ reflection: 'ok' });
    expect(commit).toHaveBeenCalledWith('quota-1', { interpretation_id: 'interp-1' });
    expect(release).not.toHaveBeenCalled();
  });

  it('releases a reserved quota action if the work fails', async () => {
    const reservation: QuotaReservation = {
      status: 'pending',
      quotaEventId: 'quota-2',
    };

    const reserve = jest.fn(async () => reservation);
    const commit = jest.fn(async () => undefined);
    const release = jest.fn(async () => undefined);
    const work = jest.fn(async () => {
      throw new Error('AI timeout');
    });

    await expect(executeQuotaJob({ reserve, commit, release, work })).rejects.toThrow('AI timeout');
    expect(commit).not.toHaveBeenCalled();
    expect(release).toHaveBeenCalledWith('quota-2', 'AI timeout');
  });

  it('does not execute work for an already-cached or denied reservation', async () => {
    const work = jest.fn();

    const cachedResult = await executeQuotaJob({
      reserve: async () => ({ status: 'cached', quotaEventId: 'quota-3', result: { artifact_id: 'artifact-1' } }),
      commit: async () => undefined,
      release: async () => undefined,
      work,
    });

    const deniedResult = await executeQuotaJob({
      reserve: async () => ({ status: 'denied', quotaEventId: 'quota-4', reason: 'quota_reached' }),
      commit: async () => undefined,
      release: async () => undefined,
      work,
    });

    expect(cachedResult.reservation.status).toBe('cached');
    expect(deniedResult.reservation.status).toBe('denied');
    expect(work).not.toHaveBeenCalled();
  });
});
