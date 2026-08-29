/**
 * Deploy-gate identity for launch same-call reflective questions.
 *
 * Production questions are generated inside the Reader/chat/essay calls.
 * Composer, Integrity Gate, Repair, Premise Check, and v1.2 orchestration
 * remain frozen R&D and must not be imported from client or gateway runtime.
 * Do not import this module from client or gateway request paths.
 */
import { createHash } from 'crypto';
import {
  DREAM_REFLECTION_PROMPT_ID,
  SAME_CALL_REFLECTIVE_QUESTIONS_BUNDLE,
  SAME_CALL_REFLECTIVE_QUESTIONS_METHOD_ID,
  SAME_CALL_REFLECTIVE_QUESTIONS_PROMPT_SHA256,
} from './dreamReflectionPrompt';
import { REFLECTION_EDITORIAL_ARC_METHOD_ID } from './reflectionEditorialArc';
import {
  REFLECTIVE_QUESTION_STRUCTURE_NORMALIZER_OPERATION,
  REFLECTIVE_QUESTION_STRUCTURE_NORMALIZER_VERSION,
  REFLECTIVE_QUESTION_RUNTIME_BUNDLE_IDENTITY,
} from './reflectiveQuestionExtract';

export const REFLECTIVE_QUESTION_PRODUCTION_DEPLOY_APPROVAL_ENV =
  'REFLECTIVE_QUESTION_PRODUCTION_DEPLOY_APPROVED';

export const REFLECTIVE_QUESTION_DEPLOYED_FUNCTION = 'ai-entitlements-gateway';
export const REFLECTIVE_QUESTION_DEPLOYED_PROJECT_REF = 'xacdawttvtfrdbcwhcqn';
export const REFLECTIVE_QUESTION_DEPLOYED_FUNCTION_VERSION = 113;
export const REFLECTIVE_QUESTION_DEPLOYED_UPDATED_AT_UTC = '2026-08-29T18:17:32Z';

export const RECOVERED_DEPLOYED_REFLECTIVE_QUESTION_METHOD_ID =
  'reflective-question-psychological-aliveness-v1.4.0';
export const RECOVERED_DEPLOYED_REFLECTIVE_QUESTION_METHOD_VERSION =
  '1.4.0';

export function hashReflectiveQuestionPrompt(prompt: string): string {
  return createHash('sha256').update(prompt.trim()).digest('hex');
}

export const RECOVERED_DEPLOYED_REFLECTIVE_QUESTION_PROMPT_SHA256 =
  '4885e351ff6a20ceb8257c004aacd66e390e4c0902455a1cf5ff4d0df5a0238d';

export type ReflectiveQuestionProductionIdentity = {
  methodId: string;
  promptSha256: string;
};

/** Exact approved local same-call production bundle. */
export const SAME_CALL_REFLECTIVE_QUESTIONS_BUNDLE_SHA256 =
  SAME_CALL_REFLECTIVE_QUESTIONS_PROMPT_SHA256;

export const APPROVED_REFLECTIVE_QUESTION_PRODUCTION: ReflectiveQuestionProductionIdentity = {
  methodId: 'oneiros-same-call-reflective-questions-v1.0.3-candidate',
  promptSha256: 'f5399a4973fb84365a25967890169fc2475cb2e2a9f65f0dffd2a8993101d9e7',
};

/**
 * Canonical release aliases point to the immutable evaluated artifacts.
 * They are release metadata only: runtime telemetry continues to report the
 * exact artifact ids and the prompt bytes/SHA remain unchanged.
 */
export const REFLECTIVE_QUESTION_RELEASE_VERSION = '1.0.3' as const;
export const REFLECTIVE_QUESTION_RELEASE_METHOD_ALIAS =
  'oneiros-same-call-reflective-questions-v1.0.3' as const;
export const DREAM_REFLECTION_RELEASE_ALIAS =
  'oneiros-dream-reflection-v3.2.3' as const;

export const APPROVED_REFLECTIVE_QUESTION_RUNTIME_BUNDLE = {
  identity: REFLECTIVE_QUESTION_RUNTIME_BUNDLE_IDENTITY,
  readerPromptId: DREAM_REFLECTION_PROMPT_ID,
  questionMethodId: APPROVED_REFLECTIVE_QUESTION_PRODUCTION.methodId,
  questionPromptSha256: APPROVED_REFLECTIVE_QUESTION_PRODUCTION.promptSha256,
  normalizerVersion: REFLECTIVE_QUESTION_STRUCTURE_NORMALIZER_VERSION,
} as const;

