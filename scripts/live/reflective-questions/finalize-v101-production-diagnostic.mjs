/** Finalize the frozen v1.0.1 diagnostic into durable, reviewable artifacts. */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const RUN_ID = 'oneiros-v101-production-diagnostic-2026-08-29T14-59-46-903Z';
const FIXTURE_SHA = '5e821d2578e5e0f7e688b20b16755b56cabe73590d361429dbff9a0c2af7bbcc';
const RUN_DIR = path.join(process.cwd(), 'tmp', RUN_ID);
const ARTIFACT_DIR = path.join(
  process.cwd(),
  'testing',
  'reflective-questions',
  'artifacts',
  'v1.0.1-production-diagnostic-2026-08-29'
);
const REPORT_PATH = path.join(
  process.cwd(),
  'docs',
  'ONEIROS_V101_PRODUCTION_DIAGNOSTIC_BASELINE_2026-08-29.md'
);

const editorial = {
  'en-q-sparse-key:reading_quick': ['harmless_structural_flag', 'Generic no-language menu pass matched the English word “of”; the question offers no answer menu.'],
  'en-s-ancestor-coat:reading_standard': ['noticeable_but_acceptable', 'The first question offers several sensory adjectives, but explicitly leaves room for another description.'],
  'en-s-conflict-bridge:chat_followup': ['harmless_structural_flag', 'Generic no-language menu pass matched “of”; the open question does not offer selectable answers.'],
  'en-s-conflict-bridge:reading_standard': ['noticeable_but_acceptable', 'The first question supplies a four-item frame; it remains dream-grounded but is more leading than ideal.'],
  'en-a-surreal-whale-library:reading_advanced': ['harmless_structural_flag', 'Generic no-language menu pass matched “of”; neither question contains an answer menu.'],
  'en-a-complex-city-tide:reading_advanced': ['harmless_structural_flag', 'Generic no-language menu pass matched “of”; neither question contains an answer menu.'],
  'en-a-ambiguous-mirror-bird:reading_advanced': ['harmless_structural_flag', 'Generic no-language menu pass matched “of”; the “neither … nor” phrase describes the image rather than offering answers.'],
  'el-q-relational-brother:chat_followup': ['real_oneiros_quality_problem', 'The open turn ends with a binary either/or choice between the hand and the silence.'],
  'el-s-grief-mother-scarf:reading_standard': ['harmless_structural_flag', 'The Greek disjunction describes absent gaze or speech; it does not present user answer options.'],
  'el-s-body-bark:reading_standard': ['noticeable_but_acceptable', 'The first question supplies several bodily adjectives plus an open escape hatch.'],
  'el-s-threshold-station:reading_standard': ['harmless_structural_flag', 'The Greek disjunction contrasts time or place inside the image; it is not an answer menu.'],
  'el-s-conflict-house:reading_standard': ['noticeable_but_acceptable', 'The first question offers three embodied frames; an extra rhetorical question in the prose also triggered whole-output punctuation counting.'],
  'el-a-surreal-moon-kitchen:chat_followup': ['real_oneiros_quality_problem', 'The open turn directly offers three candidate attributes of the pomegranate.'],
  'el-a-complex-hospital:reading_advanced': ['noticeable_but_acceptable', 'The first question supplies four bodily qualities; it is leading but still tied to the dream scene.'],
  'el-a-ancestor-olive-door:reading_advanced': ['noticeable_but_acceptable', 'The first question supplies four bodily positions; it remains usable but narrows discovery.'],
  'es-q-relational-balcony:chat_followup': ['real_oneiros_quality_problem', 'The open turn presents a direct binary choice between watering and holding the pot.'],
  'it-s-grief-letter:reading_standard': ['noticeable_but_acceptable', 'The first question presents a five-item bodily-state list, though one option remains broadly open.'],
  'pt-s-body-feathers:chat_followup_close': ['harmless_structural_flag', 'The short closing is clearly Portuguese and contains zero questions; the language detector returned unknown.'],
  'nl-s-restorative-bakery:reading_standard': ['noticeable_but_acceptable', 'The first question offers four possible feelings plus an open alternative.'],
  'pl-a-conflict-stairs:chat_followup': ['real_oneiros_quality_problem', 'The open turn is explicitly binary: leaving versus becoming recognized.'],
  'pl-a-conflict-stairs:chat_followup_close': ['harmless_structural_flag', 'The short closing is clearly Polish and contains zero questions; the language detector returned unknown.'],
  'pl-a-conflict-stairs:reading_advanced': ['noticeable_but_acceptable', 'The first question offers two states plus an open alternative.'],
  'ru-a-surreal-theater:reading_advanced': ['noticeable_but_acceptable', 'The first question gives three bodily actions as candidate answers.'],
  'ja-a-complex-snow-train:reading_advanced': ['harmless_structural_flag', 'Both Japanese bullets are grammatical questions ending in か。; the validator requires an explicit question mark glyph.'],
  'zh-a-ambiguous-ancestor-river:reading_advanced': ['noticeable_but_acceptable', 'The first question offers four bodily reactions; it is somewhat leading but remains scene-specific.'],
};

