import {
  DEFAULT_ONEIROS_LANGUAGE_CODE,
  type OneirosLanguageCode,
} from '../constants/oneirosLanguages';
import { getReflectiveQuestionFallback } from '../constants/reflectiveQuestionCopy';
import type { DreamReflectionDepth } from './dreamReflectionPrompt';
import {
  formatDreamEvidenceSpans,
  type DreamEvidenceSpan,
} from './reflectiveEvidence';
import {
  createComposerQuestionArtifact,
  REFLECTIVE_QUESTION_COMPOSER_ARTIFACT_SCHEMA_VERSION,
  REFLECTIVE_QUESTION_COMPOSER_METHOD_ID,
  REFLECTIVE_QUESTION_COMPOSER_METHOD_VERSION,
  REFLECTIVE_QUESTION_COMPOSER_PROMPT_ID,
  REFLECTIVE_QUESTION_COMPOSER_PROMPT_VERSION,
  type ReflectiveQuestionArtifactV10,
  type ReflectiveQuestionComposerDepth,
  type ReflectiveQuestionComposerSource,
} from './reflectiveQuestionPrompt';

export {
  REFLECTIVE_QUESTION_COMPOSER_ARTIFACT_SCHEMA_VERSION,
  REFLECTIVE_QUESTION_COMPOSER_METHOD_ID,
  REFLECTIVE_QUESTION_COMPOSER_METHOD_VERSION,
  REFLECTIVE_QUESTION_COMPOSER_PROMPT_ID,
  REFLECTIVE_QUESTION_COMPOSER_PROMPT_VERSION,
};

/** Canonical method id kept in this file so the deploy guard can hash the source. */
export const REFLECTIVE_QUESTION_COMPOSER_SOURCE_METHOD_ID =
  'oneiros-reflective-question-composer-v1.1.0-candidate' as const;
export const REFLECTIVE_QUESTION_COMPOSER_SCHEMA_VERSION =
  REFLECTIVE_QUESTION_COMPOSER_ARTIFACT_SCHEMA_VERSION;
export const REFLECTIVE_QUESTION_COMPOSER_MODEL = 'gpt-5.4' as const;
export const REFLECTIVE_QUESTION_COMPOSER_TEMPERATURE = 0.45 as const;
export const REFLECTIVE_QUESTION_COMPOSER_TOKEN_LIMIT = 360 as const;
export const REFLECTIVE_QUESTION_COMPOSER_TASK = 'reflective_question_generate' as const;
export const REFLECTIVE_QUESTION_COMPOSER_KILL_SWITCH_ENV =
  'ONEIROS_REFLECTIVE_QUESTION_COMPOSER_KILL_SWITCH' as const;
export const REFLECTIVE_QUESTION_COMPOSER_FALLBACK_KEY =
  'dream_reflective_question_fallback' as const;
export const REFLECTIVE_QUESTION_COMPOSER_FROZEN_ANCHOR_CORPUS_ID =
  'oneiros-frozen-anchor-readings-v1' as const;
export const REFLECTIVE_QUESTION_COMPOSER_FROZEN_ANCHOR_CORPUS_SHA256 =
  '2a1a8bc3a5b4a0019155e2856771c3eea4450be44e57ad1eeea0907d52738628' as const;

export const REFLECTIVE_QUESTION_COMPOSER_PROMPT = `
You write the reflective question that follows a Oneiros dream reading.

Read the raw dream and the completed reading.

Write exactly one natural, beautiful, post-Jungian reflective question that feels specific to this dream and makes the dreamer want to explore it further.

Treat the dream as a living symbolic experience, not as a puzzle to decode or a symptom to explain. Let the question deepen the dreamer's relationship with the dream rather than translate it into a fixed meaning.

Stay close to the dream's actual images, actions, relationships, atmosphere, or movement.

Do not invent anything that did not happen. Do not simply ask the dreamer to repeat something they already said or confirm the reading. Avoid generic therapy questions.

CORE: clear, alive and immediately understandable, but never shallow.

DEEPER: allow greater relational or psychological depth when the dream genuinely supports it, while remaining one natural question.

Write exactly one question, only in the requested output language. Do not explain your choice.
`.trim();

