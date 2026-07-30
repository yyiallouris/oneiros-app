import Constants from 'expo-constants';

export const LEGAL_CONSENT_VERSION = '2026-07-30';

function getLegalConfigUrl(extraKey: string, envKey: string): string | null {
  const extra = Constants.expoConfig?.extra ?? (Constants.manifest as any)?.extra ?? {};
  const value = extra[extraKey] ?? process.env[envKey];
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

export const LEGAL_LINKS = {
  privacyPolicyUrl: getLegalConfigUrl('privacyPolicyUrl', 'EXPO_PUBLIC_PRIVACY_POLICY_URL'),
  termsUrl: getLegalConfigUrl('termsUrl', 'EXPO_PUBLIC_TERMS_URL'),
};

export const AUTH_LEGAL_NOTE =
  'A private dream journal with clear boundaries. When you ask for reflections, relevant dream text is processed to generate them. Read Privacy & Terms.';

export const AI_REFLECTION_NOTICE =
  'AI-assisted symbolic reflection for journaling and self-inquiry. It can be meaningful, but it is not therapy, diagnosis, crisis support, medical care, or professional advice.';

export const WELLNESS_DISCLAIMER =
  'Oneiros is a private dream journal and symbolic reflection space for wellness and self-inquiry. It is not a medical device and does not diagnose, treat, cure, or prevent any medical or mental health condition.';

export const CRISIS_NOTICE =
  'If you might harm yourself or someone else, or feel in immediate danger, contact local emergency services or a trusted crisis, medical, or mental health professional now. Oneiros is not emergency or crisis support.';

export const LEGAL_CONSENT_SUMMARY_POINTS = [
  'Oneiros is meant to feel private, respectful, and calm from the start.',
  'Your journal data is used to save your entries, sync your account, and generate reflections when you ask for them.',
  'We do not sell your journal content or use it for advertising.',
  'AI reflections are interpretive material for self-inquiry. Keep what helps, and leave what does not.',
];

export const LEGAL_CONSENT_ITEMS = [
  'I confirm I am 18 or older.',
  'I understand Oneiros may process my dream entries, reflections, and related journal data, which may include sensitive personal information, so it can save my journal, generate AI reflections, provide support, keep the service secure, and meet legal obligations.',
  'I understand Oneiros is for wellness, journaling, and self-inquiry. AI reflections are generated automatically, may be incomplete or emotionally off, and are not therapy, diagnosis, medical or mental health care, crisis support, or professional advice.',
  'I understand Oneiros cannot provide emergency help. If I might harm myself or someone else, or feel in immediate danger, I should contact local emergency services or a trusted crisis, medical, or mental health professional now.',
];

export const PRIVACY_SECTIONS = [
  {
    title: 'What Oneiros Is',
    body:
      'Oneiros is designed as a private, protected place to record dreams and receive symbolic, post-Jungian reflections. It supports journaling, wellness, and self-inquiry only. It does not provide therapy, diagnosis, treatment, medical care, crisis support, or professional advice.',
  },
  {
    title: 'Your Journal Data',
    body:
      'Your dream entries, generated reflections, symbols, archetypes, motifs, account details, settings, support messages, and sync metadata may be stored so your private journal can work across sessions and devices.',
  },
  {
    title: 'Sensitive Information',
    body:
      'Dreams can carry intimate or sensitive personal information, including health, relationships, sexuality, beliefs, trauma, or identity. Share only what feels safe for you to process inside the app.',
  },
  {
    title: 'How We Use Data',
    body:
      'We use your data to provide journaling, AI reflections, insights, sync, account security, support, abuse prevention, and legal compliance. We do not sell your journal content or use it for advertising.',
  },
  {
    title: 'AI Processing',
    body:
      'When you request an interpretation or chat response, relevant dream content is sent to the configured AI provider or server proxy to generate the response. AI output is automatically generated symbolic material. Treat it as reflection, not fact, instruction, clinical assessment, or advice.',
  },
  {
    title: 'Access And Support',
    body:
      'We do not routinely review your dreams. Limited access may occur only when needed to provide support you request, operate and secure the service, debug a serious issue, comply with law, or protect users and the service.',
  },
  {
    title: 'Your Controls',
    body:
      'You can request access, correction, export, deletion, or restriction of your personal data. Some records may be retained where required for security, fraud prevention, legal obligations, or dispute handling.',
  },
  {
    title: 'Emergencies',
    body: CRISIS_NOTICE,
  },
];
