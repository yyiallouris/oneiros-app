import { readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import {
  buildDreamExtractionSystemPrompt,
  buildDreamExtractionUserPrompt,
  DREAM_EXTRACTION_PROMPT_ID,
  DREAM_EXTRACTION_PROMPT_VERSION,
  DREAM_EXTRACTION_SCHEMA_VERSION,
  DREAM_EXTRACTION_TEMPERATURE,
  DREAM_EXTRACTION_TOKEN_LIMIT,
} from '../../src/ai/dreamExtractionPrompt';
import {
  auditDreamExtractionOutputLanguage,
  resolveDreamOutputLanguage,
  runOutputLanguageCommitGate,
  summarizeOutputLanguageTelemetry,
  validateLanguageRepairFieldMap,
  type DreamOutputLanguageTelemetry,
} from '../../src/ai/dreamOutputLanguage';
import { ARCHETYPE_CATALOG_VERSION } from '../../src/ai/catalogs/archetypeCatalog.v1';
import { buildDreamExtractionResponseFormat } from '../../src/ai/dreamExtractionResponseFormat';
import { validateStructuredTaskContent } from '../../src/ai/structuredTaskValidation';
import { estimateAiCallCost } from '../../src/billing/aiPricing';
import {
  computeGlobalArchetypeMetricsByStyle,
  validateGlobalArchetypeFixtures,
  type GlobalArchetypeFixture,
} from './globalArchetypeBenchmark';
import { aggregateGlobalArchetypeCosts, type GlobalArchetypeRunCost } from './globalArchetypeCost';
import { computeMixedAdjudicatedMetrics } from './globalArchetypeMixedAnalysis';
import {
  classifyProxyError,
  computeModelRoutingMetrics,
  isFallbackArchetypeBenchmarkModel,
  isPrimaryArchetypeBenchmarkModel,
} from './globalArchetypeModelRouting';
import { GLOBAL_ARCHETYPE_BENCHMARK_VERSION } from './globalArchetypeBenchmarkFixtures';
import {
  buildGlobalArchetypeRunRecord,
  type GlobalArchetypeFailedRun,
  type GlobalArchetypeRunRecord,
} from './globalArchetypeRunRecord';
import { buildEchoBenchmarkStages } from './echoBenchmarkStages';

export type GlobalArchetypeExtractSuccess = {
  ok: true;
  latency_ms: number;
  model: string | null;
  cost: GlobalArchetypeRunCost | null;
  schema_ok: boolean;
  schema_errors: string[];
  rawParsed: Record<string, unknown>;
  stages: ReturnType<typeof buildEchoBenchmarkStages>;
  rawArchetypes: unknown[];
  provider_attempts: GlobalArchetypeFailedRun['provider_attempts'];
  output_language: DreamOutputLanguageTelemetry;
};

export type GlobalArchetypeExtractFailure = {
  ok: false;
  error: string;
  error_type: string;
  latency_ms: number;
  model: string | null;
  cost: GlobalArchetypeRunCost | null;
  provider_attempts: GlobalArchetypeFailedRun['provider_attempts'];
};

export type GlobalArchetypeExtractResult = GlobalArchetypeExtractSuccess | GlobalArchetypeExtractFailure;

export function getEnv(keys: string[]): string {
  for (const key of keys) {
    const value = process.env[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
}

export function loadGlobalArchetypeFixtures(): GlobalArchetypeFixture[] {
  const file = path.join(process.cwd(), 'docs/ONEIROS_GLOBAL_ARCHETYPE_BENCHMARK.jsonl');
  const fixtures = readFileSync(file, 'utf8')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line) as GlobalArchetypeFixture);
  validateGlobalArchetypeFixtures(fixtures);
  return fixtures;
}

function parseJson(content: string): Record<string, unknown> {
  const trimmed = content.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  return JSON.parse((fenced?.[1]?.trim() || trimmed) as string) as Record<string, unknown>;
}

export async function mapPool<T, R>(
  items: T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;
  async function runOne() {
    while (true) {
      const index = next++;
      if (index >= items.length) return;
      results[index] = await worker(items[index], index);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, () => runOne()));
  return results;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Exponential backoff with jitter for TPM 429s (~16.8k input tokens/request). */
export function rateLimitBackoffMs(attempt: number, status: number): number {
  if (status === 429) {
    const base = 2000 * Math.pow(2, Math.max(0, attempt - 1));
    const jitter = Math.floor(Math.random() * 1000);
    return Math.min(60_000, base + jitter);
  }
  return 1500 * attempt;
}

function buildCost(model: string | null, usage: Record<string, unknown> | undefined): GlobalArchetypeRunCost | null {
  if (!usage || typeof usage !== 'object') return null;
  const inputTokens = Number(usage.prompt_tokens ?? usage.input_tokens ?? 0) || 0;
  const outputTokens = Number(usage.completion_tokens ?? usage.output_tokens ?? 0) || 0;
  const cachedInputTokens = Number(usage.cached_tokens ?? usage.cached_input_tokens ?? 0) || 0;
  const provider = model?.startsWith('claude') ? 'anthropic' : 'openai';
  const estimated = estimateAiCallCost(
    {
      model: model ?? 'gpt-5.4-mini',
      usage: {
        prompt_tokens: inputTokens,
        completion_tokens: outputTokens,
        prompt_tokens_details: {
          cached_tokens: cachedInputTokens,
        },
      },
    },
    provider
  );
  return {
    model: model ?? undefined,
    provider,
    inputTokens,
    cachedInputTokens,
    outputTokens,
    totalTokens: inputTokens + outputTokens,
    estimatedUsd: estimated.estimatedUsd,
  };
}

export async function extractGlobalArchetypeFixture(params: {
  fixture: GlobalArchetypeFixture;
  runId: string;
  endpoint: string;
  anon: string;
  token: string;
  primaryOnly?: boolean;
  disableAnthropicFallback?: boolean;
  maxAttempts?: number;
}): Promise<GlobalArchetypeExtractResult> {
  const primaryOnly = params.primaryOnly ?? false;
  const disableAnthropicFallback = params.disableAnthropicFallback ?? primaryOnly;
  const maxAttempts = params.maxAttempts ?? (primaryOnly ? 8 : 5);
  const system = buildDreamExtractionSystemPrompt();
  const targetOutputLanguage = resolveDreamOutputLanguage(
    params.fixture.dream,
    params.fixture.dream_language
  );
  const user = buildDreamExtractionUserPrompt({
    title: params.fixture.id,
    date: '2026-07-27',
    content: params.fixture.dream,
    finalInterpretation: null,
    debugInterpretiveEchoes: false,
    dreamLanguage: params.fixture.dream_language,
    targetOutputLanguage,
  });

  let lastFailure: GlobalArchetypeExtractFailure | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const started = Date.now();
    const providerAttempts: GlobalArchetypeFailedRun['provider_attempts'] = [];
    const res = await fetch(params.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: params.anon,
        Authorization: `Bearer ${params.token}`,
      },
      body: JSON.stringify({
        task: 'dream_extraction',
        model: 'gpt-5.4-mini',
        disable_anthropic_fallback: disableAnthropicFallback,
        messages: [
          { role: 'system', content: system },
          {
            role: 'user',
            content: `${user}\n\n[global_archetype_run_id: ${params.runId}:${randomUUID()}]`,
          },
        ],
        temperature: DREAM_EXTRACTION_TEMPERATURE,
        max_completion_tokens: DREAM_EXTRACTION_TOKEN_LIMIT,
        max_tokens: DREAM_EXTRACTION_TOKEN_LIMIT,
        response_format: buildDreamExtractionResponseFormat(),
      }),
    });
    const text = await res.text();
    const latency_ms = Date.now() - started;

    if (!res.ok) {
      providerAttempts.push({
        provider: 'openai',
        model: 'gpt-5.4-mini',
        status: res.status,
        error: text.slice(0, 300),
      });
      const error_type = classifyProxyError(`proxy ${res.status}: ${text}`);
      lastFailure = {
        ok: false,
        error: `proxy ${res.status}: ${text.slice(0, 500)}`,
        error_type,
        latency_ms,
        model: null,
        cost: null,
        provider_attempts: providerAttempts,
      };
      if (attempt < maxAttempts && (res.status === 429 || res.status >= 500)) {
        await sleep(rateLimitBackoffMs(attempt, res.status));
        continue;
      }
      return lastFailure;
    }

    const body = JSON.parse(text) as Record<string, unknown>;
    const content =
      (body.choices as Array<{ message?: { content?: string } }> | undefined)?.[0]?.message
        ?.content ??
      (typeof body.content === 'string' ? body.content : '') ??
      '';
    const model =
      typeof body.model === 'string'
        ? body.model
        : typeof (body as { model_used?: unknown }).model_used === 'string'
          ? String((body as { model_used: string }).model_used)
          : 'gpt-5.4-mini';
    const usage = (body.usage ?? body.cost) as Record<string, unknown> | undefined;
    const cost = buildCost(model, usage);

    if (primaryOnly && isFallbackArchetypeBenchmarkModel(model)) {
      providerAttempts.push({
        provider: model.startsWith('claude') ? 'anthropic' : 'unknown',
        model,
        status: res.status,
        error: 'fallback_model_used',
      });
      lastFailure = {
        ok: false,
        error: `fallback model used: ${model}`,
        error_type: 'fallback_model_used',
        latency_ms,
        model,
        cost,
        provider_attempts: providerAttempts,
      };
      if (attempt < maxAttempts) {
        await sleep(2500 * attempt);
        continue;
      }
      return lastFailure;
    }

    const initialParsed = parseJson(String(content));
    const schema = validateStructuredTaskContent('dream_extraction', JSON.stringify(initialParsed));
    if (!schema.ok) {
      lastFailure = {
        ok: false,
        error: `schema invalid: ${schema.schemaErrors.slice(0, 3).join('; ')}`,
        error_type: 'schema_invalid',
        latency_ms,
        model,
        cost,
        provider_attempts: providerAttempts,
      };
      return lastFailure;
    }

    const languageGate = await runOutputLanguageCommitGate({
      parsed: schema.data as Record<string, unknown>,
      target: targetOutputLanguage,
      repairOnce: async ({ messages, expectedPaths }) => {
        const repairRes = await fetch(params.endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: params.anon,
            Authorization: `Bearer ${params.token}`,
          },
          body: JSON.stringify({
            task: 'dream_extraction',
            model: 'gpt-5.4-mini',
            disable_anthropic_fallback: disableAnthropicFallback,
            messages,
            temperature: DREAM_EXTRACTION_TEMPERATURE,
            max_completion_tokens: 1200,
            max_tokens: 1200,
            response_format: { type: 'json_object' },
            skip_structured_validation: true,
          }),
        });
        const repairText = await repairRes.text();
        providerAttempts.push({
          provider: 'openai',
          model: 'gpt-5.4-mini',
          status: repairRes.status,
          error: repairRes.ok ? undefined : repairText.slice(0, 300),
        });
        if (!repairRes.ok) return null;
        const repairBody = JSON.parse(repairText) as Record<string, unknown>;
        const repairContent =
          (repairBody.choices as Array<{ message?: { content?: string } }> | undefined)?.[0]
            ?.message?.content ??
          (typeof repairBody.content === 'string' ? repairBody.content : '') ??
          '';
        if (!repairContent) return null;
        let parsedRepair: unknown;
        try {
          parsedRepair = JSON.parse(String(repairContent));
        } catch {
          return null;
        }
        return validateLanguageRepairFieldMap(parsedRepair, expectedPaths);
      },
    });

    if (!languageGate.ok) {
      lastFailure = {
        ok: false,
        error: `language_validation_failed: ${languageGate.telemetry.mismatched_field_paths.join(',')}`,
        error_type: 'language_validation_failed',
        latency_ms,
        model,
        cost,
        provider_attempts: providerAttempts,
      };
      // Language commit gate rejected — do not treat as a completed packet.
      return lastFailure;
    }

    const rawParsed = languageGate.parsed;
    const stages = buildEchoBenchmarkStages(rawParsed, params.fixture.dream);
    const rawArchetypes = Array.isArray(rawParsed.archetypes) ? rawParsed.archetypes : [];
    const output_language: DreamOutputLanguageTelemetry = {
      ...auditDreamExtractionOutputLanguage(rawParsed, targetOutputLanguage),
      language_match: languageGate.telemetry.final_commit_allowed,
      language_mismatch_fields: languageGate.telemetry.mismatched_field_paths,
    };

    providerAttempts.push({
      provider: isPrimaryArchetypeBenchmarkModel(model) ? 'openai' : 'anthropic',
      model,
      status: res.status,
    });

    return {
      ok: true,
      latency_ms,
      model,
      cost,
      schema_ok: true,
      schema_errors: [],
      rawParsed,
      stages,
      rawArchetypes,
      provider_attempts: providerAttempts,
      output_language,
    };
  }

  return (
    lastFailure ?? {
      ok: false,
      error: 'extract failed without response',
      error_type: 'proxy_error',
      latency_ms: 0,
      model: null,
      cost: null,
      provider_attempts: [],
    }
  );
}

