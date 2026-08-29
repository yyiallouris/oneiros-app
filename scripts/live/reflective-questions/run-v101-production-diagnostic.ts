/**
 * Frozen v1.0.1 production diagnostic.
 *
 * Calls the deployed ai-entitlements-gateway exactly once per frozen generation:
 * 30 initial readings plus 12 open and 12 final Exploring replies. Contract
 * validation remains shadow-only. Idempotent replays are used only to read the
 * committed quota result_context; they never start another model generation.
 */
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from 'fs';
import { createHash } from 'crypto';
import path from 'path';
import {
  SAME_CALL_REFLECTIVE_QUESTIONS_BUNDLE,
  SAME_CALL_REFLECTIVE_QUESTIONS_METHOD_ID,
} from '../../../src/ai/dreamReflectionPrompt';
import {
  APPROVED_REFLECTIVE_QUESTION_PRODUCTION,
  SAME_CALL_REFLECTIVE_QUESTIONS_BUNDLE_SHA256,
  hashReflectiveQuestionPrompt,
} from '../../../src/ai/reflectiveQuestionProductionHold';
import { extractSameCallReflectiveQuestions } from '../../../src/ai/reflectiveQuestionExtract';
import {
  REFLECTIVE_CONTRACT_VALIDATION_VERSION,
  type ReflectiveContractObservation,
} from '../../../src/ai/reflectiveContractObservation';
import { detectOneirosLanguageCode } from '../../../src/ai/reflectiveLanguage';
import { ONEIROS_LANGUAGE_CODES, type OneirosLanguageCode } from '../../../src/constants/oneirosLanguages';

const FIXTURE_PATH = path.join(
  process.cwd(),
  'testing',
  'reflective-questions',
  'v1.0.1-production-diagnostic-30.json'
);
const EXPECTED_FIXTURE_SHA256 =
  '5e821d2578e5e0f7e688b20b16755b56cabe73590d361429dbff9a0c2af7bbcc' as const;
const EXPECTED_METHOD_ID = 'oneiros-same-call-reflective-questions-v1.0.1' as const;
const EXPECTED_BUNDLE_SHA256 =
  'e7e4ea4b8bfbb253912771f163f692980bbc677f051c72df4b49e5034f6fe8c7' as const;
const APPROVAL_ENV = 'ONEIROS_V101_PRODUCTION_DIAGNOSTIC_COST_APPROVED' as const;
const COST_CAP_USD = 3 as const;
const CONCURRENCY = 3 as const;
const TRANSPORT_RETRY_LIMIT = 1 as const;
const STATUS_POLL_INTERVAL_MS = 1000 as const;
const GENERATION_TIMEOUT_MS = 150000 as const;
const CLIENT_PARTIAL_REVEAL_MS = 15000 as const;

type Depth = 'quick' | 'standard' | 'advanced';
type LanguageGroup = 'english' | 'greek' | 'other';
type Trajectory = {
  open_user_turn: string;
  closing_user_turn: string;
};
type DiagnosticCase = {
  id: string;
  language: OneirosLanguageCode;
  language_group: LanguageGroup;
  mode: Depth;
  category: string;
  title: string;
  dream: string;
  trajectory: Trajectory | null;
};
type DiagnosticFixture = {
  schema_version: number;
  fixture_id: string;
  source: 'synthetic';
  dream_date: string;
  production_identity: {
    method_id: string;
    bundle_sha256: string;
    reader_prompt_id: string;
    chat_prompt_id: string;
    shadow_validation_version: string;
  };
  trajectory_contract: {
    selected_case_count: number;
    steps: string[];
    synthetic_interpretation_chat_replies_limit: number;
    note: string;
  };
  cases: DiagnosticCase[];
};

type AiCost = {
  provider?: string | null;
  model?: string | null;
  pricingModel?: string | null;
  pricingSource?: string | null;
  inputTokens?: number | null;
  outputTokens?: number | null;
  totalTokens?: number | null;
  estimatedUsd?: number | null;
  [key: string]: unknown;
};

type GenerationSurface =
  | 'reading_quick'
  | 'reading_standard'
  | 'reading_advanced'
  | 'chat_followup'
  | 'chat_followup_close';

type DiagnosticGeneration = {
  generation_id: string;
  case_id: string;
  fixture_index: number;
  title: string;
  dream: string;
  mode: Depth;
  language: OneirosLanguageCode;
  language_group: LanguageGroup;
  category: string;
  surface: GenerationSurface;
  surface_group: 'reader' | 'exploring_open' | 'closing';
  user_turn: string | null;
  output: string;
  extracted_reflective_questions: string[];
  question_count: number | null;
  expected_question_count: number | null;
  contract_validation: (ReflectiveContractObservation & { observed_at?: string }) | null;
  issue_codes: string[];
  detected_language: string | null;
  expected_language: string | null;
  answer_menu_detected: boolean | null;
  model: string | null;
  provider: string | null;
  latency: {
    completion_ms: number | null;
    first_partial_ms: number | null;
    first_user_visible_eligible_ms: number | null;
    partial_update_count: number;
    completed_before_15s: boolean | null;
  };
  ai_cost: AiCost | null;
  estimated_cost_usd: number | null;
  provider_api_error: string | null;
  transport_retry_count: number;
  transport_retry_occurred: boolean;
  contract_retry_count: 0;
  question_only_call_count: 0;
  quota_event_id: string | null;
  interpretation_id: string | null;
  generated_at: string;
};

