import { readFileSync } from 'fs';
import path from 'path';
import {
  REFLECTIVE_QUESTION_HUMAN_QUALITY_GATE,
  REFLECTIVE_QUESTION_V2_BENCHMARK_CASE_IDS,
  REFLECTIVE_QUESTION_V2_MULTILINGUAL_FIXTURE,
  REFLECTIVE_QUESTION_V2_REQUIRED_CATEGORIES,
  REFLECTIVE_QUESTION_V2_SOURCE_FIXTURE,
  REFLECTIVE_QUESTION_V5_GATE_1_CASE_IDS,
  REFLECTIVE_QUESTION_V5_GATE_1_COST_CAP_USD,
  assertReflectiveQuestionV5Gate1Scope,
  assertReflectiveQuestionV2PaidScope,
  selectReflectiveQuestionV2BenchmarkCases,
  summarizeReflectiveQuestionV2Benchmark,
  type ReflectiveQuestionV2Fixture,
} from '../scripts/lib/reflectiveQuestionV2Benchmark';

const repoRoot = path.join(__dirname, '..');

describe('Reflective Questions v2 production benchmark', () => {
  const fixture = JSON.parse(
    readFileSync(path.join(repoRoot, REFLECTIVE_QUESTION_V2_SOURCE_FIXTURE), 'utf8')
  ) as ReflectiveQuestionV2Fixture;
  const multilingualFixture = JSON.parse(
    readFileSync(
      path.join(repoRoot, REFLECTIVE_QUESTION_V2_MULTILINGUAL_FIXTURE),
      'utf8'
    )
  ) as ReflectiveQuestionV2Fixture;

  it('freezes the bounded v5 adversarial gate before larger paid packets', () => {
    expect(REFLECTIVE_QUESTION_V5_GATE_1_CASE_IDS).toHaveLength(8);
    expect(REFLECTIVE_QUESTION_V5_GATE_1_COST_CAP_USD).toBe(0.15);
    expect(() => assertReflectiveQuestionV5Gate1Scope(
      REFLECTIVE_QUESTION_V5_GATE_1_CASE_IDS
    )).not.toThrow();
    expect(() => assertReflectiveQuestionV5Gate1Scope(['elevator-missing-button'])).toThrow(
      'exact ordered frozen adversarial eight'
    );
  });

  it('freezes 20 Greek cases plus 15 multilingual cases across all supported languages', () => {
    expect(fixture.source).toBe('synthetic');
    expect(multilingualFixture.source).toBe('synthetic');

    const selected = selectReflectiveQuestionV2BenchmarkCases(
      fixture,
      multilingualFixture
    );

    expect(selected.map((testCase) => testCase.id)).toEqual([
      ...REFLECTIVE_QUESTION_V2_BENCHMARK_CASE_IDS,
    ]);
    expect(selected).toHaveLength(35);
    expect(selected.filter((testCase) => testCase.language === 'el')).toHaveLength(20);
    expect(new Set(selected.map((testCase) => testCase.language)).size).toBe(12);
    expect(selected.filter((testCase) => testCase.length_band === 'short')).toHaveLength(19);
    expect(selected.filter((testCase) => testCase.length_band === 'medium')).toHaveLength(11);
    expect(selected.filter((testCase) => testCase.length_band === 'long')).toHaveLength(5);

    const categories = new Set(selected.flatMap((testCase) => testCase.categories));
    for (const category of REFLECTIVE_QUESTION_V2_REQUIRED_CATEGORIES) {
      expect(categories.has(category)).toBe(true);
    }
  });

  it('fails closed before a live run can accept a non-synthetic fixture', () => {
    expect(() =>
      selectReflectiveQuestionV2BenchmarkCases(
        fixture,
        { ...multilingualFixture, source: 'user_data' as 'synthetic' }
      )
    ).toThrow('accepts synthetic fixtures only');
  });

  it('caps paid iteration at half-size unless a full corpus is explicitly authorized', () => {
    expect(() =>
      assertReflectiveQuestionV2PaidScope({
        caseCount: 18,
        explicitFullRunApproval: false,
      })
    ).not.toThrow();
    expect(() =>
      assertReflectiveQuestionV2PaidScope({
        caseCount: 35,
        explicitFullRunApproval: false,
      })
    ).toThrow(/capped at 18/);
    expect(() =>
      assertReflectiveQuestionV2PaidScope({
        caseCount: 35,
        explicitFullRunApproval: true,
      })
    ).not.toThrow();
  });

  it('summarizes committed candidates, abstention, latency, and cost signals', () => {
    const summary = summarizeReflectiveQuestionV2Benchmark([
      {
        case_id: 'a',
        language: 'el',
        length_band: 'short',
        categories: ['ordinary_banal_low_affect'],
        artifact_status: 'question',
        outcome: 'committed_question',
        question_decision: 'question',
        final_question: 'Τι μένει ζωντανό στην εικόνα της άδειας στάσης;',
        output_language: 'el',
        technical_error: null,
        total_latency_ms: 1000,
        estimated_usd: 0.1,
      },
      {
        case_id: 'b',
        language: 'el',
        length_band: 'long',
        categories: ['meaningful_non_action_waiting_silence_absence'],
        artifact_status: 'question',
        outcome: 'committed_question',
        question_decision: 'question',
        final_question: 'Ποιο μέρος της σιωπής κρατά ακόμη ανοιχτή την πόρτα;',
        output_language: 'el',
        technical_error: null,
        total_latency_ms: 3000,
        estimated_usd: 0.2,
      },
      {
        case_id: 'c',
        language: 'en',
        length_band: 'medium',
        categories: ['contradictory_paradoxical'],
        artifact_status: 'abstained',
        outcome: 'semantic_abstention',
        question_decision: 'abstain',
        final_question: null,
        output_language: 'en',
        technical_error: null,
        total_latency_ms: 2000,
        estimated_usd: 0.05,
      },
    ]);

    expect(summary.total_cases).toBe(3);
    expect(summary.question_count).toBe(2);
    expect(summary.semantic_abstention_count).toBe(1);
    expect(summary.deterministic_validation_rejection_count).toBe(0);
    expect(summary.question_decisions).toEqual({
      question: 2,
      abstain: 1,
      not_run: 0,
    });
    expect(summary.latency_ms).toEqual({ p50: 2000, p95: 3000, maximum: 3000 });
    expect(summary.estimated_usd).toBe(0.35);
    expect(summary.committed_candidate_rate).toBe(1);
    expect(summary.output_language_mismatch_count).toBe(0);
  });

  it('requires human aliveness and desire-to-answer review beyond mechanical passing', () => {
    expect(REFLECTIVE_QUESTION_HUMAN_QUALITY_GATE.status).toBe(
      'pending_human_review'
    );
    expect(REFLECTIVE_QUESTION_HUMAN_QUALITY_GATE.dimensions).toEqual(
      expect.arrayContaining([
        'psychological_aliveness',
        'psychic_expansion',
        'human_pull',
        'genuine_desire_to_answer',
      ])
    );
    expect(REFLECTIVE_QUESTION_HUMAN_QUALITY_GATE.judgment).toBe(
      'preferable_to_abstain'
    );
  });

  it('keeps the production bounded runner on the frozen orchestration path', () => {
    const runner = readFileSync(
      path.join(
        repoRoot,
        'scripts/live/reflective-questions/run-production-pipeline-bounded-validation.ts'
      ),
      'utf8'
    );

    expect(runner).toContain('resolveProductionReflectiveQuestion');
    expect(runner).toContain('HOME_STANDARD_ID');
    expect(runner).toContain('ja-neon-home:standard');
    expect(runner).toContain('QUESTION_PREMISE_CHECK_BUNDLE_SHA256');
    expect(runner).toContain('ONEIROS_REFLECTIVE_QUESTION_PRODUCTION_VALIDATION_COST_APPROVED');
    expect(runner).not.toMatch(/run-active-candidate|postJungianInviter|postReadingInviter/);
  });
});
