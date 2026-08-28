import { createHash } from 'crypto';
import {
  getOneirosLanguageName,
  type OneirosLanguageCode,
} from '../constants/oneirosLanguages';

/**
 * Narrow dream-evidence premise check. Production hardening, not an editorial
 * judge. Do not mutate this prompt after the SHA is frozen.
 */
export const QUESTION_PREMISE_CHECK_METHOD_ID =
  'oneiros-question-premise-check-v1.0.0-candidate' as const;
export const QUESTION_PREMISE_CHECK_PROMPT_ID =
  'oneiros-question-premise-check-prompt-v1.0.0-candidate' as const;
export const QUESTION_PREMISE_CHECK_PROMPT_VERSION = '1.0.0-candidate' as const;
export const QUESTION_PREMISE_CHECK_SCHEMA_VERSION = 1 as const;
export const QUESTION_PREMISE_CHECK_MODEL = 'gpt-5.4' as const;
export const QUESTION_PREMISE_CHECK_TEMPERATURE = 0 as const;
export const QUESTION_PREMISE_CHECK_TOKEN_LIMIT = 80 as const;
export const QUESTION_PREMISE_CHECK_TASK = 'reflective_question_validate' as const;

export const QUESTION_PREMISE_CHECK_PROMPT = `
You are the Oneiros Dream-Evidence Premise Check.

You do not interpret dreams.
You do not improve questions.
You do not rewrite questions.

Your only task is to determine whether the candidate question treats any
unsupported proposition as if it were already true in the reported dream.

Compare the question directly with RAW_DREAM.

FAIL when the question presupposes any relation, causality, motive, symbolic
meaning, emotional meaning, transformation, intention, significance, or factual
property that the dream report itself does not establish.

Examples of the TYPE of error, not literal phrases to match:

- event A is said to cause or maintain event/state B when the dream only reports
  A and B separately
- an object is described as receiving, resisting, protecting, inviting,
  separating, binding, planting, guiding, or transforming something when that
  relation is not actually reported
- a metaphor or interpretation is treated as a literal dream event
- an inferred psychological relation is embedded in the question as fact

Do NOT fail simply because the question asks for reflection.

Do NOT require the answer itself to already exist in the dream.

A question may invite fresh noticing of a relation or movement when the dream
actually establishes the relevant elements and their relation.

The distinction is:

ALLOWED:
asking what the dreamer notices about an actually reported relation or movement.

NOT ALLOWED:
embedding an inferred relation or causal claim into the question as though the
dream already stated it.

Return structured output only:

decision:
- PASS
- FAIL

No explanation.
No rewrite.
`.trim();

export const QUESTION_PREMISE_CHECK_DECISIONS = ['PASS', 'FAIL'] as const;
export type QuestionPremiseCheckDecision = (typeof QUESTION_PREMISE_CHECK_DECISIONS)[number];

export type QuestionPremiseCheckResponseFormat = {
  type: 'json_schema';
  json_schema: {
    name: string;
    strict: true;
    schema: Record<string, unknown>;
  };
};

export type QuestionPremiseCheckResult = {
  decision: QuestionPremiseCheckDecision;
};

export type QuestionPremiseCheckParseFailure =
  | 'invalid_json_object'
  | 'schema_invalid';

export function buildQuestionPremiseCheckResponseFormat(): QuestionPremiseCheckResponseFormat {
  return {
    type: 'json_schema',
    json_schema: {
      name: 'oneiros_question_premise_check_v1',
      strict: true,
      schema: {
        type: 'object',
        additionalProperties: false,
        required: ['decision'],
        properties: {
          decision: {
            type: 'string',
            enum: [...QUESTION_PREMISE_CHECK_DECISIONS],
          },
        },
      },
    },
  };
}

export function buildQuestionPremiseCheckUserMessage(params: {
  dream: string;
  question: string;
  outputLanguage: OneirosLanguageCode;
}): string {
  return [
    `<RAW_DREAM>\n${params.dream.trim()}\n</RAW_DREAM>`,
    `<QUESTION>\n${params.question.trim()}\n</QUESTION>`,
    `<OUTPUT_LANGUAGE>\n${params.outputLanguage} (${getOneirosLanguageName(params.outputLanguage)})\n</OUTPUT_LANGUAGE>`,
  ].join('\n\n');
}

export function buildQuestionPremiseCheckMessages(params: {
  dream: string;
  question: string;
  outputLanguage: OneirosLanguageCode;
}): Array<{ role: 'system' | 'user'; content: string }> {
  return [
    { role: 'system', content: QUESTION_PREMISE_CHECK_PROMPT },
    { role: 'user', content: buildQuestionPremiseCheckUserMessage(params) },
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

export function parseQuestionPremiseCheckResult(
  content: string
): { ok: true; data: QuestionPremiseCheckResult } | {
  ok: false;
  errors: QuestionPremiseCheckParseFailure[];
} {
  const raw = extractJsonObject(content);
  if (!raw) return { ok: false, errors: ['invalid_json_object'] };
  const keys = Object.keys(raw);
  if (keys.length !== 1 || keys[0] !== 'decision') {
    return { ok: false, errors: ['schema_invalid'] };
  }
  if (raw.decision !== 'PASS' && raw.decision !== 'FAIL') {
    return { ok: false, errors: ['schema_invalid'] };
  }
  return { ok: true, data: { decision: raw.decision } };
}

export const QUESTION_PREMISE_CHECK_BUNDLE = [
  QUESTION_PREMISE_CHECK_METHOD_ID,
  QUESTION_PREMISE_CHECK_PROMPT_ID,
  QUESTION_PREMISE_CHECK_PROMPT_VERSION,
  String(QUESTION_PREMISE_CHECK_SCHEMA_VERSION),
  QUESTION_PREMISE_CHECK_MODEL,
  QUESTION_PREMISE_CHECK_TASK,
  String(QUESTION_PREMISE_CHECK_TEMPERATURE),
  String(QUESTION_PREMISE_CHECK_TOKEN_LIMIT),
  QUESTION_PREMISE_CHECK_PROMPT,
  'raw-dream-and-question-only',
  'no-reading-no-gate-output-no-rewrite',
].join('\n---ONEIROS-QUESTION-PREMISE-CHECK-V1---\n');

export function hashQuestionPremiseCheckBundle(
  prompt: string = QUESTION_PREMISE_CHECK_BUNDLE
): string {
  return createHash('sha256').update(prompt.trim()).digest('hex');
}

export const QUESTION_PREMISE_CHECK_BUNDLE_SHA256 =
  'ceca45684d24ab1a0de374373b2c705e4eb75f7d18001a615246551289368130' as const;
