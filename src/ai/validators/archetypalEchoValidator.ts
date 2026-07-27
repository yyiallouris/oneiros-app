/**
 * Deterministic filters for Archetypal Echoes after model selection.
 * Closed catalog by archetype_id + mechanism-tag hard gates (v4.1.3-B.2).
 *
 * Server resolves canonical_label and carrier_kind from catalog records.
 * Generic duplicate collapse by canonicalLabel uses confidence then
 * canonicalVariantPriority — no archetype-specific branches.
 */

import {
  ARCHETYPE_CATALOG_VERSION,
  getArchetypeDefinitionById,
  type ArchetypeDefinition,
} from '../catalogs/archetypeCatalog.v1.ts';
import type { ArchetypalEcho, ArchetypalEchoConfidence } from '../archetypalEchoes.ts';
import {
  ARCHETYPE_MECHANISM_HARD_GATES,
  mechanismGateRejectionReason,
  normalizeMechanismTags,
  type ArchetypeMechanismTag,
} from '../archetypeMechanisms.ts';
import { resolveDreamEvidenceIds, selectDisplayEvidence } from '../dreamEvidenceSpans.ts';

/** @deprecated Kept for debug/legacy evaluation bags; mechanism tags are authoritative. */
export type ArchetypeEvaluationSignals = {
  carrierType?: 'figure' | 'relationship' | 'field' | 'process';
  centrality?: number;
  activeInMainAction?: boolean;
  agency?: number;
  identityCompetition?: boolean;
  actualCrossing?: boolean;
  maternalFunction?: boolean;
  fieldTransformation?: boolean;
  futureBearing?: boolean;
  excludedOrDisownedRole?: boolean;
  engulfingOrPossessiveDynamic?: boolean;
  embodiedSovereign?: boolean;
};

export type ArchetypalEchoForValidation = {
  archetype_id?: unknown;
  canonical_label?: string;
  legacy_source_id?: unknown;
  expression: string;
  resonance: string;
  evidence?: string[];
  evidence_ids?: unknown;
  mechanism_tags?: unknown;
  confidence?: ArchetypalEchoConfidence | string;
  evaluation?: unknown;
  /** Legacy B.1 fields — ignored for validation in B.2. */
  carrier_kind?: unknown;
  mechanism_actor?: unknown;
  carrier_evidence_ids?: unknown;
  mechanism_evidence_ids?: unknown;
};

export type ValidatedArchetypalEcho = ArchetypalEcho & {
  archetype_id: string;
  archetype_catalog_version: string;
  evidence_ids: string[];
};

export type ArchetypalValidationResult = {
  accepted: ValidatedArchetypalEcho[];
  rejected: Array<{ echo: ArchetypalEchoForValidation; reason: string }>;
};

export function asArchetypeEvaluation(raw: unknown): ArchetypeEvaluationSignals | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  return raw as ArchetypeEvaluationSignals;
}

function readMechanismTags(echo: ArchetypalEchoForValidation): ArchetypeMechanismTag[] {
  return normalizeMechanismTags(echo.mechanism_tags);
}

function asIdArray(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean);
}

function readArchetypeId(echo: ArchetypalEchoForValidation): string {
  if (typeof echo.archetype_id === 'string' && echo.archetype_id.trim()) {
    return echo.archetype_id.trim();
  }
  return '';
}

function readLegacySourceId(
  echo: ArchetypalEchoForValidation,
  canonicalId: string
): 'great_mother' | 'terrible_mother' | undefined {
  if (echo.legacy_source_id === 'great_mother' || echo.legacy_source_id === 'terrible_mother') {
    return echo.legacy_source_id;
  }
  if (typeof echo.archetype_id === 'string') {
    const raw = echo.archetype_id.trim();
    if (raw === 'great_mother' || raw === 'terrible_mother') return raw;
  }
  if (canonicalId !== 'mother' || typeof echo.canonical_label !== 'string') return undefined;
  const label = echo.canonical_label.trim().replace(/^\s*The\s+/i, '').toLowerCase();
  if (label === 'great mother') return 'great_mother';
  if (label === 'terrible mother') return 'terrible_mother';
  return undefined;
}

