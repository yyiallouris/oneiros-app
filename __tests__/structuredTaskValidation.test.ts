import {
  validateStructuredTaskContent,
  parseStructuredJsonObject,
  safeAssistantJsonDiagnostics,
} from '../src/ai/structuredTaskValidation';

describe('structuredTaskValidation', () => {
  it('accepts dream_extraction with usable metadata', () => {
    const result = validateStructuredTaskContent(
      'dream_extraction',
      JSON.stringify({
        symbols: ['door'],
        archetypes: [],
        landscapes: [],
        affects: [],
        motifs: [],
        relational_dynamics: [],
        thresholds: [],
        central_conflicts: [],
        core_mode: null,
        amplifications: [],
        symbol_stances: [],
      })
    );
    expect(result.ok).toBe(true);
  });

  it('rejects empty dream_extraction', () => {
    const result = validateStructuredTaskContent('dream_extraction', '{}');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.schemaErrors.join(' ')).toMatch(/usable metadata/i);
    }
  });

  it('requires explicit no_change for conversation_element_update empty updates', () => {
    const bare = validateStructuredTaskContent('conversation_element_update', '{}');
    expect(bare.ok).toBe(false);

    const explicit = validateStructuredTaskContent(
      'conversation_element_update',
      JSON.stringify({ status: 'no_change' })
    );
    expect(explicit.ok).toBe(true);
  });

  it('accepts updated conversation_element_update payloads', () => {
    const result = validateStructuredTaskContent(
      'conversation_element_update',
      JSON.stringify({
        status: 'updated',
        archetypes: ['Shadow'],
        affects: [],
        motifs: [],
        relational_dynamics: [],
        thresholds: [],
        central_conflicts: [],
        core_mode: null,
        amplifications: [],
      })
    );
    expect(result.ok).toBe(true);
  });

  it('accepts rich archetypal/mythic echo objects and rejects bare archetype tags', () => {
    const objectShape = validateStructuredTaskContent(
      'dream_extraction',
      JSON.stringify({
        symbols: ['door'],
        archetypes: [
          {
            canonical_label: 'Divine Child',
            expression: 'the child discovered beneath the snow',
            resonance: 'A vulnerable new life emerges from beneath a frozen surface.',
            evidence: ['the child beneath the snow'],
            confidence: 'high',
          },
        ],
        amplifications: [
          {
            title: 'Ariadne and the Labyrinth',
            tradition: 'Greek',
            resonance: 'The thread and labyrinth recall the Cretan cycle.',
            divergence: 'Here the waiting figure is fed rather than defeated.',
            evidence: ['thread-like guidance', 'branching corridors', 'waiting figure'],
            confidence: 'high',
          },
        ],
      })
    );
    expect(objectShape.ok).toBe(true);
    if (objectShape.ok) {
      const data = objectShape.data as {
        archetypes: Array<{ expression: string; canonical_label: string; confidence: string }>;
        amplifications: Array<{
          title: string;
          tradition: string;
          confidence: string;
          divergence: string;
        }>;
      };
      expect(data.archetypes[0].canonical_label).toBe('Divine Child');
      expect(data.archetypes[0].expression).toBe('the child discovered beneath the snow');
      expect(data.archetypes[0].confidence).toBe('high');
      expect(data.amplifications[0].title).toBe('Ariadne and the Labyrinth');
      expect(data.amplifications[0].tradition).toBe('Greek');
      expect(data.amplifications[0].divergence).toMatch(/fed rather than defeated/i);
      expect(data.amplifications[0].confidence).toBe('high');
    }

    const missingConfidenceDefaultsToMedium = validateStructuredTaskContent(
      'dream_extraction',
      JSON.stringify({
        symbols: ['door'],
        archetypes: [
          {
            canonical_label: 'Shadow',
            expression: 'the watching figure outside the locked house',
            resonance: 'An unseen presence holds the edge between approach and entry.',
            evidence: ['someone watches from outside'],
          },
        ],
        amplifications: [
          {
            title: 'Ariadne and the Labyrinth',
            tradition: 'Greek',
            resonance: 'The thread and labyrinth recall the Cretan cycle.',
            divergence: 'Here the waiting figure is fed rather than defeated.',
            evidence: ['thread-like guidance', 'branching corridors', 'waiting figure'],
          },
        ],
      })
    );
    expect(missingConfidenceDefaultsToMedium.ok).toBe(true);
    if (missingConfidenceDefaultsToMedium.ok) {
      const data = missingConfidenceDefaultsToMedium.data as {
        archetypes: Array<{ confidence: string }>;
        amplifications: Array<{ confidence: string }>;
      };
      expect(data.archetypes[0].confidence).toBe('medium');
      expect(data.amplifications[0].confidence).toBe('medium');
    }

    const legacyDifferenceKey = validateStructuredTaskContent(
      'dream_extraction',
      JSON.stringify({
        symbols: ['door'],
        amplifications: [
          {
            title: 'Inanna',
            tradition: 'Mesopotamian',
            resonance: 'Descent through gates without a secured return.',
            difference: 'No completed ascent is staged.',
            evidence: ['gates', 'descent', 'stripped adornment'],
            confidence: 'medium',
          },
        ],
      })
    );
    expect(legacyDifferenceKey.ok).toBe(true);
    if (legacyDifferenceKey.ok) {
      const data = legacyDifferenceKey.data as {
        amplifications: Array<{ divergence: string }>;
      };
      expect(data.amplifications[0].divergence).toBe('No completed ascent is staged.');
    }

    const bareTags = validateStructuredTaskContent(
      'dream_extraction',
      JSON.stringify({
        symbols: ['door'],
        archetypes: ['Divine Child', 'Guide / Psychopomp'],
        amplifications: [],
      })
    );
    expect(bareTags.ok).toBe(false);
    if (!bareTags.ok) {
      expect(bareTags.schemaErrors.join(' ')).toMatch(/Expected object|expression|canonical_label|resonance|evidence/i);
    }

    const tagOnlyExpression = validateStructuredTaskContent(
      'dream_extraction',
      JSON.stringify({
        symbols: ['door'],
        archetypes: [
          {
            canonical_label: 'Divine Child',
            expression: 'Divine Child',
            resonance: 'A vulnerable new life emerges from beneath a frozen surface.',
            evidence: ['the child beneath the snow'],
            confidence: 'high',
          },
        ],
      })
    );
    expect(tagOnlyExpression.ok).toBe(false);
    if (!tagOnlyExpression.ok) {
      expect(tagOnlyExpression.schemaErrors.join(' ')).toMatch(
        /dream-specific form|expression.*at least 1 character/i
      );
    }

    // Legacy display_label is upgraded to expression during coerce.
    const legacyDisplayLabel = validateStructuredTaskContent(
      'dream_extraction',
      JSON.stringify({
        symbols: ['door'],
        archetypes: [
          {
            canonical_label: 'Child',
            display_label: 'the guiding child at the end of the thread',
            resonance: 'A childlike figure carries orientation through the descent.',
            evidence: ['the girl directs the dreamer'],
            confidence: 'medium',
          },
        ],
        amplifications: [],
      })
    );
    expect(legacyDisplayLabel.ok).toBe(true);
    if (legacyDisplayLabel.ok) {
      const data = legacyDisplayLabel.data as {
        archetypes: Array<{ canonical_label: string; expression: string }>;
      };
      expect(data.archetypes[0].canonical_label).toBe('Divine Child');
      expect(data.archetypes[0].expression).toMatch(/guiding child/i);
    }

    // Legacy bare strings remain acceptable on conversation updates (readers normalize).
    const legacyConversation = validateStructuredTaskContent(
      'conversation_element_update',
      JSON.stringify({
        status: 'updated',
        archetypes: ['Shadow'],
        affects: [],
        motifs: [],
        relational_dynamics: [],
        thresholds: [],
        central_conflicts: [],
        core_mode: null,
        amplifications: ['door as charged boundary'],
      })
    );
    expect(legacyConversation.ok).toBe(true);
  });

  it('accepts empty semantic_grouping arrays and rejects bad member groups', () => {
    const empty = validateStructuredTaskContent(
      'semantic_grouping',
      JSON.stringify({ symbol_groups: [], landscape_groups: [] })
    );
    expect(empty.ok).toBe(true);

    const bad = validateStructuredTaskContent(
      'semantic_grouping',
      JSON.stringify({
        symbol_groups: [{ canonical: 'forest', members: ['woods'] }],
        landscape_groups: [],
      })
    );
    expect(bad.ok).toBe(false);
  });

  it('repairs trailing commas during parse', () => {
    const parsed = parseStructuredJsonObject('{"symbols":["a"],}');
    expect(parsed.ok).toBe(true);
  });

  it('flags truncated assistant JSON without exposing content', () => {
    const truncated = safeAssistantJsonDiagnostics('{"symbols":["door"],"archetypes":[');
    expect(truncated.contentLength).toBeGreaterThan(0);
    expect(truncated.startsWithJson).toBe(true);
    expect(truncated.looksTruncated).toBe(true);
    expect(truncated.openBraceDelta).toBeGreaterThan(0);

    const complete = safeAssistantJsonDiagnostics('{"symbols":["door"],"archetypes":[]}');
    expect(complete.looksTruncated).toBe(false);
    expect(complete.endsWithJsonCloser).toBe(true);
  });

  it('preserves interpretive_diagnostics through dream_extraction normalization', () => {
    const result = validateStructuredTaskContent(
      'dream_extraction',
      JSON.stringify({
        symbols: ['jar'],
        archetypes: [
          {
            canonical_label: 'Trickster',
            expression: 'the jar trick',
            resonance: 'The dreamer traps the giant by cunning and reverses the threat.',
            evidence: ['jar', 'giant'],
            confidence: 'high',
          },
        ],
        landscapes: [],
        affects: [],
        motifs: [],
        relational_dynamics: [],
        thresholds: [],
        central_conflicts: [],
        core_mode: null,
        amplifications: [],
        symbol_stances: [],
        interpretive_diagnostics: {
          archetype_candidates: [
            {
              label: 'Trickster',
              carrier: 'jar trick',
              support: ['traps giant'],
              counterevidence: [],
              centrality: 5,
              selected: true,
            },
          ],
          mythic_candidates: [],
        },
      })
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.normalizedContent).toContain('interpretive_diagnostics');
    expect(result.data.interpretive_diagnostics).toMatchObject({
      archetype_candidates: [expect.objectContaining({ label: 'Trickster', selected: true })],
    });
  });
});
