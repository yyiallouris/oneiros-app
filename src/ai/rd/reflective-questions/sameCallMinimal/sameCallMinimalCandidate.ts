import { createHash } from 'crypto';
import {
  getOneirosLanguageName,
  type OneirosLanguageCode,
} from '../../../../constants/oneirosLanguages';
import {
  buildInitialReflectionRequest,
  DREAM_REFLECTION_PROMPT_ID,
  END_MARKER_DREAM_READING,
  type DreamReflectionDepth,
  type DreamReflectionInput,
  type ReflectionPromptRequest,
} from '../../../dreamReflectionPrompt';

/**
 * Offline same-call R&D. status: frozen_rnd_reference.
 * Prompt contents are frozen. Production may import this file only through
 * `src/ai/reflectiveQuestionPipeline.ts`. Client must not import it.
 * The standalone method ID remains denied for deploy-as-the-production-method.
 */
export const SAME_CALL_MINIMAL_RD_STATUS = 'frozen_rnd_reference' as const;
export const SAME_CALL_MINIMAL_MODEL = 'gpt-5.4' as const;
export const SAME_CALL_MINIMAL_QUESTION_TOKEN_BUFFER = 200 as const;
export const SAME_CALL_MINIMAL_READING_DEPTHS = [
  'quick',
  'standard',
  'advanced',
] as const satisfies readonly DreamReflectionDepth[];

export type SameCallQuestionMode = 'CORE' | 'DEEPER';
export type SameCallMinimalVariant = 'v1.1.0' | 'v1.2.0';

export const SAME_CALL_MINIMAL_V11_METHOD_ID =
  'oneiros-same-call-minimal-v1.1.0-candidate' as const;
export const SAME_CALL_MINIMAL_V11_PROMPT_ID =
  'oneiros-same-call-minimal-prompt-v1.1.0-candidate' as const;
export const SAME_CALL_MINIMAL_V11_PROMPT_VERSION = '1.1.0-candidate' as const;
export const SAME_CALL_MINIMAL_V11_BUNDLE_SHA256 =
  '8e0edada074545954c77b10fa7558a41c40a7529caccfd4dfec5c60fe6cf0dc2' as const;

export const SAME_CALL_MINIMAL_METHOD_ID =
  'oneiros-same-call-minimal-v1.2.0-candidate' as const;
export const SAME_CALL_MINIMAL_PROMPT_ID =
  'oneiros-same-call-minimal-prompt-v1.2.0-candidate' as const;
export const SAME_CALL_MINIMAL_PROMPT_VERSION = '1.2.0-candidate' as const;
export const SAME_CALL_MINIMAL_BUNDLE_SHA256 =
  '4506c8981c1e0f38edcb641bf89e59126bfdafe64a3adff99a94a2d1a12e81f7' as const;

export const SAME_CALL_MINIMAL_V11_QUESTION_PROMPT = `
After the reading, write exactly one natural reflective question.

Its purpose is not to deepen, extend, summarize, or refine the interpretation
you just wrote. Step back from the reading toward the dream itself.
The question may be simpler than the reading.

Invite the dreamer back into one concrete living moment of the dream: an image,
gesture, relation, bodily position, atmosphere, affect, or unfinished movement.

Prefer direct dream re-entry over conceptual reflection. A simple image-near
question is preferable to a clever, poetic, or conceptually sophisticated one.

Stay with what actually appears in the dream. Do not introduce a new symbolic
meaning, psychological category, abstraction, motive, event, or distinction
that the dream itself does not make.

Revisiting an image, feeling, gesture, or moment already stated in the dream is
allowed and often preferable when it reopens the experience rather than merely
asks for factual repetition.

Do not ask the dreamer to rank, compare, prioritize, select, or choose between
dream elements unless that distinction or choice is explicitly present in the
dream itself.

Do not manufacture a choice through disjunctive forms in any language
(e.g. "or", "ή", "还是", "或者") unless that choice is explicitly posed by
the dream itself.

Keep the question inside the dream whenever possible. Do not translate the
dream directly into waking life. Refer to the dreamer's present relationship
to an image only when direct dream re-entry would feel artificial.

QUESTION MODE:

CORE:
Prefer one clear, concrete image, moment, gesture, atmosphere, or relation.

DEEPER:
You may hold a more complex relation or tension only when it is already present
in the dream. Remain equally image-near, natural, and concise. Do not become
more abstract, interpretive, poetic, or longer merely to feel deeper.

Write exactly one question, only in the requested output language.
Do not explain your choice.
`.trim();

