/**
 * One authorized frozen v1.0.4 Q2-only Reader evaluation.
 *
 * Boundaries: Standard/Advanced only; no retries, judge, repair, prompt edit,
 * gateway deploy, or question-only call. A persisted partial run is terminal:
 * this runner refuses to rerun it.
 */
import { createHash, randomUUID } from 'crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { estimateAiCallCost, type AiCallCost } from '../../../src/billing/aiPricing';
import {
  END_MARKER_DREAM_READING,
  SAME_CALL_REFLECTIVE_QUESTIONS_BUNDLE,
  SAME_CALL_REFLECTIVE_QUESTIONS_METHOD_ID,
  type DreamReflectionInput,
} from '../../../src/ai/dreamReflectionPrompt';
import {
  buildV104ImaginalHandoffInitialRequest,
  V104_IMAGINAL_HANDOFF_BUNDLE,
  V104_IMAGINAL_HANDOFF_BUNDLE_SHA256,
  V104_IMAGINAL_HANDOFF_METHOD_ID,
  type V104ImaginalHandoffDepth,
} from '../../../src/ai/rd/reflective-questions/v104ImaginalHandoffCandidate';
import {
  extractSameCallReflectiveQuestions,
  normalizeCompletedReflectiveQuestionStructure,
} from '../../../src/ai/reflectiveQuestionExtract';
import { safeObserveReflectiveContract } from '../../../src/ai/reflectiveContractObservation';
import {
  APPROVED_REFLECTIVE_QUESTION_PRODUCTION,
  SAME_CALL_REFLECTIVE_QUESTIONS_BUNDLE_SHA256,
  hashReflectiveQuestionPrompt,
} from '../../../src/ai/reflectiveQuestionProductionHold';

const FIXTURE_PATH = path.join(
  process.cwd(),
  'testing/reflective-questions/v1.0.4-imaginal-handoff-evaluation-2026-08-29.json'
);
const FIXTURE_SHA256 =
  'ec7becc8f382399c1bab1d50edbce4c3568b468e17ab5edd124131987147a211';
const BASELINE_PATH = path.join(
  process.cwd(),
  'testing/reflective-questions/artifacts/v1.0.3-enacted-relation-evaluation-2026-08-29/RAW_EVALUATION.json'
);
const BASELINE_ARTIFACT_SHA256 =
  '1019bad7aabb8eb69515ad7d4dcf6d97bd4e7f0cb29942609048bbd2b51a94d3';
const OUTPUT_DIR = path.join(
  process.cwd(),
  'testing/reflective-questions/artifacts/v1.0.4-imaginal-handoff-evaluation-2026-08-29'
);
const RAW_OUTPUT_PATH = path.join(OUTPUT_DIR, 'RAW_EVALUATION.json');
const REVIEW_PACKET_PATH = path.join(OUTPUT_DIR, 'HUMAN_REVIEW_PACKET.md');
const APPROVAL_ENV = 'ONEIROS_V104_IMAGINAL_HANDOFF_COST_APPROVED';
const HARD_COST_CAP_USD = 1;
const RESERVED_CALL_COST_USD = 0.045;
const EXPECTED_CALLS = 21;
const REQUEST_TIMEOUT_MS = 60_000;

