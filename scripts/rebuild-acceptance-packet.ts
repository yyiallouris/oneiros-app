/**
 * Rebuild acceptance_runs.json + reviewer_packet.json from an existing run directory.
 * Does NOT call the API. Use after harness fixes when raw per-run JSON already exists.
 *
 *   npx tsx scripts/rebuild-acceptance-packet.ts tmp/5-dream-acceptance-<stamp>
 */
import { readFileSync, writeFileSync } from 'fs';
import path from 'path';
import {
  buildAcceptanceRunRecord,
  reconcileAcceptancePacket,
  summarizeCasesFromRuns,
  type AcceptanceRunRecord,
} from './lib/acceptanceRunRecord';
import type { buildEchoBenchmarkStages } from './lib/echoBenchmarkStages';
import type { ArchetypalEcho } from '../src/ai/archetypalEchoes';
import {
  DREAM_EXTRACTION_PROMPT_ID,
  DREAM_EXTRACTION_PROMPT_VERSION,
  DREAM_EXTRACTION_SCHEMA_VERSION,
} from '../src/ai/dreamExtractionPrompt';

type CaseSpec = {
  id: string;
  combination: string;
  dream: string;
  expected: { required_myth_catalog_id: string | null; required_archetypes?: string[] };
};

type RunPacket = {
  run?: string;
  case_id?: string;
  error?: string;
  latency_ms?: number;
  cost?: { estimatedUsd?: number; model?: string };
  model?: string;
  score?: { myth_status?: AcceptanceRunRecord['myth_status']; myth_catalog_ids?: string[] };
  post_validation_archetypes?: unknown[];
  post_validation_amplifications?: unknown[];
  raw_amplifications?: unknown[];
  raw_archetypes?: unknown[];
  parsed_archetypes?: unknown[];
  normalized_archetypes?: unknown[];
  validator_decisions?: unknown[];
  archetype_rejected?: unknown[];
  mythic_reject_reasons?: string[];
  mythic_rejected?: unknown[];
};

function loadCases(): CaseSpec[] {
  const file = path.join(process.cwd(), 'docs/ONEIROS_5_DREAM_ACCEPTANCE_SET.jsonl');
  return readFileSync(file, 'utf8')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line) as CaseSpec);
}

function main() {
  const outDir = process.argv[2];
  if (!outDir) throw new Error('Usage: npx tsx scripts/rebuild-acceptance-packet.ts <out_dir>');
  const absDir = path.isAbsolute(outDir) ? outDir : path.join(process.cwd(), outDir);
  const allRunsPath = path.join(absDir, 'all_runs.json');
  const summaryPath = path.join(absDir, 'summary.json');
  const packets = JSON.parse(readFileSync(allRunsPath, 'utf8')) as RunPacket[];
  const summary = JSON.parse(readFileSync(summaryPath, 'utf8')) as {
    cases: Array<{
      case_id: string;
      myth_correct: number;
      myth_empty: number;
      myth_wrong: number;
      runs: number;
    }>;
  };
  const cases = loadCases();
  const caseById = new Map(cases.map((c) => [c.id, c]));

  const acceptanceRuns: AcceptanceRunRecord[] = [];
  for (const packet of packets) {
    if (packet.error || !packet.run || !packet.case_id) continue;
    const caseSpec = caseById.get(packet.case_id);
    if (!caseSpec) continue;

    const post: ReturnType<typeof buildEchoBenchmarkStages> = {
      raw_archetypes: packet.raw_archetypes ?? [],
      parsed_archetypes: packet.parsed_archetypes ?? [],
      normalized_archetypes: (packet.normalized_archetypes ?? []) as ArchetypalEcho[],
      validator_decisions: (packet.validator_decisions ?? []) as ReturnType<
        typeof buildEchoBenchmarkStages
      >['validator_decisions'],
      post_validation_archetypes: (packet.post_validation_archetypes ?? []) as ReturnType<
        typeof buildEchoBenchmarkStages
      >['post_validation_archetypes'],
      archetype_rejected: (packet.archetype_rejected ?? []) as ReturnType<
        typeof buildEchoBenchmarkStages
      >['archetype_rejected'],
      raw_amplifications: packet.raw_amplifications ?? [],
      post_validation_amplifications: (packet.post_validation_amplifications ?? []) as ReturnType<
        typeof buildEchoBenchmarkStages
      >['post_validation_amplifications'],
      mythic_reject_reasons: packet.mythic_reject_reasons ?? [],
      mythic_rejected: (packet.mythic_rejected ?? []) as ReturnType<
        typeof buildEchoBenchmarkStages
      >['mythic_rejected'],
      mythic_validator_logs: [],
    };

    const run =
      (packet as { acceptance_run?: AcceptanceRunRecord }).acceptance_run ??
      buildAcceptanceRunRecord({
        runId: packet.run,
        caseSpec,
        outDir: absDir,
        post,
        score: {
          myth_status: packet.score?.myth_status ?? 'empty',
          myth_catalog_ids: packet.score?.myth_catalog_ids,
        },
        model: typeof packet.model === 'string' ? packet.model : packet.cost?.model ?? null,
        schemaOk: true,
        proxyOk: true,
        latency_ms: packet.latency_ms ?? 0,
        estimated_usd: packet.cost?.estimatedUsd ?? null,
      });
    acceptanceRuns.push(run);
  }

  writeFileSync(path.join(absDir, 'acceptance_runs.json'), JSON.stringify(acceptanceRuns, null, 2));

  const detailed = summarizeCasesFromRuns(
    acceptanceRuns,
    Object.fromEntries(cases.map((c) => [c.id, c.combination]))
  );
  const reconcileErrors = reconcileAcceptancePacket({
    source_out_dir: absDir,
    runs: acceptanceRuns,
    cases: detailed,
    summaryCases: summary.cases,
  });

  const reviewerPacket = {
    title: 'Oneiros five-dream acceptance reviewer packet',
    generated_at: new Date().toISOString(),
    source_out_dir: absDir,
    prompt_id: DREAM_EXTRACTION_PROMPT_ID,
    prompt_version: DREAM_EXTRACTION_PROMPT_VERSION,
    schema_version: DREAM_EXTRACTION_SCHEMA_VERSION,
    packet_valid: reconcileErrors.length === 0,
    reconcile_errors: reconcileErrors,
    summary,
    five_dream_runs: acceptanceRuns,
  };

  writeFileSync(path.join(absDir, 'reviewer_packet.json'), JSON.stringify(reviewerPacket, null, 2));
  writeFileSync(
    path.join(process.cwd(), 'tmp/ONEIROS_FIVE_DREAM_REVIEWER_PACKET.json'),
    JSON.stringify(reviewerPacket, null, 2)
  );

  console.log(JSON.stringify({ packet_valid: reviewerPacket.packet_valid, reconcile_errors: reconcileErrors }, null, 2));
  if (reconcileErrors.length > 0) process.exit(1);
}

main();
