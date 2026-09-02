import React from 'react';
import { Image } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { iconography } from '../../theme';

interface ActionIconProps {
  size?: number;
  testID?: string;
  color?: string;
}

// Final Oneiros v1 artifact: oneiros-calendar-date-leaf-v1.0.0.
const calendarDateLeafInk = require('../../assets/icons/action_icons/calendar_date_leaf_ink_v1.png');

/** Pressure-led native-ink microphone: intimate voice capture, not studio equipment. */
export const MicrophoneActionIcon: React.FC<ActionIconProps> = ({
  size = iconography.functional.microphoneSize,
  testID,
  color = iconography.ink.secondary,
}) => {
  const roundedInk = {
    stroke: color,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    fill: 'none',
  };

  return (
    <Svg
      testID={testID}
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      accessible={false}
    >
      <Path
        d="M13.6 4.3C12.1 4.9 11.3 6.4 11.4 8.2L11.2 15.7C11.1 18.6 12.6 20.6 15.2 20.9C17.9 21.2 19.7 19 19.7 15.9L19.6 8.1C19.6 6.2 18.8 4.8 17.2 4.2C16.2 3.7 14.6 3.7 13.6 4.3Z"
        strokeWidth={1.9}
        {...roundedInk}
      />
      <Path
        d="M11.3 8.2C11.1 10.8 11.2 13.8 11.1 16"
        strokeWidth={2.55}
        opacity={0.16}
        {...roundedInk}
      />
      <Path
        d="M8 15.5C8.2 20.3 10.4 23.1 14.2 24"
        strokeWidth={1.7}
        {...roundedInk}
      />
      <Path
        d="M16.6 24.2C20.4 23.8 22.7 20.8 23 15.1"
        strokeWidth={1.85}
        {...roundedInk}
      />
      <Path d="M15.2 24.6C15.9 25.7 15.1 26.8 15.7 28" strokeWidth={1.45} {...roundedInk} />
      <Path d="M12.2 28.5C14.5 28 17.2 28.8 19.1 28.1" strokeWidth={1.75} {...roundedInk} />
      <Path
        d="M13 16.8C13.5 18.2 14.6 19.2 16 19.4"
        strokeWidth={1}
        opacity={0.32}
        {...roundedInk}
      />
    </Svg>
  );
};

/** Textured date leaf: hand-shaped ink masses, dry breaks, and a quiet page lift. */
export const CalendarActionIcon: React.FC<ActionIconProps> = ({
  size = iconography.functional.calendarSize,
  testID,
  color = iconography.ink.secondary,
}) => (
  <Image
    testID={testID}
    source={calendarDateLeafInk}
    resizeMode="contain"
    accessibilityIgnoresInvertColors
    accessible={false}
    style={{ width: size, height: size, tintColor: color }}
  />
);

const strokeProps = {
  strokeWidth: iconography.stroke.functional,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

export const SearchActionIcon: React.FC<ActionIconProps> = ({
  size = 20,
  testID,
  color = iconography.ink.secondary,
}) => (
  <Svg testID={testID} width={size} height={size} viewBox="0 0 24 24" fill="none" accessible={false}>
    <Circle cx="11" cy="11" r="8" stroke={color} {...strokeProps} />
    <Path d="M21 21l-4.35-4.35" stroke={color} {...strokeProps} />
  </Svg>
);

export const EditActionIcon: React.FC<ActionIconProps> = ({
  size = 24,
  testID,
  color = iconography.ink.primary,
}) => (
  <Svg testID={testID} width={size} height={size} viewBox="0 0 24 24" fill="none" accessible={false}>
    <Path
      d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"
      stroke={color}
      {...strokeProps}
    />
  </Svg>
);

export const SendActionIcon: React.FC<ActionIconProps> = ({
  size = 24,
  testID,
  color = iconography.ink.primary,
}) => (
  <Svg testID={testID} width={size} height={size} viewBox="0 0 24 24" fill="none" accessible={false}>
    <Path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke={color} {...strokeProps} />
  </Svg>
);

export const CopyActionIcon: React.FC<ActionIconProps> = ({
  size = 20,
  testID,
  color = iconography.ink.secondary,
}) => (
  <Svg testID={testID} width={size} height={size} viewBox="0 0 24 24" fill="none" accessible={false}>
    <Path
      d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"
      stroke={color}
      {...strokeProps}
    />
  </Svg>
);

export const ChevronDownActionIcon: React.FC<ActionIconProps> = ({
  size = 22,
  testID,
  color = iconography.ink.secondary,
}) => (
  <Svg testID={testID} width={size} height={size} viewBox="0 0 24 24" fill="none" accessible={false}>
    <Path d="M6 9l6 6 6-6" stroke={color} {...strokeProps} />
  </Svg>
);
