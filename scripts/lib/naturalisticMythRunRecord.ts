import {
  DREAM_EXTRACTION_PROMPT_ID,
  DREAM_EXTRACTION_PROMPT_VERSION,
  DREAM_EXTRACTION_SCHEMA_VERSION,
} from '../../src/ai/dreamExtractionPrompt';
import { MYTHIC_CATALOG_VERSION } from '../../src/ai/catalogs/mythicNarrativeCatalog';
import { MYTHIC_PROMPT_INDEX_VERSION } from '../../src/ai/catalogs/mythicPromptIndex';
import type { GlobalArchetypeRunCost } from './globalArchetypeCost';
import type { DreamOutputLanguageTelemetry } from '../../src/ai/dreamOutputLanguage';
import type { NaturalisticMythFixture } from './naturalisticMythBenchmarkFixtures';
import {
  scoreNaturalisticMythRun,
  type NaturalisticMythRunRecordShape,
} from './naturalisticMythBenchmark';

function readCatalogIds(rows: unknown[]): string[] {
  return rows
    .map((row) =>
      row && typeof row === 'object' && typeof (row as { catalog_id?: unknown }).catalog_id === 'string'
        ? String((row as { catalog_id: string }).catalog_id).trim()
        : ''
    )
    .filter(Boolean);
}

function readConfidence(rows: unknown[]): string | null {
  const first = rows[0];
  if (!first || typeof first !== 'object') return null;
  const confidence = (first as { confidence?: unknown }).confidence;
  return typeof confidence === 'string' ? confidence : null;
}

function readEvidenceIds(
  rawRows: unknown[],
  validatorLogs: object[],
  resolvedSpans: string[]
): { evidence_ids: string[]; resolved_evidence_spans: string[] } {
  const first = rawRows[0];
  if (first && typeof first === 'object' && Array.isArray((first as { evidence_ids?: unknown }).evidence_ids)) {
    return {
      evidence_ids: ((first as { evidence_ids: unknown[] }).evidence_ids as unknown[])
        .filter((value): value is string => typeof value === 'string'),
      resolved_evidence_spans: resolvedSpans,
    };
  }
  const fromLogs = validatorLogs
    .map((log) => (log as { resolved_evidence_ids?: unknown }).resolved_evidence_ids)
    .find((value) => Array.isArray(value));
  return {
    evidence_ids: Array.isArray(fromLogs)
      ? fromLogs.filter((value): value is string => typeof value === 'string')
      : [],
    resolved_evidence_spans: resolvedSpans,
  };
}

function readTextField(rows: unknown[], key: 'resonance' | 'divergence'): string | null {
  const first = rows[0];
  if (!first || typeof first !== 'object') return null;
  const value = (first as Record<string, unknown>)[key];
  return typeof value === 'string' ? value : null;
}

export type NaturalisticMythRunRecord = NaturalisticMythRunRecordShape & {
  prompt_id: string;
  prompt_version: string;
  schema_version: number;
  myth_catalog_version: string;
  myth_prompt_index_version: number;
  cost: GlobalArchetypeRunCost | null;
  output_language: DreamOutputLanguageTelemetry;
};

export type NaturalisticMythFailedRun = {
  fixture_id: string;
  repeat_index: 1 | 2 | 3;
  error_type: string;
  error_message: string;
  provider_attempts: Array<{
    provider: string;
    model: string;
    status: number | null;
    error?: string;
  }>;
  source_failure_file: string;
  latency_ms: number;
};

export function buildNaturalisticMythRunRecord(params: {
  fixture: NaturalisticMythFixture;
  run_id: string;
  repeat_index: 1 | 2 | 3;
  outDir: string;
  model: string;
  fallback_used: boolean;
  retry_count: number;
  latency_ms: number;
  cost: GlobalArchetypeRunCost | null;
  language_match: boolean;
  output_language: DreamOutputLanguageTelemetry;
  stages: ReturnType<typeof import('./echoBenchmarkStages').buildEchoBenchmarkStages>;
  expectedModel?: string;
}): NaturalisticMythRunRecord {
  const rawCatalogIds = readCatalogIds(params.stages.raw_amplifications);
  const postCatalogIds = params.stages.post_validation_amplifications.map((row) => row.catalog_id);
  const resolvedEvidenceSpans =
    params.stages.post_validation_amplifications[0]?.evidence
      ? [...params.stages.post_validation_amplifications[0].evidence]
      : [];
  const { evidence_ids, resolved_evidence_spans } = readEvidenceIds(
    params.stages.raw_amplifications,
    params.stages.mythic_validator_logs,
    resolvedEvidenceSpans
  );
  const score = scoreNaturalisticMythRun(
    params.fixture,
    {
      raw_catalog_ids: rawCatalogIds,
      post_catalog_ids: postCatalogIds,
      returned_confidence: readConfidence(params.stages.raw_amplifications) ??
        params.stages.post_validation_amplifications[0]?.confidence ??
        null,
      language_match: params.language_match,
      evidence_ids,
      model: params.model,
      fallback_used: params.fallback_used,
    },
    { expectedModel: params.expectedModel }
  );

  return {
    run_id: params.run_id,
    fixture_id: params.fixture.fixture_id,
    repeat_index: params.repeat_index,
    arm: params.fixture.arm,
    dream_language: params.fixture.dream_language,
    expected_myth_presence: params.fixture.expected_myth_presence,
    required_catalog_id: params.fixture.required_catalog_id,
    acceptable_catalog_ids: [...params.fixture.acceptable_catalog_ids],
    forbidden_catalog_ids: [...params.fixture.forbidden_catalog_ids],
    raw_catalog_ids: rawCatalogIds,
    post_catalog_ids: postCatalogIds,
    returned_confidence:
      readConfidence(params.stages.raw_amplifications) ??
      params.stages.post_validation_amplifications[0]?.confidence ??
      null,
    evidence_ids,
    resonance:
      readTextField(params.stages.raw_amplifications, 'resonance') ??
      params.stages.post_validation_amplifications[0]?.resonance ??
      null,
    divergence:
      readTextField(params.stages.raw_amplifications, 'divergence') ??
      params.stages.post_validation_amplifications[0]?.divergence ??
      null,
    resolved_evidence_spans,
    presence_match: score.presence_match,
    exact_catalog_match: score.exact_catalog_match,
    forbidden_competitor_hit: score.forbidden_competitor_hit,
    unexpected_myth: score.unexpected_myth,
    confidence_contract_pass: score.confidence_contract_pass,
    contract_pass: score.contract_pass,
    language_match: params.language_match,
    validator_decisions: [
      ...params.stages.mythic_validator_logs,
      ...params.stages.mythic_rejected,
    ],
    model: params.model,
    fallback_used: params.fallback_used,
    latency_ms: params.latency_ms,
    retry_count: params.retry_count,
    source_run_file: `${params.outDir}/${params.run_id}.json`,
    prompt_id: DREAM_EXTRACTION_PROMPT_ID,
    prompt_version: DREAM_EXTRACTION_PROMPT_VERSION,
    schema_version: DREAM_EXTRACTION_SCHEMA_VERSION,
    myth_catalog_version: MYTHIC_CATALOG_VERSION,
    myth_prompt_index_version: MYTHIC_PROMPT_INDEX_VERSION,
    cost: params.cost,
    output_language: params.output_language,
  };
}
