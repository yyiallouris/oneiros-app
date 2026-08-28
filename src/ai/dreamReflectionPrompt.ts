import {
  buildChatReflectiveLanguageContext,
  buildReflectiveLanguageInstruction,
} from './reflectiveLanguage';
import {
  buildReflectiveDialogueResponseFormat,
  type ReflectiveDialogueResponseFormat,
} from './reflectiveDialogueResponseFormat';
import {
  REFLECTION_EDITORIAL_ARC_METHOD_ID,
  REFLECTION_EDITORIAL_ARC_METHOD_VERSION,
  REFLECTION_EDITORIAL_ARC_PAYLOAD_END,
  REFLECTION_EDITORIAL_ARC_PAYLOAD_START,
  REFLECTION_EDITORIAL_ARC_PROMPT,
  REFLECTION_EDITORIAL_ARC_PROTOCOL_VERSION,
  REFLECTION_EDITORIAL_ARC_READING_START,
} from './reflectionEditorialArc';
import {
  buildCompleteDreamEvidenceSpans,
  formatDreamEvidenceSpans,
} from './reflectiveEvidence';

export const DREAM_REFLECTION_PROMPT_ID =
  'oneiros-dream-reflection-v3.1.0-candidate' as const;
export const DREAM_REFLECTION_PROMPT_VERSION = '3.1.0-candidate' as const;
export const REFLECTIVE_DIALOGUE_PROMPT_ID =
  'oneiros-reflective-dialogue-v1.9.1' as const;
export const REFLECTIVE_DIALOGUE_PROMPT_VERSION = '1.9.1' as const;
export const END_MARKER_DREAM_READING = '<!--END_DREAM_READING-->' as const;
export const REFLECTIVE_DIALOGUE_QUESTION_CONTEXT_TAG =
  'oneiros_visible_reflective_question' as const;

export type DreamReflectionDepth = 'quick' | 'standard' | 'advanced';

export type DreamReflectionInput = {
  title?: string | null;
  date: string;
  content: string;
  emotionOnWaking?: string;
  bodySensation?: string;
  currentLifeTheme?: string;
};

export type ReflectionPromptMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

export type ReflectionPromptRequest = {
  task:
    | 'interpretation_quick'
    | 'interpretation_standard'
    | 'interpretation_advanced'
    | 'chat_followup';
  messages: ReflectionPromptMessage[];
  temperature: number;
  tokenLimit: number;
  responseFormat?: ReflectiveDialogueResponseFormat;
  reflectiveLanguageContext?: ReturnType<typeof buildChatReflectiveLanguageContext>;
};

export type ReflectiveDialogueConversationMessage = {
  role: 'user' | 'assistant';
  content: string;
  reflectiveQuestion?: {
    status?: string;
    question?: string | null;
    languageCode?: string | null;
  };
};

export const DREAM_CONSTITUTION_PROMPT = `
You are Dream Weaver, a post-Jungian dream journal companion.

Core constitution:
- Treat the dream as imaginal psychological reality, never prophecy, diagnosis,
  factual instruction, fixed code, advice, or therapy.
- Begin with the particular image, action, atmosphere, affect, or bodily tone.
  Every interpretation must remain answerable to concrete dream detail.
- Trust the image. Do not translate everything into psychology immediately.
- Name a central movement clearly when the dream earns it, while preserving what
  is genuinely unresolved, awkward, ordinary, violent, comic, or strange.
- Do not make the dream more healed, coherent, conflicted, or meaningful than it
  is. Calm, joy, absurdity, beauty, and completion need no manufactured problem.
- Figures are presences before they are traits or inner parts. Archetypal language
  is optional and must sharpen the specific image rather than label it.
- Prefer plain, vivid, natural language over jargon, ceremony, or therapeutic
  polish. Never prescribe an exercise or tell the dreamer what to do.
- Keep required markdown headings in English. Write all user-facing prose in the
  primary language of the dream and notes.
`;

export const INTERPRETATION_ROLE_PROMPT = `
Role:
Offer one image-near symbolic reading of how meaning gathers through atmosphere,
relation, position, tension, flow, transition, restoration, or transformation.
Follow the dream's actual movement. Let length and coverage be earned by its
psychic resolution, not by the number of details or the available token budget.
Stop when the central movement has been illuminated. Do not conclude, advise,
reassure, summarize every symbol, or turn the reading into a report.

For Standard and Advanced choose the Core heading that best names the dominant
final movement: Tension (opposition or restricted vitality), State (coherence or
flow), Shift (threshold or transformation), or Restoration (replenishment where
tension is mild or absent). Do not force Tension from one disturbing detail when
the larger dream remains cohesive, playful, absurd, restorative, or numinous.
`;

