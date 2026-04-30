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
    <>
      <Text
        style={[
          styles.chipText,
          variant === 'accent' && styles.accentChipText,
          variant === 'label' && styles.labelChipText,
          onPress && styles.pressableChipText,
        ]}
      >
        {label}
      </Text>
      {onPress && <Text style={styles.chipMark}>›</Text>}
    </>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        style={[
          styles.chip,
          styles.pressableChip,
          variant === 'accent' && styles.accentChip,
          variant === 'label' && styles.labelChip,
        ]}
        accessibilityRole="button"
        accessibilityLabel={`Open note about ${label}`}
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    backgroundColor: colors.fieldSurface,
    borderWidth: 1,
    borderColor: colors.contourLineFaint,
  },
  pressableChip: {
    backgroundColor: colors.buttonPrimaryLight12,
    borderColor: colors.contourLineSoft,
    paddingRight: spacing.sm,
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
    fontFamily: typography.medium,
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
  },
  pressableChipText: {
    color: colors.textPrimary,
  },
  accentChipText: {
    color: colors.textAccent,
  },
  labelChipText: {
    fontFamily: typography.regular,
    color: colors.textSecondary,
  },
  chipMark: {
    fontFamily: typography.medium,
    fontSize: typography.sizes.md,
    lineHeight: typography.sizes.md,
    color: colors.textAccent,
    marginLeft: spacing.xs,
    opacity: 0.78,
  },
});
