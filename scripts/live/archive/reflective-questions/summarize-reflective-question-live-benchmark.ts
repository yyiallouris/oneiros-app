import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';

type ScoreKey =
  | 'epistemic_integrity'
  | 'dream_specificity'
  | 'openness_non_leading'
  | 'natural_language'
  | 'psychological_aliveness'
  | 'proportionality'
  | 'non_template_quality';

type HardFlag =
  | 'INVENTED_AFFECT_OR_MOTIVE'
  | 'INVENTED_RELATION'
  | 'INVENTED_CONFLICT_OR_PATHOLOGY'
  | 'EMBEDDED_INTERPRETATION'
  | 'WAKING_LIFE_INFERENCE'
  | 'FACTUAL_DREAM_INVENTION';

type EditorialFlag =
  | 'SIGNIFICANCE_INFLATION'
  | 'BANAL_INFLATION'
  | 'QUESTION_SHAPED_PARAPHRASE'
  | 'FORCED_RELATIONAL_STRUCTURE'
  | 'ARBITRARY_JUXTAPOSITION'
  | 'LEADING_QUESTION'
  | 'NON_ACTION_INTERPRETATION'
  | 'UNNATURAL_LANGUAGE'
  | 'GENERIC_REUSABLE_QUESTION'
  | 'TEMPLATE_COLLAPSE'
  | 'WEAK_PSYCHOLOGICAL_ALIVENESS'
  | 'OVERCOMPLEX_WORDING'
  | 'OTHER';

type Verdict = 'PASS' | 'SOFT_FAIL' | 'FAIL';

type Review = {
  blind_id: string;
  scores: Record<ScoreKey, number | null>;
  hard_flags: Record<HardFlag, boolean | null>;
  editorial_flags: Record<EditorialFlag, boolean | null>;
  experiment_failure_modes?: Record<string, boolean | null>;
  would_i_want_to_answer: boolean | null;
  pull_to_answer?: 0 | 1 | 2 | null;
  felt_read?: 0 | 1 | 2 | null;
  holds_the_charge?: 0 | 1 | 2 | null;
  ordinary_material_class?: string | null;
  multi_anchor_supported?: boolean | null;
  selection_rubric_leakage?: boolean | null;
  selection_rubric_leakage_subclass?:
    | 'importance_leak'
    | 'opening_leak'
    | 'selector_paraphrase'
    | 'legitimate_dream_language'
    | null;
  verdict: Verdict | null;
  template_analysis: {
    question_architecture: string | null;
    anchor_construction: 'single' | 'two' | 'multiple' | 'unclear' | null;
    grammatical_operator: string | null;
    relation_coexistence_framing: boolean | null;
    what_changes_framing: boolean | null;
    generic_experiential_framing: boolean | null;
    repeated_abstract_operators: string[];
  };
  rationale: string;
};

type ManifestItem = {
  blind_id: string;
  case_id: string;
  repeat: number;
  categories: string[];
  length_band: 'short' | 'medium' | 'long';
  narrative_features: string[];
  dream_word_count: number;
};

type DominantFrequency = {
  value: string;
  count: number;
  percentage: number;
} | null;

type Trial = {
  case_id: string;
  repeat: number;
  title: string;
  dream: string;
  raw_question: string;
  question: string | null;
  parse_error: string | null;
  technical_error: string | null;
  template_telemetry: Record<string, unknown> | null;
};

type Results = {
  active_method_id: string;
  active_method_version: string;
  metrics: {
    trials: number;
    valid_single_questions: number;
    technical_failures: number;
    prompt_contract_failures: number;
    invalid_outputs: number;
    latency_p50_ms: number;
    latency_p95_ms: number;
    total_input_tokens: number;
    total_output_tokens: number;
    total_tokens: number;
    total_estimated_usd: number | null;
    template_telemetry: {
      dominant_exact_opening: DominantFrequency;
      dominant_first_3_words: DominantFrequency;
      dominant_first_5_words: DominantFrequency;
      dominant_grammatical_operator: DominantFrequency;
      relation_coexistence_framing_count: number;
      what_changes_framing_count: number;
      generic_experiential_framing_count: number;
      abstract_operator_counts: Record<string, number>;
    };
  };
  trials: Trial[];
};

type ComparisonSummary = {
  active_method_id: string;
  active_method_version: string;
  machine_contract: {
    template_telemetry: {
      dominant_first_3_words: DominantFrequency;
    };
  };
  manual: {
    verdict_counts: Record<Verdict, number>;
    pass_rate: number;
    soft_fail_rate: number;
    fail_rate: number;
    hard_epistemic_failures: number;
    hard_flag_counts: Record<HardFlag, number>;
    editorial_flag_counts: Record<EditorialFlag, number>;
    significance_or_banal_inflation_rate: number;
    natural_clean_rate: number;
    manual_template_analysis: {
      relation_coexistence_framing_count: number;
      anchor_constructions: Record<string, number>;
    };
    by_category: Record<
      string,
      {
        trials: number;
        pass_rate: number;
        hard_epistemic_failures: number;
      }
    >;
    by_length_band: Record<
      string,
      {
        trials: number;
        pass_rate: number;
        hard_epistemic_failures: number;
      }
    >;
  };
};

const SCORE_KEYS: ScoreKey[] = [
  'epistemic_integrity',
  'dream_specificity',
  'openness_non_leading',
  'natural_language',
  'psychological_aliveness',
  'proportionality',
  'non_template_quality',
];

const HARD_FLAGS: HardFlag[] = [
  'INVENTED_AFFECT_OR_MOTIVE',
  'INVENTED_RELATION',
  'INVENTED_CONFLICT_OR_PATHOLOGY',
  'EMBEDDED_INTERPRETATION',
  'WAKING_LIFE_INFERENCE',
  'FACTUAL_DREAM_INVENTION',
];

const EDITORIAL_FLAGS: EditorialFlag[] = [
  'SIGNIFICANCE_INFLATION',
  'BANAL_INFLATION',
  'QUESTION_SHAPED_PARAPHRASE',
  'FORCED_RELATIONAL_STRUCTURE',
  'ARBITRARY_JUXTAPOSITION',
  'LEADING_QUESTION',
  'NON_ACTION_INTERPRETATION',
  'UNNATURAL_LANGUAGE',
  'GENERIC_REUSABLE_QUESTION',
  'TEMPLATE_COLLAPSE',
  'WEAK_PSYCHOLOGICAL_ALIVENESS',
  'OVERCOMPLEX_WORDING',
  'OTHER',
];

const VERDICTS: Verdict[] = ['PASS', 'SOFT_FAIL', 'FAIL'];
const UX_SCORES = [0, 1, 2] as const;
const PAIRWISE_PREFERENCES = ['left', 'right', 'tie', 'neither'] as const;
const FROZEN_V13_LIVE_RESULTS =
  'tmp/reflective-question-v1-3-live-benchmark-2026-08-26T16-24-43-552Z/results.json';
const SCAFFOLD_BASINS = [
  ['notice', /notice|παρατηρ/iu],
  ['how-was-it', /how was it|πώς ήταν|πως ήταν|πως ηταν/iu],
  ['stays-with-you', /stays with you|μένει μαζί|μενει μαζί/iu],
  ['what-is-it-about', /what is it about|τι είναι αυτό|τι ειναι αυτο/iu],
  ['what-happens-when', /what happens when|τι γίνεται όταν|τι γινεται οταν/iu],
  ['what-changes', /what changes|τι αλλάζει|τι αλλαζει/iu],
  ['what-do-you-feel', /what do you feel|τι νιώθεις|τι νιωθεις|τι αισθάνεσαι/iu],
] as const;
const EXTRA_OPERATOR_BASINS = [
  ['τι παρατηρείς', /τι παρατηρείς|τι παρατηρεις/iu],
  ['πώς ήταν/είναι', /πώς ήταν|πως ήταν|πως ηταν|πώς είναι|πως είναι|πως ειναι/iu],
  ['τι αλλάζει', /τι αλλάζει|τι αλλαζει/iu],
  ['τι σημαίνει', /τι σημαίνει|τι σημαινει/iu],
  ['τι σε κάνει', /τι σε κάνει|τι σε κανει/iu],
  [
    'relation/coexistence/contrast',
    /relation|coexist|contrast|συνυπάρχ|αντίθεση|σχέση/iu,
  ],
] as const;
const ORDINARY_MATERIAL_CLASSES = [
  'artificial_significance',
  'invented_relationship',
  'generic_safe_fallback',
  'question_shaped_paraphrase',
  'irrelevant_selection',
  'precise_modest_curiosity',
  'genuinely_useful_reflection',
] as const;
const FROZEN_V13_METHOD_ID = 'reflective-question-oneiros-reader-v1.3.0';
const LEAKAGE_YES_SUBCLASSES = [
  'importance_leak',
  'opening_leak',
  'selector_paraphrase',
] as const;
const LEAKAGE_NO_SUBCLASSES = ['legitimate_dream_language'] as const;

