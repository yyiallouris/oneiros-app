import 'dotenv/config';
import appJson from './app.json';

const env = process.env;

const getEnv = (keys, fallback = '') => {
  for (const key of keys) {
    let value = env[key];
    if (typeof value === 'string' && value.trim().length > 0) {
      value = value.trim();
      // strip surrounding quotes if present
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1);
      }
      return value;
    }
  }
  return fallback;
};

export default ({ config }) => {
  const scheme = getEnv(['APP_SCHEME'], appJson.expo.scheme || 'dreamjournal');

  const extra = {
    openaiApiKey: getEnv(
      ['EXPO_PUBLIC_OPENAI_API_KEY', 'OPENAI_API_KEY'],
      ''
    ),
    customGptEndpoint: getEnv(
      ['EXPO_PUBLIC_CUSTOM_GPT_ENDPOINT', 'CUSTOM_GPT_ENDPOINT'],
      null
    ),
    gptModel: getEnv(['EXPO_PUBLIC_GPT_MODEL', 'GPT_MODEL'], 'gpt-4o'),
    supabaseUrl: getEnv(
      ['EXPO_PUBLIC_SUPABASE_URL', 'SUPABASE_URL'],
      ''
    ),
    supabaseAnonKey: getEnv(
      ['EXPO_PUBLIC_SUPABASE_ANON_KEY', 'SUPABASE_ANON_KEY'],
      ''
    ),
  };

  return {
    ...appJson.expo,
    ...config,
    scheme,
    extra,
  };
};

