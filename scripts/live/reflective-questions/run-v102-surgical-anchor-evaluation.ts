/**
 * Frozen anchor-only evaluation for the v1.0.2 surgical prompt candidate.
 * No gateway deploy, retry, judge, repair, or broad benchmark.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { estimateAiCallCost, type AiCallCost } from '../../../src/billing/aiPricing';
import {
  buildChatFollowupRequest,
  buildInitialReflectionRequest,
  END_MARKER_DREAM_READING,
  SAME_CALL_REFLECTIVE_QUESTIONS_BUNDLE,
  SAME_CALL_REFLECTIVE_QUESTIONS_METHOD_ID,
} from '../../../src/ai/dreamReflectionPrompt';
import { extractSameCallReflectiveQuestions } from '../../../src/ai/reflectiveQuestionExtract';
import { safeObserveReflectiveContract } from '../../../src/ai/reflectiveContractObservation';
import {
  APPROVED_REFLECTIVE_QUESTION_PRODUCTION,
  PENDING_REFLECTIVE_DIALOGUE_PRODUCTION_CANDIDATE,
  hashReflectiveQuestionPrompt,
} from '../../../src/ai/reflectiveQuestionProductionHold';

const BASELINE_PATH = path.join(
  process.cwd(),
  'testing/reflective-questions/artifacts/v1.0.1-production-diagnostic-2026-08-29/RAW_RESULTS.json'
);
const BASELINE_FIXTURE_SHA =
  '5e821d2578e5e0f7e688b20b16755b56cabe73590d361429dbff9a0c2af7bbcc';
const CANDIDATE_METHOD = 'oneiros-same-call-reflective-questions-v1.0.2-candidate';
const CANDIDATE_SHA =
  '94d4a92a4a88d4104fa3dcc5790209a4fd3b34cec56dc1724eade78255798b96';
const APPROVAL_ENV = 'ONEIROS_V102_SURGICAL_ANCHORS_COST_APPROVED';
const COST_CAP_USD = 1;
const CONCURRENCY = 2;

const READER_FAILURE_ANCHORS = [
  'en-s-ancestor-coat:reading_standard',
  'en-s-conflict-bridge:reading_standard',
  'en-a-surreal-whale-library:reading_advanced',
  'en-a-complex-city-tide:reading_advanced',
  'el-s-body-bark:reading_standard',
  'el-s-conflict-house:reading_standard',
  'el-a-complex-hospital:reading_advanced',
  'el-a-ancestor-olive-door:reading_advanced',
  'pl-a-conflict-stairs:reading_advanced',
  'zh-a-ambiguous-ancestor-river:reading_advanced',
] as const;

const CHAT_FAILURE_ANCHORS = [
  'el-q-relational-brother:chat_followup',
  'el-a-surreal-moon-kitchen:chat_followup',
  'es-q-relational-balcony:chat_followup',
  'pl-a-conflict-stairs:chat_followup',
] as const;

const CONTROL_ANCHORS = [
  'en-q-restorative-garden:reading_quick',
  'en-s-body-glass-hands:reading_standard',
  'el-a-surreal-moon-kitchen:reading_advanced',
  'pt-s-body-feathers:reading_standard',
  'de-q-threshold-forest:reading_quick',
  'en-a-complex-city-tide:chat_followup',
] as const;

type Depth = 'quick' | 'standard' | 'advanced';
type Surface = 'reading_quick' | 'reading_standard' | 'reading_advanced' | 'chat_followup';
type BaselineGeneration = {
  generation_id: string;
  case_id: string;
  title: string;
  dream: string;
  mode: Depth;
  language: string;
  surface: Surface;
  user_turn: string | null;
  output: string;
  extracted_reflective_questions: string[];
  contract_validation: Record<string, unknown>;
};
type ProxyResult = {
  content: string;
  provider: string | null;
  model: string | null;
  latencyMs: number;
  cost: AiCallCost;
};

function loadDotenvValue(key: string): string | undefined {
  if (!existsSync('.env')) return undefined;
  return readFileSync('.env', 'utf8')
    .match(new RegExp(`^${key}\\s*=\\s*(.*)$`, 'm'))?.[1]
    ?.trim().replace(/^['"]|['"]$/gu, '');
}

function getEnv(keys: string[]): string {
  for (const key of keys) {
    const value = process.env[key] ?? loadDotenvValue(key);
    if (value?.trim()) return value.trim();
  }
  return '';
}

async function getAccessToken(url: string, anonKey: string): Promise<string> {
  const existing = getEnv(['LIVE_SUPABASE_ACCESS_TOKEN', 'SUPABASE_ACCESS_TOKEN']);
  if (existing) return existing;
  const email = getEnv(['LIVE_SUPABASE_EMAIL']);
  const password = getEnv(['LIVE_SUPABASE_PASSWORD']);
  if (!email || !password) throw new Error('Missing live Supabase credentials.');
  const response = await fetch(`${url}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: anonKey },
    body: JSON.stringify({ email, password }),
  });
  if (!response.ok) throw new Error(`auth_http_${response.status}`);
  const token = (await response.json() as { access_token?: string }).access_token;
  if (!token) throw new Error('Auth returned no access token.');
  return token;
}

function responseContent(payload: Record<string, unknown>): string {
  const choices = Array.isArray(payload.choices)
    ? payload.choices as Array<{ message?: { content?: string } }>
    : [];
  const content = choices[0]?.message?.content ??
    (typeof payload.content === 'string' ? payload.content : null);
  if (!content?.trim()) throw new Error('empty_proxy_response');
  return content.trim();
}

async function proxyCall(params: {
  endpoint: string;
  anonKey: string;
  token: string;
  request: ReturnType<typeof buildInitialReflectionRequest>;
}): Promise<ProxyResult> {
  const startedAt = Date.now();
  const response = await fetch(params.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: params.anonKey,
      Authorization: `Bearer ${params.token}`,
    },
    body: JSON.stringify({
      model: params.request.task === 'chat_followup' ? 'gpt-5.4-mini' : 'gpt-5.4',
      task: params.request.task,
      messages: params.request.messages,
      temperature: params.request.temperature,
      max_completion_tokens: params.request.tokenLimit,
      max_tokens: params.request.tokenLimit,
      disable_anthropic_fallback: true,
    }),
  });
  if (!response.ok) throw new Error(`proxy_http_${response.status}`);
  const payload = await response.json() as Record<string, unknown>;
  const provider = response.headers.get('x-ai-provider')?.trim().toLowerCase() ?? null;
  return {
    content: responseContent(payload),
    provider,
    model: response.headers.get('x-ai-model')?.trim() ??
      (typeof payload.model === 'string' ? payload.model : null),
    latencyMs: Date.now() - startedAt,
    cost: estimateAiCallCost(payload, provider),
  };
}

async function runWithConcurrency<T>(values: T[], work: (value: T) => Promise<void>): Promise<void> {
  let cursor = 0;
  async function worker(): Promise<void> {
    while (cursor < values.length) {
      const index = cursor;
      cursor += 1;
      await work(values[index]);
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));
}

function stripMarker(content: string): string {
  return content.replace(END_MARKER_DREAM_READING, '').trim();
}

async function main(): Promise<void> {
  const baseline = JSON.parse(readFileSync(BASELINE_PATH, 'utf8')) as {
    fixture_sha256: string;
    generations: BaselineGeneration[];
  };
  const anchorIds = [...READER_FAILURE_ANCHORS, ...CHAT_FAILURE_ANCHORS, ...CONTROL_ANCHORS];
  if (baseline.fixture_sha256 !== BASELINE_FIXTURE_SHA) throw new Error('Baseline fixture drifted.');
  if (new Set(anchorIds).size !== 20) throw new Error('Anchor ids must be exactly 20 unique cases.');
  if (
    String(SAME_CALL_REFLECTIVE_QUESTIONS_METHOD_ID) !== CANDIDATE_METHOD ||
    hashReflectiveQuestionPrompt(SAME_CALL_REFLECTIVE_QUESTIONS_BUNDLE) !== CANDIDATE_SHA ||
    String(PENDING_REFLECTIVE_DIALOGUE_PRODUCTION_CANDIDATE.promptSha256) !== CANDIDATE_SHA
  ) throw new Error('Candidate identity drifted.');
  if (APPROVED_REFLECTIVE_QUESTION_PRODUCTION.methodId !== 'oneiros-same-call-reflective-questions-v1.0.1') {
    throw new Error('Production approval changed unexpectedly.');
  }
  const entries = anchorIds.map((id) => {
    const entry = baseline.generations.find((item) => item.generation_id === id);
    if (!entry) throw new Error(`Missing frozen anchor ${id}.`);
    return entry;
  });
  const preflight = {
    candidate_method: CANDIDATE_METHOD,
    candidate_sha256: CANDIDATE_SHA,
    baseline_fixture_sha256: BASELINE_FIXTURE_SHA,
    calls: entries.length,
    reader_failure_anchors: READER_FAILURE_ANCHORS.length,
    chat_failure_anchors: CHAT_FAILURE_ANCHORS.length,
    controls: CONTROL_ANCHORS.length,
    cost_cap_usd: COST_CAP_USD,
    model_retries: 0,
    semantic_judge_calls: 0,
  };
  if (process.argv.includes('--preflight')) {
    process.stdout.write(`${JSON.stringify(preflight, null, 2)}\n`);
    return;
  }
  if (process.env[APPROVAL_ENV] !== '1') {
    throw new Error(`Paid run locked. Set ${APPROVAL_ENV}=1 only after explicit approval.`);
  }

  const supabaseUrl = getEnv(['EXPO_PUBLIC_SUPABASE_URL', 'SUPABASE_URL']).replace(/\/$/u, '');
  const anonKey = getEnv(['EXPO_PUBLIC_SUPABASE_ANON_KEY', 'SUPABASE_ANON_KEY']);
  if (!supabaseUrl || !anonKey) throw new Error('Missing Supabase URL/anon key.');
  const token = await getAccessToken(supabaseUrl, anonKey);
  const endpoint = `${supabaseUrl}/functions/v1/openai-proxy`;
  const results: Array<Record<string, unknown>> = [];
  let knownSpend = 0;

  await runWithConcurrency(entries, async (entry) => {
    const isChat = entry.surface === 'chat_followup';
    const initial = baseline.generations.find((item) =>
      item.case_id === entry.case_id && item.surface.startsWith('reading_')
    );
    const request = isChat
      ? buildChatFollowupRequest({
          dream: { title: entry.title, date: '2026-08-29', content: entry.dream },
          conversation: [{ role: 'assistant', content: initial!.output }],
          userMessage: entry.user_turn!,
          isFinalResponse: false,
        })
      : buildInitialReflectionRequest(
          { title: entry.title, date: '2026-08-29', content: entry.dream },
          entry.mode
        );
    const call = await proxyCall({ endpoint, anonKey, token, request });
    const output = stripMarker(call.content);
    const surface = isChat ? 'chat' : entry.mode;
    const questions = extractSameCallReflectiveQuestions(output, surface);
    const validation = safeObserveReflectiveContract({
      content: output,
      contractSurface: surface,
      telemetrySurface: entry.surface,
      languageContext: request.reflectiveLanguageContext,
      isFinalChat: false,
    });
    knownSpend += call.cost.estimatedUsd ?? 0;
    if (knownSpend > COST_CAP_USD) throw new Error(`Hard cost cap exceeded: ${knownSpend}.`);
    results.push({
      generation_id: entry.generation_id,
      cohort: READER_FAILURE_ANCHORS.includes(entry.generation_id as never)
        ? 'reader_failure_anchor'
        : CHAT_FAILURE_ANCHORS.includes(entry.generation_id as never)
          ? 'chat_failure_anchor'
          : 'control',
      dream: entry.dream,
      user_turn: entry.user_turn,
      before: {
        output: entry.output,
        questions: entry.extracted_reflective_questions,
        validation: entry.contract_validation,
      },
      after: { output, questions, validation },
      provider: call.provider,
      model: call.model,
      latency_ms: call.latencyMs,
      estimated_usd: call.cost.estimatedUsd,
      human_editorial_verdict: 'PENDING',
      human_editorial_notes: 'PENDING',
    });
    process.stdout.write(`${results.length}/20 ${entry.generation_id} ${validation.passed ? 'PASS' : 'FAIL'}\n`);
  });

  const generatedAt = new Date().toISOString();
  const outputDir = path.join(
    process.cwd(),
    'tmp',
    `oneiros-v102-surgical-anchors-${generatedAt.replace(/[:.]/gu, '-')}`
  );
  mkdirSync(outputDir, { recursive: true });
  results.sort((a, b) => String(a.generation_id).localeCompare(String(b.generation_id)));
  writeFileSync(path.join(outputDir, 'RAW_BEFORE_AFTER.json'), JSON.stringify({
    ...preflight,
    generated_at: generatedAt,
    exact_cost_usd: Number(knownSpend.toFixed(8)),
    results,
  }, null, 2));
  writeFileSync(path.join(outputDir, 'HUMAN_REVIEW_PACKET.md'), [
    '# v1.0.2 surgical anchor review',
    '',
    `Candidate: \`${CANDIDATE_METHOD}\` / \`${CANDIDATE_SHA}\``,
    '',
    'Review before and after independently of mechanical PASS. Check specificity, supplied options, missing footage, Core depth, Deeper relational depth, and generic/therapy shells.',
    '',
    ...results.flatMap((result) => [
      `## ${result.generation_id}`,
      '',
      `Cohort: ${result.cohort}`,
      '',
      '### Dream', '~~~text', String(result.dream), '~~~', '',
      ...(result.user_turn ? ['### User turn', '~~~text', String(result.user_turn), '~~~', ''] : []),
      '### Before', '~~~text', String((result.before as { output: string }).output), '~~~', '',
      '### After', '~~~text', String((result.after as { output: string }).output), '~~~', '',
      'Human verdict: PENDING',
      'Human notes: PENDING',
      '',
    ]),
  ].join('\n'));
  process.stdout.write(`Artifacts: ${outputDir}\nCost: $${knownSpend.toFixed(8)} / $${COST_CAP_USD.toFixed(2)}\n`);
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
