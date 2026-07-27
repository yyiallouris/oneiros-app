/**
 * Phase 0 diagnostics for v4.1.1 — NO prompt/catalog/validator behavior changes.
 *
 * Builds targeted artifacts:
 * - Fisherman target T1–T5 (fresh extracts, full archetype stages)
 * - C1 Orpheus + C5 Inanna from latest acceptance suite (replay validator stages)
 * - prompt-facing defs + validator rules for key archetypes
 * - myth source + compact rows for Orpheus/Inanna
 * - catalog gap confirmation + token/cost metrics
 *
 * Output: tmp/phase0-v411-diagnostics-<stamp>/
 */
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { createRequire } from 'module';
import {
  buildDreamExtractionSystemPrompt,
  buildDreamExtractionUserPrompt,
  DREAM_EXTRACTION_PROMPT_ID,
  DREAM_EXTRACTION_PROMPT_VERSION,
  DREAM_EXTRACTION_SCHEMA_VERSION,
  DREAM_EXTRACTION_TEMPERATURE,
  DREAM_EXTRACTION_TOKEN_LIMIT,
} from '../src/ai/dreamExtractionPrompt';
import {
  formatArchetypeCatalogForPromptV1,
  getArchetypeDefinitionV1,
} from '../src/ai/catalogs/archetypeCatalog.v1';
import {
  MYTHIC_CATALOG_VERSION,
  getMythicCatalogEntry,
  listMythicCatalogIds,
} from '../src/ai/catalogs/mythicNarrativeCatalog';
import {
  MYTHIC_PROMPT_INDEX as PROMPT_INDEX,
  MYTHIC_PROMPT_INDEX_TOKEN_COUNT,
} from '../src/ai/catalogs/mythicPromptIndex';
import { normalizeArchetypalEchoes } from '../src/ai/archetypalEchoes';
import { validateStructuredTaskContent } from '../src/ai/structuredTaskValidation';
import {
  asArchetypeEvaluation,
  toPersistedArchetypalEcho,
  validateArchetypalEchoes,
} from '../src/ai/validators/archetypalEchoValidator';
import { estimateAiCallCost } from '../src/billing/aiPricing';

function getEnv(keys: string[]): string {
  for (const key of keys) {
    const v = process.env[key];
    if (typeof v === 'string' && v.trim()) return v.trim();
  }
  return '';
}

function parseJson(content: string): Record<string, unknown> {
  const trimmed = content.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  return JSON.parse(fenced?.[1]?.trim() || trimmed) as Record<string, unknown>;
}

function loadJson(file: string): Record<string, unknown> {
  return JSON.parse(readFileSync(file, 'utf8')) as Record<string, unknown>;
}

function latestAcceptanceDir(): string {
  const tmp = path.join(process.cwd(), 'tmp');
  const dirs = readdirSync(tmp)
    .filter((name) => name.startsWith('5-dream-acceptance-'))
    .sort()
    .reverse();
  if (!dirs[0]) throw new Error('No 5-dream-acceptance dir found');
  return path.join(tmp, dirs[0]);
}

