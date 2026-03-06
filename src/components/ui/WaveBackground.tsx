import React, { useEffect, useRef, useMemo } from 'react';
import { View, StyleSheet, useWindowDimensions, Animated, Platform } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors } from '../../theme';

const WaveBackgroundInner: React.FC = () => {
  const { width } = useWindowDimensions();
  const W = width + 60;

  const waveAnim1 = useRef(new Animated.Value(0)).current;
  const waveAnim2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const createWaveAnimation = (animValue: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(animValue, {
            toValue: 1,
            duration: 8000 + delay * 2000,
            useNativeDriver: true,
          }),
          Animated.timing(animValue, {
            toValue: 0,
            duration: 8000 + delay * 2000,
            useNativeDriver: true,
          }),
        ])
      );

    const anim1 = createWaveAnimation(waveAnim1, 0);
    const anim2 = createWaveAnimation(waveAnim2, 1);
    anim1.start();
    anim2.start();
    return () => {
      anim1.stop();
      anim2.stop();
    };
  }, [waveAnim1, waveAnim2]);

  const translateX1 = waveAnim1.interpolate({ inputRange: [0, 1], outputRange: [0, 30] });
  const translateX2 = waveAnim2.interpolate({ inputRange: [0, 1], outputRange: [0, -20] });

  const path1 = useMemo(
    () => `M0,100 Q${W * 0.25},80 ${W * 0.5},100 T${W},100 L${W},200 L0,200 Z`,
    [W]
  );
  const path2 = useMemo(
    () => `M0,140 Q${W * 0.25},118 ${W * 0.5},140 T${W},140 L${W},200 L0,200 Z`,
    [W]
  );

  return (
    <View style={styles.container} renderToHardwareTextureAndroid={Platform.OS === 'android'}>
      <Animated.View style={[styles.waveContainer, { transform: [{ translateX: translateX1 }] }]}>
        <Svg width={W} height={200} viewBox={`0 0 ${W} 200`} style={styles.wave}>
          <Path d={path1} fill={colors.wave1} opacity={0.3} />
        </Svg>
      </Animated.View>
      <Animated.View style={[styles.waveContainer, { transform: [{ translateX: translateX2 }] }]}>
        <Svg width={W} height={200} viewBox={`0 0 ${W} 200`} style={styles.wave}>
          <Path d={path2} fill={colors.wave2} opacity={0.2} />
        </Svg>
      </Animated.View>
    </View>
  );
};

export const WaveBackground = React.memo(WaveBackgroundInner);

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: -30,
    right: -30,
    height: 200,
    overflow: 'hidden',
  },
  waveContainer: {
    position: 'absolute',
    bottom: 0,
  },
  wave: {
    position: 'absolute',
    bottom: 0,
  },
});
