/**
 * Closed reflective-question R&D selection.
 *
 * status: frozen_rnd_reference
 * CLOSED R&D — not production.
 * Prompt grammar R&D remains STOP.
 *
 * Canonical record:
 * `docs/ONEIROS_QUESTION_REPAIR_PHASE2_EDITORIAL_FAIL_2026-08-29.md`
 */
export { SAME_CALL_MINIMAL_BUNDLE_SHA256, SAME_CALL_MINIMAL_METHOD_ID, SAME_CALL_MINIMAL_RD_STATUS } from './sameCallMinimal/sameCallMinimalCandidate';
export { QUESTION_INTEGRITY_GATE_BUNDLE_SHA256, QUESTION_INTEGRITY_GATE_METHOD_ID, QUESTION_INTEGRITY_GATE_RD_STATUS } from './questionIntegrityGate/questionIntegrityGateCandidate';
export { QUESTION_REPAIR_BUNDLE_SHA256, QUESTION_REPAIR_METHOD_ID, QUESTION_REPAIR_RD_STATUS } from './questionIntegrityGate/questionRepairCandidate';

export const ACTIVE_REFLECTIVE_QUESTION_RD_STATUS = 'frozen_rnd_reference' as const;
export const ACTIVE_REFLECTIVE_QUESTION_RD_SHA256 =
  '4506c8981c1e0f38edcb641bf89e59126bfdafe64a3adff99a94a2d1a12e81f7' as const;