type RunState = {
  run_id: string;
  started_at: string;
  finished_at: string | null;
  fixture_path: string;
  fixture_sha256: string;
  production_identity: DiagnosticFixture['production_identity'];
  expected_generation_count: number;
  concurrency: number;
  transport_retry_limit: number;
  cost_cap_usd: number;
  gateway_health: { status: number; latency_ms: number } | null;
  generations: DiagnosticGeneration[];
  cleanup: {
    attempted: boolean;
    interpretation_failures: string[];
    dream_failures: string[];
  };
  fatal_error: string | null;
};

type HttpResult<T> = {
  data: T;
  status: number;
  latencyMs: number;
  retries: number;
};

class HttpRequestError extends Error {
  status: number | null;
  constructor(message: string, status: number | null = null) {
    super(message);
    this.name = 'HttpRequestError';
    this.status = status;
  }
}

class CostCapError extends Error {
  constructor(knownSpend: number) {
    super(`Hard cost cap exceeded: ${knownSpend}.`);
    this.name = 'CostCapError';
  }
}

function cleanError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  return message.replace(/[\r\n]+/gu, ' ').slice(0, 300);
}

function loadDotenvValue(key: string): string | undefined {
  const envPath = path.join(process.cwd(), '.env');
  if (!existsSync(envPath)) return undefined;
  return readFileSync(envPath, 'utf8')
    .match(new RegExp(`^${key}\\s*=\\s*(.*)$`, 'm'))?.[1]
    ?.trim()
    .replace(/^['"]|['"]$/gu, '');
}

function getEnv(keys: string[]): string {
  for (const key of keys) {
    const value = process.env[key] ?? loadDotenvValue(key);
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
}

function fixtureSha256(raw: Buffer): string {
  return createHash('sha256').update(raw).digest('hex');
}

function loadFixture(): { fixture: DiagnosticFixture; raw: Buffer; sha256: string } {
  const raw = readFileSync(FIXTURE_PATH);
  return {
    fixture: JSON.parse(raw.toString('utf8')) as DiagnosticFixture,
    raw,
    sha256: fixtureSha256(raw),
  };
}

function countBy<T>(values: T[], key: (value: T) => string): Record<string, number> {
  return values.reduce<Record<string, number>>((counts, value) => {
    const id = key(value);
    counts[id] = (counts[id] ?? 0) + 1;
    return counts;
  }, {});
}

function assertExactCounts(
  actual: Record<string, number>,
  expected: Record<string, number>,
  label: string
): void {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`${label} mismatch: ${JSON.stringify(actual)}`);
  }
}

function assertPreflight(fixture: DiagnosticFixture, sha256: string): void {
  if (sha256 !== EXPECTED_FIXTURE_SHA256) {
    throw new Error(`Fixture SHA mismatch. Expected ${EXPECTED_FIXTURE_SHA256}, got ${sha256}.`);
  }
  if (
    APPROVED_REFLECTIVE_QUESTION_PRODUCTION.methodId !== EXPECTED_METHOD_ID ||
    APPROVED_REFLECTIVE_QUESTION_PRODUCTION.promptSha256 !== EXPECTED_BUNDLE_SHA256
  ) {
    throw new Error('Code-owned production approval identity drifted. Refusing paid run.');
  }
  if (
    String(SAME_CALL_REFLECTIVE_QUESTIONS_METHOD_ID) !== EXPECTED_METHOD_ID ||
    String(SAME_CALL_REFLECTIVE_QUESTIONS_BUNDLE_SHA256) !== EXPECTED_BUNDLE_SHA256 ||
    hashReflectiveQuestionPrompt(SAME_CALL_REFLECTIVE_QUESTIONS_BUNDLE) !== EXPECTED_BUNDLE_SHA256
  ) {
    throw new Error('Local same-call production bundle drifted. Refusing paid run.');
  }
  if (
    fixture.production_identity.method_id !== EXPECTED_METHOD_ID ||
    fixture.production_identity.bundle_sha256 !== EXPECTED_BUNDLE_SHA256 ||
    fixture.production_identity.shadow_validation_version !== REFLECTIVE_CONTRACT_VALIDATION_VERSION
  ) {
    throw new Error('Fixture production identity does not match the approved runtime.');
  }
  if (fixture.source !== 'synthetic' || fixture.cases.length !== 30) {
    throw new Error('Fixture must contain exactly 30 synthetic cases.');
  }
  if (!/^\d{4}-\d{2}-\d{2}$/u.test(fixture.dream_date)) {
    throw new Error('Fixture dream_date must be frozen as YYYY-MM-DD.');
  }
  if (new Set(fixture.cases.map((entry) => entry.id)).size !== fixture.cases.length) {
    throw new Error('Fixture case ids must be unique.');
  }
  assertExactCounts(countBy(fixture.cases, (entry) => entry.mode), {
    quick: 10,
    standard: 10,
    advanced: 10,
  }, 'Mode balance');
  assertExactCounts(countBy(fixture.cases, (entry) => entry.language_group), {
    english: 10,
    greek: 10,
    other: 10,
  }, 'Language-group balance');
  const languageCounts = countBy(fixture.cases, (entry) => entry.language);
  if (languageCounts.en !== 10 || languageCounts.el !== 10) {
    throw new Error(`English/Greek counts drifted: ${JSON.stringify(languageCounts)}`);
  }
  for (const code of ONEIROS_LANGUAGE_CODES.filter((code) => code !== 'en' && code !== 'el')) {
    if (languageCounts[code] !== 1) throw new Error(`Expected exactly one ${code} fixture.`);
  }
  const trajectories = fixture.cases.filter((entry) => entry.trajectory);
  if (
    trajectories.length !== 12 ||
    fixture.trajectory_contract.selected_case_count !== 12 ||
    fixture.trajectory_contract.synthetic_interpretation_chat_replies_limit !== 2
  ) {
    throw new Error('Trajectory contract must be exactly 12 cases with synthetic limit 2.');
  }
  assertExactCounts(countBy(trajectories, (entry) => entry.mode), {
    quick: 4,
    standard: 4,
    advanced: 4,
  }, 'Trajectory mode balance');
  assertExactCounts(countBy(trajectories, (entry) => entry.language_group), {
    english: 4,
    greek: 4,
    other: 4,
  }, 'Trajectory language-group balance');

  const requiredCategorySignals = [
    'simple_restorative',
    'relational',
    'grief_ancestor',
    'body_transformation',
    'ambiguous',
    'threshold_movement',
    'conflict_polarity',
    'sparse',
    'surreal_high_imagery',
    'long_complex',
  ];
  for (const signal of requiredCategorySignals) {
    if (!fixture.cases.some((entry) => entry.category.includes(signal))) {
      throw new Error(`Fixture category coverage missing ${signal}.`);
    }
  }

  for (const entry of fixture.cases) {
    if (detectOneirosLanguageCode(entry.dream) !== entry.language) {
      throw new Error(`Dream language detector mismatch for ${entry.id}.`);
    }
    if (entry.trajectory) {
      if (detectOneirosLanguageCode(entry.trajectory.open_user_turn) !== entry.language) {
        throw new Error(`Open-turn language detector mismatch for ${entry.id}.`);
      }
      if (detectOneirosLanguageCode(entry.trajectory.closing_user_turn) !== entry.language) {
        throw new Error(`Closing-turn language detector mismatch for ${entry.id}.`);
      }
    }
  }
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

function responseErrorCode(data: unknown): string | null {
  if (!data || typeof data !== 'object') return null;
  const raw = data as Record<string, unknown>;
  for (const key of ['reason', 'code', 'error', 'message']) {
    if (typeof raw[key] === 'string' && raw[key]) return raw[key].slice(0, 160);
  }
  return null;
}

async function fetchJson<T>(params: {
  url: string;
  label: string;
  init?: RequestInit;
  timeoutMs?: number;
  acceptEmpty?: boolean;
}): Promise<HttpResult<T>> {
  let lastError: unknown = null;
  const requestStartedAt = Date.now();
  for (let attempt = 0; attempt <= TRANSPORT_RETRY_LIMIT; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      params.timeoutMs ?? 30000
    );
    try {
      const response = await fetch(params.url, {
        ...params.init,
        signal: controller.signal,
      });
      clearTimeout(timeout);
      const text = await response.text();
      let data: unknown = null;
      if (text.trim()) {
        try {
          data = JSON.parse(text);
        } catch {
          throw new HttpRequestError(`${params.label}_non_json_${response.status}`, response.status);
        }
      } else if (!params.acceptEmpty) {
        data = {};
      }
      if (response.ok) {
        return {
          data: data as T,
          status: response.status,
          latencyMs: Date.now() - requestStartedAt,
          retries: attempt,
        };
      }
      const retryable = [429, 502, 503, 504].includes(response.status);
      lastError = new HttpRequestError(
        `${params.label}_http_${response.status}${responseErrorCode(data) ? `:${responseErrorCode(data)}` : ''}`,
        response.status
      );
      if (!retryable || attempt >= TRANSPORT_RETRY_LIMIT) throw lastError;
    } catch (error) {
      clearTimeout(timeout);
      lastError = error;
      if (error instanceof HttpRequestError && error.status && ![429, 502, 503, 504].includes(error.status)) {
        throw error;
      }
      if (attempt >= TRANSPORT_RETRY_LIMIT) break;
    }
    await sleep(500 * (attempt + 1));
  }
  throw lastError instanceof Error ? lastError : new Error(`${params.label}_transport_failed`);
}

async function getAccessToken(supabaseUrl: string, anonKey: string): Promise<{ token: string; userId: string }> {
  const existing = getEnv(['LIVE_SUPABASE_ACCESS_TOKEN', 'SUPABASE_ACCESS_TOKEN']);
  if (existing) {
    const user = await fetchJson<{ id?: string }>({
      url: `${supabaseUrl}/auth/v1/user`,
      label: 'auth_user',
      init: { headers: { apikey: anonKey, Authorization: `Bearer ${existing}` } },
    });
    if (!user.data.id) throw new Error('Existing access token has no user id.');
    return { token: existing, userId: user.data.id };
  }
  const email = getEnv(['LIVE_SUPABASE_EMAIL']);
  const password = getEnv(['LIVE_SUPABASE_PASSWORD']);
  if (!email || !password) {
    throw new Error('Missing LIVE_SUPABASE_ACCESS_TOKEN or LIVE_SUPABASE_EMAIL/PASSWORD.');
  }
  const auth = await fetchJson<{ access_token?: string; user?: { id?: string } }>({
    url: `${supabaseUrl}/auth/v1/token?grant_type=password`,
    label: 'auth_password',
    init: {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: anonKey },
      body: JSON.stringify({ email, password }),
    },
  });
  if (!auth.data.access_token || !auth.data.user?.id) {
    throw new Error('Supabase auth succeeded without token/user id.');
  }
  return { token: auth.data.access_token, userId: auth.data.user.id };
}

