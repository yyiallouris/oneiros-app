import {
  ONEIROS_LANGUAGE_CODES,
  type OneirosLanguageCode,
} from '../../src/constants/oneirosLanguages';

export const REFLECTIVE_QUESTION_V2_BENCHMARK_ID =
  'oneiros-reflective-question-v2-production-benchmark-v2.1.0' as const;

export const REFLECTIVE_QUESTION_HUMAN_QUALITY_GATE = {
  status: 'pending_human_review',
  scoreScale: '0-2',
  dimensions: [
    'evidence_fidelity',
    'image_specificity',
    'psychological_aliveness',
    'psychic_expansion',
    'unforced_ambiguity',
    'human_pull',
    'genuine_desire_to_answer',
    'target_language_naturalness',
  ],
  judgment: 'preferable_to_abstain',
} as const;

export const REFLECTIVE_QUESTION_V2_SOURCE_FIXTURE =
  'testing/live-scenarios/reflective-questions-live-benchmark.v1.json' as const;

export const REFLECTIVE_QUESTION_V2_MULTILINGUAL_FIXTURE =
  'testing/live-scenarios/reflective-questions-multilingual-expansion.v1.json' as const;

export const REFLECTIVE_QUESTION_V2_SOURCE_FIXTURE_VERSION = '1.0.0' as const;

/**
 * Frozen stratified slice of the 50-dream synthetic Greek corpus.
 *
 * Distribution: 10 short, 5 medium, 5 long. The slice covers all fixture
 * category families while avoiding the temptation to hand-pick only dramatic
 * dreams that naturally produce easier reflective questions.
 */
export const REFLECTIVE_QUESTION_V2_GREEK_CASE_IDS = [
  'bus-stop-faded-receipt',
  'elevator-missing-button',
  'refrigerator-light-and-lemon',
  'child-lost-at-station',
  'red-water-under-door',
  'sunrise-on-quiet-ridge',
  'snowfield-with-warm-stones',
  'humming-stone-chamber',
  'shadow-arrives-first',
  'words-rest-on-table',
  'backward-train-forward-city',
  'two-suns-midnight-market',
  'shared-scarf-at-harbor',
  'shared-bed-changing-faces',
  'skin-turns-to-bark',
  'voice-becomes-colored-thread',
  'transparent-body-at-family-picnic',
  'airport-gate-never-opens',
  'dinner-for-absent-host',
  'archive-stairs-during-earthquake',
] as const;

export const REFLECTIVE_QUESTION_V2_MULTILINGUAL_CASE_IDS = [
  'en-watch-runs-backward',
  'es-paraguas-en-la-cocina',
  'fr-grand-mere-noeud',
  'de-zug-im-wald',
  'it-mare-nella-ciotola',
  'pt-casa-sem-portas',
  'nl-fiets-krijgt-wortels',
  'pl-oddychajace-ksiazki',
  'ru-siniy-klyuch',
  'ja-yoru-no-eki',
  'zh-niuli-de-he',
  'en-spanish-door-phrase',
  'fr-enseigne-stay',
  'ja-neon-home',
  'zh-faguo-mingzi',
] as const;

export const REFLECTIVE_QUESTION_V2_BENCHMARK_CASE_IDS = [
  ...REFLECTIVE_QUESTION_V2_GREEK_CASE_IDS,
  ...REFLECTIVE_QUESTION_V2_MULTILINGUAL_CASE_IDS,
] as const;

export const REFLECTIVE_QUESTION_V2_REQUIRED_CATEGORIES = [
  'ordinary_banal_low_affect',
  'emotionally_intense',
  'positive_peaceful_beautiful_coherent',
  'numinous',
  'contradictory_paradoxical',
  'strange_surreal',
  'relational_intimate_erotic_vital',
  'transformation_body_change_metamorphosis',
  'meaningful_non_action_waiting_silence_absence',
] as const;

export type ReflectiveQuestionV2FixtureCase = {
  id: string;
  title: string;
  content: string;
  language: OneirosLanguageCode;
  length_band: 'short' | 'medium' | 'long';
  categories: string[];
  narrative_features?: string[];
  reviewer_focus?: string;
  forbidden_inventions?: string[];
};

export type ReflectiveQuestionV2Fixture = {
  version: string;
  benchmark_id: string;
  source: 'synthetic';
  cases: ReflectiveQuestionV2FixtureCase[];
};

