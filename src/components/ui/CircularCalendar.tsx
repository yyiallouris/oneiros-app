import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { colors, spacing, typography, calendar } from '../../theme';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CALENDAR_SIZE = Math.min(SCREEN_WIDTH - spacing.lg * 2, 320);
const CENTER_X = CALENDAR_SIZE / 2;
const CENTER_Y = CALENDAR_SIZE / 2;
const RADIUS = CALENDAR_SIZE * 0.38; // Days circle radius - slightly larger for breathing room
const DAY_RADIUS = 12; // Individual day circle size

interface DayData {
  date: string;
  dreamCount: number;
  intensity: number; // 0-1 based on dream count
  isToday: boolean;
  isSelected: boolean;
}

interface CircularCalendarProps {
  days: DayData[];
  onDayPress: (date: string) => void;
  selectedDate?: string;
  currentMonth: number; // 0-11
  currentYear: number;
  onMonthChange: (month: number, year: number) => void;
  today?: string; // ISO date string for today
}

// Calculate glow intensity (0-1) based on dream count
const calculateGlowIntensity = (dreamCount: number): number => {
  if (dreamCount === 0) return 0;
  // Intensity based on dream count: 1 dream = 0.3, 2-3 = 0.5, 4+ = 0.7-1.0
  if (dreamCount === 1) return 0.3;
  if (dreamCount <= 3) return 0.5;
  return Math.min(0.7 + (dreamCount - 4) * 0.1, 1.0);
};

// Color for days with dreams (single accent color)
const HAS_DREAMS_COLOR = colors.buttonPrimary; // #6A4FB3 — matches journey dots

const getDayColor = (dreamCount: number): string => {
  if (dreamCount === 0) return calendar.noDreams;
  return HAS_DREAMS_COLOR;
};

// Get day number from date string (e.g., "2024-01-15" -> 15)
const getDayNumber = (dateStr: string): number => {
  return parseInt(dateStr.split('-')[2]);
};

// Calculate position for a day in the circle (all days of month, arranged in circle)
const getDayPosition = (index: number, totalDays: number) => {
  const angle = (index / totalDays) * 2 * Math.PI - Math.PI / 2; // Start from top
  const x = CENTER_X + RADIUS * Math.cos(angle);
  const y = CENTER_Y + RADIUS * Math.sin(angle);
  return { x, y, angle };
};

