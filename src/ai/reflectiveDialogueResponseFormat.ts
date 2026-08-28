import {
  ONEIROS_LANGUAGE_CODES,
  normalizeOneirosLanguageCode,
  type OneirosLanguageCode,
} from '../constants/oneirosLanguages.ts';
import {
  detectOneirosLanguageCode,
  languageContextAcceptsOutput,
  type ReflectiveLanguageContext,
} from './reflectiveLanguage.ts';

export const REFLECTIVE_DIALOGUE_RESPONSE_SCHEMA_VERSION = 3 as const;

export const REFLECTIVE_DIALOGUE_REPLY_MODES = [
  'sensory_detail',
  'correction',
  'not_knowing',
  'waking_association',
  'meaning_request',
  'positive_coherence',
  'grief_or_loss',
  'completion',
  'acknowledgment',
  'other',
] as const;

export type ReflectiveDialogueReplyMode =
  typeof REFLECTIVE_DIALOGUE_REPLY_MODES[number];

export type ReflectiveDialogueResponseFormat = {
  type: 'json_schema';
  json_schema: {
    name: 'oneiros_reflective_dialogue_answer_v1_8';
    strict: true;
    schema: Record<string, unknown>;
  };
};

export type ReflectiveDialogueAnswer = {
  answer: string;
  output_language: OneirosLanguageCode;
  reply_mode: ReflectiveDialogueReplyMode;
};

const REFLECTIVE_DIALOGUE_COMPLETION_COPY: Record<OneirosLanguageCode, string> = {
  en: 'Of course — we can leave it here.',
  el: 'Βέβαια — ας το αφήσουμε εδώ.',
  es: 'Claro — lo dejamos aquí.',
  fr: 'Bien sûr — nous pouvons en rester là.',
  de: 'Natürlich — wir können es dabei belassen.',
  it: 'Certo — possiamo lasciarlo qui.',
  pt: 'Claro — podemos deixar por aqui.',
  nl: 'Natuurlijk — we kunnen het hierbij laten.',
  pl: 'Oczywiście — możemy na tym zakończyć.',
  ru: 'Конечно — можем на этом остановиться.',
  ja: 'もちろんです。ここで終わりにしましょう。',
  zh: '当然可以，我们就停在这里。',
};

/** Explicit completion is product state, not another interpretation surface. */
export function resolveReflectiveDialogueAnswer(
  answer: ReflectiveDialogueAnswer
): string {
  return answer.reply_mode === 'completion'
    ? REFLECTIVE_DIALOGUE_COMPLETION_COPY[answer.output_language]
    : answer.answer;
}

export function buildReflectiveDialogueResponseFormat(): ReflectiveDialogueResponseFormat {
  return {
    type: 'json_schema',
    json_schema: {
      name: 'oneiros_reflective_dialogue_answer_v1_8',
      strict: true,
      schema: {
        type: 'object',
        additionalProperties: false,
        required: [
          'answer',
          'output_language',
          'reply_mode',
        ],
        properties: {
          answer: { type: 'string' },
          output_language: { type: 'string', enum: ONEIROS_LANGUAGE_CODES },
          reply_mode: { type: 'string', enum: REFLECTIVE_DIALOGUE_REPLY_MODES },
        },
      },
    },
  };
}

function extractObject(content: string): Record<string, unknown> | null {
  const cleaned = content.trim().replace(/^```json\s*/iu, '').replace(/```$/u, '').trim();
  try {
    const parsed = JSON.parse(cleaned) as unknown;
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? parsed as Record<string, unknown>
      : null;
  } catch {
    return null;
  }
}

export function parseReflectiveDialogueAnswer(
  content: string,
  languageContext: ReflectiveLanguageContext
):
  | { ok: true; data: ReflectiveDialogueAnswer }
  | { ok: false; errors: string[] } {
  const raw = extractObject(content);
  if (!raw) return { ok: false, errors: ['invalid_json'] };
  const answer = typeof raw.answer === 'string' ? raw.answer.trim() : '';
  const outputLanguage = normalizeOneirosLanguageCode(raw.output_language);
  const replyMode = REFLECTIVE_DIALOGUE_REPLY_MODES.includes(
    raw.reply_mode as ReflectiveDialogueReplyMode
  )
    ? raw.reply_mode as ReflectiveDialogueReplyMode
    : null;
  const errors: string[] = [];
  if (!answer || answer.length > 5000) errors.push('invalid_answer');
  if (!outputLanguage) errors.push('invalid_output_language');
  if (!replyMode) errors.push('invalid_reply_mode');
  if (
    outputLanguage &&
    !languageContextAcceptsOutput(languageContext, outputLanguage)
  ) {
    errors.push('wrong_language');
  }
  if (answer && outputLanguage) {
    const detectedAnswerLanguage = detectOneirosLanguageCode(answer);
    if (detectedAnswerLanguage && detectedAnswerLanguage !== outputLanguage) {
      errors.push('answer_language_mismatch');
    }
  }
  if (errors.length > 0) return { ok: false, errors: [...new Set(errors)] };
  return {
    ok: true,
    data: {
      answer,
      output_language: outputLanguage as OneirosLanguageCode,
      reply_mode: replyMode as ReflectiveDialogueReplyMode,
    },
  };
}
