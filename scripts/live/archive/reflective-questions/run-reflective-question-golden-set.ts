/**
 * LEGACY / FROZEN reflective-question live runner.
 *
 * Do not add new experiment flags, candidates, or generation paths here.
 * ARCHIVED historical multiplexer. Not the current R&D selector.
 * Current R&D is scripts/live/rd/reflective-questions/run-active-candidate.ts.
 * Frozen research base remains Candidate B SHA `08cd3eaf…`.
 * Do not add new experiment flags here.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { createHash } from 'crypto';
import { estimateAiCallCost, type AiCallCost } from '../../../../src/billing/aiPricing';
import {
  MINIMALISM_EXPERIMENT_CANDIDATES,
  MINIMALISM_EXPERIMENT_FAILURE_MODES,
  parseMinimalismExperimentLetter,
  type FrozenMinimalismCandidate,
} from '../../../../src/ai/rd/reflective-questions/archive/reflectiveQuestionMinimalismExperiment';
import {
  REFLECTIVE_QUESTION_WITNESSED_OPENING_ID,
  REFLECTIVE_QUESTION_WITNESSED_OPENING_OUTPUT_SLUG,
  REFLECTIVE_QUESTION_WITNESSED_OPENING_PROMPT,
  REFLECTIVE_QUESTION_WITNESSED_OPENING_SHA256,
  REFLECTIVE_QUESTION_WITNESSED_OPENING_VERSION,
  isWitnessedOpeningEnvEnabled,
} from '../../../../src/ai/rd/reflective-questions/archive/reflectiveQuestionWitnessedOpeningExperiment';
import {
  ORDINARY_MATERIAL_CLASSES,
  REFLECTIVE_QUESTION_SURGICAL_ATTENTION_ID,
  REFLECTIVE_QUESTION_SURGICAL_ATTENTION_OUTPUT_SLUG,
  REFLECTIVE_QUESTION_SURGICAL_ATTENTION_PROMPT,
  REFLECTIVE_QUESTION_SURGICAL_ATTENTION_SHA256,
  REFLECTIVE_QUESTION_SURGICAL_ATTENTION_VERSION,
  isSurgicalAttentionEnvEnabled,
} from '../../../../src/ai/rd/reflective-questions/archive/reflectiveQuestionSurgicalAttentionExperiment';
import {
  REFLECTIVE_QUESTION_RELATION_ELIGIBILITY_ABLATION_ID,
  REFLECTIVE_QUESTION_RELATION_ELIGIBILITY_ABLATION_OUTPUT_SLUG,
  REFLECTIVE_QUESTION_RELATION_ELIGIBILITY_ABLATION_PROMPT,
  REFLECTIVE_QUESTION_RELATION_ELIGIBILITY_ABLATION_SHA256,
  REFLECTIVE_QUESTION_RELATION_ELIGIBILITY_ABLATION_VERSION,
  isRelationEligibilityAblationEnvEnabled,
} from '../../../../src/ai/rd/reflective-questions/archive/reflectiveQuestionRelationEligibilityAblationExperiment';
import {
  REFLECTIVE_QUESTION_SELECTION_LANGUAGE_DECOUPLING_ID,
  REFLECTIVE_QUESTION_SELECTION_LANGUAGE_DECOUPLING_OUTPUT_SLUG,
  REFLECTIVE_QUESTION_SELECTION_LANGUAGE_DECOUPLING_PROMPT,
  REFLECTIVE_QUESTION_SELECTION_LANGUAGE_DECOUPLING_SHA256,
  REFLECTIVE_QUESTION_SELECTION_LANGUAGE_DECOUPLING_VERSION,
  SELECTION_RUBRIC_LEAKAGE_SUBCLASSES,
  V131_FREEZE_VALIDATION_BENCHMARK_ID,
  V131_FREEZE_VALIDATION_CASE_COUNT,
  V131_FREEZE_VALIDATION_FIXTURE,
  V131_FREEZE_VALIDATION_OUTPUT_SLUG_SUFFIX,
  isFreezeValidationEnvEnabled,
  isSelectionLanguageDecouplingEnvEnabled,
} from '../../../../src/ai/rd/reflective-questions/lineage/reflectiveQuestionSelectionLanguageDecouplingExperiment';
import {
  LANGUAGE_OPERATOR_DEVELOPMENT_STRESS_OUTPUT_SLUG_SUFFIX,
  LANGUAGE_OPERATOR_EXACT_SENTENCE_PRODUCT_GATE,
  LANGUAGE_OPERATOR_FAILURE_SPLIT,
  LANGUAGE_OPERATOR_REALIZATION_CONTAMINATION,
  LANGUAGE_OPERATOR_UX_SCORES,
  REFLECTIVE_QUESTION_LANGUAGE_OPERATOR_ID,
  REFLECTIVE_QUESTION_LANGUAGE_OPERATOR_OUTPUT_SLUG,
  REFLECTIVE_QUESTION_LANGUAGE_OPERATOR_PROMPT,
  REFLECTIVE_QUESTION_LANGUAGE_OPERATOR_SHA256,
  REFLECTIVE_QUESTION_LANGUAGE_OPERATOR_VERSION,
  isLanguageOperatorDevelopmentStressEnvEnabled,
  isLanguageOperatorEnvEnabled,
} from '../../../../src/ai/rd/reflective-questions/lineage/reflectiveQuestionLanguageOperatorExperiment';
import {
  LANGUAGE_OPERATOR_CANDIDATE_B_CASE_COUNT,
  LANGUAGE_OPERATOR_CANDIDATE_B_CASE_IDS,
  LANGUAGE_OPERATOR_CANDIDATE_B_FAILURE_FAMILIES,
  LANGUAGE_OPERATOR_CANDIDATE_B_FIXTURE,
  LANGUAGE_OPERATOR_CANDIDATE_B_REPEAT_COUNT,
  LANGUAGE_OPERATOR_CANDIDATE_B_VERDICTS,
  REFLECTIVE_QUESTION_LANGUAGE_OPERATOR_CANDIDATE_B_ID,
  REFLECTIVE_QUESTION_LANGUAGE_OPERATOR_CANDIDATE_B_OUTPUT_SLUG,
  REFLECTIVE_QUESTION_LANGUAGE_OPERATOR_CANDIDATE_B_PROMPT,
  REFLECTIVE_QUESTION_LANGUAGE_OPERATOR_CANDIDATE_B_SHA256,
  REFLECTIVE_QUESTION_LANGUAGE_OPERATOR_CANDIDATE_B_VERSION,
  isLanguageOperatorCandidateBEnvEnabled,
} from '../../../../src/ai/rd/reflective-questions/candidateB/reflectiveQuestionLanguageOperatorCandidateBExperiment';
import {
  REFLECTIVE_QUESTION_METHOD_ID,
  REFLECTIVE_QUESTION_METHOD_PROMPT,
  REFLECTIVE_QUESTION_METHOD_VERSION,
} from '../../../../src/ai/rd/reflective-questions/archive/reflectiveQuestionPrompt';

export const LEGACY_REFLECTIVE_QUESTION_RUNNER_STATUS = 'frozen' as const;
export const LEGACY_REFLECTIVE_QUESTION_EXPERIMENT_ENV_FLAGS = [
  'REFLECTIVE_QUESTION_EXPERIMENT',
  'REFLECTIVE_QUESTION_WITNESSED_OPENING',
  'REFLECTIVE_QUESTION_SURGICAL_ATTENTION',
  'REFLECTIVE_QUESTION_RELATION_ELIGIBILITY_ABLATION',
  'REFLECTIVE_QUESTION_SELECTION_LANGUAGE_DECOUPLING',
  'REFLECTIVE_QUESTION_FREEZE_VALIDATION',
  'REFLECTIVE_QUESTION_LANGUAGE_OPERATOR',
  'REFLECTIVE_QUESTION_DEVELOPMENT_STRESS',
  'REFLECTIVE_QUESTION_LANGUAGE_OPERATOR_CANDIDATE_B',
  'REFLECTIVE_QUESTION_LIVE_BENCHMARK',
  'REFLECTIVE_QUESTION_GOLDEN_REPEATS',
  'REFLECTIVE_QUESTION_BENCHMARK_REPEATS',
  'REFLECTIVE_QUESTION_BENCHMARK_CONCURRENCY',
] as const;

type ActiveMethod = {
  id: string;
  version: string;
  prompt: string;
  sha256: string;
  experiment: FrozenMinimalismCandidate | null;
  witnessedOpening: boolean;
  surgicalAttention: boolean;
  relationEligibilityAblation: boolean;
  selectionLanguageDecoupling: boolean;
  languageOperator: boolean;
  languageOperatorCandidateB?: boolean;
  outputSlug: string;
};

function usesUxSheet(method: ActiveMethod): boolean {
  return (
    method.witnessedOpening ||
    method.surgicalAttention ||
    method.relationEligibilityAblation ||
    method.selectionLanguageDecoupling ||
    method.languageOperator
  );
}

function usesHoldsTheCharge(method: ActiveMethod): boolean {
  return (
    method.surgicalAttention ||
    method.relationEligibilityAblation ||
    method.selectionLanguageDecoupling ||
    method.languageOperator
  );
}

function usesSelectionRubricLeakage(method: ActiveMethod): boolean {
  return (
    method.relationEligibilityAblation ||
    method.selectionLanguageDecoupling ||
    method.languageOperator
  );
}

function usesLanguageOperatorSheet(method: ActiveMethod): boolean {
  return method.languageOperator;
}

type GoldenCase = {
  id: string;
  category?: string;
  categories?: string[];
  language: string;
  title: string;
  content: string;
  length_band?: 'ultra_short' | 'short' | 'medium' | 'long';
  narrative_features?: string[];
  validation_buckets?: string[];
  reviewer_focus?: string;
  forbidden_inventions?: string[];
  probe_family?: string;
};

type GoldenSet = {
  version: string;
  method_id: string;
  benchmark_id?: string;
  source?: string;
  prompt_sha256_required?: string;
  cases: GoldenCase[];
};

type TemplateTelemetry = {
  exact_opening: string;
  first_3_words: string;
  first_5_words: string;
  question_word_count: number;
  question_character_count: number;
  grammatical_operator: string;
  relation_coexistence_framing: boolean;
  what_changes_framing: boolean;
  generic_experiential_framing: boolean;
  abstract_operators: string[];
};

type Trial = {
  case_id: string;
  categories: string[];
  length_band: 'ultra_short' | 'short' | 'medium' | 'long' | null;
  narrative_features: string[];
  validation_buckets: string[];
  title: string;
  dream: string;
  dream_word_count: number;
  repeat: number;
  prompt_id: string;
  prompt_version: string;
  exact_prompt: string;
  model_target: 'gpt-5.4';
  temperature: 0.45;
  max_completion_tokens: 500;
  fallback_disabled: true;
  raw_question: string;
  question: string | null;
  parse_error: string | null;
  technical_error: string | null;
  sentence_form: string | null;
  template_telemetry: TemplateTelemetry | null;
  latency_ms: number;
  provider: string | null;
  model: string | null;
  cost: AiCallCost;
};

const DEFAULT_REPEAT_COUNT = 2;
const MAX_REPEAT_COUNT = 5;
const DEFAULT_BENCHMARK_CONCURRENCY = 10;
const MAX_BENCHMARK_CONCURRENCY = 20;
const LIVE_BENCHMARK_FIXTURE =
  'testing/live-scenarios/reflective-questions-live-benchmark.v1.json';
const LIVE_BENCHMARK_ID =
  'reflective-question-oneiros-reader-v1.3.0-live-benchmark-v1';
const LIVE_BENCHMARK_ORIGIN_METHOD_ID =
  'reflective-question-oneiros-reader-v1.3.0';
const EXPECTED_V14_PROMPT_SHA256 =
  '0ea4b9a2364681124bdf582822c683754e28ae52ca6d7e7e7427e39f528b08b7';

function loadDotenvValue(key: string): string | undefined {
  const envPath = path.join(process.cwd(), '.env');
  if (!existsSync(envPath)) return undefined;
  const match = readFileSync(envPath, 'utf8').match(new RegExp(`^${key}\\s*=\\s*(.*)$`, 'm'));
  return match?.[1]?.trim().replace(/^['"]|['"]$/g, '');
}

function getEnv(keys: string[]): string {
  for (const key of keys) {
    const value = process.env[key] ?? loadDotenvValue(key);
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
}

function repeatCount(): number {
  const raw = getEnv([
    'REFLECTIVE_QUESTION_BENCHMARK_REPEATS',
    'REFLECTIVE_QUESTION_GOLDEN_REPEATS',
  ]);
  if (!raw) return DEFAULT_REPEAT_COUNT;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > MAX_REPEAT_COUNT) {
    throw new Error(
      `Reflective-question repeats must be an integer from 1 to ${MAX_REPEAT_COUNT}.`
    );
  }
  return parsed;
}

function liveBenchmarkEnabled(): boolean {
  return getEnv(['REFLECTIVE_QUESTION_LIVE_BENCHMARK']) === '1';
}

function freezeValidationEnabled(): boolean {
  return isFreezeValidationEnvEnabled(
    getEnv(['REFLECTIVE_QUESTION_FREEZE_VALIDATION']) || undefined
  );
}

function developmentStressEnabled(): boolean {
  return isLanguageOperatorDevelopmentStressEnvEnabled(
    getEnv(['REFLECTIVE_QUESTION_DEVELOPMENT_STRESS']) || undefined
  );
}

function languageOperatorCandidateBEnabled(): boolean {
  return isLanguageOperatorCandidateBEnvEnabled(
    getEnv(['REFLECTIVE_QUESTION_LANGUAGE_OPERATOR_CANDIDATE_B']) || undefined
  );
}

function promptSha256(prompt: string): string {
  return createHash('sha256').update(prompt.trim()).digest('hex');
}

function resolveActiveMethod(): ActiveMethod {
  const witnessedOpening = isWitnessedOpeningEnvEnabled(
    getEnv(['REFLECTIVE_QUESTION_WITNESSED_OPENING']) || undefined
  );
  const surgicalAttention = isSurgicalAttentionEnvEnabled(
    getEnv(['REFLECTIVE_QUESTION_SURGICAL_ATTENTION']) || undefined
  );
  const relationEligibilityAblation = isRelationEligibilityAblationEnvEnabled(
    getEnv(['REFLECTIVE_QUESTION_RELATION_ELIGIBILITY_ABLATION']) || undefined
  );
  const selectionLanguageDecoupling = isSelectionLanguageDecouplingEnvEnabled(
    getEnv(['REFLECTIVE_QUESTION_SELECTION_LANGUAGE_DECOUPLING']) || undefined
  );
  const languageOperator = isLanguageOperatorEnvEnabled(
    getEnv(['REFLECTIVE_QUESTION_LANGUAGE_OPERATOR']) || undefined
  );
  const languageOperatorCandidateB = languageOperatorCandidateBEnabled();
  const letter = parseMinimalismExperimentLetter(
    getEnv(['REFLECTIVE_QUESTION_EXPERIMENT']) || undefined
  );
  if (witnessedOpening && letter) {
    throw new Error(
      'REFLECTIVE_QUESTION_WITNESSED_OPENING cannot be combined with REFLECTIVE_QUESTION_EXPERIMENT.'
    );
  }
  if (surgicalAttention && letter) {
    throw new Error(
      'REFLECTIVE_QUESTION_SURGICAL_ATTENTION cannot be combined with REFLECTIVE_QUESTION_EXPERIMENT.'
    );
  }
  if (relationEligibilityAblation && letter) {
    throw new Error(
      'REFLECTIVE_QUESTION_RELATION_ELIGIBILITY_ABLATION cannot be combined with REFLECTIVE_QUESTION_EXPERIMENT.'
    );
  }
  if (surgicalAttention && witnessedOpening) {
    throw new Error(
      'REFLECTIVE_QUESTION_SURGICAL_ATTENTION cannot be combined with REFLECTIVE_QUESTION_WITNESSED_OPENING.'
    );
  }
  if (relationEligibilityAblation && witnessedOpening) {
    throw new Error(
      'REFLECTIVE_QUESTION_RELATION_ELIGIBILITY_ABLATION cannot be combined with REFLECTIVE_QUESTION_WITNESSED_OPENING.'
    );
  }
  if (relationEligibilityAblation && surgicalAttention) {
    throw new Error(
      'REFLECTIVE_QUESTION_RELATION_ELIGIBILITY_ABLATION cannot be combined with REFLECTIVE_QUESTION_SURGICAL_ATTENTION.'
    );
  }
  if (selectionLanguageDecoupling && letter) {
    throw new Error(
      'REFLECTIVE_QUESTION_SELECTION_LANGUAGE_DECOUPLING cannot be combined with REFLECTIVE_QUESTION_EXPERIMENT.'
    );
  }
  if (selectionLanguageDecoupling && witnessedOpening) {
    throw new Error(
      'REFLECTIVE_QUESTION_SELECTION_LANGUAGE_DECOUPLING cannot be combined with REFLECTIVE_QUESTION_WITNESSED_OPENING.'
    );
  }
  if (selectionLanguageDecoupling && surgicalAttention) {
    throw new Error(
      'REFLECTIVE_QUESTION_SELECTION_LANGUAGE_DECOUPLING cannot be combined with REFLECTIVE_QUESTION_SURGICAL_ATTENTION.'
    );
  }
  if (selectionLanguageDecoupling && relationEligibilityAblation) {
    throw new Error(
      'REFLECTIVE_QUESTION_SELECTION_LANGUAGE_DECOUPLING cannot be combined with REFLECTIVE_QUESTION_RELATION_ELIGIBILITY_ABLATION.'
    );
  }
  if (languageOperator && letter) {
    throw new Error(
      'REFLECTIVE_QUESTION_LANGUAGE_OPERATOR cannot be combined with REFLECTIVE_QUESTION_EXPERIMENT.'
    );
  }
  if (languageOperator && witnessedOpening) {
    throw new Error(
      'REFLECTIVE_QUESTION_LANGUAGE_OPERATOR cannot be combined with REFLECTIVE_QUESTION_WITNESSED_OPENING.'
    );
  }
  if (languageOperator && surgicalAttention) {
    throw new Error(
      'REFLECTIVE_QUESTION_LANGUAGE_OPERATOR cannot be combined with REFLECTIVE_QUESTION_SURGICAL_ATTENTION.'
    );
  }
  if (languageOperator && relationEligibilityAblation) {
    throw new Error(
      'REFLECTIVE_QUESTION_LANGUAGE_OPERATOR cannot be combined with REFLECTIVE_QUESTION_RELATION_ELIGIBILITY_ABLATION.'
    );
  }
  if (languageOperator && selectionLanguageDecoupling) {
    throw new Error(
      'REFLECTIVE_QUESTION_LANGUAGE_OPERATOR cannot be combined with REFLECTIVE_QUESTION_SELECTION_LANGUAGE_DECOUPLING.'
    );
  }
  if (languageOperatorCandidateB && letter) {
    throw new Error(
      'REFLECTIVE_QUESTION_LANGUAGE_OPERATOR_CANDIDATE_B cannot be combined with REFLECTIVE_QUESTION_EXPERIMENT.'
    );
  }
  if (languageOperatorCandidateB && witnessedOpening) {
    throw new Error(
      'REFLECTIVE_QUESTION_LANGUAGE_OPERATOR_CANDIDATE_B cannot be combined with REFLECTIVE_QUESTION_WITNESSED_OPENING.'
    );
  }
  if (languageOperatorCandidateB && surgicalAttention) {
    throw new Error(
      'REFLECTIVE_QUESTION_LANGUAGE_OPERATOR_CANDIDATE_B cannot be combined with REFLECTIVE_QUESTION_SURGICAL_ATTENTION.'
    );
  }
  if (languageOperatorCandidateB && relationEligibilityAblation) {
    throw new Error(
      'REFLECTIVE_QUESTION_LANGUAGE_OPERATOR_CANDIDATE_B cannot be combined with REFLECTIVE_QUESTION_RELATION_ELIGIBILITY_ABLATION.'
    );
  }
  if (languageOperatorCandidateB && selectionLanguageDecoupling) {
    throw new Error(
      'REFLECTIVE_QUESTION_LANGUAGE_OPERATOR_CANDIDATE_B cannot be combined with REFLECTIVE_QUESTION_SELECTION_LANGUAGE_DECOUPLING.'
    );
  }
  if (languageOperatorCandidateB && languageOperator) {
    throw new Error(
      'REFLECTIVE_QUESTION_LANGUAGE_OPERATOR_CANDIDATE_B cannot be combined with REFLECTIVE_QUESTION_LANGUAGE_OPERATOR. Candidate A stays frozen.'
    );
  }
  if (languageOperatorCandidateB) {
    const sha256 = promptSha256(
      REFLECTIVE_QUESTION_LANGUAGE_OPERATOR_CANDIDATE_B_PROMPT
    );
    if (sha256 !== REFLECTIVE_QUESTION_LANGUAGE_OPERATOR_CANDIDATE_B_SHA256) {
      throw new Error(
        'Language + Operator Candidate B prompt hash drifted from the frozen value.'
      );
    }
    return {
      id: REFLECTIVE_QUESTION_LANGUAGE_OPERATOR_CANDIDATE_B_ID,
      version: REFLECTIVE_QUESTION_LANGUAGE_OPERATOR_CANDIDATE_B_VERSION,
      prompt: REFLECTIVE_QUESTION_LANGUAGE_OPERATOR_CANDIDATE_B_PROMPT,
      sha256,
      experiment: null,
      witnessedOpening: false,
      surgicalAttention: false,
      relationEligibilityAblation: false,
      selectionLanguageDecoupling: false,
      languageOperator: false,
      languageOperatorCandidateB: true,
      outputSlug: REFLECTIVE_QUESTION_LANGUAGE_OPERATOR_CANDIDATE_B_OUTPUT_SLUG,
    };
  }
  if (languageOperator) {
    const sha256 = promptSha256(REFLECTIVE_QUESTION_LANGUAGE_OPERATOR_PROMPT);
    if (sha256 !== REFLECTIVE_QUESTION_LANGUAGE_OPERATOR_SHA256) {
      throw new Error(
        'Language + Reflective Operator prompt hash drifted from the frozen value.'
      );
    }
    return {
      id: REFLECTIVE_QUESTION_LANGUAGE_OPERATOR_ID,
      version: REFLECTIVE_QUESTION_LANGUAGE_OPERATOR_VERSION,
      prompt: REFLECTIVE_QUESTION_LANGUAGE_OPERATOR_PROMPT,
      sha256,
      experiment: null,
      witnessedOpening: false,
      surgicalAttention: false,
      relationEligibilityAblation: false,
      selectionLanguageDecoupling: false,
      languageOperator: true,
      outputSlug: REFLECTIVE_QUESTION_LANGUAGE_OPERATOR_OUTPUT_SLUG,
    };
  }
  if (selectionLanguageDecoupling) {
    const sha256 = promptSha256(
      REFLECTIVE_QUESTION_SELECTION_LANGUAGE_DECOUPLING_PROMPT
    );
    if (sha256 !== REFLECTIVE_QUESTION_SELECTION_LANGUAGE_DECOUPLING_SHA256) {
      throw new Error(
        'Selection Language Decoupling prompt hash drifted from the frozen value.'
      );
    }
    return {
      id: REFLECTIVE_QUESTION_SELECTION_LANGUAGE_DECOUPLING_ID,
      version: REFLECTIVE_QUESTION_SELECTION_LANGUAGE_DECOUPLING_VERSION,
      prompt: REFLECTIVE_QUESTION_SELECTION_LANGUAGE_DECOUPLING_PROMPT,
      sha256,
      experiment: null,
      witnessedOpening: false,
      surgicalAttention: false,
      relationEligibilityAblation: false,
      selectionLanguageDecoupling: true,
      languageOperator: false,
      outputSlug: REFLECTIVE_QUESTION_SELECTION_LANGUAGE_DECOUPLING_OUTPUT_SLUG,
    };
  }
  if (relationEligibilityAblation) {
    const sha256 = promptSha256(
      REFLECTIVE_QUESTION_RELATION_ELIGIBILITY_ABLATION_PROMPT
    );
    if (sha256 !== REFLECTIVE_QUESTION_RELATION_ELIGIBILITY_ABLATION_SHA256) {
      throw new Error(
        'Relation Eligibility Ablation prompt hash drifted from the frozen value.'
      );
    }
    return {
      id: REFLECTIVE_QUESTION_RELATION_ELIGIBILITY_ABLATION_ID,
      version: REFLECTIVE_QUESTION_RELATION_ELIGIBILITY_ABLATION_VERSION,
      prompt: REFLECTIVE_QUESTION_RELATION_ELIGIBILITY_ABLATION_PROMPT,
      sha256,
      experiment: null,
      witnessedOpening: false,
      surgicalAttention: false,
      relationEligibilityAblation: true,
      selectionLanguageDecoupling: false,
      languageOperator: false,
      outputSlug: REFLECTIVE_QUESTION_RELATION_ELIGIBILITY_ABLATION_OUTPUT_SLUG,
    };
  }
  if (surgicalAttention) {
    const sha256 = promptSha256(REFLECTIVE_QUESTION_SURGICAL_ATTENTION_PROMPT);
    if (sha256 !== REFLECTIVE_QUESTION_SURGICAL_ATTENTION_SHA256) {
      throw new Error(
        'Surgical Attention prompt hash drifted from the frozen value.'
      );
    }
    return {
      id: REFLECTIVE_QUESTION_SURGICAL_ATTENTION_ID,
      version: REFLECTIVE_QUESTION_SURGICAL_ATTENTION_VERSION,
      prompt: REFLECTIVE_QUESTION_SURGICAL_ATTENTION_PROMPT,
      sha256,
      experiment: null,
      witnessedOpening: false,
      surgicalAttention: true,
      relationEligibilityAblation: false,
      selectionLanguageDecoupling: false,
      languageOperator: false,
      outputSlug: REFLECTIVE_QUESTION_SURGICAL_ATTENTION_OUTPUT_SLUG,
    };
  }
  if (witnessedOpening) {
    const sha256 = promptSha256(REFLECTIVE_QUESTION_WITNESSED_OPENING_PROMPT);
    if (sha256 !== REFLECTIVE_QUESTION_WITNESSED_OPENING_SHA256) {
      throw new Error(
        'Witnessed Opening prompt hash drifted from the frozen value.'
      );
    }
    return {
      id: REFLECTIVE_QUESTION_WITNESSED_OPENING_ID,
      version: REFLECTIVE_QUESTION_WITNESSED_OPENING_VERSION,
      prompt: REFLECTIVE_QUESTION_WITNESSED_OPENING_PROMPT,
      sha256,
      experiment: null,
      witnessedOpening: true,
      surgicalAttention: false,
      relationEligibilityAblation: false,
      selectionLanguageDecoupling: false,
      languageOperator: false,
      outputSlug: REFLECTIVE_QUESTION_WITNESSED_OPENING_OUTPUT_SLUG,
    };
  }
  if (letter) {
    const candidate = MINIMALISM_EXPERIMENT_CANDIDATES[letter];
    const sha256 = promptSha256(candidate.prompt);
    if (sha256 !== candidate.sha256) {
      throw new Error(
        `Minimalism experiment ${letter} prompt hash drifted from the frozen value.`
      );
    }
    return {
      id: candidate.id,
      version: candidate.version,
      prompt: candidate.prompt,
      sha256,
      experiment: candidate,
      witnessedOpening: false,
      surgicalAttention: false,
      relationEligibilityAblation: false,
      selectionLanguageDecoupling: false,
      languageOperator: false,
      outputSlug: candidate.outputSlug,
    };
  }
  const sha256 = promptSha256(REFLECTIVE_QUESTION_METHOD_PROMPT);
  if (
    REFLECTIVE_QUESTION_METHOD_ID !==
      'reflective-question-oneiros-reader-v1.4.0' ||
    REFLECTIVE_QUESTION_METHOD_VERSION !== '1.4.0' ||
    sha256 !== EXPECTED_V14_PROMPT_SHA256
  ) {
    throw new Error('Live benchmark requires the exact frozen v1.4.0 prompt.');
  }
  return {
    id: REFLECTIVE_QUESTION_METHOD_ID,
    version: REFLECTIVE_QUESTION_METHOD_VERSION,
    prompt: REFLECTIVE_QUESTION_METHOD_PROMPT,
    sha256,
    experiment: null,
    witnessedOpening: false,
    surgicalAttention: false,
    relationEligibilityAblation: false,
    selectionLanguageDecoupling: false,
    languageOperator: false,
    outputSlug: `reflective-question-oneiros-reader-v${REFLECTIVE_QUESTION_METHOD_VERSION.split('.')
      .slice(0, 2)
      .join('-')}`,
  };
}

function benchmarkConcurrency(): number {
  const raw = getEnv(['REFLECTIVE_QUESTION_BENCHMARK_CONCURRENCY']);
  if (!raw) return DEFAULT_BENCHMARK_CONCURRENCY;
  const parsed = Number.parseInt(raw, 10);
  if (
    !Number.isInteger(parsed) ||
    parsed < 1 ||
    parsed > MAX_BENCHMARK_CONCURRENCY
  ) {
    throw new Error(
      `REFLECTIVE_QUESTION_BENCHMARK_CONCURRENCY must be an integer from 1 to ${MAX_BENCHMARK_CONCURRENCY}.`
    );
  }
  return parsed;
}

function countWords(value: string): number {
  return value.trim().split(/\s+/u).filter(Boolean).length;
}

async function getAccessToken(supabaseUrl: string, anonKey: string): Promise<string> {
  const existing = getEnv(['LIVE_SUPABASE_ACCESS_TOKEN', 'SUPABASE_ACCESS_TOKEN']);
  if (existing) return existing;
  const email = getEnv(['LIVE_SUPABASE_EMAIL']);
  const password = getEnv(['LIVE_SUPABASE_PASSWORD']);
  if (!email || !password) {
    throw new Error('Missing LIVE_SUPABASE_ACCESS_TOKEN or LIVE_SUPABASE_EMAIL/PASSWORD.');
  }
  const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: anonKey },
    body: JSON.stringify({ email, password }),
  });
  if (!response.ok) throw new Error(`Supabase auth failed (${response.status}).`);
  const token = (await response.json() as { access_token?: string }).access_token;
  if (!token) throw new Error('Supabase auth succeeded without an access token.');
  return token;
}

function extractContent(payload: Record<string, unknown>): string {
  const choice = (payload.choices as Array<{ message?: { content?: string } }> | undefined)?.[0];
  if (typeof choice?.message?.content === 'string') return choice.message.content.trim();
  if (typeof payload.content === 'string') return payload.content.trim();
  if (typeof payload.text === 'string') return payload.text.trim();
  return '';
}

function inferProvider(payload: Record<string, unknown>): string | null {
  if (typeof payload.provider === 'string') return payload.provider;
  const model = typeof payload.model === 'string' ? payload.model.toLowerCase() : '';
  if (model.includes('claude')) return 'anthropic';
  if (model.includes('gpt-')) return 'openai';
  return null;
}

function parseSingleQuestion(value: string): string {
  const cleaned = value
    .replace(/^```(?:text|markdown)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
  const lines = cleaned
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length !== 1) {
    throw new Error('Output must contain exactly one non-empty line.');
  }
  const question = lines[0]
    .replace(/^[-*•]\s+/u, '')
    .replace(/[”’"']+$/u, '')
    .trim();
  if (/^#{1,6}\s/u.test(question)) {
    throw new Error('Output must not contain a heading.');
  }
  if (question.length < 12 || question.length > 360 || !/[?;]$/u.test(question)) {
    throw new Error('Reflective question is missing or malformed.');
  }
  if ((question.match(/[?;]/gu)?.length ?? 0) !== 1) {
    throw new Error('Output must contain exactly one question.');
  }
  return question;
}

function normalizeQuestion(question: string): string {
  return question
    .toLocaleLowerCase('el')
    .replace(/[«»“”"']/gu, '')
    .replace(/[?;,.:!]+$/gu, '')
    .replace(/\s+/gu, ' ')
    .trim();
}

function sentenceForm(question: string): string {
  const normalized = normalizeQuestion(question);
  if (/^πώς είναι για (?:σένα|εσένα)(?:\s|$)/u.test(normalized)) return 'Πώς είναι για σένα…';
  if (/^τι αλλάζει στο ότι(?:\s|$)/u.test(normalized)) return 'Τι αλλάζει στο ότι…';
  if (/^αν έμενες λίγο(?:\s|$)/u.test(normalized)) return 'Αν έμενες λίγο…';
  if (/^τι συμβαίνει μέσα σου(?:\s|$)/u.test(normalized)) return 'Τι συμβαίνει μέσα σου…';
  if (/^τι αλλάζει όταν(?:\s|$)/u.test(normalized)) return 'Τι αλλάζει όταν…';
  if (/^τι ποιότητα(?:\s|$)/u.test(normalized)) return 'Τι ποιότητα…';
  return normalized.split(/\s+/u).slice(0, 3).join(' ') || 'unknown';
}

function templateTelemetry(question: string): TemplateTelemetry {
  const normalized = normalizeQuestion(question);
  const words = normalized.split(/\s+/u).filter(Boolean);
  const exactOpening = normalized
    .split(/[,—:]/u)[0]
    .split(/\s+/u)
    .slice(0, 10)
    .join(' ');
  const relationCoexistence =
    /(σχέση|συνυπάρχ\p{L}*|μαζί|δίπλα|στέκεται|στέκονται)/iu.test(
      normalized
    );
  const whatChanges =
    /^(?:τι|πώς)\s+αλλάζ\p{L}*/iu.test(normalized) ||
    /τι αλλάζει/iu.test(normalized);
  const genericExperiential =
    /^(?:πώς είναι|τι σημαίνει|τι είναι|τι σου προκαλεί|πώς νιώθεις|τι νιώθεις)(?:\s+για)?\s+(?:σένα|εσένα)?/iu.test(
      normalized
    );
  const abstractOperatorPatterns: Array<[string, RegExp]> = [
    ['relation', /σχέση/iu],
    ['coexistence', /συνυπάρχ\p{L}*/iu],
    ['standing_with', /στέκ\p{L}*/iu],
    ['change', /αλλάζ\p{L}*/iu],
    ['meaning', /σημαίν\p{L}*/iu],
    ['quality', /ποιότητα/iu],
    ['presence', /παρουσία/iu],
  ];
  const grammaticalOperator = whatChanges
    ? 'change'
    : relationCoexistence
      ? 'relation_or_coexistence'
        : /^(?:γιατί|τι .*κάνει|ποιο .*κάνει)(?:\s|$)/iu.test(normalized)
        ? 'causal'
        : /^(?:τι|ποιο|ποια) (?:μένει|ξεχωρίζει|τραβά)/iu.test(normalized)
          ? 'attention'
          : genericExperiential
            ? 'generic_experiential'
            : words[0] || 'unknown';
  return {
    exact_opening: exactOpening,
    first_3_words: words.slice(0, 3).join(' '),
    first_5_words: words.slice(0, 5).join(' '),
    question_word_count: words.length,
    question_character_count: question.length,
    grammatical_operator: grammaticalOperator,
    relation_coexistence_framing: relationCoexistence,
    what_changes_framing: whatChanges,
    generic_experiential_framing: genericExperiential,
    abstract_operators: abstractOperatorPatterns
      .filter(([, pattern]) => pattern.test(normalized))
      .map(([label]) => label),
  };
}

