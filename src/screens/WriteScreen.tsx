import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackParamList } from '../navigation/types';
import { colors, spacing, typography, borderRadius } from '../theme';
import { Card, Button, MountainWaveBackground } from '../components/ui';
import { VoiceRecordButton } from '../components/ui/VoiceRecordButton';
import { supabase } from '../services/supabaseClient';
import { formatDate, getTodayDate, generateId } from '../utils/date';
import { saveDream, getDreamsByDate, saveDraft, getDraft, clearDraft } from '../utils/storage';
import { Dream } from '../types/dream';
import { UserService } from '../services/userService';
import { getRandomSymbol } from '../components/symbols';
import Svg, { Path } from 'react-native-svg';

type NavigationProp = StackNavigationProp<RootStackParamList>;

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

const WriteScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [todaysDream, setTodaysDream] = useState<Dream | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const autoSaveTimeout = useRef<NodeJS.Timeout | undefined>(undefined);
  const contentInputRef = useRef<TextInput>(null);

  const today = getTodayDate();
  const headerGreeting = displayName ? `Hello, ${displayName}` : 'Hello';

  // Load today's dream or draft and display name when screen gains focus
  useFocusEffect(
    useCallback(() => {
      loadTodaysDream();
      UserService.getDisplayName().then((name) => setDisplayName(name ?? null));
      // Clear any pending auto-save timeout when screen gains focus
      // This prevents stale drafts from loading
      return () => {
        if (autoSaveTimeout.current) {
          clearTimeout(autoSaveTimeout.current);
        }
      };
    }, [])
  );

  const loadTodaysDream = async () => {
    // Only load non-archived dreams (archived dreams don't show on WriteScreen)
    const dreams = await getDreamsByDate(today);
    // Treat any dream without an explicit archived flag as archived (legacy data)
    const nonArchivedDream = dreams.find(d => d.archived === false);
    
    if (nonArchivedDream) {
      // Show existing non-archived dream for today
      setTodaysDream(nonArchivedDream);
      setTitle(nonArchivedDream.title || '');
      setContent(nonArchivedDream.content);
    } else {
      // Load draft if no non-archived dream exists
      const draft = await getDraft();
      if (draft && draft.date === today) {
        // Only load draft if it's from today
        setTitle(draft.title || '');
        setContent(draft.content);
        setTodaysDream(null);
      } else {
        // Clear form for fresh writing
        setTitle('');
        setContent('');
        setTodaysDream(null);
        // Also clear any stale draft that's not from today
        if (draft && draft.date !== today) {
          await clearDraft();
        }
      }
    }
  };

  // Auto-save draft
  useEffect(() => {
    if (autoSaveTimeout.current) {
      clearTimeout(autoSaveTimeout.current);
    }

    if (content.trim()) {
      autoSaveTimeout.current = setTimeout(() => {
        saveDraft({
          date: today,
          title: title || undefined,
          content,
          lastSaved: new Date().toISOString(),
        });
      }, 2000); // Auto-save after 2 seconds of inactivity
    }

    return () => {
      if (autoSaveTimeout.current) {
        clearTimeout(autoSaveTimeout.current);
      }
    };
  }, [title, content, today]);

  const handleSaveDream = async () => {
    if (!content.trim()) return;

    // Clear any pending auto-save to prevent race conditions
    if (autoSaveTimeout.current) {
      clearTimeout(autoSaveTimeout.current);
      autoSaveTimeout.current = undefined;
    }

    setIsSaving(true);
    try {
      const dream: Dream = todaysDream
        ? {
            ...todaysDream,
            title: title || undefined,
            content: content.trim(),
            updatedAt: new Date().toISOString(),
            archived: true, // Mark as archived so it won't show on WriteScreen again
          }
        : {
            id: generateId(),
            date: today,
            title: title || undefined,
            content: content.trim(),
            symbol: getRandomSymbol(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            archived: true, // Mark as archived
          };

      // Save dream locally only (no API calls)
      // Symbols/archetypes will be extracted when user requests AI interpretation
      await saveDream(dream);
      await clearDraft();
      
      // Clear form fields immediately after successful save
      // Do this BEFORE navigation to ensure state is cleared
      setTitle('');
      setContent('');
      setTodaysDream(null);
      
      // Navigate to dream detail page
      navigation.navigate('DreamDetail', { dreamId: dream.id });
    } catch (error) {
      console.error('[WriteScreen] Error saving dream:', error);
      // Don't clear fields on error - user can retry
    } finally {
      setIsSaving(false);
    }
  };


  const handleMenuPress = () => {
    setIsMenuOpen(true);
  };

  const handleCalendarPress = () => {
    navigation.navigate('Calendar');
  };

  // Keyboard vertical offset: no header on this tab, use status bar on Android so padding is correct
  const keyboardVerticalOffset =
    Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 0;

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingBottom: insets.bottom }]}
      behavior="padding"
      keyboardVerticalOffset={keyboardVerticalOffset}
    >
      <MountainWaveBackground height={400} showSun={false} />
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerLeft} onPress={handleMenuPress}>
            <Text style={styles.menuIcon}>☰</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{headerGreeting}</Text>
          <TouchableOpacity onPress={handleCalendarPress} style={styles.headerRight}>
            <CalendarIcon size={24} />
          </TouchableOpacity>
        </View>

        {/* Entry ritual */}
        <Text style={styles.entryRitual}>Take a breath. Let the dream come back.</Text>

        {/* Main Card */}
        <Card style={styles.mainCard}>
          {/* Date Pill */}
          <View style={styles.datePill}>
            <Text style={styles.datePillText}>{formatDate(today)}</Text>
          </View>

          {/* Title Input */}
          <TextInput
            style={styles.titleInput}
            placeholder="Name your dream (optional)"
            placeholderTextColor={colors.textMuted}
            value={title}
            onChangeText={setTitle}
            returnKeyType="next"
            onSubmitEditing={() => contentInputRef.current?.focus()}
          />

          {/* Divider with lines */}
          <View style={styles.linedDivider} />

          {/* Content Input with Voice Recording */}
          <View style={styles.contentInputContainer}>
            <TextInput
              ref={contentInputRef}
              style={styles.contentInput}
              placeholder="Write it as you remember it, without correcting."
              placeholderTextColor={colors.textMuted}
              value={content}
              onChangeText={setContent}
              multiline
              textAlignVertical="top"
              autoFocus={false}
            />
            <View style={styles.voiceButtonContainer}>
              <VoiceRecordButton
                onTranscriptionComplete={(text) => {
                  setContent((prev) => (prev ? `${prev}\n${text}` : text));
                }}
                disabled={isSaving}
              />
            </View>
          </View>
        </Card>

        {/* Spacer above Save dream button */}
        <View style={{ height: spacing.lg }} />
      </ScrollView>

      {/* Bottom Actions */}
      <View style={[styles.bottomActions, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
        <Button
          title={todaysDream ? 'Update dream' : 'Save dream'}
          onPress={handleSaveDream}
          disabled={!content.trim()}
          loading={isSaving}
        />
      </View>

      {/* Side menu */}
      {isMenuOpen && (
        <View style={styles.menuOverlay}>
          <TouchableOpacity style={styles.menuBackdrop} onPress={() => setIsMenuOpen(false)} />
          <View style={[styles.menuContainer, { top: insets.top, paddingTop: spacing.md }]}>
            <View style={styles.menuTop}>
              <Text style={styles.menuTitle}>Menu</Text>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  setIsMenuOpen(false);
                  navigation.navigate('Account');
                }}
              >
                <Text style={styles.menuItemText}>Account</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  setIsMenuOpen(false);
                  navigation.navigate('Privacy');
                }}
              >
                <Text style={styles.menuItemText}>Privacy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  setIsMenuOpen(false);
                  navigation.navigate('Contact');
                }}
              >
                <Text style={styles.menuItemText}>Contact us</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.menuItemBottom}
              onPress={async () => {
                setIsMenuOpen(false);
                try {
                  await supabase.auth.signOut();
                } catch {
                  // ignore, RootNavigator will remain on current session if signOut fails
                }
              }}
            >
              <Text style={styles.menuItemText}>Log out</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
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
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
    paddingTop: spacing.md,
  },
  headerLeft: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuIcon: {
    fontSize: 28,
    color: colors.accent,
  },
  headerTitle: {
    flex: 1,
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.semibold,
    fontFamily: typography.bold,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  headerRight: {
    width: 40,
    alignItems: 'flex-end',
  },
  entryRitual: {
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
  },
  mainCard: {
    minHeight: 400,
    backgroundColor: 'rgba(240, 229, 223, 0.7)', // Semi-transparent to show sun
  },
  datePill: {
    alignSelf: 'flex-start',
    backgroundColor: colors.background,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    marginBottom: spacing.md,
  },
  datePillText: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    fontWeight: typography.weights.medium,
  },
  titleInput: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.medium,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    padding: 0,
  },
  linedDivider: {
    height: 1,
    backgroundColor: colors.inputBorder,
    marginBottom: spacing.md,
  },
  contentInputContainer: {
    position: 'relative',
    minHeight: 300,
  },
  contentInput: {
    fontSize: typography.sizes.md,
    color: colors.textPrimary,
    lineHeight: typography.sizes.md * typography.lineHeights.relaxed,
    minHeight: 300,
    padding: 0,
    paddingRight: 60, // Space for voice button
  },
  voiceButtonContainer: {
    position: 'absolute',
    bottom: spacing.lg,
    right: spacing.sm,
  },
  bottomActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.lg,
    paddingBottom: undefined, // set inline with safe area insets
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  secondaryButton: {
    marginTop: spacing.sm,
  },
  menuOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-start',
    alignItems: 'flex-start', // left-side drawer
  },
  menuBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  menuContainer: {
    position: 'absolute',
    left: 0,
    right: 'auto',
    bottom: 0,
    width: 200,
    backgroundColor: colors.cardBackground,
    padding: spacing.md,
    paddingBottom: Platform.OS === 'ios' ? spacing.xl : spacing.lg,
    borderTopRightRadius: borderRadius.lg,
    borderBottomRightRadius: borderRadius.lg,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 2, height: 0 },
    elevation: 8,
    justifyContent: 'space-between',
  },
  menuTop: {
    flex: 1,
  },
  menuTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  menuItem: {
    paddingVertical: spacing.sm,
  },
  menuItemBottom: {
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: spacing.md,
    paddingTop: spacing.md,
  },
  menuItemText: {
    fontSize: typography.sizes.md,
    color: colors.textPrimary,
  },
});

export default WriteScreen;

