import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { colors, spacing, typography } from '../../theme';

type Props = {
  onPress: () => void;
  compact?: boolean;
};

export const AiContentReportButton: React.FC<Props> = ({ onPress, compact = false }) => (
  <TouchableOpacity
    testID="ai-content-report-button"
    accessibilityRole="button"
    accessibilityLabel="Report this AI response"
    onPress={onPress}
    activeOpacity={0.68}
    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    style={[styles.button, compact && styles.buttonCompact]}
  >
    <Text style={styles.text}>Report this response</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  button: {
    alignSelf: 'flex-end',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.xs,
    marginTop: spacing.sm,
  },
  buttonCompact: {
    marginTop: spacing.xs,
  },
  text: {
    color: colors.textMuted,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
    textDecorationLine: 'underline',
  },
});
