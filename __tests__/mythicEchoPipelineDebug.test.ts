import {
  applyMythicAuditProductionInvariant,
  buildMythicEchoPipelineDebugPacket,
  checkMythicAuditProductionConsistency,
  collectAmplificationNormalizeTransforms,
  snapshotMythicEcho,
} from '../src/ai/mythicEchoPipelineDebug';
import { normalizeAmplifications } from '../src/ai/mythicEchoes';
import { validateMythicEchoes } from '../src/ai/validators/mythicEchoValidator';

describe('mythicEchoPipelineDebug', () => {
  it('does not rewrite an established English title into a localized motif paraphrase during normalize', () => {
    const raw = [
      {
        title: 'The Fisherman and the Jinni',
        tradition: 'One Thousand and One Nights',
        resonance: 'A sealed vessel releases a threatening captive power.',
        divergence: 'The dream resolves the threat through cunning reseal.',
        evidence: ['sealed vessel', 'threat after release', 'reseal by trick'],
        confidence: 'high',
      },
    ];
    const normalized = normalizeAmplifications(raw, 1);
    expect(normalized[0]?.title).toBe('The Fisherman and the Jinni');
    expect(normalized[0]?.tradition).toBe('One Thousand and One Nights');

    const transforms = collectAmplificationNormalizeTransforms(raw, normalized);
    expect(transforms.some((t) => t.action === 'field_change')).toBe(false);
    expect(transforms.some((t) => t.action === 'keep')).toBe(true);
  });

  it('flags selected audit vs differently titled production amplification', () => {
    const consistency = checkMythicAuditProductionConsistency(
      {
        archetype_audit: [],
        mythic_audit: [
          {
            title: 'The Fisherman and the Jinni',
            tradition: 'One Thousand and One Nights',
            plot_contamination_test: 'pass',
            selected: true,
          },
        ],
      },
      [
        {
          title: 'Ο δαίμονας στο μπουκάλι',
          tradition: 'One Thousand and One Nights / Arabic folktale tradition',
          resonance: 'A bottled power is released and threatens the liberator.',
          divergence: 'The solution does not come through cunning.',
          evidence: ['bottle', 'threat', 'release'],
          confidence: 'high',
        },
      ]
    );

    expect(consistency.ok).toBe(false);
    expect(consistency.violations).toEqual(
      expect.arrayContaining([
        'production_title_mismatch',
        'production_tradition_mismatch',
        'production_title_diverged_from_selected_established_title',
      ])
    );
  });

  it('enforces debug invariant by clearing mismatched production without rewriting titles', () => {
    const mismatched = [
      {
        title: 'Ο δαίμονας στο μπουκάλι',
        tradition: 'One Thousand and One Nights / Arabic folktale tradition',
        resonance: 'A bottled power is released and threatens the liberator.',
        divergence: 'The solution does not come through cunning.',
        evidence: ['bottle', 'threat', 'release'],
        confidence: 'high' as const,
      },
    ];
    const enforced = applyMythicAuditProductionInvariant({
      diagnostics: {
        archetype_audit: [],
        mythic_audit: [
          {
            title: 'The Fisherman and the Jinni',
            tradition: 'One Thousand and One Nights',
            selected: true,
          },
        ],
      },
      amplifications: mismatched,
      enforce: true,
    });

    expect(enforced.amplifications).toEqual([]);
    expect(enforced.cleared).toEqual(mismatched);
    expect(enforced.consistency.ok).toBe(false);
  });

  it('builds a staged debug packet exposing raw model vs post-validation drift', () => {
    const rawModel = {
      archetypes: [],
      amplifications: [
        {
          title: 'Ο δαίμονας στο μπουκάλι',
          tradition: 'One Thousand and One Nights / Arabic folktale tradition',
          resonance: 'A bottled power is released and threatens the liberator after long captivity.',
          divergence: 'The solution does not come through cunning.',
          evidence: ['bottle', 'threat', 'release'],
          confidence: 'high',
        },
      ],
      interpretive_diagnostics: {
        archetype_audit: [],
        mythic_audit: [
          {
            title: 'The Fisherman and the Jinni',
            tradition: 'One Thousand and One Nights',
            plot_contamination_test: 'pass',
            selected: true,
          },
        ],
      },
    };
    const normalized = normalizeAmplifications(rawModel.amplifications, 1);
    const validation = validateMythicEchoes(normalized, { max: 1 });
    const packet = buildMythicEchoPipelineDebugPacket({
      rawModelObject: rawModel,
      parsedAmplifications: rawModel.amplifications,
      normalizedBeforeValidation: normalized,
      mythicValidation: validation,
      postValidationAmplifications: validation.accepted,
      diagnostics: {
        archetype_audit: [],
        mythic_audit: [
          {
            title: 'The Fisherman and the Jinni',
            tradition: 'One Thousand and One Nights',
            plot_contamination_test: 'pass',
            selected: true,
          },
        ],
      },
      invariantClearedAmplifications: validation.accepted,
    });

    const rawAmps = packet.raw_model_amplifications as unknown[];
    expect(snapshotMythicEcho(rawAmps[0])?.title).toBe('Ο δαίμονας στο μπουκάλι');
    expect(packet.parsed_amplifications).toEqual(rawModel.amplifications);
    expect(packet.normalized_amplifications[0]?.title).toBe('Ο δαίμονας στο μπουκάλι');
    expect(packet.validator_decisions.some((d) => d.decision === 'accept')).toBe(true);
    expect(packet.post_validation_amplifications[0]?.title).toBe('Ο δαίμονας στο μπουκάλι');
    expect(packet.summary.raw_model_produced_amplification_object).toBe(true);
    expect(packet.summary.audit_only_selection_without_production_object).toBe(false);
    expect(packet.audit_production_consistency.ok).toBe(false);
    expect(packet.invariant_rejected_amplifications?.[0]?.title).toBe('Ο δαίμονας στο μπουκάλι');
    expect(packet.transforms.some((t) => t.stage === 'audit_production_invariant')).toBe(true);
    expect(packet.transforms.some((t) => String(t.detail).includes('did NOT auto-promote'))).toBe(
      true
    );
  });

  it('exposes audit-only selection when model selects mythic_audit but emits no production amp', () => {
    const rawModel = {
      archetypes: [],
      amplifications: [],
      interpretive_diagnostics: {
        archetype_audit: [],
        mythic_audit: [
          {
            title: 'Jinn in the Bottle',
            tradition: 'Arabic folktale tradition',
            title_type: 'motif_label',
            plot_contamination_test: 'pass',
            selected: true,
            reason: 'surface vessel motif',
          },
        ],
      },
    };
    const normalized = normalizeAmplifications(rawModel.amplifications, 1);
    const validation = validateMythicEchoes(normalized, { max: 1 });
    const packet = buildMythicEchoPipelineDebugPacket({
      rawModelObject: rawModel,
      parsedAmplifications: rawModel.amplifications,
      normalizedBeforeValidation: normalized,
      mythicValidation: validation,
      postValidationAmplifications: validation.accepted,
      diagnostics: {
        archetype_audit: [],
        mythic_audit: [
          {
            title: 'Jinn in the Bottle',
            tradition: 'Arabic folktale tradition',
            title_type: 'motif_label',
            plot_contamination_test: 'pass',
            selected: true,
            reason: 'surface vessel motif',
          },
        ],
      },
    });

    expect(packet.summary.raw_model_produced_amplification_object).toBe(false);
    expect(packet.summary.audit_only_selection_without_production_object).toBe(true);
    expect(packet.summary.selected_audit_title).toBe('Jinn in the Bottle');
    expect(packet.summary.production_amplification_after_validation).toBeNull();
    expect(packet.selected_mythic_audit?.title).toBe('Jinn in the Bottle');
    expect(packet.raw_model_amplifications).toEqual([]);
    expect(packet.parsed_amplifications).toEqual([]);
    expect(packet.normalized_amplifications).toEqual([]);
    expect(packet.validator_decisions).toEqual([]);
    expect(packet.post_validation_amplifications).toEqual([]);
    expect(packet.audit_production_consistency.ok).toBe(false);
    expect(packet.audit_production_consistency.violations).toContain(
      'selected_audit_with_empty_production_amplification'
    );
    expect(packet.summary.note).toMatch(/never auto-promoted/i);
  });

  it('records specific validator rejection reasons in the pipeline packet', () => {
    const weak = {
      title: 'Jinni',
      tradition: 'folk tradition',
      resonance: 'short',
      divergence: 'x',
      evidence: ['bottle'],
      confidence: 'medium' as const,
    };
    const validation = validateMythicEchoes([weak], { max: 1 });
    expect(validation.rejected[0]?.reason).toBe('bare_figure_title');
    const packet = buildMythicEchoPipelineDebugPacket({
      rawModelObject: { amplifications: [weak], interpretive_diagnostics: null },
      parsedAmplifications: [weak],
      normalizedBeforeValidation: [weak],
      mythicValidation: validation,
      postValidationAmplifications: [],
      diagnostics: null,
    });
    expect(packet.validator_decisions).toEqual([
      expect.objectContaining({ decision: 'reject', reason: 'bare_figure_title' }),
    ]);
  });

  it('passes when selected audit title/tradition exactly match production', () => {
    const echo = {
      title: 'The Fisherman and the Jinni',
      tradition: 'One Thousand and One Nights',
      resonance: 'A sealed vessel releases a threatening captive power after long captivity.',
      divergence: 'The dream reseals the threat through a cunning bargain.',
      evidence: ['sealed vessel', 'threat after release', 'reseal by trick'],
      confidence: 'high' as const,
    };
    const consistency = checkMythicAuditProductionConsistency(
      {
        archetype_audit: [],
        mythic_audit: [
          {
            title: 'The Fisherman and the Jinni',
            tradition: 'One Thousand and One Nights',
            selected: true,
          },
        ],
      },
      [echo]
    );
    expect(consistency.ok).toBe(true);
    expect(consistency.violations).toEqual([]);
  });
});
