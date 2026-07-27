/**
 * Patch C.1.1 namespace enforcement benchmark.
 * Order: Sisyphus×5 → smoke (generic negative×1, Inanna×1, Fisherman×1).
 *
 * Run: bash scripts/run-patch-c11-benchmark.sh
 */
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
  DREAM_EXTRACTION_JSON_SCHEMA_TOKEN_COUNT,
  MYTH_CATALOG_ID_COUNT,
  SELECTABLE_ARCHETYPE_ID_COUNT,
} from '../src/ai/catalogs/generated/catalogIdEnums.v1';
import { MYTH_CATALOG_IDS } from '../src/ai/catalogs/generated/catalogIdEnums.v1';
import { MYTHIC_PROMPT_INDEX_TOKEN_COUNT, MYTHIC_PROMPT_INDEX_VERSION } from '../src/ai/catalogs/mythicPromptIndex';
import { buildDreamExtractionResponseFormat } from '../src/ai/dreamExtractionResponseFormat';
import { listMythicCatalogIds } from '../src/ai/catalogs/mythicNarrativeCatalog';
import { validateStructuredTaskContent } from '../src/ai/structuredTaskValidation';
import { buildEchoBenchmarkStages } from './lib/echoBenchmarkStages';

type Job = { phase: string; run_id: string; title: string; content: string; expect_myth?: string | null };

const INANNA_DREAM = `Κατέβαινα σε ένα υπόγειο παλάτι περνώντας από επτά διαδοχικές πόρτες. Σε κάθε πόρτα ένας φύλακας μου ζητούσε να αφήσω κάτι: πρώτα το δαχτυλίδι μου, μετά το παλτό, τα παπούτσια, μια κάρτα με το όνομά μου, το περιδέραιο, τη ζώνη και τέλος ένα μικρό στέμμα που δεν ήξερα ότι φορούσα. Στην τελευταία αίθουσα στεκόταν μια σιωπηλή βασίλισσα. Με κοίταξε χωρίς να μιλήσει και έπεσα στο πάτωμα σαν να είχε φύγει όλη η ζωή από μέσα μου. Αργότερα δύο μικρές μορφές έριξαν νερό στο πρόσωπό μου και ξύπνησα μέσα στο όνειρο. Ανέβηκα ξανά από τις επτά πόρτες, αλλά δεν μπορούσα να πάρω πίσω όλα όσα είχα αφήσει. Βγήκα στην επιφάνεια φορώντας μόνο ένα απλό λευκό κορδόνι στον καρπό.`;

const GENERIC_DESCENT = `I walked down a long staircase into a dim basement and felt uneasy. There was no one there and nothing happened. I came back up.`;

const mythIdSet = new Set<string>(MYTH_CATALOG_IDS);

function getEnv(keys: string[]): string {
  for (const key of keys) {
    const value = process.env[key];
    if (typeof value !== 'string' || !value.trim()) continue;
    return value.trim();
  }
  return '';
}

function parseJson(content: string): Record<string, unknown> {
  const trimmed = content.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  return JSON.parse((fenced?.[1]?.trim() || trimmed) as string) as Record<string, unknown>;
}

function buildJobs(): Job[] {
  const fisherman = readFileSync(path.join(process.cwd(), 'tmp/runPatchAFishermanSisyphus.ts'), 'utf8');
  const fishermanMatch = fisherman.match(/const FISHERMAN[\s\S]*?content: `([\s\S]*?)`,/);
  const fishermanContent = fishermanMatch?.[1] ?? '';
  const sisyphusMatch = fisherman.match(/const SISYPHUS[\s\S]*?content: `([\s\S]*?)`,/);
  const sisyphusContent = sisyphusMatch?.[1] ?? '';

  const jobs: Job[] = [];
  for (let i = 1; i <= 5; i++) {
    jobs.push({
      phase: 'sisyphus_target',
      run_id: `sisyphus_r${i}`,
      title: 'Sisyphus positive',
      content: sisyphusContent,
      expect_myth: 'greek.sisyphus',
    });
  }
  jobs.push({
    phase: 'smoke_generic_descent',
    run_id: 'smoke_generic_r1',
    title: 'Generic descent negative',
    content: GENERIC_DESCENT,
    expect_myth: null,
  });
  jobs.push({
    phase: 'smoke_inanna',
    run_id: 'smoke_inanna_r1',
    title: 'Inanna smoke',
    content: INANNA_DREAM,
    expect_myth: 'sumerian.inanna_descent',
  });
  jobs.push({
    phase: 'smoke_fisherman',
    run_id: 'smoke_fisherman_r1',
    title: 'Fisherman smoke',
    content: fishermanContent,
    expect_myth: 'arabian.fisherman_and_jinni',
  });
  return jobs;
}

