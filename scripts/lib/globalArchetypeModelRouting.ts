import type { GlobalArchetypeRunRecord } from './globalArchetypeRunRecord';
import type { GlobalArchetypeAggregateMetrics } from './globalArchetypeBenchmark';
import { computeGlobalArchetypeMetrics, type GlobalArchetypeRunMetricsInput } from './globalArchetypeBenchmark';

export const GLOBAL_ARCHETYPE_PRIMARY_MODEL_PREFIX = 'gpt-5.4-mini';

export function isPrimaryArchetypeBenchmarkModel(model: string | null | undefined): boolean {
  if (!model || typeof model !== 'string') return false;
  return model.startsWith(GLOBAL_ARCHETYPE_PRIMARY_MODEL_PREFIX);
}

export function isFallbackArchetypeBenchmarkModel(model: string | null | undefined): boolean {
  if (!model) return false;
  return !isPrimaryArchetypeBenchmarkModel(model);
}

export type ModelRoutingMetrics = {
  primary_model: typeof GLOBAL_ARCHETYPE_PRIMARY_MODEL_PREFIX;
  primary_model_runs: number;
  fallback_model_runs: number;
  fallback_rate: number;
  runs_by_model: Record<string, number>;
  metrics_by_model: Record<string, GlobalArchetypeAggregateMetrics>;
};

export function computeModelRoutingMetrics(
  runs: GlobalArchetypeRunRecord[],
  toMetricsInput: (record: GlobalArchetypeRunRecord) => GlobalArchetypeRunMetricsInput
): ModelRoutingMetrics {
  const runs_by_model: Record<string, number> = {};
  let primary_model_runs = 0;
  let fallback_model_runs = 0;

  for (const run of runs) {
    const model = run.model ?? 'unknown';
    runs_by_model[model] = (runs_by_model[model] ?? 0) + 1;
    if (isPrimaryArchetypeBenchmarkModel(run.model)) primary_model_runs += 1;
    else fallback_model_runs += 1;
  }

  const metrics_by_model: Record<string, GlobalArchetypeAggregateMetrics> = {};
  for (const model of Object.keys(runs_by_model)) {
    const subset = runs.filter((r) => (r.model ?? 'unknown') === model);
    metrics_by_model[model] = computeGlobalArchetypeMetrics(subset.map(toMetricsInput));
  }

  const total = runs.length;
  return {
    primary_model: GLOBAL_ARCHETYPE_PRIMARY_MODEL_PREFIX,
    primary_model_runs,
    fallback_model_runs,
    fallback_rate: total ? fallback_model_runs / total : 0,
    runs_by_model,
    metrics_by_model,
  };
}

export function classifyProxyError(errorMessage: string): string {
  const msg = errorMessage.toLowerCase();
  if (msg.includes('429') || msg.includes('rate limit')) return 'rate_limit_exceeded';
  if (msg.includes('fallback') || msg.includes('claude-haiku')) return 'fallback_model_used';
  if (msg.includes('502') || msg.includes('503') || msg.includes('504')) return 'upstream_unavailable';
  return 'proxy_error';
}
