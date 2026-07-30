/**
 * Flow coverage: documentation/flows-08-support-legal-contact.md
 */
import {
  AI_REFLECTION_NOTICE,
  AUTH_LEGAL_NOTE,
  CRISIS_NOTICE,
  LEGAL_CONSENT_ACKNOWLEDGEMENT,
  LEGAL_CONSENT_SUMMARY_POINTS,
  PRIVACY_SECTIONS,
  WELLNESS_DISCLAIMER,
} from '../../src/constants/legal';

const combinedPrivacy = PRIVACY_SECTIONS.map((section) => `${section.title} ${section.body}`).join(' ').toLowerCase();
const combinedSummary = LEGAL_CONSENT_SUMMARY_POINTS.join(' ').toLowerCase();
const acknowledgement = LEGAL_CONSENT_ACKNOWLEDGEMENT.toLowerCase();

describe('legal copy flow', () => {
  it('keeps consent acceptance compact while still anchored to age and formal agreement', () => {
    expect(acknowledgement).toContain('agree');
    expect(acknowledgement).toContain('privacy policy');
    expect(acknowledgement).toContain('terms of use');
    expect(acknowledgement).toContain('18');
  });

  it('keeps the entry copy calm about privacy, processing, and user choice', () => {
    expect(AUTH_LEGAL_NOTE.toLowerCase()).toContain('dream text');
    expect(AUTH_LEGAL_NOTE.toLowerCase()).toContain('journal');
    expect(AUTH_LEGAL_NOTE.toLowerCase()).toContain('privacy');
    expect(AUTH_LEGAL_NOTE.toLowerCase()).toContain('terms');
    expect(combinedSummary).toContain('private');
    expect(combinedSummary).toContain('only when you ask for them');
    expect(combinedSummary).toContain('do not sell your journal content');
    expect(combinedSummary).toContain('not therapy');
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
