/**
 * Flow coverage: documentation/flows-05-sync-offline.md
 */
jest.mock('../../src/services/userService', () => ({
  UserService: {
    getCurrentUserId: jest.fn(),
  },
}));

jest.mock('../../src/services/remoteStorage', () => ({
  remoteSaveDream: jest.fn(),
  remoteGetDreams: jest.fn(),
  remoteSaveInterpretation: jest.fn(),
  remoteGetInterpretations: jest.fn(),
}));

jest.mock('../../src/utils/network', () => ({
  isOnline: jest.fn(),
  onNetworkStateChange: jest.fn(() => () => {}),
  setForceOfflineMode: jest.fn(),
}));

import type { Dream, Interpretation } from '../../src/types/dream';
import { LocalStorage } from '../../src/services/localStorage';
import { UserService } from '../../src/services/userService';
import * as remoteStorage from '../../src/services/remoteStorage';
import * as network from '../../src/utils/network';
import { SyncService } from '../../src/services/syncService';

jest.spyOn(LocalStorage, 'getUnsyncedDreams');
jest.spyOn(LocalStorage, 'removeUnsyncedDream');
jest.spyOn(LocalStorage, 'getUnsyncedInterpretations');
jest.spyOn(LocalStorage, 'removeUnsyncedInterpretation');
jest.spyOn(LocalStorage, 'getDreams');
jest.spyOn(LocalStorage, 'saveDreams');
jest.spyOn(LocalStorage, 'getInterpretations');
jest.spyOn(LocalStorage, 'saveInterpretations');

const dream: Dream = {
  id: 'dream-1',
  date: '2025-04-01',
  content: 'test',
  symbol: 'moon',
  createdAt: 't',
  updatedAt: 't',
};

const interpretation: Interpretation = {
  id: 'interpretation-1',
  dreamId: 'dream-1',
  messages: [{ id: 'm1', role: 'assistant', content: 'A reflection.', timestamp: 't' }],
  symbols: ['door'],
  symbol_stances: [{ symbol: 'door', stance: 'guarded, blocking' }],
  archetypes: [],
  landscapes: ['hallway'],
  affects: ['tension'],
  motifs: ['blocked threshold'],
  relational_dynamics: ['distance at entry'],
  thresholds: ['closed door'],
  central_conflicts: ['entry vs protection'],
  core_mode: 'Core Tension',
  amplifications: [{ title: '', tradition: '', resonance: 'door as charged boundary', divergence: '', evidence: [] }],
  display_distillation: {
    essence_title: 'Guarded entry',
    essence_line: 'The dream gathers around a guarded threshold.',
    dominant_lens: 'threshold',
    visible_anchors: [
      { label: 'door', type: 'threshold', salience: 5, ui_meaning: 'a guarded point of entry' },
    ],
    main_tension: 'entry vs protection',
    dream_movement: 'approaching',
    movement_line: 'Something approaches without crossing.',
  },
  metadata_status: 'ready',
  metadata_generated_at: '2026-04-01T00:00:01.000Z',
  metadata_error_code: null,
  createdAt: 't',
  updatedAt: 't',
};

