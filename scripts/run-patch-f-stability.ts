#!/usr/bin/env npx tsx
import { runPatchFStabilitySuite } from './lib/patchFStabilityRunner';

async function main() {
  const { outDir, report } = await runPatchFStabilitySuite();
  console.log(
    JSON.stringify(
      {
        outDir,
        phase1: {
          lover_hit_count: report.phase1.lover_hit_count,
          empty_count: report.phase1.empty_count,
          reps_ok: report.phase1.reps_ok,
          meets_ge80: report.phase1.meets_expected_reliability_ge4_of_5_equivalent,
        },
        phase2_summary: report.phase2_summary,
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
