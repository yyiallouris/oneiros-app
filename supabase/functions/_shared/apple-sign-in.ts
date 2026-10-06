const APPLE_SIGN_IN_TEAM_ID = Deno.env.get('APPLE_SIGN_IN_TEAM_ID') ?? '';
const APPLE_SIGN_IN_KEY_ID = Deno.env.get('APPLE_SIGN_IN_KEY_ID') ?? '';
const APPLE_SIGN_IN_PRIVATE_KEY = Deno.env.get('APPLE_SIGN_IN_PRIVATE_KEY') ?? '';
const APPLE_SIGN_IN_CLIENT_ID = Deno.env.get('APPLE_SIGN_IN_CLIENT_ID')
  ?? Deno.env.get('APPLE_BUNDLE_ID')
  ?? '';

export type AppleTokenSet = {
  access_token?: string;
  refresh_token?: string;
  id_token?: string;
};

function requireEnv(value: string, name: string): string {
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function toBase64Url(input: Uint8Array | string): string {
  const bytes = typeof input === 'string' ? new TextEncoder().encode(input) : input;
  let binary = '';
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function fromBase64Url(input: string): string {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/');
  const padding = normalized.length % 4 === 0 ? '' : '='.repeat(4 - (normalized.length % 4));
  return atob(normalized + padding);
}

function normalizePrivateKey(raw: string): string {
  return raw.includes('\\n') ? raw.replace(/\\n/g, '\n') : raw;
}

async function buildClientSecret(): Promise<string> {
  const teamId = requireEnv(APPLE_SIGN_IN_TEAM_ID, 'APPLE_SIGN_IN_TEAM_ID');
  const keyId = requireEnv(APPLE_SIGN_IN_KEY_ID, 'APPLE_SIGN_IN_KEY_ID');
  const clientId = requireEnv(APPLE_SIGN_IN_CLIENT_ID, 'APPLE_SIGN_IN_CLIENT_ID');
  const privateKeyPem = normalizePrivateKey(requireEnv(APPLE_SIGN_IN_PRIVATE_KEY, 'APPLE_SIGN_IN_PRIVATE_KEY'));
  const cleaned = privateKeyPem
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\s+/g, '');
  const binary = Uint8Array.from(atob(cleaned), (char) => char.charCodeAt(0));
  const privateKey = await crypto.subtle.importKey(
    'pkcs8',
    binary.buffer,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign'],
  );
  const now = Math.floor(Date.now() / 1000);
  const header = toBase64Url(JSON.stringify({ alg: 'ES256', kid: keyId, typ: 'JWT' }));
  const payload = toBase64Url(JSON.stringify({
    iss: teamId,
    iat: now,
    exp: now + 300,
    aud: 'https://appleid.apple.com',
    sub: clientId,
  }));
  const signingInput = `${header}.${payload}`;
  const signature = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    privateKey,
    new TextEncoder().encode(signingInput),
  );
  return `${signingInput}.${toBase64Url(new Uint8Array(signature))}`;
}

export function decodeAppleIdTokenSubject(idToken?: string): string | null {
  if (!idToken) return null;
  try {
    const payload = idToken.split('.')[1];
    if (!payload) return null;
    const parsed = JSON.parse(fromBase64Url(payload)) as { sub?: unknown };
    return typeof parsed.sub === 'string' ? parsed.sub : null;
  } catch {
    return null;
  }
}

export async function exchangeAppleAuthorizationCode(authorizationCode: string): Promise<AppleTokenSet> {
  const clientId = requireEnv(APPLE_SIGN_IN_CLIENT_ID, 'APPLE_SIGN_IN_CLIENT_ID');
  const clientSecret = await buildClientSecret();
  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    code: authorizationCode,
    grant_type: 'authorization_code',
  });
  const response = await fetch('https://appleid.apple.com/auth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  if (!response.ok) {
    throw new Error(`Apple authorization exchange failed with status ${response.status}`);
  }
  return await response.json() as AppleTokenSet;
}

export async function revokeAppleToken(token: string): Promise<void> {
  const clientId = requireEnv(APPLE_SIGN_IN_CLIENT_ID, 'APPLE_SIGN_IN_CLIENT_ID');
  const clientSecret = await buildClientSecret();
  const response = await fetch('https://appleid.apple.com/auth/revoke', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      token,
      token_type_hint: 'refresh_token',
    }),
  });
  if (!response.ok) {
    throw new Error(`Apple token revocation failed with status ${response.status}`);
  }
}
