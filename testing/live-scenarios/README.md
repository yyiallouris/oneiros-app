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

Current canonical scenario:

- `production-baseline.copper-vessel.v3-9-0.json` for `bash scripts/live/run-production-baseline.sh`
