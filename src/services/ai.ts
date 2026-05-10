import type { Dream, ChatMessage, Interpretation } from '../types/dream';
import Constants from 'expo-constants';
import { logError, logInfo } from './logger';
import type { ArchetypeName } from '../constants/archetypes';
import { ARCHETYPE_WHITELIST, normalizeArchetypeList } from '../constants/archetypes';
import { MAX_AI_RESPONSES } from '../constants/interpretation';

type ModelCapabilities = {
  supportsResponseFormat: boolean;
  supportsMaxCompletionTokens: boolean;
  defaultTimeout: number;
};

const defaultsFromModel = (model: string): ModelCapabilities => {
  const isGpt5 = /^gpt-5/i.test(model);
  if (isGpt5) {
    return {
      supportsResponseFormat: true,
      supportsMaxCompletionTokens: true,
      defaultTimeout: 60000,
    };
  }

  const isGpt4 = /^gpt-4/i.test(model);
  const isGpt35 = /^gpt-3\.5/i.test(model);
  if (isGpt4 || isGpt35) {
    return {
      supportsResponseFormat: true,
      supportsMaxCompletionTokens: true,
      defaultTimeout: 30000,
    };
  }

  return {
    supportsResponseFormat: false,
    supportsMaxCompletionTokens: true,
    defaultTimeout: 30000,
  };
};

const modelCapabilitiesCache = new Map<string, ModelCapabilities>();

const getModelCapabilities = (model: string): ModelCapabilities => {
  const cached = modelCapabilitiesCache.get(model);
  if (cached) return cached;

  const caps = defaultsFromModel(model);

  const cfgResp = getConfig('modelSupportsResponseFormat');
  const cfgTimeout = getConfig('defaultTimeoutMs');
  const cfgMaxTok = getConfig('supportsMaxCompletionTokens');

  if (cfgResp !== null) caps.supportsResponseFormat = cfgResp === 'true';
  if (cfgTimeout) {
    const parsedTimeout = parseInt(cfgTimeout, 10);
    if (!Number.isNaN(parsedTimeout) && parsedTimeout > 0) caps.defaultTimeout = parsedTimeout;
  }
  if (cfgMaxTok !== null) caps.supportsMaxCompletionTokens = cfgMaxTok === 'true';

  modelCapabilitiesCache.set(model, caps);
  return caps;
};

function getConfig(key: string, defaultValue: string | null = null): string | null {
  try {
    const extraValue = Constants.expoConfig?.extra?.[key];
    if (extraValue && typeof extraValue === 'string') return extraValue;

    const manifestValue = (Constants.manifest as any)?.extra?.[key];
    if (manifestValue && typeof manifestValue === 'string') return manifestValue;

    return defaultValue;
  } catch (error) {
    logError('ai_config_error', error, { key });
    return defaultValue;
  }
}

function safeHostname(rawUrl: string): string | null {
  const u = (rawUrl || '').trim();
  try {
    if (typeof URL !== 'undefined') return new URL(u).hostname.toLowerCase();
  } catch {}
  const m = u.match(/^https?:\/\/([^/]+)/i);
  return m?.[1]?.toLowerCase() ?? null;
}

function isOpenAIHost(url: string): boolean {
  const host = safeHostname(url);
  return host === 'api.openai.com';
}

function requiresClientKey(apiUrl: string): boolean {
  return __DEV__ && isOpenAIHost(apiUrl);
}

function supportsProxyTaskRouting(apiUrl: string): boolean {
  return apiUrl.includes('/functions/v1/openai-proxy');
}

/**
 * When using Supabase `openai-proxy`, real model ids are only in task-config.ts.
 * This value shapes the client payload only: token param family, timeouts, and logging hint.
 */
const PROXY_REQUEST_MODEL_HINT = 'gpt-5.4-mini';

const getModel = (): string => {
  const custom = getConfig('customGptEndpoint', null);
  const apiUrl = custom || 'https://api.openai.com/v1/chat/completions';
  if (supportsProxyTaskRouting(apiUrl)) return PROXY_REQUEST_MODEL_HINT;

  const model = getConfig('gptModel', 'gpt-5.4-mini');
  return model || 'gpt-5.4-mini';
};

const getApiKey = (): string => {
  if (!__DEV__) return 'disabled-in-production';

  const key = getConfig('openaiApiKey', 'your-openai-api-key');
  const customEndpoint = getConfig('customGptEndpoint', null);
  if (__DEV__) {
    const usesOpenaiProxy =
      typeof customEndpoint === 'string' && customEndpoint.includes('/functions/v1/openai-proxy');
    console.log('[AI] Config detected', {
      hasKey: !!key && key !== 'your-openai-api-key',
      apiUrl: customEndpoint ?? 'https://api.openai.com/v1/chat/completions',
      models: usesOpenaiProxy
        ? 'set in supabase/functions/openai-proxy/task-config.ts (client sends shape hint only)'
        : `direct OpenAI / other: gptModel extra → ${getConfig('gptModel', 'gpt-5.4-mini')}`,
      source: Constants.expoConfig?.extra ? 'expo.extra' : 'env/manifest',
    });
  }
  return key || 'your-openai-api-key';
};

const getApiUrl = (): string => {
  const customEndpoint = getConfig('customGptEndpoint', null);
  const apiUrl = customEndpoint || 'https://api.openai.com/v1/chat/completions';

  if (!__DEV__ && isOpenAIHost(apiUrl)) {
    logError('ai_production_config_error', new Error('Direct OpenAI calls are disabled in production. Use a server proxy.'));
    throw new Error('AI service is not configured. Please update the app or try again later.');
  }

  return apiUrl;
};

const buildHeaders = async (
  apiUrl: string,
  apiKey: string,
  requestId?: string,
  dreamId?: string
): Promise<Record<string, string>> => {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };

  if (requiresClientKey(apiUrl)) {
    headers.Authorization = `Bearer ${apiKey}`;
  } else {
    const supabaseKey =
      getConfig('supabaseAnonKey') ||
      Constants.expoConfig?.extra?.supabaseAnonKey ||
      (Constants.manifest as any)?.extra?.supabaseAnonKey ||
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
      process.env.SUPABASE_ANON_KEY;

    if (supabaseKey) {
      headers.apikey = supabaseKey;

      const { supabase } = await import('./supabaseClient');
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;

      if (accessToken) {
        headers.Authorization = `Bearer ${accessToken}`;
        if (__DEV__) {
          console.log('[AI] Using JWT Bearer token for proxy auth', {
            hasAccessToken: !!accessToken,
            tokenLength: accessToken.length,
            tokenPrefix: accessToken.substring(0, 20) || 'none',
            hasAnonKey: !!supabaseKey,
          });
        }
      } else {
        headers.Authorization = `Bearer ${supabaseKey}`;
        if (__DEV__) console.warn('[AI] No session access token found, falling back to anon key in Authorization header');
      }
    } else if (__DEV__) {
      console.warn('[AI] No Supabase anon key found for proxy authentication');
    }
  }

  if (requestId) headers['X-Request-Id'] = requestId;

  const manifestVersion = (Constants.manifest as any)?.version;
  const appVersion = Constants.expoConfig?.version ?? manifestVersion ?? 'unknown';
  headers['X-App-Version'] = appVersion;

  if (dreamId && supportsProxyTaskRouting(apiUrl)) headers['X-Dream-Id'] = dreamId;

  return headers;
};

const safeErrMsg = (msg: unknown): string => {
  if (typeof msg === 'string') return msg.length > 200 ? msg.slice(0, 200) + '…' : msg;
  if (msg == null) return '';
  const s = String(msg);
  return s.length > 200 ? s.slice(0, 200) + '…' : s;
};

function userSafeError(status: number, apiUrl: string): string {
  if (!__DEV__ && !isOpenAIHost(apiUrl)) return 'AI service is temporarily unavailable. Please try again later.';
  if (status >= 500) return 'AI service is temporarily unavailable. Please try again later.';
  return 'Something went wrong. Please try again.';
}

const getTokenParamName = (apiUrl: string, model: string): string => {
  const u = (apiUrl || '').trim().toLowerCase();
  const isReasoningFamily = /^gpt-5/i.test(model) || /^o\d/i.test(model);
  const defaultTokenParam = (() => {
    if (u.includes('/v1/responses')) return 'max_output_tokens';
    if (isReasoningFamily) return 'max_completion_tokens';
    if (u.includes('/v1/chat/completions')) return 'max_tokens';
    return 'max_completion_tokens';
  })();
  return getConfig('tokenParamName', defaultTokenParam) || defaultTokenParam;
};

const setTokenLimit = (
  payload: Record<string, unknown>,
  apiUrl: string,
  limit: number,
  model: string
): void => {
  const paramName = getTokenParamName(apiUrl, model);
  payload[paramName] = limit;
  if (paramName !== 'max_tokens' && !isOpenAIHost(apiUrl)) payload.max_tokens = limit;
};

const VALID_CORE_MODES = new Set(['Core Tension', 'Core State', 'Core Shift', 'Core Restoration']);

type ApiMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

type AiTask =
  | 'interpretation_quick'
  | 'interpretation_standard'
  | 'interpretation_advanced'
  | 'interpretation_retry_compact'
  | 'chat_followup'
  | 'dream_extraction'
  | 'conversation_element_update'
  | 'pattern_insights'
  | 'pattern_insights_retry_compact'
  | 'semantic_grouping';

const attachProxyTask = (payload: Record<string, unknown>, apiUrl: string, task: AiTask): void => {
  if (supportsProxyTaskRouting(apiUrl)) payload.task = task;
};

type AiCostRates = { inputUsdPerMTok: number; outputUsdPerMTok: number };

const USD_TO_EUR_ESTIMATE = 0.855;
const AI_COST_RATES_USD_PER_MTOK: Record<string, AiCostRates> = {
  'gpt-5.4': { inputUsdPerMTok: 2.5, outputUsdPerMTok: 15 },
  'gpt-5.4-mini': { inputUsdPerMTok: 0.75, outputUsdPerMTok: 4.5 },
  'claude-haiku-4-5': { inputUsdPerMTok: 1, outputUsdPerMTok: 5 },
};

const normalizeModelForPricing = (model: unknown): string | null => {
  if (typeof model !== 'string') return null;
  const m = model.toLowerCase();
  if (m.includes('gpt-5.4-mini')) return 'gpt-5.4-mini';
  if (m.includes('gpt-5.4')) return 'gpt-5.4';
  if (m.includes('claude') && m.includes('haiku') && m.includes('4')) return 'claude-haiku-4-5';
  return null;
};

const estimateCost = (
  model: unknown,
  promptTokens: number,
  completionTokens: number
): { usd: number; eur: number; rateKey: string | null } | null => {
  const rateKey = normalizeModelForPricing(model);
  if (!rateKey) return null;
  const rates = AI_COST_RATES_USD_PER_MTOK[rateKey];
  if (!rates) return null;
  const usd =
    (promptTokens / 1_000_000) * rates.inputUsdPerMTok +
    (completionTokens / 1_000_000) * rates.outputUsdPerMTok;
  return { usd, eur: usd * USD_TO_EUR_ESTIMATE, rateKey };
};

const estimateMessageInput = (messages: ApiMessage[]): { chars: number; roughTokens: number; turns: number } => {
  const chars = messages.reduce((sum, message) => sum + message.content.length + message.role.length + 4, 0);
  return { chars, roughTokens: Math.ceil(chars / 4), turns: messages.length };
};

const logAiRequestStart = (params: {
  requestId: string;
  task: AiTask;
  model: string;
  messages: ApiMessage[];
  tokenLimit?: number;
  apiUrl: string;
  depth?: InterpretationDepth;
  dreamId?: string;
}): void => {
  const estimate = estimateMessageInput(params.messages);
  logInfo('ai_request_start', {
    requestId: params.requestId,
    task: params.task,
    modelHint: params.model,
    providerRoute: supportsProxyTaskRouting(params.apiUrl) ? 'proxy' : isOpenAIHost(params.apiUrl) ? 'direct_openai' : 'custom',
    depth: params.depth,
    dreamId: params.dreamId,
    turns: estimate.turns,
    inputChars: estimate.chars,
    roughInputTokens: estimate.roughTokens,
    tokenLimit: params.tokenLimit,
  });
};

const aiResponseMeta = (response: Response, requestId: string) => ({
  requestId,
  provider: response.headers.get('x-ai-provider'),
  resolvedModel: response.headers.get('x-ai-model'),
  fallback: ['true', '1'].includes((response.headers.get('x-ai-fallback') ?? '').toLowerCase()),
  upstreamMs: response.headers.get('x-ai-upstream-ms'),
});

