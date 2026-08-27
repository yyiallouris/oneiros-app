import React, { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Animated,
  Easing,
  InteractionManager,
  Platform,
} from 'react-native';
import { useFocusEffect, useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackParamList } from '../navigation/types';
import { colors, spacing, typography, text, borderRadius } from '../theme';
import { PaperBackground, LoadingState, ContentSkeleton, SectionTitleWithInfo, SymbolInfoModal, DesignExportForeground, Button } from '../components/ui';
import { PremiumUpsellModal } from '../components/subscription/PremiumUpsellModal';
import {
  ArchetypalEnergiesIcon,
  DreamPlacesIcon,
  EmotionalWeatherIcon,
  InnerTensionsIcon,
  RepeatingPatternsIcon,
  ReturningImagesIcon,
  ThresholdsIcon,
} from '../components/icons/InsightsIcons';
import type {
  InsightsSectionId,
  InsightsPeriod,
  MotifCount,
  ThresholdCount,
  CentralConflictCount,
  AffectCount,
} from '../types/insights';
import {
  getRecurringSymbols,
  getRecurringArchetypes,
  getRecurringLandscapes,
  getRecurringMotifs,
  getRecurringThresholds,
  getRecurringCentralConflicts,
  getRecurringAffects,
  getCollectiveInsights,
  getSymbolClusters,
  symbolHasAssociations,
  getAssociationsForSymbol,
  getPeriodThisMonth,
  getPeriodLastMonth,
  getPeriodLastNMonths,
  getPeriodAllTime,
  getPeriodLabel,
} from '../services/insightsService';
import {
  generateMonthlyInsights,
  getPatternInsightEntries,
  getMonthPeriod,
  getLast12MonthKeys,
  formatMonthKeyLabel,
  formatReportKeyLabel,
  formatReportKeyLabelForEssay,
  getReportKeyForGeneration,
  getCurrentMonthKey,
  canGeneratePatternReflection,
} from '../services/patternInsightsService';
import { LocalStorage } from '../services/localStorage';
import {
  remoteGetPatternReports,
  remoteSavePatternReport,
} from '../services/remoteStorage';
import { UserService } from '../services/userService';
import { toSafeSymbolLabel } from '../constants/safeLabels';
import { INSIGHTS_SECTION_SUBTITLES } from '../constants/insightsSections';
import {
  getPatternInsightLanguage,
} from '../services/patternInsightLanguageService';
import { getInterpretationDepth, type InterpretationDepth } from '../services/userSettingsService';
import { isInnerStructureArchetype } from '../constants/archetypes';
import {
  ARCHETYPE_SECTION_NOTES,
  ARCHETYPE_SECTION_TITLES,
  getArchetypeInfoKey,
  type InfoModalKey,
} from '../constants/symbolArchetypeInfo';
import { isOnline } from '../utils/network';
import { useSubscription } from '../providers/SubscriptionProvider';
import { EntitlementError, generateEntitledPeriodReflection } from '../services/entitledAiService';
import { getPaidPlanOptionsForInterval } from '../services/subscriptionService';
import type { BillingInterval } from '../types/subscription';

type Route = RouteProp<RootStackParamList, 'InsightsSection'>;
type NavProp = StackNavigationProp<RootStackParamList, 'InsightsSection'>;
type PeriodPreset = 'this_month' | 'last_month' | 'last_3_months' | 'last_6_months' | 'all_time';

const SECTION_ICON_SIZE = 112;
const SectionReturningImagesIcon = () => (
  <ReturningImagesIcon size={SECTION_ICON_SIZE} />
);
const SectionRepeatingPatternsIcon = () => (
  <RepeatingPatternsIcon size={SECTION_ICON_SIZE} />
);
const SectionThresholdsIcon = () => (
  <ThresholdsIcon size={SECTION_ICON_SIZE} />
);
const SectionInnerTensionsIcon = () => (
  <InnerTensionsIcon size={SECTION_ICON_SIZE} />
);
const SectionArchetypalEnergiesIcon = () => (
  <ArchetypalEnergiesIcon size={SECTION_ICON_SIZE} />
);
const SectionDreamPlacesIcon = () => (
  <DreamPlacesIcon size={SECTION_ICON_SIZE} />
);
const SectionEmotionalWeatherIcon = () => (
  <EmotionalWeatherIcon size={SECTION_ICON_SIZE} />
);
const TOP_THEMES_LIMIT = 5;
const FORMING_PATTERN_SECTION_IDS: InsightsSectionId[] = [
  'recurring-symbols',
  'symbolic-motifs',
  'emotional-weather',
  'thresholds',
  'core-conflicts',
  'space-landscapes',
  'recurring-archetypes',
];
const PERIOD_PRESETS: { key: PeriodPreset; label: string }[] = [
  { key: 'this_month', label: 'This month' },
  { key: 'last_month', label: 'Last month' },
  { key: 'last_3_months', label: 'Last 3 months' },
  { key: 'last_6_months', label: 'Last 6 months' },
  { key: 'all_time', label: 'All time' },
];

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

function inferPresetFromPeriod(period: InsightsPeriod | undefined, label?: string): PeriodPreset {
  if (label === 'All time') return 'all_time';
  if (!period) return 'this_month';

  const candidates: Array<[PeriodPreset, InsightsPeriod]> = [
    ['this_month', getPeriodThisMonth()],
    ['last_month', getPeriodLastMonth()],
    ['last_3_months', getPeriodLastNMonths(3)],
    ['last_6_months', getPeriodLastNMonths(6)],
  ];

  const match = candidates.find(([, candidate]) =>
    candidate.startDate === period.startDate && candidate.endDate === period.endDate
  );

  return match?.[0] ?? 'this_month';
}

/** Format YYYY-MM-DD for pattern report subtitle (e.g. "5 Jan 2025"). */
function formatPatternDate(isoDate: string): string {
  const d = new Date(isoDate + 'T12:00:00');
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

/** Parse AI pattern insight into sections by ## headings (report-style) */
function parsePatternInsightSections(raw: string): { title: string; body: string }[] {
  const sections: { title: string; body: string }[] = [];
  const re = /##\s*(.+?)\s*\n([\s\S]*?)(?=\n##\s|$)/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(raw)) !== null) {
    const title = m[1].trim();
    const body = m[2].trim();
    if (title && body) sections.push({ title, body });
  }
  if (sections.length === 0 && raw.trim()) {
    sections.push({ title: 'Insight', body: raw.trim() });
  }
  return sections;
}

export type InsightsSectionScreenProps = {
  /** When true, use override* props instead of route params (e.g. when embedded in InsightsJourneyScreen). */
  embedded?: boolean;
  overrideSectionId?: InsightsSectionId;
  overridePeriod?: InsightsPeriod;
  overridePeriodLabel?: string;
};

