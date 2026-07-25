import AsyncStorage from '@react-native-async-storage/async-storage';
import { Dream, Interpretation, DreamDraft, PendingVoiceTranscription } from '../types/dream';
import type { RecentSequenceReflection } from '../types/insights';
import { normalizeArchetypalEchoes } from '../ai/archetypalEchoes';
import { normalizeAmplifications } from '../ai/mythicEchoes';
import { logEvent } from './logger';

/**
 * Local Storage Service - Pure local storage operations
 * 
 * Responsibilities:
 * - Read/write to AsyncStorage only
 * - No user checks, no network calls, no business logic
 * - Works completely offline
 */
export class LocalStorage {
  private static readonly DREAMS_KEY = '@dreams';
  private static readonly INTERPRETATIONS_KEY = '@interpretations';
  private static readonly DRAFT_KEY = '@dream_draft';
  private static readonly UNSYNCED_DREAMS_KEY = '@unsynced_dreams';
  private static readonly UNSYNCED_INTERPRETATIONS_KEY = '@unsynced_interpretations';
  private static readonly PATTERN_REPORTS_KEY = '@pattern_reports';
  private static readonly RECENT_SEQUENCE_REFLECTIONS_KEY = '@recent_sequence_reflections';
  private static readonly INTERPRETATION_DEPTH_KEY = '@interpretation_depth';
  private static readonly LEGACY_MYTHIC_RESONANCE_KEY = '@mythic_resonance_enabled';
  private static readonly PENDING_VOICE_TRANSCRIPTIONS_KEY = '@pending_voice_transcriptions_v1';
  private static readonly PENDING_REFLECTION_JOBS_KEY = '@pending_reflection_jobs_v1';

