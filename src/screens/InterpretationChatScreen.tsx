import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Alert,
  Clipboard,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackParamList } from '../navigation/types';
import { colors, spacing, typography, borderRadius } from '../theme';
import { LoadingState, DesignExportForeground, PaperBackground, PrimaryIconButton } from '../components/ui';
import { PremiumUpsellModal } from '../components/subscription/PremiumUpsellModal';
import {
  CopyActionIcon as CopyIcon,
  SendActionIcon as SendIcon,
} from '../components/icons/ActionIcons';
import { PhasedTypingText } from '../components/ui/PhasedTypingText';
import { VoiceRecordButton } from '../components/ui/VoiceRecordButton';
import { VoiceComposerService } from '../services/voiceComposerService';
import { EditRevisionGuard } from '../utils/editRevisionGuard';
import { Dream, Interpretation, ChatMessage } from '../types/dream';
import { getDreamById, getInterpretationByDreamId, saveInterpretation, deleteInterpretation } from '../utils/storage';
import { formatDateShort, generateId } from '../utils/date';
import { formatInterpretationMarkdown } from '../utils/formatInterpretationMarkdown';
import { updateInterpretationElementsFromConversation } from '../services/ai';
import { getInterpretationDepth } from '../services/userSettingsService';
import { isOnline } from '../utils/network';
import { MAX_FOLLOW_UP_RESPONSES } from '../constants/interpretation';
import { OfflineMessage } from '../components/OfflineMessage';
import { useSubscription } from '../providers/SubscriptionProvider';
import {
  consumeGrantedQuotaBonus,
  EntitlementError,
  generateEntitledDreamReflection,
  generateEntitledFollowupReply,
  triggerPendingDreamMetadataExtraction,
} from '../services/entitledAiService';
import { getPaidPlanOptionsForInterval, getReadOnlyLapseMessage } from '../services/subscriptionService';
import type { BillingInterval, PremiumGateSource } from '../types/subscription';

type NavigationProp = StackNavigationProp<RootStackParamList, 'InterpretationChat'>;
type ChatRouteProp = RouteProp<RootStackParamList, 'InterpretationChat'>;
interface ChatBubbleProps {
  message: ChatMessage;
  isUser: boolean;
  isTyping?: boolean;
  onTypingComplete?: () => void;
  showSettleFooter?: boolean;
}

// Formats assistant markdown for display (shared with live typing)
const formatMarkdownText = formatInterpretationMarkdown;

// Component to render text with italic styling for "Evidence" phrases
// This component handles both markdown formatting AND italic styling for evidence phrases
const FormattedMessageText: React.FC<{ text: string; isUser: boolean }> = ({ text, isUser }) => {
  if (isUser) {
    const displayText = formatMarkdownText(text);
    return <Text style={[styles.messageText, styles.userMessageText]}>{displayText}</Text>;
  }

  // First, format markdown (but preserve evidence phrases)
  let formatted = formatMarkdownText(text);
  
  // Parse text and identify parts that should be italic
  // For AI messages: make ONLY "Evidence" phrases italic
  const parts: Array<{ text: string; italic: boolean }> = [];
  
  // Pattern to match "Evidence:" or "Evidence phase:" or "Evidence phrase:" followed by text
  // Match after formatMarkdownText has processed it (so it might be "Evidence:" or "• Evidence:" etc)
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
};

const SETTLE_FOOTER = 'This feels like a good point to pause and let the dream settle.\nYou can return tomorrow, or begin a new reflection.';

