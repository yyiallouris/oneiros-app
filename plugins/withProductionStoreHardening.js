const {
  AndroidConfig,
  createRunOncePlugin,
  withAndroidManifest,
  withInfoPlist,
} = require('expo/config-plugins');

const STORE_PROFILES = new Set(['preview', 'production']);
const GENERATED_EXPO_SCHEME_PREFIX = 'exp+';
const DEVELOPMENT_ONLY_ANDROID_ACTIVITIES = [
  'androidx.compose.ui.tooling.PreviewActivity',
  'expo.modules.devlauncher.launcher.DevLauncherActivity',
  'expo.modules.devlauncher.compose.AuthActivity',
  'expo.modules.devlauncher.launcher.errors.DevLauncherErrorActivity',
];

function removeGeneratedAndroidSchemes(androidManifest) {
  for (const application of androidManifest.manifest.application || []) {
    for (const activity of application.activity || []) {
      for (const intentFilter of activity['intent-filter'] || []) {
        if (!intentFilter.data) continue;
        intentFilter.data = intentFilter.data.filter(
          (entry) => !entry?.$?.['android:scheme']?.startsWith(GENERATED_EXPO_SCHEME_PREFIX),
        );
      }
    }
  }
  return androidManifest;
}

function removeGeneratedIosSchemes(infoPlist) {
  if (!Array.isArray(infoPlist.CFBundleURLTypes)) return infoPlist;
  infoPlist.CFBundleURLTypes = infoPlist.CFBundleURLTypes
    .map((urlType) => ({
      ...urlType,
      CFBundleURLSchemes: (urlType.CFBundleURLSchemes || []).filter(
        (scheme) => !scheme.startsWith(GENERATED_EXPO_SCHEME_PREFIX),
      ),
    }))
    .filter((urlType) => urlType.CFBundleURLSchemes.length > 0);
  return infoPlist;
}

function addAndroidActivityRemoval(application, activityName) {
  application.activity = application.activity || [];
  const existing = application.activity.find(
    (activity) => activity?.$?.['android:name'] === activityName,
  );
  if (existing) {
    existing.$['tools:node'] = 'remove';
    return;
  }
  application.activity.push({
    $: {
      'android:name': activityName,
      'tools:node': 'remove',
    },
  });
}

function withProductionStoreHardening(config) {
  if (!STORE_PROFILES.has(process.env.EAS_BUILD_PROFILE || '')) {
    return config;
  }

  config = withAndroidManifest(config, (androidConfig) => {
    androidConfig.modResults = removeGeneratedAndroidSchemes(androidConfig.modResults);
    const application = AndroidConfig.Manifest.getMainApplicationOrThrow(androidConfig.modResults);
    for (const activityName of DEVELOPMENT_ONLY_ANDROID_ACTIVITIES) {
      addAndroidActivityRemoval(application, activityName);
    }
    return androidConfig;
  });

  config = withInfoPlist(config, (iosConfig) => {
    iosConfig.modResults = removeGeneratedIosSchemes(iosConfig.modResults);
    return iosConfig;
  });

  return config;
}

module.exports = createRunOncePlugin(
  withProductionStoreHardening,
  'with-production-store-hardening',
  '1.0.0',
);
