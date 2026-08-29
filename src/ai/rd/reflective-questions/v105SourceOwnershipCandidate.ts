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
 * Frozen v1.0.5 Q2-only source-ownership evaluation candidate.
 *
 * This is the one final authorized Q2 prompt experiment. It remains offline
 * R&D. Client, gateway, billing, and deployable runtime stay on v1.0.3 unless
 * the completed human review receives a later explicit production approval.
 */
export const V105_SOURCE_OWNERSHIP_CANDIDATE_STATUS =
  'human_quality_hold_stop_q2_rd' as const;
export const V105_SOURCE_OWNERSHIP_METHOD_ID =
  'oneiros-same-call-reflective-questions-v1.0.5-candidate' as const;
export const V105_SOURCE_OWNERSHIP_METHOD_VERSION = '1.0.5-candidate' as const;
export const V105_SOURCE_OWNERSHIP_READER_PROMPT_ID =
  'oneiros-dream-reflection-v3.2.5-candidate' as const;
export const V105_SOURCE_OWNERSHIP_READER_PROMPT_VERSION =
  '3.2.5-candidate' as const;

export const V103_SYMBOLIC_RELATIONAL_IMAGINAL_Q2 =
  '- Question 2 — symbolic / relational / imaginal: open the dream symbolically, relationally, or imaginally. It may follow an image, relation, transformation, contradiction, recurring gesture, unresolved movement, symbolic tension, or surprising juxtaposition. Deepen or reopen the central movement already developed in the reading; do not start a new analytic thread. The second question may be more psychologically or symbolically suggestive than the first. Do not make it safe by reducing it to generic phenomenology.' as const;

export const V105_SOURCE_OWNERSHIP_Q2 = `- Question 2 — imaginal handoff:
  Return to one unresolved imaginal configuration explicitly present in the dream.
  Use the reading only to select the configuration; compose the question from the dream’s reported elements, preserving who or what each action or condition belongs to.
  Keep the question within that configuration and in the dream’s own concrete terms, with its direction still open to the dreamer.` as const;

function replaceExactOccurrences(
  value: string,
  before: string,
  after: string,
  expectedOccurrences: number
): string {
  const parts = value.split(before);
  if (parts.length !== expectedOccurrences + 1) {
    throw new Error(
      `Frozen v1.0.5 candidate source drift: expected ${expectedOccurrences} occurrence(s).`
    );
  }
  return parts.join(after);
}

function buildFrozenCandidateBundle(): string {
  let bundle = SAME_CALL_REFLECTIVE_QUESTIONS_BUNDLE;
  bundle = replaceExactOccurrences(
    bundle,
    SAME_CALL_REFLECTIVE_QUESTIONS_METHOD_ID,
    V105_SOURCE_OWNERSHIP_METHOD_ID,
    1
  );
  bundle = replaceExactOccurrences(
    bundle,
    SAME_CALL_REFLECTIVE_QUESTIONS_METHOD_VERSION,
    V105_SOURCE_OWNERSHIP_METHOD_VERSION,
    1
  );
  bundle = replaceExactOccurrences(
    bundle,
    DREAM_REFLECTION_PROMPT_ID,
    V105_SOURCE_OWNERSHIP_READER_PROMPT_ID,
    1
  );
  bundle = replaceExactOccurrences(
    bundle,
    DREAM_REFLECTION_PROMPT_VERSION,
    V105_SOURCE_OWNERSHIP_READER_PROMPT_VERSION,
    1
  );
  return replaceExactOccurrences(
    bundle,
    V103_SYMBOLIC_RELATIONAL_IMAGINAL_Q2,
    V105_SOURCE_OWNERSHIP_Q2,
    3
  );
}

export const V105_SOURCE_OWNERSHIP_BUNDLE = buildFrozenCandidateBundle();

export const V105_SOURCE_OWNERSHIP_BUNDLE_SHA256 =
  '16da1d13fb480dd57ef013a7e8241a8309ec06c67d3e1d071089cb24f54cf67a' as const;

export type V105SourceOwnershipDepth = 'standard' | 'advanced';

/**
 * Builds the production-parity Reader request and replaces only the Q2
 * composition job in the Standard/Advanced format system message.
 */
export function buildV105SourceOwnershipInitialRequest(
  dream: DreamReflectionInput,
  depth: V105SourceOwnershipDepth
): ReflectionPromptRequest {
  const request = buildInitialReflectionRequest(dream, depth);
  return {
    ...request,
    messages: request.messages.map((message) => ({
      ...message,
      content: replaceExactOccurrences(
        message.content,
        V103_SYMBOLIC_RELATIONAL_IMAGINAL_Q2,
        V105_SOURCE_OWNERSHIP_Q2,
        message.role === 'system' &&
          message.content.includes(V103_SYMBOLIC_RELATIONAL_IMAGINAL_Q2)
          ? 1
          : 0
      ),
    })),
  };
}
