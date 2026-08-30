/** Shot 2/3: neutral composition jobs plus one private route decision. */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';
import {
  END_MARKER_DREAM_READING,
  SAME_CALL_REFLECTIVE_QUESTIONS_BUNDLE,
  SAME_CALL_REFLECTIVE_QUESTIONS_METHOD_ID,
  type DreamReflectionDepth,
  type DreamReflectionInput,
} from '../../../src/ai/dreamReflectionPrompt';
import {
  ADAPTIVE_OPENINGS_SHOT2_BUNDLE,
  ADAPTIVE_OPENINGS_SHOT2_BUNDLE_SHA256,
  ADAPTIVE_OPENINGS_SHOT2_FULL_INSTRUCTION,
  ADAPTIVE_OPENINGS_SHOT2_METHOD_ID,
  ADAPTIVE_OPENINGS_SHOT2_READER_PROMPT_ID,
  ADAPTIVE_OPENINGS_SHOT2_QUICK_INSTRUCTION,
  buildAdaptiveOpeningsShot2Request,
} from '../../../src/ai/rd/reflective-questions/adaptiveOpeningsShot2Candidate';
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
  'testing/reflective-questions/adaptive-openings-shot2-2026-08-29.json'
);
const MANIFEST_SHA = '8bcbf82848d6ebec1217817e30a87a5378cd12fdd432e62bb2d3765a76a19245';
const FIXTURE_PATH = path.join(
  process.cwd(),
  'testing/reflective-questions/adaptive-openings-feasibility-2026-08-29.json'
);
const FIXTURE_SHA = '4b361245bc58ab7856d0ad48421f2b6f8c25a5d5e11fadb5275b83c6f1312d71';
const SHOT1_REVIEWED_PATH = path.join(
  process.cwd(),
  'testing/reflective-questions/artifacts/adaptive-openings-feasibility-2026-08-29/REVIEWED_RESULTS.json'
);
const SHOT1_REVIEWED_SHA = '2d7b7ee34b6bfdd8a68294df1eeb7fe77ab639d0512ab92e07df707e0063d850';
const OUTPUT_DIR = path.join(
  process.cwd(),
  'testing/reflective-questions/artifacts/adaptive-openings-shot2-2026-08-29'
);
const RAW_PATH = path.join(OUTPUT_DIR, 'RAW_EVALUATION.json');
const REVIEW_PACKET_PATH = path.join(OUTPUT_DIR, 'HUMAN_REVIEW_PACKET.md');
const APPROVAL_ENV = 'ONEIROS_ADAPTIVE_OPENINGS_SHOT2_COST_APPROVED';
const CUMULATIVE_SHOT2_SHOT3_CAP_USD = 1;
const EXPECTED_CALLS = 20;
const RESERVE_BY_SURFACE: Record<DreamReflectionDepth, number> = {
  quick: 0.02,
  standard: 0.03,
  advanced: 0.04,
};

type FixtureCase = {
  id: string;
  language: string;
  mode: 'standard' | 'advanced';
  cohort: string;
  title: string;
  dream: string;
  expected_standard_deeper: { allowed_set: string[]; rationale: string };
  quick_expected_strongest: { allowed_set: string[]; rationale: string };
};
type Entry = {
  generationId: string;
  caseId: string;
  language: string;
  surface: DreamReflectionDepth;
  title: string;
  dream: string;
};

function entriesFor(cases: FixtureCase[]): Entry[] {
  return cases.flatMap((item) => [
    {
      generationId: `${item.id}:reading_quick`,
      caseId: item.id,
      language: item.language,
      surface: 'quick' as const,
      title: item.title,
      dream: item.dream,
    },
    {
      generationId: `${item.id}:reading_${item.mode}`,
      caseId: item.id,
      language: item.language,
      surface: item.mode,
      title: item.title,
      dream: item.dream,
    },
  ]);
}

