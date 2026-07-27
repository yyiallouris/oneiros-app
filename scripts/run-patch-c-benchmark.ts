/**
 * Patch C benchmark — no tuning between runs.
 * Order: Inanna×7 → competitor contrast → Fisherman/Sisyphus/Orpheus×3 → five-dream suite×3.
 *
 * Run: bash scripts/run-patch-c-benchmark.sh
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
import { getMythicCatalogEntry, listMythicCatalogIds } from '../src/ai/catalogs/mythicNarrativeCatalog';
import { MYTHIC_PROMPT_INDEX_TOKEN_COUNT, MYTHIC_PROMPT_INDEX_VERSION } from '../src/ai/catalogs/mythicPromptIndex';
import { validateStructuredTaskContent } from '../src/ai/structuredTaskValidation';
import { buildEchoBenchmarkStages } from './lib/echoBenchmarkStages';

type Job = { phase: string; run_id: string; title: string; content: string; expect_myth?: string | null };

const INANNA_DREAM = `Κατέβαινα σε ένα υπόγειο παλάτι περνώντας από επτά διαδοχικές πόρτες. Σε κάθε πόρτα ένας φύλακας μου ζητούσε να αφήσω κάτι: πρώτα το δαχτυλίδι μου, μετά το παλτό, τα παπούτσια, μια κάρτα με το όνομά μου, το περιδέραιο, τη ζώνη και τέλος ένα μικρό στέμμα που δεν ήξερα ότι φορούσα. Στην τελευταία αίθουσα στεκόταν μια σιωπηλή βασίλισσα. Με κοίταξε χωρίς να μιλήσει και έπεσα στο πάτωμα σαν να είχε φύγει όλη η ζωή από μέσα μου. Αργότερα δύο μικρές μορφές έριξαν νερό στο πρόσωπό μου και ξύπνησα μέσα στο όνειρο. Ανέβηκα ξανά από τις επτά πόρτες, αλλά δεν μπορούσα να πάρω πίσω όλα όσα είχα αφήσει. Βγήκα στην επιφάνεια φορώντας μόνο ένα απλό λευκό κορδόνι στον καρπό.`;

const HERO_TWINS_DREAMS = [
  `My twin brother and I descended into a cavern of bone lords who set impossible ball games and burning houses. They killed us in a furnace, but we planned it: our bodies were ground to ash and thrown in a river, yet we reassembled and returned to defeat the lords of the underworld.`,
  `Two brothers entered Xibalba together. The lords tricked them with false seats and blades, then sacrificed them in a fiery pit. From the river they revived themselves, humiliated the underworld rulers, and rose as celestial lights.`,
  `We were twin heroes sent to the house of death. Every trial was a trap. We let ourselves die on purpose, then came back and turned the lords' own games against them until they fled.`,
];

const PSYCHE_DREAMS = [
  `I lived with a lover I was forbidden to see. At night he came in darkness and warned me never to look. I lit a lamp, saw him, and he vanished. A voice imposed impossible tasks on me, including a descent to bring back a box from below. After enduring each task we reunited changed.`,
  `A hidden husband forbade me to see his face. I broke the taboo with a lamp and lost him. I had to complete a series of imposed labors, including going underground for a forbidden vessel, before we could meet again.`,
  `I was married in secret to someone I could not behold. Curiosity made me look; he left. I was sent on punishing errands, one requiring a journey to the realm below, and only then was union restored.`,
];

const GENERIC_DESCENT_DREAMS = [
  `I walked down a long staircase into a dim basement and felt uneasy. There was no one there and nothing happened. I came back up.`,
  `I dreamed of going underground through a tunnel. It was cold and quiet. I turned around before reaching the end.`,
  `There was a dark stairwell in an old building. I descended a few steps, felt nervous, and went back to my room.`,
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

function buildJobs(): Job[] {
  const jobs: Job[] = [];
  for (let i = 1; i <= 7; i++) {
    jobs.push({
      phase: 'inanna_target',
      run_id: `inanna_r${i}`,
      title: 'Inanna target',
      content: INANNA_DREAM,
      expect_myth: 'sumerian.inanna_descent',
    });
  }
  HERO_TWINS_DREAMS.forEach((content, i) => {
    jobs.push({
      phase: 'competitor_hero_twins',
      run_id: `hero_twins_r${i + 1}`,
      title: 'Hero Twins positive',
      content,
      expect_myth: 'kiche_maya.hero_twins_xibalba',
    });
  });
  PSYCHE_DREAMS.forEach((content, i) => {
    jobs.push({
      phase: 'competitor_psyche',
      run_id: `psyche_r${i + 1}`,
      title: 'Psyche positive',
      content,
      expect_myth: 'greek.psyche_eros',
    });
  });
  GENERIC_DESCENT_DREAMS.forEach((content, i) => {
    jobs.push({
      phase: 'competitor_generic_descent',
      run_id: `generic_descent_r${i + 1}`,
      title: 'Generic descent negative',
      content,
      expect_myth: null,
    });
  });

  const fisherman = readFileSync(path.join(process.cwd(), 'tmp/runPatchAFishermanSisyphus.ts'), 'utf8');
  const fishermanMatch = fisherman.match(/const FISHERMAN[\s\S]*?content: `([\s\S]*?)`,/);
  const fishermanContent = fishermanMatch?.[1] ?? '';
  const sisyphusMatch = fisherman.match(/const SISYPHUS[\s\S]*?content: `([\s\S]*?)`,/);
  const sisyphusContent = sisyphusMatch?.[1] ?? '';

  const acceptance = readFileSync(
    path.join(process.cwd(), 'docs/ONEIROS_5_DREAM_ACCEPTANCE_SET.jsonl'),
    'utf8'
  );
  const orpheusLine = acceptance.split('\n').find((l) => l.includes('C1_two_archetypes'));
  const orpheusDream = orpheusLine ? (JSON.parse(orpheusLine) as { dream: string }).dream : '';

  for (let i = 1; i <= 3; i++) {
    jobs.push({
      phase: 'positive_fisherman',
      run_id: `fisherman_r${i}`,
      title: 'Fisherman positive',
      content: fishermanContent,
      expect_myth: 'arabian.fisherman_and_jinni',
    });
    jobs.push({
      phase: 'positive_sisyphus',
      run_id: `sisyphus_r${i}`,
      title: 'Sisyphus positive',
      content: sisyphusContent,
      expect_myth: 'greek.sisyphus',
    });
    jobs.push({
      phase: 'positive_orpheus',
      run_id: `orpheus_r${i}`,
      title: 'Orpheus positive',
      content: orpheusDream,
      expect_myth: 'greek.orpheus_eurydice',
    });
  }

  acceptance
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .forEach((line) => {
      const row = JSON.parse(line) as {
        id: string;
        dream: string;
        expected: { required_myth_catalog_id: string | null };
      };
      for (let i = 1; i <= 3; i++) {
        jobs.push({
          phase: 'five_dream_suite',
          run_id: `${row.id}_r${i}`,
          title: row.id,
          content: row.dream,
          expect_myth: row.expected.required_myth_catalog_id,
        });
      }
    });

  return jobs;
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
        { role: 'user', content: `${user}\n\n[patch_c_run_id: ${job.run_id}:${randomUUID()}]` },
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
    myth_rejected: stages.mythic_rejected,
    ...stages,
  };
}

function summarizePhase(phase: string, runs: Awaited<ReturnType<typeof extract>>[]) {
  const phaseRuns = runs.filter((r) => r.phase === phase);
  const rawHits = (id: string) =>
    phaseRuns.filter((r) => r.ok && r.raw_myth_ids?.includes(id)).length;
  const postHits = (id: string) =>
    phaseRuns.filter((r) => r.ok && r.post_myth_ids?.includes(id)).length;
  const emptyPost = phaseRuns.filter((r) => r.ok && (r.post_myth_ids?.length ?? 0) === 0).length;
  const schemaFails = phaseRuns.filter((r) => r.ok && !r.schema_ok).length;
  const proxyFails = phaseRuns.filter((r) => !r.ok).length;
  const unknown = phaseRuns.filter(
    (r) => r.ok && ((r.unknown_raw_ids?.length ?? 0) > 0 || (r.unknown_post_ids?.length ?? 0) > 0)
  ).length;

  if (phase === 'inanna_target') {
    return {
      phase,
      runs: phaseRuns.length,
      inanna_raw: rawHits('sumerian.inanna_descent'),
      inanna_post: postHits('sumerian.inanna_descent'),
      hero_twins_post: postHits('kiche_maya.hero_twins_xibalba'),
      psyche_post: postHits('greek.psyche_eros'),
      schemaFails,
      proxyFails,
      unknown,
    };
  }
  if (phase.startsWith('competitor_')) {
    const expect = phaseRuns[0]?.expect_myth;
    return {
      phase,
      runs: phaseRuns.length,
      expect_myth: expect,
      correct_post: expect ? postHits(expect) : emptyPost,
      schemaFails,
      proxyFails,
      unknown,
    };
  }
  if (phase.startsWith('positive_')) {
    const expect = phaseRuns[0]?.expect_myth ?? '';
    const wrongPost = phaseRuns.filter(
      (r) => r.ok && (r.post_myth_ids?.length ?? 0) > 0 && !r.post_myth_ids?.includes(expect)
    ).length;
    return {
      phase,
      runs: phaseRuns.length,
      expect_myth: expect,
      correct_post: postHits(expect),
      wrong_post: wrongPost,
      schemaFails,
      proxyFails,
      unknown,
    };
  }
  return { phase, runs: phaseRuns.length, schemaFails, proxyFails, unknown };
}

async function main() {
  if (DREAM_EXTRACTION_PROMPT_VERSION !== '4.1.5-C') {
    throw new Error(`Expected 4.1.5-C, got ${DREAM_EXTRACTION_PROMPT_VERSION}`);
  }
  const jobs = buildJobs();
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outDir = path.join(process.cwd(), 'tmp', `patch-c-benchmark-${stamp}`);
  mkdirSync(outDir, { recursive: true });

  const runs: Awaited<ReturnType<typeof extract>>[] = [];
  for (const job of jobs) {
    const result = await extract(job);
    runs.push(result);
    writeFileSync(path.join(outDir, `${job.run_id}.json`), JSON.stringify(result, null, 2));
  }

  const phases = [...new Set(jobs.map((j) => j.phase))];
  const summary = {
    prompt_id: DREAM_EXTRACTION_PROMPT_ID,
    prompt_version: DREAM_EXTRACTION_PROMPT_VERSION,
    schema_version: DREAM_EXTRACTION_SCHEMA_VERSION,
    myth_prompt_index_version: MYTHIC_PROMPT_INDEX_VERSION,
    myth_index_tokens: MYTHIC_PROMPT_INDEX_TOKEN_COUNT,
    outDir,
    phases: phases.map((p) => summarizePhase(p, runs)),
    total_runs: runs.length,
    total_proxy_failures: runs.filter((r) => !r.ok).length,
    total_schema_failures: runs.filter((r) => r.ok && !r.schema_ok).length,
  };
  writeFileSync(path.join(outDir, 'summary.json'), JSON.stringify(summary, null, 2));
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
