import {
  buildChatReflectiveLanguageContext,
  buildReflectiveLanguageInstruction,
} from './reflectiveLanguage.ts';
import {
  type ReflectiveDialogueResponseFormat,
} from './reflectiveDialogueResponseFormat.ts';
import {
  REFLECTION_EDITORIAL_ARC_METHOD_ID,
  REFLECTION_EDITORIAL_ARC_METHOD_VERSION,
  REFLECTION_EDITORIAL_ARC_PAYLOAD_END,
  REFLECTION_EDITORIAL_ARC_PAYLOAD_START,
  REFLECTION_EDITORIAL_ARC_PROMPT,
  REFLECTION_EDITORIAL_ARC_PROTOCOL_VERSION,
  REFLECTION_EDITORIAL_ARC_READING_START,
} from './reflectionEditorialArc.ts';
import {
  buildCompleteDreamEvidenceSpans,
  formatDreamEvidenceSpans,
} from './reflectiveEvidence.ts';

export const DREAM_REFLECTION_PROMPT_ID =
  'oneiros-dream-reflection-v3.2.0' as const;
export const DREAM_REFLECTION_PROMPT_VERSION = '3.2.0' as const;
export const FOLLOWUP_CHAT_PROMPT_ID = 'oneiros-followup-chat-v2.0.0' as const;
export const FOLLOWUP_CHAT_PROMPT_VERSION = '2.0.0' as const;
/** @deprecated Historical Dialogue identity; launch chat is FOLLOWUP_CHAT_PROMPT_ID. */
export const REFLECTIVE_DIALOGUE_PROMPT_ID = FOLLOWUP_CHAT_PROMPT_ID;
export const REFLECTIVE_DIALOGUE_PROMPT_VERSION = FOLLOWUP_CHAT_PROMPT_VERSION;
export const SAME_CALL_REFLECTIVE_QUESTIONS_METHOD_ID =
  'oneiros-same-call-reflective-questions-v1.0.0' as const;
export const SAME_CALL_REFLECTIVE_QUESTIONS_METHOD_VERSION = '1.0.0' as const;
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

export const SAME_CALL_QUESTION_SAFEGUARDS = `
Reflective-question safeguards:
- Do not ask the dreamer to rank, choose, compare, or decide between dream elements unless the dream itself explicitly contains that choice. Do not invent either/or structures.
- Do not ask the dreamer to remember an unreported visual, sensory, bodily, or factual detail as though that detail existed in the dream. Fresh noticing is fine; fabricated memory retrieval is not.
- A symbolic or relational question may explore a possibility opened by the reading, but do not state an inferred meaning, motive, causal relation, or metaphor as though the dream itself literally established it. Keep questions invitational rather than confirmatory.
- No advice verbs: try, practice, breathe, focus, work on, improve, regulate.
`;

export const SAME_CALL_STANDARD_ADVANCED_QUESTIONS = `
## Reflective Questions

- Exactly 2 questions as markdown bullets. No more. No fewer. Do not use 1–2. Do not default to one.
- Question 1 — observational / somatic: prefer a concrete observational or remembered dream-body question when the dream supports it. Somatic means the body inside the remembered dream, never a present-time exercise. If a somatic question would be forced or uninteresting, use another concrete observational question instead.
- Question 2 — symbolic / relational / imaginal: open the dream symbolically, relationally, or imaginally. It may follow an image, relation, transformation, contradiction, recurring gesture, unresolved movement, symbolic tension, or surprising juxtaposition. Deepen or reopen the central movement already developed in the reading; do not start a new analytic thread. The second question may be more psychologically or symbolically suggestive than the first. Do not make it safe by reducing it to generic phenomenology.
- No prose after the questions.
${SAME_CALL_QUESTION_SAFEGUARDS}
`;

/**
 * Follow-up chat continues the existing reading. It is not a second
 * interpretation engine, Gate, Repair, or question pipeline.
 */
