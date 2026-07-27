/**
 * Dev/debug tracing for Mythic Echo post-processing.
 * Isolates raw-model vs normalize/validate drift without changing prompt v3.9.0.
 * Never persist this packet into interpretation rows / Dream Detail UI.
 */

import type { InterpretiveEchoDiagnostics } from './interpretiveEchoDiagnostics.ts';
import {
  normalizeAmplifications,
  type MythicEcho,
  type MythicEchoConfidence,
} from './mythicEchoes.ts';
import type { MythicValidationResult } from './validators/mythicEchoValidator.ts';

export type MythicEchoDebugSnapshot = {
  title: string;
  tradition: string;
  resonance: string;
  divergence: string;
  evidence: string[];
  confidence?: MythicEchoConfidence;
  catalog_id?: string;
  /** Present only on raw/legacy shapes. */
  echo_name?: string;
  dream_image?: string;
  difference?: string;
};

export type MythicPipelineTransform = {
  stage:
    | 'coerce_normalize'
    | 'validator'
    | 'persist_map'
    | 'audit_production_invariant';
  action:
    | 'keep'
    | 'drop'
    | 'reject'
    | 'field_change'
    | 'default_confidence'
    | 'legacy_key_map'
    | 'title_fallback'
    | 'invariant_clear';
  detail: string;
  before?: MythicEchoDebugSnapshot | null;
  after?: MythicEchoDebugSnapshot | null;
};

export type MythicAuditProductionConsistency = {
  ok: boolean;
  violations: string[];
  selectedAudit: { title: string; tradition: string } | null;
  productionAmplification: { title: string; tradition: string } | null;
};

