import {
  formatReflectiveDialogueHistory,
  REFLECTIVE_DIALOGUE_PROMPT,
  REFLECTIVE_DIALOGUE_PROMPT_ID,
  REFLECTIVE_DIALOGUE_PROMPT_VERSION,
  type ReflectiveDialogueConversationMessage,
} from './dreamReflectionPrompt';
import { REFLECTIVE_DIALOGUE_RESPONSE_SCHEMA_VERSION } from './reflectiveDialogueResponseFormat';
import { REFLECTIVE_QUESTION_RESPONSE_SCHEMA_VERSION } from './reflectiveQuestionResponseFormat';
import {
  buildReflectiveLanguageInstruction,
  languageContextAcceptsOutput,
  type ReflectiveLanguageContext,
} from './reflectiveLanguage';
import { normalizeOneirosLanguageCode, type OneirosLanguageCode } from '../constants/oneirosLanguages';
import {
  buildDreamEvidenceSpans,
  buildUserEvidenceSpans,
  cleanReflectiveEvidenceText,
  formatDreamEvidenceSpans,
  formatUserEvidenceSpans,
  type DreamEvidenceSpan,
  type UserEvidenceSpan,
} from './reflectiveEvidence';
import {
  REFLECTION_EDITORIAL_ARC_METHOD_ID,
  REFLECTION_EDITORIAL_ARC_METHOD_VERSION,
  REFLECTION_EDITORIAL_ARC_QUESTION_ARTIFACT_SCHEMA_VERSION,
} from './reflectionEditorialArc';
import {
  DREAM_REFLECTION_PROMPT_ID,
  DREAM_REFLECTION_PROMPT_VERSION,
} from './dreamReflectionPrompt';
import {
  REFLECTIVE_QUESTION_PRODUCTION_ARTIFACT_SCHEMA_VERSION,
  REFLECTIVE_QUESTION_PRODUCTION_METHOD_ID,
  REFLECTIVE_QUESTION_PRODUCTION_METHOD_VERSION,
  REFLECTIVE_QUESTION_PRODUCTION_PROMPT_ID,
  REFLECTIVE_QUESTION_PRODUCTION_PROMPT_VERSION,
  type IntegrityCheckDecision,
  type ReflectiveQuestionSource,
} from './reflectiveQuestionPipeline';

export {
  buildDreamEvidenceSpans,
  buildUserEvidenceSpans,
  formatDreamEvidenceSpans,
  formatUserEvidenceSpans,
};
export type { DreamEvidenceSpan, UserEvidenceSpan };

/** Single full-quality call: attend, compose, self-check, then commit. */
export const REFLECTIVE_QUESTION_METHOD_ID = 'oneiros-reflective-question-v5.0.0' as const;
export const REFLECTIVE_QUESTION_METHOD_VERSION = '5.0.0' as const;
export const REFLECTIVE_QUESTION_SCHEMA_VERSION = 6 as const;
export const REFLECTIVE_QUESTION_MODEL_POLICY =
  'full-quality:gpt-5.4;anthropic-fallback:sonnet-then-haiku' as const;
export const REFLECTIVE_QUESTION_PROMPT_ID = 'reflective-question-single-pass-v5.0.0' as const;
export const REFLECTIVE_QUESTION_PROMPT_VERSION = '5.0.0' as const;
export const REFLECTIVE_QUESTION_TEMPERATURE = 0.35 as const;
export const REFLECTIVE_QUESTION_TOKEN_LIMIT = 720 as const;
export const REFLECTIVE_QUESTION_MAX_EVIDENCE_IDS = 3 as const;
export const REFLECTIVE_QUESTION_MIN_WORDS = 6 as const;
export const REFLECTIVE_QUESTION_MAX_WORDS = 36 as const;
export const REFLECTIVE_QUESTION_MAX_CHARS = 280 as const;
export const REFLECTIVE_QUESTION_MIN_CJK_LETTERS = 6 as const;
export const REFLECTIVE_QUESTION_MAX_CJK_LETTERS = 90 as const;
export const REFLECTIVE_QUESTION_COMPOSER_METHOD_ID =
  'oneiros-reflective-question-composer-v1.1.0-candidate' as const;
export const REFLECTIVE_QUESTION_COMPOSER_METHOD_VERSION = '1.1.0-candidate' as const;
export const REFLECTIVE_QUESTION_COMPOSER_PROMPT_ID =
  'oneiros-reflective-question-composer-prompt-v1.1.0-candidate' as const;
export const REFLECTIVE_QUESTION_COMPOSER_PROMPT_VERSION = '1.1.0-candidate' as const;
export const REFLECTIVE_QUESTION_COMPOSER_ARTIFACT_SCHEMA_VERSION = 10 as const;
export const HISTORICAL_REFLECTIVE_QUESTION_COMPOSER_V1_0_1_METHOD_ID =
  'oneiros-reflective-question-composer-v1.0.1-candidate' as const;
export const HISTORICAL_REFLECTIVE_QUESTION_COMPOSER_V1_0_1_PROMPT_ID =
  'oneiros-reflective-question-composer-prompt-v1.0.1-candidate' as const;
export const HISTORICAL_REFLECTIVE_QUESTION_COMPOSER_V1_0_1_VERSION =
  '1.0.1-candidate' as const;
export const HISTORICAL_REFLECTIVE_QUESTION_COMPOSER_V1_0_0_METHOD_ID =
  'oneiros-reflective-question-composer-v1.0.0-candidate' as const;
export const HISTORICAL_REFLECTIVE_QUESTION_COMPOSER_V1_0_0_PROMPT_ID =
  'oneiros-reflective-question-composer-prompt-v1.0.0-candidate' as const;
export const HISTORICAL_REFLECTIVE_QUESTION_COMPOSER_V1_0_0_VERSION =
  '1.0.0-candidate' as const;

export type ReflectiveQuestionSurface = 'initial' | 'chat';
export type ReflectiveQuestionOpeningMode =
  | 'unresolved_relation'
  | 'completed_relation'
  | 'chat_continuation';
export type ReflectiveQuestionRiskFlag =
  | 'unsupported_evidence' | 'unstaged_relation' | 'invented_motive'
  | 'repeats_answered_question' | 'generic_shell' | 'flat_or_clinical'
  | 'compound_question' | 'advice_or_prescription' | 'diagnostic_or_pathologizing'
  | 'waking_life_leap' | 'wrong_language' | 'length_violation'
  | 'ignores_user_turn' | 'forced_choice' | 'dream_continuation_only'
  | 'low_psychological_aliveness';
