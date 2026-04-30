import React from 'react';
import { StyleSheet, Text, View, ViewStyle, StyleProp } from 'react-native';
import { AI_REFLECTION_NOTICE } from '../constants/legal';
import { colors, spacing, typography, borderRadius } from '../theme';

interface LegalNoticeProps {
  text?: string;
  style?: StyleProp<ViewStyle>;
  compact?: boolean;
}

export const LegalNotice: React.FC<LegalNoticeProps> = ({
  text = AI_REFLECTION_NOTICE,
  style,
  compact = false,
}) => {
  return (
    <View style={[styles.notice, compact && styles.compactNotice, style]}>
      <Text style={[styles.noticeText, compact && styles.compactText]}>{text}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  notice: {
    backgroundColor: colors.buttonPrimaryLight12,
    borderWidth: 1,
    borderColor: colors.contourLineSoft,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
  },
  compactNotice: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  noticeText: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    lineHeight: typography.sizes.sm * typography.lineHeights.relaxed,
  },
  compactText: {
    fontSize: typography.sizes.xs,
    lineHeight: typography.sizes.xs * typography.lineHeights.relaxed,
  },
});