export type ReflectiveQuestionV2BenchmarkTrial = {
  case_id: string;
  language: OneirosLanguageCode;
  length_band: 'short' | 'medium' | 'long';
  categories: string[];
  artifact_status: 'question' | 'abstained' | 'technical_failure';
  outcome:
    | 'committed_question'
    | 'semantic_abstention'
    | 'deterministic_validation_rejection'
    | 'provider_failure'
    | 'language_mismatch';
  question_decision: 'question' | 'abstain' | 'not_run';
  final_question: string | null;
  output_language: OneirosLanguageCode | null;
  technical_error: string | null;
  total_latency_ms: number;
  estimated_usd: number | null;
};

function countQuestionUnits(
  value: string,
  language: OneirosLanguageCode
): number {
  if (language === 'ja' || language === 'zh') {
    return [...value].filter((character) => /\p{L}/u.test(character)).length;
  }
  return value.trim().split(/\s+/u).filter(Boolean).length;
}

function round(value: number): number {
  return Number(value.toFixed(6));
}

export const REFLECTIVE_QUESTION_V2_DEFAULT_PAID_CASE_CAP = 18;
export const REFLECTIVE_QUESTION_V5_GATE_1_COST_CAP_USD = 0.15 as const;
export const REFLECTIVE_QUESTION_V5_GATE_1_CASE_IDS = [
  'elevator-missing-button',
  'words-rest-on-table',
  'dinner-for-absent-host',
  'zh-faguo-mingzi',
  'sunrise-on-quiet-ridge',
  'skin-turns-to-bark',
  'ja-neon-home',
  'shared-scarf-at-harbor',
] as const;

export function assertReflectiveQuestionV5Gate1Scope(caseIds: readonly string[]): void {
  if (
    caseIds.length !== REFLECTIVE_QUESTION_V5_GATE_1_CASE_IDS.length ||
    caseIds.some((id, index) => id !== REFLECTIVE_QUESTION_V5_GATE_1_CASE_IDS[index])
  ) {
    throw new Error('V5 Gate 1 must use the exact ordered frozen adversarial eight.');
  }
}

export function assertReflectiveQuestionV2PaidScope(params: {
  caseCount: number;
  explicitFullRunApproval: boolean;
}): void {
  if (
    params.caseCount > REFLECTIVE_QUESTION_V2_DEFAULT_PAID_CASE_CAP &&
    !params.explicitFullRunApproval
  ) {
    throw new Error(
      `Reflective-question paid scope is capped at ${REFLECTIVE_QUESTION_V2_DEFAULT_PAID_CASE_CAP} cases. Set REFLECTIVE_QUESTION_V2_ALLOW_FULL_CORPUS=1 only after explicit cost authorization.`
    );
  }
}

export function selectReflectiveQuestionV2BenchmarkCases(
  greekFixture: ReflectiveQuestionV2Fixture,
  multilingualFixture: ReflectiveQuestionV2Fixture
): ReflectiveQuestionV2FixtureCase[] {
  if (
    greekFixture.version !== REFLECTIVE_QUESTION_V2_SOURCE_FIXTURE_VERSION ||
    multilingualFixture.version !== REFLECTIVE_QUESTION_V2_SOURCE_FIXTURE_VERSION
  ) {
    throw new Error(
      'Reflective-question benchmark fixture version drifted.'
    );
  }
  if (
    greekFixture.source !== 'synthetic' ||
    multilingualFixture.source !== 'synthetic'
  ) {
    throw new Error(
      'Reflective-question live benchmark accepts synthetic fixtures only.'
    );
  }
  if (greekFixture.cases.length !== 50) {
    throw new Error(
      `Reflective-question Greek source fixture must contain 50 cases; received ${greekFixture.cases.length}.`
    );
  }
  if (multilingualFixture.cases.length !== 15) {
    throw new Error(
      `Reflective-question multilingual fixture must contain 15 cases; received ${multilingualFixture.cases.length}.`
    );
  }

  const allCases = [...greekFixture.cases, ...multilingualFixture.cases];
  const fixtureIds = new Set(allCases.map((testCase) => testCase.id));
  if (fixtureIds.size !== allCases.length) {
    throw new Error('Reflective-question source fixture contains duplicate ids.');
  }

  const selected = REFLECTIVE_QUESTION_V2_BENCHMARK_CASE_IDS.map((id) => {
    const testCase = allCases.find((candidate) => candidate.id === id);
    if (!testCase) throw new Error(`Missing frozen benchmark case: ${id}.`);
    return testCase;
  });
  const lengthCounts = selected.reduce<Record<string, number>>((counts, testCase) => {
    counts[testCase.length_band] = (counts[testCase.length_band] ?? 0) + 1;
    return counts;
  }, {});
  if (
    lengthCounts.short !== 19 ||
    lengthCounts.medium !== 11 ||
    lengthCounts.long !== 5
  ) {
    throw new Error(
      `Benchmark length distribution drifted: ${JSON.stringify(lengthCounts)}.`
    );
  }

  const languages = new Set(selected.map((testCase) => testCase.language));
  const missingLanguages = ONEIROS_LANGUAGE_CODES.filter(
    (language) => !languages.has(language)
  );
  if (missingLanguages.length > 0) {
    throw new Error(
      `Benchmark language coverage drifted: ${missingLanguages.join(', ')}.`
    );
  }

  const categories = new Set(selected.flatMap((testCase) => testCase.categories));
  const missingCategories = REFLECTIVE_QUESTION_V2_REQUIRED_CATEGORIES.filter(
    (category) => !categories.has(category)
  );
  if (missingCategories.length > 0) {
    throw new Error(
      `Benchmark category coverage drifted: ${missingCategories.join(', ')}.`
    );
  }

  return selected;
}

