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
import { rateLimitBackoffMs, mapPool } from '../scripts/lib/globalArchetypeBenchmarkRunner';
import { classifyProxyError } from '../scripts/lib/globalArchetypeModelRouting';
import { buildEchoBenchmarkStages } from '../scripts/lib/echoBenchmarkStages';
import {
  PATCH_F_PHASE1_FIXTURE,
  PATCH_F_PHASE2_FIXTURES,
  SEA_MATTRESS_EL_DREAM,
  type PatchFFixture,
} from '../scripts/lib/patchFStabilityFixtures';

type FixtureCategory =
  | 'sea_mattress'
  | 'lover_positive_harmonious'
  | 'lover_positive_longing'
  | 'lover_negative_non_romantic'
  | 'lover_negative_incidental_partner'
  | 'lover_negative_romance_cue_only'
  | 'ordinary_kitchen'
  | 'surface_depth_harmony'
  | 'genuine_spatial_conflict'
  | 'persona_conflict'
  | 'mother_positive'
  | 'father_positive'
  | 'divine_child_positive';

type Fixture = {
  id: string;
  label: string;
  category: FixtureCategory;
  reps: number;
  dream_language: 'en' | 'el';
  dream: string;
  required_archetype_ids: string[];
  forbidden_archetype_ids?: string[];
  expected_central_conflicts?: string[];
  expected_main_tension?: string | null;
  notes: string;
};

type AttemptRecord = {
  fixture_id: string;
  run_id: string;
  semantic_run_id: string;
  attempt_index: number;
  ok: boolean;
  latency_ms: number;
  model: string | null;
  error_type?: string;
  error?: string;
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
  raw_parsed: Record<string, unknown>;
};

