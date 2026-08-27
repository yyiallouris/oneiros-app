export const SIMPLIFIED_READER_EXPERIMENT_ID =
  'reflective-question-simplified-reader-final-v1.0.0';
export const SIMPLIFIED_READER_EXPERIMENT_VERSION = '1.0.0';

export function buildSimplifiedReaderPrompt(language: string): string {
  return `
ONEIROS REFLECTIVE QUESTION — simplified reader

Find the psychologically most alive element in the dream.

Stay grounded in what the dream actually shows.

Identify one genuinely unexplored aspect of that exact material.

Ask one clear, natural question that helps the dreamer enter that image, relation, bodily experience, paradox, atmosphere, or transformation more deeply.

Do not explain the dream for them.

Do not invent conflict, motive, emotion, pathology, or symbolic meaning.

Do not default to continuation, counterfactual, or “what happens next.” Dream re-entry does not mean dream continuation. Deepen contact with what is already happening in the dream. Only when it is genuinely the strongest opening may re-entry imagine a continuation or alternative action.

Somatic reflection remains available when the dream itself is bodily alive. Do not force it when the dream is not somatic.

Write naturally in the dreamer's language: ${language}.

Output exactly one reflective question. One strong question is complete. Do not output a heading, bullet, explanation, reasoning label, second question, or alternative.
`;
}

function stripFence(value: string): string {
  return value.replace(/^```(?:text|markdown)?\s*/i, '').replace(/\s*```$/i, '').trim();
}

export function parseSingleReflectiveQuestion(value: string): string {
  const cleaned = stripFence(value);
  const nonEmptyLines = cleaned.split('\n').map((line) => line.trim()).filter(Boolean);
  if (nonEmptyLines.length !== 1) {
    throw new Error('Output must contain exactly one line with one reflective question.');
  }
  const question = nonEmptyLines[0]
    .replace(/^[-*•]\s+/, '')
    .replace(/[”’"']+$/u, '')
    .trim();
  if (/^#{1,6}\s/.test(question)) {
    throw new Error('Output must not contain a heading.');
  }
  if (question.length < 12 || question.length > 360 || !/[?;]$/.test(question)) {
    throw new Error('Reflective question is missing or malformed.');
  }
  const questionMarks = question.match(/[?;]/g)?.length ?? 0;
  if (questionMarks !== 1) {
    throw new Error('Output must contain exactly one reflective question.');
  }
  return question;
}

export function sentenceForm(question: string): string {
  const normalized = question
    .toLocaleLowerCase('el')
    .replace(/[«»“”"']/g, '')
    .trim();
  if (/^(αν|εάν)(?:\s|$)/u.test(normalized)) return 'conditional_if';
  if (/^(τι συμβαίνει|τι γίνεται)(?:\s|$)/u.test(normalized)) return 'what_happens';
  if (/^(τι αλλάζει)(?:\s|$)/u.test(normalized)) return 'what_changes';
  if (/^(πώς είναι|πως είναι)(?:\s|$)/u.test(normalized)) return 'how_is_it';
  if (/^(πώς αλλάζει|πως αλλάζει)(?:\s|$)/u.test(normalized)) return 'how_changes';
  if (/^(πού|που)(?:\s|$)/u.test(normalized)) return 'where';
  return normalized.split(/\s+/u).slice(0, 2).join('_') || 'unknown';
}
