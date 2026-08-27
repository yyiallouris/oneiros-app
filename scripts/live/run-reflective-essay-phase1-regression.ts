import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';
import {
  buildEssayCompressionRetryPrompt,
  buildPeriodReflectionSystemPrompt,
  buildPeriodReflectionUserPrompt,
  buildRecentDreamFieldUserPrompt,
  countRenderedEssayWords,
  END_MARKER_DREAM_ESSAY,
  getPeriodEssayLengthPolicy,
  PERIOD_REFLECTION_PROMPT_VERSION,
  RECENT_DREAM_FIELD_LENGTH_POLICY,
  RECENT_DREAM_FIELD_PROMPT_VERSION,
  RECENT_DREAM_FIELD_SYSTEM_PROMPT,
} from '../../src/ai/reflectiveEssayPrompt';
import { buildNarrativeFirstEssayContext } from '../../src/ai/reflectiveEssayContext';

export type Surface = 'period' | 'recent';
export type Scope = 'weekly' | 'monthly' | 'quarterly' | 'recent';

export type Entry = {
  date: string;
  dream_narrative: string;
  core_mode: string;
  affects: string[];
  symbols: string[];
  symbol_stances: string[];
  landscapes: string[];
  motifs: string[];
  relational_dynamics: string[];
  thresholds: string[];
  central_conflicts: string[];
  archetypal_echoes: string[];
  mythic_echoes: string[];
  interpretation_excerpt: string;
};

export type RegressionCase = {
  id: string;
  surface: Surface;
  scope: Scope;
  language: string;
  field_group: string;
  reviewer_focus: string;
  anti_coherence_expectation?: string;
  evidence_anchors: string[];
  forbidden_claims: string[];
  entries: Entry[];
};

export type FixedSet = {
  version: string;
  description: string;
  cases: RegressionCase[];
};

export type VersionLabel = 'v1' | 'v2-phase1' | 'phase1-context-v1' | 'phase2-context-v2' | 'field-map-essay';

export type OutputResult = {
  version: VersionLabel;
  output: string;
  latencyMs: number;
  wordCount: number;
  questionCount: number;
  evidenceAnchorsFound: string[];
  forbiddenClaimsFound: string[];
  repeatedSentencePairs: number;
  authorityHits: string[];
  hardMaximum: number;
  exceedsHardMaximum: boolean;
  compactRetryApplied: boolean;
};

const V1_PERIOD_SYSTEM_PROMPT = `You are Dream Weaver, a post-Jungian dream essayist reviewing a month of dreams.

Your role is to synthesize the month's dream material into a reflective symbolic essay.
You do not diagnose, advise, prescribe, reassure, or make factual claims about the dreamer.
You write hypothetically, but you are allowed to offer a clear symbolic landing when the data supports it.

Core principles:
- Read the dreams as a field, not as isolated events.
- Track recurring images, affects, symbol stances, relational dynamics, thresholds, and central conflicts.
- Do not write as if explaining metadata fields.
- Use extracted fields only to see the dream-field more clearly.
- The essay should feel synthesized from images and movements, not generated from tags.
- Use thresholds and central conflicts as high-value synthesis material only when the data clearly stages crossings or opposing pressures.
- Notice whether the month shows movement, repetition, intensification, retreat, partial integration, contradiction, or unresolved suspension.
- Do not force progress. If the month is cyclical, stalled, fragmented, or contradictory, say so plainly.
- Every major claim must be grounded in at least one concrete recurrence or contrast from the dream data.
- Treat interpretation excerpts as supporting material, but do not simply repeat them.

Style:
- Write like a psychologically precise essay, not a bullet-point analytics report.
- Use vivid, grounded, image-near language.
- Prefer synthesis over listing.
- Avoid generic coaching language, advice, and final-sounding conclusions.
- Keep markdown section headings exactly as specified in English for UI consistency.
- Write body text and reflective questions in the user's requested language.

Essay shape:
## The Month's Dream Field
A short opening that names the dominant atmosphere or organizing movement of the month.

## Recurring Images and Pressures
Synthesize the main repeated symbols, affects, landscapes, and symbol stances. Focus on what the images are doing.

## Thresholds and Conflicts
Optional. Include this section only when crossings, transitions, or conflict pairs are concrete and structurally important.

## Movement Across the Month
Describe whether the dreams move toward coherence, intensification, retreat, partial repair, contradiction, or unresolved suspension.

## What Remains Open
Name the unresolved question or psychic pressure the month seems to leave behind.

## Reflective Questions
Output 1–2 questions, maximum 2. One strong question is complete.

Length:
- If 1 dream: 250–400 words.
- If 2–4 dreams: 450–700 words.
- If 5+ dreams: 650–800 words.

After the complete response, append this exact hidden marker on its own line:
${END_MARKER_DREAM_ESSAY}`;

