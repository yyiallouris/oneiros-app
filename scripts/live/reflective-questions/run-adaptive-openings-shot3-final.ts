/** Final Shot 3/3: minimum-sufficient full-Reader selection; no Quick calls. */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';
import {
  SAME_CALL_REFLECTIVE_QUESTIONS_BUNDLE,
  SAME_CALL_REFLECTIVE_QUESTIONS_METHOD_ID,
  type DreamReflectionInput,
} from '../../../src/ai/dreamReflectionPrompt';
import {
  ADAPTIVE_OPENINGS_SHOT3_BUNDLE,
  ADAPTIVE_OPENINGS_SHOT3_BUNDLE_SHA256,
  ADAPTIVE_OPENINGS_SHOT3_FULL_INSTRUCTION,
  ADAPTIVE_OPENINGS_SHOT3_METHOD_ID,
  ADAPTIVE_OPENINGS_SHOT3_READER_PROMPT_ID,
  buildAdaptiveOpeningsShot3Request,
} from '../../../src/ai/rd/reflective-questions/adaptiveOpeningsShot3Candidate';
import { buildAdaptiveOpeningsShot2Request } from '../../../src/ai/rd/reflective-questions/adaptiveOpeningsShot2Candidate';
import { observeAdaptiveOpenings } from '../../../src/ai/rd/reflective-questions/adaptiveOpeningsObservation';
import {
  APPROVED_REFLECTIVE_QUESTION_PRODUCTION,
  SAME_CALL_REFLECTIVE_QUESTIONS_BUNDLE_SHA256,
  hashReflectiveQuestionPrompt,
} from '../../../src/ai/reflectiveQuestionProductionHold';
import {
  getAccessToken,
  getEnv,
  proxyCall,
  requestFingerprint,
  sha256,
  stripMarker,
} from './run-adaptive-openings-feasibility';

const MANIFEST_PATH = path.join(
  process.cwd(),
  'testing/reflective-questions/adaptive-openings-shot3-final-2026-08-29.json'
);
const MANIFEST_SHA = '48dd4a0066c3579bc20a4400680dd76843d2f85a27d299947636fb992d762b03';
const FIXTURE_PATH = path.join(
  process.cwd(),
  'testing/reflective-questions/adaptive-openings-feasibility-2026-08-29.json'
);
const FIXTURE_SHA = '4b361245bc58ab7856d0ad48421f2b6f8c25a5d5e11fadb5275b83c6f1312d71';
const SHOT2_REVIEWED_PATH = path.join(
  process.cwd(),
  'testing/reflective-questions/artifacts/adaptive-openings-shot2-2026-08-29/REVIEWED_RESULTS.json'
);
const SHOT2_REVIEWED_SHA = '45c8450d19fd6db3ce5e45b8cb2c0c7660867f4af07eb21b36217c0c20e3abc2';
const OUTPUT_DIR = path.join(
  process.cwd(),
  'testing/reflective-questions/artifacts/adaptive-openings-shot3-final-2026-08-29'
);
const RAW_PATH = path.join(OUTPUT_DIR, 'RAW_EVALUATION.json');
const REVIEW_PACKET_PATH = path.join(OUTPUT_DIR, 'HUMAN_REVIEW_PACKET.md');
const APPROVAL_ENV = 'ONEIROS_ADAPTIVE_OPENINGS_SHOT3_COST_APPROVED';
const CUMULATIVE_CAP_USD = 1;
const PRIOR_SHOT2_SPEND_USD = 0.225755;
const EXPECTED_CALLS = 10;
const RESERVE_BY_SURFACE = { standard: 0.03, advanced: 0.04 } as const;

type FixtureCase = {
  id: string;
  language: string;
  mode: 'standard' | 'advanced';
  cohort: string;
  title: string;
  dream: string;
  expected_standard_deeper: { allowed_set: string[]; rationale: string };
};

