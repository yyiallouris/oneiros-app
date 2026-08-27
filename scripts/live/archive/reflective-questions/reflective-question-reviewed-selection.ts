import type { AiCallCost } from '../../../../src/billing/aiPricing';

export const REVIEWED_SELECTION_EXPERIMENT_ID =
  'reflective-question-reviewed-selection-experiment-v0.1.0';
export const REVIEWED_SELECTION_EXPERIMENT_VERSION = '0.1.0';

export const CANDIDATE_IDS = [
  'direct_relation',
  'imaginal_continuation',
  'capacity_or_change',
] as const;

export type CandidateId = (typeof CANDIDATE_IDS)[number];

export type Candidate = {
  id: CandidateId;
  question: string;
};

export type CandidateEvaluation = {
  id: CandidateId;
  irreplaceability: number;
  experiential_pull: number;
  human_pull: number;
  epistemic_honesty: 'pass' | 'fail';
  unsupported_premise: boolean;
  verdict: 'pass' | 'reject';
  reason: string;
};

export type ReviewerResult = {
  evaluations: CandidateEvaluation[];
  requestedSelectedId: CandidateId | null;
  selectedId: CandidateId | null;
  selectionWasOverridden: boolean;
};

export type ControlledRewrite = {
  sourceCandidateId: CandidateId;
  question: string;
};

export type CallMeasurement = {
  stage: 'baseline' | 'generator' | 'reviewer' | 'rewrite';
  latencyMs: number;
  cost: AiCallCost;
};

export type AggregateMeasurement = {
  callCount: number;
  latencyMs: number;
  inputTokens: number;
  cachedInputTokens: number;
  outputTokens: number;
  totalTokens: number;
  estimatedUsd: number | null;
};

export function buildCandidateGeneratorPrompt(language: string): string {
  return `
OFFLINE CANDIDATE GENERATOR — do not produce a final answer

Generate exactly three genuinely distinct reflective-question candidates in ${language}:
1. direct_relation — open the dream's exact relation, action, or action-versus-non-action;
2. imaginal_continuation — move the dream world forward through one precise continuation or consequence;
3. capacity_or_change — open a concrete sensory, relational, transformational, or dream-world capacity.

The forms must be genuinely different movements, not three paraphrases of one interrogative shell. Keep each candidate to one immediately understandable question. Ground both its setup and its interrogative core in the dream. Do not explain, score, rank, select, or add commentary.

Return JSON only:
{"candidates":[{"id":"direct_relation","question":"..."},{"id":"imaginal_continuation","question":"..."},{"id":"capacity_or_change","question":"..."}]}
`;
}

export const CANDIDATE_REVIEWER_PROMPT = `
OFFLINE CANDIDATE REVIEWER — score and select only

You are not a generator and not a judge of Jungian sophistication. Never write, rewrite, improve, merge, or paraphrase a candidate.

Evaluate each supplied candidate using these hard gates:
- Irreplaceability: 0–2. A 2 means the interrogative core is difficult to imagine after another dream; swapping only nouns would break it.
- Experiential Pull: 0–2. A 2 means it brings the exact dream relation or image more alive rather than asking for explanation or redescription.
- Human Pull: 0–2. A 2 means a thoughtful dreamer would genuinely want to answer it.
- Epistemic honesty: pass only when it introduces no interpretation, motive, affect, non-action, causality, or blockage that the dream did not establish.
- Unsupported premise: true if the question adds anything the dream did not establish.

A clearly conditional imaginal continuation (for example, “if this action happened next...”) is not an unsupported premise merely because it invites imagination. It remains epistemically honest when it stays anchored in the exact dream image, openly marks the condition, and does not assert a new motive, affect, cause, danger, or outcome as fact.

Reject a candidate if it asks for scene redescription, asks for an answer already contained in the dream, uses an abstract experiential shell, opens two answer directions, or is safe but not magnetic.

Select the candidate that is hardest to imagine after another dream, brings the exact dream relation more alive, and invites a real response without introducing anything the dream did not establish. Do not select the deepest-sounding or most sophisticated candidate.

A candidate passes only when all three numeric scores are 2, epistemic_honesty is "pass", unsupported_premise is false, and verdict is "pass". If none passes, selected_id must be null. Do not soften the gate to ensure a winner.

Return JSON only:
{"evaluations":[{"id":"direct_relation","irreplaceability":0,"experiential_pull":0,"human_pull":0,"epistemic_honesty":"pass","unsupported_premise":false,"verdict":"reject","reason":"..."},{"id":"imaginal_continuation","irreplaceability":0,"experiential_pull":0,"human_pull":0,"epistemic_honesty":"pass","unsupported_premise":false,"verdict":"reject","reason":"..."},{"id":"capacity_or_change","irreplaceability":0,"experiential_pull":0,"human_pull":0,"epistemic_honesty":"pass","unsupported_premise":false,"verdict":"reject","reason":"..."}],"selected_id":null}
`;

