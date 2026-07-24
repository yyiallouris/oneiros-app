/**
 * Live qualitative smoke for a crafted dream.
 *
 * This is intentionally opt-in because it makes real AI calls and consumes
 * provider/quota budget. It verifies more than connectivity: the generated
 * reflection should read like a restrained post-Jungian analysis, and the
 * extracted metadata should preserve the dream's main symbolic material.
 */
import { existsSync, readFileSync } from 'fs';
import path from 'path';
import {
  buildDreamExtractionSystemPrompt,
  buildDreamExtractionUserPrompt,
  DREAM_EXTRACTION_TEMPERATURE,
  DREAM_EXTRACTION_TOKEN_LIMIT,
} from '../../src/ai/dreamExtractionPrompt';

type LiveConfig = {
  supabaseUrl: string;
  supabaseAnonKey: string;
  openaiProxyEndpoint: string;
  accessToken?: string;
  email?: string;
  password?: string;
};

type DreamExtraction = {
  display_distillation?: {
    essence_title?: string;
    essence_line?: string;
    dominant_lens?: string;
    visible_anchors?: Array<{ label?: string; type?: string; salience?: number; ui_meaning?: string }>;
    main_tension?: string | null;
    dream_movement?: string | null;
    movement_line?: string | null;
  };
  symbols?: string[];
  symbol_stances?: Array<{ symbol?: string; stance?: string }>;
  archetypes?: string[];
  landscapes?: string[];
  affects?: string[];
  motifs?: string[];
  relational_dynamics?: string[];
  thresholds?: string[];
  central_conflicts?: string[];
  core_mode?: string | null;
  amplifications?: string[];
};

const RUN_QUALITY_TESTS =
  process.env.RUN_LIVE_AI_TESTS === '1' &&
  process.env.RUN_LIVE_AI_QUALITY_TESTS === '1';
const describeQuality = RUN_QUALITY_TESTS ? describe : describe.skip;

const TEST_DREAM = {
  title: 'The Bowl, the Dog, and the Buttonless Elevator',
  date: '2026-07-20',
  content:
    'I am back in my childhood apartment carrying a shallow bowl filled with black water. A small white dog keeps looking back at me and leads me toward an elevator with no buttons. Behind frosted glass my mother calls my name, but her voice sounds as if it is underwater. I try to open a brown suitcase on the floor; it is full of damp soil and old keys, and one brass key melts into wax in my hand. The elevator doors open by themselves and take me to the roof. I am barefoot. The moon is reflected in the bowl, and I suddenly remember that I forgot my shoes downstairs.',
};

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

async function fetchWithShortTimeout(url: string, init: RequestInit, timeoutMs = 45000): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
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

function parseChatContent(data: unknown): string {
  const body = data as { choices?: Array<{ message?: { content?: string } }>; content?: string; text?: string };
  return body.choices?.[0]?.message?.content ?? body.content ?? body.text ?? '';
}

async function callProxy(config: LiveConfig, accessToken: string, payload: Record<string, unknown>): Promise<string> {
  const response = await fetchWithShortTimeout(config.openaiProxyEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: config.supabaseAnonKey,
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  });
  const text = await response.text();
  expect(response.ok).toBe(true);
  const data = JSON.parse(text) as unknown;
  const content = parseChatContent(data).trim();
  expect(content.length).toBeGreaterThan(20);
  return content;
}

function stripCodeFence(text: string): string {
  return text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim();
}

function parseJsonObject<T>(text: string): T {
  const cleaned = stripCodeFence(text);
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  expect(start).toBeGreaterThanOrEqual(0);
  expect(end).toBeGreaterThan(start);
  return JSON.parse(cleaned.slice(start, end + 1)) as T;
}

function textIncludesAny(text: string, terms: string[]): boolean {
  const normalized = text.toLowerCase();
  return terms.some((term) => normalized.includes(term.toLowerCase()));
}

function termsIncludeAny(terms: string[] | undefined, expected: string[]): boolean {
  const joined = (terms ?? []).join(' | ').toLowerCase();
  return expected.some((term) => joined.includes(term.toLowerCase()));
}

