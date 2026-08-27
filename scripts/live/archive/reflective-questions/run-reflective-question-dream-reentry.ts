import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { estimateAiCallCost, type AiCallCost } from '../../../../src/billing/aiPricing';
import {
  buildSimplifiedReaderPrompt,
  parseSingleReflectiveQuestion,
  sentenceForm,
  SIMPLIFIED_READER_EXPERIMENT_ID,
  SIMPLIFIED_READER_EXPERIMENT_VERSION,
} from './reflective-question-dream-reentry';

type GoldenCase = {
  id: string;
  category: string;
  language: string;
  title: string;
  content: string;
  reading_context?: string;
};

type GoldenSet = {
  version: string;
  cases: GoldenCase[];
};

type Trial = {
  case_id: string;
  category: string;
  repeat: number;
  dream: string;
  question: string | null;
  sentence_form: string | null;
  raw: string;
  parse_error: string | null;
  latency_ms: number;
  provider: string | null;
  model: string | null;
  cost: AiCallCost;
};

const DEFAULT_REPEAT_COUNT = 3;
const MAX_REPEAT_COUNT = 5;

function loadDotenvValue(key: string): string | undefined {
  const envPath = path.join(process.cwd(), '.env');
  if (!existsSync(envPath)) return undefined;
  const match = readFileSync(envPath, 'utf8').match(new RegExp(`^${key}\\s*=\\s*(.*)$`, 'm'));
  return match?.[1]?.trim().replace(/^['"]|['"]$/g, '');
}

function getEnv(keys: string[]): string {
  for (const key of keys) {
    const value = process.env[key] ?? loadDotenvValue(key);
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
}

function repeatCount(): number {
  const raw = getEnv(['REFLECTIVE_QUESTION_REENTRY_REPEATS']);
  if (!raw) return DEFAULT_REPEAT_COUNT;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > MAX_REPEAT_COUNT) {
    throw new Error(
      `REFLECTIVE_QUESTION_REENTRY_REPEATS must be an integer from 1 to ${MAX_REPEAT_COUNT}.`
    );
  }
  return parsed;
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
  const choice = (payload.choices as Array<{ message?: { content?: string } }> | undefined)?.[0];
  if (typeof choice?.message?.content === 'string') return choice.message.content.trim();
  if (typeof payload.content === 'string') return payload.content.trim();
  if (typeof payload.text === 'string') return payload.text.trim();
  return '';
}

function inferProvider(payload: Record<string, unknown>): string | null {
  if (typeof payload.provider === 'string') return payload.provider;
  const model = typeof payload.model === 'string' ? payload.model.toLowerCase() : '';
  if (model.includes('claude')) return 'anthropic';
  if (model.includes('gpt-')) return 'openai';
  return null;
}

function percentile(values: number[], percent: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil((percent / 100) * sorted.length) - 1;
  return sorted[Math.max(0, Math.min(sorted.length - 1, index))];
}

function dreamInput(testCase: GoldenCase): string {
  return `Title: ${testCase.title}\n\nDream:\n${testCase.content}\n\nRelevant reading context:\n${testCase.reading_context?.trim() || '(none supplied for this isolated golden-set case)'}`;
}

async function callProxy(params: {
  endpoint: string;
  anonKey: string;
  token: string;
  language: string;
  input: string;
}): Promise<Omit<Trial, 'case_id' | 'category' | 'repeat' | 'dream'>> {
  const startedAt = Date.now();
  const response = await fetch(params.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: params.anonKey,
      Authorization: `Bearer ${params.token}`,
    },
    body: JSON.stringify({
      task: 'interpretation_standard',
      model: 'gpt-5.4',
      messages: [
        {
          role: 'system',
          content:
            'You are Dream Weaver, a calm post-Jungian dream journal companion in an offline quality experiment.',
        },
        { role: 'system', content: buildSimplifiedReaderPrompt(params.language) },
        { role: 'user', content: params.input },
      ],
      temperature: 0.45,
      max_completion_tokens: 320,
    }),
  });
  const rawBody = await response.text();
  if (!response.ok) {
    throw new Error(`Simplified reader proxy call failed (${response.status}): ${rawBody.slice(0, 240)}`);
  }
  const payload = JSON.parse(rawBody) as Record<string, unknown>;
  const raw = extractContent(payload);
  if (!raw) throw new Error('Simplified reader proxy call returned empty content.');
  const provider = inferProvider(payload);
  let question: string | null = null;
  let parseError: string | null = null;
  try {
    question = parseSingleReflectiveQuestion(raw);
  } catch (error) {
    parseError = error instanceof Error ? error.message : String(error);
  }
  return {
    question,
    sentence_form: question ? sentenceForm(question) : null,
    raw,
    parse_error: parseError,
    latency_ms: Date.now() - startedAt,
    provider,
    model: typeof payload.model === 'string' ? payload.model : null,
    cost: estimateAiCallCost(payload, provider),
  };
}

