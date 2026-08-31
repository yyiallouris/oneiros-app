import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { iconography } from '../../theme';

interface JournalTabIconProps {
  focused: boolean;
  size?: number;
  color?: string;
  testID?: string;
}

const JOURNAL_PATHS = [
  {
    d: 'M17.56 8.78C14.25 4.92 9.9 2.72 4.82 3.98C3.7 4.26 3.16 5.2 3.38 6.34',
    strokeWidth: 1.28,
  },
  {
    d: 'M3.38 6.34C3 11.92 3.22 18.6 3.92 23.88C8.02 22.16 12.82 22.88 17.68 27.52',
    strokeWidth: 1.04,
  },
  {
    d: 'M18.48 7.58C22.12 4.62 26.48 3.76 30.72 4.12C31.68 4.2 32.42 3.84 32.88 3.3C32.92 4.48 33.02 5.7 32.78 6.72',
    strokeWidth: 1.1,
  },
  {
    d: 'M32.78 6.72C33.08 12.38 32.68 18.56 32.18 24.2C27.72 22.82 22.55 23.56 18.05 27.42',
    strokeWidth: 0.92,
  },
  {
    d: 'M17.7 8.66C18.32 11.76 17.54 14.44 18.08 17.32C18.58 20.06 17.66 23.12 18.04 27.24',
    strokeWidth: 0.88,
  },
  {
    d: 'M4.86 22.02C8.66 20.82 12.94 21.58 17.2 24.48M18.9 24.96C22.38 22.92 26.58 21.72 31.14 22.92',
    strokeWidth: 0.6,
    opacity: 0.62,
  },
] as const;

/**
 * An open dream journal with an authored, ink-drawn gesture.
 *
 * The concept and lightness stay intact. One outer page edge drifts upward,
 * while uneven lower cadence, variable line pressure, and a softly wandering
 * spine keep it from resolving into a generic mirrored library glyph. It
 * intentionally has no selection dot or badge; focus is expressed through ink
 * and opacity only.
 */
export const JournalTabIcon: React.FC<JournalTabIconProps> = ({
  focused,
  size = iconography.navigation.journalSize,
  color = focused ? iconography.ink.primary : iconography.ink.inactive,
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
