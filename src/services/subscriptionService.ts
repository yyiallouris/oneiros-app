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

const GENERIC_TRIAL_LABEL = 'Free trial for eligible subscribers';
const PRICE_UNAVAILABLE_LABEL = 'Price unavailable';

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
    displayPrice: PRICE_UNAVAILABLE_LABEL,
    totalPriceLabel: 'Current store price unavailable',
    compareAtPriceLabel: null,
    monthlyEquivalentLabel: null,
    savingsLabel: null,
    trialLabel: null,
  },
  paid_yearly: {
    billingInterval: 'yearly',
    displayPrice: PRICE_UNAVAILABLE_LABEL,
    totalPriceLabel: 'Current store price unavailable',
    compareAtPriceLabel: null,
    monthlyEquivalentLabel: null,
    savingsLabel: null,
    trialLabel: null,
  },
  deeper_monthly: {
    billingInterval: 'monthly',
    displayPrice: PRICE_UNAVAILABLE_LABEL,
    totalPriceLabel: 'Current store price unavailable',
    compareAtPriceLabel: null,
    monthlyEquivalentLabel: null,
    savingsLabel: null,
    trialLabel: null,
  },
  deeper_yearly: {
    billingInterval: 'yearly',
    displayPrice: PRICE_UNAVAILABLE_LABEL,
    totalPriceLabel: 'Current store price unavailable',
    compareAtPriceLabel: null,
    monthlyEquivalentLabel: null,
    savingsLabel: null,
    trialLabel: null,
  },
};

export const FREE_PLAN_FEATURES: SubscriptionFeatureRow[] = [
  { label: 'Unlimited dream entries', included: true, emphasis: true },
  { label: '1 reflection every 7 days', included: true },
  { label: '5 follow-up replies on that free reflection', included: true },
  { label: 'Recent Dream Field reports', included: false },
  { label: 'Monthly or weekly period reflections', included: false },
  { label: 'Paid regenerate and premium continuity', included: false },
];

export const PREMIUM_PLAN_FEATURES: SubscriptionFeatureRow[] = [
  { label: '35 symbolic reflections each month', included: true, emphasis: true },
  { label: 'Oneiros deep pattern recognition', included: true },
  { label: '10 Recent Dream Field reports each month', included: true },
  { label: '1 monthly period reflection', included: true },
  { label: 'Up to 5 follow-up exchanges with each reflected dream', included: true },
  { label: '7-day free trial when eligible', included: true },
];

export const DEEPER_PLAN_FEATURES: SubscriptionFeatureRow[] = [
  { label: '80 symbolic reflections each month', included: true, emphasis: true },
  { label: 'Oneiros deep pattern recognition', included: true },
  { label: 'Unlimited Recent Dream Field reports', included: true },
  { label: '1 period reflection each week', included: true },
  { label: 'Up to 5 follow-up exchanges with each reflected dream', included: true },
  { label: '7-day free trial when eligible', included: true },
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
    case 'paid_yearly':
      return 'Premium';
    case 'deeper_monthly':
    case 'deeper_yearly':
      return 'Deeper';
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
        title: 'Period reflections and long-form patterns',
        body: 'Premium includes one monthly period reflection. Deeper opens a weekly period reflection for people who want to stay closer to the material.',
      };
    case 'onboarding':
      return {
        title: 'Choose your rhythm',
        body: 'Free stays grounded. Premium is the recommended path. Deeper opens a more serious monthly cadence without turning the screen into a conversion trick.',
      };
    case 'account':
      return {
        title: 'Choose your paid depth',
        body: 'Premium is the clear default. Deeper is there when you want more reflections, weekly period reflections, and unlimited recent-field reports.',
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

type StorePriceInput = {
  displayPrice: string;
  priceAmount: number | null;
  currencyCode: string | null;
  trialLabel?: string | null;
  offerTokenAndroid?: string | null;
};

function isPositiveFinitePrice(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

function normalizeCurrencyCode(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toUpperCase();
  return /^[A-Z]{3}$/.test(normalized) ? normalized : null;
}

function formatFreeTrialLabel(
  period: { unit: string; value: number } | null | undefined,
  periodCount = 1
): string {
  if (
    !period ||
    !Number.isInteger(period.value) ||
    period.value <= 0 ||
    !Number.isInteger(periodCount) ||
    periodCount <= 0
  ) {
    return GENERIC_TRIAL_LABEL;
  }

  const totalUnits = period.value * periodCount;
  if (period.unit === 'week' && totalUnits === 1) {
    return '7-day free trial for eligible subscribers';
  }
  if (!['day', 'week', 'month', 'year'].includes(period.unit)) {
    return GENERIC_TRIAL_LABEL;
  }

  return `${totalUnits}-${period.unit} free trial for eligible subscribers`;
}

function parseAndroidBillingPeriod(period: string | null | undefined): {
  unit: string;
  value: number;
} | null {
  const match = /^P(\d+)([DWMY])$/.exec(period ?? '');
  if (!match) return null;
  const unitBySymbol: Record<string, string> = {
    D: 'day',
    W: 'week',
    M: 'month',
    Y: 'year',
  };
  return {
    value: Number(match[1]),
    unit: unitBySymbol[match[2]],
  };
}

/**
 * Format arithmetic-only price breakdowns. Store-provided displayPrice remains
 * the source of truth for the actual amount charged.
 */
function formatDerivedCurrencyAmount(value: number, currencyCode: string): string | null {
  if (!Number.isFinite(value) || value < 0) return null;
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currencyCode,
    }).format(value);
  } catch {
    return null;
  }
}

