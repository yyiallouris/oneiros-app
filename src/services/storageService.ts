import { LocalStorage } from './localStorage';
import { UserService } from './userService';
import { SyncService } from './syncService';
import { Dream, Interpretation, DreamDraft } from '../types/dream';
import { logEvent } from './logger';
import { isOnline } from '../utils/network';

/**
 * Storage Service - Main interface for all storage operations
 * 
 * This is the service that screens should use. It handles:
 * - User isolation (clears data when user changes)
 * - Offline-first operations (always saves locally first)
 * - Background syncing (non-blocking)
 * - Automatic merge of remote data when online
 */
export class StorageService {
  /**
   * Initialize storage service
   * Checks if user changed and clears data if needed
   * Should be called on app startup
   */
  static async initialize(): Promise<void> {
    const userChanged = await UserService.hasUserChanged();
    if (userChanged) {
      // User changed - clear all local data to prevent cross-user contamination
      await LocalStorage.clearAll();
      const currentUserId = await UserService.getCurrentUserId();
      if (currentUserId) {
        await UserService.storeUserId(currentUserId);
      }
      logEvent('storage_initialized_user_changed');
    } else {
      // Same user - ensure user ID is stored
      const currentUserId = await UserService.getCurrentUserId();
      if (currentUserId) {
        await UserService.storeUserId(currentUserId);
      }
    }
  }

  // ==================== DREAMS ====================

  /**
   * Save a dream
   * - Always saves locally first (works offline)
   * - Queues for background sync if user is authenticated
   * - Returns immediately (non-blocking)
   */
  static async saveDream(dream: Dream): Promise<void> {
    // Save locally first (always works, no network needed)
    // This is the critical path - must complete immediately
    await LocalStorage.saveDream(dream);
    logEvent('dream_saved_local', { id: dream.id, date: dream.date });

    // Add to unsynced queue immediately (don't wait for user check)
    await LocalStorage.addUnsyncedDream(dream);

    // Do user check and sync setup in background (non-blocking)
    // This ensures save completes immediately even if user check hangs
    (async () => {
      try {
        // Check if user is authenticated (non-blocking)
        const userId = await UserService.getCurrentUserId();
        if (!userId) {
          // Not logged in - dream is already in unsynced queue, that's fine
          return;
        }

        // User is authenticated - trigger background sync (non-blocking)
        SyncService.syncUnsyncedDreams().catch((error) => {
          console.log('[StorageService] Background sync failed, will retry later:', error);
        });
      } catch (error) {
        // If user check fails, that's okay - dream is already saved locally
        console.warn('[StorageService] Failed to check user, but dream is saved locally:', error);
      }
    })();
  }

  /**
   * Get all dreams
   * - Returns local dreams immediately (works offline)
   * - Fetches and merges remote dreams in background if online
   */
  static async getDreams(): Promise<Dream[]> {
    // Return local dreams immediately (fast, works offline)
    // Don't wait for any user checks or network calls
    const localDreams = await LocalStorage.getDreams();

    // Fetch and merge remote in background (non-blocking)
    // Do user/network checks in background to avoid blocking
    // Use setTimeout to ensure this runs after the function returns
    setTimeout(async () => {
      try {
        const userId = await UserService.getCurrentUserId();
        if (!userId) return;
        
        const online = await isOnline();
        
        if (online) {
          SyncService.fetchAndMergeDreams().catch((error) => {
            console.warn('[StorageService] Background fetch failed:', error);
          });
        }
      } catch (error) {
        // If checks fail, that's okay - we already returned local dreams
        console.warn('[StorageService] Background fetch setup failed:', error);
      }
    }, 0);

    return localDreams;
  }

  /**
   * Get dream by ID
   * - Reads directly from local storage (instant, works offline)
   */
  static async getDreamById(id: string): Promise<Dream | null> {
    return await LocalStorage.getDreamById(id);
  }

  /**
   * Get dreams by date
   */
  static async getDreamsByDate(date: string): Promise<Dream[]> {
    const dreams = await this.getDreams();
    return dreams.filter(d => d.date === date);
  }

