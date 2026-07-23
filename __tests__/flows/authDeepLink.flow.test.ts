/**
 * Flow coverage: documentation/flows-02-authentication.md (deep links, recovery flags).
 */
jest.mock('expo-auth-session/build/QueryParams', () => ({
  getQueryParams: (input: string) => {
    const params: Record<string, string> = {};
    const q = input.includes('?') ? input.split('?')[1]?.split('#')[0] ?? '' : '';
    const hash = input.includes('#') ? input.split('#')[1] ?? '' : '';
    for (const part of [q, hash]) {
      if (!part) continue;
      try {
        const sp = new URLSearchParams(part);
        sp.forEach((v, k) => {
          params[k] = v;
        });
      } catch {
        /* ignore */
      }
    }
    return { params };
  },
}));

const mockVerifyOtp = jest.fn<any, any>();
const mockSetSession = jest.fn<any, any>();
const mockExchangeCodeForSession = jest.fn<any, any>();
const mockGetSession = jest.fn<any, any>(() => Promise.resolve({ data: { session: null }, error: null }));
const mockGetUser = jest.fn<Promise<{ data: { user: any }; error: null }>, []>(() =>
  Promise.resolve({ data: { user: null }, error: null })
);

jest.mock('../../src/services/supabaseClient', () => ({
  supabase: {
    auth: {
      verifyOtp: (payload: any) => mockVerifyOtp(payload),
      setSession: (payload: any) => mockSetSession(payload),
      exchangeCodeForSession: (code: string) => mockExchangeCodeForSession(code),
      getSession: () => mockGetSession(),
      getUser: () => mockGetUser(),
    },
  },
}));

jest.mock('../../src/services/logger', () => ({
  logEvent: jest.fn(),
  logError: jest.fn(),
}));

import AsyncStorage from '@react-native-async-storage/async-storage';
import { PENDING_PASSWORD_RESET_KEY } from '../../src/constants/auth';
import { processAuthDeepLink, redactAuthUrl } from '../../src/utils/authDeepLink';
import { isNewOAuthUser } from '../../src/utils/authOAuth';