function buildStorePlan(
  planCode: PaidPlanCode,
  productId: string,
  storePrice?: StorePriceInput | null
): StoreSubscriptionPlan {
  const fallback = FALLBACK_PLAN_COPY[planCode];
  const displayPrice = storePrice?.displayPrice?.trim();
  const storePriceAvailable = Boolean(displayPrice);
  return {
    title: getPlanTitle(planCode),
    productId,
    planCode,
    planTier: getPlanTierForPaidCode(planCode),
    billingInterval: fallback.billingInterval,
    storePriceAvailable,
    priceAmount: isPositiveFinitePrice(storePrice?.priceAmount) ? storePrice.priceAmount : null,
    currencyCode: normalizeCurrencyCode(storePrice?.currencyCode),
    displayPrice: displayPrice || fallback.displayPrice,
    totalPriceLabel: storePriceAvailable
      ? fallback.billingInterval === 'yearly'
        ? 'Billed once a year'
        : 'Billed monthly'
      : fallback.totalPriceLabel,
    compareAtPriceLabel: fallback.compareAtPriceLabel,
    monthlyEquivalentLabel: fallback.monthlyEquivalentLabel,
    savingsLabel: fallback.savingsLabel,
    trialLabel: storePriceAvailable ? storePrice?.trialLabel ?? null : null,
    offerTokenAndroid: storePrice?.offerTokenAndroid ?? null,
  };
}

function addLocalizedYearlyBreakdowns(plans: StoreSubscriptionPlan[]): StoreSubscriptionPlan[] {
  const pairings: Array<{
    monthlyCode: PaidPlanCode;
    yearlyCode: PaidPlanCode;
  }> = [
    { monthlyCode: 'paid_monthly', yearlyCode: 'paid_yearly' },
    { monthlyCode: 'deeper_monthly', yearlyCode: 'deeper_yearly' },
  ];
  const updatedByCode = new Map(plans.map((plan) => [plan.planCode, plan]));

  for (const { monthlyCode, yearlyCode } of pairings) {
    const monthly = updatedByCode.get(monthlyCode);
    const yearly = updatedByCode.get(yearlyCode);
    if (
      !monthly?.storePriceAvailable ||
      !yearly?.storePriceAvailable ||
      !isPositiveFinitePrice(monthly.priceAmount) ||
      !isPositiveFinitePrice(yearly.priceAmount) ||
      !monthly.currencyCode ||
      monthly.currencyCode !== yearly.currencyCode
    ) {
      continue;
    }

    const monthlyEquivalent = formatDerivedCurrencyAmount(
      yearly.priceAmount / 12,
      yearly.currencyCode
    );
    const yearlySavingsAmount = monthly.priceAmount * 12 - yearly.priceAmount;
    const savings =
      yearlySavingsAmount > 0
        ? formatDerivedCurrencyAmount(yearlySavingsAmount, yearly.currencyCode)
        : null;

    updatedByCode.set(yearlyCode, {
      ...yearly,
      compareAtPriceLabel: monthly.displayPrice,
      monthlyEquivalentLabel: monthlyEquivalent
        ? `Equivalent to ${monthlyEquivalent} / month`
        : null,
      savingsLabel: savings ? `Save ${savings} / year` : null,
    });
  }

  return plans.map((plan) => updatedByCode.get(plan.planCode) ?? plan);
}

