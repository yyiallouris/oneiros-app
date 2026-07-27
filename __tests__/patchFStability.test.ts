import {
  PATCH_F_PHASE1_FIXTURE,
  PATCH_F_PHASE2_FIXTURES,
  PATCH_F_PHASE2_NEGATIVES,
  PATCH_F_PHASE2_POSITIVES,
  validatePatchFFixtures,
} from '../scripts/lib/patchFStabilityFixtures';
import { scoreFixtureRuns, type PatchFRunRow } from '../scripts/lib/patchFStabilityMetrics';
import { extractCompactLoverCatalogRecord } from '../scripts/lib/patchFStabilityRunner';
import { ARCHETYPE_CATALOG_VERSION } from '../src/ai/catalogs/archetypeCatalog.v1';

describe('Patch F diagnostic fixtures', () => {
  it('validates phase1 + phase2 fixture set sizes', () => {
    validatePatchFFixtures([PATCH_F_PHASE1_FIXTURE, ...PATCH_F_PHASE2_FIXTURES]);
    expect(PATCH_F_PHASE2_POSITIVES).toHaveLength(13);
    expect(PATCH_F_PHASE2_NEGATIVES).toHaveLength(8);
  });

  it('proves Lover catalog 1.7.0 compact injection contains mutual-intimacy calibration', () => {
    expect(ARCHETYPE_CATALOG_VERSION).toBe('1.7.0');
    const proof = extractCompactLoverCatalogRecord();
    expect(proof.present_in_injected_catalog).toBe(true);
    expect(proof.compact_prompt_record).toContain('id=lover');
    expect(proof.compact_prompt_record).toMatch(/mutual intimacy|shared orientation|bond itself/i);
  });

  it('scores required hits / empty / flip metrics', () => {
    const fixture = PATCH_F_PHASE2_POSITIVES[0];
    const mk = (post: string[], raw: string[]): PatchFRunRow => ({
      run_id: 't',
      fixture_id: fixture.id,
      phase: 2,
      polarity: 'positive',
      required_archetype_ids: fixture.required_archetype_ids,
      acceptable_secondary_ids: [],
      ok: true,
      model: 'gpt-5.4-mini',
      latency_ms: 1,
      raw_archetype_ids: raw,
      post_archetype_ids: post,
      raw_candidate_count: raw.length,
      post_candidate_count: post.length,
      empty: post.length === 0,
      confidence_by_post_id: post.length ? { [post[0]]: 'medium' } : {},
      mechanism_tags_by_raw_id: {},
      evidence_ids_by_raw_id: {},
      dream_hash: 'x',
      system_prompt_hash: 'x',
      user_prompt_hash: 'x',
      catalog_hash: 'x',
      schema_hash: 'x',
      prompt_version: '4.1.9-M1',
      catalog_version: '1.7.0',
      schema_version: 13,
      temperature: 0,
    });
    const report = scoreFixtureRuns(fixture, [
      mk(['lover'], ['lover']),
      mk(['lover'], ['lover']),
      mk([], []),
      mk(['lover'], ['lover']),
      mk(['lover'], ['lover']),
    ]);
    expect(report.required_label_hit_count).toBe(4);
    expect(report.empty_count).toBe(1);
    expect(report.meets_positive_target_ge4).toBe(true);
    expect(report.label_flip_rate).toBeGreaterThan(0);
    expect(report.repeat_set_consistency).toBeLessThan(1);
    expect(report.gold_exact_match_count).toBe(4);
  });

  it('marks negative required hits as N/A and scores exact-empty against gold', () => {
    const fixture = PATCH_F_PHASE2_NEGATIVES[0];
    const mk = (post: string[], raw: string[]): PatchFRunRow => ({
      run_id: 'n',
      fixture_id: fixture.id,
      phase: 2,
      polarity: 'negative',
      required_archetype_ids: [],
      acceptable_secondary_ids: [],
      ok: true,
      model: 'gpt-5.4-mini',
      latency_ms: 1,
      raw_archetype_ids: raw,
      post_archetype_ids: post,
      raw_candidate_count: raw.length,
      post_candidate_count: post.length,
      empty: post.length === 0,
      confidence_by_post_id: post.length ? { [post[0]]: 'medium' } : {},
      mechanism_tags_by_raw_id: {},
      evidence_ids_by_raw_id: {},
      dream_hash: 'x',
      system_prompt_hash: 'x',
      user_prompt_hash: 'x',
      catalog_hash: 'x',
      schema_hash: 'x',
      prompt_version: '4.1.7-E.1',
      catalog_version: '1.6.0',
      schema_version: 12,
      temperature: 0,
    });
    const report = scoreFixtureRuns(fixture, [
      mk([], []),
      mk([], []),
      mk(['wise_old_woman'], ['wise_old_woman']),
      mk([], []),
      mk([], []),
    ]);
    expect(report.required_label_hit_count).toBeNull();
    expect(report.gold_exact_match_count).toBe(4);
    expect(report.gold_exact_match_rate).toBe(0.8);
    expect(report.repeat_set_consistency).toBe(0.8);
  });
});
