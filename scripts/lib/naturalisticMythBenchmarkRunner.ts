import { createHash, randomUUID } from 'crypto';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';
import {
  buildDreamExtractionSystemPrompt,
  buildDreamExtractionUserPrompt,
  DREAM_EXTRACTION_PROMPT_ID,
  DREAM_EXTRACTION_PROMPT_VERSION,
  DREAM_EXTRACTION_SCHEMA_VERSION,
  DREAM_EXTRACTION_TEMPERATURE,
  DREAM_EXTRACTION_TOKEN_LIMIT,
} from '../../src/ai/dreamExtractionPrompt';
import { MYTHIC_CATALOG_VERSION } from '../../src/ai/catalogs/mythicNarrativeCatalog';
import {
  MYTHIC_PROMPT_INDEX,
  MYTHIC_PROMPT_INDEX_VERSION,
} from '../../src/ai/catalogs/mythicPromptIndex';
import { ARCHETYPE_CATALOG_VERSION } from '../../src/ai/catalogs/archetypeCatalog.v1';
import { buildDreamExtractionResponseFormat } from '../../src/ai/dreamExtractionResponseFormat';
import { validateStructuredTaskContent } from '../../src/ai/structuredTaskValidation';
import {
  auditDreamExtractionOutputLanguage,
  resolveDreamOutputLanguage,
  runOutputLanguageCommitGate,
  summarizeOutputLanguageTelemetry,
  validateLanguageRepairFieldMap,
  type DreamOutputLanguageTelemetry,
} from '../../src/ai/dreamOutputLanguage';
import { estimateAiCallCost } from '../../src/billing/aiPricing';
import { buildEchoBenchmarkStages } from './echoBenchmarkStages';
import {
  buildMythLevelReport,
  computeNaturalisticMythMetrics,
  inferReviewHypothesis,
  inferReviewHypotheses,
  mythDatasetHash,
  reconcileNaturalisticMythRunRecords,
  summarizeRepeatConsistency,
} from './naturalisticMythBenchmark';
import type { NaturalisticMythFixture } from './naturalisticMythBenchmarkFixtures';
import type {
  NaturalisticMythFailedRun,
  NaturalisticMythRunRecord,
} from './naturalisticMythRunRecord';
import { aggregateGlobalArchetypeCosts, type GlobalArchetypeRunCost } from './globalArchetypeCost';
import {
  mapPool,
  rateLimitBackoffMs,
  resolveBenchmarkAuth,
} from './globalArchetypeBenchmarkRunner';

export const MYTH_NATURALISTIC_EXPECTED_MODEL = 'gpt-5.4-mini-2026-03-17' as const;

export type MythExtractSuccess = {
  ok: true;
  latency_ms: number;
  model: string;
  cost: GlobalArchetypeRunCost | null;
  rawParsed: Record<string, unknown>;
  stages: ReturnType<typeof buildEchoBenchmarkStages>;
  output_language: DreamOutputLanguageTelemetry;
  provider_attempts: NaturalisticMythFailedRun['provider_attempts'];
  retry_count: number;
};

export type MythExtractFailure = {
  ok: false;
  error: string;
  error_type: string;
  latency_ms: number;
  model: string | null;
  cost: GlobalArchetypeRunCost | null;
  provider_attempts: NaturalisticMythFailedRun['provider_attempts'];
  retry_count: number;
};

export type NaturalisticMythBenchmarkJob = {
  fixture: NaturalisticMythFixture;
  repeat_index: 1 | 2 | 3;
  run_id: string;
};

export function loadNaturalisticMythFixtures(): NaturalisticMythFixture[] {
  const file = path.join(process.cwd(), 'docs/myth-naturalistic-calibration.v1.0.0.json');
  return JSON.parse(readFileSync(file, 'utf8')) as NaturalisticMythFixture[];
}

function parseJson(content: string): Record<string, unknown> {
  const trimmed = content.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  return JSON.parse((fenced?.[1]?.trim() || trimmed) as string) as Record<string, unknown>;
}

function classifyProxyError(message: string): string {
  if (message.includes('429')) return 'rate_limited';
  if (message.includes('schema invalid')) return 'schema_invalid';
  if (message.includes('language_validation_failed')) return 'language_validation_failed';
  if (message.includes('fallback model used')) return 'fallback_model_used';
  return 'proxy_error';
}

