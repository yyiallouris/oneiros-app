/**
 * One-shot Adaptive Reflective Openings feasibility evaluation.
 *
 * Ten frozen dreams receive Quick plus one Standard/Advanced Reader call. The
 * run permits no retries, semantic judge, repair, reranking, second candidate,
 * deployment, or production mutation. Persisted artifacts make the run final.
 */
import { createHash, randomUUID } from 'crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { estimateAiCallCost, type AiCallCost } from '../../../src/billing/aiPricing';
import {
  END_MARKER_DREAM_READING,
  SAME_CALL_REFLECTIVE_QUESTIONS_BUNDLE,
  SAME_CALL_REFLECTIVE_QUESTIONS_METHOD_ID,
  SAME_CALL_STANDARD_ADVANCED_QUESTIONS,
  type DreamReflectionDepth,
  type DreamReflectionInput,
} from '../../../src/ai/dreamReflectionPrompt';
import {
  ADAPTIVE_OPENINGS_BUNDLE,
  ADAPTIVE_OPENINGS_BUNDLE_SHA256,
  ADAPTIVE_OPENINGS_METHOD_ID,
  ADAPTIVE_OPENINGS_READER_PROMPT_ID,
  ADAPTIVE_STANDARD_ADVANCED_QUESTIONS,
  buildAdaptiveOpeningsInitialRequest,
  PRODUCTION_SYMBOLIC_RELATIONAL_IMAGINAL_Q2,
} from '../../../src/ai/rd/reflective-questions/adaptiveOpeningsCandidate';
import { V103_ENACTED_RELATION_Q1 } from '../../../src/ai/rd/reflective-questions/v103EnactedRelationCandidate';
import { observeAdaptiveOpenings } from '../../../src/ai/rd/reflective-questions/adaptiveOpeningsObservation';
import {
  APPROVED_REFLECTIVE_QUESTION_PRODUCTION,
  SAME_CALL_REFLECTIVE_QUESTIONS_BUNDLE_SHA256,
  hashReflectiveQuestionPrompt,
} from '../../../src/ai/reflectiveQuestionProductionHold';

const FIXTURE_PATH = path.join(
  process.cwd(),
  'testing/reflective-questions/adaptive-openings-feasibility-2026-08-29.json'
);
const FIXTURE_SHA256 =
  '4b361245bc58ab7856d0ad48421f2b6f8c25a5d5e11fadb5275b83c6f1312d71';
const OUTPUT_DIR = path.join(
  process.cwd(),
  'testing/reflective-questions/artifacts/adaptive-openings-feasibility-2026-08-29'
);
const RAW_OUTPUT_PATH = path.join(OUTPUT_DIR, 'RAW_EVALUATION.json');
const BLIND_REVIEW_PACKET_PATH = path.join(OUTPUT_DIR, 'BLIND_REVIEW_PACKET.md');
const APPROVAL_ENV = 'ONEIROS_ADAPTIVE_OPENINGS_COST_APPROVED';
const HARD_COST_CAP_USD = 1;
const RESERVED_CALL_COST_USD = 0.045;
const EXPECTED_DREAMS = 10;
const EXPECTED_CALLS = 20;
const REQUEST_TIMEOUT_MS = 60_000;

type OpeningProfile = 'enacted_only' | 'imaginal_only' | 'both';
type QuickOpening = 'enacted' | 'imaginal';
type FixtureCase = {
  id: string;
  language: string;
  mode: 'standard' | 'advanced';
  cohort: 'enacted_only' | 'imaginal_only' | 'both' | 'ambiguous';
  title: string;
  dream: string;
  expected_standard_deeper: {
    decision: OpeningProfile | 'allowed_set';
    allowed_set: OpeningProfile[];
    rationale: string;
  };
  quick_expected_strongest: {
    decision: QuickOpening | 'allowed_set';
    allowed_set: QuickOpening[];
    rationale: string;
  };
};
type Fixture = {
  fixture_id: string;
  candidate: { method_id: string; bundle_sha256: string; reader_prompt_id: string };
  production_identity: { method_id: string; bundle_sha256: string };
  scope: {
    dreams: number;
    quick_calls: number;
    standard_calls: number;
    advanced_calls: number;
    planned_calls: number;
    hard_cost_cap_usd: number;
    reserved_cost_per_call_usd: number;
    conservative_reserved_packet_cost_usd: number;
  };
  cohort_requirements: Record<FixtureCase['cohort'], number>;
  acceptance_gate: Record<string, unknown>;
  blind_review_protocol: { required: boolean; targets_excluded_from_generated_review_packet: boolean };
  cases: FixtureCase[];
};
type EvaluationEntry = {
  generationId: string;
  caseId: string;
  language: string;
  surface: DreamReflectionDepth;
  title: string;
  dream: string;
};
export type AdaptiveOpeningsProxyResult = {
  content: string;
  provider: string | null;
  model: string | null;
  latencyMs: number;
  cost: AiCallCost;
};

