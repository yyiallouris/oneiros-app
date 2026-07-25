/**
 * Archetypal Echoes (persisted as interpretation.archetypes).
 * Canonical classical label first; dream-specific expression secondary.
 */

import {
  formatCanonicalArchetypeTitle,
  normalizeArchetype,
  normalizeArchetypeList,
} from '../constants/archetypes.ts';

export type ArchetypalEcho = {
  canonical_label: string;
  /** Concrete figure/configuration through which the archetype appears in this dream. */
  expression: string;
  resonance: string;
  evidence: string[];
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

function formatExpressionLead(expression: string): string {
  const trimmed = expression.trim();
  if (!trimmed) return '';
  if (/^appears\b/i.test(trimmed)) {
    return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`;
  }
  const lead = `Appears as ${trimmed}`;
  return /[.!?]$/.test(lead) ? lead : `${lead}.`;
}

/**
 * Normalize model/DB/local values into ArchetypalEcho objects.
 * Accepts legacy bare strings, display_label objects, and expression objects.
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

    out.push({
      canonical_label: canonical,
      expression: expressionDistinct,
      resonance,
      evidence,
    });
    if (out.length >= max) break;
  }

  return out;
}

function stripThe(name: string): string {
  return name.replace(/^\s*The\s+/i, '').trim();
}

export function formatArchetypalEchoForDisplay(item: ArchetypalEcho): EchoDisplayCard {
  const title = formatCanonicalArchetypeTitle(item.canonical_label);
  const expressionLead = formatExpressionLead(item.expression);
  const resonance = item.resonance.trim();
  const bodyParts: string[] = [];
  if (expressionLead) bodyParts.push(expressionLead);
  if (resonance) {
    const resonanceAlreadyShown =
      expressionLead &&
      expressionLead.toLowerCase().includes(resonance.toLowerCase().slice(0, Math.min(24, resonance.length)));
    if (!resonanceAlreadyShown) bodyParts.push(resonance);
  }
  return {
    title,
    body: bodyParts.join(' ').trim(),
  };
}

export function formatArchetypalEchoesForDisplay(
  raw: unknown,
  max: number = MAX_ARCHETYPAL_ECHOES
): EchoDisplayCard[] {
  return normalizeArchetypalEchoes(raw, max).map(formatArchetypalEchoForDisplay);
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