function expectedQuestionCount(surface: GenerationSurface): number {
  if (surface === 'reading_quick' || surface === 'chat_followup') return 1;
  if (surface === 'chat_followup_close') return 0;
  return 2;
}

function surfaceGroup(surface: GenerationSurface): DiagnosticGeneration['surface_group'] {
  if (surface.startsWith('reading_')) return 'reader';
  return surface === 'chat_followup' ? 'exploring_open' : 'closing';
}

function numberOrNull(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function contractFromResult(result: unknown): DiagnosticGeneration['contract_validation'] {
  if (!result || typeof result !== 'object') return null;
  const validation = (result as Record<string, unknown>).contract_validation;
  return validation && typeof validation === 'object'
    ? validation as DiagnosticGeneration['contract_validation']
    : null;
}

function costFromResult(result: unknown, key: string): AiCost | null {
  if (!result || typeof result !== 'object') return null;
  const cost = (result as Record<string, unknown>)[key];
  return cost && typeof cost === 'object' ? cost as AiCost : null;
}

function makeGeneration(params: {
  entry: DiagnosticCase;
  fixtureIndex: number;
  surface: GenerationSurface;
  userTurn: string | null;
  output: string;
  validation: DiagnosticGeneration['contract_validation'];
  cost: AiCost | null;
  estimatedCostUsd: number | null;
  completionMs: number | null;
  firstPartialMs?: number | null;
  firstVisibleMs?: number | null;
  partialUpdates?: number;
  transportRetries: number;
  quotaEventId: string | null;
  interpretationId: string | null;
  providerApiError?: string | null;
}): DiagnosticGeneration {
  const isFinalChat = params.surface === 'chat_followup_close';
  const extractSurface = params.surface.startsWith('reading_')
    ? params.entry.mode
    : 'chat';
  const questions = params.output
    ? extractSameCallReflectiveQuestions(params.output, extractSurface, { isFinalChat })
    : [];
  const validation = params.validation;
  return {
    generation_id: `${params.entry.id}:${params.surface}`,
    case_id: params.entry.id,
    fixture_index: params.fixtureIndex,
    title: params.entry.title,
    dream: params.entry.dream,
    mode: params.entry.mode,
    language: params.entry.language,
    language_group: params.entry.language_group,
    category: params.entry.category,
    surface: params.surface,
    surface_group: surfaceGroup(params.surface),
    user_turn: params.userTurn,
    output: params.output,
    extracted_reflective_questions: questions,
    question_count: validation?.question_count ?? questions.length,
    expected_question_count: validation?.expected_question_count ?? expectedQuestionCount(params.surface),
    contract_validation: validation,
    issue_codes: Array.isArray(validation?.issues) ? validation.issues : [],
    detected_language: validation?.detected_language ?? null,
    expected_language: validation?.expected_language ?? params.entry.language,
    answer_menu_detected: validation?.answer_menu_detected ?? null,
    model: typeof params.cost?.model === 'string' ? params.cost.model : null,
    provider: typeof params.cost?.provider === 'string' ? params.cost.provider : null,
    latency: {
      completion_ms: params.completionMs,
      first_partial_ms: params.firstPartialMs ?? null,
      first_user_visible_eligible_ms: params.firstVisibleMs ?? null,
      partial_update_count: params.partialUpdates ?? 0,
      completed_before_15s:
        params.surface.startsWith('reading_') && params.completionMs !== null
          ? params.completionMs < CLIENT_PARTIAL_REVEAL_MS
          : null,
    },
    ai_cost: params.cost,
    estimated_cost_usd: params.estimatedCostUsd,
    provider_api_error: params.providerApiError ?? null,
    transport_retry_count: params.transportRetries,
    transport_retry_occurred: params.transportRetries > 0,
    contract_retry_count: 0,
    question_only_call_count: 0,
    quota_event_id: params.quotaEventId,
    interpretation_id: params.interpretationId,
    generated_at: new Date().toISOString(),
  };
}

function percentile(values: number[], fraction: number): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.max(0, Math.ceil(sorted.length * fraction) - 1)] ?? null;
}

