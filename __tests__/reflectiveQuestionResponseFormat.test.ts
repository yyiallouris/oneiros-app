import { buildReflectiveQuestionResponseFormat } from '../src/ai/reflectiveQuestionResponseFormat';
import { parseReflectiveQuestionResult } from '../src/ai/reflectiveQuestionPrompt';
import { buildInitialReflectiveLanguageContext } from '../src/ai/reflectiveLanguage';

describe('Reflective Questions v5 structured output', () => {
  it('requires one strict single-pass result including operational commit checks', () => {
    const format = buildReflectiveQuestionResponseFormat();
    expect(format.json_schema.name).toBe('oneiros_reflective_question_single_pass_v5');
    expect(format.json_schema.strict).toBe(true);
    expect(format.json_schema.schema).toMatchObject({
      additionalProperties: false,
      required: expect.arrayContaining([
        'decision', 'answer_target', 'opening_mode', 'question', 'commit_checks',
      ]),
    });
    const properties = format.json_schema.schema.properties as Record<string, any>;
    expect(properties.decision.enum).toEqual(['question', 'abstain']);
    expect(properties.commit_checks.required).toEqual(expect.arrayContaining([
      'requires_missing_footage', 'preserves_polarity_and_agency', 'spoken_native_form',
    ]));
  });

  it('rejects an output language that conflicts with the frozen source language', () => {
    const parsed = parseReflectiveQuestionResult(JSON.stringify({
      decision: 'question', evidence_ids: ['D1'], living_edge: 'The umbrella turns',
      answer_target: 'what its turning holds', opening_mode: 'unresolved_relation',
      question: 'What remains as the umbrella turns above the table?', output_language: 'en',
      commit_checks: {
        shortest_answer_already_supplied: false, requires_missing_footage: false,
        portable_generic_shell: false, preserves_polarity_and_agency: true,
        spoken_native_form: true,
      },
      risk_flags: [], abstain_reason: null,
    }), new Set(['D1']), buildInitialReflectiveLanguageContext({
      dreamContent: 'Un paraguas rojo giraba sobre la mesa.', knownLanguageCode: 'es',
    }));
    expect(parsed).toEqual({ ok: false, errors: ['wrong_language'] });
  });
});
