export type PlanCode = 'free' | 'paid_monthly';

export type BillingProvider = 'apple' | 'google';

export type EntitlementState =
  | 'inactive'
  | 'active'
  | 'grace_period'
  | 'billing_retry'
  | 'paused'
  | 'expired'
  | 'revoked'
  | 'refunded';

export type ReflectionOrigin = 'free_weekly' | 'paid_cycle';

export type GatewayAction =
  | 'dream_reflection_generate'
  | 'dream_reflection_regenerate'
  | 'dream_followup_reply'
  | 'recent_dream_field_generate'
  | 'period_reflection_generate';

export interface EntitlementSnapshot {
  userId: string;
  provider: BillingProvider;
  planCode: PlanCode;
  entitlementState: EntitlementState;
  productId: string;
  storeSubscriptionId?: string | null;
  originalTransactionId?: string | null;
  latestTransactionId?: string | null;
  currentPeriodStart?: string | null;
  currentPeriodEnd?: string | null;
  autoRenewStatus?: boolean | null;
  environment?: string | null;
  raw: Record<string, unknown>;
}

export interface VerifiedPurchase {
  userId: string;
  provider: BillingProvider;
  planCode: PlanCode;
  entitlementState: EntitlementState;
  productId: string;
  transactionKey: string;
  externalTransactionId: string;
  originalTransactionId?: string | null;
  purchaseToken?: string | null;
  transactionType: string;
  transactionTime?: string | null;
  currentPeriodStart?: string | null;
  currentPeriodEnd?: string | null;
  autoRenewStatus?: boolean | null;
  environment?: string | null;
  appAccountToken?: string | null;
  googleObfuscatedAccountId?: string | null;
  raw: Record<string, unknown>;
}

export interface WebhookEventEnvelope {
  provider: BillingProvider;
  eventId: string;
  eventType: string;
  payload: Record<string, unknown>;
  receivedAt: string;
}

export interface EntitlementProvider<PurchaseInput = unknown, WebhookInput = unknown> {
  readonly name: BillingProvider;
  verifyPurchase(input: PurchaseInput): Promise<{
    purchase: VerifiedPurchase;
    snapshot: EntitlementSnapshot;
  }>;
  resolveWebhook(input: WebhookInput): Promise<{
    envelope: WebhookEventEnvelope;
    purchase?: VerifiedPurchase;
    snapshot?: EntitlementSnapshot;
  }>;
}

export type QuotaReservationStatus = 'pending' | 'committed' | 'released' | 'denied' | 'cached';

export interface QuotaReservation {
  status: QuotaReservationStatus;
  quotaEventId?: string;
  artifactId?: string | null;
  bucketId?: string | null;
  reason?: string | null;
  result?: Record<string, unknown> | null;
}
