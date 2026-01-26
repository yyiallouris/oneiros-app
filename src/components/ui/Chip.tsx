import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, borderRadius, typography } from '../../theme';

interface ChipProps {
  label: string;
  variant?: 'default' | 'accent';
}

export const Chip: React.FC<ChipProps> = ({ label, variant = 'default' }) => {
  return (
    <View
      style={[
        styles.chip,
        variant === 'accent' && styles.accentChip,
      ]}
    >
      <Text
        style={[
          styles.chipText,
          variant === 'accent' && styles.accentChipText,
        ]}
      >
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  accentChip: {
    backgroundColor: colors.accentLight,
    borderColor: colors.accent,
  },
  chipText: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    fontWeight: typography.weights.medium,
  },
  accentChipText: {
    color: colors.white,
  },
});

