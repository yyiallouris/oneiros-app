/**
 * Fail-closed pre-deploy check for `ai-entitlements-gateway`.
 *
 * Does not change runtime prompts. Exits 1 unless the local bundled
 * reflective-question method matches an approved production identity.
 * Missing or unparseable `src/ai/reflectiveQuestionPrompt.ts` is a hard fail.
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
  hashReflectiveQuestionPrompt,
} from '../../src/ai/reflectiveQuestionProductionHold';

const repoRoot = path.resolve(__dirname, '../..');
const promptPath = path.join(repoRoot, 'src/ai/reflectiveQuestionPrompt.ts');

function readLocalBundledMethod(): { methodId: string; promptSha256: string } {
  let source: string;
  try {
    source = readFileSync(promptPath, 'utf8');
  } catch {
    throw new ReflectiveQuestionGatewayDeployBlockedError(
      `Blocked ai-entitlements-gateway deploy: missing ${promptPath}. Cannot prove the bundled reflective-question identity matches recovered production.`
    );
  }

  const idMatch = source.match(
    /export const REFLECTIVE_QUESTION_METHOD_ID =\s*'([^']+)'/
  );
  const promptMatch = source.match(
    /export const REFLECTIVE_QUESTION_METHOD_PROMPT = `([\s\S]*?)`;/
  );
  if (!idMatch || !promptMatch) {
    throw new ReflectiveQuestionGatewayDeployBlockedError(
      'Blocked ai-entitlements-gateway deploy: could not parse local REFLECTIVE_QUESTION_METHOD_ID / PROMPT.'
    );
  }

  return {
    methodId: idMatch[1],
    promptSha256: hashReflectiveQuestionPrompt(promptMatch[1]),
  };
}

function assertRuntimeIsolation(): void {
  for (const rel of REFLECTIVE_QUESTION_RUNTIME_FILES) {
    const source = readFileSync(path.join(repoRoot, rel), 'utf8');
    assertReflectiveQuestionRuntimeHasNoRdImports(source, rel);
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
