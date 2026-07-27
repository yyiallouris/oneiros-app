/**
 * Reconcile an existing global archetype benchmark dir:
 * - preserve original routing-system metrics
 * - rebuild summary/packet with fixed cost, exact-set, failed-run, model-routing, mixed adjudication
 *
 *   npx tsx scripts/reconcile-global-archetype-benchmark.ts tmp/global-archetype-benchmark-<stamp>
 */
import { copyFileSync, existsSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';
import {
  collectFailedRunsFromDir,
  loadGlobalArchetypeFixtures,
  runRecordToMetricsInput,
  writeGlobalArchetypeBenchmarkArtifacts,
} from './lib/globalArchetypeBenchmarkRunner';
import { scoreGlobalArchetypeRun } from './lib/globalArchetypeBenchmark';
import type { GlobalArchetypeRunRecord } from './lib/globalArchetypeRunRecord';

function rescoreRun(record: GlobalArchetypeRunRecord, fixtureId: string, fixtures: ReturnType<typeof loadGlobalArchetypeFixtures>) {
  const fixture = fixtures.find((f) => f.id === fixtureId);
  if (!fixture) return record;
  return {
    ...record,
    score: scoreGlobalArchetypeRun(fixture, record.post_archetype_ids),
  };
}

function main() {
  const benchDir = process.argv[2];
  if (!benchDir) {
    throw new Error(
      'Usage: npx tsx scripts/reconcile-global-archetype-benchmark.ts <global_archetype_benchmark_dir>'
    );
  }
  const absDir = path.resolve(benchDir);
  const fixtures = loadGlobalArchetypeFixtures();
  const runs = (JSON.parse(
    readFileSync(path.join(absDir, 'global_archetype_runs.json'), 'utf8')
  ) as GlobalArchetypeRunRecord[]).map((record) => rescoreRun(record, record.fixture_id, fixtures));
  const failed = collectFailedRunsFromDir(absDir, fixtures);

  const routingPacketPath = path.join(process.cwd(), 'tmp/ONEIROS_GLOBAL_ARCHETYPE_ROUTING_SYSTEM_PACKET.json');
  const originalReviewer = path.join(process.cwd(), 'tmp/ONEIROS_GLOBAL_ARCHETYPE_REVIEWER_PACKET.json');
  if (existsSync(path.join(absDir, 'reviewer_packet.json'))) {
    copyFileSync(path.join(absDir, 'reviewer_packet.json'), routingPacketPath);
  } else if (existsSync(originalReviewer)) {
    copyFileSync(originalReviewer, routingPacketPath);
  }

  writeGlobalArchetypeBenchmarkArtifacts({
    outDir: absDir,
    fixtures,
    completed: runs,
    failed,
    execution_mode: 'routing_system_inclusive',
  });

  writeFileSync(
    path.join(absDir, 'global_archetype_runs.json'),
    JSON.stringify(runs, null, 2)
  );

  const { execSync } = require('child_process') as typeof import('child_process');
  execSync(`npx --yes tsx scripts/build-global-archetype-reviewer-packet.ts "${absDir}"`, {
    stdio: 'inherit',
    cwd: process.cwd(),
  });

  console.log(
    JSON.stringify(
      {
        reconciled_dir: absDir,
        preserved_routing_packet: routingPacketPath,
        completed_runs: runs.length,
        failed_runs: failed.length,
      },
      null,
      2
    )
  );
}

main();
