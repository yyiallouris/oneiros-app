import { supabase } from './supabaseClient';
import { StorageService } from './storageService';
import { logError, logEvent } from './logger';
import { Platform } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';

export async function deleteAccountAndData(): Promise<void> {
  const { data: userResult, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  const user = userResult.user;
  const usesApple = Boolean(
    user?.app_metadata?.provider === 'apple'
      || user?.app_metadata?.providers?.includes?.('apple')
      || user?.identities?.some((identity) => identity.provider === 'apple')
  );

  let appleAuthorizationCode: string | undefined;
  if (usesApple && Platform.OS === 'ios') {
    const available = await AppleAuthentication.isAvailableAsync();
    if (!available) throw new Error('Apple reauthentication is not available on this device.');
    const credential = await AppleAuthentication.signInAsync({ requestedScopes: [] });
    appleAuthorizationCode = credential.authorizationCode ?? undefined;
    if (!appleAuthorizationCode) {
      throw new Error('Apple did not return an account authorization code.');
    }
  }

  const { error } = await supabase.functions.invoke('delete-account', {
    method: 'POST',
    body: appleAuthorizationCode ? { appleAuthorizationCode } : {},
  });

  if (error) {
    logError('account_delete_error', error);
    throw error;
  }

  await StorageService.clearAll();
  await supabase.auth.signOut();
  logEvent('account_delete_success');
}
