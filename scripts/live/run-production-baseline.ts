/**
 * One-shot production-only baseline for frozen prompt v3.9.0.
 * Debug suffix OFF. No diagnostics requested.
 * Temporary local logging only for raw + post-validation production echo fields.
 */
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
} from '../../src/ai/dreamExtractionPrompt';
import { validateStructuredTaskContent } from '../../src/ai/structuredTaskValidation';
import {
  toPersistedArchetypalEcho,
  validateArchetypalEchoes,
} from '../../src/ai/validators/archetypalEchoValidator';
import {
  toPersistedMythicEcho,
  validateMythicEchoes,
} from '../../src/ai/validators/mythicEchoValidator';
import { estimateAiCallCost } from '../../src/billing/aiPricing';
import { readLiveScenario, resolveLiveScenarioPath } from './scenarios';

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

function stripFence(text: string): string {
  return text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim();
}

function parseJson(text: string): Record<string, unknown> {
  const cleaned = stripFence(text);
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start < 0 || end <= start) throw new Error(`No JSON object in model content: ${text.slice(0, 200)}`);
  return JSON.parse(cleaned.slice(start, end + 1)) as Record<string, unknown>;
}

function summarizeEchoes(raw: unknown, key: 'archetypes' | 'amplifications') {
  if (!Array.isArray(raw)) return [];
  if (key === 'archetypes') {
    return raw.map((item) => {
      if (!item || typeof item !== 'object') return item;
      const o = item as Record<string, unknown>;
      return {
        canonical_label: o.canonical_label ?? null,
        expression: o.expression ?? null,
        confidence: o.confidence ?? null,
        evidence: o.evidence ?? null,
        resonance: typeof o.resonance === 'string' ? o.resonance.slice(0, 120) : o.resonance ?? null,
      };
    });
  }
  return raw.map((item) => {
    if (!item || typeof item !== 'object') return item;
    const o = item as Record<string, unknown>;
    return {
      title: o.title ?? null,
      tradition: o.tradition ?? null,
      confidence: o.confidence ?? null,
      evidence: o.evidence ?? null,
      resonance: typeof o.resonance === 'string' ? o.resonance.slice(0, 120) : o.resonance ?? null,
      divergence: typeof o.divergence === 'string' ? o.divergence.slice(0, 120) : o.divergence ?? null,
    };
  });
}

function postValidate(rawParsed: Record<string, unknown>) {
  const validated = validateStructuredTaskContent('dream_extraction', JSON.stringify(rawParsed));
  const data = (validated.ok ? validated.data : rawParsed) as Record<string, unknown>;
  const archetypesRaw = Array.isArray(data.archetypes) ? data.archetypes : [];
  const amplificationsRaw = Array.isArray(data.amplifications) ? data.amplifications : [];

  const archetypeValidation = validateArchetypalEchoes(archetypesRaw as never, { max: 2 });
  const mythicValidation = validateMythicEchoes(amplificationsRaw as never, { max: 1 });

  return {
    schemaOk: validated.ok,
    post_validation_archetypes: archetypeValidation.accepted.map(toPersistedArchetypalEcho),
    post_validation_amplifications: mythicValidation.accepted.map(toPersistedMythicEcho),
    archetype_rejects: archetypeValidation.rejected.map((r) => r.reason),
    mythic_rejects: mythicValidation.rejected.map((r) => r.reason),
  };
}