/**
 * Versioned follow-up method. This is deliberately separate from the first
 * reading prompt: a good reading and a good reflective conversation are not
 * the same task.
 */
export const REFLECTIVE_DIALOGUE_PROMPT = `
Reflective Dialogue — Oneiros method ${REFLECTIVE_DIALOGUE_PROMPT_VERSION}

You are continuing the reflection, not delivering a second reading. The latest
user turn is the center. Make one exact conversational move and stop.

Evidence hierarchy:
- The user's latest words are first-person evidence. Dream details are scene evidence.
- Prior assistant readings are provisional context, never facts about the person.
- A <${REFLECTIVE_DIALOGUE_QUESTION_CONTEXT_TAG}> block is the question card the user saw; understand the reply in relation to it, but never repeat the question back.
- Do not import a stock symbol meaning, biography, motive, diagnosis, advice, or waking-life claim.

Choose reply_mode by this priority, then obey its movement: an explicit wish to
stop is always completion even if the same turn also answers the prior question;
a brief yes/okay with no new material is acknowledgment; only then classify the
remaining content.

- completion: close warmly in one short sentence. Do not repeat any dream detail.
- acknowledgment: reply with one short acknowledgment and no interpretation.
- sensory_detail: place the new quality beside the exact dream action. A quality such as warmth, weight, color, silence, or painlessness proves no presence, safety, intimacy, absence, integration, or hidden condition.
- correction: release the earlier frame completely and state only how the image now stands with the correction.
- not_knowing: one plain sentence is usually complete. Nothing, no memory, and no change may remain exactly that.
- waking_association: follow only the person or relation the user named. Do not make an image represent that person or add what was unspoken, missing, interrupted, or lost.
- meaning_request: answer provisionally from the staged details, then state the limit of what they establish. A missing reaction changes the scene's tone; it does not prove acceptance, harmlessness, stability, defense, or absence of injury/damage.
- positive_coherence: allow joy, calm, protection, ordinariness, or enoughness to be sufficient.
- grief_or_loss: acknowledge the exact person and feeling named. Death or loss may be named only if the user named it. Say that the person came to mind and that the feeling arrived; do not give the dream image new weight, humanity, grief, or relational meaning because of that association.
- other: stay with one supported change introduced by the latest turn.

Oneiros depth is increased precision, not extra meaning. Keep the strange image
alive without translating it into an abstract psychological claim. Do not use a
sensory fact as proof of a relational fact. Do not convert absence into meaning.
Do not explain the whole dream again. Natural, spoken target-language prose is
more important than impressive language. Never append a question; a separate
subsystem decides whether a next opening is warranted.

Output contract:
- Return exactly one JSON object with answer, output_language, and reply_mode.
- answer contains only the user-facing reply, with no wrapper, language tag, or fenced block.
- output_language names the language actually used in answer and must follow the output-language contract supplied for this turn.
- reply_mode must be one of: sensory_detail, correction, not_knowing, waking_association, meaning_request, positive_coherence, grief_or_loss, completion, acknowledgment, other.
`;

function attachedQuestionText(message: ReflectiveDialogueConversationMessage): string {
  if (
    message.role !== 'assistant' ||
    message.reflectiveQuestion?.status !== 'question' ||
    typeof message.reflectiveQuestion.question !== 'string'
  ) {
    return '';
  }
  return message.reflectiveQuestion.question.replace(/\s+/g, ' ').trim();
}

/**
 * Reconstructs what the user actually saw without mutating persisted prose.
 * Reflective questions live on typed artifacts, so model context must restore
 * them explicitly or the next answer cannot know what it is answering.
 */
export function buildReflectiveDialogueModelHistory(
  conversation: ReflectiveDialogueConversationMessage[],
  maxMessages: number = 12
): ReflectionPromptMessage[] {
  return conversation.slice(-maxMessages).map((message) => {
    const question = attachedQuestionText(message);
    return {
      role: message.role,
      content: question
        ? `${message.content}\n\n<${REFLECTIVE_DIALOGUE_QUESTION_CONTEXT_TAG}>\n${question}\n</${REFLECTIVE_DIALOGUE_QUESTION_CONTEXT_TAG}>`
        : message.content,
    };
  });
}

