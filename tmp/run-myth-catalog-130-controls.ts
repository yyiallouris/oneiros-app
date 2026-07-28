import { createHash, randomUUID } from 'crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';
import {
  buildDreamExtractionSystemPrompt,
  buildDreamExtractionUserPrompt,
  DREAM_EXTRACTION_PROMPT_ID,
  DREAM_EXTRACTION_PROMPT_VERSION,
  DREAM_EXTRACTION_SCHEMA_VERSION,
  DREAM_EXTRACTION_TEMPERATURE,
  DREAM_EXTRACTION_TOKEN_LIMIT,
} from '../src/ai/dreamExtractionPrompt';
import { MYTHIC_CATALOG_BY_ID, MYTHIC_CATALOG_VERSION } from '../src/ai/catalogs/mythicNarrativeCatalog';
import { MYTHIC_PROMPT_INDEX, MYTHIC_PROMPT_INDEX_VERSION } from '../src/ai/catalogs/mythicPromptIndex';
import { estimateAiCallCost } from '../src/billing/aiPricing';
import { buildEchoBenchmarkStages } from '../scripts/lib/echoBenchmarkStages';

type Fixture = {
  id: string;
  label: string;
  dream: string;
  expectedMythTitle: string | null;
};

type RunArtifact = {
  run_id: string;
  fixture_id: string;
  prompt_id: string;
  prompt_version: string;
  schema_version: number;
  myth_catalog_version: string;
  myth_prompt_index_version: number;
  myth_catalog_hash: string;
  myth_prompt_index_hash: string;
  model: string | null;
  raw_dream_only: true;
  schema_ok: boolean;
  latency_ms: number;
  estimated_usd: number | null;
  archetype_labels: string[];
  archetype_ids: string[];
  myth_titles: string[];
  myth_catalog_ids: string[];
  expected_myth_title: string | null;
  pass: boolean;
  stage_file: string;
  error?: {
    message: string;
  };
};

const FIXTURES: Fixture[] = [
  {
    id: 'babel_positive',
    label: 'Canonical Babel positive',
    expectedMythTitle: 'The Tower of Babel',
    dream: `A whole city spoke one language and worked together on a tower that was meant to reach heaven. The builders all understood one another perfectly at first, and the work rose quickly because every command was shared by everyone. Then, in the middle of the project, language itself broke apart. People began hearing the same words as different meanings, then speaking in ways the others could no longer understand. Orders failed, tools were passed to the wrong workers, and the project stalled because no one could coordinate. Groups separated from one another and began leaving the city in confusion, and the tower remained unfinished.`,
  },
  {
    id: 'babel_negative',
    label: 'Canonical Babel negative',
    expectedMythTitle: null,
    dream: `I climbed a solitary tower alone at night. At the top I received a private revelation that changed how I saw my own life, and then I came back down by myself before dawn. No one else was there, no shared language was disturbed, and nothing happened to any collective voice or building effort.`,
  },
  {
    id: 'cronus_positive',
    label: 'Canonical Cronus positive',
    expectedMythTitle: 'Cronus and the Devouring of His Children',
    dream: `An old king-father had been told that the younger generation would replace him, and he lived in terror of losing his throne. Every time one of his children was born, he seized that younger life and locked it away inside himself so that no successor could grow. One child was hidden in secret and spared from the father’s reach. Years later that surviving child returned in strength, confronted the father, and forced the contained younger lives back out into the world. Once the hidden children were released, the father’s old order collapsed and his rule was overthrown.`,
  },
  {
    id: 'cronus_negative',
    label: 'Canonical Cronus negative',
    expectedMythTitle: null,
    dream: `I argued with my father, who was also the local king, about how the household should be run. He wanted obedience and I wanted to leave, but there was no threat of succession, no hidden surviving child, and no younger life that had been consumed or contained. It was only an ordinary conflict with authority inside the family.`,
  },
  {
    id: 'orpheus_positive',
    label: 'Canonical Orpheus positive',
    expectedMythTitle: 'Orpheus and Eurydice',
    dream: `The woman I loved had been lost beyond the boundary of death, and I crossed into that lower place to bring her back. A guide agreed that she could follow me to the light on one condition: I was not allowed to turn and look at her until we had fully crossed the threshold. I began the return and heard her footsteps behind me, but doubt overcame me just before we reached the world above. I turned too soon, and in that moment I lost her a second time. My attempt at recovery failed at the final threshold.`,
  },
  {
    id: 'psyche_positive',
    label: 'Canonical Eros and Psyche positive',
    expectedMythTitle: 'Eros and Psyche',
    dream: `I was living in secret union with a hidden lover whose face I had been forbidden to see. I was told that trust itself was the condition, but I broke the taboo and looked anyway. The lover vanished and I lost that relationship at once. After that I was given a series of imposed tasks that had to be completed if I wanted reunion. The last task required a descent below, and only after those ordeals was reunion and transformation possible.`,
  },
  {
    id: 'demeter_positive',
    label: 'Canonical Demeter and Persephone positive',
    expectedMythTitle: 'Demeter and Persephone',
    dream: `A young daughter-life had been taken into a lower realm, and the force that kept the fields fertile withdrew from the world in grief. Seed and fruit bound the girl to that place below, so she could not simply be returned intact. A mediated bargain allowed her to come back, but only partially, and her return remained cyclical rather than complete. Each time she went below, the world became barren, and each time she rose again, fertility returned in season.`,
  },
];

