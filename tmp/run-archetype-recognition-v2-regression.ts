import { createHash, randomUUID } from 'crypto';
import { mkdirSync, writeFileSync } from 'fs';
import path from 'path';
import {
  ARCHETYPE_RECOGNITION_MODEL,
  ARCHETYPE_RECOGNITION_PROMPT_VERSION,
  ARCHETYPE_RECOGNITION_TEMPERATURE,
  ARCHETYPE_RECOGNITION_TOKEN_LIMIT,
  buildArchetypeRecognitionSystemPrompt,
  buildArchetypeRecognitionUserPrompt,
} from '../src/ai/archetypeRecognitionPrompt.ts';
import {
  ARCHETYPE_RECOGNITION_CATALOG_VERSION,
  type ArchetypeRecognitionId,
} from '../src/ai/catalogs/archetypeRecognitionCatalog.v2.ts';
import {
  ARCHETYPE_RECOGNITION_SCHEMA_VERSION,
  buildArchetypeRecognitionResponseFormat,
  validateArchetypeRecognitionResponse,
} from '../src/ai/schemas/archetypeRecognitionSchema.ts';
import { buildArchetypeRecognitionAuditRows } from '../src/ai/archetypeRecognitionMapper.ts';

type FixtureExpectation = {
  loverMin?: number;
  loverExactZero?: boolean;
  exactArchetypeAtLeast?: { id: ArchetypeRecognitionId; min: number };
  exactArchetypeZero?: ArchetypeRecognitionId;
};

type Fixture = {
  id: string;
  dreamText: string;
  targetLanguageHint: 'el' | 'en';
  repeats: number;
  expectation: FixtureExpectation;
};

