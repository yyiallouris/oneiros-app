import {
  observeReflectiveContract,
  safeObserveReflectiveContract,
  REFLECTIVE_CONTRACT_OBSERVATION_ERROR_CODE,
  REFLECTIVE_CONTRACT_VALIDATION_VERSION,
} from '../src/ai/reflectiveContractObservation';
import type { ReflectiveLanguageContext } from '../src/ai/reflectiveLanguage';

const englishContext: ReflectiveLanguageContext = {
  source: 'dream_narrative',
  sourceText: 'I was walking beside the sea.',
  expectedLanguageCode: 'en',
};

describe('reflective contract shadow observation', () => {
  it('records a passing reading without carrying raw generated text', () => {
    const observation = observeReflectiveContract({
      content: [
        '## Core Shift',
        '',
        'The sea becomes quiet around the dreamer.',
        '',
        '## Dream Movement',
        '',
        'The dream remains close to the shore and its changing light.',
        '',
        '## Reflective Questions',
        '',
        '- What changes when you stay beside the quiet water?',
        '- What remains with you from the light on the shore?',
        '',
        '<!--END_DREAM_READING-->',
      ].join('\n'),
      contractSurface: 'standard',
      telemetrySurface: 'reading_standard',
      languageContext: englishContext,
      requiredEndMarker: '<!--END_DREAM_READING-->',
    });

    expect(observation).toEqual({
      passed: true,
      issues: [],
      validation_version: REFLECTIVE_CONTRACT_VALIDATION_VERSION,
      surface: 'reading_standard',
      question_count: 2,
      expected_question_count: 2,
      detected_language: 'en',
      expected_language: 'en',
      answer_menu_detected: false,
      observation_error: false,
      observation_error_code: null,
    });
    expect(JSON.stringify(observation)).not.toContain('quiet water');
  });

  it('reports exact deterministic issue categories without throwing or rewriting', () => {
    const observation = observeReflectiveContract({
      content: 'The scene stays unresolved. Is it fear or relief?',
      contractSurface: 'standard',
      telemetrySurface: 'reading_standard',
      languageContext: englishContext,
      requiredEndMarker: '<!--END_DREAM_READING-->',
    });

    expect(observation.passed).toBe(false);
    expect(observation.issues).toEqual(expect.arrayContaining([
      'missing_end_marker',
      'missing_reflective_questions_heading',
      'question_count_mismatch',
    ]));
    expect(observation.question_count).toBe(0);
    expect(observation.expected_question_count).toBe(2);
  });

  it('surfaces answer-menu and output-language observations independently', () => {
    const observation = observeReflectiveContract({
      content: 'Μένει μια εικόνα από τη θάλασσα. Είναι φόβος ή ανακούφιση;',
      contractSurface: 'chat',
      telemetrySurface: 'chat_followup',
      languageContext: englishContext,
    });

    expect(observation.passed).toBe(false);
    expect(observation.answer_menu_detected).toBe(true);
    expect(observation.issues).toEqual(expect.arrayContaining([
      'manufactured_answer_menu',
      'wrong_output_language:el',
    ]));
    expect(observation.detected_language).toBe('el');
    expect(observation.expected_language).toBe('en');
  });

  it('observes closing chat as a zero-question contract', () => {
    const observation = observeReflectiveContract({
      content: 'We can leave the dream here for now, and stay with the quiet image as it is.',
      contractSurface: 'chat',
      telemetrySurface: 'chat_followup_close',
      languageContext: englishContext,
      isFinalChat: true,
    });

    expect(observation.passed).toBe(true);
    expect(observation.question_count).toBe(0);
    expect(observation.expected_question_count).toBe(0);
  });

  it('fails open when the observer throws and reports only compact diagnostics', () => {
    const generatedResponse = 'The completed Oneiros response remains deliverable.';
    const observer = jest.fn(() => {
      throw new TypeError('simulated observer failure');
    });
    const onError = jest.fn();

    const observation = safeObserveReflectiveContract({
      content: generatedResponse,
      contractSurface: 'standard',
      telemetrySurface: 'reading_standard',
      languageContext: englishContext,
      requiredEndMarker: '<!--END_DREAM_READING-->',
    }, { observer, onError });

    expect(generatedResponse).toBe('The completed Oneiros response remains deliverable.');
    expect(observer).toHaveBeenCalledTimes(1);
    expect(observation).toEqual({
      passed: null,
      issues: [],
      validation_version: REFLECTIVE_CONTRACT_VALIDATION_VERSION,
      surface: 'reading_standard',
      question_count: null,
      expected_question_count: 2,
      detected_language: null,
      expected_language: 'en',
      answer_menu_detected: null,
      observation_error: true,
      observation_error_code: REFLECTIVE_CONTRACT_OBSERVATION_ERROR_CODE,
    });
    expect(onError).toHaveBeenCalledWith({
      validation_version: REFLECTIVE_CONTRACT_VALIDATION_VERSION,
      surface: 'reading_standard',
      observation_error_code: REFLECTIVE_CONTRACT_OBSERVATION_ERROR_CODE,
      error_type: 'TypeError',
    });
    expect(JSON.stringify({ observation, diagnostic: onError.mock.calls[0][0] }))
      .not.toContain(generatedResponse);
  });

  it('does not let diagnostic logging failures escape the fail-open boundary', () => {
    expect(() => safeObserveReflectiveContract({
      content: 'A completed response.',
      contractSurface: 'chat',
      telemetrySurface: 'chat_followup',
    }, {
      observer: () => {
        throw new Error('observer failed');
      },
      onError: () => {
        throw new Error('logger failed');
      },
    })).not.toThrow();
  });
});
