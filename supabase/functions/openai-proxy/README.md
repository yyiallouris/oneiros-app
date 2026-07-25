# `openai-proxy`

OpenAI Chat Completions proxy (+ optional Anthropic fallback). Keys on the server.

## Auth boundary

This function is intentionally deployed with `verify_jwt = false` so CORS
preflight and custom error formatting stay under function control, but the
handler itself requires a valid Supabase user before it reads or forwards any
AI payload. Mobile clients must send:

- `apikey`: Supabase anon key
- `Authorization`: `Bearer <user access token>`

Missing or invalid user auth returns `401` and no dream/chat content is sent to
OpenAI or Anthropic.

## Request forwarding

The proxy forwards OpenAI-compatible `response_format` when present. Metadata
extraction uses this to request JSON object responses from OpenAI; Anthropic
fallbacks still rely on prompt instructions and are converted back into the
OpenAI-compatible response shape.

For structured tasks (`dream_extraction`, `conversation_element_update`,
`semantic_grouping`), the proxy runs:

`parse → coerce → Zod validate → one repair on the same provider → validate again`.

**Resilience (do not regress):** `dream_extraction` soft-defaults common model
omissions on otherwise rich Interpretive Echoes (e.g. missing `confidence` →
`medium` in coerce + Zod preprocess via `DREAM_EXTRACTION_SOFT_DEFAULTS`).
When adding a new required echo field, add a soft default or make it optional,
extend contract tests, bump schema version, and redeploy this function **and**
`ai-entitlements-gateway`. See `documentation/flows-06-jungian-ai-reflection.md`
→ Locked contract: metadata extraction resilience.

If repair still fails schema validation, the proxy returns **HTTP 502** with a
sanitized diagnostic bag instead of silently forwarding invalid JSON:

```json
{
  "error": {
    "message": "Structured AI response failed schema validation",
    "code": "structured_schema_invalid",
    "details": {
      "failureCode": "structured_schema_invalid",
      "validationStage": "rejected",
      "schemaErrors": ["…"],
      "contentLength": 1234,
      "looksTruncated": true,
      "finishReason": "length",
      "provider": "openai",
      "model": "gpt-5.4-mini",
      "repairAttempted": true,
      "tokenLimit": 4200
    }
  }
}
```

Safe logs include the same fields (never dream content / prompts / raw assistant text).
`conversation_element_update` must use explicit `{"status":"no_change"}` rather than bare `{}`.

The proxy also forwards OpenAI `stream` / `stream_options` for server-side
progressive reflection generation. Streaming responses are passed through as
event streams without reading the body in the proxy, so `ai-entitlements-gateway`
can collect partial chunks and expose them through status polling.

## Πού διαλέγω provider + model ανά task

**Ένα αρχείο στο repo:**

### [`task-config.ts`](./task-config.ts)

- **`TASK_AI_BY_TASK`** — για κάθε `task` βάζεις:
  - **`provider`:** `"openai"` by default
  - **`model`:** συγκεκριμένο id (π.χ. `"gpt-5.4-mini"`, `"gpt-5.4"`) **ή** **`null`** για να πέφτεις πίσω σε secrets / το model της εφαρμογής
  - **`fallbackAnthropicModels` (optional):** μόνο με `provider: "openai"`. Ordered list. Αν το OpenAI αποτύχει (**400** / 429 / 5xx, ή κενό completion), δοκιμάζονται με τη σειρά μέχρι να πετύχει ένα, αρκεί να υπάρχει **`ANTHROPIC_API_KEY`**.

Προεπιλογή στο repo (A/B-backed product mapping):
- **`gpt-5.4-mini`** + fallback **`[claude-haiku-4-5]`** — `dream_extraction` (Fabric + Interpretive Echoes need mid-tier judgment), `chat_followup`
- **`gpt-5.4-nano`** + fallback **`[claude-haiku-4-5]`** — `conversation_element_update`, `semantic_grouping`
- **`gpt-5.4`** + fallback **`[claude-sonnet-5, claude-haiku-4-5]`** — `interpretation_*`, `pattern_insights*` (Sonnet first, Haiku safety net while OpenAI primary is flaky)

Missing or unknown `task` is **rejected with HTTP 400** (no silent unrouted default). Live Regenerate still picks `interpretation_quick|standard|advanced` from the user’s depth setting; όλα πάνε σε `gpt-5.4` με Sonnet 5 fallback.

### Sampling params (do not regress)

Newer models reject custom sampling and will break fallback if ignored:

| Model family | Rule |
| --- | --- |
| `claude-sonnet-5`, newer `claude-opus-*` | **Never** send `temperature` / `top_p` / `top_k` (Anthropic returns **400**) |
| `gpt-5*`, `o*` | Prefer omitting custom `temperature`; many configs only accept default |

`openai-proxy` strips forbidden temperature via `shouldOmitSamplingTemperature`.  
If you change fallback models in `task-config.ts`, you **must**:

1. Confirm the new model ID is real (provider docs).
2. Confirm the proxy omits incompatible params for that model.
3. Deploy `openai-proxy`.
4. Smoke-test Advanced reflection. If OpenAI fails, logs must show `anthropic fallback chain start` → `anthropic fallback attempt` → `anthropic fallback succeeded` (Sonnet or Haiku). Sampling errors on Sonnet should not kill the chain — Haiku must still run.

Symptom of this regression: gateway `async reflection failed` / `AI proxy request failed`, quota `released`, client “This action is unavailable right now…”, and **no working Anthropic fallback**.

Μετά την αλλαγή: **`supabase functions deploy openai-proxy`**

### Αν `model` είναι `null` (fallback χωρίς hardcoded id)

**OpenAI:** `OPENAI_MODEL` (όλα), ή ανά λειτουργία `OPENAI_MODEL_INTERPRETATION`, `OPENAI_MODEL_EXTRACTION`, …, τέλος το `model` του app.

**Anthropic:** supported by the proxy code only if you explicitly configure a task with `provider: "anthropic"` or `fallbackAnthropicModels`.

## Υποχρεωτικά secrets

- **`OPENAI_API_KEY`** — αν χρησιμοποιείς οποιοδήποτε task με `openai`
- **`ANTHROPIC_API_KEY`** — μόνο για tasks που έχουν `fallbackAnthropicModels` ή `provider: "anthropic"`

## Deploy

```bash
supabase functions deploy openai-proxy
```

## App

`EXPO_PUBLIC_CUSTOM_GPT_ENDPOINT` / `customGptEndpoint` → URL αυτού του function.

Το app στέλνει **`task`** στο body (`dream_extraction`, `interpretation_advanced`, κ.λπ.) ώστε να ταιριάζει με το `TASK_AI_BY_TASK`.
