import type { NarrativeFirstEssayContextEntry, ReflectiveEssaySurface } from './reflectiveEssayContext';
import { buildNarrativeFirstEssayContext } from './reflectiveEssayContext';

export const REFLECTIVE_ESSAY_FIELD_MAP_PROMPT_ID = 'oneiros-reflective-essay-field-map-spike';
export const REFLECTIVE_ESSAY_FIELD_MAP_PROMPT_VERSION = '0.1.0-rd';
export const REFLECTIVE_ESSAY_FIELD_MAP_SCHEMA_VERSION = 1;
export const REFLECTIVE_ESSAY_FIELD_MAP_TEMPERATURE = 0;

export type FieldTopology = 'unified' | 'parallel_clusters' | 'loose';

export type FieldMapEvidence = {
  dream_index: number;
  detail: string;
};

export type FieldMapRelation = {
  scope: 'field' | 'cluster';
  cluster_id: string | null;
  relation: string;
  evidence: FieldMapEvidence[];
};

export type ReflectiveEssayFieldMap = {
  schema_version: 1;
  topology: FieldTopology;
  clusters: Array<{
    cluster_id: string;
    dream_indices: number[];
    concrete_recurrences: string[];
  }>;
  supported_cross_dream_relations: FieldMapRelation[];
  unsupported_or_weak_affinities: Array<{
    dream_indices: number[];
    affinity: string;
    reason_not_structural: string;
  }>;
  temporal_movement: {
    status: 'supported' | 'unsupported';
    evidence: FieldMapEvidence[];
  };
};

export const REFLECTIVE_ESSAY_FIELD_MAP_SYSTEM_PROMPT = `You are an evidence mapper for a reflective dream-essay research spike.

Your only task is to classify the observable topology of a multi-dream set before any essay is written.
Do not interpret the dreamer, write reflective prose, use Jungian language, name what is psychologically alive, or create a symbolic landing.

Decide only:
- which dreams have concrete, cross-dream relations;
- which dreams form local clusters;
- which similarities are weak, atmospheric, generic, or unsupported;
- whether chronology supports temporal movement.

Topology rules:
- unified: at least one field-level relation is visible in concrete dream situations, affects, and actions across the relevant dreams;
- parallel_clusters: two or more local clusters have concrete internal relations, but no concrete bridge earns one master field;
- loose: no sufficiently dense organization is supported; isolated or weak affinities may still be recorded.

Evidence rules:
- Every supported relation must cite at least two dream indices and a concrete detail from each.
- A repeated noun alone does not prove a shared stance or movement.
- Generic qualities such as ease, care, attention, proportion, restraint, agency, handling, tact, openness, or non-interference cannot create a field-level relation unless recognizably comparable situations, affects, and actions recur.
- Previous interpretation notes are hypotheses, never evidence.
- Chronological order is not temporal movement. Mark movement supported only when concrete changes in a comparable image, situation, or response establish it.
- For parallel clusters, mark local relations with scope "cluster" and the matching cluster_id. Do not promote them to scope "field".
- For loose topology, supported_cross_dream_relations must be empty.

Return JSON only. Use this exact shape:
{
  "schema_version": 1,
  "topology": "unified|parallel_clusters|loose",
  "clusters": [
    {
      "cluster_id": "cluster_1",
      "dream_indices": [1, 2],
      "concrete_recurrences": ["short factual relation"]
    }
  ],
  "supported_cross_dream_relations": [
    {
      "scope": "field|cluster",
      "cluster_id": null,
      "relation": "short factual relation",
      "evidence": [
        { "dream_index": 1, "detail": "concrete dream detail" },
        { "dream_index": 2, "detail": "concrete dream detail" }
      ]
    }
  ],
  "unsupported_or_weak_affinities": [
    {
      "dream_indices": [1, 3],
      "affinity": "short similarity",
      "reason_not_structural": "why it does not earn a shared field"
    }
  ],
  "temporal_movement": {
    "status": "supported|unsupported",
    "evidence": []
  }
}`;

