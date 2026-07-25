import Constants from 'expo-constants';
import { Platform } from 'react-native';
import type { ProductSubscription } from 'expo-iap';
import { hasPaidAccess } from '../billing/policy';
import type { GatewayAction, PlanCode } from '../billing/types';
import { logError, logInfo } from './logger';
import { supabase } from './supabaseClient';
import type {
  AiGatewayRequest,
  BillingInterval,
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
  entitlement_state?: SubscriptionStatus['entitlementState'];
  current_period_start?: string | null;
  current_period_end?: string | null;
  app_account_token?: string | null;
  google_obfuscated_account_id?: string | null;
  quotas?: {
    dream_reflections?: RawQuota;
    recent_dream_field?: RawQuota;
  };
};

const extras =
  Constants.expoConfig?.extra ??
  (Constants.manifest as Record<string, unknown> | undefined)?.extra ??
  {};

type SubscriptionConfig = {
  appleMonthlyProductId: string;
  appleYearlyProductId: string;
  googleSubscriptionProductId: string;
  googleMonthlyBasePlanId: string;
  googleYearlyBasePlanId: string;
  androidPackageName: string;
};

type FallbackPlanCopy = Pick<
  StoreSubscriptionPlan,
  'billingInterval' | 'displayPrice' | 'totalPriceLabel' | 'monthlyEquivalentLabel' | 'savingsLabel'
>;

export const subscriptionConfig: SubscriptionConfig = {
  appleMonthlyProductId: String(extras.appleSubscriptionMonthlyProductId ?? 'oneiros_premium_monthly'),
  appleYearlyProductId: String(extras.appleSubscriptionYearlyProductId ?? 'oneiros_premium_yearly'),
  googleSubscriptionProductId: String(extras.googleSubscriptionProductId ?? 'oneiros_premium'),
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
    monthlyEquivalentLabel: null,
    savingsLabel: null,
  },
  paid_monthly: {
    billingInterval: 'monthly',
    displayPrice: '€4.99 / month',
    totalPriceLabel: 'Billed monthly',
    monthlyEquivalentLabel: null,
    savingsLabel: null,
  },
  paid_yearly: {
    billingInterval: 'yearly',
    displayPrice: '€47.88 / year',
    totalPriceLabel: '€47.88 billed yearly',
    monthlyEquivalentLabel: '€3.99 / month',
    savingsLabel: 'Save €12 / year',
  },
};

export const FREE_PLAN_FEATURES: SubscriptionFeatureRow[] = [
  { label: 'Unlimited dream entries', included: true, emphasis: true },
  { label: '1 reflection every 7 days', included: true },
  { label: '5 follow-up replies on that free reflection', included: true },
  { label: 'Recent Dream Field', included: false },
  { label: 'Period reflections and archived reports', included: false },
  { label: 'Paid regenerate and premium follow-up continuity', included: false },
];

export const PREMIUM_PLAN_FEATURES: SubscriptionFeatureRow[] = [
  { label: 'Unlimited dream entries', included: true },
  { label: '60 reflections each billing cycle', included: true, emphasis: true },
  { label: '5 follow-up replies per reflected dream', included: true },
  { label: 'Recent Dream Field: 10 per billing cycle', included: true },
  { label: 'Current-month and archived period reflections', included: true },
  { label: 'Insights, reports, and premium re-generations', included: true },
];

export function getPlanTitle(planCode: PlanCode): string {
  switch (planCode) {
    case 'paid_monthly':
      return 'Premium Monthly';
    case 'paid_yearly':
      return 'Premium Yearly';
    default:
      return 'Free';
  }
}

export function getPremiumSourceCopy(source: PremiumGateSource): { title: string; body: string } {
  switch (source) {
    case 'followup':
      return {
        title: 'Premium follow-up',
        body: 'This deeper conversation belongs to Premium. Upgrade to keep exploring a reflected dream with follow-up replies.',
      };
    case 'regenerate':
      return {
        title: 'Premium regenerate',
        body: 'Full regenerate and premium reflection updates are part of Premium, so the quota and read-only rules stay clear.',
      };
    case 'recent_field':
      return {
        title: 'Recent Dream Field',
        body: 'Recent Dream Field is a Premium insight. Unlock up to 10 recent-field generations each billing cycle.',
      };
    case 'period_reflection':
      return {
        title: 'Period reflection',
        body: 'Month-to-date and archived period reflections live in Premium, with clean cadence rules and stored reports.',
      };
    case 'onboarding':
      return {
        title: 'Choose your rhythm',
        body: 'Start free or unlock the full Oneiros mode now. Pricing stays clear and you can manage it later from Subscription.',
      };
    case 'account':
      return {
        title: 'Oneiros Premium',
        body: 'Upgrade to unlock full reflections, follow-ups, insights, and reports across the app.',
      };
    case 'subscription':
      return {
        title: 'Oneiros Premium',
        body: 'Compare plans, check your quotas, restore purchases, and manage renewal from one clear place.',
      };
    default:
      return {
        title: 'Premium feature',
        body: 'This space is part of Oneiros Premium. Upgrade to unlock the full reflective flow.',
      };
  }
}

export function getTargetPlanForInterval(interval: BillingInterval): Extract<PlanCode, 'paid_monthly' | 'paid_yearly'> {
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
  const entitlementState = raw?.entitlement_state ?? 'inactive';
  const currentPeriodEnd = raw?.current_period_end ?? null;

  return {
    planCode,
    entitlementState,
    currentPeriodStart: raw?.current_period_start ?? null,
    currentPeriodEnd,
    appAccountToken: raw?.app_account_token ?? null,
    googleObfuscatedAccountId: raw?.google_obfuscated_account_id ?? null,
    quotas: {
      dreamReflections: normalizeQuota(raw?.quotas?.dream_reflections),
      recentDreamField: normalizeQuota(raw?.quotas?.recent_dream_field),
    },
    hasPaidAccess: hasPaidAccess({
      planCode,
      entitlementState,
      currentPeriodEnd,
    }),
  };
}

