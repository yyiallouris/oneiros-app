/**
 * Synthetic Oneiros Reflective Dialogue v1 trajectory benchmark.
 *
 * Fixed prior reading + visible question + varied user reply
 *   -> shared dialogue answer prompt
 *   -> RQ v5 single-pass question engine
 *
 * No user dream data is loaded. Raw model output is written only under tmp/;
 * console output contains scenario ids and mechanical status only.
 */
import { createHash } from 'crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { estimateAiCallCost, type AiCallCost } from '../../../src/billing/aiPricing';
import {
  buildChatFollowupRequest,
  stripTrailingReflectiveDialogueQuestion,
} from '../../../src/ai/dreamReflectionPrompt';
import { buildChatReflectiveLanguageContext } from '../../../src/ai/reflectiveLanguage';
import {
  parseReflectiveDialogueAnswer,
  resolveReflectiveDialogueAnswer,
  type ReflectiveDialogueResponseFormat,
} from '../../../src/ai/reflectiveDialogueResponseFormat';
import { buildReflectiveQuestionResponseFormat, type ReflectiveQuestionResponseFormat } from '../../../src/ai/reflectiveQuestionResponseFormat';
import {
  REFLECTIVE_QUESTION_TEMPERATURE,
  REFLECTIVE_QUESTION_TOKEN_LIMIT,
  REFLECTIVE_QUESTION_METHOD_ID,
  REFLECTIVE_QUESTION_PRODUCTION_BUNDLE,
  buildDreamEvidenceSpans,
  buildReflectiveQuestionMessages,
  buildUserEvidenceSpans,
  parseReflectiveQuestionResult,
  validateReflectiveQuestionCommit,
} from '../../../src/ai/reflectiveQuestionPrompt';
import { PENDING_REFLECTIVE_DIALOGUE_PRODUCTION_CANDIDATE } from '../../../src/ai/reflectiveQuestionProductionHold';
import {
  REFLECTIVE_DIALOGUE_HUMAN_QUALITY_GATE,
  REFLECTIVE_DIALOGUE_V1_BENCHMARK_ID,
  REFLECTIVE_DIALOGUE_V1_BENCHMARK_VERSION,
  selectReflectiveDialogueV1Scenarios,
  assertReflectiveDialogueV1PaidScope,
  summarizeReflectiveDialogueV1Benchmark,
  type ReflectiveDialogueV1Scenario,
} from '../../lib/reflectiveDialogueV1Benchmark';

const REMOTE_FULL_QUALITY_ROUTE_ALIAS = 'interpretation_quick' as const;
const DEFAULT_CONCURRENCY = 2;

type ProxyResult = {
  content: string;
  latencyMs: number;
  provider: string | null;
  model: string | null;
  cost: AiCallCost;
};

type Trial = {
  scenario_id: string;
  response_type: ReflectiveDialogueV1Scenario['responseType'];
  source_language: string;
  expected_output_language: string;
  title: string;
  dream: string;
  prior_reading: string;
  visible_question: string;
  user_reply: string;
  reviewer_focus: string;
  answer: string | null;
  raw_answer: string | null;
  reply_mode: string | null;
  answer_question_paragraph_removed: boolean;
  user_evidence: Array<{ id: string; text: string }>;
  status: 'question' | 'abstain' | 'technical_failure';
  question_decision: 'question' | 'abstain' | 'not_run';
  final_question: string | null;
  output_language: string | null;
  final_evidence_ids: string[];
  technical_error: string | null;
  latency_ms: {
    answer: number | null;
    question: number | null;
    total: number;
  };
  estimated_usd: {
    answer: number | null;
    question: number | null;
    total: number | null;
  };
};