export type ReflectiveQuestionCommitChecks = {
  shortest_answer_already_supplied: boolean;
  requires_missing_footage: boolean;
  portable_generic_shell: boolean;
  preserves_polarity_and_agency: boolean;
  spoken_native_form: boolean;
};
export type ReflectiveQuestionSinglePassResult = {
  decision: 'question' | 'abstain';
  evidence_ids: string[];
  living_edge: string | null;
  answer_target: string | null;
  opening_mode: ReflectiveQuestionOpeningMode | null;
  question: string | null;
  output_language: OneirosLanguageCode | null;
  commit_checks: ReflectiveQuestionCommitChecks;
  risk_flags: ReflectiveQuestionRiskFlag[];
  abstain_reason: string | null;
};
export type ReflectiveQuestionOutcome =
  | 'committed_question' | 'semantic_abstention'
  | 'deterministic_validation_rejection' | 'provider_failure' | 'language_mismatch';
export type ReflectiveQuestionAbstainReason =
  | 'semantic_abstention' | 'deterministic_validation_rejection'
  | 'provider_failure' | 'language_mismatch' | 'final_chat_reply'
  | 'generator_abstained' | 'validator_abstained' | 'validation_failed'
  | 'generation_unavailable';
type ArtifactBase = {
  id: string;
  surface: ReflectiveQuestionSurface;
  evidenceIds: string[];
  createdAt: string;
};
export type ReflectiveQuestionArtifactV6 = ArtifactBase & {
  status: 'question' | 'abstained';
  question: string | null;
  languageCode: OneirosLanguageCode | null;
  abstainReason: Extract<
    ReflectiveQuestionAbstainReason,
    'semantic_abstention' | 'deterministic_validation_rejection' |
    'provider_failure' | 'language_mismatch' | 'final_chat_reply'
  > | null;
  methodId: typeof REFLECTIVE_QUESTION_METHOD_ID;
  methodVersion: typeof REFLECTIVE_QUESTION_METHOD_VERSION;
  promptId: typeof REFLECTIVE_QUESTION_PROMPT_ID;
  promptVersion: typeof REFLECTIVE_QUESTION_PROMPT_VERSION;
  schemaVersion: 6;
};
export type ReflectiveQuestionArtifactV7 = ArtifactBase & {
  status: 'question' | 'abstained';
  surface: 'initial';
  question: string | null;
  languageCode: OneirosLanguageCode | null;
  abstainReason: Extract<
    ReflectiveQuestionAbstainReason,
    'deterministic_validation_rejection' | 'language_mismatch'
  > | null;
  methodId: 'oneiros-reflection-editorial-arc-v1.0.0-candidate';
  methodVersion: '1.0.0-candidate';
  promptId: 'oneiros-dream-reflection-v3.0.0-candidate';
  promptVersion: '3.0.0-candidate';
  schemaVersion: 7;
};
export type ReflectiveQuestionArtifactV8 = ArtifactBase & {
  status: 'question' | 'no_question' | 'rejected';
  surface: 'initial';
  question: string | null;
  languageCode: OneirosLanguageCode | null;
  abstainReason: Extract<
    ReflectiveQuestionAbstainReason,
    'deterministic_validation_rejection' | 'language_mismatch'
  > | null;
  methodId: typeof REFLECTION_EDITORIAL_ARC_METHOD_ID;
  methodVersion: typeof REFLECTION_EDITORIAL_ARC_METHOD_VERSION;
  promptId: typeof DREAM_REFLECTION_PROMPT_ID;
  promptVersion: typeof DREAM_REFLECTION_PROMPT_VERSION;
  schemaVersion: typeof REFLECTION_EDITORIAL_ARC_QUESTION_ARTIFACT_SCHEMA_VERSION;
};
export type ReflectiveQuestionComposerKind = 'relation' | 'image' | 'completion';
export type ReflectiveQuestionComposerDepth = 'core' | 'deeper';
export type HistoricalReflectiveQuestionComposerDepth =
  | ReflectiveQuestionComposerDepth
  | 'standard';
export type ReflectiveQuestionComposerSource = 'model' | 'fallback';
export type ReflectiveQuestionArtifactV11 = ArtifactBase & {
  status: 'question';
  surface: 'initial';
  question: string;
  languageCode: OneirosLanguageCode;
  depth: 'core' | 'deeper';
  source: ReflectiveQuestionSource;
  questionMode: 'CORE' | 'DEEPER';
  generatorGateDecision: IntegrityCheckDecision | null;
  repairGateDecision: IntegrityCheckDecision | null;
  generatorPremiseDecision: IntegrityCheckDecision | null;
  repairPremiseDecision: IntegrityCheckDecision | null;
  gateViolationCategories: string[];
  abstainReason: null;
  methodId: typeof REFLECTIVE_QUESTION_PRODUCTION_METHOD_ID;
  methodVersion: typeof REFLECTIVE_QUESTION_PRODUCTION_METHOD_VERSION;
  promptId: typeof REFLECTIVE_QUESTION_PRODUCTION_PROMPT_ID;
  promptVersion: typeof REFLECTIVE_QUESTION_PRODUCTION_PROMPT_VERSION;
  schemaVersion: typeof REFLECTIVE_QUESTION_PRODUCTION_ARTIFACT_SCHEMA_VERSION;
};
export type ReflectiveQuestionArtifactV10 = ArtifactBase & {
  status: 'question';
  surface: 'initial';
  question: string;
  languageCode: OneirosLanguageCode;
  depth: HistoricalReflectiveQuestionComposerDepth;
  source: ReflectiveQuestionComposerSource;
  abstainReason: null;
  methodId: string;
  methodVersion: string;
  promptId: string;
  promptVersion: string;
  schemaVersion: typeof REFLECTIVE_QUESTION_COMPOSER_ARTIFACT_SCHEMA_VERSION;
};
export type ReflectiveQuestionArtifactV9 = ArtifactBase & {
  status: 'question';
  surface: 'initial';
  kind: ReflectiveQuestionComposerKind;
  question: string;
  languageCode: OneirosLanguageCode;
  depth: HistoricalReflectiveQuestionComposerDepth;
  source: ReflectiveQuestionComposerSource;
  abstainReason: null;
  methodId: string;
  methodVersion: string;
  promptId: string;
  promptVersion: string;
  schemaVersion: 9;
};
export type LegacyReflectiveQuestionArtifact = ArtifactBase & {
  status: 'question' | 'abstain';
  question?: string;
  languageCode?: OneirosLanguageCode;
  abstainReason?: ReflectiveQuestionAbstainReason;
  generatorPromptId: string;
  generatorPromptVersion: string;
  validatorPromptId: string;
  validatorPromptVersion: string;
  schemaVersion: 1 | 2 | 3 | 4 | 5;
};
export type ReflectiveQuestionArtifact =
  | ReflectiveQuestionArtifactV11
  | ReflectiveQuestionArtifactV10
  | ReflectiveQuestionArtifactV9
  | ReflectiveQuestionArtifactV8
  | ReflectiveQuestionArtifactV7
  | ReflectiveQuestionArtifactV6
  | LegacyReflectiveQuestionArtifact;
export type ReflectiveQuestionPromptMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

const RISK_FLAGS = new Set<string>([
  'unsupported_evidence', 'unstaged_relation', 'invented_motive',
  'repeats_answered_question', 'generic_shell', 'flat_or_clinical',
  'compound_question', 'advice_or_prescription', 'diagnostic_or_pathologizing',
  'waking_life_leap', 'wrong_language', 'length_violation', 'ignores_user_turn',
  'forced_choice', 'dream_continuation_only', 'low_psychological_aliveness',
]);
const OPENING_MODES = new Set<string>([
  'unresolved_relation', 'completed_relation', 'chat_continuation',
]);
const CURRENT_ABSTAIN_REASONS = new Set<string>([
  'semantic_abstention', 'deterministic_validation_rejection', 'provider_failure',
  'language_mismatch', 'final_chat_reply',
]);
const LEGACY_ABSTAIN_REASONS = new Set<string>([
  'generator_abstained', 'validator_abstained', 'validation_failed',
  'generation_unavailable', 'final_chat_reply',
]);

const LEGACY_VERSION_SCHEMAS: Record<string, 1 | 2 | 3 | 4 | 5> = {
  '2.0.0': 1, '2.1.0': 1, '2.2.0': 1, '2.3.0': 2, '2.3.1': 2,
  '2.4.0': 3, '2.5.0': 4, '2.5.1': 4, '2.6.0': 4, '2.6.1': 4,
  '2.7.0': 4, '2.8.0': 4, '2.9.0': 4, '3.0.0': 4, '3.1.0': 4,
  '3.2.0': 4, '4.0.0': 5, '4.1.0': 5,
};

const cleanText = cleanReflectiveEvidenceText;

export const REFLECTIVE_QUESTION_PROMPT = `
You are the Oneiros reflective-question engine. Work in one pass: attend,
compose, test, and only then commit. Return no explanatory prose.

PURPOSE
Offer one warm, spoken question that lets the dreamer meet something still
alive in this exact dream. Do not perform therapy, symbol decoding, coaching,
or an interpretation exercise.

EVIDENCE BOUNDARY
- Initial evidence is D# only. Chat evidence is D# plus user-authored U#.
- The provisional reading or answer may orient attention, but cannot add a
  relation, motive, state, symbolic fact, or psychological movement.
- Every premise must remain defensible from evidence_ids. Preserve who did
  what, negation, direction, time, and agency.
- Absence and non-event are not evidence of defense, numbness, hidden lack, or
  latent significance.

OPENING
Choose one concrete verb, gesture, reversal, impossible coexistence, threshold,
silence, waiting, affect, or relation already staged in the evidence. Let that
movement carry the question. answer_target names exactly what a useful new
first-person answer would reveal; it cannot be generic feeling or significance.

Use unresolved_relation for an unresolved field. For a peaceful, coherent, or
already-complete dream use completed_relation: open one unspoken relation that
is already visible in D#, without re-asking the stated feeling or inventing
unfinished business. Do not force a pairing of symbols; one image and the
dreamer's staged stance can be enough. Use chat_continuation only when the
latest U# genuinely opens a next movement.

COMPOSITION
- One question, one psychological movement, natural spoken target-language form.
- Prefer one image/action/relation and roughly 10–24 words where word counting
  is natural. Never pad.
- Ask for new first-person experience, not missing footage, an imagined next
  scene, a supplied choice, advice, waking-life application, or hidden cause.
- Safety does not compensate for sterility. Noun overlap is not specificity.

PRIVATE COMMIT TESTS — revise inside this same pass before returning JSON
1. Shortest-answer: would the shortest honest answer repeat a fact, state,
   feeling, correction, or answer already supplied?
2. Camera: does the question require an unstaged action, relation, or transition?
3. Portable shell: without its dream nouns, does it collapse into a reusable
   felt-quality or significance question?
4. Polarity and agency: did subject, action, negation, direction, or time change?
5. Spoken form: would a native speaker naturally ask it aloud in one breath?
Revise any failure before committing; abstain only when a safe opening remains unavailable.

SURFACE CONTRACT
- Initial is a product surface that normally ends with exactly one question.
  Quietness, ordinariness, joy, coherence, and completion are not reasons to
  abstain; use completed_relation without manufacturing a problem.
- Chat may return zero or one question. Abstain when the movement is complete
  or any question would repeat what has already been said.

OUTPUT
Return one JSON object with decision, evidence_ids, living_edge, answer_target,
opening_mode, question, output_language, commit_checks, risk_flags, and
abstain_reason. For question, the first three check booleans are false, the last
two are true, risk_flags is [], and abstain_reason is null. For abstain, return
evidence_ids:[], all nullable content fields null, and a brief reason.
`;

const INITIAL_SURFACE_CONTRACT =
  'INITIAL PRODUCT CONSTRAINT: normally commit exactly one question. Use completed_relation for peaceful or coherent material; do not create unfinished business.';
const CHAT_SURFACE_CONTRACT =
  'CHAT CONSTRAINT: commit zero or one question. Continue only a latest user-authored U# movement; mature completion is valid.';
const INITIAL_READING_ORIENTATION_CONTRACT =
  'PROVISIONAL INITIAL READING — orientation only, never evidence. No claim found only here may become a question premise.';
export const INITIAL_READING_ORIENTATION_STRATEGY =
  'core-opening-before-dream-movement;max-1800;fallback-leading-1200' as const;
