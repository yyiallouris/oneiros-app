import { LocalStorage } from './localStorage';
import { UserService } from './userService';
import { isOnline } from '../utils/network';
import { remoteSaveDream, remoteGetDreams, remoteSaveInterpretation, remoteGetInterpretations } from './remoteStorage';
import { Dream, Interpretation } from '../types/dream';
import { logEvent, logError } from './logger';

/**
 * Sync Service - Handles synchronization between local and remote storage
 * 
 * Responsibilities:
 * - Sync unsynced dreams/interpretations to remote when online
 * - Fetch remote data and merge with local when online
 * - All operations are non-blocking and happen in background
 */
export class SyncService {
  /**
   * Sync all unsynced dreams to remote database
   * Only syncs if user is authenticated and online
   */
  static async syncUnsyncedDreams(): Promise<void> {
    const userId = await UserService.getCurrentUserId();
    if (!userId) {
      logEvent('sync_skipped_no_user');
      return;
    }

    const online = await isOnline();
    if (!online) {
      logEvent('sync_skipped_offline');
      return;
    }

    const unsynced = await LocalStorage.getUnsyncedDreams();
    if (unsynced.length === 0) {
      return;
    }

    logEvent('sync_started', { count: unsynced.length, type: 'dreams' });

    const synced: string[] = [];
    const failed: string[] = [];

    for (const dream of unsynced) {
      try {
        await remoteSaveDream(dream);
        synced.push(dream.id);
        await LocalStorage.removeUnsyncedDream(dream.id);
        logEvent('dream_synced', { dreamId: dream.id });
        if (__DEV__) {
          console.log(`[SyncService] Successfully synced dream: ${dream.id}`);
        }
      } catch (error) {
        failed.push(dream.id);
        logError('dream_sync_failed', error as Error, { dreamId: dream.id });
        if (__DEV__) {
          console.error(`[SyncService] Failed to sync dream ${dream.id}:`, error);
        }
      }
    }

    logEvent('sync_completed', {
      type: 'dreams',
      total: unsynced.length,
      synced: synced.length,
      failed: failed.length,
    });
  }

  /**
   * Sync all unsynced interpretations to remote database
   */
  static async syncUnsyncedInterpretations(): Promise<void> {
    const userId = await UserService.getCurrentUserId();
    if (!userId) {
      return;
    }

    const online = await isOnline();
    if (!online) {
      return;
    }

    const unsynced = await LocalStorage.getUnsyncedInterpretations();
    if (unsynced.length === 0) {
      return;
    }

    const synced: string[] = [];
    const failed: string[] = [];

    for (const interpretation of unsynced) {
      try {
        await remoteSaveInterpretation(interpretation);
        synced.push(interpretation.id);
        await LocalStorage.removeUnsyncedInterpretation(interpretation.id);
        logEvent('interpretation_synced', { interpretationId: interpretation.id });
      } catch (error) {
        failed.push(interpretation.id);
        logError('interpretation_sync_failed', error as Error, { interpretationId: interpretation.id });
      }
    }

    if (synced.length > 0 || failed.length > 0) {
      logEvent('sync_completed', {
        type: 'interpretations',
        total: unsynced.length,
        synced: synced.length,
        failed: failed.length,
      });
    }
  }

  /**
   * Sync everything (dreams + interpretations)
   */
  static async syncAll(): Promise<void> {
    await this.syncUnsyncedDreams();
    await this.syncUnsyncedInterpretations();
  }

  /**
   * Fetch remote dreams and merge with local
   * Returns merged dreams array
   */
  static async fetchAndMergeDreams(): Promise<Dream[]> {
    const userId = await UserService.getCurrentUserId();
    if (!userId) {
      // Not logged in - return local only
      return await LocalStorage.getDreams();
    }

    const online = await isOnline();
    if (!online) {
      // Offline - return local only
      return await LocalStorage.getDreams();
    }

    try {
      const remote = await remoteGetDreams();
      if (remote) {
        const local = await LocalStorage.getDreams();
        
        // Merge remote + local, preferring remote by id
        const mergedById = new Map<string, Dream>();
        local.forEach((d) => mergedById.set(d.id, d));
        remote.forEach((d) => mergedById.set(d.id, d));

        const merged = Array.from(mergedById.values());
        merged.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        // Calculate how many new dreams were merged from remote
        const newDreamsFromRemote = remote.filter(rd => !local.find(ld => ld.id === rd.id));
        const newDreamsCount = newDreamsFromRemote.length;

        // Save merged result as local cache (batch save)
        await LocalStorage.saveDreams(merged);
        
        // Log merge result with visible formatting
        if (newDreamsCount > 0) {
          console.log(`📥 ${newDreamsCount} new dream(s) merged from remote database`);
        } else {
          console.log('ℹ️  No new dreams from remote (all dreams already synced)');
        }
        
        logEvent('dreams_merged', {
          remoteCount: remote.length,
          localCount: local.length,
          mergedCount: merged.length,
          newDreamsFromRemote: newDreamsCount,
        });
        
        // After successful fetch, try to sync any unsynced dreams (in case there are any)
        // This handles edge cases where dreams were saved offline after the last sync
        this.syncUnsyncedDreams().catch(() => {
          // Ignore sync errors - will retry later
        });
        
        return merged;
      }
    } catch (error) {
      logError('dreams_fetch_remote_error', error as Error);
    }

    // Fallback to local if remote fetch fails
    return await LocalStorage.getDreams();
  }

  /**
   * Fetch remote interpretations and merge with local
   */
  static async fetchAndMergeInterpretations(): Promise<Interpretation[]> {
    const userId = await UserService.getCurrentUserId();
    if (!userId) {
      return await LocalStorage.getInterpretations();
    }

    const online = await isOnline();
    if (!online) {
      return await LocalStorage.getInterpretations();
    }

    try {
      const remote = await remoteGetInterpretations();
      if (remote) {
        const local = await LocalStorage.getInterpretations();
        
        // Merge remote + local, preferring remote by id
        const mergedById = new Map<string, Interpretation>();
        local.forEach((i) => mergedById.set(i.id, i));
        remote.forEach((i) => mergedById.set(i.id, i));

        const merged = Array.from(mergedById.values());
        
        // Save merged result (batch save)
        await LocalStorage.saveInterpretations(merged);
        
        logEvent('interpretations_merged', { count: merged.length });
        
        // Sync unsynced interpretations
        this.syncUnsyncedInterpretations().catch(() => {
          // Ignore sync errors
        });
        
        return merged;
      }
    } catch (error) {
      logError('interpretations_fetch_remote_error', error as Error);
    }

    return await LocalStorage.getInterpretations();
  }
}
