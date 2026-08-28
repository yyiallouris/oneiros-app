import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Dream,
  Interpretation,
  DreamDraft,
  PendingVoiceTranscription,
  PendingVoiceClipInboxItem,
  CompletedVoiceTranscript,
  VoiceComposerState,
  VoiceTranscriptionTarget,
  type ChatMessage,
} from '../types/dream';
import type { RecentSequenceReflection } from '../types/insights';
import { normalizeArchetypalEchoes } from '../ai/archetypalEchoes';
import { normalizeAmplifications } from '../ai/mythicEchoes';
import { normalizeReflectiveQuestionArtifact } from '../ai/reflectiveQuestionPrompt';
import { logError, logEvent } from './logger';

const VOICE_STATUSES = new Set([
  'queued',
  'transcribing',
  'retrying',
  'completed',
  'needs_attention',
  'deletion_pending',
]);
const VOICE_SURFACES = new Set(['write', 'dream-chat', 'interpretation-chat']);
const VOICE_SNAPSHOT_SCHEMA_VERSION = 2;

type VoiceSnapshot<T> = {
  schemaVersion: typeof VOICE_SNAPSHOT_SCHEMA_VERSION;
  revision: number;
  items: T[];
  checksum: string;
};

type ParsedVoiceSnapshot<T> = {
  revision: number;
  items: T[];
  complete: boolean;
  legacy: boolean;
};

function isVoiceTarget(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false;
  const target = value as { surface?: unknown; key?: unknown };
  return typeof target.surface === 'string'
    && VOICE_SURFACES.has(target.surface)
    && typeof target.key === 'string'
    && target.key.length > 0;
}