export const CircularCalendar: React.FC<CircularCalendarProps> = ({
  days,
  onDayPress,
  selectedDate,
  currentMonth,
  currentYear,
  onMonthChange,
  today,
}) => {
  // Sort days by day number (1-31) for circular display
  const sortedDays = useMemo(() => {
    return [...days].sort((a, b) => {
      const dayA = parseInt(a.date.split('-')[2]);
      const dayB = parseInt(b.date.split('-')[2]);
      return dayA - dayB;
    });
  }, [days]);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      onMonthChange(11, currentYear - 1);
    } else {
      onMonthChange(currentMonth - 1, currentYear);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      onMonthChange(0, currentYear + 1);
    } else {
      onMonthChange(currentMonth + 1, currentYear);
    }
  };

  // Check if we're on the current month
  const isCurrentMonth = useMemo(() => {
    if (!today) return false;
    const todayDate = new Date(today);
    return todayDate.getMonth() === currentMonth && todayDate.getFullYear() === currentYear;
  }, [today, currentMonth, currentYear]);

  return (
    <View style={styles.container}>
      <View style={styles.calendarWrapper}>
        <Svg width={CALENDAR_SIZE} height={CALENDAR_SIZE}>
          <Defs>
            {/* Glow gradient for each day with dreams */}
            {sortedDays.map((day, index) => {
              const glowIntensity = calculateGlowIntensity(day.dreamCount);
              if (glowIntensity <= 0) return null;
              
              const dayColor = getDayColor(day.dreamCount);
              // Extract RGB from either hex (#RRGGBB) or rgb(...) color string
              let r: string, g: string, b: string;
              const hexMatch = dayColor.match(/^#([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/);
              const rgbMatch = dayColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
              if (hexMatch) {
                r = String(parseInt(hexMatch[1], 16));
                g = String(parseInt(hexMatch[2], 16));
                b = String(parseInt(hexMatch[3], 16));
              } else if (rgbMatch) {
                [, r, g, b] = rgbMatch;
              } else {
                return null;
              }
              
              return (
                <RadialGradient key={`glow-${day.date}`} id={`glow-${day.date}`} cx="50%" cy="50%">
                  <Stop offset="0%" stopColor={`rgb(${r}, ${g}, ${b})`} stopOpacity={glowIntensity * 0.5} />
                  <Stop offset="50%" stopColor={`rgb(${r}, ${g}, ${b})`} stopOpacity={glowIntensity * 0.2} />
                  <Stop offset="100%" stopColor={`rgb(${r}, ${g}, ${b})`} stopOpacity={0} />
                </RadialGradient>
              );
            })}
          </Defs>

          {/* Draw glow circles for days with dreams */}
          {sortedDays.map((day, index) => {
            const glowIntensity = calculateGlowIntensity(day.dreamCount);
            if (glowIntensity <= 0) return null;
            
            const { x, y } = getDayPosition(index, sortedDays.length);
            return (
              <Circle
                key={`glow-circle-${day.date}`}
                cx={x}
                cy={y}
                r={DAY_RADIUS * (1 + glowIntensity * 0.6)} // Subtle glow
                fill={`url(#glow-${day.date})`}
                opacity={0.4}
              />
            );
          })}

        </Svg>

        {/* Day circles as TouchableOpacity overlays */}
        {sortedDays.map((day, index) => {
          const { x, y } = getDayPosition(index, sortedDays.length);
          const isSelected = day.date === selectedDate;
          const dayNumber = getDayNumber(day.date);
          const dayColor = getDayColor(day.dreamCount);
          const isFuture = today ? day.date > today : false;
          
          return (
            <TouchableOpacity
              key={day.date}
              activeOpacity={0.7}
              disabled={isFuture}
              onPress={() => !isFuture && onDayPress(day.date)}
              style={[
                styles.dayTouchable,
                {
                  left: x - DAY_RADIUS,
                  top: y - DAY_RADIUS,
                },
              ]}
            >
              <View
                style={[
                  styles.dayCircle,
                  {
                    backgroundColor: isSelected ? colors.buttonPrimary : dayColor,
                    borderWidth: day.isToday ? 2 : (day.dreamCount > 0 ? 1.5 : 0),
                    borderColor: day.isToday ? colors.buttonPrimary : (day.dreamCount > 0 ? dayColor : 'transparent'),
                    opacity: isFuture ? 0.4 : (day.dreamCount > 0 ? 0.85 : 0.4),
                  },
                ]}
              >
                <Text style={[
                  styles.dayNumberText,
                  { color: day.dreamCount > 0 || isSelected ? colors.white : colors.textSecondary }
                ]}>
                  {dayNumber}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}

        {/* Center text with month navigation */}
        <View style={styles.centerText}>
          <View style={styles.monthNavigation}>
            <TouchableOpacity onPress={handlePrevMonth} style={styles.navButton}>
              <Text style={styles.navButtonText}>‹</Text>
            </TouchableOpacity>
            <View style={styles.monthYearContainer}>
              <Text style={styles.monthText}>{monthNames[currentMonth]}</Text>
              <Text style={styles.yearText}>{currentYear}</Text>
            </View>
            <TouchableOpacity 
              onPress={handleNextMonth} 
              disabled={isCurrentMonth}
              style={[styles.navButton, isCurrentMonth && styles.navButtonDisabled]}
            >
              <Text style={[styles.navButtonText, isCurrentMonth && styles.navButtonTextDisabled]}>›</Text>
            </TouchableOpacity>
          </View>
          {selectedDate && (
            <Text style={styles.selectedDateText}>
              {new Date(selectedDate).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
  },
  calendarWrapper: {
    width: CALENDAR_SIZE,
    height: CALENDAR_SIZE,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayTouchable: {
    position: 'absolute',
    width: DAY_RADIUS * 2,
    height: DAY_RADIUS * 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircle: {
    width: DAY_RADIUS * 2,
    height: DAY_RADIUS * 2,
    borderRadius: DAY_RADIUS,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayNumberText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    textAlign: 'center',
  },
  centerText: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  monthNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  navButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navButtonText: {
    fontSize: 24,
    color: colors.buttonPrimary,
    fontWeight: typography.weights.bold,
  },
  navButtonDisabled: {
    opacity: 0.3,
  },
  navButtonTextDisabled: {
    color: colors.textMuted,
  },
  monthYearContainer: {
    alignItems: 'center',
    marginHorizontal: spacing.md,
  },
  monthText: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
  },
  yearText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: colors.textSecondary,
    marginTop: 2,
  },
  selectedDateText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
});
