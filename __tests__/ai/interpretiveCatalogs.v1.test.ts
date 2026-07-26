import { ARCHETYPE_WHITELIST } from '../../src/constants/archetypes';
import {
  ARCHETYPE_CATALOG_V1,
  archetypeCatalogLabels,
  getArchetypeDefinitionV1,
} from '../../src/ai/catalogs/archetypeCatalog.v1';
import { validateArchetypalEchoes } from '../../src/ai/validators/archetypalEchoValidator';
import { validateMythicEcho } from '../../src/ai/validators/mythicEchoValidator';
import { canonicalizeOntologyLabel, AFFECT_ONTOLOGY_V1 } from '../../src/ai/catalogs/dreamFabricOntologies.v1';
import { MYTHIC_ECHOES_OPEN_WORLD } from '../../src/ai/mythicCatalog';

describe('interpretive catalogs v1 / open-world mythic echoes', () => {
  it('covers every whitelist archetype with operational kind + selection fields', () => {
    const labels = new Set(archetypeCatalogLabels());
    for (const name of ARCHETYPE_WHITELIST) {
      expect(labels.has(name)).toBe(true);
      const def = getArchetypeDefinitionV1(name);
      expect(def?.kind).toBeTruthy();
      expect(def?.displayLabel).toBeTruthy();
      expect(def?.coreFunction.length).toBeGreaterThan(20);
      expect(def?.selectWhen.length).toBeGreaterThan(0);
      expect(def?.insufficientWhen.length).toBeGreaterThan(0);
    }
    expect(ARCHETYPE_CATALOG_V1.length).toBe(ARCHETYPE_WHITELIST.length);
    expect(getArchetypeDefinitionV1('Shadow')?.displayLabel).toBe('Shadow');
    expect(getArchetypeDefinitionV1('Divine Child')?.displayLabel).toBe('The Divine Child');
    expect(getArchetypeDefinitionV1('Anima')?.kind).toBe('psychic_structure');
    expect(getArchetypeDefinitionV1('Guide / Psychopomp')?.kind).toBe('relational_role');
    expect(getArchetypeDefinitionV1('Death–Rebirth')?.kind).toBe('transformational_pattern');
  });

  it('keeps Mythic Echoes open-world (no closed corpus)', () => {
    expect(MYTHIC_ECHOES_OPEN_WORLD).toBe(true);
  });

  it('rejects Double when evaluation explicitly denies identityCompetition', () => {
    const result = validateArchetypalEchoes(
      [
        {
          canonical_label: 'Double',
          expression: 'the figure with my eyes',
          resonance: 'A familiar face appears without taking my place or competing for my role.',
          evidence: ['shares my eyes'],
          confidence: 'high',
        },
      ],
      { evaluations: [{ identityCompetition: false, centrality: 3 }] }
    );
    expect(result.accepted).toHaveLength(0);
    expect(result.rejected[0]?.reason).toMatch(/identityCompetition/);
  });

  it('does not wipe Guide / Terrible Mother when evaluation is omitted', () => {
    const result = validateArchetypalEchoes([
      {
        canonical_label: 'Guide / Psychopomp',
        expression: 'the gate guardian',
        resonance: 'A guardian regulates successive losses on the way down and back.',
        evidence: ['gates', 'guardian'],
        confidence: 'high',
      },
      {
        canonical_label: 'Terrible Mother',
        expression: 'the underworld woman who keeps what cannot return',
        resonance: 'A maternal underworld power decides what may surface and what stays below.',
        evidence: ['underworld woman', 'what must stay'],
        confidence: 'medium',
      },
    ]);
    expect(result.accepted).toHaveLength(2);
  });

  it('rejects invented folk / motif titles in the lightweight mythic validator', () => {
    expect(
      validateMythicEcho({
        title: 'Οι δύο δρόμοι',
        tradition: 'Persian folk tradition',
        resonance: 'A vague fork in the road appears as if destiny waited.',
        divergence: 'Not much else matches the traditional pattern.',
        evidence: ['road', 'choice'],
        confidence: 'medium',
      })
    ).toEqual([]);

    expect(
      validateMythicEcho({
        title: 'World mythology transformation pattern',
        tradition: 'Comparative mythology',
        resonance: 'Something descends and returns changed somehow.',
        divergence: 'The dream is different in unspecified ways.',
        evidence: ['darkness', 'return'],
        confidence: 'high',
      })
    ).toEqual([]);
  });

  it('canonicalizes affect aliases via fabric ontology starter', () => {
    expect(canonicalizeOntologyLabel('άγχος', AFFECT_ONTOLOGY_V1)).toBe('anxiety');
    expect(canonicalizeOntologyLabel('unknown-feeling', AFFECT_ONTOLOGY_V1)).toBe('unknown-feeling');
  });
});