function reviewPacket(params: {
  cost: number;
  cases: FixtureCase[];
  results: Array<Record<string, unknown>>;
  shot1: Array<Record<string, unknown>>;
}): string {
  return [
    '# Adaptive Reflective Openings — Shot 2 human review',
    '',
    `Candidate: \`${ADAPTIVE_OPENINGS_SHOT2_METHOD_ID}\` / \`${ADAPTIVE_OPENINGS_SHOT2_BUNDLE_SHA256}\``,
    `Exact Shot 2 cost: \`$${params.cost.toFixed(8)}\``,
    '',
    'Review selection, restraint, vitality, grounding, and complementarity. No model output may be rerun.',
    '',
    ...params.results.flatMap((result) => {
      const dreamCase = params.cases.find((item) => item.id === result.case_id);
      const before = params.shot1.find((item) => item.generation_id === result.generation_id) as {
        after?: { output?: string };
      } | undefined;
      const after = result.after as { output?: string } | null;
      const isQuick = result.surface === 'quick';
      const target = isQuick
        ? dreamCase?.quick_expected_strongest
        : dreamCase?.expected_standard_deeper;
      return [
        `## ${String(result.generation_id)}`,
        '',
        `Pre-registered allowed target: \`${target?.allowed_set.join(' | ')}\``,
        `Target rationale: ${target?.rationale}`,
        '',
        '### Dream',
        '~~~text',
        String(result.dream),
        '~~~',
        '',
        '### Shot 1',
        '~~~text',
        before?.after?.output ?? '[missing]',
        '~~~',
        '',
        '### Shot 2',
        '~~~text',
        after?.output ?? `[operational error: ${String(result.operational_error ?? 'unknown')}]`,
        '~~~',
        '',
        isQuick
          ? 'Actual type / strongest / vitality / invention: PENDING'
          : 'Actual selection / product decision / complementarity / restraint / vitality / invention: PENDING',
        'Failure families and notes: PENDING',
        '',
      ];
    }),
  ].join('\n');
}

