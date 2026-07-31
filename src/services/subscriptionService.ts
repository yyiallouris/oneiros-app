import Constants from 'expo-constants';
import { Platform } from 'react-native';
import type { ProductSubscription } from 'expo-iap';
import { getPlanTier, hasPaidAccess } from '../billing/policy';
import type { GatewayAction, PlanCode, PlanTier } from '../billing/types';
import { logError, logInfo } from './logger';
import { supabase } from './supabaseClient';
import type {
  AiGatewayRequest,
  BillingInterval,
  EssayCadence,
  FreePlanCardModel,
  IapUnavailableReason,
  PremiumGateSource,
  StoreSubscriptionPlan,
  SubscriptionFeatureRow,
  SubscriptionStatus,
} from '../types/subscription';

type RawQuota = {
  limit?: number | null;
  used?: number | null;
  remaining?: number | null;
  next_reset_at?: string | null;
};

type RawSubscriptionStatus = {
  plan_code?: PlanCode;
  plan_tier?: PlanTier;
  entitlement_state?: SubscriptionStatus['entitlementState'];
  current_period_start?: string | null;
  current_period_end?: string | null;
  essay_cadence?: EssayCadence;
  bonus_grace_bundle_used?: boolean;
  bonus_grace_bundle_granted_at?: string | null;
  app_account_token?: string | null;
  google_obfuscated_account_id?: string | null;
  quotas?: {
    dream_reflections?: RawQuota;
    recent_dream_field?: RawQuota;
    period_reflection?: RawQuota & {
      cadence?: EssayCadence;
    };
  };
};

const extras =
  Constants.expoConfig?.extra ??
  (Constants.manifest as Record<string, unknown> | undefined)?.extra ??
  {};

type SubscriptionConfig = {
  applePremiumMonthlyProductId: string;
  applePremiumYearlyProductId: string;
  appleDeeperMonthlyProductId: string;
  appleDeeperYearlyProductId: string;
  googlePremiumSubscriptionProductId: string;
  googleDeeperSubscriptionProductId: string;
  googleMonthlyBasePlanId: string;
  googleYearlyBasePlanId: string;
  androidPackageName: string;
};

type PaidPlanCode = Exclude<PlanCode, 'free'>;

type FallbackPlanCopy = Pick<
  StoreSubscriptionPlan,
  | 'billingInterval'
  | 'displayPrice'
  | 'totalPriceLabel'
  | 'compareAtPriceLabel'
  | 'monthlyEquivalentLabel'
  | 'savingsLabel'
  | 'trialLabel'
>;

const DEFAULT_TRIAL_LABEL = '7-day free trial';
const PREMIUM_MONTHLY_PRICE = 4.99;
const DEEPER_MONTHLY_PRICE = 8.99;
/** Premium yearly monthly equivalent = monthly × this ratio (4.99 → 3.99). */
const PREMIUM_ANNUAL_DISCOUNT_RATIO = 0.8;
/** Deeper yearly is priced to a fixed monthly equivalent, not the Premium ratio. */
const DEEPER_YEARLY_MONTHLY_EQUIVALENT = 6.49;

function formatMoney(value: number): string {
  return `€${value.toFixed(2)}`;
}

function buildYearlyCopy(
  monthlyPrice: number,
  monthlyEquivalentOverride?: number
): Pick<
  FallbackPlanCopy,
  'displayPrice' | 'totalPriceLabel' | 'compareAtPriceLabel' | 'monthlyEquivalentLabel' | 'savingsLabel'
> {
  const monthlyEquivalent =
    typeof monthlyEquivalentOverride === 'number'
      ? Math.round(monthlyEquivalentOverride * 100) / 100
      : Math.round(monthlyPrice * PREMIUM_ANNUAL_DISCOUNT_RATIO * 100) / 100;
  const yearlyPrice = Math.round(monthlyEquivalent * 12 * 100) / 100;
  const yearlySavings = Math.round((monthlyPrice * 12 - yearlyPrice) * 100) / 100;

  return {
    displayPrice: `${formatMoney(yearlyPrice)} / year`,
    totalPriceLabel: `${formatMoney(yearlyPrice)} billed yearly`,
    compareAtPriceLabel: `${formatMoney(monthlyPrice)} / month`,
    monthlyEquivalentLabel: `${formatMoney(monthlyEquivalent)} / month`,
    savingsLabel: `Save ${formatMoney(yearlySavings)} / year`,
  };
}

