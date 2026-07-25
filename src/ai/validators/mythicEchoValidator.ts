/**
 * Lightweight post-validator for Mythic Echo objects from dream_extraction.
 * Rejects obvious generic/invented titles — does not academically verify myths.
 */

import type { MythicEcho } from '../mythicEchoes.ts';

export type MythicValidationResult = {
  accepted: MythicEcho[];
  rejected: Array<{ echo: MythicEcho; reason: string }>;
};

const BANNED_TITLE_PATTERNS = [
  /\bmotif\b/i,
  /\bpattern\b/i,
  /\bjourney of\b/i,
  /\btransformation\b/i,
  /\btwo roads\b/i,
  /\bfolk tradition\b/i,
  /\bworld mythology\b/i,
  /folkloric pattern/i,
  /δύο δρόμοι/i,
  /mistaken identity/i,
];

/** Bare single-token figure names are not eligible titles (need a narrative/episode name). */
function looksLikeBareFigureTitle(title: string): boolean {
  const words = title.trim().split(/\s+/).filter(Boolean);
  return words.length <= 1;
}

/**
 * Soft gate for a single Mythic Echo candidate.
 * Empty output is preferred over a false or generic echo.
 */
export function validateMythicEcho(echo: MythicEcho | undefined | null): MythicEcho[] {
  if (!echo) return [];

  const title = echo.title?.trim() || '';
  const tradition = echo.tradition?.trim() || '';
  if (!title || !tradition) return [];

  if (BANNED_TITLE_PATTERNS.some((pattern) => pattern.test(title))) {
    return [];
  }
  if (looksLikeBareFigureTitle(title)) {
    return [];
  }
  if (/folk tradition/i.test(tradition) && !/mythology|epic|bible|alchemy/i.test(tradition)) {
    return [];
  }

  if ((echo.evidence?.length ?? 0) < 2) {
    return [];
  }

  if (echo.confidence !== 'high' && echo.confidence !== 'medium') {
    return [];
  }

  if (!echo.resonance?.trim() || echo.resonance.trim().length < 12) {
    return [];
  }
  if (!echo.divergence?.trim() || echo.divergence.trim().length < 8) {
    return [];
  }

  return [echo];
}

/**
 * Precision gates for Mythic Echoes from the single extraction call.
 */
export function validateMythicEchoes(
  echoes: MythicEcho[],
  options: {
    max?: number;
  } = {}
): MythicValidationResult {
  const max = options.max ?? 1;
  const accepted: MythicEcho[] = [];
  const rejected: MythicValidationResult['rejected'] = [];

  for (const echo of echoes) {
    if (accepted.length >= max) {
      rejected.push({ echo, reason: 'exceeds max mythic echoes' });
      continue;
    }
    const kept = validateMythicEcho(echo);
    if (kept.length === 0) {
      rejected.push({ echo, reason: 'generic, incomplete, or low-confidence mythic echo' });
      continue;
    }
    accepted.push(kept[0]);
  }

  return { accepted, rejected };
}

/** Map validated echo to plain MythicEcho (strip catalog_id if present). */
export function toPersistedMythicEcho(echo: MythicEcho & { catalog_id?: string }): MythicEcho {
  const { catalog_id: _id, ...rest } = echo as MythicEcho & { catalog_id?: string };
  return {
    title: rest.title,
    tradition: rest.tradition,
    resonance: rest.resonance,
    divergence: rest.divergence,
    evidence: rest.evidence,
    ...(rest.confidence ? { confidence: rest.confidence } : {}),
  };
}