export const CHAT_MODE_INSTRUCTIONS = `
Follow-up chat — Oneiros method ${FOLLOWUP_CHAT_PROMPT_VERSION}

Continue the conversation naturally from the existing dream reading and the
user's latest response.

Respond first to what the user actually said. Build on the existing conversation
rather than restarting the interpretation.

You may deepen an image, relation, feeling, symbolic possibility, or imaginal
movement when the user's response genuinely opens it. Keep interpretations
tentative and grounded in the dream and conversation. Prefer “it may be”,
“it seems”, and “I wonder whether” over “this means”, “the dream is telling you”,
or “this represents”. Do not become afraid of interpretation to the point of
saying nothing.

Do not turn every reply into analysis, advice, a somatic exercise, or a summary.
Do not reset into symbol lists, archetypes, shadow, meaning, and conclusion
unless the user explicitly asks for a structured analysis.
Do not invent dream facts. Do not force symbolic certainty. Do not manufacture
either/or choices. Do not give advice unless requested.

If the user answers unexpectedly, follow that new material. Do not drag them
back to the original reading theme merely because it seemed central.
If the user becomes emotionally intense, respond to that intensity before
continuing symbolic analysis.

Keep ordinary replies around 90–220 words. Shorter is allowed when the user's
reply is short. Do not inflate every response into a mini essay.

For ordinary ongoing replies, end with exactly one natural reflective question
that follows from the current exchange. The question may be observational,
somatic, relational, symbolic, or imaginal. Do not stack questions or hide
multiple choices inside one sentence. Avoid generic therapy/coaching shells
such as “What comes up for you?”, “How does that land?”, or “Where do you feel
that in your body?” unless the specific context genuinely earns them.

When the user is clearly closing the conversation, ask no question. End with a
concise closing insight or acknowledgement. Closing intent includes clear
equivalents of that's enough, let's close, got it, okay I understand, that's
all, or stop here — use conversational judgment, not exact keywords.

Keep the tone conversational, psychologically intelligent, and specific to this
dream.
`;

/** @deprecated Historical Dialogue prompt; launch chat uses CHAT_MODE_INSTRUCTIONS. */
export const REFLECTIVE_DIALOGUE_PROMPT = CHAT_MODE_INSTRUCTIONS;

/**
 * Conversation history for follow-up chat. Questions already live in assistant
 * prose, so no tagged artifact replay is required.
 */
