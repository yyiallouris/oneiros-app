/**
 * v4.1.4 production smoke: 1 positive + 1 ordinary negative via live proxy.
 */
import { mkdirSync, writeFileSync } from 'fs';
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
import { validateStructuredTaskContent } from '../src/ai/structuredTaskValidation';
import { validateArchetypalEchoes } from '../src/ai/validators/archetypalEchoValidator';
import { validateClosedCatalogMythicEchoes } from '../src/ai/validators/mythicCatalogValidator';
import { listMythicCatalogIds } from '../src/ai/catalogs/mythicNarrativeCatalog';
import { buildEchoBenchmarkStages } from '../scripts/lib/echoBenchmarkStages';

const POSITIVE = {
  id: 'smoke_copper_vessel_positive',
  title: 'Copper vessel smoke positive',
  content: `I found a sealed copper vessel beside a dry lake. When I broke the seal, smoke rose and formed a giant who threatened me. I laughed and said I did not believe he had ever fit inside. He shrank into smoke and entered the vessel to prove it. I closed the lid and sealed it with wax again.`,
};

const ORDINARY = {
  id: 'smoke_ordinary_negative',
  title: 'Ordinary office negative',
  content: `I was at my desk sorting emails. The coffee machine beeped. A colleague asked about tomorrow's meeting. I saved a draft and went home. Nothing strange happened.`,
};

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

async function extract(caseSpec: typeof POSITIVE) {
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
    title: caseSpec.title,
    date: '2026-07-27',
    content: caseSpec.content,
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
        { role: 'user', content: `${user}\n\n[smoke_run_id: ${randomUUID()}]` },
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
    return { ok: false as const, case_id: caseSpec.id, error: `proxy ${res.status}: ${text.slice(0, 500)}`, latency_ms };
  }
  const body = JSON.parse(text) as Record<string, unknown>;
  const content =
    (body.choices as Array<{ message?: { content?: string } }> | undefined)?.[0]?.message?.content ??
    (typeof body.content === 'string' ? body.content : '') ??
    '';
  const rawParsed = parseJson(String(content));
  const schema = validateStructuredTaskContent('dream_extraction', JSON.stringify(rawParsed));
  const stages = buildEchoBenchmarkStages(rawParsed, caseSpec.content);
  return {
    ok: true as const,
    case_id: caseSpec.id,
    latency_ms,
    model: body.model ?? null,
    schema_ok: schema.ok,
    schema_errors: schema.ok ? [] : schema.schemaErrors,
    ...stages,
  };
}

function localRetiredIdGate() {
  const retired = ['trickster.action', 'trickster.figure'] as const;
  const out: Record<string, string> = {};
  for (const id of retired) {
    const result = validateArchetypalEchoes([
      {
        archetype_id: id,
        expression: 'test',
        resonance: 'Test rejection of retired B.2 carrier-scoped trickster ids.',
        confidence: 'high',
        mechanism_tags: ['deception_or_feigned_belief', 'power_asymmetry_reversed'],
        evidence_ids: ['D1'],
      },
    ]);
    out[id] = result.rejected[0]?.reason ?? 'accepted_unexpectedly';
  }
  return out;
}

async function main() {
  if (DREAM_EXTRACTION_PROMPT_VERSION !== '4.1.4') {
    throw new Error(`Expected 4.1.4, got ${DREAM_EXTRACTION_PROMPT_VERSION}`);
  }
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outDir = path.join(process.cwd(), 'tmp', `v414-smoke-${stamp}`);
  mkdirSync(outDir, { recursive: true });

  const catalogIds = new Set(listMythicCatalogIds());
  const retiredChecks = localRetiredIdGate();

  const [positive, ordinary] = await Promise.all([extract(POSITIVE), extract(ORDINARY)]);

  function analyze(packet: Awaited<ReturnType<typeof extract>>) {
    if (!packet.ok) return packet;
    const postArchetypes = packet.post_validation_archetypes as Array<Record<string, unknown>>;
    const postMyths = packet.post_validation_amplifications as Array<Record<string, unknown>>;
    const tricksterIds = postArchetypes
      .map((a) => String(a.archetype_id || ''))
      .filter((id) => id.startsWith('trickster'));
    const mythIds = postMyths.map((m) => String(m.catalog_id || ''));
    const unknownMyth = mythIds.filter((id) => id && !catalogIds.has(id));
    const rawMyth = (Array.isArray(packet.raw_amplifications) ? packet.raw_amplifications : []).map(
      (m) => (m && typeof m === 'object' ? String((m as { catalog_id?: unknown }).catalog_id || '') : '')
    );
    const rawUnknownMyth = rawMyth.filter((id) => id && !catalogIds.has(id));
    return {
      case_id: packet.case_id,
      ok: true,
      latency_ms: packet.latency_ms,
      schema_ok: packet.schema_ok,
      schema_errors: packet.schema_errors,
      trickster_archetype_ids: tricksterIds,
      trickster_only_trickster_id:
        tricksterIds.length === 0 || tricksterIds.every((id) => id === 'trickster'),
      post_myth_ids: mythIds,
      myth_unknown_ids: unknownMyth,
      raw_unknown_myth_ids: rawUnknownMyth,
      myth_rejected: packet.mythic_rejected,
      archetype_rejected: packet.archetype_rejected,
    };
  }

  const pos = analyze(positive);
  const ord = analyze(ordinary);

  const summary = {
    outDir,
    prompt_id: DREAM_EXTRACTION_PROMPT_ID,
    prompt_version: DREAM_EXTRACTION_PROMPT_VERSION,
    schema_version: DREAM_EXTRACTION_SCHEMA_VERSION,
    retired_id_rejection: retiredChecks,
    retired_ids_rejected: Object.values(retiredChecks).every((r) => r === 'unknown_archetype_id'),
    positive: pos,
    ordinary: ord,
    pass: false as boolean,
  };

  summary.pass =
    summary.retired_ids_rejected &&
    positive.ok &&
    ordinary.ok &&
    positive.schema_ok &&
    ordinary.schema_ok &&
    pos.ok === true &&
    ord.ok === true &&
    (pos.trickster_only_trickster_id ?? true) &&
    pos.myth_unknown_ids.length === 0 &&
    pos.raw_unknown_myth_ids.length === 0 &&
    ord.myth_unknown_ids.length === 0 &&
    ord.raw_unknown_myth_ids.length === 0;

  writeFileSync(path.join(outDir, 'positive.json'), JSON.stringify(positive, null, 2));
  writeFileSync(path.join(outDir, 'ordinary.json'), JSON.stringify(ordinary, null, 2));
  writeFileSync(path.join(outDir, 'summary.json'), JSON.stringify(summary, null, 2));

  console.log('=== v4.1.4 SMOKE TEST ===');
  console.log(JSON.stringify(summary, null, 2));
  if (!summary.pass) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