function reviewPacket(params: {
  cost: number;
  cumulativeCost: number;
  cases: FixtureCase[];
  results: Array<Record<string, unknown>>;
  shot2: Array<Record<string, unknown>>;
}): string {
  return [
    '# Adaptive Reflective Openings — final Shot 3 human review',
    '',
    `Candidate: \`${ADAPTIVE_OPENINGS_SHOT3_METHOD_ID}\` / \`${ADAPTIVE_OPENINGS_SHOT3_BUNDLE_SHA256}\``,
    `Exact Shot 3 cost: \`$${params.cost.toFixed(8)}\``,
    `Cumulative Shot 2 + Shot 3 cost: \`$${params.cumulativeCost.toFixed(8)} / $1.00\``,
    '',
    'This is the final shot. Review target decision, question quality, complementarity, restraint, vitality, grounding, and answer-menu behavior. No reruns or fourth candidate.',
    '',
    ...params.results.flatMap((result) => {
      const dreamCase = params.cases.find((item) => item.id === result.case_id);
      const prior = params.shot2.find((item) => item.generation_id === result.generation_id) as {
        after?: { output?: string };
      } | undefined;
      const after = result.after as { output?: string } | null;
      return [
        `## ${String(result.generation_id)}`,
        '',
        `Profile: \`${dreamCase?.cohort}\``,
        `Pre-registered allowed target: \`${dreamCase?.expected_standard_deeper.allowed_set.join(' | ')}\``,
        `Target rationale: ${dreamCase?.expected_standard_deeper.rationale}`,
        '',
        '### Dream',
        '~~~text',
        String(result.dream),
        '~~~',
        '',
        '### Shot 2',
        '~~~text',
        prior?.after?.output ?? '[missing]',
        '~~~',
        '',
        '### Final Shot 3',
        '~~~text',
        after?.output ?? `[operational error: ${String(result.operational_error ?? 'unknown')}]`,
        '~~~',
        '',
        'Actual selection / target / product / complementarity / restraint / vitality / invention-menu: PENDING',
        'Failure families and notes: PENDING',
        '',
      ];
    }),
  ].join('\n');
}

