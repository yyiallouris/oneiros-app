import { StyleSheet, TextStyle, ViewStyle } from 'react-native';
import { colors } from './colors';
import { spacing, borderRadius } from './spacing';
import { typography } from './typography';

/** Shared primary action button — matches Write screen Save dream active/disabled treatment. */
export const primaryButton = {
  base: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderWidth: 1,
  },
  active: {
    backgroundColor: colors.buttonPrimary90,
    borderColor: colors.buttonEdge,
    shadowColor: colors.buttonGlow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 5,
  },
  disabled: {
    backgroundColor: colors.buttonPrimaryDisabledLight,
    borderColor: colors.buttonPrimaryDisabledBorder,
    shadowOpacity: 0,
    elevation: 0,
  },
} satisfies Record<'base' | 'active' | 'disabled', ViewStyle>;

export const primaryButtonText = {
  active: {
    color: colors.white,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
    fontFamily: typography.regular,
    letterSpacing: 0.2,
  },
  disabled: {
    color: colors.buttonPrimaryDisabled,
  },
} satisfies Record<'active' | 'disabled', TextStyle>;

export const secondaryButton = {
  base: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderWidth: 1,
    borderRadius: borderRadius.full,
  },
  active: {
    backgroundColor: colors.buttonPrimaryLight12,
    borderColor: colors.buttonPrimary40,
  },
  disabled: {
    backgroundColor: colors.cardGlassSoft,
    borderColor: colors.buttonPrimaryDisabledBorder,
  },
} satisfies Record<'base' | 'active' | 'disabled', ViewStyle>;

export const secondaryButtonText = {
  active: {
    color: colors.buttonPrimary,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
    fontFamily: typography.regular,
    letterSpacing: 0.2,
  },
  disabled: {
    color: colors.buttonPrimaryDisabled,
  },
} satisfies Record<'active' | 'disabled', TextStyle>;

export const ghostButton = {
  base: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.contourLineSoft,
    borderRadius: borderRadius.full,
  },
  disabled: {
    backgroundColor: 'transparent',
  },
} satisfies Record<'base' | 'disabled', ViewStyle>;

export const ghostButtonText = {
  active: {
    color: colors.buttonPrimary,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
    fontFamily: typography.regular,
    letterSpacing: 0.2,
  },
  disabled: {
    color: colors.buttonPrimaryDisabled,
    opacity: 0.75,
  },
} satisfies Record<'active' | 'disabled', TextStyle>;

/** Circular icon action (chat send, etc.). */
export const primaryIconButton = {
  base: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderWidth: 1,
  },
  active: {
    backgroundColor: colors.buttonPrimary90,
    borderColor: colors.buttonEdge,
    shadowColor: colors.buttonGlow,
    shadowOpacity: 0.16,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  inactive: {
    backgroundColor: colors.buttonPrimaryDisabledLight,
    borderColor: colors.buttonPrimaryDisabledBorder,
    shadowOpacity: 0,
    elevation: 0,
  },
} satisfies Record<'base' | 'active' | 'inactive', ViewStyle>;

export const buttonSizes = {
  default: {
    minHeight: 52,
    borderRadius: borderRadius.full,
  },
  compact: {
    minHeight: 46,
    borderRadius: 18,
  },
} as const;

export type ButtonSize = keyof typeof buttonSizes;

export const buttonStyles = StyleSheet.create({
  base: primaryButton.base,
  primaryActive: primaryButton.active,
  primaryDisabled: primaryButton.disabled,
  primaryTextActive: primaryButtonText.active,
  primaryTextDisabled: primaryButtonText.disabled,
  secondaryActive: secondaryButton.active,
  secondaryDisabled: secondaryButton.disabled,
  secondaryTextActive: secondaryButtonText.active,
  secondaryTextDisabled: secondaryButtonText.disabled,
  ghostBase: ghostButton.base,
  ghostDisabled: ghostButton.disabled,
  ghostTextActive: ghostButtonText.active,
  ghostTextDisabled: ghostButtonText.disabled,
  iconBase: primaryIconButton.base,
  iconActive: primaryIconButton.active,
  iconInactive: primaryIconButton.inactive,
});
