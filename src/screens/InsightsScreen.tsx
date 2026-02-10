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
import Svg, { Path } from 'react-native-svg';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';
import { colors, spacing, typography, text } from '../theme';
import { WaveBackground, BreathingLine, Card } from '../components/ui';
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

// Overview row icons – stroke style to match app (no emojis)
const ICON_SIZE = 22;

const DreamLogIcon = ({ color = text.secondary, size = ICON_SIZE }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const SymbolsIcon = ({ color = text.secondary, size = ICON_SIZE }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M12 2l1.5 4.5L18 8l-4.5 1.5L12 14l-1.5-4.5L6 8l4.5-1.5L12 2z" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M19 15l-1.2 3.6L14 20l3.6-1.2L19 15z" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M5 19l-1.2 3.6L0 24l3.6-1.2L5 19z" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const ArchetypesIcon = ({ color = text.secondary, size = ICON_SIZE }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 4a8 8 0 0 1 0 16"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const LandscapeIcon = ({ color = text.secondary, size = ICON_SIZE }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M19 5.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M5 20L7 12l2 8M11 20l2-5 2 5M16 20l1-3 1 3" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M3 20h18" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const PatternIcon = ({ color = text.secondary, size = ICON_SIZE }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M4 8h4v2H4V8zM10 8h4v2h-4V8zM16 8h4v2h-4V8z" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M4 14h4v2H4v-2zM10 14h4v2h-4v-2zM16 14h4v2h-4v-2z" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

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

  const goToSection = (sectionId: InsightsSectionId) => {
    navigation.navigate('InsightsSection', {
      sectionId,
      periodStart: currentPeriod.startDate,
      periodEnd: currentPeriod.endDate,
      periodLabel,
    });
  };

  const goToCalendar = () => {
    navigation.navigate('Calendar', { initialDate: currentPeriod.startDate });
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
        <WaveBackground />
        <View style={styles.header}>
          <View style={styles.headerLeft} />
          <Text style={styles.headerTitle}>Dream patterns</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.loadingPlaceholder}>
          <BreathingLine width={100} height={2} color={colors.textMuted} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <WaveBackground />

      <View style={styles.header}>
        <View style={styles.headerLeft} />
        <Text style={styles.headerTitle}>Dream patterns</Text>
        <View style={styles.headerRight} />
      </View>

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

        <Card style={styles.card}>
          <Text style={styles.overviewTitle}>Dream Activity Overview</Text>

          <TouchableOpacity style={styles.overviewRow} onPress={goToCalendar} activeOpacity={0.7}>
            <View style={styles.overviewIconWrap}>
              <DreamLogIcon color={text.secondary} />
            </View>
            <Text style={styles.overviewLabel}>Dreams logged</Text>
            <Text style={styles.overviewValue}>{dreamsCount}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.overviewRow}
            onPress={() => goToSection('recurring-symbols')}
            activeOpacity={0.7}
          >
            <View style={styles.overviewIconWrap}>
              <SymbolsIcon color={text.secondary} />
            </View>
            <Text style={styles.overviewLabel}>Symbols occurred</Text>
            <Text style={styles.overviewValue}>{symbols.length}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.overviewRow}
            onPress={() => goToSection('recurring-archetypes')}
            activeOpacity={0.7}
          >
            <View style={styles.overviewIconWrap}>
              <ArchetypesIcon color={text.secondary} />
            </View>
            <Text style={styles.overviewLabel}>Archetypes occurred</Text>
            <Text style={styles.overviewValue}>{archetypes.length}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.overviewRow}
            onPress={() => goToSection('space-landscapes')}
            activeOpacity={0.7}
          >
            <View style={styles.overviewIconWrap}>
              <LandscapeIcon color={text.secondary} />
            </View>
            <Text style={styles.overviewLabel}>Space landscapes</Text>
            <Text style={styles.overviewValue}>{landscapes.length}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.overviewRow, styles.overviewRowLast]}
            onPress={() => goToSection('pattern-recognition')}
            activeOpacity={0.7}
          >
            <View style={styles.overviewIconWrap}>
              <PatternIcon color={text.secondary} />
            </View>
            <Text style={styles.overviewLabel}>Pattern recognition</Text>
            <Text style={styles.overviewValue}>→</Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.sm,
  },
  headerLeft: { width: 40 },
  headerTitle: {
    flex: 1,
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    fontFamily: typography.bold,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  headerRight: { width: 40 },
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
    fontSize: typography.sizes.sm,
    color: text.secondary,
    marginBottom: spacing.sm,
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
    backgroundColor: colors.cardBackground,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
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
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardBackground,
    overflow: 'hidden',
  },
  periodOption: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  periodOptionActive: {
    backgroundColor: colors.accent + '18',
  },
  periodOptionText: {
    fontSize: typography.sizes.md,
    color: colors.textPrimary,
  },
  periodOptionTextActive: {
    color: colors.accent,
    fontWeight: typography.weights.medium,
  },
  card: {
    marginBottom: spacing.xl,
  },
  overviewTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
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
  overviewIconWrap: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    marginRight: spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
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
});

export default InsightsScreen;
