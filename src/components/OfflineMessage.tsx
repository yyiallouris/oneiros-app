import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { backgrounds, text, semantic, borders, shadows } from '../theme';

interface OfflineMessageProps {
  /**
   * The feature name that requires online connectivity
   * Example: "Jungian AI interpretation", "Sync dreams", "Cloud backup"
   */
  featureName: string;
  
  /**
   * Optional custom message. If not provided, uses default message.
   */
  message?: string;
  
  /**
   * Optional icon/emoji to display
   */
  icon?: string;
}

/**
 * Reusable component to show a friendly offline message
 * Use this when a feature requires online connectivity
 */
export const OfflineMessage: React.FC<OfflineMessageProps> = ({
  featureName,
  message,
  icon = '📡',
}) => {
  const defaultMessage = `${featureName} requires an internet connection. Please check your connection and try again.`;

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>{icon}</Text>
      <View style={styles.textContainer}>
        <Text style={styles.title}>You're Offline</Text>
        <Text style={styles.message}>{message || defaultMessage}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: backgrounds.secondary,
    borderRadius: 12,
    padding: 16,
    marginVertical: 12,
    borderLeftWidth: 4,
    borderLeftColor: semantic.warning,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  icon: {
    fontSize: 32,
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: text.primary,
    marginBottom: 4,
  },
  message: {
    fontSize: 14,
    color: text.secondary,
    lineHeight: 20,
  },
});
