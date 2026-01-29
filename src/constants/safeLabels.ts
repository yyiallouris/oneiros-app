/**
 * Safe mode for Insights: map explicit terms to category labels.
 * Respect & privacy UX — no raw explicit symbols by default.
 */

/** Terms (lowercase) that should show as safe category when safe mode is ON */
const EXPLICIT_TERMS: Set<string> = new Set([
  'anus', 'penis', 'vagina', 'sex', 'nude', 'naked', 'orgasm', 'erection',
  'genitals', 'breasts', 'intercourse', 'oral', 'arousal', 'masturbat',
  'defecat', 'urinat', 'excrement', 'fecal', 'toilet',
]);

/** Safe category labels (no therapy tone) */
export const SAFE_CATEGORIES = {
  intimacy: 'Intimacy themes',
  body: 'Body themes',
  explicit: 'Explicit content',
} as const;

function normalizeForMatch(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Returns true if the symbol (normalized key or name) is considered explicit.
 */
export function isExplicitSymbol(symbolKey: string): boolean {
  const key = normalizeForMatch(symbolKey);
  if (EXPLICIT_TERMS.has(key)) return true;
  for (const term of EXPLICIT_TERMS) {
    if (key.includes(term)) return true;
  }
  return false;
}

/**
 * Display label for a symbol: safe category when showExplicit is false and symbol is explicit.
 */
export function toSafeSymbolLabel(
  symbolName: string,
  symbolKey: string,
  showExplicit: boolean
): string {
  if (showExplicit) return symbolName;
  if (!isExplicitSymbol(symbolKey)) return symbolName;
  const key = normalizeForMatch(symbolKey);
  if (key.includes('sex') || key.includes('intimacy') || key.includes('oral') || key.includes('arousal') || key.includes('orgasm') || key.includes('genitals') || key.includes('breasts') || key.includes('penis') || key.includes('vagina') || key.includes('intercourse') || key.includes('masturbat') || key.includes('nude') || key.includes('naked')) {
    return SAFE_CATEGORIES.intimacy;
  }
  if (key.includes('anus') || key.includes('defecat') || key.includes('urinat') || key.includes('excrement') || key.includes('fecal') || key.includes('toilet')) {
    return SAFE_CATEGORIES.body;
  }
  return SAFE_CATEGORIES.explicit;
}
