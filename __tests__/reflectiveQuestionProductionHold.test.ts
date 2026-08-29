import {
  APPROVED_REFLECTIVE_QUESTION_PRODUCTION,
  APPROVED_REFLECTIVE_QUESTION_RUNTIME_BUNDLE,
  CANONICAL_REFLECTIVE_QUESTION_RELEASE,
  DENIED_REFLECTIVE_QUESTION_PRODUCTION_CANDIDATES,
  FROZEN_REFLECTIVE_QUESTION_RESEARCH_BASE_SHA256,
  PENDING_REFLECTIVE_DIALOGUE_PRODUCTION_CANDIDATE,
  REVOKED_REFLECTIVE_QUESTION_PRODUCTION,
  REFLECTIVE_QUESTION_RD_ROOT,
  RECOVERED_DEPLOYED_REFLECTIVE_QUESTION_METHOD_ID,
  RECOVERED_DEPLOYED_REFLECTIVE_QUESTION_PROMPT_SHA256,
  REFLECTIVE_QUESTION_DEPLOYED_FUNCTION,
  REFLECTIVE_QUESTION_DEPLOYED_FUNCTION_VERSION,
  ReflectiveQuestionGatewayDeployBlockedError,
  assertReflectiveQuestionGatewayDeployAllowed,
  assertReflectiveQuestionRuntimeHasNoRdImports,
} from '../src/ai/reflectiveQuestionProductionHold';

