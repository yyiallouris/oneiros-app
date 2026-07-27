import { createHash } from 'crypto';
import { mkdirSync, writeFileSync } from 'fs';
import path from 'path';
import {
  buildDreamExtractionSystemPrompt,
  buildDreamExtractionUserPrompt,
  DREAM_EXTRACTION_PROMPT_ID,
  DREAM_EXTRACTION_PROMPT_VERSION,
  DREAM_EXTRACTION_SCHEMA_VERSION,
  DREAM_EXTRACTION_TEMPERATURE,
} from '../../src/ai/dreamExtractionPrompt';
import {
  ARCHETYPE_CATALOG_VERSION,
  formatArchetypeCatalogForPromptV1,
  getArchetypeDefinitionById,
} from '../../src/ai/catalogs/archetypeCatalog.v1';
import { buildDreamExtractionResponseFormat } from '../../src/ai/dreamExtractionResponseFormat';
import { resolveDreamOutputLanguage } from '../../src/ai/dreamOutputLanguage';
import { dreamHash } from './globalArchetypeBenchmark';
import {
  extractGlobalArchetypeFixture,
  getEnv,
  mapPool,
  type GlobalArchetypeExtractResult,
} from './globalArchetypeBenchmarkRunner';
import type { GlobalArchetypeFixture } from './globalArchetypeBenchmark';
import {
  PATCH_F_PHASE1_FIXTURE,
  PATCH_F_PHASE2_FIXTURES,
  PATCH_F_SUITE_VERSION,
  validatePatchFFixtures,
  type PatchFFixture,
} from './patchFStabilityFixtures';
import {
  scoreFixtureRuns,
  type PatchFRunRow,
  type PatchFSuiteReport,
} from './patchFStabilityMetrics';

function sha16(text: string): string {
  return createHash('sha256').update(text, 'utf8').digest('hex').slice(0, 16);
}

function readArchetypeId(row: unknown): string {
  if (!row || typeof row !== 'object') return '';
  const id = (row as { archetype_id?: unknown }).archetype_id;
  return typeof id === 'string' ? id.trim() : '';
}

function readMechanismTags(row: unknown): string[] {
  if (!row || typeof row !== 'object') return [];
  const tags = (row as { mechanism_tags?: unknown }).mechanism_tags;
  return Array.isArray(tags) ? tags.filter((t): t is string => typeof t === 'string') : [];
}

function readEvidenceIds(row: unknown): string[] {
  if (!row || typeof row !== 'object') return [];
  const ids = (row as { evidence_ids?: unknown }).evidence_ids;
  return Array.isArray(ids) ? ids.filter((id): id is string => typeof id === 'string') : [];
}

function readConfidence(row: unknown): string | null {
  if (!row || typeof row !== 'object') return null;
  const c = (row as { confidence?: unknown }).confidence;
  return typeof c === 'string' ? c : null;
}

/** Reconstruct the compact Lover block as injected into dream_extraction. */
export function extractCompactLoverCatalogRecord(): {
  catalog_version: string;
  lover_definition: ReturnType<typeof getArchetypeDefinitionById>;
  compact_prompt_record: string;
  present_in_injected_catalog: boolean;
} {
  const injected = formatArchetypeCatalogForPromptV1();
  const blocks = injected.split(/\n(?=id=)/);
  const loverBlock =
    blocks.find((b) => b.startsWith('id=lover ') || b.startsWith('id=lover\n')) ??
    blocks.find((b) => b.includes('id=lover')) ??
    '';
  const def = getArchetypeDefinitionById('lover');
  return {
    catalog_version: ARCHETYPE_CATALOG_VERSION,
    lover_definition: def,
    compact_prompt_record: loverBlock.trim(),
    present_in_injected_catalog: /id=lover\b/.test(injected),
  };
}

