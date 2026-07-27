/**
 * 5-dream combination acceptance suite (closed Mythic catalog).
 *
 * Source of dreams/expectations:
 *   docs/ONEIROS_5_DREAM_ACCEPTANCE_SET.jsonl
 *
 * Protocol:
 *   - each dream × 3 runs
 *   - temperature 0, debug OFF, no prompt edits between runs
 *   - ALWAYS parallel extracts by default (concurrency = job count)
 *   - reviewer-grade stage logs per run (validator_decisions + myth rejects)
 *   - costs + latency recorded per run
 *
 * Run:
 *   bash scripts/run-5-dream-acceptance.sh
 *   # or after exporting LIVE_SUPABASE_* / EXPO_PUBLIC_* :
 *   npx tsx scripts/run-5-dream-acceptance.ts
 *
 * Optional env:
 *   ACCEPTANCE_CONCURRENCY   default = all jobs in parallel; set only to throttle
 *   ACCEPTANCE_RUNS_PER_DREAM=3
 *   ACCEPTANCE_OUT_DIR=tmp/5-dream-acceptance-<stamp>
 */
import { mkdirSync, readFileSync, writeFileSync } from 'fs';
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
} from '../src/ai/dreamExtractionPrompt';
import { buildDreamExtractionResponseFormat } from '../src/ai/dreamExtractionResponseFormat';
import { validateStructuredTaskContent } from '../src/ai/structuredTaskValidation';
import { getMythicCatalogEntry } from '../src/ai/catalogs/mythicNarrativeCatalog';
import { estimateAiCallCost } from '../src/billing/aiPricing';
import {
  buildAcceptanceRunRecord,
  computeAcceptanceLayerPasses,
  reconcileAcceptancePacket,
  summarizeCasesFromRuns,
  validateAcceptanceFixtures,
  type AcceptanceRunRecord,
} from './lib/acceptanceRunRecord';
import {
  buildEchoBenchmarkStages,
  resolveBenchmarkConcurrency,
} from './lib/echoBenchmarkStages';

type Expected = {
  required_archetypes: string[];
  required_archetypes_min_runs?: number;
  acceptable_secondary_archetypes: string[];
  forbidden_archetypes: string[];
  required_myth_title: string | null;
  required_myth_catalog_id: string | null;
  catalog_gap?: string;
  forbidden_myths: string[];
  forbidden_myth_catalog_ids: string[];
};

type CaseSpec = {
  id: string;
  combination: string;
  dream_language: string;
  dream: string;
  expected: Expected;
};

type CostInfo = {
  estimatedUsd?: number;
  inputTokens?: number;
  cachedInputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  model?: string;
  provider?: string;
};

function getEnv(keys: string[]): string {
  for (const key of keys) {
    const value = process.env[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
}

function loadCases(): CaseSpec[] {
  const file = path.join(process.cwd(), 'docs/ONEIROS_5_DREAM_ACCEPTANCE_SET.jsonl');
  return readFileSync(file, 'utf8')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line) as CaseSpec);
}

function parseJson(content: string): Record<string, unknown> {
  const trimmed = content.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fenced?.[1]?.trim() || trimmed;
  return JSON.parse(raw) as Record<string, unknown>;
}

async function mapPool<T, R>(
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
  const n = Math.max(1, Math.min(concurrency, items.length));
  await Promise.all(Array.from({ length: n }, () => runOne()));
  return results;
}

function postValidate(rawParsed: Record<string, unknown>, dreamText: string) {
  return buildEchoBenchmarkStages(rawParsed, dreamText);
}

function labelsOf(archetypes: Array<{ canonical_label?: string }>): string[] {
  return archetypes
    .map((a) => (typeof a.canonical_label === 'string' ? a.canonical_label : ''))
    .filter(Boolean);
}

