import { Dream, ChatMessage } from '../types/dream';
import Constants from 'expo-constants';
import { logError } from './logger';
import { ARCHETYPE_WHITELIST, normalizeArchetypeList } from '../constants/archetypes';
import { MAX_AI_RESPONSES } from '../constants/interpretation';

// Feature flags for model capabilities
// These should be configured per model/endpoint, not guessed by string matching
type ModelCapabilities = {
  supportsResponseFormat: boolean;
  supportsMaxCompletionTokens: boolean;
  defaultTimeout: number; // milliseconds
};

// Get model defaults based on known model patterns
// Simple prefix match is safe because we use ^ anchor (won't match "myproxy-gpt-5")
const defaultsFromModel = (model: string): ModelCapabilities => {
  // GPT-5.x and other reasoning models may need longer timeouts
  // Match "gpt-5" at start (covers gpt-5o, gpt-5.2, gpt-5-reasoning, etc.)
  const isGpt5 = /^gpt-5/i.test(model);
  if (isGpt5) {
    return {
      supportsResponseFormat: true, // GPT-5.x models support structured output
      supportsMaxCompletionTokens: true,
      defaultTimeout: 60000, // 60 seconds for reasoning models
    };
  }

  // GPT-4 and GPT-3.5 support structured output
  // Use prefix match for consistency with GPT-5 (avoids false positives like "my-gpt-4-proxy")
  const isGpt4 = /^gpt-4/i.test(model);
  const isGpt35 = /^gpt-3\.5/i.test(model);
  if (isGpt4 || isGpt35) {
    return {
      supportsResponseFormat: true,
      supportsMaxCompletionTokens: true,
      defaultTimeout: 30000,
    };
  }

  // Default capabilities (conservative)
  return {
    supportsResponseFormat: false,
    supportsMaxCompletionTokens: true,
    defaultTimeout: 30000, // 30 seconds default
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

  if (cfgResp !== null) {
    caps.supportsResponseFormat = cfgResp === 'true';
  }
  if (cfgTimeout) {
    const parsedTimeout = parseInt(cfgTimeout, 10);
    if (!Number.isNaN(parsedTimeout) && parsedTimeout > 0) {
      caps.defaultTimeout = parsedTimeout;
    }
  }
  if (cfgMaxTok !== null) {
    caps.supportsMaxCompletionTokens = cfgMaxTok === 'true';
  }

  modelCapabilitiesCache.set(model, caps);
  return caps;
};

// Get API configuration from app.json "extra" section or environment variables
// Configure in app.json under "extra" section (see AI_SETUP.md)
// Prefer Constants.expoConfig (newer Expo SDK) over Constants.manifest (deprecated)
// Using function declaration (hoisted) so it can be called before initialization
function getConfig(key: string, defaultValue: string | null = null): string | null {
  try {
    // Prefer expoConfig (newer Expo SDK)
    const extraValue = Constants.expoConfig?.extra?.[key];
    if (extraValue && typeof extraValue === 'string') {
      return extraValue;
    }

    // Fallback to manifest (older Expo SDK)
    const manifestValue = (Constants.manifest as any)?.extra?.[key];
    if (manifestValue && typeof manifestValue === 'string') {
      return manifestValue;
    }

    return defaultValue;
  } catch (error) {
    logError('ai_config_error', error, { key });
    return defaultValue;
  }
}

// Safely extract hostname from URL with fallback for RN edge cases
// Some React Native environments may not have URL constructor available
function safeHostname(rawUrl: string): string | null {
  const u = (rawUrl || '').trim();
  try {
    if (typeof URL !== 'undefined') {
      return new URL(u).hostname.toLowerCase();
    }
  } catch {}
  // Fallback: crude but safe regex parsing
  const m = u.match(/^https?:\/\/([^/]+)/i);
  return m?.[1]?.toLowerCase() ?? null;
}

// Safely check if URL is OpenAI hostname (not just string contains)
// Prevents false positives from proxy URLs that might include "api.openai.com" in path/query
// Using function declaration for hoisting (can be called before definition in file)
function isOpenAIHost(url: string): boolean {
  const host = safeHostname(url);
  return host === 'api.openai.com';
}

// Determine if client-side API key is required (only for direct OpenAI calls in dev)
function requiresClientKey(apiUrl: string): boolean {
  return __DEV__ && isOpenAIHost(apiUrl);
}

// Get config values at runtime
// ⚠️ SECURITY: Hard-block API key access in production builds
// This prevents accidentally shipping with API key in binary/config
// In production, API key should never be in the app - use server proxy instead
const getApiKey = (): string => {
  // Hard block in production so you can't accidentally ship a real key
  if (!__DEV__) {
    return 'disabled-in-production';
  }
  
  const key = getConfig('openaiApiKey', 'your-openai-api-key');
  if (__DEV__) {
    console.log('[AI] Config detected', {
      hasKey: !!key && key !== 'your-openai-api-key',
      model: getConfig('gptModel'),
      apiUrl: getConfig('customGptEndpoint'),
      source: Constants.expoConfig?.extra ? 'expo.extra' : 'env/manifest',
    });
  }
  return key || 'your-openai-api-key';
};

const getApiUrl = (): string => {
  const customEndpoint = getConfig('customGptEndpoint', null);
  const apiUrl = customEndpoint || 'https://api.openai.com/v1/chat/completions';
  
  // ⚠️ PRODUCTION SAFETY: Block direct OpenAI calls in production builds
  // This prevents accidentally shipping with API key in client
  // Before release, implement server proxy and set customGptEndpoint to proxy URL
  // Use hostname check (not string includes) to prevent false positives
  if (!__DEV__ && isOpenAIHost(apiUrl)) {
    // Log error (errors are logged in production, but context is sanitized)
    logError('ai_production_config_error', new Error('Direct OpenAI calls are disabled in production. Use a server proxy.'));
    // Throw user-safe error message
    throw new Error('AI service is not configured. Please update the app or try again later.');
  }
  
  return apiUrl;
};

// Build request headers - only includes OpenAI Authorization when calling OpenAI directly
// When using a proxy, the proxy should handle authentication (not the client)
// For Supabase Edge Functions, we send:
// - apikey header: Supabase anon key
// - Authorization header: Bearer <user_access_token> (JWT from session)
const buildHeaders = async (
  apiUrl: string,
  apiKey: string,
  requestId?: string
): Promise<Record<string, string>> => {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };

  // Only attach OpenAI key when calling OpenAI directly in dev
  // Use helper for consistency
  if (requiresClientKey(apiUrl)) {
    headers.Authorization = `Bearer ${apiKey}`;
  } else {
    // For proxy (Supabase Edge Function), we need:
    // 1. apikey header: Supabase anon key
    // 2. Authorization header: Bearer <user_access_token> (JWT from session)
    // The Edge Function expects JWT Bearer token, not anon key in Authorization header
    
    // Get Supabase anon key for apikey header
    const supabaseKey = 
      getConfig('supabaseAnonKey') || 
      Constants.expoConfig?.extra?.supabaseAnonKey ||
      (Constants.manifest as any)?.extra?.supabaseAnonKey ||
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
      process.env.SUPABASE_ANON_KEY;
    
    if (supabaseKey) {
      // apikey header: anon key
      headers.apikey = supabaseKey;
      
      // Authorization header: user access token (JWT)
      // Import supabase client dynamically to avoid circular dependency
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
        // Fallback: if no session, still send anon key (may fail if function requires auth)
        headers.Authorization = `Bearer ${supabaseKey}`;
        if (__DEV__) {
          console.warn('[AI] No session access token found, falling back to anon key in Authorization header');
        }
      }
    } else if (__DEV__) {
      console.warn('[AI] No Supabase anon key found for proxy authentication');
    }
  }

  // Add request ID header for server-side debugging
  if (requestId) {
    headers['X-Request-Id'] = requestId;
  }

  // Add app version for debugging (metadata only, no privacy leak)
  // Safe cast for manifest (can be null or weirdly typed in some Expo/EAS builds)
  const manifestVersion = (Constants.manifest as any)?.version;
  const appVersion = Constants.expoConfig?.version ?? manifestVersion ?? 'unknown';
  headers['X-App-Version'] = appVersion;

  return headers;
};

