import AsyncStorage from '@react-native-async-storage/async-storage';
import { Dream, Interpretation, DreamDraft } from '../types/dream';
import {
  remoteGetDreams,
  remoteSaveDream,
  remoteDeleteDream,
  remoteGetInterpretations,
  remoteSaveInterpretation,
  remoteDeleteInterpretation,
} from '../services/remoteStorage';
import { logEvent, logError } from '../services/logger';

const DREAMS_KEY = '@dreams';
const INTERPRETATIONS_KEY = '@interpretations';
const DRAFT_KEY = '@dream_draft';

// Dreams
export const saveDream = async (dream: Dream): Promise<void> => {
  // Try to persist remotely (best effort, ignore failure for offline use)
  await remoteSaveDream(dream)
    .then(() => logEvent('dream_save_remote', { id: dream.id, date: dream.date }))
    .catch((error) => logError('dream_save_remote_error', error, { id: dream.id }));

  const dreams = await getDreams();
  const index = dreams.findIndex(d => d.id === dream.id);
  
  if (index >= 0) {
    dreams[index] = dream;
  } else {
    dreams.push(dream);
  }
  
  // Sort by date descending
  dreams.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  await AsyncStorage.setItem(DREAMS_KEY, JSON.stringify(dreams));
};

export const getDreams = async (): Promise<Dream[]> => {
  // Load local cache first
  const localRaw = await AsyncStorage.getItem(DREAMS_KEY);
  const local: Dream[] = localRaw ? JSON.parse(localRaw) : [];

  // Try remote dreams when online & authenticated
  const remote = await remoteGetDreams().catch(() => null);

  if (remote) {
    // Merge remote + local, preferring remote by id
    const mergedById = new Map<string, Dream>();
    local.forEach((d) => mergedById.set(d.id, d));
    remote.forEach((d) => mergedById.set(d.id, d));

    const merged = Array.from(mergedById.values());

    await AsyncStorage.setItem(DREAMS_KEY, JSON.stringify(merged));
    logEvent('dreams_cache_updated', {
      remoteCount: remote.length,
      localCount: local.length,
      mergedCount: merged.length,
    });
    return merged;
  }

  logEvent('dreams_loaded_local', { count: local.length });
  return local;
};

export const getDreamById = async (id: string): Promise<Dream | null> => {
  const dreams = await getDreams();
  return dreams.find(d => d.id === id) || null;
};

export const getDreamsByDate = async (date: string): Promise<Dream[]> => {
  const dreams = await getDreams();
  return dreams.filter(d => d.date === date);
};

export const deleteDream = async (id: string): Promise<void> => {
  await remoteDeleteDream(id)
    .then(() => logEvent('dream_delete_remote', { id }))
    .catch((error) => logError('dream_delete_remote_error', error, { id }));

  const dreams = await getDreams();
  const filtered = dreams.filter(d => d.id !== id);
  await AsyncStorage.setItem(DREAMS_KEY, JSON.stringify(filtered));
};

export const searchDreams = async (query: string): Promise<Dream[]> => {
  const dreams = await getDreams();
  const lowerQuery = query.toLowerCase();
  
  return dreams.filter(d => 
    d.content.toLowerCase().includes(lowerQuery) ||
    (d.title?.toLowerCase().includes(lowerQuery))
  );
};

// Interpretations
export const saveInterpretation = async (interpretation: Interpretation): Promise<void> => {
  await remoteSaveInterpretation(interpretation)
    .then(() => logEvent('interpretation_save_remote', { id: interpretation.id, dreamId: interpretation.dreamId }))
    .catch((error) =>
      logError('interpretation_save_remote_error', error, {
        id: interpretation.id,
        dreamId: interpretation.dreamId,
      })
    );

  const interpretations = await getInterpretations();
  const index = interpretations.findIndex(i => i.id === interpretation.id);
  
  if (index >= 0) {
    interpretations[index] = interpretation;
  } else {
    interpretations.push(interpretation);
  }
  
  await AsyncStorage.setItem(INTERPRETATIONS_KEY, JSON.stringify(interpretations));
};

export const getInterpretations = async (): Promise<Interpretation[]> => {
  const remote = await remoteGetInterpretations().catch(() => null);
  if (remote) {
    await AsyncStorage.setItem(INTERPRETATIONS_KEY, JSON.stringify(remote));
    logEvent('interpretations_cache_updated', { count: remote.length });
    return remote;
  }

  const data = await AsyncStorage.getItem(INTERPRETATIONS_KEY);
  return data ? JSON.parse(data) : [];
};

export const getInterpretationByDreamId = async (dreamId: string): Promise<Interpretation | null> => {
  const interpretations = await getInterpretations();
  return interpretations.find(i => i.dreamId === dreamId) || null;
};

export const deleteInterpretation = async (id: string): Promise<void> => {
  await remoteDeleteInterpretation(id)
    .then(() => logEvent('interpretation_delete_remote', { id }))
    .catch((error) =>
      logError('interpretation_delete_remote_error', error, {
        id,
      })
    );

  const interpretations = await getInterpretations();
  const filtered = interpretations.filter(i => i.id !== id);
  await AsyncStorage.setItem(INTERPRETATIONS_KEY, JSON.stringify(filtered));
};

// Draft
export const saveDraft = async (draft: DreamDraft): Promise<void> => {
  await AsyncStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
};

export const getDraft = async (): Promise<DreamDraft | null> => {
  const data = await AsyncStorage.getItem(DRAFT_KEY);
  return data ? JSON.parse(data) : null;
};

export const clearDraft = async (): Promise<void> => {
  await AsyncStorage.removeItem(DRAFT_KEY);
};

// Get dates with dreams (for calendar)
export const getDatesWithDreams = async (): Promise<string[]> => {
  const dreams = await getDreams();
  return [...new Set(dreams.map(d => d.date))];
};

