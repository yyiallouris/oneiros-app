/** Deterministic Shot 2 evidence join; no model or semantic calls. */
import { createHash } from 'crypto';
import { readFileSync, writeFileSync } from 'fs';
import path from 'path';

const root = process.cwd();
const dir = path.join(
  root,
  'testing/reflective-questions/artifacts/adaptive-openings-shot2-2026-08-29'
);
const paths = {
  manifest: path.join(root, 'testing/reflective-questions/adaptive-openings-shot2-2026-08-29.json'),
  fixture: path.join(root, 'testing/reflective-questions/adaptive-openings-feasibility-2026-08-29.json'),
  shot1: path.join(root, 'testing/reflective-questions/artifacts/adaptive-openings-feasibility-2026-08-29/REVIEWED_RESULTS.json'),
  raw: path.join(dir, 'RAW_EVALUATION.json'),
  verdicts: path.join(dir, 'HUMAN_VERDICTS.json'),
};
const expected = {
  manifest: '8bcbf82848d6ebec1217817e30a87a5378cd12fdd432e62bb2d3765a76a19245',
  fixture: '4b361245bc58ab7856d0ad48421f2b6f8c25a5d5e11fadb5275b83c6f1312d71',
  shot1: '2d7b7ee34b6bfdd8a68294df1eeb7fe77ab639d0512ab92e07df707e0063d850',
  raw: 'fa7525cfa77794d59cb427ff7637e70c580ef4cef833a030f885459378f6472f',
  verdicts: '185f4d8ae815ed88fac8893ce227beda184d64a59f0eb1771810fe70ae758af5',
};

function sha(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function main(): void {
  const texts = Object.fromEntries(
    Object.entries(paths).map(([key, value]) => [key, readFileSync(value, 'utf8')])
  ) as Record<keyof typeof paths, string>;
  for (const key of Object.keys(paths) as Array<keyof typeof paths>) {
    if (sha(texts[key]) !== expected[key]) throw new Error(`Shot 2 ${key} hash drifted.`);
  }
  const manifest = JSON.parse(texts.manifest) as Record<string, unknown>;
  const fixture = JSON.parse(texts.fixture) as { cases: Array<{ id: string; cohort: string }> };
  const raw = JSON.parse(texts.raw) as {
    status: string;
    exact_shot_2_cost_usd: number;
    results: Array<{
      generation_id: string;
      case_id: string;
      surface: string;
      after: null | {
        questions: string[];
        adaptive_observation: { passed: boolean; issues: string[] };
      };
    }>;
  };
  const verdicts = JSON.parse(texts.verdicts) as {
    results: Array<{
      generation_id: string;
      actual: string;
      target_match: boolean;
      product_pass: boolean;
      complementarity?: boolean | null;
      restraint?: boolean;
      serious_failure: boolean;
      failure_families: string[];
    }>;
  };
  if (raw.status !== 'complete' || raw.results.length !== 20 || verdicts.results.length !== 20) {
    throw new Error('Shot 2 evidence is incomplete.');
  }
  const results = raw.results.map((item) => {
    const human = verdicts.results.find((value) => value.generation_id === item.generation_id);
    const dreamCase = fixture.cases.find((value) => value.id === item.case_id);
    if (!human || !dreamCase || !item.after) throw new Error(`Missing Shot 2 join ${item.generation_id}.`);
    return { ...item, case_profile: dreamCase.cohort, human_review: human };
  });
  const quick = results.filter((item) => item.surface === 'quick');
  const full = results.filter((item) => item.surface !== 'quick');
  const familyCounts = verdicts.results.flatMap((item) => item.failure_families)
    .reduce<Record<string, number>>((counts, value) => {
      counts[value] = (counts[value] ?? 0) + 1;
      return counts;
    }, {});
  familyCounts.fixed_two_cardinality_persistence = full.filter(
    (item) => item.after?.questions.length === 2
  ).length;
  const summary = {
    quick_target_match: quick.filter((item) => item.human_review.target_match).length,
    quick_human_quality_pass: quick.filter((item) => item.human_review.product_pass).length,
    full_target_and_product_pass: full.filter(
      (item) => item.human_review.target_match && item.human_review.product_pass
    ).length,
    full_target_match_regardless_of_quality: full.filter(
      (item) => item.human_review.target_match
    ).length,
    full_one_question: full.filter((item) => item.after?.questions.length === 1).length,
    full_two_questions: full.filter((item) => item.after?.questions.length === 2).length,
    full_strong_complementarity: full.filter(
      (item) => item.human_review.complementarity === true
    ).length,
    serious_failures: verdicts.results.filter((item) => item.serious_failure).length,
    structural_pass: results.filter((item) => item.after?.adaptive_observation.passed).length,
    structural_fail: results.filter((item) => !item.after?.adaptive_observation.passed).length,
    failure_family_counts: familyCounts,
    exact_shot_2_cost_usd: raw.exact_shot_2_cost_usd,
    cumulative_cost_from_shot_2_usd: raw.exact_shot_2_cost_usd,
    disposition: 'SHOT_2_HOLD_PROCEED_TO_FINAL_SHOT_3',
  };
  const reviewed = {
    schema_version: 1,
    status: 'complete',
    manifest_sha256: expected.manifest,
    fixture_sha256: expected.fixture,
    shot_1_reviewed_sha256: expected.shot1,
    raw_sha256: expected.raw,
    verdicts_sha256: expected.verdicts,
    manifest,
    human_summary: summary,
    results,
  };
  writeFileSync(path.join(dir, 'REVIEWED_RESULTS.json'), `${JSON.stringify(reviewed, null, 2)}\n`);
  writeFileSync(path.join(dir, 'REVIEW_REPORT.md'), `${[
    '# Adaptive Reflective Openings — Shot 2 review',
    '',
    '**HOLD. Proceed to the owner-authorized final Shot 3; no deploy.**',
    '',
    `- Full target + quality PASS: **${summary.full_target_and_product_pass}/10**.`,
    `- Full outputs still returning two: **${summary.full_two_questions}/10**.`,
    `- Quick target match: **${summary.quick_target_match}/10**; human quality: **${summary.quick_human_quality_pass}/10**.`,
    `- Serious failures: **${summary.serious_failures}**.`,
    `- Structural observer: **${summary.structural_pass}/20 PASS**, with four genuine manufactured-menu failures.`,
    `- Exact Shot 2 cost: **$${summary.exact_shot_2_cost_usd.toFixed(8)}**.`,
    '',
    'Neutral job names removed literal slot numbering but did not create a real stopping boundary. The private three-way choice defaulted to BOTH in 9/10 full outputs. Shot 3 therefore uses an asymmetric minimum-sufficient rule: start with one, and add the other job only when a different explicit source and irreducibly different psychological operation both remain.',
    '',
    'Production remains unchanged at v1.0.3 / `f5399a4973fb84365a25967890169fc2475cb2e2a9f65f0dffd2a8993101d9e7`.',
  ].join('\n')}\n`);
}

main();