export const subscriptionConfig: SubscriptionConfig = {
  applePremiumMonthlyProductId: String(extras.appleSubscriptionMonthlyProductId ?? 'oneiros_premium_monthly'),
  applePremiumYearlyProductId: String(extras.appleSubscriptionYearlyProductId ?? 'oneiros_premium_yearly'),
  appleDeeperMonthlyProductId: String(extras.appleDeeperSubscriptionMonthlyProductId ?? 'oneiros_deeper_monthly'),
  appleDeeperYearlyProductId: String(extras.appleDeeperSubscriptionYearlyProductId ?? 'oneiros_deeper_yearly'),
  googlePremiumSubscriptionProductId: String(extras.googleSubscriptionProductId ?? 'oneiros_premium'),
  googleDeeperSubscriptionProductId: String(extras.googleDeeperSubscriptionProductId ?? 'oneiros_deeper'),
  googleMonthlyBasePlanId: String(extras.googleSubscriptionMonthlyBasePlanId ?? 'monthly'),
  googleYearlyBasePlanId: String(extras.googleSubscriptionYearlyBasePlanId ?? 'yearly'),
  androidPackageName: String(
    extras.androidPackageName ??
      Constants.expoConfig?.android?.package ??
      'com.oneirosdreamjournal.app'
  ),
};

const FALLBACK_PLAN_COPY: Record<PlanCode, FallbackPlanCopy> = {
  free: {
    billingInterval: 'monthly',
    displayPrice: 'Free',
    totalPriceLabel: 'Always free',
    compareAtPriceLabel: null,
    monthlyEquivalentLabel: null,
    savingsLabel: null,
    trialLabel: null,
  },
  paid_monthly: {
    billingInterval: 'monthly',
    displayPrice: `${formatMoney(PREMIUM_MONTHLY_PRICE)} / month`,
    totalPriceLabel: 'Billed monthly',
    compareAtPriceLabel: null,
    monthlyEquivalentLabel: null,
    savingsLabel: null,
    trialLabel: DEFAULT_TRIAL_LABEL,
  },
  paid_yearly: {
    billingInterval: 'yearly',
    ...buildYearlyCopy(PREMIUM_MONTHLY_PRICE),
    trialLabel: DEFAULT_TRIAL_LABEL,
  },
  deeper_monthly: {
    billingInterval: 'monthly',
    displayPrice: `${formatMoney(DEEPER_MONTHLY_PRICE)} / month`,
    totalPriceLabel: 'Billed monthly',
    compareAtPriceLabel: null,
    monthlyEquivalentLabel: null,
    savingsLabel: null,
    trialLabel: DEFAULT_TRIAL_LABEL,
  },
  deeper_yearly: {
    billingInterval: 'yearly',
    ...buildYearlyCopy(DEEPER_MONTHLY_PRICE, DEEPER_YEARLY_MONTHLY_EQUIVALENT),
    trialLabel: DEFAULT_TRIAL_LABEL,
  },
};

export const FREE_PLAN_FEATURES: SubscriptionFeatureRow[] = [
  { label: 'Unlimited dream entries', included: true, emphasis: true },
  { label: '1 reflection every 7 days', included: true },
  { label: '5 follow-up replies on that free reflection', included: true },
  { label: 'Recent Dream Field reports', included: false },
  { label: 'Monthly or weekly essays', included: false },
  { label: 'Paid regenerate and premium continuity', included: false },
];

export const PREMIUM_PLAN_FEATURES: SubscriptionFeatureRow[] = [
  { label: '35 reflections each month', included: true, emphasis: true },
  { label: 'Oneiros deep pattern recognition', included: true },
  { label: '10 Recent Dream Field reports each month', included: true },
  { label: '1 monthly essay', included: true },
  { label: '5 follow-up replies per reflected dream', included: true },
  { label: '7-day free trial', included: true },
];

export const DEEPER_PLAN_FEATURES: SubscriptionFeatureRow[] = [
  { label: '80 reflections each month', included: true, emphasis: true },
  { label: 'Oneiros deep pattern recognition', included: true },
  { label: 'Unlimited Recent Dream Field reports', included: true },
  { label: 'Weekly essays', included: true },
  { label: '5 follow-up replies per reflected dream', included: true },
  { label: '7-day free trial', included: true },
];