const USER_WRAPPER_TEMPLATE =
  '<RAW_DREAM_EVIDENCE>\\n{complete numbered D# spans}\\n</RAW_DREAM_EVIDENCE>\\n\\n' +
  '<FINAL_READING_READ_ONLY>\\n{exact completed reading}\\n</FINAL_READING_READ_ONLY>\\n\\n' +
  '<QUESTION_DEPTH>{core | deeper}\\n</QUESTION_DEPTH>\\n\\n' +
  '<OUTPUT_LANGUAGE>{Oneiros language code}</OUTPUT_LANGUAGE>';

export type ReflectiveQuestionComposerResponseFormat = {
  type: 'json_schema';
  json_schema: {
    name: string;
    strict: true;
    schema: Record<string, unknown>;
  };
};

export type ReflectiveQuestionComposerResult = {
  question: string;
};

export type ReflectiveQuestionComposerParseFailure =
  | 'invalid_json_object'
  | 'schema_keys_invalid'
  | 'question_missing';

export type ReflectiveQuestionComposerRejection =
  | 'provider_failure'
  | 'schema_rejection'
  | 'kill_switch';

export function mapReadingDepthToQuestionDepth(
  depth: DreamReflectionDepth
): ReflectiveQuestionComposerDepth {
  return depth === 'advanced' ? 'deeper' : 'core';
}

export function buildReflectiveQuestionComposerResponseFormat(): ReflectiveQuestionComposerResponseFormat {
  return {
    type: 'json_schema',
    json_schema: {
      name: 'oneiros_reflective_question_composer_v1_1',
      strict: true,
      schema: {
        type: 'object',
        additionalProperties: false,
        required: ['question'],
        properties: {
          question: { type: 'string' },
        },
      },
    },
  };
}

export function buildReflectiveQuestionComposerUserMessage(params: {
  evidenceSpans: DreamEvidenceSpan[];
  finalReading: string;
  depth: ReflectiveQuestionComposerDepth;
  outputLanguage: OneirosLanguageCode;
}): string {
  return [
    `<RAW_DREAM_EVIDENCE>\n${formatDreamEvidenceSpans(params.evidenceSpans)}\n</RAW_DREAM_EVIDENCE>`,
    `<FINAL_READING_READ_ONLY>\n${params.finalReading.trim()}\n</FINAL_READING_READ_ONLY>`,
    `<QUESTION_DEPTH>${params.depth}</QUESTION_DEPTH>`,
    `<OUTPUT_LANGUAGE>${params.outputLanguage}</OUTPUT_LANGUAGE>`,
  ].join('\n\n');
}

export function buildReflectiveQuestionComposerMessages(params: {
  evidenceSpans: DreamEvidenceSpan[];
  finalReading: string;
  depth: ReflectiveQuestionComposerDepth;
  outputLanguage: OneirosLanguageCode;
}): Array<{ role: 'system' | 'user'; content: string }> {
  return [
    { role: 'system', content: REFLECTIVE_QUESTION_COMPOSER_PROMPT },
    { role: 'user', content: buildReflectiveQuestionComposerUserMessage(params) },
  ];
}

function extractJsonObject(value: string): Record<string, unknown> | null {
  const cleaned = value.trim().replace(/^```json\s*/iu, '').replace(/```$/u, '').trim();
  try {
    const parsed = JSON.parse(cleaned) as unknown;
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? parsed as Record<string, unknown>
      : null;
  } catch {
    return null;
  }
}