describe('authDeepLink flow', () => {
  beforeEach(() => {
    mockVerifyOtp.mockReset();
    mockSetSession.mockReset();
    mockExchangeCodeForSession.mockReset();
    mockGetSession.mockReset();
    mockGetSession.mockImplementation(() => Promise.resolve({ data: { session: null }, error: null }));
    mockGetUser.mockReset();
    mockGetUser.mockImplementation(() => Promise.resolve({ data: { user: null }, error: null }));
    (AsyncStorage as any).clear?.();
  });

  describe('redactAuthUrl', () => {
    it('redacts tokens in app scheme URLs', () => {
      const raw =
        'oneiros-dream-journal://auth#access_token=secret&refresh_token=also&type=recovery';
      const out = redactAuthUrl(raw);
      expect(out).toContain('access_token=***');
      expect(out).toContain('refresh_token=***');
      expect(out).not.toContain('secret');
    });

    it('returns non-scheme URLs unchanged', () => {
      expect(redactAuthUrl('https://example.com')).toBe('https://example.com');
    });
  });

  describe('isNewOAuthUser', () => {
    it('returns false for null user', () => {
      expect(isNewOAuthUser(null)).toBe(false);
    });

    it('returns true for single identity created within 60s', () => {
      const now = new Date().toISOString();
      expect(
        isNewOAuthUser({
          identities: [{}],
          created_at: now,
        })
      ).toBe(true);
    });

    it('returns false when multiple identities (linked account)', () => {
      expect(
        isNewOAuthUser({
          identities: [{}, {}],
          created_at: new Date().toISOString(),
        })
      ).toBe(false);
    });
  });

  describe('processAuthDeepLink', () => {
    it('returns handled:false for wrong scheme', async () => {
      await expect(processAuthDeepLink('https://example.com')).resolves.toEqual({ handled: false });
    });

    it('returns handled:false for OAuth error param', async () => {
      const url = 'oneiros-dream-journal://cb?error=access_denied';
      await expect(processAuthDeepLink(url)).resolves.toMatchObject({
        handled: false,
        isErrorUrl: true,
      });
    });

    it('verifyOtp path: recovery sets pending reset and returns isRecovery', async () => {
      mockVerifyOtp.mockResolvedValue({ error: null });
      const url =
        'oneiros-dream-journal://auth/confirm?token_hash=abc&type=recovery';
      const result = await processAuthDeepLink(url);
      expect(result).toEqual({ handled: true, isRecovery: true });
      expect(mockVerifyOtp).toHaveBeenCalledWith(
        expect.objectContaining({
          token_hash: 'abc',
          type: 'recovery',
        })
      );
      expect(await AsyncStorage.getItem(PENDING_PASSWORD_RESET_KEY)).toBe('true');
    });

    it('verifyOtp path: signup succeeds without setting pending password reset', async () => {
      mockVerifyOtp.mockResolvedValue({ error: null });
      const url =
        'oneiros-dream-journal://auth/confirm?token_hash=xyz&type=signup';
      const result = await processAuthDeepLink(url);
      expect(result).toEqual({ handled: true });
      expect(await AsyncStorage.getItem(PENDING_PASSWORD_RESET_KEY)).toBeNull();
    });

    it('setSession path: recovery type sets pending reset', async () => {
      mockSetSession.mockResolvedValue({ error: null });
      const url =
        'oneiros-dream-journal://auth#access_token=atok&refresh_token=rtok&type=recovery';
      const result = await processAuthDeepLink(url);
      expect(result).toMatchObject({ handled: true, isRecovery: true });
      expect(mockSetSession).toHaveBeenCalledWith({
        access_token: 'atok',
        refresh_token: 'rtok',
      });
      expect(await AsyncStorage.getItem(PENDING_PASSWORD_RESET_KEY)).toBe('true');
    });

    it('setSession path: non-recovery uses setSession user (no getUser)', async () => {
      mockSetSession.mockResolvedValue({
        data: {
          user: {
            identities: [{ provider: 'discord' }],
            created_at: new Date(Date.now() - 120_000).toISOString(),
          },
          session: { access_token: 'a2', refresh_token: 'r2' },
        },
        error: null,
      });
      const url =
        'oneiros-dream-journal://auth#access_token=a2&refresh_token=r2';
      const result = await processAuthDeepLink(url);
      expect(result).toMatchObject({ handled: true, isOAuth: true, isNewUser: false, provider: 'discord' });
      expect(mockGetUser).not.toHaveBeenCalled();
    });

    it('exchanges PKCE authorization code for a session', async () => {
      mockExchangeCodeForSession.mockResolvedValue({
        data: {
          user: {
            identities: [{ provider: 'google' }],
            created_at: new Date().toISOString(),
          },
          session: { access_token: 'a', refresh_token: 'r' },
        },
        error: null,
      });
      const url = 'oneiros-dream-journal://auth/callback?code=oauth-code-1';
      const result = await processAuthDeepLink(url);
      expect(mockExchangeCodeForSession).toHaveBeenCalledWith('oauth-code-1');
      expect(result).toMatchObject({
        handled: true,
        isOAuth: true,
        isNewUser: true,
        provider: 'google',
      });
      expect(mockGetUser).not.toHaveBeenCalled();
    });

    it('treats already-exchanged PKCE codes as success when a session exists', async () => {
      mockExchangeCodeForSession.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'invalid request: both auth code and code verifier should be non-empty' },
      });
      mockGetSession.mockResolvedValue({
        data: {
          session: {
            access_token: 'a',
            refresh_token: 'r',
            user: {
              identities: [{ provider: 'google' }],
              created_at: new Date(Date.now() - 120_000).toISOString(),
            },
          },
        },
        error: null,
      });
      const url = 'oneiros-dream-journal://auth/callback?code=oauth-code-2';
      const result = await processAuthDeepLink(url);
      expect(result).toMatchObject({ handled: true, isOAuth: true, provider: 'google', isNewUser: false });
      expect(mockGetUser).not.toHaveBeenCalled();
    });

    it('PKCE recovery path sets pending reset before exchange and routes to SetPassword', async () => {
      mockExchangeCodeForSession.mockResolvedValue({
        data: {
          user: {
            identities: [{ provider: 'email' }],
            created_at: new Date(Date.now() - 120_000).toISOString(),
          },
          session: { access_token: 'a', refresh_token: 'r' },
        },
        error: null,
      });

      const url = 'oneiros-dream-journal://auth/recovery?code=recovery-code-1';
      const result = await processAuthDeepLink(url);

      expect(mockExchangeCodeForSession).toHaveBeenCalledWith('recovery-code-1');
      expect(result).toEqual({ handled: true, isRecovery: true });
      expect(await AsyncStorage.getItem(PENDING_PASSWORD_RESET_KEY)).toBe('true');
    });

    it('PKCE recovery type param remains backward compatible for old reset links', async () => {
      mockExchangeCodeForSession.mockResolvedValue({
        data: {
          user: {
            identities: [{ provider: 'email' }],
            created_at: new Date(Date.now() - 120_000).toISOString(),
          },
          session: { access_token: 'a', refresh_token: 'r' },
        },
        error: null,
      });

      const url = 'oneiros-dream-journal://auth/confirm?code=recovery-code-2&type=recovery';
      const result = await processAuthDeepLink(url);

      expect(mockExchangeCodeForSession).toHaveBeenCalledWith('recovery-code-2');
      expect(result).toEqual({ handled: true, isRecovery: true });
      expect(await AsyncStorage.getItem(PENDING_PASSWORD_RESET_KEY)).toBe('true');
    });

    it('serializes concurrent PKCE exchanges for the same callback URL', async () => {
      let resolveExchange: ((value: unknown) => void) | undefined;
      mockExchangeCodeForSession.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveExchange = resolve;
          })
      );

      const url = 'oneiros-dream-journal://auth/callback?code=oauth-code-race';
      const first = processAuthDeepLink(url);
      const second = processAuthDeepLink(url);

      expect(mockExchangeCodeForSession).toHaveBeenCalledTimes(1);

      resolveExchange!({
        data: {
          user: {
            identities: [{ provider: 'google' }],
            created_at: new Date().toISOString(),
          },
          session: { access_token: 'a', refresh_token: 'r' },
        },
        error: null,
      });

      await expect(Promise.all([first, second])).resolves.toEqual([
        expect.objectContaining({ handled: true, isOAuth: true, provider: 'google' }),
        expect.objectContaining({ handled: true, isOAuth: true, provider: 'google' }),
      ]);
      expect(mockExchangeCodeForSession).toHaveBeenCalledTimes(1);
    });

    it('times out a hanging PKCE exchange instead of leaving OAuth loading forever', async () => {
      jest.useFakeTimers();
      try {
        let resolveExchange: ((value: unknown) => void) | undefined;
        mockExchangeCodeForSession.mockImplementation(
          () =>
            new Promise((resolve) => {
              resolveExchange = resolve;
            })
        );

        const resultPromise = processAuthDeepLink('oneiros-dream-journal://auth/callback?code=oauth-code-hangs');
        await jest.advanceTimersByTimeAsync(15_000);

        await expect(resultPromise).resolves.toMatchObject({
          handled: false,
          error: expect.stringContaining('timed out'),
        });
        expect(mockExchangeCodeForSession).toHaveBeenCalledTimes(1);
        resolveExchange?.({ data: { user: null, session: null }, error: null });
      } finally {
        jest.useRealTimers();
      }
    });
  });
});
