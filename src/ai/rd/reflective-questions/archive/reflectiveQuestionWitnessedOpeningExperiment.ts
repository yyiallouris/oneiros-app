/**
 * Offline-only Witnessed Opening R&D candidate for reflective questions.
 *
 * Not imported by the client interpretation path or the entitlement gateway.
 * Canonical local method remains `reflectiveQuestionPrompt.ts` (v1.4).
 * Frozen comparison baseline is v1.3, not a production revert.
 */
export const REFLECTIVE_QUESTION_WITNESSED_OPENING_ID =
  'reflective-question-oneiros-witnessed-opening-rd-v0.1.0';
export const REFLECTIVE_QUESTION_WITNESSED_OPENING_VERSION = '0.1.0';
export const REFLECTIVE_QUESTION_WITNESSED_OPENING_OUTPUT_SLUG =
  'reflective-question-witnessed-opening-rd-v0-1';

export const REFLECTIVE_QUESTION_WITNESSED_OPENING_PROMPT = `REFLECTIVE QUESTION — ONEIROS

Read the dream as a whole before choosing what to ask.

Choose one opening that is already present in the dream: something clearly supported and worth returning to, not the deepest angle you can invent.

Ask one natural question that returns the dreamer to that part of the dream and gives them room to notice further.

Use structure the dream genuinely gives you — such as contradiction, change or movement, interaction, explicit feeling, bodily experience, atmosphere, or another concrete moment — only when it is actually present.

Use a second detail only when the dream itself clearly connects the two.

Do not add meaning, motive, causality, conflict, relationship, emotion, psychological change, or symbolic significance that the dream does not provide.

If nothing psychologically charged clearly stands out, stay with one concrete image, action, gesture, sensory fact, or moment. Ordinary material may remain ordinary.

Look again; do not explain.

Use simple, natural language. Let the dream carry the depth.

Output exactly one question, with no preface or commentary.`;

export const REFLECTIVE_QUESTION_WITNESSED_OPENING_SHA256 =
  'd3e0730718817d5839638562bf6f9e9b08e46c289c76b8599de12b7c894994ee';

export const WITNESSED_OPENING_MODEL = 'gpt-5.4';
export const WITNESSED_OPENING_TEMPERATURE = 0.45;
export const WITNESSED_OPENING_MAX_COMPLETION_TOKENS = 500;
export const WITNESSED_OPENING_FALLBACK_DISABLED = true;

export const WITNESSED_OPENING_BASELINE_ID =
  'reflective-question-oneiros-reader-v1.3.0';
export const WITNESSED_OPENING_BASELINE_VERSION = '1.3.0';
export const WITNESSED_OPENING_BASELINE_SHA256 =
  '4e1b77249a1c793fb09f4ac57759d8be24a406ad00e19a6ead785c584182128b';

export const WITNESSED_OPENING_UX_SCORES = [0, 1, 2] as const;
export type WitnessedOpeningUxScore = (typeof WITNESSED_OPENING_UX_SCORES)[number];

export const PAIRWISE_PREFERENCE_ANSWERS = [
  'left',
  'right',
  'tie',
  'neither',
] as const;
export type PairwisePreferenceAnswer =
  (typeof PAIRWISE_PREFERENCE_ANSWERS)[number];

export function isWitnessedOpeningEnvEnabled(
  raw: string | undefined
): boolean {
  return raw?.trim() === '1';
}
