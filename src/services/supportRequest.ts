import { supabase } from './supabaseClient';
import { logEvent, logError } from './logger';

export interface SupportRequestPayload {
  email: string;
  subject?: string;
  message: string;
}

/**
 * Send a support request. The backend accepts signed-in and signed-out callers,
 * owns the destination address, and sends the support notification + auto-reply.
 */
export async function sendSupportRequest({
  email,
  subject,
  message,
}: SupportRequestPayload): Promise<void> {
  logEvent('support_request_invoke_start', {});
  const { data, error } = await supabase.functions.invoke('support-request', {
    body: {
      email: email.trim(),
      subject: subject?.trim() || undefined,
      message: message.trim(),
    },
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