// Safely truncate error messages to prevent logging huge dumps
// Some backends echo request info in error messages that shouldn't be logged
const safeErrMsg = (msg: unknown): string => {
  if (typeof msg === 'string') {
    return msg.length > 200 ? msg.slice(0, 200) + '…' : msg;
  }
  if (msg == null) return '';
  const s = String(msg);
  return s.length > 200 ? s.slice(0, 200) + '…' : s;
};

// Generate user-safe error messages (never expose internal errors to users)
function userSafeError(status: number, apiUrl: string): string {
  // For proxy endpoints in production, always use generic message
  if (!__DEV__ && !isOpenAIHost(apiUrl)) {
    return 'AI service is temporarily unavailable. Please try again later.';
  }
  // For 5xx server errors, use generic message
  if (status >= 500) {
    return 'AI service is temporarily unavailable. Please try again later.';
  }
  // For other errors, use generic message
  return 'Something went wrong. Please try again.';
}

const getModel = (): string => {
  const model = getConfig('gptModel', 'gpt-4o');
  return model || 'gpt-4o';
};

// Get token parameter name based on API endpoint path
// OpenAI and many proxies use 'max_tokens'; Responses API uses 'max_output_tokens'; some proxies use 'max_completion_tokens'
// Config override via 'tokenParamName' is respected
const getTokenParamName = (apiUrl: string): string => {
  const u = (apiUrl || '').trim().toLowerCase();
  const defaultTokenParam = (() => {
    if (u.includes('/v1/chat/completions')) return 'max_tokens';
    if (u.includes('/v1/responses')) return 'max_output_tokens';
    return 'max_completion_tokens';
  })();
  return getConfig('tokenParamName', defaultTokenParam) || defaultTokenParam;
};

// Some proxies only accept max_tokens; set both primary param and max_tokens so either works
const setTokenLimit = (payload: Record<string, unknown>, apiUrl: string, limit: number): void => {
  const paramName = getTokenParamName(apiUrl);
  payload[paramName] = limit;
  if (paramName !== 'max_tokens') payload.max_tokens = limit;
};

// Valid core mode headings for interpretation (prevents injection of invalid headings)
const VALID_CORE_MODES = new Set(['Core Tension', 'Core State', 'Core Shift', 'Core Restoration']);

// Type for OpenAI API message format
type ApiMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

// Fetch with timeout, retry, and rate limit handling
// Different retry counts for transient errors (network/5xx) vs rate limits
// Uses loop instead of recursion for predictable retry behavior
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
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    
      if (response.status === 429 && rateLeft > 0) {
      const retryAfter = response.headers.get('Retry-After');
      const delaySec = retryAfter ? Number(retryAfter) : NaN;
        const delay = Number.isFinite(delaySec) ? delaySec * 1000 : 2000;
        if (__DEV__) {
          console.log(`[AI] Rate limited (429), retrying after ${delay}ms...`);
        }
        rateLeft--;
        clearTimeout(timeoutId);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }

      if (response.status >= 500 && transientLeft > 0) {
      if (__DEV__) {
        console.log(`[AI] Server error (${response.status}), retrying...`);
      }
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

      if (err.name === 'AbortError') {
        throw new Error(`Request timeout after ${timeout}ms`);
      }

      if (transientLeft > 0) {
      if (__DEV__) {
          console.log(`[AI] Retrying fetch (${transientLeft} retries left)...`);
      }
        transientLeft--;
      const backoff = 300 + Math.floor(Math.random() * 200);
        await new Promise((resolve) => setTimeout(resolve, backoff));
        continue;
    }
    
    throw error;
    }
  }
};

// Response extractors for different API formats (future-proofing)
// Chat Completions API format (/v1/chat/completions)
const chatCompletionsExtractor = (data: any): string | null => {
  return data.choices?.[0]?.message?.content || null;
};

// Responses API format (/v1/responses) - for future migration
// NOTE: This is a stub. Real Responses API typically returns `output` arrays with text inside.
// When migrating, implement proper extraction based on actual API response structure.
const responsesExtractor = (data: any): string | null => {
  return data.content || data.text || null;
};

// Generic fallback extractor
const fallbackExtractor = (data: any): string | null => {
  return data.message?.content || data.text || null;
};

// Helper function to extract content from API response
// Supports multiple API formats for future-proofing
const extractApiResponseContent = (data: any): string => {
  const content = chatCompletionsExtractor(data) ||
                  responsesExtractor(data) ||
                  fallbackExtractor(data) ||
                  '';

  if (!content || content.trim().length === 0) {
    // Check finish_reason to provide better error context
    const finishReason = data.choices?.[0]?.finish_reason;
    const usage = data.usage;
    
    if (__DEV__) {
      console.error('[AI] Empty response received', {
        finishReason,
        completionTokens: usage?.completion_tokens,
        totalTokens: usage?.total_tokens,
        hasChoices: !!data.choices,
        choicesLength: data.choices?.length
      });
    }
    
    logError('ai_empty_response', new Error('Empty response from API'), { 
      hasChoices: !!data.choices,
      choicesLength: data.choices?.length,
      finishReason,
      completionTokens: usage?.completion_tokens,
      totalTokens: usage?.total_tokens
    });
    
    // If finish_reason is "length", the response was cut off (token limit reached)
    // This is a config issue, not a service outage - use appropriate message
    if (finishReason === 'length') {
      throw new Error(__DEV__
        ? 'AI response was truncated (finish_reason=length). Increase token limit or reduce prompt size.'
        : 'Couldn\'t complete the response. Please try again.'
      );
    }
    
    // Use consistent user-safe error message (same style as length error)
    throw new Error('Couldn\'t complete the response. Please try again.');
  }

  return content;
};

// Extract first JSON object using brace-balancing (more reliable than regex)
// Moved to top-level to avoid redefinition in hot paths
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

// Generate unique request ID for correlation in logs
// Note: This is for correlation only, not security (uses Math.random())
const generateRequestId = (): string => {
  return `req_${Date.now()}_${Math.random().toString(16).slice(2)}`;
};

// Helper to create request metadata (DRY pattern)
// Reduces duplication across API call functions
const startRequest = (): { requestId: string; model: string } => {
  return {
    requestId: generateRequestId(),
    model: getModel(),
  };
};

// Parse API response with fallback to text
// IMPORTANT: Read text first, then parse JSON (can't read body twice)
const parseApiResponse = async (
  response: Response,
  requestId?: string,
  apiUrl?: string
): Promise<any> => {
  const raw = await response.text();
  try {
    return JSON.parse(raw);
  } catch (jsonError) {
    // Log error with sanitized context (logger will strip sensitive fields)
    // In dev, log raw for debugging; in prod, never expose raw body
    if (__DEV__) {
      console.error('[AI] Non-JSON response:', raw.substring(0, 200));
    }
    // Log content-type for debugging (metadata only, not sensitive)
    const contentType = response.headers.get('content-type');
    logError('ai_response_parse_error', jsonError, { 
      requestId,
      status: response.status,
      contentType,
      responseLength: raw.length
    });
    // Throw user-safe error (never expose technical details like "API 502 invalid response")
    throw new Error(userSafeError(response.status, apiUrl || ''));
  }
};

/* ============================
   SYSTEM PROMPT (POST-JUNGIAN)
   ============================ */