function collectArchetypeIds(raw: Record<string, unknown>): string[] {
  const rows = Array.isArray(raw.archetypes) ? raw.archetypes : [];
  return rows
    .map((row) =>
      row && typeof row === 'object' && typeof (row as { archetype_id?: unknown }).archetype_id === 'string'
        ? String((row as { archetype_id: string }).archetype_id).trim()
        : ''
    )
    .filter(Boolean);
}

async function extract(job: Job) {
  const supabaseUrl = getEnv(['EXPO_PUBLIC_SUPABASE_URL']).replace(/\/$/, '');
  const anon = getEnv(['EXPO_PUBLIC_SUPABASE_ANON_KEY']);
  const endpoint = getEnv(['EXPO_PUBLIC_CUSTOM_GPT_ENDPOINT']);
  const token =
    getEnv(['LIVE_SUPABASE_ACCESS_TOKEN']) ||
    (await (async () => {
      const email = getEnv(['LIVE_SUPABASE_EMAIL']);
      const password = getEnv(['LIVE_SUPABASE_PASSWORD']);
      const res = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: anon },
        body: JSON.stringify({ email, password }),
      });
      const text = await res.text();
      if (!res.ok) throw new Error(`auth ${res.status}: ${text.slice(0, 300)}`);
      return (JSON.parse(text) as { access_token?: string }).access_token || '';
    })());

  const system = buildDreamExtractionSystemPrompt();
  const user = buildDreamExtractionUserPrompt({
    title: job.title,
    date: '2026-07-27',
    content: job.content,
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
        { role: 'user', content: `${user}\n\n[patch_c11_run_id: ${job.run_id}:${randomUUID()}]` },
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
    return { ...job, ok: false, error: `proxy ${res.status}: ${text.slice(0, 500)}`, latency_ms };
  }
  const body = JSON.parse(text) as Record<string, unknown>;
  const content =
    (body.choices as Array<{ message?: { content?: string } }> | undefined)?.[0]?.message?.content ??
    (typeof body.content === 'string' ? body.content : '') ??
    '';
  const rawParsed = parseJson(String(content));
  const schema = validateStructuredTaskContent('dream_extraction', JSON.stringify(rawParsed));
  const stages = buildEchoBenchmarkStages(rawParsed, job.content);
  const catalogIds = new Set(listMythicCatalogIds());
  const rawMyth = Array.isArray(stages.raw_amplifications) ? stages.raw_amplifications : [];
  const postMyth = Array.isArray(stages.post_validation_amplifications)
    ? stages.post_validation_amplifications
    : [];
  const rawIds = rawMyth.map((m) =>
    m && typeof m === 'object' ? String((m as { catalog_id?: unknown }).catalog_id || '') : ''
  );
  const postIds = postMyth.map((m) =>
    m && typeof m === 'object' ? String((m as { catalog_id?: unknown }).catalog_id || '') : ''
  );
  const rawArchetypeIds = collectArchetypeIds(rawParsed);
  const bracketedArchetypeIds = rawArchetypeIds.filter((id) => /^\[.+\]$/.test(id));
  const mythIdsInArchetype = rawArchetypeIds.filter((id) => mythIdSet.has(id.replace(/^\[(.*)\]$/, '$1')));

  return {
    ...job,
    ok: true,
    latency_ms,
    schema_ok: schema.ok,
    schema_errors: schema.ok ? [] : schema.schemaErrors,
    raw_myth_ids: rawIds.filter(Boolean),
    post_myth_ids: postIds.filter(Boolean),
    unknown_raw_ids: rawIds.filter((id) => id && !catalogIds.has(id)),
    unknown_post_ids: postIds.filter((id) => id && !catalogIds.has(id)),
    raw_archetype_ids: rawArchetypeIds,
    bracketed_archetype_ids: bracketedArchetypeIds,
    myth_id_in_archetype: mythIdsInArchetype,
    myth_rejected: stages.mythic_rejected ?? [],
    ...stages,
  };
}