export function runRecordToMetricsInput(
  record: GlobalArchetypeRunRecord,
  fixture: GlobalArchetypeFixture
) {
  return {
    fixture,
    post_archetype_ids: record.post_archetype_ids,
    raw_archetype_ids: record.raw_archetype_ids,
    raw_candidate_count: record.raw_candidate_count,
    schema_ok: record.schema_ok,
    proxy_ok: record.proxy_ok,
    post_myth_count: record.myth_regression.post_myth_catalog_id ? 1 : 0,
  };
}

export function buildGlobalArchetypeSummary(params: {
  outDir: string;
  fixtures: GlobalArchetypeFixture[];
  completed: GlobalArchetypeRunRecord[];
  failed: GlobalArchetypeFailedRun[];
  execution_mode: 'routing_system_inclusive' | 'primary_only' | 'reconciled_primary_only';
  source_routing_out_dir?: string;
}) {
  const metricsByStyle = computeGlobalArchetypeMetricsByStyle(
    params.completed.map((record) =>
      runRecordToMetricsInput(record, params.fixtures.find((f) => f.id === record.fixture_id)!)
    )
  );

  const costSummary = aggregateGlobalArchetypeCosts(params.completed.map((r) => r.cost));
  const modelRouting = computeModelRoutingMetrics(params.completed, (record) =>
    runRecordToMetricsInput(record, params.fixtures.find((f) => f.id === record.fixture_id)!)
  );
  const mixedAdjudication = computeMixedAdjudicatedMetrics(
    params.completed.map((record) => ({
      fixture: params.fixtures.find((f) => f.id === record.fixture_id)!,
      post_archetype_ids: record.post_archetype_ids,
    }))
  );
  const languageSummary = summarizeOutputLanguageTelemetry(
    params.completed.map((record) => record.output_language)
  );
  const languageByDreamLanguage = Object.fromEntries(
    ['en', 'el'].map((code) => {
      const subset = params.completed.filter((record) => {
        const fixture = params.fixtures.find((f) => f.id === record.fixture_id)!;
        return fixture.dream_language === code;
      });
      return [
        code,
        summarizeOutputLanguageTelemetry(subset.map((record) => record.output_language)),
      ];
    })
  );

  const totalFixtures = params.fixtures.length;
  const completedRuns = params.completed.length;
  const failedRuns = params.failed.length;
  const packetComplete = completedRuns === totalFixtures && failedRuns === 0;

  return {
    phase: 'global_archetype_evaluation',
    dataset_version: GLOBAL_ARCHETYPE_BENCHMARK_VERSION,
    prompt_id: DREAM_EXTRACTION_PROMPT_ID,
    prompt_version: DREAM_EXTRACTION_PROMPT_VERSION,
    schema_version: DREAM_EXTRACTION_SCHEMA_VERSION,
    archetype_catalog_version: ARCHETYPE_CATALOG_VERSION,
    frozen_baseline: {
      myth_layer: 'C.1.1 frozen',
      hero_layer: 'D.1 accepted_with_known_residuals',
      patch_e: 'accepted_with_known_residuals',
      production_status: 'accepted_with_known_residuals',
      production_changes_in_this_phase: false,
    },
    execution_mode: params.execution_mode,
    source_routing_out_dir: params.source_routing_out_dir ?? null,
    outDir: params.outDir,
    total_fixtures: totalFixtures,
    completed_runs: completedRuns,
    failed_runs: failedRuns,
    packet_reconciled: true,
    packet_complete: packetComplete,
    ...costSummary,
    model_routing: modelRouting,
    mixed_adjudication: mixedAdjudication,
    output_language_metrics: {
      ...languageSummary,
      by_dream_language: languageByDreamLanguage,
    },
    metrics: metricsByStyle.global,
    catalog_conformance_score: metricsByStyle.catalog_conformance,
    naturalistic_generalization_score: metricsByStyle.naturalistic,
    top_confusion_pairs: metricsByStyle.global.confusion_pairs.slice(0, 15),
    failed_run_records: params.failed,
  };
}