export function buildControlledRewritePrompt(language: string): string {
  return `
OFFLINE CONTROLLED REWRITE — one bounded repair only

All generated candidates failed a strict reviewer. Rewrite exactly one supplied candidate into one concise reflective question in ${language}. This is constrained editing, not fresh interpretation.

- Address the reviewer's stated failure directly.
- Preserve the source candidate's concrete dream relation or imaginal movement.
- Do not add a new symbol meaning, motive, affect, non-action, causality, conflict, or waking-life transfer.
- Use one answer direction and wording clear on first read.
- If the material is ordinary or low-affect, prefer a small exact imaginal continuation over manufactured depth.
- Do not explain the edit and do not produce alternatives.

Return JSON only:
{"source_candidate_id":"direct_relation","question":"..."}
`;
}

function stripFence(value: string): string {
  return value.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
}

export function parseJsonObject(value: string): Record<string, unknown> {
  const cleaned = stripFence(value);
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start < 0 || end <= start) throw new Error('No JSON object in model output.');
  const parsed = JSON.parse(cleaned.slice(start, end + 1)) as unknown;
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('Model output JSON must be an object.');
  }
  return parsed as Record<string, unknown>;
}

function isCandidateId(value: unknown): value is CandidateId {
  return typeof value === 'string' && (CANDIDATE_IDS as readonly string[]).includes(value);
}

function cleanQuestion(value: unknown): string {
  if (typeof value !== 'string') throw new Error('Candidate question must be a string.');
  const question = value.trim().replace(/[”’"']+$/u, '').trim();
  if (question.length < 12 || !/[?;]$/.test(question)) {
    throw new Error('Candidate question is missing or malformed.');
  }
  return question;
}

function normalizedQuestion(value: string): string {
  return value.toLocaleLowerCase('el').replace(/[\s\p{P}]+/gu, ' ').trim();
}

export function parseCandidates(value: string): Candidate[] {
  const parsed = parseJsonObject(value);
  if (!Array.isArray(parsed.candidates) || parsed.candidates.length !== CANDIDATE_IDS.length) {
    throw new Error('Generator must return exactly three candidates.');
  }
  const candidates = parsed.candidates.map((item) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      throw new Error('Candidate must be an object.');
    }
    const row = item as Record<string, unknown>;
    if (!isCandidateId(row.id)) throw new Error('Candidate id is invalid.');
    return { id: row.id, question: cleanQuestion(row.question) };
  });
  const ids = new Set(candidates.map((candidate) => candidate.id));
  if (ids.size !== CANDIDATE_IDS.length || CANDIDATE_IDS.some((id) => !ids.has(id))) {
    throw new Error('Generator must return each required candidate form exactly once.');
  }
  if (new Set(candidates.map((candidate) => normalizedQuestion(candidate.question))).size !== 3) {
    throw new Error('Generator returned duplicate candidate questions.');
  }
  return CANDIDATE_IDS.map((id) => candidates.find((candidate) => candidate.id === id)!);
}

function score(value: unknown): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0 || value > 2) {
    throw new Error('Reviewer scores must be integers from 0 to 2.');
  }
  return value;
}

export function evaluationPassesHardGates(evaluation: CandidateEvaluation): boolean {
  return (
    evaluation.irreplaceability === 2 &&
    evaluation.experiential_pull === 2 &&
    evaluation.human_pull === 2 &&
    evaluation.epistemic_honesty === 'pass' &&
    evaluation.unsupported_premise === false &&
    evaluation.verdict === 'pass'
  );
}

