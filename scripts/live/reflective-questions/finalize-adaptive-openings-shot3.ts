/** Deterministic final-shot evidence join; no model or semantic calls. */
import { createHash } from 'crypto';
import { readFileSync, writeFileSync } from 'fs';
import path from 'path';

const root = process.cwd();
const dir = path.join(
  root,
  'testing/reflective-questions/artifacts/adaptive-openings-shot3-final-2026-08-29'
);
const paths = {
  manifest: path.join(root, 'testing/reflective-questions/adaptive-openings-shot3-final-2026-08-29.json'),
  fixture: path.join(root, 'testing/reflective-questions/adaptive-openings-feasibility-2026-08-29.json'),
  shot2: path.join(root, 'testing/reflective-questions/artifacts/adaptive-openings-shot2-2026-08-29/REVIEWED_RESULTS.json'),
  raw: path.join(dir, 'RAW_EVALUATION.json'),
  verdicts: path.join(dir, 'HUMAN_VERDICTS.json'),
};
const expected = {
  manifest: '48dd4a0066c3579bc20a4400680dd76843d2f85a27d299947636fb992d762b03',
  fixture: '4b361245bc58ab7856d0ad48421f2b6f8c25a5d5e11fadb5275b83c6f1312d71',
  shot2: '45c8450d19fd6db3ce5e45b8cb2c0c7660867f4af07eb21b36217c0c20e3abc2',
  raw: '7efb14f81e4947c3e9af443fc52048d2897592e8c93104a06cfa6db17704d854',
  verdicts: '6da1e03a564f9a8c11a560e26b68f59aed9acab78789626ada0e7e29c8823ba6',
};

