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
const TERMINAL_INTERROGATIVE = /[?？؟;]$/u;

export function expectedSameCallQuestionCount(
  surface: SameCallQuestionSurface,
  options: { isFinalChat?: boolean } = {}
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
  options: { isFinalChat?: boolean } = {}
): string[] {
  if (surface === 'chat' && options.isFinalChat) return [];
  if (surface === 'quick' || surface === 'chat') {
    const question = extractTerminalInterrogative(markdown);
    return question ? [question] : [];
  }
  return extractReflectiveQuestionSection(markdown);
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
