import { readFileSync, writeFileSync } from 'fs';
import path from 'path';

const artifactDir = path.join(
  process.cwd(),
  'testing/reflective-questions/artifacts/v1.0.4-imaginal-handoff-evaluation-2026-08-29'
);
const rawPath = path.join(artifactDir, 'RAW_EVALUATION.json');
const verdictPath = path.join(artifactDir, 'HUMAN_VERDICTS.json');
const reviewedPath = path.join(artifactDir, 'REVIEWED_RESULTS.json');
const packetPath = path.join(artifactDir, 'HUMAN_REVIEW_PACKET.md');

const raw = JSON.parse(readFileSync(rawPath, 'utf8'));
const human = JSON.parse(readFileSync(verdictPath, 'utf8'));

if (raw.status !== 'complete' || raw.results.length !== 21) {
  throw new Error('Frozen raw evaluation is not complete.');
}
if (
  raw.candidate_method !== human.candidate_method ||
  raw.candidate_sha256 !== human.candidate_sha256 ||
  raw.fixture_sha256 !== human.fixture_sha256
) {
  throw new Error('Human review identity does not match the frozen run.');
}

const verdicts = new Map(human.verdicts.map((item) => [item.generation_id, item]));
if (verdicts.size !== raw.results.length) {
  throw new Error('Human verdict count does not match the frozen run.');
}

const results = raw.results.map((result) => {
  const humanReview = verdicts.get(result.generation_id);
  if (!humanReview) throw new Error(`Missing human verdict for ${result.generation_id}.`);
  const {
    human_q2_verdict: _pendingQ2,
    pair_complementarity_verdict: _pendingPair,
    human_q1_regression_check: _pendingQ1,
    control_equivalence: _pendingControl,
    failure_families: _pendingFamilies,
    human_notes: _pendingNotes,
    ...frozenResult
  } = result;
  return { ...frozenResult, human_review: humanReview };
});

const count = (predicate) => results.filter(predicate).length;
const summary = {
  q2_individual: {
    pass: count((item) => item.human_review.q2_verdict === 'PASS'),
    fail: count((item) => item.human_review.q2_verdict === 'FAIL'),
  },
  pair_complementarity: {
    pass: count((item) => item.human_review.pair_complementarity_verdict === 'PASS'),
    fail: count((item) => item.human_review.pair_complementarity_verdict === 'FAIL'),
  },
  q1_regression: {
    pass: count((item) => item.human_review.q1_regression_check === 'PASS'),
    fail: count((item) => item.human_review.q1_regression_check === 'FAIL'),
  },
  known_q2_failures_repaired: count(
    (item) => item.cohort === 'known_q2_failure' && item.human_review.q2_verdict === 'PASS'
  ),
  strong_controls_equivalent: count(
    (item) => item.cohort === 'strong_q2_control' && item.human_review.control_equivalence === 'PASS'
  ),
  unseen_holdout_q2_pass: count(
    (item) => item.cohort === 'sealed_unseen_holdout' && item.human_review.q2_verdict === 'PASS'
  ),
  structural_hard_failures: count(
    (item) => item.human_review.structural_verdict === 'FAIL'
  ),
  overall: {
    pass: count((item) => item.human_review.overall_verdict === 'PASS'),
    fail: count((item) => item.human_review.overall_verdict === 'FAIL'),
  },
  recommendation: 'HOLD',
};

const reviewed = {
  ...raw,
  human_reviewed_at: human.reviewed_at,
  review_scope: human.review_scope,
  human_summary: summary,
  results,
};
writeFileSync(reviewedPath, `${JSON.stringify(reviewed, null, 2)}\n`);

const packet = [
  '# v1.0.4 imaginal-handoff final human review packet',
  '',
  `Candidate: \`${raw.candidate_method}\` / \`${raw.candidate_sha256}\``,
  `Fixture SHA-256: \`${raw.fixture_sha256}\``,
  `Exact cost: \`$${Number(raw.exact_cost_usd).toFixed(8)}\``,
  `Recommendation: **${summary.recommendation}**`,
  '',
  `Human Q2: ${summary.q2_individual.pass} PASS / ${summary.q2_individual.fail} FAIL`,
  `Q1-Q2 complementarity: ${summary.pair_complementarity.pass} PASS / ${summary.pair_complementarity.fail} FAIL`,
  `Q1 regression check: ${summary.q1_regression.pass} PASS / ${summary.q1_regression.fail} FAIL`,
  '',
  'Human editorial verdicts and the deterministic shadow validator are intentionally separate.',
  '',
  ...results.flatMap((result) => [
    `## ${result.generation_id}`,
    '',
    `Cohort: ${result.cohort}`,
    `Human Q2: ${result.human_review.q2_verdict}`,
    `Q1-Q2 complementarity: ${result.human_review.pair_complementarity_verdict}`,
    `Q1 regression check: ${result.human_review.q1_regression_check}`,
    `Human structure: ${result.human_review.structural_verdict}`,
    `Control equivalence: ${result.human_review.control_equivalence ?? 'N/A'}`,
    `Overall: ${result.human_review.overall_verdict}`,
    `Validator: ${result.after.validation.passed ? 'PASS' : 'FAIL'} (${result.after.validation.issues.join(', ') || 'no issues'})`,
    `Failure families: ${result.human_review.failure_families.join(', ') || 'none'}`,
    '',
    `Human notes: ${result.human_review.notes}`,
    '',
    '### Dream',
    '~~~text',
    result.dream,
    '~~~',
    '',
    ...(result.before
      ? [
          '### Production v1.0.3 before',
          '~~~text',
          result.before.output,
          '~~~',
          '',
        ]
      : []),
    '### v1.0.4 candidate',
    '~~~text',
    result.after.output,
    '~~~',
    '',
  ]),
].join('\n');
writeFileSync(packetPath, `${packet}\n`);

process.stdout.write(
  `Finalized ${results.length} reviewed cases in ${artifactDir}: ${JSON.stringify(summary)}\n`
);
