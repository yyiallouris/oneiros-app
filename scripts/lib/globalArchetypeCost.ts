export type GlobalArchetypeRunCost = {
  estimatedUsd: number | null;
  inputTokens?: number;
  cachedInputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  model?: string;
  provider?: string;
};

export type GlobalArchetypeCostSummary = {
  total_estimated_usd: number | null;
  cost_available_runs: number;
  cost_unavailable_runs: number;
};

export function aggregateGlobalArchetypeCosts(
  costs: Array<GlobalArchetypeRunCost | null | undefined>
): GlobalArchetypeCostSummary {
  let total = 0;
  let available = 0;
  let unavailable = 0;

  for (const cost of costs) {
    const usd = cost?.estimatedUsd;
    if (typeof usd === 'number' && Number.isFinite(usd)) {
      total += usd;
      available += 1;
    } else {
      unavailable += 1;
    }
  }

  return {
    total_estimated_usd: available > 0 ? total : null,
    cost_available_runs: available,
    cost_unavailable_runs: unavailable,
  };
}
