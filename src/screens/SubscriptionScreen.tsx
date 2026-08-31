import React, { useCallback, useMemo, useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { PaperBackground, Button, DesignExportForeground } from '../components/ui';
import { SubscriptionBillingSwitch } from '../components/subscription/SubscriptionBillingSwitch';
import { SubscriptionPlanCarousel } from '../components/subscription/SubscriptionPlanCarousel';
import { SubscriptionPlanCard } from '../components/subscription/SubscriptionPlanCard';
import { SubscriptionStoreNotice } from '../components/subscription/SubscriptionStoreNotice';
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
  getYearlySavingsBadgeForVisibleCard,
} from '../services/subscriptionService';
import { colors, spacing, text, typography } from '../theme';
import { DESIGN_EXPORT_MODE } from '../designExport';

const FREE_IMAGE = require('../assets/icons/subscription/oneiros_glyph_free.png');
const PREMIUM_IMAGE = require('../assets/icons/subscription/oneiros_glyph_premium.png');
const DEEPER_IMAGE = require('../assets/icons/subscription/oneiros_glyph_deeper.png');

const SubscriptionScreen: React.FC = () => {
  const {
    status: subscriptionStatus,
    products,
    storeProductsLoading,
    refreshStoreProducts,
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
  const premiumPricing = useMemo(
    () => getPaidPlanCardPricing(premiumPlan, { loading: storeProductsLoading }),
    [premiumPlan, storeProductsLoading]
  );
  const deeperPricing = useMemo(
    () => getPaidPlanCardPricing(deeperPlan, { loading: storeProductsLoading }),
    [deeperPlan, storeProductsLoading]
  );
  const yearlySavingsBadge = useMemo(
    () =>
      getYearlySavingsBadgeForVisibleCard({
        activeCardIndex,
        products,
        includesFreeCard: true,
      }),
    [activeCardIndex, products]
  );
  const freePlan = getFreePlanCardModel();
  const hasPaidAccess = subscriptionStatus?.hasPaidAccess ?? false;
  const currentPlanTier = subscriptionStatus?.planTier ?? 'free';
  const isLapsedPaidPlan = !hasPaidAccess && currentPlanTier !== 'free';
  const isActivePremium = hasPaidAccess && currentPlanTier === 'premium';
  const isActiveDeeper = hasPaidAccess && currentPlanTier === 'deeper';
  const isLapsedPremium = isLapsedPaidPlan && currentPlanTier === 'premium';
  const isLapsedDeeper = isLapsedPaidPlan && currentPlanTier === 'deeper';
  const premiumPriceState = premiumPlan.storePriceAvailable
    ? 'available'
    : storeProductsLoading
      ? 'loading'
      : 'unavailable';
  const deeperPriceState = deeperPlan.storePriceAvailable
    ? 'available'
    : storeProductsLoading
      ? 'loading'
      : 'unavailable';
  const hasStorePriceError =
    (iapRuntimeAvailable || DESIGN_EXPORT_MODE) &&
    !storeProductsLoading &&
    (!premiumPlan.storePriceAvailable || !deeperPlan.storePriceAvailable);
  const showPricingSwitch = activeCardIndex !== 0;
  const showManageAction = isLapsedPaidPlan && iapRuntimeAvailable;
  const showRestoreAction = currentPlanTier === 'free' && !hasPaidAccess && iapRuntimeAvailable;
  const showIapHelper = !iapRuntimeAvailable && !DESIGN_EXPORT_MODE;
  const manageLabel = Platform.OS === 'android' ? 'Manage in Google Play' : 'Manage subscription';

  const handleUpgrade = useCallback(
    async (planTier: 'premium' | 'deeper') => {
      await purchasePlan(planTier, billingInterval, 'subscription');
    },
    [billingInterval, purchasePlan]
  );

  const premiumNote = isLapsedPremium
    ? 'Your existing reflections remain available.'
    : 'A balanced rhythm for regular dream work.';
  const deeperNote = isLapsedDeeper
    ? 'Your existing reflections remain available.'
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

          <View style={styles.planSection}>
            <Text style={styles.sectionLabel}>Choose your mode</Text>
            <Text style={styles.compareCopy}>
              Free keeps the journal open. Premium is the recommended rhythm. Deeper opens more monthly room, weekly period reflections, and unlimited recent-field reports.
            </Text>

            {isLapsedPaidPlan ? (
              <View style={styles.lapsedNotice} testID="subscription-lapsed-notice">
                <Text style={styles.lapsedTitle}>
                  {currentPlanTier === 'deeper' ? 'Deeper access ended' : 'Premium access ended'}
                </Text>
                <Text style={styles.lapsedBody}>
                  Your existing reflections remain available. Renew to create new paid reflections and reports.
                </Text>
              </View>
            ) : null}

            {hasStorePriceError ? (
              <SubscriptionStoreNotice
                loading={storeProductsLoading}
                onRetry={() => {
                  void refreshStoreProducts();
                }}
              />
            ) : null}

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
                actionTitle={currentPlanTier === 'free' ? 'Your plan' : 'Private journal included'}
                onPress={() => undefined}
                current={!hasPaidAccess && currentPlanTier === 'free'}
                disabled
                hideAction
                note="Free stays simple and clear: unlimited entries, one reflection per week, and five follow-up replies on that free reflection."
                variant="free"
              />

              <SubscriptionPlanCard
                title={premiumPlan.title}
                eyebrow="The natural choice"
                badgeText={isLapsedPremium ? 'Expired' : 'Recommended'}
                price={premiumPricing.price}
                compareAtPrice={premiumPricing.compareAtPrice}
                priceDetail={premiumPricing.priceDetail}
                secondaryPriceDetail={premiumPricing.secondaryPriceDetail}
                trialLabel={premiumPlan.trialLabel}
                features={PREMIUM_PLAN_FEATURES}
                imageSource={PREMIUM_IMAGE}
                actionTitle={
                  isActivePremium
                    ? manageLabel
                    : isLapsedPremium
                      ? 'Renew Premium'
                    : purchasingPlanCode === premiumPlan.planCode
                      ? 'Opening store…'
                      : 'Choose Premium'
                }
                onPress={() => {
                  if (isActivePremium) {
                    void openManageSubscriptions();
                    return;
                  }
                  void handleUpgrade('premium');
                }}
                selected
                current={isActivePremium}
                note={premiumNote}
                disabled={
                  purchasingPlanCode !== null ||
                  !iapRuntimeAvailable ||
                  (!isActivePremium && !premiumPlan.storePriceAvailable)
                }
                priceState={premiumPriceState}
                hideAction={!iapRuntimeAvailable || (!isActivePremium && premiumPriceState === 'unavailable')}
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
                  isActiveDeeper
                    ? manageLabel
                    : isLapsedDeeper
                      ? 'Renew Deeper'
                    : purchasingPlanCode === deeperPlan.planCode
                      ? 'Opening store…'
                      : 'Choose Deeper'
                }
                onPress={() => {
                  if (isActiveDeeper) {
                    void openManageSubscriptions();
                    return;
                  }
                  void handleUpgrade('deeper');
                }}
                badgeText={isLapsedDeeper ? 'Expired' : undefined}
                current={isActiveDeeper}
                note={deeperNote}
                disabled={
                  purchasingPlanCode !== null ||
                  !iapRuntimeAvailable ||
                  (!isActiveDeeper && !deeperPlan.storePriceAvailable)
                }
                priceState={deeperPriceState}
                hideAction={!iapRuntimeAvailable || (!isActiveDeeper && deeperPriceState === 'unavailable')}
                variant="deeper"
              />
            </SubscriptionPlanCarousel>
          </View>

          <View style={styles.footerArea}>
            {showManageAction && (
              <Button
                title={manageLabel}
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
    fontFamily: typography.roles.screenTitle,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  planSection: {
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
  lapsedNotice: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderLeftWidth: 2,
    borderLeftColor: colors.contourLineSoft,
    backgroundColor: colors.cardGlassSoft,
    gap: spacing.xs,
  },
  lapsedTitle: {
    fontSize: typography.sizes.md,
    fontFamily: typography.medium,
    color: colors.textPrimary,
  },
  lapsedBody: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.regular,
    lineHeight: typography.sizes.sm * typography.lineHeights.normal,
    color: colors.textSecondary,
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
