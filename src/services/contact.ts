import { supabase } from './supabaseClient';
import { logEvent, logError } from './logger';
import Constants from 'expo-constants';

interface ContactPayload {
  subject: string;
  message: string;
}

export const sendContactMessage = async ({ subject, message }: ContactPayload) => {
  const targetEmail =
    Constants.expoConfig?.extra?.contactEmail ||
    (Constants.manifest as any)?.extra?.contactEmail ||
    process.env.EXPO_PUBLIC_CONTACT_EMAIL;

  try {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id ?? null;
    const email = userData.user?.email ?? null;

    const { error } = await supabase.from('contact_messages').insert({
      user_id: userId,
      email,
      target_email: targetEmail || null,
      subject,
      message,
    });

    if (error) {
      logError('contact_message_error', error);
      throw error;
    }

    logEvent('contact_message_sent', { userId, hasEmail: !!email, targetEmailSet: !!targetEmail });

    if (!targetEmail) {
      console.warn(
        '[Contact] No contactEmail configured. Set EXPO_PUBLIC_CONTACT_EMAIL in .env so backend can route messages.'
      );
    }
  } catch (error) {
    logError('contact_message_unhandled_error', error);
    throw error;
  }
};