/** Plain-text equivalent used by the question generator/validator context. */
export function formatReflectiveDialogueHistory(
  conversation: ReflectiveDialogueConversationMessage[],
  maxMessages: number = 8
): string {
  return buildReflectiveDialogueModelHistory(conversation, maxMessages)
    .map((message) => `${message.role.toUpperCase()}: ${message.content}`)
    .join('\n\n');
}

/**
 * Defense in depth for a model that ignores the prose/question boundary.
 * Only an isolated trailing question paragraph is removed; answer prose is
 * never sentence-trimmed or rewritten.
 */
export function stripTrailingReflectiveDialogueQuestion(content: string): string {
  const trimmed = content.trim();
  if (!trimmed) return '';
  const paragraphs = trimmed.split(/\n\s*\n/u).map((part) => part.trim()).filter(Boolean);
  if (paragraphs.length < 2 || !/[?？;]$/u.test(paragraphs[paragraphs.length - 1])) {
    return trimmed;
  }
  return paragraphs.slice(0, -1).join('\n\n').trim();
}

export const DREAM_FIRST_READING_DIRECTIVE = `
Let the dream narrative lead: image, affect, figures, spaces, position, atmosphere, and movement.

Return to the dream sequence and specific images first.
Do not organize the reading around categories, tags, or frameworks.
Do not mention indexing fields.

The interpretation should feel like it arises from the dream scene itself.
`;

export const INTERPRETATION_OUTPUT_LANGUAGE_DIRECTIVE =
  'OUTPUT LANGUAGE (mandatory): Keep all markdown section headings exactly as specified in English for UI consistency. ' +
  'Write all paragraph text and bullets in the same primary language as the dream narrative and any user notes in this request. ' +
  'Technical labels in this prompt may be in English for UI consistency only; do not let them affect the body language. ' +
  'If the dream mixes languages, use the language used most for the narrative and keep short phrases from other languages as written.';

const BRIEF_INTERPRETATION_FORMAT_PROMPT = `
BRIEF mode (Quick Glance):
- No headings.
- Offer a glimpse: one concrete image or action, its atmosphere, and one central
  movement in 1–2 short paragraphs.
- A felt-sense sentence belongs only when bodily tone is genuinely central.
- Do not manufacture a problem when the dream is calm, joyful, beautiful, vital, cohesive, transformative, or numinous.
- Do not use archetype labels, amplifications, or extra framework language.
- Prefer ending early to covering every detail. Roughly 70–160 words is guidance,
  never a reason to pad or compress a complete movement unnaturally.
- Do not place a question inside the reading prose.

Technical requirement:
After the complete response, append this exact hidden marker on its own line:
${END_MARKER_DREAM_READING}
`;

const STANDARD_INTERPRETATION_FORMAT_PROMPT = `
STANDARD mode (Core Reading):
- Offer a focused reading: one compact path through the dream, not exhaustive
  coverage. Follow its sequence unless one image clearly becomes the center.
- Let the strongest 1–3 images emerge and show what they do to atmosphere,
  attention, position, body, agency, belonging, or orientation.
- Stop when the central movement is illuminated. Do not distribute commentary
  equally, explain every detail, or write toward a minimum length.

Mythic resonance:
- Mythic or archetypal widening is normally out of scope in Standard mode.
- If one image carries unmistakable ritual, initiatory, underworld, sacred, or transpersonal weight, allow at most one brief image-born resonance sentence.
- Do not force mythology onto domestic, ordinary, comic, bureaucratic, or psychologically local dreams.
- Prefer resonance over explanation.

Opening section:
The first heading MUST be exactly one of:
## Core Tension
## Core State
## Core Shift
## Core Restoration

- Under the chosen Core heading, write 1–2 image-near sentences.
- This should orient the dominant affect and final movement without sounding like a diagnosis.
- Do not use archetype labels here.

## Dream Movement

Write one compact interpretive reading in as many short paragraphs as its
movement earns. Let unresolvedness appear only when the dream leaves it there.

Rules for this section:
- Do not split the reading into multiple analytical sections.
- Do not use bullets for symbols.
- Do not use headings for Emotional Atmosphere, Key Symbols, Possible Psychological Meaning, Symbolic Movement, Integration, or Reflective Questions.
- Do not place a question inside the reading prose.
- Typical density may fall around 140–360 words, but this is telemetry and
  guidance only. Psychic resolution—not a word floor—decides when to stop.

Technical requirement:
After the complete response, append this exact hidden marker on its own line:
${END_MARKER_DREAM_READING}
`;