function buildCost(model: string | null, usage: Record<string, unknown> | undefined): GlobalArchetypeRunCost | null {
  if (!usage || typeof usage !== 'object') return null;
  const provider = model?.startsWith('claude') ? 'anthropic' : 'openai';
  const estimated = estimateAiCallCost(
    {
      model: model ?? 'gpt-5.4-mini',
      usage: {
        prompt_tokens: Number(usage.prompt_tokens ?? usage.input_tokens ?? 0) || 0,
        completion_tokens: Number(usage.completion_tokens ?? usage.output_tokens ?? 0) || 0,
        total_tokens:
          (Number(usage.prompt_tokens ?? usage.input_tokens ?? 0) || 0) +
          (Number(usage.completion_tokens ?? usage.output_tokens ?? 0) || 0),
        prompt_tokens_details: {
          cached_tokens: Number(usage.cached_tokens ?? usage.cached_input_tokens ?? 0) || 0,
        },
      },
    },
    provider
  );
  return {
    model: model ?? undefined,
    provider,
    inputTokens: estimated.inputTokens,
    cachedInputTokens: estimated.cachedInputTokens,
    outputTokens: estimated.outputTokens,
    totalTokens: estimated.totalTokens,
    estimatedUsd: estimated.estimatedUsd,
  };
}

function sha256(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex');
}

export function assertFrozenNaturalisticMythBaseline(): void {
  if (String(DREAM_EXTRACTION_PROMPT_VERSION) !== '4.1.10-M2') {
    throw new Error(`Expected frozen baseline 4.1.10-M2, got ${DREAM_EXTRACTION_PROMPT_VERSION}`);
  }
  if (DREAM_EXTRACTION_SCHEMA_VERSION !== 13) {
    throw new Error(`Expected schema 13, got ${DREAM_EXTRACTION_SCHEMA_VERSION}`);
  }
  if (String(ARCHETYPE_CATALOG_VERSION) !== '1.7.0') {
    throw new Error(`Expected archetype catalog 1.7.0, got ${ARCHETYPE_CATALOG_VERSION}`);
  }
  if (String(MYTHIC_CATALOG_VERSION) !== '1.2.0') {
    throw new Error(`Expected myth catalog 1.2.0, got ${MYTHIC_CATALOG_VERSION}`);
  }
}

export function buildNaturalisticMythBenchmarkManifest(params: {
  outDir: string;
  fixtures: NaturalisticMythFixture[];
  concurrency: number;
}) {
  return {
    phase: 'naturalistic_myth_calibration',
    generated_at: new Date().toISOString(),
    out_dir: params.outDir,
    prompt_id: DREAM_EXTRACTION_PROMPT_ID,
    prompt_version: DREAM_EXTRACTION_PROMPT_VERSION,
    schema_version: DREAM_EXTRACTION_SCHEMA_VERSION,
    archetype_catalog_version: ARCHETYPE_CATALOG_VERSION,
    myth_catalog_version: MYTHIC_CATALOG_VERSION,
    myth_prompt_index_version: MYTHIC_PROMPT_INDEX_VERSION,
    dataset_version: params.fixtures[0]?.dataset_version ?? null,
    prompt_hash: sha256(buildDreamExtractionSystemPrompt()),
    schema_hash: sha256(JSON.stringify(buildDreamExtractionResponseFormat())),
    myth_catalog_hash: sha256(
      readFileSync(path.join(process.cwd(), 'src/ai/catalogs/mythic_narrative_catalog.v1.json'), 'utf8')
    ),
    myth_prompt_index_hash: sha256(MYTHIC_PROMPT_INDEX),
    dataset_hash: mythDatasetHash(params.fixtures),
    model: MYTH_NATURALISTIC_EXPECTED_MODEL,
    routing_settings: {
      task: 'dream_extraction',
      disable_anthropic_fallback: true,
      primary_only: true,
      concurrency: params.concurrency,
      retry_strategy: '429 exponential backoff with jitter',
      temperature: DREAM_EXTRACTION_TEMPERATURE,
      max_completion_tokens: DREAM_EXTRACTION_TOKEN_LIMIT,
    },
  };
}