function percentile(values: number[], percent: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((left, right) => left - right);
  const index = Math.ceil((percent / 100) * sorted.length) - 1;
  return sorted[Math.max(0, Math.min(sorted.length - 1, index))];
}

function frequencyTable(values: Array<string | null | undefined>) {
  return values.reduce<Record<string, number>>((counts, value) => {
    if (value) counts[value] = (counts[value] ?? 0) + 1;
    return counts;
  }, {});
}

function dominantFrequency(counts: Record<string, number>, total: number) {
  const dominant =
    Object.entries(counts).sort((left, right) => right[1] - left[1])[0] ?? null;
  return dominant
    ? {
        value: dominant[0],
        count: dominant[1],
        percentage: Number(((dominant[1] / total) * 100).toFixed(2)),
      }
    : null;
}

function dreamInput(testCase: GoldenCase): string {
  return `Title: ${testCase.title}\n\nDream:\n${testCase.content}`;
}

function technicalFailureTrial(params: {
  testCase: GoldenCase;
  repeat: number;
  startedAt: number;
  error: string;
  activeMethod: ActiveMethod;
  rawQuestion?: string;
  provider?: string | null;
  model?: string | null;
  payload?: Record<string, unknown>;
}): Trial {
  return {
    case_id: params.testCase.id,
    categories:
      params.testCase.categories ??
      (params.testCase.category ? [params.testCase.category] : []),
    length_band: params.testCase.length_band ?? null,
    narrative_features: params.testCase.narrative_features ?? [],
    validation_buckets: params.testCase.validation_buckets ?? [],
    title: params.testCase.title,
    dream: params.testCase.content,
    dream_word_count: countWords(params.testCase.content),
    repeat: params.repeat,
    prompt_id: params.activeMethod.id,
    prompt_version: params.activeMethod.version,
    exact_prompt: params.activeMethod.prompt,
    model_target: 'gpt-5.4',
    temperature: 0.45,
    max_completion_tokens: 500,
    fallback_disabled: true,
    raw_question: params.rawQuestion ?? '',
    question: null,
    parse_error: null,
    technical_error: params.error,
    sentence_form: null,
    template_telemetry: null,
    latency_ms: Date.now() - params.startedAt,
    provider: params.provider ?? null,
    model: params.model ?? null,
    cost: estimateAiCallCost(params.payload ?? {}, params.provider ?? null),
  };
}

