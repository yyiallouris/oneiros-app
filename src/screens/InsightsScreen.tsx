import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Easing,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';
import { borderRadius, colors, spacing, typography, text } from '../theme';
import { PsycheScreenBackground, MysticHeader, BreathingLine, Card } from '../components/ui';
import {
  DreamsLoggedIcon,
  MotifsIcon,
  PatternRecognitionIcon,
} from '../components/icons/InsightsIcons';
import {
  getRecurringSymbols,
  getRecurringArchetypes,
  getRecurringLandscapes,
  getDreamsCountForPeriod,
  getPeriodThisMonth,
  getPeriodLastMonth,
  getPeriodLastNMonths,
  getPeriodAllTime,
  getPeriodLabel,
} from '../services/insightsService';
import type {
  InsightsSectionId,
  InsightsPeriod,
  SymbolCount,
  ArchetypeCount,
  LandscapeCount,
} from '../types/insights';

type NavigationProp = StackNavigationProp<RootStackParamList>;

const ICON_RENDER_SIZE = 60;
const ICON_SIZE = ICON_RENDER_SIZE + 2;


type PeriodPreset = 'this_month' | 'last_month' | 'last_3_months' | 'last_6_months' | 'all_time';

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

const InsightsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [periodPreset, setPeriodPreset] = useState<PeriodPreset>('this_month');
  const [periodExpanded, setPeriodExpanded] = useState(false);
  const dropdownOpacity = useRef(new Animated.Value(0)).current;
  const [currentPeriod, setCurrentPeriod] = useState<InsightsPeriod>(() => getPeriodThisMonth());

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
  const [dreamsCount, setDreamsCount] = useState(0);
  const [symbols, setSymbols] = useState<SymbolCount[]>([]);
  const [archetypes, setArchetypes] = useState<ArchetypeCount[]>([]);
  const [landscapes, setLandscapes] = useState<LandscapeCount[]>([]);
  const [loading, setLoading] = useState(true);

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
        if (!mounted) return;
        setCurrentPeriod(p);
        const [dreamCount, s, a, l] = await Promise.all([
          getDreamsCountForPeriod(p),
          getRecurringSymbols(p),
          getRecurringArchetypes(p),
          getRecurringLandscapes(p),
        ]);
        if (!mounted) return;
        setDreamsCount(dreamCount);
        setSymbols(s);
        setArchetypes(a);
        setLandscapes(l);
      })().finally(() => {
        if (mounted) setLoading(false);
      });
      return () => { mounted = false; };
    }, [periodPreset])
  );

  /** Linked sections open the swipeable journey; pattern recognition stays standalone. */
  const LINKED_SECTION_IDS: InsightsSectionId[] = [
    'recurring-symbols',
    'symbolic-motifs',
    'recurring-archetypes',
    'space-landscapes',
  ];

  const goToSection = (sectionId: InsightsSectionId) => {
    if (LINKED_SECTION_IDS.includes(sectionId)) {
      navigation.navigate('InsightsJourney', {
        initialSectionId: sectionId,
        periodStart: currentPeriod.startDate,
        periodEnd: currentPeriod.endDate,
        periodLabel,
      });
    } else {
      navigation.navigate('InsightsSection', {
        sectionId,
        periodStart: currentPeriod.startDate,
        periodEnd: currentPeriod.endDate,
        periodLabel,
      });
    }
  };

  // Legacy: standalone Psychic journey entry (commented out for now — sections are linked via tap on Symbols/Archetypes/Space/Pattern)
  // const goToJourney = () => {
  //   navigation.navigate('InsightsJourney', {
  //     periodStart: currentPeriod.startDate,
  //     periodEnd: currentPeriod.endDate,
  //     periodLabel,
  //   });
  // };

  const goToCalendar = () => {
    navigation.navigate('Calendar', { initialDate: currentPeriod.startDate });
  };

  const goToSymbolicElements = () => {
    navigation.navigate('InsightsJourney', {
      initialSectionId: 'recurring-symbols',
      periodStart: currentPeriod.startDate,
      periodEnd: currentPeriod.endDate,
      periodLabel,
    });
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
    }).start(({ finished }) => {
      clearTimeout(fallback);
      closeDropdown();
    });
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <PsycheScreenBackground waveHeight={150} />
        <MysticHeader title="Insights" subtitle="Patterns rising into view." />
        <View style={styles.loadingPlaceholder}>
          <BreathingLine width={100} height={2} color={colors.textMuted} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <PsycheScreenBackground waveHeight={180} />
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
          <Text style={styles.overviewTitle}>Dream Activity Overview</Text>

          {/* Legacy: Psychic journey as separate button — sections are now linked (swipe) when tapping Symbols / Archetypes / Space / Pattern
          <TouchableOpacity style={[styles.overviewRow, styles.journeyRow]} onPress={goToJourney} activeOpacity={0.7}>
            <View style={styles.overviewIconWrap}>
              <PatternRecognitionIcon size={ICON_RENDER_SIZE} />
            </View>
            <Text style={styles.journeyLabel}>Psychic journey</Text>
            <Text style={styles.overviewValue}>Swipe →</Text>
          </TouchableOpacity>
          */}

          <TouchableOpacity style={styles.overviewSection} onPress={goToCalendar} activeOpacity={0.7}>
            <View style={styles.overviewIconWrap}>
              <DreamsLoggedIcon size={ICON_RENDER_SIZE - 14} color={colors.textAccent} />
            </View>
            <View style={styles.overviewContent}>
              <Text style={styles.overviewLabel}>Dreams logged</Text>
              <Text style={styles.overviewMeta}>
                {dreamsCount} dream{dreamsCount === 1 ? '' : 's'} in this period
              </Text>
            </View>
            <Text style={styles.overviewChevron}>›</Text>
          </TouchableOpacity>
          <View style={styles.overviewDivider} />

          <TouchableOpacity style={styles.overviewSection} onPress={goToSymbolicElements} activeOpacity={0.7}>
            <View style={styles.overviewIconWrap}>
              <MotifsIcon size={ICON_RENDER_SIZE} color={colors.textAccent} />
            </View>
            <View style={styles.overviewContent}>
              <Text style={styles.overviewLabel}>Symbolic Elements</Text>
              <Text style={styles.overviewMeta}>Symbols, motifs, archetypes, places</Text>
            </View>
            <Text style={styles.overviewChevron}>›</Text>
          </TouchableOpacity>
          <View style={styles.overviewDivider} />

          <TouchableOpacity
            style={styles.overviewSection}
            onPress={() => goToSection('pattern-recognition')}
            activeOpacity={0.7}
          >
            <View style={styles.overviewIconWrap}>
              <PatternRecognitionIcon size={ICON_RENDER_SIZE} color={colors.textAccent} />
            </View>
            <View style={styles.overviewContent}>
              <Text style={styles.overviewLabel}>Pattern recognition</Text>
              <Text style={styles.overviewMeta}>Reflective themes emerging across your dreams</Text>
            </View>
            <Text style={styles.overviewChevron}>›</Text>
          </TouchableOpacity>
        </Card>
      </ScrollView>
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
  overviewTitle: {
    fontSize: typography.sizes.xl,
    fontFamily: typography.bold,
    color: colors.textTitle,
    marginBottom: spacing.lg,
  },
  overviewSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  overviewDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.divider,
    marginLeft: ICON_SIZE + spacing.md + spacing.xs,
  },
  journeyRow: {
    backgroundColor: colors.buttonPrimaryLight12,
    borderRadius: 8,
    marginBottom: spacing.sm,
  },
  journeyLabel: {
    flex: 1,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.buttonPrimary,
  },
  overviewIconWrap: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    marginRight: spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.fieldSurface,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.contourLineFaint,
    shadowColor: colors.shadow,
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  overviewContent: {
    flex: 1,
    minWidth: 0,
  },
  overviewLabel: {
    fontSize: typography.sizes.md,
    color: colors.textTitle,
    fontWeight: typography.weights.semibold,
  },
  overviewMeta: {
    marginTop: 2,
    fontSize: typography.sizes.sm,
    color: text.secondary,
  },
  overviewChevron: {
    marginLeft: spacing.sm,
    fontSize: typography.sizes.md,
    color: text.muted,
  },
});

export default InsightsScreen;
