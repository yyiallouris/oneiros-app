/**
 * Phase 2: one Repair on the 7 Phase-1 Gate FAILs, then the same frozen
 * Integrity Gate exactly once. No second Repair. No DROP. No new Reader.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { estimateAiCallCost, type AiCallCost } from '../../../src/billing/aiPricing';
import {
  QUESTION_INTEGRITY_GATE_BUNDLE_SHA256,
  QUESTION_INTEGRITY_GATE_METHOD_ID,
  QUESTION_INTEGRITY_GATE_MODEL,
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
import {
  QUESTION_REPAIR_BUNDLE_SHA256,
  QUESTION_REPAIR_METHOD_ID,
  QUESTION_REPAIR_MODEL,
  QUESTION_REPAIR_PROMPT_ID,
  QUESTION_REPAIR_PROMPT_VERSION,
  QUESTION_REPAIR_TASK,
  QUESTION_REPAIR_TEMPERATURE,
  QUESTION_REPAIR_TOKEN_LIMIT,
  buildQuestionRepairMessages,
  buildQuestionRepairResponseFormat,
  hashQuestionRepairBundle,
  parseQuestionRepairResult,
  PHASE2_REJECTED_IDS,
  type QuestionRepairResponseFormat,
} from '../../../src/ai/rd/reflective-questions/questionIntegrityGate/questionRepairCandidate';
import {
  looksLikeReflectiveQuestion,
  SAME_CALL_MINIMAL_BUNDLE_SHA256,
} from '../../../src/ai/rd/reflective-questions/sameCallMinimal/sameCallMinimalCandidate';
import { APPROVED_REFLECTIVE_QUESTION_PRODUCTION } from '../../../src/ai/reflectiveQuestionProductionHold';
import {
  loadAndPrepareQuestionIntegrityGateCorpus,
  type IntegrityGatePreparedCase,
} from '../../lib/questionIntegrityGateCorpus';

const GATE_ID = 'oneiros-question-repair-v1-phase2' as const;
const APPROVAL_ENV = 'ONEIROS_QUESTION_REPAIR_PHASE2_COST_APPROVED' as const;
const COST_CAP_USD = 1.00 as const;
const TRANSPORT_RETRY_LIMIT = 1 as const;
const PHASE1_PACKET_REL =
  'tmp/question-integrity-gate-phase1-2026-08-28T21-08-51-574Z' as const;

type PromptMessage = { role: 'system' | 'user'; content: string };

type ProxyCallResult = {
  content: string;
  provider: string | null;
  model: string | null;
  latencyMs: number;
  cost: AiCallCost;
  retries: number;
};

type Phase1Trial = {
  id: string;
  gate_pass: boolean | null;
  gate_violations: QuestionIntegrityViolationId[];
};

type RepairTrial = IntegrityGatePreparedCase & {
  original_violations: QuestionIntegrityViolationId[];
  repaired_question: string | null;
  post_gate_pass: boolean | null;
  post_gate_violations: QuestionIntegrityViolationId[];
  errors: string[];
  repair_usd: number | null;
  gate_usd: number | null;
  repair_model: string | null;
  gate_model: string | null;
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
  if (typeof value !== 'string' || !value.trim()) throw new Error('phase2_empty_content');
  return value.trim();
}

function assertUsedGpt54(model: string | null, label: string): void {
  const id = (model ?? '').trim().toLowerCase();
  if (!id.startsWith('gpt-5.4') || id.includes('mini') || id.includes('nano')) {
    throw new Error(`${label} must run on gpt-5.4. Got ${model ?? 'unknown'}.`);
  }
}

function conservativeMaximumUsd(messages: PromptMessage[], tokenLimit: number): number {
  const inputBytes = Buffer.byteLength(JSON.stringify(messages), 'utf8');
  return (inputBytes * 2.5 + tokenLimit * 15) / 1_000_000;
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
  responseFormat: QuestionRepairResponseFormat | QuestionIntegrityGateResponseFormat;
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
      if (!response.ok) throw new Error(`phase2_http_${response.status}`);
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
      const transport = /phase2_http_|fetch|network|ECONN|ETIMEDOUT|socket/iu.test(message);
      if (!transport || attempt === TRANSPORT_RETRY_LIMIT) throw error;
    }
  }
  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

function loadPhase1Trials(): Phase1Trial[] {
  const trialsPath = path.join(process.cwd(), PHASE1_PACKET_REL, 'TRIALS.json');
  if (!existsSync(trialsPath)) {
    throw new Error(`Missing frozen Phase 1 packet at ${PHASE1_PACKET_REL}.`);
  }
  const payload = JSON.parse(readFileSync(trialsPath, 'utf8')) as {
    trials?: Phase1Trial[];
  };
  if (!Array.isArray(payload.trials) || payload.trials.length !== 24) {
    throw new Error('Phase 1 TRIALS.json must contain exactly 24 trials.');
  }
  return payload.trials;
}

function modeLabel(depth: IntegrityGatePreparedCase['depth']): string {
  if (depth === 'quick') return 'QUICK → CORE';
  if (depth === 'standard') return 'STANDARD → CORE';
  return 'ADVANCED → DEEPER';
}

function block(value: string): string {
  return value.split('\n').map((line) => `> ${line}`).join('\n');
}

function humanScoringBrief(): string {
  return `# HUMAN SCORING — Integrity Gate + Repair Phase 2 composite 24

Score the 24 final questions only. Do not open KEY.json until after scoring.

Design principle, not a generation rule: the question follows a movement the dream has already begun.

Track GOLD / SHIP / WEAK / FAIL by mode.

Hard semantic FAIL families: forced choice; ranking/comparison; missing footage; invented content; interpretation as premise; interpretation validation; waking-life translation; invented continuation; language mismatch.

LIVE POINT / DISCOVERY still apply. A live point does not require conflict.

DEEPER is judged by operation, not length.

Do not mechanical-FAIL a recurring \`Πώς αλλάζει…\` shell if the questions stay dream-specific.

| Mode              | GOLD | SHIP | WEAK | FAIL |
| ----------------- | ---: | ---: | ---: | ---: |
| Quick → Core      |      |      |      |      |
| Standard → Core   |      |      |      |      |
| Advanced → Deeper |      |      |      |      |
| TOTAL             |      |      |      |      |

Mechanical Phase 2 already required 7/7 repaired questions to pass the frozen Integrity Gate and final_drop_count = 0. Editorial Gate: 0 hard FAIL; ≥21/24 GOLD+SHIP; each mode ≥6/8; repaired questions keep LIVE POINT / DISCOVERY; the five known hard regressions must be genuinely clean, not cosmetically disguised.
`;
}

async function main(): Promise<void> {
  if (process.env[APPROVAL_ENV] !== '1') {
    throw new Error(`Paid run locked. Set ${APPROVAL_ENV}=1 only after explicit approval.`);
  }
  if (APPROVED_REFLECTIVE_QUESTION_PRODUCTION !== null) {
    throw new Error('Unexpected production approval state; refusing Phase 2.');
  }

  const gateSha = hashQuestionIntegrityGateBundle();
  if (gateSha !== QUESTION_INTEGRITY_GATE_BUNDLE_SHA256) {
    throw new Error(`Frozen Integrity Gate SHA mismatch. Refusing to run. Got ${gateSha}.`);
  }
  const repairSha = hashQuestionRepairBundle();
  if (repairSha !== QUESTION_REPAIR_BUNDLE_SHA256) {
    throw new Error(`Repair SHA mismatch. Refusing to run. Got ${repairSha}.`);
  }
  const corpus = loadAndPrepareQuestionIntegrityGateCorpus();
  const phase1 = loadPhase1Trials();
  const byId = new Map(corpus.cases.map((entry) => [entry.id, entry]));
  const phase1ById = new Map(phase1.map((entry) => [entry.id, entry]));

  const rejected = PHASE2_REJECTED_IDS.map((id) => {
    const entry = byId.get(id);
    const prior = phase1ById.get(id);
    if (!entry) throw new Error(`Missing corpus case ${id}.`);
    if (!prior || prior.gate_pass !== false) {
      throw new Error(`${id} was not a Phase 1 Gate FAIL. Refusing to repair.`);
    }
    if (prior.gate_violations.length === 0) {
      throw new Error(`${id} has no Phase 1 violations. Refusing to repair.`);
    }
    return { entry, violations: prior.gate_violations };
  });
  if (rejected.length !== 7) throw new Error('Phase 2 must repair exactly 7 cases.');

  const gateFormat = buildQuestionIntegrityGateResponseFormat();
  const repairFormat = buildQuestionRepairResponseFormat();
  const prepared = rejected.map((item) => {
    const repairMessages = buildQuestionRepairMessages({
      dream: item.entry.dream,
      rejectedQuestion: item.entry.question,
      violations: item.violations,
      outputLanguage: item.entry.language,
      questionMode: item.entry.question_mode,
    });
    const joined = repairMessages.map((message) => message.content).join('\n');
    if (joined.includes('BEGIN_DREAM_READING') || /Core (Tension|Shift|Restoration)/u.test(joined)) {
      throw new Error(`Repair input leaked a reading for ${item.entry.id}.`);
    }
    return { ...item, repairMessages };
  });

  const maximumUsd = prepared.reduce((sum, item) => {
    const gateMessages = buildQuestionIntegrityGateMessages({
      dream: item.entry.dream,
      candidateQuestion: 'placeholder question for preflight sizing?',
      outputLanguage: item.entry.language,
      questionMode: item.entry.question_mode,
    });
    return sum
      + conservativeMaximumUsd(item.repairMessages, QUESTION_REPAIR_TOKEN_LIMIT)
      + conservativeMaximumUsd(gateMessages, QUESTION_INTEGRITY_GATE_TOKEN_LIMIT);
  }, 0);
  if (maximumUsd > COST_CAP_USD) {
    throw new Error(`Conservative preflight $${maximumUsd.toFixed(6)} exceeds $${COST_CAP_USD}.`);
  }

  const supabaseUrl = getEnv(['EXPO_PUBLIC_SUPABASE_URL', 'SUPABASE_URL']);
  const anonKey = getEnv(['EXPO_PUBLIC_SUPABASE_ANON_KEY', 'SUPABASE_ANON_KEY']);
  if (!supabaseUrl || !anonKey) throw new Error('Missing Supabase URL/anon key.');
  const token = await getAccessToken(supabaseUrl, anonKey);
  const endpoint = `${supabaseUrl}/functions/v1/openai-proxy`;
  const trials: RepairTrial[] = [];
  let knownSpend = 0;

  for (const item of prepared) {
    const base: RepairTrial = {
      ...item.entry,
      original_violations: item.violations,
      repaired_question: null,
      post_gate_pass: null,
      post_gate_violations: [],
      errors: [],
      repair_usd: null,
      gate_usd: null,
      repair_model: null,
      gate_model: null,
    };
    try {
      const repairCall = await callProxy({
        endpoint,
        anonKey,
        token,
        model: QUESTION_REPAIR_MODEL,
        task: QUESTION_REPAIR_TASK,
        temperature: QUESTION_REPAIR_TEMPERATURE,
        tokenLimit: QUESTION_REPAIR_TOKEN_LIMIT,
        messages: item.repairMessages,
        responseFormat: repairFormat,
      });
      if (typeof repairCall.cost.estimatedUsd === 'number') knownSpend += repairCall.cost.estimatedUsd;
      if (knownSpend > COST_CAP_USD) throw new Error('hard_cost_cap_exceeded');
      assertUsedGpt54(repairCall.model, 'Phase 2 Repair');
      base.repair_usd = repairCall.cost.estimatedUsd;
      base.repair_model = repairCall.model;
      const parsedRepair = parseQuestionRepairResult(repairCall.content);
      if (!parsedRepair.ok) {
        base.errors.push(...parsedRepair.errors);
        trials.push(base);
        continue;
      }
      if (!looksLikeReflectiveQuestion(parsedRepair.data.question)) {
        base.errors.push('repaired_not_interrogative');
        trials.push(base);
        continue;
      }
      base.repaired_question = parsedRepair.data.question;

      const gateMessages = buildQuestionIntegrityGateMessages({
        dream: item.entry.dream,
        candidateQuestion: parsedRepair.data.question,
        outputLanguage: item.entry.language,
        questionMode: item.entry.question_mode,
      });
      const gateCall = await callProxy({
        endpoint,
        anonKey,
        token,
        model: QUESTION_INTEGRITY_GATE_MODEL,
        task: QUESTION_INTEGRITY_GATE_TASK,
        temperature: QUESTION_INTEGRITY_GATE_TEMPERATURE,
        tokenLimit: QUESTION_INTEGRITY_GATE_TOKEN_LIMIT,
        messages: gateMessages,
        responseFormat: gateFormat,
      });
      if (typeof gateCall.cost.estimatedUsd === 'number') knownSpend += gateCall.cost.estimatedUsd;
      if (knownSpend > COST_CAP_USD) throw new Error('hard_cost_cap_exceeded');
      assertUsedGpt54(gateCall.model, 'Post-repair Integrity Gate');
      base.gate_usd = gateCall.cost.estimatedUsd;
      base.gate_model = gateCall.model;
      const parsedGate = parseQuestionIntegrityGateResult(gateCall.content);
      if (!parsedGate.ok) {
        base.errors.push(...parsedGate.errors);
        trials.push(base);
        continue;
      }
      base.post_gate_pass = parsedGate.data.pass;
      base.post_gate_violations = parsedGate.data.violations;
      if (parsedGate.data.pass !== true) {
        base.errors.push('post_repair_gate_fail');
      }
      trials.push(base);
    } catch (error) {
      base.errors.push(error instanceof Error ? error.message : String(error));
      trials.push(base);
    }
  }

  const repairedPassCount = trials.filter((trial) => trial.post_gate_pass === true).length;
  const finalDropCount = 7 - repairedPassCount;
  const phase2Pass = repairedPassCount === 7 && finalDropCount === 0;
  const generatedAt = new Date().toISOString();
  const outputDir = path.join(
    process.cwd(),
    'tmp',
    `question-repair-phase2-${generatedAt.replace(/[:.]/gu, '-')}`
  );
  mkdirSync(outputDir, { recursive: true });

  const spend = trials.reduce(
    (sum, trial) => sum + (trial.repair_usd ?? 0) + (trial.gate_usd ?? 0),
    0
  );

  writeFileSync(path.join(outputDir, 'README.md'), [
    '# Integrity Gate + Repair Phase 2',
    '',
    phase2Pass
      ? 'Mechanical Phase 2 PASS. Score `BLIND_REVIEW.md` with `HUMAN_SCORING.md`. Do not open KEY until after scoring.'
      : 'Mechanical Phase 2 FAIL. Do not treat this as a 24-question human packet. Do not fall back to the unsafe originals.',
    '',
    'No DROP / hide-question UI. No second Repair. Frozen Integrity Gate was not mutated.',
    '',
  ].join('\n'));
  writeFileSync(path.join(outputDir, 'REPORT.md'), [
    '# Phase 2 mechanical report',
    '',
    `Repaired then re-gated: ${repairedPassCount}/7`,
    `final_drop_count: ${finalDropCount}`,
    `Phase 2: ${phase2Pass ? 'PASS' : 'FAIL'}`,
    `Spend: $${spend.toFixed(8)} / $${COST_CAP_USD.toFixed(2)}`,
    '',
    ...trials.map((trial) => (
      `- ${trial.id}: repair ${trial.repaired_question ? 'ok' : 'missing'}; post-gate ${trial.post_gate_pass === true ? 'PASS' : trial.post_gate_pass === false ? 'FAIL' : 'ERROR'} [${trial.post_gate_violations.join(', ') || 'none'}]${trial.errors.length ? `; errors: ${trial.errors.join(', ')}` : ''}`
    )),
    '',
    'If FAIL: STOP. Do not use the original rejected question. Do not mutate prompts automatically.',
    '',
  ].join('\n'));

  const repairedById = new Map(trials.map((trial) => [trial.id, trial]));
  const composite = corpus.cases.map((entry) => {
    const prior = phase1ById.get(entry.id);
    const repaired = repairedById.get(entry.id);
    if (repaired) {
      return {
        ...entry,
        source: 'repaired' as const,
        final_question: repaired.post_gate_pass === true ? repaired.repaired_question : null,
        original_question: entry.question,
        original_violations: repaired.original_violations,
        post_gate_pass: repaired.post_gate_pass,
      };
    }
    return {
      ...entry,
      source: 'original' as const,
      final_question: prior?.gate_pass === true ? entry.question : null,
      original_question: entry.question,
      original_violations: prior?.gate_violations ?? [],
      post_gate_pass: prior?.gate_pass ?? null,
    };
  });

  writeFileSync(path.join(outputDir, 'KEY.json'), JSON.stringify({
    generated_at: generatedAt,
    phase2_pass: phase2Pass,
    final_drop_count: finalDropCount,
    frozen_gate_sha: gateSha,
    repair_sha: repairSha,
    generator_sha: SAME_CALL_MINIMAL_BUNDLE_SHA256,
    items: composite.map((item) => ({
      id: item.id,
      source: item.source,
      original_question: item.original_question,
      final_question: item.final_question,
      original_violations: item.original_violations,
      post_gate_pass: item.post_gate_pass,
    })),
  }, null, 2));

  if (phase2Pass) {
    writeFileSync(path.join(outputDir, 'HUMAN_SCORING.md'), humanScoringBrief());
    writeFileSync(path.join(outputDir, 'BLIND_REVIEW.md'), [
      '# Blind Review — composite 24 final questions',
      '',
      `Generated: ${generatedAt}`,
      '',
      'Score DREAM + MODE + FINAL QUESTION only.',
      '',
      ...composite.flatMap((item, index) => [
        `## ${index + 1}. ${item.case_id} — ${modeLabel(item.depth)}`,
        '',
        '**Dream**',
        '',
        block(item.dream),
        '',
        '**Final question**',
        '',
        block(item.final_question ?? ''),
        '',
      ]),
    ].join('\n'));
  }

  writeFileSync(path.join(outputDir, 'EXACT_PROMPT_STACK.md'), [
    '# Exact Phase 2 stack',
    '',
    `Frozen Integrity Gate: \`${QUESTION_INTEGRITY_GATE_METHOD_ID}\` SHA \`${gateSha}\``,
    `Repair: \`${QUESTION_REPAIR_METHOD_ID}\` / \`${QUESTION_REPAIR_PROMPT_ID}\` / \`${QUESTION_REPAIR_PROMPT_VERSION}\``,
    `Repair SHA: \`${repairSha}\``,
    `Repair model / task: ${QUESTION_REPAIR_MODEL} / \`${QUESTION_REPAIR_TASK}\` / temp ${QUESTION_REPAIR_TEMPERATURE} / ${QUESTION_REPAIR_TOKEN_LIMIT} tokens`,
    `v1.2 generator SHA (untouched): \`${SAME_CALL_MINIMAL_BUNDLE_SHA256}\``,
    `Phase 1 packet: \`${PHASE1_PACKET_REL}\``,
    '',
    'Repair inputs: RAW_DREAM + rejected question + violation IDs + OUTPUT_LANGUAGE + QUESTION_MODE.',
    'No generated reading. One Repair. One post-repair frozen Gate. No second Repair. No DROP.',
    'Retry only for genuine transport/API failure. Nothing deployed.',
    '',
  ].join('\n'));
  writeFileSync(path.join(outputDir, 'SUMMARY.json'), JSON.stringify({
    gate_id: GATE_ID,
    generated_at: generatedAt,
    phase2_pass: phase2Pass,
    repaired_pass: repairedPassCount,
    final_drop_count: finalDropCount,
    this_run_spend_usd: spend,
    repair_sha: repairSha,
    frozen_gate_sha: gateSha,
  }, null, 2));

  process.stdout.write(
    `Phase 2 written to ${outputDir}\n${phase2Pass ? 'PASS' : 'FAIL'} ${repairedPassCount}/7 · drop ${finalDropCount} · $${spend.toFixed(8)} / $${COST_CAP_USD.toFixed(2)}\n`
  );
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
