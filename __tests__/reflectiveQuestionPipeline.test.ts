import {
  PREMISE_FAIL_REPAIR_VIOLATION,
  REFLECTIVE_QUESTION_PRODUCTION_METHOD_ID,
  mapReadingDepthToProductionQuestionMode,
  resolveProductionReflectiveQuestion,
  type ReflectiveQuestionPipelineDeps,
} from '../src/ai/reflectiveQuestionPipeline';
import {
  getReflectiveQuestionFallback,
  REFLECTIVE_QUESTION_COPY,
  REFLECTIVE_QUESTION_FALLBACK_VERSION,
} from '../src/constants/reflectiveQuestionCopy';
import { ONEIROS_LANGUAGE_CODES } from '../src/constants/oneirosLanguages';
import { SAME_CALL_MINIMAL_BUNDLE_SHA256 } from '../src/ai/rd/reflective-questions/sameCallMinimal/sameCallMinimalCandidate';
import { QUESTION_INTEGRITY_GATE_BUNDLE_SHA256 } from '../src/ai/rd/reflective-questions/questionIntegrityGate/questionIntegrityGateCandidate';
import { QUESTION_REPAIR_BUNDLE_SHA256 } from '../src/ai/rd/reflective-questions/questionIntegrityGate/questionRepairCandidate';
import { QUESTION_PREMISE_CHECK_BUNDLE_SHA256 } from '../src/ai/questionPremiseCheck';
import { APPROVED_REFLECTIVE_QUESTION_PRODUCTION } from '../src/ai/reflectiveQuestionProductionHold';
import { loadAndPrepareQuestionIntegrityGateCorpus } from '../scripts/lib/questionIntegrityGateCorpus';

const HOME_STANDARD =
  '岸にとどまったまま見ているあいだ、「HOME」の小さな揺れはあなたとの距離をどう保っていましたか。';
const ORIGINAL = 'How does the waiting change while the gate stays open?';
const REPAIRED = 'What do you notice in the waiting while the gate stays open?';
const FALLBACK = 'If you return to this dream for a moment, what do you notice now?';

function deps(overrides: Partial<ReflectiveQuestionPipelineDeps> = {}): ReflectiveQuestionPipelineDeps {
  return {
    runIntegrityGate: jest.fn(async () => ({ pass: true, violations: [] })),
    runPremiseCheck: jest.fn(async () => ({ pass: true })),
    runRepair: jest.fn(async () => REPAIRED),
    ...overrides,
  };
}

