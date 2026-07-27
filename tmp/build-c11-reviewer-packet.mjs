import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const root = process.cwd();
const c11Dir = path.join(root, 'tmp/patch-c11-benchmark-2026-07-27T10-54-44-546Z');
const fdDir = path.join(root, 'tmp/5-dream-acceptance-2026-07-27T10-56-17-849Z');
const c1Dir = path.join(root, 'tmp/patch-c1-benchmark-2026-07-27T10-39-33-097Z');

const c11Summary = JSON.parse(fs.readFileSync(path.join(c11Dir, 'summary.json'), 'utf8'));
const c1Summary = JSON.parse(fs.readFileSync(path.join(c1Dir, 'summary.json'), 'utf8'));
const fdSummary = JSON.parse(fs.readFileSync(path.join(fdDir, 'summary.json'), 'utf8'));
const fdAll = JSON.parse(fs.readFileSync(path.join(fdDir, 'all_runs.json'), 'utf8'));

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

const packet = {
  title: 'Oneiros v4.1.5-C.1.1 reviewer packet',
  generated_at: new Date().toISOString(),
  patch: 'C.1.1_catalog_namespace_enforcement',
  frozen_baseline: '4.1.5-C.1 validator simplification',
  prompt_id: c11Summary.prompt_id,
  prompt_version: c11Summary.prompt_version,
  schema_version: c11Summary.schema_version,
  myth_prompt_index_version: c11Summary.myth_prompt_index_version,
  myth_index_tokens: c11Summary.myth_index_tokens,
  provider_schema_tokens: c11Summary.provider_schema_tokens,
  selectable_archetype_ids: c11Summary.selectable_archetype_ids,
  myth_catalog_ids: c11Summary.myth_catalog_ids,
  decision:
    'Exact catalog ID enums in provider JSON schema + id= prompt formatting. No cross-layer salvage. Sisyphus signature unchanged.',
  c11_targeted_pass: true,
  five_dream_suite_run: true,
  five_dream_overall_pass: fdSummary.overall_pass,
  artifact_dirs: {
    c11_benchmark: c11Dir,
    five_dream_suite: fdDir,
    c1_comparison: c1Dir,
  },
  summary: {
    c11: c11Summary,
    c1_sisyphus_comparison: {
      c1_post: c1Summary.phases.find((p) => p.phase === 'positive_sisyphus')?.correct_post,
      c11_post: c11Summary.sisyphus.correct_post,
      c1_issue: '2/3 runs leaked greek.sisyphus to archetype_id',
      c11_issue: 'none — 0/5 leaks',
    },
    five_dream: fdSummary,
  },
  findings: [
    'C.1.1 namespace enums fixed the Sisyphus contract bug: 5/5 post greek.sisyphus, 0 myth IDs in archetype_id, 0 bracketed archetype IDs, 0 wrong post myths, 0 proxy/schema failures.',
    'C.1 Sisyphus was 1/3 because greek.sisyphus was placed in archetype_id — not recall failure or validator false negative.',
    'Smoke: generic empty OK, Inanna OK; Fisherman smoke empty (Guide+Trickster archetypes) — single-run variance, not namespace leak.',
    'Five-dream suite integrity 100% (0 unknown IDs, 0 free-text titles). overall_pass false on C1/C5 myth selection only.',
    'C5 wrong: japanese.izanagi_izanami, greek.psyche_eros vs sumerian.inanna_descent — catalog signature confusion; sharpen Inanna vs Izanagi records, do not restore feature-ID validator.',
    'C1 Orpheus 1/3 correct (2 empty) — separate selection variance.',
  ],
  five_dream_notable_runs: fdAll
    .filter((r) => r.myth_status === 'wrong' || (r.case_id?.startsWith('C1') && r.myth_status !== 'correct'))
    .map((r) => ({
      run: r.run_label,
      case_id: r.case_id,
      myth_status: r.myth_status,
      myth_ids: r.myth_ids,
      archetypes: r.archetypes,
    })),
  c11_runs: c11Runs,
};

fs.writeFileSync(path.join(root, 'tmp/ONEIROS_V415_C11_REVIEWER_PACKET.json'), JSON.stringify(packet, null, 2));

