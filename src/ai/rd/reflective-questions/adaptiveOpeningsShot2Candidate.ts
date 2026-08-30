import {
  buildInitialReflectionRequest,
  SAME_CALL_QUESTION_SAFEGUARDS,
  SAME_CALL_STANDARD_ADVANCED_QUESTIONS,
  type DreamReflectionDepth,
  type DreamReflectionInput,
  type ReflectionPromptRequest,
} from '../../dreamReflectionPrompt';
import { V103_ENACTED_RELATION_Q1 } from './v103EnactedRelationCandidate';
import { PRODUCTION_SYMBOLIC_RELATIONAL_IMAGINAL_Q2 } from './adaptiveOpeningsCandidate';

/** Shot 2 of the owner-authorized maximum-three-shot adaptive-opening line. */
export const ADAPTIVE_OPENINGS_SHOT2_STATUS = 'frozen_shot_2_of_3' as const;
export const ADAPTIVE_OPENINGS_SHOT2_METHOD_ID =
  'oneiros-adaptive-reflective-openings-v0.2.0-candidate' as const;
export const ADAPTIVE_OPENINGS_SHOT2_METHOD_VERSION = '0.2.0-candidate' as const;
export const ADAPTIVE_OPENINGS_SHOT2_READER_PROMPT_ID =
  'oneiros-dream-reflection-adaptive-openings-v0.2.0-candidate' as const;
export const ADAPTIVE_OPENINGS_SHOT2_READER_PROMPT_VERSION =
  '0.2.0-candidate' as const;

export const SHOT2_ENACTED_OPENING_JOB = V103_ENACTED_RELATION_Q1.replace(
  '- Question 1 — enacted relation:',
  '- Enacted opening composition job:'
);

export const SHOT2_IMAGINAL_OPENING_JOB =
  PRODUCTION_SYMBOLIC_RELATIONAL_IMAGINAL_Q2
    .replace(
      '- Question 2 — symbolic / relational / imaginal:',
      '- Imaginal opening composition job:'
    )
    .replace(
      'The second question may be more psychologically or symbolically suggestive than the first.',
      'An imaginal opening may be psychologically or symbolically suggestive.'
    );

export const SHOT2_PRIVATE_FULL_ROUTE = `Private route decision — do not print the route:
- Before composing any question, choose exactly one route: ENACTED_ONLY, IMAGINAL_ONLY, or BOTH.
- Choose ENACTED_ONLY only when the enacted job is genuinely supported and no distinct imaginal opening adds a live edge.
- Choose IMAGINAL_ONLY only when the imaginal job is genuinely supported and no complete enacted relation is present.
- Choose BOTH only when both jobs are genuinely supported and will do different psychological work.
- Compose only the job or jobs selected by that route. Never fill an unselected slot.
- For BOTH, write enacted first and imaginal second. For either single route, write only its one question.
- At least one route is required. Do not expose route names or composition-job labels.` as const;

export const SHOT2_PRIVATE_QUICK_ROUTE = `Private Quick selection — do not print the selection:
- Compare the enacted and imaginal composition jobs before writing the final question.
- Choose exactly one: whichever yields the strongest specific live edge in this dream.
- Compose only that one question. Do not expose selection names or composition-job labels.` as const;

export const SHOT2_NEUTRAL_COMPOSITION_JOBS = `Composition jobs:
${SHOT2_ENACTED_OPENING_JOB}
${SHOT2_IMAGINAL_OPENING_JOB}` as const;

export const ADAPTIVE_OPENINGS_SHOT2_QUICK_INSTRUCTION = `- End with exactly one natural reflective question as the final sentence or short paragraph. No Reflective Questions heading.
${SHOT2_PRIVATE_QUICK_ROUTE}
${SHOT2_NEUTRAL_COMPOSITION_JOBS}` as const;

export const ADAPTIVE_OPENINGS_SHOT2_FULL_INSTRUCTION = `
## Reflective Questions

- Return 1 or 2 questions as markdown bullets. At least one. No more than two.
${SHOT2_PRIVATE_FULL_ROUTE}
${SHOT2_NEUTRAL_COMPOSITION_JOBS}
- No prose after the questions.
${SAME_CALL_QUESTION_SAFEGUARDS}
` as const;

export const ADAPTIVE_OPENINGS_SHOT2_QUICK_USER_DIRECTIVE = `Give 1–2 short paragraphs. No conclusions
or advice. Privately select the stronger enacted or imaginal composition job, then end with exactly its one reflective question.` as const;

export const ADAPTIVE_OPENINGS_SHOT2_FULL_USER_DIRECTIVE = `Follow the one or two images with the
strongest specific gravity and the actual movement they create. Do not give
conclusions. Make the private route decision, then end with only its one or two reflective questions under Reflective Questions.` as const;

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
    throw new Error(`Frozen adaptive Shot 2 source drift: expected ${expectedOccurrences} occurrence(s).`);
  }
  return parts.join(after);
}

export const ADAPTIVE_OPENINGS_SHOT2_BUNDLE = [
  ADAPTIVE_OPENINGS_SHOT2_METHOD_ID,
  ADAPTIVE_OPENINGS_SHOT2_METHOD_VERSION,
  ADAPTIVE_OPENINGS_SHOT2_READER_PROMPT_ID,
  ADAPTIVE_OPENINGS_SHOT2_READER_PROMPT_VERSION,
  'production-base:oneiros-same-call-reflective-questions-v1.0.3-candidate',
  'production-base-sha:f5399a4973fb84365a25967890169fc2475cb2e2a9f65f0dffd2a8993101d9e7',
  'shot-1-sha:da717215ab1d2add0de2c3855b448a40aba1fd7bb6c1195d40e3bc7a28b8a40c',
  ADAPTIVE_OPENINGS_SHOT2_QUICK_INSTRUCTION,
  ADAPTIVE_OPENINGS_SHOT2_FULL_INSTRUCTION,
  ADAPTIVE_OPENINGS_SHOT2_QUICK_USER_DIRECTIVE,
  ADAPTIVE_OPENINGS_SHOT2_FULL_USER_DIRECTIVE,
  'no-retries-no-judge-no-repair-no-reranking',
].join('\n---ONEIROS-ADAPTIVE-REFLECTIVE-OPENINGS-SHOT-2---\n');

export const ADAPTIVE_OPENINGS_SHOT2_BUNDLE_SHA256 =
  'ca2dbedbaaeedd822dd47fa1cdfe3b60d0bbb898fcad712b53d439f98b4af013' as const;

export function buildAdaptiveOpeningsShot2Request(
  dream: DreamReflectionInput,
  depth: DreamReflectionDepth
): ReflectionPromptRequest {
  const request = buildInitialReflectionRequest(dream, depth);
  const systemBefore = depth === 'quick'
    ? PRODUCTION_QUICK_INSTRUCTION
    : SAME_CALL_STANDARD_ADVANCED_QUESTIONS;
  const systemAfter = depth === 'quick'
    ? ADAPTIVE_OPENINGS_SHOT2_QUICK_INSTRUCTION
    : ADAPTIVE_OPENINGS_SHOT2_FULL_INSTRUCTION;
  const userBefore = depth === 'quick'
    ? PRODUCTION_QUICK_USER_DIRECTIVE
    : PRODUCTION_FULL_USER_DIRECTIVE;
  const userAfter = depth === 'quick'
    ? ADAPTIVE_OPENINGS_SHOT2_QUICK_USER_DIRECTIVE
    : ADAPTIVE_OPENINGS_SHOT2_FULL_USER_DIRECTIVE;

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
