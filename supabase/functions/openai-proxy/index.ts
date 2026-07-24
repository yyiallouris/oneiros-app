import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { HttpError } from "../_shared/http.ts";
import { requireUser } from "../_shared/supabase.ts";
import { normalizeTask, type OneirosTask } from "./ai-routing.ts";
import { getTaskAiConfig, type TaskAiEntry } from "./task-config.ts";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY") ?? "";
const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
const CHEAP_MODEL = Deno.env.get("OPENAI_MODEL_CHEAP") ?? "gpt-4o-mini";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY") ?? "";
const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";

function envModel(name: string): string | null {
  let value = Deno.env.get(name)?.trim();
  if (!value) return null;
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1).trim();
  }
  return value || null;
}

/** When `task-config.ts` has model: null — same as before (env + app). */
function resolveOpenAIModel(requestedModel: string, task: OneirosTask | null): string {
  const globalModel = envModel("OPENAI_MODEL");
  if (globalModel) return globalModel;

  switch (task) {
    case "dream_extraction":
      return envModel("OPENAI_MODEL_EXTRACTION") ?? CHEAP_MODEL;
    case "semantic_grouping":
      return envModel("OPENAI_MODEL_GROUPING") ?? CHEAP_MODEL;
    case "pattern_insights":
    case "pattern_insights_retry_compact":
      return envModel("OPENAI_MODEL_PATTERN") ?? requestedModel;
    case "interpretation_quick":
    case "interpretation_standard":
    case "interpretation_advanced":
    case "interpretation_retry_compact":
      return envModel("OPENAI_MODEL_INTERPRETATION") ?? requestedModel;
    case "chat_followup":
      return envModel("OPENAI_MODEL_CHAT") ??
        envModel("OPENAI_MODEL_INTERPRETATION") ??
        requestedModel;
    default:
      return envModel("OPENAI_MODEL_DEFAULT") ?? requestedModel;
  }
}

function resolveAnthropicModelFromEnv(task: OneirosTask | null): string | null {
  switch (task) {
    case "pattern_insights":
    case "pattern_insights_retry_compact":
      return envModel("ANTHROPIC_MODEL_PATTERN");
    case "dream_extraction":
      return envModel("ANTHROPIC_MODEL_EXTRACTION");
    case "interpretation_quick":
    case "interpretation_standard":
    case "interpretation_advanced":
    case "interpretation_retry_compact":
      return envModel("ANTHROPIC_MODEL_INTERPRETATION");
    case "chat_followup":
      return envModel("ANTHROPIC_MODEL_CHAT") ??
        envModel("ANTHROPIC_MODEL_INTERPRETATION");
    case "semantic_grouping":
      return envModel("ANTHROPIC_MODEL_GROUPING");
    default:
      return envModel("ANTHROPIC_MODEL_DEFAULT");
  }
}

function tokenParameterForModel(model: string): "max_tokens" | "max_completion_tokens" {
  return /^gpt-5/i.test(model) || /^o\d/i.test(model)
    ? "max_completion_tokens"
    : "max_tokens";
}

function evaluateOpenAICompletionBody(body: string): {
  ok: true;
  text: string;
} | {
  ok: false;
  reason: "openai_invalid_json" | "openai_empty_content";
} {
  try {
    const data = JSON.parse(body) as { choices?: Array<{ message?: { content?: unknown } }> };
    const raw = data?.choices?.[0]?.message?.content;
    const text = typeof raw === "string" ? raw.trim() : "";
    if (!text) return { ok: false, reason: "openai_empty_content" };
    return { ok: true, text };
  } catch {
    return { ok: false, reason: "openai_invalid_json" };
  }
}

type ApiMessage = {
  role?: string;
  content?: unknown;
};

type AnthropicMessage = {
  role: "user" | "assistant";
  content: string;
};

