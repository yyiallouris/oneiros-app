import {
  getOneirosLanguageName,
  normalizeOneirosLanguageCode,
  type OneirosLanguageCode,
} from '../constants/oneirosLanguages.ts';

export const REFLECTIVE_LANGUAGE_CONTRACT_VERSION = '1.0.0' as const;

export type ReflectiveLanguageSource =
  | 'dream_narrative'
  | 'latest_substantive_user_turn'
  | 'established_conversation_language';

export type ReflectiveLanguageContext = {
  source: ReflectiveLanguageSource;
  sourceText: string;
  expectedLanguageCode: OneirosLanguageCode | null;
};

export type ReflectiveLanguageConversationMessage = {
  role: 'user' | 'assistant';
  content: string;
  reflectiveQuestion?: {
    languageCode?: string | null;
  };
};

const LATIN_LANGUAGE_MARKERS: Record<
  Extract<OneirosLanguageCode, 'en' | 'es' | 'fr' | 'de' | 'it' | 'pt' | 'nl' | 'pl'>,
  ReadonlySet<string>
> = {
  en: new Set(['the', 'and', 'was', 'were', 'with', 'that', 'this', 'from', 'into', 'while', 'when', 'what', 'my', 'your', 'felt', 'nothing', 'i', 'a', 'is', 'in', 'on', 'at', 'as', 'to']),
  es: new Set(['el', 'la', 'los', 'las', 'del', 'una', 'con', 'para', 'pero', 'cuando', 'ahora', 'estaba', 'habia', 'mi', 'mis', 'nada']),
  fr: new Set(['le', 'la', 'les', 'des', 'une', 'avec', 'dans', 'mais', 'quand', 'alors', 'etait', 'avait', 'rien', 'mon', 'mes']),
  de: new Set(['der', 'die', 'das', 'und', 'mit', 'aber', 'als', 'wenn', 'war', 'waren', 'mein', 'meine', 'nichts', 'nicht']),
  it: new Set(['il', 'lo', 'la', 'gli', 'una', 'con', 'ma', 'quando', 'mentre', 'era', 'aveva', 'mio', 'mia', 'niente']),
  pt: new Set(['uma', 'com', 'mas', 'quando', 'enquanto', 'estava', 'tinha', 'meu', 'minha', 'nada', 'nao', 'tambem', 'voce']),
  nl: new Set(['het', 'een', 'van', 'met', 'maar', 'toen', 'terwijl', 'was', 'waren', 'mijn', 'niets', 'niet', 'bleef']),
  pl: new Set(['jest', 'bylo', 'byla', 'sie', 'nie', 'ale', 'kiedy', 'gdy', 'moj', 'moja', 'nic', 'tylko', 'zostal']),
};

function clean(value: string | null | undefined): string {
  return typeof value === 'string' ? value.replace(/\s+/gu, ' ').trim() : '';
}

function latinLanguageTokens(value: string): string[] {
  return value
    .toLocaleLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/gu, '')
    .match(/\p{L}+/gu) ?? [];
}

/**
 * Conservative source-language detector for commit routing, not psychology.
 * It returns null on close Latin-language calls instead of guessing.
 */
export function detectOneirosLanguageCode(
  value: string
): OneirosLanguageCode | null {
  const text = clean(value);
  const letters = [...text].filter((character) => /\p{L}/u.test(character));
  if (letters.length === 0) return null;
  const count = (pattern: RegExp) => letters.filter((character) => pattern.test(character)).length;
  const kana = count(/[\p{Script=Hiragana}\p{Script=Katakana}]/u);
  const han = count(/\p{Script=Han}/u);
  const greek = count(/\p{Script=Greek}/u);
  const cyrillic = count(/\p{Script=Cyrillic}/u);
  const latin = count(/\p{Script=Latin}/u);

  if (kana >= 2) return 'ja';
  if (han >= 2 && kana === 0) return 'zh';
  if (greek / letters.length >= 0.35) return 'el';
  if (cyrillic / letters.length >= 0.35) return 'ru';
  if (latin / letters.length < 0.7) return null;

  // Repetition of a shared article (for example la/una/lo) must not outweigh
  // the distinct lexical evidence in another Latin language. Count markers
  // once per text; this detector is a conservative guard, not a classifier.
  const tokens = [...new Set(latinLanguageTokens(text))];
  const ranked = Object.entries(LATIN_LANGUAGE_MARKERS)
    .map(([code, markers]) => ({
      code: code as OneirosLanguageCode,
      score: tokens.reduce((score, token) => score + (markers.has(token) ? 1 : 0), 0),
    }))
    .sort((a, b) => b.score - a.score);
  const [first, second] = ranked;
  if (!first || first.score < 2 || first.score <= (second?.score ?? 0)) return null;
  return first.code;
}

/**
 * A brief reply such as "yes", an emoji, or punctuation should not reset the
 * conversation language. This selects the source text; it never guesses a
 * language from script.
 */