export const SAME_CALL_MINIMAL_QUESTION_PROMPT = `
After the reading, write exactly one natural, image-led reflective question.

PURPOSE

The question is a hinge back into the dream, not a second interpretation.

Return toward one live point already present in the dream: a relation, movement,
shift, threshold, unresolved gesture, affective change, bodily position,
atmosphere, tension, arrival, or settling that the dream itself has created.

A live point does not require conflict, tension, or unresolvedness.
In restorative or cohesive dreams it may be an arrival, settling, shift in
atmosphere, deepening of presence, or other movement already present in the dream.

The question should let something already present in the dream become active
again in attention or relation — not by imagining what happens next.

It may shift attention, bring already-connected dream elements into relation,
or stay more closely with a change that is already happening.

It must not add new dream content, symbolic meaning, motive, psychological
category, event, or waking-life equivalent.

Think: change perspective, not dream content.


ALIVENESS

Do not merely paraphrase the scene or ask the dreamer to restate information
already supplied.

Do not turn image-nearness into a memory test.

Do not ask for an unreported sensory or perceptual fact — what something looked,
sounded, felt, smelled, or physically felt like — as though the dreamer should
retrieve a missing detail.

When experiential sensing is useful, invite fresh noticing of a relation,
movement, tension, change, atmosphere, or felt quality already present in the
reported scene. Do not ask the dreamer to invent missing sensory footage.

Prefer a question that engages the dream's own verbs, relations, changes, or
unfinished movements over a generic "How is/was this moment?" construction.

Do not force any particular question form.


BOUNDARIES

Stay answerable to what actually appears in the dream.

Do not translate the dream directly into waking life.

Do not introduce a new symbolic meaning, abstraction, motive, event, or
distinction that the dream itself does not make.

Do not ask the dreamer to rank, compare, prioritize, select, or choose between
dream elements unless that distinction or choice explicitly exists in the dream.

Do not manufacture a binary through disjunctive phrasing unless the dream itself
poses that choice.

Revisiting something already stated is welcome when the question opens its
relation, movement, tension, change, or felt quality rather than simply asking
for the fact again.


QUESTION MODE

CORE:

Open one clear live point.

Keep the question direct, specific, natural, and light enough to enter
immediately.


DEEPER:

You may hold more than one already-connected element, relation, or unresolved
movement in the same question when the dream genuinely supports it.

Greater depth means greater fidelity to the dream's existing complexity,
not greater abstraction, interpretation, poetry, or length.

Do not invent complexity merely to differentiate DEEPER from CORE.


Before outputting, silently check:

1. Would answering this require returning to this specific dream?

2. Does answering invite fresh contact with an already-present movement,
   relation, shift, tension, atmosphere, or quality, rather than merely repeat
   the dream report or retrieve missing footage?

3. Is there an actual relation, movement, shift, tension, threshold, arrival,
   or change carrying the question, rather than merely a scene being pointed at?

4. Could essentially the same question fit many unrelated dreams just by
   swapping the nouns? If yes, make it more specific to this dream's actual
   movement or relation.

5. Am I changing only the angle of attention, or am I changing the dream itself?
   Change only the angle of attention.

Write exactly one question, only in the requested output language.
Do not explain your choice.
`.trim();

export type SameCallMinimalRequestParams = {
  dream: DreamReflectionInput;
  depth: DreamReflectionDepth;
  outputLanguage: OneirosLanguageCode;
  variant?: SameCallMinimalVariant;
};

