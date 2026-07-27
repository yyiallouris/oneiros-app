/**
 * Closed Mythic Narrative Catalog v1 — runtime accessors over generated data.
 * Source of truth JSON: mythic_narrative_catalog.v1.json (build-time only).
 */
import {
  MYTHIC_CATALOG_BY_ID,
  MYTHIC_CATALOG_ENTRY_COUNT,
  MYTHIC_CATALOG_VERSION,
  type MythicNarrativeCatalogEntry,
} from './generated/mythicPromptIndex.v1.ts';

export type { MythicNarrativeCatalogEntry };
export { MYTHIC_CATALOG_BY_ID, MYTHIC_CATALOG_ENTRY_COUNT, MYTHIC_CATALOG_VERSION };

export const ALLOWED_MYTHIC_SOURCE_TYPES = [
  'myth',
  'mythic_cycle',
  'fairy_tale',
  'epic_episode',
  'religious_narrative',
  'alchemical_sequence',
] as const;

export type MythicSourceType = (typeof ALLOWED_MYTHIC_SOURCE_TYPES)[number];

export function getMythicCatalogEntry(catalogId: string): MythicNarrativeCatalogEntry | null {
  const id = catalogId.trim();
  if (!id) return null;
  return MYTHIC_CATALOG_BY_ID[id] ?? null;
}

export function resolveMythDisplay(catalogId: string): {
  title: string;
  tradition: string;
  sourceType: string;
} | null {
  const entry = getMythicCatalogEntry(catalogId);
  if (!entry) return null;
  return {
    title: entry.canonical_title,
    tradition: entry.tradition_display,
    sourceType: entry.source_type,
  };
}

export function listMythicCatalogIds(): string[] {
  return Object.keys(MYTHIC_CATALOG_BY_ID);
}
