import { formatInterpretationMarkdown } from '../src/utils/formatInterpretationMarkdown';

describe('formatInterpretationMarkdown', () => {
  it('keeps consecutive reflective questions as bullets', () => {
    const input = [
      '## Reflective Questions',
      '',
      '- Where does the body still feel the threshold?',
      '- What image wants another look before you leave?',
    ].join('\n');

    const formatted = formatInterpretationMarkdown(input);

    expect(formatted).toContain('Reflective Questions');
    expect(formatted).toContain('• Where does the body still feel the threshold?');
    expect(formatted).toContain('• What image wants another look before you leave?');
    expect(formatted).not.toMatch(/(^|\n)-\s+/);
  });

  it('does not drop later bullets after the first list item', () => {
    const formatted = formatInterpretationMarkdown('- one\n- two\n- three');
    expect(formatted).toBe('• one\n• two\n• three');
  });

  it('strips markdown markers without removing list bullets', () => {
    const formatted = formatInterpretationMarkdown('## Core Tension\n\n**Held breath.**\n\n- First?\n- Second?');
    expect(formatted).toContain('Core Tension');
    expect(formatted).toContain('Held breath.');
    expect(formatted).toContain('• First?');
    expect(formatted).toContain('• Second?');
  });

  it('keeps a single newline after section titles (no blank-line gap)', () => {
    const formatted = formatInterpretationMarkdown('## Core Shift\n\nBody paragraph here.');
    expect(formatted).toBe('Core Shift\nBody paragraph here.');
  });

  it('keeps Evidence lines as plain text without a bullet', () => {
    const formatted = formatInterpretationMarkdown('- Evidence: the locked door');
    expect(formatted).toBe('Evidence: the locked door');
  });
});
