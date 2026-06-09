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
  archetypes: [],
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
});
