/**
 * Live extract ×5 for the Greek sea-mattress dream (E.1.1 production path).
 * Concurrency 5. Reports post-validation archetypes (what UI can show).
 */
import { mkdirSync, writeFileSync } from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import {
  buildDreamExtractionSystemPrompt,
  buildDreamExtractionUserPrompt,
  DREAM_EXTRACTION_PROMPT_VERSION,
  DREAM_EXTRACTION_TEMPERATURE,
  DREAM_EXTRACTION_TOKEN_LIMIT,
} from '../src/ai/dreamExtractionPrompt';
import { buildDreamExtractionResponseFormat } from '../src/ai/dreamExtractionResponseFormat';
import { validateStructuredTaskContent } from '../src/ai/structuredTaskValidation';
import {
  resolveDreamOutputLanguage,
  runOutputLanguageCommitGate,
  validateLanguageRepairFieldMap,
} from '../src/ai/dreamOutputLanguage';
import {
  toPersistedArchetypalEcho,
  validateArchetypalEchoes,
} from '../src/ai/validators/archetypalEchoValidator';
import {
  ARCHETYPE_CATALOG_VERSION,
  getArchetypeDefinitionById,
} from '../src/ai/catalogs/archetypeCatalog.v1';
import { formatArchetypalEchoesForDisplay } from '../src/ai/archetypalEchoes';

const DREAM = `Είδα ένα όνειρο. Ήμουν ξαπλωμένη σε ένα θαλάσσιο στρώμα, σε μια πολύ γαλήνια θάλασσα και πάνω μου ήταν ξαπλωμένος ο φίλος μου και κοιτούσαμε το βυθό και εξερευνούσαμε όλο το βυθό. Ήταν πολύ ήρεμα, γαλήνια, όμορφα, πάντα πολύ ήρεμα.`;

function getEnv(keys: string[]): string {
  for (const key of keys) {
    const v = process.env[key];
    if (typeof v === 'string' && v.trim()) return v.trim();
  }
  return '';
}

async function auth(): Promise<{ anon: string; endpoint: string; token: string }> {
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
  return { anon, endpoint, token };
}

async function oneRun(runId: string, anon: string, endpoint: string, token: string) {
  const target = resolveDreamOutputLanguage(DREAM, 'el');
  const system = buildDreamExtractionSystemPrompt();
  const user = buildDreamExtractionUserPrompt({
    title: 'sea_mattress_el',
    date: '2026-07-27',
    content: DREAM,
    finalInterpretation: null,
    debugInterpretiveEchoes: false,
    dreamLanguage: 'el',
    targetOutputLanguage: target,
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
      disable_anthropic_fallback: true,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: `${user}\n\n[sea_mattress_el:${runId}:${randomUUID()}]` },
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
    return { runId, ok: false, latency_ms, error: `proxy ${res.status}: ${text.slice(0, 400)}` };
  }
  const body = JSON.parse(text) as Record<string, unknown>;
  const content =
    (body.choices as Array<{ message?: { content?: string } }> | undefined)?.[0]?.message?.content ??
    '';
  const schema = validateStructuredTaskContent('dream_extraction', content);
  if (!schema.ok) {
    return { runId, ok: false, latency_ms, error: `schema: ${schema.schemaErrors.slice(0, 3).join('; ')}` };
  }
  const languageGate = await runOutputLanguageCommitGate({
    parsed: schema.data as Record<string, unknown>,
    target,
    repairOnce: async ({ messages, expectedPaths }) => {
      const repairRes = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: anon,
          Authorization: `Bearer ${token}`,
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
        (repairBody.choices as Array<{ message?: { content?: string } }> | undefined)?.[0]?.message
          ?.content ?? '';
      try {
        return validateLanguageRepairFieldMap(JSON.parse(repairContent), expectedPaths);
      } catch {
        return null;
      }
    },
  });
  if (!languageGate.ok) {
    return {
      runId,
      ok: false,
      latency_ms,
      error: `language_validation_failed: ${languageGate.telemetry.mismatched_field_paths.join(',')}`,
    };
  }
  const parsed = languageGate.parsed;
  const rawArchetypes = Array.isArray(parsed.archetypes) ? parsed.archetypes : [];
  const validation = validateArchetypalEchoes(rawArchetypes as any, {
    max: 2,
    dreamText: DREAM,
  });
  const post = validation.accepted.map(toPersistedArchetypalEcho);
  const displayCards = formatArchetypalEchoesForDisplay(post);
  const userFacing = post.map((echo) => {
    const catalog = getArchetypeDefinitionById(String(echo.archetype_id));
    const isEgo = echo.canonical_label === 'Ego';
    return {
      archetype_id: echo.archetype_id,
      canonical_label: echo.canonical_label,
      displayLabel: catalog?.displayLabel ?? echo.canonical_label,
      resonance: echo.resonance,
      confidence: echo.confidence,
      // Dream Detail: Ego filtered out; others shown via formatArchetypalEchoesForDisplay
      shown_in_ui: !isEgo && Boolean(echo.resonance?.trim()),
    };
  });
  return {
    runId,
    ok: true,
    latency_ms,
    prompt_version: DREAM_EXTRACTION_PROMPT_VERSION,
    catalog_version: ARCHETYPE_CATALOG_VERSION,
    target_output_language: target.code,
    language_match: languageGate.telemetry.final_commit_allowed,
    raw_ids: rawArchetypes
      .map((row) =>
        row && typeof row === 'object' ? (row as { archetype_id?: string }).archetype_id : null
      )
      .filter(Boolean),
    post_ids: post.map((e) => e.archetype_id),
    rejected: validation.rejected.map((r) => r.reason).slice(0, 6),
    userFacing,
    shown_to_user: displayCards,
  };
}

async function main() {
  const { anon, endpoint, token } = await auth();
  const outDir = path.join(
    process.cwd(),
    `tmp/sea-mattress-el-x5-${new Date().toISOString().replace(/[:.]/g, '-')}`
  );
  mkdirSync(outDir, { recursive: true });
  const runs = await Promise.all(
    Array.from({ length: 5 }, (_, i) => oneRun(`r${i + 1}`, anon, endpoint, token))
  );
  writeFileSync(path.join(outDir, 'runs.json'), JSON.stringify(runs, null, 2));
  const summary = {
    outDir,
    prompt_version: DREAM_EXTRACTION_PROMPT_VERSION,
    concurrency: 5,
    ok: runs.filter((r) => r.ok).length,
    failed: runs.filter((r) => !r.ok).length,
    runs: runs.map((r) =>
      r.ok
        ? {
            runId: r.runId,
            post_ids: r.post_ids,
            post_userFacing: r.userFacing?.map((u) => ({
              id: u.archetype_id,
              label: u.displayLabel,
              shown_in_ui: u.shown_in_ui,
            })),
            shown_to_user: r.shown_to_user,
            language_match: r.language_match,
            latency_ms: r.latency_ms,
          }
        : { runId: r.runId, error: r.error }
    ),
  };
  writeFileSync(path.join(outDir, 'summary.json'), JSON.stringify(summary, null, 2));
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
