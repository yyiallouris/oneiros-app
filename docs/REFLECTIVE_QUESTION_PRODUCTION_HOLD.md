# Reflective-question production hold

**Date:** 2026-08-27  
**Status:** safety record + deploy gate. No runtime prompt change.

Remote production and the local repo candidate are different identities. This file records the recovered deployed source and the fail-closed deploy guard. Candidate B SHA `08cd3eaf…` stays frozen research-only.

## Recovered deployed source

Recovered from remote `ai-entitlements-gateway` **version 105** on 2026-08-27 with `supabase functions download ai-entitlements-gateway --use-api`. Nothing in the live function was overwritten.

| Field | Value |
|---|---|
| Function | `ai-entitlements-gateway` |
| Project | `xacdawttvtfrdbcwhcqn` |
| Deployed version | `105` |
| Updated at (UTC) | `2026-08-26T11:50:26Z` |
| Method ID | `reflective-question-psychological-aliveness-v1.4.0` |
| Method version | `1.4.0` |
| Prompt SHA-256 | `4885e351ff6a20ceb8257c004aacd66e390e4c0902455a1cf5ff4d0df5a0238d` |

Docs previously called this the “v1.5 bundle.” The exact deployed method id is **psychological-aliveness v1.4.0**, not `reflective-question-psychological-aliveness-v1.5.0` and not local Oneiros Reader v1.4.0. Exact prompt text is frozen in `src/ai/reflectiveQuestionProductionHold.ts` and is **not** imported by `src/services/ai.ts` or `billing-ai.ts`.

## Denied local candidate

| Field | Value |
|---|---|
| Method ID | `reflective-question-oneiros-reader-v1.4.0` |
| Prompt SHA-256 | `0ea4b9a2364681124bdf582822c683754e28ae52ca6d7e7e7427e39f528b08b7` |
| Status | `DO NOT DEPLOY` |

## Deploy guard

Use only:

```bash
npm run deploy:ai-entitlements-gateway
```

That runs `npm run guard:ai-entitlements-gateway-deploy` first.

A deploy fails unless the local bundled `REFLECTIVE_QUESTION_METHOD_ID` + prompt SHA match the recovered production identity. Rejected Oneiros Reader v1.4.0 cannot be approved with an env override.

Optional override for a **non-denied** identity that already matches the local bundle:

```bash
REFLECTIVE_QUESTION_PRODUCTION_DEPLOY_APPROVED=<methodId>:<sha256> npm run deploy:ai-entitlements-gateway
```

Raw `supabase functions deploy ai-entitlements-gateway` is not the supported path.

## Frozen R&D runner

`scripts/live/run-reflective-question-golden-set.ts` is legacy/frozen. Do not add new experiment flags or candidates there. No generation in this hold.

## Runtime

Client, gateway request path, `openai-proxy`, and Candidate B are unchanged by this hold.
