import type { EntitlementSnapshot, QuotaReservation, VerifiedPurchase, WebhookEventEnvelope } from './types.ts';

export interface PurchasePersistencePort {
  ensureBillingAccount(userId: string): Promise<void>;
  upsertTransaction(purchase: VerifiedPurchase): Promise<void>;
  upsertEntitlement(snapshot: EntitlementSnapshot): Promise<void>;
}

export interface WebhookPersistencePort extends PurchasePersistencePort {
  recordIncomingWebhook(envelope: WebhookEventEnvelope): Promise<{ duplicate: boolean }>;
  markWebhookProcessed(envelope: WebhookEventEnvelope): Promise<void>;
  markWebhookFailed(envelope: WebhookEventEnvelope, errorMessage: string): Promise<void>;
}

export async function persistVerifiedPurchase(
  port: PurchasePersistencePort,
  purchase: VerifiedPurchase,
  snapshot: EntitlementSnapshot
): Promise<void> {
  await port.ensureBillingAccount(snapshot.userId);
  await port.upsertTransaction(purchase);
  await port.upsertEntitlement(snapshot);
}

export async function processWebhookEvent(
  port: WebhookPersistencePort,
  envelope: WebhookEventEnvelope,
  purchase?: VerifiedPurchase,
  snapshot?: EntitlementSnapshot
): Promise<{ duplicate: boolean }> {
  const recorded = await port.recordIncomingWebhook(envelope);
  if (recorded.duplicate) return { duplicate: true };

  try {
    if (purchase && snapshot) {
      await persistVerifiedPurchase(port, purchase, snapshot);
    }
    await port.markWebhookProcessed(envelope);
    return { duplicate: false };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown webhook processing error';
    await port.markWebhookFailed(envelope, message);
    throw error;
  }
}

export async function executeQuotaJob<T>(params: {
  reserve: () => Promise<QuotaReservation>;
  commit: (quotaEventId: string, result?: Record<string, unknown>) => Promise<void>;
  release: (quotaEventId: string, reason: string, result?: Record<string, unknown>) => Promise<void>;
  work: (reservation: QuotaReservation) => Promise<{ value: T; result?: Record<string, unknown> }>;
}): Promise<{ reservation: QuotaReservation; value?: T }> {
  const reservation = await params.reserve();
  if (reservation.status !== 'pending' || !reservation.quotaEventId) {
    return { reservation };
  }

  try {
    const workResult = await params.work(reservation);
    await params.commit(reservation.quotaEventId, workResult.result);
    return { reservation: { ...reservation, status: 'committed' }, value: workResult.value };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown execution error';
    await params.release(reservation.quotaEventId, message);
    throw error;
  }
}
