import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY") ?? "";
const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
const CHEAP_MODEL = Deno.env.get("OPENAI_MODEL_CHEAP") ?? "gpt-4o-mini";

type OneirosTask =
  | "interpretation_quick"
  | "interpretation_standard"
  | "interpretation_advanced"
  | "chat_followup"
  | "dream_extraction"
  | "pattern_insights"
  | "semantic_grouping";

const TASKS = new Set<OneirosTask>([
  "interpretation_quick",
  "interpretation_standard",
  "interpretation_advanced",
  "chat_followup",
  "dream_extraction",
  "pattern_insights",
  "semantic_grouping",
]);

function normalizeTask(task: unknown): OneirosTask | null {
  return typeof task === "string" && TASKS.has(task as OneirosTask)
    ? (task as OneirosTask)
    : null;
}

function envModel(name: string): string | null {
  const value = Deno.env.get(name)?.trim();
  return value || null;
}

function resolveModel(requestedModel: string, task: OneirosTask | null): string {
  switch (task) {
    case "dream_extraction":
      return envModel("OPENAI_MODEL_EXTRACTION") ?? CHEAP_MODEL;
    case "semantic_grouping":
      return envModel("OPENAI_MODEL_GROUPING") ?? CHEAP_MODEL;
    case "pattern_insights":
      return envModel("OPENAI_MODEL_PATTERN") ?? requestedModel;
    case "interpretation_quick":
    case "interpretation_standard":
    case "interpretation_advanced":
      return envModel("OPENAI_MODEL_INTERPRETATION") ?? requestedModel;
    case "chat_followup":
      return envModel("OPENAI_MODEL_CHAT") ?? envModel("OPENAI_MODEL_INTERPRETATION") ?? requestedModel;
    default:
      return envModel("OPENAI_MODEL_DEFAULT") ?? requestedModel;
  }
}

function tokenParameterForModel(model: string): "max_tokens" | "max_completion_tokens" {
  return /^gpt-5/i.test(model) || /^o\d/i.test(model)
    ? "max_completion_tokens"
    : "max_tokens";
}

// CORS headers for mobile app
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-request-id, x-app-version",
};

serve(async (req: Request) => {
  // Log immediately to verify function is being called
  console.log("[openai-proxy] Function called", {
    method: req.method,
    url: req.url,
    hasAuth: !!req.headers.get("authorization"),
    hasApikey: !!req.headers.get("apikey"),
  });

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Note: Supabase platform validates the anon key automatically
    // If we get here, the request passed Supabase's auth layer
    // We just need to check if OpenAI API key is configured

    if (!OPENAI_API_KEY) {
      console.error("[openai-proxy] OPENAI_API_KEY not set");
      return new Response(
        JSON.stringify({ error: { message: "Server configuration error" } }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Extract request metadata for logging
    const requestId = req.headers.get("x-request-id") || `req_${Date.now()}`;
    const appVersion = req.headers.get("x-app-version") || "unknown";

    // Parse request body
    const body = await req.json();
    const { model, messages, temperature, max_tokens, max_completion_tokens, max_output_tokens } = body;
    const task = normalizeTask(body.task);

    // Validate required fields
    if (!model || !messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: { message: "Invalid request: model and messages required" } }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const resolvedModel = resolveModel(model, task);

    // Build OpenAI request payload. The proxy owns model routing so clients cannot
    // accidentally make cheap structured tasks run on the premium interpretation model.
    const payload: any = {
      model: resolvedModel,
      messages,
      ...(temperature !== undefined && { temperature }),
    };
    
    const tokenLimit = max_completion_tokens ?? max_output_tokens ?? max_tokens;
    if (tokenLimit !== undefined) {
      payload[tokenParameterForModel(resolvedModel)] = tokenLimit;
    }

    // Forward request to OpenAI
    const openaiResponse = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    // Get response status and body
    const status = openaiResponse.status;
    const responseText = await openaiResponse.text();
    let usage: unknown = null;
    try {
      const parsedResponse = JSON.parse(responseText);
      usage = parsedResponse?.usage ?? null;
    } catch {
      usage = null;
    }

    // Log for debugging (without sensitive data)
    console.log(`[openai-proxy] Request ${requestId}`, {
      task: task ?? "unrouted",
      requestedModel: model,
      resolvedModel,
      status,
      appVersion,
      hasMessages: messages.length > 0,
      messageCount: messages.length,
      usage,
    });

    // Return response with CORS headers
    return new Response(responseText, {
      status,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "X-Request-Id": requestId, // Echo back request ID for client correlation
      },
    });
  } catch (error) {
    console.error("[openai-proxy] Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: { message: "Internal server error" } }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
