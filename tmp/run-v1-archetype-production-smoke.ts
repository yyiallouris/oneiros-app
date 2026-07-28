import { randomUUID } from 'crypto';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import path from 'path';

type Fixture = {
  id: string;
  dream: string;
  expectedArchetypeIds: string[];
};

type GatewayResponse = {
  status?: string;
  interpretation_id?: string;
  interpretation?: { id?: string };
  metadata_status?: string;
  error?: unknown;
};

const MAX_FIXTURE_ATTEMPTS = 3;

const FIXTURES: Fixture[] = [
  {
    id: 'sea_mattress_el_exact',
    dream:
      'Είδα ένα όνειρο. Ήμουν ξαπλωμένη σε ένα θαλάσσιο στρώμα, σε μια πολύ γαλήνια θάλασσα και πάνω μου ήταν ξαπλωμένος ο φίλος μου και κοιτούσαμε το βυθό και εξερευνούσαμε όλο το βυθό. Ήταν πολύ ήρεμα, γαλήνια, όμορφα, πάντα πολύ ήρεμα.',
    expectedArchetypeIds: ['lover'],
  },
  {
    id: 'warm_friends_en',
    dream:
      'I dreamed I was sitting with two close friends on a porch at sunset. We talked warmly, laughed, and watched the light fade together before going home.',
    expectedArchetypeIds: [],
  },
  {
    id: 'guide_negative_carrier_only_en',
    dream:
      'I dreamed an older taxi driver took me to the airport, dropped me off, and drove away while I dealt with the rest by myself.',
    expectedArchetypeIds: [],
  },
  {
    id: 'mother_positive_en',
    dream:
      'I dreamed I was inside a vast warm house that seemed to hold and feed everyone. Bowls kept appearing, and each room felt like a shelter no one wanted to leave.',
    expectedArchetypeIds: ['mother'],
  },
  {
    id: 'persona_positive_en',
    dream:
      'I dreamed I had to keep smiling in a formal uniform while inside I wanted to run away and say who I really was. The whole event depended on the role holding.',
    expectedArchetypeIds: ['persona'],
  },
  {
    id: 'divine_child_positive_en',
    dream:
      'I dreamed a small glowing child was sleeping in my hands while everyone around me stopped what they were doing to protect it and clear a way forward.',
    expectedArchetypeIds: ['divine_child'],
  },
];

function getSelectedFixtures(): Fixture[] {
  const raw = getEnv(['ARCHETYPE_SMOKE_FIXTURES']);
  if (!raw) return FIXTURES;
  const ids = raw
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
  if (ids.length === 0) return FIXTURES;
  const wanted = new Set(ids);
  return FIXTURES.filter((fixture) => wanted.has(fixture.id));
}

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
    const value = loadDotenvValue(key) ?? process.env[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
}

function getConfig() {
  const supabaseUrl = getEnv(['EXPO_PUBLIC_SUPABASE_URL', 'SUPABASE_URL']);
  const supabaseAnonKey = getEnv(['EXPO_PUBLIC_SUPABASE_ANON_KEY', 'SUPABASE_ANON_KEY']);
  const accessToken = getEnv(['LIVE_SUPABASE_ACCESS_TOKEN', 'SUPABASE_ACCESS_TOKEN']);
  const email = getEnv(['LIVE_SUPABASE_EMAIL']);
  const password = getEnv(['LIVE_SUPABASE_PASSWORD']);
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase URL or anon key');
  }
  return {
    supabaseUrl: supabaseUrl.replace(/\/$/, ''),
    supabaseAnonKey,
    accessToken,
    email,
    password,
  };
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs = 60000): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

async function getAccessToken(config: ReturnType<typeof getConfig>): Promise<string> {
  if (config.accessToken) return config.accessToken;
  if (!config.email || !config.password) {
    throw new Error('Missing LIVE_SUPABASE_ACCESS_TOKEN or LIVE_SUPABASE_EMAIL/LIVE_SUPABASE_PASSWORD');
  }
  const response = await fetchWithTimeout(
    `${config.supabaseUrl}/auth/v1/token?grant_type=password`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: config.supabaseAnonKey,
      },
      body: JSON.stringify({
        email: config.email,
        password: config.password,
      }),
    }
  );
  if (!response.ok) {
    throw new Error(`Auth failed: ${response.status} ${await response.text()}`);
  }
  const data = (await response.json()) as { access_token?: string };
  if (!data.access_token) throw new Error('Auth response missing access_token');
  return data.access_token;
}