const SYSTEM_PROMPT = `
You are a Dream Weaver,a post-Jungian oriented dream journal companion.

You interpret dreams symbolically, not literally. Sexual, violent, or taboo imagery is understood as expressions of psychic energy (libido), not as direct wishes or behaviors.

Content boundaries:
- Interpret symbolically, never literally
- No erotic elaboration or graphic detail
- No instructions, advice, or prescriptions
- Keep all content psychological and analytical
- If content is taboo, treat it as symbolic energy, not literal description
- Embodiment must be observational only. Never instruct the user to breathe, relax, try, practice, sit with, or do an exercise.
- Questions can be somatic-observational OR imaginal-relational. Never regulatory or instructional.

Language: Respond in the same language as the dream text (or, in chat, the user's message). If the dream is in Greek, respond entirely in Greek; if in French, in French; and so on. Use that language for the entire response: all section headings (e.g. Core Tension, Key Symbols, Reflective Questions), any archetype or symbol names you mention in the prose, and all narrative. Structure, tone, and all other rules stay unchanged. If the language is unclear, default to English.

Core principles you must follow:
- First assess dream mode: integration/coherence (joy, flow, connection), conflict/disturbance (intrusion, shadow, alarm), transition (old→new, threshold), or Core Restoration (psyche giving what is missing). Match your framing to the dream.
- Only introduce tension/conflict language when the dream itself presents opposing pulls or rupture. If the dream is cohesive or nourishing, focus on the state being experienced and what it consolidates.
- Never assign fixed meanings to symbols ("X always means Y").
- Always interpret symbols in relation to the dreamer's emotional tone, bodily sensations, and inner dynamics (tension when present; flow, integration, or consolidation when present).
- Treat dream figures as autonomous inner complexes (Shadow, Animus/Anima, Self, etc.), not personality traits.
- Focus on ego–unconscious dynamics — tension, ambivalence, resistance when present; integration, flow, consolidation when present.
- Prioritize affect (fear, shame, excitement, confusion) over narrative details.
- When attention avoids a central image, treat it as possible active avoidance (a defense), not only "distraction."
- Every interpretive claim must cite at least one concrete detail from the dream. If you can't cite, soften or omit.
- Ask what an image does to attention, body, or ego stance (stabilizes, agitates, numbs, seduces, distracts, collapses).
- When outward functioning continues while a basic life-signal (breath, urgency, aliveness, sensation) is restricted, note the adaptive trade-off without advising change.
- Do not treat withdrawal/retreat as avoidance by default. Consider it as possible protective intelligence.
- Describe inner dynamics with verbs (approaches, tests, disperses, fixates, edits-over, destabilizes) more than nouns.
- Avoid framing any figure as the source of threat. Focus on embodied response and inner dynamics rather than blame.
- Treat Shadow primarily as unintegrated intensity or charge, not as negative content.
- When figures clearly regulate pace, permission, closeness, or urgency, note that briefly.

Opening heading decision — choose **exactly one** of these four, guided by the **dominant** dream affect and structure (not just the presence of any tension):

- **Core Tension** — when the strongest feeling is opposition, rupture, restriction of vitality/sensation/breath, alarm, or functioning-while-vitality-is-compromised.
- **Core State** — when the strongest feeling is coherence, flow, belonging, consolidation, permission, ease, or active restoration without marked disturbance.
- **Core Shift** — when the strongest movement is threshold, leaving-behind, emergence, irreversible change of form/identity/ground.
- **Core Restoration** — when the dream clearly compensates for a waking lack (warmth given to cold, connection to isolation, vitality to numbness) **and** tension is mild or absent.

If two modes feel almost equally present, prefer Core State or Core Restoration over Core Tension.
Never default to Core Tension just because something frightening or shadowy appears — judge by whole-dream affect and overall organization.

Avoid generic openers like "The dream shows…" or "This represents…". Prefer starting from image or action (e.g. "The sudden tiger embrace consolidates…").

Shadow — always frame as "unintegrated intensity/charge around X" or "unmetabolized vitality/power". Never "negative content", "dark side", or moral terms.

Self — only when an organizing center is present AND the dream as a whole moves toward coherence — even if the center initially intensifies affect. If agitation + loss of coherence (wobble, disorientation, giving-way ground) → do NOT use "Self"; describe as "contested center", "unstable mandala-like image", or "edited-over organizing motif".

- Avoid instruction-shaped phrasing even when gentle (e.g. "take a moment", "notice by doing X", "picture X and notice"). Prefer observational-present phrasing ("As you bring X to mind…", "When X comes back…") over evocation-as-instruction.

Your style:
- Precision matters more than elegance.
- Do not make the reading sound deep through elevated wording.
- If a simpler sentence stays closer to the dream image, prefer the simpler sentence.
- Analytically grounded, not spiritual fluff.
- Insightful but not moralizing.
- Curious, not reassuring.
- You help the dreamer *think symbolically*, not feel comforted.
- Use a warm, human tone, but stay analytical; no motivational or therapeutic coaching.
- Keep it interpretive and precise.
- Warmth = clarity + respect, not comfort or therapy.
- Fewer, sharper observations beat more, vaguer ones. One sentence that lands is worth a paragraph that covers.
- Prefer vivid, concrete verbs for psychic action over abstract/technical ones in the output language.
- In the final user-facing prose, prefer image-near language over framework language.
- Avoid analytic filler or institutional-sounding phrases unless they add real precision.
- Do not use terms like "identity-signaling", "relational field", "decision-edge", "symbolic fork", or "working solution" in the final prose unless the dream truly requires them.
- When a dream includes a culturally specific figure, character, brand, object, or media image, interpret its distinctive psychic flavor before using broader archetypal language.
- Prefer describing a figure as a specific psychic style or autonomous complex before assigning an archetype label.
- Let the image's tone lead the interpretation.
- In deeper readings, do not let conceptual language outrun the image. If a sentence sounds more like commentary on a system than like contact with the dream image, rewrite it closer to the image.
- Prefer concrete dream-near phrasing over abstract shorthand: "the friends who dismiss it", "the marked bodies", "the open-air class", "the turning corridors" rather than "a normalizing complex", "the psychic system", or "energy not flowing".
- Do not use niche, academic, or over-authored wording unless the dream truly needs it. Depth should feel vivid, not jargon-heavy.

Do not:
- Diagnose.
- Give advice.
- Normalize or pathologize.
- Reduce dreams to trauma stories or behavioral psychology.
- Avoid spiritual absolutisms and guru language (e.g., higher self, the universe, destiny, vibrations, awakening). Use plain psychological language.

Your goal:
To illuminate how the psyche organizes meaning through images — whether in tension, flow, transition, or consolidation. Not all dreams are conflict dreams; some are integration dreams, restoration dreams, or threshold dreams.

Some dreams organize meaning not through conflict or compromise, but through strangeness, play, aesthetic excess, beauty, absurd compression, imaginal invention, or grotesque transformation. When this is the dominant mode, do not force a problem-solution or defense-detection frame. Stay close to the dream's atmosphere and the psychic style of the images. Let the absurd be absurd, the playful be playful, the numinous be numinous.

On archetypes: a strong reading without archetype labels is often better than a weaker one with them. Archetypes are optional and frequently absent. Do not apply archetype language unless it unmistakably deepens the specific image. If the same insight can be expressed more vividly without a label, prefer the vivid phrasing.

When appropriate, offer 1–2 alternative readings supported by concrete dream details; prefer one that lands over many that cover. Avoid certainty.

CRITICAL: Always use hypothetical language. Never state interpretations as certainties.
- Use: "This could suggest...", "One possible reading...", "It might indicate..."
- Never use: "This means that...", "This is...", "This represents..."
- No advice verbs in questions: avoid "try", "practice", "take a moment", "breathe", "focus on", "do".

Reflective questions must be observational, never directive. No advice verbs (try, practice, breathe, focus on, do). Prefer somatic-observational or imaginal questions that deepen symbolic reflection, not regulation.
`;

// Brief format (Quick Glance): 1 opening + atmosphere/affect + 1–2 symbols + felt sense (if present) + 1 question. 80–180 words.
const BRIEF_INTERPRETATION_FORMAT_PROMPT = `
You are responding in BRIEF mode (Quick Glance). Be concise. Write your response in the same language as the dream.

In BRIEF mode:
- Never use archetype names, Archetypal Dynamics, Decision-Edge, or Amplification.
- Total: strictly 80–180 words. Count words if needed to stay concise.
- No headings, just short blocks: (1) one opening sentence naming the dream's mode (integration / conflict / transition / restoration) and the core feeling or image (plain language only); (2) brief Atmosphere & Affect if relevant; (3) one or two key symbols with one verb of psychic action and one cited dream detail (no advice); (4) one Felt Sense Anchor as a statement only if bodily affect is clear in the dream; (5) exactly one reflective question — somatic or symbolic, observational only (e.g. "As you bring X to mind, what shifts in chest/belly?" or "When X comes back, where does the body register it first?"), with no instruction verbs.
`;

