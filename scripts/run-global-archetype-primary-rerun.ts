/**
 * Primary-only rerun for fallback/missing fixtures, merged with existing primary runs.
 *
 *   npx tsx scripts/run-global-archetype-primary-rerun.ts tmp/global-archetype-benchmark-<stamp>
 */
import { mkdirSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';
import {
  assertFrozenGlobalArchetypeBaseline,
  buildFailedRunRecord,
  extractGlobalArchetypeFixture,
  loadGlobalArchetypeFixtures,
  resolveBenchmarkAuth,
  writeGlobalArchetypeBenchmarkArtifacts,
} from './lib/globalArchetypeBenchmarkRunner';
import { isFallbackArchetypeBenchmarkModel, isPrimaryArchetypeBenchmarkModel } from './lib/globalArchetypeModelRouting';
import { buildGlobalArchetypeRunRecord, type GlobalArchetypeFailedRun, type GlobalArchetypeRunRecord } from './lib/globalArchetypeRunRecord';
import { dreamHash } from './lib/globalArchetypeBenchmark';

async function main() {
  assertFrozenGlobalArchetypeBaseline();
  const sourceDir = process.argv[2];
  if (!sourceDir) {
    throw new Error('Usage: npx tsx scripts/run-global-archetype-primary-rerun.ts <source_benchmark_dir>');
  }
  const absSource = path.resolve(sourceDir);
  const fixtures = loadGlobalArchetypeFixtures();
  const sourceRuns = JSON.parse(
    readFileSync(path.join(absSource, 'global_archetype_runs.json'), 'utf8')
  ) as GlobalArchetypeRunRecord[];

  const fixtureById = new Map(fixtures.map((f) => [f.id, f]));
  const primaryKept = sourceRuns.filter((run) => {
    const fixture = fixtureById.get(run.fixture_id);
    if (!fixture) return false;
    return (
      isPrimaryArchetypeBenchmarkModel(run.model) &&
      run.prompt_version === '4.1.9-M1' &&
      run.dream_hash === dreamHash(fixture.dream)
    );
  });

  const rerunFixtures = fixtures.filter((fixture) => {
    const existing = sourceRuns.find((r) => r.fixture_id === fixture.id);
    if (!existing) return true;
    return isFallbackArchetypeBenchmarkModel(existing.model);
  });

  const outDir =
    process.env.GLOBAL_BENCHMARK_OUT_DIR?.trim() ||
    path.join(
      process.cwd(),
      `tmp/global-archetype-primary-rerun-${new Date().toISOString().replace(/[:.]/g, '-')}`
    );
  mkdirSync(outDir, { recursive: true });

  const { anon, endpoint, token } = await resolveBenchmarkAuth();
  const concurrency = Number(process.env.GLOBAL_BENCHMARK_CONCURRENCY?.trim()) || 2;

  console.log(
    JSON.stringify(
      {
        phase: 'global_archetype_primary_rerun',
        source_dir: absSource,
        kept_primary_runs: primaryKept.length,
        rerun_fixtures: rerunFixtures.length,
        concurrency,
        outDir,
      },
      null,
      2
    )
  );

  const rerunRecords: GlobalArchetypeRunRecord[] = [];
  const failedRecords: GlobalArchetypeFailedRun[] = [];

  for (const fixture of rerunFixtures) {
    const runId = `${fixture.id}_r1`;
    const result = await extractGlobalArchetypeFixture({
      fixture,
      runId,
      endpoint,
      anon,
      token,
      primaryOnly: true,
      disableAnthropicFallback: true,
    });

    if (!result.ok) {
      failedRecords.push(buildFailedRunRecord({ runId, fixtureId: fixture.id, outDir, result }));
      writeFileSync(
        path.join(outDir, `${runId}.json`),
        JSON.stringify(
          {
            run_id: runId,
            fixture_id: fixture.id,
            ok: false,
            error: result.error,
            error_type: result.error_type,
            provider_attempts: result.provider_attempts,
            latency_ms: result.latency_ms,
            fixture,
          },
          null,
          2
        )
      );
      console.log(`${runId}: FAIL ${result.error_type}`);
      continue;
    }

    const record = buildGlobalArchetypeRunRecord({
      runId,
      fixture,
      outDir,
      stages: result.stages,
      rawArchetypes: result.rawArchetypes,
      model: result.model,
      schemaOk: result.schema_ok,
      proxyOk: true,
      latency_ms: result.latency_ms,
      cost: result.cost,
      output_language: result.output_language,
    });
    rerunRecords.push(record);
    writeFileSync(
      path.join(outDir, `${runId}.json`),
      JSON.stringify({ ...record, stages: result.stages, provider_attempts: result.provider_attempts }, null, 2)
    );
    console.log(`${runId}: pass=${record.score.contract_pass} model=${record.model}`);
  }

  const mergedByFixture = new Map<string, GlobalArchetypeRunRecord>();
  for (const run of primaryKept) mergedByFixture.set(run.fixture_id, run);
  for (const run of rerunRecords) mergedByFixture.set(run.fixture_id, run);
  const merged = fixtures
    .map((fixture) => mergedByFixture.get(fixture.id))
    .filter((run): run is GlobalArchetypeRunRecord => run != null);

  writeGlobalArchetypeBenchmarkArtifacts({
    outDir,
    fixtures,
    completed: merged,
    failed: failedRecords,
    execution_mode: 'reconciled_primary_only',
    source_routing_out_dir: absSource,
  });

  const { execSync } = await import('child_process');
  execSync(`npx --yes tsx scripts/build-global-archetype-reviewer-packet.ts "${outDir}"`, {
    stdio: 'inherit',
    cwd: process.cwd(),
  });

  writeFileSync(
    path.join(outDir, 'merge_manifest.json'),
    JSON.stringify(
      {
        source_routing_out_dir: absSource,
        kept_primary_fixture_ids: primaryKept.map((r) => r.fixture_id).sort(),
        rerun_fixture_ids: rerunFixtures.map((f) => f.id).sort(),
        merged_completed_runs: merged.length,
        failed_runs: failedRecords.length,
      },
      null,
      2
    )
  );

  console.log(
    JSON.stringify(
      {
        outDir,
        merged_runs: merged.length,
        failed_runs: failedRecords.length,
      },
      null,
      2
    )
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
