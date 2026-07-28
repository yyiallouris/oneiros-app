import {
  mechanismGateRejectionReason,
  normalizeMechanismTags,
} from '../src/ai/archetypeMechanisms';
import { validateArchetypalEchoes } from '../src/ai/validators/archetypalEchoValidator';

describe('archetype mechanism hard gates (v4.1.4)', () => {
  it('accepts Trickster only with deception/inversion AND power reversal', () => {
    expect(
      mechanismGateRejectionReason('trickster', [
        'deception_or_feigned_belief',
        'power_asymmetry_reversed',
      ])
    ).toBeNull();
    expect(mechanismGateRejectionReason('trickster', ['deception_or_feigned_belief'])).toBe(
      'missing_required_mechanism:power_asymmetry_reversed'
    );
  });

  it('rejects retired B.2 carrier-scoped trickster ids', () => {
    for (const id of ['trickster.action', 'trickster.figure'] as const) {
      const result = validateArchetypalEchoes([
        {
          archetype_id: id,
          expression: 'feigned disbelief that reseals the vessel',
          resonance: 'Cunning reverses leverage through deception and strategic containment.',
          confidence: 'high',
          mechanism_tags: ['deception_or_feigned_belief', 'power_asymmetry_reversed'],
          evidence_ids: ['D1', 'D2'],
        },
      ]);
      expect(result.accepted).toHaveLength(0);
      expect(result.rejected[0]?.reason).toBe('unknown_archetype_id');
    }
  });

  it('canonicalizes legacy mother ids without requiring a retired hard gate', () => {
    const accepted = validateArchetypalEchoes([
      {
        archetype_id: 'terrible_mother',
        expression: 'the binding mother',
        resonance: 'A maternal hold refuses separation and pulls the dreamer backward.',
        confidence: 'high',
        mechanism_tags: ['possessive_anti_separation'],
        evidence_ids: ['D1', 'D2'],
      },
      {
        archetype_id: 'great_mother',
        expression: 'the sheltering presence',
        resonance: 'Warm containment steadies the dreamer without blocking movement.',
        confidence: 'medium',
        evidence_ids: ['D1'],
      },
    ]);
    expect(accepted.accepted).toHaveLength(1);
    expect(accepted.accepted[0].canonical_label).toBe('Mother');
    expect(accepted.accepted[0].archetype_id).toBe('mother');
    expect(accepted.accepted[0].legacy_source_id).toBe('terrible_mother');
    expect(accepted.rejected[0]?.reason).toBe('duplicate_canonical_archetype_collapsed');
  });

  it('requires Hero ordeal, quest movement, and changed outcome', () => {
    const incomplete = validateArchetypalEchoes([
      {
        archetype_id: 'hero',
        expression: 'pushing uphill again without arrival',
        resonance: 'The ordeal repeats without a crossing or reward.',
        confidence: 'high',
        mechanism_tags: ['ordeal_or_confrontation', 'purposeful_quest_movement'],
        evidence_ids: ['D1', 'D2'],
      },
    ]);
    expect(incomplete.accepted).toHaveLength(0);
    expect(incomplete.rejected[0]?.reason).toBe('missing_required_mechanism:boon_or_changed_outcome');

    const complete = validateArchetypalEchoes([
      {
        archetype_id: 'hero',
        expression: 'the rescue that changes who can leave the burning room',
        resonance: 'The confrontation wins a crossing and the trapped child is carried out alive.',
        confidence: 'high',
        mechanism_tags: [
          'ordeal_or_confrontation',
          'purposeful_quest_movement',
          'boon_or_changed_outcome',
        ],
        evidence_ids: ['D1', 'D2'],
      },
    ]);
    expect(complete.accepted).toHaveLength(1);
    expect(complete.accepted[0].canonical_label).toBe('Hero');
  });

  it('requires Death–Rebirth full sequence tags', () => {
    const incomplete = validateArchetypalEchoes([
      {
        archetype_id: 'death_rebirth',
        expression: 'the stripping descent',
        resonance: 'A stripping descent collapses the old form before any return.',
        confidence: 'high',
        mechanism_tags: ['dissolution_or_symbolic_death', 'revival_or_return'],
        evidence_ids: ['D1', 'D2'],
      },
    ]);
    expect(incomplete.accepted).toHaveLength(0);
    expect(incomplete.rejected[0]?.reason).toMatch(/identity_or_status_transformed/);

    const complete = validateArchetypalEchoes([
      {
        archetype_id: 'death_rebirth',
        expression: 'the whole descent and return',
        resonance: 'Stripping, collapse, and altered return rewrite the dreamer’s form.',
        confidence: 'high',
        mechanism_tags: [
          'dissolution_or_symbolic_death',
          'revival_or_return',
          'identity_or_status_transformed',
        ],
        evidence_ids: ['D1', 'D2'],
      },
    ]);
    expect(complete.accepted).toHaveLength(1);
  });

  it('requires Lover bond plus devotion or loss', () => {
    const result = validateArchetypalEchoes([
      {
        archetype_id: 'lover',
        expression: 'the lost companion beyond the gate',
        resonance: 'The bond to the lost companion organizes the entire crossing and return.',
        confidence: 'high',
        mechanism_tags: ['bond_organizes_dream', 'union_separation_or_loss'],
        evidence_ids: ['D1', 'D2'],
      },
    ]);
    expect(result.accepted).toHaveLength(1);
  });

  it('keeps warm companionship language outside the Lover catalog record', () => {
    const result = validateArchetypalEchoes([
      {
        archetype_id: 'lover',
        expression: 'the easy canoe teamwork',
        resonance: 'Warm companionship steadies the scene without beloved or erotic charge.',
        confidence: 'medium',
        mechanism_tags: ['bond_organizes_dream'],
        evidence_ids: ['D1', 'D2'],
      },
    ]);
    expect(result.accepted).toHaveLength(0);
    expect(result.rejected[0]?.reason).toMatch(/missing_any_of_mechanisms/);
  });

  it('normalizes unknown mechanism tags away', () => {
    expect(
      normalizeMechanismTags(['deception_or_feigned_belief', 'reseals_giant', 'power_asymmetry_reversed'])
    ).toEqual(['deception_or_feigned_belief', 'power_asymmetry_reversed']);
  });

  const dreamText = [
    'I open the sealed copper vessel beside the dry lake.',
    'The giant rises and threatens me for centuries of captivity.',
    'I pretend disbelief and ask him to prove he can fit inside again.',
    'When he shrinks into the vessel I close the lid at once.',
  ].join('\n\n');

  it('accepts trickster when mechanism gate is satisfied', () => {
    const result = validateArchetypalEchoes(
      [
        {
          archetype_id: 'trickster',
          expression: 'the reversal of leverage through feigned disbelief and resealing',
          resonance: 'Cunning reverses the giant’s threat by resealing the copper vessel.',
          confidence: 'high',
          mechanism_tags: ['deception_or_feigned_belief', 'power_asymmetry_reversed'],
          evidence_ids: ['D1', 'D2', 'D3', 'D4'],
        },
      ],
      { dreamText }
    );
    expect(result.accepted).toHaveLength(1);
    expect(result.accepted[0].canonical_label).toBe('Trickster');
    expect(result.accepted[0].archetype_id).toBe('trickster');
  });
});
