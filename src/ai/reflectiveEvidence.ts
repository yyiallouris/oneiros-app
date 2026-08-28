export type DreamEvidenceSpan = { id: `D${number}`; text: string };
export type UserEvidenceSpan = { id: `U${number}`; text: string };
type ConversationEvidenceMessage = { role: 'user' | 'assistant'; content: string };

export function cleanReflectiveEvidenceText(value: unknown): string {
  return typeof value === 'string' ? value.replace(/\s+/gu, ' ').trim() : '';
}

function splitLongParagraph(paragraph: string, maxChars: number): string[] {
  if (paragraph.length <= maxChars) return [paragraph];
  const sentences = paragraph
    .split(/(?<=[.!?;。！？])\s+/u)
    .map((value) => value.trim())
    .filter(Boolean);
  if (sentences.length <= 1) {
    return Array.from({ length: Math.ceil(paragraph.length / maxChars) }, (_, index) =>
      paragraph.slice(index * maxChars, (index + 1) * maxChars).trim()
    ).filter(Boolean);
  }
  const chunks: string[] = [];
  let current = '';
  for (const sentence of sentences) {
    if (!current) current = sentence;
    else if (`${current} ${sentence}`.length <= maxChars) current = `${current} ${sentence}`;
    else {
      chunks.push(current);
      current = sentence;
    }
  }
  if (current) chunks.push(current);
  return chunks.flatMap((chunk) =>
    chunk.length <= maxChars ? [chunk] : splitLongParagraph(chunk, maxChars)
  );
}

export function buildDreamEvidenceSpans(
  content: string,
  options: { maxSpanChars?: number; maxSpans?: number } = {}
): DreamEvidenceSpan[] {
  const maxSpanChars = Math.max(180, options.maxSpanChars ?? 700);
  const maxSpans = Math.max(1, options.maxSpans ?? 24);
  const paragraphs = content
    .split(/\n\s*\n|\r?\n/u)
    .map(cleanReflectiveEvidenceText)
    .filter(Boolean)
    .flatMap((paragraph) => splitLongParagraph(paragraph, maxSpanChars));
  const headCount = Math.ceil(maxSpans * 0.55);
  const selected = paragraphs.length <= maxSpans
    ? paragraphs
    : [
        ...paragraphs.slice(0, headCount),
        ...paragraphs.slice(-(maxSpans - headCount)),
      ];
  return selected.map((text, index) => ({
    id: `D${index + 1}` as `D${number}`,
    text,
  }));
}

/** Initial editorial-arc calls must receive the complete dream, never a head/tail sample. */
export function buildCompleteDreamEvidenceSpans(content: string): DreamEvidenceSpan[] {
  const normalized = cleanReflectiveEvidenceText(content);
  if (!normalized) return [];
  const estimatedMaximum = Math.max(24, Math.ceil(normalized.length / 180) + 8);
  return buildDreamEvidenceSpans(content, { maxSpans: estimatedMaximum });
}

export function formatDreamEvidenceSpans(spans: DreamEvidenceSpan[]): string {
  return spans.map((span) => `[${span.id}] ${span.text}`).join('\n');
}

export function buildUserEvidenceSpans(
  conversation: ConversationEvidenceMessage[],
  latestUserMessage?: string,
  options: { maxSpanChars?: number; maxSpans?: number } = {}
): UserEvidenceSpan[] {
  const maxSpanChars = Math.max(160, options.maxSpanChars ?? 1200);
  const maxSpans = Math.max(1, options.maxSpans ?? 8);
  const turns = conversation
    .filter((message) => message.role === 'user')
    .map((message) => cleanReflectiveEvidenceText(message.content));
  const latest = cleanReflectiveEvidenceText(latestUserMessage);
  if (latest && turns[turns.length - 1] !== latest) turns.push(latest);
  return turns.filter(Boolean).slice(-maxSpans).map((text, index) => ({
    id: `U${index + 1}` as `U${number}`,
    text: text.slice(0, maxSpanChars).trim(),
  }));
}

export function formatUserEvidenceSpans(spans: UserEvidenceSpan[]): string {
  return spans.map((span) => `[${span.id}] ${span.text}`).join('\n');
}