function loadDotenvValue(key: string): string | undefined {
  const envPath = path.join(process.cwd(), '.env');
  if (!existsSync(envPath)) return undefined;
  const match = readFileSync(envPath, 'utf8').match(
    new RegExp(`^${key}\\s*=\\s*(.*)$`, 'm')
  );
  return match?.[1]?.trim().replace(/^['"]|['"]$/g, '');
}

function getEnv(keys: string[]): string {
  for (const key of keys) {
    const value = process.env[key] ?? loadDotenvValue(key);
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
}

function sha256(value: string): string {
  return createHash('sha256').update(value.trim()).digest('hex');
}

function assertCandidateIdentity(): string {
  const localSha = sha256(REFLECTIVE_QUESTION_PRODUCTION_BUNDLE);
  if (
    REFLECTIVE_QUESTION_METHOD_ID !==
      PENDING_REFLECTIVE_DIALOGUE_PRODUCTION_CANDIDATE.chatQuestionMethodId ||
    localSha !== PENDING_REFLECTIVE_DIALOGUE_PRODUCTION_CANDIDATE.chatQuestionPromptSha256
  ) {
    throw new Error(
      `Dialogue benchmark identity drifted: ${REFLECTIVE_QUESTION_METHOD_ID}/${localSha}.`
    );
  }
  return localSha;
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
  const choice = (
    payload.choices as Array<{ message?: { content?: string } }> | undefined
  )?.[0];
  if (typeof choice?.message?.content === 'string') return choice.message.content.trim();
  if (typeof payload.content === 'string') return payload.content.trim();
  if (typeof payload.text === 'string') return payload.text.trim();
  return '';
}

async function callProxy(params: {
  endpoint: string;
  anonKey: string;
  token: string;
  task: string;
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
  temperature: number;
  tokenLimit: number;
  responseFormat?: ReflectiveQuestionResponseFormat | ReflectiveDialogueResponseFormat;
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
      model: 'gpt-5.4',
      task: params.task,
      messages: params.messages,
      temperature: params.temperature,
      max_completion_tokens: params.tokenLimit,
      max_tokens: params.tokenLimit,
      ...(params.responseFormat ? { response_format: params.responseFormat } : {}),
      disable_anthropic_fallback: true,
    }),
  });
  if (!response.ok) throw new Error(`proxy_http_${response.status}`);
  const payload = await response.json() as Record<string, unknown>;
  const content = extractContent(payload);
  if (!content) throw new Error('proxy_empty_content');
  const provider = response.headers.get('x-ai-provider');
  return {
    content,
    latencyMs: Date.now() - startedAt,
    provider,
    model:
      response.headers.get('x-ai-model') ??
      (typeof payload.model === 'string' ? payload.model : null),
    cost: estimateAiCallCost(payload, provider),
  };
}