const BENCHMARK_CATEGORY_RANGES = {
  ordinary_banal_low_affect: [8, 10],
  emotionally_intense: [8, 10],
  contradictory_paradoxical: [6, 8],
  relational_intimate_erotic_vital: [5, 6],
  transformation_body_change_metamorphosis: [5, 6],
  meaningful_non_action_waiting_silence_absence: [5, 6],
  strange_surreal: [5, 6],
} as const;

const POSITIVE_NUMINOUS_CATEGORIES = new Set([
  'positive_peaceful_beautiful_coherent',
  'numinous',
]);

const ALLOWED_BENCHMARK_CATEGORIES = new Set([
  ...Object.keys(BENCHMARK_CATEGORY_RANGES),
  ...POSITIVE_NUMINOUS_CATEGORIES,
]);

const ALLOWED_NARRATIVE_FEATURES = new Set([
  'multiple_characters',
  'scene_shift',
  'affect_shift',
  'irrelevant_detail',
  'partial_memory',
  'incomplete_ending',
  'changing_locations',
]);

function validateLiveBenchmark(benchmark: GoldenSet): void {
  if (
    benchmark.benchmark_id !== LIVE_BENCHMARK_ID ||
    benchmark.method_id !== LIVE_BENCHMARK_ORIGIN_METHOD_ID
  ) {
    throw new Error(
      `Live benchmark identity changed: ${benchmark.benchmark_id ?? 'missing'} / ${benchmark.method_id}.`
    );
  }
  if (benchmark.cases.length !== 50) {
    throw new Error('Live benchmark requires exactly 50 distinct dreams.');
  }
  if (benchmark.source !== 'synthetic') {
    throw new Error('Live benchmark must declare synthetic source data.');
  }
  const ids = new Set(benchmark.cases.map((testCase) => testCase.id));
  if (ids.size !== benchmark.cases.length) {
    throw new Error('Live benchmark dream ids must be unique.');
  }
  const contents = new Set(
    benchmark.cases.map((testCase) => testCase.content.trim())
  );
  if (contents.size !== benchmark.cases.length) {
    throw new Error('Live benchmark dream narratives must be unique.');
  }

  const lengthBandCounts = { short: 0, medium: 0, long: 0 };
  const categoryCounts = Object.fromEntries(
    Object.keys(BENCHMARK_CATEGORY_RANGES).map((category) => [category, 0])
  ) as Record<keyof typeof BENCHMARK_CATEGORY_RANGES, number>;

  for (const testCase of benchmark.cases) {
    if (!testCase.categories?.length || !testCase.length_band) {
      throw new Error(`Benchmark case ${testCase.id} is missing categories or length_band.`);
    }
    if (testCase.language !== 'el') {
      throw new Error(`Benchmark case ${testCase.id} must be Greek (el).`);
    }
    if (
      !testCase.reviewer_focus?.trim() ||
      !testCase.forbidden_inventions?.length
    ) {
      throw new Error(`Benchmark case ${testCase.id} is missing reviewer metadata.`);
    }
    const wordCount = countWords(testCase.content);
    const [minimum, maximum] =
      testCase.length_band === 'short'
        ? [45, 149]
        : testCase.length_band === 'medium'
          ? [150, 300]
          : [300, 600];
    if (wordCount < minimum || wordCount > maximum) {
      throw new Error(
        `${testCase.id} has ${wordCount} words; ${testCase.length_band} requires ${minimum}–${maximum}.`
      );
    }
    lengthBandCounts[testCase.length_band] += 1;
    for (const category of testCase.categories) {
      if (!ALLOWED_BENCHMARK_CATEGORIES.has(category)) {
        throw new Error(`${testCase.id} uses unknown benchmark category ${category}.`);
      }
      if (category in categoryCounts) {
        categoryCounts[category as keyof typeof BENCHMARK_CATEGORY_RANGES] += 1;
      }
    }
    for (const feature of testCase.narrative_features ?? []) {
      if (!ALLOWED_NARRATIVE_FEATURES.has(feature)) {
        throw new Error(`${testCase.id} uses unknown narrative feature ${feature}.`);
      }
    }
    if (testCase.length_band !== 'short') {
      const features = new Set(testCase.narrative_features ?? []);
      const required = [
        'multiple_characters',
        'scene_shift',
        'affect_shift',
        'irrelevant_detail',
      ];
      if (
        required.some((feature) => !features.has(feature)) ||
        !['partial_memory', 'incomplete_ending', 'changing_locations'].some(
          (feature) => features.has(feature)
        )
      ) {
        throw new Error(
          `${testCase.id} must include the required long/messy narrative features.`
        );
      }
    }
  }

  if (
    lengthBandCounts.short !== 30 ||
    lengthBandCounts.medium !== 10 ||
    lengthBandCounts.long !== 10
  ) {
    throw new Error(
      `Live benchmark length bands must be 30 short / 10 medium / 10 long; received ${JSON.stringify(lengthBandCounts)}.`
    );
  }
  for (const [category, [minimum, maximum]] of Object.entries(
    BENCHMARK_CATEGORY_RANGES
  )) {
    const count = categoryCounts[category as keyof typeof categoryCounts];
    if (count < minimum || count > maximum) {
      throw new Error(
        `${category} requires ${minimum}–${maximum} dreams; received ${count}.`
      );
    }
  }
  const positiveOrNuminousCount = benchmark.cases.filter((testCase) =>
    testCase.categories?.some((category) =>
      POSITIVE_NUMINOUS_CATEGORIES.has(category)
    )
  ).length;
  if (positiveOrNuminousCount < 6 || positiveOrNuminousCount > 8) {
    throw new Error(
      `Positive/peaceful/coherent + numinous coverage requires 6–8 distinct dreams; received ${positiveOrNuminousCount}.`
    );
  }
}