function requiredArchetypeRunsPass(params: {
  expected: Expected;
  scores: Array<Record<string, unknown>>;
  runCount: number;
}): { pass: boolean; hits: number; minRuns: number } {
  const requiredArch = params.expected.required_archetypes;
  if (requiredArch.length === 0) {
    const emptyOk = params.scores.every(
      (s) => Array.isArray(s.archetype_labels) && (s.archetype_labels as string[]).length === 0
    );
    return { pass: emptyOk, hits: emptyOk ? params.runCount : 0, minRuns: params.runCount };
  }
  const minRuns = Math.min(
    params.runCount,
    Math.max(1, params.expected.required_archetypes_min_runs ?? params.runCount)
  );
  const hits = params.scores.filter((s) =>
    requiredArch.every(
      (need) =>
        Array.isArray(s.required_archetypes_present) &&
        (s.required_archetypes_present as string[]).includes(need)
    )
  ).length;
  return { pass: hits >= minRuns, hits, minRuns };
}

function scoreRun(params: {
  caseSpec: CaseSpec;
  postArchetypes: Array<{ canonical_label?: string }>;
  postAmplifications: Array<{
    catalog_id?: string;
    title?: string;
    tradition?: string;
  }>;
  rawAmplifications: unknown;
}): Record<string, unknown> {
  const exp = params.caseSpec.expected;
  const labels = labelsOf(params.postArchetypes);
  const amps = params.postAmplifications;
  const catalogIds = amps
    .map((a) => (typeof a.catalog_id === 'string' ? a.catalog_id : ''))
    .filter(Boolean);

  const requiredArchHits = exp.required_archetypes.filter((need) => labels.includes(need));
  const forbiddenArchHits = exp.forbidden_archetypes.filter((bad) => labels.includes(bad));

  let mythStatus: 'correct' | 'empty' | 'wrong' | 'catalog_gap' | 'unexpected' = 'empty';
  if (exp.required_myth_catalog_id == null && exp.required_myth_title == null) {
    mythStatus = catalogIds.length === 0 ? 'empty' : 'unexpected';
  } else if (!exp.required_myth_catalog_id && exp.required_myth_title) {
    mythStatus = 'catalog_gap';
  } else if (catalogIds.length === 0) {
    mythStatus = 'empty';
  } else if (catalogIds[0] === exp.required_myth_catalog_id) {
    mythStatus = 'correct';
  } else {
    mythStatus = 'wrong';
  }

  const unknownIds = catalogIds.filter((id) => !getMythicCatalogEntry(id));
  const modelAuthoredTitleTradition = Array.isArray(params.rawAmplifications)
    ? params.rawAmplifications.some((item) => {
        if (!item || typeof item !== 'object') return false;
        const o = item as Record<string, unknown>;
        return (
          (typeof o.title === 'string' && o.title.trim().length > 0) ||
          (typeof o.tradition === 'string' && o.tradition.trim().length > 0)
        );
      })
    : false;

  const titleMismatch = amps.some((a) => {
    if (!a.catalog_id) return false;
    const entry = getMythicCatalogEntry(a.catalog_id);
    if (!entry) return true;
    return a.title !== entry.canonical_title || a.tradition !== entry.tradition_display;
  });

  return {
    required_archetypes_present: requiredArchHits,
    required_archetypes_missing: exp.required_archetypes.filter((need) => !labels.includes(need)),
    forbidden_archetypes_present: forbiddenArchHits,
    archetype_labels: labels,
    myth_status: mythStatus,
    myth_catalog_ids: catalogIds,
    integrity: {
      unknown_catalog_id_count: unknownIds.length,
      model_authored_title_or_tradition: modelAuthoredTitleTradition,
      title_tradition_mismatch: titleMismatch,
      more_than_one_myth: amps.length > 1,
    },
  };
}

