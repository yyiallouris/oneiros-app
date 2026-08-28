/**
 * Historical 8-call Standard A/B runner. Live path is
 * `run-same-call-minimal-final-24.ts`. Production Reader is not mutated.
 * No deploy, repair, or judge.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { estimateAiCallCost, type AiCallCost } from '../../../src/billing/aiPricing';
import {
  SAME_CALL_MINIMAL_MODEL,
  SAME_CALL_MINIMAL_V11_METHOD_ID,
  SAME_CALL_MINIMAL_V11_PROMPT_ID,
  SAME_CALL_MINIMAL_V11_PROMPT_VERSION,
  SAME_CALL_MINIMAL_V11_QUESTION_PROMPT,
  buildSameCallMinimalRequest,
  hashSameCallMinimalV11Bundle,
  splitSameCallReadingAndQuestion,
} from '../../../src/ai/rd/reflective-questions/sameCallMinimal/sameCallMinimalCandidate';
import { DREAM_REFLECTION_PROMPT_ID } from '../../../src/ai/dreamReflectionPrompt';
import { APPROVED_REFLECTIVE_QUESTION_PRODUCTION } from '../../../src/ai/reflectiveQuestionProductionHold';
import { loadAndVerifyFrozenAnchorCorpus } from '../../lib/frozenAnchorReadings';

const GATE_ID = 'oneiros-same-call-minimal-gate1' as const;
const APPROVAL_ENV = 'ONEIROS_SAME_CALL_MINIMAL_GATE1_COST_APPROVED' as const;
const COST_CAP_USD = 0.80 as const;

type PromptMessage = { role: 'system' | 'user' | 'assistant'; content: string };

type ProxyCallResult = {
  content: string;
  provider: string | null;
  model: string | null;
  latencyMs: number;
  cost: AiCallCost;
};

type Trial = {
  case_id: string;
  title: string;
  language: string;
  dream: string;
  frozen_reading: string;
  generated_reading: string;
  generated_question: string | null;
  raw_content: string;
  errors: string[];
  provider: string | null;
  model: string | null;
  latency_ms: number | null;
  estimated_usd: number | null;
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
  if (typeof value !== 'string' || !value.trim()) throw new Error('same_call_empty_content');
  return value.trim();
}

function assertUsedGpt54(model: string | null): void {
  const id = (model ?? '').trim().toLowerCase();
  if (!id.startsWith('gpt-5.4') || id.includes('mini') || id.includes('nano')) {
    throw new Error(`Same-call A/B must run on gpt-5.4. Got ${model ?? 'unknown'}.`);
  }
}

function conservativeMaximumUsd(messages: PromptMessage[], tokenLimit: number): number {
  const inputBytes = Buffer.byteLength(JSON.stringify(messages), 'utf8');
  return (inputBytes * 2.5 + tokenLimit * 15) / 1_000_000;
}

function block(value: string): string {
  return value.split('\n').map((line) => `> ${line}`).join('\n');
}

async function callSameCall(params: {
  endpoint: string;
  anonKey: string;
  token: string;
  task: string;
  messages: PromptMessage[];
  temperature: number;
  tokenLimit: number;
}): Promise<ProxyCallResult> {
  const startedAt = Date.now();
  const response = await fetch(params.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: params.anonKey,
      Authorization: `Bearer ${params.token}`,
    },
    body: JSON.stringify({
      model: SAME_CALL_MINIMAL_MODEL,
      task: params.task,
      messages: params.messages,
      temperature: params.temperature,
      max_completion_tokens: params.tokenLimit,
      max_tokens: params.tokenLimit,
      disable_anthropic_fallback: true,
    }),
  });
  if (!response.ok) throw new Error(`same_call_http_${response.status}`);
  const payload = await response.json() as Record<string, unknown>;
  const provider = response.headers.get('x-ai-provider')?.trim().toLowerCase() ?? null;
  return {
    content: extractContent(payload),
    provider,
    model: response.headers.get('x-ai-model')?.trim() ??
      (typeof payload.model === 'string' ? payload.model : null),
    latencyMs: Date.now() - startedAt,
    cost: estimateAiCallCost(payload, provider),
  };
}

function blindPacket(generatedAt: string, trials: Trial[]): string {
  const sections = trials.map((trial, index) => [
    `## Case ${index + 1}: ${trial.case_id}`,
    '',
    '**Dream**',
    '',
    block(trial.dream),
    '',
    '**Frozen Standard reading**',
    '',
    block(trial.frozen_reading),
    '',
    '**Generated reading**',
    '',
    block(trial.generated_reading || '(missing reading)'),
    '',
    '**Generated question**',
    '',
    block(trial.generated_question || '(missing question)'),
    '',
  ].join('\n'));
  return [
    '# Blind Review — same-call minimal Reader + question',
    '',
    `Generated: ${generatedAt}`,
    '',
    'Score TWO things together. Success requires both:',
    '1. Reading quality is not materially worse than the frozen Standard reading.',
    '2. The two remaining question habits are gone: no direct waking-life translation, and no either/or or choose-between-images unless that choice is itself in the dream.',
    '',
    'Question bar: would I answer it, does it pull me into this dream, is it beautiful without putting words in my mouth.',
    '',
    sections.join('\n'),
  ].join('\n');
}

async function main(): Promise<void> {
  if (process.env[APPROVAL_ENV] !== '1') {
    throw new Error(`Paid run locked. Set ${APPROVAL_ENV}=1 only after explicit approval.`);
  }
  if (APPROVED_REFLECTIVE_QUESTION_PRODUCTION !== null) {
    throw new Error('Unexpected production approval state; refusing same-call A/B.');
  }

  const candidateSha = hashSameCallMinimalV11Bundle();
  const corpus = loadAndVerifyFrozenAnchorCorpus();
  if (corpus.cases.length !== 8) throw new Error('Expected 8 frozen Standard anchors.');

  const prepared = corpus.cases.map((entry) => {
    const request = buildSameCallMinimalRequest({
      dream: {
        title: entry.title,
        date: '2026-08-28',
        content: entry.dream,
      },
      depth: 'standard',
      outputLanguage: entry.language,
      variant: 'v1.1.0',
    });
    return { entry, request };
  });
  const maximumUsd = prepared.reduce(
    (sum, item) => sum + conservativeMaximumUsd(item.request.messages, item.request.tokenLimit),
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

  for (const item of prepared) {
    const base = {
      case_id: item.entry.case_id,
      title: item.entry.title,
      language: item.entry.language,
      dream: item.entry.dream,
      frozen_reading: item.entry.reading,
    };
    try {
      const call = await callSameCall({
        endpoint,
        anonKey,
        token,
        task: item.request.task,
        messages: item.request.messages,
        temperature: item.request.temperature,
        tokenLimit: item.request.tokenLimit,
      });
      if (typeof call.cost.estimatedUsd === 'number') knownSpend += call.cost.estimatedUsd;
      if (knownSpend > COST_CAP_USD) throw new Error('hard_cost_cap_exceeded');
      assertUsedGpt54(call.model);
      const split = splitSameCallReadingAndQuestion(call.content);
      trials.push({
        ...base,
        generated_reading: split.reading,
        generated_question: split.question,
        raw_content: call.content,
        errors: split.question ? [] : ['question_missing'],
        provider: call.provider,
        model: call.model,
        latency_ms: call.latencyMs,
        estimated_usd: call.cost.estimatedUsd,
      });
    } catch (error) {
      trials.push({
        ...base,
        generated_reading: '',
        generated_question: null,
        raw_content: '',
        errors: [error instanceof Error ? error.message : String(error)],
        provider: null,
        model: null,
        latency_ms: null,
        estimated_usd: null,
      });
    }
  }

  const generatedAt = new Date().toISOString();
  const outputDir = path.join(
    process.cwd(),
    'tmp',
    `same-call-minimal-gate1-${generatedAt.replace(/[:.]/gu, '-')}`
  );
  mkdirSync(outputDir, { recursive: true });
  writeFileSync(path.join(outputDir, 'BLIND_REVIEW.md'), blindPacket(generatedAt, trials));
  writeFileSync(path.join(outputDir, 'EXACT_PROMPT_STACK.md'), [
    '# Exact prompt stack',
    '',
    `Method: \`${SAME_CALL_MINIMAL_V11_METHOD_ID}\``,
    `Prompt: \`${SAME_CALL_MINIMAL_V11_PROMPT_ID}\``,
    `Version: \`${SAME_CALL_MINIMAL_V11_PROMPT_VERSION}\``,
    `Reader: \`${DREAM_REFLECTION_PROMPT_ID}\` (production, unmodified)`,
    `Model: ${SAME_CALL_MINIMAL_MODEL}`,
    `Task: ${prepared[0]?.request.task ?? 'interpretation_standard'}`,
    `Bundle SHA: \`${candidateSha}\``,
    '',
    'Appended terminal question instruction:',
    '',
    '```text',
    SAME_CALL_MINIMAL_V11_QUESTION_PROMPT,
    '```',
    '',
    'No Director, taxonomy, evidence ids, no_question, question-first, retry, repair, or judge.',
    'Production Reader files were not edited. Nothing was deployed.',
    '',
  ].join('\n'));
  writeFileSync(path.join(outputDir, 'RAW_RESPONSES.json'), JSON.stringify({
    generated_at: generatedAt,
    trials: trials.map((trial) => ({
      case_id: trial.case_id,
      raw_content: trial.raw_content,
    })),
  }, null, 2));
  writeFileSync(path.join(outputDir, 'DIAGNOSTICS.json'), JSON.stringify({
    gate_id: GATE_ID,
    generated_at: generatedAt,
    candidate_sha256: candidateSha,
    method_id: SAME_CALL_MINIMAL_V11_METHOD_ID,
    prompt_id: SAME_CALL_MINIMAL_V11_PROMPT_ID,
    reader_prompt_id: DREAM_REFLECTION_PROMPT_ID,
    this_run_spend_usd: Number(knownSpend.toFixed(8)),
    call_count: trials.length,
    missing_question_count: trials.filter((trial) => !trial.generated_question).length,
    trials: trials.map((trial) => ({
      case_id: trial.case_id,
      errors: trial.errors,
      provider: trial.provider,
      model: trial.model,
      latency_ms: trial.latency_ms,
      estimated_usd: trial.estimated_usd,
      reading_chars: trial.generated_reading.length,
      question_chars: trial.generated_question?.length ?? 0,
    })),
  }, null, 2));
  writeFileSync(path.join(outputDir, 'SUMMARY.json'), JSON.stringify({
    gate_id: GATE_ID,
    call_count: trials.length,
    this_run_spend_usd: Number(knownSpend.toFixed(8)),
    missing_question_count: trials.filter((trial) => !trial.generated_question).length,
  }, null, 2));
  console.log(`Gate written to ${outputDir}`);
  console.log(`Known spend: $${knownSpend.toFixed(8)} / $${COST_CAP_USD.toFixed(2)}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