function confidenceRank(confidence: ArchetypalEchoConfidence | undefined): number {
  if (confidence === 'high') return 2;
  if (confidence === 'medium') return 1;
  return 0;
}

function variantPriority(def: ArchetypeDefinition): number {
  return def.canonicalVariantPriority ?? Number.MAX_SAFE_INTEGER;
}

function resolveEvidence(
  echo: ArchetypalEchoForValidation,
  dreamText: string | undefined
): { ok: true; evidence: string[]; evidence_ids: string[] } | { ok: false; reason: string } {
  const evidenceIds = asIdArray(echo.evidence_ids);
  if (evidenceIds.length === 0) return { ok: false, reason: 'missing_evidence_ids' };
  if (!dreamText || !dreamText.trim()) {
    return { ok: true, evidence: [], evidence_ids: evidenceIds };
  }
  const resolved = resolveDreamEvidenceIds(evidenceIds, dreamText, { minCount: 1 });
  if (!resolved.ok) return { ok: false, reason: resolved.reason };
  const displayIds = selectDisplayEvidence(resolved.evidence_ids, 2);
  const displayIndex = new Map(resolved.evidence_ids.map((id, i) => [id, resolved.evidence[i]]));
  const evidence = displayIds.map((id) => displayIndex.get(id) ?? '').filter(Boolean);
  return { ok: true, evidence, evidence_ids: resolved.evidence_ids };
}

function buildValidatedEcho(
  echo: ArchetypalEchoForValidation,
  def: ArchetypeDefinition,
  evidence: string[],
  evidenceIds: string[]
): ValidatedArchetypalEcho {
  const confidence =
    echo.confidence === 'high' || echo.confidence === 'medium' ? echo.confidence : undefined;
  return {
    archetype_id: def.id,
    archetype_catalog_version: ARCHETYPE_CATALOG_VERSION,
    canonical_label: def.canonicalLabel,
    expression: echo.expression.trim(),
    resonance: echo.resonance.trim(),
    evidence,
    evidence_ids: evidenceIds,
    ...(confidence ? { confidence } : {}),
    ...(readLegacySourceId(echo, def.id)
      ? { legacy_source_id: readLegacySourceId(echo, def.id) }
      : {}),
  };
}

function collapseCanonicalDuplicates(
  candidates: ValidatedArchetypalEcho[],
  rejected: ArchetypalValidationResult['rejected']
): ValidatedArchetypalEcho[] {
  const groups = new Map<string, ValidatedArchetypalEcho[]>();
  for (const candidate of candidates) {
    const key = candidate.canonical_label.toLowerCase();
    const list = groups.get(key) ?? [];
    list.push(candidate);
    groups.set(key, list);
  }

  const kept: ValidatedArchetypalEcho[] = [];
  for (const group of groups.values()) {
    if (group.length === 1) {
      kept.push(group[0]);
      continue;
    }
    const sorted = [...group].sort((a, b) => {
      const confDiff = confidenceRank(b.confidence) - confidenceRank(a.confidence);
      if (confDiff !== 0) return confDiff;
      const defA = getArchetypeDefinitionById(a.archetype_id);
      const defB = getArchetypeDefinitionById(b.archetype_id);
      return variantPriority(defA!) - variantPriority(defB!);
    });
    kept.push(sorted[0]);
    for (const dropped of sorted.slice(1)) {
      rejected.push({
        echo: dropped,
        reason: 'duplicate_canonical_archetype_collapsed',
      });
    }
  }
  return kept;
}

/**
 * Validate echoes against closed catalog ids + mechanism hard gates.
 */
