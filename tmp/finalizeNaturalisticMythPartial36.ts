import { readFileSync, writeFileSync } from 'fs';
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
import { resolveBenchmarkAuth } from '../scripts/lib/globalArchetypeBenchmarkRunner';

const EXPECTED_MODEL = 'gpt-5.4-mini-2026-03-17' as const;
const SELECTED_IDS = [
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

function expectedRunIds(): Array<{ fixture_id: string; repeat_index: 1 | 2 | 3; run_id: string }> {
  return SELECTED_IDS.flatMap((fixture_id) =>
    ([1, 2, 3] as const).map((repeat_index) => ({
      fixture_id,
      repeat_index,
      run_id: `${fixture_id}_r${repeat_index}`,
    }))
  );
}

async function main() {
  assertFrozenNaturalisticMythBaseline();
  const outDir = process.env.MYTH_PARTIAL_OUT_DIR?.trim();
  if (!outDir) {
    throw new Error('MYTH_PARTIAL_OUT_DIR is required');
  }

  const allFixtures = loadNaturalisticMythFixtures();
  const fixtures = SELECTED_IDS.map((id) => {
    const fixture = allFixtures.find((row) => row.fixture_id === id);
    if (!fixture) throw new Error(`Missing fixture ${id}`);
    return fixture;
  });

  const completedRuns: NaturalisticMythRunRecord[] = [];
  for (const run of expectedRunIds()) {
    const file = path.join(outDir, `${run.run_id}.json`);
    try {
      const parsed = JSON.parse(readFileSync(file, 'utf8')) as NaturalisticMythRunRecord & { ok?: boolean };
      if (parsed && parsed.run_id && parsed.ok !== false) {
        completedRuns.push(parsed);
      }
    } catch {
      // ignore missing files
    }
  }

  const completedIds = new Set(completedRuns.map((run) => run.run_id));
  const missing = expectedRunIds().filter((run) => !completedIds.has(run.run_id));
  const failedRuns: NaturalisticMythFailedRun[] = [];

  if (missing.length > 0) {
    const { anon, endpoint, token } = await resolveBenchmarkAuth();
    for (const job of missing) {
      const fixture = fixtures.find((row) => row.fixture_id === job.fixture_id)!;
      const result = await extractNaturalisticMythFixture({
        fixture,
        run_id: job.run_id,
        repeat_index: job.repeat_index,
        endpoint,
        anon,
        token,
      });

      if (!result.ok) {
        const failed: NaturalisticMythFailedRun = {
          fixture_id: job.fixture_id,
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
        continue;
      }

      const record = buildNaturalisticMythRunRecord({
        fixture,
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
      completedRuns.push(record);
      writeFileSync(
        path.join(outDir, `${job.run_id}.json`),
        JSON.stringify({ ...record, provider_attempts: result.provider_attempts, stages: result.stages }, null, 2)
      );
      writeFileSync(path.join(outDir, `${job.run_id}.stages.json`), JSON.stringify(result.stages, null, 2));
    }
  }

  completedRuns.sort((a, b) => a.run_id.localeCompare(b.run_id));
  const { summary } = writeNaturalisticMythArtifacts({
    outDir,
    fixtures,
    runs: completedRuns,
    failedRuns,
  });

  console.log(
    JSON.stringify(
      {
        outDir,
        missing_replayed: missing.map((job) => job.run_id),
        completed_runs: summary.completed_runs,
        failed_runs: summary.failed_runs,
        packet_valid: summary.packet_valid,
        packet_complete: summary.packet_complete,
        packet_reconciled: summary.packet_reconciled,
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
