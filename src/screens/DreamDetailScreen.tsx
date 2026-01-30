import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Clipboard,
} from 'react-native';
import { useFocusEffect, useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackParamList } from '../navigation/types';
import { colors, spacing, typography, borderRadius } from '../theme';
import { Card, Button, Chip, WaveBackground, MountainWaveBackground, BreathingLine, PrintPatchLoader, LinoSkeletonCard } from '../components/ui';
import { Animated, Dimensions } from 'react-native';
import { PhasedTypingText } from '../components/ui/PhasedTypingText';
import { Dream, Interpretation, ChatMessage } from '../types/dream';
import { getDreamById, getInterpretationByDreamId, saveInterpretation, deleteInterpretation, saveDream } from '../utils/storage';
import { formatDateShort, generateId } from '../utils/date';
import { generateInitialInterpretation, sendChatMessage, extractSymbolsAndArchetypes, extractDreamSymbolsAndArchetypes, filterArchetypesForDisplay } from '../services/ai';
import { isOnline } from '../utils/network';
import { OfflineMessage } from '../components/OfflineMessage';
import Svg, { Path, Circle, Defs, RadialGradient, Stop } from 'react-native-svg';

type NavigationProp = StackNavigationProp<RootStackParamList, 'DreamDetail'>;
type DetailRouteProp = RouteProp<RootStackParamList, 'DreamDetail'>;

