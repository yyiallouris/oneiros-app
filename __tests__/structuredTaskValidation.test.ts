import {
  validateStructuredTaskContent,
  parseStructuredJsonObject,
  safeAssistantJsonDiagnostics,
} from '../src/ai/structuredTaskValidation';

const archetypeB2 = {
  mechanism_tags: ['private_self_conflict'],
  evidence_ids: ['D1'],
};

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
            archetype_id: 'divine_child',
            expression: 'the child discovered beneath the snow',
            ...archetypeB2,
            resonance: 'A vulnerable new life emerges from beneath a frozen surface.',
            confidence: 'high',
          },
        ],
        amplifications: [
          {
            catalog_id: 'greek.cretan_labyrinth',
            resonance: 'The thread and labyrinth recall the Cretan cycle.',
            divergence: 'Here the waiting figure is fed rather than defeated.',
            evidence: ['thread-like guidance', 'branching corridors', 'waiting figure'],
            confidence: 'high',
            evaluation: {
              matched_dimensions: [
                'distinctive_cluster',
                'narrative_sequence',
                'relational_roles',
              ],
              divergence_type: 'outcome_changed',
              disqualifiers_triggered: [],
            },
          },
        ],
      })
    );
    expect(objectShape.ok).toBe(true);
    if (objectShape.ok) {
      const data = objectShape.data as {
        archetypes: Array<{ expression: string; archetype_id: string; confidence: string }>;
        amplifications: Array<{
          catalog_id: string;
          title?: string;
          tradition?: string;
          confidence: string;
          divergence: string;
        }>;
      };
      expect(data.archetypes[0].archetype_id).toBe('divine_child');
      expect(data.archetypes[0].expression).toBe('the child discovered beneath the snow');
      expect(data.archetypes[0].confidence).toBe('high');
      expect(data.amplifications[0].catalog_id).toBe('greek.cretan_labyrinth');
      expect(data.amplifications[0].title).toBeUndefined();
      expect(data.amplifications[0].tradition).toBeUndefined();
      expect(data.amplifications[0].divergence).toMatch(/fed rather than defeated/i);
      expect(data.amplifications[0].confidence).toBe('high');
    }

    const missingConfidenceDefaultsToMedium = validateStructuredTaskContent(
      'dream_extraction',
      JSON.stringify({
        symbols: ['door'],
        archetypes: [
          {
            archetype_id: 'shadow',
            expression: 'the watching figure outside the locked house',
            ...archetypeB2,
            resonance: 'An unseen presence holds the edge between approach and entry.',
          },
        ],
        amplifications: [
          {
            catalog_id: 'greek.cretan_labyrinth',
            resonance: 'The thread and labyrinth recall the Cretan cycle.',
            divergence: 'Here the waiting figure is fed rather than defeated.',
            evidence: ['thread-like guidance', 'branching corridors', 'waiting figure'],
            evaluation: {
              matched_dimensions: [
                'distinctive_cluster',
                'narrative_sequence',
                'relational_roles',
              ],
              divergence_type: 'outcome_changed',
              disqualifiers_triggered: [],
            },
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
            catalog_id: 'sumerian.inanna_descent',
            resonance: 'Descent through gates without a secured return.',
            difference: 'No completed ascent is staged.',
            evidence: ['gates', 'descent', 'stripped adornment'],
            confidence: 'medium',
            evaluation: {
              matched_dimensions: [
                'distinctive_cluster',
                'narrative_sequence',
                'relational_roles',
              ],
              divergence_type: 'pattern_unfinished',
              disqualifiers_triggered: [],
            },
          },
        ],
      })
    );
    expect(legacyDifferenceKey.ok).toBe(true);
    if (legacyDifferenceKey.ok) {
      const data = legacyDifferenceKey.data as {
        amplifications: Array<{ divergence: string; catalog_id: string }>;
      };
      expect(data.amplifications[0].catalog_id).toBe('sumerian.inanna_descent');
      expect(data.amplifications[0].divergence).toBe('No completed ascent is staged.');
    }

    const openWorldTitleDropped = validateStructuredTaskContent(
      'dream_extraction',
      JSON.stringify({
        symbols: ['door'],
        amplifications: [
          {
            title: 'Aladdin',
            tradition: 'Arabian Nights',
            resonance: 'A sealed being appears from a vessel.',
            divergence: 'No bargain is completed.',
            evidence: ['copper vessel', 'giant rises'],
            confidence: 'high',
          },
        ],
      })
    );
    expect(openWorldTitleDropped.ok).toBe(true);
    if (openWorldTitleDropped.ok) {
      const data = openWorldTitleDropped.data as { amplifications: unknown[] };
      expect(data.amplifications).toEqual([]);
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
      expect(bareTags.schemaErrors.join(' ')).toMatch(/Expected object|expression|archetype_id|resonance/i);
    }

    const tagOnlyExpression = validateStructuredTaskContent(
      'dream_extraction',
      JSON.stringify({
        symbols: ['door'],
        archetypes: [
          {
            archetype_id: 'divine_child',
            expression: 'Divine Child',
            ...archetypeB2,
            resonance: 'A vulnerable new life emerges from beneath a frozen surface.',
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
            archetype_id: 'divine_child',
            display_label: 'the guiding child at the end of the thread',
            ...archetypeB2,
            resonance: 'A childlike figure carries orientation through the descent.',
            confidence: 'medium',
          },
        ],
        amplifications: [],
      })
    );
    expect(legacyDisplayLabel.ok).toBe(true);
    if (legacyDisplayLabel.ok) {
      const data = legacyDisplayLabel.data as {
        archetypes: Array<{ archetype_id: string; expression: string }>;
      };
      expect(data.archetypes[0].archetype_id).toBe('divine_child');
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

  it('preserves mechanism_tags and evidence_ids through archetype coerce', () => {
    const result = validateStructuredTaskContent(
      'dream_extraction',
      JSON.stringify({
        symbols: ['jar'],
        archetypes: [
          {
            archetype_id: 'trickster',
            carrier: 'feigned disbelief that reseals the vessel',
            resonance: 'Cunning reverses the giant’s threat by resealing the copper vessel.',
            confidence: 'high',
            mechanism_tags: ['deception_or_feigned_belief', 'power_asymmetry_reversed'],
            evidence_ids: ['D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7'],
          },
        ],
        amplifications: [],
      })
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const data = result.data as {
      archetypes: Array<{
        expression: string;
        archetype_id?: string;
        mechanism_tags?: string[];
        evidence_ids?: string[];
      }>;
    };
    expect(data.archetypes[0].expression).toMatch(/feigned disbelief/i);
    expect(data.archetypes[0].archetype_id).toBe('trickster');
    expect(data.archetypes[0].mechanism_tags).toEqual([
      'deception_or_feigned_belief',
      'power_asymmetry_reversed',
    ]);
    expect(data.archetypes[0].evidence_ids).toEqual(['D1', 'D2', 'D3', 'D4', 'D5', 'D6']);
  });

  it('maps legacy camelCase extraction aliases into shared snake_case fields', () => {
    const result = validateStructuredTaskContent(
      'dream_extraction',
      JSON.stringify({
        displayDistillation: {
          essence_title: 'Guarded entry',
          essence_line: 'The dream gathers around a guarded threshold.',
          dominant_lens: 'threshold',
          visible_anchors: [{ label: 'red door', type: 'threshold', salience: 5, ui_meaning: 'charged entry' }],
          main_tension: 'entry vs hesitation',
          dream_movement: 'approaching',
          movement_line: 'Something approaches without crossing.',
        },
        symbols: ['red door'],
        symbolStances: [{ symbol: 'red door', stance: 'blocked, charged' }],
        centralConflicts: ['entry vs hesitation'],
        archetypes: [],
        landscapes: [],
        affects: [],
        motifs: [],
        relational_dynamics: [],
        thresholds: [],
        core_mode: 'Core Tension',
        amplifications: [],
      })
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const data = result.data as {
      display_distillation?: { essence_title?: string };
      symbol_stances: Array<{ symbol: string; stance: string }>;
      central_conflicts: string[];
    };
    expect(data.display_distillation?.essence_title).toBe('Guarded entry');
    expect(data.symbol_stances).toEqual([{ symbol: 'red door', stance: 'blocked, charged' }]);
    expect(data.central_conflicts).toEqual(['entry vs hesitation']);
  });

  it('preserves interpretive_diagnostics through dream_extraction normalization', () => {
    const result = validateStructuredTaskContent(
      'dream_extraction',
      JSON.stringify({
        symbols: ['jar'],
        archetypes: [
          {
            archetype_id: 'trickster',
            expression: 'the jar trick',
            mechanism_tags: ['deception_or_feigned_belief', 'power_asymmetry_reversed'],
            evidence_ids: ['D1', 'D2'],
            resonance: 'The dreamer traps the giant by cunning and reverses the threat.',
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
          dream_map: {
            beats: ['B1: jar opens', 'B2: threat', 'B3: jar trick'],
            role_verb_mechanism: '[captive] —threatens→ [opener] —deceives→ [resealed]',
            decisive_span: ['B2', 'B3'],
            causal_omission_check: 'pass',
          },
          archetype_audit: [
            {
              label: 'Trickster',
              carrier: 'jar trick',
              function_match: 'yes',
              evidence_beats: ['B2', 'B3'],
              selected: true,
              reason: 'decisive-span deception',
            },
          ],
          mythic_audit: [
            {
              title: 'The Fisherman and the Jinni',
              tradition: 'One Thousand and One Nights',
              title_type: 'specific_tale',
              independent_plot_anchors: ['Solomon seal', 'feigned disbelief'],
              plot_contamination_test: 'pass',
              selected: false,
            },
          ],
        },
      })
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const data = result.data as {
      interpretive_diagnostics?: {
        dream_map?: { decisive_span?: string[] };
        archetype_audit?: Array<{ label?: string; selected?: boolean; evidence_beats?: string[] }>;
        mythic_audit?: Array<{ title_type?: string; plot_contamination_test?: string }>;
      };
    };
    expect(result.normalizedContent).toContain('interpretive_diagnostics');
    expect(data.interpretive_diagnostics).toMatchObject({
      dream_map: expect.objectContaining({ decisive_span: ['B2', 'B3'] }),
      archetype_audit: [
        expect.objectContaining({ label: 'Trickster', selected: true, evidence_beats: ['B2', 'B3'] }),
      ],
      mythic_audit: [expect.objectContaining({ title_type: 'specific_tale', plot_contamination_test: 'pass' })],
    });
  });
});
