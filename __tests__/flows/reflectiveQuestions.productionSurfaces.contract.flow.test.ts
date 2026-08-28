/**
 * Flow coverage: documentation/flows-06-jungian-ai-reflection.md
 * Locked contract: launch same-call reflective questions. No second question inference.
 */
import { existsSync, readFileSync } from 'fs';
import path from 'path';
import {
  buildInitialReflectionRequest,
  buildChatFollowupRequest,
  DREAM_REFLECTION_PROMPT_ID,
  FOLLOWUP_CHAT_PROMPT_ID,
  SAME_CALL_REFLECTIVE_QUESTIONS_METHOD_ID,
} from '../../src/ai/dreamReflectionPrompt';
import {
  APPROVED_REFLECTIVE_QUESTION_PRODUCTION,
  PENDING_REFLECTIVE_DIALOGUE_PRODUCTION_CANDIDATE,
  REVOKED_REFLECTIVE_QUESTION_PRODUCTION,
  SAME_CALL_REFLECTIVE_QUESTIONS_BUNDLE_SHA256,
  REFLECTIVE_QUESTION_RUNTIME_FILES,
  assertReflectiveQuestionRuntimeHasNoRdImports,
  hashReflectiveQuestionPrompt,
} from '../../src/ai/reflectiveQuestionProductionHold';
import { SAME_CALL_REFLECTIVE_QUESTIONS_BUNDLE } from '../../src/ai/dreamReflectionPrompt';

const repoRoot = path.resolve(__dirname, '../..');

function read(rel: string): string {
  return readFileSync(path.join(repoRoot, rel), 'utf8');
}

const dream = {
  title: 'The open gate',
  date: '2026-08-27',
  content: 'I stand beside an open gate. A fox crosses, and I remain at the threshold.',
};

