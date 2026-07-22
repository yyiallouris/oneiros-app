import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { borderRadius, colors, spacing, text, typography } from '../../theme';
import type { BillingInterval } from '../../types/subscription';

type Props = {
  value: BillingInterval;
  onChange: (value: BillingInterval) => void;
};

export const SubscriptionBillingSwitch: React.FC<Props> = ({ value, onChange }) => {
  return (
    <View style={styles.shell}>
      <TouchableOpacity
        style={[styles.option, value === 'monthly' && styles.optionActive]}
        onPress={() => onChange('monthly')}
        activeOpacity={0.8}
      >
        <Text style={[styles.optionLabel, value === 'monthly' && styles.optionLabelActive]}>
          Monthly
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.option, value === 'yearly' && styles.optionActive]}
        onPress={() => onChange('yearly')}
        activeOpacity={0.8}
      >
        <View style={styles.yearlyRow}>
          <Text style={[styles.optionLabel, value === 'yearly' && styles.optionLabelActive]}>
            Yearly
          </Text>
          <View style={styles.savingsBadge}>
            <Text style={styles.savingsText}>Save €12</Text>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  shell: {
    flexDirection: 'row',
    backgroundColor: colors.cardGlassSoft,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 4,
    gap: spacing.xs,
  },
  option: {
    flex: 1,
    minHeight: 48,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
  optionActive: {
    backgroundColor: colors.fieldSurface,
    borderWidth: 1,
    borderColor: colors.buttonPrimary40,
  },
  optionLabel: {
    fontSize: typography.sizes.sm,
    color: text.secondary,
    fontFamily: typography.medium,
  },
  optionLabelActive: {
    color: colors.buttonPrimary,
  },
  yearlyRow: {
    alignItems: 'center',
    gap: 4,
  },
  savingsBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(91, 70, 109, 0.12)',
  },
  savingsText: {
    fontSize: typography.sizes.xs,
    color: '#5B466D',
    fontFamily: typography.medium,
  },
});
