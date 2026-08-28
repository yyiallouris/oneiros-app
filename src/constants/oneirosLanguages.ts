/**
 * One shared language registry for Oneiros reflective surfaces.
 *
 * Psychological method stays language-neutral. This registry only owns
 * supported ISO codes and user-facing language names.
 */
export const ONEIROS_LANGUAGES = [
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
] as const;

export type OneirosLanguageCode = (typeof ONEIROS_LANGUAGES)[number]['code'];

export const ONEIROS_LANGUAGE_CODES = ONEIROS_LANGUAGES.map(
  ({ code }) => code
) as OneirosLanguageCode[];

export const DEFAULT_ONEIROS_LANGUAGE_CODE: OneirosLanguageCode = 'en';

const SUPPORTED_LANGUAGE_CODES = new Set<string>(ONEIROS_LANGUAGE_CODES);

export function isOneirosLanguageCode(value: unknown): value is OneirosLanguageCode {
  return typeof value === 'string' && SUPPORTED_LANGUAGE_CODES.has(value);
}

/** Accepts persisted BCP-47 variants such as pt-BR or zh-Hant conservatively. */
export function normalizeOneirosLanguageCode(
  value: unknown
): OneirosLanguageCode | null {
  if (typeof value !== 'string') return null;
  const primary = value.trim().toLowerCase().split(/[-_]/u)[0];
  return isOneirosLanguageCode(primary) ? primary : null;
}

export function getOneirosLanguageName(code: OneirosLanguageCode): string {
  return ONEIROS_LANGUAGES.find((language) => language.code === code)?.name ?? 'English';
}
