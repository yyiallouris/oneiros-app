import {
  DEFAULT_PATTERN_INSIGHT_LANGUAGE,
  PATTERN_INSIGHT_LANGUAGES,
  type PatternInsightLanguage,
} from '../constants/patternInsightLanguages';
import type { PatternInsightLanguageCode } from '../services/patternInsightLanguageService';

const isSupportedLanguage = (value: string): value is PatternInsightLanguageCode =>
  PATTERN_INSIGHT_LANGUAGES.some((language) => language.code === value);

export function getDeviceLanguageCode(): string {
  try {
    const locale = Intl.DateTimeFormat().resolvedOptions().locale || DEFAULT_PATTERN_INSIGHT_LANGUAGE;
    return locale.split(/[-_]/)[0]?.toLowerCase() || DEFAULT_PATTERN_INSIGHT_LANGUAGE;
  } catch {
    return DEFAULT_PATTERN_INSIGHT_LANGUAGE;
  }
}

/** Prefer the device language when supported, then keep the rest of the list stable. */
export function getOnboardingLanguageOptions(deviceCode = getDeviceLanguageCode()): {
  defaultCode: PatternInsightLanguageCode;
  languages: PatternInsightLanguage[];
} {
  const defaultCode = isSupportedLanguage(deviceCode) ? deviceCode : DEFAULT_PATTERN_INSIGHT_LANGUAGE;
  const preferred = PATTERN_INSIGHT_LANGUAGES.find((language) => language.code === defaultCode);
  if (!preferred) {
    return { defaultCode: DEFAULT_PATTERN_INSIGHT_LANGUAGE, languages: PATTERN_INSIGHT_LANGUAGES };
  }

  return {
    defaultCode,
    languages: [preferred, ...PATTERN_INSIGHT_LANGUAGES.filter((language) => language.code !== preferred.code)],
  };
}
