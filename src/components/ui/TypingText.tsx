import React, { useEffect, useState, useRef } from 'react';
import { Text, TextProps, StyleSheet, Animated } from 'react-native';

interface TypingTextProps extends TextProps {
  text: string;
  speed?: number; // milliseconds per character
  onComplete?: () => void;
}

export const TypingText: React.FC<TypingTextProps> = ({
  text,
  speed = 5, // Fast typing for smooth reading experience
  onComplete,
  style,
  ...textProps
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const isCompleteRef = useRef(false);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timer = setTimeout(() => {
        setDisplayedText(text.slice(0, currentIndex + 1));
        setCurrentIndex(currentIndex + 1);
      }, speed);

      return () => clearTimeout(timer);
    } else if (currentIndex === text.length && onComplete && !isCompleteRef.current) {
      isCompleteRef.current = true;
      onComplete();
    }
  }, [currentIndex, text, speed, onComplete]);

  // Reset when text changes
  useEffect(() => {
    setDisplayedText('');
    setCurrentIndex(0);
    isCompleteRef.current = false;
  }, [text]);

  return (
    <Text style={style} {...textProps}>
      {displayedText}
    </Text>
  );
};


