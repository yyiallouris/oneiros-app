import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

const extras =
  Constants.expoConfig?.extra ??
  (Constants.manifest as any)?.extra ??
  {};

const SUPABASE_URL =
  extras.supabaseUrl ||
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_URL;

const SUPABASE_ANON_KEY =
  extras.supabaseAnonKey ||
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY;

// Log what we detected (no secrets)
console.log('[Supabase] Config detected', {
  hasUrl: !!SUPABASE_URL,
  hasAnonKey: !!SUPABASE_ANON_KEY,
  source: extras.supabaseUrl ? 'expo.extra' : 'env',
});

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    'Supabase configuration missing. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in .env (and restart Expo).'
  );
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage as any,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

