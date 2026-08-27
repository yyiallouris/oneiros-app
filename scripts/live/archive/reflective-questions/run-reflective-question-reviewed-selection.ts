import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { estimateAiCallCost, type AiCallCost } from '../../../../src/billing/aiPricing';
import {
  REFLECTIVE_QUESTION_METHOD_ID,
  REFLECTIVE_QUESTION_METHOD_PROMPT,
  REFLECTIVE_QUESTION_METHOD_VERSION,
} from '../../../../src/ai/rd/reflective-questions/archive/reflectiveQuestionPrompt';
import {
  aggregateMeasurements,
  buildCandidateGeneratorPrompt,
  buildControlledRewritePrompt,
  CANDIDATE_REVIEWER_PROMPT,
  parseCandidates,
  parseControlledRewrite,
  parseReviewerResult,
  percentile,
  REVIEWED_SELECTION_EXPERIMENT_ID,
  REVIEWED_SELECTION_EXPERIMENT_VERSION,
  type CallMeasurement,
  type Candidate,
  type ReviewerResult,
} from './reflective-question-reviewed-selection';

type GoldenCase = {
  id: string;
  category: string;
  language: string;
  title: string;
  content: string;
  reading_context?: string;
  expected_anchors: string[];
  forbidden_assumptions: string[];
  irreducible_structure: string;
  must_not_drift_to: string;
  reviewer_focus: string;
};

type GoldenSet = {
  version: string;
  method_id: string;
  cases: GoldenCase[];
};

type ProxyCall = {
  stage: CallMeasurement['stage'];
  content: string;
  latencyMs: number;
  provider: string | null;
  model: string | null;
  cost: AiCallCost;
};

