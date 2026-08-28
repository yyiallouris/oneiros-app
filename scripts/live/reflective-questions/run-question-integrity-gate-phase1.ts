/**
 * Phase 1 Integrity Gate benchmark. Frozen historical questions only.
 * No new Reader outputs. No Repair. No rewrite. No deploy.
 * Gate never receives the generated reading.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { estimateAiCallCost, type AiCallCost } from '../../../src/billing/aiPricing';
import {
  QUESTION_INTEGRITY_GATE_BUNDLE_SHA256,
  QUESTION_INTEGRITY_GATE_METHOD_ID,
  QUESTION_INTEGRITY_GATE_MODEL,
  QUESTION_INTEGRITY_GATE_PROMPT_ID,
  QUESTION_INTEGRITY_GATE_PROMPT_VERSION,
  QUESTION_INTEGRITY_GATE_TASK,
  QUESTION_INTEGRITY_GATE_TEMPERATURE,
  QUESTION_INTEGRITY_GATE_TOKEN_LIMIT,
  buildQuestionIntegrityGateMessages,
  buildQuestionIntegrityGateResponseFormat,
  hashQuestionIntegrityGateBundle,
  parseQuestionIntegrityGateResult,
  type QuestionIntegrityGateResponseFormat,
  type QuestionIntegrityViolationId,
} from '../../../src/ai/rd/reflective-questions/questionIntegrityGate/questionIntegrityGateCandidate';
import { SAME_CALL_MINIMAL_BUNDLE_SHA256 } from '../../../src/ai/rd/reflective-questions/sameCallMinimal/sameCallMinimalCandidate';
import { APPROVED_REFLECTIVE_QUESTION_PRODUCTION } from '../../../src/ai/reflectiveQuestionProductionHold';
import {
  loadAndPrepareQuestionIntegrityGateCorpus,
  type IntegrityGatePreparedCase,
} from '../../lib/questionIntegrityGateCorpus';

const GATE_ID = 'oneiros-question-integrity-gate-v1-phase1' as const;
const APPROVAL_ENV = 'ONEIROS_QUESTION_INTEGRITY_GATE_PHASE1_COST_APPROVED' as const;
const COST_CAP_USD = 1.00 as const;
const TRANSPORT_RETRY_LIMIT = 1 as const;
const EXPECTED_GENERATOR_SHA256 = SAME_CALL_MINIMAL_BUNDLE_SHA256;

type PromptMessage = { role: 'system' | 'user'; content: string };

type ProxyCallResult = {
  content: string;
  provider: string | null;
  model: string | null;
  latencyMs: number;
  cost: AiCallCost;
  retries: number;
};

type Trial = IntegrityGatePreparedCase & {
  gate_pass: boolean | null;
  gate_violations: QuestionIntegrityViolationId[];
  raw_content: string;
  errors: string[];
  provider: string | null;
  model: string | null;
  latency_ms: number | null;
  estimated_usd: number | null;
  retries: number;
  true_positive: boolean;
  false_negative: boolean;
  false_positive_control: boolean;
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
  if (typeof value !== 'string' || !value.trim()) throw new Error('integrity_gate_empty_content');
  return value.trim();
}

function assertUsedGpt54(model: string | null): void {
  const id = (model ?? '').trim().toLowerCase();
  if (!id.startsWith('gpt-5.4') || id.includes('mini') || id.includes('nano')) {
    throw new Error(`Integrity Gate Phase 1 must run on gpt-5.4. Got ${model ?? 'unknown'}.`);
  }
}

function conservativeMaximumUsd(messages: PromptMessage[]): number {
  const inputBytes = Buffer.byteLength(JSON.stringify(messages), 'utf8');
  return (inputBytes * 2.5 + QUESTION_INTEGRITY_GATE_TOKEN_LIMIT * 15) / 1_000_000;
}

async function callGate(params: {
  endpoint: string;
  anonKey: string;
  token: string;
  messages: PromptMessage[];
  responseFormat: QuestionIntegrityGateResponseFormat;
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
          model: QUESTION_INTEGRITY_GATE_MODEL,
          task: QUESTION_INTEGRITY_GATE_TASK,
          messages: params.messages,
          temperature: QUESTION_INTEGRITY_GATE_TEMPERATURE,
          max_completion_tokens: QUESTION_INTEGRITY_GATE_TOKEN_LIMIT,
          max_tokens: QUESTION_INTEGRITY_GATE_TOKEN_LIMIT,
          response_format: params.responseFormat,
          disable_anthropic_fallback: true,
        }),
      });
      if (!response.ok) throw new Error(`integrity_gate_http_${response.status}`);
      const payload = await response.json() as Record<string, unknown>;
      const provider = response.headers.get('x-ai-provider')?.trim().toLowerCase() ?? null;
      return {
        content: extractContent(payload),
        provider,
        model: response.headers.get('x-ai-model')?.trim() ??
          (typeof payload.model === 'string' ? payload.model : null),
        latencyMs: Date.now() - startedAt,
        cost: estimateAiCallCost(payload, provider),
        retries: attempt,
      };
    } catch (error) {
      lastError = error;
      const message = error instanceof Error ? error.message : String(error);
      const transport = /integrity_gate_http_|fetch|network|ECONN|ETIMEDOUT|socket/iu.test(message);
      if (!transport || attempt === TRANSPORT_RETRY_LIMIT) throw error;
    }
  }
  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

function block(value: string): string {
  return value.split('\n').map((line) => `> ${line}`).join('\n');
}

function report(trials: Trial[]): string {
  const regressions = trials.filter((trial) => trial.expect_gate_fail);
  const controls = trials.filter((trial) => (
    trial.editorial_score === 'GOLD' || trial.editorial_score === 'SHIP'
  ) && !trial.expect_gate_fail);
  const truePositives = regressions.filter((trial) => trial.true_positive).length;
  const falseNegatives = regressions.filter((trial) => trial.false_negative).length;
  const falsePositives = controls.filter((trial) => trial.false_positive_control).length;
  const recall = regressions.length === 0 ? 0 : truePositives / regressions.length;
  const falsePositiveRate = controls.length === 0 ? 0 : falsePositives / controls.length;
  const byLanguage = [...new Set(trials.map((trial) => trial.language))].sort().map((language) => {
    const subset = trials.filter((trial) => trial.language === language);
    const failed = subset.filter((trial) => trial.gate_pass === false).length;
    return `- ${language}: ${subset.length} calls, ${failed} gate FAIL`;
  });
  const byViolation = new Map<string, number>();
  for (const trial of trials) {
    for (const id of trial.gate_violations) {
      byViolation.set(id, (byViolation.get(id) ?? 0) + 1);
    }
  }
  const violationLines = [...byViolation.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([id, count]) => `- ${id}: ${count}`);
  const inspect = trials.filter((trial) => trial.role === 'inspect');
  return [
    '# Integrity Gate Phase 1 report',
    '',
    'Editorial GOLD/SHIP/WEAK/FAIL is historical scoring of the candidate questions.',
    'This report is gate detection only. No Repair ran.',
    '',
    `Hard-FAIL regressions: ${truePositives}/${regressions.length} recalled (${(recall * 100).toFixed(1)}%).`,
    `False negatives: ${falseNegatives}.`,
    `GOLD/SHIP false positives: ${falsePositives}/${controls.length} (${(falsePositiveRate * 100).toFixed(1)}%).`,
    '',
    recall < 1
      ? 'PRIMARY METRIC: MISS. Do not build Repair.'
      : 'PRIMARY METRIC: hard-FAIL recall 100% on the regression set.',
    '',
    '## By language',
    '',
    ...byLanguage,
    '',
    '## Violations flagged',
    '',
    ...(violationLines.length > 0 ? violationLines : ['- none']),
    '',
    '## Regression cases',
    '',
    ...regressions.map((trial) => (
      `- ${trial.id}: expected FAIL, gate ${trial.gate_pass === false ? 'FAIL' : trial.gate_pass === true ? 'PASS' : 'ERROR'} [${trial.gate_violations.join(', ') || 'none'}]`
    )),
    '',
    '## Inspect cases',
    '',
    ...inspect.map((trial) => (
      `- ${trial.id} (${trial.editorial_score}): gate ${trial.gate_pass === false ? 'FAIL' : trial.gate_pass === true ? 'PASS' : 'ERROR'} [${trial.gate_violations.join(', ') || 'none'}]`
    )),
    '',
  ].join('\n');
}

function packet(generatedAt: string, trials: Trial[]): string {
  return [
    '# Blind Integrity Gate Phase 1',
    '',
    `Generated: ${generatedAt}`,
    '',
    'Each item is dream + candidate question only. No reading.',
    '',
    ...trials.flatMap((trial) => [
      `## ${trial.id}`,
      '',
      `Language: ${trial.language}. Mode: ${trial.depth} → ${trial.question_mode}. Role: ${trial.role}. Editorial: ${trial.editorial_score}.`,
      '',
      '**Dream**',
      '',
      block(trial.dream),
      '',
      '**Candidate question**',
      '',
      block(trial.question),
      '',
      `**Gate:** ${trial.gate_pass === true ? 'PASS' : trial.gate_pass === false ? 'FAIL' : 'ERROR'}`,
      trial.gate_violations.length > 0
        ? `**Violations:** ${trial.gate_violations.join(', ')}`
        : '**Violations:** none',
      trial.errors.length > 0 ? `**Errors:** ${trial.errors.join(', ')}` : '',
      '',
    ]),
  ].filter((line, index, lines) => !(line === '' && lines[index - 1] === '')).join('\n');
}

async function main(): Promise<void> {
  if (process.env[APPROVAL_ENV] !== '1') {
    throw new Error(`Paid run locked. Set ${APPROVAL_ENV}=1 only after explicit approval.`);
  }
  if (APPROVED_REFLECTIVE_QUESTION_PRODUCTION !== null) {
    throw new Error('Unexpected production approval state; refusing integrity-gate Phase 1.');
  }

  const candidateSha = hashQuestionIntegrityGateBundle();
  if (candidateSha !== QUESTION_INTEGRITY_GATE_BUNDLE_SHA256) {
    throw new Error(`Integrity Gate SHA mismatch. Refusing to run. Got ${candidateSha}.`);
  }
  const prepared = loadAndPrepareQuestionIntegrityGateCorpus();
  if (prepared.cases.length !== 24) {
    throw new Error(`Expected 24 frozen questions, got ${prepared.cases.length}.`);
  }

  const responseFormat = buildQuestionIntegrityGateResponseFormat();
  const requests = prepared.cases.map((entry) => ({
    entry,
    messages: buildQuestionIntegrityGateMessages({
      dream: entry.dream,
      candidateQuestion: entry.question,
      outputLanguage: entry.language,
      questionMode: entry.question_mode,
    }),
  }));
  for (const item of requests) {
    const joined = item.messages.map((message) => message.content).join('\n');
    if (joined.includes('BEGIN_DREAM_READING') || /Core (Tension|Shift|Restoration)/u.test(joined)) {
      throw new Error(`Gate input leaked a reading for ${item.entry.id}.`);
    }
  }

  const maximumUsd = requests.reduce(
    (sum, item) => sum + conservativeMaximumUsd(item.messages),
    0
  );
  if (maximumUsd > COST_CAP_USD) {
    throw new Error(`Conservative preflight $${maximumUsd.toFixed(6)} exceeds $${COST_CAP_USD}.`);
  }

  const supabaseUrl = getEnv(['EXPO_PUBLIC_SUPABASE_URL', 'SUPABASE_URL']);
  const anonKey = getEnv(['EXPO_PUBLIC_SUPABASE_ANON_KEY', 'SUPABASE_ANON_KEY']);
  if (!supabaseUrl || !anonKey) throw new Error('Missing Supabase URL/anon key.');
  const token = await getAccessToken(supabaseUrl, anonKey);
  const endpoint = `${supabaseUrl}/functions/v1/openai-proxy`;
  const trials: Trial[] = [];
  let knownSpend = 0;

  for (const item of requests) {
    try {
      const call = await callGate({
        endpoint,
        anonKey,
        token,
        messages: item.messages,
        responseFormat,
      });
      if (typeof call.cost.estimatedUsd === 'number') knownSpend += call.cost.estimatedUsd;
      if (knownSpend > COST_CAP_USD) throw new Error('hard_cost_cap_exceeded');
      assertUsedGpt54(call.model);
      const parsed = parseQuestionIntegrityGateResult(call.content);
      if (!parsed.ok) {
        trials.push({
          ...item.entry,
          gate_pass: null,
          gate_violations: [],
          raw_content: call.content,
          errors: parsed.errors,
          provider: call.provider,
          model: call.model,
          latency_ms: call.latencyMs,
          estimated_usd: call.cost.estimatedUsd,
          retries: call.retries,
          true_positive: false,
          false_negative: item.entry.expect_gate_fail,
          false_positive_control: false,
        });
        continue;
      }
      const gateFail = parsed.data.pass === false;
      trials.push({
        ...item.entry,
        gate_pass: parsed.data.pass,
        gate_violations: parsed.data.violations,
        raw_content: call.content,
        errors: [],
        provider: call.provider,
        model: call.model,
        latency_ms: call.latencyMs,
        estimated_usd: call.cost.estimatedUsd,
        retries: call.retries,
        true_positive: item.entry.expect_gate_fail && gateFail,
        false_negative: item.entry.expect_gate_fail && !gateFail,
        false_positive_control: !item.entry.expect_gate_fail
          && (item.entry.editorial_score === 'GOLD' || item.entry.editorial_score === 'SHIP')
          && gateFail,
      });
    } catch (error) {
      trials.push({
        ...item.entry,
        gate_pass: null,
        gate_violations: [],
        raw_content: '',
        errors: [error instanceof Error ? error.message : String(error)],
        provider: null,
        model: null,
        latency_ms: null,
        estimated_usd: null,
        retries: 0,
        true_positive: false,
        false_negative: item.entry.expect_gate_fail,
        false_positive_control: false,
      });
    }
  }

  const generatedAt = new Date().toISOString();
  const outputDir = path.join(
    process.cwd(),
    'tmp',
    `question-integrity-gate-phase1-${generatedAt.replace(/[:.]/gu, '-')}`
  );
  mkdirSync(outputDir, { recursive: true });
  writeFileSync(path.join(outputDir, 'README.md'), [
    '# Integrity Gate Phase 1 packet',
    '',
    '1. Read `REPORT.md` first.',
    '2. `CASES.md` is dream + candidate question + gate decision.',
    '3. No Repair. No new Reader outputs. Nothing deployed.',
    '',
  ].join('\n'));
  writeFileSync(path.join(outputDir, 'REPORT.md'), report(trials));
  writeFileSync(path.join(outputDir, 'CASES.md'), packet(generatedAt, trials));
  writeFileSync(path.join(outputDir, 'EXACT_PROMPT_STACK.md'), [
    '# Exact Integrity Gate stack',
    '',
    `Method: \`${QUESTION_INTEGRITY_GATE_METHOD_ID}\``,
    `Prompt: \`${QUESTION_INTEGRITY_GATE_PROMPT_ID}\``,
    `Version: \`${QUESTION_INTEGRITY_GATE_PROMPT_VERSION}\``,
    `Task: \`${QUESTION_INTEGRITY_GATE_TASK}\``,
    `Model: ${QUESTION_INTEGRITY_GATE_MODEL}`,
    `Temperature / tokens: \`${QUESTION_INTEGRITY_GATE_TEMPERATURE}\` / \`${QUESTION_INTEGRITY_GATE_TOKEN_LIMIT}\``,
    `Bundle SHA: \`${candidateSha}\``,
    `Frozen generator SHA: \`${EXPECTED_GENERATOR_SHA256}\``,
    `Corpus file SHA: \`${prepared.fileSha256}\``,
    '',
    'Gate inputs: RAW_DREAM + candidate question + OUTPUT_LANGUAGE + QUESTION_MODE.',
    'No generated reading. No rewrite. No Repair. No DROP/hide-question UI.',
    'Retry only for genuine transport/API failure.',
    '',
  ].join('\n'));
  writeFileSync(path.join(outputDir, 'SUMMARY.json'), JSON.stringify({
    gate_id: GATE_ID,
    generated_at: generatedAt,
    call_count: trials.length,
    this_run_spend_usd: trials.reduce((sum, trial) => sum + (trial.estimated_usd ?? 0), 0),
    hard_fail_recall: (() => {
      const regressions = trials.filter((trial) => trial.expect_gate_fail);
      const hits = regressions.filter((trial) => trial.true_positive).length;
      return { hits, total: regressions.length };
    })(),
    gold_ship_false_positives: (() => {
      const controls = trials.filter((trial) => (
        (trial.editorial_score === 'GOLD' || trial.editorial_score === 'SHIP')
        && !trial.expect_gate_fail
      ));
      return {
        hits: controls.filter((trial) => trial.false_positive_control).length,
        total: controls.length,
      };
    })(),
    candidate_sha256: candidateSha,
    corpus_sha256: prepared.fileSha256,
  }, null, 2));
  writeFileSync(path.join(outputDir, 'TRIALS.json'), JSON.stringify({
    generated_at: generatedAt,
    trials: trials.map((trial) => ({
      id: trial.id,
      case_id: trial.case_id,
      depth: trial.depth,
      language: trial.language,
      editorial_score: trial.editorial_score,
      role: trial.role,
      expect_gate_fail: trial.expect_gate_fail,
      gate_pass: trial.gate_pass,
      gate_violations: trial.gate_violations,
      errors: trial.errors,
      estimated_usd: trial.estimated_usd,
      model: trial.model,
    })),
  }, null, 2));

  const spend = trials.reduce((sum, trial) => sum + (trial.estimated_usd ?? 0), 0);
  process.stdout.write(`Gate written to ${outputDir}\nKnown spend: $${spend.toFixed(8)} / $${COST_CAP_USD.toFixed(2)}\n`);
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
