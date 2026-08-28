import { createHash } from 'crypto';
import { existsSync, readFileSync } from 'fs';
import path from 'path';
import { detectOneirosLanguageCode } from '../../src/ai/reflectiveLanguage';
import type { OneirosLanguageCode } from '../../src/constants/oneirosLanguages';

export type ReflectiveQuestionReadingCacheCase = {
  id: string;
  content: string;
  language: OneirosLanguageCode;
};

export type ReflectiveQuestionReadingCache = {
  sourcePath: string;
  sha256: string;
  benchmarkId: string;
  methodId: string | null;
  readingsByCaseId: Map<string, string>;
  readingLanguagesByCaseId: Map<string, OneirosLanguageCode | null>;
};

function sha256(value: string): string {
  return createHash('sha256').update(value.trim()).digest('hex');
}

/**
 * Loads only readings whose case id and full dream text match the frozen
 * benchmark input. A partial, duplicated, or stale cache fails closed before
 * any paid model call begins.
 */
export function loadReflectiveQuestionReadingCache(params: {
  configuredPath: string;
  cwd: string;
  cases: ReflectiveQuestionReadingCacheCase[];
}): ReflectiveQuestionReadingCache | null {
  if (!params.configuredPath.trim()) return null;
  const resolvedPath = path.resolve(params.cwd, params.configuredPath);
  if (!existsSync(resolvedPath)) {
    throw new Error(`Reading cache does not exist: ${params.configuredPath}.`);
  }
  const raw = readFileSync(resolvedPath, 'utf8');
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    throw new Error(`Reading cache is not valid JSON: ${params.configuredPath}.`);
  }
  const benchmarkId = typeof parsed.benchmark_id === 'string'
    ? parsed.benchmark_id
    : '';
  if (!benchmarkId || !Array.isArray(parsed.trials)) {
    throw new Error('Reading cache is not a Oneiros benchmark results artifact.');
  }
  const cachedById = new Map<string, Record<string, unknown>>();
  for (const value of parsed.trials) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) continue;
    const trial = value as Record<string, unknown>;
    const id = typeof trial.case_id === 'string' ? trial.case_id : '';
    if (!id) continue;
    if (cachedById.has(id)) {
      throw new Error(`Reading cache contains duplicate case id: ${id}.`);
    }
    cachedById.set(id, trial);
  }
  const readingsByCaseId = new Map<string, string>();
  const readingLanguagesByCaseId = new Map<string, OneirosLanguageCode | null>();
  for (const testCase of params.cases) {
    const cached = cachedById.get(testCase.id);
    if (!cached) {
      throw new Error(`Reading cache is missing frozen case: ${testCase.id}.`);
    }
    if (cached.dream !== testCase.content) {
      throw new Error(`Reading cache dream mismatch for frozen case: ${testCase.id}.`);
    }
    const reading = typeof cached.reading === 'string' ? cached.reading.trim() : '';
    if (!reading) {
      throw new Error(`Reading cache has no successful reading for: ${testCase.id}.`);
    }
    const declaredCaseLanguage = typeof cached.language === 'string'
      ? cached.language
      : null;
    if (declaredCaseLanguage && declaredCaseLanguage !== testCase.language) {
      throw new Error(`Reading cache expected-language mismatch for frozen case: ${testCase.id}.`);
    }
    const detectedLanguage = detectOneirosLanguageCode(reading);
    const recordedOutputLanguage = typeof cached.reading_output_language === 'string'
      ? cached.reading_output_language
      : detectedLanguage;
    if (recordedOutputLanguage && recordedOutputLanguage !== testCase.language) {
      throw new Error(
        `Reading cache output-language mismatch for frozen case: ${testCase.id}; expected ${testCase.language}, received ${recordedOutputLanguage}.`
      );
    }
    readingsByCaseId.set(testCase.id, reading);
    readingLanguagesByCaseId.set(testCase.id, detectedLanguage);
  }
  return {
    sourcePath: path.relative(params.cwd, resolvedPath) || path.basename(resolvedPath),
    sha256: sha256(raw),
    benchmarkId,
    methodId: typeof parsed.method_id === 'string' ? parsed.method_id : null,
    readingsByCaseId,
    readingLanguagesByCaseId,
  };
}
