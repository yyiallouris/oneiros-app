import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const USER_TABLES = [
  "pattern_reports",
  "user_settings",
  "interpretations",
  "dreams",
  "contact_messages",
];

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: cors() });
  }

  if (req.method !== "POST" && req.method !== "DELETE") {
    return json({ error: "Method not allowed" }, 405);
  }

  try {
    if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
      console.error("[delete-account] Missing Supabase configuration");
      return json({ error: "Server not configured" }, 500);
    }

    const authHeader = req.headers.get("authorization") ?? "";
    if (!authHeader.toLowerCase().startsWith("bearer ")) {
      return json({ error: "Missing authorization" }, 401);
    }

    const userResp = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: {
        apikey: SERVICE_ROLE_KEY,
        authorization: authHeader,
      },
    });

    if (!userResp.ok) {
      console.error("[delete-account] Could not resolve user", userResp.status, await userResp.text());
      return json({ error: "Unauthorized" }, 401);
    }

    const user = await userResp.json() as { id?: string };
    const userId = user.id;
    if (!userId) {
      return json({ error: "Unauthorized" }, 401);
    }

    const failedTables: string[] = [];
    for (const table of USER_TABLES) {
      const ok = await deleteRows(table, userId);
      if (!ok) failedTables.push(table);
    }

    if (failedTables.length > 0) {
      console.error("[delete-account] Failed table deletes", { userId, failedTables });
      return json({ error: "Could not delete all account data" }, 502);
    }

    const deleteAuthResp = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${encodeURIComponent(userId)}`, {
      method: "DELETE",
      headers: {
        apikey: SERVICE_ROLE_KEY,
        authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      },
    });

    if (!deleteAuthResp.ok) {
      console.error("[delete-account] Auth delete failed", deleteAuthResp.status, await deleteAuthResp.text());
      return json({ error: "Could not delete account" }, 502);
    }

    return json({ ok: true }, 200);
  } catch (err) {
    console.error("[delete-account] Unexpected error", err);
    return json({ error: "Something went wrong" }, 500);
  }
});

async function deleteRows(table: string, userId: string): Promise<boolean> {
  const resp = await fetch(`${SUPABASE_URL}/rest/v1/${table}?user_id=eq.${encodeURIComponent(userId)}`, {
    method: "DELETE",
    headers: {
      apikey: SERVICE_ROLE_KEY,
      authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      prefer: "return=minimal",
    },
  });

  if (resp.ok) return true;

  const body = await resp.text();
  if (resp.status === 404 || body.includes("PGRST205")) {
    console.warn("[delete-account] Skipping missing table", table);
    return true;
  }

  console.error("[delete-account] Table delete failed", table, resp.status, body);
  return false;
}

function json(payload: unknown, status: number): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...cors(), "Content-Type": "application/json" },
  });
}

function cors() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };
}
