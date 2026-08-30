// Shared support endpoint for signed-in Contact and signed-out Login Support.
// The server owns the destination address, persists authenticated requests,
// notifies support through Resend, and sends a best-effort acknowledgement.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const SUPPORT_EMAIL = Deno.env.get("SUPPORT_EMAIL") ?? "support@oneirosjournal.com";
const FROM_EMAIL = Deno.env.get("FROM_EMAIL") ?? "Oneiros Support <support@oneirosjournal.com>";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const MAX_EMAIL_LENGTH = 320;
const MAX_SUBJECT_LENGTH = 160;
const MAX_MESSAGE_LENGTH = 10_000;

type Payload = { email?: string; subject?: string; message?: string };
type AuthenticatedUser = { id: string; email: string };

const AUTO_REPLY_HTML = `
<p>Hi,</p>
<p>We've received your message and are looking into it. We'll get back to you as soon as we can.</p>
<p>Thanks,<br/>The Oneiros team</p>
`;

serve(async (req: Request) => {
  const requestId = crypto.randomUUID();
  let stage = "request_validation";

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: cors() });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  try {
    if (
      !RESEND_API_KEY ||
      !SUPABASE_URL ||
      !SUPABASE_ANON_KEY ||
      !SUPABASE_SERVICE_ROLE_KEY
    ) {
      console.error("[support-request] Missing server configuration", {
        request_id: requestId,
      });
      return json({ error: "Server not configured", request_id: requestId }, 500);
    }

    const body = (await req.json()) as Payload;
    stage = "user_resolution";
    let authenticatedUser: AuthenticatedUser | null = null;
    try {
      authenticatedUser = await resolveAuthenticatedUser(req);
    } catch (error) {
      // Support remains available when optional account resolution is unavailable.
      console.error("[support-request] User resolution failed", {
        request_id: requestId,
        name: error instanceof Error ? error.name : "unknown",
      });
    }
    const email = (authenticatedUser?.email || body?.email || "").trim();
    const subject = normalizeSubject(body?.subject);
    const message = (body?.message ?? "").trim();

    if (!isValidEmail(email) || !message) {
      return json({ error: "A valid email and message are required", request_id: requestId }, 400);
    }

    if (message.length > MAX_MESSAGE_LENGTH) {
      return json({ error: "Message is too long", request_id: requestId }, 400);
    }

    let persisted = false;
    if (authenticatedUser) {
      stage = "authenticated_persistence";
      try {
        await persistAuthenticatedRequest({
          userId: authenticatedUser.id,
          email,
          subject,
          message,
          requestId,
        });
        persisted = true;
      } catch {
        // Delivery is the product contract. The optional archive must never block it.
      }
    }

    stage = "support_delivery";
    const supportResp = await sendEmail({
      from: FROM_EMAIL,
      to: [SUPPORT_EMAIL],
      reply_to: email,
      subject: `[Oneiros support] ${subject || "Support request"}`,
      html: `
        <p><strong>Account:</strong> ${authenticatedUser ? "signed in" : "signed out"}</p>
        <p><strong>From:</strong> ${escapeHtml(email)}</p>
        ${subject ? `<p><strong>Subject:</strong> ${escapeHtml(subject)}</p>` : ""}
        <p><strong>Message:</strong></p>
        <pre style="white-space: pre-wrap;">${escapeHtml(message)}</pre>
      `,
    });

    if (!supportResp.ok) {
      console.error("[support-request] Support delivery failed", {
        request_id: requestId,
        status: supportResp.status,
      });
      return json({ error: "Failed to send request", request_id: requestId }, 502);
    }

    stage = "acknowledgement_delivery";
    const replyResp = await sendEmail({
      from: FROM_EMAIL,
      to: [email],
      reply_to: SUPPORT_EMAIL,
      subject: "We've received your message – Oneiros",
      html: AUTO_REPLY_HTML,
    });

    if (!replyResp.ok) {
      console.error("[support-request] Auto-reply delivery failed", {
        request_id: requestId,
        status: replyResp.status,
      });
      // Support already received the request; acknowledgement remains best-effort.
    }

    console.log("[support-request] Request accepted", {
      request_id: requestId,
      authenticated: Boolean(authenticatedUser),
      persisted,
      acknowledgement_sent: replyResp.ok,
    });
    return json({ ok: true, request_id: requestId }, 200);
  } catch (error) {
    console.error("[support-request] Unexpected failure", {
      request_id: requestId,
      stage,
      name: error instanceof Error ? error.name : "unknown",
    });
    return json({ error: "Something went wrong", request_id: requestId }, 500);
  }
});

async function resolveAuthenticatedUser(req: Request): Promise<AuthenticatedUser | null> {
  const authHeader = req.headers.get("authorization") ?? "";
  if (!authHeader.toLowerCase().startsWith("bearer ")) return null;

  const userResp = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      authorization: authHeader,
    },
  });

  if (!userResp.ok) return null;

  const user = (await userResp.json()) as { id?: string; email?: string };
  const email = user.email?.trim() ?? "";
  if (!user.id || !isValidEmail(email)) return null;

  return { id: user.id, email };
}

async function persistAuthenticatedRequest(input: {
  userId: string;
  email: string;
  subject: string;
  message: string;
  requestId: string;
}): Promise<void> {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/contact_messages`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      prefer: "return=minimal",
    },
    body: JSON.stringify({
      user_id: input.userId,
      email: input.email,
      target_email: SUPPORT_EMAIL,
      subject: input.subject,
      message: input.message,
    }),
  });

  if (!response.ok) {
    const payload = await readFailureMetadata(response);
    console.error("[support-request] Persistence failed", {
      request_id: input.requestId,
      status: response.status,
      code: payload.code,
    });
    throw new Error("support_request_persistence_failed");
  }
}

async function readFailureMetadata(response: Response): Promise<{ code: string | null }> {
  try {
    const body = (await response.json()) as { code?: unknown; name?: unknown };
    const candidate = body.code ?? body.name;
    return { code: typeof candidate === "string" ? candidate.slice(0, 80) : null };
  } catch {
    return { code: null };
  }
}

function sendEmail(payload: {
  from: string;
  to: string[];
  reply_to: string;
  subject: string;
  html: string;
}): Promise<Response> {
  return fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify(payload),
  });
}

function normalizeSubject(value: string | undefined): string {
  return (value ?? "").replace(/[\r\n]+/g, " ").trim().slice(0, MAX_SUBJECT_LENGTH);
}

function isValidEmail(value: string): boolean {
  return (
    value.length > 0 &&
    value.length <= MAX_EMAIL_LENGTH &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
  );
}

function json(body: Record<string, unknown>, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors(), "Content-Type": "application/json" },
  });
}

function cors() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
