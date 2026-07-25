/**
 * Mythic Echoes (persisted as interpretation.amplifications).
 * Named world-mythology parallels — provisional, not Dream Fabric extraction.
 */

import type { EchoDisplayCard } from './archetypalEchoes.ts';

export type MythicEcho = {
  /** Established name of the myth, narrative, or figure. */
  title: string;
  /** Cultural or historical tradition (e.g. Greek, Mesopotamian). */
  tradition: string;
  /** Structural kinship with the dream. */
  resonance: string;
  /** Important way the dream diverges from the traditional story. */
  difference: string;
  evidence: string[];
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
        difference: '',
        evidence: [],
      });
    } else if (item && typeof item === 'object') {
      const o = item as Record<string, unknown>;
      const title = readTitle(o);
      const tradition = typeof o.tradition === 'string' ? o.tradition.trim() : '';
      const resonance = typeof o.resonance === 'string' ? o.resonance.trim() : '';
      const difference = typeof o.difference === 'string' ? o.difference.trim() : '';
      const dreamImage = typeof o.dream_image === 'string' ? o.dream_image.trim() : '';
      const evidence = asEvidence(o.evidence);
      if (dreamImage && !evidence.includes(dreamImage) && evidence.length < 3) {
        evidence.unshift(dreamImage);
      }
      if (!title && !tradition && !resonance && !difference && evidence.length === 0) continue;
      out.push({
        title: title || (dreamImage ? dreamImage.slice(0, 80) : ''),
        tradition,
        resonance,
        difference,
        evidence: evidence.slice(0, 3),
      });
    }
    if (out.length >= max) break;
  }

  return out;
}

/** Title + body for Dream Detail Interpretive Echoes. */
export function formatMythicEchoForDisplay(item: MythicEcho): EchoDisplayCard {
  const name = item.title.trim() || 'Mythic echo';
  const tradition = item.tradition.trim();
  const title = tradition ? `${name} — ${tradition}` : name;
  const resonance = item.resonance.trim();
  const difference = item.difference.trim();
  const bodyParts: string[] = [];
  if (resonance) bodyParts.push(resonance);
  if (difference) bodyParts.push(difference);
  return { title, body: bodyParts.join(' ').trim() };
}

/** Compact line for essay context / legacy string consumers. */
export function formatMythicEchoLine(item: MythicEcho): string {
  const name = item.title.trim();
  const tradition = item.tradition.trim();
  const resonance = item.resonance.trim();
  const difference = item.difference.trim();
  const headed = name
    ? tradition
      ? `${name} (${tradition})`
      : name
    : '';
  const detail = [resonance, difference].filter(Boolean).join(' ');
  if (headed && detail) return `${headed} — ${detail}`;
  return detail || headed;
}

export function formatAmplificationsForEssay(items: MythicEcho[] | string[] | undefined | null): string {
  const normalized = normalizeAmplifications(items ?? []);
  if (normalized.length === 0) return '(none)';
  return normalized.map(formatMythicEchoLine).join('; ');
}
