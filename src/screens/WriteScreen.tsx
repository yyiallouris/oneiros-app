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
import { colors, spacing, typography, borderRadius, resolveFloatingTabBarContentInset } from '../theme';
import { Button, PaperBackground, MysticHeader, DesignExportForeground, ActionLoadingSlot } from '../components/ui';
import { VoiceRecordButton } from '../components/ui/VoiceRecordButton';
import { supabase } from '../services/supabaseClient';
import { formatDate, getTodayDate, generateId } from '../utils/date';
import { saveDream, getDreamsByDate, saveDraft, getDraft, clearDraft } from '../utils/storage';
import { Dream } from '../types/dream';
import { UserService } from '../services/userService';
import { VoiceComposerService } from '../services/voiceComposerService';
import { logInfo } from '../services/logger';
import { getRandomSymbol } from '../components/symbols';
import { EditRevisionGuard } from '../utils/editRevisionGuard';

type NavigationProp = StackNavigationProp<RootStackParamList>;
const WRITE_MOUNTAIN_HEIGHT = 320;
const WRITE_CARD_MIN_HEIGHT = 420;
const WRITE_CARD_MIN_HEIGHT_COMPACT = 340;
const WRITE_CONTENT_MIN_HEIGHT = 300;
const WRITE_CONTENT_MIN_HEIGHT_COMPACT = 220;
const SAVE_LOADING_REVEAL_DELAY_MS = 450;
const WRITE_VOICE_TARGET = { surface: 'write', key: 'active' } as const;
const writePalette = {
  background: colors.background,
  secondaryWash: colors.backgroundSecondary,
  primaryInk: colors.textPrimary,
  mutedViolet: colors.textAccent,
  border: colors.border,
  surface: colors.cardGlass,
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
  const [showSaveLoading, setShowSaveLoading] = useState(false);
  const [mainCardBottom, setMainCardBottom] = useState<number | null>(null);
  const [saveDockHeight, setSaveDockHeight] = useState(0);
  const autoSaveTimeout = useRef<NodeJS.Timeout | undefined>(undefined);
  const saveLoadingTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const contentInputRef = useRef<TextInput>(null);
  const contentEditGuardRef = useRef(new EditRevisionGuard());

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
        if (saveLoadingTimeout.current) {
          clearTimeout(saveLoadingTimeout.current);
          saveLoadingTimeout.current = undefined;
        }
      };
    }, [])
  );

  const loadTodaysDream = async () => {
    const hydrationRevision = contentEditGuardRef.current.capture();
    // Only load non-archived dreams (archived dreams don't show on WriteScreen)
    const dreams = await getDreamsByDate(today);
    // Treat any dream without an explicit archived flag as archived (legacy data)
    const nonArchivedDream = dreams.find(d => d.archived === false);
    
    if (nonArchivedDream) {
      // Show existing non-archived dream for today
      setTodaysDream(nonArchivedDream);
      setTitle(nonArchivedDream.title || '');
      if (contentEditGuardRef.current.isCurrent(hydrationRevision)) setContent(nonArchivedDream.content);
    } else {
      // Load draft if no non-archived dream exists
      const draft = await getDraft();
      if (draft && draft.date === today) {
        // Only load draft if it's from today
        setTitle(draft.title || '');
        if (contentEditGuardRef.current.isCurrent(hydrationRevision)) setContent(draft.content);
        setTodaysDream(null);
      } else {
        // Clear form for fresh writing
        setTitle('');
        if (contentEditGuardRef.current.isCurrent(hydrationRevision)) setContent('');
        setTodaysDream(null);
        // Also clear any stale draft that's not from today
        if (draft && draft.date !== today) {
          await clearDraft();
        }
      }
    }
    const voiceComposer = await VoiceComposerService.getSnapshot(WRITE_VOICE_TARGET);
    if (voiceComposer != null && contentEditGuardRef.current.isCurrent(hydrationRevision)) {
      setContent(voiceComposer.text);
      void VoiceComposerService.acknowledgeVisibleSnapshot(voiceComposer);
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
    const totalStartedAt = Date.now();
    logInfo('write_save_dream_tap', {
      hasExistingDream: Boolean(todaysDream),
      contentLength: content.trim().length,
    });

    // Clear any pending auto-save to prevent race conditions
    if (autoSaveTimeout.current) {
      clearTimeout(autoSaveTimeout.current);
      autoSaveTimeout.current = undefined;
    }

    setIsSaving(true);
    saveLoadingTimeout.current = setTimeout(() => {
      setShowSaveLoading(true);
    }, SAVE_LOADING_REVEAL_DELAY_MS);
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

      const saveStartedAt = Date.now();
      await saveDream(dream);
      logInfo('write_save_dream_persist_done', {
        dreamId: dream.id,
        durationMs: Date.now() - saveStartedAt,
      });
      const clearDraftStartedAt = Date.now();
      await clearDraft();
      await VoiceComposerService.clear(WRITE_VOICE_TARGET);
      logInfo('write_save_dream_clear_draft_done', {
        dreamId: dream.id,
        durationMs: Date.now() - clearDraftStartedAt,
      });

      // Navigate to dream detail page
      navigation.navigate('DreamDetail', { dreamId: dream.id });
      logInfo('write_save_dream_navigated', {
        dreamId: dream.id,
        totalMs: Date.now() - totalStartedAt,
      });
    } catch (error) {
      console.error('[WriteScreen] Error saving dream:', error);
      // Don't clear fields on error - user can retry
    } finally {
      if (saveLoadingTimeout.current) {
        clearTimeout(saveLoadingTimeout.current);
        saveLoadingTimeout.current = undefined;
      }
      setShowSaveLoading(false);
      setIsSaving(false);
    }
  };


  const handleMenuPress = () => {
    setIsMenuOpen(true);
  };

  const saveDockBottomInset = resolveFloatingTabBarContentInset(insets.bottom);
  const isCompactHeight = windowHeight < 760;
  const cardMinHeight = isCompactHeight ? WRITE_CARD_MIN_HEIGHT_COMPACT : WRITE_CARD_MIN_HEIGHT;
  const contentMinHeight = isCompactHeight ? WRITE_CONTENT_MIN_HEIGHT_COMPACT : WRITE_CONTENT_MIN_HEIGHT;
  const voiceButtonBottom = isCompactHeight ? spacing.xxl : spacing.lg;
  const contentInputBottomPadding = voiceButtonBottom + 84;
  const isSaveInactive = !content.trim();
  const mountainHeight = WRITE_MOUNTAIN_HEIGHT;
  const mountainTop = mainCardBottom == null ? undefined : Math.max(0, mainCardBottom - mountainHeight);

  return (
    <View style={styles.container}>
      <PaperBackground height={mountainHeight} top={mountainTop} lite />
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
          style={[styles.mainCard, { minHeight: cardMinHeight }]}
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

          <View style={[styles.contentInputContainer, { minHeight: contentMinHeight }]}>
            <TextInput
              ref={contentInputRef}
              style={[styles.contentInput, { minHeight: contentMinHeight, paddingBottom: contentInputBottomPadding }]}
              placeholder="Write it as you remember it, without correcting."
              placeholderTextColor={colors.textMuted}
              value={content}
              onChangeText={(text) => {
                contentEditGuardRef.current.markEdited();
                setContent(text);
                void VoiceComposerService.saveText(WRITE_VOICE_TARGET, text);
              }}
              multiline
              textAlignVertical="top"
              autoFocus={false}
            />
            <View style={[styles.voiceButtonContainer, { bottom: voiceButtonBottom }]}>
              <VoiceRecordButton
                surface="field"
                target={WRITE_VOICE_TARGET}
                getComposerText={() => content}
                onTranscriptionComplete={(text) => {
                  contentEditGuardRef.current.markEdited();
                  setContent(text);
                }}
                disabled={isSaving}
              />
            </View>
          </View>
        </View>
        </ScrollView>

        <View
          testID="write-save-dock"
          onLayout={({ nativeEvent }) => {
            const nextHeight = Math.round(nativeEvent.layout.height);
            if (nextHeight > 0 && nextHeight !== saveDockHeight) {
              setSaveDockHeight(nextHeight);
            }
          }}
          style={[
            styles.saveDock,
            {
              paddingBottom: saveDockBottomInset,
            },
          ]}
        >
          <ActionLoadingSlot
            loading={showSaveLoading}
            loadingProps={{ preset: 'saveDream', style: styles.saveButton }}
          >
            <Button
              title={todaysDream ? 'Update dream' : 'Save dream'}
              onPress={handleSaveDream}
              disabled={isSaveInactive || isSaving}
              size="compact"
              style={styles.saveButton}
            />
          </ActionLoadingSlot>
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
                  bottom: saveDockHeight || saveDockBottomInset,
                  paddingTop: spacing.md,
                },
              ]}
            >
              <View style={styles.menuTop}>
                <Text style={styles.menuTitle}>Menu</Text>
                <TouchableOpacity
                  style={[styles.menuItem, styles.menuItemSection]}
                  onPress={() => {
                    setIsMenuOpen(false);
                    navigation.navigate('Subscription');
                  }}
                >
                  <Text style={styles.menuItemEyebrow}>Subscription</Text>
                  <Text style={styles.menuItemText}>Subscription & Billing</Text>
                </TouchableOpacity>
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
    flexGrow: 1,
    paddingHorizontal: spacing.md,
    paddingTop: 0,
    paddingBottom: spacing.md,
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
    flexGrow: 1,
    minHeight: WRITE_CARD_MIN_HEIGHT,
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
    flexGrow: 1,
    minHeight: WRITE_CONTENT_MIN_HEIGHT,
  },
  contentInput: {
    flexGrow: 1,
    fontSize: typography.sizes.md,
    color: writePalette.primaryInk,
    lineHeight: typography.sizes.md * typography.lineHeights.relaxed,
    minHeight: WRITE_CONTENT_MIN_HEIGHT,
    padding: 0,
    paddingTop: spacing.xs,
    paddingRight: 64,
  },
  voiceButtonContainer: {
    position: 'absolute',
    right: 0,
    alignItems: 'flex-end',
    maxWidth: 190,
  },
  saveDock: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  saveButton: {
    alignSelf: 'center',
    width: '92%',
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
  menuItemSection: {
    marginBottom: spacing.xs,
  },
  menuItemEyebrow: {
    fontSize: typography.sizes.xs,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: colors.textMuted,
    marginBottom: spacing.xs / 2,
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
