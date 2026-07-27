import { existsSync, readFileSync } from 'fs';
import path from 'path';

export type LiveBaselineScenario = {
  id: string;
  description: string;
  prompt_version: string;
  output_dir: string;
  runs: {
    with_reflection: number;
    without_reflection: number;
  };
  dream: {
    title: string;
    date: string;
    content: string;
  };
};

export const LIVE_SCENARIO_DIR = path.join(process.cwd(), 'testing', 'live-scenarios');
export const DEFAULT_PRODUCTION_BASELINE_SCENARIO = path.join(
  LIVE_SCENARIO_DIR,
  'production-baseline.copper-vessel.v3-9-0.json'
);

export function resolveLiveScenarioPath(inputPath?: string): string {
  if (!inputPath || !inputPath.trim()) return DEFAULT_PRODUCTION_BASELINE_SCENARIO;
  return path.isAbsolute(inputPath) ? inputPath : path.join(process.cwd(), inputPath);
}

export function readLiveScenario(inputPath?: string): LiveBaselineScenario {
  const scenarioPath = resolveLiveScenarioPath(inputPath);
  if (!existsSync(scenarioPath)) {
    throw new Error(`Live scenario not found at ${scenarioPath}`);
  }

  const raw = JSON.parse(readFileSync(scenarioPath, 'utf8')) as Partial<LiveBaselineScenario>;
  if (!raw.id || !raw.prompt_version || !raw.output_dir || !raw.description) {
    throw new Error(`Invalid live scenario metadata in ${scenarioPath}`);
  }
  if (!raw.runs?.with_reflection || !raw.runs?.without_reflection) {
    throw new Error(`Invalid live scenario run counts in ${scenarioPath}`);
  }
  if (!raw.dream?.title || !raw.dream?.date || !raw.dream?.content) {
    throw new Error(`Invalid live scenario dream payload in ${scenarioPath}`);
  }

  return raw as LiveBaselineScenario;
}
