/**
 * Forced-invalid E.1.1 language-repair preservation contract.
 *
 * Proves repair path A (rewrite strings + keep semantic packet), never B (drop).
 */
import {
  assertLanguageRepairPreservedStructure,
  evaluateDreamExtractionOutputLanguage,
  mergeRepairedVisibleFields,
  parseRepairedVisibleFields,
  runOutputLanguageCommitGate,
  semanticFingerprint,
} from '../src/ai/dreamOutputLanguage';

const EN = { code: 'en' as const, name: 'English' };

const twoArchetypePacket = {
  display_distillation: {
    essence_title: 'Split seat',
    essence_line: 'A counterpart takes my chair and name.',
    main_tension: 'Identity occupied by another version of me.',
    movement_line: 'The dream holds the doubling without resolving it.',
  },
  symbols: ['chair', 'name tag'],
  landscapes: ['office'],
  affects: ['unease'],
  motifs: ['occupied seat'],
  relational_dynamics: ['self facing self'],
  thresholds: ['claiming the chair'],
  central_conflicts: ['which version is mine'],
  archetypes: [
    {
      archetype_id: 'double',
      expression: '我的替身坐在我的椅子上，戴着我的名牌',
      resonance: 'A split-off counterpart occupies my place.',
      confidence: 'high',
      mechanism_tags: ['identity_or_status_transformed'],
      evidence_ids: ['D1'],
    },
    {
      archetype_id: 'shadow',
      expression: 'The darker twin watches from the doorway',
      resonance: 'Disowned force waits at the edge of the room.',
      confidence: 'medium',
      mechanism_tags: ['disowned_quality_or_impulse'],
      evidence_ids: ['D2'],
    },
  ],
  amplifications: [
    {
      catalog_id: 'narcissus',
      resonance: '水面に映る顔が私の席を奪う',
      divergence: 'Unlike the myth, the image sits in my chair instead of a pool.',
      confidence: 'medium',
      evidence_ids: ['D1', 'D3'],
    },
  ],
};

