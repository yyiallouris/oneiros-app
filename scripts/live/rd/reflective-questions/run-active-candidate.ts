/**
 * Reflective-question R&D runner — CLOSED FOR CURRENT ARCHITECTURE.
 *
 * Do not run paid generation. Frozen references only.
 * Canonical record: docs/ONEIROS_QUESTION_REPAIR_PHASE2_EDITORIAL_FAIL_2026-08-29.md
 */
import { ARCHIVED_REFLECTIVE_QUESTION_EXPERIMENT_ENV_FLAGS } from '../../../../src/ai/rd/reflective-questions/archivedFlags';
import {
  ACTIVE_REFLECTIVE_QUESTION_RD_SHA256,
  ACTIVE_REFLECTIVE_QUESTION_RD_STATUS,
} from '../../../../src/ai/rd/reflective-questions/active';

function main(): void {
  const hijack = ARCHIVED_REFLECTIVE_QUESTION_EXPERIMENT_ENV_FLAGS.find(
    (flag) => process.env[flag] === '1'
  );
  if (hijack) {
    process.stderr.write(`Closed experiment flag ${hijack} is not selectable.\n`);
    process.exitCode = 1;
    return;
  }
  process.stderr.write(
    [
      'Reflective-question R&D is CLOSED FOR CURRENT ARCHITECTURE.',
      `status=${ACTIVE_REFLECTIVE_QUESTION_RD_STATUS}`,
      `frozen_generator_sha=${ACTIVE_REFLECTIVE_QUESTION_RD_SHA256}`,
      'Do not run paid generation. See docs/ONEIROS_QUESTION_REPAIR_PHASE2_EDITORIAL_FAIL_2026-08-29.md',
      '',
    ].join('\n')
  );
  process.exitCode = 1;
}

main();
