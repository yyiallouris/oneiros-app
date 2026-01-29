import { supabase } from './supabaseClient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logEvent, logError } from './logger';

const CURRENT_USER_ID_KEY = '@current_user_id';

/**
 * User Service - Handles user authentication and isolation
 * 
 * Responsibilities:
 * - Get current user ID (from cached session, works offline)
 * - Detect user changes
 * - Clear data when user logs out or changes
 */
export class UserService {
  /**
   * Get current authenticated user ID
   * Uses getSession() which reads from AsyncStorage (works offline)
   * Does NOT make network calls
   */
  static async getCurrentUserId(): Promise<string | null> {
    try {
      const { data } = await supabase.auth.getSession();
      return data.session?.user?.id ?? null;
    } catch (error) {
      console.warn('[UserService] Failed to get user ID:', error);
      return null;
    }
  }

  /**
   * Get stored user ID from AsyncStorage
   * Returns the last user ID that was stored
   */
  static async getStoredUserId(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(CURRENT_USER_ID_KEY);
    } catch {
      return null;
    }
  }

  /**
   * Store current user ID
   */
  static async storeUserId(userId: string): Promise<void> {
    try {
      await AsyncStorage.setItem(CURRENT_USER_ID_KEY, userId);
    } catch (error) {
      logError('user_store_id_error', error as Error);
    }
  }

  /**
   * Check if the current user is different from the stored user
   * Returns true if user changed, false if same user or no previous user
   */
  static async hasUserChanged(): Promise<boolean> {
    try {
      const currentUserId = await this.getCurrentUserId();
      const storedUserId = await this.getStoredUserId();

      if (!currentUserId) {
        // User logged out - clear stored user ID
        if (storedUserId) {
          await AsyncStorage.removeItem(CURRENT_USER_ID_KEY);
        }
        return false;
      }

      if (storedUserId && storedUserId !== currentUserId) {
        // User changed!
        logEvent('user_changed', { 
          oldUserId: storedUserId, 
          newUserId: currentUserId 
        });
        return true;
      }

      // Same user or first time
      if (!storedUserId) {
        await this.storeUserId(currentUserId);
      }

      return false;
    } catch (error) {
      console.warn('[UserService] Failed to check user change:', error);
      return false;
    }
  }

  /**
   * Clear stored user ID (called on logout)
   */
  static async clearStoredUserId(): Promise<void> {
    try {
      await AsyncStorage.removeItem(CURRENT_USER_ID_KEY);
    } catch (error) {
      logError('user_clear_id_error', error as Error);
    }
  }

  private static displayNameKey(userId: string): string {
    return `@display_name_${userId}`;
  }

  /**
   * Get display name (name or nickname) for the current user.
   * Returns null if not set or user not logged in.
   */
  static async getDisplayName(): Promise<string | null> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) return null;
      return await AsyncStorage.getItem(this.displayNameKey(userId));
    } catch {
      return null;
    }
  }

  /**
   * Set display name (name or nickname) for the current user.
   */
  static async setDisplayName(value: string): Promise<void> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) return;
      const trimmed = value.trim();
      if (trimmed) {
        await AsyncStorage.setItem(this.displayNameKey(userId), trimmed);
      } else {
        await AsyncStorage.removeItem(this.displayNameKey(userId));
      }
    } catch (error) {
      logError('user_set_display_name_error', error as Error);
    }
  }
}
