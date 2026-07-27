import { createHash } from 'crypto';
import { selectableArchetypeIds } from '../../src/ai/catalogs/archetypeCatalog.v1';

export type GlobalArchetypeCategory = 'single_primary' | 'mixed' | 'contrast_negative';

export type GlobalArchetypeExpected = {
  required_archetype_ids: string[];
  acceptable_secondary_ids: string[];
  forbidden_archetype_ids: string[];
  expected_cardinality: { min: number; max: number };
};

export type GlobalArchetypeEvaluationStyle = 'catalog_conformance' | 'naturalistic';

export type GlobalArchetypeFixture = {
  id: string;
  category: GlobalArchetypeCategory;
  evaluation_style: GlobalArchetypeEvaluationStyle;
  dream_language: string;
  dream: string;
  /** Metadata for single-primary rows — not used in scoring. */
  primary_archetype_id?: string;
  /**
   * Anima/Animus gold labels use carrier-function convention (independent of dreamer gender).
   * See docs/ONEIROS_GLOBAL_ARCHETYPE_BENCHMARK.md.
   */
  soul_image_convention?: 'carrier_function_independent_of_dreamer_gender';
  expected: GlobalArchetypeExpected;
};

export type GlobalArchetypeRunScore = {
  contract_pass: boolean;
  /** Post IDs equal required IDs exactly (acceptable secondaries may be omitted). */
  exact_set_match: boolean;
  /** exact_set_match on fixtures with no acceptable_secondary_ids. */
  unambiguous_exact_set_match: boolean;
  required_recall: boolean;
  forbidden_violation: boolean;
  cardinality_ok: boolean;
  unexpected_extra_ids: string[];
  missing_required_ids: string[];
  forbidden_hits: string[];
};

const SELECTABLE = new Set(selectableArchetypeIds());

export function dreamHash(text: string): string {
  return createHash('sha256').update(text, 'utf8').digest('hex').slice(0, 16);
}

function uniqueSorted(ids: string[]): string[] {
  return [...new Set(ids.map((id) => id.trim()).filter(Boolean))].sort();
}

export function validateGlobalArchetypeFixtures(fixtures: GlobalArchetypeFixture[]): void {
  const errors: string[] = [];
  const seenIds = new Set<string>();

  for (const fixture of fixtures) {
    if (seenIds.has(fixture.id)) {
      errors.push(`${fixture.id}: duplicate fixture id`);
    }
    seenIds.add(fixture.id);

    const { expected } = fixture;
    const required = uniqueSorted(expected.required_archetype_ids);
    const acceptable = uniqueSorted(expected.acceptable_secondary_ids);
    const forbidden = uniqueSorted(expected.forbidden_archetype_ids);
    const { min, max } = expected.expected_cardinality;

    if (max > 2) {
      errors.push(`${fixture.id}: expected_cardinality.max > 2`);
    }
    if (min < 0 || max < min) {
      errors.push(`${fixture.id}: invalid expected_cardinality range`);
    }
    if (required.length > 2) {
      errors.push(`${fixture.id}: more than two required archetypes`);
    }
    if (required.length > max) {
      errors.push(`${fixture.id}: required count exceeds cardinality max`);
    }
    if (required.length > 0 && min < required.length) {
      errors.push(`${fixture.id}: cardinality min < required count`);
    }

    const overlapReqForbidden = required.filter((id) => forbidden.includes(id));
    if (overlapReqForbidden.length > 0) {
      errors.push(`${fixture.id}: required/forbidden overlap: ${overlapReqForbidden.join(', ')}`);
    }

    for (const id of [...required, ...acceptable, ...forbidden]) {
      if (!SELECTABLE.has(id)) {
        errors.push(`${fixture.id}: unknown archetype id "${id}"`);
      }
    }

    if (fixture.category === 'single_primary') {
      if (required.length !== 1) {
        errors.push(`${fixture.id}: single_primary must have exactly one required archetype`);
      }
      if (fixture.primary_archetype_id && fixture.primary_archetype_id !== required[0]) {
        errors.push(`${fixture.id}: primary_archetype_id mismatch`);
      }
    }
    if (fixture.category === 'mixed' && required.length !== 2) {
      errors.push(`${fixture.id}: mixed must require exactly two archetypes`);
    }
    if (fixture.category === 'contrast_negative' && required.length > 0) {
      errors.push(`${fixture.id}: contrast_negative must not require archetypes`);
    }
    if (!fixture.evaluation_style) {
      errors.push(`${fixture.id}: missing evaluation_style`);
    }
  }

  if (errors.length > 0) {
    throw new Error(`Global archetype fixtures invalid:\n${errors.join('\n')}`);
  }
}

