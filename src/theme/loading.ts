import { StyleSheet, ViewStyle } from 'react-native';
import { colors } from './colors';
import { spacing, borderRadius } from './spacing';
import { typography } from './typography';

/** Visual language for async work — breath = fetch/transition, reflect = AI/save work. */
export type LoadingVariant = 'breath' | 'reflect';

/** Layout placement — panel replaces a CTA row; screen fills a route; inline is a thin strip. */
export type LoadingContext = 'screen' | 'panel' | 'inline' | 'compact';

export interface LoadingPreset {
  variant: LoadingVariant;
  context: LoadingContext;
  message?: string;
  submessage?: string;
}

export const loadingPresets = {
  saveDream: {
    variant: 'reflect',
    context: 'panel',
    message: 'Saving your dream…',
    submessage: 'Keeping this moment in your journal.',
  },
  deleteDream: {
    variant: 'breath',
    context: 'panel',
    message: 'Removing this dream…',
  },
  recentReflection: {
    variant: 'breath',
    context: 'panel',
    message: 'Listening for what is moving now…',
  },
  dreamReflection: {
    variant: 'reflect',
    context: 'panel',
    message: 'Reflecting on your dream…',
    submessage: 'Tracing its images, feelings, and inner movement.',
  },
  analyzeDream: {
    variant: 'reflect',
    context: 'screen',
    message: 'Analyzing your dream…',
    submessage: 'Tracing its images, feelings, and inner movement.',
  },
  loadDream: {
    variant: 'breath',
    context: 'screen',
    message: 'Loading dream…',
  },
  loadSection: {
    variant: 'breath',
    context: 'screen',
  },
  loadJournal: {
    variant: 'breath',
    context: 'inline',
  },
  loadDayDreams: {
    variant: 'breath',
    context: 'inline',
  },
  authSubmit: {
    variant: 'breath',
    context: 'panel',
    message: 'One moment…',
  },
  sendSupport: {
    variant: 'breath',
    context: 'panel',
    message: 'Sending your message…',
  },
  consentSave: {
    variant: 'breath',
    context: 'panel',
    message: 'Saving your choices…',
  },
  setPassword: {
    variant: 'breath',
    context: 'panel',
    message: 'Updating your password…',
  },
  biometricUnlock: {
    variant: 'breath',
    context: 'panel',
    message: 'Unlocking…',
  },
  sendMessage: {
    variant: 'reflect',
    context: 'compact',
  },
} as const satisfies Record<string, LoadingPreset>;

export type LoadingPresetKey = keyof typeof loadingPresets;

export const loadingVisualSizes = {
  breath: {
    screen: 120,
    panel: 96,
    inline: 120,
    compact: 72,
  },
  reflect: {
    screen: 72,
    panel: 72,
    inline: 56,
    compact: 32,
  },
} as const;

export const loadingStyles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  screen: {
    flex: 1,
    width: '100%',
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  panel: {
    width: '100%',
    minHeight: 92,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    gap: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.fieldSurface,
    borderWidth: 1,
    borderColor: colors.contourLineFaint,
  },
  inline: {
    width: '100%',
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  compact: {
    width: 44,
    height: 44,
  },
  message: {
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  submessage: {
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: typography.sizes.sm * typography.lineHeights.normal,
    paddingHorizontal: spacing.sm,
  },
});

export function getLoadingContextStyle(context: LoadingContext): ViewStyle {
  return loadingStyles[context];
}