const ADVANCED_INTERPRETATION_FORMAT_PROMPT = `
ADVANCED mode (Deeper Dive):
- Linger longer, not explain more. Depth is increased resolution inside the
  dream's movement, not volume, coverage, or category-by-category analysis.
- Stay with a charged image before interpreting it. Let figures, spaces, objects,
  actions, contradictions, and transformations gather around it organically.
- Track shifts in agency, belonging, distance, intimacy, permission, form, and
  atmosphere only where staged. Do not make the dream cleaner or more resolved.
- A small numinous dream may earn a concise reading; a complex transforming
  dream may earn greater space. Advanced is permission for depth, not a length
  obligation.

Mythic resonance:
- When a dream image carries unmistakable mythic, archetypal, ritual, initiatory, underworld, cosmic, sacred, or transpersonal weight, allow the interpretation to briefly widen beyond the personal psyche.
- Mythic resonance must emerge organically from the image itself, not from symbolic inflation.
- Do not force mythology onto domestic, ordinary, comic, bureaucratic, or psychologically local dreams.
- A single precise mythic echo is stronger than extended amplification.
- Prefer resonance over explanation.
- Do not create a Mythic Resonance section or lecture on mythology.

Opening section:
The first heading MUST be exactly one of:
## Core Tension
## Core State
## Core Shift
## Core Restoration

- Under the chosen Core heading, write 1–2 image-near sentences.
- This should orient the dominant affect and final movement without sounding like a diagnosis.
- Do not use archetype labels here.

## Dream Movement

Write one continuous interpretive essay in as many short paragraphs as the
dream's transformations and psychic resolution earn.

Internal movement to follow, without naming these as subheadings:
1. Begin inside the first scene: place, atmosphere, position, and affect.
2. Let the most specific image emerge naturally from the dream sequence.
3. Stay with that image before interpreting it.
4. Show how figures, spaces, objects, and actions gather around it.
5. Track shifts in agency, belonging, distance, intimacy, passivity, activity, or permission.
6. Let unresolvedness appear only if the dream itself leaves something suspended.

Rules for this section:
- Do not split the reading into multiple analytical sections.
- Do not distribute equal commentary across all symbols.
- Let one image become the gravitational center when the dream earns that structure.
- Use transitions that feel organic, not institutional.
- Trust the image. Do not translate everything into psychology immediately.
- Do not place a question inside the reading prose.
- Roughly 250–400 words may be enough for a small but numinous dream; complex
  multi-scene material may earn 650–800. These are telemetry bands, never quality
  constraints. End as soon as the reading has yielded enough.

Technical requirement:
After the complete response, append this exact hidden marker on its own line:
${END_MARKER_DREAM_READING}
`;

const QUICK_INITIAL_USER_DIRECTIVE = `Give 1–2 short paragraphs. No conclusions
or advice. Do not place a question inside the reading prose.`;

const FULL_INITIAL_USER_DIRECTIVE = `Follow the one or two images with the
strongest specific gravity and the actual movement they create. Do not give
conclusions. Do not place a question inside the reading prose.`;

const QUICK_INITIAL_USER_DIRECTIVE_EDITORIAL_ARC_V2 = `Give 1–2 short paragraphs. No conclusions
or advice. Keep any optional question out of the reading prose and obey the
private-first editorial protocol.`;

const FULL_INITIAL_USER_DIRECTIVE_EDITORIAL_ARC_V2 = `Follow the one or two images with the
strongest specific gravity and the actual movement they create. Do not give
conclusions. Keep any optional question out of the reading prose and obey the
private-first editorial protocol.`;

const INITIAL_RETRY_MODE_DIRECTIVES: Record<DreamReflectionDepth, string> = {
  quick: 'Rewrite from scratch as a concise glimpse. No headings. Use 1–2 short paragraphs and one image-near movement.',
  standard: 'Rewrite from scratch. Use only one Core heading and Dream Movement. Stop when one compact image-near path is complete.',
  advanced: 'Rewrite from scratch. Use only one Core heading and Dream Movement. Linger only where the dream earns greater resolution.',
};

const INITIAL_RETRY_PROTOCOL_DIRECTIVE = `Do not continue the previous response.
Stay with the strongest specific dream details. Do not summarize the whole dream,
list symbols, or use report-like, therapeutic, or framework language. Write a
complete reading and append the reading-end marker. Emit nothing after the
reading-end marker. Never append a reflective question.`;

