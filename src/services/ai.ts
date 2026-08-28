import type { Dream, ChatMessage, Interpretation, DisplayDistillation, CoreMode } from '../types/dream';
import Constants from 'expo-constants';
import { logError, logInfo } from './logger';
import {
  buildDreamExtractionSystemPrompt,
  buildDreamExtractionUserPrompt,
  DREAM_EXTRACTION_TEMPERATURE,
  DREAM_EXTRACTION_TOKEN_LIMIT,
} from '../ai/dreamExtractionPrompt';
import {
  formatArchetypesForEssay,
  MAX_ARCHETYPAL_ECHOES,
  normalizeArchetypalEchoes,
  type ArchetypalEcho,
} from '../ai/archetypalEchoes';
import {
  formatAmplificationsForEssay,
  formatMythicEchoLine,
  MAX_MYTHIC_ECHOES,
  normalizeAmplifications,
  type MythicEcho,
} from '../ai/mythicEchoes';
import { buildDreamExtractionResponseFormat } from '../ai/dreamExtractionResponseFormat';
import {
  buildChatFollowupRequest,
  buildInitialReflectionRequest,
  buildInitialReflectionRetryPrompt,
  END_MARKER_DREAM_READING,
  type DreamReflectionDepth,
} from '../ai/dreamReflectionPrompt';
import { splitReflectionEditorialArc } from '../ai/reflectionEditorialArc';
import {
  normalizeMainTensionAgainstCentralConflicts,
  validateStructuredTaskContent,
} from '../ai/structuredTaskValidation';
import {
  resolveDreamOutputLanguage,
  runOutputLanguageCommitGate,
  validateLanguageRepairFieldMap,
} from '../ai/dreamOutputLanguage';
import {
  parseInterpretiveEchoDiagnostics,
  safeInterpretiveDiagnosticsLog,
} from '../ai/interpretiveEchoDiagnostics';
import {
  asArchetypeEvaluation,
  toPersistedArchetypalEcho,
  validateArchetypalEchoes,
} from '../ai/validators/archetypalEchoValidator';
import {
  closedMythicValidationForDebug,
  toPersistedClosedMythicEcho,
  validateClosedCatalogMythicEchoes,
} from '../ai/validators/mythicCatalogValidator';
import {
  applyMythicAuditProductionInvariant,
  buildMythicEchoPipelineDebugPacket,
} from '../ai/mythicEchoPipelineDebug';
import type { ArchetypeName } from '../constants/archetypes';
import { ARCHETYPE_WHITELIST, normalizeArchetypeList } from '../constants/archetypes';
import { MAX_AI_RESPONSES } from '../constants/interpretation';
import { estimateSimpleTokenCost, USD_TO_EUR_ESTIMATE } from '../billing/aiPricing';
import {
  buildEssayCompressionRetryPrompt,
  buildPeriodReflectionSystemPrompt,
  buildPeriodReflectionUserPrompt,
  buildRecentDreamFieldUserPrompt,
  countRenderedEssayWords,
  END_MARKER_DREAM_ESSAY,
  essayExceedsHardMaximum,
  essayExceedsRetryTolerance,
  ESSAY_COMPRESSION_RETRY_TEMPERATURE,
  getPeriodEssayLengthPolicy,
  PERIOD_REFLECTION_TEMPERATURE,
  RECENT_DREAM_FIELD_LENGTH_POLICY,
  RECENT_DREAM_FIELD_SYSTEM_PROMPT,
  RECENT_DREAM_FIELD_TEMPERATURE,
  type EssayLengthPolicy,
} from '../ai/reflectiveEssayPrompt';
import { buildMetadataFirstEssayContext } from '../ai/reflectiveEssayContext';

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

const VALID_CORE_MODES = new Set<CoreMode>(['Core Tension', 'Core State', 'Core Shift', 'Core Restoration']);

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
  | 'reflective_question_generate'
  | 'reflective_question_validate'
  | 'dream_extraction'
  | 'conversation_element_update'
  | 'pattern_insights'
  | 'pattern_insights_retry_compact'
  | 'semantic_grouping';

const attachProxyTask = (payload: Record<string, unknown>, apiUrl: string, task: AiTask): void => {
  if (supportsProxyTaskRouting(apiUrl)) payload.task = task;
};