const InsightsSectionScreenInner: React.FC<InsightsSectionScreenProps> = (props) => {
  const insets = useSafeAreaInsets();
  const { embedded, overrideSectionId, overridePeriod, overridePeriodLabel } = props;
  const route = useRoute<Route>();
  const navigation = useNavigation<NavProp>();
  const {
    status: subscriptionStatus,
    products,
    storeProductsLoading,
    purchasePlan,
    purchasingPlanCode,
  } = useSubscription();
  const sectionId = (embedded && overrideSectionId != null) ? overrideSectionId : (route.params?.sectionId ?? 'recurring-symbols');
  const routePeriod: InsightsPeriod | undefined = (embedded && overridePeriod != null)
    ? overridePeriod
    : (route.params?.periodStart != null && route.params?.periodEnd != null
        ? { startDate: route.params.periodStart, endDate: route.params.periodEnd }
        : undefined);
  const routePeriodLabel = (embedded && overridePeriodLabel != null)
    ? overridePeriodLabel
    : route.params?.periodLabel;
  const [sectionPeriodPreset, setSectionPeriodPreset] = useState<PeriodPreset>(() =>
    inferPresetFromPeriod(routePeriod, routePeriodLabel)
  );
  const [sectionPeriod, setSectionPeriod] = useState<InsightsPeriod>(() =>
    routePeriod ?? getPeriodThisMonth()
  );
  const [periodExpanded, setPeriodExpanded] = useState(false);
  const periodDropdownOpacity = useRef(new Animated.Value(0)).current;
  const period = embedded ? (routePeriod ?? getPeriodThisMonth()) : sectionPeriod;
  const periodLabel = embedded
    ? (routePeriodLabel ?? getPeriodLabel(period))
    : (sectionPeriodPreset === 'all_time' ? 'All time' : getPeriodLabel(sectionPeriod));
  const sectionSubtitle = INSIGHTS_SECTION_SUBTITLES[sectionId];
  const showSectionPeriodPicker = !embedded && FORMING_PATTERN_SECTION_IDS.includes(sectionId);
  const [loading, setLoading] = useState(true);
  const [symbols, setSymbols] = useState<{ name: string; normalizedKey: string; count: number }[]>([]);
  const [archetypes, setArchetypes] = useState<{ name: string; count: number }[]>([]);
  const [landscapes, setLandscapes] = useState<{ name: string; normalizedKey: string; count: number }[]>([]);
  const [motifs, setMotifs] = useState<MotifCount[]>([]);
  const [affects, setAffects] = useState<AffectCount[]>([]);
  const [thresholds, setThresholds] = useState<ThresholdCount[]>([]);
  const [centralConflicts, setCentralConflicts] = useState<CentralConflictCount[]>([]);
  const [collective, setCollective] = useState<{
    topSymbolsThisMonth: { symbol: string; count: number }[];
    archetypeTrends: { archetype: string; direction: string }[];
  }>({ topSymbolsThisMonth: [], archetypeTrends: [] });
  const [showExplicitTerms, setShowExplicitTerms] = useState(false);
  const [lessFrequentExpanded, setLessFrequentExpanded] = useState(false);
  const [allSymbolsExpanded, setAllSymbolsExpanded] = useState(false);
  const [clustersExpanded, setClustersExpanded] = useState(false);
  const [singleCrossingsExpanded, setSingleCrossingsExpanded] = useState(false);
  const [singleTensionsExpanded, setSingleTensionsExpanded] = useState(false);
  const [singlePlacesExpanded, setSinglePlacesExpanded] = useState(false);
  /** When set, show associations only for this symbol (Explore symbol data). */
  const [selectedSymbolForAssociations, setSelectedSymbolForAssociations] = useState<string | null>(null);
  /** Period reflection: archive (monthKey -> { generatedAt, text }), selected month for generate, viewing which report */
  const [patternReportsArchive, setPatternReportsArchive] = useState<Record<string, { generatedAt: string; text: string }>>({});
  const [patternSelectedMonthKey, setPatternSelectedMonthKey] = useState<string>(() => {
    const routeStartMonth = route.params?.periodStart?.slice(0, 7);
    const routeEndMonth = route.params?.periodEnd?.slice(0, 7);
    if (sectionId === 'pattern-recognition' && routeStartMonth && routeStartMonth === routeEndMonth) {
      return routeStartMonth;
    }
    const d = new Date();
    const currentMonthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    return currentMonthKey;
  });
  const [patternViewingMonthKey, setPatternViewingMonthKey] = useState<string | null>(null);
  const [patternMonthPickerOpen, setPatternMonthPickerOpen] = useState(false);
  const [patternInsightGenerating, setPatternInsightGenerating] = useState(false);
  /** After a generate attempt: meta for "Based on N dreams from X to Y" (set when report is generated). */
  const [patternReportMeta, setPatternReportMeta] = useState<{ monthKey: string; dreamCount: number; startDate: string; endDate: string } | null>(null);
  /** When user tapped Generate and there were 0 entries for this month, show empty state. */
  const [patternEmptyForMonthKey, setPatternEmptyForMonthKey] = useState<string | null>(null);
  const [patternLanguage, setPatternLanguage] = useState('en');
  const [archetypeModalKey, setArchetypeModalKey] = useState<InfoModalKey | null>(null);
  const [billingInterval, setBillingInterval] = useState<BillingInterval>('monthly');
  const [upsellVisible, setUpsellVisible] = useState(false);
  const patternReportOpacity = useRef(new Animated.Value(0)).current;
  const [interpretationDepth, setInterpretationDepth] = useState<InterpretationDepth>('standard');
  const [premiumPlan, deeperPlan] = useMemo(
    () => getPaidPlanOptionsForInterval(products, billingInterval),
    [billingInterval, products]
  );
  const hasPaidAccess = subscriptionStatus?.hasPaidAccess ?? false;
  const currentPlanTier = subscriptionStatus?.planTier ?? 'free';
  const essayCadence = subscriptionStatus?.essayCadence ?? 'weekly';

  useEffect(() => {
    if (!embedded) {
      setSectionPeriod(routePeriod ?? getPeriodThisMonth());
      setSectionPeriodPreset(inferPresetFromPeriod(routePeriod, routePeriodLabel));
      setPeriodExpanded(false);
      periodDropdownOpacity.setValue(1);
    }
  }, [
    embedded,
    route.params?.periodEnd,
    route.params?.periodLabel,
    route.params?.periodStart,
    sectionId,
    routePeriodLabel,
    periodDropdownOpacity,
  ]);

  useEffect(() => {
    if (periodExpanded) {
      periodDropdownOpacity.setValue(0);
      Animated.timing(periodDropdownOpacity, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start();
    }
  }, [periodExpanded, periodDropdownOpacity]);

  useEffect(() => {
    if (!embedded && showSectionPeriodPicker) {
      navigation.setParams({
        sectionId,
        periodStart: period.startDate,
        periodEnd: period.endDate,
        periodLabel,
      });
    }
  }, [embedded, navigation, period.endDate, period.startDate, periodLabel, sectionId, showSectionPeriodPicker]);

  const selectPeriodPreset = useCallback(async (preset: PeriodPreset) => {
    const nextPeriod =
      preset === 'all_time'
        ? await getPeriodAllTime()
        : periodFromPresetSync(preset) ?? getPeriodThisMonth();
    setSectionPeriodPreset(preset);
    setSectionPeriod(nextPeriod);

    const closeDropdown = () => {
      setPeriodExpanded(false);
      periodDropdownOpacity.setValue(1);
    };
    const fallback = setTimeout(closeDropdown, 250);
    Animated.timing(periodDropdownOpacity, {
      toValue: 0,
      duration: 180,
      easing: Easing.in(Easing.ease),
      useNativeDriver: true,
    }).start(() => {
      clearTimeout(fallback);
      closeDropdown();
    });
  }, [periodDropdownOpacity]);

  const load = useCallback(async () => {
    const currentSectionId = sectionId;
    if (__DEV__ && currentSectionId === 'space-landscapes') {
      console.log('[InsightsSection] load() running for space-landscapes');
    }
    setLoading(true);
    try {
      if (currentSectionId === 'recurring-symbols' || currentSectionId === 'symbol-details') {
        const data = await getRecurringSymbols(period);
        setSymbols(data);
      } else if (currentSectionId === 'recurring-archetypes') {
        const data = await getRecurringArchetypes(period);
        setArchetypes(data);
      } else if (currentSectionId === 'symbolic-motifs') {
        const data = await getRecurringMotifs(period);
        setMotifs(data);
      } else if (currentSectionId === 'emotional-weather') {
        const data = await getRecurringAffects(period);
        setAffects(data);
      } else if (currentSectionId === 'thresholds') {
        const data = await getRecurringThresholds(period);
        setThresholds(data);
      } else if (currentSectionId === 'core-conflicts') {
        const data = await getRecurringCentralConflicts(period);
        setCentralConflicts(data);
      } else if (currentSectionId === 'space-landscapes') {
        const data = await getRecurringLandscapes(period);
        if (__DEV__) {
          console.log('[InsightsSection] getRecurringLandscapes() returned:', data.length, 'items:', data.map((x) => x.name));
        }
        setLandscapes(data);
      } else if (currentSectionId === 'collective') {
        const data = await getCollectiveInsights();
        setCollective(data);
      } else if (currentSectionId === 'pattern-recognition') {
        const storedLang = await getPatternInsightLanguage();
        setPatternLanguage(storedLang);
        setPatternSelectedMonthKey((prev) => prev);
        const userId = await UserService.getCurrentUserId();
        let reports: Record<string, { generatedAt: string; text: string }>;
        if (userId) {
          const remote = await remoteGetPatternReports();
          reports = remote ?? (await LocalStorage.getPatternReports());
        } else {
          reports = await LocalStorage.getPatternReports();
        }
        setPatternReportsArchive(reports);
        setPatternViewingMonthKey(null);
      }
    } finally {
      setLoading(false);
    }
  }, [sectionId, period?.startDate, period?.endDate]);

  useFocusEffect(
    useCallback(() => {
      getInterpretationDepth().then(setInterpretationDepth);
      if (__DEV__ && sectionId === 'space-landscapes') {
        console.log('[InsightsSection] Focus — loading space-landscapes, sectionId:', sectionId);
      }
      if (Platform.OS === 'web') {
        const timeout = setTimeout(() => {
          void load();
        }, 0);
        return () => clearTimeout(timeout);
      }

      // Defer load to avoid blocking UI (embedded in FlatList or standalone)
      const task = InteractionManager.runAfterInteractions(() => load());
      return () => task.cancel();
    }, [load, embedded])
  );

  // Pattern report: smooth fade-in when viewing a report
  const displayedReportText = patternViewingMonthKey ? (patternReportsArchive[patternViewingMonthKey]?.text ?? null) : null;
  useEffect(() => {
    if (displayedReportText !== null) {
      patternReportOpacity.setValue(0);
      Animated.timing(patternReportOpacity, {
        toValue: 1,
        duration: 420,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start();
    }
  }, [displayedReportText]);

  // When showing space-landscapes with empty list after load, refetch once (fixes wrong sectionId on nav)
  useEffect(() => {
    if (sectionId === 'space-landscapes' && landscapes.length === 0 && !loading) {
      if (__DEV__) {
        console.log('[InsightsSection] space-landscapes empty after load — refetching getRecurringLandscapes()');
      }
      getRecurringLandscapes(period).then((data) => {
        if (__DEV__) {
          console.log('[InsightsSection] refetch returned:', data.length, 'items:', data.map((x) => x.name));
        }
        setLandscapes(data);
      });
    }
  }, [sectionId, loading, landscapes.length, period?.startDate, period?.endDate]);

  if (loading) {
    return (
      <View style={[styles.container, embedded && styles.containerTransparent]}>
        {!embedded && <PaperBackground height={260} lite />}
        <DesignExportForeground style={styles.centered}>
          <LoadingState preset="loadSection" />
        </DesignExportForeground>
      </View>
    );
  }

  return (
    <View style={[styles.container, embedded && styles.containerTransparent]}>
      {!embedded && <PaperBackground height={260} lite />}
      <DesignExportForeground fill>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: spacing.xxxl + insets.bottom + spacing.xxl },
          ]}
          showsVerticalScrollIndicator={false}
        >
        {showSectionPeriodPicker && (
          <View style={styles.sectionPeriodWrap}>
            <Text style={styles.sectionPeriodKicker}>Viewing period</Text>
            <TouchableOpacity
              style={styles.sectionPeriodTrigger}
              onPress={() => setPeriodExpanded((open) => !open)}
              activeOpacity={0.72}
            >
              <Text style={styles.sectionPeriodTriggerLabel}>{periodLabel}</Text>
              <Text style={[styles.sectionPeriodArrow, periodExpanded && styles.sectionPeriodArrowUp]}>▾</Text>
            </TouchableOpacity>
            {periodExpanded && (
              <Animated.View style={[styles.sectionPeriodDropdown, { opacity: periodDropdownOpacity }]}>
                {PERIOD_PRESETS.map(({ key, label }) => (
                  <TouchableOpacity
                    key={key}
                    style={[
                      styles.sectionPeriodOption,
                      sectionPeriodPreset === key && styles.sectionPeriodOptionActive,
                    ]}
                    onPress={() => {
                      void selectPeriodPreset(key);
                    }}
                    activeOpacity={0.72}
                  >
                    <Text
                      style={[
                        styles.sectionPeriodOptionText,
                        sectionPeriodPreset === key && styles.sectionPeriodOptionTextActive,
                      ]}
                    >
                      {label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </Animated.View>
            )}
          </View>
        )}
        {sectionSubtitle ? (
          <Text style={styles.sectionIntro}>{sectionSubtitle}</Text>
        ) : null}
        {/* Images: split into recurring (count ≥ 2) and visited once */}
        {sectionId === 'recurring-symbols' && (() => {
          const recurring = symbols.filter((s) => s.count >= 2);
          const visitedOnce = symbols.filter((s) => s.count < 2);
          return (
            <View style={styles.section}>
              <View style={styles.sectionIcon}>
                <SectionReturningImagesIcon />
              </View>
              {symbols.length === 0 ? (
                <Text style={styles.empty}>No distinct dream images have been identified here.</Text>
              ) : (
                <>
                  {recurring.length > 0 ? (
                    <>
                      <Text style={styles.sectionFraming}>Some images arrive with a particular presence and ask to be noticed.</Text>
                      {recurring.map((s) => (
                        <TouchableOpacity
                          key={s.normalizedKey}
                          style={styles.archetypeRow}
                          onPress={() => navigation.navigate('JournalFilter', { filterSymbol: s.name })}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.archetypeName} numberOfLines={1}>
                            {toSafeSymbolLabel(s.name, s.normalizedKey, showExplicitTerms)}
                          </Text>
                          <Text style={styles.archetypeCount}>×{s.count}</Text>
                        </TouchableOpacity>
                      ))}
                    </>
                  ) : (
                    <Text style={styles.mutedNote}>No image is carrying clear weight in this period yet.</Text>
                  )}
                  {visitedOnce.length > 0 && (
                    <View style={styles.collapsibleBlock}>
                      <View style={styles.collapsibleHeader}>
                        <Text style={styles.subSectionLabel}>Single Appearances</Text>
                      </View>
                      {visitedOnce.map((s) => (
                        <TouchableOpacity
                          key={s.normalizedKey}
                          style={styles.archetypeRow}
                          onPress={() => navigation.navigate('JournalFilter', { filterSymbol: s.name })}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.archetypeName} numberOfLines={1}>
                            {toSafeSymbolLabel(s.name, s.normalizedKey, showExplicitTerms)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </>
              )}
            </View>
          );
        })()}

        {/* Explore symbol data (deep dive): only when user taps View symbol details */}
        {sectionId === 'symbol-details' && (
          <>
            {symbols.length > 0 && (() => {
              const clusters = getSymbolClusters(symbols);
              const topSymbols = symbols.slice(0, TOP_THEMES_LIMIT);
              const notAllHaveAssociations = topSymbols.some((s) => !symbolHasAssociations(s.name, clusters));
              return notAllHaveAssociations ? (
                <Text style={styles.associationsNote}>
                  Symbol associations are available for selected symbols only.
                </Text>
              ) : null;
            })()}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Most frequent symbols</Text>
              {symbols.length === 0 ? (
                <Text style={styles.empty}>No symbols yet.</Text>
              ) : (
                (() => {
                  const clusters = getSymbolClusters(symbols);
                  return symbols.slice(0, TOP_THEMES_LIMIT).map((s) => (
                    <View key={s.normalizedKey} style={styles.themeRow}>
                      <View>
                        <Text style={styles.themeName}>
                          {toSafeSymbolLabel(s.name, s.normalizedKey, showExplicitTerms)}
                        </Text>
                        <Text style={styles.themeHint}>appears more than once</Text>
                      </View>
                      {symbolHasAssociations(s.name, clusters) ? (
                        <TouchableOpacity
                          onPress={() => setSelectedSymbolForAssociations((prev) => (prev === s.name ? null : s.name))}
                          style={styles.viewAssociationsCta}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.viewAssociationsLabel}>
                            {selectedSymbolForAssociations === s.name ? 'Hide associations' : 'View associations'}
                          </Text>
                        </TouchableOpacity>
                      ) : null}
                    </View>
                  ));
                })()
              )}
            </View>

            {/* Inline: associations only for the selected symbol */}
            {symbols.length > 0 && selectedSymbolForAssociations && (() => {
              const clusters = getSymbolClusters(symbols);
              const assoc = getAssociationsForSymbol(selectedSymbolForAssociations, clusters);
              if (!assoc) return null;
              return (
                <View style={styles.singleSymbolAssociationsBlock}>
                  <Text style={styles.singleSymbolAssociationsTitle}>
                    Associations for {toSafeSymbolLabel(selectedSymbolForAssociations, selectedSymbolForAssociations.trim().toLowerCase().replace(/\s+/g, ' '), showExplicitTerms)}
                  </Text>
                  <Text style={styles.singleSymbolClusterName}>{assoc.clusterName}</Text>
                  {assoc.relatedSymbols.length > 0 ? (
                    <Text style={styles.singleSymbolRelated}>
                      Related: {assoc.relatedSymbols.map((sym) => toSafeSymbolLabel(sym, sym.trim().toLowerCase().replace(/\s+/g, ' '), showExplicitTerms)).join(' · ')}
                    </Text>
                  ) : null}
                </View>
              );
            })()}

            {symbols.length > 0 && (
              <View style={styles.section}>
                <TouchableOpacity
                  onPress={() => setClustersExpanded((v) => !v)}
                  style={styles.collapsibleHeader}
                  activeOpacity={0.7}
                >
                  <Text style={styles.advancedSectionLabel}>Symbol associations (advanced)</Text>
                  <Text style={styles.expandHint}>{clustersExpanded ? '▼' : '▶'}</Text>
                </TouchableOpacity>
                {clustersExpanded && (() => {
                  const clusters = getSymbolClusters(symbols);
                  const mainClusters = clusters.filter((c) => c.clusterName !== 'Less frequent symbols');
                  const lessFrequent = clusters.find((c) => c.clusterName === 'Less frequent symbols');
                  return (
                    <View style={styles.clustersInside}>
                      {mainClusters.map((cluster) => (
                        <View key={cluster.clusterName} style={styles.clusterBlock}>
                          <Text style={styles.clusterName}>{cluster.clusterName}</Text>
                          <Text style={styles.clusterSymbols}>
                            {cluster.symbols.map((sym) => toSafeSymbolLabel(sym, sym.trim().toLowerCase().replace(/\s+/g, ' '), showExplicitTerms)).join(' · ')}
                          </Text>
                        </View>
                      ))}
                      {lessFrequent && lessFrequent.symbols.length > 0 && (
                        <View style={styles.collapsibleBlock}>
                          <TouchableOpacity
                            onPress={() => setLessFrequentExpanded((v) => !v)}
                            style={styles.collapsibleHeader}
                            activeOpacity={0.7}
                          >
                            <Text style={styles.clusterName}>{lessFrequent.clusterName}</Text>
                            <Text style={styles.expandHint}>{lessFrequentExpanded ? '▼' : '▶'}</Text>
                          </TouchableOpacity>
                          {lessFrequentExpanded && (
                            <Text style={[styles.clusterSymbols, { marginTop: spacing.sm }]}>
                              {lessFrequent.symbols.map((sym) => toSafeSymbolLabel(sym, sym.trim().toLowerCase().replace(/\s+/g, ' '), showExplicitTerms)).join(' · ')}
                            </Text>
                          )}
                        </View>
                      )}
                    </View>
                  );
                })()}
              </View>
            )}

            {symbols.length > 0 && (
              <View style={styles.sectionAllSymbols}>
                <TouchableOpacity
                  onPress={() => setAllSymbolsExpanded((v) => !v)}
                  style={styles.collapsibleHeader}
                  activeOpacity={0.7}
                >
                  <Text style={styles.allSymbolsSectionLabel}>All symbols</Text>
                  <Text style={styles.expandHint}>{allSymbolsExpanded ? '▼' : '▶'}</Text>
                </TouchableOpacity>
                {allSymbolsExpanded && (
                  <>
                    <View style={styles.switchRow}>
                      <Text style={styles.switchLabel}>Show explicit terms</Text>
                      <Switch
                        value={showExplicitTerms}
                        onValueChange={setShowExplicitTerms}
                        trackColor={{ false: colors.border, true: colors.buttonPrimaryLight }}
                        thumbColor={colors.buttonPrimary}
                      />
                    </View>
                    <View style={styles.allList}>
                      {symbols.map((s) => (
                        <Text key={s.normalizedKey} style={styles.allSymbol}>
                          {toSafeSymbolLabel(s.name, s.normalizedKey, showExplicitTerms)}
                        </Text>
                      ))}
                    </View>
                  </>
                )}
              </View>
            )}
          </>
        )}

        {/* Motifs: recurring structural and situational patterns */}
        {sectionId === 'symbolic-motifs' && (() => {
          const recurringMotifs = motifs.filter((m) => m.count >= 2);
          const seenOnce = motifs.filter((m) => m.count < 2);
          return (
            <View style={styles.section}>
              <View style={styles.sectionIcon}>
                <SectionRepeatingPatternsIcon />
              </View>
              {motifs.length === 0 ? (
                <Text style={styles.empty}>No clear dream motifs have been identified here.</Text>
              ) : (
                <>
                  {recurringMotifs.length > 0 ? (
                    <>
                      <Text style={styles.sectionFraming}>Dreams often place us within recognizable human situations and dramas.</Text>
                      {recurringMotifs.map((m) => (
                        <TouchableOpacity
                          key={m.normalizedKey}
                          style={styles.archetypeRow}
                          onPress={() => navigation.navigate('JournalFilter', { filterMotif: m.name })}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.archetypeName} numberOfLines={1}>{m.name}</Text>
                          <Text style={styles.archetypeCount}>×{m.count}</Text>
                        </TouchableOpacity>
                      ))}
                    </>
                  ) : (
                    <Text style={styles.mutedNote}>No motif is standing out clearly in this period yet.</Text>
                  )}
                  {seenOnce.length > 0 && (
                    <View style={styles.collapsibleBlock}>
                      <View style={styles.collapsibleHeader}>
                        <Text style={styles.subSectionLabel}>Single Appearances</Text>
                      </View>
                      {seenOnce.map((m) => (
                        <TouchableOpacity
                          key={m.normalizedKey}
                          style={styles.archetypeRow}
                          onPress={() => navigation.navigate('JournalFilter', { filterMotif: m.name })}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.archetypeName} numberOfLines={1}>{m.name}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </>
              )}
            </View>
          );
        })()}

        {/* Emotional Atmosphere: recurring felt tones from affects */}
        {sectionId === 'emotional-weather' && (() => {
          const recurringAffects = affects.filter((a) => a.count >= 2);
          const seenOnce = affects.filter((a) => a.count < 2);
          return (
            <View style={styles.section}>
              <View style={styles.sectionIcon}>
                <SectionEmotionalWeatherIcon />
              </View>
              {affects.length === 0 ? (
                <Text style={styles.empty}>No distinct emotional atmosphere has been identified here.</Text>
              ) : (
                <>
                  {recurringAffects.length > 0 ? (
                    <>
                      <Text style={styles.sectionFraming}>A felt atmosphere surrounds and moves through the dream.</Text>
                      {recurringAffects.map((a) => (
                        <View key={a.normalizedKey} style={styles.archetypeRow}>
                          <Text style={styles.archetypeName} numberOfLines={1}>{a.name}</Text>
                          <Text style={styles.archetypeCount}>×{a.count}</Text>
                        </View>
                      ))}
                    </>
                  ) : (
                    <Text style={styles.mutedNote}>No distinct emotional climate is standing out in this period yet.</Text>
                  )}
                  {seenOnce.length > 0 && (
                    <View style={styles.collapsibleBlock}>
                      <View style={styles.collapsibleHeader}>
                        <Text style={styles.subSectionLabel}>Single Appearances</Text>
                      </View>
                      {seenOnce.map((a) => (
                        <View key={a.normalizedKey} style={styles.archetypeRow}>
                          <Text style={styles.archetypeName} numberOfLines={1}>{a.name}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </>
              )}
            </View>
          );
        })()}

        {/* Thresholds: transition points kept separate from motifs */}
        {sectionId === 'thresholds' && (() => {
          const recurringThresholds = thresholds.filter((t) => t.count >= 2);
          const seenOnce = thresholds.filter((t) => t.count < 2);
          return (
            <View style={styles.section}>
              <View style={styles.sectionIcon}>
                <SectionThresholdsIcon />
              </View>
              {thresholds.length === 0 ? (
                <Text style={styles.empty}>No clear threshold or passage has appeared here.</Text>
              ) : (
                <>
                  {recurringThresholds.length > 0 ? (
                    <>
                      <Text style={styles.sectionFraming}>The dream brings you to an edge between one place, state, or world and another.</Text>
                      {recurringThresholds.map((t) => (
                        <View key={t.normalizedKey} style={styles.archetypeRow}>
                          <Text style={styles.archetypeName} numberOfLines={1}>{t.name}</Text>
                          <Text style={styles.archetypeCount}>×{t.count}</Text>
                        </View>
                      ))}
                    </>
                  ) : (
                    <Text style={styles.mutedNote}>No threshold is standing out clearly in this period yet.</Text>
                  )}
                  {seenOnce.length > 0 && (
                    <View style={styles.collapsibleBlock}>
                      <TouchableOpacity
                        onPress={() => setSingleCrossingsExpanded((v) => !v)}
                        style={styles.collapsibleHeader}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.subSectionLabel}>Single Thresholds</Text>
                        <Text style={styles.expandHint}>{singleCrossingsExpanded ? '▼' : '▶'}</Text>
                      </TouchableOpacity>
                      {singleCrossingsExpanded && seenOnce.map((t) => (
                        <View key={t.normalizedKey} style={styles.archetypeRow}>
                          <Text style={styles.archetypeName} numberOfLines={1}>{t.name}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </>
              )}
            </View>
          );
        })()}

        {/* Inner tensions: dynamic tensions kept separate from motifs */}
        {sectionId === 'core-conflicts' && (() => {
          const recurringConflicts = centralConflicts.filter((c) => c.count >= 2);
          const seenOnce = centralConflicts.filter((c) => c.count < 2);
          return (
            <View style={styles.section}>
              <View style={styles.sectionIcon}>
                <SectionInnerTensionsIcon />
              </View>
              {centralConflicts.length === 0 ? (
                <Text style={styles.empty}>No distinct inner tension has been identified here.</Text>
              ) : (
                <>
                  {recurringConflicts.length > 0 ? (
                    <>
                      <Text style={styles.sectionFraming}>The dream may hold two directions in tension without resolving them.</Text>
                      {recurringConflicts.map((c) => (
                        <View key={c.normalizedKey} style={styles.archetypeRow}>
                          <Text style={styles.archetypeName} numberOfLines={1}>{c.name}</Text>
                          <Text style={styles.archetypeCount}>×{c.count}</Text>
                        </View>
                      ))}
                    </>
                  ) : (
                    <Text style={styles.mutedNote}>No inner tension is standing out clearly in this period yet.</Text>
                  )}
                  {seenOnce.length > 0 && (
                    <View style={styles.collapsibleBlock}>
                      <TouchableOpacity
                        onPress={() => setSingleTensionsExpanded((v) => !v)}
                        style={styles.collapsibleHeader}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.subSectionLabel}>Single Tensions</Text>
                        <Text style={styles.expandHint}>{singleTensionsExpanded ? '▼' : '▶'}</Text>
                      </TouchableOpacity>
                      {singleTensionsExpanded && seenOnce.map((c) => (
                        <View key={c.normalizedKey} style={styles.archetypeRow}>
                          <Text style={styles.archetypeName} numberOfLines={1}>{c.name}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </>
              )}
            </View>
          );
        })()}

        {/* Dream Landscapes: split recurring (2+) vs visited once */}
        {sectionId === 'space-landscapes' && (() => {
          const recurringPlaces = landscapes.filter((l) => l.count >= 2);
          const visitedOnce = landscapes.filter((l) => l.count < 2);
          return (
            <View style={styles.section}>
              <View style={styles.sectionIcon}>
                <SectionDreamPlacesIcon />
              </View>
              {landscapes.length === 0 ? (
                <Text style={styles.empty}>No distinct dream landscape has been identified here.</Text>
              ) : (
                <>
                  {recurringPlaces.length > 0 ? (
                    <>
                      <Text style={styles.sectionFraming}>The setting shapes what can happen and how the dream is felt.</Text>
                      {recurringPlaces.map((l) => (
                        <TouchableOpacity
                          key={l.normalizedKey}
                          style={styles.archetypeRow}
                          onPress={() => navigation.navigate('JournalFilter', { filterLandscape: l.name })}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.archetypeName} numberOfLines={1}>{l.name}</Text>
                          <Text style={styles.archetypeCount}>×{l.count}</Text>
                        </TouchableOpacity>
                      ))}
                    </>
                  ) : (
                    <Text style={styles.mutedNote}>No dream landscape is standing out clearly in this period yet.</Text>
                  )}
                  {visitedOnce.length > 0 && (
                    <View style={styles.collapsibleBlock}>
                      <TouchableOpacity
                        onPress={() => setSinglePlacesExpanded((v) => !v)}
                        style={styles.collapsibleHeader}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.subSectionLabel}>Other Places</Text>
                        <Text style={styles.expandHint}>{singlePlacesExpanded ? '▼' : '▶'}</Text>
                      </TouchableOpacity>
                      {singlePlacesExpanded && visitedOnce.map((l) => (
                        <TouchableOpacity
                          key={l.normalizedKey}
                          style={styles.archetypeRow}
                          onPress={() => navigation.navigate('JournalFilter', { filterLandscape: l.name })}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.archetypeName} numberOfLines={1}>{l.name}</Text>
                          <Text style={styles.archetypeCount}>×{l.count}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </>
              )}
            </View>
          );
        })()}

        {sectionId === 'recurring-archetypes' && (() => {
          // Post-Jungian distinction: inner structures (structural) vs archetypal energies (dynamic)
          const coreList = archetypes.filter((a) => isInnerStructureArchetype(a.name));
          const dynamicList = archetypes.filter((a) => !isInnerStructureArchetype(a.name));
          return (
            <View style={[styles.section, styles.sectionNoTopPadding]}>
              <View style={styles.sectionIcon}>
                <SectionArchetypalEnergiesIcon />
              </View>
              {archetypes.length === 0 ? (
                <Text style={styles.empty}>No clear archetypal echoes have been identified here.</Text>
              ) : (
                <>
                  <Text style={styles.sectionFraming}>Some dream material may resonate with deeper patterns of human experience.</Text>
                  {/* DREAM_LAYER_OVERVIEW intentionally hidden for now until we decide its final placement. */}

                  {/* Inner structures — the deeper functions that organize experience */}
                  {coreList.length > 0 && (
                    <View style={[styles.archetypeCategoryBlock, styles.archetypeCategoryBlockFirst]}>
                      <SectionTitleWithInfo
                        title={ARCHETYPE_SECTION_TITLES.core}
                        infoKey="core-architecture"
                        variant="archetype"
                        showInfo
                      />
                      <Text style={styles.archetypeCategoryNote}>
                        {ARCHETYPE_SECTION_NOTES.core}
                      </Text>
                      {coreList.map((a) => (
                        <TouchableOpacity
                          key={a.name}
                          style={styles.archetypeRow}
                          onPress={() => setArchetypeModalKey(getArchetypeInfoKey(a.name))}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.archetypeName}>{a.name}</Text>
                          <Text style={styles.archetypeCount}>×{a.count}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}

                  {/* Archetypal energies — the living patterns moving through experience */}
                  {dynamicList.length > 0 && (
                    <View style={styles.archetypeCategoryBlock}>
                      <SectionTitleWithInfo
                        title={ARCHETYPE_SECTION_TITLES.dynamic}
                        infoKey="archetypal-states"
                        variant="archetype"
                        showInfo
                      />
                      <Text style={styles.archetypeCategoryNote}>
                        {ARCHETYPE_SECTION_NOTES.dynamic}
                      </Text>
                      {dynamicList.map((a) => (
                        <TouchableOpacity
                          key={a.name}
                          style={styles.archetypeRow}
                          onPress={() => setArchetypeModalKey(getArchetypeInfoKey(a.name))}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.archetypeName}>{a.name}</Text>
                          <Text style={styles.archetypeCount}>×{a.count}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </>
              )}
            </View>
          );
        })()}

        {sectionId === 'pattern-recognition' && (
          <View style={styles.patternWrap}>
            <Text style={styles.patternIntro}>
              A symbolic reflection on the dream field of a chosen month.
            </Text>

            <View style={styles.patternCard}>
              <TouchableOpacity
                style={styles.patternMonthRow}
                onPress={() => {
                  setPatternMonthPickerOpen((o) => !o);
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.patternMonthLabel}>Reflection for</Text>
                <Text style={styles.patternMonthValue} numberOfLines={1}>
                  {formatMonthKeyLabel(patternSelectedMonthKey)}
                </Text>
                <Text style={[styles.patternMonthChevron, patternMonthPickerOpen && styles.patternMonthChevronUp]}>
                  ▾
                </Text>
              </TouchableOpacity>

              {patternMonthPickerOpen && (
                <View style={styles.patternMonthDropdown}>
                  {getLast12MonthKeys().map((monthKey) => (
                    <TouchableOpacity
                      key={monthKey}
                      style={[
                        styles.patternMonthOption,
                        patternSelectedMonthKey === monthKey && styles.patternMonthOptionActive,
                      ]}
                      onPress={() => {
                        setPatternSelectedMonthKey(monthKey);
                        setPatternMonthPickerOpen(false);
                        setPatternEmptyForMonthKey(null);
                      }}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.patternMonthOptionText,
                          patternSelectedMonthKey === monthKey && styles.patternMonthOptionTextActive,
                        ]}
                      >
                        {formatMonthKeyLabel(monthKey)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {!patternInsightGenerating && (
              hasPaidAccess ? (
              <Button
                title="Generate reflection"
                size="compact"
                style={styles.patternGenerateButton}
                disabled={!!patternReportsArchive[getReportKeyForGeneration(patternSelectedMonthKey, essayCadence)]}
                onPress={async () => {
                  const online = await isOnline();
                  if (!online) {
                    Alert.alert(
                      "You're Offline",
                      'Generating reflection requires an internet connection. Please check your connection and try again.',
                      [{ text: 'OK' }]
                    );
                    return;
                  }
                  const now = new Date();
                  const isCurrentMonth = patternSelectedMonthKey === getCurrentMonthKey();
                  const effectiveReportKey = getReportKeyForGeneration(patternSelectedMonthKey, essayCadence);

                  if (patternReportsArchive[effectiveReportKey]) {
                    if (isCurrentMonth) {
                      Alert.alert(
                        'Once per week',
                        'You can generate one reflection per week for the current month. Come back next week for a fresh perspective on your dreams.',
                        [{ text: 'OK' }]
                      );
                    } else {
                      Alert.alert(
                        'One per month',
                        'A reflection already exists for this month.',
                        [{ text: 'OK' }]
                      );
                    }
                    return;
                  }
                  const periodFilter = isCurrentMonth
                    ? {
                        startDate: `${patternSelectedMonthKey}-01`,
                        endDate: now.toISOString().slice(0, 10),
                      }
                    : getMonthPeriod(patternSelectedMonthKey);
                  const entries = await getPatternInsightEntries(periodFilter);
                  if (!canGeneratePatternReflection(entries.length)) {
                    setPatternEmptyForMonthKey(patternSelectedMonthKey);
                    setPatternReportMeta(null);
                    setPatternViewingMonthKey(null);
                    return;
                  }
                  setPatternEmptyForMonthKey(null);
                  setPatternInsightGenerating(true);
                  try {
                    const startDate = entries[0].date;
                    const endDate = entries[entries.length - 1].date;
                    const result = await generateEntitledPeriodReflection(patternSelectedMonthKey, patternLanguage);
                    const userId = await UserService.getCurrentUserId();
                    if (userId) await remoteSavePatternReport(effectiveReportKey, result);
                    const reports = userId
                      ? (await remoteGetPatternReports() ?? await LocalStorage.getPatternReports())
                      : await LocalStorage.getPatternReports();
                    setPatternReportsArchive(reports);
                    setPatternReportMeta({
                      monthKey: effectiveReportKey,
                      dreamCount: entries.length,
                      startDate,
                      endDate,
                    });
                    setPatternViewingMonthKey(effectiveReportKey);
                  } catch (e: any) {
                    if (e instanceof EntitlementError && e.premiumRequired) {
                      setUpsellVisible(true);
                      return;
                    }
                    const msg = e?.message || 'Something went wrong. Please try again.';
                    Alert.alert('Error', msg);
                  } finally {
                    setPatternInsightGenerating(false);
                  }
                }}
              />
              ) : (
              <TouchableOpacity
                style={styles.patternGenerateRow}
                onPress={() => setUpsellVisible(true)}
                activeOpacity={0.7}
              >
                <Text style={styles.patternGenerateLabel}>Unlock Premium</Text>
              </TouchableOpacity>
              )
              )}
            </View>

            {patternEmptyForMonthKey === patternSelectedMonthKey && !patternInsightGenerating && (
              <View style={styles.patternEmptyCard}>
                <Text style={styles.patternEmptyTitle}>A light field is forming</Text>
                <Text style={styles.patternEmptyBody}>
                  Reflect on at least 2 dreams in this period to generate a meaningful reflection.
                </Text>
              </View>
            )}

            {patternInsightGenerating && (
              <>
                <LoadingState preset="recentReflection" style={styles.patternLoadingState} />
                <ContentSkeleton />
              </>
            )}

            {displayedReportText !== null && !patternInsightGenerating && (
              <Animated.View style={[styles.patternReportWrap, { opacity: patternReportOpacity }]}>
                <View style={styles.patternReportCard}>
                  {patternViewingMonthKey && (
                    <View style={styles.patternReportHeader}>
                      <View style={styles.patternReportHeaderRow}>
                        <Text style={styles.patternReportMonth}>
                          {formatReportKeyLabelForEssay(patternViewingMonthKey)}
                        </Text>
                        <TouchableOpacity
                          onPress={() => setPatternViewingMonthKey(null)}
                          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.patternCloseLink}>Close</Text>
                        </TouchableOpacity>
                      </View>
                      {patternReportMeta?.monthKey === patternViewingMonthKey && (
                        <Text style={styles.patternReportBasedOn}>
                          Based on {patternReportMeta.dreamCount} dream{patternReportMeta.dreamCount !== 1 ? 's' : ''} from {formatPatternDate(patternReportMeta.startDate)} to {formatPatternDate(patternReportMeta.endDate)}.
                        </Text>
                      )}
                    </View>
                  )}
                  {parsePatternInsightSections(displayedReportText).map((sec, i) => (
                    <View key={i} style={styles.patternReportBlock}>
                      <Text style={styles.patternReportBlockTitle}>{sec.title}</Text>
                      <Text style={styles.patternReportBlockBody} selectable>
                        {sec.body}
                      </Text>
                    </View>
                  ))}
                </View>
              </Animated.View>
            )}

            {Object.keys(patternReportsArchive).length > 0 && (
              <View style={styles.patternArchiveSection}>
                <Text style={styles.patternArchiveTitle}>Past reflections</Text>
                {Object.keys(patternReportsArchive)
                  .sort()
                  .reverse()
                  .map((reportKey) => (
                    <TouchableOpacity
                      key={reportKey}
                      style={[
                        styles.patternArchiveRow,
                        patternViewingMonthKey === reportKey && styles.patternArchiveRowActive,
                      ]}
                      onPress={() => setPatternViewingMonthKey(reportKey)}
                      activeOpacity={0.8}
                    >
                      <View style={styles.patternArchiveRowLeft}>
                        <Text style={styles.patternArchiveRowLabel} numberOfLines={1}>
                          {formatReportKeyLabel(reportKey)}
                        </Text>
                        {patternReportsArchive[reportKey]?.generatedAt && (
                          <Text style={styles.patternArchiveRowGenerated} numberOfLines={1}>
                            Generated {formatPatternDate(patternReportsArchive[reportKey].generatedAt.slice(0, 10))}
                          </Text>
                        )}
                      </View>
                      <Text style={styles.patternArchiveRowHint}>View</Text>
                    </TouchableOpacity>
                  ))}
              </View>
            )}
          </View>
        )}

        {sectionId === 'collective' && (
          <View style={styles.collectivePanel}>
            <Text style={styles.body}>
              Anonymized, aggregate only: no individual data, no quotes, no dates tied to users.
            </Text>
            {collective.topSymbolsThisMonth.length === 0 && collective.archetypeTrends.length === 0 ? (
              <Text style={styles.empty}>Collective insights will appear here when the feature is available.</Text>
            ) : (
              <>
                {collective.topSymbolsThisMonth.length > 0 && (
                  <View style={styles.section}>
                    <Text style={styles.sectionLabel}>Global themes this month</Text>
                    {collective.topSymbolsThisMonth.map((s, i) => (
                      <View key={i} style={styles.themeRow}>
                        <Text style={styles.themeName}>{s.symbol}</Text>
                      </View>
                    ))}
                  </View>
                )}
                {collective.archetypeTrends.length > 0 && (
                  <View style={styles.section}>
                    <Text style={styles.sectionLabel}>Archetypal echoes</Text>
                    {collective.archetypeTrends.map((t, i) => (
                      <View key={i} style={styles.themeRow}>
                        <Text style={styles.themeName}>{t.archetype}</Text>
                        <Text style={styles.themeHint}>{t.direction}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </>
            )}
          </View>
        )}
        </ScrollView>

        {archetypeModalKey && (
          <SymbolInfoModal
            visible={!!archetypeModalKey}
            onClose={() => setArchetypeModalKey(null)}
            contentKey={archetypeModalKey}
          />
        )}
        <PremiumUpsellModal
          visible={upsellVisible}
          source="period_reflection"
          billingInterval={billingInterval}
          premiumPlan={premiumPlan}
          deeperPlan={deeperPlan}
          storeProducts={products}
          storeProductsLoading={storeProductsLoading}
          displayMode="premium_only"
          currentPlanTier={currentPlanTier}
          upgradeTitle={{
            premium: purchasingPlanCode === premiumPlan.planCode ? 'Opening store…' : 'Choose Premium',
            deeper: purchasingPlanCode === deeperPlan.planCode ? 'Opening store…' : 'Choose Deeper',
          }}
          upgradeDisabled={purchasingPlanCode !== null}
          onClose={() => setUpsellVisible(false)}
          onIntervalChange={setBillingInterval}
          onUpgrade={async (planTier) => {
            const started = await purchasePlan(planTier, billingInterval, 'period_reflection');
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
  containerTransparent: {
    backgroundColor: 'transparent',
  },
  scroll: { flex: 1 },
  scrollContent: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  sectionPeriodWrap: {
    marginBottom: spacing.lg,
  },
  sectionIntro: {
    fontSize: typography.sizes.md,
    lineHeight: typography.sizes.md * 1.45,
    color: text.secondary,
    marginBottom: spacing.lg,
  },
  sectionPeriodKicker: {
    fontSize: typography.sizes.xs,
    color: text.muted,
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
  },
  sectionPeriodTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.contourLineFaint,
    backgroundColor: colors.cardGlassStrong,
  },
  sectionPeriodTriggerLabel: {
    fontSize: typography.sizes.md,
    color: colors.textPrimary,
    fontWeight: typography.weights.medium,
  },
  sectionPeriodArrow: {
    fontSize: typography.sizes.sm,
    color: text.secondary,
    marginLeft: spacing.sm,
  },
  sectionPeriodArrowUp: {
    transform: [{ rotate: '180deg' }],
  },
  sectionPeriodDropdown: {
    marginTop: spacing.xs,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.contourLineFaint,
    backgroundColor: colors.cardGlassStrong,
    overflow: 'hidden',
  },
  sectionPeriodOption: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  sectionPeriodOptionActive: {
    backgroundColor: colors.buttonPrimaryLight,
  },
  sectionPeriodOptionText: {
    fontSize: typography.sizes.md,
    color: colors.textPrimary,
  },
  sectionPeriodOptionTextActive: {
    color: colors.buttonPrimary,
    fontWeight: typography.weights.medium,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    marginBottom: spacing.xxl,
    paddingTop: spacing.lg,
  },
  sectionNoTopPadding: {
    paddingTop: 0,
  },
  sectionIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  sectionLabel: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  dominantInsightBlock: {
    marginBottom: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors.contourLineFaint,
  },
  dominantInsightLabel: {
    fontSize: typography.sizes.xs,
    color: text.muted,
    marginBottom: 2,
  },
  dominantInsightValue: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
  },
  themeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  themeName: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
  },
  themeHint: {
    fontSize: typography.sizes.sm,
    color: text.secondary,
    marginTop: 2,
  },
  symbolLandscapeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    marginBottom: spacing.xs,
  },
  symbolLandscapeName: {
    flex: 1,
    fontSize: typography.sizes.md,
    color: colors.textPrimary,
    marginRight: spacing.sm,
  },
  symbolLandscapeCount: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.buttonPrimary,
  },
  viewAssociationsCta: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  viewAssociationsLabel: {
    fontSize: typography.sizes.xs,
    color: colors.buttonPrimary,
    fontWeight: typography.weights.medium,
  },
  associationsNote: {
    fontSize: typography.sizes.sm,
    color: text.secondary,
    marginBottom: spacing.lg,
    fontStyle: 'italic',
  },
  singleSymbolAssociationsBlock: {
    marginBottom: spacing.xl,
    paddingVertical: spacing.md,
    paddingLeft: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderLeftWidth: 2,
    borderTopColor: colors.contourLineFaint,
    borderBottomColor: colors.contourLineFaint,
    borderLeftColor: colors.accentOldGold,
  },
  singleSymbolAssociationsTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  singleSymbolClusterName: {
    fontSize: typography.sizes.sm,
    color: colors.buttonPrimary,
    fontWeight: typography.weights.medium,
    marginBottom: spacing.xs,
  },
  singleSymbolRelated: {
    fontSize: typography.sizes.sm,
    color: text.secondary,
    lineHeight: typography.sizes.sm * typography.lineHeights.relaxed,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  barLabel: {
    fontSize: typography.sizes.sm,
    color: colors.textPrimary,
    width: 120,
    marginRight: spacing.sm,
  },
  barTrack: {
    flex: 1,
    height: 8,
    backgroundColor: colors.cardGlassStrong,
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    minWidth: 4,
    backgroundColor: colors.buttonPrimary,
    opacity: 0.7,
    borderRadius: 4,
  },
  observedLine: {
    fontSize: typography.sizes.sm,
    color: text.secondary,
    marginTop: spacing.lg,
    fontStyle: 'italic',
  },
  detailCta: {
    marginTop: spacing.xl,
    alignSelf: 'flex-start',
  },
  advancedSectionLabel: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: text.muted,
  },
  clustersInside: {
    marginTop: spacing.md,
  },
  clusterBlock: {
    marginBottom: spacing.lg,
  },
  collapsibleBlock: {
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
  },
  collapsibleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  expandHint: {
    fontSize: typography.sizes.xs,
    color: text.muted,
  },
  clusterName: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: text.secondary,
    marginBottom: 2,
  },
  clusterSymbols: {
    fontSize: typography.sizes.md,
    color: colors.textPrimary,
    lineHeight: typography.sizes.md * typography.lineHeights.relaxed,
  },
  sectionAllSymbols: {
    marginTop: spacing.xl,
    marginBottom: spacing.xxl,
    paddingTop: spacing.xl,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  allSymbolsSectionLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
    color: text.muted,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  switchLabel: {
    fontSize: typography.sizes.xs,
    color: text.muted,
    marginRight: spacing.sm,
  },
  allList: {
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  allSymbol: {
    fontSize: typography.sizes.xs,
    color: text.muted,
    lineHeight: typography.sizes.xs * typography.lineHeights.relaxed,
  },
  collectivePanel: {
    marginBottom: spacing.lg,
    paddingVertical: spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors.contourLineFaint,
  },
  patternWrap: {
    marginBottom: spacing.xl,
  },
  patternIntro: {
    fontSize: typography.sizes.md,
    color: text.secondary,
    lineHeight: typography.sizes.md * 1.45,
    marginBottom: spacing.lg,
    paddingHorizontal: 2,
  },
  patternCard: {
    paddingVertical: spacing.sm,
    marginBottom: spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors.contourLineFaint,
  },
  patternMonthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingRight: spacing.xs,
  },
  patternMonthLabel: {
    fontSize: typography.sizes.md,
    color: text.secondary,
    marginRight: spacing.sm,
  },
  patternMonthValue: {
    flex: 1,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
    color: colors.textPrimary,
  },
  patternMonthChevron: {
    fontSize: typography.sizes.sm,
    color: text.muted,
  },
  patternMonthChevronUp: {
    transform: [{ rotate: '180deg' }],
  },
  patternMonthDropdown: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingVertical: spacing.xs,
  },
  patternMonthOption: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  patternMonthOptionActive: {
    backgroundColor: colors.buttonPrimaryLight12,
  },
  patternMonthOptionText: {
    fontSize: typography.sizes.md,
    color: colors.textPrimary,
  },
  patternMonthOptionTextActive: {
    color: colors.buttonPrimary,
    fontWeight: typography.weights.medium,
  },
  patternGenerateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  patternGenerateButton: {
    marginTop: spacing.sm,
    alignSelf: 'stretch',
  },
  patternGenerateLabel: {
    fontSize: typography.sizes.md,
    color: colors.buttonPrimary,
    fontWeight: typography.weights.medium,
  },
  patternArchiveSection: {
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
  },
  patternArchiveTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  patternArchiveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    paddingHorizontal: 0,
  },
  patternArchiveRowActive: {
    paddingHorizontal: spacing.sm,
    marginHorizontal: -spacing.sm,
    borderRadius: 8,
    backgroundColor: colors.buttonPrimaryLight12,
  },
  patternArchiveRowLeft: {
    flex: 1,
    minWidth: 0,
  },
  patternArchiveRowLabel: {
    fontSize: typography.sizes.md,
    color: colors.textPrimary,
  },
  patternArchiveRowGenerated: {
    fontSize: typography.sizes.xs,
    color: text.muted,
    marginTop: 2,
  },
  patternArchiveRowHint: {
    fontSize: typography.sizes.sm,
    color: text.muted,
  },
  patternReportWrap: {
    marginTop: spacing.md,
  },
  patternReportCard: {
    paddingVertical: spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors.contourLineFaint,
  },
  patternReportHeader: {
    marginBottom: spacing.md,
  },
  patternReportHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  patternReportMonth: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: text.secondary,
  },
  patternCloseLink: {
    fontSize: typography.sizes.xs,
    color: text.muted,
    fontWeight: typography.weights.medium,
  },
  patternReportBasedOn: {
    fontSize: typography.sizes.xs,
    color: text.muted,
    marginTop: spacing.xs,
  },
  patternReportBlock: {
    marginBottom: spacing.lg,
  },
  patternReportBlockTitle: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    color: text.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: spacing.xs,
  },
  patternReportBlockBody: {
    fontSize: typography.sizes.md,
    color: colors.textPrimary,
    lineHeight: typography.sizes.md * typography.lineHeights.relaxed,
  },
  overviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  overviewRowLast: {
    borderBottomWidth: 0,
  },
  overviewRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  overviewLabel: {
    flex: 1,
    fontSize: typography.sizes.md,
    color: colors.textPrimary,
  },
  overviewValue: {
    fontSize: typography.sizes.md,
    color: text.secondary,
    fontWeight: typography.weights.medium,
  },
  patternEmptyCard: {
    marginTop: spacing.md,
    paddingVertical: spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors.contourLineFaint,
  },
  patternEmptyTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  patternEmptyBody: {
    fontSize: typography.sizes.sm,
    color: text.muted,
    lineHeight: typography.sizes.sm * typography.lineHeights.relaxed,
  },
  patternLoadingState: {
    marginTop: spacing.md,
  },
  body: {
    fontSize: typography.sizes.sm,
    color: text.secondary,
    lineHeight: 22,
    marginBottom: spacing.md,
  },
  empty: {
    fontSize: typography.sizes.sm,
    color: text.secondary,
    fontStyle: 'italic',
  },
  muted: {
    fontSize: typography.sizes.sm,
    color: text.muted,
    marginTop: spacing.sm,
  },
  sectionFraming: {
    fontSize: typography.sizes.md,
    color: text.secondary,
    fontStyle: 'italic',
    marginBottom: spacing.lg,
    lineHeight: typography.sizes.md * typography.lineHeights.relaxed,
  },
  subSectionLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
    color: text.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  mutedNote: {
    fontSize: typography.sizes.sm,
    color: text.muted,
    fontStyle: 'italic',
    marginBottom: spacing.lg,
  },
  symbolLandscapeNameMuted: {
    color: text.muted,
  },
  archetypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    marginBottom: spacing.xs,
  },
  archetypeName: {
    fontSize: typography.sizes.md,
    color: colors.textPrimary,
  },
  archetypeCount: {
    fontSize: typography.sizes.sm,
    color: text.muted,
  },
  foundationalNote: {
    fontSize: typography.sizes.sm,
    color: text.secondary,
    lineHeight: typography.sizes.sm * typography.lineHeights.relaxed,
  },
  archetypeOverview: {
    marginBottom: spacing.md,
    paddingVertical: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors.contourLineFaint,
  },
  archetypeOverviewLead: {
    fontSize: typography.sizes.sm,
    color: colors.textPrimary,
    fontWeight: typography.weights.medium,
    lineHeight: typography.sizes.sm * typography.lineHeights.relaxed,
    marginBottom: spacing.xs,
  },
  archetypeOverviewLine: {
    fontSize: typography.sizes.sm,
    color: text.secondary,
    lineHeight: typography.sizes.sm * typography.lineHeights.relaxed,
    marginTop: spacing.xs / 2,
  },
  archetypeCategoryBlock: {
    marginTop: spacing.xl,
    paddingTop: spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  archetypeCategoryBlockFirst: {
    marginTop: 0,
    paddingTop: 0,
    borderTopWidth: 0,
  },
  archetypeCategoryLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
    color: text.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: spacing.sm,
  },
  archetypeCategoryNote: {
    fontSize: typography.sizes.sm,
    color: text.muted,
    lineHeight: typography.sizes.sm * typography.lineHeights.relaxed,
    marginBottom: spacing.md,
  },
});

export const InsightsSectionScreen = React.memo(InsightsSectionScreenInner);
export default InsightsSectionScreen;