describe('CLOSED R&D reflective question pipeline (not launch runtime)', () => {
  it('keeps frozen component identities and maps reading depth', () => {
    expect(REFLECTIVE_QUESTION_PRODUCTION_METHOD_ID).toBe(
      'oneiros-reflective-question-production-v1.0.0'
    );
    expect(SAME_CALL_MINIMAL_BUNDLE_SHA256).toBe(
      '4506c8981c1e0f38edcb641bf89e59126bfdafe64a3adff99a94a2d1a12e81f7'
    );
    expect(QUESTION_INTEGRITY_GATE_BUNDLE_SHA256).toBe(
      'c1d8090fec6149adf492d1319657ba02bf5ae28ddfa5ce28114ef8a0df6629b2'
    );
    expect(QUESTION_REPAIR_BUNDLE_SHA256).toBe(
      '0859fd5474124613b7c5cd610d4f48e65ccee6f0ea05b8d4ca382ddd5a53d53b'
    );
    expect(QUESTION_PREMISE_CHECK_BUNDLE_SHA256).toBe(
      'ceca45684d24ab1a0de374373b2c705e4eb75f7d18001a615246551289368130'
    );
    expect(REFLECTIVE_QUESTION_FALLBACK_VERSION).toBe('reflective-question-fallback-v1');
    expect(mapReadingDepthToProductionQuestionMode('quick')).toBe('CORE');
    expect(mapReadingDepthToProductionQuestionMode('standard')).toBe('CORE');
    expect(mapReadingDepthToProductionQuestionMode('advanced')).toBe('DEEPER');
    expect(APPROVED_REFLECTIVE_QUESTION_PRODUCTION.methodId).not.toBe(
      REFLECTIVE_QUESTION_PRODUCTION_METHOD_ID
    );
    expect(APPROVED_REFLECTIVE_QUESTION_PRODUCTION).toEqual({
      methodId: 'oneiros-same-call-reflective-questions-v1.0.3-candidate',
      promptSha256: 'f5399a4973fb84365a25967890169fc2475cb2e2a9f65f0dffd2a8993101d9e7',
    });
  });

  it('Branch A: Gate pass + Premise pass ships the original and never calls Repair', async () => {
    const pipeline = deps();
    const result = await resolveProductionReflectiveQuestion({
      generatorQuestion: ORIGINAL,
      depth: 'standard',
      outputLanguage: 'en',
      fallbackQuestion: FALLBACK,
    }, pipeline);
    expect(result).toMatchObject({
      question: ORIGINAL,
      source: 'generator',
      questionMode: 'CORE',
      generatorGateDecision: 'pass',
      generatorPremiseDecision: 'pass',
      repairGateDecision: null,
      repairPremiseDecision: null,
      gateCallCount: 1,
      repairCallCount: 0,
      premiseCallCount: 1,
      rejectedGeneratorQuestion: null,
    });
    expect(pipeline.runRepair).not.toHaveBeenCalled();
  });

  it('Branch B: Gate fail repairs once, then ships the repaired question', async () => {
    const pipeline = deps({
      runIntegrityGate: jest.fn(async (question: string) => (
        question === ORIGINAL
          ? { pass: false, violations: ['forced_choice' as const] }
          : { pass: true, violations: [] }
      )),
    });
    const result = await resolveProductionReflectiveQuestion({
      generatorQuestion: ORIGINAL,
      depth: 'quick',
      outputLanguage: 'en',
      fallbackQuestion: FALLBACK,
    }, pipeline);
    expect(result.source).toBe('repair');
    expect(result.question).toBe(REPAIRED);
    expect(result.questionMode).toBe('CORE');
    expect(result.generatorGateDecision).toBe('fail');
    expect(result.repairGateDecision).toBe('pass');
    expect(result.repairPremiseDecision).toBe('pass');
    expect(result.gateCallCount).toBe(2);
    expect(result.repairCallCount).toBe(1);
    expect(result.premiseCallCount).toBe(1);
    expect(result.rejectedGeneratorQuestion).toBe(ORIGINAL);
    expect(result.question).not.toBe(ORIGINAL);
    expect(pipeline.runRepair).toHaveBeenCalledTimes(1);
    expect(pipeline.runRepair).toHaveBeenCalledWith(ORIGINAL, ['forced_choice']);
  });

  it('Branch B from Premise fail: original never leaks; Repair gets interpretation_as_premise', async () => {
    const pipeline = deps({
      runPremiseCheck: jest.fn(async (question: string) => ({
        pass: question !== HOME_STANDARD,
      })),
    });
    const result = await resolveProductionReflectiveQuestion({
      generatorQuestion: HOME_STANDARD,
      depth: 'standard',
      outputLanguage: 'ja',
      fallbackQuestion: FALLBACK,
    }, pipeline);
    expect(result.question).not.toBe(HOME_STANDARD);
    expect(result.source).toBe('repair');
    expect(result.question).toBe(REPAIRED);
    expect(result.generatorGateDecision).toBe('pass');
    expect(result.generatorPremiseDecision).toBe('fail');
    expect(pipeline.runRepair).toHaveBeenCalledWith(
      HOME_STANDARD,
      [PREMISE_FAIL_REPAIR_VIOLATION]
    );
  });

  it('Branch C: Repair fail uses deterministic fallback and never leaks rejected text', async () => {
    const pipeline = deps({
      runIntegrityGate: jest.fn(async () => ({
        pass: false,
        violations: ['forced_choice' as const],
      })),
      runRepair: jest.fn(async () => 'Which image is more alive, the fox or the gate?'),
    });
    const result = await resolveProductionReflectiveQuestion({
      generatorQuestion: ORIGINAL,
      depth: 'advanced',
      outputLanguage: 'en',
      fallbackQuestion: FALLBACK,
    }, pipeline);
    expect(result.source).toBe('fallback');
    expect(result.question).toBe(FALLBACK);
    expect(result.questionMode).toBe('DEEPER');
    expect(result.question).not.toBe(ORIGINAL);
    expect(result.question).not.toBe('Which image is more alive, the fox or the gate?');
    expect(result.repairCallCount).toBe(1);
    expect(result.gateCallCount).toBe(2);
    expect(result.rejectedGeneratorQuestion).toBe(ORIGINAL);
    expect(result.rejectedRepairQuestion).toBe(
      'Which image is more alive, the fox or the gate?'
    );
    expect(pipeline.runRepair).toHaveBeenCalledTimes(1);
  });

  it('falls back with zero LLM calls when the generator question is empty', async () => {
    const pipeline = deps();
    const result = await resolveProductionReflectiveQuestion({
      generatorQuestion: '   ',
      depth: 'standard',
      outputLanguage: 'el',
    }, pipeline);
    expect(result.source).toBe('fallback');
    expect(result.question).toBe(getReflectiveQuestionFallback('el'));
    expect(result.gateCallCount).toBe(0);
    expect(result.repairCallCount).toBe(0);
    expect(result.premiseCallCount).toBe(0);
    expect(pipeline.runIntegrityGate).not.toHaveBeenCalled();
    expect(pipeline.runPremiseCheck).not.toHaveBeenCalled();
    expect(pipeline.runRepair).not.toHaveBeenCalled();
  });

  it('treats unavailable Gate/Premise results as fail-closed', async () => {
    const pipeline = deps({
      runIntegrityGate: jest.fn(async () => null),
      runRepair: jest.fn(async () => null),
    });
    const result = await resolveProductionReflectiveQuestion({
      generatorQuestion: ORIGINAL,
      depth: 'standard',
      outputLanguage: 'en',
      fallbackQuestion: FALLBACK,
    }, pipeline);
    expect(result.source).toBe('fallback');
    expect(result.generatorGateDecision).toBe('unavailable');
    expect(result.question).toBe(FALLBACK);
  });

  it('localizes the deterministic fallback for every supported language', () => {
    for (const code of ONEIROS_LANGUAGE_CODES) {
      const fallback = REFLECTIVE_QUESTION_COPY[code].fallbackQuestion.trim();
      expect(fallback.length).toBeGreaterThan(8);
      expect(fallback).not.toMatch(/which image|ποια εικόνα|upgrade|fallback/i);
    }
    expect(REFLECTIVE_QUESTION_COPY.en.fallbackQuestion).toBe(
      'If you return to this dream for a moment, what do you notice now?'
    );
    expect(REFLECTIVE_QUESTION_COPY.el.fallbackQuestion).toBe(
      'Αν επιστρέψεις για λίγο σε αυτό το όνειρο, τι παρατηρείς τώρα;'
    );
  });

  it('keeps the HOME Standard original in the frozen corpus as a must-not-surface case', () => {
    const prepared = loadAndPrepareQuestionIntegrityGateCorpus();
    const homeStandard = prepared.cases.find((item) => item.id === 'ja-neon-home:standard');
    expect(homeStandard?.question).toBe(HOME_STANDARD);
    expect(homeStandard?.expect_gate_fail).toBe(false);
    expect(homeStandard?.role).toBe('inspect');
  });
});
