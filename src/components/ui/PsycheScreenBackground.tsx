import React from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Defs, Path, RadialGradient, Stop } from 'react-native-svg';
import { contours, gradients } from '../../theme';
import { MountainWaveBackground } from './MountainWaveBackground';

interface PsycheScreenBackgroundProps {
  waveHeight?: number;
  lite?: boolean;
  showMountains?: boolean;
  contourOpacity?: number;
}

export const PsycheScreenBackground: React.FC<PsycheScreenBackgroundProps> = ({
  waveHeight = 260,
  lite = true,
  showMountains = true,
  contourOpacity = 1,
}) => {
  const { width, height } = useWindowDimensions();

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <LinearGradient
        colors={[gradients.screenTop, gradients.screenMid, gradients.screenBottom]}
        start={{ x: 0.15, y: 0 }}
        end={{ x: 0.85, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
        <Defs>
          <RadialGradient id="psycheGlow" cx="50%" cy="20%" r="55%">
            <Stop offset="0%" stopColor={gradients.auraTop} stopOpacity="1" />
            <Stop offset="45%" stopColor={gradients.auraMid} stopOpacity="0.65" />
            <Stop offset="100%" stopColor={gradients.auraBottom} stopOpacity="0" />
          </RadialGradient>
        </Defs>

        <Path
          d={`M ${0.12 * width} ${0.1 * height} C ${0.28 * width} ${0.03 * height}, ${0.55 * width} ${0.05 * height}, ${0.72 * width} ${0.15 * height} S ${0.88 * width} ${0.3 * height}, ${0.84 * width} ${0.44 * height} C ${0.78 * width} ${0.58 * height}, ${0.55 * width} ${0.62 * height}, ${0.34 * width} ${0.55 * height} C ${0.18 * width} ${0.49 * height}, ${0.02 * width} ${0.34 * height}, ${0.12 * width} ${0.1 * height} Z`}
          fill={contours.fill}
          opacity={0.34 * contourOpacity}
        />
        <Path
          d={`M ${0.26 * width} ${0.02 * height} C ${0.64 * width} ${0.02 * height}, ${0.86 * width} ${0.14 * height}, ${0.98 * width} ${0.34 * height} L ${width} 0 L 0 0 Z`}
          fill="url(#psycheGlow)"
          opacity={0.54}
        />

      </Svg>

      <LinearGradient
        colors={['rgba(255,255,255,0)', 'rgba(231, 217, 242, 0.08)', 'rgba(107, 75, 123, 0.1)']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.bottomDepth}
      />

      {showMountains && <MountainWaveBackground height={waveHeight} lite={lite} />}

      <LinearGradient
        colors={['rgba(255, 250, 255, 0.44)', 'rgba(255,255,255,0)']}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={styles.topHaze}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  bottomDepth: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '58%',
  },
  topHaze: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: '30%',
  },
});
