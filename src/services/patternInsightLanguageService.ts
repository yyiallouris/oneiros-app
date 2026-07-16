import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  DEFAULT_PATTERN_INSIGHT_LANGUAGE,
  PATTERN_INSIGHT_LANGUAGE_KEY,
  PATTERN_INSIGHT_LANGUAGES,
} from '../constants/patternInsightLanguages';

export type PatternInsightLanguageCode = (typeof PATTERN_INSIGHT_LANGUAGES)[number]['code'];

const isSupportedLanguage = (value: string | null): value is PatternInsightLanguageCode =>
  value != null && PATTERN_INSIGHT_LANGUAGES.some((language) => language.code === value);

export async function getPatternInsightLanguage(): Promise<PatternInsightLanguageCode> {
  try {
    const stored = await AsyncStorage.getItem(PATTERN_INSIGHT_LANGUAGE_KEY);
    return isSupportedLanguage(stored) ? stored : DEFAULT_PATTERN_INSIGHT_LANGUAGE;
  } catch {
    return DEFAULT_PATTERN_INSIGHT_LANGUAGE;
  }
}

export async function setPatternInsightLanguage(language: string): Promise<void> {
  if (!isSupportedLanguage(language)) return;
  await AsyncStorage.setItem(PATTERN_INSIGHT_LANGUAGE_KEY, language);
}
