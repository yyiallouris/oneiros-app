/**
 * Rerun failed fixtures in an incomplete benchmark dir and merge results.
 *
 *   npx tsx scripts/rerun-global-archetype-failed.ts tmp/global-archetype-benchmark-<stamp>
 */
import { readFileSync, writeFileSync } from 'fs';
import path from 'path';
import {
  assertFrozenGlobalArchetypeBaseline,
  buildFailedRunRecord,
  extractGlobalArchetypeFixture,
  loadGlobalArchetypeFixtures,
  resolveBenchmarkAuth,
  writeGlobalArchetypeBenchmarkArtifacts,
} from './lib/globalArchetypeBenchmarkRunner';
import { buildGlobalArchetypeRunRecord, type GlobalArchetypeFailedRun, type GlobalArchetypeRunRecord } from './lib/globalArchetypeRunRecord';

async function main() {
  assertFrozenGlobalArchetypeBaseline();
  const outDir = path.resolve(process.argv[2] ?? '');
  if (!outDir) {
    throw new Error('Usage: npx tsx scripts/rerun-global-archetype-failed.ts <benchmark_dir>');
  }

  const fixtures = loadGlobalArchetypeFixtures();
  const fixtureById = new Map(fixtures.map((f) => [f.id, f]));
  const existing = JSON.parse(
    readFileSync(path.join(outDir, 'global_archetype_runs.json'), 'utf8')
  ) as GlobalArchetypeRunRecord[];
  const failed = JSON.parse(
    readFileSync(path.join(outDir, 'failed_runs.json'), 'utf8')
  ) as GlobalArchetypeFailedRun[];

  const { anon, endpoint, token } = await resolveBenchmarkAuth();
  const merged = new Map(existing.map((r) => [r.fixture_id, r]));
  const remainingFailed: GlobalArchetypeFailedRun[] = [];

  for (const fail of failed) {
    const fixture = fixtureById.get(fail.fixture_id);
    if (!fixture) continue;
    const runId = fail.run_id;
    const result = await extractGlobalArchetypeFixture({
      fixture,
      runId,
      endpoint,
      anon,
      token,
      primaryOnly: true,
      disableAnthropicFallback: true,
      maxAttempts: 8,
    });

    if (!result.ok) {
      remainingFailed.push(buildFailedRunRecord({ runId, fixtureId: fixture.id, outDir, result }));
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
    merged.set(fixture.id, record);
    writeFileSync(
      path.join(outDir, `${runId}.json`),
      JSON.stringify({ ...record, stages: result.stages, provider_attempts: result.provider_attempts }, null, 2)
    );
    writeFileSync(path.join(outDir, `${runId}.stages.json`), JSON.stringify(result.stages, null, 2));
    console.log(`${runId}: pass=${record.score.contract_pass} model=${record.model}`);
  }

  const completed = fixtures
    .map((f) => merged.get(f.id))
    .filter((r): r is GlobalArchetypeRunRecord => r != null);

  writeGlobalArchetypeBenchmarkArtifacts({
    outDir,
    fixtures,
    completed,
    failed: remainingFailed,
    execution_mode: 'primary_only',
  });

  const { execSync } = await import('child_process');
  execSync(`npx --yes tsx scripts/build-global-archetype-reviewer-packet.ts "${outDir}"`, {
    stdio: 'inherit',
    cwd: process.cwd(),
  });

  console.log(JSON.stringify({ completed: completed.length, failed: remainingFailed.length }, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
