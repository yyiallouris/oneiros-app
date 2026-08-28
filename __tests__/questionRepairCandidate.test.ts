import { readFileSync } from 'fs';
import path from 'path';
import {
  buildQuestionRepairMessages,
  hashQuestionRepairBundle,
  parseQuestionRepairResult,
  PHASE2_REJECTED_IDS,
  QUESTION_REPAIR_BUNDLE_SHA256,
  QUESTION_REPAIR_METHOD_ID,
  QUESTION_REPAIR_MODEL,
  QUESTION_REPAIR_PROMPT,
  QUESTION_REPAIR_TASK,
} from '../src/ai/rd/reflective-questions/questionIntegrityGate/questionRepairCandidate';
import {
  hashQuestionIntegrityGateBundle,
  QUESTION_INTEGRITY_GATE_BUNDLE_SHA256,
} from '../src/ai/rd/reflective-questions/questionIntegrityGate/questionIntegrityGateCandidate';
import { SAME_CALL_MINIMAL_BUNDLE_SHA256 } from '../src/ai/rd/reflective-questions/sameCallMinimal/sameCallMinimalCandidate';

describe('question repair Phase 2 R&D', () => {
  it('keeps the Integrity Gate frozen and Repair reading-free', () => {
    const messages = buildQuestionRepairMessages({
      dream: 'A fox waits at an open gate.',
      rejectedQuestion: 'Which is more alive, the fox or the gate?',
      violations: ['forced_choice', 'ranking_or_comparison'],
      outputLanguage: 'en',
      questionMode: 'CORE',
    });
    const joined = messages.map((message) => message.content).join('\n');
    expect(QUESTION_REPAIR_METHOD_ID).toBe('oneiros-question-repair-v1.0.0-candidate');
    expect(QUESTION_REPAIR_MODEL).toBe('gpt-5.4');
    expect(QUESTION_REPAIR_TASK).toBe('reflective_question_generate');
    expect(QUESTION_REPAIR_PROMPT).toMatch(/smallest conceptual\s+correction/);
    expect(QUESTION_REPAIR_PROMPT).toContain('not a second Composer');
    expect(QUESTION_REPAIR_PROMPT).not.toContain('Camille');
    expect(QUESTION_REPAIR_PROMPT).not.toContain('φυτεύεσαι');
    expect(joined).toContain('<RAW_DREAM>');
    expect(joined).toContain('<REJECTED_CANDIDATE_QUESTION>');
    expect(joined).toContain('forced_choice');
    expect(joined).not.toContain('Core Shift');
    expect(joined).not.toContain('BEGIN_DREAM_READING');
    expect(PHASE2_REJECTED_IDS).toHaveLength(7);
    expect(hashQuestionIntegrityGateBundle()).toBe(QUESTION_INTEGRITY_GATE_BUNDLE_SHA256);
    expect(QUESTION_INTEGRITY_GATE_BUNDLE_SHA256).toBe(
      'c1d8090fec6149adf492d1319657ba02bf5ae28ddfa5ce28114ef8a0df6629b2'
    );
    expect(hashQuestionRepairBundle()).toBe(QUESTION_REPAIR_BUNDLE_SHA256);
    expect(QUESTION_REPAIR_BUNDLE_SHA256).toBe(
      '0859fd5474124613b7c5cd610d4f48e65ccee6f0ea05b8d4ca382ddd5a53d53b'
    );
    expect(SAME_CALL_MINIMAL_BUNDLE_SHA256).toBe(
      '4506c8981c1e0f38edcb641bf89e59126bfdafe64a3adff99a94a2d1a12e81f7'
    );
  });

  it('parses a single repaired question', () => {
    expect(parseQuestionRepairResult('{"question":"How does the waiting change at the gate?"}')).toEqual({
      ok: true,
      data: { question: 'How does the waiting change at the gate?' },
    });
    expect(parseQuestionRepairResult('{"question":"","extra":true}').ok).toBe(false);
    expect(parseQuestionRepairResult('{"pass":true,"violations":[]}').ok).toBe(false);
  });

  it('freezes the closed-architecture editorial FAIL without mutating prompts', () => {
    const closeout = readFileSync(
      path.join(__dirname, '../docs/ONEIROS_QUESTION_REPAIR_PHASE2_EDITORIAL_FAIL_2026-08-29.md'),
      'utf8'
    );
    expect(closeout).toMatch(/MECHANICAL PASS \/ EDITORIAL FAIL\. STOP\./);
    expect(closeout).toMatch(
      /CLOSED FOR CURRENT ARCHITECTURE — product grammar solved, production reliability unresolved\./
    );
    expect(closeout).toMatch(/GOLD\+SHIP = \*\*16\/24\*\*/);
    expect(closeout).toMatch(/Do not deploy Generator \+ Gate \+ Repair/);
    expect(closeout).toMatch(/ja-neon-home:standard/);
    expect(closeout).toContain(QUESTION_REPAIR_BUNDLE_SHA256);
    expect(closeout).toContain(QUESTION_INTEGRITY_GATE_BUNDLE_SHA256);
    expect(hashQuestionRepairBundle()).toBe(QUESTION_REPAIR_BUNDLE_SHA256);
    expect(hashQuestionIntegrityGateBundle()).toBe(QUESTION_INTEGRITY_GATE_BUNDLE_SHA256);
  });
});
