/**
 * Paired R&D gate: 8 fresh v1.1.0 Standard/CORE + 8 fresh v1.2.0 Standard/CORE.
 * Randomized blind A/B. Systems 1–3 untouched. No final 24. No deploy.
 * Retry only for genuine transport/API failure. No judge, repair, or rewrite.
 */
import { randomInt } from 'crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { estimateAiCallCost, type AiCallCost } from '../../../src/billing/aiPricing';
import {
  SAME_CALL_MINIMAL_METHOD_ID,
  SAME_CALL_MINIMAL_MODEL,
  SAME_CALL_MINIMAL_PROMPT_ID,
  SAME_CALL_MINIMAL_PROMPT_VERSION,
  SAME_CALL_MINIMAL_QUESTION_PROMPT,
  SAME_CALL_MINIMAL_V11_METHOD_ID,
  SAME_CALL_MINIMAL_V11_PROMPT_ID,
  SAME_CALL_MINIMAL_V11_QUESTION_PROMPT,
  buildSameCallMinimalRequest,
  hashSameCallMinimalBundle,
  hashSameCallMinimalV11Bundle,
  splitSameCallReadingAndQuestion,
  type SameCallMinimalVariant,
} from '../../../src/ai/rd/reflective-questions/sameCallMinimal/sameCallMinimalCandidate';
import { DREAM_REFLECTION_PROMPT_ID } from '../../../src/ai/dreamReflectionPrompt';
import { APPROVED_REFLECTIVE_QUESTION_PRODUCTION } from '../../../src/ai/reflectiveQuestionProductionHold';
import { loadAndVerifyFrozenAnchorCorpus, type FrozenAnchorReading } from '../../lib/frozenAnchorReadings';
import type { OneirosLanguageCode } from '../../../src/constants/oneirosLanguages';

const GATE_ID = 'oneiros-same-call-minimal-v12-paired' as const;
const APPROVAL_ENV = 'ONEIROS_SAME_CALL_MINIMAL_V12_PAIRED_COST_APPROVED' as const;
const COST_CAP_USD = 1.00 as const;
const TRANSPORT_RETRY_LIMIT = 1 as const;
const VARIANTS = ['v1.1.0', 'v1.2.0'] as const satisfies readonly SameCallMinimalVariant[];
const SECONDARY_V11_FINAL24_DIR = 'tmp/same-call-minimal-final24-2026-08-28T17-23-48-439Z';

type PromptMessage = { role: 'system' | 'user' | 'assistant'; content: string };
type BlindLabel = 'A' | 'B';

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
  variant: SameCallMinimalVariant;
  generated_reading: string;
  generated_question: string | null;
  raw_content: string;
  errors: string[];
  provider: string | null;
  model: string | null;
  latency_ms: number | null;
  estimated_usd: number | null;
  retries: number;
};

