import {
  buildInitialReflectionRequest,
  DREAM_REFLECTION_PROMPT_ID,
  DREAM_REFLECTION_PROMPT_VERSION,
  SAME_CALL_REFLECTIVE_QUESTIONS_BUNDLE,
  SAME_CALL_REFLECTIVE_QUESTIONS_METHOD_ID,
  SAME_CALL_REFLECTIVE_QUESTIONS_METHOD_VERSION,
  type DreamReflectionInput,
  type ReflectionPromptRequest,
} from '../../dreamReflectionPrompt';

/**
 * Frozen v1.0.4 Q2-only evaluation candidate.
 *
 * This module is offline R&D. Client, gateway, billing, and deployable runtime
 * must continue to use the approved v1.0.3 production artifact until a later
 * explicit PO production approval.
 */
export const V104_IMAGINAL_HANDOFF_CANDIDATE_STATUS =
  'human_quality_hold_after_one_frozen_evaluation' as const;
export const V104_IMAGINAL_HANDOFF_METHOD_ID =
  'oneiros-same-call-reflective-questions-v1.0.4-candidate' as const;
export const V104_IMAGINAL_HANDOFF_METHOD_VERSION = '1.0.4-candidate' as const;
export const V104_IMAGINAL_HANDOFF_READER_PROMPT_ID =
  'oneiros-dream-reflection-v3.2.4-candidate' as const;
export const V104_IMAGINAL_HANDOFF_READER_PROMPT_VERSION =
  '3.2.4-candidate' as const;

export const V103_SYMBOLIC_RELATIONAL_IMAGINAL_Q2 =
  '- Question 2 — symbolic / relational / imaginal: open the dream symbolically, relationally, or imaginally. It may follow an image, relation, transformation, contradiction, recurring gesture, unresolved movement, symbolic tension, or surprising juxtaposition. Deepen or reopen the central movement already developed in the reading; do not start a new analytic thread. The second question may be more psychologically or symbolically suggestive than the first. Do not make it safe by reducing it to generic phenomenology.' as const;

export const V104_IMAGINAL_HANDOFF_Q2 = `- Question 2 — imaginal handoff:
  Return to one unresolved imaginal configuration already explicit in the dream and made salient by the reading.
  Hold it in the event, relation, or juxtaposition the dream itself stages, and ask one open question that carries its tension forward while leaving the next symbolic connection for the dreamer to make.` as const;

function replaceExactOccurrences(
  value: string,
  before: string,
  after: string,
  expectedOccurrences: number
): string {
  const parts = value.split(before);
  if (parts.length !== expectedOccurrences + 1) {
    throw new Error(
      `Frozen v1.0.4 candidate source drift: expected ${expectedOccurrences} occurrence(s).`
    );
  }
  return parts.join(after);
}

function buildFrozenCandidateBundle(): string {
  let bundle = SAME_CALL_REFLECTIVE_QUESTIONS_BUNDLE;
  bundle = replaceExactOccurrences(
    bundle,
    SAME_CALL_REFLECTIVE_QUESTIONS_METHOD_ID,
    V104_IMAGINAL_HANDOFF_METHOD_ID,
    1
  );
  bundle = replaceExactOccurrences(
    bundle,
    SAME_CALL_REFLECTIVE_QUESTIONS_METHOD_VERSION,
    V104_IMAGINAL_HANDOFF_METHOD_VERSION,
    1
  );
  bundle = replaceExactOccurrences(
    bundle,
    DREAM_REFLECTION_PROMPT_ID,
    V104_IMAGINAL_HANDOFF_READER_PROMPT_ID,
    1
  );
  bundle = replaceExactOccurrences(
    bundle,
    DREAM_REFLECTION_PROMPT_VERSION,
    V104_IMAGINAL_HANDOFF_READER_PROMPT_VERSION,
    1
  );
  return replaceExactOccurrences(
    bundle,
    V103_SYMBOLIC_RELATIONAL_IMAGINAL_Q2,
    V104_IMAGINAL_HANDOFF_Q2,
    3
  );
}

export const V104_IMAGINAL_HANDOFF_BUNDLE = buildFrozenCandidateBundle();

export const V104_IMAGINAL_HANDOFF_BUNDLE_SHA256 =
  'a4f972c00bbde525ad3f39db160afd18e3a1c18f8a92090e0eb7078b137e277d' as const;

export type V104ImaginalHandoffDepth = 'standard' | 'advanced';

/**
 * Builds the exact production-parity Reader request, replacing only the Q2
 * composition block in the Standard/Advanced format system message.
 */
export function buildV104ImaginalHandoffInitialRequest(
  dream: DreamReflectionInput,
  depth: V104ImaginalHandoffDepth
): ReflectionPromptRequest {
  const request = buildInitialReflectionRequest(dream, depth);
  return {
    ...request,
    messages: request.messages.map((message) => ({
      ...message,
      content: replaceExactOccurrences(
        message.content,
        V103_SYMBOLIC_RELATIONAL_IMAGINAL_Q2,
        V104_IMAGINAL_HANDOFF_Q2,
        message.role === 'system' && message.content.includes(V103_SYMBOLIC_RELATIONAL_IMAGINAL_Q2)
          ? 1
          : 0
      ),
    })),
  };
}
