import React, { useState, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { useFocusEffect, useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList, MainTabsParamList } from '../navigation/types';
import { colors, spacing, typography, borderRadius } from '../theme';
import { PaperBackground, MysticHeader, LinoSkeletonCard, DesignExportForeground, LoadingState } from '../components/ui';
import { Dream, Interpretation } from '../types/dream';
import { getDreams, getInterpretations } from '../utils/storage';
import { formatDateShort } from '../utils/date';
import { normalizeSymbolKey } from '../services/insightsService';
import Svg, { Circle, Path } from 'react-native-svg';

const JOURNAL_MOUNTAIN_HEIGHT = 300;

type NavigationProp = StackNavigationProp<RootStackParamList>;
type JournalRouteProp = RouteProp<MainTabsParamList, 'Journal'>;

// Search icon
const SearchIcon = ({ size = 20, color = colors.textSecondary }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="11" cy="11" r="8" stroke={color} strokeWidth={2} />
    <Path d="M21 21l-4.35-4.35" stroke={color} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

// Calendar icon for header
const CalendarIcon = ({ size = 24, color = colors.buttonPrimary }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M19 4H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zM16 2v4M8 2v4M3 10h18"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

interface DreamCardProps {
  dream: Dream;
  interpretation?: Interpretation;
  onPress: () => void;
}

const compactList = (items?: string[], count = 1): string[] =>
  (items ?? []).map((item) => item.trim()).filter(Boolean).slice(0, count);

const DreamCard = React.memo<DreamCardProps>(({ dream, interpretation, onPress }) => {
  const preview = dream.content.replace(/\s+/g, ' ').trim();

  const displayTitle = dream.title || preview.split('\n')[0].slice(0, 50) + (preview.length > 50 ? '...' : '');
  const excerpt = dream.title
    ? preview
    : preview.length > displayTitle.length
      ? preview.slice(displayTitle.length).trim()
      : preview;
  const symbolMarker = compactList(interpretation?.symbols ?? dream.symbols, 1)[0] ?? dream.symbol;
  const placeMarker = compactList(interpretation?.landscapes ?? dream.landscapes, 1)[0];
  const atmosphereMarker = compactList(interpretation?.affects, 1)[0];

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.68} style={styles.dreamSlip}>
      <View pointerEvents="none" style={styles.archiveThread} />
      <View style={styles.dreamSlipHeader}>
        <View style={styles.dreamDateSeal}>
          <Text style={styles.dreamDate}>{formatDateShort(dream.date)}</Text>
        </View>
      </View>
      <Text style={styles.dreamTitle} numberOfLines={1}>
        {displayTitle}
      </Text>
      <Text style={styles.dreamPreview} numberOfLines={2}>
        {excerpt}
      </Text>
      <View style={styles.markerRow}>
        {symbolMarker ? <Text style={styles.markerText} numberOfLines={1}>image / {symbolMarker}</Text> : null}
        {placeMarker ? <Text style={styles.markerText} numberOfLines={1}>place / {placeMarker}</Text> : null}
        {atmosphereMarker ? (
          <Text style={styles.markerText} numberOfLines={1}>atmosphere / {atmosphereMarker}</Text>
        ) : null}
        {!symbolMarker && !placeMarker && !atmosphereMarker ? (
          <Text style={styles.markerTextMuted}>awaiting symbols</Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
});

DreamCard.displayName = 'DreamCard';

const sortDreams = (list: Dream[]) =>
  [...list].sort((a, b) => {
    const dateCompare = new Date(b.date).getTime() - new Date(a.date).getTime();
    if (dateCompare !== 0) return dateCompare;
    const aTime = new Date(a.createdAt || a.updatedAt || 0).getTime();
    const bTime = new Date(b.createdAt || b.updatedAt || 0).getTime();
    return bTime - aTime;
  });

export interface JournalScreenProps {
  /** When set, filter is driven by these params and back goes to previous stack screen (e.g. InsightsSection). */
  overrideParams?: { filterSymbol?: string; filterLandscape?: string };
}

const JournalScreen: React.FC<JournalScreenProps> = ({ overrideParams }) => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<JournalRouteProp>();
  const isStackScreen = !!overrideParams;
  const filterSymbol = overrideParams?.filterSymbol ?? route.params?.filterSymbol;
  const filterLandscape = overrideParams?.filterLandscape ?? route.params?.filterLandscape;
  const [dreams, setDreams] = useState<Dream[]>([]);
  const [baseDreams, setBaseDreams] = useState<Dream[]>([]); // all dreams or filtered by symbol/landscape from Insights
  const [filteredDreams, setFilteredDreams] = useState<Dream[]>([]);
  const [interpretationsByDreamId, setInterpretationsByDreamId] = useState<Map<string, Interpretation>>(new Map());
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const baseDreamsRef = useRef<Dream[]>([]);
  baseDreamsRef.current = baseDreams;

  const clearFilter = useCallback(() => {
    setSearchQuery('');
    // In stack mode this updates JournalFilter's route params so the header title becomes "Journal"
    navigation.setParams({ filterSymbol: undefined, filterLandscape: undefined });
  }, [navigation]);

  const loadDreams = useCallback(async () => {
    setIsLoading(true);
    try {
      const allDreams = await getDreams();
      const interpretations = await getInterpretations();
      const byDreamId = new Map(interpretations.map((i) => [i.dreamId, i]));
      let toShow = sortDreams(allDreams);

      if (filterSymbol || filterLandscape) {
        const filterKeySymbol = filterSymbol ? normalizeSymbolKey(filterSymbol) : '';
        const filterKeyLandscape = filterLandscape ? filterLandscape.trim().toLowerCase().replace(/\s+/g, ' ') : '';

        toShow = toShow.filter((d) => {
          if (filterKeySymbol) {
            const inDream = d.symbols?.some((s) => normalizeSymbolKey(s) === filterKeySymbol);
            const interp = byDreamId.get(d.id);
            const inInterp = interp?.symbols?.some((s) => normalizeSymbolKey(s) === filterKeySymbol);
            return !!(inDream || inInterp);
          }
          if (filterKeyLandscape) {
            const interp = byDreamId.get(d.id);
            return !!interp?.landscapes?.some(
              (l) => l.trim().toLowerCase().replace(/\s+/g, ' ') === filterKeyLandscape
            );
          }
          return true;
        });
        toShow = sortDreams(toShow);
      }

      const sortedAll = sortDreams(allDreams);
      setDreams(sortedAll);
      setBaseDreams(toShow);
      setFilteredDreams(toShow);
      setInterpretationsByDreamId(byDreamId);
    } catch (error) {
      console.error('[Journal] Failed to load dreams:', error);
      setDreams([]);
      setBaseDreams([]);
      setFilteredDreams([]);
      setInterpretationsByDreamId(new Map());
    } finally {
      setIsLoading(false);
    }
  }, [filterSymbol, filterLandscape]);

  useFocusEffect(
    useCallback(() => {
      loadDreams();
      return () => {
        if (searchDebounceRef.current) {
          clearTimeout(searchDebounceRef.current);
          searchDebounceRef.current = null;
        }
        if (!isStackScreen) {
          setSearchQuery('');
          navigation.setParams({ filterSymbol: undefined, filterLandscape: undefined });
        }
      };
    }, [loadDreams, isStackScreen, navigation])
  );

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) {
      setFilteredDreams(baseDreams);
      return;
    }
    setIsSearching(true);
    searchDebounceRef.current = setTimeout(() => {
      searchDebounceRef.current = null;
      const dreams = baseDreamsRef.current;
      const results = dreams.filter((d) => {
        const content = d.content.toLowerCase();
        const title = d.title?.toLowerCase() || '';
        const inContent = content.includes(trimmed) || title.includes(trimmed);
        const inSymbols = d.symbols?.some((s) => s.toLowerCase().includes(trimmed));
        return inContent || inSymbols;
      });
      setFilteredDreams(sortDreams(results));
      setIsSearching(false);
    }, 200);
  }, []);

  const handleDreamPress = useCallback((dreamId: string) => {
    navigation.navigate('DreamDetail', { dreamId });
  }, [navigation]);

  const handleCalendarPress = useCallback(() => {
    navigation.navigate('Calendar');
  }, [navigation]);

  const renderItem = useCallback(({ item }: { item: Dream }) => (
    <DreamCard
      dream={item}
      interpretation={interpretationsByDreamId.get(item.id)}
      onPress={() => handleDreamPress(item.id)}
    />
  ), [handleDreamPress, interpretationsByDreamId]);

  const keyExtractor = useCallback((item: Dream) => item.id, []);

  const renderEmptyState = () => {
    const isFiltered = !!(filterSymbol || filterLandscape);
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyStateTitle}>
          {isFiltered ? 'No dreams with this filter' : 'No dreams yet'}
        </Text>
        <Text style={styles.emptyStateText}>
          {isFiltered
            ? 'Try another symbol or landscape from Insights'
            : 'Capture the next one in the Write tab'}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <PaperBackground height={JOURNAL_MOUNTAIN_HEIGHT} lite />

      <DesignExportForeground fill>
        <MysticHeader
          title="Journal"
          subtitle="Dreams remembered and ready to return."
          right={
            <TouchableOpacity onPress={handleCalendarPress} style={styles.headerRight}>
              <CalendarIcon size={24} />
            </TouchableOpacity>
          }
        />

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <SearchIcon />
            <TextInput
              style={styles.searchInput}
              placeholder="Search dreams..."
              placeholderTextColor={colors.textMuted}
              value={searchQuery}
              onChangeText={handleSearch}
            />
          </View>
          {(filterSymbol || filterLandscape) && !isLoading && (
            <View style={styles.filterRow}>
              <Text style={styles.filterHint}>
                {filterSymbol ? `Symbol: ${filterSymbol}` : `Landscape: ${filterLandscape}`}
              </Text>
              <TouchableOpacity
                onPress={clearFilter}
                style={styles.filterClearButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                accessibilityLabel="Clear filter"
              >
                <Text style={styles.filterClearText}>×</Text>
              </TouchableOpacity>
            </View>
          )}
          {/* Breathing line below search bar */}
          {isLoading && (
            <View style={styles.headerLoader}>
              <LoadingState preset="loadJournal" />
            </View>
          )}
        </View>

        {/* Dreams List */}
        {isLoading ? (
          <View style={styles.skeletonContainer}>
            {[1, 2, 3, 4, 5].map((i) => (
              <LinoSkeletonCard key={i} />
            ))}
          </View>
        ) : (
          <FlatList
            data={filteredDreams}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            initialNumToRender={15}
            maxToRenderPerBatch={10}
            windowSize={5}
            removeClippedSubviews={true}
            ListEmptyComponent={
              <View style={styles.emptyStateContainer}>
                {renderEmptyState()}
              </View>
            }
            showsVerticalScrollIndicator={false}
          />
        )}
      </DesignExportForeground>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  searchContainer: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  headerLoader: {
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  skeletonContainer: {
    padding: spacing.lg,
    paddingTop: spacing.sm,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardGlassStrong,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.contourLineFaint,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  filterHint: {
    fontSize: typography.sizes.xs,
    color: colors.textAccent,
  },
  filterClearButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.buttonPrimaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterClearText: {
    fontSize: typography.sizes.xl,
    color: colors.buttonPrimary,
    fontWeight: typography.weights.medium,
    lineHeight: typography.sizes.xl,
  },
  searchInput: {
    flex: 1,
    marginLeft: spacing.sm,
    fontSize: typography.sizes.md,
    color: colors.textPrimary,
    padding: 0,
  },
  listContent: {
    padding: spacing.lg,
    paddingTop: spacing.sm,
  },
  dreamSlip: {
    marginBottom: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 253, 249, 0.58)',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    overflow: 'hidden',
  },
  archiveThread: {
    position: 'absolute',
    top: spacing.md,
    bottom: spacing.md,
    left: 0,
    width: 2,
    backgroundColor: colors.accentClayBrown,
    opacity: 0.28,
  },
  dreamSlipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  dreamDateSeal: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.xs,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
    backgroundColor: colors.buttonPrimaryLight12,
  },
  dreamDate: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    fontWeight: typography.weights.medium,
  },
  dreamTitle: {
    fontSize: typography.sizes.lg,
    fontFamily: typography.medium,
    color: colors.textTitle,
    marginBottom: spacing.xs,
  },
  dreamPreview: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    lineHeight: typography.sizes.sm * typography.lineHeights.normal,
  },
  markerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  markerText: {
    maxWidth: '48%',
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
  },
  markerTextMuted: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  emptyStateContainer: {
    minHeight: 300,
    position: 'relative',
    overflow: 'hidden',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxxl,
    paddingHorizontal: spacing.lg,
    zIndex: 1,
    position: 'relative',
  },
  emptyStateTitle: {
    fontSize: typography.sizes.xl,
    fontFamily: typography.bold,
    color: colors.textTitle,
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
  },
  emptyStateText: {
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
});

export default JournalScreen;
