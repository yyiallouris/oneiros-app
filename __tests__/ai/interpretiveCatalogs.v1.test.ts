import { ARCHETYPE_WHITELIST } from '../../src/constants/archetypes';
import {
  ARCHETYPE_CATALOG_V1,
  archetypeCatalogLabels,
  formatArchetypeCatalogForPromptV1,
  getArchetypeDefinitionById,
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
      if (name === 'Trickster') {
        expect(getArchetypeDefinitionV1('Trickster')?.id).toBe('trickster');
        expect(getArchetypeDefinitionById('trickster.action')).toBeUndefined();
        expect(getArchetypeDefinitionById('trickster.figure')).toBeUndefined();
        continue;
      }
      const def = getArchetypeDefinitionV1(name);
      expect(def?.kind).toBeTruthy();
      expect(def?.displayLabel).toBeTruthy();
      expect(def?.coreFunction.length).toBeGreaterThan(20);
      expect(def?.selectWhen.length).toBeGreaterThan(0);
      expect(def?.insufficientWhen.length).toBeGreaterThan(0);
    }
    expect(ARCHETYPE_CATALOG_V1.length).toBe(ARCHETYPE_WHITELIST.length);
    expect(getArchetypeDefinitionV1('Shadow')?.displayLabel).toBe('Shadow');
    expect(getArchetypeDefinitionV1('Trickster')?.id).toBe('trickster');
    expect(getArchetypeDefinitionById('trickster.action')).toBeUndefined();
    expect(getArchetypeDefinitionById('trickster.figure')).toBeUndefined();
    expect(getArchetypeDefinitionV1('Divine Child')?.displayLabel).toBe('The Divine Child');
    expect(getArchetypeDefinitionV1('Anima')?.kind).toBe('psychic_structure');
    expect(getArchetypeDefinitionV1('Guide / Psychopomp')?.kind).toBe('relational_role');
    expect(getArchetypeDefinitionV1('Death–Rebirth')?.kind).toBe('transformational_pattern');
    expect(getArchetypeDefinitionV1('Ego')?.selectableAsEcho).toBe(false);
    const injected = formatArchetypeCatalogForPromptV1();
    expect(injected).not.toMatch(/^- Ego$/m);
    expect(injected).toMatch(/id=self label:Self/);
    expect(injected).toMatch(/select when:/);
    expect(injected).toMatch(/not enough:/);
    expect(injected).toMatch(/require mechanisms:/);
    expect(injected).toMatch(/id=trickster/);
    expect(injected).not.toMatch(/\[trickster\]/);
    expect(injected).not.toMatch(/\[psychic_structure\]/);
    expect(injected).not.toMatch(/competes with:/);
  });

  it('keeps Mythic Echoes open-world (no closed corpus)', () => {
    expect(MYTHIC_ECHOES_OPEN_WORLD).toBe(true);
  });

  it('rejects Double when evaluation explicitly denies identityCompetition', () => {
    const result = validateArchetypalEchoes(
      [
        {
          archetype_id: 'double',
          expression: 'the figure with my eyes',
          resonance: 'A familiar face appears without taking my place or competing for my role.',
          evidence_ids: ['D1'],
          confidence: 'high',
        },
      ],
      { evaluations: [{ identityCompetition: false, centrality: 3 }] }
    );
    expect(result.accepted).toHaveLength(0);
    expect(result.rejected[0]?.reason).toMatch(/identityCompetition/);
  });

  it('rejects Guide when mechanism_tags are omitted and canonicalizes legacy mother ids', () => {
    const result = validateArchetypalEchoes([
      {
        archetype_id: 'guide_psychopomp',
        expression: 'the gate guardian',
        resonance: 'A guardian regulates successive losses on the way down and back.',
        evidence_ids: ['D1', 'D2'],
        confidence: 'high',
      },
    ]);
    expect(result.accepted).toHaveLength(0);
    expect(result.rejected[0]?.reason).toBe('missing_mechanism_tags_for_hard_gate');

    const legacyMother = validateArchetypalEchoes([
      {
        archetype_id: 'terrible_mother',
        expression: 'the underworld woman who keeps what cannot return',
        resonance: 'A maternal underworld power decides what may surface and what stays below.',
        evidence_ids: ['D1', 'D2'],
        confidence: 'medium',
      },
    ]);
    expect(legacyMother.accepted).toHaveLength(1);
    expect(legacyMother.accepted[0]?.archetype_id).toBe('mother');
    expect(legacyMother.accepted[0]?.canonical_label).toBe('Mother');
  });

  it('accepts Guide with hard-gate tags and collapses legacy mother ids to Mother', () => {
    const result = validateArchetypalEchoes([
      {
        archetype_id: 'guide_psychopomp',
        expression: 'the gate guardian',
        resonance: 'A guardian regulates successive losses on the way down and back.',
        evidence_ids: ['D1', 'D2'],
        confidence: 'high',
        mechanism_tags: ['active_threshold_guidance', 'crossing_between_domains'],
      },
      {
        archetype_id: 'terrible_mother',
        expression: 'the underworld woman who keeps what cannot return',
        resonance: 'A maternal underworld power decides what may surface and what stays below.',
        evidence_ids: ['D1', 'D2'],
        confidence: 'medium',
      },
    ]);
    expect(result.accepted).toHaveLength(2);
    expect(result.accepted[1]?.archetype_id).toBe('mother');
    expect(result.accepted[1]?.canonical_label).toBe('Mother');
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
