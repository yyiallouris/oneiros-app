import {
  buildBoundedDreamExcerpt,
  buildMetadataFirstEssayContext,
  buildNarrativeFirstEssayContext,
  DREAM_EXCERPT_SHORTENED_MARKER,
  getDreamNarrativeExcerptLimit,
  getInterpretationExcerptLimit,
} from '../src/ai/reflectiveEssayContext';

const entry = {
  date: '2026-08-26',
  dreamNarrative: 'I crossed a blue bridge and heard a bell behind me.',
  affects: ['wonder'],
  symbols: ['blue bridge', 'bell'],
  symbolStances: ['blue bridge: crossing', 'bell: listening'],
  landscapes: ['riverbank'],
  relationalDynamics: ['following a distant sound'],
  interpretation: 'The bridge may hold a question of passage without resolving it.',
};

describe('reflective essay narrative-first context', () => {
  it('adapts raw narrative and interpretation budgets by surface and dream count', () => {
    expect(getDreamNarrativeExcerptLimit('recent', 5)).toBe(1600);
    expect(getDreamNarrativeExcerptLimit('period', 4)).toBe(1400);
    expect(getDreamNarrativeExcerptLimit('period', 5)).toBe(900);
    expect(getDreamNarrativeExcerptLimit('period', 11)).toBe(600);
    expect(getInterpretationExcerptLimit('recent')).toBe(250);
    expect(getInterpretationExcerptLimit('period')).toBe(300);
  });

  it('preserves the beginning and ending of a shortened narrative within the limit', () => {
    const source = `${'BEGIN '.repeat(120)}middle ${' END'.repeat(120)}`;
    const excerpt = buildBoundedDreamExcerpt(source, 300);

    expect(excerpt.length).toBeLessThanOrEqual(300);
    expect(excerpt).toContain(DREAM_EXCERPT_SHORTENED_MARKER);
    expect(excerpt).toMatch(/^BEGIN/);
    expect(excerpt).toMatch(/END$/);
  });

  it('leads with the dream narrative and excludes pre-interpreted synthesis fields', () => {
    const context = buildNarrativeFirstEssayContext([entry], 'recent');

    expect(context).toContain('Dream narrative excerpt: I crossed a blue bridge');
    expect(context).toContain('Affects: wonder');
    expect(context).toContain('Key symbols: blue bridge, bell');
    expect(context).toContain('Symbol stances: blue bridge: crossing; bell: listening');
    expect(context).toContain('Landscapes: riverbank');
    expect(context).toContain('Relational dynamics: following a distant sound');
    expect(context).toContain('Secondary interpretation note:');
    expect(context).not.toContain('Core Mode:');
    expect(context).not.toContain('Motifs:');
    expect(context).not.toContain('Thresholds:');
    expect(context).not.toContain('Central conflicts:');
    expect(context).not.toContain('Archetypal Echoes:');
    expect(context).not.toContain('Mythic Echoes:');
  });

  it('keeps the accepted Phase 1 production context metadata-first', () => {
    const context = buildMetadataFirstEssayContext([{
      date: entry.date,
      coreMode: 'relational',
      affects: entry.affects,
      symbols: entry.symbols,
      symbolStances: entry.symbolStances,
      landscapes: entry.landscapes,
      motifs: ['crossing'],
      relationalDynamics: entry.relationalDynamics,
      thresholds: ['near a crossing'],
      centralConflicts: ['crossing vs waiting'],
      archetypalEchoes: 'Guide',
      mythicEchoes: 'Ariadne — thread through uncertainty',
      interpretation: entry.interpretation,
    }], 'recent');

    expect(context).toContain('Core Mode: relational');
    expect(context).toContain('Motifs: crossing');
    expect(context).toContain('Thresholds: near a crossing');
    expect(context).toContain('Central conflicts: crossing vs waiting');
    expect(context).toContain('Archetypal Echoes: Guide');
    expect(context).toContain('Mythic Echoes: Ariadne');
    expect(context).not.toContain('Dream narrative excerpt:');
  });
});
