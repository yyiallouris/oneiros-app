import {
  buildCurrentMonthScope,
  buildPaidCycleBucketKey,
  buildRollingFreeWindow,
  canGenerateCurrentMonthReflection,
  getRecentSequenceScopeKey,
  hasPaidAccess,
  isReflectionReadOnlyAfterLapse,
} from '../../src/billing/policy';

describe('subscription billing policy flow', () => {
  it('grants paid access only for active paid-monthly entitlements inside the billing window', () => {
    const now = new Date('2026-07-10T12:00:00.000Z');

    expect(
      hasPaidAccess({
        planCode: 'paid_monthly',
        entitlementState: 'active',
        currentPeriodEnd: '2026-07-20T00:00:00.000Z',
        at: now,
      })
    ).toBe(true);

    expect(
      hasPaidAccess({
        planCode: 'paid_monthly',
        entitlementState: 'expired',
        currentPeriodEnd: '2026-07-20T00:00:00.000Z',
        at: now,
      })
    ).toBe(false);

    expect(
      hasPaidAccess({
        planCode: 'paid_monthly',
        entitlementState: 'active',
        currentPeriodEnd: '2026-07-01T00:00:00.000Z',
        at: now,
      })
    ).toBe(false);
  });

  it('builds a rolling 7-day free reflection window', () => {
    const start = new Date('2026-07-10T09:15:00.000Z');
    const window = buildRollingFreeWindow(start);

    expect(window.startAt.toISOString()).toBe('2026-07-10T09:15:00.000Z');
    expect(window.endAt.toISOString()).toBe('2026-07-17T09:15:00.000Z');
  });

  it('changes paid-cycle bucket keys when the billing cycle rolls over', () => {
    const firstCycle = buildPaidCycleBucketKey(
      'dream_reflection_paid',
      'user-1',
      '2026-07-01T00:00:00.000Z',
      '2026-08-01T00:00:00.000Z'
    );
    const secondCycle = buildPaidCycleBucketKey(
      'dream_reflection_paid',
      'user-1',
      '2026-08-01T00:00:00.000Z',
      '2026-09-01T00:00:00.000Z'
    );

    expect(firstCycle).not.toBe(secondCycle);
  });

  it('uses the persisted timezone for current-month weekly cadence math', () => {
    const scope = buildCurrentMonthScope(new Date('2026-07-10T22:30:00.000Z'), 'Europe/Athens');

    expect(scope.monthKey).toBe('2026-07');
    expect(scope.weekOfMonth).toBe(2);
    expect(scope.scopeKey).toBe('2026-07-W2');
    expect(scope.endDate).toBe('2026-07-11');
  });

  it('requires a new reflected dream after the last current-month generation', () => {
    expect(
      canGenerateCurrentMonthReflection({
        reflectedDreamCount: 2,
        latestReflectedAt: new Date('2026-07-10T12:00:00.000Z'),
        lastGeneratedAt: new Date('2026-07-09T12:00:00.000Z'),
      })
    ).toBe(true);

    expect(
      canGenerateCurrentMonthReflection({
        reflectedDreamCount: 2,
        latestReflectedAt: new Date('2026-07-09T12:00:00.000Z'),
        lastGeneratedAt: new Date('2026-07-09T12:00:00.000Z'),
      })
    ).toBe(false);
  });

  it('keeps recent dream field cache keys stable for the same dream sequence and count', () => {
    expect(getRecentSequenceScopeKey(['d1', 'd2', 'd3'], 3)).toBe(getRecentSequenceScopeKey(['d1', 'd2', 'd3'], 3));
    expect(getRecentSequenceScopeKey(['d1', 'd2', 'd3'], 3)).not.toBe(getRecentSequenceScopeKey(['d1', 'd3', 'd2'], 3));
  });

  it('treats paid-origin reflections as read-only after lapse while free-origin reflections stay usable', () => {
    expect(isReflectionReadOnlyAfterLapse('paid_cycle', false)).toBe(true);
    expect(isReflectionReadOnlyAfterLapse('paid_cycle', true)).toBe(false);
    expect(isReflectionReadOnlyAfterLapse('free_weekly', false)).toBe(false);
  });
});
