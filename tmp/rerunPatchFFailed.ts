import { readFileSync, writeFileSync } from 'fs';
import path from 'path';
import {
  PATCH_F_PHASE1_FIXTURE,
  PATCH_F_PHASE2_FIXTURES,
  type PatchFFixture,
} from '../scripts/lib/patchFStabilityFixtures';
import {
  buildPromptHashes,
} from '../scripts/lib/patchFStabilityRunner';
import {
  extractGlobalArchetypeFixture,
  getEnv,
  mapPool,
} from '../scripts/lib/globalArchetypeBenchmarkRunner';
import type { GlobalArchetypeFixture } from '../scripts/lib/globalArchetypeBenchmark';
import { scoreFixtureRuns, type PatchFRunRow, type PatchFSuiteReport } from '../scripts/lib/patchFStabilityMetrics';

const OUT = process.argv[2];
if (!OUT) throw new Error('usage: tsx tmp/rerunPatchFFailed.ts <outDir>');

type FrozenRunMetadata = {
  prompt_version: string;
  catalog_version: string;
  schema_version: number;
  temperature: number;
};

type FrozenLoverProof = {
  catalog_version?: string;
  compact_prompt_record: string;
  present_in_injected_catalog: boolean;
};

type FrozenFixtureInventory = Pick<
  PatchFFixture,
  'id' | 'phase' | 'polarity' | 'required_archetype_ids' | 'acceptable_secondary_ids'
>;

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

function readArchetypeId(row: unknown): string {
  if (!row || typeof row !== 'object') return '';
  const id = (row as { archetype_id?: unknown }).archetype_id;
  return typeof id === 'string' ? id.trim() : '';
}

async function auth() {
  const supabaseUrl = getEnv(['EXPO_PUBLIC_SUPABASE_URL']).replace(/\/$/, '');
  const anon = getEnv(['EXPO_PUBLIC_SUPABASE_ANON_KEY']);
  const endpoint = getEnv(['EXPO_PUBLIC_CUSTOM_GPT_ENDPOINT']);
  const email = getEnv(['LIVE_SUPABASE_EMAIL']);
  const password = getEnv(['LIVE_SUPABASE_PASSWORD']);
  const res = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: anon },
    body: JSON.stringify({ email, password }),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(text.slice(0, 300));
  const token = (JSON.parse(text) as { access_token: string }).access_token;
  return { anon, endpoint, token };
}

