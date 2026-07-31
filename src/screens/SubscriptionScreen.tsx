import React, { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { PaperBackground, Card, Button, DesignExportForeground } from '../components/ui';
import { SubscriptionBillingSwitch } from '../components/subscription/SubscriptionBillingSwitch';
import { SubscriptionPlanCarousel } from '../components/subscription/SubscriptionPlanCarousel';
import { SubscriptionPlanCard } from '../components/subscription/SubscriptionPlanCard';
import { useSubscription } from '../providers/SubscriptionProvider';
import type { BillingInterval } from '../types/subscription';
import {
  DEEPER_PLAN_FEATURES,
  FREE_PLAN_FEATURES,
  PREMIUM_PLAN_FEATURES,
  getFreePlanCardModel,
  getIapUnavailableMessage,
  getPaidPlanCardPricing,
  getPaidPlanOptionsForInterval,
  getReadOnlyLapseMessage,
  getYearlySavingsBadgeForVisibleCard,
} from '../services/subscriptionService';
import { colors, spacing, text, typography } from '../theme';

const FREE_IMAGE = require('../assets/icons/subscription/oneiros_glyph_free.png');
const PREMIUM_IMAGE = require('../assets/icons/subscription/oneiros_glyph_premium.png');
const DEEPER_IMAGE = require('../assets/icons/subscription/oneiros_glyph_deeper.png');

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

  const [premiumPlan, deeperPlan] = useMemo(
    () => getPaidPlanOptionsForInterval(products, billingInterval),
    [billingInterval, products]
  );
  const premiumPricing = useMemo(() => getPaidPlanCardPricing(premiumPlan), [premiumPlan]);
  const deeperPricing = useMemo(() => getPaidPlanCardPricing(deeperPlan), [deeperPlan]);
  const yearlySavingsBadge = useMemo(
    () =>
      getYearlySavingsBadgeForVisibleCard({
        activeCardIndex,
        premiumPlan,
        deeperPlan,
        includesFreeCard: true,
      }),
    [activeCardIndex, deeperPlan, premiumPlan]
  );
  const freePlan = getFreePlanCardModel();
  const hasPaidAccess = subscriptionStatus?.hasPaidAccess ?? false;
  const currentPlanTier = subscriptionStatus?.planTier ?? 'free';
  const showPricingSwitch = activeCardIndex !== 0;
  const showManageAction = hasPaidAccess && iapRuntimeAvailable;
  const showRestoreAction = !hasPaidAccess && iapRuntimeAvailable;
  const showIapHelper = !iapRuntimeAvailable;

  const handleUpgrade = useCallback(
    async (planTier: 'premium' | 'deeper') => {
      await purchasePlan(planTier, billingInterval, 'subscription');
    },
    [billingInterval, purchasePlan]
  );

  const premiumNote = currentPlanTier === 'premium'
    ? getReadOnlyLapseMessage()
    : 'A balanced rhythm for regular dream work.';
  const deeperNote = currentPlanTier === 'deeper'
    ? getReadOnlyLapseMessage()
    : 'More room for a deeper ongoing practice.';

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
              Free keeps the journal open. Premium is the recommended rhythm. Deeper opens more monthly room, weekly essays, and unlimited recent-field reports.
            </Text>

            {showPricingSwitch && (
              <View style={styles.switchWrap}>
                <SubscriptionBillingSwitch
                  value={billingInterval}
                  onChange={setBillingInterval}
                  yearlySavingsBadge={yearlySavingsBadge}
                />
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
                actionTitle={currentPlanTier === 'free' ? 'Current plan' : 'Continue free'}
                onPress={() => undefined}
                current={currentPlanTier === 'free'}
                disabled={currentPlanTier === 'free'}
                note="Free stays simple and clear: unlimited entries, one reflection per week, and five follow-up replies on that free reflection."
                variant="free"
              />

              <SubscriptionPlanCard
                title={premiumPlan.title}
                eyebrow="The natural choice"
                badgeText="Recommended"
                price={premiumPricing.price}
                compareAtPrice={premiumPricing.compareAtPrice}
                priceDetail={premiumPricing.priceDetail}
                secondaryPriceDetail={premiumPricing.secondaryPriceDetail}
                trialLabel={premiumPlan.trialLabel}
                features={PREMIUM_PLAN_FEATURES}
                imageSource={PREMIUM_IMAGE}
                actionTitle={
                  currentPlanTier === 'premium'
                    ? 'Current plan'
                    : purchasingPlanCode === premiumPlan.planCode
                      ? 'Opening store…'
                      : 'Choose Premium'
                }
                onPress={() => {
                  if (currentPlanTier === 'premium') return;
                  void handleUpgrade('premium');
                }}
                selected
                current={currentPlanTier === 'premium'}
                note={premiumNote}
                disabled={currentPlanTier === 'premium' || purchasingPlanCode !== null}
                variant="premium"
              />

              <SubscriptionPlanCard
                title={deeperPlan.title}
                eyebrow="For going further"
                price={deeperPricing.price}
                compareAtPrice={deeperPricing.compareAtPrice}
                priceDetail={deeperPricing.priceDetail}
                secondaryPriceDetail={deeperPricing.secondaryPriceDetail}
                trialLabel={deeperPlan.trialLabel}
                features={DEEPER_PLAN_FEATURES}
                imageSource={DEEPER_IMAGE}
                actionTitle={
                  currentPlanTier === 'deeper'
                    ? 'Current plan'
                    : purchasingPlanCode === deeperPlan.planCode
                      ? 'Opening store…'
                      : 'Choose Deeper'
                }
                onPress={() => {
                  if (currentPlanTier === 'deeper') return;
                  void handleUpgrade('deeper');
                }}
                current={currentPlanTier === 'deeper'}
                note={deeperNote}
                disabled={currentPlanTier === 'deeper' || purchasingPlanCode !== null}
                variant="deeper"
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
