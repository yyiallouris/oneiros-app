import React, { useState, useCallback, useEffect, useRef } from 'react';
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
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';
import { colors, spacing, typography, text, borderRadius, backgrounds } from '../theme';
import { MountainWaveBackground, BreathingLine, Card, SectionTitleWithInfo, SymbolInfoModal } from '../components/ui';
import {
  ArchetypesIcon,
  MotifsIcon,
  PlacesIcon,
  SymbolsIcon,
} from '../components/icons/InsightsIcons';

const SECTION_ICON_SIZE = 88;
const SectionSymbolsIcon = () => (
  <SymbolsIcon size={SECTION_ICON_SIZE} />
);
const SectionMotifsIcon = () => (
  <MotifsIcon size={SECTION_ICON_SIZE} />
);
const SectionArchetypesIcon = () => (
  <ArchetypesIcon size={SECTION_ICON_SIZE} />
);
const SectionPlacesIcon = () => (
  <PlacesIcon size={SECTION_ICON_SIZE} />
);
import type { InsightsSectionId, InsightsPeriod, MotifCount } from '../types/insights';
import {
  getRecurringSymbols,
  getRecurringArchetypes,
  getRecurringLandscapes,
  getRecurringMotifs,
  getCollectiveInsights,
  getSymbolClusters,
  symbolHasAssociations,
  getAssociationsForSymbol,
} from '../services/insightsService';
import {
  generateMonthlyInsights,
  getPatternInsightEntries,
  getMonthPeriod,
  getWeekPeriod,
  getLast12MonthKeys,
  formatMonthKeyLabel,
  formatReportKeyLabel,
  formatReportKeyLabelForEssay,
  getReportKeyForGeneration,
  getCurrentMonthKey,
  isFirstWeekOfMonthFinished,
  getWeekNumOfMonth,
} from '../services/patternInsightsService';
import { LocalStorage } from '../services/localStorage';
import {
  remoteGetPatternReports,
  remoteSavePatternReport,
} from '../services/remoteStorage';
import { UserService } from '../services/userService';
import { toSafeSymbolLabel } from '../constants/safeLabels';
import {
  PATTERN_INSIGHT_LANGUAGES,
  DEFAULT_PATTERN_INSIGHT_LANGUAGE,
  PATTERN_INSIGHT_LANGUAGE_KEY,
} from '../constants/patternInsightLanguages';
import { getInterpretationDepth, type InterpretationDepth } from '../services/userSettingsService';
import { getArchetypeInfoKey, type InfoModalKey } from '../constants/symbolArchetypeInfo';
import { isOnline } from '../utils/network';

type Route = RouteProp<RootStackParamList, 'InsightsSection'>;
type NavProp = StackNavigationProp<RootStackParamList, 'InsightsSection'>;

