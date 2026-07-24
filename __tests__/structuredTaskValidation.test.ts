import {
  validateStructuredTaskContent,
  parseStructuredJsonObject,
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
});
