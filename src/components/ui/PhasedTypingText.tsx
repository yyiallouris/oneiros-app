/**
 * Smooth word-by-word typing for dream interpretations.
 * UX principles:
 * - Word-by-word (not char) to avoid line-break jitter
 * - Pre-render final text invisibly to reserve layout space
 * - Smooth, readable pace (not aggressive)
 * - Stable layout: no shifting, no aggressive rewrapping
 */

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Text, TextProps } from 'react-native';

// Word-by-word timing: smooth, contemplative pace
const WORD_DELAY_MS = 35; // ~35ms per word = ~17 words/sec (comfortable reading pace)

export interface PhasedTypingTextProps extends TextProps {
  text: string;
  onComplete?: () => void;
}

interface ParsedSection {
  type: 'anchor' | 'atmosphere' | 'key_symbols' | 'archetypal' | 'questions' | 'other';
  raw: string;
  /** For key_symbols: [heading, bullet1, bullet2, ...] */
  chunks?: string[];
}

/**
 * Normalize markdown text for typing display.
 * This must match formatMarkdownText used in FormattedMessageText for consistency.
 * Converts markdown to clean text so live typing matches the final rendered view.
 */
function normalizeInterpretationForTyping(text: string): string {
  if (!text) return '';
  
  let formatted = text;
  
  try {
    // Convert headers to plain text with spacing (keep content, remove ## markers)
    formatted = formatted.replace(/^#{1,6}\s+(.+)$/gm, (match, content) => {
      return content ? `\n${content}\n` : match;
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
    
    return formatted.trim();
  } catch (error) {
    console.warn('[PhasedTypingText] Normalization error:', error);
    return text;
  }
}

// Simplified: just do simple char-by-char typing of the whole normalized text
// No section parsing, no phased reveals - just clean, reliable typing

export const PhasedTypingText: React.FC<PhasedTypingTextProps> = ({
  text,
  onComplete,
  style,
  ...textProps
}) => {
  const [displayedWords, setDisplayedWords] = useState<string[]>([]);
  const wordIdxRef = useRef(0);
  const wordsRef = useRef<string[]>([]);
  const normalizedTextRef = useRef('');
  const isCompleteRef = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const clearTimeoutSafe = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const typeNextWord = useCallback(() => {
    const allWords = wordsRef.current;
    const currentIdx = wordIdxRef.current;

    if (currentIdx >= allWords.length) {
      if (onCompleteRef.current && !isCompleteRef.current) {
        isCompleteRef.current = true;
        onCompleteRef.current();
      }
      return;
    }

    setDisplayedWords((prev) => [...prev, allWords[currentIdx]]);
    wordIdxRef.current = currentIdx + 1;
    timeoutRef.current = setTimeout(typeNextWord, WORD_DELAY_MS);
  }, []);

  useEffect(() => {
    // Normalize text once
    normalizedTextRef.current = normalizeInterpretationForTyping(text);
    
    // Split into words (preserving spaces and newlines as separate tokens)
    // This keeps layout stable: "word " "word " "\n" "word "
    const tokens: string[] = [];
    let current = '';
    
    for (let i = 0; i < normalizedTextRef.current.length; i++) {
      const char = normalizedTextRef.current[i];
      
      if (char === ' ') {
        if (current) {
          tokens.push(current + ' '); // word with trailing space
          current = '';
        }
      } else if (char === '\n') {
        if (current) {
          tokens.push(current); // word without space before newline
          current = '';
        }
        tokens.push('\n'); // newline as separate token
      } else {
        current += char;
      }
    }
    
    if (current) {
      tokens.push(current); // last word
    }
    
    wordsRef.current = tokens;
    wordIdxRef.current = 0;
    setDisplayedWords([]);
    isCompleteRef.current = false;

    if (tokens.length === 0) {
      onCompleteRef.current?.();
      return;
    }

    typeNextWord();
    return clearTimeoutSafe;
  }, [text, typeNextWord, clearTimeoutSafe]);

  useEffect(() => clearTimeoutSafe, [clearTimeoutSafe]);

  // Render: just the typing text (word-by-word is smooth enough, no pre-render needed)
  const typingText = displayedWords.join('');

  return (
    <Text style={style} {...textProps}>
      {typingText}
    </Text>
  );
};