export function parseReflectiveQuestionComposerResult(
  content: string
): { ok: true; data: ReflectiveQuestionComposerResult } | {
  ok: false;
  errors: ReflectiveQuestionComposerParseFailure[];
} {
  const raw = extractJsonObject(content);
  if (!raw) return { ok: false, errors: ['invalid_json_object'] };

  const errors: ReflectiveQuestionComposerParseFailure[] = [];
  const keys = Object.keys(raw);
  if (keys.length !== 1 || keys[0] !== 'question') {
    errors.push('schema_keys_invalid');
  }

  const question = typeof raw.question === 'string' ? raw.question.replace(/\s+/gu, ' ').trim() : '';
  if (!question) errors.push('question_missing');

  if (errors.length > 0 || !question) {
    return { ok: false, errors: [...new Set(errors)] };
  }

  return { ok: true, data: { question } };
}

export function composerRejectionFromErrors(
  _errors: readonly string[]
): Exclude<ReflectiveQuestionComposerRejection, 'provider_failure' | 'kill_switch'> {
  return 'schema_rejection';
}

export function isComposerKillSwitchEnabled(
  env: Record<string, string | undefined> | null | undefined = typeof process === 'undefined'
    ? null
    : process.env
): boolean {
  const value = env?.[REFLECTIVE_QUESTION_COMPOSER_KILL_SWITCH_ENV];
  return typeof value === 'string' && /^(1|true|yes)$/iu.test(value.trim());
}

export function createFallbackComposerArtifact(params: {
  id: string;
  createdAt: string;
  languageCode?: OneirosLanguageCode | null;
  depth: ReflectiveQuestionComposerDepth;
}): ReflectiveQuestionArtifactV10 {
  const languageCode = params.languageCode ?? DEFAULT_ONEIROS_LANGUAGE_CODE;
  return createComposerQuestionArtifact({
    id: params.id,
    createdAt: params.createdAt,
    question: getReflectiveQuestionFallback(languageCode),
    languageCode,
    depth: params.depth,
    source: 'fallback',
  });
}

export function createModelComposerArtifact(params: {
  id: string;
  createdAt: string;
  question: string;
  languageCode: OneirosLanguageCode;
  depth: ReflectiveQuestionComposerDepth;
  source?: ReflectiveQuestionComposerSource;
}): ReflectiveQuestionArtifactV10 {
  return createComposerQuestionArtifact({
    id: params.id,
    createdAt: params.createdAt,
    question: params.question,
    languageCode: params.languageCode,
    depth: params.depth,
    source: params.source ?? 'model',
  });
}

export const REFLECTIVE_QUESTION_COMPOSER_BUNDLE = [
  REFLECTIVE_QUESTION_COMPOSER_METHOD_ID,
  REFLECTIVE_QUESTION_COMPOSER_PROMPT_ID,
  REFLECTIVE_QUESTION_COMPOSER_PROMPT_VERSION,
  String(REFLECTIVE_QUESTION_COMPOSER_SCHEMA_VERSION),
  REFLECTIVE_QUESTION_COMPOSER_MODEL,
  String(REFLECTIVE_QUESTION_COMPOSER_TEMPERATURE),
  String(REFLECTIVE_QUESTION_COMPOSER_TOKEN_LIMIT),
  REFLECTIVE_QUESTION_COMPOSER_TASK,
  REFLECTIVE_QUESTION_COMPOSER_PROMPT,
  USER_WRAPPER_TEMPLATE,
  JSON.stringify(buildReflectiveQuestionComposerResponseFormat()),
  REFLECTIVE_QUESTION_COMPOSER_FALLBACK_KEY,
  REFLECTIVE_QUESTION_COMPOSER_FROZEN_ANCHOR_CORPUS_ID,
  REFLECTIVE_QUESTION_COMPOSER_FROZEN_ANCHOR_CORPUS_SHA256,
].join('\n---ONEIROS-REFLECTIVE-QUESTION-COMPOSER-V1---\n');
