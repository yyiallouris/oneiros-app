import { createHash } from 'crypto';
import { readFileSync } from 'fs';
import path from 'path';
import {
  buildReflectiveQuestionComposerMessages,
  buildReflectiveQuestionComposerResponseFormat,
  composerRejectionFromErrors,
  createFallbackComposerArtifact,
  createModelComposerArtifact,
  isComposerKillSwitchEnabled,
  mapReadingDepthToQuestionDepth,
  parseReflectiveQuestionComposerResult,
  REFLECTIVE_QUESTION_COMPOSER_BUNDLE,
  REFLECTIVE_QUESTION_COMPOSER_FALLBACK_KEY,
  REFLECTIVE_QUESTION_COMPOSER_FROZEN_ANCHOR_CORPUS_SHA256,
  REFLECTIVE_QUESTION_COMPOSER_METHOD_ID,
  REFLECTIVE_QUESTION_COMPOSER_SOURCE_METHOD_ID,
  REFLECTIVE_QUESTION_COMPOSER_MODEL,
  REFLECTIVE_QUESTION_COMPOSER_PROMPT,
  REFLECTIVE_QUESTION_COMPOSER_PROMPT_ID,
  REFLECTIVE_QUESTION_COMPOSER_SCHEMA_VERSION,
  REFLECTIVE_QUESTION_COMPOSER_TASK,
  REFLECTIVE_QUESTION_COMPOSER_TEMPERATURE,
  REFLECTIVE_QUESTION_COMPOSER_TOKEN_LIMIT,
} from '../src/ai/reflectiveQuestionComposer';
import {
  createComposerQuestionArtifact,
  createEditorialArcQuestionArtifact,
  HISTORICAL_REFLECTIVE_QUESTION_COMPOSER_V1_0_0_METHOD_ID,
  HISTORICAL_REFLECTIVE_QUESTION_COMPOSER_V1_0_0_PROMPT_ID,
  HISTORICAL_REFLECTIVE_QUESTION_COMPOSER_V1_0_0_VERSION,
  HISTORICAL_REFLECTIVE_QUESTION_COMPOSER_V1_0_1_METHOD_ID,
  normalizeReflectiveQuestionArtifact,
} from '../src/ai/reflectiveQuestionPrompt';
import {
  APPROVED_REFLECTIVE_QUESTION_PRODUCTION,
  DENIED_REFLECTIVE_QUESTION_PRODUCTION_CANDIDATES,
  HISTORICAL_REFLECTIVE_QUESTION_COMPOSER_V1_0_0_SHA256,
  HISTORICAL_REFLECTIVE_QUESTION_COMPOSER_V1_0_1_SHA256,
  hashReflectiveQuestionPrompt,
  PENDING_REFLECTIVE_DIALOGUE_PRODUCTION_CANDIDATE,
} from '../src/ai/reflectiveQuestionProductionHold';
import {
  ONEIROS_LANGUAGE_CODES,
  type OneirosLanguageCode,
} from '../src/constants/oneirosLanguages';
import {
  getReflectiveQuestionFallback,
  REFLECTIVE_QUESTION_COPY,
  REFLECTIVE_QUESTION_FALLBACK_COPY_KEY,
} from '../src/constants/reflectiveQuestionCopy';
import { FROZEN_ANCHOR_CORPUS_SHA256 } from '../scripts/lib/frozenAnchorReadings';

const evidence = [
  { id: 'D1' as const, text: 'The white bird placed a red thread across my open palm.' },
  { id: 'D2' as const, text: 'I followed it without closing my hand.' },
];