function loadDotenvValue(key: string): string | undefined {
  const envPath = path.join(process.cwd(), '.env');
  if (!existsSync(envPath)) return undefined;
  const raw = readFileSync(envPath, 'utf8');
  const match = raw.match(new RegExp(`^${key}\\s*=\\s*(.*)$`, 'm'));
  if (!match) return undefined;
  return match[1].trim().replace(/^['"]|['"]$/g, '');
}

function getEnv(keys: string[]): string {
  for (const key of keys) {
    const value = process.env[key] ?? loadDotenvValue(key);
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
}

function sha16(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex').slice(0, 16);
}

function parseJson(content: string): Record<string, unknown> {
  const trimmed = content.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fenced?.[1]?.trim() || trimmed;
  return JSON.parse(raw) as Record<string, unknown>;
}

function firstString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function labelsFromPost(post: ReturnType<typeof buildEchoBenchmarkStages>): string[] {
  return post.post_validation_archetypes
    .map((row) => firstString(row.canonical_label))
    .filter((row): row is string => row != null);
}

function idsFromPost(post: ReturnType<typeof buildEchoBenchmarkStages>): string[] {
  return post.post_validation_archetypes
    .map((row) => firstString(row.archetype_id))
    .filter((row): row is string => row != null);
}

function mythTitlesFromPost(post: ReturnType<typeof buildEchoBenchmarkStages>): string[] {
  return post.post_validation_amplifications
    .map((row) => firstString(row.title))
    .filter((row): row is string => row != null);
}

function mythIdsFromPost(post: ReturnType<typeof buildEchoBenchmarkStages>): string[] {
  return post.post_validation_amplifications
    .map((row) => firstString(row.catalog_id))
    .filter((row): row is string => row != null);
}

async function main() {
  if (DREAM_EXTRACTION_TEMPERATURE !== 0) {
    throw new Error(`Expected temperature 0, got ${DREAM_EXTRACTION_TEMPERATURE}`);
  }

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

  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outDir = path.join(process.cwd(), 'tmp', `myth-catalog-130-controls-${stamp}`);
  mkdirSync(outDir, { recursive: true });

  async function callProxy(payload: Record<string, unknown>) {
    const started = Date.now();
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: anon,
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    const text = await res.text();
    const latencyMs = Date.now() - started;
    if (!res.ok) throw new Error(`proxy ${res.status}: ${text.slice(0, 800)}`);
    const body = JSON.parse(text) as Record<string, unknown>;
    const content =
      (body.choices as Array<{ message?: { content?: string } }> | undefined)?.[0]?.message?.content ??
      (typeof body.content === 'string' ? body.content : '') ??
      (typeof body.text === 'string' ? body.text : '');
    const costField = body.ai_call_cost ?? body.cost ?? null;
    const estimated =
      costField && typeof costField === 'object'
        ? costField
        : estimateAiCallCost(body, typeof body.provider === 'string' ? body.provider : 'openai');
    return { body, content: String(content), latencyMs, cost: estimated };
  }

  console.log(
    JSON.stringify(
      {
        phase: 'myth_catalog_130_controls',
        fixtures: FIXTURES.length,
        outDir,
        prompt_id: DREAM_EXTRACTION_PROMPT_ID,
        prompt_version: DREAM_EXTRACTION_PROMPT_VERSION,
        schema_version: DREAM_EXTRACTION_SCHEMA_VERSION,
        myth_catalog_version: MYTHIC_CATALOG_VERSION,
        myth_prompt_index_version: MYTHIC_PROMPT_INDEX_VERSION,
        myth_catalog_hash: sha16(JSON.stringify(MYTHIC_CATALOG_BY_ID)),
        myth_prompt_index_hash: sha16(MYTHIC_PROMPT_INDEX),
      },
      null,
      2
    )
  );

  const runs: RunArtifact[] = [];
  for (const fixture of FIXTURES) {
    const runId = `${fixture.id}_${randomUUID().slice(0, 8)}`;
    const stageFile = path.join(outDir, `${runId}.json`);
    try {
      const user = `${buildDreamExtractionUserPrompt({
        date: '2026-07-28',
        content: fixture.dream,
        finalInterpretation: null,
        debugInterpretiveEchoes: false,
        dreamLanguage: 'en',
      })}\n\n[myth_catalog_130_control_run_id: ${randomUUID()}]`;

      const { body, content, latencyMs, cost } = await callProxy({
        task: 'dream_extraction',
        model: 'gpt-5.4-mini',
        messages: [
          { role: 'system', content: buildDreamExtractionSystemPrompt() },
          { role: 'user', content: user },
        ],
        temperature: DREAM_EXTRACTION_TEMPERATURE,
        max_completion_tokens: DREAM_EXTRACTION_TOKEN_LIMIT,
        max_tokens: DREAM_EXTRACTION_TOKEN_LIMIT,
        response_format: { type: 'json_object' },
      });

      const rawParsed = parseJson(content);
      const post = buildEchoBenchmarkStages(rawParsed, fixture.dream);
      const archetypeLabels = labelsFromPost(post);
      const mythTitles = mythTitlesFromPost(post);
      const model = firstString(body.model);
      const estimatedUsd =
        cost && typeof cost === 'object' && typeof (cost as { estimatedUsd?: unknown }).estimatedUsd === 'number'
          ? ((cost as { estimatedUsd: number }).estimatedUsd ?? null)
          : null;
      const pass =
        fixture.expectedMythTitle == null
          ? mythTitles.length === 0
          : mythTitles[0] === fixture.expectedMythTitle;
      const artifact: RunArtifact = {
        run_id: runId,
        fixture_id: fixture.id,
        prompt_id: DREAM_EXTRACTION_PROMPT_ID,
        prompt_version: DREAM_EXTRACTION_PROMPT_VERSION,
        schema_version: DREAM_EXTRACTION_SCHEMA_VERSION,
        myth_catalog_version: MYTHIC_CATALOG_VERSION,
        myth_prompt_index_version: MYTHIC_PROMPT_INDEX_VERSION,
        myth_catalog_hash: sha16(JSON.stringify(MYTHIC_CATALOG_BY_ID)),
        myth_prompt_index_hash: sha16(MYTHIC_PROMPT_INDEX),
        model,
        raw_dream_only: true,
        schema_ok: true,
        latency_ms: latencyMs,
        estimated_usd: estimatedUsd,
        archetype_labels: archetypeLabels,
        archetype_ids: idsFromPost(post),
        myth_titles: mythTitles,
        myth_catalog_ids: mythIdsFromPost(post),
        expected_myth_title: fixture.expectedMythTitle,
        pass,
        stage_file: stageFile,
      };
      writeFileSync(
        artifact.stage_file,
        JSON.stringify(
          {
            ...artifact,
            validator_decisions: post.validator_decisions,
            archetype_rejected: post.archetype_rejected,
            mythic_validator_logs: post.mythic_validator_logs,
            mythic_rejected: post.mythic_rejected,
            post_validation_archetypes: post.post_validation_archetypes,
            post_validation_amplifications: post.post_validation_amplifications,
          },
          null,
          2
        )
      );
      console.log(
        `${fixture.id}: expected=${JSON.stringify(fixture.expectedMythTitle)} myths=${JSON.stringify(mythTitles)} pass=${pass}`
      );
      runs.push(artifact);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const artifact: RunArtifact = {
        run_id: runId,
        fixture_id: fixture.id,
        prompt_id: DREAM_EXTRACTION_PROMPT_ID,
        prompt_version: DREAM_EXTRACTION_PROMPT_VERSION,
        schema_version: DREAM_EXTRACTION_SCHEMA_VERSION,
        myth_catalog_version: MYTHIC_CATALOG_VERSION,
        myth_prompt_index_version: MYTHIC_PROMPT_INDEX_VERSION,
        myth_catalog_hash: sha16(JSON.stringify(MYTHIC_CATALOG_BY_ID)),
        myth_prompt_index_hash: sha16(MYTHIC_PROMPT_INDEX),
        model: null,
        raw_dream_only: true,
        schema_ok: false,
        latency_ms: 0,
        estimated_usd: null,
        archetype_labels: [],
        archetype_ids: [],
        myth_titles: [],
        myth_catalog_ids: [],
        expected_myth_title: fixture.expectedMythTitle,
        pass: false,
        stage_file: stageFile,
        error: { message },
      };
      writeFileSync(stageFile, JSON.stringify(artifact, null, 2));
      console.log(`${fixture.id}: ERROR ${message}`);
      runs.push(artifact);
    }
  }

  const summaryFile = path.join(outDir, 'summary.json');
  writeFileSync(
    summaryFile,
    JSON.stringify(
      {
        title: 'Oneiros myth catalog 1.3.0 controls',
        generated_at: new Date().toISOString(),
        prompt_id: DREAM_EXTRACTION_PROMPT_ID,
        prompt_version: DREAM_EXTRACTION_PROMPT_VERSION,
        schema_version: DREAM_EXTRACTION_SCHEMA_VERSION,
        myth_catalog_version: MYTHIC_CATALOG_VERSION,
        myth_prompt_index_version: MYTHIC_PROMPT_INDEX_VERSION,
        myth_catalog_hash: sha16(JSON.stringify(MYTHIC_CATALOG_BY_ID)),
        myth_prompt_index_hash: sha16(MYTHIC_PROMPT_INDEX),
        raw_dream_only: true,
        fixtures: FIXTURES.map((fixture) => {
          const run = runs.find((item) => item.fixture_id === fixture.id);
          return {
            fixture_id: fixture.id,
            label: fixture.label,
            expected_myth_title: fixture.expectedMythTitle,
            myth_titles: run?.myth_titles ?? [],
            myth_catalog_ids: run?.myth_catalog_ids ?? [],
            archetype_labels: run?.archetype_labels ?? [],
            pass: run?.pass ?? false,
            stage_file: run?.stage_file ?? null,
            error: run?.error ?? null,
          };
        }),
        run_files: runs.map((run) => run.stage_file),
      },
      null,
      2
    )
  );

  console.log(`summary_file=${summaryFile}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack || error.message : String(error));
  process.exit(1);
});