export type SameCallSplit = {
  reading: string;
  question: string | null;
};

export function mapReadingDepthToQuestionMode(
  depth: DreamReflectionDepth
): SameCallQuestionMode {
  return depth === 'advanced' ? 'DEEPER' : 'CORE';
}

export function sameCallMinimalQuestionPrompt(
  variant: SameCallMinimalVariant = 'v1.2.0'
): string {
  return variant === 'v1.1.0'
    ? SAME_CALL_MINIMAL_V11_QUESTION_PROMPT
    : SAME_CALL_MINIMAL_QUESTION_PROMPT;
}

export function buildSameCallMinimalWrapper(params: {
  outputLanguage: OneirosLanguageCode;
  questionMode: SameCallQuestionMode;
}): string {
  return [
    '<OUTPUT_LANGUAGE>',
    params.outputLanguage,
    '</OUTPUT_LANGUAGE>',
    '',
    '<QUESTION_MODE>',
    params.questionMode,
    '</QUESTION_MODE>',
  ].join('\n');
}

export function buildSameCallMinimalRequest(
  params: SameCallMinimalRequestParams
): ReflectionPromptRequest {
  const variant = params.variant ?? 'v1.2.0';
  const request = buildInitialReflectionRequest(params.dream, params.depth);
  const questionMode = mapReadingDepthToQuestionMode(params.depth);
  const wrapper = buildSameCallMinimalWrapper({
    outputLanguage: params.outputLanguage,
    questionMode,
  });
  const system = request.messages.filter((message) => message.role === 'system');
  const user = request.messages.filter((message) => message.role === 'user');
  return {
    ...request,
    tokenLimit: request.tokenLimit + SAME_CALL_MINIMAL_QUESTION_TOKEN_BUFFER,
    messages: [
      ...system,
      { role: 'system', content: sameCallMinimalQuestionPrompt(variant) },
      ...user.map((message) => ({
        ...message,
        content: `${message.content}\n\n${wrapper}`,
      })),
    ],
  };
}

export function looksLikeReflectiveQuestion(value: string): boolean {
  const text = value.replace(/\s+/gu, ' ').trim();
  if (!text) return false;
  if (/[?？؟]$/u.test(text)) return true;
  if (/[;；]$/u.test(text) && /\p{Script=Greek}/u.test(text)) return true;
  if (/[\p{Script=Hiragana}\p{Script=Katakana}]/u.test(text)) {
    const stripped = text.replace(/[。．.]+$/u, '');
    if (/[か？?]$/u.test(stripped)) return true;
    if (/でしょう$/u.test(stripped)) return true;
  }
  return false;
}

export function extractTerminalInterrogative(value: string): {
  prefix: string;
  question: string | null;
} {
  const text = stripQuestionHeading(value).trim();
  if (!text) return { prefix: '', question: null };

  const end = findTerminalQuestionEnd(text);
  if (end < 0) return { prefix: '', question: null };

  const start = findLastSentenceStart(text, end);
  const question = text.slice(start, end).replace(/\s+/gu, ' ').trim();
  const prefix = text.slice(0, start).trim();
  if (looksLikeReflectiveQuestion(question)) {
    return { prefix, question };
  }
  if (looksLikeReflectiveQuestion(text)) {
    return { prefix: '', question: text.replace(/\s+/gu, ' ').trim() };
  }
  return { prefix: '', question: null };
}

export function visibleSameCallReading(content: string): string {
  const markerIndex = content.indexOf(END_MARKER_DREAM_READING);
  const beforeMarker = markerIndex >= 0 ? content.slice(0, markerIndex) : content;
  return splitSameCallReadingAndQuestion(beforeMarker).reading;
}

