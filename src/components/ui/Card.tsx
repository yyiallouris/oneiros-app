import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { colors, spacing, borderRadius } from '../../theme';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  elevation?: boolean;
  transparent?: boolean;
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
    borderColor: colors.contourLineFaint,
    overflow: 'hidden',
  },
  transparentCard: {
    backgroundColor: colors.cardGlassSoft,
  },
  elevation: {
    shadowColor: colors.shadow,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.05,
    shadowRadius: 11,
    elevation: 2,
  },
});
