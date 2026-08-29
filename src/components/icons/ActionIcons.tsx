import React from 'react';
import { Image, type ImageSourcePropType } from 'react-native';

const microphoneIcon = require('../../assets/icons/action_icons/mic_play_bold.png');
const calendarIcon = require('../../assets/icons/action_icons/calendar_icon_bold.png');

interface ActionIconProps {
  size?: number;
  testID?: string;
}

interface RasterActionIconProps extends ActionIconProps {
  source: ImageSourcePropType;
}

const RasterActionIcon: React.FC<RasterActionIconProps> = ({
  source,
  size = 29,
  testID,
}) => (
  <Image
    testID={testID}
    source={source}
    style={{ width: size, height: size }}
    resizeMode="contain"
    accessible={false}
    accessibilityIgnoresInvertColors
  />
);

export const MicrophoneActionIcon: React.FC<ActionIconProps> = ({
  size = 29,
  testID,
}) => <RasterActionIcon source={microphoneIcon} size={size} testID={testID} />;

export const CalendarActionIcon: React.FC<ActionIconProps> = ({
  size = 32,
  testID,
}) => <RasterActionIcon source={calendarIcon} size={size} testID={testID} />;
