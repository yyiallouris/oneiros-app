/**
 * Flow coverage: documentation/flows-06-jungian-ai-reflection.md
 * Locked contract: reflective-question production deploy hold + R&D isolation.
 */
import { existsSync, readdirSync, readFileSync } from 'fs';
import path from 'path';
import {
  ACTIVE_REFLECTIVE_QUESTION_RD_SHA256,
  REFLECTIVE_QUESTION_LANGUAGE_OPERATOR_CANDIDATE_B_SHA256,
} from '../../src/ai/rd/reflective-questions/active';
import {
  APPROVED_REFLECTIVE_QUESTION_PRODUCTION,
  FROZEN_REFLECTIVE_QUESTION_RESEARCH_BASE_SHA256,
  REFLECTIVE_QUESTION_RD_ROOT,
  REFLECTIVE_QUESTION_RUNTIME_FILES,
  assertReflectiveQuestionRuntimeHasNoRdImports,
} from '../../src/ai/reflectiveQuestionProductionHold';
import { ARCHIVED_REFLECTIVE_QUESTION_EXPERIMENT_ENV_FLAGS } from '../../src/ai/rd/reflective-questions/archivedFlags';

const repoRoot = path.resolve(__dirname, '../..');

function read(rel: string): string {
  return readFileSync(path.join(repoRoot, rel), 'utf8');
}

describe('reflective question production deploy guard contract', () => {
  it('keeps the hold, Candidate B, and R&D tree out of client and gateway runtime imports', () => {
    for (const rel of REFLECTIVE_QUESTION_RUNTIME_FILES) {
      const source = read(rel);
      expect(() =>
        assertReflectiveQuestionRuntimeHasNoRdImports(source, rel)
      ).not.toThrow();
    }
  });

  it('protects recovered production and frozen Candidate B SHAs', () => {
    expect(APPROVED_REFLECTIVE_QUESTION_PRODUCTION.methodId).toBe(
      'reflective-question-psychological-aliveness-v1.4.0'
    );
    expect(APPROVED_REFLECTIVE_QUESTION_PRODUCTION.promptSha256).toBe(
      '4885e351ff6a20ceb8257c004aacd66e390e4c0902455a1cf5ff4d0df5a0238d'
    );
    expect(FROZEN_REFLECTIVE_QUESTION_RESEARCH_BASE_SHA256).toBe(
      '08cd3eaf6fd507d6eb19ba73714eecf6453ec8dd6a61f55068621c8ffd80f622'
    );
    expect(REFLECTIVE_QUESTION_LANGUAGE_OPERATOR_CANDIDATE_B_SHA256).toBe(
      FROZEN_REFLECTIVE_QUESTION_RESEARCH_BASE_SHA256
    );
    expect(ACTIVE_REFLECTIVE_QUESTION_RD_SHA256).toBe(
      FROZEN_REFLECTIVE_QUESTION_RESEARCH_BASE_SHA256
    );
  });

  it('does not keep a runtime-looking prompt module in src/ai/', () => {
    expect(existsSync(path.join(repoRoot, 'src/ai/reflectiveQuestionPrompt.ts'))).toBe(
      false
    );
    const aiFiles = readdirSync(path.join(repoRoot, 'src/ai'));
    expect(aiFiles.filter((name) => name.startsWith('reflectiveQuestion'))).toEqual([
      'reflectiveQuestionProductionHold.ts',
    ]);
    expect(existsSync(path.join(repoRoot, REFLECTIVE_QUESTION_RD_ROOT))).toBe(true);
    expect(
      existsSync(
        path.join(
          repoRoot,
          'src/ai/rd/reflective-questions/archive/reflectiveQuestionPrompt.ts'
        )
      )
    ).toBe(true);
  });

  it('documents the fail-closed gateway deploy wrapper and active R&D runner', () => {
    const pkg = JSON.parse(read('package.json')) as { scripts: Record<string, string> };
    const gatewayReadme = read('supabase/functions/ai-entitlements-gateway/README.md');
    const guard = read('scripts/guards/assert-reflective-question-gateway-deploy.ts');

    expect(pkg.scripts['guard:ai-entitlements-gateway-deploy']).toContain(
      'scripts/guards/assert-reflective-question-gateway-deploy.ts'
    );
    expect(pkg.scripts['deploy:ai-entitlements-gateway']).toContain(
      'guard:ai-entitlements-gateway-deploy'
    );
    expect(pkg.scripts['review:reflective-questions-active']).toContain(
      'scripts/live/rd/reflective-questions/run-active-candidate.ts'
    );
    const closedScripts = Object.keys(pkg.scripts).filter(
      (name) =>
        name.startsWith('review:reflective-questions-') &&
        name !== 'review:reflective-questions-active'
    );
    expect(closedScripts).toEqual([]);
    expect(pkg.scripts['review:reflective-questions']).toBeUndefined();
    expect(gatewayReadme).toMatch(/npm run deploy:ai-entitlements-gateway/);
    expect(guard).toMatch(/assertReflectiveQuestionRuntimeHasNoRdImports/);
  });

  it('archives the mega-runner away from current R&D selection', () => {
    expect(
      existsSync(
        path.join(repoRoot, 'scripts/live/run-reflective-question-golden-set.ts')
      )
    ).toBe(false);
    const runner = read(
      'scripts/live/archive/reflective-questions/run-reflective-question-golden-set.ts'
    );
    expect(runner).toMatch(/ARCHIVED historical multiplexer/);
    expect(runner).toMatch(/Do not add new experiment flags/);
    expect(runner).toMatch(
      /export const LEGACY_REFLECTIVE_QUESTION_RUNNER_STATUS = 'frozen'/
    );
    expect(ARCHIVED_REFLECTIVE_QUESTION_EXPERIMENT_ENV_FLAGS).toEqual(
      expect.arrayContaining([
        'REFLECTIVE_QUESTION_EXPERIMENT',
        'REFLECTIVE_QUESTION_LANGUAGE_OPERATOR_CANDIDATE_B',
      ])
    );
  });
});