function metrics(trials: Trial[]) {
  const priced = trials.every((trial) => typeof trial.cost.estimatedUsd === 'number');
  const sentenceForms = trials.reduce<Record<string, number>>((counts, trial) => {
    if (trial.sentence_form) counts[trial.sentence_form] = (counts[trial.sentence_form] ?? 0) + 1;
    return counts;
  }, {});
  const dominant = Object.entries(sentenceForms).sort((a, b) => b[1] - a[1])[0] ?? null;
  return {
    trials: trials.length,
    valid_single_questions: trials.filter((trial) => trial.question).length,
    technical_failures: trials.filter((trial) => !trial.question).length,
    latency_p50_ms: percentile(trials.map((trial) => trial.latency_ms), 50),
    latency_p95_ms: percentile(trials.map((trial) => trial.latency_ms), 95),
    total_calls: trials.length,
    total_input_tokens: trials.reduce((sum, trial) => sum + trial.cost.inputTokens, 0),
    total_cached_input_tokens: trials.reduce((sum, trial) => sum + trial.cost.cachedInputTokens, 0),
    total_output_tokens: trials.reduce((sum, trial) => sum + trial.cost.outputTokens, 0),
    total_tokens: trials.reduce((sum, trial) => sum + trial.cost.totalTokens, 0),
    total_estimated_usd: priced
      ? Number(trials.reduce((sum, trial) => sum + (trial.cost.estimatedUsd ?? 0), 0).toFixed(8))
      : null,
    sentence_forms: sentenceForms,
    dominant_sentence_form: dominant ? { form: dominant[0], count: dominant[1] } : null,
  };
}

function reviewPacket(params: {
  generatedAt: string;
  goldenSet: GoldenSet;
  repeats: number;
  trials: Trial[];
}): string {
  return [
    '# Oneiros Reflective Questions — Simplified Reader Final Packet',
    '',
    `- Generated: ${params.generatedAt}`,
    `- Experiment: ${SIMPLIFIED_READER_EXPERIMENT_ID}`,
    `- Fixture: ${params.goldenSet.version}; ${params.goldenSet.cases.length} unchanged cases × ${params.repeats} repeats`,
    '- Output: one plain model-written reflective question',
    '- Reviewer/candidates/rewrite/code-generated prose: none',
    '- Production path changed: no',
    '- Golden labels exposed to model: no',
    '',
    '## Machine measurements',
    '',
    '```json',
    JSON.stringify(metrics(params.trials), null, 2),
    '```',
    '',
    '## Human release gate',
    '',
    '`PASS` requires Dream-specific, Epistemically clean, Re-entry, and Human pull. Release requires at least `20/24` strong PASS, zero epistemic FAIL, every dream at least `2/3`, White Bird and Erotic River each at least `2/3`, and no dominant sentence-form collapse.',
    '',
    ...params.trials.flatMap((trial) => [
      `## ${trial.case_id} — repeat ${trial.repeat}/${params.repeats}`,
      '',
      `**Category:** ${trial.category}`,
      '',
      '**Dream**',
      '',
      trial.dream,
      '',
      '**Reflective question**',
      '',
      trial.question ?? `(technical failure: ${trial.parse_error ?? 'unknown'})\n\nRaw: ${trial.raw}`,
      '',
      `Sentence form: ${trial.sentence_form ?? 'unavailable'}`,
      '',
      `Call: ${trial.latency_ms} ms; ${trial.cost.totalTokens} tokens; ${typeof trial.cost.estimatedUsd === 'number' ? `$${trial.cost.estimatedUsd.toFixed(6)}` : 'cost unavailable'}; ${trial.provider ?? 'unknown'}/${trial.model ?? 'unknown'}`,
      '',
      '| Dream-specific | Epistemically clean | Re-entry | Human pull | Decision | Notes |',
      '|---|---|---|---|---|---|',
      '| PASS / FAIL | PASS / FAIL | PASS / FAIL | PASS / FAIL | PASS / FAIL |  |',
      '',
    ]),
  ].join('\n');
}

