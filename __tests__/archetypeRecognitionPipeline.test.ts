import {
  applyArchetypeAdjudicationToRecognition,
  evaluateArchetypeSetExpectation,
  mapAdjudicatedRecognitionToArchetypalEchoes,
} from '../src/ai/archetypeRecognitionPipeline';

const DREAM =
  'I dreamed my partner and I were trying to catch a train and kept discussing tickets, luggage, and the right platform while hurrying through the station.';

describe('archetypeRecognitionPipeline', () => {
  it('preserves discovery wording for accepted candidates and discards rejected ones', () => {
    const discoveryResponse = {
      archetypes: [
        {
          archetype_id: 'lover' as const,
          quality: 'beloved pair-bond',
          expression: 'body-level shared closeness',
          resonance: 'The bond makes the field feel quietly shared.',
          confidence: 'high' as const,
          evidence_ids: ['D1'],
        },
        {
          archetype_id: 'guide_psychopomp' as const,
          quality: 'threshold guidance',
          expression: 'movement through transit space',
          resonance: 'The station scene suggests passage.',
          confidence: 'medium' as const,
          evidence_ids: ['D1'],
        },
      ],
    };
    const adjudicationResponse = {
      decisions: [
        {
          archetype_id: 'lover' as const,
          decision: 'accept' as const,
          decisive_feature: 'pair-bonded bodily intimacy',
          reason: 'The one-to-one embodied bond changes the meaning of the whole scene.',
          evidence_ids: ['D1'],
        },
        {
          archetype_id: 'guide_psychopomp' as const,
          decision: 'reject' as const,
          decisive_feature: null,
          reason: 'Transit alone does not establish a mediating guide.',
          evidence_ids: ['D1'],
        },
      ],
      accepted_archetype_ids: ['lover' as const],
    };

    const applied = applyArchetypeAdjudicationToRecognition(
      discoveryResponse,
      adjudicationResponse
    );
    expect(applied.ok).toBe(true);
    if (!applied.ok) return;
    expect(applied.acceptedArchetypeIds).toEqual(['lover']);
    expect(applied.filteredResponse.archetypes).toEqual([discoveryResponse.archetypes[0]]);

    const echoes = mapAdjudicatedRecognitionToArchetypalEchoes(
      discoveryResponse,
      adjudicationResponse,
      { dreamText: 'I dreamed I was lying with my beloved on a floating raft over quiet deep water.' }
    );
    expect(echoes).toHaveLength(1);
    expect(echoes[0]).toMatchObject({
      archetype_id: 'lover',
      expression: 'body-level shared closeness',
      resonance: 'The bond makes the field feel quietly shared.',
    });
  });

  it('fails when adjudication accepts ids that were never discovered', () => {
    const applied = applyArchetypeAdjudicationToRecognition(
      {
        archetypes: [
          {
            archetype_id: 'guide_psychopomp',
            quality: 'crossing help',
            expression: 'a driver in motion',
            resonance: 'A transit worker appears in the station.',
            confidence: 'medium',
            evidence_ids: ['D1'],
          },
        ],
      },
      {
        decisions: [
          {
            archetype_id: 'guide_psychopomp',
            decision: 'reject',
            decisive_feature: null,
            reason: 'The driver only handles logistics.',
            evidence_ids: ['D1'],
          },
        ],
        accepted_archetype_ids: ['lover'],
      }
    );
    expect(applied.ok).toBe(false);
    if (!applied.ok) expect(applied.issues).toContain('accepted_without_candidate');
  });

  it('uses exact allowed-set scoring and fails unexpected labels', () => {
    const exactEmpty = evaluateArchetypeSetExpectation([], {
      required_archetype_ids: [],
      allowed_secondary_archetype_ids: [],
    });
    expect(exactEmpty.pass).toBe(true);

    const incidentalPartner = evaluateArchetypeSetExpectation(['guide_psychopomp'], {
      required_archetype_ids: [],
      allowed_secondary_archetype_ids: [],
    });
    expect(incidentalPartner.pass).toBe(false);
    expect(incidentalPartner.unexpectedIds).toEqual(['guide_psychopomp']);

    const romanceCueOnly = evaluateArchetypeSetExpectation(['persona'], {
      required_archetype_ids: [],
      allowed_secondary_archetype_ids: [],
    });
    expect(romanceCueOnly.pass).toBe(false);
    expect(romanceCueOnly.unexpectedIds).toEqual(['persona']);
  });
});
