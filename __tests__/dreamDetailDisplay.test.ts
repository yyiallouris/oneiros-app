import { buildDreamDetailDisplayModel } from '../src/services/dreamDetailDisplay';
import type { Dream, Interpretation } from '../src/types/dream';

const dream: Dream = {
  id: 'dream-1',
  date: '2026-05-11',
  title: 'Old tags dream',
  content: 'I stood outside a locked house while someone watched.',
  symbols: ['stale house', 'old sea'],
  archetypes: ['Shadow'],
  createdAt: 't',
  updatedAt: 't',
};

const baseInterpretation: Interpretation = {
  id: 'interp-1',
  dreamId: dream.id,
  messages: [{ id: 'm1', role: 'assistant', content: 'Reflection', timestamp: 't' }],
  symbols: ['locked house', 'watching figure'],
  archetypes: [
    {
      canonical_label: 'Shadow',
      expression: 'the watching figure outside the locked house',
      resonance: 'An unseen presence holds the edge between approach and entry.',
      evidence: ['someone watches from outside'],
    },
  ],
  createdAt: 't',
  updatedAt: 't',
};

describe('dream detail display model', () => {
  it('uses display distillation first and caps visible anchors', () => {
    const model = buildDreamDetailDisplayModel(dream, {
      ...baseInterpretation,
      display_distillation: {
        essence_title: 'Guarded threshold',
        essence_line: 'The dream circles contact while protecting something vulnerable.',
        dominant_lens: 'threshold',
        visible_anchors: [
          { label: 'closed door', type: 'threshold', salience: 5, ui_meaning: 'protected entry' },
          { label: 'watching figure', type: 'relationship', salience: 4, ui_meaning: 'felt exposure' },
          { label: 'silent street', type: 'image', salience: 3, ui_meaning: 'empty approach' },
          { label: 'hesitation', type: 'feeling', salience: 3, ui_meaning: 'held back' },
          { label: 'locked house', type: 'image', salience: 2, ui_meaning: 'sealed interior' },
          { label: 'extra', type: 'image', salience: 1, ui_meaning: 'not shown' },
        ],
        main_tension: 'contact vs protection',
        dream_movement: 'approaching',
        movement_line: 'Something approaches without crossing.',
      },
    });

    expect(model.essenceTitle).toBe('Guarded threshold');
    expect(model.anchors.map((a) => a.label)).toEqual([
      'Closed door',
      'Watching figure',
      'Silent street',
      'Hesitation',
      'Locked house',
    ]);
    expect(model.mainTension).toBe('contact vs protection');
    expect(model.movementLine).toBe('Something approaches without crossing.');
  });

  it('falls back to latest interpretation metadata before stale dream tags', () => {
    const model = buildDreamDetailDisplayModel(dream, {
      ...baseInterpretation,
      symbol_stances: [
        { symbol: 'locked house', stance: 'sealed but inviting' },
        { symbol: 'watching figure', stance: 'exposing' },
      ],
      central_conflicts: ['closed door vs wanting entry'],
      thresholds: ['outside the house'],
      affects: ['apprehension'],
    });

    expect(model.anchors.map((a) => a.label)).toEqual([
      'Locked house',
      'Watching figure',
      'Closed door vs wanting entry',
      'Outside the house',
      'Apprehension',
    ]);
    expect(model.anchors.some((a) => a.label === 'Stale house')).toBe(false);
    expect(model.mainTension).toBe('closed door vs wanting entry');
    expect(model.movementLine).toBe('outside the house');
  });

  it('does not crash when display_distillation exists without visible_anchors', () => {
    const model = buildDreamDetailDisplayModel(dream, {
      ...baseInterpretation,
      display_distillation: {
        essence_title: 'Partial distillation',
        essence_line: 'Only essence fields came back from extraction.',
        dominant_lens: 'threshold',
        // Simulate gateway/AI partial payload
        visible_anchors: undefined as unknown as [],
        main_tension: 'safety vs contact',
        dream_movement: 'approaching',
        movement_line: 'Approaching without crossing.',
      },
      symbols: ['locked house', 'watching figure'],
      central_conflicts: ['safety vs contact'],
      thresholds: ['doorway'],
      affects: ['unease'],
    });

    expect(model.essenceTitle).toBe('Partial distillation');
    expect(model.mainTension).toBe('safety vs contact');
    expect(model.anchors.map((a) => a.label)).toEqual([
      'Safety vs contact',
      'Doorway',
      'Unease',
    ]);
  });

  it('falls back to metadata when visible_anchors is an empty array', () => {
    const model = buildDreamDetailDisplayModel(dream, {
      ...baseInterpretation,
      display_distillation: {
        essence_title: 'Empty anchors',
        essence_line: 'Essence only',
        dominant_lens: 'unclear',
        visible_anchors: [],
        main_tension: null,
        dream_movement: 'unclear',
        movement_line: null,
      },
      symbols: ['locked house'],
      affects: ['apprehension'],
    });

    expect(model.essenceTitle).toBe('Empty anchors');
    expect(model.anchors.map((a) => a.label)).toEqual(['Apprehension', 'Locked house']);
  });

  it('dedupes anchors and uses dream symbols only as a final fallback', () => {
    const model = buildDreamDetailDisplayModel(dream, {
      ...baseInterpretation,
      symbols: [],
      symbol_stances: [{ symbol: 'locked house', stance: 'blocked' }],
      central_conflicts: ['locked house'],
    });

    expect(model.anchors.map((a) => a.label)).toEqual(['Locked house', 'Stale house', 'Old sea']);
    expect(model.anchors).toHaveLength(3);
  });

  it('surfaces rich Archetypal and at most one Mythic Echo under interpretive layers', () => {
    const model = buildDreamDetailDisplayModel(dream, {
      ...baseInterpretation,
      amplifications: [
        {
          title: 'Ariadne and the Labyrinth',
          tradition: 'Greek',
          resonance: 'The thread and corridors recall the Cretan labyrinth cycle.',
          divergence: 'Here the waiting figure is fed rather than defeated.',
          evidence: ['descending chambers', 'thread-like guidance'],
          confidence: 'high',
        },
        {
          title: 'extra',
          tradition: 'Greek',
          resonance: 'should not appear',
          divergence: 'n/a',
          evidence: ['a', 'b'],
          confidence: 'high',
        },
      ],
    });

    expect(model.symbolicLayers.archetypalEchoes).toEqual([
      {
        title: 'Shadow',
        body: 'An unseen presence holds the edge between approach and entry.',
      },
    ]);
    expect(model.symbolicLayers.mythicEchoes).toEqual([
      {
        title: 'Ariadne and the Labyrinth',
        subtitle: 'Greek',
        body: 'The thread and corridors recall the Cretan labyrinth cycle. Here the waiting figure is fed rather than defeated.',
      },
    ]);
  });

  it('shows medium-confidence Mythic Echoes and legacy rows without confidence', () => {
    const mediumShown = buildDreamDetailDisplayModel(dream, {
      ...baseInterpretation,
      amplifications: [
        {
          title: 'Persephone',
          tradition: 'Greek mythology',
          resonance: 'May faintly recall the seasonal cycle under snow.',
          divergence: 'No completed return is staged.',
          evidence: ['snow', 'bride', 'buried life'],
          confidence: 'medium',
        },
      ],
    });
    expect(mediumShown.symbolicLayers.mythicEchoes).toEqual([
      {
        title: 'Persephone',
        subtitle: 'Greek mythology',
        body: 'May faintly recall the seasonal cycle under snow. No completed return is staged.',
      },
    ]);

    const legacyShown = buildDreamDetailDisplayModel(dream, {
      ...baseInterpretation,
      amplifications: [
        {
          title: 'Ariadne and the Labyrinth',
          tradition: 'Greek',
          resonance: 'The thread and corridors recall the Cretan labyrinth cycle.',
          divergence: 'Here the waiting figure is fed rather than defeated.',
          evidence: ['descending chambers', 'thread-like guidance'],
        },
      ],
    });
    expect(legacyShown.symbolicLayers.mythicEchoes).toHaveLength(1);
  });
});
