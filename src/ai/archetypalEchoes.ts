/**
 * Archetypal Echoes (persisted as interpretation.archetypes).
 * Canonical classical label first; dream-specific expression secondary.
 */

import {
  normalizeArchetype,
  normalizeArchetypeList,
} from '../constants/archetypes.ts';
import {
  canonicalizeArchetypeId,
  getArchetypeDefinitionById,
  getArchetypeDisplayLabel,
  getArchetypeDefinitionV1,
} from './catalogs/archetypeCatalog.v1.ts';

export type ArchetypalEchoConfidence = 'high' | 'medium';
export type LegacyArchetypeSourceId = 'great_mother' | 'terrible_mother';

export type ArchetypalEcho = {
  canonical_label: string;
  /** Concrete figure/configuration through which the archetype appears in this dream. */
  expression: string;
  resonance: string;
  evidence: string[];
  /**
   * Extraction confidence. Dream Detail shows high and medium.
   * Absent on legacy rows (still displayable until re-extract).
   */
  confidence?: ArchetypalEchoConfidence;
  /** Closed catalog id — persisted for audit/re-extract (v4.1.3-B.2). */
  archetype_id?: string;
  archetype_catalog_version?: string;
  evidence_ids?: string[];
  /** Optional audit provenance when a legacy pre-1.7.0 source id mapped into a canonical id. */
  legacy_source_id?: LegacyArchetypeSourceId;
};

export type EchoDisplayCard = {
  title: string;
  /** Optional muted line (e.g. mythic tradition). */
  subtitle?: string;
  body: string;
};

export const MAX_ARCHETYPAL_ECHOES = 2;
export const MAX_LEGACY_ARCHETYPAL_ECHOES = 8;

function asEvidence(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  for (const item of raw) {
    if (typeof item !== 'string') continue;
    const trimmed = item.trim();
    if (!trimmed) continue;
    out.push(trimmed);
    if (out.length >= 2) break;
  }
  return out;
}

function readConfidence(o: Record<string, unknown>): ArchetypalEchoConfidence | undefined {
  const raw = typeof o.confidence === 'string' ? o.confidence.trim().toLowerCase() : '';
  if (raw === 'high' || raw === 'medium') return raw;
  return undefined;
}

function fromLegacyLabel(raw: string): ArchetypalEcho[] {
  const legacySourceId = inferLegacyArchetypeSourceId({ rawLabel: raw });
  return normalizeArchetypeList(raw).map((canonical_label) => {
    const def = getArchetypeDefinitionV1(canonical_label);
    return {
      canonical_label,
      expression: '',
      resonance: '',
      evidence: [],
      ...(def ? { archetype_id: def.id } : {}),
      ...(legacySourceId ? { legacy_source_id: legacySourceId } : {}),
    };
  });
}

function readExpression(o: Record<string, unknown>): string {
  if (typeof o.expression === 'string' && o.expression.trim()) {
    return o.expression.trim();
  }
  // v4.1.1 model field alias
  if (typeof o.carrier === 'string' && o.carrier.trim()) {
    return o.carrier.trim();
  }
  // Legacy poetic primary field → secondary expression
  if (typeof o.display_label === 'string' && o.display_label.trim()) {
    return o.display_label.trim();
  }
  if (typeof o.displayLabel === 'string' && o.displayLabel.trim()) {
    return o.displayLabel.trim();
  }
  return '';
}

/** Strip formulaic lead-ins the model may still emit in resonance. */
function stripFormulaicResonanceLead(resonance: string): string {
  return resonance
    .replace(
      /^(appears as|manifests as|this archetype appears through|represents|symbolizes)\s+/i,
      ''
    )
    .trim();
}

function asEvidenceIds(raw: unknown): string[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const out = raw
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean);
  return out.length > 0 ? out : undefined;
}

function asLegacySourceId(raw: unknown): LegacyArchetypeSourceId | undefined {
  if (raw === 'great_mother' || raw === 'terrible_mother') return raw;
  return undefined;
}

function readCanonicalFromArchetypeId(raw: unknown): string {
  if (typeof raw !== 'string' || !raw.trim()) return '';
  const definition = getArchetypeDefinitionById(canonicalizeArchetypeId(raw.trim()));
  return definition?.canonicalLabel ?? '';
}

function legacySourceIdFromLabel(raw: string): LegacyArchetypeSourceId | undefined {
  const normalized = raw.trim().replace(/^\s*The\s+/i, '').toLowerCase();
  if (normalized === 'great mother') return 'great_mother';
  if (normalized === 'terrible mother') return 'terrible_mother';
  return undefined;
}

function inferLegacyArchetypeSourceId(params: {
  rawArchetypeId?: unknown;
  rawCanonicalLabel?: unknown;
  rawLabel?: unknown;
}): LegacyArchetypeSourceId | undefined {
  const fromId = asLegacySourceId(params.rawArchetypeId);
  if (fromId) return fromId;
  if (typeof params.rawCanonicalLabel === 'string') {
    const fromCanonical = legacySourceIdFromLabel(params.rawCanonicalLabel);
    if (fromCanonical) return fromCanonical;
  }
  if (typeof params.rawLabel === 'string') {
    return legacySourceIdFromLabel(params.rawLabel);
  }
  return undefined;
}

/**
 * Normalize model/DB/local values into ArchetypalEcho objects.
 * Accepts legacy bare strings, display_label objects, and expression objects.
 * Drops explicit low-confidence echoes (never stored for display).
 */