type StepUsage = { prompt?: number; completion?: number; total: number };

const dreamUsageBuckets = new Map<string, { byStep: Record<string, StepUsage> }>();

function resetDreamAiUsageBucket(dreamId: string): void {
  dreamUsageBuckets.set(dreamId, { byStep: {} });
}

function extractUsageFromCompletionResponse(data: unknown): StepUsage | null {
  if (!data || typeof data !== 'object') return null;
  const u = (data as { usage?: unknown }).usage;
  if (!u || typeof u !== 'object') return null;
  const usage = u as Record<string, unknown>;
  const prompt = typeof usage.prompt_tokens === 'number' ? usage.prompt_tokens : undefined;
  const completion = typeof usage.completion_tokens === 'number' ? usage.completion_tokens : undefined;
  const totalRaw = usage.total_tokens;
  let total = typeof totalRaw === 'number' && Number.isFinite(totalRaw) ? totalRaw : (prompt ?? 0) + (completion ?? 0);
  if (!Number.isFinite(total)) total = 0;
  if (total <= 0 && (prompt === undefined || prompt <= 0) && (completion === undefined || completion <= 0)) return null;
  if (total <= 0) total = (prompt ?? 0) + (completion ?? 0);
  if (total <= 0) return null;
  return { prompt, completion, total };
}

function mergeStepUsage(into: Record<string, StepUsage>, step: string, addition: StepUsage): void {
  const prev = into[step];
  if (!prev) {
    into[step] = { ...addition };
    return;
  }
  into[step] = {
    prompt: (prev.prompt ?? 0) + (addition.prompt ?? 0),
    completion: (prev.completion ?? 0) + (addition.completion ?? 0),
    total: prev.total + addition.total,
  };
}

const DREAM_USAGE_STEP_LABEL: Record<string, string> = {
  dream_extraction: 'symbol_extraction',
  interpretation_quick: 'reflection_quick',
  interpretation_standard: 'reflection_standard',
  interpretation_advanced: 'reflection_deep',
  interpretation_retry_compact: 'reflection_retry',
  conversation_element_update: 'post_chat_elements',
  chat_followup: 'interpretation_chat',
  semantic_grouping: 'semantic_grouping',
  pattern_insights: 'pattern_essay',
  pattern_insights_retry_compact: 'pattern_essay_retry',
};

function recordDreamAiUsage(
  dreamId: string | undefined,
  step: string,
  data: unknown,
  meta?: {
    requestId?: string;
    provider?: string | null;
    resolvedModel?: string | null;
    fallback?: boolean;
    upstreamMs?: string | null;
  }
): void {
  const usage = extractUsageFromCompletionResponse(data);
  if (!usage) return;

  const dataModel = data && typeof data === 'object' ? (data as { model?: unknown }).model : undefined;
  const model = meta?.resolvedModel ?? (typeof dataModel === 'string' ? dataModel : undefined);
  const promptTokens = usage.prompt ?? 0;
  const completionTokens = usage.completion ?? 0;
  const cost = estimateCost(model, promptTokens, completionTokens);
  const stepLabel = DREAM_USAGE_STEP_LABEL[step] ?? step;

  logInfo('ai_step_token_cost', {
    dreamId,
    requestId: meta?.requestId,
    step,
    stepLabel,
    provider: meta?.provider ?? undefined,
    model,
    pricingKey: cost?.rateKey,
    promptTokens,
    completionTokens,
    totalTokens: usage.total,
    estimatedUsd: cost ? Number(cost.usd.toFixed(6)) : undefined,
    estimatedEur: cost ? Number(cost.eur.toFixed(6)) : undefined,
    usdToEurEstimate: cost ? USD_TO_EUR_ESTIMATE : undefined,
    fallback: meta?.fallback,
    upstreamMs: meta?.upstreamMs ? Number(meta.upstreamMs) : undefined,
  });

  if (!dreamId) return;
  let bucket = dreamUsageBuckets.get(dreamId);
  if (!bucket) {
    bucket = { byStep: {} };
    dreamUsageBuckets.set(dreamId, bucket);
  }
  mergeStepUsage(bucket.byStep, step, usage);
  const cumulativeTotal = Object.values(bucket.byStep).reduce((s, x) => s + x.total, 0);
  const breakdown = Object.entries(bucket.byStep)
    .map(([k, v]) => `${DREAM_USAGE_STEP_LABEL[k] ?? k}:${v.total}`)
    .join(' + ');
  logInfo('ai_dream_token_usage', {
    dreamId,
    requestId: meta?.requestId,
    lastStep: step,
    lastStepTotalTokens: usage.total,
    cumulativeTotalTokens: cumulativeTotal,
    breakdown,
    byStepTotals: Object.fromEntries(
      Object.entries(bucket.byStep).map(([k, v]) => [DREAM_USAGE_STEP_LABEL[k] ?? k, v.total])
    ),
  });
}

const fetchWithTimeout = async (
  url: string,
  options: RequestInit,
  timeout: number,
  transientRetries: number = 1,
  rateLimitRetries: number = 2
): Promise<Response> => {
  let transientLeft = transientRetries;
  let rateLeft = rateLimitRetries;

  while (true) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, { ...options, signal: controller.signal });

      if (response.status === 429 && rateLeft > 0) {
        const retryAfter = response.headers.get('Retry-After');
        const delaySec = retryAfter ? Number(retryAfter) : NaN;
        const delay = Number.isFinite(delaySec) ? delaySec * 1000 : 2000;
        if (__DEV__) console.log(`[AI] Rate limited (429), retrying after ${delay}ms...`);
        rateLeft--;
        clearTimeout(timeoutId);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }

      if (response.status >= 500 && transientLeft > 0) {
        if (__DEV__) console.log(`[AI] Server error (${response.status}), retrying...`);
        transientLeft--;
        clearTimeout(timeoutId);
        const backoff = 600 + Math.floor(Math.random() * 400);
        await new Promise((resolve) => setTimeout(resolve, backoff));
        continue;
      }

      clearTimeout(timeoutId);
      return response;
    } catch (error: unknown) {
      clearTimeout(timeoutId);
      const err = error as { name?: string };

      if (err.name === 'AbortError') throw new Error(`Request timeout after ${timeout}ms`);

      if (transientLeft > 0) {
        if (__DEV__) console.log(`[AI] Retrying fetch (${transientLeft} retries left)...`);
        transientLeft--;
        const backoff = 300 + Math.floor(Math.random() * 200);
        await new Promise((resolve) => setTimeout(resolve, backoff));
        continue;
      }

      throw error;
    }
  }
};

const chatCompletionsExtractor = (data: any): string | null => data.choices?.[0]?.message?.content || null;
const responsesExtractor = (data: any): string | null => data.content || data.text || null;
const fallbackExtractor = (data: any): string | null => data.message?.content || data.text || null;

type ExtractApiResponseOptions = {
  allowTruncated?: boolean;
};

const extractApiResponseContent = (data: any, options?: ExtractApiResponseOptions): string => {
  const content = chatCompletionsExtractor(data) || responsesExtractor(data) || fallbackExtractor(data) || '';

  if (!content || content.trim().length === 0) {
    const finishReason = data.choices?.[0]?.finish_reason;
    const usage = data.usage;

    if ((finishReason === 'length' || finishReason === 'max_tokens') && options?.allowTruncated) return '';

    if (__DEV__) {
      console.error('[AI] Empty response received', {
        finishReason,
        completionTokens: usage?.completion_tokens,
        totalTokens: usage?.total_tokens,
        hasChoices: !!data.choices,
        choicesLength: data.choices?.length,
      });
    }

    logError('ai_empty_response', new Error('Empty response from API'), {
      hasChoices: !!data.choices,
      choicesLength: data.choices?.length,
      finishReason,
      completionTokens: usage?.completion_tokens,
      totalTokens: usage?.total_tokens,
    });

    if (finishReason === 'length' || finishReason === 'max_tokens') {
      throw new Error(__DEV__
        ? `AI response was truncated (finish_reason=${finishReason}). Increase token limit or reduce prompt size.`
        : 'Couldn\'t complete the response. Please try again.'
      );
    }

    throw new Error('Couldn\'t complete the response. Please try again.');
  }

  return content;
};

const END_MARKER_DREAM_READING = '<!--END_DREAM_READING-->';
const END_MARKER_DREAM_ESSAY = '<!--END_DREAM_ESSAY-->';

const isTruncatedResponse = (data: any): boolean => {
  const finishReason = data.choices?.[0]?.finish_reason;
  return finishReason === 'length' || finishReason === 'max_tokens';
};

const hasEndMarker = (text: string, marker: string): boolean => text.includes(marker);
const stripEndMarker = (text: string, marker: string): string => text.split(marker).join('').trim();

const ensureCompleteMarkedResponse = (
  data: any,
  content: string,
  marker: string,
  apiUrl: string,
  requestId: string,
  step: string
): string => {
  if (!content.trim() || isTruncatedResponse(data) || !hasEndMarker(content, marker)) {
    logError('ai_retry_incomplete_response', new Error('Retry response missing completion marker or truncated'), {
      requestId,
      step,
      finishReason: data?.choices?.[0]?.finish_reason,
      contentLength: content.length,
      hasMarker: hasEndMarker(content, marker),
    });
    throw new Error(userSafeError(500, apiUrl));
  }
  return content;
};

const QUICK_RETRY_PROMPT = `Your previous response was cut off.
Rewrite from scratch in 80–160 words.
Do not continue the previous response.
No headings.
Use 1–2 short paragraphs.
Begin from a concrete image, action, place, figure, or bodily tone in the dream.
Keep only one living psychological movement.
Do not summarize the whole dream or list symbols.
Do not use report-like language or framework labels.
Do not widen into mythic, archetypal, ritual, cosmic, sacred, or transpersonal framing.
End with exactly one observational reflective question.
The response must end naturally and not be cut off.

Technical requirement:
After the complete response, append this exact hidden marker on its own line:
${END_MARKER_DREAM_READING}`;

const STANDARD_RETRY_PROMPT = `Your previous response was cut off.
Rewrite from scratch in 180–320 words.
Do not continue the previous response.

Use the Standard mode, but with hidden structure:
- Only use the Core heading, Dream Movement, and Reflective Questions.
- Do not use separate headings for Emotional Atmosphere, Key Symbols, Possible Psychological Meaning, or Symbolic Movement.
- Write the main interpretation as one compact reading path through the dream sequence.
- Keep only the strongest 2–3 images and one central psychological movement.
- Stay close to concrete dream details.
- Avoid report-like language, therapeutic polish, archetype labels, and framework labels.
- Mythic or archetypal widening is normally out of scope.
- If one image carries unmistakable ritual, initiatory, underworld, sacred, or transpersonal weight, allow at most one brief image-born resonance sentence.
- Do not force mythology onto domestic, ordinary, comic, bureaucratic, or psychologically local dreams.

End with exactly 2 reflective questions.
The response must end naturally and not be cut off.

Technical requirement:
After the complete response, append this exact hidden marker on its own line:
${END_MARKER_DREAM_READING}`;

const ADVANCED_RETRY_PROMPT = `Your previous response was cut off.
Rewrite from scratch in 380–520 words.
Do not continue the previous response.

Use the Advanced mode, but with hidden structure:
- Only use the Core heading, Dream Movement, and Reflective Questions.
- Do not use separate headings for Charged Image, What the Dream Organizes, Symbolic Movement, or What Remains Unresolved.
- Write the main interpretation as a continuous descent through the dream sequence.
- Let one charged image become the gravitational center without naming it as a section.
Stay close to the dream sequence.
Do not make the dream cleaner or more coherent than it is.
Keep the strongest image partly alive before interpreting it.
Preserve ambiguity without dissolving intensity.
Avoid report-like language, therapeutic polish, archetype labels, and elegant over-synthesis.
Allow brief mythic resonance only when it is unmistakably earned by the dream image itself.
Prefer one precise mythic echo over extended amplification.
Do not create a Mythic Resonance section or lecture on mythology.

End with exactly 2 reflective questions.
The response must end naturally and not be cut off.

Technical requirement:
After the complete response, append this exact hidden marker on its own line:
${END_MARKER_DREAM_READING}`;

const COMPRESSION_RETRY_ESSAY_SYSTEM_PROMPT = `Your previous essay was too long and was cut off.
Rewrite the entire essay from scratch in a compact complete form.
Do not continue the previous response.
Compress each section; keep synthesis; drop repetition.
Stay near the lower end of the word range appropriate for the number of dreams in the prompt.

Technical requirement:
After the complete response, append this exact hidden marker on its own line:
${END_MARKER_DREAM_ESSAY}`;

