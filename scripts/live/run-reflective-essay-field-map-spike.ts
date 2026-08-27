import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';
import {
  buildFieldMapBoundEssayContext,
  buildReflectiveEssayFieldMapMessages,
  parseReflectiveEssayFieldMap,
  REFLECTIVE_ESSAY_FIELD_MAP_PROMPT_ID,
  REFLECTIVE_ESSAY_FIELD_MAP_PROMPT_VERSION,
  REFLECTIVE_ESSAY_FIELD_MAP_SCHEMA_VERSION,
  REFLECTIVE_ESSAY_FIELD_MAP_TEMPERATURE,
  ReflectiveEssayFieldMap,
  validateReflectiveEssayFieldMap,
} from '../../src/ai/reflectiveEssayFieldMapSpike';
import {
  FixedSet,
  getAccessToken,
  getEnv,
  OutputResult,
  parseJudgeJson,
  proxyCall,
  RegressionCase,
  runFrozenPromptArm,
  formatNarrativeFirstContext,
} from './run-reflective-essay-phase1-regression';

type Auth = { endpoint: string; anonKey: string; token: string };

type Phase2BaselinePacket = {
  results: Array<{
    testCase: RegressionCase;
    v2: OutputResult;
  }>;
};

type SpikeResult = {
  status: 'completed';
  testCase: RegressionCase;
  baseline: OutputResult;
  fieldMapRaw: string;
  fieldMap: ReflectiveEssayFieldMap;
  candidate: OutputResult;
  judge: Record<string, unknown>;
};

type SpikeFailure = {
  status: 'failed';
  testCase: RegressionCase;
  baseline: OutputResult;
  error: string;
};

type SpikeCaseResult = SpikeResult | SpikeFailure;

function toNarrativeEntries(testCase: RegressionCase) {
  return testCase.entries.map((entry) => ({
    date: entry.date,
    dreamNarrative: entry.dream_narrative,
    affects: entry.affects,
    symbols: entry.symbols,
    symbolStances: entry.symbol_stances,
    landscapes: entry.landscapes,
    relationalDynamics: entry.relational_dynamics,
    interpretation: entry.interpretation_excerpt,
  }));
}

function loadBaseline(pathname: string): Map<string, OutputResult> {
  const packet = JSON.parse(readFileSync(pathname, 'utf8')) as Phase2BaselinePacket;
  return new Map(packet.results.map((result) => [result.testCase.id, result.v2]));
}

async function generateFieldMap(testCase: RegressionCase, auth: Auth): Promise<{
  raw: string;
  value: ReflectiveEssayFieldMap;
}> {
  const raw = await proxyCall({
    ...auth,
    messages: buildReflectiveEssayFieldMapMessages({
      entries: toNarrativeEntries(testCase),
      surface: testCase.surface,
    }),
    temperature: REFLECTIVE_ESSAY_FIELD_MAP_TEMPERATURE,
    tokenLimit: 1400,
  });
  const validation = validateReflectiveEssayFieldMap(
    parseReflectiveEssayFieldMap(raw),
    testCase.entries.length
  );
  if (!validation.ok) {
    throw new Error(`Invalid Field Map for ${testCase.id}: ${validation.errors.join('; ')}\n${raw}`);
  }
  return { raw, value: validation.value };
}

