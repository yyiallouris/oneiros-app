import {
  computeGlobalArchetypeMetrics,
  computeGlobalArchetypeMetricsByStyle,
  scoreGlobalArchetypeRun,
  validateGlobalArchetypeFixtures,
  type GlobalArchetypeFixture,
} from '../scripts/lib/globalArchetypeBenchmark';
import { GLOBAL_ARCHETYPE_BENCHMARK_FIXTURES } from '../scripts/lib/globalArchetypeBenchmarkFixtures';
import { detectGlobalArchetypeDatasetLeakage } from '../scripts/lib/globalArchetypeBenchmarkLeakage';

describe('globalArchetypeBenchmark fixtures', () => {
  it('validates the frozen 74-dream dataset (v1.2.0)', () => {
    expect(GLOBAL_ARCHETYPE_BENCHMARK_FIXTURES).toHaveLength(74);
    expect(() => validateGlobalArchetypeFixtures(GLOBAL_ARCHETYPE_BENCHMARK_FIXTURES)).not.toThrow();
    const catalog = GLOBAL_ARCHETYPE_BENCHMARK_FIXTURES.filter((f) => f.evaluation_style === 'catalog_conformance');
    const naturalistic = GLOBAL_ARCHETYPE_BENCHMARK_FIXTURES.filter((f) => f.evaluation_style === 'naturalistic');
    expect(catalog).toHaveLength(61);
    expect(naturalistic).toHaveLength(13);
  });

  it('rejects overlapping required and forbidden ids', () => {
    const bad: GlobalArchetypeFixture = {
      ...GLOBAL_ARCHETYPE_BENCHMARK_FIXTURES[0],
      id: 'bad_overlap',
      expected: {
        ...GLOBAL_ARCHETYPE_BENCHMARK_FIXTURES[0].expected,
        required_archetype_ids: ['hero'],
        forbidden_archetype_ids: ['hero'],
      },
    };
    expect(() => validateGlobalArchetypeFixtures([bad])).toThrow(/overlap/);
  });
});

describe('scoreGlobalArchetypeRun', () => {
  const fixture = GLOBAL_ARCHETYPE_BENCHMARK_FIXTURES.find((f) => f.id === 'P_hero_a')!;

  it('passes when required present and no forbidden extras', () => {
    const score = scoreGlobalArchetypeRun(fixture, ['hero']);
    expect(score.contract_pass).toBe(true);
    expect(score.exact_set_match).toBe(true);
    expect(score.unambiguous_exact_set_match).toBe(true);
  });

  it('treats required-only output as exact-set match when acceptable secondaries exist', () => {
    const selfFixture = GLOBAL_ARCHETYPE_BENCHMARK_FIXTURES.find((f) => f.id === 'P_self_a')!;
    const score = scoreGlobalArchetypeRun(selfFixture, ['self']);
    expect(score.contract_pass).toBe(true);
    expect(score.exact_set_match).toBe(true);
    expect(score.unambiguous_exact_set_match).toBe(false);
  });

  it('fails when forbidden archetype appears', () => {
    const score = scoreGlobalArchetypeRun(fixture, ['hero', 'death_rebirth']);
    expect(score.contract_pass).toBe(false);
    expect(score.forbidden_hits.length).toBeGreaterThan(0);
  });

  it('fails on unexpected extras not listed in forbidden_archetype_ids', () => {
    const ambiguous = GLOBAL_ARCHETYPE_BENCHMARK_FIXTURES.find((f) => f.id === 'NAT_ambiguous_en_b')!;
    const score = scoreGlobalArchetypeRun(ambiguous, ['persona']);
    expect(score.contract_pass).toBe(false);
    expect(score.unexpected_extra_ids).toEqual(['persona']);
    expect(score.forbidden_hits).toEqual([]);
  });
});

