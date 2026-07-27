import path from 'path';
import {
  DEFAULT_PRODUCTION_BASELINE_SCENARIO,
  LIVE_SCENARIO_DIR,
  readLiveScenario,
  resolveLiveScenarioPath,
} from '../scripts/live/scenarios';

describe('live scenario fixtures', () => {
  it('keeps canonical live scenarios outside tmp', () => {
    expect(LIVE_SCENARIO_DIR).toContain(path.join('testing', 'live-scenarios'));
    expect(DEFAULT_PRODUCTION_BASELINE_SCENARIO).toContain(path.join('testing', 'live-scenarios'));
    expect(DEFAULT_PRODUCTION_BASELINE_SCENARIO.includes(`${path.sep}tmp${path.sep}`)).toBe(false);
  });

  it('loads the tracked production baseline scenario', () => {
    const scenario = readLiveScenario();
    expect(resolveLiveScenarioPath()).toBe(DEFAULT_PRODUCTION_BASELINE_SCENARIO);
    expect(scenario.id).toBe('production-baseline-copper-vessel');
    expect(scenario.prompt_version).toBe('3.9.0');
    expect(scenario.runs.with_reflection).toBe(3);
    expect(scenario.runs.without_reflection).toBe(3);
    expect(scenario.dream.title.length).toBeGreaterThan(10);
    expect(scenario.dream.content.length).toBeGreaterThan(500);
  });
});