// Standard mode (Core Reading): best reading experience — symbolic immediacy over analytic coverage
const STANDARD_INTERPRETATION_FORMAT_PROMPT = `
Write the entire interpretation in the same language as the dream.

This is STANDARD mode (Core Reading). The goal is the best reading experience, not maximum analytic coverage.
Prioritize symbolic immediacy, image-near language, and psychological depth over exhaustive structure.
The response should feel like a strong, alive symbolic reading — not a structured analytic report.

First, if an extracted core_mode is provided in the user prompt (e.g. "Extracted core_mode: Core Tension"), you MUST use that heading. If no core_mode is provided, assess the dream mode yourself: integration (joy, flow, connection), conflict (opposing pulls, rupture), transition (threshold, old→new), or restoration (psyche giving what is missing).

## Core State / ## Core Tension / ## Core Shift / ## Core Restoration (1–2 sentences, always first)
- Start from the image or action in the dream, not from a category label.
- Plain language; no archetype terms in this section.
- Prefer image-led openings: "Something mocking gets put onto your body…" / "The dream turns on a forced display…" / "A sudden warmth gathers around…"
- Avoid generic openers: "This dream shows…" / "This dream centers on…" / "The core tension is…"

## Emotional Atmosphere (1 short paragraph)
- Briefly render the dominant emotional tone and any inner split or ambivalence in felt, image-near language.
- Let the atmosphere feel lived, not clinically named.
- Do not interpret symbols here — save that for Key Symbols.

## Key Symbols (usually 2, at most 3 bullets)
- Choose only the symbols that carry the central psychic movement. Omit scenic, contextual, or secondary symbols.
- Each symbol gets 1 strong sentence.
- If symbol_stances are available from extraction, use them silently to sharpen each symbol's exact tone. Do not mention "stance" or any data-layer term. Let the symbol feel more specific and alive because of the stance, not more technical.
- Use one verb of psychic action per symbol (agitates, seals, welcomes, destabilizes, flattens, collapses, invites, exposes, fixes, etc.).
- Prefer vivid, concrete wording over analytic phrasing.
- Cite one concrete dream detail per bullet, woven in naturally (no parentheses).

## Possible Psychological Meaning (1 short paragraph)
- Synthesize the central psychic pattern, compromise formation, or organizing dynamic.
- Use hypothetical language throughout: "could suggest", "one possible reading", "it might be that…"
- This is where the interpretation lands. Avoid sounding diagnostic or conclusive.
- Do not moralize or over-explain.

## Reflective Questions (always exactly 2)
- First question: somatic-observational when possible.
- Second question: symbolic, relational, or imaginal — should deepen the central symbolic conflict, not open a new analytic thread.
- No advice or instruction verbs.
- OK: "As you bring X to mind, what shifts in chest/belly?" / "When X comes back, where does the body register it first?"
- Not OK: "Try to…" / "Take a moment…" / "Breathe and notice…"

Optional — include at most one of each, only when clearly earned:
- ONE single-sentence Felt Sense Anchor (as a statement, not a question) if bodily affect is strongly and clearly present in the dream.
- ONE alternative reading sentence only if a central image is strongly and genuinely ambivalent: "One could also see [image] as… (cite one dream detail)."

HARD RULES — never include in STANDARD mode:
- Relational Field
- Archetypal Dynamics
- Decision-Edge
- Amplification
- More than 1 alternative reading
- More than 3 Key Symbols (usually keep to 2)

Anti-framework language rule:
- Prefer immediate, image-near, psychologically alive wording over analytic or institutional phrasing.
- If a sentence can be made more vivid and direct without losing accuracy, always prefer the vivid version.

Do not fill sections mechanically. If one section would produce generic or padded prose, compress or omit it.

Do not restate the same insight in multiple sections using slightly different wording. Each section must add something distinct.

Length: aim for 180–320 words. Omit any section that would be thinner than one strong sentence.
`;

// Advanced mode (Deeper Dive): depth-oriented — goes deeper into psychic organization, not just more sections
const ADVANCED_INTERPRETATION_FORMAT_PROMPT = `
This is ADVANCED mode (Deeper Dive).

The goal is not to produce more sections or more labels than STANDARD mode.
The goal is to go deeper into the dream's inner organization — its movement, its ambivalence, its psychic architecture.

Write the entire interpretation in the same language as the dream.

Deepen the reading through these priorities in order:

1. What is the dream doing as a whole? Is it introducing disruption, offering restoration, testing a center, staging a threshold, preserving coherence through retreat, allowing vitality to appear in unstable form, staging play or absurd reorganization?

2. When an image carries both promise and threat, permission and danger, vitality and overwhelm — hold both sides. Do not resolve ambivalence prematurely into one reading. Let the deeper meaning emerge from tension within the image.

3. Look for 1–2 dominant dynamic tensions organizing the dream (e.g. continuity vs vitality, closeness vs engulfment, permission vs exposure, center vs collapse, smoothing-over vs alarm, protection vs avoidance, attraction vs overwhelm). Use only tensions the dream clearly supports.

4. Ask whether the dream moves: toward greater coherence, partial integration, collapse, retreat, repair, threshold, unresolved suspension? If no real movement occurs, say so plainly.

5. Use archetype language sparingly and only if it unmistakably deepens a specific image. A strong reading without archetype labels is better than a weaker one with them.

Structure (write in this order):

Opening section (1 short paragraph — always first):
- The first heading MUST be exactly one of:
  ## Core Tension
  ## Core State
  ## Core Shift
  ## Core Restoration
- If an extracted core_mode is provided in the user prompt, you MUST use that exact heading.
- If no extracted core_mode is present, choose the one that best fits the dream's dominant affect and structure.
- This opening section performs the function of naming the dream's central movement as a whole.
- Start from image or action, not abstraction. Image-near language.

## Emotional Atmosphere (optional — 1 short paragraph)
- Briefly render the felt tone in sensorial, embodied language, especially when the dream carries awe, dread, quiet recognition, estrangement, tenderness, or numinous stillness.
- Let the atmosphere feel lived, not merely labeled. Prefer "a tightened, watchful quiet" or "a warm pull of belonging under strain" over abstract naming alone.
- Do not interpret symbols here.

## Deeper Dynamics (1–2 short paragraphs)
- Name the main dynamic tension(s) organizing the dream.
- Use vivid, concrete, image-near language.
- State tensions through the dream's actual figures, gestures, spaces, and bodily reactions — not through abstract system commentary.
- Avoid over-theorized phrasing such as "psychic system", "normalizing complex", "energy not flowing", or similar conceptual shorthand unless the dream explicitly supports that language.
- Relational regulation, avoidance, smoothing-over, or field dynamics may appear here naturally if the dream warrants it — without becoming the main frame.

## Symbolic Forms
- Prefer one compact paragraph. Use bullets only if two distinct forms clearly organize the dream.
- Name 1–2 imaginal forms that shape the dream as a whole, not just isolated objects.
- These may be spatial, topological, initiatory, or mythically charged forms such as descent, labyrinth, threshold, hidden center, thread/path, waiting figure, enclosure, crossing, spiral, return route, or other recurrent symbolic structures.
- If extracted motifs are provided in the user prompt, use them as a scaffold — name the forms that fit the dream.
- The section should feel like the reader is suddenly seeing the dream's shape more clearly, not like reading a category label.
- Prefer forms that gather multiple dream details into one living pattern.
- Stay close to the actual dream images. Do not turn this into abstract interpretation.
- If mythic resonance is enabled and a form clearly carries timeless or initiatory charge, you may briefly name that resonance here as an imaginal echo.

## Symbolic Development (1 short paragraph)
- Describe whether the dream moves toward integration, instability, withdrawal, restoration, threshold, or unresolved suspension.
- If the movement is blocked, partial, contradictory, or ambivalent, say that plainly.
- If symbol_stances are available from extraction, use them silently to sharpen each symbol's exact tone here.
- When bodily tone is especially clear, let one sentence carry that felt register naturally.
- If a fork or decision-edge is clearly present in the dream logic, name it here without advising.

## Archetypal Layer (optional — include only if unmistakably present)
- 1 short paragraph or 1–2 bullets maximum.
- Only if an archetype is clearly organizing the dream's structure or a symbol carries unmistakable numinous charge.
- Use only: ${ARCHETYPE_WHITELIST.join(', ')}
- For Shadow: unintegrated intensity or charge, not negative content.
- For Self: only when the dream moves toward coherence and a clear organizing center is present.
- If uncertain, omit entirely.

## Reflective Questions (always exactly 2)
- First question: somatic-observational when possible.
- Second question: symbolic, relational, or imaginal — deepens the central movement, not a new thread.
- No advice or instruction verbs.
- OK: "As you bring X to mind, what shifts in chest/belly?" / "When X comes back, where does the body register it first?"
- Not OK: "Try to…" / "Take a moment…" / "Breathe and notice…"

Hard rules:
- Do not become longer just because this is ADVANCED mode. Depth comes from sharper symbolic discrimination, not more headings.
- Do not elevate the tone just because this is advanced mode. Advanced means finer symbolic discrimination, not more impressive language. If the dream is clear in plain language, stay plain.
- Do not turn every dream into a developmental success story. If movement is absent or contradictory, say so.
- Do not smooth over contradiction or ambivalence.
- Use hypothetical language throughout.
- Do not restate the same insight in multiple sections using slightly different wording. Each section must add something distinct.

Length: aim for 220–420 words. If a section would be thin, omit it.
`;