const FIXTURES: Fixture[] = [
  {
    id: 'sea_mattress_el_exact',
    dreamText:
      'Είδα ένα όνειρο. Ήμουν ξαπλωμένη σε ένα θαλάσσιο στρώμα, σε μια πολύ γαλήνια θάλασσα και πάνω μου ήταν ξαπλωμένος ο φίλος μου και κοιτούσαμε το βυθό και εξερευνούσαμε όλο το βυθό. Ήταν πολύ ήρεμα, γαλήνια, όμορφα, πάντα πολύ ήρεμα.',
    targetLanguageHint: 'el',
    repeats: 5,
    expectation: { loverMin: 4 },
  },
  {
    id: 'sea_mattress_el_boyfriend_diag',
    dreamText:
      'Είδα ένα όνειρο. Ήμουν ξαπλωμένη σε ένα θαλάσσιο στρώμα, σε μια πολύ γαλήνια θάλασσα και πάνω μου ήταν ξαπλωμένο το αγόρι μου και κοιτούσαμε το βυθό και εξερευνούσαμε όλο το βυθό. Ήταν πολύ ήρεμα, γαλήνια, όμορφα, πάντα πολύ ήρεμα.',
    targetLanguageHint: 'el',
    repeats: 3,
    expectation: { loverMin: 3 },
  },
  {
    id: 'lover_harmonious_en',
    dreamText:
      'I dreamed I was lying with my beloved on a quiet floating raft. We stayed close, watched the deep water together, and felt the whole scene as peaceful, intimate, and shared.',
    targetLanguageHint: 'en',
    repeats: 5,
    expectation: { loverMin: 4 },
  },
  {
    id: 'lover_longing_en',
    dreamText:
      'I dreamed I was searching through a dim station for the woman I loved. Each corridor deepened my longing, and when I finally heard her voice I felt both hope and the ache of separation.',
    targetLanguageHint: 'en',
    repeats: 3,
    expectation: { loverMin: 2 },
  },
  {
    id: 'warm_friends_en',
    dreamText:
      'I dreamed I was sitting with two close friends on a porch at sunset. We talked warmly, laughed, and watched the light fade together before going home.',
    targetLanguageHint: 'en',
    repeats: 5,
    expectation: { loverExactZero: true },
  },
  {
    id: 'warm_friends_el',
    dreamText:
      'Είδα ότι καθόμουν με δύο πολύ ζεστούς φίλους σε μια αυλή το βράδυ. Μιλούσαμε τρυφερά, γελούσαμε και βλέπαμε μαζί το φως να χαμηλώνει πριν φύγουμε.',
    targetLanguageHint: 'el',
    repeats: 5,
    expectation: { loverExactZero: true },
  },
  {
    id: 'incidental_partner_en',
    dreamText:
      'I dreamed my partner and I were trying to catch a train and kept discussing tickets, luggage, and the right platform while hurrying through the station.',
    targetLanguageHint: 'en',
    repeats: 3,
    expectation: { loverExactZero: true },
  },
  {
    id: 'romance_cue_only_en',
    dreamText:
      'I dreamed I was at a wedding where everyone kept pointing to the flowers, the music, and the couple, but I stayed mostly an observer in the crowd.',
    targetLanguageHint: 'en',
    repeats: 3,
    expectation: { loverExactZero: true },
  },
  {
    id: 'mother_positive_en',
    dreamText:
      'I dreamed I was inside a vast warm house that seemed to hold and feed everyone. Bowls kept appearing, and each room felt like a shelter no one wanted to leave.',
    targetLanguageHint: 'en',
    repeats: 3,
    expectation: { exactArchetypeAtLeast: { id: 'mother', min: 2 } },
  },
  {
    id: 'father_positive_en',
    dreamText:
      'I dreamed my father stood at the doorway and told me the rule that would determine whether I could pass. The whole room arranged itself around his demand.',
    targetLanguageHint: 'en',
    repeats: 3,
    expectation: { exactArchetypeAtLeast: { id: 'father', min: 2 } },
  },
  {
    id: 'divine_child_positive_en',
    dreamText:
      'I dreamed a small glowing child was sleeping in my hands while everyone around me stopped what they were doing to protect it and clear a way forward.',
    targetLanguageHint: 'en',
    repeats: 3,
    expectation: { exactArchetypeAtLeast: { id: 'divine_child', min: 2 } },
  },
  {
    id: 'persona_positive_en',
    dreamText:
      'I dreamed I had to keep smiling in a formal uniform while inside I wanted to run away and say who I really was. The whole event depended on the role holding.',
    targetLanguageHint: 'en',
    repeats: 3,
    expectation: { exactArchetypeAtLeast: { id: 'persona', min: 2 } },
  },
  {
    id: 'guide_positive_en',
    dreamText:
      'I dreamed an old ferryman led me across a dark river and told me exactly when I could step onto the other bank. Without him I would not have known how to cross.',
    targetLanguageHint: 'en',
    repeats: 3,
    expectation: { exactArchetypeAtLeast: { id: 'guide_psychopomp', min: 2 } },
  },
  {
    id: 'guide_negative_carrier_only_en',
    dreamText:
      'I dreamed an older taxi driver took me to the airport, dropped me off, and drove away while I dealt with the rest by myself.',
    targetLanguageHint: 'en',
    repeats: 3,
    expectation: { exactArchetypeZero: 'guide_psychopomp' },
  },
  {
    id: 'shadow_positive_en',
    dreamText:
      'I dreamed a filthy, furious version of me stood outside the lit house and kept staring until I admitted it belonged to my own life.',
    targetLanguageHint: 'en',
    repeats: 3,
    expectation: { exactArchetypeAtLeast: { id: 'shadow', min: 2 } },
  },
  {
    id: 'shadow_negative_danger_only_en',
    dreamText:
      'I dreamed I was running through a dark alley because I thought something dangerous might be behind me, but I never saw who or what it was.',
    targetLanguageHint: 'en',
    repeats: 3,
    expectation: { exactArchetypeZero: 'shadow' },
  },
];