/** Card pricing presentation: the exact store billing total remains the primary price. */
export function getPaidPlanCardPricing(
  plan: StoreSubscriptionPlan,
  options?: { loading?: boolean }
): {
  price: string;
  compareAtPrice: string | null;
  priceDetail: string;
  secondaryPriceDetail: string | null;
} {
  if (!plan.storePriceAvailable) {
    return {
      price: options?.loading ? 'Checking price…' : PRICE_UNAVAILABLE_LABEL,
      compareAtPrice: null,
      priceDetail: options?.loading
        ? 'Connecting to the store'
        : 'Try again when the store is available',
      secondaryPriceDetail: null,
    };
  }

  if (plan.billingInterval === 'yearly') {
    return {
      // Apple requires the full amount charged to be the most prominent price.
      price: plan.displayPrice,
      compareAtPrice: null,
      priceDetail: plan.totalPriceLabel,
      secondaryPriceDetail: [plan.monthlyEquivalentLabel, plan.savingsLabel]
        .filter((label): label is string => Boolean(label))
        .join(' · ') || null,
    };
  }

  return {
    price: plan.displayPrice,
    compareAtPrice: null,
    priceDetail: plan.totalPriceLabel,
    secondaryPriceDetail: null,
  };
}

/** Compact Yearly switch badge: "Save $12.00 / year" → "Save $12". */
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
  products: StoreSubscriptionPlan[];
  includesFreeCard?: boolean;
}): string | null {
  const includesFreeCard = params.includesFreeCard !== false;
  const paidIndex = includesFreeCard ? params.activeCardIndex - 1 : params.activeCardIndex;
  const yearlyCode: PaidPlanCode = paidIndex >= 1 ? 'deeper_yearly' : 'paid_yearly';
  const yearlyPlan = params.products.find((plan) => plan.planCode === yearlyCode);
  return getCompactYearlySavingsBadge(yearlyPlan?.savingsLabel);
}

function formatPlanFromIos(product: ProductSubscription): StoreSubscriptionPlan | null {
  const freeIntroductoryOffer = (product.subscriptionOffers ?? []).find(
    (offer) =>
      offer.type === 'introductory' &&
      (offer.paymentMode === 'free-trial' || offer.price === 0)
  );
  const storePrice: StorePriceInput = {
    displayPrice: product.displayPrice,
    priceAmount: product.price ?? null,
    currencyCode: product.currency,
    trialLabel: freeIntroductoryOffer
      ? formatFreeTrialLabel(
          freeIntroductoryOffer.period,
          freeIntroductoryOffer.periodCount ?? 1
        )
      : null,
  };
  if (product.id === subscriptionConfig.applePremiumMonthlyProductId) {
    return buildStorePlan('paid_monthly', product.id, storePrice);
  }
  if (product.id === subscriptionConfig.applePremiumYearlyProductId) {
    return buildStorePlan('paid_yearly', product.id, storePrice);
  }
  if (product.id === subscriptionConfig.appleDeeperMonthlyProductId) {
    return buildStorePlan('deeper_monthly', product.id, storePrice);
  }
  if (product.id === subscriptionConfig.appleDeeperYearlyProductId) {
    return buildStorePlan('deeper_yearly', product.id, storePrice);
  }

  return null;
}

