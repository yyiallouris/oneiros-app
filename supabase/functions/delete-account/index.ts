import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import {
  decodeAppleIdTokenSubject,
  exchangeAppleAuthorizationCode,
  revokeAppleToken,
} from "../_shared/apple-sign-in.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const USER_TABLES = [
  "ai_generation_artifacts",
  "quota_events",
  "quota_buckets",
  "subscription_transactions",
  "subscription_entitlements",
  "billing_accounts",
  "pattern_reports",
  "user_settings",
  "interpretations",
  "dreams",
  "contact_messages",
  "apple_auth_tokens",
];

type ResolvedUser = {
  id?: string;
  app_metadata?: { provider?: string; providers?: string[] };
  identities?: Array<{ provider?: string; identity_data?: { sub?: string }; identity_id?: string }>;
};

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

    const user = await userResp.json() as ResolvedUser;
    const userId = user.id;
    if (!userId) {
      return json({ error: "Unauthorized" }, 401);
    }

    const requestBody = await readOptionalBody(req);
    const appleAuthorizationCode = typeof requestBody.appleAuthorizationCode === "string"
      ? requestBody.appleAuthorizationCode.trim()
      : "";
    const appleSubject = getAppleSubject(user);
    if (appleSubject) {
      const revoked = await revokeAppleAuthorization({
        userId,
        appleSubject,
        authorizationCode: appleAuthorizationCode,
      });
      if (!revoked) {
        return json({ error: "Apple reauthentication is required before deletion", code: "apple_reauthentication_required" }, 409);
      }
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

async function readOptionalBody(req: Request): Promise<Record<string, unknown>> {
  try {
    const text = await req.text();
    return text ? JSON.parse(text) as Record<string, unknown> : {};
  } catch {
    return {};
  }
}

function getAppleSubject(user: ResolvedUser): string | null {
  const identity = user.identities?.find((item) => item.provider === "apple");
  return identity?.identity_data?.sub ?? identity?.identity_id ?? null;
}

async function revokeAppleAuthorization(input: {
  userId: string;
  appleSubject: string;
  authorizationCode: string;
}): Promise<boolean> {
  try {
    let refreshToken = "";
    if (input.authorizationCode) {
      const tokens = await exchangeAppleAuthorizationCode(input.authorizationCode);
      const tokenSubject = decodeAppleIdTokenSubject(tokens.id_token);
      if (!tokens.refresh_token || tokenSubject !== input.appleSubject) {
        console.error("[delete-account] Apple identity verification failed", { userId: input.userId });
        return false;
      }
      refreshToken = tokens.refresh_token;
    } else {
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/apple_auth_tokens?user_id=eq.${encodeURIComponent(input.userId)}&select=refresh_token&limit=1`,
        {
          headers: {
            apikey: SERVICE_ROLE_KEY,
            authorization: `Bearer ${SERVICE_ROLE_KEY}`,
          },
        },
      );
      if (!response.ok) return false;
      const rows = await response.json() as Array<{ refresh_token?: string }>;
      refreshToken = rows[0]?.refresh_token ?? "";
    }
    if (!refreshToken) return false;
    await revokeAppleToken(refreshToken);
    console.log("[delete-account] Apple authorization revoked", { userId: input.userId });
    return true;
  } catch (error) {
    console.error("[delete-account] Apple revocation failed", {
      userId: input.userId,
      name: error instanceof Error ? error.name : "unknown",
    });
    return false;
  }
}

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
