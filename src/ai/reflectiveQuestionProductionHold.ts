/**
 * Deploy-gate identity for the production reflective-question method.
 *
 * Canonical prompt text lives in `src/ai/reflectiveQuestionPrompt.ts`.
 * This module records recovered remote v105 identity, denied candidates,
 * and fail-closed deploy checks. Do not import it from client or gateway
 * request paths.
 *
 * Recovered 2026-08-27 from remote `ai-entitlements-gateway` version 105
 * (project `xacdawttvtfrdbcwhcqn`, updated 2026-08-26 11:50:26 UTC).
 */
import { createHash } from 'crypto';
import {
  REFLECTIVE_QUESTION_METHOD_ID,
  REFLECTIVE_QUESTION_METHOD_PROMPT,
  REFLECTIVE_QUESTION_METHOD_VERSION,
} from './reflectiveQuestionPrompt';

export const REFLECTIVE_QUESTION_PRODUCTION_DEPLOY_APPROVAL_ENV =
  'REFLECTIVE_QUESTION_PRODUCTION_DEPLOY_APPROVED';

export const REFLECTIVE_QUESTION_DEPLOYED_FUNCTION = 'ai-entitlements-gateway';
export const REFLECTIVE_QUESTION_DEPLOYED_PROJECT_REF = 'xacdawttvtfrdbcwhcqn';
export const REFLECTIVE_QUESTION_DEPLOYED_FUNCTION_VERSION = 105;
export const REFLECTIVE_QUESTION_DEPLOYED_UPDATED_AT_UTC = '2026-08-26T11:50:26Z';

export const RECOVERED_DEPLOYED_REFLECTIVE_QUESTION_METHOD_ID =
  REFLECTIVE_QUESTION_METHOD_ID;
export const RECOVERED_DEPLOYED_REFLECTIVE_QUESTION_METHOD_VERSION =
  REFLECTIVE_QUESTION_METHOD_VERSION;
export const RECOVERED_DEPLOYED_REFLECTIVE_QUESTION_PROMPT =
  REFLECTIVE_QUESTION_METHOD_PROMPT;

export function hashReflectiveQuestionPrompt(prompt: string): string {
  return createHash('sha256').update(prompt.trim()).digest('hex');
}

export const RECOVERED_DEPLOYED_REFLECTIVE_QUESTION_PROMPT_SHA256 =
  hashReflectiveQuestionPrompt(RECOVERED_DEPLOYED_REFLECTIVE_QUESTION_PROMPT);

/** Identity that may be deployed without an extra env override. */
export const APPROVED_REFLECTIVE_QUESTION_PRODUCTION = {
  methodId: RECOVERED_DEPLOYED_REFLECTIVE_QUESTION_METHOD_ID,
  promptSha256: RECOVERED_DEPLOYED_REFLECTIVE_QUESTION_PROMPT_SHA256,
} as const;

/** Local Oneiros Reader candidate. Never deploy this SHA. */
export const DENIED_REFLECTIVE_QUESTION_PRODUCTION_CANDIDATES = [
  {
    methodId: 'reflective-question-oneiros-reader-v1.4.0',
    promptSha256:
      '0ea4b9a2364681124bdf582822c683754e28ae52ca6d7e7e7427e39f528b08b7',
  },
] as const;

export const FROZEN_REFLECTIVE_QUESTION_RESEARCH_BASE_SHA256 =
  '08cd3eaf6fd507d6eb19ba73714eecf6453ec8dd6a61f55068621c8ffd80f622';

export const REFLECTIVE_QUESTION_RUNTIME_FILES = [
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

function isDenied(methodId: string, promptSha256: string): boolean {
  const sha = promptSha256.toLowerCase();
  return DENIED_REFLECTIVE_QUESTION_PRODUCTION_CANDIDATES.some(
    (candidate) =>
      candidate.methodId === methodId || candidate.promptSha256 === sha
  );
}

export function assertReflectiveQuestionGatewayDeployAllowed(input: {
  localMethodId: string;
  localPromptSha256: string;
  approvalToken?: string | null;
}): void {
  const localSha = input.localPromptSha256.toLowerCase();
  if (isDenied(input.localMethodId, localSha)) {
    throw new ReflectiveQuestionGatewayDeployBlockedError(
      [
        'Blocked ai-entitlements-gateway deploy: local reflective-question source is a denied candidate.',
        `Local: ${input.localMethodId} / ${localSha}`,
        `Denied: ${DENIED_REFLECTIVE_QUESTION_PRODUCTION_CANDIDATES[0].methodId} / ${DENIED_REFLECTIVE_QUESTION_PRODUCTION_CANDIDATES[0].promptSha256}`,
        `Recovered deployed production: ${APPROVED_REFLECTIVE_QUESTION_PRODUCTION.methodId} / ${APPROVED_REFLECTIVE_QUESTION_PRODUCTION.promptSha256}`,
        'Do not deploy rejected Oneiros Reader v1.4.0 over production.',
      ].join('\n')
    );
  }

  const override = parseApprovalToken(input.approvalToken);
  const approved = override ?? APPROVED_REFLECTIVE_QUESTION_PRODUCTION;
  if (override && isDenied(override.methodId, override.promptSha256)) {
    throw new ReflectiveQuestionGatewayDeployBlockedError(
      `${REFLECTIVE_QUESTION_PRODUCTION_DEPLOY_APPROVAL_ENV} cannot approve a denied reflective-question candidate.`
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
        override
          ? `Override came from ${REFLECTIVE_QUESTION_PRODUCTION_DEPLOY_APPROVAL_ENV}.`
          : `Set ${REFLECTIVE_QUESTION_PRODUCTION_DEPLOY_APPROVAL_ENV}=<methodId>:<sha256> only for a non-denied identity that matches the local bundle.`,
      ].join('\n')
    );
  }
}

const RUNTIME_RD_IMPORT =
  /from\s+['"][^'"]*(?:\/rd\/reflective-questions|reflectiveQuestion(?:ProductionHold|LanguageOperator|Minimalism|Witnessed|Surgical|Relation|Selection|OneirosReader))/;

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
