import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackParamList } from '../navigation/types';
import { colors, spacing, typography, borderRadius } from '../theme';
import { Button, MountainWaveBackground, MysticHeader, DesignExportForeground } from '../components/ui';
import { VoiceRecordButton } from '../components/ui/VoiceRecordButton';
import { supabase } from '../services/supabaseClient';
import { formatDate, getTodayDate, generateId } from '../utils/date';
import { saveDream, getDreamsByDate, saveDraft, getDraft, clearDraft } from '../utils/storage';
import { Dream } from '../types/dream';
import { UserService } from '../services/userService';
import { getRandomSymbol } from '../components/symbols';

type NavigationProp = StackNavigationProp<RootStackParamList>;
const MIN_FLOATING_TAB_BOTTOM_INSET = Platform.OS === 'android' ? 48 : 8;
const FLOATING_TAB_BAR_HEIGHT = 86;
const SAVE_BUTTON_NAV_GAP_OFFSET = Platform.OS === 'android' ? 44 : 8;
const WRITE_MOUNTAIN_HEIGHT = 320;
const writePalette = {
  background: colors.background,
  secondaryWash: colors.backgroundSecondary,
  primaryInk: colors.textPrimary,
  mutedViolet: colors.textAccent,
  border: colors.border,
  surface: colors.cardGlass,
  button: colors.buttonPrimary,
} as const;

const WriteScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [todaysDream, setTodaysDream] = useState<Dream | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [mainCardBottom, setMainCardBottom] = useState<number | null>(null);
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

  const floatingTabBarInset = Math.max(insets.bottom, MIN_FLOATING_TAB_BOTTOM_INSET);
  const saveBarOffset = floatingTabBarInset + FLOATING_TAB_BAR_HEIGHT - SAVE_BUTTON_NAV_GAP_OFFSET;
  const isCompactHeight = windowHeight < 760;
  const voiceButtonBottom = isCompactHeight ? spacing.xxl : spacing.lg;
  const contentInputBottomPadding = voiceButtonBottom + 28;
  const isSaveDisabled = !content.trim() || isSaving;
  const mountainHeight = WRITE_MOUNTAIN_HEIGHT;
  const mountainTop = mainCardBottom == null ? undefined : Math.max(0, mainCardBottom - mountainHeight);

  return (
    <View
      style={[styles.container, { paddingBottom: insets.bottom }]}
    >
      <MountainWaveBackground height={mountainHeight} top={mountainTop} lite />
      <DesignExportForeground fill>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
        <MysticHeader
          title={headerGreeting}
          style={[styles.headerShell, { paddingTop: insets.top + spacing.xs }]}
          titleStyle={styles.headerTitle}
          left={
            <TouchableOpacity style={styles.headerLeft} onPress={handleMenuPress}>
              <Text style={styles.menuIcon}>⋯</Text>
            </TouchableOpacity>
          }
        />

        {/* Entry ritual */}
        <Text style={styles.entryRitual}>Take a breath. Let the dream come back.</Text>

        <View
          style={styles.mainCard}
          onLayout={({ nativeEvent }) => {
            const { y, height } = nativeEvent.layout;
            setMainCardBottom(y + height);
          }}
        >
          <View pointerEvents="none" style={styles.paperGrain} />
          <View pointerEvents="none" style={styles.paperRuleTop} />
          {/* Date Pill */}
          <View style={styles.datePill}>
            <Text style={styles.datePillText}>{formatDate(today)}</Text>
          </View>

          <TextInput
            style={styles.titleInput}
            placeholder="Name your dream (optional)"
            placeholderTextColor={colors.textMuted}
            value={title}
            onChangeText={setTitle}
            returnKeyType="next"
            onSubmitEditing={() => contentInputRef.current?.focus()}
          />

          <View style={styles.contentInputContainer}>
            <TextInput
              ref={contentInputRef}
              style={[styles.contentInput, { paddingBottom: contentInputBottomPadding }]}
              placeholder="Write it as you remember it, without correcting."
              placeholderTextColor={colors.textMuted}
              value={content}
              onChangeText={setContent}
              multiline
              textAlignVertical="top"
              autoFocus={false}
            />
            <View style={[styles.voiceButtonContainer, { bottom: voiceButtonBottom }]}>
              <VoiceRecordButton
                surface="field"
                onTranscriptionComplete={(text) => {
                  setContent((prev) => (prev ? `${prev}\n${text}` : text));
                }}
                disabled={isSaving}
              />
            </View>
          </View>
        </View>

        {/* Spacer above Save dream button */}
        <View style={{ height: spacing.lg }} />
        </ScrollView>

        {/* Bottom Actions */}
        <View
          style={[
            styles.bottomActions,
            {
              bottom: saveBarOffset,
            },
          ]}
        >
          <Button
            title={todaysDream ? 'Update dream' : 'Save dream'}
            onPress={handleSaveDream}
            disabled={!content.trim()}
            loading={isSaving}
            style={[styles.saveButton, isSaveDisabled && styles.saveButtonDisabled]}
            textStyle={styles.saveButtonText}
          />
        </View>

        {/* Side menu */}
        {isMenuOpen && (
          <View style={styles.menuOverlay}>
            <TouchableOpacity style={styles.menuBackdrop} onPress={() => setIsMenuOpen(false)} />
            <View
              style={[
                styles.menuContainer,
                {
                  top: insets.top,
                  bottom: saveBarOffset,
                  paddingTop: spacing.md,
                },
              ]}
            >
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
                  <Text style={styles.menuItemText}>Privacy & Legal</Text>
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
      </DesignExportForeground>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: writePalette.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingTop: 0,
    paddingBottom: 220,
  },
  headerShell: {
    paddingHorizontal: spacing.xs,
    paddingBottom: spacing.xs,
  },
  headerTitle: {
    marginTop: spacing.xs,
  },
  headerLeft: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xs,
  },
  menuIcon: {
    fontSize: 28,
    color: writePalette.mutedViolet,
  },
  entryRitual: {
    fontSize: typography.sizes.md,
    color: 'rgba(45, 36, 48, 0.68)',
    textAlign: 'center',
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
  },
  mainCard: {
    minHeight: 420,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
    borderRadius: 14,
    backgroundColor: writePalette.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.contourLineFaint,
    shadowColor: colors.shadow,
    shadowOpacity: 0.014,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
    overflow: 'hidden',
  },
  paperGrain: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.accentClayBrown,
    opacity: 0.018,
  },
  paperRuleTop: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    top: spacing.lg,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.contourLineFaint,
    opacity: 0.7,
  },
  datePill: {
    alignSelf: 'flex-start',
    backgroundColor: colors.cardGlassSoft,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: writePalette.border,
  },
  datePillText: {
    fontSize: typography.sizes.sm,
    color: 'rgba(45, 36, 48, 0.62)',
    fontWeight: typography.weights.medium,
  },
  titleInput: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.regular,
    fontFamily: typography.regular,
    color: writePalette.primaryInk,
    marginBottom: spacing.sm,
    padding: 0,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  contentInputContainer: {
    position: 'relative',
    minHeight: 300,
  },
  contentInput: {
    fontSize: typography.sizes.md,
    color: writePalette.primaryInk,
    lineHeight: typography.sizes.md * typography.lineHeights.relaxed,
    minHeight: 300,
    padding: 0,
    paddingTop: spacing.xs,
    paddingRight: 60, // Space for voice button
  },
  voiceButtonContainer: {
    position: 'absolute',
    right: 0,
  },
  bottomActions: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
  },
  saveButton: {
    alignSelf: 'center',
    width: '92%',
    minHeight: 46,
    borderRadius: 18,
    backgroundColor: colors.buttonPrimary90,
    borderColor: colors.buttonEdge,
    shadowColor: writePalette.button,
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  saveButtonDisabled: {
    opacity: 0.68,
  },
  saveButtonText: {
    color: colors.onAccent,
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
    backgroundColor: colors.overlay,
  },
  menuContainer: {
    position: 'absolute',
    left: 0,
    right: 'auto',
    bottom: 0,
    width: 220,
    backgroundColor: colors.cardGlassStrong,
    padding: spacing.md,
    paddingBottom: Platform.OS === 'ios' ? spacing.xl : spacing.lg,
    borderTopRightRadius: borderRadius.lg,
    borderBottomRightRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.contourLineFaint,
    shadowColor: colors.shadow,
    shadowOpacity: 0.18,
    shadowRadius: 14,
    shadowOffset: { width: 2, height: 0 },
    elevation: 8,
    justifyContent: 'space-between',
  },
  menuTop: {
    flex: 1,
  },
  menuTitle: {
    fontSize: typography.sizes.lg,
    fontFamily: typography.bold,
    color: colors.textTitle,
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
