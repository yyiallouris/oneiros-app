import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface MoonIconProps {
  size?: number;
  color?: string;
}

export const MoonIcon: React.FC<MoonIconProps> = ({ size = 24, color = '#8E7BBF' }) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

