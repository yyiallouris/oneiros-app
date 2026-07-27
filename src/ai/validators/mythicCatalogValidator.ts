/**
 * Closed-catalog Mythic Echo validator + deterministic title/tradition resolver.
 * v4.1.5-C.1: catalog_id + evidence integrity only — no matched_feature_ids gate.
 * No open-world fallback. Invalid/unknown → [].
 */

import {
  ALLOWED_MYTHIC_SOURCE_TYPES,
  getMythicCatalogEntry,
  MYTHIC_CATALOG_VERSION,
  resolveMythDisplay,
} from '../catalogs/mythicNarrativeCatalog.ts';
import type { MythicEcho, MythicEchoConfidence } from '../mythicEchoes.ts';
import { isMythicClosedCatalogV1Enabled } from '../mythicCatalogRuntime.ts';
import { resolveDreamEvidenceIds, selectDisplayEvidence } from '../dreamEvidenceSpans.ts';

export const MYTHIC_MATCH_DIMENSIONS = [
  'distinctive_cluster',
  'narrative_sequence',
  'relational_roles',
  'central_conflict',
  'transformation_or_ending',
  'general_theme',
] as const;

export type MythicMatchDimension = (typeof MYTHIC_MATCH_DIMENSIONS)[number];

export const MYTHIC_DIVERGENCE_TYPES = [
  'outcome_changed',
  'emphasis_changed',
  'pattern_interrupted',
  'pattern_unfinished',
  'core_structure_absent',
] as const;

export type MythicDivergenceType = (typeof MYTHIC_DIVERGENCE_TYPES)[number];

export type RawClosedCatalogMythicEcho = {
  catalog_id: string;
  resonance: string;
  divergence: string;
  evidence: string[];
  evidence_ids?: string[];
  confidence: MythicEchoConfidence;
  /** Debug-only — ignored by production validation (C.1). */
  matched_feature_ids?: string[];
  divergence_type?: string;
  evaluation?: {
    matched_dimensions?: string[];
    divergence_type?: string;
    disqualifiers_triggered?: string[];
    matched_feature_ids?: string[];
  };
};

export type SanitizedClosedMythicEcho = MythicEcho & {
  catalog_id: string;
  source_type: string;
  catalog_myth_version: string;
};

export type ClosedMythicValidationResult = {
  accepted: SanitizedClosedMythicEcho[];
  rejected: Array<{ raw: unknown; reason: string }>;
  logs: Array<Record<string, unknown>>;
};

export const DIMENSION_WEIGHTS: Record<MythicMatchDimension, number> = {
  distinctive_cluster: 4,
  narrative_sequence: 3,
  relational_roles: 3,
  central_conflict: 2,
  transformation_or_ending: 2,
  general_theme: 0.5,
};

function normalizeEvidenceText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFKC')
    .replace(/\s+/g, ' ')
    .trim();
}

export function computeMythicMatchScore(dimensions: MythicMatchDimension[]): number {
  return dimensions.reduce((sum, dim) => sum + (DIMENSION_WEIGHTS[dim] ?? 0), 0);
}

export function confidenceFromScore(score: number): MythicEchoConfidence | null {
  if (score >= 11) return 'high';
  if (score >= 8) return 'medium';
  return null;
}

export function evidenceTraceableToDream(evidence: string[], dreamText: string): boolean {
  const hay = normalizeEvidenceText(dreamText);
  if (!hay) return false;
  return evidence.every((item) => {
    const needle = normalizeEvidenceText(item);
    if (needle.length < 8) return false;
    return hay.includes(needle);
  });
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean);
}

/**
 * Validate one closed-catalog model amplification and resolve display fields.
 * C.1 integrity gate: catalog_id, confidence, resonance/divergence, ≥1 valid evidence span.
 */
