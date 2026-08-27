/**
 * Flow coverage: documentation/flows-06-jungian-ai-reflection.md
 * Locked contract: reflective-question production deploy hold.
 */
import { existsSync, readFileSync } from 'fs';
import path from 'path';

const repoRoot = path.resolve(__dirname, '../..');

function read(rel: string): string {
  return readFileSync(path.join(repoRoot, rel), 'utf8');
}

describe('reflective question production deploy guard contract', () => {
  it('keeps the hold and recovered snapshot out of client and gateway runtime imports', () => {
    const clientAi = read('src/services/ai.ts');
    const billingAi = read('supabase/functions/_shared/billing-ai.ts');
    const gateway = read('supabase/functions/ai-entitlements-gateway/index.ts');

    expect(clientAi).not.toMatch(/reflectiveQuestionProductionHold/);
    expect(billingAi).not.toMatch(/reflectiveQuestionProductionHold/);
    expect(gateway).not.toMatch(/reflectiveQuestionProductionHold/);
    expect(clientAi).not.toMatch(/RECOVERED_DEPLOYED_REFLECTIVE_QUESTION_PROMPT/);
    expect(billingAi).not.toMatch(/RECOVERED_DEPLOYED_REFLECTIVE_QUESTION_PROMPT/);
  });

  it('treats the current local bundled method as the denied Oneiros Reader candidate when present', () => {
    const promptPath = path.join(repoRoot, 'src/ai/reflectiveQuestionPrompt.ts');
    if (!existsSync(promptPath)) {
      return;
    }
    const promptSource = readFileSync(promptPath, 'utf8');
    expect(promptSource).toMatch(
      /reflective-question-oneiros-reader-v1\.4\.0/
    );
    expect(promptSource).not.toMatch(
      /reflective-question-psychological-aliveness-v1\.4\.0/
    );
  });

  it('documents the fail-closed gateway deploy wrapper', () => {
    const pkg = JSON.parse(read('package.json')) as { scripts: Record<string, string> };
    const gatewayReadme = read('supabase/functions/ai-entitlements-gateway/README.md');
    const guard = read('scripts/guards/assert-reflective-question-gateway-deploy.ts');

    expect(pkg.scripts['guard:ai-entitlements-gateway-deploy']).toContain(
      'scripts/guards/assert-reflective-question-gateway-deploy.ts'
    );
    expect(pkg.scripts['deploy:ai-entitlements-gateway']).toContain(
      'guard:ai-entitlements-gateway-deploy'
    );
    expect(pkg.scripts['deploy:ai-entitlements-gateway']).toContain(
      'supabase functions deploy ai-entitlements-gateway'
    );
    expect(gatewayReadme).toMatch(/npm run deploy:ai-entitlements-gateway/);
    expect(gatewayReadme).toMatch(/guard:ai-entitlements-gateway-deploy/);
    expect(guard).toMatch(/assertReflectiveQuestionGatewayDeployAllowed/);
  });

  it('freezes the mega-runner as legacy historical R&D without new flags when the runner is present', () => {
    const runnerPath = path.join(
      repoRoot,
      'scripts/live/run-reflective-question-golden-set.ts'
    );
    if (!existsSync(runnerPath)) {
      return;
    }
    const runner = readFileSync(runnerPath, 'utf8');
    expect(runner).toMatch(/LEGACY \/ FROZEN reflective-question live runner/);
    expect(runner).toMatch(/Do not add new experiment flags/);
    expect(runner).toMatch(
      /export const LEGACY_REFLECTIVE_QUESTION_RUNNER_STATUS = 'frozen'/
    );
    const flags = [
      ...runner.matchAll(/'REFLECTIVE_QUESTION_[A-Z0-9_]+'/g),
    ].map((match) => match[0].slice(1, -1));
    const uniqueFlags = [...new Set(flags)];
    expect(uniqueFlags).toEqual([
      'REFLECTIVE_QUESTION_EXPERIMENT',
      'REFLECTIVE_QUESTION_WITNESSED_OPENING',
      'REFLECTIVE_QUESTION_SURGICAL_ATTENTION',
      'REFLECTIVE_QUESTION_RELATION_ELIGIBILITY_ABLATION',
      'REFLECTIVE_QUESTION_SELECTION_LANGUAGE_DECOUPLING',
      'REFLECTIVE_QUESTION_FREEZE_VALIDATION',
      'REFLECTIVE_QUESTION_LANGUAGE_OPERATOR',
      'REFLECTIVE_QUESTION_DEVELOPMENT_STRESS',
      'REFLECTIVE_QUESTION_LANGUAGE_OPERATOR_CANDIDATE_B',
      'REFLECTIVE_QUESTION_LIVE_BENCHMARK',
      'REFLECTIVE_QUESTION_GOLDEN_REPEATS',
      'REFLECTIVE_QUESTION_BENCHMARK_REPEATS',
      'REFLECTIVE_QUESTION_BENCHMARK_CONCURRENCY',
    ]);
  });
});