export function scoreGlobalArchetypeRun(
  fixture: GlobalArchetypeFixture,
  postIds: string[]
): GlobalArchetypeRunScore {
  const post = uniqueSorted(postIds);
  const required = uniqueSorted(fixture.expected.required_archetype_ids);
  const acceptable = uniqueSorted(fixture.expected.acceptable_secondary_ids);
  const forbidden = uniqueSorted(fixture.expected.forbidden_archetype_ids);
  const { min, max } = fixture.expected.expected_cardinality;

  const missing_required_ids = required.filter((id) => !post.includes(id));
  const forbidden_hits = post.filter((id) => forbidden.includes(id));
  const unexpected_extra_ids = post.filter((id) => !required.includes(id) && !acceptable.includes(id));
  // Invariant: any post ID outside required ∪ acceptable is a contract failure.
  // forbidden_archetype_ids name high-value confusions; they are not an exhaustive complement.

  const required_recall = missing_required_ids.length === 0;
  const forbidden_violation = forbidden_hits.length > 0;
  const cardinality_ok = post.length >= min && post.length <= max;
  const contract_pass =
    required_recall && !forbidden_violation && cardinality_ok && unexpected_extra_ids.length === 0;
  const exact_set_match =
    contract_pass &&
    post.length === required.length &&
    required.every((id) => post.includes(id));
  const unambiguous_exact_set_match = exact_set_match && acceptable.length === 0;

  return {
    contract_pass,
    exact_set_match,
    unambiguous_exact_set_match,
    required_recall,
    forbidden_violation,
    cardinality_ok,
    unexpected_extra_ids,
    missing_required_ids,
    forbidden_hits,
  };
}

export type ConfusionPair = {
  expected_id: string;
  returned_id: string;
  count: number;
  fixture_ids: string[];
};

export type GlobalArchetypeAggregateMetrics = {
  total_runs: number;
  contract_pass_count: number;
  contract_pass_rate: number;
  exact_set_accuracy: number;
  /** Only fixtures with empty acceptable_secondary_ids. */
  unambiguous_exact_set_accuracy: number;
  unambiguous_fixture_count: number;
  required_label_recall: number;
  forbidden_false_positive_rate: number;
  empty_dream_accuracy: number;
  correct_cardinality_rate: number;
  raw_to_post_retention_rate: number;
  per_archetype: Record<
    string,
    {
      precision: number | null;
      recall: number | null;
      tp: number;
      fp: number;
      fn: number;
      gold_positive_fixtures: number;
    }
  >;
  macro_precision: number | null;
  macro_recall: number | null;
  confusion_pairs: ConfusionPair[];
  slot_competition: {
    raw_candidate_gt2_count: number;
    raw_candidate_gt2_contract_fail: number;
    both_required_present_when_mixed: number;
    mixed_fixtures: number;
    one_required_suppressed_when_mixed: number;
  };
  myth_regression_telemetry: {
    schema_failures: number;
    proxy_failures: number;
    runs_with_myth_post: number;
  };
};

export type GlobalArchetypeStyleMetrics = Pick<
  GlobalArchetypeAggregateMetrics,
  | 'total_runs'
  | 'contract_pass_count'
  | 'contract_pass_rate'
  | 'exact_set_accuracy'
  | 'unambiguous_exact_set_accuracy'
  | 'required_label_recall'
  | 'forbidden_false_positive_rate'
  | 'empty_dream_accuracy'
  | 'correct_cardinality_rate'
  | 'raw_to_post_retention_rate'
  | 'macro_precision'
  | 'macro_recall'
>;

export type GlobalArchetypeRunMetricsInput = {
  fixture: GlobalArchetypeFixture;
  post_archetype_ids: string[];
  raw_archetype_ids: string[];
  raw_candidate_count: number;
  schema_ok: boolean;
  proxy_ok: boolean;
  post_myth_count: number;
};

