describe('app config env projection', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('projects subscription env vars into expo extra without exposing support routing', () => {
    process.env.EXPO_PUBLIC_APPLE_DEEPER_SUBSCRIPTION_MONTHLY_PRODUCT_ID = 'apple.deeper.monthly';
    process.env.EXPO_PUBLIC_APPLE_DEEPER_SUBSCRIPTION_YEARLY_PRODUCT_ID = 'apple.deeper.yearly';
    process.env.EXPO_PUBLIC_GOOGLE_DEEPER_SUBSCRIPTION_PRODUCT_ID = 'google.deeper';

    const configModule = require('../app.config.js');
    const config = configModule.default;

    expect(config.extra.contactEmail).toBeUndefined();
    expect(config.extra.appleDeeperSubscriptionMonthlyProductId).toBe('apple.deeper.monthly');
    expect(config.extra.appleDeeperSubscriptionYearlyProductId).toBe('apple.deeper.yearly');
    expect(config.extra.googleDeeperSubscriptionProductId).toBe('google.deeper');
  });

  it('keeps the first App Store release iPhone-only', () => {
    const configModule = require('../app.config.js');
    const config = configModule.default;

    expect(config.ios.supportsTablet).toBe(false);
  });
});
