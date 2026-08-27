import {
  APPROVED_REFLECTIVE_QUESTION_PRODUCTION,
  DENIED_REFLECTIVE_QUESTION_PRODUCTION_CANDIDATES,
  FROZEN_REFLECTIVE_QUESTION_RESEARCH_BASE_SHA256,
  REFLECTIVE_QUESTION_RD_ROOT,
  RECOVERED_DEPLOYED_REFLECTIVE_QUESTION_METHOD_ID,
  RECOVERED_DEPLOYED_REFLECTIVE_QUESTION_PROMPT,
  RECOVERED_DEPLOYED_REFLECTIVE_QUESTION_PROMPT_SHA256,
  REFLECTIVE_QUESTION_DEPLOYED_FUNCTION,
  REFLECTIVE_QUESTION_DEPLOYED_FUNCTION_VERSION,
  ReflectiveQuestionGatewayDeployBlockedError,
  assertReflectiveQuestionGatewayDeployAllowed,
  assertReflectiveQuestionRuntimeHasNoRdImports,
  hashReflectiveQuestionPrompt,
} from '../src/ai/reflectiveQuestionProductionHold';

describe('reflective question production hold', () => {
  it('records the recovered deployed gateway identity', () => {
    expect(REFLECTIVE_QUESTION_DEPLOYED_FUNCTION).toBe('ai-entitlements-gateway');
    expect(REFLECTIVE_QUESTION_DEPLOYED_FUNCTION_VERSION).toBe(105);
    expect(RECOVERED_DEPLOYED_REFLECTIVE_QUESTION_METHOD_ID).toBe(
      'reflective-question-psychological-aliveness-v1.4.0'
    );
    expect(RECOVERED_DEPLOYED_REFLECTIVE_QUESTION_PROMPT_SHA256).toBe(
      '4885e351ff6a20ceb8257c004aacd66e390e4c0902455a1cf5ff4d0df5a0238d'
    );
    expect(
      hashReflectiveQuestionPrompt(RECOVERED_DEPLOYED_REFLECTIVE_QUESTION_PROMPT)
    ).toBe(RECOVERED_DEPLOYED_REFLECTIVE_QUESTION_PROMPT_SHA256);
    expect(APPROVED_REFLECTIVE_QUESTION_PRODUCTION.methodId).toBe(
      RECOVERED_DEPLOYED_REFLECTIVE_QUESTION_METHOD_ID
    );
    expect(FROZEN_REFLECTIVE_QUESTION_RESEARCH_BASE_SHA256).toBe(
      '08cd3eaf6fd507d6eb19ba73714eecf6453ec8dd6a61f55068621c8ffd80f622'
    );
    expect(REFLECTIVE_QUESTION_RD_ROOT).toBe('src/ai/rd/reflective-questions');
  });

  it('blocks the denied Oneiros Reader v1.4 candidate even with an approval token', () => {
    const denied = DENIED_REFLECTIVE_QUESTION_PRODUCTION_CANDIDATES[0];

    expect(() =>
      assertReflectiveQuestionGatewayDeployAllowed({
        localMethodId: denied.methodId,
        localPromptSha256: denied.promptSha256,
      })
    ).toThrow(ReflectiveQuestionGatewayDeployBlockedError);

    expect(() =>
      assertReflectiveQuestionGatewayDeployAllowed({
        localMethodId: denied.methodId,
        localPromptSha256: denied.promptSha256,
        approvalToken: `${denied.methodId}:${denied.promptSha256}`,
      })
    ).toThrow(/denied candidate/);
  });

  it('allows deploy only when local identity matches the recovered production SHA', () => {
    expect(() =>
      assertReflectiveQuestionGatewayDeployAllowed({
        localMethodId: APPROVED_REFLECTIVE_QUESTION_PRODUCTION.methodId,
        localPromptSha256: APPROVED_REFLECTIVE_QUESTION_PRODUCTION.promptSha256,
      })
    ).not.toThrow();
  });

  it('rejects a malformed or non-matching approval token', () => {
    expect(() =>
      assertReflectiveQuestionGatewayDeployAllowed({
        localMethodId: APPROVED_REFLECTIVE_QUESTION_PRODUCTION.methodId,
        localPromptSha256: APPROVED_REFLECTIVE_QUESTION_PRODUCTION.promptSha256,
        approvalToken: 'not-a-token',
      })
    ).toThrow(/must be <methodId>:<sha256>/);

    expect(() =>
      assertReflectiveQuestionGatewayDeployAllowed({
        localMethodId: APPROVED_REFLECTIVE_QUESTION_PRODUCTION.methodId,
        localPromptSha256: APPROVED_REFLECTIVE_QUESTION_PRODUCTION.promptSha256,
        approvalToken:
          'some-future-method:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      })
    ).toThrow(/not explicitly approved/);
  });

  it('rejects runtime imports of R&D or the hold snapshot', () => {
    expect(() =>
      assertReflectiveQuestionRuntimeHasNoRdImports(
        "import { x } from '../ai/rd/reflective-questions/active';",
        'src/services/ai.ts'
      )
    ).toThrow(/not runtime/);
  });
});
