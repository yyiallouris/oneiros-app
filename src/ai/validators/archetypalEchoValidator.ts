/**
 * Deterministic filters for Archetypal Echoes after model selection.
 * Closed whitelist + concise hard gates for the labels that most often misfire.
 *
 * Hard gates apply when evaluation signals are present.
 * Missing evaluation must NOT wipe an otherwise valid echo — the prompt is the
 * primary control; a silent empty UI is worse than an occasional soft miss.
 */

import {
  getArchetypeDefinitionV1,
  type ArchetypeDefinition,
} from '../catalogs/archetypeCatalog.v1.ts';
import type { ArchetypalEcho } from '../archetypalEchoes.ts';
import { isWhitelistedArchetype } from '../../constants/archetypes.ts';

export type ArchetypeEvaluationSignals = {
  carrierType?: 'figure' | 'relationship' | 'field' | 'process';
  centrality?: number;
  activeInMainAction?: boolean;
  agency?: number;
  identityCompetition?: boolean;
  actualCrossing?: boolean;
  maternalFunction?: boolean;
  fieldTransformation?: boolean;
  futureBearing?: boolean;
  excludedOrDisownedRole?: boolean;
  engulfingOrPossessiveDynamic?: boolean;
  embodiedSovereign?: boolean;
};

export type ArchetypalValidationResult = {
  accepted: ArchetypalEcho[];
  rejected: Array<{ echo: ArchetypalEcho; reason: string }>;
};

/** Labels that historically misfire — hard gates apply when signals are present. */
const HARD_GATE_IDS = new Set([
  'double',
  'guide_psychopomp',
  'divine_child',
  'terrible_mother',
  'ruler',
]);

export function asArchetypeEvaluation(raw: unknown): ArchetypeEvaluationSignals | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  return raw as ArchetypeEvaluationSignals;
}

function rejectReasonForHardGate(
  def: ArchetypeDefinition,
  evaluation: ArchetypeEvaluationSignals
): string | null {
  switch (def.id) {
    case 'double':
      // Explicit false → reject. Undefined → do not invent a kill.
      if (evaluation.identityCompetition === false) {
        return 'Double requires identityCompetition';
      }
      break;
    case 'guide_psychopomp':
      if (evaluation.actualCrossing === false || evaluation.activeInMainAction === false) {
        return 'Guide/Psychopomp requires actualCrossing and activeInMainAction';
      }
      break;
    case 'divine_child':
      if (evaluation.activeInMainAction === false) {
        return 'Divine Child requires activeInMainAction';
      }
      break;
    case 'terrible_mother':
      if (
        evaluation.maternalFunction === false ||
        evaluation.engulfingOrPossessiveDynamic === false
      ) {
        return 'Terrible Mother requires maternalFunction and engulfing/possessive dynamic';
      }
      break;
    case 'ruler':
      if (evaluation.embodiedSovereign === false) {
        return 'Ruler requires embodiedSovereign (not institution alone)';
      }
      break;
    default:
      break;
  }
  return null;
}

/**
 * Validate echoes against whitelist + concise hard gates.
 * Evaluation is optional; when present on hard-gate labels, failed signals reject.
 */
export function validateArchetypalEchoes(
  echoes: Array<ArchetypalEcho & { evaluation?: unknown }>,
  options: {
    evaluations?: Array<ArchetypeEvaluationSignals | null | undefined>;
    max?: number;
  } = {}
): ArchetypalValidationResult {
  const max = options.max ?? 2;
  const accepted: ArchetypalEcho[] = [];
  const rejected: ArchetypalValidationResult['rejected'] = [];

  echoes.forEach((echo, index) => {
    const label = echo.canonical_label?.trim() || '';
    if (!label || !isWhitelistedArchetype(label)) {
      rejected.push({ echo, reason: 'canonical_label not in whitelist' });
      return;
    }
    const def = getArchetypeDefinitionV1(label);
    if (!def) {
      rejected.push({ echo, reason: 'no catalog definition' });
      return;
    }

    const evaluation =
      options.evaluations?.[index] ?? asArchetypeEvaluation(echo.evaluation);

    if (HARD_GATE_IDS.has(def.id) && evaluation) {
      const signalReason = rejectReasonForHardGate(def, evaluation);
      if (signalReason) {
        rejected.push({ echo, reason: signalReason });
        return;
      }
    }

    if (accepted.length >= max) {
      rejected.push({ echo, reason: 'exceeds max archetypal echoes' });
      return;
    }

    if (accepted.some((a) => a.canonical_label.toLowerCase() === label.toLowerCase())) {
      rejected.push({ echo, reason: 'duplicate archetype label' });
      return;
    }

    accepted.push(echo);
  });

  return { accepted, rejected };
}

/** Strip evaluation before persistence / UI. */
export function toPersistedArchetypalEcho(
  echo: ArchetypalEcho & { evaluation?: unknown }
): ArchetypalEcho {
  return {
    canonical_label: echo.canonical_label,
    expression: echo.expression,
    resonance: echo.resonance,
    evidence: echo.evidence,
    ...(echo.confidence ? { confidence: echo.confidence } : {}),
  };
}
