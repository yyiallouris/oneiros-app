import type { EntitlementState, PlanCode, PlanTier, ReflectionOrigin } from './types.ts';

export function getPlanTier(planCode: PlanCode | null | undefined): PlanTier {
  switch (planCode) {
    case 'paid_monthly':
    case 'paid_yearly':
      return 'premium';
    case 'deeper_monthly':
    case 'deeper_yearly':
      return 'deeper';
    default:
      return 'free';
  }
}

export type CalendarScope = {
  monthKey: string;
  weekOfMonth: number;
  scopeKey: string;
  startDate: string;
  endDate: string;
};

type DateParts = {
  year: number;
  month: number;
  day: number;
};

function formatDateParts(date: Date, timeZone: string): DateParts {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = formatter.formatToParts(date);
  const part = (type: string) => Number(parts.find((item) => item.type === type)?.value ?? '0');

  return {
    year: part('year'),
    month: part('month'),
    day: part('day'),
  };
}

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

function lastDayOfMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export function hasPaidAccess(params: {
  planCode?: PlanCode | null;
  entitlementState?: EntitlementState | null;
  currentPeriodEnd?: string | null;
  at?: Date;
}): boolean {
  const at = params.at ?? new Date();
  if (getPlanTier(params.planCode) === 'free') return false;
  if (!params.entitlementState || !['active', 'grace_period', 'billing_retry'].includes(params.entitlementState)) {
    return false;
  }
  if (!params.currentPeriodEnd) return true;
  return new Date(params.currentPeriodEnd).getTime() > at.getTime();
}

export function buildRollingFreeWindow(lastConsumedAt: Date): { startAt: Date; endAt: Date } {
  return {
    startAt: new Date(lastConsumedAt),
    endAt: new Date(lastConsumedAt.getTime() + 7 * 24 * 60 * 60 * 1000),
  };
}

export function buildPaidCycleBucketKey(
  featureKey: string,
  userId: string,
  periodStart: string,
  periodEnd: string
): string {
  return `${featureKey}:${userId}:${periodStart}:${periodEnd}`;
}

export function buildCurrentMonthScope(at: Date, timeZone: string): CalendarScope {
  const { year, month, day } = formatDateParts(at, timeZone);
  const monthKey = `${year}-${pad(month)}`;
  const weekOfMonth = Math.ceil(day / 7);
  return {
    monthKey,
    weekOfMonth,
    scopeKey: `${monthKey}-W${weekOfMonth}`,
    startDate: `${monthKey}-01`,
    endDate: `${monthKey}-${pad(day)}`,
  };
}

export function buildCurrentMonthMonthlyScope(at: Date, timeZone: string): CalendarScope {
  const { year, month, day } = formatDateParts(at, timeZone);
  const monthKey = `${year}-${pad(month)}`;
  return {
    monthKey,
    weekOfMonth: 0,
    scopeKey: monthKey,
    startDate: `${monthKey}-01`,
    endDate: `${monthKey}-${pad(day)}`,
  };
}

export function buildFinishedMonthScope(monthKey: string): CalendarScope {
  const [year, month] = monthKey.split('-').map(Number);
  const finalDay = lastDayOfMonth(year, month);
  return {
    monthKey,
    weekOfMonth: 0,
    scopeKey: monthKey,
    startDate: `${monthKey}-01`,
    endDate: `${monthKey}-${pad(finalDay)}`,
  };
}

export function canGenerateCurrentMonthReflection(params: {
  reflectedDreamCount: number;
  latestReflectedAt?: Date | null;
  lastGeneratedAt?: Date | null;
}): boolean {
  if (params.reflectedDreamCount < 2) return false;
  if (!params.lastGeneratedAt) return true;
  if (!params.latestReflectedAt) return false;
  return params.latestReflectedAt.getTime() > params.lastGeneratedAt.getTime();
}

function hashString(input: string): string {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

export function getRecentSequenceScopeKey(dreamIds: string[], count: number): string {
  return `recent:${count}:${hashString(dreamIds.join('|'))}`;
}

export function isReflectionReadOnlyAfterLapse(origin: ReflectionOrigin | null | undefined, paidAccess: boolean): boolean {
  if (origin !== 'paid_cycle') return false;
  return !paidAccess;
}
