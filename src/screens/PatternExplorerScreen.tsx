import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useFocusEffect, useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';
import { colors, spacing, typography, text, borderRadius } from '../theme';
import { PaperBackground, BreathingLine, Card, DesignExportForeground } from '../components/ui';
import {
  ArchetypesIcon,
  MotifsIcon,
  PlacesIcon,
  SymbolsIcon,
} from '../components/icons/InsightsIcons';
import {
  getInsightsOverview,
  getPeriodThisMonth,
  getPeriodLabel,
} from '../services/insightsService';
import type {
  CrossCategoryPatternItem,
  InsightsOverviewModel,
  InsightsPeriod,
  InsightsSectionId,
} from '../types/insights';

type NavigationProp = StackNavigationProp<RootStackParamList, 'PatternExplorer'>;
type PatternExplorerRoute = RouteProp<RootStackParamList, 'PatternExplorer'>;

type PatternCategory = {
  id: string;
  title: string;
  description: string;
  sectionId: InsightsSectionId;
  items: CrossCategoryPatternItem[];
  emptyText: string;
  icon: React.ReactNode;
};

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

const kindMeta = (item: CrossCategoryPatternItem): string => {
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

const PatternExplorerScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<PatternExplorerRoute>();
  const period: InsightsPeriod = useMemo(
    () =>
      route.params?.periodStart != null && route.params?.periodEnd != null
        ? { startDate: route.params.periodStart, endDate: route.params.periodEnd }
        : getPeriodThisMonth(),
    [route.params?.periodStart, route.params?.periodEnd]
  );
  const periodLabel = route.params?.periodLabel ?? getPeriodLabel(period);
  const [overview, setOverview] = useState<InsightsOverviewModel>(EMPTY_OVERVIEW);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      setLoading(true);
      getInsightsOverview(period)
        .then((data) => {
          if (mounted) setOverview(data);
        })
        .finally(() => {
          if (mounted) setLoading(false);
        });
      return () => { mounted = false; };
    }, [period.startDate, period.endDate])
  );

  const navigateToSection = (sectionId: InsightsSectionId) => {
    navigation.navigate('InsightsSection', {
      sectionId,
      periodStart: period.startDate,
      periodEnd: period.endDate,
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

  const categories: PatternCategory[] = [
    {
      id: 'images',
      title: 'Returning Images',
      description: 'Concrete images and figures that keep appearing.',
      sectionId: 'recurring-symbols',
      items: overview.topImages,
      emptyText: 'No returning images in this period yet.',
      icon: <SymbolsIcon size={34} color={colors.tabIconActive} />,
    },
    {
      id: 'motifs',
      title: 'Repeating Patterns',
      description: 'Recurring dream situations and shapes.',
      sectionId: 'symbolic-motifs',
      items: overview.topMotifs,
      emptyText: 'No repeating patterns in this period yet.',
      icon: <MotifsIcon size={34} color={colors.tabIconActive} />,
    },
    {
      id: 'thresholds',
      title: 'Thresholds',
      description: 'Places where the dream changes ground.',
      sectionId: 'thresholds',
      items: overview.topThresholds,
      emptyText: 'No thresholds in this period yet.',
      icon: <MotifsIcon size={34} color={colors.tabIconActive} />,
    },
    {
      id: 'tensions',
      title: 'Inner Tensions',
      description: 'Tensions that keep returning.',
      sectionId: 'core-conflicts',
      items: overview.topTensions,
      emptyText: 'No inner tensions in this period yet.',
      icon: <MotifsIcon size={34} color={colors.tabIconActive} />,
    },
    {
      id: 'places',
      title: 'Dream Places',
      description: 'Settings and places you return to.',
      sectionId: 'space-landscapes',
      items: overview.topPlaces,
      emptyText: 'No dream places in this period yet.',
      icon: <PlacesIcon size={34} color={colors.tabIconActive} />,
    },
    {
      id: 'echoes',
      title: 'Archetypal Echoes',
      description: 'Deep structures that echo across dreams.',
      sectionId: 'recurring-archetypes',
      items: overview.topArchetypalEchoes,
      emptyText: 'No archetypal echoes in this period yet.',
      icon: <ArchetypesIcon size={34} color={colors.tabIconActive} />,
    },
  ];

  if (loading) {
    return (
      <View style={styles.container}>
        <PaperBackground height={260} lite />
        <DesignExportForeground fill>
          <View style={styles.loadingPlaceholder}>
            <BreathingLine width={100} height={2} color={colors.textMuted} />
          </View>
        </DesignExportForeground>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <PaperBackground height={260} lite />
      <DesignExportForeground fill>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.kicker}>{periodLabel}</Text>
          <Text style={styles.title}>Pattern Explorer</Text>
          <Text style={styles.summary}>{overview.fieldSummary}</Text>

          {overview.strongestPatterns.length > 0 && (
            <Card style={styles.card}>
              <Text style={styles.sectionTitle}>Strongest Signals</Text>
              {overview.strongestPatterns.map((item) => (
                <TouchableOpacity
                  key={`${item.kind}:${item.label}`}
                  style={styles.signalRow}
                  onPress={() => navigateToPattern(item)}
                  activeOpacity={0.72}
                >
                  <View style={styles.itemTextBlock}>
                    <Text style={styles.itemLabel} numberOfLines={1}>{item.label}</Text>
                    <Text style={styles.itemMeta}>{kindMeta(item)}</Text>
                  </View>
                  <Text style={styles.itemCount}>×{item.count}</Text>
                </TouchableOpacity>
              ))}
            </Card>
          )}

          {categories.map((category) => (
            <Card key={category.id} style={styles.card}>
              <View style={styles.categoryHeader}>
                <View style={styles.categoryIcon}>{category.icon}</View>
                <View style={styles.categoryText}>
                  <Text style={styles.sectionTitle}>{category.title}</Text>
                  <Text style={styles.categoryDescription}>{category.description}</Text>
                </View>
              </View>

              {category.items.length === 0 ? (
                <Text style={styles.emptyText}>{category.emptyText}</Text>
              ) : (
                category.items.slice(0, 3).map((item) => (
                  <TouchableOpacity
                    key={`${category.id}:${item.label}`}
                    style={styles.itemRow}
                    onPress={() => navigateToPattern(item)}
                    activeOpacity={0.72}
                  >
                    <Text style={styles.itemLabel} numberOfLines={1}>{item.label}</Text>
                    <Text style={styles.itemCount}>×{item.count}</Text>
                  </TouchableOpacity>
                ))
              )}

              <TouchableOpacity
                style={styles.viewAllButton}
                onPress={() => navigateToSection(category.sectionId)}
                activeOpacity={0.72}
              >
                <Text style={styles.viewAllText}>View all</Text>
              </TouchableOpacity>
            </Card>
          ))}
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
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  kicker: {
    fontSize: typography.sizes.sm,
    color: colors.textAccent,
    marginBottom: spacing.xs,
  },
  title: {
    fontSize: typography.sizes.xl,
    fontFamily: typography.medium,
    color: colors.textTitle,
    marginBottom: spacing.sm,
  },
  summary: {
    fontSize: typography.sizes.md,
    lineHeight: typography.sizes.md * 1.45,
    color: text.secondary,
    marginBottom: spacing.xl,
  },
  card: {
    marginBottom: spacing.lg,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    backgroundColor: colors.fieldSurface,
    borderWidth: 1,
    borderColor: colors.contourLineFaint,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  categoryText: {
    flex: 1,
    minWidth: 0,
  },
  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontFamily: typography.medium,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  categoryDescription: {
    fontSize: typography.sizes.sm,
    color: text.secondary,
    lineHeight: typography.sizes.sm * 1.35,
  },
  signalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.divider,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.divider,
  },
  itemTextBlock: {
    flex: 1,
    minWidth: 0,
  },
  itemLabel: {
    flex: 1,
    fontSize: typography.sizes.md,
    color: colors.textTitle,
    fontWeight: typography.weights.semibold,
    marginRight: spacing.md,
  },
  itemMeta: {
    marginTop: 2,
    fontSize: typography.sizes.xs,
    color: text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0,
  },
  itemCount: {
    fontSize: typography.sizes.sm,
    color: colors.buttonPrimary,
    fontWeight: typography.weights.semibold,
  },
  emptyText: {
    fontSize: typography.sizes.sm,
    color: text.secondary,
    lineHeight: typography.sizes.sm * 1.4,
    marginBottom: spacing.sm,
  },
  viewAllButton: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.sm,
    paddingRight: spacing.sm,
    marginTop: spacing.sm,
  },
  viewAllText: {
    fontSize: typography.sizes.sm,
    color: colors.buttonPrimary,
    fontWeight: typography.weights.semibold,
  },
});

export default PatternExplorerScreen;
