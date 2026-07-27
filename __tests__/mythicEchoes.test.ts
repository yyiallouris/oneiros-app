import {
  formatAmplificationsForEssay,
  formatMythicEchoForDisplay,
  formatMythicEchoLine,
  isDisplayableMythicEcho,
  normalizeAmplifications,
} from '../src/ai/mythicEchoes';

describe('mythicEchoes', () => {
  it('normalizes legacy strings into resonance-only objects', () => {
    expect(normalizeAmplifications(['door as charged boundary', '  '])).toEqual([
      {
        title: '',
        tradition: '',
        resonance: 'door as charged boundary',
        divergence: '',
        evidence: [],
      },
    ]);
  });

  it('maps legacy dream_image/echo objects into title/evidence and caps at 1 when requested', () => {
    const items = normalizeAmplifications(
      [
        {
          dream_image: 'descending chambers',
          echo: 'katabasis',
          resonance: 'May faintly echo stories of descent.',
        },
        {
          dream_image: 'second',
          echo: 'extra',
          resonance: 'should drop',
        },
      ],
      1
    );
    expect(items).toHaveLength(1);
    expect(items[0]).toEqual({
      title: 'katabasis',
      tradition: '',
      resonance: 'May faintly echo stories of descent.',
      divergence: '',
      evidence: ['descending chambers'],
    });
  });

  it('keeps the named mythic parallel shape including confidence', () => {
    const items = normalizeAmplifications(
      [
        {
          title: 'Ariadne and the Labyrinth',
          tradition: 'Greek',
          resonance: 'The thread and labyrinth recall the Cretan cycle.',
          divergence: 'The creature is fed rather than defeated.',
          evidence: ['thread', 'labyrinth', 'bull-like being'],
          confidence: 'high',
        },
      ],
      1
    );
    expect(items[0].title).toBe('Ariadne and the Labyrinth');
    expect(items[0].tradition).toBe('Greek');
    expect(items[0].divergence).toContain('fed');
    expect(items[0].evidence).toHaveLength(3);
    expect(items[0].confidence).toBe('high');
  });

  it('maps legacy difference key to canonical divergence and reads confidence', () => {
    const items = normalizeAmplifications([
      {
        title: 'Inanna',
        tradition: 'Mesopotamian',
        resonance: 'Descent through gates without a secured return.',
        difference: 'No completed ascent is staged.',
        evidence: ['gates', 'descent', 'stripped adornment'],
        confidence: 'medium',
      },
    ]);
    expect(items[0].divergence).toBe('No completed ascent is staged.');
    expect(items[0].confidence).toBe('medium');
    expect(isDisplayableMythicEcho(items[0])).toBe(true);
    expect(isDisplayableMythicEcho({ ...items[0], confidence: 'high' })).toBe(true);
    expect(
      isDisplayableMythicEcho({
        title: 'legacy',
        tradition: '',
        resonance: 'old row',
        divergence: '',
        evidence: [],
      })
    ).toBe(true);
  });

  it('maps legacy echo_name into title', () => {
    const items = normalizeAmplifications([
      {
        echo_name: 'Katabasis through the labyrinth',
        resonance: 'A descent whose return stays unfinished.',
        evidence: ['well', 'labyrinth', 'open sea'],
      },
    ]);
    expect(items[0].title).toBe('Katabasis through the labyrinth');
  });

  it('resolves display fields from catalog_id when a raw row is missing title/tradition', () => {
    const items = normalizeAmplifications([
      {
        catalog_id: 'greek.cretan_labyrinth',
        resonance: 'A thread leads through a winding centre toward a bound creature.',
        divergence: 'Here the creature is fed rather than defeated.',
        evidence: ['thread', 'labyrinth', 'bound being'],
        confidence: 'high',
      },
    ]);

    expect(items[0]).toMatchObject({
      catalog_id: 'greek.cretan_labyrinth',
      title: 'Ariadne and the Cretan Labyrinth',
      tradition: 'Greek mythology',
      source_type: 'mythic_cycle',
      catalog_myth_version: expect.any(String),
    });
  });

  it('formats display cards as paragraphs and essay lines', () => {
    const echo = {
      title: 'Ariadne and the Labyrinth',
      tradition: 'Greek',
      resonance: 'The thread and labyrinth recall the Cretan cycle.',
      divergence: 'Here the creature is fed rather than defeated.',
      evidence: ['thread', 'labyrinth'],
      confidence: 'high' as const,
    };
    expect(formatMythicEchoForDisplay(echo)).toEqual({
      title: 'Ariadne and the Labyrinth',
      subtitle: 'Greek',
      body: 'The thread and labyrinth recall the Cretan cycle. Here the creature is fed rather than defeated.',
    });
    expect(formatMythicEchoLine(echo)).toContain('Ariadne and the Labyrinth');
    expect(formatAmplificationsForEssay([])).toBe('(none)');
    expect(formatAmplificationsForEssay([echo])).toContain('Greek');
  });
});