export function writeGlobalArchetypeBenchmarkArtifacts(params: {
  outDir: string;
  fixtures: GlobalArchetypeFixture[];
  completed: GlobalArchetypeRunRecord[];
  failed: GlobalArchetypeFailedRun[];
  execution_mode: 'routing_system_inclusive' | 'primary_only' | 'reconciled_primary_only';
  source_routing_out_dir?: string;
}) {
  const summary = buildGlobalArchetypeSummary(params);
  writeFileSync(
    path.join(params.outDir, 'global_archetype_runs.json'),
    JSON.stringify(params.completed, null, 2)
  );
  writeFileSync(path.join(params.outDir, 'summary.json'), JSON.stringify(summary, null, 2));
  if (params.failed.length > 0) {
    writeFileSync(
      path.join(params.outDir, 'failed_runs.json'),
      JSON.stringify(params.failed, null, 2)
    );
  }
  return summary;
}

export async function resolveBenchmarkAuth(): Promise<{
  supabaseUrl: string;
  anon: string;
  endpoint: string;
  token: string;
}> {
  const supabaseUrl = getEnv(['EXPO_PUBLIC_SUPABASE_URL']).replace(/\/$/, '');
  const anon = getEnv(['EXPO_PUBLIC_SUPABASE_ANON_KEY']);
  const endpoint = getEnv(['EXPO_PUBLIC_CUSTOM_GPT_ENDPOINT']);
  const token =
    getEnv(['LIVE_SUPABASE_ACCESS_TOKEN']) ||
    (await (async () => {
      const email = getEnv(['LIVE_SUPABASE_EMAIL']);
      const password = getEnv(['LIVE_SUPABASE_PASSWORD']);
      const res = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: anon },
        body: JSON.stringify({ email, password }),
      });
      const text = await res.text();
      if (!res.ok) throw new Error(`auth ${res.status}: ${text.slice(0, 300)}`);
      return (JSON.parse(text) as { access_token?: string }).access_token || '';
    })());
  return { supabaseUrl, anon, endpoint, token };
}