export function getPlanFeatures(planTier: PlanTier): SubscriptionFeatureRow[] {
  switch (planTier) {
    case 'premium':
      return PREMIUM_PLAN_FEATURES;
    case 'deeper':
      return DEEPER_PLAN_FEATURES;
    default:
      return FREE_PLAN_FEATURES;
  }
}

function getPlanTierForPaidCode(planCode: PaidPlanCode): Exclude<PlanTier, 'free'> {
  return planCode === 'deeper_monthly' || planCode === 'deeper_yearly' ? 'deeper' : 'premium';
}

export function getPlanTitle(planCode: PlanCode): string {
  switch (planCode) {
    case 'paid_monthly':
      return 'Premium Monthly';
    case 'paid_yearly':
      return 'Premium Yearly';
    case 'deeper_monthly':
      return 'Deeper Monthly';
    case 'deeper_yearly':
      return 'Deeper Yearly';
    default:
      return 'Free';
  }
}

export function getPlanDisplayName(planTier: PlanTier): string {
  switch (planTier) {
    case 'premium':
      return 'Premium';
    case 'deeper':
      return 'Deeper';
    default:
      return 'Free';
  }
}

export function getPremiumSourceCopy(source: PremiumGateSource): { title: string; body: string } {
  switch (source) {
    case 'followup':
      return {
        title: 'Keep the dialogue open',
        body: 'Follow-up conversation belongs to the paid tiers. Premium is the natural path, and Deeper stays there if you want more room.',
      };
    case 'regenerate':
      return {
        title: 'Refresh with more room',
        body: 'Regenerations live on the paid plans so reflection history, quotas, and read-only rules stay clean.',
      };
    case 'recent_field':
      return {
        title: 'Recent Dream Field',
        body: 'Premium includes 10 recent-field reports each month. Deeper removes that ceiling entirely.',
      };
    case 'period_reflection':
      return {
        title: 'Essays and long-form patterns',
        body: 'Premium includes one monthly essay. Deeper opens the weekly rhythm for people who want to stay closer to the material.',
      };
    case 'onboarding':
      return {
        title: 'Choose your rhythm',
        body: 'Free stays grounded. Premium is the recommended path. Deeper opens a more serious monthly cadence without turning the screen into a conversion trick.',
      };
    case 'account':
      return {
        title: 'Choose your paid depth',
        body: 'Premium is the clear default. Deeper is there when you want more reflections, weekly essays, and unlimited recent-field reports.',
      };
    case 'subscription':
      return {
        title: 'Subscription',
        body: 'Compare Free, Premium, and Deeper in one calm place. Each paid tier starts with a 7-day free trial when the stores allow it.',
      };
    default:
      return {
        title: 'Paid feature',
        body: 'This space belongs to the paid plans. Premium is the recommended fit, and Deeper is there if you want the larger monthly room.',
      };
  }
}

export function getTargetPlanForTierInterval(
  planTier: Exclude<PlanTier, 'free'>,
  interval: BillingInterval
): PaidPlanCode {
  if (planTier === 'deeper') {
    return interval === 'yearly' ? 'deeper_yearly' : 'deeper_monthly';
  }
  return interval === 'yearly' ? 'paid_yearly' : 'paid_monthly';
}

export function getInitialIapRuntimeAvailability(): {
  available: boolean;
  reason: IapUnavailableReason | null;
} {
  if (Platform.OS === 'web') {
    return {
      available: false,
      reason: 'web',
    };
  }

  const executionEnvironment = String(
    (Constants as unknown as { executionEnvironment?: unknown }).executionEnvironment ?? ''
  );

  if (Constants.appOwnership === 'expo' || executionEnvironment === 'storeClient') {
    return {
      available: false,
      reason: 'expo_go',
    };
  }

  return {
    available: true,
    reason: null,
  };
}

export function isMissingNativeIapError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return /Cannot find native module 'ExpoIap(?:Onside|Vega)?'/.test(error.message);
}

export function getIapUnavailableMessage(reason: IapUnavailableReason | null): string {
  switch (reason) {
    case 'web':
      return 'Subscription actions are not available on web builds. Use an iPhone or Android build to restore or manage your purchases.';
    case 'expo_go':
      return 'Subscription actions require a development build or store build. Expo Go cannot open native purchase restore or manage flows.';
    case 'missing_native_module':
      return 'This build does not include the native subscription module yet. Please use a development build or store build to restore or manage purchases.';
    default:
      return 'Subscription actions require a development build or store build on a real mobile runtime.';
  }
}