function formatPlanFromIos(product: ProductSubscription): StoreSubscriptionPlan | null {
  if (product.id === subscriptionConfig.appleMonthlyProductId) {
    return {
      planCode: 'paid_monthly',
      billingInterval: 'monthly',
      productId: product.id,
      displayPrice: product.displayPrice,
      totalPriceLabel: 'Billed monthly',
      monthlyEquivalentLabel: null,
      savingsLabel: null,
      title: getPlanTitle('paid_monthly'),
    };
  }

  if (product.id === subscriptionConfig.appleYearlyProductId) {
    return {
      planCode: 'paid_yearly',
      billingInterval: 'yearly',
      productId: product.id,
      displayPrice: product.displayPrice,
      totalPriceLabel: product.displayPrice,
      monthlyEquivalentLabel: FALLBACK_PLAN_COPY.paid_yearly.monthlyEquivalentLabel,
      savingsLabel: FALLBACK_PLAN_COPY.paid_yearly.savingsLabel,
      title: getPlanTitle('paid_yearly'),
    };
  }

  return null;
}

function formatPlansFromAndroid(product: ProductSubscription): StoreSubscriptionPlan[] {
  const offers = product.subscriptionOffers ?? [];
  const plans: Array<StoreSubscriptionPlan | null> = offers.map((offer) => {
      if (offer.basePlanIdAndroid === subscriptionConfig.googleMonthlyBasePlanId) {
        return {
          planCode: 'paid_monthly' as const,
          billingInterval: 'monthly' as const,
          productId: product.id,
          displayPrice: offer.displayPrice || FALLBACK_PLAN_COPY.paid_monthly.displayPrice,
          totalPriceLabel: 'Billed monthly',
          monthlyEquivalentLabel: null,
          savingsLabel: null,
          offerTokenAndroid: offer.offerTokenAndroid,
          title: getPlanTitle('paid_monthly'),
        };
      }

      if (offer.basePlanIdAndroid === subscriptionConfig.googleYearlyBasePlanId) {
        return {
          planCode: 'paid_yearly' as const,
          billingInterval: 'yearly' as const,
          productId: product.id,
          displayPrice: offer.displayPrice || FALLBACK_PLAN_COPY.paid_yearly.displayPrice,
          totalPriceLabel: FALLBACK_PLAN_COPY.paid_yearly.totalPriceLabel,
          monthlyEquivalentLabel: FALLBACK_PLAN_COPY.paid_yearly.monthlyEquivalentLabel,
          savingsLabel: FALLBACK_PLAN_COPY.paid_yearly.savingsLabel,
          offerTokenAndroid: offer.offerTokenAndroid,
          title: getPlanTitle('paid_yearly'),
        };
      }

      return null;
    });

  return plans.filter((plan): plan is StoreSubscriptionPlan => plan != null);
}

export function getStorePlanOptions(products: ProductSubscription[]): StoreSubscriptionPlan[] {
  const storePlans =
    Platform.OS === 'ios'
      ? products
          .map((product) => formatPlanFromIos(product))
          .filter((plan): plan is StoreSubscriptionPlan => !!plan)
      : products
          .filter((product) => product.id === subscriptionConfig.googleSubscriptionProductId)
          .flatMap((product) => formatPlansFromAndroid(product));

  if (storePlans.length > 0) return storePlans;

  return [
    {
      productId:
        Platform.OS === 'ios'
          ? subscriptionConfig.appleMonthlyProductId
          : subscriptionConfig.googleSubscriptionProductId,
      title: getPlanTitle('paid_monthly'),
      planCode: 'paid_monthly',
      ...FALLBACK_PLAN_COPY.paid_monthly,
      offerTokenAndroid: null,
    },
    {
      productId:
        Platform.OS === 'ios'
          ? subscriptionConfig.appleYearlyProductId
          : subscriptionConfig.googleSubscriptionProductId,
      title: getPlanTitle('paid_yearly'),
      planCode: 'paid_yearly',
      ...FALLBACK_PLAN_COPY.paid_yearly,
      offerTokenAndroid: null,
    },
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
    // Gateway may put the diagnostic bag at top-level `details` when `error` is a string.
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

export function getFreePlanCardModel() {
  return {
    title: getPlanTitle('free'),
    productId: 'free',
    planCode: 'free' as const,
    ...FALLBACK_PLAN_COPY.free,
  };
}

export function getFallbackPlan(planCode: Extract<PlanCode, 'paid_monthly' | 'paid_yearly'>): StoreSubscriptionPlan {
  const fallback = FALLBACK_PLAN_COPY[planCode];
  return {
    title: getPlanTitle(planCode),
    productId:
      planCode === 'paid_yearly'
        ? Platform.OS === 'ios'
          ? subscriptionConfig.appleYearlyProductId
          : subscriptionConfig.googleSubscriptionProductId
        : Platform.OS === 'ios'
          ? subscriptionConfig.appleMonthlyProductId
          : subscriptionConfig.googleSubscriptionProductId,
    planCode,
    ...fallback,
    offerTokenAndroid: null,
  };
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
  return 'Your premium access has lapsed. Existing premium reflections stay readable, but new premium actions are locked until renewal.';
}

export function getQuotaLabel(value: number | null): string {
  if (value == null) return 'Unlimited';
  return String(value);
}

export function isPaidPlan(planCode: PlanCode): planCode is Extract<PlanCode, 'paid_monthly' | 'paid_yearly'> {
  return planCode === 'paid_monthly' || planCode === 'paid_yearly';
}
