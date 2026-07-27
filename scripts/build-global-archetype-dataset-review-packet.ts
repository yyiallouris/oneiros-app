/**
 * Pre-run dataset review packet — fixtures + leakage + stats only (no API calls).
 *
 *   npx tsx scripts/build-global-archetype-dataset-review-packet.ts
 */
import { createHash } from 'crypto';
import { writeFileSync } from 'fs';
import path from 'path';
import {
  DREAM_EXTRACTION_PROMPT_ID,
  DREAM_EXTRACTION_PROMPT_VERSION,
  DREAM_EXTRACTION_SCHEMA_VERSION,
} from '../src/ai/dreamExtractionPrompt';
import { ARCHETYPE_CATALOG_VERSION, selectableArchetypeIds } from '../src/ai/catalogs/archetypeCatalog.v1';
import { validateGlobalArchetypeFixtures } from './lib/globalArchetypeBenchmark';
import {
  GLOBAL_ARCHETYPE_BENCHMARK_FIXTURES,
  GLOBAL_ARCHETYPE_BENCHMARK_VERSION,
} from './lib/globalArchetypeBenchmarkFixtures';
import { detectGlobalArchetypeDatasetLeakage } from './lib/globalArchetypeBenchmarkLeakage';

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function dreamHash(text: string): string {
  return createHash('sha256').update(text, 'utf8').digest('hex').slice(0, 16);
}

function summarizeFixtures() {
  const byCategory = { single_primary: 0, mixed: 0, contrast_negative: 0 };
  const byStyle = { catalog_conformance: 0, naturalistic: 0 };
  const byLanguage: Record<string, number> = {};
  const wordCounts: number[] = [];
  const overlapSecondaries: Array<{ id: string; acceptable_secondary_ids: string[] }> = [];

  for (const f of GLOBAL_ARCHETYPE_BENCHMARK_FIXTURES) {
    byCategory[f.category] += 1;
    byStyle[f.evaluation_style] += 1;
    byLanguage[f.dream_language] = (byLanguage[f.dream_language] || 0) + 1;
    wordCounts.push(wordCount(f.dream));
    if (f.expected.acceptable_secondary_ids.length > 0) {
      overlapSecondaries.push({
        id: f.id,
        acceptable_secondary_ids: f.expected.acceptable_secondary_ids,
      });
    }
  }

  wordCounts.sort((a, b) => a - b);
  const median = wordCounts[Math.floor(wordCounts.length / 2)] ?? 0;

  return {
    total: GLOBAL_ARCHETYPE_BENCHMARK_FIXTURES.length,
    by_category: byCategory,
    by_evaluation_style: byStyle,
    by_language: byLanguage,
    word_count: {
      min: wordCounts[0] ?? 0,
      max: wordCounts[wordCounts.length - 1] ?? 0,
      median,
      mean: wordCounts.length
        ? Math.round(wordCounts.reduce((a, b) => a + b, 0) / wordCounts.length)
        : 0,
    },
    fixtures_with_acceptable_secondary: overlapSecondaries,
    anima_animus_fixtures: GLOBAL_ARCHETYPE_BENCHMARK_FIXTURES.filter(
      (f) => f.primary_archetype_id === 'anima' || f.primary_archetype_id === 'animus'
    ).map((f) => ({
      id: f.id,
      primary_archetype_id: f.primary_archetype_id,
      soul_image_convention: f.soul_image_convention ?? null,
    })),
  };
}