export function buildInitialReadingOrientationExcerpt(value: string): string {
  const reading = value.trim();
  if (!reading) return '';
  const index = reading.search(/\n## Dream Movement\b/u);
  return index > 0 ? reading.slice(0, Math.min(index, 1800)).trim() : reading.slice(0, 1200).trim();
}
export const REFLECTIVE_QUESTION_PRODUCTION_BUNDLE = [
  REFLECTIVE_DIALOGUE_PROMPT_ID, REFLECTIVE_DIALOGUE_PROMPT_VERSION,
  String(REFLECTIVE_DIALOGUE_RESPONSE_SCHEMA_VERSION), REFLECTIVE_DIALOGUE_PROMPT,
  REFLECTIVE_QUESTION_METHOD_ID, REFLECTIVE_QUESTION_METHOD_VERSION,
  REFLECTIVE_QUESTION_MODEL_POLICY, String(REFLECTIVE_QUESTION_SCHEMA_VERSION),
  String(REFLECTIVE_QUESTION_RESPONSE_SCHEMA_VERSION), REFLECTIVE_QUESTION_PROMPT_ID,
  REFLECTIVE_QUESTION_PROMPT_VERSION, REFLECTIVE_QUESTION_PROMPT,
  INITIAL_SURFACE_CONTRACT, CHAT_SURFACE_CONTRACT,
  INITIAL_READING_ORIENTATION_CONTRACT, INITIAL_READING_ORIENTATION_STRATEGY,
].join('\n---ONEIROS-RQ-V5---\n');

export function buildReflectiveQuestionMessages(params: {
  surface: ReflectiveQuestionSurface;
  languageContext: ReflectiveLanguageContext;
  evidenceSpans: DreamEvidenceSpan[];
  userEvidenceSpans?: UserEvidenceSpan[];
  initialReadingContext?: string;
  chatAnswerContext?: string;
  conversation?: ReflectiveDialogueConversationMessage[];
  latestUserMessage?: string;
}): ReflectiveQuestionPromptMessage[] {
  const conversationMessages = params.conversation ?? [];
  const conversation = formatReflectiveDialogueHistory(conversationMessages, 8);
  const userEvidence = params.surface === 'chat'
    ? params.userEvidenceSpans ?? buildUserEvidenceSpans(conversationMessages, params.latestUserMessage)
    : [];
  const provisional = params.surface === 'chat' && cleanText(params.chatAnswerContext)
    ? `\n\nPROVISIONAL CHAT ANSWER — orientation only, never evidence:\n${params.chatAnswerContext!.slice(0, 7000)}`
    : params.surface === 'initial' && cleanText(params.initialReadingContext)
      ? `\n\n${INITIAL_READING_ORIENTATION_CONTRACT}\n${buildInitialReadingOrientationExcerpt(params.initialReadingContext!)}`
      : '';
  const user = `Surface: ${params.surface}
${params.surface === 'initial' ? INITIAL_SURFACE_CONTRACT : CHAT_SURFACE_CONTRACT}

${buildReflectiveLanguageInstruction(params.languageContext)}

RAW DREAM EVIDENCE (D#):
${formatDreamEvidenceSpans(params.evidenceSpans)}

USER-CONFIRMED FIRST-PERSON EVIDENCE (U#; chat only):
${userEvidence.length ? formatUserEvidenceSpans(userEvidence) : '(none)'}
${provisional}
${conversation ? `\n\nRECENT ROLE-PRESERVED CONVERSATION — assistant material remains provisional:\n${conversation.slice(0, 5000)}` : ''}

Complete the one-pass method privately, then return strict JSON.`;
  return [{ role: 'system', content: REFLECTIVE_QUESTION_PROMPT }, { role: 'user', content: user }];
}

function parseObject(content: string): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(content.trim().replace(/^```json\s*/iu, '').replace(/```$/u, '')) as unknown;
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? parsed as Record<string, unknown> : null;
  } catch { return null; }
}
function parseEvidenceIds(value: unknown): string[] | null {
  if (!Array.isArray(value) || value.length > REFLECTIVE_QUESTION_MAX_EVIDENCE_IDS) return null;
  const ids = value.map(cleanText);
  return ids.some((id) => !/^[DU][1-9]\d*$/u.test(id)) ? null : [...new Set(ids)];
}
function parseRiskFlags(value: unknown): ReflectiveQuestionRiskFlag[] | null {
  if (!Array.isArray(value) || value.some((v) => typeof v !== 'string' || !RISK_FLAGS.has(v))) return null;
  return [...new Set(value)] as ReflectiveQuestionRiskFlag[];
}
function parseChecks(value: unknown): ReflectiveQuestionCommitChecks | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const v = value as Record<string, unknown>;
  const keys = ['shortest_answer_already_supplied', 'requires_missing_footage',
    'portable_generic_shell', 'preserves_polarity_and_agency', 'spoken_native_form'] as const;
  if (keys.some((key) => typeof v[key] !== 'boolean')) return null;
  return Object.fromEntries(keys.map((key) => [key, v[key]])) as ReflectiveQuestionCommitChecks;
}
function letterCount(value: string): number {
  return [...value].filter((character) => /\p{L}/u.test(character)).length;
}
export function hasSingleReflectiveQuestionMovement(
  question: string,
  languageCode: OneirosLanguageCode
): boolean {
  const text = cleanText(question);
  if (languageCode === 'el') {
    const movements = text.match(/[;?？]/gu) ?? [];
    return movements.length === 1 && /[;?？]$/u.test(text);
  }
  const marks = text.match(/[?？؟]/gu) ?? [];
  if (languageCode === 'ja') {
    if (marks.length === 1) return /[?？]$/u.test(text);
    if (marks.length > 0) return false;
    const movements = text.match(/か(?:。|$)/gu) ?? [];
    return movements.length === 1 && /か(?:。)?$/u.test(text);
  }
  return marks.length === 1 && /[?？؟]$/u.test(text);
}
export function validateReflectiveQuestionText(question: string, languageCode: OneirosLanguageCode): string[] {
  const text = cleanText(question);
  const errors: string[] = [];
  if (!text || text.length > REFLECTIVE_QUESTION_MAX_CHARS) errors.push('length_violation');
  if (languageCode === 'ja' || languageCode === 'zh') {
    const count = letterCount(text);
    if (count < REFLECTIVE_QUESTION_MIN_CJK_LETTERS || count > REFLECTIVE_QUESTION_MAX_CJK_LETTERS) errors.push('length_violation');
  } else {
    const count = text.split(/\s+/u).filter(Boolean).length;
    if (count < REFLECTIVE_QUESTION_MIN_WORDS || count > REFLECTIVE_QUESTION_MAX_WORDS) errors.push('length_violation');
  }
  if (!hasSingleReflectiveQuestionMovement(text, languageCode) || /\n|^[-*#]/u.test(question.trim())) errors.push('compound_question');
  return [...new Set(errors)];
}
function fingerprint(value: string): string {
  return value.normalize('NFKC').toLocaleLowerCase().replace(/[\p{P}\p{S}\s]+/gu, '');
}
export function validateReflectiveQuestionCommit(
  result: ReflectiveQuestionSinglePassResult,
  options: { previouslyAskedQuestions?: readonly string[] } = {}
): string[] {
  if (result.decision === 'abstain') return [];
  const c = result.commit_checks;
  const errors: string[] = [];
  if (c.shortest_answer_already_supplied) errors.push('shortest_answer_already_supplied');
  if (c.requires_missing_footage) errors.push('requires_missing_footage');
  if (c.portable_generic_shell) errors.push('portable_generic_shell');
  if (!c.preserves_polarity_and_agency) errors.push('polarity_or_agency_not_preserved');
  if (!c.spoken_native_form) errors.push('non_native_spoken_form');
  if (result.risk_flags.length) errors.push('flagged_commit');
  if (!result.question || !result.output_language) errors.push('question_missing');
  else {
    errors.push(...validateReflectiveQuestionText(result.question, result.output_language));
    if ((options.previouslyAskedQuestions ?? []).some((q) => fingerprint(q) === fingerprint(result.question!))) {
      errors.push('repeated_question_recommitted');
    }
  }
  return [...new Set(errors)];
}
export function parseReflectiveQuestionResult(
  content: string,
  validEvidenceIds: ReadonlySet<string>,
  languageContext?: ReflectiveLanguageContext
): { ok: true; data: ReflectiveQuestionSinglePassResult } | { ok: false; errors: string[] } {
  const raw = parseObject(content);
  if (!raw) return { ok: false, errors: ['invalid_json'] };
  if (raw.decision !== 'question' && raw.decision !== 'abstain') return { ok: false, errors: ['invalid_decision'] };
  const evidence = parseEvidenceIds(raw.evidence_ids);
  const checks = parseChecks(raw.commit_checks);
  const flags = parseRiskFlags(raw.risk_flags);
  if (!evidence || !checks || !flags) return { ok: false, errors: ['invalid_schema'] };
  const livingEdge = raw.living_edge == null ? null : cleanText(raw.living_edge);
  const answerTarget = raw.answer_target == null ? null : cleanText(raw.answer_target);
  const openingMode = typeof raw.opening_mode === 'string' && OPENING_MODES.has(raw.opening_mode)
    ? raw.opening_mode as ReflectiveQuestionOpeningMode : null;
  const question = raw.question == null ? null : cleanText(raw.question);
  const language = normalizeOneirosLanguageCode(raw.output_language);
  const abstainReason = raw.abstain_reason == null ? null : cleanText(raw.abstain_reason);
  if (raw.decision === 'abstain') {
    if (evidence.length || livingEdge || answerTarget || openingMode || question || language || !abstainReason) {
      return { ok: false, errors: ['invalid_abstention_shape'] };
    }
    return { ok: true, data: { decision: 'abstain', evidence_ids: [], living_edge: null,
      answer_target: null, opening_mode: null, question: null, output_language: null,
      commit_checks: checks, risk_flags: flags, abstain_reason: abstainReason } };
  }
  const errors: string[] = [];
  if (!evidence.length) errors.push('missing_evidence');
  if (evidence.some((id) => !validEvidenceIds.has(id))) errors.push('unsupported_evidence');
  if (!livingEdge) errors.push('missing_living_edge');
  if (!answerTarget) errors.push('missing_answer_target');
  if (!openingMode) errors.push('missing_opening_mode');
  if (!question) errors.push('missing_question');
  if (!language || (languageContext && !languageContextAcceptsOutput(languageContext, language))) errors.push('wrong_language');
  if (abstainReason) errors.push('question_has_abstain_reason');
  if (errors.length) return { ok: false, errors: [...new Set(errors)] };
  const data: ReflectiveQuestionSinglePassResult = { decision: 'question', evidence_ids: evidence,
    living_edge: livingEdge, answer_target: answerTarget, opening_mode: openingMode,
    question, output_language: language, commit_checks: checks, risk_flags: flags,
    abstain_reason: null };
  const commitErrors = validateReflectiveQuestionCommit(data);
  return commitErrors.length ? { ok: false, errors: commitErrors } : { ok: true, data };
}

export function createReflectiveQuestionArtifact(params: {
  id: string; surface: ReflectiveQuestionSurface; createdAt: string;
  question?: string | null; languageCode?: OneirosLanguageCode | null;
  evidenceIds?: string[];
  abstainReason?: ReflectiveQuestionArtifactV6['abstainReason'];
}): ReflectiveQuestionArtifactV6 {
  const question = cleanText(params.question);
  const languageCode = normalizeOneirosLanguageCode(params.languageCode);
  if (question && !languageCode) throw new Error('Reflective-question artifacts require a supported languageCode.');
  return { id: params.id, status: question ? 'question' : 'abstained', surface: params.surface,
    question: question || null, languageCode: languageCode || null,
    evidenceIds: [...new Set(params.evidenceIds ?? [])].slice(0, REFLECTIVE_QUESTION_MAX_EVIDENCE_IDS),
    abstainReason: question ? null : params.abstainReason ?? null,
    methodId: REFLECTIVE_QUESTION_METHOD_ID, methodVersion: REFLECTIVE_QUESTION_METHOD_VERSION,
    promptId: REFLECTIVE_QUESTION_PROMPT_ID, promptVersion: REFLECTIVE_QUESTION_PROMPT_VERSION,
    schemaVersion: 6, createdAt: params.createdAt };
}

export function createEditorialArcQuestionArtifact(params: {
  id: string;
  createdAt: string;
  question?: string | null;
  languageCode?: OneirosLanguageCode | null;
  evidenceIds?: string[];
  status?: 'no_question' | 'rejected';
  abstainReason?: ReflectiveQuestionArtifactV8['abstainReason'];
}): ReflectiveQuestionArtifactV8 {
  const question = cleanText(params.question);
  const languageCode = normalizeOneirosLanguageCode(params.languageCode);
  if (question && !languageCode) {
    throw new Error('Editorial-arc question artifacts require a supported languageCode.');
  }
  const status = question ? 'question' : params.status ?? 'rejected';
  if (status === 'no_question' && !languageCode) {
    throw new Error('Editorial-arc no-question artifacts require a supported languageCode.');
  }
  return {
    id: params.id,
    status,
    surface: 'initial',
    question: question || null,
    languageCode: languageCode || null,
    evidenceIds: status === 'question' ? [...new Set(params.evidenceIds ?? [])].slice(
      0,
      REFLECTIVE_QUESTION_MAX_EVIDENCE_IDS
    ) : [],
    abstainReason: status === 'rejected'
      ? params.abstainReason ?? 'deterministic_validation_rejection'
      : null,
    methodId: REFLECTION_EDITORIAL_ARC_METHOD_ID,
    methodVersion: REFLECTION_EDITORIAL_ARC_METHOD_VERSION,
    promptId: DREAM_REFLECTION_PROMPT_ID,
    promptVersion: DREAM_REFLECTION_PROMPT_VERSION,
    schemaVersion: REFLECTION_EDITORIAL_ARC_QUESTION_ARTIFACT_SCHEMA_VERSION,
    createdAt: params.createdAt,
  };
}

export function createComposerQuestionArtifact(params: {
  id: string;
  createdAt: string;
  question: string;
  languageCode: OneirosLanguageCode;
  depth: ReflectiveQuestionComposerDepth;
  source: ReflectiveQuestionComposerSource;
}): ReflectiveQuestionArtifactV10 {
  const question = cleanText(params.question);
  if (!question) {
    throw new Error('Composer question artifacts require a non-empty question.');
  }
  if (params.depth !== 'core' && params.depth !== 'deeper') {
    throw new Error('Composer new writes only emit core or deeper.');
  }
  return {
    id: params.id,
    status: 'question',
    surface: 'initial',
    question,
    languageCode: params.languageCode,
    evidenceIds: [],
    depth: params.depth,
    source: params.source,
    abstainReason: null,
    methodId: REFLECTIVE_QUESTION_COMPOSER_METHOD_ID,
    methodVersion: REFLECTIVE_QUESTION_COMPOSER_METHOD_VERSION,
    promptId: REFLECTIVE_QUESTION_COMPOSER_PROMPT_ID,
    promptVersion: REFLECTIVE_QUESTION_COMPOSER_PROMPT_VERSION,
    schemaVersion: REFLECTIVE_QUESTION_COMPOSER_ARTIFACT_SCHEMA_VERSION,
    createdAt: params.createdAt,
  };
}

export function createProductionQuestionArtifact(params: {
  id: string;
  createdAt: string;
  question: string;
  languageCode: OneirosLanguageCode;
  depth: 'core' | 'deeper';
  source: ReflectiveQuestionSource;
  questionMode: 'CORE' | 'DEEPER';
  generatorGateDecision: IntegrityCheckDecision | null;
  repairGateDecision: IntegrityCheckDecision | null;
  generatorPremiseDecision: IntegrityCheckDecision | null;
  repairPremiseDecision: IntegrityCheckDecision | null;
  gateViolationCategories: string[];
}): ReflectiveQuestionArtifactV11 {
  const question = cleanText(params.question);
  if (!question) {
    throw new Error('Production question artifacts require a non-empty question.');
  }
  return {
    id: params.id,
    status: 'question',
    surface: 'initial',
    question,
    languageCode: params.languageCode,
    evidenceIds: [],
    depth: params.depth,
    source: params.source,
    questionMode: params.questionMode,
    generatorGateDecision: params.generatorGateDecision,
    repairGateDecision: params.repairGateDecision,
    generatorPremiseDecision: params.generatorPremiseDecision,
    repairPremiseDecision: params.repairPremiseDecision,
    gateViolationCategories: [...params.gateViolationCategories],
    abstainReason: null,
    methodId: REFLECTIVE_QUESTION_PRODUCTION_METHOD_ID,
    methodVersion: REFLECTIVE_QUESTION_PRODUCTION_METHOD_VERSION,
    promptId: REFLECTIVE_QUESTION_PRODUCTION_PROMPT_ID,
    promptVersion: REFLECTIVE_QUESTION_PRODUCTION_PROMPT_VERSION,
    schemaVersion: REFLECTIVE_QUESTION_PRODUCTION_ARTIFACT_SCHEMA_VERSION,
    createdAt: params.createdAt,
  };
}

function legacyIdentity(raw: Record<string, unknown>): boolean {
  const version = cleanText(raw.generatorPromptVersion);
  const schema = LEGACY_VERSION_SCHEMAS[version];
  if (!schema || raw.schemaVersion !== schema) return false;
  const director = version === '4.0.0' || version === '4.1.0';
  const expectedGenerator = `oneiros-reflective-question-${director ? 'director' : 'generator'}-v${version}`;
  const validatorVersion = version === '2.0.0' ? '2.0.1' : version;
  const expectedValidator = `oneiros-reflective-question-${director ? 'composer' : 'validator'}-v${validatorVersion}`;
  return raw.generatorPromptId === expectedGenerator && raw.validatorPromptId === expectedValidator &&
    raw.validatorPromptVersion === validatorVersion;
}
export function normalizeReflectiveQuestionArtifact(value: unknown): ReflectiveQuestionArtifact | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const raw = value as Record<string, unknown>;
  const id = cleanText(raw.id);
  const surface = raw.surface === 'initial' || raw.surface === 'chat' ? raw.surface : null;
  const evidence = parseEvidenceIds(raw.evidenceIds);
  const createdAt = cleanText(raw.createdAt);
  if (!id || !surface || !evidence || !createdAt) return null;
  const currentV11 = raw.schemaVersion === REFLECTIVE_QUESTION_PRODUCTION_ARTIFACT_SCHEMA_VERSION &&
    surface === 'initial' &&
    raw.status === 'question' &&
    raw.methodId === REFLECTIVE_QUESTION_PRODUCTION_METHOD_ID &&
    raw.methodVersion === REFLECTIVE_QUESTION_PRODUCTION_METHOD_VERSION &&
    raw.promptId === REFLECTIVE_QUESTION_PRODUCTION_PROMPT_ID &&
    raw.promptVersion === REFLECTIVE_QUESTION_PRODUCTION_PROMPT_VERSION;
  const currentV10 = raw.schemaVersion === REFLECTIVE_QUESTION_COMPOSER_ARTIFACT_SCHEMA_VERSION &&
    surface === 'initial' &&
    raw.status === 'question' &&
    raw.methodId === REFLECTIVE_QUESTION_COMPOSER_METHOD_ID &&
    raw.methodVersion === REFLECTIVE_QUESTION_COMPOSER_METHOD_VERSION &&
    raw.promptId === REFLECTIVE_QUESTION_COMPOSER_PROMPT_ID &&
    raw.promptVersion === REFLECTIVE_QUESTION_COMPOSER_PROMPT_VERSION;
  const historicalV9 = raw.schemaVersion === 9 &&
    surface === 'initial' &&
    raw.status === 'question' &&
    (
      (
        raw.methodId === HISTORICAL_REFLECTIVE_QUESTION_COMPOSER_V1_0_1_METHOD_ID &&
        raw.methodVersion === HISTORICAL_REFLECTIVE_QUESTION_COMPOSER_V1_0_1_VERSION &&
        raw.promptId === HISTORICAL_REFLECTIVE_QUESTION_COMPOSER_V1_0_1_PROMPT_ID &&
        raw.promptVersion === HISTORICAL_REFLECTIVE_QUESTION_COMPOSER_V1_0_1_VERSION
      ) ||
      (
        raw.methodId === HISTORICAL_REFLECTIVE_QUESTION_COMPOSER_V1_0_0_METHOD_ID &&
        raw.methodVersion === HISTORICAL_REFLECTIVE_QUESTION_COMPOSER_V1_0_0_VERSION &&
        raw.promptId === HISTORICAL_REFLECTIVE_QUESTION_COMPOSER_V1_0_0_PROMPT_ID &&
        raw.promptVersion === HISTORICAL_REFLECTIVE_QUESTION_COMPOSER_V1_0_0_VERSION
      )
    );
  const currentV8 = raw.schemaVersion === REFLECTION_EDITORIAL_ARC_QUESTION_ARTIFACT_SCHEMA_VERSION &&
    raw.methodId === REFLECTION_EDITORIAL_ARC_METHOD_ID &&
    raw.methodVersion === REFLECTION_EDITORIAL_ARC_METHOD_VERSION &&
    raw.promptId === DREAM_REFLECTION_PROMPT_ID &&
    raw.promptVersion === DREAM_REFLECTION_PROMPT_VERSION &&
    surface === 'initial' &&
    (raw.status === 'question' || raw.status === 'no_question' || raw.status === 'rejected');
  const legacyV7 = raw.schemaVersion === 7 &&
    raw.methodId === 'oneiros-reflection-editorial-arc-v1.0.0-candidate' &&
    raw.methodVersion === '1.0.0-candidate' &&
    raw.promptId === 'oneiros-dream-reflection-v3.0.0-candidate' &&
    raw.promptVersion === '3.0.0-candidate' &&
    surface === 'initial' &&
    (raw.status === 'question' || raw.status === 'abstained');
  const currentV6 = raw.schemaVersion === 6 && raw.methodId === REFLECTIVE_QUESTION_METHOD_ID &&
    raw.methodVersion === REFLECTIVE_QUESTION_METHOD_VERSION && raw.promptId === REFLECTIVE_QUESTION_PROMPT_ID &&
    raw.promptVersion === REFLECTIVE_QUESTION_PROMPT_VERSION && (raw.status === 'question' || raw.status === 'abstained');
  const legacy = legacyIdentity(raw) && (raw.status === 'question' || raw.status === 'abstain');
  if (!currentV11 && !currentV10 && !historicalV9 && !currentV8 && !legacyV7 && !currentV6 && !legacy) return null;
  if (raw.status === 'question') {
    const question = cleanText(raw.question);
    const languageCode = normalizeOneirosLanguageCode(raw.languageCode);
    if (currentV11) {
      const depth = raw.depth;
      const source = raw.source;
      const questionMode = raw.questionMode;
      const parseDecision = (value: unknown): IntegrityCheckDecision | null => (
        value === 'pass' || value === 'fail' || value === 'unavailable' || value === null
          ? value
          : null
      );
      if (
        !question ||
        !languageCode ||
        (depth !== 'core' && depth !== 'deeper') ||
        (source !== 'generator' && source !== 'repair' && source !== 'fallback') ||
        (questionMode !== 'CORE' && questionMode !== 'DEEPER') ||
        raw.abstainReason != null
      ) {
        return null;
      }
      const generatorGateDecision = parseDecision(raw.generatorGateDecision);
      const repairGateDecision = parseDecision(raw.repairGateDecision);
      const generatorPremiseDecision = parseDecision(raw.generatorPremiseDecision);
      const repairPremiseDecision = parseDecision(raw.repairPremiseDecision);
      if (
        generatorGateDecision === undefined ||
        repairGateDecision === undefined ||
        generatorPremiseDecision === undefined ||
        repairPremiseDecision === undefined
      ) {
        return null;
      }
      const gateViolationCategories = Array.isArray(raw.gateViolationCategories)
        ? raw.gateViolationCategories.filter((item): item is string => typeof item === 'string')
        : [];
      return {
        id,
        status: 'question',
        surface: 'initial',
        question,
        languageCode,
        evidenceIds: [],
        depth,
        source,
        questionMode,
        generatorGateDecision,
        repairGateDecision,
        generatorPremiseDecision,
        repairPremiseDecision,
        gateViolationCategories,
        abstainReason: null,
        methodId: REFLECTIVE_QUESTION_PRODUCTION_METHOD_ID,
        methodVersion: REFLECTIVE_QUESTION_PRODUCTION_METHOD_VERSION,
        promptId: REFLECTIVE_QUESTION_PRODUCTION_PROMPT_ID,
        promptVersion: REFLECTIVE_QUESTION_PRODUCTION_PROMPT_VERSION,
        schemaVersion: REFLECTIVE_QUESTION_PRODUCTION_ARTIFACT_SCHEMA_VERSION,
        createdAt,
      };
    }
    if (currentV10) {
      const depth = raw.depth;
      const source = raw.source;
      if (
        !question ||
        !languageCode ||
        (depth !== 'core' && depth !== 'standard' && depth !== 'deeper') ||
        (source !== 'model' && source !== 'fallback') ||
        raw.abstainReason != null
      ) {
        return null;
      }
      return {
        id,
        status: 'question',
        surface: 'initial',
        question,
        languageCode,
        evidenceIds: [],
        depth,
        source,
        abstainReason: null,
        methodId: String(raw.methodId),
        methodVersion: String(raw.methodVersion),
        promptId: String(raw.promptId),
        promptVersion: String(raw.promptVersion),
        schemaVersion: REFLECTIVE_QUESTION_COMPOSER_ARTIFACT_SCHEMA_VERSION,
        createdAt,
      };
    }
    if (historicalV9) {
      const kind = raw.kind;
      const depth = raw.depth;
      const source = raw.source;
      if (
        !question ||
        !languageCode ||
        (kind !== 'relation' && kind !== 'image' && kind !== 'completion') ||
        (depth !== 'core' && depth !== 'standard' && depth !== 'deeper') ||
        (source !== 'model' && source !== 'fallback') ||
        raw.abstainReason != null
      ) {
        return null;
      }
      if (source === 'model' && evidence.length < 1) return null;
      return {
        id,
        status: 'question',
        surface: 'initial',
        kind,
        question,
        languageCode,
        evidenceIds: evidence,
        depth,
        source,
        abstainReason: null,
        methodId: String(raw.methodId),
        methodVersion: String(raw.methodVersion),
        promptId: String(raw.promptId),
        promptVersion: String(raw.promptVersion),
        schemaVersion: 9,
        createdAt,
      };
    }
    if (!evidence.length || !languageCode || validateReflectiveQuestionText(question, languageCode).length) return null;
    if (currentV8) return { id, status: 'question', surface: 'initial', question, languageCode, evidenceIds: evidence,
      abstainReason: null,
      methodId: REFLECTION_EDITORIAL_ARC_METHOD_ID,
      methodVersion: REFLECTION_EDITORIAL_ARC_METHOD_VERSION,
      promptId: DREAM_REFLECTION_PROMPT_ID,
      promptVersion: DREAM_REFLECTION_PROMPT_VERSION,
      schemaVersion: REFLECTION_EDITORIAL_ARC_QUESTION_ARTIFACT_SCHEMA_VERSION,
      createdAt };
    if (legacyV7) return { id, status: 'question', surface: 'initial', question, languageCode, evidenceIds: evidence,
      abstainReason: null,
      methodId: 'oneiros-reflection-editorial-arc-v1.0.0-candidate',
      methodVersion: '1.0.0-candidate',
      promptId: 'oneiros-dream-reflection-v3.0.0-candidate',
      promptVersion: '3.0.0-candidate', schemaVersion: 7, createdAt };
    if (currentV6) return { id, status: 'question', surface, question, languageCode, evidenceIds: evidence,
      abstainReason: null,
      methodId: REFLECTIVE_QUESTION_METHOD_ID, methodVersion: REFLECTIVE_QUESTION_METHOD_VERSION,
      promptId: REFLECTIVE_QUESTION_PROMPT_ID, promptVersion: REFLECTIVE_QUESTION_PROMPT_VERSION,
      schemaVersion: 6, createdAt };
    return { id, status: 'question', surface, question, languageCode, evidenceIds: evidence,
      generatorPromptId: raw.generatorPromptId as string, generatorPromptVersion: raw.generatorPromptVersion as string,
      validatorPromptId: raw.validatorPromptId as string, validatorPromptVersion: raw.validatorPromptVersion as string,
      schemaVersion: raw.schemaVersion as 1 | 2 | 3 | 4 | 5, createdAt };
  }
  const reason = cleanText(raw.abstainReason);
  if (currentV8) {
    if (raw.status === 'no_question') {
      const languageCode = normalizeOneirosLanguageCode(raw.languageCode);
      if (!languageCode || evidence.length || raw.question !== null || reason) return null;
      return { id, status: 'no_question', surface: 'initial', question: null,
        languageCode, evidenceIds: [], abstainReason: null,
        methodId: REFLECTION_EDITORIAL_ARC_METHOD_ID,
        methodVersion: REFLECTION_EDITORIAL_ARC_METHOD_VERSION,
        promptId: DREAM_REFLECTION_PROMPT_ID,
        promptVersion: DREAM_REFLECTION_PROMPT_VERSION,
        schemaVersion: REFLECTION_EDITORIAL_ARC_QUESTION_ARTIFACT_SCHEMA_VERSION,
        createdAt };
    }
    if (raw.status !== 'rejected') return null;
    if (reason !== 'deterministic_validation_rejection' && reason !== 'language_mismatch') return null;
    return { id, status: 'rejected', surface: 'initial', question: null, languageCode: null,
      evidenceIds: [],
      abstainReason: reason,
      methodId: REFLECTION_EDITORIAL_ARC_METHOD_ID,
      methodVersion: REFLECTION_EDITORIAL_ARC_METHOD_VERSION,
      promptId: DREAM_REFLECTION_PROMPT_ID,
      promptVersion: DREAM_REFLECTION_PROMPT_VERSION,
      schemaVersion: REFLECTION_EDITORIAL_ARC_QUESTION_ARTIFACT_SCHEMA_VERSION,
      createdAt };
  }
  if (legacyV7) {
    if (reason !== 'deterministic_validation_rejection' && reason !== 'language_mismatch') return null;
    return { id, status: 'abstained', surface: 'initial', question: null, languageCode: null,
      evidenceIds: evidence, abstainReason: reason,
      methodId: 'oneiros-reflection-editorial-arc-v1.0.0-candidate',
      methodVersion: '1.0.0-candidate',
      promptId: 'oneiros-dream-reflection-v3.0.0-candidate',
      promptVersion: '3.0.0-candidate', schemaVersion: 7, createdAt };
  }
  if (!(currentV6 ? CURRENT_ABSTAIN_REASONS : LEGACY_ABSTAIN_REASONS).has(reason)) return null;
  if (currentV6) return { id, status: 'abstained', surface, question: null, languageCode: null,
    evidenceIds: evidence, abstainReason: reason as ReflectiveQuestionArtifactV6['abstainReason'],
    methodId: REFLECTIVE_QUESTION_METHOD_ID, methodVersion: REFLECTIVE_QUESTION_METHOD_VERSION,
    promptId: REFLECTIVE_QUESTION_PROMPT_ID, promptVersion: REFLECTIVE_QUESTION_PROMPT_VERSION,
    schemaVersion: 6, createdAt };
  return { id, status: 'abstain', surface, evidenceIds: evidence,
    abstainReason: reason as ReflectiveQuestionAbstainReason,
    generatorPromptId: raw.generatorPromptId as string, generatorPromptVersion: raw.generatorPromptVersion as string,
    validatorPromptId: raw.validatorPromptId as string, validatorPromptVersion: raw.validatorPromptVersion as string,
    schemaVersion: raw.schemaVersion as 1 | 2 | 3 | 4 | 5, createdAt };
}

export const REFLECTIVE_QUESTION_RETRY_REMINDER =
  'Reflective Questions are generated separately; never append a question during reading retry.';
