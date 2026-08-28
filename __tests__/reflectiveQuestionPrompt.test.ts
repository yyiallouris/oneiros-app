import {
  buildDreamEvidenceSpans,
  buildReflectiveQuestionMessages,
  buildUserEvidenceSpans,
  createReflectiveQuestionArtifact,
  hasSingleReflectiveQuestionMovement,
  normalizeReflectiveQuestionArtifact,
  parseReflectiveQuestionResult,
  REFLECTIVE_QUESTION_METHOD_ID,
  REFLECTIVE_QUESTION_PRODUCTION_BUNDLE,
  REFLECTIVE_QUESTION_PROMPT,
  REFLECTIVE_QUESTION_PROMPT_ID,
  REFLECTIVE_QUESTION_SCHEMA_VERSION,
  validateReflectiveQuestionCommit,
  validateReflectiveQuestionText,
} from '../src/ai/reflectiveQuestionPrompt';
import {
  buildChatReflectiveLanguageContext,
  buildInitialReflectiveLanguageContext,
} from '../src/ai/reflectiveLanguage';
import {
  hashReflectiveQuestionPrompt,
} from '../src/ai/reflectiveQuestionProductionHold';

const cleanChecks = {
  shortest_answer_already_supplied: false,
  requires_missing_footage: false,
  portable_generic_shell: false,
  preserves_polarity_and_agency: true,
  spoken_native_form: true,
};

