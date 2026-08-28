import { readFileSync } from 'fs';
import path from 'path';
import {
  extractReflectiveQuestionSection,
  extractSameCallReflectiveQuestions,
  extractTerminalInterrogative,
  expectedSameCallQuestionCount,
} from '../src/ai/reflectiveQuestionExtract';
import {
  buildChatFollowupRequest,
  buildInitialReflectionRequest,
  CHAT_MODE_INSTRUCTIONS,
  DREAM_REFLECTION_PROMPT_ID,
  FOLLOWUP_CHAT_PROMPT_ID,
  SAME_CALL_QUESTION_SAFEGUARDS,
  SAME_CALL_REFLECTIVE_QUESTIONS_METHOD_ID,
} from '../src/ai/dreamReflectionPrompt';
import { buildPeriodReflectionSystemPrompt, RECENT_DREAM_FIELD_SYSTEM_PROMPT } from '../src/ai/reflectiveEssayPrompt';

const standardReading = `## Core State
A quiet ridge holds the morning.

## Dream Movement
Light gathers without asking anything of the dreamer.

## Reflective Questions
- What stayed in the body as the light arrived?
- What does the ridge keep by remaining still?
<!--END_DREAM_READING-->`;

describe('same-call reflective question extraction', () => {
  it('extracts Quick as one terminal interrogative', () => {
    const quick = 'The sea returns you to the same shore.\n\nWhat remains when the wave recedes?';
    expect(extractTerminalInterrogative(quick)).toBe('What remains when the wave recedes?');
    expect(extractSameCallReflectiveQuestions(quick, 'quick')).toEqual([
      'What remains when the wave recedes?',
    ]);
    expect(expectedSameCallQuestionCount('quick')).toBe(1);
  });

  it('extracts Standard and Advanced as exactly two Reflective Questions bullets', () => {
    expect(extractReflectiveQuestionSection(standardReading)).toEqual([
      'What stayed in the body as the light arrived?',
      'What does the ridge keep by remaining still?',
    ]);
    expect(extractSameCallReflectiveQuestions(standardReading, 'standard')).toHaveLength(2);
    expect(expectedSameCallQuestionCount('standard')).toBe(2);
    expect(expectedSameCallQuestionCount('advanced')).toBe(2);
  });

  it('extracts a non-final chat terminal question and none for a closing turn', () => {
    const chat = 'The warmth you named sits beside the water, not as proof of safety.\n\nWhat shifted when you said it was warm?';
    expect(extractSameCallReflectiveQuestions(chat, 'chat')).toEqual([
      'What shifted when you said it was warm?',
    ]);
    expect(extractSameCallReflectiveQuestions(chat, 'chat', { isFinalChat: true })).toEqual([]);
    expect(expectedSameCallQuestionCount('chat', { isFinalChat: true })).toBe(0);
  });
});

describe('same-call reflective question prompt contract', () => {
  const dream = {
    title: 'Ridge',
    date: '2026-08-29',
    content: 'I wake on a quiet ridge as the sun rises.',
  };

  it('keeps Quick at one terminal question and Standard/Advanced at exactly two', () => {
    const quick = buildInitialReflectionRequest(dream, 'quick');
    const standard = buildInitialReflectionRequest(dream, 'standard');
    const advanced = buildInitialReflectionRequest(dream, 'advanced');
    expect(DREAM_REFLECTION_PROMPT_ID).toBe('oneiros-dream-reflection-v3.2.0');
    expect(SAME_CALL_REFLECTIVE_QUESTIONS_METHOD_ID).toBe(
      'oneiros-same-call-reflective-questions-v1.0.0'
    );
    expect(quick.messages[2].content).toContain('exactly one natural reflective question');
    expect(quick.messages[2].content).not.toContain('## Reflective Questions');
    expect(standard.messages[2].content).toContain('Exactly 2 questions as markdown bullets');
    expect(standard.messages[2].content).toContain('Do not use 1–2');
    expect(advanced.messages[2].content).toContain('Exactly 2 questions as markdown bullets');
    expect(standard.messages[2].content).toContain('Question 1 — observational / somatic');
    expect(standard.messages[2].content).toContain('Question 2 — symbolic / relational / imaginal');
    expect(standard.messages[2].content).toContain(SAME_CALL_QUESTION_SAFEGUARDS.trim().slice(0, 40));
    expect(quick.messages[2].content).toContain('No advice verbs');
  });

  it('restores conversational chat with one question, none when closing', () => {
    const open = buildChatFollowupRequest({
      dream,
      conversation: [{ role: 'assistant', content: standardReading }],
      userMessage: 'The light felt like enough.',
      isFinalResponse: false,
    });
    const closing = buildChatFollowupRequest({
      dream,
      conversation: [{ role: 'assistant', content: standardReading }],
      userMessage: "That's enough for now.",
      isFinalResponse: true,
    });
    const openText = open.messages.map((message) => message.content).join('\n');
    const closingText = closing.messages.map((message) => message.content).join('\n');
    expect(FOLLOWUP_CHAT_PROMPT_ID).toBe('oneiros-followup-chat-v2.0.0');
    expect(open.responseFormat).toBeUndefined();
    expect(openText).toContain(CHAT_MODE_INSTRUCTIONS.trim().slice(0, 40));
    expect(openText).toContain('end with exactly one natural reflective question');
    expect(openText).not.toContain('Do not append a reflective question');
    expect(openText).toMatch(/Do not manufacture\s+either\/or choices/);
    expect(closingText).toContain('Ask no question');
    expect(openText).toContain('Do not reset into symbol lists, archetypes, shadow');
    expect(openText).toContain('Do not turn every reply into analysis, advice, a somatic exercise');
    expect(openText).toContain('If the user answers unexpectedly, follow that new material');
    expect(openText).not.toContain('QUESTION_INTEGRITY_GATE');
    expect(openText).not.toContain('evidence_ids');
    expect(open.messages.filter((message) => message.role === 'user').map((message) => message.content)).toContain(
      'The light felt like enough.'
    );
    expect(open.messages.some((message) => message.content.includes(standardReading))).toBe(true);
  });

  it('handles missing question cardinality by whole-response rewrite, not a second LLM', () => {
    const reader = readFileSync(path.join(__dirname, '../src/ai/dreamReflectionPrompt.ts'), 'utf8');
    const billing = readFileSync(
      path.join(__dirname, '../supabase/functions/_shared/billing-ai.ts'),
      'utf8'
    );
    expect(reader).toContain('never by a second question call');
    expect(reader).toContain('complete reading, including the required reflective question(s)');
    expect(billing).not.toMatch(/generateProductionReflectiveQuestion|QUESTION_INTEGRITY_GATE|QUESTION_REPAIR_TASK/);
  });

  it('restores essay cardinality to exactly two questions in the same call', () => {
    const period = buildPeriodReflectionSystemPrompt('monthly', 3);
    expect(period).toContain('Exactly 2 questions as markdown bullets');
    expect(RECENT_DREAM_FIELD_SYSTEM_PROMPT).toContain('Exactly 2 questions as markdown bullets');
    expect(period).toContain('No advice verbs');
    expect(period).not.toContain('canonical reflective-question method');
    expect(expectedSameCallQuestionCount('essay')).toBe(2);
  });
});
