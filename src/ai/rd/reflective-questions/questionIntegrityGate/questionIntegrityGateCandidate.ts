import { createHash } from 'node:crypto';
import {
  getOneirosLanguageName,
  type OneirosLanguageCode,
} from '../../../../constants/oneirosLanguages.ts';

/**
 * Offline Integrity Gate R&D. status: frozen_rnd_reference.
 * CLOSED FOR CURRENT ARCHITECTURE. Semantic cop only. Do not tune this prompt.
 */
export const QUESTION_INTEGRITY_GATE_RD_STATUS = 'frozen_rnd_reference' as const;
export const QUESTION_INTEGRITY_GATE_METHOD_ID =
  'oneiros-question-integrity-gate-v1.0.0-candidate' as const;
export const QUESTION_INTEGRITY_GATE_PROMPT_ID =
  'oneiros-question-integrity-gate-prompt-v1.0.0-candidate' as const;
export const QUESTION_INTEGRITY_GATE_PROMPT_VERSION = '1.0.0-candidate' as const;
export const QUESTION_INTEGRITY_GATE_SCHEMA_VERSION = 1 as const;
export const QUESTION_INTEGRITY_GATE_MODEL = 'gpt-5.4' as const;
export const QUESTION_INTEGRITY_GATE_TEMPERATURE = 0 as const;
export const QUESTION_INTEGRITY_GATE_TOKEN_LIMIT = 180 as const;
export const QUESTION_INTEGRITY_GATE_TASK = 'reflective_question_validate' as const;
export const QUESTION_INTEGRITY_GATE_BUNDLE_SHA256 =
  'c1d8090fec6149adf492d1319657ba02bf5ae28ddfa5ce28114ef8a0df6629b2' as const;

export const QUESTION_INTEGRITY_GATE_VIOLATION_IDS = [
  'forced_choice',
  'ranking_or_comparison',
  'missing_footage',
  'invented_dream_content',
  'interpretation_as_premise',
  'interpretation_validation',
  'waking_life_translation',
  'invented_continuation',
  'language_mismatch',
] as const;

export type QuestionIntegrityViolationId =
  (typeof QUESTION_INTEGRITY_GATE_VIOLATION_IDS)[number];

export type QuestionIntegrityQuestionMode = 'CORE' | 'DEEPER';

export const QUESTION_INTEGRITY_GATE_PROMPT = `
You are a semantic integrity checker for Oneiros reflective questions.

You are not an editor. You are not a writer. You do not improve wording,
beauty, depth, aliveness, or style. You do not rewrite. You do not generate
another question. You do not decide whether a question is GOLD, SHIP, WEAK,
or FAIL. You do not reject a question merely because it is flat, simple,
quiet, restorative, or syntactically similar to other questions.

Judge ONLY the candidate question against the reported dream.

The generated interpretation is intentionally absent. Do not invent one.
The question must remain answerable to the dream itself.

QUESTION MODE is context only. Do not fail CORE for being simple. Do not
fail DEEPER for being simple when the dream does not support more
complexity. Do not require conflict, tension, or unresolvedness.

Flag a violation only when the question itself does one of the following:

1. forced_choice
Asks the dreamer to choose, select, or pick among dream elements, or to
take one of several posed alternatives, unless the dream report itself
explicitly poses that choice.

2. ranking_or_comparison
Asks the dreamer to rank, compare, prioritize, or say which element is
more central, more alive, more important, or closer to the center of
gravity, unless the dream report itself explicitly poses that comparison.

3. missing_footage
Asks for sensory, factual, or locational footage that the dream report
did not provide, as if the dreamer should retrieve missing film.

4. invented_dream_content
Introduces an image, event, distinction, motive, or relation that the
dream report does not establish.

5. interpretation_as_premise
Treats interpretation, metaphor, causality, symbolic meaning,
psychological category, or an inferred relation as if it were dream fact.

6. interpretation_validation
Asks the dreamer to confirm, agree with, or inhabit an interpretation.

7. waking_life_translation
Translates the dream directly into waking life, work, relationships, or
daytime equivalents.

8. invented_continuation
Asks what happens next, or invents a sequel the dream did not stage.

9. language_mismatch
The question is not in the requested output language.

Allow:

- genuine fresh reflection
- imaginal movement already started by the dream
- relations actually established by the dream
- restorative or still dreams without manufactured conflict
- revisiting something the dream already stated, when it reopens the
  experience rather than demanding missing facts

Do not use lexical matching as ground truth. A disjunctive word is not
itself a violation. A quiet or simple question is not itself a violation.
A repeated syntactic shell is not itself a violation.

Return only the structured object. If there is no integrity violation,
pass is true and violations is empty. If there is at least one integrity
violation, pass is false and violations lists only the matching IDs.
`.trim();

