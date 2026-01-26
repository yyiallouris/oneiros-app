/**
 * Storage utilities - Backward compatibility wrapper
 * 
 * This file maintains backward compatibility with existing code
 * while using the new architecture under the hood.
 * 
 * New code should use StorageService directly from '../services/storageService'
 */

import { StorageService } from '../services/storageService';
import { Dream, Interpretation, DreamDraft } from '../types/dream';

// Re-export for backward compatibility
export const saveDream = StorageService.saveDream.bind(StorageService);
export const getDreams = StorageService.getDreams.bind(StorageService);
export const getDreamById = StorageService.getDreamById.bind(StorageService);
export const getDreamsByDate = StorageService.getDreamsByDate.bind(StorageService);
export const deleteDream = StorageService.deleteDream.bind(StorageService);
export const searchDreams = StorageService.searchDreams.bind(StorageService);

export const saveInterpretation = StorageService.saveInterpretation.bind(StorageService);
export const getInterpretations = StorageService.getInterpretations.bind(StorageService);
export const getInterpretationByDreamId = StorageService.getInterpretationByDreamId.bind(StorageService);
export const deleteInterpretation = StorageService.deleteInterpretation.bind(StorageService);

export const saveDraft = StorageService.saveDraft.bind(StorageService);
export const getDraft = StorageService.getDraft.bind(StorageService);
export const clearDraft = StorageService.clearDraft.bind(StorageService);

export const getDatesWithDreams = StorageService.getDatesWithDreams.bind(StorageService);

// Legacy functions for backward compatibility
export const clearLocalStorage = StorageService.clearAll.bind(StorageService);
export const syncAll = async () => {
  const { SyncService } = await import('../services/syncService');
  await SyncService.syncAll();
};

// Re-export types
export type { Dream, Interpretation, DreamDraft };
