/**
 * Provider-facing JSON schema for dream_extraction (namespace enums).
 * Core builder — no generated imports (safe for build-catalog-id-enums.ts).
 */

const MECHANISM_TAG_IDS = [
  'active_threshold_guidance',
  'crossing_between_domains',
  'deception_or_feigned_belief',
  'inversion_or_rule_bending',
  'power_asymmetry_reversed',
  'public_role_or_social_mask',
  'private_self_conflict',
  'devotion_or_longing',
  'union_separation_or_loss',
  'bond_organizes_dream',
  'dissolution_or_symbolic_death',
  'revival_or_return',
  'identity_or_status_transformed',
  'engulfing_or_devouring',
  'possessive_anti_separation',
  'consequential_wisdom_or_warning',
  'guidance_changes_action_or_outcome',
  'ordeal_or_confrontation',
  'purposeful_quest_movement',
  'boon_or_changed_outcome',
] as const;

const CORE_MODE_VALUES = ['Core Tension', 'Core State', 'Core Shift', 'Core Restoration'] as const;

function confidenceProperty() {
  return { type: 'string', enum: ['high', 'medium'] };
}

function archetypeEchoProperties(archetypeIds: readonly string[]) {
  return {
    archetype_id: { type: 'string', enum: [...archetypeIds] },
    expression: { type: 'string' },
    mechanism_tags: {
      type: 'array',
      items: { type: 'string', enum: [...MECHANISM_TAG_IDS] },
    },
    evidence_ids: { type: 'array', items: { type: 'string' } },
    resonance: { type: 'string' },
    confidence: confidenceProperty(),
  };
}

function mythEchoProperties(mythIds: readonly string[]) {
  return {
    catalog_id: { type: 'string', enum: [...mythIds] },
    resonance: { type: 'string' },
    divergence: { type: 'string' },
    evidence_ids: { type: 'array', items: { type: 'string' } },
    confidence: confidenceProperty(),
  };
}

/** Build schema object (used by build script + runtime response_format). */
export function buildDreamExtractionJsonSchemaObject(
  archetypeIds: readonly string[],
  mythIds: readonly string[]
): Record<string, unknown> {
  return {
    type: 'object',
    additionalProperties: true,
    properties: {
      display_distillation: {
        type: 'object',
        additionalProperties: true,
        properties: {
          essence_title: { type: 'string' },
          essence_line: { type: 'string' },
          dominant_lens: { type: 'string' },
          visible_anchors: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: true,
              properties: {
                label: { type: 'string' },
                type: { type: 'string' },
                salience: {},
                ui_meaning: { type: 'string' },
              },
            },
          },
          main_tension: { type: ['string', 'null'] },
          dream_movement: { type: 'string' },
          movement_line: { type: ['string', 'null'] },
        },
      },
      symbols: { type: 'array', items: { type: 'string' } },
      symbol_stances: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          properties: {
            symbol: { type: 'string' },
            stance: { type: 'string' },
          },
          required: ['symbol', 'stance'],
        },
      },
      archetypes: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          properties: archetypeEchoProperties(archetypeIds),
          required: [
            'archetype_id',
            'expression',
            'mechanism_tags',
            'evidence_ids',
            'resonance',
            'confidence',
          ],
        },
      },
      landscapes: { type: 'array', items: { type: 'string' } },
      affects: { type: 'array', items: { type: 'string' } },
      motifs: { type: 'array', items: { type: 'string' } },
      relational_dynamics: { type: 'array', items: { type: 'string' } },
      thresholds: { type: 'array', items: { type: 'string' } },
      central_conflicts: { type: 'array', items: { type: 'string' } },
      core_mode: {
        anyOf: [{ type: 'string', enum: [...CORE_MODE_VALUES] }, { type: 'null' }],
      },
      amplifications: {
        type: 'array',
        maxItems: 1,
        items: {
          type: 'object',
          additionalProperties: false,
          properties: mythEchoProperties(mythIds),
          required: ['catalog_id', 'resonance', 'divergence', 'evidence_ids', 'confidence'],
        },
      },
      interpretive_diagnostics: {
        type: 'object',
        additionalProperties: true,
      },
    },
  };
}

export type DreamExtractionResponseFormat = {
  type: 'json_schema';
  json_schema: {
    name: string;
    strict: boolean;
    schema: Record<string, unknown>;
  };
};

export function buildDreamExtractionResponseFormatFromIds(
  archetypeIds: readonly string[],
  mythIds: readonly string[]
): DreamExtractionResponseFormat {
  return {
    type: 'json_schema',
    json_schema: {
      name: 'dream_extraction_v12',
      strict: false,
      schema: buildDreamExtractionJsonSchemaObject(archetypeIds, mythIds),
    },
  };
}