function formatMoney(value: number): string {
  return `$${value.toFixed(8)}`;
}

function buildMechanicalSummary(state: RunState): string {
  const generations = [...state.generations].sort((a, b) =>
    a.fixture_index - b.fixture_index || a.surface.localeCompare(b.surface)
  );
  const observed = generations.filter((entry) => entry.contract_validation?.passed !== null && entry.contract_validation);
  const passed = observed.filter((entry) => entry.contract_validation?.passed === true);
  const failed = observed.filter((entry) => entry.contract_validation?.passed === false);
  const totalCost = generations.reduce((sum, entry) => sum + (entry.estimated_cost_usd ?? 0), 0);
  const issueOccurrences = generations.flatMap((entry) => entry.issue_codes);
  const issueCounts = countBy(issueOccurrences, (issue) => issue);
  const latencyGroups = Object.entries(
    generations.reduce<Record<string, number[]>>((groups, entry) => {
      const key = entry.surface.startsWith('reading_') ? entry.surface : entry.surface_group;
      const value = entry.latency.completion_ms;
      if (value !== null) (groups[key] ??= []).push(value);
      return groups;
    }, {})
  );
  const lines = [
    '# v1.0.1 production diagnostic — mechanical draft',
    '',
    `Run: \`${state.run_id}\``,
    `Fixture SHA-256: \`${state.fixture_sha256}\``,
    `Production identity: \`${state.production_identity.method_id}\` / \`${state.production_identity.bundle_sha256}\``,
    '',
    `Generations recorded: ${generations.length}/${state.expected_generation_count}`,
    `Validator PASS: ${passed.length}`,
    `Validator FAIL: ${failed.length}`,
    `Validator unobserved/error: ${generations.length - observed.length}`,
    `Total exact aggregate of gateway cost estimates: ${formatMoney(totalCost)}`,
    `Transport retries: ${generations.reduce((sum, entry) => sum + entry.transport_retry_count, 0)}`,
    '',
    '## Issue occurrences',
    '',
    ...Object.entries(issueCounts).sort().map(([issue, count]) => `- ${issue}: ${count}`),
    ...(Object.keys(issueCounts).length === 0 ? ['- none'] : []),
    '',
    '## Completion latency',
    '',
    '| Surface | n | median ms | p75 ms | max ms |',
    '|---|---:|---:|---:|---:|',
    ...latencyGroups.map(([key, values]) =>
      `| ${key} | ${values.length} | ${percentile(values, 0.5) ?? 'n/a'} | ${percentile(values, 0.75) ?? 'n/a'} | ${Math.max(...values)} |`
    ),
    '',
    '## Validator failures',
    '',
    ...failed.map((entry) => `- ${entry.generation_id}: ${entry.issue_codes.join(', ')}`),
    ...(failed.length === 0 ? ['- none'] : []),
    '',
    '> This is a mechanical draft only. Validator FAIL is not an editorial verdict.',
    '',
  ];
  return lines.join('\n');
}