async function getUserId(config: ReturnType<typeof getConfig>, accessToken: string): Promise<string> {
  const response = await fetchWithTimeout(`${config.supabaseUrl}/auth/v1/user`, {
    headers: {
      apikey: config.supabaseAnonKey,
      Authorization: `Bearer ${accessToken}`,
    },
  });
  if (!response.ok) {
    throw new Error(`User lookup failed: ${response.status} ${await response.text()}`);
  }
  const data = (await response.json()) as { id?: string };
  if (!data.id) throw new Error('User lookup missing id');
  return data.id;
}

function restHeaders(config: ReturnType<typeof getConfig>, accessToken: string): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    apikey: config.supabaseAnonKey,
    Authorization: `Bearer ${accessToken}`,
  };
}

async function upsertDream(
  config: ReturnType<typeof getConfig>,
  accessToken: string,
  userId: string,
  dreamId: string,
  content: string
): Promise<void> {
  const response = await fetchWithTimeout(
    `${config.supabaseUrl}/rest/v1/dreams?on_conflict=id`,
    {
      method: 'POST',
      headers: {
        ...restHeaders(config, accessToken),
        Prefer: 'resolution=merge-duplicates,return=minimal',
      },
      body: JSON.stringify([
        {
          id: dreamId,
          user_id: userId,
          title: `Smoke ${dreamId}`,
          date: '2026-07-28',
          content,
          archived: false,
        },
      ]),
    }
  );
  if (!response.ok) {
    throw new Error(`Dream upsert failed: ${response.status} ${await response.text()}`);
  }
}

