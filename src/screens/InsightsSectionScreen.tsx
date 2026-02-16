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
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';
import { colors, spacing, typography, text, borderRadius, backgrounds } from '../theme';
import { WaveBackground, BreathingLine, Card } from '../components/ui';
import type { InsightsSectionId, InsightsPeriod } from '../types/insights';
import {
  getRecurringSymbols,
  getRecurringArchetypes,
  getRecurringLandscapes,
  getCollectiveInsights,
  getSymbolClusters,
  symbolHasAssociations,
  getAssociationsForSymbol,
} from '../services/insightsService';
import {
  generateMonthlyInsights,
  getPatternInsightEntries,
  getMonthPeriod,
  getLast12MonthKeys,
  formatMonthKeyLabel,
} from '../services/patternInsightsService';
import { LocalStorage } from '../services/localStorage';
import {
  remoteGetPatternReports,
  remoteSavePatternReport,
  remoteDeletePatternReport,
} from '../services/remoteStorage';
import { UserService } from '../services/userService';
import { toSafeSymbolLabel } from '../constants/safeLabels';

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

export const InsightsSectionScreen: React.FC<InsightsSectionScreenProps> = (props) => {
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
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
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
  const patternReportOpacity = useRef(new Animated.Value(0)).current;
  const patternSkeletonShimmer = useRef(new Animated.Value(0)).current;

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
      if (__DEV__ && sectionId === 'space-landscapes') {
        console.log('[InsightsSection] Focus — loading space-landscapes, sectionId:', sectionId);
      }
      load();
    }, [load])
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
      <View style={styles.container}>
        <WaveBackground />
        <View style={styles.centered}>
          <BreathingLine width={120} height={2} color={colors.accent} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <WaveBackground />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Recurring symbols: list with count (x N), tap → Journal filtered by symbol */}
        {sectionId === 'recurring-symbols' && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Recurring symbols</Text>
            {symbols.length === 0 ? (
              <Text style={styles.empty}>No symbols yet. Get interpretations to see patterns.</Text>
            ) : (
              symbols.map((s) => (
                <TouchableOpacity
                  key={s.normalizedKey}
                  style={styles.symbolLandscapeRow}
                  onPress={() => navigation.navigate('JournalFilter', { filterSymbol: s.name })}
                  activeOpacity={0.7}
                >
                  <Text style={styles.symbolLandscapeName} numberOfLines={1}>
                    {toSafeSymbolLabel(s.name, s.normalizedKey, showExplicitTerms)}
                  </Text>
                  <Text style={styles.symbolLandscapeCount}>×{s.count}</Text>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}

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
                        <Text style={styles.themeHint}>came up repeatedly</Text>
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
                        trackColor={{ false: colors.border, true: colors.accentLight }}
                        thumbColor={colors.accent}
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

        {/* Recurring landscapes: list with count (x N), tap → Journal filtered by landscape */}
        {sectionId === 'space-landscapes' && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Recurring landscapes</Text>
            {landscapes.length === 0 ? (
              <Text style={styles.empty}>No landscapes yet. Get interpretations to see recurring settings and places.</Text>
            ) : (
              landscapes.map((l) => (
                <TouchableOpacity
                  key={l.normalizedKey}
                  style={styles.symbolLandscapeRow}
                  onPress={() => navigation.navigate('JournalFilter', { filterLandscape: l.name })}
                  activeOpacity={0.7}
                >
                  <Text style={styles.symbolLandscapeName} numberOfLines={1}>{l.name}</Text>
                  <Text style={styles.symbolLandscapeCount}>×{l.count}</Text>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}

        {sectionId === 'recurring-archetypes' && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Archetypal distribution (last 30 days)</Text>
            {archetypes.length === 0 ? (
              <Text style={styles.empty}>No archetypes yet. Get interpretations to see distribution.</Text>
            ) : (
              <>
                {(() => {
                  const maxCount = Math.max(1, ...archetypes.map((a) => a.count));
                  return archetypes.map((a) => (
                    <View key={a.name} style={styles.barRow}>
                      <Text style={styles.barLabel}>{a.name}</Text>
                      <View style={styles.barTrack}>
                        <View
                          style={[
                            styles.barFill,
                            { width: `${Math.max(8, (a.count / maxCount) * 100)}%` },
                          ]}
                        />
                      </View>
                    </View>
                  ));
                })()}
                {archetypes[0] && (
                  <Text style={styles.observedLine}>
                    Archetypes tend to rotate over time. This period shows increased {archetypes[0].name} activity.
                  </Text>
                )}
              </>
            )}
          </View>
        )}

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
                onPress={() => setPatternMonthPickerOpen((o) => !o)}
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
                style={styles.patternGenerateRow}
                onPress={async () => {
                  if (patternInsightGenerating) return;
                  const periodFilter = getMonthPeriod(patternSelectedMonthKey);
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
                    const result = await generateMonthlyInsights('monthly', periodFilter);
                    const userId = await UserService.getCurrentUserId();
                    if (userId) await remoteSavePatternReport(patternSelectedMonthKey, result);
                    await LocalStorage.savePatternReport(patternSelectedMonthKey, result);
                    const reports = userId
                      ? (await remoteGetPatternReports() ?? await LocalStorage.getPatternReports())
                      : await LocalStorage.getPatternReports();
                    setPatternReportsArchive(reports);
                    setPatternReportMeta({
                      monthKey: patternSelectedMonthKey,
                      dreamCount: entries.length,
                      startDate,
                      endDate,
                    });
                    setPatternViewingMonthKey(patternSelectedMonthKey);
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
                  <Text style={styles.patternGenerateArrow}>→</Text>
                )}
              </TouchableOpacity>
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
                          {formatMonthKeyLabel(patternViewingMonthKey)}
                        </Text>
                        <TouchableOpacity
                          onPress={() => {
                          Alert.alert(
                            'Remove reflection',
                            `Remove the reflection for ${formatMonthKeyLabel(patternViewingMonthKey)}?`,
                            [
                              { text: 'Cancel', style: 'cancel' },
                              {
                                text: 'Remove',
                                style: 'destructive',
                                onPress: async () => {
                                  const userId = await UserService.getCurrentUserId();
                                  if (userId) await remoteDeletePatternReport(patternViewingMonthKey);
                                  await LocalStorage.deletePatternReport(patternViewingMonthKey);
                                  const reports = userId
                                    ? (await remoteGetPatternReports() ?? await LocalStorage.getPatternReports())
                                    : await LocalStorage.getPatternReports();
                                  setPatternReportsArchive(reports);
                                  setPatternViewingMonthKey(
                                    Object.keys(reports).length > 0
                                      ? Object.keys(reports).sort().reverse()[0]
                                      : null
                                  );
                                },
                              },
                            ]
                          );
                        }}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <Text style={styles.patternRemoveLink}>Remove</Text>
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
                  .map((monthKey) => (
                    <TouchableOpacity
                      key={monthKey}
                      style={[
                        styles.patternArchiveRow,
                        patternViewingMonthKey === monthKey && styles.patternArchiveRowActive,
                      ]}
                      onPress={() => setPatternViewingMonthKey(monthKey)}
                      activeOpacity={0.8}
                    >
                      <View style={styles.patternArchiveRowLeft}>
                        <Text style={styles.patternArchiveRowLabel} numberOfLines={1}>
                          {formatMonthKeyLabel(monthKey)}
                        </Text>
                        {patternReportsArchive[monthKey]?.generatedAt && (
                          <Text style={styles.patternArchiveRowGenerated} numberOfLines={1}>
                            Generated {formatPatternDate(patternReportsArchive[monthKey].generatedAt.slice(0, 10))}
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
    color: colors.accent,
  },
  viewAssociationsCta: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  viewAssociationsLabel: {
    fontSize: typography.sizes.xs,
    color: colors.accent,
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
    borderLeftColor: colors.accent,
  },
  singleSymbolAssociationsTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  singleSymbolClusterName: {
    fontSize: typography.sizes.sm,
    color: colors.accent,
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
    backgroundColor: colors.accent,
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
    backgroundColor: colors.accent + '14',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.accent + '30',
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
    color: colors.accent,
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
    backgroundColor: colors.accent + '14',
  },
  patternMonthOptionText: {
    fontSize: typography.sizes.md,
    color: colors.textPrimary,
  },
  patternMonthOptionTextActive: {
    color: colors.accent,
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
  patternGenerateLabel: {
    fontSize: typography.sizes.md,
    color: colors.accent,
    fontWeight: typography.weights.medium,
  },
  patternGenerateArrow: {
    fontSize: typography.sizes.lg,
    color: colors.accent,
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
    backgroundColor: colors.accent + '12',
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
  patternRemoveLink: {
    fontSize: typography.sizes.sm,
    color: text.muted,
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
});

export default InsightsSectionScreen;