const extractFirstJsonObject = (s: string): string | null => {
  const start = s.indexOf('{');
  if (start === -1) return null;
  let depth = 0;
  for (let i = start; i < s.length; i++) {
    if (s[i] === '{') depth++;
    if (s[i] === '}') depth--;
    if (depth === 0) return s.slice(start, i + 1);
  }
  return null;
};

const generateRequestId = (): string => `req_${Date.now()}_${Math.random().toString(16).slice(2)}`;

const startRequest = (): { requestId: string; model: string } => ({
  requestId: generateRequestId(),
  model: getModel(),
});

const parseApiResponse = async (
  response: Response,
  requestId?: string,
  apiUrl?: string
): Promise<any> => {
  if (__DEV__ && apiUrl && supportsProxyTaskRouting(apiUrl)) {
    const fb = response.headers.get('x-ai-fallback');
    const fbReason = response.headers.get('x-ai-fallback-reason');
    console.log('[AI] Proxy routing:', {
      requestId,
      provider: response.headers.get('x-ai-provider'),
      model: response.headers.get('x-ai-model'),
      fallback: fb === 'true',
      fallbackReason: fbReason && fbReason.length > 0 ? fbReason : undefined,
    });
  }

  const raw = await response.text();
  try {
    return JSON.parse(raw);
  } catch (jsonError) {
    if (__DEV__) console.error('[AI] Non-JSON response:', raw.substring(0, 200));
    const contentType = response.headers.get('content-type');
    logError('ai_response_parse_error', jsonError, {
      requestId,
      status: response.status,
      contentType,
      responseLength: raw.length,
    });
    throw new Error(userSafeError(response.status, apiUrl || ''));
  }
};

/* ============================
   PROMPT CONSTITUTION
   ============================ */

const DREAM_CONSTITUTION_PROMPT = `
You are Dream Weaver, a post-Jungian dream journal companion.

Core Constitution — non-negotiable principles:

- Interpret dreams symbolically, never literally.
- Never give advice, diagnosis, prescriptions, moral judgments, or therapeutic instructions of any kind.
- Embodiment must remain purely observational. Never instruct the user to breathe, relax, sit with, focus on, try, or practice anything.
- Use hypothetical language, but do not hide behind vagueness. Never present interpretations as facts, yet allow clear symbolic landings when strongly grounded in dream details.
- Use English for markdown section headings exactly as specified.
- Use the user's dominant language for all paragraph text, bullets, and reflective questions.
- Always start from affect, image, and the ego’s relationship to what appears.
- Every interpretive claim must be tied to at least one concrete detail from the dream.
- Treat dream figures as autonomous inner presences or complexes.
- Shadow is always unintegrated intensity, charge, or unmetabolized vitality — never "negative" or moral failure.
- Self is used only when a clear organizing center appears and the dream moves toward coherence. If the center brings agitation and loss of coherence, describe it as contested or unstable.

Symbolic stance:
- When a concrete image carries clear emotional, bodily, familial, cultural, or symbolic charge, allow the interpretation to land with precision instead of retreating into excessive neutrality.
- Do not emotionally flatten the strongest image. Restraint should keep the image alive, not make it vague.
- Do not reduce unusual dream details into generic symbolic categories. Stay with what makes the image specifically this image and not another one.
- Preserve ambiguity without dissolving intensity. A strong image may remain unresolved while still carrying a clear psychological pressure.
- Some dream images carry disproportionate psychic weight. Prioritize the images that alter atmosphere, embodiment, identity, belonging, orientation, or emotional reality inside the dream.

Core Mode Logic (choose exactly one):

- Core Tension: opposition, rupture, alarm, or vitality restricted while functioning continues.
- Core State: coherence, flow, belonging, ease, or consolidation without marked disturbance.
- Core Shift: threshold, irreversible change, leaving-behind, emergence, or transformation of form/identity/ground.
- Core Restoration: the dream gives what waking life lacks, and tension is mild or absent.

If two modes feel close, choose the mode that best describes the dream's final movement and dominant affect.
Prefer Core Tension when warmth, play, or coherence becomes organized around blockage, exposure, evaluation, shame, threat, illegitimacy, or unresolved pressure.
Prefer Core State or Core Restoration only when ease, coherence, or replenishment remains dominant through the end.
Do not force tension when the dream remains cohesive, restorative, playful, absurd, or numinous without a central rupture.

Do not over-diagnose tension. Threat, shame, pursuit, exile, or bodily alarm usually indicate Core Tension, but only when they organize the dream's whole movement. If these appear briefly inside a wider field of play, coherence, absurdity, or restoration, choose the mode that best describes the dream as a whole.

Style:
- Be precise, psychologically grounded, and image-near.
- Prefer plain, vivid, concrete language over jargon or elevated wording.
- Start from the image or action itself rather than generic openers.
- Archetype labels are optional. Use them only when they genuinely deepen the specific image. A strong reading without labels is often better.
`;

const INTERPRETATION_ROLE_PROMPT = `
Role:
You offer a symbolic psychological reading that illuminates how the psyche organizes meaning through images — whether through tension, flow, transition, or restoration.

Prioritize:
- Emotional atmosphere and bodily affect
- Inner tensions, ambivalences, or flows the dream actually stages
- How the ego relates to what appears (what it approaches, avoids, or cannot yet metabolize)
- What each image does to the dreamer’s attention, body, or stance
- The psychic gravity of images that change atmosphere, embodiment, identity, belonging, orientation, or emotional reality
- The larger symbolic forms or imaginal structures shaping the dream when clearly present
- Archetypal dynamics only when they unmistakably deepen the specific image

Never give conclusions, advice, or reassurance. Help the dreamer think symbolically.
`;

const DREAM_FIRST_READING_DIRECTIVE = `
Let the dream narrative lead: image, affect, ego-position, figures, spaces, and movement.

Return to the dream sequence and charged images first.
Do not organize the reading around categories, tags, or frameworks.
Do not mention indexing fields.

The interpretation should feel like it arises from the dream scene itself.
`;

const INTERPRETATION_OUTPUT_LANGUAGE_DIRECTIVE =
  'OUTPUT LANGUAGE (mandatory): Keep all markdown section headings exactly as specified in English for UI consistency. ' +
  'Write all paragraph text, bullets, and reflective questions in the same primary language as the dream narrative and any user notes in this request. ' +
  'Technical labels in this prompt may be in English for UI consistency only; do not let them affect the body language. ' +
  'If the dream mixes languages, use the language used most for the narrative and keep short phrases from other languages as written.';

const BRIEF_INTERPRETATION_FORMAT_PROMPT = `
BRIEF mode (Quick Glance):
- Total 80–180 words.
- No headings.
- Write one continuous image-near reflection, not a mini report.
- Use 1–2 short paragraphs that do four things only:
  1. begin from one concrete dream image, action, place, figure, or bodily tone
  2. render the atmosphere briefly
  3. follow one central psychological movement
  4. include one felt-sense sentence only if bodily tone is clearly present
- End with exactly one observational reflective question.
- Do not use archetype labels, amplifications, or extra framework language.
- Do not summarize the whole dream before entering it.
- Do not list symbols.
- Do not widen into mythic, archetypal, ritual, cosmic, sacred, or transpersonal framing.

Hard output limit:
- Each paragraph must be 2–4 sentences maximum.
- Prefer ending early over covering every detail.
- The response must end naturally after the reflective question.

Technical requirement:
After the complete response, append this exact hidden marker on its own line:
${END_MARKER_DREAM_READING}
`;

const STANDARD_INTERPRETATION_FORMAT_PROMPT = `
STANDARD mode (Core Reading):
- Prioritize symbolic immediacy and the best reading experience, not exhaustive coverage.
- Use hidden structure: organize the reading internally, but keep the visible structure light.
- The reading should feel like one compact path through the dream, not a report.
- Let the dream sequence carry the form.
- Follow the order of the dream unless one image clearly pulls the whole dream around it.
- Do not distribute commentary equally across all details.
- Avoid report-like language, therapeutic polish, and framework labels.

Mythic resonance:
- Mythic or archetypal widening is normally out of scope in Standard mode.
- If one image carries unmistakable ritual, initiatory, underworld, sacred, or transpersonal weight, allow at most one brief image-born resonance sentence.
- Do not force mythology onto domestic, ordinary, comic, bureaucratic, or psychologically local dreams.
- Prefer resonance over explanation.

Opening section:
The first heading MUST be exactly one of:
## Core Tension
## Core State
## Core Shift
## Core Restoration

- Under the chosen Core heading, write 1–2 image-near sentences.
- This should orient the dominant affect and final movement without sounding like a diagnosis.
- Do not use archetype labels here.

## Dream Movement

Write this as one compact interpretive reading, 2–4 short paragraphs.

Internal movement to follow, without naming these as subheadings:
1. Begin inside a concrete dream image, action, place, figure, or bodily tone.
2. Let the strongest 1–3 images emerge naturally from the sequence.
3. Show what they do to the dreamer's position, attention, body, agency, or belonging.
4. Track the central movement without trying to cover every detail.
5. Let unresolvedness appear only if the dream itself leaves something suspended.

Rules for this section:
- Do not split the reading into multiple analytical sections.
- Do not use bullets for symbols.
- Do not use headings for Emotional Atmosphere, Key Symbols, Possible Psychological Meaning, Symbolic Movement, or Integration.
- Every interpretive claim must be grounded in concrete dream detail.
- Prefer one clear thread over complete coverage.
- Preserve ambiguity without becoming vague.

## Reflective Questions

- Exactly 2 questions.
- First question: somatic-observational when possible.
- Second question: symbolic, relational, or imaginal.
- Questions should deepen the central movement, not open a new analytic thread.
- Questions invite noticing, not self-improvement.
- No advice verbs: try, practice, breathe, focus, work on, improve.

Anti-framework language rule:
- Prefer immediate, image-near, psychologically alive wording over analytic or institutional phrasing.
- If a sentence can be made more vivid and direct without losing accuracy, always prefer the vivid version.

Length: aim for 180–320 words.

Technical requirement:
After the complete response, append this exact hidden marker on its own line:
${END_MARKER_DREAM_READING}
`;

const ADVANCED_INTERPRETATION_FORMAT_PROMPT = `
ADVANCED mode (Deeper Dive):
- Depth means staying inside the dream's movement, not explaining more.
- The reading should feel like a continuous descent through the dream, not a report.
- Use hidden structure: organize the interpretation internally, but do not expose many analytical headings.
- Let the dream sequence carry the form.
- Follow the order of the dream unless one charged image clearly pulls the whole dream around it.
- Do not make the dream cleaner, wiser, or more coherent than it is.
- Do not explain the strongest image too quickly.
- Stay with strange, bodily, awkward, comic, ugly, tender, domestic, or uncanny details.
- Prefer atmosphere, continuity, and image-near unfolding over category-by-category analysis.
- Avoid report-like language, therapeutic polish, elegant over-synthesis, and framework labels.
- Do not use phrases like "the dream organizes", "symbolic movement", or "charged image" in the body unless absolutely necessary.

Mythic resonance:
- When a dream image carries unmistakable mythic, archetypal, ritual, initiatory, underworld, cosmic, sacred, or transpersonal weight, allow the interpretation to briefly widen beyond the personal psyche.
- Mythic resonance must emerge organically from the image itself, not from symbolic inflation.
- Do not force mythology onto domestic, ordinary, comic, bureaucratic, or psychologically local dreams.
- A single precise mythic echo is stronger than extended amplification.
- Prefer resonance over explanation.
- Do not create a Mythic Resonance section.
- Do not lecture on mythology or explain archetypal systems.

Opening section:
The first heading MUST be exactly one of:
## Core Tension
## Core State
## Core Shift
## Core Restoration

- Under the chosen Core heading, write 1–2 image-near sentences.
- This should orient the dominant affect and final movement without sounding like a diagnosis.
- Do not use archetype labels here.

## Dream Movement

Write this as one continuous interpretive essay, 4–7 short paragraphs.

Internal movement to follow, without naming these as subheadings:
1. Begin inside the first scene: place, atmosphere, ego-position, and affect.
2. Let the most charged image emerge naturally from the dream sequence.
3. Stay with that image before interpreting it.
4. Show how figures, spaces, objects, and actions gather around it.
5. Track shifts in agency, belonging, distance, intimacy, passivity, activity, or permission.
6. Let unresolvedness appear only if the dream itself leaves something suspended.

Rules for this section:
- Do not split the reading into multiple analytical sections.
- Do not distribute equal commentary across all symbols.
- Let one image become the gravitational center.
- Use transitions that feel organic, not institutional.
- Trust the image. Do not translate everything into psychology immediately.
- Every interpretive claim must be grounded in concrete dream detail.
- Preserve ambiguity without becoming vague.

## Reflective Questions

- Exactly 2 questions.
- First: somatic-observational when possible.
- Second: symbolic, relational, or imaginal.
- Questions invite noticing, not self-improvement.
- No advice verbs: try, practice, breathe, focus, work on, improve.

Length: 420–620 words.

Technical requirement:
After the complete response, append this exact hidden marker on its own line:
${END_MARKER_DREAM_READING}
`;

