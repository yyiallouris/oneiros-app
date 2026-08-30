import { createHash } from 'crypto';
import { readFileSync } from 'fs';
import path from 'path';
import {
  buildInitialReflectionRequest,
  SAME_CALL_QUESTION_SAFEGUARDS,
  SAME_CALL_REFLECTIVE_QUESTIONS_METHOD_ID,
  SAME_CALL_STANDARD_ADVANCED_QUESTIONS,
} from '../src/ai/dreamReflectionPrompt';
import {
  ADAPTIVE_FULL_INITIAL_USER_DIRECTIVE,
  ADAPTIVE_OPENINGS_BUNDLE,
  ADAPTIVE_OPENINGS_BUNDLE_SHA256,
  ADAPTIVE_OPENINGS_CANDIDATE_STATUS,
  ADAPTIVE_OPENINGS_METHOD_ID,
  ADAPTIVE_OPENINGS_READER_PROMPT_ID,
  ADAPTIVE_OPENING_SELECTION_RULE,
  ADAPTIVE_QUICK_INITIAL_USER_DIRECTIVE,
  ADAPTIVE_QUICK_QUESTION_INSTRUCTION,
  ADAPTIVE_STANDARD_ADVANCED_QUESTIONS,
  buildAdaptiveOpeningsInitialRequest,
  PRODUCTION_SYMBOLIC_RELATIONAL_IMAGINAL_Q2,
} from '../src/ai/rd/reflective-questions/adaptiveOpeningsCandidate';
import {
  ADAPTIVE_OPENINGS_OBSERVER_VERSION,
  observeAdaptiveOpenings,
} from '../src/ai/rd/reflective-questions/adaptiveOpeningsObservation';
import { V103_ENACTED_RELATION_Q1 } from '../src/ai/rd/reflective-questions/v103EnactedRelationCandidate';
import {
  APPROVED_REFLECTIVE_QUESTION_PRODUCTION,
  DENIED_REFLECTIVE_QUESTION_PRODUCTION_CANDIDATES,
  hashReflectiveQuestionPrompt,
} from '../src/ai/reflectiveQuestionProductionHold';
import { normalizeReflectiveQuestions } from '../src/ai/reflectiveQuestionExtract';

const repoRoot = path.resolve(__dirname, '..');
const fixturePath = path.join(
  repoRoot,
  'testing/reflective-questions/adaptive-openings-feasibility-2026-08-29.json'
);
const fixtureSha =
  '4b361245bc58ab7856d0ad48421f2b6f8c25a5d5e11fadb5275b83c6f1312d71';
const marker = '<!--END_DREAM_READING-->';
const dream = {
  title: 'Adaptive parity',
  date: '2026-08-29',
  content: 'My sister opened the gate. A blue feather remained on the path.',
};

