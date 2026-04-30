/**
 * Flow coverage: documentation/flows-05-sync-offline.md (offline-first storage orchestration).
 */
jest.mock('../../src/services/localStorage', () => ({
  LocalStorage: {
    clearAll: jest.fn(),
    addUnsyncedDream: jest.fn(),
    addUnsyncedInterpretation: jest.fn(),
    getDreams: jest.fn(),
    getInterpretations: jest.fn(),
    saveDream: jest.fn(),
    saveInterpretation: jest.fn(),
  },
}));

jest.mock('../../src/services/userService', () => ({
  UserService: {
    clearStoredUserId: jest.fn(),
    getCurrentUserId: jest.fn(),
    hasUserChanged: jest.fn(),
    storeUserId: jest.fn(),
  },
}));

jest.mock('../../src/services/syncService', () => ({
  SyncService: {
    fetchAndMergeDreams: jest.fn(),
    fetchAndMergeInterpretations: jest.fn(),
    syncAll: jest.fn(),
    syncUnsyncedDreams: jest.fn(),
    syncUnsyncedInterpretations: jest.fn(),
  },
}));

jest.mock('../../src/utils/network', () => ({
  isOnline: jest.fn(),
}));

jest.mock('../../src/services/logger', () => ({
  logEvent: jest.fn(),
}));

import type { Dream, Interpretation } from '../../src/types/dream';
import { LocalStorage } from '../../src/services/localStorage';
import { UserService } from '../../src/services/userService';
import { SyncService } from '../../src/services/syncService';
import { isOnline } from '../../src/utils/network';
import { StorageService } from '../../src/services/storageService';

const mockLocalStorage = LocalStorage as jest.Mocked<typeof LocalStorage>;
const mockUserService = UserService as jest.Mocked<typeof UserService>;
const mockSyncService = SyncService as jest.Mocked<typeof SyncService>;
const mockIsOnline = isOnline as jest.MockedFunction<typeof isOnline>;

const dream: Dream = {
  id: 'dream-1',
  date: '2025-04-01',
  content: 'I was walking under a moonlit sky.',
  symbol: 'moon',
  createdAt: '2025-04-01T00:00:00.000Z',
  updatedAt: '2025-04-01T00:00:00.000Z',
};

const interpretation: Interpretation = {
  id: 'interpretation-1',
  dreamId: 'dream-1',
  messages: [{ id: 'm1', role: 'assistant', content: 'A gentle reflection.', timestamp: 't' }],
  symbols: ['moon'],
  archetypes: ['shadow'],
  summary: 'A short summary',
  createdAt: '2025-04-01T00:00:00.000Z',
  updatedAt: '2025-04-01T00:00:00.000Z',
};

async function flushMicrotasks(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}

describe('StorageService flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
    mockSyncService.syncUnsyncedDreams.mockResolvedValue(undefined);
    mockSyncService.syncUnsyncedInterpretations.mockResolvedValue(undefined);
    mockSyncService.fetchAndMergeDreams.mockResolvedValue([dream]);
    mockSyncService.fetchAndMergeInterpretations.mockResolvedValue([interpretation]);
  });

  it('saveDream always saves locally and queues immediately', async () => {
    mockUserService.getCurrentUserId.mockResolvedValue(null);

    await StorageService.saveDream(dream);
    await flushMicrotasks();

    expect(mockLocalStorage.saveDream).toHaveBeenCalledWith(dream);
    expect(mockLocalStorage.addUnsyncedDream).toHaveBeenCalledWith(dream);
    expect(mockSyncService.syncUnsyncedDreams).not.toHaveBeenCalled();
  });

  it('saveDream triggers background sync when authenticated', async () => {
    mockUserService.getCurrentUserId.mockResolvedValue('user-1');

    await StorageService.saveDream(dream);
    await flushMicrotasks();

    expect(mockLocalStorage.saveDream).toHaveBeenCalledWith(dream);
    expect(mockLocalStorage.addUnsyncedDream).toHaveBeenCalledWith(dream);
    expect(mockSyncService.syncUnsyncedDreams).toHaveBeenCalledTimes(1);
  });

  it('getDreams returns local data immediately and fetches remote in background when online', async () => {
    jest.useFakeTimers();
    mockLocalStorage.getDreams.mockResolvedValue([dream]);
    mockUserService.getCurrentUserId.mockResolvedValue('user-1');
    mockIsOnline.mockResolvedValue(true);

    await expect(StorageService.getDreams()).resolves.toEqual([dream]);
    expect(mockSyncService.fetchAndMergeDreams).not.toHaveBeenCalled();

    jest.runOnlyPendingTimers();
    await flushMicrotasks();

    expect(mockSyncService.fetchAndMergeDreams).toHaveBeenCalledTimes(1);
  });

  it('getDreams skips background fetch when offline', async () => {
    jest.useFakeTimers();
    mockLocalStorage.getDreams.mockResolvedValue([dream]);
    mockUserService.getCurrentUserId.mockResolvedValue('user-1');
    mockIsOnline.mockResolvedValue(false);

    await expect(StorageService.getDreams()).resolves.toEqual([dream]);

    jest.runOnlyPendingTimers();
    await flushMicrotasks();

    expect(mockSyncService.fetchAndMergeDreams).not.toHaveBeenCalled();
  });

  it('saveInterpretation queues locally even without a logged-in user', async () => {
    mockUserService.getCurrentUserId.mockResolvedValue(null);

    await StorageService.saveInterpretation(interpretation);

    expect(mockLocalStorage.saveInterpretation).toHaveBeenCalledWith(interpretation);
    expect(mockLocalStorage.addUnsyncedInterpretation).toHaveBeenCalledWith(interpretation);
    expect(mockSyncService.syncUnsyncedInterpretations).not.toHaveBeenCalled();
  });

  it('saveInterpretation syncs in background when authenticated', async () => {
    mockUserService.getCurrentUserId.mockResolvedValue('user-1');

    await StorageService.saveInterpretation(interpretation);

    expect(mockLocalStorage.saveInterpretation).toHaveBeenCalledWith(interpretation);
    expect(mockLocalStorage.addUnsyncedInterpretation).toHaveBeenCalledWith(interpretation);
    expect(mockSyncService.syncUnsyncedInterpretations).toHaveBeenCalledTimes(1);
  });

  it('getInterpretations returns local cache and schedules background merge', async () => {
    mockLocalStorage.getInterpretations.mockResolvedValue([interpretation]);

    await expect(StorageService.getInterpretations()).resolves.toEqual([interpretation]);
    expect(mockSyncService.fetchAndMergeInterpretations).toHaveBeenCalledTimes(1);
  });
});
