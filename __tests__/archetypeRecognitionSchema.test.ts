import {
  ARCHETYPE_RECOGNITION_SCHEMA_VERSION,
  buildArchetypeRecognitionResponseFormat,
  validateArchetypeRecognitionResponse,
} from '../src/ai/schemas/archetypeRecognitionSchema';

const DREAM =
  'Είδα ένα όνειρο. Ήμουν ξαπλωμένη σε ένα θαλάσσιο στρώμα και πάνω μου ήταν ξαπλωμένος ο φίλος μου, ενώ μαζί κοιτούσαμε τον βυθό.';

describe('archetypeRecognitionSchema', () => {
  it('exports schema v1 response_format', () => {
    const responseFormat = buildArchetypeRecognitionResponseFormat();
    expect(ARCHETYPE_RECOGNITION_SCHEMA_VERSION).toBe('1');
    expect(responseFormat.type).toBe('json_schema');
    expect(responseFormat.json_schema.schema).toMatchObject({
      type: 'object',
      required: ['archetypes'],
    });
  });

  it('accepts a valid recognition packet with one evidence span', () => {
    const result = validateArchetypeRecognitionResponse(
      JSON.stringify({
        archetypes: [
          {
            archetype_id: 'lover',
            quality: 'ήρεμη αμοιβαία ερωτική οικειότητα',
            expression: 'η κοινή σωματική εγγύτητα πάνω στο στρώμα',
            resonance:
              'Ο δεσμός οργανώνει τη σκηνή και κάνει το βάθος να βιώνεται ως κοινά κατοικήσιμο.',
            confidence: 'high',
            evidence_ids: ['D1'],
          },
        ],
      }),
      { dreamText: DREAM, targetLanguageHint: 'el' }
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.archetypes[0].archetype_id).toBe('lover');
    expect(result.checkedFieldCount).toBe(3);
  });

  it('rejects duplicate ids, bad evidence ids, and language mismatch', () => {
    const duplicate = validateArchetypeRecognitionResponse(
      JSON.stringify({
        archetypes: [
          {
            archetype_id: 'lover',
            quality: 'ήρεμη οικειότητα',
            expression: 'κοινό βλέμμα',
            resonance: 'Ο δεσμός οργανώνει τη σκηνή.',
            confidence: 'high',
            evidence_ids: ['D1'],
          },
          {
            archetype_id: 'lover',
            quality: 'δεύτερη εκδοχή',
            expression: 'άλλη εκδοχή',
            resonance: 'Η ίδια ποιότητα επαναλαμβάνεται.',
            confidence: 'medium',
            evidence_ids: ['D1'],
          },
        ],
      }),
      { dreamText: DREAM, targetLanguageHint: 'el' }
    );
    expect(duplicate.ok).toBe(false);
    if (duplicate.ok) return;
    expect(duplicate.issues).toContain('duplicate_archetype_id');

    const badEvidence = validateArchetypeRecognitionResponse(
      JSON.stringify({
        archetypes: [
          {
            archetype_id: 'lover',
            quality: 'ήρεμη οικειότητα',
            expression: 'κοινό βλέμμα',
            resonance: 'Ο δεσμός οργανώνει τη σκηνή.',
            confidence: 'high',
            evidence_ids: ['DX'],
          },
        ],
      }),
      { dreamText: DREAM, targetLanguageHint: 'el' }
    );
    expect(badEvidence.ok).toBe(false);
    if (!badEvidence.ok) expect(badEvidence.issues).toContain('schema_invalid');

    const wrongLanguage = validateArchetypeRecognitionResponse(
      JSON.stringify({
        archetypes: [
          {
            archetype_id: 'lover',
            quality: 'serene mutual intimacy',
            expression: 'the shared closeness on the mattress',
            resonance: 'The bond organizes the scene and makes the depth feel safely shared.',
            confidence: 'high',
            evidence_ids: ['D1'],
          },
        ],
      }),
      { dreamText: DREAM, targetLanguageHint: 'el' }
    );
    expect(wrongLanguage.ok).toBe(false);
    if (!wrongLanguage.ok) expect(wrongLanguage.issues).toContain('language_validation_failed');
  });
});