async function main(): Promise<void> {
  const manifestRaw = readFileSync(MANIFEST_PATH, 'utf8');
  const fixtureRaw = readFileSync(FIXTURE_PATH, 'utf8');
  const shot2Raw = readFileSync(SHOT2_REVIEWED_PATH, 'utf8');
  if (
    sha256(manifestRaw) !== MANIFEST_SHA ||
    sha256(fixtureRaw) !== FIXTURE_SHA ||
    sha256(shot2Raw) !== SHOT2_REVIEWED_SHA
  ) {
    throw new Error('Frozen final Shot 3 inputs drifted.');
  }
  const manifest = JSON.parse(manifestRaw) as {
    candidate: { method_id: string; bundle_sha256: string; reader_prompt_id: string };
    scope: { planned_calls: number; quick_calls: number };
    cumulative_budget_from_shot_2: {
      hard_cap_usd: number;
      exact_spend_before_shot_3_usd: number;
      remaining_before_shot_3_usd: number;
      shot_3_reserved_packet_usd: number;
    };
    gate: { absolute_stop_after_this_shot: boolean; no_fourth_candidate: boolean };
  };
  const fixture = JSON.parse(fixtureRaw) as { cases: FixtureCase[] };
  const shot2 = JSON.parse(shot2Raw) as {
    human_summary: { exact_shot_2_cost_usd: number };
    results: Array<Record<string, unknown>>;
  };
  if (
    manifest.candidate.method_id !== ADAPTIVE_OPENINGS_SHOT3_METHOD_ID ||
    manifest.candidate.bundle_sha256 !== ADAPTIVE_OPENINGS_SHOT3_BUNDLE_SHA256 ||
    manifest.candidate.reader_prompt_id !== ADAPTIVE_OPENINGS_SHOT3_READER_PROMPT_ID ||
    hashReflectiveQuestionPrompt(ADAPTIVE_OPENINGS_SHOT3_BUNDLE) !==
      ADAPTIVE_OPENINGS_SHOT3_BUNDLE_SHA256 ||
    String(SAME_CALL_REFLECTIVE_QUESTIONS_METHOD_ID) !==
      APPROVED_REFLECTIVE_QUESTION_PRODUCTION.methodId ||
    hashReflectiveQuestionPrompt(SAME_CALL_REFLECTIVE_QUESTIONS_BUNDLE) !==
      SAME_CALL_REFLECTIVE_QUESTIONS_BUNDLE_SHA256 ||
    SAME_CALL_REFLECTIVE_QUESTIONS_BUNDLE_SHA256 !==
      APPROVED_REFLECTIVE_QUESTION_PRODUCTION.promptSha256 ||
    !manifest.gate.absolute_stop_after_this_shot ||
    !manifest.gate.no_fourth_candidate
  ) {
    throw new Error('Final Shot 3 candidate, stop condition, or production identity drifted.');
  }
  const quickParityDream: DreamReflectionInput = {
    title: fixture.cases[0]?.title ?? 'Quick parity',
    date: '2026-08-29',
    content: fixture.cases[0]?.dream ?? 'A chair returned.',
  };
  if (
    JSON.stringify(buildAdaptiveOpeningsShot3Request(quickParityDream, 'quick')) !==
      JSON.stringify(buildAdaptiveOpeningsShot2Request(quickParityDream, 'quick'))
  ) {
    throw new Error('Shot 3 Quick bytes drifted from Shot 2; no-call reuse is invalid.');
  }
  if (/Question [12]/u.test(ADAPTIVE_OPENINGS_SHOT3_FULL_INSTRUCTION)) {
    throw new Error('Numbered composition slots leaked into final Shot 3.');
  }
  const entries = fixture.cases.map((item) => ({
    generationId: `${item.id}:reading_${item.mode}`,
    caseId: item.id,
    language: item.language,
    surface: item.mode,
    title: item.title,
    dream: item.dream,
  }));
  const reservedPacket = entries.reduce(
    (sum, item) => sum + RESERVE_BY_SURFACE[item.surface],
    0
  );
  if (
    entries.length !== EXPECTED_CALLS ||
    manifest.scope.planned_calls !== EXPECTED_CALLS ||
    manifest.scope.quick_calls !== 0 ||
    shot2.human_summary.exact_shot_2_cost_usd !== PRIOR_SHOT2_SPEND_USD ||
    manifest.cumulative_budget_from_shot_2.hard_cap_usd !== CUMULATIVE_CAP_USD ||
    manifest.cumulative_budget_from_shot_2.exact_spend_before_shot_3_usd !==
      PRIOR_SHOT2_SPEND_USD ||
    Math.abs(
      manifest.cumulative_budget_from_shot_2.remaining_before_shot_3_usd -
      (CUMULATIVE_CAP_USD - PRIOR_SHOT2_SPEND_USD)
    ) > 1e-9 ||
    Math.abs(
      manifest.cumulative_budget_from_shot_2.shot_3_reserved_packet_usd - reservedPacket
    ) > 1e-9 ||
    PRIOR_SHOT2_SPEND_USD + reservedPacket > CUMULATIVE_CAP_USD
  ) {
    throw new Error('Final Shot 3 packet or cumulative budget preflight failed.');
  }
  const preflight = {
    shot: 3,
    final_shot: true,
    candidate_method: ADAPTIVE_OPENINGS_SHOT3_METHOD_ID,
    candidate_sha256: ADAPTIVE_OPENINGS_SHOT3_BUNDLE_SHA256,
    manifest_sha256: MANIFEST_SHA,
    fixture_sha256: FIXTURE_SHA,
    shot_2_reviewed_sha256: SHOT2_REVIEWED_SHA,
    calls: entries.length,
    quick_calls_reused_without_model_call: 10,
    prior_shot_2_spend_usd: PRIOR_SHOT2_SPEND_USD,
    reserved_shot_3_packet_usd: reservedPacket,
    cumulative_cap_usd: CUMULATIVE_CAP_USD,
    retries: 0,
    semantic_judges: 0,
    repairs_or_reranking: 0,
    deploys: 0,
    fourth_candidate_permitted: false,
  };
  if (process.argv.includes('--preflight')) {
    process.stdout.write(`${JSON.stringify(preflight, null, 2)}\n`);
    return;
  }
  if (process.env[APPROVAL_ENV] !== '1') {
    throw new Error(`Paid run locked. Set ${APPROVAL_ENV}=1 only after explicit approval.`);
  }
  if (existsSync(RAW_PATH)) throw new Error('Final Shot 3 artifact exists; no rerun permitted.');

  const supabaseUrl = getEnv(['EXPO_PUBLIC_SUPABASE_URL', 'SUPABASE_URL']).replace(/\/$/u, '');
  const anonKey = getEnv(['EXPO_PUBLIC_SUPABASE_ANON_KEY', 'SUPABASE_ANON_KEY']);
  if (!supabaseUrl || !anonKey) throw new Error('Missing Supabase URL/anon key.');
  const token = await getAccessToken(supabaseUrl, anonKey);
  const endpoint = `${supabaseUrl}/functions/v1/openai-proxy`;
  const results: Array<Record<string, unknown>> = [];
  const startedAt = new Date().toISOString();
  let shot3Spend = 0;
  mkdirSync(OUTPUT_DIR, { recursive: true });
  const persist = (status: 'in_progress' | 'complete'): void => {
    writeFileSync(RAW_PATH, `${JSON.stringify({
      ...preflight,
      status,
      started_at: startedAt,
      completed_at: status === 'complete' ? new Date().toISOString() : null,
      exact_shot_3_cost_usd: Number(shot3Spend.toFixed(8)),
      cumulative_shot_2_shot_3_cost_usd: Number(
        (PRIOR_SHOT2_SPEND_USD + shot3Spend).toFixed(8)
      ),
      results,
    }, null, 2)}\n`);
  };
  persist('in_progress');

  for (const entry of entries) {
    if (
      PRIOR_SHOT2_SPEND_USD + shot3Spend + RESERVE_BY_SURFACE[entry.surface] >
      CUMULATIVE_CAP_USD
    ) {
      throw new Error('Cumulative Shot 2 + Shot 3 budget guard stopped before call.');
    }
    const dream: DreamReflectionInput = {
      title: entry.title,
      date: '2026-08-29',
      content: entry.dream,
    };
    const request = buildAdaptiveOpeningsShot3Request(dream, entry.surface);
    try {
      const call = await proxyCall({ endpoint, anonKey, token, request });
      const observation = observeAdaptiveOpenings({
        content: call.content,
        surface: entry.surface,
        languageContext: request.reflectiveLanguageContext,
      });
      shot3Spend += call.cost.estimatedUsd ?? 0;
      results.push({
        generation_id: entry.generationId,
        case_id: entry.caseId,
        language: entry.language,
        surface: entry.surface,
        title: entry.title,
        dream: entry.dream,
        request_fingerprint_sha256: requestFingerprint(request),
        after: {
          raw_model_output: call.content,
          output: stripMarker(call.content),
          questions: observation.questions,
          adaptive_observation: observation,
        },
        provider: call.provider,
        model: call.model,
        latency_ms: call.latencyMs,
        estimated_usd: call.cost.estimatedUsd,
        human_review: 'PENDING_FINAL_REVIEW',
      });
      process.stdout.write(
        `${results.length}/${entries.length} ${entry.generationId} ` +
        `${observation.passed ? 'structure_PASS' : 'structure_FAIL'} ` +
        `shot3=$${shot3Spend.toFixed(8)} cumulative=$${(
          PRIOR_SHOT2_SPEND_USD + shot3Spend
        ).toFixed(8)}\n`
      );
    } catch (error) {
      results.push({
        generation_id: entry.generationId,
        case_id: entry.caseId,
        language: entry.language,
        surface: entry.surface,
        title: entry.title,
        dream: entry.dream,
        after: null,
        operational_error: error instanceof Error ? error.message : 'unknown_operational_error',
        human_review: 'NOT_RUN_OPERATIONAL_ERROR_NO_RETRY',
      });
      process.stdout.write(`${results.length}/${entries.length} ${entry.generationId} operational_error\n`);
    }
    persist('in_progress');
  }
  persist('complete');
  writeFileSync(REVIEW_PACKET_PATH, `${reviewPacket({
    cost: shot3Spend,
    cumulativeCost: PRIOR_SHOT2_SPEND_USD + shot3Spend,
    cases: fixture.cases,
    results,
    shot2: shot2.results,
  })}\n`);
  process.stdout.write(
    `Artifacts: ${OUTPUT_DIR}\nFinal Shot 3 cost: $${shot3Spend.toFixed(8)}; ` +
    `cumulative: $${(PRIOR_SHOT2_SPEND_USD + shot3Spend).toFixed(8)} / $1.00\n`
  );
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
