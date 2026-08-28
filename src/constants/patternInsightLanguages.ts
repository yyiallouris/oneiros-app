/**
 * Languages for pattern insight essay generation.
 * Code: ISO 639-1 (2-letter). Display: short code shown in UI.
 */

import {
  DEFAULT_ONEIROS_LANGUAGE_CODE,
  ONEIROS_LANGUAGES,
  type OneirosLanguageCode,
} from './oneirosLanguages';

export interface PatternInsightLanguage {
  code: OneirosLanguageCode;
  display: string;
  name: string;
}

export const PATTERN_INSIGHT_LANGUAGES: PatternInsightLanguage[] =
  ONEIROS_LANGUAGES.map((language) => ({ ...language }));

export const DEFAULT_PATTERN_INSIGHT_LANGUAGE = DEFAULT_ONEIROS_LANGUAGE_CODE;
export const PATTERN_INSIGHT_LANGUAGE_KEY = '@pattern_insight_language';
