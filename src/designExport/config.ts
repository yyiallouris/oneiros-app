export type DesignExportVariant = 'full' | 'background-only';
export type DesignExportAuthMode = 'login' | 'signup';

const getPublicEnv = (key: string): string | undefined => {
  const env = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env;
  return env?.[key];
};

const getUrlParam = (key: string): string | undefined => {
  const location = (globalThis as { location?: Location }).location;
  if (!location) return undefined;
  const searchValue = new URLSearchParams(location.search).get(key);
  if (searchValue != null) return searchValue;
  const hashQuery = location.hash.includes('?') ? location.hash.slice(location.hash.indexOf('?') + 1) : '';
  return new URLSearchParams(hashQuery).get(key) ?? undefined;
};

const getDesignExportValue = (envKey: string, urlKey: string): string | undefined =>
  getUrlParam(urlKey) ?? getPublicEnv(envKey);

const modeFromConfig =
  getDesignExportValue('EXPO_PUBLIC_DESIGN_EXPORT_MODE', 'designExportMode') === 'true';
const variantFromConfig = getDesignExportValue(
  'EXPO_PUBLIC_DESIGN_EXPORT_VARIANT',
  'designExportVariant'
);

/**
 * Flip these constants directly when you want a hard-coded export build, or set:
 * EXPO_PUBLIC_DESIGN_EXPORT_MODE=true
 * EXPO_PUBLIC_DESIGN_EXPORT_VARIANT=full | background-only
 */
const DESIGN_EXPORT_MODE_OVERRIDE: boolean | null = null;
const DESIGN_EXPORT_VARIANT_OVERRIDE: DesignExportVariant | null = null;

export const DESIGN_EXPORT_MODE = DESIGN_EXPORT_MODE_OVERRIDE ?? modeFromConfig;

export const DESIGN_EXPORT_VARIANT: DesignExportVariant =
  DESIGN_EXPORT_VARIANT_OVERRIDE ??
  (variantFromConfig === 'background-only' ? 'background-only' : 'full');

export const IS_DESIGN_EXPORT_BACKGROUND_ONLY =
  DESIGN_EXPORT_MODE && DESIGN_EXPORT_VARIANT === 'background-only';

export const DESIGN_EXPORT_INITIAL_ROUTE =
  getDesignExportValue('EXPO_PUBLIC_DESIGN_EXPORT_INITIAL_ROUTE', 'designRoute') ?? 'MainTabs';

export const DESIGN_EXPORT_INITIAL_TAB =
  getDesignExportValue('EXPO_PUBLIC_DESIGN_EXPORT_INITIAL_TAB', 'designTab') ?? 'Write';

export const DESIGN_EXPORT_INITIAL_ONBOARDING_ROUTE =
  getDesignExportValue('EXPO_PUBLIC_DESIGN_EXPORT_INITIAL_ONBOARDING_ROUTE', 'designOnboardingRoute') ??
  'OnboardingName';

export const DESIGN_EXPORT_DREAM_ID =
  getDesignExportValue('EXPO_PUBLIC_DESIGN_EXPORT_DREAM_ID', 'designDreamId') ?? 'design-export-dream';

export const DESIGN_EXPORT_INSIGHTS_SECTION_ID =
  getDesignExportValue('EXPO_PUBLIC_DESIGN_EXPORT_INSIGHTS_SECTION_ID', 'designInsightsSection') ??
  'recurring-symbols';

export const DESIGN_EXPORT_JOURNAL_FILTER_SYMBOL =
  getDesignExportValue('EXPO_PUBLIC_DESIGN_EXPORT_JOURNAL_FILTER_SYMBOL', 'designJournalFilterSymbol') ?? 'water';

export const DESIGN_EXPORT_AUTH_MODE: DesignExportAuthMode =
  getDesignExportValue('EXPO_PUBLIC_DESIGN_EXPORT_AUTH_MODE', 'designAuthMode') === 'signup'
    ? 'signup'
    : 'login';

export const DESIGN_EXPORT_HOLD_SPLASH =
  DESIGN_EXPORT_MODE &&
  (DESIGN_EXPORT_INITIAL_ROUTE === 'Splash' ||
    getDesignExportValue('EXPO_PUBLIC_DESIGN_EXPORT_HOLD_SPLASH', 'designHoldSplash') === 'true');

const parsePositiveInt = (value: string | undefined, fallback: number) => {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

export const DESIGN_EXPORT_DEVICE_WIDTH = parsePositiveInt(
  getDesignExportValue('EXPO_PUBLIC_DESIGN_EXPORT_DEVICE_WIDTH', 'designDeviceWidth'),
  390
);

export const DESIGN_EXPORT_DEVICE_HEIGHT = parsePositiveInt(
  getDesignExportValue('EXPO_PUBLIC_DESIGN_EXPORT_DEVICE_HEIGHT', 'designDeviceHeight'),
  844
);
