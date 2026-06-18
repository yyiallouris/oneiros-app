  import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
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
    ActivityIndicator,
    Alert,
    Clipboard,
  } from 'react-native';
  import { useFocusEffect, useNavigation, useRoute, RouteProp } from '@react-navigation/native';
  import { StackNavigationProp } from '@react-navigation/stack';
  import { useSafeAreaInsets } from 'react-native-safe-area-context';
  import { RootStackParamList } from '../navigation/types';
  import { colors, spacing, typography, borderRadius } from '../theme';
  import { Button, PsycheScreenBackground, PrintPatchLoader, LinoSkeletonCard, DesignExportForeground } from '../components/ui';
  import { PhasedTypingText } from '../components/ui/PhasedTypingText';
  import { VoiceRecordButton } from '../components/ui/VoiceRecordButton';
  import { Dream, Interpretation, ChatMessage } from '../types/dream';
  import { getDreamById, getInterpretationByDreamId, saveInterpretation, deleteInterpretation, saveDream } from '../utils/storage';
  import { formatDateShort, generateId } from '../utils/date';
  import {
    generateInitialInterpretation,
    sendChatMessage,
    filterArchetypesForDisplay,
    updateInterpretationElementsFromConversation,
  } from '../services/ai';
  import { buildDreamDetailDisplayModel, type DreamDetailDisplayModel, type VisibleDreamAnchor } from '../services/dreamDetailDisplay';
  import { getDreamMetadataForReflection } from '../services/dreamMetadataPrefetchService';
  import { getInterpretationDepth } from '../services/userSettingsService';
