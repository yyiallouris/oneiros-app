/**
 * Guards the openai-proxy sampling-param rules that keep Anthropic fallback alive.
 *
 * Flow docs: documentation/flows-06-jungian-ai-reflection.md
 * Proxy docs: supabase/functions/openai-proxy/README.md (Sampling params)
 */
import {
  shouldOmitSamplingTemperature,
  temperatureForProvider,
} from '../../supabase/functions/_shared/modelSamplingParams';

describe('openai-proxy sampling params (fallback safety)', () => {
  it('omits temperature for Claude Sonnet 5 (Anthropic 400 otherwise)', () => {
    expect(shouldOmitSamplingTemperature('anthropic', 'claude-sonnet-5')).toBe(true);
    expect(temperatureForProvider('anthropic', 'claude-sonnet-5', 0.6)).toBeUndefined();
    expect(shouldOmitSamplingTemperature('anthropic', 'claude-haiku-4-5')).toBe(false);
    expect(temperatureForProvider('anthropic', 'claude-haiku-4-5', 0.6)).toBe(0.6);
  });

  it('omits temperature for gpt-5 / o-series OpenAI models', () => {
    expect(shouldOmitSamplingTemperature('openai', 'gpt-5.4')).toBe(true);
    expect(temperatureForProvider('openai', 'gpt-5.4', 0.55)).toBeUndefined();
    expect(shouldOmitSamplingTemperature('openai', 'gpt-5.4-mini')).toBe(true);
    expect(shouldOmitSamplingTemperature('openai', 'o3-mini')).toBe(true);
  });
});