  // Dreams
  static async getDreams(): Promise<Dream[]> {
    try {
      const data = await AsyncStorage.getItem(this.DREAMS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.warn('[LocalStorage] Failed to get dreams:', error);
      return [];
    }
  }

  static async getDreamById(id: string): Promise<Dream | null> {
    const dreams = await this.getDreams();
    return dreams.find(d => d.id === id) || null;
  }

  static async saveDream(dream: Dream): Promise<void> {
    const dreams = await this.getDreams();
    const index = dreams.findIndex(d => d.id === dream.id);
    
    if (index >= 0) {
      dreams[index] = dream;
    } else {
      dreams.push(dream);
    }
    
    // Sort by date descending
    dreams.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    await AsyncStorage.setItem(this.DREAMS_KEY, JSON.stringify(dreams));
  }

  static async saveDreams(dreams: Dream[]): Promise<void> {
    // Sort by date descending
    const sorted = [...dreams].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    await AsyncStorage.setItem(this.DREAMS_KEY, JSON.stringify(sorted));
  }

  static async deleteDream(id: string): Promise<void> {
    const dreams = await this.getDreams();
    const filtered = dreams.filter(d => d.id !== id);
    await AsyncStorage.setItem(this.DREAMS_KEY, JSON.stringify(filtered));
  }

  static async clearDreams(): Promise<void> {
    await AsyncStorage.removeItem(this.DREAMS_KEY);
  }

  private static normalizeInterpretation(raw: Interpretation): Interpretation {
    const archetypes = normalizeArchetypalEchoes(raw.archetypes ?? []);
    const amplifications = normalizeAmplifications(raw.amplifications ?? []);
    return {
      ...raw,
      archetypes,
      amplifications: amplifications.length > 0 ? amplifications : undefined,
    };
  }

  // Interpretations
  static async getInterpretations(): Promise<Interpretation[]> {
    try {
      const data = await AsyncStorage.getItem(this.INTERPRETATIONS_KEY);
      if (!data) return [];
      const parsed = JSON.parse(data) as Interpretation[];
      return Array.isArray(parsed) ? parsed.map((item) => this.normalizeInterpretation(item)) : [];
    } catch (error) {
      console.warn('[LocalStorage] Failed to get interpretations:', error);
      return [];
    }
  }

  static async getInterpretationByDreamId(dreamId: string): Promise<Interpretation | null> {
    const interpretations = await this.getInterpretations();
    return interpretations.find(i => i.dreamId === dreamId) || null;
  }

  static async saveInterpretation(interpretation: Interpretation): Promise<void> {
    const interpretations = await this.getInterpretations();
    const index = interpretations.findIndex(i => i.id === interpretation.id);
    
    if (index >= 0) {
      interpretations[index] = interpretation;
    } else {
      interpretations.push(interpretation);
    }
    
    await AsyncStorage.setItem(this.INTERPRETATIONS_KEY, JSON.stringify(interpretations));
  }

  static async saveInterpretations(interpretations: Interpretation[]): Promise<void> {
    await AsyncStorage.setItem(this.INTERPRETATIONS_KEY, JSON.stringify(interpretations));
  }

  static async deleteInterpretation(id: string): Promise<void> {
    const interpretations = await this.getInterpretations();
    const filtered = interpretations.filter(i => i.id !== id);
    await AsyncStorage.setItem(this.INTERPRETATIONS_KEY, JSON.stringify(filtered));
  }

  static async clearInterpretations(): Promise<void> {
    await AsyncStorage.removeItem(this.INTERPRETATIONS_KEY);
  }

  // Drafts
  static async getDraft(): Promise<DreamDraft | null> {
    try {
      const data = await AsyncStorage.getItem(this.DRAFT_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  static async saveDraft(draft: DreamDraft): Promise<void> {
    await AsyncStorage.setItem(this.DRAFT_KEY, JSON.stringify(draft));
  }

  static async clearDraft(): Promise<void> {
    await AsyncStorage.removeItem(this.DRAFT_KEY);
  }

  // Unsynced queue
  static async getUnsyncedDreams(): Promise<Dream[]> {
    try {
      const data = await AsyncStorage.getItem(this.UNSYNCED_DREAMS_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  static async addUnsyncedDream(dream: Dream): Promise<void> {
    const unsynced = await this.getUnsyncedDreams();
    const exists = unsynced.find(d => d.id === dream.id);
    if (!exists) {
      unsynced.push(dream);
      await AsyncStorage.setItem(this.UNSYNCED_DREAMS_KEY, JSON.stringify(unsynced));
    }
  }

  static async removeUnsyncedDream(dreamId: string): Promise<void> {
    const unsynced = await this.getUnsyncedDreams();
    const filtered = unsynced.filter(d => d.id !== dreamId);
    if (filtered.length === 0) {
      await AsyncStorage.removeItem(this.UNSYNCED_DREAMS_KEY);
    } else {
      await AsyncStorage.setItem(this.UNSYNCED_DREAMS_KEY, JSON.stringify(filtered));
    }
  }

  static async clearUnsyncedDreams(): Promise<void> {
    await AsyncStorage.removeItem(this.UNSYNCED_DREAMS_KEY);
  }

  static async getUnsyncedInterpretations(): Promise<Interpretation[]> {
    try {
      const data = await AsyncStorage.getItem(this.UNSYNCED_INTERPRETATIONS_KEY);
      if (!data) return [];
      const parsed = JSON.parse(data) as Interpretation[];
      return Array.isArray(parsed) ? parsed.map((item) => this.normalizeInterpretation(item)) : [];
    } catch {
      return [];
    }
  }

  static async addUnsyncedInterpretation(interpretation: Interpretation): Promise<void> {
    const unsynced = await this.getUnsyncedInterpretations();
    const exists = unsynced.find(i => i.id === interpretation.id);
    if (!exists) {
      unsynced.push(interpretation);
      await AsyncStorage.setItem(this.UNSYNCED_INTERPRETATIONS_KEY, JSON.stringify(unsynced));
    }
  }

  static async removeUnsyncedInterpretation(interpretationId: string): Promise<void> {
    const unsynced = await this.getUnsyncedInterpretations();
    const filtered = unsynced.filter(i => i.id !== interpretationId);
    if (filtered.length === 0) {
      await AsyncStorage.removeItem(this.UNSYNCED_INTERPRETATIONS_KEY);
    } else {
      await AsyncStorage.setItem(this.UNSYNCED_INTERPRETATIONS_KEY, JSON.stringify(filtered));
    }
  }

  static async clearUnsyncedInterpretations(): Promise<void> {
    await AsyncStorage.removeItem(this.UNSYNCED_INTERPRETATIONS_KEY);
  }

  static async getPendingVoiceTranscriptions(): Promise<PendingVoiceTranscription[]> {
    try {
      const data = await AsyncStorage.getItem(this.PENDING_VOICE_TRANSCRIPTIONS_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  static async savePendingVoiceTranscriptions(items: PendingVoiceTranscription[]): Promise<void> {
    if (items.length === 0) {
      await AsyncStorage.removeItem(this.PENDING_VOICE_TRANSCRIPTIONS_KEY);
      return;
    }
    await AsyncStorage.setItem(this.PENDING_VOICE_TRANSCRIPTIONS_KEY, JSON.stringify(items));
  }

  static async getPendingReflectionJobs(): Promise<unknown[]> {
    try {
      const data = await AsyncStorage.getItem(this.PENDING_REFLECTION_JOBS_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  static async savePendingReflectionJobs(items: unknown[]): Promise<void> {
    if (items.length === 0) {
      await AsyncStorage.removeItem(this.PENDING_REFLECTION_JOBS_KEY);
      return;
    }
    await AsyncStorage.setItem(this.PENDING_REFLECTION_JOBS_KEY, JSON.stringify(items));
  }

  // Pattern insight reports (monthKey YYYY-MM -> { generatedAt, text })
  static async getPatternReports(): Promise<Record<string, { generatedAt: string; text: string }>> {
    try {
      const data = await AsyncStorage.getItem(this.PATTERN_REPORTS_KEY);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.warn('[LocalStorage] Failed to get pattern reports:', error);
      return {};
    }
  }

  static async savePatternReport(
    monthKey: string,
    text: string
  ): Promise<void> {
    const reports = await this.getPatternReports();
    reports[monthKey] = { generatedAt: new Date().toISOString(), text };
    await AsyncStorage.setItem(this.PATTERN_REPORTS_KEY, JSON.stringify(reports));
  }

  static async deletePatternReport(monthKey: string): Promise<void> {
    const reports = await this.getPatternReports();
    delete reports[monthKey];
    await AsyncStorage.setItem(this.PATTERN_REPORTS_KEY, JSON.stringify(reports));
  }

  // Recent Dream Field cache (scopeKey -> latest generated reflection for exact dream-id sequence)
  static async getRecentSequenceReflections(): Promise<Record<string, RecentSequenceReflection>> {
    try {
      const data = await AsyncStorage.getItem(this.RECENT_SEQUENCE_REFLECTIONS_KEY);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.warn('[LocalStorage] Failed to get recent sequence reflections:', error);
      return {};
    }
  }

  static async getRecentSequenceReflection(
    scopeKey: string,
    language: string
  ): Promise<RecentSequenceReflection | null> {
    const cache = await this.getRecentSequenceReflections();
    const report = cache[`${scopeKey}:${language}`] ?? cache[scopeKey];
    return report?.language === language ? report : null;
  }

  static async saveRecentSequenceReflection(report: RecentSequenceReflection): Promise<void> {
    const cache = await this.getRecentSequenceReflections();
    cache[`${report.scope_key}:${report.language}`] = report;
    await AsyncStorage.setItem(this.RECENT_SEQUENCE_REFLECTIONS_KEY, JSON.stringify(cache));
  }

  // Interpretation depth (quick | standard | advanced) — local cache
  static async getInterpretationDepth(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(this.INTERPRETATION_DEPTH_KEY);
    } catch {
      return null;
    }
  }

  static async setInterpretationDepth(depth: string): Promise<void> {
    await AsyncStorage.setItem(this.INTERPRETATION_DEPTH_KEY, depth);
  }

  /**
   * Clear ALL local storage (called when user logs out or changes)
   */
  static async clearAll(): Promise<void> {
    await AsyncStorage.multiRemove([
      this.DREAMS_KEY,
      this.INTERPRETATIONS_KEY,
      this.DRAFT_KEY,
      this.UNSYNCED_DREAMS_KEY,
      this.UNSYNCED_INTERPRETATIONS_KEY,
      this.PATTERN_REPORTS_KEY,
      this.RECENT_SEQUENCE_REFLECTIONS_KEY,
      this.INTERPRETATION_DEPTH_KEY,
      this.LEGACY_MYTHIC_RESONANCE_KEY,
      this.PENDING_VOICE_TRANSCRIPTIONS_KEY,
    ]);
    logEvent('local_storage_cleared');
  }
}