function styleSlice(metrics: GlobalArchetypeAggregateMetrics): GlobalArchetypeStyleMetrics {
  return {
    total_runs: metrics.total_runs,
    contract_pass_count: metrics.contract_pass_count,
    contract_pass_rate: metrics.contract_pass_rate,
    exact_set_accuracy: metrics.exact_set_accuracy,
    unambiguous_exact_set_accuracy: metrics.unambiguous_exact_set_accuracy,
    required_label_recall: metrics.required_label_recall,
    forbidden_false_positive_rate: metrics.forbidden_false_positive_rate,
    empty_dream_accuracy: metrics.empty_dream_accuracy,
    correct_cardinality_rate: metrics.correct_cardinality_rate,
    raw_to_post_retention_rate: metrics.raw_to_post_retention_rate,
    macro_precision: metrics.macro_precision,
    macro_recall: metrics.macro_recall,
  };
}

export function computeGlobalArchetypeMetricsByStyle(
  runs: GlobalArchetypeRunMetricsInput[]
): {
  global: GlobalArchetypeAggregateMetrics;
  catalog_conformance: GlobalArchetypeStyleMetrics;
  naturalistic: GlobalArchetypeStyleMetrics;
} {
  const global = computeGlobalArchetypeMetrics(runs);
  const catalog = computeGlobalArchetypeMetrics(
    runs.filter((r) => r.fixture.evaluation_style === 'catalog_conformance')
  );
  const naturalistic = computeGlobalArchetypeMetrics(
    runs.filter((r) => r.fixture.evaluation_style === 'naturalistic')
  );
  return {
    global,
    catalog_conformance: styleSlice(catalog),
    naturalistic: styleSlice(naturalistic),
  };
}

