/**
 * Self-contained Patch D.1 reviewer packet from one benchmark output dir.
 *
 *   npx tsx scripts/build-d1-reviewer-packet.ts tmp/patch-d1-benchmark-<stamp>
 */
import { readFileSync, readdirSync, writeFileSync } from 'fs';
import path from 'path';
import {
  DREAM_EXTRACTION_PROMPT_ID,
  DREAM_EXTRACTION_PROMPT_VERSION,
  DREAM_EXTRACTION_SCHEMA_VERSION,
} from '../src/ai/dreamExtractionPrompt';
import { ARCHETYPE_CATALOG_VERSION } from '../src/ai/catalogs/archetypeCatalog.v1';
import { patchD1EngineeringDecision } from './lib/patchD1Decision';
import { getArchetypeProductionSnapshot } from './lib/archetypeDiagnosticCatalog';

function readJson<T>(file: string): T {
  return JSON.parse(readFileSync(file, 'utf8')) as T;
}

function main() {
  const benchDir = process.argv[2];
  if (!benchDir) {
    throw new Error('Usage: npx tsx scripts/build-d1-reviewer-packet.ts <patch_d1_benchmark_dir>');
  }
  const absDir = path.resolve(benchDir);
  const summary = readJson<Record<string, unknown>>(path.join(absDir, 'summary.json'));
  const runFiles = readdirSync(absDir)
    .filter((f) => f.endsWith('.json') && f !== 'summary.json')
    .sort();
  const runs = runFiles.map((f) => ({
    source_run_file: path.join(absDir, f),
    ...readJson<Record<string, unknown>>(path.join(absDir, f)),
  }));

  const residualLeaks = runs.filter((r) => r.hero_post === true && r.phase !== 'hero_positive');

  const engineering = patchD1EngineeringDecision(summary.overall_pass === true);

  const packet = {
    title: 'Oneiros v4.1.6-D.1 reviewer packet',
    generated_at: new Date().toISOString(),
    patch: 'D.1_hero_precision',
    status: 'frozen',
    frozen_layers: {
      myth: 'C.1.1 complete and frozen',
      hero: 'D.1 accepted_with_known_residuals',
      guide_death_rebirth: 'no production change in D.1',
    },
    prompt_id: DREAM_EXTRACTION_PROMPT_ID,
    prompt_version: DREAM_EXTRACTION_PROMPT_VERSION,
    schema_version: DREAM_EXTRACTION_SCHEMA_VERSION,
    archetype_catalog_version: ARCHETYPE_CATALOG_VERSION,
    source_out_dir: absDir,
    hero_mechanism_gate: {
      allOf: ['ordeal_or_confrontation', 'purposeful_quest_movement', 'boon_or_changed_outcome'],
    },
    production_hero_catalog: getArchetypeProductionSnapshot('hero'),
    benchmark_summary: summary,
    engineering_decision: engineering,
    verdict: {
      overall_pass: summary.overall_pass === true,
      benchmark_acceptance: engineering.benchmark_acceptance,
      production_decision: engineering.production_decision,
      known_residuals: engineering.known_residuals,
      regression_guardrails: engineering.regression_guardrails,
      freeze_note: engineering.freeze_note,
      sisyphus_hero_before_d1: '7/8 (5/5 targeted + 2/3 five-dream)',
      sisyphus_hero_after_d1: `${(summary.sisyphus as { hero_post?: number }).hero_post ?? '?'}/5`,
      hero_positive_pass: (summary.hero_positive as { hero_post_pass?: boolean })?.hero_post_pass ?? false,
      hero_negative_pass: (summary.hero_negative as { hero_post_pass?: boolean })?.hero_post_pass ?? false,
      sisyphus_myth_pass:
        (summary.sisyphus as { myth_pass_min_4_of_5?: boolean })?.myth_pass_min_4_of_5 ?? false,
      schema_proxy_clean: runs.every((r) => r.ok && r.schema_ok),
      do_not_add_schema_fields_for_residual_leaks: true,
    },
    residual_hero_leaks: residualLeaks.map((r) => ({
      run_id: r.run_id,
      phase: r.phase,
      diagnosis: 'model falsely emitted boon_or_changed_outcome; resonance denies completion/outcome',
      raw_hero_objects: r.raw_hero_objects,
      validator_decisions: r.validator_decisions,
      post_validation_archetypes: r.post_validation_archetypes,
      source_run_file: r.source_run_file,
    })),
    benchmark_runs: runs,
  };

  const out = path.join(process.cwd(), 'tmp/ONEIROS_V416_D1_REVIEWER_PACKET.json');
  writeFileSync(out, JSON.stringify(packet, null, 2));
  writeFileSync(path.join(absDir, 'reviewer_packet.json'), JSON.stringify(packet, null, 2));
  console.log(JSON.stringify({ wrote: out, overall_pass: packet.verdict.overall_pass }, null, 2));
}

main();