export type InterpretationDepth = 'quick' | 'standard' | 'advanced';

export type GenerateInitialInterpretationOptions = {
  brief?: boolean;
  depth?: InterpretationDepth;
};

type InitialInterpretationRequest = {
  depth: InterpretationDepth;
  messages: ApiMessage[];
  temperature: number;
  interpretationStep: AiTask;
};

const buildInitialInterpretationRequest = (
  dream: Dream,
  options?: GenerateInitialInterpretationOptions
): InitialInterpretationRequest => {
  interface ExtendedDream extends Dream {
    emotionOnWaking?: string;
    bodySensation?: string;
    currentLifeTheme?: string;
  }

  const extended = dream as ExtendedDream;
  const personalizationPairs: Array<[string, string]> = [
    ['Emotion on waking', extended.emotionOnWaking || ''],
    ['Body sensation', extended.bodySensation || ''],
    ['Current life theme', extended.currentLifeTheme || ''],
  ];
  const personalizationSection = personalizationPairs
    .filter(([, v]) => Boolean(v))
    .map(([k, v]) => `${k}: ${v}`)
    .join('\n');

  const depth = options?.depth ?? (options?.brief ? 'quick' : 'standard');
  const outputLangSuffix = `\n\n${INTERPRETATION_OUTPUT_LANGUAGE_DIRECTIVE}`;

  const userPrompt = depth === 'quick'
    ? `Here is a dream I want a brief symbolic reflection on.

Title: ${dream.title || 'Untitled'}
Date: ${dream.date}
${personalizationSection ? `\n${personalizationSection}\n` : ''}
Dream:
${dream.content}

${DREAM_FIRST_READING_DIRECTIVE}
Give 1–2 short paragraphs and one reflective question. No conclusions, no advice.${outputLangSuffix}`
    : `Here is a dream I want to explore symbolically.

Title: ${dream.title || 'Untitled'}
Date: ${dream.date}
${personalizationSection ? `\n${personalizationSection}\n` : ''}
Dream:
${dream.content}

${DREAM_FIRST_READING_DIRECTIVE}
Please approach this as a symbolic psychological image, not a literal event.
Focus on:
- Emotional atmosphere and bodily affect
- Inner tensions, ambivalences, or flows — whatever the dream actually stages
- How the ego relates to what appears (including what it avoids, moves toward, or cannot metabolize)
- What each image does to the dreamer's attention, body, or stance
- The one or two images that carry the strongest charge
- What remains strange, unresolved, or not fully readable

Do not give conclusions. Offer symbolic perspectives and reflective questions.${outputLangSuffix}`;

  let formatPrompt: string;
  if (depth === 'quick') {
    formatPrompt = BRIEF_INTERPRETATION_FORMAT_PROMPT;
  } else if (depth === 'advanced') {
    formatPrompt = ADVANCED_INTERPRETATION_FORMAT_PROMPT;
  } else {
    formatPrompt = STANDARD_INTERPRETATION_FORMAT_PROMPT;
  }

  const interpretationStep: AiTask =
    depth === 'quick'
      ? 'interpretation_quick'
      : depth === 'advanced'
        ? 'interpretation_advanced'
        : 'interpretation_standard';

  return {
    depth,
    messages: [
      { role: 'system', content: DREAM_CONSTITUTION_PROMPT },
      { role: 'system', content: INTERPRETATION_ROLE_PROMPT },
      { role: 'system', content: formatPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: depth === 'quick' ? 0.68 : depth === 'advanced' ? 0.60 : 0.55,
    interpretationStep,
  };
};

const retryCompressedInitialInterpretation = async (params: {
  apiUrl: string;
  apiKey: string;
  model: string;
  originalMessages: ApiMessage[];
  requestId: string;
  tokenLimit: number;
  timeout: number;
  dreamId: string;
  depth: InterpretationDepth;
}): Promise<string> => {
  const { apiUrl, apiKey, model, originalMessages, requestId, tokenLimit, timeout, dreamId, depth } = params;
  const retryPrompt =
    depth === 'quick'
      ? QUICK_RETRY_PROMPT
      : depth === 'advanced'
        ? ADVANCED_RETRY_PROMPT
        : STANDARD_RETRY_PROMPT;

  const retryPayload: any = {
    model,
    messages: [...originalMessages, { role: 'system', content: retryPrompt }],
    temperature: 0.35,
  };
  attachProxyTask(retryPayload, apiUrl, 'interpretation_retry_compact');
  setTokenLimit(retryPayload, apiUrl, tokenLimit, model);
  logAiRequestStart({
    requestId: `${requestId}_retry_compact`,
    task: 'interpretation_retry_compact',
    model,
    messages: retryPayload.messages,
    tokenLimit,
    apiUrl,
    depth,
    dreamId,
  });

  const retryHeaders = await buildHeaders(apiUrl, apiKey, `${requestId}_retry_compact`, dreamId);
  const retryResponse = await fetchWithTimeout(
    apiUrl,
    { method: 'POST', headers: retryHeaders, body: JSON.stringify(retryPayload) },
    timeout,
    1,
    1
  );
  const retryData = await parseApiResponse(retryResponse, `${requestId}_retry_compact`, apiUrl);

  if (!retryResponse.ok) throw new Error(userSafeError(retryResponse.status, apiUrl));

  recordDreamAiUsage(
    dreamId,
    'interpretation_retry_compact',
    retryData,
    aiResponseMeta(retryResponse, `${requestId}_retry_compact`)
  );

  const content = extractApiResponseContent(retryData, { allowTruncated: true });
  return ensureCompleteMarkedResponse(
    retryData,
    content,
    END_MARKER_DREAM_READING,
    apiUrl,
    `${requestId}_retry_compact`,
    'interpretation_retry_compact'
  );
};

const retryCompressedPatternEssay = async (params: {
  apiUrl: string;
  apiKey: string;
  model: string;
  originalMessages: ApiMessage[];
  requestId: string;
  tokenLimit: number;
  timeout: number;
}): Promise<string> => {
  const { apiUrl, apiKey, model, originalMessages, requestId, tokenLimit, timeout } = params;
  const retryPayload: any = {
    model,
    messages: [...originalMessages, { role: 'system', content: COMPRESSION_RETRY_ESSAY_SYSTEM_PROMPT }],
    temperature: 0.35,
  };
  attachProxyTask(retryPayload, apiUrl, 'pattern_insights_retry_compact');
  setTokenLimit(retryPayload, apiUrl, tokenLimit, model);
  logAiRequestStart({
    requestId: `${requestId}_retry_essay_compact`,
    task: 'pattern_insights_retry_compact',
    model,
    messages: retryPayload.messages,
    tokenLimit,
    apiUrl,
  });

  const retryHeaders = await buildHeaders(apiUrl, apiKey, `${requestId}_retry_essay_compact`);
  const retryResponse = await fetchWithTimeout(
    apiUrl,
    { method: 'POST', headers: retryHeaders, body: JSON.stringify(retryPayload) },
    timeout,
    1,
    1
  );
  const retryData = await parseApiResponse(retryResponse, `${requestId}_retry_essay_compact`, apiUrl);

  if (!retryResponse.ok) throw new Error(userSafeError(retryResponse.status, apiUrl));

  recordDreamAiUsage(
    undefined,
    'pattern_insights_retry_compact',
    retryData,
    aiResponseMeta(retryResponse, `${requestId}_retry_essay_compact`)
  );

  const content = extractApiResponseContent(retryData, { allowTruncated: true });
  return ensureCompleteMarkedResponse(
    retryData,
    content,
    END_MARKER_DREAM_ESSAY,
    apiUrl,
    `${requestId}_retry_essay_compact`,
    'pattern_insights_retry_compact'
  );
};

export const generateInitialInterpretation = async (
  dream: Dream,
  options?: GenerateInitialInterpretationOptions
): Promise<string> => {
  resetDreamAiUsageBucket(dream.id);
  const { depth, messages, temperature, interpretationStep } = buildInitialInterpretationRequest(dream, options);
  const { requestId, model } = startRequest();

  try {
    const apiUrl = getApiUrl();
    const apiKey = getApiKey();
    const capabilities = getModelCapabilities(model);

    if (!__DEV__ && isOpenAIHost(apiUrl)) {
      throw new Error('Direct OpenAI calls are disabled in production builds. Configure a proxy endpoint.');
    }
    if (requiresClientKey(apiUrl)) {
      if (!apiKey || apiKey === 'your-openai-api-key') {
        logError('ai_missing_api_key', new Error('OpenAI API key not configured'));
        throw new Error('OpenAI API key missing or placeholder. Check your config.');
      }
    }

    const payload: any = {
      model,
      messages,
      temperature,
    };

    attachProxyTask(payload, apiUrl, interpretationStep);

    let tokenLimit: number | undefined;
    if (capabilities.supportsMaxCompletionTokens) {
      const isGpt5 = /^gpt-5/i.test(model);
      tokenLimit =
        depth === 'quick' ? 550
        : depth === 'advanced' ? (isGpt5 ? 2200 : 1800)
        : (isGpt5 ? 1600 : 1200);
      setTokenLimit(payload, apiUrl, tokenLimit, model);
    }

    logAiRequestStart({ requestId, task: interpretationStep, model, messages, tokenLimit, apiUrl, depth, dreamId: dream.id });

    const headers = await buildHeaders(apiUrl, apiKey, requestId, dream.id);
    const response = await fetchWithTimeout(
      apiUrl,
      { method: 'POST', headers, body: JSON.stringify(payload) },
      capabilities.defaultTimeout,
      1,
      2
    );

    const data = await parseApiResponse(response, requestId, apiUrl);

    if (!response.ok) {
      const rawError = safeErrMsg(data.error?.message) || `API Error: ${response.status}`;
      logError('ai_generate_initial_api_error', new Error(rawError), {
        requestId,
        model,
        status: response.status,
        hasError: !!data.error,
      });
      throw new Error(userSafeError(response.status, apiUrl));
    }

    recordDreamAiUsage(dream.id, interpretationStep, data, aiResponseMeta(response, requestId));

    let content = extractApiResponseContent(data, { allowTruncated: true });

    if (__DEV__) {
      console.log('[AI] Response structure:', {
        hasChoices: !!data.choices,
        choicesLength: data.choices?.length,
        hasMessage: !!data.choices?.[0]?.message,
        hasContent: !!data.choices?.[0]?.message?.content,
        contentLength: content.length,
        finishReason: data.choices?.[0]?.finish_reason,
      });
    }

    if (isTruncatedResponse(data) || !content.trim()) {
      const retryTokenLimit = depth === 'quick' ? 550 : depth === 'advanced' ? 1800 : 1200;
      content = await retryCompressedInitialInterpretation({
        apiUrl,
        apiKey,
        model,
        originalMessages: messages,
        requestId,
        tokenLimit: retryTokenLimit,
        timeout: capabilities.defaultTimeout,
        dreamId: dream.id,
        depth,
      });
    }

    if (!hasEndMarker(content, END_MARKER_DREAM_READING)) {
      logError('ai_missing_end_marker', new Error('Dream reading missing end marker'), {
        requestId,
        dreamId: dream.id,
        depth,
        contentLength: content.length,
      });
    }

    return stripEndMarker(content, END_MARKER_DREAM_READING);
  } catch (error) {
    logError('ai_generate_initial_error', error, { requestId, model });
    throw error;
  }
};

const CHAT_MODE_INSTRUCTIONS = `
Chat mode:
- Use the same language as the dream and the user's latest messages. Do not switch language just because the interface or a prior assistant turn used a different one.
- Build on the existing reading instead of redoing a full analysis.
- Be concise, but do not become casual, flattened, or generic.
- Prefer one precise development over a quick summary of many points.
- Target 90–220 words. Rarely up to 260 if the user's question genuinely requires it. At most 2–3 short paragraphs or 1–2 sections; no mini-essays.
- End with exactly ONE reflective question (observational, somatic or symbolic). Never two questions in chat.
- Summarize connections to the dream or user context (e.g. therapy, relationships) without redoing a full analysis. No repetition of what was already said in the initial interpretation.
- Focus on one or two key insights; avoid listing many points. Fewer, sharper observations.
`;

const trimConversationHistory = (history: ChatMessage[], maxMessages: number = 12): ChatMessage[] => {
  if (history.length <= maxMessages) return history;
  return history.slice(-maxMessages);
};

export const sendChatMessage = async (
  dream: Dream,
  conversationHistory: ChatMessage[],
  newMessage: string
): Promise<string> => {
  const dreamExcerpt = dream.content.length > 1200 ? dream.content.slice(0, 1200) + '…' : dream.content;

  const dreamContext = `Dream being discussed:
Title: ${dream.title || 'Untitled'}
Date: ${dream.date}
Content: ${dreamExcerpt}`;

  const trimmedHistory = trimConversationHistory(conversationHistory);
  const assistantCount = trimmedHistory.filter((m) => m.role === 'assistant').length;
  const isFinalResponse = assistantCount === MAX_AI_RESPONSES - 1;

  const finalResponseInstruction = isFinalResponse
    ? `Important: No more follow-ups. This is your final response. Conclude the reflection without inviting further questions. Do not end with a question or prompts like "Do you have any questions?" or "What would you like to explore?". Wrap up with a closing insight or affirmation instead.`
    : null;

  const messages: ApiMessage[] = [
    { role: 'system', content: DREAM_CONSTITUTION_PROMPT },
    { role: 'system', content: CHAT_MODE_INSTRUCTIONS },
    ...(finalResponseInstruction ? [{ role: 'system' as const, content: finalResponseInstruction }] : []),
    { role: 'system', content: dreamContext },
    { role: 'system', content: INTERPRETATION_OUTPUT_LANGUAGE_DIRECTIVE },
    ...trimmedHistory.map((msg) => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    })),
    { role: 'user', content: newMessage },
  ];

  const { requestId, model } = startRequest();

  try {
    const apiUrl = getApiUrl();
    const apiKey = getApiKey();
    const capabilities = getModelCapabilities(model);

    if (!__DEV__ && isOpenAIHost(apiUrl)) {
      throw new Error('Direct OpenAI calls are disabled in production builds. Configure a proxy endpoint.');
    }
    if (requiresClientKey(apiUrl)) {
      if (!apiKey || apiKey === 'your-openai-api-key') {
        logError('ai_missing_api_key', new Error('OpenAI API key not configured'));
        throw new Error('OpenAI API key missing or placeholder. Check your config.');
      }
    }

    const payload: any = { model, messages, temperature: 0.45 };
    attachProxyTask(payload, apiUrl, 'chat_followup');

    let tokenLimit: number | undefined;
    if (capabilities.supportsMaxCompletionTokens) {
      tokenLimit = 550;
      setTokenLimit(payload, apiUrl, tokenLimit, model);
    }

    logAiRequestStart({ requestId, task: 'chat_followup', model, messages, tokenLimit, apiUrl, dreamId: dream.id });

    const headers = await buildHeaders(apiUrl, apiKey, requestId, dream.id);
    const response = await fetchWithTimeout(
      apiUrl,
      { method: 'POST', headers, body: JSON.stringify(payload) },
      capabilities.defaultTimeout,
      1,
      2
    );

    const data = await parseApiResponse(response, requestId, apiUrl);

    if (!response.ok) {
      const rawError = safeErrMsg(data.error?.message) || `API Error: ${response.status}`;
      logError('ai_send_chat_api_error', new Error(rawError), {
        requestId,
        model,
        status: response.status,
        hasError: !!data.error,
      });
      throw new Error(userSafeError(response.status, apiUrl));
    }

    recordDreamAiUsage(dream.id, 'chat_followup', data, aiResponseMeta(response, requestId));

    return extractApiResponseContent(data);
  } catch (error) {
    logError('ai_send_chat_error', error, { requestId, model });
    throw error;
  }
};

