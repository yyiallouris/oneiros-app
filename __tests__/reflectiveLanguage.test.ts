import {
  buildChatReflectiveLanguageContext,
  buildInitialReflectiveLanguageContext,
  buildReflectiveLanguageInstruction,
  detectOneirosLanguageCode,
  isSubstantiveReflectiveLanguageTurn,
  languageContextAcceptsOutput,
} from '../src/ai/reflectiveLanguage';

describe('Oneiros reflective language contract', () => {
  it('uses the dream narrative for the initial surface without guessing from script', () => {
    const context = buildInitialReflectiveLanguageContext({
      dreamContent: 'Una puerta verde se abrió lentamente.',
      knownLanguageCode: 'es-MX',
    });

    expect(context).toEqual({
      source: 'dream_narrative',
      sourceText: 'Una puerta verde se abrió lentamente.',
      expectedLanguageCode: 'es',
    });
    expect(languageContextAcceptsOutput(context, 'es')).toBe(true);
    expect(languageContextAcceptsOutput(context, 'en')).toBe(false);
  });

  it('follows a substantive latest user turn and preserves code-switches as source text', () => {
    const context = buildChatReflectiveLanguageContext({
      dreamContent: 'I stood at an open gate.',
      conversation: [],
      latestUserMessage: 'Ahora recuerdo que la puerta decía stay.',
    });

    expect(context.source).toBe('latest_substantive_user_turn');
    expect(context.sourceText).toContain('stay');
    expect(context.expectedLanguageCode).toBe('es');
  });

  it('detects a substantive code-switch conservatively across supported scripts', () => {
    expect(detectOneirosLanguageCode('Ahora estaba con mi hermana y no sentía nada.')).toBe('es');
    expect(detectOneirosLanguageCode('Quand la porte était ouverte avec mon frère.')).toBe('fr');
    expect(detectOneirosLanguageCode('Die Tür war offen, aber mein Zug blieb stehen.')).toBe('de');
    expect(detectOneirosLanguageCode('Στεκόμουν στην πόρτα και δεν φοβόμουν.')).toBe('el');
    expect(detectOneirosLanguageCode('Я стоял у двери и ничего не чувствовал.')).toBe('ru');
    expect(detectOneirosLanguageCode('駅の光が静かに揺れていた。')).toBe('ja');
    expect(detectOneirosLanguageCode('房间里的河向上流动。')).toBe('zh');
    expect(detectOneirosLanguageCode('Door sister memory')).toBeNull();
    expect(
      detectOneirosLanguageCode(
        'Eso cambia la escena por completo: ya no es una quietud extraña frente a una fuerza exterior, sino una quietud que se impone como amparo. Con el viento fuerte afuera y esa inmovilidad junto a la ventana abierta, la imagen no habla de lucha.'
      )
    ).not.toBe('it');
  });

  it('keeps the established artifact language for an ambiguous brief reply', () => {
    const context = buildChatReflectiveLanguageContext({
      dreamContent: '海の上に光があった。',
      conversation: [{
        role: 'assistant',
        content: '光は波とともに揺れています。',
        reflectiveQuestion: { languageCode: 'ja' },
      }],
      latestUserMessage: 'はい',
    });

    expect(context.source).toBe('established_conversation_language');
    expect(context.expectedLanguageCode).toBe('ja');
  });

  it('separates source selection from language-specific psychological rules', () => {
    expect(isSubstantiveReflectiveLanguageTurn('👍')).toBe(false);
    expect(isSubstantiveReflectiveLanguageTurn('I remember the water rising.')).toBe(true);

    const instruction = buildReflectiveLanguageInstruction(
      buildInitialReflectiveLanguageContext({
        dreamContent: '一条河从房间里向上流。',
        knownLanguageCode: 'zh',
      })
    );
    expect(instruction).toContain('natural spoken syntax');
    expect(instruction).toContain('output_language');
    expect(instruction).not.toMatch(/Greek|Japanese instructions|Chinese instructions/);
  });
});
