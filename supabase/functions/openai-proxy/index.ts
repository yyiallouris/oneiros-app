import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { HttpError } from "../_shared/http.ts";
import { requireUser } from "../_shared/supabase.ts";
import { normalizeTask, type OneirosTask } from "./ai-routing.ts";
import {
  getAnthropicFallbackModels,
  getTaskAiConfig,
  missingOrUnknownTaskMessage,
  type TaskAiEntry,
} from "./task-config.ts";
import {
  buildStructuredRepairMessages,
  isStructuredAiTask,
  safeAssistantJsonDiagnostics,
  safeStructuredValidationLog,
  validateStructuredTaskContent,
  type StructuredAiTask,
} from "../_shared/structuredTaskValidation.ts";
import {
  shouldOmitSamplingTemperature,
  temperatureForProvider,
} from "../_shared/modelSamplingParams.ts";

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
  finishReason: string | null;
} | {
  ok: false;
  reason: "openai_invalid_json" | "openai_empty_content";
  finishReason: string | null;
} {
  try {
    const data = JSON.parse(body) as {
      choices?: Array<{ message?: { content?: unknown }; finish_reason?: unknown }>;
    };
    const choice = data?.choices?.[0];
    const finishReason = typeof choice?.finish_reason === "string" ? choice.finish_reason : null;
    const raw = choice?.message?.content;
    const text = typeof raw === "string" ? raw.trim() : "";
    if (!text) return { ok: false, reason: "openai_empty_content", finishReason };
    return { ok: true, text, finishReason };
  } catch {
    return { ok: false, reason: "openai_invalid_json", finishReason: null };
  }
}

function replaceOpenAIAssistantContent(body: string, content: string): string {
  const data = JSON.parse(body) as {
    choices?: Array<{ message?: { role?: string; content?: unknown } }>;
  };
  if (!data.choices?.[0]) {
    data.choices = [{ message: { role: "assistant", content } }];
  } else if (!data.choices[0].message) {
    data.choices[0].message = { role: "assistant", content };
  } else {
    data.choices[0].message.content = content;
  }
  return JSON.stringify(data);
}

function extractAssistantContentFromOpenAIBody(body: string): string {
  const ev = evaluateOpenAICompletionBody(body);
  return ev.ok ? ev.text : "";
}

type StructuredRejectionDiagnostics = {
  failureCode: "structured_schema_invalid";
  validationStage: string;
  schemaErrors: string[];
  schemaErrorCount: number;
  contentLength: number;
  looksTruncated: boolean;
  startsWithJson: boolean;
  endsWithJsonCloser: boolean;
  openBraceDelta: number;
  finishReason: string | null;
  provider: string;
  model: string;
  repairAttempted: boolean;
  tokenLimit: number | null;
};

async function maybeValidateAndRepairStructured(params: {
  task: OneirosTask;
  responseText: string;
  messages: ApiMessage[];
  provider: "openai" | "anthropic";
  model: string;
  temperature: unknown;
  tokenLimit: unknown;
  responseFormat: unknown;
  requestId: string;
}): Promise<
  | { responseText: string; rejected: false }
  | { responseText: string; rejected: true; diagnostics: StructuredRejectionDiagnostics }