function scoreReflectionAsPostJungian(reflection: string): string[] {
  const failures: string[] = [];
  if (!textIncludesAny(reflection, ['bowl', 'black water', 'water'])) failures.push('misses the bowl/black water image');
  if (!textIncludesAny(reflection, ['dog'])) failures.push('misses the guiding white dog');
  if (!textIncludesAny(reflection, ['elevator', 'roof', 'upward', 'ascent'])) failures.push('misses the elevator/roof threshold movement');
  if (!textIncludesAny(reflection, ['mother', 'frosted glass', 'voice'])) failures.push('misses the maternal call behind glass');
  if (!textIncludesAny(reflection, ['key', 'suitcase', 'soil', 'wax'])) failures.push('misses the suitcase/key/soil material');
  if (!textIncludesAny(reflection, ['barefoot', 'shoes'])) failures.push('misses the barefoot/forgotten shoes ending');
  if (!textIncludesAny(reflection, ['may', 'might', 'could', 'seems', 'suggests', 'perhaps'])) {
    failures.push('does not keep interpretation hypothetical');
  }
  if (textIncludesAny(reflection, ['diagnosis', 'trauma response', 'disorder', 'pathology'])) {
    failures.push('uses clinical/diagnostic framing');
  }
  if (textIncludesAny(reflection, ['you should', 'you need to', 'try to', 'practice', 'work on'])) {
    failures.push('turns into advice instead of reflection');
  }
  return failures;
}

describeQuality('live crafted dream analysis quality', () => {
  const config = getLiveConfig();
  const hasAuthMaterial = Boolean(config.accessToken || (config.email && config.password));
  const itWithAuth = hasAuthMaterial ? it : it.skip;

  itWithAuth('generates an image-near post-Jungian reflection and extracts expected Insights metadata', async () => {
    expect(config.openaiProxyEndpoint).toContain('/functions/v1/openai-proxy');
    const accessToken = await getLiveAccessToken(config);

    const reflection = await callProxy(config, accessToken, {
      task: 'interpretation_standard',
      model: 'gpt-5.4',
      messages: [
        {
          role: 'system',
          content:
            'Act as Dream Weaver, a restrained post-Jungian dream analyst. Interpret symbolically, never literally. Stay image-near, hypothetical, non-clinical, and non-advisory.',
        },
        {
          role: 'user',
          content: `Dream title: ${TEST_DREAM.title}\nDate: ${TEST_DREAM.date}\nDream:\n${TEST_DREAM.content}\n\nWrite a compact symbolic reflection in 3-5 short paragraphs. Ground every major claim in concrete dream images. No diagnosis, no advice.`,
        },
      ],
      temperature: 0.45,
      max_completion_tokens: 900,
      max_tokens: 900,
    });

    const reflectionFailures = scoreReflectionAsPostJungian(reflection);
    expect(reflectionFailures).toEqual([]);

    const extractionText = await callProxy(config, accessToken, {
      task: 'dream_extraction',
      model: 'gpt-5.4-mini',
      messages: [
        {
          role: 'system',
          content: buildDreamExtractionSystemPrompt(),
        },
        {
          role: 'user',
          content: buildDreamExtractionUserPrompt({
            title: TEST_DREAM.title,
            date: TEST_DREAM.date,
            content: TEST_DREAM.content,
            finalInterpretation: reflection,
          }),
        },
      ],
      temperature: DREAM_EXTRACTION_TEMPERATURE,
      max_completion_tokens: DREAM_EXTRACTION_TOKEN_LIMIT,
      max_tokens: DREAM_EXTRACTION_TOKEN_LIMIT,
      response_format: { type: 'json_object' },
    });
    const extraction = parseJsonObject<DreamExtraction>(extractionText);

    expect(extraction.display_distillation?.essence_title?.length ?? 0).toBeGreaterThan(3);
    expect(extraction.display_distillation?.essence_line?.length ?? 0).toBeGreaterThan(20);
    expect(extraction.display_distillation?.visible_anchors?.length ?? 0).toBeGreaterThanOrEqual(3);
    expect(extraction.display_distillation?.visible_anchors?.length ?? 0).toBeLessThanOrEqual(5);
    expect(termsIncludeAny(extraction.symbols, ['bowl', 'water'])).toBe(true);
    expect(termsIncludeAny(extraction.symbols, ['dog'])).toBe(true);
    expect(termsIncludeAny(extraction.symbols, ['elevator', 'key', 'shoe', 'suitcase'])).toBe(true);
    expect(termsIncludeAny(extraction.landscapes, ['apartment', 'elevator', 'roof'])).toBe(true);
    expect(termsIncludeAny(extraction.thresholds, ['elevator', 'roof', 'door', 'downstairs'])).toBe(true);
    expect(termsIncludeAny(extraction.motifs, ['ascent', 'forgotten', 'threshold', 'guidance', 'return'])).toBe(true);
    expect(['Core Tension', 'Core Shift', 'Core State', 'Core Restoration', null]).toContain(extraction.core_mode ?? null);
    expect(extraction.central_conflicts?.length ?? 0).toBeLessThanOrEqual(2);
    expect(extraction.symbol_stances?.length ?? 0).toBeGreaterThanOrEqual(1);
  }, 90000);
});
