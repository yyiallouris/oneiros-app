/**
 * CLOSED R&D — not production.
 *
 * Frozen Generator → Integrity Gate → Premise Check → Repair orchestration.
 * Do not import this module from client, gateway, or billing-ai runtime.
 */
import { createHash } from 'crypto';
import type { DreamReflectionDepth } from './dreamReflectionPrompt.ts';
import { DREAM_REFLECTION_PROMPT_ID } from './dreamReflectionPrompt.ts';
import type { OneirosLanguageCode } from '../constants/oneirosLanguages.ts';
import {
  getReflectiveQuestionFallback,
  REFLECTIVE_QUESTION_FALLBACK_VERSION,
} from '../constants/reflectiveQuestionCopy.ts';
import {
  SAME_CALL_MINIMAL_BUNDLE_SHA256,
  SAME_CALL_MINIMAL_METHOD_ID,
  buildSameCallMinimalRequest,
  mapReadingDepthToQuestionMode,
  splitSameCallReadingAndQuestion,
  visibleSameCallReading,
  type SameCallQuestionMode,
} from './rd/reflective-questions/sameCallMinimal/sameCallMinimalCandidate.ts';
import {
  QUESTION_INTEGRITY_GATE_BUNDLE_SHA256,
  QUESTION_INTEGRITY_GATE_METHOD_ID,
  type QuestionIntegrityViolationId,
} from './rd/reflective-questions/questionIntegrityGate/questionIntegrityGateCandidate.ts';
import {
  QUESTION_REPAIR_BUNDLE_SHA256,
  QUESTION_REPAIR_METHOD_ID,
} from './rd/reflective-questions/questionIntegrityGate/questionRepairCandidate.ts';
import {
  QUESTION_PREMISE_CHECK_BUNDLE_SHA256,
  QUESTION_PREMISE_CHECK_METHOD_ID,
} from './questionPremiseCheck.ts';

export {
  SAME_CALL_MINIMAL_BUNDLE_SHA256,
  SAME_CALL_MINIMAL_METHOD_ID,
  buildSameCallMinimalRequest,
  splitSameCallReadingAndQuestion,
  visibleSameCallReading,
};
export {
  QUESTION_INTEGRITY_GATE_BUNDLE_SHA256,
  QUESTION_INTEGRITY_GATE_METHOD_ID,
};
export {
  QUESTION_REPAIR_BUNDLE_SHA256,
  QUESTION_REPAIR_METHOD_ID,
};
export {
  QUESTION_PREMISE_CHECK_BUNDLE_SHA256,
  QUESTION_PREMISE_CHECK_METHOD_ID,
};

export const REFLECTIVE_QUESTION_PRODUCTION_METHOD_ID =
  'oneiros-reflective-question-production-v1.0.0' as const;
export const REFLECTIVE_QUESTION_PRODUCTION_METHOD_VERSION = '1.0.0' as const;
export const REFLECTIVE_QUESTION_PRODUCTION_PROMPT_ID =
  'oneiros-reflective-question-production-prompt-v1.0.0' as const;
export const REFLECTIVE_QUESTION_PRODUCTION_PROMPT_VERSION = '1.0.0' as const;
export const REFLECTIVE_QUESTION_PRODUCTION_ARTIFACT_SCHEMA_VERSION = 11 as const;
export const REFLECTIVE_QUESTION_KILL_SWITCH_ENV =
  'ONEIROS_REFLECTIVE_QUESTION_KILL_SWITCH' as const;
export const PREMISE_FAIL_REPAIR_VIOLATION: QuestionIntegrityViolationId =
  'interpretation_as_premise';

