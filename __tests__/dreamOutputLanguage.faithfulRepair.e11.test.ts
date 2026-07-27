/**
 * E.1.1 final invariants: local repair payload shape + faithful semantic preservation.
 */
import {
  buildLanguageRepairMessages,
  mergeRepairedVisibleFields,
  runOutputLanguageCommitGate,
  validateLanguageRepairFieldMap,
} from '../src/ai/dreamOutputLanguage';

const EN = { code: 'en' as const, name: 'English' };
const PATH = 'archetypes[0].expression';

describe('E.1.1 language repair payload validation', () => {
  const expected = [PATH];

  it('accepts Record<ExactRequestedFieldPath, NonEmptyString>', () => {
    expect(
      validateLanguageRepairFieldMap(
        { fields_to_repair: { [PATH]: 'My duplicate sits in my chair.' } },
        expected
      )
    ).toEqual({ [PATH]: 'My duplicate sits in my chair.' });
  });

  it('rejects missing paths', () => {
    expect(validateLanguageRepairFieldMap({ fields_to_repair: {} }, expected)).toBeNull();
  });

  it('rejects extra paths', () => {
    expect(
      validateLanguageRepairFieldMap(
        {
          fields_to_repair: {
            [PATH]: 'My duplicate sits in my chair.',
            'archetypes[0].resonance': 'extra',
          },
        },
        expected
      )
    ).toBeNull();
  });

  it('rejects nulls, arrays, objects, and non-string values', () => {
    expect(
      validateLanguageRepairFieldMap({ fields_to_repair: { [PATH]: null } }, expected)
    ).toBeNull();
    expect(
      validateLanguageRepairFieldMap({ fields_to_repair: { [PATH]: ['x'] } }, expected)
    ).toBeNull();
    expect(
      validateLanguageRepairFieldMap({ fields_to_repair: { [PATH]: { text: 'x' } } }, expected)
    ).toBeNull();
    expect(
      validateLanguageRepairFieldMap({ fields_to_repair: { [PATH]: 12 } }, expected)
    ).toBeNull();
    expect(
      validateLanguageRepairFieldMap({ fields_to_repair: { [PATH]: '' } }, expected)
    ).toBeNull();
    expect(validateLanguageRepairFieldMap([PATH], expected)).toBeNull();
  });
});

describe('E.1.1 faithful language repair contract', () => {
  it('embeds the faithful semantic-preservation repair contract', () => {
    const messages = buildLanguageRepairMessages({
      target: EN,
      fieldsToRepair: {
        [PATH]: '我的替身可能不是我，没有名字，只有三道光',
      },
    });
    const system = messages[0]?.content ?? '';
    expect(system).toContain('Repair faithfully rather than summarize');
    expect(system).toContain('Preserve every interpretive claim, image, relationship, negation');
    expect(system).toContain('qualification, uncertainty, proper name, and number');
    expect(system).toContain('Do not add, remove, intensify, soften, explain, or reinterpret meaning');
    expect(system).toContain('Change only the natural language');
    expect(system).toContain('Do not turn uncertainty into certainty');
    expect(system).toContain('Do not drop negations');
  });

  it('preserves negation, modality, names, numbers, image detail, and linked clauses on merge', async () => {
    const packet = {
      archetypes: [
        {
          archetype_id: 'double',
          expression: '替身可能不是我；Inanna没有三道光，也没有门廊的影子',
          resonance: 'A counterpart may not be me.',
          confidence: 'high',
          mechanism_tags: ['identity_or_status_transformed'],
          evidence_ids: ['D1'],
        },
      ],
    };

    const faithful =
      'The duplicate may not be me; Inanna has no 3 lights, and no porch shadow.';

    const result = await runOutputLanguageCommitGate({
      parsed: packet,
      target: EN,
      repairOnce: async ({ expectedPaths }) => {
        expect(expectedPaths).toEqual([PATH]);
        return validateLanguageRepairFieldMap(
          { fields_to_repair: { [PATH]: faithful } },
          expectedPaths
        );
      },
    });

    expect(result.ok).toBe(true);
    const expression = String(
      (result.parsed.archetypes as Array<Record<string, unknown>>)[0]?.expression
    );
    // Negation
    expect(expression).toMatch(/\bnot\b/i);
    // Modality — must not become certainty ("is" alone without may)
    expect(expression).toMatch(/\bmay\b/i);
    expect(expression).not.toMatch(/\bis not\b/i); // keep "may not", don't force bare certainty rewrite
    // Proper name + number + image detail + linked clause
    expect(expression).toContain('Inanna');
    expect(expression).toContain('3');
    expect(expression).toMatch(/lights/i);
    expect(expression).toMatch(/porch shadow/i);
    expect(expression).toContain(';');
    expect(result.telemetry.semantic_structure_preserved).toBe(true);
    expect(result.telemetry.dropped_due_to_language_count).toBe(0);
  });

  it('keeps modality and negation claims when merging a faithful repair string', () => {
    const before = {
      archetypes: [
        {
          archetype_id: 'guide_psychopomp',
          expression: '向导似乎不会打开第三扇门',
          resonance: 'Guidance may not open the third door.',
          confidence: 'medium',
          evidence_ids: ['D2'],
        },
      ],
    };
    const merged = mergeRepairedVisibleFields(before, {
      'archetypes[0].expression': 'The guide may not open the third door.',
    });
    const text = String(
      (merged.archetypes as Array<Record<string, unknown>>)[0]?.expression
    );
    expect(text).toMatch(/\bmay\b/i);
    expect(text).toMatch(/\bnot\b/i);
    expect(text).toMatch(/third door/i);
    expect((merged.archetypes as Array<Record<string, unknown>>)[0]?.confidence).toBe('medium');
    expect((merged.archetypes as Array<Record<string, unknown>>)[0]?.evidence_ids).toEqual(['D2']);
  });
});