function buildReviewDraft(state: RunState): string {
  const generations = [...state.generations].sort((a, b) =>
    a.fixture_index - b.fixture_index || a.surface.localeCompare(b.surface)
  );
  return [
    '# v1.0.1 production diagnostic — human review packet draft',
    '',
    `Fixture SHA-256: \`${state.fixture_sha256}\``,
    '',
    '> Review mechanically flagged outputs and a representative PASS sample. Do not use validator status as the editorial verdict.',
    '',
    ...generations.flatMap((entry) => [
      `## ${entry.generation_id}`,
      '',
      `- Mode/language/surface: ${entry.mode} / ${entry.language} / ${entry.surface}`,
      `- Mechanical result: ${entry.contract_validation?.passed === true ? 'PASS' : entry.contract_validation?.passed === false ? 'FAIL' : 'UNOBSERVED'}`,
      `- Issues: ${entry.issue_codes.join(', ') || 'none'}`,
      `- Editorial classification: PENDING`,
      `- Editorial notes: PENDING`,
      '',
      '### Dream',
      '',
      '~~~text',
      entry.dream,
      '~~~',
      '',
      ...(entry.user_turn ? [
        '### User turn',
        '',
        '~~~text',
        entry.user_turn,
        '~~~',
        '',
      ] : []),
      '### Complete model output',
      '',
      '~~~text',
      entry.output || `[generation error: ${entry.provider_api_error ?? 'unknown'}]`,
      '~~~',
      '',
    ]),
  ].join('\n');
}

function writeArtifacts(outputDir: string, state: RunState): void {
  const sorted = [...state.generations].sort((a, b) =>
    a.fixture_index - b.fixture_index || a.surface.localeCompare(b.surface)
  );
  writeFileSync(path.join(outputDir, 'RAW_RESULTS.json'), JSON.stringify({ ...state, generations: sorted }, null, 2));
  writeFileSync(
    path.join(outputDir, 'RAW_RESULTS.jsonl'),
    `${sorted.map((entry) => JSON.stringify(entry)).join('\n')}${sorted.length ? '\n' : ''}`
  );
  writeFileSync(path.join(outputDir, 'MECHANICAL_SUMMARY.md'), buildMechanicalSummary({ ...state, generations: sorted }));
  writeFileSync(path.join(outputDir, 'HUMAN_REVIEW_PACKET_DRAFT.md'), buildReviewDraft({ ...state, generations: sorted }));
}

async function runWithConcurrency<T>(
  values: T[],
  concurrency: number,
  work: (value: T, index: number) => Promise<void>
): Promise<void> {
  let cursor = 0;
  async function worker(): Promise<void> {
    while (true) {
      const index = cursor;
      cursor += 1;
      if (index >= values.length) return;
      await work(values[index], index);
    }
  }
  await Promise.all(Array.from({ length: concurrency }, () => worker()));
}

