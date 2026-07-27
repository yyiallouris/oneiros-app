import {
  ACCEPTANCE_CASE_MYTH_FIXTURE,
  buildAcceptanceRunRecord,
  reconcileAcceptancePacket,
  summarizeCasesFromRuns,
  validateAcceptanceFixtures,
} from '../scripts/lib/acceptanceRunRecord';

describe('acceptanceRunRecord', () => {
  const cases = Object.entries(ACCEPTANCE_CASE_MYTH_FIXTURE).map(([id, required_myth_catalog_id]) => ({
    id,
    combination: id,
    dream: `dream for ${id}`,
    expected: { required_myth_catalog_id },
  }));

  it('validates fixture map against jsonl expectations', () => {
    expect(() => validateAcceptanceFixtures(cases)).not.toThrow();
  });

  it('fails fast when jsonl myth fixture diverges', () => {
    const bad = [{ ...cases[0], expected: { required_myth_catalog_id: 'wrong.id' } }];
    expect(() => validateAcceptanceFixtures(bad)).toThrow(/fixtures invalid/);
  });

  it('builds canonical run record with myth ids from post stages', () => {
    const post = {
      raw_archetypes: [],
      parsed_archetypes: [],
      normalized_archetypes: [],
      validator_decisions: [],
      post_validation_archetypes: [],
      archetype_rejected: [],
      raw_amplifications: [{ catalog_id: 'greek.sisyphus' }],
      mythic_validator_logs: [],
      post_validation_amplifications: [{ catalog_id: 'greek.sisyphus' }],
      mythic_reject_reasons: [],
      mythic_rejected: [],
    } as unknown as ReturnType<typeof import('../scripts/lib/echoBenchmarkStages').buildEchoBenchmarkStages>;

    const run = buildAcceptanceRunRecord({
      runId: 'C3_no_archetype_plus_myth_r1',
      caseSpec: cases[2],
      outDir: '/tmp/out',
      post,
      score: { myth_status: 'correct', myth_catalog_ids: ['greek.sisyphus'] },
      model: 'gpt-5.4-mini',
      schemaOk: true,
      proxyOk: true,
      latency_ms: 100,
      estimated_usd: 0.01,
    });

    expect(run.expected_myth_catalog_id).toBe('greek.sisyphus');
    expect(run.raw_myth_catalog_id).toBe('greek.sisyphus');
    expect(run.post_myth_catalog_id).toBe('greek.sisyphus');
    expect(run.source_run_file).toBe('/tmp/out/C3_no_archetype_plus_myth_r1.json');
  });

  it('summarizes myth counts exclusively from run records', () => {
    const runs = [
      buildAcceptanceRunRecord({
        runId: 'C5_one_archetype_plus_myth_r1',
        caseSpec: cases[4],
        outDir: '/tmp/out',
        post: {
          raw_amplifications: [{ catalog_id: 'japanese.izanagi_izanami' }],
          post_validation_amplifications: [{ catalog_id: 'japanese.izanagi_izanami' }],
          raw_archetypes: [],
          parsed_archetypes: [],
          normalized_archetypes: [],
          validator_decisions: [],
          post_validation_archetypes: [],
          archetype_rejected: [],
          mythic_validator_logs: [],
          mythic_reject_reasons: [],
          mythic_rejected: [],
        } as unknown as ReturnType<typeof import('../scripts/lib/echoBenchmarkStages').buildEchoBenchmarkStages>,
        score: { myth_status: 'wrong', myth_catalog_ids: ['japanese.izanagi_izanami'] },
        model: 'gpt-5.4-mini',
        schemaOk: true,
        proxyOk: true,
        latency_ms: 100,
        estimated_usd: 0.01,
      }),
    ];

    const summary = summarizeCasesFromRuns(runs);
    const c5 = summary.find((c) => c.case_id === 'C5_one_archetype_plus_myth');
    expect(c5?.myth_wrong).toBe(1);
    expect(c5?.myth_correct).toBe(0);
  });

  it('reconcile passes when summary matches detailed runs', () => {
    const runs = [
      buildAcceptanceRunRecord({
        runId: 'C3_no_archetype_plus_myth_r1',
        caseSpec: cases[2],
        outDir: '/tmp/out',
        post: {
          raw_amplifications: [{ catalog_id: 'greek.sisyphus' }],
          post_validation_amplifications: [{ catalog_id: 'greek.sisyphus' }],
          raw_archetypes: [],
          parsed_archetypes: [],
          normalized_archetypes: [],
          validator_decisions: [],
          post_validation_archetypes: [],
          archetype_rejected: [],
          mythic_validator_logs: [],
          mythic_reject_reasons: [],
          mythic_rejected: [],
        } as unknown as ReturnType<typeof import('../scripts/lib/echoBenchmarkStages').buildEchoBenchmarkStages>,
        score: { myth_status: 'correct' },
        model: 'gpt-5.4-mini',
        schemaOk: true,
        proxyOk: true,
        latency_ms: 100,
        estimated_usd: 0.01,
      }),
    ];
    const detailed = summarizeCasesFromRuns(runs);
    const summaryCases = detailed.map((d) => ({
      case_id: d.case_id,
      myth_correct: d.myth_correct,
      myth_empty: d.myth_empty,
      myth_wrong: d.myth_wrong,
      runs: d.runs,
    }));

    const errors = reconcileAcceptancePacket({
      source_out_dir: '/tmp/out',
      runs,
      cases: detailed,
      summaryCases,
    });
    expect(errors).toEqual([]);
  });

  it('reconcile fails when summary myth counts diverge', () => {
    const runs = [
      buildAcceptanceRunRecord({
        runId: 'C1_two_archetypes_plus_myth_r1',
        caseSpec: cases[0],
        outDir: '/tmp/out',
        post: {
          raw_amplifications: [],
          post_validation_amplifications: [],
          raw_archetypes: [],
          parsed_archetypes: [],
          normalized_archetypes: [],
          validator_decisions: [],
          post_validation_archetypes: [],
          archetype_rejected: [],
          mythic_validator_logs: [],
          mythic_reject_reasons: [],
          mythic_rejected: [],
        } as unknown as ReturnType<typeof import('../scripts/lib/echoBenchmarkStages').buildEchoBenchmarkStages>,
        score: { myth_status: 'empty' },
        model: 'gpt-5.4-mini',
        schemaOk: true,
        proxyOk: true,
        latency_ms: 100,
        estimated_usd: 0.01,
      }),
    ];
    const detailed = summarizeCasesFromRuns(runs);
    const errors = reconcileAcceptancePacket({
      source_out_dir: '/tmp/out',
      runs,
      cases: detailed,
      summaryCases: [
        {
          case_id: 'C1_two_archetypes_plus_myth',
          myth_correct: 1,
          myth_empty: 0,
          myth_wrong: 0,
          runs: 1,
        },
      ],
    });
    expect(errors.some((e) => e.includes('myth_correct mismatch'))).toBe(true);
  });

  it('computeAcceptanceLayerPasses separates myth and archetype layers', () => {
    const { computeAcceptanceLayerPasses } = require('../scripts/lib/acceptanceRunRecord');
    const passes = computeAcceptanceLayerPasses({
      integrity_100: true,
      myth_negative_6_of_6: true,
      myth_positive_min_2_of_3: true,
      required_archetypes_all: false,
      empty_archetype_cases: true,
      catalog_gaps: [],
    });
    expect(passes.integrity_pass).toBe(true);
    expect(passes.myth_layer_pass).toBe(true);
    expect(passes.archetype_layer_pass).toBe(false);
    expect(passes.overall_pass).toBe(false);
  });
});
