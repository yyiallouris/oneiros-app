/**
 * Fail-closed pre-deploy check for `ai-entitlements-gateway`.
 *
 * Launch identity is same-call Reader + questions. A second question
 * inference, Integrity Gate, Repair, Premise Check, or Composer path
 * blocks deploy.
 */
import { readFileSync } from 'fs';
import path from 'path';
import {
  APPROVED_REFLECTIVE_QUESTION_PRODUCTION,
  REFLECTIVE_QUESTION_PRODUCTION_DEPLOY_APPROVAL_ENV,
  REFLECTIVE_QUESTION_RUNTIME_FILES,
  SAME_CALL_REFLECTIVE_QUESTIONS_BUNDLE_SHA256,
  ReflectiveQuestionGatewayDeployBlockedError,
  assertReflectiveQuestionGatewayDeployAllowed,
  assertReflectiveQuestionRuntimeHasNoRdImports,
  hashReflectiveQuestionPrompt,
} from '../../src/ai/reflectiveQuestionProductionHold';
import {
  SAME_CALL_REFLECTIVE_QUESTIONS_BUNDLE,
  SAME_CALL_REFLECTIVE_QUESTIONS_METHOD_ID,
} from '../../src/ai/dreamReflectionPrompt';

const repoRoot = path.resolve(__dirname, '../..');
const readerPath = path.join(repoRoot, 'src/ai/dreamReflectionPrompt.ts');
const billingAiPath = path.join(repoRoot, 'supabase/functions/_shared/billing-ai.ts');
const gatewayPath = path.join(repoRoot, 'supabase/functions/ai-entitlements-gateway/index.ts');

function readLocalBundledMethod(): { methodId: string; promptSha256: string } {
  let readerSource: string;
  let billingAi: string;
  let gateway: string;
  try {
    readerSource = readFileSync(readerPath, 'utf8');
    billingAi = readFileSync(billingAiPath, 'utf8');
    gateway = readFileSync(gatewayPath, 'utf8');
  } catch {
    throw new ReflectiveQuestionGatewayDeployBlockedError(
      `Blocked ai-entitlements-gateway deploy: missing reader, billing-ai, or gateway source.`
    );
  }

  const localSha = hashReflectiveQuestionPrompt(SAME_CALL_REFLECTIVE_QUESTIONS_BUNDLE);
  if (localSha !== SAME_CALL_REFLECTIVE_QUESTIONS_BUNDLE_SHA256) {
    throw new ReflectiveQuestionGatewayDeployBlockedError(
      'Blocked ai-entitlements-gateway deploy: same-call question bundle SHA drifted.'
    );
  }
  if (
    !readerSource.includes('oneiros-same-call-reflective-questions-v1.0.0') ||
    !readerSource.includes('## Reflective Questions') ||
    !readerSource.includes('End with exactly one natural reflective question') ||
    !readerSource.includes('Exactly 2 questions as markdown bullets')
  ) {
    throw new ReflectiveQuestionGatewayDeployBlockedError(
      'Blocked ai-entitlements-gateway deploy: same-call question contract is missing from the Reader.'
    );
  }
  if (
    billingAi.includes('generateProductionReflectiveQuestion') ||
    billingAi.includes('generateReflectiveQuestionArtifact') ||
    billingAi.includes('resolveProductionReflectiveQuestion') ||
    billingAi.includes('QUESTION_INTEGRITY_GATE') ||
    billingAi.includes('QUESTION_REPAIR_TASK') ||
    billingAi.includes('QUESTION_PREMISE_CHECK') ||
    gateway.includes('generateReflectiveQuestionArtifact')
  ) {
    throw new ReflectiveQuestionGatewayDeployBlockedError(
      'Blocked ai-entitlements-gateway deploy: abandoned second-question pipeline is still in runtime.'
    );
  }
  if (!billingAi.includes('buildInitialReflectionRequest') || !billingAi.includes('extractSameCallReflectiveQuestions')) {
    throw new ReflectiveQuestionGatewayDeployBlockedError(
      'Blocked ai-entitlements-gateway deploy: same-call Reader extraction is missing from billing-ai.'
    );
  }

  return {
    methodId: SAME_CALL_REFLECTIVE_QUESTIONS_METHOD_ID,
    promptSha256: localSha,
  };
}

function assertRuntimeIsolation(): void {
  for (const rel of REFLECTIVE_QUESTION_RUNTIME_FILES) {
    const source = readFileSync(path.join(repoRoot, rel), 'utf8');
    assertReflectiveQuestionRuntimeHasNoRdImports(source, rel);
    if (
      /postJungianInviter|postReadingInviter|remainderFirst|candidateC|candidateB|questionIntegrityGate|sameCallMinimal/.test(source)
    ) {
      throw new ReflectiveQuestionGatewayDeployBlockedError(
        `Blocked: ${rel} still references a closed reflective-question R&D candidate.`
      );
    }
  }
}

try {
  assertRuntimeIsolation();
  const local = readLocalBundledMethod();
  assertReflectiveQuestionGatewayDeployAllowed({
    localMethodId: local.methodId,
    localPromptSha256: local.promptSha256,
    approvalToken: process.env[REFLECTIVE_QUESTION_PRODUCTION_DEPLOY_APPROVAL_ENV],
  });
  console.log(
    [
      'Reflective-question deploy guard passed.',
      `Local: ${local.methodId} / ${local.promptSha256}`,
      `Approved production: ${APPROVED_REFLECTIVE_QUESTION_PRODUCTION.methodId} / ${APPROVED_REFLECTIVE_QUESTION_PRODUCTION.promptSha256}`,
    ].join('\n')
  );
} catch (error) {
  const message =
    error instanceof Error ? error.message : 'Reflective-question deploy guard failed.';
  console.error(message);
  process.exit(1);
}
