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

If repair still fails schema validation, the proxy returns **HTTP 502** instead of
silently forwarding invalid JSON. Safe logs include `task`, `provider`,
`validationStage`, `schemaErrors`, `repairAttempted`, and `repairSucceeded`
(never dream content). `conversation_element_update` must use explicit
`{"status":"no_change"}` rather than bare `{}`.

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
  - **`fallbackAnthropicModel` (optional):** μόνο με `provider: "openai"`. Αν το OpenAI αποτύχει (429, 5xx, κενό completion), μία προσπάθεια στο Anthropic με αυτό το model, αρκεί να υπάρχει **`ANTHROPIC_API_KEY`**.

Προεπιλογή στο repo (A/B-backed product mapping):
- **`gpt-5.4-nano`** + fallback **`claude-haiku-4-5`** — `dream_extraction`, `conversation_element_update`, `semantic_grouping`
- **`gpt-5.4`** + fallback **`claude-sonnet-5`** — `interpretation_quick`, `interpretation_standard`, `interpretation_advanced`, `interpretation_retry_compact`, `pattern_insights`, `pattern_insights_retry_compact`
- **`gpt-5.4-mini`** + fallback **`claude-haiku-4-5`** — `chat_followup`

Missing or unknown `task` is **rejected with HTTP 400** (no silent unrouted default). Live Regenerate still picks `interpretation_quick|standard|advanced` from the user’s depth setting; όλα πάνε σε `gpt-5.4` με Sonnet 5 fallback.

Μετά την αλλαγή: **`supabase functions deploy openai-proxy`**

### Αν `model` είναι `null` (fallback χωρίς hardcoded id)

**OpenAI:** `OPENAI_MODEL` (όλα), ή ανά λειτουργία `OPENAI_MODEL_INTERPRETATION`, `OPENAI_MODEL_EXTRACTION`, …, τέλος το `model` του app.

**Anthropic:** supported by the proxy code only if you explicitly configure a task with `provider: "anthropic"` or a `fallbackAnthropicModel`.

## Υποχρεωτικά secrets

- **`OPENAI_API_KEY`** — αν χρησιμοποιείς οποιοδήποτε task με `openai`
- **`ANTHROPIC_API_KEY`** — μόνο για tasks που έχουν `fallbackAnthropicModel` ή `provider: "anthropic"`

## Deploy

```bash
supabase functions deploy openai-proxy
```

## App

`EXPO_PUBLIC_CUSTOM_GPT_ENDPOINT` / `customGptEndpoint` → URL αυτού του function.

Το app στέλνει **`task`** στο body (`dream_extraction`, `interpretation_advanced`, κ.λπ.) ώστε να ταιριάζει με το `TASK_AI_BY_TASK`.