async function judgeSpike(
  result: Omit<SpikeResult, 'judge'>,
  auth: Auth
): Promise<Record<string, unknown>> {
  const { testCase, baseline, fieldMap, candidate } = result;
  const prompt = `Evaluate an architecture spike for reflective dream essays.

Both essays use the identical frozen 2.0.3 essay prompt, model policy, temperatures, sections, length policy, retry contract, and narrative-first context v2. The only new variable is a structured Field Map pre-pass that binds topology and evidence before composition.

The goal is discrimination, not lower interpretive ambition. A coherent field should remain clearly coherent. Loose material should not acquire an umbrella unity. Parallel clusters should not be joined by a master abstraction. Weak atmospheric affinity may be acknowledged when it is not promoted into a structural or developmental thesis.

Score baseline and candidate from 1 (poor) to 5 (excellent) on:
1. repetition;
2. interpretive_restraint;
3. insight_density;
4. surface_fit;
5. stopping_discipline;
6. coherence_restraint;
7. topology_consistency.

Also score:
- field_map_accuracy: whether the map faithfully classifies the supplied dreams and distinguishes concrete recurrence from interpretive glue;
- map_fidelity: whether the candidate preserves the map through every section and reflective question, without adding an unsupported bridge or temporal movement.

architecture_gate must be "pass" only when the map is accurate, the candidate preserves it throughout, and essay quality is not materially degraded relative to the baseline. A disclaimer followed by an umbrella thesis is a failure.

Reviewer focus: ${testCase.reviewer_focus}
Topology expectation: ${testCase.anti_coherence_expectation ?? 'Preserve the strongest evidence-earned organization without manufacturing a stronger one.'}
Evidence anchors: ${testCase.evidence_anchors.join(', ')}
Forbidden unsupported claims: ${testCase.forbidden_claims.join(', ')}

FIELD MAP:
${JSON.stringify(fieldMap, null, 2)}

PHASE 2 BASELINE — DIRECT NARRATIVE TO ESSAY:
${baseline.output}

FIELD-MAP CANDIDATE — MAP-BOUND NARRATIVE TO ESSAY:
${candidate.output}

Return JSON only with this exact shape:
{"baseline":{"repetition":1,"interpretive_restraint":1,"insight_density":1,"surface_fit":1,"stopping_discipline":1,"coherence_restraint":1,"topology_consistency":1},"candidate":{"repetition":1,"interpretive_restraint":1,"insight_density":1,"surface_fit":1,"stopping_discipline":1,"coherence_restraint":1,"topology_consistency":1,"map_fidelity":1},"field_map_accuracy":1,"candidate_topology":"unified|parallel_clusters|loose|inconsistent","candidate_topology_preserved":true,"winner":"baseline|candidate|tie","candidate_verdict":"pass|borderline|fail","architecture_gate":"pass|fail","rationale":"2-4 concise sentences grounded in the map and outputs"}`;
  const raw = await proxyCall({
    ...auth,
    messages: [
      { role: 'system', content: 'You are a strict architecture evaluator. Return valid JSON only. Never rewrite the map or essays.' },
      { role: 'user', content: prompt },
    ],
    temperature: 0,
    tokenLimit: 1000,
  });
  return parseJudgeJson(raw);
}

function markdownReport(params: {
  fixedSet: FixedSet;
  generatedAt: string;
  baselinePath: string;
  results: SpikeCaseResult[];
}): string {
  const lines = [
    '# Reflective Essays — Field Map Architecture Spike',
    '',
    `Generated: ${params.generatedAt}`,
    '',
    `Fixed set: \`${params.fixedSet.version}\``,
    '',
    `Reused Phase 2 baseline packet: \`${params.baselinePath}\``,
    '',
    `Evaluation-only Field Map: \`${REFLECTIVE_ESSAY_FIELD_MAP_PROMPT_ID}\` \`${REFLECTIVE_ESSAY_FIELD_MAP_PROMPT_VERSION}\`; schema \`${REFLECTIVE_ESSAY_FIELD_MAP_SCHEMA_VERSION}\``,
    '',
    '> This is an offline architecture spike. It does not approve production rollout or change the frozen 2.0.3 essay prompt.',
    '',
  ];
  for (const result of params.results) {
    if (result.status === 'failed') {
      lines.push(
        `## ${result.testCase.id}`,
        '',
        '**Architecture gate: FAIL — the Field Map pass did not produce a valid map.**',
        '',
        '```text',
        result.error,
        '```',
        ''
      );
      continue;
    }
    lines.push(
      `## ${result.testCase.id}`,
      '',
      `Surface: ${result.testCase.surface}; language: ${result.testCase.language}; reviewer focus: ${result.testCase.reviewer_focus}`,
      '',
      `Topology expectation: ${result.testCase.anti_coherence_expectation ?? 'Preserve evidence-earned organization.'}`,
      '',
      '### Field Map',
      '',
      '```json',
      JSON.stringify(result.fieldMap, null, 2),
      '```',
      '',
      '### Automated measurements',
      '',
      '| Version | Words | Hard max | Overflow | Compact retry | Questions | Anchors | Forbidden claims | Authority hits | Repeated sentence pairs |',
      '|---|---:|---:|---|---|---:|---|---|---:|---:|',
      `| Phase 2 direct baseline | ${result.baseline.wordCount} | ${result.baseline.hardMaximum} | ${result.baseline.exceedsHardMaximum} | ${result.baseline.compactRetryApplied} | ${result.baseline.questionCount} | ${result.baseline.evidenceAnchorsFound.join(', ') || '—'} | ${result.baseline.forbiddenClaimsFound.join(', ') || '—'} | ${result.baseline.authorityHits.length} | ${result.baseline.repeatedSentencePairs} |`,
      `| Field Map → essay | ${result.candidate.wordCount} | ${result.candidate.hardMaximum} | ${result.candidate.exceedsHardMaximum} | ${result.candidate.compactRetryApplied} | ${result.candidate.questionCount} | ${result.candidate.evidenceAnchorsFound.join(', ') || '—'} | ${result.candidate.forbiddenClaimsFound.join(', ') || '—'} | ${result.candidate.authorityHits.length} | ${result.candidate.repeatedSentencePairs} |`,
      '',
      '### Architecture scorecard',
      '',
      '```json',
      JSON.stringify(result.judge, null, 2),
      '```',
      '',
      '### Phase 2 direct baseline',
      '',
      result.baseline.output,
      '',
      '### Field Map → essay candidate',
      '',
      result.candidate.output,
      ''
    );
  }
  return `${lines.join('\n')}\n`;
}

