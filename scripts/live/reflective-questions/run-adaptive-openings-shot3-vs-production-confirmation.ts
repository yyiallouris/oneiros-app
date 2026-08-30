/**
 * Frozen paired product confirmation: production v1.0.3 vs adaptive Shot 3.
 * Twenty unseen synthetic dreams, randomized A/B, 40 calls, no retries.
 */
import { randomInt } from 'crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';
import {
  buildInitialReflectionRequest,
  END_MARKER_DREAM_READING,
  SAME_CALL_REFLECTIVE_QUESTIONS_BUNDLE,
  SAME_CALL_REFLECTIVE_QUESTIONS_METHOD_ID,
  type DreamReflectionDepth,
  type DreamReflectionInput,
  type ReflectionPromptRequest,
} from '../../../src/ai/dreamReflectionPrompt';
import { safeObserveReflectiveContract } from '../../../src/ai/reflectiveContractObservation';
import {
  extractSameCallReflectiveQuestions,
  normalizeCompletedReflectiveQuestionStructure,
} from '../../../src/ai/reflectiveQuestionExtract';
import {
  ADAPTIVE_OPENINGS_SHOT3_BUNDLE,
  ADAPTIVE_OPENINGS_SHOT3_BUNDLE_SHA256,
  ADAPTIVE_OPENINGS_SHOT3_METHOD_ID,
  buildAdaptiveOpeningsShot3Request,
} from '../../../src/ai/rd/reflective-questions/adaptiveOpeningsShot3Candidate';
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

type Variant = 'production_v103' | 'adaptive_shot3';
type BlindLabel = 'A' | 'B';

type FixtureCase = {
  id: string;
  language: string;
  mode: Extract<DreamReflectionDepth, 'standard' | 'advanced'>;
  design_profile: string;
  title: string;
  dream: string;
};

type BlindPair = {
  case_id: string;
  A: Variant;
  B: Variant;
};

type Trial = {
  generation_id: string;
  case_id: string;
  blind_label: BlindLabel;
  variant: Variant;
  language: string;
  surface: FixtureCase['mode'];
  title: string;
  dream: string;
  request_fingerprint_sha256?: string;
  raw_model_output?: string;
  output?: string;
  questions?: string[];
  structure_normalization?: Record<string, unknown>;
  contract_observation?: Record<string, unknown>;
  provider?: string | null;
  model?: string | null;
  latency_ms?: number;
  estimated_usd?: number;
  operational_error?: string;
};

const ROOT = process.cwd();
const FIXTURE_PATH = path.join(
  ROOT,
  'testing/reflective-questions/adaptive-openings-shot3-vs-production-confirmation-2026-08-30.json'
);
const RUBRIC_PATH = path.join(
  ROOT,
  'testing/reflective-questions/ADAPTIVE_OPENINGS_SHOT3_VS_PRODUCTION_BLIND_RUBRIC_2026-08-30.md'
);
const OUTPUT_DIR = path.join(
  ROOT,
  'testing/reflective-questions/artifacts/adaptive-openings-shot3-vs-production-confirmation-2026-08-30'
);
const KEY_PATH = path.join(OUTPUT_DIR, 'BLIND_KEY.json');
const SEAL_PATH = path.join(OUTPUT_DIR, 'SEAL.json');
const RAW_PATH = path.join(OUTPUT_DIR, 'RAW_PAIRED_OUTPUTS.json');
const REVIEW_PACKET_PATH = path.join(OUTPUT_DIR, 'BLIND_REVIEW_PACKET.md');

const FIXTURE_SHA = '6c6f9c59a294b5059b26c733f3a094e58e5273abdacfe86202207da0e002f953';
const RUBRIC_SHA = '30990b2fc7b0bea309c27f12af7ab41efecbe31bcf5ecd6829b94ae5e3a1fee1';
const KEY_SHA = '92b60442ced1e8d502f42fbe78bc35667dc7e82fb20e6cefca494ae783a8b063';
const SEAL_SHA = '71bb70e32701a107091ccc40ee83c8a0c8f1435a61a5e416f27f9ddf5afee957';
const APPROVAL_ENV = 'ONEIROS_ADAPTIVE_CONFIRMATION_COST_APPROVED';
const COST_CAP_USD = 1;
const EXPECTED_CASES = 20;
const EXPECTED_CALLS = 40;
const RESERVE_BY_SURFACE = { standard: 0.02, advanced: 0.025 } as const;