function main() {
  validateGlobalArchetypeFixtures(GLOBAL_ARCHETYPE_BENCHMARK_FIXTURES);
  const leakage = detectGlobalArchetypeDatasetLeakage(GLOBAL_ARCHETYPE_BENCHMARK_FIXTURES);
  const stats = summarizeFixtures();

  const fixtures = GLOBAL_ARCHETYPE_BENCHMARK_FIXTURES.map((f) => ({
    id: f.id,
    category: f.category,
    evaluation_style: f.evaluation_style,
    dream_language: f.dream_language,
    dream_hash: dreamHash(f.dream),
    word_count: wordCount(f.dream),
    primary_archetype_id: f.primary_archetype_id ?? null,
    soul_image_convention: f.soul_image_convention ?? null,
    required_archetype_ids: f.expected.required_archetype_ids,
    acceptable_secondary_ids: f.expected.acceptable_secondary_ids,
    forbidden_archetype_ids: f.expected.forbidden_archetype_ids,
    expected_cardinality: f.expected.expected_cardinality,
    dream: f.dream,
  }));

  const packet = {
    title: 'Oneiros global archetype benchmark — dataset review packet',
    generated_at: new Date().toISOString(),
    purpose: 'Pre-run freeze review — fixtures, contracts, leakage only. No model calls.',
    status: leakage.fixtures_with_hits === 0 ? 'frozen_ready_for_run' : 'leakage_review_required',
    reviewer_decision: 'FREEZE WITH EDITS — gold-contract corrections applied 2026-07-27',
    dataset_version: GLOBAL_ARCHETYPE_BENCHMARK_VERSION,
    archived_prior_version: {
      version: '1.0.0',
      label: 'global_archetype_catalog_conformance_v1',
      jsonl: 'docs/ONEIROS_GLOBAL_ARCHETYPE_CATALOG_CONFORMANCE_V1.jsonl',
      note: 'White-box catalog-paraphrase suite — retained for history, not the primary run target.',
    },
    frozen_production_baseline: {
      prompt_id: DREAM_EXTRACTION_PROMPT_ID,
      prompt_version: DREAM_EXTRACTION_PROMPT_VERSION,
      schema_version: DREAM_EXTRACTION_SCHEMA_VERSION,
      archetype_catalog_version: ARCHETYPE_CATALOG_VERSION,
      selectable_archetype_count: selectableArchetypeIds().length,
      myth_layer: 'C.1.1 frozen',
      hero_layer: 'D.1 accepted_with_known_residuals',
      production_changes_in_dataset_phase: false,
    },
    scoring_buckets: {
      catalog_conformance_score: {
        evaluation_style: 'catalog_conformance',
        fixture_count: stats.by_evaluation_style.catalog_conformance,
      },
      naturalistic_generalization_score: {
        evaluation_style: 'naturalistic',
        fixture_count: stats.by_evaluation_style.naturalistic,
      },
      global: { fixture_count: stats.total },
    },
    conventions: {
      anima_animus:
        'carrier_function_independent_of_dreamer_gender — gold labels reflect mediating soul-image function, not assumed dreamer sex/gender.',
      acceptable_secondary_ids:
        'Used only where a second interpretation is genuinely defensible; see fixtures_with_acceptable_secondary.',
      dream_text_rules: [
        'No interpretive meta sentences (the dream turns on, structural function, not merely, …)',
        'No catalog/archetype terminology in dream narratives',
        'Contrast negatives show absence through images, not gate vocabulary',
      ],
    },
    validation: {
      fixture_contract_valid: true,
      leakage,
      leakage_report_file: 'docs/ONEIROS_GLOBAL_ARCHETYPE_BENCHMARK_LEAKAGE.json',
    },
    statistics: stats,
    reviewer_checklist: [
      'Confirm dream text stages function through images/actions, not rubric paraphrase',
      'Confirm naturalistic arm reads like user-recorded dreams (incl. Greek acceptance-derived)',
      'Confirm acceptable_secondary_ids are defensible, not overly permissive',
      'Confirm anima/animus convention is acceptable for gold labels',
      'Freeze dataset_version 1.1.0 before first live run',
      'After freeze: bash scripts/run-global-archetype-benchmark.sh (concurrency 8, no tuning)',
    ],
    fixtures,
  };

  const outJson = path.join(process.cwd(), 'tmp/ONEIROS_GLOBAL_ARCHETYPE_DATASET_REVIEW_PACKET.json');
  writeFileSync(outJson, JSON.stringify(packet, null, 2));

  const md = buildMarkdownSummary(packet);
  const outMd = path.join(process.cwd(), 'tmp/ONEIROS_GLOBAL_ARCHETYPE_DATASET_REVIEW_PACKET.md');
  writeFileSync(outMd, md);

  console.log(
    JSON.stringify(
      {
        wrote_json: outJson,
        wrote_md: outMd,
        dataset_version: GLOBAL_ARCHETYPE_BENCHMARK_VERSION,
        fixture_count: stats.total,
        leakage_hits: leakage.total_hits,
        status: packet.status,
      },
      null,
      2
    )
  );
}

function buildMarkdownSummary(packet: Record<string, unknown>): string {
  const stats = packet.statistics as ReturnType<typeof summarizeFixtures>;
  const leakage = (packet.validation as { leakage: { fixtures_with_hits: number; total_hits: number } })
    .leakage;
  const overlaps = stats.fixtures_with_acceptable_secondary
    .map((r) => `- \`${r.id}\`: ${r.acceptable_secondary_ids.join(', ')}`)
    .join('\n');

  return `# Global archetype dataset review packet (v${packet.dataset_version})

**Generated:** ${packet.generated_at}  
**Status:** ${packet.status}  
**Purpose:** Pre-run freeze review — no API calls.

## Composition

| Bucket | Count |
|---|---|
| catalog_conformance | ${stats.by_evaluation_style.catalog_conformance} |
| naturalistic | ${stats.by_evaluation_style.naturalistic} |
| **Total** | **${stats.total}** |

| Category | Count |
|---|---|
| single_primary | ${stats.by_category.single_primary} |
| mixed | ${stats.by_category.mixed} |
| contrast_negative | ${stats.by_category.contrast_negative} |

**Languages:** ${Object.entries(stats.by_language).map(([k, v]) => `${k}=${v}`).join(', ')}  
**Word count:** min ${stats.word_count.min}, median ${stats.word_count.median}, mean ${stats.word_count.mean}, max ${stats.word_count.max}

## Leakage validator

- Fixtures with hits: **${leakage.fixtures_with_hits}**
- Total hits: **${leakage.total_hits}**
- Full report: \`docs/ONEIROS_GLOBAL_ARCHETYPE_BENCHMARK_LEAKAGE.json\`

## Anima / Animus convention

${(packet.conventions as { anima_animus: string }).anima_animus}

Fixtures: ${stats.anima_animus_fixtures.map((f) => f.id).join(', ')}

## Acceptable secondary overlaps

${overlaps || '(none)'}

## Frozen production baseline

- prompt: \`${(packet.frozen_production_baseline as { prompt_version: string }).prompt_version}\`
- schema: ${(packet.frozen_production_baseline as { schema_version: number }).schema_version}
- archetype catalog: ${(packet.frozen_production_baseline as { archetype_catalog_version: string }).archetype_catalog_version}

## Reviewer checklist

${((packet.reviewer_checklist as string[]) || []).map((item) => `- [ ] ${item}`).join('\n')}

## Full fixture JSON

See \`tmp/ONEIROS_GLOBAL_ARCHETYPE_DATASET_REVIEW_PACKET.json\` (all ${stats.total} dreams + contracts).
`;
}

main();
