/**
 * Phased typing: reveals content in layers with rest points.
 * Principle: don't "reveal" — let meaning form. Thought taking shape, not report loading.
 *
 * Phase 1: Anchor only (first 3–4 sec) — landing point, no headings/symbols/archetypes
 * Phase 2: Atmosphere & Affect — 1 paragraph, no bullets yet
 * Phase 3: Key Symbols — heading, then one bullet at a time with pauses
 * Phase 4: Archetypal Dynamics — with delay; omit if empty
 * Phase 5: Reflective Questions — last, slower, with space before
 */

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Text, TextProps } from 'react-native';

const SECTION_PAUSE_MS = 450;
const BULLET_PAUSE_MS = 280;
const ANCHOR_SPEED = 4;
const BODY_SPEED = 4;
const QUESTIONS_SPEED = 7;

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

function parseInterpretationSections(text: string): ParsedSection[] {
  const sections: ParsedSection[] = [];
  if (!text.trim()) return sections;

  // Split by ## headings or numbered headings (1. **Title**)
  const parts = text.split(/(?=^##\s+|\n\d+\.\s+\*\*)/m);
  const anchor = parts[0]?.trim() || '';
  if (anchor) {
    sections.push({ type: 'anchor', raw: anchor });
  }

  for (let i = 1; i < parts.length; i++) {
    const block = parts[i].trim();
    const firstLineEnd = block.indexOf('\n');
    const firstLine = firstLineEnd >= 0 ? block.slice(0, firstLineEnd) : block;
    const content = firstLineEnd >= 0 ? block.slice(firstLineEnd + 1).trim() : '';

    const lower = firstLine.toLowerCase();
    if (lower.includes('atmosphere') || lower.includes('affect')) {
      sections.push({ type: 'atmosphere', raw: block });
    } else if (lower.includes('key symbols') || lower.includes('symbols')) {
      const lines = content.split('\n');
      const heading = firstLine + '\n';
      const bullets = lines.filter((l) => /^[-*]\s+/.test(l.trim()));
      const chunks = [heading, ...bullets.map((b) => '\n' + b)];
      sections.push({ type: 'key_symbols', raw: block, chunks });
    } else if (lower.includes('archetypal') || lower.includes('dynamics')) {
      if (content.replace(/\s/g, '').length > 0) {
        sections.push({ type: 'archetypal', raw: block });
      }
    } else if (lower.includes('reflective') || lower.includes('questions')) {
      sections.push({ type: 'questions', raw: block });
    } else {
      sections.push({ type: 'other', raw: block });
    }
  }

  return sections;
}

export const PhasedTypingText: React.FC<PhasedTypingTextProps> = ({
  text,
  onComplete,
  style,
  ...textProps
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const sectionsRef = useRef<ParsedSection[]>([]);
  const sectionIdxRef = useRef(0);
  const chunkIdxRef = useRef(0);
  const charIdxRef = useRef(0);
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

  const advance = useCallback(() => {
    const sections = sectionsRef.current;
    const si = sectionIdxRef.current;

    if (si >= sections.length) {
      if (onCompleteRef.current && !isCompleteRef.current) {
        isCompleteRef.current = true;
        onCompleteRef.current();
      }
      return;
    }

    const section = sections[si];
    const speed = section.type === 'questions' ? QUESTIONS_SPEED : section.type === 'anchor' ? ANCHOR_SPEED : BODY_SPEED;

    // Key Symbols: reveal chunk by chunk (heading, bullet1, bullet2, ...)
    if (section.type === 'key_symbols' && section.chunks && section.chunks.length > 0) {
      const chunks = section.chunks;
      const ci = chunkIdxRef.current;

      if (ci >= chunks.length) {
        sectionIdxRef.current = si + 1;
        chunkIdxRef.current = 0;
        charIdxRef.current = 0;
        timeoutRef.current = setTimeout(advance, SECTION_PAUSE_MS);
        return;
      }

      const chunk = chunks[ci];
      let charIdx = charIdxRef.current;

      const typeChar = () => {
        if (charIdx < chunk.length) {
          setDisplayedText((prev) => prev + chunk[charIdx]);
          charIdx++;
          charIdxRef.current = charIdx;
          timeoutRef.current = setTimeout(typeChar, speed);
        } else {
          charIdxRef.current = 0;
          chunkIdxRef.current = ci + 1;
          timeoutRef.current = setTimeout(advance, BULLET_PAUSE_MS);
        }
      };
      typeChar();
      return;
    }

    // Standard section: char-by-char
    const target = section.raw + (si < sections.length - 1 ? '\n\n' : '');
    let charIdx = charIdxRef.current;

    const typeChar = () => {
      if (charIdx < target.length) {
        setDisplayedText((prev) => prev + target[charIdx]);
        charIdx++;
        charIdxRef.current = charIdx;
        timeoutRef.current = setTimeout(typeChar, speed);
      } else {
        charIdxRef.current = 0;
        sectionIdxRef.current = si + 1;
        timeoutRef.current = setTimeout(advance, SECTION_PAUSE_MS);
      }
    };
    typeChar();
  }, []);

  useEffect(() => {
    sectionsRef.current = parseInterpretationSections(text);
    sectionIdxRef.current = 0;
    chunkIdxRef.current = 0;
    charIdxRef.current = 0;
    setDisplayedText('');
    isCompleteRef.current = false;

    if (sectionsRef.current.length === 0) {
      setDisplayedText(text);
      onCompleteRef.current?.();
      return;
    }

    advance();
    return clearTimeoutSafe;
  }, [text]);

  useEffect(() => clearTimeoutSafe, [clearTimeoutSafe]);

  return (
    <Text style={style} {...textProps}>
      {displayedText}
    </Text>
  );
};
