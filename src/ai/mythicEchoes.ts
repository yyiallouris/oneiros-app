/**
 * Mythic Echoes (persisted as interpretation.amplifications).
 * Named world-mythology parallels — provisional, not Dream Fabric extraction.
 */

import type { EchoDisplayCard } from './archetypalEchoes.ts';
import {
  MYTHIC_CATALOG_VERSION,
  resolveMythDisplay,
} from './catalogs/mythicNarrativeCatalog.ts';

export type MythicEchoConfidence = 'high' | 'medium';

export type MythicEcho = {
  /** Established name of the myth, narrative, or figure. */
  title: string;
  /** Cultural or historical tradition (e.g. Greek, Mesopotamian). */
  tradition: string;
  /** Structural kinship with the dream. */
  resonance: string;
  /** Important way the dream diverges from the traditional story. */
  divergence: string;
  evidence: string[];
  /**
   * Extraction confidence. Dream Detail shows `high` and `medium`.
   * Absent on legacy rows (still displayable until re-extract).
   */
  confidence?: MythicEchoConfidence;
  /** Closed-catalog id (authoritative for new extractions). */
  catalog_id?: string;
  /** Catalog source_type resolved server-side (not model-authored). */
  source_type?: string;
  /** Closed catalog version string, e.g. "1.0.0". */
  catalog_myth_version?: string;
};

/** New extractions should stay at 0–1; legacy rows may still have 2 brief items. */
export const MAX_MYTHIC_ECHOES = 1;
export const MAX_LEGACY_MYTHIC_ECHOES = 2;

function asEvidence(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  for (const item of raw) {
    if (typeof item !== 'string') continue;
    const trimmed = item.trim();
    if (!trimmed) continue;
    out.push(trimmed);
    if (out.length >= 3) break;
  }
  return out;
}

function readTitle(o: Record<string, unknown>): string {
  if (typeof o.title === 'string' && o.title.trim()) return o.title.trim();
  if (typeof o.echo_name === 'string' && o.echo_name.trim()) return o.echo_name.trim();
  if (typeof o.echoName === 'string' && o.echoName.trim()) return o.echoName.trim();
  if (typeof o.echo === 'string' && o.echo.trim()) return o.echo.trim();
  return '';
}

/** Canonical key is `divergence`; accept legacy `difference` on read only. */
function readDivergence(o: Record<string, unknown>): string {
  if (typeof o.divergence === 'string' && o.divergence.trim()) return o.divergence.trim();
  if (typeof o.difference === 'string' && o.difference.trim()) return o.difference.trim();
  return '';
}

function readConfidence(o: Record<string, unknown>): MythicEchoConfidence | undefined {
  const raw = typeof o.confidence === 'string' ? o.confidence.trim().toLowerCase() : '';
  if (raw === 'high' || raw === 'medium') return raw;
  return undefined;
}

export function normalizeAmplifications(
  raw: unknown,
  max: number = MAX_LEGACY_MYTHIC_ECHOES
): MythicEcho[] {
  if (!Array.isArray(raw)) return [];
  const out: MythicEcho[] = [];

  for (const item of raw) {
    if (typeof item === 'string') {
      const resonance = item.trim();
      if (!resonance) continue;
      out.push({
        title: '',
        tradition: '',
        resonance,
        divergence: '',
        evidence: [],
      });
    } else if (item && typeof item === 'object') {
      const o = item as Record<string, unknown>;
      const confidenceRaw =
        typeof o.confidence === 'string' ? o.confidence.trim().toLowerCase() : '';
      if (confidenceRaw === 'low') continue;
      const catalog_id = typeof o.catalog_id === 'string' ? o.catalog_id.trim() : '';
      const resolvedDisplay = catalog_id ? resolveMythDisplay(catalog_id) : null;
      const title = readTitle(o) || resolvedDisplay?.title || '';
      const tradition =
        (typeof o.tradition === 'string' ? o.tradition.trim() : '') ||
        resolvedDisplay?.tradition ||
        '';
      const resonance = typeof o.resonance === 'string' ? o.resonance.trim() : '';
      const divergence = readDivergence(o);
      const confidence = readConfidence(o);
      const source_type =
        (typeof o.source_type === 'string' ? o.source_type.trim() : '') ||
        resolvedDisplay?.sourceType ||
        '';
      const catalog_myth_version =
        (typeof o.catalog_myth_version === 'string' ? o.catalog_myth_version.trim() : '') ||
        (catalog_id ? MYTHIC_CATALOG_VERSION : '');
      const dreamImage = typeof o.dream_image === 'string' ? o.dream_image.trim() : '';
      const evidence = asEvidence(o.evidence);
      if (dreamImage && !evidence.includes(dreamImage) && evidence.length < 3) {
        evidence.unshift(dreamImage);
      }
      if (!title && !tradition && !resonance && !divergence && evidence.length === 0 && !catalog_id) continue;
      const echo: MythicEcho = {
        title: title || (dreamImage ? dreamImage.slice(0, 80) : ''),
        tradition,
        resonance,
        divergence,
        evidence: evidence.slice(0, 3),
      };
      if (confidence) echo.confidence = confidence;
      if (catalog_id) echo.catalog_id = catalog_id;
      if (source_type) echo.source_type = source_type;
      if (catalog_myth_version) echo.catalog_myth_version = catalog_myth_version;
      out.push(echo);
    }
    if (out.length >= max) break;
  }

  return out;
}

/**
 * Dream Detail shows high and medium confidence, plus legacy rows without confidence.
 * Low-confidence echoes are dropped during normalize and never displayed.
 */
export function isDisplayableMythicEcho(_item: MythicEcho): boolean {
  return true;
}

/** Title + muted tradition + one compact paragraph for Dream Detail. */
export function formatMythicEchoForDisplay(item: MythicEcho): EchoDisplayCard {
  const title = item.title.trim() || 'Mythic echo';
  const tradition = item.tradition.trim();
  const resonance = item.resonance.trim();
  const divergence = item.divergence.trim();
  // One paragraph only — length is controlled at generation time, not via UI truncation.
  const body = [resonance, divergence].filter(Boolean).join(' ').trim();
  return {
    title,
    ...(tradition ? { subtitle: tradition } : {}),
    body,
  };
}

/** Compact line for essay context / legacy string consumers. */
export function formatMythicEchoLine(item: MythicEcho): string {
  const name = item.title.trim();
  const tradition = item.tradition.trim();
  const resonance = item.resonance.trim();
  const divergence = item.divergence.trim();
  const headed = name
    ? tradition
      ? `${name} (${tradition})`
      : name
    : '';
  const detail = [resonance, divergence].filter(Boolean).join(' ');
  if (headed && detail) return `${headed} — ${detail}`;
  return detail || headed;
}

export function formatAmplificationsForEssay(items: MythicEcho[] | string[] | undefined | null): string {
  const normalized = normalizeAmplifications(items ?? []);
  if (normalized.length === 0) return '(none)';
  return normalized.map(formatMythicEchoLine).join('; ');
}
