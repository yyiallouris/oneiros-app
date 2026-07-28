import { execSync } from 'child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
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
  resolveDreamOutputLanguage,
  runOutputLanguageCommitGate,
  type DreamOutputLanguage,
  validateLanguageRepairFieldMap,
} from '../src/ai/dreamOutputLanguage';
import { buildDreamExtractionResponseFormat } from '../src/ai/dreamExtractionResponseFormat';
import { ARCHETYPE_CATALOG_VERSION } from '../src/ai/catalogs/archetypeCatalog.v1';
import { validateStructuredTaskContent } from '../src/ai/structuredTaskValidation';
import { estimateAiCallCost } from '../src/billing/aiPricing';
import {
  mapPool,
  rateLimitBackoffMs,
} from '../scripts/lib/globalArchetypeBenchmarkRunner';
import { classifyProxyError } from '../scripts/lib/globalArchetypeModelRouting';
import { buildEchoBenchmarkStages } from '../scripts/lib/echoBenchmarkStages';
import {
  PATCH_F_PHASE1_FIXTURE,
  PATCH_F_PHASE2_FIXTURES,
  SEA_MATTRESS_EL_DREAM,
  type PatchFFixture,
} from '../scripts/lib/patchFStabilityFixtures';

type Fixture = {
  id: string;
  label: string;
  category:
    | 'sea_mattress'
    | 'lover_positive_harmonious'
    | 'lover_positive_longing'
    | 'lover_negative_incidental_partner'
    | 'lover_negative_non_romantic'
    | 'lover_negative_romance_cue_only'
    | 'mother_positive'
    | 'father_positive'
    | 'divine_child_positive'
    | 'no_tension_complementarity'
    | 'genuine_spatial_conflict'
    | 'persona_conflict'
    | 'ordinary_kitchen';
  dream_language: 'en' | 'el';
  reps: number;
  dream: string;
  required_archetype_ids: string[];
  forbidden_archetype_ids?: string[];
  expected_central_conflicts?: string[];
  expected_main_tension?: string | null;
  notes: string;
};

type RunRecord = {
  fixture_id: string;
  fixture_label: string;
  category: Fixture['category'];
  raw_dream: string;
  run_id: string;
  ok: boolean;
  latency_ms: number;
  model: string | null;
  error?: string;
  error_type?: string;
  prompt_id: string;
  prompt_version: string;
  schema_version: number;
  archetype_catalog_version: string;
  myth_catalog_version: string;
  target_language: DreamOutputLanguage;
  cost_usd: number | null;
  raw_archetypes: unknown[];
  validator_decisions: unknown[];
  post_validation_archetypes: unknown[];
  archetype_reject_reasons: unknown[];
  central_conflicts: string[];
  main_tension: string | null;
  core_mode: string | null;
  raw_amplifications: unknown[];
  post_validation_amplifications: unknown[];
  mythic_reject_reasons: unknown[];
  interpretive_diagnostics: unknown;
  display_distillation: unknown;
  raw_parsed: Record<string, unknown>;
};

