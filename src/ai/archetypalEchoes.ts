/**
 * Archetypal Echoes (persisted as interpretation.archetypes).
 * Canonical classical label first; dream-specific expression secondary.
 */

import {
  formatCanonicalArchetypeTitle,
  normalizeArchetype,
  normalizeArchetypeList,
} from '../constants/archetypes.ts';

export type ArchetypalEchoConfidence = 'high' | 'medium';

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
};

export type EchoDisplayCard = {
  title: string;
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
  return normalizeArchetypeList(raw).map((canonical_label) => ({
    canonical_label,
    expression: '',
    resonance: '',
    evidence: [],
  }));
}

function readExpression(o: Record<string, unknown>): string {
  if (typeof o.expression === 'string' && o.expression.trim()) {
    return o.expression.trim();
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
          : '';
    const expression = readExpression(o);
    const resonance = typeof o.resonance === 'string' ? o.resonance.trim() : '';
    const evidence = asEvidence(o.evidence);

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

    const echo: ArchetypalEcho = {
      canonical_label: canonical,
      expression: expressionDistinct,
      resonance,
      evidence,
    };
    if (confidence) echo.confidence = confidence;
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
  const title = formatCanonicalArchetypeTitle(item.canonical_label);
  // Dream Detail shows canonical heading + natural resonance only (expression stays in data).
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
      const title = formatCanonicalArchetypeTitle(echo.canonical_label);
      const expression = echo.expression.trim();
      const resonance = echo.resonance.trim();
      if (expression && resonance) return `${title} (${expression}) — ${resonance}`;
      if (expression) return `${title} (${expression})`;
      if (resonance) return `${title} — ${resonance}`;
      return title;
    })
    .join('; ');
}