function block(value: string): string {
  return value.split('\n').map((line) => `> ${line}`).join('\n');
}

function assertFrozenPromptIdentities(): void {
  if (
    SAME_CALL_REFLECTIVE_QUESTIONS_METHOD_ID !==
      APPROVED_REFLECTIVE_QUESTION_PRODUCTION.methodId ||
    hashReflectiveQuestionPrompt(SAME_CALL_REFLECTIVE_QUESTIONS_BUNDLE) !==
      SAME_CALL_REFLECTIVE_QUESTIONS_BUNDLE_SHA256 ||
    SAME_CALL_REFLECTIVE_QUESTIONS_BUNDLE_SHA256 !==
      APPROVED_REFLECTIVE_QUESTION_PRODUCTION.promptSha256 ||
    hashReflectiveQuestionPrompt(ADAPTIVE_OPENINGS_SHOT3_BUNDLE) !==
      ADAPTIVE_OPENINGS_SHOT3_BUNDLE_SHA256 ||
    ADAPTIVE_OPENINGS_SHOT3_METHOD_ID !==
      'oneiros-adaptive-reflective-openings-v0.3.0-final-candidate'
  ) {
    throw new Error('Production or frozen Shot 3 prompt identity drifted.');
  }
}

function loadFixture(): {
  scope: { paired_calls: number; hard_cap_usd: number; retries: number };
  acceptance_gate: Record<string, unknown>;
  cases: FixtureCase[];
} {
  const raw = readFileSync(FIXTURE_PATH, 'utf8');
  if (sha256(raw) !== FIXTURE_SHA) throw new Error('Confirmation fixture hash drifted.');
  return JSON.parse(raw);
}

function prepareBlindSeal(): void {
  assertFrozenPromptIdentities();
  const fixtureRaw = readFileSync(FIXTURE_PATH, 'utf8');
  const rubricRaw = readFileSync(RUBRIC_PATH, 'utf8');
  if (sha256(fixtureRaw) !== FIXTURE_SHA || sha256(rubricRaw) !== RUBRIC_SHA) {
    throw new Error('Fixture or rubric drifted before blind preparation.');
  }
  const fixture = JSON.parse(fixtureRaw) as { cases: FixtureCase[] };
  if (fixture.cases.length !== EXPECTED_CASES) throw new Error('Expected 20 cases.');
  if (existsSync(KEY_PATH) || existsSync(SEAL_PATH) || existsSync(RAW_PATH)) {
    throw new Error('Blind confirmation already prepared or run; refusing to overwrite.');
  }
  mkdirSync(OUTPUT_DIR, { recursive: true });
  const pairs: BlindPair[] = fixture.cases.map((item) => {
    const productionIsA = randomInt(2) === 0;
    return {
      case_id: item.id,
      A: productionIsA ? 'production_v103' : 'adaptive_shot3',
      B: productionIsA ? 'adaptive_shot3' : 'production_v103',
    };
  });
  const key = {
    schema_version: 1,
    status: 'sealed_before_model_calls',
    prepared_at: new Date().toISOString(),
    pairs,
  };
  const keyRaw = `${JSON.stringify(key, null, 2)}\n`;
  writeFileSync(KEY_PATH, keyRaw);
  const seal = {
    schema_version: 1,
    status: 'sealed_before_model_calls',
    fixture_sha256: FIXTURE_SHA,
    rubric_sha256: RUBRIC_SHA,
    blind_key_sha256: sha256(keyRaw),
    production_method: SAME_CALL_REFLECTIVE_QUESTIONS_METHOD_ID,
    production_sha256: SAME_CALL_REFLECTIVE_QUESTIONS_BUNDLE_SHA256,
    adaptive_method: ADAPTIVE_OPENINGS_SHOT3_METHOD_ID,
    adaptive_sha256: ADAPTIVE_OPENINGS_SHOT3_BUNDLE_SHA256,
    cases: EXPECTED_CASES,
    calls: EXPECTED_CALLS,
    retries: 0,
    cost_cap_usd: COST_CAP_USD,
  };
  const sealRaw = `${JSON.stringify(seal, null, 2)}\n`;
  writeFileSync(SEAL_PATH, sealRaw);
  process.stdout.write(`${JSON.stringify({
    prepared: true,
    fixture_sha256: FIXTURE_SHA,
    rubric_sha256: RUBRIC_SHA,
    blind_key_sha256: sha256(keyRaw),
    seal_sha256: sha256(sealRaw),
    mapping_disclosed: false,
  }, null, 2)}\n`);
}

