import {
  REFLECTIVE_QUESTION_METHOD_ID,
  REFLECTIVE_QUESTION_METHOD_PROMPT,
  REFLECTIVE_QUESTION_METHOD_VERSION,
} from '../src/ai/reflectiveQuestionPrompt';
import {
  APPROVED_REFLECTIVE_QUESTION_PRODUCTION,
  RECOVERED_DEPLOYED_REFLECTIVE_QUESTION_PROMPT,
  RECOVERED_DEPLOYED_REFLECTIVE_QUESTION_PROMPT_SHA256,
  hashReflectiveQuestionPrompt,
} from '../src/ai/reflectiveQuestionProductionHold';

describe('production reflective-question method', () => {
  it('is the recovered v105 psychological-aliveness identity', () => {
    expect(REFLECTIVE_QUESTION_METHOD_ID).toBe(
      'reflective-question-psychological-aliveness-v1.4.0'
    );
    expect(REFLECTIVE_QUESTION_METHOD_VERSION).toBe('1.4.0');
    expect(hashReflectiveQuestionPrompt(REFLECTIVE_QUESTION_METHOD_PROMPT)).toBe(
      '4885e351ff6a20ceb8257c004aacd66e390e4c0902455a1cf5ff4d0df5a0238d'
    );
    expect(RECOVERED_DEPLOYED_REFLECTIVE_QUESTION_PROMPT).toBe(
      REFLECTIVE_QUESTION_METHOD_PROMPT
    );
    expect(RECOVERED_DEPLOYED_REFLECTIVE_QUESTION_PROMPT_SHA256).toBe(
      APPROVED_REFLECTIVE_QUESTION_PRODUCTION.promptSha256
    );
  });

  it('defaults 1–2 surfaces to one question without forcing somatic-first sequence', () => {
    expect(REFLECTIVE_QUESTION_METHOD_PROMPT).toContain(
      'Cardinality when a surface permits 1–2 questions:'
    );
    expect(REFLECTIVE_QUESTION_METHOD_PROMPT).toContain('Default to one question.');
    expect(REFLECTIVE_QUESTION_METHOD_PROMPT).not.toContain(
      'fixed somatic-first/symbolic-second'
    );
  });
});
