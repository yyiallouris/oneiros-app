import React, { useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';
import { borderRadius, colors, spacing, typography, text } from '../theme';
import { PaperBackground, MysticHeader, Card, Button, DesignExportForeground, LoadingState } from '../components/ui';
import { PremiumUpsellModal } from '../components/subscription/PremiumUpsellModal';
import {
  ArchetypalEnergiesIcon,
  DreamPlacesIcon,
  InnerTensionsIcon,
  PatternRecognitionIcon,
  RepeatingPatternsIcon,
  ReturningImagesIcon,
  ThresholdsIcon,
} from '../components/icons/InsightsIcons';
import {
  getInsightsOverview,
  getPeriodThisMonth,
  getPeriodLabel,
} from '../services/insightsService';
import {
  canGeneratePatternReflection,
  generateRecentDreamFieldReflection,
  getCachedRecentDreamFieldReflection,
  getRecentPatternInsightEntries,
  type RecentDreamFieldCount,
} from '../services/patternInsightsService';
import { getPatternInsightLanguage } from '../services/patternInsightLanguageService';
import { isOnline } from '../utils/network';
import { useSubscription } from '../providers/SubscriptionProvider';
import { generateEntitledRecentDreamField, EntitlementError } from '../services/entitledAiService';
import { getFallbackPlan, getTargetPlanForInterval } from '../services/subscriptionService';
import type {
  CrossCategoryPatternItem,
  InsightsOverviewModel,
  InsightsSectionId,
} from '../types/insights';
import type { BillingInterval } from '../types/subscription';

type NavigationProp = StackNavigationProp<RootStackParamList>;

type ExploreLink = {
  sectionId: InsightsSectionId;
  title: string;
  icon: React.ReactNode;
};

const INSIGHTS_MOUNTAIN_HEIGHT = 240;
const SHOW_LEGACY_DREAM_FIELD_OVERVIEW = false;

const EMPTY_OVERVIEW: InsightsOverviewModel = {
  dreamsLoggedCount: 0,
  interpretedDreamsCount: 0,
  topImages: [],
  topMotifs: [],
  topThresholds: [],
  topTensions: [],
  topPlaces: [],
  topArchetypalEchoes: [],
  topAffects: [],
  strongestPatterns: [],
  fieldSummary: 'No dream field yet. Reflect on a dream to begin seeing recurring images, places, and movements.',
};

const kindLabel = (item: CrossCategoryPatternItem): string => {
  switch (item.kind) {
    case 'image':
      return 'Image';
    case 'motif':
      return 'Pattern';
    case 'threshold':
      return 'Threshold';
    case 'tension':
      return 'Tension';
    case 'place':
      return 'Place';
    case 'archetypal_echo':
      return 'Echo';
    case 'affect':
      return 'Atmosphere';
    default:
      return 'Pattern';
  }
};

const RECENT_SCOPE_OPTIONS: { count: RecentDreamFieldCount; label: string; scopeLabel: string }[] = [
  { count: 2, label: 'Last 2', scopeLabel: 'Latest 2 reflected dreams' },
  { count: 3, label: 'Last 3', scopeLabel: 'Latest 3 reflected dreams' },
  { count: 5, label: 'Last 5', scopeLabel: 'Latest 5 reflected dreams' },
];

function parseReflectionSections(raw: string): { title: string; body: string }[] {
  const sections: { title: string; body: string }[] = [];
  const re = /##\s*(.+?)\s*\n([\s\S]*?)(?=\n##\s|$)/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(raw)) !== null) {
    const title = m[1].trim();
    const body = m[2].trim();
    if (title && body) sections.push({ title, body });
  }
  if (sections.length === 0 && raw.trim()) sections.push({ title: 'Recent Dream Field', body: raw.trim() });
  return sections;
}

const InsightsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { status: subscriptionStatus, products, purchasePlan, purchasingPlanCode } = useSubscription();
  const [overview, setOverview] = useState<InsightsOverviewModel>(EMPTY_OVERVIEW);
  const [loading, setLoading] = useState(true);
  const [recentCount, setRecentCount] = useState<RecentDreamFieldCount>(3);
  const [recentAvailableCount, setRecentAvailableCount] = useState(0);
  const [recentReflection, setRecentReflection] = useState<string | null>(null);
  const [recentCachedAt, setRecentCachedAt] = useState<string | null>(null);
  const [recentGenerating, setRecentGenerating] = useState(false);
  const [recentEmpty, setRecentEmpty] = useState(false);
  const [recentLanguage, setRecentLanguage] = useState('en');
  const [billingInterval, setBillingInterval] = useState<BillingInterval>('monthly');
  const [upsellVisible, setUpsellVisible] = useState(false);
  const currentPeriod = getPeriodThisMonth();
  const periodLabel = getPeriodLabel(currentPeriod);
  const premiumPlan = useMemo(
    () =>
      products.find((product) => product.planCode === getTargetPlanForInterval(billingInterval)) ??
      getFallbackPlan(getTargetPlanForInterval(billingInterval)),
    [billingInterval, products]
  );
  const hasPaidAccess = subscriptionStatus?.hasPaidAccess ?? false;

  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      setLoading(true);
      (async () => {
        const p = getPeriodThisMonth();
        const effectiveLanguage = await getPatternInsightLanguage();
        const [nextOverview, recentEntries, cachedRecent] = await Promise.all([
          getInsightsOverview(p),
          getRecentPatternInsightEntries(5),
          getCachedRecentDreamFieldReflection(recentCount, effectiveLanguage),
        ]);
        if (!mounted) return;
        setOverview(nextOverview);
        setRecentAvailableCount(recentEntries.length);
        setRecentLanguage(effectiveLanguage);
        setRecentCachedAt(cachedRecent?.generated_at ?? null);
      })().finally(() => {
        if (mounted) setLoading(false);
      });
      return () => { mounted = false; };
    }, [])
  );

  const navigateToSection = (sectionId: InsightsSectionId) => {
    const rootNavigation = navigation.getParent<StackNavigationProp<RootStackParamList>>();
    const targetNavigation = rootNavigation ?? navigation;

    targetNavigation.navigate('InsightsSection', {
      sectionId,
      periodStart: currentPeriod.startDate,
      periodEnd: currentPeriod.endDate,
      periodLabel,
    });
  };

  const selectRecentCount = (count: RecentDreamFieldCount) => {
    setRecentCount(count);
    setRecentReflection(null);
    setRecentEmpty(false);
    setRecentCachedAt(null);
  };

  const handleRecentScopePress = (count: RecentDreamFieldCount) => {
    if (!hasPaidAccess) {
      setUpsellVisible(true);
      return;
    }
    selectRecentCount(count);
  };

  const handleGenerateRecentReflection = async (force = false) => {
    if (!hasPaidAccess) {
      setUpsellVisible(true);
      return;
    }
    if (recentGenerating) return;
    const online = await isOnline();
    if (!online) {
      Alert.alert(
        "You're Offline",
        'Generating reflection requires an internet connection. Please check your connection and try again.',
        [{ text: 'OK' }]
      );
      return;
    }

    const entries = await getRecentPatternInsightEntries(recentCount);
    setRecentAvailableCount(entries.length);
    if (!canGeneratePatternReflection(entries.length)) {
      setRecentEmpty(true);
      setRecentReflection(null);
      return;
    }

    setRecentEmpty(false);
    setRecentGenerating(true);
    setRecentReflection(null);
    try {
      const result = force
        ? await generateRecentDreamFieldReflection(recentCount, recentLanguage, { force: true })
        : await generateEntitledRecentDreamField(recentCount, recentLanguage);
      setRecentReflection(result);
      const cached = await getCachedRecentDreamFieldReflection(recentCount, recentLanguage);
      setRecentCachedAt(cached?.generated_at ?? new Date().toISOString());
    } catch (e: any) {
      if (e instanceof EntitlementError && e.premiumRequired) {
        setUpsellVisible(true);
        return;
      }
      const msg = e?.message || 'Something went wrong. Please try again.';
      Alert.alert('Error', msg);
    } finally {
      setRecentGenerating(false);
    }
  };

  const exploreLinks: ExploreLink[] = [
    {
      sectionId: 'recurring-symbols',
      title: 'Returning Images',
      icon: <ReturningImagesIcon size={42} />,
    },
    {
      sectionId: 'symbolic-motifs',
      title: 'Repeating Patterns',
      icon: <RepeatingPatternsIcon size={42} />,
    },
    {
      sectionId: 'thresholds',
      title: 'Thresholds',
      icon: <ThresholdsIcon size={42} />,
    },
    {
      sectionId: 'core-conflicts',
      title: 'Inner Tensions',
      icon: <InnerTensionsIcon size={42} />,
    },
    {
      sectionId: 'space-landscapes',
      title: 'Dream Places',
      icon: <DreamPlacesIcon size={42} />,
    },
    {
      sectionId: 'recurring-archetypes',
      title: 'Archetypal Echoes',
      icon: <ArchetypalEnergiesIcon size={42} />,
    },
  ];

  if (loading) {
    return (
      <View style={styles.container}>
        <PaperBackground height={INSIGHTS_MOUNTAIN_HEIGHT} lite />
        <DesignExportForeground fill>
          <MysticHeader title="Insights" subtitle="Patterns rising into view." />
          <View style={styles.loadingPlaceholder}>
            <LoadingState preset="loadSection" context="inline" />
          </View>
        </DesignExportForeground>
      </View>
    );
  }

  const hasEnoughForReflection = overview.interpretedDreamsCount >= 2;
  const hasEnoughRecentDreams = canGeneratePatternReflection(recentAvailableCount);
  const recentScopeLabel =
    RECENT_SCOPE_OPTIONS.find((option) => option.count === recentCount)?.scopeLabel ?? 'Latest 3 reflected dreams';
  const recentSections = recentReflection ? parseReflectionSections(recentReflection) : [];
  const recentCachedDate = recentCachedAt ? new Date(recentCachedAt).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
  }) : null;

  return (
    <View style={styles.container}>
      <PaperBackground height={INSIGHTS_MOUNTAIN_HEIGHT} lite />
      <DesignExportForeground fill>
        <MysticHeader title="Insights" subtitle="Patterns rising into view." />

        <ScrollView
          style={[styles.scroll, Platform.OS === 'web' && styles.webScroll]}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {SHOW_LEGACY_DREAM_FIELD_OVERVIEW && (
            <Card transparent style={styles.card}>
              <Text style={styles.cardTitle}>Dream Field Overview</Text>

              <View style={styles.statRow}>
                <View style={styles.statPill}>
                  <View style={styles.legacyOverviewBadge}>
                    <Text style={styles.legacyOverviewCount}>{overview.dreamsLoggedCount}</Text>
                    <Text style={styles.legacyOverviewLabel}>logged</Text>
                  </View>
                </View>
              </View>
            </Card>
          )}

          <Card transparent style={styles.card}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.cardTitle}>Recent Dream Field</Text>
              {hasPaidAccess ? (
                <Text style={styles.recentAvailable}>{`${recentAvailableCount} reflected`}</Text>
              ) : null}
            </View>
            <Text style={styles.reflectionBody}>
              A reflection on the latest dreams you’ve explored.
            </Text>
            <Text style={[styles.recentScopeLabel, !hasPaidAccess && styles.recentScopeLabelLocked]}>
              {recentScopeLabel}
            </Text>

            <View style={styles.recentScopeRow}>
              {RECENT_SCOPE_OPTIONS.map((option) => {
                const isActive = hasPaidAccess && recentCount === option.count;
                return (
                  <TouchableOpacity
                    key={option.count}
                    style={[
                      styles.recentScopeChip,
                      isActive && styles.recentScopeChipActive,
                      !hasPaidAccess && styles.recentScopeChipLocked,
                    ]}
                    onPress={() => handleRecentScopePress(option.count)}
                    activeOpacity={0.72}
                  >
                    <Text
                      style={[
                        styles.recentScopeChipText,
                        isActive && styles.recentScopeChipTextActive,
                        !hasPaidAccess && styles.recentScopeChipTextLocked,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.recentActionRow}>
              {recentGenerating ? (
                <LoadingState preset="recentReflection" style={styles.recentGenerateButton} />
              ) : !hasPaidAccess ? (
                <TouchableOpacity
                  onPress={() => handleGenerateRecentReflection(false)}
                  activeOpacity={0.72}
                  style={styles.recentLockedCtaWrap}
                >
                  <Text style={styles.reflectionCta}>Unlock Premium</Text>
                </TouchableOpacity>
              ) : (
                <Button
                  title={recentCachedDate ? 'View recent reflection' : 'Reflect on recent dreams'}
                  onPress={() => handleGenerateRecentReflection(false)}
                  disabled={!hasEnoughRecentDreams}
                  size="compact"
                  style={styles.recentGenerateButton}
                  textStyle={styles.recentGenerateText}
                />
              )}
            </View>

            {recentCachedDate && !recentReflection && !recentGenerating && (
              <View style={styles.recentCacheRow}>
                <Text style={styles.recentCacheText}>Last generated: {recentCachedDate}</Text>
                <TouchableOpacity onPress={() => handleGenerateRecentReflection(true)} activeOpacity={0.7}>
                  <Text style={styles.recentCacheAction}>Regenerate</Text>
                </TouchableOpacity>
              </View>
            )}

            {recentSections.length > 0 && !recentGenerating && (
              <View style={styles.recentReportCard}>
                {recentSections.map((section) => (
                  <View key={section.title} style={styles.recentReportBlock}>
                    <Text style={styles.recentReportTitle}>{section.title}</Text>
                    <Text style={styles.recentReportBody} selectable>{section.body}</Text>
                  </View>
                ))}
              </View>
            )}
          </Card>

          <TouchableOpacity
            style={[styles.reflectionCard, !hasPaidAccess && styles.lockedCard]}
            onPress={() => {
              if (!hasPaidAccess) {
                setUpsellVisible(true);
                return;
              }
              navigateToSection('pattern-recognition');
            }}
            activeOpacity={0.78}
          >
            <View style={styles.reflectionIcon}>
              <PatternRecognitionIcon size={72} />
            </View>
            <View style={styles.reflectionContent}>
              <Text style={styles.cardTitle}>Period Reflection</Text>
              <Text style={styles.reflectionBody}>
                {!hasPaidAccess
                  ? 'Premium unlocks month-to-date and archived period reflections with clear cadence and saved reports.'
                  : hasEnoughForReflection
                  ? 'Generate or revisit a symbolic essay on this period’s dream field.'
                  : 'Reflect on at least 2 dreams in this period to generate a meaningful period reflection.'}
              </Text>
              <Text style={styles.reflectionCta}>
                {!hasPaidAccess ? 'Unlock Premium' : hasEnoughForReflection ? 'Open reflection' : 'View reflection space'}
              </Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>

          {/*
            Legacy: standalone Forming/Returning Patterns card.
            Hidden after moving the pattern entry point into the Forming Patterns grid below.

            <Card transparent style={styles.card}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.cardTitle}>{patternTitle}</Text>
                <TouchableOpacity onPress={navigateToPatternExplorer} activeOpacity={0.7}>
                  <Text style={styles.headerLink}>Explore</Text>
                </TouchableOpacity>
              </View>
              {overview.strongestPatterns.length === 0 ? (
                <Text style={styles.mutedBody}>No recurring patterns are visible in this period yet.</Text>
              ) : (
                overview.strongestPatterns.map((item) => (
                  <TouchableOpacity
                    key={`${item.kind}:${item.label}`}
                    style={styles.patternRow}
                    onPress={() => navigateToPattern(item)}
                    activeOpacity={0.72}
                  >
                    <View style={styles.patternTextBlock}>
                      <Text style={styles.patternLabel} numberOfLines={1}>{item.label}</Text>
                      <Text style={styles.patternKind}>{kindLabel(item)}</Text>
                    </View>
                    <Text style={styles.patternCount}>×{item.count}</Text>
                  </TouchableOpacity>
                ))
              )}
              {overview.strongestPatterns.length > 0 && (
                <TouchableOpacity
                  style={styles.exploreAllButton}
                  onPress={navigateToPatternExplorer}
                  activeOpacity={0.72}
                >
                  <Text style={styles.exploreAllText}>Explore all patterns</Text>
                </TouchableOpacity>
              )}
            </Card>
          */}

          <Card transparent style={styles.card}>
            <Text style={styles.cardTitle}>Forming Patterns</Text>
            <View style={styles.exploreGrid}>
              {exploreLinks.map((link) => (
                <TouchableOpacity
                  key={link.sectionId}
                  style={styles.exploreTile}
                  onPress={() => navigateToSection(link.sectionId)}
                  activeOpacity={0.72}
                >
                  <View style={styles.exploreIcon}>{link.icon}</View>
                  <Text style={styles.exploreTitle} numberOfLines={2}>{link.title}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Card>
        </ScrollView>
        <PremiumUpsellModal
          visible={upsellVisible}
          source="insights"
          billingInterval={billingInterval}
          premiumPlan={premiumPlan}
          displayMode="premium_only"
          upgradeTitle={purchasingPlanCode === premiumPlan.planCode ? 'Opening store…' : 'Go Premium'}
          upgradeDisabled={purchasingPlanCode !== null}
          onClose={() => setUpsellVisible(false)}
          onIntervalChange={setBillingInterval}
          onUpgrade={async () => {
            const started = await purchasePlan(billingInterval, 'insights');
            if (started) {
              setUpsellVisible(false);
            }
          }}
        />
      </DesignExportForeground>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: spacing.xxl,
  },
  scroll: { flex: 1 },
  webScroll: {
    overflow: 'scroll',
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  card: {
    marginBottom: spacing.xl,
  },
  cardTitle: {
    fontSize: typography.sizes.lg,
    fontFamily: typography.medium,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  fieldSummary: {
    fontSize: typography.sizes.md,
    lineHeight: typography.sizes.md * 1.45,
    color: text.secondary,
    marginBottom: spacing.lg,
  },
  statRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  statPill: {
    flex: 1,
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.fieldSurface,
    borderWidth: 1,
    borderColor: colors.contourLineFaint,
  },
  legacyOverviewBadge: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  legacyOverviewCount: {
    fontSize: typography.sizes.lg,
    fontFamily: typography.medium,
    color: colors.textTitle,
  },
  legacyOverviewLabel: {
    fontSize: typography.sizes.xs,
    color: text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0,
  },
  previewBlock: {
    marginTop: spacing.md,
  },
  previewLabel: {
    fontSize: typography.sizes.xs,
    color: text.muted,
    textTransform: 'uppercase',
    letterSpacing: 0,
    marginBottom: spacing.xs,
  },
  previewText: {
    fontSize: typography.sizes.md,
    color: colors.textPrimary,
  },
  reflectionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    marginBottom: spacing.xl,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.cardGlassStrong,
    borderWidth: 1,
    borderColor: colors.contourLineFaint,
  },
  lockedCard: {
    opacity: 0.94,
  },
  reflectionIcon: {
    width: 78,
    height: 78,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  reflectionContent: {
    flex: 1,
    minWidth: 0,
  },
  reflectionBody: {
    fontSize: typography.sizes.sm,
    lineHeight: typography.sizes.sm * 1.45,
    color: text.secondary,
  },
  reflectionCta: {
    marginTop: spacing.sm,
    fontSize: typography.sizes.sm,
    color: colors.buttonPrimary,
    fontWeight: typography.weights.semibold,
  },
  chevron: {
    marginLeft: spacing.sm,
    fontSize: typography.sizes.lg,
    color: text.muted,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  headerLink: {
    fontSize: typography.sizes.sm,
    color: colors.buttonPrimary,
    fontWeight: typography.weights.semibold,
  },
  recentAvailable: {
    fontSize: typography.sizes.xs,
    color: text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0,
    marginLeft: spacing.md,
  },
  recentScopeLabel: {
    marginTop: spacing.md,
    fontSize: typography.sizes.sm,
    color: colors.textAccent,
    fontWeight: typography.weights.semibold,
  },
  recentScopeLabelLocked: {
    color: text.muted,
  },
  recentScopeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  recentScopeChip: {
    flex: 1,
    minHeight: 38,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.contourLineFaint,
    backgroundColor: colors.fieldSurface,
  },
  recentScopeChipActive: {
    borderColor: colors.buttonPrimary,
    backgroundColor: colors.buttonPrimaryLight12,
  },
  recentScopeChipLocked: {
    borderColor: colors.contourLine,
    backgroundColor: colors.fieldSurface,
    opacity: 0.72,
  },
  recentScopeChipText: {
    fontSize: typography.sizes.sm,
    color: text.secondary,
    fontWeight: typography.weights.medium,
  },
  recentScopeChipTextActive: {
    color: colors.buttonPrimary,
  },
  recentScopeChipTextLocked: {
    color: text.muted,
  },
  recentActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  recentLockedCtaWrap: {
    width: '100%',
    paddingVertical: spacing.xs,
    alignItems: 'center',
  },
  recentGenerateButton: {
    flex: 1,
    borderRadius: borderRadius.md,
  },
  recentGenerateButtonLocked: {
    opacity: 0.96,
  },
  recentGenerateText: {
    fontSize: typography.sizes.sm,
    color: colors.onAccent,
    fontWeight: typography.weights.semibold,
  },
  recentCacheRow: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  recentCacheText: {
    flex: 1,
    fontSize: typography.sizes.xs,
    color: text.muted,
  },
  recentCacheAction: {
    fontSize: typography.sizes.xs,
    color: colors.buttonPrimary,
    fontWeight: typography.weights.semibold,
  },
  recentReportCard: {
    marginTop: spacing.lg,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.divider,
  },
  recentReportBlock: {
    marginTop: spacing.lg,
  },
  recentReportTitle: {
    fontSize: typography.sizes.md,
    color: colors.textTitle,
    fontWeight: typography.weights.semibold,
    marginBottom: spacing.xs,
  },
  recentReportBody: {
    fontSize: typography.sizes.sm,
    lineHeight: typography.sizes.sm * 1.55,
    color: text.secondary,
  },
  exploreAllButton: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.sm,
    paddingRight: spacing.sm,
    marginTop: spacing.xs,
  },
  exploreAllText: {
    fontSize: typography.sizes.sm,
    color: colors.buttonPrimary,
    fontWeight: typography.weights.semibold,
  },
  mutedBody: {
    fontSize: typography.sizes.sm,
    color: text.secondary,
    lineHeight: typography.sizes.sm * 1.45,
  },
  patternRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.divider,
  },
  patternTextBlock: {
    flex: 1,
    minWidth: 0,
  },
  patternLabel: {
    fontSize: typography.sizes.md,
    color: colors.textTitle,
    fontWeight: typography.weights.semibold,
  },
  patternKind: {
    marginTop: 2,
    fontSize: typography.sizes.xs,
    color: text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0,
  },
  patternCount: {
    marginLeft: spacing.md,
    fontSize: typography.sizes.sm,
    color: colors.buttonPrimary,
    fontWeight: typography.weights.semibold,
  },
  exploreGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  exploreTile: {
    width: '48%',
    minHeight: 138,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.fieldSurface,
    borderWidth: 1,
    borderColor: colors.contourLineFaint,
  },
  exploreIcon: {
    width: 48,
    height: 48,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  exploreTitle: {
    width: '100%',
    fontSize: typography.sizes.sm,
    lineHeight: typography.sizes.sm * 1.3,
    color: colors.textTitle,
    fontWeight: typography.weights.semibold,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
});

export default InsightsScreen;
