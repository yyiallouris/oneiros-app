import { supabase } from './supabaseClient';
import { logEvent, logError } from './logger';

export interface SupportRequestPayload {
  email: string;
  message: string;
}

/**
 * Send a login/support request (no auth required).
 * Backend emails support and sends auto-reply from support@oneirosjournal.com.
 */
export async function sendSupportRequest({ email, message }: SupportRequestPayload): Promise<void> {
  logEvent('support_request_invoke_start', {});
  const { data, error } = await supabase.functions.invoke('support-request', {
    body: { email: email.trim(), message: message.trim() },
  });

  if (error) {
    logError('support_request_invoke_error', error, {});
    throw error;
  }

  if (data?.error) {
    logError('support_request_invoke_error', new Error(data.error), {});
    throw new Error(data.error);
  }
  logEvent('support_request_invoke_ok', {});
}
