/**
 * Closed mechanism tags for Archetypal Echo selection (v4.1.1).
 * General psychodynamic mechanisms — not dream-specific overfitting cues.
 */

export const ARCHETYPE_MECHANISM_TAGS = [
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

export type ArchetypeMechanismTag = (typeof ARCHETYPE_MECHANISM_TAGS)[number];

export const ARCHETYPE_CARRIER_KINDS = [
  'figure',
  'relationship',
  'dream_ego_action',
  'whole_dream_process',
  'collective_setting',
] as const;

export type ArchetypeCarrierKind = (typeof ARCHETYPE_CARRIER_KINDS)[number];

export const ARCHETYPE_MECHANISM_ACTORS = [
  'dream_ego',
  'other_figure',
  'relationship',
  'whole_process',
] as const;

export type ArchetypeMechanismActor = (typeof ARCHETYPE_MECHANISM_ACTORS)[number];

const TAG_SET = new Set<string>(ARCHETYPE_MECHANISM_TAGS);
const ACTOR_SET = new Set<string>(ARCHETYPE_MECHANISM_ACTORS);

export function isArchetypeMechanismTag(value: string): value is ArchetypeMechanismTag {
  return TAG_SET.has(value);
}

export function isArchetypeMechanismActor(value: string): value is ArchetypeMechanismActor {
  return ACTOR_SET.has(value);
}

export function normalizeMechanismActor(raw: unknown): ArchetypeMechanismActor | undefined {
  if (typeof raw !== 'string') return undefined;
  const value = raw.trim();
  return isArchetypeMechanismActor(value) ? value : undefined;
}

/** Carrier kind → required mechanism_actor alignment. */
export const CARRIER_KIND_TO_MECHANISM_ACTOR: Partial<
  Record<ArchetypeCarrierKind, ArchetypeMechanismActor>
> = {
  dream_ego_action: 'dream_ego',
  figure: 'other_figure',
  relationship: 'relationship',
  whole_dream_process: 'whole_process',
};

export function carrierMechanismActorAlignmentReason(
  carrierKind: ArchetypeCarrierKind | undefined,
  mechanismActor: ArchetypeMechanismActor | undefined
): string | null {
  if (!carrierKind) return 'missing_carrier_kind_for_actor_alignment';
  if (!mechanismActor) return 'missing_mechanism_actor';
  const expected = CARRIER_KIND_TO_MECHANISM_ACTOR[carrierKind];
  if (!expected) return `unsupported_carrier_kind_for_actor_alignment:${carrierKind}`;
  if (mechanismActor !== expected) {
    return `carrier_mechanism_actor_mismatch:${carrierKind}->${mechanismActor}`;
  }
  return null;
}

export function normalizeMechanismTags(raw: unknown): ArchetypeMechanismTag[] {
  if (!Array.isArray(raw)) return [];
  const out: ArchetypeMechanismTag[] = [];
  for (const item of raw) {
    if (typeof item !== 'string') continue;
    const tag = item.trim();
    if (!isArchetypeMechanismTag(tag)) continue;
    if (!out.includes(tag)) out.push(tag);
  }
  return out;
}

export function normalizeCarrierKind(raw: unknown): ArchetypeCarrierKind | undefined {
  if (typeof raw !== 'string') return undefined;
  const value = raw.trim();
  return (ARCHETYPE_CARRIER_KINDS as readonly string[]).includes(value)
    ? (value as ArchetypeCarrierKind)
    : undefined;
}

/**
 * Hard-gate recipes keyed by catalog id.
 * Groups in `anyOfGroups` are OR within the group; groups are ANDed together with `allOf`.
 */
export type MechanismHardGate = {
  allOf?: ArchetypeMechanismTag[];
  anyOfGroups?: ArchetypeMechanismTag[][];
};

const TRICKSTER_MECHANISM_GATE: MechanismHardGate = {
  anyOfGroups: [['deception_or_feigned_belief', 'inversion_or_rule_bending']],
  allOf: ['power_asymmetry_reversed'],
};

export const ARCHETYPE_MECHANISM_HARD_GATES: Record<string, MechanismHardGate> = {
  trickster: TRICKSTER_MECHANISM_GATE,
  hero: {
    allOf: ['ordeal_or_confrontation', 'purposeful_quest_movement', 'boon_or_changed_outcome'],
  },
  guide_psychopomp: {
    allOf: ['active_threshold_guidance', 'crossing_between_domains'],
  },
  lover: {
    allOf: ['bond_organizes_dream'],
    anyOfGroups: [['devotion_or_longing', 'union_separation_or_loss']],
  },
  death_rebirth: {
    allOf: [
      'dissolution_or_symbolic_death',
      'revival_or_return',
      'identity_or_status_transformed',
    ],
  },
};

export function mechanismGateRejectionReason(
  catalogId: string,
  tags: ArchetypeMechanismTag[]
): string | null {
  const gate = ARCHETYPE_MECHANISM_HARD_GATES[catalogId];
  if (!gate) return null;
  const tagSet = new Set(tags);

  if (gate.allOf) {
    for (const need of gate.allOf) {
      if (!tagSet.has(need)) {
        return `missing_required_mechanism:${need}`;
      }
    }
  }
  if (gate.anyOfGroups) {
    for (const group of gate.anyOfGroups) {
      if (!group.some((tag) => tagSet.has(tag))) {
        return `missing_any_of_mechanisms:${group.join('|')}`;
      }
    }
  }
  return null;
}

/** Compact prompt line for gated labels. */
export function formatHardGateForPrompt(gate: MechanismHardGate): string {
  const parts: string[] = [];
  if (gate.anyOfGroups) {
    for (const group of gate.anyOfGroups) {
      parts.push(`(${group.join(' | ')})`);
    }
  }
  if (gate.allOf?.length) {
    parts.push(gate.allOf.join(' & '));
  }
  return parts.join(' & ');
}

export function formatClosedMechanismTagsForPrompt(): string {
  return ARCHETYPE_MECHANISM_TAGS.join(', ');
}
