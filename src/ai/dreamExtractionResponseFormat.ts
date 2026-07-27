import {
  MYTH_CATALOG_IDS,
  SELECTABLE_ARCHETYPE_IDS,
} from './catalogs/generated/catalogIdEnums.v1.ts';
import {
  buildDreamExtractionResponseFormatFromIds,
  type DreamExtractionResponseFormat,
} from './dreamExtractionJsonSchema.ts';

export type { DreamExtractionResponseFormat };

export function buildDreamExtractionResponseFormat(): DreamExtractionResponseFormat {
  return buildDreamExtractionResponseFormatFromIds(SELECTABLE_ARCHETYPE_IDS, MYTH_CATALOG_IDS);
}