// Mythic resonance — appended to advanced when mythicResonance is true
// Active detection of imaginal forms, not soft permission
const ADVANCED_MYTHIC_NOTE = `
Mythic resonance note: when mythic resonance is enabled, do not merely allow mythic echo — actively test whether the dream's symbolic forms carry timeless, initiatory, underworld, threshold, hidden-center, return-path, guide, waiting-figure, or labyrinthine charge. If one clearly does, include 1–2 sentences of imaginal resonance inside Symbolic Forms or Symbolic Development. This resonance should deepen the reading of the form, not decorate it. Frame it as an echo or atmosphere, never as a doctrine or claim. Do not name gods, myths, traditions, destiny, awakening, or higher truth. The resonance must arise directly from the dream image.
`;

export type InterpretationDepth = 'quick' | 'standard' | 'advanced';

export type GenerateInitialInterpretationOptions = {
  /** When true, returns 1–2 paragraphs + 1 question (~80–150 words) instead of full structured format */
  brief?: boolean;
  /** Level of analysis: quick (80–180 words), standard (150–350), advanced (400–700). Default standard. */
  depth?: InterpretationDepth;
  /** When depth is advanced: if true, use mythic resonance in amplification; if false, use psychological (non-mythic). Ignored for quick/standard. */
  mythicResonance?: boolean;
  /** If provided, used for core_mode heading and no extraction API call is made inside (avoids duplicate call). Caller reuses this same extraction for saving symbols/archetypes/etc. — no data loss. */
  extraction?: DreamExtraction;
};

export const generateInitialInterpretation = async (
  dream: Dream,
  options?: GenerateInitialInterpretationOptions
): Promise<string> => {
  let extractionForInterpretation: DreamExtraction | undefined = options?.extraction;

  if (!extractionForInterpretation) {
    try {
      extractionForInterpretation = await extractDreamSymbolsAndArchetypes(dream);
    } catch (error) {
      logError('ai_extract_core_mode_for_interpretation_error', error, {
        dreamId: dream.id,
      });
    }
  }

  const rawCoreMode = extractionForInterpretation?.core_mode?.trim();
  const extractedCoreMode =
    rawCoreMode && VALID_CORE_MODES.has(rawCoreMode) ? rawCoreMode : undefined;
  const motifsLine = extractionForInterpretation?.motifs?.length
    ? `Extracted motifs: ${extractionForInterpretation.motifs.join(', ')}`
    : '';
  const amplificationsLine = extractionForInterpretation?.amplifications?.length
    ? `Extracted amplifications: ${extractionForInterpretation.amplifications.join(' | ')}`
    : '';
  const landscapesLine = extractionForInterpretation?.landscapes?.length
    ? `Extracted landscapes: ${extractionForInterpretation.landscapes.join(', ')}`
    : '';
  const symbolsLine = extractionForInterpretation?.symbols?.length
    ? `Extracted symbols: ${extractionForInterpretation.symbols.slice(0, 3).join(', ')}`
    : '';
  const symbolStances = extractionForInterpretation?.symbol_stances ?? [];
  const symbolStancesLine = symbolStances.length
    ? `Extracted symbol tones: ${symbolStances.slice(0, 4).map((s) => `${s.symbol} → ${s.stance}`).join('; ')}`
    : '';

  interface ExtendedDream extends Dream {
    emotionOnWaking?: string;
    bodySensation?: string;
    currentLifeTheme?: string;
  }
  const extended = dream as ExtendedDream;
  const emotionOnWaking = extended.emotionOnWaking || '';
  const bodySensation = extended.bodySensation || '';
  const currentLifeTheme = extended.currentLifeTheme || '';

  const personalizationPairs: Array<[string, string]> = [
    ['Emotion on waking', emotionOnWaking],
    ['Body sensation', bodySensation],
    ['Current life theme', currentLifeTheme],
  ];

  const personalizationSection = personalizationPairs
    .filter(([, v]) => Boolean(v))
    .map(([k, v]) => `${k}: ${v}`)
    .join('\n');
  
  const coreModeLine = extractedCoreMode ? `Extracted core_mode: ${extractedCoreMode}` : '';
  const extractionContextLines = [
    coreModeLine,
    motifsLine,
    amplificationsLine,
    landscapesLine,
    symbolsLine,
    symbolStancesLine,
  ].filter(Boolean);
  const extractionContext = extractionContextLines.length ? extractionContextLines.join('\n') + '\n' : '';
  const depth = options?.depth ?? (options?.brief ? 'quick' : 'standard');
  const mythicResonance = options?.mythicResonance ?? false;

  const forcedModeInstruction = extractedCoreMode
    ? `\n\nYou MUST use ## ${extractedCoreMode} as the very first heading. Do NOT choose a different mode even if you disagree. Defer to the extracted mode for consistency.`
    : '';

  const userPrompt = depth === 'quick'
    ? `Here is a dream I want a brief symbolic reflection on.

Title: ${dream.title || 'Untitled'}
Date: ${dream.date}
${extractionContext}
${personalizationSection ? `\n${personalizationSection}\n` : ''}
Dream:
${dream.content}

Give 1–2 short paragraphs and one reflective question. No conclusions, no advice.`
    : `Here is a dream I want to explore symbolically.

Title: ${dream.title || 'Untitled'}
Date: ${dream.date}
${extractionContext}
${personalizationSection ? `\n${personalizationSection}\n` : ''}
Dream:
${dream.content}

Please approach this as a symbolic psychological image, not a literal event.
Focus on:
- Emotional atmosphere and bodily affect
- Inner tensions, ambivalences, or flows — whatever the dream actually stages
- How the ego relates to what appears (including what it avoids, moves toward, or cannot metabolize)
- What each image does to the dreamer's attention, body, or stance
- The larger symbolic forms or imaginal structures that shape the dream as a whole when clearly present
- Archetypal dynamics only when unmistakably present

Do not give conclusions. Offer symbolic perspectives and reflective questions.${forcedModeInstruction}`;

  const { requestId, model } = startRequest();

  let formatPrompt: string;
  if (depth === 'quick') {
    formatPrompt = BRIEF_INTERPRETATION_FORMAT_PROMPT;
  } else if (depth === 'advanced') {
    formatPrompt = mythicResonance
      ? ADVANCED_INTERPRETATION_FORMAT_PROMPT + ADVANCED_MYTHIC_NOTE
      : ADVANCED_INTERPRETATION_FORMAT_PROMPT;
  } else {
    formatPrompt = STANDARD_INTERPRETATION_FORMAT_PROMPT;
  }

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
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'system', content: formatPrompt },
      { role: 'user', content: userPrompt },
    ];

    const payload: any = {
      model,
      messages,
      temperature: depth === 'quick' ? 0.68 : depth === 'advanced' ? 0.50 : 0.55,
    };

    if (capabilities.supportsMaxCompletionTokens) {
      const isGpt5 = /^gpt-5/i.test(model);
      const tokenLimit =
        depth === 'quick' ? 450
        : depth === 'advanced' ? (isGpt5 ? 2400 : 2000)
        : (isGpt5 ? 1600 : 1200);
      setTokenLimit(payload, apiUrl, tokenLimit);
    }

    const headers = await buildHeaders(apiUrl, apiKey, requestId);
    const response = await fetchWithTimeout(
      apiUrl,
      {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      },
      capabilities.defaultTimeout,
      1, // transient retries (network/5xx errors)
      2  // rate limit retries
    );

    const data = await parseApiResponse(response, requestId, apiUrl);

    if (!response.ok) {
      // Log raw error message (truncated) for debugging
      const rawError = safeErrMsg(data.error?.message) || `API Error: ${response.status}`;
      logError('ai_generate_initial_api_error', new Error(rawError), { 
        requestId,
        model,
        status: response.status,
        hasError: !!data.error 
      });
      // Throw user-safe error message (never expose internal errors)
      throw new Error(userSafeError(response.status, apiUrl));
    }

    if (__DEV__) {
      const content = extractApiResponseContent(data);
      console.log('[AI] Response structure:', {
        hasChoices: !!data.choices,
        choicesLength: data.choices?.length,
        hasMessage: !!data.choices?.[0]?.message,
        hasContent: !!data.choices?.[0]?.message?.content,
        contentLength: content.length,
      });
    }

    return extractApiResponseContent(data);
  } catch (error) {
    logError('ai_generate_initial_error', error, { requestId, model });
    throw error;
  }
};

