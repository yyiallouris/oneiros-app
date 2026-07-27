/**
 * Reviewer-grade stage logs for Interpretive Echo benchmarks.
 * Shape matches Phase 0 / pro-reviewer request:
 * raw → parsed → normalized → validator_decisions → post_validation
 */
import { normalizeArchetypalEchoes } from '../../src/ai/archetypalEchoes';
import { validateStructuredTaskContent } from '../../src/ai/structuredTaskValidation';
import {
  toPersistedArchetypalEcho,
  validateArchetypalEchoes,
} from '../../src/ai/validators/archetypalEchoValidator';
import {
  toPersistedClosedMythicEcho,
  validateClosedCatalogMythicEchoes,
} from '../../src/ai/validators/mythicCatalogValidator';

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function readArchetypeId(row: unknown): string {
  if (!row || typeof row !== 'object') return '';
  const o = row as Record<string, unknown>;
  return typeof o.archetype_id === 'string' ? o.archetype_id.trim() : '';
}

export function buildEchoBenchmarkStages(
  rawParsed: Record<string, unknown>,
  dreamText: string
) {
  const validated = validateStructuredTaskContent('dream_extraction', JSON.stringify(rawParsed));
  const data = (validated.ok ? validated.data : rawParsed) as Record<string, unknown>;

  const rawArchetypes = asArray(rawParsed.archetypes);
  const parsedArchetypes = asArray(data.archetypes);
  const normalized = normalizeArchetypalEchoes(parsedArchetypes, 2);
  const archetypeValidation = validateArchetypalEchoes(parsedArchetypes as never, {
    max: 2,
    dreamText,
  });

  const validator_decisions = parsedArchetypes.map((row) => {
    const o = row && typeof row === 'object' ? (row as Record<string, unknown>) : {};
    const archetype_id = readArchetypeId(row);
    const expression = typeof o.expression === 'string' ? o.expression : '';
    const rejected = archetypeValidation.rejected.find(
      (r) => readArchetypeId(r.echo) === archetype_id && r.echo.expression === expression
    );
    const accepted = archetypeValidation.accepted.some(
      (a) => a.archetype_id === archetype_id && a.expression === expression
    );
    return {
      archetype_id,
      canonical_label:
        archetypeValidation.accepted.find(
          (a) => a.archetype_id === archetype_id && a.expression === expression
        )?.canonical_label ??
        (typeof o.canonical_label === 'string' ? o.canonical_label : ''),
      accepted,
      rejection_codes: rejected ? [rejected.reason] : [],
      rejection_reason: rejected?.reason ?? null,
      mechanism_tags: Array.isArray(o.mechanism_tags) ? o.mechanism_tags : [],
      evidence_ids: Array.isArray(o.evidence_ids) ? o.evidence_ids : [],
    };
  });

  for (const row of rawArchetypes) {
    if (!row || typeof row !== 'object') continue;
    const archetype_id = readArchetypeId(row);
    if (!archetype_id) continue;
    if (!validator_decisions.some((d) => d.archetype_id === archetype_id)) {
      validator_decisions.push({
        archetype_id,
        canonical_label:
          typeof (row as { canonical_label?: unknown }).canonical_label === 'string'
            ? String((row as { canonical_label: string }).canonical_label)
            : '',
        accepted: false,
        rejection_codes: ['lost_before_or_during_normalize'],
        rejection_reason: 'lost_before_or_during_normalize',
        mechanism_tags: [],
        evidence_ids: [],
      });
    }
  }

  const amplificationsRaw = asArray(data.amplifications);
  const mythicValidation = validateClosedCatalogMythicEchoes(amplificationsRaw, {
    dreamText,
    max: 1,
  });

  return {
    raw_archetypes: rawArchetypes,
    parsed_archetypes: parsedArchetypes,
    normalized_archetypes: normalized,
    validator_decisions,
    post_validation_archetypes: archetypeValidation.accepted.map(toPersistedArchetypalEcho),
    archetype_rejected: archetypeValidation.rejected.map((r) => ({
      archetype_id: readArchetypeId(r.echo),
      canonical_label: r.echo.canonical_label ?? null,
      reason: r.reason,
    })),
    raw_amplifications: asArray(rawParsed.amplifications),
    mythic_validator_logs: mythicValidation.logs,
    post_validation_amplifications: mythicValidation.accepted.map(toPersistedClosedMythicEcho),
    mythic_reject_reasons: mythicValidation.rejected.map((r) => r.reason),
    mythic_rejected: mythicValidation.rejected.map((r) => ({
      catalog_id:
        r.raw && typeof r.raw === 'object' && typeof (r.raw as { catalog_id?: unknown }).catalog_id === 'string'
          ? String((r.raw as { catalog_id: string }).catalog_id)
          : null,
      reason: r.reason,
    })),
  };
}

/** Default: fully parallel (all jobs). Override with ACCEPTANCE_CONCURRENCY. */
export function resolveBenchmarkConcurrency(jobCount: number): number {
  const raw = process.env.ACCEPTANCE_CONCURRENCY?.trim();
  if (raw) return Math.max(1, Number(raw) || 1);
  return Math.max(1, jobCount);
}
