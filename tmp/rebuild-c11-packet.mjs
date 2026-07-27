import fs from 'fs';
import path from 'path';

const root = process.cwd();
const c11Dir = path.join(root, 'tmp/patch-c11-benchmark-2026-07-27T10-54-44-546Z');
const fdAll = JSON.parse(
  fs.readFileSync(path.join(root, 'tmp/5-dream-acceptance-2026-07-27T10-56-17-849Z/all_runs.json'), 'utf8')
);
const fdSummary = JSON.parse(
  fs.readFileSync(path.join(root, 'tmp/5-dream-acceptance-2026-07-27T10-56-17-849Z/summary.json'), 'utf8')
);
const c11Summary = JSON.parse(fs.readFileSync(path.join(c11Dir, 'summary.json'), 'utf8'));

const c11Runs = fs
  .readdirSync(c11Dir)
  .filter((f) => f.endsWith('.json') && f !== 'summary.json')
  .sort()
  .map((f) => {
    const r = JSON.parse(fs.readFileSync(path.join(c11Dir, f), 'utf8'));
    return {
      run: r.run_id,
      phase: r.phase,
      expect_myth: r.expect_myth ?? null,
      raw_myth_catalog_id: r.raw_myth_ids?.[0] ?? null,
      post_myth_catalog_id: r.post_myth_ids?.[0] ?? null,
      raw_archetype_ids: r.raw_archetype_ids ?? [],
      bracketed_archetype_ids: r.bracketed_archetype_ids ?? [],
      myth_id_in_archetype: r.myth_id_in_archetype ?? [],
      schema_ok: r.schema_ok,
      latency_ms: r.latency_ms,
    };
  });

const fiveDreamRuns = fdAll.map((r) => ({
  run: r.run,
  case_id: r.case_id,
  required_myth: r.required_myth_catalog_id ?? null,
  myth_status: r.myth_status,
  raw_myth_catalog_id: r.raw_myth_ids?.[0] ?? r.myth_ids?.[0] ?? null,
  post_myth_catalog_id: r.post_myth_ids?.[0] ?? (r.myth_status === 'correct' ? r.myth_ids?.[0] : null) ?? null,
  myth_ids: r.myth_ids ?? [],
  archetypes: (r.archetypes ?? r.parsed_archetypes ?? []).map((a) =>
    typeof a === 'string' ? a : a.canonical_label || a.archetype_id
  ),
  schema_ok: r.schema_ok ?? true,
  latency_ms: r.latency_ms,
  estimated_usd: r.cost?.estimatedUsd ?? null,
}));

const packet = {
  title: 'Oneiros v4.1.5-C.1.1 reviewer packet',
  generated_at: new Date().toISOString(),
  patch: 'C.1.1_catalog_namespace_enforcement',
  frozen_baseline: '4.1.5-C.1 validator simplification',
  prompt_id: 'dream-field-map-interpretive-v4.1.5-C.1.1',
  prompt_version: '4.1.5-C.1.1',
  schema_version: 12,
  myth_prompt_index_version: 2,
  myth_index_tokens: 9220,
  provider_schema_tokens: 1809,
  verdict: {
    c11_targeted_pass: true,
    c11_ship: true,
    sisyphus_post: '5/5',
    myth_in_archetype_leaks: '0/5',
    bracketed_archetype_ids: '0/5',
    five_dream_overall_pass: false,
    five_dream_integrity_clean: true,
  },
  c1_sisyphus_comparison: {
    c1_post: '1/3',
    c11_post: '5/5',
    c1_root_cause: 'greek.sisyphus leaked into archetype_id on 2/3 runs',
    c11_root_cause: 'fixed by provider enum namespace enforcement',
  },
  c11_summary: {
    sisyphus: c11Summary.sisyphus,
    smoke: c11Summary.smoke,
    total_runs: c11Summary.total_runs,
  },
  five_dream_summary: {
    total_runs: fdSummary.total_runs,
    total_estimated_usd: fdSummary.total_estimated_usd,
    integrity: fdSummary.integrity,
    suite_pass: fdSummary.suite_pass,
    overall_pass: fdSummary.overall_pass,
    cases: fdSummary.cases.map((c) => ({
      case_id: c.case_id,
      required_myth_catalog_id: c.required_myth_catalog_id,
      myth_correct: c.myth_correct,
      myth_empty: c.myth_empty,
      myth_wrong: c.myth_wrong,
      myth_pass_min_2_of_3: c.myth_pass_min_2_of_3,
    })),
  },
  findings: [
    'C.1.1 fixed Sisyphus contract bug: 5/5 post greek.sisyphus, 0 myth IDs in archetype_id, 0 bracketed IDs.',
    'C.1 Sisyphus 1/3 was namespace routing not recall or validator false negative.',
    'Five-dream integrity 100%. overall_pass false on C1/C5 myth selection only.',
    'C5 wrong: japanese.izanagi_izanami, greek.psyche_eros vs sumerian.inanna_descent — sharpen Inanna vs Izanagi sig/anti; do not restore feature-ID validator.',
    'C1 Orpheus 1/3 correct, 2/3 empty — separate variance.',
  ],
  c11_runs: c11Runs,
  five_dream_runs: fiveDreamRuns,
};

const out = path.join(root, 'tmp/ONEIROS_V415_C11_REVIEWER_PACKET.json');
fs.writeFileSync(out, JSON.stringify(packet, null, 2));
console.log('Wrote', out, `(${fiveDreamRuns.length + c11Runs.length} runs embedded)`);
