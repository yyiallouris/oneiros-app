# Live test scenarios

Tracked live-test scenarios live here on purpose.

Why:

- these dreams and benchmark setups are canonical regression probes, not disposable scratch files
- `tmp/` should be treated as generated output space
- keeping the scenarios here makes them reviewable, diffable, and much harder to lose

Rules:

- put reusable live-test dreams and scenario configs here
- keep runners under `scripts/live/`
- write generated packets, logs, and benchmark output under `tmp/`
- if a doc points to a live scenario, prefer this folder over embedding the dream only inside a runner

Current canonical scenarios:

- `reflective-question-frozen-anchor-readings.v1.json` is the synthetic,
  hash-bound eight-case corpus for Post-Jungian Inviter v2 local R&D. It keeps
  the exact dream and persisted GPT-5.4 `interpretation_standard` reading plus
  per-value hashes and narrow source provenance. File SHA is
  `2a1a8bc3a5b4a0019155e2856771c3eea4450be44e57ad1eeea0907d52738628`.
  The source did not persist Reader prompt identity, so the manifest records it
  as `null` and must not claim stronger provenance. No production/user data is
  present; a paid gate must fail closed if any hash changes. The same corpus is
  the 8-anchor set for Composer Core and the same-call paired / 24-run gates.
- `production-baseline.copper-vessel.v3-9-0.json` for `bash scripts/live/run-production-baseline.sh`
- `reflective-questions-live-benchmark.v1.json` is the synthetic 50-dream Greek corpus; Reflective Questions retains its balanced frozen 20-case depth slice. `reflective-questions-multilingual-expansion.v1.json` adds 15 synthetic sentinels, bringing the release corpus to 35 and covering all 12 supported languages, CJK structure, shared-Latin identity, and code-switches. Both fixtures must declare `source: synthetic`; the runner rejects any other source before authentication or model work. Protocol `2.1.0` points at the fail-closed v4.1 director/composer candidate. Use `REFLECTIVE_QUESTION_V2_DIAGNOSTIC_CASE_IDS` for a `5–8` case comma-separated probe; also set `REFLECTIVE_QUESTION_V2_BENCHMARK_ALLOW_CANDIDATE=1` and a validated `REFLECTIVE_QUESTION_V2_READING_CACHE_PATH`. The cache requires exact case ids/full dream text and complete readings before any paid call. Only the Core opening is sent as provisional orientation; `D#` remains evidence. Outputs stay under `tmp/reflective-question-v2-production-benchmark-*`. The runner caps paid scope at 18 by default; a 35-case release run additionally requires `REFLECTIVE_QUESTION_V2_ALLOW_FULL_CORPUS=1` after explicit cost authorization.
- `scripts/lib/reflectiveDialogueV1Benchmark.ts` freezes 16 synthetic answer trajectories: the historical Greek eight plus multilingual correction, no-change, painless meaning, joy, grief, language switch, ambiguous short-reply inheritance, and natural completion cases across Latin, Greek, Cyrillic, and CJK scripts. `npm run benchmark:reflective-dialogue-v1` executes structured Dialogue `1.9.1` answer → user-only `U#` → optional director/composer and writes raw model material only under `tmp/`. Set `REFLECTIVE_DIALOGUE_V1_DIAGNOSTIC_SCENARIO_IDS` to a comma-separated subset before paid iteration. The runner caps paid scope at 8; the full 16 additionally requires `REFLECTIVE_DIALOGUE_V1_ALLOW_FULL_CORPUS=1` after explicit cost authorization. Both external runners use only tracked synthetic material through the authenticated Oneiros AI proxy; neither imports or modifies archived experiments.
- `reflective-essays-anti-coherence-stress-set.v1.json` covers unrelated dreams, contradictory affects without a shared motif, one symbol with opposed stances, mixed numinous/banal/distressing registers, and two equally dense parallel clusters. Use `npm run review:reflective-essays-anti-coherence` for the historical prompt regression and `npm run review:reflective-essays-phase2-anti-coherence` for the context-only Phase 2 comparison. The scorecard includes `coherence_restraint` plus whole-essay `topology_consistency`; an opening “no unified field yet” disclaimer cannot pass when later sections rebuild one field. Phase 2 results use `candidate_verdict`, `candidate_topology`, and `candidate_topology_preserved` for context-v2 only.
- `npm run review:reflective-essays-field-map` and `npm run review:reflective-essays-field-map-anti-coherence` run the closed architecture spike. Set `REFLECTIVE_ESSAY_PHASE2_BASELINE_RESULTS` to the matching frozen Phase 2 `results.json`; optionally set `REFLECTIVE_ESSAY_CONCURRENCY` (default `3`) to run independent cases concurrently while preserving Field Map → essay → judge ordering inside each case. Invalid maps are recorded as architecture failures without aborting the remaining cases. The reviewed spike scored manual `2 PASS / 7 FAIL`; do not treat these commands as a production rollout path.