function assertModel(model: string | null): void {
  const normalized = (model ?? '').trim().toLowerCase();
  if (!normalized.startsWith('gpt-5.4') || normalized.includes('mini') || normalized.includes('nano')) {
    throw new Error(`Expected exact production full-model routing; got ${model ?? 'unknown'}.`);
  }
}

function buildRequest(
  variant: Variant,
  dream: DreamReflectionInput,
  surface: FixtureCase['mode']
): ReflectionPromptRequest {
  return variant === 'production_v103'
    ? buildInitialReflectionRequest(dream, surface)
    : buildAdaptiveOpeningsShot3Request(dream, surface);
}

function blindReviewPacket(params: {
  fixture: FixtureCase[];
  key: BlindPair[];
  trials: Trial[];
  exactCost: number;
}): string {
  const trial = (caseId: string, label: BlindLabel): Trial | undefined =>
    params.trials.find((item) => item.case_id === caseId && item.blind_label === label);
  return [
    '# Frozen blind product confirmation — reflective endings',
    '',
    `Fixture SHA: \`${FIXTURE_SHA}\``,
    `Rubric SHA: \`${RUBRIC_SHA}\``,
    `Exact cost: \`$${params.exactCost.toFixed(8)} / $1.00\``,
    '',
    'A/B labels were randomized and sealed before model calls. Do not open `BLIND_KEY.json` or `RAW_PAIRED_OUTPUTS.json` until all independent and pairwise verdicts are recorded.',
    'Review the full reading for context, but score the reflective ending separately. Cardinality may make this only partially blind.',
    '',
    ...params.fixture.flatMap((dreamCase, index) => {
      const key = params.key.find((item) => item.case_id === dreamCase.id);
      if (!key) throw new Error(`Missing blind key for ${dreamCase.id}.`);
      const a = trial(dreamCase.id, 'A');
      const b = trial(dreamCase.id, 'B');
      return [
        `## Pair ${index + 1}: ${dreamCase.id}`,
        '',
        `Language: \`${dreamCase.language}\` | Surface: \`${dreamCase.mode}\``,
        '',
        '### Dream',
        '',
        block(dreamCase.dream),
        '',
        '### A',
        '',
        block(a?.output ?? `[operational error: ${a?.operational_error ?? 'missing'}]`),
        '',
        'A independent: would_ship / earned_cardinality / vital_specific / fabricated_fact / answer_menu / structure_language / families / notes: PENDING',
        '',
        '### B',
        '',
        block(b?.output ?? `[operational error: ${b?.operational_error ?? 'missing'}]`),
        '',
        'B independent: would_ship / earned_cardinality / vital_specific / fabricated_fact / answer_menu / structure_language / families / notes: PENDING',
        '',
        'Pair: ending_preference / full_reading_preference / driven_by_ending / reason: PENDING',
        '',
      ];
    }),
  ].join('\n');
}

