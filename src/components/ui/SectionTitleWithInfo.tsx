import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, typography } from '../../theme';
import { SymbolInfoModal } from './SymbolInfoModal';
import type { InfoModalKey } from '../../constants/symbolArchetypeInfo';

interface SectionTitleWithInfoProps {
  title: string;
  infoKey: InfoModalKey;
  /** Use chipsSectionTitle style (DreamDetail) or archetypeCategoryLabel (Insights) */
  variant?: 'chips' | 'archetype';
  /** When false, show only the title (no ? icon). Use when depth is quick. */
  showInfo?: boolean;
}

export const SectionTitleWithInfo: React.FC<SectionTitleWithInfoProps> = ({
  title,
  infoKey,
  variant = 'chips',
  showInfo = true,
}) => {
  const [modalVisible, setModalVisible] = useState(false);

  if (!showInfo) {
    return (
      <View style={styles.row}>
        <Text style={variant === 'chips' ? styles.chipsTitle : styles.archetypeTitle}>
          {title}
        </Text>
      </View>
    );
  }

  return (
    <>
      <View style={styles.row}>
        <Text style={variant === 'chips' ? styles.chipsTitle : styles.archetypeTitle}>
          {title}
        </Text>
        <TouchableOpacity
          style={styles.infoButton}
          onPress={() => setModalVisible(true)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          activeOpacity={0.7}
        >
          <Text style={styles.infoIcon}>?</Text>
        </TouchableOpacity>
      </View>
      <SymbolInfoModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        contentKey={infoKey}
      />
    </>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  chipsTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.textSecondary,
  },
  archetypeTitle: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  infoButton: {
    width: 22,
    height: 22,
    borderRadius: 11,
    marginLeft: spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoIcon: {
    fontSize: 14,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
  },
});
