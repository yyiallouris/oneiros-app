import { mkdirSync, writeFileSync } from 'fs';
import path from 'path';
import {
  assertFrozenNaturalisticMythBaseline,
  buildNaturalisticMythBenchmarkJobs,
  extractNaturalisticMythFixture,
  loadExistingNaturalisticMythProgress,
  loadNaturalisticMythFixtures,
  MYTH_NATURALISTIC_EXPECTED_MODEL,
  sortNaturalisticMythRunRecords,
  writeNaturalisticMythArtifacts,
} from './lib/naturalisticMythBenchmarkRunner';
import { buildNaturalisticMythRunRecord, type NaturalisticMythFailedRun, type NaturalisticMythRunRecord } from './lib/naturalisticMythRunRecord';
import { mapPool, resolveBenchmarkAuth } from './lib/globalArchetypeBenchmarkRunner';

async function main() {
  assertFrozenNaturalisticMythBaseline();
  const fixtures = loadNaturalisticMythFixtures();
  const outDir =
    process.env.MYTH_BENCHMARK_OUT_DIR?.trim() ||
    path.join(
      process.cwd(),
      `tmp/myth-naturalistic-benchmark-${new Date().toISOString().replace(/[:.]/g, '-')}`
    );
  mkdirSync(outDir, { recursive: true });

  const { anon, endpoint, token } = await resolveBenchmarkAuth();
  const concurrency = Number(process.env.MYTH_BENCHMARK_CONCURRENCY?.trim()) || 2;
  const jobs = buildNaturalisticMythBenchmarkJobs(fixtures);
  const existing = loadExistingNaturalisticMythProgress({
    outDir,
    jobs,
  });

  console.log(
    JSON.stringify(
      {
        phase: 'naturalistic_myth_calibration',
        fixtures: fixtures.length,
        total_runs: jobs.length,
        existing_runs: existing.existingRuns.length,
        remaining_runs: existing.jobsToRun.length,
        retried_failed_artifacts: existing.retriedFailedArtifacts,
        concurrency,
        expected_model: MYTH_NATURALISTIC_EXPECTED_MODEL,
        outDir,
      },
      null,
      2
    )
  );

  const runRecords: NaturalisticMythRunRecord[] = [...existing.existingRuns];
  const failedRuns: NaturalisticMythFailedRun[] = [];

  await mapPool(existing.jobsToRun, concurrency, async (job) => {
    const result = await extractNaturalisticMythFixture({
      fixture: job.fixture,
      run_id: job.run_id,
      repeat_index: job.repeat_index,
      endpoint,
      anon,
      token,
    });

    if (!result.ok) {
      const failed: NaturalisticMythFailedRun = {
        fixture_id: job.fixture.fixture_id,
        repeat_index: job.repeat_index,
        error_type: result.error_type,
        error_message: result.error,
        provider_attempts: result.provider_attempts,
        source_failure_file: `${outDir}/${job.run_id}.json`,
        latency_ms: result.latency_ms,
      };
      failedRuns.push(failed);
      writeFileSync(
        path.join(outDir, `${job.run_id}.json`),
        JSON.stringify(
          {
            ...failed,
            ok: false,
            retry_count: result.retry_count,
          },
          null,
          2
        )
      );
      console.log(`${job.run_id}: FAIL ${result.error_type}`);
      return;
    }

    const record = buildNaturalisticMythRunRecord({
      fixture: job.fixture,
      run_id: job.run_id,
      repeat_index: job.repeat_index,
      outDir,
      model: result.model,
      fallback_used: result.model.startsWith('claude'),
      retry_count: result.retry_count,
      latency_ms: result.latency_ms,
      cost: result.cost,
      language_match: result.output_language.language_match,
      output_language: result.output_language,
      stages: result.stages,
      expectedModel: MYTH_NATURALISTIC_EXPECTED_MODEL,
    });
    runRecords.push(record);

    writeFileSync(
      path.join(outDir, `${job.run_id}.json`),
      JSON.stringify(
        {
          ...record,
          provider_attempts: result.provider_attempts,
          stages: result.stages,
        },
        null,
        2
      )
    );
    writeFileSync(
      path.join(outDir, `${job.run_id}.stages.json`),
      JSON.stringify(result.stages, null, 2)
    );
    console.log(
      `${job.run_id}: pass=${record.contract_pass} model=${record.model} post=${JSON.stringify(record.post_catalog_ids)}`
    );
  });

  const orderedRuns = sortNaturalisticMythRunRecords(runRecords, jobs);
  const { summary } = writeNaturalisticMythArtifacts({
    outDir,
    fixtures,
    runs: orderedRuns,
    failedRuns,
  });

  console.log(
    JSON.stringify(
      {
        outDir,
        packet_valid: summary.packet_valid,
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