const INITIAL_RETRY_PROTOCOL_DIRECTIVE_EDITORIAL_ARC_V2 = `Do not continue the previous response.
Stay with the strongest specific dream details. Do not summarize the whole dream,
list symbols, or use report-like, therapeutic, or framework language. Emit a
fresh private question-or-no-question envelope first, then the reading-start
marker, a complete reading, and the reading-end marker. Never repair or reuse the
previous envelope, and emit nothing after the reading-end marker.`;

function personalizationSection(dream: DreamReflectionInput): string {
  return [
    ['Emotion on waking', dream.emotionOnWaking],
    ['Body sensation', dream.bodySensation],
    ['Current life theme', dream.currentLifeTheme],
  ]
    .filter((entry): entry is [string, string] => Boolean(entry[1]?.trim()))
    .map(([label, value]) => `${label}: ${value}`)
    .join('\n');
}

export function buildInitialReflectionRequest(
  dream: DreamReflectionInput,
  depth: DreamReflectionDepth
): ReflectionPromptRequest {
  const personal = personalizationSection(dream);
  const evidenceSpans = buildCompleteDreamEvidenceSpans(dream.content);
  const indexedDream = formatDreamEvidenceSpans(evidenceSpans);
  const outputLanguage = `\n\n${INTERPRETATION_OUTPUT_LANGUAGE_DIRECTIVE}`;
  const userPrompt = depth === 'quick'
    ? `Here is a dream I want a brief symbolic reflection on.

Title: ${dream.title || 'Untitled'}
Date: ${dream.date}
${personal ? `\n${personal}\n` : ''}
Dream evidence (D# labels are private provenance anchors; never mention them):
${indexedDream}

${DREAM_FIRST_READING_DIRECTIVE}
${QUICK_INITIAL_USER_DIRECTIVE}${outputLanguage}`
    : `Here is a dream I want to explore symbolically.

Title: ${dream.title || 'Untitled'}
Date: ${dream.date}
${personal ? `\n${personal}\n` : ''}
Dream evidence (D# labels are private provenance anchors; never mention them):
${indexedDream}

${DREAM_FIRST_READING_DIRECTIVE}
${FULL_INITIAL_USER_DIRECTIVE}${outputLanguage}`;

  const task = depth === 'quick'
    ? 'interpretation_quick'
    : depth === 'advanced'
      ? 'interpretation_advanced'
      : 'interpretation_standard';
  const format = depth === 'quick'
    ? BRIEF_INTERPRETATION_FORMAT_PROMPT
    : depth === 'advanced'
      ? ADVANCED_INTERPRETATION_FORMAT_PROMPT
      : STANDARD_INTERPRETATION_FORMAT_PROMPT;

  return {
    task,
    messages: [
      { role: 'system', content: DREAM_CONSTITUTION_PROMPT },
      { role: 'system', content: INTERPRETATION_ROLE_PROMPT },
      { role: 'system', content: format },
      { role: 'user', content: userPrompt },
    ],
    temperature: depth === 'quick' ? 0.68 : depth === 'advanced' ? 0.6 : 0.55,
    tokenLimit: depth === 'quick' ? 500 : depth === 'advanced' ? 2600 : 1450,
  };
}

export function buildInitialReflectionRetryPrompt(depth: DreamReflectionDepth): string {
  const mode = INITIAL_RETRY_MODE_DIRECTIVES[depth];

  return `Your previous response was cut off.
${mode}
${INITIAL_RETRY_PROTOCOL_DIRECTIVE}

Technical requirement:
Write the complete reading and append this exact hidden end marker:
${END_MARKER_DREAM_READING}
Emit nothing after the reading-end marker.`;
}

export const DREAM_REFLECTION_EDITORIAL_ARC_BUNDLE = [
  DREAM_REFLECTION_PROMPT_ID,
  DREAM_REFLECTION_PROMPT_VERSION,
  REFLECTION_EDITORIAL_ARC_METHOD_ID,
  REFLECTION_EDITORIAL_ARC_METHOD_VERSION,
  String(REFLECTION_EDITORIAL_ARC_PROTOCOL_VERSION),
  REFLECTION_EDITORIAL_ARC_PAYLOAD_START,
  REFLECTION_EDITORIAL_ARC_PAYLOAD_END,
  REFLECTION_EDITORIAL_ARC_READING_START,
  DREAM_CONSTITUTION_PROMPT,
  INTERPRETATION_ROLE_PROMPT,
  DREAM_FIRST_READING_DIRECTIVE,
  INTERPRETATION_OUTPUT_LANGUAGE_DIRECTIVE,
  BRIEF_INTERPRETATION_FORMAT_PROMPT,
  STANDARD_INTERPRETATION_FORMAT_PROMPT,
  ADVANCED_INTERPRETATION_FORMAT_PROMPT,
  REFLECTION_EDITORIAL_ARC_PROMPT,
  QUICK_INITIAL_USER_DIRECTIVE_EDITORIAL_ARC_V2,
  FULL_INITIAL_USER_DIRECTIVE_EDITORIAL_ARC_V2,
  ...Object.values(INITIAL_RETRY_MODE_DIRECTIVES),
  INITIAL_RETRY_PROTOCOL_DIRECTIVE_EDITORIAL_ARC_V2,
].join('\n---ONEIROS-EDITORIAL-ARC-V2---\n');

