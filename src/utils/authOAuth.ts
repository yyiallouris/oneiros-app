export type AuthOAuthProviderId = 'google' | 'discord' | 'apple';

export type AuthOAuthProviderConfig = {
  id: AuthOAuthProviderId;
  label: string;
  buttonTitle: string;
  eventPrefix: `auth_${AuthOAuthProviderId}`;
};

export const AUTH_OAUTH_PROVIDERS: AuthOAuthProviderConfig[] = [
  {
    id: 'google',
    label: 'Google',
    buttonTitle: 'Continue with Google',
    eventPrefix: 'auth_google',
  },
  {
    id: 'discord',
    label: 'Discord',
    buttonTitle: 'Continue with Discord',
    eventPrefix: 'auth_discord',
  },
];

export const AUTH_APPLE_PROVIDER: AuthOAuthProviderConfig = {
  id: 'apple',
  label: 'Apple',
  buttonTitle: 'Continue with Apple',
  eventPrefix: 'auth_apple',
};

const AUTH_OAUTH_PROVIDER_IDS = new Set<AuthOAuthProviderId>(
  [...AUTH_OAUTH_PROVIDERS, AUTH_APPLE_PROVIDER].map((provider) => provider.id)
);

type AuthIdentity = {
  provider?: string | null;
  identity_data?: {
    provider?: string | null;
  } | null;
};

export type AuthOAuthUserLike = {
  identities?: unknown[];
  created_at?: string | null;
} | null | undefined;

export function getAuthOAuthProvider(id: AuthOAuthProviderId): AuthOAuthProviderConfig {
  return [...AUTH_OAUTH_PROVIDERS, AUTH_APPLE_PROVIDER].find((provider) => provider.id === id) ?? AUTH_OAUTH_PROVIDERS[0];
}

export function getAuthOAuthProviderLabel(id: AuthOAuthProviderId | null | undefined): string | null {
  if (!id) return null;
  return getAuthOAuthProvider(id).label;
}

export function getAuthOAuthSuccessMessage(id: AuthOAuthProviderId | null | undefined): string {
  const providerLabel = getAuthOAuthProviderLabel(id);
  return providerLabel ? `You're signed in with ${providerLabel}.` : "You're signed in.";
}

export function isNewOAuthUser(user: AuthOAuthUserLike): boolean {
  if (!user) return false;
  const identities = user.identities ?? [];
  const createdAt = user.created_at;
  if (identities.length !== 1) return false;
  if (!createdAt) return false;
  return Date.now() - new Date(createdAt).getTime() < 60_000;
}

export function resolveAuthOAuthProviderFromUser(user: AuthOAuthUserLike): AuthOAuthProviderId | undefined {
  if (!user) return undefined;
  for (const identity of user.identities ?? []) {
    if (!identity || typeof identity !== 'object') continue;
    const candidate = identity as AuthIdentity;
    const provider = candidate.provider ?? candidate.identity_data?.provider;
    if (provider && AUTH_OAUTH_PROVIDER_IDS.has(provider as AuthOAuthProviderId)) {
      return provider as AuthOAuthProviderId;
    }
  }
  return undefined;
}

export function parseAuthSessionTokens(url: string): {
  accessToken: string | null;
  refreshToken: string | null;
} {
  let accessToken: string | null = null;
  let refreshToken: string | null = null;

  const parsePart = (part: string) => {
    if (!part) return;
    try {
      const params = new URLSearchParams(part);
      accessToken = accessToken ?? params.get('access_token');
      refreshToken = refreshToken ?? params.get('refresh_token');
    } catch {
      // Continue to regex fallback below.
    }
  };

  if (url.includes('#')) {
    parsePart(url.split('#')[1] ?? '');
  }
  if (url.includes('?')) {
    parsePart(url.split('?')[1]?.split('#')[0] ?? '');
  }

  if (!accessToken) {
    const tokenMatch = url.match(/access_token=([^&#]+)/);
    const refreshMatch = url.match(/refresh_token=([^&#]+)/);
    accessToken = tokenMatch ? decodeURIComponent(tokenMatch[1].replace(/\+/g, ' ')) : null;
    refreshToken = refreshMatch ? decodeURIComponent(refreshMatch[1].replace(/\+/g, ' ')) : null;
  }

  return { accessToken, refreshToken };
}

/** Parse OAuth / auth redirect callback query+hash params used by the app. */
export function parseAuthCallbackParams(url: string): {
  accessToken: string | null;
  refreshToken: string | null;
  code: string | null;
  error: string | null;
  errorDescription: string | null;
} {
  const { accessToken, refreshToken } = parseAuthSessionTokens(url);
  let code: string | null = null;
  let error: string | null = null;
  let errorDescription: string | null = null;

  const parsePart = (part: string) => {
    if (!part) return;
    try {
      const params = new URLSearchParams(part);
      code = code ?? params.get('code');
      error = error ?? params.get('error');
      errorDescription = errorDescription ?? params.get('error_description');
    } catch {
      // ignore malformed segments
    }
  };

  if (url.includes('?')) {
    parsePart(url.split('?')[1]?.split('#')[0] ?? '');
  }
  if (url.includes('#')) {
    parsePart(url.split('#')[1] ?? '');
  }

  if (!code) {
    const codeMatch = url.match(/[?#&]code=([^&#]+)/);
    code = codeMatch ? decodeURIComponent(codeMatch[1].replace(/\+/g, ' ')) : null;
  }

  return { accessToken, refreshToken, code, error, errorDescription };
}

/** @deprecated Use isNewOAuthUser. Kept for older auth flow tests/imports. */
export const isNewGoogleUser = isNewOAuthUser;
