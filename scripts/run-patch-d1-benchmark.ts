/**
 * Patch D.1 Hero precision benchmark.
 * A: Sisyphus dream ×5 (Hero 0/5, myth >=4/5)
 * B: Hero-positive dreams ×5 (Hero >=4/5)
 * C: effort-without-outcome negatives ×5 (Hero 0/5)
 *
 * Run: bash scripts/run-patch-d1-benchmark.sh
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
import { ARCHETYPE_CATALOG_VERSION } from '../src/ai/catalogs/archetypeCatalog.v1';
import { buildDreamExtractionResponseFormat } from '../src/ai/dreamExtractionResponseFormat';
import { validateStructuredTaskContent } from '../src/ai/structuredTaskValidation';
import { buildEchoBenchmarkStages } from './lib/echoBenchmarkStages';
import { patchD1EngineeringDecision } from './lib/patchD1Decision';

type Job = {
  phase: 'sisyphus_target' | 'hero_positive' | 'hero_negative';
  run_id: string;
  title: string;
  content: string;
  expect_myth?: string | null;
};

const HERO_POSITIVE_DREAMS = [
  `I ran into a smoke-filled apartment and found a child trapped behind a warped door. The heat pressed against my chest, but I forced the frame until it gave and carried the child down the stairs into clean air. When we reached the street, neighbors rushed forward and the child clung to me, breathing again.`,
  `A narrow stone bridge over a chasm had collapsed halfway. I tied a rope, crossed hand over hand above the drop, and reached the other side where a sealed gate blocked the village water supply. I broke the rusted lock and water rushed through the channel again.`,
  `Three armed guards surrounded a chained prisoner in a courtyard. I challenged the captain directly, disarmed him in the struggle, and freed the prisoner while the others backed away. We walked out through the main gate together before dawn.`,
  `I entered a labyrinth to retrieve a buried talisman that could restore speech to my brother. After facing the guardian at the center, I took the talisman and returned. At home my brother spoke his first word in years.`,
  `The ferry would not leave until someone retrieved the lost oar from the rapids. I waded into the current, recovered the oar, and brought it back. The ferryman nodded and carried all of us across to the far bank.`,
];

const HERO_NEGATIVE_DREAMS = [
  `I kept climbing a long staircase in an office tower. Every time I reached what looked like the top landing, the steps re-formed beneath me and I was back on the same floor number. My legs burned, but nothing about the building changed.`,
  `In a warehouse I stacked heavy crates from morning until night. Each time I finished a wall of boxes, new crates appeared at the bottom and the completed wall vanished. I never reached the exit door.`,
  `I tried to swim across a cold lake toward a distant light. Halfway there my arms failed and the current pushed me back to the same muddy shore where I had started, soaked and unchanged.`,
  `I shouted at a locked gate in a courtyard, demanding to be let through. Guards watched silently and never moved. My voice grew hoarse, but the gate stayed shut and I remained outside.`,
  `I dug a trench around a house all night. By morning the soil had settled back into place and the house looked exactly as it had before. I dropped the shovel and sat down, exhausted.`,
];

function getEnv(keys: string[]): string {
  for (const key of keys) {
    const value = process.env[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
}

function parseJson(content: string): Record<string, unknown> {
  const trimmed = content.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  return JSON.parse((fenced?.[1]?.trim() || trimmed) as string) as Record<string, unknown>;
}

function loadSisyphusDream(): string {
  const fisherman = readFileSync(path.join(process.cwd(), 'tmp/runPatchAFishermanSisyphus.ts'), 'utf8');
  const match = fisherman.match(/const SISYPHUS[\s\S]*?content: `([\s\S]*?)`,/);
  if (!match?.[1]) throw new Error('Could not load Sisyphus dream from runPatchAFishermanSisyphus.ts');
  return match[1];
}

function buildJobs(sisyphusDream: string): Job[] {
  const jobs: Job[] = [];
  for (let i = 1; i <= 5; i++) {
    jobs.push({
      phase: 'sisyphus_target',
      run_id: `sisyphus_r${i}`,
      title: 'Sisyphus negative Hero',
      content: sisyphusDream,
      expect_myth: 'greek.sisyphus',
    });
  }
  HERO_POSITIVE_DREAMS.forEach((content, i) => {
    jobs.push({
      phase: 'hero_positive',
      run_id: `hero_positive_r${i + 1}`,
      title: `Hero positive ${i + 1}`,
      content,
    });
  });
  HERO_NEGATIVE_DREAMS.forEach((content, i) => {
    jobs.push({
      phase: 'hero_negative',
      run_id: `hero_negative_r${i + 1}`,
      title: `Hero negative ${i + 1}`,
      content,
    });
  });
  return jobs;
}

function heroPostCount(stages: ReturnType<typeof buildEchoBenchmarkStages>): number {
  return stages.post_validation_archetypes.filter((a) => a.archetype_id === 'hero').length;
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
        { role: 'user', content: `${user}\n\n[patch_d1_run_id: ${job.run_id}:${randomUUID()}]` },
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
  const postMyth = stages.post_validation_amplifications
    .map((m) => (typeof m.catalog_id === 'string' ? m.catalog_id : ''))
    .filter(Boolean);
  const heroRaw = Array.isArray(rawParsed.archetypes)
    ? (rawParsed.archetypes as Array<{ archetype_id?: string }>).filter((a) => a.archetype_id === 'hero')
    : [];
  const heroRejected = stages.archetype_rejected.filter((r) => r.archetype_id === 'hero');

  return {
    ...job,
    ok: true,
    latency_ms,
    schema_ok: schema.ok,
    schema_errors: schema.ok ? [] : schema.schemaErrors,
    post_myth_ids: postMyth,
    hero_post: heroPostCount(stages) > 0,
    hero_raw_count: heroRaw.length,
    hero_rejected: heroRejected,
    raw_hero_objects: heroRaw,
    post_validation_archetypes: stages.post_validation_archetypes,
    validator_decisions: stages.validator_decisions,
    archetype_rejected: stages.archetype_rejected,
    ...stages,
  };
}

async function main() {
  if (DREAM_EXTRACTION_PROMPT_VERSION !== '4.1.6-D.1') {
    throw new Error(`Expected 4.1.6-D.1, got ${DREAM_EXTRACTION_PROMPT_VERSION}`);
  }
  const sisyphusDream = loadSisyphusDream();
  const jobs = buildJobs(sisyphusDream);
  const outDir = path.join(
    process.cwd(),
    `tmp/patch-d1-benchmark-${new Date().toISOString().replace(/[:.]/g, '-')}`
  );
  mkdirSync(outDir, { recursive: true });

  const results = [];
  for (const job of jobs) {
    const result = await extract(job);
    results.push(result);
    writeFileSync(path.join(outDir, `${job.run_id}.json`), JSON.stringify(result, null, 2));
    console.log(
      `${job.run_id}: hero_post=${result.hero_post ?? false} post_myth=${JSON.stringify(result.post_myth_ids ?? [])}`
    );
  }

  const sisyphus = results.filter((r) => r.phase === 'sisyphus_target');
  const heroPositive = results.filter((r) => r.phase === 'hero_positive');
  const heroNegative = results.filter((r) => r.phase === 'hero_negative');

  const summary = {
    prompt_id: DREAM_EXTRACTION_PROMPT_ID,
    prompt_version: DREAM_EXTRACTION_PROMPT_VERSION,
    schema_version: DREAM_EXTRACTION_SCHEMA_VERSION,
    archetype_catalog_version: ARCHETYPE_CATALOG_VERSION,
    outDir,
    sisyphus: {
      runs: sisyphus.length,
      hero_post: sisyphus.filter((r) => r.hero_post).length,
      hero_post_pass: sisyphus.filter((r) => r.hero_post).length === 0,
      myth_correct_post: sisyphus.filter((r) => r.post_myth_ids?.[0] === 'greek.sisyphus').length,
      myth_pass_min_4_of_5:
        sisyphus.filter((r) => r.post_myth_ids?.[0] === 'greek.sisyphus').length >= 4,
      schemaFails: sisyphus.filter((r) => !r.schema_ok).length,
      proxyFails: sisyphus.filter((r) => !r.ok).length,
    },
    hero_positive: {
      runs: heroPositive.length,
      hero_post: heroPositive.filter((r) => r.hero_post).length,
      hero_post_pass: heroPositive.filter((r) => r.hero_post).length >= 4,
      schemaFails: heroPositive.filter((r) => !r.schema_ok).length,
      proxyFails: heroPositive.filter((r) => !r.ok).length,
    },
    hero_negative: {
      runs: heroNegative.length,
      hero_post: heroNegative.filter((r) => r.hero_post).length,
      hero_post_pass: heroNegative.filter((r) => r.hero_post).length === 0,
      schemaFails: heroNegative.filter((r) => !r.schema_ok).length,
      proxyFails: heroNegative.filter((r) => !r.ok).length,
    },
    overall_pass:
      sisyphus.filter((r) => r.hero_post).length === 0 &&
      sisyphus.filter((r) => r.post_myth_ids?.[0] === 'greek.sisyphus').length >= 4 &&
      heroPositive.filter((r) => r.hero_post).length >= 4 &&
      heroNegative.filter((r) => r.hero_post).length === 0 &&
      results.every((r) => r.ok && r.schema_ok),
    total_runs: results.length,
    engineering_decision: patchD1EngineeringDecision(
      sisyphus.filter((r) => r.hero_post).length === 0 &&
        sisyphus.filter((r) => r.post_myth_ids?.[0] === 'greek.sisyphus').length >= 4 &&
        heroPositive.filter((r) => r.hero_post).length >= 4 &&
        heroNegative.filter((r) => r.hero_post).length === 0 &&
        results.every((r) => r.ok && r.schema_ok)
    ),
  };

  writeFileSync(path.join(outDir, 'summary.json'), JSON.stringify(summary, null, 2));
  console.log(JSON.stringify(summary, null, 2));

  const { execSync } = await import('child_process');
  execSync(`npx --yes tsx scripts/build-d1-reviewer-packet.ts "${outDir}"`, {
    stdio: 'inherit',
    cwd: process.cwd(),
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
