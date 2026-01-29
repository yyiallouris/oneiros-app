import React, { useState, useCallback, useRef } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';
import { colors, spacing, typography, text, borderRadius, borders } from '../theme';
import { WaveBackground, Card } from '../components/ui';
import { UserService } from '../services/userService';

type NavProp = StackNavigationProp<RootStackParamList>;

const AccountScreen: React.FC = () => {
  const navigation = useNavigation<NavProp>();
  const [displayName, setDisplayName] = useState('');
  const [savedHint, setSavedHint] = useState(false);
  const savedHintTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      UserService.getDisplayName().then((name) => {
        if (mounted) setDisplayName(name ?? '');
      });
      return () => {
        mounted = false;
        if (savedHintTimer.current) clearTimeout(savedHintTimer.current);
      };
    }, [])
  );

  const handleSaveName = useCallback(() => {
    if (savedHintTimer.current) clearTimeout(savedHintTimer.current);
    UserService.setDisplayName(displayName);
    setSavedHint(true);
    savedHintTimer.current = setTimeout(() => {
      savedHintTimer.current = null;
      setSavedHint(false);
      navigation.navigate('MainTabs', { screen: 'Write' });
    }, 800);
  }, [displayName, navigation]);

  return (
    <View style={styles.container}>
      <WaveBackground />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Account</Text>

        <Card style={styles.card}>
          <Text style={styles.sectionLabel}>Profile</Text>
          <Text style={styles.fieldLabel}>Name or nickname</Text>
          <TextInput
            style={styles.input}
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="How you’d like to be called"
            placeholderTextColor={text.muted}
            maxLength={60}
            autoCapitalize="words"
            autoCorrect={false}
          />
          <TouchableOpacity style={styles.saveButton} onPress={handleSaveName} activeOpacity={0.7}>
            <Text style={styles.saveButtonText}>{savedHint ? 'Saved' : 'Save'}</Text>
          </TouchableOpacity>
        </Card>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: { flex: 1 },
  content: {
    padding: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  title: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    fontFamily: typography.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xl,
  },
  card: {
    marginBottom: spacing.xl,
  },
  sectionLabel: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  fieldLabel: {
    fontSize: typography.sizes.sm,
    color: text.secondary,
    marginBottom: spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: borders.primary,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.sizes.md,
    color: colors.textPrimary,
    backgroundColor: colors.background,
  },
  saveButton: {
    marginTop: spacing.lg,
    alignSelf: 'flex-start',
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  saveButtonText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.onAccent ?? colors.white,
  },
});

export default AccountScreen;