type SemanticRun = {
  fixture: Fixture;
  semantic_run_id: string;
  successful: boolean;
  final_attempt: AttemptRecord;
  attempts: AttemptRecord[];
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

function patchFFixture(id: string): PatchFFixture {
  const found = [PATCH_F_PHASE1_FIXTURE, ...PATCH_F_PHASE2_FIXTURES].find((fixture) => fixture.id === id);
  if (!found) throw new Error(`patchF fixture not found: ${id}`);
  return found;
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

function buildFixtures(): Fixture[] {
  const harmoniousLover = patchFFixture('F_pos_lover_shared_depth_en');
  const longingLover = patchFFixture('F_pos_lover_bench_rain_en');
  const warmFriends = patchFFixture('F_neg_warm_friends_en');
  const partnerLogistics = patchFFixture('F_neg_partner_logistics_en');
  const romanceCue = patchFFixture('F_neg_romance_cue_only_en');
  const ordinaryKitchen = patchFFixture('F_neg_kitchen_glass_el');
  const complementarity = patchFFixture('F_neg_surface_depth_harmony_el');
  const spatialConflict = patchFFixture('F_neg_spatial_conflict_control_el');
  const personaConflict = patchFFixture('F_pos_persona_stage_suit_el');
  const motherPositive = patchFFixture('F_pos_mother_kitchen_en');
  const divineChild = loadBenchmarkFixture('P_divine_child_a');

  return [
    {
      id: 'sea_mattress_el',
      label: 'Exact Greek sea-mattress',
      category: 'sea_mattress',
      reps: 5,
      dream_language: 'el',
      dream: SEA_MATTRESS_EL_DREAM,
      required_archetype_ids: ['lover'],
      forbidden_archetype_ids: ['anima', 'animus', 'guide_psychopomp', 'sacred_marriage'],
      expected_central_conflicts: [],
      expected_main_tension: null,
      notes: 'Exact reviewer acceptance seed.',
    },
    {
      id: harmoniousLover.id,
      label: 'Harmonious Lover positive',
      category: 'lover_positive_harmonious',
      reps: 3,
      dream_language: harmoniousLover.dream_language,
      dream: harmoniousLover.dream,
      required_archetype_ids: ['lover'],
      forbidden_archetype_ids: ['anima', 'animus', 'sacred_marriage'],
      expected_central_conflicts: harmoniousLover.expected_central_conflicts,
      expected_main_tension: harmoniousLover.expected_main_tension,
      notes: harmoniousLover.notes,
    },
    {
      id: longingLover.id,
      label: 'Longing Lover positive',
      category: 'lover_positive_longing',
      reps: 3,
      dream_language: longingLover.dream_language,
      dream: longingLover.dream,
      required_archetype_ids: ['lover'],
      forbidden_archetype_ids: ['anima', 'animus', 'sacred_marriage', 'persona'],
      expected_central_conflicts: [],
      expected_main_tension: null,
      notes: longingLover.notes,
    },
    {
      id: warmFriends.id,
      label: 'Warm non-romantic friends',
      category: 'lover_negative_non_romantic',
      reps: 5,
      dream_language: warmFriends.dream_language,
      dream: warmFriends.dream,
      required_archetype_ids: [],
      forbidden_archetype_ids: ['lover'],
      expected_central_conflicts: [],
      expected_main_tension: null,
      notes: warmFriends.notes,
    },
    {
      id: partnerLogistics.id,
      label: 'Incidental partner',
      category: 'lover_negative_incidental_partner',
      reps: 3,
      dream_language: partnerLogistics.dream_language,
      dream: partnerLogistics.dream,
      required_archetype_ids: [],
      forbidden_archetype_ids: ['lover'],
      expected_central_conflicts: [],
      expected_main_tension: null,
      notes: partnerLogistics.notes,
    },
    {
      id: romanceCue.id,
      label: 'Romance cue only',
      category: 'lover_negative_romance_cue_only',
      reps: 3,
      dream_language: romanceCue.dream_language,
      dream: romanceCue.dream,
      required_archetype_ids: [],
      forbidden_archetype_ids: ['lover'],
      notes: romanceCue.notes,
    },
    {
      id: ordinaryKitchen.id,
      label: 'Ordinary kitchen',
      category: 'ordinary_kitchen',
      reps: 5,
      dream_language: ordinaryKitchen.dream_language,
      dream: ordinaryKitchen.dream,
      required_archetype_ids: [],
      expected_central_conflicts: [],
      expected_main_tension: null,
      notes: ordinaryKitchen.notes,
    },
    {
      id: complementarity.id,
      label: 'Surface/depth complementarity',
      category: 'surface_depth_harmony',
      reps: 3,
      dream_language: complementarity.dream_language,
      dream: complementarity.dream,
      required_archetype_ids: [],
      expected_central_conflicts: [],
      expected_main_tension: null,
      notes: complementarity.notes,
    },
    {
      id: spatialConflict.id,
      label: 'Genuine spatial conflict',
      category: 'genuine_spatial_conflict',
      reps: 3,
      dream_language: spatialConflict.dream_language,
      dream: spatialConflict.dream,
      required_archetype_ids: [],
      expected_central_conflicts: spatialConflict.expected_central_conflicts,
      expected_main_tension: spatialConflict.expected_main_tension,
      notes: spatialConflict.notes,
    },
    {
      id: personaConflict.id,
      label: 'Persona conflict',
      category: 'persona_conflict',
      reps: 3,
      dream_language: personaConflict.dream_language,
      dream: personaConflict.dream,
      required_archetype_ids: ['persona'],
      notes: personaConflict.notes,
    },
    {
      id: motherPositive.id,
      label: 'Mother positive',
      category: 'mother_positive',
      reps: 2,
      dream_language: motherPositive.dream_language,
      dream: motherPositive.dream,
      required_archetype_ids: ['mother'],
      notes: motherPositive.notes,
    },
    {
      id: 'm22_calm_father_en',
      label: 'Father positive',
      category: 'father_positive',
      reps: 2,
      dream_language: 'en',
      dream:
        'At dusk my father stands at the garden gate and quietly tells me which tools must come inside before the rain. He does not raise his voice. As I follow his calm instruction, the whole yard feels ordered and protected, and even the wind seems to fall into place around that steady authority.',
      required_archetype_ids: ['father'],
      notes: 'Protective paternal order without dramatic conflict.',
    },
    {
      id: String(divineChild.id),
      label: 'Divine Child positive',
      category: 'divine_child_positive',
      reps: 2,
      dream_language: String(divineChild.dream_language) as 'en' | 'el',
      dream: String(divineChild.dream),
      required_archetype_ids: ['divine_child'],
      notes: 'Existing benchmark Divine Child fixture.',
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

function getTokenizer():
  | { encode: (text: string) => number[]; method: string }
  | null {
  for (const candidate of ['/tmp/tok/node_modules/gpt-tokenizer', 'gpt-tokenizer']) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const mod = require(candidate) as { encode?: (text: string) => number[] };
      if (typeof mod.encode === 'function') {
        return { encode: mod.encode, method: `gpt-tokenizer:${candidate}` };
      }
    } catch {
      // ignore
    }
  }
  return null;
}

function computePromptDeltaVsM21(): {
  current_system_prompt_tokens: number | null;
  reconstructed_m21_system_prompt_tokens: number | null;
  delta_tokens: number | null;
  method: string;
} {
  const tokenizer = getTokenizer();
  if (!tokenizer) {
    return {
      current_system_prompt_tokens: null,
      reconstructed_m21_system_prompt_tokens: null,
      delta_tokens: null,
      method: 'gpt-tokenizer unavailable',
    };
  }
  const current = buildDreamExtractionSystemPrompt();
  const m21 = current
    .replace(
      '\nDo not elevate a small practical obstacle, mild inconvenience, or ordinary task friction\ninto an inner conflict when the dream simply notices it, resolves it, or moves past it.\n\nAn immediate or low-stakes obstacle is not enough by itself.\n',
      '\n'
    )
    .replace(
      '\nEXPLICIT NEGATION\n\nWhen the raw dream explicitly denies an archetypal function,\ndo not select that archetype merely from neighboring imagery.\n\nExplicitly non-romantic companionship must not become Lover.\nExplicitly non-guiding movement must not become Guide / Psychopomp.\nExplicitly non-authoritative presence must not become Father or Ruler.\n\nA direct negation is disqualifying unless the dream\'s enacted\nsequence clearly overrides it with stronger concrete evidence.\n',
      '\n'
    );
  const currentTokens = tokenizer.encode(current).length;
  const m21Tokens = tokenizer.encode(m21).length;
  return {
    current_system_prompt_tokens: currentTokens,
    reconstructed_m21_system_prompt_tokens: m21Tokens,
    delta_tokens: currentTokens - m21Tokens,
    method: tokenizer.method,
  };
}

function extractLoverRecord(text: string): string {
  const match = text.match(/\{\s*id: 'lover'[\s\S]*?competingLabels: \['Anima', 'Animus', 'Sacred Marriage', 'Persona'\],\s*\n\s*\}/);
  return match?.[0] ?? 'lover_record_not_found';
}

function buildExactDiffs(): {
  lover_catalog_diff: string;
  prompt_diff_summary: string;
} {
  const currentCatalog = readFileSync(path.join(process.cwd(), 'src/ai/catalogs/archetypeCatalog.v1.ts'), 'utf8');
  const currentPrompt = readFileSync(path.join(process.cwd(), 'src/ai/dreamExtractionPrompt.ts'), 'utf8');
  const currentLover = extractLoverRecord(currentCatalog);
  const priorLover = currentLover
    .replace(
      "coreFunction:\n      'Erotic, intimate, or beloved relatedness that organizes the dream’s emotional field, including quiet shared attunement without conflict or dramatic outcome.',",
      "coreFunction: 'Erotic or devoted relatedness that organizes desire, union, or heart-risk at the centre.',"
    )
    .replace(
      "      'mutual erotic, intimate, or beloved relatedness organizes the dream',\n      'quiet shared attunement, bodily closeness, or chosen beloved intimacy is the field-organizing centre',\n      'union, longing, separation, or heart-risk is the structural stake',",
      "      'erotic or devoted relatedness organizes the dream',\n      'union, longing, or heart-risk is the structural stake',"
    )
    .replace(
      "      'warm friendship, companionship, teamwork, or practical cooperation without erotic, intimate, or beloved charge',\n      'explicitly non-romantic companionship or explicit denial of devotion, romance, or beloved stakes',",
      "      'requiring longing, separation, vow, sacrifice, or transformed social order when gentle closeness already organizes the field',"
    );
  const loverDiff = [
    '--- Lover 1.7.0',
    '+++ Lover 1.7.1',
    priorLover,
    '---',
    currentLover,
  ].join('\n');

  const promptDiffSummary = [
    'M2.1 -> M2.2 exact prompt delta:',
    '- version bump: 4.1.10-M2.1 -> 4.1.10-M2.2',
    '- added ordinary practical-obstacle restraint to CENTRAL CONFLICTS / INNER TENSIONS',
    '- added EXPLICIT NEGATION block to GLOBAL ARCHETYPE ACTIVATION',
  ].join('\n');

  void currentPrompt;
  return { lover_catalog_diff: loverDiff, prompt_diff_summary: promptDiffSummary };
}

async function singleAttempt(params: {
  fixture: Fixture;
  semanticRunId: string;
  attemptIndex: number;
  endpoint: string;
  anon: string;
  token: string;
}): Promise<AttemptRecord> {
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

  for (let transportAttempt = 1; transportAttempt <= 6; transportAttempt += 1) {
    const runId = `${params.semanticRunId}_a${params.attemptIndex}_t${transportAttempt}`;
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
          { role: 'user', content: `${user}\n\n[m22_narrow_regression:${runId}:${randomUUID()}]` },
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
      if (transportAttempt < 6 && (res.status === 429 || res.status >= 500)) {
        await sleep(rateLimitBackoffMs(transportAttempt, res.status));
        continue;
      }
      return {
        fixture_id: params.fixture.id,
        run_id: runId,
        semantic_run_id: params.semanticRunId,
        attempt_index: params.attemptIndex,
        ok: false,
        latency_ms,
        model: null,
        error_type,
        error: `proxy ${res.status}: ${text.slice(0, 500)}`,
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
                    (usage.prompt_tokens_details as { cached_tokens?: unknown } | undefined)?.cached_tokens ??
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
        run_id: runId,
        semantic_run_id: params.semanticRunId,
        attempt_index: params.attemptIndex,
        ok: false,
        latency_ms,
        model,
        error_type: 'schema_invalid',
        error: `schema invalid: ${schema.schemaErrors.slice(0, 3).join('; ')}`,
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
        run_id: runId,
        semantic_run_id: params.semanticRunId,
        attempt_index: params.attemptIndex,
        ok: false,
        latency_ms,
        model,
        error_type: 'language_validation_failed',
        error: `language_validation_failed: ${languageGate.telemetry.mismatched_field_paths.join(',')}`,
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
        raw_parsed: initialParsed,
      };
    }

    const rawParsed = languageGate.parsed;
    const stages = buildEchoBenchmarkStages(rawParsed, params.fixture.dream);
    return {
      fixture_id: params.fixture.id,
      run_id: runId,
      semantic_run_id: params.semanticRunId,
      attempt_index: params.attemptIndex,
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
      interpretive_diagnostics: rawParsed.interpretive_diagnostics ?? null,
      raw_parsed: rawParsed,
    };
  }

  throw new Error(`unreachable transport loop for ${params.semanticRunId}`);
}

async function extractSemanticRun(params: {
  fixture: Fixture;
  semanticRunId: string;
  endpoint: string;
  anon: string;
  token: string;
}): Promise<SemanticRun> {
  const attempts: AttemptRecord[] = [];
  const first = await singleAttempt({
    fixture: params.fixture,
    semanticRunId: params.semanticRunId,
    attemptIndex: 1,
    endpoint: params.endpoint,
    anon: params.anon,
    token: params.token,
  });
  attempts.push(first);
  if (first.ok) {
    return { fixture: params.fixture, semantic_run_id: params.semanticRunId, successful: true, final_attempt: first, attempts };
  }
  if (first.error_type === 'language_validation_failed') {
    const retry = await singleAttempt({
      fixture: params.fixture,
      semanticRunId: params.semanticRunId,
      attemptIndex: 2,
      endpoint: params.endpoint,
      anon: params.anon,
      token: params.token,
    });
    attempts.push(retry);
    return {
      fixture: params.fixture,
      semantic_run_id: params.semanticRunId,
      successful: retry.ok,
      final_attempt: retry,
      attempts,
    };
  }
  return { fixture: params.fixture, semantic_run_id: params.semanticRunId, successful: false, final_attempt: first, attempts };
}

function hasArchetype(row: AttemptRecord, archetypeId: string): boolean {
  return row.post_validation_archetypes.some((entry) => {
    if (!entry || typeof entry !== 'object') return false;
    return (entry as { archetype_id?: unknown }).archetype_id === archetypeId;
  });
}

function selectedArchetypeIds(row: AttemptRecord): string[] {
  return row.post_validation_archetypes
    .map((entry) =>
      entry && typeof entry === 'object' && typeof (entry as { archetype_id?: unknown }).archetype_id === 'string'
        ? String((entry as { archetype_id: string }).archetype_id)
        : ''
    )
    .filter(Boolean);
}

function extractMechanismTagsByArchetype(row: AttemptRecord): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const entry of row.raw_archetypes) {
    if (!entry || typeof entry !== 'object') continue;
    const archetypeId = (entry as { archetype_id?: unknown }).archetype_id;
    const tags = (entry as { mechanism_tags?: unknown }).mechanism_tags;
    if (typeof archetypeId === 'string' && Array.isArray(tags)) {
      out[archetypeId] = tags.filter((item): item is string => typeof item === 'string');
    }
  }
  return out;
}

