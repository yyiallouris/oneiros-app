import { Dream, ChatMessage } from '../types/dream';
import Constants from 'expo-constants';
import { logError } from './logger';
import { ARCHETYPE_WHITELIST, normalizeArchetypeList } from '../constants/archetypes';

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

const getModelCapabilities = (model: string): ModelCapabilities => {
  // Start with model-based defaults
  const caps = defaultsFromModel(model);

  // Override with config values (each independently)
  const cfgResp = getConfig('modelSupportsResponseFormat');
  const cfgTimeout = getConfig('defaultTimeoutMs');
  const cfgMaxTok = getConfig('supportsMaxCompletionTokens');

  if (cfgResp !== null) {
    caps.supportsResponseFormat = cfgResp === 'true';
  }
  if (cfgTimeout) {
    const parsedTimeout = parseInt(cfgTimeout, 10);
    // Guard against NaN and invalid values
    if (!Number.isNaN(parsedTimeout) && parsedTimeout > 0) {
      caps.defaultTimeout = parsedTimeout;
    }
  }
  if (cfgMaxTok !== null) {
    caps.supportsMaxCompletionTokens = cfgMaxTok === 'true';
  }

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
const safeErrMsg = (msg: any): string => {
  if (typeof msg === 'string' && msg.length > 200) {
    return msg.slice(0, 200) + '…';
  }
  return msg || '';
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
// OpenAI Chat Completions uses 'max_tokens', Responses API uses 'max_output_tokens', proxies default to 'max_completion_tokens'
// Config override via 'tokenParamName' is respected
const getTokenParamName = (apiUrl: string): string => {
  // Normalize URL for matching (trim + lowercase to handle query params and case variations)
  const u = (apiUrl || '').trim().toLowerCase();
  const defaultTokenParam = (() => {
    if (u.includes('/v1/chat/completions')) return 'max_tokens';
    if (u.includes('/v1/responses')) return 'max_output_tokens';
    return 'max_completion_tokens'; // proxy default
  })();
  return getConfig('tokenParamName', defaultTokenParam) || defaultTokenParam;
};

// Type for OpenAI API message format
type ApiMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

// Fetch with timeout, retry, and rate limit handling
// Different retry counts for transient errors (network/5xx) vs rate limits
const fetchWithTimeout = async (
  url: string,
  options: RequestInit,
  timeout: number,
  transientRetries: number = 1,
  rateLimitRetries: number = 2
): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    
    // Handle 429 rate limit with backoff (separate retry count)
    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After');
      // Parse Retry-After safely (handle NaN)
      const delaySec = retryAfter ? Number(retryAfter) : NaN;
      const delay = Number.isFinite(delaySec) ? delaySec * 1000 : 2000; // Default 2s if invalid
      
      if (rateLimitRetries > 0) {
        if (__DEV__) {
          console.log(`[AI] Rate limited (429), retrying after ${delay}ms...`);
        }
        await new Promise(resolve => setTimeout(resolve, delay));
        return fetchWithTimeout(url, options, timeout, transientRetries, rateLimitRetries - 1);
      }
    }
    
    // Handle 5xx server errors with retry (transient errors)
    if (response.status >= 500 && transientRetries > 0) {
      if (__DEV__) {
        console.log(`[AI] Server error (${response.status}), retrying...`);
      }
      // Add jitter to avoid thundering herd (600-1000ms)
      const backoff = 600 + Math.floor(Math.random() * 400);
      await new Promise(resolve => setTimeout(resolve, backoff));
      return fetchWithTimeout(url, options, timeout, transientRetries - 1, rateLimitRetries);
    }
    
    return response;
  } catch (error: any) {
    // Retry on network errors (not on abort/timeout) with separate retry count
    if (transientRetries > 0 && error.name !== 'AbortError') {
      if (__DEV__) {
        console.log(`[AI] Retrying fetch (${transientRetries} retries left)...`);
      }
      // Add jitter for network retries too
      const backoff = 300 + Math.floor(Math.random() * 200);
      await new Promise(resolve => setTimeout(resolve, backoff));
      return fetchWithTimeout(url, options, timeout, transientRetries - 1, rateLimitRetries);
    }
    
    if (error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeout}ms`);
    }
    
    throw error;
  } finally {
    // Always clear timeout to prevent leaks, even if code throws
    clearTimeout(timeoutId);
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

Core principles you must follow:
- First assess dream mode: integration/coherence (joy, flow, connection), conflict/disturbance (intrusion, shadow, alarm), transition (old→new, threshold), or restoration/compensation (psyche giving what is missing). Match your framing to the dream.
- Only introduce tension/conflict language when the dream itself presents opposing pulls or rupture. If the dream is cohesive or nourishing, focus on the state being experienced and what it consolidates.
- Never assign fixed meanings to symbols ("X always means Y").
- Always interpret symbols in relation to the dreamer's emotional tone, bodily sensations, and inner dynamics (tension when present; flow, integration, or consolidation when present).
- Treat dream figures as autonomous inner complexes (Shadow, Animus/Anima, Self, etc.), not personality traits.
- Focus on ego–unconscious dynamics — tension, ambivalence, resistance when present; integration, flow, consolidation when present.
- Prioritize affect (fear, shame, excitement, confusion) over narrative details.
- When attention avoids a central image, treat it as possible active avoidance (a defense), not only "distraction."
- Every interpretive claim must cite at least one concrete detail from the dream. If you can't cite, soften or omit.
- Treat the interpretation as an ORIENTATION process (how the psyche organizes attention and stance), not symbolic decoding.
- Prefer function over meaning: ask what an image DOES to attention/body/ego stance (stabilizes, agitates, numbs, seduces, distracts, collapses).
- Actively scan for "functional continuity with vital cost": moments where the dream allows movement, social participation, productivity, or calm appearance while a basic life-signal (breath, pain, urgency, aliveness, sensation) is restricted or ignored.
- Name the adaptive solution AND its cost in the same sentence when evidenced (e.g., "it keeps things going, but it reduces airflow/feeling/aliveness").
- Track normalization dynamics: note when other figures or the setting smooth over, reward, or ignore the vital alarm in favor of comfort, politeness, or group pacing.
- When describing "functional continuity with vital cost", do not recommend changing behavior; only describe the symbolic trade-off and how the dream stages it.
- Do not treat withdrawal/retreat as avoidance by default. Consider it as possible protective intelligence (tests → detects instability → withdraws).
- Describe inner dynamics with verbs (approaches, tests, disperses, fixates, edits-over, destabilizes) more than nouns.
- Avoid framing any figure (e.g. parent) as the source of threat. Focus on field dynamics and embodied response rather than blame or diagnosis.
- Treat Shadow primarily as unintegrated intensity or charge, not as negative content.
- Always consider the relational field: how figures regulate pace, urgency, permission, distance, attachment, and who leads / who follows in the dream.
- When the dream implies a fork (continue vs rupture, comply vs insist, merge vs separate), name it as a symbolic decision-edge without advising action.
- You may include one single-sentence Felt Sense Anchor that asks only for noticing (no instructions), e.g. "As you read this, does the body feel more open, unchanged, or tighter?"
- Avoid instruction-shaped phrasing even when gentle (e.g. "take a moment", "notice by doing X"). Use descriptive or binary-choice noticing only.

Your style:
- Analytically grounded, not spiritual fluff.
- Insightful but not moralizing.
- Curious, not reassuring.
- You help the dreamer *think symbolically*, not feel comforted.
- Use a warm, human tone, but stay analytical; no motivational or therapeutic coaching.
- Keep it interpretive and precise.
- Warmth = clarity + respect, not comfort or therapy.
- Fewer, sharper observations beat more, vaguer ones. One sentence that lands is worth a paragraph that covers.

Do not:
- Diagnose.
- Give advice.
- Normalize or pathologize.
- Reduce dreams to trauma stories or behavioral psychology.
- Avoid spiritual absolutisms and guru language (e.g., higher self, the universe, destiny, vibrations, awakening). Use plain psychological language.

Your goal:
To illuminate how the psyche organizes meaning through images — whether in tension, flow, transition, or consolidation. Not all dreams are conflict dreams; some are integration dreams, restoration dreams, or threshold dreams.

When appropriate, offer 1–2 alternative readings supported by concrete dream details; prefer one that lands over many that cover. Avoid certainty.

CRITICAL: Always use hypothetical language. Never state interpretations as certainties.
- Use: "This could suggest...", "One possible reading...", "It might indicate..."
- Never use: "This means that...", "This is...", "This represents..."
- No advice verbs in questions: avoid "try", "practice", "take a moment", "breathe", "focus on", "do".

Reflective questions:
- Include at least one somatic, observational question when possible.
- A second question may be symbolic, relational, or imaginal (no somatic requirement).
- Avoid therapeutic framing; questions should deepen symbolic reflection, not regulation.
- End with 1–2 reflective questions. Observational only, never directive.
- ✅ "What happens in your chest/belly when you picture X?"
- ❌ "Breathe deeply and notice…" / "Take a breath…" / "Try to sit with…"
`;

// Brief format: 1–2 paragraphs + 1 question (used when options.brief is true)
const BRIEF_INTERPRETATION_FORMAT_PROMPT = `
You are responding in BRIEF mode. Be concise.

Give 1–2 short paragraphs only:
1. Opening: one sentence that names the dream's mode (integration / conflict / transition / restoration) and the core image or feeling. Plain language, no archetype terms.
2. One sharp observation: one concrete symbol or dynamic from the dream and what it does to attention/body/ego (stabilizes, agitates, numbs, seduces, etc.). Cite one dream detail. No advice, no conclusions.
3. End with exactly 1 reflective question — somatic or symbolic, observational only (e.g. "What happens in your chest when you picture X?"). No instruction verbs.

Total: 80–150 words. Fewer, sharper observations beat more, vaguer ones.
`;

// Format contract for initial interpretation — fewer sections, sharper impact, true optional sections
const INTERPRETATION_FORMAT_PROMPT = `
Fewer, sharper observations beat more, vaguer ones. One sentence that lands is worth a paragraph that covers.

Structure your interpretation in this exact order. Include only sections that the dream clearly invites; if in doubt, omit a section.

First assess dream mode: integration (joy, flow, connection), conflict (opposing pulls, rupture), transition (threshold, old→new), or restoration (psyche giving what is missing). Choose the opening frame accordingly.

**Opening** (1–2 sentences, always first) — use the heading that fits:
- **Core State** — for integration/coherence or restoration dreams (joy, flow, "I am okay with who I am"). Example: "This dream anchors a sense of belonging and ease — the playground, the dancing, the figures that welcome."
- **Core Tension** — for conflict/disturbance dreams (opposing pulls, rupture, alarm). Example: "This dream centers on a tension between belonging and exposure — the mask at the gate, the descent underground, the figures that mirror and judge." If the dream shows outward functioning while an inner life-signal escalates (e.g., continuing normally while breath/urgency/aliveness is compromised), frame the Core Tension as "functioning vs vitality" or "social continuity vs bodily truth" (without advising).
- **Core Shift** — for transition dreams (threshold, something changing). Example: "This dream marks a threshold — the old house giving way to open sky, the figure at the door neither in nor out."
- Plain language, no archetype terms, no advice, no questions. Purpose: give the user an immediate landing point that matches the dream's actual mode.

1. **Atmosphere & Affect** (1 short paragraph)
   - Emotional atmosphere and bodily sensations only. Note inner conflicts or tensions when present; otherwise note flow, coherence, ease, or consolidation.
   - Emotions and body tone ONLY. You may reference the trigger in 3–5 words max (e.g., "under flickering light") without describing symbols.

2. **Key Symbols** (STRICT 2–3 bullets max)
   - Each bullet: one concrete image + one psychological function (tension when present; stabilizing, connecting, or consolidating when the dream is cohesive).
   - Symbols must be concrete or imaginal entities (e.g., "mask", "gate", "lantern", "cavern"). NEVER emotional states as symbols ("worry", "fear" belong in Atmosphere & Affect).
   - Include 1 short evidence phrase from the dream per symbol. Keep bullets tight.
   - Prefer the 2 most psychologically active images. If you cannot cite at least 2 concrete dream details, say you need more detail and ask 1–2 questions instead.
   - Special rule: If a "center" (circle/mandala/core) increases agitation, fatigue, tightening, or loss of balance, describe it as a contested/unstable center (edited-over, untrustworthy, not-yet-inhabitable) rather than a soothing organizing center.

3. **Relational Field** — include ONLY if ≥2 figures or a social scene and it adds something. Otherwise omit. If included: 1 short paragraph, how connection is regulated (pace, urgency, permission, dismissal, merging/separating), anchored in 1–2 concrete dream details.

**Felt Sense Anchor** — include ONLY if it naturally fits. Otherwise omit. If included: 1 sentence max, noticing only, no instruction verbs.

4. **Archetypal Dynamics** (0–4 bullets max)
   - Include ONLY when clearly active. If none, omit this section entirely.
   - Use only: ${ARCHETYPE_WHITELIST.join(', ')}
   - Always follow label with plain-language descriptor. For Shadow: frame as unintegrated intensity or charge, not negative content (e.g., "Shadow — unintegrated charge around X").
   - SPECIAL RULE FOR "Self": Self symbols are rare. Only include "Self" if there is a strong centering/ordering symbol or numinous organizing force (mandala/circle center, radiant fire/stone, axis/tree, sacred child as center, unifying third, explicit wholeness motif). If a mandala/circle-like center increases agitation, bodily tightening, confusion, or loss of balance, treat it as a contested/false center and avoid labeling it as Self. If uncertain, omit "Self".
   - Do NOT introduce Anima/Animus unless evidenced by a clear figure or a distinct inner judging/commentary dynamic in the dream.
   - Do NOT include modern system archetypes (Explorer, Sage, Warrior, etc.) unless there is explicit behavior in the dream showing that function in action.

**Decision-Edge** — include ONLY if the dream clearly presents a fork (continue vs rupture, comply vs insist, merge vs separate). Otherwise omit. If included: 1 bullet naming the two symbolic pulls and what each protects or risks, without advising.

5. **Reflective Questions** (1–2 questions)
   - Prefer one somatic, observational question and optionally one symbolic/relational question when the dream implies a fork.
   - Avoid therapeutic framing; questions should deepen symbolic reflection, not regulation.
   - ✅ "What happens in your chest when you picture the mask?"
   - ❌ "Take a breath and notice…" / "Try to sit with…"

Formatting: No more than 2 consecutive paragraphs anywhere. Prefer bullets over paragraphs.
Use ## for section headings:
## Core State / ## Core Tension / ## Core Shift
## Atmosphere & Affect
## Felt Sense Anchor (only if it fits)
## Key Symbols
## Relational Field (only if ≥2 figures and it adds)
## Archetypal Dynamics (only if 0–4 clearly active)
## Decision-Edge (only if dream presents a fork)
## Reflective Questions

Length: Aim for 150–300 words. Prefer 2–3 symbols and 0–4 archetypes when clearly active. If in doubt, omit a section.
`;

export type GenerateInitialInterpretationOptions = {
  /** When true, returns 1–2 paragraphs + 1 question (~80–150 words) instead of full structured format */
  brief?: boolean;
};

export const generateInitialInterpretation = async (
  dream: Dream,
  options?: GenerateInitialInterpretationOptions
): Promise<string> => {
  // Build personalization hooks (if available in future Dream object extensions)
  const emotionOnWaking = (dream as any).emotionOnWaking || '';
  const bodySensation = (dream as any).bodySensation || '';
  const currentLifeTheme = (dream as any).currentLifeTheme || '';

  const personalizationPairs: Array<[string, string]> = [
    ['Emotion on waking', emotionOnWaking],
    ['Body sensation', bodySensation],
    ['Current life theme', currentLifeTheme],
  ];

  const personalizationSection = personalizationPairs
    .filter(([, v]) => Boolean(v))
    .map(([k, v]) => `${k}: ${v}`)
    .join('\n');
  
  const userPrompt = options?.brief
    ? `Here is a dream I want a brief symbolic reflection on.

Title: ${dream.title || 'Untitled'}
Date: ${dream.date}
${personalizationSection ? `\n${personalizationSection}\n` : ''}
Dream:
${dream.content}

Give 1–2 short paragraphs and one reflective question. No conclusions, no advice.`
    : `Here is a dream I want to explore symbolically.

Title: ${dream.title || 'Untitled'}
Date: ${dream.date}
${personalizationSection ? `\n${personalizationSection}\n` : ''}
Dream:
${dream.content}

Please approach this as a symbolic psychological image, not a literal event.
Focus on:
- Emotional atmosphere and bodily reactions
- Inner conflicts or tensions
- How the ego relates to what appears (and what it avoids)
- Relational field: who sets pace, urgency, permission, or dismissal
- Any "working solution" the dream uses (movement, social smoothness, competence) and what it costs in vitality, sensation, or basic needs
- If a symbolic fork appears (continue vs rupture, merge vs separate), name it without advising
- Archetypal dynamics only when clearly evidenced in the dream

Do not give conclusions. Offer symbolic perspectives and reflective questions.`;

  const { requestId, model } = startRequest();
  
  try {
    const apiUrl = getApiUrl();
    const apiKey = getApiKey();
    const capabilities = getModelCapabilities(model);

    // Only require API key when calling OpenAI directly in dev
    // Proxies handle authentication server-side
    if (requiresClientKey(apiUrl) && (!apiKey || apiKey === 'your-openai-api-key')) {
      logError('ai_missing_api_key', new Error('OpenAI API key not configured'));
      throw new Error('OpenAI API key not configured. Add it to .env and restart the app.');
    }

    const formatPrompt = options?.brief ? BRIEF_INTERPRETATION_FORMAT_PROMPT : INTERPRETATION_FORMAT_PROMPT;
    const messages: ApiMessage[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'system', content: formatPrompt },
      { role: 'user', content: userPrompt },
    ];

    const payload: any = {
      model,
      messages,
      temperature: 0.6,
    };

    // Only add token limit if supported (configurable param name for proxy compatibility)
    // Lower cap forces sharper, shorter responses (economy over exhaustiveness)
    if (capabilities.supportsMaxCompletionTokens) {
      const tokenParamName = getTokenParamName(apiUrl);
      const isGpt5 = /^gpt-5/i.test(model);
      const tokenLimit = options?.brief ? 400 : (isGpt5 ? 1000 : 800);
      payload[tokenParamName] = tokenLimit;
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

  const messages: ApiMessage[] = [
    { role: 'system', content: SYSTEM_PROMPT },
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

    // Only require API key when calling OpenAI directly in dev
    // Proxies handle authentication server-side
    if (requiresClientKey(apiUrl) && (!apiKey || apiKey === 'your-openai-api-key')) {
      logError('ai_missing_api_key', new Error('OpenAI API key not configured'));
      throw new Error('OpenAI API key not configured. Add it to .env and restart the app.');
    }

    const payload: any = {
      model,
      messages,
      temperature: 0.45, // Lower temperature for chat to stay analytical, avoid therapy-coach drift
    };

    // Only add token limit if supported (configurable param name for proxy compatibility)
    if (capabilities.supportsMaxCompletionTokens) {
      // Use helper to get token param name (DRY - avoids copy-paste bugs)
      const tokenParamName = getTokenParamName(apiUrl);
      payload[tokenParamName] = 1000;
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

const MAX_MAIN_SYMBOLS = 4;
const MAX_SYMBOLS_TOTAL = 12; // main (4) + secondary (up to 8)

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

// Fallback extraction: parse only Key Symbols + Archetypal Dynamics sections (no full-text scan)
export const extractSymbolsAndArchetypes = (aiResponse: string): {
  symbols: string[];
  archetypes: string[];
  landscapes: string[];
} => {
  const symbols: string[] = [];
  const archetypes: string[] = [];

  // --- Symbols: from Key Symbols, Relational Field, or Dream Snapshot section ---
  const keySymbolsSection = extractSection(aiResponse, 'Key Symbols') || 
                            extractSection(aiResponse, 'Relational Field') ||
                            extractSection(aiResponse, 'Dream Snapshot');
  if (keySymbolsSection) {
    const bulletMatches = keySymbolsSection.match(/^[-*]\s*(.+)$/gm);
    if (bulletMatches) {
      bulletMatches.forEach((bullet) => {
        const text = bullet.replace(/^[-*]\s*/, '').trim();
        const symbolName = text.split(/[:,\-]/)[0].trim();
        if (symbolName && symbolName.length < 50) symbols.push(symbolName);
      });
    }
  }

  // --- Archetypes: only from Archetypal Dynamics bullets (avoids "self" in "self-image" elsewhere) ---
  const archeSection = extractSection(aiResponse, 'Archetypal Dynamics');
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
  'desire', 'desiring', 'longing', 'longing',
  'nostalgia', 'nostalgic', 'yearning', 'yearning',
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
You are a post-Jungian dream analyst extracting symbols, archetypes, and landscapes from a dream.

For symbols: Identify 3–5 key symbolic elements max—objects, animals, places, figures, or forces (e.g. "mask", "lantern", "cavern", "throne", "water"). Prefer the 2–3 most psychologically active images; economy over exhaustiveness.
CRITICAL: Symbols must be concrete or imaginal images/objects/forces, NOT emotional states.
- ✅ Include: "mask", "gate", "lantern", "roots", "cavern", "throne", "water", "meadow", "fire", "staff"
- ❌ Exclude: "worry", "fear", "sadness", "anxiety", "anger" (these are affect, not symbols)

For archetypes: Identify EVERY Jungian archetype that is clearly active in the dream (appears as a figure, role, or dynamic). A single dream often has many—e.g. Child, Great Mother, Father, King, Queen, Trickster, Shadow, Warrior, Anima, Animus, Death Archetype, Rebirth, Wise Old Man, Wounded Healer. Include all that apply.
Use only these archetype names: ${ARCHETYPE_WHITELIST.join(', ')}.
Only omit an archetype if it is merely mentioned in passing; if a figure or dynamic is present, include it.

For landscapes: Identify the main settings or spaces where the dream takes place—places, environments, or spatial contexts (e.g. "forest", "beach", "childhood home", "city street", "empty room", "school corridor", "open road").
- ✅ Include: "forest", "beach", "childhood home", "city street", "empty room", "school", "hospital", "open road", "mountain path", "underwater", "old house"
- Keep 1-3 landscapes per dream; prefer concrete, imageable places.
- Do NOT list emotions or abstract concepts as landscapes.

Return your response as a JSON object with exactly this format:
{
  "symbols": ["symbol1", "symbol2", ...],
  "archetypes": ["archetype1", "archetype2", ...],
  "landscapes": ["place1", "place2", ...]
}

CRITICAL INSTRUCTIONS:
- Return ONLY the JSON object, no additional text
- Return a single-line JSON object with no whitespace before/after
- Do NOT wrap the JSON in markdown code fences (no \`\`\`json)
- Do NOT add explanatory text before or after the JSON
- If you are unsure about a symbol, archetype, or landscape, omit it (empty arrays are acceptable)
- Return empty arrays [] if none are found

Example (short dream): {"symbols": ["water", "bridge"], "archetypes": ["Shadow", "Anima"], "landscapes": ["riverbank", "forest"]}
Example (rich dream): {"symbols": ["mask", "gate", "lantern", "cavern", "throne"], "archetypes": ["Persona", "Child", "Great Mother", "Father", "Trickster", "Shadow"], "landscapes": ["circular city", "underground cavern", "meadow"]}
`;

export const extractDreamSymbolsAndArchetypes = async (dream: Dream): Promise<{
  symbols: string[];
  archetypes: string[];
  landscapes: string[];
}> => {
  const extractionPrompt = `Analyze this dream and extract symbols, archetypes, and landscapes (settings/places).

Title: ${dream.title || 'Untitled'}
Date: ${dream.date}

Dream:
${dream.content}

Return a JSON object with "symbols", "archetypes", and "landscapes" arrays. Include every symbol and archetype that is clearly present; rich dreams will have longer arrays. If unsure, return empty arrays [].`;

  const { requestId, model } = startRequest();

  try {
    const apiUrl = getApiUrl();
    const apiKey = getApiKey();
    const capabilities = getModelCapabilities(model);

    // Only require API key when calling OpenAI directly in dev
    // Proxies handle authentication server-side
    if (requiresClientKey(apiUrl) && (!apiKey || apiKey === 'your-openai-api-key')) {
      logError('ai_missing_api_key', new Error('OpenAI API key not configured'));
      throw new Error('OpenAI API key not configured.');
    }

    const messages: ApiMessage[] = [
      { role: 'system', content: EXTRACTION_SYSTEM_PROMPT },
      { role: 'user', content: extractionPrompt },
    ];

    const payload: any = {
      model,
      messages,
      temperature: 0.1, // Very low temperature for deterministic extraction
    };

    // Only add token limit if supported (configurable param name for proxy compatibility)
    if (capabilities.supportsMaxCompletionTokens) {
      // Use helper to get token param name (DRY - avoids copy-paste bugs)
      const tokenParamName = getTokenParamName(apiUrl);
      payload[tokenParamName] = 1600;
    }

    // Only add response_format if supported
    if (capabilities.supportsResponseFormat) {
      payload.response_format = { type: 'json_object' };
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
      
      const parsed = JSON.parse(jsonStr);
      
      // Filter out affect words; max 5 symbols (align with interpretation format: 3–4 core)
      const rawSymbols: string[] = Array.isArray(parsed.symbols)
        ? parsed.symbols.map((s: unknown) => String(s))
        : [];
      let symbols = filterAffectWords(rawSymbols).slice(0, MAX_SYMBOLS_TOTAL);

      // Normalize to whitelist; expand "X / Y" into separate archetypes
      const rawArchetypes: unknown[] = Array.isArray(parsed.archetypes) ? parsed.archetypes : [];
      const expanded: string[] = rawArchetypes.flatMap((a) => normalizeArchetypeList(String(a)));
      const uniqueArchetypes = [...new Set(expanded)];

      // Landscapes: settings/places, up to 5
      const landscapes = (Array.isArray(parsed.landscapes)
        ? (parsed.landscapes as unknown[]).slice(0, 5).map((s) => String(s))
        : []) as string[];
      
      if (__DEV__) {
        console.log('[AI] Extracted:', { 
          symbolsCount: symbols.length, 
          archetypesCount: uniqueArchetypes.length,
          landscapesCount: landscapes.length,
          filteredAffect: parsed.symbols?.length - symbols.length || 0
        });
      }
      
      return { symbols, archetypes: uniqueArchetypes, landscapes };
    } catch (parseError) {
      // If JSON parsing fails, return empty arrays rather than using weak fallback
      // The fallback heuristic is disconnected from our format and often produces incorrect results
      if (__DEV__) {
        console.warn('[AI] JSON parse failed, returning empty arrays:', parseError);
        console.warn('[AI] Content that failed to parse (first 200 chars):', content.substring(0, 200));
      }
      logError('ai_extract_json_parse_error', parseError, { contentLength: content.length });
      return { symbols: [], archetypes: [], landscapes: [] };
    }
  } catch (error) {
    logError('ai_extract_symbols_error', error, { requestId, model });
    // Return empty arrays on error so the app doesn't break
    return { symbols: [], archetypes: [], landscapes: [] };
  }
};