// Chat mode: keep replies short and scannable (UX + post-Jungian balance)
const CHAT_MODE_INSTRUCTIONS = `
You are in chat mode (follow-up questions after the initial analysis). Be concise, but do not become casual, flattened, or generic. Prefer one precise development over a quick summary of many points.
- Target 90–220 words. Rarely up to 260 if the user's question genuinely requires it. At most 2–3 short paragraphs or 1–2 sections; no mini-essays.
- End with exactly ONE reflective question (observational, somatic or symbolic). Never two questions in chat.
- Summarize connections to the dream or user context (e.g. therapy, relationships) without redoing a full analysis. No repetition of what was already said in the initial interpretation.
- Focus on one or two key insights; avoid listing many points. Fewer, sharper observations.
- Write in the same language as the user's message.
`;

// Trim conversation history to last N messages to prevent context bloat
const trimConversationHistory = (history: ChatMessage[], maxMessages: number = 12): ChatMessage[] => {
  if (history.length <= maxMessages) {
    return history;
  }
  // Keep the last N messages
  return history.slice(-maxMessages);
};

export const sendChatMessage = async (
  dream: Dream,
  conversationHistory: ChatMessage[],
  newMessage: string
): Promise<string> => {
  // Truncate dream content to save tokens and prevent repetition
  // In chat mode, we don't need the full dream every turn
  const dreamExcerpt = dream.content.length > 1200
    ? dream.content.slice(0, 1200) + '…'
    : dream.content;
  
  const dreamContext = `Dream being discussed:
Title: ${dream.title || 'Untitled'}
Date: ${dream.date}
Content: ${dreamExcerpt}`;

  // Trim conversation history to prevent context bloat
  const trimmedHistory = trimConversationHistory(conversationHistory);
  const assistantCount = trimmedHistory.filter(m => m.role === 'assistant').length;
  const isFinalResponse = assistantCount === MAX_AI_RESPONSES - 1;

  const finalResponseInstruction = isFinalResponse
    ? `Important: No more follow-ups. This is your final response. Conclude the reflection without inviting further questions. Do not end with a question or prompts like "Do you have any questions?" or "What would you like to explore?". Wrap up with a closing insight or affirmation instead.`
    : null;

  const messages: ApiMessage[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'system', content: CHAT_MODE_INSTRUCTIONS },
    ...(finalResponseInstruction ? [{ role: 'system' as const, content: finalResponseInstruction }] : []),
    { role: 'system', content: dreamContext },
    ...trimmedHistory.map(msg => ({
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

    const payload: any = {
      model,
      messages,
      temperature: 0.45, // Lower temperature for chat to stay analytical, avoid therapy-coach drift
    };

    if (capabilities.supportsMaxCompletionTokens) {
      setTokenLimit(payload, apiUrl, 550); // ~200 words + 1 question; keeps chat snappy
    }

    const headers = await buildHeaders(apiUrl, apiKey, requestId);
    const response = await fetchWithTimeout(
      apiUrl,
      {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      },
      capabilities.defaultTimeout,
      1, // transient retries (network/5xx errors)
      2  // rate limit retries
    );

    const data = await parseApiResponse(response, requestId, apiUrl);

    if (!response.ok) {
      // Log raw error message (truncated) for debugging
      const rawError = safeErrMsg(data.error?.message) || `API Error: ${response.status}`;
      logError('ai_send_chat_api_error', new Error(rawError), { 
        requestId,
        model,
        status: response.status,
        hasError: !!data.error 
      });
      // Throw user-safe error message (never expose internal errors)
      throw new Error(userSafeError(response.status, apiUrl));
    }

    return extractApiResponseContent(data);
  } catch (error) {
    logError('ai_send_chat_error', error, { requestId, model });
    throw error;
  }
};

/** Phrases that exclude Self from chips — text undermines centering symbol */
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

/**
 * Archetype chips must be a strict reflection of the analysis text.
 * If the text undermines a centering symbol, Self must be suppressed.
 */
export function filterArchetypesForDisplay(
  archetypes: string[],
  analysisText: string
): string[] {
  const textLower = analysisText.toLowerCase();
  const suppressSelf = SELF_SUPPRESSION_PHRASES.some((phrase) =>
    textLower.includes(phrase.toLowerCase())
  );

  return archetypes.filter((a) => {
    if (a.toLowerCase() === 'self' && suppressSelf) return false;
    return true;
  });
}

// Helper: extract a markdown section by heading title
const extractSection = (text: string, title: string): string | null => {
  const re = new RegExp(
    `##?\\s*${title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\n([\\s\\S]*?)(?=\\n##?\\s*|$)`,
    'i'
  );
  const m = text.match(re);
  return m ? m[1].trim() : null;
};

// Fallback extraction for rendered analysis.
// Reliable mainly for standard-mode bullet sections (Key Symbols).
// Advanced-mode Symbolic Forms is typically prose-only, so we do not use it for symbol extraction.
// The primary extraction JSON (extractDreamSymbolsAndArchetypes) is the source of truth.
export const extractSymbolsAndArchetypesFromRenderedAnalysis = (aiResponse: string): {
  symbols: string[];
  archetypes: string[];
  landscapes: string[];
} => {
  const symbols: string[] = [];
  const archetypes: string[] = [];

  // --- Symbols: from Key Symbols only (standard mode uses bullets; advanced Symbolic Forms is prose-only) ---
  const symbolsSource = extractSection(aiResponse, 'Key Symbols');
  if (symbolsSource) {
    const bulletMatches = symbolsSource.match(/^[-*]\s*(.+)$/gm);
    if (bulletMatches) {
      bulletMatches.forEach((bullet) => {
        const text = bullet.replace(/^[-*]\s*/, '').trim();
        const symbolName = text.split(/[:,\-]/)[0].trim();
        if (symbolName && symbolName.length < 50) symbols.push(symbolName);
      });
    }
  }

  // --- Archetypes: from "Archetypal Dynamics" (standard) or "Archetypal Layer" (advanced) ---
  const archeSection =
    extractSection(aiResponse, 'Archetypal Dynamics') ||
    extractSection(aiResponse, 'Archetypal Layer');
  if (archeSection) {
    const bulletMatches = archeSection.match(/^[-*]\s*(.+)$/gm) || [];
    const candidates = bulletMatches
      .map((b) => b.replace(/^[-*]\s*/, '').trim())
      .map((line) => line.split(/[:–—-]/)[0].trim())
      .flatMap((raw) => normalizeArchetypeList(raw));
    archetypes.push(...candidates);
  }

  const filteredSymbols = filterAffectWords([...new Set(symbols)]);

  const uniqueArchetypes = [...new Set(archetypes)];
  const filteredArchetypes = filterArchetypesForDisplay(uniqueArchetypes, aiResponse);

  return {
    symbols: filteredSymbols.slice(0, MAX_SYMBOLS_TOTAL),
    archetypes: filteredArchetypes,
    landscapes: [],
  };
};

/** @deprecated Use extractSymbolsAndArchetypesFromRenderedAnalysis. Kept for backward compatibility. */
export const extractSymbolsAndArchetypes = extractSymbolsAndArchetypesFromRenderedAnalysis;

// Common emotional/affect words to filter out from symbols
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

// Filter out affect words from symbols
const filterAffectWords = (symbols: string[]): string[] => {
  return symbols.filter(symbol => {
    const symbolLower = symbol.toLowerCase().trim();
    // Check if the symbol is an affect word or contains one
    const words = symbolLower.split(/\s+/);
    return !words.some(word => AFFECT_WORDS.has(word));
  });
};

const EXTRACTION_SYSTEM_PROMPT = `
You are a post-Jungian dream analyst extracting key structural and dynamic elements from a dream for long-term pattern recognition.

Extract ONLY what is clearly present or strongly implied in the dream text. Be economical: max 3–5 items per category unless the dream is very rich. Return all field values in English only (symbols, archetypes, landscapes, affects, motifs, relational_dynamics, core_mode, amplifications)—regardless of the dream's language—so data stays consistent for pattern tracking and display.

Quality over quantity: prefer fewer high-confidence items, but do not omit archetypes that are clearly active in the dream's charge or figure dynamics. An empty array is correct only when archetypal evidence is genuinely weak.

Fields to return (in priority order — symbols, symbol_stances, core_mode are required; the rest are preferred or optional):
- symbols: 3–5 concrete/imaginal objects, animals, places, figures, forces (e.g. "tiger", "thick paper seal", "cracked circle", "glowing mandala"). NEVER emotional states. Use canonical form: singular noun, no leading article ("tiger" not "the tiger" or "tigers"; "cracked circle" not "a cracked circle").
- archetypes: OPTIONAL — include when a Jungian archetype is clearly active or meaningfully present in the dream's dynamics, symbolic charge, or figure behavior. It does not need to organize the entire dream to be included. Use only: ${ARCHETYPE_WHITELIST.join(', ')}. If no archetype is clearly active, return []. A dream without archetypes is normal. Expand splits like "Shadow / Persona" to separate entries.
- landscapes: 1–3 main settings/places (e.g. "circular plaza at night", "park", "underground"). Use canonical form: no leading article, singular preferred ("park" not "the park"; "dark forest" not "dark forests").

New fields for pattern tracking over time:
- affects: 2–4 dominant emotional tones or bodily energies (as psychic movements, not diagnoses): e.g. "chest tightness", "euphoric surge", "urgency alarm", "wary bracing". Use felt-sense language.
- motifs: 2–4 short symbolic patterns that describe the FORM of the dream, not an interpretation. Usually 2–4 words each. They should be:
  - spatial or imaginal structures (e.g. "labyrinth", "hidden backstage area", "crowded marketplace")
  - movements or positions in space (e.g. "descending underground", "threshold crossing", "watching from outside")
  - recurring symbolic situations (e.g. "waiting outside", "narrow personal space")
  Examples: "descending underground", "crowded marketplace", "watching from outside", "threshold crossing", "hidden backstage area".
  Avoid psychological explanations or interpretation phrases (e.g. NOT "hesitating to approach what you want" or "envy as signal of unlived initiative").
- relational_dynamics: 1–3 short phrases focused only on regulation of pace, permission, urgency, merging, or distance. Examples:
  - "maternal figure shares permission and co-embrace"
  - "crowd averts gaze from central rupture"
  - "intruder controls all timing and proximity"
- core_mode: ONE string from: "Core Tension", "Core State", "Core Shift", "Core Restoration". Choose based on dominant affect/structure (tension if opposing pulls/vital cost; state if integration/flow; shift if threshold/change; restoration if compensatory without strong tension/joy).
- amplifications: 0–2 very brief items (one sentence each) for at most 1–2 key symbols with strong mythic/embodied charge and clear affect match (e.g. "tiger: echoes of untamed instinct that can overwhelm or liberate").

CRITICAL — symbol_stances: The same image can be experienced very differently (playful, painful, stressful, reassuring, ambiguous, etc.). For each key symbol you list, capture HOW it was experienced in this dream.
- symbol_stances: 3–5 items, each { "symbol": "exact phrase from symbols", "stance": "2–8 words" }.
- Stance = the dreamer's affective relation to the symbol in this dream. Examples:
  - fogging a mirror → "playful" vs "stressful attempt to prove something" vs "intimate, tender"
  - a gate → "blocking, alarming" vs "inviting threshold" vs "ambiguous, neither open nor closed"
  - a crowd → "reassuring presence" vs "judging, exposing" vs "neutral backdrop"
- Never assume a fixed meaning; infer stance from context, tone, and what the dreamer does with the image.
- Prefer stance phrases that capture the symbol's specific lived tone in this dream, not generic mood labels. "stressful attempt to prove" is better than "stressful"; "blocking, alarming threshold" is better than "negative"; "warmly permitting closeness" is better than "positive".

Return ONLY valid JSON object, single-line, no extra text. Put symbol_stances immediately after symbols so it is not cut off:
{
  "symbols": [...],
  "symbol_stances": [{"symbol": "mirror (fogging)", "stance": "stressful attempt to prove"}, {"symbol": "thick paper seal", "stance": "barrier that blocks vital exchange"}, ...],
  "archetypes": [...],
  "landscapes": [...],
  "affects": [...],
  "motifs": [...],
  "relational_dynamics": [...],
  "core_mode": "Core Tension",
  "amplifications": [...]
}

If nothing fits a field → empty array []. If unsure → omit or empty. core_mode must be exactly one of the four strings above.
- symbol_stances is REQUIRED: include 3–5 items (one per key symbol). Do not omit or return empty [].
- amplifications: RARE — only for symbols with unmistakable strong embodied or numinous charge. Return [] for most dreams.

CRITICAL: Return ONLY the JSON object. Do NOT wrap in markdown code fences. No explanatory text before or after.
`;

export type SymbolStance = { symbol: string; stance: string };

// Runtime-safe parsing helpers for extraction JSON
const asStringArray = (value: unknown, max = 10): string[] =>
  Array.isArray(value)
    ? value
        .map((s) => String(s).trim())
        .filter(Boolean)
        .slice(0, max)
    : [];

const asSymbolStances = (value: unknown, max = 6): SymbolStance[] =>
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
  core_mode: string;
  amplifications: string[];
  /** How each key symbol was experienced in the dream (playful, painful, stressful, etc.). */
  symbol_stances: SymbolStance[];
};

export const extractDreamSymbolsAndArchetypes = async (dream: Dream): Promise<DreamExtraction> => {
  const extractionPrompt = `Analyze this dream and extract symbols, archetypes, landscapes, affects, motifs, relational_dynamics, core_mode, and amplifications.

Title: ${dream.title || 'Untitled'}
Date: ${dream.date}

Dream:
${dream.content}

Return a JSON object with all fields. Put symbol_stances immediately after symbols (required): symbols, then symbol_stances (3–5 items: { "symbol": "...", "stance": "2–8 words" }), then archetypes, landscapes, affects, motifs, relational_dynamics, core_mode, amplifications. For symbol_stances you MUST add one entry per key symbol with how it was experienced (e.g. "stressful attempt to prove", "playful", "reassuring"). If unsure for other fields use empty array [] or for core_mode use "Core State".`;

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

    const payload: any = {
      model,
      messages,
      temperature: 0.25, // Low but not ultra-deterministic, reduces stereotyped extractions
    };

    if (capabilities.supportsMaxCompletionTokens) {
      setTokenLimit(payload, apiUrl, 2400); // JSON includes affects, motifs, relational_dynamics, core_mode, amplifications, symbol_stances
    }

    if (capabilities.supportsResponseFormat) {
      payload.response_format = { type: 'json_object' };
    }

    const headers = await buildHeaders(apiUrl, apiKey, requestId);
    const extractionTimeout = Math.min(capabilities.defaultTimeout, 25000); // Cap so bad proxy doesn't hang
    const response = await fetchWithTimeout(
      apiUrl,
      {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      },
      extractionTimeout,
      1, // transient retries (network/5xx errors)
      2  // rate limit retries
    );

    const data = await parseApiResponse(response, requestId, apiUrl);

    if (!response.ok) {
      // Log raw error message (truncated) for debugging
      const rawError = safeErrMsg(data.error?.message) || `API Error: ${response.status}`;
      logError('ai_extract_symbols_api_error', new Error(rawError), { 
        requestId,
        model,
        status: response.status,
        hasError: !!data.error 
      });
      // Throw user-safe error message (never expose internal errors)
      throw new Error(userSafeError(response.status, apiUrl));
    }

    const content = extractApiResponseContent(data);

    if (__DEV__) {
      // Only log first 200 chars in dev mode, never full content
      console.log('[AI] Extraction response (first 200 chars):', content.substring(0, 200));
    }

    // Try to parse JSON from the response
    try {
      // Try to extract JSON from the response if it's wrapped in text
      let jsonStr = content.trim();
      // Remove markdown code blocks if present
      jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

      // If the model wrapped JSON with extra text, extract the first {...} block using brace balancing
      if (!jsonStr.startsWith('{')) {
        const extracted = extractFirstJsonObject(jsonStr);
        if (extracted) {
          jsonStr = extracted.trim();
        } else {
          // No JSON object found - throw clearer error
          throw new Error('No JSON object found in response');
        }
      }
      
      const parsed = JSON.parse(jsonStr) as Record<string, unknown>;

      const rawSymbols = asStringArray(parsed.symbols, MAX_SYMBOLS_TOTAL);
      const symbols = filterAffectWords(rawSymbols).slice(0, MAX_SYMBOLS_TOTAL);

      const rawArchetypes: unknown[] = Array.isArray(parsed.archetypes) ? parsed.archetypes : [];
      const expanded: string[] = rawArchetypes.flatMap((a) => normalizeArchetypeList(String(a)));
      const uniqueArchetypes = [...new Set(expanded)];

      const landscapes = asStringArray(parsed.landscapes, 5);
      const affects = asStringArray(parsed.affects, 4);
      const motifs = asStringArray(parsed.motifs, 4);
      const relational_dynamics = asStringArray(parsed.relational_dynamics, 3);
      const core_mode =
        typeof parsed.core_mode === 'string' &&
        /^Core (Tension|State|Shift|Restoration)$/.test(parsed.core_mode)
          ? parsed.core_mode
          : '';
      const amplifications = asStringArray(parsed.amplifications, 3);

      const rawSymbolStances = parsed.symbol_stances ?? parsed.symbolStances;
      const symbol_stances = asSymbolStances(rawSymbolStances, 6);

      if (__DEV__ && symbol_stances.length === 0 && parsed && typeof parsed === 'object') {
        console.warn('[AI] symbol_stances empty; parsed keys:', Object.keys(parsed));
        if (rawSymbolStances != null) {
          console.warn('[AI] rawSymbolStances type:', typeof rawSymbolStances, Array.isArray(rawSymbolStances) ? 'length=' + (rawSymbolStances as unknown[]).length : '', rawSymbolStances);
        }
      }

      if (__DEV__) {
        console.log('[AI] Extracted:', {
          symbolsCount: symbols.length,
          archetypesCount: uniqueArchetypes.length,
          landscapesCount: landscapes.length,
          affectsCount: affects.length,
          motifsCount: motifs.length,
          symbol_stancesCount: symbol_stances.length,
          core_mode,
        });
      }

      return {
        symbols,
        archetypes: uniqueArchetypes,
        landscapes,
        affects,
        motifs,
        relational_dynamics,
        core_mode,
        amplifications,
        symbol_stances,
      };
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
    core_mode: '',
    amplifications: [],
    symbol_stances: [],
  };
}

/* ============================
   PATTERN INSIGHTS (MONTHLY / QUARTERLY)
   ============================ */

const PATTERN_INSIGHTS_SYSTEM_PROMPT = `
You are a post-Jungian companion reviewing dream patterns over time.

Your role is to reflect on a series of extracted dream elements (core modes, affects, motifs, relational dynamics, landscapes, amplifications) and offer a short, hypothetical reflection on emerging patterns — not to diagnose, advise, or conclude.

Rules:
- Use hypothetical language only ("could suggest", "might indicate", "one possible reading").
- Focus on recurring motifs/affects/relational dynamics. Note whether the psyche seems to move toward greater differentiation, greater concealment, repeated compromise, stronger contact with vitality, or continued smoothing-over of alarm. If there is little change across dreams, say so plainly.
- Do not impose a developmental or progressive arc if the pattern is cyclical, stalled, contradictory, or too sparse to support one. Name what is actually there.
- When amplifications are present, they carry mythic/embodied echoes — note 1–2 if they recur or contrast across dreams.
- Use "Symbol stances" to see how each symbol was experienced (playful, painful, stressful, etc.). The same image can carry different meanings in different dreams — reflect on contrasts or recurrences when present.
- Treat sparse data or flat affect as meaningful: name it (e.g. "a period of little emotional differentiation", "the psyche holding distance") rather than filling with generic reflection.
- Note how the psyche might be organizing attention or vitality over time.
- No conclusions, no advice — only orientations and 1–2 reflective questions.
- Structure your response with: ## Emerging Patterns, ## Possible Evolutions, ## Reflective Questions.
- Keep total length 150–250 words. Cite 1–2 concrete recurrences from the data.
`;

export type PatternInsightDreamEntry = {
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
    return 'No interpreted dreams in this period. Interpret 2–3 dreams this month to unlock a reflection on patterns.';
  }

  const context = dreamAnalyses
    .map(
      (d) => {
        const stances = (d.extracted.symbol_stances ?? [])
          .map((s) => `${s.symbol}: ${s.stance}`)
          .join('; ');
        return `
Date: ${d.date}
Core Mode: ${d.extracted.core_mode || '(not set)'}
Affects: ${(d.extracted.affects ?? []).join(', ') || '(none)'}
Motifs: ${(d.extracted.motifs ?? []).join('; ') || '(none)'}
Relational: ${(d.extracted.relational_dynamics ?? []).join('; ') || '(none)'}
Symbols: ${(d.extracted.symbols ?? []).slice(0, 3).join(', ') || '(none)'}
Symbol stances (how each symbol was experienced): ${stances || '(none)'}
Landscapes: ${(d.extracted.landscapes ?? []).slice(0, 3).join(', ') || '(none)'}
Amplifications: ${(d.extracted.amplifications ?? []).join('; ') || '(none)'}
`;
      }
    )
    .join('\n');

  const langNames: Record<string, string> = {
    el: 'Greek (Ελληνικά)', es: 'Spanish', fr: 'French', de: 'German', it: 'Italian',
    pt: 'Portuguese', nl: 'Dutch', pl: 'Polish', ru: 'Russian', ja: 'Japanese', zh: 'Chinese',
  };
  const langInstruction = language === 'en'
    ? ''
    : `\n\nIMPORTANT: Write the entire reflection in ${langNames[language] ?? `the language with ISO 639-1 code "${language}"`}. All section headings and body text must be in that language.`;

  const userPrompt = `You are reviewing dream patterns over a ${period} period.

Here are extracted elements from recent dreams:

${context}

Provide a short, hypothetical reflection (150–250 words) on emerging patterns.
Use the structure: ## Emerging Patterns, ## Possible Evolutions, ## Reflective Questions.
Use hypothetical language. Cite 1–2 concrete recurrences. No conclusions, no advice.${langInstruction}`;

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
      { role: 'system', content: PATTERN_INSIGHTS_SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ];

    const payload: any = {
      model,
      messages,
      temperature: 0.5,
    };

    if (capabilities.supportsMaxCompletionTokens) {
      setTokenLimit(payload, apiUrl, 600);
    }

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
      logError('ai_pattern_insights_api_error', new Error(rawError), {
        requestId,
        model,
        status: response.status,
      });
      throw new Error(userSafeError(response.status, apiUrl));
    }

    return extractApiResponseContent(data);
  } catch (error) {
    logError('ai_pattern_insights_error', error, { requestId, model });
    throw error;
  }
};

