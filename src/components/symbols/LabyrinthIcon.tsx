import React from 'react';
import { colors } from '../../theme';
import Svg, { Path, Circle } from 'react-native-svg';

interface LabyrinthIconProps {
  size?: number;
  color?: string;
}

export const LabyrinthIcon: React.FC<LabyrinthIconProps> = ({ size = 24, color = colors.buttonPrimary }) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9h-2m-7 9a9 9 0 01-9-9m9 9v-2m-9-7a9 9 0 019-9m-9 9h2m7-9v2"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth={1.5} />
    </Svg>
  );
};

