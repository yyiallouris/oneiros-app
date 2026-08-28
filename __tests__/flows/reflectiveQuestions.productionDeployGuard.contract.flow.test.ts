/**
 * Flow coverage: documentation/flows-06-jungian-ai-reflection.md
 * Locked contract: held Reflective Questions candidate identity + R&D isolation.
 */
import { existsSync, readFileSync } from 'fs';
import path from 'path';
import {
  ACTIVE_REFLECTIVE_QUESTION_RD_SHA256,
} from '../../src/ai/rd/reflective-questions/active';
import { REFLECTIVE_QUESTION_LANGUAGE_OPERATOR_CANDIDATE_B_SHA256 } from '../../src/ai/rd/reflective-questions/candidateB/reflectiveQuestionLanguageOperatorCandidateBExperiment';
import {
  DREAM_REFLECTION_EDITORIAL_ARC_BUNDLE,
} from '../../src/ai/dreamReflectionPrompt';
import {
  REFLECTIVE_QUESTION_COMPOSER_BUNDLE,
  REFLECTIVE_QUESTION_COMPOSER_METHOD_ID,
} from '../../src/ai/reflectiveQuestionComposer';
import { REFLECTION_EDITORIAL_ARC_METHOD_ID } from '../../src/ai/reflectionEditorialArc';
import {
  APPROVED_REFLECTIVE_QUESTION_PRODUCTION,
  DENIED_REFLECTIVE_QUESTION_PRODUCTION_CANDIDATES,
  FROZEN_REFLECTIVE_QUESTION_RESEARCH_BASE_SHA256,
  PENDING_REFLECTIVE_DIALOGUE_PRODUCTION_CANDIDATE,
  REVOKED_REFLECTIVE_QUESTION_PRODUCTION,
  RECOVERED_DEPLOYED_REFLECTIVE_QUESTION_METHOD_ID,
  RECOVERED_DEPLOYED_REFLECTIVE_QUESTION_PROMPT_SHA256,
  REFLECTIVE_QUESTION_RD_ROOT,
  REFLECTIVE_QUESTION_RUNTIME_FILES,
  assertReflectiveQuestionRuntimeHasNoRdImports,
  hashReflectiveQuestionPrompt,
} from '../../src/ai/reflectiveQuestionProductionHold';
import { ARCHIVED_REFLECTIVE_QUESTION_EXPERIMENT_ENV_FLAGS } from '../../src/ai/rd/reflective-questions/archivedFlags';

const repoRoot = path.resolve(__dirname, '../..');

function read(rel: string): string {
  return readFileSync(path.join(repoRoot, rel), 'utf8');
}

