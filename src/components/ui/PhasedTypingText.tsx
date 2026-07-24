/**
 * Smooth word-by-word typing for dream interpretations.
 * UX principles:
 * - Word-by-word (not char) to avoid line-break jitter
 * - Smooth, readable pace (not aggressive)
 * - Stable layout: append-aware updates so streamed partials do not restart
 * - Same markdown formatting as the settled FormattedMessageText view
 */

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Text, TextProps } from 'react-native';
import { formatInterpretationMarkdown } from '../../utils/formatInterpretationMarkdown';

// Word-by-word timing: smooth, contemplative pace
const WORD_DELAY_MS = 35; // ~35ms per word = ~17 words/sec (comfortable reading pace)

export interface PhasedTypingTextProps extends TextProps {
  text: string;
  onComplete?: () => void;
}

function tokenizeForTyping(text: string): string[] {
  const tokens: string[] = [];
  let current = '';

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (char === ' ') {
      if (current) {
        tokens.push(current + ' ');
        current = '';
      }
    } else if (char === '\n') {
      if (current) {
        tokens.push(current);
        current = '';
      }
      tokens.push('\n');
    } else {
      current += char;
    }
  }

  if (current) {
    tokens.push(current);
  }

  return tokens;
}

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
  const rawTextRef = useRef('');
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
    timeoutRef.current = null;
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
    const previousNormalized = normalizedTextRef.current;
    const previousRaw = rawTextRef.current;
    const nextText = formatInterpretationMarkdown(text);
    const tokens = tokenizeForTyping(nextText);

    const isNormalizedAppend =
      previousNormalized.length > 0 &&
      nextText.startsWith(previousNormalized) &&
      wordIdxRef.current <= tokens.length;

    // Raw append covers cases where closing markdown (e.g. **) reshapes the
    // already-normalized prefix without requiring a full typewriter restart.
    const isRawAppend =
      previousRaw.length > 0 &&
      text.startsWith(previousRaw) &&
      wordIdxRef.current <= tokens.length;

    const isAppendOnlyUpdate = isNormalizedAppend || isRawAppend;

    if (!isAppendOnlyUpdate) {
      clearTimeoutSafe();
      wordIdxRef.current = 0;
      setDisplayedWords([]);
    } else {
      const keepCount = Math.min(wordIdxRef.current, tokens.length);
      wordIdxRef.current = keepCount;
      setDisplayedWords(tokens.slice(0, keepCount));
    }

    wordsRef.current = tokens;
    normalizedTextRef.current = nextText;
    rawTextRef.current = text;
    isCompleteRef.current = false;

    if (tokens.length === 0) {
      onCompleteRef.current?.();
      return clearTimeoutSafe;
    }

    if (!timeoutRef.current && wordIdxRef.current < tokens.length) {
      typeNextWord();
    }
    return clearTimeoutSafe;
  }, [text, typeNextWord, clearTimeoutSafe]);

  useEffect(() => clearTimeoutSafe, [clearTimeoutSafe]);

  const typingText = displayedWords.join('');

  return (
    <Text style={style} {...textProps}>
      {typingText}
    </Text>
  );
};
