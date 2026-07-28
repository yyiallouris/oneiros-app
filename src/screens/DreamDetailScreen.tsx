import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Alert,
  Clipboard,
} from 'react-native';
import { useFocusEffect, useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackParamList } from '../navigation/types';
import { colors, spacing, typography, borderRadius } from '../theme';
import { Button, PaperBackground, LoadingState, DreamDetailSkeleton, DesignExportForeground, PrimaryIconButton } from '../components/ui';
import { PremiumUpsellModal } from '../components/subscription/PremiumUpsellModal';
import { PhasedTypingText } from '../components/ui/PhasedTypingText';
import { VoiceRecordButton } from '../components/ui/VoiceRecordButton';
import { Dream, Interpretation, ChatMessage } from '../types/dream';
import { getDreamById, getInterpretationByDreamId, saveInterpretation, deleteInterpretation, saveDream } from '../utils/storage';
import { formatDateShort, generateId } from '../utils/date';
import { formatInterpretationMarkdown } from '../utils/formatInterpretationMarkdown';
import {
  DREAM_DETAIL_CHAT_SCROLL_TEST_ID,
  dreamDetailChatScrollViewStyle,
} from './dreamDetailChatLayout';
import { updateInterpretationElementsFromConversation } from '../services/ai';
import { buildDreamDetailDisplayModel, type DreamDetailDisplayModel, type VisibleDreamAnchor } from '../services/dreamDetailDisplay';
import { getInterpretationDepth } from '../services/userSettingsService';
import { MAX_FOLLOW_UP_RESPONSES } from '../constants/interpretation';
import { isOnline } from '../utils/network';
import { OfflineMessage } from '../components/OfflineMessage';
import Svg, { Path } from 'react-native-svg';
import { useSubscription } from '../providers/SubscriptionProvider';
import {
  EntitlementError,
  ensureDreamMetadataExtraction,
  forceDreamMetadataExtractionForDebug,
  generateEntitledDreamReflection,
  generateEntitledFollowupReply,
  hasPendingReflectionJob,
  hasReflectionInFlight,
  REFLECTION_PARTIAL_REVEAL_AFTER_MS,
  ReflectionStillGeneratingError,
  resumeOrAttachDreamReflection,
} from '../services/entitledAiService';
import { getPendingReflectionJob } from '../services/pendingReflectionJobService';
import { getFallbackPlan, getReadOnlyLapseMessage, getTargetPlanForInterval } from '../services/subscriptionService';
import { remoteGetInterpretationById } from '../services/remoteStorage';
import { LocalStorage } from '../services/localStorage';
import { logInfo } from '../services/logger';
import type { BillingInterval, PremiumGateSource } from '../types/subscription';

