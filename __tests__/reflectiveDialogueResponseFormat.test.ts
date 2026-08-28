import {
  buildReflectiveDialogueResponseFormat,
  parseReflectiveDialogueAnswer,
  resolveReflectiveDialogueAnswer,
} from '../src/ai/reflectiveDialogueResponseFormat';
import { buildChatReflectiveLanguageContext } from '../src/ai/reflectiveLanguage';

describe('Oneiros reflective-dialogue structured answer', () => {
  const spanishContext = buildChatReflectiveLanguageContext({
    dreamContent: 'I stood beside a green door.',
    conversation: [],
    latestUserMessage: 'Ahora pienso en mi hermana y en esa puerta.',
  });

  it('uses a strict answer and language envelope', () => {
    const format = buildReflectiveDialogueResponseFormat();

    expect(format.json_schema.name).toBe('oneiros_reflective_dialogue_answer_v1_8');
    expect(format.json_schema.strict).toBe(true);
    expect(format.json_schema.schema).toEqual(
      expect.objectContaining({ additionalProperties: false })
    );
  });

  it('commits a natural answer in the latest substantive user language', () => {
    const parsed = parseReflectiveDialogueAnswer(
      JSON.stringify({
        answer: 'La puerta deja de ser solo un límite: ahora también sostiene la cercanía de tu hermana.',
        output_language: 'es',
        reply_mode: 'waking_association',
      }),
      spanishContext
    );

    expect(parsed).toEqual({
      ok: true,
      data: expect.objectContaining({ output_language: 'es' }),
    });
  });

  it('rejects declared and realized language drift', () => {
    expect(
      parseReflectiveDialogueAnswer(
        JSON.stringify({
          answer: 'The door now feels closer.',
          output_language: 'en',
          reply_mode: 'waking_association',
        }),
        spanishContext
      )
    ).toEqual({ ok: false, errors: expect.arrayContaining(['wrong_language']) });

    expect(
      parseReflectiveDialogueAnswer(
        JSON.stringify({
          answer: 'The door is still there with my sister and nothing changes.',
          output_language: 'es',
          reply_mode: 'waking_association',
        }),
        spanishContext
      )
    ).toEqual({
      ok: false,
      errors: expect.arrayContaining(['answer_language_mismatch']),
    });
  });

  it('rejects an invalid reply mode', () => {
    expect(
      parseReflectiveDialogueAnswer(
        JSON.stringify({
          answer: 'La puerta queda cerca de tu hermana.',
          output_language: 'es',
          reply_mode: 'invented_mode',
        }),
        spanishContext
      )
    ).toEqual({
      ok: false,
      errors: expect.arrayContaining(['invalid_reply_mode']),
    });
  });

  it('turns an explicit completion mode into stable localized closure copy', () => {
    expect(
      resolveReflectiveDialogueAnswer({
        answer: 'Trzymałeś sznur luźno.',
        output_language: 'pl',
        reply_mode: 'completion',
      })
    ).toBe('Oczywiście — możemy na tym zakończyć.');
  });
});