export function validateArchetypalEchoes(
  echoes: ArchetypalEchoForValidation[],
  options: {
    evaluations?: Array<ArchetypeEvaluationSignals | null | undefined>;
    max?: number;
    dreamText?: string;
  } = {}
): ArchetypalValidationResult {
  const max = options.max ?? 2;
  const accepted: ValidatedArchetypalEcho[] = [];
  const rejected: ArchetypalValidationResult['rejected'] = [];

  echoes.forEach((echo, index) => {
    const archetypeId = readArchetypeId(echo);
    if (!archetypeId) {
      rejected.push({ echo, reason: 'missing_archetype_id' });
      return;
    }

    const def = getArchetypeDefinitionById(archetypeId);
    if (!def) {
      rejected.push({ echo, reason: 'unknown_archetype_id' });
      return;
    }
    if (def.selectableAsEcho === false) {
      rejected.push({ echo, reason: 'archetype_not_selectable' });
      return;
    }

    const tags = readMechanismTags(echo);
    const gate = ARCHETYPE_MECHANISM_HARD_GATES[def.id];
    if (gate) {
      if (tags.length === 0) {
        rejected.push({ echo, reason: 'missing_mechanism_tags_for_hard_gate' });
        return;
      }
      const gateReason = mechanismGateRejectionReason(def.id, tags);
      if (gateReason) {
        rejected.push({ echo, reason: gateReason });
        return;
      }
    } else {
      const evaluation =
        options.evaluations?.[index] ?? asArchetypeEvaluation(echo.evaluation);
      if (evaluation) {
        if (def.id === 'double' && evaluation.identityCompetition === false) {
          rejected.push({ echo, reason: 'Double requires identityCompetition' });
          return;
        }
        if (def.id === 'divine_child' && evaluation.activeInMainAction === false) {
          rejected.push({ echo, reason: 'Divine Child requires activeInMainAction' });
          return;
        }
        if (def.id === 'ruler' && evaluation.embodiedSovereign === false) {
          rejected.push({ echo, reason: 'Ruler requires embodiedSovereign (not institution alone)' });
          return;
        }
      }
    }

    const evidenceResult = resolveEvidence(echo, options.dreamText);
    if (!evidenceResult.ok) {
      rejected.push({ echo, reason: evidenceResult.reason });
      return;
    }

    accepted.push(
      buildValidatedEcho(echo, def, evidenceResult.evidence, evidenceResult.evidence_ids)
    );
  });

  const collapsed = collapseCanonicalDuplicates(accepted, rejected);
  const finalAccepted: ValidatedArchetypalEcho[] = [];
  for (const echo of collapsed) {
    if (finalAccepted.length >= max) {
      rejected.push({ echo, reason: 'exceeds max archetypal echoes' });
      continue;
    }
    finalAccepted.push(echo);
  }

  return { accepted: finalAccepted, rejected };
}

/** Strip internal-only fields before persistence / UI when needed. */
export function toPersistedArchetypalEcho(echo: ValidatedArchetypalEcho): ArchetypalEcho & {
  archetype_id?: string;
  archetype_catalog_version?: string;
  evidence_ids?: string[];
} {
  return {
    canonical_label: echo.canonical_label,
    expression: echo.expression,
    resonance: echo.resonance,
    evidence: echo.evidence,
    ...(echo.confidence ? { confidence: echo.confidence } : {}),
    archetype_id: echo.archetype_id,
    archetype_catalog_version: echo.archetype_catalog_version,
    evidence_ids: echo.evidence_ids,
    ...(echo.legacy_source_id ? { legacy_source_id: echo.legacy_source_id } : {}),
  };
}

/** Expose gated catalog ids for tests/docs. */
export function gatedArchetypeDefinitionIds(): string[] {
  return Object.keys(ARCHETYPE_MECHANISM_HARD_GATES);
}

export type { ArchetypeDefinition };
