import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';
import { colors, spacing, typography, borderRadius } from '../theme';
import { Card, Button } from '../components/ui';
import { Dream } from '../types/dream';
import { getDreamById, saveDream, deleteDream } from '../utils/storage';
import { formatDate, toISODate, generateId } from '../utils/date';
import { getRandomSymbol } from '../components/symbols';
import { extractDreamSymbolsAndArchetypes } from '../services/ai';

type NavigationProp = StackNavigationProp<RootStackParamList, 'DreamEditor'>;
type EditorRouteProp = RouteProp<RootStackParamList, 'DreamEditor'>;

const DreamEditorScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<EditorRouteProp>();
  const { dreamId, date: presetDate } = route.params || {};

  const [dream, setDream] = useState<Dream | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [date, setDate] = useState(presetDate || toISODate(new Date()));
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const contentInputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (dreamId) {
      loadDream();
    }
  }, [dreamId]);

  const loadDream = async () => {
    if (!dreamId) return;
    
    const dreamData = await getDreamById(dreamId);
    if (dreamData) {
      setDream(dreamData);
      setTitle(dreamData.title || '');
      setContent(dreamData.content);
      setDate(dreamData.date);
    }
  };

  const handleSave = async () => {
    if (!content.trim()) {
      Alert.alert('Missing Content', 'Please write some content for the dream.');
      return;
    }

    setIsSaving(true);
    try {
      const dreamData: Dream = dream
        ? {
            ...dream,
            title: title || undefined,
            content: content.trim(),
            date,
            updatedAt: new Date().toISOString(),
          }
        : {
            id: generateId(),
            date,
            title: title || undefined,
            content: content.trim(),
            symbol: getRandomSymbol(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

      await saveDream(dreamData);
      
      // Extract symbols and archetypes in the background if content changed
      const contentChanged = !dream || dream.content !== dreamData.content;
      if (contentChanged) {
        extractDreamSymbolsAndArchetypes(dreamData)
          .then(({ symbols, archetypes }) => {
            const updatedDream: Dream = {
              ...dreamData,
              symbols,
              archetypes,
            };
            saveDream(updatedDream);
          })
          .catch((error) => {
            console.error('[DreamEditor] Failed to extract symbols/archetypes:', error);
            // Silently fail - don't block user experience
          });
      }
      
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to save dream. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    if (!dream) return;

    Alert.alert(
      'Delete Dream',
      'Are you sure you want to delete this dream? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            try {
              await deleteDream(dream.id);
              navigation.goBack();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete dream. Please try again.');
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: dream ? 'Edit Dream' : 'New Dream',
    });
  }, [navigation, dream]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Card style={styles.mainCard}>
          {/* Date Display */}
          <View style={styles.datePill}>
            <Text style={styles.datePillText}>{formatDate(date)}</Text>
          </View>

          {/* Title Input */}
          <TextInput
            style={styles.titleInput}
            placeholder="Give your dream a name (or leave it unnamed)"
            placeholderTextColor={colors.textMuted}
            value={title}
            onChangeText={setTitle}
            returnKeyType="next"
            onSubmitEditing={() => contentInputRef.current?.focus()}
          />

          {/* Divider */}
          <View style={styles.divider} />

          {/* Content Input */}
          <TextInput
            ref={contentInputRef}
            style={styles.contentInput}
            placeholder="Write it as you remember it, without correcting."
            placeholderTextColor={colors.textMuted}
            value={content}
            onChangeText={setContent}
            multiline
            textAlignVertical="top"
            autoFocus={!dream}
          />
        </Card>

        {/* Spacer */}
        <View style={{ height: 140 }} />
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.bottomActions}>
        <Button
          title={dream ? 'Save Changes' : 'Save Dream'}
          onPress={handleSave}
          disabled={!content.trim()}
          loading={isSaving}
        />

        {dream && (
          <Button
            title="Delete Dream"
            onPress={handleDelete}
            variant="ghost"
            style={styles.deleteButton}
            textStyle={styles.deleteButtonText}
            loading={isDeleting}
          />
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  mainCard: {
    minHeight: 400,
  },
  datePill: {
    alignSelf: 'flex-start',
    backgroundColor: colors.background,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    marginBottom: spacing.md,
  },
  datePillText: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    fontWeight: typography.weights.medium,
  },
  titleInput: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.medium,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    padding: 0,
  },
  divider: {
    height: 1,
    backgroundColor: colors.inputBorder,
    marginBottom: spacing.md,
  },
  contentInput: {
    fontSize: typography.sizes.md,
    color: colors.textPrimary,
    lineHeight: typography.sizes.md * typography.lineHeights.relaxed,
    minHeight: 300,
    padding: 0,
  },
  bottomActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.lg,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingBottom: Platform.OS === 'ios' ? spacing.xl : spacing.lg,
  },
  deleteButton: {
    marginTop: spacing.sm,
  },
  deleteButtonText: {
    color: '#D32F2F', // Red color for delete
  },
});

export default DreamEditorScreen;

