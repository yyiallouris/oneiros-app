export type DesignExportScreen = {
  id: string;
  route: string;
  navigator: 'root-stack' | 'main-tabs' | 'onboarding-stack';
  label: string;
  notes?: string;
};

export const DESIGN_EXPORT_SCREEN_CATALOG: DesignExportScreen[] = [
  { id: 'auth', route: 'Auth', navigator: 'root-stack', label: 'Auth / Sign in' },
  { id: 'login-support', route: 'LoginSupport', navigator: 'root-stack', label: 'Login support' },
  { id: 'set-password', route: 'SetPassword', navigator: 'root-stack', label: 'Set new password' },
  { id: 'biometric-lock', route: 'BiometricLock', navigator: 'root-stack', label: 'Biometric lock' },
  { id: 'legal-consent', route: 'LegalConsent', navigator: 'root-stack', label: 'Legal consent' },
  { id: 'onboarding-name', route: 'OnboardingName', navigator: 'onboarding-stack', label: 'Onboarding: name' },
  { id: 'onboarding-depth', route: 'OnboardingDepth', navigator: 'onboarding-stack', label: 'Onboarding: analysis depth' },
  { id: 'onboarding-language', route: 'OnboardingLanguage', navigator: 'onboarding-stack', label: 'Onboarding: insights language' },
  { id: 'onboarding-secure', route: 'OnboardingSecure', navigator: 'onboarding-stack', label: 'Onboarding: security' },
  { id: 'write', route: 'Write', navigator: 'main-tabs', label: 'Write dream' },
  { id: 'journal', route: 'Journal', navigator: 'main-tabs', label: 'Journal' },
  { id: 'insights', route: 'Insights', navigator: 'main-tabs', label: 'Insights overview' },
  { id: 'dream-editor', route: 'DreamEditor', navigator: 'root-stack', label: 'Dream editor' },
  { id: 'dream-detail', route: 'DreamDetail', navigator: 'root-stack', label: 'Dream detail' },
  { id: 'interpretation-chat', route: 'InterpretationChat', navigator: 'root-stack', label: 'Interpretation chat' },
  { id: 'account', route: 'Account', navigator: 'root-stack', label: 'Account settings' },
  { id: 'contact', route: 'Contact', navigator: 'root-stack', label: 'Contact' },
  { id: 'privacy', route: 'Privacy', navigator: 'root-stack', label: 'Privacy & Legal' },
  { id: 'calendar', route: 'Calendar', navigator: 'root-stack', label: 'Dream calendar' },
  {
    id: 'pattern-explorer',
    route: 'PatternExplorer',
    navigator: 'root-stack',
    label: 'Pattern explorer',
    notes: 'Vertical pattern explorer with strongest signals and category previews.',
  },
  {
    id: 'insights-journey',
    route: 'InsightsJourney',
    navigator: 'root-stack',
    label: 'Insights journey',
    notes: 'Legacy swipeable journey across images, motifs, thresholds, tensions, archetypes, and places.',
  },
  {
    id: 'insights-section',
    route: 'InsightsSection',
    navigator: 'root-stack',
    label: 'Insights section',
    notes: 'Use sectionId to capture returning images, repeating patterns, thresholds, inner tensions, archetypal echoes, dream places, and period reflection.',
  },
  {
    id: 'journal-filter',
    route: 'JournalFilter',
    navigator: 'root-stack',
    label: 'Filtered journal',
    notes: 'Same visual system as Journal with stack header and filter state.',
  },
];