const ALLOWED_FREEZE_VALIDATION_CATEGORIES = new Set([
  ...ALLOWED_BENCHMARK_CATEGORIES,
  'relational_looking_unstaged',
]);

const ALLOWED_FREEZE_VALIDATION_FEATURES = new Set([
  ...ALLOWED_NARRATIVE_FEATURES,
  'ultra_short',
  'staged_relation',
  'unstaged_cooccurrence',
  'many_unrelated_objects',
]);

const FREEZE_VALIDATION_BUCKET_MINIMUMS = {
  ultra_short: 8,
  banal_low_affect: 8,
  dense_emotionally_intense: 8,
  contradictory_affect: 8,
  numinous: 8,
  transformation: 8,
  many_unrelated_objects: 6,
  relational_staged: 6,
  relational_looking_unstaged: 6,
} as const;

function freezeValidationWordBounds(
  lengthBand: GoldenCase['length_band']
): [number, number] {
  if (lengthBand === 'ultra_short') return [8, 44];
  if (lengthBand === 'short') return [45, 149];
  if (lengthBand === 'medium') return [150, 300];
  return [300, 600];
}

function validateFreezeValidation(benchmark: GoldenSet): void {
  if (
    benchmark.benchmark_id !== V131_FREEZE_VALIDATION_BENCHMARK_ID ||
    benchmark.method_id !== REFLECTIVE_QUESTION_SELECTION_LANGUAGE_DECOUPLING_ID
  ) {
    throw new Error(
      `Freeze-validation identity changed: ${benchmark.benchmark_id ?? 'missing'} / ${benchmark.method_id}.`
    );
  }
  if (benchmark.source !== 'synthetic-unseen') {
    throw new Error('Freeze-validation fixture must declare synthetic-unseen source data.');
  }
  if (
    benchmark.prompt_sha256_required !==
    REFLECTIVE_QUESTION_SELECTION_LANGUAGE_DECOUPLING_SHA256
  ) {
    throw new Error(
      'Freeze-validation fixture must lock the frozen decoupling prompt SHA-256.'
    );
  }
  if (benchmark.cases.length !== V131_FREEZE_VALIDATION_CASE_COUNT) {
    throw new Error(
      `Freeze-validation requires exactly ${V131_FREEZE_VALIDATION_CASE_COUNT} distinct dreams.`
    );
  }
  const historical = JSON.parse(
    readFileSync(path.join(process.cwd(), LIVE_BENCHMARK_FIXTURE), 'utf8')
  ) as GoldenSet;
  const historicalIds = new Set(historical.cases.map((testCase) => testCase.id));
  const historicalContents = new Set(
    historical.cases.map((testCase) => testCase.content.trim())
  );
  const ids = new Set(benchmark.cases.map((testCase) => testCase.id));
  if (ids.size !== benchmark.cases.length) {
    throw new Error('Freeze-validation dream ids must be unique.');
  }
  const contents = new Set(
    benchmark.cases.map((testCase) => testCase.content.trim())
  );
  if (contents.size !== benchmark.cases.length) {
    throw new Error('Freeze-validation dream narratives must be unique.');
  }
  const idOverlap = [...ids].filter((id) => historicalIds.has(id));
  if (idOverlap.length) {
    throw new Error(
      `Freeze-validation ids overlap the historical 50-dream fixture: ${idOverlap.join(', ')}.`
    );
  }
  const contentOverlap = [...contents].filter((content) =>
    historicalContents.has(content)
  );
  if (contentOverlap.length) {
    throw new Error(
      'Freeze-validation narratives overlap the historical 50-dream fixture.'
    );
  }

  const bucketCounts: Record<string, number> = {};
  for (const testCase of benchmark.cases) {
    if (!testCase.categories?.length || !testCase.length_band) {
      throw new Error(
        `Freeze-validation case ${testCase.id} is missing categories or length_band.`
      );
    }
    if (testCase.language !== 'el') {
      throw new Error(`Freeze-validation case ${testCase.id} must be Greek (el).`);
    }
    if (
      !testCase.reviewer_focus?.trim() ||
      !testCase.forbidden_inventions?.length
    ) {
      throw new Error(
        `Freeze-validation case ${testCase.id} is missing reviewer metadata.`
      );
    }
    if (!testCase.validation_buckets?.length) {
      throw new Error(
        `Freeze-validation case ${testCase.id} is missing validation_buckets.`
      );
    }
    const wordCount = countWords(testCase.content);
    const [minimum, maximum] = freezeValidationWordBounds(testCase.length_band);
    if (wordCount < minimum || wordCount > maximum) {
      throw new Error(
        `${testCase.id} has ${wordCount} words; ${testCase.length_band} requires ${minimum}–${maximum}.`
      );
    }
    for (const category of testCase.categories) {
      if (!ALLOWED_FREEZE_VALIDATION_CATEGORIES.has(category)) {
        throw new Error(
          `${testCase.id} uses unknown freeze-validation category ${category}.`
        );
      }
    }
    for (const feature of testCase.narrative_features ?? []) {
      if (!ALLOWED_FREEZE_VALIDATION_FEATURES.has(feature)) {
        throw new Error(
          `${testCase.id} uses unknown freeze-validation narrative feature ${feature}.`
        );
      }
    }
    for (const bucket of testCase.validation_buckets) {
      bucketCounts[bucket] = (bucketCounts[bucket] ?? 0) + 1;
    }
  }
  for (const [bucket, minimum] of Object.entries(
    FREEZE_VALIDATION_BUCKET_MINIMUMS
  )) {
    const count = bucketCounts[bucket] ?? 0;
    if (count < minimum) {
      throw new Error(
        `Freeze-validation bucket ${bucket} requires at least ${minimum} dreams; received ${count}.`
      );
    }
  }
}