describe('reflective-question composer v1.1 brutal-simple', () => {
  it('freezes the production-oriented composer identity', () => {
    expect(REFLECTIVE_QUESTION_COMPOSER_METHOD_ID).toBe(
      'oneiros-reflective-question-composer-v1.1.0-candidate'
    );
    expect(REFLECTIVE_QUESTION_COMPOSER_SOURCE_METHOD_ID).toBe(
      REFLECTIVE_QUESTION_COMPOSER_METHOD_ID
    );
    expect(REFLECTIVE_QUESTION_COMPOSER_PROMPT_ID).toBe(
      'oneiros-reflective-question-composer-prompt-v1.1.0-candidate'
    );
    expect(REFLECTIVE_QUESTION_COMPOSER_SCHEMA_VERSION).toBe(10);
    expect(REFLECTIVE_QUESTION_COMPOSER_MODEL).toBe('gpt-5.4');
    expect(REFLECTIVE_QUESTION_COMPOSER_TEMPERATURE).toBe(0.45);
    expect(REFLECTIVE_QUESTION_COMPOSER_TOKEN_LIMIT).toBe(360);
    expect(REFLECTIVE_QUESTION_COMPOSER_TASK).toBe('reflective_question_generate');
    expect(REFLECTIVE_QUESTION_COMPOSER_FALLBACK_KEY).toBe('dream_reflective_question_fallback');
    expect(PENDING_REFLECTIVE_DIALOGUE_PRODUCTION_CANDIDATE.methodId).toBe(
      'oneiros-same-call-reflective-questions-v1.0.3-candidate'
    );
    expect(PENDING_REFLECTIVE_DIALOGUE_PRODUCTION_CANDIDATE.promptSha256).not.toBe(
      hashReflectiveQuestionPrompt(REFLECTIVE_QUESTION_COMPOSER_BUNDLE)
    );
    expect(createHash('sha256').update(REFLECTIVE_QUESTION_COMPOSER_BUNDLE.trim()).digest('hex'))
      .toBe('a42e79dfcf43bf171ac5f2a6fa73b61e2444b7c4582bba24fb80afa2d35ab7c8');
    expect(HISTORICAL_REFLECTIVE_QUESTION_COMPOSER_V1_0_1_SHA256).toBe(
      '56150c8226dcda66302e29f6eab82b261e1874466095f08acb6062a8823d8ba9'
    );
    expect(HISTORICAL_REFLECTIVE_QUESTION_COMPOSER_V1_0_0_SHA256).toBe(
      '44a44cc43635d1939a10d3c3f70462b9e3576513a05af177350712903d49cbd2'
    );
    expect(APPROVED_REFLECTIVE_QUESTION_PRODUCTION?.methodId).toBe(
      'oneiros-same-call-reflective-questions-v1.0.3-candidate'
    );
  });

  it('keeps the brutal-simple constitution without taxonomy or self-check', () => {
    expect(REFLECTIVE_QUESTION_COMPOSER_PROMPT).toContain(
      'Write exactly one natural, beautiful, post-Jungian reflective question'
    );
    expect(REFLECTIVE_QUESTION_COMPOSER_PROMPT).toContain('living symbolic experience');
    expect(REFLECTIVE_QUESTION_COMPOSER_PROMPT).toContain(
      'Write exactly one question, only in the requested output language'
    );
    expect(REFLECTIVE_QUESTION_COMPOSER_PROMPT).toContain(
      'CORE: clear, alive and immediately understandable, but never shallow.'
    );
    expect(REFLECTIVE_QUESTION_COMPOSER_PROMPT).toContain(
      'DEEPER: allow greater relational or psychological depth'
    );
    expect(REFLECTIVE_QUESTION_COMPOSER_PROMPT).not.toContain('RELATION');
    expect(REFLECTIVE_QUESTION_COMPOSER_PROMPT).not.toContain('IMAGE');
    expect(REFLECTIVE_QUESTION_COMPOSER_PROMPT).not.toContain('COMPLETION');
    expect(REFLECTIVE_QUESTION_COMPOSER_PROMPT).not.toContain('kind');
    expect(REFLECTIVE_QUESTION_COMPOSER_PROMPT).not.toContain('evidence_ids');
    expect(REFLECTIVE_QUESTION_COMPOSER_PROMPT).not.toContain('no_question');
    expect(REFLECTIVE_QUESTION_COMPOSER_PROMPT).not.toContain('living_edge');
    expect(REFLECTIVE_QUESTION_COMPOSER_PROMPT).not.toContain('answer_target');
    expect(REFLECTIVE_QUESTION_COMPOSER_PROMPT).not.toContain('archetype');
    expect(REFLECTIVE_QUESTION_COMPOSER_PROMPT).not.toContain('compensation');
    expect(REFLECTIVE_QUESTION_COMPOSER_PROMPT).not.toContain('Director');
    expect(REFLECTIVE_QUESTION_COMPOSER_PROMPT).not.toContain('judge');
    expect(REFLECTIVE_QUESTION_COMPOSER_PROMPT).not.toContain('repair');
    expect(REFLECTIVE_QUESTION_COMPOSER_PROMPT).not.toMatch(
      /elevator-missing-button|words-rest-on-table|shared-scarf-at-harbor/iu
    );
  });

  it('maps product reading modes onto composer depth without renaming them', () => {
    expect(mapReadingDepthToQuestionDepth('quick')).toBe('core');
    expect(mapReadingDepthToQuestionDepth('standard')).toBe('core');
    expect(mapReadingDepthToQuestionDepth('advanced')).toBe('deeper');
  });

  it('builds the exact raw-dream, reading, depth, and language wrapper', () => {
    const messages = buildReflectiveQuestionComposerMessages({
      evidenceSpans: evidence,
      finalReading: '## Core Restoration\n\nThe ridge holds the sunrise without asking anything more.',
      depth: 'core',
      outputLanguage: 'el',
    });
    expect(messages).toHaveLength(2);
    expect(messages[0]).toEqual({ role: 'system', content: REFLECTIVE_QUESTION_COMPOSER_PROMPT });
    expect(messages[1].content).toContain('<RAW_DREAM_EVIDENCE>');
    expect(messages[1].content).toContain('[D1] The white bird placed a red thread across my open palm.');
    expect(messages[1].content).toContain('<FINAL_READING_READ_ONLY>');
    expect(messages[1].content).toContain('<QUESTION_DEPTH>core</QUESTION_DEPTH>');
    expect(messages[1].content).toContain('<OUTPUT_LANGUAGE>el</OUTPUT_LANGUAGE>');
  });

  it('uses a one-field always-question schema', () => {
    const format = buildReflectiveQuestionComposerResponseFormat();
    expect(format.json_schema.strict).toBe(true);
    expect(Object.keys(format.json_schema.schema.properties as object)).toEqual(['question']);
    expect((format.json_schema.schema as { required: string[] }).required).toEqual(['question']);
  });

  it('parses only the question field and rejects extra taxonomy without a question-mark rule', () => {
    expect(parseReflectiveQuestionComposerResult(JSON.stringify({
      question: 'Where does the red thread lead while your hand remains open?',
    }))).toMatchObject({
      ok: true,
      data: { question: 'Where does the red thread lead while your hand remains open?' },
    });
    expect(parseReflectiveQuestionComposerResult(JSON.stringify({
      question: 'Ποια κίνηση κρατά το κόκκινο νήμα πάνω στην ανοιχτή παλάμη;',
    }))).toMatchObject({ ok: true });
    expect(parseReflectiveQuestionComposerResult(JSON.stringify({
      question: '夢のどのイメージが、もう少しそばにいるようにと呼びかけていますか。',
    }))).toMatchObject({ ok: true });

    expect(parseReflectiveQuestionComposerResult(JSON.stringify({
      kind: 'image',
      question: 'Where does the thread go?',
      evidence_ids: ['D1'],
      output_language: 'en',
    })).ok).toBe(false);
    expect(parseReflectiveQuestionComposerResult(JSON.stringify({
      decision: 'no_question',
      question: null,
    })).ok).toBe(false);
    expect(parseReflectiveQuestionComposerResult(JSON.stringify({
      question: '   ',
    }))).toMatchObject({ ok: false, errors: expect.arrayContaining(['question_missing']) });
    expect(composerRejectionFromErrors(['invalid_json_object'])).toBe('schema_rejection');
    expect(composerRejectionFromErrors(['question_missing'])).toBe('schema_rejection');
  });

  it('localizes the emergency fallback for every supported language', () => {
    expect(REFLECTIVE_QUESTION_FALLBACK_COPY_KEY).toBe('dream_reflective_question_fallback');
    expect(getReflectiveQuestionFallback('el')).toBe(
      'Αν επιστρέψεις για λίγο σε αυτό το όνειρο, τι παρατηρείς τώρα;'
    );
    expect(getReflectiveQuestionFallback('en')).toBe(
      'If you return to this dream for a moment, what do you notice now?'
    );
    for (const code of ONEIROS_LANGUAGE_CODES) {
      const fallback = getReflectiveQuestionFallback(code);
      expect(fallback.trim().length).toBeGreaterThan(8);
      expect(REFLECTIVE_QUESTION_COPY[code].fallbackQuestion).toBe(fallback);
      const artifact = createFallbackComposerArtifact({
        id: `fallback-${code}`,
        createdAt: '2026-08-28T12:00:00.000Z',
        languageCode: code as OneirosLanguageCode,
        depth: 'core',
      });
      expect(artifact.status).toBe('question');
      expect(artifact.source).toBe('fallback');
      expect(artifact.question).toBe(fallback);
      expect(artifact.schemaVersion).toBe(10);
      expect(artifact).not.toHaveProperty('kind');
      expect(normalizeReflectiveQuestionArtifact(artifact)).toEqual(artifact);
    }
  });

  it('never emits no_question from the new write path and still reads old schemas', () => {
    const model = createModelComposerArtifact({
      id: 'model-1',
      createdAt: '2026-08-28T12:00:00.000Z',
      depth: 'core',
      question: 'What stays in the open palm with the red thread?',
      languageCode: 'en',
    });
    expect(model.status).toBe('question');
    expect(model.source).toBe('model');
    expect(model.schemaVersion).toBe(10);
    expect(model).not.toHaveProperty('kind');
    expect(normalizeReflectiveQuestionArtifact(model)?.status).toBe('question');
    expect(normalizeReflectiveQuestionArtifact({
      ...model,
      question: 'Ποια εικόνα του ονείρου σε καλεί να μείνεις λίγο ακόμη μαζί της;',
      languageCode: 'el',
    })?.status).toBe('question');

    const historical = createEditorialArcQuestionArtifact({
      id: 'old-no-question',
      createdAt: '2026-08-28T12:00:00.000Z',
      status: 'no_question',
      languageCode: 'el',
    });
    expect(historical.status).toBe('no_question');
    expect(normalizeReflectiveQuestionArtifact(historical)?.status).toBe('no_question');
    expect(normalizeReflectiveQuestionArtifact({
      id: 'historical-standard-depth',
      status: 'question',
      surface: 'initial',
      kind: 'relation',
      question: 'What stays in the open palm with the red thread?',
      languageCode: 'en',
      evidenceIds: ['D1'],
      depth: 'standard',
      source: 'model',
      abstainReason: null,
      methodId: HISTORICAL_REFLECTIVE_QUESTION_COMPOSER_V1_0_0_METHOD_ID,
      methodVersion: HISTORICAL_REFLECTIVE_QUESTION_COMPOSER_V1_0_0_VERSION,
      promptId: HISTORICAL_REFLECTIVE_QUESTION_COMPOSER_V1_0_0_PROMPT_ID,
      promptVersion: HISTORICAL_REFLECTIVE_QUESTION_COMPOSER_V1_0_0_VERSION,
      schemaVersion: 9,
      createdAt: '2026-08-28T15:27:09.876Z',
    })).toMatchObject({
      status: 'question',
      depth: 'standard',
      kind: 'relation',
      methodId: HISTORICAL_REFLECTIVE_QUESTION_COMPOSER_V1_0_0_METHOD_ID,
      schemaVersion: 9,
    });
    expect(normalizeReflectiveQuestionArtifact({
      id: 'historical-v1-0-1',
      status: 'question',
      surface: 'initial',
      kind: 'image',
      question: 'What stays in the open palm with the red thread?',
      languageCode: 'en',
      evidenceIds: ['D1'],
      depth: 'core',
      source: 'model',
      abstainReason: null,
      methodId: HISTORICAL_REFLECTIVE_QUESTION_COMPOSER_V1_0_1_METHOD_ID,
      methodVersion: '1.0.1-candidate',
      promptId: 'oneiros-reflective-question-composer-prompt-v1.0.1-candidate',
      promptVersion: '1.0.1-candidate',
      schemaVersion: 9,
      createdAt: '2026-08-28T16:01:35.470Z',
    })).toMatchObject({
      status: 'question',
      methodId: HISTORICAL_REFLECTIVE_QUESTION_COMPOSER_V1_0_1_METHOD_ID,
      schemaVersion: 9,
    });
    expect(() => createComposerQuestionArtifact({
      id: 'empty',
      createdAt: '2026-08-28T12:00:00.000Z',
      question: '   ',
      languageCode: 'en',
      depth: 'core',
      source: 'fallback',
    })).toThrow(/non-empty question/);
  });

  it('keeps failed Inviter SHAs denied and the composer out of R&D runtime imports', () => {
    expect(DENIED_REFLECTIVE_QUESTION_PRODUCTION_CANDIDATES).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          methodId: 'oneiros-post-jungian-inviter-v2.0.1-candidate',
          promptSha256: '09045bf1860b2a2a6325e468cc19de019c351f0162cfa17c3f0a6153f3f3f35e',
        }),
        expect.objectContaining({
          methodId: 'oneiros-post-reading-inviter-v1.0.0-candidate',
          promptSha256: '70c533e59b56693d5ade15a5234d2a7457ef194ba157750f67e884e13bb42cfa',
        }),
        expect.objectContaining({
          methodId: 'oneiros-reflection-editorial-arc-v2.0.0-candidate',
          promptSha256: '6cd304e1c246f237f21743232de32723e81656f9c8cb3c4f51ee49fe26249b49',
        }),
      ])
    );
    expect(REFLECTIVE_QUESTION_COMPOSER_FROZEN_ANCHOR_CORPUS_SHA256).toBe(FROZEN_ANCHOR_CORPUS_SHA256);
    expect(isComposerKillSwitchEnabled({ ONEIROS_REFLECTIVE_QUESTION_COMPOSER_KILL_SWITCH: '1' })).toBe(true);
    expect(isComposerKillSwitchEnabled({})).toBe(false);
    [
      'src/services/ai.ts',
      'src/services/entitledAiService.ts',
      'supabase/functions/ai-entitlements-gateway/index.ts',
      'supabase/functions/_shared/billing-ai.ts',
    ].forEach((rel) => {
      const source = readFileSync(path.join(process.cwd(), rel), 'utf8');
      expect(source).not.toMatch(/postJungianInviter|postReadingInviter/);
      expect(source).not.toMatch(/from '\.\.\/ai\/rd\/reflective-questions/);
    });
    expect(readFileSync(path.join(process.cwd(), 'supabase/functions/_shared/billing-ai.ts'), 'utf8'))
      .not.toMatch(/generateProductionReflectiveQuestion/);
    expect(readFileSync(path.join(process.cwd(), 'supabase/functions/_shared/billing-ai.ts'), 'utf8'))
      .not.toMatch(/generateInitialComposerQuestion/);
    expect(readFileSync(path.join(process.cwd(), 'supabase/functions/_shared/billing-ai.ts'), 'utf8'))
      .not.toMatch(/createEditorialArcQuestionArtifact/);
    expect(readFileSync(path.join(process.cwd(), 'src/ai/dreamReflectionPrompt.ts'), 'utf8'))
      .toMatch(/oneiros-dream-reflection-v3\.2\.3-candidate/);
  });
});