async function runScenario(params: {
  scenario: ReflectiveDialogueV1Scenario;
  endpoint: string;
  anonKey: string;
  token: string;
}): Promise<Trial> {
  const startedAt = Date.now();
  const trial: Trial = {
    scenario_id: params.scenario.id,
    response_type: params.scenario.responseType,
    source_language: params.scenario.language,
    expected_output_language:
      params.scenario.expectedOutputLanguage ?? params.scenario.language,
    title: params.scenario.title,
    dream: params.scenario.dream,
    prior_reading: params.scenario.priorReading,
    visible_question: params.scenario.visibleQuestion,
    user_reply: params.scenario.userReply,
    reviewer_focus: params.scenario.reviewerFocus,
    answer: null,
    raw_answer: null,
    reply_mode: null,
    answer_question_paragraph_removed: false,
    user_evidence: [],
    status: 'technical_failure',
    question_decision: 'not_run',
    final_question: null,
    output_language: null,
    final_evidence_ids: [],
    technical_error: null,
    latency_ms: { answer: null, question: null, total: 0 },
    estimated_usd: {
      answer: null,
      question: null,
      total: null,
    },
  };
  const conversation = [{
    role: 'assistant' as const,
    content: params.scenario.priorReading,
    reflectiveQuestion: {
      status: 'question',
      question: params.scenario.visibleQuestion,
      languageCode: params.scenario.language,
    },
  }];

  try {
    const answerRequest = buildChatFollowupRequest({
      dream: {
        title: params.scenario.title,
        date: '2026-08-27',
        content: params.scenario.dream,
      },
      conversation,
      userMessage: params.scenario.userReply,
      isFinalResponse: false,
    });
    const answerCall = await callProxy({
      endpoint: params.endpoint,
      anonKey: params.anonKey,
      token: params.token,
      task: REMOTE_FULL_QUALITY_ROUTE_ALIAS,
      messages: answerRequest.messages,
      temperature: answerRequest.temperature,
      tokenLimit: answerRequest.tokenLimit,
      responseFormat: answerRequest.responseFormat,
    });
    trial.raw_answer = answerCall.content;
    const parsedAnswer = parseReflectiveDialogueAnswer(
      answerCall.content,
      answerRequest.reflectiveLanguageContext!
    );
    if (!parsedAnswer.ok) {
      throw new Error(`answer_${parsedAnswer.errors.join('_')}`);
    }
    const expectedOutputLanguage =
      params.scenario.expectedOutputLanguage ?? params.scenario.language;
    if (parsedAnswer.data.output_language !== expectedOutputLanguage) {
      throw new Error('answer_wrong_language');
    }
    const resolvedAnswer = resolveReflectiveDialogueAnswer(parsedAnswer.data);
    trial.answer = stripTrailingReflectiveDialogueQuestion(resolvedAnswer);
    trial.reply_mode = parsedAnswer.data.reply_mode;
    trial.answer_question_paragraph_removed =
      trial.answer !== resolvedAnswer.trim();
    trial.latency_ms.answer = answerCall.latencyMs;
    trial.estimated_usd.answer = answerCall.cost.estimatedUsd;

    const dreamEvidence = buildDreamEvidenceSpans(params.scenario.dream);
    const userEvidence = buildUserEvidenceSpans(
      conversation,
      params.scenario.userReply
    );
    trial.user_evidence = userEvidence;
    const validIds = new Set([
      ...dreamEvidence.map((span) => span.id),
      ...userEvidence.map((span) => span.id),
    ]);
    const languageContext = buildChatReflectiveLanguageContext({
      dreamContent: params.scenario.dream,
      conversation,
      latestUserMessage: params.scenario.userReply,
      knownLanguageCode: params.scenario.language,
    });
    const questionCall = await callProxy({
      endpoint: params.endpoint,
      anonKey: params.anonKey,
      token: params.token,
      task: REMOTE_FULL_QUALITY_ROUTE_ALIAS,
      messages: buildReflectiveQuestionMessages({
        surface: 'chat',
        languageContext,
        evidenceSpans: dreamEvidence,
        userEvidenceSpans: userEvidence,
        chatAnswerContext: trial.answer,
        conversation,
        latestUserMessage: params.scenario.userReply,
      }),
      temperature: REFLECTIVE_QUESTION_TEMPERATURE,
      tokenLimit: REFLECTIVE_QUESTION_TOKEN_LIMIT,
      responseFormat: buildReflectiveQuestionResponseFormat(),
    });
    trial.latency_ms.question = questionCall.latencyMs;
    trial.estimated_usd.question = questionCall.cost.estimatedUsd;
    const parsed = parseReflectiveQuestionResult(
      questionCall.content,
      validIds,
      languageContext
    );
    if (!parsed.ok) throw new Error(`question_${parsed.errors.join('_')}`);
    trial.question_decision = parsed.data.decision;
    if (parsed.data.decision === 'abstain') {
      trial.status = 'abstain';
      return trial;
    }
    const commitErrors = validateReflectiveQuestionCommit(
      parsed.data,
      { previouslyAskedQuestions: [params.scenario.visibleQuestion] }
    );
    if (commitErrors.length > 0) {
      trial.status = 'abstain';
      return trial;
    }
    trial.output_language = parsed.data.output_language;
    if (
      parsed.data.output_language !== expectedOutputLanguage
    ) {
      throw new Error('question_wrong_language');
    }
    trial.status = 'question';
    trial.final_question = parsed.data.question;
    trial.final_evidence_ids = parsed.data.evidence_ids;
    return trial;
  } catch (error) {
    trial.status = 'technical_failure';
    trial.technical_error = error instanceof Error ? error.message : 'unknown_error';
    return trial;
  } finally {
    trial.latency_ms.total = Date.now() - startedAt;
    const completedCosts = [
      trial.estimated_usd.answer,
      trial.estimated_usd.question,
    ].filter((value): value is number => typeof value === 'number');
    trial.estimated_usd.total = completedCosts.length > 0
      ? Number(completedCosts.reduce((sum, value) => sum + value, 0).toFixed(8))
      : null;
  }
}

