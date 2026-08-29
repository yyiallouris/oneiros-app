export type SameCallQuestionSurface = 'quick' | 'standard' | 'advanced' | 'chat' | 'essay';

export const SAME_CALL_QUESTION_CARDINALITY = {
  quick: 1,
  standard: 2,
  advanced: 2,
  chat: 1,
  essay: 2,
} as const;

const REFLECTIVE_QUESTIONS_HEADING = /^#{1,6}\s*reflective questions\s*$/iu;
const NEXT_HEADING = /^#{1,6}\s+\S/u;
const BULLET = /^\s*(?:[-*+]|\d+[.)])\s+(.*\S)\s*$/u;
const UNNUMBERED_BULLET = /^\s*[-*+]\s+(.*\S)\s*$/u;
const TERMINAL_INTERROGATIVE = /[?？؟;]$/u;

export const REFLECTIVE_QUESTION_STRUCTURE_NORMALIZER_VERSION =
  'oneiros-reflective-question-structure-normalizer-v1.0.0' as const;

export const REFLECTIVE_QUESTION_RUNTIME_BUNDLE_IDENTITY =
  'oneiros-reflective-questions-runtime-v1.0.3+structure-v1.0.0' as const;

export const REFLECTIVE_QUESTION_STRUCTURE_NORMALIZER_OPERATION =
  'insert_missing_reflective_questions_heading' as const;

export type ReflectiveQuestionStructureNormalization = {
  applied: boolean;
  operation: typeof REFLECTIVE_QUESTION_STRUCTURE_NORMALIZER_OPERATION | null;
  normalizer_version: typeof REFLECTIVE_QUESTION_STRUCTURE_NORMALIZER_VERSION;
};

export type CompletedReflectiveQuestionStructureNormalization = {
  content: string;
  normalization: ReflectiveQuestionStructureNormalization;
};

export type SameCallQuestionContractIssue =
  | 'unexpected_reflective_questions_heading'
  | 'missing_reflective_questions_heading'
  | 'duplicate_reflective_questions_heading'
  | 'question_count_mismatch'
  | 'question_not_interrogative'
  | 'compound_question'
  | 'manufactured_answer_menu'
  | 'content_after_reflective_questions';

type SameCallQuestionContractOptions = {
  isFinalChat?: boolean;
  languageCode?: string | null;
};

export type SameCallQuestionContractValidation = {
  valid: boolean;
  expectedCount: number;
  actualCount: number;
  questions: string[];
  issues: SameCallQuestionContractIssue[];
};

export function expectedSameCallQuestionCount(
  surface: SameCallQuestionSurface,
  options: SameCallQuestionContractOptions = {}
): number {
  if (surface === 'chat' && options.isFinalChat) return 0;
  return SAME_CALL_QUESTION_CARDINALITY[surface];
}

function stripEndMarker(text: string): string {
  return text.replace(/<!--END_DREAM_(?:READING|ESSAY)-->/gu, '').trim();
}

function bulletText(line: string): string | null {
  const match = line.match(BULLET);
  if (!match) return null;
  return match[1].replace(/\s+/gu, ' ').trim();
}

export function extractReflectiveQuestionSection(markdown: string): string[] {
  const lines = stripEndMarker(markdown).split(/\r?\n/u);
  const start = lines.findIndex((line) => REFLECTIVE_QUESTIONS_HEADING.test(line.trim()));
  if (start < 0) return [];

  const questions: string[] = [];
  for (const line of lines.slice(start + 1)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (NEXT_HEADING.test(trimmed) && !REFLECTIVE_QUESTIONS_HEADING.test(trimmed)) break;
    const text = bulletText(trimmed);
    if (text) questions.push(text);
  }
  return questions;
}

