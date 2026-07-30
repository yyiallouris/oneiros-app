import {
  getFallbackPlan,
  getIapUnavailableMessage,
  getPremiumSourceCopy,
  getReadOnlyLapseMessage,
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
    const plan = getFallbackPlan('paid_yearly');

    expect(plan.displayPrice).toBe('€47.88 / year');
    expect(plan.monthlyEquivalentLabel).toBe('€3.99 / month');
    expect(plan.savingsLabel).toBe('Save €12.00 / year');
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
