import { createHash, randomUUID } from 'crypto';
import { mkdirSync, writeFileSync } from 'fs';
import path from 'path';
import {
  ARCHETYPE_ADJUDICATION_MODEL,
  ARCHETYPE_ADJUDICATION_PROMPT_VERSION,
  ARCHETYPE_ADJUDICATION_TEMPERATURE,
  ARCHETYPE_ADJUDICATION_TOKEN_LIMIT,
  buildArchetypeAdjudicationSystemPrompt,
  buildArchetypeAdjudicationUserPrompt,
} from '../src/ai/archetypeAdjudicationPrompt.ts';
import { ARCHETYPE_BOUNDARY_CATALOG_VERSION } from '../src/ai/catalogs/archetypeBoundaryCatalog.v1.ts';
import {
  ARCHETYPE_RECOGNITION_CATALOG_VERSION,
  type ArchetypeRecognitionId,
} from '../src/ai/catalogs/archetypeRecognitionCatalog.v2.ts';
import {
  applyArchetypeAdjudicationToRecognition,
  evaluateArchetypeSetExpectation,
  type ArchetypeSetExpectation,
} from '../src/ai/archetypeRecognitionPipeline.ts';
import {
  ARCHETYPE_RECOGNITION_MODEL,
  ARCHETYPE_RECOGNITION_PROMPT_VERSION,
  ARCHETYPE_RECOGNITION_TEMPERATURE,
  ARCHETYPE_RECOGNITION_TOKEN_LIMIT,
  buildArchetypeRecognitionSystemPrompt,
  buildArchetypeRecognitionUserPrompt,
} from '../src/ai/archetypeRecognitionPrompt.ts';
import { buildArchetypeRecognitionAuditRows } from '../src/ai/archetypeRecognitionMapper.ts';
import {
  ARCHETYPE_ADJUDICATION_SCHEMA_VERSION,
  buildArchetypeAdjudicationResponseFormat,
  validateArchetypeAdjudicationResponse,
} from '../src/ai/schemas/archetypeAdjudicationSchema.ts';
import {
  ARCHETYPE_RECOGNITION_SCHEMA_VERSION,
  buildArchetypeRecognitionResponseFormat,
  validateArchetypeRecognitionResponse,
} from '../src/ai/schemas/archetypeRecognitionSchema.ts';

type Fixture = {
  id: string;
  dreamText: string;
  targetLanguageHint: 'el' | 'en';
  repeats: number;
  expectation: ArchetypeSetExpectation;
  requiredHitsMin?: number;
  exactSetPassMin?: number;
  unexpectedLabelMax?: number;
};

const FETCH_TIMEOUT_MS = 30000;