function metrics(trials: Trial[]) {
  const priced = trials.every((trial) => typeof trial.cost.estimatedUsd === 'number');
  const sentenceForms = trials.reduce<Record<string, number>>((counts, trial) => {
    if (trial.sentence_form) {
      counts[trial.sentence_form] = (counts[trial.sentence_form] ?? 0) + 1;
    }
    return counts;
  }, {});
  const dominant = Object.entries(sentenceForms).sort(
    (left, right) => right[1] - left[1]
  )[0] ?? null;
  const first3Forms = frequencyTable(
    trials.map((trial) => trial.template_telemetry?.first_3_words)
  );
  const first5Forms = frequencyTable(
    trials.map((trial) => trial.template_telemetry?.first_5_words)
  );
  const exactOpenings = frequencyTable(
    trials.map((trial) => trial.template_telemetry?.exact_opening)
  );
  const grammaticalOperators = frequencyTable(
    trials.map((trial) => trial.template_telemetry?.grammatical_operator)
  );
  const lengthBands = trials.some((trial) => trial.length_band === 'ultra_short')
    ? (['ultra_short', 'short', 'medium', 'long'] as const)
    : (['short', 'medium', 'long'] as const);
  const byLengthBand = lengthBands.reduce(
    (summary, lengthBand) => {
      const matching = trials.filter((trial) => trial.length_band === lengthBand);
      summary[lengthBand] = {
        trials: matching.length,
        valid_single_questions: matching.filter((trial) => trial.question).length,
        latency_p50_ms: percentile(matching.map((trial) => trial.latency_ms), 50),
        latency_p95_ms: percentile(matching.map((trial) => trial.latency_ms), 95),
      };
      return summary;
    },
    {} as Record<
      'ultra_short' | 'short' | 'medium' | 'long',
      {
        trials: number;
        valid_single_questions: number;
        latency_p50_ms: number;
        latency_p95_ms: number;
      }
    >
  );
  return {
    trials: trials.length,
    valid_single_questions: trials.filter((trial) => trial.question).length,
    technical_failures: trials.filter((trial) => trial.technical_error).length,
    prompt_contract_failures: trials.filter((trial) => trial.parse_error).length,
    invalid_outputs: trials.filter((trial) => !trial.question).length,
    observed_providers: [...new Set(trials.map((trial) => trial.provider).filter(Boolean))],
    observed_models: [...new Set(trials.map((trial) => trial.model).filter(Boolean))],
    latency_p50_ms: percentile(trials.map((trial) => trial.latency_ms), 50),
    latency_p95_ms: percentile(trials.map((trial) => trial.latency_ms), 95),
    total_input_tokens: trials.reduce((sum, trial) => sum + trial.cost.inputTokens, 0),
    total_cached_input_tokens: trials.reduce(
      (sum, trial) => sum + trial.cost.cachedInputTokens,
      0
    ),
    total_output_tokens: trials.reduce((sum, trial) => sum + trial.cost.outputTokens, 0),
    total_tokens: trials.reduce((sum, trial) => sum + trial.cost.totalTokens, 0),
    total_estimated_usd: priced
      ? Number(
          trials.reduce((sum, trial) => sum + (trial.cost.estimatedUsd ?? 0), 0).toFixed(8)
        )
      : null,
    sentence_forms: sentenceForms,
    dominant_sentence_form: dominant
      ? {
          form: dominant[0],
          count: dominant[1],
          percentage: Number(((dominant[1] / trials.length) * 100).toFixed(2)),
        }
      : null,
    generic_what_changes_in_fact_count:
      sentenceForms['Τι αλλάζει στο ότι…'] ?? 0,
    template_telemetry: {
      exact_openings: exactOpenings,
      dominant_exact_opening: dominantFrequency(exactOpenings, trials.length),
      first_3_words: first3Forms,
      dominant_first_3_words: dominantFrequency(first3Forms, trials.length),
      first_5_words: first5Forms,
      dominant_first_5_words: dominantFrequency(first5Forms, trials.length),
      grammatical_operators: grammaticalOperators,
      dominant_grammatical_operator: dominantFrequency(
        grammaticalOperators,
        trials.length
      ),
      relation_coexistence_framing_count: trials.filter(
        (trial) =>
          trial.template_telemetry?.relation_coexistence_framing === true
      ).length,
      what_changes_framing_count: trials.filter(
        (trial) => trial.template_telemetry?.what_changes_framing === true
      ).length,
      generic_experiential_framing_count: trials.filter(
        (trial) =>
          trial.template_telemetry?.generic_experiential_framing === true
      ).length,
      abstract_operator_counts: frequencyTable(
        trials.flatMap(
          (trial) => trial.template_telemetry?.abstract_operators ?? []
        )
      ),
      question_word_count_average: Number(
        (
          trials.reduce(
            (sum, trial) =>
              sum + (trial.template_telemetry?.question_word_count ?? 0),
            0
          ) / Math.max(1, trials.filter((trial) => trial.question).length)
        ).toFixed(2)
      ),
    },
    by_length_band: byLengthBand,
  };
}

function attentionForCase(caseId: string): string | null {
  if (caseId === 'numinous-white-bird') {
    return 'Preserve the unknown-yet-known paradox.';
  }
  if (caseId === 'erotic-vital-river') {
    return 'Preserve desire + strength + freedom + body + water + laughter + relation; do not turn it into therapy talk.';
  }
  if (caseId === 'explicit-affect-mother-relief') {
    return 'Do not isolate the windows from death + whispers + relief + air.';
  }
  if (caseId === 'ordinary-blue-cups') {
    return 'Do not manufacture hidden fragility, anxiety, or control.';
  }
  return null;
}

function candidateBReviewPacket(params: {
  generatedAt: string;
  goldenSet: GoldenSet;
  trials: Trial[];
  activeMethod: ActiveMethod;
}): string {
  return [
    '# Language + Operator Candidate B — small development set',
    '',
    `- Generated: ${params.generatedAt}`,
    `- Active method: ${params.activeMethod.id}`,
    `- Prompt SHA-256: ${params.activeMethod.sha256}`,
    `- Fixture: ${params.goldenSet.cases.length} dreams × ${LANGUAGE_OPERATOR_CANDIDATE_B_REPEAT_COUNT} generation`,
    '- Model: gpt-5.4; temperature 0.45; fallback disabled',
    '- Architecture unchanged. No new rules. No examples. No Quiet Abstention.',
    '- Frozen Language+Operator SHA f5aa40a4… is not mutated.',
    '- This is NOT freeze validation and NOT a 120-run.',
    '- If this set does not show a clear improvement, stop.',
    '',
    'Score only:',
    '',
    `- Verdict: ${LANGUAGE_OPERATOR_CANDIDATE_B_VERDICTS.join(' / ')}`,
    '- Hard error: YES / NO',
    '- First-read: 0 reread / 1 effortful / 2 immediate',
    '- Oneiros pull: 0 none / 1 mild / 2 genuine',
    `- Failure family (if NOT_PASS): ${LANGUAGE_OPERATOR_CANDIDATE_B_FAILURE_FAMILIES.join(' | ')}`,
    '',
    '## Exact prompt',
    '',
    '```text',
    params.activeMethod.prompt.trim(),
    '```',
    '',
    ...params.trials.flatMap((trial) => {
      const testCase = params.goldenSet.cases.find(
        (entry) => entry.id === trial.case_id
      );
      return [
        `## ${trial.case_id}`,
        '',
        `**Probe family:** ${testCase?.probe_family ?? 'unspecified'}`,
        '',
        '**Dream**',
        '',
        trial.dream,
        '',
        '**Question**',
        '',
        trial.question ??
          `(invalid output: ${trial.technical_error ?? trial.parse_error ?? 'unknown'})`,
        '',
        `| Verdict (${LANGUAGE_OPERATOR_CANDIDATE_B_VERDICTS.join(' / ')}) | Hard error | First-read 0/1/2 | Oneiros pull 0/1/2 | Failure family |`,
        '|---|---|---|---|---|',
        '|  | YES / NO |  |  |  |',
        '',
      ];
    }),
    '## Stop rule',
    '',
    '- PASS count: ',
    '- Hard-error count: ',
    '- Clear improvement vs Language+Operator wrappers/motive/unstaged-relation? YES / NO',
    '- Decision: continue / STOP',
    '',
  ].join('\n');
}

function candidateBReviewSheet(
  goldenSet: GoldenSet,
  trials: Trial[]
): Record<string, unknown> {
  return {
    instructions: {
      verdicts: [...LANGUAGE_OPERATOR_CANDIDATE_B_VERDICTS],
      hard_error: ['YES', 'NO'],
      first_read: [0, 1, 2],
      oneiros_pull: [0, 1, 2],
      failure_family: [...LANGUAGE_OPERATOR_CANDIDATE_B_FAILURE_FAMILIES],
    },
    reviews: trials.map((trial) => {
      const testCase = goldenSet.cases.find((entry) => entry.id === trial.case_id);
      return {
        case_id: trial.case_id,
        probe_family: testCase?.probe_family ?? null,
        title: trial.title,
        dream: trial.dream,
        question: trial.question,
        technical_error: trial.technical_error,
        verdict: null,
        hard_error: null,
        first_read: null,
        oneiros_pull: null,
        failure_family: null,
      };
    }),
  };
}