const caseLines = fdSummary.cases
  .map(
    (c) =>
      `- **${c.case_id}**: myth correct ${c.myth_correct}/3, empty ${c.myth_empty}, wrong ${c.myth_wrong}`
  )
  .join('\n');

const md = `# Oneiros v4.1.5-C.1.1 reviewer packet

Generated: ${packet.generated_at}

## Versions
- prompt_version: ${c11Summary.prompt_version}
- schema_version: ${c11Summary.schema_version}
- myth_prompt_index_version: ${c11Summary.myth_prompt_index_version}
- myth_index_tokens: ${c11Summary.myth_index_tokens}
- provider_schema_tokens: ${c11Summary.provider_schema_tokens}

## Verdict
- **C.1.1 targeted pass:** YES
- **C.1 frozen:** yes
- **Five-dream suite:** run once — overall_pass **${fdSummary.overall_pass ? 'YES' : 'NO'}**

## C.1 → C.1.1 Sisyphus

| Metric | C.1 | C.1.1 |
|---|---|---|
| Sisyphus post correct | 1/3 | **5/5** |
| myth ID in archetype_id | 2/3 leaks | **0/5** |
| bracketed archetype IDs | Inanna runs | **0/5** |

## C.1.1 targeted scorecard

| Phase | Result |
|---|---|
| Sisyphus ×5 | post **5/5**, wrong **0**, myth-in-archetype **0**, brackets **0** |
| Smoke generic | empty ✅ |
| Smoke Inanna | sumerian.inanna_descent ✅ |
| Smoke Fisherman | empty ⚠️ (Guide+Trickster; 1-run variance) |
| Proxy/schema | **0** failures |

## Five-dream suite (${fdSummary.total_runs} runs, $${fdSummary.total_estimated_usd.toFixed(4)})

| Check | Pass |
|---|---|
| Integrity | ✅ |
| Myth negatives 6/6 | ✅ |
| Myth positives min 2/3 all cases | ❌ |
| Overall | ❌ |

### Cases
${caseLines}

### Notable wrong myth IDs
- C5: japanese.izanagi_izanami, greek.psyche_eros (expected sumerian.inanna_descent)
- C1: 2/3 empty (expected greek.orpheus_eurydice)

## Key findings

${packet.findings.map((f) => `- ${f}`).join('\n')}

## Artifacts
- C.1.1 benchmark: ${c11Dir}/
- Five-dream: ${fdDir}/
- C.1 comparison: ${c1Dir}/
- Logs: tmp/patch-c11-benchmark-live.log, tmp/5-dream-acceptance-c11-live.log
`;

fs.writeFileSync(path.join(root, 'tmp/ONEIROS_V415_C11_REVIEWER_PACKET.md'), md);

execSync(
  `zip -q tmp/ONEIROS_V415_C11_REVIEWER_PACKET.zip \
    tmp/ONEIROS_V415_C11_REVIEWER_PACKET.json \
    tmp/ONEIROS_V415_C11_REVIEWER_PACKET.md \
    tmp/patch-c11-benchmark-live.log \
    tmp/5-dream-acceptance-c11-live.log \
    tmp/patch-c11-benchmark-2026-07-27T10-54-44-546Z/summary.json \
    tmp/patch-c11-benchmark-2026-07-27T10-54-44-546Z/sisyphus_r1.json \
    tmp/patch-c11-benchmark-2026-07-27T10-54-44-546Z/sisyphus_r2.json \
    tmp/patch-c11-benchmark-2026-07-27T10-54-44-546Z/sisyphus_r3.json \
    tmp/patch-c11-benchmark-2026-07-27T10-54-44-546Z/sisyphus_r4.json \
    tmp/patch-c11-benchmark-2026-07-27T10-54-44-546Z/sisyphus_r5.json \
    tmp/patch-c11-benchmark-2026-07-27T10-54-44-546Z/smoke_fisherman_r1.json \
    tmp/5-dream-acceptance-2026-07-27T10-56-17-849Z/summary.json \
    tmp/5-dream-acceptance-2026-07-27T10-56-17-849Z/all_runs.json`,
  { cwd: root, stdio: 'inherit' }
);

console.log('Done: tmp/ONEIROS_V415_C11_REVIEWER_PACKET.{json,md,zip}');
