import { readFileSync } from 'fs';
import path from 'path';
import {
  extractReflectiveQuestionSection,
  extractSameCallReflectiveQuestions,
  extractTerminalInterrogative,
  expectedSameCallQuestionCount,
  normalizeCompletedReflectiveQuestionStructure,
  REFLECTIVE_QUESTION_STRUCTURE_NORMALIZER_OPERATION,
  REFLECTIVE_QUESTION_STRUCTURE_NORMALIZER_VERSION,
  validateSameCallQuestionContract,
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

const missingHeadingReading = `## Core Shift

The water settles after the bell.

## Dream Movement

The dream moves from a small current to a deliberate covering action.

- What changes when the bell stops the water?
- What does the covering action leave complete?
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
    expect(validateSameCallQuestionContract(standardReading, 'standard')).toMatchObject({
      valid: true,
      expectedCount: 2,
      actualCount: 2,
    });
  });

  it('treats the English Reflective Questions heading as immutable structure', () => {
    const translatedHeading = standardReading.replace(
      '## Reflective Questions',
      '## Αναστοχαστικές Ερωτήσεις'
    );
    expect(extractReflectiveQuestionSection(translatedHeading)).toEqual([]);
    expect(validateSameCallQuestionContract(translatedHeading, 'standard').issues).toContain(
      'missing_reflective_questions_heading'
    );
  });

  it('extracts a non-final chat terminal question and none for a closing turn', () => {
    const chat = 'The warmth you named sits beside the water, not as proof of safety.\n\nWhat shifted when you said it was warm?';
    expect(extractSameCallReflectiveQuestions(chat, 'chat')).toEqual([
      'What shifted when you said it was warm?',
    ]);
    expect(extractSameCallReflectiveQuestions(chat, 'chat', { isFinalChat: true })).toEqual([]);
    expect(expectedSameCallQuestionCount('chat', { isFinalChat: true })).toBe(0);
  });

  it('rejects missing, extra, compound, and non-terminal question structures', () => {
    expect(validateSameCallQuestionContract(
      standardReading.replace(/\n- What does the ridge keep by remaining still\?/u, ''),
      'standard'
    ).issues).toContain('question_count_mismatch');
    expect(validateSameCallQuestionContract(
      standardReading.replace(
        '<!--END_DREAM_READING-->',
        '- Where does the morning go?\n<!--END_DREAM_READING-->'
      ),
      'advanced'
    ).issues).toContain('question_count_mismatch');
    expect(validateSameCallQuestionContract(
      'The sea settles.\n\nWhat remains?Where does it go?',
      'quick'
    ).issues).toContain('compound_question');
    expect(validateSameCallQuestionContract(
      'This closes the reflection.\n\nAnything else?',
      'chat',
      { isFinalChat: true }
    ).valid).toBe(false);
  });

  it('rejects manufactured answer menus without adding a semantic judge', () => {
    const menusByLanguage = [
      ['en', 'Does it feel warm or cold?'],
      ['el', 'Μένει ζεστό ή κρύο;'],
      ['es', '¿Se siente cálido o frío?'],
      ['fr', 'Est-ce chaud ou froid?'],
      ['de', 'Fühlt es sich warm oder kalt an?'],
      ['it', 'Sembra caldo o freddo?'],
      ['pt', 'Parece quente ou frio?'],
      ['nl', 'Voelt het warm of koud?'],
      ['pl', 'Czy pozostaje ciepłe czy zimne?'],
      ['ru', 'Это ощущается тёплым или холодным?'],
      ['ja', '暖かいですか、それとも冷たいですか？'],
      ['zh', '它感觉温暖还是寒冷？'],
    ] as const;
    for (const [languageCode, question] of menusByLanguage) {
      expect(validateSameCallQuestionContract(
        `A grounded response.\n\n${question}`,
        'chat',
        { languageCode }
      ).issues).toContain('manufactured_answer_menu');
    }
    expect(validateSameCallQuestionContract(
      'The coat keeps dripping.\n\nWhat was present there—stillness, alertness, hesitation, curiosity?',
      'chat',
      { languageCode: 'en' }
    ).issues).toContain('manufactured_answer_menu');
    expect(validateSameCallQuestionContract(
      'The tunnel narrows.\n\nWhat changed when the air went thin?',
      'chat',
      { languageCode: 'en' }
    ).valid).toBe(true);
  });
});

describe('completed reflective-question structure normalization', () => {
  it('inserts only the exact heading for an unambiguous completed Standard reading', () => {
    const result = normalizeCompletedReflectiveQuestionStructure({
      content: missingHeadingReading,
      surface: 'standard',
      requiredEndMarker: '<!--END_DREAM_READING-->',
    });

    expect(result.normalization).toEqual({
      applied: true,
      operation: REFLECTIVE_QUESTION_STRUCTURE_NORMALIZER_OPERATION,
      normalizer_version: REFLECTIVE_QUESTION_STRUCTURE_NORMALIZER_VERSION,
    });
    expect(result.content).toBe(missingHeadingReading.replace(
      '- What changes when the bell stops the water?',
      '## Reflective Questions\n\n- What changes when the bell stops the water?'
    ));
    expect(extractReflectiveQuestionSection(result.content)).toEqual([
      'What changes when the bell stops the water?',
      'What does the covering action leave complete?',
    ]);
    expect(validateSameCallQuestionContract(result.content, 'standard').issues).not.toEqual(
      expect.arrayContaining([
        'missing_reflective_questions_heading',
        'question_count_mismatch',
      ])
    );
  });

  it('preserves CRLF and is idempotent at the content boundary', () => {
    const crlf = missingHeadingReading.replace(/\n/gu, '\r\n');
    const first = normalizeCompletedReflectiveQuestionStructure({
      content: crlf,
      surface: 'advanced',
      requiredEndMarker: '<!--END_DREAM_READING-->',
    });
    const second = normalizeCompletedReflectiveQuestionStructure({
      content: first.content,
      surface: 'advanced',
      requiredEndMarker: '<!--END_DREAM_READING-->',
    });

    expect(first.normalization.applied).toBe(true);
    expect(first.content).toContain('## Reflective Questions\r\n\r\n- What changes');
    expect(second.content).toBe(first.content);
    expect(second.normalization).toEqual({
      applied: false,
      operation: null,
      normalizer_version: REFLECTIVE_QUESTION_STRUCTURE_NORMALIZER_VERSION,
    });
  });

  it.each([
    ['Quick surface', missingHeadingReading, 'quick'],
    ['missing completion marker', missingHeadingReading.replace('\n<!--END_DREAM_READING-->', ''), 'standard'],
    ['one bullet', missingHeadingReading.replace('\n- What does the covering action leave complete?', ''), 'standard'],
    ['three bullets', missingHeadingReading.replace(
      '\n<!--END_DREAM_READING-->',
      '\n- What remains nearby?\n<!--END_DREAM_READING-->'
    ), 'standard'],
    ['trailing prose', missingHeadingReading.replace(
      '\n<!--END_DREAM_READING-->',
      '\n\nThe reflection closes here.\n<!--END_DREAM_READING-->'
    ), 'standard'],
    ['extra prose question', missingHeadingReading.replace(
      'The water settles after the bell.',
      'The water settles after the bell. What happened there?'
    ), 'standard'],
    ['later heading', missingHeadingReading.replace(
      'The dream moves from a small current to a deliberate covering action.',
      'The dream moves from a small current to a deliberate covering action.\n\n## Closing'
    ), 'standard'],
    ['translated question heading', missingHeadingReading.replace(
      'The dream moves from a small current to a deliberate covering action.',
      'The dream moves from a small current to a deliberate covering action.\n\n## 反思问题'
    ), 'standard'],
    ['Japanese full-stop interrogatives', missingHeadingReading
      .replace('What changes when the bell stops the water?', '鐘が水を止めると、何が変わるのでしょうか。')
      .replace('What does the covering action leave complete?', '覆う動作は何を終わらせるのでしょうか。'), 'advanced'],
  ] as const)('is a byte-identical no-op for %s', (_label, content, surface) => {
    const result = normalizeCompletedReflectiveQuestionStructure({
      content,
      surface,
      requiredEndMarker: '<!--END_DREAM_READING-->',
    });

    expect(result.content).toBe(content);
    expect(result.normalization.applied).toBe(false);
    expect(result.normalization.operation).toBeNull();
  });

  it('replays both frozen evaluation packets with only the two real heading misses changed', () => {
    type FrozenResult = {
      generation_id: string;
      mode?: 'standard' | 'advanced';
      after: {
        output: string;
        validation?: { issues?: string[] };
      };
    };
    const packetPaths = [
      '../testing/reflective-questions/artifacts/v1.0.2-surgical-anchor-evaluation-2026-08-29/RAW_BEFORE_AFTER.json',
      '../testing/reflective-questions/artifacts/v1.0.3-enacted-relation-evaluation-2026-08-29/RAW_EVALUATION.json',
    ];
    let applied = 0;
    let noOp = 0;

    for (const packetPath of packetPaths) {
      const packet = JSON.parse(
        readFileSync(path.join(__dirname, packetPath), 'utf8')
      ) as { results: FrozenResult[] };

      for (const frozen of packet.results) {
        const surface = frozen.mode ?? (
          frozen.generation_id.endsWith(':reading_standard')
            ? 'standard'
            : frozen.generation_id.endsWith(':reading_advanced')
              ? 'advanced'
              : frozen.generation_id.endsWith(':reading_quick')
                ? 'quick'
                : 'chat'
        );
        const completedContent = surface === 'chat'
          ? frozen.after.output
          : `${frozen.after.output}\n<!--END_DREAM_READING-->`;
        const originalTerminalQuestions = frozen.after.output
          .trim()
          .split(/\r?\n/u)
          .slice(-2)
          .map((line) => line.replace(/^\s*[-*+]\s+/u, '').trim());
        const result = normalizeCompletedReflectiveQuestionStructure({
          content: completedContent,
          surface,
          requiredEndMarker: '<!--END_DREAM_READING-->',
        });
        const wasHistoricalMiss = frozen.after.validation?.issues?.includes(
          'missing_reflective_questions_heading'
        ) === true;

        if (wasHistoricalMiss) {
          applied += 1;
          expect(result.normalization.applied).toBe(true);
          expect(extractReflectiveQuestionSection(result.content)).toEqual(
            originalTerminalQuestions
          );
          expect(result.content.replace('## Reflective Questions\n\n', '')).toBe(
            completedContent
          );
        } else {
          noOp += 1;
          expect(result.normalization.applied).toBe(false);
          expect(result.content).toBe(completedContent);
        }
      }
    }

    expect({ applied, noOp }).toEqual({ applied: 2, noOp: 39 });
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
    expect(DREAM_REFLECTION_PROMPT_ID).toBe('oneiros-dream-reflection-v3.2.3-candidate');
    expect(SAME_CALL_REFLECTIVE_QUESTIONS_METHOD_ID).toBe(
      'oneiros-same-call-reflective-questions-v1.0.3-candidate'
    );
    expect(quick.messages[2].content).toContain('exactly one natural reflective question');
    expect(quick.messages[2].content).not.toContain('## Reflective Questions');
    expect(standard.messages[2].content).toContain('Exactly 2 questions as markdown bullets');
    expect(standard.messages[2].content).toContain('Do not use 1–2');
    expect(advanced.messages[2].content).toContain('Exactly 2 questions as markdown bullets');
    expect(standard.messages.map((message) => message.content).join('\n')).toContain(
      'Keep all markdown section headings exactly as specified in English'
    );
    expect(standard.messages[2].content).toContain('Question 1 — enacted relation');
    expect(standard.messages[2].content).toContain(
      'one complete event explicitly reported in the dream'
    );
    expect(standard.messages[2].content).toContain('Question 2 — symbolic / relational / imaginal');
    expect(standard.messages[2].content).toContain('X or Y) is still a manufactured choice');
    expect(standard.messages[2].content).toContain('unreported visual, sensory, bodily, or factual detail');
    expect(standard.messages[2].content).toContain('do not state an inferred meaning');
    expect(standard.messages[2].content).not.toContain('Never supply candidate answer vocabulary');
    expect(standard.messages[2].content).not.toContain('Do not reconstruct missing inner footage');
    expect(standard.messages[2].content).not.toContain('Deepen the relation; do not widen the menu');
    expect(standard.messages[2].content).not.toContain('Never retreat to generic shells');
    expect(standard.messages[2].content).toContain(SAME_CALL_QUESTION_SAFEGUARDS.trim().slice(0, 40));
    expect(quick.messages[2].content).toContain('No advice verbs');
    expect(quick.reflectiveLanguageContext?.expectedLanguageCode).toBe('en');
    expect(quick.messages[3].content).toContain('Use the established output language English (en)');
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
    expect(FOLLOWUP_CHAT_PROMPT_ID).toBe('oneiros-followup-chat-v2.0.1');
    expect(open.responseFormat).toBeUndefined();
    expect(openText).toContain(CHAT_MODE_INSTRUCTIONS.trim().slice(0, 40));
    expect(openText).toContain('end with exactly one natural reflective question');
    expect(openText).not.toContain('Do not append a reflective question');
    expect(openText).toMatch(/Do not manufacture\s+either\/or choices/);
    expect(openText).toContain('X or Y is still a manufactured choice');
    expect(openText).not.toContain('unless the dream itself explicitly stages that exact unresolved choice');
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

  it('observes missing question cardinality without a contract retry or second LLM', () => {
    const reader = readFileSync(path.join(__dirname, '../src/ai/dreamReflectionPrompt.ts'), 'utf8');
    const billing = readFileSync(
      path.join(__dirname, '../supabase/functions/_shared/billing-ai.ts'),
      'utf8'
    );
    expect(reader).toContain('never by a second question call');
    expect(reader).toContain('complete reading, including the required reflective question(s)');
    expect(billing).toContain('safeObserveReflectiveContract');
    expect(billing).toContain('observeReflectiveContractFailOpen');
    expect(billing).not.toContain('same-call whole-reading retry start');
    expect(billing).not.toContain('same_call_reading_contract_invalid');
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
