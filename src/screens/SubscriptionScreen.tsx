import React, { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { PaperBackground, Card, Button, DesignExportForeground } from '../components/ui';
import { SubscriptionBillingSwitch } from '../components/subscription/SubscriptionBillingSwitch';
import { SubscriptionPlanCarousel } from '../components/subscription/SubscriptionPlanCarousel';
import { SubscriptionPlanCard } from '../components/subscription/SubscriptionPlanCard';
import { useSubscription } from '../providers/SubscriptionProvider';
import type { BillingInterval } from '../types/subscription';
import {
  FREE_PLAN_FEATURES,
  PREMIUM_PLAN_FEATURES,
  getFallbackPlan,
  getFreePlanCardModel,
  getIapUnavailableMessage,
  getReadOnlyLapseMessage,
  getTargetPlanForInterval,
} from '../services/subscriptionService';
import { colors, spacing, text, typography } from '../theme';

const FREE_IMAGE = require('../assets/subscription/free.png');
const PREMIUM_IMAGE = require('../assets/subscription/premium.png');

const SubscriptionScreen: React.FC = () => {
  const {
    status: subscriptionStatus,
    products,
    purchasingPlanCode,
    purchasePlan,
    restorePurchases,
    openManageSubscriptions,
    iapRuntimeAvailable,
    iapUnavailableReason,
  } = useSubscription();
  const [billingInterval, setBillingInterval] = useState<BillingInterval>('monthly');
  const [activeCardIndex, setActiveCardIndex] = useState(1);

  const premiumPlan = useMemo(
    () =>
      products.find((product) => product.planCode === getTargetPlanForInterval(billingInterval)) ??
      getFallbackPlan(getTargetPlanForInterval(billingInterval)),
    [billingInterval, products]
  );
  const freePlan = getFreePlanCardModel();
  const hasPaidAccess = subscriptionStatus?.hasPaidAccess ?? false;
  const showPricingSwitch = activeCardIndex !== 0;
  const showManageAction = hasPaidAccess && iapRuntimeAvailable;
  const showRestoreAction = !hasPaidAccess && iapRuntimeAvailable;
  const showIapHelper = !iapRuntimeAvailable;

  const handleUpgrade = useCallback(async () => {
    await purchasePlan(billingInterval, 'subscription');
  }, [billingInterval, purchasePlan]);

  const premiumNote = hasPaidAccess
    ? getReadOnlyLapseMessage()
    : 'No hidden pricing, no countdowns, and no fake urgency.';

  return (
    <View style={styles.container}>
      <PaperBackground />
      <DesignExportForeground fill>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title}>Subscription</Text>

          <Card style={styles.card}>
            <Text style={styles.sectionLabel}>Choose your mode</Text>
            <Text style={styles.compareCopy}>
              Free keeps the journal open. Premium unlocks reflections, follow-ups, insights, reports, and read-only-safe premium artifacts.
            </Text>

            {showPricingSwitch && (
              <View style={styles.switchWrap}>
                <SubscriptionBillingSwitch value={billingInterval} onChange={setBillingInterval} />
              </View>
            )}

            <SubscriptionPlanCarousel
              initialIndex={1}
              indicatorPosition="top"
              onIndexChange={setActiveCardIndex}
              testID="subscription-screen-carousel"
            >
              <SubscriptionPlanCard
                title={freePlan.title}
                eyebrow="Journal freely"
                price={freePlan.displayPrice}
                priceDetail="Unlimited entries, one reflection per week"
                features={FREE_PLAN_FEATURES}
                imageSource={FREE_IMAGE}
                actionTitle={!hasPaidAccess ? 'Current plan' : 'Free baseline'}
                onPress={() => undefined}
                current={!hasPaidAccess}
                disabled
                note="Free stays simple and clear: unlimited entries, one reflection per week, and five follow-up replies on that free reflection."
              />

              <SubscriptionPlanCard
                title={premiumPlan.title}
                eyebrow="Full mode"
                price={premiumPlan.displayPrice}
                priceDetail={premiumPlan.totalPriceLabel}
                secondaryPriceDetail={premiumPlan.monthlyEquivalentLabel ?? premiumPlan.savingsLabel}
                features={PREMIUM_PLAN_FEATURES}
                imageSource={PREMIUM_IMAGE}
                actionTitle={
                  hasPaidAccess
                    ? 'Current plan'
                    : purchasingPlanCode === premiumPlan.planCode
                      ? 'Opening store…'
                      : 'Go Premium'
                }
                onPress={() => {
                  if (hasPaidAccess) return;
                  void handleUpgrade();
                }}
                premium
                selected
                current={hasPaidAccess}
                note={premiumNote}
                disabled={hasPaidAccess || purchasingPlanCode !== null}
              />
            </SubscriptionPlanCarousel>
          </Card>

          <View style={styles.footerArea}>
            {showManageAction && (
              <Button
                title="Manage"
                onPress={() => {
                  void openManageSubscriptions();
                }}
                variant="ghost"
                style={styles.footerButton}
              />
            )}

            {showRestoreAction && (
              <Button
                title="Restore purchases"
                onPress={() => {
                  void restorePurchases();
                }}
                variant="secondary"
                style={styles.footerButton}
              />
            )}

            {showIapHelper && (
              <Text style={styles.helperText}>{getIapUnavailableMessage(iapUnavailableReason)}</Text>
            )}
          </View>
        </ScrollView>
      </DesignExportForeground>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
    gap: spacing.xl,
  },
  title: {
    fontSize: typography.sizes.xxl,
    fontFamily: typography.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  card: {
    gap: spacing.lg,
  },
  sectionLabel: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
  },
  compareCopy: {
    fontSize: typography.sizes.sm,
    color: text.secondary,
    lineHeight: typography.sizes.sm * 1.45,
  },
  switchWrap: {
    marginTop: spacing.xs,
  },
  footerArea: {
    gap: spacing.md,
    paddingBottom: spacing.lg,
  },
  footerButton: {
    alignSelf: 'stretch',
  },
  helperText: {
    fontSize: typography.sizes.sm,
    color: text.secondary,
    lineHeight: typography.sizes.sm * 1.45,
    textAlign: 'center',
    paddingHorizontal: spacing.sm,
  },
});

export default SubscriptionScreen;