export function buildReflectiveEssayFieldMapMessages(params: {
  entries: NarrativeFirstEssayContextEntry[];
  surface: ReflectiveEssaySurface;
}): Array<{ role: 'system' | 'user'; content: string }> {
  const context = buildNarrativeFirstEssayContext(params.entries, params.surface);
  return [
    { role: 'system', content: REFLECTIVE_ESSAY_FIELD_MAP_SYSTEM_PROMPT },
    {
      role: 'user',
      content: `Map this dream set without writing an essay.\n\n${context}`,
    },
  ];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function nonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function validIndices(value: unknown, dreamCount: number): value is number[] {
  return Array.isArray(value)
    && value.length > 0
    && value.every((item) => Number.isInteger(item) && item >= 1 && item <= dreamCount);
}

export function parseReflectiveEssayFieldMap(raw: string): unknown {
  const clean = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  const start = clean.indexOf('{');
  const end = clean.lastIndexOf('}');
  if (start < 0 || end <= start) return null;
  try {
    return JSON.parse(clean.slice(start, end + 1));
  } catch {
    return null;
  }
}

export function validateReflectiveEssayFieldMap(
  value: unknown,
  dreamCount: number
): { ok: true; value: ReflectiveEssayFieldMap } | { ok: false; errors: string[] } {
  const errors: string[] = [];
  if (!isRecord(value)) return { ok: false, errors: ['field map is not an object'] };

  const topology = value.topology;
  if (!['unified', 'parallel_clusters', 'loose'].includes(String(topology))) {
    errors.push('invalid topology');
  }
  if (value.schema_version !== REFLECTIVE_ESSAY_FIELD_MAP_SCHEMA_VERSION) {
    errors.push('invalid schema_version');
  }

  const clusters = value.clusters;
  const clusterIds = new Set<string>();
  if (!Array.isArray(clusters)) {
    errors.push('clusters must be an array');
  } else {
    clusters.forEach((cluster, index) => {
      if (!isRecord(cluster)) {
        errors.push(`clusters[${index}] must be an object`);
        return;
      }
      if (!nonEmptyString(cluster.cluster_id)) {
        errors.push(`clusters[${index}].cluster_id is required`);
      } else if (clusterIds.has(cluster.cluster_id)) {
        errors.push(`clusters[${index}].cluster_id must be unique`);
      } else {
        clusterIds.add(cluster.cluster_id);
      }
      if (!validIndices(cluster.dream_indices, dreamCount)) errors.push(`clusters[${index}].dream_indices invalid`);
      if (!Array.isArray(cluster.concrete_recurrences)
        || !cluster.concrete_recurrences.every(nonEmptyString)) {
        errors.push(`clusters[${index}].concrete_recurrences invalid`);
      }
    });
  }

  const relations = value.supported_cross_dream_relations;
  if (!Array.isArray(relations)) {
    errors.push('supported_cross_dream_relations must be an array');
  } else {
    relations.forEach((relation, index) => {
      if (!isRecord(relation)) {
        errors.push(`supported_cross_dream_relations[${index}] must be an object`);
        return;
      }
      if (!['field', 'cluster'].includes(String(relation.scope))) errors.push(`relation[${index}].scope invalid`);
      if (relation.scope === 'cluster' && !nonEmptyString(relation.cluster_id)) {
        errors.push(`relation[${index}].cluster_id required for cluster scope`);
      } else if (relation.scope === 'cluster'
        && nonEmptyString(relation.cluster_id)
        && !clusterIds.has(relation.cluster_id)) {
        errors.push(`relation[${index}].cluster_id must reference a declared cluster`);
      }
      if (relation.scope === 'field' && relation.cluster_id !== null) {
        errors.push(`relation[${index}].cluster_id must be null for field scope`);
      }
      if (!nonEmptyString(relation.relation)) errors.push(`relation[${index}].relation required`);
      const evidence = relation.evidence;
      if (!Array.isArray(evidence) || evidence.length < 2) {
        errors.push(`relation[${index}] needs evidence from at least two dreams`);
      } else {
        const evidenceDreams = new Set<number>();
        evidence.forEach((item) => {
          if (!isRecord(item)
            || !Number.isInteger(item.dream_index)
            || Number(item.dream_index) < 1
            || Number(item.dream_index) > dreamCount
            || !nonEmptyString(item.detail)) {
            errors.push(`relation[${index}] has invalid evidence`);
          } else {
            evidenceDreams.add(Number(item.dream_index));
          }
        });
        if (evidenceDreams.size < 2) errors.push(`relation[${index}] evidence must span two dreams`);
      }
    });
  }

  const weak = value.unsupported_or_weak_affinities;
  if (!Array.isArray(weak)) {
    errors.push('unsupported_or_weak_affinities must be an array');
  } else {
    weak.forEach((affinity, index) => {
      if (!isRecord(affinity)
        || !validIndices(affinity.dream_indices, dreamCount)
        || !nonEmptyString(affinity.affinity)
        || !nonEmptyString(affinity.reason_not_structural)) {
        errors.push(`unsupported_or_weak_affinities[${index}] invalid`);
      }
    });
  }

  const movement = value.temporal_movement;
  if (!isRecord(movement) || !['supported', 'unsupported'].includes(String(movement.status))) {
    errors.push('temporal_movement invalid');
  } else if (!Array.isArray(movement.evidence)) {
    errors.push('temporal_movement.evidence must be an array');
  } else {
    movement.evidence.forEach((item) => {
      if (!isRecord(item)
        || !Number.isInteger(item.dream_index)
        || Number(item.dream_index) < 1
        || Number(item.dream_index) > dreamCount
        || !nonEmptyString(item.detail)) {
        errors.push('temporal_movement has invalid evidence');
      }
    });
    if (movement.status === 'supported'
      && new Set(
        movement.evidence
          .filter(isRecord)
          .map((item) => Number(item.dream_index))
          .filter((index) => Number.isInteger(index))
      ).size < 2) {
      errors.push('supported temporal_movement requires evidence from at least two dreams');
    }
    if (movement.status === 'unsupported' && movement.evidence.length > 0) {
      errors.push('unsupported temporal_movement must have empty evidence');
    }
  }

  if (topology === 'loose' && Array.isArray(relations) && relations.length > 0) {
    errors.push('loose topology cannot contain supported cross-dream relations');
  }
  if (topology === 'parallel_clusters' && (!Array.isArray(clusters) || clusters.length < 2)) {
    errors.push('parallel_clusters topology requires at least two clusters');
  }
  if (topology === 'parallel_clusters'
    && Array.isArray(relations)
    && relations.some((relation) => isRecord(relation) && relation.scope === 'field')) {
    errors.push('parallel_clusters topology cannot contain field-scoped relations');
  }
  if (topology === 'unified'
    && (!Array.isArray(relations)
      || !relations.some((relation) => isRecord(relation) && relation.scope === 'field'))) {
    errors.push('unified topology requires a field-scoped relation');
  }

  return errors.length > 0
    ? { ok: false, errors }
    : { ok: true, value: value as ReflectiveEssayFieldMap };
}

export function buildFieldMapBoundEssayContext(
  fieldMap: ReflectiveEssayFieldMap,
  narrativeFirstContext: string
): string {
  return `STRUCTURED FIELD MAP — BINDING COMPOSITION BOUNDARY
Preserve this topology and its evidence limits. Do not add a field relation, cluster bridge, or temporal movement that the map marks unsupported.
${JSON.stringify(fieldMap)}

NARRATIVE-FIRST DREAM EVIDENCE
${narrativeFirstContext}`;
}
