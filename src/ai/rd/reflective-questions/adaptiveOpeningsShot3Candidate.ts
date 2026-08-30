import {
  buildInitialReflectionRequest,
  SAME_CALL_QUESTION_SAFEGUARDS,
  SAME_CALL_STANDARD_ADVANCED_QUESTIONS,
  type DreamReflectionDepth,
  type DreamReflectionInput,
  type ReflectionPromptRequest,
} from '../../dreamReflectionPrompt';
import {
  ADAPTIVE_OPENINGS_SHOT2_QUICK_INSTRUCTION,
  ADAPTIVE_OPENINGS_SHOT2_QUICK_USER_DIRECTIVE,
  SHOT2_NEUTRAL_COMPOSITION_JOBS,
} from './adaptiveOpeningsShot2Candidate';

/** Final Shot 3. The adaptive prompt-iteration line closes after this candidate. */
export const ADAPTIVE_OPENINGS_SHOT3_STATUS = 'frozen_final_shot_3_of_3' as const;
export const ADAPTIVE_OPENINGS_SHOT3_METHOD_ID =
  'oneiros-adaptive-reflective-openings-v0.3.0-final-candidate' as const;
export const ADAPTIVE_OPENINGS_SHOT3_METHOD_VERSION = '0.3.0-final-candidate' as const;
export const ADAPTIVE_OPENINGS_SHOT3_READER_PROMPT_ID =
  'oneiros-dream-reflection-adaptive-openings-v0.3.0-final-candidate' as const;
export const ADAPTIVE_OPENINGS_SHOT3_READER_PROMPT_VERSION =
  '0.3.0-final-candidate' as const;

export const SHOT3_MINIMUM_SUFFICIENT_SELECTION = `Private minimum-sufficient selection — do not print the selection:
- First choose and compose the one strongest earned opening from either composition job.
- Treat that one question as a complete Reflective Questions section by default.
- Only after it is complete, consider whether the other composition job is also necessary.
- Add the other question only when it has a different explicit source in the dream — event, relation, or imaginal configuration — and performs psychological work that the first question cannot contain without losing a major live edge.
- If either requirement is absent or uncertain, stop at one. Richness, multiple images, or available space do not by themselves earn a second question.
- When two are earned, order enacted first and imaginal second. When one is earned, use whichever job produced the stronger opening.
- Give each question one explicit dream source and one direction of attention. Do not fuse alternative formulations into a single question.
- Do not expose selection language or composition-job labels.` as const;

export const ADAPTIVE_OPENINGS_SHOT3_FULL_INSTRUCTION = `
## Reflective Questions

- Return 1 or 2 questions as markdown bullets. At least one. No more than two.
${SHOT3_MINIMUM_SUFFICIENT_SELECTION}
${SHOT2_NEUTRAL_COMPOSITION_JOBS}
- No prose after the questions.
${SAME_CALL_QUESTION_SAFEGUARDS}
` as const;

export const ADAPTIVE_OPENINGS_SHOT3_FULL_USER_DIRECTIVE = `Follow the one or two images with the
strongest specific gravity and the actual movement they create. Do not give
conclusions. Apply the private minimum-sufficient selection, then end with only the earned one or two reflective questions under Reflective Questions.` as const;

const PRODUCTION_QUICK_INSTRUCTION =
  '- End with exactly one natural reflective question as the final sentence or short paragraph. No Reflective Questions heading.';
const PRODUCTION_QUICK_USER_DIRECTIVE = `Give 1–2 short paragraphs. No conclusions
or advice. End with exactly one observational or imaginal reflective question.`;
const PRODUCTION_FULL_USER_DIRECTIVE = `Follow the one or two images with the
strongest specific gravity and the actual movement they create. Do not give
conclusions. End with exactly two reflective questions under Reflective Questions.`;

function replaceExactOccurrences(
  value: string,
  before: string,
  after: string,
  expectedOccurrences: number
): string {
  const parts = value.split(before);
  if (parts.length !== expectedOccurrences + 1) {
    throw new Error(`Frozen adaptive Shot 3 source drift: expected ${expectedOccurrences} occurrence(s).`);
  }
  return parts.join(after);
}

export const ADAPTIVE_OPENINGS_SHOT3_BUNDLE = [
  ADAPTIVE_OPENINGS_SHOT3_METHOD_ID,
  ADAPTIVE_OPENINGS_SHOT3_METHOD_VERSION,
  ADAPTIVE_OPENINGS_SHOT3_READER_PROMPT_ID,
  ADAPTIVE_OPENINGS_SHOT3_READER_PROMPT_VERSION,
  'production-base:oneiros-same-call-reflective-questions-v1.0.3-candidate',
  'production-base-sha:f5399a4973fb84365a25967890169fc2475cb2e2a9f65f0dffd2a8993101d9e7',
  'shot-2-sha:ca2dbedbaaeedd822dd47fa1cdfe3b60d0bbb898fcad712b53d439f98b4af013',
  ADAPTIVE_OPENINGS_SHOT2_QUICK_INSTRUCTION,
  ADAPTIVE_OPENINGS_SHOT3_FULL_INSTRUCTION,
  ADAPTIVE_OPENINGS_SHOT2_QUICK_USER_DIRECTIVE,
  ADAPTIVE_OPENINGS_SHOT3_FULL_USER_DIRECTIVE,
  'shot-3-final-no-fourth-candidate',
  'no-retries-no-judge-no-repair-no-reranking',
].join('\n---ONEIROS-ADAPTIVE-REFLECTIVE-OPENINGS-SHOT-3---\n');

export const ADAPTIVE_OPENINGS_SHOT3_BUNDLE_SHA256 =
  '13eea6078f3885f5651f6bc8a3582be65b1a9e93ed658d7206a67cf68d2067ab' as const;

export function buildAdaptiveOpeningsShot3Request(
  dream: DreamReflectionInput,
  depth: DreamReflectionDepth
): ReflectionPromptRequest {
  const request = buildInitialReflectionRequest(dream, depth);
  const systemBefore = depth === 'quick'
    ? PRODUCTION_QUICK_INSTRUCTION
    : SAME_CALL_STANDARD_ADVANCED_QUESTIONS;
  const systemAfter = depth === 'quick'
    ? ADAPTIVE_OPENINGS_SHOT2_QUICK_INSTRUCTION
    : ADAPTIVE_OPENINGS_SHOT3_FULL_INSTRUCTION;
  const userBefore = depth === 'quick'
    ? PRODUCTION_QUICK_USER_DIRECTIVE
    : PRODUCTION_FULL_USER_DIRECTIVE;
  const userAfter = depth === 'quick'
    ? ADAPTIVE_OPENINGS_SHOT2_QUICK_USER_DIRECTIVE
    : ADAPTIVE_OPENINGS_SHOT3_FULL_USER_DIRECTIVE;
  return {
    ...request,
    messages: request.messages.map((message) => ({
      ...message,
      content: replaceExactOccurrences(
        replaceExactOccurrences(
          message.content,
          systemBefore,
          systemAfter,
          message.role === 'system' && message.content.includes(systemBefore) ? 1 : 0
        ),
        userBefore,
        userAfter,
        message.role === 'user' && message.content.includes(userBefore) ? 1 : 0
      ),
    })),
  };
}