const FIXTURES: Fixture[] = [
  {
    id: 'sea_mattress_el_exact',
    dreamText:
      'Είδα ένα όνειρο. Ήμουν ξαπλωμένη σε ένα θαλάσσιο στρώμα, σε μια πολύ γαλήνια θάλασσα και πάνω μου ήταν ξαπλωμένος ο φίλος μου και κοιτούσαμε το βυθό και εξερευνούσαμε όλο το βυθό. Ήταν πολύ ήρεμα, γαλήνια, όμορφα, πάντα πολύ ήρεμα.',
    targetLanguageHint: 'el',
    repeats: 5,
    expectation: { required_archetype_ids: ['lover'], allowed_secondary_archetype_ids: [] },
    requiredHitsMin: 5,
    exactSetPassMin: 5,
    unexpectedLabelMax: 0,
  },
  {
    id: 'sea_mattress_el_boyfriend_diag',
    dreamText:
      'Είδα ένα όνειρο. Ήμουν ξαπλωμένη σε ένα θαλάσσιο στρώμα, σε μια πολύ γαλήνια θάλασσα και πάνω μου ήταν ξαπλωμένο το αγόρι μου και κοιτούσαμε το βυθό και εξερευνούσαμε όλο το βυθό. Ήταν πολύ ήρεμα, γαλήνια, όμορφα, πάντα πολύ ήρεμα.',
    targetLanguageHint: 'el',
    repeats: 3,
    expectation: { required_archetype_ids: ['lover'], allowed_secondary_archetype_ids: [] },
    requiredHitsMin: 3,
    exactSetPassMin: 3,
    unexpectedLabelMax: 0,
  },
  {
    id: 'lover_harmonious_en',
    dreamText:
      'I dreamed I was lying with my beloved on a quiet floating raft. We stayed close, watched the deep water together, and felt the whole scene as peaceful, intimate, and shared.',
    targetLanguageHint: 'en',
    repeats: 5,
    expectation: { required_archetype_ids: ['lover'], allowed_secondary_archetype_ids: [] },
    requiredHitsMin: 4,
    unexpectedLabelMax: 0,
  },
  {
    id: 'lover_longing_en',
    dreamText:
      'I dreamed I was searching through a dim station for the woman I loved. Each corridor deepened my longing, and when I finally heard her voice I felt both hope and the ache of separation.',
    targetLanguageHint: 'en',
    repeats: 3,
    expectation: { required_archetype_ids: ['lover'], allowed_secondary_archetype_ids: [] },
    requiredHitsMin: 2,
    unexpectedLabelMax: 0,
  },
  {
    id: 'warm_friends_en',
    dreamText:
      'I dreamed I was sitting with two close friends on a porch at sunset. We talked warmly, laughed, and watched the light fade together before going home.',
    targetLanguageHint: 'en',
    repeats: 5,
    expectation: { required_archetype_ids: [], allowed_secondary_archetype_ids: [] },
    exactSetPassMin: 5,
    unexpectedLabelMax: 0,
  },
  {
    id: 'warm_friends_el',
    dreamText:
      'Είδα ότι καθόμουν με δύο πολύ ζεστούς φίλους σε μια αυλή το βράδυ. Μιλούσαμε τρυφερά, γελούσαμε και βλέπαμε μαζί το φως να χαμηλώνει πριν φύγουμε.',
    targetLanguageHint: 'el',
    repeats: 5,
    expectation: { required_archetype_ids: [], allowed_secondary_archetype_ids: [] },
    exactSetPassMin: 5,
    unexpectedLabelMax: 0,
  },
  {
    id: 'lover_negative_naturalistic_en',
    dreamText:
      'Two old friends sit shoulder to shoulder by a fire, speak tenderly, and feel completely at ease. They eventually say goodnight and return to their separate homes.',
    targetLanguageHint: 'en',
    repeats: 5,
    expectation: { required_archetype_ids: [], allowed_secondary_archetype_ids: [] },
    exactSetPassMin: 5,
    unexpectedLabelMax: 0,
  },
  {
    id: 'incidental_partner_en',
    dreamText:
      'I dreamed my partner and I were trying to catch a train and kept discussing tickets, luggage, and the right platform while hurrying through the station.',
    targetLanguageHint: 'en',
    repeats: 5,
    expectation: { required_archetype_ids: [], allowed_secondary_archetype_ids: [] },
    exactSetPassMin: 5,
    unexpectedLabelMax: 0,
  },
  {
    id: 'romance_cue_only_en',
    dreamText:
      'I dreamed I was at a wedding where everyone kept pointing to the flowers, the music, and the couple, but I stayed mostly an observer in the crowd.',
    targetLanguageHint: 'en',
    repeats: 5,
    expectation: { required_archetype_ids: [], allowed_secondary_archetype_ids: [] },
    exactSetPassMin: 5,
    unexpectedLabelMax: 0,
  },
  {
    id: 'guide_positive_en',
    dreamText:
      'I dreamed an old ferryman led me across a dark river and told me exactly when I could step onto the other bank. Without him I would not have known how to cross.',
    targetLanguageHint: 'en',
    repeats: 5,
    expectation: { required_archetype_ids: ['guide_psychopomp'], allowed_secondary_archetype_ids: [] },
    requiredHitsMin: 4,
    unexpectedLabelMax: 0,
  },
  {
    id: 'guide_negative_carrier_only_en',
    dreamText:
      'I dreamed an older taxi driver took me to the airport, dropped me off, and drove away while I dealt with the rest by myself.',
    targetLanguageHint: 'en',
    repeats: 5,
    expectation: { required_archetype_ids: [], allowed_secondary_archetype_ids: [] },
    exactSetPassMin: 5,
    unexpectedLabelMax: 0,
  },
  {
    id: 'shadow_positive_en',
    dreamText:
      'I dreamed a filthy, furious version of me stood outside the lit house and kept staring until I admitted it belonged to my own life.',
    targetLanguageHint: 'en',
    repeats: 5,
    expectation: { required_archetype_ids: ['shadow'], allowed_secondary_archetype_ids: [] },
    requiredHitsMin: 4,
    unexpectedLabelMax: 0,
  },
  {
    id: 'shadow_negative_danger_only_en',
    dreamText:
      'I dreamed I was running through a dark alley because I thought something dangerous might be behind me, but I never saw who or what it was.',
    targetLanguageHint: 'en',
    repeats: 5,
    expectation: { required_archetype_ids: [], allowed_secondary_archetype_ids: [] },
    exactSetPassMin: 5,
    unexpectedLabelMax: 0,
  },
  {
    id: 'persona_positive_en',
    dreamText:
      'I dreamed I had to keep smiling in a formal uniform while inside I wanted to run away and say who I really was. The whole event depended on the role holding.',
    targetLanguageHint: 'en',
    repeats: 5,
    expectation: { required_archetype_ids: ['persona'], allowed_secondary_archetype_ids: [] },
    requiredHitsMin: 4,
    unexpectedLabelMax: 0,
  },
  {
    id: 'persona_carrier_only_en',
    dreamText:
      'I dreamed I was sitting in the audience at a formal ceremony in a dark suit. Music played, people greeted each other, and I waited for the speeches to finish before going home.',
    targetLanguageHint: 'en',
    repeats: 5,
    expectation: { required_archetype_ids: [], allowed_secondary_archetype_ids: [] },
    exactSetPassMin: 5,
    unexpectedLabelMax: 0,
  },
  {
    id: 'mother_positive_en',
    dreamText:
      'I dreamed I was inside a vast warm house that seemed to hold and feed everyone. Bowls kept appearing, and each room felt like a shelter no one wanted to leave.',
    targetLanguageHint: 'en',
    repeats: 3,
    expectation: { required_archetype_ids: ['mother'], allowed_secondary_archetype_ids: [] },
    requiredHitsMin: 2,
    unexpectedLabelMax: 0,
  },
  {
    id: 'father_positive_en',
    dreamText:
      'I dreamed my father stood at the doorway and told me the rule that would determine whether I could pass. The whole room arranged itself around his demand.',
    targetLanguageHint: 'en',
    repeats: 3,
    expectation: { required_archetype_ids: ['father'], allowed_secondary_archetype_ids: [] },
    requiredHitsMin: 2,
    unexpectedLabelMax: 0,
  },
  {
    id: 'divine_child_positive_en',
    dreamText:
      'I dreamed a small glowing child was sleeping in my hands while everyone around me stopped what they were doing to protect it and clear a way forward.',
    targetLanguageHint: 'en',
    repeats: 3,
    expectation: { required_archetype_ids: ['divine_child'], allowed_secondary_archetype_ids: [] },
    requiredHitsMin: 2,
    unexpectedLabelMax: 0,
  },
];