function getEnv(keys: string[]): string {
  for (const key of keys) {
    const value = process.env[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
}

function sha256(text: string): string {
  return createHash('sha256').update(text).digest('hex');
}

async function auth(): Promise<{ anon: string; endpoint: string; token: string }> {
  const supabaseUrl = getEnv(['EXPO_PUBLIC_SUPABASE_URL']).replace(/\/$/, '');
  const anon = getEnv(['EXPO_PUBLIC_SUPABASE_ANON_KEY']);
  const endpoint = getEnv(['EXPO_PUBLIC_CUSTOM_GPT_ENDPOINT']);
  let token = getEnv(['LIVE_SUPABASE_ACCESS_TOKEN']);

  if (!supabaseUrl || !anon || !endpoint) {
    throw new Error('Missing EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY / EXPO_PUBLIC_CUSTOM_GPT_ENDPOINT');
  }

  if (!token) {
    const email = getEnv(['LIVE_SUPABASE_EMAIL']);
    const password = getEnv(['LIVE_SUPABASE_PASSWORD']);
    const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: anon },
      body: JSON.stringify({ email, password }),
    });
    const text = await response.text();
    if (!response.ok) throw new Error(`auth ${response.status}: ${text.slice(0, 300)}`);
    token = (JSON.parse(text) as { access_token?: string }).access_token ?? '';
  }

  if (!token) throw new Error('Missing live auth token');
  return { anon, endpoint, token };
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function runOne(
  fixture: Fixture,
  attemptIndex: number,
  authState: { anon: string; endpoint: string; token: string },
  model: string
) {
  const userPrompt = buildArchetypeRecognitionUserPrompt({
    dreamText: fixture.dreamText,
    targetLanguageHint: fixture.targetLanguageHint,
  });
  const systemPrompt = buildArchetypeRecognitionSystemPrompt(userPrompt.targetLanguage);
  const startedAt = Date.now();

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const response = await fetch(authState.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: authState.anon,
        Authorization: `Bearer ${authState.token}`,
      },
      body: JSON.stringify({
        task: 'dream_archetype_recognition',
        model,
        disable_anthropic_fallback: true,
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: `${userPrompt.prompt}\n\n[fixture:${fixture.id}:${attemptIndex}:${randomUUID()}]`,
          },
        ],
        temperature: ARCHETYPE_RECOGNITION_TEMPERATURE,
        max_completion_tokens: ARCHETYPE_RECOGNITION_TOKEN_LIMIT,
        max_tokens: ARCHETYPE_RECOGNITION_TOKEN_LIMIT,
        response_format: buildArchetypeRecognitionResponseFormat(),
      }),
    });
    const responseText = await response.text();
    const latencyMs = Date.now() - startedAt;

    if (response.status === 429 && attempt < 3) {
      await sleep(350 * attempt);
      continue;
    }

    if (!response.ok) {
      return {
        fixture_id: fixture.id,
        semantic_success: false,
        status: response.status,
        latency_ms: latencyMs,
        failure_stage: 'proxy_http',
        error_excerpt: responseText.slice(0, 300),
      };
    }

    const body = JSON.parse(responseText) as Record<string, unknown>;
    const content =
      (body.choices as Array<{ message?: { content?: string } }> | undefined)?.[0]?.message?.content ?? '';
    const validation = validateArchetypeRecognitionResponse(content, {
      dreamText: fixture.dreamText,
      targetLanguageHint: fixture.targetLanguageHint,
    });

    if (!validation.ok && validation.issues.includes('language_validation_failed') && attempt < 2) {
      continue;
    }

    if (!validation.ok) {
      return {
        fixture_id: fixture.id,
        semantic_success: false,
        status: 200,
        latency_ms: latencyMs,
        failure_stage: validation.issues.join('+'),
        error_excerpt: validation.errors.join(' | ').slice(0, 300),
      };
    }

    const auditRows = buildArchetypeRecognitionAuditRows(validation.data, {
      dreamText: fixture.dreamText,
    });

    return {
      fixture_id: fixture.id,
      semantic_success: true,
      status: 200,
      latency_ms: latencyMs,
      target_language: validation.targetLanguage.code,
      archetypes: auditRows.map((row) => ({
        archetype_id: row.archetype_id,
        canonical_label: row.canonical_label,
        quality: row.quality,
        expression: row.expression,
        resonance: row.resonance,
        confidence: row.confidence,
        evidence_ids: row.evidence_ids,
      })),
    };
  }

  return {
    fixture_id: fixture.id,
    semantic_success: false,
    status: 0,
    latency_ms: Date.now() - startedAt,
    failure_stage: 'retry_exhausted',
    error_excerpt: 'bounded retries exhausted',
  };
}

async function runPool<T, R>(
  items: T[],
  concurrency: number,
  worker: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = [];
  const queue = [...items];
  await Promise.all(
    Array.from({ length: Math.max(1, concurrency) }, async () => {
      while (queue.length > 0) {
        const item = queue.shift();
        if (!item) return;
        results.push(await worker(item));
      }
    })
  );
  return results;
}

function countArchetype(
  runs: Array<{ semantic_success: boolean; archetypes?: Array<{ archetype_id: string }> }>,
  archetypeId: string
): number {
  return runs.filter(
    (run) => run.semantic_success && run.archetypes?.some((row) => row.archetype_id === archetypeId)
  ).length;
}

