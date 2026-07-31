import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { DesignExportForeground, PaperBackground } from '../../components/ui';
import { OnboardingProgress } from '../../components/onboarding/OnboardingProgress';
import { SubscriptionBillingSwitch } from '../../components/subscription/SubscriptionBillingSwitch';
import { SubscriptionPlanCarousel } from '../../components/subscription/SubscriptionPlanCarousel';
import { SubscriptionPlanCard } from '../../components/subscription/SubscriptionPlanCard';
import { useSubscription } from '../../providers/SubscriptionProvider';
import {
  DEEPER_PLAN_FEATURES,
  FREE_PLAN_FEATURES,
  PREMIUM_PLAN_FEATURES,
  getFreePlanCardModel,
  getPaidPlanCardPricing,
  getPaidPlanOptionsForInterval,
  getYearlySavingsBadgeForVisibleCard,
} from '../../services/subscriptionService';
import { borderRadius, colors, spacing, text, typography } from '../../theme';
import type { OnboardingStackParamList } from '../../navigation/types';
import type { BillingInterval } from '../../types/subscription';

const FREE_IMAGE = require('../../assets/icons/subscription/oneiros_glyph_free.png');
const PREMIUM_IMAGE = require('../../assets/icons/subscription/oneiros_glyph_premium.png');
const DEEPER_IMAGE = require('../../assets/icons/subscription/oneiros_glyph_deeper.png');

type NavProp = StackNavigationProp<OnboardingStackParamList, 'OnboardingSubscription'>;

const OnboardingSubscriptionScreen: React.FC = () => {
  const navigation = useNavigation<NavProp>();
  const { status, loading, products, purchasingPlanCode, purchasePlan } = useSubscription();
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

  useEffect(() => {
    if (status?.hasPaidAccess) {
      navigation.navigate('OnboardingSecure');
    }
  }, [navigation, status?.hasPaidAccess]);

  const handlePremiumPress = async (planTier: 'premium' | 'deeper') => {
    await purchasePlan(planTier, billingInterval, 'onboarding');
  };

  return (
    <View style={styles.container}>
      <PaperBackground height={280} lite />
      <DesignExportForeground fill>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            activeOpacity={0.7}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>

          <OnboardingProgress step={4} />
          <Text style={styles.title}>Choose your mode</Text>
          <Text style={styles.subtitle}>
            Start grounded with Free, choose Premium for the natural rhythm, or step into Deeper if you want more room each month.
          </Text>

          {activeCardIndex !== 0 && (
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
            testID="subscription-carousel"
          >
            <SubscriptionPlanCard
              title={freePlan.title}
              eyebrow="Journal freely"
              price={freePlan.displayPrice}
              priceDetail="Unlimited entries, one reflection per week"
              features={FREE_PLAN_FEATURES}
              imageSource={FREE_IMAGE}
              actionTitle="Continue with Free"
              onPress={() => navigation.navigate('OnboardingSecure')}
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
              actionTitle={purchasingPlanCode === premiumPlan.planCode ? 'Opening store…' : 'Choose Premium'}
              onPress={() => {
                void handlePremiumPress('premium');
              }}
              selected
              note="7 days free, then the selected plan begins if the store says the user is eligible."
              variant="premium"
              disabled={purchasingPlanCode !== null}
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
              actionTitle={purchasingPlanCode === deeperPlan.planCode ? 'Opening store…' : 'Choose Deeper'}
              onPress={() => {
                void handlePremiumPress('deeper');
              }}
              note="More monthly room, weekly essays, and unlimited recent dream field reports."
              variant="deeper"
              disabled={purchasingPlanCode !== null}
            />
          </SubscriptionPlanCarousel>

          <TouchableOpacity onPress={() => navigation.navigate('OnboardingSecure')} style={styles.skipLink} activeOpacity={0.72}>
            <Text style={styles.skipText}>Decide later in Subscription</Text>
          </TouchableOpacity>

          {loading && (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color={colors.buttonPrimary} />
              <Text style={styles.loadingText}>Refreshing subscription status…</Text>
            </View>
          )}
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
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: spacing.md,
    padding: spacing.xs,
  },
  backText: {
    fontSize: typography.sizes.md,
    color: colors.buttonPrimary,
    fontWeight: typography.weights.medium,
  },
  title: {
    fontSize: typography.sizes.xxl,
    fontFamily: typography.bold,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: typography.sizes.md,
    color: text.secondary,
    lineHeight: typography.sizes.md * 1.45,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  switchWrap: {
    marginBottom: spacing.xl,
  },
  skipLink: {
    alignSelf: 'center',
    marginTop: spacing.xl,
    paddingVertical: spacing.sm,
  },
  skipText: {
    fontSize: typography.sizes.sm,
    color: text.muted,
    fontFamily: typography.medium,
  },
  loadingRow: {
    marginTop: spacing.lg,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.cardGlassSoft,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  loadingText: {
    fontSize: typography.sizes.sm,
    color: text.secondary,
  },
});

export default OnboardingSubscriptionScreen;