function stringifyMessageContent(content: unknown): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === "string") return part;
        if (part && typeof part === "object" && "text" in part) {
          const text = (part as { text?: unknown }).text;
          return typeof text === "string" ? text : "";
        }
        return "";
      })
      .filter(Boolean)
      .join("\n");
  }
  return "";
}

function toAnthropicMessages(messages: ApiMessage[]): {
  system?: string;
  messages: AnthropicMessage[];
} {
  const systemParts: string[] = [];
  const converted: AnthropicMessage[] = [];

  for (const message of messages) {
    const role = message.role;
    const content = stringifyMessageContent(message.content).trim();
    if (!content) continue;

    if (role === "system" || role === "developer") {
      systemParts.push(content);
      continue;
    }

    const anthropicRole = role === "assistant" ? "assistant" : "user";
    const previous = converted.at(-1);
    if (previous?.role === anthropicRole) {
      previous.content = `${previous.content}\n\n${content}`;
    } else {
      converted.push({ role: anthropicRole, content });
    }
  }

  if (converted.length === 0) {
    converted.push({ role: "user", content: "Continue." });
  }

  return {
    system: systemParts.length > 0 ? systemParts.join("\n\n") : undefined,
    messages: converted,
  };
}

function anthropicMaxTokens(tokenLimit: unknown): number {
  const cap = 8192;
  if (typeof tokenLimit !== "number" || !Number.isFinite(tokenLimit)) {
    return Math.min(4096, cap);
  }
  const n = Math.floor(tokenLimit);
  return Math.min(Math.max(1, n), cap);
}

function anthropicHeaders() {
  return {
    "Content-Type": "application/json",
    "x-api-key": ANTHROPIC_API_KEY,
    "anthropic-version": ANTHROPIC_VERSION,
  };
}

function anthropicTextContent(anthropicData: any): string {
  return Array.isArray(anthropicData?.content)
    ? anthropicData.content
      .map((part: any) => (typeof part?.text === "string" ? part.text : ""))
      .filter(Boolean)
      .join("")
    : "";
}

function toOpenAICompatibleResponse(
  anthropicData: any,
  model: string,
  requestId: string,
): string {
  const content = anthropicTextContent(anthropicData);
  const inputTokens = anthropicData?.usage?.input_tokens ?? 0;
  const outputTokens = anthropicData?.usage?.output_tokens ?? 0;

  return JSON.stringify({
    id: anthropicData?.id ?? requestId,
    object: "chat.completion",
    created: Math.floor(Date.now() / 1000),
    model,
    choices: [
      {
        index: 0,
        message: {
          role: "assistant",
          content,
        },
        finish_reason: anthropicData?.stop_reason ?? "stop",
      },
    ],
    usage: {
      prompt_tokens: inputTokens,
      completion_tokens: outputTokens,
      total_tokens: inputTokens + outputTokens,
    },
  });
}

function shouldTryAnthropicAfterOpenAI(
  taskCfg: TaskAiEntry,
  oaResponse: Response,
  responseText: string,
): boolean {
  const fb = taskCfg.fallbackAnthropicModel?.trim();
  if (!fb || !ANTHROPIC_API_KEY || taskCfg.provider !== "openai") return false;
  if (!oaResponse.ok) {
    return oaResponse.status === 429 || oaResponse.status >= 500;
  }
  const ev = evaluateOpenAICompletionBody(responseText);
  return !ev.ok;
}

