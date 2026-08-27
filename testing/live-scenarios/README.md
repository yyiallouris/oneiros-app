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

- `production-baseline.copper-vessel.v3-9-0.json` for `bash scripts/live/run-production-baseline.sh`
- `reflective-essays-anti-coherence-stress-set.v1.json` covers unrelated dreams, contradictory affects without a shared motif, one symbol with opposed stances, mixed numinous/banal/distressing registers, and two equally dense parallel clusters. Use `npm run review:reflective-essays-anti-coherence` for the historical prompt regression and `npm run review:reflective-essays-phase2-anti-coherence` for the context-only Phase 2 comparison. The scorecard includes `coherence_restraint` plus whole-essay `topology_consistency`; an opening “no unified field yet” disclaimer cannot pass when later sections rebuild one field. Phase 2 results use `candidate_verdict`, `candidate_topology`, and `candidate_topology_preserved` for context-v2 only.
- `npm run review:reflective-essays-field-map` and `npm run review:reflective-essays-field-map-anti-coherence` run the closed architecture spike. Set `REFLECTIVE_ESSAY_PHASE2_BASELINE_RESULTS` to the matching frozen Phase 2 `results.json`; optionally set `REFLECTIVE_ESSAY_CONCURRENCY` (default `3`) to run independent cases concurrently while preserving Field Map → essay → judge ordering inside each case. Invalid maps are recorded as architecture failures without aborting the remaining cases. The reviewed spike scored manual `2 PASS / 7 FAIL`; do not treat these commands as a production rollout path.
