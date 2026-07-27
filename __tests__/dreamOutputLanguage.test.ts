import {
  auditDreamExtractionOutputLanguage,
  buildLanguageRepairMessages,
  buildOutputLanguageLockBlock,
  collectFieldsToRepair,
  evaluateDreamExtractionOutputLanguage,
  mergeRepairedVisibleFields,
  parseRepairedVisibleFields,
  resolveDreamOutputLanguage,
  runOutputLanguageCommitGate,
} from '../src/ai/dreamOutputLanguage';
import { buildDreamExtractionUserPrompt } from '../src/ai/dreamExtractionPrompt';

const EN = { code: 'en' as const, name: 'English' };
const EL = { code: 'el' as const, name: 'Greek' };

const validEnglishPacket = {
  display_distillation: {
    essence_title: 'Shared shore',
    essence_line: 'Two bodies rest on the same mattress at sea.',
    main_tension: 'Closeness without a demand to leave.',
    movement_line: 'The dream stays with mutual presence.',
  },
  symbols: ['mattress', 'sea'],
  landscapes: ['open water'],
  affects: ['calm closeness'],
  motifs: ['floating together'],
  relational_dynamics: ['mutual presence'],
  thresholds: ['staying beside'],
  central_conflicts: ['whether to leave the shore'],
  archetypes: [
    {
      archetype_id: 'lover',
      expression: 'My boyfriend and I lie on a mattress in the sea',
      resonance: 'Warm mutual closeness holds without crisis or conquest.',
      confidence: 'medium',
      mechanism_tags: ['mutual_attraction_or_union'],
    },
  ],
  amplifications: [],
};

