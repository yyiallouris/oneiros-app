/**
 * Offline-only selection-language decoupling calibration of frozen Relation Eligibility Ablation.
 *
 * Not imported by the client interpretation path or the entitlement gateway.
 * Canonical local method remains `reflectiveQuestionPrompt.ts` (v1.4).
 * Primary baseline is Relation Eligibility Ablation; historical baseline is frozen v1.3.
 * Source of truth: frozen ablation `exact_prompt`, not Surgical, not v1.4, not a rewritten v1.3.
 */
export const REFLECTIVE_QUESTION_SELECTION_LANGUAGE_DECOUPLING_ID =
  'reflective-question-oneiros-v1-3-selection-language-decoupling-rd-v0.1.0';
export const REFLECTIVE_QUESTION_SELECTION_LANGUAGE_DECOUPLING_VERSION =
  '0.1.0';
export const REFLECTIVE_QUESTION_SELECTION_LANGUAGE_DECOUPLING_OUTPUT_SLUG =
  'reflective-question-v1-3-selection-language-decoupling-rd-v0-1';

export const SELECTION_LANGUAGE_DECOUPLING_ABLATION_SOURCE_ID =
  'reflective-question-oneiros-v1-3-relation-eligibility-ablation-rd-v0.1.0';
export const SELECTION_LANGUAGE_DECOUPLING_ABLATION_SOURCE_SHA256 =
  'b362865905bf7ba723d2428592aec2b07c5a5b542077fb1b90d06d1f1cf09cd4';
export const SELECTION_LANGUAGE_DECOUPLING_ABLATION_LIVE_DIR =
  'tmp/reflective-question-v1-3-relation-eligibility-ablation-rd-v0-1-live-benchmark-2026-08-27T09-35-56-357Z';
export const SELECTION_LANGUAGE_DECOUPLING_ABLATION_SENTINEL_DIR =
  'tmp/reflective-question-v1-3-relation-eligibility-ablation-rd-v0-1-2026-08-27T09-31-04-297Z';

export const SELECTION_LANGUAGE_DECOUPLING_BASELINE_V13_ID =
  'reflective-question-oneiros-reader-v1.3.0';
export const SELECTION_LANGUAGE_DECOUPLING_BASELINE_V13_SHA256 =
  '4e1b77249a1c793fb09f4ac57759d8be24a406ad00e19a6ead785c584182128b';
export const SELECTION_LANGUAGE_DECOUPLING_FROZEN_V13_SOURCE_ARTIFACT =
  'tmp/reflective-question-v1-3-live-benchmark-2026-08-26T16-24-43-552Z/results.json';

export const V131_FREEZE_VALIDATION_FIXTURE =
  'testing/live-scenarios/reflective-questions-v131-freeze-validation.v1.json';
export const V131_FREEZE_VALIDATION_BENCHMARK_ID =
  'reflective-question-v1-3-1-freeze-validation-v1';
export const V131_FREEZE_VALIDATION_CASE_COUNT = 60;
export const V131_FREEZE_VALIDATION_OUTPUT_SLUG_SUFFIX = 'freeze-validation';
export const V131_FREEZE_VALIDATION_DECOUPLING_LIVE_DIR =
  'tmp/reflective-question-v1-3-selection-language-decoupling-rd-v0-1-freeze-validation-2026-08-27T10-30-49-178Z';
export const V131_FREEZE_VALIDATION_ABLATION_LIVE_DIR =
  'tmp/reflective-question-v1-3-relation-eligibility-ablation-rd-v0-1-freeze-validation-2026-08-27T10-31-50-200Z';

export function isFreezeValidationEnvEnabled(
  raw: string | undefined
): boolean {
  return raw?.trim() === '1';
}

export const SELECTION_RUBRIC_LEAKAGE_SUBCLASSES = [
  'importance_leak',
  'opening_leak',
  'selector_paraphrase',
] as const;
export type SelectionRubricLeakageSubclass =
  (typeof SELECTION_RUBRIC_LEAKAGE_SUBCLASSES)[number];

