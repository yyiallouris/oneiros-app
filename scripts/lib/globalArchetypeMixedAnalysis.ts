import type { GlobalArchetypeFixture } from './globalArchetypeBenchmark';

export type MixedRelationType = 'distinct_functions_or_carriers' | 'same_carrier_dual_reading';

/** Analysis-only metadata — does not change frozen contract scoring. */
export const MIXED_RELATION_BY_FIXTURE_ID: Record<string, MixedRelationType> = {
  M_hero_death: 'same_carrier_dual_reading',
  M_anima_lover: 'same_carrier_dual_reading',
  M_self_sacred: 'same_carrier_dual_reading',
  M_wise_man_guide: 'same_carrier_dual_reading',
  M_mother_ruler: 'same_carrier_dual_reading',
  M_lover_guide: 'distinct_functions_or_carriers',
  M_death_guide: 'distinct_functions_or_carriers',
  M_shadow_trickster: 'distinct_functions_or_carriers',
  M_persona_ruler: 'distinct_functions_or_carriers',
  M_orphan_mother: 'distinct_functions_or_carriers',
  M_double_shadow: 'distinct_functions_or_carriers',
};

export function mixedRelationType(fixture: GlobalArchetypeFixture): MixedRelationType | null {
  if (fixture.category !== 'mixed') return null;
  return MIXED_RELATION_BY_FIXTURE_ID[fixture.id] ?? null;
}

export type MixedAdjudicatedRunResult = {
  fixture_id: string;
  mixed_relation_type: MixedRelationType;
  post_archetype_ids: string[];
  strict_both_required_present: boolean;
  /** Distinct-carrier fixtures: same as strict contract on both required. */
  distinct_carrier_pass: boolean | null;
  /** Same-carrier fixtures: dominant required present; second is stress-test only. */
  same_carrier_dominant_present: boolean | null;
  same_carrier_secondary_present: boolean | null;
  same_carrier_stress_recall: boolean | null;
};

export function adjudicateMixedRun(params: {
  fixture: GlobalArchetypeFixture;
  post_archetype_ids: string[];
}): MixedAdjudicatedRunResult | null {
  const relation = mixedRelationType(params.fixture);
  if (!relation) return null;

  const required = params.fixture.expected.required_archetype_ids;
  const post = params.post_archetype_ids;
  const strict_both_required_present = required.every((id) => post.includes(id));

  if (relation === 'distinct_functions_or_carriers') {
    return {
      fixture_id: params.fixture.id,
      mixed_relation_type: relation,
      post_archetype_ids: post,
      strict_both_required_present,
      distinct_carrier_pass: strict_both_required_present,
      same_carrier_dominant_present: null,
      same_carrier_secondary_present: null,
      same_carrier_stress_recall: null,
    };
  }

  const [primary, secondary] = required;
  const dominant_present = post.includes(primary);
  const secondary_present = post.includes(secondary);

  return {
    fixture_id: params.fixture.id,
    mixed_relation_type: relation,
    post_archetype_ids: post,
    strict_both_required_present,
    distinct_carrier_pass: null,
    same_carrier_dominant_present: dominant_present,
    same_carrier_secondary_present: secondary_present,
    same_carrier_stress_recall: secondary_present,
  };
}

export type MixedAdjudicatedMetrics = {
  mixed_fixtures: number;
  distinct_functions_or_carriers: {
    fixtures: number;
    strict_both_required_present: number;
    strict_both_required_rate: number;
  };
  same_carrier_dual_reading: {
    fixtures: number;
    dominant_required_present: number;
    dominant_required_rate: number;
    secondary_stress_recall: number;
    secondary_stress_recall_rate: number;
    strict_both_required_present: number;
  };
};

export function computeMixedAdjudicatedMetrics(
  runs: Array<{ fixture: GlobalArchetypeFixture; post_archetype_ids: string[] }>
): MixedAdjudicatedMetrics {
  const adjudicated = runs
    .map((run) => adjudicateMixedRun(run))
    .filter((row): row is MixedAdjudicatedRunResult => row != null);

  const distinct = adjudicated.filter((r) => r.mixed_relation_type === 'distinct_functions_or_carriers');
  const sameCarrier = adjudicated.filter((r) => r.mixed_relation_type === 'same_carrier_dual_reading');

  const distinctBoth = distinct.filter((r) => r.strict_both_required_present).length;
  const sameDominant = sameCarrier.filter((r) => r.same_carrier_dominant_present).length;
  const sameSecondary = sameCarrier.filter((r) => r.same_carrier_secondary_present).length;
  const sameBoth = sameCarrier.filter((r) => r.strict_both_required_present).length;

  return {
    mixed_fixtures: adjudicated.length,
    distinct_functions_or_carriers: {
      fixtures: distinct.length,
      strict_both_required_present: distinctBoth,
      strict_both_required_rate: distinct.length ? distinctBoth / distinct.length : 0,
    },
    same_carrier_dual_reading: {
      fixtures: sameCarrier.length,
      dominant_required_present: sameDominant,
      dominant_required_rate: sameCarrier.length ? sameDominant / sameCarrier.length : 0,
      secondary_stress_recall: sameSecondary,
      secondary_stress_recall_rate: sameCarrier.length ? sameSecondary / sameCarrier.length : 0,
      strict_both_required_present: sameBoth,
    },
  };
}
