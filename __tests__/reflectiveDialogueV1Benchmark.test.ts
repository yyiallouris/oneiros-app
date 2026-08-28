import { readFileSync } from 'fs';
import path from 'path';
import {
  REFLECTIVE_DIALOGUE_HUMAN_QUALITY_GATE,
  REFLECTIVE_DIALOGUE_V1_SCENARIOS,
  selectReflectiveDialogueV1Scenarios,
  assertReflectiveDialogueV1PaidScope,
  summarizeReflectiveDialogueV1Benchmark,
} from '../scripts/lib/reflectiveDialogueV1Benchmark';

describe('Reflective Dialogue v1 synthetic trajectory benchmark', () => {
  it('freezes eight Greek plus eight multilingual user-response trajectories', () => {
    expect(REFLECTIVE_DIALOGUE_V1_SCENARIOS).toHaveLength(16);
    expect(new Set(REFLECTIVE_DIALOGUE_V1_SCENARIOS.map((item) => item.id)).size).toBe(16);
    expect(
      new Set(REFLECTIVE_DIALOGUE_V1_SCENARIOS.map((item) => item.responseType))
    ).toEqual(
      new Set([
        'sensory_answer',
        'correction',
        'not_knowing',
        'waking_association',
        'meaning_request',
        'positive_coherence',
        'grief_response',
        'brief_completion',
        'language_switch',
        'ambiguous_short_reply',
      ])
    );
    expect(
      REFLECTIVE_DIALOGUE_V1_SCENARIOS.every(
        (item) =>
          item.dream.trim() &&
          item.priorReading.trim() &&
          item.visibleQuestion.trim() &&
          item.userReply.trim()
      )
    ).toBe(true);
    expect(new Set(REFLECTIVE_DIALOGUE_V1_SCENARIOS.map((item) => item.language))).toEqual(
      new Set(['el', 'es', 'fr', 'ru', 'ja', 'zh', 'en', 'pl'])
    );
  });

  it('summarizes optional questions, abstentions, boundaries, and failures', () => {
    expect(
      summarizeReflectiveDialogueV1Benchmark([
        {
          status: 'question',
          answerQuestionParagraphRemoved: false,
          userEvidenceCount: 1,
        },
        {
          status: 'abstain',
          answerQuestionParagraphRemoved: true,
          userEvidenceCount: 1,
        },
        {
          status: 'technical_failure',
          answerQuestionParagraphRemoved: false,
          userEvidenceCount: 0,
        },
      ])
    ).toEqual({
      total_cases: 3,
      question_count: 1,
      abstention_count: 1,
      technical_failure_count: 1,
      answer_question_paragraphs_removed: 1,
      cases_with_user_evidence: 2,
    });
  });

  it('selects a cost-bounded diagnostic subset and rejects unknown or duplicate ids', () => {
    expect(
      selectReflectiveDialogueV1Scenarios([
        'ordinary-not-knowing',
        'polish-natural-completion',
      ]).map((scenario) => scenario.id)
    ).toEqual(['ordinary-not-knowing', 'polish-natural-completion']);
    expect(() =>
      selectReflectiveDialogueV1Scenarios(['ordinary-not-knowing', 'ordinary-not-knowing'])
    ).toThrow(/unique/);
    expect(() =>
      selectReflectiveDialogueV1Scenarios(['not-a-real-scenario'])
    ).toThrow(/Unknown/);
  });

  it('caps paid dialogue iteration at eight unless a full packet is authorized', () => {
    expect(() =>
      assertReflectiveDialogueV1PaidScope({
        scenarioCount: 8,
        explicitFullRunApproval: false,
      })
    ).not.toThrow();
    expect(() =>
      assertReflectiveDialogueV1PaidScope({
        scenarioCount: 16,
        explicitFullRunApproval: false,
      })
    ).toThrow(/capped at 8/);
  });

  it('keeps mechanical status separate from blind dialogue-quality approval', () => {
    expect(REFLECTIVE_DIALOGUE_HUMAN_QUALITY_GATE.status).toBe(
      'pending_human_review'
    );
    expect(REFLECTIVE_DIALOGUE_HUMAN_QUALITY_GATE.dimensions).toEqual(
      expect.arrayContaining([
        'user_answer_uptake',
        'psychic_expansion',
        'genuine_desire_to_continue',
        'next_opening_quality',
      ])
    );
    expect(REFLECTIVE_DIALOGUE_HUMAN_QUALITY_GATE.judgment).toBe(
      'next_question_preferable_to_abstain'
    );
  });

  it('runs the exact shared production builders without importing R&D', () => {
    const runner = readFileSync(
      path.join(
        __dirname,
        '..',
        'scripts/live/reflective-dialogue/run-v1-trajectory-benchmark.ts'
      ),
      'utf8'
    );
    expect(runner).toContain('buildChatFollowupRequest');
    expect(runner).toContain('buildUserEvidenceSpans');
    expect(runner).toContain('buildReflectiveQuestionMessages');
    expect(runner).toContain('buildReflectiveQuestionResponseFormat');
    expect(runner).not.toContain("task: 'reflective_question_validate'");
    expect(runner).toContain('PENDING_REFLECTIVE_DIALOGUE_PRODUCTION_CANDIDATE');
    expect(runner).not.toMatch(/src\/ai\/rd|run-active-candidate|archive\/reflective-questions/);
  });
});
