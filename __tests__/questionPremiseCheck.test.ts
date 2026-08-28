import {
  buildQuestionPremiseCheckMessages,
  buildQuestionPremiseCheckResponseFormat,
  hashQuestionPremiseCheckBundle,
  parseQuestionPremiseCheckResult,
  QUESTION_PREMISE_CHECK_BUNDLE_SHA256,
  QUESTION_PREMISE_CHECK_METHOD_ID,
  QUESTION_PREMISE_CHECK_MODEL,
  QUESTION_PREMISE_CHECK_PROMPT,
  QUESTION_PREMISE_CHECK_TASK,
  QUESTION_PREMISE_CHECK_TEMPERATURE,
} from '../src/ai/questionPremiseCheck';

describe('question premise check', () => {
  it('is a narrow evidence cop: no rewrite, no reading, no quality score', () => {
    const messages = buildQuestionPremiseCheckMessages({
      dream: 'HOME moves slightly on the water while I stay on the shore.',
      question: 'How did HOME’s small movement maintain the distance between you?',
      outputLanguage: 'en',
    });
    const joined = messages.map((message) => message.content).join('\n');
    expect(QUESTION_PREMISE_CHECK_METHOD_ID).toBe(
      'oneiros-question-premise-check-v1.0.0-candidate'
    );
    expect(QUESTION_PREMISE_CHECK_MODEL).toBe('gpt-5.4');
    expect(QUESTION_PREMISE_CHECK_TEMPERATURE).toBe(0);
    expect(QUESTION_PREMISE_CHECK_TASK).toBe('reflective_question_validate');
    expect(QUESTION_PREMISE_CHECK_PROMPT).toContain('You do not interpret dreams.');
    expect(QUESTION_PREMISE_CHECK_PROMPT).toContain('You do not rewrite questions.');
    expect(QUESTION_PREMISE_CHECK_PROMPT).toContain(
      'embedding an inferred relation or causal claim'
    );
    expect(QUESTION_PREMISE_CHECK_PROMPT).not.toContain('HOME');
    expect(QUESTION_PREMISE_CHECK_PROMPT).not.toContain('Camille');
    expect(QUESTION_PREMISE_CHECK_PROMPT).not.toContain('GOLD');
    expect(joined).toContain('<RAW_DREAM>');
    expect(joined).toContain('<QUESTION>');
    expect(joined).toContain('<OUTPUT_LANGUAGE>');
    expect(joined).not.toContain('<QUESTION_MODE>');
    expect(joined).not.toContain('<INTEGRITY_VIOLATIONS>');
    expect(joined).not.toContain('Core Shift');
    expect(hashQuestionPremiseCheckBundle()).toBe(QUESTION_PREMISE_CHECK_BUNDLE_SHA256);
    expect(QUESTION_PREMISE_CHECK_BUNDLE_SHA256).toBe(
      'ceca45684d24ab1a0de374373b2c705e4eb75f7d18001a615246551289368130'
    );
  });

  it('parses PASS/FAIL only', () => {
    expect(parseQuestionPremiseCheckResult('{"decision":"PASS"}')).toEqual({
      ok: true,
      data: { decision: 'PASS' },
    });
    expect(parseQuestionPremiseCheckResult('{"decision":"FAIL"}')).toEqual({
      ok: true,
      data: { decision: 'FAIL' },
    });
    expect(parseQuestionPremiseCheckResult('{"decision":"PASS","reason":"no"}').ok).toBe(false);
    expect(parseQuestionPremiseCheckResult('{"pass":true}').ok).toBe(false);
    const format = buildQuestionPremiseCheckResponseFormat();
    expect(format.json_schema.schema.required).toEqual(['decision']);
    expect(format.json_schema.schema.properties).not.toHaveProperty('question');
  });
});
