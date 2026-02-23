/**
 * Inner Light / Alchemical Spark — sun component (currently unused, commented out).
 * Was used inside MountainWaveBackground: fixed position, slow breathing (scale + opacity).
 * To re-enable: uncomment and use <InnerLightSun width={…} height={…} /> inside a background.
 */
/*
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { useSunCycleColor } from '../../theme';

const SUN_CORE = '#FFF5E0';

interface InnerLightSunProps {
  width: number;
  height: number;
}

export const InnerLightSun: React.FC<InnerLightSunProps> = ({ width, height }) => {
  const sunBreathAnim = useRef(new Animated.Value(0)).current;
  const sunColor = useSunCycleColor();

  useEffect(() => {
    const sunBreath = Animated.loop(
      Animated.sequence([
        Animated.timing(sunBreathAnim, {
          toValue: 1,
          duration: 7000,
          useNativeDriver: true,
        }),
        Animated.timing(sunBreathAnim, {
          toValue: 0,
          duration: 7000,
          useNativeDriver: true,
        }),
      ])
    );
    sunBreath.start();
    return () => sunBreath.stop();
  }, []);

  const sunScale = sunBreathAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.98, 1.03],
  });

  const sunGlowOpacity = sunBreathAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.55, 0.8],
  });

  const sunLeft = width * 0.72;
  const sunTop = height * 0.28;

  return (
    <Animated.View
      style={[
        styles.sunContainer,
        {
          left: sunLeft,
          top: sunTop,
          transform: [{ scale: sunScale }],
          opacity: sunGlowOpacity,
        },
      ]}
    >
      <Svg width={110} height={110} viewBox="0 0 110 110">
        <Defs>
          <RadialGradient id="sunGradient" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={SUN_CORE} stopOpacity="0.95" />
            <Stop offset="35%" stopColor={sunColor} stopOpacity="0.45" />
            <Stop offset="70%" stopColor={sunColor} stopOpacity="0.18" />
            <Stop offset="100%" stopColor={sunColor} stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Circle cx="55" cy="55" r="52" fill="url(#sunGradient)" />
        <Circle cx="55" cy="55" r="12" fill={SUN_CORE} opacity={0.35} />
      </Svg>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  sunContainer: {
    position: 'absolute',
    width: 110,
    height: 110,
    marginLeft: -55,
    marginTop: -55,
    zIndex: 1,
    elevation: 1,
    pointerEvents: 'none',
  },
});
*/

export {};
