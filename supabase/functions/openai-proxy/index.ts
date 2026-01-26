import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY") ?? "";
const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

// CORS headers for mobile app
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-request-id, x-app-version",
};

serve(async (req) => {
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

    // Validate required fields
    if (!model || !messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: { message: "Invalid request: model and messages required" } }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build OpenAI request payload
    // Forward token parameter with the same name the client sent
    // Different models require different parameter names:
    // - gpt-5.x models require max_completion_tokens
    // - Older models use max_tokens
    // - Responses API uses max_output_tokens
    const payload: any = {
      model,
      messages,
      ...(temperature !== undefined && { temperature }),
    };
    
    // Forward the token parameter with the same name (don't convert)
    if (max_completion_tokens !== undefined) {
      payload.max_completion_tokens = max_completion_tokens;
    } else if (max_output_tokens !== undefined) {
      payload.max_output_tokens = max_output_tokens;
    } else if (max_tokens !== undefined) {
      payload.max_tokens = max_tokens;
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

    // Log for debugging (without sensitive data)
    console.log(`[openai-proxy] Request ${requestId}`, {
      model,
      status,
      appVersion,
      hasMessages: messages.length > 0,
      messageCount: messages.length,
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