const passSampleIds = new Set([
  'en-q-restorative-garden:reading_quick',
  'en-s-body-glass-hands:reading_standard',
  'el-a-surreal-moon-kitchen:reading_advanced',
  'fr-q-sparse-bell:reading_quick',
  'de-q-threshold-forest:chat_followup',
  'pt-s-body-feathers:reading_standard',
  'en-a-complex-city-tide:chat_followup',
  'el-a-ancestor-olive-door:chat_followup',
  'es-q-relational-balcony:reading_quick',
  'en-q-restorative-garden:chat_followup_close',
  'el-s-body-bark:chat_followup_close',
  'de-q-threshold-forest:chat_followup_close',
]);

function countBy(values, key) {
  return values.reduce((result, value) => {
    const group = key(value);
    result[group] = (result[group] ?? 0) + 1;
    return result;
  }, {});
}

function percentile(values, fraction) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.max(0, Math.ceil(sorted.length * fraction) - 1)];
}

function percent(value, total) {
  return total ? `${(value / total * 100).toFixed(1)}%` : 'n/a';
}

function money(value) {
  return `$${value.toFixed(8)}`;
}

function classify(entry) {
  if (entry.contract_validation?.passed === false) return editorial[entry.generation_id];
  if (passSampleIds.has(entry.generation_id)) {
    return ['representative_pass_reviewed', 'Human spot-check found no missed cardinality, language, closing, or answer-menu defect.'];
  }
  return ['not_selected_for_human_pass_sample', 'Mechanical PASS; not part of the predefined representative PASS sample.'];
}

function tableRows(map) {
  return Object.entries(map).sort().map(([key, value]) => `| ${key} | ${value} |`).join('\n');
}

