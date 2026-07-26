/**
 * Dev/test-only Interpretive Echoes candidate diagnostics.
 * Never persist into interpretation rows or surface in Dream Detail UI.
 */

export type ArchetypeCarrierKind =
  | 'figure'
  | 'dream_ego_action'
  | 'relationship'
  | 'configuration'
  | 'transformation'
  | string;

export type ArchetypeCandidateDiagnostic = {
  label: string;
  carrier: string;
  carrier_kind?: ArchetypeCarrierKind;
  support: string[];
  counterevidence: string[];
  centrality: number;
  selected: boolean;
  rejection_reason?: string;
  evaluation_notes?: string;
};

export type MythicNarrativeSpecificity =
  | 'specific_tale'
  | 'cycle'
  | 'generic_complex'
  | 'motif'
  | string;

export type MythicCandidateDiagnostic = {
  title: string;
  tradition: string;
  /** Stable slug-like id after alias merge (debug only). */
  canonical_id?: string;
  aliases_merged?: string[];
  /** How specific the candidate is after canonicalization (debug only). */
  narrative_specificity?: MythicNarrativeSpecificity;
  /** Prefer distinctive_cluster; `support` from the model is accepted as an alias. */
  distinctive_cluster: string[];
  support?: string[];
  sequence_match?: number;
  role_match?: number;
  defining_action_match?: number;
  turning_point_match?: number;
  linked_image_match?: number;
  object_association?: number;
  structural_strength: 'high' | 'medium' | 'low' | string;
  selected: boolean;
  rejection_reason?: string;
  /** Concrete gate failure when a stronger structural candidate loses (debug only). */
  gate_failure?: string;
};

export type InterpretiveEchoDiagnostics = {
  /** Action that reverses power / changes what becomes possible (debug only). */
  decisive_turning_point?: string;
  archetype_candidates: ArchetypeCandidateDiagnostic[];
  mythic_candidates: MythicCandidateDiagnostic[];
};

export type InterpretiveEchoDebugPayload = {
  prompt_id: string;
  prompt_version: string;
  schema_version: number;
  model?: string | null;
  interpretive_diagnostics: InterpretiveEchoDiagnostics;
  selection_summary?: string;
};

function asStringArray(value: unknown, max = 12): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, max);
}

function asScore0to5(value: unknown): number | undefined {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return undefined;
  return Math.max(0, Math.min(5, Math.round(n)));
}

function asArchetypeCandidate(raw: unknown): ArchetypeCandidateDiagnostic | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const label = typeof o.label === 'string' ? o.label.trim() : '';
  if (!label) return null;
  const centralityRaw = typeof o.centrality === 'number' ? o.centrality : Number(o.centrality);
  const evaluationNotes =
    typeof o.evaluation_notes === 'string'
      ? o.evaluation_notes.trim()
      : typeof o.evaluationNotes === 'string'
        ? o.evaluationNotes.trim()
        : undefined;
  const carrierKind =
    typeof o.carrier_kind === 'string'
      ? o.carrier_kind.trim()
      : typeof o.carrierKind === 'string'
        ? o.carrierKind.trim()
        : undefined;
  return {
    label,
    carrier: typeof o.carrier === 'string' ? o.carrier.trim() : '',
    ...(carrierKind ? { carrier_kind: carrierKind } : {}),
    support: asStringArray(o.support),
    counterevidence: asStringArray(o.counterevidence),
    centrality: Number.isFinite(centralityRaw) ? Math.max(0, Math.min(5, Math.round(centralityRaw))) : 0,
    selected: Boolean(o.selected),
    rejection_reason: typeof o.rejection_reason === 'string' ? o.rejection_reason.trim() : undefined,
    ...(evaluationNotes ? { evaluation_notes: evaluationNotes } : {}),
  };
}

