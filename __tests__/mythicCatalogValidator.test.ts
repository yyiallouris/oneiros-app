import {
  MYTHIC_CATALOG_ENTRY_COUNT,
  MYTHIC_CATALOG_VERSION,
  getMythicCatalogEntry,
  listMythicCatalogIds,
  resolveMythDisplay,
} from '../src/ai/catalogs/mythicNarrativeCatalog';
import {
  MYTHIC_PROMPT_INDEX,
  MYTHIC_PROMPT_INDEX_TOKEN_COUNT,
  MYTHIC_PROMPT_INDEX_VERSION,
} from '../src/ai/catalogs/mythicPromptIndex';
import {
  validateClosedCatalogMythicEcho,
  validateClosedCatalogMythicEchoes,
} from '../src/ai/validators/mythicCatalogValidator';

const DREAM = [
  'I open the sealed copper vessel beside the dry lake.',
  'The giant rises and threatens me for centuries of captivity.',
  'I pretend disbelief and ask him to prove he can fit inside again.',
  'When he shrinks into the vessel I close the lid at once.',
].join(' ');

describe('closed mythic catalog + validator (C.1 integrity-only)', () => {
  it('loads 130 unique catalog ids and stays under the 10k token ceiling', () => {
    const ids = listMythicCatalogIds();
    expect(MYTHIC_CATALOG_ENTRY_COUNT).toBe(130);
    expect(ids).toHaveLength(130);
    expect(MYTHIC_CATALOG_VERSION).toBe('1.3.0');
    expect(MYTHIC_PROMPT_INDEX_VERSION).toBe(3);
    expect(MYTHIC_PROMPT_INDEX_TOKEN_COUNT).toBeLessThanOrEqual(10000);
    expect(MYTHIC_PROMPT_INDEX).toContain('sig:');
    expect(MYTHIC_PROMPT_INDEX).toContain('req:');
    expect(ids).toContain('hebrew_bible.tower_babel');
    expect(ids).toContain('greek.cronus_devouring_children');
  });

  it('rejects unknown catalog_id and model-authored titles', () => {
    const unknown = validateClosedCatalogMythicEcho(
      {
        catalog_id: 'arabian.not_a_real_myth',
        resonance: 'Sealed being released then resealed by cunning.',
        divergence: 'The dream adds a dry lake and black bird.',
        evidence_ids: ['D1'],
        confidence: 'high',
      },
      { dreamText: DREAM }
    );
    expect(unknown.reason).toBe('unknown_catalog_id');

    const authoredTitle = validateClosedCatalogMythicEcho(
      {
        catalog_id: 'arabian.fisherman_and_jinni',
        title: 'Fisherman',
        resonance: 'A sealed being is released and resealed through cunning proof.',
        divergence: 'The dream adds a dry lake setting.',
        evidence_ids: ['D1', 'D4'],
        confidence: 'high',
      },
      { dreamText: DREAM }
    );
    expect(authoredTitle.reason).toBe('model_authored_title_forbidden');
  });

  it('accepts correct catalog_id without matched_feature_ids', () => {
    const result = validateClosedCatalogMythicEchoes(
      [
        {
          catalog_id: 'arabian.fisherman_and_jinni',
          resonance: 'A sealed being is released, threatens the liberator, and is resealed.',
          divergence: 'The dream adds a dry lake and copper vessel.',
          evidence: ['I open the sealed copper vessel beside the dry lake.'],
          confidence: 'high',
        },
      ],
      { dreamText: DREAM, max: 1 }
    );

    expect(result.accepted).toHaveLength(1);
    expect(result.accepted[0]).toMatchObject({
      catalog_id: 'arabian.fisherman_and_jinni',
      title: 'The Fisherman and the Jinni',
      tradition: 'One Thousand and One Nights',
      catalog_myth_version: '1.3.0',
      confidence: 'high',
    });
    expect(result.logs[0].validation_warnings).toContain('evidence_span_count_below_preferred');
  });

  it('does not reject invented matched_feature_ids — field is ignored', () => {
    const result = validateClosedCatalogMythicEcho(
      {
        catalog_id: 'arabian.fisherman_and_jinni',
        matched_feature_ids: ['wish_granting_only', 'not_a_real_feature'],
        resonance: 'A sealed being is released, threatens the liberator, and is resealed.',
        divergence: 'The dream adds a dry lake and copper vessel.',
        evidence: [
          'I open the sealed copper vessel beside the dry lake.',
          'When he shrinks into the vessel I close the lid at once.',
        ],
        confidence: 'high',
      },
      { dreamText: DREAM }
    );
    expect(result.echo?.catalog_id).toBe('arabian.fisherman_and_jinni');
    expect(result.reason).toBeUndefined();
  });

  it('resolves title/tradition deterministically from catalog_id', () => {
    const display = resolveMythDisplay('sumerian.inanna_descent');
    expect(display).toEqual({
      title: 'The Descent of Inanna',
      tradition: 'Sumerian / Mesopotamian',
      sourceType: 'religious_narrative',
    });
    expect(getMythicCatalogEntry('sumerian.inanna_descent')?.signature_features.length).toBeGreaterThan(
      3
    );
  });

  it('resolves the new Babel and Cronus records from catalog_id', () => {
    expect(resolveMythDisplay('hebrew_bible.tower_babel')).toEqual({
      title: 'The Tower of Babel',
      tradition: 'Hebrew Bible / Tanakh',
      sourceType: 'religious_narrative',
    });
    expect(resolveMythDisplay('greek.cronus_devouring_children')).toEqual({
      title: 'Cronus and the Devouring of His Children',
      tradition: 'Greek mythology',
      sourceType: 'myth',
    });
  });
});
