import { readFileSync } from 'fs';
import path from 'path';
import { MYTHIC_CATALOG_VERSION, MYTHIC_CATALOG_BY_ID } from '../../src/ai/catalogs/mythicNarrativeCatalog';
import {
  MYTHIC_PROMPT_INDEX,
  MYTHIC_PROMPT_INDEX_VERSION,
} from '../../src/ai/catalogs/mythicPromptIndex';
import { MYTH_CATALOG_IDS } from '../../src/ai/catalogs/generated/catalogIdEnums.v1';
import { buildDreamExtractionResponseFormat } from '../../src/ai/dreamExtractionResponseFormat';
import { buildDreamExtractionSystemPrompt } from '../../src/ai/dreamExtractionPrompt';

describe('myth catalog runtime consistency', () => {
  it('keeps canonical JSON, prompt injection, provider schema, and generated enum ids aligned', () => {
    const jsonPath = path.join(process.cwd(), 'src/ai/catalogs/mythic_narrative_catalog.v1.json');
    const raw = JSON.parse(readFileSync(jsonPath, 'utf8')) as {
      version: string;
      entries: Array<{ id: string }>;
    };

    const jsonIds = raw.entries.map((entry) => entry.id).sort();
    const generatedIds = Object.keys(MYTHIC_CATALOG_BY_ID).sort();
    const enumIds = [...MYTH_CATALOG_IDS].sort();
    const responseFormat = buildDreamExtractionResponseFormat();
    const schema = responseFormat.json_schema.schema as {
      properties: {
        amplifications: {
          items: {
            properties: {
              catalog_id: {
                enum: string[];
              };
            };
          };
        };
      };
    };
    const schemaIds = [...schema.properties.amplifications.items.properties.catalog_id.enum].sort();
    const systemPrompt = buildDreamExtractionSystemPrompt();

    expect(raw.version).toBe(MYTHIC_CATALOG_VERSION);
    expect(raw.entries).toHaveLength(130);
    expect(generatedIds).toEqual(jsonIds);
    expect(enumIds).toEqual(jsonIds);
    expect(schemaIds).toEqual(jsonIds);
    expect(MYTHIC_PROMPT_INDEX_VERSION).toBe(3);
    expect(jsonIds).toContain('hebrew_bible.tower_babel');
    expect(jsonIds).toContain('greek.cronus_devouring_children');
    expect(MYTHIC_PROMPT_INDEX).toContain(`id=${jsonIds[0]} `);
    expect(systemPrompt).toContain(`<CLOSED_MYTH_CATALOG version="${MYTHIC_CATALOG_VERSION}">`);
  });

  it('keeps full-detail compact lines only for the expanded allowlist records', () => {
    const fullDetailIds = [
      'greek.orpheus_eurydice',
      'greek.psyche_eros',
      'greek.demeter_persephone',
      'japanese.amaterasu_cave',
      'greek.narcissus_echo',
      'quranic.night_journey',
      'german.sleeping_beauty',
      'german.six_swans',
      'japanese.izanagi_izanami',
      'hebrew_bible.joseph',
      'hebrew_bible.tower_babel',
      'greek.cronus_devouring_children',
    ];

    for (const id of fullDetailIds) {
      const line = MYTHIC_PROMPT_INDEX.split('\n').find((row) => row.startsWith(`id=${id} `));
      expect(line).toBeDefined();
      expect(line).toContain(' sig:');
      expect(line).toContain(' roles:');
      expect(line).toContain(' req:');
      expect(line).toContain(' anti:');
    }

    const nonFullDetailLine = MYTHIC_PROMPT_INDEX.split('\n').find((row) =>
      row.startsWith('id=hebrew_bible.exodus ')
    );
    expect(nonFullDetailLine).toBeDefined();
    expect(nonFullDetailLine).toContain(' sig:');
    expect(nonFullDetailLine).toContain(' req:');
    expect(nonFullDetailLine).not.toContain(' roles:');
    expect(nonFullDetailLine).not.toContain(' anti:');
  });
});