describe('Reflective Questions v5 single-pass candidate', () => {
  it('keeps the v5 single-pass bundle frozen for chat-only continuation', () => {
    expect(REFLECTIVE_QUESTION_METHOD_ID).toBe('oneiros-reflective-question-v5.0.0');
    expect(REFLECTIVE_QUESTION_PROMPT_ID).toBe('reflective-question-single-pass-v5.0.0');
    expect(REFLECTIVE_QUESTION_SCHEMA_VERSION).toBe(6);
    expect(REFLECTIVE_QUESTION_PROMPT).toContain('Work in one pass');
    expect(REFLECTIVE_QUESTION_PROMPT).toContain('completed_relation');
    expect(REFLECTIVE_QUESTION_PROMPT).toContain('provisional reading or answer');
    expect(REFLECTIVE_QUESTION_PROMPT).toContain('cannot add a');
    expect(REFLECTIVE_QUESTION_PROMPT).toContain('Polarity and agency');
    expect(hashReflectiveQuestionPrompt(REFLECTIVE_QUESTION_PRODUCTION_BUNDLE)).toBe(
      '759b4726a666ea12ac087c7fae61c9a7681def2f7ecadbf04e08a3bb36555472'
    );
  });

  it('keeps D# as initial evidence and adds only user-authored U# on chat', () => {
    const dream = 'I hold the open gate while the fox crosses.';
    const spans = buildDreamEvidenceSpans(dream);
    const conversation = [
      { role: 'assistant' as const, content: 'The gate may speak of permission.' },
      { role: 'user' as const, content: 'My hand stayed warm on the gate.' },
    ];
    const userEvidence = buildUserEvidenceSpans(conversation, 'I did not follow the fox.');
    expect(userEvidence.map((span) => span.text)).toEqual([
      'My hand stayed warm on the gate.',
      'I did not follow the fox.',
    ]);
    const initial = buildReflectiveQuestionMessages({
      surface: 'initial',
      languageContext: buildInitialReflectiveLanguageContext({ dreamContent: dream, knownLanguageCode: 'en' }),
      evidenceSpans: spans,
      initialReadingContext: 'The fox symbolizes freedom.',
    });
    expect(initial[1].content).toContain('orientation only, never evidence');
    expect(initial[1].content).toContain('INITIAL PRODUCT CONSTRAINT');
    const chat = buildReflectiveQuestionMessages({
      surface: 'chat',
      languageContext: buildChatReflectiveLanguageContext({
        dreamContent: dream,
        conversation,
        latestUserMessage: 'I did not follow the fox.',
      }),
      evidenceSpans: spans,
      userEvidenceSpans: userEvidence,
      conversation,
    });
    expect(chat[1].content).toContain('[U2] I did not follow the fox.');
    expect(chat[1].content).toContain('CHAT CONSTRAINT');
  });

  it('parses a committed question only when every structural check passes', () => {
    const context = buildInitialReflectiveLanguageContext({
      dreamContent: 'I waited at the table for a host who never arrived.',
      knownLanguageCode: 'en',
    });
    const parsed = parseReflectiveQuestionResult(JSON.stringify({
      decision: 'question',
      evidence_ids: ['D1'],
      living_edge: 'Waiting continues around the absent host',
      answer_target: 'what the waiting asks the dreamer to keep present',
      opening_mode: 'unresolved_relation',
      question: 'What did you keep waiting for as the host remained absent from the table?',
      output_language: 'en',
      commit_checks: cleanChecks,
      risk_flags: [],
      abstain_reason: null,
    }), new Set(['D1']), context);
    expect(parsed.ok).toBe(true);

    const reversed = parseReflectiveQuestionResult(JSON.stringify({
      decision: 'question', evidence_ids: ['D1'], living_edge: 'Waiting ends',
      answer_target: 'what ends', opening_mode: 'unresolved_relation',
      question: 'What changed when you stopped waiting for the absent host?',
      output_language: 'en',
      commit_checks: { ...cleanChecks, preserves_polarity_and_agency: false },
      risk_flags: [], abstain_reason: null,
    }), new Set(['D1']), context);
    expect(reversed).toEqual({ ok: false, errors: ['polarity_or_agency_not_preserved'] });
  });

  it('keeps semantic self-checks diagnostic and blocks known failed declarations', () => {
    const result = {
      decision: 'question' as const,
      evidence_ids: ['D1'],
      living_edge: 'The words rest on the table',
      answer_target: 'the relation to the resting words',
      opening_mode: 'completed_relation' as const,
      question: 'How did it feel when the words changed?',
      output_language: 'en' as const,
      commit_checks: { ...cleanChecks, requires_missing_footage: true },
      risk_flags: [],
      abstain_reason: null,
    };
    expect(validateReflectiveQuestionCommit(result)).toContain('requires_missing_footage');
    const repeated = { ...result, commit_checks: cleanChecks };
    expect(validateReflectiveQuestionCommit(repeated, {
      previouslyAskedQuestions: [repeated.question],
    })).toContain('repeated_question_recommitted');
  });

  it('accepts natural Japanese interrogative endings without inventing a compound failure', () => {
    const japanese = 'ネオンの家に近づくとき、足どりはどんな速さを保ちますか。';
    expect(hasSingleReflectiveQuestionMovement(japanese, 'ja')).toBe(true);
    expect(validateReflectiveQuestionText(japanese, 'ja')).toEqual([]);
    expect(hasSingleReflectiveQuestionMovement('何が見えますか。何を待ちますか。', 'ja')).toBe(false);
  });

  it('accepts one natural Greek question mark without treating it as a compound question', () => {
    const greek = 'Τι μένει ζωντανό στη στάση σου ανάμεσα στους δύο ορόφους;';
    expect(hasSingleReflectiveQuestionMovement(greek, 'el')).toBe(true);
    expect(validateReflectiveQuestionText(greek, 'el')).toEqual([]);
    expect(hasSingleReflectiveQuestionMovement('Τι μένει; Και τι αλλάζει;', 'el')).toBe(false);
  });

  it('writes schema v6 provenance and reads exact v1-v5 identities', () => {
    const artifact = createReflectiveQuestionArtifact({
      id: 'rq-v6', surface: 'initial', createdAt: '2026-08-28T12:00:00.000Z',
      question: 'What stayed in your hand while you held the gate open for the fox?',
      languageCode: 'en', evidenceIds: ['D1'],
    });
    expect(artifact).toMatchObject({
      schemaVersion: 6,
      methodId: REFLECTIVE_QUESTION_METHOD_ID,
      promptId: REFLECTIVE_QUESTION_PROMPT_ID,
      abstainReason: null,
    });
    expect(normalizeReflectiveQuestionArtifact(artifact)).toEqual(artifact);
    const oldVersions = [
      [1, '2.1.0'], [2, '2.3.1'], [3, '2.4.0'], [4, '3.2.0'], [5, '4.1.0'],
    ] as const;
    for (const [schemaVersion, version] of oldVersions) {
      const director = version === '4.1.0';
      const legacy = {
        id: `rq-${version}`, status: 'question', surface: 'initial',
        question: artifact.question, languageCode: 'en', evidenceIds: ['D1'],
        generatorPromptId: `oneiros-reflective-question-${director ? 'director' : 'generator'}-v${version}`,
        generatorPromptVersion: version,
        validatorPromptId: `oneiros-reflective-question-${director ? 'composer' : 'validator'}-v${version}`,
        validatorPromptVersion: version, schemaVersion,
        createdAt: '2026-08-28T12:00:00.000Z',
      };
      expect(normalizeReflectiveQuestionArtifact(legacy)).toEqual(legacy);
    }
  });

  it('writes explicit nulls for a schema-v6 abstention', () => {
    const artifact = createReflectiveQuestionArtifact({
      id: 'rq-v6-abstain', surface: 'chat', createdAt: '2026-08-28T12:00:00.000Z',
      abstainReason: 'semantic_abstention',
    });
    expect(artifact).toMatchObject({
      schemaVersion: 6,
      status: 'abstained',
      question: null,
      languageCode: null,
      abstainReason: 'semantic_abstention',
    });
    expect(normalizeReflectiveQuestionArtifact(artifact)).toEqual(artifact);
  });
});