describe('one-shot Adaptive Reflective Openings candidate', () => {
  it('is frozen, undeployable, and leaves canonical production pinned', () => {
    expect(ADAPTIVE_OPENINGS_CANDIDATE_STATUS).toBe(
      'frozen_one_shot_feasibility_candidate'
    );
    expect(SAME_CALL_REFLECTIVE_QUESTIONS_METHOD_ID).toBe(
      'oneiros-same-call-reflective-questions-v1.0.3-candidate'
    );
    expect(APPROVED_REFLECTIVE_QUESTION_PRODUCTION).toEqual({
      methodId: 'oneiros-same-call-reflective-questions-v1.0.3-candidate',
      promptSha256: 'f5399a4973fb84365a25967890169fc2475cb2e2a9f65f0dffd2a8993101d9e7',
    });
    expect(DENIED_REFLECTIVE_QUESTION_PRODUCTION_CANDIDATES).toContainEqual({
      methodId: ADAPTIVE_OPENINGS_METHOD_ID,
      promptSha256: ADAPTIVE_OPENINGS_BUNDLE_SHA256,
    });
  });

  it('pins the exact candidate bundle and keeps production Q1/Q2 bytes unchanged', () => {
    expect(hashReflectiveQuestionPrompt(ADAPTIVE_OPENINGS_BUNDLE)).toBe(
      ADAPTIVE_OPENINGS_BUNDLE_SHA256
    );
    expect(SAME_CALL_STANDARD_ADVANCED_QUESTIONS).toContain(V103_ENACTED_RELATION_Q1);
    expect(SAME_CALL_STANDARD_ADVANCED_QUESTIONS).toContain(
      PRODUCTION_SYMBOLIC_RELATIONAL_IMAGINAL_Q2
    );
    expect(ADAPTIVE_STANDARD_ADVANCED_QUESTIONS).toContain(V103_ENACTED_RELATION_Q1);
    expect(ADAPTIVE_STANDARD_ADVANCED_QUESTIONS).toContain(
      PRODUCTION_SYMBOLIC_RELATIONAL_IMAGINAL_Q2
    );
    expect(ADAPTIVE_STANDARD_ADVANCED_QUESTIONS).toContain(
      SAME_CALL_QUESTION_SAFEGUARDS
    );
    expect(ADAPTIVE_QUICK_QUESTION_INSTRUCTION).toContain(V103_ENACTED_RELATION_Q1);
    expect(ADAPTIVE_QUICK_QUESTION_INSTRUCTION).toContain(
      PRODUCTION_SYMBOLIC_RELATIONAL_IMAGINAL_Q2
    );
    expect(ADAPTIVE_OPENINGS_BUNDLE).not.toMatch(
      /imaginal handoff|source ownership|oneiros-same-call-reflective-questions-v1\.0\.[45]/iu
    );
  });

  it('contains one adaptive selection rule without a safeguard or architecture stack', () => {
    expect(ADAPTIVE_OPENING_SELECTION_RULE).toContain(
      'Evaluate the enacted and imaginal openings independently.'
    );
    expect(ADAPTIVE_OPENING_SELECTION_RULE).toContain(
      'Never create a weaker, repetitive, manufactured, or unnecessary opening merely to fill a slot.'
    );
    expect(ADAPTIVE_OPENING_SELECTION_RULE).not.toMatch(
      /judge|repair|rerank|composer|gate|premise|retry/iu
    );
    expect(ADAPTIVE_STANDARD_ADVANCED_QUESTIONS).toContain(
      'Return 1 or 2 questions as markdown bullets. At least one. No more than two.'
    );
    expect(ADAPTIVE_QUICK_QUESTION_INSTRUCTION).toContain(
      'choose the single strongest earned opening'
    );
    expect(ADAPTIVE_QUICK_QUESTION_INSTRUCTION).not.toContain('Return two questions');
  });

  it.each(['quick', 'standard', 'advanced'] as const)(
    'changes only the surface selection/cardinality instruction for %s',
    (depth) => {
      const production = buildInitialReflectionRequest(dream, depth);
      const candidate = buildAdaptiveOpeningsInitialRequest(dream, depth);
      expect(candidate.task).toBe(production.task);
      expect(candidate.temperature).toBe(production.temperature);
      expect(candidate.tokenLimit).toBe(production.tokenLimit);
      expect(candidate.reflectiveLanguageContext).toEqual(
        production.reflectiveLanguageContext
      );
      expect(candidate.messages).toHaveLength(production.messages.length);
      expect(candidate.messages.filter((_, index) => index !== 2 && index !== 4)).toEqual(
        production.messages.filter((_, index) => index !== 2 && index !== 4)
      );

      const revertedSystem = depth === 'quick'
        ? candidate.messages[2].content.replace(
          ADAPTIVE_QUICK_QUESTION_INSTRUCTION,
          '- End with exactly one natural reflective question as the final sentence or short paragraph. No Reflective Questions heading.'
        )
        : candidate.messages[2].content.replace(
          ADAPTIVE_STANDARD_ADVANCED_QUESTIONS,
          SAME_CALL_STANDARD_ADVANCED_QUESTIONS
        );
      const revertedUser = depth === 'quick'
        ? candidate.messages[4].content.replace(
          ADAPTIVE_QUICK_INITIAL_USER_DIRECTIVE,
          `Give 1–2 short paragraphs. No conclusions
or advice. End with exactly one observational or imaginal reflective question.`
        )
        : candidate.messages[4].content.replace(
          ADAPTIVE_FULL_INITIAL_USER_DIRECTIVE,
          `Follow the one or two images with the
strongest specific gravity and the actual movement they create. Do not give
conclusions. End with exactly two reflective questions under Reflective Questions.`
        );
      expect(revertedSystem).toBe(production.messages[2].content);
      expect(revertedUser).toBe(production.messages[4].content);
    }
  );

  it('observes Quick 1 and Standard/Advanced 1–2 without normalizing content', () => {
    const quick = `A blue feather remains on the path.\n\nWhat stays alive in that blue feather?\n${marker}`;
    const standardOne = `## Core State\n\nThe path is quiet.\n\n## Dream Movement\n\nThe feather remains.\n\n## Reflective Questions\n\n- What remains alive in the blue feather?\n${marker}`;
    const advancedTwo = `## Core Shift\n\nThe gate opens.\n\n## Dream Movement\n\nThe feather remains.\n\n## Reflective Questions\n\n- What changes when your sister opens the gate?\n- What remains alive in the blue feather?\n${marker}`;

    expect(observeAdaptiveOpenings({ content: quick, surface: 'quick' })).toMatchObject({
      passed: true,
      observer_version: ADAPTIVE_OPENINGS_OBSERVER_VERSION,
      question_count: 1,
      heading_count: 0,
    });
    const observedOne = observeAdaptiveOpenings({
      content: standardOne,
      surface: 'standard',
    });
    expect(observedOne).toMatchObject({
      passed: true,
      question_count: 1,
      heading_count: 1,
    });
    expect(observedOne.production_shadow).toMatchObject({
      passed: false,
      expected_question_count: 2,
    });
    expect(observeAdaptiveOpenings({
      content: advancedTwo,
      surface: 'advanced',
    })).toMatchObject({
      passed: true,
      question_count: 2,
      heading_count: 1,
    });
  });

  it('fails closed structurally in R&D without repair or semantic classification', () => {
    const missingHeading = `## Core State\n\nText.\n\n## Dream Movement\n\nText.\n\n- What remains?\n${marker}`;
    const three = `## Core State\n\nText.\n\n## Dream Movement\n\nText.\n\n## Reflective Questions\n\n- What moves?\n- What remains?\n- What opens?\n${marker}`;
    const proseQuestion = `## Core State\n\nWhy now?\n\n## Dream Movement\n\nText.\n\n## Reflective Questions\n\n- What remains?\n${marker}`;

    expect(observeAdaptiveOpenings({
      content: missingHeading,
      surface: 'standard',
    }).issues).toContain('missing_reflective_questions_heading');
    expect(observeAdaptiveOpenings({
      content: three,
      surface: 'standard',
    }).issues).toContain('adaptive_question_count_mismatch');
    expect(observeAdaptiveOpenings({
      content: proseQuestion,
      surface: 'standard',
    }).issues).toContain('extra_question_outside_reflective_opening');
  });

  it('keeps known language-agnostic validator edges out of the R&D verdict', () => {
    const englishRequest = buildAdaptiveOpeningsInitialRequest(dream, 'advanced');
    const english = `## Core Shift\n\nThe sentence is finished.\n\n## Dream Movement\n\nThe room continues.\n\n## Reflective Questions\n\n- What kind of importance gathers around the finished sentence?\n${marker}`;
    const englishObserved = observeAdaptiveOpenings({
      content: english,
      surface: 'advanced',
      languageContext: englishRequest.reflectiveLanguageContext,
    });
    expect(englishObserved.production_shadow.issues).toContain(
      'manufactured_answer_menu'
    );
    expect(englishObserved.issues).not.toContain('manufactured_answer_menu');

    const japaneseDream = {
      title: '庭',
      date: '2026-08-29',
      content: '庭の池のそばで傘を閉じると、水が消えました。',
    };
    const japaneseRequest = buildAdaptiveOpeningsInitialRequest(japaneseDream, 'quick');
    const japanese = `池の水が静かに消えます。\n\nこの濡れた石は何を残していますか。\n${marker}`;
    expect(observeAdaptiveOpenings({
      content: japanese,
      surface: 'quick',
      languageContext: japaneseRequest.reflectiveLanguageContext,
    })).toMatchObject({
      passed: true,
      question_count: 1,
      questions: ['この濡れた石は何を残していますか。'],
    });
  });

  it('pins the 10-dream fixture, split, target cohorts, allowed sets, and run lock', () => {
    const fixtureRaw = readFileSync(fixturePath, 'utf8');
    const fixture = JSON.parse(fixtureRaw) as {
      candidate: { method_id: string; bundle_sha256: string; reader_prompt_id: string };
      scope: Record<string, number>;
      cohort_requirements: Record<string, number>;
      acceptance_gate: Record<string, unknown>;
      cases: Array<{
        id: string;
        language: string;
        mode: string;
        cohort: string;
        dream: string;
        expected_standard_deeper: { allowed_set: string[] };
        quick_expected_strongest: { allowed_set: string[] };
      }>;
    };
    expect(createHash('sha256').update(fixtureRaw).digest('hex')).toBe(fixtureSha);
    expect(fixture.candidate).toEqual({
      method_id: ADAPTIVE_OPENINGS_METHOD_ID,
      bundle_sha256: ADAPTIVE_OPENINGS_BUNDLE_SHA256,
      reader_prompt_id: ADAPTIVE_OPENINGS_READER_PROMPT_ID,
    });
    expect(fixture.cases).toHaveLength(10);
    expect(fixture.scope).toMatchObject({
      quick_calls: 10,
      standard_calls: 5,
      advanced_calls: 5,
      planned_calls: 20,
      hard_cost_cap_usd: 1,
      conservative_reserved_packet_cost_usd: 0.9,
    });
    expect(fixture.cohort_requirements).toEqual({
      enacted_only: 2,
      imaginal_only: 2,
      both: 4,
      ambiguous: 2,
    });
    expect(fixture.cases.filter((item) => item.mode === 'standard')).toHaveLength(5);
    expect(fixture.cases.filter((item) => item.mode === 'advanced')).toHaveLength(5);
    expect(fixture.cases.some((item) => item.dream === 'ημουν κατω απο τον ζεστο ηλιο, χαρουμενος'))
      .toBe(true);
    expect(fixture.cases.every((item) =>
      item.expected_standard_deeper.allowed_set.length > 0 &&
      item.quick_expected_strongest.allowed_set.length > 0
    )).toBe(true);
    expect(fixture.acceptance_gate).toMatchObject({
      standard_advanced_correct_min: 9,
      quick_strongest_correct_min: 9,
      enacted_only_correct_min: 2,
      imaginal_only_correct_min: 2,
      both_strong_two_min: 3,
      recurring_failure_family_threshold: 2,
      no_automatic_second_candidate: true,
    });

    const runner = readFileSync(
      path.join(
        repoRoot,
        'scripts/live/reflective-questions/run-adaptive-openings-feasibility.ts'
      ),
      'utf8'
    );
    expect(runner).toContain('ONEIROS_ADAPTIVE_OPENINGS_COST_APPROVED');
    expect(runner).toContain(fixtureSha);
    expect(runner).toContain('EXPECTED_CALLS = 20');
    expect(runner).toContain('HARD_COST_CAP_USD = 1');
    expect(runner).toContain('PENDING_BLIND_REVIEW');
    expect(runner).not.toMatch(/normalizeCompletedReflectiveQuestionStructure/);
  });

  it('confirms existing storage/UI-compatible array handling accepts one or two questions', () => {
    expect(normalizeReflectiveQuestions(['One?'])).toEqual(['One?']);
    expect(normalizeReflectiveQuestions(['One?', 'Two?'])).toEqual(['One?', 'Two?']);
    const dreamDetail = readFileSync(
      path.join(repoRoot, 'src/screens/DreamDetailScreen.tsx'),
      'utf8'
    );
    expect(dreamDetail).not.toMatch(/reflectiveQuestions\s*\[\s*1\s*\]/u);
  });
});