const estimateCost = (
  model: unknown,
  promptTokens: number,
  completionTokens: number,
  provider?: string | null
): { usd: number; eur: number; rateKey: string | null; pricingSource?: string } | null => {
  const modelId = typeof model === 'string' ? model : null;
  const cost = estimateSimpleTokenCost(provider ?? null, modelId, promptTokens, completionTokens);
  if (!cost) return null;
  return { usd: cost.usd, eur: cost.eur, rateKey: cost.rateKey, pricingSource: cost.pricingSource };
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
  const cost = estimateCost(model, promptTokens, completionTokens, meta?.provider);
  const stepLabel = DREAM_USAGE_STEP_LABEL[step] ?? step;

  logInfo('ai_step_token_cost', {
    dreamId,
    requestId: meta?.requestId,
    step,
    stepLabel,
    provider: meta?.provider ?? undefined,
    model,
    pricingKey: cost?.rateKey,
    pricingSource: cost?.pricingSource,
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

export type InterpretationDepth = DreamReflectionDepth;

export type GenerateInitialInterpretationOptions = {
  brief?: boolean;
  depth?: InterpretationDepth;
};

type InitialInterpretationRequest = {
  depth: InterpretationDepth;
  messages: ApiMessage[];
  temperature: number;
  tokenLimit: number;
  interpretationStep: AiTask;
};

const buildInitialInterpretationRequest = (
  dream: Dream,
  options?: GenerateInitialInterpretationOptions
): InitialInterpretationRequest => {
  const depth = options?.depth ?? (options?.brief ? 'quick' : 'standard');
  const request = buildInitialReflectionRequest(dream, depth);

  return {
    depth,
    messages: request.messages,
    temperature: request.temperature,
    tokenLimit: request.tokenLimit,
    interpretationStep: request.task,
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
  const retryPrompt = buildInitialReflectionRetryPrompt(depth);

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
  lengthPolicy: EssayLengthPolicy;
}): Promise<string> => {
  const { apiUrl, apiKey, model, originalMessages, requestId, tokenLimit, timeout, lengthPolicy } = params;
  const retryPayload: any = {
    model,
    messages: [...originalMessages, { role: 'system', content: buildEssayCompressionRetryPrompt(lengthPolicy) }],
    temperature: ESSAY_COMPRESSION_RETRY_TEMPERATURE,
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
  const {
    depth,
    messages,
    temperature,
    tokenLimit: configuredTokenLimit,
    interpretationStep,
  } = buildInitialInterpretationRequest(dream, options);
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
      tokenLimit = configuredTokenLimit;
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
      const retryTokenLimit = depth === 'quick' ? 620 : depth === 'advanced' ? 1900 : 1350;
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

    return splitReflectionEditorialArc(content, END_MARKER_DREAM_READING).reading;
  } catch (error) {
    logError('ai_generate_initial_error', error, { requestId, model });
    throw error;
  }
};

const trimConversationHistory = (history: ChatMessage[], maxMessages: number = 12): ChatMessage[] => {
  if (history.length <= maxMessages) return history;
  return history.slice(-maxMessages);
};

export const sendChatMessage = async (
  dream: Dream,
  conversationHistory: ChatMessage[],
  newMessage: string
): Promise<string> => {
  const trimmedHistory = trimConversationHistory(conversationHistory);
  const assistantCount = trimmedHistory.filter((m) => m.role === 'assistant').length;
  const isFinalResponse = assistantCount === MAX_AI_RESPONSES - 1;
  const request = buildChatFollowupRequest({
    dream,
    conversation: trimmedHistory,
    userMessage: newMessage,
    isFinalResponse,
  });
  const messages: ApiMessage[] = request.messages;

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

    const payload: any = { model, messages, temperature: request.temperature };
    attachProxyTask(payload, apiUrl, 'chat_followup');

    let tokenLimit: number | undefined;
    if (capabilities.supportsMaxCompletionTokens) {
      tokenLimit = request.tokenLimit;
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
    ? splitReflectionEditorialArc(aiResponse, END_MARKER_DREAM_READING).reading
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
Do not extract, invent, or return symbols, symbol_stances, landscapes, archetypes, or amplifications.
Use the user's confirmed clarifications; do not treat assistant speculation as ground truth unless the user echoes or grounds it.
Always include explicit status: "no_change" when leaving elements unchanged, or "updated" when revising fields. Bare {} is invalid.
Write revised user-facing string values in the same primary language as the dream. Keep enum keys and whitelisted archetype names in English. Return valid JSON only — no markdown fences or commentary.`;

export type SymbolStance = { symbol: string; stance: string };

const DISPLAY_DOMINANT_LENSES = new Set([
  'image',
  'affect',
  'threshold',
  'relationship',
  'conflict',
  'archetypal',
  'restoration',
  'unclear',
]);

const DISPLAY_ANCHOR_TYPES = new Set([
  'image',
  'feeling',
  'tension',
  'threshold',
  'relationship',
  'archetypal_echo',
]);

const DISPLAY_DREAM_MOVEMENTS = new Set([
  'stuck',
  'approaching',
  'crossing',
  'descending',
  'confronting',
  'hiding',
  'returning',
  'integrating',
  'restoring',
  'unclear',
]);

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

const asNullableString = (value: unknown): string | null => {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text.length > 0 ? text : null;
};

const normalizeEnumValue = (value: unknown): string =>
  String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[-\s]+/g, '_');

const truncateDisplayText = (value: string, max = 140): string => {
  if (value.length <= max) return value;
  return value.slice(0, max).trimEnd() + '…';
};

const displayAnchorKey = (label: string): string =>
  label
    .trim()
    .toLowerCase()
    .replace(/^(the|a|an)\s+/i, '')
    .replace(/[^\p{L}\p{N}\s]/gu, '')
    .replace(/\s+/g, ' ');

const dedupeDisplayAnchors = <T extends { label: string }>(items: T[]): T[] => {
  const seen = new Set<string>();
  const result: T[] = [];
  for (const item of items) {
    const key = displayAnchorKey(item.label);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push(item);
  }
  return result;
};

const parseCoreMode = (value: unknown): CoreMode | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return VALID_CORE_MODES.has(trimmed as CoreMode) ? (trimmed as CoreMode) : null;
};

const asDisplaySalience = (value: unknown): 1 | 2 | 3 | 4 | 5 => {
  const parsed = typeof value === 'number' ? value : parseInt(String(value ?? ''), 10);
  if (parsed >= 5) return 5;
  if (parsed >= 4) return 4;
  if (parsed >= 3) return 3;
  if (parsed >= 2) return 2;
  return 1;
};

const parseDisplayDistillation = (
  value: unknown,
  centralConflicts: string[] = []
): DisplayDistillation | undefined => {
  if (!value || typeof value !== 'object') return undefined;
  const raw = value as Record<string, unknown>;

  const essence_title = asNullableString(raw.essence_title) ?? '';
  const essence_line = asNullableString(raw.essence_line) ?? '';
  const dominantLensRaw = normalizeEnumValue(raw.dominant_lens) || 'unclear';
  const dominant_lens = DISPLAY_DOMINANT_LENSES.has(dominantLensRaw) ? dominantLensRaw : 'unclear';
  const dreamMovementRaw = normalizeEnumValue(raw.dream_movement) || 'unclear';
  const dream_movement = DISPLAY_DREAM_MOVEMENTS.has(dreamMovementRaw) ? dreamMovementRaw : 'unclear';

  const visible_anchors = Array.isArray(raw.visible_anchors)
    ? dedupeDisplayAnchors(
        raw.visible_anchors
          .map((item: unknown) => {
            const anchor = item as Record<string, unknown>;
            const label = asNullableString(anchor?.label) ?? '';
            const typeRaw = normalizeEnumValue(anchor?.type) || 'image';
            const type = DISPLAY_ANCHOR_TYPES.has(typeRaw) ? typeRaw : 'image';
            const ui_meaning = truncateDisplayText(asNullableString(anchor?.ui_meaning) ?? '');
            return {
              label,
              type: type as DisplayDistillation['visible_anchors'][number]['type'],
              salience: asDisplaySalience(anchor?.salience),
              ui_meaning,
            };
          })
          .filter((anchor) => anchor.label.length > 0)
      )
        .slice(0, 5)
    : [];

  const hasDisplayContent =
    essence_title.length > 0 ||
    essence_line.length > 0 ||
    visible_anchors.length > 0 ||
    Boolean(asNullableString(raw.main_tension)) ||
    Boolean(asNullableString(raw.movement_line));

  if (!hasDisplayContent) return undefined;

  return {
    essence_title,
    essence_line,
    dominant_lens: dominant_lens as DisplayDistillation['dominant_lens'],
    visible_anchors,
    main_tension: normalizeMainTensionAgainstCentralConflicts(
      asNullableString(raw.main_tension),
      centralConflicts
    ),
    dream_movement: dream_movement as DisplayDistillation['dream_movement'],
    movement_line: asNullableString(raw.movement_line),
  };
};

export type DreamExtraction = {
  display_distillation?: DisplayDistillation;
  symbols: string[];
  archetypes: ArchetypalEcho[];
  landscapes: string[];
  affects: string[];
  motifs: string[];
  relational_dynamics: string[];
  thresholds: string[];
  central_conflicts: string[];
  core_mode: CoreMode | null;
  amplifications: MythicEcho[];
  symbol_stances: SymbolStance[];
};

const parseDreamExtractionRecord = (parsed: Record<string, unknown>): DreamExtraction => {
  const central_conflicts = asStringArray(parsed.central_conflicts ?? parsed.centralConflicts, 2);
  const display_distillation = parseDisplayDistillation(
    parsed.display_distillation ?? parsed.displayDistillation,
    central_conflicts
  );
  const rawSymbols = asStringArray(parsed.symbols, MAX_SYMBOLS_TOTAL);
  const symbols = filterAffectWords(rawSymbols).slice(0, MAX_SYMBOLS_TOTAL);

  const archetypes = normalizeArchetypalEchoes(parsed.archetypes, MAX_ARCHETYPAL_ECHOES);

  const landscapes = asStringArray(parsed.landscapes, 5);
  const affects = asStringArray(parsed.affects, 4);
  const motifs = asStringArray(parsed.motifs, 4);
  const relational_dynamics = asStringArray(parsed.relational_dynamics, 3);
  const thresholds = asStringArray(parsed.thresholds, 3);
  const core_mode = parseCoreMode(parsed.core_mode);
  const amplifications = normalizeAmplifications(parsed.amplifications, MAX_MYTHIC_ECHOES);

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
    display_distillation,
    symbols,
    archetypes,
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

/** @deprecated Use buildDreamDetailDisplayModel for DreamDetail UI. */
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
    resonance:
      (extraction.amplifications[0] ? formatMythicEchoLine(extraction.amplifications[0]) : undefined) ||
      extraction.motifs[0] ||
      undefined,
  };
};

export const extractDreamSymbolsAndArchetypes = async (
  dream: Dream,
  finalInterpretation: string = ''
): Promise<DreamExtraction> => {
  // Canonical extraction contract lives in src/ai/dreamExtractionPrompt.ts (shared with gateway).
  const extractionPrompt = buildDreamExtractionUserPrompt({
    title: dream.title,
    date: dream.date,
    content: dream.content,
    finalInterpretation,
    // Dev/test feedback loop only — diagnostics stay out of persisted DreamExtraction.
    debugInterpretiveEchoes: typeof __DEV__ !== 'undefined' && __DEV__,
  });

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
      { role: 'system', content: buildDreamExtractionSystemPrompt() },
      { role: 'user', content: extractionPrompt },
    ];

    const payload: any = { model, messages, temperature: DREAM_EXTRACTION_TEMPERATURE };
    attachProxyTask(payload, apiUrl, 'dream_extraction');

    let tokenLimit: number | undefined;
    if (capabilities.supportsMaxCompletionTokens) {
      tokenLimit = DREAM_EXTRACTION_TOKEN_LIMIT;
      setTokenLimit(payload, apiUrl, tokenLimit, model);
    }

    if (capabilities.supportsResponseFormat) {
      payload.response_format = buildDreamExtractionResponseFormat();
    }

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
      const validated = validateStructuredTaskContent('dream_extraction', content, {
        provider: typeof response.headers?.get === 'function' ? response.headers.get('X-AI-Provider') : null,
      });
      if (!validated.ok) {
        logError('ai_extract_json_parse_error', new Error('schema_invalid'), {
          contentLength: content.length,
          schemaErrorCount: validated.schemaErrors.length,
        });
        return emptyDreamExtraction();
      }

      const targetOutputLanguage = resolveDreamOutputLanguage(
        typeof dream.content === 'string' ? dream.content : ''
      );
      const languageGate = await runOutputLanguageCommitGate({
        parsed: validated.data as Record<string, unknown>,
        target: targetOutputLanguage,
        repairOnce: async ({ messages, expectedPaths }) => {
          const repairPayload: any = {
            model,
            messages,
            temperature: DREAM_EXTRACTION_TEMPERATURE,
            response_format: { type: 'json_object' },
            skip_structured_validation: true,
          };
          attachProxyTask(repairPayload, apiUrl, 'dream_extraction');
          if (capabilities.supportsMaxCompletionTokens) {
            setTokenLimit(repairPayload, apiUrl, Math.min(DREAM_EXTRACTION_TOKEN_LIMIT, 1200), model);
          }
          const repairResponse = await fetchWithTimeout(
            apiUrl,
            {
              method: 'POST',
              headers: await buildHeaders(apiUrl, apiKey, requestId, dream.id),
              body: JSON.stringify(repairPayload),
            },
            extractionTimeout,
            1,
            2
          );
          const repairData = await parseApiResponse(repairResponse, requestId, apiUrl);
          if (!repairResponse.ok) return null;
          recordDreamAiUsage(dream.id, 'dream_extraction', repairData, aiResponseMeta(repairResponse, requestId));
          const repairContent = extractApiResponseContent(repairData);
          let parsedRepair: unknown;
          try {
            parsedRepair = JSON.parse(repairContent);
          } catch {
            return null;
          }
          return validateLanguageRepairFieldMap(parsedRepair, expectedPaths);
        },
      });

      if (!languageGate.ok) {
        logError('ai_extract_language_validation_failed', new Error('language_validation_failed'), {
          requestId,
          target_output_language: languageGate.telemetry.target_output_language,
          mismatched_field_paths: languageGate.telemetry.mismatched_field_paths,
          repair_attempted: languageGate.telemetry.repair_attempted,
        });
        return emptyDreamExtraction();
      }

      logInfo('ai_extract_language_commit_gate', {
        requestId,
        ...languageGate.telemetry,
      });

      const rawParsed = languageGate.parsed;
      let rawModelObject: Record<string, unknown> | null = null;
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        try {
          const direct = JSON.parse(content) as unknown;
          if (direct && typeof direct === 'object' && !Array.isArray(direct)) {
            rawModelObject = direct as Record<string, unknown>;
          }
        } catch {
          rawModelObject = null;
        }
      }
      const extraction = parseDreamExtractionRecord(rawParsed);
      // Re-attach mechanism tags / legacy evaluation so hard-gate checks stay index-aligned.
      const archetypesForValidation = (
        Array.isArray(rawParsed.archetypes) ? rawParsed.archetypes : []
      )
        .map((row) => {
          if (!row || typeof row !== 'object') return null;
          const o = row as Record<string, unknown>;
          const expression =
            typeof o.expression === 'string' && o.expression.trim()
              ? o.expression.trim()
              : typeof o.carrier === 'string' && o.carrier.trim()
                ? o.carrier.trim()
                : '';
          const resonance = typeof o.resonance === 'string' ? o.resonance.trim() : '';
          const archetype_id =
            typeof o.archetype_id === 'string' && o.archetype_id.trim() ? o.archetype_id.trim() : '';
          const evaluation = asArchetypeEvaluation(o.evaluation);
          return {
            archetype_id,
            expression,
            resonance,
            ...(evaluation ? { evaluation } : {}),
            ...(o.mechanism_tags !== undefined ? { mechanism_tags: o.mechanism_tags } : {}),
            ...(o.evidence_ids !== undefined ? { evidence_ids: o.evidence_ids } : {}),
            ...(typeof o.confidence === 'string' ? { confidence: o.confidence } : {}),
          };
        })
        .filter((echo): echo is NonNullable<typeof echo> => Boolean(echo))
        .slice(0, MAX_ARCHETYPAL_ECHOES);
      const archetypeValidation = validateArchetypalEchoes(archetypesForValidation, {
        max: MAX_ARCHETYPAL_ECHOES,
        dreamText: typeof dream.content === 'string' ? dream.content : '',
      });
      extraction.archetypes = archetypeValidation.accepted.map(toPersistedArchetypalEcho);

      const normalizedAmplificationsBeforeValidation = [...extraction.amplifications];
      const closedMythicValidation = validateClosedCatalogMythicEchoes(
        Array.isArray(rawParsed.amplifications) ? rawParsed.amplifications : [],
        {
          dreamText: typeof dream.content === 'string' ? dream.content : '',
          max: MAX_MYTHIC_ECHOES,
        }
      );
      const mythicValidation = closedMythicValidationForDebug(closedMythicValidation);
      const postValidationAmplifications = closedMythicValidation.accepted.map(
        toPersistedClosedMythicEcho
      );
      extraction.amplifications = postValidationAmplifications;

      // Diagnostics are never part of DreamExtraction / Dream Detail UI.
      const diagnostics = parseInterpretiveEchoDiagnostics(
        rawModelObject?.interpretive_diagnostics ?? rawParsed.interpretive_diagnostics
      );

      if (__DEV__) {
        const enforced = applyMythicAuditProductionInvariant({
          diagnostics,
          amplifications: extraction.amplifications,
          enforce: true,
        });
        extraction.amplifications = enforced.amplifications;
        const mythicPipelineDebug = buildMythicEchoPipelineDebugPacket({
          rawModelObject,
          parsedAmplifications: rawParsed.amplifications ?? null,
          normalizedBeforeValidation: normalizedAmplificationsBeforeValidation,
          mythicValidation,
          postValidationAmplifications,
          diagnostics,
          invariantClearedAmplifications: enforced.cleared,
        });
        console.log('[AI] Extracted:', {
          symbolsCount: extraction.symbols.length,
          archetypesCount: extraction.archetypes.length,
          landscapesCount: extraction.landscapes.length,
          affectsCount: extraction.affects.length,
          motifsCount: extraction.motifs.length,
          thresholdsCount: extraction.thresholds.length,
          centralConflictsCount: extraction.central_conflicts.length,
          symbol_stancesCount: extraction.symbol_stances.length,
          displayAnchorsCount: extraction.display_distillation?.visible_anchors.length ?? 0,
          core_mode: extraction.core_mode,
          amplificationsCount: extraction.amplifications.length,
          archetypesRejected: archetypeValidation.rejected.length,
          mythicRejected: mythicValidation.rejected.length,
          ...safeInterpretiveDiagnosticsLog(diagnostics),
        });
        console.log('[AI][DEBUG] mythic_echo_pipeline', mythicPipelineDebug);
        if (diagnostics) {
          console.log('[AI][DEBUG] interpretive_echoes_diagnostics', diagnostics);
        }
        if (!enforced.consistency.ok) {
          console.error('[AI][DEBUG] mythic_audit_production_invariant_failed', {
            ...enforced.consistency,
            note: 'Cleared mismatched production amplifications in debug; did not rewrite title/tradition.',
          });
        }
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
    display_distillation: undefined,
    symbols: [],
    archetypes: [],
    landscapes: [],
    affects: [],
    motifs: [],
    relational_dynamics: [],
    thresholds: [],
    central_conflicts: [],
    core_mode: null,
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
  core_mode: interpretation.core_mode ?? null,
  amplifications: normalizeAmplifications(interpretation.amplifications ?? [], MAX_MYTHIC_ECHOES),
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
  const archetypes = normalizeArchetypalEchoes(current.archetypes, MAX_ARCHETYPAL_ECHOES);

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
    // Mythic Echoes remain closed-catalog extraction output. Follow-up chat
    // cannot create an open-world myth row or revise the selected catalog echo.
    amplifications: normalizeAmplifications(current.amplifications, MAX_MYTHIC_ECHOES),
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
  const currentMutable = {
    affects: current.affects,
    motifs: current.motifs,
    relational_dynamics: current.relational_dynamics,
    thresholds: current.thresholds,
    central_conflicts: current.central_conflicts,
    core_mode: current.core_mode,
  };
  const prompt = `Review this dream follow-up conversation and revise the extracted elements used for long-term pattern reports.

Dream title: ${dream.title || 'Untitled'}
Dream date: ${dream.date}

Dream text:
${dream.content}

Current mutable elements:
${JSON.stringify(currentMutable)}

Follow-up conversation:
${conversationForExtractionPrompt(conversation)}

Rules:
- Return the full revised values for these fields only: affects, motifs, relational_dynamics, thresholds, central_conflicts, core_mode.
- central_conflicts: at most 2 items; use [] unless the conversation clearly grounds opposing pressures. Avoid generic "X vs Y" pairs without concrete dream support.
- Do NOT return or revise key symbols, symbol_stances, or landscapes. Key symbols must remain grounded in the original dream text only.
- Do NOT return or revise archetypes in follow-up chat. Archetypes are extracted once from the raw dream metadata pass and stay frozen during follow-up.
- Do NOT return or revise amplifications. Mythic Echoes are selected only by the closed-catalog raw-dream extraction path and stay frozen during follow-up.
- Use the user's follow-up clarifications to update or add symbolic motifs, inner structures, affects, relational dynamics, thresholds, and conflicts.
- Do not add elements from assistant speculation unless the user confirms or clearly grounds them.
- Keep fabric pattern strings concise and suitable for pattern tracking. Write user-facing echo text in the dream's primary language.
- core_mode must be exactly one of: Core Tension, Core State, Core Shift, Core Restoration.
- If the conversation does not clarify a field, keep the current value.

Return ONLY one valid JSON object with an explicit status:
- If nothing should change: {"status":"no_change"}
- If revising elements: {"status":"updated","affects":[...],"motifs":[...],"relational_dynamics":[...],"thresholds":[...],"central_conflicts":[...],"core_mode":"Core State"}
Bare {} is invalid.`;

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
    const validated = validateStructuredTaskContent('conversation_element_update', content, {
      provider: typeof response.headers?.get === 'function' ? response.headers.get('X-AI-Provider') : null,
    });
    if (!validated.ok) {
      logError('ai_conversation_element_update_schema_invalid', new Error('schema_invalid'), {
        requestId,
        model,
        schemaErrorCount: validated.schemaErrors.length,
        repairAttempted: validated.log.repairAttempted,
      });
      return interpretation;
    }

    const parsed = validated.data as Record<string, unknown>;
    if (parsed.status === 'no_change') {
      logInfo('ai_conversation_element_update_no_change', { requestId, model });
      return interpretation;
    }

    const updates: Partial<ConversationElementFields> = {
      affects: asStringArray(parsed.affects, 5),
      motifs: asStringArray(parsed.motifs, 6),
      relational_dynamics: asStringArray(parsed.relational_dynamics, 4),
      thresholds: asStringArray(parsed.thresholds, 4),
      central_conflicts: asStringArray(parsed.central_conflicts ?? parsed.centralConflicts, 2),
      core_mode: parseCoreMode(parsed.core_mode),
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
      core_mode: merged.core_mode ?? undefined,
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

export type PatternInsightDreamEntry = {
  dreamId: string;
  date: string;
  extracted: DreamExtraction;
  interpretation: string;
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

  const context = buildMetadataFirstEssayContext(
    dreamAnalyses.map((d) => ({
      date: d.date,
      coreMode: d.extracted.core_mode ?? '',
      affects: d.extracted.affects ?? [],
      symbols: d.extracted.symbols ?? [],
      symbolStances: (d.extracted.symbol_stances ?? []).map((stance) => `${stance.symbol}: ${stance.stance}`),
      landscapes: d.extracted.landscapes ?? [],
      motifs: d.extracted.motifs ?? [],
      relationalDynamics: d.extracted.relational_dynamics ?? [],
      thresholds: d.extracted.thresholds ?? [],
      centralConflicts: d.extracted.central_conflicts ?? [],
      archetypalEchoes: formatArchetypesForEssay(d.extracted.archetypes),
      mythicEchoes: formatAmplificationsForEssay(d.extracted.amplifications),
      interpretation: d.interpretation,
    })),
    'period'
  );

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

  const lengthPolicy = getPeriodEssayLengthPolicy(dreamAnalyses.length);
  const userPrompt = buildPeriodReflectionUserPrompt({
    scope: period,
    startDate: dreamAnalyses[0]?.date,
    endDate: dreamAnalyses[dreamAnalyses.length - 1]?.date,
    dreamCount: dreamAnalyses.length,
    context,
    languageInstruction: langInstruction,
  });

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
      { role: 'system', content: buildPeriodReflectionSystemPrompt(period, dreamAnalyses.length) },
      { role: 'user', content: userPrompt },
    ];

    const payload: any = { model, messages, temperature: PERIOD_REFLECTION_TEMPERATURE };
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

    const initialIncomplete =
      isTruncatedResponse(data) || !content.trim() || !hasEndMarker(content, END_MARKER_DREAM_ESSAY);
    const initialTooLong = essayExceedsHardMaximum(content, lengthPolicy, language);
    if (initialIncomplete || initialTooLong) {
      const retryTokenLimit = dreamAnalyses.length >= 5 ? 1700 : dreamAnalyses.length >= 2 ? 1300 : 850;
      content = await retryCompressedPatternEssay({
        apiUrl,
        apiKey,
        model,
        originalMessages: messages,
        requestId,
        tokenLimit: retryTokenLimit,
        timeout: capabilities.defaultTimeout,
        lengthPolicy,
      });
      const retryWordCount = countRenderedEssayWords(content, language);
      logInfo('ai_pattern_essay_compact_retry_result', {
        essayKind: 'period',
        retryReason: initialIncomplete ? 'incomplete' : 'length_overflow',
        wordCount: retryWordCount,
        hardMaximum: lengthPolicy.hardMaximum,
        retryToleranceCeiling: lengthPolicy.retryToleranceCeiling,
        beyondTolerance: essayExceedsRetryTolerance(content, lengthPolicy, language),
      });
    }

    return stripEndMarker(content, END_MARKER_DREAM_ESSAY);
  } catch (error) {
    logError('ai_pattern_insights_error', error, { requestId, model });
    throw error;
  }
};

export const generateRecentDreamFieldReflection = async (
  dreamAnalyses: PatternInsightDreamEntry[],
  language: string = 'en'
): Promise<string> => {
  if (dreamAnalyses.length === 0) {
    if (language === 'el') {
      return 'Δεν υπάρχουν ερμηνευμένα όνειρα για πρόσφατη αντανάκλαση. Χρειάζονται τουλάχιστον 2 καταχωρήσεις.';
    }
    return 'No interpreted dreams are available for a recent reflection. Reflect on at least 2 dreams first.';
  }

  const context = buildMetadataFirstEssayContext(
    dreamAnalyses.map((d) => ({
      date: d.date,
      coreMode: d.extracted.core_mode ?? '',
      affects: d.extracted.affects ?? [],
      symbols: d.extracted.symbols ?? [],
      symbolStances: (d.extracted.symbol_stances ?? []).map((stance) => `${stance.symbol}: ${stance.stance}`),
      landscapes: d.extracted.landscapes ?? [],
      motifs: d.extracted.motifs ?? [],
      relationalDynamics: d.extracted.relational_dynamics ?? [],
      thresholds: d.extracted.thresholds ?? [],
      centralConflicts: d.extracted.central_conflicts ?? [],
      archetypalEchoes: formatArchetypesForEssay(d.extracted.archetypes),
      mythicEchoes: formatAmplificationsForEssay(d.extracted.amplifications),
      interpretation: d.interpretation,
    })),
    'recent'
  );

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

  const userPrompt = buildRecentDreamFieldUserPrompt({
    dreamCount: dreamAnalyses.length,
    context,
    languageInstruction: langInstruction,
  });

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
      { role: 'system', content: RECENT_DREAM_FIELD_SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ];

    const payload: any = { model, messages, temperature: RECENT_DREAM_FIELD_TEMPERATURE };
    attachProxyTask(payload, apiUrl, 'pattern_insights');

    let tokenLimit: number | undefined;
    if (capabilities.supportsMaxCompletionTokens) {
      tokenLimit = 1400;
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
      logError('ai_recent_dream_field_api_error', new Error(rawError), { requestId, model, status: response.status });
      throw new Error(userSafeError(response.status, apiUrl));
    }

    recordDreamAiUsage(undefined, 'pattern_insights', data, aiResponseMeta(response, requestId));

    let content = extractApiResponseContent(data, { allowTruncated: true });

    const initialIncomplete =
      isTruncatedResponse(data) || !content.trim() || !hasEndMarker(content, END_MARKER_DREAM_ESSAY);
    const initialTooLong = essayExceedsHardMaximum(
      content,
      RECENT_DREAM_FIELD_LENGTH_POLICY,
      language
    );
    if (initialIncomplete || initialTooLong) {
      content = await retryCompressedPatternEssay({
        apiUrl,
        apiKey,
        model,
        originalMessages: messages,
        requestId,
        tokenLimit: 1100,
        timeout: capabilities.defaultTimeout,
        lengthPolicy: RECENT_DREAM_FIELD_LENGTH_POLICY,
      });
      const retryWordCount = countRenderedEssayWords(content, language);
      logInfo('ai_pattern_essay_compact_retry_result', {
        essayKind: 'recent',
        retryReason: initialIncomplete ? 'incomplete' : 'length_overflow',
        wordCount: retryWordCount,
        hardMaximum: RECENT_DREAM_FIELD_LENGTH_POLICY.hardMaximum,
        retryToleranceCeiling: RECENT_DREAM_FIELD_LENGTH_POLICY.retryToleranceCeiling,
        beyondTolerance: essayExceedsRetryTolerance(
          content,
          RECENT_DREAM_FIELD_LENGTH_POLICY,
          language
        ),
      });
    }

    return stripEndMarker(content, END_MARKER_DREAM_ESSAY);
  } catch (error) {
    logError('ai_recent_dream_field_error', error, { requestId, model });
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

    const validated = validateStructuredTaskContent('semantic_grouping', content, {
      provider: typeof response.headers?.get === 'function' ? response.headers.get('X-AI-Provider') : null,
    });
    if (!validated.ok) {
      logError('ai_semantic_grouping_schema_invalid', new Error('schema_invalid'), {
        requestId,
        model,
        schemaErrorCount: validated.schemaErrors.length,
      });
      return empty;
    }

    const parsed = validated.data as Record<string, unknown>;

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
