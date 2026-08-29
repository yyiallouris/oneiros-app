import {
  buildChatReflectiveLanguageContext,
  buildInitialReflectiveLanguageContext,
  buildReflectiveLanguageInstruction,
  auditReflectiveOutputLanguage,
  detectOneirosLanguageCode,
  isSubstantiveReflectiveLanguageTurn,
  languageContextAcceptsOutput,
} from '../src/ai/reflectiveLanguage';

describe('Oneiros reflective language contract', () => {
  it('uses an explicit language code or conservatively detects the initial dream language', () => {
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

    expect(buildInitialReflectiveLanguageContext({
      dreamContent: 'I was walking with my sister when the bridge opened.',
    }).expectedLanguageCode).toBe('en');
    expect(buildInitialReflectiveLanguageContext({
      dreamContent: 'Στεκόμουν στην πόρτα και δεν φοβόμουν.',
    }).expectedLanguageCode).toBe('el');
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
    const supportedCases = [
      ['en', 'I was standing with my sister when the open door moved in the wind.'],
      ['el', 'Στεκόμουν στην πόρτα και δεν φοβόμουν.'],
      ['es', 'Ahora estaba con mi hermana y no sentía nada.'],
      ['fr', 'Quand la porte était ouverte avec mon frère.'],
      ['de', 'Die Tür war offen, aber mein Zug blieb stehen.'],
      ['it', 'Quando la porta era aperta con mia sorella e non sentivo niente.'],
      ['pt', 'Quando eu estava com minha irmã e não sentia nada.'],
      ['nl', 'Het was stil, maar ik bleef met mijn zus bij de deur.'],
      ['pl', 'Kiedy byłam przy drzwiach, ale nic się nie poruszało.'],
      ['ru', 'Я стоял у двери и ничего не чувствовал.'],
      ['ja', '駅の光が静かに揺れていた。'],
      ['zh', '房间里的河向上流动。'],
    ] as const;
    for (const [code, text] of supportedCases) {
      expect(detectOneirosLanguageCode(text)).toBe(code);
      expect(buildInitialReflectiveLanguageContext({ dreamContent: text }).expectedLanguageCode)
        .toBe(code);
    }
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

  it('falls back to the dream language when a substantive short turn is ambiguous', () => {
    const context = buildChatReflectiveLanguageContext({
      dreamContent: 'I was standing with my sister while the open door moved in the wind.',
      conversation: [{ role: 'assistant', content: 'La puerta parece sostener el cambio.' }],
      latestUserMessage: 'Mostly relief in the throat.',
    });

    expect(context.source).toBe('latest_substantive_user_turn');
    expect(context.expectedLanguageCode).toBe('en');
  });

  it('audits prose without letting fixed English headings override the body language', () => {
    const context = buildInitialReflectiveLanguageContext({
      dreamContent: 'Στεκόμουν στην πόρτα και δεν φοβόμουν.',
    });
    expect(auditReflectiveOutputLanguage(
      '## Dream Movement\nΣτεκόσουν στην πόρτα και ο άνεμος περνούσε ήσυχα. Δεν υπήρχε φόβος, μόνο χώρος.',
      context
    )).toMatchObject({ valid: true, detectedLanguageCode: 'el' });
    expect(auditReflectiveOutputLanguage(
      '## Dream Movement\nThe door was open and the wind moved through the room while nothing felt dangerous.',
      context
    )).toMatchObject({ valid: false, detectedLanguageCode: 'en' });
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