export function buildPromptHashes(fixture: PatchFFixture): {
  system_prompt: string;
  user_prompt: string;
  system_prompt_hash: string;
  user_prompt_hash: string;
  catalog_hash: string;
  schema_hash: string;
  dream_hash: string;
} {
  const system_prompt = buildDreamExtractionSystemPrompt();
  const target = resolveDreamOutputLanguage(fixture.dream, fixture.dream_language);
  const user_prompt = buildDreamExtractionUserPrompt({
    title: fixture.id,
    date: '2026-07-27',
    content: fixture.dream,
    finalInterpretation: null,
    debugInterpretiveEchoes: false,
    dreamLanguage: fixture.dream_language,
    targetOutputLanguage: target,
  });
  const catalog = formatArchetypeCatalogForPromptV1();
  const schema = JSON.stringify(buildDreamExtractionResponseFormat());
  return {
    system_prompt,
    user_prompt,
    system_prompt_hash: sha16(system_prompt),
    user_prompt_hash: sha16(user_prompt),
    catalog_hash: sha16(catalog),
    schema_hash: sha16(schema),
    dream_hash: dreamHash(fixture.dream),
  };
}

function toGlobalFixture(fixture: PatchFFixture): GlobalArchetypeFixture {
  return {
    id: fixture.id,
    category: fixture.polarity === 'positive' ? 'single_primary' : 'contrast_negative',
    evaluation_style: 'naturalistic',
    dream_language: fixture.dream_language,
    dream: fixture.dream,
    expected: {
      required_archetype_ids: fixture.required_archetype_ids,
      acceptable_secondary_ids: fixture.acceptable_secondary_ids,
      forbidden_archetype_ids: [],
      expected_cardinality: {
        min: fixture.polarity === 'positive' ? 1 : 0,
        max: fixture.polarity === 'positive' ? 2 : 0,
      },
    },
  };
}

function rowFromExtract(params: {
  runId: string;
  fixture: PatchFFixture;
  hashes: ReturnType<typeof buildPromptHashes>;
  extract: GlobalArchetypeExtractResult;
}): PatchFRunRow {
  const base = {
    run_id: params.runId,
    fixture_id: params.fixture.id,
    phase: params.fixture.phase,
    polarity: params.fixture.polarity,
    required_archetype_ids: params.fixture.required_archetype_ids,
    acceptable_secondary_ids: params.fixture.acceptable_secondary_ids,
    dream_hash: params.hashes.dream_hash,
    system_prompt_hash: params.hashes.system_prompt_hash,
    user_prompt_hash: params.hashes.user_prompt_hash,
    catalog_hash: params.hashes.catalog_hash,
    schema_hash: params.hashes.schema_hash,
    prompt_version: DREAM_EXTRACTION_PROMPT_VERSION,
    catalog_version: ARCHETYPE_CATALOG_VERSION,
    schema_version: DREAM_EXTRACTION_SCHEMA_VERSION,
    temperature: DREAM_EXTRACTION_TEMPERATURE,
  };

  if (!params.extract.ok) {
    return {
      ...base,
      ok: false,
      error: params.extract.error,
      model: params.extract.model,
      latency_ms: params.extract.latency_ms,
      raw_archetype_ids: [],
      post_archetype_ids: [],
      raw_candidate_count: 0,
      post_candidate_count: 0,
      empty: true,
      confidence_by_post_id: {},
      mechanism_tags_by_raw_id: {},
      evidence_ids_by_raw_id: {},
    };
  }

  const rawIds = params.extract.rawArchetypes
    .map(readArchetypeId)
    .filter((id): id is string => Boolean(id));
  const post = params.extract.stages.post_validation_archetypes;
  const postIds = post.map((e) => e.archetype_id).filter((id): id is string => Boolean(id));
  const mechanism_tags_by_raw_id: Record<string, string[]> = {};
  const evidence_ids_by_raw_id: Record<string, string[]> = {};
  for (const row of params.extract.rawArchetypes) {
    const id = readArchetypeId(row);
    if (!id) continue;
    mechanism_tags_by_raw_id[id] = readMechanismTags(row);
    evidence_ids_by_raw_id[id] = readEvidenceIds(row);
  }
  const confidence_by_post_id: Record<string, string | null> = {};
  for (const echo of post) {
    if (!echo.archetype_id) continue;
    confidence_by_post_id[echo.archetype_id] = echo.confidence ?? readConfidence(echo);
  }

  return {
    ...base,
    ok: true,
    model: params.extract.model,
    latency_ms: params.extract.latency_ms,
    raw_archetype_ids: rawIds,
    post_archetype_ids: postIds,
    raw_candidate_count: rawIds.length,
    post_candidate_count: postIds.length,
    empty: postIds.length === 0,
    confidence_by_post_id,
    mechanism_tags_by_raw_id,
    evidence_ids_by_raw_id,
  };
}