export const CANONICAL_REFLECTIVE_QUESTION_RELEASE = {
  version: REFLECTIVE_QUESTION_RELEASE_VERSION,
  methodAlias: REFLECTIVE_QUESTION_RELEASE_METHOD_ALIAS,
  evaluatedMethodArtifact: APPROVED_REFLECTIVE_QUESTION_PRODUCTION.methodId,
  promptSha256: APPROVED_REFLECTIVE_QUESTION_PRODUCTION.promptSha256,
  readerAlias: DREAM_REFLECTION_RELEASE_ALIAS,
  evaluatedReaderArtifact: DREAM_REFLECTION_PROMPT_ID,
  normalizerVersion: REFLECTIVE_QUESTION_STRUCTURE_NORMALIZER_VERSION,
  runtimeBundleIdentity: REFLECTIVE_QUESTION_RUNTIME_BUNDLE_IDENTITY,
  gatewayFunction: REFLECTIVE_QUESTION_DEPLOYED_FUNCTION,
  gatewayVersion: REFLECTIVE_QUESTION_DEPLOYED_FUNCTION_VERSION,
} as const;

/**
 * Runtime formatting identity, versioned separately from every prompt SHA.
 * It may insert only the literal heading after an unambiguous completed output.
 */
export const REFLECTIVE_QUESTION_STRUCTURE_NORMALIZER_IDENTITY = {
  normalizerVersion: REFLECTIVE_QUESTION_STRUCTURE_NORMALIZER_VERSION,
  permittedOperation: REFLECTIVE_QUESTION_STRUCTURE_NORMALIZER_OPERATION,
} as const;

/** Mechanically valid, but explicitly revoked after the 20-dream human review. */
export const REVOKED_REFLECTIVE_QUESTION_PRODUCTION = {
  methodId: 'oneiros-reflective-question-v2.0.1',
  promptSha256:
    '2e412879a2bd79cb57dbadfac7a4bafc04114131199cf2ac9bd4c974fa507896',
  reason: 'human_quality_failed_sterile_literalism',
} as const;

/**
 * Exact local production orchestration identity used by the deploy guard.
 */
export const PENDING_REFLECTIVE_DIALOGUE_PRODUCTION_CANDIDATE = {
  methodId: SAME_CALL_REFLECTIVE_QUESTIONS_METHOD_ID,
  promptSha256: SAME_CALL_REFLECTIVE_QUESTIONS_BUNDLE_SHA256,
  dialoguePromptId: 'oneiros-followup-chat-v2.0.1',
  chatQuestionMethodId: SAME_CALL_REFLECTIVE_QUESTIONS_METHOD_ID,
  chatQuestionPromptSha256: SAME_CALL_REFLECTIVE_QUESTIONS_BUNDLE_SHA256,
} as const;

