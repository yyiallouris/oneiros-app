import {
  DEFAULT_ONEIROS_LANGUAGE_CODE,
  type OneirosLanguageCode,
} from './oneirosLanguages.ts';

export type ReflectiveQuestionCopy = {
  eyebrow: string;
  continueLabel: string;
  answerPlaceholder: string;
  answerSubmitLabel: string;
  fallbackQuestion: string;
};

/** UI microcopy and emergency fallback question; the psychological method remains language-neutral. */
export const REFLECTIVE_QUESTION_COPY: Record<
  OneirosLanguageCode,
  ReflectiveQuestionCopy
> = {
  en: {
    eyebrow: 'A question to carry',
    continueLabel: 'Continue exploring',
    answerPlaceholder: 'Write what comes…',
    answerSubmitLabel: 'Answer',
    fallbackQuestion: 'If you return to this dream for a moment, what do you notice now?',
  },
  el: {
    eyebrow: 'Μια ερώτηση να κρατήσεις',
    continueLabel: 'Συνέχισε την εξερεύνηση',
    answerPlaceholder: 'Γράψε ό,τι έρχεται…',
    answerSubmitLabel: 'Απάντησε',
    fallbackQuestion: 'Αν επιστρέψεις για λίγο σε αυτό το όνειρο, τι παρατηρείς τώρα;',
  },
  es: {
    eyebrow: 'Una pregunta para llevar contigo',
    continueLabel: 'Seguir explorando',
    answerPlaceholder: 'Escribe lo que venga…',
    answerSubmitLabel: 'Responder',
    fallbackQuestion: 'Si vuelves un momento a este sueño, ¿qué notas ahora?',
  },
  fr: {
    eyebrow: 'Une question à garder',
    continueLabel: 'Continuer l’exploration',
    answerPlaceholder: 'Écris ce qui vient…',
    answerSubmitLabel: 'Répondre',
    fallbackQuestion: 'Si tu reviens un instant dans ce rêve, que remarques-tu maintenant ?',
  },
  de: {
    eyebrow: 'Eine Frage zum Mitnehmen',
    continueLabel: 'Weiter erkunden',
    answerPlaceholder: 'Schreib, was kommt…',
    answerSubmitLabel: 'Antworten',
    fallbackQuestion: 'Wenn du für einen Moment in diesen Traum zurückkehrst, was bemerkst du jetzt?',
  },
  it: {
    eyebrow: 'Una domanda da portare con te',
    continueLabel: 'Continua a esplorare',
    answerPlaceholder: 'Scrivi ciò che viene…',
    answerSubmitLabel: 'Rispondi',
    fallbackQuestion: 'Se torni per un attimo in questo sogno, cosa noti ora?',
  },
  pt: {
    eyebrow: 'Uma pergunta para guardar',
    continueLabel: 'Continuar a explorar',
    answerPlaceholder: 'Escreve o que vier…',
    answerSubmitLabel: 'Responder',
    fallbackQuestion: 'Se voltares por um momento a este sonho, o que notas agora?',
  },
  nl: {
    eyebrow: 'Een vraag om mee te nemen',
    continueLabel: 'Verder verkennen',
    answerPlaceholder: 'Schrijf wat opkomt…',
    answerSubmitLabel: 'Antwoorden',
    fallbackQuestion: 'Als je even terugkeert naar deze droom, wat merk je nu?',
  },
  pl: {
    eyebrow: 'Pytanie, które warto zachować',
    continueLabel: 'Kontynuuj odkrywanie',
    answerPlaceholder: 'Napisz, co przychodzi…',
    answerSubmitLabel: 'Odpowiedz',
    fallbackQuestion: 'Jeśli na chwilę wrócisz do tego snu, co teraz zauważasz?',
  },
  ru: {
    eyebrow: 'Вопрос, который можно взять с собой',
    continueLabel: 'Продолжить исследование',
    answerPlaceholder: 'Напиши, что приходит…',
    answerSubmitLabel: 'Ответить',
    fallbackQuestion: 'Если ты ненадолго вернёшься в этот сон, что замечаешь сейчас?',
  },
  ja: {
    eyebrow: '心に留めておく問い',
    continueLabel: '探索を続ける',
    answerPlaceholder: '浮かんだことを書いてください…',
    answerSubmitLabel: '答える',
    fallbackQuestion: 'この夢に少しだけ戻るとしたら、いま何に気づきますか。',
  },
  zh: {
    eyebrow: '一个值得带走的问题',
    continueLabel: '继续探索',
    answerPlaceholder: '写下此刻出现的…',
    answerSubmitLabel: '回答',
    fallbackQuestion: '若你暂时回到这个梦里，此刻你会注意到什么？',
  },
};

export const REFLECTIVE_QUESTION_FALLBACK_VERSION =
  'reflective-question-fallback-v1' as const;

export const REFLECTIVE_QUESTION_FALLBACK_COPY_KEY =
  'dream_reflective_question_fallback' as const;

export function getReflectiveQuestionCopy(
  code: OneirosLanguageCode | null | undefined
): ReflectiveQuestionCopy {
  return REFLECTIVE_QUESTION_COPY[code ?? DEFAULT_ONEIROS_LANGUAGE_CODE];
}

export function getReflectiveQuestionFallback(
  code: OneirosLanguageCode | null | undefined
): string {
  return getReflectiveQuestionCopy(code).fallbackQuestion;
}