function loadDotenvValue(key: string): string | undefined {
  const envPath = path.join(process.cwd(), '.env');
  try {
    const raw = readFileSync(envPath, 'utf8');
    const match = raw.match(new RegExp(`^${key}\\s*=\\s*(.*)$`, 'm'));
    if (!match) return undefined;
    return match[1].trim().replace(/^['"]|['"]$/g, '');
  } catch {
    return undefined;
  }
}

function getEnv(keys: string[]): string {
  for (const key of keys) {
    const value = process.env[key] ?? loadDotenvValue(key);
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function loadBenchmarkFixture(id: string): Record<string, unknown> {
  const file = path.join(process.cwd(), 'docs/ONEIROS_GLOBAL_ARCHETYPE_BENCHMARK.jsonl');
  const rows = readFileSync(file, 'utf8')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line) as Record<string, unknown>);
  const found = rows.find((row) => row.id === id);
  if (!found) throw new Error(`benchmark fixture not found: ${id}`);
  return found;
}

function patchFFixture(id: string): PatchFFixture {
  const found = [PATCH_F_PHASE1_FIXTURE, ...PATCH_F_PHASE2_FIXTURES].find((fixture) => fixture.id === id);
  if (!found) throw new Error(`patchF fixture not found: ${id}`);
  return found;
}

function buildFixtures(): Fixture[] {
  const rain = patchFFixture('F_pos_lover_bench_rain_en');
  const partnerLogistics = patchFFixture('F_neg_partner_logistics_en');
  const warmFriends = patchFFixture('F_neg_warm_friends_en');
  const romanceCue = patchFFixture('F_neg_romance_cue_only_en');
  const motherKitchen = patchFFixture('F_pos_mother_kitchen_en');
  const personaStage = patchFFixture('F_pos_persona_stage_suit_el');
  const kitchen = patchFFixture('F_neg_kitchen_glass_el');
  const complementarity = patchFFixture('F_neg_surface_depth_harmony_el');
  const spatialConflict = patchFFixture('F_neg_spatial_conflict_control_el');
  const harmoniousLover = patchFFixture('F_pos_lover_shared_depth_en');
  const divineChild = loadBenchmarkFixture('P_divine_child_a');

  return [
    {
      id: 'sea_mattress_el',
      label: 'Exact Greek sea-mattress',
      category: 'sea_mattress',
      dream_language: 'el',
      reps: 5,
      dream: SEA_MATTRESS_EL_DREAM,
      required_archetype_ids: ['lover'],
      forbidden_archetype_ids: ['anima', 'animus', 'guide_psychopomp', 'sacred_marriage'],
      expected_central_conflicts: [],
      expected_main_tension: null,
      notes: 'Exact regression fixture from reviewer packet.',
    },
    {
      id: harmoniousLover.id,
      label: 'Harmonious Lover positive',
      category: 'lover_positive_harmonious',
      dream_language: harmoniousLover.dream_language,
      reps: 3,
      dream: harmoniousLover.dream,
      required_archetype_ids: ['lover'],
      forbidden_archetype_ids: ['anima', 'animus', 'sacred_marriage'],
      expected_central_conflicts: harmoniousLover.expected_central_conflicts,
      expected_main_tension: harmoniousLover.expected_main_tension,
      notes: harmoniousLover.notes,
    },
    {
      id: rain.id,
      label: 'Longing/separation Lover positive',
      category: 'lover_positive_longing',
      dream_language: rain.dream_language,
      reps: 3,
      dream: rain.dream,
      required_archetype_ids: ['lover'],
      forbidden_archetype_ids: ['persona', 'anima', 'animus', 'sacred_marriage'],
      expected_central_conflicts: [],
      expected_main_tension: null,
      notes: rain.notes,
    },
    {
      id: partnerLogistics.id,
      label: 'Incidental-partner negative',
      category: 'lover_negative_incidental_partner',
      dream_language: partnerLogistics.dream_language,
      reps: 3,
      dream: partnerLogistics.dream,
      required_archetype_ids: [],
      forbidden_archetype_ids: ['lover'],
      expected_central_conflicts: [],
      expected_main_tension: null,
      notes: partnerLogistics.notes,
    },
    {
      id: warmFriends.id,
      label: 'Close non-romantic companionship negative',
      category: 'lover_negative_non_romantic',
      dream_language: warmFriends.dream_language,
      reps: 3,
      dream: warmFriends.dream,
      required_archetype_ids: [],
      forbidden_archetype_ids: ['lover'],
      expected_central_conflicts: [],
      expected_main_tension: null,
      notes: warmFriends.notes,
    },
    {
      id: romanceCue.id,
      label: 'Romance-cue-only negative',
      category: 'lover_negative_romance_cue_only',
      dream_language: romanceCue.dream_language,
      reps: 3,
      dream: romanceCue.dream,
      required_archetype_ids: [],
      forbidden_archetype_ids: ['lover'],
      notes: romanceCue.notes,
    },
    {
      id: motherKitchen.id,
      label: 'Calm Mother positive',
      category: 'mother_positive',
      dream_language: motherKitchen.dream_language,
      reps: 3,
      dream: motherKitchen.dream,
      required_archetype_ids: ['mother'],
      notes: motherKitchen.notes,
    },
    {
      id: 'm21_calm_father_en',
      label: 'Calm Father positive',
      category: 'father_positive',
      dream_language: 'en',
      reps: 3,
      dream:
        'At dusk my father stands at the garden gate and quietly tells me which tools must come inside before the rain. He does not raise his voice. As I follow his calm instruction, the whole yard feels ordered and protected, and even the wind seems to fall into place around that steady authority.',
      required_archetype_ids: ['father'],
      notes: 'Protective paternal order without aggression or dramatic conflict.',
    },
    {
      id: String(divineChild.id),
      label: 'Quiet Divine Child positive',
      category: 'divine_child_positive',
      dream_language: String(divineChild.dream_language) as 'en' | 'el',
      reps: 3,
      dream: String(divineChild.dream),
      required_archetype_ids: ['divine_child'],
      notes: 'Existing benchmark Divine Child fixture with calm luminous center.',
    },
    {
      id: complementarity.id,
      label: 'No-tension complementarity',
      category: 'no_tension_complementarity',
      dream_language: complementarity.dream_language,
      reps: 3,
      dream: complementarity.dream,
      required_archetype_ids: [],
      expected_central_conflicts: [],
      expected_main_tension: null,
      notes: complementarity.notes,
    },
    {
      id: spatialConflict.id,
      label: 'Genuine spatial-conflict positive',
      category: 'genuine_spatial_conflict',
      dream_language: spatialConflict.dream_language,
      reps: 3,
      dream: spatialConflict.dream,
      required_archetype_ids: [],
      expected_central_conflicts: spatialConflict.expected_central_conflicts,
      expected_main_tension: spatialConflict.expected_main_tension,
      notes: spatialConflict.notes,
    },
    {
      id: personaStage.id,
      label: 'Persona staged-conflict positive',
      category: 'persona_conflict',
      dream_language: personaStage.dream_language,
      reps: 3,
      dream: personaStage.dream,
      required_archetype_ids: ['persona'],
      notes: personaStage.notes,
    },
    {
      id: kitchen.id,
      label: 'Ordinary-kitchen no-conflict',
      category: 'ordinary_kitchen',
      dream_language: kitchen.dream_language,
      reps: 3,
      dream: kitchen.dream,
      required_archetype_ids: [],
      expected_central_conflicts: [],
      expected_main_tension: null,
      notes: kitchen.notes,
    },
  ];
}

async function authToken(): Promise<{ anon: string; endpoint: string; token: string }> {
  const supabaseUrl = getEnv(['EXPO_PUBLIC_SUPABASE_URL']).replace(/\/$/, '');
  const anon = getEnv(['EXPO_PUBLIC_SUPABASE_ANON_KEY']);
  const endpoint = getEnv(['EXPO_PUBLIC_CUSTOM_GPT_ENDPOINT']);
  let token = getEnv(['LIVE_SUPABASE_ACCESS_TOKEN']);
  if (!token) {
    const email = getEnv(['LIVE_SUPABASE_EMAIL']);
    const password = getEnv(['LIVE_SUPABASE_PASSWORD']);
    const res = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: anon },
      body: JSON.stringify({ email, password }),
    });
    const text = await res.text();
    if (!res.ok) throw new Error(`auth ${res.status}: ${text.slice(0, 300)}`);
    token = (JSON.parse(text) as { access_token?: string }).access_token || '';
  }
  if (!endpoint || !anon || !token) {
    throw new Error('Missing EXPO_PUBLIC_CUSTOM_GPT_ENDPOINT / anon / token');
  }
  return { anon, endpoint, token };
}