function formatPlansFromAndroid(product: ProductSubscription): StoreSubscriptionPlan[] {
  const offers = product.subscriptionOffers ?? [];
  const isPremiumProduct = product.id === subscriptionConfig.googlePremiumSubscriptionProductId;
  const isDeeperProduct = product.id === subscriptionConfig.googleDeeperSubscriptionProductId;

  const plans: Array<StoreSubscriptionPlan | null> = offers.map((offer) => {
    const phases = offer.pricingPhasesAndroid?.pricingPhaseList ?? [];
    const freeTrialPhase = phases.find((phase) => Number(phase.priceAmountMicros) === 0);
    const recurringPhase =
      [...phases].reverse().find((phase) => phase.recurrenceMode === 1) ?? phases.at(-1);
    const recurringMicros = recurringPhase
      ? Number(recurringPhase.priceAmountMicros) / 1_000_000
      : null;
    const storePrice: StorePriceInput = {
      // Never advertise a zero-cost trial phase as the renewal price.
      displayPrice: recurringPhase?.formattedPrice || offer.displayPrice,
      priceAmount: isPositiveFinitePrice(recurringMicros) ? recurringMicros : offer.price,
      currencyCode: recurringPhase?.priceCurrencyCode || offer.currency || product.currency,
      trialLabel: freeTrialPhase
        ? formatFreeTrialLabel(
            parseAndroidBillingPeriod(freeTrialPhase.billingPeriod),
            freeTrialPhase.billingCycleCount || 1
          )
        : null,
      offerTokenAndroid: offer.offerTokenAndroid,
    };
    if (offer.basePlanIdAndroid === subscriptionConfig.googleMonthlyBasePlanId) {
      if (isPremiumProduct) {
        return buildStorePlan('paid_monthly', product.id, storePrice);
      }
      if (isDeeperProduct) {
        return buildStorePlan('deeper_monthly', product.id, storePrice);
      }
    }

    if (offer.basePlanIdAndroid === subscriptionConfig.googleYearlyBasePlanId) {
      if (isPremiumProduct) {
        return buildStorePlan('paid_yearly', product.id, storePrice);
      }
      if (isDeeperProduct) {
        return buildStorePlan('deeper_yearly', product.id, storePrice);
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

export function getStorePlanOptions(
  products: ProductSubscription[],
  platform: 'ios' | 'android' = Platform.OS === 'ios' ? 'ios' : 'android'
): StoreSubscriptionPlan[] {
  const storePlans =
    platform === 'ios'
      ? products
          .map((product) => formatPlanFromIos(product))
          .filter((plan): plan is StoreSubscriptionPlan => !!plan)
      : products
          .filter((product) =>
            [subscriptionConfig.googlePremiumSubscriptionProductId, subscriptionConfig.googleDeeperSubscriptionProductId].includes(product.id)
          )
          .flatMap((product) => formatPlansFromAndroid(product));

  const unavailablePlans = [
    getFallbackPlan('paid_monthly'),
    getFallbackPlan('paid_yearly'),
    getFallbackPlan('deeper_monthly'),
    getFallbackPlan('deeper_yearly'),
  ];
  const storePlanByCode = new Map<string, StoreSubscriptionPlan>();
  for (const plan of storePlans) {
    // Preserve the first eligible offer token for a base plan while avoiding
    // duplicate cards when Google returns multiple offers for the same plan.
    const existing = storePlanByCode.get(plan.planCode);
    if (!existing || (!existing.trialLabel && plan.trialLabel)) {
      storePlanByCode.set(plan.planCode, plan);
    }
  }

  const completePlans = unavailablePlans.map(
    (fallback) => storePlanByCode.get(fallback.planCode) ?? fallback
  );
  return sortStorePlans(addLocalizedYearlyBreakdowns(completePlans));
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

  return buildStorePlan(planCode, productIdByPlan[planCode], null);
}

export function isStorePlanPurchasable(
  plan: StoreSubscriptionPlan | null | undefined
): plan is StoreSubscriptionPlan {
  return Boolean(plan?.storePriceAvailable && plan.productId && plan.productId !== 'free');
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