function main() {
  const raw = JSON.parse(readFileSync(path.join(RUN_DIR, 'RAW_RESULTS.json'), 'utf8'));
  const recovery = JSON.parse(readFileSync(path.join(RUN_DIR, 'RECOVERY_MANIFEST.json'), 'utf8'));
  if (raw.run_id !== RUN_ID || raw.fixture_sha256 !== FIXTURE_SHA || raw.generations.length !== 54) {
    throw new Error('Finalization identity/count mismatch.');
  }
  if (!recovery.finished_at || recovery.closing_generations_completed.length !== 12) {
    throw new Error('Recovery is incomplete.');
  }
  const unobserved = raw.generations.filter((entry) => !entry.contract_validation);
  if (unobserved.length) throw new Error(`Unobserved generations remain: ${unobserved.length}.`);
  const failures = raw.generations.filter((entry) => entry.contract_validation.passed === false);
  for (const entry of failures) {
    if (!editorial[entry.generation_id]) throw new Error(`Missing editorial review: ${entry.generation_id}`);
  }
  if (Object.keys(editorial).length !== failures.length) throw new Error('Editorial map contains stale entries.');

  const reviewed = raw.generations.map((entry) => {
    const [classification, note] = classify(entry);
    return { ...entry, human_review: { classification, note } };
  });
  const passes = reviewed.filter((entry) => entry.contract_validation.passed === true);
  const issueCounts = countBy(failures.flatMap((entry) => entry.issue_codes), (issue) => issue);
  const editorialCounts = countBy(failures, (entry) => editorial[entry.generation_id][0]);
  const bySurface = reviewed.reduce((result, entry) => {
    const row = result[entry.surface] ??= { n: 0, pass: 0, fail: 0 };
    row.n += 1;
    row[entry.contract_validation.passed ? 'pass' : 'fail'] += 1;
    return result;
  }, {});
  const byMode = reviewed.reduce((result, entry) => {
    const row = result[entry.mode] ??= { n: 0, pass: 0, fail: 0 };
    row.n += 1;
    row[entry.contract_validation.passed ? 'pass' : 'fail'] += 1;
    return result;
  }, {});
  const byLanguageGroup = reviewed.reduce((result, entry) => {
    const row = result[entry.language_group] ??= { n: 0, pass: 0, fail: 0 };
    row.n += 1;
    row[entry.contract_validation.passed ? 'pass' : 'fail'] += 1;
    return result;
  }, {});
  const byLanguage = reviewed.reduce((result, entry) => {
    const row = result[entry.language] ??= { n: 0, pass: 0, fail: 0 };
    row.n += 1;
    row[entry.contract_validation.passed ? 'pass' : 'fail'] += 1;
    return result;
  }, {});
  const totalCost = reviewed.reduce((sum, entry) => sum + entry.estimated_cost_usd, 0);
  const reader = reviewed.filter((entry) => entry.surface_group === 'reader');
  const open = reviewed.filter((entry) => entry.surface_group === 'exploring_open');
  const close = reviewed.filter((entry) => entry.surface_group === 'closing');
  const readerFirstVisible = reader.map((entry) =>
    entry.latency.completion_ms < 15000
      ? entry.latency.completion_ms
      : entry.latency.first_user_visible_eligible_ms ?? entry.latency.completion_ms
  );
  const latencyRows = [
    ['Reader completion', reader.map((entry) => entry.latency.completion_ms)],
    ['Reader first visible', readerFirstVisible],
    ['Exploring open model', open.map((entry) => entry.gateway_generation_ms)],
    ['Exploring closing request', close.map((entry) => entry.latency.completion_ms)],
  ];

  const analysis = {
    run_id: RUN_ID,
    fixture_sha256: FIXTURE_SHA,
    generation_count: reviewed.length,
    validator: { pass: passes.length, fail: failures.length, issue_occurrences: issueCounts },
    human_review_of_validator_failures: editorialCounts,
    representative_pass_sample_reviewed: passSampleIds.size,
    exact_total_cost_usd: totalCost,
    generation_model_retries: 0,
    reader_generations_rerun_during_recovery: recovery.reader_generations_rerun,
    open_generations_rerun_during_recovery: recovery.open_generations_rerun,
    by_surface: bySurface,
    by_mode: byMode,
    by_language_group: byLanguageGroup,
    by_language: byLanguage,
  };

  const report = `# Oneiros v1.0.1 production diagnostic baseline — 2026-08-29

## Decision summary

The frozen approved production candidate was exercised for **54 actual user-facing generations**: 30 Readers and 12 two-turn Exploring trajectories. The exact total model cost was **${money(totalCost)}**, below the approved $3 hard cap. No prompt, model, runtime, database schema, or production deployment changed.

The mechanical validator reported **${passes.length}/${reviewed.length} PASS (${percent(passes.length, reviewed.length)})** and **${failures.length}/${reviewed.length} FAIL (${percent(failures.length, reviewed.length)})**. Human review shows that raw FAIL rate is not a product-failure rate:

| Human classification of the ${failures.length} flags | Count |
|---|---:|
${tableRows(editorialCounts)}

There were **0 hard product failures**. Four open Exploring turns had genuine binary/ternary answer-menu behavior. Eleven Reader flags were noticeable but usable option-framing. Ten flags were harmless validator/structure artifacts. A representative sample of ${passSampleIds.size} mechanical PASS outputs was reviewed and showed no obvious false-negative contract defect.

**Engineering conclusion:** keep shadow validation observational. The data does not justify buffering, retry, or loss of the ~15s reveal. The next investigation should target validator precision (especially the generic no-language menu pass and short-text language detection) and the specific answer-menu patterns in open Exploring, without changing prompts or architecture in this baseline task.

## Frozen identity and method

- Method: \`${raw.production_identity.method_id}\`
- Bundle SHA-256: \`${raw.production_identity.bundle_sha256}\`
- Fixture SHA-256: \`${raw.fixture_sha256}\`
- Reader prompt: \`${raw.production_identity.reader_prompt_id}\`
- Chat prompt: \`${raw.production_identity.chat_prompt_id}\`
- Shadow validator: \`${raw.production_identity.shadow_validation_version}\`
- Production gateway/builders/models: actual deployed candidate paths
- Contract retry / question-only generation / semantic judge calls: **0**
- Reader/open reruns during recovery: **0 / 0**
- Closing generations: exactly 12, one per frozen trajectory

The first harness pass successfully generated all 30 Readers and all 12 open turns. A committed-idempotency gateway replay then exposed an engineering defect: \`dream_followup_reply\` replay dereferenced missing \`result.value.next_messages\`. Recovery read the already committed quota telemetry directly and executed only the 12 closings that had never run. The recovery manifest preserves this audit trail.

## Mechanical validator results

| Surface | n | PASS | FAIL | FAIL rate |
|---|---:|---:|---:|---:|
${Object.entries(bySurface).sort().map(([key, row]) => `| ${key} | ${row.n} | ${row.pass} | ${row.fail} | ${percent(row.fail, row.n)} |`).join('\n')}

| Issue code | Occurrences |
|---|---:|
${tableRows(issueCounts)}

Five open Exploring outputs were mechanically flagged:

| Generation | Exact primary validation reason | Human assessment |
|---|---|---|
${failures.filter((entry) => entry.surface === 'chat_followup').map((entry) => `| ${entry.case_id} | ${entry.issue_codes.join(', ')} | ${editorial[entry.generation_id][0]} — ${editorial[entry.generation_id][1]} |`).join('\n')}

These were shadow observations, **not retries**. The prior smoke's “5 retries” cannot be retroactively assigned exact reasons from this run; this baseline records exact reasons for its own five flagged open turns.

## Breakdown

### Mode

| Mode | n | PASS | FAIL | FAIL rate |
|---|---:|---:|---:|---:|
${Object.entries(byMode).sort().map(([key, row]) => `| ${key} | ${row.n} | ${row.pass} | ${row.fail} | ${percent(row.fail, row.n)} |`).join('\n')}

### Language group

| Group | n | PASS | FAIL | FAIL rate |
|---|---:|---:|---:|---:|
${Object.entries(byLanguageGroup).sort().map(([key, row]) => `| ${key} | ${row.n} | ${row.pass} | ${row.fail} | ${percent(row.fail, row.n)} |`).join('\n')}

### Individual language

| Language | n | PASS | FAIL | FAIL rate |
|---|---:|---:|---:|---:|
${Object.entries(byLanguage).sort().map(([key, row]) => `| ${key} | ${row.n} | ${row.pass} | ${row.fail} | ${percent(row.fail, row.n)} |`).join('\n')}

## Latency and reveal

| Measurement | n | Median | p75 | Max |
|---|---:|---:|---:|---:|
${latencyRows.map(([label, values]) => `| ${label} | ${values.length} | ${percentile(values, .5)} ms | ${percentile(values, .75)} ms | ${Math.max(...values)} ms |`).join('\n')}

- Reader generations completing before 15s: ${reader.filter((entry) => entry.latency.completion_ms < 15000).length}/${reader.length}.
- Reader generations reaching the partial-reveal threshold: ${reader.filter((entry) => entry.latency.first_user_visible_eligible_ms !== null).length}/${reader.length}.
- Partial streaming remained enabled; validation ran after completion and did not alter delivery.

## Cost

| Surface group | Generations | Exact estimated cost |
|---|---:|---:|
| Reader | ${reader.length} | ${money(reader.reduce((sum, entry) => sum + entry.estimated_cost_usd, 0))} |
| Exploring open | ${open.length} | ${money(open.reduce((sum, entry) => sum + entry.estimated_cost_usd, 0))} |
| Exploring closing | ${close.length} | ${money(close.reduce((sum, entry) => sum + entry.estimated_cost_usd, 0))} |
| **Total** | **${reviewed.length}** | **${money(totalCost)}** |

## Artifacts

- Frozen fixture: \`testing/reflective-questions/v1.0.1-production-diagnostic-30.json\`
- Raw JSON / JSONL: \`testing/reflective-questions/artifacts/v1.0.1-production-diagnostic-2026-08-29/\`
- Human review packet: \`HUMAN_REVIEW_PACKET.md\` in the artifact directory
- Recovery audit: \`RECOVERY_MANIFEST.json\`
- Machine summary: \`ANALYSIS_SUMMARY.json\`

No deploy and no database push are required for these benchmark/report artifacts.
`;

  const reviewPacket = `# Oneiros v1.0.1 diagnostic — human review packet

Run: \`${RUN_ID}\`

Fixture SHA-256: \`${FIXTURE_SHA}\`

Every validator FAIL is classified below. A cross-surface, cross-language sample of ${passSampleIds.size} PASS outputs was also reviewed for obvious false negatives. Mechanical status is evidence, not the editorial verdict.

${reviewed.map((entry) => {
    const human = entry.human_review;
    return `## ${entry.generation_id}

- Surface / mode / language: ${entry.surface} / ${entry.mode} / ${entry.language}
- Mechanical result: ${entry.contract_validation.passed ? 'PASS' : 'FAIL'}
- Exact validator issues: ${entry.issue_codes.join(', ') || 'none'}
- Human classification: ${human.classification}
- Human note: ${human.note}

### Dream

~~~text
${entry.dream}
~~~
${entry.user_turn ? `
### User turn

~~~text
${entry.user_turn}
~~~
` : ''}
### Complete model output

~~~text
${entry.output}
~~~

### Extracted reflective questions

${entry.extracted_reflective_questions.length ? entry.extracted_reflective_questions.map((question) => `- ${question}`).join('\n') : '- none'}
`;
  }).join('\n')}`;

  mkdirSync(ARTIFACT_DIR, { recursive: true });
  writeFileSync(REPORT_PATH, report);
  writeFileSync(path.join(ARTIFACT_DIR, 'RAW_RESULTS.json'), `${JSON.stringify({ ...raw, generations: reviewed }, null, 2)}\n`);
  writeFileSync(path.join(ARTIFACT_DIR, 'RAW_RESULTS.jsonl'), `${reviewed.map((entry) => JSON.stringify(entry)).join('\n')}\n`);
  writeFileSync(path.join(ARTIFACT_DIR, 'HUMAN_REVIEW_PACKET.md'), reviewPacket);
  writeFileSync(path.join(ARTIFACT_DIR, 'RECOVERY_MANIFEST.json'), `${JSON.stringify(recovery, null, 2)}\n`);
  writeFileSync(path.join(ARTIFACT_DIR, 'ANALYSIS_SUMMARY.json'), `${JSON.stringify(analysis, null, 2)}\n`);
  writeFileSync(path.join(ARTIFACT_DIR, 'FIXTURE_SHA256.txt'), `${FIXTURE_SHA}  ../../v1.0.1-production-diagnostic-30.json\n`);
  process.stdout.write(`${REPORT_PATH}\n${ARTIFACT_DIR}\n`);
}

main();