type NavigationProp = StackNavigationProp<RootStackParamList, 'DreamDetail'>;
type DetailRouteProp = RouteProp<RootStackParamList, 'DreamDetail'>;
const DREAM_DETAIL_MOUNTAIN_HEIGHT = 260;
const METADATA_REFRESH_DELAYS_MS = [4000, 12000, 25000, 45000];
const METADATA_REFRESH_TAIL_DELAY_MS = 60000;
type IconProps = {
  size?: number;
  color?: string;
};

  // Edit icon
  const EditIcon = ({ size = 24, color = colors.buttonPrimary }: IconProps) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );

  // Send icon
  const SendIcon = ({ size = 24, color = colors.buttonPrimary }: IconProps) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );

  // Copy icon
  const CopyIcon = ({ size = 20, color = colors.textSecondary }: IconProps) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );

  // Wave divider
  const WaveDivider: React.FC = () => (
    <View style={styles.waveDivider}>
      <Svg width="100%" height="4" viewBox="0 0 100 4" preserveAspectRatio="none">
        <Path
          d="M0,2 Q25,0 50,2 T100,2"
          stroke={colors.buttonPrimary}
          strokeWidth={1.5}
          fill="none"
          opacity={0.3}
        />
      </Svg>
    </View>
  );

  interface ChatBubbleProps {
    message: ChatMessage;
    isUser: boolean;
    isTyping?: boolean;
    isStreaming?: boolean;
    onTypingComplete?: () => void;
    onCopy?: (text: string) => void;
    showSettleFooter?: boolean;
  }

  // Component to render text with italic styling for "Evidence" phrases
  // This component handles both markdown formatting AND italic styling for evidence phrases
  const FormattedMessageText = React.memo<{ text: string; isUser: boolean }>(({ text, isUser }) => {
    if (isUser) {
      const displayText = formatInterpretationMarkdown(text);
      return <Text style={[styles.messageText, styles.userMessageText]}>{displayText}</Text>;
    }

    // First, format markdown (but preserve evidence phrases)
    let formatted = formatInterpretationMarkdown(text);
    
    // Parse text and identify parts that should be italic
    // For AI messages: make ONLY "Evidence" phrases italic
    const parts: Array<{ text: string; italic: boolean }> = [];
    
    // Pattern to match "Evidence:" or "Evidence phase:" or "Evidence phrase:" followed by text
    // Match after formatInterpretationMarkdown has processed it (so it might be "Evidence:" or "• Evidence:" etc)
    // Simple pattern that matches both with and without bullet point
    const evidenceRegex = /(•\s*)?(Evidence\s*(?:phase|phrase)?\s*:?\s*)([^\n]*)/gi;
    
    let match;
    const matches: Array<{ start: number; end: number; bullet: string; prefix: string; content: string }> = [];
    
    // Find all evidence matches
    evidenceRegex.lastIndex = 0;
    while ((match = evidenceRegex.exec(formatted)) !== null) {
      matches.push({
        start: match.index,
        end: match.index + match[0].length,
        bullet: match[1] || '', // Bullet point if present (e.g., "• ")
        prefix: match[2], // "Evidence phrase: "
        content: match[3], // The actual evidence text
      });
    }
    
    
    // Sort matches by position
    matches.sort((a, b) => a.start - b.start);
    
    // Build parts array
    let currentIndex = 0;
    for (const m of matches) {
      // Add text before match
      if (m.start > currentIndex) {
        parts.push({ text: formatted.substring(currentIndex, m.start), italic: false });
      }
      // Add bullet point as non-italic (if present)
      if (m.bullet) {
        parts.push({ text: m.bullet, italic: false }); // "• " not italic
      }
      // Add "Evidence phrase:" in italic
      parts.push({ text: m.prefix, italic: true }); // "Evidence phrase: " in italic
      // Add evidence content in italic
      parts.push({ text: m.content, italic: true }); // Content in italic
      currentIndex = m.end;
    }
    
    // Add remaining text
    if (currentIndex < formatted.length) {
      parts.push({ text: formatted.substring(currentIndex), italic: false });
    }
    
    // If no matches found, return formatted text as-is
    if (matches.length === 0) {
      return (
        <Text style={styles.messageText} textBreakStrategy="highQuality" selectable={true}>
          {formatted}
        </Text>
      );
    }
    
    return (
      <Text style={styles.messageText} textBreakStrategy="highQuality" selectable={true}>
        {parts.map((part, idx) => {
          if (part.italic && part.text.trim()) {
            return (
              <Text key={idx} style={styles.italicText}>
                {part.text}
              </Text>
            );
          }
          return part.text;
        })}
      </Text>
    );
  });

  FormattedMessageText.displayName = 'FormattedMessageText';

  const SETTLE_FOOTER = 'This feels like a good point to pause and let the dream settle.\nYou can return tomorrow, or begin a new reflection.';

  const ChatBubble = React.memo<ChatBubbleProps>(({ message, isUser, isTyping = false, isStreaming = false, onTypingComplete, onCopy, showSettleFooter = false }) => {
    const handleCopy = () => {
      try {
        if (onCopy) {
          onCopy(message.content); // Copy original content with markdown
        } else if (Clipboard && Clipboard.setString) {
          Clipboard.setString(message.content);
          Alert.alert('Copied', 'Message copied to clipboard');
        } else {
          Alert.alert('Error', 'Clipboard not available');
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to copy message');
      }
    };
    
    return (
      <View style={[styles.messageContainer, isUser && styles.userMessageContainer]}>
        {/* Assistant text sits on the chat panel surface — no nested card. */}
        <View style={isUser ? styles.userBubble : styles.assistantMessage}>
          {/* LOCKED UX (user approval required to change): live stream + settle typing
              must use PhasedTypingText. Do NOT replace isStreaming with instant
              FormattedMessageText dumps — see flows-06 Locked UX contract. */}
          {(isTyping || isStreaming) && !isUser ? (
            <PhasedTypingText
              text={message.content}
              onComplete={onTypingComplete}
              style={styles.messageText}
            />
          ) : (
            <>
              <FormattedMessageText text={message.content || ''} isUser={isUser} />
              {showSettleFooter && (
                <Text style={styles.settleFooter}>{SETTLE_FOOTER}</Text>
              )}
            </>
          )}
          {!isUser && !isTyping && !isStreaming && (
            <TouchableOpacity 
              style={styles.copyButton} 
              onPress={handleCopy}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <CopyIcon size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  });

  ChatBubble.displayName = 'ChatBubble';

  const AnchorCard = React.memo<{ anchor: VisibleDreamAnchor }>(({ anchor }) => (
    <View style={styles.anchorCard}>
      <Text style={styles.anchorLabel}>{anchor.label}</Text>
      {anchor.uiMeaning ? (
        <Text style={styles.anchorMeaning} numberOfLines={2}>
          {anchor.uiMeaning}
        </Text>
      ) : null}
    </View>
  ));

  AnchorCard.displayName = 'AnchorCard';

  const DreamFieldSummary = React.memo<{ model: DreamDetailDisplayModel }>(({ model }) => {
    const hasEssence = Boolean(model.essenceTitle || model.essenceLine);
    const hasMovement = Boolean(model.mainTension || model.movementLine);
    if (!hasEssence && model.anchors.length === 0 && !hasMovement) return null;

    return (
      <View style={styles.fieldSummary}>
        {hasEssence && (
          <View style={styles.essenceBlock}>
            <Text style={styles.summarySectionTitle}>Dream essence</Text>
            {model.essenceTitle ? <Text style={styles.essenceTitle}>{model.essenceTitle}</Text> : null}
            {model.essenceLine ? <Text style={styles.essenceLine}>{model.essenceLine}</Text> : null}
          </View>
        )}

        {model.anchors.length > 0 && (
          <View style={styles.summaryBlock}>
            <Text style={styles.summarySectionTitle}>Key anchors</Text>
            <View style={styles.anchorGrid}>
              {model.anchors.map((anchor, index) => (
                <AnchorCard key={`${anchor.label}-${index}`} anchor={anchor} />
              ))}
            </View>
          </View>
        )}

        {hasMovement && (
          <View style={styles.movementBlock}>
            <Text style={styles.summarySectionTitle}>Inner movement</Text>
            {model.mainTension ? <Text style={styles.movementTitle}>{model.mainTension}</Text> : null}
            {model.movementLine ? <Text style={styles.movementLine}>{model.movementLine}</Text> : null}
          </View>
        )}
      </View>
    );
  });

  DreamFieldSummary.displayName = 'DreamFieldSummary';

  const SymbolicLayersAccordion = React.memo<{ model: DreamDetailDisplayModel }>(({ model }) => {
    const [expanded, setExpanded] = useState(false);
    type TagRow = { kind: 'tags'; title: string; items: string[] };
    type EchoRow = {
      kind: 'echoes';
      title: string;
      items: Array<{ title: string; subtitle?: string; body: string }>;
    };
    type LayerRow = TagRow | EchoRow;

    const fabricRows: TagRow[] = (
      [
        { kind: 'tags' as const, title: 'Emotional Weather', items: model.symbolicLayers.emotionalWeather },
        { kind: 'tags' as const, title: 'Dream Places', items: model.symbolicLayers.dreamSetting },
        { kind: 'tags' as const, title: 'Relationship Field', items: model.symbolicLayers.relationshipField },
        { kind: 'tags' as const, title: 'Thresholds', items: model.symbolicLayers.thresholds },
        { kind: 'tags' as const, title: 'Dream Motifs', items: model.symbolicLayers.repeatingPatterns },
      ] satisfies TagRow[]
    ).filter((row) => row.items.length > 0);

    const archetypalItems = model.symbolicLayers.archetypalEchoes;
    const mythicItems = model.symbolicLayers.mythicEchoes;
    const echoRows: LayerRow[] = (
      [
        { kind: 'tags' as const, title: 'Inner Tensions', items: model.symbolicLayers.innerTensions },
        {
          kind: 'echoes' as const,
          title: archetypalItems.length === 1 ? 'Archetypal Echo' : 'Archetypal Echoes',
          items: archetypalItems,
        },
        {
          kind: 'echoes' as const,
          title: 'Mythic Echo',
          items: mythicItems,
        },
      ] satisfies LayerRow[]
    ).filter((row) => row.items.length > 0);

    const groups: Array<{ title: string; rows: LayerRow[] }> = [
      { title: 'Dream Fabric', rows: fabricRows },
      { title: 'Interpretive Echoes', rows: echoRows },
    ].filter((group) => group.rows.length > 0);

    if (groups.length === 0) return null;

    return (
      <View style={styles.symbolicLayersPanel}>
        <TouchableOpacity
          style={styles.symbolicLayersHeader}
          onPress={() => setExpanded((value) => !value)}
          activeOpacity={0.7}
        >
          <Text style={styles.symbolicLayersTitle}>Explore symbolic layers</Text>
          <Text style={styles.symbolicLayersCaret}>{expanded ? '^' : 'v'}</Text>
        </TouchableOpacity>
        {expanded && (
          <View style={styles.symbolicLayersBody}>
            {groups.map((group) => (
              <View key={group.title} style={styles.layerGroup}>
                <Text style={styles.layerGroupTitle}>{group.title}</Text>
                {group.rows.map((row) => (
                  <View key={row.title} style={styles.layerRow}>
                    <Text style={styles.layerTitle}>{row.title}</Text>
                    {row.kind === 'tags' ? (
                      <Text style={styles.layerText}>{row.items.join(', ')}</Text>
                    ) : (
                      <View style={styles.layerEchoList}>
                        {row.items.map((echo) => (
                          <View
                            key={`${row.title}-${echo.title}-${echo.subtitle ?? ''}`}
                            style={styles.layerEchoItem}
                          >
                            <Text style={styles.layerEchoTitle}>{echo.title}</Text>
                            {echo.subtitle ? (
                              <Text style={styles.layerEchoSubtitle}>{echo.subtitle}</Text>
                            ) : null}
                            {echo.body ? <Text style={styles.layerText}>{echo.body}</Text> : null}
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                ))}
              </View>
            ))}
          </View>
        )}
      </View>
    );
  });

  SymbolicLayersAccordion.displayName = 'SymbolicLayersAccordion';

  const DreamDetailScreen: React.FC = () => {
    const navigation = useNavigation<NavigationProp>();
    const route = useRoute<DetailRouteProp>();
    const { dreamId } = route.params;
    const insets = useSafeAreaInsets();
    const { status: subscriptionStatus, products, purchasePlan, purchasingPlanCode } = useSubscription();

    const [dream, setDream] = useState<Dream | null>(null);
    const [interpretation, setInterpretation] = useState<Interpretation | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingInitial, setIsLoadingInitial] = useState(true);
    const [isGeneratingInitial, setIsGeneratingInitial] = useState(false);
    const [reflectionLoadingPhase, setReflectionLoadingPhase] = useState<'starting' | 'working' | 'background'>('starting');
    const [typingMessageId, setTypingMessageId] = useState<string | null>(null);
    const [streamingReflectionMessageId, setStreamingReflectionMessageId] = useState<string | null>(null);
    const [showChat, setShowChat] = useState(false);
    const [showLimitMessageOnTap, setShowLimitMessageOnTap] = useState(false);
    const [showOfflineMessage, setShowOfflineMessage] = useState(false);
    const [billingInterval, setBillingInterval] = useState<BillingInterval>('monthly');
    const [upsellVisible, setUpsellVisible] = useState(false);
    const [upsellSource, setUpsellSource] = useState<PremiumGateSource>('followup');

    const flatListRef = useRef<ScrollView>(null);
    const scrollViewRef = useRef<ScrollView>(null);
    const metadataRefreshTimers = useRef<Array<ReturnType<typeof setTimeout>>>([]);
    const metadataRefreshGenerationRef = useRef(0);
    const streamingReflectionMessageIdRef = useRef<string | null>(null);
    const hadStreamingReflectionRef = useRef(false);
    const reflectionFocusGenerationRef = useRef(0);
    const premiumPlan = useMemo(
      () =>
        products.find((product) => product.planCode === getTargetPlanForInterval(billingInterval)) ??
        getFallbackPlan(getTargetPlanForInterval(billingInterval)),
      [billingInterval, products]
    );
    const hasPaidAccess = subscriptionStatus?.hasPaidAccess ?? false;

    useEffect(() => {
      if (!isGeneratingInitial) {
        setReflectionLoadingPhase('starting');
        return;
      }

      setReflectionLoadingPhase('starting');
      const workingTimer = setTimeout(() => setReflectionLoadingPhase('working'), 8000);
      const backgroundTimer = setTimeout(() => setReflectionLoadingPhase('background'), 20000);

      return () => {
        clearTimeout(workingTimer);
        clearTimeout(backgroundTimer);
      };
    }, [isGeneratingInitial]);

    const clearMetadataRefreshTimers = useCallback(() => {
      metadataRefreshGenerationRef.current += 1;
      metadataRefreshTimers.current.forEach((timer) => clearTimeout(timer));
      metadataRefreshTimers.current = [];
    }, []);

    const refreshInterpretationMetadata = useCallback(async (interpretationId: string): Promise<boolean> => {
      const startedAt = Date.now();
      logInfo('dream_detail_metadata_refresh_start', { dreamId, interpretationId });
      try {
        const refreshed = await remoteGetInterpretationById(interpretationId);
        if (!refreshed || refreshed.metadata_status === 'pending') {
          logInfo('dream_detail_metadata_refresh_pending', {
            dreamId,
            interpretationId,
            durationMs: Date.now() - startedAt,
          });
          return false;
        }

        await LocalStorage.saveInterpretation(refreshed);
        setInterpretation((current) => {
          if (current?.id !== refreshed.id) return current;
          return {
            ...refreshed,
            messages: current.messages.length > refreshed.messages.length ? current.messages : refreshed.messages,
          };
        });
        setMessages((current) => (current.length > refreshed.messages.length ? current : refreshed.messages));
        logInfo('dream_detail_metadata_refresh_done', {
          dreamId,
          interpretationId,
          metadataStatus: refreshed.metadata_status,
          durationMs: Date.now() - startedAt,
        });
        return true;
      } catch (error) {
        console.warn('[DreamDetail] Failed to refresh interpretation metadata:', error);
        return false;
      }
    }, []);

    const scheduleMetadataRefresh = useCallback((nextInterpretation: Interpretation) => {
      if (
        nextInterpretation.metadata_status !== 'pending' &&
        nextInterpretation.metadata_status !== 'failed'
      ) {
        return;
      }
      clearMetadataRefreshTimers();
      const refreshGeneration = metadataRefreshGenerationRef.current;
      logInfo('dream_detail_metadata_refresh_scheduled', {
        dreamId,
        interpretationId: nextInterpretation.id,
        refreshDelaysMs: METADATA_REFRESH_DELAYS_MS.join(','),
        tailDelayMs: METADATA_REFRESH_TAIL_DELAY_MS,
      });

      const queueRefreshAttempt = (
        delayMs: number,
        remainingDelaysMs: number[],
        tailPollingStarted: boolean
      ) => {
        const timer = setTimeout(() => {
          void refreshInterpretationMetadata(nextInterpretation.id).then((updated) => {
            if (metadataRefreshGenerationRef.current !== refreshGeneration) return;
            if (updated) {
              clearMetadataRefreshTimers();
              return;
            }

            const [nextDelayMs, ...restDelaysMs] = remainingDelaysMs;
            if (typeof nextDelayMs === 'number') {
              queueRefreshAttempt(nextDelayMs, restDelaysMs, tailPollingStarted);
              return;
            }

            if (!tailPollingStarted) {
              logInfo('dream_detail_metadata_refresh_tail_started', {
                dreamId,
                interpretationId: nextInterpretation.id,
                tailDelayMs: METADATA_REFRESH_TAIL_DELAY_MS,
              });
            }
            queueRefreshAttempt(METADATA_REFRESH_TAIL_DELAY_MS, [], true);
          });
        }, delayMs);
        metadataRefreshTimers.current.push(timer);
      };

      void ensureDreamMetadataExtraction(nextInterpretation.id).then((result) => {
        if (result?.metadata_status === 'ready' || result?.metadata_status === 'failed') {
          void refreshInterpretationMetadata(nextInterpretation.id).then((updated) => {
            if (metadataRefreshGenerationRef.current !== refreshGeneration) return;
            if (updated) clearMetadataRefreshTimers();
          });
        }
      });

      void refreshInterpretationMetadata(nextInterpretation.id).then((updated) => {
        if (metadataRefreshGenerationRef.current !== refreshGeneration) return;
        if (updated) {
          clearMetadataRefreshTimers();
          return;
        }
        const [firstDelayMs, ...restDelaysMs] = METADATA_REFRESH_DELAYS_MS;
        if (typeof firstDelayMs === 'number') {
          queueRefreshAttempt(firstDelayMs, restDelaysMs, false);
        }
      });
    }, [clearMetadataRefreshTimers, refreshInterpretationMetadata]);

    const handlePartialReflection = useCallback((progress: { text: string; updatedAt?: string; elapsedMs: number }) => {
      const text = progress.text.trim();
      if (!text) return;
      // Stable id per dream so leave/reenter can resume the same bubble.
      const messageId = streamingReflectionMessageIdRef.current ?? `streaming-reflection-${dreamId}`;
      streamingReflectionMessageIdRef.current = messageId;
      hadStreamingReflectionRef.current = true;
      setStreamingReflectionMessageId(messageId);
      setTypingMessageId(null);
      setShowChat(true);
      setMessages((current) => {
        const nextMessage: ChatMessage = {
          id: messageId,
          role: 'assistant',
          content: text,
          timestamp: progress.updatedAt ?? new Date().toISOString(),
        };
        const existingIndex = current.findIndex((message) => message.id === messageId);
        if (existingIndex >= 0) {
          const next = [...current];
          next[existingIndex] = nextMessage;
          return next;
        }
        return [...current, nextMessage];
      });
      logInfo('dream_detail_reflection_partial_visible', {
        dreamId,
        elapsedMs: progress.elapsedMs,
        partialLength: text.length,
      });
    }, [dreamId]);

    const applyCommittedInterpretation = useCallback(
      (nextInterpretation: Interpretation, options?: { openChat?: boolean; typeFinal?: boolean }) => {
        setInterpretation(nextInterpretation);
        setMessages(nextInterpretation.messages);
        setStreamingReflectionMessageId(null);
        streamingReflectionMessageIdRef.current = null;
        const shouldTypeFinal =
          options?.typeFinal ?? !hadStreamingReflectionRef.current;
        scheduleMetadataRefresh(nextInterpretation);
        setTypingMessageId(shouldTypeFinal ? nextInterpretation.messages[0]?.id ?? null : null);
        hadStreamingReflectionRef.current = false;
        if (options?.openChat) {
          setShowChat(true);
        } else {
          setShowChat(false);
        }
      },
      [scheduleMetadataRefresh]
    );

    const awaitReflectionUntilSettled = useCallback(
      async (
        dreamKey: string,
        onPartial: (progress: { text: string; updatedAt?: string; elapsedMs: number }) => void,
        isCurrent: () => boolean
      ): Promise<Interpretation | null> => {
        while (isCurrent()) {
          try {
            return await resumeOrAttachDreamReflection(dreamKey, {
              onPartialReflection: onPartial,
            });
          } catch (error) {
            if (error instanceof ReflectionStillGeneratingError && isCurrent()) {
              logInfo('dream_detail_reflection_still_generating_retry', {
                dreamId: dreamKey,
                quotaEventId: error.quotaEventId,
              });
              continue;
            }
            throw error;
          }
        }
        return null;
      },
      []
    );

    useFocusEffect(
      useCallback(() => {
        const focusGeneration = ++reflectionFocusGenerationRef.current;
        const isCurrent = () => reflectionFocusGenerationRef.current === focusGeneration;

        const loadDreamData = async () => {
          // Rejoining an in-flight reflection must not flash the full-page loader.
          const rejoiningInFlight = hasReflectionInFlight(dreamId);
          if (!rejoiningInFlight) {
            setIsLoadingInitial(true);
          }
          try {
            const dreamData = await getDreamById(dreamId);
            if (!isCurrent()) return;
            setDream(dreamData);

            if (!dreamData) return;

            try {
              const interpretationData = await getInterpretationByDreamId(dreamId);
              if (!isCurrent()) return;

              if (interpretationData) {
                const isMockResponse =
                  interpretationData.messages[0]?.content?.includes(
                    'Thank you for sharing this dream. Let me reflect on it from a Jungian perspective:'
                  ) &&
                  interpretationData.messages[0]?.content?.includes(
                    'What emotions arose most strongly during the dream?'
                  );

                if (isMockResponse) {
                  await deleteInterpretation(interpretationData.id);
                } else {
                  setInterpretation(interpretationData);
                  setMessages(interpretationData.messages);
                  scheduleMetadataRefresh(interpretationData);
                  setTypingMessageId(null);
                  setShowChat(false);
                  return;
                }
              }

              const pendingJob = await getPendingReflectionJob(dreamId);
              const inFlight = hasReflectionInFlight(dreamId);
              if (!isCurrent()) return;

              if (inFlight || pendingJob) {
                setIsLoadingInitial(false);
                setIsGeneratingInitial(true);

                const startedAtMs = pendingJob ? Date.parse(pendingJob.startedAt) : NaN;
                const elapsedMs = Number.isFinite(startedAtMs) ? Date.now() - startedAtMs : 0;
                const alreadyHadStreamUi = Boolean(streamingReflectionMessageIdRef.current);
                // If text was already streaming (or past the reveal threshold), keep the chat
                // surface — do not snap back to the calm skeleton loading panel.
                const preferStreamUi =
                  alreadyHadStreamUi || elapsedMs >= REFLECTION_PARTIAL_REVEAL_AFTER_MS;

                if (preferStreamUi) {
                  const messageId =
                    streamingReflectionMessageIdRef.current ?? `streaming-reflection-${dreamId}`;
                  streamingReflectionMessageIdRef.current = messageId;
                  setStreamingReflectionMessageId(messageId);
                  setShowChat(true);
                  // Keep any already-streamed assistant text; do not wipe messages.
                  logInfo('dream_detail_reflection_resume_stream_ui', {
                    dreamId,
                    elapsedMs,
                    alreadyHadStreamUi,
                    inFlight,
                  });
                } else {
                  // Early resume (before first partial reveal): calm skeleton is correct.
                  setStreamingReflectionMessageId(null);
                  streamingReflectionMessageIdRef.current = null;
                  hadStreamingReflectionRef.current = false;
                }

                try {
                  const resumed = await awaitReflectionUntilSettled(
                    dreamId,
                    handlePartialReflection,
                    isCurrent
                  );
                  if (!isCurrent() || !resumed) return;
                  applyCommittedInterpretation(resumed, {
                    openChat: true,
                    // Resumed text is already complete — skip typewriter replay.
                    typeFinal: false,
                  });
                  logInfo('dream_detail_reflection_resumed', {
                    dreamId,
                    interpretationId: resumed.id,
                  });
                } catch (error) {
                  if (!isCurrent()) return;
                  console.warn('[DreamDetail] Failed to resume reflection:', error);
                  if (error instanceof EntitlementError) {
                    Alert.alert('Reflection unavailable', error.message);
                  }
                } finally {
                  if (isCurrent()) setIsGeneratingInitial(false);
                }
                return;
              }

              // No pending handle — quiet attach if server already finished while away.
              const attached = await resumeOrAttachDreamReflection(dreamId);
              if (!isCurrent() || !attached) return;
              applyCommittedInterpretation(attached, { openChat: false, typeFinal: false });
              logInfo('dream_detail_reflection_attached_remote', {
                dreamId,
                interpretationId: attached.id,
              });
            } catch (error) {
              console.warn('[DreamDetail] Failed to load interpretation:', error);
            }
          } catch (error) {
            console.error('[DreamDetail] Failed to load dream:', error);
          } finally {
            if (isCurrent()) setIsLoadingInitial(false);
          }
        };

        void loadDreamData();
        return () => {
          reflectionFocusGenerationRef.current += 1;
          setTypingMessageId(null);
          clearMetadataRefreshTimers();
        };
      }, [
        dreamId,
        clearMetadataRefreshTimers,
        scheduleMetadataRefresh,
        applyCommittedInterpretation,
        awaitReflectionUntilSettled,
        handlePartialReflection,
      ])
    );

    const animateChatOpen = () => {
      // Chat opens immediately, no animation needed
      setShowChat(true);
    };

    const animateChatClose = () => {
      setShowChat(false);
      if (
        interpretation?.metadata_status === 'pending' ||
        interpretation?.metadata_status === 'failed'
      ) {
        void ensureDreamMetadataExtraction(interpretation.id).then((result) => {
          if (result?.metadata_status === 'ready' || result?.metadata_status === 'failed') {
            void refreshInterpretationMetadata(interpretation.id);
          }
        });
        void refreshInterpretationMetadata(interpretation.id);
      }
    };

    const generateInitialAIInterpretation = async (dreamData: Dream) => {
      const totalStartedAt = Date.now();
      const focusGeneration = reflectionFocusGenerationRef.current;
      const isCurrent = () => reflectionFocusGenerationRef.current === focusGeneration;
      logInfo('dream_detail_reflection_flow_start', {
        dreamId: dreamData.id,
        mode: 'generate',
      });
      setIsGeneratingInitial(true);
      setStreamingReflectionMessageId(null);
      streamingReflectionMessageIdRef.current = null;
      hadStreamingReflectionRef.current = false;
      try {
        const saveStartedAt = Date.now();
        await saveDream(dreamData);
        logInfo('dream_detail_reflection_save_dream_done', {
          dreamId: dreamData.id,
          durationMs: Date.now() - saveStartedAt,
        });
        const depthStartedAt = Date.now();
        const depth = await getInterpretationDepth();
        logInfo('dream_detail_reflection_depth_loaded', {
          dreamId: dreamData.id,
          depth,
          durationMs: Date.now() - depthStartedAt,
        });
        const reflectionStartedAt = Date.now();

        let newInterpretation: Interpretation | null = null;
        try {
          newInterpretation = await generateEntitledDreamReflection(
            dreamData,
            depth,
            'dream_reflection_generate',
            { onPartialReflection: handlePartialReflection }
          );
        } catch (error) {
          if (!(error instanceof ReflectionStillGeneratingError) || !isCurrent()) {
            throw error;
          }
          logInfo('dream_detail_reflection_soft_timeout_resume', {
            dreamId: dreamData.id,
            quotaEventId: error.quotaEventId,
          });
          newInterpretation = await awaitReflectionUntilSettled(
            dreamData.id,
            handlePartialReflection,
            isCurrent
          );
        }

        if (!newInterpretation || !isCurrent()) return;

        logInfo('dream_detail_reflection_service_done', {
          dreamId: dreamData.id,
          interpretationId: newInterpretation.id,
          metadataStatus: newInterpretation.metadata_status,
          durationMs: Date.now() - reflectionStartedAt,
        });

        applyCommittedInterpretation(newInterpretation, { openChat: true });
        logInfo('dream_detail_reflection_flow_done', {
          dreamId: dreamData.id,
          interpretationId: newInterpretation.id,
          totalMs: Date.now() - totalStartedAt,
        });
      } catch (error: any) {
        if (!isCurrent()) return;
        console.error('[DreamDetail] Error generating interpretation:', error);
        const partialMessageId = streamingReflectionMessageIdRef.current;
        if (partialMessageId) {
          setMessages((current) => current.filter((message) => message.id !== partialMessageId));
          setStreamingReflectionMessageId(null);
          streamingReflectionMessageIdRef.current = null;
          hadStreamingReflectionRef.current = false;
          if (!interpretation) setShowChat(false);
        }
        if (error instanceof EntitlementError) {
          Alert.alert(
            'Reflection unavailable',
            error.message,
            error.premiumRequired || error.reason === 'free_weekly_reflection_unavailable'
              ? [
                  { text: 'Not now', style: 'cancel' },
                  { text: 'See Premium', onPress: () => setUpsellVisible(true) },
                ]
              : [{ text: 'OK' }]
          );
        } else if (!(error instanceof ReflectionStillGeneratingError)) {
          const errorMessage = error?.message || 'Failed to generate interpretation. Please try again.';
          Alert.alert('Error', errorMessage);
        }
      } finally {
        if (isCurrent()) setIsGeneratingInitial(false);
      }
    };

    const handleAskAI = async () => {
      if (!dream) return;
      const startedAt = Date.now();
      logInfo('dream_detail_reflect_tap', { dreamId: dream.id });
      
      // Check if online before proceeding
      const online = await isOnline();
      logInfo('dream_detail_reflect_online_checked', {
        dreamId: dream.id,
        online,
        durationMs: Date.now() - startedAt,
      });
      if (!online) {
        setShowOfflineMessage(true);
        // Hide message after 5 seconds
        setTimeout(() => setShowOfflineMessage(false), 5000);
        return;
      }
      
      setShowOfflineMessage(false);
      await generateInitialAIInterpretation(dream);
    };

    const handleUpdateInterpretation = async () => {
      if (!dream || !interpretation) return;

      if (!hasPaidAccess) {
        setUpsellSource('regenerate');
        setUpsellVisible(true);
        return;
      }

      // Check if online before proceeding
      const online = await isOnline();
      if (!online) {
        setShowOfflineMessage(true);
        // Hide message after 5 seconds
        setTimeout(() => setShowOfflineMessage(false), 5000);
        return;
      }

      setShowOfflineMessage(false);
      setIsGeneratingInitial(true);
      setStreamingReflectionMessageId(null);
      streamingReflectionMessageIdRef.current = null;
      hadStreamingReflectionRef.current = false;
      try {
        const depth = await getInterpretationDepth();
        const updatedInterpretation = await generateEntitledDreamReflection(
          dream,
          depth,
          'dream_reflection_regenerate',
          { onPartialReflection: handlePartialReflection }
        );

        setInterpretation(updatedInterpretation);
        setMessages(updatedInterpretation.messages);
        setStreamingReflectionMessageId(null);
        streamingReflectionMessageIdRef.current = null;
        const shouldTypeFinalReflection = !hadStreamingReflectionRef.current;
        scheduleMetadataRefresh(updatedInterpretation);
        setTypingMessageId(shouldTypeFinalReflection ? updatedInterpretation.messages[0]?.id ?? null : null);
        hadStreamingReflectionRef.current = false;

        // Show chat
        setShowChat(true);
      } catch (error: any) {
        console.error('[DreamDetail] Error updating interpretation:', error);
        const partialMessageId = streamingReflectionMessageIdRef.current;
        if (partialMessageId) {
          setMessages((current) => current.filter((message) => message.id !== partialMessageId));
          setStreamingReflectionMessageId(null);
          streamingReflectionMessageIdRef.current = null;
          hadStreamingReflectionRef.current = false;
        }
        if (error instanceof EntitlementError) {
          if (error.premiumRequired || error.readOnlyAfterLapse) {
            setUpsellSource('regenerate');
            setUpsellVisible(true);
          }
          Alert.alert('Reflection unavailable', error.message);
        } else {
          const errorMessage = error?.message || 'Failed to update interpretation. Please try again.';
          Alert.alert('Error', errorMessage);
        }
      } finally {
        setIsGeneratingInitial(false);
      }
    };

    const assistantMessages = useMemo(() => messages.filter((m) => m.role === 'assistant'), [messages]);
    const assistantCount = assistantMessages.length;
    const lastAssistant = assistantMessages[assistantMessages.length - 1] ?? null;
    const followupRepliesUsed = interpretation?.chat_replies_used ?? Math.max(assistantCount - 1, 0);
    const followupRepliesLimit = interpretation?.chat_replies_limit ?? MAX_FOLLOW_UP_RESPONSES;
    const reflectionLimitReached = followupRepliesUsed >= followupRepliesLimit;
    const premiumReflectionReadOnly = interpretation?.reflection_origin === 'paid_cycle' && !hasPaidAccess;

    const handleSendMessage = async () => {
      if (!inputText.trim() || !dream || !interpretation || isLoading) return;
      if (premiumReflectionReadOnly) {
        setUpsellSource('followup');
        setUpsellVisible(true);
        return;
      }
      if (reflectionLimitReached) return;

      const online = await isOnline();
      if (!online) {
        setShowOfflineMessage(true);
        setTimeout(() => setShowOfflineMessage(false), 5000);
        return;
      }
      setShowOfflineMessage(false);

      const messageContent = inputText.trim();
      const userMessage: ChatMessage = {
        id: generateId(),
        role: 'user',
        content: messageContent,
        timestamp: new Date().toISOString(),
      };

      // Save the input text in case we need to restore it on error
      const savedInputText = messageContent;

      const newMessages = [...messages, userMessage];
      setMessages(newMessages);
      setInputText('');
      setIsLoading(true);
      
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);

      try {
        const updatedInterpretationBase = await generateEntitledFollowupReply(interpretation.id, messageContent);
        const updatedMessages = updatedInterpretationBase.messages;

        setMessages(updatedMessages);
        setTypingMessageId(updatedMessages[updatedMessages.length - 1]?.id ?? null);
        setInterpretation(updatedInterpretationBase);

        const updatedInterpretation = await updateInterpretationElementsFromConversation(
          dream,
          updatedInterpretationBase,
          updatedMessages
        );

        if (updatedInterpretation !== updatedInterpretationBase) {
          await saveInterpretation(updatedInterpretation);
          setInterpretation(updatedInterpretation);
        }
      } catch (error: any) {
        console.error('[DreamDetail] Error sending message:', error);
        // Remove the user message that failed
        setMessages(messages);
        // Restore the input text so user can retry
        setInputText(savedInputText);
        if (error instanceof EntitlementError) {
          if (error.premiumRequired || error.readOnlyAfterLapse) {
            setUpsellSource('followup');
            setUpsellVisible(true);
          }
          Alert.alert('Follow-up unavailable', error.message);
        } else {
          const errorMessage = error?.message || 'Failed to send message. Please check your connection and try again.';
          Alert.alert('Error', errorMessage);
        }
      } finally {
        setIsLoading(false);
      }
    };

    const handleEdit = () => {
      if (dream) {
        navigation.navigate('DreamEditor', { dreamId: dream.id });
      }
    };

    React.useLayoutEffect(() => {
      navigation.setOptions({
        headerRight: () => (
          <TouchableOpacity onPress={handleEdit} style={styles.editButton}>
            <EditIcon size={22} />
          </TouchableOpacity>
        ),
      });
    }, [navigation, dream]);

    if (isLoadingInitial) {
      return (
        <View style={styles.root}>
          <View style={styles.container}>
            <PaperBackground height={DREAM_DETAIL_MOUNTAIN_HEIGHT} lite />
            <DesignExportForeground fill>
              <ScrollView
                style={[styles.scrollView, Platform.OS === 'web' && styles.webScrollView]}
                contentContainerStyle={styles.scrollContent}
              >
                {/* Layout-faithful skeleton: dream page + reflection summary (not journal list cards) */}
                <DreamDetailSkeleton />
              </ScrollView>
            </DesignExportForeground>
          </View>
        </View>
      );
    }

    if (!dream) {
      return (
        <View style={styles.root}>
          <View style={styles.container}>
            <PaperBackground height={DREAM_DETAIL_MOUNTAIN_HEIGHT} lite />
            <DesignExportForeground style={styles.errorContainer}>
              <Text style={styles.errorText}>Dream not found</Text>
            </DesignExportForeground>
          </View>
        </View>
      );
    }

    const keyboardVerticalOffset =
      Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) + 56 : 90;

    const firstAssistantInterpretationText =
      interpretation?.messages?.find((m) => m.role === 'assistant')?.content?.trim() ??
      interpretation?.messages?.[0]?.content?.trim() ??
      '';

    const interpretationCollapsedPreview = (() => {
      const text = firstAssistantInterpretationText;
      if (!text) return '';
      // First paragraph only for the card teaser; line cap below adds a single trailing ellipsis.
      return (text.split('\n\n')[0] || text).trim();
    })();

    const showInterpretationPreview =
      Boolean(interpretationCollapsedPreview) || Boolean(firstAssistantInterpretationText);
    const displayModel = buildDreamDetailDisplayModel(dream, interpretation);
    const isMetadataPending = interpretation?.metadata_status === 'pending';
    const reflectionLoadingCopy =
      reflectionLoadingPhase === 'background'
        ? {
            message: 'Still reflecting…',
            submessage: 'This can take a little while in Deeper Dive. You can leave and return; the reflection will attach when ready.',
          }
        : reflectionLoadingPhase === 'working'
          ? {
              message: 'The deeper reading is still forming…',
              submessage: 'Keeping the full depth and language of your reflection.',
            }
          : {
              message: 'Reflecting on your dream…',
              submessage: 'Tracing its images, feelings, and inner movement.',
            };

    return (
      <View style={styles.root}>
        <KeyboardAvoidingView
          style={styles.container}
          behavior="padding"
          keyboardVerticalOffset={keyboardVerticalOffset}
        >
          <PaperBackground height={DREAM_DETAIL_MOUNTAIN_HEIGHT} lite />
          <DesignExportForeground fill>
            <ScrollView
              ref={scrollViewRef}
              style={[styles.scrollView, Platform.OS === 'web' && styles.webScrollView]}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              scrollEventThrottle={16}
              onScroll={(event) => {
                const { contentOffset } = event.nativeEvent;
                // Track scroll position - if user scrolls, they control the view
                // This is used to prevent auto-scroll during typing in reflection section
              }}
            >
          {/* Dream Content */}
          <View style={styles.dreamPage}>
            <View style={styles.dreamHeader}>
              <Text style={styles.date}>{formatDateShort(dream.date)}</Text>
            </View>

            {dream.title && (
              <Text style={styles.title}>{dream.title}</Text>
            )}

            <Text style={styles.content}>{dream.content}</Text>
          </View>

          <WaveDivider />

          {/* Show reflection section only if no chat is active */}
          {!showChat && !isGeneratingInitial && (
            <View style={styles.reflectionSection}>
              <Text style={styles.reflectionTitle}>Symbolic reflection</Text>

              {interpretation ? (
                <View style={styles.reflectionBody}>
                  <DreamFieldSummary model={displayModel} />

                  {isMetadataPending && (
                    <LoadingState
                      preset="loadSection"
                      context="inline"
                      message="Dream details are still forming…"
                      submessage="The reflection is ready; symbolic layers will appear here as soon as extraction finishes."
                      style={styles.metadataPendingState}
                    />
                  )}

                  {/* Action buttons */}
                  <View style={styles.actionButtonsContainer}>
                    {/* Show update button only if content changed (not just title) */}
                    {dream.updatedAt > interpretation.updatedAt && 
                    dream.content !== interpretation.dreamContentAtCreation && (
                      <>
                        <Text style={styles.updateNoticeText}>
                          The dream has changed since this reflection was written.
                        </Text>
                        {showOfflineMessage && (
                          <OfflineMessage
                            featureName="Jungian AI interpretation"
                            icon="🧠"
                          />
                        )}
                        <Button
                          title="Update reflection"
                          onPress={handleUpdateInterpretation}
                          variant="secondary"
                          size="compact"
                          style={[styles.conversationButton, styles.updateButton]}
                        />
                      </>
                    )}
                    
                    {showInterpretationPreview && (
                      <View style={styles.reflectionPreviewSection}>
                        <Text style={styles.summarySectionTitle}>Symbolic reflection</Text>
                        <Text
                          style={styles.interpretationPreview}
                          textBreakStrategy="highQuality"
                          selectable={true}
                          numberOfLines={6}
                          ellipsizeMode="tail"
                        >
                          {formatInterpretationMarkdown(interpretationCollapsedPreview)}
                        </Text>
                      </View>
                    )}

                    <TouchableOpacity
                      onPress={() => {
                        setShowChat(true);
                        animateChatOpen();
                      }}
                      style={styles.continueExploringButton}
                      activeOpacity={0.7}
                      accessibilityRole="button"
                      accessibilityLabel="Continue exploring"
                    >
                      <Text style={styles.continueExploringText}>Continue exploring</Text>
                    </TouchableOpacity>
                  </View>

                  <SymbolicLayersAccordion model={displayModel} />
                  {typeof __DEV__ !== 'undefined' && __DEV__ && interpretation?.id ? (
                    <TouchableOpacity
                      onPress={() => {
                        const started = forceDreamMetadataExtractionForDebug(interpretation.id);
                        Alert.alert(
                          'Debug re-extract',
                          started
                            ? Platform.OS === 'web'
                              ? 'Fresh extraction started.\n\nOpen browser DevTools → Console (not the terminal).\nFilter: interpretive_echoes\nOr run: copy(window.__ONEIROS_ECHO_DEBUG_JSON__)'
                              : 'Fresh extraction started. Check Metro/device logs for [APP][DEBUG] interpretive_echoes_packet_json (cached:false).'
                            : 'Extraction already in flight — wait a moment and check the browser console.'
                        );
                        void ensureDreamMetadataExtraction(interpretation.id).then((result) => {
                          if (result?.metadata_status === 'ready' || result?.metadata_status === 'failed') {
                            void refreshInterpretationMetadata(interpretation.id);
                          }
                          const g = globalThis as typeof globalThis & {
                            __ONEIROS_ECHO_DEBUG_JSON__?: string;
                          };
                          const json = g.__ONEIROS_ECHO_DEBUG_JSON__;
                          if (json && Platform.OS === 'web') {
                            try {
                              Clipboard.setString(json);
                              console.log('[APP][DEBUG] Packet also copied to clipboard.');
                            } catch {
                              // ignore clipboard failures
                            }
                          }
                        });
                      }}
                      style={styles.debugReextractButton}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.debugReextractLabel}>↻ Re-extract echoes (debug packet)</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              ) : (
                <View style={styles.noInterpretationPanel}>
                  <Text style={styles.noInterpretationText}>
                    Let the dream be mirrored through its images, feelings, and inner movement.
                  </Text>
                  {showOfflineMessage && (
                    <OfflineMessage
                      featureName="Jungian AI interpretation"
                      icon="🧠"
                    />
                  )}
                  <Button
                    title="Reflect on this dream"
                    onPress={handleAskAI}
                    size="compact"
                    style={styles.askButton}
                  />
                </View>
              )}
            </View>
          )}

          {/* Loading state */}
          {isGeneratingInitial && !streamingReflectionMessageId && (
            <View style={styles.reflectionSection}>
              <LoadingState
                preset="dreamReflection"
                message={reflectionLoadingCopy.message}
                submessage={reflectionLoadingCopy.submessage}
                style={styles.loadingPanel}
              />
            </View>
          )}

          {/* Inline Chat Section - replaces reflection section */}
          {showChat && (
            <View style={styles.chatSection}>
              <View style={styles.chatHeader}>
                <View style={styles.chatTitleWrap}>
                  <Text style={styles.chatTitle}>Exploring the dream</Text>
                </View>
                <TouchableOpacity onPress={animateChatClose} style={styles.closeButton}>
                  <Text style={styles.closeButtonText}>×</Text>
                </TouchableOpacity>
              </View>
              
              <ScrollView
                ref={flatListRef}
                testID={DREAM_DETAIL_CHAT_SCROLL_TEST_ID}
                style={[
                  styles.chatScrollView,
                  isGeneratingInitial && streamingReflectionMessageId
                    ? styles.chatScrollViewStreaming
                    : null,
                  Platform.OS === 'web' && styles.webScrollView,
                ]}
                contentContainerStyle={styles.chatContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={true}
                nestedScrollEnabled={true}
                onScroll={(event) => {
                  // Chat stays where the reader leaves it. Avoid forced follow-up
                  // auto-scroll while assistant text is arriving or settling.
                }}
                scrollEventThrottle={16}
                onContentSizeChange={() => {
                  // ChatGPT/Grok-style: do NOT auto-scroll during live typing.
                  // Content stays where it is; user scrolls manually to continue reading.
                }}
              >
                {messages.map((item) => {
                  const isLastAssistantAtLimit = item.role === 'assistant' && reflectionLimitReached && item.id === lastAssistant?.id;
                  return (
                  <ChatBubble
                    key={item.id}
                    message={item}
                    isUser={item.role === 'user'}
                    isTyping={typingMessageId === item.id}
                    isStreaming={streamingReflectionMessageId === item.id && isGeneratingInitial}
                    onTypingComplete={() => {
                      if (typingMessageId === item.id) {
                        setTypingMessageId(null);
                      }
                    }}
                    showSettleFooter={!!isLastAssistantAtLimit}
                    onCopy={(text) => {
                      try {
                        if (Clipboard && Clipboard.setString) {
                          Clipboard.setString(text);
                          Alert.alert('Copied', 'Message copied to clipboard');
                        } else {
                          Alert.alert('Error', 'Clipboard not available');
                        }
                      } catch (error) {
                        Alert.alert('Error', 'Failed to copy message');
                      }
                    }}
                  />
                  );
                })}
                {isLoading && !typingMessageId && (
                  <View style={styles.messageContainer}>
                    <View style={styles.pendingAssistantMessage}>
                      <LoadingState
                        variant="reflect"
                        context="inline"
                        testID="dream-detail-pending-reply-loader"
                        style={styles.pendingAssistantLoader}
                      />
                    </View>
                  </View>
                )}
              </ScrollView>

              {/* Limit message — appears when user taps the disabled input to try to write */}
              {(reflectionLimitReached || premiumReflectionReadOnly) && showLimitMessageOnTap && (
                <View style={styles.limitReachedContainer}>
                  <Text style={styles.limitReachedText}>
                    {premiumReflectionReadOnly
                      ? getReadOnlyLapseMessage()
                      : 'This reflection has reached its natural depth. You can continue tomorrow or start a new dream.'}
                  </Text>
                </View>
              )}

              {/* Offline message — when user tries to send while offline */}
              {showChat && showOfflineMessage && (
                <View style={styles.offlineMessageContainer}>
                  <OfflineMessage
                    featureName="Jungian AI chat"
                    icon="🧠"
                  />
                </View>
              )}

              {/* Input — always visible; when at limit: disabled, greyed out, tappable to show message */}
              <TouchableOpacity
                style={[
                  styles.inputContainer,
                  { paddingBottom: Math.max(insets.bottom, spacing.lg) },
                  reflectionLimitReached && styles.inputContainerDisabled,
                ]}
                activeOpacity={reflectionLimitReached || premiumReflectionReadOnly ? 0.9 : 1}
                onPress={
                  reflectionLimitReached || premiumReflectionReadOnly
                    ? () => {
                        if (premiumReflectionReadOnly) {
                          setUpsellSource('followup');
                          setUpsellVisible(true);
                        } else {
                          setShowLimitMessageOnTap(true);
                        }
                      }
                    : undefined
                }
              >
                <TextInput
                  style={styles.input}
                  placeholder="Ask about an image, feeling, or pattern..."
                  placeholderTextColor={colors.textMuted}
                  value={inputText}
                  onChangeText={setInputText}
                  multiline
                  maxLength={3000}
                  editable={!isGeneratingInitial && !reflectionLimitReached && !premiumReflectionReadOnly}
                  pointerEvents={isGeneratingInitial || reflectionLimitReached || premiumReflectionReadOnly ? 'none' : 'auto'}
                  onFocus={() => {
                    if (!isGeneratingInitial && !reflectionLimitReached && !premiumReflectionReadOnly) {
                      setTimeout(() => {
                        scrollViewRef.current?.scrollToEnd({ animated: true });
                      }, 100);
                    }
                  }}
                />
                <View style={styles.inputActionSpacer}>
                  <VoiceRecordButton
                    presentation="compact"
                    target={{ surface: 'dream-chat', key: dreamId }}
                    onTranscriptionComplete={(text) => {
                      setInputText((prev) => (prev ? `${prev} ${text}` : text));
                    }}
                    disabled={isGeneratingInitial || isLoading || reflectionLimitReached || premiumReflectionReadOnly}
                  />
                </View>
                <PrimaryIconButton
                  inactive={!inputText.trim() || isGeneratingInitial || isLoading || reflectionLimitReached || premiumReflectionReadOnly}
                  onPress={
                    reflectionLimitReached || premiumReflectionReadOnly
                      ? () => {
                          if (premiumReflectionReadOnly) {
                            setUpsellSource('followup');
                            setUpsellVisible(true);
                          } else {
                            setShowLimitMessageOnTap(true);
                          }
                        }
                      : handleSendMessage
                  }
                  disabled={reflectionLimitReached || premiumReflectionReadOnly ? false : (!inputText.trim() || isGeneratingInitial || isLoading)}
                  testID="dream-detail-send-button"
                >
                  <SendIcon
                    size={20}
                    color={
                      !inputText.trim() || isGeneratingInitial || reflectionLimitReached || premiumReflectionReadOnly
                        ? colors.buttonPrimaryDisabled
                        : colors.white
                    }
                  />
                </PrimaryIconButton>
              </TouchableOpacity>
            </View>
          )}
          <PremiumUpsellModal
            visible={upsellVisible}
            source={upsellSource}
            billingInterval={billingInterval}
            premiumPlan={premiumPlan}
            displayMode="premium_only"
            upgradeTitle={purchasingPlanCode === premiumPlan.planCode ? 'Opening store…' : 'Go Premium'}
            upgradeDisabled={purchasingPlanCode !== null}
            onClose={() => setUpsellVisible(false)}
            onIntervalChange={setBillingInterval}
            onUpgrade={async () => {
              const started = await purchasePlan(billingInterval, upsellSource);
              if (started) {
                setUpsellVisible(false);
              }
            }}
          />
            </ScrollView>
          </DesignExportForeground>
        </KeyboardAvoidingView>
      </View>
    );
  };

  const styles = StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.background,
    },
  sunPosition: {
    position: 'absolute',
    bottom: 130,
    right: 80,
      zIndex: 5,
      elevation: 5,
      pointerEvents: 'none',
    },
    container: {
      flex: 1,
      backgroundColor: 'transparent',
      overflow: 'visible', // Allow sun to appear above
    },
    scrollView: {
      flex: 1,
    },
    webScrollView: {
      overflow: 'scroll',
    },
    scrollContent: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.lg,
      paddingBottom: spacing.xxxl,
    },
    editButton: {
      marginRight: spacing.md,
    },
    dreamPage: {
      marginBottom: spacing.lg,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.lg,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderColor: colors.contourLineFaint,
      backgroundColor: 'rgba(255, 253, 249, 0.38)',
    },
    symbolsCard: {
      marginBottom: spacing.lg,
    },
    dreamHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.md,
    },
    date: {
      fontSize: typography.sizes.sm,
      color: colors.textSecondary,
      fontWeight: typography.weights.medium,
    },
    title: {
      fontSize: typography.sizes.xl,
      fontFamily: typography.medium,
      color: colors.textTitle,
      marginBottom: spacing.md,
    },
    content: {
      fontSize: typography.sizes.md,
      color: colors.textPrimary,
      lineHeight: typography.sizes.md * typography.lineHeights.relaxed,
    },
    waveDivider: {
      marginVertical: spacing.lg,
    },
    reflectionSection: {
      marginBottom: spacing.xl,
      minHeight: 250,
      position: 'relative',
      overflow: 'visible', // Allow sun to appear above
      paddingTop: spacing.md,
      paddingBottom: spacing.xl,
    },
    reflectionTitle: {
      fontSize: typography.sizes.lg,
      fontFamily: typography.medium,
      color: colors.textSecondary,
      marginBottom: spacing.md,
      zIndex: 1,
      position: 'relative',
    },
    reflectionBody: {
      zIndex: 1,
      position: 'relative',
      width: '100%', // Use full width
      paddingHorizontal: spacing.xs,
    },
    fieldSummary: {
      gap: spacing.md,
      marginBottom: spacing.md,
    },
    essenceBlock: {
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.xs,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderColor: colors.contourLineFaint,
    },
    summaryBlock: {
      marginBottom: spacing.sm,
    },
    summarySectionTitle: {
      fontSize: typography.sizes.xs,
      fontFamily: typography.medium,
      color: colors.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.4,
      marginBottom: spacing.sm,
    },
    essenceTitle: {
      fontSize: typography.sizes.lg,
      fontFamily: typography.medium,
      color: colors.textTitle,
      marginBottom: spacing.xs,
    },
    essenceLine: {
      fontSize: typography.sizes.md,
      color: colors.textPrimary,
      lineHeight: typography.sizes.md * typography.lineHeights.relaxed,
      maxWidth: 320,
    },
    anchorGrid: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.contourLineFaint,
    },
    anchorCard: {
      paddingVertical: spacing.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.contourLineFaint,
    },
    anchorLabel: {
      fontSize: typography.sizes.md,
      fontFamily: typography.medium,
      color: colors.textTitle,
    },
    anchorMeaning: {
      marginTop: spacing.xs,
      fontSize: typography.sizes.sm,
      color: colors.textSecondary,
      lineHeight: typography.sizes.sm * typography.lineHeights.normal,
    },
    movementBlock: {
      paddingVertical: spacing.md,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderColor: colors.contourLineFaint,
    },
    movementTitle: {
      fontSize: typography.sizes.md,
      fontFamily: typography.medium,
      color: colors.textTitle,
      marginBottom: spacing.xs,
    },
    movementLine: {
      fontSize: typography.sizes.sm,
      color: colors.textSecondary,
      lineHeight: typography.sizes.sm * typography.lineHeights.relaxed,
    },
    reflectionPreviewSection: {
      marginTop: spacing.md,
    },
    updateNoticeText: {
      fontSize: typography.sizes.sm,
      color: colors.textSecondary,
      lineHeight: typography.sizes.sm * typography.lineHeights.normal,
      marginTop: spacing.sm,
    },
    symbolicLayersPanel: {
      marginTop: spacing.md,
      paddingVertical: spacing.sm,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderColor: colors.contourLineFaint,
    },
    symbolicLayersHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: spacing.xs,
    },
    symbolicLayersTitle: {
      fontSize: typography.sizes.sm,
      fontFamily: typography.medium,
      color: colors.textSecondary,
    },
    symbolicLayersCaret: {
      fontSize: typography.sizes.md,
      color: colors.textMuted,
    },
    symbolicLayersBody: {
      paddingTop: spacing.sm,
      gap: spacing.md,
    },
    layerGroup: {
      gap: spacing.sm,
    },
    layerGroupTitle: {
      fontSize: typography.sizes.xs,
      fontFamily: typography.medium,
      color: colors.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.4,
      marginBottom: spacing.xs,
    },
    layerRow: {
      paddingTop: spacing.xs,
      borderTopWidth: 1,
      borderTopColor: colors.contourLineFaint,
    },
    layerTitle: {
      fontSize: typography.sizes.xs,
      fontFamily: typography.medium,
      color: colors.textMuted,
      marginBottom: 2,
    },
    layerEchoList: {
      gap: spacing.sm,
      marginTop: 2,
    },
    layerEchoItem: {
      gap: 2,
    },
    layerEchoTitle: {
      fontSize: typography.sizes.sm,
      fontFamily: typography.medium,
      color: colors.textPrimary,
      lineHeight: typography.sizes.sm * typography.lineHeights.normal,
    },
    layerEchoSubtitle: {
      fontSize: typography.sizes.xs,
      fontFamily: typography.regular,
      color: colors.textMuted,
      lineHeight: typography.sizes.xs * typography.lineHeights.normal,
    },
    debugReextractButton: {
      marginTop: spacing.sm,
      alignSelf: 'flex-start',
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.sm,
      borderRadius: borderRadius.sm,
      borderWidth: 1,
      borderColor: colors.contourLineFaint,
    },
    debugReextractLabel: {
      fontSize: typography.sizes.xs,
      fontFamily: typography.medium,
      color: colors.textMuted,
    },
    layerText: {
      fontSize: typography.sizes.sm,
      color: colors.textSecondary,
      lineHeight: typography.sizes.sm * typography.lineHeights.normal,
    },
    chipsSection: {
      marginBottom: spacing.md,
      marginTop: spacing.xs,
    },
    chipsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    expandChipsButton: {
      marginTop: spacing.sm,
      paddingVertical: 2,
      alignSelf: 'flex-start',
    },
    expandChipsText: {
      fontSize: typography.sizes.xs,
      color: colors.textMuted,
      fontStyle: 'italic',
      letterSpacing: 0.2,
    },
    interpretationPreview: {
      fontSize: typography.sizes.md,
      color: colors.textPrimary,
      lineHeight: typography.sizes.md * typography.lineHeights.relaxed,
      marginBottom: spacing.md,
      marginTop: spacing.sm,
      textAlign: 'left',
    },
    conversationButton: {
      alignSelf: 'center',
      width: '92%',
      marginTop: spacing.sm,
    },
    continueExploringButton: {
      alignSelf: 'center',
      paddingVertical: spacing.sm,
      marginTop: spacing.xs,
    },
    continueExploringText: {
      fontSize: typography.sizes.md,
      color: colors.buttonPrimary,
      fontWeight: typography.weights.medium,
      fontFamily: typography.regular,
      letterSpacing: 0.2,
    },
    actionButtonsContainer: {
      flexDirection: 'column',
      gap: spacing.sm,
    },
    updateButton: {
      marginBottom: spacing.xs,
    },
    noInterpretationPanel: {
      alignItems: 'center',
      zIndex: 1,
      position: 'relative',
      paddingVertical: spacing.xl,
      paddingHorizontal: spacing.md,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderColor: colors.contourLineFaint,
    },
    noInterpretationText: {
      fontSize: typography.sizes.md,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: spacing.lg,
      lineHeight: typography.sizes.md * typography.lineHeights.normal,
    },
    askButton: {
      alignSelf: 'center',
      width: '92%',
    },
    loadingPanel: {
      width: '100%',
    },
    chatSection: {
      marginTop: spacing.lg,
      backgroundColor: colors.cardGlassSoft,
      borderRadius: borderRadius.lg,
      borderWidth: 1,
      borderColor: colors.contourLineFaint,
      // No overflow:'hidden' / flex:1 — those collapse or clip the nested chat ScrollView
      // inside the page ScrollView (see dreamDetailChatLayout.ts).
    },
    chatHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    chatTitle: {
      fontSize: typography.sizes.md,
      fontFamily: typography.medium,
      color: colors.textTitle,
    },
    chatTitleWrap: {
      flex: 1,
      paddingRight: spacing.md,
    },
    closeButton: {
      width: 32,
      height: 32,
      alignItems: 'center',
      justifyContent: 'center',
    },
    closeButtonText: {
      fontSize: 24,
      color: colors.textSecondary,
      lineHeight: 24,
    },
    // Nested chat: bounded height + no overflow:hidden (see dreamDetailChatLayout.ts)
    chatScrollView: {
      ...dreamDetailChatScrollViewStyle,
    },
    /** Keep a visible viewport while the first streamed partial lands (avoid 0-height nest). */
    chatScrollViewStreaming: {
      minHeight: 180,
    },
    chatContent: {
      paddingHorizontal: spacing.md,
      paddingTop: spacing.sm,
      // Keep last lines clear of the Ask composer edge
      paddingBottom: spacing.xxl,
    },
    messageContainer: {
      flexDirection: 'row',
      alignSelf: 'stretch',
      marginBottom: spacing.md,
      alignItems: 'flex-start',
    },
    userMessageContainer: {
      justifyContent: 'flex-end',
    },
    /** Full-width prose on the Exploring panel — avoids card-in-card. */
    assistantMessage: {
      flex: 1,
      flexShrink: 1,
      // Copy sits in the corner; keep body almost full panel width
      paddingRight: spacing.md,
      minHeight: 40,
      position: 'relative',
    },
    pendingAssistantMessage: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 40,
    },
    pendingAssistantLoader: {
      alignItems: 'center',
      width: '100%',
      paddingVertical: spacing.xs,
    },
    copyButton: {
      position: 'absolute',
      top: -spacing.xs,
      right: -spacing.xs,
      padding: spacing.xs,
      opacity: 0.6,
      zIndex: 1,
    },
    userBubble: {
      maxWidth: '88%',
      backgroundColor: colors.buttonPrimary90,
      marginLeft: 'auto',
      borderRadius: borderRadius.lg,
      padding: spacing.md,
      minHeight: 40,
    },
    messageText: {
      fontSize: typography.sizes.md,
      color: colors.textPrimary,
      // Reflection prose keeps relaxed leading; title→body gap is tightened in the markdown formatter
      lineHeight: typography.sizes.md * typography.lineHeights.relaxed,
      includeFontPadding: false,
      textAlign: 'left',
      // Do not force width: '100%' here — it can under-measure Text height inside nested ScrollViews
    },
    italicText: {
      fontStyle: 'italic',
      fontSize: typography.sizes.md,
      color: colors.textPrimary,
      lineHeight: typography.sizes.md * typography.lineHeights.relaxed,
    },
    metadataPendingState: {
      marginTop: spacing.sm,
      marginBottom: spacing.sm,
    },
    settleFooter: {
      marginTop: spacing.md,
      fontSize: typography.sizes.sm,
      fontStyle: 'italic',
      color: colors.textMuted,
      lineHeight: typography.sizes.sm * typography.lineHeights.relaxed,
    },
    limitReachedContainer: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      backgroundColor: colors.navSurface,
      borderTopWidth: 1,
      borderTopColor: colors.navBorder,
    },
    limitReachedText: {
      fontSize: typography.sizes.sm,
      fontStyle: 'italic',
      color: colors.textMuted,
      lineHeight: typography.sizes.sm * typography.lineHeights.relaxed,
    },
    offlineMessageContainer: {
      paddingHorizontal: spacing.md,
      paddingTop: spacing.sm,
    },
    inputContainerDisabled: {
      opacity: 0.5,
    },
    userMessageText: {
      color: colors.white,
    },
    inputContainer: {
      flexDirection: 'row',
      padding: spacing.md,
      paddingTop: spacing.lg,
      backgroundColor: colors.navSurface,
      borderTopWidth: 1,
      borderTopColor: colors.navBorder,
      alignItems: 'flex-end',
    },
    input: {
      flex: 1,
      backgroundColor: colors.fieldSurface,
      borderRadius: borderRadius.md,
      borderWidth: 1,
      borderColor: colors.contourLineFaint,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      fontSize: typography.sizes.md,
      color: colors.textPrimary,
      minHeight: 60,
      maxHeight: 120,
      marginRight: spacing.sm,
    },
    inputActionSpacer: {
      marginRight: spacing.sm,
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: spacing.xxl,
    },
    errorText: {
      fontSize: typography.sizes.md,
      color: colors.textSecondary,
      textAlign: 'center',
    },
  });

  export default DreamDetailScreen;