const V1_RECENT_SYSTEM_PROMPT = `You are Dream Weaver, a post-Jungian dream essayist reviewing the user's latest reflected dreams as a short recent sequence.

Your role is to synthesize what feels currently active in the latest dreams the user has explored.
You do not diagnose, advise, prescribe, reassure, or make factual claims about the dreamer.
You write hypothetically, but you are allowed to offer a clear symbolic landing when the data supports it.

Core principles:
- Read the dreams as a recent sequence, not as a completed calendar period.
- Look for what is currently active, repeating, intensifying, shifting, or unresolved.
- Do not force a monthly narrative or archive-style conclusion.
- Do not summarize each dream one by one.
- Do not simply list recurring tags.
- Use extracted fields only to see the recent dream-field more clearly.
- Stay close to concrete images, affects, symbol stances, thresholds, and tensions.
- Every major claim must be grounded in at least one concrete recurrence, contrast, or sequence detail.
- If the recent sequence is light or only loosely connected, say so plainly and offer a lighter reading.

Style:
- Write like a psychologically precise reflection, not a report.
- Use vivid, grounded, image-near language.
- Prefer synthesis over listing.
- Avoid generic coaching language, advice, and final-sounding conclusions.
- Keep markdown section headings exactly as specified in English for UI consistency.
- Write body text and reflective questions in the user's requested language.

Essay shape:
## Recent Dream Field
## What Keeps Returning
## Current Movement
## What Remains Open
## Reflective Questions

Output 1–2 reflective questions, maximum 2. One strong question is complete.
Length: 350–550 words.

After the complete response, append this exact hidden marker on its own line:
${END_MARKER_DREAM_ESSAY}`;

function loadDotenvValue(key: string): string | undefined {
  const envPath = path.join(process.cwd(), '.env');
  if (!existsSync(envPath)) return undefined;
  const match = readFileSync(envPath, 'utf8').match(new RegExp(`^${key}\\s*=\\s*(.*)$`, 'm'));
  return match?.[1]?.trim().replace(/^['"]|['"]$/g, '');
}

export function getEnv(keys: string[]): string {
  for (const key of keys) {
    const value = process.env[key] ?? loadDotenvValue(key);
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
}

export async function getAccessToken(supabaseUrl: string, anonKey: string): Promise<string> {
  const existing = getEnv(['LIVE_SUPABASE_ACCESS_TOKEN', 'SUPABASE_ACCESS_TOKEN']);
  if (existing) return existing;
  const email = getEnv(['LIVE_SUPABASE_EMAIL']);
  const password = getEnv(['LIVE_SUPABASE_PASSWORD']);
  if (!email || !password) throw new Error('Missing live Supabase credentials.');
  const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: anonKey },
    body: JSON.stringify({ email, password }),
  });
  if (!response.ok) throw new Error(`Supabase auth failed (${response.status}).`);
  const token = (await response.json() as { access_token?: string }).access_token;
  if (!token) throw new Error('Supabase auth succeeded without an access token.');
  return token;
}

