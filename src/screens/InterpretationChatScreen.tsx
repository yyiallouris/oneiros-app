import React, { useState, useEffect, useRef } from 'react';
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
  ActivityIndicator,
  Alert,
  Clipboard,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackParamList } from '../navigation/types';
import { colors, spacing, typography, borderRadius } from '../theme';
import { Card, BreathingLine, ThreadDrift } from '../components/ui';
import { PhasedTypingText } from '../components/ui/PhasedTypingText';
import { VoiceRecordButton } from '../components/ui/VoiceRecordButton';
import { Dream, Interpretation, ChatMessage } from '../types/dream';
import { getDreamById, getInterpretationByDreamId, saveInterpretation, deleteInterpretation } from '../utils/storage';
import { formatDateShort, generateId } from '../utils/date';
import { generateInitialInterpretation, sendChatMessage, extractSymbolsAndArchetypes, extractDreamSymbolsAndArchetypes, filterArchetypesForDisplay } from '../services/ai';
import { getInterpretationDepth } from '../services/userSettingsService';
import { isOnline } from '../utils/network';
import { OfflineMessage } from '../components/OfflineMessage';
import Svg, { Path } from 'react-native-svg';

type NavigationProp = StackNavigationProp<RootStackParamList, 'InterpretationChat'>;
type ChatRouteProp = RouteProp<RootStackParamList, 'InterpretationChat'>;

