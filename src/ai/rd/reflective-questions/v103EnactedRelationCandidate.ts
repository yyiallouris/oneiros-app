import {
  buildInitialReflectionRequest,
  SAME_CALL_REFLECTIVE_QUESTIONS_BUNDLE,
  type DreamReflectionInput,
  type ReflectionPromptRequest,
} from '../../dreamReflectionPrompt';

/**
 * Frozen record of the v1.0.3 review candidate promoted to production.
 *
 * This module is not imported by client, gateway, or billing runtime. It records
 * the exact Q1-only composition hypothesis frozen for one approved offline
 * evaluation. The canonical Reader now owns these exact bytes; this R&D module
 * remains only for evaluation provenance and request-parity tests.
 */
export const V103_ENACTED_RELATION_CANDIDATE_STATUS =
  'po_approved_for_production' as const;
export const V103_ENACTED_RELATION_METHOD_ID =
  'oneiros-same-call-reflective-questions-v1.0.3-candidate' as const;
export const V103_ENACTED_RELATION_METHOD_VERSION = '1.0.3-candidate' as const;
export const V103_ENACTED_RELATION_READER_PROMPT_ID =
  'oneiros-dream-reflection-v3.2.3-candidate' as const;
export const V103_ENACTED_RELATION_READER_PROMPT_VERSION =
  '3.2.3-candidate' as const;

export const V101_OBSERVATIONAL_SOMATIC_Q1 =
  '- Question 1 — observational / somatic: prefer a concrete observational or remembered dream-body question when the dream supports it. Somatic means the body inside the remembered dream, never a present-time exercise. If a somatic question would be forced or uninteresting, use another concrete observational question instead.' as const;

export const V103_ENACTED_RELATION_Q1 = `- Question 1 — enacted relation:
  Begin from one complete event explicitly reported in the dream, where an action, response, or change connects two dream elements.
  Ask one open question that stays with the change or movement already shown in that event.
  Mere co-presence or an inferred connection does not qualify.` as const;

/**
 * Exact frozen candidate bundle, now byte-identical to the approved canonical
 * production prompt bundle.
 */
export const V103_ENACTED_RELATION_BUNDLE = SAME_CALL_REFLECTIVE_QUESTIONS_BUNDLE;

export const V103_ENACTED_RELATION_BUNDLE_SHA256 =
  'f5399a4973fb84365a25967890169fc2475cb2e2a9f65f0dffd2a8993101d9e7' as const;

export type V103EnactedRelationDepth = 'standard' | 'advanced';

/**
 * Historical evaluation entry point. Since the exact frozen candidate was
 * promoted, this delegates to the canonical production Reader without any
 * transformation. It remains unreachable from runtime under src/ai/rd.
 */
export function buildV103EnactedRelationInitialRequest(
  dream: DreamReflectionInput,
  depth: V103EnactedRelationDepth
): ReflectionPromptRequest {
  return buildInitialReflectionRequest(dream, depth);
}