export function parseReviewerResult(value: string, candidates: Candidate[]): ReviewerResult {
  const parsed = parseJsonObject(value);
  if ('question' in parsed || 'rewrite' in parsed || 'rewritten_question' in parsed) {
    throw new Error('Reviewer attempted to generate or rewrite a question.');
  }
  if (!Array.isArray(parsed.evaluations) || parsed.evaluations.length !== CANDIDATE_IDS.length) {
    throw new Error('Reviewer must return exactly three evaluations.');
  }
  const candidateIds = new Set(candidates.map((candidate) => candidate.id));
  const evaluations = parsed.evaluations.map((item) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      throw new Error('Reviewer evaluation must be an object.');
    }
    const row = item as Record<string, unknown>;
    if (!isCandidateId(row.id) || !candidateIds.has(row.id)) {
      throw new Error('Reviewer evaluation id is invalid.');
    }
    const rawEpistemicHonesty = row.epistemic_honesty === 'reject'
      ? 'fail'
      : row.epistemic_honesty;
    if (rawEpistemicHonesty !== 'pass' && rawEpistemicHonesty !== 'fail') {
      throw new Error('Reviewer epistemic_honesty is invalid.');
    }
    const epistemicHonesty: CandidateEvaluation['epistemic_honesty'] =
      rawEpistemicHonesty;
    if (typeof row.unsupported_premise !== 'boolean') {
      throw new Error('Reviewer unsupported_premise must be boolean.');
    }
    if (row.verdict !== 'pass' && row.verdict !== 'reject') {
      throw new Error('Reviewer verdict is invalid.');
    }
    const verdict: CandidateEvaluation['verdict'] = row.verdict;
    const reason = typeof row.reason === 'string' && row.reason.trim()
      ? row.reason.trim()
      : 'No reason supplied by reviewer.';
    return {
      id: row.id,
      irreplaceability: score(row.irreplaceability),
      experiential_pull: score(row.experiential_pull),
      human_pull: score(row.human_pull),
      epistemic_honesty: epistemicHonesty,
      unsupported_premise: row.unsupported_premise,
      verdict,
      reason,
    };
  });
  if (new Set(evaluations.map((evaluation) => evaluation.id)).size !== CANDIDATE_IDS.length) {
    throw new Error('Reviewer must evaluate every candidate exactly once.');
  }
  const requestedSelectedId = parsed.selected_id === null
    ? null
    : isCandidateId(parsed.selected_id) && candidateIds.has(parsed.selected_id)
      ? parsed.selected_id
      : (() => { throw new Error('Reviewer selected_id is invalid.'); })();
  const selectedEvaluation = requestedSelectedId
    ? evaluations.find((evaluation) => evaluation.id === requestedSelectedId)
    : null;
  const selectedId = selectedEvaluation && evaluationPassesHardGates(selectedEvaluation)
    ? requestedSelectedId
    : null;
  return {
    evaluations,
    requestedSelectedId,
    selectedId,
    selectionWasOverridden: requestedSelectedId !== selectedId,
  };
}

export function parseControlledRewrite(value: string, candidates: Candidate[]): ControlledRewrite {
  const parsed = parseJsonObject(value);
  if (!isCandidateId(parsed.source_candidate_id)) {
    throw new Error('Controlled rewrite source_candidate_id is invalid.');
  }
  if (!candidates.some((candidate) => candidate.id === parsed.source_candidate_id)) {
    throw new Error('Controlled rewrite source candidate was not generated.');
  }
  return {
    sourceCandidateId: parsed.source_candidate_id,
    question: cleanQuestion(parsed.question),
  };
}

export function aggregateMeasurements(calls: CallMeasurement[]): AggregateMeasurement {
  const priced = calls.every((call) => typeof call.cost.estimatedUsd === 'number');
  return {
    callCount: calls.length,
    latencyMs: calls.reduce((sum, call) => sum + call.latencyMs, 0),
    inputTokens: calls.reduce((sum, call) => sum + call.cost.inputTokens, 0),
    cachedInputTokens: calls.reduce((sum, call) => sum + call.cost.cachedInputTokens, 0),
    outputTokens: calls.reduce((sum, call) => sum + call.cost.outputTokens, 0),
    totalTokens: calls.reduce((sum, call) => sum + call.cost.totalTokens, 0),
    estimatedUsd: priced
      ? Number(calls.reduce((sum, call) => sum + (call.cost.estimatedUsd ?? 0), 0).toFixed(8))
      : null,
  };
}

export function percentile(values: number[], percentileValue: number): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((left, right) => left - right);
  const rank = Math.max(1, Math.ceil((percentileValue / 100) * sorted.length));
  return sorted[Math.min(rank - 1, sorted.length - 1)];
}
