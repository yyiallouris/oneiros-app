import { ONEIROS_LANGUAGE_CODES } from '../constants/oneirosLanguages';

export const REFLECTIVE_QUESTION_RESPONSE_SCHEMA_VERSION = 5 as const;

const RISK_FLAGS = [
  'unsupported_evidence', 'unstaged_relation', 'invented_motive',
  'repeats_answered_question', 'generic_shell', 'flat_or_clinical',
  'compound_question', 'advice_or_prescription', 'diagnostic_or_pathologizing',
  'waking_life_leap', 'wrong_language', 'length_violation', 'ignores_user_turn',
  'forced_choice', 'dream_continuation_only', 'low_psychological_aliveness',
] as const;

export type ReflectiveQuestionResponseFormat = {
  type: 'json_schema';
  json_schema: { name: string; strict: true; schema: Record<string, unknown> };
};

export function buildReflectiveQuestionResponseFormat(): ReflectiveQuestionResponseFormat {
  const nullableString = { type: ['string', 'null'] } as const;
  return {
    type: 'json_schema',
    json_schema: {
      name: 'oneiros_reflective_question_single_pass_v5',
      strict: true,
      schema: {
        type: 'object',
        additionalProperties: false,
        required: [
          'decision', 'evidence_ids', 'living_edge', 'answer_target',
          'opening_mode', 'question', 'output_language', 'commit_checks',
          'risk_flags', 'abstain_reason',
        ],
        properties: {
          decision: { type: 'string', enum: ['question', 'abstain'] },
          evidence_ids: { type: 'array', maxItems: 3, items: { type: 'string' } },
          living_edge: nullableString,
          answer_target: nullableString,
          opening_mode: {
            anyOf: [
              { type: 'string', enum: ['unresolved_relation', 'completed_relation', 'chat_continuation'] },
              { type: 'null' },
            ],
          },
          question: nullableString,
          output_language: {
            anyOf: [{ type: 'string', enum: ONEIROS_LANGUAGE_CODES }, { type: 'null' }],
          },
          commit_checks: {
            type: 'object',
            additionalProperties: false,
            required: [
              'shortest_answer_already_supplied', 'requires_missing_footage',
              'portable_generic_shell', 'preserves_polarity_and_agency',
              'spoken_native_form',
            ],
            properties: {
              shortest_answer_already_supplied: { type: 'boolean' },
              requires_missing_footage: { type: 'boolean' },
              portable_generic_shell: { type: 'boolean' },
              preserves_polarity_and_agency: { type: 'boolean' },
              spoken_native_form: { type: 'boolean' },
            },
          },
          risk_flags: { type: 'array', maxItems: 4, items: { type: 'string', enum: RISK_FLAGS } },
          abstain_reason: nullableString,
        },
      },
    },
  };
}
