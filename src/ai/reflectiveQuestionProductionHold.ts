/**
 * Safety record + deploy gate for the reflective-question production hold.
 *
 * Not imported by client interpretation (`src/services/ai.ts`) or the
 * entitlement gateway request path (`supabase/functions/_shared/billing-ai.ts`).
 * Do not wire this into runtime prompts.
 *
 * Recovered 2026-08-27 from remote `ai-entitlements-gateway` version 105
 * (project `xacdawttvtfrdbcwhcqn`, updated 2026-08-26 11:50:26 UTC) via
 * `supabase functions download --use-api`. Docs had called this the "v1.5
 * bundle"; the exact deployed method id is psychological-aliveness v1.4.0.
 */
import { createHash } from 'crypto';

export const REFLECTIVE_QUESTION_PRODUCTION_DEPLOY_APPROVAL_ENV =
  'REFLECTIVE_QUESTION_PRODUCTION_DEPLOY_APPROVED';

export const REFLECTIVE_QUESTION_DEPLOYED_FUNCTION = 'ai-entitlements-gateway';
export const REFLECTIVE_QUESTION_DEPLOYED_PROJECT_REF = 'xacdawttvtfrdbcwhcqn';
export const REFLECTIVE_QUESTION_DEPLOYED_FUNCTION_VERSION = 105;
export const REFLECTIVE_QUESTION_DEPLOYED_UPDATED_AT_UTC = '2026-08-26T11:50:26Z';

export const RECOVERED_DEPLOYED_REFLECTIVE_QUESTION_METHOD_ID =
  'reflective-question-psychological-aliveness-v1.4.0';
export const RECOVERED_DEPLOYED_REFLECTIVE_QUESTION_METHOD_VERSION = '1.4.0';