function parseJson(content: string): Record<string, unknown> {
  const trimmed = content.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  return JSON.parse((fenced?.[1]?.trim() || trimmed) as string) as Record<string, unknown>;
}

function toApproxTokens(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

function computePromptDeltaVsHead(): {
  current_system_prompt_tokens_approx: number;
  head_system_prompt_tokens_approx: number | null;
  delta_tokens_approx: number | null;
  method: string;
} {
  const current = buildDreamExtractionSystemPrompt();
  const currentTokens = toApproxTokens(current);
  try {
    const head = execSync("git show HEAD:src/ai/dreamExtractionPrompt.ts", {
      cwd: process.cwd(),
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
      maxBuffer: 5 * 1024 * 1024,
    });
    const roughBlockMatches = head.match(/return `([\s\S]*?)`;/);
    if (!roughBlockMatches?.[1]) {
      return {
        current_system_prompt_tokens_approx: currentTokens,
        head_system_prompt_tokens_approx: null,
        delta_tokens_approx: null,
        method: 'current prompt exact build, HEAD prompt unavailable for exact reconstruction',
      };
    }
    const headApprox = toApproxTokens(roughBlockMatches[1]);
    return {
      current_system_prompt_tokens_approx: currentTokens,
      head_system_prompt_tokens_approx: headApprox,
      delta_tokens_approx: currentTokens - headApprox,
      method: 'approximate whitespace-token comparison between current built prompt and HEAD template literal',
    };
  } catch {
    return {
      current_system_prompt_tokens_approx: currentTokens,
      head_system_prompt_tokens_approx: null,
      delta_tokens_approx: null,
      method: 'current prompt exact build only; HEAD comparison unavailable',
    };
  }
}

async function extractFixture(params: {
  fixture: Fixture;
  runId: string;
  endpoint: string;
  anon: string;
  token: string;
}): Promise<RunRecord> {
  const targetOutputLanguage = resolveDreamOutputLanguage(
    params.fixture.dream,
    params.fixture.dream_language
  );
  const system = buildDreamExtractionSystemPrompt();
  const user = buildDreamExtractionUserPrompt({
    title: params.fixture.id,
    date: '2026-07-28',
    content: params.fixture.dream,
    finalInterpretation: null,
    debugInterpretiveEchoes: true,
    dreamLanguage: params.fixture.dream_language,
    targetOutputLanguage,
  });

  let lastError: { error: string; error_type: string; latency_ms: number } | null = null;
  for (let attempt = 1; attempt <= 6; attempt += 1) {
    const started = Date.now();
    const res = await fetch(params.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: params.anon,
        Authorization: `Bearer ${params.token}`,
      },
      body: JSON.stringify({
        task: 'dream_extraction',
        model: 'gpt-5.4-mini',
        disable_anthropic_fallback: true,
        messages: [
          { role: 'system', content: system },
          {
            role: 'user',
            content: `${user}\n\n[m21_broad_regression_run_id:${params.runId}:${randomUUID()}]`,
          },
        ],
        temperature: DREAM_EXTRACTION_TEMPERATURE,
        max_completion_tokens: DREAM_EXTRACTION_TOKEN_LIMIT,
        max_tokens: DREAM_EXTRACTION_TOKEN_LIMIT,
        response_format: buildDreamExtractionResponseFormat(),
      }),
    });
    const text = await res.text();
    const latency_ms = Date.now() - started;

    if (!res.ok) {
      const error_type = classifyProxyError(`proxy ${res.status}: ${text}`);
      lastError = {
        error: `proxy ${res.status}: ${text.slice(0, 500)}`,
        error_type,
        latency_ms,
      };
      if (attempt < 6 && (res.status === 429 || res.status >= 500)) {
        await sleep(rateLimitBackoffMs(attempt, res.status));
        continue;
      }
      return {
        fixture_id: params.fixture.id,
        fixture_label: params.fixture.label,
        category: params.fixture.category,
        raw_dream: params.fixture.dream,
        run_id: params.runId,
        ok: false,
        latency_ms,
        model: null,
        error: lastError.error,
        error_type: lastError.error_type,
        prompt_id: DREAM_EXTRACTION_PROMPT_ID,
        prompt_version: DREAM_EXTRACTION_PROMPT_VERSION,
        schema_version: DREAM_EXTRACTION_SCHEMA_VERSION,
        archetype_catalog_version: ARCHETYPE_CATALOG_VERSION,
        myth_catalog_version: '1.2.0',
        target_language: targetOutputLanguage,
        cost_usd: null,
        raw_archetypes: [],
        validator_decisions: [],
        post_validation_archetypes: [],
        archetype_reject_reasons: [],
        central_conflicts: [],
        main_tension: null,
        core_mode: null,
        raw_amplifications: [],
        post_validation_amplifications: [],
        mythic_reject_reasons: [],
        interpretive_diagnostics: null,
        display_distillation: null,
        raw_parsed: {},
      };
    }

    const body = JSON.parse(text) as Record<string, unknown>;
    const content =
      (body.choices as Array<{ message?: { content?: string } }> | undefined)?.[0]?.message
        ?.content ??
      (typeof body.content === 'string' ? body.content : '') ??
      '';
    const model =
      typeof body.model === 'string'
        ? body.model
        : typeof (body as { model_used?: unknown }).model_used === 'string'
          ? String((body as { model_used: string }).model_used)
          : 'gpt-5.4-mini';
    const usage = (body.usage ?? body.cost) as Record<string, unknown> | undefined;
    const estimated = estimateAiCallCost(
      {
        model,
        usage: usage
          ? ({
              prompt_tokens: Number(usage.prompt_tokens ?? usage.input_tokens ?? 0) || 0,
              completion_tokens: Number(usage.completion_tokens ?? usage.output_tokens ?? 0) || 0,
              prompt_tokens_details: {
                cached_tokens:
                  Number(
                    (usage.prompt_tokens_details as { cached_tokens?: unknown } | undefined)
                      ?.cached_tokens ??
                      usage.cached_tokens ??
                      usage.cached_input_tokens ??
                      0
                  ) || 0,
              },
            } as any)
          : undefined,
      } as any,
      model.startsWith('claude') ? 'anthropic' : 'openai'
    );

    const initialParsed = parseJson(String(content));
    const schema = validateStructuredTaskContent('dream_extraction', JSON.stringify(initialParsed));
    if (!schema.ok) {
      return {
        fixture_id: params.fixture.id,
        fixture_label: params.fixture.label,
        category: params.fixture.category,
        raw_dream: params.fixture.dream,
        run_id: params.runId,
        ok: false,
        latency_ms,
        model,
        error: `schema invalid: ${schema.schemaErrors.slice(0, 3).join('; ')}`,
        error_type: 'schema_invalid',
        prompt_id: DREAM_EXTRACTION_PROMPT_ID,
        prompt_version: DREAM_EXTRACTION_PROMPT_VERSION,
        schema_version: DREAM_EXTRACTION_SCHEMA_VERSION,
        archetype_catalog_version: ARCHETYPE_CATALOG_VERSION,
        myth_catalog_version: '1.2.0',
        target_language: targetOutputLanguage,
        cost_usd: estimated.estimatedUsd,
        raw_archetypes: [],
        validator_decisions: [],
        post_validation_archetypes: [],
        archetype_reject_reasons: [],
        central_conflicts: [],
        main_tension: null,
        core_mode: null,
        raw_amplifications: [],
        post_validation_amplifications: [],
        mythic_reject_reasons: [],
        interpretive_diagnostics: null,
        display_distillation: null,
        raw_parsed: initialParsed,
      };
    }

    const languageGate = await runOutputLanguageCommitGate({
      parsed: schema.data as Record<string, unknown>,
      target: targetOutputLanguage,
      repairOnce: async ({ messages, expectedPaths }) => {
        const repairRes = await fetch(params.endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: params.anon,
            Authorization: `Bearer ${params.token}`,
          },
          body: JSON.stringify({
            task: 'dream_extraction',
            model: 'gpt-5.4-mini',
            disable_anthropic_fallback: true,
            messages,
            temperature: DREAM_EXTRACTION_TEMPERATURE,
            max_completion_tokens: 1200,
            max_tokens: 1200,
            response_format: { type: 'json_object' },
            skip_structured_validation: true,
          }),
        });
        const repairText = await repairRes.text();
        if (!repairRes.ok) return null;
        const repairBody = JSON.parse(repairText) as Record<string, unknown>;
        const repairContent =
          (repairBody.choices as Array<{ message?: { content?: string } }> | undefined)?.[0]
            ?.message?.content ??
          (typeof repairBody.content === 'string' ? repairBody.content : '') ??
          '';
        if (!repairContent) return null;
        try {
          return validateLanguageRepairFieldMap(JSON.parse(String(repairContent)), expectedPaths);
        } catch {
          return null;
        }
      },
    });

    if (!languageGate.ok) {
      return {
        fixture_id: params.fixture.id,
        fixture_label: params.fixture.label,
        category: params.fixture.category,
        raw_dream: params.fixture.dream,
        run_id: params.runId,
        ok: false,
        latency_ms,
        model,
        error: `language_validation_failed: ${languageGate.telemetry.mismatched_field_paths.join(',')}`,
        error_type: 'language_validation_failed',
        prompt_id: DREAM_EXTRACTION_PROMPT_ID,
        prompt_version: DREAM_EXTRACTION_PROMPT_VERSION,
        schema_version: DREAM_EXTRACTION_SCHEMA_VERSION,
        archetype_catalog_version: ARCHETYPE_CATALOG_VERSION,
        myth_catalog_version: '1.2.0',
        target_language: targetOutputLanguage,
        cost_usd: estimated.estimatedUsd,
        raw_archetypes: [],
        validator_decisions: [],
        post_validation_archetypes: [],
        archetype_reject_reasons: [],
        central_conflicts: [],
        main_tension: null,
        core_mode: null,
        raw_amplifications: [],
        post_validation_amplifications: [],
        mythic_reject_reasons: [],
        interpretive_diagnostics: null,
        display_distillation: null,
        raw_parsed: initialParsed,
      };
    }

    const rawParsed = languageGate.parsed;
    const stages = buildEchoBenchmarkStages(rawParsed, params.fixture.dream);
    return {
      fixture_id: params.fixture.id,
      fixture_label: params.fixture.label,
      category: params.fixture.category,
      raw_dream: params.fixture.dream,
      run_id: params.runId,
      ok: true,
      latency_ms,
      model,
      prompt_id: DREAM_EXTRACTION_PROMPT_ID,
      prompt_version: DREAM_EXTRACTION_PROMPT_VERSION,
      schema_version: DREAM_EXTRACTION_SCHEMA_VERSION,
      archetype_catalog_version: ARCHETYPE_CATALOG_VERSION,
      myth_catalog_version: '1.2.0',
      target_language: targetOutputLanguage,
      cost_usd: estimated.estimatedUsd,
      raw_archetypes: stages.raw_archetypes,
      validator_decisions: stages.validator_decisions,
      post_validation_archetypes: stages.post_validation_archetypes,
      archetype_reject_reasons: stages.archetype_rejected,
      central_conflicts: Array.isArray(rawParsed.central_conflicts)
        ? rawParsed.central_conflicts.filter((item): item is string => typeof item === 'string')
        : [],
      main_tension:
        rawParsed.display_distillation &&
        typeof rawParsed.display_distillation === 'object' &&
        typeof (rawParsed.display_distillation as Record<string, unknown>).main_tension === 'string'
          ? String((rawParsed.display_distillation as Record<string, unknown>).main_tension)
          : null,
      core_mode: typeof rawParsed.core_mode === 'string' ? rawParsed.core_mode : null,
      raw_amplifications: stages.raw_amplifications,
      post_validation_amplifications: stages.post_validation_amplifications,
      mythic_reject_reasons: stages.mythic_rejected,
      interpretive_diagnostics:
        rawParsed.interpretive_diagnostics ??
        ((rawParsed as { interpretive_diagnostics?: unknown }).interpretive_diagnostics ?? null),
      display_distillation: rawParsed.display_distillation ?? null,
      raw_parsed: rawParsed,
    };
  }

  throw new Error(`unreachable extract loop for ${params.runId}`);
}

