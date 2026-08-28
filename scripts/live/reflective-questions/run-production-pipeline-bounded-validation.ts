/**
 * Bounded production-pipeline validation on the frozen 24-question corpus.
 * Reuses Generator questions as-is. Does not rerun the Reader/Generator.
 * Critical stop: ja-neon-home:standard must not surface unchanged.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { estimateAiCallCost, type AiCallCost } from '../../../src/billing/aiPricing';
import {
  QUESTION_INTEGRITY_GATE_BUNDLE_SHA256,
  QUESTION_INTEGRITY_GATE_MODEL,
  QUESTION_INTEGRITY_GATE_TASK,
  QUESTION_INTEGRITY_GATE_TEMPERATURE,
  QUESTION_INTEGRITY_GATE_TOKEN_LIMIT,
  buildQuestionIntegrityGateMessages,
  buildQuestionIntegrityGateResponseFormat,
  hashQuestionIntegrityGateBundle,
  parseQuestionIntegrityGateResult,
} from '../../../src/ai/rd/reflective-questions/questionIntegrityGate/questionIntegrityGateCandidate';
import {
  QUESTION_REPAIR_BUNDLE_SHA256,
  QUESTION_REPAIR_MODEL,
  QUESTION_REPAIR_TASK,
  QUESTION_REPAIR_TEMPERATURE,
  QUESTION_REPAIR_TOKEN_LIMIT,
  buildQuestionRepairMessages,
  buildQuestionRepairResponseFormat,
  hashQuestionRepairBundle,
  parseQuestionRepairResult,
} from '../../../src/ai/rd/reflective-questions/questionIntegrityGate/questionRepairCandidate';
import { SAME_CALL_MINIMAL_BUNDLE_SHA256 } from '../../../src/ai/rd/reflective-questions/sameCallMinimal/sameCallMinimalCandidate';
import {
  QUESTION_PREMISE_CHECK_BUNDLE_SHA256,
  QUESTION_PREMISE_CHECK_MODEL,
  QUESTION_PREMISE_CHECK_TASK,
  QUESTION_PREMISE_CHECK_TEMPERATURE,
  QUESTION_PREMISE_CHECK_TOKEN_LIMIT,
  buildQuestionPremiseCheckMessages,
  buildQuestionPremiseCheckResponseFormat,
  hashQuestionPremiseCheckBundle,
  parseQuestionPremiseCheckResult,
} from '../../../src/ai/questionPremiseCheck';
import {
  REFLECTIVE_QUESTION_PRODUCTION_METHOD_ID,
  resolveProductionReflectiveQuestion,
} from '../../../src/ai/reflectiveQuestionPipeline';
import { APPROVED_REFLECTIVE_QUESTION_PRODUCTION } from '../../../src/ai/reflectiveQuestionProductionHold';
import { getReflectiveQuestionFallback } from '../../../src/constants/reflectiveQuestionCopy';
import {
  loadAndPrepareQuestionIntegrityGateCorpus,
  type IntegrityGatePreparedCase,
} from '../../lib/questionIntegrityGateCorpus';

const RUN_ID = 'oneiros-reflective-question-production-bounded-v1' as const;
const APPROVAL_ENV = 'ONEIROS_REFLECTIVE_QUESTION_PRODUCTION_VALIDATION_COST_APPROVED' as const;
const COST_CAP_USD = 1.50 as const;
const TRANSPORT_RETRY_LIMIT = 1 as const;
const HOME_STANDARD_ID = 'ja-neon-home:standard' as const;

type PromptMessage = { role: 'system' | 'user'; content: string };
type ProxyCallResult = {
  content: string;
  provider: string | null;
  model: string | null;
  latencyMs: number;
  cost: AiCallCost;
  retries: number;
};

function loadDotenvValue(key: string): string | undefined {
  const envPath = path.join(process.cwd(), '.env');
  if (!existsSync(envPath)) return undefined;
  return readFileSync(envPath, 'utf8')
    .match(new RegExp(`^${key}\\s*=\\s*(.*)$`, 'm'))?.[1]
    ?.trim().replace(/^['"]|['"]$/gu, '');
}

function getEnv(keys: string[]): string {
  for (const key of keys) {
    const value = process.env[key] ?? loadDotenvValue(key);
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
}

async function getAccessToken(supabaseUrl: string, anonKey: string): Promise<string> {
  const existing = getEnv(['LIVE_SUPABASE_ACCESS_TOKEN', 'SUPABASE_ACCESS_TOKEN']);
  if (existing) return existing;
  const email = getEnv(['LIVE_SUPABASE_EMAIL']);
  const password = getEnv(['LIVE_SUPABASE_PASSWORD']);
  if (!email || !password) {
    throw new Error('Missing LIVE_SUPABASE_ACCESS_TOKEN or LIVE_SUPABASE_EMAIL/PASSWORD.');
  }
  const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: anonKey },
    body: JSON.stringify({ email, password }),
  });
  if (!response.ok) throw new Error(`Supabase auth failed (${response.status}).`);
  const token = (await response.json() as { access_token?: string }).access_token;
  if (!token) throw new Error('Supabase auth succeeded without an access token.');
  return token;
}

function extractContent(payload: Record<string, unknown>): string {
  const choices = Array.isArray(payload.choices)
    ? payload.choices as Array<{ message?: { content?: string } }>
    : [];
  const value = choices[0]?.message?.content ??
    (typeof payload.content === 'string' ? payload.content : undefined) ??
    (typeof payload.text === 'string' ? payload.text : undefined);
  if (typeof value !== 'string' || !value.trim()) throw new Error('pipeline_empty_content');
  return value.trim();
}

function assertUsedGpt54(model: string | null, label: string): void {
  const id = (model ?? '').trim().toLowerCase();
  if (!id.startsWith('gpt-5.4') || id.includes('mini') || id.includes('nano')) {
    throw new Error(`${label} must run on gpt-5.4. Got ${model ?? 'unknown'}.`);
  }
}

async function callProxy(params: {
  endpoint: string;
  anonKey: string;
  token: string;
  model: string;
  task: string;
  temperature: number;
  tokenLimit: number;
  messages: PromptMessage[];
  responseFormat: Record<string, unknown>;
  label: string;
}): Promise<ProxyCallResult> {
  let lastError: unknown = null;
  for (let attempt = 0; attempt <= TRANSPORT_RETRY_LIMIT; attempt += 1) {
    const startedAt = Date.now();
    try {
      const response = await fetch(params.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: params.anonKey,
          Authorization: `Bearer ${params.token}`,
        },
        body: JSON.stringify({
          model: params.model,
          task: params.task,
          messages: params.messages,
          temperature: params.temperature,
          max_completion_tokens: params.tokenLimit,
          max_tokens: params.tokenLimit,
          response_format: params.responseFormat,
          disable_anthropic_fallback: true,
        }),
      });
      if (!response.ok) throw new Error(`${params.label}_http_${response.status}`);
      const payload = await response.json() as Record<string, unknown>;
      const provider = response.headers.get('x-ai-provider')?.trim().toLowerCase() ?? null;
      const model = (typeof payload.model === 'string' ? payload.model : null)
        ?? response.headers.get('x-ai-model');
      return {
        content: extractContent(payload),
        provider,
        model,
        latencyMs: Date.now() - startedAt,
        cost: estimateAiCallCost(payload, provider),
        retries: attempt,
      };
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError instanceof Error ? lastError : new Error(`${params.label}_transport_failed`);
}

async function main(): Promise<void> {
  if (process.env[APPROVAL_ENV] !== '1') {
    throw new Error(`Paid run locked. Set ${APPROVAL_ENV}=1 only after explicit approval.`);
  }
  if (
    APPROVED_REFLECTIVE_QUESTION_PRODUCTION
    && APPROVED_REFLECTIVE_QUESTION_PRODUCTION.methodId !== REFLECTIVE_QUESTION_PRODUCTION_METHOD_ID
  ) {
    throw new Error('Unexpected non-production approval identity; refusing bounded validation.');
  }
  if (hashQuestionIntegrityGateBundle() !== QUESTION_INTEGRITY_GATE_BUNDLE_SHA256) {
    throw new Error('Integrity Gate SHA mismatch. Refusing.');
  }
  if (hashQuestionRepairBundle() !== QUESTION_REPAIR_BUNDLE_SHA256) {
    throw new Error('Repair SHA mismatch. Refusing.');
  }
  if (hashQuestionPremiseCheckBundle() !== QUESTION_PREMISE_CHECK_BUNDLE_SHA256) {
    throw new Error('Premise Check SHA mismatch. Refusing.');
  }

  const prepared = loadAndPrepareQuestionIntegrityGateCorpus();
  const supabaseUrl = getEnv(['EXPO_PUBLIC_SUPABASE_URL', 'SUPABASE_URL']);
  const anonKey = getEnv(['EXPO_PUBLIC_SUPABASE_ANON_KEY', 'SUPABASE_ANON_KEY']);
  if (!supabaseUrl || !anonKey) throw new Error('Missing Supabase URL/anon key.');
  const token = await getAccessToken(supabaseUrl, anonKey);
  const endpoint = `${supabaseUrl}/functions/v1/openai-proxy`;
  const gateFormat = buildQuestionIntegrityGateResponseFormat();
  const premiseFormat = buildQuestionPremiseCheckResponseFormat();
  const repairFormat = buildQuestionRepairResponseFormat();

  let knownSpend = 0;
  const spend = (cost: AiCallCost | null | undefined) => {
    if (typeof cost?.estimatedUsd === 'number') knownSpend += cost.estimatedUsd;
    if (knownSpend > COST_CAP_USD) throw new Error('hard_cost_cap_exceeded');
  };

  const trials: Array<IntegrityGatePreparedCase & {
    source: string;
    final_question: string;
    original_surfaced: boolean;
    generator_gate: string | null;
    generator_premise: string | null;
    repair_gate: string | null;
    repair_premise: string | null;
    gate_call_count: number;
    repair_call_count: number;
    premise_call_count: number;
    estimated_usd: number;
    errors: string[];
  }> = [];

  for (const entry of prepared.cases) {
    const caseSpendStart = knownSpend;
    const result = await resolveProductionReflectiveQuestion({
      generatorQuestion: entry.question,
      depth: entry.depth,
      outputLanguage: entry.language,
    }, {
      runIntegrityGate: async (question) => {
        const call = await callProxy({
          endpoint,
          anonKey,
          token,
          model: QUESTION_INTEGRITY_GATE_MODEL,
          task: QUESTION_INTEGRITY_GATE_TASK,
          temperature: QUESTION_INTEGRITY_GATE_TEMPERATURE,
          tokenLimit: QUESTION_INTEGRITY_GATE_TOKEN_LIMIT,
          messages: buildQuestionIntegrityGateMessages({
            dream: entry.dream,
            candidateQuestion: question,
            outputLanguage: entry.language,
            questionMode: entry.question_mode,
          }),
          responseFormat: gateFormat,
          label: 'gate',
        });
        spend(call.cost);
        assertUsedGpt54(call.model, 'Integrity Gate');
        const parsed = parseQuestionIntegrityGateResult(call.content);
        return parsed.ok ? parsed.data : null;
      },
      runPremiseCheck: async (question) => {
        const call = await callProxy({
          endpoint,
          anonKey,
          token,
          model: QUESTION_PREMISE_CHECK_MODEL,
          task: QUESTION_PREMISE_CHECK_TASK,
          temperature: QUESTION_PREMISE_CHECK_TEMPERATURE,
          tokenLimit: QUESTION_PREMISE_CHECK_TOKEN_LIMIT,
          messages: buildQuestionPremiseCheckMessages({
            dream: entry.dream,
            question,
            outputLanguage: entry.language,
          }),
          responseFormat: premiseFormat,
          label: 'premise',
        });
        spend(call.cost);
        assertUsedGpt54(call.model, 'Premise Check');
        const parsed = parseQuestionPremiseCheckResult(call.content);
        if (!parsed.ok) return null;
        return { pass: parsed.data.decision === 'PASS' };
      },
      runRepair: async (question, violations) => {
        const call = await callProxy({
          endpoint,
          anonKey,
          token,
          model: QUESTION_REPAIR_MODEL,
          task: QUESTION_REPAIR_TASK,
          temperature: QUESTION_REPAIR_TEMPERATURE,
          tokenLimit: QUESTION_REPAIR_TOKEN_LIMIT,
          messages: buildQuestionRepairMessages({
            dream: entry.dream,
            rejectedQuestion: question,
            violations,
            outputLanguage: entry.language,
            questionMode: entry.question_mode,
          }),
          responseFormat: repairFormat,
          label: 'repair',
        });
        spend(call.cost);
        assertUsedGpt54(call.model, 'Repair');
        const parsed = parseQuestionRepairResult(call.content);
        return parsed.ok ? parsed.data.question : null;
      },
    });

    trials.push({
      ...entry,
      source: result.source,
      final_question: result.question,
      original_surfaced: result.question === entry.question,
      generator_gate: result.generatorGateDecision,
      generator_premise: result.generatorPremiseDecision,
      repair_gate: result.repairGateDecision,
      repair_premise: result.repairPremiseDecision,
      gate_call_count: result.gateCallCount,
      repair_call_count: result.repairCallCount,
      premise_call_count: result.premiseCallCount,
      estimated_usd: knownSpend - caseSpendStart,
      errors: [],
    });
  }

  const homeStandard = trials.find((trial) => trial.id === HOME_STANDARD_ID);
  if (!homeStandard) throw new Error('HOME Standard missing from bounded validation.');
  const homeStandardLeaked = homeStandard.original_surfaced;
  const hardFailLeaks = trials.filter((trial) => trial.expect_gate_fail && trial.original_surfaced);
  const emptyFinals = trials.filter((trial) => !trial.final_question.trim());
  const overRepair = trials.filter((trial) => trial.repair_call_count > 1);
  const overGate = trials.filter((trial) => trial.gate_call_count > 2);
  const originalPass = trials.filter((trial) => trial.source === 'generator').length;
  const repairRate = trials.filter((trial) => trial.source === 'repair').length;
  const fallbackRate = trials.filter((trial) => trial.source === 'fallback').length;
  const premiseFailRate = trials.filter((trial) => (
    trial.generator_premise === 'fail' || trial.repair_premise === 'fail'
  )).length;

  const generatedAt = new Date().toISOString();
  const outputDir = path.join(
    process.cwd(),
    'tmp',
    `reflective-question-production-bounded-${generatedAt.replace(/[:.]/gu, '-')}`
  );
  mkdirSync(outputDir, { recursive: true });

  const report = [
    '# Bounded production pipeline validation',
    '',
    `Orchestration: \`${REFLECTIVE_QUESTION_PRODUCTION_METHOD_ID}\``,
    `Generator SHA: \`${SAME_CALL_MINIMAL_BUNDLE_SHA256}\``,
    `Gate SHA: \`${QUESTION_INTEGRITY_GATE_BUNDLE_SHA256}\``,
    `Repair SHA: \`${QUESTION_REPAIR_BUNDLE_SHA256}\``,
    `Premise Check SHA: \`${QUESTION_PREMISE_CHECK_BUNDLE_SHA256}\``,
    '',
    `original_pass: ${originalPass}/24`,
    `repair_rate: ${repairRate}/24`,
    `deterministic_fallback_rate: ${fallbackRate}/24`,
    `premise_check_fail_rate: ${premiseFailRate}/24`,
    '',
    `HOME Standard original surfaced: ${homeStandardLeaked ? 'YES — STOP' : 'no'}`,
    `HOME Standard source: ${homeStandard.source}`,
    `HOME Standard generator premise: ${homeStandard.generator_premise}`,
    '',
    ...trials.map((trial) => (
      `- ${trial.id}: ${trial.source}${trial.original_surfaced ? ' (original surfaced)' : ''} [g1=${trial.generator_gate}/p1=${trial.generator_premise} r=${trial.repair_call_count} g2=${trial.repair_gate}/p2=${trial.repair_premise}]`
    )),
    '',
  ].join('\n');

  writeFileSync(path.join(outputDir, 'REPORT.md'), report);
  writeFileSync(path.join(outputDir, 'SUMMARY.json'), JSON.stringify({
    run_id: RUN_ID,
    generated_at: generatedAt,
    original_pass_rate: originalPass / 24,
    repair_rate: repairRate / 24,
    fallback_rate: fallbackRate / 24,
    premise_check_fail_rate: premiseFailRate / 24,
    home_standard_original_surfaced: homeStandardLeaked,
    home_standard_source: homeStandard.source,
    hard_fail_original_leaks: hardFailLeaks.map((trial) => trial.id),
    spend_usd: knownSpend,
    generator_sha256: SAME_CALL_MINIMAL_BUNDLE_SHA256,
    gate_sha256: QUESTION_INTEGRITY_GATE_BUNDLE_SHA256,
    repair_sha256: QUESTION_REPAIR_BUNDLE_SHA256,
    premise_sha256: QUESTION_PREMISE_CHECK_BUNDLE_SHA256,
  }, null, 2));
  writeFileSync(path.join(outputDir, 'TRIALS.json'), JSON.stringify({
    generated_at: generatedAt,
    trials: trials.map((trial) => ({
      id: trial.id,
      depth: trial.depth,
      language: trial.language,
      role: trial.role,
      source: trial.source,
      original_surfaced: trial.original_surfaced,
      generator_gate: trial.generator_gate,
      generator_premise: trial.generator_premise,
      repair_gate: trial.repair_gate,
      repair_premise: trial.repair_premise,
      gate_call_count: trial.gate_call_count,
      repair_call_count: trial.repair_call_count,
      premise_call_count: trial.premise_call_count,
      estimated_usd: trial.estimated_usd,
      final_question: trial.final_question,
    })),
  }, null, 2));

  process.stdout.write(`${report}\nWritten to ${outputDir}\nSpend: $${knownSpend.toFixed(8)}\n`);

  if (homeStandardLeaked) {
    throw new Error(
      'STOP. Premise Check allowed ja-neon-home:standard through unchanged. Do not productionize.'
    );
  }
  if (hardFailLeaks.length > 0) {
    throw new Error(`STOP. Known hard semantic originals leaked: ${hardFailLeaks.map((trial) => trial.id).join(', ')}`);
  }
  if (emptyFinals.length > 0 || overRepair.length > 0 || overGate.length > 0) {
    throw new Error('STOP. Pipeline invariant broken (empty final, extra Repair, or extra Gate).');
  }
  process.stdout.write('BOUNDED VALIDATION PASS. HOME Standard did not surface unchanged.\n');
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