function formatContext(entries: Entry[]): string {
  return entries.map((entry, index) => `Dream ${index + 1}
Date: ${entry.date}
Core Mode: ${entry.core_mode || '(not set)'}
Affects: ${entry.affects.join(', ') || '(none)'}
Symbols: ${entry.symbols.join(', ') || '(none)'}
Symbol stances: ${entry.symbol_stances.join('; ') || '(none)'}
Landscapes: ${entry.landscapes.join(', ') || '(none)'}
Motifs: ${entry.motifs.join('; ') || '(none)'}
Relational dynamics: ${entry.relational_dynamics.join('; ') || '(none)'}
Thresholds: ${entry.thresholds.join('; ') || '(none)'}
Central conflicts: ${entry.central_conflicts.join('; ') || '(none)'}
Archetypal Echoes: ${entry.archetypal_echoes.join('; ') || '(none)'}
Mythic Echoes: ${entry.mythic_echoes.join('; ') || '(none)'}
Interpretation excerpt: ${entry.interpretation_excerpt || '(none)'}`).join('\n\n');
}

export function formatNarrativeFirstContext(testCase: RegressionCase): string {
  return buildNarrativeFirstEssayContext(
    testCase.entries.map((entry) => ({
      date: entry.date,
      dreamNarrative: entry.dream_narrative,
      affects: entry.affects,
      symbols: entry.symbols,
      symbolStances: entry.symbol_stances,
      landscapes: entry.landscapes,
      relationalDynamics: entry.relational_dynamics,
      interpretation: entry.interpretation_excerpt,
    })),
    testCase.surface
  );
}

function languageInstruction(language: string): string {
  const languageName = language === 'el' ? 'Greek (Ελληνικά)' : 'English';
  return `Keep all markdown section headings exactly as specified in English for UI consistency. Write all paragraph text, bullets, and reflective questions in ${languageName}. Do not translate section headings.`;
}

function buildV1UserPrompt(testCase: RegressionCase, context: string): string {
  if (testCase.surface === 'recent') {
    return `You are writing a Recent Dream Field reflection.

Scope: latest reflected dreams
Number of interpreted dreams: ${testCase.entries.length}

Dream data:
${context}

Write a symbolic reflection that synthesizes this recent dream sequence. Treat these as the latest dreams the user has explored, not as a completed calendar period. Look for what is active now. Do not summarize each dream one by one or simply list tags. Keep all claims hypothetical and grounded.

${languageInstruction(testCase.language)}`;
  }
  return `You are writing a monthly dream essay.

Period: monthly
Number of interpreted dreams: ${testCase.entries.length}

Dream data:
${context}

Write a symbolic monthly essay that synthesizes the dream field as a whole. Find the field-level pattern through recurring images, pressures, thresholds, conflicts, and movements. Do not summarize each dream one by one or simply list tags. Keep all claims hypothetical and grounded.

${languageInstruction(testCase.language)}`;
}

export function buildMessages(
  testCase: RegressionCase,
  version: VersionLabel,
  contextOverride?: string
) {
  const context = contextOverride ?? (version === 'phase2-context-v2'
    ? formatNarrativeFirstContext(testCase)
    : formatContext(testCase.entries));
  const lang = languageInstruction(testCase.language);
  if (version === 'v1') {
    return [
      { role: 'system', content: testCase.surface === 'period' ? V1_PERIOD_SYSTEM_PROMPT : V1_RECENT_SYSTEM_PROMPT },
      { role: 'user', content: buildV1UserPrompt(testCase, context) },
    ];
  }
  if (testCase.surface === 'period') {
    const scope = testCase.scope === 'quarterly' ? 'quarterly' : testCase.scope === 'weekly' ? 'weekly' : 'monthly';
    return [
      { role: 'system', content: buildPeriodReflectionSystemPrompt(scope, testCase.entries.length) },
      { role: 'user', content: buildPeriodReflectionUserPrompt({ scope, dreamCount: testCase.entries.length, context, languageInstruction: lang }) },
    ];
  }
  return [
    { role: 'system', content: RECENT_DREAM_FIELD_SYSTEM_PROMPT },
    { role: 'user', content: buildRecentDreamFieldUserPrompt({ dreamCount: testCase.entries.length, context, languageInstruction: lang }) },
  ];
}

