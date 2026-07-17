/**
 * Shared auth deep link processor for magic links, email confirmation, and OAuth.
 * Call from RootNavigator on cold start (getInitialURL) and from AuthScreen (url event).
 */
import * as QueryParams from 'expo-auth-session/build/QueryParams';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../services/supabaseClient';
import { logEvent, logError } from '../services/logger';
import { PENDING_PASSWORD_RESET_KEY } from '../constants/auth';
import {
  isNewOAuthUser,
  parseAuthSessionTokens,
  resolveAuthOAuthProviderFromUser,
  type AuthOAuthProviderId,
} from './authOAuth';

const SCHEME = 'oneiros-dream-journal://';

/** @deprecated Use isNewOAuthUser from authOAuth. */
export const isNewGoogleUser = isNewOAuthUser;

/** Redact tokens for safe logging (keep structure: path, param names, type=recovery) */
export function redactAuthUrl(url: string | null): string {
  if (!url || !url.startsWith(SCHEME)) return url ?? 'null';
  try {
    return url
      .replace(/access_token=[^&#]+/gi, 'access_token=***')
      .replace(/refresh_token=[^&#]+/gi, 'refresh_token=***')
      .replace(/token_hash=[^&#]+/gi, 'token_hash=***');
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

/**
 * Process an auth deep link URL (magic link, email confirm, recovery, OAuth).
 * Returns whether the URL was handled; does not show alerts (caller may show them).
 */
export async function processAuthDeepLink(url: string): Promise<ProcessAuthDeepLinkResult> {
  if (!url || !url.startsWith(SCHEME)) {
    return { handled: false };
  }

  const params = getParamsFromUrl(url);
  const errorCode = params.error || getParam(url, 'error');
  if (errorCode) {
    console.log('[Auth] OAuth error URL (stale/cancelled/linking):', errorCode);
    // Don't show error alerts: user cancelled, or Supabase handles linking automatically.
    // Automatic linking can connect OAuth providers to an existing verified email account.
    return { handled: false, isErrorUrl: true };
  }

  console.log('[Auth] processAuthDeepLink URL (redacted):', redactAuthUrl(url));

  const tokenHash = getParam(url, 'token_hash');
  const typeParam = getParam(url, 'type');

  // 1) Email confirmation / recovery: token_hash + type → verifyOtp
  if (tokenHash && typeParam) {
    logEvent('auth_deeplink_received', { hasTokenHash: true, linkType: typeParam });
    logEvent('auth_deeplink_verify_start', { linkType: typeParam });
    // Set recovery flag BEFORE verifyOtp – auth state change runs immediately
    if (typeParam === 'recovery') {
      await AsyncStorage.setItem(PENDING_PASSWORD_RESET_KEY, 'true');
      logEvent('auth_password_reset_link_verified', {});
    }
    try {
      const { error } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: typeParam as 'email' | 'signup' | 'recovery' | 'invite' | 'magiclink' | 'email_change',
      });
      if (error) {
        console.error('[Auth] verifyOtp (magic link) error:', error);
        logError('auth_deeplink_verify_error', error, { linkType: typeParam });
        return { handled: false, error: error.message };
      }
      console.log('[Auth] Magic link verification success');
      if (typeParam === 'recovery') return { handled: true, isRecovery: true };
      logEvent('auth_email_verified', { method: 'magic_link' });
      return { handled: true };
    } catch (e: any) {
      console.error('[Auth] Magic link verification failed', e);
      logError('auth_deeplink_verify_error', e, { linkType: typeParam });
      return { handled: false, error: e?.message ?? 'Verification failed' };
    }
  }

  // 2) Session in URL: access_token + refresh_token (OAuth or post-verify redirect from Supabase)
  const parsedTokens = parseAuthSessionTokens(url);
  const accessToken = params.access_token ?? parsedTokens.accessToken;
  const refreshToken = params.refresh_token ?? parsedTokens.refreshToken;

  if (accessToken && refreshToken) {
    const isRecovery = getParam(url, 'type') === 'recovery';
    console.log('[Auth] Setting session from deep link (tokens in URL)...', isRecovery ? '(recovery)' : '');
    // CRITICAL: Set recovery flag BEFORE setSession – onAuthStateChange runs immediately
    // and reads this; if we set it after, RootNavigator won't show SetPasswordScreen
    if (isRecovery) {
      await AsyncStorage.setItem(PENDING_PASSWORD_RESET_KEY, 'true');
      logEvent('auth_password_reset_link_verified', {});
    }
    try {
      const { error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      if (error) {
        console.error('[Auth] Deep link session error:', error);
        logError('auth_deeplink_session_error', error, {});
        return { handled: false, error: error.message };
      }
      console.log('[Auth] Deep link session set successfully');
      logEvent('auth_deeplink_session_set', { isRecovery: isRecovery });
      if (isRecovery) return { handled: true, isRecovery: true };
      await new Promise((r) => setTimeout(r, 200)); // Let session propagate
      const { data: userData } = await supabase.auth.getUser();
      const isNewUser = isNewOAuthUser(userData.user);
      const provider = resolveAuthOAuthProviderFromUser(userData.user);
      return { handled: true, isOAuth: true, isNewUser, provider };
    } catch (e: any) {
      console.error('[Auth] setSession failed', e);
      logError('auth_deeplink_session_error', e, {});
      return { handled: false, error: e?.message ?? 'Sign-in failed' };
    }
  }

  return { handled: false };
}
