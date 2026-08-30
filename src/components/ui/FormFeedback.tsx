import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { borderRadius, colors, semantic, spacing, typography } from '../../theme';

export type FormFeedbackTone = 'success' | 'error';

interface FormFeedbackProps {
  tone: FormFeedbackTone;
  title: string;
  message: string;
  testID?: string;
}

export const FormFeedback: React.FC<FormFeedbackProps> = ({
  tone,
  title,
  message,
  testID,
}) => {
  const isError = tone === 'error';

  return (
    <View
      testID={testID}
      accessible
      accessibilityLabel={`${title}. ${message}`}
      accessibilityLiveRegion={isError ? 'assertive' : 'polite'}
      style={[
        styles.container,
        isError ? styles.errorContainer : styles.successContainer,
      ]}
    >
      <Text style={[styles.title, isError ? styles.errorTitle : styles.successTitle]}>
        {title}
      </Text>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.md,
    borderLeftWidth: 3,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginTop: spacing.md,
  },
  successContainer: {
    backgroundColor: colors.cardGlassStrong,
    borderLeftColor: semantic.success,
  },
  errorContainer: {
    backgroundColor: semantic.errorBackground,
    borderLeftColor: semantic.errorDark,
  },
  title: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    marginBottom: spacing.xs,
  },
  successTitle: {
    color: colors.textPrimary,
  },
  errorTitle: {
    color: semantic.errorDark,
  },
  message: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
    lineHeight: typography.sizes.sm * typography.lineHeights.normal,
  },
});
