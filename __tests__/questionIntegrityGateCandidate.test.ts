import {
  buildQuestionIntegrityGateMessages,
  buildQuestionIntegrityGateResponseFormat,
  hashQuestionIntegrityGateBundle,
  parseQuestionIntegrityGateResult,
  QUESTION_INTEGRITY_GATE_BUNDLE_SHA256,
  QUESTION_INTEGRITY_GATE_METHOD_ID,
  QUESTION_INTEGRITY_GATE_MODEL,
  QUESTION_INTEGRITY_GATE_PROMPT,
  QUESTION_INTEGRITY_GATE_TASK,
  QUESTION_INTEGRITY_GATE_VIOLATION_IDS,
} from '../src/ai/rd/reflective-questions/questionIntegrityGate/questionIntegrityGateCandidate';
import { loadAndPrepareQuestionIntegrityGateCorpus } from '../scripts/lib/questionIntegrityGateCorpus';
import { SAME_CALL_MINIMAL_BUNDLE_SHA256 } from '../src/ai/rd/reflective-questions/sameCallMinimal/sameCallMinimalCandidate';

describe('question integrity gate R&D', () => {
  it('is a semantic cop only: no rewrite, no reading, no editorial score', () => {
    const messages = buildQuestionIntegrityGateMessages({
      dream: 'A fox waits at an open gate.',
      candidateQuestion: 'How does the waiting change when the gate stays open?',
      outputLanguage: 'en',
      questionMode: 'CORE',
    });
    const joined = messages.map((message) => message.content).join('\n');
    expect(QUESTION_INTEGRITY_GATE_METHOD_ID).toBe(
      'oneiros-question-integrity-gate-v1.0.0-candidate'
    );
    expect(QUESTION_INTEGRITY_GATE_MODEL).toBe('gpt-5.4');
    expect(QUESTION_INTEGRITY_GATE_TASK).toBe('reflective_question_validate');
    expect(QUESTION_INTEGRITY_GATE_PROMPT).toContain(
      'You do not decide whether a question is GOLD, SHIP, WEAK,\nor FAIL'
    );
    expect(QUESTION_INTEGRITY_GATE_PROMPT).toContain('You do not rewrite');
    expect(QUESTION_INTEGRITY_GATE_PROMPT).not.toContain('Write exactly one natural');
    expect(QUESTION_INTEGRITY_GATE_PROMPT).toContain('Do not use lexical matching as ground truth');
    expect(QUESTION_INTEGRITY_GATE_PROMPT).toContain('restorative or still dreams');
    expect(QUESTION_INTEGRITY_GATE_PROMPT).not.toContain('Camille');
    expect(QUESTION_INTEGRITY_GATE_PROMPT).not.toContain('κασκόλ');
    expect(QUESTION_INTEGRITY_GATE_PROMPT).not.toContain('HOME');
    expect(joined).toContain('<RAW_DREAM>');
    expect(joined).toContain('<CANDIDATE_QUESTION>');
    expect(joined).not.toContain('Core Shift');
    expect(joined).not.toContain('BEGIN_DREAM_READING');
    expect(QUESTION_INTEGRITY_GATE_VIOLATION_IDS).not.toContain('flat_no_live_point');
    expect(hashQuestionIntegrityGateBundle()).toBe(QUESTION_INTEGRITY_GATE_BUNDLE_SHA256);
    expect(QUESTION_INTEGRITY_GATE_BUNDLE_SHA256).toBe(
      'c1d8090fec6149adf492d1319657ba02bf5ae28ddfa5ce28114ef8a0df6629b2'
    );
    expect(SAME_CALL_MINIMAL_BUNDLE_SHA256).toBe(
      '4506c8981c1e0f38edcb641bf89e59126bfdafe64a3adff99a94a2d1a12e81f7'
    );
  });

  it('parses pass/fail without becoming a second Composer', () => {
    expect(parseQuestionIntegrityGateResult('{"pass":true,"violations":[]}')).toEqual({
      ok: true,
      data: { pass: true, violations: [] },
    });
    expect(parseQuestionIntegrityGateResult(
      '{"pass":false,"violations":["forced_choice"]}'
    )).toEqual({
      ok: true,
      data: { pass: false, violations: ['forced_choice'] },
    });
    expect(parseQuestionIntegrityGateResult('{"pass":true,"violations":["forced_choice"]}').ok)
      .toBe(false);
    expect(parseQuestionIntegrityGateResult('{"pass":false,"violations":[]}').ok).toBe(false);
    expect(parseQuestionIntegrityGateResult('{"pass":false,"violations":["flat_no_live_point"]}').ok)
      .toBe(false);
    const format = buildQuestionIntegrityGateResponseFormat();
    expect(format.json_schema.schema.required).toEqual(['pass', 'violations']);
    expect(format.json_schema.schema.properties).not.toHaveProperty('question');
  });

  it('loads the frozen 24-question Phase 1 corpus without readings', () => {
    const prepared = loadAndPrepareQuestionIntegrityGateCorpus();
    expect(prepared.cases).toHaveLength(24);
    expect(prepared.cases.filter((item) => item.expect_gate_fail)).toHaveLength(5);
    expect(prepared.cases.filter((item) => item.role === 'hard_fail_regression').map((item) => item.id).sort()).toEqual([
      'ja-neon-home:advanced',
      'shared-scarf-at-harbor:quick',
      'zh-faguo-mingzi:advanced',
      'zh-faguo-mingzi:quick',
      'zh-faguo-mingzi:standard',
    ]);
    expect(prepared.cases.every((item) => item.dream.trim().length > 0)).toBe(true);
    expect(prepared.cases.every((item) => item.question.trim().length > 0)).toBe(true);
  });
});
