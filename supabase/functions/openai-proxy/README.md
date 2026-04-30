# OpenAI Proxy Edge Function

This Supabase Edge Function acts as a secure proxy between your mobile app and OpenAI's API.

## Why This Exists

- **Security**: Keeps your OpenAI API key on the server (never in the mobile app)
- **Production Safety**: Required for production builds (client-side API keys get stolen)
- **Rate Limiting**: Can add rate limiting per user if needed
- **Logging**: Server-side logging for debugging

## Setup

### 1. Set Environment Variable

In your Supabase project dashboard:
1. Go to **Edge Functions** → **Settings**
2. Add secret: `OPENAI_API_KEY` = your OpenAI API key (starts with `sk-`)

Optional model-routing secrets:
- `OPENAI_MODEL_CHEAP`: Default cheap model for structured background work. Defaults to `gpt-4o-mini`.
- `OPENAI_MODEL_EXTRACTION`: Overrides the model for dream element extraction.
- `OPENAI_MODEL_GROUPING`: Overrides the model for semantic grouping.
- `OPENAI_MODEL_PATTERN`: Overrides the model for pattern insight generation.
- `OPENAI_MODEL_INTERPRETATION`: Overrides the model for initial dream interpretations.
- `OPENAI_MODEL_CHAT`: Overrides the model for follow-up chat.
- `OPENAI_MODEL_DEFAULT`: Fallback model for unrouted requests.

### 2. Deploy the Function

```bash
# Make sure you're logged in to Supabase CLI
supabase login

# Link to your project (if not already linked)
supabase link --project-ref your-project-ref

# Deploy the function
supabase functions deploy openai-proxy
```

### 3. Get Your Function URL

After deployment, you'll get a URL like:
```
https://your-project-ref.supabase.co/functions/v1/openai-proxy
```

### 4. Update Your App Config

In your `.env` file:
```bash
EXPO_PUBLIC_CUSTOM_GPT_ENDPOINT="https://your-project-ref.supabase.co/functions/v1/openai-proxy"
```

## How It Works

1. **Mobile app** sends request to Supabase Edge Function
2. **Edge Function** forwards request to OpenAI with API key
3. **OpenAI** responds to Edge Function
4. **Edge Function** returns response to mobile app

The API key never leaves the server.

## Request/Response Format

The proxy accepts the same payload as OpenAI Chat Completions API:
- `model`: Model name (e.g., "gpt-5.2")
- `messages`: Array of message objects
- `temperature`: Optional temperature
- `max_tokens` or `max_completion_tokens`: Token limit
- `task`: Optional Oneiros routing hint (`dream_extraction`, `semantic_grouping`, `pattern_insights`, `interpretation_quick`, `interpretation_standard`, `interpretation_advanced`, `chat_followup`)

Returns the same response format as OpenAI.

When `task` is present, the proxy may override the client-requested model. By default, `dream_extraction` and `semantic_grouping` route to `OPENAI_MODEL_CHEAP` / `gpt-4o-mini`; user-facing interpretation and chat stay on the requested model unless an override secret is configured.

## Headers

The proxy accepts and forwards:
- `X-Request-Id`: For request correlation (optional)
- `X-App-Version`: App version for debugging (optional)

## Security Notes

- ✅ API key is stored as Supabase secret (encrypted)
- ✅ CORS is enabled for mobile app
- ✅ No sensitive data in logs
- ✅ Request ID correlation for debugging

## Testing

After deployment, test with:
```bash
curl -X POST https://your-project-ref.supabase.co/functions/v1/openai-proxy \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SUPABASE_ANON_KEY" \
  -d '{
    "model": "gpt-4o",
    "messages": [{"role": "user", "content": "Hello"}],
    "max_tokens": 100
  }'
```

## Troubleshooting

- **401 Unauthorized**: Check that `OPENAI_API_KEY` is set in Supabase secrets
- **CORS errors**: Make sure CORS headers are included (they should be)
- **Timeout**: Edge Functions have a 60s timeout limit