export type QuestionIntegrityGateResponseFormat = {
  type: 'json_schema';
  json_schema: {
    name: string;
    strict: true;
    schema: Record<string, unknown>;
  };
};

export type QuestionIntegrityGateResult = {
  pass: boolean;
  violations: QuestionIntegrityViolationId[];
};

export type QuestionIntegrityGateParseFailure =
  | 'invalid_json_object'
  | 'schema_invalid'
  | 'pass_violation_mismatch';

export function buildQuestionIntegrityGateResponseFormat(): QuestionIntegrityGateResponseFormat {
  return {
    type: 'json_schema',
    json_schema: {
      name: 'oneiros_question_integrity_gate_v1',
      strict: true,
      schema: {
        type: 'object',
        additionalProperties: false,
        required: ['pass', 'violations'],
        properties: {
          pass: { type: 'boolean' },
          violations: {
            type: 'array',
            items: {
              type: 'string',
              enum: [...QUESTION_INTEGRITY_GATE_VIOLATION_IDS],
            },
          },
        },
      },
    },
  };
}

export function buildQuestionIntegrityGateUserMessage(params: {
  dream: string;
  candidateQuestion: string;
  outputLanguage: OneirosLanguageCode;
  questionMode: QuestionIntegrityQuestionMode;
}): string {
  return [
    `<RAW_DREAM>\n${params.dream.trim()}\n</RAW_DREAM>`,
    `<CANDIDATE_QUESTION>\n${params.candidateQuestion.trim()}\n</CANDIDATE_QUESTION>`,
    `<OUTPUT_LANGUAGE>\n${params.outputLanguage} (${getOneirosLanguageName(params.outputLanguage)})\n</OUTPUT_LANGUAGE>`,
    `<QUESTION_MODE>\n${params.questionMode}\n</QUESTION_MODE>`,
  ].join('\n\n');
}

export function buildQuestionIntegrityGateMessages(params: {
  dream: string;
  candidateQuestion: string;
  outputLanguage: OneirosLanguageCode;
  questionMode: QuestionIntegrityQuestionMode;
}): Array<{ role: 'system' | 'user'; content: string }> {
  return [
    { role: 'system', content: QUESTION_INTEGRITY_GATE_PROMPT },
    { role: 'user', content: buildQuestionIntegrityGateUserMessage(params) },
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

function isViolationId(value: unknown): value is QuestionIntegrityViolationId {
  return typeof value === 'string'
    && (QUESTION_INTEGRITY_GATE_VIOLATION_IDS as readonly string[]).includes(value);
}

export function parseQuestionIntegrityGateResult(
  content: string
): { ok: true; data: QuestionIntegrityGateResult } | {
  ok: false;
  errors: QuestionIntegrityGateParseFailure[];
} {
  const raw = extractJsonObject(content);
  if (!raw) return { ok: false, errors: ['invalid_json_object'] };

  const keys = Object.keys(raw).sort();
  if (keys.length !== 2 || keys[0] !== 'pass' || keys[1] !== 'violations') {
    return { ok: false, errors: ['schema_invalid'] };
  }
  if (typeof raw.pass !== 'boolean' || !Array.isArray(raw.violations)) {
    return { ok: false, errors: ['schema_invalid'] };
  }
  if (!raw.violations.every(isViolationId)) {
    return { ok: false, errors: ['schema_invalid'] };
  }

  const violations = [...new Set(raw.violations)];
  if (raw.pass && violations.length > 0) {
    return { ok: false, errors: ['pass_violation_mismatch'] };
  }
  if (!raw.pass && violations.length === 0) {
    return { ok: false, errors: ['pass_violation_mismatch'] };
  }

  return { ok: true, data: { pass: raw.pass, violations } };
}

export const QUESTION_INTEGRITY_GATE_BUNDLE = [
  QUESTION_INTEGRITY_GATE_METHOD_ID,
  QUESTION_INTEGRITY_GATE_PROMPT_ID,
  QUESTION_INTEGRITY_GATE_PROMPT_VERSION,
  String(QUESTION_INTEGRITY_GATE_SCHEMA_VERSION),
  QUESTION_INTEGRITY_GATE_MODEL,
  QUESTION_INTEGRITY_GATE_TASK,
  String(QUESTION_INTEGRITY_GATE_TEMPERATURE),
  String(QUESTION_INTEGRITY_GATE_TOKEN_LIMIT),
  QUESTION_INTEGRITY_GATE_PROMPT,
  QUESTION_INTEGRITY_GATE_VIOLATION_IDS.join('|'),
  'no-reading-in-gate-input',
  'no-rewrite-no-generate-no-editorial-score',
].join('\n---ONEIROS-QUESTION-INTEGRITY-GATE-V1---\n');

export function hashQuestionIntegrityGateBundle(
  prompt: string = QUESTION_INTEGRITY_GATE_BUNDLE
): string {
  return createHash('sha256').update(prompt.trim()).digest('hex');
}