export function summarizeReflectiveQuestionV2Benchmark(
  trials: ReflectiveQuestionV2BenchmarkTrial[]
) {
  const questions = trials.filter(
    (trial) => trial.artifact_status === 'question' && trial.final_question
  );
  const lengthUnits = questions.map((trial) =>
    countQuestionUnits(trial.final_question ?? '', trial.language)
  );
  const estimatedCosts = trials
    .map((trial) => trial.estimated_usd)
    .filter((value): value is number => typeof value === 'number');
  const totalCost = estimatedCosts.reduce((sum, value) => sum + value, 0);
  const latencies = trials.map((trial) => trial.total_latency_ms);
  const sortedLatencies = [...latencies].sort((a, b) => a - b);
  const percentile = (fraction: number): number => {
    if (sortedLatencies.length === 0) return 0;
    const index = Math.min(
      sortedLatencies.length - 1,
      Math.max(0, Math.ceil(sortedLatencies.length * fraction) - 1)
    );
    return sortedLatencies[index];
  };

  const committed = trials.filter((trial) => trial.outcome === 'committed_question');
  const perLanguage = Object.fromEntries(
    ONEIROS_LANGUAGE_CODES.map((language) => {
      const languageTrials = trials.filter((trial) => trial.language === language);
      return [language, {
        cases: languageTrials.length,
        questions: languageTrials.filter(
          (trial) => trial.artifact_status === 'question'
        ).length,
        output_language_mismatches: languageTrials.filter(
          (trial) =>
            trial.output_language != null && trial.output_language !== trial.language
        ).length,
      }];
    })
  );

  return {
    total_cases: trials.length,
    question_count: questions.length,
    question_rate: trials.length > 0 ? round(questions.length / trials.length) : 0,
    semantic_abstention_count: trials.filter(
      (trial) => trial.outcome === 'semantic_abstention'
    ).length,
    deterministic_validation_rejection_count: trials.filter(
      (trial) => trial.outcome === 'deterministic_validation_rejection'
    ).length,
    language_mismatch_count: trials.filter(
      (trial) => trial.outcome === 'language_mismatch'
    ).length,
    provider_failure_count: trials.filter(
      (trial) => trial.outcome === 'provider_failure'
    ).length,
    technical_failure_count: trials.filter(
      (trial) => trial.artifact_status === 'technical_failure'
    ).length,
    question_decisions: {
      question: trials.filter((trial) => trial.question_decision === 'question').length,
      abstain: trials.filter((trial) => trial.question_decision === 'abstain').length,
      not_run: trials.filter((trial) => trial.question_decision === 'not_run').length,
    },
    committed_candidate_rate:
      questions.length > 0 ? round(committed.length / questions.length) : 0,
    output_language_mismatch_count: trials.filter(
      (trial) =>
        trial.output_language != null && trial.output_language !== trial.language
    ).length,
    per_language: perLanguage,
    question_length_units: {
      measurement: 'words_except_ja_zh_letters',
      minimum: lengthUnits.length > 0 ? Math.min(...lengthUnits) : 0,
      maximum: lengthUnits.length > 0 ? Math.max(...lengthUnits) : 0,
      average:
        lengthUnits.length > 0
          ? round(lengthUnits.reduce((sum, value) => sum + value, 0) / lengthUnits.length)
          : 0,
    },
    latency_ms: {
      p50: percentile(0.5),
      p95: percentile(0.95),
      maximum: latencies.length > 0 ? Math.max(...latencies) : 0,
    },
    estimated_usd: estimatedCosts.length === trials.length ? round(totalCost) : null,
  };
}
