// Ensure reanimated plugin is skipped during Jest/Babel load
process.env.REANIMATED_PLUGIN_SKIP = 'true';
process.env.JEST_DISABLE_WATCHMAN = '1';
process.env.EXPO_PUBLIC_SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://example.supabase.co';
process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'anon-key';
// Ensure reanimated plugin is skipped during Jest/Babel load
process.env.REANIMATED_PLUGIN_SKIP = 'true';
process.env.JEST_DISABLE_WATCHMAN = '1';