describe('E.1.1 forced-invalid language repair preservation', () => {
  it('1. repairs Chinese Double expression without dropping the archetype', async () => {
    const packet = {
      archetypes: [
        {
          archetype_id: 'double',
          expression: '我的替身坐在我的椅子上，戴着我的名牌',
          resonance: 'A split-off counterpart occupies my place.',
          confidence: 'high',
          mechanism_tags: ['identity_or_status_transformed'],
          evidence_ids: ['D1'],
        },
      ],
      amplifications: [],
    };

    const result = await runOutputLanguageCommitGate({
      parsed: packet,
      target: EN,
      repairOnce: async () =>
        JSON.stringify({
          fields_to_repair: {
            'archetypes[0].expression': 'My duplicate sits in my chair wearing my name tag.',
          },
        }),
    });

    expect(result.ok).toBe(true);
    expect(result.telemetry.dropped_due_to_language_count).toBe(0);
    expect(result.telemetry.full_regeneration_due_to_language_count).toBe(0);
    expect(result.telemetry.semantic_structure_preserved).toBe(true);
    expect(result.telemetry.repaired_field_paths).toEqual(['archetypes[0].expression']);
    const row = (result.parsed.archetypes as Array<Record<string, unknown>>)[0]!;
    expect(result.parsed.archetypes).toHaveLength(1);
    expect(row.archetype_id).toBe('double');
    expect(row.confidence).toBe('high');
    expect(row.mechanism_tags).toEqual(['identity_or_status_transformed']);
    expect(row.evidence_ids).toEqual(['D1']);
    expect(row.expression).toMatch(/My duplicate/);
    expect(String(row.expression)).not.toMatch(/我/);
  });

  it('2. repairs wrong-language myth resonance without changing catalog_id', async () => {
    const packet = {
      archetypes: [],
      amplifications: [
        {
          catalog_id: 'narcissus',
          resonance: '水面に映る顔が私の席を奪う',
          divergence: 'Unlike the myth, the image sits in my chair instead of a pool.',
          confidence: 'medium',
          evidence_ids: ['D1', 'D3'],
        },
      ],
    };

    const result = await runOutputLanguageCommitGate({
      parsed: packet,
      target: EN,
      repairOnce: async () =>
        JSON.stringify({
          fields_to_repair: {
            'amplifications[0].resonance':
              'A reflected face takes my seat instead of staying in water.',
          },
        }),
    });

    expect(result.ok).toBe(true);
    const myth = (result.parsed.amplifications as Array<Record<string, unknown>>)[0]!;
    expect(result.parsed.amplifications).toHaveLength(1);
    expect(myth.catalog_id).toBe('narcissus');
    expect(myth.confidence).toBe('medium');
    expect(myth.evidence_ids).toEqual(['D1', 'D3']);
    expect(myth.divergence).toContain('Unlike the myth');
    expect(myth.resonance).toMatch(/reflected face/i);
  });

  it('3. keeps both archetypes and ordering when only one field is invalid', async () => {
    const result = await runOutputLanguageCommitGate({
      parsed: {
        ...twoArchetypePacket,
        amplifications: [],
        display_distillation: twoArchetypePacket.display_distillation,
      },
      target: EN,
      repairOnce: async () =>
        JSON.stringify({
          fields_to_repair: {
            'archetypes[0].expression': 'My duplicate sits in my chair wearing my name tag.',
          },
        }),
    });

    expect(result.ok).toBe(true);
    const ids = (result.parsed.archetypes as Array<Record<string, unknown>>).map(
      (row) => row.archetype_id
    );
    expect(ids).toEqual(['double', 'shadow']);
    expect(result.telemetry.repaired_field_paths).toEqual(['archetypes[0].expression']);
  });

  it('4. repairs multiple invalid fields across display, archetype, and myth', async () => {
    const packet = {
      ...twoArchetypePacket,
      display_distillation: {
        ...twoArchetypePacket.display_distillation,
        essence_title: '分裂的座位',
      },
      amplifications: [
        {
          catalog_id: 'narcissus',
          resonance: 'A reflected face sits where I should sit.',
          divergence: '神話との違いは、池ではなく椅子を取る点だ',
          confidence: 'medium',
          evidence_ids: ['D1'],
        },
      ],
    };

    const result = await runOutputLanguageCommitGate({
      parsed: packet,
      target: EN,
      repairOnce: async () =>
        JSON.stringify({
          fields_to_repair: {
            'display_distillation.essence_title': 'Split seat',
            'archetypes[0].expression': 'My duplicate sits in my chair wearing my name tag.',
            'amplifications[0].divergence':
              'Unlike the myth, the image takes a chair rather than a pool.',
          },
        }),
    });

    expect(result.ok).toBe(true);
    expect(result.telemetry.repaired_field_paths.sort()).toEqual(
      [
        'amplifications[0].divergence',
        'archetypes[0].expression',
        'display_distillation.essence_title',
      ].sort()
    );
    expect(result.parsed.archetypes).toHaveLength(2);
    expect(result.parsed.amplifications).toHaveLength(1);
    expect((result.parsed.display_distillation as Record<string, unknown>).essence_title).toBe(
      'Split seat'
    );
  });

  it('5. rejects malicious repair that changes IDs or omits requested fields', async () => {
    const packet = {
      archetypes: [
        {
          archetype_id: 'double',
          expression: '我的替身坐在我的椅子上，戴着我的名牌',
          resonance: 'A split-off counterpart occupies my place.',
          confidence: 'high',
          mechanism_tags: ['identity_or_status_transformed'],
          evidence_ids: ['D1'],
        },
      ],
    };

    const omitted = await runOutputLanguageCommitGate({
      parsed: packet,
      target: EN,
      repairOnce: async () => JSON.stringify({ fields_to_repair: {} }),
    });
    expect(omitted.ok).toBe(false);
    expect(omitted.telemetry.final_commit_allowed).toBe(false);
    expect(omitted.parsed).toBe(packet);

    const extraPath = await runOutputLanguageCommitGate({
      parsed: packet,
      target: EN,
      repairOnce: async () =>
        JSON.stringify({
          fields_to_repair: {
            'archetypes[0].expression': 'My duplicate sits in my chair.',
            'archetypes[0].archetype_id': 'shadow',
          },
        }),
    });
    expect(extraPath.ok).toBe(false);
    expect(extraPath.telemetry.final_commit_allowed).toBe(false);
    expect(
      (extraPath.parsed.archetypes as Array<Record<string, unknown>>)[0]?.archetype_id
    ).toBe('double');
  });

  it('6. keeps packet uncommitted when repaired text is still wrong language', async () => {
    const packet = {
      archetypes: [
        {
          archetype_id: 'double',
          expression: '我的替身坐在我的椅子上，戴着我的名牌',
          resonance: 'A split-off counterpart occupies my place.',
          confidence: 'high',
          evidence_ids: ['D1'],
        },
      ],
    };

    const result = await runOutputLanguageCommitGate({
      parsed: packet,
      target: EN,
      repairOnce: async () =>
        JSON.stringify({
          fields_to_repair: {
            'archetypes[0].expression': 'まだ日本語のままの替身です',
          },
        }),
    });

    expect(result.ok).toBe(false);
    expect(result.telemetry.final_commit_allowed).toBe(false);
    expect(result.telemetry.dropped_due_to_language_count).toBe(0);
    expect(result.telemetry.semantic_structure_preserved).toBe(true);
    expect(
      (result.parsed.archetypes as Array<Record<string, unknown>>)[0]?.expression
    ).toContain('我的替身');
  });

  it('7. semantic fingerprints match when repaired text paths are excluded', () => {
    const before = twoArchetypePacket;
    const after = mergeRepairedVisibleFields(before, {
      'archetypes[0].expression': 'My duplicate sits in my chair wearing my name tag.',
      'amplifications[0].resonance': 'A reflected face takes my seat instead of staying in water.',
    });

    expect(
      assertLanguageRepairPreservedStructure({
        before,
        after,
        repairedPaths: ['archetypes[0].expression', 'amplifications[0].resonance'],
      })
    ).toBe(true);

    expect(semanticFingerprint(before, ['archetypes[0].expression'])).not.toEqual(
      semanticFingerprint(after, [])
    );

    // Changing an ID breaks the fingerprint even if text paths are ignored.
    const mutated = mergeRepairedVisibleFields(before, {
      'archetypes[0].expression': 'My duplicate sits in my chair wearing my name tag.',
    });
    (mutated.archetypes as Array<Record<string, unknown>>)[0]!.archetype_id = 'shadow';
    expect(
      assertLanguageRepairPreservedStructure({
        before,
        after: mutated,
        repairedPaths: ['archetypes[0].expression'],
      })
    ).toBe(false);
  });

  it('never treats drop-as-fix: invalid packet without repair stays intact and uncommitted', async () => {
    const packet = {
      archetypes: [
        {
          archetype_id: 'double',
          expression: '我的替身坐在我的椅子上，戴着我的名牌',
          resonance: 'A split-off counterpart occupies my place.',
        },
      ],
    };
    expect(evaluateDreamExtractionOutputLanguage(packet, EN).ok).toBe(false);
    const result = await runOutputLanguageCommitGate({ parsed: packet, target: EN });
    expect(result.ok).toBe(false);
    expect(result.parsed).toBe(packet);
    expect(result.telemetry.dropped_due_to_language_count).toBe(0);
    expect(result.telemetry.full_regeneration_due_to_language_count).toBe(0);
  });

  it('rejects repair payloads that omit a requested path', () => {
    expect(
      parseRepairedVisibleFields(
        JSON.stringify({
          fields_to_repair: {
            'archetypes[0].expression': 'My duplicate sits in my chair.',
          },
        }),
        ['archetypes[0].expression', 'amplifications[0].resonance']
      )
    ).toBeNull();
  });
});
