/**
 * Archetypes whitelist - Dream Weaver post-Jungian split.
 * One master whitelist, with explicit inner structures vs archetypal energies.
 * Must stay aligned with extraction in `ai.ts`.
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
  'Great Mother',
  'Father',
  'Child',
  'Hero',
  'Trickster',
  'Wise Old Man',
  'Wise Old Woman',
  'Maiden',
  'Kore',
  'Lover',
  'Warrior',
  'King',
  'Queen',
  'Magician',
  'Healer',
  'Wounded Healer',
  'Destroyer',
  'Death',
  'Rebirth',
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
  'child (divine child)': 'Child',
  'death archetype': 'Death',
  'rebirth archetype': 'Rebirth',
};

/** Strip optional leading "The " before matching. */
function stripThe(name: string): string {
  return name.replace(/^\s*The\s+/i, '').trim();
}

export function isWhitelistedArchetype(name: string): name is ArchetypeName {
  const normalized = stripThe(name).toLowerCase();
  return ARCHETYPE_WHITELIST.some((a) => a.toLowerCase() === normalized);
}

export function isInnerStructureArchetype(name: string): boolean {
  return INNER_STRUCTURE_SET.has(stripThe(name).toLowerCase());
}

export function normalizeArchetype(name: string): ArchetypeName | null {
  const trimmed = stripThe(name.trim());
  const lower = trimmed.toLowerCase();

  const aliased = NORMALIZATION_ALIASES[lower];
  if (aliased) return aliased;

  const exact = ARCHETYPE_WHITELIST.find((a) => a.toLowerCase() === lower);
  if (exact) return exact;

  const matches = ARCHETYPE_WHITELIST.filter((a) => {
    const candidate = a.toLowerCase();
    return candidate.includes(lower) || lower.includes(candidate);
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