function buildAcceptance(successes: SemanticRun[]) {
  const grouped = new Map<string, AttemptRecord[]>();
  for (const run of successes) {
    const arr = grouped.get(run.fixture.id) ?? [];
    arr.push(run.final_attempt);
    grouped.set(run.fixture.id, arr);
  }
  const get = (id: string) => grouped.get(id) ?? [];

  const sea = get('sea_mattress_el');
  const harmonious = get('F_pos_lover_shared_depth_en');
  const longing = get('F_pos_lover_bench_rain_en');
  const warm = get('F_neg_warm_friends_en');
  const incidental = get('F_neg_partner_logistics_en');
  const romance = get('F_neg_romance_cue_only_en');
  const kitchen = get('F_neg_kitchen_glass_el');
  const complementarity = get('F_neg_surface_depth_harmony_el');
  const spatial = get('F_neg_spatial_conflict_control_el');
  const persona = get('F_pos_persona_stage_suit_el');
  const mother = get('F_pos_mother_kitchen_en');
  const father = get('m22_calm_father_en');
  const child = get('P_divine_child_a');

  const count = (rows: AttemptRecord[], pred: (row: AttemptRecord) => boolean) => rows.filter(pred).length;

  const summary = {
    sea_mattress: {
      successful_runs: sea.length,
      lover_hits: count(sea, (r) => hasArchetype(r, 'lover')),
      other_archetype_runs: count(sea, (r) => selectedArchetypeIds(r).some((id) => id !== 'lover')),
      empty_conflicts: count(sea, (r) => r.central_conflicts.length === 0),
      null_main_tension: count(sea, (r) => r.main_tension == null),
      no_myths: count(sea, (r) => r.post_validation_amplifications.length === 0),
    },
    lover_controls: {
      harmonious_hits: count(harmonious, (r) => hasArchetype(r, 'lover')),
      longing_hits: count(longing, (r) => hasArchetype(r, 'lover')),
      warm_friends_lover: count(warm, (r) => hasArchetype(r, 'lover')),
      incidental_partner_lover: count(incidental, (r) => hasArchetype(r, 'lover')),
      romance_cue_lover: count(romance, (r) => hasArchetype(r, 'lover')),
    },
    inner_tensions: {
      ordinary_kitchen_empty: count(kitchen, (r) => r.central_conflicts.length === 0),
      ordinary_kitchen_null: count(kitchen, (r) => r.main_tension == null),
      surface_depth_empty: count(complementarity, (r) => r.central_conflicts.length === 0),
      surface_depth_null: count(complementarity, (r) => r.main_tension == null),
      spatial_supported: count(spatial, (r) => r.central_conflicts.length > 0),
      persona_supported: count(persona, (r) => r.central_conflicts.length > 0),
    },
    calm_field: {
      mother_hits: count(mother, (r) => hasArchetype(r, 'mother')),
      father_hits: count(father, (r) => hasArchetype(r, 'father')),
      divine_child_hits: count(child, (r) => hasArchetype(r, 'divine_child')),
    },
    archetype_density: {
      successful_semantic_runs: successes.length,
      negative_runs_with_any_archetype: [...warm, ...incidental, ...romance, ...kitchen, ...complementarity].filter(
        (r) => r.post_validation_archetypes.length > 0
      ).length,
    },
  };

  const recommendDeploy =
    summary.sea_mattress.lover_hits >= 4 &&
    summary.sea_mattress.other_archetype_runs === 0 &&
    summary.sea_mattress.empty_conflicts === 5 &&
    summary.sea_mattress.null_main_tension === 5 &&
    summary.sea_mattress.no_myths === 5 &&
    summary.lover_controls.warm_friends_lover === 0 &&
    summary.lover_controls.incidental_partner_lover === 0 &&
    summary.lover_controls.romance_cue_lover === 0 &&
    summary.inner_tensions.ordinary_kitchen_empty >= 4 &&
    summary.inner_tensions.ordinary_kitchen_null >= 4 &&
    summary.inner_tensions.surface_depth_empty === 3 &&
    summary.inner_tensions.surface_depth_null === 3 &&
    summary.inner_tensions.spatial_supported >= 2 &&
    summary.inner_tensions.persona_supported >= 2;

  let decision: string;
  if (recommendDeploy) {
    decision = 'recommend deploy M2.2 + catalog 1.7.1';
  } else if (summary.sea_mattress.lover_hits < 4 || summary.lover_controls.warm_friends_lover > 0) {
    decision = 'do not add more prompt prose; recommend mechanism-contract revision: intimate_mutual_attunement';
  } else {
    decision = 'keep archetype patch; revise only Inner Tensions restraint';
  }

  return { summary, decision };
}

