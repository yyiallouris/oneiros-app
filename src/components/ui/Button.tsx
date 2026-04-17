import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  StyleProp,
} from 'react-native';
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
  const isDisabled = disabled || loading;

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
      {loading ? (
        <ActivityIndicator
          color={variant === 'ghost' ? colors.buttonPrimary : colors.textPrimary}
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
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  primaryButton: {
    backgroundColor: colors.buttonPrimary90,
    borderWidth: 1,
    borderColor: colors.buttonEdge,
    shadowColor: colors.buttonGlow,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 5,
  },
  secondaryButton: {
    backgroundColor: colors.buttonPrimaryLight12,
    borderWidth: 1,
    borderColor: colors.buttonPrimary40,
  },
  ghostButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.contourLineSoft,
  },
  disabledPrimaryButton: {
    backgroundColor: colors.buttonPrimaryDisabledLight,
    borderColor: colors.buttonPrimaryDisabledBorder,
    shadowOpacity: 0,
    elevation: 0,
  },
  disabledSecondaryButton: {
    backgroundColor: colors.cardGlassSoft,
    borderColor: colors.buttonPrimaryDisabledBorder,
  },
  disabledGhostButton: {
    backgroundColor: 'transparent',
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
    color: colors.buttonPrimary,
  },
  ghostButtonText: {
    color: colors.buttonPrimary,
  },
  disabledPrimaryButtonText: {
    color: colors.buttonPrimaryDisabled,
  },
  disabledSecondaryButtonText: {
    color: colors.buttonPrimaryDisabled,
  },
  disabledGhostButtonText: {
    color: colors.buttonPrimaryDisabled,
    opacity: 0.75,
  },
});

