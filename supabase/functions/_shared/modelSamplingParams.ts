/**
 * Sampling-param compatibility for OpenAI / Anthropic model IDs.
 * Used by openai-proxy so fallback models (especially claude-sonnet-5) do not
 * get HTTP 400 from forbidden temperature/top_p/top_k.
 */

export function shouldOmitSamplingTemperature(
  provider: 'openai' | 'anthropic',
  model: string,
): boolean {
  const m = model.trim().toLowerCase();
  if (!m) return false;
  if (provider === 'anthropic') {
    return (
      m.startsWith('claude-sonnet-5') ||
      m.startsWith('claude-opus-5') ||
      /^claude-opus-4-[7-9]/.test(m)
    );
  }
  return /^o\d/.test(m) || m.startsWith('gpt-5');
}

export function temperatureForProvider(
  provider: 'openai' | 'anthropic',
  model: string,
  temperature: unknown,
): number | undefined {
  if (typeof temperature !== 'number' || !Number.isFinite(temperature)) return undefined;
  if (shouldOmitSamplingTemperature(provider, model)) return undefined;
  return temperature;
}
