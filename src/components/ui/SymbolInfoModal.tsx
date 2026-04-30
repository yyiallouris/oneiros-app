import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { colors, spacing, typography, borderRadius, text, backgrounds } from '../../theme';
import { MODAL_FOOTER, SYMBOL_ARCHETYPE_INFO, type InfoModalKey } from '../../constants/symbolArchetypeInfo';

interface SymbolInfoModalProps {
  visible: boolean;
  onClose: () => void;
  contentKey: InfoModalKey;
}

export const SymbolInfoModal: React.FC<SymbolInfoModalProps> = ({
  visible,
  onClose,
  contentKey,
}) => {
  const content = SYMBOL_ARCHETYPE_INFO[contentKey];
  if (!content) return null;

  const {
    title,
    subtitle,
    paragraphs,
    bullets,
    bulletsAfterParagraph = -1,
    sections,
  } = content;

  const hasSections = sections && sections.length > 0;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <TouchableOpacity
          style={styles.backdropTouchable}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={styles.modalCard}>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={true}
            bounces={true}
            nestedScrollEnabled={true}
          >
            <Text style={styles.title}>{title}</Text>
            {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}

            {hasSections ? (
              sections!.map((s, i) => (
                <View key={i} style={styles.sectionBlock}>
                  <Text style={styles.sectionHeading}>{s.heading}</Text>
                  <Text style={styles.sectionContent}>{s.content}</Text>
                </View>
              ))
            ) : (
              paragraphs?.map((para, i) => (
                <React.Fragment key={i}>
                  <Text style={styles.paragraph}>{para}</Text>
                  {bullets && bulletsAfterParagraph === i && (
                    <View style={styles.bulletList}>
                      {bullets.map((b, j) => (
                        <View key={j} style={styles.bulletRow}>
                          <Text style={styles.bullet}>•</Text>
                          <Text style={styles.bulletText}>{b}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </React.Fragment>
              ))
            )}

            <View style={styles.footerWrap}>
              <Text style={styles.footer}>{MODAL_FOOTER}</Text>
            </View>
          </ScrollView>

          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            activeOpacity={0.8}
          >
            <Text style={styles.closeButtonText}>Got it</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: backgrounds.backdrop,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  backdropTouchable: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    height: Dimensions.get('window').height * 0.72,
    backgroundColor: backgrounds.card,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 2,
  },
  scroll: {
    flex: 1,
    minHeight: 0,
  },
  scrollContent: {
    paddingBottom: spacing.xl,
  },
  title: {
    fontFamily: typography.bold,
    fontSize: typography.sizes.xxl,
    color: text.primary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontFamily: typography.regular,
    fontSize: typography.sizes.sm,
    fontStyle: 'italic',
    color: text.muted,
    marginBottom: spacing.lg,
  },
  paragraph: {
    fontFamily: typography.regular,
    fontSize: typography.sizes.md,
    lineHeight: typography.sizes.md * typography.lineHeights.relaxed,
    color: text.secondary,
    marginBottom: spacing.md,
  },
  bulletList: {
    marginBottom: spacing.md,
    marginLeft: spacing.sm,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  bullet: {
    fontFamily: typography.regular,
    fontSize: typography.sizes.md,
    color: colors.buttonPrimary,
    marginRight: spacing.sm,
  },
  bulletText: {
    flex: 1,
    fontFamily: typography.regular,
    fontSize: typography.sizes.md,
    lineHeight: typography.sizes.md * typography.lineHeights.relaxed,
    color: text.secondary,
  },
  sectionBlock: {
    marginBottom: spacing.lg,
  },
  sectionHeading: {
    fontFamily: typography.semibold,
    fontSize: typography.sizes.lg,
    color: text.primary,
    marginBottom: spacing.sm,
  },
  sectionContent: {
    fontFamily: typography.regular,
    fontSize: typography.sizes.md,
    lineHeight: typography.sizes.md * typography.lineHeights.relaxed,
    color: text.secondary,
  },
  footerWrap: {
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  footer: {
    fontFamily: typography.regular,
    fontSize: typography.sizes.sm,
    fontStyle: 'italic',
    color: text.muted,
    lineHeight: typography.sizes.sm * typography.lineHeights.relaxed,
  },
  closeButton: {
    marginTop: spacing.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  closeButtonText: {
    fontFamily: typography.medium,
    fontSize: typography.sizes.md,
    color: text.primary,
  },
});
