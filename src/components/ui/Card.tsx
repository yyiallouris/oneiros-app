import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { colors, spacing, borderRadius } from '../../theme';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  elevation?: boolean;
  transparent?: boolean; // New prop for semi-transparent cards
}

export const Card: React.FC<CardProps> = ({ children, style, elevation = true, transparent = false }) => {
  return (
    <View
      style={[
        styles.card,
        transparent && styles.transparentCard,
        elevation && styles.elevation,
        style,
      ]}
    >
      <View pointerEvents="none" style={styles.edgeGlow} />
      <View pointerEvents="none" style={styles.innerBorder} />
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.cardGlass,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  transparentCard: {
    backgroundColor: colors.cardGlassSoft,
  },
  elevation: {
    shadowColor: colors.shadow,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.1,
    shadowRadius: 14,
    elevation: 4,
  },
  edgeGlow: {
    position: 'absolute',
    left: 16,
    right: 16,
    top: 0,
    height: 18,
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
    backgroundColor: colors.white,
    opacity: 0.1,
  },
  innerBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
});