export const REFLECTIVE_QUESTION_PRODUCTION_BUNDLE = [
  REFLECTIVE_QUESTION_PRODUCTION_METHOD_ID,
  REFLECTIVE_QUESTION_PRODUCTION_PROMPT_ID,
  REFLECTIVE_QUESTION_PRODUCTION_PROMPT_VERSION,
  String(REFLECTIVE_QUESTION_PRODUCTION_ARTIFACT_SCHEMA_VERSION),
  DREAM_REFLECTION_PROMPT_ID,
  SAME_CALL_MINIMAL_METHOD_ID,
  SAME_CALL_MINIMAL_BUNDLE_SHA256,
  QUESTION_INTEGRITY_GATE_METHOD_ID,
  QUESTION_INTEGRITY_GATE_BUNDLE_SHA256,
  QUESTION_REPAIR_METHOD_ID,
  QUESTION_REPAIR_BUNDLE_SHA256,
  QUESTION_PREMISE_CHECK_METHOD_ID,
  QUESTION_PREMISE_CHECK_BUNDLE_SHA256,
  REFLECTIVE_QUESTION_FALLBACK_VERSION,
  'generator-then-gate-then-premise-then-one-repair-then-gate-then-premise',
  'no-drop-no-rejected-leak-no-second-repair',
].join('\n---ONEIROS-REFLECTIVE-QUESTION-PRODUCTION-V1---\n');

export function hashReflectiveQuestionProductionBundle(
  prompt: string = REFLECTIVE_QUESTION_PRODUCTION_BUNDLE
): string {
  return createHash('sha256').update(prompt.trim()).digest('hex');
}

export const REFLECTIVE_QUESTION_PRODUCTION_BUNDLE_SHA256 =
  'fc8b6304fc2e8bc108242113299f7073cfbcc80d3f8df41cf747d218540d00ea' as const;

export const REFLECTIVE_QUESTION_PIPELINE_EVENTS = [
  'reflective_question_source_generator',
  'reflective_question_source_repair',
  'reflective_question_source_fallback',
  'reflective_question_gate1_pass',
  'reflective_question_gate1_fail',
  'reflective_question_gate2_pass',
  'reflective_question_gate2_fail',
  'reflective_question_premise1_pass',
  'reflective_question_premise1_fail',
  'reflective_question_premise2_pass',
  'reflective_question_premise2_fail',
] as const;

export type ReflectiveQuestionSource = 'generator' | 'repair' | 'fallback';
export type IntegrityCheckDecision = 'pass' | 'fail' | 'unavailable';
export type ReflectiveQuestionPipelineQuestionMode = SameCallQuestionMode;

export type IntegrityGateCallResult = {
  pass: boolean;
  violations: QuestionIntegrityViolationId[];
};

export type PremiseCheckCallResult = {
  pass: boolean;
};

export type ReflectiveQuestionPipelineDeps = {
  runIntegrityGate: (question: string) => Promise<IntegrityGateCallResult | null>;
  runPremiseCheck: (question: string) => Promise<PremiseCheckCallResult | null>;
  runRepair: (
    question: string,
    violations: readonly QuestionIntegrityViolationId[]
  ) => Promise<string | null>;
};

export type ReflectiveQuestionPipelineInput = {
  generatorQuestion: string | null | undefined;
  depth: DreamReflectionDepth;
  outputLanguage: OneirosLanguageCode;
  fallbackQuestion?: string;
};

export type ReflectiveQuestionPipelineResult = {
  question: string;
  source: ReflectiveQuestionSource;
  questionMode: ReflectiveQuestionPipelineQuestionMode;
  languageCode: OneirosLanguageCode;
  generatorGateDecision: IntegrityCheckDecision | null;
  repairGateDecision: IntegrityCheckDecision | null;
  generatorPremiseDecision: IntegrityCheckDecision | null;
  repairPremiseDecision: IntegrityCheckDecision | null;
  gateViolationCategories: QuestionIntegrityViolationId[];
  gateCallCount: number;
  repairCallCount: number;
  premiseCallCount: number;
  rejectedGeneratorQuestion: string | null;
  rejectedRepairQuestion: string | null;
};

function cleanQuestion(value: string | null | undefined): string | null {
  const text = typeof value === 'string' ? value.replace(/\s+/gu, ' ').trim() : '';
  return text ? text : null;
}

