import { readFileSync, writeFileSync } from 'fs';
import path from 'path';
import {
  buildNaturalisticMythCopyPaste,
  buildNaturalisticMythReviewerPacket,
  loadNaturalisticMythFixtures,
} from './lib/naturalisticMythBenchmarkRunner';
import type { NaturalisticMythFailedRun, NaturalisticMythRunRecord } from './lib/naturalisticMythRunRecord';

function readJson<T>(file: string): T {
  return JSON.parse(readFileSync(file, 'utf8')) as T;
}

function main() {
  const benchDir = process.argv[2];
  if (!benchDir) {
    throw new Error(
      'Usage: npx tsx scripts/build-naturalistic-myth-reviewer-packet.ts <benchmark_dir>'
    );
  }

  const absDir = path.resolve(benchDir);
  const fixtures = loadNaturalisticMythFixtures();
  const runs = readJson<NaturalisticMythRunRecord[]>(path.join(absDir, 'acceptance_runs.json'));
  let failedRuns: NaturalisticMythFailedRun[] = [];
  try {
    failedRuns = readJson<NaturalisticMythFailedRun[]>(path.join(absDir, 'failed_runs.json'));
  } catch {
    failedRuns = [];
  }

  const reviewer = buildNaturalisticMythReviewerPacket({
    fixtures,
    runs,
    failedRuns,
    outDir: absDir,
  });
  const outJson = path.join(process.cwd(), 'tmp/ONEIROS_MYTH_NATURALISTIC_V1_REVIEWER_PACKET.json');
  writeFileSync(outJson, JSON.stringify(reviewer, null, 2));
  writeFileSync(path.join(absDir, 'reviewer_packet.json'), JSON.stringify(reviewer, null, 2));
  writeFileSync(
    path.join(process.cwd(), 'tmp/ONEIROS_MYTH_NATURALISTIC_V1_COPY_PASTE.txt'),
    `${buildNaturalisticMythCopyPaste(reviewer.summary)}\n`
  );

  console.log(
    JSON.stringify(
      {
        wrote: outJson,
        packet_valid: reviewer.packet_valid,
        packet_complete: reviewer.packet_complete,
        packet_reconciled: reviewer.packet_reconciled,
      },
      null,
      2
    )
  );
}

main();