async function main() {
  if (DREAM_EXTRACTION_TEMPERATURE !== 0) {
    throw new Error(`Expected temperature 0, got ${DREAM_EXTRACTION_TEMPERATURE}`);
  }

  const cases = loadCases();
  validateAcceptanceFixtures(cases);
  const runsPerDream = Math.max(1, Number(process.env.ACCEPTANCE_RUNS_PER_DREAM || 3));
  const plannedJobs = cases.length * runsPerDream;
  const concurrency = resolveBenchmarkConcurrency(plannedJobs);

  const supabaseUrl = getEnv(['EXPO_PUBLIC_SUPABASE_URL', 'SUPABASE_URL']).replace(/\/$/, '');
  const anon = getEnv(['EXPO_PUBLIC_SUPABASE_ANON_KEY', 'SUPABASE_ANON_KEY']);
  const endpoint = getEnv(['EXPO_PUBLIC_CUSTOM_GPT_ENDPOINT', 'CUSTOM_GPT_ENDPOINT']);
  const email = getEnv(['LIVE_SUPABASE_EMAIL']);
  const password = getEnv(['LIVE_SUPABASE_PASSWORD']);
  let token = getEnv(['LIVE_SUPABASE_ACCESS_TOKEN', 'SUPABASE_ACCESS_TOKEN']);
  if (!supabaseUrl || !anon || !endpoint) throw new Error('Missing supabase/proxy env');
  if (!token) {
    if (!email || !password) throw new Error('Missing LIVE_SUPABASE_EMAIL/PASSWORD');
    const res = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: anon },
      body: JSON.stringify({ email, password }),
    });
    const text = await res.text();
    if (!res.ok) throw new Error(`auth failed ${res.status}: ${text.slice(0, 300)}`);
    token = (JSON.parse(text) as { access_token?: string }).access_token || '';
    if (!token) throw new Error('no access token');
  }

  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outDir =
    process.env.ACCEPTANCE_OUT_DIR?.trim() ||
    path.join(process.cwd(), 'tmp', `5-dream-acceptance-${stamp}`);
  mkdirSync(outDir, { recursive: true });

  const system = buildDreamExtractionSystemPrompt();
  const jobs = cases.flatMap((caseSpec) =>
    Array.from({ length: runsPerDream }, (_, i) => ({
      caseSpec,
      runIndex: i + 1,
      label: `${caseSpec.id}_r${i + 1}`,
      cacheBust: randomUUID(),
    }))
  );

  writeFileSync(
    path.join(outDir, 'suite_meta.json'),
    JSON.stringify(
      {
        prompt_id: DREAM_EXTRACTION_PROMPT_ID,
        prompt_version: DREAM_EXTRACTION_PROMPT_VERSION,
        schema_version: DREAM_EXTRACTION_SCHEMA_VERSION,
        temperature: DREAM_EXTRACTION_TEMPERATURE,
        debug_suffix: false,
        reflection: null,
        runs_per_dream: runsPerDream,
        concurrency,
        catalog_ids: {
          orpheus_eurydice: 'greek.orpheus_eurydice',
          inanna_descent: 'sumerian.inanna_descent',
          sisyphus: 'greek.sisyphus',
          fisherman_and_jinni: 'arabian.fisherman_and_jinni',
        },
        cases: cases.map((c) => ({
          id: c.id,
          combination: c.combination,
          required_myth_catalog_id: c.expected.required_myth_catalog_id,
          catalog_gap: c.expected.catalog_gap ?? null,
        })),
      },
      null,
      2
    )
  );

  console.log(
    JSON.stringify({
      stage: 'start',
      jobs: jobs.length,
      concurrency,
      outDir,
      prompt_version: DREAM_EXTRACTION_PROMPT_VERSION,
    })
  );

  const packets = await mapPool(jobs, concurrency, async (job) => {
    const user = buildDreamExtractionUserPrompt({
      title: job.caseSpec.id,
      date: '2026-07-27',
      content: job.caseSpec.dream,
      finalInterpretation: null,
      debugInterpretiveEchoes: false,
    });
    // Cache-bust only: unique trailing marker so repeated runs are not prompt-cache hits.
    const userWithBust = `${user}\n\n[acceptance_run_id: ${job.cacheBust}]`;

    const started = Date.now();
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: anon,
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        task: 'dream_extraction',
        model: 'gpt-5.4-mini',
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: userWithBust },
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
      const fail = {
        run: job.label,
        case_id: job.caseSpec.id,
        run_index: job.runIndex,
        error: `proxy ${res.status}: ${text.slice(0, 500)}`,
        latency_ms,
      };
      writeFileSync(path.join(outDir, `${job.label}.json`), JSON.stringify(fail, null, 2));
      console.log(JSON.stringify({ run: job.label, error: fail.error, latency_ms }));
      return fail;
    }

    const body = JSON.parse(text) as Record<string, unknown>;
    const content =
      (body.choices as Array<{ message?: { content?: string } }> | undefined)?.[0]?.message
        ?.content ??
      (typeof body.content === 'string' ? body.content : '') ??
      '';
    const rawParsed = parseJson(String(content));
    const schema = validateStructuredTaskContent('dream_extraction', JSON.stringify(rawParsed));
    const post = postValidate(rawParsed, job.caseSpec.dream);
    const costRaw =
      body.ai_call_cost && typeof body.ai_call_cost === 'object'
        ? (body.ai_call_cost as CostInfo)
        : (estimateAiCallCost(
            body,
            typeof body.provider === 'string' ? body.provider : 'openai'
          ) as CostInfo);

    const scored = scoreRun({
      caseSpec: job.caseSpec,
      postArchetypes: post.post_validation_archetypes,
      postAmplifications: post.post_validation_amplifications,
      rawAmplifications: rawParsed.amplifications,
    });

    const acceptanceRun = buildAcceptanceRunRecord({
      runId: job.label,
      caseSpec: job.caseSpec,
      outDir,
      post,
      score: {
        myth_status: scored.myth_status as AcceptanceRunRecord['myth_status'],
        myth_catalog_ids: scored.myth_catalog_ids as string[],
      },
      model: typeof body.model === 'string' ? body.model : costRaw.model ?? null,
      schemaOk: schema.ok,
      proxyOk: true,
      latency_ms,
      estimated_usd: costRaw.estimatedUsd ?? null,
    });

    const packet = {
      run: job.label,
      case_id: job.caseSpec.id,
      combination: job.caseSpec.combination,
      run_index: job.runIndex,
      cache_bust: job.cacheBust,
      prompt_version: DREAM_EXTRACTION_PROMPT_VERSION,
      model: body.model ?? costRaw.model ?? null,
      temperature: DREAM_EXTRACTION_TEMPERATURE,
      latency_ms,
      cost: costRaw,
      acceptance_run: acceptanceRun,
      raw_archetypes: post.raw_archetypes,
      parsed_archetypes: post.parsed_archetypes,
      normalized_archetypes: post.normalized_archetypes,
      validator_decisions: post.validator_decisions,
      post_validation_archetypes: post.post_validation_archetypes,
      archetype_rejected: post.archetype_rejected,
      raw_amplifications: post.raw_amplifications,
      post_validation_amplifications: post.post_validation_amplifications,
      mythic_reject_reasons: post.mythic_reject_reasons,
      mythic_rejected: post.mythic_rejected,
      score: scored,
    };
    writeFileSync(
      path.join(outDir, `${job.label}.stages.json`),
      JSON.stringify(
        {
          run_id: job.label,
          raw_archetypes: post.raw_archetypes,
          parsed_archetypes: post.parsed_archetypes,
          normalized_archetypes: post.normalized_archetypes,
          validator_decisions: post.validator_decisions,
          post_validation_archetypes: post.post_validation_archetypes,
          raw_amplifications: post.raw_amplifications,
          post_validation_amplifications: post.post_validation_amplifications,
          mythic_rejected: post.mythic_rejected,
        },
        null,
        2
      )
    );
    writeFileSync(path.join(outDir, `${job.label}.json`), JSON.stringify(packet, null, 2));
    console.log(
      JSON.stringify({
        run: job.label,
        latency_ms,
        estimatedUsd: costRaw.estimatedUsd ?? null,
        archetypes: scored.archetype_labels,
        myth_status: scored.myth_status,
        myth_ids: scored.myth_catalog_ids,
      })
    );
    return packet;
  });

  const okPackets = packets.filter((p) => !('error' in p && p.error));
  const byCase = new Map<string, typeof okPackets>();
  for (const p of okPackets) {
    const id = String((p as { case_id?: string }).case_id || '');
    const list = byCase.get(id) || [];
    list.push(p);
    byCase.set(id, list);
  }

  const acceptanceRuns: AcceptanceRunRecord[] = okPackets.map(
    (p) => (p as { acceptance_run: AcceptanceRunRecord }).acceptance_run
  );
  const caseSummariesFromRuns = summarizeCasesFromRuns(acceptanceRuns).map((row) => {
    const spec = cases.find((c) => c.id === row.case_id);
    const runs = byCase.get(row.case_id) || [];
    const scores = runs.map((r) => (r as { score?: Record<string, unknown> }).score || {});
    const requiredArchEval = spec
      ? requiredArchetypeRunsPass({ expected: spec.expected, scores, runCount: runs.length })
      : { pass: false, hits: 0, minRuns: 0 };
    const forbiddenArchTotal = scores.reduce(
      (n, s) => n + ((s.forbidden_archetypes_present as string[] | undefined)?.length || 0),
      0
    );
    const costs = runs.map((r) => Number(((r as { cost?: CostInfo }).cost?.estimatedUsd) || 0));
    const latencies = runs.map((r) => Number((r as { latency_ms?: number }).latency_ms || 0));
    return {
      case_id: row.case_id,
      combination: spec?.combination ?? '',
      runs: row.runs,
      required_myth_catalog_id: row.required_myth_catalog_id,
      catalog_gap: spec?.expected.catalog_gap ?? null,
      myth_correct: row.myth_correct,
      myth_empty: row.myth_empty,
      myth_wrong: row.myth_wrong,
      myth_pass_min_2_of_3: row.myth_pass_min_2_of_3,
      required_archetype_run_hits: requiredArchEval.hits,
      required_archetypes_min_runs: requiredArchEval.minRuns,
      required_archetypes_pass: requiredArchEval.pass,
      required_archetypes_3_of_3: requiredArchEval.pass,
      forbidden_archetype_hits: forbiddenArchTotal,
      cost_usd_sum: Number(costs.reduce((a, b) => a + b, 0).toFixed(6)),
      latency_ms_avg: latencies.length
        ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length)
        : 0,
      run_labels: row.run_ids,
    };
  });

  const caseSummaries = caseSummariesFromRuns;

  const integrity = {
    unknown_catalog_id: okPackets.filter(
      (p) => Number(((p as { score?: { integrity?: { unknown_catalog_id_count?: number } } }).score?.integrity?.unknown_catalog_id_count) || 0) > 0
    ).length,
    model_authored_title_or_tradition: okPackets.filter(
      (p) =>
        Boolean(
          (p as { score?: { integrity?: { model_authored_title_or_tradition?: boolean } } }).score
            ?.integrity?.model_authored_title_or_tradition
        )
    ).length,
    title_tradition_mismatch: okPackets.filter(
      (p) =>
        Boolean(
          (p as { score?: { integrity?: { title_tradition_mismatch?: boolean } } }).score?.integrity
            ?.title_tradition_mismatch
        )
    ).length,
    more_than_one_myth: okPackets.filter(
      (p) =>
        Boolean(
          (p as { score?: { integrity?: { more_than_one_myth?: boolean } } }).score?.integrity
            ?.more_than_one_myth
        )
    ).length,
  };

  const totalCost = Number(
    okPackets
      .reduce((sum, p) => sum + Number(((p as { cost?: CostInfo }).cost?.estimatedUsd) || 0), 0)
      .toFixed(6)
  );

  const suitePass = {
    integrity_100:
      integrity.unknown_catalog_id === 0 &&
      integrity.model_authored_title_or_tradition === 0 &&
      integrity.title_tradition_mismatch === 0 &&
      integrity.more_than_one_myth === 0,
    myth_negative_6_of_6: (() => {
      const neg = caseSummaries.filter((c) =>
        ['C2_one_archetype_no_myth', 'C4_neither'].includes(c.case_id)
      );
      return neg.every((c) => c.myth_empty === c.runs && c.myth_wrong === 0);
    })(),
    myth_positive_min_2_of_3: caseSummaries
      .filter((c) => c.required_myth_catalog_id)
      .every((c) => c.myth_pass_min_2_of_3),
    required_archetypes_all: caseSummaries.every((c) => c.required_archetypes_pass),
    empty_archetype_cases: caseSummaries
      .filter((c) => ['C3_no_archetype_plus_myth', 'C4_neither'].includes(c.case_id))
      .every((c) => c.required_archetypes_pass),
    catalog_gaps: caseSummaries.filter((c) => c.catalog_gap).map((c) => c.case_id),
  };

  const layerPasses = computeAcceptanceLayerPasses(suitePass);

  const summary = {
    prompt_version: DREAM_EXTRACTION_PROMPT_VERSION,
    temperature: DREAM_EXTRACTION_TEMPERATURE,
    debug_suffix: false,
    out_dir: outDir,
    total_runs: packets.length,
    ok_runs: okPackets.length,
    failed_runs: packets.length - okPackets.length,
    concurrency,
    total_estimated_usd: totalCost,
    integrity,
    suite_pass: suitePass,
    integrity_pass: layerPasses.integrity_pass,
    myth_layer_pass: layerPasses.myth_layer_pass,
    archetype_layer_pass: layerPasses.archetype_layer_pass,
    overall_pass: layerPasses.overall_pass,
    cases: caseSummaries,
  };

  writeFileSync(path.join(outDir, 'summary.json'), JSON.stringify(summary, null, 2));
  writeFileSync(path.join(outDir, 'all_runs.json'), JSON.stringify(packets, null, 2));
  writeFileSync(path.join(outDir, 'acceptance_runs.json'), JSON.stringify(acceptanceRuns, null, 2));

  const reconcileErrors = reconcileAcceptancePacket({
    source_out_dir: outDir,
    runs: acceptanceRuns,
    cases: summarizeCasesFromRuns(acceptanceRuns),
    summaryCases: caseSummaries,
  });

  const reviewerPacket = {
    title: 'Oneiros five-dream acceptance reviewer packet',
    generated_at: new Date().toISOString(),
    source_out_dir: outDir,
    prompt_id: DREAM_EXTRACTION_PROMPT_ID,
    prompt_version: DREAM_EXTRACTION_PROMPT_VERSION,
    schema_version: DREAM_EXTRACTION_SCHEMA_VERSION,
    packet_valid: reconcileErrors.length === 0,
    reconcile_errors: reconcileErrors,
    summary,
    five_dream_runs: acceptanceRuns,
  };
  writeFileSync(path.join(outDir, 'reviewer_packet.json'), JSON.stringify(reviewerPacket, null, 2));
  writeFileSync(
    path.join(process.cwd(), 'tmp/ONEIROS_FIVE_DREAM_REVIEWER_PACKET.json'),
    JSON.stringify(reviewerPacket, null, 2)
  );

  console.log('\n=== 5-DREAM ACCEPTANCE SUMMARY ===');
  console.log(JSON.stringify(summary, null, 2));
  if (reconcileErrors.length > 0) {
    console.error('\n=== PACKET INVALID ===');
    console.error(JSON.stringify(reconcileErrors, null, 2));
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