describe('reflective question production deploy guard contract', () => {
  it('keeps the hold and R&D tree out of client and gateway runtime imports', () => {
    for (const rel of REFLECTIVE_QUESTION_RUNTIME_FILES) {
      const source = read(rel);
      expect(() => assertReflectiveQuestionRuntimeHasNoRdImports(source, rel)).not.toThrow();
    }
  });

  it('pins the production orchestration identity while keeping failed predecessors denied', () => {
    expect(PENDING_REFLECTIVE_DIALOGUE_PRODUCTION_CANDIDATE.methodId).toBe(
      'oneiros-reflective-question-production-v1.0.0'
    );
    expect(APPROVED_REFLECTIVE_QUESTION_PRODUCTION).toEqual({
      methodId: 'oneiros-reflective-question-production-v1.0.0',
      promptSha256: 'fc8b6304fc2e8bc108242113299f7073cfbcc80d3f8df41cf747d218540d00ea',
    });
    expect(REVOKED_REFLECTIVE_QUESTION_PRODUCTION.methodId).toBe(
      'oneiros-reflective-question-v2.0.1'
    );
    expect(REVOKED_REFLECTIVE_QUESTION_PRODUCTION.promptSha256).toMatch(/^[a-f0-9]{64}$/);
    expect(hashReflectiveQuestionPrompt(DREAM_REFLECTION_EDITORIAL_ARC_BUNDLE)).toBe(
      '6cd304e1c246f237f21743232de32723e81656f9c8cb3c4f51ee49fe26249b49'
    );
    expect(DENIED_REFLECTIVE_QUESTION_PRODUCTION_CANDIDATES).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          methodId: REFLECTION_EDITORIAL_ARC_METHOD_ID,
          promptSha256: '6cd304e1c246f237f21743232de32723e81656f9c8cb3c4f51ee49fe26249b49',
        }),
        expect.objectContaining({
          methodId: 'oneiros-post-jungian-inviter-v2.0.1-candidate',
          promptSha256: '09045bf1860b2a2a6325e468cc19de019c351f0162cfa17c3f0a6153f3f3f35e',
        }),
        expect.objectContaining({
          methodId: 'oneiros-same-call-minimal-v1.2.0-candidate',
          promptSha256: '4506c8981c1e0f38edcb641bf89e59126bfdafe64a3adff99a94a2d1a12e81f7',
        }),
        expect.objectContaining({
          methodId: 'oneiros-question-integrity-gate-v1.0.0-candidate',
          promptSha256: 'c1d8090fec6149adf492d1319657ba02bf5ae28ddfa5ce28114ef8a0df6629b2',
        }),
        expect.objectContaining({
          methodId: 'oneiros-question-repair-v1.0.0-candidate',
          promptSha256: '0859fd5474124613b7c5cd610d4f48e65ccee6f0ea05b8d4ca382ddd5a53d53b',
        }),
      ])
    );
    expect(RECOVERED_DEPLOYED_REFLECTIVE_QUESTION_METHOD_ID).toBe(
      'reflective-question-psychological-aliveness-v1.4.0'
    );
    expect(RECOVERED_DEPLOYED_REFLECTIVE_QUESTION_PROMPT_SHA256).toBe(
      '4885e351ff6a20ceb8257c004aacd66e390e4c0902455a1cf5ff4d0df5a0238d'
    );
    expect(FROZEN_REFLECTIVE_QUESTION_RESEARCH_BASE_SHA256).toBe(
      '08cd3eaf6fd507d6eb19ba73714eecf6453ec8dd6a61f55068621c8ffd80f622'
    );
    expect(REFLECTIVE_QUESTION_LANGUAGE_OPERATOR_CANDIDATE_B_SHA256).toBe(
      FROZEN_REFLECTIVE_QUESTION_RESEARCH_BASE_SHA256
    );
    expect(ACTIVE_REFLECTIVE_QUESTION_RD_SHA256).toBe(
      '4506c8981c1e0f38edcb641bf89e59126bfdafe64a3adff99a94a2d1a12e81f7'
    );
  });

  it('keeps the canonical bundle as runtime source of truth and closed R&D isolated', () => {
    expect(existsSync(path.join(repoRoot, 'src/ai/reflectiveQuestionPrompt.ts'))).toBe(true);
    expect(existsSync(path.join(repoRoot, REFLECTIVE_QUESTION_RD_ROOT))).toBe(true);
    expect(
      existsSync(
        path.join(repoRoot, 'src/ai/rd/reflective-questions/archive/reflectiveQuestionPrompt.ts')
      )
    ).toBe(true);
    const prompt = read('src/ai/dreamReflectionPrompt.ts');
    const composer = read('src/ai/reflectiveQuestionComposer.ts');
    const editorialArc = read('src/ai/reflectionEditorialArc.ts');
    expect(prompt).toMatch(/oneiros-dream-reflection-v3\.1\.0-candidate/);
    expect(composer).toMatch(/oneiros-reflective-question-composer-v1\.1\.0-candidate/);
    expect(composer).toMatch(/living symbolic experience/);
    expect(editorialArc).toMatch(/Before writing the reading, decide whether this dream holds one honest opening/);
    expect(editorialArc).toMatch(/FOUR EPISTEMIC BOUNDARIES/);
    expect(editorialArc).toMatch(/question_evidence_ids/);
    expect(editorialArc).not.toMatch(/decision: 'accept' \| 'repair'/);
    expect(prompt).toMatch(/DREAM_REFLECTION_EDITORIAL_ARC_BUNDLE/);
    expect(prompt).toMatch(/REFLECTION_EDITORIAL_ARC_PROMPT/);
    expect(prompt).toMatch(/ONEIROS-EDITORIAL-ARC-V2/);
    expect(read('src/services/ai.ts')).not.toMatch(/from '\.\.\/ai\/reflectiveQuestionPrompt'/);
    expect(read('src/services/ai.ts')).not.toMatch(/from '\.\.\/ai\/rd\//);
    expect(read('supabase/functions/_shared/billing-ai.ts')).toMatch(
      /src\/ai\/reflectiveQuestionPipeline\.ts/
    );
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
    expect(guard).toMatch(/REFLECTIVE_QUESTION_PRODUCTION_BUNDLE/);
    expect(guard).toMatch(/assertReflectiveQuestionRuntimeHasNoRdImports/);
  });

  it('archives the mega-runner away from current R&D selection', () => {
    expect(existsSync(path.join(repoRoot, 'scripts/live/run-reflective-question-golden-set.ts'))).toBe(false);
    const runner = read(
      'scripts/live/archive/reflective-questions/run-reflective-question-golden-set.ts'
    );
    expect(runner).toMatch(/ARCHIVED historical multiplexer/);
    expect(runner).toMatch(/Do not add new experiment flags/);
    expect(runner).toMatch(/export const LEGACY_REFLECTIVE_QUESTION_RUNNER_STATUS = 'frozen'/);
    expect(ARCHIVED_REFLECTIVE_QUESTION_EXPERIMENT_ENV_FLAGS).toEqual(
      expect.arrayContaining([
        'REFLECTIVE_QUESTION_EXPERIMENT',
        'REFLECTIVE_QUESTION_LANGUAGE_OPERATOR_CANDIDATE_B',
      ])
    );
  });
});