async function main(): Promise<void> {
  if (process.argv.includes('--prepare')) {
    prepareBlindSeal();
    return;
  }

  assertFrozenPromptIdentities();
  const fixtureRaw = readFileSync(FIXTURE_PATH, 'utf8');
  const rubricRaw = readFileSync(RUBRIC_PATH, 'utf8');
  const keyRaw = readFileSync(KEY_PATH, 'utf8');
  const sealRaw = readFileSync(SEAL_PATH, 'utf8');
  if (
    sha256(fixtureRaw) !== FIXTURE_SHA ||
    sha256(rubricRaw) !== RUBRIC_SHA ||
    sha256(keyRaw) !== KEY_SHA ||
    sha256(sealRaw) !== SEAL_SHA
  ) {
    throw new Error('Frozen confirmation inputs or blind seal drifted.');
  }
  const fixture = loadFixture();
  const key = JSON.parse(keyRaw) as { pairs: BlindPair[] };
  const seal = JSON.parse(sealRaw) as {
    fixture_sha256: string;
    rubric_sha256: string;
    blind_key_sha256: string;
    calls: number;
    retries: number;
    cost_cap_usd: number;
  };
  const standards = fixture.cases.filter((item) => item.mode === 'standard').length;
  const advanced = fixture.cases.filter((item) => item.mode === 'advanced').length;
  const reservedPacket = standards * 2 * RESERVE_BY_SURFACE.standard +
    advanced * 2 * RESERVE_BY_SURFACE.advanced;
  if (
    fixture.cases.length !== EXPECTED_CASES ||
    standards !== 10 ||
    advanced !== 10 ||
    fixture.scope.paired_calls !== EXPECTED_CALLS ||
    fixture.scope.retries !== 0 ||
    fixture.scope.hard_cap_usd !== COST_CAP_USD ||
    key.pairs.length !== EXPECTED_CASES ||
    new Set(key.pairs.map((item) => item.case_id)).size !== EXPECTED_CASES ||
    key.pairs.some((item) => item.A === item.B) ||
    seal.fixture_sha256 !== FIXTURE_SHA ||
    seal.rubric_sha256 !== RUBRIC_SHA ||
    seal.blind_key_sha256 !== KEY_SHA ||
    seal.calls !== EXPECTED_CALLS ||
    seal.retries !== 0 ||
    seal.cost_cap_usd !== COST_CAP_USD ||
    reservedPacket > COST_CAP_USD
  ) {
    throw new Error('Confirmation scope, key, seal, or budget preflight failed.');
  }
  const preflight = {
    fixture_sha256: FIXTURE_SHA,
    rubric_sha256: RUBRIC_SHA,
    blind_key_sha256: KEY_SHA,
    seal_sha256: SEAL_SHA,
    production_method: SAME_CALL_REFLECTIVE_QUESTIONS_METHOD_ID,
    production_sha256: SAME_CALL_REFLECTIVE_QUESTIONS_BUNDLE_SHA256,
    adaptive_method: ADAPTIVE_OPENINGS_SHOT3_METHOD_ID,
    adaptive_sha256: ADAPTIVE_OPENINGS_SHOT3_BUNDLE_SHA256,
    cases: EXPECTED_CASES,
    calls: EXPECTED_CALLS,
    standard: standards,
    advanced,
    reserved_packet_usd: reservedPacket,
    hard_cap_usd: COST_CAP_USD,
    retries: 0,
    prompt_changes: 0,
    deploys: 0,
    mapping_disclosed: false,
  };
  if (process.argv.includes('--preflight')) {
    process.stdout.write(`${JSON.stringify(preflight, null, 2)}\n`);
    return;
  }
  if (process.env[APPROVAL_ENV] !== '1') {
    throw new Error(`Paid run locked. Set ${APPROVAL_ENV}=1 only after explicit approval.`);
  }
  if (existsSync(RAW_PATH) || existsSync(REVIEW_PACKET_PATH)) {
    throw new Error('Confirmation output exists; paid rerun is forbidden.');
  }

  const supabaseUrl = getEnv(['EXPO_PUBLIC_SUPABASE_URL', 'SUPABASE_URL']).replace(/\/$/u, '');
  const anonKey = getEnv(['EXPO_PUBLIC_SUPABASE_ANON_KEY', 'SUPABASE_ANON_KEY']);
  if (!supabaseUrl || !anonKey) throw new Error('Missing Supabase URL/anon key.');
  const token = await getAccessToken(supabaseUrl, anonKey);
  const endpoint = `${supabaseUrl}/functions/v1/openai-proxy`;
  const trials: Trial[] = [];
  const startedAt = new Date().toISOString();
  let spend = 0;
  const persist = (status: 'in_progress' | 'complete' | 'stopped'): void => {
    writeFileSync(RAW_PATH, `${JSON.stringify({
      ...preflight,
      status,
      started_at: startedAt,
      completed_at: status === 'in_progress' ? null : new Date().toISOString(),
      exact_cost_usd: Number(spend.toFixed(8)),
      trials,
    }, null, 2)}\n`);
  };
  persist('in_progress');

  for (let caseIndex = 0; caseIndex < fixture.cases.length; caseIndex += 1) {
    const dreamCase = fixture.cases[caseIndex];
    const pair = key.pairs.find((item) => item.case_id === dreamCase.id);
    if (!pair) throw new Error(`Missing pair for ${dreamCase.id}.`);
    for (const label of ['A', 'B'] as const) {
      const reserve = RESERVE_BY_SURFACE[dreamCase.mode];
      if (spend + reserve > COST_CAP_USD) {
        persist('stopped');
        throw new Error('Hard cost cap stopped the packet before the next call.');
      }
      const variant = pair[label];
      const dream: DreamReflectionInput = {
        title: dreamCase.title,
        date: '2026-08-30',
        content: dreamCase.dream,
      };
      const request = buildRequest(variant, dream, dreamCase.mode);
      const base: Trial = {
        generation_id: `${dreamCase.id}:${label}`,
        case_id: dreamCase.id,
        blind_label: label,
        variant,
        language: dreamCase.language,
        surface: dreamCase.mode,
        title: dreamCase.title,
        dream: dreamCase.dream,
        request_fingerprint_sha256: requestFingerprint(request),
      };
      try {
        const call = await proxyCall({ endpoint, anonKey, token, request });
        assertModel(call.model);
        const callCost = call.cost.estimatedUsd;
        if (typeof callCost !== 'number' || !Number.isFinite(callCost) || callCost < 0) {
          throw new Error('Provider returned no auditable call cost.');
        }
        spend += callCost;
        if (spend > COST_CAP_USD) {
          throw new Error('Recorded spend exceeded the hard cost cap.');
        }
        const normalized = normalizeCompletedReflectiveQuestionStructure({
          content: call.content,
          surface: dreamCase.mode,
          requiredEndMarker: END_MARKER_DREAM_READING,
        });
        const observation = variant === 'adaptive_shot3'
          ? observeAdaptiveOpenings({
            content: normalized.content,
            surface: dreamCase.mode,
            languageContext: request.reflectiveLanguageContext,
          })
          : safeObserveReflectiveContract({
            content: normalized.content,
            contractSurface: dreamCase.mode,
            telemetrySurface: `reading_${dreamCase.mode}`,
            languageContext: request.reflectiveLanguageContext,
            requiredEndMarker: END_MARKER_DREAM_READING,
          });
        trials.push({
          ...base,
          raw_model_output: call.content,
          output: stripMarker(normalized.content),
          questions: extractSameCallReflectiveQuestions(normalized.content, dreamCase.mode),
          structure_normalization: normalized.normalization,
          contract_observation: observation as unknown as Record<string, unknown>,
          provider: call.provider,
          model: call.model,
          latency_ms: call.latencyMs,
          estimated_usd: callCost,
        });
      } catch (error) {
        trials.push({
          ...base,
          operational_error: error instanceof Error ? error.message : 'unknown_operational_error',
        });
      }
      persist('in_progress');
      process.stdout.write(
        `pair ${caseIndex + 1}/${EXPECTED_CASES} label ${label} complete ` +
        `calls=${trials.length}/${EXPECTED_CALLS} cost=$${spend.toFixed(8)}\n`
      );
    }
  }

  persist('complete');
  writeFileSync(REVIEW_PACKET_PATH, `${blindReviewPacket({
    fixture: fixture.cases,
    key: key.pairs,
    trials,
    exactCost: spend,
  })}\n`);
  process.stdout.write(`${JSON.stringify({
    completed: true,
    calls: trials.length,
    operational_errors: trials.filter((item) => item.operational_error).length,
    exact_cost_usd: Number(spend.toFixed(8)),
    cap_usd: COST_CAP_USD,
    blind_review_packet: REVIEW_PACKET_PATH,
    mapping_disclosed: false,
  }, null, 2)}\n`);
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