/** Local Oneiros Reader candidate. Never deploy this SHA. */
export const DENIED_REFLECTIVE_QUESTION_PRODUCTION_CANDIDATES = [
  {
    methodId: 'oneiros-same-call-reflective-questions-v1.0.5-candidate',
    promptSha256:
      '16da1d13fb480dd57ef013a7e8241a8309ec06c67d3e1d071089cb24f54cf67a',
  },
  {
    methodId: 'oneiros-same-call-reflective-questions-v1.0.4-candidate',
    promptSha256:
      'a4f972c00bbde525ad3f39db160afd18e3a1c18f8a92090e0eb7078b137e277d',
  },
  {
    methodId: 'oneiros-same-call-reflective-questions-v1.0.2-candidate',
    promptSha256:
      '94d4a92a4a88d4104fa3dcc5790209a4fd3b34cec56dc1724eade78255798b96',
  },
  {
    methodId: 'oneiros-reflective-question-production-v1.0.0',
    promptSha256:
      'fc8b6304fc2e8bc108242113299f7073cfbcc80d3f8df41cf747d218540d00ea',
  },
  {
    methodId: 'oneiros-same-call-minimal-v1.1.0-candidate',
    promptSha256:
      '8e0edada074545954c77b10fa7558a41c40a7529caccfd4dfec5c60fe6cf0dc2',
  },
  {
    methodId: 'oneiros-same-call-minimal-v1.2.0-candidate',
    promptSha256:
      '4506c8981c1e0f38edcb641bf89e59126bfdafe64a3adff99a94a2d1a12e81f7',
  },
  {
    methodId: 'oneiros-question-integrity-gate-v1.0.0-candidate',
    promptSha256:
      'c1d8090fec6149adf492d1319657ba02bf5ae28ddfa5ce28114ef8a0df6629b2',
  },
  {
    methodId: 'oneiros-question-repair-v1.0.0-candidate',
    promptSha256:
      '0859fd5474124613b7c5cd610d4f48e65ccee6f0ea05b8d4ca382ddd5a53d53b',
  },
  {
    methodId: 'oneiros-question-premise-check-v1.0.0-candidate',
    promptSha256:
      'ceca45684d24ab1a0de374373b2c705e4eb75f7d18001a615246551289368130',
  },
  {
    methodId: 'oneiros-post-jungian-inviter-v2.0.1-candidate',
    promptSha256:
      '09045bf1860b2a2a6325e468cc19de019c351f0162cfa17c3f0a6153f3f3f35e',
  },
  {
    methodId: 'oneiros-post-reading-inviter-v1.0.0-candidate',
    promptSha256:
      '70c533e59b56693d5ade15a5234d2a7457ef194ba157750f67e884e13bb42cfa',
  },
  {
    methodId: REFLECTION_EDITORIAL_ARC_METHOD_ID,
    promptSha256:
      '6cd304e1c246f237f21743232de32723e81656f9c8cb3c4f51ee49fe26249b49',
  },
  {
    methodId: 'oneiros-reflection-editorial-arc-v1.0.0-candidate',
    promptSha256:
      '57a066e5a6a5414de80cb2ad54309b67a9ce0b74f22afbdf2aa72dab920f013a',
  },
  {
    methodId: 'oneiros-reflective-question-v4.1.0',
    promptSha256:
      'cf8a2d20a6f07968d3fbf1385ae4ac7d1ad66fe7ad731b173d7ef7d0ec6a64ca',
  },
  {
    methodId: 'reflective-question-oneiros-reader-v1.4.0',
    promptSha256:
      '0ea4b9a2364681124bdf582822c683754e28ae52ca6d7e7e7427e39f528b08b7',
  },
  {
    methodId: 'oneiros-reflective-question-v2.2.0',
    promptSha256:
      '295a65ef040e3e4eb367ab0674ac5244bfb737b7c3d60b41927d24d27783cf68',
  },
  {
    methodId: 'oneiros-reflective-question-v2.3.0',
    promptSha256:
      'caf278563f5d05cb1648991d11cf69695579abe0691bae25688bc374d8066ad3',
  },
  {
    methodId: 'oneiros-reflective-question-v2.3.1',
    promptSha256:
      '5e83f18775162a94364e9c5633bdd9befa788cf51e35406b9d02828fcd05b8f2',
  },
  {
    methodId: 'oneiros-reflective-question-v2.4.0',
    promptSha256:
      '046c22a679e06ad210db36466516e971eb2ecd8152da37cdb72a3e744dca39de',
  },
  {
    methodId: 'oneiros-reflective-question-v2.5.0',
    promptSha256:
      'ca2ac55bc93d6603bddbfb2e9d6981b7fe4e1355c30369323805a55a79a499bc',
  },
  {
    methodId: 'oneiros-reflective-question-v2.5.1',
    promptSha256:
      '096d96872e1cdbac47a09246a77b37eb9c114e6d230a40d76bb4e8d62064aaa5',
  },
  {
    methodId: 'oneiros-reflective-question-v2.6.0',
    promptSha256:
      '049865e98b12a9c066f5a63895a0c4dc5eadab044623a4cffb306ec6ed26aef7',
  },
  {
    methodId: 'oneiros-reflective-question-v2.6.1',
    promptSha256:
      '655d422981acde16b81b0eb430269677e2e96bbb19171284579386b0df0df429',
  },
  {
    methodId: 'oneiros-reflective-question-v2.7.0',
    promptSha256:
      '0f558e7eb1103331ddd3cdcabb382cbd0569f71f0aa88734874df0c52795b170',
  },
  {
    methodId: 'oneiros-reflective-question-v2.8.0',
    promptSha256:
      '25707b71d8cff289dada86c1736ef1209ba31c5288dff8652410e60194a4cd96',
  },
  {
    methodId: 'oneiros-reflective-question-v2.9.0',
    promptSha256:
      'b879081e9662ecdbddbec8ee76d0704e524da34527a663fee39098a883c86e3e',
  },
  {
    methodId: 'oneiros-reflective-question-v3.0.0',
    promptSha256:
      '1de5012d4d9d2a9e2c9382def2424edc2af407f6eec647a38362792abce7ef6e',
  },
  {
    methodId: 'oneiros-reflective-question-v3.1.0',
    promptSha256:
      '396c11f7633b62c09e74082c87539860d6adf07bde50aed8c06f531dc1dd88e4',
  },
  {
    methodId: 'oneiros-reflective-question-v3.2.0',
    promptSha256:
      'c60b6f7f356352e945549ecacf583ec026c67cf5da7fda01c1d1f61d2c6bcfaf',
  },
  {
    methodId: 'oneiros-reflective-question-v4.0.0',
    promptSha256:
      '599fdd53b90b5d4ab4565f2112371864e293b35d396e94244427df1b6ed59b80',
  },
] as const;

