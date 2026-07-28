import {
  ARCHETYPE_ADJUDICATION_SCHEMA_VERSION,
  buildArchetypeAdjudicationResponseFormat,
  validateArchetypeAdjudicationResponse,
} from '../src/ai/schemas/archetypeAdjudicationSchema';

const DREAM =
  'Είδα ένα όνειρο. Ήμουν ξαπλωμένη σε ένα θαλάσσιο στρώμα και πάνω μου ήταν ξαπλωμένος ο φίλος μου, ενώ μαζί κοιτούσαμε τον βυθό.';

describe('archetypeAdjudicationSchema', () => {
  it('exports schema v1 response_format', () => {
    const responseFormat = buildArchetypeAdjudicationResponseFormat();
    expect(ARCHETYPE_ADJUDICATION_SCHEMA_VERSION).toBe('1');
    expect(responseFormat.type).toBe('json_schema');
    expect(responseFormat.json_schema.schema).toMatchObject({
      type: 'object',
      required: ['decisions', 'accepted_archetype_ids'],
    });
  });

  it('accepts a valid adjudication packet', () => {
    const result = validateArchetypeAdjudicationResponse(
      JSON.stringify({
        decisions: [
          {
            archetype_id: 'lover',
            decision: 'accept',
            decisive_feature: 'η σωματική οικειότητα του ζεύγους',
            reason: 'Η σκηνή οργανώνεται από ζευγαρωμένη σωματική εγγύτητα και κοινό κατοικημένο βάθος.',
            evidence_ids: ['D1'],
          },
        ],
        accepted_archetype_ids: ['lover'],
      }),
      { dreamText: DREAM, targetLanguageHint: 'el' }
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.accepted_archetype_ids).toEqual(['lover']);
    expect(result.checkedFieldCount).toBe(2);
  });

  it('rejects mismatched accepted ids and wrong-language output', () => {
    const mismatch = validateArchetypeAdjudicationResponse(
      JSON.stringify({
        decisions: [
          {
            archetype_id: 'lover',
            decision: 'reject',
            decisive_feature: null,
            reason: 'Only companionship is shown here.',
            evidence_ids: ['D1'],
          },
        ],
        accepted_archetype_ids: ['lover'],
      }),
      { dreamText: DREAM, targetLanguageHint: 'el' }
    );
    expect(mismatch.ok).toBe(false);
    if (!mismatch.ok) expect(mismatch.issues).toContain('accepted_ids_mismatch');

    const wrongLanguage = validateArchetypeAdjudicationResponse(
      JSON.stringify({
        decisions: [
          {
            archetype_id: 'lover',
            decision: 'accept',
            decisive_feature: 'body-level pair-bonded intimacy',
            reason: 'The pair-bond reorganizes the whole field.',
            evidence_ids: ['D1'],
          },
        ],
        accepted_archetype_ids: ['lover'],
      }),
      { dreamText: DREAM, targetLanguageHint: 'el' }
    );
    expect(wrongLanguage.ok).toBe(false);
    if (!wrongLanguage.ok) expect(wrongLanguage.issues).toContain('language_validation_failed');
  });
});