export function computeGlobalArchetypeMetrics(
  runs: GlobalArchetypeRunMetricsInput[]
): GlobalArchetypeAggregateMetrics {
  const selectable = selectableArchetypeIds();
  const per: GlobalArchetypeAggregateMetrics['per_archetype'] = Object.fromEntries(
    selectable.map((id) => [id, { precision: null, recall: null, tp: 0, fp: 0, fn: 0, gold_positive_fixtures: 0 }])
  );

  let contract_pass_count = 0;
  let exact_set_matches = 0;
  let unambiguousFixtures = 0;
  let unambiguousExactMatches = 0;
  let requiredChecks = 0;
  let requiredHits = 0;
  let forbiddenChecks = 0;
  let forbiddenHits = 0;
  let emptyDreams = 0;
  let emptyCorrect = 0;
  let cardinalityOk = 0;
  let rawTotal = 0;
  let postTotal = 0;

  const confusionMap = new Map<string, ConfusionPair>();
  let rawGt2 = 0;
  let rawGt2Fail = 0;
  let mixedFixtures = 0;
  let bothRequiredPresent = 0;
  let oneRequiredSuppressed = 0;
  let schemaFailures = 0;
  let proxyFailures = 0;
  let runsWithMythPost = 0;

  for (const run of runs) {
    const score = scoreGlobalArchetypeRun(run.fixture, run.post_archetype_ids);
    if (score.contract_pass) contract_pass_count += 1;
    if (score.exact_set_match) exact_set_matches += 1;
    if (run.fixture.expected.acceptable_secondary_ids.length === 0) {
      unambiguousFixtures += 1;
      if (score.unambiguous_exact_set_match) unambiguousExactMatches += 1;
    }
    if (score.cardinality_ok) cardinalityOk += 1;
    if (!run.schema_ok) schemaFailures += 1;
    if (!run.proxy_ok) proxyFailures += 1;
    if (run.post_myth_count > 0) runsWithMythPost += 1;

    rawTotal += run.raw_candidate_count;
    postTotal += run.post_archetype_ids.length;

    const required = uniqueSorted(run.fixture.expected.required_archetype_ids);
    for (const id of required) {
      requiredChecks += 1;
      if (run.post_archetype_ids.includes(id)) requiredHits += 1;
      per[id].gold_positive_fixtures += 1;
      if (!run.post_archetype_ids.includes(id)) {
        per[id].fn += 1;
        for (const returned of run.post_archetype_ids) {
          if (returned === id) continue;
          const key = `${id}→${returned}`;
          const existing = confusionMap.get(key);
          if (existing) {
            existing.count += 1;
            existing.fixture_ids.push(run.fixture.id);
          } else {
            confusionMap.set(key, {
              expected_id: id,
              returned_id: returned,
              count: 1,
              fixture_ids: [run.fixture.id],
            });
          }
        }
        if (run.post_archetype_ids.length === 0) {
          const key = `${id}→(empty)`;
          const existing = confusionMap.get(key);
          if (existing) {
            existing.count += 1;
            existing.fixture_ids.push(run.fixture.id);
          } else {
            confusionMap.set(key, {
              expected_id: id,
              returned_id: '(empty)',
              count: 1,
              fixture_ids: [run.fixture.id],
            });
          }
        }
      } else {
        per[id].tp += 1;
      }
    }

    for (const forbiddenId of run.fixture.expected.forbidden_archetype_ids) {
      forbiddenChecks += 1;
      if (run.post_archetype_ids.includes(forbiddenId)) forbiddenHits += 1;
    }

    for (const returned of run.post_archetype_ids) {
      const goldPositive =
        run.fixture.expected.required_archetype_ids.includes(returned) ||
        run.fixture.expected.acceptable_secondary_ids.includes(returned);
      if (!goldPositive && per[returned]) {
        per[returned].fp += 1;
      }
    }

    if (run.fixture.category === 'contrast_negative') {
      emptyDreams += 1;
      if (run.post_archetype_ids.length === 0) emptyCorrect += 1;
    }

    if (run.raw_candidate_count > 2) {
      rawGt2 += 1;
      if (!score.contract_pass) rawGt2Fail += 1;
    }

    if (run.fixture.category === 'mixed') {
      mixedFixtures += 1;
      const both = required.every((id) => run.post_archetype_ids.includes(id));
      if (both) bothRequiredPresent += 1;
      else if (required.some((id) => run.post_archetype_ids.includes(id))) oneRequiredSuppressed += 1;
    }
  }

  for (const id of selectable) {
    const row = per[id];
    row.precision = row.tp + row.fp > 0 ? row.tp / (row.tp + row.fp) : null;
    row.recall = row.tp + row.fn > 0 ? row.tp / (row.tp + row.fn) : null;
  }

  const macroPrecisionValues = selectable
    .map((id) => per[id].precision)
    .filter((v): v is number => v != null);
  const macroRecallValues = selectable
    .map((id) => per[id].recall)
    .filter((v): v is number => v != null);

  const confusion_pairs = [...confusionMap.values()].sort((a, b) => b.count - a.count);

  return {
    total_runs: runs.length,
    contract_pass_count,
    contract_pass_rate: runs.length ? contract_pass_count / runs.length : 0,
    exact_set_accuracy: runs.length ? exact_set_matches / runs.length : 0,
    unambiguous_exact_set_accuracy: unambiguousFixtures
      ? unambiguousExactMatches / unambiguousFixtures
      : 0,
    unambiguous_fixture_count: unambiguousFixtures,
    required_label_recall: requiredChecks ? requiredHits / requiredChecks : 0,
    forbidden_false_positive_rate: forbiddenChecks ? forbiddenHits / forbiddenChecks : 0,
    empty_dream_accuracy: emptyDreams ? emptyCorrect / emptyDreams : 0,
    correct_cardinality_rate: runs.length ? cardinalityOk / runs.length : 0,
    raw_to_post_retention_rate: rawTotal ? postTotal / rawTotal : 0,
    per_archetype: per,
    macro_precision: macroPrecisionValues.length
      ? macroPrecisionValues.reduce((a, b) => a + b, 0) / macroPrecisionValues.length
      : null,
    macro_recall: macroRecallValues.length
      ? macroRecallValues.reduce((a, b) => a + b, 0) / macroRecallValues.length
      : null,
    confusion_pairs,
    slot_competition: {
      raw_candidate_gt2_count: rawGt2,
      raw_candidate_gt2_contract_fail: rawGt2Fail,
      both_required_present_when_mixed: bothRequiredPresent,
      mixed_fixtures: mixedFixtures,
      one_required_suppressed_when_mixed: oneRequiredSuppressed,
    },
    myth_regression_telemetry: {
      schema_failures: schemaFailures,
      proxy_failures: proxyFailures,
      runs_with_myth_post: runsWithMythPost,
    },
  };
}
