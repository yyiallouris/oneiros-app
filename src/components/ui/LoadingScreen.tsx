import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing, Image, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, typography } from '../../theme';
import { DesignExportForeground } from './DesignExportForeground';
import { PaperBackground } from './PaperBackground';

interface LoadingScreenProps {
  onComplete?: () => void;
}

const MAX_EMBLEM_SIZE = 330;
const IMAGE_SCALE = 0.6;

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ onComplete }) => {
  const insets = useSafeAreaInsets();
  const { height: screenH, width: screenW } = useWindowDimensions();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const emblemFloat = useRef(new Animated.Value(0)).current;

  const contentH = screenH - insets.top - insets.bottom;
  const imgSize = Math.min(MAX_EMBLEM_SIZE, Math.round(screenW * IMAGE_SCALE));
  const portalOffset = -Math.round(contentH * 0.03);

  useEffect(() => {
    const floatLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(emblemFloat, {
          toValue: 1,
          duration: 1800,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(emblemFloat, {
          toValue: 0,
          duration: 1800,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
      ])
    );

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    floatLoop.start();

    const timeout = setTimeout(() => {
      if (!onComplete) {
        return;
      }

      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        onComplete?.();
      });
    }, 1650);

    return () => {
      clearTimeout(timeout);
      floatLoop.stop();
    };
  }, [emblemFloat, fadeAnim, onComplete]);

  const emblemTranslateY = emblemFloat.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -8],
  });

  const emblemOpacity = emblemFloat.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.98, 1, 0.98],
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
      <PaperBackground />
      <DesignExportForeground style={[styles.centerBox, { transform: [{ translateY: portalOffset }] }]}>
        <Animated.View
          style={[
            styles.imageWrap,
            {
              width: imgSize,
              height: imgSize,
              opacity: emblemOpacity,
              transform: [{ translateY: emblemTranslateY }],
            },
          ]}
          testID="loading-logo-wrap"
        >
          <Image
            source={require('../../../assets/branding/splash-logo.png')}
            style={{ width: imgSize, height: imgSize }}
            resizeMode="contain"
            testID="loading-logo"
          />
        </Animated.View>
        <View style={styles.titleWrap}>
          <Text style={styles.titleMain}>Oneiros</Text>
        </View>
      </DesignExportForeground>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centerBox: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageWrap: {
    overflow: 'hidden',
  },
  titleWrap: {
    marginTop: 18,
    alignItems: 'center',
  },
  titleMain: {
    fontFamily: typography.display,
    fontSize: 42,
    color: colors.textPrimary,
    letterSpacing: 1.8,
    opacity: 0.9,
  },
});