export const REFLECTIVE_QUESTION_SELECTION_LANGUAGE_DECOUPLING_PROMPT = `REFLECTIVE QUESTION — ONEIROS

Ask one reflective question that could only belong to this particular dream.

First understand what the dream is already showing.

Then look for one place where there is still something genuinely open to discover: contradiction, tension, transformation, bodily experience, emotional movement, atmosphere, strange detail, absence, gesture, relation, or unexpected combination.
These are modes of attention, not a priority order.

The question must open a new angle of reflection.

It should not merely ask the dreamer to describe again what they already experienced or already told you.

Bad reflection only repeats:
“How was that for you?”
“How did that feel?”
“What did it look or sound like?”
“What happened there?”

A strong Oneiros question helps the dreamer notice a relation or possibility inside the dream that was present but not yet fully seen.

Stay grounded in the dream.

Do not explain the dream for the dreamer.
Do not tell them what an image means.
Do not invent motives, feelings, fears, conflicts, intentions, pathology, repression, blockage, or symbolic meaning.
Do not assume that an action happened for a hidden reason.

Do not force conflict or depth.
Peace, beauty, erotic vitality, strangeness, transformation, ordinary gestures, and calm may be psychologically meaningful without hiding a problem.

When the dreamer has already named a feeling, do not simply ask them to describe that feeling again.
Instead, look at what that feeling changes, accompanies, contradicts, permits, or places in a new relation inside the dream.

When several elements are present, do not assume their coexistence is itself the reflective opening. Ask about their relation only when that relation is visibly staged in the dream.

A relation is a valid opening only when the dream itself materially stages it through interaction, dependence, approach or withdrawal, repeated linkage, explicit contrast, or change occurring through contact.
Co-occurrence, proximity, or appearing in the same scene are not enough by themselves.
Do not add a second dream element simply to make the question richer or more specific. Use it only when the dream itself makes the connection relevant to what is being asked.

Do not default to causal questions such as:
“What is it that makes you...?”
“What made you want to...?”
“What is keeping you...?”

Do not default to scene continuation or hypothetical “what if” questions.

Do not default to sensory clarification unless the missing sensory detail itself would genuinely change the reflection.

Prefer a question that creates discovery without supplying the discovery.

The question should be:
- specific to this dream,
- psychologically alive,
- epistemically open,
- clear on first read,
- worth answering.

Use simple, natural language.
Do not sound therapeutic, academic, mystical, clever, or deliberately poetic.
Do not try to sound deep.

Question form:
- Do not default to the same grammatical frame across dreams.
- In particular, do not use "What changes in the fact that...?" / "Τι αλλάζει στο ότι...;" as a generic template.
- Use that form only when an actual transformation or changed relation is the most alive feature of the dream.
- Choose the grammatical shape from the dream material rather than fitting the dream into a preferred question pattern.

A reflective question may open through:
- relation — how two elements exist together;
- paradox — how apparently incompatible qualities coexist;
- position — the dreamer's position in relation to an image or figure;
- transformation — what genuinely changes inside the dream;
- gesture — the significance of one concrete action or non-action;
- atmosphere — how the scene's tone alters the relation between its elements;
- absence — something conspicuously missing or not happening;
- attention — a small detail that becomes psychologically alive when noticed closely.

These are modes of attention, not sentence templates.
Vary the wording naturally.

Do not choose an interpretation first and then write a question that leads the dreamer toward it.

Ask only about relations, contrasts, gestures, absences, or transformations that are visibly staged in the dream.

The question should open the image, not smuggle in the interpretation.

Ordinary or emotionally neutral dream material does not need to be made symbolically important.
Prefer a small, precise question to manufactured depth.
If the dream itself is modest, the question may also be modest.

Non-action is not automatically hesitation, avoidance, fear, unreadiness, blockage, or refusal.
If the dreamer does not act, stay with the image unless the dream itself clearly stages conflict around that non-action.

Prefer one clean sentence, usually around 12–28 words.
Clarity and psychological precision matter more than hitting a numeric target.

Write in the dreamer’s language.

Use the selection instructions only to decide where to look. Once you have chosen the dream material, stop using the selection vocabulary and write the question from the concrete language, actions, feelings, images, and relationships present in the dream itself.
Do not turn the fact that something was selected into the subject of the question. Ask about the dream phenomenon, not about why it is notable, important, open, striking, central, or worth attention.

A question should not ask why a selected detail matters merely because the method selected it.
If the question could be paraphrased as “why is this important / notable / open / significant?”, reformulate it around what is concretely happening in the dream.

Internally separate the task into two steps:
1. Select the dream material.
2. Forget the language used to select it and formulate the question directly from the dream material.

Output one reflective question only.
One strong question is complete.`;

export const REFLECTIVE_QUESTION_SELECTION_LANGUAGE_DECOUPLING_SHA256 =
  '5d4ba2fe63ca8932064d97b1a0decb36003fb37d20d6dc44f1d6044f54a1d6bf';

export const SELECTION_LANGUAGE_DECOUPLING_MODEL = 'gpt-5.4';
export const SELECTION_LANGUAGE_DECOUPLING_TEMPERATURE = 0.45;
export const SELECTION_LANGUAGE_DECOUPLING_MAX_COMPLETION_TOKENS = 500;
export const SELECTION_LANGUAGE_DECOUPLING_FALLBACK_DISABLED = true;

export const SELECTION_LANGUAGE_DECOUPLING_UX_SCORES = [0, 1, 2] as const;
export type SelectionLanguageDecouplingUxScore =
  (typeof SELECTION_LANGUAGE_DECOUPLING_UX_SCORES)[number];

export function isSelectionLanguageDecouplingEnvEnabled(
  raw: string | undefined
): boolean {
  return raw?.trim() === '1';
}