export function createIdempotencyKey(action: GatewayAction, scope: string): string {
  const random = Math.random().toString(36).slice(2, 10);
  return `${action}:${scope}:${Date.now()}:${random}`;
}

function normalizeQuota(raw?: RawQuota): SubscriptionStatus['quotas']['dreamReflections'] {
  return {
    limit: raw?.limit ?? null,
    used: raw?.used ?? 0,
    remaining: raw?.remaining ?? null,
    nextResetAt: raw?.next_reset_at ?? null,
  };
}

export function normalizeSubscriptionStatus(raw?: RawSubscriptionStatus | null): SubscriptionStatus {
  const planCode = raw?.plan_code ?? 'free';
  const planTier = raw?.plan_tier ?? getPlanTier(planCode);
  const entitlementState = raw?.entitlement_state ?? 'inactive';
  const currentPeriodEnd = raw?.current_period_end ?? null;

  return {
    planCode,
    planTier,
    entitlementState,
    currentPeriodStart: raw?.current_period_start ?? null,
    currentPeriodEnd,
    essayCadence: raw?.essay_cadence ?? raw?.quotas?.period_reflection?.cadence ?? null,
    bonusGraceBundleUsed: raw?.bonus_grace_bundle_used ?? false,
    bonusGraceBundleGrantedAt: raw?.bonus_grace_bundle_granted_at ?? null,
    appAccountToken: raw?.app_account_token ?? null,
    googleObfuscatedAccountId: raw?.google_obfuscated_account_id ?? null,
    quotas: {
      dreamReflections: normalizeQuota(raw?.quotas?.dream_reflections),
      recentDreamField: normalizeQuota(raw?.quotas?.recent_dream_field),
      essays: {
        ...normalizeQuota(raw?.quotas?.period_reflection),
        cadence: raw?.quotas?.period_reflection?.cadence ?? raw?.essay_cadence ?? null,
      },
    },
    hasPaidAccess: hasPaidAccess({
      planCode,
      entitlementState,
      currentPeriodEnd,
    }),
  };
}

function buildStorePlan(planCode: PaidPlanCode, productId: string, displayPrice?: string | null, offerTokenAndroid?: string | null): StoreSubscriptionPlan {
  const fallback = FALLBACK_PLAN_COPY[planCode];
  return {
    title: getPlanTitle(planCode),
    productId,
    planCode,
    planTier: getPlanTierForPaidCode(planCode),
    billingInterval: fallback.billingInterval,
    displayPrice: displayPrice || fallback.displayPrice,
    totalPriceLabel: fallback.totalPriceLabel,
    compareAtPriceLabel: fallback.compareAtPriceLabel,
    monthlyEquivalentLabel: fallback.monthlyEquivalentLabel,
    savingsLabel: fallback.savingsLabel,
    trialLabel: fallback.trialLabel,
    offerTokenAndroid: offerTokenAndroid ?? null,
  };
}

/** Card pricing presentation: yearly shows strikethrough list price + discounted monthly + savings. */
export function getPaidPlanCardPricing(plan: StoreSubscriptionPlan): {
  price: string;
  compareAtPrice: string | null;
  priceDetail: string;
  secondaryPriceDetail: string | null;
} {
  if (plan.billingInterval === 'yearly' && plan.monthlyEquivalentLabel) {
    return {
      price: plan.monthlyEquivalentLabel,
      compareAtPrice: plan.compareAtPriceLabel,
      priceDetail: plan.totalPriceLabel,
      secondaryPriceDetail: plan.savingsLabel,
    };
  }

  return {
    price: plan.displayPrice,
    compareAtPrice: null,
    priceDetail: plan.totalPriceLabel,
    secondaryPriceDetail: null,
  };
}

/** Compact Yearly switch badge: "Save €12.00 / year" → "Save €12". */
export function getCompactYearlySavingsBadge(savingsLabel: string | null | undefined): string | null {
  if (!savingsLabel) return null;
  return savingsLabel.replace(/\s*\/\s*year$/i, '').replace(/(\d+)\.00\b/g, '$1');
}

/**
 * Yearly switch badge for the currently visible paid card.
 * Compare carousels: index 0 = Free, 1 = Premium, 2 = Deeper.
 * Premium-only carousels: index 0 = Premium.
 */