export function validateClosedCatalogMythicEcho(
  raw: unknown,
  options: { dreamText: string }
): { echo?: SanitizedClosedMythicEcho; reason?: string; log: Record<string, unknown> } {
  const log: Record<string, unknown> = {
    myth_catalog_version: MYTHIC_CATALOG_VERSION,
    validation_warnings: [] as string[],
  };
  const warnings = log.validation_warnings as string[];

  if (!raw || typeof raw !== 'object') {
    return { reason: 'not_an_object', log };
  }
  const o = raw as Record<string, unknown>;

  if (typeof o.title === 'string' && o.title.trim()) {
    return { reason: 'model_authored_title_forbidden', log };
  }
  if (typeof o.tradition === 'string' && o.tradition.trim()) {
    return { reason: 'model_authored_tradition_forbidden', log };
  }
  if (typeof o.source_type === 'string' && o.source_type.trim()) {
    return { reason: 'model_authored_source_type_forbidden', log };
  }

  const catalogId = typeof o.catalog_id === 'string' ? o.catalog_id.trim() : '';
  log.raw_catalog_id = catalogId || null;
  if (!catalogId) return { reason: 'missing_catalog_id', log };

  const entry = getMythicCatalogEntry(catalogId);
  if (!entry) return { reason: 'unknown_catalog_id', log };
  if (!ALLOWED_MYTHIC_SOURCE_TYPES.includes(entry.source_type as never)) {
    return { reason: 'unsupported_source_type', log: { ...log, source_type: entry.source_type } };
  }

  const modelConfidence =
    typeof o.confidence === 'string' ? o.confidence.trim().toLowerCase() : '';
  if (modelConfidence && modelConfidence !== 'high' && modelConfidence !== 'medium') {
    return { reason: 'invalid_confidence', log };
  }

  const resonance = typeof o.resonance === 'string' ? o.resonance.trim() : '';
  const divergence = typeof o.divergence === 'string' ? o.divergence.trim() : '';
  if (resonance.length < 12) return { reason: 'resonance_too_short', log };
  if (divergence.length < 8) return { reason: 'divergence_too_short', log };

  const evidenceIdsRaw = asStringArray(o.evidence_ids);
  let evidence: string[] = [];
  if (evidenceIdsRaw.length > 0) {
    const resolved = resolveDreamEvidenceIds(evidenceIdsRaw, options.dreamText, { minCount: 1 });
    log.evidence_ids = resolved.evidence_ids;
    if (!resolved.ok) {
      return { reason: resolved.reason, log };
    }
    if (resolved.evidence_ids.length < 2) {
      warnings.push('evidence_span_count_below_preferred');
    }
    const displayIds = selectDisplayEvidence(resolved.evidence_ids, 3);
    const displayIndex = new Map(resolved.evidence_ids.map((id, i) => [id, resolved.evidence[i]]));
    evidence = displayIds.map((id) => displayIndex.get(id) ?? '').filter(Boolean);
    log.resolved_evidence_ids = resolved.evidence_ids;
  } else {
    evidence = asStringArray(o.evidence).slice(0, 3);
    if (evidence.length < 1) return { reason: 'evidence_count_below_1', log };
    if (evidence.length < 2) warnings.push('evidence_span_count_below_preferred');
    if (!evidenceTraceableToDream(evidence, options.dreamText)) {
      return { reason: 'evidence_not_traceable_to_dream', log };
    }
  }
  if (evidence.length < 1) return { reason: 'evidence_count_below_1', log };

  const display = resolveMythDisplay(catalogId);
  if (!display) return { reason: 'resolve_failed', log };

  const confidence: MythicEchoConfidence =
    modelConfidence === 'high' || modelConfidence === 'medium' ? modelConfidence : 'medium';

  const echo: SanitizedClosedMythicEcho = {
    catalog_id: catalogId,
    title: display.title,
    tradition: display.tradition,
    source_type: display.sourceType,
    resonance,
    divergence,
    evidence,
    confidence,
    catalog_myth_version: MYTHIC_CATALOG_VERSION,
  };

  log.resolved_title = echo.title;
  log.resolved_tradition = echo.tradition;
  return { echo, log };
}