export function extractTerminalInterrogative(text: string): string | null {
  const paragraphs = stripEndMarker(text)
    .split(/\n\s*\n/u)
    .map((part) => part.replace(/\s+/gu, ' ').trim())
    .filter(Boolean);
  if (paragraphs.length === 0) return null;

  const lastParagraph = paragraphs[paragraphs.length - 1];
  if (REFLECTIVE_QUESTIONS_HEADING.test(lastParagraph)) return null;

  const sentences = lastParagraph
    .split(/(?<=[?？؟;.!])\s+/u)
    .map((part) => part.trim())
    .filter(Boolean);
  const lastSentence = sentences[sentences.length - 1] ?? lastParagraph;
  if (!TERMINAL_INTERROGATIVE.test(lastSentence)) return null;
  return lastSentence;
}

export function extractSameCallReflectiveQuestions(
  markdown: string,
  surface: SameCallQuestionSurface,
  options: SameCallQuestionContractOptions = {}
): string[] {
  if (surface === 'chat' && options.isFinalChat) return [];
  if (surface === 'quick' || surface === 'chat') {
    const question = extractTerminalInterrogative(markdown);
    return question ? [question] : [];
  }
  return extractReflectiveQuestionSection(markdown);
}

function interrogativeMarkCount(value: string): number {
  const explicit = value.match(/[?？؟]/gu)?.length ?? 0;
  const greekSemicolons = value
    .split(';')
    .slice(0, -1)
    .filter((segment) => /\p{Script=Greek}/u.test(segment.slice(-240))).length;
  return explicit + greekSemicolons;
}