async function runWithConcurrency<T, R>(
  values: T[],
  concurrency: number,
  fn: (value: T) => Promise<R>
): Promise<R[]> {
  const results = new Array<R>(values.length);
  let cursor = 0;
  const workers = Array.from(
    { length: Math.min(concurrency, values.length) },
    async () => {
      while (cursor < values.length) {
        const index = cursor++;
        results[index] = await fn(values[index]);
      }
    }
  );
  await Promise.all(workers);
  return results;
}

function quote(value: string): string {
  return value.split('\n').map((line) => `> ${line}`).join('\n');
}

function humanPacket(generatedAt: string, trials: Trial[]): string {
  const lines = [
    '# Oneiros Reflective Dialogue v1 — blind trajectory review',
    '',
    `Generated: ${generatedAt}`,
    '',
    'Score 0–2: user-answer uptake, continuity, image-near depth, psychic expansion, epistemic restraint, human warmth, genuine desire to continue, next-opening quality, answer target-language naturalness, and optional-question target-language naturalness. Abstention can be the best outcome when the exchange is complete.',
    '',
  ];
  trials.forEach((trial, index) => {
    lines.push(
      `## ${index + 1}. ${trial.title}`,
      '',
      `Scenario: \`${trial.scenario_id}\` · ${trial.response_type} · expected language ${trial.expected_output_language}`,
      '',
      '### Visible question', '', quote(trial.visible_question), '',
      '### User reply', '', quote(trial.user_reply), '',
      '### Oneiros answer', '', quote(trial.answer ?? '(unavailable)'), '',
      '### Optional next question', '', quote(trial.final_question ?? '(none)'), '',
      'Scores: uptake __/2 · continuity __/2 · depth __/2 · expansion __/2 · restraint __/2 · warmth __/2 · desire __/2 · next opening __/2 · answer language __/2 · question language __/2',
      '',
      'Preferable to abstain after the answer: YES / NO',
      '',
      'Verdict: PASS / WEAK / FAIL', '', 'Note:', '', '---', ''
    );
  });
  return `${lines.join('\n')}\n`;
}

