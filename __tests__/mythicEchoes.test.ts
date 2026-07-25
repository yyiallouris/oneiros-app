import {
  formatAmplificationsForEssay,
  formatMythicEchoForDisplay,
  formatMythicEchoLine,
  normalizeAmplifications,
} from '../src/ai/mythicEchoes';

describe('mythicEchoes', () => {
  it('normalizes legacy strings into resonance-only objects', () => {
    expect(normalizeAmplifications(['door as charged boundary', '  '])).toEqual([
      {
        title: '',
        tradition: '',
        resonance: 'door as charged boundary',
        difference: '',
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
      difference: '',
      evidence: ['descending chambers'],
    });
  });

  it('keeps the named mythic parallel shape', () => {
    const items = normalizeAmplifications(
      [
        {
          title: 'Ariadne and the Labyrinth',
          tradition: 'Greek',
          resonance: 'The thread and labyrinth recall the Cretan cycle.',
          difference: 'The creature is fed rather than defeated.',
          evidence: ['thread', 'labyrinth', 'bull-like being'],
        },
      ],
      1
    );
    expect(items[0].title).toBe('Ariadne and the Labyrinth');
    expect(items[0].tradition).toBe('Greek');
    expect(items[0].difference).toContain('fed');
    expect(items[0].evidence).toHaveLength(3);
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

  it('formats display cards and essay lines', () => {
    const echo = {
      title: 'Ariadne and the Labyrinth',
      tradition: 'Greek',
      resonance: 'The thread and labyrinth recall the Cretan cycle.',
      difference: 'Here the creature is fed rather than defeated.',
      evidence: ['thread', 'labyrinth'],
    };
    expect(formatMythicEchoForDisplay(echo)).toEqual({
      title: 'Ariadne and the Labyrinth — Greek',
      body: 'The thread and labyrinth recall the Cretan cycle. Here the creature is fed rather than defeated.',
    });
    expect(formatMythicEchoLine(echo)).toContain('Ariadne and the Labyrinth');
    expect(formatAmplificationsForEssay([])).toBe('(none)');
    expect(formatAmplificationsForEssay([echo])).toContain('Greek');
  });
});
