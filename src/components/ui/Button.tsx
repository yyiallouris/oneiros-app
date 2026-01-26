import React, { useRef, useEffect } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  Animated,
} from 'react-native';
import { colors, spacing, borderRadius, typography } from '../../theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
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

  useEffect(() => {
    if (variant === 'primary' && !disabled && !loading) {
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
  }, [variant, disabled, loading]);

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
        (disabled || loading) && styles.disabledButton,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {variant === 'primary' && !disabled && !loading && (
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            styles.glow,
            {
              shadowColor: colors.accentLight,
              shadowOpacity: glowOpacity,
              shadowRadius: 12,
              shadowOffset: { width: 0, height: 2 },
              elevation: 8,
            },
          ]}
          pointerEvents="none"
        />
      )}
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' ? colors.white : colors.accent}
        />
      ) : (
        <Text
          style={[
            styles.buttonText,
            variant === 'primary' && styles.primaryButtonText,
            variant === 'secondary' && styles.secondaryButtonText,
            variant === 'ghost' && styles.ghostButtonText,
            (disabled || loading) && styles.disabledButtonText,
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
    backgroundColor: colors.accent,
  },
  secondaryButton: {
    backgroundColor: colors.cardBackground,
    borderWidth: 1.5,
    borderColor: colors.accent,
  },
  ghostButton: {
    backgroundColor: 'transparent',
  },
  disabledButton: {
    opacity: 0.5,
  },
  glow: {
    borderRadius: borderRadius.md,
    backgroundColor: colors.accentLight,
  },
  buttonText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    fontFamily: typography.regular,
  },
  primaryButtonText: {
    color: colors.white,
  },
  secondaryButtonText: {
    color: colors.accent,
  },
  ghostButtonText: {
    color: colors.textSecondary,
  },
  disabledButtonText: {
    opacity: 0.7,
  },
});

