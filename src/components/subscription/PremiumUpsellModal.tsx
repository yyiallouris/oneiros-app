import React, { useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SubscriptionBillingSwitch } from './SubscriptionBillingSwitch';
import { SubscriptionPlanCarousel } from './SubscriptionPlanCarousel';
import { SubscriptionPlanCard } from './SubscriptionPlanCard';
import { borderRadius, colors, spacing, text, typography } from '../../theme';
import type { BillingInterval, PremiumGateSource, StoreSubscriptionPlan } from '../../types/subscription';
import { FREE_PLAN_FEATURES, PREMIUM_PLAN_FEATURES, getFreePlanCardModel, getPremiumSourceCopy } from '../../services/subscriptionService';

const FREE_IMAGE = require('../../assets/subscription/free.png');
const PREMIUM_IMAGE = require('../../assets/subscription/premium.png');

type Props = {
  visible: boolean;
  source: PremiumGateSource;
  billingInterval: BillingInterval;
  premiumPlan: StoreSubscriptionPlan;
  displayMode?: 'compare' | 'premium_only';
  upgradeTitle?: string;
  upgradeDisabled?: boolean;
  onClose: () => void;
  onIntervalChange: (value: BillingInterval) => void;
  onUpgrade: () => void;
};

export const PremiumUpsellModal: React.FC<Props> = ({
  visible,
  source,
  billingInterval,
  premiumPlan,
  displayMode = 'compare',
  upgradeTitle,
  upgradeDisabled = false,
  onClose,
  onIntervalChange,
  onUpgrade,
}) => {
  const copy = getPremiumSourceCopy(source);
  const freePlan = getFreePlanCardModel();
  const isPremiumOnly = displayMode === 'premium_only';
  const [activeCardIndex, setActiveCardIndex] = useState(isPremiumOnly ? 0 : 1);
  const showPricingSwitch = isPremiumOnly || activeCardIndex !== 0;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <TouchableOpacity style={styles.backdropTouchable} onPress={onClose} activeOpacity={1} />
        <View style={styles.sheet}>
          <ScrollView contentContainerStyle={styles.sheetContent} showsVerticalScrollIndicator={false}>
            <View style={styles.headerRow}>
              <View style={styles.headerText}>
                <Text style={styles.title}>{copy.title}</Text>
                <Text style={styles.body}>{copy.body}</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeButton} activeOpacity={0.72}>
                <Text style={styles.closeText}>Close</Text>
              </TouchableOpacity>
            </View>

            {showPricingSwitch && (
              <SubscriptionBillingSwitch value={billingInterval} onChange={onIntervalChange} />
            )}

            <SubscriptionPlanCarousel
              initialIndex={isPremiumOnly ? 0 : 1}
              indicatorPosition="top"
              onIndexChange={setActiveCardIndex}
              testID="premium-upsell-carousel"
            >
              {!isPremiumOnly && (
                <SubscriptionPlanCard
                  title={freePlan.title}
                  eyebrow="Current free mode"
                  price={freePlan.displayPrice}
                  priceDetail={freePlan.totalPriceLabel}
                  features={FREE_PLAN_FEATURES}
                  imageSource={FREE_IMAGE}
                  actionTitle="Stay on Free"
                  onPress={onClose}
                  note="You can continue journaling freely and upgrade later from Subscription."
                />
              )}

              <SubscriptionPlanCard
                title={premiumPlan.title}
                eyebrow="Unlock full mode"
                price={premiumPlan.displayPrice}
                priceDetail={premiumPlan.totalPriceLabel}
                secondaryPriceDetail={premiumPlan.monthlyEquivalentLabel ?? premiumPlan.savingsLabel}
                features={PREMIUM_PLAN_FEATURES}
                imageSource={PREMIUM_IMAGE}
                actionTitle={upgradeTitle ?? 'Go Premium'}
                onPress={onUpgrade}
                selected
                premium
                disabled={upgradeDisabled}
                note={premiumPlan.savingsLabel ?? 'Premium outputs remain readable even if your paid access later lapses.'}
              />
            </SubscriptionPlanCarousel>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(45, 36, 48, 0.22)',
    justifyContent: 'flex-end',
  },
  backdropTouchable: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
    paddingTop: spacing.lg,
    maxHeight: '92%',
    borderWidth: 1,
    borderColor: colors.border,
  },
  sheetContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxxl,
    gap: spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: typography.sizes.xl,
    fontFamily: typography.bold,
    color: text.primary,
    marginBottom: spacing.xs,
  },
  body: {
    fontSize: typography.sizes.sm,
    lineHeight: typography.sizes.sm * 1.45,
    color: text.secondary,
  },
  closeButton: {
    paddingVertical: spacing.xs,
  },
  closeText: {
    color: colors.buttonPrimary,
    fontSize: typography.sizes.sm,
    fontFamily: typography.medium,
  },
});
