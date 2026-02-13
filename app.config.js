import 'dotenv/config';
import appJson from './app.json';

// EAS project ID — required for EAS linking and builds; do not remove
const EAS_PROJECT_ID = 'b81471aa-9f89-4729-8bf3-5ec9e8ec62e9';

const env = process.env;

const getEnv = (keys, fallback = '') => {
  for (const key of keys) {
    let value = env[key];
    if (typeof value === 'string' && value.trim().length > 0) {
      value = value.trim();
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1);
      }
      return value;
    }
  }
  return fallback;
};

const scheme = getEnv(['APP_SCHEME'], appJson.expo?.scheme || 'dreamjournal');

const extraFromEnv = {
  openaiApiKey: getEnv(['EXPO_PUBLIC_OPENAI_API_KEY', 'OPENAI_API_KEY'], ''),
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

// Static export so EAS CLI can read/write projectId during linking (function export breaks modifyConfigAsync)
const projectId = appJson.expo?.projectId ?? EAS_PROJECT_ID;

export default {
  ...appJson.expo,
  projectId,
  scheme,
  android: {
    ...appJson.expo?.android,
    // Resize window when keyboard opens so KeyboardAvoidingView can keep focused input visible
    softwareKeyboardLayoutMode: 'resize',
  },
  extra: {
    ...extraFromEnv,
    eas: { projectId },
  },
};

