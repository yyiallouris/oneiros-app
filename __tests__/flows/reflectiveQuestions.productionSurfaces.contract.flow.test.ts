/**
 * Flow coverage: documentation/flows-06-jungian-ai-reflection.md
 * Locked contract: recovered v105 reflective-question method on Quick /
 * Standard / Advanced / Chat; essays stay 2.0.3-phase1 exactly one.
 */
import { existsSync, readFileSync } from 'fs';
import path from 'path';
import {
  APPROVED_REFLECTIVE_QUESTION_PRODUCTION,
  REFLECTIVE_QUESTION_RUNTIME_FILES,
  assertReflectiveQuestionRuntimeHasNoRdImports,
} from '../../src/ai/reflectiveQuestionProductionHold';

const repoRoot = path.resolve(__dirname, '../..');

function read(rel: string): string {
  return readFileSync(path.join(repoRoot, rel), 'utf8');
}

describe('reflective-question production surface contract', () => {
  const clientAi = read('src/services/ai.ts');
  const billingAi = read('supabase/functions/_shared/billing-ai.ts');
  const essayPrompt = read('src/ai/reflectiveEssayPrompt.ts');
  const method = read('src/ai/reflectiveQuestionPrompt.ts');

  it('keeps recovered v105 as the only git source of truth', () => {
    expect(method).toMatch(/reflective-question-psychological-aliveness-v1\.4\.0/);
    expect(APPROVED_REFLECTIVE_QUESTION_PRODUCTION.methodId).toBe(
      'reflective-question-psychological-aliveness-v1.4.0'
    );
    expect(APPROVED_REFLECTIVE_QUESTION_PRODUCTION.promptSha256).toBe(
      '4885e351ff6a20ceb8257c004aacd66e390e4c0902455a1cf5ff4d0df5a0238d'
    );
    expect(clientAi).toMatch(/from '\.\.\/ai\/reflectiveQuestionPrompt'/);
    expect(billingAi).toMatch(/from '\.\.\/\.\.\/\.\.\/src\/ai\/reflectiveQuestionPrompt\.ts'/);
    expect(clientAi).toMatch(/content: REFLECTIVE_QUESTION_METHOD_PROMPT/);
    expect(billingAi).toMatch(/content: REFLECTIVE_QUESTION_METHOD_PROMPT/);
  });

  it('wires Quick / Standard / Advanced / Chat to live v105 cardinality', () => {
    expect(clientAi).toMatch(
      /End with exactly one reflective question selected through the reflective-question method/
    );
    expect(billingAi).toMatch(
      /End with exactly one reflective question selected through the reflective-question method/
    );
    expect(clientAi).toMatch(/Output 1–2 questions, maximum 2/);
    expect(billingAi).toMatch(/Output 1–2 questions, maximum 2/);
    expect(clientAi).toMatch(/Default to one question/);
    expect(billingAi).toMatch(/Default to one question/);
    expect(clientAi).toMatch(/Do not follow a fixed somatic-first\/symbolic-second sequence/);
    expect(billingAi).toMatch(/Do not follow a fixed somatic-first\/symbolic-second sequence/);
    expect(clientAi).not.toMatch(/Exactly 2 questions/);
    expect(billingAi).not.toMatch(/Exactly 2 questions/);
    expect(clientAi).toMatch(
      /End with exactly ONE reflective question selected through the reflective-question method\. Never ask two questions in chat/
    );
    expect(billingAi).toMatch(
      /End with exactly ONE reflective question selected through the reflective-question method\. Never ask two questions in chat/
    );
    expect(clientAi).toMatch(
      /Conclude the reflection without inviting further questions/
    );
    expect(billingAi).toMatch(/Conclude without inviting another question/);
  });

  it('keeps essays on QA-approved 2.0.3-phase1 exactly one and does not inject the method', () => {
    expect(essayPrompt).toMatch(/PERIOD_REFLECTION_PROMPT_VERSION = '2\.0\.3-phase1'/);
    expect(essayPrompt).toMatch(/RECENT_DREAM_FIELD_PROMPT_VERSION = '2\.0\.3-phase1'/);
    expect(essayPrompt).toMatch(
      /Output exactly one reflective question selected through the canonical reflective-question method adapted to a multi-dream field/
    );
    expect(essayPrompt).toMatch(/One strong question is complete/);
    expect(essayPrompt).toMatch(/Preserve the chosen field topology in the question/);
    expect(essayPrompt).not.toMatch(/Output 1–2 questions, maximum 2/);
    expect(essayPrompt).not.toMatch(/from '\.\/reflectiveQuestionPrompt'/);
    expect(billingAi).toMatch(
      /role: 'system' as const,\s*content: RECENT_DREAM_FIELD_SYSTEM_PROMPT,\s*\},\s*\{\s*role: 'user' as const,/
    );
    expect(billingAi).toMatch(
      /content: buildPeriodReflectionSystemPrompt\(scope\.kind, entries\.length\),\s*\},\s*\{\s*role: 'user' as const,/
    );
    expect(clientAi).toMatch(
      /content: buildPeriodReflectionSystemPrompt\(period, dreamAnalyses\.length\) \},\s*\{\s*role: 'user', content: userPrompt/
    );
    expect(clientAi).toMatch(
      /content: RECENT_DREAM_FIELD_SYSTEM_PROMPT \},\s*\{\s*role: 'user', content: userPrompt/
    );
  });

  it('keeps Candidate B / R&D out of runtime and fail-closes gateway deploy', () => {
    for (const rel of REFLECTIVE_QUESTION_RUNTIME_FILES) {
      expect(() =>
        assertReflectiveQuestionRuntimeHasNoRdImports(read(rel), rel)
      ).not.toThrow();
    }
    expect(existsSync(path.join(repoRoot, 'src/ai/rd/reflective-questions'))).toBe(
      true
    );
    expect(clientAi).not.toMatch(/candidate-b|Candidate B|08cd3eaf/);
    expect(billingAi).not.toMatch(/candidate-b|Candidate B|08cd3eaf/);
    expect(clientAi).not.toMatch(/from ['"].*\/rd\//);
    expect(billingAi).not.toMatch(/from ['"].*\/rd\//);

    const pkg = JSON.parse(read('package.json')) as { scripts: Record<string, string> };
    const gatewayReadme = read('supabase/functions/ai-entitlements-gateway/README.md');
    expect(pkg.scripts['guard:ai-entitlements-gateway-deploy']).toContain(
      'scripts/guards/assert-reflective-question-gateway-deploy.ts'
    );
    expect(pkg.scripts['deploy:ai-entitlements-gateway']).toContain(
      'guard:ai-entitlements-gateway-deploy'
    );
    expect(pkg.scripts['review:reflective-questions-active']).toContain(
      'scripts/live/rd/reflective-questions/run-active-candidate.ts'
    );
    expect(gatewayReadme).toMatch(/npm run deploy:ai-entitlements-gateway/);
  });
});