function toDecision(
  result: IntegrityGateCallResult | PremiseCheckCallResult | null
): IntegrityCheckDecision {
  if (!result) return 'unavailable';
  return result.pass ? 'pass' : 'fail';
}

export function isReflectiveQuestionKillSwitchEnabled(
  env: Record<string, string | undefined> | null | undefined = typeof process === 'undefined'
    ? null
    : process.env
): boolean {
  const value = env?.[REFLECTIVE_QUESTION_KILL_SWITCH_ENV];
  return typeof value === 'string' && /^(1|true|yes)$/iu.test(value.trim());
}

export function mapReadingDepthToProductionQuestionMode(
  depth: DreamReflectionDepth
): ReflectiveQuestionPipelineQuestionMode {
  return mapReadingDepthToQuestionMode(depth);
}

export function mapQuestionModeToArtifactDepth(
  mode: ReflectiveQuestionPipelineQuestionMode
): 'core' | 'deeper' {
  return mode === 'DEEPER' ? 'deeper' : 'core';
}

async function checkIntegrity(
  run: ReflectiveQuestionPipelineDeps['runIntegrityGate'],
  question: string
): Promise<{ decision: IntegrityCheckDecision; violations: QuestionIntegrityViolationId[] }> {
  try {
    const result = await run(question);
    return {
      decision: toDecision(result),
      violations: result?.violations ?? [],
    };
  } catch {
    return { decision: 'unavailable', violations: [] };
  }
}

async function checkPremise(
  run: ReflectiveQuestionPipelineDeps['runPremiseCheck'],
  question: string
): Promise<IntegrityCheckDecision> {
  try {
    return toDecision(await run(question));
  } catch {
    return 'unavailable';
  }
}

