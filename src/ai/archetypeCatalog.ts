/**
 * Compatibility facade — full catalog lives in catalogs/archetypeCatalog.v1.ts
 */
export {
  ARCHETYPE_CATALOG_V1 as ARCHETYPE_CATALOG,
  type ArchetypeCarrierType,
  type ArchetypeDefinition,
  type ArchetypeLineage,
  type ArchetypeTier,
  formatArchetypeHardGatesForPromptV1 as formatArchetypeHardGatesForPrompt,
  getArchetypeDefinitionV1 as getArchetypeDefinition,
} from './catalogs/archetypeCatalog.v1.ts';