export function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function loadDotenvValue(key: string): string | undefined {
  if (!existsSync('.env')) return undefined;
  return readFileSync('.env', 'utf8')
    .match(new RegExp(`^${key}\\s*=\\s*(.*)$`, 'm'))?.[1]
    ?.trim().replace(/^['"]|['"]$/gu, '');
}

export function getEnv(keys: string[]): string {
  for (const key of keys) {
    const value = process.env[key] ?? loadDotenvValue(key);
    if (value?.trim()) return value.trim();
  }
  return '';
}

export async function getAccessToken(url: string, anonKey: string): Promise<string> {
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

export async function proxyCall(params: {
  endpoint: string;
  anonKey: string;
  token: string;
  request: ReturnType<typeof buildAdaptiveOpeningsInitialRequest>;
}): Promise<AdaptiveOpeningsProxyResult> {
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

export function stripMarker(content: string): string {
  return content.replace(END_MARKER_DREAM_READING, '').trim();
}

export function requestFingerprint(
  request: ReturnType<typeof buildAdaptiveOpeningsInitialRequest>
): string {
  return sha256(JSON.stringify({
    task: request.task,
    messages: request.messages,
    temperature: request.temperature,
    tokenLimit: request.tokenLimit,
  }));
}

function markdownBlindReviewPacket(params: {
  candidateSha: string;
  fixtureSha: string;
  cost: number;
  results: Array<Record<string, unknown>>;
}): string {
  return [
    '# Adaptive Reflective Openings — blind-first review packet',
    '',
    `Candidate: \`${ADAPTIVE_OPENINGS_METHOD_ID}\` / \`${params.candidateSha}\``,
    `Fixture SHA-256: \`${params.fixtureSha}\``,
    `Exact recorded cost: \`$${params.cost.toFixed(8)}\``,
    '',
    'Do not open the pre-registered target profiles until every verdict in this packet has been recorded.',
    'No semantic classifier has labeled the opening type. That judgment is human-owned.',
    '',
    ...params.results.flatMap((result) => {
      const after = result.after as { output?: string } | null;
      const surface = String(result.surface);
      const isQuick = surface === 'quick';
      return [
        `## ${String(result.generation_id)}`,
        '',
        `Language: ${String(result.language)} | Surface: ${surface}`,
        '',
        '### Dream',
        '~~~text',
        String(result.dream),
        '~~~',
        '',
        '### Candidate output',
        '~~~text',
        after?.output ?? `[operational error: ${String(result.operational_error ?? 'unknown')}]`,
        '~~~',
        '',
        ...(isQuick
          ? [
            'Actual opening type: PENDING (enacted | imaginal | unclear)',
            'Strongest-single-opening verdict: PENDING (PASS | FAIL)',
            'Vitality verdict: PENDING (PASS | SERIOUS_FAIL)',
          ]
          : [
            'Actual selection: PENDING (enacted_only | imaginal_only | both | unclear)',
            'Cardinality/type product verdict: PENDING (PASS | FAIL)',
            'Enacted quality: PENDING (PASS | FAIL | NOT_PRESENT)',
            'Imaginal quality: PENDING (PASS | FAIL | NOT_PRESENT)',
            'Complementarity: PENDING (PASS | FAIL | NOT_APPLICABLE)',
            'Restraint: PENDING (PASS | FAIL)',
            'Vitality verdict: PENDING (PASS | SERIOUS_FAIL)',
          ]),
        'Invented-fact failure: PENDING (NO | SERIOUS_FAIL)',
        'Failure families: PENDING',
        'Human notes: PENDING',
        '',
      ];
    }),
  ].join('\n');
}

function buildEntries(cases: FixtureCase[]): EvaluationEntry[] {
  return cases.flatMap((item) => [
    {
      generationId: `${item.id}:reading_quick`,
      caseId: item.id,
      language: item.language,
      surface: 'quick' as const,
      title: item.title,
      dream: item.dream,
    },
    {
      generationId: `${item.id}:reading_${item.mode}`,
      caseId: item.id,
      language: item.language,
      surface: item.mode,
      title: item.title,
      dream: item.dream,
    },
  ]);
}

async function main(): Promise<void> {
  const fixtureRaw = readFileSync(FIXTURE_PATH, 'utf8');
  const fixture = JSON.parse(fixtureRaw) as Fixture;
  if (sha256(fixtureRaw) !== FIXTURE_SHA256) throw new Error('Frozen fixture hash drifted.');
  if (
    hashReflectiveQuestionPrompt(ADAPTIVE_OPENINGS_BUNDLE) !==
      ADAPTIVE_OPENINGS_BUNDLE_SHA256 ||
    fixture.candidate.method_id !== ADAPTIVE_OPENINGS_METHOD_ID ||
    fixture.candidate.bundle_sha256 !== ADAPTIVE_OPENINGS_BUNDLE_SHA256 ||
    fixture.candidate.reader_prompt_id !== ADAPTIVE_OPENINGS_READER_PROMPT_ID
  ) {
    throw new Error('Frozen adaptive-opening candidate identity drifted.');
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
      APPROVED_REFLECTIVE_QUESTION_PRODUCTION.promptSha256 ||
    !SAME_CALL_STANDARD_ADVANCED_QUESTIONS.includes(V103_ENACTED_RELATION_Q1) ||
    !SAME_CALL_STANDARD_ADVANCED_QUESTIONS.includes(
      PRODUCTION_SYMBOLIC_RELATIONAL_IMAGINAL_Q2
    ) ||
    !ADAPTIVE_STANDARD_ADVANCED_QUESTIONS.includes(V103_ENACTED_RELATION_Q1) ||
    !ADAPTIVE_STANDARD_ADVANCED_QUESTIONS.includes(
      PRODUCTION_SYMBOLIC_RELATIONAL_IMAGINAL_Q2
    )
  ) {
    throw new Error('Approved v1.0.3 production identity or Q1/Q2 bytes drifted.');
  }
  if (/imaginal handoff|source ownership|v1\.0\.[45]/iu.test(ADAPTIVE_OPENINGS_BUNDLE)) {
    throw new Error('Denied Q2 R&D wording leaked into the adaptive candidate.');
  }

  const entries = buildEntries(fixture.cases);
  const cohortCounts = fixture.cases.reduce<Record<string, number>>((counts, item) => {
    counts[item.cohort] = (counts[item.cohort] ?? 0) + 1;
    return counts;
  }, {});
  const standardCalls = fixture.cases.filter((item) => item.mode === 'standard').length;
  const advancedCalls = fixture.cases.filter((item) => item.mode === 'advanced').length;
  if (
    fixture.cases.length !== EXPECTED_DREAMS ||
    entries.length !== EXPECTED_CALLS ||
    new Set(fixture.cases.map((item) => item.id)).size !== EXPECTED_DREAMS ||
    fixture.scope.planned_calls !== EXPECTED_CALLS ||
    fixture.scope.quick_calls !== EXPECTED_DREAMS ||
    standardCalls !== 5 ||
    advancedCalls !== 5 ||
    fixture.scope.standard_calls !== standardCalls ||
    fixture.scope.advanced_calls !== advancedCalls ||
    Object.entries(fixture.cohort_requirements).some(
      ([cohort, expected]) => cohortCounts[cohort] !== expected
    ) ||
    !fixture.blind_review_protocol.required ||
    !fixture.blind_review_protocol.targets_excluded_from_generated_review_packet
  ) {
    throw new Error('Frozen 10-dream packet design drifted.');
  }
  if (
    fixture.scope.hard_cost_cap_usd !== HARD_COST_CAP_USD ||
    fixture.scope.reserved_cost_per_call_usd !== RESERVED_CALL_COST_USD ||
    entries.length * RESERVED_CALL_COST_USD > HARD_COST_CAP_USD
  ) {
    throw new Error('Hard cost cap preflight failed.');
  }
  for (const item of fixture.cases) {
    if (
      item.expected_standard_deeper.allowed_set.length === 0 ||
      item.quick_expected_strongest.allowed_set.length === 0
    ) {
      throw new Error(`Missing pre-registered target for ${item.id}.`);
    }
  }

  const preflight = {
    fixture_id: fixture.fixture_id,
    fixture_sha256: FIXTURE_SHA256,
    candidate_method: ADAPTIVE_OPENINGS_METHOD_ID,
    candidate_sha256: ADAPTIVE_OPENINGS_BUNDLE_SHA256,
    production_method: APPROVED_REFLECTIVE_QUESTION_PRODUCTION.methodId,
    production_sha256: APPROVED_REFLECTIVE_QUESTION_PRODUCTION.promptSha256,
    dreams: fixture.cases.length,
    calls: entries.length,
    surfaces: { quick: EXPECTED_DREAMS, standard: standardCalls, advanced: advancedCalls },
    cohorts: cohortCounts,
    hard_cost_cap_usd: HARD_COST_CAP_USD,
    reserved_cost_per_call_usd: RESERVED_CALL_COST_USD,
    conservative_reserved_packet_cost_usd: Number(
      (entries.length * RESERVED_CALL_COST_USD).toFixed(8)
    ),
    model_retries_for_quality: 0,
    semantic_judge_calls: 0,
    question_only_calls: 0,
    repairs_or_reranking: 0,
    deploys: 0,
    blind_first_review: true,
  };
  if (process.argv.includes('--preflight')) {
    process.stdout.write(`${JSON.stringify(preflight, null, 2)}\n`);
    return;
  }
  if (process.env[APPROVAL_ENV] !== '1') {
    throw new Error(`Paid run locked. Set ${APPROVAL_ENV}=1 only after explicit approval.`);
  }
  if (existsSync(RAW_OUTPUT_PATH)) {
    throw new Error('Evaluation artifact already exists; the frozen run cannot be repeated.');
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
        language: entry.language,
        surface: entry.surface,
        title: entry.title,
        dream: entry.dream,
        after: null,
        operational_error: 'budget_guard_stopped_before_call',
        human_review: 'NOT_RUN',
      });
      persist('in_progress');
      continue;
    }

    const dream: DreamReflectionInput = {
      title: entry.title,
      date: '2026-08-29',
      content: entry.dream,
    };
    const request = buildAdaptiveOpeningsInitialRequest(dream, entry.surface);
    try {
      const call = await proxyCall({ endpoint, anonKey, token, request });
      const observation = observeAdaptiveOpenings({
        content: call.content,
        surface: entry.surface,
        languageContext: request.reflectiveLanguageContext,
      });
      knownSpend += call.cost.estimatedUsd ?? 0;
      results.push({
        generation_id: entry.generationId,
        case_id: entry.caseId,
        language: entry.language,
        surface: entry.surface,
        title: entry.title,
        dream: entry.dream,
        request_fingerprint_sha256: requestFingerprint(request),
        after: {
          raw_model_output: call.content,
          output: stripMarker(call.content),
          questions: observation.questions,
          adaptive_observation: observation,
        },
        provider: call.provider,
        model: call.model,
        latency_ms: call.latencyMs,
        estimated_usd: call.cost.estimatedUsd,
        human_review: 'PENDING_BLIND_REVIEW',
      });
      process.stdout.write(
        `${results.length}/${entries.length} ${entry.generationId} ` +
        `${observation.passed ? 'adaptive_structure_PASS' : 'adaptive_structure_FAIL'} ` +
        `$${knownSpend.toFixed(8)}\n`
      );
    } catch (error) {
      results.push({
        generation_id: entry.generationId,
        case_id: entry.caseId,
        language: entry.language,
        surface: entry.surface,
        title: entry.title,
        dream: entry.dream,
        after: null,
        operational_error:
          error instanceof Error ? error.message : 'unknown_operational_error',
        estimated_usd: null,
        human_review: 'NOT_RUN_OPERATIONAL_ERROR_NO_RETRY',
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
  writeFileSync(BLIND_REVIEW_PACKET_PATH, `${markdownBlindReviewPacket({
    candidateSha: ADAPTIVE_OPENINGS_BUNDLE_SHA256,
    fixtureSha: FIXTURE_SHA256,
    cost: knownSpend,
    results,
  })}\n`);
  process.stdout.write(
    `Artifacts: ${OUTPUT_DIR}\nCost: $${knownSpend.toFixed(8)} / ` +
    `$${HARD_COST_CAP_USD.toFixed(2)}\n`
  );
}

if (require.main === module) {
  main().catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  });
}
