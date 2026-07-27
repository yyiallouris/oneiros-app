/**
 * Deterministic dream evidence spans for Mythic/Archetypal evidence_ids (v4.1.2 Patch A+).
 * Same algorithm must run in the user prompt builder and validators.
 */

export type DreamEvidenceSpan = {
  id: string; // D1, D2, ...
  text: string;
};

export type DreamEvidenceSpanIndex = {
  spans: DreamEvidenceSpan[];
  byId: Record<string, string>;
  /** Prompt-facing dream body with [Dn] prefixes. */
  formattedDream: string;
};

const MAX_SPANS = 48;
const LONG_PARAGRAPH_CHARS = 420;

function splitSentences(paragraph: string): string[] {
  const parts = paragraph
    .split(/(?<=[.!?…;·])\s+/)
    .map((p) => p.trim())
    .filter(Boolean);
  return parts.length > 0 ? parts : [paragraph.trim()].filter(Boolean);
}

function splitParagraphs(dreamText: string): string[] {
  return dreamText
    .replace(/\r\n/g, '\n')
    .split(/\n\s*\n+/)
    .map((p) => p.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
}

/**
 * Build stable [D1]…[Dn] spans from raw dream text.
 */
export function buildDreamEvidenceSpanIndex(dreamText: string): DreamEvidenceSpanIndex {
  const raw = typeof dreamText === 'string' ? dreamText.trim() : '';
  const chunks: string[] = [];
  if (!raw) {
    return { spans: [], byId: {}, formattedDream: '' };
  }

  for (const paragraph of splitParagraphs(raw)) {
    if (paragraph.length <= LONG_PARAGRAPH_CHARS) {
      chunks.push(paragraph);
      continue;
    }
    for (const sentence of splitSentences(paragraph)) {
      if (sentence.length <= LONG_PARAGRAPH_CHARS) {
        chunks.push(sentence);
        continue;
      }
      // Hard wrap very long sentences without inventing content.
      for (let i = 0; i < sentence.length; i += LONG_PARAGRAPH_CHARS) {
        const slice = sentence.slice(i, i + LONG_PARAGRAPH_CHARS).trim();
        if (slice) chunks.push(slice);
      }
    }
  }

  const limited = chunks.slice(0, MAX_SPANS);
  const spans: DreamEvidenceSpan[] = limited.map((text, i) => ({
    id: `D${i + 1}`,
    text,
  }));
  const byId: Record<string, string> = {};
  for (const span of spans) byId[span.id] = span.text;

  const formattedDream = spans.map((s) => `[${s.id}] ${s.text}`).join('\n');
  return { spans, byId, formattedDream };
}

const EVIDENCE_ID_RE = /^D([1-9]\d*)$/;

export function isDreamEvidenceId(value: string): boolean {
  return EVIDENCE_ID_RE.test(value.trim());
}

/** Transport normalize: dedupe valid [Dn] ids and clamp (never invent). */
export function normalizeDreamEvidenceIdList(raw: unknown, max = 6): string[] {
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  for (const item of raw) {
    if (typeof item !== 'string') continue;
    const id = item.trim();
    if (!id || !isDreamEvidenceId(id)) continue;
    if (!out.includes(id)) out.push(id);
    if (out.length >= max) break;
  }
  return out;
}

export type ResolveEvidenceIdsResult =
  | { ok: true; evidence: string[]; evidence_ids: string[] }
  | { ok: false; reason: string; evidence_ids: string[] };

/**
 * Resolve model evidence_ids against the same span index derived from dreamText.
 */
export type ResolveDreamEvidenceIdsOptions = {
  /** Minimum valid ids (default 2 for mythic; archetype carrier/mechanism may use 1). */
  minCount?: number;
  maxCount?: number;
};

/** Display-only: spread first / middle / last ids for sequence coverage (max 3). */
export function selectDisplayEvidence(ids: string[], max = 3): string[] {
  const unique = [...new Set(ids.filter(Boolean))];
  if (unique.length <= max) return unique;
  if (max <= 1) return unique.slice(0, max);
  const middle = unique[Math.floor((unique.length - 1) / 2)];
  return [...new Set([unique[0], middle, unique[unique.length - 1]])].slice(0, max);
}

export function resolveDreamEvidenceIds(
  evidenceIds: unknown,
  dreamText: string,
  options: ResolveDreamEvidenceIdsOptions = {}
): ResolveEvidenceIdsResult {
  const minCount = options.minCount ?? 2;
  const maxCount = options.maxCount ?? 6;
  const index = buildDreamEvidenceSpanIndex(dreamText);
  if (!Array.isArray(evidenceIds)) {
    return { ok: false, reason: 'evidence_ids_not_array', evidence_ids: [] };
  }
  const ids: string[] = [];
  for (const item of evidenceIds) {
    if (typeof item !== 'string') continue;
    const id = item.trim();
    if (!id) continue;
    if (!isDreamEvidenceId(id)) {
      return { ok: false, reason: `invalid_evidence_id:${id}`, evidence_ids: ids };
    }
    if (!ids.includes(id)) ids.push(id);
  }
  if (ids.length < minCount) {
    return {
      ok: false,
      reason: minCount === 2 ? 'evidence_ids_count_below_2' : 'evidence_ids_count_below_min',
      evidence_ids: ids,
    };
  }
  if (ids.length > maxCount) {
    return { ok: false, reason: 'evidence_ids_count_above_6', evidence_ids: ids };
  }
  const evidence: string[] = [];
  for (const id of ids) {
    const text = index.byId[id];
    if (!text) {
      return { ok: false, reason: `unknown_evidence_id:${id}`, evidence_ids: ids };
    }
    evidence.push(text);
  }
  return { ok: true, evidence, evidence_ids: ids };
}