export function isSubstantiveReflectiveLanguageTurn(value: string): boolean {
  const text = clean(value);
  if (!text) return false;
  const letters = [...text].filter((character) => /\p{L}/u.test(character)).length;
  const words = text.split(/\s+/u).filter(Boolean).length;
  return letters >= 12 || words >= 3;
}

function latestEstablishedLanguageCode(
  conversation: ReflectiveLanguageConversationMessage[]
): OneirosLanguageCode | null {
  for (let index = conversation.length - 1; index >= 0; index -= 1) {
    const code = normalizeOneirosLanguageCode(
      conversation[index].reflectiveQuestion?.languageCode
    );
    if (code) return code;
  }

  for (let index = conversation.length - 1; index >= 0; index -= 1) {
    const message = conversation[index];
    if (message.role !== 'user' || !isSubstantiveReflectiveLanguageTurn(message.content)) {
      continue;
    }
    const code = detectOneirosLanguageCode(message.content);
    if (code) return code;
  }
  return null;
}

export function buildInitialReflectiveLanguageContext(params: {
  dreamContent: string;
  knownLanguageCode?: string | null;
}): ReflectiveLanguageContext {
  return {
    source: 'dream_narrative',
    sourceText: clean(params.dreamContent),
    expectedLanguageCode:
      normalizeOneirosLanguageCode(params.knownLanguageCode) ??
      detectOneirosLanguageCode(params.dreamContent),
  };
}

export function buildChatReflectiveLanguageContext(params: {
  dreamContent: string;
  conversation: ReflectiveLanguageConversationMessage[];
  latestUserMessage?: string | null;
  knownLanguageCode?: string | null;
}): ReflectiveLanguageContext {
  const latest = clean(params.latestUserMessage);
  if (latest && isSubstantiveReflectiveLanguageTurn(latest)) {
    const detectedLatest = detectOneirosLanguageCode(latest);
    const established =
      latestEstablishedLanguageCode(params.conversation) ??
      normalizeOneirosLanguageCode(params.knownLanguageCode) ??
      detectOneirosLanguageCode(params.dreamContent);
    return {
      source: 'latest_substantive_user_turn',
      sourceText: latest,
      expectedLanguageCode: detectedLatest ?? established,
    };
  }

  const established =
    latestEstablishedLanguageCode(params.conversation) ??
    normalizeOneirosLanguageCode(params.knownLanguageCode);
  if (established) {
    return {
      source: 'established_conversation_language',
      sourceText: latest || clean(params.dreamContent),
      expectedLanguageCode: established,
    };
  }

  return buildInitialReflectiveLanguageContext({
    dreamContent: params.dreamContent,
  });
}

export function buildReflectiveLanguageInstruction(
  context: ReflectiveLanguageContext,
  options: { includeOutputLanguageTag?: boolean } = {}
): string {
  const expected = context.expectedLanguageCode;
  const selection = expected
    ? `Use the established output language ${getOneirosLanguageName(expected)} (${expected}).`
    : 'Infer the primary language of LANGUAGE SOURCE and use that language.';

  return `OUTPUT LANGUAGE CONTRACT v${REFLECTIVE_LANGUAGE_CONTRACT_VERSION}:
- ${selection}
${options.includeOutputLanguageTag === false
  ? ''
  : '- Return output_language as exactly one supported ISO code: en, el, es, fr, de, it, pt, nl, pl, ru, ja, or zh.\n'}
- Write the complete user-facing prose in that language, with natural spoken syntax rather than translated English scaffolding.
- Preserve short quoted words or names from another language as written; they do not change the output language.
- Do not infer psychological meaning from language choice or code-switching.

LANGUAGE SOURCE (${context.source}):
${context.sourceText || '(no usable source text)'}`;
}

export function languageContextAcceptsOutput(
  context: ReflectiveLanguageContext,
  outputLanguage: OneirosLanguageCode
): boolean {
  return !context.expectedLanguageCode || context.expectedLanguageCode === outputLanguage;
}

export type ReflectiveOutputLanguageAudit = {
  expectedLanguageCode: OneirosLanguageCode | null;
  detectedLanguageCode: OneirosLanguageCode | null;
  valid: boolean;
};

/**
 * Runtime language check for prose responses that keep UI headings in English.
 * A resolved contract fails closed when the response cannot be identified.
 */
export function auditReflectiveOutputLanguage(
  content: string,
  context: ReflectiveLanguageContext
): ReflectiveOutputLanguageAudit {
  const prose = content
    .replace(/<!--END_DREAM_(?:READING|ESSAY)-->/gu, '')
    .split(/\r?\n/u)
    .filter((line) => !/^\s{0,3}#{1,6}\s+/u.test(line))
    .join('\n')
    .trim();
  const detectedLanguageCode = detectOneirosLanguageCode(prose);
  const expectedLanguageCode = context.expectedLanguageCode;
  return {
    expectedLanguageCode,
    detectedLanguageCode,
    valid: !expectedLanguageCode || detectedLanguageCode === expectedLanguageCode,
  };
}