export function getYearlySavingsBadgeForVisibleCard(params: {
  activeCardIndex: number;
  premiumPlan: StoreSubscriptionPlan;
  deeperPlan: StoreSubscriptionPlan;
  includesFreeCard?: boolean;
}): string | null {
  const includesFreeCard = params.includesFreeCard !== false;
  const paidIndex = includesFreeCard ? params.activeCardIndex - 1 : params.activeCardIndex;
  const plan = paidIndex >= 1 ? params.deeperPlan : params.premiumPlan;
  // Prefer yearly savings even when the switch is currently on monthly (teaser on Yearly tab).
  const yearlySavings =
    plan.billingInterval === 'yearly'
      ? plan.savingsLabel
      : plan.planTier === 'deeper'
        ? FALLBACK_PLAN_COPY.deeper_yearly.savingsLabel
        : FALLBACK_PLAN_COPY.paid_yearly.savingsLabel;
  return getCompactYearlySavingsBadge(yearlySavings);
}

function formatPlanFromIos(product: ProductSubscription): StoreSubscriptionPlan | null {
  if (product.id === subscriptionConfig.applePremiumMonthlyProductId) {
    return buildStorePlan('paid_monthly', product.id, product.displayPrice);
  }
  if (product.id === subscriptionConfig.applePremiumYearlyProductId) {
    return buildStorePlan('paid_yearly', product.id, product.displayPrice);
  }
  if (product.id === subscriptionConfig.appleDeeperMonthlyProductId) {
    return buildStorePlan('deeper_monthly', product.id, product.displayPrice);
  }
  if (product.id === subscriptionConfig.appleDeeperYearlyProductId) {
    return buildStorePlan('deeper_yearly', product.id, product.displayPrice);
  }

  return null;
}

function formatPlansFromAndroid(product: ProductSubscription): StoreSubscriptionPlan[] {
  const offers = product.subscriptionOffers ?? [];
  const isPremiumProduct = product.id === subscriptionConfig.googlePremiumSubscriptionProductId;
  const isDeeperProduct = product.id === subscriptionConfig.googleDeeperSubscriptionProductId;

  const plans: Array<StoreSubscriptionPlan | null> = offers.map((offer) => {
    if (offer.basePlanIdAndroid === subscriptionConfig.googleMonthlyBasePlanId) {
      if (isPremiumProduct) {
        return buildStorePlan('paid_monthly', product.id, offer.displayPrice, offer.offerTokenAndroid);
      }
      if (isDeeperProduct) {
        return buildStorePlan('deeper_monthly', product.id, offer.displayPrice, offer.offerTokenAndroid);
      }
    }

    if (offer.basePlanIdAndroid === subscriptionConfig.googleYearlyBasePlanId) {
      if (isPremiumProduct) {
        return buildStorePlan('paid_yearly', product.id, offer.displayPrice, offer.offerTokenAndroid);
      }
      if (isDeeperProduct) {
        return buildStorePlan('deeper_yearly', product.id, offer.displayPrice, offer.offerTokenAndroid);
      }
    }

    return null;
  });

  return plans.filter((plan): plan is StoreSubscriptionPlan => plan != null);
}

function sortStorePlans(plans: StoreSubscriptionPlan[]): StoreSubscriptionPlan[] {
  const order: Record<StoreSubscriptionPlan['planCode'], number> = {
    paid_monthly: 0,
    paid_yearly: 1,
    deeper_monthly: 2,
    deeper_yearly: 3,
  };

  return [...plans].sort((left, right) => order[left.planCode] - order[right.planCode]);
}

export function getStorePlanOptions(products: ProductSubscription[]): StoreSubscriptionPlan[] {
  const storePlans =
    Platform.OS === 'ios'
      ? products
          .map((product) => formatPlanFromIos(product))
          .filter((plan): plan is StoreSubscriptionPlan => !!plan)
      : products
          .filter((product) =>
            [subscriptionConfig.googlePremiumSubscriptionProductId, subscriptionConfig.googleDeeperSubscriptionProductId].includes(product.id)
          )
          .flatMap((product) => formatPlansFromAndroid(product));

  if (storePlans.length > 0) return sortStorePlans(storePlans);

  return sortStorePlans([
    getFallbackPlan('paid_monthly'),
    getFallbackPlan('paid_yearly'),
    getFallbackPlan('deeper_monthly'),
    getFallbackPlan('deeper_yearly'),
  ]);
}