async function callGateway(
  config: ReturnType<typeof getConfig>,
  accessToken: string,
  body: Record<string, unknown>
): Promise<GatewayResponse> {
  const response = await fetchWithTimeout(
    `${config.supabaseUrl}/functions/v1/ai-entitlements-gateway`,
    {
      method: 'POST',
      headers: restHeaders(config, accessToken),
      body: JSON.stringify(body),
    },
    120000
  );
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Gateway failed: ${response.status} ${text}`);
  }
  return JSON.parse(text) as GatewayResponse;
}

async function fetchInterpretationArchetypes(
  config: ReturnType<typeof getConfig>,
  accessToken: string,
  interpretationId: string
): Promise<{ metadataStatus: string | null; archetypeIds: string[] }> {
  const response = await fetchWithTimeout(
    `${config.supabaseUrl}/rest/v1/interpretations?id=eq.${encodeURIComponent(interpretationId)}&select=id,metadata_status,archetypes`,
    {
      headers: {
        ...restHeaders(config, accessToken),
        Accept: 'application/json',
      },
    }
  );
  if (!response.ok) {
    throw new Error(`Interpretation fetch failed: ${response.status} ${await response.text()}`);
  }
  const rows = (await response.json()) as Array<{
    metadata_status?: string | null;
    archetypes?: Array<{ archetype_id?: string; canonical_label?: string }> | null;
  }>;
  const row = rows[0];
  if (!row) throw new Error(`Interpretation ${interpretationId} not found after metadata extraction`);
  const archetypeIds = Array.isArray(row.archetypes)
    ? row.archetypes
        .map((item) => (typeof item?.archetype_id === 'string' ? item.archetype_id : ''))
        .filter(Boolean)
    : [];
  return {
    metadataStatus: row.metadata_status ?? null,
    archetypeIds,
  };
}

async function cleanupRows(
  config: ReturnType<typeof getConfig>,
  accessToken: string,
  dreamId: string,
  interpretationId: string
): Promise<void> {
  await fetchWithTimeout(
    `${config.supabaseUrl}/rest/v1/interpretations?id=eq.${encodeURIComponent(interpretationId)}`,
    {
      method: 'DELETE',
      headers: {
        ...restHeaders(config, accessToken),
        Prefer: 'return=minimal',
      },
    }
  );
  await fetchWithTimeout(
    `${config.supabaseUrl}/rest/v1/dreams?id=eq.${encodeURIComponent(dreamId)}`,
    {
      method: 'DELETE',
      headers: {
        ...restHeaders(config, accessToken),
        Prefer: 'return=minimal',
      },
    }
  );
}

async function main() {
  const config = getConfig();
  const accessToken = await getAccessToken(config);
  const userId = await getUserId(config, accessToken);
  const fixtures = getSelectedFixtures();
  const results: Array<Record<string, unknown>> = [];

  for (const fixture of fixtures) {
    console.log(`[smoke] start ${fixture.id}`);
    let passed = false;
    for (let attempt = 1; attempt <= MAX_FIXTURE_ATTEMPTS; attempt += 1) {
      const dreamId = `smoke-dream-${fixture.id}-${randomUUID()}`;
      let interpretationId = '';
      try {
        await upsertDream(config, accessToken, userId, dreamId, fixture.dream);
        const reflection = await callGateway(config, accessToken, {
          action: 'dream_reflection_generate',
          idempotencyKey: `smoke-reflection-${fixture.id}-${randomUUID()}`,
          dreamId,
          depth: 'standard',
        });
        interpretationId = reflection.interpretation_id ?? reflection.interpretation?.id ?? '';
        if (!interpretationId) {
          throw new Error(`Reflection response missing interpretation_id for ${fixture.id}`);
        }

        const metadata = await callGateway(config, accessToken, {
          action: 'dream_metadata_extract',
          idempotencyKey: `smoke-metadata-${fixture.id}-${randomUUID()}`,
          interpretationId,
        });

        const persisted = await fetchInterpretationArchetypes(config, accessToken, interpretationId);
        const actual = [...persisted.archetypeIds].sort();
        const expected = [...fixture.expectedArchetypeIds].sort();
        const pass =
          persisted.metadataStatus === 'ready' &&
          actual.length === expected.length &&
          actual.every((value, index) => value === expected[index]);

        results.push({
          fixture: fixture.id,
          attempt,
          interpretationId,
          metadataStatus: persisted.metadataStatus,
          expected,
          actual,
          gatewayMetadataStatus: metadata.metadata_status ?? null,
          pass,
        });
        console.log(
          `[smoke] ${fixture.id} attempt ${attempt} metadata_status=${persisted.metadataStatus} actual=${JSON.stringify(actual)} expected=${JSON.stringify(expected)} pass=${pass}`
        );

        await cleanupRows(config, accessToken, dreamId, interpretationId);

        if (!pass) {
          throw new Error(
            `${fixture.id} expected ${JSON.stringify(expected)} but got ${JSON.stringify(actual)} with metadata_status=${persisted.metadataStatus}`
          );
        }
        passed = true;
        break;
      } catch (error) {
        results.push({
          fixture: fixture.id,
          attempt,
          interpretationId: interpretationId || null,
          pass: false,
          error: error instanceof Error ? error.message : String(error),
        });
        console.log(
          `[smoke] ${fixture.id} attempt ${attempt} failed: ${error instanceof Error ? error.message : String(error)}`
        );
        if (interpretationId) {
          await cleanupRows(config, accessToken, dreamId, interpretationId).catch(() => undefined);
        } else {
          await fetchWithTimeout(
            `${config.supabaseUrl}/rest/v1/dreams?id=eq.${encodeURIComponent(dreamId)}`,
            {
              method: 'DELETE',
              headers: {
                ...restHeaders(config, accessToken),
                Prefer: 'return=minimal',
              },
            }
          ).catch(() => undefined);
        }
        if (attempt >= MAX_FIXTURE_ATTEMPTS) {
          throw error;
        }
      }
    }
    if (!passed) {
      throw new Error(`Fixture ${fixture.id} did not pass within ${MAX_FIXTURE_ATTEMPTS} attempts`);
    }
  }

  const outDir = path.join(process.cwd(), 'tmp', 'v1-archetype-production-smoke');
  mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, 'results.json');
  writeFileSync(outPath, JSON.stringify({ runAt: new Date().toISOString(), results }, null, 2));
  console.log(JSON.stringify({ outPath, results }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