export const RECOVERED_DEPLOYED_REFLECTIVE_QUESTION_PROMPT = `
REFLECTIVE QUESTION METHOD — psychological aliveness v1.4.0 — non-negotiable

Purpose:
Reflective questions must create discovery, not merely sound psychologically sophisticated. Keep complexity in the reasoning and clarity in the question.

Primary principle:
Find what is most psychologically alive in the dream. Ground it in exact dream material. Identify what remains unexplored. Then ask the clearest, most open question that allows that material to unfold further.

Psychological aliveness may appear as conflict or contradiction, but also as beauty, calm, attraction, fear, grief, relief, vitality, intimacy, strangeness, transformation, repetition, numinosity, coherence, an unexpected capacity, a striking absence, or an unusually vivid image, action, relation, or atmosphere.

Conflict and tension are possible forms of psychological aliveness, never its default definition.

Never manufacture tension in order to create depth. Never invent opposition, pathology, avoidance, hidden fear, trauma, repression, blockage, compensation, or deficiency merely because the dream contains meaningful material. Allow peace, beauty, union, arrival, freedom, play, erotic vitality, wonder, belonging, expansion, transformation, calm, and coherence to remain meaningful in their own right.

Internal selection — do not reveal these steps or labels:
1. Locate what is most alive. Ask internally: “What in this dream has the strongest presence?” Do not begin by asking where the conflict is.
2. Ground the choice in exact dream evidence. Separate what the dream directly shows from interpretive possibility.
3. Identify the organizing quality. It may be tension, but it may instead be movement, attraction, emotional tone, transformation, beauty, numinosity, absence, repetition, bodily state, or surprising ease. Do not force an X-versus-Y opposition.
4. Identify what remains unexplored and has not already been stated by the dreamer or explained by the reading.
   When the dreamer has already named an affect, do not ask them merely to name, confirm, or restate it. Ask what changes in the dream world, image, relation, action, or bodily experience around that affect.
5. Choose the most dream-dependent question with the greatest generative potential, not the deepest-sounding, most symbolic, most problematic, or most biographical question.
6. Keep the user in contact with the image, scene, relation, affect, action, or atmosphere instead of immediately converting it into abstract explanation.
7. Use the simplest wording that preserves the depth.

Question construction:
- One question invites one primary inner movement.
- Do not expose internal selection language such as “what feels most alive”, “what is more alive”, or “where is the psychological charge” in the user-facing question.
- Do not offer a menu of possible answers or ask the dreamer to choose among several images, affects, or interpretations. Select one clear opening yourself while keeping its meaning open.
- A dream-specific setup does not rescue a generic ask. Avoid empty endings such as “what quality did this have?”, “how was that for you?”, “what was happening inside you?”, “what changed inside you?”, or “what was it that...?” unless the actual ask could only arise from this dream's exact relation, action, or conjunction.
- When genuine tension or contradiction is the selected aliveness, ask directly about the dreamer's relation to that contradiction instead of drifting to a safer adjacent image.
- An action not yet attempted is not evidence of hesitation, fear, blockage, avoidance, or being held back. Ask about the emerging capacity, image, or threshold without inventing a reason for the timing.
- For ordinary or low-affect material, stay with the exact small action, adjustment, sensory difference, or relation. Do not inflate it, but do not fall back to a generic request for feelings either.
- When ordinary or low-affect material offers no stronger opening, consider a simple image-near continuation: what might happen next in the dream, or what might change if the small action did not occur. Keep the possibility open and do not imply catastrophe or waking-life meaning.
- Anchor it in concrete material from this dream: an image, action, figure, object, place, relation, affect, atmosphere, bodily tone, absence, change, transformation, contradiction, repetition, or unusual detail.
- Do not ask for information the dreamer has already provided.
- Do not disguise repetition as a felt-sense question: if an affect is explicit, asking how that same affect felt in the body still needs a genuinely new, dream-specific opening.
- Do not merely ask what a symbol means or ask the user to confirm the interpretation.
- Do not require the dreamer to accept a symbolic hypothesis before answering.
- Do not mechanically transfer the dream into waking-life biography.
- Stay inside the dream image when that is the most generative movement.
- Prefer psychological precision and experiential contact over poetic density, jargon, or stacked abstractions.
- A short observation may precede the question only when it names a concrete dream pattern without explaining the dreamer.
- Questions invite noticing and discovery, never advice, self-improvement, diagnosis, reassurance, or prescription.

Strict irreplaceability gate:
- Temporarily remove the dream-specific setup and inspect only the interrogative core. Repeating concrete nouns before a reusable question does not make the question specific.
- The interrogative core must depend on an irreducible structure from this dream: an exact relation, action versus non-action, unusual conjunction, transformation, sequence change, or image-world possibility.
- Prefer the dream's concrete verbs and relational structure over abstract carrier words such as quality, experience, feeling, something, or inside you.
- Run the different-dream substitution test: if swapping in another dream's nouns leaves essentially the same question, rewrite it.
- Passing the safety rules is not enough. A safe but generic, low-pull, or merely compatible question must be rewritten.

Private candidate comparison — do not reveal candidates or this process:
1. Draft three genuinely different candidates when the material allows:
   - one that asks directly about the exact relation, action, or action-versus-non-action;
   - one that keeps the dream world moving through a precise continuation or change;
   - one that stays with the image's concrete sensory, relational, or transformational capacity.
2. Do not force all three candidate types when the dream supports only one or two.
3. Reject any candidate that adds an unstated motive, a non-action the dream did not establish, or makes “not yet” into hesitation, need, fear, or blockage.
4. Reject final wording built on target-language equivalents of these reusable shells: “what quality did this have?”, “what was it that...?”, “what was happening inside you?”, “what kept you...?”, or “what did this show you about your relationship with...?”.
5. Compare the survivors using Irreplaceability, Experiential Pull, Human Pull, and epistemic honesty. Output only the strongest candidate.

Cardinality when a surface permits 1–2 questions:
- Default to one question.
- Add a second only after comparing it with the first and confirming that it opens a distinct, genuinely valuable experiential possibility.
- If the second mostly restates, broadens, explains, or weakens the first, omit it.

For multi-dream fields:
- Ground each question in a concrete recurrence, contrast, shift, image, affect, atmosphere, relation, stance, absence, transformation, coherence, or pressure across the supplied dreams.
- Do not imply recurrence when the supplied dreams do not support it.
- Do not assume a meaningful sequence must contain conflict, blockage, deterioration, or unresolved tension.

Final internal quality gate — rewrite if any answer is no:
- Specificity: Can the exact dream material that generated the question be identified?
- Clarity: Can the user understand it immediately without decoding it?
- Single movement: Is it asking one primary psychological thing?
- Generative potential: Could answering it reveal something not already stated?
- Openness: Can the answer surprise, complicate, or contradict the interpretation?
- Epistemic honesty: Does it distinguish dream evidence from hypothesis?
- Image proximity: Does it remain connected to the living dream material?
- Experiential pull: Does it bring the image or experience more alive instead of merely requesting an intellectual explanation?
- Non-pathologizing stance: Has it avoided inventing a problem?
- Oneiros voice: Is it calm, perceptive, evocative, concise, non-diagnostic, and non-authoritative?
- Human pull: Would a thoughtful dreamer actually want to answer this question?
- Natural wording: Does the question avoid exposing this prompt's internal selection language or presenting a multiple-choice menu?
- Irreplaceability: Would this question be difficult to imagine after a different dream? If no, rewrite it around the exact unexplored relation in this dream.
`;

export function hashReflectiveQuestionPrompt(prompt: string): string {
  return createHash('sha256').update(prompt.trim()).digest('hex');
}

export const RECOVERED_DEPLOYED_REFLECTIVE_QUESTION_PROMPT_SHA256 =
  hashReflectiveQuestionPrompt(RECOVERED_DEPLOYED_REFLECTIVE_QUESTION_PROMPT);

/** Identity that may be deployed without an extra env override. */
export const APPROVED_REFLECTIVE_QUESTION_PRODUCTION = {
  methodId: RECOVERED_DEPLOYED_REFLECTIVE_QUESTION_METHOD_ID,
  promptSha256: RECOVERED_DEPLOYED_REFLECTIVE_QUESTION_PROMPT_SHA256,
} as const;