export function getPaidPlanOptionsForInterval(
  products: StoreSubscriptionPlan[],
  interval: BillingInterval
): [StoreSubscriptionPlan, StoreSubscriptionPlan] {
  const premiumCode = getTargetPlanForTierInterval('premium', interval);
  const deeperCode = getTargetPlanForTierInterval('deeper', interval);

  return [
    products.find((product) => product.planCode === premiumCode) ?? getFallbackPlan(premiumCode),
    products.find((product) => product.planCode === deeperCode) ?? getFallbackPlan(deeperCode),
  ];
}

export async function fetchSubscriptionStatus(): Promise<SubscriptionStatus> {
  const { data, error } = await supabase.functions.invoke('subscription-status', {
    method: 'GET',
  });

  if (error) throw error;
  return normalizeSubscriptionStatus(data as RawSubscriptionStatus);
}

export async function registerApplePurchase(signedTransactionInfo: string) {
  const { data, error } = await supabase.functions.invoke('billing-register-purchase', {
    body: {
      provider: 'apple',
      signedTransactionInfo,
    },
  });

  if (error) throw error;
  return data;
}

export async function registerGooglePurchase(purchaseToken: string) {
  const { data, error } = await supabase.functions.invoke('billing-register-purchase', {
    body: {
      provider: 'google',
      purchaseToken,
      packageName: subscriptionConfig.androidPackageName,
    },
  });

  if (error) throw error;
  return data;
}

export async function invokeAiEntitlementsGateway<T = Record<string, unknown>>(body: AiGatewayRequest): Promise<T> {
  const startedAt = Date.now();
  logInfo('ai_gateway_invoke_start', {
    action: body.action,
    hasDreamId: Boolean(body.dreamId),
    hasInterpretationId: Boolean(body.interpretationId),
  });

  const { data, error } = await supabase.functions.invoke('ai-entitlements-gateway', {
    body,
  });

  if (error) {
    const context = (error as { context?: Response }).context;
    let details: unknown = null;
    if (context && typeof (context as Response).json === 'function') {
      try {
        details = await (context as Response).clone().json();
      } catch {
        try {
          details = await (context as Response).clone().text();
        } catch {
          details = null;
        }
      }
    }

    const errorField =
      details && typeof details === 'object' && details !== null && 'error' in details
        ? (details as { error: unknown }).error
        : null;
    const serverMessage =
      typeof errorField === 'string'
        ? errorField
        : errorField && typeof errorField === 'object' && typeof (errorField as { message?: unknown }).message === 'string'
          ? (errorField as { message: string }).message
          : null;
    const failureCode =
      errorField && typeof errorField === 'object' && typeof (errorField as { code?: unknown }).code === 'string'
        ? (errorField as { code: string }).code
        : details && typeof details === 'object' && typeof (details as { details?: { failureCode?: unknown } }).details?.failureCode === 'string'
          ? ((details as { details: { failureCode: string } }).details.failureCode)
          : null;
    const nestedFromError =
      errorField && typeof errorField === 'object' && typeof (errorField as { details?: unknown }).details === 'object'
        ? ((errorField as { details: Record<string, unknown> }).details ?? null)
        : null;
    const nestedFromBody =
      details && typeof details === 'object' && typeof (details as { details?: unknown }).details === 'object'
        ? ((details as { details: Record<string, unknown> }).details ?? null)
        : null;
    const topLevelDetails =
      details &&
      typeof details === 'object' &&
      details !== null &&
      (typeof (details as { failureCode?: unknown }).failureCode === 'string' ||
        typeof (details as { contentLength?: unknown }).contentLength === 'number' ||
        typeof (details as { looksTruncated?: unknown }).looksTruncated === 'boolean' ||
        typeof (details as { upstreamMessage?: unknown }).upstreamMessage === 'string' ||
        Array.isArray((details as { schemaErrors?: unknown }).schemaErrors))
        ? (details as Record<string, unknown>)
        : null;
    const diagnostic = nestedFromError ?? nestedFromBody ?? topLevelDetails;

    const durationMs = Date.now() - startedAt;
    console.error('[ai-entitlements-gateway] invoke failed', {
      message: error.message,
      serverMessage,
      failureCode,
      looksTruncated: diagnostic?.looksTruncated ?? null,
      contentLength: diagnostic?.contentLength ?? null,
      finishReason: diagnostic?.finishReason ?? null,
      schemaErrorCount: diagnostic?.schemaErrorCount ?? null,
      schemaErrors: Array.isArray(diagnostic?.schemaErrors) ? diagnostic.schemaErrors.slice(0, 8) : null,
      model: diagnostic?.model ?? null,
      provider: diagnostic?.provider ?? null,
      promptVersion: diagnostic?.promptVersion ?? null,
      action: body.action,
      durationMs,
    });
    logError('ai_gateway_invoke_failed', error, {
      action: body.action,
      serverMessage,
      failureCode,
      looksTruncated: diagnostic?.looksTruncated ?? null,
      contentLength: diagnostic?.contentLength ?? null,
      finishReason: diagnostic?.finishReason ?? null,
      schemaErrorCount: diagnostic?.schemaErrorCount ?? null,
      model: diagnostic?.model ?? null,
      durationMs,
    });

    if (serverMessage) {
      throw new Error(serverMessage);
    }
    throw error;
  }

  logInfo('ai_gateway_invoke_success', {
    action: body.action,
    status: typeof data === 'object' && data !== null && 'status' in data ? (data as { status?: unknown }).status : undefined,
    durationMs: Date.now() - startedAt,
    hasInterpretation:
      typeof data === 'object' && data !== null && 'interpretation' in data && Boolean((data as { interpretation?: unknown }).interpretation),
    metadataStatus:
      typeof data === 'object' && data !== null && 'metadata_status' in data
        ? (data as { metadata_status?: unknown }).metadata_status
        : undefined,
  });

  return data as T;
}

