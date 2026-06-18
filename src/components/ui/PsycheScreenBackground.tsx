import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { gradients } from '../../theme';
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
  contourOpacity: _contourOpacity = 1,
}) => {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <LinearGradient
        colors={[gradients.screenTop, gradients.screenMid, gradients.screenBottom]}
        start={{ x: 0.15, y: 0 }}
        end={{ x: 0.85, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <LinearGradient
        colors={['rgba(255, 252, 250, 0)', 'rgba(239, 232, 241, 0.1)', 'rgba(110, 77, 120, 0.08)']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.bottomDepth}
      />

      {showMountains && <MountainWaveBackground height={waveHeight} lite={lite} />}

      <LinearGradient
        colors={['rgba(255, 252, 250, 0.46)', 'rgba(255, 252, 250, 0)']}
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