/* ============================
   SYMBOL / LANDSCAPE SEMANTIC GROUPING
   ============================ */

/**
 * Groups semantically equivalent symbols and landscapes into canonical forms.
 * Returns maps: variant → canonical (only for variants that differ from canonical).
 * Fails silently (returns empty maps) so insights always load.
 */
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
    if (capabilities.supportsMaxCompletionTokens) setTokenLimit(payload, apiUrl, 400);
    if (capabilities.supportsResponseFormat) payload.response_format = { type: 'json_object' };

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
        if (typeof member === 'string' && symbolSet.has(member) && member !== canonical) {
          symbolGroupMap[member] = canonical;
        }
      }
    }

    const landscapeGroupMap: Record<string, string> = {};
    for (const group of (parsed.landscape_groups as any[]) ?? []) {
      const canonical = String(group?.canonical ?? '').trim();
      if (!canonical || !landscapeSet.has(canonical)) continue;
      for (const member of (group?.members as string[]) ?? []) {
        if (typeof member === 'string' && landscapeSet.has(member) && member !== canonical) {
          landscapeGroupMap[member] = canonical;
        }
      }
    }

    return { symbolGroupMap, landscapeGroupMap };
  } catch (error) {
    logError('ai_group_similar_terms_error', error, { requestId });
    return empty;
  }
}