async function main(): Promise<void> {
  const manifestRaw = readFileSync(MANIFEST_PATH, 'utf8');
  const fixtureRaw = readFileSync(FIXTURE_PATH, 'utf8');
  const shot1Raw = readFileSync(SHOT1_REVIEWED_PATH, 'utf8');
  if (
    sha256(manifestRaw) !== MANIFEST_SHA ||
    sha256(fixtureRaw) !== FIXTURE_SHA ||
    sha256(shot1Raw) !== SHOT1_REVIEWED_SHA
  ) {
    throw new Error('Frozen Shot 2 inputs drifted.');
  }
  const manifest = JSON.parse(manifestRaw) as {
    candidate: { method_id: string; bundle_sha256: string; reader_prompt_id: string };
    cumulative_budget_from_shot_2: {
      hard_cap_usd: number;
      reserve_by_surface_usd: Record<DreamReflectionDepth, number>;
      shot_2_reserved_packet_usd: number;
    };
  };
  const fixture = JSON.parse(fixtureRaw) as { cases: FixtureCase[] };
  const shot1 = JSON.parse(shot1Raw) as {
    candidate_sha256: string;
    results: Array<Record<string, unknown>>;
  };
  if (
    manifest.candidate.method_id !== ADAPTIVE_OPENINGS_SHOT2_METHOD_ID ||
    manifest.candidate.bundle_sha256 !== ADAPTIVE_OPENINGS_SHOT2_BUNDLE_SHA256 ||
    manifest.candidate.reader_prompt_id !== ADAPTIVE_OPENINGS_SHOT2_READER_PROMPT_ID ||
    hashReflectiveQuestionPrompt(ADAPTIVE_OPENINGS_SHOT2_BUNDLE) !==
      ADAPTIVE_OPENINGS_SHOT2_BUNDLE_SHA256 ||
    String(SAME_CALL_REFLECTIVE_QUESTIONS_METHOD_ID) !==
      APPROVED_REFLECTIVE_QUESTION_PRODUCTION.methodId ||
    hashReflectiveQuestionPrompt(SAME_CALL_REFLECTIVE_QUESTIONS_BUNDLE) !==
      SAME_CALL_REFLECTIVE_QUESTIONS_BUNDLE_SHA256 ||
    SAME_CALL_REFLECTIVE_QUESTIONS_BUNDLE_SHA256 !==
      APPROVED_REFLECTIVE_QUESTION_PRODUCTION.promptSha256
  ) {
    throw new Error('Shot 2 candidate or production identity drifted.');
  }
  if (
    ADAPTIVE_OPENINGS_SHOT2_QUICK_INSTRUCTION.includes('Question 1') ||
    ADAPTIVE_OPENINGS_SHOT2_QUICK_INSTRUCTION.includes('Question 2') ||
    ADAPTIVE_OPENINGS_SHOT2_FULL_INSTRUCTION.includes('Question 1') ||
    ADAPTIVE_OPENINGS_SHOT2_FULL_INSTRUCTION.includes('Question 2')
  ) {
    throw new Error('Numbered composition-slot bias remains in Shot 2.');
  }
  const entries = entriesFor(fixture.cases);
  const reservedPacket = entries.reduce(
    (sum, entry) => sum + RESERVE_BY_SURFACE[entry.surface],
    0
  );
  if (
    entries.length !== EXPECTED_CALLS ||
    manifest.cumulative_budget_from_shot_2.hard_cap_usd !==
      CUMULATIVE_SHOT2_SHOT3_CAP_USD ||
    JSON.stringify(manifest.cumulative_budget_from_shot_2.reserve_by_surface_usd) !==
      JSON.stringify(RESERVE_BY_SURFACE) ||
    Math.abs(reservedPacket - manifest.cumulative_budget_from_shot_2.shot_2_reserved_packet_usd) > 1e-9 ||
    reservedPacket > CUMULATIVE_SHOT2_SHOT3_CAP_USD
  ) {
    throw new Error('Shot 2 packet or cumulative budget preflight failed.');
  }
  const preflight = {
    shot: 2,
    candidate_method: ADAPTIVE_OPENINGS_SHOT2_METHOD_ID,
    candidate_sha256: ADAPTIVE_OPENINGS_SHOT2_BUNDLE_SHA256,
    manifest_sha256: MANIFEST_SHA,
    fixture_sha256: FIXTURE_SHA,
    shot_1_reviewed_sha256: SHOT1_REVIEWED_SHA,
    calls: entries.length,
    reserved_packet_usd: reservedPacket,
    cumulative_shot_2_shot_3_cap_usd: CUMULATIVE_SHOT2_SHOT3_CAP_USD,
    retries: 0,
    semantic_judges: 0,
    repairs_or_reranking: 0,
    deploys: 0,
  };
  if (process.argv.includes('--preflight')) {
    process.stdout.write(`${JSON.stringify(preflight, null, 2)}\n`);
    return;
  }
  if (process.env[APPROVAL_ENV] !== '1') {
    throw new Error(`Paid run locked. Set ${APPROVAL_ENV}=1 only after explicit approval.`);
  }
  if (existsSync(RAW_PATH)) throw new Error('Shot 2 artifact exists; no rerun permitted.');

  const supabaseUrl = getEnv(['EXPO_PUBLIC_SUPABASE_URL', 'SUPABASE_URL']).replace(/\/$/u, '');
  const anonKey = getEnv(['EXPO_PUBLIC_SUPABASE_ANON_KEY', 'SUPABASE_ANON_KEY']);
  if (!supabaseUrl || !anonKey) throw new Error('Missing Supabase URL/anon key.');
  const token = await getAccessToken(supabaseUrl, anonKey);
  const endpoint = `${supabaseUrl}/functions/v1/openai-proxy`;
  const results: Array<Record<string, unknown>> = [];
  const startedAt = new Date().toISOString();
  let spend = 0;
  mkdirSync(OUTPUT_DIR, { recursive: true });
  const persist = (status: 'in_progress' | 'complete'): void => {
    writeFileSync(RAW_PATH, `${JSON.stringify({
      ...preflight,
      status,
      started_at: startedAt,
      completed_at: status === 'complete' ? new Date().toISOString() : null,
      exact_shot_2_cost_usd: Number(spend.toFixed(8)),
      cumulative_cost_from_shot_2_usd: Number(spend.toFixed(8)),
      results,
    }, null, 2)}\n`);
  };
  persist('in_progress');

  for (const entry of entries) {
    if (spend + RESERVE_BY_SURFACE[entry.surface] > CUMULATIVE_SHOT2_SHOT3_CAP_USD) {
      throw new Error('Cumulative budget guard stopped before Shot 2 call.');
    }
    const dream: DreamReflectionInput = {
      title: entry.title,
      date: '2026-08-29',
      content: entry.dream,
    };
    const request = buildAdaptiveOpeningsShot2Request(dream, entry.surface);
    try {
      const call = await proxyCall({ endpoint, anonKey, token, request });
      const observation = observeAdaptiveOpenings({
        content: call.content,
        surface: entry.surface,
        languageContext: request.reflectiveLanguageContext,
      });
      spend += call.cost.estimatedUsd ?? 0;
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
        human_review: 'PENDING',
      });
      process.stdout.write(
        `${results.length}/${entries.length} ${entry.generationId} ` +
        `${observation.passed ? 'structure_PASS' : 'structure_FAIL'} ` +
        `$${spend.toFixed(8)}\n`
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
    cost: spend,
    cases: fixture.cases,
    results,
    shot1: shot1.results,
  })}\n`);
  process.stdout.write(`Artifacts: ${OUTPUT_DIR}\nShot 2 cost: $${spend.toFixed(8)} / cumulative $1.00\n`);
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