/** Local Oneiros Reader candidate. Never deploy this SHA. */
export const DENIED_REFLECTIVE_QUESTION_PRODUCTION_CANDIDATES = [
  {
    methodId: 'reflective-question-oneiros-reader-v1.4.0',
    promptSha256:
      '0ea4b9a2364681124bdf582822c683754e28ae52ca6d7e7e7427e39f528b08b7',
  },
] as const;

export const FROZEN_REFLECTIVE_QUESTION_RESEARCH_BASE_SHA256 =
  '08cd3eaf6fd507d6eb19ba73714eecf6453ec8dd6a61f55068621c8ffd80f622';

export const REFLECTIVE_QUESTION_RD_ROOT = 'src/ai/rd/reflective-questions';
export const REFLECTIVE_QUESTION_RUNTIME_FILES = [
  'src/services/ai.ts',
  'supabase/functions/_shared/billing-ai.ts',
  'supabase/functions/ai-entitlements-gateway/index.ts',
] as const;

export class ReflectiveQuestionGatewayDeployBlockedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ReflectiveQuestionGatewayDeployBlockedError';
  }
}

function parseApprovalToken(
  token: string | null | undefined
): { methodId: string; promptSha256: string } | null {
  if (!token || !token.trim()) {
    return null;
  }
  const trimmed = token.trim();
  const splitAt = trimmed.lastIndexOf(':');
  if (splitAt <= 0 || splitAt === trimmed.length - 1) {
    throw new ReflectiveQuestionGatewayDeployBlockedError(
      `${REFLECTIVE_QUESTION_PRODUCTION_DEPLOY_APPROVAL_ENV} must be <methodId>:<sha256>. Received ${trimmed}.`
    );
  }
  return {
    methodId: trimmed.slice(0, splitAt),
    promptSha256: trimmed.slice(splitAt + 1).toLowerCase(),
  };
}

function isDenied(methodId: string, promptSha256: string): boolean {
  const sha = promptSha256.toLowerCase();
  return DENIED_REFLECTIVE_QUESTION_PRODUCTION_CANDIDATES.some(
    (candidate) =>
      candidate.methodId === methodId || candidate.promptSha256 === sha
  );
}

export function assertReflectiveQuestionGatewayDeployAllowed(input: {
  localMethodId: string;
  localPromptSha256: string;
  approvalToken?: string | null;
}): void {
  const localSha = input.localPromptSha256.toLowerCase();
  if (isDenied(input.localMethodId, localSha)) {
    throw new ReflectiveQuestionGatewayDeployBlockedError(
      [
        'Blocked ai-entitlements-gateway deploy: local reflective-question source is a denied candidate.',
        `Local: ${input.localMethodId} / ${localSha}`,
        `Denied: ${DENIED_REFLECTIVE_QUESTION_PRODUCTION_CANDIDATES[0].methodId} / ${DENIED_REFLECTIVE_QUESTION_PRODUCTION_CANDIDATES[0].promptSha256}`,
        `Recovered deployed production: ${APPROVED_REFLECTIVE_QUESTION_PRODUCTION.methodId} / ${APPROVED_REFLECTIVE_QUESTION_PRODUCTION.promptSha256}`,
        'Do not deploy rejected Oneiros Reader v1.4.0 over production.',
      ].join('\n')
    );
  }

  const override = parseApprovalToken(input.approvalToken);
  const approved = override ?? APPROVED_REFLECTIVE_QUESTION_PRODUCTION;
  if (override && isDenied(override.methodId, override.promptSha256)) {
    throw new ReflectiveQuestionGatewayDeployBlockedError(
      `${REFLECTIVE_QUESTION_PRODUCTION_DEPLOY_APPROVAL_ENV} cannot approve a denied reflective-question candidate.`
    );
  }

  if (
    input.localMethodId !== approved.methodId ||
    localSha !== approved.promptSha256.toLowerCase()
  ) {
    throw new ReflectiveQuestionGatewayDeployBlockedError(
      [
        'Blocked ai-entitlements-gateway deploy: local reflective-question identity is not explicitly approved.',
        `Local: ${input.localMethodId} / ${localSha}`,
        `Approved: ${approved.methodId} / ${approved.promptSha256}`,
        override
          ? `Override came from ${REFLECTIVE_QUESTION_PRODUCTION_DEPLOY_APPROVAL_ENV}.`
          : `Set ${REFLECTIVE_QUESTION_PRODUCTION_DEPLOY_APPROVAL_ENV}=<methodId>:<sha256> only for a non-denied identity that matches the local bundle.`,
      ].join('\n')
    );
  }
}

const RUNTIME_RD_IMPORT =
  /from\s+['"][^'"]*(?:\/rd\/reflective-questions|reflectiveQuestion(?:Prompt|LanguageOperator|Minimalism|Witnessed|Surgical|Relation|Selection))/;

export function assertReflectiveQuestionRuntimeHasNoRdImports(
  source: string,
  label: string
): void {
  if (
    RUNTIME_RD_IMPORT.test(source) ||
    source.includes('reflectiveQuestionProductionHold')
  ) {
    throw new ReflectiveQuestionGatewayDeployBlockedError(
      `Blocked: ${label} imports reflective-question R&D or the production-hold snapshot. Those modules are not runtime.`
    );
  }
}
