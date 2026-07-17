/**
 * Flow coverage: documentation/flows-08-support-legal-contact.md
 */
import {
  AI_REFLECTION_NOTICE,
  CRISIS_NOTICE,
  LEGAL_CONSENT_ITEMS,
  PRIVACY_SECTIONS,
  WELLNESS_DISCLAIMER,
} from '../../src/constants/legal';

const combinedConsent = LEGAL_CONSENT_ITEMS.join(' ').toLowerCase();
const combinedPrivacy = PRIVACY_SECTIONS.map((section) => `${section.title} ${section.body}`).join(' ').toLowerCase();

describe('legal copy flow', () => {
  it('keeps consent acceptance anchored to age, wellness scope, data processing, AI limits, and crisis boundaries', () => {
    expect(combinedConsent).toContain('18');
    expect(combinedConsent).toContain('wellness');
    expect(combinedConsent).toContain('not therapy');
    expect(combinedConsent).toContain('diagnosis');
    expect(combinedConsent).toContain('sensitive personal information');
    expect(combinedConsent).toContain('ai reflections');
    expect(combinedConsent).toContain('incomplete');
    expect(combinedConsent).toContain('emergency');
    expect(combinedConsent).toContain('crisis');
  });

  it('keeps shared notices clear that Oneiros is reflective, not clinical or emergency support', () => {
    expect(AI_REFLECTION_NOTICE.toLowerCase()).toContain('symbolic reflection');
    expect(AI_REFLECTION_NOTICE.toLowerCase()).toContain('not therapy');
    expect(WELLNESS_DISCLAIMER.toLowerCase()).toContain('not a medical device');
    expect(WELLNESS_DISCLAIMER.toLowerCase()).toContain('does not diagnose');
    expect(CRISIS_NOTICE.toLowerCase()).toContain('emergency');
    expect(CRISIS_NOTICE.toLowerCase()).toContain('crisis support');
  });

  it('keeps privacy summary grounded in sensitive data, AI processing, user controls, and emergency limits', () => {
    expect(combinedPrivacy).toContain('sensitive personal information');
    expect(combinedPrivacy).toContain('ai provider');
    expect(combinedPrivacy).toContain('not fact');
    expect(combinedPrivacy).toContain('not routinely review your dreams');
    expect(combinedPrivacy).toContain('export');
    expect(combinedPrivacy).toContain('deletion');
    expect(combinedPrivacy).toContain('emergency');
  });

  it('exposes hosted privacy and terms URLs from Expo config', () => {
    jest.resetModules();
    jest.doMock('expo-constants', () => ({
      expoConfig: {
        extra: {
          privacyPolicyUrl: 'https://oneiros.example/privacy',
          termsUrl: 'https://oneiros.example/terms',
        },
      },
      manifest: { extra: {} },
    }));

    const { LEGAL_LINKS } = require('../../src/constants/legal');

    expect(LEGAL_LINKS.privacyPolicyUrl).toBe('https://oneiros.example/privacy');
    expect(LEGAL_LINKS.termsUrl).toBe('https://oneiros.example/terms');
  });
});
