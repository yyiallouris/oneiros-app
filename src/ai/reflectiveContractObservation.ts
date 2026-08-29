import {
  validateSameCallQuestionContract,
  type SameCallQuestionSurface,
} from './reflectiveQuestionExtract.ts';
import {
  auditReflectiveOutputLanguage,
  type ReflectiveLanguageContext,
} from './reflectiveLanguage.ts';

export const REFLECTIVE_CONTRACT_VALIDATION_VERSION =
  'oneiros-same-call-shadow-v1.0.1' as const;

export const REFLECTIVE_CONTRACT_OBSERVATION_ERROR_CODE =
  'observer_exception' as const;

export type ReflectiveContractTelemetrySurface =
  | 'reading_quick'
  | 'reading_standard'
  | 'reading_advanced'
  | 'chat_followup'
  | 'chat_followup_close'
  | 'recent_dream_field'
  | 'period_reflection';

export type ReflectiveContractObservation = {
  passed: boolean | null;
  issues: string[];
  validation_version: typeof REFLECTIVE_CONTRACT_VALIDATION_VERSION;
  surface: ReflectiveContractTelemetrySurface;
  question_count: number | null;
  expected_question_count: number;
  detected_language: string | null;
  expected_language: string | null;
  answer_menu_detected: boolean | null;
  observation_error: boolean;
  observation_error_code: typeof REFLECTIVE_CONTRACT_OBSERVATION_ERROR_CODE | null;
};

export type ReflectiveContractObservationParams = {
  content: string;
  contractSurface: SameCallQuestionSurface;
  telemetrySurface: ReflectiveContractTelemetrySurface;
  languageContext?: ReflectiveLanguageContext | null;
  isFinalChat?: boolean;
  requiredEndMarker?: string;
};

export type ReflectiveContractObservationErrorDiagnostic = {
  validation_version: typeof REFLECTIVE_CONTRACT_VALIDATION_VERSION;
  surface: ReflectiveContractTelemetrySurface;
  observation_error_code: typeof REFLECTIVE_CONTRACT_OBSERVATION_ERROR_CODE;
  error_type: 'Error' | 'TypeError' | 'RangeError' | 'SyntaxError' | 'non_error_throw';
};

type ReflectiveContractObserver = (
  params: ReflectiveContractObservationParams
) => ReflectiveContractObservation;

type SafeObservationOptions = {
  observer?: ReflectiveContractObserver;
  onError?: (diagnostic: ReflectiveContractObservationErrorDiagnostic) => void;
};

function expectedQuestionCount(params: ReflectiveContractObservationParams): number {
  if (params.contractSurface === 'quick') return 1;
  if (params.contractSurface === 'chat') return params.isFinalChat ? 0 : 1;
  return 2;
}

function safeErrorType(
  error: unknown
): ReflectiveContractObservationErrorDiagnostic['error_type'] {
  if (error instanceof TypeError) return 'TypeError';
  if (error instanceof RangeError) return 'RangeError';
  if (error instanceof SyntaxError) return 'SyntaxError';
  if (error instanceof Error) return 'Error';
  return 'non_error_throw';
}

/**
 * Observes a completed response without changing, rejecting, or regenerating it.
 * Raw user/model text is intentionally absent from the returned telemetry.
 */
export function observeReflectiveContract(
  params: ReflectiveContractObservationParams
): ReflectiveContractObservation {
  const questionValidation = validateSameCallQuestionContract(
    params.content,
    params.contractSurface,
    {
      isFinalChat: params.isFinalChat,
      languageCode: params.languageContext?.expectedLanguageCode,
    }
  );
  const genericMenuDetected = validateSameCallQuestionContract(
    params.content,
    params.contractSurface,
    { isFinalChat: params.isFinalChat }
  ).issues.includes('manufactured_answer_menu');
  const languageAudit = params.languageContext
    ? auditReflectiveOutputLanguage(params.content, params.languageContext)
    : null;
  const issues: string[] = [...questionValidation.issues];

  if (genericMenuDetected && !issues.includes('manufactured_answer_menu')) {
    issues.push('manufactured_answer_menu');
  }

  if (params.requiredEndMarker && !params.content.includes(params.requiredEndMarker)) {
    issues.unshift('missing_end_marker');
  }
  if (languageAudit?.valid === false) {
    issues.push(`wrong_output_language:${languageAudit.detectedLanguageCode ?? 'unknown'}`);
  }

  const uniqueIssues = [...new Set(issues)];
  return {
    passed: uniqueIssues.length === 0,
    issues: uniqueIssues,
    validation_version: REFLECTIVE_CONTRACT_VALIDATION_VERSION,
    surface: params.telemetrySurface,
    question_count: questionValidation.actualCount,
    expected_question_count: questionValidation.expectedCount,
    detected_language: languageAudit?.detectedLanguageCode ?? null,
    expected_language: languageAudit?.expectedLanguageCode ?? null,
    answer_menu_detected: uniqueIssues.includes('manufactured_answer_menu'),
    observation_error: false,
    observation_error_code: null,
  };
}

/**
 * Keeps telemetry observational even if a validator bug throws. The generated
 * response stays authoritative; only the observation is marked unavailable.
 */
export function safeObserveReflectiveContract(
  params: ReflectiveContractObservationParams,
  options: SafeObservationOptions = {}
): ReflectiveContractObservation {
  try {
    return (options.observer ?? observeReflectiveContract)(params);
  } catch (error) {
    const diagnostic: ReflectiveContractObservationErrorDiagnostic = {
      validation_version: REFLECTIVE_CONTRACT_VALIDATION_VERSION,
      surface: params.telemetrySurface,
      observation_error_code: REFLECTIVE_CONTRACT_OBSERVATION_ERROR_CODE,
      error_type: safeErrorType(error),
    };

    try {
      options.onError?.(diagnostic);
    } catch {
      // Logging must remain subordinate to the already-successful generation.
    }

    return {
      passed: null,
      issues: [],
      validation_version: REFLECTIVE_CONTRACT_VALIDATION_VERSION,
      surface: params.telemetrySurface,
      question_count: null,
      expected_question_count: expectedQuestionCount(params),
      detected_language: null,
      expected_language: params.languageContext?.expectedLanguageCode ?? null,
      answer_menu_detected: null,
      observation_error: true,
      observation_error_code: REFLECTIVE_CONTRACT_OBSERVATION_ERROR_CODE,
    };
  }
}