describe('reflective-question production surface contract', () => {
  const clientAi = read('src/services/ai.ts');
  const billingAi = read('supabase/functions/_shared/billing-ai.ts');
  const gateway = read('supabase/functions/ai-entitlements-gateway/index.ts');
  const dreamDetail = read('src/screens/DreamDetailScreen.tsx');
  const chatScreen = read('src/screens/InterpretationChatScreen.tsx');
  const essayPrompt = read('src/ai/reflectiveEssayPrompt.ts');

  it('uses one Reader call that also writes the questions', () => {
    expect(DREAM_REFLECTION_PROMPT_ID).toBe('oneiros-dream-reflection-v3.2.0');
    expect(FOLLOWUP_CHAT_PROMPT_ID).toBe('oneiros-followup-chat-v2.0.0');
    expect(SAME_CALL_REFLECTIVE_QUESTIONS_METHOD_ID).toBe(
      'oneiros-same-call-reflective-questions-v1.0.0'
    );
    expect(PENDING_REFLECTIVE_DIALOGUE_PRODUCTION_CANDIDATE.methodId).toBe(
      SAME_CALL_REFLECTIVE_QUESTIONS_METHOD_ID
    );
    expect(APPROVED_REFLECTIVE_QUESTION_PRODUCTION).toEqual({
      methodId: 'oneiros-same-call-reflective-questions-v1.0.0',
      promptSha256: SAME_CALL_REFLECTIVE_QUESTIONS_BUNDLE_SHA256,
    });
    expect(hashReflectiveQuestionPrompt(SAME_CALL_REFLECTIVE_QUESTIONS_BUNDLE)).toBe(
      SAME_CALL_REFLECTIVE_QUESTIONS_BUNDLE_SHA256
    );
    expect(REVOKED_REFLECTIVE_QUESTION_PRODUCTION.methodId).toBe(
      'oneiros-reflective-question-v2.0.1'
    );
    expect(clientAi).toMatch(/from '\.\.\/ai\/dreamReflectionPrompt'/);
    expect(billingAi).toMatch(/src\/ai\/dreamReflectionPrompt\.ts/);
    expect(billingAi).toMatch(/extractSameCallReflectiveQuestions/);
    expect(billingAi).not.toMatch(/generateProductionReflectiveQuestion/);
    expect(billingAi).not.toMatch(/QUESTION_INTEGRITY_GATE_TASK/);
    expect(billingAi).not.toMatch(/QUESTION_PREMISE_CHECK_TASK/);
    expect(billingAi).not.toMatch(/reflectiveQuestionPipeline/);
    expect(gateway).not.toMatch(/generateReflectiveQuestionArtifact/);
  });

  it('restores Quick 1 / Standard-Advanced 2 in the same reading', () => {
    const quick = buildInitialReflectionRequest(dream, 'quick');
    const standard = buildInitialReflectionRequest(dream, 'standard');
    const advanced = buildInitialReflectionRequest(dream, 'advanced');
    expect(quick.messages[2].content).toContain('exactly one natural reflective question');
    expect(standard.messages[2].content).toContain('## Reflective Questions');
    expect(standard.messages[2].content).toContain('Exactly 2 questions');
    expect(advanced.messages[2].content).toContain('Exactly 2 questions');
    expect(standard.messages[2].content).toContain('Do not use 1–2');
    expect(standard.tokenLimit).toBe(1600);
    expect(dreamDetail).not.toMatch(/ReflectiveQuestionCard/);
    expect(dreamDetail).toMatch(/continueExploringButton/);
    expect(chatScreen).not.toMatch(/ReflectiveQuestionCard/);
    expect(gateway).toMatch(/reflectiveQuestions/);
  });

  it('restores chat to one terminal question, none on the closing turn', () => {
    const regular = buildChatFollowupRequest({
      dream,
      conversation: [{ role: 'assistant', content: 'The gate stays open.' }],
      userMessage: 'My hand becomes warm, but I still do not move.',
      isFinalResponse: false,
    });
    const final = buildChatFollowupRequest({
      dream,
      conversation: [],
      userMessage: "That's enough.",
      isFinalResponse: true,
    });
    const regularText = regular.messages.map((message) => message.content).join('\n');
    const finalText = final.messages.map((message) => message.content).join('\n');
    expect(regular.responseFormat).toBeUndefined();
    expect(regularText).toContain('end with exactly one natural reflective question');
    expect(regularText).toContain('My hand becomes warm, but I still do not move.');
    expect(regularText).not.toContain('A separate evidence-bound subsystem owns optional questions');
    expect(finalText).toContain('Ask no question');
    expect(gateway).toMatch(/asChatMessages\(interpretation\.messages/);
    expect(billingAi).not.toMatch(/buildUserEvidenceSpans/);
    expect(chatScreen).toMatch(/What stayed with you\?/);
  });

  it('restores essays to exactly two same-call questions', () => {
    expect(essayPrompt).toMatch(/PERIOD_REFLECTION_PROMPT_VERSION = '2\.0\.3-phase1'/);
    expect(essayPrompt).toMatch(/Exactly 2 questions as markdown bullets/);
    expect(essayPrompt).not.toMatch(/canonical reflective-question method/);
    expect(essayPrompt).not.toMatch(/from '\.\/reflectiveQuestionPrompt'/);
  });

  it('keeps closed R&D out of runtime and fail-closes gateway deploy', () => {
    for (const rel of REFLECTIVE_QUESTION_RUNTIME_FILES) {
      expect(() =>
        assertReflectiveQuestionRuntimeHasNoRdImports(read(rel), rel)
      ).not.toThrow();
    }
    expect(existsSync(path.join(repoRoot, 'src/ai/rd/reflective-questions'))).toBe(true);
    expect(clientAi).not.toMatch(/candidate-b|Candidate B|08cd3eaf/);
    expect(billingAi).not.toMatch(/candidate-b|Candidate B|08cd3eaf/);
    expect(billingAi).not.toMatch(/sameCallMinimal|questionIntegrityGate|questionRepairCandidate/);
    expect(gateway).not.toMatch(/sameCallMinimal|questionIntegrityGate|questionRepairCandidate/);

    const pkg = JSON.parse(read('package.json')) as { scripts: Record<string, string> };
    const gatewayReadme = read('supabase/functions/ai-entitlements-gateway/README.md');
    expect(pkg.scripts['deploy:ai-entitlements-gateway']).toContain(
      'guard:ai-entitlements-gateway-deploy'
    );
    expect(gatewayReadme).toMatch(/npm run deploy:ai-entitlements-gateway/);
  });
});
