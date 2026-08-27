/**
 * Offline-only Language + Reflective Operator R&D.
 *
 * Write-side experiment. Selector stays frozen from Selection Language Decoupling.
 * Not imported by the client interpretation path or the entitlement gateway.
 * Rejected local Reader v1.4 is archived, not runtime.
 * Protected production is recovered psychological-aliveness v1.4.0, not a v1.5 method id.
 * Source of truth: frozen decoupling `exact_prompt`, not v1.4, not gateway v1.5,
 * not Surgical, not Witnessed Opening, not ablation directly, not a reconstructed prompt.
 */
import {
  REFLECTIVE_QUESTION_SELECTION_LANGUAGE_DECOUPLING_ID,
  REFLECTIVE_QUESTION_SELECTION_LANGUAGE_DECOUPLING_PROMPT,
  REFLECTIVE_QUESTION_SELECTION_LANGUAGE_DECOUPLING_SHA256,
  V131_FREEZE_VALIDATION_DECOUPLING_LIVE_DIR,
  V131_FREEZE_VALIDATION_FIXTURE,
} from './reflectiveQuestionSelectionLanguageDecouplingExperiment';

export const REFLECTIVE_QUESTION_LANGUAGE_OPERATOR_ID =
  'reflective-question-oneiros-v1-3-language-operator-rd-v0.1.0';
export const REFLECTIVE_QUESTION_LANGUAGE_OPERATOR_VERSION = '0.1.0';
export const REFLECTIVE_QUESTION_LANGUAGE_OPERATOR_OUTPUT_SLUG =
  'reflective-question-v1-3-language-operator-rd-v0-1';

export const LANGUAGE_OPERATOR_DECOUPLING_SOURCE_ID =
  REFLECTIVE_QUESTION_SELECTION_LANGUAGE_DECOUPLING_ID;
export const LANGUAGE_OPERATOR_DECOUPLING_SOURCE_SHA256 =
  REFLECTIVE_QUESTION_SELECTION_LANGUAGE_DECOUPLING_SHA256;
export const LANGUAGE_OPERATOR_DECOUPLING_FREEZE_VALIDATION_LIVE_DIR =
  V131_FREEZE_VALIDATION_DECOUPLING_LIVE_DIR;
export const LANGUAGE_OPERATOR_SENTINEL_DIR =
  'tmp/reflective-question-v1-3-language-operator-rd-v0-1-2026-08-27T11-50-18-259Z';
export const LANGUAGE_OPERATOR_DEVELOPMENT_STRESS_LIVE_DIR =
  'tmp/reflective-question-v1-3-language-operator-rd-v0-1-development-stress-2026-08-27T11-51-06-896Z';
export const LANGUAGE_OPERATOR_DEVELOPMENT_STRESS_FIXTURE =
  V131_FREEZE_VALIDATION_FIXTURE;
export const LANGUAGE_OPERATOR_DEVELOPMENT_STRESS_OUTPUT_SLUG_SUFFIX =
  'development-stress';

export const LANGUAGE_OPERATOR_WRITE_BOUNDARY_START =
  'Use the selection instructions only to decide where to look.';

export const LANGUAGE_OPERATOR_OUTPUT_CONTRACT = `Output one reflective question only.
One strong question is complete.`;

export const LANGUAGE_OPERATOR_REALIZATION_CONTRACT = `REALIZATION
Once you have selected the dream material, formulate the question directly from that material.

Use the concrete images, actions, changes, sensations, feelings, gestures, and words already present in the dream.

Do not add a new psychological structure merely to turn the selected material into a reflective question.

In particular:
- do not introduce a relationship that the selected dream material does not itself stage;
- do not introduce a reason, motive, force, or cause for an action or non-action;
- do not convert a concrete event into an abstract question about the dreamer's position, role, presence, relationship, or way of being unless that structure is explicitly present in the dream;
- do not turn the selected event into a thesis about “what changes” merely because contrast or transformation was noticed;
- do not turn non-action into a question about what made, kept, stopped, or prevented the dreamer from acting unless the dream explicitly stages such a force.

Prefer the verbs and concrete nouns of the dream over abstract reflective nouns.

If the dream already contains a contrast, paradox, transition, or relationship, the question may stay directly with it without naming an additional abstract structure around it.

The final question should have one clear grammatical movement.

A user should understand what is being asked on the first natural read.

If the sentence requires mentally unpacking nested framing in order to understand the question, rewrite it more directly while preserving the same dream opening.

Simplifying the sentence must not make the question generic.

Preserve the exact image, tension, affect, paradox, or movement that made the opening worth asking about.

The language should feel as though the question arose from this dream, not from a reflective-question framework.

Distinguish dream structure from question structure.
Dream structure is a relation, contrast, transformation, tension, non-action, gesture, or similar phenomenon actually staged by the dream. That may stay in the question.
Question structure is an abstract frame added only because a reflective question needs to be manufactured. Do not add that frame.`;

