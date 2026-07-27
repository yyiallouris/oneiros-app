/**
 * Reconciled global archetype benchmark reviewer packet.
 *
 *   npx tsx scripts/build-global-archetype-reviewer-packet.ts tmp/global-archetype-benchmark-<stamp>
 */
import { readFileSync, writeFileSync } from 'fs';
import path from 'path';
import {
  DREAM_EXTRACTION_PROMPT_ID,
  DREAM_EXTRACTION_PROMPT_VERSION,
  DREAM_EXTRACTION_SCHEMA_VERSION,
} from '../src/ai/dreamExtractionPrompt';
import { ARCHETYPE_CATALOG_VERSION, selectableArchetypeIds } from '../src/ai/catalogs/archetypeCatalog.v1';
import { mixedRelationType } from './lib/globalArchetypeMixedAnalysis';
import type { GlobalArchetypeFailedRun, GlobalArchetypeRunRecord } from './lib/globalArchetypeRunRecord';
import { loadGlobalArchetypeFixtures } from './lib/globalArchetypeBenchmarkRunner';

function readJson<T>(file: string): T {
  return JSON.parse(readFileSync(file, 'utf8')) as T;
}

function reconcile(params: {
  summary: Record<string, unknown>;
  runs: GlobalArchetypeRunRecord[];
}): string[] {
  const errors: string[] = [];
  const metrics = params.summary.metrics as { contract_pass_count?: number; total_runs?: number };
  const contractPass = params.runs.filter((r) => r.score.contract_pass).length;
  if (metrics.contract_pass_count !== contractPass) {
    errors.push('summary contract_pass_count mismatch');
  }
  if (metrics.total_runs !== params.runs.length) {
    errors.push('summary total_runs mismatch');
  }
  if (params.summary.completed_runs !== params.runs.length) {
    errors.push('summary completed_runs mismatch');
  }
  return errors;
}

function main() {
  const benchDir = process.argv[2];
  if (!benchDir) {
    throw new Error(
      'Usage: npx tsx scripts/build-global-archetype-reviewer-packet.ts <global_archetype_benchmark_dir>'
    );
  }
  const absDir = path.resolve(benchDir);
  const summary = readJson<Record<string, unknown>>(path.join(absDir, 'summary.json'));
  const runs = readJson<GlobalArchetypeRunRecord[]>(path.join(absDir, 'global_archetype_runs.json'));
  const failedPath = path.join(absDir, 'failed_runs.json');
  let failedRuns: GlobalArchetypeFailedRun[] = [];
  try {
    failedRuns = readJson<GlobalArchetypeFailedRun[]>(failedPath);
  } catch {
    failedRuns = (summary.failed_run_records as GlobalArchetypeFailedRun[] | undefined) ?? [];
  }

  const fixtures = loadGlobalArchetypeFixtures();
  const fixtureById = new Map(fixtures.map((f) => [f.id, f]));
  const reconciliation_errors = reconcile({ summary, runs });
  const totalFixtures = Number(summary.total_fixtures ?? fixtures.length);
  const completedRuns = runs.length;
  const failedCount = Number(summary.failed_runs ?? failedRuns.length);
  const packetComplete = summary.packet_complete === true || (completedRuns === totalFixtures && failedCount === 0);

  const failures = runs.filter((r) => !r.score.contract_pass);
  const packet = {
    title: 'Oneiros global archetype evaluation packet',
    generated_at: new Date().toISOString(),
    phase: 'global_archetype_evaluation',
    status: 'diagnostic_only',
    packet_reconciled: summary.packet_reconciled ?? true,
    packet_complete: packetComplete,
    packet_valid: reconciliation_errors.length === 0,
    reconciliation_errors,
    frozen_production_baseline: {
      prompt_id: DREAM_EXTRACTION_PROMPT_ID,
      prompt_version: DREAM_EXTRACTION_PROMPT_VERSION,
      schema_version: DREAM_EXTRACTION_SCHEMA_VERSION,
      archetype_catalog_version: ARCHETYPE_CATALOG_VERSION,
      myth_layer: 'C.1.1 frozen',
      hero_layer: 'D.1 accepted_with_known_residuals — do not reopen in this phase',
      selectable_archetype_count: selectableArchetypeIds().length,
    },
    decision_policy: {
      do_not_patch_isolated_misses: true,
      max_systemic_issues_per_patch: 3,
      prefer_general_catalog_or_gate_fixes: true,
      rerun_complete_suite_after_any_production_change: true,
      no_prompt_examples_or_dream_specific_rules: true,
    },
    source_out_dir: absDir,
    execution_mode: summary.execution_mode ?? 'routing_system_inclusive',
    source_routing_out_dir: summary.source_routing_out_dir ?? null,
    summary,
    aggregate_metrics: summary.metrics,
    catalog_conformance_score: summary.catalog_conformance_score,
    naturalistic_generalization_score: summary.naturalistic_generalization_score,
    model_routing: summary.model_routing ?? null,
    mixed_adjudication: summary.mixed_adjudication ?? null,
    top_confusion_pairs: summary.top_confusion_pairs,
    failed_run_records: failedRuns,
    contract_failures: failures.map((r) => ({
      run_id: r.run_id,
      fixture_id: r.fixture_id,
      fixture_category: r.fixture_category,
      mixed_relation_type: mixedRelationType(fixtureById.get(r.fixture_id)!) ?? null,
      required_archetype_ids: r.required_archetype_ids,
      acceptable_secondary_ids: r.acceptable_secondary_ids,
      post_archetype_ids: r.post_archetype_ids,
      missing_required_ids: r.score.missing_required_ids,
      forbidden_hits: r.score.forbidden_hits,
      unexpected_extra_ids: r.score.unexpected_extra_ids,
      exact_set_match: r.score.exact_set_match,
      unambiguous_exact_set_match: r.score.unambiguous_exact_set_match,
      raw_archetype_ids: r.raw_archetype_ids,
      mechanism_tags_by_raw_id: r.mechanism_tags_by_raw_id,
      validator_decisions: r.validator_decisions,
      model: r.model,
      source_run_file: r.source_run_file,
    })),
    runs: runs.map((r) => ({
      ...r,
      mixed_relation_type: mixedRelationType(fixtureById.get(r.fixture_id)!) ?? null,
    })),
  };

  const executionMode = String(summary.execution_mode ?? 'routing_system_inclusive');
  const out =
    executionMode === 'primary_only' || executionMode === 'reconciled_primary_only'
      ? path.join(process.cwd(), 'tmp/ONEIROS_V417E_PATCH_E_REVIEWER_PACKET.json')
      : executionMode === 'routing_system_inclusive' && !packetComplete
        ? path.join(process.cwd(), 'tmp/ONEIROS_GLOBAL_ARCHETYPE_REVIEWER_PACKET.json')
        : path.join(process.cwd(), 'tmp/ONEIROS_GLOBAL_ARCHETYPE_REVIEWER_PACKET.json');

  writeFileSync(out, JSON.stringify(packet, null, 2));
  writeFileSync(path.join(absDir, 'reviewer_packet.json'), JSON.stringify(packet, null, 2));
  console.log(
    JSON.stringify(
      {
        wrote: out,
        packet_reconciled: packet.packet_reconciled,
        packet_complete: packet.packet_complete,
        packet_valid: packet.packet_valid,
        contract_pass_rate: (summary.metrics as { contract_pass_rate?: number }).contract_pass_rate,
      },
      null,
      2
    )
  );
  if (!packet.packet_valid) process.exit(1);
}

main();
