/**
 * Offline-only causal ablation of frozen v1.3 relation/anchor eligibility.
 *
 * Not imported by the client interpretation path or the entitlement gateway.
 * Canonical local method remains `reflectiveQuestionPrompt.ts` (v1.4).
 * Frozen comparison baseline is v1.3, not Surgical Attention and not a production revert.
 * Source of truth: frozen C `exact_prompt`, not a reconstructed v1.3 and not a stripped Surgical prompt.
 */
export const REFLECTIVE_QUESTION_RELATION_ELIGIBILITY_ABLATION_ID =
  'reflective-question-oneiros-v1-3-relation-eligibility-ablation-rd-v0.1.0';
export const REFLECTIVE_QUESTION_RELATION_ELIGIBILITY_ABLATION_VERSION =
  '0.1.0';
export const REFLECTIVE_QUESTION_RELATION_ELIGIBILITY_ABLATION_OUTPUT_SLUG =
  'reflective-question-v1-3-relation-eligibility-ablation-rd-v0-1';

export const RELATION_ELIGIBILITY_ABLATION_FROZEN_V13_SOURCE_ARTIFACT =
  'tmp/reflective-question-v1-3-live-benchmark-2026-08-26T16-24-43-552Z/results.json';
export const RELATION_ELIGIBILITY_ABLATION_BASELINE_ID =
  'reflective-question-oneiros-reader-v1.3.0';
export const RELATION_ELIGIBILITY_ABLATION_BASELINE_VERSION = '1.3.0';
export const RELATION_ELIGIBILITY_ABLATION_BASELINE_SHA256 =
  '4e1b77249a1c793fb09f4ac57759d8be24a406ad00e19a6ead785c584182128b';

export const REFLECTIVE_QUESTION_RELATION_ELIGIBILITY_ABLATION_PROMPT = `REFLECTIVE QUESTION — ONEIROS

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

Selection guidance is internal. The wording of the final question should arise from the dream material itself, not from the language used in these instructions to choose an opening.

Output one reflective question only.
One strong question is complete.`;

export const REFLECTIVE_QUESTION_RELATION_ELIGIBILITY_ABLATION_SHA256 =
  'b362865905bf7ba723d2428592aec2b07c5a5b542077fb1b90d06d1f1cf09cd4';

export const RELATION_ELIGIBILITY_ABLATION_MODEL = 'gpt-5.4';
export const RELATION_ELIGIBILITY_ABLATION_TEMPERATURE = 0.45;
export const RELATION_ELIGIBILITY_ABLATION_MAX_COMPLETION_TOKENS = 500;
export const RELATION_ELIGIBILITY_ABLATION_FALLBACK_DISABLED = true;

export const RELATION_ELIGIBILITY_ABLATION_UX_SCORES = [0, 1, 2] as const;
export type RelationEligibilityAblationUxScore =
  (typeof RELATION_ELIGIBILITY_ABLATION_UX_SCORES)[number];

export function isRelationEligibilityAblationEnvEnabled(
  raw: string | undefined
): boolean {
  return raw?.trim() === '1';
}
