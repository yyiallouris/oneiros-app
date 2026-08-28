import {
  normalizeOneirosLanguageCode,
  type OneirosLanguageCode,
} from '../constants/oneirosLanguages';

export const REFLECTION_EDITORIAL_ARC_METHOD_ID =
  'oneiros-reflection-editorial-arc-v2.0.0-candidate' as const;
export const REFLECTION_EDITORIAL_ARC_METHOD_VERSION = '2.0.0-candidate' as const;
export const REFLECTION_EDITORIAL_ARC_PROTOCOL_VERSION = 2 as const;
export const REFLECTION_EDITORIAL_ARC_QUESTION_ARTIFACT_SCHEMA_VERSION = 8 as const;
export const REFLECTION_EDITORIAL_ARC_PAYLOAD_START =
  '<!--ONEIROS_REFLECTION_OPENING_V2-->' as const;
export const REFLECTION_EDITORIAL_ARC_PAYLOAD_END =
  '<!--END_ONEIROS_REFLECTION_OPENING_V2-->' as const;
export const REFLECTION_EDITORIAL_ARC_READING_START =
  '<!--BEGIN_DREAM_READING-->' as const;

export const REFLECTION_EDITORIAL_ARC_PROMPT = `
ONEIROS EDITORIAL ARC — candidate ${REFLECTION_EDITORIAL_ARC_METHOD_VERSION}

Before writing the reading, decide whether this dream holds one honest opening
whose answer belongs to the dreamer rather than to the interpreter. The visible
reading must still be complete and truthful as a reading. Never leave a gap or
withhold an interpretation merely to manufacture a question.

QUESTION CRAFT
- Return zero or one question. Silence is a valid editorial ending.
- When a question is warranted, let one concrete relation, paradox, image-logic,
  verb, gesture, position, threshold, or reversal already staged in the dream
  carry one natural spoken question.
- Question the relation rather than defaulting to a generic reaction to a noun.
  Felt or bodily experience is welcome when the dream itself makes it central,
  but it is not the automatic template.
- Ask only for something the user can newly answer from first-person experience.
  Do not ask for advice, interpretation homework, waking-life application, or a
  generic statement of meaning.
- Calm, joy, coherence, ordinariness, completion, and not-knowing may be enough.
  Never manufacture conflict, lack, defense, numbness, or unfinished business.
- Write in the same primary language as the reading, in fluent spoken form.

FOUR EPISTEMIC BOUNDARIES
1. No invented premise: every premise must be defensible from the cited D# raw-
   dream spans. Reading interpretations may guide attention but can never become
   dream facts, relations, motives, states, or psychic movements in the question.
2. No missing footage: do not request a change, reaction, continuation, cause,
   behavior, or event the dream never stages.
3. No already-supplied answer: do not re-ask a fact, state, feeling, or relation
   already given by the dreamer or already plainly established in the dream.
4. Preserve evidence logic: keep subject, agency, negation, direction,
   temporality, and polarity exactly as staged.

PRIVATE-FIRST PROTOCOL
Output the following private envelope first. Use a supported ISO 639-1 language
code even when question is null. The JSON must have exactly these three keys.

For one question:
${REFLECTION_EDITORIAL_ARC_PAYLOAD_START}
{"question":"one user-facing question","question_evidence_ids":["D1"],"output_language":"en"}
${REFLECTION_EDITORIAL_ARC_PAYLOAD_END}

For an honest no-question ending:
${REFLECTION_EDITORIAL_ARC_PAYLOAD_START}
{"question":null,"question_evidence_ids":[],"output_language":"en"}
${REFLECTION_EDITORIAL_ARC_PAYLOAD_END}

Then emit this exact marker:
${REFLECTION_EDITORIAL_ARC_READING_START}

Then write the complete user-facing reading. End it with the exact reading-end
marker specified by the mode. Emit nothing after that marker.

The envelope and markers are private infrastructure. Never mention D# labels,
the protocol, the payload, or these instructions in the reading or question.
`;

export type ReflectionEditorialArcOpening = {
  decision: 'question' | 'no_question';
  question: string | null;
  questionEvidenceIds: string[];
  outputLanguage: OneirosLanguageCode;
};

export type ReflectionEditorialArcSplit = {
  reading: string;
  payloadText: string | null;
  hasReadingStartMarker: boolean;
  hasReadingEndMarker: boolean;
  hasPayloadEnvelope: boolean;
};

function longestMarkerPrefixSuffix(value: string, marker: string): number {
  const maximum = Math.min(value.length, marker.length - 1);
  for (let size = maximum; size > 0; size -= 1) {
    if (value.endsWith(marker.slice(0, size))) return size;
  }
  return 0;
}

