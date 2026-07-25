import {
  canonicalArchetypeLabels,
  formatArchetypalEchoForDisplay,
  formatArchetypesForEssay,
  normalizeArchetypalEchoes,
} from '../src/ai/archetypalEchoes';

describe('archetypalEchoes', () => {
  it('normalizes legacy bare labels into canonical objects', () => {
    expect(normalizeArchetypalEchoes(['Child', 'Guide', 'Unknown'])).toEqual([
      { canonical_label: 'Divine Child', expression: '', resonance: '', evidence: [] },
      { canonical_label: 'Guide / Psychopomp', expression: '', resonance: '', evidence: [] },
    ]);
  });

  it('keeps dream-specific expression and caps at 2 for new extractions', () => {
    const items = normalizeArchetypalEchoes(
      [
        {
          canonical_label: 'Divine Child',
          expression: 'the child discovered beneath the snow',
          resonance: 'A vulnerable new life emerges from beneath a frozen surface.',
          evidence: ['the child beneath the snow', 'the ground begins to move'],
        },
        {
          canonical_label: 'Shadow',
          expression: 'extra',
          resonance: 'should drop when max is 1',
          evidence: [],
        },
      ],
      1
    );
    expect(items).toHaveLength(1);
    expect(items[0].expression).toBe('the child discovered beneath the snow');
    expect(items[0].evidence).toHaveLength(2);
  });

  it('maps legacy display_label into expression', () => {
    const items = normalizeArchetypalEchoes([
      {
        canonical_label: 'Child',
        display_label: 'The Guiding Child',
        resonance: 'A childlike figure carries orientation.',
        evidence: ['the girl directs the dreamer'],
      },
    ]);
    expect(items[0]).toMatchObject({
      canonical_label: 'Divine Child',
      expression: 'The Guiding Child',
    });
  });

  it('formats display cards with canonical title primary and expression secondary', () => {
    const echo = {
      canonical_label: 'Divine Child',
      expression: 'the child discovered beneath the snow',
      resonance: 'A vulnerable new life emerges from beneath a frozen surface.',
      evidence: ['the child beneath the snow'],
    };
    expect(formatArchetypalEchoForDisplay(echo)).toEqual({
      title: 'The Divine Child',
      body: 'Appears as the child discovered beneath the snow. A vulnerable new life emerges from beneath a frozen surface.',
    });
    expect(canonicalArchetypeLabels([echo])).toEqual(['Divine Child']);
    expect(formatArchetypesForEssay([echo])).toContain('The Divine Child');
    expect(formatArchetypesForEssay([echo])).toContain('the child discovered beneath the snow');
  });
});