export async function resolveProductionReflectiveQuestion(
  input: ReflectiveQuestionPipelineInput,
  deps: ReflectiveQuestionPipelineDeps
): Promise<ReflectiveQuestionPipelineResult> {
  const questionMode = mapReadingDepthToProductionQuestionMode(input.depth);
  const languageCode = input.outputLanguage;
  const fallbackQuestion = cleanQuestion(input.fallbackQuestion)
    ?? getReflectiveQuestionFallback(languageCode);
  if (!fallbackQuestion) {
    throw new Error('Deterministic reflective-question fallback is missing.');
  }

  const emit = (
    partial: Omit<ReflectiveQuestionPipelineResult, 'question' | 'languageCode' | 'questionMode'> & {
      question: string;
    }
  ): ReflectiveQuestionPipelineResult => {
    const question = cleanQuestion(partial.question);
    if (!question) {
      throw new Error('Production reflective-question pipeline emitted an empty question.');
    }
    if (
      partial.source !== 'fallback' &&
      (
        question === partial.rejectedGeneratorQuestion ||
        question === partial.rejectedRepairQuestion
      )
    ) {
      throw new Error('Rejected reflective question leaked into the production result.');
    }
    return {
      ...partial,
      question,
      languageCode,
      questionMode,
    };
  };

  const fallback = (
    counts: Pick<
      ReflectiveQuestionPipelineResult,
      | 'generatorGateDecision'
      | 'repairGateDecision'
      | 'generatorPremiseDecision'
      | 'repairPremiseDecision'
      | 'gateViolationCategories'
      | 'gateCallCount'
      | 'repairCallCount'
      | 'premiseCallCount'
      | 'rejectedGeneratorQuestion'
      | 'rejectedRepairQuestion'
    >
  ) => emit({
    ...counts,
    question: fallbackQuestion,
    source: 'fallback',
  });

  const original = cleanQuestion(input.generatorQuestion);
  if (!original) {
    return fallback({
      generatorGateDecision: null,
      repairGateDecision: null,
      generatorPremiseDecision: null,
      repairPremiseDecision: null,
      gateViolationCategories: [],
      gateCallCount: 0,
      repairCallCount: 0,
      premiseCallCount: 0,
      rejectedGeneratorQuestion: null,
      rejectedRepairQuestion: null,
    });
  }

  const gate1 = await checkIntegrity(deps.runIntegrityGate, original);
  let gateCallCount = 1;
  let premiseCallCount = 0;
  const generatorGateDecision = gate1.decision;
  let generatorPremiseDecision: IntegrityCheckDecision | null = null;
  let repairViolations: QuestionIntegrityViolationId[] = gate1.violations;

  if (gate1.decision === 'pass') {
    generatorPremiseDecision = await checkPremise(deps.runPremiseCheck, original);
    premiseCallCount += 1;
    if (generatorPremiseDecision === 'pass') {
      return emit({
        question: original,
        source: 'generator',
        generatorGateDecision,
        repairGateDecision: null,
        generatorPremiseDecision,
        repairPremiseDecision: null,
        gateViolationCategories: [],
        gateCallCount,
        repairCallCount: 0,
        premiseCallCount,
        rejectedGeneratorQuestion: null,
        rejectedRepairQuestion: null,
      });
    }
    repairViolations = [PREMISE_FAIL_REPAIR_VIOLATION];
  } else if (repairViolations.length === 0) {
    repairViolations = [PREMISE_FAIL_REPAIR_VIOLATION];
  }

  let repaired: string | null = null;
  try {
    repaired = cleanQuestion(await deps.runRepair(original, repairViolations));
  } catch {
    repaired = null;
  }
  const repairCallCount = 1;

  if (!repaired || repaired === original) {
    return fallback({
      generatorGateDecision,
      repairGateDecision: null,
      generatorPremiseDecision,
      repairPremiseDecision: null,
      gateViolationCategories: repairViolations,
      gateCallCount,
      repairCallCount,
      premiseCallCount,
      rejectedGeneratorQuestion: original,
      rejectedRepairQuestion: repaired === original ? repaired : null,
    });
  }

  const gate2 = await checkIntegrity(deps.runIntegrityGate, repaired);
  gateCallCount += 1;
  if (gate2.decision !== 'pass') {
    return fallback({
      generatorGateDecision,
      repairGateDecision: gate2.decision,
      generatorPremiseDecision,
      repairPremiseDecision: null,
      gateViolationCategories: gate2.violations.length > 0 ? gate2.violations : repairViolations,
      gateCallCount,
      repairCallCount,
      premiseCallCount,
      rejectedGeneratorQuestion: original,
      rejectedRepairQuestion: repaired,
    });
  }

  const repairPremiseDecision = await checkPremise(deps.runPremiseCheck, repaired);
  premiseCallCount += 1;
  if (repairPremiseDecision !== 'pass') {
    return fallback({
      generatorGateDecision,
      repairGateDecision: gate2.decision,
      generatorPremiseDecision,
      repairPremiseDecision,
      gateViolationCategories: [PREMISE_FAIL_REPAIR_VIOLATION],
      gateCallCount,
      repairCallCount,
      premiseCallCount,
      rejectedGeneratorQuestion: original,
      rejectedRepairQuestion: repaired,
    });
  }

  return emit({
    question: repaired,
    source: 'repair',
    generatorGateDecision,
    repairGateDecision: gate2.decision,
    generatorPremiseDecision,
    repairPremiseDecision,
    gateViolationCategories: repairViolations,
    gateCallCount,
    repairCallCount,
    premiseCallCount,
    rejectedGeneratorQuestion: original,
    rejectedRepairQuestion: null,
  });
}

export function productionPipelineTelemetry(result: ReflectiveQuestionPipelineResult): {
  sourceEvent: (typeof REFLECTIVE_QUESTION_PIPELINE_EVENTS)[number];
  generator_rate_bucket: ReflectiveQuestionSource;
  language: OneirosLanguageCode;
  question_mode: ReflectiveQuestionPipelineQuestionMode;
  gate_violation_categories: QuestionIntegrityViolationId[];
} {
  return {
    sourceEvent: `reflective_question_source_${result.source}`,
    generator_rate_bucket: result.source,
    language: result.languageCode,
    question_mode: result.questionMode,
    gate_violation_categories: result.gateViolationCategories,
  };
}
