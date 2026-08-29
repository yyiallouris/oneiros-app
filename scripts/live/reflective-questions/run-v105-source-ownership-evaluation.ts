/**
 * One final authorized frozen v1.0.5 Q2-only Reader evaluation.
 *
 * Standard/Advanced only. No retries, judge, repair, prompt edits, deployment,
 * or question-only calls. Any persisted run is terminal and cannot be repeated.
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
  buildV105SourceOwnershipInitialRequest,
  V105_SOURCE_OWNERSHIP_BUNDLE,
  V105_SOURCE_OWNERSHIP_BUNDLE_SHA256,
  V105_SOURCE_OWNERSHIP_METHOD_ID,
  type V105SourceOwnershipDepth,
} from '../../../src/ai/rd/reflective-questions/v105SourceOwnershipCandidate';
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
  'testing/reflective-questions/v1.0.5-source-ownership-evaluation-2026-08-29.json'
);
const FIXTURE_SHA256 =
  'dd74ae0c3ccf5263b5baba4ceb8960c76ed4ec6890eb459ad19feea88f911da1';
const PREDECESSOR_PATH = path.join(
  process.cwd(),
  'testing/reflective-questions/artifacts/v1.0.4-imaginal-handoff-evaluation-2026-08-29/REVIEWED_RESULTS.json'
);
const PREDECESSOR_SHA256 =
  'b2eaea9f804838419589b7f1ac2c463e6d6696609a09317c0c6866db5ddcca96';
const OUTPUT_DIR = path.join(
  process.cwd(),
  'testing/reflective-questions/artifacts/v1.0.5-source-ownership-evaluation-2026-08-29'
);
const RAW_OUTPUT_PATH = path.join(OUTPUT_DIR, 'RAW_EVALUATION.json');
const REVIEW_PACKET_PATH = path.join(OUTPUT_DIR, 'HUMAN_REVIEW_PACKET.md');
const APPROVAL_ENV = 'ONEIROS_V105_SOURCE_OWNERSHIP_COST_APPROVED';
const HARD_COST_CAP_USD = 1;
const RESERVED_CALL_COST_USD = 0.045;
const EXPECTED_CALLS = 22;
const REQUEST_TIMEOUT_MS = 60_000;

type Cohort = 'v104_failure_recovery' | 'protected_v104_pass_control' | 'sealed_unseen_holdout';
type PredecessorResult = {
  generation_id: string;
  case_id: string;
  language: string;
  mode: V105SourceOwnershipDepth;
  category: string | null;
  title: string;
  dream: string;
  before: null | {
    output: string;
    questions: string[];
    validation: Record<string, unknown>;
    normalization: Record<string, unknown>;
  };
  after: {
    output: string;
    questions: string[];
    validation: Record<string, unknown>;
    normalization: Record<string, unknown>;
  } | null;
  human_review: {
    q2_verdict: string;
    q1_regression_check: string;
    control_equivalence: string | null;
  };
};
type HoldoutCase = {
  id: string;
  language: string;
  mode: V105SourceOwnershipDepth;
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
  production_identity: {
    method_id: string;
    bundle_sha256: string;
    reader_prompt_id: string;
  };
  evaluated_predecessor: {
    method_id: string;
    bundle_sha256: string;
    reviewed_artifact: string;
    reviewed_artifact_sha256: string;
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
  v104_failure_recovery_anchors: string[];
  protected_v104_pass_controls: string[];
  protected_historical_baseline: {
    generation_id: string;
    source: string;
    requirements: string[];
  };
  sealed_unseen_holdout: HoldoutCase[];
};
type FrozenComparison = {
  version: 'v1.0.4';
  output: string;
  questions: string[];
  validation: Record<string, unknown>;
  normalization: Record<string, unknown>;
  human_q2_verdict: string;
};
type EvaluationEntry = {
  generationId: string;
  caseId: string;
  cohort: Cohort;
  language: string;
  mode: V105SourceOwnershipDepth;
  category: string | null;
  title: string;
  dream: string;
  before: FrozenComparison | null;
  protectedProductionBaseline: PredecessorResult['before'];
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
  request: ReturnType<typeof buildV105SourceOwnershipInitialRequest>;
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
    '# v1.0.5 source-ownership frozen human review packet',
    '',
    `Candidate: \`${params.candidateMethod}\` / \`${params.candidateSha}\``,
    `Fixture SHA-256: \`${params.fixtureSha}\``,
    `Exact recorded cost: \`$${params.cost.toFixed(8)}\``,
    '',
    'Review Q2, source ownership, pair complementarity, and Q1 regression separately. Validator output is shadow evidence only.',
    '',
    ...params.results.flatMap((result) => {
      const before = result.before as { output?: string } | null;
      const baseline = result.protected_production_baseline as { output?: string } | null;
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
        ...(baseline?.output
          ? ['### Protected production v1.0.3 baseline', '~~~text', baseline.output, '~~~', '']
          : []),
        ...(before?.output
          ? ['### Before v1.0.4', '~~~text', before.output, '~~~', '']
          : []),
        '### v1.0.5 candidate',
        '~~~text',
        after?.output ?? `[operational error: ${String(result.operational_error ?? 'unknown')}]`,
        '~~~',
        '',
        'Human Q2 verdict: PENDING',
        'Source-ownership verdict: PENDING',
        'Q1–Q2 complementarity: PENDING',
        'Human Q1 regression check: PENDING',
        'Control equivalence: PENDING',
        'Hospital v1.0.3 baseline equivalence: PENDING',
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
  const predecessorRaw = readFileSync(PREDECESSOR_PATH, 'utf8');
  const predecessor = JSON.parse(predecessorRaw) as {
    status: string;
    candidate_method: string;
    candidate_sha256: string;
    results: PredecessorResult[];
  };

  if (sha256(fixtureRaw) !== FIXTURE_SHA256) throw new Error('Frozen fixture hash drifted.');
  if (
    sha256(predecessorRaw) !== PREDECESSOR_SHA256 ||
    predecessor.status !== 'complete' ||
    predecessor.candidate_method !== fixture.evaluated_predecessor.method_id ||
    predecessor.candidate_sha256 !== fixture.evaluated_predecessor.bundle_sha256
  ) {
    throw new Error('Frozen v1.0.4 reviewed predecessor drifted.');
  }
  if (
    hashReflectiveQuestionPrompt(V105_SOURCE_OWNERSHIP_BUNDLE) !==
      V105_SOURCE_OWNERSHIP_BUNDLE_SHA256 ||
    fixture.candidate.method_id !== V105_SOURCE_OWNERSHIP_METHOD_ID ||
    fixture.candidate.bundle_sha256 !== V105_SOURCE_OWNERSHIP_BUNDLE_SHA256
  ) {
    throw new Error('Frozen v1.0.5 candidate identity drifted.');
  }
  if (
    String(SAME_CALL_REFLECTIVE_QUESTIONS_METHOD_ID) !==
      APPROVED_REFLECTIVE_QUESTION_PRODUCTION.methodId ||
    hashReflectiveQuestionPrompt(SAME_CALL_REFLECTIVE_QUESTIONS_BUNDLE) !==
      SAME_CALL_REFLECTIVE_QUESTIONS_BUNDLE_SHA256 ||
    SAME_CALL_REFLECTIVE_QUESTIONS_BUNDLE_SHA256 !==
      APPROVED_REFLECTIVE_QUESTION_PRODUCTION.promptSha256 ||
    fixture.production_identity.method_id !==
      APPROVED_REFLECTIVE_QUESTION_PRODUCTION.methodId ||
    fixture.production_identity.bundle_sha256 !==
      APPROVED_REFLECTIVE_QUESTION_PRODUCTION.promptSha256
  ) {
    throw new Error('Approved v1.0.3 production identity drifted.');
  }

  const priorEntries = [
    ...fixture.v104_failure_recovery_anchors.map((generationId) => ({
      generationId,
      cohort: 'v104_failure_recovery' as const,
      expectedV104Q2: 'FAIL',
    })),
    ...fixture.protected_v104_pass_controls.map((generationId) => ({
      generationId,
      cohort: 'protected_v104_pass_control' as const,
      expectedV104Q2: 'PASS',
    })),
  ].map(({ generationId, cohort, expectedV104Q2 }): EvaluationEntry => {
    const generation = predecessor.results.find(
      (item) => item.generation_id === generationId
    );
    if (!generation?.after) throw new Error(`Missing v1.0.4 case ${generationId}.`);
    if (generation.human_review.q2_verdict !== expectedV104Q2) {
      throw new Error(`Unexpected v1.0.4 human verdict for ${generationId}.`);
    }
    if (generation.mode !== 'standard' && generation.mode !== 'advanced') {
      throw new Error(`Out-of-scope predecessor surface ${generationId}.`);
    }
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
        version: 'v1.0.4',
        output: generation.after.output,
        questions: generation.after.questions,
        validation: generation.after.validation,
        normalization: generation.after.normalization,
        human_q2_verdict: generation.human_review.q2_verdict,
      },
      protectedProductionBaseline:
        generationId === fixture.protected_historical_baseline.generation_id
          ? generation.before
          : null,
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
    protectedProductionBaseline: null,
  }));
  const entries = [...priorEntries, ...holdoutEntries];
  if (
    entries.length !== EXPECTED_CALLS ||
    fixture.scope.planned_calls !== EXPECTED_CALLS ||
    new Set(entries.map((entry) => entry.generationId)).size !== EXPECTED_CALLS
  ) {
    throw new Error('Frozen packet must contain exactly 22 unique Reader cases.');
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
    candidate_method: V105_SOURCE_OWNERSHIP_METHOD_ID,
    candidate_sha256: V105_SOURCE_OWNERSHIP_BUNDLE_SHA256,
    production_method: APPROVED_REFLECTIVE_QUESTION_PRODUCTION.methodId,
    production_sha256: APPROVED_REFLECTIVE_QUESTION_PRODUCTION.promptSha256,
    predecessor_method: fixture.evaluated_predecessor.method_id,
    predecessor_sha256: fixture.evaluated_predecessor.bundle_sha256,
    calls: entries.length,
    recovery_anchors: fixture.v104_failure_recovery_anchors.length,
    protected_controls: fixture.protected_v104_pass_controls.length,
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
        protected_production_baseline: entry.protectedProductionBaseline,
        after: null,
        operational_error: 'budget_guard_stopped_before_call',
        human_q2_verdict: 'NOT_RUN',
        source_ownership_verdict: 'NOT_RUN',
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
    const request = buildV105SourceOwnershipInitialRequest(dream, entry.mode);
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
        protected_production_baseline: entry.protectedProductionBaseline,
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
        source_ownership_verdict: 'PENDING',
        pair_complementarity_verdict: 'PENDING',
        human_q1_regression_check: 'PENDING',
        control_equivalence:
          entry.cohort === 'protected_v104_pass_control' ? 'PENDING' : null,
        hospital_v103_baseline_equivalence:
          entry.protectedProductionBaseline ? 'PENDING' : null,
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
        protected_production_baseline: entry.protectedProductionBaseline,
        after: null,
        operational_error:
          error instanceof Error ? error.message : 'unknown_operational_error',
        estimated_usd: null,
        human_q2_verdict: 'NOT_RUN_OPERATIONAL_ERROR',
        source_ownership_verdict: 'NOT_RUN_OPERATIONAL_ERROR',
        pair_complementarity_verdict: 'NOT_RUN_OPERATIONAL_ERROR',
        human_q1_regression_check: 'NOT_RUN_OPERATIONAL_ERROR',
        control_equivalence: null,
        hospital_v103_baseline_equivalence: null,
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
    candidateMethod: V105_SOURCE_OWNERSHIP_METHOD_ID,
    candidateSha: V105_SOURCE_OWNERSHIP_BUNDLE_SHA256,
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