> {
  if (!isStructuredAiTask(params.task)) {
    return { responseText: params.responseText, rejected: false };
  }

  const task = params.task as StructuredAiTask;
  const evaluated = evaluateOpenAICompletionBody(params.responseText);
  const content = evaluated.ok ? evaluated.text : "";
  const finishReason = evaluated.finishReason;
  const tokenLimit =
    typeof params.tokenLimit === "number" && Number.isFinite(params.tokenLimit)
      ? Math.floor(params.tokenLimit)
      : null;

  const buildDiagnostics = (
    schemaErrors: string[],
    validationStage: string,
    repairAttempted: boolean,
    sampleContent: string,
  ): StructuredRejectionDiagnostics => {
    const shape = safeAssistantJsonDiagnostics(sampleContent);
    return {
      failureCode: "structured_schema_invalid",
      validationStage,
      schemaErrors: schemaErrors.slice(0, 12),
      schemaErrorCount: schemaErrors.length,
      contentLength: shape.contentLength,
      looksTruncated: shape.looksTruncated || finishReason === "length",
      startsWithJson: shape.startsWithJson,
      endsWithJsonCloser: shape.endsWithJsonCloser,
      openBraceDelta: shape.openBraceDelta,
      finishReason,
      provider: params.provider,
      model: params.model,
      repairAttempted,
      tokenLimit,
    };
  };

  const first = validateStructuredTaskContent(task, content, {
    provider: params.provider,
    repairAttempted: false,
  });

  if (first.ok) {
    if (task === "dream_extraction") {
      console.log("[echo-debug-flow]", {
        stage: "proxy_validate_ok",
        rawHasDiagnostics: content.includes('"interpretive_diagnostics"'),
        normalizedHasDiagnostics: first.normalizedContent.includes('"interpretive_diagnostics"'),
        finishReason,
        model: params.model,
        tokenLimit,
      });
    }
    console.log(
      `[openai-proxy] structured validation`,
      {
        ...safeStructuredValidationLog(first.log),
        ...safeAssistantJsonDiagnostics(content),
        finishReason,
        model: params.model,
        tokenLimit,
      },
    );
    return {
      responseText: replaceOpenAIAssistantContent(params.responseText, first.normalizedContent),
      rejected: false,
    };
  }

  console.log(
    `[openai-proxy] structured validation`,
    {
      ...safeStructuredValidationLog(first.log),
      ...safeAssistantJsonDiagnostics(content),
      finishReason,
      model: params.model,
      tokenLimit,
    },
  );

  const repairMessages = buildStructuredRepairMessages(
    task,
    params.messages.map((m) => ({
      role: typeof m.role === "string" ? m.role : "user",
      content: stringifyMessageContent(m.content),
    })),
    content,
    first.schemaErrors,
  );

  let repairedContent = "";
  if (params.provider === "anthropic") {
    const ar = await callAnthropic(params.model, repairMessages, 0, params.tokenLimit);
    const raw = await ar.text();
    if (!ar.ok) {
      const diagnostics = buildDiagnostics(first.schemaErrors, "rejected", true, content);
      console.log(`[openai-proxy] structured repair failed`, {
        ...diagnostics,
        upstreamStatus: ar.status,
      });
      return { responseText: params.responseText, rejected: true, diagnostics };
    }
    try {
      const anthropicData = JSON.parse(raw) as unknown;
      repairedContent = anthropicTextContent(anthropicData as Record<string, unknown>).trim();
    } catch {
      repairedContent = "";
    }
  } else {
    const oa = await callOpenAI(
      params.model,
      repairMessages,
      0,
      params.tokenLimit,
      params.responseFormat ?? { type: "json_object" },
      false,
      undefined,
    );
    const repairedBody = await oa.text();
    if (!oa.ok) {
      const diagnostics = buildDiagnostics(first.schemaErrors, "rejected", true, content);
      console.log(`[openai-proxy] structured repair failed`, {
        ...diagnostics,
        upstreamStatus: oa.status,
      });
      return { responseText: params.responseText, rejected: true, diagnostics };
    }
    repairedContent = extractAssistantContentFromOpenAIBody(repairedBody);
  }

  const second = validateStructuredTaskContent(task, repairedContent, {
    provider: params.provider,
    repairAttempted: true,
    stage: "repair_schema",
  });
  console.log(
    `[openai-proxy] structured validation`,
    safeStructuredValidationLog(
      second.ok
        ? second.log
        : {
          ...second.log,
          validationStage: "rejected",
          repairSucceeded: false,
        },
    ),
  );

  if (!second.ok) {
    const diagnostics = buildDiagnostics(second.schemaErrors, "rejected", true, repairedContent || content);
    console.log(`[openai-proxy] structured validation rejected`, diagnostics);
    return { responseText: params.responseText, rejected: true, diagnostics };
  }

  return {
    responseText: replaceOpenAIAssistantContent(params.responseText, second.normalizedContent),
    rejected: false,
  };
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
  if (!ANTHROPIC_API_KEY || taskCfg.provider !== "openai") return false;
  if (getAnthropicFallbackModels(taskCfg).length === 0) return false;
  if (!oaResponse.ok) {
    // Include 400: OpenAI often rejects unsupported sampling params with 400.
    // Fallback must still run (with Anthropic-safe params) or reflection dies.
    return oaResponse.status === 400 || oaResponse.status === 429 || oaResponse.status >= 500;
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
  const safeTemperature = temperatureForProvider("openai", model, temperature);
  const payload: Record<string, unknown> = {
    model,
    messages,
    ...(safeTemperature !== undefined && { temperature: safeTemperature }),
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
  const safeTemperature = temperatureForProvider("anthropic", model, temperature);
  const payload: Record<string, unknown> = {
    model,
    messages: converted.messages,
    max_tokens: anthropicMaxTokens(tokenLimit),
    ...(converted.system && { system: converted.system }),
  };
  if (safeTemperature !== undefined) {
    payload.temperature = safeTemperature;
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

function proxyJsonError(message: string, status: number, details?: Record<string, unknown>): Response {
  return new Response(
    JSON.stringify(
      details
        ? { error: { message, code: details.failureCode ?? null, details } }
        : { error: { message } },
    ),
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
    if (!task) {
      return proxyJsonError(missingOrUnknownTaskMessage(body.task), 400);
    }
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

      if (!oaResponse.ok) {
        let openAIErrorCode: string | null = null;
        let openAIErrorMessage: string | null = null;
        try {
          const parsed = JSON.parse(responseText) as {
            error?: { code?: string; type?: string; message?: string };
          };
          openAIErrorCode = parsed?.error?.code ?? parsed?.error?.type ?? null;
          openAIErrorMessage =
            typeof parsed?.error?.message === "string"
              ? parsed.error.message.slice(0, 180)
              : null;
        } catch {
          // non-JSON error body
        }
        console.error(`[openai-proxy] openai upstream failed`, {
          requestId,
          task,
          resolvedModel,
          status: oaResponse.status,
          openAIErrorCode,
          openAIErrorMessage,
          stream: stream === true,
          upstreamMs: openAIUpstreamMs,
          willTryAnthropicFallback: shouldTryAnthropicAfterOpenAI(taskCfg, oaResponse, responseText),
        });
      }

      if (shouldTryAnthropicAfterOpenAI(taskCfg, oaResponse, responseText)) {
        const fallbackModels = getAnthropicFallbackModels(taskCfg);
        let fallbackUpstreamTotalMs = 0;
        console.log(`[openai-proxy] anthropic fallback chain start`, {
          requestId,
          task,
          openAIStatus: oaResponse.status,
          openAIModel: resolvedModel,
          fallbackModels,
        });

        for (let i = 0; i < fallbackModels.length; i += 1) {
          const fbModel = fallbackModels[i];
          const fallbackStart = Date.now();
          console.log(`[openai-proxy] anthropic fallback attempt`, {
            requestId,
            task,
            attempt: i + 1,
            fallbackModel: fbModel,
            omittedTemperature: shouldOmitSamplingTemperature("anthropic", fbModel),
          });
          const ar = await callAnthropic(fbModel, messages, temperature, tokenLimit);
          const fallbackUpstreamMs = Date.now() - fallbackStart;
          fallbackUpstreamTotalMs += fallbackUpstreamMs;
          const raw = await ar.text();

          if (ar.ok) {
            const fbResp = responseFromAnthropicSuccess(requestId, raw, fbModel, {
              dreamId,
              task,
              requestedModel: model,
              appVersion,
              userId,
              messageCount: messages.length,
              usedFallback: true,
              upstreamMs: openAIUpstreamMs + fallbackUpstreamTotalMs,
            });
            if (fbResp) {
              const fbText = await fbResp.clone().text();
              const finalized = await maybeValidateAndRepairStructured({
                task,
                responseText: fbText,
                messages,
                provider: "anthropic",
                model: fbModel,
                temperature,
                tokenLimit,
                responseFormat: response_format,
                requestId,
              });
              if (finalized.rejected) {
                console.error(`[openai-proxy] anthropic fallback schema rejected`, {
                  requestId,
                  task,
                  fallbackModel: fbModel,
                  attempt: i + 1,
                });
                // Try next Anthropic model if any remain.
                continue;
              }
              console.log(`[openai-proxy] anthropic fallback succeeded`, {
                requestId,
                task,
                fallbackModel: fbModel,
                attempt: i + 1,
                fallbackUpstreamMs,
              });
              return new Response(finalized.responseText, {
                status: 200,
                headers: {
                  ...corsHeaders,
                  "Content-Type": "application/json",
                  "X-Request-Id": requestId,
                  "X-AI-Provider": "anthropic",
                  "X-AI-Model": fbModel,
                  "X-AI-Fallback": "1",
                  "X-AI-Upstream-Ms": String(openAIUpstreamMs + fallbackUpstreamTotalMs),
                },
              });
            }
            console.error(`[openai-proxy] anthropic fallback empty/invalid body`, {
              requestId,
              task,
              fallbackModel: fbModel,
              fallbackStatus: ar.status,
              fallbackUpstreamMs,
              attempt: i + 1,
            });
            continue;
          }

          let fallbackErrorCode: string | null = null;
          let fallbackMessage: string | null = null;
          try {
            const parsed = JSON.parse(raw) as { error?: { type?: string; message?: string } };
            fallbackErrorCode = parsed?.error?.type ?? null;
            fallbackMessage =
              typeof parsed?.error?.message === "string"
                ? parsed.error.message.slice(0, 180)
                : null;
          } catch {
            // non-JSON error body
          }
          console.error(`[openai-proxy] anthropic fallback failed`, {
            requestId,
            task,
            openAIStatus: oaResponse.status,
            fallbackModel: fbModel,
            fallbackStatus: ar.status,
            fallbackErrorCode,
            fallbackMessage,
            fallbackUpstreamMs,
            attempt: i + 1,
            remainingFallbacks: fallbackModels.length - i - 1,
          });
        }

        console.error(`[openai-proxy] anthropic fallback chain exhausted`, {
          requestId,
          task,
          openAIStatus: oaResponse.status,
          fallbackModels,
        });
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
        task,
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

      const finalized = await maybeValidateAndRepairStructured({
        task,
        responseText,
        messages,
        provider: "openai",
        model: resolvedModel,
        temperature,
        tokenLimit,
        responseFormat: response_format,
        requestId,
      });
      if (finalized.rejected) {
        return proxyJsonError(
          "Structured AI response failed schema validation",
          502,
          finalized.diagnostics,
        );
      }

      return new Response(finalized.responseText, {
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
      task,
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

    const finalized = await maybeValidateAndRepairStructured({
      task,
      responseText,
      messages,
      provider: "anthropic",
      model: resolvedModel,
      temperature,
      tokenLimit,
      responseFormat: response_format,
      requestId,
    });
    if (finalized.rejected) {
      return proxyJsonError(
        "Structured AI response failed schema validation",
        502,
        finalized.diagnostics,
      );
    }

    return new Response(finalized.responseText, {
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

    const errName = error instanceof Error ? error.name : "UnknownError";
    const errMessage = error instanceof Error ? error.message : "Unexpected server error";
    console.error("[openai-proxy] Unexpected error:", {
      name: errName,
      message: errMessage,
    });
    return proxyJsonError("Internal server error", 500, {
      failureCode: "proxy_unhandled_exception",
      upstreamErrorCode: errName,
      upstreamMessage: errMessage.slice(0, 240),
    });
  }
});