export function getFreePlanCardModel(): FreePlanCardModel {
  return {
    title: getPlanTitle('free'),
    productId: 'free',
    planCode: 'free' as const,
    planTier: 'free' as const,
    billingInterval: 'monthly',
    displayPrice: FALLBACK_PLAN_COPY.free.displayPrice,
    totalPriceLabel: FALLBACK_PLAN_COPY.free.totalPriceLabel,
    compareAtPriceLabel: null,
    monthlyEquivalentLabel: null,
    savingsLabel: null,
    trialLabel: null,
  };
}

export function getFallbackPlan(planCode: PaidPlanCode): StoreSubscriptionPlan {
  const productIdByPlan: Record<PaidPlanCode, string> = {
    paid_monthly:
      Platform.OS === 'ios'
        ? subscriptionConfig.applePremiumMonthlyProductId
        : subscriptionConfig.googlePremiumSubscriptionProductId,
    paid_yearly:
      Platform.OS === 'ios'
        ? subscriptionConfig.applePremiumYearlyProductId
        : subscriptionConfig.googlePremiumSubscriptionProductId,
    deeper_monthly:
      Platform.OS === 'ios'
        ? subscriptionConfig.appleDeeperMonthlyProductId
        : subscriptionConfig.googleDeeperSubscriptionProductId,
    deeper_yearly:
      Platform.OS === 'ios'
        ? subscriptionConfig.appleDeeperYearlyProductId
        : subscriptionConfig.googleDeeperSubscriptionProductId,
  };

  return buildStorePlan(planCode, productIdByPlan[planCode]);
}

export function getPurchaseRequest(plan: StoreSubscriptionPlan, accountIdentifiers: SubscriptionStatus) {
  const obfuscatedAccountId = accountIdentifiers.googleObfuscatedAccountId ?? undefined;
  const appAccountToken = accountIdentifiers.appAccountToken ?? undefined;

  return {
    request: {
      apple: {
        sku: plan.productId,
        appAccountToken,
      },
      google: {
        skus: [plan.productId],
        obfuscatedAccountId,
        subscriptionOffers: plan.offerTokenAndroid
          ? [{ sku: plan.productId, offerToken: plan.offerTokenAndroid }]
          : undefined,
      },
    },
    type: 'subs' as const,
  };
}

export function getReadOnlyLapseMessage() {
  return 'Your paid access has lapsed. Existing paid reflections stay readable, but new paid actions are locked until renewal.';
}

export function getQuotaLabel(value: number | null): string {
  if (value == null) return 'Unlimited';
  return String(value);
}

export function isPaidPlan(
  planCode: PlanCode
): planCode is Extract<PlanCode, 'paid_monthly' | 'paid_yearly' | 'deeper_monthly' | 'deeper_yearly'> {
  return planCode !== 'free';
}
