import React, { useState, useCallback } from 'react';
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
import { Card, MountainWaveBackground, BreathingLine, LinoSkeletonCard } from '../components/ui';
import { Dream } from '../types/dream';
import { getDreams, getInterpretations } from '../utils/storage';
import { formatDateShort } from '../utils/date';
import { normalizeSymbolKey } from '../services/insightsService';
import Svg, { Circle, Path } from 'react-native-svg';

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
  onPress: () => void;
}

const DreamCard: React.FC<DreamCardProps> = ({ dream, onPress }) => {
  const preview = dream.content.length > 120
    ? dream.content.slice(0, 120) + '...'
    : dream.content;

  const displayTitle = dream.title || preview.split('\n')[0].slice(0, 50) + (preview.length > 50 ? '...' : '');

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Card style={styles.dreamCard}>
        <View style={styles.dreamCardContent}>
          {/* Dream Content */}
          <View style={styles.dreamText}>
            <Text style={styles.dreamDate}>{formatDateShort(dream.date)}</Text>
            <Text style={styles.dreamTitle} numberOfLines={1}>
              {displayTitle}
            </Text>
            <Text style={styles.dreamPreview} numberOfLines={2}>
              {dream.title ? preview : dream.content.slice(displayTitle.length)}
            </Text>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
};

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
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const clearFilter = useCallback(() => {
    setSearchQuery('');
    // In stack mode this updates JournalFilter's route params so the header title becomes "Journal"
    navigation.setParams({ filterSymbol: undefined, filterLandscape: undefined });
  }, [navigation]);

  useFocusEffect(
    useCallback(() => {
      loadDreams();
      return () => {
        // Only clear tab params when leaving Journal tab (not when used as stack JournalFilter)
        if (!isStackScreen) {
          setSearchQuery('');
          navigation.setParams({ filterSymbol: undefined, filterLandscape: undefined });
        }
      };
    }, [filterSymbol, filterLandscape, isStackScreen])
  );

  const loadDreams = async () => {
    setIsLoading(true);
    try {
      const allDreams = await getDreams();
      let toShow = sortDreams(allDreams);

      if (filterSymbol || filterLandscape) {
        const interpretations = await getInterpretations();
        const byDreamId = new Map(interpretations.map((i) => [i.dreamId, i]));
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
    } catch (error) {
      console.error('[Journal] Failed to load dreams:', error);
      setDreams([]);
      setBaseDreams([]);
      setFilteredDreams([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    const trimmed = query.trim().toLowerCase();

    if (trimmed) {
      setIsSearching(true);
      const results = baseDreams.filter((d) => {
        const content = d.content.toLowerCase();
        const title = d.title?.toLowerCase() || '';
        const inContent = content.includes(trimmed) || title.includes(trimmed);
        const inSymbols = d.symbols?.some((s) => s.toLowerCase().includes(trimmed));
        return inContent || inSymbols;
      });
      setFilteredDreams(sortDreams(results));
      setIsSearching(false);
    } else {
      setFilteredDreams(baseDreams);
    }
  };

  const handleDreamPress = (dreamId: string) => {
    navigation.navigate('DreamDetail', { dreamId });
  };

  const handleCalendarPress = () => {
    navigation.navigate('Calendar');
  };

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
      <MountainWaveBackground height={300} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft} />
        <Text style={styles.headerTitle}>Journal</Text>
        <TouchableOpacity onPress={handleCalendarPress} style={styles.headerRight}>
          <CalendarIcon size={24} />
        </TouchableOpacity>
      </View>

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
            <BreathingLine width={120} height={2} color={colors.buttonPrimary} />
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
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <DreamCard dream={item} onPress={() => handleDreamPress(item.id)} />
          )}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyStateContainer}>
              <MountainWaveBackground height={300} />
              {renderEmptyState()}
            </View>
          }
          showsVerticalScrollIndicator={false}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    paddingTop: spacing.xl,
  },
  headerLeft: {
    width: 40,
  },
  headerTitle: {
    flex: 1,
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    fontFamily: typography.bold,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  headerRight: {
    width: 40,
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
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
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
    color: colors.buttonPrimary,
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
  dreamCard: {
    marginBottom: spacing.md,
    backgroundColor: 'rgba(240, 229, 223, 0.7)', // Semi-transparent to show sun
  },
  dreamCardContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  dreamText: {
    flex: 1,
  },
  dreamDate: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    fontWeight: typography.weights.medium,
  },
  dreamTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  dreamPreview: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    lineHeight: typography.sizes.sm * typography.lineHeights.normal,
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
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
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