type PairwisePacketKind = 'default' | 'vs-ablation' | 'vs-v13' | 'vs-decoupling';

type PairwisePreference = (typeof PAIRWISE_PREFERENCES)[number];
type PairwiseReview = {
  pair_id: string;
  preference: PairwisePreference | null;
  reason: string;
  left: {
    pull_to_answer: 0 | 1 | 2 | null;
    felt_read: 0 | 1 | 2 | null;
    holds_the_charge?: 0 | 1 | 2 | null;
    first_read_clarity?: 0 | 1 | 2 | null;
    dream_native_language?: 0 | 1 | 2 | null;
  };
  right: {
    pull_to_answer: 0 | 1 | 2 | null;
    felt_read: 0 | 1 | 2 | null;
    holds_the_charge?: 0 | 1 | 2 | null;
    first_read_clarity?: 0 | 1 | 2 | null;
    dream_native_language?: 0 | 1 | 2 | null;
  };
};
type PairwiseManifestItem = {
  pair_id: string;
  case_id: string;
  repeat: number;
  left_method_id: string;
  right_method_id: string;
};

function readJson<T>(filePath: string): T {
  return JSON.parse(readFileSync(filePath, 'utf8')) as T;
}

function percentage(count: number, total: number): number {
  return total === 0 ? 0 : Number(((count / total) * 100).toFixed(2));
}

function frequencies(values: string[]) {
  return values.reduce<Record<string, number>>((counts, value) => {
    counts[value] = (counts[value] ?? 0) + 1;
    return counts;
  }, {});
}