function endsInterrogatively(value: string): boolean {
  const withoutClosingPunctuation = value.trim().replace(/[\s"'”’»）)\]]+$/gu, '');
  if (/[?？؟]$/u.test(withoutClosingPunctuation)) return true;
  return /\p{Script=Greek}[^;]*;$/u.test(withoutClosingPunctuation);
}

function noQuestionStructureNormalization(
  content: string
): CompletedReflectiveQuestionStructureNormalization {
  return {
    content,
    normalization: {
      applied: false,
      operation: null,
      normalizer_version: REFLECTIVE_QUESTION_STRUCTURE_NORMALIZER_VERSION,
    },
  };
}

function uniformNewlineSequence(value: string): '\n' | '\r\n' | null {
  const withoutCrLf = value.replace(/\r\n/gu, '');
  if (withoutCrLf.includes('\r')) return null;
  const hasCrLf = value.includes('\r\n');
  const hasBareLf = withoutCrLf.includes('\n');
  if (hasCrLf && hasBareLf) return null;
  return hasCrLf ? '\r\n' : '\n';
}

function previousNonEmptyLineIndex(lines: string[], fromExclusive: number): number {
  for (let index = fromExclusive - 1; index >= 0; index -= 1) {
    if (lines[index].trim()) return index;
  }
  return -1;
}

/**
 * Repairs one unambiguous completed-output formatting miss: Standard/Advanced
 * already ended with exactly two question bullets, but omitted the literal
 * English section heading. Model-owned prose and question bytes are untouched.
 * Every ambiguous or incomplete shape is a byte-identical no-op.
 */
export function normalizeCompletedReflectiveQuestionStructure(params: {
  content: string;
  surface: SameCallQuestionSurface;
  requiredEndMarker: string;
}): CompletedReflectiveQuestionStructureNormalization {
  const { content, surface, requiredEndMarker } = params;
  const noOp = () => noQuestionStructureNormalization(content);

  if (surface !== 'standard' && surface !== 'advanced') return noOp();
  if (!requiredEndMarker) return noOp();

  const markerIndex = content.indexOf(requiredEndMarker);
  if (
    markerIndex < 0 ||
    markerIndex !== content.lastIndexOf(requiredEndMarker) ||
    content.slice(markerIndex + requiredEndMarker.length).trim()
  ) {
    return noOp();
  }

  const visible = content.slice(0, markerIndex);
  const newline = uniformNewlineSequence(visible);
  if (!newline) return noOp();

  const lines = visible.split(newline);
  if (lines.some((line) => REFLECTIVE_QUESTIONS_HEADING.test(line.trim()))) return noOp();

  const dreamMovementIndexes = lines
    .map((line, index) => line.trim() === '## Dream Movement' ? index : -1)
    .filter((index) => index >= 0);
  if (dreamMovementIndexes.length !== 1) return noOp();
  const dreamMovementIndex = dreamMovementIndexes[0];

  const secondQuestionIndex = previousNonEmptyLineIndex(lines, lines.length);
  if (secondQuestionIndex < 0) return noOp();
  const firstQuestionIndex = previousNonEmptyLineIndex(lines, secondQuestionIndex);
  if (firstQuestionIndex < 0 || firstQuestionIndex + 1 !== secondQuestionIndex) return noOp();
  if (dreamMovementIndex >= firstQuestionIndex) return noOp();

  const firstQuestionLine = lines[firstQuestionIndex];
  const secondQuestionLine = lines[secondQuestionIndex];
  if (
    !UNNUMBERED_BULLET.test(firstQuestionLine) ||
    !UNNUMBERED_BULLET.test(secondQuestionLine)
  ) {
    return noOp();
  }

  const precedingContentIndex = previousNonEmptyLineIndex(lines, firstQuestionIndex);
  if (precedingContentIndex <= dreamMovementIndex || BULLET.test(lines[precedingContentIndex])) {
    return noOp();
  }

  const bodyLines = lines.slice(dreamMovementIndex + 1, firstQuestionIndex);
  if (
    bodyLines.some((line) => NEXT_HEADING.test(line.trim())) ||
    bodyLines.some((line) => BULLET.test(line.trim()))
  ) {
    return noOp();
  }

  const firstQuestion = bulletText(firstQuestionLine);
  const secondQuestion = bulletText(secondQuestionLine);
  if (!firstQuestion || !secondQuestion) return noOp();
  if (
    !endsInterrogatively(firstQuestion) ||
    !endsInterrogatively(secondQuestion) ||
    interrogativeMarkCount(firstQuestion) !== 1 ||
    interrogativeMarkCount(secondQuestion) !== 1 ||
    interrogativeMarkCount(visible) !== 2
  ) {
    return noOp();
  }

  const insertionIndex =
    lines.slice(0, firstQuestionIndex).join(newline).length + newline.length;
  if (!visible.slice(0, insertionIndex).endsWith(`${newline}${newline}`)) return noOp();

  const headingInsertion = `## Reflective Questions${newline}${newline}`;
  const normalizedContent =
    content.slice(0, insertionIndex) + headingInsertion + content.slice(insertionIndex);
  const extracted = extractReflectiveQuestionSection(normalizedContent);
  if (
    extracted.length !== 2 ||
    extracted[0] !== firstQuestion ||
    extracted[1] !== secondQuestion
  ) {
    return noOp();
  }

  return {
    content: normalizedContent,
    normalization: {
      applied: true,
      operation: REFLECTIVE_QUESTION_STRUCTURE_NORMALIZER_OPERATION,
      normalizer_version: REFLECTIVE_QUESTION_STRUCTURE_NORMALIZER_VERSION,
    },
  };
}

const ANSWER_MENU_DISJUNCTION_BY_LANGUAGE: Record<string, RegExp> = {
  en: /\bor\b/iu,
  el: /(?:^|\s)ή(?=\s|$)/iu,
  es: /(?:^|\s)o(?=\s|$)/iu,
  fr: /\bou\b/iu,
  de: /\boder\b/iu,
  it: /(?:^|\s)o(?=\s|$)/iu,
  pt: /\bou\b/iu,
  nl: /\bof\b/iu,
  pl: /\b(?:albo|lub)\b/iu,
  ru: /(?:^|\s)или(?=\s|$)/iu,
  ja: /(?:それとも|または)/u,
  zh: /(?:还是|或者|或是)/u,
};

const GENERIC_ANSWER_MENU_DISJUNCTION =
  /\b(?:or|ou|oder|of|albo|lub)\b|(?:^|\s)(?:ή|или)(?=\s|$)|(?:それとも|または|还是|或者|或是)/iu;

/**
 * Conservative lexical/syntax firewall for the approved no-menu safeguard.
 * It is not a semantic judge: any disjunction in the expected language, or a
 * colon/dash followed by a comma-list, causes the whole response to retry.
 */
function hasManufacturedAnswerMenu(
  question: string,
  languageCode?: string | null
): boolean {
  const disjunction = languageCode
    ? ANSWER_MENU_DISJUNCTION_BY_LANGUAGE[languageCode.toLowerCase()]
    : GENERIC_ANSWER_MENU_DISJUNCTION;
  if (disjunction?.test(question)) return true;
  if (languageCode?.toLowerCase() === 'pl') {
    const polishCzyCount = question.match(/\bczy\b/giu)?.length ?? 0;
    if (polishCzyCount > 1 || (polishCzyCount === 1 && !/^\s*czy\b/iu.test(question))) {
      return true;
    }
  }

  const listTail = question.split(/[:—–]/u).slice(1).join(' ');
  return (listTail.match(/,/gu)?.length ?? 0) >= 2;
}

/**
 * Deterministic structure check only. It never judges semantics, blocks
 * delivery, retries generation, or creates/repairs a question.
 */
export function validateSameCallQuestionContract(
  markdown: string,
  surface: SameCallQuestionSurface,
  options: SameCallQuestionContractOptions = {}
): SameCallQuestionContractValidation {
  const expectedCount = expectedSameCallQuestionCount(surface, options);
  const stripped = stripEndMarker(markdown);
  const lines = stripped.split(/\r?\n/u);
  const headingIndexes = lines
    .map((line, index) => REFLECTIVE_QUESTIONS_HEADING.test(line.trim()) ? index : -1)
    .filter((index) => index >= 0);
  const issues: SameCallQuestionContractIssue[] = [];
  let questions: string[] = [];

  if (surface === 'standard' || surface === 'advanced' || surface === 'essay') {
    if (headingIndexes.length === 0) issues.push('missing_reflective_questions_heading');
    if (headingIndexes.length > 1) issues.push('duplicate_reflective_questions_heading');
    questions = extractReflectiveQuestionSection(stripped);

    if (headingIndexes.length === 1) {
      const trailingLines = lines.slice(headingIndexes[0] + 1).filter((line) => line.trim());
      if (trailingLines.some((line) => bulletText(line.trim()) === null)) {
        issues.push('content_after_reflective_questions');
      }
    }
    if (interrogativeMarkCount(stripped) !== expectedCount) {
      issues.push('question_count_mismatch');
    }
  } else {
    if (headingIndexes.length > 0) issues.push('unexpected_reflective_questions_heading');
    const terminal = extractTerminalInterrogative(stripped);
    questions = terminal ? [terminal] : [];
    if (interrogativeMarkCount(stripped) !== expectedCount) {
      issues.push('question_count_mismatch');
    }
  }

  if (questions.length !== expectedCount && !issues.includes('question_count_mismatch')) {
    issues.push('question_count_mismatch');
  }
  for (const question of questions) {
    const markCount = interrogativeMarkCount(question);
    if (!endsInterrogatively(question) || markCount === 0) {
      issues.push('question_not_interrogative');
    } else if (markCount > 1) {
      issues.push('compound_question');
    }
    if (hasManufacturedAnswerMenu(question, options.languageCode)) {
      issues.push('manufactured_answer_menu');
    }
  }

  return {
    valid: issues.length === 0,
    expectedCount,
    actualCount: questions.length,
    questions,
    issues: [...new Set(issues)],
  };
}

export function normalizeReflectiveQuestions(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const questions = value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.replace(/\s+/gu, ' ').trim())
    .filter(Boolean);
  return questions.length > 0 ? questions : undefined;
}

export function questionsAlreadyInContent(
  content: string,
  questions: string[]
): boolean {
  if (questions.length === 0) return true;
  const haystack = content.replace(/\s+/gu, ' ');
  return questions.every((question) => haystack.includes(question.replace(/\s+/gu, ' ')));
}