async function main() {
  const scenarioPath = resolveLiveScenarioPath(process.env.LIVE_BASELINE_SCENARIO_FILE ?? process.argv[2]);
  const scenario = readLiveScenario(scenarioPath);
  const dream = scenario.dream;

  if (DREAM_EXTRACTION_PROMPT_VERSION !== scenario.prompt_version) {
    throw new Error(`Expected frozen ${scenario.prompt_version}, got ${DREAM_EXTRACTION_PROMPT_VERSION}`);
  }

  const supabaseUrl = getEnv(['EXPO_PUBLIC_SUPABASE_URL', 'SUPABASE_URL']).replace(/\/$/, '');
  const anon = getEnv(['EXPO_PUBLIC_SUPABASE_ANON_KEY', 'SUPABASE_ANON_KEY']);
  const endpoint = getEnv(['EXPO_PUBLIC_CUSTOM_GPT_ENDPOINT', 'CUSTOM_GPT_ENDPOINT']);
  const email = getEnv(['LIVE_SUPABASE_EMAIL']);
  const password = getEnv(['LIVE_SUPABASE_PASSWORD']);
  let token = getEnv(['LIVE_SUPABASE_ACCESS_TOKEN', 'SUPABASE_ACCESS_TOKEN']);

  if (!supabaseUrl || !anon || !endpoint) throw new Error('Missing supabase/proxy env');

  if (!token) {
    if (!email || !password) throw new Error('Missing LIVE_SUPABASE_EMAIL/PASSWORD or access token');
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

  const outDir = path.join(process.cwd(), 'tmp', scenario.output_dir);
  mkdirSync(outDir, { recursive: true });

  const sampleUser = buildDreamExtractionUserPrompt({
    title: dream.title,
    date: dream.date,
    content: dream.content,
    finalInterpretation: 'placeholder reflection',
    debugInterpretiveEchoes: false,
  });
  if (sampleUser.includes('DEBUG INTERPRETIVE ECHOES')) {
    throw new Error('Debug suffix leaked into production prompt');
  }
  if (
    sampleUser.includes('dream_map') ||
    sampleUser.includes('archetype_audit') ||
    sampleUser.includes('mythic_audit')
  ) {
    throw new Error('Diagnostics keys present in production user prompt');
  }

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
    if (!res.ok) throw new Error(`proxy ${res.status}: ${text.slice(0, 600)}`);
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

  console.log(`Running live baseline scenario ${scenario.id} from ${scenarioPath}`);
  console.log('Generating one shared reflection for arm A...');
  const reflectionCall = await callProxy({
    task: 'interpretation_standard',
    model: 'gpt-5.4',
    messages: [
      {
        role: 'system',
        content:
          'Act as Dream Weaver, a restrained post-Jungian dream analyst. Interpret symbolically, never literally. Stay image-near, hypothetical, non-clinical, and non-advisory. Respond in the same language as the dream.',
      },
      {
        role: 'user',
        content: `Dream title: ${dream.title}\nDate: ${dream.date}\nDream:\n${dream.content}\n\nWrite a compact symbolic reflection in 3-5 short paragraphs. Ground every major claim in concrete dream images. No diagnosis, no advice.`,
      },
    ],
    temperature: 0.45,
    max_completion_tokens: 900,
    max_tokens: 900,
  });
  const reflection = reflectionCall.content.trim();
  if (reflection.length < 80) throw new Error('Reflection too short');

  writeFileSync(
    path.join(outDir, 'dream_used.json'),
    JSON.stringify(
      {
        scenario_id: scenario.id,
        scenario_file: path.relative(process.cwd(), scenarioPath),
        prompt_id: DREAM_EXTRACTION_PROMPT_ID,
        prompt_version: DREAM_EXTRACTION_PROMPT_VERSION,
        schema_version: DREAM_EXTRACTION_SCHEMA_VERSION,
        debug_suffix: false,
        title: dream.title,
        date: dream.date,
        content: dream.content,
        reflection,
        reflection_cost: reflectionCall.cost,
        reflection_latency_ms: reflectionCall.latencyMs,
      },
      null,
      2
    )
  );
  console.log('reflection_len', reflection.length, 'latency_ms', reflectionCall.latencyMs);

  async function runExtraction(label: string, withReflection: boolean) {
    const system = buildDreamExtractionSystemPrompt();
    const user = buildDreamExtractionUserPrompt({
      title: dream.title,
      date: dream.date,
      content: dream.content,
      finalInterpretation: withReflection ? reflection : null,
      debugInterpretiveEchoes: false,
    });
    if (user.includes('DEBUG INTERPRETIVE ECHOES')) {
      throw new Error(`${label}: debug suffix present`);
    }

    console.log(`[APP][PROD-BASELINE] starting ${label} debug=false reflection=${withReflection}`);
    const { body, content, latencyMs, cost } = await callProxy({
      task: 'dream_extraction',
      model: 'gpt-5.4-mini',
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      temperature: DREAM_EXTRACTION_TEMPERATURE,
      max_completion_tokens: DREAM_EXTRACTION_TOKEN_LIMIT,
      max_tokens: DREAM_EXTRACTION_TOKEN_LIMIT,
      response_format: { type: 'json_object' },
    });

    const rawParsed = parseJson(content);
    const rawArchetypes = rawParsed.archetypes ?? [];
    const rawAmplifications = rawParsed.amplifications ?? [];
    console.log(
      '[APP][PROD-BASELINE] raw_model_production_fields',
      JSON.stringify({
        run: label,
        archetypes: summarizeEchoes(rawArchetypes, 'archetypes'),
        amplifications: summarizeEchoes(rawAmplifications, 'amplifications'),
      })
    );

    if ('interpretive_diagnostics' in rawParsed) {
      console.warn(`[APP][PROD-BASELINE] WARNING ${label}: model returned interpretive_diagnostics unexpectedly`);
    }

    const post = postValidate(rawParsed);
    console.log(
      '[APP][PROD-BASELINE] post_validation_production_fields',
      JSON.stringify({
        run: label,
        archetypes: summarizeEchoes(post.post_validation_archetypes, 'archetypes'),
        amplifications: summarizeEchoes(post.post_validation_amplifications, 'amplifications'),
        cost,
        latency_ms: latencyMs,
      })
    );

    const packet = {
      run: label,
      with_reflection: withReflection,
      debug_suffix: false,
      prompt_id: DREAM_EXTRACTION_PROMPT_ID,
      prompt_version: DREAM_EXTRACTION_PROMPT_VERSION,
      schema_version: DREAM_EXTRACTION_SCHEMA_VERSION,
      model: body.model ?? null,
      temperature: DREAM_EXTRACTION_TEMPERATURE,
      token_limit: DREAM_EXTRACTION_TOKEN_LIMIT,
      latency_ms: latencyMs,
      cost,
      usage: body.usage ?? null,
      raw_model_archetypes: rawArchetypes,
      raw_model_amplifications: rawAmplifications,
      post_validation_archetypes: post.post_validation_archetypes,
      post_validation_amplifications: post.post_validation_amplifications,
      archetype_rejects: post.archetype_rejects,
      mythic_rejects: post.mythic_rejects,
      schema_ok: post.schemaOk,
      had_interpretive_diagnostics: 'interpretive_diagnostics' in rawParsed,
    };
    writeFileSync(path.join(outDir, `${label}.json`), JSON.stringify(packet, null, 2));
    return packet;
  }

  const runs: Array<Record<string, unknown>> = [];
  for (let i = 1; i <= scenario.runs.with_reflection; i++) {
    runs.push(await runExtraction(`A_with_reflection_${i}`, true));
  }
  for (let i = 1; i <= scenario.runs.without_reflection; i++) {
    runs.push(await runExtraction(`B_no_reflection_${i}`, false));
  }

  const summary = {
    scenario_id: scenario.id,
    scenario_file: path.relative(process.cwd(), scenarioPath),
    purpose: scenario.description,
    prompt_version: DREAM_EXTRACTION_PROMPT_VERSION,
    debug_suffix: false,
    model: 'gpt-5.4-mini',
    temperature: DREAM_EXTRACTION_TEMPERATURE,
    dream_title: dream.title,
    runs: runs.map((r) => ({
      run: r.run,
      with_reflection: r.with_reflection,
      latency_ms: r.latency_ms,
      cost: r.cost,
      raw_archetype_labels: summarizeEchoes(r.raw_model_archetypes, 'archetypes').map(
        (a: any) => a?.canonical_label ?? a
      ),
      raw_amplification_titles: summarizeEchoes(r.raw_model_amplifications, 'amplifications').map(
        (a: any) => a?.title ?? a
      ),
      post_archetype_labels: summarizeEchoes(r.post_validation_archetypes, 'archetypes').map(
        (a: any) => a?.canonical_label ?? a
      ),
      post_amplification_titles: summarizeEchoes(r.post_validation_amplifications, 'amplifications').map(
        (a: any) => a?.title ?? a
      ),
      archetype_rejects: r.archetype_rejects,
      mythic_rejects: r.mythic_rejects,
      had_interpretive_diagnostics: r.had_interpretive_diagnostics,
    })),
  };
  writeFileSync(path.join(outDir, 'summary.json'), JSON.stringify(summary, null, 2));
  console.log('\n=== SUMMARY ===');
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