export function buildReflectiveDialogueModelHistory(
  conversation: ReflectiveDialogueConversationMessage[],
  maxMessages: number = 12
): ReflectionPromptMessage[] {
  return conversation.slice(-maxMessages).map((message) => ({
    role: message.role,
    content: message.content,
  }));
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
  'Write all paragraph text, bullets, and reflective questions in the same primary language as the dream narrative and any user notes in this request. ' +
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
- End with exactly one natural reflective question as the final sentence or short paragraph. No Reflective Questions heading.
${SAME_CALL_QUESTION_SAFEGUARDS}

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
- Do not use headings for Emotional Atmosphere, Key Symbols, Possible Psychological Meaning, Symbolic Movement, or Integration.
- Typical density may fall around 140–360 words, but this is telemetry and
  guidance only. Psychic resolution—not a word floor—decides when to stop.

${SAME_CALL_STANDARD_ADVANCED_QUESTIONS}

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
- Roughly 250–400 words may be enough for a small but numinous dream; complex
  multi-scene material may earn 650–800. These are telemetry bands, never quality
  constraints. End as soon as the reading has yielded enough.

${SAME_CALL_STANDARD_ADVANCED_QUESTIONS}
Finish the full response, including both reflective questions and the end marker. Do not stop mid-sentence or mid-question.

Technical requirement:
After the complete response, append this exact hidden marker on its own line:
${END_MARKER_DREAM_READING}
`;

const QUICK_INITIAL_USER_DIRECTIVE = `Give 1–2 short paragraphs. No conclusions
or advice. End with exactly one observational or imaginal reflective question.`;

const FULL_INITIAL_USER_DIRECTIVE = `Follow the one or two images with the
strongest specific gravity and the actual movement they create. Do not give
conclusions. End with exactly two reflective questions under Reflective Questions.`;

const QUICK_INITIAL_USER_DIRECTIVE_EDITORIAL_ARC_V2 = `Give 1–2 short paragraphs. No conclusions
or advice. Keep any optional question out of the reading prose and obey the
private-first editorial protocol.`;

const FULL_INITIAL_USER_DIRECTIVE_EDITORIAL_ARC_V2 = `Follow the one or two images with the
strongest specific gravity and the actual movement they create. Do not give
conclusions. Keep any optional question out of the reading prose and obey the
private-first editorial protocol.`;

const INITIAL_RETRY_MODE_DIRECTIVES: Record<DreamReflectionDepth, string> = {
  quick: 'Rewrite from scratch as a concise glimpse. No headings. Use 1–2 short paragraphs, one image-near movement, and exactly one terminal reflective question.',
  standard: 'Rewrite from scratch. Use only one Core heading, Dream Movement, and Reflective Questions. End with exactly 2 questions.',
  advanced: 'Rewrite from scratch. Use only one Core heading, Dream Movement, and Reflective Questions. Linger only where the dream earns greater resolution. End with exactly 2 questions.',
};

const INITIAL_RETRY_PROTOCOL_DIRECTIVE = `Do not continue the previous response.
Stay with the strongest specific dream details. Do not summarize the whole dream,
list symbols, or use report-like, therapeutic, or framework language. Write a
complete reading, including the required reflective question(s), and append the
reading-end marker. Missing or extra questions are handled by rewriting this
whole response, never by a second question call.`;

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
    tokenLimit: depth === 'quick' ? 560 : depth === 'advanced' ? 2700 : 1600,
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

export const SAME_CALL_REFLECTIVE_QUESTIONS_BUNDLE = [
  SAME_CALL_REFLECTIVE_QUESTIONS_METHOD_ID,
  SAME_CALL_REFLECTIVE_QUESTIONS_METHOD_VERSION,
  DREAM_REFLECTION_PROMPT_ID,
  DREAM_REFLECTION_PROMPT_VERSION,
  FOLLOWUP_CHAT_PROMPT_ID,
  FOLLOWUP_CHAT_PROMPT_VERSION,
  DREAM_CONSTITUTION_PROMPT,
  INTERPRETATION_ROLE_PROMPT,
  DREAM_FIRST_READING_DIRECTIVE,
  INTERPRETATION_OUTPUT_LANGUAGE_DIRECTIVE,
  BRIEF_INTERPRETATION_FORMAT_PROMPT,
  STANDARD_INTERPRETATION_FORMAT_PROMPT,
  ADVANCED_INTERPRETATION_FORMAT_PROMPT,
  SAME_CALL_QUESTION_SAFEGUARDS,
  SAME_CALL_STANDARD_ADVANCED_QUESTIONS,
  CHAT_MODE_INSTRUCTIONS,
  QUICK_INITIAL_USER_DIRECTIVE,
  FULL_INITIAL_USER_DIRECTIVE,
  ...Object.values(INITIAL_RETRY_MODE_DIRECTIVES),
  INITIAL_RETRY_PROTOCOL_DIRECTIVE,
  'one-reader-call-reading-plus-questions',
  'quick-1-standard-2-advanced-2',
  'chat-nonfinal-1-final-0',
  'essay-exactly-2',
  'no-second-question-inference',
  'no-gate-repair-premise-composer',
].join('\n---ONEIROS-SAME-CALL-REFLECTIVE-QUESTIONS-V1---\n');

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

  const turnBoundary = params.isFinalResponse
    ? 'This is the final allowed assistant reply. The user has reached the close of this reflection. Ask no question. End with a concise closing insight, synthesis, or acknowledgement.'
    : 'This is an ordinary ongoing reply. After responding to what the user just said, end with exactly one natural reflective question. Never two.';
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
      { role: 'system', content: DREAM_CONSTITUTION_PROMPT },
      { role: 'system', content: CHAT_MODE_INSTRUCTIONS },
      { role: 'system', content: turnBoundary },
      { role: 'system', content: dreamContext },
      { role: 'system', content: outputLanguage },
      ...modelHistory,
      { role: 'user', content: params.userMessage },
    ],
    temperature: CHAT_FOLLOWUP_TEMPERATURE,
    tokenLimit: CHAT_FOLLOWUP_TOKEN_LIMIT,
    reflectiveLanguageContext: languageContext,
  };
}