export function assertFrozenGlobalArchetypeBaseline(): void {
  if (String(DREAM_EXTRACTION_PROMPT_VERSION) !== '4.1.10-M2') {
    throw new Error(`Expected frozen baseline 4.1.10-M2, got ${DREAM_EXTRACTION_PROMPT_VERSION}`);
  }
  if (String(ARCHETYPE_CATALOG_VERSION) !== '1.7.0') {
    throw new Error(`Expected archetype catalog 1.7.0, got ${ARCHETYPE_CATALOG_VERSION}`);
  }
}

export function buildFailedRunRecord(params: {
  runId: string;
  fixtureId: string;
  outDir: string;
  result: GlobalArchetypeExtractFailure;
}): GlobalArchetypeFailedRun {
  return {
    run_id: params.runId,
    fixture_id: params.fixtureId,
    error_type: params.result.error_type,
    error_message: params.result.error,
    provider_attempts: params.result.provider_attempts,
    source_failure_file: `${params.outDir}/${params.runId}.json`,
    latency_ms: params.result.latency_ms,
  };
}

export function collectFailedRunsFromDir(outDir: string, fixtures: GlobalArchetypeFixture[]): GlobalArchetypeFailedRun[] {
  const completedIds = new Set(
    (JSON.parse(readFileSync(path.join(outDir, 'global_archetype_runs.json'), 'utf8')) as GlobalArchetypeRunRecord[]).map(
      (r) => r.fixture_id
    )
  );
  const failed: GlobalArchetypeFailedRun[] = [];
  for (const fixture of fixtures) {
    if (completedIds.has(fixture.id)) continue;
    const runId = `${fixture.id}_r1`;
    const failPath = path.join(outDir, `${runId}.json`);
    try {
      const payload = JSON.parse(readFileSync(failPath, 'utf8')) as {
        ok?: boolean;
        error?: string;
        latency_ms?: number;
      };
      if (payload.ok === false) {
        failed.push({
          run_id: runId,
          fixture_id: fixture.id,
          error_type: classifyProxyError(String(payload.error ?? '')),
          error_message: String(payload.error ?? 'unknown failure'),
          provider_attempts: [],
          source_failure_file: failPath,
          latency_ms: payload.latency_ms ?? 0,
        });
      }
    } catch {
      failed.push({
        run_id: runId,
        fixture_id: fixture.id,
        error_type: 'missing_run_file',
        error_message: 'fixture has no completed or failed run artifact',
        provider_attempts: [],
        source_failure_file: failPath,
        latency_ms: 0,
      });
    }
  }
  return failed;
}
