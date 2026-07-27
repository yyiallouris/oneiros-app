/**
 * Global archetype evaluation benchmark — full catalog, one run per frozen fixture.
 *
 * Source: docs/ONEIROS_GLOBAL_ARCHETYPE_BENCHMARK.jsonl
 * Spec:   docs/ONEIROS_GLOBAL_ARCHETYPE_BENCHMARK.md
 */
import { mkdirSync, writeFileSync } from 'fs';
import path from 'path';
import {
  assertFrozenGlobalArchetypeBaseline,
  buildFailedRunRecord,
  extractGlobalArchetypeFixture,
  loadGlobalArchetypeFixtures,
  mapPool,
  resolveBenchmarkAuth,
  writeGlobalArchetypeBenchmarkArtifacts,
} from './lib/globalArchetypeBenchmarkRunner';
import { GLOBAL_ARCHETYPE_BENCHMARK_VERSION } from './lib/globalArchetypeBenchmarkFixtures';
import { buildGlobalArchetypeRunRecord, type GlobalArchetypeFailedRun, type GlobalArchetypeRunRecord } from './lib/globalArchetypeRunRecord';
import { DREAM_EXTRACTION_PROMPT_VERSION } from '../src/ai/dreamExtractionPrompt';

async function main() {
  assertFrozenGlobalArchetypeBaseline();
  const fixtures = loadGlobalArchetypeFixtures();
  const primaryOnly = process.env.GLOBAL_BENCHMARK_PRIMARY_ONLY === '1';
  const outDir =
    process.env.GLOBAL_BENCHMARK_OUT_DIR?.trim() ||
    path.join(
      process.cwd(),
      `tmp/global-archetype-benchmark-${new Date().toISOString().replace(/[:.]/g, '-')}`
    );
  mkdirSync(outDir, { recursive: true });

  const { anon, endpoint, token } = await resolveBenchmarkAuth();
  const concurrency =
    Number(process.env.GLOBAL_BENCHMARK_CONCURRENCY?.trim()) ||
    Number(process.env.ACCEPTANCE_CONCURRENCY?.trim()) ||
    2;

  console.log(
    JSON.stringify(
      {
        phase: 'global_archetype_benchmark',
        fixtures: fixtures.length,
        concurrency,
        primary_only: primaryOnly,
        outDir,
        prompt_version: DREAM_EXTRACTION_PROMPT_VERSION,
        dataset_version: GLOBAL_ARCHETYPE_BENCHMARK_VERSION,
      },
      null,
      2
    )
  );

  const runRecords: GlobalArchetypeRunRecord[] = [];
  const failedRecords: GlobalArchetypeFailedRun[] = [];

  await mapPool(fixtures, concurrency, async (fixture) => {
    const runId = `${fixture.id}_r1`;
    const result = await extractGlobalArchetypeFixture({
      fixture,
      runId,
      endpoint,
      anon,
      token,
      primaryOnly,
      disableAnthropicFallback: primaryOnly,
    });

    if (!result.ok) {
      const failRecord = {
        run_id: runId,
        fixture_id: fixture.id,
        ok: false,
        error: result.error,
        error_type: result.error_type,
        provider_attempts: result.provider_attempts,
        latency_ms: result.latency_ms,
        fixture,
      };
      failedRecords.push(
        buildFailedRunRecord({ runId, fixtureId: fixture.id, outDir, result })
      );
      writeFileSync(path.join(outDir, `${runId}.json`), JSON.stringify(failRecord, null, 2));
      console.log(`${runId}: FAIL ${result.error_type}`);
      return;
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

    runRecords.push(record);

    const payload = {
      ...record,
      schema_errors: result.schema_errors,
      stages: result.stages,
      provider_attempts: result.provider_attempts,
    };
    writeFileSync(path.join(outDir, `${runId}.json`), JSON.stringify(payload, null, 2));
    writeFileSync(
      path.join(outDir, `${runId}.stages.json`),
      JSON.stringify(result.stages, null, 2)
    );
    console.log(
      `${runId}: pass=${record.score.contract_pass} model=${record.model} post=${JSON.stringify(record.post_archetype_ids)}`
    );
  });

  const summary = writeGlobalArchetypeBenchmarkArtifacts({
    outDir,
    fixtures,
    completed: runRecords,
    failed: failedRecords,
    execution_mode: primaryOnly ? 'primary_only' : 'routing_system_inclusive',
  });

  const { execSync } = await import('child_process');
  execSync(`npx --yes tsx scripts/build-global-archetype-reviewer-packet.ts "${outDir}"`, {
    stdio: 'inherit',
    cwd: process.cwd(),
  });

  console.log(
    JSON.stringify(
      {
        outDir,
        packet_complete: summary.packet_complete,
        contract_pass_rate: summary.metrics.contract_pass_rate,
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
