import {
  buildInitialReflectionRequest,
  SAME_CALL_QUESTION_SAFEGUARDS,
  SAME_CALL_STANDARD_ADVANCED_QUESTIONS,
  type DreamReflectionDepth,
  type DreamReflectionInput,
  type ReflectionPromptRequest,
} from '../../dreamReflectionPrompt';
import { V103_ENACTED_RELATION_Q1 } from './v103EnactedRelationCandidate';

/**
 * One-shot adaptive-opening feasibility candidate.
 *
 * This is a new R&D axis, not v1.0.6 and not a reopening of Q2 prompt R&D.
 * It is unreachable from client, gateway, billing, and production Reader code.
 */
export const ADAPTIVE_OPENINGS_CANDIDATE_STATUS =
  'frozen_one_shot_feasibility_candidate' as const;
export const ADAPTIVE_OPENINGS_METHOD_ID =
  'oneiros-adaptive-reflective-openings-v0.1.0-candidate' as const;
export const ADAPTIVE_OPENINGS_METHOD_VERSION = '0.1.0-candidate' as const;
export const ADAPTIVE_OPENINGS_READER_PROMPT_ID =
  'oneiros-dream-reflection-adaptive-openings-v0.1.0-candidate' as const;
export const ADAPTIVE_OPENINGS_READER_PROMPT_VERSION =
  '0.1.0-candidate' as const;

/** Exact approved production Q2 composition bytes. Denied v1.0.4/v1.0.5 Q2 is absent. */
export const PRODUCTION_SYMBOLIC_RELATIONAL_IMAGINAL_Q2 =
  '- Question 2 — symbolic / relational / imaginal: open the dream symbolically, relationally, or imaginally. It may follow an image, relation, transformation, contradiction, recurring gesture, unresolved movement, symbolic tension, or surprising juxtaposition. Deepen or reopen the central movement already developed in the reading; do not start a new analytic thread. The second question may be more psychologically or symbolically suggestive than the first. Do not make it safe by reducing it to generic phenomenology.' as const;

/** The single new semantic instruction being tested, shared by both surfaces. */
export const ADAPTIVE_OPENING_SELECTION_CORE = `Adaptive reflective-opening selection:
- Evaluate the enacted and imaginal openings independently.
- Include an opening only when the dream genuinely supports it and it adds a distinct live edge.
- Never create a weaker, repetitive, manufactured, or unnecessary opening merely to fill a slot.` as const;

export const ADAPTIVE_OPENING_SELECTION_RULE = `${ADAPTIVE_OPENING_SELECTION_CORE}
- Return one question when only one opening is earned.
- Return two questions only when both openings are genuinely earned and do different psychological work.
- If both are used, place the enacted opening first and the imaginal opening second.
- If only the imaginal opening is earned, it becomes the single visible question. If only the enacted opening is earned, show only the enacted opening.
- At least one reflective question is required.
- “Enacted” and “imaginal” are private composition labels. Do not include either label in the response.` as const;

export const ADAPTIVE_OPENING_COMPOSITION_GRAMMARS = `Use these existing composition grammars without changing their jobs:
${V103_ENACTED_RELATION_Q1}
${PRODUCTION_SYMBOLIC_RELATIONAL_IMAGINAL_Q2}` as const;

export const ADAPTIVE_QUICK_QUESTION_INSTRUCTION = `- End with exactly one natural reflective question as the final sentence or short paragraph. No Reflective Questions heading.
- For Quick, choose the single strongest earned opening after applying the adaptive selection rule below. Evaluate both jobs, but return exactly one question. It may be enacted or imaginal; Quick is not synonymous with enacted.
${ADAPTIVE_OPENING_SELECTION_CORE}
- At least one reflective question is required.
- “Enacted” and “imaginal” are private composition labels. Do not include either label in the response.
${ADAPTIVE_OPENING_COMPOSITION_GRAMMARS}` as const;

export const ADAPTIVE_STANDARD_ADVANCED_QUESTIONS = `
## Reflective Questions

- Return 1 or 2 questions as markdown bullets. At least one. No more than two.
${ADAPTIVE_OPENING_SELECTION_RULE}
${ADAPTIVE_OPENING_COMPOSITION_GRAMMARS}
- No prose after the questions.
${SAME_CALL_QUESTION_SAFEGUARDS}
` as const;