async function authToken(): Promise<{ anon: string; endpoint: string; token: string }> {
  const supabaseUrl = getEnv(['EXPO_PUBLIC_SUPABASE_URL']).replace(/\/$/, '');
  const anon = getEnv(['EXPO_PUBLIC_SUPABASE_ANON_KEY']);
  const endpoint = getEnv(['EXPO_PUBLIC_CUSTOM_GPT_ENDPOINT']);
  let token = getEnv(['LIVE_SUPABASE_ACCESS_TOKEN']);
  if (!token) {
    const email = getEnv(['LIVE_SUPABASE_EMAIL']);
    const password = getEnv(['LIVE_SUPABASE_PASSWORD']);
    const res = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: anon },
      body: JSON.stringify({ email, password }),
    });
    const text = await res.text();
    if (!res.ok) throw new Error(`auth ${res.status}: ${text.slice(0, 300)}`);
    token = (JSON.parse(text) as { access_token?: string }).access_token || '';
  }
  if (!endpoint || !anon || !token) {
    throw new Error('Missing EXPO_PUBLIC_CUSTOM_GPT_ENDPOINT / anon / token');
  }
  return { anon, endpoint, token };
}

export async function runPatchFStabilitySuite(params?: {
  concurrency?: number;
  phase1Reps?: number;
  phase2Reps?: number;
  outDir?: string;
}): Promise<{ outDir: string; report: PatchFSuiteReport }> {
  const concurrency = Math.max(
    1,
    params?.concurrency ?? Number(process.env.PATCH_F_CONCURRENCY || 8)
  );
  const phase1Reps = params?.phase1Reps ?? 20;
  const phase2Reps = params?.phase2Reps ?? 5;

  validatePatchFFixtures([PATCH_F_PHASE1_FIXTURE, ...PATCH_F_PHASE2_FIXTURES]);

  const outDir =
    params?.outDir ??
    path.join(
      process.cwd(),
      `tmp/patch-f-stability-${new Date().toISOString().replace(/[:.]/g, '-')}`
    );
  mkdirSync(outDir, { recursive: true });

  const loverCatalog = extractCompactLoverCatalogRecord();
  const phase1Hashes = buildPromptHashes(PATCH_F_PHASE1_FIXTURE);
  writeFileSync(
    path.join(outDir, 'catalog_lover_injection_proof.json'),
    JSON.stringify(
      {
        ...loverCatalog,
        phase1_hashes: {
          dream_hash: phase1Hashes.dream_hash,
          system_prompt_hash: phase1Hashes.system_prompt_hash,
          user_prompt_hash: phase1Hashes.user_prompt_hash,
          catalog_hash: phase1Hashes.catalog_hash,
          schema_hash: phase1Hashes.schema_hash,
          prompt_id: DREAM_EXTRACTION_PROMPT_ID,
          prompt_version: DREAM_EXTRACTION_PROMPT_VERSION,
          schema_version: DREAM_EXTRACTION_SCHEMA_VERSION,
          temperature: DREAM_EXTRACTION_TEMPERATURE,
        },
      },
      null,
      2
    )
  );

  const { anon, endpoint, token } = await authToken();

  type Job = { fixture: PatchFFixture; rep: number; runId: string };
  const jobs: Job[] = [];
  for (let i = 1; i <= phase1Reps; i += 1) {
    jobs.push({
      fixture: PATCH_F_PHASE1_FIXTURE,
      rep: i,
      runId: `${PATCH_F_PHASE1_FIXTURE.id}_r${i}`,
    });
  }
  for (const fixture of PATCH_F_PHASE2_FIXTURES) {
    for (let i = 1; i <= phase2Reps; i += 1) {
      jobs.push({ fixture, rep: i, runId: `${fixture.id}_r${i}` });
    }
  }

  const hashCache = new Map<string, ReturnType<typeof buildPromptHashes>>();
  const getHashes = (fixture: PatchFFixture) => {
    const cached = hashCache.get(fixture.id);
    if (cached) return cached;
    const h = buildPromptHashes(fixture);
    hashCache.set(fixture.id, h);
    return h;
  };

  console.log(
    JSON.stringify({
      event: 'patch_f_start',
      jobs: jobs.length,
      concurrency,
      prompt_version: DREAM_EXTRACTION_PROMPT_VERSION,
      catalog_version: ARCHETYPE_CATALOG_VERSION,
    })
  );

  const rows = await mapPool(jobs, concurrency, async (job) => {
    const hashes = getHashes(job.fixture);
    const extract = await extractGlobalArchetypeFixture({
      fixture: toGlobalFixture(job.fixture),
      runId: job.runId,
      endpoint,
      anon,
      token,
      primaryOnly: true,
      disableAnthropicFallback: true,
    });
    const row = rowFromExtract({
      runId: job.runId,
      fixture: job.fixture,
      hashes,
      extract,
    });
    writeFileSync(path.join(outDir, `${job.runId}.json`), JSON.stringify(row, null, 2));
    if (extract.ok) {
      writeFileSync(
        path.join(outDir, `${job.runId}.raw.json`),
        JSON.stringify(
          {
            raw_archetypes: extract.rawArchetypes,
            post_validation_archetypes: extract.stages.post_validation_archetypes,
            model: extract.model,
            output_language: extract.output_language,
          },
          null,
          2
        )
      );
    }
    console.log(
      JSON.stringify({
        event: 'patch_f_run',
        run_id: job.runId,
        ok: row.ok,
        post: row.post_archetype_ids,
        empty: row.empty,
        latency_ms: row.latency_ms,
      })
    );
    return row;
  });

  writeFileSync(path.join(outDir, 'all_runs.json'), JSON.stringify(rows, null, 2));

  const phase1Runs = rows.filter((r) => r.fixture_id === PATCH_F_PHASE1_FIXTURE.id);
  const phase1Ok = phase1Runs.filter((r) => r.ok);
  const phase1Lover = phase1Ok.filter((r) => r.post_archetype_ids.includes('lover')).length;
  const phase1Empty = phase1Ok.filter((r) => r.empty).length;

  const phase2Reports = PATCH_F_PHASE2_FIXTURES.map((fixture) =>
    scoreFixtureRuns(
      fixture,
      rows.filter((r) => r.fixture_id === fixture.id)
    )
  );

  const positives = phase2Reports.filter((r) => r.polarity === 'positive');
  const negatives = phase2Reports.filter((r) => r.polarity === 'negative');
  const positives_ge4 = positives.filter((r) => r.meets_positive_target_ge4).length;
  const positives_below3 = positives.filter((r) => r.meets_positive_floor_ge3 === false).length;
  const negatives_empty_ge4 = negatives.filter((r) => r.meets_negative_empty_ge4).length;

  const report: PatchFSuiteReport = {
    suite_version: PATCH_F_SUITE_VERSION,
    phase1: {
      lover_hit_count: phase1Lover,
      empty_count: phase1Empty,
      reps_ok: phase1Ok.length,
      target_ge4_of_5_scaled: `${phase1Lover}/${phase1Ok.length} (expect ≥80% ≈ ≥16/20)`,
      lover_rate: phase1Ok.length ? phase1Lover / phase1Ok.length : 0,
      meets_expected_reliability_ge4_of_5_equivalent: phase1Ok.length
        ? phase1Lover / phase1Ok.length >= 0.8
        : false,
      runs: phase1Runs,
    },
    phase2_fixtures: phase2Reports,
    phase2_summary: {
      positives_total: positives.length,
      positives_ge4,
      positives_below3,
      negatives_total: negatives.length,
      negatives_empty_ge4,
      broad_precision_note:
        'Negatives scored on emptiness; acceptable_secondary on negatives does not fail empty preference.',
    },
  };

  writeFileSync(path.join(outDir, 'PHASE_F_REPORT.json'), JSON.stringify(report, null, 2));

  const copy = buildReviewerCopyPaste(outDir, report, loverCatalog);
  writeFileSync(path.join(outDir, 'PHASE_F_REVIEWER_COPY_PASTE.txt'), copy);
  writeFileSync(
    path.join(process.cwd(), 'tmp/ONEIROS_V418F_DIAGNOSTIC_REVIEWER_COPY_PASTE.txt'),
    copy
  );

  return { outDir, report };
}

