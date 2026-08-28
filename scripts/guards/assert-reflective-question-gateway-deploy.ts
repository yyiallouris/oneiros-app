/**
 * Fail-closed pre-deploy check for `ai-entitlements-gateway`.
 *
 * Exits 1 unless the local reflective-question production orchestration
 * matches the approved identity. Frozen Generator/Gate/Repair/Premise Check
 * prompts must remain unchanged. Closed Inviter/editorial-arc identities
 * remain denied as standalone methods.
 */
import { readFileSync } from 'fs';
import path from 'path';
import {
  APPROVED_REFLECTIVE_QUESTION_PRODUCTION,
  REFLECTIVE_QUESTION_PRODUCTION_DEPLOY_APPROVAL_ENV,
  REFLECTIVE_QUESTION_RUNTIME_FILES,
  ReflectiveQuestionGatewayDeployBlockedError,
  assertReflectiveQuestionGatewayDeployAllowed,
  assertReflectiveQuestionRuntimeHasNoRdImports,
} from '../../src/ai/reflectiveQuestionProductionHold';
import {
  REFLECTIVE_QUESTION_PRODUCTION_BUNDLE_SHA256,
  REFLECTIVE_QUESTION_PRODUCTION_METHOD_ID,
  hashReflectiveQuestionProductionBundle,
} from '../../src/ai/reflectiveQuestionPipeline';
import {
  SAME_CALL_MINIMAL_BUNDLE_SHA256,
} from '../../src/ai/rd/reflective-questions/sameCallMinimal/sameCallMinimalCandidate';
import {
  QUESTION_INTEGRITY_GATE_BUNDLE_SHA256,
} from '../../src/ai/rd/reflective-questions/questionIntegrityGate/questionIntegrityGateCandidate';
import {
  QUESTION_REPAIR_BUNDLE_SHA256,
} from '../../src/ai/rd/reflective-questions/questionIntegrityGate/questionRepairCandidate';
import {
  QUESTION_PREMISE_CHECK_BUNDLE_SHA256,
} from '../../src/ai/questionPremiseCheck';

const repoRoot = path.resolve(__dirname, '../..');
const pipelinePath = path.join(repoRoot, 'src/ai/reflectiveQuestionPipeline.ts');
const readerPath = path.join(repoRoot, 'src/ai/dreamReflectionPrompt.ts');

function readLocalBundledMethod(): { methodId: string; promptSha256: string } {
  let pipelineSource: string;
  let readerSource: string;
  try {
    pipelineSource = readFileSync(pipelinePath, 'utf8');
    readerSource = readFileSync(readerPath, 'utf8');
  } catch {
    throw new ReflectiveQuestionGatewayDeployBlockedError(
      `Blocked ai-entitlements-gateway deploy: missing ${pipelinePath} or ${readerPath}.`
    );
  }

  if (
    !pipelineSource.includes('REFLECTIVE_QUESTION_PRODUCTION_BUNDLE') ||
    !pipelineSource.includes('oneiros-reflective-question-production-v1.0.0') ||
    !pipelineSource.includes('no-drop-no-rejected-leak-no-second-repair') ||
    hashReflectiveQuestionProductionBundle() !== REFLECTIVE_QUESTION_PRODUCTION_BUNDLE_SHA256
  ) {
    throw new ReflectiveQuestionGatewayDeployBlockedError(
      'Blocked ai-entitlements-gateway deploy: incomplete or mutated production orchestration bundle.'
    );
  }
  if (
    SAME_CALL_MINIMAL_BUNDLE_SHA256 !==
      '4506c8981c1e0f38edcb641bf89e59126bfdafe64a3adff99a94a2d1a12e81f7' ||
    QUESTION_INTEGRITY_GATE_BUNDLE_SHA256 !==
      'c1d8090fec6149adf492d1319657ba02bf5ae28ddfa5ce28114ef8a0df6629b2' ||
    QUESTION_REPAIR_BUNDLE_SHA256 !==
      '0859fd5474124613b7c5cd610d4f48e65ccee6f0ea05b8d4ca382ddd5a53d53b' ||
    QUESTION_PREMISE_CHECK_BUNDLE_SHA256 !==
      'ceca45684d24ab1a0de374373b2c705e4eb75f7d18001a615246551289368130'
  ) {
    throw new ReflectiveQuestionGatewayDeployBlockedError(
      'Blocked ai-entitlements-gateway deploy: frozen Generator/Gate/Repair/Premise Check SHA drifted.'
    );
  }
  if (
    !readerSource.includes('DREAM_CONSTITUTION_PROMPT') ||
    !readerSource.includes('END_MARKER_DREAM_READING') ||
    !readerSource.includes('oneiros-dream-reflection-v3.1.0-candidate')
  ) {
    throw new ReflectiveQuestionGatewayDeployBlockedError(
      'Blocked ai-entitlements-gateway deploy: Reader constitution is missing from the local reading module.'
    );
  }

  return {
    methodId: REFLECTIVE_QUESTION_PRODUCTION_METHOD_ID,
    promptSha256: REFLECTIVE_QUESTION_PRODUCTION_BUNDLE_SHA256,
  };
}

function assertRuntimeIsolation(): void {
  for (const rel of REFLECTIVE_QUESTION_RUNTIME_FILES) {
    const source = readFileSync(path.join(repoRoot, rel), 'utf8');
    assertReflectiveQuestionRuntimeHasNoRdImports(source, rel);
    if (
      /postJungianInviter|postReadingInviter|remainderFirst|candidateC|candidateB/.test(source)
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
