/**
 * Stub for react-native-reanimated when the native package is not built.
 * Use this so the app and tests run without the reanimated native module.
 * Your app uses React Native's built-in Animated; this satisfies optional peers
 * (e.g. gesture-handler, react-navigation) so they don't crash.
 */
'use strict';

const React = require('react');
const {
  View,
  Text,
  Image,
  Animated: AnimatedRN,
  ScrollView,
  FlatList,
} = require('react-native');

const NOOP = () => {};
const ID = (t) => t;

const createAnimatedComponent = (Comp) => Comp;

const Animated = {
  View,
  Text,
  Image,
  ScrollView: AnimatedRN.ScrollView,
  FlatList: AnimatedRN.FlatList,
  createAnimatedComponent,
  interpolate: NOOP,
  interpolateColor: NOOP,
  clamp: NOOP,
  addWhitelistedUIProps: NOOP,
  addWhitelistedNativeProps: NOOP,
  Extrapolate: { CLAMP: 0, EXTEND: 1, IDENTITY: 2 },
};

const stub = {
  runOnJS: ID,
  runOnUI: ID,
  createWorkletRuntime: NOOP,
  runOnRuntime: NOOP,
  makeMutable: ID,
  makeShareableCloneRecursive: ID,
  isReanimated3: () => true,
  enableLayoutAnimations: NOOP,
  useAnimatedProps: (fn) => fn(),
  useWorkletCallback: ID,
  useSharedValue: (init) => ({ value: init }),
  useAnimatedStyle: (fn) => (fn ? fn() : {}),
  useAnimatedGestureHandler: () => NOOP,
  useAnimatedReaction: NOOP,
  useAnimatedRef: () => ({ current: null }),
  useAnimatedScrollHandler: () => NOOP,
  useDerivedValue: (processor) => ({ value: typeof processor === 'function' ? processor() : 0 }),
  useAnimatedSensor: () => ({ sensor: { value: {} }, unregister: NOOP, isAvailable: false, config: {} }),
  useAnimatedKeyboard: () => ({ height: 0, state: 0 }),
  cancelAnimation: NOOP,
  withDecay: (_config, cb) => { if (cb) cb(true); return 0; },
  withDelay: (_d, next) => next,
  withRepeat: ID,
  withSequence: () => 0,
  withSpring: (toVal, _config, cb) => { if (cb) cb(true); return toVal; },
  withTiming: (toVal, _config, cb) => { if (cb) cb(true); return toVal; },
  Extrapolation: { CLAMP: 0, EXTEND: 1, IDENTITY: 2 },
  interpolate: NOOP,
  interpolateColor: NOOP,
  Easing: {
    linear: ID,
    ease: ID,
    quad: ID,
    cubic: ID,
    poly: ID,
    sin: ID,
    circle: ID,
    exp: ID,
    elastic: ID,
    back: ID,
    bounce: ID,
    bezier: () => ({ factory: ID }),
    in: ID,
    out: ID,
    inOut: ID,
  },
  measure: () => ({ x: 0, y: 0, width: 0, height: 0, pageX: 0, pageY: 0 }),
  scrollTo: NOOP,
  FadeIn: {},
  FadeOut: {},
  SlideInRight: {},
  SlideOutLeft: {},
  Layout: {},
  LinearTransition: {},
  FadingTransition: {},
  SharedTransitionType: {},
};

module.exports = {
  __esModule: true,
  default: Animated,
  ...stub,
};