function buildReviewerCopyPaste(
  outDir: string,
  report: PatchFSuiteReport,
  loverCatalog: ReturnType<typeof extractCompactLoverCatalogRecord>
): string {
  const lines: string[] = [];
  lines.push('PATCH F — DIAGNOSTIC ONLY (no production changes)');
  lines.push(`out_dir: ${outDir}`);
  lines.push(`suite: ${report.suite_version}`);
  lines.push(`prompt: ${DREAM_EXTRACTION_PROMPT_VERSION} / catalog ${ARCHETYPE_CATALOG_VERSION}`);
  lines.push('');
  lines.push('## Phase 1 — Greek sea-mattress ×20 (primary-only)');
  lines.push(
    `Lover hits: ${report.phase1.lover_hit_count}/${report.phase1.reps_ok} (empty ${report.phase1.empty_count})`
  );
  lines.push(
    `≥80% reliability equivalent (≥4/5): ${report.phase1.meets_expected_reliability_ge4_of_5_equivalent}`
  );
  lines.push('');
  lines.push('## Lover catalog injection proof (1.7.0)');
  lines.push(`present_in_injected_catalog: ${loverCatalog.present_in_injected_catalog}`);
  lines.push('--- compact_prompt_record ---');
  lines.push(loverCatalog.compact_prompt_record);
  lines.push('--- end ---');
  lines.push('');
  lines.push('## Phase 2 — per fixture (hits / empty / consistency / flips)');
  for (const f of report.phase2_fixtures) {
    lines.push(
      [
        f.fixture_id,
        f.polarity,
        `req_hits=${f.required_label_hit_count === null ? 'N/A' : `${f.required_label_hit_count}/5`}`,
        `empty=${f.empty_count}/5`,
        `repeat_set=${f.repeat_set_consistency}`,
        `gold_exact=${f.gold_exact_match_count}/${f.reps_ok || 5}`,
        `gold_exact_rate=${f.gold_exact_match_rate}`,
        `label_flip=${f.label_flip_rate}`,
        `raw_flip=${f.raw_candidate_flip_rate}`,
        `conf=${JSON.stringify(f.confidence_distribution)}`,
        `ge4=${f.meets_positive_target_ge4}`,
        `ge3=${f.meets_positive_floor_ge3}`,
        `neg_empty_ge4=${f.meets_negative_empty_ge4}`,
      ].join(' | ')
    );
  }
  lines.push('');
  lines.push('## Phase 2 summary');
  lines.push(JSON.stringify(report.phase2_summary, null, 2));
  lines.push('');
  lines.push('## Production status');
  lines.push('No prompt/catalog/gate/heuristic changes applied.');
  lines.push('Candidate global calibration sentence NOT added.');
  return lines.join('\n');
}
