import { MYTH_CATALOG_IDS, SELECTABLE_ARCHETYPE_IDS } from '../src/ai/catalogs/generated/catalogIdEnums.v1';
import { formatArchetypeCatalogForPromptV1 } from '../src/ai/catalogs/archetypeCatalog.v1';
import { MYTHIC_PROMPT_INDEX } from '../src/ai/catalogs/mythicPromptIndex';
import { buildDreamExtractionResponseFormat } from '../src/ai/dreamExtractionResponseFormat';
import { validateStructuredTaskContent } from '../src/ai/structuredTaskValidation';

describe('catalog namespace enforcement (C.1.1)', () => {
  it('prompt catalogs use id= syntax, not bracket-wrapped ids', () => {
    const archetypeBlock = formatArchetypeCatalogForPromptV1();
    expect(archetypeBlock).toMatch(/id=shadow label:Shadow/);
    expect(archetypeBlock).not.toMatch(/\[shadow\]/);
    expect(MYTHIC_PROMPT_INDEX).toMatch(/id=sumerian\.inanna_descent/);
    expect(MYTHIC_PROMPT_INDEX).not.toMatch(/\[sumerian\.inanna_descent\]/);
  });

  it('provider schema uses disjoint archetype and myth enums', () => {
    const format = buildDreamExtractionResponseFormat();
    const schema = format.json_schema.schema as {
      properties: {
        archetypes: { items: { properties: { archetype_id: { enum: string[] } } } };
        amplifications: { items: { properties: { catalog_id: { enum: string[] } } } };
      };
    };
    const archetypeEnum = new Set(schema.properties.archetypes.items.properties.archetype_id.enum);
    const mythEnum = new Set(schema.properties.amplifications.items.properties.catalog_id.enum);
    expect(archetypeEnum.size).toBe(SELECTABLE_ARCHETYPE_IDS.length);
    expect(mythEnum.size).toBe(MYTH_CATALOG_IDS.length);
    for (const id of SELECTABLE_ARCHETYPE_IDS) {
      expect(archetypeEnum.has(id)).toBe(true);
      expect(mythEnum.has(id)).toBe(false);
    }
    for (const id of MYTH_CATALOG_IDS.slice(0, 5)) {
      expect(mythEnum.has(id)).toBe(true);
      expect(archetypeEnum.has(id)).toBe(false);
    }
  });

  it('rejects myth catalog_id placed in archetype_id', () => {
    const result = validateStructuredTaskContent(
      'dream_extraction',
      JSON.stringify({
        symbols: ['stone'],
        archetypes: [
          {
            archetype_id: 'greek.sisyphus',
            expression: 'pushing the round stone uphill again',
            mechanism_tags: ['purposeful_quest_movement'],
            evidence_ids: ['D1'],
            resonance: 'Repeated ascent and rollback organize the scene as unfinished labor.',
            confidence: 'high',
          },
        ],
        amplifications: [],
        landscapes: [],
        affects: [],
        motifs: [],
        relational_dynamics: [],
        thresholds: [],
        central_conflicts: [],
        core_mode: null,
        symbol_stances: [],
      })
    );
    expect(result.ok).toBe(false);
  });

  it('strips bracket wrapper before archetype enum validation', () => {
    const result = validateStructuredTaskContent(
      'dream_extraction',
      JSON.stringify({
        symbols: ['gate'],
        archetypes: [
          {
            archetype_id: '[death_rebirth]',
            expression: 'falling through the floor then waking renewed',
            mechanism_tags: ['dissolution_or_symbolic_death', 'revival_or_return'],
            evidence_ids: ['D1', 'D2'],
            resonance: 'A collapse and return reshapes what can continue afterward.',
            confidence: 'medium',
          },
        ],
        amplifications: [],
        landscapes: [],
        affects: [],
        motifs: [],
        relational_dynamics: [],
        thresholds: [],
        central_conflicts: [],
        core_mode: null,
        symbol_stances: [],
      })
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      const data = result.data as { archetypes: Array<{ archetype_id: string }> };
      expect(data.archetypes[0]?.archetype_id).toBe('death_rebirth');
    }
  });
});
