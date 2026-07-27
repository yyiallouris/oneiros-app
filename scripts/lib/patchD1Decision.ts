/** Frozen Patch D.1 engineering decision (2026-07-27 live benchmark). */
export const PATCH_D1_FROZEN_BENCHMARK_DIR =
  'tmp/patch-d1-benchmark-2026-07-27T11-29-06-298Z';

export const PATCH_D1_PRODUCTION_DECISION = 'accepted_with_known_residuals' as const;

export const PATCH_D1_KNOWN_RESIDUALS = {
  sisyphus_hero_false_positive: '1/5',
  effort_without_outcome_hero_false_positive: '1/5',
  root_cause: 'false model emission of boon_or_changed_outcome',
  validator_or_infrastructure_failure: false,
} as const;

export const PATCH_D1_REGRESSION_GUARDRAILS = {
  hero_positive_min: '4/5',
  effort_without_outcome_hero_max: '1/5',
  sisyphus_hero_max: '1/5',
  sisyphus_myth_min: '4/5',
  schema_proxy_failures: 0,
} as const;

export function patchD1EngineeringDecision(overallPass: boolean) {
  return {
    benchmark_acceptance: overallPass ? 'pass' : 'fail',
    production_decision: PATCH_D1_PRODUCTION_DECISION,
    known_residuals: PATCH_D1_KNOWN_RESIDUALS,
    regression_guardrails: PATCH_D1_REGRESSION_GUARDRAILS,
    freeze_note:
      'Accepted production precision improvement with two known residual model-tagging errors. Further tuning was intentionally stopped to avoid schema and prompt bloat.',
  };
}
