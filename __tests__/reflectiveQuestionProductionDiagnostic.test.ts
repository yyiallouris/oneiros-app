import { createHash } from 'crypto';
import { readFileSync } from 'fs';
import path from 'path';

const repo = path.resolve(__dirname, '..');
const fixturePath = path.join(
  repo,
  'testing',
  'reflective-questions',
  'v1.0.1-production-diagnostic-30.json'
);
const runnerPath = path.join(
  repo,
  'scripts',
  'live',
  'reflective-questions',
  'run-v101-production-diagnostic.ts'
);
const recoveryPath = path.join(
  repo,
  'scripts',
  'live',
  'reflective-questions',
  'recover-v101-production-diagnostic.mjs'
);
const artifactPath = path.join(
  repo,
  'testing',
  'reflective-questions',
  'artifacts',
  'v1.0.1-production-diagnostic-2026-08-29',
  'RAW_RESULTS.json'
);
const analysisPath = path.join(path.dirname(artifactPath), 'ANALYSIS_SUMMARY.json');

type FixtureCase = {
  id: string;
  mode: 'quick' | 'standard' | 'advanced';
  language: string;
  language_group: 'english' | 'greek' | 'other';
  trajectory: { open_user_turn: string; closing_user_turn: string } | null;
};

describe('v1.0.1 production diagnostic benchmark', () => {
  const fixtureRaw = readFileSync(fixturePath);
  const fixture = JSON.parse(fixtureRaw.toString('utf8')) as {
    source: string;
    dream_date: string;
    production_identity: { method_id: string; bundle_sha256: string };
    trajectory_contract: { synthetic_interpretation_chat_replies_limit: number };
    cases: FixtureCase[];
  };
  const runner = readFileSync(runnerPath, 'utf8');
  const recovery = readFileSync(recoveryPath, 'utf8');

  it('freezes the exact approved identity and immutable fixture hash', () => {
    expect(createHash('sha256').update(fixtureRaw).digest('hex')).toBe(
      '5e821d2578e5e0f7e688b20b16755b56cabe73590d361429dbff9a0c2af7bbcc'
    );
    expect(fixture.production_identity).toMatchObject({
      method_id: 'oneiros-same-call-reflective-questions-v1.0.1',
      bundle_sha256: 'e7e4ea4b8bfbb253912771f163f692980bbc677f051c72df4b49e5034f6fe8c7',
    });
    expect(fixture.source).toBe('synthetic');
    expect(fixture.dream_date).toBe('2026-08-29');
  });

  it('balances 30 readers and 12 fixed open-to-closing trajectories', () => {
    expect(fixture.cases).toHaveLength(30);
    expect(new Set(fixture.cases.map((entry) => entry.id)).size).toBe(30);
    for (const mode of ['quick', 'standard', 'advanced']) {
      expect(fixture.cases.filter((entry) => entry.mode === mode)).toHaveLength(10);
    }
    for (const group of ['english', 'greek', 'other']) {
      expect(fixture.cases.filter((entry) => entry.language_group === group)).toHaveLength(10);
    }
    expect(fixture.cases.filter((entry) => entry.language === 'en')).toHaveLength(10);
    expect(fixture.cases.filter((entry) => entry.language === 'el')).toHaveLength(10);
    const otherLanguages = fixture.cases
      .filter((entry) => entry.language_group === 'other')
      .map((entry) => entry.language)
      .sort();
    expect(otherLanguages).toEqual(['de', 'es', 'fr', 'it', 'ja', 'nl', 'pl', 'pt', 'ru', 'zh']);

    const trajectories = fixture.cases.filter((entry) => entry.trajectory);
    expect(trajectories).toHaveLength(12);
    for (const mode of ['quick', 'standard', 'advanced']) {
      expect(trajectories.filter((entry) => entry.mode === mode)).toHaveLength(4);
    }
    for (const group of ['english', 'greek', 'other']) {
      expect(trajectories.filter((entry) => entry.language_group === group)).toHaveLength(4);
    }
    expect(fixture.trajectory_contract.synthetic_interpretation_chat_replies_limit).toBe(2);
  });

  it('preserves full evidence and forbids closed R&D or contract retries', () => {
    expect(runner).toMatch(/output: string/);
    expect(runner).toMatch(/contract_validation/);
    expect(runner).toMatch(/issue_codes/);
    expect(runner).toMatch(/first_partial_ms/);
    expect(runner).toMatch(/estimated_cost_usd/);
    expect(runner).toMatch(/provider_api_error/);
    expect(runner).toMatch(/transport_retry_count/);
    expect(runner).toMatch(/contract_retry_count: 0/);
    expect(runner).toMatch(/question_only_call_count: 0/);
    expect(runner).not.toMatch(/reflectiveQuestionPipeline/);
    expect(runner).not.toMatch(/questionIntegrityGate/);
    expect(runner).not.toMatch(/questionRepair/);
    expect(runner).not.toMatch(/questionPremiseCheck/);
    expect(runner).not.toMatch(/reflectiveQuestionComposer/);
  });

  it('freezes the completed 54-generation evidence below the approved cost cap', () => {
    const artifact = JSON.parse(readFileSync(artifactPath, 'utf8')) as {
      fixture_sha256: string;
      generations: Array<{
        output: string;
        contract_validation: unknown;
        estimated_cost_usd: number;
        contract_retry_count: number;
        question_only_call_count: number;
      }>;
    };
    const analysis = JSON.parse(readFileSync(analysisPath, 'utf8')) as {
      exact_total_cost_usd: number;
      generation_count: number;
      generation_model_retries: number;
      reader_generations_rerun_during_recovery: number;
      open_generations_rerun_during_recovery: number;
    };
    expect(artifact.fixture_sha256).toBe(
      '5e821d2578e5e0f7e688b20b16755b56cabe73590d361429dbff9a0c2af7bbcc'
    );
    expect(artifact.generations).toHaveLength(54);
    expect(artifact.generations.every((entry) => entry.output && entry.contract_validation)).toBe(true);
    expect(artifact.generations.every((entry) => entry.contract_retry_count === 0)).toBe(true);
    expect(artifact.generations.every((entry) => entry.question_only_call_count === 0)).toBe(true);
    expect(analysis).toMatchObject({
      generation_count: 54,
      exact_total_cost_usd: 0.42161125,
      generation_model_retries: 0,
      reader_generations_rerun_during_recovery: 0,
      open_generations_rerun_during_recovery: 0,
    });
    expect(analysis.exact_total_cost_usd).toBeLessThan(3);
  });

  it('keeps recovery one-way: no Reader or open model generation', () => {
    expect(recovery).not.toMatch(/dream_reflection_generate/);
    expect(recovery).toMatch(/reader_generations_rerun: 0/);
    expect(recovery).toMatch(/open_generations_rerun: 0/);
    expect(recovery).toMatch(/closing_generations_started/);
  });
});
