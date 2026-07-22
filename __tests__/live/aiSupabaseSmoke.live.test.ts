/**
 * Live smoke coverage for Supabase and AI proxy wiring.
 *
 * These tests are intentionally skipped unless RUN_LIVE_AI_TESTS=1 is set.
 * They read local env/.env configuration, avoid logging secrets, and make only
 * tiny requests so they can verify deployed wiring without becoming normal CI.
 */
import { existsSync, readFileSync } from 'fs';
import path from 'path';

type LiveConfig = {
  supabaseUrl: string;
  supabaseAnonKey: string;
  openaiProxyEndpoint: string;
  accessToken?: string;
  email?: string;
  password?: string;
};

const RUN_LIVE_AI_TESTS = process.env.RUN_LIVE_AI_TESTS === '1';
const describeLive = RUN_LIVE_AI_TESTS ? describe : describe.skip;

function loadDotenvValue(key: string): string | undefined {
  const envPath = path.join(process.cwd(), '.env');
  if (!existsSync(envPath)) return undefined;
  const raw = readFileSync(envPath, 'utf8');
  const match = raw.match(new RegExp(`^${key}\\s*=\\s*(.*)$`, 'm'));
  if (!match) return undefined;
  const value = match[1].trim();
  return value.replace(/^['"]|['"]$/g, '');
}

function getEnv(keys: string[]): string {
  for (const key of keys) {
    const dotenvValue = loadDotenvValue(key);
    const value = dotenvValue ?? process.env[key];
    if (typeof value === 'string' && value.trim().length > 0) return value.trim();
  }
  return '';
}

function getLiveConfig(): LiveConfig {
  return {
    supabaseUrl: getEnv(['EXPO_PUBLIC_SUPABASE_URL', 'SUPABASE_URL']),
    supabaseAnonKey: getEnv(['EXPO_PUBLIC_SUPABASE_ANON_KEY', 'SUPABASE_ANON_KEY']),
    openaiProxyEndpoint: getEnv(['EXPO_PUBLIC_CUSTOM_GPT_ENDPOINT', 'CUSTOM_GPT_ENDPOINT']),
    accessToken: getEnv(['LIVE_SUPABASE_ACCESS_TOKEN', 'SUPABASE_ACCESS_TOKEN']) || undefined,
    email: getEnv(['LIVE_SUPABASE_EMAIL']) || undefined,
    password: getEnv(['LIVE_SUPABASE_PASSWORD']) || undefined,
  };
}

async function fetchWithShortTimeout(url: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

function parseChatContent(data: unknown): string {
  const body = data as { choices?: Array<{ message?: { content?: string } }>; content?: string; text?: string };
  return body.choices?.[0]?.message?.content ?? body.content ?? body.text ?? '';
}

async function getLiveAccessToken(config: LiveConfig): Promise<string> {
  if (config.accessToken) return config.accessToken;
  if (!config.email || !config.password) throw new Error('Missing live Supabase auth material');

  const response = await fetchWithShortTimeout(`${config.supabaseUrl.replace(/\/$/, '')}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: config.supabaseAnonKey,
    },
    body: JSON.stringify({
      email: config.email,
      password: config.password,
    }),
  });
  const text = await response.text();
  expect(response.ok).toBe(true);
  const data = JSON.parse(text) as { access_token?: string };
  expect(data.access_token?.length ?? 0).toBeGreaterThan(20);
  return data.access_token!;
}

describeLive('live Supabase and AI proxy smoke', () => {
  const config = getLiveConfig();
  const hasAuthMaterial = Boolean(config.accessToken || (config.email && config.password));
  const itWithAuth = hasAuthMaterial ? it : it.skip;

  it('reaches Supabase auth health using configured URL and anon key', async () => {
    expect(config.supabaseUrl).toMatch(/^https:\/\/.+/);
    expect(config.supabaseAnonKey.length).toBeGreaterThan(20);

    const response = await fetchWithShortTimeout(`${config.supabaseUrl.replace(/\/$/, '')}/auth/v1/health`, {
      method: 'GET',
      headers: {
        apikey: config.supabaseAnonKey,
      },
    });

    expect(response.status).toBeGreaterThanOrEqual(200);
    expect(response.status).toBeLessThan(500);
  });

  it('reaches openai-proxy and rejects unauthenticated AI calls before provider work', async () => {
    expect(config.openaiProxyEndpoint).toContain('/functions/v1/openai-proxy');

    const response = await fetchWithShortTimeout(config.openaiProxyEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: config.supabaseAnonKey,
        Authorization: `Bearer ${config.supabaseAnonKey}`,
      },
      body: JSON.stringify({
        task: 'semantic_grouping',
        model: 'gpt-5.4-mini',
        messages: [
          { role: 'system', content: 'Return only valid JSON.' },
          { role: 'user', content: 'Return {"ok":true}.' },
        ],
        temperature: 0,
        max_completion_tokens: 80,
        max_tokens: 80,
        response_format: { type: 'json_object' },
      }),
    });

    expect([401, 403]).toContain(response.status);
  });

  itWithAuth('runs a tiny authenticated AI proxy call and receives parseable JSON', async () => {
    const accessToken = await getLiveAccessToken(config);
    const response = await fetchWithShortTimeout(config.openaiProxyEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: config.supabaseAnonKey,
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        task: 'semantic_grouping',
        model: 'gpt-5.4-mini',
        messages: [
          {
            role: 'system',
            content: 'Return only valid JSON. No markdown.',
          },
          {
            role: 'user',
            content: 'Return exactly this JSON shape with ok true: {"ok":true,"smoke":"oneiros"}',
          },
        ],
        temperature: 0,
        max_completion_tokens: 80,
        max_tokens: 80,
        response_format: { type: 'json_object' },
      }),
    });

    const text = await response.text();
    expect(response.ok).toBe(true);

    const data = JSON.parse(text) as unknown;
    const content = parseChatContent(data);
    expect(content).toContain('{');
    expect(() => JSON.parse(content)).not.toThrow();
    expect(JSON.parse(content)).toMatchObject({ ok: true });
  });
});
