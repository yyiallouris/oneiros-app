import React, { useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SubscriptionBillingSwitch } from './SubscriptionBillingSwitch';
import { SubscriptionPlanCarousel } from './SubscriptionPlanCarousel';
import { SubscriptionPlanCard } from './SubscriptionPlanCard';
import { SubscriptionStoreNotice } from './SubscriptionStoreNotice';
import { borderRadius, colors, spacing, text, typography } from '../../theme';
import type { BillingInterval, PremiumGateSource, StoreSubscriptionPlan } from '../../types/subscription';
import { DEEPER_PLAN_FEATURES, FREE_PLAN_FEATURES, PREMIUM_PLAN_FEATURES, getFreePlanCardModel, getPaidPlanCardPricing, getPremiumSourceCopy, getYearlySavingsBadgeForVisibleCard } from '../../services/subscriptionService';
import type { PlanTier } from '../../billing/types';
import { useSubscription } from '../../providers/SubscriptionProvider';

const FREE_IMAGE = require('../../assets/icons/subscription/oneiros_glyph_free.png');
const PREMIUM_IMAGE = require('../../assets/icons/subscription/oneiros_glyph_premium.png');
const DEEPER_IMAGE = require('../../assets/icons/subscription/oneiros_glyph_deeper.png');

type Props = {
  visible: boolean;
  source: PremiumGateSource;
  billingInterval: BillingInterval;
  premiumPlan: StoreSubscriptionPlan;
  deeperPlan: StoreSubscriptionPlan;
  storeProducts?: StoreSubscriptionPlan[];
  displayMode?: 'compare' | 'premium_only';
  currentPlanTier?: PlanTier;
  upgradeTitle?: Partial<Record<Exclude<PlanTier, 'free'>, string>>;
  upgradeDisabled?: boolean;
  storeProductsLoading?: boolean;
  onClose: () => void;
  onIntervalChange: (value: BillingInterval) => void;
  onUpgrade: (planTier: Exclude<PlanTier, 'free'>) => void;
};

export const PremiumUpsellModal: React.FC<Props> = ({
  visible,
  source,
  billingInterval,
  premiumPlan,
  deeperPlan,
  storeProducts,
  displayMode = 'compare',
  currentPlanTier = 'free',
  upgradeTitle,
  upgradeDisabled = false,
  storeProductsLoading = false,
  onClose,
  onIntervalChange,
  onUpgrade,
}) => {
  const insets = useSafeAreaInsets();
  const { refreshStoreProducts } = useSubscription();
  const copy = getPremiumSourceCopy(source);
  const freePlan = getFreePlanCardModel();
  const premiumPricing = getPaidPlanCardPricing(premiumPlan, { loading: storeProductsLoading });
  const deeperPricing = getPaidPlanCardPricing(deeperPlan, { loading: storeProductsLoading });
  const isPremiumOnly = displayMode === 'premium_only';
  const [activeCardIndex, setActiveCardIndex] = useState(isPremiumOnly ? 0 : 1);
  const showPricingSwitch = isPremiumOnly || activeCardIndex !== 0;
  const yearlySavingsBadge = getYearlySavingsBadgeForVisibleCard({
    activeCardIndex,
    products: storeProducts ?? [premiumPlan, deeperPlan],
    includesFreeCard: !isPremiumOnly,
  });
  const premiumTitle = !premiumPlan.storePriceAvailable
    ? storeProductsLoading ? 'Checking price…' : 'Price unavailable'
    : upgradeTitle?.premium ?? 'Choose Premium';
  const deeperTitle = !deeperPlan.storePriceAvailable
    ? storeProductsLoading ? 'Checking price…' : 'Price unavailable'
    : upgradeTitle?.deeper ?? 'Choose Deeper';
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
    !storeProductsLoading &&
    (!premiumPlan.storePriceAvailable || !deeperPlan.storePriceAvailable);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <TouchableOpacity style={styles.backdropTouchable} onPress={onClose} activeOpacity={1} />
        <View style={styles.sheet}>
          <ScrollView
            style={styles.sheetScroll}
            contentContainerStyle={[
              styles.sheetContent,
              { paddingBottom: spacing.xxxl + insets.bottom + spacing.lg },
            ]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
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
              <SubscriptionBillingSwitch
                value={billingInterval}
                onChange={onIntervalChange}
                yearlySavingsBadge={yearlySavingsBadge}
              />
            )}

            {hasStorePriceError ? (
              <SubscriptionStoreNotice
                onRetry={() => {
                  void refreshStoreProducts();
                }}
              />
            ) : null}

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
                  actionTitle={currentPlanTier === 'free' ? 'Your plan' : 'Continue free'}
                  onPress={onClose}
                  variant="free"
                  current={currentPlanTier === 'free'}
                  disabled={currentPlanTier === 'free'}
                  note="You can continue journaling freely and upgrade later from Subscription."
                />
              )}

              <SubscriptionPlanCard
                title={premiumPlan.title}
                eyebrow="Recommended path"
                badgeText="Recommended"
                price={premiumPricing.price}
                compareAtPrice={premiumPricing.compareAtPrice}
                priceDetail={premiumPricing.priceDetail}
                secondaryPriceDetail={premiumPricing.secondaryPriceDetail}
                trialLabel={premiumPlan.trialLabel}
                features={PREMIUM_PLAN_FEATURES}
                imageSource={PREMIUM_IMAGE}
                actionTitle={currentPlanTier === 'premium' ? 'Your plan' : premiumTitle}
                onPress={() => onUpgrade('premium')}
                selected
                variant="premium"
                current={currentPlanTier === 'premium'}
                disabled={
                  upgradeDisabled ||
                  currentPlanTier === 'premium' ||
                  !premiumPlan.storePriceAvailable
                }
                priceState={premiumPriceState}
                hideAction={premiumPriceState === 'unavailable'}
                note="A balanced rhythm for regular dream work."
              />

              <SubscriptionPlanCard
                title={deeperPlan.title}
                eyebrow="For those going further"
                price={deeperPricing.price}
                compareAtPrice={deeperPricing.compareAtPrice}
                priceDetail={deeperPricing.priceDetail}
                secondaryPriceDetail={deeperPricing.secondaryPriceDetail}
                trialLabel={deeperPlan.trialLabel}
                features={DEEPER_PLAN_FEATURES}
                imageSource={DEEPER_IMAGE}
                actionTitle={currentPlanTier === 'deeper' ? 'Your plan' : deeperTitle}
                onPress={() => onUpgrade('deeper')}
                variant="deeper"
                current={currentPlanTier === 'deeper'}
                disabled={
                  upgradeDisabled ||
                  currentPlanTier === 'deeper' ||
                  !deeperPlan.storePriceAvailable
                }
                priceState={deeperPriceState}
                hideAction={deeperPriceState === 'unavailable'}
                note="More room for a deeper ongoing practice."
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
  sheetScroll: {
    flexShrink: 1,
  },
  sheetContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
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
    fontFamily: typography.roles.screenTitle,
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
