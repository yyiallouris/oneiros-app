import React from 'react';
import { Image, type ImageSourcePropType } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { iconography } from '../../theme';

interface ActionIconProps {
  size?: number;
  testID?: string;
  color?: string;
}

const microphoneIcon = require('../../assets/icons/action_icons/mic_play.png');
const calendarIcon = require('../../assets/icons/action_icons/calendar_icon.png');

const RasterActionIcon = ({
  source,
  size,
  testID,
}: ActionIconProps & { source: ImageSourcePropType; size: number }) => (
  <Image
    testID={testID}
    source={source}
    style={{ width: size, height: size }}
    resizeMode="contain"
    accessible={false}
    accessibilityIgnoresInvertColors
  />
);

/** Original Oneiros microphone silhouette, optically cropped and quietly inked. */
export const MicrophoneActionIcon: React.FC<ActionIconProps> = ({
  size = iconography.functional.microphoneSize,
  testID,
}) => (
  <RasterActionIcon
    source={microphoneIcon}
    size={size}
    testID={testID}
  />
);

/** Original Oneiros calendar silhouette, optically cropped and quietly inked. */
export const CalendarActionIcon: React.FC<ActionIconProps> = ({
  size = iconography.functional.calendarSize,
  testID,
}) => (
  <RasterActionIcon
    source={calendarIcon}
    size={size}
    testID={testID}
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
