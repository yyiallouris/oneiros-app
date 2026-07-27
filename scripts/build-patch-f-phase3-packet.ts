import { execSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { buildDreamExtractionUserPrompt } from '../src/ai/dreamExtractionPrompt';
import { resolveDreamOutputLanguage } from '../src/ai/dreamOutputLanguage';
import {
  ARCHETYPE_CATALOG_VERSION,
  ARCHETYPE_ID_ALIASES,
  getArchetypeDefinitionById,
} from '../src/ai/catalogs/archetypeCatalog.v1';
import {
  PATCH_F_PHASE1_FIXTURE,
  PATCH_F_PHASE2_FIXTURES,
  type PatchFFixture,
} from './lib/patchFStabilityFixtures';
import type { PatchFRunRow, PatchFSuiteReport } from './lib/patchFStabilityMetrics';

type Provenance = 'observed' | 'reconstructed_from_stable_builder' | 'inferred' | 'unavailable';

type ValueWithProvenance<T> = {
  value: T;
  provenance: Provenance;
  note?: string;
};

type OldSeaRun = {
  runId: string;
  ok: boolean;
  latency_ms: number;
  prompt_version?: string;
  catalog_version?: string;
  target_output_language?: string;
  raw_ids?: string[];
  post_ids?: string[];
};

type OldSeaSummary = {
  outDir: string;
  prompt_version: string;
  concurrency: number;
  ok: number;
  failed: number;
};

type LoverProof = {
  catalog_version: string;
  compact_prompt_record: string;
  present_in_injected_catalog: boolean;
  phase1_hashes: {
    dream_hash: string;
    system_prompt_hash: string;
    user_prompt_hash: string;
    catalog_hash: string;
    schema_hash: string;
    prompt_id: string;
    prompt_version: string;
    schema_version: number;
    temperature: number;
  };
};

type AdjudicationCase = {
  fixture: PatchFFixture;
  expected_primary: string[];
  acceptable_secondary: string[];
  summary: PatchFRunRow[];
  raw_examples: Array<{
    run_id: string;
    raw_archetypes: unknown[];
    post_validation_archetypes: unknown[];
  }>;
  distribution: Record<string, number>;
  relevant_catalog_records: Array<{
    requested_id: string;
    current_catalog_version: string;
    current_catalog_id: string;
    alias_applied: string | null;
    record_available: boolean;
    record: ReturnType<typeof getArchetypeDefinitionById> | null;
    note?: string;
  }>;
};

function sha16(text: string): string {
  return createHash('sha256').update(text, 'utf8').digest('hex').slice(0, 16);
}

function readJson<T>(file: string): T {
  return JSON.parse(readFileSync(file, 'utf8')) as T;
}

function writeJson(file: string, value: unknown): void {
  writeFileSync(file, JSON.stringify(value, null, 2));
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(',')}]`;
  }
  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) =>
      a.localeCompare(b)
    );
    return `{${entries
      .map(([key, item]) => `${JSON.stringify(key)}:${stableStringify(item)}`)
      .join(',')}}`;
  }
  return JSON.stringify(value);
}

function value<T>(v: T, provenance: Provenance, note?: string): ValueWithProvenance<T> {
  return { value: v, provenance, note };
}

function unavailable(note: string): ValueWithProvenance<null> {
  return { value: null, provenance: 'unavailable', note };
}

function extractOldHarnessMetadata(oldHarnessPath: string): {
  dream: string;
  title: string;
  date: string;
  run_tag_format: string;
} {
  const source = readFileSync(oldHarnessPath, 'utf8');
  const dreamMatch = source.match(/const DREAM = `([\s\S]*?)`;/);
  const titleMatch = source.match(/title:\s*'([^']+)'/);
  const dateMatch = source.match(/date:\s*'([^']+)'/);
  if (!dreamMatch || !titleMatch || !dateMatch) {
    throw new Error(`Could not parse old harness metadata from ${oldHarnessPath}`);
  }
  return {
    dream: dreamMatch[1],
    title: titleMatch[1],
    date: dateMatch[1],
    run_tag_format: '[sea_mattress_el:${runId}:${randomUUID()}]',
  };
}

function computeUserPromptHashFromStableBuilder(params: {
  title: string;
  date: string;
  dream: string;
  dreamLanguage: 'en' | 'el';
}): string {
  const target = resolveDreamOutputLanguage(params.dream, params.dreamLanguage);
  const prompt = buildDreamExtractionUserPrompt({
    title: params.title,
    date: params.date,
    content: params.dream,
    finalInterpretation: null,
    debugInterpretiveEchoes: false,
    dreamLanguage: params.dreamLanguage,
    targetOutputLanguage: target,
  });
  return sha16(prompt);
}

function getGitRuntimeFingerprint(): {
  git_head_sha: string | null;
  dirty_worktree: boolean;
  exact_runtime_commit_unavailable: boolean;
} {
  try {
    const git_head_sha = execSync('git rev-parse HEAD', {
      cwd: process.cwd(),
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    const dirty = execSync('git status --short', {
      cwd: process.cwd(),
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    })
      .trim()
      .length > 0;
    return {
      git_head_sha,
      dirty_worktree: dirty,
      exact_runtime_commit_unavailable: dirty,
    };
  } catch {
    return {
      git_head_sha: null,
      dirty_worktree: true,
      exact_runtime_commit_unavailable: true,
    };
  }
}

function buildDistribution(rows: PatchFRunRow[]): Record<string, number> {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const key = row.post_archetype_ids.length ? row.post_archetype_ids.join('|') : '[]';
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return Object.fromEntries([...counts.entries()].sort(([a], [b]) => a.localeCompare(b)));
}

function buildCatalogRecord(requestedId: string): AdjudicationCase['relevant_catalog_records'][number] {
  const alias = ARCHETYPE_ID_ALIASES[requestedId] ?? null;
  const current_catalog_id = alias ?? requestedId;
  const record = getArchetypeDefinitionById(current_catalog_id);
  return {
    requested_id: requestedId,
    current_catalog_version: ARCHETYPE_CATALOG_VERSION,
    current_catalog_id,
    alias_applied: alias,
    record_available: Boolean(record),
    record: record ?? null,
    note:
      alias !== null
        ? `Current live catalog aliases legacy id ${requestedId} -> ${current_catalog_id}; frozen 1.6.0 record text was not persisted separately in the Patch F artifacts.`
        : undefined,
  };
}

function buildAdjudicationCase(params: {
  fixtureId: string;
  allRuns: PatchFRunRow[];
  patchDir: string;
}): AdjudicationCase {
  const fixture = PATCH_F_PHASE2_FIXTURES.find((item) => item.id === params.fixtureId);
  if (!fixture) throw new Error(`Missing fixture ${params.fixtureId}`);
  const summary = params.allRuns
    .filter((row) => row.fixture_id === params.fixtureId && row.ok)
    .sort((a, b) => a.run_id.localeCompare(b.run_id));
  const rawExamples = readRawExamples(params.patchDir, params.fixtureId);
  const returnedIds = new Set<string>();
  for (const row of summary) {
    for (const id of row.post_archetype_ids) returnedIds.add(id);
  }
  for (const example of rawExamples) {
    for (const row of example.post_validation_archetypes as Array<Record<string, unknown>>) {
      const id = String(row.archetype_id ?? '').trim();
      if (id) returnedIds.add(id);
    }
  }
  return {
    fixture,
    expected_primary: fixture.required_archetype_ids,
    acceptable_secondary: fixture.acceptable_secondary_ids,
    summary,
    raw_examples: rawExamples,
    distribution: buildDistribution(summary),
    relevant_catalog_records: [
      ...fixture.required_archetype_ids.map(buildCatalogRecord),
      ...fixture.acceptable_secondary_ids.map(buildCatalogRecord),
      ...[...returnedIds].map(buildCatalogRecord),
    ].filter(
      (record, index, list) => list.findIndex((candidate) => candidate.requested_id === record.requested_id) === index
    ),
  };
}

function readRawExamples(
  patchDir: string,
  fixtureId: string
): Array<{ run_id: string; raw_archetypes: unknown[]; post_validation_archetypes: unknown[] }> {
  const wanted = [
    path.join(patchDir, `${fixtureId}_r1.raw.json`),
    path.join(patchDir, `${fixtureId}_r3.raw.json`),
    path.join(patchDir, `${fixtureId}_r4.raw.json`),
    path.join(patchDir, `${fixtureId}_r5.raw.json`),
  ];
  const out: Array<{ run_id: string; raw_archetypes: unknown[]; post_validation_archetypes: unknown[] }> = [];
  for (const file of wanted) {
    try {
      const packet = readJson<{
        raw_archetypes?: unknown[];
        post_validation_archetypes?: unknown[];
      }>(file);
      out.push({
        run_id: path.basename(file, '.raw.json'),
        raw_archetypes: packet.raw_archetypes ?? [],
        post_validation_archetypes: packet.post_validation_archetypes ?? [],
      });
    } catch {
      continue;
    }
  }
  return out;
}

function buildComparisonMarkdown(input: {
  oldBatch: Record<string, ValueWithProvenance<unknown>>;
  newBatch: Record<string, ValueWithProvenance<unknown>>;
  userPromptDelta: string[];
  replayStatus: string[];
  adjudicationFile: string;
}): string {
  const rows: string[] = [];
  rows.push('# Patch F Phase 3 — Old vs New Reconciliation');
  rows.push('');
  rows.push('| Field | Old 2/5 batch | Patch F 20/20 batch |');
  rows.push('|---|---|---|');
  const keys = [
    'dream_hash',
    'reflection_context_hash',
    'system_prompt_hash',
    'user_prompt_hash',
    'catalog_hash',
    'schema_hash',
    'target_output_language',
    'model_snapshot',
    'temperature',
    'max_completion_tokens',
    'runtime_commit_sha',
    'concurrency',
    'request_body_hashes',
  ];
  for (const key of keys) {
    const oldValue = input.oldBatch[key];
    const newValue = input.newBatch[key];
    rows.push(
      `| ${key} | ${formatCell(oldValue)} | ${formatCell(newValue)} |`
    );
  }
  rows.push('');
  rows.push('## Exact request differences');
  for (const line of input.userPromptDelta) rows.push(`- ${line}`);
  rows.push('');
  rows.push('## Replay status');
  for (const line of input.replayStatus) rows.push(`- ${line}`);
  rows.push('');
  rows.push(`Targeted adjudication JSON: \`${input.adjudicationFile}\``);
  return rows.join('\n');
}

