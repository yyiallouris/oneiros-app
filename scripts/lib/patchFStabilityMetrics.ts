import type { PatchFFixture } from './patchFStabilityFixtures';

export type PatchFRunRow = {
  run_id: string;
  fixture_id: string;
  phase: 1 | 2;
  polarity: PatchFFixture['polarity'];
  required_archetype_ids: string[];
  acceptable_secondary_ids: string[];
  ok: boolean;
  error?: string;
  model: string | null;
  latency_ms: number;
  raw_archetype_ids: string[];
  post_archetype_ids: string[];
  raw_candidate_count: number;
  post_candidate_count: number;
  empty: boolean;
  confidence_by_post_id: Record<string, string | null>;
  mechanism_tags_by_raw_id: Record<string, string[]>;
  evidence_ids_by_raw_id: Record<string, string[]>;
  dream_hash: string;
  system_prompt_hash: string;
  user_prompt_hash: string;
  catalog_hash: string;
  schema_hash: string;
  prompt_version: string;
  catalog_version: string;
  schema_version: number;
  temperature: number;
};

function sortedKey(ids: string[]): string {
  return [...ids].map((x) => x.trim()).filter(Boolean).sort().join('|');
}

function modeKey(keys: string[]): { key: string; count: number } | null {
  if (keys.length === 0) return null;
  const counts = new Map<string, number>();
  for (const k of keys) counts.set(k, (counts.get(k) ?? 0) + 1);
  let best: { key: string; count: number } | null = null;
  for (const [key, count] of counts) {
    if (!best || count > best.count) best = { key, count };
  }
  return best;
}

export type PatchFFixtureReport = {
  fixture_id: string;
  polarity: PatchFFixture['polarity'];
  required_archetype_ids: string[];
  reps_ok: number;
  reps_failed: number;
  required_label_hit_count: number | null;
  empty_count: number;
  repeat_set_consistency: number;
  label_flip_rate: number;
  raw_candidate_flip_rate: number;
  confidence_distribution: Record<string, number>;
  gold_exact_match_count: number;
  gold_exact_match_rate: number;
  post_id_sets: string[];
  raw_id_sets: string[];
  meets_positive_target_ge4: boolean | null;
  meets_positive_floor_ge3: boolean | null;
  meets_negative_empty_ge4: boolean | null;
};

export function scoreFixtureRuns(
  fixture: PatchFFixture,
  runs: PatchFRunRow[]
): PatchFFixtureReport {
  const okRuns = runs.filter((r) => r.ok);
  const required = fixture.required_archetype_ids;
  const requiredHit =
    fixture.polarity === 'positive'
      ? okRuns.filter((r) => required.every((id) => r.post_archetype_ids.includes(id))).length
      : null;
  const emptyCount = okRuns.filter((r) => r.empty).length;

  const postKeys = okRuns.map((r) => sortedKey(r.post_archetype_ids));
  const rawKeys = okRuns.map((r) => sortedKey(r.raw_archetype_ids));
  const postMode = modeKey(postKeys);
  const rawMode = modeKey(rawKeys);
  const repeatSetConsistency =
    okRuns.length === 0 ? 0 : (postMode?.count ?? 0) / okRuns.length;
  const labelFlipRate =
    okRuns.length <= 1 ? 0 : 1 - repeatSetConsistency;
  const rawFlipRate =
    okRuns.length <= 1 ? 0 : 1 - (rawMode ? rawMode.count / okRuns.length : 0);
  const goldKey = fixture.polarity === 'negative' ? '' : sortedKey(required);
  const goldExactMatchCount = okRuns.filter((r) => sortedKey(r.post_archetype_ids) === goldKey).length;
  const goldExactMatchRate = okRuns.length === 0 ? 0 : goldExactMatchCount / okRuns.length;

  const confidence_distribution: Record<string, number> = {};
  for (const r of okRuns) {
    for (const id of r.post_archetype_ids) {
      const c = r.confidence_by_post_id[id] ?? 'missing';
      confidence_distribution[c] = (confidence_distribution[c] ?? 0) + 1;
    }
    if (r.post_archetype_ids.length === 0) {
      confidence_distribution['(empty)'] = (confidence_distribution['(empty)'] ?? 0) + 1;
    }
  }

  const meets_positive_target_ge4 =
    fixture.polarity === 'positive' ? (requiredHit ?? 0) >= 4 : null;
  const meets_positive_floor_ge3 =
    fixture.polarity === 'positive' ? (requiredHit ?? 0) >= 3 : null;
  const meets_negative_empty_ge4 =
    fixture.polarity === 'negative' ? emptyCount >= 4 : null;

  return {
    fixture_id: fixture.id,
    polarity: fixture.polarity,
    required_archetype_ids: required,
    reps_ok: okRuns.length,
    reps_failed: runs.length - okRuns.length,
    required_label_hit_count: requiredHit,
    empty_count: emptyCount,
    repeat_set_consistency: Number(repeatSetConsistency.toFixed(4)),
    label_flip_rate: Number(labelFlipRate.toFixed(4)),
    raw_candidate_flip_rate: Number(rawFlipRate.toFixed(4)),
    confidence_distribution,
    gold_exact_match_count: goldExactMatchCount,
    gold_exact_match_rate: Number(goldExactMatchRate.toFixed(4)),
    post_id_sets: postKeys,
    raw_id_sets: rawKeys,
    meets_positive_target_ge4,
    meets_positive_floor_ge3,
    meets_negative_empty_ge4,
  };
}

export type PatchFSuiteReport = {
  suite_version: string;
  phase1: {
    lover_hit_count: number;
    empty_count: number;
    reps_ok: number;
    target_ge4_of_5_scaled: string;
    lover_rate: number;
    meets_expected_reliability_ge4_of_5_equivalent: boolean;
    runs: PatchFRunRow[];
  };
  phase2_fixtures: PatchFFixtureReport[];
  phase2_summary: {
    positives_total: number;
    positives_ge4: number;
    positives_below3: number;
    negatives_total: number;
    negatives_empty_ge4: number;
    broad_precision_note: string;
  };
};
