import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { iconography } from '../../theme';

interface NavigationTabIconProps {
  focused: boolean;
  size?: number;
  color?: string;
  testID?: string;
}

const JOURNAL_PATHS = [
  {
    d: 'M17.35 8.95C13.65 5.45 9.35 3.55 5.18 4.3C3.98 4.55 3.32 5.62 3.58 6.9C3.2 12.25 3.45 18.35 4.18 23.85C8.32 22.25 13.12 23.05 17.72 27.05',
    strokeWidth: 1.92,
  },
  {
    d: 'M18.55 8.05C22.15 5.1 26.18 4.12 29.78 4.55C31.38 4.75 32.35 3.82 33.05 2.75C32.95 4.45 33.15 6.05 32.55 7.45C32.9 12.65 32.62 18.42 32.02 24.02C27.65 22.72 22.62 23.55 18.12 27.08',
    strokeWidth: 2.04,
  },
  {
    d: 'M17.72 9.05C18.28 12.1 17.62 14.78 18.02 17.72C18.42 20.42 17.72 23.12 18.02 26.88',
    strokeWidth: 1.42,
  },
  {
    d: 'M5.22 21.78C8.62 20.72 12.72 21.5 16.58 24.05',
    strokeWidth: 0.92,
    opacity: 0.7,
  },
  {
    d: 'M19.32 24.38C22.48 22.6 26.48 21.72 30.55 22.72',
    strokeWidth: 1.02,
    opacity: 0.72,
  },
  {
    d: 'M24.15 8.18C26.12 7.35 28.12 7.2 29.9 7.55',
    strokeWidth: 0.76,
    opacity: 0.52,
  },
  {
    d: 'M4.12 7.25C3.85 11.15 3.9 15.35 4.22 18.7',
    strokeWidth: 2.5,
    opacity: 0.2,
  },
  {
    d: 'M32.42 9.5C32.65 13.3 32.48 17.05 32.2 20.1',
    strokeWidth: 2.55,
    opacity: 0.18,
  },
] as const;

const WRITE_SOURCE = require('../../assets/icons/tab-icons/write_nav_ink_v2.png');
const WRITE_CANVAS = 512;
const WRITE_BOUNDS = {
  left: 151,
  top: 45,
  width: 275,
  height: 421,
} as const;
const WRITE_VISIBLE_ASPECT_RATIO = 28 / 30;

const INSIGHTS_EYE_SOURCE = require('../../assets/icons/tab-icons/insights_nav_eye_ink.png');
const INSIGHTS_EYE_CANVAS = 900;
const INSIGHTS_EYE_BOUNDS = {
  left: 185,
  top: 330,
  width: 530,
  height: 390,
} as const;

/**
 * The approved authored feather, optically normalized into the shared tab
 * band. A faint offset duplicate restores pressure lost at device size while
 * preserving the source pixels, open silhouette, and dry-brush endings.
 */
export const WriteTabIcon: React.FC<NavigationTabIconProps> = ({
  focused,
  size = iconography.navigation.writeSize,
  color = focused ? iconography.navigation.activeInk : iconography.navigation.inactiveInk,
  testID,
}) => {
  const heightScale = size / WRITE_BOUNDS.height;
  const width = size * WRITE_VISIBLE_ASPECT_RATIO;
  const widthScale = width / WRITE_BOUNDS.width;
  const sourceStyle = {
    position: 'absolute' as const,
    width: WRITE_CANVAS * widthScale,
    height: WRITE_CANVAS * heightScale,
    left: -WRITE_BOUNDS.left * widthScale,
    top: -WRITE_BOUNDS.top * heightScale,
    tintColor: color,
  };

  return (
    <View
      testID={testID}
      style={[
        styles.rasterFrame,
        {
          width,
          height: size,
          opacity: focused
            ? iconography.navigation.activeOpacity
            : iconography.navigation.inactiveOpacity,
        },
      ]}
    >
      <Image
        source={WRITE_SOURCE}
        resizeMode="stretch"
        accessibilityIgnoresInvertColors
        accessible={false}
        style={[
          sourceStyle,
          styles.writePressureUnderlay,
        ]}
      />
      <Image
        source={WRITE_SOURCE}
        resizeMode="stretch"
        accessibilityIgnoresInvertColors
        accessible={false}
        style={sourceStyle}
      />
    </View>
  );
};

/**
 * An open dream journal with an authored, ink-drawn gesture.
 *
 * The concept and lightness stay intact. One outer page edge drifts upward,
 * while a stronger outer ink contour, unequal lower cadence, and a softly
 * wandering spine bring its optical mass closer to the feather and seeing
 * mark. It intentionally has no selection dot or badge; focus is expressed
 * through ink and opacity only.
 */
export const JournalTabIcon: React.FC<NavigationTabIconProps> = ({
  focused,
  size = iconography.navigation.journalSize,
  color = focused ? iconography.navigation.activeInk : iconography.navigation.inactiveInk,
  testID,
}) => (
  <Svg
    testID={testID}
    width={size}
    height={size * (32 / 36)}
    viewBox="0 0 36 32"
    fill="none"
    opacity={focused ? iconography.navigation.activeOpacity : iconography.navigation.inactiveOpacity}
    accessible={false}
  >
    {JOURNAL_PATHS.map((path, index) => (
      <Path
        key={`journal-${index}`}
        d={path.d}
        stroke={color}
        strokeWidth={path.strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={'opacity' in path ? path.opacity : 1}
      />
    ))}
  </Svg>
);

/**
 * The navigation seeing mark uses the original dry-brush eye as its anchor,
 * but crops away the two detached witness dots. Those dots belong to the
 * denser Insights-symbol language and became a selection badge at tab size.
 */
export const InsightsTabIcon: React.FC<NavigationTabIconProps> = ({
  focused,
  size = iconography.navigation.insightsSize,
  color = focused ? iconography.navigation.activeInk : iconography.navigation.inactiveInk,
  testID,
}) => {
  const scale = size / INSIGHTS_EYE_BOUNDS.width;
  const height = INSIGHTS_EYE_BOUNDS.height * scale;

  return (
    <View
      testID={testID}
      style={[
        styles.eyeFrame,
        {
          width: size,
          height,
          opacity: focused
            ? iconography.navigation.activeOpacity
            : iconography.navigation.inactiveOpacity,
        },
      ]}
    >
      <Image
        source={INSIGHTS_EYE_SOURCE}
        resizeMode="stretch"
        accessibilityIgnoresInvertColors
        accessible={false}
        style={{
          position: 'absolute',
          width: INSIGHTS_EYE_CANVAS * scale,
          height: INSIGHTS_EYE_CANVAS * scale,
          left: -INSIGHTS_EYE_BOUNDS.left * scale,
          top: -INSIGHTS_EYE_BOUNDS.top * scale,
          tintColor: color,
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  rasterFrame: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  writePressureUnderlay: {
    opacity: 0.22,
    transform: [{ scaleX: 1.04 }, { scaleY: 1.02 }],
  },
  eyeFrame: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