type Cohort = 'known_q2_failure' | 'strong_q2_control' | 'sealed_unseen_holdout';
type BaselineResult = {
  generation_id: string;
  case_id: string;
  language: string;
  mode: V104ImaginalHandoffDepth;
  category: string | null;
  title: string;
  dream: string;
  after: {
    output: string;
    questions: string[];
    validation: Record<string, unknown>;
  } | null;
};
type HoldoutCase = {
  id: string;
  language: string;
  mode: V104ImaginalHandoffDepth;
  category: string;
  title: string;
  dream: string;
};
type Fixture = {
  fixture_id: string;
  candidate: {
    method_id: string;
    bundle_sha256: string;
    reader_prompt_id: string;
  };
  production_predecessor: {
    method_id: string;
    bundle_sha256: string;
    reader_prompt_id: string;
    baseline_artifact: string;
    baseline_artifact_sha256: string;
  };
  scope: {
    planned_calls: number;
    hard_cost_cap_usd: number;
    reserved_cost_per_call_usd: number;
    conservative_reserved_packet_cost_usd: number;
  };
  acceptance_gate: Record<string, unknown>;
  human_q2_pass_criteria: string[];
  human_pair_pass_criteria: string[];
  structural_pass_criteria: string[];
  known_q2_failures: string[];
  strong_q2_controls: string[];
  sealed_unseen_holdout: HoldoutCase[];
};
type EvaluationEntry = {
  generationId: string;
  caseId: string;
  cohort: Cohort;
  language: string;
  mode: V104ImaginalHandoffDepth;
  category: string | null;
  title: string;
  dream: string;
  before: null | {
    output: string;
    questions: string[];
    validation: Record<string, unknown>;
    normalization: Record<string, unknown>;
  };
};
type ProxyResult = {
  content: string;
  provider: string | null;
  model: string | null;
  latencyMs: number;
  cost: AiCallCost;
};

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

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
  request: ReturnType<typeof buildV104ImaginalHandoffInitialRequest>;
}): Promise<ProxyResult> {
  const startedAt = Date.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  let response: Response;
  try {
    response = await fetch(params.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: params.anonKey,
        Authorization: `Bearer ${params.token}`,
        'X-Request-Id': randomUUID(),
      },
      body: JSON.stringify({
        model: 'gpt-5.4-mini',
        task: params.request.task,
        messages: params.request.messages,
        temperature: params.request.temperature,
        max_completion_tokens: params.request.tokenLimit,
        max_tokens: params.request.tokenLimit,
      }),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
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

function stripMarker(content: string): string {
  return content.replace(END_MARKER_DREAM_READING, '').trim();
}

function normalizedCompletedOutput(
  outputWithoutMarker: string,
  surface: V104ImaginalHandoffDepth
): {
  output: string;
  normalization: Record<string, unknown>;
} {
  const completed = `${outputWithoutMarker.trim()}\n\n${END_MARKER_DREAM_READING}`;
  const normalized = normalizeCompletedReflectiveQuestionStructure({
    content: completed,
    surface,
    requiredEndMarker: END_MARKER_DREAM_READING,
  });
  return {
    output: stripMarker(normalized.content),
    normalization: normalized.normalization,
  };
}

function countProseQuestions(content: string): number {
  const headingIndex = content.search(/^## Reflective Questions\s*$/mu);
  const prose = headingIndex >= 0 ? content.slice(0, headingIndex) : content;
  const explicit = prose.match(/[?？؟]/gu)?.length ?? 0;
  const greekSemicolons = prose
    .split(';')
    .slice(0, -1)
    .filter((segment) => /\p{Script=Greek}/u.test(segment.slice(-240))).length;
  return explicit + greekSemicolons;
}

function markdownReviewPacket(params: {
  candidateMethod: string;
  candidateSha: string;
  fixtureSha: string;
  cost: number;
  results: Array<Record<string, unknown>>;
}): string {
  return [
    '# v1.0.4 imaginal-handoff frozen human review packet',
    '',
    `Candidate: \`${params.candidateMethod}\` / \`${params.candidateSha}\``,
    `Fixture SHA-256: \`${params.fixtureSha}\``,
    `Exact recorded cost: \`$${params.cost.toFixed(8)}\``,
    '',
    'Review Q2 individual quality and Q1–Q2 complementarity separately. Validator output is shadow evidence only.',
    '',
    ...params.results.flatMap((result) => {
      const before = result.before as { output?: string } | null;
      const after = result.after as { output?: string } | null;
      return [
        `## ${String(result.generation_id)}`,
        '',
        `Cohort: ${String(result.cohort)}`,
        '',
        '### Dream',
        '~~~text',
        String(result.dream),
        '~~~',
        '',
        ...(before?.output ? ['### Before v1.0.3', '~~~text', before.output, '~~~', ''] : []),
        '### v1.0.4 candidate',
        '~~~text',
        after?.output ?? `[operational error: ${String(result.operational_error ?? 'unknown')}]`,
        '~~~',
        '',
        'Human Q2 verdict: PENDING',
        'Q1–Q2 complementarity: PENDING',
        'Human Q1 regression check: PENDING',
        'Control equivalence: PENDING',
        'Failure families: PENDING',
        'Human notes: PENDING',
        '',
      ];
    }),
  ].join('\n');
}

async function main(): Promise<void> {
  const fixtureRaw = readFileSync(FIXTURE_PATH, 'utf8');
  const fixture = JSON.parse(fixtureRaw) as Fixture;
  const baselineRaw = readFileSync(BASELINE_PATH, 'utf8');
  const baseline = JSON.parse(baselineRaw) as {
    status: string;
    results: BaselineResult[];
  };

  if (sha256(fixtureRaw) !== FIXTURE_SHA256) throw new Error('Frozen fixture hash drifted.');
  if (sha256(baselineRaw) !== BASELINE_ARTIFACT_SHA256 || baseline.status !== 'complete') {
    throw new Error('Frozen v1.0.3 baseline artifact drifted.');
  }
  if (
    hashReflectiveQuestionPrompt(V104_IMAGINAL_HANDOFF_BUNDLE) !==
      V104_IMAGINAL_HANDOFF_BUNDLE_SHA256 ||
    fixture.candidate.method_id !== V104_IMAGINAL_HANDOFF_METHOD_ID ||
    fixture.candidate.bundle_sha256 !== V104_IMAGINAL_HANDOFF_BUNDLE_SHA256
  ) {
    throw new Error('Frozen v1.0.4 candidate identity drifted.');
  }
  if (
    String(SAME_CALL_REFLECTIVE_QUESTIONS_METHOD_ID) !==
      APPROVED_REFLECTIVE_QUESTION_PRODUCTION.methodId ||
    hashReflectiveQuestionPrompt(SAME_CALL_REFLECTIVE_QUESTIONS_BUNDLE) !==
      SAME_CALL_REFLECTIVE_QUESTIONS_BUNDLE_SHA256 ||
    SAME_CALL_REFLECTIVE_QUESTIONS_BUNDLE_SHA256 !==
      APPROVED_REFLECTIVE_QUESTION_PRODUCTION.promptSha256 ||
    fixture.production_predecessor.method_id !==
      APPROVED_REFLECTIVE_QUESTION_PRODUCTION.methodId ||
    fixture.production_predecessor.bundle_sha256 !==
      APPROVED_REFLECTIVE_QUESTION_PRODUCTION.promptSha256
  ) {
    throw new Error('Approved v1.0.3 production identity drifted.');
  }

  const priorEntries = [
    ...fixture.known_q2_failures.map((generationId) => ({
      generationId,
      cohort: 'known_q2_failure' as const,
    })),
    ...fixture.strong_q2_controls.map((generationId) => ({
      generationId,
      cohort: 'strong_q2_control' as const,
    })),
  ].map(({ generationId, cohort }): EvaluationEntry => {
    const generation = baseline.results.find((item) => item.generation_id === generationId);
    if (!generation?.after) throw new Error(`Missing frozen v1.0.3 baseline case ${generationId}.`);
    if (generation.mode !== 'standard' && generation.mode !== 'advanced') {
      throw new Error(`Out-of-scope baseline surface ${generationId}.`);
    }
    const normalized = normalizedCompletedOutput(generation.after.output, generation.mode);
    return {
      generationId,
      caseId: generation.case_id,
      cohort,
      language: generation.language,
      mode: generation.mode,
      category: generation.category,
      title: generation.title,
      dream: generation.dream,
      before: {
        output: normalized.output,
        questions: extractSameCallReflectiveQuestions(normalized.output, generation.mode),
        validation: generation.after.validation,
        normalization: normalized.normalization,
      },
    };
  });
  const holdoutEntries = fixture.sealed_unseen_holdout.map((item): EvaluationEntry => ({
    generationId: `${item.id}:reading_${item.mode}`,
    caseId: item.id,
    cohort: 'sealed_unseen_holdout',
    language: item.language,
    mode: item.mode,
    category: item.category,
    title: item.title,
    dream: item.dream,
    before: null,
  }));
  const entries = [...priorEntries, ...holdoutEntries];
  if (
    entries.length !== EXPECTED_CALLS ||
    fixture.scope.planned_calls !== EXPECTED_CALLS ||
    new Set(entries.map((entry) => entry.generationId)).size !== EXPECTED_CALLS
  ) {
    throw new Error('Frozen packet must contain exactly 21 unique Reader cases.');
  }
  if (
    fixture.scope.hard_cost_cap_usd !== HARD_COST_CAP_USD ||
    fixture.scope.reserved_cost_per_call_usd !== RESERVED_CALL_COST_USD ||
    entries.length * RESERVED_CALL_COST_USD > HARD_COST_CAP_USD
  ) {
    throw new Error('Hard cost cap preflight failed.');
  }

  const preflight = {
    fixture_id: fixture.fixture_id,
    fixture_sha256: FIXTURE_SHA256,
    candidate_method: V104_IMAGINAL_HANDOFF_METHOD_ID,
    candidate_sha256: V104_IMAGINAL_HANDOFF_BUNDLE_SHA256,
    production_method: APPROVED_REFLECTIVE_QUESTION_PRODUCTION.methodId,
    production_sha256: APPROVED_REFLECTIVE_QUESTION_PRODUCTION.promptSha256,
    calls: entries.length,
    known_q2_failures: fixture.known_q2_failures.length,
    strong_q2_controls: fixture.strong_q2_controls.length,
    sealed_unseen_holdout: fixture.sealed_unseen_holdout.length,
    holdout_languages: fixture.sealed_unseen_holdout.map((item) => item.language),
    hard_cost_cap_usd: HARD_COST_CAP_USD,
    reserved_cost_per_call_usd: RESERVED_CALL_COST_USD,
    conservative_reserved_packet_cost_usd: Number(
      (entries.length * RESERVED_CALL_COST_USD).toFixed(8)
    ),
    model_retries_for_quality: 0,
    semantic_judge_calls: 0,
    question_only_calls: 0,
    deploys: 0,
  };
  if (process.argv.includes('--preflight')) {
    process.stdout.write(`${JSON.stringify(preflight, null, 2)}\n`);
    return;
  }
  if (process.env[APPROVAL_ENV] !== '1') {
    throw new Error(`Paid run locked. Set ${APPROVAL_ENV}=1 only after explicit approval.`);
  }
  if (existsSync(RAW_OUTPUT_PATH)) {
    throw new Error('Evaluation artifact already exists; frozen run cannot be repeated.');
  }

  const supabaseUrl = getEnv(['EXPO_PUBLIC_SUPABASE_URL', 'SUPABASE_URL']).replace(/\/$/u, '');
  const anonKey = getEnv(['EXPO_PUBLIC_SUPABASE_ANON_KEY', 'SUPABASE_ANON_KEY']);
  if (!supabaseUrl || !anonKey) throw new Error('Missing Supabase URL/anon key.');
  const token = await getAccessToken(supabaseUrl, anonKey);
  const endpoint = `${supabaseUrl}/functions/v1/openai-proxy`;
  const startedAt = new Date().toISOString();
  const results: Array<Record<string, unknown>> = [];
  let knownSpend = 0;
  let budgetStopped = false;
  mkdirSync(OUTPUT_DIR, { recursive: true });

  const persist = (status: 'in_progress' | 'complete'): void => {
    writeFileSync(RAW_OUTPUT_PATH, `${JSON.stringify({
      ...preflight,
      status,
      started_at: startedAt,
      completed_at: status === 'complete' ? new Date().toISOString() : null,
      exact_cost_usd: Number(knownSpend.toFixed(8)),
      budget_stopped: budgetStopped,
      results,
    }, null, 2)}\n`);
  };
  persist('in_progress');

  for (const entry of entries) {
    if (knownSpend + RESERVED_CALL_COST_USD > HARD_COST_CAP_USD) {
      budgetStopped = true;
      results.push({
        generation_id: entry.generationId,
        case_id: entry.caseId,
        cohort: entry.cohort,
        language: entry.language,
        mode: entry.mode,
        category: entry.category,
        title: entry.title,
        dream: entry.dream,
        before: entry.before,
        after: null,
        operational_error: 'budget_guard_stopped_before_call',
        human_q2_verdict: 'NOT_RUN',
        pair_complementarity_verdict: 'NOT_RUN',
        human_q1_regression_check: 'NOT_RUN',
        human_notes: 'No quality rerun permitted.',
      });
      persist('in_progress');
      continue;
    }

    const dream: DreamReflectionInput = {
      title: entry.title,
      date: '2026-08-29',
      content: entry.dream,
    };
    const request = buildV104ImaginalHandoffInitialRequest(dream, entry.mode);
    try {
      const call = await proxyCall({ endpoint, anonKey, token, request });
      const markerPresent = call.content.includes(END_MARKER_DREAM_READING);
      const rawModelOutput = stripMarker(call.content);
      const normalized = normalizeCompletedReflectiveQuestionStructure({
        content: call.content,
        surface: entry.mode,
        requiredEndMarker: END_MARKER_DREAM_READING,
      });
      const output = stripMarker(normalized.content);
      const questions = extractSameCallReflectiveQuestions(output, entry.mode);
      const validation = safeObserveReflectiveContract({
        content: output,
        contractSurface: entry.mode,
        telemetrySurface: entry.mode === 'standard'
          ? 'reading_standard'
          : 'reading_advanced',
        languageContext: request.reflectiveLanguageContext,
        isFinalChat: false,
      });
      const headingCount = output.match(/^## Reflective Questions\s*$/gmu)?.length ?? 0;
      const proseQuestionCount = countProseQuestions(output);
      knownSpend += call.cost.estimatedUsd ?? 0;
      results.push({
        generation_id: entry.generationId,
        case_id: entry.caseId,
        cohort: entry.cohort,
        language: entry.language,
        mode: entry.mode,
        category: entry.category,
        title: entry.title,
        dream: entry.dream,
        before: entry.before,
        after: {
          raw_model_output: rawModelOutput,
          output,
          questions,
          validation,
          normalization: normalized.normalization,
          structure: {
            end_marker_present: markerPresent,
            reflective_questions_heading_count: headingCount,
            extracted_question_count: questions.length,
            prose_question_count: proseQuestionCount,
            hard_failure:
              !markerPresent ||
              headingCount !== 1 ||
              questions.length !== 2 ||
              proseQuestionCount !== 0 ||
              validation.issues.some((issue) => issue.startsWith('wrong_output_language:')),
          },
        },
        provider: call.provider,
        model: call.model,
        latency_ms: call.latencyMs,
        estimated_usd: call.cost.estimatedUsd,
        human_q2_verdict: 'PENDING',
        pair_complementarity_verdict: 'PENDING',
        human_q1_regression_check: 'PENDING',
        control_equivalence: entry.cohort === 'strong_q2_control' ? 'PENDING' : null,
        failure_families: [],
        human_notes: 'PENDING',
      });
      process.stdout.write(
        `${results.length}/${entries.length} ${entry.generationId} ` +
        `${validation.passed ? 'validator_PASS' : 'validator_FAIL'} ` +
        `$${knownSpend.toFixed(8)}\n`
      );
    } catch (error) {
      results.push({
        generation_id: entry.generationId,
        case_id: entry.caseId,
        cohort: entry.cohort,
        language: entry.language,
        mode: entry.mode,
        category: entry.category,
        title: entry.title,
        dream: entry.dream,
        before: entry.before,
        after: null,
        operational_error: error instanceof Error ? error.message : 'unknown_operational_error',
        estimated_usd: null,
        human_q2_verdict: 'NOT_RUN_OPERATIONAL_ERROR',
        pair_complementarity_verdict: 'NOT_RUN_OPERATIONAL_ERROR',
        human_q1_regression_check: 'NOT_RUN_OPERATIONAL_ERROR',
        control_equivalence: null,
        failure_families: [],
        human_notes: 'No quality rerun permitted.',
      });
      process.stdout.write(
        `${results.length}/${entries.length} ${entry.generationId} operational_error\n`
      );
    }
    persist('in_progress');
    if (knownSpend > HARD_COST_CAP_USD) {
      budgetStopped = true;
      break;
    }
  }

  persist('complete');
  writeFileSync(REVIEW_PACKET_PATH, `${markdownReviewPacket({
    candidateMethod: V104_IMAGINAL_HANDOFF_METHOD_ID,
    candidateSha: V104_IMAGINAL_HANDOFF_BUNDLE_SHA256,
    fixtureSha: FIXTURE_SHA256,
    cost: knownSpend,
    results,
  })}\n`);
  process.stdout.write(
    `Artifacts: ${OUTPUT_DIR}\nCost: $${knownSpend.toFixed(8)} / ` +
    `$${HARD_COST_CAP_USD.toFixed(2)}\n`
  );
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
