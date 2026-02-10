import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect, useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';
import { colors, spacing, typography, borderRadius } from '../theme';
import { Card, Button, WaveBackground, MountainWaveBackground, BreathingLine } from '../components/ui';
import { CircularCalendar } from '../components/ui/CircularCalendar';
import { Dream } from '../types/dream';
import { getDreams, getDreamsByDate } from '../utils/storage';
import { formatDateShort, toISODate } from '../utils/date';

type NavigationProp = StackNavigationProp<RootStackParamList>;
type CalendarRouteProp = RouteProp<RootStackParamList, 'Calendar'>;

const CalendarScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<CalendarRouteProp>();
  const [allDreams, setAllDreams] = useState<Dream[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [dreamsForSelectedDate, setDreamsForSelectedDate] = useState<Dream[]>([]);
  const [isLoadingDayDreams, setIsLoadingDayDreams] = useState(false);
  const today = toISODate(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  useFocusEffect(
    useCallback(() => {
      const initialDate = route.params?.initialDate;
      if (initialDate) {
        const y = parseInt(initialDate.slice(0, 4), 10);
        const m = parseInt(initialDate.slice(5, 7), 10);
        setCurrentMonth(m - 1);
        setCurrentYear(y);
      }
      loadCalendarData();
    }, [route.params?.initialDate])
  );

  const loadCalendarData = async () => {
    const dreams = await getDreams();
    setAllDreams(dreams);
  };

  // Prepare day data for circular calendar (all days of current month)
  const dayData = useMemo(() => {
    const days: Array<{
      date: string;
      dreamCount: number;
      intensity: number;
      isToday: boolean;
      isSelected: boolean;
    }> = [];
    
    // Get all days of the current month
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      const dateStr = toISODate(date);
      
      // Skip future dates
      if (dateStr > today) continue;
      
      const dreamsForDay = allDreams.filter(d => d.date === dateStr);
      
      days.push({
        date: dateStr,
        dreamCount: dreamsForDay.length,
        intensity: 0, // Not used anymore, intensity is based on dreamCount
        isToday: dateStr === today,
        isSelected: dateStr === selectedDate,
      });
    }
    
    return days;
  }, [allDreams, selectedDate, today, currentMonth, currentYear]);

  const handleMonthChange = (month: number, year: number) => {
    setCurrentMonth(month);
    setCurrentYear(year);
    setSelectedDate(''); // Clear selection when changing month
  };

  const handleDayPress = async (dateStr: string) => {
    // Prevent selecting future dates
    if (dateStr > today) {
      return;
    }
    setSelectedDate(dateStr);
    setIsLoadingDayDreams(true);
    
    const dreams = await getDreamsByDate(dateStr);
    // Sort by createdAt descending (newest first)
    const sorted = dreams.sort((a, b) => {
      const aTime = new Date(a.createdAt || a.updatedAt || 0).getTime();
      const bTime = new Date(b.createdAt || b.updatedAt || 0).getTime();
      return bTime - aTime; // Descending (newest first)
    });
    setDreamsForSelectedDate(sorted);
    setIsLoadingDayDreams(false);
  };

  const handleDreamPress = (dreamId: string) => {
    navigation.navigate('DreamDetail', { dreamId });
  };

  const handleWriteForDate = () => {
    navigation.navigate('DreamEditor', { date: selectedDate });
  };

  return (
    <View style={styles.container}>
      <MountainWaveBackground height={300} showSun={false} />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Circular Calendar */}
        <View style={styles.calendarContainer}>
          <CircularCalendar
            days={dayData}
            onDayPress={handleDayPress}
            selectedDate={selectedDate}
            currentMonth={currentMonth}
            currentYear={currentYear}
            onMonthChange={handleMonthChange}
            today={today}
          />
        </View>

        {/* Day Sheet */}
        {selectedDate && (
          <View style={styles.daySheet}>
            <Text style={styles.daySheetTitle}>
              {formatDateShort(selectedDate)}
            </Text>

            {isLoadingDayDreams ? (
              <View style={styles.loadingContainer}>
                <BreathingLine width={120} height={2} color={colors.accent} />
              </View>
            ) : dreamsForSelectedDate.length > 0 ? (
              <View>
                <View style={styles.dreamsList}>
                  {dreamsForSelectedDate.map(dream => (
                    <TouchableOpacity
                      key={dream.id}
                      onPress={() => handleDreamPress(dream.id)}
                      activeOpacity={0.7}
                    >
                      <Card style={styles.dreamCard}>
                        <View style={styles.dreamCardContent}>
                          <View style={styles.dreamInfo}>
                            <Text style={styles.dreamTitle} numberOfLines={1}>
                              {dream.title || 'Dream'}
                            </Text>
                            <Text style={styles.dreamPreview} numberOfLines={2}>
                              {dream.content}
                            </Text>
                          </View>
                        </View>
                      </Card>
                    </TouchableOpacity>
                  ))}
                </View>
                <Button
                  title="Add another dream"
                  onPress={handleWriteForDate}
                  variant="secondary"
                  style={[styles.writeButton, styles.addAnotherButton]}
                />
              </View>
            ) : (
              <View style={styles.noDreamsContainer}>
                <Text style={styles.noDreamsText}>
                  No dream logged here. Add one?
                </Text>
                <Button
                  title="Write for this day"
                  onPress={handleWriteForDate}
                  variant="secondary"
                  style={styles.writeButton}
                />
              </View>
            )}
          </View>
        )}

        {!selectedDate && (
          <View style={styles.promptContainer}>
            <Text style={styles.promptText}>
              Tap a day to see your dreams
            </Text>
          </View>
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
  scrollView: {
    flex: 1,
  },
  calendarContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    marginBottom: spacing.lg,
  },
  daySheet: {
    padding: spacing.lg,
  },
  daySheetTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  dreamsList: {
    gap: spacing.sm,
  },
  dreamCard: {
    marginBottom: spacing.sm,
    backgroundColor: 'rgba(240, 229, 223, 0.7)', // Semi-transparent to show sun
  },
  dreamCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dreamInfo: {
    flex: 1,
  },
  dreamTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  dreamPreview: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    lineHeight: typography.sizes.sm * typography.lineHeights.normal,
  },
  noDreamsContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  noDreamsText: {
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  writeButton: {
    minWidth: 200,
  },
  addAnotherButton: {
    marginTop: spacing.lg,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  promptContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  promptText: {
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
});

export default CalendarScreen;

