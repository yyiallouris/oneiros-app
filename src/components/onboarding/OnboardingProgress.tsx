import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing, text, typography } from '../../theme';

type Props = {
  step: number;
  total?: number;
};

/** Quiet step chrome for onboarding — orientation without turning setup into a wizard UI. */
export const OnboardingProgress: React.FC<Props> = ({ step, total = 5 }) => {
  const safeStep = Math.min(Math.max(step, 1), total);

  return (
    <View style={styles.wrap} accessibilityRole="text" accessibilityLabel={`Step ${safeStep} of ${total}`}>
      <View style={styles.dots}>
        {Array.from({ length: total }, (_, index) => {
          const active = index + 1 === safeStep;
          const complete = index + 1 < safeStep;
          return (
            <View
              key={`onboarding-step-${index + 1}`}
              style={[styles.dot, active && styles.dotActive, complete && styles.dotComplete]}
            />
          );
        })}
      </View>
      <Text style={styles.label}>
        {safeStep} of {total}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    marginBottom: spacing.lg,
    gap: spacing.xs,
  },
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 999,
    backgroundColor: colors.buttonPrimaryDisabledBorder,
  },
  dotActive: {
    width: 18,
    backgroundColor: colors.buttonPrimary,
  },
  dotComplete: {
    backgroundColor: colors.buttonPrimary40,
  },
  label: {
    fontSize: typography.sizes.xs,
    color: text.muted,
    letterSpacing: 0.4,
    fontFamily: typography.medium,
  },
});
