import type { GatewayAction, PlanCode, PlanTier, EntitlementState } from '../billing/types';

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

export type EssayCadence = 'monthly' | 'weekly' | null;

export type EssayQuota = SubscriptionQuota & {
  cadence: EssayCadence;
};

export type SubscriptionStatus = {
  planCode: PlanCode;
  planTier: PlanTier;
  entitlementState: EntitlementState;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  essayCadence: EssayCadence;
  bonusGraceBundleUsed: boolean;
  bonusGraceBundleGrantedAt: string | null;
  appAccountToken: string | null;
  googleObfuscatedAccountId: string | null;
  quotas: {
    dreamReflections: SubscriptionQuota;
    recentDreamField: SubscriptionQuota;
    essays: EssayQuota;
  };
  hasPaidAccess: boolean;
};

export type StoreSubscriptionPlan = {
  planCode: Extract<PlanCode, 'paid_monthly' | 'paid_yearly' | 'deeper_monthly' | 'deeper_yearly'>;
  planTier: Exclude<PlanTier, 'free'>;
  billingInterval: BillingInterval;
  productId: string;
  /** True only when the current store returned this exact product and price. */
  storePriceAvailable: boolean;
  /** Numeric price in the current storefront currency, when supplied by the store. */
  priceAmount: number | null;
  /** ISO 4217 storefront currency code, when supplied by the store. */
  currencyCode: string | null;
  displayPrice: string;
  totalPriceLabel: string;
  /** Matching monthly store price retained for optional yearly comparison copy. */
  compareAtPriceLabel: string | null;
  monthlyEquivalentLabel: string | null;
  savingsLabel: string | null;
  offerTokenAndroid?: string | null;
  title: string;
  trialLabel: string | null;
};

export type FreePlanCardModel = {
  planCode: 'free';
  planTier: 'free';
  billingInterval: 'monthly';
  productId: 'free';
  displayPrice: string;
  totalPriceLabel: string;
  compareAtPriceLabel: null;
  monthlyEquivalentLabel: null;
  savingsLabel: null;
  title: string;
  trialLabel: null;
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
