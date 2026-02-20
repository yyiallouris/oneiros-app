import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
  ViewToken,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';
import { colors, spacing, typography, text } from '../theme';
import { WaveBackground } from '../components/ui';
import { InsightsSectionScreen } from './InsightsSectionScreen';
import { INSIGHTS_SECTION_TITLES } from '../constants/insightsSections';
import type { InsightsSectionId, InsightsPeriod } from '../types/insights';
type NavProp = StackNavigationProp<RootStackParamList, 'InsightsJourney'>;
type JourneyRoute = RouteProp<RootStackParamList, 'InsightsJourney'>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/** Section order for the insights journey flow: symbols → archetypes → landscapes → pattern recognition */
const JOURNEY_SECTIONS: InsightsSectionId[] = [
  'recurring-symbols',
  'recurring-archetypes',
  'space-landscapes',
  'pattern-recognition',
];

const InsightsJourneyScreen: React.FC = () => {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<JourneyRoute>();
  const period: InsightsPeriod | undefined =
    route.params?.periodStart != null && route.params?.periodEnd != null
      ? { startDate: route.params.periodStart, endDate: route.params.periodEnd }
      : undefined;
  const periodLabel = route.params?.periodLabel ?? '';
  const initialSectionId = route.params?.initialSectionId;
  const initialIndex = initialSectionId != null
    ? JOURNEY_SECTIONS.indexOf(initialSectionId)
    : 0;
  const safeInitialIndex = initialIndex >= 0 ? initialIndex : 0;

  const [currentIndex, setCurrentIndex] = useState(safeInitialIndex);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (flatListRef.current == null) return;
    flatListRef.current.scrollToOffset({
      offset: SCREEN_WIDTH * safeInitialIndex,
      animated: false,
    });
  }, [safeInitialIndex]);

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      const item = viewableItems[0];
      if (item?.index == null) return;
      setCurrentIndex(item.index);
    },
    []
  );

  const viewabilityConfig = { viewAreaCoveragePercentThreshold: 80 };


  const renderPage = useCallback(
    ({ item }: { item: InsightsSectionId }) => (
      <View style={styles.page}>
        <InsightsSectionScreen
          embedded
          overrideSectionId={item}
          overridePeriod={period}
          overridePeriodLabel={periodLabel}
        />
      </View>
    ),
    [period?.startDate, period?.endDate, periodLabel]
  );

  const keyExtractor = useCallback((id: InsightsSectionId) => id, []);

  return (
    <View style={styles.container}>
      <WaveBackground />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBack} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Text style={styles.headerBackLabel}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Dream patterns</Text>
        <View style={styles.ambientToggle} />
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
        getItemLayout={(_, index) => ({
          length: SCREEN_WIDTH,
          offset: SCREEN_WIDTH * index,
          index,
        })}
      />
      <View style={styles.caption}>
        <Text style={styles.captionText} numberOfLines={1}>
          {INSIGHTS_SECTION_TITLES[JOURNEY_SECTIONS[currentIndex]] ?? ''}
        </Text>
      </View>
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
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  headerBack: {
    padding: spacing.xs,
  },
  headerBackLabel: {
    fontSize: typography.sizes.lg,
    color: colors.accent,
    fontWeight: typography.weights.semibold,
  },
  headerTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  ambientToggle: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  ambientToggleOn: {
    backgroundColor: colors.accent + '22',
    borderColor: colors.accent,
  },
  ambientLabel: {
    fontSize: typography.sizes.sm,
    color: text.secondary,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingBottom: spacing.sm,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.border,
  },
  dotActive: {
    backgroundColor: colors.accent,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  page: {
    width: SCREEN_WIDTH,
    flex: 1,
  },
  caption: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    alignItems: 'center',
  },
  captionText: {
    fontSize: typography.sizes.sm,
    color: text.secondary,
  },
});

export default InsightsJourneyScreen;