describe('reflective question production deploy hold', () => {
  it('records the recovered deployed gateway identity', () => {
    expect(REFLECTIVE_QUESTION_DEPLOYED_FUNCTION).toBe('ai-entitlements-gateway');
    expect(REFLECTIVE_QUESTION_DEPLOYED_FUNCTION_VERSION).toBe(113);
    expect(RECOVERED_DEPLOYED_REFLECTIVE_QUESTION_METHOD_ID).toBe(
      'reflective-question-psychological-aliveness-v1.4.0'
    );
    expect(RECOVERED_DEPLOYED_REFLECTIVE_QUESTION_PROMPT_SHA256).toBe(
      '4885e351ff6a20ceb8257c004aacd66e390e4c0902455a1cf5ff4d0df5a0238d'
    );
    expect(APPROVED_REFLECTIVE_QUESTION_PRODUCTION).toEqual({
      methodId: 'oneiros-same-call-reflective-questions-v1.0.3-candidate',
      promptSha256: 'f5399a4973fb84365a25967890169fc2475cb2e2a9f65f0dffd2a8993101d9e7',
    });
    expect(APPROVED_REFLECTIVE_QUESTION_RUNTIME_BUNDLE.identity).toBe(
      'oneiros-reflective-questions-runtime-v1.0.3+structure-v1.0.0'
    );
    expect(CANONICAL_REFLECTIVE_QUESTION_RELEASE).toEqual({
      version: '1.0.3',
      methodAlias: 'oneiros-same-call-reflective-questions-v1.0.3',
      evaluatedMethodArtifact: 'oneiros-same-call-reflective-questions-v1.0.3-candidate',
      promptSha256: 'f5399a4973fb84365a25967890169fc2475cb2e2a9f65f0dffd2a8993101d9e7',
      readerAlias: 'oneiros-dream-reflection-v3.2.3',
      evaluatedReaderArtifact: 'oneiros-dream-reflection-v3.2.3-candidate',
      normalizerVersion: 'oneiros-reflective-question-structure-normalizer-v1.0.0',
      runtimeBundleIdentity: 'oneiros-reflective-questions-runtime-v1.0.3+structure-v1.0.0',
      gatewayFunction: 'ai-entitlements-gateway',
      gatewayVersion: 113,
    });
    expect(REVOKED_REFLECTIVE_QUESTION_PRODUCTION.methodId).toBe(
      'oneiros-reflective-question-v2.0.1'
    );
    expect(REVOKED_REFLECTIVE_QUESTION_PRODUCTION.promptSha256).toMatch(/^[a-f0-9]{64}$/);
    expect(REVOKED_REFLECTIVE_QUESTION_PRODUCTION.reason).toBe(
      'human_quality_failed_sterile_literalism'
    );
    expect(PENDING_REFLECTIVE_DIALOGUE_PRODUCTION_CANDIDATE.methodId).toBe(
      'oneiros-same-call-reflective-questions-v1.0.3-candidate'
    );
    expect(PENDING_REFLECTIVE_DIALOGUE_PRODUCTION_CANDIDATE.chatQuestionMethodId).toBe(
      'oneiros-same-call-reflective-questions-v1.0.3-candidate'
    );
    expect(PENDING_REFLECTIVE_DIALOGUE_PRODUCTION_CANDIDATE.dialoguePromptId).toBe(
      'oneiros-followup-chat-v2.0.1'
    );
    expect(FROZEN_REFLECTIVE_QUESTION_RESEARCH_BASE_SHA256).toBe(
      '08cd3eaf6fd507d6eb19ba73714eecf6453ec8dd6a61f55068621c8ffd80f622'
    );
    expect(REFLECTIVE_QUESTION_RD_ROOT).toBe('src/ai/rd/reflective-questions');
  });

  it('blocks frozen Generator/Gate/Repair from becoming production-active', () => {
    const frozen = [
      {
        methodId: 'oneiros-same-call-minimal-v1.2.0-candidate',
        promptSha256: '4506c8981c1e0f38edcb641bf89e59126bfdafe64a3adff99a94a2d1a12e81f7',
      },
      {
        methodId: 'oneiros-question-integrity-gate-v1.0.0-candidate',
        promptSha256: 'c1d8090fec6149adf492d1319657ba02bf5ae28ddfa5ce28114ef8a0df6629b2',
      },
      {
        methodId: 'oneiros-question-repair-v1.0.0-candidate',
        promptSha256: '0859fd5474124613b7c5cd610d4f48e65ccee6f0ea05b8d4ca382ddd5a53d53b',
      },
    ] as const;
    for (const candidate of frozen) {
      expect(DENIED_REFLECTIVE_QUESTION_PRODUCTION_CANDIDATES).toEqual(
        expect.arrayContaining([candidate])
      );
      expect(() =>
        assertReflectiveQuestionGatewayDeployAllowed({
          localMethodId: candidate.methodId,
          localPromptSha256: candidate.promptSha256,
          approvalToken: `${candidate.methodId}:${candidate.promptSha256}`,
        })
      ).toThrow(/denied candidate/i);
    }
    expect(APPROVED_REFLECTIVE_QUESTION_PRODUCTION.methodId).toBe(
      'oneiros-same-call-reflective-questions-v1.0.3-candidate'
    );
  });

  it('blocks the denied Oneiros Reader v1.4 candidate even with an approval token', () => {
    const denied = DENIED_REFLECTIVE_QUESTION_PRODUCTION_CANDIDATES.find(
      (candidate) => candidate.methodId === 'reflective-question-oneiros-reader-v1.4.0'
    )!;

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

  it('blocks the failed post-reading Inviter bundle even with an approval token', () => {
    const denied = DENIED_REFLECTIVE_QUESTION_PRODUCTION_CANDIDATES.find(
      (candidate) => candidate.methodId === 'oneiros-post-reading-inviter-v1.0.0-candidate'
    );
    expect(denied).toEqual({
      methodId: 'oneiros-post-reading-inviter-v1.0.0-candidate',
      promptSha256: '70c533e59b56693d5ade15a5234d2a7457ef194ba157750f67e884e13bb42cfa',
    });
    expect(() =>
      assertReflectiveQuestionGatewayDeployAllowed({
        localMethodId: denied!.methodId,
        localPromptSha256: denied!.promptSha256,
        approvalToken: `${denied!.methodId}:${denied!.promptSha256}`,
      })
    ).toThrow(/denied candidate/i);
  });

  it('blocks the failed Post-Jungian Inviter v2 bundle even with an approval token', () => {
    const denied = DENIED_REFLECTIVE_QUESTION_PRODUCTION_CANDIDATES.find(
      (candidate) => candidate.methodId === 'oneiros-post-jungian-inviter-v2.0.1-candidate'
    );
    expect(denied).toEqual({
      methodId: 'oneiros-post-jungian-inviter-v2.0.1-candidate',
      promptSha256: '09045bf1860b2a2a6325e468cc19de019c351f0162cfa17c3f0a6153f3f3f35e',
    });
    expect(() =>
      assertReflectiveQuestionGatewayDeployAllowed({
        localMethodId: denied!.methodId,
        localPromptSha256: denied!.promptSha256,
        approvalToken: `${denied!.methodId}:${denied!.promptSha256}`,
      })
    ).toThrow(/denied candidate/i);
  });

  it('blocks the superseded v2.2 identity even with an approval token', () => {
    const denied = DENIED_REFLECTIVE_QUESTION_PRODUCTION_CANDIDATES.find(
      (candidate) => candidate.methodId === 'oneiros-reflective-question-v2.2.0'
    );
    expect(denied).toBeDefined();
    expect(() =>
      assertReflectiveQuestionGatewayDeployAllowed({
        localMethodId: denied!.methodId,
        localPromptSha256: denied!.promptSha256,
        approvalToken: `${denied!.methodId}:${denied!.promptSha256}`,
      })
    ).toThrow(/denied candidate/);
  });

  it('blocks the benchmarked v2.3.0 identity even with an approval token', () => {
    const denied = DENIED_REFLECTIVE_QUESTION_PRODUCTION_CANDIDATES.find(
      (candidate) => candidate.methodId === 'oneiros-reflective-question-v2.3.0'
    );
    expect(denied).toBeDefined();
    expect(() =>
      assertReflectiveQuestionGatewayDeployAllowed({
        localMethodId: denied!.methodId,
        localPromptSha256: denied!.promptSha256,
        approvalToken: `${denied!.methodId}:${denied!.promptSha256}`,
      })
    ).toThrow(/denied candidate/);
  });

  it('blocks the benchmarked but human-weak v2.3.1 identity even with an approval token', () => {
    const denied = DENIED_REFLECTIVE_QUESTION_PRODUCTION_CANDIDATES.find(
      (candidate) => candidate.methodId === 'oneiros-reflective-question-v2.3.1'
    );
    expect(denied).toBeDefined();
    expect(() =>
      assertReflectiveQuestionGatewayDeployAllowed({
        localMethodId: denied!.methodId,
        localPromptSha256: denied!.promptSha256,
        approvalToken: `${denied!.methodId}:${denied!.promptSha256}`,
      })
    ).toThrow(/denied candidate/);
  });

  it('blocks the benchmarked and overengineered v2.4 identity even with an approval token', () => {
    const denied = DENIED_REFLECTIVE_QUESTION_PRODUCTION_CANDIDATES.find(
      (candidate) => candidate.methodId === 'oneiros-reflective-question-v2.4.0'
    );
    expect(denied).toBeDefined();
    expect(() =>
      assertReflectiveQuestionGatewayDeployAllowed({
        localMethodId: denied!.methodId,
        localPromptSha256: denied!.promptSha256,
        approvalToken: `${denied!.methodId}:${denied!.promptSha256}`,
      })
    ).toThrow(/denied candidate/);
  });

  it('revokes the mechanically valid v2.0.1 identity even with an override', () => {
    expect(() =>
      assertReflectiveQuestionGatewayDeployAllowed({
        localMethodId: REVOKED_REFLECTIVE_QUESTION_PRODUCTION.methodId,
        localPromptSha256: REVOKED_REFLECTIVE_QUESTION_PRODUCTION.promptSha256,
      })
    ).toThrow(/revoked after human review/);
    expect(() =>
      assertReflectiveQuestionGatewayDeployAllowed({
        localMethodId: REVOKED_REFLECTIVE_QUESTION_PRODUCTION.methodId,
        localPromptSha256: REVOKED_REFLECTIVE_QUESTION_PRODUCTION.promptSha256,
        approvalToken: `${REVOKED_REFLECTIVE_QUESTION_PRODUCTION.methodId}:${REVOKED_REFLECTIVE_QUESTION_PRODUCTION.promptSha256}`,
      })
    ).toThrow(/revoked/);
  });

  it('denies failed editorial-arc and surgical candidates while allowing approved production', () => {
    const denied = DENIED_REFLECTIVE_QUESTION_PRODUCTION_CANDIDATES.find(
      (candidate) => candidate.methodId === 'oneiros-reflection-editorial-arc-v2.0.0-candidate'
    )!;
    expect(denied.promptSha256).toBe(
      '6cd304e1c246f237f21743232de32723e81656f9c8cb3c4f51ee49fe26249b49'
    );
    expect(PENDING_REFLECTIVE_DIALOGUE_PRODUCTION_CANDIDATE.methodId).not.toBe(
      denied.methodId
    );
    expect(() =>
      assertReflectiveQuestionGatewayDeployAllowed({
        localMethodId: denied.methodId,
        localPromptSha256: denied.promptSha256,
      })
    ).toThrow(/denied candidate/i);

    expect(() =>
      assertReflectiveQuestionGatewayDeployAllowed({
        localMethodId: denied.methodId,
        localPromptSha256: denied.promptSha256,
        approvalToken: `${denied.methodId}:${denied.promptSha256}`,
      })
    ).toThrow(/denied candidate/i);

    expect(() =>
      assertReflectiveQuestionGatewayDeployAllowed({
        localMethodId: PENDING_REFLECTIVE_DIALOGUE_PRODUCTION_CANDIDATE.methodId,
        localPromptSha256: PENDING_REFLECTIVE_DIALOGUE_PRODUCTION_CANDIDATE.promptSha256,
      })
    ).not.toThrow();

    const surgical = DENIED_REFLECTIVE_QUESTION_PRODUCTION_CANDIDATES.find(
      (candidate) => candidate.methodId === 'oneiros-same-call-reflective-questions-v1.0.2-candidate'
    )!;
    expect(surgical.promptSha256).toBe(
      '94d4a92a4a88d4104fa3dcc5790209a4fd3b34cec56dc1724eade78255798b96'
    );
    expect(() =>
      assertReflectiveQuestionGatewayDeployAllowed({
        localMethodId: surgical.methodId,
        localPromptSha256: surgical.promptSha256,
        approvalToken: `${surgical.methodId}:${surgical.promptSha256}`,
      })
    ).toThrow(/denied candidate/i);
  });

  it('rejects a malformed or non-matching approval token', () => {
    expect(() =>
      assertReflectiveQuestionGatewayDeployAllowed({
        localMethodId: 'oneiros-reflective-question-unapproved',
        localPromptSha256: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        approvalToken: 'not-a-token',
      })
    ).toThrow(/must be <methodId>:<sha256>/);

    expect(() =>
      assertReflectiveQuestionGatewayDeployAllowed({
        localMethodId: 'oneiros-reflective-question-unapproved',
        localPromptSha256: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        approvalToken:
          'some-future-method:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      })
    ).toThrow(/does not match the code-owned approved/i);
  });

  it('rejects runtime imports of R&D or the hold snapshot', () => {
    expect(() =>
      assertReflectiveQuestionRuntimeHasNoRdImports(
        "import { x } from '../ai/rd/reflective-questions/active';",
        'src/services/ai.ts'
      )
    ).toThrow(/not runtime/);

    expect(() =>
      assertReflectiveQuestionRuntimeHasNoRdImports(
        "import { y } from '../ai/reflectiveQuestionProductionHold';",
        'src/services/ai.ts'
      )
    ).toThrow(/not runtime/);

    expect(() =>
      assertReflectiveQuestionRuntimeHasNoRdImports(
        "import { REFLECTIVE_QUESTION_METHOD_PROMPT } from '../ai/reflectiveQuestionPrompt';",
        'src/services/ai.ts'
      )
    ).not.toThrow();
  });
});
