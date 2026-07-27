import { summarizeHeroArchetypeTelemetry } from '../src/ai/archetypeEchoTelemetry';
import type { ArchetypalValidationResult } from '../src/ai/validators/archetypalEchoValidator';
import { ARCHETYPE_CATALOG_VERSION } from '../src/ai/catalogs/archetypeCatalog.v1';

describe('summarizeHeroArchetypeTelemetry', () => {
  it('aggregates Hero raw/post/rejection and confidence without dream text', () => {
    const rawCandidates = [
      {
        archetype_id: 'hero',
        expression: 'Rescue',
        resonance: 'A crossing completed.',
        mechanism_tags: [
          'ordeal_or_confrontation',
          'purposeful_quest_movement',
          'boon_or_changed_outcome',
        ],
        confidence: 'high',
      },
      {
        archetype_id: 'hero',
        expression: 'Attempted crossing',
        resonance: 'The dream pushes toward a trial without completion.',
        mechanism_tags: ['ordeal_or_confrontation'],
        confidence: 'medium',
      },
      {
        archetype_id: 'guide_psychopomp',
        expression: 'Threshold escort',
        resonance: 'A guide shifts the crossing.',
        mechanism_tags: ['active_threshold_guidance'],
      },
    ];

    const validation: ArchetypalValidationResult = {
      accepted: [
        {
          archetype_id: 'hero',
          archetype_catalog_version: ARCHETYPE_CATALOG_VERSION,
          canonical_label: 'Hero',
          expression: 'Rescue',
          resonance: 'A crossing completed.',
          evidence: ['carried the child'],
          evidence_ids: ['D1'],
          confidence: 'high',
        },
      ],
      rejected: [
        {
          echo: rawCandidates[1],
          reason: 'missing_required_mechanism:boon_or_changed_outcome',
        },
      ],
    };

    expect(
      summarizeHeroArchetypeTelemetry({
        rawCandidates,
        validation,
      })
    ).toMatchObject({
      hero_raw_count: 2,
      hero_post_count: 1,
      hero_rejected_mechanism_count: 1,
      accepted_confidence_high: 1,
      accepted_confidence_medium: 0,
    });
    expect(
      summarizeHeroArchetypeTelemetry({ rawCandidates, validation }).accepted_mechanism_tags.sort()
    ).toEqual([
      'boon_or_changed_outcome',
      'ordeal_or_confrontation',
      'purposeful_quest_movement',
    ]);
  });
});