export function reflectiveQuestionSelectorPrefix(prompt: string): string {
  const index = prompt.indexOf(LANGUAGE_OPERATOR_WRITE_BOUNDARY_START);
  if (index < 0) {
    throw new Error(
      'Prompt is missing the frozen selection-language write boundary.'
    );
  }
  return prompt.slice(0, index);
}

export function reflectiveQuestionDecouplingWriteBoundary(
  prompt: string
): string {
  const start = prompt.indexOf(LANGUAGE_OPERATOR_WRITE_BOUNDARY_START);
  if (start < 0) {
    throw new Error(
      'Prompt is missing the frozen selection-language write boundary.'
    );
  }
  const realization = prompt.indexOf('\n\nREALIZATION\n');
  const output = prompt.indexOf('\n\nOutput one reflective question only.');
  const end = realization >= 0 ? realization : output;
  if (end < 0 || end <= start) {
    throw new Error('Prompt is missing the frozen write-boundary end marker.');
  }
  return prompt.slice(start, end).trimEnd();
}

export const REFLECTIVE_QUESTION_LANGUAGE_OPERATOR_PROMPT = `${reflectiveQuestionSelectorPrefix(
  REFLECTIVE_QUESTION_SELECTION_LANGUAGE_DECOUPLING_PROMPT
)}${LANGUAGE_OPERATOR_WRITE_BOUNDARY_START}${REFLECTIVE_QUESTION_SELECTION_LANGUAGE_DECOUPLING_PROMPT.slice(
  REFLECTIVE_QUESTION_SELECTION_LANGUAGE_DECOUPLING_PROMPT.indexOf(
    LANGUAGE_OPERATOR_WRITE_BOUNDARY_START
  ) + LANGUAGE_OPERATOR_WRITE_BOUNDARY_START.length
).replace(
  `\n\n${LANGUAGE_OPERATOR_OUTPUT_CONTRACT}`,
  `\n\n${LANGUAGE_OPERATOR_REALIZATION_CONTRACT}\n\n${LANGUAGE_OPERATOR_OUTPUT_CONTRACT}`
)}`;

export const REFLECTIVE_QUESTION_LANGUAGE_OPERATOR_SHA256 =
  'f5aa40a47732095588827384dfe9a3fdba9d1325fcb158f4265e3a4a81a80e6c';

export const LANGUAGE_OPERATOR_MODEL = 'gpt-5.4';
export const LANGUAGE_OPERATOR_TEMPERATURE = 0.45;
export const LANGUAGE_OPERATOR_MAX_COMPLETION_TOKENS = 500;
export const LANGUAGE_OPERATOR_FALLBACK_DISABLED = true;

export const LANGUAGE_OPERATOR_UX_SCORES = [0, 1, 2] as const;
export type LanguageOperatorUxScore =
  (typeof LANGUAGE_OPERATOR_UX_SCORES)[number];

export const LANGUAGE_OPERATOR_OPENING_PRESERVATION = [
  'SAME',
  'NEAR',
  'DIFFERENT',
] as const;
export type LanguageOperatorOpeningPreservation =
  (typeof LANGUAGE_OPERATOR_OPENING_PRESERVATION)[number];

export const LANGUAGE_OPERATOR_REALIZATION_CONTAMINATION = [
  'UNSUPPORTED_RELATION_IN_REALIZATION',
  'UNSUPPORTED_MOTIVE_IN_REALIZATION',
  'UNSUPPORTED_CAUSALITY_IN_REALIZATION',
  'ABSTRACT_REFLECTIVE_WRAPPER',
  'CHANGE_THAT_WRAPPER',
  'NESTED_SYNTACTIC_FRICTION',
] as const;
export type LanguageOperatorRealizationContamination =
  (typeof LANGUAGE_OPERATOR_REALIZATION_CONTAMINATION)[number];

export const LANGUAGE_OPERATOR_FAILURE_SPLIT = [
  'SELECTOR',
  'REALIZATION',
  'BOTH',
  'OTHER',
] as const;
export type LanguageOperatorFailureSplit =
  (typeof LANGUAGE_OPERATOR_FAILURE_SPLIT)[number];

export const LANGUAGE_OPERATOR_EXACT_SENTENCE_PRODUCT_GATE = [
  'YES',
  'NO',
] as const;

export function isLanguageOperatorEnvEnabled(
  raw: string | undefined
): boolean {
  return raw?.trim() === '1';
}

export function isLanguageOperatorDevelopmentStressEnvEnabled(
  raw: string | undefined
): boolean {
  return raw?.trim() === '1';
}
