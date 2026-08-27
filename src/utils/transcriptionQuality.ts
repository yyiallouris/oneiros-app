export type TranscriptQualityIssue =
  | 'empty'
  | 'known_caption_hallucination'
  | 'implausibly_short'
  | 'repetition_loop';

export type TranscriptQualityAssessment =
  | { accepted: true }
  | { accepted: false; issue: TranscriptQualityIssue };

const CAPTION_HALLUCINATION_PATTERNS = [
  /\bauthorwave\b/u,
  /\bamara\s+org\b/u,
  /\bsubtitles?\s+(?:by|from|provided|created)\b/u,
  /\bcaptions?\s+(?:by|from|provided|created)\b/u,
  /υποτιτλοι\s+(?:authorwave|απο|της|παρεχονται|δημιουργηθηκαν)/u,
  /字幕.{0,12}(?:amara|提供|制作)/u,
  /\b(?:thank\s+you|thanks)\s+for\s+watching\b/u,
  /\bplease\s+(?:like\s+and\s+)?subscribe\b/u,
  /ευχαριστω\s+που\s+παρακολουθησατε/u,
  /\bgracias\s+por\s+ver\b/u,
  /\bmerci\s+d\s+avoir\s+regarde\b/u,
];

function normalizeForQuality(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('en-US')
    .replace(/https?:\/\//g, ' ')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

function words(value: string): string[] {
  const normalized = normalizeForQuality(value);
  return normalized ? normalized.split(/\s+/u) : [];
}

function isKnownCaptionHallucination(text: string, tokens: string[]): boolean {
  const normalized = normalizeForQuality(text);
  const hasKnownPattern = CAPTION_HALLUCINATION_PATTERNS.some((pattern) => pattern.test(normalized));
  if (!hasKnownPattern) return false;

  // Subtitle credits can be spoken legitimately. Reject only when the result is mostly the
  // short boilerplate signature or when that signature is repeating.
  return tokens.length <= 12 || new Set(tokens).size / Math.max(tokens.length, 1) < 0.35;
}

function isImplausiblyShort(tokens: string[], durationMs?: number | null): boolean {
  if (!durationMs || durationMs <= 0) return false;
  if (durationMs >= 4 * 60_000) return tokens.length <= 15;
  if (durationMs >= 2 * 60_000) return tokens.length <= 8;
  if (durationMs >= 45_000) return tokens.length <= 3;
  return false;
}

function isRepetitionLoop(tokens: string[]): boolean {
  if (tokens.length < 10) return false;

  const counts = new Map<string, number>();
  for (const token of tokens) counts.set(token, (counts.get(token) ?? 0) + 1);
  const dominantTokenCount = Math.max(...counts.values());
  if (dominantTokenCount / tokens.length >= 0.6) return true;

  for (let width = 2; width <= Math.min(6, Math.floor(tokens.length / 3)); width += 1) {
    const phraseCounts = new Map<string, number>();
    for (let index = 0; index <= tokens.length - width; index += 1) {
      const phrase = tokens.slice(index, index + width).join(' ');
      phraseCounts.set(phrase, (phraseCounts.get(phrase) ?? 0) + 1);
    }
    const maxRepeats = Math.max(...phraseCounts.values());
    if (maxRepeats >= 4 && maxRepeats * width / tokens.length >= 0.65) return true;
  }

  if (tokens.length < 18) return false;
  return counts.size / tokens.length < 0.22;
}

/**
 * Conservative commit gate for model output. It never tries to rewrite a transcript: it only
 * prevents known hallucination signatures or obviously implausible output from reaching a dream.
 */
export function assessTranscriptQuality(input: {
  text: unknown;
  durationMs?: number | null;
}): TranscriptQualityAssessment {
  if (typeof input.text !== 'string' || !input.text.trim()) {
    return { accepted: false, issue: 'empty' };
  }

  const tokens = words(input.text);
  if (isKnownCaptionHallucination(input.text, tokens)) {
    return { accepted: false, issue: 'known_caption_hallucination' };
  }
  if (isImplausiblyShort(tokens, input.durationMs)) {
    return { accepted: false, issue: 'implausibly_short' };
  }
  if (isRepetitionLoop(tokens)) {
    return { accepted: false, issue: 'repetition_loop' };
  }
  return { accepted: true };
}