function asMythicCandidate(raw: unknown): MythicCandidateDiagnostic | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const title = typeof o.title === 'string' ? o.title.trim() : '';
  if (!title) return null;
  const support = asStringArray(o.support);
  const distinctive = asStringArray(o.distinctive_cluster);
  const cluster = distinctive.length > 0 ? distinctive : support;
  const aliases = asStringArray(o.aliases_merged ?? o.aliasesMerged, 8);
  const canonicalId =
    typeof o.canonical_id === 'string'
      ? o.canonical_id.trim()
      : typeof o.canonicalId === 'string'
        ? o.canonicalId.trim()
        : undefined;
  const narrativeSpecificity =
    typeof o.narrative_specificity === 'string'
      ? o.narrative_specificity.trim()
      : typeof o.narrativeSpecificity === 'string'
        ? o.narrativeSpecificity.trim()
        : undefined;
  const gateFailure =
    typeof o.gate_failure === 'string'
      ? o.gate_failure.trim()
      : typeof o.gateFailure === 'string'
        ? o.gateFailure.trim()
        : undefined;
  const sequence_match = asScore0to5(o.sequence_match ?? o.sequenceMatch);
  const role_match = asScore0to5(o.role_match ?? o.roleMatch);
  const defining_action_match = asScore0to5(o.defining_action_match ?? o.definingActionMatch);
  const turning_point_match = asScore0to5(o.turning_point_match ?? o.turningPointMatch);
  const linked_image_match = asScore0to5(o.linked_image_match ?? o.linkedImageMatch);
  const object_association = asScore0to5(o.object_association ?? o.objectAssociation);
  return {
    title,
    tradition: typeof o.tradition === 'string' ? o.tradition.trim() : '',
    ...(canonicalId ? { canonical_id: canonicalId } : {}),
    ...(aliases.length > 0 ? { aliases_merged: aliases } : {}),
    ...(narrativeSpecificity ? { narrative_specificity: narrativeSpecificity } : {}),
    distinctive_cluster: cluster,
    ...(support.length > 0 ? { support } : {}),
    ...(sequence_match !== undefined ? { sequence_match } : {}),
    ...(role_match !== undefined ? { role_match } : {}),
    ...(defining_action_match !== undefined ? { defining_action_match } : {}),
    ...(turning_point_match !== undefined ? { turning_point_match } : {}),
    ...(linked_image_match !== undefined ? { linked_image_match } : {}),
    ...(object_association !== undefined ? { object_association } : {}),
    structural_strength: typeof o.structural_strength === 'string' ? o.structural_strength.trim() : 'medium',
    selected: Boolean(o.selected),
    rejection_reason: typeof o.rejection_reason === 'string' ? o.rejection_reason.trim() : undefined,
    ...(gateFailure ? { gate_failure: gateFailure } : {}),
  };
}

/** Parse diagnostics from model JSON; never throws. */
export function parseInterpretiveEchoDiagnostics(raw: unknown): InterpretiveEchoDiagnostics | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const hasArchetypeKey = Array.isArray(o.archetype_candidates);
  const hasMythicKey = Array.isArray(o.mythic_candidates);
  // Present keys mean the model emitted the debug block — return even if lists are empty
  // so callers can distinguish "omitted" from "empty candidates".
  if (!hasArchetypeKey && !hasMythicKey) return null;
  const archetype_candidates = hasArchetypeKey
    ? o.archetype_candidates!.map(asArchetypeCandidate).filter((item): item is ArchetypeCandidateDiagnostic => item != null)
    : [];
  const mythic_candidates = hasMythicKey
    ? o.mythic_candidates!.map(asMythicCandidate).filter((item): item is MythicCandidateDiagnostic => item != null)
    : [];
  const decisiveTurningPoint =
    typeof o.decisive_turning_point === 'string'
      ? o.decisive_turning_point.trim()
      : typeof o.decisiveTurningPoint === 'string'
        ? o.decisiveTurningPoint.trim()
        : undefined;
  return {
    ...(decisiveTurningPoint ? { decisive_turning_point: decisiveTurningPoint } : {}),
    archetype_candidates,
    mythic_candidates,
  };
}

/** Strip diagnostics from a validated extraction object before persistence. */
export function stripInterpretiveDiagnostics<T extends Record<string, unknown>>(parsed: T): T {
  if (!('interpretive_diagnostics' in parsed)) return parsed;
  const { interpretive_diagnostics: _drop, ...rest } = parsed;
  return rest as T;
}

/** Safe log bag — counts/labels only, never full resonance/dream text. */
export function safeInterpretiveDiagnosticsLog(diagnostics: InterpretiveEchoDiagnostics | null | undefined): Record<string, unknown> {
  if (!diagnostics) return { hasDiagnostics: false };
  return {
    hasDiagnostics: true,
    hasDecisiveTurningPoint: Boolean(diagnostics.decisive_turning_point),
    archetypeCandidateCount: diagnostics.archetype_candidates.length,
    mythicCandidateCount: diagnostics.mythic_candidates.length,
    selectedArchetypeLabels: diagnostics.archetype_candidates.filter((c) => c.selected).map((c) => c.label).slice(0, 4),
    rejectedArchetypeLabels: diagnostics.archetype_candidates.filter((c) => !c.selected).map((c) => c.label).slice(0, 6),
    archetypeCarrierKinds: diagnostics.archetype_candidates
      .map((c) => c.carrier_kind)
      .filter(Boolean)
      .slice(0, 6),
    selectedMythicTitles: diagnostics.mythic_candidates.filter((c) => c.selected).map((c) => c.title).slice(0, 2),
    rejectedMythicTitles: diagnostics.mythic_candidates.filter((c) => !c.selected).map((c) => c.title).slice(0, 4),
    mythicCanonicalIds: diagnostics.mythic_candidates.map((c) => c.canonical_id).filter(Boolean).slice(0, 4),
    mythicNarrativeSpecificity: diagnostics.mythic_candidates
      .map((c) => c.narrative_specificity)
      .filter(Boolean)
      .slice(0, 4),
  };
}
