/**
 * Thin current reflective-question R&D runner.
 *
 * Selects only the active research base (Candidate B). Closed experiment
 * env flags are rejected here. Historical replay stays in
 * scripts/live/archive/reflective-questions/run-reflective-question-golden-set.ts.
 *
 * This pass does not generate. Future Candidate C should use this runner,
 * not the archived multiplexer.
 */
import {
  ACTIVE_REFLECTIVE_QUESTION_RD_SHA256,
  ACTIVE_REFLECTIVE_QUESTION_RD_STATUS,
  LANGUAGE_OPERATOR_CANDIDATE_B_FIXTURE,
  REFLECTIVE_QUESTION_LANGUAGE_OPERATOR_CANDIDATE_B_ID,
  REFLECTIVE_QUESTION_LANGUAGE_OPERATOR_CANDIDATE_B_SHA256,
} from '../../../../src/ai/rd/reflective-questions/active';
import { ARCHIVED_REFLECTIVE_QUESTION_EXPERIMENT_ENV_FLAGS } from '../../../../src/ai/rd/reflective-questions/archivedFlags';

function main(): void {
  const setFlags = ARCHIVED_REFLECTIVE_QUESTION_EXPERIMENT_ENV_FLAGS.filter(
    (flag) => process.env[flag] && process.env[flag] !== '0'
  );
  if (setFlags.length > 0) {
    throw new Error(
      [
        'Closed reflective-question experiment flags are not current R&D selection.',
        `Rejected: ${setFlags.join(', ')}`,
        'Historical replay only: scripts/live/archive/reflective-questions/run-reflective-question-golden-set.ts',
        'Current R&D identity is Candidate B via this runner.',
      ].join('\n')
    );
  }

  if (REFLECTIVE_QUESTION_LANGUAGE_OPERATOR_CANDIDATE_B_SHA256 !== ACTIVE_REFLECTIVE_QUESTION_RD_SHA256) {
    throw new Error('Active reflective-question R&D SHA drifted from Candidate B freeze.');
  }

  console.log(
    [
      'Active reflective-question R&D runner (no generation in cleanup pass #2).',
      `Status: ${ACTIVE_REFLECTIVE_QUESTION_RD_STATUS}`,
      `ID: ${REFLECTIVE_QUESTION_LANGUAGE_OPERATOR_CANDIDATE_B_ID}`,
      `SHA: ${REFLECTIVE_QUESTION_LANGUAGE_OPERATOR_CANDIDATE_B_SHA256}`,
      `Fixture: ${LANGUAGE_OPERATOR_CANDIDATE_B_FIXTURE}`,
      'Future Candidate C should replace active.ts, not the archived mega-runner.',
    ].join('\n')
  );
}

try {
  main();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exit(1);
}
