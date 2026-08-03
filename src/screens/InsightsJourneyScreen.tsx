import React, { useState, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ViewToken,
} from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';
import { colors, spacing, typography } from '../theme';
import { PaperBackground, DesignExportForeground } from '../components/ui';
import { InsightsSectionScreen } from './InsightsSectionScreen';
import { INSIGHTS_SECTION_TITLES } from '../constants/insightsSections';
import type { InsightsSectionId, InsightsPeriod } from '../types/insights';
import { useContentWidth } from '../layout/WebLayoutContext';

type JourneyRoute = RouteProp<RootStackParamList, 'InsightsJourney'>;

/** Legacy swipeable journey order: images → motifs → atmosphere → thresholds → tensions → landscapes. */
const JOURNEY_SECTIONS: InsightsSectionId[] = [
  'recurring-symbols',
  'symbolic-motifs',
  'emotional-weather',
  'thresholds',
  'core-conflicts',
  'space-landscapes',
];

const InsightsJourneyScreen: React.FC = () => {
  const route = useRoute<JourneyRoute>();
  const pageWidth = useContentWidth();
  const period: InsightsPeriod | undefined = useMemo(
    () =>
      route.params?.periodStart != null && route.params?.periodEnd != null
        ? { startDate: route.params.periodStart, endDate: route.params.periodEnd }
        : undefined,
    [route.params?.periodStart, route.params?.periodEnd]
  );
  const periodLabel = route.params?.periodLabel ?? '';
  const initialSectionId = route.params?.initialSectionId;
  const initialIndex = initialSectionId != null
    ? JOURNEY_SECTIONS.indexOf(initialSectionId)
    : 0;
  const safeInitialIndex = initialIndex >= 0 ? initialIndex : 0;

  const [currentIndex, setCurrentIndex] = useState(safeInitialIndex);
  const flatListRef = useRef<FlatList>(null);

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      const item = viewableItems[0];
      if (item?.index == null) return;
      setCurrentIndex(item.index);
    },
    []
  );

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 80 }).current;

  const renderPage = useCallback(
    ({ item }: { item: InsightsSectionId }) => (
      <View style={[styles.page, { width: pageWidth }]}>
        <InsightsSectionScreen
          embedded
          overrideSectionId={item}
          overridePeriod={period}
          overridePeriodLabel={periodLabel}
        />
      </View>
    ),
    [pageWidth, period?.startDate, period?.endDate, periodLabel]
  );

  const keyExtractor = useCallback((id: InsightsSectionId) => id, []);

  const getItemLayout = useCallback(
    (_: ArrayLike<InsightsSectionId> | null | undefined, index: number) => ({
      length: pageWidth,
      offset: pageWidth * index,
      index,
    }),
    [pageWidth]
  );

  return (
    <View style={styles.container}>
      <PaperBackground height={260} lite />
      <DesignExportForeground fill>
        <View style={styles.caption}>
          <Text style={styles.captionText} numberOfLines={1}>
            {INSIGHTS_SECTION_TITLES[JOURNEY_SECTIONS[currentIndex]] ?? ''}
          </Text>
        </View>
        <View style={styles.dots}>
          {JOURNEY_SECTIONS.map((id, i) => (
            <View
              key={id}
              style={[
                styles.dot,
                currentIndex === i && styles.dotActive,
              ]}
            />
          ))}
        </View>
        <FlatList
          ref={flatListRef}
          data={JOURNEY_SECTIONS}
          renderItem={renderPage}
          keyExtractor={keyExtractor}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          getItemLayout={getItemLayout}
          initialScrollIndex={safeInitialIndex}
          initialNumToRender={Math.max(1, safeInitialIndex + 1)}
          maxToRenderPerBatch={1}
          windowSize={2}
          removeClippedSubviews={false}
          decelerationRate="fast"
          // Remount when the shell width changes so paging math stays correct on web resize.
          key={`insights-journey-${pageWidth}`}
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
  caption: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: spacing.md,
    alignItems: 'center',
  },
  captionText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.border,
  },
  dotActive: {
    backgroundColor: colors.buttonPrimary,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  page: {
    flex: 1,
  },
});

export default InsightsJourneyScreen;
