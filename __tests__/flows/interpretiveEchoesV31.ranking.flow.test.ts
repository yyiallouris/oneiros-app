/**
 * Flow coverage: documentation/flows-06-jungian-ai-reflection.md
 * + docs/SYMBOLS_FLOW.md / architecture-interpretation.md
 *
 * Interpretive Echoes v3.6.7 — decisive turning-point coverage + narrative specificity + winner consistency.
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
import { validateMythicEcho, validateMythicEchoes } from '../../src/ai/validators/mythicEchoValidator';
import { validateArchetypalEchoes } from '../../src/ai/validators/archetypalEchoValidator';

describe('Interpretive Echoes v3.6.7 selection-theory contract', () => {
  const system = buildDreamExtractionSystemPrompt();

  it('versions prompt_id v3.6 / prompt_version 3.6.7 / schema 4', () => {
    expect(DREAM_EXTRACTION_PROMPT_ID).toBe('dream-field-map-interpretive-v3.6');
    expect(DREAM_EXTRACTION_PROMPT_VERSION).toBe('3.6.7');
    expect(DREAM_EXTRACTION_SCHEMA_VERSION).toBe(4);
  });

  it('keeps rich Dream Fabric pedagogy unchanged', () => {
    expect(system).toMatch(/poetic mirror, not a metadata report/);
    expect(system).toMatch(/AFFECTS \/ EMOTIONAL WEATHER/);
    expect(system).toMatch(/RELATIONSHIP FIELD \/ RELATIONAL DYNAMICS/);
    expect(system).toMatch(/THRESHOLDS/);
    expect(system).toMatch(/MOTIFS \/ DREAM MOTIFS/);
    expect(system).toMatch(/CENTRAL CONFLICTS \/ INNER TENSIONS/);
  });

  it('identifies decisive turning-point before archetype candidate ranking', () => {
    expect(system).toMatch(/ARCHETYPAL ECHOES \(0–2\)/);
    expect(system).toMatch(/ONEIROS ARCHETYPE CATALOG/);
    expect(system).toMatch(/CANDIDATE COVERAGE \(before ranking/);
    expect(system).toMatch(/the decisive turning point of the dream/);
    expect(system).toMatch(/the action that reverses the power balance/);
    expect(system).toMatch(/the action that changes what becomes possible afterward/);
    expect(system).toMatch(/decisive turning-point action MUST be included among candidate carriers/);
    expect(system).toMatch(/dream-ego actions \/ modes of action/);
    expect(system).toMatch(/Archetypal weight requires support from at least two of/);
    expect(system).toMatch(/never infer from sex, gender, attraction/);
    expect(system).toMatch(/\[psychic_structure\]/);
    expect(system).toMatch(/\[archetypal_figure\]/);
    expect(system).toMatch(/\[relational_role\]/);
    expect(system).toMatch(/\[transformational_pattern\]/);
    expect(system).toMatch(/select when:/);
    expect(system).toMatch(/competes with:/);
    expect(system).toMatch(/ideally 18–32 words/);
    expect(system).not.toMatch(/classical archetypal patterns/);
    expect(system).not.toMatch(/Hard gates \(do not select if unmet\)/);
    expect(ARCHETYPE_CATALOG.map((d) => d.canonicalLabel)).toEqual(
      expect.arrayContaining(['Divine Child', 'Guide / Psychopomp', 'Terrible Mother', 'Ruler', 'Double'])
    );
  });

  it('preserves mythic narrative specificity and winner consistency', () => {
    expect(system).toMatch(/MYTHIC ECHO \(0–1\)/);
    expect(system).toMatch(/INTERNAL SELECTION PROCESS/);
    expect(system).toMatch(/Before recalling any narrative, derive the dream's configuration/);
    expect(system).toMatch(/CANONICALIZE before ranking/);
    expect(system).toMatch(/Preserve narrative specificity/);
    expect(system).toMatch(/specific episode\/tale > recognized cycle > generic narrative complex > motif/);
    expect(system).toMatch(/WINNER CONSISTENCY/);
    expect(system).toMatch(/specific multi-stage sequence \+ defining reversal/);
    expect(system).toMatch(/broad restoration \/ ending \/ wasteland frame/);
    expect(system).toMatch(/Object or figure association alone must never receive high structural strength/);
    expect(system).toMatch(/Score each remaining candidate separately on these dimensions/);
    expect(system).toMatch(/SELECTION GATE/);
    expect(system).toMatch(/Silence is preferable to false cultural authority/);
    expect(system).toMatch(/An unusually direct structural match should nevertheless be returned/);
    expect(system).toMatch(/Do not begin from a famous name/);
    expect(system).toMatch(/never altered pseudo-quotes/);
    expect(system).not.toMatch(/mythic_signature/);
    expect(system).not.toMatch(/Named descent \/ underworld \/ labyrinth narratives remain valid/);
    expect(system).not.toMatch(/do not withhold them out of excessive caution/i);
    expect(system).not.toMatch(/Recall \(do not over-suppress\)/);
    expect(system).not.toMatch(/at least four concrete correspondences/);
    expect(system).not.toMatch(/mythicEchoResolver/);
  });

  it('uses dream-only candidate generation and ignores reflection-named candidates', () => {
    expect(system).toMatch(/Candidate generation for archetypes and Mythic Echoes: use the raw dream only/);
    expect(system).toMatch(/Ignore any explicit archetype or myth names in the reflection during selection/);
  });

  it('does not leak T02/T05 answer-key clusters into production prompt', () => {
    expect(system).not.toMatch(/thread \+ labyrinth \+ bull-like being/);
    expect(system).not.toMatch(/seven gates \+ progressive loss/);
    expect(system).not.toMatch(/Ariadne and the Cretan Labyrinth/);
    expect(system).not.toMatch(/Descent of Inanna|Inanna.?s Descent|Inanna’s Descent/i);
    expect(system).not.toMatch(/"title":\s*"Ariadne/);
    expect(system).not.toMatch(/"title":\s*"Inanna/);
  });

  it('debug user prompt is an additive suffix that does not rewrite selection criteria', () => {
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
    expect(on).toMatch(/decisive_turning_point/);
    expect(on).toMatch(/carrier_kind/);
    expect(on).toMatch(/aliases_merged/);
    expect(on).toMatch(/narrative_specificity/);
    expect(on).toMatch(/gate_failure/);
    expect(on).toMatch(/prefix with "summary:"/);
    expect(on).toMatch(/sequence_match/);
    expect(on).toMatch(/object_association/);
    expect(off).toMatch(/identify decisive turning-point/i);
    expect(off).toMatch(/keep specific tale over generic complex/i);
    expect(off).not.toMatch(/mythic_signature/i);
    expect(off).not.toMatch(/do not withhold/i);
  });

  it('parses decisive_turning_point, narrative_specificity, and gate_failure', () => {
    const diag = parseInterpretiveEchoDiagnostics({
      decisive_turning_point: 'feigned disbelief that reseals the vessel',
      archetype_candidates: [
        {
          label: 'Trickster',
          carrier: 'feigned disbelief that reseals the vessel',
          carrier_kind: 'dream_ego_action',
          support: ['exact dream span'],
          counterevidence: [],
          centrality: 5,
          selected: false,
          rejection_reason: 'Guide more central to final phase',
        },
      ],
      mythic_candidates: [
        {
          title: 'The Fisherman and the Jinni',
          tradition: 'Arabic folktale',
          canonical_id: 'fisherman-and-jinni',
          narrative_specificity: 'specific_tale',
          aliases_merged: ['The Jinni in the Bottle'],
          sequence_match: 5,
          role_match: 5,
          defining_action_match: 5,
          turning_point_match: 5,
          linked_image_match: 4,
          object_association: 2,
          support: ['sealed vessel', 'threat after release', 'reseal'],
          structural_strength: 'high',
          selected: true,
        },
        {
          title: 'The Fisher King',
          tradition: 'Arthurian romance',
          narrative_specificity: 'cycle',
          sequence_match: 2,
          role_match: 2,
          defining_action_match: 2,
          turning_point_match: 3,
          linked_image_match: 2,
          object_association: 1,
          support: ['summary: barren land restored'],
          structural_strength: 'medium',
          selected: false,
          rejection_reason: 'weaker multi-stage sequence than specific_tale candidate',
          gate_failure: 'specific_tale_outranks_restoration_frame',
        },
      ],
    });

    expect(diag?.decisive_turning_point).toMatch(/feigned disbelief/);
    expect(diag?.archetype_candidates[0]?.carrier_kind).toBe('dream_ego_action');
    expect(diag?.mythic_candidates[0]?.narrative_specificity).toBe('specific_tale');
    expect(diag?.mythic_candidates[1]?.gate_failure).toBe('specific_tale_outranks_restoration_frame');
  });

  it('parity: same final echoes with debug off vs on (+ diagnostics only when on)', () => {
    const finalEchoes = {
      symbols: ['thread', 'labyrinth'],
      archetypes: [
        {
          canonical_label: 'Shadow',
          expression: 'the bound bull-like being at the centre',
          resonance: 'A neglected creature waits at the centre until care and release change its form.',
          evidence: ['bound bull-like being with the dreamer eyes'],
          confidence: 'high' as const,
        },
      ],
      amplifications: [
        {
          title: 'Ariadne and the Labyrinth',
          tradition: 'Greek mythology',
          resonance: 'A thread leads through a winding centre toward a bound creature.',
          divergence: 'Here the creature is fed rather than slain.',
          evidence: ['thread', 'labyrinth', 'bound being'],
          confidence: 'high' as const,
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
    const offData = offParsed.ok ? offParsed.data : {};

    const withDiagnostics = {
      ...finalEchoes,
      interpretive_diagnostics: {
        archetype_candidates: [{ label: 'Shadow', selected: true }],
        mythic_candidates: [{ title: 'Ariadne and the Labyrinth', selected: true }],
      },
    };
    const diag = parseInterpretiveEchoDiagnostics(withDiagnostics.interpretive_diagnostics);
    expect(diag).not.toBeNull();
    const onData = stripInterpretiveDiagnostics(withDiagnostics as Record<string, unknown>);

    expect(normalizeArchetypalEchoes(onData.archetypes)).toEqual(normalizeArchetypalEchoes(offData.archetypes));
    expect(normalizeAmplifications(onData.amplifications)).toEqual(normalizeAmplifications(offData.amplifications));
  });

  it('keeps lightweight mythic validator for bare figures and generic titles', () => {
    expect(
      validateMythicEcho({
        title: 'Persephone',
        tradition: 'Greek mythology',
        resonance: 'A descent appears somehow.',
        divergence: 'Different ending.',
        evidence: ['descent', 'return'],
        confidence: 'medium',
      })
    ).toEqual([]);
    expect(
      validateMythicEchoes([
        {
          title: 'a journey of transformation',
          tradition: 'World mythology',
          resonance: 'Something changes somehow in the night.',
          divergence: 'Not much else matches.',
          evidence: ['night', 'change'],
          confidence: 'high',
        },
      ]).accepted
    ).toHaveLength(0);
  });

  it('keeps hard-gate archetypes when evaluation is omitted; rejects explicit false signals', () => {
    const omitted = validateArchetypalEchoes([
      {
        canonical_label: 'Double',
        expression: 'the figure wearing my coat',
        resonance: 'Another self claims my place at the table and will not yield.',
        evidence: ['wears my coat', 'sits in my chair'],
        confidence: 'high',
      },
    ]);
    expect(omitted.accepted).toHaveLength(1);

    const doubleExplicitFalse = validateArchetypalEchoes(
      [
        {
          canonical_label: 'Double',
          expression: 'the figure with my eyes',
          resonance: 'A familiar face appears without taking my place.',
          evidence: ['shares my eyes'],
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
    expect(system).toMatch(/Do not include an evaluation bag in production output/);
    expect(system).not.toMatch(/"canonical_label": "Shadow"/);
    expect(system).not.toMatch(/Ariadne and the Labyrinth/);
  });
});
