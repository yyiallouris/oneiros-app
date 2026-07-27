import { createHash } from 'crypto';
import { listMythicCatalogIds } from '../../src/ai/catalogs/mythicNarrativeCatalog';
import type {
  NaturalisticMythArm,
  NaturalisticMythFixture,
} from './naturalisticMythBenchmarkFixtures';

export type NaturalisticMythRunRecordShape = {
  run_id: string;
  fixture_id: string;
  repeat_index: 1 | 2 | 3;
  arm: NaturalisticMythArm;
  dream_language: 'en' | 'el';
  expected_myth_presence: 'required' | 'forbidden';
  required_catalog_id: string | null;
  acceptable_catalog_ids: string[];
  forbidden_catalog_ids: string[];
  raw_catalog_ids: string[];
  post_catalog_ids: string[];
  returned_confidence: string | null;
  evidence_ids: string[];
  resonance: string | null;
  divergence: string | null;
  resolved_evidence_spans?: string[];
  presence_match: boolean;
  exact_catalog_match: boolean;
  forbidden_competitor_hit: boolean;
  unexpected_myth: boolean;
  confidence_contract_pass: boolean;
  contract_pass: boolean;
  language_match: boolean;
  validator_decisions: object[];
  model: string;
  fallback_used: boolean;
  latency_ms: number;
  retry_count: number;
  source_run_file: string;
};

export type NaturalisticMythFailureSignals = {
  raw_candidate_omission: boolean;
  raw_correct_post_removed: boolean;
  evidence_resolution_failure: boolean;
  validator_rejection: boolean;
};

export type NaturalisticMythRunScore = Pick<
  NaturalisticMythRunRecordShape,
  | 'presence_match'
  | 'exact_catalog_match'
  | 'forbidden_competitor_hit'
  | 'unexpected_myth'
  | 'confidence_contract_pass'
  | 'contract_pass'
> & {
  failure_signals: NaturalisticMythFailureSignals;
  high_confidence_false_positive: boolean;
};

export type NaturalisticMythRateMetric = {
  numerator: number;
  denominator: number;
  rate: number | null;
};

export type NaturalisticMythSummaryMetrics = {
  total_runs: number;
  contract_pass_count: number;
  contract_pass_rate: number;
  exact_catalog_precision: number | null;
  exact_catalog_recall: number;
  strong_positive_recall: number;
  incomplete_positive_recall: number;
  thematic_negative_empty_accuracy: number;
  competitor_exact_id_accuracy: number;
  wrong_competitor_rate: number;
  high_confidence_false_positive_count: number;
  raw_to_post_retention: number | null;
  language_match_rate: number;
  repeat_consistency_rate: number;
  raw_candidate_omission_count: number;
  raw_correct_post_removed_count: number;
  evidence_resolution_failure_count: number;
  validator_rejection_count: number;
  exact_catalog_precision_metric: NaturalisticMythRateMetric;
  exact_catalog_recall_metric: NaturalisticMythRateMetric;
  strong_positive_metric: NaturalisticMythRateMetric;
  incomplete_positive_metric: NaturalisticMythRateMetric;
  thematic_negative_metric: NaturalisticMythRateMetric;
  competitor_metric: NaturalisticMythRateMetric;
  contract_pass_metric: NaturalisticMythRateMetric;
};

export type NaturalisticMythReviewHypothesis = {
  primary: string;
  secondary: string | null;
};

export function mythDatasetHash(fixtures: NaturalisticMythFixture[]): string {
  return createHash('sha256')
    .update(JSON.stringify(fixtures), 'utf8')
    .digest('hex');
}

