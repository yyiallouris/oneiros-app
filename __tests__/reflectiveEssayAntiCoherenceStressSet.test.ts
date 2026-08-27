import { readFileSync } from 'fs';
import path from 'path';

const repoRoot = path.resolve(__dirname, '..');

describe('reflective essay anti-coherence stress set', () => {
  it('covers all five PO-requested failure shapes for the narrow prompt calibration', () => {
    const fixture = JSON.parse(
      readFileSync(
        path.join(
          repoRoot,
          'testing/live-scenarios/reflective-essays-anti-coherence-stress-set.v1.json'
        ),
        'utf8'
      )
    ) as {
      version: string;
      cases: Array<{
        id: string;
        anti_coherence_expectation?: string;
        entries: Array<{ dream_narrative?: string }>;
      }>;
    };

    expect(fixture.version).toBe('anti-coherence-1.0.0');
    expect(fixture.cases.map((testCase) => testCase.id)).toEqual([
      'recent-truly-unrelated-en',
      'period-contradictory-affects-no-motif-el',
      'recent-same-symbol-opposed-stances-en',
      'recent-mixed-numinous-banal-distressing-el',
      'period-two-parallel-clusters-six-dreams-en',
    ]);
    expect(fixture.cases.every((testCase) => Boolean(testCase.anti_coherence_expectation))).toBe(true);
    expect(
      fixture.cases.every((testCase) =>
        testCase.entries.every((entry) => Boolean(entry.dream_narrative?.trim()))
      )
    ).toBe(true);
    expect(fixture.cases.at(-1)?.entries).toHaveLength(6);
  });

  it('scores coherence restraint as maturity rather than synthesis volume', () => {
    const runner = readFileSync(
      path.join(repoRoot, 'scripts/live/run-reflective-essay-phase1-regression.ts'),
      'utf8'
    );

    expect(runner).toMatch(/coherence_restraint/);
    expect(runner).toMatch(/Explicitly naming insufficient density or multiple weak relations is a mature success/);
    expect(runner).toMatch(/topology_consistency/);
    expect(runner).toMatch(/evaluate the essay as a whole/);
    expect(runner).toMatch(/An explicit disclaimer does not compensate for contradictory synthesis/);
    expect(runner).toMatch(/anti_coherence_verdict cannot be "pass"/);
    expect(runner).toMatch(/Do not reward an opening disclaimer/);
    expect(runner).toMatch(/anti_coherence_verdict evaluates V2 PHASE 1 only/);
    expect(runner).toMatch(/Never use V1's failure to set this verdict/);
    expect(runner).toMatch(/v2_topology_preserved/);
    expect(runner).toMatch(/anti_coherence_verdict/);
    expect(runner).toMatch(/REFLECTIVE_ESSAY_FIXTURE/);
    expect(runner).toMatch(/REFLECTIVE_ESSAY_CONTEXT_EXPERIMENT/);
    expect(runner).toMatch(/phase1-context-v1/);
    expect(runner).toMatch(/phase2-context-v2/);
    expect(runner).toMatch(/buildNarrativeFirstEssayContext/);
    expect(runner).toMatch(/same frozen 2\.0\.3 prompt/);
  });
});