function average(values: number[]): number {
  return values.length === 0
    ? 0
    : Number(
        (values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(
          2
        )
      );
}

function validateReview(review: Review, manifestById: Map<string, ManifestItem>) {
  for (const key of SCORE_KEYS) {
    const score = review.scores[key];
    if (!Number.isInteger(score) || (score ?? 0) < 1 || (score ?? 0) > 5) {
      throw new Error(`${review.blind_id} has an incomplete ${key} score.`);
    }
  }
  for (const key of HARD_FLAGS) {
    if (typeof review.hard_flags[key] !== 'boolean') {
      throw new Error(`${review.blind_id} has an incomplete ${key} hard flag.`);
    }
  }
  for (const key of EDITORIAL_FLAGS) {
    if (typeof review.editorial_flags[key] !== 'boolean') {
      throw new Error(
        `${review.blind_id} has an incomplete ${key} editorial flag.`
      );
    }
  }
  if (
    typeof review.would_i_want_to_answer !== 'boolean' ||
    !review.verdict ||
    !VERDICTS.includes(review.verdict)
  ) {
    throw new Error(`${review.blind_id} has an incomplete verdict.`);
  }
  if (
    !review.rationale.trim() ||
    !review.template_analysis.question_architecture ||
    !review.template_analysis.anchor_construction ||
    !review.template_analysis.grammatical_operator ||
    typeof review.template_analysis.relation_coexistence_framing !==
      'boolean' ||
    typeof review.template_analysis.what_changes_framing !== 'boolean' ||
    typeof review.template_analysis.generic_experiential_framing !== 'boolean'
  ) {
    throw new Error(
      `${review.blind_id} has incomplete rationale or template analysis.`
    );
  }
  if (!manifestById.has(review.blind_id)) {
    throw new Error(`${review.blind_id} is absent from the blind manifest.`);
  }
  if (review.experiment_failure_modes) {
    for (const [key, value] of Object.entries(review.experiment_failure_modes)) {
      if (typeof value !== 'boolean') {
        throw new Error(
          `${review.blind_id} has an incomplete experiment failure mode ${key}.`
        );
      }
    }
  }
  if ('pull_to_answer' in review || 'felt_read' in review) {
    if (
      !UX_SCORES.includes(review.pull_to_answer as 0 | 1 | 2) ||
      !UX_SCORES.includes(review.felt_read as 0 | 1 | 2)
    ) {
      throw new Error(
        `${review.blind_id} has incomplete Pull to Answer or Felt Read scores.`
      );
    }
  }
  if ('holds_the_charge' in review) {
    if (!UX_SCORES.includes(review.holds_the_charge as 0 | 1 | 2)) {
      throw new Error(`${review.blind_id} has an incomplete Holds the Charge score.`);
    }
  }
  if (review.ordinary_material_class) {
    if (
      !ORDINARY_MATERIAL_CLASSES.includes(
        review.ordinary_material_class as (typeof ORDINARY_MATERIAL_CLASSES)[number]
      )
    ) {
      throw new Error(
        `${review.blind_id} has an unknown ordinary material class.`
      );
    }
  }
  if (
    'multi_anchor_supported' in review &&
    review.multi_anchor_supported !== null &&
    typeof review.multi_anchor_supported !== 'boolean'
  ) {
    throw new Error(
      `${review.blind_id} has an incomplete multi-anchor supported flag.`
    );
  }
  if ('selection_rubric_leakage' in review) {
    if (typeof review.selection_rubric_leakage !== 'boolean') {
      throw new Error(
        `${review.blind_id} has an incomplete selection-rubric leakage flag.`
      );
    }
  }
  if ('selection_rubric_leakage_subclass' in review) {
    const subclass = review.selection_rubric_leakage_subclass;
    if (review.selection_rubric_leakage === true) {
      if (
        !LEAKAGE_YES_SUBCLASSES.includes(
          subclass as (typeof LEAKAGE_YES_SUBCLASSES)[number]
        )
      ) {
        throw new Error(
          `${review.blind_id} needs a leakage subclass of importance_leak, opening_leak, or selector_paraphrase.`
        );
      }
    } else if (
      subclass !== null &&
      subclass !== undefined &&
      !LEAKAGE_NO_SUBCLASSES.includes(
        subclass as (typeof LEAKAGE_NO_SUBCLASSES)[number]
      )
    ) {
      throw new Error(
        `${review.blind_id} may only use legitimate_dream_language when leakage is NO.`
      );
    }
  }
}

function segmentSummary(reviews: Review[]) {
  const verdictCounts = Object.fromEntries(
    VERDICTS.map((verdict) => [
      verdict,
      reviews.filter((review) => review.verdict === verdict).length,
    ])
  ) as Record<Verdict, number>;
  return {
    trials: reviews.length,
    verdict_counts: verdictCounts,
    pass_rate: percentage(verdictCounts.PASS, reviews.length),
    soft_fail_rate: percentage(verdictCounts.SOFT_FAIL, reviews.length),
    fail_rate: percentage(verdictCounts.FAIL, reviews.length),
    hard_epistemic_failures: reviews.filter((review) =>
      HARD_FLAGS.some((flag) => review.hard_flags[flag])
    ).length,
    unnatural_language_failures: reviews.filter(
      (review) => review.editorial_flags.UNNATURAL_LANGUAGE
    ).length,
    would_want_to_answer_rate: percentage(
      reviews.filter((review) => review.would_i_want_to_answer).length,
      reviews.length
    ),
  };
}

function comparisonSnapshot(summary: ComparisonSummary) {
  const total = Object.values(summary.manual.verdict_counts).reduce(
    (sum, count) => sum + count,
    0
  );
  const ordinary =
    summary.manual.by_category.ordinary_banal_low_affect ?? null;
  return {
    method_id: summary.active_method_id,
    method_version: summary.active_method_version,
    trials: total,
    strong_pass_rate: summary.manual.pass_rate,
    soft_fail_rate: summary.manual.soft_fail_rate,
    fail_rate: summary.manual.fail_rate,
    hard_epistemic_outputs: summary.manual.hard_epistemic_failures,
    hard_epistemic_rate: percentage(
      summary.manual.hard_epistemic_failures,
      total
    ),
    significance_or_banal_inflation_rate:
      summary.manual.significance_or_banal_inflation_rate,
    natural_clean_rate: summary.manual.natural_clean_rate,
    ordinary_pass_rate: ordinary?.pass_rate ?? 0,
    ordinary_hard_epistemic_failures:
      ordinary?.hard_epistemic_failures ?? 0,
    dominant_first_3_word_opening:
      summary.machine_contract.template_telemetry.dominant_first_3_words,
    relation_coexistence_framing_rate: percentage(
      summary.manual.manual_template_analysis
        .relation_coexistence_framing_count,
      total
    ),
    two_anchor_construction_rate: percentage(
      summary.manual.manual_template_analysis.anchor_constructions.two ?? 0,
      total
    ),
    hard_flag_counts: summary.manual.hard_flag_counts,
    editorial_flag_counts: summary.manual.editorial_flag_counts,
    by_category: summary.manual.by_category,
    by_length_band: summary.manual.by_length_band,
  };
}

function numericDelta(candidate: number, baseline: number): number {
  return Number((candidate - baseline).toFixed(2));
}

function writeThreeWayComparison(params: {
  outputDirectory: string;
  aPath: string;
  bPath: string;
  cPath: string;
}) {
  const a = comparisonSnapshot(readJson<ComparisonSummary>(params.aPath));
  const b = comparisonSnapshot(readJson<ComparisonSummary>(params.bPath));
  const c = comparisonSnapshot(readJson<ComparisonSummary>(params.cPath));
  const metrics = [
    ['Strong PASS', 'strong_pass_rate'],
    ['SOFT FAIL', 'soft_fail_rate'],
    ['FAIL', 'fail_rate'],
    ['Hard epistemic outputs', 'hard_epistemic_rate'],
    ['Significance/banal inflation', 'significance_or_banal_inflation_rate'],
    ['Natural/clean wording', 'natural_clean_rate'],
    ['Ordinary/low-affect PASS', 'ordinary_pass_rate'],
    ['Relation/coexistence framing', 'relation_coexistence_framing_rate'],
    ['Two-anchor construction', 'two_anchor_construction_rate'],
  ] as const;
  const comparison = {
    a,
    b,
    c,
    note: 'Arithmetic comparison only; no verdicts are assigned or revised here.',
  };
  mkdirSync(params.outputDirectory, { recursive: true });
  writeFileSync(
    path.join(params.outputDirectory, 'THREE_WAY_COMPARISON.json'),
    `${JSON.stringify(comparison, null, 2)}\n`
  );
  writeFileSync(
    path.join(params.outputDirectory, 'THREE_WAY_COMPARISON.md'),
    [
      '# Reflective-question minimalism 3-way comparison',
      '',
      `- A: ${a.method_id}`,
      `- B: ${b.method_id}`,
      `- C frozen v1.3: ${c.method_id}`,
      '- Arithmetic only; manual verdicts are not assigned or revised here.',
      '',
      '| Metric | A | B | C v1.3 |',
      '|---|---:|---:|---:|',
      ...metrics.map(
        ([label, key]) =>
          `| ${label} | ${a[key]}% | ${b[key]}% | ${c[key]}% |`
      ),
      '',
      '## Dominant first-3-word openings',
      '',
      `- A: ${a.dominant_first_3_word_opening?.value ?? 'none'} (${a.dominant_first_3_word_opening?.percentage ?? 0}%)`,
      `- B: ${b.dominant_first_3_word_opening?.value ?? 'none'} (${b.dominant_first_3_word_opening?.percentage ?? 0}%)`,
      `- C: ${c.dominant_first_3_word_opening?.value ?? 'none'} (${c.dominant_first_3_word_opening?.percentage ?? 0}%)`,
      '',
    ].join('\n')
  );
}

function writeBaselineComparison(params: {
  outputDirectory: string;
  baselinePath: string;
  candidate: ComparisonSummary;
}) {
  const baseline = readJson<ComparisonSummary>(params.baselinePath);
  const baselineSnapshot = comparisonSnapshot(baseline);
  const candidateSnapshot = comparisonSnapshot(params.candidate);
  const delta = {
    strong_pass_rate: numericDelta(
      candidateSnapshot.strong_pass_rate,
      baselineSnapshot.strong_pass_rate
    ),
    soft_fail_rate: numericDelta(
      candidateSnapshot.soft_fail_rate,
      baselineSnapshot.soft_fail_rate
    ),
    fail_rate: numericDelta(
      candidateSnapshot.fail_rate,
      baselineSnapshot.fail_rate
    ),
    hard_epistemic_rate: numericDelta(
      candidateSnapshot.hard_epistemic_rate,
      baselineSnapshot.hard_epistemic_rate
    ),
    significance_or_banal_inflation_rate: numericDelta(
      candidateSnapshot.significance_or_banal_inflation_rate,
      baselineSnapshot.significance_or_banal_inflation_rate
    ),
    natural_clean_rate: numericDelta(
      candidateSnapshot.natural_clean_rate,
      baselineSnapshot.natural_clean_rate
    ),
    ordinary_pass_rate: numericDelta(
      candidateSnapshot.ordinary_pass_rate,
      baselineSnapshot.ordinary_pass_rate
    ),
    relation_coexistence_framing_rate: numericDelta(
      candidateSnapshot.relation_coexistence_framing_rate,
      baselineSnapshot.relation_coexistence_framing_rate
    ),
    two_anchor_construction_rate: numericDelta(
      candidateSnapshot.two_anchor_construction_rate,
      baselineSnapshot.two_anchor_construction_rate
    ),
  };
  const comparison = {
    baseline_summary_path: params.baselinePath,
    baseline: baselineSnapshot,
    candidate: candidateSnapshot,
    candidate_minus_baseline: delta,
    note: 'Arithmetic comparison only; no verdicts are assigned or revised here.',
  };
  writeFileSync(
    path.join(params.outputDirectory, 'BASELINE_COMPARISON.json'),
    `${JSON.stringify(comparison, null, 2)}\n`
  );
  const rows = [
    ['Strong PASS', baselineSnapshot.strong_pass_rate, candidateSnapshot.strong_pass_rate, delta.strong_pass_rate],
    ['SOFT FAIL', baselineSnapshot.soft_fail_rate, candidateSnapshot.soft_fail_rate, delta.soft_fail_rate],
    ['FAIL', baselineSnapshot.fail_rate, candidateSnapshot.fail_rate, delta.fail_rate],
    ['Hard epistemic outputs', baselineSnapshot.hard_epistemic_rate, candidateSnapshot.hard_epistemic_rate, delta.hard_epistemic_rate],
    ['Significance/banal inflation', baselineSnapshot.significance_or_banal_inflation_rate, candidateSnapshot.significance_or_banal_inflation_rate, delta.significance_or_banal_inflation_rate],
    ['Natural/clean wording', baselineSnapshot.natural_clean_rate, candidateSnapshot.natural_clean_rate, delta.natural_clean_rate],
    ['Ordinary/low-affect PASS', baselineSnapshot.ordinary_pass_rate, candidateSnapshot.ordinary_pass_rate, delta.ordinary_pass_rate],
    ['Relation/coexistence framing', baselineSnapshot.relation_coexistence_framing_rate, candidateSnapshot.relation_coexistence_framing_rate, delta.relation_coexistence_framing_rate],
    ['Two-anchor construction', baselineSnapshot.two_anchor_construction_rate, candidateSnapshot.two_anchor_construction_rate, delta.two_anchor_construction_rate],
  ];
  writeFileSync(
    path.join(params.outputDirectory, 'BASELINE_COMPARISON.md'),
    [
      '# Reflective-question benchmark comparison',
      '',
      `- Baseline: ${baselineSnapshot.method_id}`,
      `- Candidate: ${candidateSnapshot.method_id}`,
      '- Arithmetic only; manual verdicts are not assigned or revised here.',
      '',
      '| Metric | Baseline | Candidate | Delta |',
      '|---|---:|---:|---:|',
      ...rows.map(
        ([label, baselineValue, candidateValue, deltaValue]) =>
          `| ${label} | ${baselineValue}% | ${candidateValue}% | ${Number(deltaValue) >= 0 ? '+' : ''}${deltaValue} pp |`
      ),
      '',
    ].join('\n')
  );
}

function uxHistogram(values: Array<0 | 1 | 2>) {
  return {
    '0': values.filter((value) => value === 0).length,
    '1': values.filter((value) => value === 1).length,
    '2': values.filter((value) => value === 2).length,
    average: average(values),
  };
}

function hasUxScores(
  reviews: Review[]
): reviews is Array<Review & { pull_to_answer: 0 | 1 | 2; felt_read: 0 | 1 | 2 }> {
  return reviews.some(
    (review) => 'pull_to_answer' in review || 'felt_read' in review
  );
}

function clusterScaffold(text: string): string {
  for (const [name, pattern] of SCAFFOLD_BASINS) {
    if (pattern.test(text)) return name;
  }
  return 'other';
}

function scaffoldSummary(trials: Trial[]) {
  const openings = trials
    .map((trial) => {
      const telemetry = trial.template_telemetry as
        | {
            exact_opening?: string;
            first_3_words?: string;
            first_5_words?: string;
            grammatical_operator?: string;
            question_word_count?: number;
            anchor_construction?: string;
          }
        | null;
      const haystack = [
        trial.question ?? '',
        telemetry?.exact_opening ?? '',
        telemetry?.first_3_words ?? '',
        telemetry?.first_5_words ?? '',
        telemetry?.grammatical_operator ?? '',
      ].join(' ');
      return {
        basin: clusterScaffold(haystack),
        first_3_words: telemetry?.first_3_words ?? null,
        grammatical_operator: telemetry?.grammatical_operator ?? null,
        question_word_count: telemetry?.question_word_count ?? null,
      };
    });
  return {
    note: 'Post-hoc clustering from existing telemetry; no mid-run phrase bans.',
    basin_counts: frequencies(openings.map((item) => item.basin)),
    first_3_word_counts: frequencies(
      openings
        .map((item) => item.first_3_words)
        .filter((value): value is string => Boolean(value))
    ),
    grammatical_operator_counts: frequencies(
      openings
        .map((item) => item.grammatical_operator)
        .filter((value): value is string => Boolean(value))
    ),
    average_question_word_count: average(
      openings
        .map((item) => item.question_word_count)
        .filter((value): value is number => typeof value === 'number')
    ),
    extra_operator_basin_counts: extraOperatorBasinCounts(trials),
  };
}

function extraOperatorBasinCounts(trials: Trial[]) {
  const counts: Record<string, number> = Object.fromEntries(
    EXTRA_OPERATOR_BASINS.map(([name]) => [name, 0])
  );
  for (const trial of trials) {
    const haystack = [
      trial.question ?? '',
      trial.raw_question ?? '',
    ].join(' ');
    for (const [name, pattern] of EXTRA_OPERATOR_BASINS) {
      if (pattern.test(haystack)) counts[name] += 1;
    }
  }
  return counts;
}

function pairwiseFilenames(kind: PairwisePacketKind) {
  const prefix =
    kind === 'vs-ablation'
      ? 'PAIRWISE_VS_ABLATION'
      : kind === 'vs-v13'
        ? 'PAIRWISE_VS_V13'
        : kind === 'vs-decoupling'
          ? 'PAIRWISE_VS_DECOUPLING'
          : 'PAIRWISE';
  return {
    sheet: `${prefix}_REVIEW_SHEET.json`,
    manifest: `${prefix}_MANIFEST.json`,
    summaryJson: `${prefix}_SUMMARY.json`,
    summaryMd: `${prefix}_SUMMARY.md`,
  };
}

function resolvePairwiseMethodIds(
  outputDirectory: string,
  manifest: PairwiseManifestItem[]
): { candidateMethodId: string; baselineMethodId: string } {
  const methodIds = [
    ...new Set(
      manifest.flatMap((item) => [item.left_method_id, item.right_method_id])
    ),
  ];
  if (methodIds.length !== 2) {
    throw new Error('Pairwise manifest must contain exactly two method ids.');
  }
  const resultsPath = path.join(outputDirectory, 'results.json');
  if (existsSync(resultsPath)) {
    const results = readJson<Results>(resultsPath);
    if (methodIds.includes(results.active_method_id)) {
      return {
        candidateMethodId: results.active_method_id,
        baselineMethodId: methodIds.find(
          (methodId) => methodId !== results.active_method_id
        ) as string,
      };
    }
  }
  const candidateMethodId = methodIds.find(
    (methodId) => methodId !== FROZEN_V13_METHOD_ID
  );
  if (!candidateMethodId) {
    throw new Error('Pairwise manifest is missing an isolated candidate method id.');
  }
  return {
    candidateMethodId,
    baselineMethodId: FROZEN_V13_METHOD_ID,
  };
}

function writePairwiseSummary(
  outputDirectory: string,
  kind: PairwisePacketKind = 'default'
) {
  const files = pairwiseFilenames(kind);
  const sheetPath = path.join(outputDirectory, files.sheet);
  const manifestPath = path.join(outputDirectory, files.manifest);
  if (!existsSync(sheetPath) || !existsSync(manifestPath)) {
    throw new Error(
      `Missing ${files.sheet} or ${files.manifest} in ${outputDirectory}.`
    );
  }
  const sheet = readJson<{ reviews: PairwiseReview[] }>(sheetPath);
  const manifest = readJson<PairwiseManifestItem[]>(manifestPath);
  const manifestById = new Map(manifest.map((item) => [item.pair_id, item]));
  if (sheet.reviews.length !== manifest.length) {
    throw new Error('Pairwise review and manifest counts must match.');
  }
  const candidatePull: Array<0 | 1 | 2> = [];
  const candidateFelt: Array<0 | 1 | 2> = [];
  const baselinePull: Array<0 | 1 | 2> = [];
  const baselineFelt: Array<0 | 1 | 2> = [];
  const candidateCharge: Array<0 | 1 | 2> = [];
  const baselineCharge: Array<0 | 1 | 2> = [];
  const candidateFirstRead: Array<0 | 1 | 2> = [];
  const baselineFirstRead: Array<0 | 1 | 2> = [];
  const candidateDreamNative: Array<0 | 1 | 2> = [];
  const baselineDreamNative: Array<0 | 1 | 2> = [];
  let candidateWins = 0;
  let baselineWins = 0;
  let ties = 0;
  let neither = 0;
  const reasonClusters: Record<string, number> = {};
  const { candidateMethodId, baselineMethodId } = resolvePairwiseMethodIds(
    outputDirectory,
    manifest
  );
  const isCandidateMethod = (methodId: string) => methodId === candidateMethodId;
  for (const review of sheet.reviews) {
    const item = manifestById.get(review.pair_id);
    if (!item) {
      throw new Error(`${review.pair_id} is absent from the pairwise manifest.`);
    }
    if (
      !review.preference ||
      !PAIRWISE_PREFERENCES.includes(review.preference) ||
      !review.reason.trim()
    ) {
      throw new Error(`${review.pair_id} has an incomplete pairwise preference.`);
    }
    const sides = [review.left, review.right] as const;
    const includeHoldsTheCharge =
      'holds_the_charge' in review.left || 'holds_the_charge' in review.right;
    const includeLanguageOperatorUx =
      'first_read_clarity' in review.left ||
      'first_read_clarity' in review.right;
    for (const side of sides) {
      if (
        !UX_SCORES.includes(side.pull_to_answer as 0 | 1 | 2) ||
        !UX_SCORES.includes(side.felt_read as 0 | 1 | 2) ||
        (includeHoldsTheCharge &&
          !UX_SCORES.includes(side.holds_the_charge as 0 | 1 | 2)) ||
        (includeLanguageOperatorUx &&
          (!UX_SCORES.includes(side.first_read_clarity as 0 | 1 | 2) ||
            !UX_SCORES.includes(side.dream_native_language as 0 | 1 | 2)))
      ) {
        throw new Error(`${review.pair_id} has incomplete pairwise UX scores.`);
      }
    }
    const preferredMethod =
      review.preference === 'left'
        ? item.left_method_id
        : review.preference === 'right'
          ? item.right_method_id
          : null;
    if (review.preference === 'tie') ties += 1;
    else if (review.preference === 'neither') neither += 1;
    else if (preferredMethod && isCandidateMethod(preferredMethod))
      candidateWins += 1;
    else baselineWins += 1;

    const pushSide = (
      methodId: string,
      pull: 0 | 1 | 2,
      felt: 0 | 1 | 2,
      charge: 0 | 1 | 2 | null,
      firstRead: 0 | 1 | 2 | null,
      dreamNative: 0 | 1 | 2 | null
    ) => {
      if (isCandidateMethod(methodId)) {
        candidatePull.push(pull);
        candidateFelt.push(felt);
        if (charge !== null) candidateCharge.push(charge);
        if (firstRead !== null) candidateFirstRead.push(firstRead);
        if (dreamNative !== null) candidateDreamNative.push(dreamNative);
      } else {
        baselinePull.push(pull);
        baselineFelt.push(felt);
        if (charge !== null) baselineCharge.push(charge);
        if (firstRead !== null) baselineFirstRead.push(firstRead);
        if (dreamNative !== null) baselineDreamNative.push(dreamNative);
      }
    };
    pushSide(
      item.left_method_id,
      review.left.pull_to_answer as 0 | 1 | 2,
      review.left.felt_read as 0 | 1 | 2,
      includeHoldsTheCharge ? (review.left.holds_the_charge as 0 | 1 | 2) : null,
      includeLanguageOperatorUx
        ? (review.left.first_read_clarity as 0 | 1 | 2)
        : null,
      includeLanguageOperatorUx
        ? (review.left.dream_native_language as 0 | 1 | 2)
        : null
    );
    pushSide(
      item.right_method_id,
      review.right.pull_to_answer as 0 | 1 | 2,
      review.right.felt_read as 0 | 1 | 2,
      includeHoldsTheCharge ? (review.right.holds_the_charge as 0 | 1 | 2) : null,
      includeLanguageOperatorUx
        ? (review.right.first_read_clarity as 0 | 1 | 2)
        : null,
      includeLanguageOperatorUx
        ? (review.right.dream_native_language as 0 | 1 | 2)
        : null
    );

    const reason = review.reason.toLowerCase();
    const cluster = /generic|template|scaffold|notice|stays with/.test(reason)
      ? 'generic_or_scaffold'
      : /alive|pull|want to answer|vital|precise/.test(reason)
        ? 'more_alive_or_precise'
        : /safer|invent|unsupported|inflation/.test(reason)
          ? 'safer_or_cleaner'
          : /neither|both weak|no pull/.test(reason)
            ? 'neither_attracts'
            : 'other';
    reasonClusters[cluster] = (reasonClusters[cluster] ?? 0) + 1;
  }
  const historicalV13 = baselineMethodId === FROZEN_V13_METHOD_ID;
  const baselineUx = {
    pull_to_answer: uxHistogram(baselinePull),
    felt_read: uxHistogram(baselineFelt),
    ...(baselineCharge.length
      ? { holds_the_charge: uxHistogram(baselineCharge) }
      : {}),
    ...(baselineFirstRead.length
      ? { first_read_clarity: uxHistogram(baselineFirstRead) }
      : {}),
    ...(baselineDreamNative.length
      ? { dream_native_language: uxHistogram(baselineDreamNative) }
      : {}),
  };
  const summary = {
    pairs: sheet.reviews.length,
    comparison:
      kind === 'vs-ablation'
        ? 'vs_ablation'
        : kind === 'vs-v13'
          ? 'vs_v13'
          : kind === 'vs-decoupling'
            ? 'vs_decoupling'
            : 'vs_v13_default',
    candidate_method_id: candidateMethodId,
    baseline_method_id: baselineMethodId,
    candidate_wins: candidateWins,
    ...(historicalV13
      ? { v1_3_wins: baselineWins }
      : {
          baseline_wins: baselineWins,
          ...(kind === 'vs-ablation' ? { ablation_wins: baselineWins } : {}),
          ...(kind === 'vs-decoupling'
            ? { decoupling_wins: baselineWins }
            : {}),
        }),
    ties,
    neither,
    reason_clusters: reasonClusters,
    ux_from_pairwise: {
      candidate: {
        pull_to_answer: uxHistogram(candidatePull),
        felt_read: uxHistogram(candidateFelt),
        ...(candidateCharge.length
          ? { holds_the_charge: uxHistogram(candidateCharge) }
          : {}),
        ...(candidateFirstRead.length
          ? { first_read_clarity: uxHistogram(candidateFirstRead) }
          : {}),
        ...(candidateDreamNative.length
          ? { dream_native_language: uxHistogram(candidateDreamNative) }
          : {}),
      },
      ...(historicalV13 ? { v1_3: baselineUx } : { baseline: baselineUx }),
    },
    note: 'Pairwise UX is the comparable matched-run vs candidate measure; frozen C quality sheets only have boolean would_i_want_to_answer. Pairwise preference does not override Strong PASS.',
  };
  writeFileSync(
    path.join(outputDirectory, files.summaryJson),
    `${JSON.stringify(summary, null, 2)}\n`
  );
  const baselineLabel = historicalV13
    ? 'v1.3'
    : kind === 'vs-ablation'
      ? 'ablation'
      : kind === 'vs-decoupling'
        ? 'decoupling'
        : 'baseline';
  writeFileSync(
    path.join(outputDirectory, files.summaryMd),
    [
      '# Pairwise product preference',
      '',
      `- Comparison: ${summary.comparison}`,
      `- Pairs: ${summary.pairs}`,
      `- Candidate wins: ${candidateWins}`,
      `- ${baselineLabel} wins: ${baselineWins}`,
      `- Ties: ${ties}`,
      `- Neither: ${neither}`,
      `- Candidate Pull average: ${summary.ux_from_pairwise.candidate.pull_to_answer.average}`,
      `- ${baselineLabel} Pull average: ${baselineUx.pull_to_answer.average}`,
      `- Candidate Felt Read average: ${summary.ux_from_pairwise.candidate.felt_read.average}`,
      `- ${baselineLabel} Felt Read average: ${baselineUx.felt_read.average}`,
      ...(candidateCharge.length
        ? [
            `- Candidate Holds the Charge average: ${summary.ux_from_pairwise.candidate.holds_the_charge?.average}`,
            `- ${baselineLabel} Holds the Charge average: ${baselineUx.holds_the_charge?.average}`,
          ]
        : []),
      ...(candidateFirstRead.length
        ? [
            `- Candidate First-read clarity average: ${summary.ux_from_pairwise.candidate.first_read_clarity?.average}`,
            `- ${baselineLabel} First-read clarity average: ${baselineUx.first_read_clarity?.average}`,
            `- Candidate Dream-native language average: ${summary.ux_from_pairwise.candidate.dream_native_language?.average}`,
            `- ${baselineLabel} Dream-native language average: ${baselineUx.dream_native_language?.average}`,
          ]
        : []),
      '',
      '```json',
      JSON.stringify(reasonClusters, null, 2),
      '```',
      '',
    ].join('\n')
  );
  return summary;
}

function maybeWriteCompletedPairwiseSummaries(outputDirectory: string) {
  const kinds: PairwisePacketKind[] = [
    'default',
    'vs-ablation',
    'vs-v13',
    'vs-decoupling',
  ];
  const written: string[] = [];
  for (const kind of kinds) {
    const files = pairwiseFilenames(kind);
    const sheetPath = path.join(outputDirectory, files.sheet);
    const manifestPath = path.join(outputDirectory, files.manifest);
    if (!existsSync(sheetPath) || !existsSync(manifestPath)) continue;
    const pairwiseSheet = readJson<{ reviews: PairwiseReview[] }>(sheetPath);
    if (
      pairwiseSheet.reviews.every(
        (review) =>
          review.preference &&
          PAIRWISE_PREFERENCES.includes(review.preference) &&
          review.reason.trim()
      )
    ) {
      writePairwiseSummary(outputDirectory, kind);
      written.push(path.join(outputDirectory, files.summaryMd));
    }
  }
  return written;
}

function writeScaffoldClusters(outputDirectory: string, results: Results) {
  const candidate = scaffoldSummary(results.trials);
  const frozenPath = path.resolve(process.cwd(), FROZEN_V13_LIVE_RESULTS);
  const payload = {
    candidate_method_id: results.active_method_id,
    candidate,
    v1_3:
      existsSync(frozenPath) && results.trials.length === 100
        ? scaffoldSummary(readJson<Results>(frozenPath).trials)
        : null,
  };
  writeFileSync(
    path.join(outputDirectory, 'SCAFFOLD_CLUSTERS.json'),
    `${JSON.stringify(payload, null, 2)}\n`
  );
}

function main() {
  if (process.argv[2] === '--pairwise') {
    const rawPairwiseDirectory = process.argv[3];
    if (!rawPairwiseDirectory) {
      throw new Error(
        'Usage: summarize -- --pairwise <candidate-output-dir> [vs-ablation|vs-v13|vs-decoupling]'
      );
    }
    const pairwiseDirectory = path.resolve(
      process.cwd(),
      rawPairwiseDirectory
    );
    const kindRaw = process.argv[4];
    if (kindRaw === 'vs-ablation' || kindRaw === 'vs-v13' || kindRaw === 'vs-decoupling') {
      writePairwiseSummary(pairwiseDirectory, kindRaw);
      const files = pairwiseFilenames(kindRaw);
      process.stdout.write(
        `${path.join(pairwiseDirectory, files.summaryMd)}\n`
      );
      return;
    }
    const written = maybeWriteCompletedPairwiseSummaries(pairwiseDirectory);
    if (written.length === 0) {
      writePairwiseSummary(pairwiseDirectory);
      process.stdout.write(
        `${path.join(pairwiseDirectory, 'PAIRWISE_SUMMARY.md')}\n`
      );
      return;
    }
    process.stdout.write(`${written.join('\n')}\n`);
    return;
  }
  if (process.argv[2] === '--three-way') {
    const [, , , aPath, bPath, cPath, outputDirectory] = process.argv;
    if (!aPath || !bPath || !cPath || !outputDirectory) {
      throw new Error(
        'Usage: summarize -- --three-way <A-summary.json> <B-summary.json> <C-summary.json> <output-dir>'
      );
    }
    writeThreeWayComparison({
      outputDirectory: path.resolve(process.cwd(), outputDirectory),
      aPath: path.resolve(process.cwd(), aPath),
      bPath: path.resolve(process.cwd(), bPath),
      cPath: path.resolve(process.cwd(), cPath),
    });
    process.stdout.write(
      `${path.resolve(process.cwd(), outputDirectory, 'THREE_WAY_COMPARISON.md')}\n`
    );
    return;
  }
  const rawDirectory = process.argv[2];
  const rawBaselineSummary = process.argv[3];
  if (!rawDirectory) {
    throw new Error(
      'Usage: npm run summarize:reflective-questions-live-benchmark -- <benchmark-output-dir> [baseline-summary.json]'
    );
  }
  const outputDirectory = path.resolve(process.cwd(), rawDirectory);
  const baselineSummaryPath = rawBaselineSummary
    ? path.resolve(process.cwd(), rawBaselineSummary)
    : null;
  if (baselineSummaryPath && !existsSync(baselineSummaryPath)) {
    throw new Error(`Missing baseline summary ${baselineSummaryPath}.`);
  }
  const requiredFiles = [
    'results.json',
    'BLIND_REVIEW_SHEET.json',
    'BLIND_MANIFEST.json',
  ];
  for (const fileName of requiredFiles) {
    if (!existsSync(path.join(outputDirectory, fileName))) {
      throw new Error(`Missing ${fileName} in ${outputDirectory}.`);
    }
  }

  const results = readJson<Results>(path.join(outputDirectory, 'results.json'));
  const sheet = readJson<{ reviews: Review[] }>(
    path.join(outputDirectory, 'BLIND_REVIEW_SHEET.json')
  );
  const manifest = readJson<ManifestItem[]>(
    path.join(outputDirectory, 'BLIND_MANIFEST.json')
  );
  const manifestById = new Map(manifest.map((item) => [item.blind_id, item]));
  const trialByKey = new Map(
    results.trials.map((trial) => [
      `${trial.case_id}:${trial.repeat}`,
      trial,
    ])
  );

  if (
    sheet.reviews.length !== results.metrics.trials ||
    manifest.length !== results.metrics.trials
  ) {
    throw new Error('Review, manifest, and trial counts must match.');
  }
  for (const review of sheet.reviews) validateReview(review, manifestById);

  const hardFlagCounts = Object.fromEntries(
    HARD_FLAGS.map((flag) => [
      flag,
      sheet.reviews.filter((review) => review.hard_flags[flag]).length,
    ])
  ) as Record<HardFlag, number>;
  const editorialFlagCounts = Object.fromEntries(
    EDITORIAL_FLAGS.map((flag) => [
      flag,
      sheet.reviews.filter((review) => review.editorial_flags[flag]).length,
    ])
  ) as Record<EditorialFlag, number>;
  const experimentFailureModeCounts = sheet.reviews.reduce<
    Record<string, number>
  >((counts, review) => {
    for (const [flag, value] of Object.entries(
      review.experiment_failure_modes ?? {}
    )) {
      if (value) counts[flag] = (counts[flag] ?? 0) + 1;
    }
    return counts;
  }, {});
  const hardEpistemicFailures = sheet.reviews.filter((review) =>
    HARD_FLAGS.some((flag) => review.hard_flags[flag])
  ).length;
  const naturalClean = sheet.reviews.filter(
    (review) =>
      (review.scores.natural_language ?? 0) >= 4 &&
      !review.editorial_flags.UNNATURAL_LANGUAGE
  ).length;
  const inflationFailures = sheet.reviews.filter(
    (review) =>
      review.editorial_flags.BANAL_INFLATION ||
      review.editorial_flags.SIGNIFICANCE_INFLATION
  ).length;

  const joinedReviews = sheet.reviews.map((review) => {
    const manifestItem = manifestById.get(review.blind_id);
    if (!manifestItem) throw new Error(`Missing manifest ${review.blind_id}.`);
    const trial = trialByKey.get(
      `${manifestItem.case_id}:${manifestItem.repeat}`
    );
    if (!trial) throw new Error(`Missing raw trial ${review.blind_id}.`);
    return {
      blind_id: review.blind_id,
      dream_id: manifestItem.case_id,
      repeat: manifestItem.repeat,
      categories: manifestItem.categories,
      length_band: manifestItem.length_band,
      narrative_features: manifestItem.narrative_features,
      dream_word_count: manifestItem.dream_word_count,
      title: trial.title,
      dream: trial.dream,
      raw_question: trial.raw_question,
      parsed_question: trial.question,
      technical_error: trial.technical_error ?? trial.parse_error,
      verdict: review.verdict,
      scores: review.scores,
      would_i_want_to_answer: review.would_i_want_to_answer,
      ...(typeof review.pull_to_answer === 'number'
        ? {
            pull_to_answer: review.pull_to_answer,
            felt_read: review.felt_read,
          }
        : {}),
      ...(typeof review.holds_the_charge === 'number'
        ? { holds_the_charge: review.holds_the_charge }
        : {}),
      ...(review.ordinary_material_class
        ? { ordinary_material_class: review.ordinary_material_class }
        : {}),
      ...(typeof review.multi_anchor_supported === 'boolean'
        ? { multi_anchor_supported: review.multi_anchor_supported }
        : {}),
      ...(typeof review.selection_rubric_leakage === 'boolean'
        ? { selection_rubric_leakage: review.selection_rubric_leakage }
        : {}),
      ...(review.selection_rubric_leakage_subclass
        ? {
            selection_rubric_leakage_subclass:
              review.selection_rubric_leakage_subclass,
          }
        : {}),
      hard_flags: review.hard_flags,
      editorial_flags: review.editorial_flags,
      template_telemetry: trial.template_telemetry,
      manual_template_analysis: review.template_analysis,
      rationale: review.rationale,
    };
  });

  const reviewsFor = (predicate: (item: ManifestItem) => boolean) =>
    sheet.reviews.filter((review) => {
      const item = manifestById.get(review.blind_id);
      return item ? predicate(item) : false;
    });
  const categories = [
    ...new Set(manifest.flatMap((item) => item.categories)),
  ].sort();
  const narrativeFeatures = [
    ...new Set(manifest.flatMap((item) => item.narrative_features)),
  ].sort();
  const byCategory = Object.fromEntries(
    categories.map((category) => [
      category,
      segmentSummary(
        reviewsFor((item) => item.categories.includes(category))
      ),
    ])
  );
  const byLengthBand = Object.fromEntries(
    (['short', 'medium', 'long'] as const).map((lengthBand) => [
      lengthBand,
      segmentSummary(reviewsFor((item) => item.length_band === lengthBand)),
    ])
  );
  const byNarrativeFeature = Object.fromEntries(
    narrativeFeatures.map((feature) => [
      feature,
      segmentSummary(
        reviewsFor((item) => item.narrative_features.includes(feature))
      ),
    ])
  );
  const scoreAverages = Object.fromEntries(
    SCORE_KEYS.map((key) => [
      key,
      average(
        sheet.reviews.map((review) => review.scores[key] as number)
      ),
    ])
  );
  const scoreHistograms = Object.fromEntries(
    SCORE_KEYS.map((key) => [
      key,
      frequencies(
        sheet.reviews.map((review) => String(review.scores[key] as number))
      ),
    ])
  );
  const verdictCounts = segmentSummary(sheet.reviews);
  const manualTemplateAnalysis = {
    question_architectures: frequencies(
      sheet.reviews.map(
        (review) => review.template_analysis.question_architecture as string
      )
    ),
    anchor_constructions: frequencies(
      sheet.reviews.map(
        (review) => review.template_analysis.anchor_construction as string
      )
    ),
    grammatical_operators: frequencies(
      sheet.reviews.map(
        (review) => review.template_analysis.grammatical_operator as string
      )
    ),
    relation_coexistence_framing_count: sheet.reviews.filter(
      (review) => review.template_analysis.relation_coexistence_framing
    ).length,
    what_changes_framing_count: sheet.reviews.filter(
      (review) => review.template_analysis.what_changes_framing
    ).length,
    generic_experiential_framing_count: sheet.reviews.filter(
      (review) => review.template_analysis.generic_experiential_framing
    ).length,
    repeated_abstract_operators: frequencies(
      sheet.reviews.flatMap(
        (review) => review.template_analysis.repeated_abstract_operators
      )
    ),
  };
  const dreamIds = [...new Set(joinedReviews.map((review) => review.dream_id))];
  const repeatStability = dreamIds.map((dreamId) => {
    const repetitions = joinedReviews
      .filter((review) => review.dream_id === dreamId)
      .sort((left, right) => left.repeat - right.repeat);
    return {
      dream_id: dreamId,
      verdicts: repetitions.map((review) => review.verdict),
      both_pass: repetitions.every((review) => review.verdict === 'PASS'),
      any_hard_epistemic_failure: repetitions.some((review) =>
        HARD_FLAGS.some((flag) => review.hard_flags[flag])
      ),
      same_verdict:
        new Set(repetitions.map((review) => review.verdict)).size === 1,
    };
  });

  const uxStats = hasUxScores(sheet.reviews)
    ? {
        pull_to_answer: uxHistogram(
          sheet.reviews.map((review) => review.pull_to_answer as 0 | 1 | 2)
        ),
        felt_read: uxHistogram(
          sheet.reviews.map((review) => review.felt_read as 0 | 1 | 2)
        ),
      }
    : null;
  const holdsTheChargeStats = sheet.reviews.some(
    (review) => typeof review.holds_the_charge === 'number'
  )
    ? uxHistogram(
        sheet.reviews.map((review) => review.holds_the_charge as 0 | 1 | 2)
      )
    : null;
  const ordinaryReviews = sheet.reviews.filter((review) => {
    const item = manifestById.get(review.blind_id);
    return item?.categories.includes('ordinary_banal_low_affect');
  });
  if (
    sheet.reviews.some((review) => 'ordinary_material_class' in review) &&
    ordinaryReviews.some((review) => !review.ordinary_material_class)
  ) {
    throw new Error(
      'Ordinary items require a post-hoc ordinary_material_class when that field is in the sheet.'
    );
  }
  const ordinaryClassCounts = frequencies(
    ordinaryReviews
      .map((review) => review.ordinary_material_class)
      .filter((value): value is string => Boolean(value))
  );
  const twoPlusAnchorReviews = sheet.reviews.filter((review) => {
    const anchors = review.template_analysis.anchor_construction;
    return anchors === 'two' || anchors === 'multiple';
  });
  if (
    sheet.reviews.some((review) => 'multi_anchor_supported' in review) &&
    twoPlusAnchorReviews.some(
      (review) => typeof review.multi_anchor_supported !== 'boolean'
    )
  ) {
    throw new Error(
      'Two-plus-anchor items require multi_anchor_supported when that field is in the sheet.'
    );
  }
  const supportedMultiAnchorCount = twoPlusAnchorReviews.filter(
    (review) => review.multi_anchor_supported === true
  ).length;
  const hasOrdinaryClass = sheet.reviews.some(
    (review) => 'ordinary_material_class' in review
  );
  const hasMultiAnchorSupported = sheet.reviews.some(
    (review) => 'multi_anchor_supported' in review
  );
  const surgicalSupplements =
    holdsTheChargeStats || hasOrdinaryClass || hasMultiAnchorSupported
      ? {
          ...(holdsTheChargeStats
            ? { holds_the_charge: holdsTheChargeStats }
            : {}),
          ...(hasOrdinaryClass
            ? { ordinary_material_class_counts: ordinaryClassCounts }
            : {}),
          ...(hasMultiAnchorSupported
            ? {
                two_plus_anchor_items: twoPlusAnchorReviews.length,
                supported_multi_anchor_count: supportedMultiAnchorCount,
                supported_multi_anchor_rate: percentage(
                  supportedMultiAnchorCount,
                  twoPlusAnchorReviews.length
                ),
              }
            : {}),
        }
      : null;
  const leakageReviews = sheet.reviews.filter(
    (review) => typeof review.selection_rubric_leakage === 'boolean'
  );
  const selectionRubricLeakageCount = leakageReviews.filter(
    (review) => review.selection_rubric_leakage === true
  ).length;
  const leakageSubclassCounts = Object.fromEntries(
    [...LEAKAGE_YES_SUBCLASSES, ...LEAKAGE_NO_SUBCLASSES].map((subclass) => [
      subclass,
      leakageReviews.filter(
        (review) => review.selection_rubric_leakage_subclass === subclass
      ).length,
    ])
  );
  const hasLeakageSubclass = leakageReviews.some(
    (review) => 'selection_rubric_leakage_subclass' in review
  );
  const selectionRubricLeakage =
    leakageReviews.length > 0
      ? {
          selection_rubric_leakage_count: selectionRubricLeakageCount,
          selection_rubric_leakage_rate: percentage(
            selectionRubricLeakageCount,
            leakageReviews.length
          ),
          ...(hasLeakageSubclass
            ? { selection_rubric_leakage_subclass_counts: leakageSubclassCounts }
            : {}),
        }
      : null;

  const summary = {
    active_method_id: results.active_method_id,
    active_method_version: results.active_method_version,
    reviewed_trials: sheet.reviews.length,
    machine_contract: results.metrics,
    manual: {
      ...verdictCounts,
      score_averages: scoreAverages,
      score_histograms: scoreHistograms,
      hard_epistemic_failures: hardEpistemicFailures,
      hard_flag_counts: hardFlagCounts,
      editorial_flag_counts: editorialFlagCounts,
      experiment_failure_mode_counts: experimentFailureModeCounts,
      significance_or_banal_inflation_count: inflationFailures,
      significance_or_banal_inflation_rate: percentage(
        inflationFailures,
        sheet.reviews.length
      ),
      natural_clean_count: naturalClean,
      natural_clean_rate: percentage(naturalClean, sheet.reviews.length),
      would_want_to_answer_rate: percentage(
        sheet.reviews.filter((review) => review.would_i_want_to_answer).length,
        sheet.reviews.length
      ),
      ...(uxStats ?? {}),
      ...(surgicalSupplements ?? {}),
      ...(selectionRubricLeakage ?? {}),
      manual_template_analysis: manualTemplateAnalysis,
      repeat_stability: {
        dreams: repeatStability.length,
        both_pass_count: repeatStability.filter((item) => item.both_pass)
          .length,
        same_verdict_count: repeatStability.filter((item) => item.same_verdict)
          .length,
        any_hard_epistemic_failure_count: repeatStability.filter(
          (item) => item.any_hard_epistemic_failure
        ).length,
        per_dream: repeatStability,
      },
      by_category: byCategory,
      by_length_band: byLengthBand,
      by_narrative_feature: byNarrativeFeature,
    },
    acceptance_gate: {
      exactly_one_question_100_percent:
        results.metrics.valid_single_questions === results.metrics.trials &&
        results.metrics.invalid_outputs === 0,
      zero_prompt_contract_failures:
        results.metrics.prompt_contract_failures === 0,
      external_technical_failures_recorded:
        results.metrics.technical_failures,
      zero_invented_affect_or_motive:
        hardFlagCounts.INVENTED_AFFECT_OR_MOTIVE === 0,
      zero_invented_relations: hardFlagCounts.INVENTED_RELATION === 0,
      zero_pathology_hidden_conflict_inventions:
        hardFlagCounts.INVENTED_CONFLICT_OR_PATHOLOGY === 0,
      zero_embedded_interpretations:
        hardFlagCounts.EMBEDDED_INTERPRETATION === 0,
      zero_waking_life_inferences:
        hardFlagCounts.WAKING_LIFE_INFERENCE === 0,
      zero_factual_dream_inventions:
        hardFlagCounts.FACTUAL_DREAM_INVENTION === 0,
      significance_or_banal_inflation_at_most_3_percent:
        percentage(inflationFailures, sheet.reviews.length) <= 3,
      natural_clean_wording_at_least_95_percent:
        percentage(naturalClean, sheet.reviews.length) >= 95,
      strong_pass_at_least_90_percent:
        verdictCounts.pass_rate >= 90,
      no_exact_or_first_3_word_opening_above_15_percent:
        (results.metrics.template_telemetry.dominant_exact_opening
          ?.percentage ?? 0) <= 15 &&
        (results.metrics.template_telemetry.dominant_first_3_words
          ?.percentage ?? 0) <= 15,
      semantic_template_diversity_requires_manual_decision:
        manualTemplateAnalysis,
      coherent_category_length_and_messy_quality_requires_manual_decision: {
        by_category: byCategory,
        by_length_band: byLengthBand,
        by_narrative_feature: byNarrativeFeature,
      },
    },
  };

  writeFileSync(
    path.join(outputDirectory, 'MANUAL_REVIEW_RESULTS.json'),
    JSON.stringify(joinedReviews, null, 2)
  );
  writeFileSync(
    path.join(outputDirectory, 'MANUAL_REVIEW_SUMMARY.json'),
    JSON.stringify(summary, null, 2)
  );
  writeFileSync(
    path.join(outputDirectory, 'MANUAL_REVIEW_SUMMARY.md'),
    [
      `# Oneiros Reflective Questions ${results.active_method_version} — Manual Benchmark Summary`,
      '',
      `- Reviewed: ${summary.reviewed_trials}`,
      `- PASS: ${verdictCounts.verdict_counts.PASS}/${summary.reviewed_trials} (${verdictCounts.pass_rate}%)`,
      `- SOFT FAIL: ${verdictCounts.verdict_counts.SOFT_FAIL}/${summary.reviewed_trials} (${verdictCounts.soft_fail_rate}%)`,
      `- FAIL: ${verdictCounts.verdict_counts.FAIL}/${summary.reviewed_trials} (${verdictCounts.fail_rate}%)`,
      `- Hard epistemic failures: ${hardEpistemicFailures}`,
      `- Natural/clean wording: ${naturalClean}/${summary.reviewed_trials} (${summary.manual.natural_clean_rate}%)`,
      `- Significance/banal inflation: ${inflationFailures}/${summary.reviewed_trials} (${summary.manual.significance_or_banal_inflation_rate}%)`,
      `- Dominant first-3-word opening: ${summary.machine_contract.template_telemetry.dominant_first_3_words?.value ?? 'none'} (${summary.machine_contract.template_telemetry.dominant_first_3_words?.percentage ?? 0}%)`,
      ...(uxStats
        ? [
            `- Pull to Answer average: ${uxStats.pull_to_answer.average}`,
            `- Felt Read average: ${uxStats.felt_read.average}`,
          ]
        : []),
      ...(holdsTheChargeStats
        ? [`- Holds the Charge average: ${holdsTheChargeStats.average}`]
        : []),
      ...(hasMultiAnchorSupported
        ? [
            `- Supported multi-anchor: ${supportedMultiAnchorCount}/${twoPlusAnchorReviews.length} (${percentage(supportedMultiAnchorCount, twoPlusAnchorReviews.length)}%)`,
          ]
        : []),
      ...(selectionRubricLeakage
        ? [
            `- Selection-rubric leakage: ${selectionRubricLeakage.selection_rubric_leakage_count}/${leakageReviews.length} (${selectionRubricLeakage.selection_rubric_leakage_rate}%)`,
            ...(hasLeakageSubclass
              ? [
                  `- Leakage subclass counts: ${JSON.stringify(leakageSubclassCounts)}`,
                ]
              : []),
          ]
        : []),
      '',
      '## Hard flags',
      '',
      '```json',
      JSON.stringify(hardFlagCounts, null, 2),
      '```',
      '',
      '## Editorial/method flags',
      '',
      '```json',
      JSON.stringify(editorialFlagCounts, null, 2),
      '```',
      '',
      '## Experiment failure modes',
      '',
      '```json',
      JSON.stringify(experimentFailureModeCounts, null, 2),
      '```',
      '',
      '## Acceptance gate',
      '',
      '```json',
      JSON.stringify(summary.acceptance_gate, null, 2),
      '```',
      '',
      'The arithmetic summary does not replace the manual editorial/post-Jungian decision.',
      '',
    ].join('\n')
  );
  if (baselineSummaryPath) {
    writeBaselineComparison({
      outputDirectory,
      baselinePath: baselineSummaryPath,
      candidate: summary,
    });
  }
  writeScaffoldClusters(outputDirectory, results);
  maybeWriteCompletedPairwiseSummaries(outputDirectory);
  process.stdout.write(
    `${path.join(outputDirectory, 'MANUAL_REVIEW_SUMMARY.md')}\n`
  );
}

try {
  main();
} catch (error) {
  process.stderr.write(
    `${error instanceof Error ? error.message : String(error)}\n`
  );
  process.exitCode = 1;
}