function getEnv(keys: string[]): string {
  for (const key of keys) {
    const value = process.env[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
}

function getSelectedFixtures(): Fixture[] {
  const raw = getEnv(['ARCHETYPE_RECOGNITION_FIXTURES']);
  if (!raw) return FIXTURES;
  const requestedIds = raw
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
  if (requestedIds.length === 0) return FIXTURES;
  const requestedSet = new Set(requestedIds);
  return FIXTURES.filter((fixture) => requestedSet.has(fixture.id));
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
    throw new Error(
      'Missing EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY / EXPO_PUBLIC_CUSTOM_GPT_ENDPOINT'
    );
  }

  if (!token) {
    const email = getEnv(['LIVE_SUPABASE_EMAIL']);
    const password = getEnv(['LIVE_SUPABASE_PASSWORD']);
    const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
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

async function runDiscovery(
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

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const response = await fetch(authState.endpoint, {
      method: 'POST',
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
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
    if (response.status === 429 && attempt < 3) {
      await sleep(350 * attempt);
      continue;
    }
    if (!response.ok) {
      return {
        ok: false as const,
        stage: 'discovery_http',
        status: response.status,
        error_excerpt: responseText.slice(0, 300),
      };
    }
    const body = JSON.parse(responseText) as Record<string, unknown>;
    const content =
      (body.choices as Array<{ message?: { content?: string } }> | undefined)?.[0]?.message
        ?.content ?? '';
    const validation = validateArchetypeRecognitionResponse(content, {
      dreamText: fixture.dreamText,
      targetLanguageHint: fixture.targetLanguageHint,
    });
    if (!validation.ok && validation.issues.includes('language_validation_failed') && attempt < 2) {
      continue;
    }
    if (!validation.ok) {
      return {
        ok: false as const,
        stage: validation.issues.join('+'),
        status: 200,
        error_excerpt: validation.errors.join(' | ').slice(0, 300),
      };
    }
    return {
      ok: true as const,
      data: validation.data,
      auditRows: buildArchetypeRecognitionAuditRows(validation.data, {
        dreamText: fixture.dreamText,
      }),
      target_language: validation.targetLanguage.code,
    };
  }

  return {
    ok: false as const,
    stage: 'discovery_retry_exhausted',
    status: 0,
    error_excerpt: 'bounded retries exhausted',
  };
}

async function runAdjudication(
  fixture: Fixture,
  attemptIndex: number,
  discoveryResponse: ReturnType<typeof runDiscovery> extends Promise<infer T>
    ? T extends { ok: true; data: infer D }
      ? D
      : never
    : never,
  authState: { anon: string; endpoint: string; token: string },
  model: string
) {
  if (discoveryResponse.archetypes.length === 0) {
    return {
      ok: true as const,
      data: { decisions: [], accepted_archetype_ids: [] },
    };
  }

  const userPrompt = buildArchetypeAdjudicationUserPrompt({
    dreamText: fixture.dreamText,
    targetLanguageHint: fixture.targetLanguageHint,
    discoveryResponse,
  });
  const systemPrompt = buildArchetypeAdjudicationSystemPrompt(userPrompt.targetLanguage);

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const response = await fetch(authState.endpoint, {
      method: 'POST',
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: {
        'Content-Type': 'application/json',
        apikey: authState.anon,
        Authorization: `Bearer ${authState.token}`,
      },
      body: JSON.stringify({
        task: 'dream_archetype_adjudication',
        model,
        disable_anthropic_fallback: true,
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: `${userPrompt.prompt}\n\n[fixture:${fixture.id}:${attemptIndex}:${randomUUID()}]`,
          },
        ],
        temperature: ARCHETYPE_ADJUDICATION_TEMPERATURE,
        max_completion_tokens: ARCHETYPE_ADJUDICATION_TOKEN_LIMIT,
        max_tokens: ARCHETYPE_ADJUDICATION_TOKEN_LIMIT,
        response_format: buildArchetypeAdjudicationResponseFormat(),
      }),
    });
    const responseText = await response.text();
    if (response.status === 429 && attempt < 3) {
      await sleep(350 * attempt);
      continue;
    }
    if (!response.ok) {
      return {
        ok: false as const,
        stage: 'adjudication_http',
        status: response.status,
        error_excerpt: responseText.slice(0, 300),
      };
    }
    const body = JSON.parse(responseText) as Record<string, unknown>;
    const content =
      (body.choices as Array<{ message?: { content?: string } }> | undefined)?.[0]?.message
        ?.content ?? '';
    const validation = validateArchetypeAdjudicationResponse(content, {
      dreamText: fixture.dreamText,
      targetLanguageHint: fixture.targetLanguageHint,
    });
    if (!validation.ok && validation.issues.includes('language_validation_failed') && attempt < 2) {
      continue;
    }
    if (!validation.ok) {
      return {
        ok: false as const,
        stage: validation.issues.join('+'),
        status: 200,
        error_excerpt: validation.errors.join(' | ').slice(0, 300),
      };
    }
    return {
      ok: true as const,
      data: validation.data,
    };
  }

  return {
    ok: false as const,
    stage: 'adjudication_retry_exhausted',
    status: 0,
    error_excerpt: 'bounded retries exhausted',
  };
}

async function runOne(
  fixture: Fixture,
  attemptIndex: number,
  authState: { anon: string; endpoint: string; token: string },
  discoveryModel: string,
  adjudicationModel: string
) {
  const startedAt = Date.now();
  const discovery = await runDiscovery(fixture, attemptIndex, authState, discoveryModel);
  if (!discovery.ok) {
    return {
      fixture_id: fixture.id,
      semantic_success: false,
      stage: discovery.stage,
      status: discovery.status,
      latency_ms: Date.now() - startedAt,
      error_excerpt: discovery.error_excerpt,
    };
  }

  const adjudication = await runAdjudication(
    fixture,
    attemptIndex,
    discovery.data,
    authState,
    adjudicationModel
  );
  if (!adjudication.ok) {
    return {
      fixture_id: fixture.id,
      semantic_success: false,
      stage: adjudication.stage,
      status: adjudication.status,
      latency_ms: Date.now() - startedAt,
      error_excerpt: adjudication.error_excerpt,
      discovery_archetypes: discovery.auditRows,
    };
  }

  const applied = applyArchetypeAdjudicationToRecognition(discovery.data, adjudication.data);
  if (!applied.ok) {
    return {
      fixture_id: fixture.id,
      semantic_success: false,
      stage: applied.issues.join('+'),
      status: 200,
      latency_ms: Date.now() - startedAt,
      error_excerpt: applied.errors.join(' | ').slice(0, 300),
      discovery_archetypes: discovery.auditRows,
      adjudication: adjudication.data,
    };
  }

  const finalAuditRows = buildArchetypeRecognitionAuditRows(applied.filteredResponse, {
    dreamText: fixture.dreamText,
  });

  return {
    fixture_id: fixture.id,
    semantic_success: true as const,
    target_language: discovery.target_language,
    latency_ms: Date.now() - startedAt,
    discovery_archetypes: discovery.auditRows,
    adjudication: adjudication.data,
    final_archetypes: finalAuditRows,
    final_archetype_ids: applied.acceptedArchetypeIds,
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

function countRequiredHits(
  runs: Array<{ final_archetype_ids: ArchetypeRecognitionId[] }>,
  requiredIds: ArchetypeRecognitionId[]
): number {
  return runs.filter((run) => requiredIds.every((id) => run.final_archetype_ids.includes(id))).length;
}

function buildPerLabelConfusion(
  successfulRuns: Array<{ fixture_id: string; final_archetype_ids: ArchetypeRecognitionId[] }>
) {
  const labelIds = [...new Set(FIXTURES.flatMap((fixture) => fixture.expectation.required_archetype_ids))];
  return Object.fromEntries(
    labelIds.map((labelId) => {
      const runsExpecting = FIXTURES.filter((fixture) =>
        fixture.expectation.required_archetype_ids.includes(labelId)
      )
        .map((fixture) => fixture.id);
      const runsForExpectedFixtures = successfulRuns.filter((run) => runsExpecting.includes(run.fixture_id));
      const runsForUnexpectedFixtures = successfulRuns.filter((run) => !runsExpecting.includes(run.fixture_id));
      const truePositiveRuns = runsForExpectedFixtures.filter((run) =>
        run.final_archetype_ids.includes(labelId)
      ).length;
      const falseNegativeRuns = runsForExpectedFixtures.filter(
        (run) => !run.final_archetype_ids.includes(labelId)
      ).length;
      const falsePositiveRuns = runsForUnexpectedFixtures.filter((run) =>
        run.final_archetype_ids.includes(labelId)
      ).length;
      return [
        labelId,
        {
          expected_positive_runs: runsForExpectedFixtures.length,
          true_positive_runs: truePositiveRuns,
          false_negative_runs: falseNegativeRuns,
          false_positive_runs: falsePositiveRuns,
          returned_runs: successfulRuns.filter((run) => run.final_archetype_ids.includes(labelId)).length,
        },
      ];
    })
  );
}

function evaluateFixtureAcceptance(
  fixture: Fixture,
  runs: Array<{
    fixture_id: string;
    semantic_success: true;
    final_archetype_ids: ArchetypeRecognitionId[];
  }>
) {
  const exactSetPassCount = runs.filter(
    (run) => evaluateArchetypeSetExpectation(run.final_archetype_ids, fixture.expectation).pass
  ).length;
  const requiredHitCount = countRequiredHits(runs, fixture.expectation.required_archetype_ids);
  const unexpectedLabelRuns = runs.filter((run) => {
    const evaluated = evaluateArchetypeSetExpectation(run.final_archetype_ids, fixture.expectation);
    return evaluated.unexpectedIds.length > 0 || evaluated.forbiddenIdsReturned.length > 0;
  }).length;
  const failures: string[] = [];

  if (typeof fixture.requiredHitsMin === 'number' && requiredHitCount < fixture.requiredHitsMin) {
    failures.push(
      `required recall ${requiredHitCount}/${runs.length} < ${fixture.requiredHitsMin}`
    );
  }
  if (typeof fixture.exactSetPassMin === 'number' && exactSetPassCount < fixture.exactSetPassMin) {
    failures.push(`exact set ${exactSetPassCount}/${runs.length} < ${fixture.exactSetPassMin}`);
  }
  if (
    typeof fixture.unexpectedLabelMax === 'number' &&
    unexpectedLabelRuns > fixture.unexpectedLabelMax
  ) {
    failures.push(
      `unexpected label runs ${unexpectedLabelRuns}/${runs.length} > ${fixture.unexpectedLabelMax}`
    );
  }

  return {
    fixture_id: fixture.id,
    successful_runs: runs.length,
    exact_set_pass_count: exactSetPassCount,
    required_hit_count: requiredHitCount,
    unexpected_label_runs: unexpectedLabelRuns,
    pass: failures.length === 0,
    failures,
  };
}

async function main() {
  const discoveryModel =
    getEnv(['ARCHETYPE_RECOGNITION_MODEL']) || ARCHETYPE_RECOGNITION_MODEL;
  const adjudicationModel =
    getEnv(['ARCHETYPE_ADJUDICATION_MODEL']) || ARCHETYPE_ADJUDICATION_MODEL;
  const concurrency = Number(getEnv(['ARCHETYPE_RECOGNITION_CONCURRENCY']) || '2');
  const selectedFixtures = getSelectedFixtures();
  const authState = await auth();
  const outDir = path.join(
    process.cwd(),
    `tmp/archetype-recognition-adjudication-${new Date().toISOString().replace(/[:.]/g, '-')}`
  );
  mkdirSync(outDir, { recursive: true });

  const plannedRuns = selectedFixtures.flatMap((fixture) =>
    Array.from({ length: fixture.repeats }, (_, attemptIndex) => ({
      fixture,
      attemptIndex: attemptIndex + 1,
    }))
  );

  const results = await runPool(plannedRuns, concurrency, ({ fixture, attemptIndex }) =>
    runOne(fixture, attemptIndex, authState, discoveryModel, adjudicationModel)
  );

  const successfulRuns = results.filter(
    (result): result is Extract<(typeof results)[number], { semantic_success: true }> =>
      result.semantic_success
  );

  const fixtureSummaries = selectedFixtures.map((fixture) => {
    const runs = successfulRuns.filter((result) => result.fixture_id === fixture.id);
    return {
      ...evaluateFixtureAcceptance(fixture, runs),
      semantic_failures: results
        .filter((result) => result.fixture_id === fixture.id && !result.semantic_success)
        .map((result) => ({
          stage: result.stage,
          status: result.status,
          latency_ms: result.latency_ms,
          error_excerpt: result.error_excerpt,
        })),
    };
  });

  const packet = {
    generated_at: new Date().toISOString(),
    task: 'dream_archetype_recognition → dream_archetype_adjudication',
    discovery_prompt_version: ARCHETYPE_RECOGNITION_PROMPT_VERSION,
    discovery_response_schema_version: ARCHETYPE_RECOGNITION_SCHEMA_VERSION,
    recognition_catalog_version: ARCHETYPE_RECOGNITION_CATALOG_VERSION,
    adjudication_prompt_version: ARCHETYPE_ADJUDICATION_PROMPT_VERSION,
    adjudication_response_schema_version: ARCHETYPE_ADJUDICATION_SCHEMA_VERSION,
    boundary_catalog_version: ARCHETYPE_BOUNDARY_CATALOG_VERSION,
    discovery_model: discoveryModel,
    adjudication_model: adjudicationModel,
    discovery_temperature: ARCHETYPE_RECOGNITION_TEMPERATURE,
    adjudication_temperature: ARCHETYPE_ADJUDICATION_TEMPERATURE,
    concurrency,
    fixture_count: selectedFixtures.length,
    planned_semantic_runs: plannedRuns.length,
    results,
    acceptance: fixtureSummaries,
    exact_set_pass_rate: `${fixtureSummaries.reduce((sum, item) => sum + item.exact_set_pass_count, 0)}/${successfulRuns.length}`,
    required_label_recall: Object.fromEntries(
      selectedFixtures.filter((fixture) => fixture.expectation.required_archetype_ids.length > 0).map(
        (fixture) => [
          fixture.id,
          `${countRequiredHits(
            successfulRuns.filter((run) => run.fixture_id === fixture.id),
            fixture.expectation.required_archetype_ids
          )}/${fixture.repeats}`,
        ]
      )
    ),
    unexpected_label_false_positive_rate: `${fixtureSummaries.reduce(
      (sum, item) => sum + item.unexpected_label_runs,
      0
    )}/${successfulRuns.length}`,
    per_label_confusion: buildPerLabelConfusion(successfulRuns),
    fixture_hashes: selectedFixtures.map((fixture) => ({
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