const SELF_SUPPRESSION_PHRASES = [
  'false center',
  "doesn't stabilize",
  "doesn't feel trustworthy",
  'fails to organize',
  'fails to soothe',
  'destabiliz',
  'ground gives way',
  'retreat',
  'stepping back',
  'bodily imbalance',
  'balance disturbance',
  'agitation',
  'lack of grounding',
  'σωματικής αποδιοργάνωσης',
  'έλλειψης γείωσης',
];

const MAX_SYMBOLS_TOTAL = 12;

export function filterArchetypesForDisplay(archetypes: string[], analysisText: string): string[] {
  const textLower = analysisText.toLowerCase();
  const suppressSelf = SELF_SUPPRESSION_PHRASES.some((phrase) => textLower.includes(phrase.toLowerCase()));

  return archetypes.filter((a) => {
    if (a.toLowerCase() === 'self' && suppressSelf) return false;
    return true;
  });
}

const extractSection = (text: string, title: string): string | null => {
  const re = new RegExp(
    `##?\\s*${title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\n([\\s\\S]*?)(?=\\n##?\\s*|$)`,
    'i'
  );
  const m = text.match(re);
  return m ? m[1].trim() : null;
};

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const stripMarkdownHeadingText = (line: string): string =>
  line.trim().replace(/^#{1,6}\s+/, '').replace(/\*+/g, '').trim();

const headingStemKey = (raw: string): string => stripMarkdownHeadingText(raw).replace(/\s+/g, ' ').trim().toLowerCase();
const normalizedHeadingStem = (raw: string): string => headingStemKey(raw).replace(/^the\s+/, '');

const STRUCTURAL_INTERPRETATION_HEADING_KEYS = new Set([
  'key symbols',
  'reflective questions',
  'questions',
  'possible psychological meaning',
  'emotional atmosphere',
  'deeper dynamics',
  'the charged image',
  'charged image',
  'what the dream organizes',
  'symbolic movement',
  'dream movement',
  'what remains unresolved',
  'symbolic forms',
  'symbolic development',
  'relational field',
  'decision-edge',
  'decision edge',
  'amplification',
  'mythic resonance',
  'archetypal layer',
  'archetypal dynamics',
  'core state / core tension / core shift / core restoration',
  'core tension / core state / core shift / core restoration',
  'core tension / core state / core shift / core restoration (1–2 sentences, always first)',
]);

const GENERIC_SOLO_HEADING_STEMS = new Set([
  'threshold',
  'thresholds',
  'hidden self',
  'journey',
  'integration',
  'transformation',
  'growth',
  'healing',
  'unknown',
  'unconscious',
  'psyche',
  'soul',
  'transcendence',
  'awakening',
  'the void',
  'the deep',
  'depth',
  'depths',
  'north gate',
  'south gate',
]);

const isStructuralInterpretationHeading = (raw: string): boolean => {
  const key = headingStemKey(raw);
  if (STRUCTURAL_INTERPRETATION_HEADING_KEYS.has(key)) return true;
  if (/^core (tension|state|shift|restoration)\b/i.test(key)) return true;
  return false;
};

const extractInterpretationMarkdownHeadings = (text: string): string[] => {
  const lines = [...text.matchAll(/^#{2,6}\s+(.+)$/gm)];
  return lines.map((m) => m[1].trim());
};

const deriveSymbolTitlesFromDreamHeadings = (text: string): string[] => {
  const titles = extractInterpretationMarkdownHeadings(text);
  const candidates: string[] = [];
  for (const raw of titles) {
    if (isStructuralInterpretationHeading(raw)) continue;
    const stem = normalizedHeadingStem(raw);
    if (!stem || stem.length < 3) continue;
    if (GENERIC_SOLO_HEADING_STEMS.has(stem)) continue;
    const readable = stripMarkdownHeadingText(raw);
    const cleaned = readable.replace(/^The\s+/i, '').slice(0, 72).trim();
    if (cleaned.length >= 3) candidates.push(cleaned);
  }
  return [...new Set(candidates)];
};

const parseBulletLeadPhrasesFromSection = (section: string | null): string[] => {
  if (!section) return [];
  const out: string[] = [];
  const bulletMatches = section.match(/^[-*]\s*(.+)$/gm);
  if (bulletMatches) {
    bulletMatches.forEach((bullet) => {
      const text = bullet.replace(/^[-*]\s*/, '').trim();
      const symbolName = text.split(/[:,\-]/)[0].trim();
      if (symbolName && symbolName.length < 50) out.push(symbolName);
    });
  }
  return out;
};

const extractExplicitArchetypesFromReadingProse = (text: string): ArchetypeName[] => {
  const ordered = [...ARCHETYPE_WHITELIST].sort((a, b) => b.length - a.length);
  const hits: ArchetypeName[] = [];
  const seen = new Set<string>();
  for (const label of ordered) {
    try {
      const re = new RegExp(`\\b${escapeRegex(label)}\\b`, 'iu');
      if (!re.test(text)) continue;
      if (!seen.has(label)) {
        seen.add(label);
        hits.push(label);
      }
    } catch {
      continue;
    }
  }
  return hits;
};

export const extractSymbolsAndArchetypesFromRenderedAnalysis = (aiResponse: string): {
  symbols: string[];
  archetypes: string[];
  landscapes: string[];
} => {
  const trimmed = aiResponse.includes(END_MARKER_DREAM_READING)
    ? stripEndMarker(aiResponse, END_MARKER_DREAM_READING)
    : aiResponse.trim();

  const symbols: string[] = [];
  symbols.push(...parseBulletLeadPhrasesFromSection(extractSection(trimmed, 'Key Symbols')));
  if (symbols.length === 0) symbols.push(...parseBulletLeadPhrasesFromSection(extractSection(trimmed, 'Symbolic Forms')));
  if (symbols.length === 0) symbols.push(...deriveSymbolTitlesFromDreamHeadings(trimmed));

  const archeSection =
    extractSection(trimmed, 'Archetypal Dynamics') ||
    extractSection(trimmed, 'Archetypal Layer');
  let archetypeCandidates: ArchetypeName[] = [];
  if (archeSection) {
    const bulletMatches = archeSection.match(/^[-*]\s*(.+)$/gm) || [];
    archetypeCandidates = bulletMatches
      .map((b) => b.replace(/^[-*]\s*/, '').trim())
      .map((line) => line.split(/[:–—-]/)[0].trim())
      .flatMap((raw) => normalizeArchetypeList(raw));
  }
  if (archetypeCandidates.length === 0) archetypeCandidates = extractExplicitArchetypesFromReadingProse(trimmed);

  const filteredSymbols = filterAffectWords([...new Set(symbols)]);
  const uniqueArchetypes = [...new Set(archetypeCandidates)];
  const filteredArchetypes = filterArchetypesForDisplay(uniqueArchetypes, trimmed);

  return {
    symbols: filteredSymbols.slice(0, MAX_SYMBOLS_TOTAL),
    archetypes: filteredArchetypes,
    landscapes: [],
  };
};

export const extractSymbolsAndArchetypes = extractSymbolsAndArchetypesFromRenderedAnalysis;

const AFFECT_WORDS = new Set([
  'worry', 'worried', 'anxiety', 'anxious', 'fear', 'fearful', 'afraid', 'scared',
  'sadness', 'sad', 'depression', 'depressed', 'melancholy', 'melancholic',
  'anger', 'angry', 'rage', 'rageful', 'fury', 'furious',
  'joy', 'joyful', 'happy', 'happiness', 'elation', 'elated',
  'confusion', 'confused', 'uncertainty', 'uncertain',
  'shame', 'ashamed', 'guilt', 'guilty', 'embarrassment', 'embarrassed',
  'excitement', 'excited', 'anticipation', 'anticipating',
  'loneliness', 'lonely', 'isolation', 'isolated',
  'hope', 'hopeful', 'despair', 'despairing',
  'peace', 'peaceful', 'calm', 'calmness',
  'tension', 'tense', 'stress', 'stressed',
  'relief', 'relieved', 'comfort', 'comfortable',
  'disgust', 'disgusted', 'contempt', 'contemptuous',
  'surprise', 'surprised', 'shock', 'shocked',
  'love', 'loved', 'hate', 'hated', 'resentment', 'resentful',
  'envy', 'envious', 'jealousy', 'jealous',
  'pride', 'proud', 'humility', 'humble',
  'grief', 'grieving', 'mourning', 'mournful',
  'euphoria', 'euphoric', 'bliss', 'blissful',
  'panic', 'panicked', 'terror', 'terrified',
  'dread', 'dreaded', 'horror', 'horrified',
  'desire', 'desiring', 'longing',
  'nostalgia', 'nostalgic', 'yearning',
  'frustration', 'frustrated', 'irritation', 'irritated',
  'contentment', 'content', 'satisfaction', 'satisfied',
  'disappointment', 'disappointed', 'regret', 'regretful',
]);

const filterAffectWords = (symbols: string[]): string[] => {
  return symbols.filter((symbol) => {
    const symbolLower = symbol.toLowerCase().trim();
    const words = symbolLower.split(/\s+/);
    return !words.some((word) => AFFECT_WORDS.has(word));
  });
};

const CONVERSATION_ELEMENT_UPDATE_SYSTEM_PROMPT = `You revise long-term dream pattern metadata from a follow-up conversation.
Return only the JSON fields requested in the user message.
Do not extract, invent, or return symbols, symbol_stances, or landscapes.
Use the user's confirmed clarifications; do not treat assistant speculation as ground truth unless the user echoes or grounds it.
All field values in English. Return valid JSON only — no markdown fences or commentary.`;

const EXTRACTION_SYSTEM_PROMPT = `
You map dream elements for UI metadata and long-term pattern tracking.
This may run as a background pre-catalogue from the raw dream, or after the interpretation when no cached metadata exists.
Your job is indexing/cataloguing, not first reading.
Use the dream as ground truth. If a final interpretation is provided, treat it as supporting context only.

Rules:
- Map only what is clearly present or strongly implied by concrete dream language.
- Be restrained and economical. Leave arrays empty when the dream does not clearly support a field.
- Return every field value in English only, regardless of the dream language.
- Prefer fewer high-confidence items over many weak ones.
- Prefer concrete dream language over abstract psychological labels.
- Do not infer archetypes unless strongly staged.
- Do not use mythological amplification unless it directly clarifies the dream image.
- core_mode may be null if choosing a mode would distort the dream.

Fields:
- symbols: 1–5 concrete images, figures, animals, places, objects, or forces. Never emotions. Use canonical singular form with no article.
- symbol_stances: 1–5 items, only for genuinely charged symbols. Add one entry per charged key symbol, maximum 5. If no symbol carries clear charge, use []. Each item is { "symbol": "exact phrase from symbols", "stance": "2–8 words" }. Capture how the symbol is experienced in this dream: e.g. "playful", "blocking, alarming", "stressful attempt to prove", "warmly permitting closeness". Use specific lived tone, not generic positive/negative labels.
- archetypes: optional. Include only when clearly active. Use only: ${ARCHETYPE_WHITELIST.join(', ')}. Split combined labels into separate entries.
- landscapes: 1–3 main settings or places in canonical form.
- affects: 2–4 dominant felt tones or bodily energies, not diagnoses.
- motifs: 2–4 short symbolic forms or situations describing the dream's shape, not its interpretation.
- relational_dynamics: 1–3 short phrases about regulation of pace, permission, urgency, merging, or distance.
- thresholds: 0–3 moments of transition, departure, arrival, sleep, work, crossing, or change of ground.
- central_conflicts: 0–2 concrete conflicts or opposing pressures clearly staged by the dream.
  Use "X vs Y" only when both sides are supported by actual dream images, figures, actions, places, or bodily tones.
  Prefer image-near phrasing over abstract psychology.
  Good: "locked room vs open street", "wanting to enter vs being watched", "warm table vs silent exclusion", "sleeping body vs demand to perform".
  Avoid generic pairs like "fear vs desire", "control vs surrender", or "autonomy vs belonging" unless the dream concretely stages both sides.
  Use [] if none is clearly staged.
- core_mode: exactly one of "Core Tension", "Core State", "Core Shift", "Core Restoration", or null.
- amplifications: 0–2 brief items for symbols with unmistakable embodied or numinous charge. Do not use mythological amplification unless it directly clarifies the dream image.

Schema contract:
{
  "symbols": string[],
  "symbol_stances": {"symbol": string, "stance": string}[],
  "archetypes": string[],
  "landscapes": string[],
  "affects": string[],
  "motifs": string[],
  "relational_dynamics": string[],
  "thresholds": string[],
  "central_conflicts": string[],
  "core_mode": "Core Tension" | "Core State" | "Core Shift" | "Core Restoration" | null,
  "amplifications": string[]
}

Return ONLY one valid JSON object, single-line, no extra text. Put symbol_stances immediately after symbols:
{
  "symbols": [...],
  "symbol_stances": [{"symbol": "mirror", "stance": "stressful attempt to prove"}],
  "archetypes": [...],
  "landscapes": [...],
  "affects": [...],
  "motifs": [...],
  "relational_dynamics": [...],
  "thresholds": [...],
  "central_conflicts": [...],
  "core_mode": "Core Tension",
  "amplifications": [...]
}

If nothing fits an array field, use []. If core_mode cannot be chosen without distortion, use null. Return only the JSON object with no markdown fences or commentary.
`;

export type SymbolStance = { symbol: string; stance: string };

const asStringArray = (value: unknown, max = 10): string[] =>
  Array.isArray(value)
    ? value.map((s) => String(s).trim()).filter(Boolean).slice(0, max)
    : [];

const asSymbolStances = (value: unknown, max = 5): SymbolStance[] =>
  Array.isArray(value)
    ? value
        .map((item: unknown) => {
          const o = item as { symbol?: unknown; stance?: unknown };
          const symbol = typeof o?.symbol === 'string' ? o.symbol.trim() : '';
          const stance = typeof o?.stance === 'string' ? o.stance.trim() : String(o?.stance ?? '').trim();
          return { symbol, stance };
        })
        .filter((x) => x.symbol.length > 0)
        .slice(0, max)
    : [];

export type DreamExtraction = {
  symbols: string[];
  archetypes: string[];
  landscapes: string[];
  affects: string[];
  motifs: string[];
  relational_dynamics: string[];
  thresholds: string[];
  central_conflicts: string[];
  core_mode: string;
  amplifications: string[];
  symbol_stances: SymbolStance[];
};

const parseDreamExtractionRecord = (parsed: Record<string, unknown>): DreamExtraction => {
  const rawSymbols = asStringArray(parsed.symbols, MAX_SYMBOLS_TOTAL);
  const symbols = filterAffectWords(rawSymbols).slice(0, MAX_SYMBOLS_TOTAL);

  const rawArchetypes: unknown[] = Array.isArray(parsed.archetypes) ? parsed.archetypes : [];
  const expanded: string[] = rawArchetypes.flatMap((a) => normalizeArchetypeList(String(a)));
  const uniqueArchetypes = [...new Set(expanded)];

  const landscapes = asStringArray(parsed.landscapes, 5);
  const affects = asStringArray(parsed.affects, 4);
  const motifs = asStringArray(parsed.motifs, 4);
  const relational_dynamics = asStringArray(parsed.relational_dynamics, 3);
  const thresholds = asStringArray(parsed.thresholds, 3);
  const central_conflicts = asStringArray(parsed.central_conflicts ?? parsed.centralConflicts, 2);
  const core_mode =
    typeof parsed.core_mode === 'string' && /^Core (Tension|State|Shift|Restoration)$/.test(parsed.core_mode)
      ? parsed.core_mode
      : '';
  const amplifications = asStringArray(parsed.amplifications, 3);

  const rawSymbolStances = parsed.symbol_stances ?? parsed.symbolStances;
  const symbol_stances = asSymbolStances(rawSymbolStances, 5);

  if (__DEV__ && symbol_stances.length === 0 && parsed && typeof parsed === 'object') {
    console.warn('[AI] symbol_stances empty; parsed keys:', Object.keys(parsed));
    if (rawSymbolStances != null) {
      console.warn(
        '[AI] rawSymbolStances type:',
        typeof rawSymbolStances,
        Array.isArray(rawSymbolStances) ? 'length=' + (rawSymbolStances as unknown[]).length : '',
        rawSymbolStances
      );
    }
  }

  return {
    symbols,
    archetypes: uniqueArchetypes,
    landscapes,
    affects,
    motifs,
    relational_dynamics,
    thresholds,
    central_conflicts,
    core_mode,
    amplifications,
    symbol_stances,
  };
};

export type DreamDisplayMap = {
  chargedImages: Array<{ label: string; tone?: string }>;
  movement: string;
  unresolvedPressure?: string;
  resonance?: string;
};

export const buildDreamDisplayMap = (extraction: DreamExtraction): DreamDisplayMap => {
  const chargedImages =
    extraction.symbol_stances.length > 0
      ? extraction.symbol_stances.slice(0, 4).map((s) => ({
          label: s.symbol,
          tone: s.stance || undefined,
        }))
      : extraction.symbols.slice(0, 4).map((label) => ({ label }));

  const movement =
    extraction.thresholds.slice(0, 3).join(' → ') ||
    extraction.motifs.slice(0, 2).join(' → ') ||
    extraction.central_conflicts[0] ||
    extraction.relational_dynamics[0] ||
    'unmapped movement';

  return {
    chargedImages,
    movement,
    unresolvedPressure: extraction.central_conflicts[0] || undefined,
    resonance: extraction.amplifications[0] || extraction.motifs[0] || undefined,
  };
};

export const extractDreamSymbolsAndArchetypes = async (
  dream: Dream,
  finalInterpretation: string = ''
): Promise<DreamExtraction> => {
  const interpretationContext = finalInterpretation.trim() || '(none provided)';
  const hasFinalInterpretation = finalInterpretation.trim().length > 0;

  const extractionPrompt = `${hasFinalInterpretation ? 'Catalog this dream into UI metadata fields after the final interpretation has been written' : 'Pre-catalog this dream into UI metadata fields from the raw dream only'}: symbols, symbol_stances, archetypes, landscapes, affects, motifs, relational_dynamics, thresholds, central_conflicts, core_mode, and amplifications.

Title: ${dream.title || 'Untitled'}
Date: ${dream.date}

Dream:
${dream.content}

${hasFinalInterpretation ? `Final interpretation:
${interpretationContext}
` : 'Final interpretation: (not provided; use raw dream only)\n'}
Return one JSON object matching the schema exactly. Put symbol_stances immediately after symbols.
symbol_stances must contain one entry per genuinely charged key symbol, maximum 5. Use [] if no symbol has clear charge.
Do not write a new interpretation. Catalog only what ${hasFinalInterpretation ? 'the dream text and final interpretation concretely support' : 'the dream text concretely supports'}.
If unsure for arrays, use []. For core_mode, choose the least distorted fit based on dominant final movement and affect, or null if no mode fits without distortion.`;

  const { requestId, model } = startRequest();

  try {
    const apiUrl = getApiUrl();
    const apiKey = getApiKey();
    const capabilities = getModelCapabilities(model);

    if (!__DEV__ && isOpenAIHost(apiUrl)) {
      throw new Error('Direct OpenAI calls are disabled in production builds. Configure a proxy endpoint.');
    }
    if (requiresClientKey(apiUrl)) {
      if (!apiKey || apiKey === 'your-openai-api-key') {
        logError('ai_missing_api_key', new Error('OpenAI API key not configured'));
        throw new Error('OpenAI API key missing or placeholder. Check your config.');
      }
    }

    const messages: ApiMessage[] = [
      { role: 'system', content: EXTRACTION_SYSTEM_PROMPT },
      { role: 'user', content: extractionPrompt },
    ];

    const payload: any = { model, messages, temperature: 0.25 };
    attachProxyTask(payload, apiUrl, 'dream_extraction');

    let tokenLimit: number | undefined;
    if (capabilities.supportsMaxCompletionTokens) {
      tokenLimit = 2600;
      setTokenLimit(payload, apiUrl, tokenLimit, model);
    }

    if (capabilities.supportsResponseFormat) payload.response_format = { type: 'json_object' };

    logAiRequestStart({ requestId, task: 'dream_extraction', model, messages, tokenLimit, apiUrl, dreamId: dream.id });

    const headers = await buildHeaders(apiUrl, apiKey, requestId, dream.id);
    const extractionTimeout = Math.min(capabilities.defaultTimeout, 25000);
    const response = await fetchWithTimeout(
      apiUrl,
      { method: 'POST', headers, body: JSON.stringify(payload) },
      extractionTimeout,
      1,
      2
    );

    const data = await parseApiResponse(response, requestId, apiUrl);

    if (!response.ok) {
      const rawError = safeErrMsg(data.error?.message) || `API Error: ${response.status}`;
      logError('ai_extract_symbols_api_error', new Error(rawError), {
        requestId,
        model,
        status: response.status,
        hasError: !!data.error,
      });
      throw new Error(userSafeError(response.status, apiUrl));
    }

    recordDreamAiUsage(dream.id, 'dream_extraction', data, aiResponseMeta(response, requestId));

    const content = extractApiResponseContent(data);

    if (__DEV__) console.log('[AI] Extraction response (first 200 chars):', content.substring(0, 200));

    try {
      let jsonStr = content.trim().replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

      if (!jsonStr.startsWith('{')) {
        const extracted = extractFirstJsonObject(jsonStr);
        if (extracted) jsonStr = extracted.trim();
        else throw new Error('No JSON object found in response');
      }

      const parsed = JSON.parse(jsonStr) as Record<string, unknown>;

      const extraction = parseDreamExtractionRecord(parsed);

      if (__DEV__) {
        console.log('[AI] Extracted:', {
          symbolsCount: extraction.symbols.length,
          archetypesCount: extraction.archetypes.length,
          landscapesCount: extraction.landscapes.length,
          affectsCount: extraction.affects.length,
          motifsCount: extraction.motifs.length,
          thresholdsCount: extraction.thresholds.length,
          centralConflictsCount: extraction.central_conflicts.length,
          symbol_stancesCount: extraction.symbol_stances.length,
          core_mode: extraction.core_mode,
        });
      }

      return extraction;
    } catch (parseError) {
      if (__DEV__) {
        console.warn('[AI] JSON parse failed, returning empty extraction:', parseError);
        console.warn('[AI] Content that failed to parse (first 200 chars):', content.substring(0, 200));
      }
      logError('ai_extract_json_parse_error', parseError, { contentLength: content.length });
      return emptyDreamExtraction();
    }
  } catch (error) {
    logError('ai_extract_symbols_error', error, { requestId, model });
    return emptyDreamExtraction();
  }
};

function emptyDreamExtraction(): DreamExtraction {
  return {
    symbols: [],
    archetypes: [],
    landscapes: [],
    affects: [],
    motifs: [],
    relational_dynamics: [],
    thresholds: [],
    central_conflicts: [],
    core_mode: '',
    amplifications: [],
    symbol_stances: [],
  };
}

type ConversationElementFields = Pick<
  DreamExtraction,
  | 'archetypes'
  | 'affects'
  | 'motifs'
  | 'relational_dynamics'
  | 'thresholds'
  | 'central_conflicts'
  | 'core_mode'
  | 'amplifications'
>;

const interpretationToConversationFields = (interpretation: Interpretation): ConversationElementFields => ({
  archetypes: interpretation.archetypes ?? [],
  affects: interpretation.affects ?? [],
  motifs: interpretation.motifs ?? [],
  relational_dynamics: interpretation.relational_dynamics ?? [],
  thresholds: interpretation.thresholds ?? [],
  central_conflicts: interpretation.central_conflicts ?? [],
  core_mode: interpretation.core_mode ?? '',
  amplifications: interpretation.amplifications ?? [],
});

const uniqueCaseInsensitive = (values: string[], max: number): string[] => {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    const normalized = value.trim();
    const key = normalized.toLowerCase();
    if (!normalized || seen.has(key)) continue;
    seen.add(key);
    result.push(normalized);
    if (result.length >= max) break;
  }
  return result;
};

export const mergeConversationElementUpdates = (
  current: ConversationElementFields,
  updates: Partial<ConversationElementFields>
): ConversationElementFields => {
  const rawArchetypes = updates.archetypes && updates.archetypes.length > 0 ? updates.archetypes : current.archetypes;
  const archetypes = uniqueCaseInsensitive(rawArchetypes.flatMap((a) => normalizeArchetypeList(a)), 8);

  const coreMode = updates.core_mode && VALID_CORE_MODES.has(updates.core_mode) ? updates.core_mode : current.core_mode;

  return {
    archetypes,
    affects: uniqueCaseInsensitive(updates.affects && updates.affects.length > 0 ? updates.affects : current.affects, 5),
    motifs: uniqueCaseInsensitive(updates.motifs && updates.motifs.length > 0 ? updates.motifs : current.motifs, 6),
    relational_dynamics: uniqueCaseInsensitive(
      updates.relational_dynamics && updates.relational_dynamics.length > 0
        ? updates.relational_dynamics
        : current.relational_dynamics,
      4
    ),
    thresholds: uniqueCaseInsensitive(updates.thresholds && updates.thresholds.length > 0 ? updates.thresholds : current.thresholds, 4),
    central_conflicts: uniqueCaseInsensitive(
      updates.central_conflicts && updates.central_conflicts.length > 0
        ? updates.central_conflicts
        : current.central_conflicts,
      2
    ),
    core_mode: coreMode,
    amplifications: uniqueCaseInsensitive(
      updates.amplifications && updates.amplifications.length > 0 ? updates.amplifications : current.amplifications,
      4
    ),
  };
};

const conversationForExtractionPrompt = (messages: ChatMessage[], maxMessages = 10): string =>
  trimConversationHistory(messages, maxMessages)
    .map((message) => `${message.role.toUpperCase()}: ${message.content}`)
    .join('\n\n');

export const updateInterpretationElementsFromConversation = async (
  dream: Dream,
  interpretation: Interpretation,
  conversation: ChatMessage[]
): Promise<Interpretation> => {
  const current = interpretationToConversationFields(interpretation);
  const prompt = `Review this dream follow-up conversation and revise the extracted elements used for long-term pattern reports.

Dream title: ${dream.title || 'Untitled'}
Dream date: ${dream.date}

Dream text:
${dream.content}

Current extracted elements:
${JSON.stringify(current)}

Follow-up conversation:
${conversationForExtractionPrompt(conversation)}

Rules:
- Return the full revised values for these fields only: archetypes, affects, motifs, relational_dynamics, thresholds, central_conflicts, core_mode, amplifications.
- central_conflicts: at most 2 items; use [] unless the conversation clearly grounds opposing pressures. Avoid generic "X vs Y" pairs without concrete dream support.
- Do NOT return or revise key symbols, symbol_stances, or landscapes. Key symbols must remain grounded in the original dream text only.
- Use the user's follow-up clarifications to update or add symbolic motifs, inner structures, and archetypal energies.
- Do not add elements from assistant speculation unless the user confirms or clearly grounds them.
- Keep values in English, concise, and suitable for pattern tracking.
- Archetypes must use only this whitelist: ${ARCHETYPE_WHITELIST.join(', ')}.
- core_mode must be exactly one of: Core Tension, Core State, Core Shift, Core Restoration.
- If the conversation does not clarify a field, keep the current value.

Return ONLY one valid JSON object:
{
  "archetypes": [...],
  "affects": [...],
  "motifs": [...],
  "relational_dynamics": [...],
  "thresholds": [...],
  "central_conflicts": [...],
  "core_mode": "Core State",
  "amplifications": [...]
}`;

  const { requestId, model } = startRequest();

  try {
    const apiUrl = getApiUrl();
    const apiKey = getApiKey();
    const capabilities = getModelCapabilities(model);

    if (!__DEV__ && isOpenAIHost(apiUrl)) {
      throw new Error('Direct OpenAI calls are disabled in production builds. Configure a proxy endpoint.');
    }
    if (requiresClientKey(apiUrl)) {
      if (!apiKey || apiKey === 'your-openai-api-key') {
        logError('ai_missing_api_key', new Error('OpenAI API key not configured'));
        return interpretation;
      }
    }

    const messages: ApiMessage[] = [
      { role: 'system', content: CONVERSATION_ELEMENT_UPDATE_SYSTEM_PROMPT },
      { role: 'user', content: prompt },
    ];

    const payload: any = { model, messages, temperature: 0.2 };
    attachProxyTask(payload, apiUrl, 'conversation_element_update');

    let tokenLimit: number | undefined;
    if (capabilities.supportsMaxCompletionTokens) {
      tokenLimit = 1000;
      setTokenLimit(payload, apiUrl, tokenLimit, model);
    }

    if (capabilities.supportsResponseFormat) payload.response_format = { type: 'json_object' };

    logAiRequestStart({ requestId, task: 'conversation_element_update', model, messages, tokenLimit, apiUrl, dreamId: dream.id });

    const headers = await buildHeaders(apiUrl, apiKey, requestId, dream.id);
    const response = await fetchWithTimeout(
      apiUrl,
      { method: 'POST', headers, body: JSON.stringify(payload) },
      Math.min(capabilities.defaultTimeout, 20000),
      1,
      1
    );

    const data = await parseApiResponse(response, requestId, apiUrl);
    if (!response.ok) {
      const rawError = safeErrMsg(data.error?.message) || `API Error: ${response.status}`;
      logError('ai_conversation_element_update_api_error', new Error(rawError), { requestId, model, status: response.status });
      return interpretation;
    }

    recordDreamAiUsage(dream.id, 'conversation_element_update', data, aiResponseMeta(response, requestId));

    const content = extractApiResponseContent(data);
    let jsonStr = content.trim().replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    if (!jsonStr.startsWith('{')) {
      const extracted = extractFirstJsonObject(jsonStr);
      if (!extracted) return interpretation;
      jsonStr = extracted.trim();
    }

    const parsed = JSON.parse(jsonStr) as Record<string, unknown>;
    const updates: ConversationElementFields = {
      archetypes: asStringArray(parsed.archetypes, 8),
      affects: asStringArray(parsed.affects, 5),
      motifs: asStringArray(parsed.motifs, 6),
      relational_dynamics: asStringArray(parsed.relational_dynamics, 4),
      thresholds: asStringArray(parsed.thresholds, 4),
      central_conflicts: asStringArray(parsed.central_conflicts ?? parsed.centralConflicts, 2),
      core_mode: typeof parsed.core_mode === 'string' ? parsed.core_mode.trim() : '',
      amplifications: asStringArray(parsed.amplifications, 4),
    };
    const merged = mergeConversationElementUpdates(current, updates);

    if (__DEV__) {
      console.log('[AI] Conversation element update:', {
        archetypesCount: merged.archetypes.length,
        affectsCount: merged.affects.length,
        motifsCount: merged.motifs.length,
        relationalDynamicsCount: merged.relational_dynamics.length,
        thresholdsCount: merged.thresholds.length,
        centralConflictsCount: merged.central_conflicts.length,
        core_mode: merged.core_mode,
        amplificationsCount: merged.amplifications.length,
      });
    }

    return {
      ...interpretation,
      archetypes: merged.archetypes,
      affects: merged.affects.length > 0 ? merged.affects : undefined,
      motifs: merged.motifs.length > 0 ? merged.motifs : undefined,
      relational_dynamics: merged.relational_dynamics.length > 0 ? merged.relational_dynamics : undefined,
      thresholds: merged.thresholds.length > 0 ? merged.thresholds : undefined,
      central_conflicts: merged.central_conflicts.length > 0 ? merged.central_conflicts : undefined,
      core_mode: merged.core_mode,
      amplifications: merged.amplifications.length > 0 ? merged.amplifications : undefined,
    };
  } catch (error) {
    logError('ai_conversation_element_update_error', error, { requestId, model });
    return interpretation;
  }
};

/* ============================
   PATTERN INSIGHTS (MONTHLY / QUARTERLY)
   ============================ */

const MONTHLY_DREAM_ESSAY_SYSTEM_PROMPT = `
You are Dream Weaver, a post-Jungian dream essayist reviewing a month of dreams.

Your role is to synthesize the month's dream material into a reflective symbolic essay.
You do not diagnose, advise, prescribe, reassure, or make factual claims about the dreamer.
You write hypothetically, but you are allowed to offer a clear symbolic landing when the data supports it.

Core principles:
- Read the dreams as a field, not as isolated events.
- Track recurring images, affects, symbol stances, relational dynamics, thresholds, and central conflicts.
- Do not write as if explaining metadata fields.
- Use extracted fields only to see the dream-field more clearly.
- The essay should feel synthesized from images and movements, not generated from tags.
- Use thresholds and central conflicts as high-value synthesis material only when the data clearly stages crossings or opposing pressures.
- Notice whether the month shows movement, repetition, intensification, retreat, partial integration, contradiction, or unresolved suspension.
- Do not force progress. If the month is cyclical, stalled, fragmented, or contradictory, say so plainly.
- Do not flatten everything into generic themes like "change", "growth", or "anxiety".
- Every major claim must be grounded in at least one concrete recurrence or contrast from the dream data.
- If there are too few dreams to support a strong pattern, say so and offer a lighter reading.
- Treat interpretation excerpts as supporting material, but do not simply repeat them.
- Archetypal language is optional. Use it only when it deepens a repeated image or field dynamic.
- Shadow means unintegrated charge, intensity, vitality, fear, anger, or instinct — not moral negativity.
- Self should appear only if the month shows a credible organizing center or movement toward coherence.

Style:
- Write like a psychologically precise essay, not a bullet-point analytics report.
- Use vivid, grounded, image-near language.
- Prefer synthesis over listing.
- Avoid generic coaching language.
- Avoid advice.
- Avoid conclusions that sound final.
- Keep markdown section headings exactly as specified in English for UI consistency.
- Write body text and reflective questions in the user's requested language.

Essay shape:
## The Month's Dream Field
A short opening that names the dominant atmosphere or organizing movement of the month.

## Recurring Images and Pressures
Synthesize the main repeated symbols, affects, landscapes, and symbol stances. Focus on what the images are doing.

## Thresholds and Conflicts
Optional. Include this section only when crossings, transitions, or conflict pairs are concrete and structurally important. Otherwise weave those pressures into Recurring Images and Pressures or Movement Across the Month.
Stay image-near and tied to the excerpts; avoid generic "X vs Y" psychology templates unless the month's images support each side.

## Movement Across the Month
Describe whether the dreams move toward coherence, intensification, retreat, partial repair, contradiction, or unresolved suspension. Do not force an evolution.

## What Remains Open
Name the unresolved question or psychic pressure the month seems to leave behind.

## Reflective Questions
Exactly 2 questions. They must be observational, symbolic, or somatic. No advice verbs like try, practice, breathe, relax, focus, or work on.

Length:
- If 1 dream: 250–400 words.
- If 2–4 dreams: 450–700 words.
- If 5+ dreams: 650–800 words.

Technical requirement:
After the complete response, append this exact hidden marker on its own line:
${END_MARKER_DREAM_ESSAY}
`;

export type PatternInsightDreamEntry = {
  date: string;
  extracted: DreamExtraction;
  interpretation: string;
};

const trimEssayContextText = (text: string, max = 700): string => {
  const clean = text.replace(/\s+/g, ' ').trim();
  return clean.length > max ? clean.slice(0, max) + '...' : clean;
};

export const generatePatternInsights = async (
  dreamAnalyses: PatternInsightDreamEntry[],
  period: 'monthly' | 'quarterly' = 'monthly',
  language: string = 'en'
): Promise<string> => {
  if (dreamAnalyses.length === 0) {
    if (language === 'el') {
      return 'Δεν υπάρχουν ερμηνευμένα όνειρα σε αυτή την περίοδο. Χρειάζονται τουλάχιστον 1–2 καταχωρήσεις για να σχηματιστεί ένα ουσιαστικό μηνιαίο πεδίο.';
    }
    return 'No interpreted dreams in this period. Interpret 1–2 dreams to generate a meaningful dream essay.';
  }

  const context = dreamAnalyses
    .map((d, index) => {
      const stances = (d.extracted.symbol_stances ?? []).map((s) => `${s.symbol}: ${s.stance}`).join('; ');
      return `
Dream ${index + 1}
Date: ${d.date}
Core Mode: ${d.extracted.core_mode || '(not set)'}
Affects: ${(d.extracted.affects ?? []).join(', ') || '(none)'}
Symbols: ${(d.extracted.symbols ?? []).slice(0, 5).join(', ') || '(none)'}
Symbol stances: ${stances || '(none)'}
Landscapes: ${(d.extracted.landscapes ?? []).slice(0, 3).join(', ') || '(none)'}
Motifs: ${(d.extracted.motifs ?? []).join('; ') || '(none)'}
Relational dynamics: ${(d.extracted.relational_dynamics ?? []).join('; ') || '(none)'}
Thresholds: ${(d.extracted.thresholds ?? []).join('; ') || '(none)'}
Central conflicts: ${(d.extracted.central_conflicts ?? []).join('; ') || '(none)'}
Amplifications: ${(d.extracted.amplifications ?? []).join('; ') || '(none)'}
Interpretation excerpt: ${d.interpretation ? trimEssayContextText(d.interpretation, 650) : '(none)'}
`;
    })
    .join('\n');

  const langNames: Record<string, string> = {
    el: 'Greek (Ελληνικά)', es: 'Spanish', fr: 'French', de: 'German', it: 'Italian',
    pt: 'Portuguese', nl: 'Dutch', pl: 'Polish', ru: 'Russian', ja: 'Japanese', zh: 'Chinese',
  };
  const langInstruction = language === 'en'
    ? ''
    : `

IMPORTANT LANGUAGE RULE:
Keep all markdown section headings exactly as specified in English for UI consistency.
Write all paragraph text, bullets, and reflective questions in ${langNames[language] ?? `the language with ISO 639-1 code "${language}"`}.
Do not translate section headings.
Preserve extracted symbols in English only if needed, but explain them in the requested language.`;

  const userPrompt = `You are writing a ${period} dream essay.

Period: ${period}
Number of interpreted dreams: ${dreamAnalyses.length}

Dream data:
${context}

Write a symbolic monthly/quarterly essay that synthesizes the dream field as a whole.

Important:
- Do not summarize each dream one by one.
- Do not simply list recurring tags.
- Do not write as if explaining metadata fields.
- Use extracted fields only to see the dream-field more clearly.
- The essay should feel synthesized from images and movements, not generated from tags.
- Find the field-level pattern: recurring images, pressures, thresholds, conflicts, and movements.
- Use thresholds and conflicts as major synthesis anchors only when they are concrete and recurring or structurally important.
- Use interpretation excerpts only to deepen the synthesis, not to repeat the original readings.
- Keep all claims hypothetical and grounded in the data.
- No advice, no diagnosis, no prescriptions, no reassurance.
${langInstruction}`;

  const { requestId, model } = startRequest();

  try {
    const apiUrl = getApiUrl();
    const apiKey = getApiKey();
    const capabilities = getModelCapabilities(model);

    if (!__DEV__ && isOpenAIHost(apiUrl)) {
      throw new Error('Direct OpenAI calls are disabled in production builds. Configure a proxy endpoint.');
    }
    if (requiresClientKey(apiUrl)) {
      if (!apiKey || apiKey === 'your-openai-api-key') {
        logError('ai_missing_api_key', new Error('OpenAI API key not configured'));
        throw new Error('OpenAI API key missing or placeholder. Check your config.');
      }
    }

    const messages: ApiMessage[] = [
      { role: 'system', content: MONTHLY_DREAM_ESSAY_SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ];

    const payload: any = { model, messages, temperature: 0.48 };
    attachProxyTask(payload, apiUrl, 'pattern_insights');

    let tokenLimit: number | undefined;
    if (capabilities.supportsMaxCompletionTokens) {
      tokenLimit = dreamAnalyses.length >= 5 ? 2200 : dreamAnalyses.length >= 2 ? 1700 : 1100;
      setTokenLimit(payload, apiUrl, tokenLimit, model);
    }

    logAiRequestStart({ requestId, task: 'pattern_insights', model, messages, tokenLimit, apiUrl });

    const headers = await buildHeaders(apiUrl, apiKey, requestId);
    const response = await fetchWithTimeout(
      apiUrl,
      { method: 'POST', headers, body: JSON.stringify(payload) },
      capabilities.defaultTimeout,
      1,
      2
    );

    const data = await parseApiResponse(response, requestId, apiUrl);

    if (!response.ok) {
      const rawError = safeErrMsg(data.error?.message) || `API Error: ${response.status}`;
      logError('ai_pattern_insights_api_error', new Error(rawError), { requestId, model, status: response.status });
      throw new Error(userSafeError(response.status, apiUrl));
    }

    recordDreamAiUsage(undefined, 'pattern_insights', data, aiResponseMeta(response, requestId));

    let content = extractApiResponseContent(data, { allowTruncated: true });

    if (isTruncatedResponse(data) || !content.trim() || !hasEndMarker(content, END_MARKER_DREAM_ESSAY)) {
      const retryTokenLimit = dreamAnalyses.length >= 5 ? 1700 : dreamAnalyses.length >= 2 ? 1300 : 850;
      content = await retryCompressedPatternEssay({
        apiUrl,
        apiKey,
        model,
        originalMessages: messages,
        requestId,
        tokenLimit: retryTokenLimit,
        timeout: capabilities.defaultTimeout,
      });
    }

    return stripEndMarker(content, END_MARKER_DREAM_ESSAY);
  } catch (error) {
    logError('ai_pattern_insights_error', error, { requestId, model });
    throw error;
  }
};

export async function groupSimilarTerms(
  symbols: string[],
  landscapes: string[]
): Promise<{ symbolGroupMap: Record<string, string>; landscapeGroupMap: Record<string, string> }> {
  const empty = { symbolGroupMap: {}, landscapeGroupMap: {} };
  if (symbols.length < 2 && landscapes.length < 2) return empty;

  const { requestId, model } = startRequest();

  try {
    const apiUrl = getApiUrl();
    const apiKey = getApiKey();
    const capabilities = getModelCapabilities(model);

    if (!__DEV__ && isOpenAIHost(apiUrl)) return empty;
    if (requiresClientKey(apiUrl)) {
      if (!apiKey || apiKey === 'your-openai-api-key') return empty;
    }

    const symbolSet = new Set(symbols);
    const landscapeSet = new Set(landscapes);

    const userPrompt = `Group semantically equivalent terms from these two lists.

Symbols: ${JSON.stringify(symbols)}
Landscapes: ${JSON.stringify(landscapes)}

Rules:
- Only group terms that clearly mean the SAME thing (e.g. "acupuncture class" = "acupuncture school", "forest" = "woods", "corridor" = "hallway").
- Do NOT group merely related terms (e.g. "acupuncture needle" ≠ "acupuncture school").
- Each group must have 2+ members. canonical must be one of the members.
- Pick the most natural/common English term as canonical.
- Omit terms with no equivalent — only list actual duplicates.

Return ONLY valid JSON:
{"symbol_groups":[{"canonical":"...","members":["...","..."]}],"landscape_groups":[{"canonical":"...","members":["...","..."]}]}`;

    const messages: ApiMessage[] = [
      { role: 'system', content: 'You are a semantic grouping assistant. Return only valid JSON, no markdown.' },
      { role: 'user', content: userPrompt },
    ];

    const payload: any = { model, messages, temperature: 0.1 };
    attachProxyTask(payload, apiUrl, 'semantic_grouping');

    let tokenLimit: number | undefined;
    if (capabilities.supportsMaxCompletionTokens) {
      tokenLimit = 400;
      setTokenLimit(payload, apiUrl, tokenLimit, model);
    }
    if (capabilities.supportsResponseFormat) payload.response_format = { type: 'json_object' };

    logAiRequestStart({ requestId, task: 'semantic_grouping', model, messages, tokenLimit, apiUrl });

    const headers = await buildHeaders(apiUrl, apiKey, requestId);
    const response = await fetchWithTimeout(
      apiUrl,
      { method: 'POST', headers, body: JSON.stringify(payload) },
      15000,
      1,
      1
    );

    if (!response.ok) return empty;

    const data = await parseApiResponse(response, requestId, apiUrl);
    recordDreamAiUsage(undefined, 'semantic_grouping', data, aiResponseMeta(response, requestId));
    const content = extractApiResponseContent(data);

    let jsonStr = content.trim().replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    if (!jsonStr.startsWith('{')) {
      const extracted = extractFirstJsonObject(jsonStr);
      if (!extracted) return empty;
      jsonStr = extracted;
    }

    const parsed = JSON.parse(jsonStr) as Record<string, unknown>;

    const symbolGroupMap: Record<string, string> = {};
    for (const group of (parsed.symbol_groups as any[]) ?? []) {
      const canonical = String(group?.canonical ?? '').trim();
      if (!canonical || !symbolSet.has(canonical)) continue;
      for (const member of (group?.members as string[]) ?? []) {
        if (typeof member === 'string' && symbolSet.has(member) && member !== canonical) symbolGroupMap[member] = canonical;
      }
    }

    const landscapeGroupMap: Record<string, string> = {};
    for (const group of (parsed.landscape_groups as any[]) ?? []) {
      const canonical = String(group?.canonical ?? '').trim();
      if (!canonical || !landscapeSet.has(canonical)) continue;
      for (const member of (group?.members as string[]) ?? []) {
        if (typeof member === 'string' && landscapeSet.has(member) && member !== canonical) landscapeGroupMap[member] = canonical;
      }
    }

    return { symbolGroupMap, landscapeGroupMap };
  } catch (error) {
    logError('ai_group_similar_terms_error', error, { requestId });
    return empty;
  }
}