export function buildNaturalisticMythBenchmarkJobs(
  fixtures: NaturalisticMythFixture[]
): NaturalisticMythBenchmarkJob[] {
  return fixtures.flatMap((fixture) =>
    ([1, 2, 3] as const).map((repeat_index) => ({
      fixture,
      repeat_index,
      run_id: `${fixture.fixture_id}_r${repeat_index}`,
    }))
  );
}

function isNaturalisticMythRunRecord(value: unknown): value is NaturalisticMythRunRecord {
  return Boolean(
    value &&
      typeof value === 'object' &&
      typeof (value as { run_id?: unknown }).run_id === 'string' &&
      typeof (value as { fixture_id?: unknown }).fixture_id === 'string' &&
      typeof (value as { source_run_file?: unknown }).source_run_file === 'string'
  );
}

export function loadExistingNaturalisticMythProgress(params: {
  outDir: string;
  jobs: NaturalisticMythBenchmarkJob[];
}) {
  const existingRuns: NaturalisticMythRunRecord[] = [];
  const jobsToRun: NaturalisticMythBenchmarkJob[] = [];
  let retriedFailedArtifacts = 0;

  for (const job of params.jobs) {
    const file = path.join(params.outDir, `${job.run_id}.json`);
    if (!existsSync(file)) {
      jobsToRun.push(job);
      continue;
    }

    try {
      const parsed = JSON.parse(readFileSync(file, 'utf8')) as unknown;
      if (isNaturalisticMythRunRecord(parsed) && parsed.run_id === job.run_id) {
        existingRuns.push(parsed);
        continue;
      }
      retriedFailedArtifacts += 1;
      jobsToRun.push(job);
    } catch {
      jobsToRun.push(job);
    }
  }

  return {
    existingRuns,
    jobsToRun,
    retriedFailedArtifacts,
  };
}

export function sortNaturalisticMythRunRecords(
  runs: NaturalisticMythRunRecord[],
  jobs: NaturalisticMythBenchmarkJob[]
): NaturalisticMythRunRecord[] {
  const order = new Map(jobs.map((job, index) => [job.run_id, index]));
  return [...runs].sort((a, b) => (order.get(a.run_id) ?? Number.MAX_SAFE_INTEGER) - (order.get(b.run_id) ?? Number.MAX_SAFE_INTEGER));
}

