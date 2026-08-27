# Reflective-question production identity

**Date:** 2026-08-27  
**Status:** recovered live v105 method is the production source of truth in git. Essay cardinality stays on the separate `2.0.3-phase1` contract.

## Recovered deployed source

Recovered from remote `ai-entitlements-gateway` **version 105** on 2026-08-27 with `supabase functions download ai-entitlements-gateway --use-api`.

| Field | Value |
|---|---|
| Function | `ai-entitlements-gateway` |
| Project | `xacdawttvtfrdbcwhcqn` |
| Deployed version | `105` |
| Updated at (UTC) | `2026-08-26T11:50:26Z` |
| Method ID | `reflective-question-psychological-aliveness-v1.4.0` |
| Method version | `1.4.0` |
| Prompt SHA-256 | `4885e351ff6a20ceb8257c004aacd66e390e4c0902455a1cf5ff4d0df5a0238d` |

Canonical prompt text lives in `src/ai/reflectiveQuestionPrompt.ts`. The hold module re-exports that same body so the SHA cannot drift.

## Surface contracts

| Surface | Contract |
|---|---|
| Quick | exactly 1 through the method |
| Standard / Advanced | 1–2, default 1; second only for distinct value; no fixed somatic-first / symbolic-second sequence |
| Chat non-final | exactly 1 through the method |
| Chat final | no reflective question |
| Essays | QA-approved `2.0.3-phase1`, **exactly one** question. Surface owns cardinality. Method is **not** injected into essay requests |

## Denied local candidate

| Field | Value |
|---|---|
| Method ID | `reflective-question-oneiros-reader-v1.4.0` |
| Prompt SHA-256 | `0ea4b9a2364681124bdf582822c683754e28ae52ca6d7e7e7427e39f528b08b7` |
| Status | `DO NOT DEPLOY` |

Candidate B SHA `08cd3eaf…` remains frozen research-only on the isolated R&D branch. It is not imported by runtime on this production line.

## Deploy guard

Use only:

```bash
npm run deploy:ai-entitlements-gateway
```

That runs `npm run guard:ai-entitlements-gateway-deploy` first.

A deploy fails unless the bundled `REFLECTIVE_QUESTION_METHOD_ID` + prompt SHA match recovered production. Rejected Oneiros Reader v1.4.0 cannot be approved with an env override. Runtime files must not import R&D or this hold module.

Optional override for a **non-denied** identity that already matches the local bundle:

```bash
REFLECTIVE_QUESTION_PRODUCTION_DEPLOY_APPROVED=<methodId>:<sha256> npm run deploy:ai-entitlements-gateway
```

Raw `supabase functions deploy ai-entitlements-gateway` is not the supported path.