async function main(): Promise<void> {
  const localSha = assertCandidateIdentity();
  const diagnosticIdsRaw = getEnv([
    'REFLECTIVE_DIALOGUE_V1_DIAGNOSTIC_SCENARIO_IDS',
  ]);
  const scenarios = selectReflectiveDialogueV1Scenarios(
    diagnosticIdsRaw ? diagnosticIdsRaw.split(',') : undefined
  );
  assertReflectiveDialogueV1PaidScope({
    scenarioCount: scenarios.length,
    explicitFullRunApproval:
      getEnv(['REFLECTIVE_DIALOGUE_V1_ALLOW_FULL_CORPUS']) === '1',
  });
  const supabaseUrl = getEnv(['EXPO_PUBLIC_SUPABASE_URL', 'SUPABASE_URL']).replace(/\/$/, '');
  const anonKey = getEnv(['EXPO_PUBLIC_SUPABASE_ANON_KEY', 'SUPABASE_ANON_KEY']);
  const endpoint = getEnv(['EXPO_PUBLIC_CUSTOM_GPT_ENDPOINT', 'CUSTOM_GPT_ENDPOINT']);
  if (!supabaseUrl || !anonKey || !endpoint) {
    throw new Error('Missing Supabase URL, anon key, or custom GPT endpoint.');
  }
  const token = await getAccessToken(supabaseUrl, anonKey);
  const concurrencyRaw = Number(getEnv(['REFLECTIVE_DIALOGUE_V1_BENCHMARK_CONCURRENCY']));
  const concurrency = Number.isInteger(concurrencyRaw) && concurrencyRaw > 0
    ? Math.min(concurrencyRaw, 4)
    : DEFAULT_CONCURRENCY;
  let completed = 0;
  const trials = await runWithConcurrency(
    scenarios,
    concurrency,
    async (scenario) => {
      const trial = await runScenario({ scenario, endpoint, anonKey, token });
      completed += 1;
      process.stdout.write(
        `Completed ${completed}/${scenarios.length}: ${scenario.id}; status=${trial.status}; decision=${trial.question_decision}.\n`
      );
      return trial;
    }
  );
  const generatedAt = new Date().toISOString();
  const outputDir = path.join(
    process.cwd(),
    'tmp',
    `reflective-dialogue-v1-benchmark-${generatedAt.replace(/[:.]/g, '-')}`
  );
  mkdirSync(outputDir, { recursive: true });
  const summary = summarizeReflectiveDialogueV1Benchmark(
    trials.map((trial) => ({
      status: trial.status,
      answerQuestionParagraphRemoved: trial.answer_question_paragraph_removed,
      userEvidenceCount: trial.user_evidence.length,
    }))
  );
  const estimatedCosts = trials
    .map((trial) => trial.estimated_usd.total)
    .filter((value): value is number => typeof value === 'number');
  const estimatedUsd = estimatedCosts.length > 0
    ? Number(estimatedCosts.reduce((sum, value) => sum + value, 0).toFixed(8))
    : null;
  writeFileSync(
    path.join(outputDir, 'results.json'),
    `${JSON.stringify({
      benchmark_id: REFLECTIVE_DIALOGUE_V1_BENCHMARK_ID,
      benchmark_version: REFLECTIVE_DIALOGUE_V1_BENCHMARK_VERSION,
      generated_at: generatedAt,
      method_id: REFLECTIVE_QUESTION_METHOD_ID,
      prompt_sha256: localSha,
      synthetic_only: true,
      diagnostic_only: Boolean(diagnosticIdsRaw),
      scenario_count: scenarios.length,
      remote_question_route_alias: REMOTE_FULL_QUALITY_ROUTE_ALIAS,
      fallback_disabled: true,
      human_quality_gate: REFLECTIVE_DIALOGUE_HUMAN_QUALITY_GATE,
      summary: { ...summary, estimated_usd: estimatedUsd },
      trials,
    }, null, 2)}\n`
  );
  writeFileSync(
    path.join(outputDir, 'HUMAN_REVIEW_PACKET.md'),
    humanPacket(generatedAt, trials)
  );
  writeFileSync(
    path.join(outputDir, 'REVIEW_SHEET.json'),
    `${JSON.stringify(trials.map((trial) => ({
      scenario_id: trial.scenario_id,
      user_answer_uptake: null,
      continuity: null,
      image_near_depth: null,
      psychic_expansion: null,
      epistemic_restraint: null,
      human_warmth: null,
      genuine_desire_to_continue: null,
      next_opening_quality: null,
      answer_target_language_naturalness: null,
      question_target_language_naturalness: null,
      next_question_preferable_to_abstain: null,
      verdict: null,
      note: '',
    })), null, 2)}\n`
  );
  process.stdout.write(
    `Dialogue benchmark complete: questions=${summary.question_count}; abstentions=${summary.abstention_count}; failures=${summary.technical_failure_count}; estimatedUsd=${estimatedUsd ?? 'unknown'}.\n${outputDir}\n`
  );
}

void main().catch((error) => {
  process.stderr.write(
    `Reflective-dialogue v1 benchmark failed: ${error instanceof Error ? error.message : 'unknown_error'}\n`
  );
  process.exitCode = 1;
});
