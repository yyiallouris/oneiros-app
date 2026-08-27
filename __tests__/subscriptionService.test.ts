import {
  getCompactYearlySavingsBadge,
  getFallbackPlan,
  getIapUnavailableMessage,
  getPaidPlanCardPricing,
  getPremiumSourceCopy,
  getReadOnlyLapseMessage,
  getStorePlanOptions,
  getYearlySavingsBadgeForVisibleCard,
  isMissingNativeIapError,
  isStorePlanPurchasable,
  normalizeSubscriptionStatus,
  subscriptionConfig,
} from '../src/services/subscriptionService';
import type { ProductSubscription } from 'expo-iap';

function iosProduct(
  id: string,
  displayPrice: string,
  price: number | null,
  currency = 'USD'
): ProductSubscription {
  return {
    id,
    displayPrice,
    price,
    currency,
    platform: 'ios',
    type: 'subs',
    title: id,
    description: '',
  } as ProductSubscription;
}

describe('subscription service', () => {
  it('normalizes paid-yearly status into paid access with quota metadata', () => {
    const status = normalizeSubscriptionStatus({
      plan_code: 'paid_yearly',
      entitlement_state: 'active',
      current_period_start: '2026-07-01T00:00:00.000Z',
      current_period_end: '2027-07-01T00:00:00.000Z',
      quotas: {
        dream_reflections: {
          limit: 35,
          used: 4,
          remaining: 31,
          next_reset_at: '2027-07-01T00:00:00.000Z',
        },
      },
    });

    expect(status.planCode).toBe('paid_yearly');
    expect(status.hasPaidAccess).toBe(true);
    expect(status.planTier).toBe('premium');
    expect(status.quotas.dreamReflections.remaining).toBe(31);
  });

  it('never invents a fallback currency or enables a missing store product', () => {
    const premiumYearly = getFallbackPlan('paid_yearly');
    expect(premiumYearly.displayPrice).toBe('Price unavailable');
    expect(premiumYearly.storePriceAvailable).toBe(false);
    expect(premiumYearly.priceAmount).toBeNull();
    expect(premiumYearly.currencyCode).toBeNull();
    expect(isStorePlanPurchasable(premiumYearly)).toBe(false);
    expect(getPaidPlanCardPricing(premiumYearly)).toEqual({
      price: 'Price unavailable',
      compareAtPrice: null,
      priceDetail: 'Try again when the store is available',
      secondaryPriceDetail: null,
    });
    expect(getPaidPlanCardPricing(premiumYearly, { loading: true }).price).toBe('Checking price…');
  });

  it('uses storefront display prices and actual local amounts for yearly breakdowns', () => {
    const products = getStorePlanOptions([
      iosProduct(subscriptionConfig.applePremiumMonthlyProductId, '$4.99', 4.99),
      iosProduct(subscriptionConfig.applePremiumYearlyProductId, '$47.88', 47.88),
      iosProduct(subscriptionConfig.appleDeeperMonthlyProductId, '$8.99', 8.99),
      iosProduct(subscriptionConfig.appleDeeperYearlyProductId, '$77.88', 77.88),
    ], 'ios');

    const premiumMonthly = products.find((plan) => plan.planCode === 'paid_monthly')!;
    const premiumYearly = products.find((plan) => plan.planCode === 'paid_yearly')!;
    const deeperYearly = products.find((plan) => plan.planCode === 'deeper_yearly')!;

    expect(premiumMonthly.displayPrice).toBe('$4.99');
    expect(premiumMonthly.currencyCode).toBe('USD');
    expect(isStorePlanPurchasable(premiumMonthly)).toBe(true);
    expect(premiumYearly.displayPrice).toBe('$47.88');
    expect(premiumYearly.monthlyEquivalentLabel).toContain('$3.99');
    expect(premiumYearly.savingsLabel).toContain('$12.00');
    expect(deeperYearly.monthlyEquivalentLabel).toContain('$6.49');
    expect(deeperYearly.savingsLabel).toContain('$30.00');
    expect(getPaidPlanCardPricing(premiumYearly)).toEqual({
      price: '$47.88',
      compareAtPrice: null,
      priceDetail: 'Billed once a year',
      secondaryPriceDetail: 'Equivalent to $3.99 / month · Save $12.00 / year',
    });
  });

  it('derives the free-trial duration from the current iOS offer metadata', () => {
    const product = {
      ...iosProduct(subscriptionConfig.applePremiumMonthlyProductId, '$4.99', 4.99),
      subscriptionOffers: [
        {
          id: 'intro',
          displayPrice: '$0.00',
          price: 0,
          currency: 'USD',
          type: 'introductory',
          paymentMode: 'free-trial',
          period: { unit: 'month', value: 1 },
          periodCount: 1,
        },
      ],
    } as ProductSubscription;

    const premiumMonthly = getStorePlanOptions([product], 'ios').find(
      (plan) => plan.planCode === 'paid_monthly'
    );

    expect(premiumMonthly?.trialLabel).toBe('1-month free trial for eligible subscribers');
  });

  it('keeps partial and mismatched storefront responses fail-closed', () => {
    const partial = getStorePlanOptions([
      iosProduct(subscriptionConfig.applePremiumMonthlyProductId, '£4.99', 4.99, 'GBP'),
      iosProduct(subscriptionConfig.applePremiumYearlyProductId, '$47.88', 47.88, 'USD'),
    ], 'ios');
    const premiumYearly = partial.find((plan) => plan.planCode === 'paid_yearly')!;
    const deeperMonthly = partial.find((plan) => plan.planCode === 'deeper_monthly')!;

    expect(premiumYearly.storePriceAvailable).toBe(true);
    expect(premiumYearly.monthlyEquivalentLabel).toBeNull();
    expect(premiumYearly.savingsLabel).toBeNull();
    expect(deeperMonthly.storePriceAvailable).toBe(false);
    expect(isStorePlanPurchasable(deeperMonthly)).toBe(false);
  });

  it('uses the recurring Android phase instead of advertising a zero-price trial', () => {
    const products = getStorePlanOptions([
      {
        id: subscriptionConfig.googlePremiumSubscriptionProductId,
        displayPrice: '$0.00',
        price: 0,
        currency: 'USD',
        platform: 'android',
        type: 'subs',
        title: 'Premium',
        description: '',
        subscriptionOffers: [
          {
            id: 'base',
            basePlanIdAndroid: subscriptionConfig.googleMonthlyBasePlanId,
            displayPrice: '$5.99',
            price: 5.99,
            currency: 'USD',
            offerTokenAndroid: 'base-token',
            type: 'introductory',
            pricingPhasesAndroid: {
              pricingPhaseList: [
                {
                  billingCycleCount: 0,
                  billingPeriod: 'P1M',
                  formattedPrice: '$5.99',
                  priceAmountMicros: '5990000',
                  priceCurrencyCode: 'USD',
                  recurrenceMode: 1,
                },
              ],
            },
          },
          {
            id: 'trial',
            basePlanIdAndroid: subscriptionConfig.googleMonthlyBasePlanId,
            displayPrice: '$0.00',
            price: 0,
            currency: 'USD',
            offerTokenAndroid: 'trial-token',
            type: 'introductory',
            pricingPhasesAndroid: {
              pricingPhaseList: [
                {
                  billingCycleCount: 1,
                  billingPeriod: 'P7D',
                  formattedPrice: '$0.00',
                  priceAmountMicros: '0',
                  priceCurrencyCode: 'USD',
                  recurrenceMode: 2,
                },
                {
                  billingCycleCount: 0,
                  billingPeriod: 'P1M',
                  formattedPrice: '$5.99',
                  priceAmountMicros: '5990000',
                  priceCurrencyCode: 'USD',
                  recurrenceMode: 1,
                },
              ],
            },
          },
        ],
      } as ProductSubscription,
    ], 'android');

    const premiumMonthly = products.find((plan) => plan.planCode === 'paid_monthly')!;
    expect(premiumMonthly.displayPrice).toBe('$5.99');
    expect(premiumMonthly.priceAmount).toBe(5.99);
    expect(premiumMonthly.offerTokenAndroid).toBe('trial-token');
    expect(premiumMonthly.trialLabel).toBe('7-day free trial for eligible subscribers');
  });

  it('makes the Yearly switch badge follow the visible paid card', () => {
    const products = getStorePlanOptions([
      iosProduct(subscriptionConfig.applePremiumMonthlyProductId, '$4.99', 4.99),
      iosProduct(subscriptionConfig.applePremiumYearlyProductId, '$47.88', 47.88),
      iosProduct(subscriptionConfig.appleDeeperMonthlyProductId, '$8.99', 8.99),
      iosProduct(subscriptionConfig.appleDeeperYearlyProductId, '$77.88', 77.88),
    ], 'ios');

    expect(getCompactYearlySavingsBadge('Save $12.00 / year')).toBe('Save $12');
    expect(getCompactYearlySavingsBadge('Save $30.00 / year')).toBe('Save $30');

    expect(
      getYearlySavingsBadgeForVisibleCard({
        activeCardIndex: 1,
        products,
      })
    ).toBe('Save $12');

    expect(
      getYearlySavingsBadgeForVisibleCard({
        activeCardIndex: 2,
        products,
      })
    ).toBe('Save $30');

    // Monthly interval still teases the matching yearly savings for the visible card.
    expect(
      getYearlySavingsBadgeForVisibleCard({
        activeCardIndex: 2,
        products,
      })
    ).toBe('Save $30');

    expect(
      getYearlySavingsBadgeForVisibleCard({
        activeCardIndex: 0,
        products,
        includesFreeCard: false,
      })
    ).toBe('Save $12');
  });

  it('returns source-aware upsell copy and lapse messaging', () => {
    expect(getPremiumSourceCopy('period_reflection')).toEqual({
      title: 'Essays and long-form patterns',
      body: 'Premium includes one monthly essay. Deeper opens the weekly rhythm for people who want to stay closer to the material.',
    });
    expect(getReadOnlyLapseMessage()).toMatch(/readable/i);
  });

  it('classifies missing native IAP module errors and returns clear fallback copy', () => {
    expect(isMissingNativeIapError(new Error("Cannot find native module 'ExpoIap'"))).toBe(true);
    expect(getIapUnavailableMessage('expo_go')).toMatch(/Expo Go/i);
    expect(getIapUnavailableMessage('missing_native_module')).toMatch(/native subscription module/i);
  });
});
