/**
 * Flow coverage: documentation/flows-02-authentication.md (social OAuth providers).
 */
import {
  AUTH_APPLE_PROVIDER,
  AUTH_OAUTH_PROVIDERS,
  getAuthOAuthProviderLabel,
  getAuthOAuthSuccessMessage,
  isNewOAuthUser,
  parseAuthCallbackParams,
  parseAuthSessionTokens,
  resolveAuthOAuthProviderFromUser,
} from '../../src/utils/authOAuth';

describe('auth OAuth flow utilities', () => {
  it('exposes Google and Discord as auth providers', () => {
    expect(AUTH_OAUTH_PROVIDERS.map((provider) => provider.id)).toEqual(['google', 'discord']);
    expect(AUTH_OAUTH_PROVIDERS.map((provider) => provider.buttonTitle)).toEqual([
      'Continue with Google',
      'Continue with Discord',
    ]);
  });

  it('exposes Apple as the native iOS sign-in provider', () => {
    expect(AUTH_APPLE_PROVIDER.id).toBe('apple');
    expect(AUTH_APPLE_PROVIDER.buttonTitle).toBe('Continue with Apple');
    expect(getAuthOAuthProviderLabel('apple')).toBe('Apple');
  });

  it('resolves provider labels for user-facing auth copy', () => {
    expect(getAuthOAuthProviderLabel('google')).toBe('Google');
    expect(getAuthOAuthProviderLabel('discord')).toBe('Discord');
    expect(getAuthOAuthProviderLabel(undefined)).toBeNull();
  });

  it('builds provider-aware returning-user success copy', () => {
    expect(getAuthOAuthSuccessMessage('google')).toBe("You're signed in with Google.");
    expect(getAuthOAuthSuccessMessage('discord')).toBe("You're signed in with Discord.");
    expect(getAuthOAuthSuccessMessage('apple')).toBe("You're signed in with Apple.");
    expect(getAuthOAuthSuccessMessage(undefined)).toBe("You're signed in.");
  });

  it('parses auth session tokens from hash redirects', () => {
    expect(
      parseAuthSessionTokens('oneiros-dream-journal://auth/callback#access_token=atok&refresh_token=rtok')
    ).toEqual({ accessToken: 'atok', refreshToken: 'rtok' });
  });

  it('parses auth session tokens from query redirects', () => {
    expect(
      parseAuthSessionTokens('oneiros-dream-journal://auth/callback?access_token=atok2&refresh_token=rtok2')
    ).toEqual({ accessToken: 'atok2', refreshToken: 'rtok2' });
  });

  it('parses PKCE authorization codes from OAuth callbacks', () => {
    expect(
      parseAuthCallbackParams('oneiros-dream-journal://auth/callback?code=abc123&state=xyz')
    ).toMatchObject({
      code: 'abc123',
      accessToken: null,
      refreshToken: null,
      error: null,
    });
  });

  it('decodes regex fallback tokens with plus-encoded spaces', () => {
    expect(
      parseAuthSessionTokens('oneiros-dream-journal://auth/callback?foo=1#other=2&access_token=a+b&refresh_token=r%2Fb')
    ).toEqual({ accessToken: 'a b', refreshToken: 'r/b' });
  });

  it('treats only single fresh OAuth identities as new users', () => {
    expect(
      isNewOAuthUser({
        identities: [{ provider: 'discord' }],
        created_at: new Date().toISOString(),
      })
    ).toBe(true);
    expect(
      isNewOAuthUser({
        identities: [{ provider: 'email' }, { provider: 'discord' }],
        created_at: new Date().toISOString(),
      })
    ).toBe(false);
  });

  it('resolves supported provider from Supabase identity metadata', () => {
    expect(
      resolveAuthOAuthProviderFromUser({
        identities: [{ identity_data: { provider: 'apple' } }],
        created_at: new Date().toISOString(),
      })
    ).toBe('apple');
    expect(
      resolveAuthOAuthProviderFromUser({
        identities: [{ provider: 'email' }],
        created_at: new Date().toISOString(),
      })
    ).toBeUndefined();
  });
});
