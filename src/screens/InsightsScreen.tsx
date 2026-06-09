import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Easing,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';
import { borderRadius, colors, spacing, typography, text } from '../theme';
import { PsycheScreenBackground, MysticHeader, BreathingLine, Card, DesignExportForeground } from '../components/ui';
import {
  ArchetypesIcon,
  DreamsLoggedIcon,
  MotifsIcon,
  PatternRecognitionIcon,
  PlacesIcon,
  SymbolsIcon,
} from '../components/icons/InsightsIcons';
import {
  getInsightsOverview,
  getPeriodThisMonth,
  getPeriodLastMonth,
  getPeriodLastNMonths,
  getPeriodAllTime,
  getPeriodLabel,
} from '../services/insightsService';
import {
  canGeneratePatternReflection,
  generateRecentDreamFieldReflection,
  getCachedRecentDreamFieldReflection,
  getRecentPatternInsightEntries,
  type RecentDreamFieldCount,
} from '../services/patternInsightsService';
import {
  DEFAULT_PATTERN_INSIGHT_LANGUAGE,
  PATTERN_INSIGHT_LANGUAGES,
  PATTERN_INSIGHT_LANGUAGE_KEY,
} from '../constants/patternInsightLanguages';
import { isOnline } from '../utils/network';
import type {
  CrossCategoryPatternItem,
  InsightsOverviewModel,
  InsightsPeriod,
  InsightsSectionId,
} from '../types/insights';

type NavigationProp = StackNavigationProp<RootStackParamList>;

type PeriodPreset = 'this_month' | 'last_month' | 'last_3_months' | 'last_6_months' | 'all_time';

type ExploreLink = {
  sectionId: InsightsSectionId;
  title: string;
  body: string;
  icon: React.ReactNode;
};

function periodFromPresetSync(preset: PeriodPreset): InsightsPeriod | null {
  switch (preset) {
    case 'this_month':
      return getPeriodThisMonth();
    case 'last_month':
      return getPeriodLastMonth();
    case 'last_3_months':
      return getPeriodLastNMonths(3);
    case 'last_6_months':
      return getPeriodLastNMonths(6);
    case 'all_time':
      return null;
    default:
      return getPeriodThisMonth();
  }
}

const PRESETS: { key: PeriodPreset; label: string }[] = [
  { key: 'this_month', label: 'This month' },
  { key: 'last_month', label: 'Last month' },
  { key: 'last_3_months', label: 'Last 3 months' },
  { key: 'last_6_months', label: 'Last 6 months' },
  { key: 'all_time', label: 'All time' },
];

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

