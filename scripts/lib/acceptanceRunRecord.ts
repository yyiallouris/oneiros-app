import { createHash } from 'crypto';
import {
  DREAM_EXTRACTION_PROMPT_ID,
  DREAM_EXTRACTION_PROMPT_VERSION,
  DREAM_EXTRACTION_SCHEMA_VERSION,
} from '../../src/ai/dreamExtractionPrompt';
import { MYTHIC_CATALOG_VERSION } from '../../src/ai/catalogs/mythicNarrativeCatalog';
import { MYTHIC_PROMPT_INDEX_VERSION } from '../../src/ai/catalogs/mythicPromptIndex';
import type { buildEchoBenchmarkStages } from './echoBenchmarkStages';

export const ACCEPTANCE_CASE_MYTH_FIXTURE: Record<string, string | null> = {
  C1_two_archetypes_plus_myth: 'greek.orpheus_eurydice',
  C2_one_archetype_no_myth: null,
  C3_no_archetype_plus_myth: 'greek.sisyphus',
  C4_neither: null,
  C5_one_archetype_plus_myth: 'sumerian.inanna_descent',
};

export type AcceptanceCaseSpec = {
  id: string;
  combination: string;
  dream: string;
  expected: { required_myth_catalog_id: string | null };
};

export function dreamHash(text: string): string {
  return createHash('sha256').update(text, 'utf8').digest('hex').slice(0, 16);
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function readArchetypeId(row: unknown): string {
  if (!row || typeof row !== 'object') return '';
  const o = row as Record<string, unknown>;
  return typeof o.archetype_id === 'string' ? o.archetype_id.trim() : '';
}

function firstCatalogId(amps: unknown): string | null {
  if (!Array.isArray(amps) || amps.length === 0) return null;
  const first = amps[0];
  if (!first || typeof first !== 'object') return null;
  const id = (first as { catalog_id?: unknown }).catalog_id;
  return typeof id === 'string' && id.trim() ? id.trim() : null;
}

export function validateAcceptanceFixtures(cases: AcceptanceCaseSpec[]): void {
  const errors: string[] = [];
  for (const c of cases) {
    const fixture = ACCEPTANCE_CASE_MYTH_FIXTURE[c.id];
    if (fixture === undefined) {
      errors.push(`Unknown case id in fixture map: ${c.id}`);
      continue;
    }
    if (c.expected.required_myth_catalog_id !== fixture) {
      errors.push(
        `${c.id}: jsonl required_myth_catalog_id=${String(c.expected.required_myth_catalog_id)} fixture=${String(fixture)}`
      );
    }
  }
  if (errors.length > 0) {
    throw new Error(`Acceptance myth fixtures invalid:\n${errors.join('\n')}`);
  }
}

export type AcceptanceRunRecord = {
  run_id: string;
  case_id: string;
  dream_hash: string;
  expected_myth_catalog_id: string | null;
  prompt_id: string;
  prompt_version: string;
  schema_version: number;
  myth_catalog_version: string;
  myth_prompt_index_version: number;
  model: string | null;
  raw_myth_catalog_id: string | null;
  post_myth_catalog_id: string | null;
  raw_archetype_ids: string[];
  post_archetype_ids: string[];
  myth_status: 'correct' | 'empty' | 'wrong' | 'catalog_gap' | 'unexpected';
  myth_rejections: string[];
  archetype_rejections: string[];
  schema_ok: boolean;
  proxy_ok: boolean;
  latency_ms: number;
  estimated_usd: number | null;
  source_run_file: string;
};

export function buildAcceptanceRunRecord(params: {
  runId: string;
  caseSpec: AcceptanceCaseSpec;
  outDir: string;
  post: ReturnType<typeof buildEchoBenchmarkStages>;
  score: {
    myth_status: AcceptanceRunRecord['myth_status'];
    myth_catalog_ids?: string[];
  };
  model: string | null;
  schemaOk: boolean;
  proxyOk: boolean;
  latency_ms: number;
  estimated_usd: number | null;
}): AcceptanceRunRecord {
  const rawMyth = firstCatalogId(params.post.raw_amplifications);
  const postMyth =
    firstCatalogId(params.post.post_validation_amplifications) ??
    (params.score.myth_catalog_ids?.[0] ?? null);

  return {
    run_id: params.runId,
    case_id: params.caseSpec.id,
    dream_hash: dreamHash(params.caseSpec.dream),
    expected_myth_catalog_id: params.caseSpec.expected.required_myth_catalog_id,
    prompt_id: DREAM_EXTRACTION_PROMPT_ID,
    prompt_version: DREAM_EXTRACTION_PROMPT_VERSION,
    schema_version: DREAM_EXTRACTION_SCHEMA_VERSION,
    myth_catalog_version: MYTHIC_CATALOG_VERSION,
    myth_prompt_index_version: MYTHIC_PROMPT_INDEX_VERSION,
    model: params.model,
    raw_myth_catalog_id: rawMyth,
    post_myth_catalog_id: postMyth,
    raw_archetype_ids: asArray(params.post.raw_archetypes).map(readArchetypeId).filter(Boolean),
    post_archetype_ids: params.post.post_validation_archetypes
      .map((a) => a.archetype_id)
      .filter((id): id is string => Boolean(id)),
    myth_status: params.score.myth_status,
    myth_rejections: params.post.mythic_reject_reasons,
    archetype_rejections: params.post.archetype_rejected.map((r) => r.reason),
    schema_ok: params.schemaOk,
    proxy_ok: params.proxyOk,
    latency_ms: params.latency_ms,
    estimated_usd: params.estimated_usd,
    source_run_file: `${params.outDir}/${params.runId}.json`,
  };
}

export type CaseSummaryFromRuns = {
  case_id: string;
  combination: string;
  runs: number;
  required_myth_catalog_id: string | null;
  myth_correct: number;
  myth_empty: number;
  myth_wrong: number;
  myth_pass_min_2_of_3: boolean;
  run_ids: string[];
};

export type AcceptanceSuitePassInput = {
  integrity_100: boolean;
  myth_negative_6_of_6: boolean;
  myth_positive_min_2_of_3: boolean;
  required_archetypes_all: boolean;
  empty_archetype_cases: boolean;
  catalog_gaps: string[];
};

export type AcceptanceLayerPasses = {
  integrity_pass: boolean;
  myth_layer_pass: boolean;
  archetype_layer_pass: boolean;
  overall_pass: boolean;
};

export function computeAcceptanceLayerPasses(
  suitePass: AcceptanceSuitePassInput
): AcceptanceLayerPasses {
  const integrity_pass = suitePass.integrity_100 && suitePass.catalog_gaps.length === 0;
  const myth_layer_pass =
    suitePass.myth_negative_6_of_6 && suitePass.myth_positive_min_2_of_3;
  const archetype_layer_pass =
    suitePass.required_archetypes_all && suitePass.empty_archetype_cases;
  const overall_pass = integrity_pass && myth_layer_pass && archetype_layer_pass;
  return { integrity_pass, myth_layer_pass, archetype_layer_pass, overall_pass };
}

export function summarizeCasesFromRuns(
  runs: AcceptanceRunRecord[],
  combinationByCaseId?: Record<string, string>
): CaseSummaryFromRuns[] {
  const byCase = new Map<string, AcceptanceRunRecord[]>();
  for (const run of runs) {
    const list = byCase.get(run.case_id) || [];
    list.push(run);
    byCase.set(run.case_id, list);
  }

  return Object.keys(ACCEPTANCE_CASE_MYTH_FIXTURE).map((caseId) => {
    const caseRuns = byCase.get(caseId) || [];
    const mythCorrect = caseRuns.filter((r) => r.myth_status === 'correct').length;
    const mythEmpty = caseRuns.filter((r) => r.myth_status === 'empty').length;
    const mythWrong = caseRuns.filter(
      (r) => r.myth_status === 'wrong' || r.myth_status === 'unexpected'
    ).length;
    const required = ACCEPTANCE_CASE_MYTH_FIXTURE[caseId] ?? null;
    return {
      case_id: caseId,
      combination: combinationByCaseId?.[caseId] ?? '',
      runs: caseRuns.length,
      required_myth_catalog_id: required,
      myth_correct: mythCorrect,
      myth_empty: mythEmpty,
      myth_wrong: mythWrong,
      myth_pass_min_2_of_3:
        required == null ? mythEmpty === caseRuns.length && mythWrong === 0 : mythCorrect >= 2 && mythWrong === 0,
      run_ids: caseRuns.map((r) => r.run_id),
    };
  });
}

export function reconcileAcceptancePacket(params: {
  source_out_dir: string;
  runs: AcceptanceRunRecord[];
  cases: CaseSummaryFromRuns[];
  summaryCases: Array<{
    case_id: string;
    myth_correct: number;
    myth_empty: number;
    myth_wrong: number;
    runs: number;
  }>;
}): string[] {
  const errors: string[] = [];
  if (params.runs.length !== params.summaryCases.reduce((n, c) => n + c.runs, 0)) {
    errors.push('summary run count does not match detailed run count');
  }

  for (const summaryCase of params.summaryCases) {
    const detailed = params.cases.find((c) => c.case_id === summaryCase.case_id);
    if (!detailed) {
      errors.push(`missing detailed case ${summaryCase.case_id}`);
      continue;
    }
    if (detailed.myth_correct !== summaryCase.myth_correct) {
      errors.push(`${summaryCase.case_id}: myth_correct mismatch summary=${summaryCase.myth_correct} detailed=${detailed.myth_correct}`);
    }
    if (detailed.myth_empty !== summaryCase.myth_empty) {
      errors.push(`${summaryCase.case_id}: myth_empty mismatch`);
    }
    if (detailed.myth_wrong !== summaryCase.myth_wrong) {
      errors.push(`${summaryCase.case_id}: myth_wrong mismatch`);
    }
    if (detailed.myth_correct + detailed.myth_empty + detailed.myth_wrong !== detailed.runs) {
      errors.push(`${summaryCase.case_id}: myth counts do not sum to runs`);
    }
  }

  for (const run of params.runs) {
    const fixture = ACCEPTANCE_CASE_MYTH_FIXTURE[run.case_id];
    if (run.expected_myth_catalog_id !== fixture) {
      errors.push(`${run.run_id}: expected_myth_catalog_id mismatch fixture`);
    }
    if (!run.source_run_file.includes(params.source_out_dir)) {
      errors.push(`${run.run_id}: source_run_file outside source_out_dir`);
    }
  }

  const wrongIdsInSummary = params.summaryCases.flatMap((c) => {
    if (c.myth_wrong === 0) return [];
    const caseRuns = params.runs.filter((r) => r.case_id === c.case_id);
    return caseRuns
      .filter((r) => r.myth_status === 'wrong' || r.myth_status === 'unexpected')
      .map((r) => r.post_myth_catalog_id)
      .filter(Boolean) as string[];
  });

  for (const wrongId of wrongIdsInSummary) {
    const found = params.runs.some((r) => r.post_myth_catalog_id === wrongId);
    if (!found) errors.push(`summary wrong myth ${wrongId} not found in detailed runs`);
  }

  return errors;
}
