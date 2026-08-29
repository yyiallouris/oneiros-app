/** Soft one-line budget for an untitled Journal lead, in characters. */
export const UNTITLED_JOURNAL_LEAD_MAX_CHARS = 44;

export type JournalSlipCopy = {
  heading: string;
  excerpt: string;
  hasExplicitTitle: boolean;
};

/**
 * Journal archive-slip copy. An explicit title stays a heading plus excerpt.
 * Untitled dreams keep the opening as a lead and the rest as its continuation,
 * split on a word boundary so the two pieces can rejoin without a mid-word cut.
 * When more text remains, the lead ends with `...` so it still reads as a title.
 */
export function buildJournalSlipCopy(
  title: string | undefined,
  content: string
): JournalSlipCopy {
  const preview = content.replace(/\s+/g, ' ').trim();
  const explicitTitle = title?.trim() ?? '';

  if (explicitTitle) {
    return {
      heading: explicitTitle,
      excerpt: preview,
      hasExplicitTitle: true,
    };
  }

  const { heading, excerpt } = splitUntitledLead(preview, UNTITLED_JOURNAL_LEAD_MAX_CHARS);
  return {
    heading: excerpt ? withTitleEllipsis(heading) : heading,
    excerpt,
    hasExplicitTitle: false,
  };
}

function withTitleEllipsis(heading: string): string {
  return /(?:\.\.\.|…)$/.test(heading) ? heading : `${heading}...`;
}

export function splitUntitledLead(
  preview: string,
  maxChars: number = UNTITLED_JOURNAL_LEAD_MAX_CHARS
): { heading: string; excerpt: string } {
  if (!preview) {
    return { heading: '', excerpt: '' };
  }
  if (preview.length <= maxChars) {
    return { heading: preview, excerpt: '' };
  }

  const breakAt = findLastWordBreak(preview, maxChars);
  const heading = preview.slice(0, breakAt).trimEnd();
  const excerpt = preview.slice(heading.length).trimStart();
  return { heading, excerpt };
}

function findLastWordBreak(text: string, maxChars: number): number {
  if (maxChars >= text.length) {
    return text.length;
  }

  if (/\s/.test(text.charAt(maxChars))) {
    return maxChars;
  }

  const window = text.slice(0, maxChars);
  const lastSpace = window.lastIndexOf(' ');
  if (lastSpace >= Math.floor(maxChars * 0.45)) {
    return lastSpace;
  }

  const firstSpace = text.indexOf(' ');
  return firstSpace === -1 ? text.length : firstSpace;
}