  /**
   * Delete a dream
   * - Deletes locally immediately
   * - Tries to delete remotely if online (non-blocking)
   */
  static async deleteDream(id: string): Promise<void> {
    // Delete locally first
    await LocalStorage.deleteDream(id);
    await LocalStorage.removeUnsyncedDream(id);

    // Try to delete remotely (non-blocking)
    const userId = await UserService.getCurrentUserId();
    if (userId) {
      const { remoteDeleteDream } = await import('./remoteStorage');
      remoteDeleteDream(id).catch((error) => {
        console.warn('[StorageService] Remote delete failed:', error);
      });
    }
  }

  /**
   * Search dreams
   */
  static async searchDreams(query: string): Promise<Dream[]> {
    const dreams = await this.getDreams();
    const lowerQuery = query.toLowerCase();
    return dreams.filter(d => 
      d.content.toLowerCase().includes(lowerQuery) ||
      (d.title?.toLowerCase().includes(lowerQuery))
    );
  }

  // ==================== INTERPRETATIONS ====================

  /**
   * Save an interpretation
   * - Always saves locally first
   * - Queues for background sync
   */
  static async saveInterpretation(interpretation: Interpretation): Promise<void> {
    await LocalStorage.saveInterpretation(interpretation);
    logEvent('interpretation_saved_local', { id: interpretation.id });

    const userId = await UserService.getCurrentUserId();
    if (!userId) {
      await LocalStorage.addUnsyncedInterpretation(interpretation);
      return;
    }

    await LocalStorage.addUnsyncedInterpretation(interpretation);
    SyncService.syncUnsyncedInterpretations().catch(() => {
      // Ignore sync errors
    });
  }

  /**
   * Get all interpretations
   * - Returns local immediately
   * - Fetches and merges remote in background
   */
  static async getInterpretations(): Promise<Interpretation[]> {
    const local = await LocalStorage.getInterpretations();
    
    // Fetch and merge in background
    SyncService.fetchAndMergeInterpretations().catch(() => {
      // Ignore errors
    });

    return local;
  }

  /**
   * Get interpretation by dream ID
   */
  static async getInterpretationByDreamId(dreamId: string): Promise<Interpretation | null> {
    return await LocalStorage.getInterpretationByDreamId(dreamId);
  }

  /**
   * Delete an interpretation
   */
  static async deleteInterpretation(id: string): Promise<void> {
    await LocalStorage.deleteInterpretation(id);
    await LocalStorage.removeUnsyncedInterpretation(id);

    const userId = await UserService.getCurrentUserId();
    if (userId) {
      const { remoteDeleteInterpretation } = await import('./remoteStorage');
      remoteDeleteInterpretation(id).catch(() => {
        // Ignore errors
      });
    }
  }

  // ==================== DRAFTS ====================

  static async saveDraft(draft: DreamDraft): Promise<void> {
    await LocalStorage.saveDraft(draft);
  }

  static async getDraft(): Promise<DreamDraft | null> {
    return await LocalStorage.getDraft();
  }

  static async clearDraft(): Promise<void> {
    await LocalStorage.clearDraft();
  }

  // ==================== UTILITY ====================

  /**
   * Get dates that have dreams (for calendar)
   */
  static async getDatesWithDreams(): Promise<string[]> {
    const dreams = await this.getDreams();
    return [...new Set(dreams.map(d => d.date))];
  }

  /**
   * Clear all local storage
   * Called when user logs out
   */
  static async clearAll(): Promise<void> {
    await LocalStorage.clearAll();
    await UserService.clearStoredUserId();
    logEvent('storage_cleared');
  }

  /**
   * Manually trigger sync (useful for pull-to-refresh)
   */
  static async syncNow(): Promise<void> {
    await SyncService.syncAll();
    // Also fetch and merge
    await SyncService.fetchAndMergeDreams();
    await SyncService.fetchAndMergeInterpretations();
  }
}
