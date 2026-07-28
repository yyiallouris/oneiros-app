import {
  ARCHETYPE_ADJUDICATION_MODEL,
  ARCHETYPE_ADJUDICATION_PROMPT_ID,
  ARCHETYPE_ADJUDICATION_PROMPT_VERSION,
  buildArchetypeAdjudicationSystemPrompt,
  buildArchetypeAdjudicationUserPrompt,
  estimateArchetypeAdjudicationPromptTokens,
} from '../src/ai/archetypeAdjudicationPrompt';
import {
  ARCHETYPE_BOUNDARY_CATALOG_V1,
  ARCHETYPE_BOUNDARY_CATALOG_VERSION,
  archetypeBoundaryRecordWordCount,
} from '../src/ai/catalogs/archetypeBoundaryCatalog.v1';
import { ARCHETYPE_ADJUDICATION_SCHEMA_VERSION } from '../src/ai/schemas/archetypeAdjudicationSchema';

describe('archetypeAdjudicationPrompt', () => {
  it('exposes the adjudication spike versions', () => {
    expect(ARCHETYPE_ADJUDICATION_PROMPT_ID).toBe('dream-archetype-adjudication-v1.0.0');
    expect(ARCHETYPE_ADJUDICATION_PROMPT_VERSION).toBe('1.0.0');
    expect(ARCHETYPE_ADJUDICATION_SCHEMA_VERSION).toBe('1');
    expect(ARCHETYPE_BOUNDARY_CATALOG_VERSION).toBe('1.0.0');
    expect(ARCHETYPE_ADJUDICATION_MODEL).toBe('gpt-5.4-mini-2026-03-17');
  });

  it('keeps the system prompt narrowly focused on adjudication', () => {
    const prompt = buildArchetypeAdjudicationSystemPrompt({ code: 'en', name: 'English' });
    expect(prompt).toContain('ARCHETYPE CANDIDATE ADJUDICATION');
    expect(prompt).toContain('dream-archetype-adjudication-v1.0.0');
    expect(prompt).toContain('Do not discover or add new archetypes.');
    expect(prompt).not.toContain('Dream Fabric');
    expect(prompt).not.toContain('myth catalog');
  });

  it('stays compact and injects only candidate-specific boundary records', () => {
    const result = buildArchetypeAdjudicationUserPrompt({
      dreamText:
        'I dreamed I was lying with my beloved on a quiet floating raft while we watched the deep water together.',
      targetLanguageHint: 'en',
      discoveryResponse: {
        archetypes: [
          {
            archetype_id: 'lover',
            quality: 'beloved intimacy',
            expression: 'shared body-level closeness on the raft',
            resonance: 'The bond makes the depth feel quietly inhabited together.',
            confidence: 'high',
            evidence_ids: ['D1'],
          },
        ],
      },
    });

    expect(result.prompt).toContain('Discovery candidates:');
    expect(result.prompt).toContain('id=lover label:Lover');
    expect(result.prompt).toContain('Candidate-specific boundary records (1.0.0):');
    expect(result.prompt).not.toContain('id=shadow label:Shadow');
  });

  it('stays under the hard prompt-size target', () => {
    const prompt = buildArchetypeAdjudicationSystemPrompt({ code: 'en', name: 'English' });
    expect(estimateArchetypeAdjudicationPromptTokens(prompt)).toBeLessThan(1500);
  });

  it('keeps boundary records compact and preserves exact high-priority wording', () => {
    const lover = ARCHETYPE_BOUNDARY_CATALOG_V1.find((record) => record.id === 'lover');
    expect(lover).toEqual({
      id: 'lover',
      distinctiveFunction:
        'Erotic, romantic, pair-bonded, or unmistakably beloved relatedness that organizes the dream field.',
      decisiveQuestion:
        'Does the dream show a specifically intimate or beloved bond beyond warmth, friendship, trust, belonging, or companionship?',
      rejectWhen: [
        'the scene is fully explained by friendship, group closeness, companionship, or shared enjoyment',
        'there is warmth or tenderness but no intimate, erotic, romantic, pair-bonded, or beloved dimension',
        'a partner label appears only in logistics or background activity',
        'attraction, a kiss, or wedding imagery appears without an organizing bond',
      ],
    });

    for (const record of ARCHETYPE_BOUNDARY_CATALOG_V1) {
      expect(archetypeBoundaryRecordWordCount(record)).toBeLessThanOrEqual(80);
    }
  });
});
