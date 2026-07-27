/** Frozen Patch E engineering decision (2026-07-27 global archetype benchmark). */
export const PATCH_E_FROZEN_BENCHMARK_DIR =
  'tmp/global-archetype-benchmark-2026-07-27T13-25-17-779Z';

export const PATCH_E_PRODUCTION_DECISION = 'accepted_with_known_residuals' as const;

export const PATCH_E_FROZEN_VERSIONS = {
  prompt_version: '4.1.7-E.1',
  archetype_catalog_version: '1.6.0',
  schema_version: 12,
  dataset_version: '1.2.0',
} as const;

export const PATCH_E_KNOWN_RESIDUALS = {
  language_mismatch:
    'M_double_shadow → archetypes[0].expression (1 field / 72 runs; do not open E.1.1)',
  hero_sisyphus: 'NAT_C3_sisyphus_el hero FP — known D.1 residual',
  shadow_mixed_only:
    'Missed only in M_shadow_trickster and M_double_shadow; pure Shadow positives remain correct',
  sacred_marriage_mixed: 'Missed only in M_self_sacred where Self is returned',
  persona_precision: '0.67 rather than target 0.75',
  persona_false_positives: ['N_role_no_persona', 'P_double_b'] as const,
  persona_fp_correction:
    'P_persona_a is NOT a Persona FP — Persona is required and correctly returned; Double is the unexpected extra',
  empty_dream_accuracy: '66.7% (pre-E 77.8%) — monitor ordinary-dream archetype frequency live',
} as const;

export const PATCH_E_HEADLINE = {
  contract_pass: '62/72',
  required_label_recall: 0.954,
  naturalistic_contract_pass: '12/13',
  macro_precision: 0.921,
  macro_recall: 0.956,
  correct_cardinality: 0.931,
  language_match: 0.986,
  lover_anima_death_rebirth: '100% precision and recall',
  same_carrier_dominant_recall: '5/5',
  same_carrier_dual_recall: '4/5',
} as const;

export function patchEEngineeringDecision() {
  return {
    production_decision: PATCH_E_PRODUCTION_DECISION,
    frozen_versions: PATCH_E_FROZEN_VERSIONS,
    known_residuals: PATCH_E_KNOWN_RESIDUALS,
    headline: PATCH_E_HEADLINE,
    freeze_note:
      'Patch E + E.1.1 frozen accepted_with_known_residuals. Language commit gate repairs strings and preserves semantic structure; never drops information. Deploy ai-entitlements-gateway.',
    do_not_change: [
      'prompt',
      'catalog',
      'schema',
      'Hero D.1',
      'myth layer',
      'candidate limit',
    ] as const,
  };
}
