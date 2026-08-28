import {
  ONEIROS_LANGUAGE_CODES,
  type OneirosLanguageCode,
} from '../../../../constants/oneirosLanguages.ts';

/**
 * Diagnostic-only lexical lint. Never rewrite model output.
 * A clean lint is not a semantic pass.
 */
export const SAME_CALL_DISJUNCTION_MARKERS: Record<OneirosLanguageCode, RegExp[]> = {
  en: [/\beither\b/iu, /\bor\b/iu],
  el: [/(^|[^\p{L}])ή([^\p{L}]|$)/u],
  es: [/\bo bien\b/iu, /(^|[^\p{L}])o([^\p{L}]|$)/iu],
  fr: [/\bsoit\b/iu, /\bou\b/iu],
  de: [/\boder\b/iu],
  it: [/\boppure\b/iu, /(^|[^\p{L}])o([^\p{L}]|$)/iu],
  pt: [/\bou\b/iu],
  nl: [/\bof\b/iu],
  pl: [/\balbo\b/iu, /\blub\b/iu],
  ru: [/\bлибо\b/iu, /\bили\b/iu],
  ja: [/それとも/u, /あるいは/u],
  zh: [/还是/u, /或者/u],
};

export type DisjunctionHit = {
  language: OneirosLanguageCode;
  pattern: string;
};

export function lintSameCallDisjunction(
  question: string | null,
  language: OneirosLanguageCode
): DisjunctionHit[] {
  if (!question?.trim()) return [];
  const hits: DisjunctionHit[] = [];
  const patterns = SAME_CALL_DISJUNCTION_MARKERS[language] ?? [];
  for (const pattern of patterns) {
    if (pattern.test(question)) {
      hits.push({ language, pattern: String(pattern) });
    }
  }
  return hits;
}

export function questionOpenerFamily(question: string | null, language: OneirosLanguageCode): string {
  if (!question?.trim()) return '(missing)';
  const text = question.replace(/\s+/gu, ' ').trim();
  if (language === 'zh' || language === 'ja') {
    return text.slice(0, 8);
  }
  return text.split(' ').slice(0, 3).join(' ');
}

export function assertDisjunctionDictionaryCoversRegistry(): void {
  for (const code of ONEIROS_LANGUAGE_CODES) {
    if (!SAME_CALL_DISJUNCTION_MARKERS[code]?.length) {
      throw new Error(`Missing disjunction markers for ${code}.`);
    }
  }
}
