/**
 * Flow coverage: documentation/flows-07-insights-reports.md
 * (symbol safety labels, archetype taxonomy, date labels).
 */
import {
  isInnerStructureArchetype,
  isWhitelistedArchetype,
  normalizeArchetype,
  normalizeArchetypeList,
} from '../../src/constants/archetypes';
import {
  getArchetypeInfoKey,
  SYMBOL_ARCHETYPE_INFO,
} from '../../src/constants/symbolArchetypeInfo';
import { isExplicitSymbol, SAFE_CATEGORIES, toSafeSymbolLabel } from '../../src/constants/safeLabels';
import {
  formatDate,
  formatDateShort,
  generateId,
  getGreeting,
  getTodayDate,
  toISODate,
} from '../../src/utils/date';

describe('symbol and archetype taxonomy flow', () => {
  it('normalizes archetypes, aliases, and slash-separated pair labels', () => {
    expect(isWhitelistedArchetype('The Shadow')).toBe(true);
    expect(isInnerStructureArchetype('the persona')).toBe(true);
    expect(isInnerStructureArchetype('Hero')).toBe(false);
    expect(normalizeArchetype('child (divine child)')).toBe('Child');
    expect(normalizeArchetype('death archetype')).toBe('Death');
    expect(normalizeArchetype('wise old')).toBe('Wise Old Woman');
    expect(normalizeArchetype('unknown current')).toBeNull();
    expect(normalizeArchetypeList('Wise Old Man / Wise Old Woman / unknown')).toEqual([
      'Wise Old Man',
      'Wise Old Woman',
    ]);
  });

  it('maps archetype chips to dedicated modal content keys with generic fallback', () => {
    expect(getArchetypeInfoKey('The Shadow')).toBe('archetype-shadow');
    expect(getArchetypeInfoKey('Wounded Healer')).toBe('archetype-wounded-healer');
    expect(getArchetypeInfoKey('unknown current')).toBe('archetypal-states');
    expect(SYMBOL_ARCHETYPE_INFO[getArchetypeInfoKey('Shadow')].sections?.length).toBeGreaterThan(0);
  });

  it('keeps explicit symbols private unless the user opts in', () => {
    expect(isExplicitSymbol('  public square  ')).toBe(false);
    expect(isExplicitSymbol('naked body')).toBe(true);
    expect(isExplicitSymbol('toilet room')).toBe(true);
    expect(toSafeSymbolLabel('Naked body', 'naked body', false)).toBe(SAFE_CATEGORIES.intimacy);
    expect(toSafeSymbolLabel('Toilet room', 'toilet room', false)).toBe(SAFE_CATEGORIES.body);
    expect(toSafeSymbolLabel('Naked body', 'naked body', true)).toBe('Naked body');
    expect(toSafeSymbolLabel('Tower', 'tower', false)).toBe('Tower');
  });
});

describe('date utility flow', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('formats full and short dates consistently', () => {
    const date = new Date('2026-04-29T12:00:00.000Z');
    expect(formatDate(date)).toBe('Wed · 29 Apr 2026');
    expect(formatDateShort(date)).toBe('29 Apr 2026');
    expect(formatDate('2026-04-29T12:00:00.000Z')).toBe('Wed · 29 Apr 2026');
  });

  it('produces local ISO dates, greeting copy, and ids', () => {
    jest.setSystemTime(new Date('2026-04-30T06:30:00.000Z'));
    expect(toISODate(new Date('2026-04-03T12:00:00.000Z'))).toBe('2026-04-03');
    expect(getTodayDate()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(getGreeting()).toBe("Today's dream");

    jest.setSystemTime(new Date('2026-04-30T23:30:00.000Z'));
    expect(getGreeting()).toBe("Tonight's dream");

    jest.spyOn(Math, 'random').mockReturnValue(0.123456789);
    jest.setSystemTime(new Date('2026-04-30T00:00:00.000Z'));
    expect(generateId()).toMatch(/^\d+-[a-z0-9]+$/);
    jest.mocked(Math.random).mockRestore();
  });
});
