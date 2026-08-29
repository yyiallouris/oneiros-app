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

/** V1 app chrome stays English; generated reflective content keeps its dream language. */
export const REFLECTIVE_QUESTION_UI_COPY = {
  eyebrow: 'Reflective Questions',
  continueLabel: 'Continue the conversation',
  answerPlaceholder: 'Write what comes…',
  answerSubmitLabel: 'Answer',
} as const;

export const CONTINUE_CONVERSATION_LABEL =
  REFLECTIVE_QUESTION_UI_COPY.continueLabel;

/** Shared v1 UI chrome plus a dream-language emergency fallback question. */
export const REFLECTIVE_QUESTION_COPY: Record<
  OneirosLanguageCode,
  ReflectiveQuestionCopy
> = {
  en: {
    ...REFLECTIVE_QUESTION_UI_COPY,
    fallbackQuestion: 'If you return to this dream for a moment, what do you notice now?',
  },
  el: {
    ...REFLECTIVE_QUESTION_UI_COPY,
    fallbackQuestion: 'Αν επιστρέψεις για λίγο σε αυτό το όνειρο, τι παρατηρείς τώρα;',
  },
  es: {
    ...REFLECTIVE_QUESTION_UI_COPY,
    fallbackQuestion: 'Si vuelves un momento a este sueño, ¿qué notas ahora?',
  },
  fr: {
    ...REFLECTIVE_QUESTION_UI_COPY,
    fallbackQuestion: 'Si tu reviens un instant dans ce rêve, que remarques-tu maintenant ?',
  },
  de: {
    ...REFLECTIVE_QUESTION_UI_COPY,
    fallbackQuestion: 'Wenn du für einen Moment in diesen Traum zurückkehrst, was bemerkst du jetzt?',
  },
  it: {
    ...REFLECTIVE_QUESTION_UI_COPY,
    fallbackQuestion: 'Se torni per un attimo in questo sogno, cosa noti ora?',
  },
  pt: {
    ...REFLECTIVE_QUESTION_UI_COPY,
    fallbackQuestion: 'Se voltares por um momento a este sonho, o que notas agora?',
  },
  nl: {
    ...REFLECTIVE_QUESTION_UI_COPY,
    fallbackQuestion: 'Als je even terugkeert naar deze droom, wat merk je nu?',
  },
  pl: {
    ...REFLECTIVE_QUESTION_UI_COPY,
    fallbackQuestion: 'Jeśli na chwilę wrócisz do tego snu, co teraz zauważasz?',
  },
  ru: {
    ...REFLECTIVE_QUESTION_UI_COPY,
    fallbackQuestion: 'Если ты ненадолго вернёшься в этот сон, что замечаешь сейчас?',
  },
  ja: {
    ...REFLECTIVE_QUESTION_UI_COPY,
    fallbackQuestion: 'この夢に少しだけ戻るとしたら、いま何に気づきますか。',
  },
  zh: {
    ...REFLECTIVE_QUESTION_UI_COPY,
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
