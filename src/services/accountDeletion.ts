import { supabase } from './supabaseClient';
import { StorageService } from './storageService';
import { logError, logEvent } from './logger';

export async function deleteAccountAndData(): Promise<void> {
  const { error } = await supabase.functions.invoke('delete-account', {
    method: 'POST',
  });

  if (error) {
    logError('account_delete_error', error);
    throw error;
  }

  await StorageService.clearAll();
  await supabase.auth.signOut();
  logEvent('account_delete_success');
}
