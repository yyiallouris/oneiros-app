import React, { useEffect, useRef, useMemo } from 'react';
import { View, StyleSheet, Animated, useWindowDimensions, Easing, Platform } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { backgrounds, waveTints, accent } from '../../theme';

const AnimatedPath = Animated.createAnimatedComponent(Path);

interface MountainWaveBackgroundProps {
  height?: number;
  /** When true: same palette & 3 waves, but static tints (no 52s tint loop). Use in swipeable contexts for perf. */
  lite?: boolean;
}

const MountainWaveBackgroundInner: React.FC<MountainWaveBackgroundProps> = ({ height = 300, lite = false }) => {
  const { width } = useWindowDimensions();
  const W = width + 80;

  const waveAnim1 = useRef(new Animated.Value(0)).current;
  const waveAnim2 = useRef(new Animated.Value(0)).current;
  const waveAnim3 = useRef(new Animated.Value(0)).current;
  const colorPhase = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const createWaveAnimation = (animValue: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(animValue, { toValue: 1, duration: 12000 + delay * 3000, useNativeDriver: true }),
          Animated.timing(animValue, { toValue: 0, duration: 12000 + delay * 3000, useNativeDriver: true }),
        ])
      );

    const anim1 = createWaveAnimation(waveAnim1, 0);
    const anim2 = createWaveAnimation(waveAnim2, 1);
    const anim3 = createWaveAnimation(waveAnim3, 2);

    const tintLoop = lite
      ? null
      : Animated.loop(
          Animated.sequence([
            Animated.timing(colorPhase, {
              toValue: 1,
              duration: 52000,
              easing: Easing.inOut(Easing.cubic),
              useNativeDriver: true,
            }),
            Animated.timing(colorPhase, {
              toValue: 0,
              duration: 52000,
              easing: Easing.inOut(Easing.cubic),
              useNativeDriver: true,
            }),
          ])
        );

    anim1.start();
    anim2.start();
    anim3?.start();
    tintLoop?.start();

    return () => {
      anim1.stop();
      anim2.stop();
      anim3?.stop();
      tintLoop?.stop();
    };
  }, [lite, colorPhase, waveAnim1, waveAnim2, waveAnim3]);

  const translateX1 = waveAnim1.interpolate({ inputRange: [0, 1], outputRange: [0, 40] });
  const translateX2 = waveAnim2.interpolate({ inputRange: [0, 1], outputRange: [0, -30] });
  const translateX3 = waveAnim3.interpolate({ inputRange: [0, 1], outputRange: [0, 25] });

  const tintAOpacity = colorPhase.interpolate({ inputRange: [0, 1], outputRange: [0.0, 0.22] });
  const tintBOpacity = colorPhase.interpolate({ inputRange: [0, 1], outputRange: [0.18, 0.0] });
  const accentMistOpacity = colorPhase.interpolate({ inputRange: [0, 1], outputRange: [0.03, 0.06] });

  const base1 = 0.40;
  const base2 = 0.30;
  const base3 = 0.25;

  const paths = useMemo(
    () => ({
      p1: `M0,${height * 0.6} Q${W * 0.1},${height * 0.5} ${W * 0.2},${height * 0.45} T${W * 0.4},${height * 0.4} T${W * 0.6},${height * 0.42} T${W * 0.8},${height * 0.38} T${W},${height * 0.4} L${W},${height} L0,${height} Z`,
      p2: `M0,${height * 0.7} Q${W * 0.12},${height * 0.62} ${W * 0.25},${height * 0.58} T${W * 0.5},${height * 0.52} T${W * 0.75},${height * 0.55} T${W},${height * 0.58} L${W},${height} L0,${height} Z`,
      p3: `M0,${height * 0.8} Q${W * 0.15},${height * 0.72} ${W * 0.3},${height * 0.7} T${W * 0.5},${height * 0.65} T${W * 0.7},${height * 0.68} T${W},${height * 0.7} L${W},${height} L0,${height} Z`,
    }),
    [height, W]
  );

  const renderWave = (d: string, baseFill: string, baseOpacity: number, tintStrength: number) => (
    <Svg width={W} height={height} viewBox={`0 0 ${W} ${height}`} style={styles.wave}>
      <Path d={d} fill={baseFill} opacity={baseOpacity} />
      {lite ? (
        /* Lite: same palette as full mode, but static (no tint animation) for perf */
        <>
          <Path d={d} fill={waveTints.A} opacity={0.11 * tintStrength} />
          <Path d={d} fill={waveTints.B} opacity={0.09 * tintStrength} />
          <Path d={d} fill={accent.buttonPrimary} opacity={0.045 * tintStrength} />
        </>
      ) : (
        <>
          <AnimatedPath d={d} fill={waveTints.A} opacity={Animated.multiply(tintAOpacity, tintStrength) as any} />
          <AnimatedPath d={d} fill={waveTints.B} opacity={Animated.multiply(tintBOpacity, tintStrength) as any} />
          <AnimatedPath d={d} fill={accent.buttonPrimary} opacity={Animated.multiply(accentMistOpacity, tintStrength) as any} />
        </>
      )}
    </Svg>
  );

  return (
    <View
      style={[styles.container, { height }]}
      pointerEvents="none"
      renderToHardwareTextureAndroid={Platform.OS === 'android'}
    >
      <Animated.View style={[styles.waveContainer, { transform: [{ translateX: translateX1 }] }]}>
        {renderWave(paths.p1, backgrounds.wave1, base1, 1.0)}
      </Animated.View>

      <Animated.View style={[styles.waveContainer, { transform: [{ translateX: translateX2 }] }]}>
        {renderWave(paths.p2, backgrounds.wave2, base2, 0.75)}
      </Animated.View>

      <Animated.View style={[styles.waveContainer, { transform: [{ translateX: translateX3 }] }]}>
        {renderWave(paths.p3, backgrounds.wave1, base3, 0.55)}
      </Animated.View>
    </View>
  );
};

export const MountainWaveBackground = React.memo(MountainWaveBackgroundInner);

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: -40,
    right: -40,
    overflow: 'visible',
    zIndex: 0,
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