export const HISTORICAL_REFLECTIVE_QUESTION_COMPOSER_V1_0_0_SHA256 =
  '44a44cc43635d1939a10d3c3f70462b9e3576513a05af177350712903d49cbd2';

export const HISTORICAL_REFLECTIVE_QUESTION_COMPOSER_V1_0_1_SHA256 =
  '56150c8226dcda66302e29f6eab82b261e1874466095f08acb6062a8823d8ba9';

export const FROZEN_REFLECTIVE_QUESTION_RESEARCH_BASE_SHA256 =
  '08cd3eaf6fd507d6eb19ba73714eecf6453ec8dd6a61f55068621c8ffd80f622';

export const REFLECTIVE_QUESTION_RD_ROOT = 'src/ai/rd/reflective-questions';

export const REFLECTIVE_QUESTION_RUNTIME_FILES = [
  'src/ai/reflectiveQuestionExtract.ts',
  'src/ai/reflectiveQuestionPrompt.ts',
  'src/services/ai.ts',
  'supabase/functions/_shared/billing-ai.ts',
  'supabase/functions/ai-entitlements-gateway/index.ts',
] as const;

export class ReflectiveQuestionGatewayDeployBlockedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ReflectiveQuestionGatewayDeployBlockedError';
  }
}

function parseApprovalToken(
  token: string | null | undefined
): { methodId: string; promptSha256: string } | null {
  if (!token || !token.trim()) {
    return null;
  }
  const trimmed = token.trim();
  const splitAt = trimmed.lastIndexOf(':');
  if (splitAt <= 0 || splitAt === trimmed.length - 1) {
    throw new ReflectiveQuestionGatewayDeployBlockedError(
      `${REFLECTIVE_QUESTION_PRODUCTION_DEPLOY_APPROVAL_ENV} must be <methodId>:<sha256>. Received ${trimmed}.`
    );
  }
  return {
    methodId: trimmed.slice(0, splitAt),
    promptSha256: trimmed.slice(splitAt + 1).toLowerCase(),
  };
}

function findDeniedCandidate(methodId: string, promptSha256: string) {
  const sha = promptSha256.toLowerCase();
  return DENIED_REFLECTIVE_QUESTION_PRODUCTION_CANDIDATES.find(
    (candidate) =>
      candidate.methodId === methodId || candidate.promptSha256 === sha
  ) ?? null;
}

function isDenied(methodId: string, promptSha256: string): boolean {
  return Boolean(findDeniedCandidate(methodId, promptSha256));
}

function isRevoked(methodId: string, promptSha256: string): boolean {
  const sha = promptSha256.toLowerCase();
  return (
    REVOKED_REFLECTIVE_QUESTION_PRODUCTION.methodId === methodId ||
    REVOKED_REFLECTIVE_QUESTION_PRODUCTION.promptSha256 === sha
  );
}