// Send icon
const SendIcon = ({ size = 24, color = colors.accent }) => (
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
const CopyIcon = ({ size = 20, color = colors.textSecondary }) => (
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

interface ChatBubbleProps {
  message: ChatMessage;
  isUser: boolean;
  isTyping?: boolean;
  onTypingComplete?: () => void;
}

// Helper function to format markdown text for better display
// Converts markdown to plain text with proper spacing and formatting
const formatMarkdownText = (text: string): string => {
  let formatted = text;
  
  // Convert headers to bold with spacing
  formatted = formatted.replace(/^#{1,6}\s+(.+)$/gm, (match, content) => {
    return `\n${content}\n`; // Add line breaks around headers
  });
  
  // Convert bold (**text** or __text__) to plain text (keep the text)
  formatted = formatted.replace(/\*\*([^*]+)\*\*/g, '$1');
  formatted = formatted.replace(/__([^_]+)__/g, '$1');
  
  // Convert italic (*text* or _text_) to plain text
  formatted = formatted.replace(/\*([^*]+)\*/g, '$1');
  formatted = formatted.replace(/_([^_]+)_/g, '$1');
  
  // Remove inline code markers but keep the text
  formatted = formatted.replace(/`([^`]+)`/g, '$1');
  
  // Remove links but keep the text
  formatted = formatted.replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1');
  
  // Process line by line to handle bullet points and remove unwanted indentation
  const lines = formatted.split('\n');
  let previousWasBulletPoint = false;
  
  formatted = lines.map((line, index) => {
    const originalLine = line;
    const trimmed = line.trim();
    
    // Skip empty lines - keep them as is (preserve spacing)
    if (!trimmed) {
      previousWasBulletPoint = false; // Reset on empty line
      return originalLine;
    }
    
    // IMPORTANT: Don't convert "Evidence phrase:" or "Evidence:" lines to bullet points
    // They should remain as regular text (will be styled as italic later)
    if (/Evidence\s*(?:phrase|phase)?\s*:?/i.test(trimmed)) {
      previousWasBulletPoint = false;
      // Remove leading bullet characters if present, but keep the text
      return trimmed.replace(/^[-*+]\s*/, '');
    }
    
    // Count leading whitespace to detect indentation
    const leadingWhitespace = originalLine.match(/^\s*/)?.[0] || '';
    const isIndented = leadingWhitespace.length > 2; // More than 2 spaces = indented (continuation text)
    
    // Check if this line starts with -, *, or +
    const startsWithBulletChar = /^\s*[-*+]\s+/.test(originalLine);
    
    // If previous line was a bullet point AND this line starts with bullet char, treat as continuation text
    // This prevents continuation sentences from becoming bullet points
    if (previousWasBulletPoint && startsWithBulletChar) {
      // Remove the bullet character and treat as regular continuation text
      previousWasBulletPoint = false; // Reset since this is continuation, not a new bullet
      return trimmed.replace(/^[-*+]\s+/, '');
    }
    
    // Only treat as bullet point if it starts with -, *, or + AND is NOT heavily indented
    // AND the previous line was NOT a bullet point (to avoid continuation text)
    if (!isIndented && startsWithBulletChar && !previousWasBulletPoint) {
      // Convert to bullet point format
      previousWasBulletPoint = true;
      return '• ' + trimmed.replace(/^[-*+]\s+/, '');
    }
    
    // Reset bullet point flag if this is not a bullet point
    if (!startsWithBulletChar) {
      previousWasBulletPoint = false;
    }
    
    // Check if this is a numbered list item (only if not heavily indented)
    if (!isIndented && /^\s*\d+\.\s+/.test(originalLine)) {
      // Clean up spacing but keep the number
      previousWasBulletPoint = false; // Numbered lists reset the flag
      return trimmed.replace(/^(\d+)\.\s+/, '$1. ');
    }
    
    // For all other lines (regular text, continuation lines, indented text), remove ALL leading whitespace
    return trimmed;
  }).join('\n');
  
  // Clean up multiple newlines (max 2 consecutive)
  formatted = formatted.replace(/\n{3,}/g, '\n\n');
  
  // Ensure proper spacing after sections
  formatted = formatted.replace(/(\d+\.\s+\*\*[^*]+\*\*)/g, '\n$1\n');
  
  return formatted.trim();
};

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

const ChatBubble: React.FC<ChatBubbleProps> = ({ message, isUser, isTyping = false, onTypingComplete }) => {
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
      <View style={[styles.messageBubble, isUser && styles.userBubble]}>
        {isTyping && !isUser ? (
          <PhasedTypingText
            text={message.content}
            onComplete={onTypingComplete}
            style={[styles.messageText, isUser && styles.userMessageText]}
          />
        ) : (
          <FormattedMessageText text={message.content} isUser={isUser} />
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

  const [dream, setDream] = useState<Dream | null>(null);
  const [interpretation, setInterpretation] = useState<Interpretation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingDream, setIsLoadingDream] = useState(true);
  const [isGeneratingInitial, setIsGeneratingInitial] = useState(false);
  const [typingMessageId, setTypingMessageId] = useState<string | null>(null);
  const [showOfflineMessage, setShowOfflineMessage] = useState(false);
  const [isUserScrolledUp, setIsUserScrolledUp] = useState(false);

  const flatListRef = useRef<FlatList>(null);

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
      const aiResponse = await generateInitialInterpretation(dreamData, { depth });
      console.log('[ChatScreen] Got response from API, length:', aiResponse.length);
      
      const aiMessage: ChatMessage = {
        id: generateId(),
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date().toISOString(),
      };

      // Symbols: prose extraction first; fallback to structured if very few (≤2)
      // Archetypes: always from structured extraction (AI JSON) — not prose
      let symbols: string[] = [];
      let archetypes: string[] = [];
      let landscapes: string[] = [];
      const proseExtracted = extractSymbolsAndArchetypes(aiResponse);
      symbols = proseExtracted.symbols;
      landscapes = proseExtracted.landscapes ?? [];

      let affects: string[] = [];
      let motifs: string[] = [];
      let relational_dynamics: string[] = [];
      let core_mode: string | undefined;
      let amplifications: string[] = [];

      try {
        const structured = await extractDreamSymbolsAndArchetypes(dreamData);
        archetypes = filterArchetypesForDisplay(structured.archetypes ?? [], aiResponse);
        if (proseExtracted.symbols.length <= 2 && structured.symbols && structured.symbols.length > symbols.length) {
          symbols = structured.symbols;
          landscapes = structured.landscapes ?? landscapes;
        } else if (structured.landscapes && structured.landscapes.length > 0) {
          landscapes = structured.landscapes;
        }
        affects = structured.affects ?? [];
        motifs = structured.motifs ?? [];
        relational_dynamics = structured.relational_dynamics ?? [];
        core_mode = structured.core_mode?.trim() || undefined;
        amplifications = structured.amplifications ?? [];
      } catch {
        archetypes = filterArchetypesForDisplay(proseExtracted.archetypes, aiResponse);
      }

      if (__DEV__) {
        console.log('[DreamInterpretation] Extracted (chat):', {
          symbolsCount: symbols.length,
          landscapesCount: landscapes.length,
          affectsCount: affects.length,
          motifsCount: motifs.length,
          core_mode,
        });
      }
      const newInterpretation: Interpretation = {
        id: generateId(),
        dreamId: dreamData.id,
        messages: [aiMessage],
        symbols,
        archetypes,
        landscapes: landscapes.length > 0 ? landscapes : undefined,
        affects: affects.length > 0 ? affects : undefined,
        motifs: motifs.length > 0 ? motifs : undefined,
        relational_dynamics: relational_dynamics.length > 0 ? relational_dynamics : undefined,
        core_mode,
        amplifications: amplifications.length > 0 ? amplifications : undefined,
        summary: aiResponse.slice(0, 200),
        dreamContentAtCreation: dreamData.content, // Store content to detect if only title changed
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await saveInterpretation(newInterpretation);
      setInterpretation(newInterpretation);
      setMessages([aiMessage]);
      // Start typing animation
      setTypingMessageId(aiMessage.id);
    } catch (error: any) {
      console.error('[ChatScreen] Error generating interpretation:', error);
      const errorMessage = error?.message || 'Failed to generate interpretation. Please try again.';
      Alert.alert('Error', errorMessage);
      // Don't set messages, so user can try again
    } finally {
      setIsGeneratingInitial(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || !dream || !interpretation || isLoading) return;

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
      // Use real API call - pass the original messages array (before adding user message)
      // since the API expects the conversation history without the new user message
      const aiResponse = await sendChatMessage(dream, messages, messageContent);

      const aiMessage: ChatMessage = {
        id: generateId(),
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date().toISOString(),
      };

      const updatedMessages = [...newMessages, aiMessage];
      setMessages(updatedMessages);
      // Start typing animation
      setTypingMessageId(aiMessage.id);

      // Update interpretation
      const updatedInterpretation: Interpretation = {
        ...interpretation,
        messages: updatedMessages,
        updatedAt: new Date().toISOString(),
      };

      await saveInterpretation(updatedInterpretation);
      setInterpretation(updatedInterpretation);

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
      // Show informative error message
      const errorMessage = error?.message || 'Failed to send message. Please check your connection and try again.';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickQuestion = (question: string) => {
    setInputText(question);
  };

  if (isLoadingDream) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <BreathingLine width={120} height={2} color={colors.accent} />
          <Text style={styles.loadingText}>Loading dream...</Text>
        </View>
      </View>
    );
  }

  if (!dream) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Dream not found</Text>
        </View>
      </View>
    );
  }

  if (isGeneratingInitial) {
    return (
      <View style={styles.loadingContainer}>
        <ThreadDrift size={60} color={colors.accent} />
        <Text style={styles.loadingText}>Analyzing your dream...</Text>
      </View>
    );
  }

  const dreamPreview = dream.content.length > 150
    ? dream.content.slice(0, 150) + '...'
    : dream.content;

  const keyboardVerticalOffset =
    Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) + 56 : 90;

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingBottom: insets.bottom }]}
      behavior="padding"
      keyboardVerticalOffset={keyboardVerticalOffset}
    >
      {/* Dream Summary Card */}
      <Card style={styles.summaryCard} elevation={false}>
        <Text style={styles.summaryTitle}>Dream summary</Text>
        <Text style={styles.summaryText} numberOfLines={3}>
          {dreamPreview}
        </Text>
      </Card>

      {/* Chat Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ChatBubble 
            message={item} 
            isUser={item.role === 'user'} 
            isTyping={typingMessageId === item.id}
            onTypingComplete={() => {
              if (typingMessageId === item.id) {
                setTypingMessageId(null);
              }
            }}
          />
        )}
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

      {/* Quick Questions */}
      {messages.length <= 1 && (
        <View style={styles.quickQuestionsContainer}>
          <TouchableOpacity
            style={styles.quickButton}
            onPress={() => handleQuickQuestion('What symbols stand out?')}
          >
            <Text style={styles.quickButtonText}>What symbols stand out?</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickButton}
            onPress={() => handleQuickQuestion('What are the shadow aspects?')}
          >
            <Text style={styles.quickButtonText}>Shadow aspects?</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickButton}
            onPress={() => handleQuickQuestion('What is the message?')}
          >
            <Text style={styles.quickButtonText}>What is the message?</Text>
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

      {/* Input Bar */}
      <View style={[styles.inputContainer, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
        <TextInput
          style={styles.input}
          placeholder="Ask a question..."
          placeholderTextColor={colors.textMuted}
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={500}
        />
        <View style={styles.inputActions}>
          <VoiceRecordButton
            onTranscriptionComplete={(text) => {
              setInputText((prev) => (prev ? `${prev} ${text}` : text));
            }}
            disabled={isLoading}
          />
          <TouchableOpacity
            style={[styles.sendButton, (!inputText.trim() || isLoading) && styles.sendButtonDisabled]}
            onPress={handleSendMessage}
            disabled={!inputText.trim() || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <SendIcon size={20} color={colors.white} />
            )}
          </TouchableOpacity>
        </View>
      </View>
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
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
  },
  summaryCard: {
    margin: spacing.md,
    backgroundColor: colors.accentLight,
    opacity: 0.9,
  },
  summaryTitle: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    color: colors.white,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryText: {
    fontSize: typography.sizes.sm,
    color: colors.white,
    lineHeight: typography.sizes.sm * typography.lineHeights.normal,
  },
  chatContent: {
    padding: spacing.md,
    paddingBottom: spacing.lg,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: spacing.md,
    alignItems: 'flex-start',
  },
  userMessageContainer: {
    justifyContent: 'flex-end',
  },
  messageBubble: {
    maxWidth: '95%', // Use more width
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    paddingRight: spacing.xl + spacing.sm, // Extra padding for copy button
    position: 'relative',
  },
  copyButton: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
    padding: spacing.xs,
    opacity: 0.6,
  },
  userBubble: {
    backgroundColor: colors.accent,
    marginLeft: 'auto',
  },
  messageText: {
    fontSize: typography.sizes.md,
    color: colors.textPrimary,
    lineHeight: typography.sizes.md * typography.lineHeights.relaxed, // More relaxed line height
    textAlign: 'left',
  },
  italicText: {
    fontStyle: 'italic',
    fontSize: typography.sizes.md, // Same size as regular text
    color: colors.textPrimary, // Inherit color from parent
    lineHeight: typography.sizes.md * typography.lineHeights.relaxed, // Same line height
  },
  userMessageText: {
    color: colors.white,
  },
  quickQuestionsContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  quickButton: {
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  quickButtonText: {
    fontSize: typography.sizes.sm,
    color: colors.accent,
    fontWeight: typography.weights.medium,
  },
  offlineMessageContainer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
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
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
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

