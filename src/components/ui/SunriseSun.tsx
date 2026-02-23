import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, ViewStyle } from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Circle, ClipPath, Rect, G } from 'react-native-svg';
import { accent } from '../../theme';

const AnimatedG = Animated.createAnimatedComponent(G);

type Props = {
  width: number;
  height: number;

  /** 0..1 horizontal position */
  x?: number;

  /** Pixel Y of horizon (where waves start) */
  horizonY?: number;

  /** Sun disc radius */
  r?: number;

  /** Reflect trigger (Date.now()) */
  trigger?: number;

  enabled?: boolean;
  style?: ViewStyle;
};

export function SunriseSun({
  width,
  height,
  x = 0.73,
  horizonY = 560,
  r = 64,
  trigger,
  enabled = true,
  style,
}: Props) {
  const idle = useRef(new Animated.Value(0)).current;
  const press = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!enabled) return;

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(idle, {
          toValue: 1,
          duration: 22000,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(idle, {
          toValue: 0,
          duration: 22000,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [enabled, idle]);

  useEffect(() => {
    if (!trigger) return;
    press.setValue(0);

    Animated.sequence([
      Animated.timing(press, {
        toValue: 1,
        duration: 520,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(press, {
        toValue: 0,
        duration: 650,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [trigger, press]);

  if (!width || !height) return null;

  const cx = Math.round(width * x);
  const cy = Math.round(horizonY + r * 0.55);

  const scale = Animated.multiply(
    idle.interpolate({ inputRange: [0, 1], outputRange: [1.0, 1.015] }),
    press.interpolate({ inputRange: [0, 1], outputRange: [1.0, 0.96] })
  );

  const opacity = Animated.add(
    idle.interpolate({ inputRange: [0, 1], outputRange: [0.85, 0.95] }),
    press.interpolate({ inputRange: [0, 1], outputRange: [0, 0.1] })
  );

  const glowOpacity = Animated.add(
    idle.interpolate({ inputRange: [0, 1], outputRange: [0.18, 0.26] }),
    press.interpolate({ inputRange: [0, 1], outputRange: [0, 0.22] })
  );

  const discOpacity = Animated.add(
    idle.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] }),
    press.interpolate({ inputRange: [0, 1], outputRange: [0, 0.06] })
  );

  const clipHeight = Math.max(0, horizonY);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.container,
        style,
        { width, height, opacity, transform: [{ scale }] },
      ]}
    >
      <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <Defs>
          <ClipPath id="horizonClip">
            <Rect x={0} y={0} width={width} height={clipHeight} />
          </ClipPath>

          <RadialGradient id="sunCore" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="rgba(255, 245, 220, 1)" stopOpacity="1" />
            <Stop offset="45%" stopColor="rgba(255, 200, 130, 1)" stopOpacity="1" />
            <Stop offset="100%" stopColor={accent.orange} stopOpacity="1" />
          </RadialGradient>

          <RadialGradient id="sunRim" cx="50%" cy="50%" r="50%">
            <Stop offset="60%" stopColor="rgba(255, 240, 210, 0)" stopOpacity="0" />
            <Stop offset="82%" stopColor="rgba(255, 240, 210, 0.55)" stopOpacity="1" />
            <Stop offset="100%" stopColor="rgba(255, 240, 210, 0)" stopOpacity="0" />
          </RadialGradient>

          <RadialGradient id="sunGlow" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="rgba(255, 214, 160, 1)" stopOpacity="0.35" />
            <Stop offset="45%" stopColor="rgba(220, 150, 100, 1)" stopOpacity="0.16" />
            <Stop offset="100%" stopColor={accent.buttonPrimary} stopOpacity="0" />
          </RadialGradient>
        </Defs>

        <G clipPath="url(#horizonClip)">
          <AnimatedG opacity={glowOpacity}>
            <Circle cx={cx} cy={cy} r={r * 4.8} fill="url(#sunGlow)" />
          </AnimatedG>

          <AnimatedG opacity={discOpacity}>
            <Circle cx={cx} cy={cy} r={r} fill="url(#sunCore)" />
            <Circle cx={cx} cy={cy} r={r * 1.04} fill="url(#sunRim)" />
          </AnimatedG>
        </G>
      </Svg>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    top: 0,
    zIndex: 1,
    elevation: 1,
  },
});
