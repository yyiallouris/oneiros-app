import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';
import { colors, spacing, typography, borderRadius } from '../theme';
import { Card, MountainWaveBackground, BreathingLine, LinoSkeletonCard } from '../components/ui';
import { Dream } from '../types/dream';
import { getDreams, searchDreams } from '../utils/storage';
import { formatDateShort } from '../utils/date';
import Svg, { Circle, Path } from 'react-native-svg';

type NavigationProp = StackNavigationProp<RootStackParamList>;

// Search icon
const SearchIcon = ({ size = 20, color = colors.textSecondary }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="11" cy="11" r="8" stroke={color} strokeWidth={2} />
    <Path d="M21 21l-4.35-4.35" stroke={color} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

// Calendar icon for header
const CalendarIcon = ({ size = 24, color = colors.accent }) => (
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

const JournalScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [dreams, setDreams] = useState<Dream[]>([]);
  const [filteredDreams, setFilteredDreams] = useState<Dream[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      loadDreams();
    }, [])
  );

  const loadDreams = async () => {
    setIsLoading(true);
    const allDreams = await getDreams();
    
    // Sort: first by date (descending - newest days first), then by createdAt within same date (descending - newest first)
    const sorted = allDreams.sort((a, b) => {
      // First sort by date (descending - newest days first)
      const dateCompare = new Date(b.date).getTime() - new Date(a.date).getTime();
      if (dateCompare !== 0) {
        return dateCompare;
      }
      // If same date, sort by createdAt (descending - newest first)
      // Use updatedAt as fallback if createdAt doesn't exist
      const aTime = new Date(a.createdAt || a.updatedAt || 0).getTime();
      const bTime = new Date(b.createdAt || b.updatedAt || 0).getTime();
      return bTime - aTime; // Descending (newest first)
    });
    
    setDreams(sorted);
    setFilteredDreams(sorted);
    setIsLoading(false);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    const trimmed = query.trim().toLowerCase();

    if (trimmed) {
      setIsSearching(true);
      const results = dreams.filter((d) => {
        const content = d.content.toLowerCase();
        const title = d.title?.toLowerCase() || '';
        return content.includes(trimmed) || title.includes(trimmed);
      });
      // Maintain same sorting for search results (newest first within same date)
      const sorted = results.sort((a, b) => {
        const dateCompare = new Date(b.date).getTime() - new Date(a.date).getTime();
        if (dateCompare !== 0) {
          return dateCompare;
        }
        const aTime = new Date(a.createdAt || a.updatedAt || 0).getTime();
        const bTime = new Date(b.createdAt || b.updatedAt || 0).getTime();
        return bTime - aTime; // Descending (newest first)
      });
      setFilteredDreams(sorted);
      setIsSearching(false);
    } else {
      setFilteredDreams(dreams);
    }
  };

  const handleDreamPress = (dreamId: string) => {
    navigation.navigate('DreamDetail', { dreamId });
  };

  const handleCalendarPress = () => {
    navigation.navigate('MainTabs', { screen: 'Calendar' });
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateTitle}>No dreams yet</Text>
      <Text style={styles.emptyStateText}>
        Capture the next one in the Write tab
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <MountainWaveBackground height={300} showSun={true} />

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
        {/* Breathing line below search bar */}
        {isLoading && (
          <View style={styles.headerLoader}>
            <BreathingLine width={120} height={2} color={colors.accent} />
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
              <MountainWaveBackground height={300} showSun={true} />
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

