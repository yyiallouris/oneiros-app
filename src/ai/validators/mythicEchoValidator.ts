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

/** Specific rejection reason for debug pipeline — empty string means accepted. */
export function mythicEchoRejectionReason(echo: MythicEcho | undefined | null): string {
  if (!echo) return 'null_or_undefined_echo';

  const title = echo.title?.trim() || '';
  const tradition = echo.tradition?.trim() || '';
  if (!title) return 'missing_title';
  if (!tradition) return 'missing_tradition';

  if (BANNED_TITLE_PATTERNS.some((pattern) => pattern.test(title))) {
    return 'banned_generic_title_pattern';
  }
  if (looksLikeBareFigureTitle(title)) {
    return 'bare_figure_title';
  }
  if (/folk tradition/i.test(tradition) && !/mythology|epic|bible|alchemy/i.test(tradition)) {
    return 'vague_folk_tradition_without_corpus';
  }

  if ((echo.evidence?.length ?? 0) < 2) {
    return 'evidence_count_below_2';
  }

  if (echo.confidence !== 'high' && echo.confidence !== 'medium') {
    return 'invalid_or_missing_confidence';
  }

  if (!echo.resonance?.trim() || echo.resonance.trim().length < 12) {
    return 'resonance_too_short';
  }
  if (!echo.divergence?.trim() || echo.divergence.trim().length < 8) {
    return 'divergence_too_short';
  }

  return '';
}

/**
 * Soft gate for a single Mythic Echo candidate.
 * Empty output is preferred over a false or generic echo.
 */
export function validateMythicEcho(echo: MythicEcho | undefined | null): MythicEcho[] {
  return mythicEchoRejectionReason(echo) ? [] : echo ? [echo] : [];
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
    const reason = mythicEchoRejectionReason(echo);
    if (reason) {
      rejected.push({ echo, reason });
      continue;
    }
    accepted.push(echo);
  }

  return { accepted, rejected };
}

/** Map validated echo to persisted MythicEcho (keep closed-catalog fields). */
export function toPersistedMythicEcho(echo: MythicEcho): MythicEcho {
  const out: MythicEcho = {
    title: echo.title,
    tradition: echo.tradition,
    resonance: echo.resonance,
    divergence: echo.divergence,
    evidence: [...(echo.evidence ?? [])],
  };
  if (echo.confidence) out.confidence = echo.confidence;
  if (echo.catalog_id) out.catalog_id = echo.catalog_id;
  if (echo.source_type) out.source_type = echo.source_type;
  if (echo.catalog_myth_version) out.catalog_myth_version = echo.catalog_myth_version;
  return out;
}
