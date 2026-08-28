import 'dotenv/config';

// EAS project ID — required for EAS linking and builds; do not remove
const EAS_PROJECT_ID = 'b81471aa-9f89-4729-8bf3-5ec9e8ec62e9';

const baseExpoConfig = {
  name: 'Oneiros',
  slug: 'oneiros-app',
  version: '1.1.0',
  orientation: 'portrait',
  icon: './assets/branding/icon-ios.png',
  userInterfaceStyle: 'light',
  newArchEnabled: false,
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.oneirosdreamjournal.app',
    icon: './assets/branding/icon-ios.png',
    buildNumber: '2',
    usesAppleSignIn: true,
  },
  android: {
    icon: './assets/branding/icon-android-legacy.png',
    adaptiveIcon: {
      foregroundImage: './assets/branding/icon-android-foreground.png',
      backgroundImage: './assets/branding/icon-android-background.png',
      monochromeImage: './assets/branding/icon-android-monochrome.png',
    },
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
    package: 'com.oneirosdreamjournal.app',
    versionCode: 2,
  },
  scheme: 'oneiros-dream-journal',
  web: {
    favicon: './assets/favicon.png',
  },
  plugins: [
    'expo-asset',
    'expo-font',
    'expo-web-browser',
    [
      'expo-splash-screen',
      {
        backgroundColor: '#F8F3EA',
        image: './assets/branding/splash-lockup.png',
        imageWidth: 180,
      },
    ],
    [
      'expo-local-authentication',
      {
        faceIDPermission: 'Allow Oneiros to use Face ID to sign in.',
      },
    ],
    [
      'expo-secure-store',
      {
        faceIDPermission: 'Allow Oneiros to use Face ID to sign in.',
        // Oneiros supplies a combined rule set that excludes both SecureStore
        // and pending raw voice audio from backup/device transfer.
        configureAndroidBackup: false,
      },
    ],
    [
      'expo-audio',
      {
        microphonePermission:
          'Allow Oneiros to use your microphone for optional dream voice journaling and transcription.',
      },
    ],
    './plugins/withVoicePendingStoragePrivacy',
    'expo-iap',
  ],
  extra: {},
};

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

const scheme = getEnv(['APP_SCHEME'], baseExpoConfig.scheme || 'oneiros-dream-journal');

const extraFromEnv = {
  // Development-only direct API access. Never copy the server OPENAI_API_KEY into app extras.
  openaiApiKey: getEnv(['EXPO_PUBLIC_OPENAI_API_KEY'], ''),
  customGptEndpoint: getEnv(
    ['EXPO_PUBLIC_CUSTOM_GPT_ENDPOINT', 'CUSTOM_GPT_ENDPOINT'],
    null
  ),
  supabaseUrl: getEnv(
    ['EXPO_PUBLIC_SUPABASE_URL', 'SUPABASE_URL'],
    ''
  ),
  supabaseAnonKey: getEnv(
    ['EXPO_PUBLIC_SUPABASE_ANON_KEY', 'SUPABASE_ANON_KEY'],
    ''
  ),
  contactEmail: getEnv(['EXPO_PUBLIC_CONTACT_EMAIL', 'CONTACT_EMAIL'], ''),
  privacyPolicyUrl: getEnv(['EXPO_PUBLIC_PRIVACY_POLICY_URL', 'PRIVACY_POLICY_URL'], ''),
  termsUrl: getEnv(['EXPO_PUBLIC_TERMS_URL', 'TERMS_URL'], ''),
  appleSubscriptionMonthlyProductId: getEnv(
    ['EXPO_PUBLIC_APPLE_SUBSCRIPTION_MONTHLY_PRODUCT_ID', 'APPLE_SUBSCRIPTION_MONTHLY_PRODUCT_ID'],
    'oneiros_premium_monthly'
  ),
  appleSubscriptionYearlyProductId: getEnv(
    ['EXPO_PUBLIC_APPLE_SUBSCRIPTION_YEARLY_PRODUCT_ID', 'APPLE_SUBSCRIPTION_YEARLY_PRODUCT_ID'],
    'oneiros_premium_yearly'
  ),
  appleDeeperSubscriptionMonthlyProductId: getEnv(
    ['EXPO_PUBLIC_APPLE_DEEPER_SUBSCRIPTION_MONTHLY_PRODUCT_ID', 'APPLE_DEEPER_SUBSCRIPTION_MONTHLY_PRODUCT_ID'],
    'oneiros_deeper_monthly'
  ),
  appleDeeperSubscriptionYearlyProductId: getEnv(
    ['EXPO_PUBLIC_APPLE_DEEPER_SUBSCRIPTION_YEARLY_PRODUCT_ID', 'APPLE_DEEPER_SUBSCRIPTION_YEARLY_PRODUCT_ID'],
    'oneiros_deeper_yearly'
  ),
  googleSubscriptionProductId: getEnv(
    ['EXPO_PUBLIC_GOOGLE_SUBSCRIPTION_PRODUCT_ID', 'GOOGLE_SUBSCRIPTION_PRODUCT_ID'],
    'oneiros_premium'
  ),
  googleDeeperSubscriptionProductId: getEnv(
    ['EXPO_PUBLIC_GOOGLE_DEEPER_SUBSCRIPTION_PRODUCT_ID', 'GOOGLE_DEEPER_SUBSCRIPTION_PRODUCT_ID'],
    'oneiros_deeper'
  ),
  googleSubscriptionMonthlyBasePlanId: getEnv(
    ['EXPO_PUBLIC_GOOGLE_SUBSCRIPTION_MONTHLY_BASE_PLAN_ID', 'GOOGLE_SUBSCRIPTION_MONTHLY_BASE_PLAN_ID'],
    'monthly'
  ),
  googleSubscriptionYearlyBasePlanId: getEnv(
    ['EXPO_PUBLIC_GOOGLE_SUBSCRIPTION_YEARLY_BASE_PLAN_ID', 'GOOGLE_SUBSCRIPTION_YEARLY_BASE_PLAN_ID'],
    'yearly'
  ),
};

// Static project id so EAS CLI can read the linked project from extra.eas.
const projectId = baseExpoConfig.extra?.eas?.projectId ?? EAS_PROJECT_ID;

export default {
  ...baseExpoConfig,
  scheme,
  ios: {
    ...baseExpoConfig.ios,
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
    },
  },
  android: {
    ...baseExpoConfig.android,
    // Resize window when keyboard opens so KeyboardAvoidingView can keep focused input visible
    softwareKeyboardLayoutMode: 'resize',
  },
  extra: {
    ...baseExpoConfig.extra,
    ...extraFromEnv,
    eas: { projectId },
  },
};
