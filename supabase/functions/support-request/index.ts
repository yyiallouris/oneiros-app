// Login/support request: receive form, email support and send auto-reply via Resend.
// Env: RESEND_API_KEY, SUPPORT_EMAIL (default support@oneirosjournal.com), FROM_EMAIL (same for replies).

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const SUPPORT_EMAIL = Deno.env.get("SUPPORT_EMAIL") ?? "support@oneirosjournal.com";
const FROM_EMAIL = Deno.env.get("FROM_EMAIL") ?? "Oneiros Support <support@oneirosjournal.com>";

type Payload = { email?: string; message?: string };

const AUTO_REPLY_HTML = `
<p>Hi,</p>
<p>We've received your message and are looking into it. We'll get back to you as soon as we can.</p>
<p>Thanks,<br/>The Oneiros team</p>
`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: cors() });
  }
  try {
    if (!RESEND_API_KEY) {
      console.error("[support-request] RESEND_API_KEY not set.");
      return new Response(JSON.stringify({ error: "Server not configured" }), {
        status: 500,
        headers: { ...cors(), "Content-Type": "application/json" },
      });
    }

    const body = (await req.json()) as Payload;
    const email = (body?.email ?? "").trim();
    const message = (body?.message ?? "").trim();

    if (!email || !message) {
      return new Response(JSON.stringify({ error: "Email and message are required" }), {
        status: 400,
        headers: { ...cors(), "Content-Type": "application/json" },
      });
    }

    // 1) Notify support
    const supportResp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [SUPPORT_EMAIL],
        subject: `[Login support] Request from ${email}`,
        html: `
          <p><strong>From:</strong> ${escapeHtml(email)}</p>
          <p><strong>Message:</strong></p>
          <pre style="white-space: pre-wrap;">${escapeHtml(message)}</pre>
        `,
      }),
    });

    if (!supportResp.ok) {
      const errText = await supportResp.text();
      console.error("[support-request] Resend (to support) error:", supportResp.status, errText);
      return new Response(JSON.stringify({ error: "Failed to send request" }), {
        status: 502,
        headers: { ...cors(), "Content-Type": "application/json" },
      });
    }

    // 2) Auto-reply to user
    const replyResp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [email],
        subject: "We've received your message – Oneiros",
        html: AUTO_REPLY_HTML,
      }),
    });

    if (!replyResp.ok) {
      const errText = await replyResp.text();
      console.error("[support-request] Resend (auto-reply) error:", replyResp.status, errText);
      // Request was already sent to support; still return 200 so user sees success
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...cors(), "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[support-request] Unexpected error:", err);
    return new Response(JSON.stringify({ error: "Something went wrong" }), {
      status: 500,
      headers: { ...cors(), "Content-Type": "application/json" },
    });
  }
});

function cors() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
