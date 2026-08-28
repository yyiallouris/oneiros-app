import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  type ViewStyle,
} from 'react-native';
import type { ReflectiveQuestionArtifact } from '../../ai/reflectiveQuestionPrompt';
import { getReflectiveQuestionCopy } from '../../constants/reflectiveQuestionCopy';
import { colors, spacing, typography, borderRadius } from '../../theme';

type Props = {
  artifact?: ReflectiveQuestionArtifact | null;
  variant?: 'preview' | 'embedded';
  onContinue?: (draft?: string) => void;
  onAnswer?: (answer: string) => void;
  style?: ViewStyle;
  testID?: string;
};

export const ReflectiveQuestionCard: React.FC<Props> = ({
  artifact,
  variant = 'preview',
  onContinue,
  onAnswer,
  style,
  testID = 'reflective-question-card',
}) => {
  const [draft, setDraft] = useState('');
  if (artifact?.status !== 'question' || !artifact.question?.trim()) return null;

  const copy = getReflectiveQuestionCopy(artifact.languageCode);
  const showAnswerField = variant === 'preview' && typeof onAnswer === 'function';
  const trimmedDraft = draft.replace(/\s+/gu, ' ').trim();

  return (
    <View
      testID={testID}
      accessibilityRole="summary"
      style={[
        styles.base,
        variant === 'preview' ? styles.preview : styles.embedded,
        style,
      ]}
    >
      <Text style={styles.eyebrow}>{copy.eyebrow}</Text>
      <Text style={styles.question} selectable>
        {artifact.question}
      </Text>
      {showAnswerField ? (
        <TextInput
          testID={`${testID}-answer`}
          accessibilityLabel={copy.answerPlaceholder}
          placeholder={copy.answerPlaceholder}
          placeholderTextColor={colors.textMuted}
          value={draft}
          onChangeText={setDraft}
          multiline
          maxLength={2000}
          style={styles.answerInput}
        />
      ) : null}
      <View style={styles.actions}>
        {showAnswerField && trimmedDraft ? (
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={copy.answerSubmitLabel}
            activeOpacity={0.7}
            onPress={() => {
              onAnswer?.(trimmedDraft);
              setDraft('');
            }}
            style={styles.continueButton}
          >
            <Text style={styles.continueText}>{copy.answerSubmitLabel}</Text>
          </TouchableOpacity>
        ) : null}
        {onContinue ? (
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={copy.continueLabel}
            activeOpacity={0.7}
            onPress={() => onContinue(trimmedDraft || undefined)}
            style={styles.continueButton}
          >
            <Text style={styles.continueText}>{copy.continueLabel}</Text>
            <Text accessible={false} style={styles.arrow}>→</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    width: '100%',
  },
  preview: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.contourLineSoft,
    backgroundColor: colors.fieldSurface,
  },
  embedded: {
    marginTop: spacing.sm,
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.contourLineSoft,
  },
  eyebrow: {
    marginBottom: spacing.sm,
    color: colors.textAccent,
    fontFamily: typography.medium,
    fontSize: typography.sizes.xs,
    letterSpacing: 0.35,
    textTransform: 'uppercase',
  },
  question: {
    color: colors.textPrimary,
    fontFamily: typography.roles.reflection,
    fontSize: typography.sizes.md,
    lineHeight: typography.sizes.md * typography.lineHeights.relaxed,
  },
  answerInput: {
    marginTop: spacing.md,
    minHeight: 44,
    maxHeight: 120,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.inputBorder,
    color: colors.textPrimary,
    fontFamily: typography.roles.ui,
    fontSize: typography.sizes.sm,
    lineHeight: typography.sizes.sm * typography.lineHeights.normal,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  continueButton: {
    alignSelf: 'flex-start',
    maxWidth: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
  },
  continueText: {
    flexShrink: 1,
    color: colors.textAccent,
    fontFamily: typography.medium,
    fontSize: typography.sizes.sm,
  },
  arrow: {
    flexShrink: 0,
    color: colors.textAccent,
    fontFamily: typography.medium,
    fontSize: typography.sizes.md,
  },
});