function evaluateFixtureAcceptance(
  fixture: Fixture,
  successfulRuns: Array<{ semantic_success: boolean; archetypes?: Array<{ archetype_id: string }> }>
) {
  const loverCount = countArchetype(successfulRuns, 'lover');
  const failures: string[] = [];

  if (typeof fixture.expectation.loverMin === 'number' && loverCount < fixture.expectation.loverMin) {
    failures.push(`lover ${loverCount}/${successfulRuns.length} < ${fixture.expectation.loverMin}`);
  }
  if (fixture.expectation.loverExactZero && loverCount !== 0) {
    failures.push(`lover expected 0, got ${loverCount}/${successfulRuns.length}`);
  }
  if (fixture.expectation.exactArchetypeAtLeast) {
    const count = countArchetype(successfulRuns, fixture.expectation.exactArchetypeAtLeast.id);
    if (count < fixture.expectation.exactArchetypeAtLeast.min) {
      failures.push(
        `${fixture.expectation.exactArchetypeAtLeast.id} ${count}/${successfulRuns.length} < ${fixture.expectation.exactArchetypeAtLeast.min}`
      );
    }
  }
  if (fixture.expectation.exactArchetypeZero) {
    const count = countArchetype(successfulRuns, fixture.expectation.exactArchetypeZero);
    if (count !== 0) {
      failures.push(
        `${fixture.expectation.exactArchetypeZero} expected 0, got ${count}/${successfulRuns.length}`
      );
    }
  }

  return {
    fixture_id: fixture.id,
    successful_runs: successfulRuns.length,
    lover_count: loverCount,
    pass: failures.length === 0,
    failures,
  };
}

async function main() {
  const requestedModel = getEnv(['ARCHETYPE_RECOGNITION_MODEL']) || ARCHETYPE_RECOGNITION_MODEL;
  const concurrency = Number(getEnv(['ARCHETYPE_RECOGNITION_CONCURRENCY']) || '2');
  const authState = await auth();
  const outDir = path.join(
    process.cwd(),
    `tmp/archetype-recognition-v2-${new Date().toISOString().replace(/[:.]/g, '-')}`
  );
  mkdirSync(outDir, { recursive: true });

  const plannedRuns = FIXTURES.flatMap((fixture) =>
    Array.from({ length: fixture.repeats }, (_, attemptIndex) => ({
      fixture,
      attemptIndex: attemptIndex + 1,
    }))
  );

  const results = await runPool(plannedRuns, concurrency, ({ fixture, attemptIndex }) =>
    runOne(fixture, attemptIndex, authState, requestedModel)
  );

  const fixtureSummaries = FIXTURES.map((fixture) => {
    const runs = results.filter((result) => result.fixture_id === fixture.id);
    const successfulRuns = runs.filter((result) => result.semantic_success);
    return {
      ...evaluateFixtureAcceptance(fixture, successfulRuns),
      semantic_failures: runs
        .filter((result) => !result.semantic_success)
        .map((result) => ({
          failure_stage: result.failure_stage,
          status: result.status,
          latency_ms: result.latency_ms,
          error_excerpt: result.error_excerpt,
        })),
    };
  });

  const packet = {
    generated_at: new Date().toISOString(),
    task: 'dream_archetype_recognition',
    prompt_version: ARCHETYPE_RECOGNITION_PROMPT_VERSION,
    response_schema_version: ARCHETYPE_RECOGNITION_SCHEMA_VERSION,
    recognition_catalog_version: ARCHETYPE_RECOGNITION_CATALOG_VERSION,
    model: requestedModel,
    temperature: ARCHETYPE_RECOGNITION_TEMPERATURE,
    concurrency,
    fixture_count: FIXTURES.length,
    planned_semantic_runs: plannedRuns.length,
    results: results.map((result) =>
      result.semantic_success
        ? {
            fixture_id: result.fixture_id,
            semantic_success: true,
            target_language: result.target_language,
            latency_ms: result.latency_ms,
            archetypes: result.archetypes,
          }
        : result
    ),
    acceptance: fixtureSummaries,
    fixture_hashes: FIXTURES.map((fixture) => ({
      fixture_id: fixture.id,
      sha256: sha256(fixture.dreamText),
      repeats: fixture.repeats,
    })),
  };

  writeFileSync(path.join(outDir, 'review_packet.json'), JSON.stringify(packet, null, 2));
  console.log(JSON.stringify({ outDir, acceptance: fixtureSummaries }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
