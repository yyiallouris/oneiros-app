/**
 * Durable handles for in-flight async dream reflections.
 * Survives leave/kill so DreamDetail can resume status polling.
 */

import { LocalStorage } from './localStorage';
import type { GatewayAction } from '../billing/types';

export type PendingReflectionJob = {
  dreamId: string;
  quotaEventId: string;
  action: Extract<GatewayAction, 'dream_reflection_generate' | 'dream_reflection_regenerate'>;
  depth: 'quick' | 'standard' | 'advanced';
  startedAt: string;
};

function isPendingReflectionJob(value: unknown): value is PendingReflectionJob {
  if (!value || typeof value !== 'object') return false;
  const o = value as Record<string, unknown>;
  return (
    typeof o.dreamId === 'string' &&
    o.dreamId.length > 0 &&
    typeof o.quotaEventId === 'string' &&
    o.quotaEventId.length > 0 &&
    (o.action === 'dream_reflection_generate' || o.action === 'dream_reflection_regenerate') &&
    (o.depth === 'quick' || o.depth === 'standard' || o.depth === 'advanced') &&
    typeof o.startedAt === 'string'
  );
}

async function readJobs(): Promise<PendingReflectionJob[]> {
  const raw = await LocalStorage.getPendingReflectionJobs();
  if (!Array.isArray(raw)) return [];
  return raw.filter(isPendingReflectionJob);
}

export async function setPendingReflectionJob(job: PendingReflectionJob): Promise<void> {
  const jobs = await readJobs();
  await LocalStorage.savePendingReflectionJobs([
    ...jobs.filter((candidate) => candidate.dreamId !== job.dreamId),
    job,
  ]);
}

export async function getPendingReflectionJob(dreamId: string): Promise<PendingReflectionJob | null> {
  const jobs = await readJobs();
  return jobs.find((job) => job.dreamId === dreamId) ?? null;
}

export async function clearPendingReflectionJob(dreamId: string): Promise<void> {
  const jobs = await readJobs();
  const next = jobs.filter((job) => job.dreamId !== dreamId);
  if (next.length === jobs.length) return;
  await LocalStorage.savePendingReflectionJobs(next);
}
