module.exports = {
  preset: 'jest-expo',
  testPathIgnorePatterns: ['/node_modules/', '/android/', '/ios/', '/.expo/'],
  setupFiles: ['<rootDir>/jest.env.js'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  transformIgnorePatterns: [
    'node_modules/(?!(@react-native|react-native|@react-navigation|expo-modules-core|expo-modules|expo)/)',
  ],
  moduleNameMapper: {
    '^react-native-reanimated$': '<rootDir>/node_modules/react-native-reanimated/mock',
    '^react-native-reanimated/plugin$': '<rootDir>/__mocks__/reanimatedPlugin.js',
    '^react-native-worklets/plugin$': '<rootDir>/__mocks__/workletsPlugin.js',
    '^@jest/test-sequencer$': '<rootDir>/__mocks__/@jest/test-sequencer.js',
    '^react-native/Libraries/Animated/NativeAnimatedHelper$': '<rootDir>/__mocks__/NativeAnimatedHelper.js',
    '^expo-constants$': '<rootDir>/__mocks__/expo-constants.js',
  },
  testSequencer: '<rootDir>/__mocks__/@jest/test-sequencer.js',
};