async function main(): Promise<void> {
  const { fixture, sha256 } = loadFixture();
  assertPreflight(fixture, sha256);
  const preflight = {
    fixture_id: fixture.fixture_id,
    fixture_sha256: sha256,
    cases: fixture.cases.length,
    trajectories: fixture.cases.filter((entry) => entry.trajectory).length,
    expected_generations: fixture.cases.length + fixture.cases.filter((entry) => entry.trajectory).length * 2,
    production_identity: APPROVED_REFLECTIVE_QUESTION_PRODUCTION,
    shadow_validation_version: REFLECTIVE_CONTRACT_VALIDATION_VERSION,
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
  const gatewayUrl = `${supabaseUrl}/functions/v1/ai-entitlements-gateway`;
  const restUrl = `${supabaseUrl}/rest/v1`;
  const { token, userId } = await getAccessToken(supabaseUrl, anonKey);
  const authHeaders = { apikey: anonKey, Authorization: `Bearer ${token}` };
  const runStamp = new Date().toISOString().replace(/[:.]/gu, '-');
  const runId = `oneiros-v101-production-diagnostic-${runStamp}`;
  const outputDir = path.join(process.cwd(), 'tmp', runId);
  mkdirSync(outputDir, { recursive: true });
  copyFileSync(FIXTURE_PATH, path.join(outputDir, 'FROZEN_FIXTURE.json'));
  writeFileSync(path.join(outputDir, 'FIXTURE_SHA256.txt'), `${sha256}  FROZEN_FIXTURE.json\n`);

  const state: RunState = {
    run_id: runId,
    started_at: new Date().toISOString(),
    finished_at: null,
    fixture_path: path.relative(process.cwd(), FIXTURE_PATH),
    fixture_sha256: sha256,
    production_identity: fixture.production_identity,
    expected_generation_count: preflight.expected_generations,
    concurrency: CONCURRENCY,
    transport_retry_limit: TRANSPORT_RETRY_LIMIT,
    cost_cap_usd: COST_CAP_USD,
    gateway_health: null,
    generations: [],
    cleanup: { attempted: false, interpretation_failures: [], dream_failures: [] },
    fatal_error: null,
  };
  writeArtifacts(outputDir, state);

  const healthStartedAt = Date.now();
  const health = await fetchJson<unknown>({
    url: gatewayUrl,
    label: 'gateway_health',
    init: { method: 'OPTIONS' },
    acceptEmpty: true,
  });
  if (health.status !== 204) throw new Error(`Gateway health returned ${health.status}.`);
  state.gateway_health = { status: health.status, latency_ms: Date.now() - healthStartedAt };

  const dreamIds = new Map<string, string>();
  const interpretationIds = new Map<string, string>();
  let knownSpend = 0;

  const addGeneration = (generation: DiagnosticGeneration): void => {
    state.generations.push(generation);
    knownSpend += generation.estimated_cost_usd ?? 0;
    writeArtifacts(outputDir, state);
    process.stdout.write(
      `[${state.generations.length}/${state.expected_generation_count}] ${generation.generation_id} ` +
      `${generation.contract_validation?.passed === true ? 'PASS' : generation.contract_validation?.passed === false ? 'FAIL' : 'UNOBSERVED'} ` +
      `cost=${generation.estimated_cost_usd === null ? 'unknown' : formatMoney(generation.estimated_cost_usd)}\n`
    );
    if (knownSpend > COST_CAP_USD) throw new CostCapError(knownSpend);
  };

  async function invokeGateway<T>(body: Record<string, unknown>, label: string): Promise<HttpResult<T>> {
    return fetchJson<T>({
      url: gatewayUrl,
      label,
      timeoutMs: GENERATION_TIMEOUT_MS,
      init: {
        method: 'POST',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      },
    });
  }

  async function replayResult(body: Record<string, unknown>, label: string): Promise<HttpResult<Record<string, unknown>>> {
    const replay = await invokeGateway<Record<string, unknown>>(body, label);
    if (replay.data.status !== 'committed' || !replay.data.result || typeof replay.data.result !== 'object') {
      throw new Error(`${label}_missing_committed_result_context`);
    }
    return replay;
  }

  async function runReader(entry: DiagnosticCase, fixtureIndex: number, dreamId: string): Promise<string> {
    const surface = `reading_${entry.mode}` as GenerationSurface;
    const idempotencyKey = `v101-baseline:${sha256.slice(0, 16)}:${runStamp}:${entry.id}:reader`;
    const startedAt = Date.now();
    let transportRetries = 0;
    let quotaEventId: string | null = null;
    let interpretationId: string | null = null;
    let output = '';
    let finalResponse: Record<string, unknown> | null = null;
    let firstPartialMs: number | null = null;
    let firstVisibleMs: number | null = null;
    let partialUpdates = 0;
    let lastPartial = '';
    try {
      const startBody = {
        action: 'dream_reflection_generate',
        idempotencyKey,
        dreamId,
        depth: entry.mode,
        async: true,
      };
      const started = await invokeGateway<Record<string, unknown>>(startBody, `${entry.id}_reader_start`);
      transportRetries += started.retries;
      if (started.data.status !== 'pending' || typeof started.data.quota_event_id !== 'string') {
        throw new Error(`reader_start_${String(started.data.status ?? 'unknown')}:${String(started.data.reason ?? '')}`);
      }
      quotaEventId = started.data.quota_event_id;
      const statusBody = {
        action: 'dream_reflection_status',
        idempotencyKey: `v101-baseline:${runStamp}:${entry.id}:status`,
        dreamId,
        quotaEventId,
      };
      while (Date.now() - startedAt < GENERATION_TIMEOUT_MS) {
        await sleep(STATUS_POLL_INTERVAL_MS);
        const polled = await invokeGateway<Record<string, unknown>>(statusBody, `${entry.id}_reader_status`);
        transportRetries += polled.retries;
        const elapsed = Date.now() - startedAt;
        const partial = typeof polled.data.partial_reflection === 'string'
          ? polled.data.partial_reflection
          : '';
        if (polled.data.status === 'pending' && partial) {
          if (firstPartialMs === null) firstPartialMs = elapsed;
          if (partial !== lastPartial) {
            lastPartial = partial;
            partialUpdates += 1;
          }
          if (elapsed >= CLIENT_PARTIAL_REVEAL_MS && firstVisibleMs === null) firstVisibleMs = elapsed;
        }
        if (polled.data.status === 'committed') {
          finalResponse = polled.data;
          break;
        }
        if (polled.data.status === 'released' || polled.data.status === 'denied') {
          throw new Error(`reader_${String(polled.data.status)}:${String(polled.data.reason ?? '')}`);
        }
      }
      if (!finalResponse) throw new Error('reader_completion_timeout');
      output = typeof finalResponse.reflection === 'string' ? finalResponse.reflection : '';
      interpretationId = typeof finalResponse.interpretation_id === 'string'
        ? finalResponse.interpretation_id
        : null;
      if (!output || !interpretationId) throw new Error('reader_committed_payload_incomplete');
      const replay = await replayResult(startBody, `${entry.id}_reader_result_context`);
      transportRetries += replay.retries;
      const result = replay.data.result as Record<string, unknown>;
      const validation = contractFromResult(result);
      const cost = costFromResult(result, 'reflection_ai_cost');
      addGeneration(makeGeneration({
        entry,
        fixtureIndex,
        surface,
        userTurn: null,
        output,
        validation,
        cost,
        estimatedCostUsd: numberOrNull(result.reflection_cost_usd) ?? numberOrNull(cost?.estimatedUsd),
        completionMs: Date.now() - startedAt - replay.latencyMs,
        firstPartialMs,
        firstVisibleMs,
        partialUpdates,
        transportRetries,
        quotaEventId,
        interpretationId,
      }));
      interpretationIds.set(entry.id, interpretationId);
      return interpretationId;
    } catch (error) {
      if (error instanceof CostCapError) throw error;
      addGeneration(makeGeneration({
        entry,
        fixtureIndex,
        surface,
        userTurn: null,
        output,
        validation: null,
        cost: null,
        estimatedCostUsd: null,
        completionMs: Date.now() - startedAt,
        firstPartialMs,
        firstVisibleMs,
        partialUpdates,
        transportRetries,
        quotaEventId,
        interpretationId,
        providerApiError: cleanError(error),
      }));
      throw error;
    }
  }

  async function setSyntheticChatLimit(entry: DiagnosticCase, interpretationId: string): Promise<void> {
    await fetchJson<unknown>({
      url: `${restUrl}/interpretations?id=eq.${encodeURIComponent(interpretationId)}`,
      label: `${entry.id}_set_chat_limit`,
      acceptEmpty: true,
      init: {
        method: 'PATCH',
        headers: { ...authHeaders, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
        body: JSON.stringify({ chat_replies_used: 0, chat_replies_limit: 2 }),
      },
    });
  }

  async function runChatTurn(params: {
    entry: DiagnosticCase;
    fixtureIndex: number;
    interpretationId: string;
    userTurn: string;
    close: boolean;
  }): Promise<void> {
    const surface: GenerationSurface = params.close ? 'chat_followup_close' : 'chat_followup';
    const idempotencyKey = `v101-baseline:${sha256.slice(0, 16)}:${runStamp}:${params.entry.id}:${params.close ? 'close' : 'open'}`;
    const body = {
      action: 'dream_followup_reply',
      idempotencyKey,
      interpretationId: params.interpretationId,
      message: params.userTurn,
    };
    const startedAt = Date.now();
    let transportRetries = 0;
    let output = '';
    let quotaEventId: string | null = null;
    try {
      const response = await invokeGateway<Record<string, unknown>>(body, `${params.entry.id}_${surface}`);
      transportRetries += response.retries;
      quotaEventId = typeof response.data.quota_event_id === 'string' ? response.data.quota_event_id : null;
      if (response.data.status !== 'committed' || typeof response.data.assistant_reply !== 'string') {
        throw new Error(`${surface}_${String(response.data.status ?? 'unknown')}:${String(response.data.reason ?? '')}`);
      }
      output = response.data.assistant_reply;
      const completionMs = Date.now() - startedAt;
      const replay = await replayResult(body, `${params.entry.id}_${surface}_result_context`);
      transportRetries += replay.retries;
      quotaEventId = typeof replay.data.quota_event_id === 'string' ? replay.data.quota_event_id : quotaEventId;
      const result = replay.data.result as Record<string, unknown>;
      const validation = contractFromResult(result);
      const cost = costFromResult(result, 'chat_followup_ai_cost');
      addGeneration(makeGeneration({
        entry: params.entry,
        fixtureIndex: params.fixtureIndex,
        surface,
        userTurn: params.userTurn,
        output,
        validation,
        cost,
        estimatedCostUsd: numberOrNull(result.chat_followup_cost_usd) ?? numberOrNull(cost?.estimatedUsd),
        completionMs,
        transportRetries,
        quotaEventId,
        interpretationId: params.interpretationId,
      }));
    } catch (error) {
      if (error instanceof CostCapError) throw error;
      addGeneration(makeGeneration({
        entry: params.entry,
        fixtureIndex: params.fixtureIndex,
        surface,
        userTurn: params.userTurn,
        output,
        validation: null,
        cost: null,
        estimatedCostUsd: null,
        completionMs: Date.now() - startedAt,
        transportRetries,
        quotaEventId,
        interpretationId: params.interpretationId,
        providerApiError: cleanError(error),
      }));
      throw error;
    }
  }

  try {
    await runWithConcurrency(fixture.cases, CONCURRENCY, async (entry, index) => {
      const dreamId = `v101-baseline-${runStamp}-${entry.id}`;
      dreamIds.set(entry.id, dreamId);
      let interpretationId: string;
      try {
        await fetchJson<unknown>({
          url: `${restUrl}/dreams`,
          label: `${entry.id}_dream_insert`,
          acceptEmpty: true,
          init: {
            method: 'POST',
            headers: { ...authHeaders, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
            body: JSON.stringify({
              id: dreamId,
              user_id: userId,
              date: fixture.dream_date,
              title: entry.title,
              content: entry.dream,
              archived: true,
            }),
          },
        });
        interpretationId = await runReader(entry, index, dreamId);
      } catch (error) {
        if (error instanceof CostCapError) throw error;
        const readerSurface = `reading_${entry.mode}` as GenerationSurface;
        if (!state.generations.some((generation) => generation.generation_id === `${entry.id}:${readerSurface}`)) {
          addGeneration(makeGeneration({
            entry,
            fixtureIndex: index,
            surface: readerSurface,
            userTurn: null,
            output: '',
            validation: null,
            cost: null,
            estimatedCostUsd: null,
            completionMs: null,
            transportRetries: 0,
            quotaEventId: null,
            interpretationId: null,
            providerApiError: `dream_fixture_setup_failure:${cleanError(error)}`,
          }));
        }
        if (entry.trajectory) {
          for (const [surface, userTurn] of [
            ['chat_followup', entry.trajectory.open_user_turn],
            ['chat_followup_close', entry.trajectory.closing_user_turn],
          ] as const) {
            addGeneration(makeGeneration({
              entry,
              fixtureIndex: index,
              surface,
              userTurn,
              output: '',
              validation: null,
              cost: null,
              estimatedCostUsd: null,
              completionMs: null,
              transportRetries: 0,
              quotaEventId: null,
              interpretationId: null,
              providerApiError: `skipped_after_reader_failure:${cleanError(error)}`,
            }));
          }
        }
        return;
      }
      if (!entry.trajectory) return;
      try {
        await setSyntheticChatLimit(entry, interpretationId);
      } catch (error) {
        for (const [surface, userTurn] of [
          ['chat_followup', entry.trajectory.open_user_turn],
          ['chat_followup_close', entry.trajectory.closing_user_turn],
        ] as const) {
          addGeneration(makeGeneration({
            entry,
            fixtureIndex: index,
            surface,
            userTurn,
            output: '',
            validation: null,
            cost: null,
            estimatedCostUsd: null,
            completionMs: null,
            transportRetries: 0,
            quotaEventId: null,
            interpretationId,
            providerApiError: `skipped_after_chat_fixture_setup_failure:${cleanError(error)}`,
          }));
        }
        return;
      }
      try {
        await runChatTurn({
          entry,
          fixtureIndex: index,
          interpretationId,
          userTurn: entry.trajectory.open_user_turn,
          close: false,
        });
      } catch (error) {
        if (error instanceof CostCapError) throw error;
        addGeneration(makeGeneration({
          entry,
          fixtureIndex: index,
          surface: 'chat_followup_close',
          userTurn: entry.trajectory.closing_user_turn,
          output: '',
          validation: null,
          cost: null,
          estimatedCostUsd: null,
          completionMs: null,
          transportRetries: 0,
          quotaEventId: null,
          interpretationId,
          providerApiError: `skipped_after_open_turn_failure:${cleanError(error)}`,
        }));
        return;
      }
      try {
        await runChatTurn({
          entry,
          fixtureIndex: index,
          interpretationId,
          userTurn: entry.trajectory.closing_user_turn,
          close: true,
        });
      } catch (error) {
        if (error instanceof CostCapError) throw error;
        // The failed closing generation was already persisted by runChatTurn.
      }
    });
  } catch (error) {
    state.fatal_error = cleanError(error);
  } finally {
    state.cleanup.attempted = true;
    await runWithConcurrency(fixture.cases, 5, async (entry) => {
      const dreamId = dreamIds.get(entry.id);
      if (!dreamId) return;
      try {
        await fetchJson<unknown>({
          url: `${restUrl}/interpretations?dream_id=eq.${encodeURIComponent(dreamId)}`,
          label: `${entry.id}_interpretation_cleanup`,
          acceptEmpty: true,
          init: { method: 'DELETE', headers: { ...authHeaders, Prefer: 'return=minimal' } },
        });
      } catch {
        state.cleanup.interpretation_failures.push(entry.id);
      }
      try {
        await fetchJson<unknown>({
          url: `${restUrl}/dreams?id=eq.${encodeURIComponent(dreamId)}&user_id=eq.${encodeURIComponent(userId)}`,
          label: `${entry.id}_dream_cleanup`,
          acceptEmpty: true,
          init: { method: 'DELETE', headers: { ...authHeaders, Prefer: 'return=minimal' } },
        });
      } catch {
        state.cleanup.dream_failures.push(entry.id);
      }
    });
    state.finished_at = new Date().toISOString();
    writeArtifacts(outputDir, state);
  }

  process.stdout.write(`Artifacts: ${outputDir}\n`);
  process.stdout.write(`Known spend: ${formatMoney(knownSpend)}\n`);
  if (state.fatal_error) throw new Error(state.fatal_error);
  if (state.generations.length !== state.expected_generation_count) {
    throw new Error(`Expected ${state.expected_generation_count} generations, recorded ${state.generations.length}.`);
  }
}

main().catch((error: unknown) => {
  process.stderr.write(`${cleanError(error)}\n`);
  process.exit(1);
});
