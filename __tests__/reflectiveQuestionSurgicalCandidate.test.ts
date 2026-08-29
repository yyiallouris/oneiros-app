import { readFileSync } from 'fs';
import path from 'path';
import {
  DREAM_REFLECTION_PROMPT_ID,
  FOLLOWUP_CHAT_PROMPT_ID,
  SAME_CALL_QUESTION_SAFEGUARDS,
  SAME_CALL_REFLECTIVE_QUESTIONS_BUNDLE,
  SAME_CALL_REFLECTIVE_QUESTIONS_METHOD_ID,
} from '../src/ai/dreamReflectionPrompt';
import {
  APPROVED_REFLECTIVE_QUESTION_PRODUCTION,
  DENIED_REFLECTIVE_QUESTION_PRODUCTION_CANDIDATES,
  PENDING_REFLECTIVE_DIALOGUE_PRODUCTION_CANDIDATE,
  hashReflectiveQuestionPrompt,
} from '../src/ai/reflectiveQuestionProductionHold';

const runner = readFileSync(
  path.join(__dirname, '../scripts/live/reflective-questions/run-v102-surgical-anchor-evaluation.ts'),
  'utf8'
);
const candidateRecord = readFileSync(
  path.join(__dirname, '../docs/ONEIROS_V102_SURGICAL_PATCH_CANDIDATE_2026-08-29.md'),
  'utf8'
);

describe('archived v1.0.2 surgical question candidate', () => {
  it('keeps runtime on exact approved v1.0.3 and denies the failed v1.0.2 candidate', () => {
    expect(DREAM_REFLECTION_PROMPT_ID).toBe('oneiros-dream-reflection-v3.2.3-candidate');
    expect(FOLLOWUP_CHAT_PROMPT_ID).toBe('oneiros-followup-chat-v2.0.1');
    expect(SAME_CALL_REFLECTIVE_QUESTIONS_METHOD_ID).toBe(
      'oneiros-same-call-reflective-questions-v1.0.3-candidate'
    );
    expect(hashReflectiveQuestionPrompt(SAME_CALL_REFLECTIVE_QUESTIONS_BUNDLE)).toBe(
      'f5399a4973fb84365a25967890169fc2475cb2e2a9f65f0dffd2a8993101d9e7'
    );
    expect(PENDING_REFLECTIVE_DIALOGUE_PRODUCTION_CANDIDATE.promptSha256).toBe(
      APPROVED_REFLECTIVE_QUESTION_PRODUCTION.promptSha256
    );
    expect(APPROVED_REFLECTIVE_QUESTION_PRODUCTION).toEqual({
      methodId: 'oneiros-same-call-reflective-questions-v1.0.3-candidate',
      promptSha256: 'f5399a4973fb84365a25967890169fc2475cb2e2a9f65f0dffd2a8993101d9e7',
    });
    expect(DENIED_REFLECTIVE_QUESTION_PRODUCTION_CANDIDATES).toEqual(
      expect.arrayContaining([
        {
          methodId: 'oneiros-same-call-reflective-questions-v1.0.2-candidate',
          promptSha256: '94d4a92a4a88d4104fa3dcc5790209a4fd3b34cec56dc1724eade78255798b96',
        },
      ])
    );
  });

  it('preserves the exact failed prompt delta as evidence, not runtime guidance', () => {
    expect(candidateRecord).toContain('Never supply candidate answer vocabulary');
    expect(candidateRecord).toContain('Do not reconstruct missing inner footage');
    expect(candidateRecord).toContain('Deepen the relation; do not widen the menu');
    expect(candidateRecord).toContain('Never retreat to generic shells');
    expect(SAME_CALL_QUESTION_SAFEGUARDS).not.toContain('Never supply candidate answer vocabulary');
    expect(SAME_CALL_QUESTION_SAFEGUARDS).not.toContain('Do not reconstruct missing inner footage');
    expect(SAME_CALL_QUESTION_SAFEGUARDS).not.toContain('Deepen the relation; do not widen the menu');
    expect(SAME_CALL_QUESTION_SAFEGUARDS).not.toContain('Never retreat to generic shells');
  });

  it('limits evaluation to frozen anchors and contains no retry or semantic judge', () => {
    expect(runner).toMatch(/READER_FAILURE_ANCHORS = \[/);
    expect(runner).toMatch(/CHAT_FAILURE_ANCHORS = \[/);
    expect(runner).toMatch(/CONTROL_ANCHORS = \[/);
    expect(runner).toMatch(/new Set\(anchorIds\)\.size !== 20/);
    expect(runner).toMatch(/COST_CAP_USD = 1/);
    expect(runner).toMatch(/model_retries: 0/);
    expect(runner).toMatch(/semantic_judge_calls: 0/);
    expect(runner).not.toMatch(/Gate|Repair|Composer|Premise/);
  });
});