async function main() {
  const all: PatchFRunRow[] = JSON.parse(readFileSync(path.join(OUT, 'all_runs.json'), 'utf8'));
  const failed = all.filter((r) => !r.ok);
  console.log(JSON.stringify({ event: 'rerun_start', failed: failed.length }));
  const fixtures = new Map<string, PatchFFixture>(
    [PATCH_F_PHASE1_FIXTURE, ...PATCH_F_PHASE2_FIXTURES].map((f) => [f.id, f])
  );
  const frozen = readFrozenRunMetadata(all);
  const loverCatalog = readFrozenLoverProof(OUT);
  const concurrency = Number(process.env.PATCH_F_CONCURRENCY || 4);
  const replacements = failed.length
    ? await (async () => {
        const { anon, endpoint, token } = await auth();
        return mapPool(failed, concurrency, async (old) => {
    const fixture = fixtures.get(old.fixture_id);
    if (!fixture) throw new Error(old.fixture_id);
    const hashes = buildPromptHashes(fixture);
    const extract = await extractGlobalArchetypeFixture({
      fixture: toGlobalFixture(fixture),
      runId: `${old.run_id}_retry`,
      endpoint,
      anon,
      token,
      primaryOnly: true,
      disableAnthropicFallback: true,
      maxAttempts: 10,
    });
    if (!extract.ok) {
      const row: PatchFRunRow = { ...old, ok: false, error: extract.error, latency_ms: extract.latency_ms };
      console.log(JSON.stringify({ event: 'retry_fail', run_id: old.run_id, error: extract.error.slice(0, 80) }));
      return { oldId: old.run_id, row };
    }
    const rawIds = extract.rawArchetypes.map(readArchetypeId).filter(Boolean);
    const post = extract.stages.post_validation_archetypes;
    const postIds = post.map((e) => e.archetype_id).filter(Boolean);
    const mechanism_tags_by_raw_id: Record<string, string[]> = {};
    const evidence_ids_by_raw_id: Record<string, string[]> = {};
    for (const row of extract.rawArchetypes) {
      const id = readArchetypeId(row);
      if (!id) continue;
      const tags = (row as any).mechanism_tags;
      const eids = (row as any).evidence_ids;
      mechanism_tags_by_raw_id[id] = Array.isArray(tags) ? tags.filter((t: unknown) => typeof t === 'string') : [];
      evidence_ids_by_raw_id[id] = Array.isArray(eids) ? eids.filter((t: unknown) => typeof t === 'string') : [];
    }
    const confidence_by_post_id: Record<string, string | null> = {};
    for (const echo of post) confidence_by_post_id[echo.archetype_id] = echo.confidence ?? null;
    const row: PatchFRunRow = {
      ...old,
      ok: true,
      error: undefined,
      model: extract.model,
      latency_ms: extract.latency_ms,
      raw_archetype_ids: rawIds,
      post_archetype_ids: postIds,
      raw_candidate_count: rawIds.length,
      post_candidate_count: postIds.length,
      empty: postIds.length === 0,
      confidence_by_post_id,
      mechanism_tags_by_raw_id,
      evidence_ids_by_raw_id,
      dream_hash: hashes.dream_hash,
      system_prompt_hash: hashes.system_prompt_hash,
      user_prompt_hash: hashes.user_prompt_hash,
      catalog_hash: hashes.catalog_hash,
      schema_hash: hashes.schema_hash,
    };
    writeFileSync(path.join(OUT, `${old.run_id}.json`), JSON.stringify(row, null, 2));
    console.log(JSON.stringify({ event: 'retry_ok', run_id: old.run_id, post: postIds, empty: row.empty }));
    return { oldId: old.run_id, row };
        });
      })()
    : [];

  const byId = new Map(all.map((r) => [r.run_id, r]));
  for (const r of replacements) byId.set(r.oldId, r.row);
  const merged = [...byId.values()];
  writeFileSync(path.join(OUT, 'all_runs.json'), JSON.stringify(merged, null, 2));
  writeFileSync(path.join(OUT, 'retry_manifest.json'), JSON.stringify({ replaced: replacements.length, still_failed: merged.filter(r=>!r.ok).length }, null, 2));

  const phase1Runs = merged.filter((r) => r.fixture_id === PATCH_F_PHASE1_FIXTURE.id);
  const phase1Ok = phase1Runs.filter((r) => r.ok);
  const phase1Lover = phase1Ok.filter((r) => r.post_archetype_ids.includes('lover')).length;
  const phase1Empty = phase1Ok.filter((r) => r.empty).length;
  const phase2Fixtures = deriveFrozenPhase2Fixtures(merged);
  const phase2Reports = phase2Fixtures.map((fixture) =>
    scoreFixtureRuns(fixture, merged.filter((r) => r.fixture_id === fixture.id))
  );
  const positives = phase2Reports.filter((r) => r.polarity === 'positive');
  const negatives = phase2Reports.filter((r) => r.polarity === 'negative');
  const report: PatchFSuiteReport = {
    suite_version: 'patch-f-stability.v1.0.0',
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
      positives_ge4: positives.filter((r) => r.meets_positive_target_ge4).length,
      positives_below3: positives.filter((r) => r.meets_positive_floor_ge3 === false).length,
      negatives_total: negatives.length,
      negatives_empty_ge4: negatives.filter((r) => r.meets_negative_empty_ge4).length,
      broad_precision_note:
        'Negatives scored on emptiness; acceptable_secondary on negatives does not fail empty preference. Report includes 429 retries.',
    },
  };
  writeFileSync(path.join(OUT, 'PHASE_F_REPORT.json'), JSON.stringify(report, null, 2));
  const lines = [
    'PATCH F — DIAGNOSTIC ONLY (no production changes)',
    `out_dir: ${OUT}`,
    `prompt: ${frozen.prompt_version} / catalog ${frozen.catalog_version}`,
    `schema: ${frozen.schema_version} / temperature ${frozen.temperature}`,
    '',
    '## Phase 1 — Greek sea-mattress ×20 (primary-only)',
    `Lover hits: ${report.phase1.lover_hit_count}/${report.phase1.reps_ok} (empty ${report.phase1.empty_count})`,
    `≥80% reliability: ${report.phase1.meets_expected_reliability_ge4_of_5_equivalent}`,
    '',
    '## Lover catalog injection proof',
    `present: ${loverCatalog.present_in_injected_catalog}`,
    loverCatalog.compact_prompt_record,
    '',
    '## Phase 2 per fixture',
    ...phase2Reports.map((f) =>
      [
        f.fixture_id,
        f.polarity,
        `hits=${f.required_label_hit_count === null ? 'N/A' : `${f.required_label_hit_count}/5`}`,
        `empty=${f.empty_count}/5`,
        `ok=${f.reps_ok}`,
        `fail=${f.reps_failed}`,
        `repeat_set=${f.repeat_set_consistency}`,
        `gold_exact=${f.gold_exact_match_count}/${f.reps_ok || 5}`,
        `gold_exact_rate=${f.gold_exact_match_rate}`,
        `flip=${f.label_flip_rate}`,
        `raw_flip=${f.raw_candidate_flip_rate}`,
        `conf=${JSON.stringify(f.confidence_distribution)}`,
        `ge4=${f.meets_positive_target_ge4}`,
        `ge3=${f.meets_positive_floor_ge3}`,
        `neg_empty_ge4=${f.meets_negative_empty_ge4}`,
      ].join(' | ')
    ),
    '',
    '## Phase 2 summary',
    JSON.stringify(report.phase2_summary, null, 2),
    '',
    'No production changes. Candidate calibration NOT added.',
  ];
  const copy = lines.join('\n');
  writeFileSync(path.join(OUT, 'PHASE_F_REVIEWER_COPY_PASTE.txt'), copy);
  writeFileSync(path.join(process.cwd(), 'tmp/ONEIROS_V418F_DIAGNOSTIC_REVIEWER_COPY_PASTE.txt'), copy);
  console.log(JSON.stringify({ phase1: report.phase1, phase2_summary: report.phase2_summary, still_failed: merged.filter(r=>!r.ok).length }, null, 2));
}

