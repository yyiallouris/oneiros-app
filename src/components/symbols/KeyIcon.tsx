import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';

interface KeyIconProps {
  size?: number;
  color?: string;
}

export const KeyIcon: React.FC<KeyIconProps> = ({ size = 24, color = '#8E7BBF' }) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="7" cy="7" r="4" stroke={color} strokeWidth={2} />
      <Path
        d="M10.5 10.5l9 9M13.5 13.5v3M16.5 16.5v3"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

