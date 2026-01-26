import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors, spacing, borderRadius } from '../../theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  elevation?: boolean;
  transparent?: boolean; // New prop for semi-transparent cards
}

export const Card: React.FC<CardProps> = ({ children, style, elevation = true, transparent = false }) => {
  return (
    <View style={[
      styles.card, 
      transparent && styles.transparentCard,
      elevation && styles.elevation, 
      style
    ]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
  },
  transparentCard: {
    backgroundColor: 'rgba(237, 230, 223, 0.7)', // Semi-transparent cardBackground
  },
  elevation: {
    shadowColor: colors.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
});

