/**
 * Formats assistant interpretation markdown for on-screen display.
 * Used by both live typing (PhasedTypingText) and final FormattedMessageText
 * so stream and settled reflection stay visually consistent.
 */
export function formatInterpretationMarkdown(text: string): string {
  if (!text) return '';

  let formatted = text;

  try {
    // Convert headers to plain text with spacing (keep content, remove ## markers)
    formatted = formatted.replace(/^#{1,6}\s+(.+)$/gm, (match, content) => {
      return content ? `\n${content}\n` : match;
    });

    // Convert bold (**text** or __text__) to plain text (keep the text)
    formatted = formatted.replace(/\*\*([^*]+)\*\*/g, '$1');
    formatted = formatted.replace(/__([^_]+)__/g, '$1');

    // Convert italic (*text* or _text_) to plain text
    formatted = formatted.replace(/\*([^*]+)\*/g, '$1');
    formatted = formatted.replace(/_([^_]+)_/g, '$1');

    // Remove inline code markers but keep the text
    formatted = formatted.replace(/`([^`]+)`/g, '$1');

    // Remove links but keep the text
    formatted = formatted.replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1');

    // Process line by line for list markers and indentation.
    // Consecutive list items must each keep a bullet — do not strip later items
    // just because the previous line was also a bullet (Reflective Questions).
    const lines = formatted.split('\n');

    formatted = lines
      .map((line) => {
        const originalLine = line;
        const trimmed = line.trim();

        if (!trimmed) {
          return originalLine;
        }

        // Evidence lines stay plain text (italicized later by FormattedMessageText)
        if (/Evidence\s*(?:phrase|phase)?\s*:?/i.test(trimmed)) {
          return trimmed.replace(/^[-*+]\s*/, '');
        }

        const startsWithBulletChar = /^\s*[-*+]\s+/.test(originalLine);
        if (startsWithBulletChar) {
          return `• ${trimmed.replace(/^[-*+]\s+/, '')}`;
        }

        if (/^\s*\d+\.\s+/.test(originalLine)) {
          return trimmed.replace(/^(\d+)\.\s+/, '$1. ');
        }

        return trimmed;
      })
      .join('\n');

    formatted = formatted.replace(/\n{3,}/g, '\n\n');
    formatted = formatted.replace(/(\d+\.\s+\*\*[^*]+\*\*)/g, '\n$1\n');

    return formatted.trim();
  } catch {
    return text;
  }
}