/** Success path only; returns null if JSON/content invalid. */
function responseFromAnthropicSuccess(
  requestId: string,
  raw: string,
  resolvedModel: string,
  log: {
    dreamId: string | null;
    task: string;
    requestedModel: unknown;
    appVersion: string;
    userId: string;
    messageCount: number;
    usedFallback: boolean;
    upstreamMs?: number;
  },
): Response | null {
  let anthropicData: unknown;
  try {
    anthropicData = JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
  const ad = anthropicData as Record<string, unknown>;
  if (anthropicTextContent(ad).trim().length === 0) return null;

  const responseText = toOpenAICompatibleResponse(ad, resolvedModel, requestId);
  let usage: unknown = null;
  try {
    usage = JSON.parse(responseText)?.usage ?? null;
  } catch {
    usage = null;
  }

  console.log(`[openai-proxy] Request ${requestId}`, {
    dreamId: log.dreamId,
    task: log.task,
    requestedModel: log.requestedModel,
    resolvedModel,
    provider: "anthropic",
    status: 200,
    appVersion: log.appVersion,
    userId: log.userId,
    messageCount: log.messageCount,
    usage,
    usedFallback: log.usedFallback,
    upstreamMs: log.upstreamMs,
  });

  const headers: Record<string, string> = {
    ...corsHeaders,
    "Content-Type": "application/json",
    "X-Request-Id": requestId,
    "X-AI-Provider": "anthropic",
    "X-AI-Model": resolvedModel,
  };
  if (log.usedFallback) headers["X-AI-Fallback"] = "1";
  if (typeof log.upstreamMs === "number") headers["X-AI-Upstream-Ms"] = String(log.upstreamMs);

  return new Response(responseText, {
    status: 200,
    headers,
  });
}

function openAIHeaders() {
  return {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${OPENAI_API_KEY}`,
  };
}

async function callOpenAI(
  model: string,
  messages: ApiMessage[],
  temperature: unknown,
  tokenLimit: unknown,
  responseFormat: unknown,
  stream: unknown,
  streamOptions: unknown,
): Promise<Response> {
  const payload: Record<string, unknown> = {
    model,
    messages,
    ...(temperature !== undefined && { temperature }),
    ...(responseFormat !== undefined && { response_format: responseFormat }),
    ...(stream !== undefined && { stream }),
    ...(streamOptions !== undefined && { stream_options: streamOptions }),
  };

  if (tokenLimit !== undefined) {
    payload[tokenParameterForModel(model)] = tokenLimit;
  }

  return await fetch(OPENAI_API_URL, {
    method: "POST",
    headers: openAIHeaders(),
    body: JSON.stringify(payload),
  });
}

async function callAnthropic(
  model: string,
  messages: ApiMessage[],
  temperature: unknown,
  tokenLimit: unknown,
): Promise<Response> {
  const converted = toAnthropicMessages(messages);
  const payload: Record<string, unknown> = {
    model,
    messages: converted.messages,
    max_tokens: anthropicMaxTokens(tokenLimit),
    ...(converted.system && { system: converted.system }),
  };
  if (typeof temperature === "number" && Number.isFinite(temperature)) {
    payload.temperature = temperature;
  }

  return await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: anthropicHeaders(),
    body: JSON.stringify(payload),
  });
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-request-id, x-app-version, x-dream-id",
  "Access-Control-Expose-Headers":
    "x-request-id, x-ai-provider, x-ai-model",
};

function proxyJsonError(message: string, status: number): Response {
  return new Response(
    JSON.stringify({ error: { message } }),
    { status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
}

serve(async (req: Request) => {
  console.log("[openai-proxy] Function called", {
    method: req.method,
    url: req.url,
    hasAuth: !!req.headers.get("authorization"),
    hasApikey: !!req.headers.get("apikey"),
  });

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return proxyJsonError("Method not allowed", 405);
  }

  try {
    const { userId } = await requireUser(req);
    const requestId = req.headers.get("x-request-id") || `req_${Date.now()}`;
    const appVersion = req.headers.get("x-app-version") || "unknown";
    const dreamId = req.headers.get("x-dream-id")?.trim() || null;

    const body = await req.json();
    const {
      model,
      messages,
      temperature,
      max_tokens,
      max_completion_tokens,
      max_output_tokens,
      response_format,
      stream,
      stream_options,
    } =
      body;
    const task = normalizeTask(body.task);
    const taskCfg = getTaskAiConfig(task);

    if (!model || !messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: { message: "Invalid request: model and messages required" } }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const tokenLimit = max_completion_tokens ?? max_output_tokens ?? max_tokens;

    if (taskCfg.provider === "openai") {
      if (!OPENAI_API_KEY) {
        console.error("[openai-proxy] OPENAI_API_KEY not set");
        return new Response(
          JSON.stringify({ error: { message: "Server configuration error" } }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      const resolvedModel =
        (typeof taskCfg.model === "string" && taskCfg.model.trim().length > 0)
          ? taskCfg.model.trim()
          : resolveOpenAIModel(model, task);

      const upstreamStart = Date.now();
      const oaResponse = await callOpenAI(
        resolvedModel,
        messages,
        temperature,
        tokenLimit,
        response_format,
        stream,
        stream_options,
      );
      const openAIUpstreamMs = Date.now() - upstreamStart;
      if (stream === true && oaResponse.ok) {
        console.log(`[openai-proxy] Request ${requestId}`, {
          dreamId,
          task: task ?? "unrouted",
          requestedModel: model,
          resolvedModel,
          provider: "openai",
          status: oaResponse.status,
          appVersion,
          userId,
          messageCount: messages.length,
          stream: true,
          upstreamMs: openAIUpstreamMs,
        });

        return new Response(oaResponse.body, {
          status: oaResponse.status,
          headers: {
            ...corsHeaders,
            "Content-Type": oaResponse.headers.get("Content-Type") ?? "text/event-stream",
            "X-Request-Id": requestId,
            "X-AI-Provider": "openai",
            "X-AI-Model": resolvedModel,
            "X-AI-Upstream-Ms": String(openAIUpstreamMs),
          },
        });
      }

      let responseText = await oaResponse.text();

      if (shouldTryAnthropicAfterOpenAI(taskCfg, oaResponse, responseText)) {
        const fbModel = taskCfg.fallbackAnthropicModel!.trim();
        const fallbackStart = Date.now();
        const ar = await callAnthropic(fbModel, messages, temperature, tokenLimit);
        const fallbackUpstreamMs = Date.now() - fallbackStart;
        const raw = await ar.text();
        if (ar.ok) {
          const fbResp = responseFromAnthropicSuccess(requestId, raw, fbModel, {
            dreamId,
            task: task ?? "unrouted",
            requestedModel: model,
            appVersion,
          userId,
            messageCount: messages.length,
            usedFallback: true,
            upstreamMs: openAIUpstreamMs + fallbackUpstreamMs,
          });
          if (fbResp) return fbResp;
        }
      }

      let usage: unknown = null;
      try {
        usage = JSON.parse(responseText)?.usage ?? null;
      } catch {
        usage = null;
      }

      if (!oaResponse.ok) {
        console.log(`[openai-proxy] Request ${requestId}`, {
          dreamId,
          task: task ?? "unrouted",
          requestedModel: model,
          resolvedModel,
          provider: "openai",
          status: oaResponse.status,
          appVersion,
          userId,
          messageCount: messages.length,
          usage,
          upstreamMs: openAIUpstreamMs,
        });
        return new Response(responseText, {
          status: oaResponse.status,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
            "X-Request-Id": requestId,
            "X-AI-Provider": "openai",
            "X-AI-Model": resolvedModel,
            "X-AI-Upstream-Ms": String(openAIUpstreamMs),
          },
        });
      }

      const ev = evaluateOpenAICompletionBody(responseText);
      if (!ev.ok) {
        console.log(`[openai-proxy] Request ${requestId}`, {
          dreamId,
          task: task ?? "unrouted",
          requestedModel: model,
          resolvedModel,
          provider: "openai",
          invalidBody: ev.reason,
          status: oaResponse.status,
          appVersion,
          userId,
          upstreamMs: openAIUpstreamMs,
        });
        return new Response(responseText, {
          status: oaResponse.status,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
            "X-Request-Id": requestId,
            "X-AI-Provider": "openai",
            "X-AI-Model": resolvedModel,
            "X-AI-Upstream-Ms": String(openAIUpstreamMs),
          },
        });
      }

      console.log(`[openai-proxy] Request ${requestId}`, {
        dreamId,
        task: task ?? "unrouted",
        requestedModel: model,
        resolvedModel,
        provider: "openai",
        status: oaResponse.status,
        appVersion,
        userId,
        messageCount: messages.length,
        usage,
        upstreamMs: openAIUpstreamMs,
      });

      return new Response(responseText, {
        status: oaResponse.status,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
          "X-Request-Id": requestId,
          "X-AI-Provider": "openai",
          "X-AI-Model": resolvedModel,
          "X-AI-Upstream-Ms": String(openAIUpstreamMs),
        },
      });
    }

    // anthropic
    if (!ANTHROPIC_API_KEY) {
      console.error("[openai-proxy] ANTHROPIC_API_KEY not set (task-config uses anthropic)");
      return new Response(
        JSON.stringify({ error: { message: "Anthropic not configured on server" } }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const resolvedModel =
      (typeof taskCfg.model === "string" && taskCfg.model.trim().length > 0)
        ? taskCfg.model.trim()
        : resolveAnthropicModelFromEnv(task);

    if (!resolvedModel) {
      return new Response(
        JSON.stringify({
          error: {
            message:
              "No Anthropic model: set model in task-config.ts or ANTHROPIC_MODEL_* secret for this task",
          },
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const upstreamStart = Date.now();
    const ar = await callAnthropic(resolvedModel, messages, temperature, tokenLimit);
    const anthropicUpstreamMs = Date.now() - upstreamStart;
    const raw = await ar.text();

    if (!ar.ok) {
      console.log(`[openai-proxy] Request ${requestId}`, {
        dreamId,
        task: task ?? "unrouted",
        requestedModel: model,
        resolvedModel,
        provider: "anthropic",
        status: ar.status,
        appVersion,
        userId,
        upstreamMs: anthropicUpstreamMs,
      });
      return new Response(raw, {
        status: ar.status,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
          "X-Request-Id": requestId,
          "X-AI-Provider": "anthropic",
          "X-AI-Model": resolvedModel,
          "X-AI-Upstream-Ms": String(anthropicUpstreamMs),
        },
      });
    }

    let anthropicData: any;
    try {
      anthropicData = JSON.parse(raw);
    } catch {
      return new Response(
        JSON.stringify({ error: { message: "Invalid Anthropic response" } }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (anthropicTextContent(anthropicData).trim().length === 0) {
      return new Response(
        JSON.stringify({ error: { message: "Empty Anthropic content" } }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const responseText = toOpenAICompatibleResponse(anthropicData, resolvedModel, requestId);
    let usage: unknown = null;
    try {
      usage = JSON.parse(responseText)?.usage ?? null;
    } catch {
      usage = null;
    }

    console.log(`[openai-proxy] Request ${requestId}`, {
      dreamId,
      task: task ?? "unrouted",
      requestedModel: model,
      resolvedModel,
      provider: "anthropic",
      status: 200,
      appVersion,
      userId,
      messageCount: messages.length,
      usage,
      upstreamMs: anthropicUpstreamMs,
    });

    return new Response(responseText, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "X-Request-Id": requestId,
        "X-AI-Provider": "anthropic",
        "X-AI-Model": resolvedModel,
        "X-AI-Upstream-Ms": String(anthropicUpstreamMs),
      },
    });
  } catch (error) {
    if (error instanceof HttpError) {
      console.error("[openai-proxy]", error.message, error.details ?? "");
      return proxyJsonError(error.status === 401 ? "Unauthorized" : error.message, error.status);
    }

    console.error("[openai-proxy] Unexpected error:", error);
    return proxyJsonError("Internal server error", 500);
  }
});
