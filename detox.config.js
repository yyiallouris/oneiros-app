/** Detox configuration placeholder.
 * For Expo-managed apps you need a dev client build.
 * Update `app` path to your built APK/IPA and emulator/simulator name.
 */

module.exports = {
  testRunner: 'jest',
  runnerConfig: 'e2e/jest.config.js',
  specs: 'e2e',
  artifacts: {
    rootDir: 'artifacts',
  },
  configurations: {
    'android.emu.debug': {
      device: {
        type: 'android.emulator',
        avdName: 'Pixel_6_API_34', // change to your emulator name
      },
      app: 'android/app/build/outputs/apk/debug/app-debug.apk', // update after building dev client
      type: 'android.apk',
    },
  },
};

