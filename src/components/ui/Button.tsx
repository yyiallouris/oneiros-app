import React, { useRef, useEffect } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  StyleProp,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, borderRadius, typography } from '../../theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  style,
  textStyle,
}) => {
  const glowAnim = useRef(new Animated.Value(0)).current;
  const isDisabled = disabled || loading;

  useEffect(() => {
    if (variant === 'primary' && !isDisabled) {
      // Subtle breathing glow effect
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: false,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: false,
          }),
        ])
      ).start();
    }
  }, [variant, isDisabled]);

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.2, 0.4],
  });

  return (
    <TouchableOpacity
      style={[
        styles.button,
        variant === 'primary' && styles.primaryButton,
        variant === 'secondary' && styles.secondaryButton,
        variant === 'ghost' && styles.ghostButton,
        isDisabled && variant === 'primary' && styles.disabledPrimaryButton,
        isDisabled && variant === 'secondary' && styles.disabledSecondaryButton,
        isDisabled && variant === 'ghost' && styles.disabledGhostButton,
        style,
      ]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
    >
      {variant === 'primary' && (
        <LinearGradient
          colors={
            isDisabled
              ? [colors.buttonPrimaryDisabled, colors.buttonPrimaryDisabled]
              : [colors.buttonGradientTop, colors.buttonGradientBottom]
          }
          start={{ x: 0.2, y: 0 }}
          end={{ x: 0.8, y: 1 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
      )}
      {variant === 'primary' && <Animated.View pointerEvents="none" style={[styles.primaryContour, !isDisabled && styles.primaryContourActive]} />}
      {variant === 'primary' && !isDisabled && (
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            styles.glow,
            {
              shadowColor: colors.buttonGlow,
              shadowOpacity: glowOpacity,
              shadowRadius: 16,
              shadowOffset: { width: 0, height: 6 },
              elevation: 8,
            },
          ]}
          pointerEvents="none"
        />
      )}
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' ? colors.white : colors.buttonPrimary}
        />
      ) : (
        <Text
          style={[
            styles.buttonText,
            variant === 'primary' && styles.primaryButtonText,
            variant === 'secondary' && styles.secondaryButtonText,
            variant === 'ghost' && styles.ghostButtonText,
            isDisabled && variant === 'primary' && styles.disabledPrimaryButtonText,
            isDisabled && variant === 'secondary' && styles.disabledSecondaryButtonText,
            isDisabled && variant === 'ghost' && styles.disabledGhostButtonText,
            textStyle,
          ]}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    overflow: 'hidden',
  },
  primaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.buttonEdge,
  },
  secondaryButton: {
    backgroundColor: colors.cardGlassStrong,
    borderWidth: 1,
    borderColor: colors.contourLine,
  },
  ghostButton: {
    backgroundColor: colors.cardGlassSoft,
    borderWidth: 1,
    borderColor: colors.contourLineFaint,
  },
  disabledPrimaryButton: {
    backgroundColor: colors.buttonPrimaryDisabled,
    borderColor: colors.buttonPrimaryDisabledBorder,
  },
  disabledSecondaryButton: {
    backgroundColor: colors.buttonPrimaryDisabledLight,
    borderColor: colors.buttonPrimaryDisabledBorder,
  },
  disabledGhostButton: {
    backgroundColor: 'transparent',
  },
  glow: {
    borderRadius: borderRadius.md,
    backgroundColor: colors.buttonPrimary,
  },
  primaryContour: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.buttonEdge,
    opacity: 0.7,
  },
  primaryContourActive: {
    opacity: 1,
  },
  buttonText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
    fontFamily: typography.regular,
    letterSpacing: 0.2,
  },
  primaryButtonText: {
    color: colors.white,
  },
  secondaryButtonText: {
    color: colors.textAccent,
  },
  ghostButtonText: {
    color: colors.textAccent,
  },
  disabledPrimaryButtonText: {
    color: colors.white,
    opacity: 0.9,
  },
  disabledSecondaryButtonText: {
    color: colors.buttonPrimaryDisabled,
  },
  disabledGhostButtonText: {
    color: colors.buttonPrimaryDisabled,
    opacity: 0.75,
  },
});

