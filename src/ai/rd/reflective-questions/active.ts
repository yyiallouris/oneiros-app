/**
 * Current reflective-question R&D selection.
 *
 * Candidate B SHA `08cd3eaf…` is the only active research base.
 * Closed experiments live under `archive/` and `lineage/` and are not
 * selectable from this module. Future Candidate C should export from here.
 * Not imported by client interpretation or the entitlement gateway.
 */
export {
  LANGUAGE_OPERATOR_CANDIDATE_B_CASE_COUNT,
  LANGUAGE_OPERATOR_CANDIDATE_B_CASE_IDS,
  LANGUAGE_OPERATOR_CANDIDATE_B_FIXTURE,
  LANGUAGE_OPERATOR_CANDIDATE_B_REPEAT_COUNT,
  REFLECTIVE_QUESTION_LANGUAGE_OPERATOR_CANDIDATE_B_ID,
  REFLECTIVE_QUESTION_LANGUAGE_OPERATOR_CANDIDATE_B_PROMPT,
  REFLECTIVE_QUESTION_LANGUAGE_OPERATOR_CANDIDATE_B_SHA256,
  REFLECTIVE_QUESTION_LANGUAGE_OPERATOR_CANDIDATE_B_VERSION,
} from './candidateB/reflectiveQuestionLanguageOperatorCandidateBExperiment';

export const ACTIVE_REFLECTIVE_QUESTION_RD_STATUS = 'candidate-b-frozen' as const;
export const ACTIVE_REFLECTIVE_QUESTION_RD_SHA256 =
  '08cd3eaf6fd507d6eb19ba73714eecf6453ec8dd6a61f55068621c8ffd80f622';
