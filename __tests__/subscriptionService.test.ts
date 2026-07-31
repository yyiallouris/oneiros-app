import {
  getCompactYearlySavingsBadge,
  getFallbackPlan,
  getIapUnavailableMessage,
  getPaidPlanCardPricing,
  getPremiumSourceCopy,
  getReadOnlyLapseMessage,
  getYearlySavingsBadgeForVisibleCard,
  isMissingNativeIapError,
  normalizeSubscriptionStatus,
} from '../src/services/subscriptionService';

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

  it('keeps yearly fallback pricing and savings clear', () => {
    const premiumYearly = getFallbackPlan('paid_yearly');
    expect(premiumYearly.displayPrice).toBe('€47.88 / year');
    expect(premiumYearly.compareAtPriceLabel).toBe('€4.99 / month');
    expect(premiumYearly.monthlyEquivalentLabel).toBe('€3.99 / month');
    expect(premiumYearly.savingsLabel).toBe('Save €12.00 / year');
    expect(getPaidPlanCardPricing(premiumYearly)).toEqual({
      price: '€3.99 / month',
      compareAtPrice: '€4.99 / month',
      priceDetail: '€47.88 billed yearly',
      secondaryPriceDetail: 'Save €12.00 / year',
    });

    const deeperYearly = getFallbackPlan('deeper_yearly');
    expect(deeperYearly.displayPrice).toBe('€77.88 / year');
    expect(deeperYearly.compareAtPriceLabel).toBe('€8.99 / month');
    expect(deeperYearly.monthlyEquivalentLabel).toBe('€6.49 / month');
    expect(deeperYearly.savingsLabel).toBe('Save €30.00 / year');
    expect(getPaidPlanCardPricing(deeperYearly)).toEqual({
      price: '€6.49 / month',
      compareAtPrice: '€8.99 / month',
      priceDetail: '€77.88 billed yearly',
      secondaryPriceDetail: 'Save €30.00 / year',
    });
  });

  it('makes the Yearly switch badge follow the visible paid card', () => {
    const premiumYearly = getFallbackPlan('paid_yearly');
    const deeperYearly = getFallbackPlan('deeper_yearly');
    const premiumMonthly = getFallbackPlan('paid_monthly');
    const deeperMonthly = getFallbackPlan('deeper_monthly');

    expect(getCompactYearlySavingsBadge('Save €12.00 / year')).toBe('Save €12');
    expect(getCompactYearlySavingsBadge('Save €30.00 / year')).toBe('Save €30');

    expect(
      getYearlySavingsBadgeForVisibleCard({
        activeCardIndex: 1,
        premiumPlan: premiumYearly,
        deeperPlan: deeperYearly,
      })
    ).toBe('Save €12');

    expect(
      getYearlySavingsBadgeForVisibleCard({
        activeCardIndex: 2,
        premiumPlan: premiumYearly,
        deeperPlan: deeperYearly,
      })
    ).toBe('Save €30');

    // Monthly interval still teases the matching yearly savings for the visible card.
    expect(
      getYearlySavingsBadgeForVisibleCard({
        activeCardIndex: 2,
        premiumPlan: premiumMonthly,
        deeperPlan: deeperMonthly,
      })
    ).toBe('Save €30');

    expect(
      getYearlySavingsBadgeForVisibleCard({
        activeCardIndex: 0,
        premiumPlan: premiumYearly,
        deeperPlan: deeperYearly,
        includesFreeCard: false,
      })
    ).toBe('Save €12');
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
