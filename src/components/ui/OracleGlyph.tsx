import React, { useEffect, useMemo, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { colors } from '../../theme';

interface OracleGlyphProps {
  size?: number;
  color?: string;
  style?: any;
}

export const OracleGlyph: React.FC<OracleGlyphProps> = ({
  size = 64, // ✅ bigger default
  color = 'rgba(30, 95, 90, 0.55)', // dusty turquoise
  style,
}) => {
  const breath = useRef(new Animated.Value(0.22)).current;
  const float = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const breathing = Animated.loop(
      Animated.sequence([
        Animated.timing(breath, {
          toValue: 0.55,
          duration: 1900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(breath, {
          toValue: 0.22,
          duration: 1900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    const floating = Animated.loop(
      Animated.sequence([
        Animated.timing(float, {
          toValue: 1,
          duration: 2400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(float, {
          toValue: 0,
          duration: 2400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    breathing.start();
    floating.start();

    return () => {
      breathing.stop();
      floating.stop();
    };
  }, []);

  const moonY = float.interpolate({
    inputRange: [0, 1],
    outputRange: [2, -2], // gentle bob
  });

  const driftX = float.interpolate({
    inputRange: [0, 1],
    outputRange: [0.6, -0.6], // tiny imperfection
  });

  const cupPath = useMemo(() => {
    const w = size;
    const h = size;

    // Cup sits in lower half
    const left = w * 0.22;
    const right = w * 0.78;
    const rimY = h * 0.55;
    const baseY = h * 0.78;

    const mid = w * 0.50;

    // A soft hand-carved cup shape (not perfectly symmetric)
    return `
      M ${left} ${rimY}
      Q ${mid * 0.95} ${rimY + h * 0.06} ${mid} ${rimY + h * 0.10}
      Q ${mid * 1.05} ${rimY + h * 0.06} ${right} ${rimY}
      Q ${right - w*0.02} ${h*0.70} ${mid} ${baseY}
      Q ${left + w*0.02} ${h*0.70} ${left} ${rimY}
    `;
  }, [size]);

  const w = size;
  const h = size;
  const moonCx = w * 0.50;
  const moonCy = h * 0.44;
  const moonR = w * 0.09;

  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      {/* Moon (floating) */}
      <Animated.View style={{ transform: [{ translateY: moonY }, { translateX: driftX }] }}>
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <Circle
            cx={moonCx}
            cy={moonCy}
            r={moonR}
            stroke={color}
            strokeWidth={1.6}
            fill="none"
            opacity={0.55}
          />
          {/* a tiny crescent cut to feel “moon” without being literal */}
          <Circle
            cx={moonCx + moonR * 0.45}
            cy={moonCy - moonR * 0.05}
            r={moonR * 0.85}
            stroke={'rgba(244, 239, 232, 0.9)'} // paper color "carve"
            strokeWidth={2.2}
            fill="none"
            opacity={0.9}
          />
        </Svg>
      </Animated.View>

      {/* Cup (breathing) */}
      <Animated.View style={{ opacity: breath }}>
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <Path
            d={cupPath}
            stroke={color}
            strokeWidth={1.6}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* second faint stroke offset = lino imperfection */}
          <Path
            d={cupPath}
            stroke={color}
            strokeWidth={1.0}
            fill="none"
            opacity={0.25}
            transform={`translate(0, 1)`}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
