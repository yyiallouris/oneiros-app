/**
 * Write frozen global archetype benchmark JSONL from TypeScript fixtures.
 *
 *   npx tsx scripts/sync-global-archetype-benchmark-jsonl.ts
 */
import { writeFileSync } from 'fs';
import path from 'path';
import { validateGlobalArchetypeFixtures } from './lib/globalArchetypeBenchmark';
import {
  GLOBAL_ARCHETYPE_BENCHMARK_FIXTURES,
  GLOBAL_ARCHETYPE_BENCHMARK_VERSION,
} from './lib/globalArchetypeBenchmarkFixtures';
import { detectGlobalArchetypeDatasetLeakage } from './lib/globalArchetypeBenchmarkLeakage';

function main() {
  validateGlobalArchetypeFixtures(GLOBAL_ARCHETYPE_BENCHMARK_FIXTURES);
  const leakage = detectGlobalArchetypeDatasetLeakage(GLOBAL_ARCHETYPE_BENCHMARK_FIXTURES);
  const out = path.join(process.cwd(), 'docs/ONEIROS_GLOBAL_ARCHETYPE_BENCHMARK.jsonl');
  const lines = GLOBAL_ARCHETYPE_BENCHMARK_FIXTURES.map((row) => JSON.stringify(row));
  writeFileSync(out, `${lines.join('\n')}\n`);
  const leakageReport = path.join(process.cwd(), 'docs/ONEIROS_GLOBAL_ARCHETYPE_BENCHMARK_LEAKAGE.json');
  writeFileSync(leakageReport, JSON.stringify(leakage, null, 2));
  console.log(
    JSON.stringify(
      {
        wrote: out,
        leakage_report: leakageReport,
        version: GLOBAL_ARCHETYPE_BENCHMARK_VERSION,
        count: GLOBAL_ARCHETYPE_BENCHMARK_FIXTURES.length,
        leakage_fixtures_with_hits: leakage.fixtures_with_hits,
        leakage_total_hits: leakage.total_hits,
      },
      null,
      2
    )
  );
  if (leakage.fixtures_with_hits > 0) {
    console.warn(
      `Leakage validator flagged ${leakage.fixtures_with_hits} fixtures — review ${leakageReport} before first run.`
    );
  }
}

main();