function reviewPacket(params: {
  generatedAt: string;
  goldenSet: GoldenSet;
  repeats: number;
  trials: Trial[];
  activeMethod: ActiveMethod;
}): string {
  return [
    '# Oneiros Reflective Questions — Oneiros Reader Frozen Review',
    '',
    `- Generated: ${params.generatedAt}`,
    `- Active method: ${params.activeMethod.id}`,
    `- Method version: ${params.activeMethod.version}`,
    `- Frozen fixture: ${params.goldenSet.version}; ${params.goldenSet.cases.length} unchanged dreams × ${params.repeats} repeats`,
    '- Model target: gpt-5.4 only; Anthropic fallback disabled for this evaluation',
    '- Architecture: one call → one raw reflective question',
    '- Candidates/reviewer/ranking/rewrite/operators/templates: none',
    '- Golden labels exposed to model: no',
    '- Production deployment performed: no',
    ...(usesUxSheet(params.activeMethod)
      ? [
          '- UX supplement (does not replace the four gates): Pull to Answer 0/1/2; Felt Read 0/1/2.',
          ...(params.activeMethod.surgicalAttention
            ? [
                '- Holds the Charge 0 flattened / 1 partial / 2 stays with the charged configuration.',
                '- Ordinary-class and supported-multi-anchor are recorded post-hoc; do not invent a new generator failure-mode enum.',
              ]
            : []),
          ...(params.activeMethod.relationEligibilityAblation
            ? [
                '- Holds the Charge 0 flattened / 1 partial / 2 stays with the charged configuration.',
                '- Selection-rubric leakage YES/NO: does the final question expose or paraphrase language/concepts that belong to the prompt’s selection mechanism rather than to the dream?',
              ]
            : []),
          ...(params.activeMethod.selectionLanguageDecoupling
            ? [
                '- Holds the Charge 0 flattened / 1 partial / 2 stays with the charged configuration.',
                '- Selection-rubric leakage YES/NO: does the final question expose or paraphrase language/concepts that belong to the prompt’s selection mechanism rather than to the dream?',
                '- If YES, subclass: importance_leak | opening_leak | selector_paraphrase. If the dream literally stages an opening event, mark legitimate_dream_language and count leakage NO.',
                '- Score PAIRWISE_VS_ABLATION first, then PAIRWISE_VS_V13, then this quality packet.',
              ]
            : []),
          ...(params.activeMethod.languageOperator
            ? [
                '- Holds the Charge 0 flattened / 1 partial / 2 stays with the charged configuration.',
                '- Selection-rubric leakage YES/NO with subclass importance_leak | opening_leak | selector_paraphrase. If the dream literally stages an opening event, mark legitimate_dream_language and count leakage NO.',
                '- First-read clarity 0 reread / 1 effortful / 2 immediate. Dream-native 0 framework / 1 mixed / 2 dream-native. Syntactic ease 0 tangled / 1 friction / 2 clean. Abstractness burden 0 heavy / 1 some / 2 concrete.',
                '- Exact-sentence product gate YES/NO. Failure split SELECTOR | REALIZATION | BOTH | OTHER. Realization contamination is diagnostic, not a generator blacklist.',
                '- Score PAIRWISE_VS_DECOUPLING first, then this quality packet, then opening preservation.',
              ]
            : []),
          '- Score pairwise packets before this quality packet when a baseline pair exists.',
        ]
      : []),
    '',
    '## Exact shared prompt',
    '',
    '```text',
    params.activeMethod.prompt.trim(),
    '```',
    '',
    '## Review contract',
    '',
    'Review only:',
    '',
    '1. **Dream-specific:** Is the question genuinely specific to this dream?',
    '2. **Epistemically clean:** Does it avoid inventing psychological material?',
    '3. **Re-entry:** Does it reveal or deepen something rather than merely paraphrase?',
    '4. **Human pull:** Would a real person actually want to answer it?',
    '',
    'A strong `PASS` requires all four. Do not revise the prompt automatically after this review.',
    '',
    '## Machine telemetry and sentence forms',
    '',
    '```json',
    JSON.stringify(metrics(params.trials), null, 2),
    '```',
    '',
    'Review sentence-form repetition across the complete run. A phrase is not individually banned; failure means different dream structures collapse into one dominant linguistic habit.',
    '',
    ...params.trials.flatMap((trial) => {
      const attention = attentionForCase(trial.case_id);
      return [
        `## ${trial.case_id} — repeat ${trial.repeat}/${params.repeats}`,
        '',
        `**Category:** ${trial.categories.join(', ')}`,
        '',
        ...(attention ? [`**Editorial attention:** ${attention}`, ''] : []),
        '**Dream**',
        '',
        trial.dream,
        '',
        '**Raw question**',
        '',
        trial.question ??
          `(invalid output: ${trial.technical_error ?? trial.parse_error ?? 'unknown'})`,
        '',
        `Sentence form: ${trial.sentence_form ?? 'unavailable'}`,
        '',
        '| Dream-specific | Epistemically clean | Re-entry | Human pull | Strong PASS | Notes |',
        '|---|---|---|---|---|---|',
        '| PASS / FAIL | PASS / FAIL | PASS / FAIL | PASS / FAIL | PASS / FAIL |  |',
        '',
        ...(usesUxSheet(params.activeMethod)
          ? [
              '- Pull to Answer (0 none / 1 mild / 2 genuine pull): ',
              '- Felt Read (0 generic / 1 grounded / 2 precisely attended): ',
              ...(params.activeMethod.surgicalAttention
                ? [
                    '- Holds the Charge (0 flattened / 1 partial / 2 stays with the charged configuration): ',
                    `- Ordinary class (${ORDINARY_MATERIAL_CLASSES.join(' | ')}): `,
                    '- Multi-anchor supported (true/false; fill when two or more anchors): ',
                  ]
                : []),
              ...(usesSelectionRubricLeakage(params.activeMethod)
                ? [
                    '- Holds the Charge (0 flattened / 1 partial / 2 stays with the charged configuration): ',
                    '- Selection-rubric leakage (YES / NO): ',
              ...(params.activeMethod.selectionLanguageDecoupling
                      ? [
                          `- Leakage subclass (${[...SELECTION_RUBRIC_LEAKAGE_SUBCLASSES, 'legitimate_dream_language'].join(' | ')}): `,
                        ]
                      : []),
                    ...(params.activeMethod.languageOperator
                      ? [
                          `- Leakage subclass (${[...SELECTION_RUBRIC_LEAKAGE_SUBCLASSES, 'legitimate_dream_language'].join(' | ')}): `,
                          '- First-read clarity (0 reread / 1 effortful / 2 immediate): ',
                          '- Dream-native language (0 framework / 1 mixed / 2 dream-native): ',
                          '- Syntactic ease (0 tangled / 1 friction / 2 clean): ',
                          '- Abstractness burden (0 heavy / 1 some / 2 concrete): ',
                          `- Exact-sentence product gate (${LANGUAGE_OPERATOR_EXACT_SENTENCE_PRODUCT_GATE.join(' / ')}): `,
                          `- Failure split (${LANGUAGE_OPERATOR_FAILURE_SPLIT.join(' | ')}): `,
                          `- Realization contamination (${LANGUAGE_OPERATOR_REALIZATION_CONTAMINATION.join(' | ')}): `,
                        ]
                      : []),
                  ]
                : []),
              '',
            ]
          : []),
      ];
    }),
    '## Final run-level review',
    '',
    '- Strong PASS count: ',
    '- Epistemic FAIL count: ',
    '- Per-dream stability: ',
    '- Dominant linguistic scaffold: yes / no',
    '- ONEIROS range: coherent intelligence responding differently to different dreams / repeated template',
    '- Decision: REVIEW FOR DEPLOYMENT / DO NOT DEPLOY',
    '- Reason: ',
    '',
  ].join('\n');
}

