/**
 * Fixed Jungian archetype whitelist for insights.
 * Slash-separated names (e.g. "Wise Old Man / Wise Old Woman") are separate archetypes.
 * Must match extraction in AI (ai.ts).
 */

export const ARCHETYPE_WHITELIST = [
  'Self',
  'Ego',
  'Shadow',
  'Persona',
  'Anima',
  'Animus',
  'Great Mother',
  'Father',
  'Child (Divine Child)',
  'Hero',
  'Trickster',
  'Wise Old Man',
  'Wise Old Woman',
  'Maiden',
  'Kore',
  'Destroyer',
  'Death Archetype',
  'Rebirth Archetype',
  'Healer',
  'Wounded Healer',
  'Savior',
  'Redeemer',
  'Lover',
  'Ruler',
  'King',
  'Queen',
  'Warrior',
  'Caregiver',
  'Innocent',
  'Explorer',
  'Creator',
  'Rebel',
  'Magician',
  'Sage',
  'Jester',
] as const;

export type ArchetypeName = (typeof ARCHETYPE_WHITELIST)[number];

export function isWhitelistedArchetype(name: string): name is ArchetypeName {
  const normalized = name.replace(/^\s*The\s+/i, '').trim();
  return ARCHETYPE_WHITELIST.some(
    (a) => a.toLowerCase() === normalized.toLowerCase()
  );
}

/** Strip optional leading "The " before matching. */
function stripThe(name: string): string {
  return name.replace(/^\s*The\s+/i, '').trim();
}

export function normalizeArchetype(name: string): ArchetypeName | null {
  const trimmed = stripThe(name.trim());
  const lower = trimmed.toLowerCase();

  // 1) Exact match
  const exact = ARCHETYPE_WHITELIST.find((a) => a.toLowerCase() === lower);
  if (exact) return exact;

  // 2) Longest-match containment (prevents "Healer" stealing "Wounded Healer")
  const matches = ARCHETYPE_WHITELIST.filter((a) => {
    const al = a.toLowerCase();
    return al.includes(lower) || lower.includes(al);
  }).sort((a, b) => b.length - a.length);

  return matches[0] ?? null;
}

/**
 * Expand a string that may contain " / " into multiple normalized archetype names.
 * E.g. "Wise Old Man / Wise Old Woman" -> ["Wise Old Man", "Wise Old Woman"].
 */
export function normalizeArchetypeList(value: string): ArchetypeName[] {
  const parts = value.split(/\s*\/\s*/).map((p) => normalizeArchetype(p.trim()));
  return parts.filter((a): a is ArchetypeName => a != null);
}
