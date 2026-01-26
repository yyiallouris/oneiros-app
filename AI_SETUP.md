# AI Configuration Guide

This app uses OpenAI's API (or a custom GPT endpoint) to provide Jungian dream analysis.

## Setup (use environment variables)

We now load config via `app.config.js` and environment variables. Create a `.env` file:

```bash
EXPO_PUBLIC_OPENAI_API_KEY=sk-your-actual-api-key-here
EXPO_PUBLIC_CUSTOM_GPT_ENDPOINT=
EXPO_PUBLIC_GPT_MODEL="gpt-5.2"
EXPO_PUBLIC_SUPABASE_URL=https://your-supabase-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
# Optional: override scheme (defaults to dreamjournal)
# APP_SCHEME=dreamjournal
```

Then restart Expo (`expo start -c`) so the config is rebuilt.

### Notes
- `app.config.js` reads these env vars and injects them into `expo.extra`.
- `app.json` no longer stores secrets.
-

### Option 3: Custom GPT Endpoint

If you have a custom GPT or assistant API endpoint, you can configure it:

```json
{
  "expo": {
    "extra": {
      "openaiApiKey": "sk-your-api-key",
      "customGptEndpoint": "https://api.your-custom-gpt.com/v1/chat/completions",
      "gptModel": "your-custom-model-name"
    }
  }
}
```

## Getting Your OpenAI API Key

**Step-by-Step Instructions:**

1. **Go to OpenAI Platform**: Visit [https://platform.openai.com/](https://platform.openai.com/)
2. **Sign in or create an account**: Use the same account if you created the custom GPT
3. **Navigate to API Keys**:
   - Click on your profile icon (top-right corner)
   - Select **"View API Keys"** from the dropdown menu
   - Or go directly to: [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
4. **Create a new secret key**:
   - Click **"Create new secret key"**
   - Give it a name (e.g., "Dream Journal App")
   - **Important**: Copy the key immediately - it starts with `sk-` and you won't see it again!
5. **Add it to your app**: Paste it in `app.json` under `extra.openaiApiKey`

## Using Your Custom GPT (Dream Weaver)

**Important Note**: Custom GPTs created in ChatGPT (like your [Dream Weaver GPT](https://chatgpt.com/g/g-YZSFCCk4u-dream-weaver)) cannot be directly accessed via API. However, you can recreate its behavior:

### Option 1: Use the API with GPT-4 (Recommended)
The app already uses a Jungian dream analysis system prompt. Just add your API key and it will work similarly to your custom GPT.

### Option 2: Copy Your Custom GPT's Instructions
If you want to use your exact custom GPT's behavior:

1. Go to your [Dream Weaver GPT](https://chatgpt.com/g/g-YZSFCCk4u-dream-weaver)
2. Click the GPT name → **"Edit GPT"** → **"Instructions"** tab
3. Copy the instructions/prompt
4. I can help you update the `SYSTEM_PROMPT` in `src/services/ai.ts` to match your custom GPT's instructions

The API will use GPT-4 with your custom instructions, giving you the same behavior as your custom GPT!

## Security Notes

⚠️ **Important:** Never commit your API keys to version control!

- The `.env` file is already in `.gitignore`
- For production apps, consider using secure key management services
- Rotate your API keys regularly

## Testing

After configuring your API key:
1. Restart your Expo dev server
2. Try generating an interpretation for a dream
3. The app will use the real API if configured, or fall back to mock responses

## Troubleshooting

- **"API key not configured"**: Check that your key is set correctly in `app.json` or `.env`
- **API errors**: Verify your API key is valid and has credits
- **Custom endpoint not working**: Ensure the endpoint follows OpenAI's API format

