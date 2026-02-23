import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet } from 'react-native';
import Svg, { Defs, RadialGradient, LinearGradient, Stop, Circle, Rect } from 'react-native-svg';
import { gradients } from '../../theme';

type Props = {
  width: number;
  height: number;
  x?: number;
  y?: number;
  r?: number;
  trigger?: number;
  enabled?: boolean;
  debug?: boolean;
};

export function SunDisc({
  width,
  height,
  x = 0.72,
  y = 0.62,
  r = 70,
  trigger,
  enabled = true,
  debug = false,
}: Props) {
  const idle = useRef(new Animated.Value(0)).current;
  const press = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!enabled) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(idle, {
          toValue: 1,
          duration: 24000,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(idle, {
          toValue: 0,
          duration: 24000,
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
        duration: 650,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(press, {
        toValue: 0,
        duration: 550,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [trigger, press]);

  if (!width || !height) return null;

  const scale = Animated.multiply(
    idle.interpolate({ inputRange: [0, 1], outputRange: [1.0, 1.015] }),
    press.interpolate({ inputRange: [0, 1], outputRange: [1.0, 1.06] })
  );

  const opacity = Animated.add(
    idle.interpolate({ inputRange: [0, 1], outputRange: [0.28, 0.36] }),
    press.interpolate({ inputRange: [0, 1], outputRange: [0, 0.18] })
  );

  const cx = width * x;
  const cy = height * y;

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.container,
        { width, height, opacity, transform: [{ scale }] },
        debug && styles.debug,
      ]}
    >
      <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <Defs>
          {/* stopOpacity=1: we use already-alpha gradient tokens */}
          <RadialGradient id="halo" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={gradients.mountainStart90} stopOpacity="1" />
            <Stop offset="35%" stopColor={gradients.paperLight} stopOpacity="1" />
            <Stop offset="70%" stopColor={gradients.mountainMid20} stopOpacity="1" />
            <Stop offset="100%" stopColor={gradients.mountainEnd20} stopOpacity="1" />
          </RadialGradient>
          {/* Fades glow toward top — no header tint */}
          <LinearGradient id="topFade" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={gradients.paper} stopOpacity="1" />
            <Stop offset="35%" stopColor={gradients.paper} stopOpacity="0.55" />
            <Stop offset="70%" stopColor={gradients.paper} stopOpacity="0" />
          </LinearGradient>
        </Defs>

        <Circle cx={cx} cy={cy} r={r * 5.4} fill="url(#halo)" />

        {debug ? <Circle cx={cx} cy={cy} r={10} fill="rgba(255,0,0,0.9)" /> : null}

        <Rect x={0} y={0} width={width} height={height} fill="url(#topFade)" />
      </Svg>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    top: 0,
    zIndex: 10,
    elevation: 10,
  },
  debug: {
    backgroundColor: 'rgba(255,0,0,0.03)',
  },
});
