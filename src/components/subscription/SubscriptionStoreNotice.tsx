import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, spacing, typography } from '../../theme';

type Props = {
  loading?: boolean;
  onRetry: () => void;
};

export const SubscriptionStoreNotice: React.FC<Props> = ({
  loading = false,
  onRetry,
}) => (
  <View
    style={styles.notice}
    accessibilityLiveRegion="polite"
    testID="subscription-store-notice"
  >
    <Text style={styles.title}>
      {loading ? 'Checking store prices…' : 'Prices couldn’t be loaded.'}
    </Text>
    <Text style={styles.body}>
      Check your connection and try again. Your journal and existing reflections are unaffected.
    </Text>
    {!loading ? (
      <TouchableOpacity
        onPress={onRetry}
        style={styles.retry}
        accessibilityRole="button"
        accessibilityLabel="Try loading store prices again"
      >
        <Text style={styles.retryText}>Try again</Text>
      </TouchableOpacity>
    ) : null}
  </View>
);

const styles = StyleSheet.create({
  notice: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderLeftWidth: 2,
    borderLeftColor: colors.contourLineSoft,
    backgroundColor: colors.cardGlassSoft,
    gap: spacing.xs,
  },
  title: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.medium,
    color: colors.textPrimary,
  },
  body: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.regular,
    lineHeight: typography.sizes.sm * typography.lineHeights.normal,
    color: colors.textSecondary,
  },
  retry: {
    minHeight: 44,
    alignSelf: 'flex-start',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    marginTop: spacing.xs,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.contourLine,
    borderRadius: 22,
    backgroundColor: colors.fieldSurface,
  },
  retryText: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.medium,
    color: colors.buttonPrimary,
  },
});
