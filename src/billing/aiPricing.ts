/**
 * Monthly-updated AI model pricing table (USD per 1M tokens).
 *
 * Update cadence: refresh rates about once a month from provider docs.
 * Sources checked 2026-07-24:
 * - OpenAI Standard / short-context: https://developers.openai.com/api/docs/pricing
 * - Anthropic Claude API: https://docs.anthropic.com/en/docs/about-claude/pricing
 *
 * Claude Sonnet 5 intro rates ($2 / $10 per 1M) apply through 2026-08-31; after that
 * update to standard $3 / $15 when refreshing this table.

 * Used by edge gateway cost logs and client `ai_step_token_cost` estimates.
 * Lookup is dynamic by provider + model prefix — never hardcode rates at call sites.
 */

export type AiProviderPricingRow = {
  inputUsdPer1m: number;
  cachedInputUsdPer1m: number;
  outputUsdPer1m: number;
};

export type AiCallCost = {
  provider: string | null;
  model: string | null;
  pricingModel: string | null;
  pricingSource: string;
  inputTokens: number;
  cachedInputTokens: number;
  billableInputTokens: number;
  outputTokens: number;
  totalTokens: number;
  inputUsd: number | null;
  cachedInputUsd: number | null;
  outputUsd: number | null;
  estimatedUsd: number | null;
};

export const AI_PRICING_CHECKED_AT = '2026-07-24';
export const UNKNOWN_PRICING_SOURCE = 'unknown_provider_or_model';
export const OPENAI_STANDARD_PRICING_SOURCE = `openai_standard_short_context_${AI_PRICING_CHECKED_AT.replace(/-/g, '_')}`;
export const ANTHROPIC_STANDARD_PRICING_SOURCE = `anthropic_standard_${AI_PRICING_CHECKED_AT.replace(/-/g, '_')}`;
export const USD_TO_EUR_ESTIMATE = 0.855;

/** Provider → model-prefix → rates. Longest prefix wins. */
export const AI_PROVIDER_PRICING_USD_PER_1M: Record<string, Record<string, AiProviderPricingRow>> = {
  openai: {
    'gpt-5.6-sol': { inputUsdPer1m: 5, cachedInputUsdPer1m: 0.5, outputUsdPer1m: 30 },
    'gpt-5.6-terra': { inputUsdPer1m: 2.5, cachedInputUsdPer1m: 0.25, outputUsdPer1m: 15 },
    'gpt-5.6-luna': { inputUsdPer1m: 1, cachedInputUsdPer1m: 0.1, outputUsdPer1m: 6 },
    'gpt-5.5-pro': { inputUsdPer1m: 30, cachedInputUsdPer1m: 30, outputUsdPer1m: 180 },
    'gpt-5.5': { inputUsdPer1m: 5, cachedInputUsdPer1m: 0.5, outputUsdPer1m: 30 },
    'gpt-5.4-pro': { inputUsdPer1m: 30, cachedInputUsdPer1m: 30, outputUsdPer1m: 180 },
    'gpt-5.4-mini': { inputUsdPer1m: 0.75, cachedInputUsdPer1m: 0.075, outputUsdPer1m: 4.5 },
    'gpt-5.4-nano': { inputUsdPer1m: 0.2, cachedInputUsdPer1m: 0.02, outputUsdPer1m: 1.25 },
    'gpt-5.4': { inputUsdPer1m: 2.5, cachedInputUsdPer1m: 0.25, outputUsdPer1m: 15 },
  },
  anthropic: {
    // Claude Sonnet 5 intro API through 2026-08-31: $2 / $10 per 1M; cache hits $0.20 / 1M.
    'claude-sonnet-5': { inputUsdPer1m: 2, cachedInputUsdPer1m: 0.2, outputUsdPer1m: 10 },
    // Claude Haiku 4.5 standard API: $1 / $5 per 1M; cache hits $0.10 / 1M.
    'claude-haiku-4-5': { inputUsdPer1m: 1, cachedInputUsdPer1m: 0.1, outputUsdPer1m: 5 },
    'claude-haiku-4': { inputUsdPer1m: 1, cachedInputUsdPer1m: 0.1, outputUsdPer1m: 5 },
  },
};

const PRICING_MODEL_ORDER_BY_PROVIDER: Record<string, string[]> = Object.fromEntries(
  Object.entries(AI_PROVIDER_PRICING_USD_PER_1M).map(([provider, rows]) => [
    provider,
    Object.keys(rows).sort((a, b) => b.length - a.length),
  ])
);

function asFiniteNumber(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
}

function centsSafeUsd(tokens: number, usdPer1m: number): number {
  return (tokens * usdPer1m) / 1_000_000;
}

function roundUsd(value: number): number {
  return Number(value.toFixed(8));
}

