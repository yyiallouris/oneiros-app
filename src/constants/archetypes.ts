/**
 * Curated archetypal taxonomy for Archetypal Echoes.
 * Canonical labels stay classical; dream-specific form lives in `expression`.
 * Must stay aligned with extraction in `src/ai/dreamExtractionPrompt.ts`.
 */

export const INNER_STRUCTURE_ARCHETYPES = [
  'Self',
  'Ego',
  'Shadow',
  'Persona',
  'Anima',
  'Animus',
] as const;

export const ARCHETYPAL_ENERGY_ARCHETYPES = [
  'Divine Child',
  'Great Mother',
  'Terrible Mother',
  'Wise Old Man',
  'Wise Old Woman',
  'Hero',
  'Trickster',
  'Guide / Psychopomp',
  'Double',
  'Orphan',
  'Lover',
  'Ruler',
  'Death–Rebirth',
  'Sacred Marriage',
] as const;

export const ARCHETYPE_WHITELIST = [
  ...INNER_STRUCTURE_ARCHETYPES,
  ...ARCHETYPAL_ENERGY_ARCHETYPES,
] as const;

export type ArchetypeName = (typeof ARCHETYPE_WHITELIST)[number];

const INNER_STRUCTURE_SET = new Set(
  INNER_STRUCTURE_ARCHETYPES.map((name) => name.toLowerCase())
);

const NORMALIZATION_ALIASES: Record<string, ArchetypeName> = {
  child: 'Divine Child',
  'child (divine child)': 'Divine Child',
  'divine child': 'Divine Child',
  guide: 'Guide / Psychopomp',
  psychopomp: 'Guide / Psychopomp',
  psychopompos: 'Guide / Psychopomp',
  'psychopomp guide': 'Guide / Psychopomp',
  'guide figure': 'Guide / Psychopomp',
  'guide / psychopomp': 'Guide / Psychopomp',
  death: 'Death–Rebirth',
  rebirth: 'Death–Rebirth',
  'death archetype': 'Death–Rebirth',
  'rebirth archetype': 'Death–Rebirth',
  'death-rebirth': 'Death–Rebirth',
  'death – rebirth': 'Death–Rebirth',
  'death—rebirth': 'Death–Rebirth',
  destroyer: 'Death–Rebirth',
  king: 'Ruler',
  queen: 'Ruler',
  warrior: 'Hero',
  father: 'Wise Old Man',
  'wise elder': 'Wise Old Man',
  'wise old': 'Wise Old Man',
  senex: 'Wise Old Man',
  'wise old person': 'Wise Old Man',
  'terrible mother': 'Terrible Mother',
  'shadow double': 'Double',
  doppelganger: 'Double',
  doppelgänger: 'Double',
  'sacred marriage': 'Sacred Marriage',
  'hieros gamos': 'Sacred Marriage',
  orphan: 'Orphan',
  maiden: 'Orphan',
  kore: 'Orphan',
};

/** Strip optional leading "The " before matching. */
function stripThe(name: string): string {
  return name.replace(/^\s*The\s+/i, '').trim();
}

function normalizeDeathRebirthToken(value: string): string {
  return value.replace(/\s*[–—\-]\s*/g, '–').trim();
}

export function isWhitelistedArchetype(name: string): name is ArchetypeName {
  const normalized = stripThe(name).toLowerCase();
  return ARCHETYPE_WHITELIST.some((a) => a.toLowerCase() === normalized);
}

export function isInnerStructureArchetype(name: string): boolean {
  return INNER_STRUCTURE_SET.has(stripThe(name).toLowerCase());
}

function exactOrAliasArchetype(name: string): ArchetypeName | null {
  const trimmed = stripThe(name.trim());
  if (!trimmed) return null;
  const lower = normalizeDeathRebirthToken(trimmed).toLowerCase();
  const aliased = NORMALIZATION_ALIASES[lower];
  if (aliased) return aliased;
  return ARCHETYPE_WHITELIST.find((a) => a.toLowerCase() === lower) ?? null;
}

export function normalizeArchetype(name: string): ArchetypeName | null {
  const trimmed = stripThe(name.trim());
  if (!trimmed) return null;

  const exact = exactOrAliasArchetype(trimmed);
  if (exact) return exact;

  const lower = normalizeDeathRebirthToken(trimmed).toLowerCase();
  const matches = ARCHETYPE_WHITELIST.filter((a) => {
    const candidate = a.toLowerCase();
    return candidate.includes(lower) || lower.includes(candidate);
  }).sort((a, b) => b.length - a.length);

  return matches[0] ?? null;
}

/**
 * Expand a string that may contain multiple archetype names.
 * Exact/alias whole-string matches first so "Guide / Psychopomp"
 * and "Death–Rebirth" stay single labels. Slash lists still expand
 * (e.g. "Wise Old Man / Wise Old Woman").
 */
export function normalizeArchetypeList(value: string): ArchetypeName[] {
  const trimmed = value.trim();
  if (!trimmed) return [];

  const exactWhole = exactOrAliasArchetype(trimmed);
  if (exactWhole) return [exactWhole];

  if (!trimmed.includes('/')) {
    const fuzzy = normalizeArchetype(trimmed);
    return fuzzy ? [fuzzy] : [];
  }

  const parts = trimmed.split(/\s*\/\s*/).map((p) => normalizeArchetype(p.trim()));
  const out: ArchetypeName[] = [];
  const seen = new Set<string>();
  for (const part of parts) {
    if (!part || seen.has(part)) continue;
    seen.add(part);
    out.push(part);
  }
  return out;
}

/** User-facing title: classical label with leading "The " when absent. */
export function formatCanonicalArchetypeTitle(label: string): string {
  const trimmed = label.trim();
  if (!trimmed) return '';
  if (/^the\s+/i.test(trimmed)) return trimmed;
  return `The ${trimmed}`;
}
