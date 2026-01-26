import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions, Animated } from 'react-native';
import Svg, { Path, Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { colors } from '../../theme';

const { width } = Dimensions.get('window');

interface MountainWaveBackgroundProps {
  height?: number;
  showSun?: boolean;
}

export const MountainWaveBackground: React.FC<MountainWaveBackgroundProps> = ({ 
  height = 300,
  showSun = true 
}) => {
  const waveAnim1 = useRef(new Animated.Value(0)).current;
  const waveAnim2 = useRef(new Animated.Value(0)).current;
  const sunAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Slow, dreamlike horizontal translation for mountain waves
    const createWaveAnimation = (animValue: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.timing(animValue, {
            toValue: 1,
            duration: 12000 + delay * 3000, // Very slow, organic motion
            useNativeDriver: true,
          }),
          Animated.timing(animValue, {
            toValue: 0,
            duration: 12000 + delay * 3000,
            useNativeDriver: true,
          }),
        ])
      );
    };

    // Sun animation - moves along the wave path
    const sunAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(sunAnim, {
          toValue: 1,
          duration: 20000, // Slow sun movement
          useNativeDriver: true,
        }),
        Animated.timing(sunAnim, {
          toValue: 0,
          duration: 20000,
          useNativeDriver: true,
        }),
      ])
    );

    const anim1 = createWaveAnimation(waveAnim1, 0);
    const anim2 = createWaveAnimation(waveAnim2, 1);
    const anim3 = createWaveAnimation(waveAnim3, 2);

    anim1.start();
    anim2.start();
    anim3.start();
    sunAnimation.start();

    return () => {
      anim1.stop();
      anim2.stop();
      anim3.stop();
      sunAnimation.stop();
    };
  }, []);

  const translateX1 = waveAnim1.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 40], // Subtle horizontal drift
  });

  const translateX2 = waveAnim2.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -30], // Opposite direction for depth
  });

  const waveAnim3 = useRef(new Animated.Value(0)).current;
  
  const translateX3 = waveAnim3.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 25], // Another direction for more depth
  });

  // Sun position along the wave path
  const sunX = sunAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [width * 0.2, width * 0.8], // Moves across the screen
  });

  const sunY = sunAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [height * 0.45, height * 0.25, height * 0.45], // Goes higher to overlap with modal
  });

  // Sun opacity: keep full opacity, no fading
  const sunOpacity = 1;

  // Smooth mountain wave paths using quadratic curves (no sharp angles)
  const mountainPath1 = `M0,${height * 0.6} Q${width * 0.1},${height * 0.5} ${width * 0.2},${height * 0.45} T${width * 0.4},${height * 0.4} T${width * 0.6},${height * 0.42} T${width * 0.8},${height * 0.38} T${width},${height * 0.4} L${width},${height} L0,${height} Z`;
  
  const mountainPath2 = `M0,${height * 0.7} Q${width * 0.12},${height * 0.62} ${width * 0.25},${height * 0.58} T${width * 0.5},${height * 0.52} T${width * 0.75},${height * 0.55} T${width},${height * 0.58} L${width},${height} L0,${height} Z`;
  
  const mountainPath3 = `M0,${height * 0.8} Q${width * 0.15},${height * 0.72} ${width * 0.3},${height * 0.7} T${width * 0.5},${height * 0.65} T${width * 0.7},${height * 0.68} T${width},${height * 0.7} L${width},${height} L0,${height} Z`;

  return (
    <View style={[styles.container, { height }]}>
      <Animated.View
        style={[
          styles.waveContainer,
          { transform: [{ translateX: translateX1 }] },
        ]}
      >
        <Svg
          width={width + 80}
          height={height}
          viewBox={`0 0 ${width + 80} ${height}`}
          style={styles.wave}
        >
          <Path
            d={mountainPath1.replace(width.toString(), (width + 80).toString())}
            fill={colors.wave1}
            opacity={0.4}
          />
        </Svg>
      </Animated.View>
      <Animated.View
        style={[
          styles.waveContainer,
          { transform: [{ translateX: translateX2 }] },
        ]}
      >
        <Svg
          width={width + 80}
          height={height}
          viewBox={`0 0 ${width + 80} ${height}`}
          style={styles.wave}
        >
          <Path
            d={mountainPath2.replace(width.toString(), (width + 80).toString())}
            fill={colors.wave2}
            opacity={0.3}
          />
        </Svg>
      </Animated.View>
      <Animated.View
        style={[
          styles.waveContainer,
          { transform: [{ translateX: translateX3 }] },
        ]}
      >
        <Svg
          width={width + 80}
          height={height}
          viewBox={`0 0 ${width + 80} ${height}`}
          style={styles.wave}
        >
          <Path
            d={mountainPath3.replace(width.toString(), (width + 80).toString())}
            fill={colors.wave1}
            opacity={0.25}
          />
        </Svg>
      </Animated.View>
      {showSun && (
        <Animated.View
          style={[
            styles.sunContainer,
            {
              transform: [
                { translateX: sunX },
                { translateY: sunY },
              ],
              opacity: sunOpacity,
            },
          ]}
        >
          <Svg width={80} height={80} viewBox="0 0 80 80">
            <Defs>
              <RadialGradient id="sunGradient" cx="50%" cy="50%">
                <Stop offset="0%" stopColor="#E8D5B7" stopOpacity="0.9" />
                <Stop offset="50%" stopColor="#C3B8E0" stopOpacity="0.6" />
                <Stop offset="100%" stopColor="#C3B8E0" stopOpacity="0.2" />
              </RadialGradient>
            </Defs>
            <Circle
              cx="40"
              cy="40"
              r="35"
              fill="url(#sunGradient)"
            />
            <Circle
              cx="40"
              cy="40"
              r="30"
              fill="none"
              stroke="#E8D5B7"
              strokeWidth="1"
              opacity="0.5"
            />
          </Svg>
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: -40,
    right: -40,
    overflow: 'visible', // Allow sun to overflow above
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
  sunContainer: {
    position: 'absolute',
    width: 80,
    height: 80,
    marginLeft: -40,
    marginTop: -40,
    zIndex: 9999, // Always above modal
    elevation: 100, // For Android
    pointerEvents: 'none', // Allow touches to pass through
  },
});