type Trial = {
  testCase: GoldenCase;
  repeat: number;
  baseline: {
    output: string;
    questions: string[];
    call: ProxyCall;
    measurement: ReturnType<typeof aggregateMeasurements>;
  };
  generator: {
    candidates: Candidate[];
    parseError: string | null;
    call: ProxyCall;
  };
  reviewer: {
    result: ReviewerResult | null;
    parseError: string | null;
    call: ProxyCall | null;
  };
  configurationB: {
    question: string | null;
    selectedId: string | null;
    measurement: ReturnType<typeof aggregateMeasurements>;
  };
  configurationC: {
    question: string | null;
    source: 'selected' | 'controlled_rewrite' | 'technical_failure';
    sourceCandidateId: string | null;
    rewriteCall: ProxyCall | null;
    rewriteParseError: string | null;
    measurement: ReturnType<typeof aggregateMeasurements>;
  };
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

function getRepeatCount(): number {
  const raw = getEnv(['REFLECTIVE_QUESTION_SELECTION_REPEATS']);
  if (!raw) return DEFAULT_REPEAT_COUNT;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > MAX_REPEAT_COUNT) {
    throw new Error(
      `REFLECTIVE_QUESTION_SELECTION_REPEATS must be an integer from 1 to ${MAX_REPEAT_COUNT}.`
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

function extractQuestionLines(output: string): string[] {
  const lines = output
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !/^#{1,6}\s/.test(line));
  const bullets = lines
    .filter((line) => /^[-*•]\s+/.test(line))
    .map((line) => line.replace(/^[-*•]\s+/, '').trim());
  return (bullets.length > 0 ? bullets : lines).filter((line) => /[?;]$/.test(line));
}

function inferProvider(payload: Record<string, unknown>): string | null {
  if (typeof payload.provider === 'string') return payload.provider;
  const model = typeof payload.model === 'string' ? payload.model.toLowerCase() : '';
  if (model.includes('claude')) return 'anthropic';
  if (model.includes('gpt-')) return 'openai';
  return null;
}

function measurement(call: ProxyCall): CallMeasurement {
  return { stage: call.stage, latencyMs: call.latencyMs, cost: call.cost };
}

async function callProxy(params: {
  endpoint: string;
  anonKey: string;
  token: string;
  stage: ProxyCall['stage'];
  task: 'interpretation_standard' | 'chat_followup' | 'interpretation_retry_compact';
  model: 'gpt-5.4' | 'gpt-5.4-mini';
  messages: Array<{ role: 'system' | 'user'; content: string }>;
  temperature: number;
  tokenLimit: number;
  json?: boolean;
}): Promise<ProxyCall> {
  const startedAt = Date.now();
  const response = await fetch(params.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: params.anonKey,
      Authorization: `Bearer ${params.token}`,
    },
    body: JSON.stringify({
      task: params.task,
      model: params.model,
      messages: params.messages,
      temperature: params.temperature,
      max_completion_tokens: params.tokenLimit,
      ...(params.json ? { response_format: { type: 'json_object' } } : {}),
    }),
  });
  const raw = await response.text();
  if (!response.ok) {
    throw new Error(`${params.stage} proxy call failed (${response.status}): ${raw.slice(0, 240)}`);
  }
  const payload = JSON.parse(raw) as Record<string, unknown>;
  const content = extractContent(payload);
  if (!content) throw new Error(`${params.stage} proxy call returned empty content.`);
  const provider = inferProvider(payload);
  return {
    stage: params.stage,
    content,
    latencyMs: Date.now() - startedAt,
    provider,
    model: typeof payload.model === 'string' ? payload.model : null,
    cost: estimateAiCallCost(payload, provider),
  };
}

function dreamInput(testCase: GoldenCase): string {
  return `Title: ${testCase.title}\n\nDream:\n${testCase.content}\n\nRelevant reading context:\n${testCase.reading_context?.trim() || '(none supplied for this isolated golden-set case)'}`;
}

function candidateInput(testCase: GoldenCase, candidates: Candidate[]): string {
  return `${dreamInput(testCase)}\n\nCandidates:\n${JSON.stringify(candidates)}`;
}

function reviewInput(testCase: GoldenCase, candidates: Candidate[], review: ReviewerResult): string {
  return `${candidateInput(testCase, candidates)}\n\nReviewer evaluations:\n${JSON.stringify(review.evaluations)}`;
}

function callSummary(call: ProxyCall | null): string {
  if (!call) return 'not called';
  return `${call.latencyMs} ms; ${call.cost.totalTokens} tokens; ${typeof call.cost.estimatedUsd === 'number' ? `$${call.cost.estimatedUsd.toFixed(6)}` : 'cost unavailable'}; ${call.provider ?? 'unknown'}/${call.model ?? 'unknown'}`;
}

function configurationSummary(trials: Trial[], configuration: 'A' | 'B' | 'C') {
  const measurements = trials.map((trial) => configuration === 'A'
    ? trial.baseline.measurement
    : configuration === 'B'
      ? trial.configurationB.measurement
      : trial.configurationC.measurement);
  const estimatedValues = measurements
    .map((value) => value.estimatedUsd)
    .filter((value): value is number => typeof value === 'number');
  return {
    trials: measurements.length,
    latency_p50_ms: percentile(measurements.map((value) => value.latencyMs), 50),
    latency_p95_ms: percentile(measurements.map((value) => value.latencyMs), 95),
    total_calls: measurements.reduce((sum, value) => sum + value.callCount, 0),
    total_input_tokens: measurements.reduce((sum, value) => sum + value.inputTokens, 0),
    total_cached_input_tokens: measurements.reduce((sum, value) => sum + value.cachedInputTokens, 0),
    total_output_tokens: measurements.reduce((sum, value) => sum + value.outputTokens, 0),
    total_tokens: measurements.reduce((sum, value) => sum + value.totalTokens, 0),
    total_estimated_usd: estimatedValues.length === measurements.length
      ? Number(estimatedValues.reduce((sum, value) => sum + value, 0).toFixed(8))
      : null,
  };
}

function markdownPacket(params: {
  generatedAt: string;
  goldenSet: GoldenSet;
  repeatCount: number;
  trials: Trial[];
}): string {
  const selectionCounts = Object.fromEntries(
    ['direct_relation', 'imaginal_continuation', 'capacity_or_change'].map((id) => [
      id,
      params.trials.filter((trial) => trial.configurationB.selectedId === id).length,
    ])
  );
  const noneSelected = params.trials.filter(
    (trial) => trial.reviewer.result && !trial.configurationB.selectedId
  ).length;
  const rewrites = params.trials.filter(
    (trial) => trial.configurationC.source === 'controlled_rewrite'
  ).length;
  const metrics = {
    A: configurationSummary(params.trials, 'A'),
    B: configurationSummary(params.trials, 'B'),
    C: configurationSummary(params.trials, 'C'),
  };
  return [
    '# Oneiros Reflective Questions — Reviewed Selection A/B/C Packet',
    '',
    `- Generated: ${params.generatedAt}`,
    `- Experiment: ${REVIEWED_SELECTION_EXPERIMENT_ID}`,
    `- Psychological-aliveness baseline: ${REFLECTIVE_QUESTION_METHOD_ID}`,
    `- Fixture: ${params.goldenSet.version}; ${params.goldenSet.cases.length} unchanged cases × ${params.repeatCount} repeats`,
    '- Production path changed: no',
    '',
    '## Configurations',
    '',
    '- **A:** current v1.5 single-pass baseline.',
    '- **B:** one full-model call creates three distinct candidates; one compact reviewer only scores/selects.',
    '- **C:** configuration B plus one full-model controlled rewrite only when no candidate clears every reviewer hard gate.',
    '',
    'The reviewer never receives golden labels or expected answers and is forbidden to rewrite. Configuration C shares B’s generator/reviewer result within each trial; its reported cost and latency model the same two calls plus rewrite when invoked.',
    '',
    '## Machine measurements',
    '',
    '```json',
    JSON.stringify({ metrics, selection_counts: selectionCounts, none_selected: noneSelected, controlled_rewrites: rewrites }, null, 2),
    '```',
    '',
    '## Human acceptance contract',
    '',
    'Score A, B, and C independently. `PASS` requires Irreplaceability = 2, Experiential Pull = 2, Human Pull = 2, epistemic honesty, and no unsupported premise. Release experiment criterion: every canonical case passes at least 2/3 repeats with no epistemic FAIL. High-value cases should ideally pass 3/3.',
    '',
    ...params.trials.flatMap((trial) => [
      `## ${trial.testCase.id} — repeat ${trial.repeat}/${params.repeatCount}`,
      '',
      `**Category:** ${trial.testCase.category}`,
      '',
      '**Dream**',
      '',
      trial.testCase.content,
      '',
      '**A — single-pass output**',
      '',
      trial.baseline.output,
      '',
      `Call: ${callSummary(trial.baseline.call)}`,
      '',
      '**Generated candidates**',
      '',
      ...(trial.generator.candidates.length > 0
        ? trial.generator.candidates.map(
            (candidate) => `- **${candidate.id}:** ${candidate.question}`
          )
        : [`- Technical parse failure: ${trial.generator.parseError ?? 'unknown'}`]),
      '',
      `Generator call: ${callSummary(trial.generator.call)}`,
      '',
      '**Reviewer result**',
      '',
      ...(trial.reviewer.result
        ? trial.reviewer.result.evaluations.map((evaluation) =>
            `- **${evaluation.id}:** I=${evaluation.irreplaceability}, E=${evaluation.experiential_pull}, H=${evaluation.human_pull}, epistemic=${evaluation.epistemic_honesty}, unsupported=${evaluation.unsupported_premise}, verdict=${evaluation.verdict} — ${evaluation.reason}`
          )
        : [`- ${trial.reviewer.parseError ?? 'Reviewer not called.'}`]),
      ...(trial.reviewer.result
        ? [`- Requested selection: **${trial.reviewer.result.requestedSelectedId ?? 'none'}**; validated selection: **${trial.reviewer.result.selectedId ?? 'none'}**; deterministic override: ${trial.reviewer.result.selectionWasOverridden}`]
        : []),
      '',
      `Reviewer call: ${callSummary(trial.reviewer.call)}`,
      '',
      '**B — reviewed selection output**',
      '',
      trial.configurationB.question ?? '(no candidate passed)',
      '',
      '**C — reviewed selection + controlled rewrite output**',
      '',
      trial.configurationC.question ?? '(technical failure; no output)',
      '',
      `C source: ${trial.configurationC.source}${trial.configurationC.sourceCandidateId ? ` from ${trial.configurationC.sourceCandidateId}` : ''}`,
      '',
      `Rewrite call: ${callSummary(trial.configurationC.rewriteCall)}`,
      '',
      '| Configuration | Irreplaceability | Experiential Pull | Human Pull | Epistemic | Unsupported premise | Decision | Notes |',
      '|---|---:|---:|---:|---|---|---|---|',
      '| A |  |  |  |  |  | PASS / REVISE / FAIL |  |',
      '| B |  |  |  |  |  | PASS / REVISE / FAIL |  |',
      '| C |  |  |  |  |  | PASS / REVISE / FAIL |  |',
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
  if (goldenSet.method_id !== REFLECTIVE_QUESTION_METHOD_ID) {
    throw new Error(`Golden set expects ${goldenSet.method_id}, runtime is ${REFLECTIVE_QUESTION_METHOD_ID}.`);
  }
  const repeatCount = getRepeatCount();
  const supabaseUrl = getEnv(['EXPO_PUBLIC_SUPABASE_URL', 'SUPABASE_URL']).replace(/\/$/, '');
  const anonKey = getEnv(['EXPO_PUBLIC_SUPABASE_ANON_KEY', 'SUPABASE_ANON_KEY']);
  const endpoint = getEnv(['EXPO_PUBLIC_CUSTOM_GPT_ENDPOINT', 'CUSTOM_GPT_ENDPOINT']);
  if (!supabaseUrl || !anonKey || !endpoint) {
    throw new Error('Missing Supabase URL, anon key, or custom GPT endpoint.');
  }
  const token = await getAccessToken(supabaseUrl, anonKey);
  const auth = { endpoint, anonKey, token };
  const trials: Trial[] = [];

  for (let repeat = 1; repeat <= repeatCount; repeat += 1) {
    for (const testCase of goldenSet.cases) {
      const language = testCase.language === 'el' ? 'Greek' : testCase.language;
      const input = dreamInput(testCase);
      const baselineCall = await callProxy({
        ...auth,
        stage: 'baseline',
        task: 'interpretation_standard',
        model: 'gpt-5.4',
        messages: [
          {
            role: 'system',
            content:
              'You are Dream Weaver, a calm post-Jungian dream journal companion. This is an isolated reflective-question evaluation. Do not provide an interpretation, advice, diagnosis, or explanation.',
          },
          { role: 'system', content: REFLECTIVE_QUESTION_METHOD_PROMPT },
          {
            role: 'system',
            content: `Output only a ## Reflective Questions section with 1–2 bullet questions, maximum 2. Default to one. One strong question is complete. Add a second only when it opens a distinct, genuinely valuable experiential possibility. A technically safe but generic question is not acceptable. Privately compare candidates before choosing. Reject scene redescription, an answer already given by the dream, abstract or two-lane shells, and any question that could survive after only its nouns were swapped. The question should be difficult to imagine after a different dream. Write the questions in ${language}.`,
          },
          { role: 'user', content: input },
        ],
        temperature: 0.45,
        tokenLimit: 500,
      });

      const generatorCall = await callProxy({
        ...auth,
        stage: 'generator',
        task: 'interpretation_standard',
        model: 'gpt-5.4',
        messages: [
          {
            role: 'system',
            content:
              'You are Dream Weaver in an offline quality experiment. Follow the psychological-aliveness method, but do not decide the final question.',
          },
          { role: 'system', content: REFLECTIVE_QUESTION_METHOD_PROMPT },
          { role: 'system', content: buildCandidateGeneratorPrompt(language) },
          { role: 'user', content: input },
        ],
        temperature: 0.55,
        tokenLimit: 700,
        json: true,
      });

      let candidates: Candidate[] = [];
      let generatorParseError: string | null = null;
      try {
        candidates = parseCandidates(generatorCall.content);
      } catch (error) {
        generatorParseError = error instanceof Error ? error.message : String(error);
      }

      let reviewerCall: ProxyCall | null = null;
      let reviewerResult: ReviewerResult | null = null;
      let reviewerParseError: string | null = null;
      if (candidates.length === 3) {
        reviewerCall = await callProxy({
          ...auth,
          stage: 'reviewer',
          task: 'chat_followup',
          model: 'gpt-5.4-mini',
          messages: [
            { role: 'system', content: CANDIDATE_REVIEWER_PROMPT },
            { role: 'user', content: candidateInput(testCase, candidates) },
          ],
          temperature: 0,
          tokenLimit: 900,
          json: true,
        });
        try {
          reviewerResult = parseReviewerResult(reviewerCall.content, candidates);
        } catch (error) {
          reviewerParseError = error instanceof Error ? error.message : String(error);
        }
      } else {
        reviewerParseError = 'Reviewer skipped because candidate generation was invalid.';
      }

      const selectedCandidate = reviewerResult?.selectedId
        ? candidates.find((candidate) => candidate.id === reviewerResult?.selectedId) ?? null
        : null;
      const sharedCalls = [measurement(generatorCall), ...(reviewerCall ? [measurement(reviewerCall)] : [])];

      let rewriteCall: ProxyCall | null = null;
      let rewriteQuestion: string | null = null;
      let rewriteSourceId: string | null = null;
      let rewriteParseError: string | null = null;
      if (reviewerResult && !selectedCandidate) {
        rewriteCall = await callProxy({
          ...auth,
          stage: 'rewrite',
          task: 'interpretation_retry_compact',
          model: 'gpt-5.4',
          messages: [
            {
              role: 'system',
              content:
                'You are a constrained Oneiros question editor in an offline experiment. Do not provide interpretation or commentary.',
            },
            { role: 'system', content: REFLECTIVE_QUESTION_METHOD_PROMPT },
            { role: 'system', content: buildControlledRewritePrompt(language) },
            { role: 'user', content: reviewInput(testCase, candidates, reviewerResult) },
          ],
          temperature: 0.35,
          tokenLimit: 300,
          json: true,
        });
        try {
          const rewrite = parseControlledRewrite(rewriteCall.content, candidates);
          rewriteQuestion = rewrite.question;
          rewriteSourceId = rewrite.sourceCandidateId;
        } catch (error) {
          rewriteParseError = error instanceof Error ? error.message : String(error);
        }
      }

      const configurationCQuestion = selectedCandidate?.question ?? rewriteQuestion;
      trials.push({
        testCase,
        repeat,
        baseline: {
          output: baselineCall.content,
          questions: extractQuestionLines(baselineCall.content),
          call: baselineCall,
          measurement: aggregateMeasurements([measurement(baselineCall)]),
        },
        generator: { candidates, parseError: generatorParseError, call: generatorCall },
        reviewer: { result: reviewerResult, parseError: reviewerParseError, call: reviewerCall },
        configurationB: {
          question: selectedCandidate?.question ?? null,
          selectedId: selectedCandidate?.id ?? null,
          measurement: aggregateMeasurements(sharedCalls),
        },
        configurationC: {
          question: configurationCQuestion,
          source: selectedCandidate
            ? 'selected'
            : rewriteQuestion
              ? 'controlled_rewrite'
              : 'technical_failure',
          sourceCandidateId: selectedCandidate?.id ?? rewriteSourceId,
          rewriteCall,
          rewriteParseError,
          measurement: aggregateMeasurements([
            ...sharedCalls,
            ...(rewriteCall ? [measurement(rewriteCall)] : []),
          ]),
        },
      });
      process.stdout.write(
        `Completed ${testCase.id} — repeat ${repeat}/${repeatCount}; selected=${selectedCandidate?.id ?? 'none'}; rewrite=${rewriteQuestion ? 'yes' : 'no'}\n`
      );
    }
  }

  const generatedAt = new Date().toISOString();
  const stamp = generatedAt.replace(/[:.]/g, '-');
  const outputDir = path.join(
    process.cwd(),
    'tmp',
    `reflective-question-reviewed-selection-${stamp}`
  );
  mkdirSync(outputDir, { recursive: true });
  const metrics = {
    A: configurationSummary(trials, 'A'),
    B: configurationSummary(trials, 'B'),
    C: configurationSummary(trials, 'C'),
    reviewer_selected_counts: Object.fromEntries(
      ['direct_relation', 'imaginal_continuation', 'capacity_or_change'].map((id) => [
        id,
        trials.filter((trial) => trial.configurationB.selectedId === id).length,
      ])
    ),
    reviewer_none_count: trials.filter(
      (trial) => trial.reviewer.result && !trial.configurationB.selectedId
    ).length,
    rewrite_count: trials.filter(
      (trial) => trial.configurationC.source === 'controlled_rewrite'
    ).length,
    technical_failure_count: trials.filter(
      (trial) => trial.configurationC.source === 'technical_failure'
    ).length,
  };
  writeFileSync(
    path.join(outputDir, 'results.json'),
    JSON.stringify(
      {
        generated_at: generatedAt,
        experiment_id: REVIEWED_SELECTION_EXPERIMENT_ID,
        experiment_version: REVIEWED_SELECTION_EXPERIMENT_VERSION,
        baseline_method_id: REFLECTIVE_QUESTION_METHOD_ID,
        baseline_method_version: REFLECTIVE_QUESTION_METHOD_VERSION,
        fixture_version: goldenSet.version,
        repeat_count: repeatCount,
        production_path_changed: false,
        golden_labels_exposed_to_models: false,
        metrics,
        trials,
      },
      null,
      2
    )
  );
  writeFileSync(
    path.join(outputDir, 'REVIEW_PACKET.md'),
    markdownPacket({ generatedAt, goldenSet, repeatCount, trials })
  );
  process.stdout.write(`${outputDir}\n`);
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
