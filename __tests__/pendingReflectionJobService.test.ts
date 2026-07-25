const store: { items: unknown[] } = { items: [] };

jest.mock('../src/services/localStorage', () => ({
  LocalStorage: {
    getPendingReflectionJobs: jest.fn(async () => store.items),
    savePendingReflectionJobs: jest.fn(async (items: unknown[]) => {
      store.items = items;
    }),
  },
}));

import {
  clearPendingReflectionJob,
  getPendingReflectionJob,
  setPendingReflectionJob,
} from '../src/services/pendingReflectionJobService';

describe('pendingReflectionJobService', () => {
  beforeEach(() => {
    store.items = [];
    jest.clearAllMocks();
  });

  it('stores, reads, and clears a pending reflection job per dream', async () => {
    await setPendingReflectionJob({
      dreamId: 'dream-a',
      quotaEventId: 'quota-a',
      action: 'dream_reflection_generate',
      depth: 'advanced',
      startedAt: '2026-07-25T12:00:00.000Z',
    });
    await setPendingReflectionJob({
      dreamId: 'dream-b',
      quotaEventId: 'quota-b',
      action: 'dream_reflection_regenerate',
      depth: 'standard',
      startedAt: '2026-07-25T12:01:00.000Z',
    });

    expect(await getPendingReflectionJob('dream-a')).toMatchObject({
      dreamId: 'dream-a',
      quotaEventId: 'quota-a',
    });
    expect(await getPendingReflectionJob('dream-b')).toMatchObject({
      action: 'dream_reflection_regenerate',
    });

    await clearPendingReflectionJob('dream-a');
    expect(await getPendingReflectionJob('dream-a')).toBeNull();
    expect((await getPendingReflectionJob('dream-b'))?.quotaEventId).toBe('quota-b');
  });

  it('replaces an existing job for the same dream', async () => {
    await setPendingReflectionJob({
      dreamId: 'dream-a',
      quotaEventId: 'quota-old',
      action: 'dream_reflection_generate',
      depth: 'quick',
      startedAt: '2026-07-25T12:00:00.000Z',
    });
    await setPendingReflectionJob({
      dreamId: 'dream-a',
      quotaEventId: 'quota-new',
      action: 'dream_reflection_generate',
      depth: 'advanced',
      startedAt: '2026-07-25T12:05:00.000Z',
    });

    expect(await getPendingReflectionJob('dream-a')).toMatchObject({
      quotaEventId: 'quota-new',
      depth: 'advanced',
    });
    expect(store.items).toHaveLength(1);
  });
});
