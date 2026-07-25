/**
 * Flow coverage: documentation/flows-06-jungian-ai-reflection.md
 * + docs/SYMBOLS_FLOW.md / architecture-interpretation.md
 *
 * Interpretive Echoes v3.6 — single-call Fabric + Archetypal + open-world Mythic Echo.
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

describe('Interpretive Echoes v3.6 single-call contract', () => {
  const system = buildDreamExtractionSystemPrompt();

  it('versions prompt_id v3.6 / prompt_version 3.6.3 / schema 4', () => {
    expect(DREAM_EXTRACTION_PROMPT_ID).toBe('dream-field-map-interpretive-v3.6');
    expect(DREAM_EXTRACTION_PROMPT_VERSION).toBe('3.6.3');
    expect(DREAM_EXTRACTION_SCHEMA_VERSION).toBe(4);
  });

  it('keeps rich Dream Fabric pedagogy unchanged (echo-only copy budgets)', () => {
    expect(system).toMatch(/poetic mirror, not a metadata report/);
    expect(system).toMatch(/AFFECTS \/ EMOTIONAL WEATHER/);
    expect(system).toMatch(/RELATIONSHIP FIELD \/ RELATIONAL DYNAMICS/);
    expect(system).toMatch(/THRESHOLDS/);
    expect(system).toMatch(/MOTIFS \/ DREAM MOTIFS/);
    expect(system).toMatch(/CENTRAL CONFLICTS \/ INNER TENSIONS/);
    expect(system).toMatch(/20–35 words/);
    expect(system).toMatch(/35–55 words/);
  });

  it('keeps closed archetype whitelist + concise hard gates', () => {
    expect(system).toMatch(/ARCHETYPAL ECHOES/);
    expect(system).toMatch(/Hard gates/);
    expect(system).toMatch(/Double: identity competition/);
    expect(system).toMatch(/Guide \/ Psychopomp: active guidance/);
    expect(system).toMatch(/Divine Child: the child actively transforms/);
    expect(system).toMatch(/Terrible Mother: engulfing/);
    expect(system).toMatch(/Ruler: embodied sovereign/);
    expect(ARCHETYPE_CATALOG.map((d) => d.canonicalLabel)).toEqual(
      expect.arrayContaining(['Divine Child', 'Guide / Psychopomp', 'Terrible Mother', 'Ruler', 'Double'])
    );
  });

  it('selects Mythic Echo open-world in the same call (0–1)', () => {
    expect(system).toMatch(/MYTHIC ECHO \(0–1\)/);
    expect(system).toMatch(/A false Mythic Echo is more harmful than no Mythic Echo/);
    expect(system).toMatch(/must not omit an unusually direct, high-confidence structural match/);
    expect(system).toMatch(/at least four concrete correspondences/);
    expect(system).toMatch(/related narrative sequence/);
    expect(system).toMatch(/defining action or prohibition/);
    expect(system).toMatch(/return the echo rather than defaulting to \[\]/);
    expect(system).toMatch(/Do not allow a mythic figure name alone/);
    expect(system).toMatch(/generic motifs or patterns/);
    expect(system).toMatch(/invented titles/);
    expect(system).not.toMatch(/mythic_signature/);
    expect(system).not.toMatch(/Named descent \/ underworld \/ labyrinth narratives remain valid/);
    expect(system).not.toMatch(/do not withhold them out of excessive caution/i);
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
    // Bare-figure reject examples may name figures; positive narrative answer-keys must not.
    expect(system).not.toMatch(/"title":\s*"Ariadne/);
    expect(system).not.toMatch(/"title":\s*"Inanna/);
  });

  it('keeps echo-only short copy budgets at generation time', () => {
    expect(system).toMatch(/20–35 words/);
    expect(system).toMatch(/35–55 words/);
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
    expect(off).toMatch(/a false Mythic Echo is more harmful than no Mythic Echo/i);
    expect(off).toMatch(/highly distinctive multi-stage structural match/i);
    expect(off).not.toMatch(/mythic_signature/i);
    expect(off).not.toMatch(/do not withhold/i);
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
          resonance: 'The thread and branching corridors recall the Cretan labyrinth.',
          divergence: 'Here the waiting figure is fed rather than defeated.',
          evidence: ['thread', 'labyrinth', 'waiting figure'],
          confidence: 'high' as const,
        },
      ],
      landscapes: ['underground labyrinth'],
      affects: ['tenderness'],
      motifs: ['descending to a bound creature'],
      relational_dynamics: ['care toward a neglected other'],
      thresholds: ['descent into the centre'],
      central_conflicts: ['neglect vs recognition'],
      core_mode: 'Core Shift',
      symbol_stances: [{ symbol: 'thread', stance: 'guiding through fear' }],
    };

    const withoutDebug = JSON.stringify(finalEchoes);
    const withDebug = JSON.stringify({
      ...finalEchoes,
      interpretive_diagnostics: {
        archetype_candidates: [
          {
            label: 'The Double',
            carrier: 'bull-like creature',
            support: ["shares the dreamer's eyes"],
            counterevidence: ['does not rival or replace the dreamer'],
            centrality: 3,
            selected: false,
            rejection_reason: 'Self-resemblance without double-function',
          },
        ],
        mythic_candidates: [
          {
            title: 'Ariadne and the Labyrinth',
            tradition: 'Greek mythology',
            support: ['thread', 'labyrinth'],
            selected: true,
          },
        ],
      },
    });

    const validatedOff = validateStructuredTaskContent('dream_extraction', withoutDebug, { provider: 'test' });
    const validatedOn = validateStructuredTaskContent('dream_extraction', withDebug, { provider: 'test' });
    expect(validatedOff.ok).toBe(true);
    expect(validatedOn.ok).toBe(true);
    if (!validatedOff.ok || !validatedOn.ok) return;

    const offData = validatedOff.data as Record<string, unknown>;
    const onData = validatedOn.data as Record<string, unknown>;
    expect(normalizeArchetypalEchoes(onData.archetypes)).toEqual(normalizeArchetypalEchoes(offData.archetypes));
    expect(normalizeAmplifications(onData.amplifications)).toEqual(normalizeAmplifications(offData.amplifications));
    expect(parseInterpretiveEchoDiagnostics(offData.interpretive_diagnostics)).toBeNull();
    expect(stripInterpretiveDiagnostics(onData)).not.toHaveProperty('interpretive_diagnostics');
  });

  it('lightweight mythic validator rejects generic titles and accepts named parallels', () => {
    expect(
      validateMythicEcho({
        title: 'Journey of Transformation motif',
        tradition: 'World mythology',
        resonance: 'A vague descent appears as change.',
        divergence: 'Not much else matches.',
        evidence: ['road', 'darkness'],
        confidence: 'medium',
      })
    ).toEqual([]);

    const ok = validateMythicEchoes(
      [
        {
          title: 'Ariadne and the Labyrinth',
          tradition: 'Greek mythology',
          resonance: 'The thread and corridors recall the Cretan labyrinth cycle.',
          divergence: 'Here the waiting figure is fed rather than defeated.',
          evidence: ['thread', 'labyrinth', 'waiting figure'],
          confidence: 'high',
        },
      ],
      { max: 1 }
    );
    expect(ok.accepted).toHaveLength(1);
  });

  it('keeps hard-gate archetypes when evaluation is omitted; rejects explicit false signals', () => {
    const guideWithoutEval = validateArchetypalEchoes([
      {
        canonical_label: 'Guide / Psychopomp',
        expression: 'the underworld guardian at the gates',
        resonance: 'A guardian regulates the descent through successive losses and return.',
        evidence: ['seven gates', 'guardian'],
        confidence: 'high',
      },
    ]);
    expect(guideWithoutEval.accepted).toHaveLength(1);

    const doubleExplicitFalse = validateArchetypalEchoes(
      [
        {
          canonical_label: 'Double',
          expression: 'the figure with my face',
          resonance: 'A familiar face appears without taking my place.',
          evidence: ['shares my face'],
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