function extractContent(payload: Record<string, unknown>): string {
  const choice = (payload.choices as Array<{ message?: { content?: string } }> | undefined)?.[0];
  return typeof choice?.message?.content === 'string' ? choice.message.content.trim() : '';
}

function normalizeText(value: string): string {
  return value.toLocaleLowerCase('el').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function sentences(output: string): string[] {
  return output
    .replace(END_MARKER_DREAM_ESSAY, '')
    .split(/(?<=[.!?;])\s+/)
    .map((sentence) => sentence.replace(/^#+\s.*$/gm, '').trim())
    .filter((sentence) => sentence.split(/\s+/).length >= 7);
}

function tokenSet(value: string): Set<string> {
  return new Set(normalizeText(value).match(/[\p{L}\p{N}]+/gu)?.filter((word) => word.length > 3) ?? []);
}

function jaccard(a: Set<string>, b: Set<string>): number {
  const union = new Set([...a, ...b]);
  if (union.size === 0) return 0;
  let intersection = 0;
  for (const item of a) if (b.has(item)) intersection += 1;
  return intersection / union.size;
}

function repeatedSentencePairs(output: string): number {
  const values = sentences(output).map(tokenSet);
  let count = 0;
  for (let left = 0; left < values.length; left += 1) {
    for (let right = left + 1; right < values.length; right += 1) {
      if (jaccard(values[left], values[right]) >= 0.55) count += 1;
    }
  }
  return count;
}

function questionCount(output: string): number {
  const section = output.split(/## Reflective Questions/i)[1] ?? '';
  return (section.match(/[?;]/g) ?? []).length;
}

export function analyze(
  testCase: RegressionCase,
  version: VersionLabel,
  output: string,
  latencyMs: number,
  compactRetryApplied = false
): OutputResult {
  const normalized = normalizeText(output);
  const hardMaximum = testCase.surface === 'recent'
    ? RECENT_DREAM_FIELD_LENGTH_POLICY.hardMaximum
    : getPeriodEssayLengthPolicy(testCase.entries.length).hardMaximum;
  const authorityPatterns = [
    /the psyche (?:wants|needs|is asking|is trying)/gi,
    /your psyche (?:wants|needs|is asking|is trying)/gi,
    /the dream (?:is telling|wants|needs)/gi,
    /η ψυχή σου (?:θέλει|χρειάζεται|ζητά)/gi,
    /το όνειρο (?:σου )?(?:λέει|θέλει|ζητά)/gi,
  ];
  const authorityHits = authorityPatterns.flatMap((pattern) => output.match(pattern) ?? []);
  const evidenceAnchorsFound = testCase.evidence_anchors.filter((anchor) => normalized.includes(normalizeText(anchor)));
  const forbiddenClaimsFound = testCase.forbidden_claims.filter((claim) => normalized.includes(normalizeText(claim)));
  const wordCount = countRenderedEssayWords(output, testCase.language);
  return {
    version,
    output: output.replace(END_MARKER_DREAM_ESSAY, '').trim(),
    latencyMs,
    wordCount,
    questionCount: questionCount(output),
    evidenceAnchorsFound,
    forbiddenClaimsFound,
    repeatedSentencePairs: repeatedSentencePairs(output),
    authorityHits,
    hardMaximum,
    exceedsHardMaximum: wordCount > hardMaximum,
    compactRetryApplied,
  };
}

export async function proxyCall(params: {
  endpoint: string;
  anonKey: string;
  token: string;
  messages: Array<{ role: string; content: string }>;
  temperature: number;
  tokenLimit: number;
}): Promise<string> {
  const response = await fetch(params.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: params.anonKey,
      Authorization: `Bearer ${params.token}`,
    },
    body: JSON.stringify({
      task: 'pattern_insights',
      model: 'gpt-5.4',
      messages: params.messages,
      temperature: params.temperature,
      max_completion_tokens: params.tokenLimit,
    }),
  });
  const raw = await response.text();
  if (!response.ok) throw new Error(`Proxy call failed (${response.status}): ${raw.slice(0, 180)}`);
  const output = extractContent(JSON.parse(raw) as Record<string, unknown>);
  if (!output) throw new Error('Proxy returned no essay content.');
  return output;
}

export async function runFrozenPromptArm(
  testCase: RegressionCase,
  version: Exclude<VersionLabel, 'v1'>,
  auth: { endpoint: string; anonKey: string; token: string },
  contextOverride?: string
): Promise<OutputResult> {
  const startedAt = Date.now();
  const messages = buildMessages(testCase, version, contextOverride);
  const tokenLimit = testCase.surface === 'recent' ? 1400 : 1700;
  let output = await proxyCall({
    ...auth,
    messages,
    temperature: testCase.surface === 'recent' ? 0.46 : 0.48,
    tokenLimit,
  });
  const lengthPolicy = testCase.surface === 'recent'
    ? RECENT_DREAM_FIELD_LENGTH_POLICY
    : getPeriodEssayLengthPolicy(testCase.entries.length);
  const primaryWordCount = countRenderedEssayWords(output, testCase.language);
  const primaryIncomplete = !output.includes(END_MARKER_DREAM_ESSAY);
  const compactRetryApplied = primaryIncomplete || primaryWordCount > lengthPolicy.hardMaximum;
  if (compactRetryApplied) {
    output = await proxyCall({
      ...auth,
      messages: [
        ...messages,
        { role: 'system', content: buildEssayCompressionRetryPrompt(lengthPolicy) },
      ],
      temperature: 0.35,
      tokenLimit: testCase.surface === 'recent' ? 1100 : 1300,
    });
  }
  return analyze(testCase, version, output, Date.now() - startedAt, compactRetryApplied);
}

export function parseJudgeJson(raw: string): Record<string, unknown> {
  const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start < 0 || end <= start) return { parse_error: true, raw: cleaned };
  try {
    return JSON.parse(cleaned.slice(start, end + 1)) as Record<string, unknown>;
  } catch {
    return { parse_error: true, raw: cleaned };
  }
}

async function judgePair(
  testCase: RegressionCase,
  v1: OutputResult,
  v2: OutputResult,
  auth: { endpoint: string; anonKey: string; token: string },
  phase2Experiment = false
): Promise<Record<string, unknown>> {
  const comparisonRule = phase2Experiment
    ? `The candidate_verdict evaluates PHASE 2 CONTEXT-V2 only. Both outputs use the same frozen 2.0.3 prompt, model policy, temperatures, sections, length policy, and retry contract. The only intended variable is metadata-heavy context-v1 versus narrative-first context-v2. Do not reward the candidate merely for including more scene detail; reward improved phenomenological grounding and topology discrimination without loss of coherent-field sensitivity.`
    : `The anti_coherence_verdict evaluates V2 PHASE 1 only. Never use V1's failure to set this verdict; V1 quality affects only its own scores and the winner. Before returning JSON, verify that the v2_topology, v2_topology_preserved flag, v2 scores, verdict, and rationale are mutually consistent. A v2 essay scored 5 for both coherence_restraint and topology_consistency, with a rationale saying it preserves the expected topology, must not receive "fail".`;
  const outputLabels = phase2Experiment
    ? `PHASE 1 BASELINE — CONTEXT V1:\n${v1.output}\n\nPHASE 2 CANDIDATE — NARRATIVE-FIRST CONTEXT V2:\n${v2.output}`
    : `V1 OUTPUT:\n${v1.output}\n\nV2 PHASE 1 OUTPUT:\n${v2.output}`;
  const jsonShape = phase2Experiment
    ? `{"baseline":{"repetition":1,"interpretive_restraint":1,"insight_density":1,"surface_fit":1,"stopping_discipline":1,"coherence_restraint":1,"topology_consistency":1},"candidate":{"repetition":1,"interpretive_restraint":1,"insight_density":1,"surface_fit":1,"stopping_discipline":1,"coherence_restraint":1,"topology_consistency":1},"candidate_topology":"unified|parallel_clusters|loose|inconsistent","candidate_topology_preserved":true,"winner":"baseline|candidate|tie","candidate_verdict":"pass|borderline|fail","rationale":"2-4 concise sentences grounded in the outputs; assess whether narrative-first context improves evidence grounding without changing the earned topology"}`
    : `{"v1":{"repetition":1,"interpretive_restraint":1,"insight_density":1,"surface_fit":1,"stopping_discipline":1,"coherence_restraint":1,"topology_consistency":1},"v2_phase1":{"repetition":1,"interpretive_restraint":1,"insight_density":1,"surface_fit":1,"stopping_discipline":1,"coherence_restraint":1,"topology_consistency":1},"v2_topology":"unified|parallel_clusters|loose|inconsistent","v2_topology_preserved":true,"winner":"v1|v2_phase1|tie","anti_coherence_verdict":"pass|borderline|fail","rationale":"2-4 concise sentences grounded in the outputs; assess V2 as a whole and state whether its opening topology is preserved or contradicted later"}`;
  const verdictRule = phase2Experiment
    ? `candidate_verdict cannot be "pass" when candidate topology_consistency is 3 or lower, or when a loose/parallel opening is contradicted by later synthesis.`
    : `anti_coherence_verdict cannot be "pass" when v2 topology_consistency is 3 or lower, or when a loose/parallel opening is contradicted by later synthesis.`;
  const judgePrompt = `Evaluate two reflective dream essays generated from the same dream material. Do not favor an output because it is newer or shorter.

Score EACH output from 1 (poor) to 5 (excellent) on exactly these criteria:
1. repetition: sections add distinct value instead of restating one insight;
2. interpretive_restraint: claims stay provisional, evidence-grounded, and avoid unsupported waking-life or pathology claims;
3. insight_density: meaningful insight and concrete evidence per paragraph, without inventory or decorative padding;
4. surface_fit: ${testCase.surface === 'recent' ? 'feels like a light current pulse, not a miniature monthly essay' : 'reads as period-level synthesis and treats movement across time honestly'};
5. stopping_discipline: stops after saying something substantial instead of filling available budget;
6. coherence_restraint: discriminates correctly. It does not manufacture one elegant gestalt, developmental arc, or hidden unity when the supplied field is loose, split, contradictory, or better described as multiple clusters; but it still names a coherent field clearly when concrete cross-dream evidence earns it. Explicitly naming insufficient density or multiple weak relations is a mature success when the case expects looseness, not a universal preference.
7. topology_consistency: evaluate the essay as a whole. If it initially denies a unified field but later reconstructs one through a shared stance, master abstraction, developmental movement, common scale, or common mode of response without new concrete cross-dream evidence, score this as over-coherence. An explicit disclaimer does not compensate for contradictory synthesis later in the essay. Unified, parallel-cluster, and loose readings must each remain internally consistent through the final section and reflective questions.

Verdict rule: ${verdictRule} Do not reward an opening disclaimer if the body, movement section, open question, or reflective questions rebuild one field.

${comparisonRule}

Reviewer focus: ${testCase.reviewer_focus}
Anti-coherence expectation: ${testCase.anti_coherence_expectation ?? 'Do not reward synthesis that is more coherent than the supplied field.'}
Expected evidence anchors: ${testCase.evidence_anchors.join(', ')}
Explicitly forbidden unsupported claims: ${testCase.forbidden_claims.join(', ')}

${outputLabels}

Return JSON only with this exact shape:
${jsonShape}`;
  const raw = await proxyCall({
    ...auth,
    messages: [
      { role: 'system', content: 'You are a strict editorial evaluator. Return valid JSON only. Never rewrite the essays.' },
      { role: 'user', content: judgePrompt },
    ],
    temperature: 0,
    tokenLimit: 900,
  });
  return parseJudgeJson(raw);
}

function markdownReport(params: {
  fixedSet: FixedSet;
  generatedAt: string;
  phase2Experiment: boolean;
  results: Array<{ testCase: RegressionCase; v1: OutputResult; v2: OutputResult; judge: Record<string, unknown> }>;
}): string {
  const baselineLabel = params.phase2Experiment ? 'Phase 1 context v1' : 'v1';
  const candidateLabel = params.phase2Experiment ? 'Phase 2 context v2' : 'v2 Phase 1';
  const lines = [
    params.phase2Experiment
      ? '# Reflective Essays Phase 2 — Narrative-First Context Regression'
      : '# Reflective Essays Phase 1 — Fixed-Set v1/v2 Regression',
    '',
    `Generated: ${params.generatedAt}`,
    '',
    `Fixed set: \`${params.fixedSet.version}\``,
    '',
    params.fixedSet.description,
    '',
    params.phase2Experiment
      ? `Frozen prompt versions in both arms: Period \`${PERIOD_REFLECTION_PROMPT_VERSION}\` / Recent \`${RECENT_DREAM_FIELD_PROMPT_VERSION}\`; context v1 baseline vs context v2 candidate`
      : `Prompt versions: v1 frozen baseline vs Period \`${PERIOD_REFLECTION_PROMPT_VERSION}\` / Recent \`${RECENT_DREAM_FIELD_PROMPT_VERSION}\``,
    '',
    params.phase2Experiment
      ? '> This is a pre-rollout Phase 2 evaluation artifact. It does not approve production deployment.'
      : '> This is a pre-rollout evaluation artifact. It does not approve Phase 2 or production deployment.',
    '',
  ];
  for (const result of params.results) {
    lines.push(
      `## ${result.testCase.id}`,
      '',
      `Surface: ${result.testCase.surface}; language: ${result.testCase.language}; reviewer focus: ${result.testCase.reviewer_focus}`,
      '',
      `Anti-coherence expectation: ${result.testCase.anti_coherence_expectation ?? 'Do not manufacture a stronger unity than the field supports.'}`,
      '',
      '### Automated measurements',
      '',
      '| Version | Words | Hard max | Overflow | Compact retry | Questions | Anchors | Forbidden claims | Authority hits | Repeated sentence pairs |',
      '|---|---:|---:|---|---|---:|---|---|---:|---:|',
      `| ${baselineLabel} | ${result.v1.wordCount} | ${result.v1.hardMaximum} | ${result.v1.exceedsHardMaximum} | ${result.v1.compactRetryApplied} | ${result.v1.questionCount} | ${result.v1.evidenceAnchorsFound.join(', ') || '—'} | ${result.v1.forbiddenClaimsFound.join(', ') || '—'} | ${result.v1.authorityHits.length} | ${result.v1.repeatedSentencePairs} |`,
      `| ${candidateLabel} | ${result.v2.wordCount} | ${result.v2.hardMaximum} | ${result.v2.exceedsHardMaximum} | ${result.v2.compactRetryApplied} | ${result.v2.questionCount} | ${result.v2.evidenceAnchorsFound.join(', ') || '—'} | ${result.v2.forbiddenClaimsFound.join(', ') || '—'} | ${result.v2.authorityHits.length} | ${result.v2.repeatedSentencePairs} |`,
      '',
      '### Editorial scorecard',
      '',
      '```json',
      JSON.stringify(result.judge, null, 2),
      '```',
      '',
      `### ${baselineLabel} output`,
      '',
      result.v1.output,
      '',
      `### ${candidateLabel} output`,
      '',
      result.v2.output,
      ''
    );
  }
  return `${lines.join('\n')}\n`;
}

async function main() {
  const phase2Experiment = getEnv(['REFLECTIVE_ESSAY_CONTEXT_EXPERIMENT']) === 'phase2';
  const requestedFixture = getEnv(['REFLECTIVE_ESSAY_FIXTURE']);
  const fixturePath = requestedFixture
    ? path.resolve(process.cwd(), requestedFixture)
    : path.join(process.cwd(), 'testing/live-scenarios/reflective-essays-phase1-fixed-set.v1.json');
  const fixedSet = JSON.parse(readFileSync(fixturePath, 'utf8')) as FixedSet;
  const supabaseUrl = getEnv(['EXPO_PUBLIC_SUPABASE_URL', 'SUPABASE_URL']).replace(/\/$/, '');
  const anonKey = getEnv(['EXPO_PUBLIC_SUPABASE_ANON_KEY', 'SUPABASE_ANON_KEY']);
  const endpoint = getEnv(['EXPO_PUBLIC_CUSTOM_GPT_ENDPOINT', 'CUSTOM_GPT_ENDPOINT']);
  if (!supabaseUrl || !anonKey || !endpoint) throw new Error('Missing Supabase URL, anon key, or proxy endpoint.');
  const token = await getAccessToken(supabaseUrl, anonKey);
  const auth = { endpoint, anonKey, token };
  const results: Array<{ testCase: RegressionCase; v1: OutputResult; v2: OutputResult; judge: Record<string, unknown> }> = [];

  for (const testCase of fixedSet.cases) {
    if (phase2Experiment) {
      const baseline = await runFrozenPromptArm(testCase, 'phase1-context-v1', auth);
      const candidate = await runFrozenPromptArm(testCase, 'phase2-context-v2', auth);
      const judge = await judgePair(testCase, baseline, candidate, auth, true);
      results.push({ testCase, v1: baseline, v2: candidate, judge });
      process.stdout.write(`completed ${testCase.id}\n`);
      continue;
    }

    const tokenLimit = testCase.surface === 'recent' ? 1400 : 1700;
    const v1Start = Date.now();
    const v1Output = await proxyCall({
      ...auth,
      messages: buildMessages(testCase, 'v1'),
      temperature: testCase.surface === 'recent' ? 0.46 : 0.48,
      tokenLimit,
    });
    const v1 = analyze(testCase, 'v1', v1Output, Date.now() - v1Start);

    const v2 = await runFrozenPromptArm(testCase, 'v2-phase1', auth);
    const judge = await judgePair(testCase, v1, v2, auth);
    results.push({ testCase, v1, v2, judge });
    process.stdout.write(`completed ${testCase.id}\n`);
  }

  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const fixtureLabel = path.basename(fixturePath, path.extname(fixturePath))
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .slice(0, 80);
  const experimentLabel = phase2Experiment ? 'phase2-context' : 'phase1-prompt';
  const outputDir = path.join(process.cwd(), 'tmp', `reflective-essay-${experimentLabel}-${fixtureLabel}-${stamp}`);
  mkdirSync(outputDir, { recursive: true });
  const generatedAt = new Date().toISOString();
  writeFileSync(path.join(outputDir, 'results.json'), JSON.stringify({ generatedAt, phase2Experiment, fixedSet, results }, null, 2));
  writeFileSync(
    path.join(outputDir, 'REVIEW.md'),
    markdownReport({ fixedSet, generatedAt, phase2Experiment, results })
  );
  process.stdout.write(`${outputDir}\n`);
}

if (require.main === module) {
  main().catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  });
}
