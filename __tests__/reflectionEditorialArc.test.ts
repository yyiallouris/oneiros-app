import {
  REFLECTION_EDITORIAL_ARC_PAYLOAD_END,
  REFLECTION_EDITORIAL_ARC_PAYLOAD_START,
  REFLECTION_EDITORIAL_ARC_READING_START,
  parseReflectionEditorialArcQuestion,
  splitReflectionEditorialArc,
  visibleEditorialArcReading,
} from '../src/ai/reflectionEditorialArc';
import { END_MARKER_DREAM_READING } from '../src/ai/dreamReflectionPrompt';
import {
  createEditorialArcQuestionArtifact,
  normalizeReflectiveQuestionArtifact,
} from '../src/ai/reflectiveQuestionPrompt';

const questionPayload = JSON.stringify({
  question: 'What remains between the fox crossing and your staying beside the gate?',
  question_evidence_ids: ['D1'],
  output_language: 'en',
});

function response(payload: string, reading = 'The fox crosses the open gate while you remain beside it.'): string {
  return [
    REFLECTION_EDITORIAL_ARC_PAYLOAD_START,
    payload,
    REFLECTION_EDITORIAL_ARC_PAYLOAD_END,
    REFLECTION_EDITORIAL_ARC_READING_START,
    reading,
    END_MARKER_DREAM_READING,
  ].join('\n');
}

describe('reflection editorial arc protocol v2', () => {
  it('parses the private opening before the user-facing reading', () => {
    const split = splitReflectionEditorialArc(
      response(questionPayload),
      END_MARKER_DREAM_READING
    );
    expect(split).toEqual({
      reading: 'The fox crosses the open gate while you remain beside it.',
      payloadText: questionPayload,
      hasReadingStartMarker: true,
      hasReadingEndMarker: true,
      hasPayloadEnvelope: true,
    });
    expect(parseReflectionEditorialArcQuestion(split.payloadText, new Set(['D1']))).toEqual({
      ok: true,
      data: {
        decision: 'question',
        question: 'What remains between the fox crossing and your staying beside the gate?',
        questionEvidenceIds: ['D1'],
        outputLanguage: 'en',
      },
    });
  });

  it('hides historical private envelopes and still streams marker-free readings', () => {
    const privatePartial = `${REFLECTION_EDITORIAL_ARC_PAYLOAD_START}\n${questionPayload}`;
    expect(visibleEditorialArcReading(privatePartial, END_MARKER_DREAM_READING)).toBe('');

    const readingPartial = [
      REFLECTION_EDITORIAL_ARC_PAYLOAD_START,
      questionPayload,
      REFLECTION_EDITORIAL_ARC_PAYLOAD_END,
      REFLECTION_EDITORIAL_ARC_READING_START,
      'The fox crosses the open gate.\n<!--END_DREAM_REA',
    ].join('\n');
    expect(visibleEditorialArcReading(readingPartial, END_MARKER_DREAM_READING)).toBe(
      'The fox crosses the open gate.'
    );
    expect(visibleEditorialArcReading(response(questionPayload), END_MARKER_DREAM_READING)).toBe(
      'The fox crosses the open gate while you remain beside it.'
    );
    expect(visibleEditorialArcReading(
      'The ridge holds the sunrise.<!--END_DREAM_READING-->',
      END_MARKER_DREAM_READING
    )).toBe('The ridge holds the sunrise.');
  });

  it('accepts an explicit no-question ending with language provenance', () => {
    const noQuestion = JSON.stringify({
      question: null,
      question_evidence_ids: [],
      output_language: 'en',
    });
    expect(parseReflectionEditorialArcQuestion(noQuestion, new Set(['D1']))).toEqual({
      ok: true,
      data: {
        decision: 'no_question',
        question: null,
        questionEvidenceIds: [],
        outputLanguage: 'en',
      },
    });
  });

  it('fails closed on unsupported evidence and extra fields', () => {
    expect(parseReflectionEditorialArcQuestion(JSON.stringify({
      question: 'What remains with the gate?',
      question_evidence_ids: ['D9'],
      output_language: 'en',
    }), new Set(['D1']))).toEqual({ ok: false, errors: ['unsupported_evidence'] });

    expect(parseReflectionEditorialArcQuestion(JSON.stringify({
      question: null,
      question_evidence_ids: ['D1'],
      output_language: 'en',
    }), new Set(['D1']))).toEqual({ ok: false, errors: ['unsupported_evidence'] });
  });

  it('round-trips schema 8 question and no-question artifacts', () => {
    const question = createEditorialArcQuestionArtifact({
      id: 'rq-editorial-1',
      createdAt: '2026-08-28T12:00:00.000Z',
      question: 'What remains between the fox crossing and your staying beside the gate?',
      languageCode: 'en',
      evidenceIds: ['D1'],
    });
    const noQuestion = createEditorialArcQuestionArtifact({
      id: 'rq-editorial-2',
      createdAt: '2026-08-28T12:01:00.000Z',
      status: 'no_question',
      languageCode: 'en',
    });
    expect(question.schemaVersion).toBe(8);
    expect(noQuestion.status).toBe('no_question');
    expect(normalizeReflectiveQuestionArtifact(question)).toEqual(question);
    expect(normalizeReflectiveQuestionArtifact(noQuestion)).toEqual(noQuestion);
  });

  it('salvages a complete reading when the private opening JSON is malformed', () => {
    const split = splitReflectionEditorialArc(
      response('{bad json', 'A complete reading survives.'),
      END_MARKER_DREAM_READING
    );
    expect(split.reading).toBe('A complete reading survives.');
    expect(parseReflectionEditorialArcQuestion(split.payloadText, new Set(['D1']))).toEqual({
      ok: false,
      errors: ['invalid_question_json'],
    });
  });

  it('does not heuristically salvage reading when BEGIN is missing', () => {
    const malformed = [
      REFLECTION_EDITORIAL_ARC_PAYLOAD_START,
      questionPayload,
      REFLECTION_EDITORIAL_ARC_PAYLOAD_END,
      'A reading without the required boundary.',
      END_MARKER_DREAM_READING,
    ].join('\n');
    const split = splitReflectionEditorialArc(malformed, END_MARKER_DREAM_READING);
    expect(split.reading).toBe('');
    expect(split.hasReadingStartMarker).toBe(false);
  });
});
