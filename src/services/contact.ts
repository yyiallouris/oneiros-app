import { supabase } from './supabaseClient';
import { logEvent, logError } from './logger';
import { sendSupportRequest } from './supportRequest';

interface ContactPayload {
  subject: string;
  message: string;
}

export const sendContactMessage = async ({ subject, message }: ContactPayload) => {
  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;

    const userId = userData.user?.id ?? null;
    const email = userData.user?.email?.trim() ?? '';
    if (!userId || !email) {
      throw new Error('A signed-in account with an email address is required.');
    }

    await sendSupportRequest({
      email,
      subject,
      message,
    });

    logEvent('contact_message_sent', { userId, hasEmail: true });
  } catch (error) {
    logError('contact_message_unhandled_error', error);
    throw error;
  }
};

