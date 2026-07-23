/**
 * Shared auth deep link processor for magic links, email confirmation, and OAuth.
 * Cold-start `Linking.getInitialURL` is owned by RootNavigator; AuthScreen handles live
 * `Linking` url events (and browser OAuth results) while mounted.
 */
import * as QueryParams from 'expo-auth-session/build/QueryParams';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../services/supabaseClient';
import { logEvent, logError } from '../services/logger';
import { PENDING_PASSWORD_RESET_KEY } from '../constants/auth';
import {
  isNewOAuthUser,
  parseAuthCallbackParams,
  parseAuthSessionTokens,
  resolveAuthOAuthProviderFromUser,
  type AuthOAuthProviderId,
  type AuthOAuthUserLike,
} from './authOAuth';

const SCHEME = 'oneiros-dream-journal://';
const PASSWORD_RECOVERY_PATH = 'auth/recovery';

/** Completed-callback TTL so browser-result + Linking do not re-run after success. */
const recentlyHandledCallbackUrls = new Map<string, number>();
const CALLBACK_DEDUP_MS = 15_000;
const AUTH_DEEP_LINK_STEP_TIMEOUT_MS = 15_000;

/** In-flight serialization: concurrent callers share the same Promise for the same URL. */
const inFlightCallbacks = new Map<string, Promise<ProcessAuthDeepLinkResult>>();

function rememberHandledCallback(url: string) {
  recentlyHandledCallbackUrls.set(url, Date.now());
  for (const [key, at] of recentlyHandledCallbackUrls) {
    if (Date.now() - at > CALLBACK_DEDUP_MS) recentlyHandledCallbackUrls.delete(key);
  }
}

function wasRecentlyHandled(url: string): boolean {
  const at = recentlyHandledCallbackUrls.get(url);
  return typeof at === 'number' && Date.now() - at < CALLBACK_DEDUP_MS;
}

function withAuthStepTimeout<T>(promise: Promise<T>, step: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`${step} timed out. Please try again.`)),
      AUTH_DEEP_LINK_STEP_TIMEOUT_MS
    );

    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      }
    );
  });
}

/** @deprecated Use isNewOAuthUser from authOAuth. */
export const isNewGoogleUser = isNewOAuthUser;