// Edit icon
const EditIcon = ({ size = 24, color = colors.accent }) => (
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

// Wave divider
const WaveDivider: React.FC = () => (
  <View style={styles.waveDivider}>
    <Svg width="100%" height="4" viewBox="0 0 100 4" preserveAspectRatio="none">
      <Path
        d="M0,2 Q25,0 50,2 T100,2"
        stroke={colors.accent}
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
  onTypingComplete?: () => void;
  onCopy?: (text: string) => void;
}

// Helper function to extract a better summary from the AI response
// Tries to get the first meaningful section (Atmosphere & Affect or first paragraph)
const extractSummary = (text: string, maxLength: number = 250): string => {
  if (!text) return '';
  
  // Try to find "Atmosphere & Affect" section first
  const atmosphereMatch = text.match(/(?:Atmosphere\s*&\s*Affect|1\.\s*\*\*Atmosphere\s*&\s*Affect\*\*)[\s\S]*?(?=\n\s*(?:\d+\.\s*\*\*|$))/i);
  if (atmosphereMatch) {
    let summary = atmosphereMatch[0];
    // Remove the header
    summary = summary.replace(/^(?:Atmosphere\s*&\s*Affect|1\.\s*\*\*Atmosphere\s*&\s*Affect\*\*)\s*/i, '');
    // Get first paragraph or up to maxLength
    const firstParagraph = summary.split('\n\n')[0] || summary;
    if (firstParagraph.length <= maxLength) {
      return firstParagraph.trim();
    }
    // If too long, cut at sentence boundary
    const sentences = firstParagraph.match(/[^.!?]+[.!?]+/g) || [];
    let result = '';
    for (const sentence of sentences) {
      if ((result + sentence).length <= maxLength) {
        result += sentence;
      } else {
        break;
      }
    }
    return result.trim() || firstParagraph.substring(0, maxLength).trim();
  }
  
  // Fallback: get first paragraph or first maxLength characters
  const firstParagraph = text.split('\n\n')[0] || text;
  if (firstParagraph.length <= maxLength) {
    return firstParagraph.trim();
  }
  
  // Cut at sentence boundary
  const sentences = firstParagraph.match(/[^.!?]+[.!?]+/g) || [];
  let result = '';
  for (const sentence of sentences) {
    if ((result + sentence).length <= maxLength) {
      result += sentence;
    } else {
      break;
    }
  }
  return result.trim() || firstParagraph.substring(0, maxLength).trim();
};

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

const ChatBubble: React.FC<ChatBubbleProps> = ({ message, isUser, isTyping = false, onTypingComplete, onCopy }) => {
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
      <View style={[styles.messageBubble, isUser && styles.userBubble]}>
        {isTyping && !isUser ? (
          <PhasedTypingText
            text={message.content}
            onComplete={onTypingComplete}
            style={[styles.messageText, isUser && styles.userMessageText]}
          />
        ) : (
          <FormattedMessageText text={message.content || ''} isUser={isUser} />
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

const DreamDetailScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<DetailRouteProp>();
  const { dreamId } = route.params;
  const insets = useSafeAreaInsets();

  const [dream, setDream] = useState<Dream | null>(null);
  const [interpretation, setInterpretation] = useState<Interpretation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingInitial, setIsLoadingInitial] = useState(true);
  const [isGeneratingInitial, setIsGeneratingInitial] = useState(false);
  const [typingMessageId, setTypingMessageId] = useState<string | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [isInterpretationExpanded, setIsInterpretationExpanded] = useState(false);
  const [isUserScrolledUp, setIsUserScrolledUp] = useState(false);
  const [chatScrollHeight, setChatScrollHeight] = useState(0);
  const [chatScrollOffset, setChatScrollOffset] = useState(0);
  const [showOfflineMessage, setShowOfflineMessage] = useState(false);
  const [showDreamSecondarySymbols, setShowDreamSecondarySymbols] = useState(false);
  const [showInterpretationSecondarySymbols, setShowInterpretationSecondarySymbols] = useState(false);
  const [showDreamSecondaryArchetypes, setShowDreamSecondaryArchetypes] = useState(false);
  const [showInterpretationSecondaryArchetypes, setShowInterpretationSecondaryArchetypes] = useState(false);

  const flatListRef = useRef<ScrollView>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  useFocusEffect(
    useCallback(() => {
      loadDreamData();
      setShowDreamSecondarySymbols(false);
      setShowInterpretationSecondarySymbols(false);
      setShowDreamSecondaryArchetypes(false);
      setShowInterpretationSecondaryArchetypes(false);
      // Clear typing state when screen gains focus
      return () => {
        setTypingMessageId(null);
      };
    }, [dreamId])
  );

  const loadDreamData = async () => {
    setIsLoadingInitial(true);
    try {
      const dreamData = await getDreamById(dreamId);
      setDream(dreamData);

      if (dreamData) {
        try {
          const interpretationData = await getInterpretationByDreamId(dreamId);
          
          if (interpretationData) {
            // Check if this is a mock response
            const isMockResponse = interpretationData.messages[0]?.content?.includes('Thank you for sharing this dream. Let me reflect on it from a Jungian perspective:') &&
                                 interpretationData.messages[0]?.content?.includes('What emotions arose most strongly during the dream?');
            
            if (isMockResponse) {
              await deleteInterpretation(interpretationData.id);
            } else {
              setInterpretation(interpretationData);
              setMessages(interpretationData.messages);
              // Clear typing state when loading existing messages
              // Messages from storage are already complete, no need to type them
              setTypingMessageId(null);
              // Default to overview; keep chat closed until user taps
              setShowChat(false);
            }
          }
        } catch (error) {
          // If interpretation loading fails, that's okay - dream will still show
          console.warn('[DreamDetail] Failed to load interpretation:', error);
        }
      }
    } catch (error) {
      // If dream loading fails, show error but stop loading
      console.error('[DreamDetail] Failed to load dream:', error);
    } finally {
      // Always stop loading, even if there's an error
      setIsLoadingInitial(false);
    }
  };

  const animateChatOpen = () => {
    // Chat opens immediately, no animation needed
    setShowChat(true);
  };

  const animateChatClose = () => {
    setShowChat(false);
  };

  const generateInitialAIInterpretation = async (dreamData: Dream) => {
    setIsGeneratingInitial(true);
    try {
      // Ensure dream exists in Supabase (handles legacy local-only dreams)
      await saveDream(dreamData);

      const aiResponse = await generateInitialInterpretation(dreamData);
      
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

      try {
        const structured = await extractDreamSymbolsAndArchetypes(dreamData);
        archetypes = filterArchetypesForDisplay(structured.archetypes ?? [], aiResponse);
        if (proseExtracted.symbols.length <= 2 && structured.symbols && structured.symbols.length > symbols.length) {
          symbols = structured.symbols;
          landscapes = structured.landscapes ?? landscapes;
        } else if (structured.landscapes && structured.landscapes.length > 0) {
          landscapes = structured.landscapes;
        }
      } catch {
        archetypes = filterArchetypesForDisplay(proseExtracted.archetypes, aiResponse);
      }

      if (__DEV__) {
        console.log('[DreamInterpretation] Extracted (new):', {
          symbolsCount: symbols.length,
          symbols: symbols.slice(0, 10),
          landscapesCount: landscapes.length,
          landscapes: landscapes,
        });
      }
      const newInterpretation: Interpretation = {
        id: generateId(),
        dreamId: dreamData.id,
        messages: [aiMessage],
        symbols,
        archetypes,
        landscapes: landscapes.length > 0 ? landscapes : undefined,
        summary: extractSummary(aiResponse, 250),
        dreamContentAtCreation: dreamData.content, // Store content to detect if only title changed
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await saveInterpretation(newInterpretation);
      setInterpretation(newInterpretation);
      setMessages([aiMessage]);
      setTypingMessageId(aiMessage.id);
      
      // Show chat - replaces reflection section
      setShowChat(true);
      
      // Reset scroll state when starting new conversation
      setIsUserScrolledUp(false);
      
      // Scroll to chat section
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
        // Also scroll chat messages to bottom
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 200);
      }, 300);
    } catch (error: any) {
      console.error('[DreamDetail] Error generating interpretation:', error);
      const errorMessage = error?.message || 'Failed to generate interpretation. Please try again.';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsGeneratingInitial(false);
    }
  };

  const handleAskAI = async () => {
    if (!dream) return;
    
    // Check if online before proceeding
    const online = await isOnline();
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
      const aiResponse = await generateInitialInterpretation(dream);

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

      try {
        const structured = await extractDreamSymbolsAndArchetypes(dream);
        archetypes = filterArchetypesForDisplay(structured.archetypes ?? [], aiResponse);
        if (proseExtracted.symbols.length <= 2 && structured.symbols && structured.symbols.length > symbols.length) {
          symbols = structured.symbols;
          landscapes = structured.landscapes ?? landscapes;
        } else if (structured.landscapes && structured.landscapes.length > 0) {
          landscapes = structured.landscapes;
        }
      } catch {
        archetypes = filterArchetypesForDisplay(proseExtracted.archetypes, aiResponse);
      }

      if (__DEV__) {
        console.log('[DreamInterpretation] Extracted (update):', {
          symbolsCount: symbols.length,
          symbols: symbols.slice(0, 10),
          landscapesCount: landscapes.length,
          landscapes: landscapes,
        });
      }
      const updatedInterpretation: Interpretation = {
        ...interpretation,
        messages: [aiMessage],
        symbols,
        archetypes,
        landscapes: landscapes.length > 0 ? landscapes : undefined,
        summary: extractSummary(aiResponse, 250),
        dreamContentAtCreation: dream.content, // Update stored content
        updatedAt: new Date().toISOString(),
      };

      await saveInterpretation(updatedInterpretation);
      setInterpretation(updatedInterpretation);
      setMessages([aiMessage]);
      setTypingMessageId(aiMessage.id);

      // Show chat and scroll into view
      setShowChat(true);
      setIsUserScrolledUp(false);

      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 200);
      }, 300);
    } catch (error: any) {
      console.error('[DreamDetail] Error updating interpretation:', error);
      const errorMessage = error?.message || 'Failed to update interpretation. Please try again.';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsGeneratingInitial(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || !dream || !interpretation || isLoading) return;

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
      setTypingMessageId(aiMessage.id);

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
        }, 200);
      }
    } catch (error: any) {
      console.error('[DreamDetail] Error sending message:', error);
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
      <View style={styles.container}>
        <MountainWaveBackground height={300} showSun={true} />
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Dream content skeleton - matches dreamCard position */}
          <LinoSkeletonCard style={styles.skeletonCardStyle} />
          
          {/* Wave divider placeholder */}
          <View style={{ height: spacing.lg }} />
          
          {/* Interpretation section skeleton - matches reflectionSection position */}
          <View style={styles.reflectionSection}>
            <LinoSkeletonCard style={styles.skeletonCardStyle} />
          </View>
        </ScrollView>
      </View>
    );
  }

  if (!dream) {
    return (
      <View style={styles.container}>
        <MountainWaveBackground height={300} showSun={true} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Dream not found</Text>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior="padding"
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <MountainWaveBackground height={300} showSun={true} />
      
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Dream Content Card */}
        <Card style={styles.dreamCard}>
          <View style={styles.dreamHeader}>
            <Text style={styles.date}>{formatDateShort(dream.date)}</Text>
          </View>

          {dream.title && (
            <Text style={styles.title}>{dream.title}</Text>
          )}

          <Text style={styles.content}>{dream.content}</Text>
        </Card>

        {/* Dream Symbols and Archetypes */}
        {(dream.symbols?.length > 0 || dream.archetypes?.length > 0) && (
          <Card style={styles.symbolsCard}>
            {dream.symbols && dream.symbols.length > 0 && (
              <View style={styles.chipsSection}>
                <Text style={styles.chipsSectionTitle}>Symbols</Text>
                <View style={styles.chipsContainer}>
                  {dream.symbols.slice(0, 4).map((symbol, index) => (
                    <Chip key={index} label={symbol} variant="accent" />
                  ))}
                </View>
                {dream.symbols.length > 4 && (
                  <TouchableOpacity
                    style={styles.viewMoreButton}
                    onPress={() => setShowDreamSecondarySymbols((v) => !v)}
                  >
                    <Text style={styles.viewMoreText}>
                      {showDreamSecondarySymbols ? 'Show less' : `View more (${dream.symbols.length - 4} symbols)`}
                    </Text>
                  </TouchableOpacity>
                )}
                {showDreamSecondarySymbols && dream.symbols.length > 4 && (
                  <View style={styles.chipsSection}>
                    <Text style={styles.chipsSectionTitle}>Secondary symbols</Text>
                    <View style={styles.chipsContainer}>
                      {dream.symbols.slice(4).map((symbol, index) => (
                        <Chip key={index + 4} label={symbol} variant="default" />
                      ))}
                    </View>
                  </View>
                )}
              </View>
            )}

            {dream.archetypes && dream.archetypes.length > 0 && (
              <View style={styles.chipsSection}>
                <Text style={styles.chipsSectionTitle}>Archetypes</Text>
                <View style={styles.chipsContainer}>
                  {dream.archetypes.slice(0, 4).map((archetype, index) => (
                    <Chip key={index} label={archetype} variant="default" />
                  ))}
                </View>
                {dream.archetypes.length > 4 && (
                  <TouchableOpacity
                    style={styles.viewMoreButton}
                    onPress={() => setShowDreamSecondaryArchetypes((v) => !v)}
                  >
                    <Text style={styles.viewMoreText}>
                      {showDreamSecondaryArchetypes ? 'Show less' : `View more (${dream.archetypes.length - 4} archetypes)`}
                    </Text>
                  </TouchableOpacity>
                )}
                {showDreamSecondaryArchetypes && dream.archetypes.length > 4 && (
                  <View style={styles.chipsSection}>
                    <Text style={styles.chipsSectionTitle}>Secondary archetypes</Text>
                    <View style={styles.chipsContainer}>
                      {dream.archetypes.slice(4).map((archetype, index) => (
                        <Chip key={index + 4} label={archetype} variant="default" />
                      ))}
                    </View>
                  </View>
                )}
              </View>
            )}
          </Card>
        )}

        <WaveDivider />

        {/* Show reflection section only if no chat is active */}
        {!showChat && !isGeneratingInitial && (
          <View style={styles.reflectionSection}>
            <Text style={styles.reflectionTitle}>Jungian reflection</Text>

            {interpretation ? (
              <Card style={styles.interpretationCard}>
                {/* Show only symbols and archetypes here; landscapes are used in Insights tab only */}
                {interpretation.symbols.length > 0 && (
                  <View style={styles.chipsSection}>
                    <Text style={styles.chipsSectionTitle}>Main symbols</Text>
                    <View style={styles.chipsContainer}>
                      {interpretation.symbols.slice(0, 4).map((symbol, index) => (
                        <Chip key={index} label={symbol} variant="accent" />
                      ))}
                    </View>
                    {interpretation.symbols.length > 4 && (
                      <TouchableOpacity
                        style={styles.viewMoreButton}
                        onPress={() => setShowInterpretationSecondarySymbols((v) => !v)}
                      >
                        <Text style={styles.viewMoreText}>
                          {showInterpretationSecondarySymbols ? 'Show less' : `View more (${interpretation.symbols.length - 4} symbols)`}
                        </Text>
                      </TouchableOpacity>
                    )}
                    {showInterpretationSecondarySymbols && interpretation.symbols.length > 4 && (
                      <View style={styles.chipsSection}>
                        <Text style={styles.chipsSectionTitle}>Secondary symbols</Text>
                        <View style={styles.chipsContainer}>
                          {interpretation.symbols.slice(4).map((symbol, index) => (
                            <Chip key={index + 4} label={symbol} variant="default" />
                          ))}
                        </View>
                      </View>
                    )}
                  </View>
                )}

                {interpretation.archetypes.length > 0 && (
                  <View style={styles.chipsSection}>
                    <Text style={styles.chipsSectionTitle}>Archetypes</Text>
                    <View style={styles.chipsContainer}>
                      {interpretation.archetypes.slice(0, 4).map((archetype, index) => (
                        <Chip key={index} label={archetype} variant="default" />
                      ))}
                    </View>
                    {interpretation.archetypes.length > 4 && (
                      <TouchableOpacity
                        style={styles.viewMoreButton}
                        onPress={() => setShowInterpretationSecondaryArchetypes((v) => !v)}
                      >
                        <Text style={styles.viewMoreText}>
                          {showInterpretationSecondaryArchetypes ? 'Show less' : `View more (${interpretation.archetypes.length - 4} archetypes)`}
                        </Text>
                      </TouchableOpacity>
                    )}
                    {showInterpretationSecondaryArchetypes && interpretation.archetypes.length > 4 && (
                      <View style={styles.chipsSection}>
                        <Text style={styles.chipsSectionTitle}>Secondary archetypes</Text>
                        <View style={styles.chipsContainer}>
                          {interpretation.archetypes.slice(4).map((archetype, index) => (
                            <Chip key={index + 4} label={archetype} variant="default" />
                          ))}
                        </View>
                      </View>
                    )}
                  </View>
                )}

                {interpretation.summary && (
                  <Text 
                    style={styles.summary}
                    textBreakStrategy="highQuality"
                    selectable={true}
                    numberOfLines={isInterpretationExpanded ? undefined : 5}
                  >
                    {isInterpretationExpanded 
                      ? formatMarkdownText(interpretation.messages[0]?.content || interpretation.summary)
                      : formatMarkdownText(interpretation.summary)
                    }
                  </Text>
                )}

                {/* Action buttons */}
                <View style={styles.actionButtonsContainer}>
                  {/* Show update button only if content changed (not just title) */}
                  {dream.updatedAt > interpretation.updatedAt && 
                   dream.content !== interpretation.dreamContentAtCreation && (
                    <>
                      {showOfflineMessage && (
                        <OfflineMessage
                          featureName="Jungian AI interpretation"
                          icon="🧠"
                        />
                      )}
                      <Button
                        title="Update interpretation"
                        onPress={handleUpdateInterpretation}
                        variant="secondary"
                        style={[styles.conversationButton, styles.updateButton]}
                      />
                    </>
                  )}
                  
                  {/* Expand/Continue conversation button */}
                  {!isInterpretationExpanded ? (
                    <Button
                      title="Expand conversation"
                      onPress={() => {
                        setIsInterpretationExpanded(true);
                        setTimeout(() => {
                          scrollViewRef.current?.scrollToEnd({ animated: true });
                        }, 100);
                      }}
                      variant="secondary"
                      style={styles.conversationButton}
                    />
                  ) : (
                    <Button
                      title="Continue exploring"
                      onPress={() => {
                        setShowChat(true);
                        setIsInterpretationExpanded(false); // Reset when opening chat
                        animateChatOpen();
                        setTimeout(() => {
                          scrollViewRef.current?.scrollToEnd({ animated: true });
                        }, 300);
                      }}
                      variant="secondary"
                      style={styles.conversationButton}
                    />
                  )}
                </View>
              </Card>
            ) : (
              <Card style={styles.noInterpretationCard}>
                <Text style={styles.noInterpretationText}>
                  Ask the AI to reflect on symbols, archetypes and shadow dynamics.
                </Text>
                {showOfflineMessage && (
                  <OfflineMessage
                    featureName="Jungian AI interpretation"
                    icon="🧠"
                  />
                )}
                <Button
                  title="Ask Jungian AI"
                  onPress={handleAskAI}
                  style={styles.askButton}
                />
              </Card>
            )}
          </View>
        )}

        {/* Loading state */}
        {isGeneratingInitial && (
          <View style={styles.reflectionSection}>
            <Card style={styles.loadingCard}>
              <PrintPatchLoader size={72} color={colors.accent} />
              <Text style={styles.loadingText}>Analyzing your dream...</Text>
            </Card>
          </View>
        )}

        {/* Inline Chat Section - replaces reflection section */}
        {showChat && (
          <View style={styles.chatSection}>
            <View style={styles.chatHeader}>
              <Text style={styles.chatTitle}>Jungian reflection</Text>
              <TouchableOpacity onPress={animateChatClose} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>×</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView
              ref={flatListRef}
              style={styles.chatScrollView}
              contentContainerStyle={styles.chatContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={true}
              nestedScrollEnabled={true}
              onScroll={(event) => {
                const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
                const scrollPosition = contentOffset.y;
                const maxScroll = contentSize.height - layoutMeasurement.height;
                
                // Check if user is near the bottom (within 50px)
                const isNearBottom = maxScroll - scrollPosition < 50;
                
                // Update scroll state
                setChatScrollHeight(contentSize.height);
                setChatScrollOffset(scrollPosition);
                
                // If user scrolls up, mark it
                if (!isNearBottom) {
                  setIsUserScrolledUp(true);
                } else {
                  // User is at bottom, allow auto-scroll
                  setIsUserScrolledUp(false);
                }
              }}
              scrollEventThrottle={16}
              onContentSizeChange={(contentWidth, contentHeight) => {
                // Only auto-scroll if user hasn't manually scrolled up
                if (!isUserScrolledUp) {
                  setTimeout(() => {
                    flatListRef.current?.scrollToEnd({ animated: true });
                  }, 100);
                }
              }}
            >
              {messages.map((item) => (
                <ChatBubble 
                  key={item.id}
                  message={item} 
                  isUser={item.role === 'user'} 
                  isTyping={typingMessageId === item.id}
                  onTypingComplete={() => {
                    if (typingMessageId === item.id) {
                      setTypingMessageId(null);
                    }
                  }}
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
              ))}
            </ScrollView>

            <View style={[styles.inputContainer, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
              <TextInput
                style={styles.input}
                placeholder="Ask a question..."
                placeholderTextColor={colors.textMuted}
                value={inputText}
                onChangeText={setInputText}
                multiline
                maxLength={500}
                onFocus={() => {
                  // Scroll to bottom when focusing input
                  setTimeout(() => {
                    scrollViewRef.current?.scrollToEnd({ animated: true });
                  }, 100);
                }}
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
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    overflow: 'visible', // Allow sun to appear above
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  editButton: {
    marginRight: spacing.md,
  },
  dreamCard: {
    marginBottom: spacing.lg,
  },
  symbolsCard: {
    marginBottom: spacing.lg,
    backgroundColor: 'rgba(240, 229, 223, 0.7)', // Semi-transparent to show sun
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
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
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
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
    zIndex: 1,
    position: 'relative',
  },
  interpretationCard: {
    zIndex: 1,
    position: 'relative',
    backgroundColor: 'rgba(240, 229, 223, 0.7)', // Semi-transparent to show sun
    width: '100%', // Use full width
  },
  chipsSection: {
    marginBottom: spacing.md,
    marginTop: spacing.xs,
  },
  chipsSectionTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  viewMoreButton: {
    marginTop: spacing.sm,
    paddingVertical: spacing.xs,
  },
  viewMoreText: {
    fontSize: typography.sizes.sm,
    color: colors.accent,
    fontWeight: typography.weights.medium,
  },
  summary: {
    fontSize: typography.sizes.md,
    color: colors.textPrimary,
    lineHeight: typography.sizes.md * typography.lineHeights.relaxed,
    marginBottom: spacing.md,
    marginTop: spacing.sm,
    textAlign: 'left',
  },
  conversationButton: {
    marginTop: spacing.sm,
    borderWidth: 2, // More prominent outline
    shadowColor: colors.accentLight,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  actionButtonsContainer: {
    flexDirection: 'column',
    gap: spacing.sm,
  },
  updateButton: {
    marginBottom: spacing.xs,
  },
  noInterpretationCard: {
    alignItems: 'center',
    zIndex: 1,
    position: 'relative',
    backgroundColor: 'rgba(240, 229, 223, 0.5)', // More transparent to show sun
  },
  noInterpretationText: {
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: typography.sizes.md * typography.lineHeights.normal,
  },
  askButton: {
    minWidth: 200,
  },
  loadingCard: {
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: 'rgba(240, 229, 223, 0.7)', // Semi-transparent to show sun
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
  },
  chatSection: {
    marginTop: spacing.lg,
    backgroundColor: 'rgba(240, 229, 223, 0.7)', // Semi-transparent to show sun
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    flex: 1,
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
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
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
  chatScrollView: {
    maxHeight: 400,
    flexGrow: 0,
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
    backgroundColor: 'rgba(237, 230, 223, 0.7)', // Semi-transparent to show sun
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    paddingRight: spacing.xl + spacing.sm, // Extra padding for copy button
    minHeight: 40, // Prevent layout shift during typing
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
    backgroundColor: 'rgba(168, 156, 207, 0.9)', // Semi-transparent accent color
    marginLeft: 'auto',
  },
  messageText: {
    fontSize: typography.sizes.md,
    color: colors.textPrimary,
    lineHeight: typography.sizes.md * typography.lineHeights.relaxed, // More relaxed line height
    includeFontPadding: false,
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
  inputContainer: {
    flexDirection: 'row',
    padding: spacing.md,
    paddingTop: spacing.lg,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: typography.sizes.md,
    color: colors.textPrimary,
    minHeight: 60,
    maxHeight: 120,
    marginRight: spacing.sm,
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
  skeletonCardStyle: {
    marginBottom: 0, // No extra margin, matches actual card spacing
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