export function validateClosedCatalogMythicEchoes(
  rawAmplifications: unknown,
  options: { dreamText: string; max?: number }
): ClosedMythicValidationResult {
  const max = options.max ?? 1;
  const accepted: SanitizedClosedMythicEcho[] = [];
  const rejected: ClosedMythicValidationResult['rejected'] = [];
  const logs: Array<Record<string, unknown>> = [];

  if (!isMythicClosedCatalogV1Enabled()) {
    logs.push({
      myth_catalog_version: MYTHIC_CATALOG_VERSION,
      validation_issues: ['feature_flag_off_returns_empty'],
      post_validation_amplification_count: 0,
    });
    return { accepted: [], rejected: [{ raw: rawAmplifications, reason: 'feature_flag_off' }], logs };
  }

  if (!Array.isArray(rawAmplifications) || rawAmplifications.length === 0) {
    logs.push({
      myth_catalog_version: MYTHIC_CATALOG_VERSION,
      raw_catalog_id: null,
      post_validation_amplification_count: 0,
    });
    return { accepted: [], rejected: [], logs };
  }

  for (const item of rawAmplifications) {
    if (accepted.length >= max) {
      rejected.push({ raw: item, reason: 'exceeds_max' });
      continue;
    }
    const result = validateClosedCatalogMythicEcho(item, { dreamText: options.dreamText });
    logs.push(result.log);
    if (result.echo) {
      accepted.push(result.echo);
    } else {
      rejected.push({ raw: item, reason: result.reason || 'rejected' });
    }
  }

  logs.push({ post_validation_amplification_count: accepted.length });
  return { accepted, rejected, logs };
}

/** Persisted shape helper — strips debug-only fields. */
export function toPersistedClosedMythicEcho(echo: SanitizedClosedMythicEcho): SanitizedClosedMythicEcho {
  return {
    catalog_id: echo.catalog_id,
    title: echo.title,
    tradition: echo.tradition,
    source_type: echo.source_type,
    resonance: echo.resonance,
    divergence: echo.divergence,
    evidence: [...echo.evidence],
    confidence: echo.confidence,
    catalog_myth_version: echo.catalog_myth_version,
  };
}

/** Adapt closed validation into the legacy debug pipeline shape. */
export function closedMythicValidationForDebug(result: ClosedMythicValidationResult): {
  accepted: MythicEcho[];
  rejected: Array<{ echo: MythicEcho; reason: string }>;
} {
  return {
    accepted: result.accepted,
    rejected: result.rejected.map((item) => {
      const echo =
        item.raw && typeof item.raw === 'object'
          ? ({
              title: typeof (item.raw as { title?: unknown }).title === 'string'
                ? String((item.raw as { title: string }).title)
                : '',
              tradition:
                typeof (item.raw as { tradition?: unknown }).tradition === 'string'
                  ? String((item.raw as { tradition: string }).tradition)
                  : '',
              resonance:
                typeof (item.raw as { resonance?: unknown }).resonance === 'string'
                  ? String((item.raw as { resonance: string }).resonance)
                  : '',
              divergence:
                typeof (item.raw as { divergence?: unknown }).divergence === 'string'
                  ? String((item.raw as { divergence: string }).divergence)
                  : '',
              evidence: asStringArray((item.raw as { evidence?: unknown }).evidence).slice(0, 3),
              ...(typeof (item.raw as { catalog_id?: unknown }).catalog_id === 'string'
                ? { catalog_id: String((item.raw as { catalog_id: string }).catalog_id) }
                : {}),
            } satisfies MythicEcho)
          : {
              title: '',
              tradition: '',
              resonance: '',
              divergence: '',
              evidence: [],
            };
      return { echo, reason: item.reason };
    }),
  };
}
