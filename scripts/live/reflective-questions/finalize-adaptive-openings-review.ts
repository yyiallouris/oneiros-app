/** Deterministically reconciles the frozen blind review with sealed targets. */
import { createHash } from 'crypto';
import { readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { buildAdaptiveOpeningsInitialRequest } from '../../../src/ai/rd/reflective-questions/adaptiveOpeningsCandidate';
import {
  ADAPTIVE_OPENINGS_OBSERVER_VERSION,
  observeAdaptiveOpenings,
} from '../../../src/ai/rd/reflective-questions/adaptiveOpeningsObservation';

const ROOT = process.cwd();
const FIXTURE_PATH = path.join(
  ROOT,
  'testing/reflective-questions/adaptive-openings-feasibility-2026-08-29.json'
);
const ARTIFACT_DIR = path.join(
  ROOT,
  'testing/reflective-questions/artifacts/adaptive-openings-feasibility-2026-08-29'
);
const RAW_PATH = path.join(ARTIFACT_DIR, 'RAW_EVALUATION.json');
const BLIND_PATH = path.join(ARTIFACT_DIR, 'BLIND_HUMAN_VERDICTS.json');
const REVIEWED_PATH = path.join(ARTIFACT_DIR, 'REVIEWED_RESULTS.json');
const REPORT_PATH = path.join(ARTIFACT_DIR, 'REVIEW_REPORT.md');
const FIXTURE_SHA = '4b361245bc58ab7856d0ad48421f2b6f8c25a5d5e11fadb5275b83c6f1312d71';
const RAW_SHA = '9e1ffcea348430b153a2f9048cf73f38223df12293b5c75a9621d2f6c10e806f';
const BLIND_SHA = 'da938eeb6970a0a1c611f1ffdc2f47a837e06ba602ab72edc5cddf96f4452bcc';

type Surface = 'quick' | 'standard' | 'advanced';
type FixtureCase = {
  id: string;
  language: string;
  mode: 'standard' | 'advanced';
  cohort: 'enacted_only' | 'imaginal_only' | 'both' | 'ambiguous';
  title: string;
  dream: string;
  expected_standard_deeper: { decision: string; allowed_set: string[]; rationale: string };
  quick_expected_strongest: { decision: string; allowed_set: string[]; rationale: string };
};
type BlindVerdict = {
  generation_id: string;
  actual_opening_type?: string;
  strongest_single_opening_verdict?: string;
  actual_selection?: string;
  cardinality_type_product_verdict?: string;
  enacted_quality?: string;
  imaginal_quality?: string;
  complementarity?: string;
  restraint?: string;
  vitality_verdict: string;
  invented_fact_failure: string;
  structural_human_verdict: string;
  failure_families: string[];
  notes: string;
};

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function countBy(values: string[]): Record<string, number> {
  return values.reduce<Record<string, number>>((counts, value) => {
    counts[value] = (counts[value] ?? 0) + 1;
    return counts;
  }, {});
}

function main(): void {
  const fixtureRaw = readFileSync(FIXTURE_PATH, 'utf8');
  const rawText = readFileSync(RAW_PATH, 'utf8');
  const blindText = readFileSync(BLIND_PATH, 'utf8');
  if (
    sha256(fixtureRaw) !== FIXTURE_SHA ||
    sha256(rawText) !== RAW_SHA ||
    sha256(blindText) !== BLIND_SHA
  ) {
    throw new Error('Frozen adaptive-opening evidence hash drifted.');
  }

  const fixture = JSON.parse(fixtureRaw) as {
    fixture_id: string;
    candidate: { method_id: string; bundle_sha256: string };
    production_identity: Record<string, unknown>;
    acceptance_gate: Record<string, unknown>;
    cases: FixtureCase[];
  };
  const raw = JSON.parse(rawText) as {
    status: string;
    exact_cost_usd: number;
    results: Array<{
      generation_id: string;
      case_id: string;
      surface: Surface;
      after: null | {
        raw_model_output: string;
        output: string;
        questions: string[];
        adaptive_observation: { passed: boolean; issues: string[] };
      };
      operational_error?: string;
    }>;
  };
  const blind = JSON.parse(blindText) as {
    status: string;
    review_protocol: { targets_consulted_before_verdicts: boolean };
    results: BlindVerdict[];
  };
  if (
    raw.status !== 'complete' ||
    blind.status !== 'complete_blind_first' ||
    blind.review_protocol.targets_consulted_before_verdicts ||
    raw.results.length !== 20 ||
    blind.results.length !== 20
  ) {
    throw new Error('Incomplete blind-first evidence packet.');
  }

  const reconciled = raw.results.map((result) => {
    const dreamCase = fixture.cases.find((item) => item.id === result.case_id);
    const human = blind.results.find((item) => item.generation_id === result.generation_id);
    if (!dreamCase || !human || !result.after) {
      throw new Error(`Missing evidence for ${result.generation_id}.`);
    }
    const actual = result.surface === 'quick'
      ? human.actual_opening_type
      : human.actual_selection;
    const target = result.surface === 'quick'
      ? dreamCase.quick_expected_strongest
      : dreamCase.expected_standard_deeper;
    if (!actual) throw new Error(`Missing blind opening classification for ${result.generation_id}.`);
    const targetMatch = target.allowed_set.includes(actual);
    const request = buildAdaptiveOpeningsInitialRequest(
      { title: dreamCase.title, date: '2026-08-29', content: dreamCase.dream },
      result.surface
    );
    const replayedObservation = observeAdaptiveOpenings({
      content: result.after.raw_model_output,
      surface: result.surface,
      languageContext: request.reflectiveLanguageContext,
    });
    return {
      ...result,
      case_profile: dreamCase.cohort,
      pre_registered_target: target,
      blind_human_review: human,
      actual_opening_decision: actual,
      target_match: targetMatch,
      gate_decision_pass: result.surface === 'quick'
        ? targetMatch && human.strongest_single_opening_verdict === 'PASS'
        : targetMatch && human.cardinality_type_product_verdict === 'PASS',
      replayed_adaptive_observation: replayedObservation,
    };
  });

  const quick = reconciled.filter((item) => item.surface === 'quick');
  const full = reconciled.filter((item) => item.surface !== 'quick');
  const cohortSummary = Object.fromEntries(
    ['enacted_only', 'imaginal_only', 'both', 'ambiguous'].map((cohort) => {
      const cohortResults = full.filter((item) => item.case_profile === cohort);
      return [cohort, {
        pass: cohortResults.filter((item) => item.gate_decision_pass).length,
        total: cohortResults.length,
      }];
    })
  );
  const failureFamilyCounts = countBy(
    blind.results.flatMap((item) => item.failure_families)
  );
  failureFamilyCounts.fixed_two_cardinality_collapse = full.filter(
    (item) => item.after?.questions.length === 2
  ).length;
  const summary = {
    standard_advanced_gate_decisions: {
      pass: full.filter((item) => item.gate_decision_pass).length,
      fail: full.filter((item) => !item.gate_decision_pass).length,
      total: full.length,
      required_pass: 9,
    },
    quick_pre_registered_strongest_selection: {
      pass: quick.filter((item) => item.gate_decision_pass).length,
      fail: quick.filter((item) => !item.gate_decision_pass).length,
      total: quick.length,
      required_pass: 9,
    },
    quick_blind_quality_without_target_reconciliation: {
      pass: quick.filter(
        (item) => item.blind_human_review.strongest_single_opening_verdict === 'PASS'
      ).length,
      total: quick.length,
    },
    cohort_results: cohortSummary,
    full_outputs_returning_two_questions: full.filter(
      (item) => item.after?.questions.length === 2
    ).length,
    full_outputs_returning_one_question: full.filter(
      (item) => item.after?.questions.length === 1
    ).length,
    strong_complementarity: {
      pass: full.filter((item) => item.blind_human_review.complementarity === 'PASS').length,
      fail: full.filter((item) => item.blind_human_review.complementarity === 'FAIL').length,
    },
    serious_invented_fact_or_premise_failures: blind.results.filter(
      (item) => item.invented_fact_failure === 'SERIOUS_FAIL'
    ).length,
    serious_vitality_failures: blind.results.filter(
      (item) => item.vitality_verdict === 'SERIOUS_FAIL'
    ).length,
    structural_observer_at_generation: {
      pass: raw.results.filter((item) => item.after?.adaptive_observation.passed).length,
      fail: raw.results.filter((item) => !item.after?.adaptive_observation.passed).length,
      note: 'Three false positives: English of/NL disjunction collision and two native Japanese か。 interrogative shapes.',
    },
    structural_observer_replay_v011: {
      version: ADAPTIVE_OPENINGS_OBSERVER_VERSION,
      pass: reconciled.filter((item) => item.replayed_adaptive_observation.passed).length,
      fail: reconciled.filter((item) => !item.replayed_adaptive_observation.passed).length,
    },
    structural_human: {
      pass: blind.results.filter((item) => item.structural_human_verdict === 'PASS').length,
      fail: blind.results.filter((item) => item.structural_human_verdict !== 'PASS').length,
    },
    failure_family_counts: failureFamilyCounts,
    exact_cost_usd: raw.exact_cost_usd,
    recommendation_under_original_gate: 'PARK_FOR_ONEIROS_V2',
    current_disposition: 'SHOT_1_HOLD_OWNER_AUTHORIZED_MAX_3_SHOTS',
    stop_condition: 'MAX_3_TOTAL_SHOTS_NO_DEPLOY',
  };

  const reviewed = {
    schema_version: 1,
    status: 'complete',
    fixture_id: fixture.fixture_id,
    fixture_sha256: FIXTURE_SHA,
    raw_artifact_sha256: RAW_SHA,
    blind_verdicts_sha256: BLIND_SHA,
    candidate_method: fixture.candidate.method_id,
    candidate_sha256: fixture.candidate.bundle_sha256,
    production_identity_unchanged: fixture.production_identity,
    exact_cost_usd: raw.exact_cost_usd,
    calls: 20,
    retries: 0,
    blind_first_review: true,
    acceptance_gate: fixture.acceptance_gate,
    human_summary: summary,
    results: reconciled,
  };
  writeFileSync(REVIEWED_PATH, `${JSON.stringify(reviewed, null, 2)}\n`);

  const rows = fixture.cases.map((dreamCase) => {
    const q = reconciled.find(
      (item) => item.case_id === dreamCase.id && item.surface === 'quick'
    );
    const f = reconciled.find(
      (item) => item.case_id === dreamCase.id && item.surface !== 'quick'
    );
    return `| ${dreamCase.id} | ${q?.actual_opening_decision} | ${q?.target_match ? 'PASS' : 'FAIL'} | ${f?.actual_opening_decision} | ${f?.gate_decision_pass ? 'PASS' : 'FAIL'} |`;
  });
  const report = [
    '# Adaptive Reflective Openings — one-shot feasibility review',
    '',
    `Candidate: \`${fixture.candidate.method_id}\` / \`${fixture.candidate.bundle_sha256}\``,
    `Fixture: \`${fixture.fixture_id}\` / \`${FIXTURE_SHA}\``,
    `Exact cost: \`$${raw.exact_cost_usd.toFixed(8)}\``,
    '',
    '## Decision',
    '',
    '**SHOT 1: HOLD. Under the original one-shot gate this result means PARK FOR ONEIROS V2. The owner subsequently authorized a bounded maximum of three total shots. Do not deploy.**',
    '',
    'The idea preserved vitality, and Quick produced strong single openings. The full Reader, however, returned two questions in all 10/10 cases. It therefore failed the central adaptive-cardinality hypothesis rather than merely missing an edge case.',
    '',
    '## Gate',
    '',
    `- Standard/Advanced decision match: **${summary.standard_advanced_gate_decisions.pass}/10** (required 9/10).`,
    `- Quick pre-registered strongest match: **${summary.quick_pre_registered_strongest_selection.pass}/10** (required 9/10); blind quality alone was 10/10, with two target-adjudication disagreements.`,
    `- Clear enacted-only: **${cohortSummary.enacted_only.pass}/2**.`,
    `- Clear imaginal-only: **${cohortSummary.imaginal_only.pass}/2**.`,
    `- Clear both-earned: **${cohortSummary.both.pass}/4**.`,
    `- Ambiguous allowed-set: **${cohortSummary.ambiguous.pass}/2**.`,
    `- Serious invented fact/premise failures: **${summary.serious_invented_fact_or_premise_failures}** (allowed 0).`,
    `- Serious vitality failures: **${summary.serious_vitality_failures}**.`,
    `- Strong complementarity: **${summary.strong_complementarity.pass}/10** two-question outputs.`,
    `- R&D observer v0.1.1 replay: **${summary.structural_observer_replay_v011.pass}/20 PASS**; no model output was repaired.`,
    '',
    '## Root cause',
    '',
    'The model treated the unchanged numbered `Question 1` and `Question 2` composition grammars as mandatory slots. The adaptive prose did not override that stronger format prior. In single-opening dreams it then manufactured an enacted transition/relation or produced a weaker second abstraction instead of stopping.',
    '',
    'This is selection-architecture pressure, not evidence that more prohibitions are needed. The only authorized Shot 2 delta is neutral, non-numbered composition jobs plus a private cardinality decision. Shot 3 is conditional rather than automatic, and the line closes after three total shots.',
    '',
    '## Case reconciliation',
    '',
    '| Case | Quick actual | Quick target | Full actual | Full gate |',
    '|---|---|---:|---|---:|',
    ...rows,
    '',
    '## Structural observer note',
    '',
    'The generation-time v0.1.0 observer reported 17/20 because the production shadow scan read English `of` as Dutch disjunction and did not recognize native Japanese questions ending in `か。`. R&D-only v0.1.1 replay corrected those deterministic observer limitations and returned 20/20 structural PASS. Prompt bytes, model outputs, and production validation were unchanged.',
    '',
    '## Production boundary',
    '',
    'Canonical production remains v1.0.3 / `f5399a4973fb84365a25967890169fc2475cb2e2a9f65f0dffd2a8993101d9e7`, structure normalizer v1.0.0, runtime bundle v1.0.3+structure-v1.0.0, gateway v113. No deployment or database change occurred.',
  ].join('\n');
  writeFileSync(REPORT_PATH, `${report}\n`);
}

main();