export async function extractNaturalisticMythFixture(params: {
  fixture: NaturalisticMythFixture;
  run_id: string;
  repeat_index: 1 | 2 | 3;
  endpoint: string;
  anon: string;
  token: string;
}): Promise<MythExtractSuccess | MythExtractFailure> {
  const system = buildDreamExtractionSystemPrompt();
  const targetOutputLanguage = resolveDreamOutputLanguage(
    params.fixture.dream_text,
    params.fixture.dream_language
  );
  const user = buildDreamExtractionUserPrompt({
    title: params.fixture.fixture_id,
    date: '2026-07-27',
    content: params.fixture.dream_text,
    finalInterpretation: null,
    debugInterpretiveEchoes: false,
    dreamLanguage: params.fixture.dream_language,
    targetOutputLanguage,
  });

  let lastFailure: MythExtractFailure | null = null;

  for (let attempt = 1; attempt <= 8; attempt += 1) {
    const started = Date.now();
    const provider_attempts: NaturalisticMythFailedRun['provider_attempts'] = [];
    const res = await fetch(params.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: params.anon,
        Authorization: `Bearer ${params.token}`,
      },
      body: JSON.stringify({
        task: 'dream_extraction',
        model: MYTH_NATURALISTIC_EXPECTED_MODEL,
        disable_anthropic_fallback: true,
        messages: [
          { role: 'system', content: system },
          {
            role: 'user',
            content: `${user}\n\n[myth_naturalistic_run_id: ${params.run_id}:${randomUUID()}]`,
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
      provider_attempts.push({
        provider: 'openai',
        model: MYTH_NATURALISTIC_EXPECTED_MODEL,
        status: res.status,
        error: text.slice(0, 300),
      });
      lastFailure = {
        ok: false,
        error: `proxy ${res.status}: ${text.slice(0, 500)}`,
        error_type: classifyProxyError(`proxy ${res.status}: ${text}`),
        latency_ms,
        model: null,
        cost: null,
        provider_attempts,
        retry_count: attempt - 1,
      };
      if (attempt < 8 && (res.status === 429 || res.status >= 500)) {
        await new Promise((resolve) => setTimeout(resolve, rateLimitBackoffMs(attempt, res.status)));
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
          : '';
    const usage = (body.usage ?? body.cost) as Record<string, unknown> | undefined;
    const cost = buildCost(model || null, usage);

    if (model.startsWith('claude')) {
      provider_attempts.push({
        provider: 'anthropic',
        model,
        status: 200,
        error: 'fallback_model_used',
      });
      lastFailure = {
        ok: false,
        error: `fallback model used: ${model}`,
        error_type: 'fallback_model_used',
        latency_ms,
        model,
        cost,
        provider_attempts,
        retry_count: attempt - 1,
      };
      if (attempt < 8) {
        await new Promise((resolve) => setTimeout(resolve, 2500 * attempt));
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
        model: model || '',
        cost,
        provider_attempts,
        retry_count: attempt - 1,
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
            model: MYTH_NATURALISTIC_EXPECTED_MODEL,
            disable_anthropic_fallback: true,
            messages,
            temperature: DREAM_EXTRACTION_TEMPERATURE,
            max_completion_tokens: 1200,
            max_tokens: 1200,
            response_format: { type: 'json_object' },
            skip_structured_validation: true,
          }),
        });
        const repairText = await repairRes.text();
        provider_attempts.push({
          provider: 'openai',
          model: MYTH_NATURALISTIC_EXPECTED_MODEL,
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
        model: model || '',
        cost,
        provider_attempts,
        retry_count: attempt - 1,
      };
      return lastFailure;
    }

    const rawParsed = languageGate.parsed;
    const stages = buildEchoBenchmarkStages(rawParsed, params.fixture.dream_text);
    const output_language: DreamOutputLanguageTelemetry = {
      ...auditDreamExtractionOutputLanguage(rawParsed, targetOutputLanguage),
      language_match: languageGate.telemetry.final_commit_allowed,
      language_mismatch_fields: languageGate.telemetry.mismatched_field_paths,
    };

    provider_attempts.push({
      provider: 'openai',
      model: model || MYTH_NATURALISTIC_EXPECTED_MODEL,
      status: 200,
    });

    return {
      ok: true,
      latency_ms,
      model: model || MYTH_NATURALISTIC_EXPECTED_MODEL,
      cost,
      rawParsed,
      stages,
      output_language,
      provider_attempts,
      retry_count: attempt - 1,
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
      retry_count: 7,
    }
  );
}

export function buildNaturalisticMythSummary(params: {
  outDir: string;
  fixtures: NaturalisticMythFixture[];
  runs: NaturalisticMythRunRecord[];
  failedRuns: NaturalisticMythFailedRun[];
}) {
  const metrics = computeNaturalisticMythMetrics(params.fixtures, params.runs);
  const repeatConsistency = summarizeRepeatConsistency(params.fixtures, params.runs);
  const mythLevelReport = buildMythLevelReport(params.fixtures, params.runs);
  const reconciliationErrors = reconcileNaturalisticMythRunRecords({
    fixtures: params.fixtures,
    runs: params.runs,
    failed_runs: params.failedRuns.map((run) => ({
      fixture_id: run.fixture_id,
      repeat_index: run.repeat_index,
    })),
    outDir: params.outDir,
    expectedModel: MYTH_NATURALISTIC_EXPECTED_MODEL,
  });
  const modelCounts = params.runs.reduce<Record<string, number>>((acc, run) => {
    acc[run.model] = (acc[run.model] ?? 0) + 1;
    return acc;
  }, {});
  const outputLanguage = summarizeOutputLanguageTelemetry(
    params.runs.map((run) => run.output_language)
  );
  const manifest = buildNaturalisticMythBenchmarkManifest({
    outDir: params.outDir,
    fixtures: params.fixtures,
    concurrency: Number(process.env.MYTH_BENCHMARK_CONCURRENCY?.trim()) || 2,
  });

  const summary = {
    phase: 'naturalistic_myth_calibration',
    status: 'diagnostic_only',
    outDir: params.outDir,
    dataset_version: params.fixtures[0]?.dataset_version ?? null,
    prompt_id: DREAM_EXTRACTION_PROMPT_ID,
    prompt_version: DREAM_EXTRACTION_PROMPT_VERSION,
    schema_version: DREAM_EXTRACTION_SCHEMA_VERSION,
    myth_catalog_version: MYTHIC_CATALOG_VERSION,
    myth_prompt_index_version: MYTHIC_PROMPT_INDEX_VERSION,
    archetype_catalog_version: ARCHETYPE_CATALOG_VERSION,
    frozen_baseline: {
      myth_layer: 'C.1.1 frozen',
      prompt_version_requested_in_brief: '4.1.7-E',
      repository_runtime_on_2026_07_27: DREAM_EXTRACTION_PROMPT_VERSION,
      production_changes_in_this_phase: false,
    },
    expected_model: MYTH_NATURALISTIC_EXPECTED_MODEL,
    completed_runs: params.runs.length,
    failed_runs: params.failedRuns.length,
    packet_complete: params.runs.length === 72 && params.failedRuns.length === 0,
    packet_reconciled: reconciliationErrors.length === 0,
    packet_valid: reconciliationErrors.length === 0,
    reconciliation_errors: reconciliationErrors,
    model_count: modelCounts,
    fallback_rate:
      params.runs.length > 0
        ? params.runs.filter((run) => run.fallback_used).length / params.runs.length
        : 0,
    cost_summary: aggregateGlobalArchetypeCosts(params.runs.map((run) => run.cost)),
    output_language_metrics: outputLanguage,
    benchmark_manifest: manifest,
    metrics,
    repeat_consistency: repeatConsistency,
    myth_level_report: mythLevelReport,
    failed_run_records: params.failedRuns,
  };

  return summary;
}

export function buildNaturalisticMythCopyPaste(summary: ReturnType<typeof buildNaturalisticMythSummary>): string {
  const metrics = summary.metrics;
  const modelCount = summary.model_count[MYTH_NATURALISTIC_EXPECTED_MODEL] ?? 0;
  return [
    'ONEIROS NATURALISTIC MYTH CALIBRATION — quick copy/paste',
    `prompt_version: ${summary.prompt_version}`,
    `dataset_version: ${summary.dataset_version}`,
    `completed_runs: ${summary.completed_runs}`,
    `failed_runs: ${summary.failed_runs}`,
    `packet_valid: ${summary.packet_valid}`,
    `packet_reconciled: ${summary.packet_reconciled}`,
    `packet_complete: ${summary.packet_complete}`,
    `model_count ${MYTH_NATURALISTIC_EXPECTED_MODEL}: ${modelCount}`,
    `fallback_rate: ${(summary.fallback_rate * 100).toFixed(1)}%`,
    `overall_contract_pass: ${(metrics.contract_pass_rate * 100).toFixed(1)}%`,
    `exact_catalog_precision: ${
      metrics.exact_catalog_precision == null
        ? 'null'
        : `${(metrics.exact_catalog_precision * 100).toFixed(1)}%`
    }`,
    `exact_catalog_recall: ${(metrics.exact_catalog_recall * 100).toFixed(1)}%`,
    `strong_positive_recall: ${(metrics.strong_positive_recall * 100).toFixed(1)}%`,
    `incomplete_positive_recall: ${(metrics.incomplete_positive_recall * 100).toFixed(1)}%`,
    `thematic_negative_empty_accuracy: ${(metrics.thematic_negative_empty_accuracy * 100).toFixed(1)}%`,
    `competitor_exact_id_accuracy: ${(metrics.competitor_exact_id_accuracy * 100).toFixed(1)}%`,
    `high_confidence_false_positive_count: ${metrics.high_confidence_false_positive_count}`,
    `raw_candidate_omission_count: ${metrics.raw_candidate_omission_count}`,
    `raw_correct_post_removed_count: ${metrics.raw_correct_post_removed_count}`,
    `evidence_resolution_failure_count: ${metrics.evidence_resolution_failure_count}`,
    `validator_rejection_count: ${metrics.validator_rejection_count}`,
    `language_match_rate: ${(metrics.language_match_rate * 100).toFixed(1)}%`,
  ].join('\n');
}

export function buildNaturalisticMythReviewerPacket(params: {
  fixtures: NaturalisticMythFixture[];
  runs: NaturalisticMythRunRecord[];
  failedRuns: NaturalisticMythFailedRun[];
  outDir: string;
}) {
  const summary = buildNaturalisticMythSummary(params);
  const fixtureById = new Map(params.fixtures.map((fixture) => [fixture.fixture_id, fixture]));
  return {
    title: 'Oneiros naturalistic myth calibration packet',
    generated_at: new Date().toISOString(),
    phase: 'naturalistic_myth_calibration',
    status: 'diagnostic_only',
    packet_valid: summary.packet_valid,
    packet_reconciled: summary.packet_reconciled,
    packet_complete: summary.packet_complete,
    reconciliation_errors: summary.reconciliation_errors,
    source_out_dir: params.outDir,
    summary,
    failed_run_records: params.failedRuns,
    failed_contract_runs: params.runs
      .filter((run) => !run.contract_pass)
      .map((run) => {
        const hypotheses = inferReviewHypotheses(run);
        return {
          run_id: run.run_id,
          fixture_id: run.fixture_id,
          repeat_index: run.repeat_index,
          dream_text: fixtureById.get(run.fixture_id)?.dream_text ?? '',
          expected_catalog_id: run.required_catalog_id,
          raw_catalog_ids: run.raw_catalog_ids,
          post_catalog_ids: run.post_catalog_ids,
          returned_catalog_id: run.post_catalog_ids[0] ?? null,
          confidence: run.returned_confidence,
          evidence_ids: run.evidence_ids,
          evidence_spans: run.resolved_evidence_spans ?? [],
          resonance: run.resonance,
          divergence: run.divergence,
          validator_decisions: run.validator_decisions,
          review_hypothesis: inferReviewHypothesis(run),
          review_hypothesis_primary: hypotheses.primary,
          review_hypothesis_secondary: hypotheses.secondary,
          source_run_file: run.source_run_file,
        };
      }),
    runs: params.runs,
  };
}

export function writeNaturalisticMythArtifacts(params: {
  outDir: string;
  fixtures: NaturalisticMythFixture[];
  runs: NaturalisticMythRunRecord[];
  failedRuns: NaturalisticMythFailedRun[];
}) {
  const summary = buildNaturalisticMythSummary(params);
  const reviewer = buildNaturalisticMythReviewerPacket(params);
  const manifest = buildNaturalisticMythBenchmarkManifest({
    outDir: params.outDir,
    fixtures: params.fixtures,
    concurrency: Number(process.env.MYTH_BENCHMARK_CONCURRENCY?.trim()) || 2,
  });
  const copyPaste = buildNaturalisticMythCopyPaste(summary);

  writeFileSync(path.join(params.outDir, 'acceptance_runs.json'), JSON.stringify(params.runs, null, 2));
  writeFileSync(path.join(params.outDir, 'summary.json'), JSON.stringify(summary, null, 2));
  writeFileSync(
    path.join(params.outDir, 'ONEIROS_MYTH_NATURALISTIC_V1_REVIEWER_PACKET.json'),
    JSON.stringify(reviewer, null, 2)
  );
  writeFileSync(
    path.join(params.outDir, 'ONEIROS_MYTH_NATURALISTIC_V1_COPY_PASTE.txt'),
    `${copyPaste}\n`
  );
  writeFileSync(
    path.join(params.outDir, 'myth-naturalistic-calibration.v1.0.0.json'),
    JSON.stringify(params.fixtures, null, 2)
  );
  writeFileSync(
    path.join(params.outDir, 'benchmark_manifest.json'),
    JSON.stringify(manifest, null, 2)
  );
  writeFileSync(path.join(params.outDir, 'failed_runs.json'), JSON.stringify(params.failedRuns, null, 2));

  return { summary, reviewer, copyPaste, manifest };
}
