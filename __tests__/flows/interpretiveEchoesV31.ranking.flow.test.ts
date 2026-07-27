/**
 * Flow coverage: documentation/flows-06-jungian-ai-reflection.md
 * + docs/SYMBOLS_FLOW.md / architecture-interpretation.md
 *
 * Interpretive Echoes v4.1.3-B.2 — carrier-scoped archetype_id catalog + generic duplicate collapse.
 */
import {
  buildDreamExtractionSystemPrompt,
  buildDreamExtractionUserPrompt,
  DEBUG_INTERPRETIVE_ECHOES_USER_SUFFIX,
  DREAM_EXTRACTION_PROMPT_ID,
  DREAM_EXTRACTION_PROMPT_VERSION,
  DREAM_EXTRACTION_SCHEMA_VERSION,
} from '../../src/ai/dreamExtractionPrompt';
import {
  parseInterpretiveEchoDiagnostics,
  stripInterpretiveDiagnostics,
} from '../../src/ai/interpretiveEchoDiagnostics';
import { normalizeArchetypalEchoes } from '../../src/ai/archetypalEchoes';
import { normalizeAmplifications } from '../../src/ai/mythicEchoes';
import { validateStructuredTaskContent } from '../../src/ai/structuredTaskValidation';
import { ARCHETYPE_CATALOG } from '../../src/ai/archetypeCatalog';
import { formatArchetypeCatalogForPromptV1 } from '../../src/ai/catalogs/archetypeCatalog.v1';
import { validateClosedCatalogMythicEchoes } from '../../src/ai/validators/mythicCatalogValidator';
import { validateArchetypalEchoes } from '../../src/ai/validators/archetypalEchoValidator';

