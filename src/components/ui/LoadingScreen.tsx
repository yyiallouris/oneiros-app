import React, { useEffect, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing, Image, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, typography, spacing } from '../../theme';

interface LoadingScreenProps {
  onComplete?: () => void;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ onComplete }) => {
  const insets = useSafeAreaInsets();
  const { height: screenH, width: screenW } = useWindowDimensions();
  const progressAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Responsive image sizing (clamped) so small screens don't push title/bar down.
  const imgH = useMemo(() => Math.min(560, Math.max(420, screenH * 0.58)), [screenH]);
  const imgW = useMemo(() => Math.min(320, Math.max(260, screenW * 0.88)), [screenW]);

  useEffect(() => {
    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    // Progress bar animation - fill from 0% to 100%
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 1500,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false, // width animation needs useNativeDriver: false
    }).start(() => {
      // Fade out animation
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        onComplete?.();
      });
    });
  }, [progressAnim, fadeAnim]);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
        },
      ]}
    >
      <View style={styles.topSpacer} />
      <View style={styles.content}>
        <Image 
          source={require('../../../assets/loading_image.png')} 
          style={[styles.logo, { width: imgW, height: imgH }]}
          resizeMode="contain"
        />
        <Text style={styles.title}>Oneiros</Text>
        
        {/* Progress bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressTrack}>
            <Animated.View
              style={[
                styles.progressFill,
                {
                  width: progressWidth,
                },
              ]}
            />
          </View>
        </View>
      </View>
      <View style={styles.bottomSpacer} />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4EFE8', // Warm paper tone
    alignItems: 'center',
  },
  topSpacer: {
    flex: 1,
  },
  bottomSpacer: {
    flex: 0.6,
  },
  content: {
    alignItems: 'center',
    transform: [{ translateY: -70 }], // Move entire group (image+title+bar) up
  },
  logo: {
    marginBottom: 8, // Small gap - image and title should feel unified
  },
  title: {
    fontSize: 28,
    fontWeight: '300', // Light weight
    letterSpacing: 0.8,
    color: 'rgba(40, 35, 30, 0.8)', // Warm gray
    marginTop: 4, // Very small gap from image - unified group
    marginBottom: 12, // Breathing room to bar
  },
  progressContainer: {
    marginTop: 0, // Gap handled by title marginBottom
  },
  progressTrack: {
    width: 220,
    height: 3,
    borderRadius: 999, // Pill shape
    backgroundColor: 'rgba(30, 95, 90, 0.15)', // Muted turquoise track
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: 'rgba(30, 95, 90, 0.45)', // Dusty turquoise fill
  },
});

