/**
 * Compatibility facade — full catalog lives in catalogs/archetypeCatalog.v1.ts
 */
export {
  ARCHETYPE_CATALOG_V1 as ARCHETYPE_CATALOG,
  type ArchetypeDefinition,
  type ArchetypeKind,
  formatArchetypeCatalogForPromptV1 as formatArchetypeCatalogForPrompt,
  formatArchetypeHardGatesForPromptV1 as formatArchetypeHardGatesForPrompt,
  getArchetypeDefinitionV1 as getArchetypeDefinition,
  getArchetypeDisplayLabel,
} from './catalogs/archetypeCatalog.v1.ts';
