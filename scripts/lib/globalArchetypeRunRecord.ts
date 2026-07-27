import {
  DREAM_EXTRACTION_PROMPT_ID,
  DREAM_EXTRACTION_PROMPT_VERSION,
  DREAM_EXTRACTION_SCHEMA_VERSION,
} from '../../src/ai/dreamExtractionPrompt';
import { ARCHETYPE_CATALOG_VERSION } from '../../src/ai/catalogs/archetypeCatalog.v1';
import { MYTHIC_CATALOG_VERSION } from '../../src/ai/catalogs/mythicNarrativeCatalog';
import type { buildEchoBenchmarkStages } from './echoBenchmarkStages';
import type { DreamOutputLanguageTelemetry } from '../../src/ai/dreamOutputLanguage';
import type { GlobalArchetypeRunCost } from './globalArchetypeCost';
import {
  dreamHash,
  scoreGlobalArchetypeRun,
  type GlobalArchetypeFixture,
} from './globalArchetypeBenchmark';

function readArchetypeId(row: unknown): string {
  if (!row || typeof row !== 'object') return '';
  const id = (row as { archetype_id?: unknown }).archetype_id;
  return typeof id === 'string' ? id.trim() : '';
}

function readMechanismTags(row: unknown): string[] {
  if (!row || typeof row !== 'object') return [];
  const tags = (row as { mechanism_tags?: unknown }).mechanism_tags;
  return Array.isArray(tags) ? tags.filter((t): t is string => typeof t === 'string') : [];
}

function readConfidence(row: unknown): string | null {
  if (!row || typeof row !== 'object') return null;
  const c = (row as { confidence?: unknown }).confidence;
  return typeof c === 'string' ? c : null;
}

function readEvidenceIds(row: unknown): string[] {
  if (!row || typeof row !== 'object') return [];
  const ids = (row as { evidence_ids?: unknown }).evidence_ids;
  return Array.isArray(ids) ? ids.filter((id): id is string => typeof id === 'string') : [];
}

function firstMythId(stages: ReturnType<typeof buildEchoBenchmarkStages>): string | null {
  const first = stages.post_validation_amplifications[0];
  if (!first || typeof first !== 'object') return null;
  const id = (first as { catalog_id?: unknown }).catalog_id;
  return typeof id === 'string' && id.trim() ? id.trim() : null;
}

export type GlobalArchetypeRunRecord = {
  run_id: string;
  fixture_id: string;
  dream_hash: string;
  fixture_category: GlobalArchetypeFixture['category'];
  required_archetype_ids: string[];
  acceptable_secondary_ids: string[];
  forbidden_archetype_ids: string[];
  expected_cardinality: { min: number; max: number };
  prompt_id: string;
  prompt_version: string;
  schema_version: number;
  archetype_catalog_version: string;
  myth_catalog_version: string;
  model: string | null;
  raw_archetype_objects: unknown[];
  post_validation_archetypes: unknown[];
  raw_archetype_ids: string[];
  post_archetype_ids: string[];
  mechanism_tags_by_raw_id: Record<string, string[]>;
  confidence_by_post_id: Record<string, string | null>;
  evidence_ids_by_raw_id: Record<string, string[]>;
  validator_decisions: unknown[];
  archetype_rejections: string[];
  raw_candidate_count: number;
  post_candidate_count: number;
  score: ReturnType<typeof scoreGlobalArchetypeRun>;
  schema_ok: boolean;
  proxy_ok: boolean;
  latency_ms: number;
  cost: GlobalArchetypeRunCost | null;
  /** @deprecated use cost.estimatedUsd */
  estimated_usd: number | null;
  myth_regression: {
    raw_myth_catalog_id: string | null;
    post_myth_catalog_id: string | null;
    myth_rejections: string[];
  };
  source_run_file: string;
  output_language: DreamOutputLanguageTelemetry;
};

export type GlobalArchetypeFailedRun = {
  run_id: string;
  fixture_id: string;
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

export function buildGlobalArchetypeRunRecord(params: {
  runId: string;
  fixture: GlobalArchetypeFixture;
  outDir: string;
  stages: ReturnType<typeof buildEchoBenchmarkStages>;
  rawArchetypes: unknown[];
  model: string | null;
  schemaOk: boolean;
  proxyOk: boolean;
  latency_ms: number;
  cost: GlobalArchetypeRunCost | null;
  output_language: DreamOutputLanguageTelemetry;
}): GlobalArchetypeRunRecord {
  const rawIds = params.rawArchetypes.map(readArchetypeId).filter((id): id is string => Boolean(id));
  const postIds = params.stages.post_validation_archetypes
    .map((a) => a.archetype_id)
    .filter((id): id is string => Boolean(id));

  const mechanism_tags_by_raw_id: Record<string, string[]> = {};
  const evidence_ids_by_raw_id: Record<string, string[]> = {};
  for (const row of params.rawArchetypes) {
    const id = readArchetypeId(row);
    if (!id) continue;
    mechanism_tags_by_raw_id[id] = readMechanismTags(row);
    evidence_ids_by_raw_id[id] = readEvidenceIds(row);
  }

  const confidence_by_post_id: Record<string, string | null> = {};
  for (const echo of params.stages.post_validation_archetypes) {
    if (!echo.archetype_id) continue;
    confidence_by_post_id[echo.archetype_id] = echo.confidence ?? null;
  }

  const rawMyth =
    params.stages.raw_amplifications?.[0] &&
    typeof params.stages.raw_amplifications[0] === 'object'
      ? String((params.stages.raw_amplifications[0] as { catalog_id?: unknown }).catalog_id ?? '')
      : null;

  return {
    run_id: params.runId,
    fixture_id: params.fixture.id,
    dream_hash: dreamHash(params.fixture.dream),
    fixture_category: params.fixture.category,
    required_archetype_ids: params.fixture.expected.required_archetype_ids,
    acceptable_secondary_ids: params.fixture.expected.acceptable_secondary_ids,
    forbidden_archetype_ids: params.fixture.expected.forbidden_archetype_ids,
    expected_cardinality: params.fixture.expected.expected_cardinality,
    prompt_id: DREAM_EXTRACTION_PROMPT_ID,
    prompt_version: DREAM_EXTRACTION_PROMPT_VERSION,
    schema_version: DREAM_EXTRACTION_SCHEMA_VERSION,
    archetype_catalog_version: ARCHETYPE_CATALOG_VERSION,
    myth_catalog_version: MYTHIC_CATALOG_VERSION,
    model: params.model,
    raw_archetype_objects: params.rawArchetypes,
    post_validation_archetypes: params.stages.post_validation_archetypes,
    raw_archetype_ids: rawIds,
    post_archetype_ids: postIds,
    mechanism_tags_by_raw_id,
    confidence_by_post_id,
    evidence_ids_by_raw_id,
    validator_decisions: params.stages.validator_decisions,
    archetype_rejections: params.stages.archetype_rejected.map((r) => r.reason),
    raw_candidate_count: rawIds.length,
    post_candidate_count: postIds.length,
    score: scoreGlobalArchetypeRun(params.fixture, postIds),
    schema_ok: params.schemaOk,
    proxy_ok: params.proxyOk,
    latency_ms: params.latency_ms,
    cost: params.cost,
    estimated_usd: params.cost?.estimatedUsd ?? null,
    myth_regression: {
      raw_myth_catalog_id: rawMyth || null,
      post_myth_catalog_id: firstMythId(params.stages),
      myth_rejections: params.stages.mythic_reject_reasons,
    },
    source_run_file: `${params.outDir}/${params.runId}.json`,
    output_language: params.output_language,
  };
}
