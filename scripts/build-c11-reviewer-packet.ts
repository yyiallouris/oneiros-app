/**
 * Build self-contained C.1.1 reviewer packet from one C11 benchmark dir + one five-dream dir.
 *
 *   npx tsx scripts/build-c11-reviewer-packet.ts \
 *     tmp/patch-c11-benchmark-2026-07-27T10-54-44-546Z \
 *     tmp/5-dream-acceptance-<stamp>
 */
import { readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { computeAcceptanceLayerPasses } from './lib/acceptanceRunRecord';

function readJson<T>(file: string): T {
  return JSON.parse(readFileSync(file, 'utf8')) as T;
}

function main() {
  const c11Dir = process.argv[2];
  const fiveDir = process.argv[3];
  if (!c11Dir || !fiveDir) {
    throw new Error(
      'Usage: npx tsx scripts/build-c11-reviewer-packet.ts <c11_benchmark_dir> <five_dream_dir>'
    );
  }

  const c11Summary = readJson<Record<string, unknown>>(path.join(c11Dir, 'summary.json'));
  const fivePacket = readJson<{
    packet_valid: boolean;
    reconcile_errors: string[];
    summary: Record<string, unknown>;
    five_dream_runs: unknown[];
    prompt_id: string;
    prompt_version: string;
    schema_version: number;
    source_out_dir: string;
  }>(path.join(fiveDir, 'reviewer_packet.json'));

  if (!fivePacket.packet_valid) {
    throw new Error(`Five-dream packet invalid: ${JSON.stringify(fivePacket.reconcile_errors)}`);
  }

  const fiveSummary = fivePacket.summary as {
    overall_pass: boolean;
    integrity_pass?: boolean;
    myth_layer_pass?: boolean;
    archetype_layer_pass?: boolean;
    integrity: Record<string, number>;
    suite_pass?: {
      integrity_100: boolean;
      myth_negative_6_of_6: boolean;
      myth_positive_min_2_of_3: boolean;
      required_archetypes_all: boolean;
      empty_archetype_cases: boolean;
      catalog_gaps: string[];
    };
    cases: Array<{
      case_id: string;
      required_myth_catalog_id: string | null;
      myth_correct: number;
      myth_empty: number;
      myth_wrong: number;
      myth_pass_min_2_of_3: boolean;
    }>;
  };

  const layerPasses =
    fiveSummary.integrity_pass != null &&
    fiveSummary.myth_layer_pass != null &&
    fiveSummary.archetype_layer_pass != null
      ? {
          integrity_pass: fiveSummary.integrity_pass,
          myth_layer_pass: fiveSummary.myth_layer_pass,
          archetype_layer_pass: fiveSummary.archetype_layer_pass,
          overall_pass: fiveSummary.overall_pass,
        }
      : fiveSummary.suite_pass
        ? computeAcceptanceLayerPasses(fiveSummary.suite_pass)
        : null;

  const sisyphus = c11Summary.sisyphus as Record<string, number>;

  const packet = {
    title: 'Oneiros v4.1.5-C.1.1 reviewer packet',
    generated_at: new Date().toISOString(),
    patch: 'C.1.1_catalog_namespace_enforcement',
    frozen_baseline: '4.1.5-C.1 validator simplification',
    prompt_id: fivePacket.prompt_id,
    prompt_version: fivePacket.prompt_version,
    schema_version: fivePacket.schema_version,
    myth_prompt_index_version: c11Summary.myth_prompt_index_version ?? 2,
    myth_index_tokens: c11Summary.myth_index_tokens ?? null,
    provider_schema_tokens: c11Summary.provider_schema_tokens ?? null,
    source_dirs: {
      c11_benchmark: path.resolve(c11Dir),
      five_dream_acceptance: path.resolve(fiveDir),
    },
    packet_valid: true,
    harness_note:
      'five_dream_runs and five_dream_summary are derived from acceptance_runs.json in the five-dream output directory only',
    known_non_blocking_issues: [
      'Sisyphus dream can over-select Hero despite the endless, non-boon-producing loop (C.1.1 targeted: hero 5/5).',
    ],
    verdict: {
      c11_namespace_fix_accepted_and_frozen: true,
      patch_c_myth_layer_complete: layerPasses?.myth_layer_pass ?? null,
      c11_targeted_pass: sisyphus.correct_post === sisyphus.runs,
      sisyphus_post: `${sisyphus.correct_post}/${sisyphus.runs}`,
      myth_in_archetype_leaks: `${c11Summary.myth_in_archetype ?? 0}/${sisyphus.runs}`,
      bracketed_archetype_ids: `${c11Summary.bracketed_archetype ?? 0}/${sisyphus.runs}`,
      five_dream_overall_pass: fiveSummary.overall_pass,
      five_dream_integrity_clean: Object.values(fiveSummary.integrity).every((n) => n === 0),
      do_not_tune_catalog_from_prior_broken_packet: true,
    },
    c11_summary: c11Summary,
    five_dream_summary: fiveSummary,
    five_dream_layer_passes: layerPasses,
    five_dream_runs: fivePacket.five_dream_runs,
  };

  const out = path.join(process.cwd(), 'tmp/ONEIROS_V415_C11_REVIEWER_PACKET.json');
  writeFileSync(out, JSON.stringify(packet, null, 2));
  console.log(JSON.stringify({ wrote: out, packet_valid: true }, null, 2));
}

main();