describe('Interpretive Echoes v4.1.9-M1 myth contract', () => {
  const system = buildDreamExtractionSystemPrompt();

  it('versions prompt_id v4.1.9-M1 / prompt_version 4.1.9-M1 / schema 13', () => {
    expect(DREAM_EXTRACTION_PROMPT_ID).toBe('dream-field-map-interpretive-v4.1.9-M1');
    expect(DREAM_EXTRACTION_PROMPT_VERSION).toBe('4.1.9-M1');
    expect(DREAM_EXTRACTION_SCHEMA_VERSION).toBe(13);
  });

  it('keeps rich Dream Fabric pedagogy unchanged', () => {
    expect(system).toMatch(/poetic mirror, not a metadata report/);
    expect(system).toMatch(/AFFECTS \/ EMOTIONAL WEATHER/);
    expect(system).toMatch(/RELATIONSHIP FIELD \/ RELATIONAL DYNAMICS/);
    expect(system).toMatch(/THRESHOLDS/);
    expect(system).toMatch(/MOTIFS \/ DREAM MOTIFS/);
    expect(system).toMatch(/CENTRAL CONFLICTS \/ INNER TENSIONS/);
  });

  it('uses v4.1.1 slim archetypes without legacy dream-map pedagogy', () => {
    expect(system).toMatch(/EVIDENCE FIREWALL/);
    expect(system).toMatch(/CLOSED_MYTH_CATALOG/);
    expect(system).toMatch(/ONEIROS ARCHETYPE CATALOG/);
    expect(system).toMatch(/Never return Ego/);
    expect(system).toMatch(/A false Mythic Echo is worse than no result/);
    expect(system).toMatch(/CLOSED MECHANISM TAGS/);
    expect(system).toMatch(/require mechanisms:/);
    expect(system).toMatch(/independent pipelines/);
    expect(system).not.toMatch(/CONTRASTIVE EXAMPLES/);
    expect(system).not.toMatch(/Example A — decisive cunning/);
    expect(system).not.toMatch(/STEP 1 — ORDERED EVENT MAP/);
    expect(system).not.toMatch(/ROLE–VERB MECHANISM/);
    expect(system).not.toMatch(/DECISIVE SPAN/);
    expect(system).not.toMatch(/PLOT-CONTAMINATION TEST/);
    expect(system).not.toMatch(/TITLE–PLOT IDENTITY TEST/);
    expect(system).not.toMatch(/INDEPENDENT PLOT RECALL/);
    expect(system).not.toMatch(/APPEARANCE-STRIPPING TEST/);
    expect(system).not.toMatch(/leverage_transfer/);
    expect(system).not.toMatch(/pivot_beat/);
    expect(ARCHETYPE_CATALOG.map((d) => d.canonicalLabel)).toEqual(
      expect.arrayContaining(['Divine Child', 'Guide / Psychopomp', 'Mother', 'Father', 'Ruler', 'Double', 'Ego'])
    );
    const injected = formatArchetypeCatalogForPromptV1();
    expect(injected).not.toMatch(/^- Ego$/m);
    expect(injected).not.toMatch(/\[psychic_structure\]/);
    expect(injected).not.toMatch(/UI:"/);
    expect(injected).not.toMatch(/competes with:/);
    expect(injected).toMatch(/select when:/);
    expect(injected).toMatch(/not enough:/);
    expect(injected).toMatch(/id=shadow label:Shadow/);
    expect(injected).toMatch(/id=trickster/);
    expect(injected).not.toMatch(/\[trickster\]/);
    expect(injected).not.toMatch(/\[trickster\.action\]/);
    expect(injected).not.toMatch(/\[trickster\.figure\]/);
    expect(injected).not.toMatch(/giant/);
    expect(injected).not.toMatch(/vessel/);
    expect(system).toMatch(/select exact id= values for archetype_id/);
    expect(system).toMatch(/enacted archetypal function or movement/);
    expect(system).not.toMatch(/carrier_evidence_ids/);
    expect(system).not.toMatch(/mechanism_actor/);
  });

  it('injects closed myth compact index and forbids free-text myth titles', () => {
    expect(system).toMatch(/MYTHIC ECHO — CLOSED CATALOG/);
    expect(system).toMatch(/sumerian\.inanna_descent/);
    expect(system).toMatch(/Never invent or rewrite an ID/);
    expect(system).toMatch(/arabian\.fisherman_and_jinni/);
    expect(system).toMatch(/greek\.sisyphus/);
    expect(system).not.toMatch(/Return one myth only when a SPECIFIC/);
    expect(system).not.toMatch(/DISTINCTIVE-NARRATIVE RECALL TRIGGER/);
    expect(system).not.toMatch(/WINNER CONSISTENCY/);
    expect(system).not.toMatch(/mythicEchoResolver/);
  });

  it('enforces evidence firewall: raw dream only for selection', () => {
    expect(system).toMatch(/Use only the raw dream for selection, mechanism tags, and evidence_ids/i);
    expect(system).toMatch(/Use the RAW DREAM only for selection and evidence_ids/i);
    expect(system).toMatch(/Treat the reflection as absent until selection/i);
  });

  it('does not leak T02/T05 answer-key clusters into production prompt', () => {
    // Catalog titles may appear in CLOSED_MYTH_CATALOG; answer-key clusters must not.
    expect(system).not.toMatch(/thread \+ labyrinth \+ bull-like being/);
    expect(system).not.toMatch(/seven gates \+ progressive loss/);
  });

  it('debug user prompt stays compact and does not restore legacy dream-map audits', () => {
    const input = {
      title: 'T',
      date: '2026-07-25',
      content: 'A short dream.',
      finalInterpretation: 'A short reflection.',
    };
    const off = buildDreamExtractionUserPrompt(input);
    const on = buildDreamExtractionUserPrompt({ ...input, debugInterpretiveEchoes: true });

    expect(on.startsWith(off)).toBe(true);
    expect(on.slice(off.length)).toBe(DEBUG_INTERPRETIVE_ECHOES_USER_SUFFIX);
    expect(on).toMatch(/MUST include a top-level key "interpretive_diagnostics"/);
    expect(on).toMatch(/selection_notes/);
    expect(on).toMatch(/Do not use numerical self-scores/);
    expect(on).not.toMatch(/dream_map/);
    expect(on).not.toMatch(/role_verb_mechanism/);
    expect(on).not.toMatch(/decisive_span/);
    expect(on).not.toMatch(/plot_contamination_test/);
    expect(off).toMatch(/Keep archetype and myth selections independent/);
    expect(off).toMatch(/Treat the reflection as absent until archetype_id and myth catalog_id are fixed/);
  });

  it('parses dream_map + archetype/mythic audit', () => {
    const diag = parseInterpretiveEchoDiagnostics({
      dream_map: {
        beats: ['B1: sealed vessel', 'B2: release threat', 'B3: feigned disbelief reseals'],
        role_verb_mechanism: '[captive power] —threatens→ [liberator] —deceives→ [resealed bargain]',
        decisive_span: ['B3'],
        causal_omission_check: 'repaired',
        dominant_relation: 'imprisoned power vs liberator',
        ending: 'bargain after reseal',
      },
      archetype_audit: [
        {
          label: 'Trickster',
          carrier: 'feigned disbelief that reseals the vessel',
          carrier_kind: 'dream_ego_action',
          function_match: 'yes',
          structural_importance: 'yes',
          evidence_beats: ['B3'],
          adds_precision: 'yes',
          selected: true,
          reason: 'decisive-span deception',
        },
      ],
      mythic_audit: [
        {
          title: 'The Fisherman and the Jinni',
          tradition: 'One Thousand and One Nights',
          title_type: 'specific_tale',
          independent_plot_anchors: ['Solomon seal', 'threat after centuries'],
          canonical_beats: ['sealed vessel', 'threat after release', 'trick reseals'],
          plot_contamination_test: 'pass',
          matched_beats: [
            { canonical_beat: 'sealed vessel', dream_beat: 'B1', dream_evidence: 'copper vessel' },
            { canonical_beat: 'trick reseals', dream_beat: 'B3', dream_evidence: 'feigned disbelief' },
          ],
          surface_stripping_result: 'pass',
          selected: true,
          reason: 'closest mechanism + sequence',
        },
        {
          title: '[]',
          tradition: '[]',
          selected: false,
          reason: 'dummy',
        },
      ],
    });

    expect(diag?.dream_map?.decisive_span).toEqual(['B3']);
    expect(diag?.dream_map?.role_verb_mechanism).toMatch(/deceives/);
    expect(diag?.dream_map?.causal_omission_check).toBe('repaired');
    expect(diag?.archetype_audit[0]?.function_match).toBe('yes');
    expect(diag?.archetype_audit[0]?.evidence_beats).toEqual(['B3']);
    expect(diag?.mythic_audit).toHaveLength(1);
    expect(diag?.mythic_audit[0]?.title_type).toBe('specific_tale');
    expect(diag?.mythic_audit[0]?.plot_contamination_test).toBe('pass');
    expect(diag?.mythic_audit[0]?.independent_plot_anchors).toHaveLength(2);
  });

  it('coerces legacy leverage_transfer fields into decisive_span', () => {
    const diag = parseInterpretiveEchoDiagnostics({
      dream_map: {
        beats: ['B1: a', 'B2: b'],
        leverage_transfer_span: ['B1', 'B2'],
        causal_omission_check: 'pass',
      },
      archetype_audit: [],
      mythic_audit: [],
    });
    expect(diag?.dream_map?.decisive_span).toEqual(['B1', 'B2']);
    expect((diag?.dream_map as Record<string, unknown> | undefined)?.leverage_transfer_span).toBeUndefined();
  });

  it('parity: same final echoes with debug off vs on (+ diagnostics only when on)', () => {
    const finalEchoes = {
      symbols: ['thread', 'labyrinth'],
      archetypes: [
        {
          archetype_id: 'shadow',
          expression: 'the bound bull-like being at the centre',
          mechanism_tags: ['private_self_conflict'],
          evidence_ids: ['D1', 'D2'],
          resonance: 'A neglected creature waits at the centre until care and release change its form.',
          confidence: 'high' as const,
        },
      ],
      amplifications: [
        {
          catalog_id: 'greek.cretan_labyrinth',
          resonance: 'A thread leads through a winding centre toward a bound creature.',
          divergence: 'Here the creature is fed rather than slain.',
          evidence: ['thread', 'labyrinth', 'bound being'],
          confidence: 'high' as const,
          evaluation: {
            matched_dimensions: [
              'distinctive_cluster',
              'narrative_sequence',
              'relational_roles',
            ],
            divergence_type: 'outcome_changed',
            disqualifiers_triggered: [],
          },
        },
      ],
      landscapes: [],
      affects: [],
      motifs: [],
      relational_dynamics: [],
      thresholds: [],
      central_conflicts: [],
      core_mode: null,
      symbol_stances: [],
      display_distillation: {
        essence_title: 'Thread',
        essence_line: 'A thread leads inward.',
        dominant_lens: 'image',
        visible_anchors: [],
        main_tension: null,
        dream_movement: 'unclear',
        movement_line: null,
      },
    };

    const offParsed = validateStructuredTaskContent('dream_extraction', JSON.stringify(finalEchoes));
    expect(offParsed.ok).toBe(true);
    const offData = (offParsed.ok ? offParsed.data : {}) as {
      archetypes?: unknown;
      amplifications?: unknown;
    };

    const withDiagnostics = {
      ...finalEchoes,
      interpretive_diagnostics: {
        dream_map: {
          beats: ['B1: thread'],
          role_verb_mechanism: '[seeker] —follows→ [guide-thread]',
          decisive_span: ['B1'],
          causal_omission_check: 'pass',
        },
        archetype_audit: [{ label: 'Shadow', selected: true, evidence_beats: ['B1'] }],
        mythic_audit: [
          {
            title: 'Ariadne and the Labyrinth',
            title_type: 'specific_tale',
            independent_plot_anchors: ['thread gift', 'centre creature'],
            plot_contamination_test: 'pass',
            selected: true,
          },
        ],
      },
    };
    const diag = parseInterpretiveEchoDiagnostics(withDiagnostics.interpretive_diagnostics);
    expect(diag).not.toBeNull();
    const onData = stripInterpretiveDiagnostics(withDiagnostics as Record<string, unknown>);

    expect(normalizeArchetypalEchoes(onData.archetypes)).toEqual(normalizeArchetypalEchoes(offData.archetypes));
    expect(normalizeAmplifications(onData.amplifications)).toEqual(normalizeAmplifications(offData.amplifications));
  });

  it('ships prompt v4.1.9-M1 with catalog_id-only myth contract', () => {
    expect(DREAM_EXTRACTION_PROMPT_VERSION).toBe('4.1.9-M1');
    expect(DREAM_EXTRACTION_PROMPT_ID).toBe('dream-field-map-interpretive-v4.1.9-M1');
    expect(system).toMatch(/evidence_ids/);
    expect(system).toMatch(/archetype_id/);
    expect(system).not.toMatch(/mechanism_actor/);
    expect(system).not.toMatch(/carrier_evidence_ids/);
    const user = buildDreamExtractionUserPrompt({
      title: 'T',
      date: '2026-07-27',
      content: 'First beat here.\n\nSecond beat there.',
      finalInterpretation: null,
    });
    expect(user).toMatch(/\[D1\]/);
    expect(user).toMatch(/evidence_ids/);
  });

  it('rejects unknown closed-catalog ids with no open-world fallback', () => {
    const result = validateClosedCatalogMythicEchoes(
      [
        {
          catalog_id: 'arabian.not_a_real_myth',
          resonance: 'A sealed being is released then resealed by cunning.',
          divergence: 'The dream adds a dry lake guide animal.',
          evidence: [
            'I open the sealed copper vessel beside the dry lake.',
            'When he shrinks into the vessel I close the lid at once.',
          ],
          confidence: 'high',
          evaluation: {
            matched_dimensions: [
              'distinctive_cluster',
              'narrative_sequence',
              'relational_roles',
              'central_conflict',
            ],
            divergence_type: 'outcome_changed',
            disqualifiers_triggered: [],
          },
        },
      ],
      {
        dreamText:
          'I open the sealed copper vessel beside the dry lake. When he shrinks into the vessel I close the lid at once.',
        max: 1,
      }
    );
    expect(result.accepted).toHaveLength(0);
    expect(result.rejected[0]?.reason).toBe('unknown_catalog_id');
  });

  it('keeps hard-gate archetypes when evaluation is omitted; rejects explicit false signals', () => {
    const omitted = validateArchetypalEchoes([
      {
        archetype_id: 'double',
        expression: 'the figure wearing my coat',
        resonance: 'Another self claims my place at the table and will not yield.',
        evidence_ids: ['D1', 'D2'],
        confidence: 'high',
      },
    ]);
    expect(omitted.accepted).toHaveLength(1);

    const doubleExplicitFalse = validateArchetypalEchoes(
      [
        {
          archetype_id: 'double',
          expression: 'the figure with my eyes',
          resonance: 'A familiar face appears without taking my place.',
          evidence_ids: ['D1'],
          confidence: 'high',
        },
      ],
      { evaluations: [{ identityCompetition: false, centrality: 3 }] }
    );
    expect(doubleExplicitFalse.accepted).toHaveLength(0);
    expect(doubleExplicitFalse.rejected[0]?.reason).toMatch(/identityCompetition/);
  });

  it('uses empty-array schema example and keeps evaluation out of production archetypes', () => {
    expect(system).toMatch(/"archetypes": \[\]/);
    expect(system).toMatch(/"amplifications": \[\]/);
    expect(system).not.toMatch(/"canonical_label": "Shadow"/);
    expect(system).toMatch(/"archetype_id"/);
    expect(system).not.toMatch(/Ariadne and the Labyrinth/);
  });
});
