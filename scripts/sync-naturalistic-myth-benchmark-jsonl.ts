import { writeFileSync } from 'fs';
import path from 'path';
import { validateNaturalisticMythFixtures } from './lib/naturalisticMythBenchmark';
import { detectNaturalisticMythDatasetLeakage } from './lib/naturalisticMythBenchmarkLeakage';
import {
  NATURALISTIC_MYTH_BENCHMARK_FIXTURES,
  MYTH_NATURALISTIC_CALIBRATION_VERSION,
} from './lib/naturalisticMythBenchmarkFixtures';

function main() {
  validateNaturalisticMythFixtures(NATURALISTIC_MYTH_BENCHMARK_FIXTURES);
  const leakage = detectNaturalisticMythDatasetLeakage(NATURALISTIC_MYTH_BENCHMARK_FIXTURES);

  const jsonOut = path.join(process.cwd(), 'docs/myth-naturalistic-calibration.v1.0.0.json');
  writeFileSync(jsonOut, JSON.stringify(NATURALISTIC_MYTH_BENCHMARK_FIXTURES, null, 2));

  const jsonlOut = path.join(
    process.cwd(),
    'docs/ONEIROS_MYTH_NATURALISTIC_CALIBRATION_BENCHMARK.jsonl'
  );
  writeFileSync(
    jsonlOut,
    `${NATURALISTIC_MYTH_BENCHMARK_FIXTURES.map((row) => JSON.stringify(row)).join('\n')}\n`
  );

  const leakageOut = path.join(
    process.cwd(),
    'docs/ONEIROS_MYTH_NATURALISTIC_CALIBRATION_BENCHMARK_LEAKAGE.json'
  );
  writeFileSync(leakageOut, JSON.stringify(leakage, null, 2));

  console.log(
    JSON.stringify(
      {
        wrote_manifest: jsonOut,
        wrote_jsonl: jsonlOut,
        wrote_leakage: leakageOut,
        dataset_version: MYTH_NATURALISTIC_CALIBRATION_VERSION,
        fixture_count: NATURALISTIC_MYTH_BENCHMARK_FIXTURES.length,
        leakage_fixtures_with_hits: leakage.fixtures_with_hits,
      },
      null,
      2
    )
  );
  if (leakage.fixtures_with_hits > 0) {
    process.exitCode = 1;
  }
}

main();