function hasArchetype(row: RunRecord, archetypeId: string): boolean {
  return row.post_validation_archetypes.some((entry) => {
    if (!entry || typeof entry !== 'object') return false;
    return (entry as { archetype_id?: unknown }).archetype_id === archetypeId;
  });
}

function selectedArchetypeIds(row: RunRecord): string[] {
  return row.post_validation_archetypes
    .map((entry) =>
      entry && typeof entry === 'object' && typeof (entry as { archetype_id?: unknown }).archetype_id === 'string'
        ? String((entry as { archetype_id: string }).archetype_id)
        : ''
    )
    .filter(Boolean);
}

function sumCost(rows: RunRecord[]): number {
  return rows.reduce((sum, row) => sum + (row.cost_usd ?? 0), 0);
}

function buildAcceptance(fixtures: Fixture[], rows: RunRecord[]) {
  const byFixture = new Map<string, RunRecord[]>();
  for (const row of rows) {
    const arr = byFixture.get(row.fixture_id) ?? [];
    arr.push(row);
    byFixture.set(row.fixture_id, arr);
  }

  const find = (id: string) => byFixture.get(id) ?? [];
  const sea = find('sea_mattress_el');
  const harmonious = find('F_pos_lover_shared_depth_en');
  const longing = find('F_pos_lover_bench_rain_en');
  const incidental = find('F_neg_partner_logistics_en');
  const nonRomantic = find('F_neg_warm_friends_en');
  const romanceCue = find('F_neg_romance_cue_only_en');
  const mother = find('F_pos_mother_kitchen_en');
  const father = find('m21_calm_father_en');
  const divineChild = find('P_divine_child_a');
  const complementarity = find('F_neg_surface_depth_harmony_el');
  const spatial = find('F_neg_spatial_conflict_control_el');
  const persona = find('F_pos_persona_stage_suit_el');
  const kitchen = find('F_neg_kitchen_glass_el');

  const count = (set: RunRecord[], predicate: (row: RunRecord) => boolean) => set.filter(predicate).length;
  const seaLover = count(sea, (row) => hasArchetype(row, 'lover'));
  const seaUnrelated = count(sea, (row) => selectedArchetypeIds(row).some((id) => id !== 'lover'));
  const seaEmptyConflicts = count(sea, (row) => row.central_conflicts.length === 0);
  const seaNullTension = count(sea, (row) => row.main_tension == null);
  const seaNoMyths = count(sea, (row) => row.post_validation_amplifications.length === 0);

  const loverSpilloverLabels = ['anima', 'animus', 'sacred_marriage'];
  const loverPositiveSpillover = [...harmonious, ...longing].flatMap((row) =>
    selectedArchetypeIds(row).filter((id) => loverSpilloverLabels.includes(id))
  );

  const calmFieldPasses =
    count(mother, (row) => hasArchetype(row, 'mother')) >= 2 &&
    count(father, (row) => hasArchetype(row, 'father')) >= 2 &&
    count(divineChild, (row) => hasArchetype(row, 'divine_child')) >= 2;

  const loverPasses =
    seaLover >= 4 &&
    count(harmonious, (row) => hasArchetype(row, 'lover')) >= 2 &&
    count(longing, (row) => hasArchetype(row, 'lover')) >= 2 &&
    count(incidental, (row) => hasArchetype(row, 'lover')) === 0 &&
    count(nonRomantic, (row) => hasArchetype(row, 'lover')) === 0 &&
    count(romanceCue, (row) => hasArchetype(row, 'lover')) === 0;

  const innerTensionsPass =
    count(complementarity, (row) => row.central_conflicts.length === 0) === 3 &&
    count(complementarity, (row) => row.main_tension == null) === 3 &&
    count(kitchen, (row) => row.central_conflicts.length === 0) === 3 &&
    count(kitchen, (row) => row.main_tension == null) === 3 &&
    count(spatial, (row) => row.central_conflicts.length > 0) >= 2 &&
    count(persona, (row) => row.central_conflicts.length > 0) >= 2;

  const incidentalOverfire =
    count(incidental, (row) => row.post_validation_archetypes.length > 0) > 0 ||
    count(nonRomantic, (row) => row.post_validation_archetypes.length > 0) > 0 ||
    count(romanceCue, (row) => row.post_validation_archetypes.length > 0) > 0;

  let branch: 'A' | 'B' | 'C' | 'D' | 'E';
  let recommendation: string;

  if (incidentalOverfire) {
    branch = 'D';
    recommendation = 'revise global calibration';
  } else if (calmFieldPasses && loverPasses && innerTensionsPass) {
    branch = 'A';
    recommendation = 'deploy M2.1 with catalog 1.7.0';
  } else if (calmFieldPasses && !loverPasses) {
    branch = 'B';
    recommendation = 'minimal Lover catalog revision required';
  } else if (!calmFieldPasses && innerTensionsPass) {
    branch = 'C';
    recommendation = 'revise global calibration';
  } else {
    branch = 'E';
    recommendation = innerTensionsPass
      ? 'revise global calibration'
      : 'revise global calibration';
  }

  return {
    sea_mattress: {
      lover_hits: seaLover,
      unrelated_archetype_runs: seaUnrelated,
      empty_conflicts: seaEmptyConflicts,
      null_main_tension: seaNullTension,
      no_myth_runs: seaNoMyths,
      accepted: seaLover >= 4 && seaUnrelated === 0 && seaEmptyConflicts === 5 && seaNullTension === 5 && seaNoMyths === 5,
    },
    lover_behavior: {
      harmonious_hits: count(harmonious, (row) => hasArchetype(row, 'lover')),
      longing_hits: count(longing, (row) => hasArchetype(row, 'lover')),
      incidental_partner_lover: count(incidental, (row) => hasArchetype(row, 'lover')),
      non_romantic_lover: count(nonRomantic, (row) => hasArchetype(row, 'lover')),
      romance_cue_only_lover: count(romanceCue, (row) => hasArchetype(row, 'lover')),
      spillover_labels: loverPositiveSpillover,
    },
    calm_field: {
      mother_hits: count(mother, (row) => hasArchetype(row, 'mother')),
      father_hits: count(father, (row) => hasArchetype(row, 'father')),
      divine_child_hits: count(divineChild, (row) => hasArchetype(row, 'divine_child')),
    },
    inner_tensions: {
      complementarity_empty: count(complementarity, (row) => row.central_conflicts.length === 0),
      complementarity_null_tension: count(complementarity, (row) => row.main_tension == null),
      kitchen_empty: count(kitchen, (row) => row.central_conflicts.length === 0),
      kitchen_null_tension: count(kitchen, (row) => row.main_tension == null),
      spatial_supported: count(spatial, (row) => row.central_conflicts.length > 0),
      persona_supported: count(persona, (row) => row.central_conflicts.length > 0),
    },
    archetype_density: {
      total_runs: rows.length,
      negative_runs_with_any_archetype: rows.filter((row) =>
        [
          'lover_negative_incidental_partner',
          'lover_negative_non_romantic',
          'lover_negative_romance_cue_only',
          'no_tension_complementarity',
          'ordinary_kitchen',
        ].includes(row.category)
      ).filter((row) => row.post_validation_archetypes.length > 0).length,
    },
    branch,
    recommendation,
  };
}