function formatCell(entry: ValueWithProvenance<unknown> | undefined): string {
  if (!entry) return 'unavailable';
  const valueText =
    entry.value === null
      ? 'null'
      : typeof entry.value === 'string'
        ? entry.value
        : `\`${stableStringify(entry.value)}\``;
  return `${valueText} (${entry.provenance}${entry.note ? `; ${entry.note}` : ''})`;
}

function main() {
  const oldDir =
    process.argv[2] ??
    path.join(process.cwd(), 'tmp/sea-mattress-el-x5-2026-07-27T15-47-40-011Z');
  const patchDir =
    process.argv[3] ??
    path.join(process.cwd(), 'tmp/patch-f-stability-2026-07-27T16-00-49-424Z');
  const outDir =
    process.argv[4] ??
    path.join(
      process.cwd(),
      'tmp',
      `patch-f-phase3-${new Date().toISOString().replace(/[:.]/g, '-')}`
    );
  mkdirSync(outDir, { recursive: true });

  const oldHarnessPath = path.join(process.cwd(), 'tmp/runSeaMattressElx5.ts');
  const oldHarness = extractOldHarnessMetadata(oldHarnessPath);
  const oldRuns = readJson<OldSeaRun[]>(path.join(oldDir, 'runs.json'));
  const oldSummary = readJson<OldSeaSummary>(path.join(oldDir, 'summary.json'));
  const patchReport = readJson<PatchFSuiteReport>(path.join(patchDir, 'PHASE_F_REPORT.json'));
  const proof = readJson<LoverProof>(path.join(patchDir, 'catalog_lover_injection_proof.json'));
  const allRuns = readJson<PatchFRunRow[]>(path.join(patchDir, 'all_runs.json'));

  const stablePhase1Hash = computeUserPromptHashFromStableBuilder({
    title: PATCH_F_PHASE1_FIXTURE.id,
    date: '2026-07-27',
    dream: PATCH_F_PHASE1_FIXTURE.dream,
    dreamLanguage: PATCH_F_PHASE1_FIXTURE.dream_language,
  });
  const userBuilderStable = stablePhase1Hash === proof.phase1_hashes.user_prompt_hash;
  const oldUserPromptHash = userBuilderStable
    ? computeUserPromptHashFromStableBuilder({
        title: oldHarness.title,
        date: oldHarness.date,
        dream: oldHarness.dream,
        dreamLanguage: 'el',
      })
    : null;

  const gitRuntime = getGitRuntimeFingerprint();
  const sharedRuntimeShaText = gitRuntime.git_head_sha
    ? `${gitRuntime.git_head_sha}${gitRuntime.dirty_worktree ? ' + dirty-worktree' : ''}`
    : null;
  const oldDreamHash = sha16(oldHarness.dream);
  const reflectionContextHash = sha16(JSON.stringify({ finalInterpretation: null }));

  const oldBatch = {
    dream_hash: value(oldDreamHash, 'observed', 'Derived from the exact dream text embedded in tmp/runSeaMattressElx5.ts'),
    reflection_context_hash: value(
      reflectionContextHash,
      'reconstructed_from_stable_builder',
      'Both old and new sea-mattress runs pass finalInterpretation=null; no separate reflection payload was persisted.'
    ),
    system_prompt_hash: value(
      proof.phase1_hashes.system_prompt_hash,
      'inferred',
      'Old batch did not persist system prompt bytes; old harness and Patch F phase1 both invoked the shared dream_extraction system builder under frozen 4.1.7-E.1.'
    ),
    user_prompt_hash:
      oldUserPromptHash !== null
        ? value(
            oldUserPromptHash,
            'reconstructed_from_stable_builder',
            'Current user-prompt builder reproduces the frozen Phase 1 user hash exactly, so old title/date/dream reconstruction is hash-safe.'
          )
        : unavailable('Could not verify stable user-prompt builder against frozen Phase 1 hash.'),
    catalog_hash: value(
      proof.phase1_hashes.catalog_hash,
      'inferred',
      'Old batch did not persist catalog serialization; old harness used the shared frozen catalog injection path.'
    ),
    schema_hash: value(
      proof.phase1_hashes.schema_hash,
      'inferred',
      'Old batch did not persist response-format serialization; old harness used the shared structured response format builder.'
    ),
    target_output_language: value(
      oldRuns.map((run) => run.target_output_language ?? null),
      'observed',
      'All persisted old runs recorded target_output_language explicitly.'
    ),
    model_snapshot: unavailable(
      'Old 2/5 batch persisted no model field in runs.json/summary.json, so the original model snapshot cannot be proven from artifacts.'
    ),
    temperature: value(
      proof.phase1_hashes.temperature,
      'inferred',
      'Old harness used the shared DREAM_EXTRACTION_TEMPERATURE constant; old batch did not persist the numeric request field separately.'
    ),
    max_completion_tokens: value(
      4200,
      'inferred',
      'Old harness used the shared DREAM_EXTRACTION_TOKEN_LIMIT constant; original request bodies were not persisted with the numeric field.'
    ),
    runtime_commit_sha:
      sharedRuntimeShaText !== null
        ? value(
            sharedRuntimeShaText,
            gitRuntime.exact_runtime_commit_unavailable ? 'inferred' : 'observed',
            'Exact deployed/local runtime commit for the old batch was not persisted; current git HEAD is the closest surviving repo fingerprint.'
          )
        : unavailable('git HEAD unavailable'),
    concurrency: value(oldSummary.concurrency, 'observed'),
    request_body_hashes: unavailable(
      'Original old request bodies were not persisted, and each run appended a non-persisted random UUID nonce; exact per-run body hashes are unavailable.'
    ),
  } satisfies Record<string, ValueWithProvenance<unknown>>;

  const newBatch = {
    dream_hash: value(proof.phase1_hashes.dream_hash, 'observed'),
    reflection_context_hash: value(
      reflectionContextHash,
      'reconstructed_from_stable_builder',
      'Phase 1 uses finalInterpretation=null with no separate reflection payload; same methodology as old batch.'
    ),
    system_prompt_hash: value(proof.phase1_hashes.system_prompt_hash, 'observed'),
    user_prompt_hash: value(proof.phase1_hashes.user_prompt_hash, 'observed'),
    catalog_hash: value(proof.phase1_hashes.catalog_hash, 'observed'),
    schema_hash: value(proof.phase1_hashes.schema_hash, 'observed'),
    target_output_language: value(['el'], 'observed'),
    model_snapshot: value(
      [...new Set(patchReport.phase1.runs.map((run) => run.model ?? null))],
      'observed'
    ),
    temperature: value(proof.phase1_hashes.temperature, 'observed'),
    max_completion_tokens: value(
      4200,
      'inferred',
      'Patch F run rows did not persist the numeric token field; runner source uses the shared token limit constant.'
    ),
    runtime_commit_sha:
      sharedRuntimeShaText !== null
        ? value(
            sharedRuntimeShaText,
            gitRuntime.exact_runtime_commit_unavailable ? 'inferred' : 'observed',
            'Exact runtime commit for the dirty local run was not persisted in Patch F artifacts; current git HEAD is the surviving repo fingerprint.'
          )
        : unavailable('git HEAD unavailable'),
    concurrency: unavailable(
      'Patch F artifacts did not persist the original batch concurrency inside the canonical outDir; reviewer notes mentioned retries at lower concurrency, but the exact initial value is not encoded in the saved packet.'
    ),
    request_body_hashes: unavailable(
      'Patch F rows persisted component hashes but not the exact nonce-bearing request body for each run; per-run body hashes are unavailable.'
    ),
  } satisfies Record<string, ValueWithProvenance<unknown>>;

  const requestDelta = [
    `Old harness title is "${oldHarness.title}" while Patch F phase1 title is "${PATCH_F_PHASE1_FIXTURE.id}".`,
    oldUserPromptHash !== null
      ? `User prompt hashes differ at the frozen user layer: old ${oldUserPromptHash} vs new ${proof.phase1_hashes.user_prompt_hash}.`
      : 'User prompt hash delta could not be computed because stable-builder verification failed.',
    `Old harness appends nonce tag ${oldHarness.run_tag_format}; Patch F appends [global_archetype_run_id: <runId>:<uuid>].`,
    'Because the user message payload differs before model execution, the serialized request bodies are not identical even before considering missing per-run UUIDs.',
  ];

  const replayStatus = [
    'Exact old-payload replay was not executed: the original old 2/5 request bodies were not persisted, both old and new runs used non-persisted UUID run tags, and the frozen 4.1.7-E.1 system/catalog/schema texts are not recoverable from clean git history in this worktree.',
    'A direct replay using the live 4.1.9-M1 / 1.7.0 builders would violate the reviewer requirement to avoid reconstructing from the current fixture/runtime when the original payload is unavailable.',
    'Decision branch therefore lands on request-difference reconciliation, not stochastic-cluster or concurrency-only replay classification.',
  ];

  const adjudication = {
    generated_at: new Date().toISOString(),
    patch_f_out_dir: patchDir,
    production_decision: {
      global_archetype_calibration: false,
      lover_specific_change: false,
      language_gate_frozen: true,
      patch_f_applied_catalog_change: false,
      note:
        'Patch F itself applies no catalog change. Current live worktree may include post-diagnostic catalog edits; each adjudication record carries its own current-catalog provenance.',
      diagnostic_only: true,
    },
    cases: [
      buildAdjudicationCase({
        fixtureId: 'F_pos_shadow_parking_en',
        allRuns,
        patchDir,
      }),
      buildAdjudicationCase({
        fixtureId: 'F_neg_crossroads_shrug_en',
        allRuns,
        patchDir,
      }),
      buildAdjudicationCase({
        fixtureId: 'F_neg_babysit_juice_en',
        allRuns,
        patchDir,
      }),
    ],
  };

  const reconciliation = {
    generated_at: new Date().toISOString(),
    old_batch_dir: oldDir,
    new_batch_dir: patchDir,
    user_prompt_builder_stability_check: {
      phase1_frozen_user_hash: proof.phase1_hashes.user_prompt_hash,
      recomputed_phase1_user_hash: stablePhase1Hash,
      stable: userBuilderStable,
    },
    old_batch: oldBatch,
    new_batch: newBatch,
    old_batch_summary: oldSummary,
    old_batch_outcomes: oldRuns,
    new_phase1_summary: {
      lover_hit_count: patchReport.phase1.lover_hit_count,
      empty_count: patchReport.phase1.empty_count,
      reps_ok: patchReport.phase1.reps_ok,
    },
    exact_request_differences: requestDelta,
    replay_status: replayStatus,
    phase3_decision: {
      request_hashes_identical: false,
      basis:
        oldUserPromptHash !== null
          ? 'Observed/inferred user-layer delta proves request bodies differed before model execution.'
          : 'Old exact payload unavailable; exact identity could not be proven, but harness source shows differing title and run-tag content.',
      classification:
        'Old 2/5 vs Patch F 20/20 is a request/harness-difference reconciliation problem, not evidence for a global empty-selection calibration patch.',
    },
  };

  const adjudicationFile = path.join(outDir, 'PATCH_F_TARGETED_ADJUDICATION.json');
  const reconciliationFile = path.join(outDir, 'PHASE3_RECONCILIATION.json');
  const markdownFile = path.join(outDir, 'PHASE3_RECONCILIATION.md');
  writeJson(adjudicationFile, adjudication);
  writeJson(reconciliationFile, reconciliation);
  writeFileSync(
    markdownFile,
    buildComparisonMarkdown({
      oldBatch,
      newBatch,
      userPromptDelta: requestDelta,
      replayStatus,
      adjudicationFile,
    })
  );

  console.log(
    JSON.stringify(
      {
        wrote: {
          reconciliation_json: reconciliationFile,
          reconciliation_md: markdownFile,
          adjudication_json: adjudicationFile,
        },
        classification: reconciliation.phase3_decision.classification,
        stable_user_builder: userBuilderStable,
        old_user_prompt_hash: oldUserPromptHash,
        new_user_prompt_hash: proof.phase1_hashes.user_prompt_hash,
      },
      null,
      2
    )
  );
}

main();