describe('dreamOutputLanguage', () => {
  it('resolves Greek from dream text or hint', () => {
    expect(resolveDreamOutputLanguage('Ήμουν σε ένα σπίτι γεμάτο νερό', 'en').code).toBe('el');
    expect(resolveDreamOutputLanguage('I was in a house', 'el').code).toBe('en');
  });

  it('builds an explicit language lock block', () => {
    const block = buildOutputLanguageLockBlock(EN);
    expect(block).toContain('TARGET OUTPUT LANGUAGE: English (en)');
    expect(block).toContain('only in English');
  });

  it('injects the language lock into the extraction user prompt', () => {
    const prompt = buildDreamExtractionUserPrompt({
      date: '2026-07-27',
      content: 'I walked through a flooded classroom.',
      dreamLanguage: 'en',
    });
    expect(prompt).toContain('TARGET OUTPUT LANGUAGE: English (en)');
  });

  it('flags Chinese/Japanese output for English target (M_double_shadow-style)', () => {
    const gate = evaluateDreamExtractionOutputLanguage(
      {
        ...validEnglishPacket,
        archetypes: [
          {
            archetype_id: 'double',
            expression: '我的替身坐在我的椅子上，戴着我的名牌',
            resonance: 'A double sits in my chair wearing my name tag.',
            confidence: 'high',
          },
        ],
      },
      EN
    );
    expect(gate.ok).toBe(false);
    expect(gate.mismatched_field_paths).toContain('archetypes[0].expression');
    expect(gate.mismatched_field_paths).not.toContain('archetypes[0].resonance');
  });

  it('flags English user-facing text for Greek target', () => {
    const gate = evaluateDreamExtractionOutputLanguage(
      {
        archetypes: [
          {
            archetype_id: 'orphan',
            expression: 'I stood alone outside the locked house',
            resonance: 'Abandonment presses without a guide nearby.',
          },
        ],
      },
      EL
    );
    expect(gate.ok).toBe(false);
    expect(gate.mismatched_field_paths.length).toBeGreaterThan(0);
  });

  it('flags mixed-language archetype fields', () => {
    const gate = evaluateDreamExtractionOutputLanguage(
      {
        archetypes: [
          {
            archetype_id: 'shadow',
            expression: 'A dark twin whispers from the doorway',
            resonance: '影が扉からささやく',
          },
        ],
      },
      EN
    );
    expect(gate.ok).toBe(false);
    expect(gate.mismatched_field_paths).toEqual(['archetypes[0].resonance']);
  });

  it('rejects one invalid field inside an otherwise valid packet', () => {
    const audit = auditDreamExtractionOutputLanguage(
      {
        ...validEnglishPacket,
        motifs: ['floating together', '石の中心'],
      },
      EN
    );
    expect(audit.language_match).toBe(false);
    expect(audit.language_mismatch_fields).toContain('motifs[1]');
  });

  it('passes a fully English packet', () => {
    expect(evaluateDreamExtractionOutputLanguage(validEnglishPacket, EN).ok).toBe(true);
  });

  it('merges field-scoped repairs without touching machine decisions', () => {
    const broken = {
      ...validEnglishPacket,
      archetypes: [
        {
          archetype_id: 'double',
          expression: '我的替身坐在我的椅子上，戴着我的名牌',
          resonance: 'A double sits in my chair wearing my name tag.',
          confidence: 'high',
          mechanism_tags: ['identity_split_or_mirror'],
          evidence_ids: ['D1', 'D2'],
        },
      ],
    };
    const merged = mergeRepairedVisibleFields(broken, {
      'archetypes[0].expression': 'My double sits in my chair wearing my name tag',
    });
    const row = (merged.archetypes as Array<Record<string, unknown>>)[0]!;
    expect(row.expression).toBe('My double sits in my chair wearing my name tag');
    expect(row.archetype_id).toBe('double');
    expect(row.mechanism_tags).toEqual(['identity_split_or_mirror']);
    expect(row.evidence_ids).toEqual(['D1', 'D2']);
    expect(row.confidence).toBe('high');
    expect(evaluateDreamExtractionOutputLanguage(merged, EN).ok).toBe(true);
  });

  it('parses field-scoped repair JSON', () => {
    const parsed = parseRepairedVisibleFields(
      JSON.stringify({
        fields_to_repair: {
          'archetypes[0].expression': 'My double sits in my chair wearing my name tag',
        },
      }),
      ['archetypes[0].expression']
    );
    expect(parsed).toEqual({
      'archetypes[0].expression': 'My double sits in my chair wearing my name tag',
    });
  });

  it('successful repair allows commit', async () => {
    const broken = {
      ...validEnglishPacket,
      archetypes: [
        {
          archetype_id: 'double',
          expression: '我的替身坐在我的椅子上，戴着我的名牌',
          resonance: 'A double sits in my chair wearing my name tag.',
          confidence: 'high',
          mechanism_tags: ['identity_split_or_mirror'],
        },
      ],
    };
    const result = await runOutputLanguageCommitGate({
      parsed: broken,
      target: EN,
      repairOnce: async ({ messages }) => {
        expect(messages[0]?.content).toContain('Rewrite only the supplied fields');
        expect(messages[0]?.content).toContain('Repair faithfully rather than summarize');
        expect(buildLanguageRepairMessages({
          target: EN,
          fieldsToRepair: collectFieldsToRepair(broken, ['archetypes[0].expression']),
        })[1]?.content).toContain('archetypes[0].expression');
        return JSON.stringify({
          fields_to_repair: {
            'archetypes[0].expression': 'My double sits in my chair wearing my name tag',
          },
        });
      },
    });
    expect(result.ok).toBe(true);
    expect(result.telemetry.initial_language_match).toBe(false);
    expect(result.telemetry.repair_attempted).toBe(true);
    expect(result.telemetry.repair_language_match).toBe(true);
    expect(result.telemetry.final_commit_allowed).toBe(true);
    expect(result.telemetry.repaired_field_paths).toEqual(['archetypes[0].expression']);
    expect(result.telemetry.semantic_structure_preserved).toBe(true);
    expect(result.telemetry.dropped_due_to_language_count).toBe(0);
    expect(result.telemetry.full_regeneration_due_to_language_count).toBe(0);
    expect(
      (result.parsed.archetypes as Array<Record<string, unknown>>)[0]?.expression
    ).toMatch(/My double/);
  });

  it('failed repair blocks commit and keeps original packet out of return ok path', async () => {
    const broken = {
      archetypes: [
        {
          archetype_id: 'double',
          expression: '我的替身坐在我的椅子上，戴着我的名牌',
          resonance: 'A double sits in my chair wearing my name tag.',
        },
      ],
    };
    const result = await runOutputLanguageCommitGate({
      parsed: broken,
      target: EN,
      repairOnce: async () =>
        JSON.stringify({
          fields_to_repair: {
            'archetypes[0].expression': 'まだ日本語のままです',
          },
        }),
    });
    expect(result.ok).toBe(false);
    expect(result.telemetry.repair_attempted).toBe(true);
    expect(result.telemetry.repair_language_match).toBe(false);
    expect(result.telemetry.final_commit_allowed).toBe(false);
    expect(result.telemetry.mismatched_field_paths).toContain('archetypes[0].expression');
    // Caller must not commit result.parsed when ok=false; packet remains the original.
    expect(
      (result.parsed.archetypes as Array<Record<string, unknown>>)[0]?.expression
    ).toContain('我的替身');
  });
});
