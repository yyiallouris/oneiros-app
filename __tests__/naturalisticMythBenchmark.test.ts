import { mkdtempSync, mkdirSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import path from 'path';
import {
  buildMythLevelReport,
  computeNaturalisticMythMetrics,
  deriveNaturalisticMythFailureSignals,
  inferReviewHypotheses,
  reconcileNaturalisticMythRunRecords,
  scoreNaturalisticMythRun,
  validateNaturalisticMythFixtures,
} from '../scripts/lib/naturalisticMythBenchmark';
import {
  buildNaturalisticMythBenchmarkJobs,
  loadExistingNaturalisticMythProgress,
} from '../scripts/lib/naturalisticMythBenchmarkRunner';
import { detectNaturalisticMythDatasetLeakage } from '../scripts/lib/naturalisticMythBenchmarkLeakage';
import {
  NATURALISTIC_MYTH_BENCHMARK_FIXTURES,
} from '../scripts/lib/naturalisticMythBenchmarkFixtures';
import { buildNaturalisticMythRunRecord } from '../scripts/lib/naturalisticMythRunRecord';

const stages = (
  rawCatalogId: string | null,
  postCatalogId: string | null,
  confidence: 'medium' | 'high' | null = 'medium'
) =>
  ({
    raw_archetypes: [],
    parsed_archetypes: [],
    normalized_archetypes: [],
    validator_decisions: [],
    post_validation_archetypes: [],
    archetype_rejected: [],
    raw_amplifications: rawCatalogId
      ? [
          {
            catalog_id: rawCatalogId,
            confidence: confidence ?? 'medium',
            resonance: 'A valid resonance that is long enough.',
            divergence: 'A valid divergence line.',
            evidence_ids: ['D1', 'D2'],
          },
        ]
      : [],
    mythic_validator_logs: postCatalogId
      ? [{ resolved_evidence_ids: ['D1', 'D2'] }]
      : [],
    post_validation_amplifications: postCatalogId
      ? [
          {
            catalog_id: postCatalogId,
            title: 'Resolved title',
            tradition: 'Resolved tradition',
            source_type: 'myth',
            resonance: 'A valid resonance that is long enough.',
            divergence: 'A valid divergence line.',
            evidence: ['span one', 'span two'],
            confidence: confidence ?? 'medium',
            catalog_myth_version: '1.2.0',
          },
        ]
      : [],
    mythic_reject_reasons: [],
    mythic_rejected: [],
  }) as ReturnType<typeof import('../scripts/lib/echoBenchmarkStages').buildEchoBenchmarkStages>;

describe('naturalistic myth fixtures', () => {
  it('validate exact fixture, arm, and language counts', () => {
    expect(NATURALISTIC_MYTH_BENCHMARK_FIXTURES).toHaveLength(24);
    expect(() => validateNaturalisticMythFixtures(NATURALISTIC_MYTH_BENCHMARK_FIXTURES)).not.toThrow();
  });

  it('detect leakage stays clean on the frozen dataset', () => {
    const leakage = detectNaturalisticMythDatasetLeakage(NATURALISTIC_MYTH_BENCHMARK_FIXTURES);
    expect(leakage.fixtures_with_hits).toBe(0);
  });

  it('fails deterministically on duplicate fixtures and invalid positive/negative contracts', () => {
    const bad = [
      NATURALISTIC_MYTH_BENCHMARK_FIXTURES[0],
      {
        ...NATURALISTIC_MYTH_BENCHMARK_FIXTURES[1],
        fixture_id: NATURALISTIC_MYTH_BENCHMARK_FIXTURES[0].fixture_id,
        expected_myth_presence: 'forbidden' as const,
        required_catalog_id: 'greek.orpheus_eurydice',
      },
    ];
    expect(() => validateNaturalisticMythFixtures(bad)).toThrow(/duplicate fixture_id|negative fixture must not set required_catalog_id/);
  });
});

describe('scoreNaturalisticMythRun', () => {
  const positive = NATURALISTIC_MYTH_BENCHMARK_FIXTURES.find(
    (fixture) => fixture.required_catalog_id === 'greek.orpheus_eurydice'
  )!;
  const negative = NATURALISTIC_MYTH_BENCHMARK_FIXTURES.find(
    (fixture) => fixture.expected_myth_presence === 'forbidden'
  )!;

  it('passes exact required myth on a positive fixture', () => {
    const score = scoreNaturalisticMythRun(
      positive,
      {
        raw_catalog_ids: ['greek.orpheus_eurydice'],
        post_catalog_ids: ['greek.orpheus_eurydice'],
        returned_confidence: 'medium',
        language_match: true,
        evidence_ids: ['D1', 'D2'],
        model: 'gpt-5.4-mini-2026-03-17',
        fallback_used: false,
      }
    );
    expect(score.contract_pass).toBe(true);
    expect(score.exact_catalog_match).toBe(true);
  });

  it('fails wrong catalog id, empty-on-positive, forbidden competitor, invalid confidence, and language mismatch', () => {
    expect(
      scoreNaturalisticMythRun(
        positive,
        {
          raw_catalog_ids: ['sumerian.inanna_descent'],
          post_catalog_ids: ['sumerian.inanna_descent'],
          returned_confidence: 'medium',
          language_match: true,
          evidence_ids: ['D1'],
          model: 'gpt-5.4-mini-2026-03-17',
          fallback_used: false,
        }
      ).contract_pass
    ).toBe(false);
    expect(
      scoreNaturalisticMythRun(
        positive,
        {
          raw_catalog_ids: [],
          post_catalog_ids: [],
          returned_confidence: null,
          language_match: true,
          evidence_ids: [],
          model: 'gpt-5.4-mini-2026-03-17',
          fallback_used: false,
        }
      ).contract_pass
    ).toBe(false);
    expect(
      scoreNaturalisticMythRun(
        positive,
        {
          raw_catalog_ids: ['sumerian.inanna_descent'],
          post_catalog_ids: ['sumerian.inanna_descent'],
          returned_confidence: 'high',
          language_match: false,
          evidence_ids: ['D1'],
          model: 'gpt-5.4-mini-2026-03-17',
          fallback_used: false,
        }
      ).contract_pass
    ).toBe(false);
  });

  it('passes empty-on-negative and fails named myth on negative', () => {
    expect(
      scoreNaturalisticMythRun(
        negative,
        {
          raw_catalog_ids: [],
          post_catalog_ids: [],
          returned_confidence: null,
          language_match: true,
          evidence_ids: [],
          model: 'gpt-5.4-mini-2026-03-17',
          fallback_used: false,
        }
      ).contract_pass
    ).toBe(true);
    expect(
      scoreNaturalisticMythRun(
        negative,
        {
          raw_catalog_ids: ['greek.sisyphus'],
          post_catalog_ids: ['greek.sisyphus'],
          returned_confidence: 'high',
          language_match: true,
          evidence_ids: ['D1'],
          model: 'gpt-5.4-mini-2026-03-17',
          fallback_used: false,
        }
      ).high_confidence_false_positive
    ).toBe(true);
  });
});

describe('naturalistic myth run record + reconciliation', () => {
  const fixture = NATURALISTIC_MYTH_BENCHMARK_FIXTURES.find(
    (row) => row.required_catalog_id === 'greek.sisyphus'
  )!;

  it('classifies raw-correct/post-removed as validator loss signal', () => {
    const score = scoreNaturalisticMythRun(
      fixture,
      {
        raw_catalog_ids: ['greek.sisyphus'],
        post_catalog_ids: [],
        returned_confidence: 'medium',
        language_match: true,
        evidence_ids: [],
        model: 'gpt-5.4-mini-2026-03-17',
        fallback_used: false,
      }
    );
    expect(score.failure_signals.raw_correct_post_removed).toBe(true);
    expect(score.failure_signals.evidence_resolution_failure).toBe(true);
    expect(score.contract_pass).toBe(false);
  });

  it('builds canonical run records and catches wrong model / missing run / duplicate run ids', () => {
    const run = buildNaturalisticMythRunRecord({
      fixture,
      run_id: `${fixture.fixture_id}_r1`,
      repeat_index: 1,
      outDir: '/tmp/myth',
      model: 'gpt-5.4-mini-2026-03-17',
      fallback_used: false,
      retry_count: 0,
      latency_ms: 111,
      cost: null,
      language_match: true,
      output_language: {
        language_match: true,
        language_mismatch_fields: [],
        checked_fields: 2,
        target_language: 'en',
      } as any,
      stages: stages('greek.sisyphus', 'greek.sisyphus'),
      expectedModel: 'gpt-5.4-mini-2026-03-17',
    });

    expect(run.contract_pass).toBe(true);
    expect(run.source_run_file).toBe('/tmp/myth/SP_sisyphus_restart_en_r1.json');

    const errors = reconcileNaturalisticMythRunRecords({
      fixtures: [fixture],
      runs: [
        run,
        {
          ...run,
          run_id: run.run_id,
          repeat_index: 2,
          source_run_file: '',
          model: 'gpt-5.4-mini',
        },
      ],
      failed_runs: [{ fixture_id: fixture.fixture_id, repeat_index: 3 }],
      outDir: '/tmp/myth',
      expectedModel: 'gpt-5.4-mini-2026-03-17',
    });

    expect(errors.some((error) => error.includes('duplicate run_id'))).toBe(true);
    expect(errors.some((error) => error.includes('wrong model'))).toBe(true);
    expect(errors.some((error) => error.includes('missing or external source_run_file'))).toBe(true);
  });
});

describe('naturalistic myth aggregate metrics', () => {
  it('derives summary metrics only from canonical run records and builds myth-level report', () => {
    const positive = NATURALISTIC_MYTH_BENCHMARK_FIXTURES.find(
      (row) => row.required_catalog_id === 'arabian.fisherman_and_jinni'
    )!;
    const negative = NATURALISTIC_MYTH_BENCHMARK_FIXTURES.find(
      (row) => row.expected_myth_presence === 'forbidden'
    )!;

    const positiveRun = buildNaturalisticMythRunRecord({
      fixture: positive,
      run_id: `${positive.fixture_id}_r1`,
      repeat_index: 1,
      outDir: '/tmp/myth',
      model: 'gpt-5.4-mini-2026-03-17',
      fallback_used: false,
      retry_count: 0,
      latency_ms: 100,
      cost: null,
      language_match: true,
      output_language: {
        language_match: true,
        language_mismatch_fields: [],
        checked_fields: 2,
        target_language: 'en',
      } as any,
      stages: stages('arabian.fisherman_and_jinni', 'arabian.fisherman_and_jinni'),
    });
    const negativeRun = {
      ...buildNaturalisticMythRunRecord({
        fixture: negative,
        run_id: `${negative.fixture_id}_r1`,
        repeat_index: 1,
        outDir: '/tmp/myth',
        model: 'gpt-5.4-mini-2026-03-17',
        fallback_used: false,
        retry_count: 0,
        latency_ms: 100,
        cost: null,
        language_match: true,
        output_language: {
          language_match: true,
          language_mismatch_fields: [],
          checked_fields: 2,
          target_language: 'en',
        } as any,
        stages: stages(null, null, null),
      }),
      post_catalog_ids: [],
      raw_catalog_ids: [],
      contract_pass: true,
    };

    const metrics = computeNaturalisticMythMetrics(
      [positive, negative],
      [positiveRun, negativeRun as any]
    );
    expect(metrics.total_runs).toBe(2);
    expect(metrics.contract_pass_count).toBe(2);
    expect(metrics.exact_catalog_precision).toBe(1);
    expect(metrics.strong_positive_metric).toEqual({
      numerator: 1,
      denominator: 1,
      rate: 1,
    });
    const mythReport = buildMythLevelReport([positive, negative], [positiveRun, negativeRun as any])[0];
    expect(mythReport.catalog_id).toBe('arabian.fisherman_and_jinni');
    expect(mythReport.raw_candidate_omission_count).toBe(0);
    expect(mythReport.evidence_resolution_failure_count).toBe(0);
  });
});

describe('reviewer failure classification', () => {
  const competitorFixture = NATURALISTIC_MYTH_BENCHMARK_FIXTURES.find(
    (row) => row.fixture_id === 'CP_fisherman_magic_object_en'
  )!;

  it('classifies raw-empty competitor misses as stochastic omission, not evidence loss', () => {
    const run = {
      run_id: `${competitorFixture.fixture_id}_r2`,
      fixture_id: competitorFixture.fixture_id,
      repeat_index: 2 as const,
      arm: competitorFixture.arm,
      dream_language: competitorFixture.dream_language,
      expected_myth_presence: competitorFixture.expected_myth_presence,
      required_catalog_id: competitorFixture.required_catalog_id,
      acceptable_catalog_ids: [...competitorFixture.acceptable_catalog_ids],
      forbidden_catalog_ids: [...competitorFixture.forbidden_catalog_ids],
      raw_catalog_ids: [],
      post_catalog_ids: [],
      returned_confidence: null,
      evidence_ids: [],
      resonance: null,
      divergence: null,
      presence_match: false,
      exact_catalog_match: false,
      forbidden_competitor_hit: false,
      unexpected_myth: false,
      confidence_contract_pass: false,
      contract_pass: false,
      language_match: true,
      validator_decisions: [],
      model: 'gpt-5.4-mini-2026-03-17',
      fallback_used: false,
      latency_ms: 100,
      retry_count: 0,
      source_run_file: '/tmp/myth/CP_fisherman_magic_object_en_r2.json',
    };

    expect(deriveNaturalisticMythFailureSignals(run)).toEqual({
      raw_candidate_omission: true,
      raw_correct_post_removed: false,
      evidence_resolution_failure: false,
      validator_rejection: false,
    });
    expect(inferReviewHypotheses(run)).toEqual({
      primary: 'G. stochastic candidate omission / selection instability',
      secondary: 'A. excessive caution under distracting competitor framing',
    });
  });
});

describe('benchmark resume support', () => {
  it('reuses existing successful artifacts and schedules only missing or failed jobs', () => {
    const fixtures = NATURALISTIC_MYTH_BENCHMARK_FIXTURES.slice(0, 2);
    const jobs = buildNaturalisticMythBenchmarkJobs(fixtures);
    const outDir = mkdtempSync(path.join(tmpdir(), 'naturalistic-myth-progress-'));
    mkdirSync(outDir, { recursive: true });

    const existingRun = buildNaturalisticMythRunRecord({
      fixture: fixtures[0],
      run_id: `${fixtures[0].fixture_id}_r1`,
      repeat_index: 1,
      outDir,
      model: 'gpt-5.4-mini-2026-03-17',
      fallback_used: false,
      retry_count: 0,
      latency_ms: 120,
      cost: null,
      language_match: true,
      output_language: {
        language_match: true,
        language_mismatch_fields: [],
        checked_fields: 2,
        target_language: fixtures[0].dream_language,
      } as any,
      stages: stages(fixtures[0].required_catalog_id, fixtures[0].required_catalog_id),
    });
    writeFileSync(
      path.join(outDir, `${existingRun.run_id}.json`),
      JSON.stringify(existingRun, null, 2)
    );
    writeFileSync(
      path.join(outDir, `${fixtures[0].fixture_id}_r2.json`),
      JSON.stringify(
        {
          ok: false,
          fixture_id: fixtures[0].fixture_id,
          repeat_index: 2,
          error_type: 'rate_limited',
        },
        null,
        2
      )
    );

    const progress = loadExistingNaturalisticMythProgress({ outDir, jobs });

    expect(progress.existingRuns.map((run) => run.run_id)).toEqual([existingRun.run_id]);
    expect(progress.jobsToRun.map((job) => job.run_id)).toContain(`${fixtures[0].fixture_id}_r2`);
    expect(progress.jobsToRun.map((job) => job.run_id)).toContain(`${fixtures[0].fixture_id}_r3`);
    expect(progress.jobsToRun.map((job) => job.run_id)).toContain(`${fixtures[1].fixture_id}_r1`);
    expect(progress.retriedFailedArtifacts).toBe(1);
  });
});