describe('computeGlobalArchetypeMetrics', () => {
  it('aggregates contract pass and confusion pairs', () => {
    const heroFixture = GLOBAL_ARCHETYPE_BENCHMARK_FIXTURES.find((f) => f.id === 'P_hero_a')!;
    const emptyFixture = GLOBAL_ARCHETYPE_BENCHMARK_FIXTURES.find((f) => f.id === 'N_ordinary')!;
    const metrics = computeGlobalArchetypeMetrics([
      {
        fixture: heroFixture,
        post_archetype_ids: ['hero'],
        raw_archetype_ids: ['hero'],
        raw_candidate_count: 1,
        schema_ok: true,
        proxy_ok: true,
        post_myth_count: 0,
      },
      {
        fixture: heroFixture,
        post_archetype_ids: ['guide_psychopomp'],
        raw_archetype_ids: ['guide_psychopomp'],
        raw_candidate_count: 1,
        schema_ok: true,
        proxy_ok: true,
        post_myth_count: 0,
      },
      {
        fixture: emptyFixture,
        post_archetype_ids: [],
        raw_archetype_ids: [],
        raw_candidate_count: 0,
        schema_ok: true,
        proxy_ok: true,
        post_myth_count: 0,
      },
    ]);

    expect(metrics.total_runs).toBe(3);
    expect(metrics.contract_pass_count).toBe(2);
    expect(metrics.empty_dream_accuracy).toBe(1);
    expect(metrics.confusion_pairs.some((p) => p.expected_id === 'hero')).toBe(true);
  });

  it('reports separate catalog and naturalistic buckets', () => {
    const heroFixture = GLOBAL_ARCHETYPE_BENCHMARK_FIXTURES.find((f) => f.id === 'P_hero_a')!;
    const natFixture = GLOBAL_ARCHETYPE_BENCHMARK_FIXTURES.find((f) => f.id === 'NAT_ordinary_en')!;
    const split = computeGlobalArchetypeMetricsByStyle([
      {
        fixture: heroFixture,
        post_archetype_ids: ['hero'],
        raw_archetype_ids: ['hero'],
        raw_candidate_count: 1,
        schema_ok: true,
        proxy_ok: true,
        post_myth_count: 0,
      },
      {
        fixture: natFixture,
        post_archetype_ids: ['hero'],
        raw_archetype_ids: ['hero'],
        raw_candidate_count: 1,
        schema_ok: true,
        proxy_ok: true,
        post_myth_count: 0,
      },
    ]);
    expect(split.global.total_runs).toBe(2);
    expect(split.catalog_conformance.total_runs).toBe(1);
    expect(split.naturalistic.total_runs).toBe(1);
  });
});

describe('globalArchetypeMixedAnalysis', () => {
  it('classifies all 11 mixed fixtures and computes adjudicated metrics', () => {
    const { MIXED_RELATION_BY_FIXTURE_ID, computeMixedAdjudicatedMetrics } = require('../scripts/lib/globalArchetypeMixedAnalysis');
    const mixed = GLOBAL_ARCHETYPE_BENCHMARK_FIXTURES.filter((f) => f.category === 'mixed');
    expect(Object.keys(MIXED_RELATION_BY_FIXTURE_ID)).toHaveLength(11);
    const metrics = computeMixedAdjudicatedMetrics(
      mixed.map((fixture) => ({
        fixture,
        post_archetype_ids: fixture.expected.required_archetype_ids,
      }))
    );
    expect(metrics.mixed_fixtures).toBe(11);
    expect(metrics.distinct_functions_or_carriers.fixtures).toBe(6);
    expect(metrics.same_carrier_dual_reading.fixtures).toBe(5);
  });
});

describe('globalArchetypeCost', () => {
  it('aggregates finite estimatedUsd values and reports unavailable cost separately', () => {
    const { aggregateGlobalArchetypeCosts } = require('../scripts/lib/globalArchetypeCost');
    expect(
      aggregateGlobalArchetypeCosts([
        { estimatedUsd: 0.01 },
        { estimatedUsd: null },
        { estimatedUsd: 0.02 },
      ])
    ).toEqual({
      total_estimated_usd: 0.03,
      cost_available_runs: 2,
      cost_unavailable_runs: 1,
    });
    expect(aggregateGlobalArchetypeCosts([{ estimatedUsd: null }])).toEqual({
      total_estimated_usd: null,
      cost_available_runs: 0,
      cost_unavailable_runs: 1,
    });
  });
});

describe('globalArchetypeBenchmarkLeakage', () => {
  it('flags interpretive meta-language in archived v1.0.0 style text', () => {
    const leak = detectGlobalArchetypeDatasetLeakage(GLOBAL_ARCHETYPE_BENCHMARK_FIXTURES);
    expect(leak.total_hits).toBeLessThan(20);
  });
});