export function assertReflectiveQuestionGatewayDeployAllowed(input: {
  localMethodId: string;
  localPromptSha256: string;
  approvalToken?: string | null;
}): void {
  const localSha = input.localPromptSha256.toLowerCase();
  const deniedCandidate = findDeniedCandidate(input.localMethodId, localSha);
  if (deniedCandidate) {
    throw new ReflectiveQuestionGatewayDeployBlockedError(
      [
        'Blocked ai-entitlements-gateway deploy: local reflective-question source is a denied candidate.',
        `Local: ${input.localMethodId} / ${localSha}`,
        `Denied: ${deniedCandidate.methodId} / ${deniedCandidate.promptSha256}`,
        `Approved production: ${APPROVED_REFLECTIVE_QUESTION_PRODUCTION.methodId}`,
        'Do not deploy a reflective-question identity that failed human-quality review.',
      ].join('\n')
    );
  }

  if (isRevoked(input.localMethodId, localSha)) {
    throw new ReflectiveQuestionGatewayDeployBlockedError(
      [
        'Blocked ai-entitlements-gateway deploy: local reflective-question identity was revoked after human review.',
        `Local: ${input.localMethodId} / ${localSha}`,
        `Reason: ${REVOKED_REFLECTIVE_QUESTION_PRODUCTION.reason}`,
        'Mechanical validity cannot override sterile literalism or failed psychological aliveness.',
      ].join('\n')
    );
  }

  const override = parseApprovalToken(input.approvalToken);
  const approved = APPROVED_REFLECTIVE_QUESTION_PRODUCTION;
  if (override && isDenied(override.methodId, override.promptSha256)) {
    throw new ReflectiveQuestionGatewayDeployBlockedError(
      `${REFLECTIVE_QUESTION_PRODUCTION_DEPLOY_APPROVAL_ENV} cannot approve a denied reflective-question candidate.`
    );
  }
  if (override && isRevoked(override.methodId, override.promptSha256)) {
    throw new ReflectiveQuestionGatewayDeployBlockedError(
      `${REFLECTIVE_QUESTION_PRODUCTION_DEPLOY_APPROVAL_ENV} cannot approve a human-quality-revoked reflective-question identity.`
    );
  }

  if (!approved) {
    throw new ReflectiveQuestionGatewayDeployBlockedError(
      [
        'Blocked ai-entitlements-gateway deploy: no reflective-question bundle currently has human-quality approval.',
        `Local: ${input.localMethodId} / ${localSha}`,
        'An environment token cannot lift the candidate hold. Update the code-owned approved identity only after the documented blind human review gates pass.',
      ].join('\n')
    );
  }

  if (
    override &&
    (override.methodId !== approved.methodId ||
      override.promptSha256.toLowerCase() !== approved.promptSha256.toLowerCase())
  ) {
    throw new ReflectiveQuestionGatewayDeployBlockedError(
      `${REFLECTIVE_QUESTION_PRODUCTION_DEPLOY_APPROVAL_ENV} does not match the code-owned approved reflective-question identity.`
    );
  }

  if (
    input.localMethodId !== approved.methodId ||
    localSha !== approved.promptSha256.toLowerCase()
  ) {
    throw new ReflectiveQuestionGatewayDeployBlockedError(
      [
        'Blocked ai-entitlements-gateway deploy: local reflective-question identity is not explicitly approved.',
        `Local: ${input.localMethodId} / ${localSha}`,
        `Approved: ${approved.methodId} / ${approved.promptSha256}`,
        `The local bundle must match the code-owned approved identity; an environment token cannot substitute for approval.`,
      ].join('\n')
    );
  }
}

const RUNTIME_RD_IMPORT =
  /from\s+['"][^'"]*(?:\/rd\/reflective-questions(?:['"]|\/)|reflectiveQuestion(?:Pipeline|Composer|ProductionHold|LanguageOperator|Minimalism|Witnessed|Surgical|Relation|Selection|OneirosReader)|questionPremiseCheck)/;

export function assertReflectiveQuestionRuntimeHasNoRdImports(
  source: string,
  label: string
): void {
  if (RUNTIME_RD_IMPORT.test(source)) {
    throw new ReflectiveQuestionGatewayDeployBlockedError(
      `Blocked: ${label} imports reflective-question R&D or the production-hold gate. Those modules are not runtime.`
    );
  }
}
