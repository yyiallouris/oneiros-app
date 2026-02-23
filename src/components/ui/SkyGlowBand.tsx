import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, ViewStyle } from 'react-native';
import Svg, { Defs, LinearGradient, RadialGradient, Stop, Rect, Ellipse } from 'react-native-svg';
import { gradients } from '../../theme';

type Props = {
  width: number;
  height: number;

  /** Where the horizon glow sits (0..1 of screen height) */
  horizonY?: number;

  /** Reflect trigger (Date.now()) */
  trigger?: number;

  /** Idle breathing on/off */
  enabled?: boolean;

  /** Optional style */
  style?: ViewStyle;
};

export function SkyGlowBand({
  width,
  height,
  horizonY = 0.74,
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
        duration: 620,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [trigger, press]);

  if (!width || !height) return null;

  const baseOpacity = idle.interpolate({
    inputRange: [0, 1],
    outputRange: [0.12, 0.18],
  });

  const pressBoost = press.interpolate({
    inputRange: [0, 1],
    outputRange: [0.0, 0.28],
  });

  const opacity = Animated.add(baseOpacity, pressBoost);

  const idleScaleY = idle.interpolate({
    inputRange: [0, 1],
    outputRange: [1.0, 1.04],
  });

  const pressScaleY = press.interpolate({
    inputRange: [0, 1],
    outputRange: [1.0, 0.74],
  });

  const scaleY = Animated.multiply(idleScaleY, pressScaleY);

  const translateY = Animated.add(
    idle.interpolate({ inputRange: [0, 1], outputRange: [-2, 2] }),
    press.interpolate({ inputRange: [0, 1], outputRange: [0, 10] })
  );

  const bandTop = Math.round(height * horizonY) - 140;
  const bandHeight = 340;

  const coreTop = bandTop + 70;
  const coreHeight = 200;

  // Sun locus: soft anchor so it reads as "source" not "atmosphere"
  const sunCx = width * 0.72;
  const sunCy = height * horizonY - 20;

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.container,
        style,
        {
          width,
          height,
          opacity,
          transform: [{ translateY }, { scaleY }],
        },
      ]}
    >
      <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <Defs>
          <LinearGradient id="skyBand" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={gradients.mountainEnd20} stopOpacity="1" />
            <Stop offset="35%" stopColor={gradients.mountainMid60} stopOpacity="1" />
            <Stop offset="60%" stopColor={gradients.paperLight} stopOpacity="1" />
            <Stop offset="100%" stopColor={gradients.mountainStart90} stopOpacity="1" />
          </LinearGradient>

          <LinearGradient id="skyCore" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={gradients.mountainMid60} stopOpacity="1" />
            <Stop offset="55%" stopColor={gradients.paperLight} stopOpacity="1" />
            <Stop offset="100%" stopColor={gradients.mountainStart90} stopOpacity="1" />
          </LinearGradient>

          {/* Sun locus: warm core → transparent, no rim, subtle presence */}
          <RadialGradient id="sunCore" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={gradients.mountainStart} stopOpacity="0.1" />
            <Stop offset="50%" stopColor={gradients.mountainStart90} stopOpacity="0.05" />
            <Stop offset="100%" stopColor={gradients.paperLight} stopOpacity="0" />
          </RadialGradient>
        </Defs>

        <Rect
          x={-40}
          y={bandTop}
          width={width + 80}
          height={bandHeight}
          rx={180}
          ry={180}
          fill="url(#skyBand)"
        />

        <Rect
          x={-20}
          y={coreTop}
          width={width + 40}
          height={coreHeight}
          rx={140}
          ry={140}
          fill="url(#skyCore)"
        />

        {/* Sun anchor: soft oval, locus of light — presence, not object */}
        <Ellipse
          cx={sunCx}
          cy={sunCy}
          rx={52}
          ry={78}
          fill="url(#sunCore)"
        />
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
