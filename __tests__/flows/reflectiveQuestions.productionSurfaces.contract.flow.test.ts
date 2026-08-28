/**
 * Flow coverage: documentation/flows-06-jungian-ai-reflection.md
 * Locked contract: Reflective Questions v2 owns the initial conversation
 * opening and optional chat questions without changing essay cardinality.
 */
import { existsSync, readFileSync } from 'fs';
import path from 'path';
import {
  buildInitialReflectionRequest,
  buildChatFollowupRequest,
  DREAM_REFLECTION_EDITORIAL_ARC_BUNDLE,
  DREAM_REFLECTION_PROMPT_ID,
  REFLECTIVE_DIALOGUE_PROMPT_ID,
  REFLECTIVE_DIALOGUE_QUESTION_CONTEXT_TAG,
} from '../../src/ai/dreamReflectionPrompt';
import {
  REFLECTIVE_QUESTION_COMPOSER_METHOD_ID,
  REFLECTIVE_QUESTION_COMPOSER_PROMPT,
} from '../../src/ai/reflectiveQuestionComposer';
import {
  buildDreamEvidenceSpans,
  buildReflectiveQuestionMessages,
  buildUserEvidenceSpans,
  REFLECTIVE_QUESTION_METHOD_ID,
} from '../../src/ai/reflectiveQuestionPrompt';
import {
  buildChatReflectiveLanguageContext,
} from '../../src/ai/reflectiveLanguage';
import {
  APPROVED_REFLECTIVE_QUESTION_PRODUCTION,
  PENDING_REFLECTIVE_DIALOGUE_PRODUCTION_CANDIDATE,
  REVOKED_REFLECTIVE_QUESTION_PRODUCTION,
  REFLECTIVE_QUESTION_RUNTIME_FILES,
  assertReflectiveQuestionRuntimeHasNoRdImports,
} from '../../src/ai/reflectiveQuestionProductionHold';

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

  it('uses a frozen Reader plus production Generator/Gate/Premise/Repair', () => {
    expect(DREAM_REFLECTION_PROMPT_ID).toBe('oneiros-dream-reflection-v3.1.0-candidate');
    expect(REFLECTIVE_DIALOGUE_PROMPT_ID).toBe('oneiros-reflective-dialogue-v1.9.1');
    expect(REFLECTIVE_QUESTION_METHOD_ID).toBe('oneiros-reflective-question-v5.0.0');
    expect(PENDING_REFLECTIVE_DIALOGUE_PRODUCTION_CANDIDATE.methodId).toBe(
      'oneiros-reflective-question-production-v1.0.0'
    );
    expect(PENDING_REFLECTIVE_DIALOGUE_PRODUCTION_CANDIDATE.chatQuestionMethodId).toBe(
      REFLECTIVE_QUESTION_METHOD_ID
    );
    expect(APPROVED_REFLECTIVE_QUESTION_PRODUCTION).toEqual({
      methodId: 'oneiros-reflective-question-production-v1.0.0',
      promptSha256: 'fc8b6304fc2e8bc108242113299f7073cfbcc80d3f8df41cf747d218540d00ea',
    });
    expect(REVOKED_REFLECTIVE_QUESTION_PRODUCTION.methodId).toBe(
      'oneiros-reflective-question-v2.0.1'
    );
    expect(clientAi).toMatch(/from '\.\.\/ai\/dreamReflectionPrompt'/);
    expect(billingAi).toMatch(/src\/ai\/dreamReflectionPrompt\.ts/);
    expect(billingAi).toMatch(/src\/ai\/reflectiveQuestionPipeline\.ts/);
    expect(billingAi).toMatch(/generateProductionReflectiveQuestion/);
    expect(billingAi).toMatch(/QUESTION_INTEGRITY_GATE_TASK/);
    expect(billingAi).toMatch(/QUESTION_PREMISE_CHECK_TASK/);
    expect(billingAi).not.toMatch(/parseReflectionEditorialArcQuestion/);
    expect(billingAi).not.toMatch(/createEditorialArcQuestionArtifact/);
    expect(gateway).not.toMatch(/initialReadingContext: reflection/);
    expect(gateway).toMatch(/generateReflectiveQuestionArtifact/);
  });

  it('always writes one initial question after a complete reading', () => {
    for (const depth of ['quick', 'standard', 'advanced'] as const) {
      const reading = buildInitialReflectionRequest(dream, depth);
      const prompt = reading.messages.map((message) => message.content).join('\n');
      expect(prompt).toContain('Do not place a question inside the reading prose');
      expect(prompt).toContain('[D1] I stand beside an open gate');
      expect(prompt).not.toContain('Before writing the reading, decide whether this dream holds one honest opening');
      expect(prompt).not.toContain('Return zero or one question. Silence is a valid editorial ending');
      expect(prompt).not.toContain('FOUR EPISTEMIC BOUNDARIES');
      expect(prompt).not.toContain('<!--BEGIN_DREAM_READING-->');
      expect(prompt).not.toContain('## Reflective Questions');
    }
    expect(REFLECTIVE_QUESTION_COMPOSER_PROMPT).toContain(
      'Write exactly one natural, beautiful, post-Jungian reflective question'
    );
    expect(DREAM_REFLECTION_EDITORIAL_ARC_BUNDLE).toContain(
      'oneiros-reflection-editorial-arc-v2.0.0-candidate'
    );
    expect(gateway).toMatch(/reflectiveQuestion = reflectionResult\.reflectiveQuestion/);
    expect(gateway).toMatch(/reflectiveQuestion \? \{ reflectiveQuestion \}/);
    expect(dreamDetail).toMatch(/ReflectiveQuestionCard/);
    expect(dreamDetail).toMatch(/onContinue=\{openQuestionComposer\}/);
    expect(dreamDetail).toMatch(/onAnswer=\{answerReflectiveQuestion\}/);
    expect(billingAi).toMatch(/committed_question/);
    expect(billingAi).not.toMatch(/createEditorialArcQuestionArtifact/);
  });

  it('keeps chat questions optional and the final reply question-free', () => {
    const conversation = [{
      role: 'assistant' as const,
      content: 'The gate stays open.',
      reflectiveQuestion: {
        status: 'question',
        question: 'What happens in your hand while you keep the gate open?',
        languageCode: 'en',
      },
    }];
    const regular = buildChatFollowupRequest({
      dream,
      conversation,
      userMessage: 'My hand becomes warm, but I still do not move.',
      isFinalResponse: false,
    });
    const final = buildChatFollowupRequest({
      dream,
      conversation: [],
      userMessage: 'One last thought?',
      isFinalResponse: true,
    });
    const regularText = regular.messages.map((message) => message.content).join('\n');
    const finalText = final.messages.map((message) => message.content).join('\n');
    expect(regularText).toContain('A separate evidence-bound subsystem owns optional questions');
    expect(regularText).toContain(REFLECTIVE_DIALOGUE_QUESTION_CONTEXT_TAG);
    expect(regularText).toContain(
      'What happens in your hand while you keep the gate open?'
    );
    expect(regularText).toContain('user turn is the center');
    expect(finalText).toContain('do not end with a question');

    const userEvidenceSpans = buildUserEvidenceSpans(
      conversation,
      'My hand becomes warm, but I still do not move.'
    );
    const chatQuestionPrompt = buildReflectiveQuestionMessages({
      surface: 'chat',
      languageContext: buildChatReflectiveLanguageContext({
        dreamContent: dream.content,
        conversation,
        latestUserMessage: 'My hand becomes warm, but I still do not move.',
      }),
      evidenceSpans: buildDreamEvidenceSpans(dream.content),
      userEvidenceSpans,
      chatAnswerContext: 'The assistant has already answered the user.',
      conversation,
    });
    expect(chatQuestionPrompt[1].content).toContain('CHAT CONSTRAINT');
    expect(chatQuestionPrompt[1].content).toContain('[U1] My hand becomes warm');
    expect(chatQuestionPrompt[1].content).toContain(
      'latest user-authored U# movement'
    );
    expect(gateway).toMatch(/isFinalResponse/);
    expect(gateway).toMatch(/asChatMessages\(interpretation\.messages/);
    expect(billingAi).toMatch(/buildUserEvidenceSpans/);
    expect(billingAi).toMatch(/return abstain\('final_chat_reply', 'semantic_abstention'\)/);
    expect(chatScreen).toMatch(/ReflectiveQuestionCard/);
  });

  it('keeps essays on QA-approved 2.0.3-phase1 exactly one', () => {
    expect(essayPrompt).toMatch(/PERIOD_REFLECTION_PROMPT_VERSION = '2\.0\.3-phase1'/);
    expect(essayPrompt).toMatch(/RECENT_DREAM_FIELD_PROMPT_VERSION = '2\.0\.3-phase1'/);
    expect(essayPrompt).toMatch(/Output exactly one reflective question/);
    expect(essayPrompt).toMatch(/One strong question is complete/);
    expect(essayPrompt).not.toMatch(/from '\.\/reflectiveQuestionPrompt'/);
  });

  it('keeps production orchestration approved and closed Inviter R&D off the selectable path', () => {
    expect(APPROVED_REFLECTIVE_QUESTION_PRODUCTION?.methodId).toBe(
      'oneiros-reflective-question-production-v1.0.0'
    );
    expect(billingAi).toMatch(/generateProductionReflectiveQuestion/);
    expect(billingAi).not.toMatch(/generateInitialComposerQuestion/);
    expect(existsSync(path.join(repoRoot, 'scripts/live/reflective-questions/run-reflective-question-composer-gate1.ts'))).toBe(false);
    expect(existsSync(path.join(repoRoot, 'scripts/live/reflective-questions/run-editorial-arc-gate1.ts'))).toBe(false);
    expect(existsSync(path.join(repoRoot, 'src/ai/rd/reflective-questions/postJungianInviter'))).toBe(false);
    expect(existsSync(path.join(repoRoot, 'src/ai/rd/reflective-questions/remainderFirst'))).toBe(false);
  });

  it('keeps same-call minimal A/B offline and out of the production Reader', () => {
    const production = buildInitialReflectionRequest(dream, 'standard');
    const candidate = read('src/ai/rd/reflective-questions/sameCallMinimal/sameCallMinimalCandidate.ts');
    const pkg = JSON.parse(read('package.json')) as { scripts: Record<string, string> };
    const runner = read('scripts/live/reflective-questions/run-same-call-minimal-gate1.ts');
    const finalRunner = read('scripts/live/reflective-questions/run-same-call-minimal-final-24.ts');
    expect(production.tokenLimit).toBe(1450);
    expect(production.messages.map((message) => message.content).join('\n'))
      .not.toContain('After the reading, write exactly one');
    expect(billingAi).not.toMatch(/sameCallMinimal|oneiros-same-call-minimal/);
    expect(clientAi).not.toMatch(/sameCallMinimal|oneiros-same-call-minimal/);
    expect(gateway).not.toMatch(/sameCallMinimal|oneiros-same-call-minimal/);
    expect(candidate).toMatch(/buildInitialReflectionRequest/);
    expect(candidate).toMatch(/SAME_CALL_MINIMAL_QUESTION_TOKEN_BUFFER = 200/);
    expect(candidate).toMatch(/oneiros-same-call-minimal-v1\.2\.0-candidate/);
    expect(candidate).toMatch(/oneiros-same-call-minimal-v1\.1\.0-candidate/);
    expect(candidate).toMatch(/explicit-output-language\+question-mode-wrapper/);
    expect(candidate).toMatch(/live-point-not-conflict/);
    expect(candidate).not.toMatch(/beautiful post-Jungian/);
    expect(runner).toMatch(/ONEIROS_SAME_CALL_MINIMAL_GATE1_COST_APPROVED/);
    expect(runner).toMatch(/buildSameCallMinimalRequest/);
    expect(runner).toMatch(/Same-call A\/B must run on gpt-5\.4/);
    expect(runner).not.toMatch(/retryCompressed|repairCall|judgeCall/);
    expect(finalRunner).toMatch(/ONEIROS_SAME_CALL_MINIMAL_FINAL24_COST_APPROVED/);
    expect(finalRunner).toMatch(/Same-call final 24 must run on gpt-5\.4/);
    expect(finalRunner).toMatch(/OUTPUT_LANGUAGE/);
    expect(finalRunner).toMatch(/Retry only for genuine transport\/API failure/);
    expect(finalRunner).toMatch(/Editorial GOLD\/SHIP\/WEAK\/FAIL is for human scoring only/);
    expect(finalRunner).toMatch(/variant: 'v1\.2\.0'/);
    expect(finalRunner).toMatch(/oneiros-same-call-minimal-v12-final24/);
    expect(finalRunner).toMatch(/LIVE POINT \/ DISCOVERY/);
    expect(finalRunner).not.toMatch(/retryCompressed|repairCall|judgeCall/);
    expect(pkg.scripts['benchmark:same-call-minimal-gate1']).toContain(
      'run-same-call-minimal-gate1.ts'
    );
    expect(pkg.scripts['benchmark:same-call-minimal-final-24']).toContain(
      'run-same-call-minimal-final-24.ts'
    );
    const pairedRunner = read('scripts/live/reflective-questions/run-same-call-minimal-v12-paired.ts');
    expect(pairedRunner).toMatch(/ONEIROS_SAME_CALL_MINIMAL_V12_PAIRED_COST_APPROVED/);
    expect(pairedRunner).toMatch(/Same-call paired gate must run on gpt-5\.4/);
    expect(pairedRunner).toMatch(/'v1\.1\.0'/);
    expect(pairedRunner).toMatch(/'v1\.2\.0'/);
    expect(pairedRunner).toMatch(/assignBlindLabels/);
    expect(pairedRunner).not.toMatch(/retryCompressed|repairCall|judgeCall/);
    expect(pkg.scripts['benchmark:same-call-minimal-v12-paired']).toContain(
      'run-same-call-minimal-v12-paired.ts'
    );
    const integrityRunner = read('scripts/live/reflective-questions/run-question-integrity-gate-phase1.ts');
    expect(integrityRunner).toMatch(/ONEIROS_QUESTION_INTEGRITY_GATE_PHASE1_COST_APPROVED/);
    expect(integrityRunner).toMatch(/Integrity Gate Phase 1 must run on gpt-5\.4/);
    expect(integrityRunner).toMatch(/No generated reading/);
    expect(integrityRunner).not.toMatch(/retryCompressed|repairCall|judgeCall/);
    expect(integrityRunner).toMatch(/No DROP\/hide-question UI/);
    expect(pkg.scripts['benchmark:question-integrity-gate-phase1']).toContain(
      'run-question-integrity-gate-phase1.ts'
    );
    expect(billingAi).toMatch(/questionIntegrityGateCandidate/);
    expect(clientAi).not.toMatch(/questionIntegrityGate|oneiros-question-integrity-gate/);
    expect(gateway).not.toMatch(/questionIntegrityGate|oneiros-question-integrity-gate/);
    const repairRunner = read('scripts/live/reflective-questions/run-question-repair-phase2.ts');
    expect(repairRunner).toMatch(/ONEIROS_QUESTION_REPAIR_PHASE2_COST_APPROVED/);
    expect(repairRunner).toMatch(/assertUsedGpt54\(repairCall\.model, 'Phase 2 Repair'\)/);
    expect(repairRunner).toMatch(/assertUsedGpt54\(gateCall\.model, 'Post-repair Integrity Gate'\)/);
    expect(repairRunner).toMatch(/must run on gpt-5\.4/);
    expect(repairRunner).toMatch(/No second Repair/);
    expect(repairRunner).toMatch(/No DROP/);
    expect(repairRunner).not.toMatch(/best-of-N|bestOfN|retryCompressed|judgeCall/);
    expect(pkg.scripts['benchmark:question-repair-phase2']).toContain(
      'run-question-repair-phase2.ts'
    );
    expect(billingAi).toMatch(/questionRepairCandidate/);
    expect(clientAi).not.toMatch(/questionRepairCandidate|oneiros-question-repair-v1/);
    expect(gateway).not.toMatch(/questionRepairCandidate|oneiros-question-repair-v1/);
    const closeout = read('docs/ONEIROS_QUESTION_REPAIR_PHASE2_EDITORIAL_FAIL_2026-08-29.md');
    expect(closeout).toMatch(/CLOSED FOR CURRENT ARCHITECTURE/);
    expect(closeout).toMatch(/EDITORIAL FAIL/);
    expect(closeout).toMatch(/Do not deploy Generator \+ Gate \+ Repair/);
    expect(closeout).not.toMatch(/be more alive/);
    expect(closeout).not.toMatch(/Repair v1\.0\.1/);
    expect(closeout).toMatch(/best-of-N loop is an architecture spiral/);
    expect(closeout).toMatch(/Product launch addendum/);
    expect(closeout).toMatch(/oneiros-question-premise-check-v1\.0\.0-candidate/);
    expect(closeout).toMatch(/oneiros-reflective-question-production-v1\.0\.0/);
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

    const pkg = JSON.parse(read('package.json')) as { scripts: Record<string, string> };
    const gatewayReadme = read('supabase/functions/ai-entitlements-gateway/README.md');
    expect(pkg.scripts['deploy:ai-entitlements-gateway']).toContain(
      'guard:ai-entitlements-gateway-deploy'
    );
    expect(gatewayReadme).toMatch(/npm run deploy:ai-entitlements-gateway/);
  });
});