/** Redact tokens for safe logging (keep structure: path, param names, type=recovery) */
export function redactAuthUrl(url: string | null): string {
  if (!url || !url.startsWith(SCHEME)) return url ?? 'null';
  try {
    return url
      .replace(/access_token=[^&#]+/gi, 'access_token=***')
      .replace(/refresh_token=[^&#]+/gi, 'refresh_token=***')
      .replace(/token_hash=[^&#]+/gi, 'token_hash=***')
      .replace(/[?&#]code=[^&#]+/gi, (m) => m.replace(/=.*/, '=***'));
  } catch {
    return url;
  }
}

function parseParams(url: string): { query: string; hash: string } {
  const hasQuery = url.includes('?');
  const hasHash = url.includes('#');
  const queryPart = hasQuery ? (url.split('?')[1]?.split('#')[0] ?? '') : '';
  const hashPart = hasHash ? (url.split('#')[1] ?? '') : '';
  return { query: queryPart, hash: hashPart };
}

function getParam(url: string, key: string): string | null {
  const { query, hash } = parseParams(url);
  for (const s of [query, hash]) {
    if (!s) continue;
    try {
      const v = new URLSearchParams(s).get(key);
      if (v) return v;
    } catch {
      // ignore
    }
  }
  return null;
}

function getAuthPath(url: string): string {
  if (!url.startsWith(SCHEME)) return '';
  return url.slice(SCHEME.length).split(/[?#]/)[0] ?? '';
}

function isPasswordRecoveryUrl(url: string): boolean {
  return getParam(url, 'type') === 'recovery' || getAuthPath(url) === PASSWORD_RECOVERY_PATH;
}

async function markPendingPasswordReset(): Promise<void> {
  await AsyncStorage.setItem(PENDING_PASSWORD_RESET_KEY, 'true');
  logEvent('auth_password_reset_link_verified', {});
}

/** Use expo-auth-session to get all params (query + hash) for access_token/refresh_token */
function getParamsFromUrl(url: string): Record<string, string> {
  try {
    const { params } = QueryParams.getQueryParams(url);
    return params ?? {};
  } catch {
    return {};
  }
}

export type ProcessAuthDeepLinkResult =
  | { handled: true; isRecovery?: boolean; isOAuth?: boolean; isNewUser?: boolean; provider?: AuthOAuthProviderId }
  | { handled: false; error?: string; isErrorUrl?: boolean };

function oauthResultFromUser(user: AuthOAuthUserLike): ProcessAuthDeepLinkResult {
  return {
    handled: true,
    isOAuth: true,
    isNewUser: isNewOAuthUser(user),
    provider: resolveAuthOAuthProviderFromUser(user),
  };
}

/** Prefer an already-known user object; fall back to local session user (no network getUser). */
async function oauthSuccessFromKnownOrSessionUser(
  user?: AuthOAuthUserLike
): Promise<ProcessAuthDeepLinkResult> {
  if (user) return oauthResultFromUser(user);
  const { data } = await supabase.auth.getSession();
  return oauthResultFromUser(data.session?.user ?? null);
}

async function processAuthDeepLinkInner(url: string): Promise<ProcessAuthDeepLinkResult> {
  if (wasRecentlyHandled(url)) {
    const { data } = await supabase.auth.getSession();
    if (data.session) {
      return oauthSuccessFromKnownOrSessionUser(data.session.user);
    }
    return { handled: false };
  }

  const params = getParamsFromUrl(url);
  const callback = parseAuthCallbackParams(url);
  const errorCode = callback.error || params.error || getParam(url, 'error');
  if (errorCode) {
    console.log('[Auth] OAuth error URL (stale/cancelled/linking):', errorCode);
    return { handled: false, isErrorUrl: true };
  }

  console.log('[Auth] processAuthDeepLink URL (redacted):', redactAuthUrl(url));

  const tokenHash = getParam(url, 'token_hash');
  const typeParam = getParam(url, 'type');

  // 1) Email confirmation / recovery: token_hash + type → verifyOtp
  if (tokenHash && typeParam) {
    logEvent('auth_deeplink_received', { hasTokenHash: true, linkType: typeParam });
    logEvent('auth_deeplink_verify_start', { linkType: typeParam });
    const isRecovery = isPasswordRecoveryUrl(url);
    if (isRecovery) await markPendingPasswordReset();
    try {
      const { error } = await withAuthStepTimeout(
        supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: typeParam as 'email' | 'signup' | 'recovery' | 'invite' | 'magiclink' | 'email_change',
        }),
        'Verification'
      );
      if (error) {
        console.error('[Auth] verifyOtp (magic link) error:', error);
        logError('auth_deeplink_verify_error', error, { linkType: typeParam });
        return { handled: false, error: error.message };
      }
      console.log('[Auth] Magic link verification success');
      rememberHandledCallback(url);
      if (isRecovery) return { handled: true, isRecovery: true };
      logEvent('auth_email_verified', { method: 'magic_link' });
      return { handled: true };
    } catch (e: any) {
      console.error('[Auth] Magic link verification failed', e);
      logError('auth_deeplink_verify_error', e, { linkType: typeParam });
      return { handled: false, error: e?.message ?? 'Verification failed' };
    }
  }

  // 2) Session in URL: access_token + refresh_token (implicit OAuth / legacy redirects)
  const parsedTokens = parseAuthSessionTokens(url);
  const accessToken = callback.accessToken ?? params.access_token ?? parsedTokens.accessToken;
  const refreshToken = callback.refreshToken ?? params.refresh_token ?? parsedTokens.refreshToken;

  if (accessToken && refreshToken) {
    const isRecovery = isPasswordRecoveryUrl(url);
    console.log('[Auth] Setting session from deep link (tokens in URL)...', isRecovery ? '(recovery)' : '');
    if (isRecovery) await markPendingPasswordReset();
    try {
      const { data, error } = await withAuthStepTimeout(
        supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        }),
        'Session setup'
      );
      if (error) {
        console.error('[Auth] Deep link session error:', error);
        logError('auth_deeplink_session_error', error, {});
        return { handled: false, error: error.message };
      }
      console.log('[Auth] Deep link session set successfully');
      rememberHandledCallback(url);
      logEvent('auth_deeplink_session_set', { isRecovery: isRecovery, flow: 'implicit_tokens' });
      if (isRecovery) return { handled: true, isRecovery: true };
      return oauthSuccessFromKnownOrSessionUser(data.user ?? data.session?.user);
    } catch (e: any) {
      console.error('[Auth] setSession failed', e);
      logError('auth_deeplink_session_error', e, {});
      return { handled: false, error: e?.message ?? 'Sign-in failed' };
    }
  }

  // 3) PKCE: authorization code → exchangeCodeForSession
  const code = callback.code ?? params.code ?? getParam(url, 'code');
  if (code) {
    const isRecovery = isPasswordRecoveryUrl(url);
    if (isRecovery) await markPendingPasswordReset();
    logEvent('auth_deeplink_received', { hasCode: true, flow: 'pkce', isRecovery });
    try {
      const { data, error } = await withAuthStepTimeout(
        supabase.auth.exchangeCodeForSession(code),
        'Google sign-in'
      );
      if (error) {
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData.session) {
          rememberHandledCallback(url);
          logEvent('auth_deeplink_session_set', { flow: 'pkce_already_exchanged', isRecovery });
          if (isRecovery) return { handled: true, isRecovery: true };
          return oauthSuccessFromKnownOrSessionUser(sessionData.session.user);
        }
        console.error('[Auth] exchangeCodeForSession error:', error);
        logError('auth_deeplink_code_exchange_error', error, {});
        return { handled: false, error: error.message };
      }
      console.log('[Auth] PKCE code exchanged successfully');
      rememberHandledCallback(url);
      logEvent('auth_deeplink_session_set', { flow: 'pkce', isRecovery });
      if (isRecovery) return { handled: true, isRecovery: true };
      return oauthResultFromUser(data.user);
    } catch (e: any) {
      console.error('[Auth] exchangeCodeForSession failed', e);
      logError('auth_deeplink_code_exchange_error', e, {});
      return { handled: false, error: e?.message ?? 'Sign-in failed' };
    }
  }

  return { handled: false };
}

/**
 * Process an auth deep link URL (magic link, email confirm, recovery, OAuth).
 * Supports both implicit tokens and PKCE `code` callbacks.
 * Concurrent callers for the same URL await one shared in-flight Promise.
 */
export async function processAuthDeepLink(url: string): Promise<ProcessAuthDeepLinkResult> {
  if (!url || !url.startsWith(SCHEME)) {
    return { handled: false };
  }

  const existing = inFlightCallbacks.get(url);
  if (existing) {
    return existing;
  }

  const run = processAuthDeepLinkInner(url).finally(() => {
    inFlightCallbacks.delete(url);
  });
  inFlightCallbacks.set(url, run);
  return run;
}
