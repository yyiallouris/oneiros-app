import React from 'react';
import { StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';
import { borderRadius, colors, spacing, typography } from '../../theme';

interface MysticHeaderProps {
  title: string;
  subtitle?: string;
  left?: React.ReactNode;
  right?: React.ReactNode;
  style?: ViewStyle;
  titleStyle?: TextStyle;
  subtitleStyle?: TextStyle;
}

export const MysticHeader: React.FC<MysticHeaderProps> = ({
  title,
  subtitle,
  left,
  right,
  style,
  titleStyle,
  subtitleStyle,
}) => {
  return (
    <View style={[styles.shell, style]}>
      <View style={styles.side}>{left}</View>
      <View style={styles.center}>
        <Text style={[styles.title, titleStyle]}>{title}</Text>
        {subtitle ? <Text style={[styles.subtitle, subtitleStyle]}>{subtitle}</Text> : null}
      </View>
      <View style={[styles.side, styles.sideRight]}>{right}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  shell: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.sm,
  },
  side: {
    width: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sideRight: {
    alignItems: 'flex-end',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
  },
  title: {
    fontFamily: typography.bold,
    fontSize: typography.sizes.xxl,
    color: colors.textTitle,
    letterSpacing: 0.2,
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 2,
    fontFamily: typography.regular,
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
});
