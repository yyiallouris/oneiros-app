import { getOnboardingLanguageOptions } from '../../src/utils/onboardingLanguage';

describe('onboarding language options', () => {
  it('promotes a supported device language to the top and uses it as default', () => {
    const options = getOnboardingLanguageOptions('el');
    expect(options.defaultCode).toBe('el');
    expect(options.languages[0]?.code).toBe('el');
  });

  it('falls back to English when the device language is unsupported', () => {
    const options = getOnboardingLanguageOptions('xx');
    expect(options.defaultCode).toBe('en');
    expect(options.languages[0]?.code).toBe('en');
  });
});