export function normalizeArchetypalEchoes(
  raw: unknown,
  max: number = MAX_LEGACY_ARCHETYPAL_ECHOES
): ArchetypalEcho[] {
  if (!Array.isArray(raw)) return [];
  const out: ArchetypalEcho[] = [];
  const seenCanonical = new Set<string>();

  for (const item of raw) {
    if (typeof item === 'string') {
      for (const echo of fromLegacyLabel(item)) {
        if (seenCanonical.has(echo.canonical_label)) continue;
        seenCanonical.add(echo.canonical_label);
        out.push(echo);
        if (out.length >= max) return out;
      }
      continue;
    }

    if (!item || typeof item !== 'object') continue;
    const o = item as Record<string, unknown>;
    const confidenceRaw =
      typeof o.confidence === 'string' ? o.confidence.trim().toLowerCase() : '';
    if (confidenceRaw === 'low') continue;
    const confidence = readConfidence(o);

    const canonicalRaw =
      typeof o.canonical_label === 'string'
        ? o.canonical_label
        : typeof o.canonicalLabel === 'string'
          ? o.canonicalLabel
          : readCanonicalFromArchetypeId(o.archetype_id);
    const expression = readExpression(o);
    const resonance = typeof o.resonance === 'string' ? o.resonance.trim() : '';
    const evidence = asEvidence(o.evidence);
    const evidence_ids = asEvidenceIds(o.evidence_ids);
    const legacy_source_id =
      asLegacySourceId(o.legacy_source_id) ??
      inferLegacyArchetypeSourceId({
        rawArchetypeId: o.archetype_id,
        rawCanonicalLabel: canonicalRaw,
      });

    let canonical = normalizeArchetype(canonicalRaw);
    if (!canonical && expression) {
      // Accept legacy objects that only stored a bare whitelist label in display_label.
      const asLabel = normalizeArchetype(expression);
      if (
        asLabel &&
        stripThe(expression).toLowerCase() === stripThe(asLabel).toLowerCase()
      ) {
        canonical = asLabel;
      }
    }
    if (!canonical) continue;
    if (seenCanonical.has(canonical)) continue;
    seenCanonical.add(canonical);

    // Drop expression when it is only a bare (possibly aliased) canonical label.
    const expressionAsArchetype = expression ? normalizeArchetype(expression) : null;
    const expressionDistinct =
      expression &&
      stripThe(expression).toLowerCase() !== stripThe(canonical).toLowerCase() &&
      expressionAsArchetype !== canonical
        ? expression
        : '';

    const definition = getArchetypeDefinitionV1(canonical);
    const rawArchetypeId =
      typeof o.archetype_id === 'string' && o.archetype_id.trim()
        ? canonicalizeArchetypeId(o.archetype_id.trim())
        : definition?.id;

    const echo: ArchetypalEcho = {
      canonical_label: canonical,
      expression: expressionDistinct,
      resonance,
      evidence,
    };
    if (confidence) echo.confidence = confidence;
    if (rawArchetypeId) echo.archetype_id = rawArchetypeId;
    if (typeof o.archetype_catalog_version === 'string' && o.archetype_catalog_version.trim()) {
      echo.archetype_catalog_version = o.archetype_catalog_version.trim();
    }
    if (evidence_ids) echo.evidence_ids = evidence_ids;
    if (legacy_source_id) echo.legacy_source_id = legacy_source_id;
    out.push(echo);
    if (out.length >= max) break;
  }

  return out;
}

function stripThe(name: string): string {
  return name.replace(/^\s*The\s+/i, '').trim();
}

/** Dream Detail shows high, medium, and legacy (missing confidence). */
export function isDisplayableArchetypalEcho(_item: ArchetypalEcho): boolean {
  return true;
}

export function formatArchetypalEchoForDisplay(item: ArchetypalEcho): EchoDisplayCard {
  const title = getArchetypeDisplayLabel(item.canonical_label);
  // Dream Detail shows catalog displayLabel + natural resonance only (expression stays in data).
  // Length is controlled at generation time in the extraction prompt — do not truncate here.
  const body = stripFormulaicResonanceLead(item.resonance.trim());
  return { title, body };
}

export function formatArchetypalEchoesForDisplay(
  raw: unknown,
  max: number = MAX_ARCHETYPAL_ECHOES
): EchoDisplayCard[] {
  return normalizeArchetypalEchoes(raw, max)
    .filter(isDisplayableArchetypalEcho)
    // Ego is a psychic-structure term for ambient agency — not a Dream Detail echo whisper.
    .filter((echo) => echo.canonical_label !== 'Ego')
    .map(formatArchetypalEchoForDisplay);
}

/** Canonical whitelist labels for Insights aggregation / pattern counts. */
export function canonicalArchetypeLabels(raw: unknown): string[] {
  return normalizeArchetypalEchoes(raw).map((echo) => echo.canonical_label);
}

export function formatArchetypesForEssay(raw: unknown): string {
  const echoes = normalizeArchetypalEchoes(raw, MAX_ARCHETYPAL_ECHOES);
  if (echoes.length === 0) return '(none)';
  return echoes
    .map((echo) => {
      const title = getArchetypeDisplayLabel(echo.canonical_label);
      const expression = echo.expression.trim();
      const resonance = echo.resonance.trim();
      if (expression && resonance) return `${title} (${expression}) — ${resonance}`;
      if (expression) return `${title} (${expression})`;
      if (resonance) return `${title} — ${resonance}`;
      return title;
    })
    .join('; ');
}
