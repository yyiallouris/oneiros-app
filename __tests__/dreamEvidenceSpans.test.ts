import {
  buildDreamEvidenceSpanIndex,
  normalizeDreamEvidenceIdList,
  resolveDreamEvidenceIds,
  selectDisplayEvidence,
} from '../src/ai/dreamEvidenceSpans';
import { validateClosedCatalogMythicEcho } from '../src/ai/validators/mythicCatalogValidator';

const DREAM = [
  'I open the sealed copper vessel beside the dry lake.',
  '',
  'The giant rises and threatens me for centuries of captivity.',
  '',
  'I pretend disbelief and ask him to prove he can fit inside again.',
  '',
  'When he shrinks into the vessel I close the lid at once.',
].join('\n');

describe('dream evidence spans (v4.1.2 Patch A)', () => {
  it('builds stable Dn spans and formats the dream body', () => {
    const index = buildDreamEvidenceSpanIndex(DREAM);
    expect(index.spans.length).toBeGreaterThanOrEqual(4);
    expect(index.spans[0].id).toBe('D1');
    expect(index.formattedDream).toMatch(/^\[D1\] /);
    expect(index.byId.D1).toMatch(/sealed copper vessel/);
  });

  it('resolves evidence_ids to exact original spans and rejects unknown ids', () => {
    const ok = resolveDreamEvidenceIds(['D1', 'D4'], DREAM);
    expect(ok.ok).toBe(true);
    if (!ok.ok) return;
    expect(ok.evidence[0]).toBe(buildDreamEvidenceSpanIndex(DREAM).byId.D1);
    expect(ok.evidence[1]).toBe(buildDreamEvidenceSpanIndex(DREAM).byId.D4);

    const bad = resolveDreamEvidenceIds(['D1', 'D99'], DREAM);
    expect(bad.ok).toBe(false);
    if (bad.ok) return;
    expect(bad.reason).toMatch(/unknown_evidence_id:D99/);
  });

  it('normalizeDreamEvidenceIdList dedupes and clamps transport ids', () => {
    expect(
      normalizeDreamEvidenceIdList(['D1', 'D2', 'D1', 'D3', 'D4', 'D5', 'D6', 'D7'], 6)
    ).toEqual(['D1', 'D2', 'D3', 'D4', 'D5', 'D6']);
  });

  it('selectDisplayEvidence spreads first, middle, and last ids for UI', () => {
    expect(selectDisplayEvidence(['D1', 'D2', 'D3', 'D4', 'D5', 'D6'])).toEqual([
      'D1',
      'D3',
      'D6',
    ]);
    expect(selectDisplayEvidence(['D1', 'D2'])).toEqual(['D1', 'D2']);
  });

  it('accepts closed myth via evidence_ids without fuzzy substring matching', () => {
    const index = buildDreamEvidenceSpanIndex(DREAM);
    const result = validateClosedCatalogMythicEcho(
      {
        catalog_id: 'arabian.fisherman_and_jinni',
        resonance: 'A sealed vessel releases a threatening captive who is resealed by cunning.',
        divergence: 'The dream adds a dry lake setting around the reseal bargain.',
        evidence_ids: [index.spans[0].id, index.spans[2].id, index.spans[3].id],
        confidence: 'high',
        evaluation: {
          matched_dimensions: [
            'distinctive_cluster',
            'narrative_sequence',
            'relational_roles',
            'central_conflict',
          ],
          divergence_type: 'outcome_changed',
          disqualifiers_triggered: [],
        },
      },
      { dreamText: DREAM }
    );
    expect(result.reason).toBeUndefined();
    expect(result.echo?.catalog_id).toBe('arabian.fisherman_and_jinni');
    expect(result.echo?.evidence.length).toBeGreaterThanOrEqual(2);
    expect(result.echo?.evidence.every((e) => DREAM.includes(e))).toBe(true);
  });
});
