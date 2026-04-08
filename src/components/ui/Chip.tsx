import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, borderRadius, typography } from '../../theme';

interface ChipProps {
  label: string;
  variant?: 'default' | 'accent' | 'label';
  /** When provided, chip becomes pressable and opens the info modal on tap. */
  onPress?: () => void;
}

export const Chip: React.FC<ChipProps> = ({ label, variant = 'default', onPress }) => {
  const chipContent = (
    <Text
      style={[
        styles.chipText,
        variant === 'accent' && styles.accentChipText,
        variant === 'label' && styles.labelChipText,
      ]}
    >
      {label}
    </Text>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        style={[
          styles.chip,
          variant === 'accent' && styles.accentChip,
          variant === 'label' && styles.labelChip,
        ]}
      >
        {chipContent}
      </TouchableOpacity>
    );
  }

  return (
    <View
      style={[
        styles.chip,
        variant === 'accent' && styles.accentChip,
        variant === 'label' && styles.labelChip,
      ]}
    >
      {chipContent}
    </View>
  );
};

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    backgroundColor: colors.fieldSurface,
    borderWidth: 1,
    borderColor: colors.contourLineFaint,
  },
  accentChip: {
    backgroundColor: colors.buttonPrimaryLight,
    borderColor: colors.contourLineSoft,
  },
  labelChip: {
    backgroundColor: colors.cardGlassSoft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.contourLineFaint,
  },
  chipText: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    fontWeight: typography.weights.medium,
  },
  accentChipText: {
    color: colors.textAccent,
  },
  labelChipText: {
    color: colors.textSecondary,
    fontWeight: typography.weights.regular,
  },
});

