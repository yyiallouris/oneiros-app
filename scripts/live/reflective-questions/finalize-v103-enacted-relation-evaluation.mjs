import { readFileSync, writeFileSync } from 'fs';
import path from 'path';

const artifactDir = path.join(
  process.cwd(),
  'testing/reflective-questions/artifacts/v1.0.3-enacted-relation-evaluation-2026-08-29'
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
    human_q1_verdict: _pendingQ1,
    control_equivalence: _pendingControl,
    failure_families: _pendingFamilies,
    human_notes: _pendingNotes,
    ...frozenResult
  } = result;
  return { ...frozenResult, human_review: humanReview };
});
const reviewed = {
  ...raw,
  human_reviewed_at: human.reviewed_at,
  review_scope: human.review_scope,
  results,
};
writeFileSync(reviewedPath, `${JSON.stringify(reviewed, null, 2)}\n`);

const packet = [
  '# v1.0.3 enacted-relation final human review packet',
  '',
  `Candidate: \`${raw.candidate_method}\` / \`${raw.candidate_sha256}\``,
  `Fixture SHA-256: \`${raw.fixture_sha256}\``,
  `Exact cost: \`$${Number(raw.exact_cost_usd).toFixed(8)}\``,
  '',
  'The human Q1 verdict, structural verdict, and deterministic validator are intentionally separate.',
  '',
  ...results.flatMap((result) => [
    `## ${result.generation_id}`,
    '',
    `Cohort: ${result.cohort}`,
    `Human Q1: ${result.human_review.q1_verdict}`,
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
    ...(result.before ? [
      '### Before v1.0.1',
      '~~~text',
      result.before.output,
      '~~~',
      '',
    ] : []),
    '### v1.0.3 candidate',
    '~~~text',
    result.after.output,
    '~~~',
    '',
  ]),
].join('\n');
writeFileSync(packetPath, `${packet}\n`);
process.stdout.write(`Finalized ${results.length} reviewed cases in ${artifactDir}\n`);