describe('SyncService flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('syncUnsyncedDreams skips when no user', async () => {
    (UserService.getCurrentUserId as jest.Mock).mockResolvedValue(null);
    await SyncService.syncUnsyncedDreams();
    expect(LocalStorage.getUnsyncedDreams).not.toHaveBeenCalled();
  });

  it('syncUnsyncedDreams skips when offline', async () => {
    (UserService.getCurrentUserId as jest.Mock).mockResolvedValue('u1');
    (network.isOnline as jest.Mock).mockResolvedValue(false);
    await SyncService.syncUnsyncedDreams();
    expect(LocalStorage.getUnsyncedDreams).not.toHaveBeenCalled();
  });

  it('syncUnsyncedDreams pushes dreams and removes from queue on success', async () => {
    (UserService.getCurrentUserId as jest.Mock).mockResolvedValue('u1');
    (network.isOnline as jest.Mock).mockResolvedValue(true);
    (LocalStorage.getUnsyncedDreams as jest.Mock).mockResolvedValue([dream]);
    (remoteStorage.remoteSaveDream as jest.Mock).mockResolvedValue(undefined);

    await SyncService.syncUnsyncedDreams();

    expect(remoteStorage.remoteSaveDream).toHaveBeenCalledWith(dream);
    expect(LocalStorage.removeUnsyncedDream).toHaveBeenCalledWith('dream-1');
  });

  it('syncUnsyncedInterpretations pushes full AI metadata and removes from queue on success', async () => {
    (UserService.getCurrentUserId as jest.Mock).mockResolvedValue('u1');
    (network.isOnline as jest.Mock).mockResolvedValue(true);
    (LocalStorage.getUnsyncedInterpretations as jest.Mock).mockResolvedValue([interpretation]);
    (remoteStorage.remoteSaveInterpretation as jest.Mock).mockResolvedValue(undefined);

    await SyncService.syncUnsyncedInterpretations();

    expect(remoteStorage.remoteSaveInterpretation).toHaveBeenCalledWith(expect.objectContaining({
      id: 'interpretation-1',
      dreamId: 'dream-1',
      symbols: ['door'],
      symbol_stances: [{ symbol: 'door', stance: 'guarded, blocking' }],
      landscapes: ['hallway'],
      affects: ['tension'],
      motifs: ['blocked threshold'],
      relational_dynamics: ['distance at entry'],
      thresholds: ['closed door'],
      central_conflicts: ['entry vs protection'],
      core_mode: 'Core Tension',
      amplifications: [{ title: '', tradition: '', resonance: 'door as charged boundary', divergence: '', evidence: [] }],
      display_distillation: expect.objectContaining({ essence_title: 'Guarded entry' }),
    }));
    expect(LocalStorage.removeUnsyncedInterpretation).toHaveBeenCalledWith('interpretation-1');
  });

  it('fetchAndMergeDreams returns local only when offline', async () => {
    (UserService.getCurrentUserId as jest.Mock).mockResolvedValue('u1');
    (network.isOnline as jest.Mock).mockResolvedValue(false);
    (LocalStorage.getDreams as jest.Mock).mockResolvedValue([dream]);

    const out = await SyncService.fetchAndMergeDreams();
    expect(out).toEqual([dream]);
    expect(remoteStorage.remoteGetDreams).not.toHaveBeenCalled();
  });

  it('fetchAndMergeDreams merges remote over local by id', async () => {
    (UserService.getCurrentUserId as jest.Mock).mockResolvedValue('u1');
    (network.isOnline as jest.Mock).mockResolvedValue(true);
    const localDream: Dream = { ...dream, content: 'local' };
    const remoteDream: Dream = { ...dream, content: 'remote' };
    (LocalStorage.getDreams as jest.Mock).mockResolvedValue([localDream]);
    (remoteStorage.remoteGetDreams as jest.Mock).mockResolvedValue([remoteDream]);

    const out = await SyncService.fetchAndMergeDreams();

    expect(LocalStorage.saveDreams).toHaveBeenCalled();
    const saved = (LocalStorage.saveDreams as jest.Mock).mock.calls[0][0] as Dream[];
    const merged = saved.find((d) => d.id === 'dream-1');
    expect(merged?.content).toBe('remote');
    expect(out.find((d) => d.id === 'dream-1')?.content).toBe('remote');
  });

  it('fetchAndMergeInterpretations preserves local display distillation when remote omits it', async () => {
    (UserService.getCurrentUserId as jest.Mock).mockResolvedValue('u1');
    (network.isOnline as jest.Mock).mockResolvedValue(true);
    const remoteInterpretation: Interpretation = {
      ...interpretation,
      display_distillation: undefined,
      symbols: ['remote door'],
    };
    (LocalStorage.getInterpretations as jest.Mock).mockResolvedValue([interpretation]);
    (remoteStorage.remoteGetInterpretations as jest.Mock).mockResolvedValue([remoteInterpretation]);

    const out = await SyncService.fetchAndMergeInterpretations();

    expect(LocalStorage.saveInterpretations).toHaveBeenCalled();
    const saved = (LocalStorage.saveInterpretations as jest.Mock).mock.calls[0][0] as Interpretation[];
    expect(saved[0].symbols).toEqual(['remote door']);
    expect(saved[0].display_distillation?.essence_title).toBe('Guarded entry');
    expect(out[0].display_distillation?.movement_line).toBe('Something approaches without crossing.');
  });

  it('fetchAndMergeInterpretations preserves local-only optional metadata fields when remote omits them', async () => {
    (UserService.getCurrentUserId as jest.Mock).mockResolvedValue('u1');
    (network.isOnline as jest.Mock).mockResolvedValue(true);
    const remoteInterpretation: Interpretation = {
      ...interpretation,
      symbols: ['remote door'],
      symbol_stances: undefined,
      landscapes: undefined,
      affects: undefined,
      motifs: undefined,
      relational_dynamics: undefined,
      thresholds: undefined,
      central_conflicts: undefined,
      core_mode: undefined,
      amplifications: undefined,
      display_distillation: undefined,
    };
    (LocalStorage.getInterpretations as jest.Mock).mockResolvedValue([interpretation]);
    (remoteStorage.remoteGetInterpretations as jest.Mock).mockResolvedValue([remoteInterpretation]);

    const out = await SyncService.fetchAndMergeInterpretations();
    const saved = (LocalStorage.saveInterpretations as jest.Mock).mock.calls[0][0] as Interpretation[];

    expect(saved[0]).toMatchObject({
      symbols: ['remote door'],
      symbol_stances: [{ symbol: 'door', stance: 'guarded, blocking' }],
      landscapes: ['hallway'],
      affects: ['tension'],
      motifs: ['blocked threshold'],
      relational_dynamics: ['distance at entry'],
      thresholds: ['closed door'],
      central_conflicts: ['entry vs protection'],
      core_mode: 'Core Tension',
      amplifications: [{ title: '', tradition: '', resonance: 'door as charged boundary', divergence: '', evidence: [] }],
    });
    expect(saved[0].display_distillation?.essence_title).toBe('Guarded entry');
    expect(out[0].symbol_stances?.[0].stance).toBe('guarded, blocking');
  });

  it('fetchAndMergeInterpretations preserves local metadata when remote extraction is still pending', async () => {
    (UserService.getCurrentUserId as jest.Mock).mockResolvedValue('u1');
    (network.isOnline as jest.Mock).mockResolvedValue(true);
    const pendingRemoteInterpretation: Interpretation = {
      ...interpretation,
      symbols: [],
      symbol_stances: undefined,
      landscapes: undefined,
      affects: undefined,
      motifs: undefined,
      relational_dynamics: undefined,
      thresholds: undefined,
      central_conflicts: undefined,
      core_mode: undefined,
      amplifications: undefined,
      display_distillation: undefined,
      metadata_status: 'pending',
      metadata_generated_at: null,
      metadata_error_code: null,
    };
    (LocalStorage.getInterpretations as jest.Mock).mockResolvedValue([interpretation]);
    (remoteStorage.remoteGetInterpretations as jest.Mock).mockResolvedValue([pendingRemoteInterpretation]);

    await SyncService.fetchAndMergeInterpretations();
    const saved = (LocalStorage.saveInterpretations as jest.Mock).mock.calls[0][0] as Interpretation[];

    expect(saved[0]).toMatchObject({
      symbols: [],
      symbol_stances: [{ symbol: 'door', stance: 'guarded, blocking' }],
      landscapes: ['hallway'],
      affects: ['tension'],
      motifs: ['blocked threshold'],
      relational_dynamics: ['distance at entry'],
      thresholds: ['closed door'],
      central_conflicts: ['entry vs protection'],
      core_mode: 'Core Tension',
      amplifications: [{ title: '', tradition: '', resonance: 'door as charged boundary', divergence: '', evidence: [] }],
      metadata_status: 'pending',
    });
    expect(saved[0].display_distillation?.essence_title).toBe('Guarded entry');
  });

  it('fetchAndMergeInterpretations prefers remote optional metadata when present and keeps local-only interpretations', async () => {
    (UserService.getCurrentUserId as jest.Mock).mockResolvedValue('u1');
    (network.isOnline as jest.Mock).mockResolvedValue(true);
    const localOnly: Interpretation = {
      ...interpretation,
      id: 'interpretation-local-only',
      dreamId: 'dream-local-only',
      symbols: ['local moon'],
    };
    const remoteInterpretation: Interpretation = {
      ...interpretation,
      symbols: ['remote door'],
      symbol_stances: [{ symbol: 'remote door', stance: 'open, inviting' }],
      landscapes: ['remote hall'],
      affects: ['curiosity'],
      motifs: ['opening threshold'],
      relational_dynamics: ['permission to enter'],
      thresholds: ['open door'],
      central_conflicts: ['blocked door vs open hall'],
      core_mode: 'Core Shift',
      amplifications: [{ title: '', tradition: '', resonance: 'threshold as transition', divergence: '', evidence: [] }],
      display_distillation: {
        ...interpretation.display_distillation!,
        essence_title: 'Remote opening',
      },
    };
    (LocalStorage.getInterpretations as jest.Mock).mockResolvedValue([interpretation, localOnly]);
    (remoteStorage.remoteGetInterpretations as jest.Mock).mockResolvedValue([remoteInterpretation]);

    const out = await SyncService.fetchAndMergeInterpretations();
    const saved = (LocalStorage.saveInterpretations as jest.Mock).mock.calls[0][0] as Interpretation[];
    const mergedRemote = saved.find((item) => item.id === interpretation.id);
    const preservedLocal = saved.find((item) => item.id === localOnly.id);

    expect(mergedRemote).toMatchObject({
      symbols: ['remote door'],
      symbol_stances: [{ symbol: 'remote door', stance: 'open, inviting' }],
      landscapes: ['remote hall'],
      affects: ['curiosity'],
      motifs: ['opening threshold'],
      relational_dynamics: ['permission to enter'],
      thresholds: ['open door'],
      central_conflicts: ['blocked door vs open hall'],
      core_mode: 'Core Shift',
      amplifications: [{ title: '', tradition: '', resonance: 'threshold as transition', divergence: '', evidence: [] }],
    });
    expect(mergedRemote?.display_distillation?.essence_title).toBe('Remote opening');
    expect(preservedLocal?.symbols).toEqual(['local moon']);
    expect(out).toHaveLength(2);
  });
});