function normalize(text: string): string {
  return text
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[^a-z0-9\u0370-\u03ff\s]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function jaccard(a: string, b: string): number {
  const setA = new Set(normalize(a).split(' ').filter(Boolean));
  const setB = new Set(normalize(b).split(' ').filter(Boolean));
  const intersection = [...setA].filter((item) => setB.has(item)).length;
  const union = new Set([...setA, ...setB]).size;
  return union === 0 ? 0 : intersection / union;
}

function armCounts(fixtures: NaturalisticMythFixture[]) {
  return fixtures.reduce<Record<NaturalisticMythArm, number>>(
    (acc, fixture) => {
      acc[fixture.arm] += 1;
      return acc;
    },
    {
      strong_positive: 0,
      incomplete_positive: 0,
      thematic_negative: 0,
      competitor: 0,
    }
  );
}

export function validateNaturalisticMythFixtures(fixtures: NaturalisticMythFixture[]): void {
  const errors: string[] = [];
  const seenIds = new Set<string>();
  const catalogIds = new Set(listMythicCatalogIds());
  const counts = armCounts(fixtures);
  const byLanguage = fixtures.reduce<Record<string, number>>((acc, fixture) => {
    acc[fixture.dream_language] = (acc[fixture.dream_language] ?? 0) + 1;
    return acc;
  }, {});

  if (fixtures.length !== 24) {
    errors.push(`expected 24 fixtures, got ${fixtures.length}`);
  }
  if (counts.strong_positive !== 8) errors.push(`strong_positive count must be 8, got ${counts.strong_positive}`);
  if (counts.incomplete_positive !== 6) {
    errors.push(`incomplete_positive count must be 6, got ${counts.incomplete_positive}`);
  }
  if (counts.thematic_negative !== 6) {
    errors.push(`thematic_negative count must be 6, got ${counts.thematic_negative}`);
  }
  if (counts.competitor !== 4) errors.push(`competitor count must be 4, got ${counts.competitor}`);
  if ((byLanguage.en ?? 0) !== 18 || (byLanguage.el ?? 0) !== 6) {
    errors.push(`language allocation must be en=18 / el=6, got en=${byLanguage.en ?? 0} / el=${byLanguage.el ?? 0}`);
  }

  fixtures.forEach((fixture, index) => {
    if (fixture.dataset_version !== 'myth-naturalistic-calibration.v1.0.0') {
      errors.push(`${fixture.fixture_id}: unexpected dataset_version ${fixture.dataset_version}`);
    }
    if (seenIds.has(fixture.fixture_id)) {
      errors.push(`${fixture.fixture_id}: duplicate fixture_id`);
    }
    seenIds.add(fixture.fixture_id);

    if (fixture.expected_myth_presence === 'required' && !fixture.required_catalog_id) {
      errors.push(`${fixture.fixture_id}: positive fixture missing required_catalog_id`);
    }
    if (fixture.expected_myth_presence === 'forbidden' && fixture.required_catalog_id) {
      errors.push(`${fixture.fixture_id}: negative fixture must not set required_catalog_id`);
    }
    if (fixture.expected_myth_presence === 'required' && fixture.expected_confidence.length === 0) {
      errors.push(`${fixture.fixture_id}: positive fixture missing expected_confidence`);
    }
    if (fixture.expected_myth_presence === 'forbidden' && fixture.expected_confidence.length > 0) {
      errors.push(`${fixture.fixture_id}: negative fixture must not define expected_confidence`);
    }

    const idsToCheck = [
      fixture.required_catalog_id,
      ...fixture.acceptable_catalog_ids,
      ...fixture.forbidden_catalog_ids,
    ].filter((id): id is string => typeof id === 'string' && id.length > 0);
    idsToCheck.forEach((id) => {
      if (!catalogIds.has(id)) {
        errors.push(`${fixture.fixture_id}: unknown catalog id "${id}"`);
      }
    });
    if (
      fixture.required_catalog_id &&
      fixture.forbidden_catalog_ids.includes(fixture.required_catalog_id)
    ) {
      errors.push(`${fixture.fixture_id}: required_catalog_id cannot also be forbidden`);
    }

    for (let j = index + 1; j < fixtures.length; j += 1) {
      const other = fixtures[j];
      if (normalize(fixture.dream_text) === normalize(other.dream_text)) {
        errors.push(`${fixture.fixture_id}: duplicate dream text with ${other.fixture_id}`);
      } else if (jaccard(fixture.dream_text, other.dream_text) > 0.88) {
        errors.push(`${fixture.fixture_id}: near-duplicate dream text with ${other.fixture_id}`);
      }
    }
  });

  if (errors.length > 0) {
    throw new Error(`Naturalistic myth fixtures invalid:\n${errors.join('\n')}`);
  }
}

function confidencePass(
  fixture: NaturalisticMythFixture,
  returnedConfidence: string | null
): boolean {
  if (fixture.expected_myth_presence === 'forbidden') return true;
  if (!returnedConfidence) return false;
  return fixture.expected_confidence.includes(returnedConfidence as 'medium' | 'high');
}

function highConfidenceRawFalsePositive(run: {
  expected_myth_presence: 'required' | 'forbidden';
  raw_catalog_ids: string[];
  returned_confidence: string | null;
}): boolean {
  return (
    run.expected_myth_presence === 'forbidden' &&
    run.raw_catalog_ids.length > 0 &&
    run.returned_confidence === 'high'
  );
}

function buildRateMetric(numerator: number, denominator: number): NaturalisticMythRateMetric {
  return {
    numerator,
    denominator,
    rate: denominator > 0 ? numerator / denominator : null,
  };
}

export function deriveNaturalisticMythFailureSignals(
  run: Pick<
    NaturalisticMythRunRecordShape,
    | 'expected_myth_presence'
    | 'required_catalog_id'
    | 'raw_catalog_ids'
    | 'post_catalog_ids'
    | 'evidence_ids'
  >
): NaturalisticMythFailureSignals {
  const raw = [...new Set(run.raw_catalog_ids)];
  const post = [...new Set(run.post_catalog_ids)];
  const rawCorrectPostRemoved =
    run.expected_myth_presence === 'required' &&
    run.required_catalog_id != null &&
    raw.includes(run.required_catalog_id) &&
    !post.includes(run.required_catalog_id);
  const rawCandidateOmission =
    run.expected_myth_presence === 'required' &&
    run.required_catalog_id != null &&
    !raw.includes(run.required_catalog_id);

  return {
    raw_candidate_omission: rawCandidateOmission,
    raw_correct_post_removed: rawCorrectPostRemoved,
    evidence_resolution_failure: rawCorrectPostRemoved && run.evidence_ids.length === 0,
    validator_rejection: rawCorrectPostRemoved && run.evidence_ids.length > 0,
  };
}

export function scoreNaturalisticMythRun(
  fixture: NaturalisticMythFixture,
  run: Pick<
    NaturalisticMythRunRecordShape,
    | 'raw_catalog_ids'
    | 'post_catalog_ids'
    | 'returned_confidence'
    | 'language_match'
    | 'evidence_ids'
    | 'model'
    | 'fallback_used'
  >,
  options?: { expectedModel?: string }
): NaturalisticMythRunScore {
  const expectedModel = options?.expectedModel ?? 'gpt-5.4-mini-2026-03-17';
  const post = [...new Set(run.post_catalog_ids)];
  const raw = [...new Set(run.raw_catalog_ids)];
  const failureSignals = deriveNaturalisticMythFailureSignals({
    expected_myth_presence: fixture.expected_myth_presence,
    required_catalog_id: fixture.required_catalog_id,
    raw_catalog_ids: raw,
    post_catalog_ids: post,
    evidence_ids: run.evidence_ids,
  });
  const exactCatalogMatch =
    fixture.required_catalog_id != null && post.length === 1 && post[0] === fixture.required_catalog_id;
  const forbiddenCompetitorHit = post.some((id) => fixture.forbidden_catalog_ids.includes(id));
  const unexpectedMyth =
    fixture.expected_myth_presence === 'forbidden'
      ? post.length > 0
      : post.some(
          (id) => id !== fixture.required_catalog_id && !fixture.acceptable_catalog_ids.includes(id)
        );
  const presenceMatch =
    fixture.expected_myth_presence === 'required' ? post.length === 1 : post.length === 0;
  const confidenceContractPass = confidencePass(fixture, run.returned_confidence);
  const validEvidence = fixture.expected_myth_presence === 'forbidden' || run.evidence_ids.length > 0;
  const exactModel = run.model === expectedModel;
  const contractPass =
    presenceMatch &&
    (fixture.expected_myth_presence === 'forbidden' || exactCatalogMatch) &&
    !forbiddenCompetitorHit &&
    !unexpectedMyth &&
    confidenceContractPass &&
    validEvidence &&
    run.language_match &&
    exactModel &&
    !run.fallback_used;

  return {
    presence_match: presenceMatch,
    exact_catalog_match: exactCatalogMatch,
    forbidden_competitor_hit: forbiddenCompetitorHit,
    unexpected_myth: unexpectedMyth,
    confidence_contract_pass: confidenceContractPass,
    contract_pass: contractPass,
    failure_signals: failureSignals,
    high_confidence_false_positive: highConfidenceRawFalsePositive({
      expected_myth_presence: fixture.expected_myth_presence,
      raw_catalog_ids: raw,
      returned_confidence: run.returned_confidence,
    }),
  };
}

type SummaryBucket = {
  fixture_id: string;
  exact_count: number;
  empty_count: number;
  confidence_distribution: Record<string, number>;
  stable: boolean;
};

export function summarizeRepeatConsistency(
  fixtures: NaturalisticMythFixture[],
  runs: NaturalisticMythRunRecordShape[]
): SummaryBucket[] {
  return fixtures.map((fixture) => {
    const fixtureRuns = runs
      .filter((run) => run.fixture_id === fixture.fixture_id)
      .sort((a, b) => a.repeat_index - b.repeat_index);
    const exactCount = fixtureRuns.filter((run) => run.exact_catalog_match).length;
    const emptyCount = fixtureRuns.filter((run) => run.post_catalog_ids.length === 0).length;
    const confidenceDistribution = fixtureRuns.reduce<Record<string, number>>((acc, run) => {
      const key = run.returned_confidence ?? 'null';
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {});
    const stable = exactCount === 0 || exactCount === fixtureRuns.length || emptyCount === fixtureRuns.length;
    return {
      fixture_id: fixture.fixture_id,
      exact_count: exactCount,
      empty_count: emptyCount,
      confidence_distribution: confidenceDistribution,
      stable,
    };
  });
}

export function computeNaturalisticMythMetrics(
  fixtures: NaturalisticMythFixture[],
  runs: NaturalisticMythRunRecordShape[]
): NaturalisticMythSummaryMetrics {
  const positiveRuns = runs.filter((run) => run.expected_myth_presence === 'required');
  const negativeRuns = runs.filter((run) => run.expected_myth_presence === 'forbidden');
  const strongRuns = positiveRuns.filter((run) => run.arm === 'strong_positive');
  const incompleteRuns = positiveRuns.filter((run) => run.arm === 'incomplete_positive');
  const competitorRuns = positiveRuns.filter((run) => run.arm === 'competitor');
  const namedRuns = runs.filter((run) => run.post_catalog_ids.length > 0);
  const correctNamedRuns = namedRuns.filter((run) => run.exact_catalog_match);
  const rawNamedRuns = runs.filter((run) => run.raw_catalog_ids.length > 0);
  const repeats = summarizeRepeatConsistency(fixtures, runs);
  const contractPassCount = runs.filter((run) => run.contract_pass).length;
  const exactCatalogRecallCount = positiveRuns.filter((run) => run.exact_catalog_match).length;
  const strongPositiveCount = strongRuns.filter((run) => run.exact_catalog_match).length;
  const incompletePositiveCount = incompleteRuns.filter((run) => run.exact_catalog_match).length;
  const thematicNegativeCount = negativeRuns.filter((run) => run.post_catalog_ids.length === 0).length;
  const competitorCount = competitorRuns.filter((run) => run.exact_catalog_match).length;
  const rawCandidateOmissionCount = positiveRuns.filter(
    (run) => deriveNaturalisticMythFailureSignals(run).raw_candidate_omission
  ).length;
  const rawCorrectPostRemovedCount = positiveRuns.filter(
    (run) => deriveNaturalisticMythFailureSignals(run).raw_correct_post_removed
  ).length;
  const evidenceResolutionFailureCount = positiveRuns.filter(
    (run) => deriveNaturalisticMythFailureSignals(run).evidence_resolution_failure
  ).length;
  const validatorRejectionCount = positiveRuns.filter(
    (run) => deriveNaturalisticMythFailureSignals(run).validator_rejection
  ).length;

  return {
    total_runs: runs.length,
    contract_pass_count: contractPassCount,
    contract_pass_rate: runs.length ? contractPassCount / runs.length : 0,
    exact_catalog_precision:
      namedRuns.length > 0 ? correctNamedRuns.length / namedRuns.length : null,
    exact_catalog_recall:
      positiveRuns.length > 0 ? exactCatalogRecallCount / positiveRuns.length : 0,
    strong_positive_recall:
      strongRuns.length > 0 ? strongPositiveCount / strongRuns.length : 0,
    incomplete_positive_recall:
      incompleteRuns.length > 0 ? incompletePositiveCount / incompleteRuns.length : 0,
    thematic_negative_empty_accuracy:
      negativeRuns.length > 0 ? thematicNegativeCount / negativeRuns.length : 0,
    competitor_exact_id_accuracy:
      competitorRuns.length > 0 ? competitorCount / competitorRuns.length : 0,
    wrong_competitor_rate:
      positiveRuns.length > 0
        ? positiveRuns.filter((run) => run.forbidden_competitor_hit).length / positiveRuns.length
        : 0,
    high_confidence_false_positive_count: negativeRuns.filter(
      (run) => run.raw_catalog_ids.length > 0 && run.returned_confidence === 'high'
    ).length,
    raw_to_post_retention:
      rawNamedRuns.length > 0
        ? runs.filter((run) => run.raw_catalog_ids.length > 0 && run.post_catalog_ids.length > 0).length /
          rawNamedRuns.length
        : null,
    language_match_rate:
      runs.length > 0 ? runs.filter((run) => run.language_match).length / runs.length : 0,
    repeat_consistency_rate:
      repeats.length > 0 ? repeats.filter((row) => row.stable).length / repeats.length : 0,
    raw_candidate_omission_count: rawCandidateOmissionCount,
    raw_correct_post_removed_count: rawCorrectPostRemovedCount,
    evidence_resolution_failure_count: evidenceResolutionFailureCount,
    validator_rejection_count: validatorRejectionCount,
    exact_catalog_precision_metric: buildRateMetric(correctNamedRuns.length, namedRuns.length),
    exact_catalog_recall_metric: buildRateMetric(exactCatalogRecallCount, positiveRuns.length),
    strong_positive_metric: buildRateMetric(strongPositiveCount, strongRuns.length),
    incomplete_positive_metric: buildRateMetric(incompletePositiveCount, incompleteRuns.length),
    thematic_negative_metric: buildRateMetric(thematicNegativeCount, negativeRuns.length),
    competitor_metric: buildRateMetric(competitorCount, competitorRuns.length),
    contract_pass_metric: buildRateMetric(contractPassCount, runs.length),
  };
}

export function buildMythLevelReport(
  fixtures: NaturalisticMythFixture[],
  runs: NaturalisticMythRunRecordShape[]
) {
  const mythIds = [...new Set(fixtures.map((fixture) => fixture.required_catalog_id).filter(Boolean))];
  return mythIds.map((catalogId) => {
    const relatedFixtures = fixtures.filter((fixture) => fixture.required_catalog_id === catalogId);
    const relatedRuns = runs.filter((run) => run.required_catalog_id === catalogId);
    const strongRuns = relatedRuns.filter((run) => run.arm === 'strong_positive');
    const incompleteRuns = relatedRuns.filter((run) => run.arm === 'incomplete_positive');
    const competitorRuns = relatedRuns.filter((run) => run.arm === 'competitor');
    const falseAppearances = runs.filter(
      (run) =>
        run.expected_myth_presence === 'forbidden' &&
        (run.raw_catalog_ids.includes(catalogId as string) || run.post_catalog_ids.includes(catalogId as string))
    );
    const competitorIds = relatedRuns
      .flatMap((run) => run.post_catalog_ids.filter((id) => id !== catalogId))
      .reduce<Record<string, number>>((acc, id) => {
        acc[id] = (acc[id] ?? 0) + 1;
        return acc;
      }, {});
    const confidenceDistribution = relatedRuns.reduce<Record<string, number>>((acc, run) => {
      const key = run.returned_confidence ?? 'null';
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {});
    const failureSignals = relatedRuns.map((run) => deriveNaturalisticMythFailureSignals(run));
    const strongPositiveSuccessCount = strongRuns.filter((run) => run.exact_catalog_match).length;
    const incompletePositiveSuccessCount = incompleteRuns.filter((run) => run.exact_catalog_match).length;
    const competitorSuccessCount = competitorRuns.filter((run) => run.exact_catalog_match).length;
    return {
      catalog_id: catalogId,
      fixture_count: relatedFixtures.length,
      strong_positive_success_rate:
        strongRuns.length > 0 ? strongPositiveSuccessCount / strongRuns.length : null,
      incomplete_positive_success_rate:
        incompleteRuns.length > 0 ? incompletePositiveSuccessCount / incompleteRuns.length : null,
      competitor_success_rate:
        competitorRuns.length > 0 ? competitorSuccessCount / competitorRuns.length : null,
      strong_positive_success_metric: buildRateMetric(strongPositiveSuccessCount, strongRuns.length),
      incomplete_positive_success_metric: buildRateMetric(incompletePositiveSuccessCount, incompleteRuns.length),
      competitor_success_metric: buildRateMetric(competitorSuccessCount, competitorRuns.length),
      false_appearances_in_negatives: falseAppearances.length,
      most_common_competing_catalog_ids: Object.entries(competitorIds)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([id, count]) => ({ catalog_id: id, count })),
      confidence_distribution: confidenceDistribution,
      raw_candidate_omission_count: failureSignals.filter((signal) => signal.raw_candidate_omission).length,
      raw_correct_post_removed_count: failureSignals.filter((signal) => signal.raw_correct_post_removed).length,
      evidence_resolution_failure_count: failureSignals.filter(
        (signal) => signal.evidence_resolution_failure
      ).length,
      validator_rejection_count: failureSignals.filter((signal) => signal.validator_rejection).length,
    };
  });
}

export function inferReviewHypotheses(
  run: NaturalisticMythRunRecordShape
): NaturalisticMythReviewHypothesis {
  if (!run.language_match) {
    return {
      primary: 'F. language failure',
      secondary: null,
    };
  }
  if (run.fallback_used) {
    return {
      primary: 'G. stochastic candidate omission / selection instability',
      secondary: null,
    };
  }
  const failureSignals = deriveNaturalisticMythFailureSignals(run);
  if (failureSignals.evidence_resolution_failure) {
    return {
      primary: 'E. evidence resolution failure',
      secondary: null,
    };
  }
  if (failureSignals.validator_rejection) {
    return {
      primary: 'E. validator rejection after correct raw candidate',
      secondary: null,
    };
  }
  if (run.expected_myth_presence === 'required' && run.post_catalog_ids.length === 0) {
    return {
      primary: 'G. stochastic candidate omission / selection instability',
      secondary: run.arm === 'competitor' ? 'A. excessive caution under distracting competitor framing' : null,
    };
  }
  if (run.forbidden_competitor_hit) {
    return {
      primary: 'C. competitor confusion',
      secondary: null,
    };
  }
  if (run.expected_myth_presence === 'forbidden' && run.post_catalog_ids.length > 0) {
    return {
      primary: 'D. unsupported false positive',
      secondary: null,
    };
  }
  if (run.arm === 'incomplete_positive' && !run.exact_catalog_match) {
    return {
      primary: 'A. excessive strictness',
      secondary: null,
    };
  }
  return {
    primary: 'G. stochastic candidate omission / selection instability',
    secondary: null,
  };
}

export function inferReviewHypothesis(run: NaturalisticMythRunRecordShape): string {
  return inferReviewHypotheses(run).primary;
}

export function reconcileNaturalisticMythRunRecords(params: {
  fixtures: NaturalisticMythFixture[];
  runs: NaturalisticMythRunRecordShape[];
  failed_runs: Array<{ fixture_id: string; repeat_index: 1 | 2 | 3 }>;
  outDir: string;
  expectedModel?: string;
}): string[] {
  const expectedModel = params.expectedModel ?? 'gpt-5.4-mini-2026-03-17';
  const errors: string[] = [];
  const seenRunIds = new Set<string>();
  const seenFixtureRepeats = new Set<string>();

  for (const run of params.runs) {
    if (seenRunIds.has(run.run_id)) {
      errors.push(`duplicate run_id: ${run.run_id}`);
    }
    seenRunIds.add(run.run_id);

    const key = `${run.fixture_id}:${run.repeat_index}`;
    if (seenFixtureRepeats.has(key)) {
      errors.push(`duplicate fixture repeat: ${key}`);
    }
    seenFixtureRepeats.add(key);

    if (!run.source_run_file || !run.source_run_file.includes(params.outDir)) {
      errors.push(`${run.run_id}: missing or external source_run_file`);
    }
    if (run.model !== expectedModel) {
      errors.push(`${run.run_id}: wrong model ${run.model}`);
    }
    if (run.fallback_used) {
      errors.push(`${run.run_id}: fallback_used must be false`);
    }
  }

  for (const fixture of params.fixtures) {
    for (const repeatIndex of [1, 2, 3] as const) {
      const key = `${fixture.fixture_id}:${repeatIndex}`;
      const completed = seenFixtureRepeats.has(key);
      const failed = params.failed_runs.some(
        (run) => run.fixture_id === fixture.fixture_id && run.repeat_index === repeatIndex
      );
      if (!completed && !failed) {
        errors.push(`missing run artifact for ${key}`);
      }
    }
  }

  return errors;
}
