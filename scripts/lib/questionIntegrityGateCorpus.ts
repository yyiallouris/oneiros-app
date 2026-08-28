import { createHash } from 'crypto';
import { readFileSync } from 'fs';
import path from 'path';
import type { DreamReflectionDepth } from '../../src/ai/dreamReflectionPrompt';
import type {
  QuestionIntegrityQuestionMode,
  QuestionIntegrityViolationId,
} from '../../src/ai/rd/reflective-questions/questionIntegrityGate/questionIntegrityGateCandidate';
import { loadAndVerifyFrozenAnchorCorpus } from './frozenAnchorReadings';
import type { OneirosLanguageCode } from '../../src/constants/oneirosLanguages';

export const QUESTION_INTEGRITY_GATE_CORPUS_ID =
  'oneiros-question-integrity-gate-phase1-v1' as const;
export const QUESTION_INTEGRITY_GATE_CORPUS_VERSION = '1.0.0' as const;
export const QUESTION_INTEGRITY_GATE_CORPUS_PATH =
  'testing/live-scenarios/question-integrity-gate-phase1.v1.json' as const;
export const QUESTION_INTEGRITY_GATE_CORPUS_SHA256 =
  'aa91e8e64f707100d1e39fb8aa35405d93d1b134461196630ffb2617d7b95d3a' as const;

export type IntegrityGateCorpusRole =
  | 'control_gold'
  | 'control_ship'
  | 'hard_fail_regression'
  | 'inspect';

export type IntegrityGateCorpusCase = {
  id: string;
  case_id: string;
  depth: DreamReflectionDepth;
  question_mode: QuestionIntegrityQuestionMode;
  editorial_score: 'GOLD' | 'SHIP' | 'WEAK' | 'FAIL';
  role: IntegrityGateCorpusRole;
  expect_gate_fail: boolean;
  expected_violations: QuestionIntegrityViolationId[];
  question: string;
};

export type IntegrityGatePreparedCase = IntegrityGateCorpusCase & {
  title: string;
  language: OneirosLanguageCode;
  dream: string;
};

type IntegrityGateCorpusFile = {
  version: string;
  corpus_id: string;
  cases: IntegrityGateCorpusCase[];
};

function sha256Exact(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

export function loadQuestionIntegrityGateCorpusFile(): {
  source: string;
  corpus: IntegrityGateCorpusFile;
  fileSha256: string;
} {
  const corpusPath = path.join(process.cwd(), QUESTION_INTEGRITY_GATE_CORPUS_PATH);
  const source = readFileSync(corpusPath, 'utf8');
  const fileSha256 = sha256Exact(source);
  if (fileSha256 !== QUESTION_INTEGRITY_GATE_CORPUS_SHA256) {
    throw new Error('Integrity-gate corpus file SHA mismatch. Refusing to continue.');
  }
  const corpus = JSON.parse(source) as IntegrityGateCorpusFile;
  if (
    corpus.corpus_id !== QUESTION_INTEGRITY_GATE_CORPUS_ID
    || corpus.version !== QUESTION_INTEGRITY_GATE_CORPUS_VERSION
  ) {
    throw new Error('Integrity-gate corpus identity mismatch. Refusing to continue.');
  }
  if (!Array.isArray(corpus.cases) || corpus.cases.length !== 24) {
    throw new Error('Integrity-gate corpus must contain exactly 24 frozen questions.');
  }
  return { source, corpus, fileSha256 };
}

export function loadAndPrepareQuestionIntegrityGateCorpus(): {
  fileSha256: string;
  cases: IntegrityGatePreparedCase[];
} {
  const { corpus, fileSha256 } = loadQuestionIntegrityGateCorpusFile();
  const anchors = loadAndVerifyFrozenAnchorCorpus();
  const byId = new Map(anchors.cases.map((entry) => [entry.case_id, entry]));
  const cases = corpus.cases.map((item) => {
    const anchor = byId.get(item.case_id);
    if (!anchor) throw new Error(`Missing frozen dream for ${item.case_id}.`);
    if (!item.question.trim()) throw new Error(`Empty question at ${item.id}.`);
    return {
      ...item,
      title: anchor.title,
      language: anchor.language,
      dream: anchor.dream,
    };
  });
  const regressions = cases.filter((item) => item.role === 'hard_fail_regression');
  if (regressions.length !== 5) {
    throw new Error(`Expected 5 hard-fail regressions, got ${regressions.length}.`);
  }
  return { fileSha256, cases };
}
