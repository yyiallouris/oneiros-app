import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('../src/services/logger', () => ({
  logEvent: jest.fn(),
  logError: jest.fn(),
}));

import { LocalStorage } from '../src/services/localStorage';
import type { PendingVoiceTranscription } from '../src/types/dream';

const primaryKey = '@pending_voice_transcriptions_v1';
const backupKey = '@pending_voice_transcriptions_v1_backup';
const inboxKey = '@pending_voice_clip_inbox_v1';
const inboxBackupKey = '@pending_voice_clip_inbox_v1_backup';
const composerPrimaryKey = '@voice_composers_v1';
const validItem: PendingVoiceTranscription = {
  id: 'voice-storage-test',
  userId: 'user-1',
  audioUri: 'file:///voice-storage-test.m4a',
  sizeBytes: 1234,
  durationMs: 12_000,
  target: { surface: 'write', key: 'active' },
  status: 'queued',
  createdAt: '2026-08-26T10:00:00.000Z',
  nextAttemptAt: '2026-08-26T10:00:00.000Z',
  attemptCount: 0,
};

describe('pending voice transcription storage', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
  });

  it('writes checksummed, revisioned primary and backup queue copies', async () => {
    await LocalStorage.savePendingVoiceTranscriptions([validItem]);

    const primary = await AsyncStorage.getItem(primaryKey);
    const backup = await AsyncStorage.getItem(backupKey);
    expect(primary).toBe(backup);
    expect(JSON.parse(primary!)).toEqual(expect.objectContaining({
      schemaVersion: 2,
      revision: 1,
      items: [validItem],
      checksum: expect.any(String),
    }));
  });

  it('recovers from malformed primary storage using the backup copy', async () => {
    await AsyncStorage.setItem(primaryKey, '{broken-json');
    await AsyncStorage.setItem(backupKey, JSON.stringify([validItem]));

    await expect(LocalStorage.getPendingVoiceTranscriptions()).resolves.toEqual([validItem]);
    await expect(LocalStorage.getPendingVoiceTranscriptionsStrict()).rejects.toMatchObject({
      code: 'VOICE_SNAPSHOT_INTEGRITY_ERROR',
    });
  });

  it('returns a recovered queue snapshot even when the best-effort healing write fails', async () => {
    const newerItem = { ...validItem, id: 'voice-storage-newer', audioUri: 'file:///newer.m4a' };
    await AsyncStorage.setItem(primaryKey, JSON.stringify([validItem]));
    await AsyncStorage.setItem(backupKey, JSON.stringify([validItem, newerItem]));
    jest.spyOn(AsyncStorage, 'multiSet').mockRejectedValueOnce(
      Object.assign(new Error('database or disk is full'), { code: 'SQLITE_FULL' }),
    );

    await expect(LocalStorage.getPendingVoiceTranscriptions()).resolves.toEqual([validItem, newerItem]);
  });

  it('recovers valid entries without erasing malformed evidence needed by strict cleanup', async () => {
    const invalidItem = { ...validItem, id: '', sizeBytes: -1 };
    await AsyncStorage.setItem(primaryKey, JSON.stringify([validItem, invalidItem]));

    await expect(LocalStorage.getPendingVoiceTranscriptions()).resolves.toEqual([validItem]);
    expect(JSON.parse((await AsyncStorage.getItem(primaryKey))!)).toEqual([validItem, invalidItem]);
    expect(await AsyncStorage.getItem(backupKey)).toBeNull();
    await expect(LocalStorage.getPendingVoiceTranscriptionsStrict()).rejects.toMatchObject({
      code: 'VOICE_SNAPSHOT_INTEGRITY_ERROR',
    });
    await expect(LocalStorage.savePendingVoiceTranscriptions([validItem])).rejects.toMatchObject({
      code: 'VOICE_SNAPSHOT_INTEGRITY_ERROR',
    });
  });

  it('selects a newer valid backup instead of a stale but parseable primary', async () => {
    await LocalStorage.savePendingVoiceTranscriptions([validItem]);
    const stalePrimary = await AsyncStorage.getItem(primaryKey);
    const newerItem = { ...validItem, id: 'voice-storage-newer', audioUri: 'file:///newer.m4a' };
    await LocalStorage.savePendingVoiceTranscriptions([validItem, newerItem]);
    await AsyncStorage.setItem(primaryKey, stalePrimary!);

    await expect(LocalStorage.getPendingVoiceTranscriptions()).resolves.toEqual([validItem, newerItem]);
    expect(await AsyncStorage.getItem(primaryKey)).toBe(await AsyncStorage.getItem(backupKey));
  });

  it('uses only the newest intact snapshot as active state while retaining stale rows as deletion evidence', async () => {
    await LocalStorage.savePendingVoiceTranscriptions([validItem]);
    const staleWithItem = await AsyncStorage.getItem(primaryKey);
    await LocalStorage.savePendingVoiceTranscriptions([]);
    const acknowledged = await AsyncStorage.getItem(primaryKey);
    await AsyncStorage.multiSet([
      [primaryKey, acknowledged!],
      [backupKey, staleWithItem!],
    ]);

    await expect(LocalStorage.getPendingVoiceTranscriptionCleanupState()).resolves.toEqual({
      canonical: [],
      attributionEvidence: [validItem],
    });
    await expect(LocalStorage.getPendingVoiceTranscriptionsStrict()).resolves.toEqual([]);
  });

  it('rejects immutable owner or audio conflicts between intact snapshots', async () => {
    await LocalStorage.savePendingVoiceTranscriptions([validItem]);
    const original = await AsyncStorage.getItem(primaryKey);
    await LocalStorage.savePendingVoiceTranscriptions([{
      ...validItem,
      audioUri: 'file:///conflicting-owner-evidence.m4a',
    }]);
    const conflicting = await AsyncStorage.getItem(primaryKey);
    await AsyncStorage.multiSet([
      [primaryKey, conflicting!],
      [backupKey, original!],
    ]);

    await expect(LocalStorage.getPendingVoiceTranscriptionCleanupState()).rejects.toMatchObject({
      code: 'VOICE_SNAPSHOT_INTEGRITY_ERROR',
    });
  });

  it('does not let a partially valid primary overwrite a complete backup', async () => {
    const second = { ...validItem, id: 'voice-storage-second', audioUri: 'file:///second.m4a' };
    const invalid = { ...validItem, id: '', sizeBytes: -1 };
    await AsyncStorage.setItem(primaryKey, JSON.stringify([validItem, invalid]));
    await AsyncStorage.setItem(backupKey, JSON.stringify([validItem, second]));

    await expect(LocalStorage.getPendingVoiceTranscriptions()).resolves.toEqual([validItem, second]);
  });

  it('fails strict cleanup reads when either queue snapshot is corrupt', async () => {
    await AsyncStorage.setItem(primaryKey, '{broken-json');
    await AsyncStorage.setItem(backupKey, JSON.stringify([validItem]));

    await expect(LocalStorage.getPendingVoiceTranscriptionsStrict()).rejects.toMatchObject({
      code: 'VOICE_SNAPSHOT_INTEGRITY_ERROR',
    });
  });

  it('fails strict cleanup when both queue snapshots are corrupt', async () => {
    await AsyncStorage.setItem(primaryKey, '{broken-primary');
    await AsyncStorage.setItem(backupKey, '{broken-backup');

    await expect(LocalStorage.getPendingVoiceTranscriptionsStrict()).rejects.toMatchObject({
      code: 'VOICE_SNAPSHOT_INTEGRITY_ERROR',
    });
  });

  it('fails strict cleanup reads instead of dropping a malformed queue entry', async () => {
    await AsyncStorage.setItem(primaryKey, JSON.stringify([validItem, { ...validItem, id: '' }]));

    await expect(LocalStorage.getPendingVoiceTranscriptionsStrict()).rejects.toMatchObject({
      code: 'VOICE_SNAPSHOT_INTEGRITY_ERROR',
    });
  });

  it('keeps finalized clips in a separate durable inbox until queue handoff succeeds', async () => {
    const inboxItem = {
      id: validItem.id,
      userId: validItem.userId,
      audioUri: validItem.audioUri,
      sizeBytes: validItem.sizeBytes,
      durationMs: validItem.durationMs,
      target: validItem.target,
      createdAt: validItem.createdAt,
    };
    await LocalStorage.addPendingVoiceClipToInbox(inboxItem);

    await expect(LocalStorage.getPendingVoiceClipInbox()).resolves.toEqual([inboxItem]);
    expect(JSON.parse((await AsyncStorage.getItem(inboxKey))!).items).toEqual([inboxItem]);

    await LocalStorage.removePendingVoiceClipsFromInbox([inboxItem.id]);
    await expect(LocalStorage.getPendingVoiceClipInbox()).resolves.toEqual([]);
  });

  it('fails strict cleanup when an inbox copy is unreadable', async () => {
    await AsyncStorage.setItem(inboxKey, '{broken-json');
    await AsyncStorage.setItem(inboxBackupKey, JSON.stringify([]));

    await expect(LocalStorage.getPendingVoiceClipInboxStrict()).rejects.toMatchObject({
      code: 'VOICE_SNAPSHOT_INTEGRITY_ERROR',
    });
  });

  it('commits a completed transcript idempotently before queue acknowledgement', async () => {
    const delivery = { id: 'voice-delivery', transcript: 'the red room' };
    await expect(LocalStorage.commitVoiceTranscript(
      'user-1',
      validItem.target,
      delivery,
      'I entered',
    )).resolves.toEqual(expect.objectContaining({
      text: 'I entered\nthe red room',
      revision: 1,
      deliveredClipIds: [delivery.id],
    }));
    await expect(LocalStorage.commitVoiceTranscript(
      'user-1',
      validItem.target,
      delivery,
      'stale UI text',
    )).resolves.toEqual(expect.objectContaining({
      text: 'I entered\nthe red room',
      revision: 1,
      deliveredClipIds: [delivery.id],
    }));
  });

  it('rebases a stale typed save onto a committed transcript instead of erasing delivery', async () => {
    const delivery = { id: 'voice-race', transcript: 'automotive was not the dream' };
    await LocalStorage.commitVoiceTranscript(
      'user-1',
      validItem.target,
      delivery,
      'before recording',
    );

    await LocalStorage.saveVoiceComposerText('user-1', validItem.target, 'stale typed value');
    await expect(LocalStorage.getVoiceComposer('user-1', validItem.target)).resolves.toEqual(
      expect.objectContaining({
        text: 'stale typed value\nautomotive was not the dream',
        deliveredClipIds: [delivery.id],
        revision: 2,
        pendingDeliveries: [{ ...delivery, committedRevision: 1 }],
      }),
    );
  });

  it('releases delivery protection after the committed text is visibly integrated', async () => {
    const delivery = { id: 'voice-visible', transcript: 'visible spoken text' };
    const committed = await LocalStorage.commitVoiceTranscript(
      'user-1',
      validItem.target,
      delivery,
      'typed opening',
    );

    await LocalStorage.acknowledgeVoiceComposerDeliveries(
      'user-1',
      validItem.target,
      [delivery.id],
      committed.revision!,
    );

    await expect(LocalStorage.getVoiceComposer('user-1', validItem.target)).resolves.toEqual(
      expect.objectContaining({
        text: committed.text,
        pendingDeliveries: [],
      }),
    );
  });

  it('preserves repeated "yes" as a distinct delivery across stale save and app-kill recovery', async () => {
    const initial = await LocalStorage.saveVoiceComposerText(
      'user-1',
      validItem.target,
      'yes',
    );
    const delivery = { id: 'voice-repeat-yes', transcript: 'yes' };
    const committed = await LocalStorage.commitVoiceTranscript(
      'user-1',
      validItem.target,
      delivery,
      initial.text,
    );

    await LocalStorage.saveVoiceComposerText(
      'user-1',
      validItem.target,
      'yes',
      initial.revision,
    );

    await expect(LocalStorage.getVoiceComposer('user-1', validItem.target)).resolves.toEqual(
      expect.objectContaining({
        text: 'yes\nyes',
        deliveredClipIds: [delivery.id],
        pendingDeliveries: [{
          ...delivery,
          committedRevision: committed.revision,
        }],
      }),
    );
  });

  it('fails transcript commit closed when either composer snapshot is corrupt', async () => {
    await LocalStorage.saveVoiceComposerText('user-1', validItem.target, 'durable typed text');
    await AsyncStorage.setItem(composerPrimaryKey, '{corrupt-composer');

    await expect(LocalStorage.commitVoiceTranscript(
      'user-1',
      validItem.target,
      { id: 'voice-corrupt-composer', transcript: 'must remain queued' },
      'durable typed text',
    )).rejects.toMatchObject({
      code: 'VOICE_SNAPSHOT_INTEGRITY_ERROR',
      store: 'composer',
    });
  });

  it('preserves divergent durable and visible typing at the transcript commit boundary', async () => {
    await LocalStorage.saveVoiceComposerText(
      'user-1',
      validItem.target,
      'older durable phrase',
    );

    await expect(LocalStorage.commitVoiceTranscript(
      'user-1',
      validItem.target,
      { id: 'voice-divergent-text', transcript: 'spoken phrase' },
      'new visible phrase',
    )).resolves.toEqual(expect.objectContaining({
      text: 'older durable phrase\nnew visible phrase\nspoken phrase',
    }));
  });
});