export const ADAPTIVE_QUICK_INITIAL_USER_DIRECTIVE = `Give 1–2 short paragraphs. No conclusions
or advice. End with exactly one strongest earned reflective opening, using either the enacted or imaginal composition job.` as const;

export const ADAPTIVE_FULL_INITIAL_USER_DIRECTIVE = `Follow the one or two images with the
strongest specific gravity and the actual movement they create. Do not give
conclusions. End with one or two earned reflective questions under Reflective Questions.` as const;

const PRODUCTION_QUICK_QUESTION_INSTRUCTION =
  '- End with exactly one natural reflective question as the final sentence or short paragraph. No Reflective Questions heading.';
const PRODUCTION_QUICK_INITIAL_USER_DIRECTIVE = `Give 1–2 short paragraphs. No conclusions
or advice. End with exactly one observational or imaginal reflective question.`;
const PRODUCTION_FULL_INITIAL_USER_DIRECTIVE = `Follow the one or two images with the
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
    throw new Error(
      `Frozen adaptive-opening candidate source drift: expected ${expectedOccurrences} occurrence(s).`
    );
  }
  return parts.join(after);
}

/**
 * Identity material hashes the immutable production base plus every byte of the
 * one-shot delta actually used by the initial Reader calls. Retry prompts are
 * deliberately excluded because this evaluation permits no retries.
 */
export const ADAPTIVE_OPENINGS_BUNDLE = [
  ADAPTIVE_OPENINGS_METHOD_ID,
  ADAPTIVE_OPENINGS_METHOD_VERSION,
  ADAPTIVE_OPENINGS_READER_PROMPT_ID,
  ADAPTIVE_OPENINGS_READER_PROMPT_VERSION,
  'production-base:oneiros-same-call-reflective-questions-v1.0.3-candidate',
  'production-base-sha:f5399a4973fb84365a25967890169fc2475cb2e2a9f65f0dffd2a8993101d9e7',
  ADAPTIVE_QUICK_QUESTION_INSTRUCTION,
  ADAPTIVE_STANDARD_ADVANCED_QUESTIONS,
  ADAPTIVE_QUICK_INITIAL_USER_DIRECTIVE,
  ADAPTIVE_FULL_INITIAL_USER_DIRECTIVE,
  'quick-exactly-1-strongest-earned',
  'standard-advanced-1-or-2-earned',
  'no-retries-no-judge-no-repair-no-reranking',
].join('\n---ONEIROS-ADAPTIVE-REFLECTIVE-OPENINGS-V0.1---\n');

export const ADAPTIVE_OPENINGS_BUNDLE_SHA256 =
  'da717215ab1d2add0de2c3855b448a40aba1fd7bb6c1195d40e3bc7a28b8a40c' as const;

/**
 * Starts from the approved production request and replaces only the surface's
 * selection/cardinality wording. Q1, Q2, safeguards, model settings, language
 * contract, Reader prose, and all other messages remain production-owned.
 */
export function buildAdaptiveOpeningsInitialRequest(
  dream: DreamReflectionInput,
  depth: DreamReflectionDepth
): ReflectionPromptRequest {
  const request = buildInitialReflectionRequest(dream, depth);
  const systemBefore = depth === 'quick'
    ? PRODUCTION_QUICK_QUESTION_INSTRUCTION
    : SAME_CALL_STANDARD_ADVANCED_QUESTIONS;
  const systemAfter = depth === 'quick'
    ? ADAPTIVE_QUICK_QUESTION_INSTRUCTION
    : ADAPTIVE_STANDARD_ADVANCED_QUESTIONS;
  const userBefore = depth === 'quick'
    ? PRODUCTION_QUICK_INITIAL_USER_DIRECTIVE
    : PRODUCTION_FULL_INITIAL_USER_DIRECTIVE;
  const userAfter = depth === 'quick'
    ? ADAPTIVE_QUICK_INITIAL_USER_DIRECTIVE
    : ADAPTIVE_FULL_INITIAL_USER_DIRECTIVE;

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