export function splitSameCallReadingAndQuestion(content: string): SameCallSplit {
  const withoutMarker = content
    .replace(new RegExp(`\\s*${END_MARKER_DREAM_READING}\\s*`, 'gu'), '\n\n')
    .replace(/\n{3,}/gu, '\n\n')
    .trim();
  if (!withoutMarker) return { reading: '', question: null };

  const blocks = withoutMarker.split(/\n\s*\n/u).map((block) => block.trim()).filter(Boolean);
  if (blocks.length === 0) return { reading: '', question: null };

  let questionIndex = -1;
  for (let index = blocks.length - 1; index >= 0; index -= 1) {
    const extracted = extractTerminalInterrogative(blocks[index]);
    if (extracted.question) {
      questionIndex = index;
      break;
    }
  }

  if (questionIndex < 0) {
    return { reading: withoutMarker, question: null };
  }

  const extracted = extractTerminalInterrogative(blocks[questionIndex]);
  const readingParts = blocks.slice(0, questionIndex);
  if (extracted.prefix) readingParts.push(extracted.prefix);
  return {
    reading: readingParts.join('\n\n').trim(),
    question: extracted.question,
  };
}

function stripQuestionHeading(value: string): string {
  return value.replace(/^#{1,6}\s*(?:reflective\s+question|ερώτηση)?\s*\n+/iu, '').trim();
}

function findTerminalQuestionEnd(text: string): number {
  const trimmed = text.replace(/\s+$/u, '');
  if (looksLikeReflectiveQuestion(trimmed)) return trimmed.length;
  return -1;
}

function findLastSentenceStart(text: string, endIndex: number): number {
  const head = text.slice(0, endIndex);
  const punct = [...head.matchAll(/[.!?？؟。．][\s\n]+/gu)].pop();
  const newline = head.lastIndexOf('\n');
  let start = 0;
  if (typeof punct?.index === 'number') {
    start = Math.max(start, punct.index + punct[0].length);
  }
  if (newline >= 0) {
    start = Math.max(start, newline + 1);
  }
  return start;
}

export function describeSameCallOutputLanguage(code: OneirosLanguageCode): string {
  return `${getOneirosLanguageName(code)} (${code})`;
}

export const SAME_CALL_MINIMAL_V11_BUNDLE = [
  SAME_CALL_MINIMAL_V11_METHOD_ID,
  SAME_CALL_MINIMAL_V11_PROMPT_ID,
  SAME_CALL_MINIMAL_V11_PROMPT_VERSION,
  DREAM_REFLECTION_PROMPT_ID,
  SAME_CALL_MINIMAL_MODEL,
  SAME_CALL_MINIMAL_V11_QUESTION_PROMPT,
  'production-reader:quick|standard|advanced+terminal-question',
  'explicit-output-language+question-mode-wrapper',
  String(SAME_CALL_MINIMAL_QUESTION_TOKEN_BUFFER),
].join('\n---ONEIROS-SAME-CALL-MINIMAL-V1.1---\n');

export const SAME_CALL_MINIMAL_BUNDLE = [
  SAME_CALL_MINIMAL_METHOD_ID,
  SAME_CALL_MINIMAL_PROMPT_ID,
  SAME_CALL_MINIMAL_PROMPT_VERSION,
  DREAM_REFLECTION_PROMPT_ID,
  SAME_CALL_MINIMAL_MODEL,
  SAME_CALL_MINIMAL_QUESTION_PROMPT,
  'production-reader:quick|standard|advanced+terminal-question',
  'explicit-output-language+question-mode-wrapper',
  'live-point-not-conflict',
  String(SAME_CALL_MINIMAL_QUESTION_TOKEN_BUFFER),
].join('\n---ONEIROS-SAME-CALL-MINIMAL-V1.2---\n');

export function hashSameCallMinimalBundle(prompt: string = SAME_CALL_MINIMAL_BUNDLE): string {
  return createHash('sha256').update(prompt.trim()).digest('hex');
}

export function hashSameCallMinimalV11Bundle(): string {
  return hashSameCallMinimalBundle(SAME_CALL_MINIMAL_V11_BUNDLE);
}
