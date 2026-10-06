import {
  AI_REPORT_REASONS,
  buildAiReportMessage,
  sanitizeAiReportReference,
} from '../src/services/aiContentReport';

describe('AI content reporting', () => {
  it('keeps the required report categories available', () => {
    expect(AI_REPORT_REASONS).toEqual(expect.arrayContaining([
      'Offensive or hateful',
      'Unsafe or harmful',
      'Sexual content',
      'Misleading',
      'Other',
    ]));
  });

  it('builds a privacy-safe report from metadata without AI or dream content', () => {
    const payload = buildAiReportMessage(
      { surface: 'dream_reflection', referenceId: 'dream-1:assistant-2' },
      'Misleading',
      '',
    );

    expect(payload.subject).toBe('AI response report: Dream reflection');
    expect(payload.message).toContain('Reference: dream-1:assistant-2');
    expect(payload.message).toContain('Reason: Misleading');
    expect(payload.message).not.toContain('content');
  });

  it('sanitizes and bounds reference identifiers', () => {
    const reference = sanitizeAiReportReference(`id with spaces/and?${'x'.repeat(200)}`);
    expect(reference).toMatch(/^[a-zA-Z0-9._:-]+$/);
    expect(reference.length).toBeLessThanOrEqual(160);
  });
});
