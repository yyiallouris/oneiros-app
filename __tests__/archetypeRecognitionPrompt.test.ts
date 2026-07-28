import {
  ARCHETYPE_RECOGNITION_MODEL,
  ARCHETYPE_RECOGNITION_PROMPT_ID,
  ARCHETYPE_RECOGNITION_PROMPT_VERSION,
  buildArchetypeRecognitionSystemPrompt,
  buildArchetypeRecognitionUserPrompt,
  estimateArchetypeRecognitionPromptTokens,
} from '../src/ai/archetypeRecognitionPrompt';
import {
  ARCHETYPE_RECOGNITION_CATALOG_V2,
  ARCHETYPE_RECOGNITION_CATALOG_VERSION,
  archetypeRecognitionRecordWordCount,
} from '../src/ai/catalogs/archetypeRecognitionCatalog.v2';
import { ARCHETYPE_RECOGNITION_SCHEMA_VERSION } from '../src/ai/schemas/archetypeRecognitionSchema';

describe('archetypeRecognitionPrompt', () => {
  it('exposes the isolated spike versions', () => {
    expect(ARCHETYPE_RECOGNITION_PROMPT_ID).toBe('dream-archetype-recognition-v1.0.0');
    expect(ARCHETYPE_RECOGNITION_PROMPT_VERSION).toBe('1.0.0');
    expect(ARCHETYPE_RECOGNITION_SCHEMA_VERSION).toBe('1');
    expect(ARCHETYPE_RECOGNITION_CATALOG_VERSION).toBe('2.0.0');
    expect(ARCHETYPE_RECOGNITION_MODEL).toBe('gpt-5.4-mini-2026-03-17');
  });

  it('keeps the system prompt focused on standalone recognition only', () => {
    const prompt = buildArchetypeRecognitionSystemPrompt({ code: 'el', name: 'Greek' });
    expect(prompt).toContain('ARCHETYPE RECOGNITION');
    expect(prompt).toContain('dream-archetype-recognition-v1.0.0');
    expect(prompt).toContain('Mutual erotic, intimate, or beloved relatedness');
    expect(prompt).not.toContain('prefer []');
    expect(prompt).not.toContain('silence is preferable');
    expect(prompt).not.toContain('mechanism_tags');
    expect(prompt).not.toContain('central_conflicts');
    expect(prompt).not.toContain('Dream Fabric');
    expect(prompt).not.toContain('myth');
    expect(prompt).not.toContain('reflection');
  });

  it('stays under the hard prompt-size target', () => {
    const prompt = buildArchetypeRecognitionSystemPrompt({ code: 'en', name: 'English' });
    expect(estimateArchetypeRecognitionPromptTokens(prompt)).toBeLessThan(3000);
  });

  it('builds numbered raw-dream prompts in the target language', () => {
    const result = buildArchetypeRecognitionUserPrompt({
      dreamText:
        'Είδα ένα όνειρο. Ήμουν ξαπλωμένη σε ένα θαλάσσιο στρώμα και κοιτούσαμε μαζί τον βυθό.',
      targetLanguageHint: 'el',
    });
    expect(result.targetLanguage.code).toBe('el');
    expect(result.formattedDream).toContain('[D1]');
    expect(result.prompt).toContain('TARGET OUTPUT LANGUAGE: Greek (el)');
  });

  it('keeps the recognition catalog compact and includes the exact Lover record', () => {
    const lover = ARCHETYPE_RECOGNITION_CATALOG_V2.find((record) => record.id === 'lover');
    expect(lover).toEqual({
      id: 'lover',
      label: 'Lover',
      coreQuality:
        'Mutual erotic, intimate, or beloved relatedness that organizes the emotional and imaginal field.',
      commonExpressions: [
        'serene bodily or emotional intimacy',
        'shared attention, rest, vulnerability, or exploration within an intimate bond',
        'desire, devotion, longing, union, separation, loss, or beloved risk',
        'a bond that makes the dream-space feel safe, open, charged, or deeply inhabited',
      ],
      notEnough:
        'A partner, friendship, teamwork, domestic logistics, attraction, wedding imagery, or a brief kiss without an organizing intimate or beloved bond.',
    });

    for (const record of ARCHETYPE_RECOGNITION_CATALOG_V2) {
      expect(archetypeRecognitionRecordWordCount(record)).toBeLessThanOrEqual(70);
    }
  });
});
