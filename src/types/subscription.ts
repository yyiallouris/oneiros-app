import type { GatewayAction, PlanCode, EntitlementState } from '../billing/types';

export type BillingInterval = 'monthly' | 'yearly';

export type IapUnavailableReason =
  | 'expo_go'
  | 'web'
  | 'missing_native_module'
  | 'unknown';

export type SubscriptionQuota = {
  limit: number | null;
  used: number;
  remaining: number | null;
  nextResetAt: string | null;
};

export type SubscriptionStatus = {
  planCode: PlanCode;
  entitlementState: EntitlementState;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  appAccountToken: string | null;
  googleObfuscatedAccountId: string | null;
  quotas: {
    dreamReflections: SubscriptionQuota;
    recentDreamField: SubscriptionQuota;
  };
  hasPaidAccess: boolean;
};

export type StoreSubscriptionPlan = {
  planCode: Extract<PlanCode, 'paid_monthly' | 'paid_yearly'>;
  billingInterval: BillingInterval;
  productId: string;
  displayPrice: string;
  totalPriceLabel: string;
  monthlyEquivalentLabel: string | null;
  savingsLabel: string | null;
  offerTokenAndroid?: string | null;
  title: string;
};

export type PremiumGateSource =
  | 'account'
  | 'subscription'
  | 'onboarding'
  | 'insights'
  | 'recent_field'
  | 'period_reflection'
  | 'followup'
  | 'regenerate';

export type SubscriptionFeatureRow = {
  label: string;
  included: boolean;
  emphasis?: boolean;
};

export type AiGatewayRequest = {
  action: GatewayAction;
  idempotencyKey: string;
  dreamId?: string;
  interpretationId?: string;
  quotaEventId?: string;
  message?: string;
  depth?: 'quick' | 'standard' | 'advanced';
  async?: boolean;
  count?: 2 | 3 | 5;
  monthKey?: string;
  language?: string;
  /** Dev/test only — request interpretive candidate diagnostics; never shown in production UI. */
  debug_interpretive_echoes?: boolean;
};