const ChatBubble: React.FC<ChatBubbleProps> = ({ message, isUser, isTyping = false, onTypingComplete, showSettleFooter = false }) => {
  const handleCopy = () => {
    try {
      if (Clipboard && Clipboard.setString) {
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
      {/* Assistant text sits on the chat surface — no nested card. */}
      <View style={isUser ? styles.userBubble : styles.assistantMessage}>
        {isTyping && !isUser ? (
          <PhasedTypingText
            text={message.content}
            onComplete={onTypingComplete}
            style={styles.messageText}
          />
        ) : (
          <>
            <FormattedMessageText text={message.content} isUser={isUser} />
            {showSettleFooter && (
              <Text style={styles.settleFooter}>{SETTLE_FOOTER}</Text>
            )}
          </>
        )}
        {!isUser && !isTyping && (
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
};

const InterpretationChatScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<ChatRouteProp>();
  const { dreamId } = route.params;
  const insets = useSafeAreaInsets();
  const {
    status: subscriptionStatus,
    products,
    storeProductsLoading,
    purchasePlan,
    purchasingPlanCode,
  } = useSubscription();

  const [dream, setDream] = useState<Dream | null>(null);
  const [interpretation, setInterpretation] = useState<Interpretation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const inputEditGuardRef = useRef(new EditRevisionGuard());
  const chatVoiceTarget = useMemo(
    () => ({ surface: 'interpretation-chat' as const, key: dreamId }),
    [dreamId],
  );

  useEffect(() => {
    let active = true;
    const hydrationRevision = inputEditGuardRef.current.capture();
    void VoiceComposerService.getSnapshot(chatVoiceTarget).then((snapshot) => {
      if (active && snapshot != null && inputEditGuardRef.current.isCurrent(hydrationRevision)) {
        setInputText(snapshot.text);
        void VoiceComposerService.acknowledgeVisibleSnapshot(snapshot);
      }
    });
    return () => { active = false; };
  }, [chatVoiceTarget]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingDream, setIsLoadingDream] = useState(true);
  const [isGeneratingInitial, setIsGeneratingInitial] = useState(false);
  const [typingMessageId, setTypingMessageId] = useState<string | null>(null);
  const [showOfflineMessage, setShowOfflineMessage] = useState(false);
  const [isUserScrolledUp, setIsUserScrolledUp] = useState(false);
  const [showLimitMessageOnTap, setShowLimitMessageOnTap] = useState(false);
  const [billingInterval, setBillingInterval] = useState<BillingInterval>('monthly');
  const [upsellVisible, setUpsellVisible] = useState(false);
  const [upsellSource, setUpsellSource] = useState<PremiumGateSource>('followup');

  const flatListRef = useRef<FlatList>(null);
  const [premiumPlan, deeperPlan] = useMemo(
    () => getPaidPlanOptionsForInterval(products, billingInterval),
    [billingInterval, products]
  );
  const hasPaidAccess = subscriptionStatus?.hasPaidAccess ?? false;
  const currentPlanTier = subscriptionStatus?.planTier ?? 'free';

  useEffect(() => {
    loadData();
    // Clear typing state when component unmounts or dreamId changes
    // This ensures that if user navigated away during typing,
    // the message won't restart typing when they come back
    return () => {
      setTypingMessageId(null);
    };
  }, [dreamId]);

  React.useLayoutEffect(() => {
    if (dream) {
      navigation.setOptions({
        headerTitle: `Jungian AI · ${formatDateShort(dream.date)}`,
      });
    }
  }, [navigation, dream]);

  const loadData = async () => {
    setIsLoadingDream(true);
    const dreamData = await getDreamById(dreamId);
    setDream(dreamData);
    setIsLoadingDream(false);

    if (dreamData) {
      const interpretationData = await getInterpretationByDreamId(dreamId);
      
      if (interpretationData) {
        // Check if this is a mock response (contains the mock text signature)
        const isMockResponse = interpretationData.messages[0]?.content?.includes('Thank you for sharing this dream. Let me reflect on it from a Jungian perspective:') &&
                               interpretationData.messages[0]?.content?.includes('What emotions arose most strongly during the dream?');
        
        if (isMockResponse) {
          console.log('[ChatScreen] Found mock interpretation, deleting and regenerating with API');
          // Delete the mock interpretation and generate a new one with API
          await deleteInterpretation(interpretationData.id);
          await generateInitialAIInterpretation(dreamData);
        } else {
          console.log('[ChatScreen] Found existing interpretation, using it');
          setInterpretation(interpretationData);
          setMessages(interpretationData.messages);
          triggerPendingDreamMetadataExtraction(interpretationData);
          // Clear typing state when loading existing messages
          // Messages from storage are already complete, no need to type them
          setTypingMessageId(null);
        }
      } else {
        // Generate initial interpretation - ALWAYS use API, never mock
        console.log('[ChatScreen] No existing interpretation, generating new one with API');
        await generateInitialAIInterpretation(dreamData);
      }
    }
  };

  const generateInitialAIInterpretation = async (dreamData: Dream) => {
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
    try {
      console.log('[ChatScreen] Generating initial interpretation...');
      const depth = await getInterpretationDepth();
      const newInterpretation = await generateEntitledDreamReflection(
        dreamData,
        depth,
        'dream_reflection_generate'
      );
      setInterpretation(newInterpretation);
      setMessages(newInterpretation.messages);
      triggerPendingDreamMetadataExtraction(newInterpretation);
      const bonusGrant = consumeGrantedQuotaBonus();
      if (bonusGrant) {
        Alert.alert(
          'A small gift from us',
          'You reached the edge of this cycle, so we opened 5 extra reflections and 5 extra Recent Dream Field reports for you. If this happens again, it may be time to upgrade.'
        );
      }
      // Start typing animation
      setTypingMessageId(newInterpretation.messages[0]?.id ?? null);
    } catch (error: any) {
      console.error('[ChatScreen] Error generating interpretation:', error);
      if (error instanceof EntitlementError) {
        setUpsellSource('account');
        Alert.alert(
          'Reflection unavailable',
          error.message,
          error.premiumRequired || error.reason === 'free_weekly_reflection_unavailable'
            ? [
                { text: 'Not now', style: 'cancel' },
                {
                  text: 'See Premium',
                  onPress: () => {
                    setUpsellVisible(true);
                  },
                },
              ]
            : [{ text: 'OK' }]
        );
      } else {
        const errorMessage = error?.message || 'Failed to generate interpretation. Please try again.';
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

    // Check if online before proceeding
    const online = await isOnline();
    if (!online) {
      setShowOfflineMessage(true);
      // Hide message after 5 seconds
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
    
    // Reset scroll state when user sends a message (they want to see the response)
    setIsUserScrolledUp(false);

    // Scroll to bottom
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      const updatedInterpretationBase = await generateEntitledFollowupReply(interpretation.id, messageContent);
      const updatedMessages = updatedInterpretationBase.messages;

      setMessages(updatedMessages);
      // Start typing animation
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
      await VoiceComposerService.clear(chatVoiceTarget);

      // Only auto-scroll if user hasn't manually scrolled up
      if (!isUserScrolledUp) {
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    } catch (error: any) {
      console.error('[ChatScreen] Error sending message:', error);
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

  if (isLoadingDream) {
    return (
      <View style={styles.container}>
        <DesignExportForeground style={styles.loadingContainer}>
          <LoadingState preset="loadDream" />
        </DesignExportForeground>
      </View>
    );
  }

  if (!dream) {
    return (
      <View style={styles.container}>
        <DesignExportForeground style={styles.errorContainer}>
          <Text style={styles.errorText}>Dream not found</Text>
        </DesignExportForeground>
      </View>
    );
  }

  if (isGeneratingInitial) {
    return (
      <View style={styles.container}>
        <DesignExportForeground style={styles.loadingContainer}>
          <LoadingState preset="analyzeDream" />
        </DesignExportForeground>
      </View>
    );
  }

  const keyboardVerticalOffset =
    Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) + 56 : 90;

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingBottom: insets.bottom }]}
      behavior="padding"
      keyboardVerticalOffset={keyboardVerticalOffset}
    >
      <PaperBackground />
      <DesignExportForeground fill>
        {/* Chat Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          initialNumToRender={15}
          maxToRenderPerBatch={10}
          windowSize={5}
          renderItem={({ item }) => {
            const isLastAssistantAtLimit = item.role === 'assistant' && reflectionLimitReached && item.id === lastAssistant?.id;
            return (
              <ChatBubble
                message={item}
                isUser={item.role === 'user'}
                isTyping={typingMessageId === item.id}
                onTypingComplete={() => {
                  if (typingMessageId === item.id) {
                    setTypingMessageId(null);
                  }
                }}
                showSettleFooter={!!isLastAssistantAtLimit}
              />
            );
          }}
          contentContainerStyle={styles.chatContent}
          showsVerticalScrollIndicator={false}
          onScroll={(event) => {
            // Detect if user scrolled up manually (for future "scroll to bottom" button, etc.)
            const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
            const isAtBottom = contentOffset.y + layoutMeasurement.height >= contentSize.height - 20;
            setIsUserScrolledUp(!isAtBottom);
          }}
          onContentSizeChange={() => {
            // ChatGPT/Grok-style: do NOT auto-scroll during live typing.
            // Content stays where it is; user scrolls manually to continue reading.
          }}
        />

      {messages.length <= 1 && !reflectionLimitReached && !premiumReflectionReadOnly && (
        <View style={styles.quickQuestionsContainer}>
          <TouchableOpacity
            style={styles.quickButton}
            onPress={() => setInputText('What stayed with you?')}
          >
            <Text style={styles.quickButtonText}>What stayed with you?</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickButton}
            onPress={() => setInputText('Was there an image that felt unfinished?')}
          >
            <Text style={styles.quickButtonText}>An unfinished image?</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickButton}
            onPress={() => setInputText('What changed after the reading?')}
          >
            <Text style={styles.quickButtonText}>What changed?</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Offline Message */}
      {showOfflineMessage && (
        <View style={styles.offlineMessageContainer}>
          <OfflineMessage
            featureName="Jungian AI chat"
            icon="🧠"
          />
        </View>
      )}

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

      {/* Input Bar — always visible; when at limit: disabled, greyed out, tappable to show message */}
      <TouchableOpacity
        style={[
          styles.inputContainer,
          { paddingBottom: Math.max(insets.bottom, spacing.md) },
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
          placeholder="Ask about symbols, feelings, or patterns..."
          placeholderTextColor={colors.textMuted}
          value={inputText}
          onChangeText={(text) => {
            inputEditGuardRef.current.markEdited();
            setInputText(text);
            void VoiceComposerService.saveText(chatVoiceTarget, text);
          }}
          multiline
          maxLength={3000}
          editable={!reflectionLimitReached && !premiumReflectionReadOnly}
          pointerEvents={reflectionLimitReached || premiumReflectionReadOnly ? 'none' : 'auto'}
        />
        <View style={styles.inputActions}>
          <VoiceRecordButton
            presentation="compact"
            target={chatVoiceTarget}
            getComposerText={() => inputText}
            onTranscriptionComplete={(text) => {
              inputEditGuardRef.current.markEdited();
              setInputText(text);
            }}
            disabled={isLoading || reflectionLimitReached || premiumReflectionReadOnly}
          />
          <PrimaryIconButton
            inactive={!inputText.trim() || isLoading || reflectionLimitReached || premiumReflectionReadOnly}
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
            disabled={reflectionLimitReached || premiumReflectionReadOnly ? false : (!inputText.trim() || isLoading)}
            loading={isLoading}
            testID="chat-send-button"
          >
            <SendIcon
              size={20}
              color={
                !inputText.trim() || reflectionLimitReached || premiumReflectionReadOnly
                  ? colors.buttonPrimaryDisabled
                  : colors.white
              }
            />
          </PrimaryIconButton>
        </View>
      </TouchableOpacity>
      <PremiumUpsellModal
        visible={upsellVisible}
        source={upsellSource}
        billingInterval={billingInterval}
        premiumPlan={premiumPlan}
        deeperPlan={deeperPlan}
        storeProducts={products}
        storeProductsLoading={storeProductsLoading}
        displayMode="premium_only"
        currentPlanTier={currentPlanTier}
        upgradeTitle={{
          premium: purchasingPlanCode === premiumPlan.planCode ? 'Opening store…' : 'Choose Premium',
          deeper: purchasingPlanCode === deeperPlan.planCode ? 'Opening store…' : 'Choose Deeper',
        }}
        upgradeDisabled={purchasingPlanCode !== null}
        onClose={() => setUpsellVisible(false)}
        onIntervalChange={setBillingInterval}
        onUpgrade={async (planTier) => {
          const started = await purchasePlan(planTier, billingInterval, upsellSource);
          if (started) {
            setUpsellVisible(false);
          }
        }}
      />
      </DesignExportForeground>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  chatContent: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
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
  /** Full-width prose on the chat panel — avoids card-in-card. */
  assistantMessage: {
    flex: 1,
    flexShrink: 1,
    paddingRight: spacing.md,
    minHeight: 40,
    position: 'relative',
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
    backgroundColor: colors.buttonPrimary,
    marginLeft: 'auto',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    minHeight: 40,
  },
  messageText: {
    fontSize: typography.sizes.md,
    color: colors.textPrimary,
    lineHeight: typography.sizes.md * typography.lineHeights.relaxed,
    textAlign: 'left',
  },
  italicText: {
    fontStyle: 'italic',
    fontSize: typography.sizes.md, // Same size as regular text
    color: colors.textPrimary, // Inherit color from parent
    lineHeight: typography.sizes.md * typography.lineHeights.relaxed, // Same line height
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
    backgroundColor: colors.cardBackground,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  limitReachedText: {
    fontSize: typography.sizes.sm,
    fontStyle: 'italic',
    color: colors.textMuted,
    lineHeight: typography.sizes.sm * typography.lineHeights.relaxed,
  },
  inputContainerDisabled: {
    opacity: 0.5,
  },
  userMessageText: {
    color: colors.white,
  },
  offlineMessageContainer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  quickQuestionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  quickButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.contourLineSoft,
    backgroundColor: colors.fieldSurface,
  },
  quickButtonText: {
    color: colors.textSecondary,
    fontFamily: typography.roles.ui,
    fontSize: typography.sizes.sm,
  },
  inputContainer: {
    padding: spacing.md,
    backgroundColor: colors.cardBackground,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  input: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.sizes.md,
    color: colors.textPrimary,
    maxHeight: 100,
    marginBottom: spacing.sm,
  },
  inputActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: spacing.sm,
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

export default InterpretationChatScreen;