function buildReviewerPacket(params: {
  fixtures: Fixture[];
  successfulRuns: SemanticRun[];
  failedSemanticRuns: SemanticRun[];
  allAttempts: AttemptRecord[];
  outDir: string;
}) {
  const promptDelta = computePromptDeltaVsM21();
  const exactDiffs = buildExactDiffs();
  const acceptance = buildAcceptance(params.successfulRuns);
  const sections: string[] = [];
  sections.push('# Oneiros M2.2 narrow live regression review');
  sections.push('');
  sections.push('## Runtime line');
  sections.push('');
  sections.push('```text');
  sections.push(`prompt_id: ${DREAM_EXTRACTION_PROMPT_ID}`);
  sections.push(`prompt_version: ${DREAM_EXTRACTION_PROMPT_VERSION}`);
  sections.push(`schema_version: ${DREAM_EXTRACTION_SCHEMA_VERSION}`);
  sections.push(`archetype_catalog_version: ${ARCHETYPE_CATALOG_VERSION}`);
  sections.push('myth_catalog_version: 1.2.0');
  sections.push('concurrency: 2');
  sections.push('disable_anthropic_fallback: true');
  sections.push('fresh uncached calls');
  sections.push('bounded retry for 429');
  sections.push('one retry for language_validation_failed');
  sections.push('count only successful semantic runs toward acceptance');
  sections.push('```');
  sections.push('');
  sections.push('## Exact diffs');
  sections.push('');
  sections.push('```text');
  sections.push(exactDiffs.prompt_diff_summary);
  sections.push('```');
  sections.push('');
  sections.push('```text');
  sections.push(exactDiffs.lover_catalog_diff);
  sections.push('```');
  sections.push('');
  sections.push('## Full prompt token delta');
  sections.push('');
  sections.push('```json');
  sections.push(JSON.stringify(promptDelta, null, 2));
  sections.push('```');
  sections.push('');
  sections.push('## Fixtures');
  sections.push('');
  for (const fixture of params.fixtures) {
    sections.push(`### ${fixture.label}`);
    sections.push('```json');
    sections.push(JSON.stringify(fixture, null, 2));
    sections.push('```');
    sections.push('');
  }
  sections.push('## Failed attempts separated from successful semantic runs');
  sections.push('');
  sections.push('```json');
  sections.push(
    JSON.stringify(
      params.failedSemanticRuns.map((run) => ({
        fixture_id: run.fixture.id,
        semantic_run_id: run.semantic_run_id,
        final_error_type: run.final_attempt.error_type ?? null,
        final_error: run.final_attempt.error ?? null,
        attempts: run.attempts.map((attempt) => ({
          run_id: attempt.run_id,
          attempt_index: attempt.attempt_index,
          ok: attempt.ok,
          error_type: attempt.error_type ?? null,
          error: attempt.error ?? null,
        })),
      })),
      null,
      2
    )
  );
  sections.push('```');
  sections.push('');
  sections.push('## Successful semantic runs');
  sections.push('');
  for (const run of params.successfulRuns) {
    const row = run.final_attempt;
    sections.push(`### ${run.semantic_run_id}`);
    sections.push('```json');
    sections.push(
      JSON.stringify(
        {
          fixture_id: row.fixture_id,
          run_id: row.run_id,
          attempt_count: run.attempts.length,
          model: row.model,
          latency_ms: row.latency_ms,
          cost_usd: row.cost_usd,
          raw_archetypes: row.raw_archetypes,
          post_validation_archetypes: row.post_validation_archetypes,
          mechanism_tags_by_archetype: extractMechanismTagsByArchetype(row),
          validator_decisions: row.validator_decisions,
          archetype_reject_reasons: row.archetype_reject_reasons,
          central_conflicts: row.central_conflicts,
          main_tension: row.main_tension,
          core_mode: row.core_mode,
          raw_amplifications: row.raw_amplifications,
          post_validation_amplifications: row.post_validation_amplifications,
          mythic_reject_reasons: row.mythic_reject_reasons,
          explicit_negation_behavior:
            row.fixture_id === 'F_neg_warm_friends_en' ||
            row.fixture_id === 'F_neg_partner_logistics_en' ||
            row.fixture_id === 'F_neg_romance_cue_only_en'
              ? 'inspected'
              : 'n/a',
          interpretive_diagnostics: row.interpretive_diagnostics,
        },
        null,
        2
      )
    );
    sections.push('```');
    sections.push('');
  }
  sections.push('## Archetype density / spillover');
  sections.push('');
  sections.push('```json');
  sections.push(JSON.stringify(acceptance.summary.archetype_density, null, 2));
  sections.push('```');
  sections.push('');
  sections.push('## Acceptance');
  sections.push('');
  sections.push('```json');
  sections.push(JSON.stringify(acceptance.summary, null, 2));
  sections.push('```');
  sections.push('');
  sections.push('## Decision');
  sections.push('');
  sections.push('```text');
  sections.push(acceptance.decision);
  sections.push('```');
  sections.push('');
  sections.push(`Artifacts directory: ${params.outDir}`);
  return sections.join('\n');
}