type PairKey = {
  case_id: string;
  A: SameCallMinimalVariant;
  B: SameCallMinimalVariant;
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
    throw new Error(`Same-call paired gate must run on gpt-5.4. Got ${model ?? 'unknown'}.`);
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

function assignBlindLabels(caseIds: string[]): PairKey[] {
  return caseIds.map((case_id) => {
    const v11IsA = randomInt(2) === 0;
    return {
      case_id,
      A: v11IsA ? 'v1.1.0' : 'v1.2.0',
      B: v11IsA ? 'v1.2.0' : 'v1.1.0',
    };
  });
}

function trialFor(trials: Trial[], caseId: string, variant: SameCallMinimalVariant): Trial | undefined {
  return trials.find((trial) => trial.case_id === caseId && trial.variant === variant);
}

function blindPacket(
  generatedAt: string,
  corpus: FrozenAnchorReading[],
  trials: Trial[],
  keys: PairKey[]
): string {
  const sections = corpus.map((entry, index) => {
    const key = keys.find((item) => item.case_id === entry.case_id);
    if (!key) throw new Error(`Missing blind key for ${entry.case_id}.`);
    const a = trialFor(trials, entry.case_id, key.A);
    const b = trialFor(trials, entry.case_id, key.B);
    return [
      `## Dream ${index + 1}: ${entry.case_id}`,
      '',
      'DREAM',
      '',
      block(entry.dream),
      '',
      'A',
      '',
      'Reading',
      '',
      block(a?.generated_reading || '(missing reading)'),
      '',
      'Question',
      '',
      block(a?.generated_question || '(missing question)'),
      '',
      'B',
      '',
      'Reading',
      '',
      block(b?.generated_reading || '(missing reading)'),
      '',
      'Question',
      '',
      block(b?.generated_question || '(missing question)'),
      '',
    ].join('\n');
  });
  return [
    '# Blind paired review — same-call Standard/CORE',
    '',
    `Generated: ${generatedAt}`,
    '',
    'Labels A/B are randomized. Do not open KEY.json until scoring is complete.',
    'Score each pair independently. Historical final24 v1.1 outputs are not in this packet.',
    '',
    sections.join('\n'),
  ].join('\n');
}

function humanScoringBrief(): string {
  return `# HUMAN SCORING — same-call v1.2 paired gate

Do not ask which label is which until scoring is complete.

For every pair, first answer:

**Which question would you rather actually answer after this reading?**

- A
- B
- Tie
- Neither

Then score:

1. Which returns you more strongly to this specific dream?
2. Which has more genuine live movement / live point?
3. Which offers more possibility of discovery without asking for interpretation?
4. Any invented content?
5. Any missing-footage / memory-test behavior?
6. Any forced ranking/binary?
7. Any generic/template shell?
8. Is either same-call reading materially worse than the frozen Standard bar, or than the other reading in the pair?

## LIVE POINT

Does the question open a relation, movement, shift, tension, change, threshold, arrival, settling, or atmosphere already alive in the dream, or does it merely point back at a scene?

A live point does not require conflict, tension, or unresolvedness. In restorative or cohesive dreams it may be an arrival, settling, shift in atmosphere, or deepening of presence.

## DISCOVERY

Can the dreamer discover something by answering without being asked to interpret, fabricate, or retrieve missing footage?

If the answer surface is basically sensory reconstruction or paraphrase (\`How was X?\`, \`What did X look like?\`) with no live point, max **WEAK**.

## After scoring

| Dream | Prefer | Notes |
| ----- | ------ | ----- |
| 1 | A / B / Tie / Neither | |
| 2 | | |
| 3 | | |
| 4 | | |
| 5 | | |
| 6 | | |
| 7 | | |
| 8 | | |
| **Prefer count** | | |

Paired gate to proceed to a later final 24:

- preference on at least **6/8**
- **0 hard semantic FAIL**
- **0 missing-footage / memory-test FAIL**
- does not reintroduce forced choice/ranking
- does not materially degrade the Standard reading
- clear live-point / discovery improvement rather than a new wording template

If it gets 5/8 or worse, or solves flatness by bringing interpretation/invention back, STOP.
Do not mutate the prompt automatically.
`;
}

function loadSecondaryFinal24Standard(): string {
  const rawPath = path.join(process.cwd(), SECONDARY_V11_FINAL24_DIR, 'RAW_RESPONSES.json');
  if (!existsSync(rawPath)) {
    return '# Secondary v1.1 final24 Standard reference\n\nMissing historical packet.\n';
  }
  const payload = JSON.parse(readFileSync(rawPath, 'utf8')) as {
    trials?: Array<{ case_id?: string; depth?: string; raw_content?: string }>;
  };
  const sections = (payload.trials ?? [])
    .filter((trial) => trial.depth === 'standard')
    .map((trial) => {
      const split = splitSameCallReadingAndQuestion(trial.raw_content ?? '');
      return [
        `## ${trial.case_id}`,
        '',
        'Question',
        '',
        block(split.question || '(missing)'),
        '',
      ].join('\n');
    });
  return [
    '# Secondary v1.1 final24 Standard/CORE reference',
    '',
    'Not part of the primary paired comparison. Historical sampling only.',
    '',
    ...sections,
  ].join('\n');
}

async function main(): Promise<void> {
  if (process.env[APPROVAL_ENV] !== '1') {
    throw new Error(`Paid run locked. Set ${APPROVAL_ENV}=1 only after explicit approval.`);
  }
  if (APPROVED_REFLECTIVE_QUESTION_PRODUCTION !== null) {
    throw new Error('Unexpected production approval state; refusing same-call paired gate.');
  }

  const v11Sha = hashSameCallMinimalV11Bundle();
  const v12Sha = hashSameCallMinimalBundle();
  const corpus = loadAndVerifyFrozenAnchorCorpus();
  if (corpus.cases.length !== 8) throw new Error('Expected 8 frozen Standard anchors.');

  const prepared = corpus.cases.flatMap((entry) => (
    VARIANTS.map((variant) => {
      const request = buildSameCallMinimalRequest({
        dream: {
          title: entry.title,
          date: '2026-08-28',
          content: entry.dream,
        },
        depth: 'standard',
        outputLanguage: entry.language,
        variant,
      });
      return { entry, variant, request };
    })
  ));
  if (prepared.length !== 16) throw new Error(`Expected 16 prepared calls, got ${prepared.length}.`);

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
      variant: item.variant,
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
        retries: call.retries,
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
      });
    }
  }

  const generatedAt = new Date().toISOString();
  const keys = assignBlindLabels(corpus.cases.map((entry) => entry.case_id));
  const outputDir = path.join(
    process.cwd(),
    'tmp',
    `same-call-minimal-v12-paired-${generatedAt.replace(/[:.]/gu, '-')}`
  );
  mkdirSync(outputDir, { recursive: true });
  writeFileSync(path.join(outputDir, 'README.md'), [
    '# Same-call v1.2 paired packet',
    '',
    '1. Score `BLIND_REVIEW.md` with `HUMAN_SCORING.md`.',
    '2. Do not open `KEY.json` until scoring is complete.',
    '3. `SECONDARY_V11_FINAL24_STANDARD.md` is historical regression only.',
    '',
  ].join('\n'));
  writeFileSync(path.join(outputDir, 'BLIND_REVIEW.md'), blindPacket(generatedAt, corpus.cases, trials, keys));
  writeFileSync(path.join(outputDir, 'HUMAN_SCORING.md'), humanScoringBrief());
  writeFileSync(path.join(outputDir, 'KEY.json'), JSON.stringify({
    generated_at: generatedAt,
    note: 'Open only after scoring.',
    v1_1_method: SAME_CALL_MINIMAL_V11_METHOD_ID,
    v1_2_method: SAME_CALL_MINIMAL_METHOD_ID,
    pairs: keys,
  }, null, 2));
  writeFileSync(path.join(outputDir, 'SECONDARY_V11_FINAL24_STANDARD.md'), loadSecondaryFinal24Standard());
  writeFileSync(path.join(outputDir, 'EXACT_PROMPT_STACK.md'), [
    '# Exact prompt stack — reveal after scoring',
    '',
    `v1.1.0 method: \`${SAME_CALL_MINIMAL_V11_METHOD_ID}\` SHA \`${v11Sha}\``,
    `v1.2.0 method: \`${SAME_CALL_MINIMAL_METHOD_ID}\` / \`${SAME_CALL_MINIMAL_PROMPT_ID}\` / \`${SAME_CALL_MINIMAL_PROMPT_VERSION}\` SHA \`${v12Sha}\``,
    `Reader: \`${DREAM_REFLECTION_PROMPT_ID}\` (production, unmodified)`,
    `Model: ${SAME_CALL_MINIMAL_MODEL}`,
    'Task: `interpretation_standard` for all 16 calls. QUESTION_MODE=CORE. Explicit OUTPUT_LANGUAGE.',
    '',
    'v1.2 System 4:',
    '',
    '```text',
    SAME_CALL_MINIMAL_QUESTION_PROMPT,
    '```',
    '',
    'v1.1 System 4 remains frozen for the paired comparison:',
    '',
    '```text',
    SAME_CALL_MINIMAL_V11_QUESTION_PROMPT,
    '```',
    '',
    'No examples were added to the production prompt. No anti-template variety instruction.',
    'No Director, taxonomy, evidence ids, no_question, question-first, repair, rewrite, or judge.',
    'Retry only for genuine transport/API failure. Nothing was deployed. Final 24 did not run.',
    '',
  ].join('\n'));
  writeFileSync(path.join(outputDir, 'RAW_RESPONSES.json'), JSON.stringify({
    generated_at: generatedAt,
    trials: trials.map((trial) => ({
      case_id: trial.case_id,
      variant: trial.variant,
      raw_content: trial.raw_content,
    })),
  }, null, 2));
  writeFileSync(path.join(outputDir, 'DIAGNOSTICS.json'), JSON.stringify({
    gate_id: GATE_ID,
    generated_at: generatedAt,
    v1_1_sha256: v11Sha,
    v1_2_sha256: v12Sha,
    this_run_spend_usd: Number(knownSpend.toFixed(8)),
    call_count: trials.length,
    missing_question_count: trials.filter((trial) => !trial.generated_question).length,
    trials: trials.map((trial) => ({
      case_id: trial.case_id,
      variant: trial.variant,
      language: trial.language,
      errors: trial.errors,
      provider: trial.provider,
      model: trial.model,
      latency_ms: trial.latency_ms,
      estimated_usd: trial.estimated_usd,
      retries: trial.retries,
      reading_chars: trial.generated_reading.length,
      question_chars: trial.generated_question?.length ?? 0,
      question: trial.generated_question,
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