function readFrozenRunMetadata(rows: PatchFRunRow[]): FrozenRunMetadata {
  if (rows.length === 0) throw new Error('No Patch F runs found');
  const first = rows[0];
  const allPromptVersions = new Set(rows.map((row) => row.prompt_version));
  const allCatalogVersions = new Set(rows.map((row) => row.catalog_version));
  const allSchemaVersions = new Set(rows.map((row) => row.schema_version));
  const allTemperatures = new Set(rows.map((row) => row.temperature));
  if (
    allPromptVersions.size !== 1 ||
    allCatalogVersions.size !== 1 ||
    allSchemaVersions.size !== 1 ||
    allTemperatures.size !== 1
  ) {
    throw new Error('Patch F outDir contains mixed frozen metadata; refusing to regenerate reviewer packet');
  }
  return {
    prompt_version: first.prompt_version,
    catalog_version: first.catalog_version,
    schema_version: first.schema_version,
    temperature: first.temperature,
  };
}

function readFrozenLoverProof(outDir: string): FrozenLoverProof {
  const proofPath = path.join(outDir, 'catalog_lover_injection_proof.json');
  return JSON.parse(readFileSync(proofPath, 'utf8')) as FrozenLoverProof;
}

function deriveFrozenPhase2Fixtures(rows: PatchFRunRow[]): PatchFFixture[] {
  const byFixture = new Map<string, FrozenFixtureInventory>();
  for (const row of rows) {
    if (row.phase !== 2) continue;
    const existing = byFixture.get(row.fixture_id);
    const next: FrozenFixtureInventory = {
      id: row.fixture_id,
      phase: row.phase,
      polarity: row.polarity,
      required_archetype_ids: row.required_archetype_ids,
      acceptable_secondary_ids: row.acceptable_secondary_ids,
    };
    if (!existing) {
      byFixture.set(row.fixture_id, next);
      continue;
    }
    if (
      existing.polarity !== next.polarity ||
      JSON.stringify(existing.required_archetype_ids) !== JSON.stringify(next.required_archetype_ids) ||
      JSON.stringify(existing.acceptable_secondary_ids) !== JSON.stringify(next.acceptable_secondary_ids)
    ) {
      throw new Error(`Inconsistent frozen fixture metadata for ${row.fixture_id}`);
    }
  }
  return [...byFixture.values()]
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((fixture) => ({
      ...fixture,
      dream_language: 'en',
      dream: '',
      notes: 'Derived from frozen Patch F run inventory.',
    }));
}

main().catch((e) => { console.error(e); process.exit(1); });