async function main() {
  if (DREAM_EXTRACTION_PROMPT_VERSION !== '4.1.10-M2.2') {
    throw new Error(`Expected M2.2 prompt, got ${DREAM_EXTRACTION_PROMPT_VERSION}`);
  }
  if (ARCHETYPE_CATALOG_VERSION !== '1.7.1') {
    throw new Error(`Expected archetype catalog 1.7.1, got ${ARCHETYPE_CATALOG_VERSION}`);
  }

  const fixtures = buildFixtures();
  const jobs = fixtures.flatMap((fixture) =>
    Array.from({ length: fixture.reps }, (_, index) => ({
      fixture,
      semanticRunId: `${fixture.id}_semantic_r${index + 1}`,
    }))
  );

  const outDir = path.join(
    process.cwd(),
    'tmp',
    `m22-narrow-regression-${new Date().toISOString().replace(/[:.]/g, '-')}`
  );
  mkdirSync(outDir, { recursive: true });

  const { anon, endpoint, token } = await authToken();
  console.log(
    JSON.stringify({
      event: 'm22_narrow_regression_start',
      jobs: jobs.length,
      prompt_version: DREAM_EXTRACTION_PROMPT_VERSION,
      archetype_catalog_version: ARCHETYPE_CATALOG_VERSION,
      endpoint,
      concurrency: 2,
    })
  );

  const semanticRuns = await mapPool(jobs, 2, async (job) => {
    const run = await extractSemanticRun({
      fixture: job.fixture,
      semanticRunId: job.semanticRunId,
      endpoint,
      anon,
      token,
    });
    writeFileSync(path.join(outDir, `${job.semanticRunId}.json`), JSON.stringify(run, null, 2));
    console.log(
      JSON.stringify({
        event: 'm22_narrow_regression_semantic_run',
        semantic_run_id: run.semantic_run_id,
        fixture_id: run.fixture.id,
        successful: run.successful,
        attempts: run.attempts.length,
        final_error_type: run.final_attempt.error_type ?? null,
        post_archetypes: selectedArchetypeIds(run.final_attempt),
        central_conflicts: run.final_attempt.central_conflicts,
        main_tension: run.final_attempt.main_tension,
      })
    );
    return run;
  });

  const successfulRuns = semanticRuns.filter((run) => run.successful);
  const failedSemanticRuns = semanticRuns.filter((run) => !run.successful);
  const allAttempts = semanticRuns.flatMap((run) => run.attempts);

  const packet = buildReviewerPacket({
    fixtures,
    successfulRuns,
    failedSemanticRuns,
    allAttempts,
    outDir,
  });
  const docPath = path.join(
    process.cwd(),
    'docs',
    'ONEIROS_M2_2_NARROW_LIVE_REGRESSION_REVIEW_2026-07-28.md'
  );
  writeFileSync(docPath, packet);
  writeFileSync(path.join(outDir, 'semantic_runs.json'), JSON.stringify(semanticRuns, null, 2));
  writeFileSync(path.join(outDir, 'attempts.json'), JSON.stringify(allAttempts, null, 2));
  writeFileSync(
    path.join(outDir, 'summary.json'),
    JSON.stringify(
      {
        successful_semantic_runs: successfulRuns.length,
        failed_semantic_runs: failedSemanticRuns.length,
        docPath,
      },
      null,
      2
    )
  );
  console.log(
    JSON.stringify({
      event: 'm22_narrow_regression_done',
      docPath,
      outDir,
      successful_semantic_runs: successfulRuns.length,
      failed_semantic_runs: failedSemanticRuns.length,
    })
  );
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