function stableBlindOrder(value: string): number {
  let hash = 2166136261;
  for (const character of value) {
    hash ^= character.codePointAt(0) ?? 0;
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function blindItems(trials: Trial[], seed: string) {
  return [...trials]
    .sort(
      (left, right) =>
        stableBlindOrder(`${seed}:${left.case_id}:${left.repeat}`) -
        stableBlindOrder(`${seed}:${right.case_id}:${right.repeat}`)
    )
    .map((trial, index) => ({
      blind_id: `B${String(index + 1).padStart(3, '0')}`,
      trial,
    }));
}

function blindReviewPacket(params: {
  generatedAt: string;
  benchmark: GoldenSet;
  items: ReturnType<typeof blindItems>;
  activeMethod: ActiveMethod;
  freezeValidation?: boolean;
  developmentStress?: boolean;
}): string {
  return [
    `# Oneiros Reflective Questions ${params.activeMethod.version} — Blind Live Benchmark Review`,
    '',
    `- Generated: ${params.generatedAt}`,
    `- Active method: ${params.activeMethod.id}`,
    `- Frozen benchmark: ${params.benchmark.benchmark_id ?? params.benchmark.version}`,
    `- Items: ${params.items.length}`,
    '- The order is deterministically shuffled. Repeat number, case id, category, and length band are withheld.',
    '- Do not open `BLIND_MANIFEST.json` or `results.json` until this packet is fully scored.',
    '- No automated judge is used as acceptance authority.',
    ...(params.freezeValidation
      ? [
          '- Unseen v1.3.1 freeze-validation set. Do not retune the frozen decoupling prompt. Historical 50-dream fixture remains untouched.',
        ]
      : []),
    ...(params.developmentStress
      ? [
          '- Development-stress set: the former unseen freeze-validation fixture, now used because its failure topology is known. This is NOT freeze validation. Do not ship from this result. A completely new unseen fixture is required afterward if this R&D succeeds.',
        ]
      : []),
    params.activeMethod.experiment
      ? '- Extra experiment failure modes are recorded, not patched: generic Jungian symbolism; “what does X symbolize?”; generic therapeutic questioning; excessive why; generic feeling questions; wrong language; multi-line/non-question dumps.'
      : '',
    params.activeMethod.witnessedOpening
      ? '- UX supplement (does not replace Strong PASS): Pull to Answer 0/1/2; Felt Read 0/1/2. Score the pairwise packet first if one exists. Do not invent a new failure-mode enum.'
      : '',
    params.activeMethod.surgicalAttention
      ? '- UX supplement (does not replace Strong PASS): Pull to Answer 0/1/2; Felt Read 0/1/2; Holds the Charge 0/1/2. Score the pairwise packet first if one exists. Ordinary-class and supported-multi-anchor are post-hoc. Do not invent a new failure-mode enum.'
      : '',
    params.activeMethod.relationEligibilityAblation
      ? '- UX supplement (does not replace Strong PASS): Pull to Answer 0/1/2; Felt Read 0/1/2; Holds the Charge 0/1/2. Score the pairwise packet first if one exists. Selection-rubric leakage is YES/NO. Do not invent a new failure-mode enum.'
      : '',
    params.activeMethod.selectionLanguageDecoupling
      ? params.freezeValidation
        ? '- UX supplement (does not replace Strong PASS): Pull to Answer 0/1/2; Felt Read 0/1/2; Holds the Charge 0/1/2. Score PAIRWISE_VS_ABLATION against the matched freeze-validation ablation baseline first. Do not score vs-v13 on this unseen fixture. Selection-rubric leakage is YES/NO with subclass importance_leak | opening_leak | selector_paraphrase. If the dream literally stages an opening event, mark legitimate_dream_language and count leakage NO. Do not invent a new failure-mode enum. Do not retune the prompt.'
        : '- UX supplement (does not replace Strong PASS): Pull to Answer 0/1/2; Felt Read 0/1/2; Holds the Charge 0/1/2. Score PAIRWISE_VS_ABLATION first, then PAIRWISE_VS_V13, then this quality packet. Selection-rubric leakage is YES/NO with subclass importance_leak | opening_leak | selector_paraphrase. If the dream literally stages an opening event, mark legitimate_dream_language and count leakage NO. Do not invent a new failure-mode enum.'
      : '',
    params.activeMethod.languageOperator
      ? '- UX supplement (does not replace Strong PASS): Pull to Answer 0/1/2; Felt Read 0/1/2; Holds the Charge 0/1/2; First-read clarity 0/1/2; Dream-native language 0/1/2; Syntactic ease 0/1/2; Abstractness burden 0/1/2. Exact-sentence product gate YES/NO. Realization contamination and failure split SELECTOR | REALIZATION | BOTH | OTHER are evaluator-side diagnostics, not generator blacklists. Score PAIRWISE_VS_DECOUPLING first, then this quality packet, then opening preservation. Do not call a good result freeze validation. Do not ship from this result.'
      : '',
    '',
    '## Scoring',
    '',
    'Score every dimension from 1 (clear failure) to 5 (excellent):',
    '',
    '- epistemic_integrity',
    '- dream_specificity',
    '- openness_non_leading',
    '- natural_language',
    '- psychological_aliveness',
    '- proportionality',
    '- non_template_quality',
    '',
    'Hard epistemic flags: INVENTED_AFFECT_OR_MOTIVE; INVENTED_RELATION; INVENTED_CONFLICT_OR_PATHOLOGY; EMBEDDED_INTERPRETATION; WAKING_LIFE_INFERENCE; FACTUAL_DREAM_INVENTION.',
    '',
    'Editorial/method flags: SIGNIFICANCE_INFLATION; BANAL_INFLATION; QUESTION_SHAPED_PARAPHRASE; FORCED_RELATIONAL_STRUCTURE; ARBITRARY_JUXTAPOSITION; LEADING_QUESTION; NON_ACTION_INTERPRETATION; UNNATURAL_LANGUAGE; GENERIC_REUSABLE_QUESTION; TEMPLATE_COLLAPSE; WEAK_PSYCHOLOGICAL_ALIVENESS; OVERCOMPLEX_WORDING; OTHER.',
    '',
    'Keep hard epistemic failures separate from editorial failures. A modest image-near question may score higher than theatrical depth.',
    '',
    ...(params.activeMethod.experiment
      ? [
          'Experiment-only failure modes (record, do not patch): GENERIC_JUNGIAN_SYMBOLISM; WHAT_DOES_X_SYMBOLIZE; GENERIC_THERAPEUTIC_QUESTION; EXCESSIVE_WHY; GENERIC_FEELING_QUESTION; WRONG_LANGUAGE; MULTI_LINE_OR_NON_QUESTION_DUMP.',
          '',
        ]
      : []),
    ...params.items.flatMap(({ blind_id, trial }) => [
      `## ${blind_id}`,
      '',
      '**Dream**',
      '',
      `### ${trial.title}`,
      '',
      trial.dream,
      '',
      '**Reflective question**',
      '',
      trial.question ??
        `(invalid output: ${trial.technical_error ?? trial.parse_error ?? 'unknown'})`,
      '',
      '| Dimension | Score 1–5 |',
      '|---|---|',
      '| epistemic_integrity |  |',
      '| dream_specificity |  |',
      '| openness_non_leading |  |',
      '| natural_language |  |',
      '| psychological_aliveness |  |',
      '| proportionality |  |',
      '| non_template_quality |  |',
      '',
      '- Would I actually want to answer this question if it were my dream? YES / NO',
      ...(usesUxSheet(params.activeMethod)
        ? [
            '- Pull to Answer (0 none / 1 mild / 2 genuine pull): ',
            '- Felt Read (0 generic / 1 grounded / 2 precisely attended): ',
            ...(params.activeMethod.surgicalAttention
              ? [
                  '- Holds the Charge (0 flattened / 1 partial / 2 stays with the charged configuration): ',
                  `- Ordinary class (${ORDINARY_MATERIAL_CLASSES.join(' | ')}): `,
                  '- Multi-anchor supported (true/false; fill when two or more anchors): ',
                ]
              : []),
            ...(params.activeMethod.relationEligibilityAblation ||
            params.activeMethod.selectionLanguageDecoupling ||
            params.activeMethod.languageOperator
              ? [
                  '- Holds the Charge (0 flattened / 1 partial / 2 stays with the charged configuration): ',
                  '- Selection-rubric leakage (YES / NO): ',
                  ...(params.activeMethod.selectionLanguageDecoupling ||
                  params.activeMethod.languageOperator
                    ? [
                        `- Leakage subclass (${[...SELECTION_RUBRIC_LEAKAGE_SUBCLASSES, 'legitimate_dream_language'].join(' | ')}): `,
                      ]
                    : []),
                  ...(params.activeMethod.languageOperator
                    ? [
                        '- First-read clarity (0 reread / 1 effortful / 2 immediate): ',
                        '- Dream-native language (0 framework / 1 mixed / 2 dream-native): ',
                        '- Syntactic ease (0 tangled / 1 friction / 2 clean): ',
                        '- Abstractness burden (0 heavy / 1 some / 2 concrete): ',
                        `- Exact-sentence product gate (${LANGUAGE_OPERATOR_EXACT_SENTENCE_PRODUCT_GATE.join(' / ')}): `,
                        `- Failure split (${LANGUAGE_OPERATOR_FAILURE_SPLIT.join(' | ')}): `,
                        `- Realization contamination (${LANGUAGE_OPERATOR_REALIZATION_CONTAMINATION.join(' | ')}): `,
                      ]
                    : []),
                ]
              : []),
          ]
        : []),
      '- Verdict: PASS / SOFT_FAIL / FAIL',
      '- Hard flags: ',
      '- Editorial/method flags: ',
      '- Question architecture: single_image / transformation / movement / affect_image / action / non_action / paradox / relation / threshold / bodily_experience / generic_experiential / other',
      '- Anchor construction: single / two / multiple / unclear',
      '- Grammatical operator: ',
      '- Relation/coexistence framing: YES / NO',
      '- What-changes framing: YES / NO',
      '- Generic experiential framing: YES / NO',
      '- Repeated abstract operators: ',
      '- Concise rationale: ',
      ...(params.activeMethod.experiment
        ? ['- Experiment failure modes: ', '']
        : ['']),
    ]),
  ].join('\n');
}

function blindReviewSheet(
  items: ReturnType<typeof blindItems>,
  activeMethod: ActiveMethod
) {
  return {
    instructions: {
      score_scale: '1–5',
      hard_epistemic_flags: [
        'INVENTED_AFFECT_OR_MOTIVE',
        'INVENTED_RELATION',
        'INVENTED_CONFLICT_OR_PATHOLOGY',
        'EMBEDDED_INTERPRETATION',
        'WAKING_LIFE_INFERENCE',
        'FACTUAL_DREAM_INVENTION',
      ],
      editorial_flags: [
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
      ],
      experiment_failure_modes: activeMethod.experiment
        ? [...MINIMALISM_EXPERIMENT_FAILURE_MODES]
        : [],
      ux_scores: usesUxSheet(activeMethod)
        ? {
            pull_to_answer: [0, 1, 2],
            felt_read: [0, 1, 2],
            ...(usesHoldsTheCharge(activeMethod)
              ? {
                  holds_the_charge: [0, 1, 2],
                }
              : {}),
            ...(activeMethod.surgicalAttention
              ? {
                  ordinary_material_class: [...ORDINARY_MATERIAL_CLASSES],
                  multi_anchor_supported: [true, false],
                }
              : {}),
            ...(usesSelectionRubricLeakage(activeMethod)
              ? {
                  selection_rubric_leakage: ['YES', 'NO'],
                  ...(activeMethod.selectionLanguageDecoupling ||
                  activeMethod.languageOperator
                    ? {
                        selection_rubric_leakage_subclass: [
                          ...SELECTION_RUBRIC_LEAKAGE_SUBCLASSES,
                          'legitimate_dream_language',
                        ],
                      }
                    : {}),
                }
              : {}),
            ...(usesLanguageOperatorSheet(activeMethod)
              ? {
                  first_read_clarity: [...LANGUAGE_OPERATOR_UX_SCORES],
                  dream_native_language: [...LANGUAGE_OPERATOR_UX_SCORES],
                  syntactic_ease: [...LANGUAGE_OPERATOR_UX_SCORES],
                  abstractness_burden: [...LANGUAGE_OPERATOR_UX_SCORES],
                  exact_sentence_product_gate: [
                    ...LANGUAGE_OPERATOR_EXACT_SENTENCE_PRODUCT_GATE,
                  ],
                  realization_contamination: [
                    ...LANGUAGE_OPERATOR_REALIZATION_CONTAMINATION,
                  ],
                  failure_split: [...LANGUAGE_OPERATOR_FAILURE_SPLIT],
                }
              : {}),
            note: 'Supplement only; does not replace Strong PASS.',
          }
        : undefined,
      verdicts: ['PASS', 'SOFT_FAIL', 'FAIL'],
    },
    reviews: items.map(({ blind_id, trial }) => ({
      blind_id,
      title: trial.title,
      dream: trial.dream,
      question: trial.question,
      technical_error: trial.technical_error ?? trial.parse_error,
      scores: {
        epistemic_integrity: null,
        dream_specificity: null,
        openness_non_leading: null,
        natural_language: null,
        psychological_aliveness: null,
        proportionality: null,
        non_template_quality: null,
      },
      hard_flags: {
        INVENTED_AFFECT_OR_MOTIVE: null,
        INVENTED_RELATION: null,
        INVENTED_CONFLICT_OR_PATHOLOGY: null,
        EMBEDDED_INTERPRETATION: null,
        WAKING_LIFE_INFERENCE: null,
        FACTUAL_DREAM_INVENTION: null,
      },
      editorial_flags: {
        SIGNIFICANCE_INFLATION: null,
        BANAL_INFLATION: null,
        QUESTION_SHAPED_PARAPHRASE: null,
        FORCED_RELATIONAL_STRUCTURE: null,
        ARBITRARY_JUXTAPOSITION: null,
        LEADING_QUESTION: null,
        NON_ACTION_INTERPRETATION: null,
        UNNATURAL_LANGUAGE: null,
        GENERIC_REUSABLE_QUESTION: null,
        TEMPLATE_COLLAPSE: null,
        WEAK_PSYCHOLOGICAL_ALIVENESS: null,
        OVERCOMPLEX_WORDING: null,
        OTHER: null,
      },
      experiment_failure_modes: activeMethod.experiment
        ? Object.fromEntries(
            MINIMALISM_EXPERIMENT_FAILURE_MODES.map((flag) => [flag, null])
          )
        : undefined,
      would_i_want_to_answer: null,
      ...(usesUxSheet(activeMethod)
        ? {
            pull_to_answer: null,
            felt_read: null,
            ...(usesHoldsTheCharge(activeMethod)
              ? {
                  holds_the_charge: null,
                }
              : {}),
            ...(activeMethod.surgicalAttention
              ? {
                  ordinary_material_class: null,
                  multi_anchor_supported: null,
                }
              : {}),
            ...(usesSelectionRubricLeakage(activeMethod)
              ? {
                  selection_rubric_leakage: null,
                  ...(activeMethod.selectionLanguageDecoupling ||
                  activeMethod.languageOperator
                    ? {
                        selection_rubric_leakage_subclass: null,
                      }
                    : {}),
                }
              : {}),
            ...(usesLanguageOperatorSheet(activeMethod)
              ? {
                  first_read_clarity: null,
                  dream_native_language: null,
                  syntactic_ease: null,
                  abstractness_burden: null,
                  exact_sentence_product_gate: null,
                  realization_contamination: Object.fromEntries(
                    LANGUAGE_OPERATOR_REALIZATION_CONTAMINATION.map((flag) => [
                      flag,
                      null,
                    ])
                  ),
                  failure_split: null,
                }
              : {}),
          }
        : {}),
      verdict: null,
      template_analysis: {
        question_architecture: null,
        anchor_construction: null,
        grammatical_operator: null,
        relation_coexistence_framing: null,
        what_changes_framing: null,
        generic_experiential_framing: null,
        repeated_abstract_operators: [],
      },
      rationale: '',
    })),
  };
}

async function runWithConcurrency<Input, Output>(
  inputs: Input[],
  concurrency: number,
  task: (input: Input) => Promise<Output>
): Promise<Output[]> {
  const results = new Array<Output>(inputs.length);
  let nextIndex = 0;
  const workers = Array.from(
    { length: Math.min(concurrency, inputs.length) },
    async () => {
      while (nextIndex < inputs.length) {
        const currentIndex = nextIndex;
        nextIndex += 1;
        results[currentIndex] = await task(inputs[currentIndex]);
      }
    }
  );
  await Promise.all(workers);
  return results;
}

async function main() {
  const activeMethod = resolveActiveMethod();
  const benchmarkMode = liveBenchmarkEnabled();
  const freezeValidationMode = freezeValidationEnabled();
  const developmentStressMode = developmentStressEnabled();
  if (freezeValidationMode && benchmarkMode) {
    throw new Error(
      'REFLECTIVE_QUESTION_FREEZE_VALIDATION cannot be combined with REFLECTIVE_QUESTION_LIVE_BENCHMARK.'
    );
  }
  if (developmentStressMode && freezeValidationMode) {
    throw new Error(
      'REFLECTIVE_QUESTION_DEVELOPMENT_STRESS cannot be combined with REFLECTIVE_QUESTION_FREEZE_VALIDATION.'
    );
  }
  if (developmentStressMode && benchmarkMode) {
    throw new Error(
      'REFLECTIVE_QUESTION_DEVELOPMENT_STRESS cannot be combined with REFLECTIVE_QUESTION_LIVE_BENCHMARK.'
    );
  }
  if (activeMethod.languageOperator && benchmarkMode) {
    throw new Error(
      'REFLECTIVE_QUESTION_LANGUAGE_OPERATOR cannot be combined with REFLECTIVE_QUESTION_LIVE_BENCHMARK. Use the development-stress fixture, not the historical 50.'
    );
  }
  if (activeMethod.languageOperator && freezeValidationMode) {
    throw new Error(
      'REFLECTIVE_QUESTION_LANGUAGE_OPERATOR cannot be combined with REFLECTIVE_QUESTION_FREEZE_VALIDATION. The 60-dream set is development-stress for this experiment, not freeze validation.'
    );
  }
  if (activeMethod.languageOperatorCandidateB && benchmarkMode) {
    throw new Error(
      'REFLECTIVE_QUESTION_LANGUAGE_OPERATOR_CANDIDATE_B cannot be combined with REFLECTIVE_QUESTION_LIVE_BENCHMARK. Use the 18-dream development set only.'
    );
  }
  if (activeMethod.languageOperatorCandidateB && freezeValidationMode) {
    throw new Error(
      'REFLECTIVE_QUESTION_LANGUAGE_OPERATOR_CANDIDATE_B cannot be combined with REFLECTIVE_QUESTION_FREEZE_VALIDATION.'
    );
  }
  if (activeMethod.languageOperatorCandidateB && developmentStressMode) {
    throw new Error(
      'REFLECTIVE_QUESTION_LANGUAGE_OPERATOR_CANDIDATE_B cannot be combined with REFLECTIVE_QUESTION_DEVELOPMENT_STRESS. No 120-run.'
    );
  }
  if (developmentStressMode && !activeMethod.languageOperator) {
    throw new Error(
      'REFLECTIVE_QUESTION_DEVELOPMENT_STRESS requires Language + Reflective Operator R&D.'
    );
  }
  if (freezeValidationMode && activeMethod.experiment) {
    throw new Error(
      'REFLECTIVE_QUESTION_FREEZE_VALIDATION cannot be combined with REFLECTIVE_QUESTION_EXPERIMENT.'
    );
  }
  if (freezeValidationMode && activeMethod.witnessedOpening) {
    throw new Error(
      'REFLECTIVE_QUESTION_FREEZE_VALIDATION cannot be combined with REFLECTIVE_QUESTION_WITNESSED_OPENING.'
    );
  }
  if (freezeValidationMode && activeMethod.surgicalAttention) {
    throw new Error(
      'REFLECTIVE_QUESTION_FREEZE_VALIDATION cannot be combined with REFLECTIVE_QUESTION_SURGICAL_ATTENTION.'
    );
  }
  if (
    freezeValidationMode &&
    !activeMethod.selectionLanguageDecoupling &&
    !activeMethod.relationEligibilityAblation
  ) {
    throw new Error(
      'REFLECTIVE_QUESTION_FREEZE_VALIDATION requires Selection Language Decoupling or Relation Eligibility Ablation.'
    );
  }
  const largeSetMode =
    benchmarkMode || freezeValidationMode || developmentStressMode;
  const candidateBMode = Boolean(activeMethod.languageOperatorCandidateB);
  const fixtureRelativePath = candidateBMode
    ? LANGUAGE_OPERATOR_CANDIDATE_B_FIXTURE
    : freezeValidationMode || developmentStressMode
      ? V131_FREEZE_VALIDATION_FIXTURE
      : benchmarkMode
        ? LIVE_BENCHMARK_FIXTURE
        : 'testing/live-scenarios/reflective-questions-golden-set.v1.json';
  const fixturePath = path.join(process.cwd(), fixtureRelativePath);
  const goldenSet = JSON.parse(readFileSync(fixturePath, 'utf8')) as GoldenSet;
  if (candidateBMode) {
    if (goldenSet.cases.length !== LANGUAGE_OPERATOR_CANDIDATE_B_CASE_COUNT) {
      throw new Error(
        `Candidate B development set must keep ${LANGUAGE_OPERATOR_CANDIDATE_B_CASE_COUNT} dreams.`
      );
    }
    if (
      goldenSet.cases.some(
        (testCase, index) =>
          testCase.id !== LANGUAGE_OPERATOR_CANDIDATE_B_CASE_IDS[index]
      )
    ) {
      throw new Error('Candidate B dream ids or ordering changed.');
    }
  } else if (freezeValidationMode || developmentStressMode) {
    validateFreezeValidation(goldenSet);
  } else if (benchmarkMode) {
    validateLiveBenchmark(goldenSet);
  } else {
    if (goldenSet.cases.length !== 8) {
      throw new Error('Oneiros Reader evaluation requires the unchanged frozen eight-dream set.');
    }
    const expectedCaseIds = [
      'conflict-injured-cat',
      'peaceful-underwater-breathing',
      'numinous-white-bird',
      'erotic-vital-river',
      'strange-neutral-museum-phone',
      'transformation-hands-wings',
      'explicit-affect-mother-relief',
      'ordinary-blue-cups',
    ];
    if (
      goldenSet.cases.some((testCase, index) => testCase.id !== expectedCaseIds[index])
    ) {
      throw new Error('Frozen dream ids or ordering changed.');
    }
  }
  const repeats = candidateBMode
    ? LANGUAGE_OPERATOR_CANDIDATE_B_REPEAT_COUNT
    : repeatCount();
  if (candidateBMode && repeats !== 1) {
    throw new Error('Candidate B runs exactly one generation per dream.');
  }
  if (largeSetMode && repeats !== 2) {
    throw new Error('The frozen live benchmark requires exactly two generations per dream.');
  }
  const supabaseUrl = getEnv(['EXPO_PUBLIC_SUPABASE_URL', 'SUPABASE_URL']).replace(/\/$/, '');
  const anonKey = getEnv(['EXPO_PUBLIC_SUPABASE_ANON_KEY', 'SUPABASE_ANON_KEY']);
  const endpoint = getEnv(['EXPO_PUBLIC_CUSTOM_GPT_ENDPOINT', 'CUSTOM_GPT_ENDPOINT']);
  if (!supabaseUrl || !anonKey || !endpoint) {
    throw new Error('Missing Supabase URL, anon key, or custom GPT endpoint.');
  }
  const token = await getAccessToken(supabaseUrl, anonKey);
  const jobs = Array.from({ length: repeats }, (_, repeatIndex) =>
    goldenSet.cases.map((testCase) => ({
      repeat: repeatIndex + 1,
      testCase,
    }))
  ).flat();
  let completedCount = 0;
  const reportProgress = (trial: Trial) => {
    completedCount += 1;
    if (largeSetMode) {
      process.stdout.write(
        `Completed blind benchmark trial ${completedCount}/${jobs.length}; valid=${trial.question ? 'yes' : 'no'}\n`
      );
      return;
    }
    process.stdout.write(
      `Completed ${trial.case_id} — repeat ${trial.repeat}/${repeats}; valid=${trial.question ? 'yes' : 'no'}; form=${trial.question ? sentenceForm(trial.question) : 'unavailable'}\n`
    );
  };
  const trials = await runWithConcurrency(
    jobs,
    largeSetMode ? benchmarkConcurrency() : jobs.length,
    async ({ repeat, testCase }): Promise<Trial> => {
      const startedAt = Date.now();
      let response: Response;
      try {
        response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: anonKey,
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            task: 'interpretation_standard',
            model: 'gpt-5.4',
            messages: [
              { role: 'system', content: activeMethod.prompt },
              { role: 'user', content: dreamInput(testCase) },
            ],
            temperature: 0.45,
            max_completion_tokens: 500,
            disable_anthropic_fallback: true,
          }),
        });
      } catch (error) {
        const trial = technicalFailureTrial({
          testCase,
          repeat,
          startedAt,
          error: `Network error: ${error instanceof Error ? error.message : String(error)}`,
          activeMethod,
        });
        reportProgress(trial);
        return trial;
      }
      const rawBody = await response.text();
      if (!response.ok) {
        const trial = technicalFailureTrial({
          testCase,
          repeat,
          startedAt,
          error: `HTTP ${response.status}: ${rawBody.slice(0, 240)}`,
          activeMethod,
        });
        reportProgress(trial);
        return trial;
      }
      let payload: Record<string, unknown>;
      try {
        payload = JSON.parse(rawBody) as Record<string, unknown>;
      } catch {
        const trial = technicalFailureTrial({
          testCase,
          repeat,
          startedAt,
          error: `Invalid JSON response: ${rawBody.slice(0, 240)}`,
          activeMethod,
        });
        reportProgress(trial);
        return trial;
      }
      const rawQuestion = extractContent(payload);
      const provider = response.headers.get('x-ai-provider')?.trim().toLowerCase()
        || inferProvider(payload);
      const model = response.headers.get('x-ai-model')?.trim()
        || (typeof payload.model === 'string' ? payload.model : null);
      if (provider !== 'openai' || !model?.toLowerCase().startsWith('gpt-5.4')) {
        const trial = technicalFailureTrial({
          testCase,
          repeat,
          startedAt,
          error: `Unexpected route: ${provider ?? 'unknown'}/${model ?? 'unknown'}.`,
          rawQuestion,
          provider,
          model,
          payload,
          activeMethod,
        });
        reportProgress(trial);
        return trial;
      }
      let question: string | null = null;
      let parseError: string | null = null;
      try {
        question = parseSingleQuestion(rawQuestion);
      } catch (error) {
        parseError = error instanceof Error ? error.message : String(error);
      }
      const trial: Trial = {
        case_id: testCase.id,
        categories: testCase.categories ?? (testCase.category ? [testCase.category] : []),
        length_band: testCase.length_band ?? null,
        narrative_features: testCase.narrative_features ?? [],
        validation_buckets: testCase.validation_buckets ?? [],
        title: testCase.title,
        dream: testCase.content,
        dream_word_count: countWords(testCase.content),
        repeat,
        prompt_id: activeMethod.id,
        prompt_version: activeMethod.version,
        exact_prompt: activeMethod.prompt,
        model_target: 'gpt-5.4',
        temperature: 0.45,
        max_completion_tokens: 500,
        fallback_disabled: true,
        raw_question: rawQuestion,
        question,
        parse_error: parseError,
        technical_error: null,
        sentence_form: question ? sentenceForm(question) : null,
        template_telemetry: question ? templateTelemetry(question) : null,
        latency_ms: Date.now() - startedAt,
        provider,
        model,
        cost: estimateAiCallCost(payload, provider),
      };
      reportProgress(trial);
      return trial;
    }
  );

  const generatedAt = new Date().toISOString();
  const outputDir = path.join(
    process.cwd(),
    'tmp',
    `${
      freezeValidationMode
        ? `${activeMethod.outputSlug}-${V131_FREEZE_VALIDATION_OUTPUT_SLUG_SUFFIX}`
        : developmentStressMode
          ? `${activeMethod.outputSlug}-${LANGUAGE_OPERATOR_DEVELOPMENT_STRESS_OUTPUT_SLUG_SUFFIX}`
          : benchmarkMode
            ? `${activeMethod.outputSlug}-live-benchmark`
            : activeMethod.outputSlug
    }-${generatedAt.replace(/[:.]/g, '-')}`
  );
  mkdirSync(outputDir, { recursive: true });
  writeFileSync(
    path.join(outputDir, 'results.json'),
    JSON.stringify(
      {
        generated_at: generatedAt,
        active_method_id: activeMethod.id,
        active_method_version: activeMethod.version,
        experiment_letter: activeMethod.experiment?.letter ?? null,
        witnessed_opening: activeMethod.witnessedOpening,
        surgical_attention: activeMethod.surgicalAttention,
        relation_eligibility_ablation: activeMethod.relationEligibilityAblation,
        selection_language_decoupling: activeMethod.selectionLanguageDecoupling,
        language_operator: activeMethod.languageOperator,
        language_operator_candidate_b: Boolean(
          activeMethod.languageOperatorCandidateB
        ),
        benchmark_mode: benchmarkMode,
        freeze_validation: freezeValidationMode,
        development_stress: developmentStressMode,
        benchmark_id: goldenSet.benchmark_id ?? null,
        frozen_fixture_path: fixtureRelativePath,
        frozen_fixture_version: goldenSet.version,
        frozen_fixture_declared_method_id: goldenSet.method_id,
        frozen_fixture_prompt_sha256_required:
          goldenSet.prompt_sha256_required ?? null,
        repeat_count: repeats,
        exact_prompt: activeMethod.prompt,
        prompt_sha256: activeMethod.sha256,
        task: 'interpretation_standard',
        model_target: 'gpt-5.4',
        temperature: 0.45,
        max_completion_tokens: 500,
        fallback_disabled: true,
        concurrency: largeSetMode ? benchmarkConcurrency() : jobs.length,
        candidate_generation_used: false,
        reviewer_call_used: false,
        ranking_used: false,
        rewrite_used: false,
        operator_system_used: false,
        deterministic_templates_used: false,
        golden_labels_exposed_to_model: false,
        production_deployment_performed: false,
        metrics: metrics(trials),
        trials,
      },
      null,
      2
    )
  );
  if (largeSetMode) {
    const items = blindItems(trials, generatedAt);
    const casesById = new Map(goldenSet.cases.map((testCase) => [testCase.id, testCase]));
    writeFileSync(
      path.join(outputDir, 'BLIND_REVIEW_PACKET.md'),
      blindReviewPacket({
        generatedAt,
        benchmark: goldenSet,
        items,
        activeMethod,
        freezeValidation: freezeValidationMode,
        developmentStress: developmentStressMode,
      })
    );
    writeFileSync(
      path.join(outputDir, 'BLIND_REVIEW_SHEET.json'),
      JSON.stringify(blindReviewSheet(items, activeMethod), null, 2)
    );
    writeFileSync(
      path.join(outputDir, 'BLIND_MANIFEST.json'),
      JSON.stringify(
        items.map(({ blind_id, trial }) => {
          const testCase = casesById.get(trial.case_id);
          return {
            blind_id,
            case_id: trial.case_id,
            repeat: trial.repeat,
            categories: trial.categories,
            length_band: trial.length_band,
            narrative_features: trial.narrative_features,
            validation_buckets: trial.validation_buckets,
            dream_word_count: trial.dream_word_count,
            reviewer_focus: testCase?.reviewer_focus ?? null,
            forbidden_inventions: testCase?.forbidden_inventions ?? [],
          };
        }),
        null,
        2
      )
    );
  } else if (candidateBMode) {
    writeFileSync(
      path.join(outputDir, 'REVIEW_PACKET.md'),
      candidateBReviewPacket({ generatedAt, goldenSet, trials, activeMethod })
    );
    writeFileSync(
      path.join(outputDir, 'REVIEW_SHEET.json'),
      JSON.stringify(candidateBReviewSheet(goldenSet, trials), null, 2)
    );
  } else {
    writeFileSync(
      path.join(outputDir, 'REVIEW_PACKET.md'),
      reviewPacket({ generatedAt, goldenSet, repeats, trials, activeMethod })
    );
  }
  process.stdout.write(`${outputDir}\n`);
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
