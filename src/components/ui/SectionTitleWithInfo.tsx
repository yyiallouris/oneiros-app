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
      <TouchableOpacity
        style={styles.rowButton}
        onPress={() => setModalVisible(true)}
        hitSlop={{ top: 8, bottom: 8, left: 4, right: 12 }}
        activeOpacity={0.72}
        accessibilityRole="button"
        accessibilityLabel={`Open note about ${title}`}
      >
        <Text style={variant === 'chips' ? styles.chipsTitle : styles.archetypeTitle}>
          {title}
        </Text>
        <View style={variant === 'chips' ? styles.noteMark : styles.noteMarkSmall}>
          <Text style={styles.noteMarkText}>›</Text>
        </View>
      </TouchableOpacity>
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
  rowButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginBottom: spacing.sm,
    paddingVertical: 2,
    paddingRight: spacing.xs,
  },
  chipsTitle: {
    fontSize: typography.sizes.md,
    fontFamily: typography.bold,
    color: colors.textTitle,
  },
  archetypeTitle: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.medium,
    color: colors.textAccent,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  noteMark: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    marginLeft: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cardGlassSoft,
    borderWidth: 1,
    borderColor: colors.contourLineSoft,
  },
  noteMarkSmall: {
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    marginLeft: spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.buttonPrimaryLight12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.contourLineSoft,
  },
  noteMarkText: {
    fontFamily: typography.medium,
    fontSize: 14,
    lineHeight: 16,
    color: colors.textAccent,
  },
});