/** Small deterministic checksum; this detects torn/stale AsyncStorage snapshots, not tampering. */
function voiceSnapshotChecksum(revision: number, items: unknown[]): string {
  const input = `${VOICE_SNAPSHOT_SCHEMA_VERSION}:${revision}:${JSON.stringify(items)}`;
  let hash = 0x811c9dc5;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

function parseVoiceSnapshot<T>(
  data: string | null,
  isItem: (value: unknown) => value is T,
): ParsedVoiceSnapshot<T> | null {
  if (!data) return null;
  try {
    const parsed = JSON.parse(data);
    if (Array.isArray(parsed)) {
      const items = parsed.filter(isItem);
      return { revision: 0, items, complete: items.length === parsed.length, legacy: true };
    }
    if (!parsed || typeof parsed !== 'object') return null;
    const snapshot = parsed as Partial<VoiceSnapshot<unknown>>;
    if (snapshot.schemaVersion !== VOICE_SNAPSHOT_SCHEMA_VERSION
      || !Number.isSafeInteger(snapshot.revision)
      || (snapshot.revision ?? -1) < 0
      || !Array.isArray(snapshot.items)
      || typeof snapshot.checksum !== 'string'
      || snapshot.checksum !== voiceSnapshotChecksum(snapshot.revision!, snapshot.items)) {
      return null;
    }
    const items = snapshot.items.filter(isItem);
    return {
      revision: snapshot.revision!,
      items,
      complete: items.length === snapshot.items.length,
      legacy: false,
    };
  } catch {
    return null;
  }
}

function newestRecoverableSnapshot<T>(snapshots: Array<ParsedVoiceSnapshot<T> | null>): ParsedVoiceSnapshot<T> | null {
  const complete = snapshots
    .filter((snapshot): snapshot is ParsedVoiceSnapshot<T> => !!snapshot?.complete)
    .sort((a, b) => b.revision - a.revision || b.items.length - a.items.length);
  if (complete[0]) return complete[0];

  // If both copies are damaged, retain the largest valid subset instead of silently losing every clip.
  return snapshots
    .filter((snapshot): snapshot is ParsedVoiceSnapshot<T> => !!snapshot && snapshot.items.length > 0)
    .sort((a, b) => b.items.length - a.items.length || b.revision - a.revision)[0] ?? null;
}

export class VoiceSnapshotIntegrityError extends Error {
  readonly code = 'VOICE_SNAPSHOT_INTEGRITY_ERROR';

  constructor(readonly store: 'queue' | 'inbox' | 'composer') {
    super(`Voice ${store} snapshots failed strict integrity validation`);
    this.name = 'VoiceSnapshotIntegrityError';
  }
}

export type StrictVoiceCleanupState<T> = {
  canonical: T[];
  attributionEvidence: T[];
};

function sameVoiceAttribution(
  a: { userId: string; audioUri: string; sizeBytes: number; target: VoiceTranscriptionTarget },
  b: { userId: string; audioUri: string; sizeBytes: number; target: VoiceTranscriptionTarget },
): boolean {
  return a.userId === b.userId
    && a.audioUri === b.audioUri
    && a.sizeBytes === b.sizeBytes
    && a.target.surface === b.target.surface
    && a.target.key === b.target.key;
}

function strictVoiceSnapshotState<T extends {
  id: string;
  userId: string;
  audioUri: string;
  sizeBytes: number;
  target: VoiceTranscriptionTarget;
}>(
  values: ReadonlyArray<readonly [string, string | null]>,
  isItem: (value: unknown) => value is T,
  store: 'queue' | 'inbox',
): StrictVoiceCleanupState<T> {
  const present = values.filter(([, data]) => data != null);
  if (present.length === 0) return { canonical: [], attributionEvidence: [] };
  const snapshots = present.map(([, data]) => parseVoiceSnapshot(data, isItem));
  if (snapshots.some((snapshot) => !snapshot?.complete)) {
    throw new VoiceSnapshotIntegrityError(store);
  }
  const ordered = snapshots
    .map((snapshot, index) => ({ snapshot: snapshot!, index }))
    .sort((a, b) => b.snapshot.revision - a.snapshot.revision || a.index - b.index);
  const canonical = ordered[0].snapshot.items;
  const evidence = new Map(canonical.map((item) => [item.id, item]));
  ordered.slice(1).forEach(({ snapshot }) => snapshot.items.forEach((item) => {
    const existing = evidence.get(item.id);
    if (existing && !sameVoiceAttribution(existing, item)) {
      throw new VoiceSnapshotIntegrityError(store);
    }
    // Older intact copies are deletion evidence only. They never overwrite or
    // resurrect canonical active state.
    if (!existing) evidence.set(item.id, item);
  }));
  return { canonical, attributionEvidence: [...evidence.values()] };
}

function serializeVoiceSnapshot<T>(revision: number, items: T[]): string {
  return JSON.stringify({
    schemaVersion: VOICE_SNAPSHOT_SCHEMA_VERSION,
    revision,
    items,
    checksum: voiceSnapshotChecksum(revision, items),
  } satisfies VoiceSnapshot<T>);
}

let voiceInboxMutationChain: Promise<void> = Promise.resolve();
let voiceComposerMutationChain: Promise<void> = Promise.resolve();

async function runVoiceInboxExclusive<T>(operation: () => Promise<T>): Promise<T> {
  const run = voiceInboxMutationChain.then(operation, operation);
  voiceInboxMutationChain = run.then(() => undefined, () => undefined);
  return run;
}

async function runVoiceComposerExclusive<T>(operation: () => Promise<T>): Promise<T> {
  const run = voiceComposerMutationChain.then(operation, operation);
  voiceComposerMutationChain = run.then(() => undefined, () => undefined);
  return run;
}

function voiceComposerId(userId: string, target: VoiceTranscriptionTarget): string {
  return `${userId}:${target.surface}:${target.key}`;
}

function appendVoiceText(
  base: string,
  transcript: string,
  target: VoiceTranscriptionTarget,
): string {
  if (!base.trim()) return transcript;
  return `${base}${target.surface === 'write' ? '\n' : ' '}${transcript}`;
}

function reconcileComposerBase(
  durableText: string | undefined,
  visibleText: string,
  target: VoiceTranscriptionTarget,
): string {
  if (durableText == null || durableText === visibleText) return visibleText;
  if (visibleText.includes(durableText)) return visibleText;
  if (durableText.includes(visibleText) || !visibleText.trim()) return durableText;
  // Divergence means optional typed persistence failed or another surface was
  // stale. Preserve both user-authored versions rather than silently choosing
  // one at the irreversible queue-ack boundary.
  return appendVoiceText(durableText, visibleText, target);
}

function isVoiceComposerState(value: unknown): value is VoiceComposerState {
  if (!value || typeof value !== 'object') return false;
  const state = value as Partial<VoiceComposerState>;
  return typeof state.id === 'string'
    && typeof state.userId === 'string'
    && state.userId.length > 0
    && isVoiceTarget(state.target)
    && typeof state.text === 'string'
    && Array.isArray(state.deliveredClipIds)
    && state.deliveredClipIds.every((id) => typeof id === 'string' && id.length > 0)
    && (state.revision == null || (Number.isSafeInteger(state.revision) && state.revision >= 0))
    && (state.pendingDeliveries == null || (Array.isArray(state.pendingDeliveries)
      && state.pendingDeliveries.every((delivery) => !!delivery
        && typeof delivery.id === 'string'
        && delivery.id.length > 0
        && typeof delivery.transcript === 'string'
        && delivery.transcript.length > 0
        && (delivery.committedRevision == null
          || (Number.isSafeInteger(delivery.committedRevision) && delivery.committedRevision >= 0)))))
    && typeof state.updatedAt === 'string'
    && Number.isFinite(Date.parse(state.updatedAt));
}

function isPendingVoiceTranscription(value: unknown): value is PendingVoiceTranscription {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<PendingVoiceTranscription>;
  return typeof item.id === 'string'
    && item.id.length > 0
    && typeof item.userId === 'string'
    && item.userId.length > 0
    && typeof item.audioUri === 'string'
    && item.audioUri.length > 0
    && typeof item.sizeBytes === 'number'
    && Number.isFinite(item.sizeBytes)
    && item.sizeBytes > 0
    && (item.durationMs == null || (typeof item.durationMs === 'number' && Number.isFinite(item.durationMs)))
    && isVoiceTarget(item.target)
    && typeof item.status === 'string'
    && VOICE_STATUSES.has(item.status)
    && typeof item.createdAt === 'string'
    && Number.isFinite(Date.parse(item.createdAt))
    && typeof item.nextAttemptAt === 'string'
    && Number.isFinite(Date.parse(item.nextAttemptAt))
    && typeof item.attemptCount === 'number'
    && Number.isInteger(item.attemptCount)
    && item.attemptCount >= 0
    && (item.transcript == null || typeof item.transcript === 'string')
    && (item.lastErrorCode == null || typeof item.lastErrorCode === 'string');
}

function isPendingVoiceClipInboxItem(value: unknown): value is PendingVoiceClipInboxItem {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<PendingVoiceClipInboxItem>;
  return typeof item.id === 'string'
    && item.id.length > 0
    && typeof item.userId === 'string'
    && item.userId.length > 0
    && typeof item.audioUri === 'string'
    && item.audioUri.length > 0
    && typeof item.sizeBytes === 'number'
    && Number.isFinite(item.sizeBytes)
    && item.sizeBytes > 0
    && (item.durationMs == null || (typeof item.durationMs === 'number' && Number.isFinite(item.durationMs)))
    && isVoiceTarget(item.target)
    && typeof item.createdAt === 'string'
    && Number.isFinite(Date.parse(item.createdAt));
}

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
  private static readonly PENDING_VOICE_TRANSCRIPTIONS_BACKUP_KEY = '@pending_voice_transcriptions_v1_backup';
  private static readonly PENDING_VOICE_CLIP_INBOX_KEY = '@pending_voice_clip_inbox_v1';
  private static readonly PENDING_VOICE_CLIP_INBOX_BACKUP_KEY = '@pending_voice_clip_inbox_v1_backup';
  private static readonly VOICE_COMPOSERS_KEY = '@voice_composers_v1';
  private static readonly VOICE_COMPOSERS_BACKUP_KEY = '@voice_composers_v1_backup';
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
    const messages = Array.isArray(raw.messages)
      ? raw.messages.flatMap((message): ChatMessage[] => {
          if (!message || typeof message !== 'object') return [];
          if (message.role !== 'user' && message.role !== 'assistant') return [];
          if (!message.id || !message.content?.trim() || !message.timestamp) return [];
          const reflectiveQuestion = normalizeReflectiveQuestionArtifact(
            message.reflectiveQuestion
          );
          return [{
            id: message.id,
            role: message.role,
            content: message.content,
            timestamp: message.timestamp,
            ...(reflectiveQuestion ? { reflectiveQuestion } : {}),
          }];
        })
      : [];
    return {
      ...raw,
      messages,
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
      const values = await AsyncStorage.multiGet([
        this.PENDING_VOICE_TRANSCRIPTIONS_KEY,
        this.PENDING_VOICE_TRANSCRIPTIONS_BACKUP_KEY,
      ]);
      const snapshots = values.map(([, data]) => parseVoiceSnapshot(data, isPendingVoiceTranscription));
      const selected = newestRecoverableSnapshot(snapshots);
      if (selected) {
        const integrityDegraded = snapshots.some((snapshot, index) =>
          values[index]?.[1] != null && (!snapshot || !snapshot.complete));
        const shouldHeal = selected.legacy
          || !selected.complete
          || values[0]?.[1] !== values[1]?.[1]
          || snapshots.some((snapshot) => !snapshot);
        if (shouldHeal && !integrityDegraded) {
          logEvent('pending_voice_transcriptions_snapshot_recovered', {
            revision: selected.revision,
            itemCount: selected.items.length,
          });
          try {
            await this.savePendingVoiceTranscriptions(selected.items);
          } catch (healError) {
            // Recovery reads are more important than opportunistic healing. A
            // full/unavailable store must not hide the valid copy we already have.
            logError('pending_voice_transcriptions_snapshot_heal_failed', healError);
          }
        } else if (integrityDegraded) {
          // Preserve the damaged snapshot as evidence. Rewriting a recovered
          // subset would let a later strict logout read mistake it for the full
          // attribution set and clear the owner fence.
          logError(
            'pending_voice_transcriptions_integrity_degraded',
            new Error('Voice queue recovery requires strict cleanup review'),
          );
        }
        return selected.items;
      }
      if (values.some(([, data]) => data != null)) {
        logError('pending_voice_transcriptions_corrupt', new Error('Both queue copies were invalid'));
      }
      return [];
    } catch (error) {
      logError('pending_voice_transcriptions_read_failed', error);
      throw error;
    }
  }

  static async getPendingVoiceTranscriptionsStrict(): Promise<PendingVoiceTranscription[]> {
    return (await this.getPendingVoiceTranscriptionCleanupState()).canonical;
  }

  static async getPendingVoiceTranscriptionCleanupState(): Promise<StrictVoiceCleanupState<PendingVoiceTranscription>> {
    const values = await AsyncStorage.multiGet([
      this.PENDING_VOICE_TRANSCRIPTIONS_KEY,
      this.PENDING_VOICE_TRANSCRIPTIONS_BACKUP_KEY,
    ]);
    return strictVoiceSnapshotState(values, isPendingVoiceTranscription, 'queue');
  }

  static async savePendingVoiceTranscriptions(items: PendingVoiceTranscription[]): Promise<void> {
    const values = await AsyncStorage.multiGet([
      this.PENDING_VOICE_TRANSCRIPTIONS_KEY,
      this.PENDING_VOICE_TRANSCRIPTIONS_BACKUP_KEY,
    ]);
    if (values.some(([, data]) => {
      if (data == null) return false;
      const snapshot = parseVoiceSnapshot(data, isPendingVoiceTranscription);
      return !snapshot?.complete;
    })) {
      throw new VoiceSnapshotIntegrityError('queue');
    }
    const revision = Math.max(
      0,
      ...values.map(([, data]) => parseVoiceSnapshot(data, isPendingVoiceTranscription)?.revision ?? 0),
    ) + 1;
    const serialized = serializeVoiceSnapshot(revision, items);
    await AsyncStorage.multiSet([
      [this.PENDING_VOICE_TRANSCRIPTIONS_KEY, serialized],
      [this.PENDING_VOICE_TRANSCRIPTIONS_BACKUP_KEY, serialized],
    ]);
  }

  static async getPendingVoiceClipInbox(): Promise<PendingVoiceClipInboxItem[]> {
    try {
      const values = await AsyncStorage.multiGet([
        this.PENDING_VOICE_CLIP_INBOX_KEY,
        this.PENDING_VOICE_CLIP_INBOX_BACKUP_KEY,
      ]);
      const snapshots = values.map(([, data]) => parseVoiceSnapshot(data, isPendingVoiceClipInboxItem));
      const selected = newestRecoverableSnapshot(snapshots);
      if (selected) {
        const integrityDegraded = snapshots.some((snapshot, index) =>
          values[index]?.[1] != null && (!snapshot || !snapshot.complete));
        if (!integrityDegraded && (selected.legacy
          || !selected.complete
          || values[0]?.[1] !== values[1]?.[1]
          || snapshots.some((snapshot) => !snapshot))) {
          try {
            await this.savePendingVoiceClipInbox(selected.items);
          } catch (healError) {
            logError('pending_voice_clip_inbox_snapshot_heal_failed', healError);
          }
        } else if (integrityDegraded) {
          logError(
            'pending_voice_clip_inbox_integrity_degraded',
            new Error('Voice inbox recovery requires strict cleanup review'),
          );
        }
        return selected.items;
      }
      if (values.some(([, data]) => data != null)) {
        logError('pending_voice_clip_inbox_corrupt', new Error('Both inbox copies were invalid'));
      }
      return [];
    } catch (error) {
      logError('pending_voice_clip_inbox_read_failed', error);
      throw error;
    }
  }

  static async getPendingVoiceClipInboxStrict(): Promise<PendingVoiceClipInboxItem[]> {
    return (await this.getPendingVoiceClipInboxCleanupState()).canonical;
  }

  static async getPendingVoiceClipInboxCleanupState(): Promise<StrictVoiceCleanupState<PendingVoiceClipInboxItem>> {
    const values = await AsyncStorage.multiGet([
      this.PENDING_VOICE_CLIP_INBOX_KEY,
      this.PENDING_VOICE_CLIP_INBOX_BACKUP_KEY,
    ]);
    return strictVoiceSnapshotState(values, isPendingVoiceClipInboxItem, 'inbox');
  }

  static async savePendingVoiceClipInbox(items: PendingVoiceClipInboxItem[]): Promise<void> {
    const values = await AsyncStorage.multiGet([
      this.PENDING_VOICE_CLIP_INBOX_KEY,
      this.PENDING_VOICE_CLIP_INBOX_BACKUP_KEY,
    ]);
    if (values.some(([, data]) => {
      if (data == null) return false;
      const snapshot = parseVoiceSnapshot(data, isPendingVoiceClipInboxItem);
      return !snapshot?.complete;
    })) {
      throw new VoiceSnapshotIntegrityError('inbox');
    }
    const revision = Math.max(
      0,
      ...values.map(([, data]) => parseVoiceSnapshot(data, isPendingVoiceClipInboxItem)?.revision ?? 0),
    ) + 1;
    const serialized = serializeVoiceSnapshot(revision, items);
    await AsyncStorage.multiSet([
      [this.PENDING_VOICE_CLIP_INBOX_KEY, serialized],
      [this.PENDING_VOICE_CLIP_INBOX_BACKUP_KEY, serialized],
    ]);
  }

  private static async readVoiceComposers(strict = false): Promise<VoiceComposerState[]> {
    const values = await AsyncStorage.multiGet([
      this.VOICE_COMPOSERS_KEY,
      this.VOICE_COMPOSERS_BACKUP_KEY,
    ]);
    const snapshots = values.map(([, data]) => parseVoiceSnapshot(data, isVoiceComposerState));
    if (strict && values.some(([, data], index) => data != null && !snapshots[index]?.complete)) {
      throw new VoiceSnapshotIntegrityError('composer');
    }
    const selected = newestRecoverableSnapshot(snapshots);
    if (selected) return selected.items;
    if (values.some(([, data]) => data != null)) {
      throw new VoiceSnapshotIntegrityError('composer');
    }
    return [];
  }

  private static async writeVoiceComposers(items: VoiceComposerState[]): Promise<void> {
    const values = await AsyncStorage.multiGet([
      this.VOICE_COMPOSERS_KEY,
      this.VOICE_COMPOSERS_BACKUP_KEY,
    ]);
    const snapshots = values.map(([, data]) => parseVoiceSnapshot(data, isVoiceComposerState));
    if (values.some(([, data], index) => data != null && !snapshots[index]?.complete)) {
      throw new VoiceSnapshotIntegrityError('composer');
    }
    const revision = Math.max(0, ...snapshots.map((snapshot) => snapshot?.revision ?? 0)) + 1;
    const serialized = serializeVoiceSnapshot(revision, items);
    await AsyncStorage.multiSet([
      [this.VOICE_COMPOSERS_KEY, serialized],
      [this.VOICE_COMPOSERS_BACKUP_KEY, serialized],
    ]);
  }

  static async getVoiceComposer(
    userId: string,
    target: VoiceTranscriptionTarget,
  ): Promise<VoiceComposerState | null> {
    const states = await this.readVoiceComposers();
    return states.find((state) => state.id === voiceComposerId(userId, target)) ?? null;
  }

  static async saveVoiceComposerText(
    userId: string,
    target: VoiceTranscriptionTarget,
    text: string,
    baseRevision = 0,
  ): Promise<VoiceComposerState> {
    return runVoiceComposerExclusive(async () => {
      const states = await this.readVoiceComposers(true);
      const id = voiceComposerId(userId, target);
      const current = states.find((state) => state.id === id);
      const pendingDeliveries = current?.pendingDeliveries ?? [];
      let protectedText = text;
      pendingDeliveries.forEach((delivery) => {
        const committedRevision = delivery.committedRevision ?? current?.revision ?? 0;
        if (baseRevision < committedRevision) {
          // This save was created from a composer version that predates the
          // delivery. Rebase by clip identity/revision, never by substring: two
          // identical spoken phrases are still two distinct insertions.
          protectedText = appendVoiceText(protectedText, delivery.transcript, target);
        }
      });
      const next: VoiceComposerState = {
        id,
        userId,
        target,
        text: protectedText,
        deliveredClipIds: current?.deliveredClipIds ?? [],
        revision: (current?.revision ?? 0) + 1,
        pendingDeliveries,
        updatedAt: new Date().toISOString(),
      };
      await this.writeVoiceComposers([...states.filter((state) => state.id !== id), next]);
      return next;
    });
  }

  static async commitVoiceTranscript(
    userId: string,
    target: VoiceTranscriptionTarget,
    delivery: CompletedVoiceTranscript,
    currentText: string,
  ): Promise<VoiceComposerState> {
    return runVoiceComposerExclusive(async () => {
      const states = await this.readVoiceComposers(true);
      const id = voiceComposerId(userId, target);
      const current = states.find((state) => state.id === id);
      if (current?.deliveredClipIds.includes(delivery.id)) return current;
      const base = reconcileComposerBase(current?.text, currentText, target);
      const text = appendVoiceText(base, delivery.transcript, target);
      const revision = (current?.revision ?? 0) + 1;
      const next: VoiceComposerState = {
        id,
        userId,
        target,
        text,
        deliveredClipIds: [...(current?.deliveredClipIds ?? []), delivery.id],
        revision,
        pendingDeliveries: [
          ...(current?.pendingDeliveries ?? []),
          { id: delivery.id, transcript: delivery.transcript, committedRevision: revision },
        ],
        updatedAt: new Date().toISOString(),
      };
      await this.writeVoiceComposers([...states.filter((state) => state.id !== id), next]);
      return next;
    });
  }

  static async acknowledgeVoiceComposerDeliveries(
    userId: string,
    target: VoiceTranscriptionTarget,
    deliveryIds: string[],
    visibleRevision: number,
  ): Promise<VoiceComposerState | null> {
    if (deliveryIds.length === 0) return this.getVoiceComposer(userId, target);
    const acknowledgedIds = new Set(deliveryIds);
    return runVoiceComposerExclusive(async () => {
      const states = await this.readVoiceComposers(true);
      const id = voiceComposerId(userId, target);
      const current = states.find((state) => state.id === id);
      if (!current) return null;
      const pending = current.pendingDeliveries ?? [];
      const acknowledged = pending.filter((delivery) => acknowledgedIds.has(delivery.id));
      if (acknowledged.some((delivery) =>
        visibleRevision < (delivery.committedRevision ?? current.revision ?? 0))) {
        throw new Error('voice_composer_delivery_revision_not_visible');
      }
      if (acknowledged.length === 0) return current;
      const next: VoiceComposerState = {
        ...current,
        revision: (current.revision ?? 0) + 1,
        pendingDeliveries: pending.filter((delivery) => !acknowledgedIds.has(delivery.id)),
        updatedAt: new Date().toISOString(),
      };
      await this.writeVoiceComposers([...states.filter((state) => state.id !== id), next]);
      return next;
    });
  }

  static async clearVoiceComposer(userId: string, target: VoiceTranscriptionTarget): Promise<void> {
    await runVoiceComposerExclusive(async () => {
      const states = await this.readVoiceComposers(true);
      await this.writeVoiceComposers(
        states.filter((state) => state.id !== voiceComposerId(userId, target)),
      );
    });
  }

  static async addPendingVoiceClipToInbox(item: PendingVoiceClipInboxItem): Promise<void> {
    await runVoiceInboxExclusive(async () => {
      const items = await this.getPendingVoiceClipInbox();
      await this.savePendingVoiceClipInbox([
        ...items.filter((candidate) => candidate.id !== item.id),
        item,
      ]);
    });
  }

  static async removePendingVoiceClipsFromInbox(ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    const removeIds = new Set(ids);
    await runVoiceInboxExclusive(async () => {
      const items = await this.getPendingVoiceClipInbox();
      await this.savePendingVoiceClipInbox(items.filter((candidate) => !removeIds.has(candidate.id)));
    });
  }

  static async removePendingVoiceClipsFromInboxStrict(ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    const removeIds = new Set(ids);
    await runVoiceInboxExclusive(async () => {
      const state = await this.getPendingVoiceClipInboxCleanupState();
      await this.savePendingVoiceClipInbox(
        state.canonical.filter((candidate) => !removeIds.has(candidate.id)),
      );
      const verified = await this.getPendingVoiceClipInboxCleanupState();
      if (verified.attributionEvidence.some((candidate) => removeIds.has(candidate.id))) {
        throw new Error('voice_inbox_delete_unverified');
      }
    });
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
   * Clear account-scoped app storage (called when user logs out or changes).
   * Voice queue/inbox records are cleared separately by captured owner.
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
      this.VOICE_COMPOSERS_KEY,
      this.VOICE_COMPOSERS_BACKUP_KEY,
      // Voice queue/inbox lifecycle is owner-scoped and belongs exclusively to
      // voiceTranscriptionQueueService. A global account-data clear must never
      // erase a newly signed-in user's clip during delayed logout cleanup.
    ]);
    logEvent('local_storage_cleared');
  }
}
