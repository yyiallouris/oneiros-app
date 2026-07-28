import {
  buildArchetypeRecognitionAuditRows,
  mapArchetypeRecognitionToArchetypalEchoes,
} from '../src/ai/archetypeRecognitionMapper';
import type { ArchetypeRecognitionResponse } from '../src/ai/schemas/archetypeRecognitionSchema';

const DREAM =
  'Είδα ένα όνειρο. Ήμουν ξαπλωμένη σε ένα θαλάσσιο στρώμα, σε μια πολύ γαλήνια θάλασσα, και πάνω μου ήταν ξαπλωμένος ο φίλος μου. Κοιτούσαμε μαζί τον βυθό.';

describe('archetypeRecognitionMapper', () => {
  it('maps validated recognition output into the existing echo shape', () => {
    const response: ArchetypeRecognitionResponse = {
      archetypes: [
        {
          archetype_id: 'lover',
          quality: 'ήρεμη αμοιβαία ερωτική οικειότητα',
          expression: 'η σωματική εγγύτητα και το κοινό βλέμμα προς τον βυθό',
          resonance:
            'Ο δεσμός οργανώνει ολόκληρη τη σκηνή και κάνει το βάθος να βιώνεται ως ασφαλές και από κοινού εξερευνήσιμο.',
          confidence: 'high',
          evidence_ids: ['D1'],
        },
      ],
    };

    const mapped = mapArchetypeRecognitionToArchetypalEchoes(response, { dreamText: DREAM });
    expect(mapped).toHaveLength(1);
    expect(mapped[0]).toMatchObject({
      archetype_id: 'lover',
      canonical_label: 'Lover',
      confidence: 'high',
      evidence_ids: ['D1'],
    });
    expect(mapped[0].evidence).toHaveLength(1);
  });

  it('keeps quality only in audit rows and does not mutate the input payload', () => {
    const response: ArchetypeRecognitionResponse = {
      archetypes: [
        {
          archetype_id: 'guide_psychopomp',
          quality: 'καθοδήγηση στο πέρασμα',
          expression: 'ο γέροντας που δείχνει τον δρόμο',
          resonance: 'Η μορφή κρατά το πέρασμα ανάμεσα σε δύο τρόπους ύπαρξης.',
          confidence: 'medium',
          evidence_ids: ['D1'],
        },
      ],
    };
    const frozen = JSON.parse(JSON.stringify(response));

    const audit = buildArchetypeRecognitionAuditRows(response, { dreamText: DREAM });
    expect(audit[0]).toMatchObject({
      archetype_id: 'guide_psychopomp',
      canonical_label: 'Guide / Psychopomp',
      quality: 'καθοδήγηση στο πέρασμα',
    });
    expect(response).toEqual(frozen);
  });
});
