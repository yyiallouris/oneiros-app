import React from 'react';
import { Linking, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LEGAL_LINKS } from '../../constants/legal';
import { spacing, subscriptionCards, typography } from '../../theme';
import type { PlanTier } from '../../billing/types';

type Props = {
  price: string;
  priceDetail?: string | null;
  trialLabel?: string | null;
  variant: Exclude<PlanTier, 'free'>;
};

export const SubscriptionPurchaseDisclosure: React.FC<Props> = ({
  price,
  priceDetail,
  trialLabel,
  variant,
}) => {
  const textColor = variant === 'premium'
    ? subscriptionCards.premiumTextSecondary
    : subscriptionCards.deeperTextSecondary;
  const storeName = Platform.OS === 'android' ? 'Google Play' : 'App Store';
  const renewalPrice = [price, priceDetail].filter(Boolean).join(' ');

  return (
    <View style={styles.wrap} testID={`subscription-purchase-disclosure-${variant}`}>
      <Text style={[styles.body, { color: textColor }]}>
        {`Subscription renews automatically at ${renewalPrice} unless canceled in ${storeName} before renewal. Payment is charged to your store account. `}
        {trialLabel
          ? `If the ${trialLabel.toLowerCase()} is available, this paid subscription starts when the trial ends unless you cancel. `
          : ''}
        Free remains available, so a subscription is not required.
      </Text>
      <View style={styles.links}>
        <TouchableOpacity onPress={() => void Linking.openURL(LEGAL_LINKS.privacyPolicyUrl)}>
          <Text style={[styles.link, { color: textColor }]}>Privacy Policy</Text>
        </TouchableOpacity>
        <Text style={[styles.separator, { color: textColor }]}>·</Text>
        <TouchableOpacity onPress={() => void Linking.openURL(LEGAL_LINKS.termsUrl)}>
          <Text style={[styles.link, { color: textColor }]}>Terms of Use</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255, 255, 255, 0.22)',
  },
  body: {
    fontSize: typography.sizes.xs,
    lineHeight: typography.sizes.xs * typography.lineHeights.relaxed,
  },
  links: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  link: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    textDecorationLine: 'underline',
  },
  separator: {
    fontSize: typography.sizes.xs,
  },
});