function formatJson(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

function buildReviewerMarkdown(params: {
  outDir: string;
  fixtures: Fixture[];
  rows: RunRecord[];
  acceptance: ReturnType<typeof buildAcceptance>;
  promptDelta: ReturnType<typeof computePromptDeltaVsHead>;
}): string {
  const grouped = new Map<string, RunRecord[]>();
  for (const row of params.rows) {
    const arr = grouped.get(row.fixture_id) ?? [];
    arr.push(row);
    grouped.set(row.fixture_id, arr);
  }

  const sections: string[] = [];
  sections.push('# Oneiros M2.1 broad live regression review');
  sections.push('');
  sections.push(`Date: \`2026-07-28\``);
  sections.push('');
  sections.push('## Runtime line');
  sections.push('');
  sections.push('```text');
  sections.push(`prompt_id: ${DREAM_EXTRACTION_PROMPT_ID}`);
  sections.push(`prompt_version: ${DREAM_EXTRACTION_PROMPT_VERSION}`);
  sections.push(`schema_version: ${DREAM_EXTRACTION_SCHEMA_VERSION}`);
  sections.push(`archetype_catalog_version: ${ARCHETYPE_CATALOG_VERSION}`);
  sections.push('myth_catalog_version: 1.2.0');
  sections.push('model_request: gpt-5.4-mini');
  sections.push('disable_anthropic_fallback: true');
  sections.push('debugInterpretiveEchoes: true');
  sections.push('concurrency: 5');
  sections.push('```');
  sections.push('');
  sections.push('## Token delta versus M2');
  sections.push('');
  sections.push('```json');
  sections.push(formatJson(params.promptDelta));
  sections.push('```');
  sections.push('');
  sections.push('## Acceptance summary');
  sections.push('');
  sections.push('```json');
  sections.push(formatJson(params.acceptance));
  sections.push('```');
  sections.push('');
  sections.push('## Fixtures and gold expectations');
  sections.push('');
  for (const fixture of params.fixtures) {
    sections.push(`### ${fixture.label}`);
    sections.push('');
    sections.push('```json');
    sections.push(
      formatJson({
        id: fixture.id,
        category: fixture.category,
        reps: fixture.reps,
        dream_language: fixture.dream_language,
        required_archetype_ids: fixture.required_archetype_ids,
        forbidden_archetype_ids: fixture.forbidden_archetype_ids ?? [],
        expected_central_conflicts: fixture.expected_central_conflicts ?? null,
        expected_main_tension: fixture.expected_main_tension ?? null,
        notes: fixture.notes,
        dream: fixture.dream,
      })
    );
    sections.push('```');
    sections.push('');
  }

  sections.push('## Per-run results');
  sections.push('');
  for (const fixture of params.fixtures) {
    sections.push(`### ${fixture.label} — runs`);
    sections.push('');
    const rows = (grouped.get(fixture.id) ?? []).sort((a, b) => a.run_id.localeCompare(b.run_id));
    for (const row of rows) {
      sections.push(`#### ${row.run_id}`);
      sections.push('');
      sections.push('```json');
      sections.push(
        formatJson({
          fixture_id: row.fixture_id,
          category: row.category,
          raw_dream: row.raw_dream,
          ok: row.ok,
          latency_ms: row.latency_ms,
          model: row.model,
          prompt_id: row.prompt_id,
          prompt_version: row.prompt_version,
          schema_version: row.schema_version,
          archetype_catalog_version: row.archetype_catalog_version,
          myth_catalog_version: row.myth_catalog_version,
          target_language: row.target_language,
          cost_usd: row.cost_usd,
          raw_archetypes: row.raw_archetypes,
          validator_decisions: row.validator_decisions,
          post_validation_archetypes: row.post_validation_archetypes,
          archetype_reject_reasons: row.archetype_reject_reasons,
          central_conflicts: row.central_conflicts,
          main_tension: row.main_tension,
          core_mode: row.core_mode,
          raw_amplifications: row.raw_amplifications,
          post_validation_amplifications: row.post_validation_amplifications,
          mythic_reject_reasons: row.mythic_reject_reasons,
          interpretive_diagnostics: row.interpretive_diagnostics,
        })
      );
      sections.push('```');
      sections.push('');
    }
  }

  sections.push('## Central conflicts / main_tension table');
  sections.push('');
  sections.push('| Run | Fixture | central_conflicts | main_tension | core_mode |');
  sections.push('|---|---|---|---|---|');
  for (const row of params.rows) {
    sections.push(
      `| \`${row.run_id}\` | \`${row.fixture_id}\` | \`${JSON.stringify(row.central_conflicts)}\` | \`${row.main_tension ?? 'null'}\` | \`${row.core_mode ?? 'null'}\` |`
    );
  }
  sections.push('');
  sections.push('## Cost summary');
  sections.push('');
  sections.push('```json');
  sections.push(
    formatJson({
      total_runs: params.rows.length,
      total_cost_usd: sumCost(params.rows),
      average_cost_usd: params.rows.length ? sumCost(params.rows) / params.rows.length : 0,
    })
  );
  sections.push('```');
  sections.push('');
  sections.push('## Final recommendation');
  sections.push('');
  sections.push('```text');
  sections.push(`decision_branch: ${params.acceptance.branch}`);
  sections.push(`recommendation: ${params.acceptance.recommendation}`);
  sections.push('```');
  sections.push('');
  return sections.join('\n');
}

async function main() {
  if (DREAM_EXTRACTION_PROMPT_VERSION !== '4.1.10-M2.1') {
    throw new Error(`Expected prompt version 4.1.10-M2.1, got ${DREAM_EXTRACTION_PROMPT_VERSION}`);
  }
  if (ARCHETYPE_CATALOG_VERSION !== '1.7.0') {
    throw new Error(`Expected archetype catalog 1.7.0, got ${ARCHETYPE_CATALOG_VERSION}`);
  }

  const fixtures = buildFixtures();
  const jobs = fixtures.flatMap((fixture) =>
    Array.from({ length: fixture.reps }, (_, index) => ({
      fixture,
      runId: `${fixture.id}_r${index + 1}`,
    }))
  );
  const outDir = path.join(
    process.cwd(),
    'tmp',
    `m21-broad-regression-${new Date().toISOString().replace(/[:.]/g, '-')}`
  );
  mkdirSync(outDir, { recursive: true });

  const { anon, endpoint, token } = await authToken();
  console.log(
    JSON.stringify({
      event: 'm21_broad_regression_start',
      jobs: jobs.length,
      prompt_version: DREAM_EXTRACTION_PROMPT_VERSION,
      prompt_id: DREAM_EXTRACTION_PROMPT_ID,
      archetype_catalog_version: ARCHETYPE_CATALOG_VERSION,
      endpoint,
    })
  );

  const rows = await mapPool(jobs, 5, async (job) => {
    const row = await extractFixture({
      fixture: job.fixture,
      runId: job.runId,
      endpoint,
      anon,
      token,
    });
    writeFileSync(path.join(outDir, `${job.runId}.json`), JSON.stringify(row, null, 2));
    console.log(
      JSON.stringify({
        event: 'm21_broad_regression_run',
        run_id: row.run_id,
        fixture_id: row.fixture_id,
        ok: row.ok,
        post_archetypes: row.post_validation_archetypes.map((entry) =>
          entry && typeof entry === 'object' ? (entry as { archetype_id?: unknown }).archetype_id ?? null : null
        ),
        central_conflicts: row.central_conflicts,
        main_tension: row.main_tension,
      })
    );
    return row;
  });

  writeFileSync(path.join(outDir, 'all_runs.json'), JSON.stringify(rows, null, 2));
  const acceptance = buildAcceptance(fixtures, rows);
  const promptDelta = computePromptDeltaVsHead();
  const reviewerMarkdown = buildReviewerMarkdown({
    outDir,
    fixtures,
    rows,
    acceptance,
    promptDelta,
  });
  const docPath = path.join(
    process.cwd(),
    'docs',
    'ONEIROS_M2_1_BROAD_LIVE_REGRESSION_REVIEW_2026-07-28.md'
  );
  writeFileSync(docPath, reviewerMarkdown);
  writeFileSync(
    path.join(outDir, 'summary.json'),
    JSON.stringify({ acceptance, promptDelta, docPath, outDir }, null, 2)
  );
  console.log(
    JSON.stringify({
      event: 'm21_broad_regression_done',
      outDir,
      docPath,
      branch: acceptance.branch,
      recommendation: acceptance.recommendation,
    })
  );
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
