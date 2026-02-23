import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, borderRadius, typography } from '../../theme';

interface ChipProps {
  label: string;
  variant?: 'default' | 'accent' | 'label';
}

export const Chip: React.FC<ChipProps> = ({ label, variant = 'default' }) => {
  return (
    <View
      style={[
        styles.chip,
        variant === 'accent' && styles.accentChip,
        variant === 'label' && styles.labelChip,
      ]}
    >
      <Text
        style={[
          styles.chipText,
          variant === 'accent' && styles.accentChipText,
          variant === 'label' && styles.labelChipText,
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
    backgroundColor: colors.buttonPrimaryLight,
    borderColor: colors.buttonPrimary,
  },
  labelChip: {
    backgroundColor: 'rgba(237, 230, 223, 0.5)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(226, 216, 204, 0.6)',
  },
  chipText: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    fontWeight: typography.weights.medium,
  },
  accentChipText: {
    color: colors.white,
  },
  labelChipText: {
    color: colors.textSecondary,
    fontWeight: typography.weights.regular,
  },
});

