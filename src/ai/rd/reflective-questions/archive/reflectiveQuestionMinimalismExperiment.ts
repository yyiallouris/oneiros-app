/**
 * Offline-only 3-way minimalism experiment for reflective questions.
 *
 * Not imported by the client interpretation path or the entitlement gateway.
 * Canonical production/local method remains `reflectiveQuestionPrompt.ts`.
 */
export type MinimalismExperimentLetter = 'A' | 'B';

export const REFLECTIVE_QUESTION_MINIMAL_A_ID =
  'reflective-question-minimal-a-v0.1.0';
export const REFLECTIVE_QUESTION_MINIMAL_A_VERSION = '0.1.0';
export const REFLECTIVE_QUESTION_MINIMAL_A_PROMPT = `You are a perceptive post-Jungian dream reader.
Read the dream carefully and ask exactly one reflective question that could only belong to this dream.
Stay with the dream itself and do not explain what it means.
Use simple, natural language.`;

export const REFLECTIVE_QUESTION_MINIMAL_B_ID =
  'reflective-question-minimal-b-v0.1.0';
export const REFLECTIVE_QUESTION_MINIMAL_B_VERSION = '0.1.0';
export const REFLECTIVE_QUESTION_MINIMAL_B_PROMPT = `You are a perceptive post-Jungian dream reader.
Read the dream as a whole and ask exactly one reflective question that could only belong to this dream.
Stay close to its images, actions, affects, relationships, transformations, and paradoxes without explaining what they mean or adding psychology the dream does not give.
Let the question preserve what is strange, alive, unresolved, or worth staying with rather than resolving it.
Use simple, natural language.`;

export const FROZEN_V13_BASELINE_ID =
  'reflective-question-oneiros-reader-v1.3.0';
export const FROZEN_V13_BASELINE_VERSION = '1.3.0';
export const FROZEN_V13_BASELINE_SHA256 =
  '4e1b77249a1c793fb09f4ac57759d8be24a406ad00e19a6ead785c584182128b';

export const MINIMALISM_EXPERIMENT_FAILURE_MODES = [
  'GENERIC_JUNGIAN_SYMBOLISM',
  'WHAT_DOES_X_SYMBOLIZE',
  'GENERIC_THERAPEUTIC_QUESTION',
  'EXCESSIVE_WHY',
  'GENERIC_FEELING_QUESTION',
  'WRONG_LANGUAGE',
  'MULTI_LINE_OR_NON_QUESTION_DUMP',
] as const;

export type MinimalismExperimentFailureMode =
  (typeof MINIMALISM_EXPERIMENT_FAILURE_MODES)[number];

export type FrozenMinimalismCandidate = {
  letter: MinimalismExperimentLetter;
  id: string;
  version: string;
  prompt: string;
  sha256: string;
  outputSlug: string;
};

export const REFLECTIVE_QUESTION_MINIMAL_A_SHA256 =
  'f621775128976f19c0a872033f0f8b10ffa3867388a48135bffe9029ae4957d1';
export const REFLECTIVE_QUESTION_MINIMAL_B_SHA256 =
  '34164196700495b63898a3f86187e3ff85f3b3eb2a0b8691f5a44fe7159500f9';

export const MINIMALISM_EXPERIMENT_CANDIDATES: Record<
  MinimalismExperimentLetter,
  FrozenMinimalismCandidate
> = {
  A: {
    letter: 'A',
    id: REFLECTIVE_QUESTION_MINIMAL_A_ID,
    version: REFLECTIVE_QUESTION_MINIMAL_A_VERSION,
    prompt: REFLECTIVE_QUESTION_MINIMAL_A_PROMPT,
    sha256: REFLECTIVE_QUESTION_MINIMAL_A_SHA256,
    outputSlug: 'reflective-question-minimal-a-v0-1',
  },
  B: {
    letter: 'B',
    id: REFLECTIVE_QUESTION_MINIMAL_B_ID,
    version: REFLECTIVE_QUESTION_MINIMAL_B_VERSION,
    prompt: REFLECTIVE_QUESTION_MINIMAL_B_PROMPT,
    sha256: REFLECTIVE_QUESTION_MINIMAL_B_SHA256,
    outputSlug: 'reflective-question-minimal-b-v0-1',
  },
};

export function parseMinimalismExperimentLetter(
  raw: string | undefined
): MinimalismExperimentLetter | null {
  const value = raw?.trim().toUpperCase();
  if (!value) return null;
  if (value === 'A' || value === 'B') return value;
  throw new Error(
    `REFLECTIVE_QUESTION_EXPERIMENT must be A or B; received ${raw}.`
  );
}
