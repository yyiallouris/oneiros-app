import { createHash } from 'crypto';
import { readFileSync } from 'fs';
import path from 'path';
import { isOneirosLanguageCode, type OneirosLanguageCode } from '../../src/constants/oneirosLanguages';

export const FROZEN_ANCHOR_CORPUS_ID =
  'oneiros-frozen-anchor-readings-v1' as const;
export const FROZEN_ANCHOR_CORPUS_VERSION = '1.0.0' as const;
export const FROZEN_ANCHOR_CORPUS_PATH =
  'testing/live-scenarios/reflective-question-frozen-anchor-readings.v1.json' as const;
export const FROZEN_ANCHOR_CORPUS_SHA256 =
  '2a1a8bc3a5b4a0019155e2856771c3eea4450be44e57ad1eeea0907d52738628' as const;

export const FROZEN_ANCHOR_CASE_IDS = [
  'elevator-missing-button',
  'words-rest-on-table',
  'dinner-for-absent-host',
  'zh-faguo-mingzi',
  'sunrise-on-quiet-ridge',
  'skin-turns-to-bark',
  'ja-neon-home',
  'shared-scarf-at-harbor',
] as const;

export type FrozenAnchorReading = {
  case_id: string;
  title: string;
  language: OneirosLanguageCode;
  dream_sha256: string;
  reading_sha256: string;
  dream: string;
  reading: string;
  source_reader: {
    route: string;
    provider: string;
    model: string;
    latency_ms: number;
    estimated_usd: number;
  };
};

export type FrozenAnchorCorpus = {
  version: string;
  corpus_id: string;
  source: string;
  source_artifact: {
    path: string;
    sha256: string;
    benchmark_id: string;
    generated_at: string;
    reader_prompt_identity: null;
    provenance_note: string;
  };
  cases: FrozenAnchorReading[];
};

export function sha256Exact(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

export function loadAndVerifyFrozenAnchorCorpus(): FrozenAnchorCorpus {
  const corpusPath = path.join(process.cwd(), FROZEN_ANCHOR_CORPUS_PATH);
  const source = readFileSync(corpusPath, 'utf8');
  if (sha256Exact(source) !== FROZEN_ANCHOR_CORPUS_SHA256) {
    throw new Error('Frozen anchor corpus file SHA mismatch. Refusing to continue.');
  }
  const corpus = JSON.parse(source) as FrozenAnchorCorpus;
  if (
    corpus.corpus_id !== FROZEN_ANCHOR_CORPUS_ID ||
    corpus.version !== FROZEN_ANCHOR_CORPUS_VERSION
  ) {
    throw new Error('Frozen anchor corpus identity mismatch. Refusing to continue.');
  }
  if (corpus.cases.length !== FROZEN_ANCHOR_CASE_IDS.length) {
    throw new Error('Frozen anchor corpus cardinality mismatch. Refusing to continue.');
  }
  corpus.cases.forEach((entry, index) => {
    if (entry.case_id !== FROZEN_ANCHOR_CASE_IDS[index]) {
      throw new Error(`Frozen anchor order mismatch at ${entry.case_id}.`);
    }
    if (!isOneirosLanguageCode(entry.language)) {
      throw new Error(`Unsupported frozen language at ${entry.case_id}.`);
    }
    if (sha256Exact(entry.dream) !== entry.dream_sha256) {
      throw new Error(`Frozen dream SHA mismatch at ${entry.case_id}.`);
    }
    if (sha256Exact(entry.reading) !== entry.reading_sha256) {
      throw new Error(`Frozen reading SHA mismatch at ${entry.case_id}.`);
    }
    if (entry.source_reader.model !== 'gpt-5.4' || entry.source_reader.route !== 'interpretation_standard') {
      throw new Error(`Frozen Reader provenance mismatch at ${entry.case_id}.`);
    }
  });
  return corpus;
}
