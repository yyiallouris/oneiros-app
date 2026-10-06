import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import {
  decodeAppleIdTokenSubject,
  exchangeAppleAuthorizationCode,
} from '../_shared/apple-sign-in.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors() });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  try {
    const authHeader = req.headers.get('authorization') ?? '';
    if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !authHeader.toLowerCase().startsWith('bearer ')) {
      return json({ error: 'Unauthorized' }, 401);
    }
    const body = await req.json() as { authorizationCode?: unknown };
    const authorizationCode = typeof body.authorizationCode === 'string' ? body.authorizationCode.trim() : '';
    if (!authorizationCode) return json({ error: 'Apple authorization code is required' }, 400);

    const user = await resolveUser(authHeader);
    if (!user?.id || !getAppleSubject(user)) return json({ error: 'Apple identity is required' }, 403);

    const tokens = await exchangeAppleAuthorizationCode(authorizationCode);
    const tokenSubject = decodeAppleIdTokenSubject(tokens.id_token);
    if (!tokens.refresh_token || !tokenSubject || tokenSubject !== getAppleSubject(user)) {
      return json({ error: 'Apple identity verification failed' }, 403);
    }

    const saved = await fetch(`${SUPABASE_URL}/rest/v1/apple_auth_tokens?on_conflict=user_id`, {
      method: 'POST',
      headers: {
        apikey: SERVICE_ROLE_KEY,
        authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        prefer: 'resolution=merge-duplicates,return=minimal',
      },
      body: JSON.stringify({ user_id: user.id, refresh_token: tokens.refresh_token }),
    });
    if (!saved.ok) {
      console.error('[apple-auth-token] Token persistence failed', { user_id: user.id, status: saved.status });
      return json({ error: 'Could not secure Apple account authorization' }, 502);
    }

    console.log('[apple-auth-token] Apple revocation credential secured', { user_id: user.id });
    return json({ ok: true }, 200);
  } catch (error) {
    console.error('[apple-auth-token] Unexpected error', { name: error instanceof Error ? error.name : 'unknown' });
    return json({ error: 'Could not secure Apple account authorization' }, 500);
  }
});

type ResolvedUser = {
  id?: string;
  app_metadata?: { provider?: string; providers?: string[] };
  identities?: Array<{ provider?: string; identity_data?: { sub?: string }; identity_id?: string }>;
};

async function resolveUser(authHeader: string): Promise<ResolvedUser | null> {
  const response = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: SERVICE_ROLE_KEY, authorization: authHeader },
  });
  return response.ok ? await response.json() as ResolvedUser : null;
}

function getAppleSubject(user: ResolvedUser): string | null {
  const identity = user.identities?.find((item) => item.provider === 'apple');
  return identity?.identity_data?.sub ?? identity?.identity_id ?? null;
}

function json(payload: unknown, status: number): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...cors(), 'Content-Type': 'application/json' },
  });
}

function cors() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };
}
