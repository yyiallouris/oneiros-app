import { createHash } from 'crypto';
import {
  LANGUAGE_OPERATOR_OUTPUT_CONTRACT,
  LANGUAGE_OPERATOR_REALIZATION_CONTRACT,
  REFLECTIVE_QUESTION_LANGUAGE_OPERATOR_PROMPT,
  REFLECTIVE_QUESTION_LANGUAGE_OPERATOR_SHA256,
} from '../src/ai/rd/reflective-questions/lineage/reflectiveQuestionLanguageOperatorExperiment';
import {
  REFLECTIVE_QUESTION_LANGUAGE_OPERATOR_CANDIDATE_B_PROMPT,
  REFLECTIVE_QUESTION_LANGUAGE_OPERATOR_CANDIDATE_B_SHA256,
} from '../src/ai/rd/reflective-questions/candidateB/reflectiveQuestionLanguageOperatorCandidateBExperiment';
import { ACTIVE_REFLECTIVE_QUESTION_RD_SHA256 } from '../src/ai/rd/reflective-questions/active';

describe('reflective-question Candidate B freeze', () => {
  it('keeps Candidate B SHA frozen and does not mutate Language+Operator', () => {
    expect(REFLECTIVE_QUESTION_LANGUAGE_OPERATOR_SHA256).toBe(
      'f5aa40a47732095588827384dfe9a3fdba9d1325fcb158f4265e3a4a81a80e6c'
    );
    expect(
      createHash('sha256')
        .update(REFLECTIVE_QUESTION_LANGUAGE_OPERATOR_PROMPT.trim())
        .digest('hex')
    ).toBe(REFLECTIVE_QUESTION_LANGUAGE_OPERATOR_SHA256);
    expect(
      createHash('sha256')
        .update(REFLECTIVE_QUESTION_LANGUAGE_OPERATOR_CANDIDATE_B_PROMPT.trim())
        .digest('hex')
    ).toBe(REFLECTIVE_QUESTION_LANGUAGE_OPERATOR_CANDIDATE_B_SHA256);
    expect(REFLECTIVE_QUESTION_LANGUAGE_OPERATOR_CANDIDATE_B_SHA256).toBe(
      '08cd3eaf6fd507d6eb19ba73714eecf6453ec8dd6a61f55068621c8ffd80f622'
    );
    expect(ACTIVE_REFLECTIVE_QUESTION_RD_SHA256).toBe(
      REFLECTIVE_QUESTION_LANGUAGE_OPERATOR_CANDIDATE_B_SHA256
    );
  });

  it('keeps REALIZATION verbatim', () => {
    expect(REFLECTIVE_QUESTION_LANGUAGE_OPERATOR_CANDIDATE_B_PROMPT).toContain(
      LANGUAGE_OPERATOR_REALIZATION_CONTRACT
    );
    expect(REFLECTIVE_QUESTION_LANGUAGE_OPERATOR_CANDIDATE_B_PROMPT).toContain(
      LANGUAGE_OPERATOR_OUTPUT_CONTRACT
    );
  });
});
