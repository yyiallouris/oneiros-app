# Live Interpretive Echoes baseline runner

Operational pipeline so a human can paste a dream and an agent can return **real uncached extraction results** against the frozen production prompt — without shipping a new prompt version.

**Prompt under test (frozen):** `dream-field-map-interpretive-v4.0` / `prompt_version` `4.0.0` / schema `4`  
Canonical module: `src/ai/dreamExtractionPrompt.ts`

Related: [`ECHOES_PROMPTS_AND_CATALOG.md`](./ECHOES_PROMPTS_AND_CATALOG.md), [`SYMBOLS_FLOW.md`](./SYMBOLS_FLOW.md), [`ONEIROS_INTERPRETIVE_ECHOES_V3_9_0.md`](./ONEIROS_INTERPRETIVE_ECHOES_V3_9_0.md).

---

## Why this exists

Debug runs append the large `DEBUG INTERPRETIVE ECHOES` suffix (`dream_map`, audits, beats, consistency checks). That second task can change selection. This runner measures **production-only** behavior by default:

- same production system + user prompt
- `debugInterpretiveEchoes: false` (no debug suffix)
- no ask for diagnostics
- temporary local logging only for raw production `archetypes` / `amplifications` and post-validation equivalents
- no auto-promote / no inference from diagnostics

Do **not** implement `a follow-up prompt rewrite` (or rewrite the prompt) from this runner alone. Use results to decide whether the frozen prompt is stable, whether reflection leaks into echo selection, or whether further prompt work is warranted.

---

## How to ask (human → agent)

Paste a dream and optionally:

```text
Live production baseline for this dream.

Defaults unless I override:
- prompt v4.0.0 frozen
- debug suffix OFF
- model + temperature from dreamExtractionPrompt
- 3 runs WITH the same reflection
- 3 runs WITH reflection omitted
- return raw + post-validation archetypes/amplifications, cost, latency

Dream title: …
Dream:
…
```

Optional overrides:

| Override | Example |
|----------|---------|
| Arms | `6 with reflection only` / `3 no-reflection only` |
| Reflection | paste a fixed reflection, or `generate one shared reflection` |
| Debug | `debug ON` (rare — only when auditing the diagnostic packet) |
| Output dir | custom folder under `tmp/` |

Canonical tracked scenario home: `testing/live-scenarios/`

---

## Scripts

| File | Role |
|------|------|
| `scripts/live/run-production-baseline.ts` | Builds production prompts, loads a tracked live scenario, calls `openai-proxy`, validates locally, writes packets |
| `scripts/live/run-production-baseline.sh` | Creates ephemeral Supabase auth user, runs the TS runner, deletes the user |
| `testing/live-scenarios/production-baseline.copper-vessel.v3-9-0.json` | Canonical tracked dream scenario for the frozen `v3.9.0` baseline |

### Run

```bash
# Default tracked scenario:
bash scripts/live/run-production-baseline.sh

# Or pass a different tracked scenario file:
bash scripts/live/run-production-baseline.sh testing/live-scenarios/production-baseline.copper-vessel.v3-9-0.json
```

Requirements:

- `.env` with `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, `EXPO_PUBLIC_CUSTOM_GPT_ENDPOINT`
- logged-in Supabase CLI that can read project api-keys (`service_role` only to create/delete the temp user)
- network access to the project’s `openai-proxy`

The shell wrapper sets `LIVE_SUPABASE_EMAIL` / `LIVE_SUPABASE_PASSWORD` for the temp user. Do not commit those credentials.

Legacy compatibility wrappers still exist at `tmp/runV390ProductionBaseline.{ts,sh}`, but the canonical home is `scripts/live/` plus `testing/live-scenarios/`.

### What the runner does

1. Asserts `DREAM_EXTRACTION_PROMPT_VERSION === '3.9.0'`.
2. Asserts the production user prompt does **not** contain `DEBUG INTERPRETIVE ECHOES`, `dream_map`, `archetype_audit`, or `mythic_audit`.
3. Optionally generates **one** shared reflection (`interpretation_standard`) for arm A.
4. Runs fresh `dream_extraction` calls (no ready-cache path — direct proxy).
5. Logs and stores:
   - **raw model** `archetypes`, `amplifications`
   - **post-validation** (Zod/normalize + lightweight echo validators)
   - cost estimate (usage + `src/billing/aiPricing.ts`)
   - latency ms
6. Writes artifacts under `tmp/v3.9.0-production-baseline/` (or the `output_dir` declared by the tracked scenario file).

### Artifact layout

```text
tmp/v3.9.0-production-baseline/
  dream_used.json          # title, date, content, shared reflection
  A_with_reflection_1.json
  A_with_reflection_2.json
  A_with_reflection_3.json
  B_no_reflection_1.json
  B_no_reflection_2.json
  B_no_reflection_3.json
  summary.json             # compact comparison table
```

Each run packet includes `debug_suffix: false`, prompt id/version, model, rejects, and `had_interpretive_diagnostics`.

---

## How to read results

| Pattern | Meaning | Next step |
|---------|---------|-----------|
| Stable correct selection across production runs | Production prompt is healthier than debug-only evals suggested; debug may destabilize | Shrink or gate debug suffix; keep production frozen |
| With-reflection ≠ without-reflection on echo labels (systematic) | Reflection leakage into echo selection | Keep reflection for Fabric/other metadata; tighten Echoes firewall only |
| Dramatic label/title churn across all six production runs | `v4.0.0` unstable on its own | Replace with a **much smaller contrastive few-shot** prompt — not another patch on top |

Notes from the first copper-vessel lake dream baseline (2026-07-27):

- Debug OFF still showed high mythic churn (Fisher King / empty / Gyges / Aladdin variants); Fisherman & Jinni never selected.
- `Wise Old Woman` appeared on a **no-reflection** run, not only with reflection — so leakage was not the simple story for that batch.
- One run hit the production output token cap (`4200`) and emitted non-whitelist motif labels; validator dropped them. Treat maxed `outputTokens` as a truncated/degenerate run.

---

## Agent checklist

When the user pastes a dream for live testing:

1. Keep `v4.0.0` frozen unless they explicitly ask for a prompt rewrite.
2. Default **debug OFF**.
3. Put the dream into a tracked scenario file under `testing/live-scenarios/`, then run `bash scripts/live/run-production-baseline.sh <scenario-file>`.
4. Return a compact table: raw vs post archetypes/amplifications, cost, latency per run.
5. Map the result onto the three reading patterns above — do **not** silently start `a follow-up prompt rewrite`.
6. Do not persist diagnostics into interpretation rows / Dream Detail UI.
7. Never log secrets from `.env` or service_role keys.

---

## Out of scope

- Not a Jest/Detox suite (opt-in live spend against the real proxy).
- Not a substitute for `__tests__/flows/dreamMetadataExtraction.resilience.contract.flow.test.ts` or ranking contract tests.
- Not a deploy step — no migration / Edge Function deploy required unless the runner itself is changed to call new gateway behavior.
