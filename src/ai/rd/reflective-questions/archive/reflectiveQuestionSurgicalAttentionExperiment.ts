/**
 * Offline-only surgical attentional-selection patch of frozen v1.3.
 *
 * Not imported by the client interpretation path or the entitlement gateway.
 * Canonical local method remains `reflectiveQuestionPrompt.ts` (v1.4).
 * Frozen comparison baseline is v1.3, not a production revert.
 * Source of truth: frozen C `exact_prompt`, not a reconstructed v1.3.
 */
export const REFLECTIVE_QUESTION_SURGICAL_ATTENTION_ID =
  'reflective-question-oneiros-v1-3-surgical-attention-rd-v0.1.0';
export const REFLECTIVE_QUESTION_SURGICAL_ATTENTION_VERSION = '0.1.0';
export const REFLECTIVE_QUESTION_SURGICAL_ATTENTION_OUTPUT_SLUG =
  'reflective-question-v1-3-surgical-attention-rd-v0-1';

export const SURGICAL_ATTENTION_FROZEN_V13_SOURCE_ARTIFACT =
  'tmp/reflective-question-v1-3-live-benchmark-2026-08-26T16-24-43-552Z/results.json';
export const SURGICAL_ATTENTION_BASELINE_ID =
  'reflective-question-oneiros-reader-v1.3.0';
export const SURGICAL_ATTENTION_BASELINE_VERSION = '1.3.0';
export const SURGICAL_ATTENTION_BASELINE_SHA256 =
  '4e1b77249a1c793fb09f4ac57759d8be24a406ad00e19a6ead785c584182128b';

export const REFLECTIVE_QUESTION_SURGICAL_ATTENTION_PROMPT = `REFLECTIVE QUESTION — ONEIROS

Ask one reflective question that could only belong to this particular dream.

First understand what the dream is already showing.

Then look for one place where the dream itself gives unusual experiential, narrative, affective, bodily, or structural weight, and where something remains genuinely open to discover: contradiction, tension, transformation, bodily experience, emotional movement, atmosphere, strange detail, absence, gesture, relation, or unexpected combination. These are examples of dream-given material, not a search order.

Before writing the question, identify what the dream itself is placing weight on rather than what can most easily be turned into a reflective question. Evidence of dream-given weight can include explicit affect, repeated attention, consequential action, transformation, interruption, approach or withdrawal, bodily sensation, direct interaction, a paradox genuinely present in the dream, a striking change in atmosphere, explicit uncertainty, explicit emphasis by the dreamer, or something around which the dream materially turns. These are examples, not an ordered taxonomy.

The question must open a new angle of reflection.

It should not merely ask the dreamer to describe again what they already experienced or already told you.

Bad reflection only repeats:
“How was that for you?”
“How did that feel?”
“What did it look or sound like?”
“What happened there?”

A strong Oneiros question helps the dreamer notice something already given unusual weight inside the dream that was present but not yet fully seen.

Stay grounded in the dream.

Do not explain the dream for the dreamer.
Do not tell them what an image means.
Do not invent motives, feelings, fears, conflicts, intentions, pathology, repression, blockage, or symbolic meaning.
Do not assume that an action happened for a hidden reason.

Do not force conflict or depth.
Peace, beauty, erotic vitality, strangeness, transformation, ordinary gestures, and calm may be psychologically meaningful without hiding a problem.

When the dreamer has already named a feeling, do not simply ask them to describe that feeling again.
Instead, stay with how that named feeling is already staged in the dream: what it changes, accompanies, contradicts, or permits there. Do not invent a new relation around it.

Do not choose an opening merely because two details can be related. A relationship is eligible only when the dream itself materially stages that relationship.
Co-occurrence, proximity, being in the same scene, or interpretive contrast are not enough by themselves.
Do not add a second anchor merely to strengthen, deepen, or personalize the question. Use a second anchor only when it is part of the same phenomenon the dream itself presents. One anchor may be complete. Two anchors may be excellent. The dream decides.

When the dream presents a charged configuration, stay with the configuration without explaining it and without dissolving it into a generic feeling or noticing question. Do not flatten the tension either.

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
They are descriptive, not a search order. Relation or contrast is eligible only when the dream itself stages it.
Vary the wording naturally.

Do not choose an interpretation first and then write a question that leads the dreamer toward it.

Ask only about relations, contrasts, gestures, absences, or transformations that are visibly staged in the dream. Co-occurrence, proximity, or being in the same scene is not enough by itself.

The question should open the image, not smuggle in the interpretation.

Ordinary or emotionally neutral dream material does not need to be made symbolically important.
Do not make a detail psychologically important merely because a reflective question must be produced.
Prefer a small, precise question to manufactured depth.
If the dream itself is modest, the question may also be modest.
When the dream gives little psychological charge, prefer precise modest curiosity over invented depth.

Non-action is not automatically hesitation, avoidance, fear, unreadiness, blockage, or refusal.
If the dreamer does not act, stay with the image unless the dream itself clearly stages conflict around that non-action.

Prefer one clean sentence, usually around 12–28 words.
Clarity and psychological precision matter more than hitting a numeric target.

Write in the dreamer’s language.

Output one reflective question only.
One strong question is complete.`;

export const REFLECTIVE_QUESTION_SURGICAL_ATTENTION_SHA256 =
  '661ff5780dc2d9a3e1a5c7c1e83e97f2c67a5e01ff80897aa49557a3e2867eea';

export const SURGICAL_ATTENTION_MODEL = 'gpt-5.4';
export const SURGICAL_ATTENTION_TEMPERATURE = 0.45;
export const SURGICAL_ATTENTION_MAX_COMPLETION_TOKENS = 500;
export const SURGICAL_ATTENTION_FALLBACK_DISABLED = true;

export const SURGICAL_ATTENTION_UX_SCORES = [0, 1, 2] as const;
export type SurgicalAttentionUxScore =
  (typeof SURGICAL_ATTENTION_UX_SCORES)[number];

export const ORDINARY_MATERIAL_CLASSES = [
  'artificial_significance',
  'invented_relationship',
  'generic_safe_fallback',
  'question_shaped_paraphrase',
  'irrelevant_selection',
  'precise_modest_curiosity',
  'genuinely_useful_reflection',
] as const;
export type OrdinaryMaterialClass = (typeof ORDINARY_MATERIAL_CLASSES)[number];

export function isSurgicalAttentionEnvEnabled(
  raw: string | undefined
): boolean {
  return raw?.trim() === '1';
}
