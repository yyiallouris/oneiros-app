import '@testing-library/jest-native/extend-expect';

// Skip loading reanimated plugin (avoids react-native-worklets/plugin in Jest)
process.env.REANIMATED_PLUGIN_SKIP = 'true';

// Silence NativeAnimatedHelper warnings
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');

// Mock reanimated
jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));

// Mock AsyncStorage
jest.mock(
  '@react-native-async-storage/async-storage',
  () => require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