function sha(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function main(): void {
  const texts = Object.fromEntries(
    Object.entries(paths).map(([key, value]) => [key, readFileSync(value, 'utf8')])
  ) as Record<keyof typeof paths, string>;
  for (const key of Object.keys(paths) as Array<keyof typeof paths>) {
    if (sha(texts[key]) !== expected[key]) throw new Error(`Shot 3 ${key} hash drifted.`);
  }

  const manifest = JSON.parse(texts.manifest) as Record<string, unknown>;
  const fixture = JSON.parse(texts.fixture) as { cases: Array<{ id: string; cohort: string }> };
  const shot2 = JSON.parse(texts.shot2) as {
    results: Array<{ surface: string; human_review: { target_match: boolean; product_pass: boolean } }>;
  };
  const raw = JSON.parse(texts.raw) as {
    status: string;
    exact_shot_3_cost_usd: number;
    cumulative_shot_2_shot_3_cost_usd: number;
    results: Array<{
      generation_id: string;
      case_id: string;
      surface: string;
      after: { questions: string[]; adaptive_observation: { passed: boolean; issues: string[] } };
    }>;
  };
  const verdicts = JSON.parse(texts.verdicts) as {
    results: Array<{
      generation_id: string;
      actual_selection: string;
      target_match: boolean;
      product_pass: boolean;
      complementarity: boolean | null;
      restraint: boolean;
      vitality_pass: boolean;
      serious_failure: boolean;
      structural_human_pass: boolean;
      failure_families: string[];
    }>;
  };
  if (raw.status !== 'complete' || raw.results.length !== 10 || verdicts.results.length !== 10) {
    throw new Error('Shot 3 evidence is incomplete.');
  }

  const results = raw.results.map((item) => {
    const human = verdicts.results.find((value) => value.generation_id === item.generation_id);
    const dreamCase = fixture.cases.find((value) => value.id === item.case_id);
    if (!human || !dreamCase) throw new Error(`Missing Shot 3 join ${item.generation_id}.`);
    return { ...item, case_profile: dreamCase.cohort, human_review: human };
  });
  const familyCounts = verdicts.results.flatMap((item) => item.failure_families)
    .reduce<Record<string, number>>((counts, value) => {
      counts[value] = (counts[value] ?? 0) + 1;
      return counts;
    }, {});
  const shot2Full = shot2.results.filter((item) => item.surface !== 'quick');
  const observerFalsePositives = results.filter((item) =>
    !item.after.adaptive_observation.passed && item.human_review.structural_human_pass
  ).length;
  const summary = {
    full_target_and_product_pass: results.filter(
      (item) => item.human_review.target_match && item.human_review.product_pass
    ).length,
    full_target_match_regardless_of_quality: results.filter(
      (item) => item.human_review.target_match
    ).length,
    full_one_question: results.filter((item) => item.after.questions.length === 1).length,
    full_two_questions: results.filter((item) => item.after.questions.length === 2).length,
    full_strong_complementarity: results.filter(
      (item) => item.human_review.complementarity === true
    ).length,
    human_quality_pass: results.filter((item) => item.human_review.product_pass).length,
    vitality_pass: results.filter((item) => item.human_review.vitality_pass).length,
    serious_failures: verdicts.results.filter((item) => item.serious_failure).length,
    human_structural_pass: results.filter((item) => item.human_review.structural_human_pass).length,
    deterministic_observer_pass: results.filter((item) => item.after.adaptive_observation.passed).length,
    deterministic_observer_false_positives: observerFalsePositives,
    failure_family_counts: familyCounts,
    shot_2_full_target_and_product_pass: shot2Full.filter(
      (item) => item.human_review.target_match && item.human_review.product_pass
    ).length,
    exact_shot_3_cost_usd: raw.exact_shot_3_cost_usd,
    cumulative_shot_2_shot_3_cost_usd: raw.cumulative_shot_2_shot_3_cost_usd,
    hard_cap_usd: 1,
    disposition: 'FINAL_SHOT_HOLD_EXPERIMENT_CLOSED',
  };
  const reviewed = {
    schema_version: 1,
    status: 'complete',
    manifest_sha256: expected.manifest,
    fixture_sha256: expected.fixture,
    shot_2_reviewed_sha256: expected.shot2,
    raw_sha256: expected.raw,
    verdicts_sha256: expected.verdicts,
    manifest,
    human_summary: summary,
    results,
  };
  writeFileSync(path.join(dir, 'REVIEWED_RESULTS.json'), `${JSON.stringify(reviewed, null, 2)}\n`);
  writeFileSync(path.join(dir, 'REVIEW_REPORT.md'), `${[
    '# Adaptive Reflective Openings — final Shot 3 review',
    '',
    '**HOLD. The three-shot prompt experiment is closed; no fourth candidate and no deploy.**',
    '',
    `- Full target + quality PASS: **${summary.full_target_and_product_pass}/10** (Shot 2: ${summary.shot_2_full_target_and_product_pass}/10; release gate: 9/10).`,
    `- Target selection match regardless of quality: **${summary.full_target_match_regardless_of_quality}/10**.`,
    `- Cardinality: **${summary.full_one_question}/10 one-question**, **${summary.full_two_questions}/10 two-question**.`,
    `- Strong complementarity when two: **${summary.full_strong_complementarity}/6**.`,
    `- Serious premise/menu failures: **${summary.serious_failures}** (allowed: 0).`,
    `- Vitality: **${summary.vitality_pass}/10 PASS**.`,
    `- Human structural review: **${summary.human_structural_pass}/10 PASS**. Deterministic observer: **${summary.deterministic_observer_pass}/10 PASS**, with one false positive from a quoted dream-language question in French prose.`,
    `- Exact Shot 3 cost: **$${summary.exact_shot_3_cost_usd.toFixed(8)}**. Cumulative Shot 2+3: **$${summary.cumulative_shot_2_shot_3_cost_usd.toFixed(8)} / $1.00**.`,
    '',
    '## Diagnosis',
    '',
    'The asymmetric minimum-sufficient rule partially improved cardinality, but not the underlying selection policy. It still overproduced a redundant second opening for the resolved café scene, over-pruned the independently valuable crossing in the Portuguese gate dream, and selected manufactured enacted relations for both static imaginal controls. A Japanese output also reintroduced supplied interpretive vocabulary. The threshold is therefore not stable enough across source type or language.',
    '',
    'This is not a deadening/safety failure: all ten outputs remained vivid. It is a reliability failure in deciding source eligibility and when a second opening is genuinely earned. Three prompt-only shots did not make that decision dependable. Further clauses are not recommended without a future architecture/product decision and a new authorization.',
    '',
    'Production remains unchanged at v1.0.3 / `f5399a4973fb84365a25967890169fc2475cb2e2a9f65f0dffd2a8993101d9e7`.',
  ].join('\n')}\n`);
}

main();
