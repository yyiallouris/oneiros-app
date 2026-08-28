import { mkdtempSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import path from 'path';
import { loadReflectiveQuestionReadingCache } from '../scripts/lib/reflectiveQuestionReadingCache';

describe('Reflective-question benchmark reading cache', () => {
  const cases = [
    { id: 'a', content: 'A red door opens.', language: 'en' as const },
    { id: 'b', content: 'The sea rises into the room.', language: 'en' as const },
  ];

  function writeCache(trials: unknown[]): { cwd: string; configuredPath: string } {
    const cwd = mkdtempSync(path.join(tmpdir(), 'oneiros-reading-cache-'));
    const configuredPath = 'results.json';
    writeFileSync(
      path.join(cwd, configuredPath),
      JSON.stringify({
        benchmark_id: 'oneiros-test-benchmark',
        method_id: 'oneiros-reflective-question-v2.3.1',
        trials,
      })
    );
    return { cwd, configuredPath };
  }

  it('reuses only exact frozen-case readings', () => {
    const location = writeCache([
      { case_id: 'a', language: 'en', dream: cases[0].content, reading: ' The red door stays open and the dreamer waits with it. ' },
      { case_id: 'b', language: 'en', dream: cases[1].content, reading: 'The sea rises into the room while the dreamer remains there.' },
    ]);

    const cache = loadReflectiveQuestionReadingCache({ ...location, cases });

    expect(cache?.sourcePath).toBe('results.json');
    expect(cache?.benchmarkId).toBe('oneiros-test-benchmark');
    expect(cache?.readingsByCaseId.get('a')).toContain('red door');
    expect(cache?.sha256).toMatch(/^[a-f0-9]{64}$/);
  });

  it('fails closed on a confident cached-reading language mismatch', () => {
    const location = writeCache([
      { case_id: 'a', language: 'en', dream: cases[0].content, reading: 'La puerta estaba abierta pero nada cambiaba para mi.' },
      { case_id: 'b', language: 'en', dream: cases[1].content, reading: 'The sea rises into the room while the dreamer remains there.' },
    ]);
    expect(() => loadReflectiveQuestionReadingCache({ ...location, cases })).toThrow(
      'Reading cache output-language mismatch for frozen case: a'
    );
  });

  it('fails closed before paid calls when a cached dream has drifted', () => {
    const location = writeCache([
      { case_id: 'a', dream: 'A different dream.', reading: 'Reading A' },
      { case_id: 'b', dream: cases[1].content, reading: 'Reading B' },
    ]);

    expect(() =>
      loadReflectiveQuestionReadingCache({ ...location, cases })
    ).toThrow('Reading cache dream mismatch for frozen case: a');
  });

  it('fails closed on incomplete or duplicated cache artifacts', () => {
    const incomplete = writeCache([
      { case_id: 'a', dream: cases[0].content, reading: 'Reading A' },
    ]);
    expect(() =>
      loadReflectiveQuestionReadingCache({ ...incomplete, cases })
    ).toThrow('Reading cache is missing frozen case: b');

    const duplicated = writeCache([
      { case_id: 'a', dream: cases[0].content, reading: 'Reading A' },
      { case_id: 'a', dream: cases[0].content, reading: 'Reading A again' },
    ]);
    expect(() =>
      loadReflectiveQuestionReadingCache({ ...duplicated, cases })
    ).toThrow('Reading cache contains duplicate case id: a');
  });
});