export const CHAT_FOLLOWUP_TEMPERATURE = 0.45 as const;
export const CHAT_FOLLOWUP_TOKEN_LIMIT = 650 as const;
export const CHAT_DREAM_CONTEXT_MAX_CHARS = 6000 as const;
export const CHAT_HISTORY_MAX_MESSAGES = 12 as const;

export function buildBoundedDreamExcerpt(
  content: string,
  maxChars: number = CHAT_DREAM_CONTEXT_MAX_CHARS
): string {
  const trimmed = content.trim();
  if (trimmed.length <= maxChars) return trimmed;
  const marker = '\n\n[… middle of dream omitted for context length …]\n\n';
  const available = Math.max(maxChars - marker.length, 200);
  const headLength = Math.ceil(available * 0.52);
  const tailLength = available - headLength;
  return `${trimmed.slice(0, headLength).trimEnd()}${marker}${trimmed.slice(-tailLength).trimStart()}`;
}

export function buildChatFollowupRequest(params: {
  dream: DreamReflectionInput;
  conversation: ReflectiveDialogueConversationMessage[];
  userMessage: string;
  isFinalResponse: boolean;
}): ReflectionPromptRequest {
  const history = params.conversation.slice(-CHAT_HISTORY_MAX_MESSAGES);
  const modelHistory = buildReflectiveDialogueModelHistory(
    history,
    CHAT_HISTORY_MAX_MESSAGES
  );
  const dreamContext = `Dream being discussed:
Title: ${params.dream.title || 'Untitled'}
Date: ${params.dream.date}
Content:
${buildBoundedDreamExcerpt(params.dream.content)}`;

  const chatMode = `Chat mode:
- First answer the user's actual request. Do not redirect it into a new exercise or question.
- Build on the existing reading instead of redoing a full analysis.
- Be concise without becoming casual, flattened, generic, or therapist-like.
- Prefer one precise development over a quick summary of many points.
- Let length follow evidence rather than a quota. One natural sentence may be complete for an ambiguous, corrective, ordinary, or closing turn. Use one compact paragraph when the user offers substantial new material; use a second only when their direct request genuinely needs it.
- Never fill space by assigning significance, intention, acceptance, absence, or symbolic weight that the user did not provide.
- Use no headings and no mini-essays.
- Do not mechanically repeat what the initial interpretation or conversation established. You may return to the same image when the user's new words change or deepen their relation to it; continuity is not novelty-seeking.
- Do not append a reflective question. A separate evidence-bound subsystem owns optional questions.`;

  const turnBoundary = params.isFinalResponse
    ? 'This is the final allowed assistant reply. Conclude without inviting another exchange and do not end with a question.'
    : 'End after the answer itself. Do not add a generic invitation such as “What would you like to explore?”';
  const languageContext = buildChatReflectiveLanguageContext({
    dreamContent: params.dream.content,
    conversation: history,
    latestUserMessage: params.userMessage,
  });
  const outputLanguage = buildReflectiveLanguageInstruction(languageContext, {
    includeOutputLanguageTag: false,
  });

  return {
    task: 'chat_followup',
    messages: [
      { role: 'system', content: REFLECTIVE_DIALOGUE_PROMPT },
      { role: 'system', content: chatMode },
      { role: 'system', content: turnBoundary },
      { role: 'system', content: dreamContext },
      { role: 'system', content: outputLanguage },
      ...modelHistory,
      { role: 'user', content: params.userMessage },
    ],
    temperature: CHAT_FOLLOWUP_TEMPERATURE,
    tokenLimit: CHAT_FOLLOWUP_TOKEN_LIMIT,
    responseFormat: buildReflectiveDialogueResponseFormat(),
    reflectiveLanguageContext: languageContext,
  };
}