export type MythicEchoPipelineDebugPacket = {
  /** Compact answer to: did the model emit a production amp object, or only audit-select? */
  summary: {
    raw_model_produced_amplification_object: boolean;
    raw_amplification_count: number;
    parsed_amplification_count: number;
    normalized_amplification_count: number;
    validator_accepted_count: number;
    validator_rejected_count: number;
    post_validation_amplification_count: number;
    selected_audit_title: string | null;
    selected_audit_tradition: string | null;
    selected_audit_title_type: string | null;
    production_amplification_after_validation: { title: string; tradition: string } | null;
    audit_only_selection_without_production_object: boolean;
    note: string;
  };
  /** 1) Raw model `amplifications` array as returned in the JSON. */
  raw_model_amplifications: unknown;
  raw_model_archetypes: unknown;
  raw_model_interpretive_diagnostics: unknown;
  selected_mythic_audit: {
    title: string;
    tradition: string;
    title_type?: string;
    selected: boolean;
    reason?: string;
    plot_contamination_test?: string;
    independent_plot_anchors?: string[];
  } | null;
  /** 2) Zod/parsed amplifications before normalizeAmplifications. */
  parsed_amplifications: unknown;
  /** @deprecated alias of parsed_amplifications — kept for older console filters. */
  parsed_production_amplifications_before_normalize: unknown;
  /** 3) After normalizeAmplifications, before mythicEchoValidator. */
  normalized_amplifications: MythicEchoDebugSnapshot[];
  /** @deprecated alias of normalized_amplifications. */
  normalized_amplifications_before_validation: MythicEchoDebugSnapshot[];
  transforms: MythicPipelineTransform[];
  /** 4) Every validator decision (accept + reject) with reason. */
  validator_decisions: Array<{
    decision: 'accept' | 'reject';
    reason: string;
    echo: MythicEchoDebugSnapshot;
  }>;
  validator_rejected: Array<{ reason: string; echo: MythicEchoDebugSnapshot }>;
  /** 5) Final post-validation production amplifications (before invariant clear). */
  post_validation_amplifications: MythicEchoDebugSnapshot[];
  audit_production_consistency: MythicAuditProductionConsistency;
  /** Cleared from persistence when invariant fails in debug. Never auto-promotes audit → production. */
  invariant_rejected_amplifications?: MythicEchoDebugSnapshot[];
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function asTrimmedString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

export function snapshotMythicEcho(raw: unknown): MythicEchoDebugSnapshot | null {
  if (typeof raw === 'string') {
    const resonance = raw.trim();
    if (!resonance) return null;
    return {
      title: '',
      tradition: '',
      resonance,
      divergence: '',
      evidence: [],
    };
  }
  const o = asRecord(raw);
  if (!o) return null;
  const confidenceRaw = asTrimmedString(o.confidence).toLowerCase();
  const confidence =
    confidenceRaw === 'high' || confidenceRaw === 'medium'
      ? (confidenceRaw as MythicEchoConfidence)
      : undefined;
  const evidence = Array.isArray(o.evidence)
    ? o.evidence.filter((item): item is string => typeof item === 'string').map((s) => s.trim()).filter(Boolean).slice(0, 3)
    : [];
  const snapshot: MythicEchoDebugSnapshot = {
    title: asTrimmedString(o.title) || asTrimmedString(o.echo_name) || asTrimmedString(o.echo),
    tradition: asTrimmedString(o.tradition),
    resonance: asTrimmedString(o.resonance),
    divergence: asTrimmedString(o.divergence) || asTrimmedString(o.difference),
    evidence,
  };
  if (confidence) snapshot.confidence = confidence;
  if (asTrimmedString(o.catalog_id)) snapshot.catalog_id = asTrimmedString(o.catalog_id);
  if (asTrimmedString(o.echo_name)) snapshot.echo_name = asTrimmedString(o.echo_name);
  if (asTrimmedString(o.dream_image)) snapshot.dream_image = asTrimmedString(o.dream_image);
  if (asTrimmedString(o.difference)) snapshot.difference = asTrimmedString(o.difference);
  return snapshot;
}

export function snapshotMythicEchoes(raw: unknown): MythicEchoDebugSnapshot[] {
  if (!Array.isArray(raw)) return [];
  return raw.map(snapshotMythicEcho).filter((item): item is MythicEchoDebugSnapshot => item != null);
}

/**
 * Debug invariant:
 * - selected mythic_audit title+tradition must exactly equal production amplification
 * - selected audit must not coexist with empty or differently titled production amp
 * - do not treat a descriptive motif paraphrase as an established tale title
 */
export function checkMythicAuditProductionConsistency(
  diagnostics: InterpretiveEchoDiagnostics | null | undefined,
  productionAmplifications: MythicEcho[]
): MythicAuditProductionConsistency {
  const selected = diagnostics?.mythic_audit?.find((entry) => entry.selected) ?? null;
  const production = productionAmplifications[0] ?? null;
  const selectedAudit = selected
    ? { title: selected.title.trim(), tradition: selected.tradition.trim() }
    : null;
  const productionAmplification = production
    ? { title: production.title.trim(), tradition: production.tradition.trim() }
    : null;

  if (!selectedAudit) {
    return {
      ok: true,
      violations: [],
      selectedAudit: null,
      productionAmplification,
    };
  }

  const violations: string[] = [];
  if (!productionAmplification) {
    violations.push('selected_audit_with_empty_production_amplification');
  } else {
    if (productionAmplification.title !== selectedAudit.title) {
      violations.push('production_title_mismatch');
    }
    if (productionAmplification.tradition !== selectedAudit.tradition) {
      violations.push('production_tradition_mismatch');
    }
    // Descriptive motif paraphrase while audit holds an established narrative title.
    if (
      productionAmplification.title !== selectedAudit.title &&
      selectedAudit.title.split(/\s+/).length >= 3 &&
      !/motif|pattern|journey of|transformation/i.test(selectedAudit.title)
    ) {
      violations.push('production_title_diverged_from_selected_established_title');
    }
  }

  return {
    ok: violations.length === 0,
    violations,
    selectedAudit,
    productionAmplification,
  };
}

/** Compare each raw model amplification row to normalizeAmplifications([row]). */
export function collectAmplificationNormalizeTransforms(
  rawAmplifications: unknown,
  normalized: MythicEcho[]
): MythicPipelineTransform[] {
  const transforms: MythicPipelineTransform[] = [];
  const rawItems = Array.isArray(rawAmplifications) ? rawAmplifications : [];

  rawItems.forEach((rawItem, index) => {
    const before = snapshotMythicEcho(rawItem);
    const alone = normalizeAmplifications([rawItem], 1)[0] ?? null;
    const after = alone ? snapshotMythicEcho(alone) : null;
    if (!before && !after) return;

    if (before && !after) {
      const confidence = asRecord(rawItem)?.confidence;
      transforms.push({
        stage: 'coerce_normalize',
        action: 'drop',
        detail:
          typeof confidence === 'string' && confidence.trim().toLowerCase() === 'low'
            ? `index ${index}: dropped low-confidence amplification`
            : `index ${index}: dropped empty/incomplete amplification during normalize`,
        before,
        after: null,
      });
      return;
    }

    if (!before || !after) return;

    if (
      before.difference &&
      !before.divergence &&
      after.divergence &&
      after.divergence === before.difference
    ) {
      transforms.push({
        stage: 'coerce_normalize',
        action: 'legacy_key_map',
        detail: `index ${index}: difference → divergence`,
        before,
        after,
      });
    }

    if (
      !before.title &&
      before.dream_image &&
      after.title &&
      after.title === before.dream_image.slice(0, 80)
    ) {
      transforms.push({
        stage: 'coerce_normalize',
        action: 'title_fallback',
        detail: `index ${index}: empty title filled from dream_image`,
        before,
        after,
      });
    }

    if (before.title !== after.title || before.tradition !== after.tradition) {
      transforms.push({
        stage: 'coerce_normalize',
        action: 'field_change',
        detail: `index ${index}: title/tradition changed during normalize`,
        before,
        after,
      });
    } else {
      transforms.push({
        stage: 'coerce_normalize',
        action: 'keep',
        detail: `index ${index}: title/tradition unchanged by normalize`,
        before,
        after,
      });
    }
  });

  // Soft confidence default happens in structuredTaskValidation coerce, not normalize.
  normalized.forEach((echo, index) => {
    const rawItem = rawItems[index];
    const before = snapshotMythicEcho(rawItem);
    if (before && !before.confidence && echo.confidence === 'medium') {
      transforms.push({
        stage: 'coerce_normalize',
        action: 'default_confidence',
        detail: `index ${index}: missing confidence → medium (coerce soft default)`,
        before,
        after: snapshotMythicEcho(echo),
      });
    }
  });

  return transforms;
}

export function collectMythicValidatorTransforms(
  validation: MythicValidationResult
): MythicPipelineTransform[] {
  const transforms: MythicPipelineTransform[] = [];
  for (const accepted of validation.accepted) {
    transforms.push({
      stage: 'validator',
      action: 'keep',
      detail: 'accepted by mythicEchoValidator',
      before: snapshotMythicEcho(accepted),
      after: snapshotMythicEcho(accepted),
    });
  }
  for (const rejected of validation.rejected) {
    transforms.push({
      stage: 'validator',
      action: 'reject',
      detail: rejected.reason,
      before: snapshotMythicEcho(rejected.echo),
      after: null,
    });
  }
  return transforms;
}

function emptyEchoSnapshot(): MythicEchoDebugSnapshot {
  return { title: '', tradition: '', resonance: '', divergence: '', evidence: [] };
}

export function buildMythicEchoPipelineDebugPacket(params: {
  rawModelObject: Record<string, unknown> | null;
  /** Zod/parsed amplifications before normalize (preferred). Falls back to raw. */
  parsedAmplifications?: unknown;
  normalizedBeforeValidation: MythicEcho[];
  mythicValidation: MythicValidationResult;
  postValidationAmplifications: MythicEcho[];
  diagnostics: InterpretiveEchoDiagnostics | null;
  invariantClearedAmplifications?: MythicEcho[];
}): MythicEchoPipelineDebugPacket {
  const rawAmps = params.rawModelObject?.amplifications ?? null;
  const parsedAmps =
    params.parsedAmplifications !== undefined
      ? params.parsedAmplifications
      : (params.rawModelObject as { amplifications?: unknown } | null)?.amplifications ?? null;
  const normalizeSource = Array.isArray(parsedAmps) ? parsedAmps : rawAmps;
  const normalizeTransforms = collectAmplificationNormalizeTransforms(
    normalizeSource,
    params.normalizedBeforeValidation
  );
  const validatorTransforms = collectMythicValidatorTransforms(params.mythicValidation);
  const consistency = checkMythicAuditProductionConsistency(
    params.diagnostics,
    params.postValidationAmplifications
  );

  const transforms = [...normalizeTransforms, ...validatorTransforms];
  if (!consistency.ok) {
    transforms.push({
      stage: 'audit_production_invariant',
      action: params.invariantClearedAmplifications?.length ? 'invariant_clear' : 'reject',
      detail:
        consistency.violations.join(', ') +
        ' (cleared production only; did NOT auto-promote selected audit into amplifications)',
      before: params.postValidationAmplifications[0]
        ? snapshotMythicEcho(params.postValidationAmplifications[0])
        : null,
      after: null,
    });
  }

  const selectedAuditEntry =
    params.diagnostics?.mythic_audit?.find((entry) => entry.selected) ?? null;
  const selected_mythic_audit = selectedAuditEntry
    ? {
        title: selectedAuditEntry.title,
        tradition: selectedAuditEntry.tradition,
        ...(selectedAuditEntry.title_type ? { title_type: selectedAuditEntry.title_type } : {}),
        selected: true,
        ...(selectedAuditEntry.reason ? { reason: selectedAuditEntry.reason } : {}),
        ...(selectedAuditEntry.plot_contamination_test
          ? { plot_contamination_test: selectedAuditEntry.plot_contamination_test }
          : {}),
        ...(selectedAuditEntry.independent_plot_anchors?.length
          ? { independent_plot_anchors: selectedAuditEntry.independent_plot_anchors }
          : {}),
      }
    : null;

  const rawCount = Array.isArray(rawAmps) ? rawAmps.length : 0;
  const parsedCount = Array.isArray(parsedAmps) ? parsedAmps.length : 0;
  const normalizedSnapshots = snapshotMythicEchoes(params.normalizedBeforeValidation);
  const postValidationSnapshots = snapshotMythicEchoes(params.postValidationAmplifications);
  const raw_model_produced_amplification_object = rawCount > 0;
  const audit_only_selection_without_production_object = Boolean(
    selected_mythic_audit && !raw_model_produced_amplification_object
  );

  let note =
    'Stages: raw → parsed → normalized → validator → post_validation → (debug) audit/production invariant.';
  if (audit_only_selection_without_production_object) {
    note +=
      ' Model selected a mythic_audit candidate but did not emit a production amplifications[] object.';
  } else if (
    selected_mythic_audit &&
    postValidationSnapshots.length === 0 &&
    raw_model_produced_amplification_object
  ) {
    note +=
      ' Model emitted amplifications[], but none survived normalize/validator into post_validation.';
  } else if (
    selected_mythic_audit &&
    consistency.violations.includes('selected_audit_with_empty_production_amplification')
  ) {
    note += ' Selected audit present with empty production amplification after validation.';
  }
  note +=
    ' Selected audit titles are never auto-promoted into production amplifications.';

  const validator_decisions: MythicEchoPipelineDebugPacket['validator_decisions'] = [
    ...params.mythicValidation.accepted.map((echo) => ({
      decision: 'accept' as const,
      reason: 'accepted_by_mythicEchoValidator',
      echo: snapshotMythicEcho(echo) ?? emptyEchoSnapshot(),
    })),
    ...params.mythicValidation.rejected.map((item) => ({
      decision: 'reject' as const,
      reason: item.reason,
      echo: snapshotMythicEcho(item.echo) ?? emptyEchoSnapshot(),
    })),
  ];

  return {
    summary: {
      raw_model_produced_amplification_object,
      raw_amplification_count: rawCount,
      parsed_amplification_count: parsedCount,
      normalized_amplification_count: normalizedSnapshots.length,
      validator_accepted_count: params.mythicValidation.accepted.length,
      validator_rejected_count: params.mythicValidation.rejected.length,
      post_validation_amplification_count: postValidationSnapshots.length,
      selected_audit_title: selected_mythic_audit?.title ?? null,
      selected_audit_tradition: selected_mythic_audit?.tradition ?? null,
      selected_audit_title_type: selected_mythic_audit?.title_type ?? null,
      production_amplification_after_validation: consistency.productionAmplification,
      audit_only_selection_without_production_object,
      note,
    },
    raw_model_amplifications: rawAmps,
    raw_model_archetypes: params.rawModelObject?.archetypes ?? null,
    raw_model_interpretive_diagnostics: params.rawModelObject?.interpretive_diagnostics ?? null,
    selected_mythic_audit,
    parsed_amplifications: parsedAmps,
    parsed_production_amplifications_before_normalize: parsedAmps,
    normalized_amplifications: normalizedSnapshots,
    normalized_amplifications_before_validation: normalizedSnapshots,
    transforms,
    validator_decisions,
    validator_rejected: params.mythicValidation.rejected.map((item) => ({
      reason: item.reason,
      echo: snapshotMythicEcho(item.echo) ?? emptyEchoSnapshot(),
    })),
    post_validation_amplifications: postValidationSnapshots,
    audit_production_consistency: consistency,
    ...(params.invariantClearedAmplifications?.length
      ? {
          invariant_rejected_amplifications: snapshotMythicEchoes(
            params.invariantClearedAmplifications
          ),
        }
      : {}),
  };
}

/**
 * Debug-only enforcement: when selected audit disagrees with production amp,
 * clear production (do not rewrite/translate the title to the audit title).
 */
export function applyMythicAuditProductionInvariant(params: {
  diagnostics: InterpretiveEchoDiagnostics | null;
  amplifications: MythicEcho[];
  enforce: boolean;
}): {
  amplifications: MythicEcho[];
  consistency: MythicAuditProductionConsistency;
  cleared: MythicEcho[];
} {
  const consistency = checkMythicAuditProductionConsistency(
    params.diagnostics,
    params.amplifications
  );
  if (!params.enforce || consistency.ok) {
    return {
      amplifications: params.amplifications,
      consistency,
      cleared: [],
    };
  }
  return {
    amplifications: [],
    consistency,
    cleared: params.amplifications,
  };
}

/** Convenience: normalize + transform log for unit tests / client path. */
export function normalizeAmplificationsWithDebug(
  raw: unknown,
  max?: number
): { normalized: MythicEcho[]; transforms: MythicPipelineTransform[] } {
  const normalized = normalizeAmplifications(raw, max);
  return {
    normalized,
    transforms: collectAmplificationNormalizeTransforms(raw, normalized),
  };
}