async function main() {
  if (DREAM_EXTRACTION_PROMPT_VERSION !== '4.1.5-C.1.1') {
    throw new Error(`Expected 4.1.5-C.1.1, got ${DREAM_EXTRACTION_PROMPT_VERSION}`);
  }
  const jobs = buildJobs();
  const outDir = path.join(
    process.cwd(),
    `tmp/patch-c11-benchmark-${new Date().toISOString().replace(/[:.]/g, '-')}`
  );
  mkdirSync(outDir, { recursive: true });

  const results = [];
  for (const job of jobs) {
    const result = await extract(job);
    results.push(result);
    writeFileSync(path.join(outDir, `${job.run_id}.json`), JSON.stringify(result, null, 2));
    console.log(`${job.run_id}: ok=${result.ok} schema=${result.schema_ok} post_myth=${JSON.stringify(result.post_myth_ids ?? [])}`);
  }

  const sisyphus = results.filter((r) => r.phase === 'sisyphus_target');
  const smoke = results.filter((r) => r.phase.startsWith('smoke_'));

  const summary = {
    prompt_id: DREAM_EXTRACTION_PROMPT_ID,
    prompt_version: DREAM_EXTRACTION_PROMPT_VERSION,
    schema_version: DREAM_EXTRACTION_SCHEMA_VERSION,
    myth_prompt_index_version: MYTHIC_PROMPT_INDEX_VERSION,
    myth_index_tokens: MYTHIC_PROMPT_INDEX_TOKEN_COUNT,
    provider_schema_tokens: DREAM_EXTRACTION_JSON_SCHEMA_TOKEN_COUNT,
    selectable_archetype_ids: SELECTABLE_ARCHETYPE_ID_COUNT,
    myth_catalog_ids: MYTH_CATALOG_ID_COUNT,
    outDir,
    sisyphus: {
      runs: sisyphus.length,
      completed: sisyphus.filter((r) => r.ok).length,
      schemaFails: sisyphus.filter((r) => !r.schema_ok).length,
      proxyFails: sisyphus.filter((r) => !r.ok).length,
      correct_post: sisyphus.filter((r) => r.post_myth_ids?.[0] === 'greek.sisyphus').length,
      wrong_post: sisyphus.filter(
        (r) => r.post_myth_ids?.length && r.post_myth_ids[0] !== 'greek.sisyphus'
      ).length,
      myth_in_archetype: sisyphus.filter((r) => (r.myth_id_in_archetype?.length ?? 0) > 0).length,
      bracketed_archetype: sisyphus.filter((r) => (r.bracketed_archetype_ids?.length ?? 0) > 0).length,
    },
    smoke: {
      runs: smoke.length,
      schemaFails: smoke.filter((r) => !r.schema_ok).length,
      proxyFails: smoke.filter((r) => !r.ok).length,
      cross_catalog_leaks: smoke.filter(
        (r) => (r.myth_id_in_archetype?.length ?? 0) > 0 || (r.bracketed_archetype_ids?.length ?? 0) > 0
      ).length,
    },
    total_runs: results.length,
  };

  writeFileSync(path.join(outDir, 'summary.json'), JSON.stringify(summary, null, 2));
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