const joinPreview = (items: CrossCategoryPatternItem[]): string =>
  items.slice(0, 3).map((item) => item.label).join(' · ');

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
  const [periodPreset, setPeriodPreset] = useState<PeriodPreset>('this_month');
  const [periodExpanded, setPeriodExpanded] = useState(false);
  const dropdownOpacity = useRef(new Animated.Value(0)).current;
  const [currentPeriod, setCurrentPeriod] = useState<InsightsPeriod>(() => getPeriodThisMonth());
  const [overview, setOverview] = useState<InsightsOverviewModel>(EMPTY_OVERVIEW);
  const [loading, setLoading] = useState(true);
  const [recentCount, setRecentCount] = useState<RecentDreamFieldCount>(3);
  const [recentAvailableCount, setRecentAvailableCount] = useState(0);
  const [recentReflection, setRecentReflection] = useState<string | null>(null);
  const [recentCachedAt, setRecentCachedAt] = useState<string | null>(null);
  const [recentGenerating, setRecentGenerating] = useState(false);
  const [recentEmpty, setRecentEmpty] = useState(false);
  const [recentLanguage, setRecentLanguage] = useState(DEFAULT_PATTERN_INSIGHT_LANGUAGE);
  const [recentLanguagePickerOpen, setRecentLanguagePickerOpen] = useState(false);

  useEffect(() => {
    if (periodExpanded) {
      dropdownOpacity.setValue(0);
      Animated.timing(dropdownOpacity, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start();
    }
  }, [periodExpanded, dropdownOpacity]);

  const periodLabel =
    periodPreset === 'all_time' ? 'All time' : getPeriodLabel(currentPeriod);

  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      setLoading(true);
      (async () => {
        const p =
          periodPreset === 'all_time'
            ? await getPeriodAllTime()
            : periodFromPresetSync(periodPreset) ?? getPeriodThisMonth();
        const storedLanguage = await AsyncStorage.getItem(PATTERN_INSIGHT_LANGUAGE_KEY);
        const effectiveLanguage = storedLanguage ?? recentLanguage;
        const [nextOverview, recentEntries, cachedRecent] = await Promise.all([
          getInsightsOverview(p),
          getRecentPatternInsightEntries(5),
          getCachedRecentDreamFieldReflection(recentCount, effectiveLanguage),
        ]);
        if (!mounted) return;
        setCurrentPeriod(p);
        setOverview(nextOverview);
        setRecentAvailableCount(recentEntries.length);
        if (storedLanguage) setRecentLanguage(storedLanguage);
        setRecentCachedAt(cachedRecent?.generated_at ?? null);
      })().finally(() => {
        if (mounted) setLoading(false);
      });
      return () => { mounted = false; };
    }, [periodPreset])
  );

  const navigateToSection = (sectionId: InsightsSectionId) => {
    navigation.navigate('InsightsSection', {
      sectionId,
      periodStart: currentPeriod.startDate,
      periodEnd: currentPeriod.endDate,
      periodLabel,
    });
  };

  const navigateToPatternExplorer = () => {
    navigation.navigate('PatternExplorer', {
      periodStart: currentPeriod.startDate,
      periodEnd: currentPeriod.endDate,
      periodLabel,
    });
  };

  const navigateToPattern = (item: CrossCategoryPatternItem) => {
    if (item.filter?.type === 'symbol') {
      navigation.navigate('JournalFilter', { filterSymbol: item.filter.value });
      return;
    }
    if (item.filter?.type === 'motif') {
      navigation.navigate('JournalFilter', { filterMotif: item.filter.value });
      return;
    }
    if (item.filter?.type === 'landscape') {
      navigation.navigate('JournalFilter', { filterLandscape: item.filter.value });
      return;
    }
    navigateToSection(item.sectionId);
  };

  const selectPreset = (key: PeriodPreset) => {
    setPeriodPreset(key);
    const closeDropdown = () => {
      setPeriodExpanded(false);
      dropdownOpacity.setValue(1);
    };
    const fallback = setTimeout(closeDropdown, 250);
    Animated.timing(dropdownOpacity, {
      toValue: 0,
      duration: 180,
      easing: Easing.in(Easing.ease),
      useNativeDriver: true,
    }).start(() => {
      clearTimeout(fallback);
      closeDropdown();
    });
  };

  const selectRecentCount = (count: RecentDreamFieldCount) => {
    setRecentCount(count);
    setRecentReflection(null);
    setRecentEmpty(false);
    setRecentCachedAt(null);
  };

  const handleGenerateRecentReflection = async (force = false) => {
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
      const result = await generateRecentDreamFieldReflection(recentCount, recentLanguage, { force });
      setRecentReflection(result);
      const cached = await getCachedRecentDreamFieldReflection(recentCount, recentLanguage);
      setRecentCachedAt(cached?.generated_at ?? new Date().toISOString());
    } catch (e: any) {
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
      body: joinPreview(overview.topImages) || 'Images that keep returning',
      icon: <SymbolsIcon size={32} color={colors.tabIconActive} />,
    },
    {
      sectionId: 'symbolic-motifs',
      title: 'Repeating Patterns',
      body: joinPreview(overview.topMotifs) || 'Recurring dream situations',
      icon: <MotifsIcon size={32} color={colors.tabIconActive} />,
    },
    {
      sectionId: 'thresholds',
      title: 'Thresholds',
      body: joinPreview(overview.topThresholds) || 'Places where the dream changes ground',
      icon: <MotifsIcon size={32} color={colors.tabIconActive} />,
    },
    {
      sectionId: 'core-conflicts',
      title: 'Inner Tensions',
      body: joinPreview(overview.topTensions) || 'Tensions that keep returning',
      icon: <MotifsIcon size={32} color={colors.tabIconActive} />,
    },
    {
      sectionId: 'space-landscapes',
      title: 'Dream Places',
      body: joinPreview(overview.topPlaces) || 'Settings you return to',
      icon: <PlacesIcon size={32} color={colors.tabIconActive} />,
    },
    {
      sectionId: 'recurring-archetypes',
      title: 'Archetypal Echoes',
      body: joinPreview(overview.topArchetypalEchoes) || 'Deep structures and echoes',
      icon: <ArchetypesIcon size={32} color={colors.tabIconActive} />,
    },
  ];

  if (loading) {
    return (
      <View style={styles.container}>
        <PsycheScreenBackground waveHeight={150} />
        <DesignExportForeground fill>
          <MysticHeader title="Insights" subtitle="Patterns rising into view." />
          <View style={styles.loadingPlaceholder}>
            <BreathingLine width={100} height={2} color={colors.textMuted} />
          </View>
        </DesignExportForeground>
      </View>
    );
  }

  const hasReflectedDreams = overview.interpretedDreamsCount > 0;
  const hasEnoughForReflection = overview.interpretedDreamsCount >= 2;
  const hasEnoughRecentDreams = canGeneratePatternReflection(recentAvailableCount);
  const recentScopeLabel =
    RECENT_SCOPE_OPTIONS.find((option) => option.count === recentCount)?.scopeLabel ?? 'Latest 3 reflected dreams';
  const patternTitle = overview.strongestPatterns.some((item) => item.count >= 2)
    ? 'Returning Patterns'
    : 'Forming Patterns';
  const recentSections = recentReflection ? parseReflectionSections(recentReflection) : [];
  const recentCachedDate = recentCachedAt ? new Date(recentCachedAt).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
  }) : null;

  return (
    <View style={styles.container}>
      <PsycheScreenBackground waveHeight={180} />
      <DesignExportForeground fill>
        <MysticHeader title="Insights" subtitle="Patterns rising into view." />

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.tagline}>{periodLabel} in your dreams</Text>

          <View style={styles.periodSelectorWrap}>
            <TouchableOpacity
              style={styles.periodTrigger}
              onPress={() => setPeriodExpanded((e) => !e)}
              activeOpacity={0.7}
            >
              <Text style={styles.periodTriggerLabel}>{periodLabel}</Text>
              <Text style={[styles.periodArrow, periodExpanded && styles.periodArrowUp]}>▾</Text>
            </TouchableOpacity>
            {periodExpanded && (
              <Animated.View style={[styles.periodDropdown, { opacity: dropdownOpacity }]}>
                {PRESETS.map(({ key, label }) => (
                  <TouchableOpacity
                    key={key}
                    style={[styles.periodOption, periodPreset === key && styles.periodOptionActive]}
                    onPress={() => selectPreset(key)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.periodOptionText, periodPreset === key && styles.periodOptionTextActive]}>
                      {label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </Animated.View>
            )}
          </View>

          <Card transparent style={styles.card}>
            <Text style={styles.cardTitle}>Dream Field Overview</Text>
            <Text style={styles.fieldSummary}>{overview.fieldSummary}</Text>

            <View style={styles.statRow}>
              <View style={styles.statPill}>
                <DreamsLoggedIcon size={26} color={colors.tabIconActive} />
                <View style={styles.statTextBlock}>
                  <Text style={styles.statValue}>{overview.dreamsLoggedCount}</Text>
                  <Text style={styles.statLabel}>logged</Text>
                </View>
              </View>
              <View style={styles.statPill}>
                <PatternRecognitionIcon size={26} color={colors.tabIconActive} />
                <View style={styles.statTextBlock}>
                  <Text style={styles.statValue}>{overview.interpretedDreamsCount}</Text>
                  <Text style={styles.statLabel}>reflected</Text>
                </View>
              </View>
            </View>

            {!hasReflectedDreams ? (
              <View style={styles.emptyFieldBox}>
                <Text style={styles.emptyFieldTitle}>No dream field yet</Text>
                <Text style={styles.emptyFieldBody}>
                  Write and reflect on 1–2 dreams to begin seeing recurring images, places, and movements.
                </Text>
              </View>
            ) : (
              <>
                {overview.topImages.length > 0 && (
                  <View style={styles.previewBlock}>
                    <Text style={styles.previewLabel}>Returning images</Text>
                    <Text style={styles.previewText}>{joinPreview(overview.topImages)}</Text>
                  </View>
                )}
                {overview.topAffects.length > 0 && (
                  <View style={styles.previewBlock}>
                    <Text style={styles.previewLabel}>Dominant atmosphere</Text>
                    <Text style={styles.previewText}>{joinPreview(overview.topAffects)}</Text>
                  </View>
                )}
              </>
            )}
          </Card>

          <Card transparent style={styles.card}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.cardTitle}>Recent Dream Field</Text>
              <Text style={styles.recentAvailable}>
                {recentAvailableCount} reflected
              </Text>
            </View>
            <Text style={styles.reflectionBody}>
              A reflection on the latest dreams you’ve explored.
            </Text>
            <Text style={styles.recentScopeLabel}>{recentScopeLabel}</Text>

            <View style={styles.recentScopeRow}>
              {RECENT_SCOPE_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.count}
                  style={[
                    styles.recentScopeChip,
                    recentCount === option.count && styles.recentScopeChipActive,
                  ]}
                  onPress={() => selectRecentCount(option.count)}
                  activeOpacity={0.72}
                >
                  <Text
                    style={[
                      styles.recentScopeChipText,
                      recentCount === option.count && styles.recentScopeChipTextActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.recentActionRow}>
              <TouchableOpacity
                style={[
                  styles.recentGenerateButton,
                  (recentGenerating || !hasEnoughRecentDreams) && styles.recentGenerateButtonDisabled,
                ]}
                onPress={() => handleGenerateRecentReflection(false)}
                disabled={recentGenerating}
                activeOpacity={0.78}
              >
                <Text style={styles.recentGenerateText}>
                  {recentGenerating ? 'Reflecting…' : recentCachedDate ? 'View recent reflection' : 'Reflect on recent dreams'}
                </Text>
              </TouchableOpacity>
              {!recentGenerating && (
                <TouchableOpacity
                  style={styles.recentLanguageChip}
                  onPress={() => setRecentLanguagePickerOpen((open) => !open)}
                  activeOpacity={0.78}
                >
                  <Text style={styles.recentLanguageChipText}>
                    {PATTERN_INSIGHT_LANGUAGES.find((l) => l.code === recentLanguage)?.display ?? 'EN'}
                  </Text>
                  <Text style={[styles.periodArrow, recentLanguagePickerOpen && styles.periodArrowUp]}>▾</Text>
                </TouchableOpacity>
              )}
            </View>

            {recentLanguagePickerOpen && (
              <View style={styles.recentLanguageDropdown}>
                {PATTERN_INSIGHT_LANGUAGES.map((lang) => (
                  <TouchableOpacity
                    key={lang.code}
                    style={[
                      styles.periodOption,
                      recentLanguage === lang.code && styles.periodOptionActive,
                    ]}
                    onPress={async () => {
                      setRecentLanguage(lang.code);
                      setRecentLanguagePickerOpen(false);
                      const cached = await getCachedRecentDreamFieldReflection(recentCount, lang.code);
                      setRecentReflection(null);
                      setRecentCachedAt(cached?.generated_at ?? null);
                      await AsyncStorage.setItem(PATTERN_INSIGHT_LANGUAGE_KEY, lang.code);
                    }}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.periodOptionText,
                        recentLanguage === lang.code && styles.periodOptionTextActive,
                      ]}
                    >
                      {lang.name} ({lang.display})
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {recentCachedDate && !recentReflection && !recentGenerating && (
              <View style={styles.recentCacheRow}>
                <Text style={styles.recentCacheText}>Last generated: {recentCachedDate}</Text>
                <TouchableOpacity onPress={() => handleGenerateRecentReflection(true)} activeOpacity={0.7}>
                  <Text style={styles.recentCacheAction}>Regenerate</Text>
                </TouchableOpacity>
              </View>
            )}

            {!hasEnoughRecentDreams && (
              <View style={styles.emptyFieldBox}>
                <Text style={styles.emptyFieldTitle}>A recent field is forming</Text>
                <Text style={styles.emptyFieldBody}>
                  Reflect on at least 2 dreams to generate a recent dream field reflection.
                </Text>
              </View>
            )}

            {recentEmpty && hasEnoughRecentDreams && (
              <View style={styles.emptyFieldBox}>
                <Text style={styles.emptyFieldTitle}>A recent field is forming</Text>
                <Text style={styles.emptyFieldBody}>
                  There are not enough reflected dreams for this recent scope yet.
                </Text>
              </View>
            )}

            {recentGenerating && (
              <View style={styles.recentLoadingBox}>
                <BreathingLine width={96} height={2} color={colors.buttonPrimary} />
                <Text style={styles.mutedBody}>Listening for what is moving now…</Text>
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
            style={styles.reflectionCard}
            onPress={() => navigateToSection('pattern-recognition')}
            activeOpacity={0.78}
          >
            <View style={styles.reflectionIcon}>
              <PatternRecognitionIcon size={46} color={colors.tabIconActive} />
            </View>
            <View style={styles.reflectionContent}>
              <Text style={styles.cardTitle}>Period Reflection</Text>
              <Text style={styles.reflectionBody}>
                {hasEnoughForReflection
                  ? 'Generate or revisit a symbolic essay on this period’s dream field.'
                  : 'Reflect on at least 2 dreams in this period to generate a meaningful period reflection.'}
              </Text>
              <Text style={styles.reflectionCta}>
                {hasEnoughForReflection ? 'Open reflection' : 'View reflection space'}
              </Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>

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

          <Card transparent style={styles.card}>
            <Text style={styles.cardTitle}>Explore Deeper</Text>
            <View style={styles.exploreGrid}>
              {exploreLinks.map((link) => (
                <TouchableOpacity
                  key={link.sectionId}
                  style={styles.exploreTile}
                  onPress={() => navigateToSection(link.sectionId)}
                  activeOpacity={0.72}
                >
                  <View style={styles.exploreIcon}>{link.icon}</View>
                  <Text style={styles.exploreTitle} numberOfLines={1}>{link.title}</Text>
                  <Text style={styles.exploreBody} numberOfLines={2}>{link.body}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Card>
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
  loadingPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: spacing.xxl,
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  tagline: {
    fontSize: typography.sizes.md,
    color: colors.textAccent,
    marginBottom: spacing.md,
    fontStyle: 'italic',
  },
  periodSelectorWrap: {
    marginBottom: spacing.xl,
  },
  periodTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.cardGlassStrong,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.contourLineFaint,
  },
  periodTriggerLabel: {
    fontSize: typography.sizes.md,
    color: colors.textPrimary,
    fontWeight: typography.weights.medium,
  },
  periodArrow: {
    fontSize: typography.sizes.sm,
    color: text.secondary,
    marginLeft: spacing.sm,
  },
  periodArrowUp: {
    transform: [{ rotate: '180deg' }],
  },
  periodDropdown: {
    marginTop: spacing.xs,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.contourLineFaint,
    backgroundColor: colors.cardGlassStrong,
    overflow: 'hidden',
  },
  periodOption: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  periodOptionActive: {
    backgroundColor: colors.buttonPrimaryLight,
  },
  periodOptionText: {
    fontSize: typography.sizes.md,
    color: colors.textPrimary,
  },
  periodOptionTextActive: {
    color: colors.buttonPrimary,
    fontWeight: typography.weights.medium,
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
  statTextBlock: {
    marginLeft: spacing.sm,
  },
  statValue: {
    fontSize: typography.sizes.lg,
    fontFamily: typography.medium,
    color: colors.textTitle,
  },
  statLabel: {
    fontSize: typography.sizes.xs,
    color: text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0,
  },
  emptyFieldBox: {
    marginTop: spacing.sm,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.buttonPrimaryLight12,
  },
  emptyFieldTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.textTitle,
    marginBottom: spacing.xs,
  },
  emptyFieldBody: {
    fontSize: typography.sizes.sm,
    color: text.secondary,
    lineHeight: typography.sizes.sm * 1.45,
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
  reflectionIcon: {
    width: 58,
    height: 58,
    borderRadius: borderRadius.full,
    backgroundColor: colors.fieldSurface,
    borderWidth: 1,
    borderColor: colors.contourLineFaint,
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
  recentScopeChipText: {
    fontSize: typography.sizes.sm,
    color: text.secondary,
    fontWeight: typography.weights.medium,
  },
  recentScopeChipTextActive: {
    color: colors.buttonPrimary,
  },
  recentActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  recentGenerateButton: {
    flex: 1,
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.buttonPrimary,
  },
  recentGenerateButtonDisabled: {
    opacity: 0.58,
  },
  recentGenerateText: {
    fontSize: typography.sizes.sm,
    color: colors.onAccent,
    fontWeight: typography.weights.semibold,
  },
  recentLanguageChip: {
    minHeight: 46,
    minWidth: 74,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.contourLineFaint,
    backgroundColor: colors.fieldSurface,
  },
  recentLanguageChipText: {
    fontSize: typography.sizes.sm,
    color: colors.textPrimary,
    fontWeight: typography.weights.semibold,
    marginRight: spacing.xs,
  },
  recentLanguageDropdown: {
    marginTop: spacing.sm,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.contourLineFaint,
    backgroundColor: colors.cardGlassStrong,
    overflow: 'hidden',
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
  recentLoadingBox: {
    minHeight: 92,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    marginTop: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.fieldSurface,
    borderWidth: 1,
    borderColor: colors.contourLineFaint,
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
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  exploreTitle: {
    fontSize: typography.sizes.sm,
    color: colors.textTitle,
    fontWeight: typography.weights.semibold,
    marginBottom: spacing.xs,
  },
  exploreBody: {
    fontSize: typography.sizes.xs,
    color: text.secondary,
    lineHeight: typography.sizes.xs * 1.35,
  },
});

export default InsightsScreen;
