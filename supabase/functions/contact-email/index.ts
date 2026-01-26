import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

type ContactRecord = {
  email?: string | null;
  target_email?: string | null;
  subject?: string | null;
  message?: string | null;
};

type Payload = {
  record?: ContactRecord;
};

const POSTMARK_TOKEN = Deno.env.get("POSTMARK_TOKEN") ?? "";
const CONTACT_EMAIL = Deno.env.get("CONTACT_EMAIL") ?? "";
const FROM_EMAIL = Deno.env.get("FROM_EMAIL") ?? "no-reply@yourdomain.com";

if (!POSTMARK_TOKEN) {
  console.warn("[contact-email] Missing POSTMARK_TOKEN environment variable.");
}

serve(async (req) => {
  try {
    const body = (await req.json()) as Payload;
    const record = body?.record ?? {};

    const to = record.target_email || CONTACT_EMAIL;
    if (!to) {
      console.error("[contact-email] No target_email in record and CONTACT_EMAIL not set.");
      return new Response("No target email configured", { status: 400 });
    }

    const subject = record.subject || "New contact message";
    const message = record.message || "(empty message)";
    const userEmail = record.email || "unknown";

    if (!POSTMARK_TOKEN) {
      return new Response("Email provider API key not configured", { status: 500 });
    }

    const resp = await fetch("https://api.postmarkapp.com/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Postmark-Server-Token": POSTMARK_TOKEN,
      },
      body: JSON.stringify({
        From: FROM_EMAIL,
        To: to,
        Subject: subject,
        HtmlBody: `
          <p><strong>From:</strong> ${userEmail}</p>
          <p><strong>Subject:</strong> ${subject}</p>
          <p><strong>Message:</strong></p>
          <pre style="white-space: pre-wrap;">${message}</pre>
        `,
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      console.error("[contact-email] Postmark error:", resp.status, errText);
      return new Response("Failed to send email", { status: 502 });
    }

    return new Response("ok", { status: 200 });
  } catch (err) {
    console.error("[contact-email] Unexpected error:", err);
    return new Response("Internal error", { status: 500 });
  }
});

