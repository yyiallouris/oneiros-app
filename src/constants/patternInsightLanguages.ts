/**
 * Languages for pattern insight essay generation.
 * Code: ISO 639-1 (2-letter). Display: short code shown in UI.
 */

export interface PatternInsightLanguage {
  code: string;      // ISO 639-1, used in prompt
  display: string;   // Shown in UI (e.g. EN, EL)
  name: string;      // Full name for dropdown
}

export const PATTERN_INSIGHT_LANGUAGES: PatternInsightLanguage[] = [
  { code: 'en', display: 'EN', name: 'English' },
  { code: 'el', display: 'EL', name: 'Ελληνικά' },
  { code: 'es', display: 'ES', name: 'Español' },
  { code: 'fr', display: 'FR', name: 'Français' },
  { code: 'de', display: 'DE', name: 'Deutsch' },
  { code: 'it', display: 'IT', name: 'Italiano' },
  { code: 'pt', display: 'PT', name: 'Português' },
  { code: 'nl', display: 'NL', name: 'Nederlands' },
  { code: 'pl', display: 'PL', name: 'Polski' },
  { code: 'ru', display: 'RU', name: 'Русский' },
  { code: 'ja', display: 'JA', name: '日本語' },
  { code: 'zh', display: 'ZH', name: '中文' },
];

export const DEFAULT_PATTERN_INSIGHT_LANGUAGE = 'en';
export const PATTERN_INSIGHT_LANGUAGE_KEY = '@pattern_insight_language';
