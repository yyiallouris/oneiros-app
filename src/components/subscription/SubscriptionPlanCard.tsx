import React from 'react';
import { Image, ImageSourcePropType, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Card } from '../ui';
import { borderRadius, colors, spacing, subscriptionButtons, text, typography } from '../../theme';
import type { SubscriptionFeatureRow } from '../../types/subscription';

type Props = {
  title: string;
  eyebrow?: string;
  price: string;
  priceDetail?: string | null;
  secondaryPriceDetail?: string | null;
  features: SubscriptionFeatureRow[];
  imageSource: ImageSourcePropType;
  actionTitle: string;
  onPress: () => void;
  selected?: boolean;
  current?: boolean;
  premium?: boolean;
  disabled?: boolean;
  note?: string | null;
};

export const SubscriptionPlanCard: React.FC<Props> = ({
  title,
  eyebrow,
  price,
  priceDetail,
  secondaryPriceDetail,
  features,
  imageSource,
  actionTitle,
  onPress,
  selected = false,
  current = false,
  premium = false,
  disabled = false,
  note,
}) => {
  return (
    <TouchableOpacity activeOpacity={0.86} onPress={onPress} disabled={disabled} style={styles.touchable}>
      <Card
        transparent
        style={[
          styles.card,
          selected && styles.cardSelected,
          premium && styles.cardPremium,
          disabled && styles.cardDisabled,
        ]}
      >
        <View style={[styles.heroWrap, premium && styles.heroWrapPremium]}>
          <Image source={imageSource} style={styles.heroImage} resizeMode="contain" />
          <View style={styles.badgeRow}>
            {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : <View />}
            {current && <Text style={styles.currentBadge}>Current</Text>}
          </View>
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>{title}</Text>
          <Text style={[styles.price, premium && styles.pricePremium]}>{price}</Text>
          {!!priceDetail && <Text style={styles.priceDetail}>{priceDetail}</Text>}
          {!!secondaryPriceDetail && <Text style={styles.secondaryDetail}>{secondaryPriceDetail}</Text>}

          <View style={styles.featureList}>
            {features.map((feature) => (
              <View key={feature.label} style={styles.featureRow}>
                <Text style={[styles.featureIcon, !feature.included && styles.featureIconMuted]}>
                  {feature.included ? '✓' : '•'}
                </Text>
                <Text
                  style={[
                    styles.featureText,
                    !feature.included && styles.featureTextMuted,
                    feature.emphasis && styles.featureTextEmphasis,
                  ]}
                >
                  {feature.label}
                </Text>
              </View>
            ))}
          </View>

          {!!note && <Text style={styles.note}>{note}</Text>}

          {premium ? (
            <Pressable
              onPress={onPress}
              disabled={disabled}
              style={({ pressed }) => [
                styles.buttonBase,
                styles.subscriptionButton,
                styles.premiumButton,
                pressed && styles.premiumButtonPressed,
              ]}
            >
              <Text style={[styles.buttonText, styles.premiumButtonText]}>{actionTitle}</Text>
            </Pressable>
          ) : (
            <Pressable
              onPress={onPress}
              disabled={disabled}
              style={({ pressed }) => [
                styles.buttonBase,
                styles.subscriptionButton,
                styles.freeButton,
                pressed && styles.freeButtonPressed,
              ]}
            >
              {({ pressed }) => (
                <Text style={[styles.buttonText, styles.freeButtonText, pressed && styles.freeButtonTextPressed]}>
                  {actionTitle}
                </Text>
              )}
            </Pressable>
          )}
        </View>
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  touchable: {
    width: '100%',
  },
  card: {
    padding: 0,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardSelected: {
    borderColor: colors.buttonPrimary40,
    shadowOpacity: 0.14,
  },
  cardPremium: {
    backgroundColor: 'rgba(248, 244, 251, 0.9)',
  },
  cardDisabled: {
    opacity: 0.96,
  },
  heroWrap: {
    backgroundColor: 'rgba(255, 253, 249, 0.92)',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  heroWrapPremium: {
    backgroundColor: 'rgba(91, 70, 109, 0.08)',
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  eyebrow: {
    fontSize: typography.sizes.xs,
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: text.muted,
    fontFamily: typography.medium,
  },
  currentBadge: {
    fontSize: typography.sizes.xs,
    color: colors.buttonPrimary,
    fontFamily: typography.medium,
    backgroundColor: 'rgba(101, 68, 111, 0.12)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  heroImage: {
    width: '100%',
    height: 154,
    alignSelf: 'center',
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
  },
  title: {
    fontSize: typography.sizes.xl,
    color: text.primary,
    fontFamily: typography.bold,
    marginBottom: spacing.xs,
  },
  price: {
    fontSize: typography.sizes.xl,
    color: text.primary,
    fontFamily: typography.medium,
  },
  pricePremium: {
    color: '#5B466D',
  },
  priceDetail: {
    fontSize: typography.sizes.sm,
    color: text.secondary,
    marginTop: 4,
  },
  secondaryDetail: {
    fontSize: typography.sizes.sm,
    color: '#5B466D',
    marginTop: 4,
    fontFamily: typography.medium,
  },
  featureList: {
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  featureIcon: {
    color: colors.buttonPrimary,
    fontSize: typography.sizes.md,
    marginTop: 1,
  },
  featureIconMuted: {
    color: text.muted,
  },
  featureText: {
    flex: 1,
    color: text.secondary,
    fontSize: typography.sizes.sm,
    lineHeight: typography.sizes.sm * 1.45,
  },
  featureTextMuted: {
    color: text.muted,
  },
  featureTextEmphasis: {
    color: text.primary,
    fontFamily: typography.medium,
  },
  note: {
    marginTop: spacing.md,
    fontSize: typography.sizes.xs,
    lineHeight: typography.sizes.xs * 1.5,
    color: text.muted,
  },
  buttonBase: {
    marginTop: spacing.lg,
    minHeight: 52,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: typography.sizes.lg,
    fontFamily: typography.semibold,
    fontWeight: typography.weights.semibold,
    letterSpacing: 0.1,
  },
  subscriptionButton: {
    borderWidth: 1,
  },
  premiumButton: {
    backgroundColor: subscriptionButtons.premiumBackground,
    borderColor: subscriptionButtons.premiumBorder,
    shadowColor: subscriptionButtons.premiumShadow,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    elevation: 4,
  },
  premiumButtonPressed: {
    backgroundColor: subscriptionButtons.premiumBackgroundPressed,
  },
  premiumButtonText: {
    color: subscriptionButtons.premiumText,
  },
  freeButton: {
    backgroundColor: subscriptionButtons.freeBackground,
    borderColor: subscriptionButtons.freeBorder,
    shadowColor: subscriptionButtons.freeShadow,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    elevation: 2,
  },
  freeButtonPressed: {
    backgroundColor: subscriptionButtons.freeBackgroundPressed,
  },
  freeButtonText: {
    color: subscriptionButtons.freeText,
  },
  freeButtonTextPressed: {
    color: subscriptionButtons.freeTextPressed,
  },
});
