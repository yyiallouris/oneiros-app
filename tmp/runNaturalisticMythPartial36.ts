import { mkdirSync, writeFileSync } from 'fs';
import path from 'path';
import {
  assertFrozenNaturalisticMythBaseline,
  extractNaturalisticMythFixture,
  loadNaturalisticMythFixtures,
  writeNaturalisticMythArtifacts,
} from '../scripts/lib/naturalisticMythBenchmarkRunner';
import {
  buildNaturalisticMythRunRecord,
  type NaturalisticMythFailedRun,
  type NaturalisticMythRunRecord,
} from '../scripts/lib/naturalisticMythRunRecord';
import { mapPool, resolveBenchmarkAuth } from '../scripts/lib/globalArchetypeBenchmarkRunner';

const EXPECTED_MODEL = 'gpt-5.4-mini-2026-03-17' as const;

async function main() {
  assertFrozenNaturalisticMythBaseline();
  const allFixtures = loadNaturalisticMythFixtures();
  const selectedIds = [
    'SP_fisherman_vessel_threat_en',
    'SP_orpheus_retrieval_el',
    'SP_sisyphus_restart_en',
    'SP_inanna_gates_el',
    'IP_fisherman_without_reseal_en',
    'IP_orpheus_before_turn_en',
    'IP_sisyphus_restart_el',
    'TN_descent_without_structure_en',
    'TN_repetition_without_reset_en',
    'TN_container_without_captive_en',
    'CP_fisherman_magic_object_en',
    'CP_orpheus_descent_competitors_en',
  ] as const;

  const fixtures = selectedIds.map((id) => {
    const fixture = allFixtures.find((row) => row.fixture_id === id);
    if (!fixture) throw new Error(`Missing fixture ${id}`);
    return fixture;
  });

  const outDir = path.join(
    process.cwd(),
    `tmp/myth-naturalistic-benchmark-partial-36-${new Date().toISOString().replace(/[:.]/g, '-')}`
  );
  mkdirSync(outDir, { recursive: true });

  const { anon, endpoint, token } = await resolveBenchmarkAuth();
  const jobs = fixtures.flatMap((fixture) =>
    ([1, 2, 3] as const).map((repeat_index) => ({
      fixture,
      repeat_index,
      run_id: `${fixture.fixture_id}_r${repeat_index}`,
    }))
  );

  const runRecords: NaturalisticMythRunRecord[] = [];
  const failedRuns: NaturalisticMythFailedRun[] = [];

  console.log(
    JSON.stringify(
      {
        phase: 'naturalistic_myth_calibration_partial',
        selected_fixture_count: fixtures.length,
        total_runs: jobs.length,
        concurrency: 10,
        expected_model: EXPECTED_MODEL,
        outDir,
        selected_ids: selectedIds,
      },
      null,
      2
    )
  );

  await mapPool(jobs, 10, async (job) => {
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
        JSON.stringify({ ...failed, ok: false, retry_count: result.retry_count }, null, 2)
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
      expectedModel: EXPECTED_MODEL,
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

  writeFileSync(path.join(outDir, 'selected_fixture_ids.json'), JSON.stringify(selectedIds, null, 2));
  const { summary } = writeNaturalisticMythArtifacts({
    outDir,
    fixtures,
    runs: runRecords,
    failedRuns,
  });

  console.log(
    JSON.stringify(
      {
        outDir,
        packet_valid: summary.packet_valid,
        packet_complete: summary.packet_complete,
        packet_reconciled: summary.packet_reconciled,
        completed_runs: summary.completed_runs,
        failed_runs: summary.failed_runs,
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