function buildArchetypeStages(rawArchetypes: unknown) {
  const raw = Array.isArray(rawArchetypes) ? rawArchetypes : [];
  const parsed = validateStructuredTaskContent(
    'dream_extraction',
    JSON.stringify({ symbols: ['x'], archetypes: raw, amplifications: [] })
  );
  const parsedArchetypes =
    parsed.ok && parsed.data && typeof parsed.data === 'object'
      ? (parsed.data as { archetypes?: unknown }).archetypes ?? []
      : raw;

  const normalized = normalizeArchetypalEchoes(parsedArchetypes, 2);
  const withEval = (Array.isArray(parsedArchetypes) ? parsedArchetypes : []).map((row, i) => {
    const base = normalized[i] ?? normalizeArchetypalEchoes([row], 1)[0];
    if (!base) return null;
    const evaluation =
      row && typeof row === 'object'
        ? asArchetypeEvaluation((row as { evaluation?: unknown }).evaluation)
        : null;
    return evaluation ? { ...base, evaluation } : base;
  }).filter(Boolean) as Array<ReturnType<typeof normalizeArchetypalEchoes>[number] & { evaluation?: unknown }>;

  // Prefer preserving all raw rows for validator decisions (index-aligned).
  const forValidation = (Array.isArray(raw) ? raw : []).map((row) => {
    const normalizedOne = normalizeArchetypalEchoes([row], 1)[0];
    if (!normalizedOne) {
      return {
        canonical_label: typeof (row as { canonical_label?: string })?.canonical_label === 'string'
          ? String((row as { canonical_label: string }).canonical_label)
          : '',
        expression: '',
        resonance: '',
        evidence: [],
        evaluation:
          row && typeof row === 'object'
            ? asArchetypeEvaluation((row as { evaluation?: unknown }).evaluation)
            : null,
      };
    }
    const evaluation =
      row && typeof row === 'object'
        ? asArchetypeEvaluation((row as { evaluation?: unknown }).evaluation)
        : null;
    return evaluation ? { ...normalizedOne, evaluation } : normalizedOne;
  });

  const validation = validateArchetypalEchoes(forValidation as never, { max: 2 });
  const decisions = forValidation.map((echo) => {
    const rejected = validation.rejected.find(
      (r) => r.echo.canonical_label === echo.canonical_label && r.echo.expression === echo.expression
    );
    const accepted = validation.accepted.some(
      (a) => a.canonical_label === echo.canonical_label && a.expression === echo.expression
    );
    return {
      canonical_label: echo.canonical_label,
      accepted,
      rejection_codes: rejected ? [rejected.reason] : [],
      rejection_reason: rejected?.reason ?? null,
      had_evaluation: Boolean((echo as { evaluation?: unknown }).evaluation),
    };
  });

  // Also mark raw labels never seen after normalize
  for (const row of raw) {
    if (!row || typeof row !== 'object') continue;
    const label =
      typeof (row as { canonical_label?: unknown }).canonical_label === 'string'
        ? String((row as { canonical_label: string }).canonical_label)
        : '';
    if (!label) continue;
    if (!decisions.some((d) => d.canonical_label === label)) {
      decisions.push({
        canonical_label: label,
        accepted: false,
        rejection_codes: ['lost_before_or_during_normalize'],
        rejection_reason: 'lost_before_or_during_normalize',
        had_evaluation: false,
      });
    }
  }

  return {
    raw_archetypes: raw,
    parsed_archetypes: parsedArchetypes,
    normalized_archetypes: normalized,
    validator_decisions: decisions,
    post_validation_archetypes: validation.accepted.map(toPersistedArchetypalEcho),
    validator_rejected: validation.rejected.map((r) => ({
      canonical_label: r.echo.canonical_label,
      reason: r.reason,
    })),
  };
}

function compactLineForId(catalogId: string): string | null {
  const lines = PROMPT_INDEX.split('\n');
  return lines.find((line) => line.startsWith(`[${catalogId}]`)) ?? null;
}

function promptFacingDefs(labels: string[]) {
  const injected = formatArchetypeCatalogForPromptV1();
  const out: Record<string, unknown> = {};
  for (const label of labels) {
    const def = getArchetypeDefinitionV1(label);
    const blockMatch = injected.match(
      new RegExp(
        `- ${label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\n(?:  .+\\n?)*`,
        'm'
      )
    );
    out[label] = {
      prompt_facing_block: blockMatch?.[0]?.trim() ?? null,
      catalog_record: def
        ? {
            id: def.id,
            canonicalLabel: def.canonicalLabel,
            displayLabel: def.displayLabel,
            kind: def.kind,
            coreFunction: def.coreFunction,
            selectWhen: def.selectWhen,
            insufficientWhen: def.insufficientWhen,
            competingLabels: def.competingLabels,
            selectableAsEcho: def.selectableAsEcho !== false,
          }
        : null,
    };
  }
  return out;
}

