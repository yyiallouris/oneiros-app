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
const mockGetUser = jest.fn<Promise<{ data: { user: any }; error: null }>, []>(() =>
  Promise.resolve({ data: { user: null }, error: null })
);

jest.mock('../../src/services/supabaseClient', () => ({
  supabase: {
    auth: {
      verifyOtp: (payload: any) => mockVerifyOtp(payload),
      setSession: (payload: any) => mockSetSession(payload),
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
import { processAuthDeepLink, redactAuthUrl, isNewGoogleUser } from '../../src/utils/authDeepLink';

describe('authDeepLink flow', () => {
  beforeEach(() => {
    mockVerifyOtp.mockReset();
    mockSetSession.mockReset();
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

  describe('isNewGoogleUser', () => {
    it('returns false for null user', () => {
      expect(isNewGoogleUser(null)).toBe(false);
    });

    it('returns true for single identity created within 60s', () => {
      const now = new Date().toISOString();
      expect(
        isNewGoogleUser({
          identities: [{}],
          created_at: now,
        })
      ).toBe(true);
    });

    it('returns false when multiple identities (linked account)', () => {
      expect(
        isNewGoogleUser({
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

    it('setSession path: non-recovery clears pending reset concern via success', async () => {
      mockSetSession.mockResolvedValue({ error: null });
      mockGetUser.mockImplementation(() =>
        Promise.resolve({
        data: {
          user: {
            identities: [{}],
            created_at: new Date(Date.now() - 120_000).toISOString(),
          },
        },
        error: null,
        })
      );
      const url =
        'oneiros-dream-journal://auth#access_token=a2&refresh_token=r2';
      const result = await processAuthDeepLink(url);
      expect(result).toMatchObject({ handled: true, isOAuth: true, isNewUser: false });
    });
  });
});