async function main() {
  const fixturePath = path.join(
    process.cwd(),
    'testing/live-scenarios/reflective-questions-golden-set.v1.json'
  );
  const goldenSet = JSON.parse(readFileSync(fixturePath, 'utf8')) as GoldenSet;
  if (goldenSet.cases.length !== 8) throw new Error('Simplified reader experiment requires 8 cases.');
  const repeats = repeatCount();
  const supabaseUrl = getEnv(['EXPO_PUBLIC_SUPABASE_URL', 'SUPABASE_URL']).replace(/\/$/, '');
  const anonKey = getEnv(['EXPO_PUBLIC_SUPABASE_ANON_KEY', 'SUPABASE_ANON_KEY']);
  const endpoint = getEnv(['EXPO_PUBLIC_CUSTOM_GPT_ENDPOINT', 'CUSTOM_GPT_ENDPOINT']);
  if (!supabaseUrl || !anonKey || !endpoint) {
    throw new Error('Missing Supabase URL, anon key, or custom GPT endpoint.');
  }
  const token = await getAccessToken(supabaseUrl, anonKey);
  const trials: Trial[] = [];

  for (let repeat = 1; repeat <= repeats; repeat += 1) {
    for (const testCase of goldenSet.cases) {
      const call = await callProxy({
        endpoint,
        anonKey,
        token,
        language: testCase.language === 'el' ? 'Greek' : testCase.language,
        input: dreamInput(testCase),
      });
      trials.push({
        case_id: testCase.id,
        category: testCase.category,
        repeat,
        dream: testCase.content,
        ...call,
      });
      process.stdout.write(
        `Completed ${testCase.id} — repeat ${repeat}/${repeats}; valid=${call.question ? 'yes' : 'no'}; form=${call.sentence_form ?? 'none'}\n`
      );
    }
  }

  const generatedAt = new Date().toISOString();
  const outputDir = path.join(
    process.cwd(),
    'tmp',
    `reflective-question-simplified-reader-${generatedAt.replace(/[:.]/g, '-')}`
  );
  mkdirSync(outputDir, { recursive: true });
  writeFileSync(
    path.join(outputDir, 'results.json'),
    JSON.stringify(
      {
        generated_at: generatedAt,
        experiment_id: SIMPLIFIED_READER_EXPERIMENT_ID,
        experiment_version: SIMPLIFIED_READER_EXPERIMENT_VERSION,
        fixture_version: goldenSet.version,
        repeat_count: repeats,
        prompt_architecture: 'simplified_reader_single_question',
        production_path_changed: false,
        reviewer_call_used: false,
        candidate_generation_used: false,
        rewrite_used: false,
        code_generated_question_language: false,
        golden_labels_exposed_to_model: false,
        release_gate: {
          minimum_strong_passes: 20,
          maximum_epistemic_fails: 0,
          minimum_passes_per_case: 2,
          white_bird_minimum_passes: 2,
          erotic_river_minimum_passes: 2,
          dominant_sentence_form_collapse_allowed: false,
        },
        metrics: metrics(trials),
        trials,
      },
      null,
      2
    )
  );
  writeFileSync(
    path.join(outputDir, 'REVIEW_PACKET.md'),
    reviewPacket({ generatedAt, goldenSet, repeats, trials })
  );
  process.stdout.write(`${outputDir}\n`);
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