import { MAX_AI_RESPONSES } from '../constants/interpretation';
  import { isOnline } from '../utils/network';
  import { OfflineMessage } from '../components/OfflineMessage';
  import Svg, { Path } from 'react-native-svg';

  type NavigationProp = StackNavigationProp<RootStackParamList, 'DreamDetail'>;
  type DetailRouteProp = RouteProp<RootStackParamList, 'DreamDetail'>;
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
    onTypingComplete?: () => void;
    onCopy?: (text: string) => void;
    showSettleFooter?: boolean;
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
  const FormattedMessageText = React.memo<{ text: string; isUser: boolean }>(({ text, isUser }) => {
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
  });

  FormattedMessageText.displayName = 'FormattedMessageText';

  const SETTLE_FOOTER = 'This feels like a good point to pause and let the dream settle.\nYou can return tomorrow, or begin a new reflection.';

  const ChatBubble = React.memo<ChatBubbleProps>(({ message, isUser, isTyping = false, onTypingComplete, onCopy, showSettleFooter = false }) => {
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
            <>
              <FormattedMessageText text={message.content || ''} isUser={isUser} />
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
    const rows = [
      ['Emotional weather', model.symbolicLayers.emotionalWeather],
      ['Dream setting', model.symbolicLayers.dreamSetting],
      ['Thresholds', model.symbolicLayers.thresholds],
      ['Relationship field', model.symbolicLayers.relationshipField],
      ['Repeating patterns', model.symbolicLayers.repeatingPatterns],
      ['Inner tensions', model.symbolicLayers.innerTensions],
      ['Archetypal echoes', model.symbolicLayers.archetypalEchoes],
      ['Mythic parallels', model.symbolicLayers.mythicParallels],
    ].filter(([, items]) => Array.isArray(items) && items.length > 0) as Array<[string, string[]]>;

    if (rows.length === 0) return null;

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
            {rows.map(([title, items]) => (
              <View key={title} style={styles.layerRow}>
                <Text style={styles.layerTitle}>{title}</Text>
                <Text style={styles.layerText}>{items.join(', ')}</Text>
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

    const [dream, setDream] = useState<Dream | null>(null);
    const [interpretation, setInterpretation] = useState<Interpretation | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingInitial, setIsLoadingInitial] = useState(true);
    const [isGeneratingInitial, setIsGeneratingInitial] = useState(false);
    const [typingMessageId, setTypingMessageId] = useState<string | null>(null);
    const [showChat, setShowChat] = useState(false);
    const [isUserScrolledUp, setIsUserScrolledUp] = useState(false);
    const [showLimitMessageOnTap, setShowLimitMessageOnTap] = useState(false);
    const [chatScrollHeight, setChatScrollHeight] = useState(0);
    const [chatScrollOffset, setChatScrollOffset] = useState(0);
    const [showOfflineMessage, setShowOfflineMessage] = useState(false);

    const flatListRef = useRef<ScrollView>(null);
    const scrollViewRef = useRef<ScrollView>(null);

    useFocusEffect(
      useCallback(() => {
        loadDreamData();
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
        await saveDream(dreamData);

        const depth = await getInterpretationDepth();
        const aiResponse = await generateInitialInterpretation(dreamData, { depth });

        // Keep metadata extraction as a separate model call over the full dream text.
        let structured: Awaited<ReturnType<typeof getDreamMetadataForReflection>>;
        try {
          structured = await getDreamMetadataForReflection(dreamData, aiResponse);
        } catch {
          Alert.alert('Network error', 'Please check your connection and try again.');
          return;
        }

        const aiMessage: ChatMessage = {
          id: generateId(),
          role: 'assistant',
          content: aiResponse,
          timestamp: new Date().toISOString(),
        };

        const symbols = structured.symbols ?? [];
        const landscapes = structured.landscapes ?? [];
        const archetypes = filterArchetypesForDisplay(structured.archetypes ?? [], aiResponse);
        const affects = structured.affects ?? [];
        const motifs = structured.motifs ?? [];
        const relational_dynamics = structured.relational_dynamics ?? [];
        const thresholds = structured.thresholds ?? [];
        const central_conflicts = structured.central_conflicts ?? [];
        const core_mode = structured.core_mode ?? undefined;
        const amplifications = structured.amplifications ?? [];
        const symbol_stances = structured.symbol_stances ?? [];
        const display_distillation = structured.display_distillation;

        if (__DEV__) {
          console.log('[DreamInterpretation] Extracted (new):', {
            symbolsCount: symbols.length,
            landscapesCount: landscapes.length,
            affectsCount: affects.length,
            motifsCount: motifs.length,
            thresholdsCount: thresholds.length,
            centralConflictsCount: central_conflicts.length,
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
          thresholds: thresholds.length > 0 ? thresholds : undefined,
          central_conflicts: central_conflicts.length > 0 ? central_conflicts : undefined,
          core_mode,
          amplifications: amplifications.length > 0 ? amplifications : undefined,
          symbol_stances: symbol_stances.length > 0 ? symbol_stances : undefined,
          display_distillation,
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
        
        // Don't auto-scroll to chat - let user decide when to scroll
        // This provides ChatGPT-like experience where content appears and user scrolls when ready
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
        const depth = await getInterpretationDepth();
        const aiResponse = await generateInitialInterpretation(dream, { depth });

        // Keep metadata extraction as a separate model call over the full dream text.
        let structured: Awaited<ReturnType<typeof getDreamMetadataForReflection>>;
        try {
          structured = await getDreamMetadataForReflection(dream, aiResponse);
        } catch {
          Alert.alert('Network error', 'Please check your connection and try again.');
          return;
        }

        const aiMessage: ChatMessage = {
          id: generateId(),
          role: 'assistant',
          content: aiResponse,
          timestamp: new Date().toISOString(),
        };

        const symbols = structured.symbols ?? [];
        const landscapes = structured.landscapes ?? [];
        const archetypes = filterArchetypesForDisplay(structured.archetypes ?? [], aiResponse);
        const affects = structured.affects ?? [];
        const motifs = structured.motifs ?? [];
        const relational_dynamics = structured.relational_dynamics ?? [];
        const thresholds = structured.thresholds ?? [];
        const central_conflicts = structured.central_conflicts ?? [];
        const core_mode = structured.core_mode ?? undefined;
        const amplifications = structured.amplifications ?? [];
        const symbol_stances = structured.symbol_stances ?? [];
        const display_distillation = structured.display_distillation;

        if (__DEV__) {
          console.log('[DreamInterpretation] Extracted (update):', {
            symbolsCount: symbols.length,
            landscapesCount: landscapes.length,
            affectsCount: affects.length,
            motifsCount: motifs.length,
            thresholdsCount: thresholds.length,
            centralConflictsCount: central_conflicts.length,
            core_mode,
          });
        }
        const updatedInterpretation: Interpretation = {
          ...interpretation,
          messages: [aiMessage],
          symbols,
          archetypes,
          landscapes: landscapes.length > 0 ? landscapes : undefined,
          affects: affects.length > 0 ? affects : undefined,
          motifs: motifs.length > 0 ? motifs : undefined,
          relational_dynamics: relational_dynamics.length > 0 ? relational_dynamics : undefined,
          thresholds: thresholds.length > 0 ? thresholds : undefined,
          central_conflicts: central_conflicts.length > 0 ? central_conflicts : undefined,
          core_mode,
          amplifications: amplifications.length > 0 ? amplifications : undefined,
          symbol_stances: symbol_stances.length > 0 ? symbol_stances : undefined,
          display_distillation,
          dreamContentAtCreation: dream.content, // Update stored content
          updatedAt: new Date().toISOString(),
        };

        await saveInterpretation(updatedInterpretation);
        setInterpretation(updatedInterpretation);
        setMessages([aiMessage]);
        setTypingMessageId(aiMessage.id);

        // Show chat
        setShowChat(true);
        setIsUserScrolledUp(false);
        
        // Don't auto-scroll - ChatGPT experience: content appears, user scrolls when ready
      } catch (error: any) {
        console.error('[DreamDetail] Error updating interpretation:', error);
        const errorMessage = error?.message || 'Failed to update interpretation. Please try again.';
        Alert.alert('Error', errorMessage);
      } finally {
        setIsGeneratingInitial(false);
      }
    };

    const assistantMessages = useMemo(() => messages.filter((m) => m.role === 'assistant'), [messages]);
    const assistantCount = assistantMessages.length;
    const lastAssistant = assistantMessages[assistantMessages.length - 1] ?? null;
    const reflectionLimitReached = assistantCount >= MAX_AI_RESPONSES;

    const handleSendMessage = async () => {
      if (!inputText.trim() || !dream || !interpretation || isLoading) return;
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
      
      // Reset scroll state when user sends a message (they want to see the response)
      setIsUserScrolledUp(false);

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

        const updatedInterpretationBase: Interpretation = {
          ...interpretation,
          messages: updatedMessages,
          updatedAt: new Date().toISOString(),
        };
        await saveInterpretation(updatedInterpretationBase);
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
        <View style={styles.root}>
          <View style={styles.container}>
            <PsycheScreenBackground waveHeight={180} />
            <DesignExportForeground fill>
              <ScrollView
                style={[styles.scrollView, Platform.OS === 'web' && styles.webScrollView]}
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
            </DesignExportForeground>
          </View>
        </View>
      );
    }

    if (!dream) {
      return (
        <View style={styles.root}>
          <View style={styles.container}>
            <PsycheScreenBackground waveHeight={180} />
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

    return (
      <View style={styles.root}>
        <KeyboardAvoidingView
          style={styles.container}
          behavior="padding"
          keyboardVerticalOffset={keyboardVerticalOffset}
        >
          <PsycheScreenBackground waveHeight={180} />
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
                          {formatMarkdownText(interpretationCollapsedPreview)}
                        </Text>
                      </View>
                    )}

                    <Button
                      title="Continue exploring"
                      onPress={() => {
                        setShowChat(true);
                        animateChatOpen();
                      }}
                      variant="secondary"
                      style={styles.conversationButton}
                    />
                  </View>

                  <SymbolicLayersAccordion model={displayModel} />
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
                    onPress={() => {
                      setTimeout(() => handleAskAI(), 850);
                    }}
                    style={styles.askButton}
                  />
                </View>
              )}
            </View>
          )}

          {/* Loading state */}
          {isGeneratingInitial && (
            <View style={styles.reflectionSection}>
              <View style={styles.loadingPanel}>
                <PrintPatchLoader size={72} color={colors.buttonPrimary} />
                <Text style={styles.loadingText}>Reflecting on your dream...</Text>
                <Text style={styles.loadingSubtext}>Tracing its images, feelings, and inner movement.</Text>
              </View>
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
                style={[styles.chatScrollView, Platform.OS === 'web' && styles.webScrollView]}
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
                onContentSizeChange={() => {
                  // ChatGPT/Grok-style: do NOT auto-scroll during live typing.
                  // Content stays where it is; user scrolls manually to continue reading.
                }}
              >
                {messages.map((item) => {
                  const isLastAssistantAtLimit = item.role === 'assistant' && assistantCount === MAX_AI_RESPONSES && item.id === lastAssistant?.id;
                  return (
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
              </ScrollView>

              {/* Limit message — appears when user taps the disabled input to try to write */}
              {reflectionLimitReached && showLimitMessageOnTap && (
                <View style={styles.limitReachedContainer}>
                  <Text style={styles.limitReachedText}>
                    This reflection has reached its natural depth.
                    You can continue tomorrow or start a new dream.
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
                activeOpacity={reflectionLimitReached ? 0.9 : 1}
                onPress={reflectionLimitReached ? () => setShowLimitMessageOnTap(true) : undefined}
              >
                <TextInput
                  style={styles.input}
                  placeholder="Ask about an image, feeling, or pattern..."
                  placeholderTextColor={colors.textMuted}
                  value={inputText}
                  onChangeText={setInputText}
                  multiline
                  maxLength={3000}
                  editable={!reflectionLimitReached}
                  pointerEvents={reflectionLimitReached ? 'none' : 'auto'}
                  onFocus={() => {
                    if (!reflectionLimitReached) {
                      setTimeout(() => {
                        scrollViewRef.current?.scrollToEnd({ animated: true });
                      }, 100);
                    }
                  }}
                />
                <View style={styles.inputActionSpacer}>
                  <VoiceRecordButton
                    onTranscriptionComplete={(text) => {
                      setInputText((prev) => (prev ? `${prev} ${text}` : text));
                    }}
                    disabled={isLoading || reflectionLimitReached}
                  />
                </View>
                <TouchableOpacity
                  style={[styles.sendButton, (!inputText.trim() || isLoading || reflectionLimitReached) && styles.sendButtonDisabled]}
                  onPress={reflectionLimitReached ? () => setShowLimitMessageOnTap(true) : handleSendMessage}
                  disabled={reflectionLimitReached ? false : (!inputText.trim() || isLoading)}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color={colors.white} />
                  ) : (
                    <SendIcon size={20} color={colors.white} />
                  )}
                </TouchableOpacity>
              </TouchableOpacity>
            </View>
          )}
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
      gap: spacing.sm,
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
      minHeight: 48,
      borderRadius: 18,
      paddingVertical: spacing.sm,
      marginTop: spacing.sm,
      borderWidth: 1,
      shadowColor: colors.buttonGlow,
      shadowOpacity: 0.08,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 3 },
      elevation: 2,
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
      minHeight: 48,
      borderRadius: 18,
      paddingVertical: spacing.sm,
      shadowOpacity: 0.08,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 3 },
      elevation: 2,
    },
    loadingPanel: {
      alignItems: 'center',
      paddingVertical: spacing.xl,
      paddingHorizontal: spacing.md,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderColor: colors.contourLineFaint,
    },
    loadingText: {
      marginTop: spacing.md,
      fontSize: typography.sizes.md,
      color: colors.textSecondary,
    },
    loadingSubtext: {
      marginTop: spacing.xs,
      fontSize: typography.sizes.sm,
      color: colors.textMuted,
      textAlign: 'center',
      lineHeight: typography.sizes.sm * typography.lineHeights.normal,
    },
    chatSection: {
      marginTop: spacing.lg,
      backgroundColor: colors.cardGlassSoft,
      borderRadius: borderRadius.lg,
      borderWidth: 1,
      borderColor: colors.contourLineFaint,
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
      backgroundColor: colors.cardGlassSoft,
      borderRadius: borderRadius.lg,
      borderWidth: 1,
      borderColor: colors.contourLineFaint,
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
      backgroundColor: colors.buttonPrimary90,
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
    sendButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.buttonPrimary,
      borderWidth: 1,
      borderColor: colors.buttonEdge,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: colors.buttonGlow,
      shadowOpacity: 0.24,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 },
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
