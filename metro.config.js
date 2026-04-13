const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
const { assetExts, sourceExts } = config.resolver;

config.transformer = {
  ...config.transformer,
  babelTransformerPath: require.resolve('react-native-svg-transformer/expo'),
};

config.resolver.assetExts = assetExts.filter((ext) => ext !== 'svg');
config.resolver.sourceExts = [...sourceExts, 'svg'];

// Resolve react-native-reanimated to our stub so the app runs without the native module.
// The native module fails to build on EAS (CMake/prefab issue); the app uses RN Animated only.
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'react-native-reanimated' || moduleName === 'react-native-reanimated/plugin') {
    if (moduleName === 'react-native-reanimated/plugin') {
      return { type: 'sourceFile', filePath: path.resolve(__dirname, '__mocks__/reanimatedPlugin.js') };
    }
    return { type: 'sourceFile', filePath: path.resolve(__dirname, '__mocks__/react-native-reanimated.js') };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