function normalizeProvider(provider: string | null | undefined): string | null {
  if (!provider) return null;
  const normalized = provider.trim().toLowerCase();
  if (normalized === 'openai') return 'openai';
  if (normalized === 'anthropic') return 'anthropic';
  return null;
}

export function normalizePricingModel(
  provider: string | null | undefined,
  model: string | null | undefined
): string | null {
  const normalizedProvider = normalizeProvider(provider);
  if (!normalizedProvider || !model) return null;
  const normalizedModel = model.trim().toLowerCase();
  const order = PRICING_MODEL_ORDER_BY_PROVIDER[normalizedProvider] ?? [];
  return order.find((pricingModel) => normalizedModel.startsWith(pricingModel)) ?? null;
}

function pricingSourceForProvider(provider: string): string {
  if (provider === 'openai') return OPENAI_STANDARD_PRICING_SOURCE;
  if (provider === 'anthropic') return ANTHROPIC_STANDARD_PRICING_SOURCE;
  return UNKNOWN_PRICING_SOURCE;
}

export function estimateAiCallCost(
  payload: Record<string, unknown>,
  provider: string | null
): AiCallCost {
  const usage =
    payload.usage && typeof payload.usage === 'object'
      ? (payload.usage as Record<string, unknown>)
      : {};
  const promptDetails =
    usage.prompt_tokens_details && typeof usage.prompt_tokens_details === 'object'
      ? (usage.prompt_tokens_details as Record<string, unknown>)
      : {};
  const model = typeof payload.model === 'string' ? payload.model : null;
  const inputTokens = asFiniteNumber(usage.prompt_tokens);
  const outputTokens = asFiniteNumber(usage.completion_tokens);
  const totalTokens = asFiniteNumber(usage.total_tokens) || inputTokens + outputTokens;
  const cachedInputTokens = Math.min(asFiniteNumber(promptDetails.cached_tokens), inputTokens);
  const billableInputTokens = Math.max(inputTokens - cachedInputTokens, 0);

  const normalizedProvider = normalizeProvider(provider);
  const pricingModel = normalizePricingModel(normalizedProvider, model);
  const pricing =
    normalizedProvider && pricingModel
      ? AI_PROVIDER_PRICING_USD_PER_1M[normalizedProvider]?.[pricingModel] ?? null
      : null;

  if (!normalizedProvider || !pricingModel || !pricing) {
    return {
      provider,
      model,
      pricingModel: null,
      pricingSource: UNKNOWN_PRICING_SOURCE,
      inputTokens,
      cachedInputTokens,
      billableInputTokens,
      outputTokens,
      totalTokens,
      inputUsd: null,
      cachedInputUsd: null,
      outputUsd: null,
      estimatedUsd: null,
    };
  }

  const inputUsd = centsSafeUsd(billableInputTokens, pricing.inputUsdPer1m);
  const cachedInputUsd = centsSafeUsd(cachedInputTokens, pricing.cachedInputUsdPer1m);
  const outputUsd = centsSafeUsd(outputTokens, pricing.outputUsdPer1m);

  return {
    provider,
    model,
    pricingModel,
    pricingSource: pricingSourceForProvider(normalizedProvider),
    inputTokens,
    cachedInputTokens,
    billableInputTokens,
    outputTokens,
    totalTokens,
    inputUsd: roundUsd(inputUsd),
    cachedInputUsd: roundUsd(cachedInputUsd),
    outputUsd: roundUsd(outputUsd),
    estimatedUsd: roundUsd(inputUsd + cachedInputUsd + outputUsd),
  };
}

/** Lightweight helper for client-side step logs (no cached split when usage details are absent). */
export function estimateSimpleTokenCost(
  provider: string | null | undefined,
  model: string | null | undefined,
  promptTokens: number,
  completionTokens: number
): { usd: number; eur: number; rateKey: string; pricingSource: string } | null {
  const cost = estimateAiCallCost(
    {
      model: typeof model === 'string' ? model : null,
      usage: {
        prompt_tokens: promptTokens,
        completion_tokens: completionTokens,
        total_tokens: promptTokens + completionTokens,
      },
    },
    typeof provider === 'string' ? provider : normalizeProviderFromModel(model)
  );
  if (typeof cost.estimatedUsd !== 'number' || !cost.pricingModel) return null;
  return {
    usd: cost.estimatedUsd,
    eur: cost.estimatedUsd * USD_TO_EUR_ESTIMATE,
    rateKey: cost.pricingModel,
    pricingSource: cost.pricingSource,
  };
}

function normalizeProviderFromModel(model: string | null | undefined): string | null {
  if (typeof model !== 'string') return null;
  const m = model.toLowerCase();
  if (m.includes('claude')) return 'anthropic';
  if (m.includes('gpt-')) return 'openai';
  return null;
}