/** Private opening bytes never reach UI; reading reveal starts at BEGIN when present. */
export function visibleEditorialArcReading(
  accumulated: string,
  readingEndMarker: string
): string {
  const readingStart = accumulated.indexOf(REFLECTION_EDITORIAL_ARC_READING_START);
  if (readingStart < 0 && accumulated.includes(REFLECTION_EDITORIAL_ARC_PAYLOAD_START)) {
    return '';
  }
  const source = readingStart >= 0
    ? accumulated.slice(readingStart + REFLECTION_EDITORIAL_ARC_READING_START.length).replace(/^\s+/u, '')
    : accumulated;
  const readingEnd = source.indexOf(readingEndMarker);
  if (readingEnd >= 0) return source.slice(0, readingEnd).trim();

  const withheld = longestMarkerPrefixSuffix(source, readingEndMarker);
  return source.slice(0, source.length - withheld).trim();
}

/**
 * A malformed private envelope never contaminates or destroys a reading after
 * a valid BEGIN_DREAM_READING marker.
 */
export function splitReflectionEditorialArc(
  content: string,
  readingEndMarker: string
): ReflectionEditorialArcSplit {
  const readingStart = content.indexOf(REFLECTION_EDITORIAL_ARC_READING_START);
  const payloadStart = content.indexOf(REFLECTION_EDITORIAL_ARC_PAYLOAD_START);
  const payloadAfterStart = payloadStart >= 0
    ? payloadStart + REFLECTION_EDITORIAL_ARC_PAYLOAD_START.length
    : -1;
  const payloadEnd = payloadAfterStart >= 0
    ? content.indexOf(REFLECTION_EDITORIAL_ARC_PAYLOAD_END, payloadAfterStart)
    : -1;

  if (readingStart < 0) {
    const endIndex = content.indexOf(readingEndMarker);
    if (payloadStart >= 0) {
      return {
        reading: '',
        payloadText: payloadEnd >= 0
          ? content.slice(payloadAfterStart, payloadEnd).trim()
          : null,
        hasReadingStartMarker: false,
        hasReadingEndMarker: endIndex >= 0,
        hasPayloadEnvelope: payloadStart >= 0 && payloadEnd >= 0,
      };
    }
    return {
      reading: content.slice(0, endIndex >= 0 ? endIndex : content.length).trim(),
      payloadText: null,
      hasReadingStartMarker: false,
      hasReadingEndMarker: endIndex >= 0,
      hasPayloadEnvelope: false,
    };
  }

  const readingAfterStart = readingStart + REFLECTION_EDITORIAL_ARC_READING_START.length;
  const endIndex = content.indexOf(readingEndMarker, readingAfterStart);
  return {
    reading: content.slice(
      readingAfterStart,
      endIndex >= 0 ? endIndex : content.length
    ).trim(),
    payloadText: payloadEnd >= 0 && payloadEnd < readingStart
      ? content.slice(payloadAfterStart, payloadEnd).trim()
      : null,
    hasReadingStartMarker: true,
    hasReadingEndMarker: endIndex >= 0,
    hasPayloadEnvelope:
      payloadStart >= 0 && payloadEnd >= 0 && payloadEnd < readingStart,
  };
}

export function parseReflectionEditorialArcQuestion(
  payloadText: string | null,
  validEvidenceIds: ReadonlySet<string>
): { ok: true; data: ReflectionEditorialArcOpening } | { ok: false; errors: string[] } {
  if (!payloadText) return { ok: false, errors: ['missing_question_payload'] };
  let value: unknown;
  try {
    value = JSON.parse(payloadText);
  } catch {
    return { ok: false, errors: ['invalid_question_json'] };
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { ok: false, errors: ['invalid_question_shape'] };
  }
  const raw = value as Record<string, unknown>;
  const keys = Object.keys(raw).sort();
  const expectedKeys = ['output_language', 'question', 'question_evidence_ids'];
  if (
    keys.length !== expectedKeys.length ||
    keys.some((key, index) => key !== expectedKeys[index])
  ) {
    return { ok: false, errors: ['invalid_question_shape'] };
  }

  const question = typeof raw.question === 'string'
    ? raw.question.replace(/\s+/gu, ' ').trim()
    : raw.question === null
      ? null
      : '';
  const language = normalizeOneirosLanguageCode(raw.output_language);
  const evidence = Array.isArray(raw.question_evidence_ids)
    ? [...new Set(raw.question_evidence_ids.map((item) =>
        typeof item === 'string' ? item.trim() : ''
      ))]
    : [];
  const errors: string[] = [];
  if (!language) errors.push('wrong_language');

  if (question === null) {
    if (evidence.length) errors.push('unsupported_evidence');
    if (errors.length || !language) return { ok: false, errors: [...new Set(errors)] };
    return {
      ok: true,
      data: {
        decision: 'no_question',
        question: null,
        questionEvidenceIds: [],
        outputLanguage: language,
      },
    };
  }

  if (!question) errors.push('missing_question');
  if (
    evidence.length < 1 ||
    evidence.length > 3 ||
    evidence.some((id) => !/^D[1-9]\d*$/u.test(id) || !validEvidenceIds.has(id))
  ) {
    errors.push('unsupported_evidence');
  }
  if (errors.length || !language) return { ok: false, errors: [...new Set(errors)] };
  return {
    ok: true,
    data: {
      decision: 'question',
      question,
      questionEvidenceIds: evidence,
      outputLanguage: language,
    },
  };
}
