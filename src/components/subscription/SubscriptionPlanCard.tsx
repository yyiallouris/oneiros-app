import React from 'react';
import { Image, ImageSourcePropType, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Card } from '../ui';
import { borderRadius, colors, spacing, subscriptionButtons, subscriptionCards, text, typography } from '../../theme';
import type { SubscriptionFeatureRow } from '../../types/subscription';
import type { PlanTier } from '../../billing/types';

type Props = {
  title: string;
  eyebrow?: string;
  badgeText?: string;
  price: string;
  /** Prior monthly list price; shown with strikethrough above the discounted yearly price. */
  compareAtPrice?: string | null;
  priceDetail?: string | null;
  secondaryPriceDetail?: string | null;
  trialLabel?: string | null;
  features: SubscriptionFeatureRow[];
  imageSource: ImageSourcePropType;
  actionTitle: string;
  onPress: () => void;
  selected?: boolean;
  current?: boolean;
  variant?: PlanTier;
  disabled?: boolean;
  note?: string | null;
};

export const SubscriptionPlanCard: React.FC<Props> = ({
  title,
  eyebrow,
  badgeText,
  price,
  compareAtPrice,
  priceDetail,
  secondaryPriceDetail,
  trialLabel,
  features,
  imageSource,
  actionTitle,
  onPress,
  selected = false,
  current = false,
  variant = 'free',
  disabled = false,
  note,
}) => {
  const isPremium = variant === 'premium';
  const isDeeper = variant === 'deeper';
  const cardTextPrimary = isPremium
    ? styles.textPremiumPrimary
    : isDeeper
      ? styles.textDeeperPrimary
      : styles.textFreePrimary;
  const cardTextSecondary = isPremium
    ? styles.textPremiumSecondary
    : isDeeper
      ? styles.textDeeperSecondary
      : styles.textFreeSecondary;

  return (
    <TouchableOpacity activeOpacity={0.86} onPress={onPress} disabled={disabled} style={styles.touchable}>
      <Card
        transparent
        style={[
          styles.card,
          selected && styles.cardSelected,
          variant === 'premium' && styles.cardPremium,
          variant === 'deeper' && styles.cardDeeper,
          disabled && styles.cardDisabled,
        ]}
      >
        <View
          style={[
            styles.heroWrap,
            variant === 'premium' && styles.heroWrapPremium,
            variant === 'deeper' && styles.heroWrapDeeper,
          ]}
        >
          <Image source={imageSource} style={styles.heroImage} resizeMode="contain" />
          <View style={styles.badgeRow}>
            {badgeText ? (
              <Text style={[styles.badgeText, isPremium && styles.badgeTextPremium]}>
                {badgeText}
              </Text>
            ) : eyebrow ? (
              <Text style={[styles.eyebrow, cardTextSecondary]}>{eyebrow}</Text>
            ) : (
              <View />
            )}
            {current && <Text style={styles.currentBadge}>Current</Text>}
          </View>
        </View>

        <View style={styles.content}>
          {eyebrow && badgeText ? <Text style={[styles.eyebrow, cardTextSecondary]}>{eyebrow}</Text> : null}
          <Text style={[styles.title, cardTextPrimary]}>{title}</Text>
          {!!compareAtPrice && (
            <Text style={[styles.compareAtPrice, cardTextSecondary]}>{compareAtPrice}</Text>
          )}
          <Text
            style={[styles.price, cardTextPrimary]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.72}
          >
            {price}
          </Text>
          {!!priceDetail && <Text style={[styles.priceDetail, cardTextSecondary]}>{priceDetail}</Text>}
          {!!secondaryPriceDetail && <Text style={[styles.secondaryDetail, cardTextSecondary]}>{secondaryPriceDetail}</Text>}
          {!!trialLabel && <Text style={[styles.trialLabel, cardTextSecondary]}>{trialLabel}</Text>}

          <View style={styles.featureList}>
            {features.map((feature) => (
              <View key={feature.label} style={styles.featureRow}>
                <Text
                  style={[
                    styles.featureIcon,
                    isPremium && styles.featureIconPremium,
                    isDeeper && styles.featureIconDeeper,
                    !feature.included && styles.featureIconMuted,
                  ]}
                >
                  {feature.included ? '✓' : '•'}
                </Text>
                <Text
                  style={[
                    styles.featureText,
                    cardTextSecondary,
                    !feature.included && styles.featureTextMuted,
                    feature.emphasis && styles.featureTextEmphasis,
                    feature.emphasis && cardTextPrimary,
                  ]}
                >
                  {feature.label}
                </Text>
              </View>
            ))}
          </View>

          {!!note && <Text style={styles.note}>{note}</Text>}

          {isPremium ? (
            <Pressable
              onPress={onPress}
              disabled={disabled}
              style={({ pressed }) => [
                styles.buttonBase,
                styles.subscriptionButton,
                styles.premiumButton,
                disabled && styles.buttonDisabled,
                pressed && styles.premiumButtonPressed,
              ]}
            >
              <Text style={[styles.buttonText, styles.premiumButtonText]}>{actionTitle}</Text>
            </Pressable>
          ) : isDeeper ? (
            <Pressable
              onPress={onPress}
              disabled={disabled}
              style={({ pressed }) => [
                styles.buttonBase,
                styles.subscriptionButton,
                styles.deeperButton,
                disabled && styles.buttonDisabled,
                pressed && styles.deeperButtonPressed,
              ]}
            >
              <Text style={[styles.buttonText, styles.deeperButtonText]}>{actionTitle}</Text>
            </Pressable>
          ) : (
            <Pressable
              onPress={onPress}
              disabled={disabled}
              style={({ pressed }) => [
                styles.buttonBase,
                styles.subscriptionButton,
                styles.freeButton,
                disabled && styles.buttonDisabled,
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
    borderColor: subscriptionCards.freeBorder,
    borderRadius: 24,
    backgroundColor: subscriptionCards.freeBackground,
  },
  cardSelected: {
    borderColor: colors.buttonPrimary40,
    shadowOpacity: 0.14,
  },
  cardPremium: {
    backgroundColor: subscriptionCards.premiumBackgroundBottom,
    borderColor: subscriptionCards.premiumBorder,
    transform: [{ scale: 1.02 }],
    shadowColor: subscriptionButtons.premiumShadow,
    shadowOpacity: 1,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  cardDeeper: {
    backgroundColor: subscriptionCards.deeperBackground,
    borderColor: subscriptionCards.deeperBorder,
  },
  cardDisabled: {
    opacity: 0.96,
  },
  heroWrap: {
    backgroundColor: subscriptionCards.freeBackground,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  heroWrapPremium: {
    backgroundColor: subscriptionCards.premiumBackgroundTop,
  },
  heroWrapDeeper: {
    backgroundColor: subscriptionCards.deeperBackgroundUndertone,
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
  badgeText: {
    fontSize: typography.sizes.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: borderRadius.full,
    backgroundColor: subscriptionCards.premiumBadgeBackground,
    color: subscriptionCards.premiumBadgeText,
    fontFamily: typography.semibold,
  },
  badgeTextPremium: {
    letterSpacing: 0.2,
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
    height: 112,
    alignSelf: 'center',
    marginTop: spacing.sm,
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
  compareAtPrice: {
    fontSize: typography.sizes.md,
    fontFamily: typography.medium,
    textDecorationLine: 'line-through',
    opacity: 0.72,
    marginBottom: 2,
  },
  price: {
    fontSize: typography.sizes.xxl,
    fontFamily: typography.medium,
  },
  priceDetail: {
    fontSize: typography.sizes.sm,
    marginTop: 4,
  },
  secondaryDetail: {
    fontSize: typography.sizes.sm,
    marginTop: 4,
    fontFamily: typography.medium,
  },
  trialLabel: {
    fontSize: typography.sizes.sm,
    marginTop: spacing.sm,
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
    color: subscriptionCards.freeTextPrimary,
    fontSize: typography.sizes.md,
    marginTop: 1,
  },
  featureIconPremium: {
    color: subscriptionCards.premiumTextPrimary,
  },
  featureIconDeeper: {
    color: subscriptionCards.deeperTextPrimary,
  },
  featureIconMuted: {
    color: text.muted,
  },
  featureText: {
    flex: 1,
    fontSize: typography.sizes.sm,
    lineHeight: typography.sizes.sm * 1.45,
  },
  featureTextMuted: {
    opacity: 0.72,
  },
  featureTextEmphasis: {
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
  buttonDisabled: {
    opacity: 0.58,
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
  deeperButton: {
    backgroundColor: subscriptionButtons.deeperBackground,
    borderColor: subscriptionButtons.deeperBorder,
    shadowColor: subscriptionButtons.deeperShadow,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 1,
    elevation: 3,
  },
  deeperButtonPressed: {
    backgroundColor: subscriptionButtons.deeperBackgroundPressed,
  },
  deeperButtonText: {
    color: subscriptionButtons.deeperText,
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
  textFreePrimary: {
    color: subscriptionCards.freeTextPrimary,
  },
  textFreeSecondary: {
    color: subscriptionCards.freeTextSecondary,
  },
  textPremiumPrimary: {
    color: subscriptionCards.premiumTextPrimary,
  },
  textPremiumSecondary: {
    color: subscriptionCards.premiumTextSecondary,
  },
  textDeeperPrimary: {
    color: subscriptionCards.deeperTextPrimary,
  },
  textDeeperSecondary: {
    color: subscriptionCards.deeperTextSecondary,
  },
});