const TOP_THEMES_LIMIT = 5;

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
  const { embedded, overrideSectionId, overridePeriod } = props;
  const route = useRoute<Route>();
  const navigation = useNavigation<NavProp>();
  const sectionId = (embedded && overrideSectionId != null) ? overrideSectionId : (route.params?.sectionId ?? 'recurring-symbols');
  const period: InsightsPeriod | undefined = (embedded && overridePeriod != null)
    ? overridePeriod
    : (route.params?.periodStart != null && route.params?.periodEnd != null
        ? { startDate: route.params.periodStart, endDate: route.params.periodEnd }
        : undefined);
  const [loading, setLoading] = useState(true);
  const [symbols, setSymbols] = useState<{ name: string; normalizedKey: string; count: number }[]>([]);
  const [archetypes, setArchetypes] = useState<{ name: string; count: number }[]>([]);
  const [landscapes, setLandscapes] = useState<{ name: string; normalizedKey: string; count: number }[]>([]);
  const [motifs, setMotifs] = useState<MotifCount[]>([]);
  const [collective, setCollective] = useState<{
    topSymbolsThisMonth: { symbol: string; count: number }[];
    archetypeTrends: { archetype: string; direction: string }[];
  }>({ topSymbolsThisMonth: [], archetypeTrends: [] });
  const [showExplicitTerms, setShowExplicitTerms] = useState(false);
  const [lessFrequentExpanded, setLessFrequentExpanded] = useState(false);
  const [allSymbolsExpanded, setAllSymbolsExpanded] = useState(false);
  const [clustersExpanded, setClustersExpanded] = useState(false);
  /** When set, show associations only for this symbol (Explore symbol data). */
  const [selectedSymbolForAssociations, setSelectedSymbolForAssociations] = useState<string | null>(null);
  /** Pattern recognition: archive (monthKey -> { generatedAt, text }), selected month for generate, viewing which report */
  const [patternReportsArchive, setPatternReportsArchive] = useState<Record<string, { generatedAt: string; text: string }>>({});
  const [patternSelectedMonthKey, setPatternSelectedMonthKey] = useState<string>(() => {
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
  /** First-time intro for pattern section (dismissible once). */
  const [patternIntroDismissed, setPatternIntroDismissed] = useState(true);
  const [patternLanguage, setPatternLanguage] = useState(DEFAULT_PATTERN_INSIGHT_LANGUAGE);
  const [patternLanguagePickerOpen, setPatternLanguagePickerOpen] = useState(false);
  const [archetypeModalKey, setArchetypeModalKey] = useState<InfoModalKey | null>(null);
  const patternReportOpacity = useRef(new Animated.Value(0)).current;
  const patternSkeletonShimmer = useRef(new Animated.Value(0)).current;
  const [interpretationDepth, setInterpretationDepth] = useState<InterpretationDepth>('standard');

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
        const storedLang = await AsyncStorage.getItem(PATTERN_INSIGHT_LANGUAGE_KEY);
        if (storedLang) setPatternLanguage(storedLang);
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
        const introSeen = await AsyncStorage.getItem('@pattern_recognition_intro_seen');
        setPatternIntroDismissed(introSeen === 'true');
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

  // Pattern skeleton: shimmer while generating
  useEffect(() => {
    if (!patternInsightGenerating) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(patternSkeletonShimmer, {
          toValue: 1,
          duration: 1800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(patternSkeletonShimmer, {
          toValue: 0,
          duration: 1800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [patternInsightGenerating]);

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
        {!embedded && <MountainWaveBackground height={260} lite />}
        <View style={styles.centered}>
          <BreathingLine width={120} height={2} color={colors.buttonPrimary} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, embedded && styles.containerTransparent]}>
      {!embedded && <MountainWaveBackground height={260} lite />}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Recurring symbols: split into recurring (count ≥ 2) and visited once */}
        {sectionId === 'recurring-symbols' && (() => {
          const recurring = symbols.filter((s) => s.count >= 2);
          const visitedOnce = symbols.filter((s) => s.count < 2);
          return (
            <View style={styles.section}>
              <View style={styles.sectionIcon}>
                <SectionSymbolsIcon />
              </View>
              {symbols.length === 0 ? (
                <Text style={styles.empty}>No symbols yet. Get dream interpretations to see recurring symbols.</Text>
              ) : (
                <>
                  {recurring.length > 0 ? (
                    <>
                      <Text style={styles.sectionFraming}>Some images seem to insist on returning</Text>
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
                    <Text style={styles.mutedNote}>No recurring symbols this period.</Text>
                  )}
                  {visitedOnce.length > 0 && (
                    <>
                      <Text style={styles.subSectionLabel}>Other symbols</Text>
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
                    </>
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

        {/* Symbolic Motifs: recurring structural/spatial patterns */}
        {sectionId === 'symbolic-motifs' && (() => {
          const recurringMotifs = motifs.filter((m) => m.count >= 2);
          const seenOnce = motifs.filter((m) => m.count < 2);
          return (
            <View style={styles.section}>
              <View style={styles.sectionIcon}>
                <SectionMotifsIcon />
              </View>
              {motifs.length === 0 ? (
                <Text style={styles.empty}>No motifs yet. Get dream interpretations to see recurring structural patterns.</Text>
              ) : (
                <>
                  {recurringMotifs.length > 0 ? (
                    <>
                      <Text style={styles.sectionFraming}>Patterns that keep shaping the dream space</Text>
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
                    <Text style={styles.mutedNote}>No recurring motifs this period.</Text>
                  )}
                  {seenOnce.length > 0 && (
                    <>
                      <Text style={styles.subSectionLabel}>Other motifs</Text>
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
                    </>
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
                <SectionPlacesIcon />
              </View>
              {landscapes.length === 0 ? (
                <Text style={styles.empty}>No places yet. Get dream interpretations to see recurring settings and places.</Text>
              ) : (
                <>
                  {recurringPlaces.length > 0 ? (
                    <>
                      <Text style={styles.sectionFraming}>Places you often return to</Text>
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
                    <Text style={styles.mutedNote}>No recurring places this period.</Text>
                  )}
                  {visitedOnce.length > 0 && (
                    <>
                      <Text style={styles.subSectionLabel}>Other places you've visited</Text>
                      {visitedOnce.map((l) => (
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
                  )}
                </>
              )}
            </View>
          );
        })()}

        {sectionId === 'recurring-archetypes' && (() => {
          // Post-Jungian distinction: core architecture (structural) vs archetypal states (dynamic)
          const CORE_ARCHETYPES = ['self', 'ego', 'shadow', 'persona', 'anima', 'animus'];
          const coreList = archetypes.filter((a) => CORE_ARCHETYPES.includes(a.name.toLowerCase()));
          const dynamicList = archetypes.filter((a) => !CORE_ARCHETYPES.includes(a.name.toLowerCase()));
          return (
            <View style={[styles.section, styles.sectionNoTopPadding]}>
              <View style={styles.sectionIcon}>
                <SectionArchetypesIcon />
              </View>
              {archetypes.length === 0 ? (
                <Text style={styles.empty}>No archetypes yet. Get dream interpretations to see recurring archetypes.</Text>
              ) : (
                <>
                  {/* Core architecture — the skeleton, always present */}
                  {coreList.length > 0 && (
                    <View style={[styles.archetypeCategoryBlock, styles.archetypeCategoryBlockFirst]}>
                      <SectionTitleWithInfo title="Core architecture" infoKey="core-architecture" variant="archetype" showInfo />
                      <Text style={styles.archetypeCategoryNote}>
                        The skeleton of the psyche. These are not roles — they are always present. They organise how you relate to yourself and the world; they don't come and go.
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

                  {/* Archetypal states / Dynamic patterns — what's running now */}
                  {dynamicList.length > 0 && (
                    <View style={styles.archetypeCategoryBlock}>
                      <SectionTitleWithInfo title="Archetypal states / Dynamic patterns" infoKey="archetypal-states" variant="archetype" showInfo />
                      <Text style={styles.archetypeCategoryNote}>
                        What's running now. Phases or currents — they move through you; they don't define you. Making them identity is where the trouble starts.
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
            {!patternIntroDismissed && (
              <View style={styles.patternIntroCard}>
                <Text style={styles.patternIntroCardBody}>
                  Reflections are based on your dream interpretations (moods, motifs, relationships). They are hypothetical and not advice — use them as orientation.
                </Text>
                <TouchableOpacity
                  style={styles.patternIntroCardButton}
                  onPress={() => {
                    AsyncStorage.setItem('@pattern_recognition_intro_seen', 'true');
                    setPatternIntroDismissed(true);
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.patternIntroCardButtonText}>Got it</Text>
                </TouchableOpacity>
              </View>
            )}
            <Text style={styles.patternIntro}>
              A reflective essay on emerging themes across your dreams for a chosen month.
            </Text>

            <View style={styles.patternCard}>
              <TouchableOpacity
                style={styles.patternMonthRow}
                onPress={() => {
                  setPatternLanguagePickerOpen(false);
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

              <TouchableOpacity
                style={[
                  styles.patternGenerateRow,
                  (patternInsightGenerating ||
                    !!patternReportsArchive[getReportKeyForGeneration(patternSelectedMonthKey)] ||
                    (patternSelectedMonthKey === `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}` &&
                      !isFirstWeekOfMonthFinished(patternSelectedMonthKey))
                  ) && styles.patternGenerateRowDisabled,
                ]}
                onPress={async () => {
                  if (patternInsightGenerating) return;
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
                  const effectiveReportKey = getReportKeyForGeneration(patternSelectedMonthKey);

                  if (isCurrentMonth && !isFirstWeekOfMonthFinished(patternSelectedMonthKey)) {
                    Alert.alert(
                      'First week required',
                      'You can generate a reflection for the current month once the first week is finished. Please wait until at least day 8 of the month.',
                      [{ text: 'OK' }]
                    );
                    return;
                  }
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
                    ? getWeekPeriod(patternSelectedMonthKey, getWeekNumOfMonth(now.getDate()))
                    : getMonthPeriod(patternSelectedMonthKey);
                  const entries = await getPatternInsightEntries(periodFilter);
                  if (entries.length === 0) {
                    setPatternEmptyForMonthKey(patternSelectedMonthKey);
                    setPatternReportMeta(null);
                    setPatternViewingMonthKey(null);
                    return;
                  }
                  setPatternEmptyForMonthKey(null);
                  setPatternInsightGenerating(true);
                  try {
                    const startDate = entries[entries.length - 1].date;
                    const endDate = entries[0].date;
                    const result = await generateMonthlyInsights('monthly', periodFilter, patternLanguage);
                    const userId = await UserService.getCurrentUserId();
                    if (userId) await remoteSavePatternReport(effectiveReportKey, result);
                    await LocalStorage.savePatternReport(effectiveReportKey, result);
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
                    const msg = e?.message || 'Something went wrong. Please try again.';
                    Alert.alert('Error', msg);
                  } finally {
                    setPatternInsightGenerating(false);
                  }
                }}
                disabled={patternInsightGenerating}
                activeOpacity={0.8}
              >
                <Text style={styles.patternGenerateLabel}>
                  {patternInsightGenerating ? 'Generating…' : 'Generate reflection'}
                </Text>
                {!patternInsightGenerating && (
                  <TouchableOpacity
                    style={styles.patternLanguageChip}
                    onPress={() => {
                      setPatternMonthPickerOpen(false);
                      setPatternLanguagePickerOpen((o) => !o);
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.patternLanguageChipText}>
                      {PATTERN_INSIGHT_LANGUAGES.find((l) => l.code === patternLanguage)?.display ?? 'EN'}
                    </Text>
                    <Text style={[styles.patternMonthChevron, patternLanguagePickerOpen && styles.patternMonthChevronUp]}>
                      ▾
                    </Text>
                  </TouchableOpacity>
                )}
              </TouchableOpacity>

              {patternLanguagePickerOpen && (
                <ScrollView style={styles.patternLanguageDropdown} nestedScrollEnabled>
                  {PATTERN_INSIGHT_LANGUAGES.map((lang) => (
                    <TouchableOpacity
                      key={lang.code}
                      style={[
                        styles.patternMonthOption,
                        patternLanguage === lang.code && styles.patternMonthOptionActive,
                      ]}
                      onPress={async () => {
                        setPatternLanguage(lang.code);
                        setPatternLanguagePickerOpen(false);
                        await AsyncStorage.setItem(PATTERN_INSIGHT_LANGUAGE_KEY, lang.code);
                      }}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.patternMonthOptionText,
                          patternLanguage === lang.code && styles.patternMonthOptionTextActive,
                        ]}
                      >
                        {lang.name} ({lang.display})
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>

            {patternEmptyForMonthKey === patternSelectedMonthKey && !patternInsightGenerating && (
              <View style={styles.patternEmptyCard}>
                <Text style={styles.patternEmptyTitle}>No interpreted dreams in this period</Text>
                <Text style={styles.patternEmptyBody}>
                  Interpret 2–3 dreams this month to unlock a reflection on patterns.
                </Text>
              </View>
            )}

            {patternInsightGenerating && (
              <View style={styles.patternSkeleton}>
                {[1, 2, 3].map((i) => (
                  <View key={i} style={styles.patternSkeletonBlock}>
                    <Animated.View
                      style={[
                        styles.patternSkeletonLine,
                        styles.patternSkeletonTitle,
                        {
                          opacity: patternSkeletonShimmer.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.28, 0.5],
                          }),
                          backgroundColor: colors.wave1,
                        },
                      ]}
                    />
                    <Animated.View
                      style={[
                        styles.patternSkeletonLine,
                        {
                          backgroundColor: colors.wave2,
                          opacity: patternSkeletonShimmer.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.25, 0.45],
                          }),
                        },
                      ]}
                    />
                    <Animated.View
                      style={[
                        styles.patternSkeletonLine,
                        styles.patternSkeletonLineShort,
                        {
                          backgroundColor: colors.wave2,
                          opacity: patternSkeletonShimmer.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.2, 0.4],
                          }),
                        },
                      ]}
                    />
                  </View>
                ))}
              </View>
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
          <Card style={styles.card}>
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
                    <Text style={styles.sectionLabel}>Archetype trends</Text>
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
          </Card>
        )}
      </ScrollView>

      {archetypeModalKey && (
        <SymbolInfoModal
          visible={!!archetypeModalKey}
          onClose={() => setArchetypeModalKey(null)}
          contentKey={archetypeModalKey}
        />
      )}
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
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: 'rgba(237, 230, 223, 0.5)',
    borderRadius: 8,
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
    padding: spacing.md,
    backgroundColor: 'rgba(237, 230, 223, 0.5)',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: colors.buttonPrimary,
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
    backgroundColor: 'rgba(237, 230, 223, 0.8)',
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
  card: { marginBottom: spacing.lg },
  patternIntroCard: {
    marginBottom: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.buttonPrimaryLight12,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.buttonPrimary40,
  },
  patternIntroCardBody: {
    fontSize: typography.sizes.sm,
    color: colors.textPrimary,
    lineHeight: typography.sizes.sm * typography.lineHeights.relaxed,
    marginBottom: spacing.md,
  },
  patternIntroCardButton: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  patternIntroCardButtonText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.buttonPrimary,
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
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
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
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  patternGenerateRowDisabled: {
    opacity: 0.45,
  },
  patternGenerateLabel: {
    fontSize: typography.sizes.md,
    color: colors.buttonPrimary,
    fontWeight: typography.weights.medium,
  },
  patternLanguageChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.buttonPrimaryLight12,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.buttonPrimary40,
  },
  patternLanguageChipText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.buttonPrimary,
    marginRight: spacing.xs,
  },
  patternLanguageDropdown: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingVertical: spacing.xs,
    maxHeight: 220,
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
    backgroundColor: backgrounds.cardTransparent,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
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
    padding: spacing.lg,
    backgroundColor: backgrounds.cardTransparent,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
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
  patternSkeleton: {
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  patternSkeletonBlock: {
    marginBottom: spacing.xl,
  },
  patternSkeletonLine: {
    height: 14,
    borderRadius: 2,
    marginBottom: spacing.sm,
    width: '100%',
  },
  patternSkeletonTitle: {
    width: '45%',
    height: 12,
    marginBottom: spacing.md,
  },
  patternSkeletonLineShort: {
    width: '88%',
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
