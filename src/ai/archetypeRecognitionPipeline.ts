import type { ArchetypalEcho } from './archetypalEchoes.ts';
import {
  mapArchetypeRecognitionToArchetypalEchoes,
} from './archetypeRecognitionMapper.ts';
import type { ArchetypeAdjudicationResponse } from './schemas/archetypeAdjudicationSchema.ts';
import type {
  ArchetypeRecognitionId,
} from './catalogs/archetypeRecognitionCatalog.v2.ts';
import type { ArchetypeRecognitionResponse } from './schemas/archetypeRecognitionSchema.ts';

export type ArchetypeRecognitionPipelineIssue =
  | 'missing_candidate_decision'
  | 'unexpected_candidate_decision'
  | 'accepted_without_candidate'
  | 'accepted_ids_mismatch';

export type ArchetypeRecognitionPipelineResult =
  | {
      ok: true;
      filteredResponse: ArchetypeRecognitionResponse;
      acceptedArchetypeIds: ArchetypeRecognitionId[];
    }
  | {
      ok: false;
      issues: ArchetypeRecognitionPipelineIssue[];
      errors: string[];
    };

export type ArchetypeSetExpectation = {
  required_archetype_ids: ArchetypeRecognitionId[];
  allowed_secondary_archetype_ids: ArchetypeRecognitionId[];
  forbidden_archetype_ids?: ArchetypeRecognitionId[];
};

export function getAllowedArchetypeIds(
  expectation: ArchetypeSetExpectation
): ArchetypeRecognitionId[] {
  return [...new Set([...expectation.required_archetype_ids, ...expectation.allowed_secondary_archetype_ids])];
}

export function applyArchetypeAdjudicationToRecognition(
  discoveryResponse: ArchetypeRecognitionResponse,
  adjudicationResponse: ArchetypeAdjudicationResponse
): ArchetypeRecognitionPipelineResult {
  const candidateIds = discoveryResponse.archetypes.map((item) => item.archetype_id);
  const candidateSet = new Set(candidateIds);
  const decisionIds = adjudicationResponse.decisions.map((item) => item.archetype_id);
  const acceptedIds = adjudicationResponse.accepted_archetype_ids as ArchetypeRecognitionId[];
  const errors: string[] = [];
  const issues = new Set<ArchetypeRecognitionPipelineIssue>();

  for (const candidateId of candidateIds) {
    if (!decisionIds.includes(candidateId)) {
      issues.add('missing_candidate_decision');
      errors.push(`missing adjudication decision for discovery candidate: ${candidateId}`);
    }
  }

  for (const decisionId of decisionIds) {
    if (!candidateSet.has(decisionId)) {
      issues.add('unexpected_candidate_decision');
      errors.push(`adjudication decided unknown candidate: ${decisionId}`);
    }
  }

  for (const acceptedId of acceptedIds) {
    if (!candidateSet.has(acceptedId)) {
      issues.add('accepted_without_candidate');
      errors.push(`accepted_archetype_ids includes unknown candidate: ${acceptedId}`);
    }
  }

  const acceptedDecisionIds = adjudicationResponse.decisions
    .filter((item) => item.decision === 'accept')
    .map((item) => item.archetype_id);
  if (
    acceptedDecisionIds.length !== acceptedIds.length ||
    acceptedDecisionIds.some((id) => !acceptedIds.includes(id)) ||
    acceptedIds.some((id) => !acceptedDecisionIds.includes(id))
  ) {
    issues.add('accepted_ids_mismatch');
    errors.push('accepted_archetype_ids must match accept decisions exactly');
  }

  if (issues.size > 0) {
    return {
      ok: false,
      issues: [...issues],
      errors,
    };
  }

  const acceptedSet = new Set(acceptedIds);
  return {
    ok: true,
    filteredResponse: {
      archetypes: discoveryResponse.archetypes.filter((item) => acceptedSet.has(item.archetype_id)),
    },
    acceptedArchetypeIds: acceptedIds,
  };
}

export function mapAdjudicatedRecognitionToArchetypalEchoes(
  discoveryResponse: ArchetypeRecognitionResponse,
  adjudicationResponse: ArchetypeAdjudicationResponse,
  params: {
    dreamText: string;
    archetypeCatalogVersion?: string;
  }
): ArchetypalEcho[] {
  const applied = applyArchetypeAdjudicationToRecognition(discoveryResponse, adjudicationResponse);
  if (!applied.ok) return [];
  return mapArchetypeRecognitionToArchetypalEchoes(applied.filteredResponse, params);
}

export function evaluateArchetypeSetExpectation(
  actualArchetypeIds: readonly ArchetypeRecognitionId[],
  expectation: ArchetypeSetExpectation
): {
  pass: boolean;
  allowedArchetypeIds: ArchetypeRecognitionId[];
  missingRequiredIds: ArchetypeRecognitionId[];
  unexpectedIds: ArchetypeRecognitionId[];
  forbiddenIdsReturned: ArchetypeRecognitionId[];
} {
  const actual = [...new Set(actualArchetypeIds)];
  const allowed = getAllowedArchetypeIds(expectation);
  const allowedSet = new Set(allowed);
  const forbiddenSet = new Set(expectation.forbidden_archetype_ids ?? []);

  const missingRequiredIds = expectation.required_archetype_ids.filter((id) => !actual.includes(id));
  const unexpectedIds = actual.filter((id) => !allowedSet.has(id));
  const forbiddenIdsReturned = actual.filter((id) => forbiddenSet.has(id));

  return {
    pass:
      missingRequiredIds.length === 0 &&
      unexpectedIds.length === 0 &&
      forbiddenIdsReturned.length === 0,
    allowedArchetypeIds: allowed,
    missingRequiredIds,
    unexpectedIds,
    forbiddenIdsReturned,
  };
}
