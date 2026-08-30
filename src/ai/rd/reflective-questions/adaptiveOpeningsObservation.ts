import { END_MARKER_DREAM_READING } from '../../dreamReflectionPrompt';
import {
  extractSameCallReflectiveQuestions,
  validateSameCallQuestionContract,
} from '../../reflectiveQuestionExtract';
import { safeObserveReflectiveContract } from '../../reflectiveContractObservation';
import type { ReflectiveLanguageContext } from '../../reflectiveLanguage';

export const ADAPTIVE_OPENINGS_OBSERVER_VERSION =
  'oneiros-adaptive-reflective-openings-observer-v0.1.1' as const;

export type AdaptiveOpeningSurface = 'quick' | 'standard' | 'advanced';

export type AdaptiveOpeningsObservation = {
  passed: boolean;
  issues: string[];
  observer_version: typeof ADAPTIVE_OPENINGS_OBSERVER_VERSION;
  surface: AdaptiveOpeningSurface;
  expected_question_range: { min: number; max: number };
  question_count: number;
  questions: string[];
  heading_count: number;
  prose_question_count: number;
  end_marker_present: boolean;
  production_shadow: ReturnType<typeof safeObserveReflectiveContract>;
};

function stripEndMarker(text: string): string {
  return text.replace(END_MARKER_DREAM_READING, '').trim();
}

function extractJapaneseTerminalQuestion(text: string): string | null {
  const paragraphs = stripEndMarker(text)
    .split(/\n\s*\n/u)
    .map((part) => part.replace(/\s+/gu, ' ').trim())
    .filter(Boolean);
  const finalParagraph = paragraphs[paragraphs.length - 1] ?? '';
  const finalSentence = finalParagraph
    .split(/(?<=[。！？!?])\s*/u)
    .map((part) => part.trim())
    .filter(Boolean)
    .at(-1) ?? finalParagraph;
  return /(?:か|でしょうか|ますか|ですか)[。？?]$/u.test(finalSentence)
    ? finalSentence
    : null;
}

function extractAdaptiveQuestions(
  content: string,
  surface: AdaptiveOpeningSurface,
  languageCode?: string | null
): string[] {
  const productionQuestions = extractSameCallReflectiveQuestions(content, surface);
  if (productionQuestions.length > 0 || surface !== 'quick' || languageCode !== 'ja') {
    return productionQuestions;
  }
  const japaneseQuestion = extractJapaneseTerminalQuestion(content);
  return japaneseQuestion ? [japaneseQuestion] : [];
}

function allJapaneseQuestionsAreInterrogative(questions: string[]): boolean {
  return questions.length > 0 && questions.every(
    (question) => /(?:か|でしょうか|ますか|ですか)[。？?]$/u.test(question.trim())
  );
}

function interrogativeMarkCount(value: string): number {
  const explicit = value.match(/[?？؟]/gu)?.length ?? 0;
  const greekSemicolons = value
    .split(';')
    .slice(0, -1)
    .filter((segment) => /\p{Script=Greek}/u.test(segment.slice(-240))).length;
  return explicit + greekSemicolons;
}

function headingCount(value: string): number {
  return value.match(/^#{1,6}\s*reflective questions\s*$/gimu)?.length ?? 0;
}

function proseQuestionCount(
  value: string,
  surface: AdaptiveOpeningSurface,
  questions: string[]
): number {
  if (surface === 'quick') {
    return Math.max(0, interrogativeMarkCount(stripEndMarker(value)) - questions.length);
  }
  const headingIndex = value.search(/^#{1,6}\s*reflective questions\s*$/imu);
  const prose = headingIndex >= 0 ? value.slice(0, headingIndex) : value;
  return interrogativeMarkCount(stripEndMarker(prose));
}

/**
 * R&D-only structural observer for the adaptive 1–2 contract. It does not
 * normalize, repair, reject, retry, or classify question meaning. The existing
 * production shadow result is retained separately for comparison.
 */
export function observeAdaptiveOpenings(params: {
  content: string;
  surface: AdaptiveOpeningSurface;
  languageContext?: ReflectiveLanguageContext | null;
}): AdaptiveOpeningsObservation {
  const { content, surface } = params;
  const expectedRange = surface === 'quick'
    ? { min: 1, max: 1 }
    : { min: 1, max: 2 };
  const productionShadow = safeObserveReflectiveContract({
    content,
    contractSurface: surface,
    telemetrySurface: surface === 'quick'
      ? 'reading_quick'
      : surface === 'standard'
        ? 'reading_standard'
        : 'reading_advanced',
    languageContext: params.languageContext,
    requiredEndMarker: END_MARKER_DREAM_READING,
  });
  const languageCode = params.languageContext?.expectedLanguageCode ?? null;
  const questions = extractAdaptiveQuestions(content, surface, languageCode);
  const headings = headingCount(content);
  const proseQuestions = proseQuestionCount(content, surface, questions);
  const markerIndex = content.indexOf(END_MARKER_DREAM_READING);
  const markerPresent =
    markerIndex >= 0 &&
    markerIndex === content.lastIndexOf(END_MARKER_DREAM_READING) &&
    !content.slice(markerIndex + END_MARKER_DREAM_READING.length).trim();
  const issues = productionShadow.issues.filter((issue) =>
    issue.startsWith('wrong_output_language:')
  );

  if (!markerPresent) issues.push('missing_or_misplaced_end_marker');
  if (surface === 'quick') {
    if (headings !== 0) issues.push('unexpected_reflective_questions_heading');
  } else if (headings === 0) {
    issues.push('missing_reflective_questions_heading');
  } else if (headings > 1) {
    issues.push('duplicate_reflective_questions_heading');
  }
  if (questions.length < expectedRange.min || questions.length > expectedRange.max) {
    issues.push('adaptive_question_count_mismatch');
  }
  if (proseQuestions > 0) issues.push('extra_question_outside_reflective_opening');

  const adaptiveQuestionValidation = validateSameCallQuestionContract(
    content,
    surface,
    { languageCode }
  );
  for (const issue of adaptiveQuestionValidation.issues) {
    if (issue === 'question_count_mismatch') continue;
    if (
      languageCode === 'ja' &&
      issue === 'question_not_interrogative' &&
      allJapaneseQuestionsAreInterrogative(questions)
    ) {
      continue;
    }
    issues.push(issue);
  }

  const uniqueIssues = [...new Set(issues)];
  return {
    passed: uniqueIssues.length === 0,
    issues: uniqueIssues,
    observer_version: ADAPTIVE_OPENINGS_OBSERVER_VERSION,
    surface,
    expected_question_range: expectedRange,
    question_count: questions.length,
    questions,
    heading_count: headings,
    prose_question_count: proseQuestions,
    end_marker_present: markerPresent,
    production_shadow: productionShadow,
  };
}
