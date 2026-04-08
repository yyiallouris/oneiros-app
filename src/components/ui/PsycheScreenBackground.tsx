import React, { useMemo } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Defs, Path, RadialGradient, Stop } from 'react-native-svg';
import { backgrounds, brandIcon, contours, gradients } from '../../theme';
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

  const contourPaths = useMemo(() => {
    const w = width;
    const h = Math.max(680, height);

    return [
      `M ${-0.08 * w} ${0.18 * h} C ${0.05 * w} ${0.08 * h}, ${0.3 * w} ${0.08 * h}, ${0.44 * w} ${0.2 * h} S ${0.78 * w} ${0.36 * h}, ${1.02 * w} ${0.24 * h}`,
      `M ${-0.04 * w} ${0.24 * h} C ${0.12 * w} ${0.14 * h}, ${0.32 * w} ${0.16 * h}, ${0.46 * w} ${0.28 * h} S ${0.82 * w} ${0.42 * h}, ${1.04 * w} ${0.3 * h}`,
      `M ${-0.02 * w} ${0.31 * h} C ${0.14 * w} ${0.22 * h}, ${0.34 * w} ${0.23 * h}, ${0.5 * w} ${0.34 * h} S ${0.84 * w} ${0.47 * h}, ${1.06 * w} ${0.38 * h}`,
      `M ${0.02 * w} ${0.39 * h} C ${0.17 * w} ${0.31 * h}, ${0.37 * w} ${0.3 * h}, ${0.52 * w} ${0.41 * h} S ${0.84 * w} ${0.54 * h}, ${1.02 * w} ${0.48 * h}`,
      `M ${0.08 * w} ${0.47 * h} C ${0.22 * w} ${0.39 * h}, ${0.42 * w} ${0.4 * h}, ${0.56 * w} ${0.5 * h} S ${0.82 * w} ${0.62 * h}, ${0.98 * w} ${0.58 * h}`,
      `M ${0.18 * w} ${0.58 * h} C ${0.3 * w} ${0.5 * h}, ${0.48 * w} ${0.5 * h}, ${0.62 * w} ${0.58 * h} S ${0.8 * w} ${0.68 * h}, ${0.94 * w} ${0.66 * h}`,
    ];
  }, [height, width]);

  const contourStroke = `rgba(147, 125, 181, ${0.12 * contourOpacity})`;
  const contourStrokeStrong = `rgba(147, 125, 181, ${0.2 * contourOpacity})`;
  const contourGlow = `rgba(200, 140, 200, ${0.18 * contourOpacity})`;

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
          opacity={0.55 * contourOpacity}
        />
        <Path
          d={`M ${0.26 * width} ${0.02 * height} C ${0.64 * width} ${0.02 * height}, ${0.86 * width} ${0.14 * height}, ${0.98 * width} ${0.34 * height} L ${width} 0 L 0 0 Z`}
          fill="url(#psycheGlow)"
          opacity={0.9}
        />

        {contourPaths.map((d, index) => (
          <Path
            key={index}
            d={d}
            fill="none"
            stroke={index < 2 ? contourStrokeStrong : contourStroke}
            strokeWidth={index < 2 ? 1.6 : 1.15}
            strokeLinecap="round"
            opacity={0.95}
          />
        ))}

        <Path
          d={`M ${0.1 * width} ${0.18 * height} C ${0.28 * width} ${0.1 * height}, ${0.48 * width} ${0.11 * height}, ${0.62 * width} ${0.22 * height} S ${0.82 * width} ${0.4 * height}, ${0.92 * width} ${0.36 * height}`}
          fill="none"
          stroke={contourGlow}
          strokeWidth={2}
          strokeLinecap="round"
        />
      </Svg>

      <LinearGradient
        colors={['rgba(255,255,255,0)', 'rgba(217, 180, 232, 0.1)', 'rgba(73, 50, 76, 0.16)']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.bottomDepth}
      />

      {showMountains && <MountainWaveBackground height={waveHeight} lite={lite} />}

      <LinearGradient
        colors={['rgba(255, 246, 255, 0.7)', 'rgba(255,255,255,0)']}
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
