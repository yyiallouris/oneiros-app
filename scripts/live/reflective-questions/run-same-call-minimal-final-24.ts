/**
 * Final 24-run same-call benchmark for frozen v1.2.0.
 * Production Reader is not mutated. Eight anchors × Quick/Standard/Advanced.
 * No deploy, repair, judge, rewrite, or prompt mutation during the run.
 * Retry only for genuine transport/API failure.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { estimateAiCallCost, type AiCallCost } from '../../../src/billing/aiPricing';
import {
  SAME_CALL_MINIMAL_BUNDLE_SHA256,
  SAME_CALL_MINIMAL_METHOD_ID,
  SAME_CALL_MINIMAL_MODEL,
  SAME_CALL_MINIMAL_PROMPT_ID,
  SAME_CALL_MINIMAL_PROMPT_VERSION,
  SAME_CALL_MINIMAL_QUESTION_PROMPT,
  SAME_CALL_MINIMAL_READING_DEPTHS,
  buildSameCallMinimalRequest,
  hashSameCallMinimalBundle,
  mapReadingDepthToQuestionMode,
  splitSameCallReadingAndQuestion,
} from '../../../src/ai/rd/reflective-questions/sameCallMinimal/sameCallMinimalCandidate';
import {
  lintSameCallDisjunction,
  questionOpenerFamily,
} from '../../../src/ai/rd/reflective-questions/sameCallMinimal/sameCallMinimalDiagnostics';
import {
  DREAM_REFLECTION_PROMPT_ID,
  type DreamReflectionDepth,
} from '../../../src/ai/dreamReflectionPrompt';
import { APPROVED_REFLECTIVE_QUESTION_PRODUCTION } from '../../../src/ai/reflectiveQuestionProductionHold';
import { loadAndVerifyFrozenAnchorCorpus, type FrozenAnchorReading } from '../../lib/frozenAnchorReadings';
import type { OneirosLanguageCode } from '../../../src/constants/oneirosLanguages';

const GATE_ID = 'oneiros-same-call-minimal-v12-final24' as const;
const APPROVAL_ENV = 'ONEIROS_SAME_CALL_MINIMAL_FINAL24_COST_APPROVED' as const;
const COST_CAP_USD = 2.00 as const;
const TRANSPORT_RETRY_LIMIT = 1 as const;

type PromptMessage = { role: 'system' | 'user' | 'assistant'; content: string };

type ProxyCallResult = {
  content: string;
  provider: string | null;
  model: string | null;
  latencyMs: number;
  cost: AiCallCost;
  retries: number;
};

type Trial = {
  case_id: string;
  title: string;
  language: OneirosLanguageCode;
  dream: string;
  frozen_reading: string;
  depth: DreamReflectionDepth;
  question_mode: 'CORE' | 'DEEPER';
  generated_reading: string;
  generated_question: string | null;
  raw_content: string;
  errors: string[];
  provider: string | null;
  model: string | null;
  latency_ms: number | null;
  estimated_usd: number | null;
  retries: number;
  disjunction_hits: Array<{ language: string; pattern: string }>;
  opener_family: string;
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
    throw new Error(`Same-call final 24 must run on gpt-5.4. Got ${model ?? 'unknown'}.`);
  }
}

function conservativeMaximumUsd(messages: PromptMessage[], tokenLimit: number): number {
  const inputBytes = Buffer.byteLength(JSON.stringify(messages), 'utf8');
  return (inputBytes * 2.5 + tokenLimit * 15) / 1_000_000;
}

function block(value: string): string {
  return value.split('\n').map((line) => `> ${line}`).join('\n');
}

function isTransportFailure(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /fetch failed|ECONNRESET|ETIMEDOUT|same_call_http_(429|502|503|504)/u.test(message);
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
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
  let retries = 0;
  while (true) {
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
          model: SAME_CALL_MINIMAL_MODEL,
          task: params.task,
          messages: params.messages,
          temperature: params.temperature,
          max_completion_tokens: params.tokenLimit,
          max_tokens: params.tokenLimit,
          disable_anthropic_fallback: true,
        }),
      });
      if (!response.ok) {
        throw new Error(`same_call_http_${response.status}`);
      }
      const payload = await response.json() as Record<string, unknown>;
      const provider = response.headers.get('x-ai-provider')?.trim().toLowerCase() ?? null;
      return {
        content: extractContent(payload),
        provider,
        model: response.headers.get('x-ai-model')?.trim() ??
          (typeof payload.model === 'string' ? payload.model : null),
        latencyMs: Date.now() - startedAt,
        cost: estimateAiCallCost(payload, provider),
        retries,
      };
    } catch (error) {
      if (retries < TRANSPORT_RETRY_LIMIT && isTransportFailure(error)) {
        retries += 1;
        await sleep(2000);
        continue;
      }
      throw error;
    }
  }
}

function modeLabel(depth: DreamReflectionDepth): string {
  if (depth === 'quick') return 'QUICK → CORE';
  if (depth === 'advanced') return 'ADVANCED → DEEPER';
  return 'STANDARD → CORE';
}

function blindPacket(generatedAt: string, corpus: FrozenAnchorReading[], trials: Trial[]): string {
  const byCase = new Map<string, Trial[]>();
  for (const trial of trials) {
    const list = byCase.get(trial.case_id) ?? [];
    list.push(trial);
    byCase.set(trial.case_id, list);
  }
  const sections = corpus.map((entry, index) => {
    const modes = byCase.get(entry.case_id) ?? [];
    const blocks = SAME_CALL_MINIMAL_READING_DEPTHS.map((depth) => {
      const trial = modes.find((item) => item.depth === depth);
      return [
        `### ${modeLabel(depth)}`,
        '',
        'Reading:',
        '',
        block(trial?.generated_reading || '(missing reading)'),
        '',
        'Question:',
        '',
        block(trial?.generated_question || '(missing question)'),
        '',
      ].join('\n');
    });
    return [
      `## Dream ${index + 1}: ${entry.case_id}`,
      '',
      '**Dream**',
      '',
      block(entry.dream),
      '',
      '**Frozen Standard reading (quality bar for Standard only)**',
      '',
      block(entry.reading),
      '',
      ...blocks,
    ].join('\n');
  });
  return [
    '# Blind Review — same-call final 24',
    '',
    `Generated: ${generatedAt}`,
    '',
    'Score readings and questions separately. Do not open DIAGNOSTICS until after scoring.',
    'LIVE POINT / DISCOVERY and template-convergence rules are in HUMAN_SCORING.md.',
    '',
    sections.join('\n'),
  ].join('\n');
}

function humanScoringBrief(): string {
  return `# HUMAN SCORING — same-call v1.2 production-mode final 24

Score the readings and questions separately. Do not self-score in the runner.

Design principle, not a generation rule: the question does not explain the image, describe it, or merely look at it — it follows a movement the dream has already begun.

## Reading quality

For each mode:

1. Is the reading genuinely production-worthy?
2. Quick: concise/useful without becoming shallow or cheap.
3. Standard: at least as good as the current frozen Standard quality bar.
4. Advanced: richer where appropriate without becoming bloated, academic, or pretentious.
5. Does adding the terminal question appear to distort or pre-shape the reading?

## Question quality

Track:

1. GOLD / SHIP / WEAK / FAIL by mode.
2. Hard semantic failures.
3. Missing-footage / memory-test behavior.
4. Forced choice / ranking.
5. Interpretation continuation.
6. Direct waking-life translation.
7. LIVE POINT / DISCOVERY.
8. Syntactic/template convergence.
9. Multilingual naturalness.
10. Core vs Deeper differentiation.
11. Reading degradation by mode.

Primary bar still includes: would I actually want to answer it; does it pull me into this specific dream; grounded in what the dream itself created; no invented content; no forced binary; no ranking unless the dream makes that distinction.

## LIVE POINT / DISCOVERY

LIVE POINT: does the question open a relation, movement, shift, tension, change, threshold, arrival, settling, or atmosphere already alive in the dream, or does it merely point back at a scene?

A live point does not require conflict, tension, or unresolvedness. In restorative or cohesive dreams it may be an arrival, settling, shift in atmosphere, or deepening of presence.

DISCOVERY: can the dreamer discover something by answering without being asked to interpret, fabricate, or retrieve missing footage?

If the answer surface is basically sensory reconstruction or paraphrase with no live point, max **WEAK**.

## Template convergence

The gate is: **no systematic syntactic family that materially flattens the Oneiros voice or makes the questions feel generated.**

Do not fail the benchmark mechanically because a phrase such as \`Πώς αλλάζει...\` appears several times. Judge whether repetition produces actual editorial flattening. Surface repetition is only a problem if it causes editorial damage. A recurring construction is acceptable when the underlying questions remain genuinely dream-specific and perform different imaginal operations.

## Core vs Deeper

DEEPER differentiation must be judged by the operation of the question, not by sentence length or by the number of dream elements mentioned.

DEEPER does not mean “mention two images instead of one.”

It should hold a genuinely richer relation, movement, shift, or unresolved structure already created by the dream.

If a dream does not genuinely support greater complexity, an appropriately simple Deeper question is preferable to manufactured depth.

## After scoring

| Mode              | GOLD | SHIP | WEAK | FAIL |
| ----------------- | ---: | ---: | ---: | ---: |
| Quick → Core      |      |      |      |      |
| Standard → Core   |      |      |      |      |
| Advanced → Deeper |      |      |      |      |
| TOTAL             |      |      |      |      |

Final gate for the 24 questions: 0 hard FAIL; at least 21/24 GOLD or SHIP; each mode at least 6/8 GOLD or SHIP; no systematic missing-footage family; no systematic forced-choice/ranking family; no systematic interpretation-continuation family; no systematic syntactic family that materially flattens the Oneiros voice; DEEPER demonstrates meaningful relational differentiation where the dream supports it.

Readings: all three modes remain production-worthy; no systematic same-call degradation.

If PASS: freeze SHA and close reflective-question prompt R&D.
If narrow stochastic miss: STOP and report. Do not mutate automatically.
If material miss: STOP R&D. No new architecture.
`;
}

function modeSummary(trials: Trial[]): string {
  const lines = SAME_CALL_MINIMAL_READING_DEPTHS.map((depth) => {
    const subset = trials.filter((trial) => trial.depth === depth);
    const spend = subset.reduce((sum, trial) => sum + (trial.estimated_usd ?? 0), 0);
    const missing = subset.filter((trial) => !trial.generated_question).length;
    const disjunctions = subset.filter((trial) => trial.disjunction_hits.length > 0).length;
    return `- ${modeLabel(depth)}: ${subset.length} calls, ${missing} missing questions, ${disjunctions} lexical disjunction hits, $${spend.toFixed(6)}`;
  });
  return [
    '# Mechanical mode summary',
    '',
    'Editorial GOLD/SHIP/WEAK/FAIL is for human scoring only. This file is call accounting.',
    '',
    ...lines,
    '',
  ].join('\n');
}

async function main(): Promise<void> {
  if (process.env[APPROVAL_ENV] !== '1') {
    throw new Error(`Paid run locked. Set ${APPROVAL_ENV}=1 only after explicit approval.`);
  }
  if (APPROVED_REFLECTIVE_QUESTION_PRODUCTION !== null) {
    throw new Error('Unexpected production approval state; refusing same-call final 24.');
  }

  const candidateSha = hashSameCallMinimalBundle();
  if (candidateSha !== SAME_CALL_MINIMAL_BUNDLE_SHA256) {
    throw new Error(`Frozen v1.2 SHA mismatch. Refusing to run. Got ${candidateSha}.`);
  }
  const corpus = loadAndVerifyFrozenAnchorCorpus();
  if (corpus.cases.length !== 8) throw new Error('Expected 8 frozen Standard anchors.');

  const prepared = corpus.cases.flatMap((entry) => (
    SAME_CALL_MINIMAL_READING_DEPTHS.map((depth) => {
      const request = buildSameCallMinimalRequest({
        dream: {
          title: entry.title,
          date: '2026-08-28',
          content: entry.dream,
        },
        depth,
        outputLanguage: entry.language,
        variant: 'v1.2.0',
      });
      return { entry, depth, request };
    })
  ));
  if (prepared.length !== 24) throw new Error(`Expected 24 prepared calls, got ${prepared.length}.`);

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
    const questionMode = mapReadingDepthToQuestionMode(item.depth);
    const base = {
      case_id: item.entry.case_id,
      title: item.entry.title,
      language: item.entry.language,
      dream: item.entry.dream,
      frozen_reading: item.entry.reading,
      depth: item.depth,
      question_mode: questionMode,
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
      const question = split.question;
      trials.push({
        ...base,
        generated_reading: split.reading,
        generated_question: question,
        raw_content: call.content,
        errors: question ? [] : ['question_missing'],
        provider: call.provider,
        model: call.model,
        latency_ms: call.latencyMs,
        estimated_usd: call.cost.estimatedUsd,
        retries: call.retries,
        disjunction_hits: lintSameCallDisjunction(question, item.entry.language),
        opener_family: questionOpenerFamily(question, item.entry.language),
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
        retries: 0,
        disjunction_hits: [],
        opener_family: '(missing)',
      });
    }
  }

  const generatedAt = new Date().toISOString();
  const outputDir = path.join(
    process.cwd(),
    'tmp',
    `same-call-minimal-final24-${generatedAt.replace(/[:.]/gu, '-')}`
  );
  mkdirSync(outputDir, { recursive: true });
  writeFileSync(path.join(outputDir, 'README.md'), [
    '# Same-call final 24 packet',
    '',
    '1. Score `BLIND_REVIEW.md` first.',
    '2. Use `HUMAN_SCORING.md` for LIVE POINT / DISCOVERY, template, and Core vs Deeper rules.',
    '3. Open `DIAGNOSTICS.json` only after scoring.',
    '4. `MODE_SUMMARY.md` is mechanical call accounting, not editorial scores.',
    '',
  ].join('\n'));
  writeFileSync(path.join(outputDir, 'BLIND_REVIEW.md'), blindPacket(generatedAt, corpus.cases, trials));
  writeFileSync(path.join(outputDir, 'HUMAN_SCORING.md'), humanScoringBrief());
  writeFileSync(path.join(outputDir, 'MODE_SUMMARY.md'), modeSummary(trials));
  writeFileSync(path.join(outputDir, 'EXACT_PROMPT_STACK.md'), [
    '# Exact prompt stack',
    '',
    `Method: \`${SAME_CALL_MINIMAL_METHOD_ID}\``,
    `Prompt: \`${SAME_CALL_MINIMAL_PROMPT_ID}\``,
    `Version: \`${SAME_CALL_MINIMAL_PROMPT_VERSION}\``,
    `Reader: \`${DREAM_REFLECTION_PROMPT_ID}\` (production, unmodified)`,
    `Model: ${SAME_CALL_MINIMAL_MODEL}`,
    'Tasks: `interpretation_quick` / `interpretation_standard` / `interpretation_advanced`',
    `Bundle SHA: \`${candidateSha}\``,
    'Depth map: Quick→CORE, Standard→CORE, Advanced→DEEPER',
    '',
    'System 4 (terminal question instruction, frozen for this run):',
    '',
    '```text',
    SAME_CALL_MINIMAL_QUESTION_PROMPT,
    '```',
    '',
    'Wrapper appended to the production user message: explicit `<OUTPUT_LANGUAGE>` plus `<QUESTION_MODE>`.',
    'Systems 1–3 untouched. No anti-template variety instruction.',
    'No Director, taxonomy, evidence ids, no_question, question-first, repair, rewrite, or judge.',
    'Retry only for genuine transport/API failure. Production Reader files were not edited. Nothing was deployed.',
    '',
  ].join('\n'));
  writeFileSync(path.join(outputDir, 'RAW_RESPONSES.json'), JSON.stringify({
    generated_at: generatedAt,
    trials: trials.map((trial) => ({
      case_id: trial.case_id,
      depth: trial.depth,
      raw_content: trial.raw_content,
    })),
  }, null, 2));

  const openerCounts = new Map<string, number>();
  for (const trial of trials) {
    openerCounts.set(trial.opener_family, (openerCounts.get(trial.opener_family) ?? 0) + 1);
  }

  writeFileSync(path.join(outputDir, 'DIAGNOSTICS.json'), JSON.stringify({
    gate_id: GATE_ID,
    generated_at: generatedAt,
    candidate_sha256: candidateSha,
    method_id: SAME_CALL_MINIMAL_METHOD_ID,
    prompt_id: SAME_CALL_MINIMAL_PROMPT_ID,
    reader_prompt_id: DREAM_REFLECTION_PROMPT_ID,
    this_run_spend_usd: Number(knownSpend.toFixed(8)),
    call_count: trials.length,
    missing_question_count: trials.filter((trial) => !trial.generated_question).length,
    lexical_disjunction_count: trials.filter((trial) => trial.disjunction_hits.length > 0).length,
    opener_families: [...openerCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([family, count]) => ({ family, count, per_24: `${count}/24` })),
    trials: trials.map((trial) => ({
      case_id: trial.case_id,
      depth: trial.depth,
      question_mode: trial.question_mode,
      language: trial.language,
      errors: trial.errors,
      provider: trial.provider,
      model: trial.model,
      latency_ms: trial.latency_ms,
      estimated_usd: trial.estimated_usd,
      retries: trial.retries,
      reading_chars: trial.generated_reading.length,
      question_chars: trial.generated_question?.length ?? 0,
      disjunction_hits: trial.disjunction_hits,
      opener_family: trial.opener_family,
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