function currentValidatorRules() {
  return {
    note:
      'Hard gates apply ONLY when evaluation signals are present. Missing evaluation does NOT reject.',
    hard_gate_ids: [
      'double',
      'guide_psychopomp',
      'divine_child',
      'terrible_mother',
      'ruler',
    ],
    rules: {
      Trickster: {
        hard_gate: false,
        server_rule: 'whitelist + richness only; no Trickster-specific hard gate',
      },
      'Guide / Psychopomp': {
        hard_gate: true,
        server_rule:
          'If evaluation present: reject when actualCrossing===false OR activeInMainAction===false',
      },
      Lover: {
        hard_gate: false,
        server_rule: 'whitelist + richness only; no Lover-specific hard gate',
      },
      Persona: {
        hard_gate: false,
        server_rule: 'whitelist + richness only; no Persona-specific hard gate',
      },
      'Death–Rebirth': {
        hard_gate: false,
        server_rule: 'whitelist + richness only; no Death–Rebirth-specific hard gate',
      },
      'Terrible Mother': {
        hard_gate: true,
        server_rule:
          'If evaluation present: reject when maternalFunction===false OR engulfingOrPossessiveDynamic===false. Missing evaluation → accept.',
      },
      'Wise Old Woman': {
        hard_gate: false,
        server_rule: 'whitelist + richness only; no WOW-specific hard gate',
      },
      'Wise Old Man': {
        hard_gate: false,
        server_rule: 'whitelist + richness only; no WOM-specific hard gate',
      },
      Hero: {
        hard_gate: false,
        server_rule: 'whitelist + richness only; no Hero-specific hard gate',
      },
    },
  };
}