async function main() {
  const requestedFixture = getEnv(['REFLECTIVE_ESSAY_FIXTURE']);
  const fixturePath = requestedFixture
    ? path.resolve(process.cwd(), requestedFixture)
    : path.join(process.cwd(), 'testing/live-scenarios/reflective-essays-phase1-fixed-set.v1.json');
  const fixedSet = JSON.parse(readFileSync(fixturePath, 'utf8')) as FixedSet;
  const requestedBaseline = getEnv(['REFLECTIVE_ESSAY_PHASE2_BASELINE_RESULTS']);
  if (!requestedBaseline) throw new Error('Missing REFLECTIVE_ESSAY_PHASE2_BASELINE_RESULTS. Reuse a frozen Phase 2 results.json packet.');
  const baselinePath = path.resolve(process.cwd(), requestedBaseline);
  if (!existsSync(baselinePath)) throw new Error(`Phase 2 baseline packet not found: ${baselinePath}`);
  const baselines = loadBaseline(baselinePath);

  const supabaseUrl = getEnv(['EXPO_PUBLIC_SUPABASE_URL', 'SUPABASE_URL']).replace(/\/$/, '');
  const anonKey = getEnv(['EXPO_PUBLIC_SUPABASE_ANON_KEY', 'SUPABASE_ANON_KEY']);
  const endpoint = getEnv(['EXPO_PUBLIC_CUSTOM_GPT_ENDPOINT', 'CUSTOM_GPT_ENDPOINT']);
  if (!supabaseUrl || !anonKey || !endpoint) throw new Error('Missing Supabase URL, anon key, or proxy endpoint.');
  const token = await getAccessToken(supabaseUrl, anonKey);
  const auth = { endpoint, anonKey, token };
  const concurrency = Math.max(1, Number.parseInt(getEnv(['REFLECTIVE_ESSAY_CONCURRENCY']) || '3', 10));
  const runCase = async (testCase: RegressionCase): Promise<SpikeCaseResult> => {
    const baseline = baselines.get(testCase.id);
    if (!baseline) throw new Error(`Baseline packet has no Phase 2 output for ${testCase.id}.`);
    try {
      const generatedMap = await generateFieldMap(testCase, auth);
      const narrativeContext = formatNarrativeFirstContext(testCase);
      const boundContext = buildFieldMapBoundEssayContext(generatedMap.value, narrativeContext);
      const candidate = await runFrozenPromptArm(testCase, 'field-map-essay', auth, boundContext);
      const withoutJudge = {
        status: 'completed' as const,
        testCase,
        baseline,
        fieldMapRaw: generatedMap.raw,
        fieldMap: generatedMap.value,
        candidate,
      };
      const judge = await judgeSpike(withoutJudge, auth);
      process.stdout.write(`completed ${testCase.id}: ${generatedMap.value.topology} / ${String(judge.architecture_gate)}\n`);
      return { ...withoutJudge, judge };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      process.stdout.write(`failed ${testCase.id}: ${message.split('\n')[0]}\n`);
      return { status: 'failed', testCase, baseline, error: message };
    }
  };

  const results: SpikeCaseResult[] = [];
  for (let index = 0; index < fixedSet.cases.length; index += concurrency) {
    const batch = fixedSet.cases.slice(index, index + concurrency);
    results.push(...await Promise.all(batch.map(runCase)));
  }

  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const fixtureLabel = path.basename(fixturePath, path.extname(fixturePath))
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .slice(0, 80);
  const outputDir = path.join(process.cwd(), 'tmp', `reflective-essay-field-map-${fixtureLabel}-${stamp}`);
  mkdirSync(outputDir, { recursive: true });
  const generatedAt = new Date().toISOString();
  writeFileSync(path.join(outputDir, 'results.json'), JSON.stringify({
    generatedAt,
    baselinePath,
    fieldMapPrompt: {
      id: REFLECTIVE_ESSAY_FIELD_MAP_PROMPT_ID,
      version: REFLECTIVE_ESSAY_FIELD_MAP_PROMPT_VERSION,
      schemaVersion: REFLECTIVE_ESSAY_FIELD_MAP_SCHEMA_VERSION,
      temperature: REFLECTIVE_ESSAY_FIELD_MAP_TEMPERATURE,
    },
    fixedSet,
    results,
  }, null, 2));
  writeFileSync(path.join(outputDir, 'REVIEW.md'), markdownReport({ fixedSet, generatedAt, baselinePath, results }));
  process.stdout.write(`${outputDir}\n`);
}

if (require.main === module) {
  main().catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  });
}
