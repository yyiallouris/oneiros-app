import { createHash } from 'crypto';
import {
  getOneirosLanguageName,
  type OneirosLanguageCode,
} from '../../../../constants/oneirosLanguages';
import {
  QUESTION_INTEGRITY_GATE_VIOLATION_IDS,
  type QuestionIntegrityQuestionMode,
  type QuestionIntegrityViolationId,
} from './questionIntegrityGateCandidate';

/**
 * Offline Phase 2 Repair. status: frozen_rnd_reference.
 * CLOSED FOR CURRENT ARCHITECTURE after editorial FAIL. Do not mutate.
 */
export const QUESTION_REPAIR_RD_STATUS = 'frozen_rnd_reference' as const;
export const QUESTION_REPAIR_METHOD_ID =
  'oneiros-question-repair-v1.0.0-candidate' as const;
export const QUESTION_REPAIR_PROMPT_ID =
  'oneiros-question-repair-prompt-v1.0.0-candidate' as const;
export const QUESTION_REPAIR_PROMPT_VERSION = '1.0.0-candidate' as const;
export const QUESTION_REPAIR_SCHEMA_VERSION = 1 as const;
export const QUESTION_REPAIR_MODEL = 'gpt-5.4' as const;
export const QUESTION_REPAIR_TEMPERATURE = 0.35 as const;
export const QUESTION_REPAIR_TOKEN_LIMIT = 220 as const;
export const QUESTION_REPAIR_TASK = 'reflective_question_generate' as const;
export const QUESTION_REPAIR_BUNDLE_SHA256 =
  '0859fd5474124613b7c5cd610d4f48e65ccee6f0ea05b8d4ca382ddd5a53d53b' as const;

export const PHASE2_REJECTED_IDS = [
  'zh-faguo-mingzi:quick',
  'zh-faguo-mingzi:standard',
  'zh-faguo-mingzi:advanced',
  'ja-neon-home:advanced',
  'shared-scarf-at-harbor:quick',
  'sunrise-on-quiet-ridge:standard',
  'skin-turns-to-bark:standard',
] as const;

export const QUESTION_REPAIR_PROMPT = `
You repair one rejected Oneiros reflective question.

You are not a general editor. You are not a second Composer. You do not
rewrite merely to improve style, beauty, depth, or variety.

The generated interpretation is intentionally absent. Do not invent one.
Judge only against the reported dream.

Your job is to preserve the strongest valid imaginal movement already
present in the candidate question and make the smallest conceptual
correction required to remove the flagged integrity violations.

Preserve, when they are valid in the dream:

- the strongest concrete image or relation
- the live point already started by the dream
- CORE vs DEEPER depth
- natural spoken tone
- dream specificity

Do not:

- add new symbolic meaning
- ask for missing footage
- force a choice, ranking, comparison, or priority unless the dream
  itself explicitly poses that distinction
- translate the dream directly into waking life
- invent what happens next
- treat interpretation, metaphor, causality, motive, symbolic meaning,
  psychological category, or an inferred relation as dream fact
- ask the dreamer to confirm or inhabit an interpretation
- manufacture conflict in a restorative or still dream
- beautify the sentence for its own sake
- write a completely new question from scratch unless the candidate
  cannot be saved without doing so

CORE: keep one clear live movement.
DEEPER: keep genuinely existing relational complexity when the dream
supports it. Do not manufacture depth.

Write exactly one repaired question, only in the requested output
language. Do not explain the repair.
`.trim();

export type QuestionRepairResponseFormat = {
  type: 'json_schema';
  json_schema: {
    name: string;
    strict: true;
    schema: Record<string, unknown>;
  };
};

export type QuestionRepairResult = {
  question: string;
};

export type QuestionRepairParseFailure =
  | 'invalid_json_object'
  | 'schema_keys_invalid'
  | 'question_missing';

export function buildQuestionRepairResponseFormat(): QuestionRepairResponseFormat {
  return {
    type: 'json_schema',
    json_schema: {
      name: 'oneiros_question_repair_v1',
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

export function buildQuestionRepairUserMessage(params: {
  dream: string;
  rejectedQuestion: string;
  violations: readonly QuestionIntegrityViolationId[];
  outputLanguage: OneirosLanguageCode;
  questionMode: QuestionIntegrityQuestionMode;
}): string {
  const violationLines = params.violations.length > 0
    ? params.violations.join('\n')
    : '(none)';
  return [
    `<RAW_DREAM>\n${params.dream.trim()}\n</RAW_DREAM>`,
    `<REJECTED_CANDIDATE_QUESTION>\n${params.rejectedQuestion.trim()}\n</REJECTED_CANDIDATE_QUESTION>`,
    `<INTEGRITY_VIOLATIONS>\n${violationLines}\n</INTEGRITY_VIOLATIONS>`,
    `<OUTPUT_LANGUAGE>\n${params.outputLanguage} (${getOneirosLanguageName(params.outputLanguage)})\n</OUTPUT_LANGUAGE>`,
    `<QUESTION_MODE>\n${params.questionMode}\n</QUESTION_MODE>`,
  ].join('\n\n');
}

export function buildQuestionRepairMessages(params: {
  dream: string;
  rejectedQuestion: string;
  violations: readonly QuestionIntegrityViolationId[];
  outputLanguage: OneirosLanguageCode;
  questionMode: QuestionIntegrityQuestionMode;
}): Array<{ role: 'system' | 'user'; content: string }> {
  return [
    { role: 'system', content: QUESTION_REPAIR_PROMPT },
    { role: 'user', content: buildQuestionRepairUserMessage(params) },
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

export function parseQuestionRepairResult(
  content: string
): { ok: true; data: QuestionRepairResult } | {
  ok: false;
  errors: QuestionRepairParseFailure[];
} {
  const raw = extractJsonObject(content);
  if (!raw) return { ok: false, errors: ['invalid_json_object'] };

  const keys = Object.keys(raw);
  if (keys.length !== 1 || keys[0] !== 'question') {
    return { ok: false, errors: ['schema_keys_invalid'] };
  }

  const question = typeof raw.question === 'string' ? raw.question.replace(/\s+/gu, ' ').trim() : '';
  if (!question) return { ok: false, errors: ['question_missing'] };
  return { ok: true, data: { question } };
}

export const QUESTION_REPAIR_BUNDLE = [
  QUESTION_REPAIR_METHOD_ID,
  QUESTION_REPAIR_PROMPT_ID,
  QUESTION_REPAIR_PROMPT_VERSION,
  String(QUESTION_REPAIR_SCHEMA_VERSION),
  QUESTION_REPAIR_MODEL,
  QUESTION_REPAIR_TASK,
  String(QUESTION_REPAIR_TEMPERATURE),
  String(QUESTION_REPAIR_TOKEN_LIMIT),
  QUESTION_REPAIR_PROMPT,
  QUESTION_INTEGRITY_GATE_VIOLATION_IDS.join('|'),
  'no-reading-in-repair-input',
  'one-repair-then-frozen-gate-once',
  'no-second-repair-no-drop',
].join('\n---ONEIROS-QUESTION-REPAIR-V1---\n');

export function hashQuestionRepairBundle(
  prompt: string = QUESTION_REPAIR_BUNDLE
): string {
  return createHash('sha256').update(prompt.trim()).digest('hex');
}
