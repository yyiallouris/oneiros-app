import { getMythicCatalogEntry } from '../../src/ai/catalogs/mythicNarrativeCatalog';
import type { NaturalisticMythFixture } from './naturalisticMythBenchmarkFixtures';

const PROMPT_LEAKAGE_PHRASES = [
  'distinctive configuration',
  'structural parallel',
  'linked narrative beats',
  'mythic resonance',
  'myth names',
  'catalog terminology',
];

const MANUAL_NAME_TERMS: Record<string, string[]> = {
  'arabian.fisherman_and_jinni': ['fisherman and the jinni', 'jinni', 'genie', 'aladdin'],
  'greek.orpheus_eurydice': ['orpheus', 'eurydice'],
  'greek.sisyphus': ['sisyphus'],
  'sumerian.inanna_descent': ['inanna'],
  'greek.psyche_eros': ['psyche', 'eros'],
  'greek.cretan_labyrinth': ['ariadne', 'minotaur', 'cretan labyrinth'],
  'kiche_maya.hero_twins_xibalba': ['xibalba', 'hero twins'],
  'french.bluebeard': ['bluebeard'],
  'greek.demeter_persephone': ['demeter', 'persephone'],
  'japanese.izanagi_izanami': ['izanagi', 'izanami', 'yomi'],
  'akan.anansi_pot_wisdom': ['anansi'],
  'greek.prometheus': ['prometheus'],
  'greek.perseus_medusa': ['perseus', 'medusa'],
};

function normalize(text: string): string {
  return text
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function manualTermsForId(catalogId: string | null): string[] {
  if (!catalogId) return [];
  return MANUAL_NAME_TERMS[catalogId] ?? [];
}

function exactTitleLeakTerms(catalogId: string | null): string[] {
  if (!catalogId) return [];
  const entry = getMythicCatalogEntry(catalogId);
  if (!entry) return [];
  const out = [entry.canonical_title, entry.tradition_display, catalogId];
  return out.map(normalize).filter(Boolean);
}

function termsForFixture(fixture: NaturalisticMythFixture): string[] {
  const expected = fixture.required_catalog_id;
  return [
    ...manualTermsForId(expected),
    ...exactTitleLeakTerms(expected),
    ...PROMPT_LEAKAGE_PHRASES,
  ]
    .map(normalize)
    .filter(Boolean);
}

export function detectNaturalisticMythDatasetLeakage(
  fixtures: NaturalisticMythFixture[]
): {
  total_hits: number;
  fixtures_with_hits: number;
  fixture_hits: Array<{ fixture_id: string; hits: string[] }>;
} {
  const fixture_hits = fixtures
    .map((fixture) => {
      const hay = normalize(fixture.dream_text);
      const hits = termsForFixture(fixture).filter((term) => hay.includes(term));
      return {
        fixture_id: fixture.fixture_id,
        hits: [...new Set(hits)],
      };
    })
    .filter((row) => row.hits.length > 0);

  return {
    total_hits: fixture_hits.reduce((sum, row) => sum + row.hits.length, 0),
    fixtures_with_hits: fixture_hits.length,
    fixture_hits,
  };
}