async function mapPool<T, R>(
  items: T[],
  concurrency: number,
  worker: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = [];
  let i = 0;
  async function run() {
    while (i < items.length) {
      const idx = i++;
      results[idx] = await worker(items[idx]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, () => run()));
  return results;
}

async function main() {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outDir = path.join(process.cwd(), 'tmp', `phase0-v411-diagnostics-${stamp}`);
  mkdirSync(outDir, { recursive: true });

  const labels = [
    'Trickster',
    'Guide / Psychopomp',
    'Lover',
    'Persona',
    'Death–Rebirth',
    'Terrible Mother',
    'Wise Old Woman',
    'Wise Old Man',
    'Hero',
  ];

  // --- Fisherman fresh runs (full stages) ---
  const fishermanDream = loadJson(
    path.join(process.cwd(), 'tmp/v4.1.0-closed-myth-benchmark/dreams_used.json')
  );
  const target = fishermanDream.target as { id: string; title: string; date: string; content: string };

  const supabaseUrl = getEnv(['EXPO_PUBLIC_SUPABASE_URL', 'SUPABASE_URL']).replace(/\/$/, '');
  const anon = getEnv(['EXPO_PUBLIC_SUPABASE_ANON_KEY', 'SUPABASE_ANON_KEY']);
  const endpoint = getEnv(['EXPO_PUBLIC_CUSTOM_GPT_ENDPOINT', 'CUSTOM_GPT_ENDPOINT']);
  const email = getEnv(['LIVE_SUPABASE_EMAIL']);
  const password = getEnv(['LIVE_SUPABASE_PASSWORD']);
  let token = getEnv(['LIVE_SUPABASE_ACCESS_TOKEN', 'SUPABASE_ACCESS_TOKEN']);
  if (!supabaseUrl || !anon || !endpoint) throw new Error('Missing supabase/proxy env');
  if (!token) {
    if (!email || !password) throw new Error('Missing LIVE_SUPABASE_EMAIL/PASSWORD');
    const res = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: anon },
      body: JSON.stringify({ email, password }),
    });
    const text = await res.text();
    if (!res.ok) throw new Error(`auth failed ${res.status}: ${text.slice(0, 300)}`);
    token = (JSON.parse(text) as { access_token?: string }).access_token || '';
    if (!token) throw new Error('no access token');
  }

  const system = buildDreamExtractionSystemPrompt();
  const fishermanJobs = [1, 2, 3, 4, 5].map((n) => ({ n, bust: randomUUID() }));

  console.log(JSON.stringify({ stage: 'fisherman_start', runs: 5, outDir }));

  const fishermanRuns = await mapPool(fishermanJobs, 5, async (job) => {
    const user = buildDreamExtractionUserPrompt({
      title: target.title,
      date: target.date,
      content: target.content,
      finalInterpretation: null,
      debugInterpretiveEchoes: false,
    });
    const started = Date.now();
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: anon,
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        task: 'dream_extraction',
        model: 'gpt-5.4-mini',
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: `${user}\n\n[phase0_run_id: ${job.bust}]` },
        ],
        temperature: DREAM_EXTRACTION_TEMPERATURE,
        max_completion_tokens: DREAM_EXTRACTION_TOKEN_LIMIT,
        max_tokens: DREAM_EXTRACTION_TOKEN_LIMIT,
        response_format: { type: 'json_object' },
      }),
    });
    const text = await res.text();
    const latency_ms = Date.now() - started;
    if (!res.ok) {
      return {
        run_id: `fisherman_T${job.n}`,
        error: `proxy ${res.status}: ${text.slice(0, 400)}`,
        latency_ms,
      };
    }
    const body = JSON.parse(text) as Record<string, unknown>;
    const content =
      (body.choices as Array<{ message?: { content?: string } }> | undefined)?.[0]?.message
        ?.content ?? '';
    const rawParsed = parseJson(String(content));
    const stages = buildArchetypeStages(rawParsed.archetypes);
    const cost =
      body.ai_call_cost && typeof body.ai_call_cost === 'object'
        ? body.ai_call_cost
        : estimateAiCallCost(body, 'openai');
    const packet = {
      run_id: `fisherman_T${job.n}`,
      dream_id: target.id,
      model: body.model ?? null,
      latency_ms,
      cost,
      raw_amplifications: rawParsed.amplifications ?? [],
      ...stages,
    };
    writeFileSync(path.join(outDir, `${packet.run_id}.json`), JSON.stringify(packet, null, 2));
    console.log(
      JSON.stringify({
        run_id: packet.run_id,
        latency_ms,
        estimatedUsd: (cost as { estimatedUsd?: number }).estimatedUsd ?? null,
        raw: stages.raw_archetypes,
        post: stages.post_validation_archetypes.map((a) => a.canonical_label),
        decisions: stages.validator_decisions,
      })
    );
    return packet;
  });

  // --- Replay C1 / C5 from acceptance suite ---
  const acceptanceDir = latestAcceptanceDir();
  const c1c5: Record<string, unknown>[] = [];
  for (const name of [
    'C1_two_archetypes_plus_myth_r1.json',
    'C1_two_archetypes_plus_myth_r2.json',
    'C1_two_archetypes_plus_myth_r3.json',
    'C5_one_archetype_plus_myth_r1.json',
    'C5_one_archetype_plus_myth_r2.json',
    'C5_one_archetype_plus_myth_r3.json',
  ]) {
    const src = loadJson(path.join(acceptanceDir, name));
    const stages = buildArchetypeStages(src.raw_archetypes);
    const packet = {
      run_id: String(src.run || name.replace(/\.json$/, '')),
      source_file: path.join(acceptanceDir, name),
      case_id: src.case_id ?? null,
      model: src.model ?? null,
      latency_ms: src.latency_ms ?? null,
      cost: src.cost ?? null,
      raw_amplifications: src.raw_amplifications ?? [],
      post_validation_amplifications: src.post_validation_amplifications ?? [],
      ...stages,
      note:
        'Replayed from saved acceptance raw_archetypes through current normalize/validator (no new model call).',
    };
    writeFileSync(path.join(outDir, `${packet.run_id}.stages.json`), JSON.stringify(packet, null, 2));
    c1c5.push(packet);
  }

  // --- Myth records ---
  const fullCatalog = JSON.parse(
    readFileSync(path.join(process.cwd(), 'src/ai/catalogs/mythic_narrative_catalog.v1.json'), 'utf8')
  ) as { version?: string; entries: Array<Record<string, unknown>> };
  const byId = Object.fromEntries(fullCatalog.entries.map((e) => [String(e.id), e]));

  const mythPack = {
    greek_orpheus_eurydice: {
      full_source_record: byId['greek.orpheus_eurydice'] ?? null,
      compact_prompt_record: compactLineForId('greek.orpheus_eurydice'),
      runtime_entry: getMythicCatalogEntry('greek.orpheus_eurydice'),
    },
    sumerian_inanna_descent: {
      full_source_record: byId['sumerian.inanna_descent'] ?? null,
      compact_prompt_record: compactLineForId('sumerian.inanna_descent'),
      runtime_entry: getMythicCatalogEntry('sumerian.inanna_descent'),
    },
    missing_confirmed: {
      'arabian.fisherman_and_jinni': !listMythicCatalogIds().includes('arabian.fisherman_and_jinni'),
      'greek.sisyphus': !listMythicCatalogIds().includes('greek.sisyphus'),
    },
  };

  // --- Tokens ---
  const require = createRequire(path.join(process.cwd(), 'package.json'));
  let encode: ((s: string) => number[]) | null = null;
  try {
    encode = (require('/tmp/tok/node_modules/gpt-tokenizer') as { encode: (s: string) => number[] })
      .encode;
  } catch {
    encode = null;
  }
  const archetypePrompt = formatArchetypeCatalogForPromptV1();
  const archetypePromptTokens = encode
    ? encode(archetypePrompt).length
    : Math.ceil(archetypePrompt.length / 4.2);
  const mythIndexTokens = MYTHIC_PROMPT_INDEX_TOKEN_COUNT;
  const totalSystemPromptTokens = encode
    ? encode(system).length
    : Math.ceil(system.length / 4.2);

  const costSamples = [
    ...fishermanRuns.filter((r) => !('error' in r && r.error)),
    ...c1c5,
  ] as Array<{ cost?: { estimatedUsd?: number; inputTokens?: number; outputTokens?: number }; latency_ms?: number }>;

  const avg = (vals: number[]) =>
    vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;

  const metrics = {
    prompt_version: DREAM_EXTRACTION_PROMPT_VERSION,
    prompt_id: DREAM_EXTRACTION_PROMPT_ID,
    schema_version: DREAM_EXTRACTION_SCHEMA_VERSION,
    catalog_version: MYTHIC_CATALOG_VERSION,
    model: 'gpt-5.4-mini',
    temperature: DREAM_EXTRACTION_TEMPERATURE,
    archetype_prompt_tokens: archetypePromptTokens,
    myth_index_tokens: mythIndexTokens,
    total_system_prompt_tokens: totalSystemPromptTokens,
    average_input_tokens: Number(
      avg(costSamples.map((r) => Number(r.cost?.inputTokens || 0)).filter(Boolean)).toFixed(1)
    ),
    average_output_tokens: Number(
      avg(costSamples.map((r) => Number(r.cost?.outputTokens || 0)).filter(Boolean)).toFixed(1)
    ),
    average_cost_usd: Number(
      avg(costSamples.map((r) => Number(r.cost?.estimatedUsd || 0)).filter(Boolean)).toFixed(6)
    ),
    average_latency_ms: Math.round(
      avg(costSamples.map((r) => Number(r.latency_ms || 0)).filter(Boolean))
    ),
    fisherman_fresh_total_usd: Number(
      fishermanRuns
        .reduce((s, r) => s + Number((r as { cost?: { estimatedUsd?: number } }).cost?.estimatedUsd || 0), 0)
        .toFixed(6)
    ),
  };

  const packageOut = {
    phase: '0',
    no_behavior_change: true,
    out_dir: outDir,
    acceptance_source_dir: acceptanceDir,
    archetype_prompt_facing_definitions: promptFacingDefs(labels),
    archetype_validator_rules: currentValidatorRules(),
    myth_pack: mythPack,
    metrics,
    fisherman_runs: fishermanRuns,
    c1_orpheus_runs: c1c5.filter((p) => String(p.run_id).startsWith('C1_')),
    c5_inanna_runs: c1c5.filter((p) => String(p.run_id).startsWith('C5_')),
    reading_notes: [
      'If Trickster is absent from raw_archetypes → model never selected it.',
      'If present in raw but missing from normalized → coerce/normalize loss.',
      'If present in normalized but rejected in validator_decisions → hard-gate/whitelist/max.',
      'Terrible Mother currently hard-gates ONLY when evaluation is present; missing evaluation accepts.',
      'Trickster / Lover / Death–Rebirth / Hero / Wise Old * currently have NO server hard gates.',
      'arabian.fisherman_and_jinni and greek.sisyphus are confirmed missing from catalog v1.',
    ],
  };

  writeFileSync(path.join(outDir, 'PHASE0_PACKAGE.json'), JSON.stringify(packageOut, null, 2));
  writeFileSync(path.join(outDir, 'metrics.json'), JSON.stringify(metrics, null, 2));
  writeFileSync(path.join(outDir, 'myth_pack.json'), JSON.stringify(mythPack, null, 2));
  writeFileSync(
    path.join(outDir, 'archetype_defs_and_validator_rules.json'),
    JSON.stringify(
      {
        prompt_facing: packageOut.archetype_prompt_facing_definitions,
        validator_rules: packageOut.archetype_validator_rules,
      },
      null,
      2
    )
  );

  console.log('\n=== PHASE 0 PACKAGE READY ===');
  console.log(JSON.stringify({ outDir, metrics, missing: mythPack.missing_confirmed }, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
