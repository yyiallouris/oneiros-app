/**
 * Dev/test-only Interpretive Echoes diagnostics (v3.9 dream-map audit).
 * Never persist into interpretation rows or surface in Dream Detail UI.
 */

export type ArchetypeCarrierKind =
  | 'figure'
  | 'dream_ego_action'
  | 'relationship'
  | 'configuration'
  | 'transformation'
  | string;

export type YesNo = 'yes' | 'no' | string;
export type GatePassFail = 'pass' | 'fail' | string;

export type MythicTitleType =
  | 'specific_tale'
  | 'episode'
  | 'frame_story'
  | 'plot_bearing_cycle'
  | 'collection_or_corpus'
  | 'generic_family'
  | string;

export type DreamMapDiagnostic = {
  beats?: string[];
  role_verb_mechanism?: string;
  /** v3.9 — 1–3 consecutive beat ids. */
  decisive_span?: string[];
  causal_omission_check?: 'pass' | 'repaired' | string;
  dominant_relation?: string;
  ending?: string;
};

export type ArchetypeAuditEntry = {
  label: string;
  carrier: string;
  carrier_kind?: ArchetypeCarrierKind;
  function_match?: YesNo;
  structural_importance?: YesNo;
  evidence?: string[];
  evidence_beats?: string[];
  adds_precision?: YesNo;
  selected: boolean;
  reason?: string;
  /** Legacy v3.7 gate bag — still accepted when parsing. */
  gate_results?: Record<string, string | undefined>;
};

export type MythicMatchedBeat = {
  canonical_beat?: string;
  candidate_beat?: string;
  dream_beat?: string;
  dream_evidence: string;
};

export type MythicAuditEntry = {
  title: string;
  tradition: string;
  title_type?: MythicTitleType;
  independent_plot_anchors?: string[];
  story_mechanism?: string;
  canonical_beats?: string[];
  candidate_signature?: string[];
  plot_contamination_test?: GatePassFail;
  matched_beats?: MythicMatchedBeat[];
  surface_stripping_result?: GatePassFail;
  selected: boolean;
  reason?: string;
};

export type InterpretiveEchoDiagnostics = {
  dream_map?: DreamMapDiagnostic;
  /** Legacy v3.7 spine — accepted if present. */
  structural_spine?: Record<string, unknown>;
  archetype_audit: ArchetypeAuditEntry[];
  mythic_audit: MythicAuditEntry[];
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

function asYesNo(value: unknown): YesNo | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) return undefined;
  if (trimmed === 'yes' || trimmed === 'no' || trimmed === 'pass' || trimmed === 'fail') {
    if (trimmed === 'pass') return 'yes';
    if (trimmed === 'fail') return 'no';
    return trimmed;
  }
  return trimmed;
}

function asPassFail(value: unknown): GatePassFail | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) return undefined;
  return trimmed;
}

function asDecisiveSpan(raw: Record<string, unknown>): string[] {
  const span = asStringArray(raw.decisive_span ?? raw.decisiveSpan, 3);
  if (span.length > 0) return span;
  // Legacy v3.8.x fields → coerce to span (never expose pivot_beat).
  const legacySpan = asStringArray(raw.leverage_transfer_span ?? raw.leverageTransferSpan, 3);
  if (legacySpan.length > 0) return legacySpan;
  const legacyBeat =
    typeof raw.leverage_transfer_beat === 'string'
      ? raw.leverage_transfer_beat.trim()
      : typeof raw.leverageTransferBeat === 'string'
        ? raw.leverageTransferBeat.trim()
        : '';
  return legacyBeat ? [legacyBeat] : [];
}

function asDreamMap(raw: unknown): DreamMapDiagnostic | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const o = raw as Record<string, unknown>;
  const beats = asStringArray(o.beats, 16);
  const decisive_span = asDecisiveSpan(o);
  const causalCheck =
    typeof o.causal_omission_check === 'string'
      ? o.causal_omission_check.trim()
      : typeof o.causalOmissionCheck === 'string'
        ? o.causalOmissionCheck.trim()
        : undefined;
  const role_verb_mechanism =
    typeof o.role_verb_mechanism === 'string'
      ? o.role_verb_mechanism.trim()
      : typeof o.roleVerbMechanism === 'string'
        ? o.roleVerbMechanism.trim()
        : undefined;
  const map: DreamMapDiagnostic = {
    ...(beats.length > 0 ? { beats } : {}),
    ...(role_verb_mechanism ? { role_verb_mechanism } : {}),
    ...(decisive_span.length > 0 ? { decisive_span } : {}),
    ...(causalCheck ? { causal_omission_check: causalCheck } : {}),
    dominant_relation:
      typeof o.dominant_relation === 'string'
        ? o.dominant_relation.trim()
        : typeof o.dominantRelation === 'string'
          ? o.dominantRelation.trim()
          : undefined,
    ending: typeof o.ending === 'string' ? o.ending.trim() : undefined,
  };
  if (
    !map.beats &&
    !map.role_verb_mechanism &&
    !map.decisive_span &&
    !map.dominant_relation &&
    !map.ending
  ) {
    return undefined;
  }
  return map;
}

function asArchetypeAudit(raw: unknown): ArchetypeAuditEntry | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const label = typeof o.label === 'string' ? o.label.trim() : '';
  if (!label) return null;
  const carrierKind =
    typeof o.carrier_kind === 'string'
      ? o.carrier_kind.trim()
      : typeof o.carrierKind === 'string'
        ? o.carrierKind.trim()
        : undefined;
  const reason =
    typeof o.reason === 'string'
      ? o.reason.trim()
      : typeof o.rejection_reason === 'string'
        ? o.rejection_reason.trim()
        : undefined;
  const evidence = asStringArray(o.evidence ?? o.support, 4);
  const evidence_beats = asStringArray(o.evidence_beats ?? o.evidenceBeats, 8);
  const gateRaw = o.gate_results ?? o.gateResults;
  const gate_results =
    gateRaw && typeof gateRaw === 'object'
      ? Object.fromEntries(
          Object.entries(gateRaw as Record<string, unknown>).map(([k, v]) => [
            k,
            typeof v === 'string' ? v.trim() : undefined,
          ])
        )
      : undefined;
  const function_match =
    asYesNo(o.function_match ?? o.functionMatch) ??
    (gate_results?.function ? asYesNo(gate_results.function) : undefined);
  const structural_importance =
    asYesNo(o.structural_importance ?? o.structuralImportance) ??
    (gate_results?.structural_weight ? asYesNo(gate_results.structural_weight) : undefined);
  const adds_precision =
    asYesNo(o.adds_precision ?? o.addsPrecision) ??
    (gate_results?.added_precision ? asYesNo(gate_results.added_precision) : undefined);
  return {
    label,
    carrier: typeof o.carrier === 'string' ? o.carrier.trim() : '',
    ...(carrierKind ? { carrier_kind: carrierKind } : {}),
    ...(function_match ? { function_match } : {}),
    ...(structural_importance ? { structural_importance } : {}),
    ...(evidence.length > 0 ? { evidence } : {}),
    ...(evidence_beats.length > 0 ? { evidence_beats } : {}),
    ...(adds_precision ? { adds_precision } : {}),
    selected: Boolean(o.selected),
    ...(reason ? { reason } : {}),
    ...(gate_results ? { gate_results } : {}),
  };
}

function asMatchedBeat(raw: unknown): MythicMatchedBeat | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const canonical_beat =
    typeof o.canonical_beat === 'string'
      ? o.canonical_beat.trim()
      : typeof o.candidate_beat === 'string'
        ? o.candidate_beat.trim()
        : typeof o.candidateBeat === 'string'
          ? o.candidateBeat.trim()
          : undefined;
  const dream_beat =
    typeof o.dream_beat === 'string'
      ? o.dream_beat.trim()
      : typeof o.dreamBeat === 'string'
        ? o.dreamBeat.trim()
        : undefined;
  const dream_evidence =
    typeof o.dream_evidence === 'string'
      ? o.dream_evidence.trim()
      : typeof o.dreamEvidence === 'string'
        ? o.dreamEvidence.trim()
        : '';
  if (!canonical_beat && !dream_beat && !dream_evidence) return null;
  return {
    ...(canonical_beat ? { canonical_beat, candidate_beat: canonical_beat } : {}),
    ...(dream_beat ? { dream_beat } : {}),
    dream_evidence,
  };
}

function asMythicAudit(raw: unknown): MythicAuditEntry | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const title = typeof o.title === 'string' ? o.title.trim() : '';
  if (!title || title === '[]') return null;
  const canonical = asStringArray(o.canonical_beats ?? o.canonicalBeats ?? o.candidate_signature, 8);
  const matchedRaw = Array.isArray(o.matched_beats)
    ? o.matched_beats
    : Array.isArray(o.matchedBeats)
      ? o.matchedBeats
      : [];
  const matched_beats = matchedRaw
    .map(asMatchedBeat)
    .filter((item): item is MythicMatchedBeat => item != null)
    .slice(0, 8);
  const reason =
    typeof o.reason === 'string'
      ? o.reason.trim()
      : typeof o.rejection_reason === 'string'
        ? o.rejection_reason.trim()
        : undefined;
  const story_mechanism =
    typeof o.story_mechanism === 'string'
      ? o.story_mechanism.trim()
      : typeof o.storyMechanism === 'string'
        ? o.storyMechanism.trim()
        : undefined;
  const title_type =
    typeof o.title_type === 'string'
      ? o.title_type.trim()
      : typeof o.titleType === 'string'
        ? o.titleType.trim()
        : undefined;
  const independent_plot_anchors = asStringArray(
    o.independent_plot_anchors ?? o.independentPlotAnchors,
    4
  );
  const plot_contamination_test = asPassFail(
    o.plot_contamination_test ?? o.plotContaminationTest
  );
  const surface_stripping_result = asPassFail(
    o.surface_stripping_result ?? o.surfaceStrippingResult
  );
  return {
    title,
    tradition: typeof o.tradition === 'string' ? o.tradition.trim() : '',
    ...(title_type ? { title_type } : {}),
    ...(independent_plot_anchors.length > 0 ? { independent_plot_anchors } : {}),
    ...(story_mechanism ? { story_mechanism } : {}),
    ...(canonical.length > 0 ? { canonical_beats: canonical, candidate_signature: canonical } : {}),
    ...(plot_contamination_test ? { plot_contamination_test } : {}),
    ...(matched_beats.length > 0 ? { matched_beats } : {}),
    ...(surface_stripping_result ? { surface_stripping_result } : {}),
    selected: Boolean(o.selected),
    ...(reason ? { reason } : {}),
  };
}

/** Parse diagnostics from model JSON; never throws. */
export function parseInterpretiveEchoDiagnostics(raw: unknown): InterpretiveEchoDiagnostics | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const hasArchetypeAudit = Array.isArray(o.archetype_audit);
  const hasMythicAudit = Array.isArray(o.mythic_audit);
  const hasLegacyArchetype = Array.isArray(o.archetype_candidates);
  const hasLegacyMythic = Array.isArray(o.mythic_candidates);
  const hasDreamMap = o.dream_map != null || o.dreamMap != null;
  const hasSpine = o.structural_spine != null || o.structuralSpine != null;
  if (
    !hasArchetypeAudit &&
    !hasMythicAudit &&
    !hasLegacyArchetype &&
    !hasLegacyMythic &&
    !hasDreamMap &&
    !hasSpine
  ) {
    return null;
  }

  const archetypeAuditSource = hasArchetypeAudit
    ? o.archetype_audit
    : hasLegacyArchetype
      ? o.archetype_candidates
      : [];
  const mythicAuditSource = hasMythicAudit
    ? o.mythic_audit
    : hasLegacyMythic
      ? o.mythic_candidates
      : [];
  const archetype_audit = Array.isArray(archetypeAuditSource)
    ? archetypeAuditSource
        .map(asArchetypeAudit)
        .filter((item): item is ArchetypeAuditEntry => item != null)
    : [];
  const mythic_audit = Array.isArray(mythicAuditSource)
    ? mythicAuditSource
        .map(asMythicAudit)
        .filter((item): item is MythicAuditEntry => item != null)
    : [];
  const dream_map = asDreamMap(o.dream_map ?? o.dreamMap);
  const structural_spine =
    o.structural_spine && typeof o.structural_spine === 'object'
      ? (o.structural_spine as Record<string, unknown>)
      : o.structuralSpine && typeof o.structuralSpine === 'object'
        ? (o.structuralSpine as Record<string, unknown>)
        : undefined;

  return {
    ...(dream_map ? { dream_map } : {}),
    ...(structural_spine ? { structural_spine } : {}),
    archetype_audit,
    mythic_audit,
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
    hasDreamMap: Boolean(diagnostics.dream_map),
    dreamMapBeatCount: diagnostics.dream_map?.beats?.length ?? 0,
    decisiveSpanLen: diagnostics.dream_map?.decisive_span?.length ?? 0,
    hasRoleVerbMechanism: Boolean(diagnostics.dream_map?.role_verb_mechanism),
    archetypeAuditCount: diagnostics.archetype_audit.length,
    mythicAuditCount: diagnostics.mythic_audit.length,
    selectedArchetypeLabels: diagnostics.archetype_audit.filter((c) => c.selected).map((c) => c.label).slice(0, 4),
    rejectedArchetypeLabels: diagnostics.archetype_audit.filter((c) => !c.selected).map((c) => c.label).slice(0, 6),
    archetypeCarrierKinds: diagnostics.archetype_audit
      .map((c) => c.carrier_kind)
      .filter(Boolean)
      .slice(0, 6),
    selectedMythicTitles: diagnostics.mythic_audit.filter((c) => c.selected).map((c) => c.title).slice(0, 2),
    rejectedMythicTitles: diagnostics.mythic_audit.filter((c) => !c.selected).map((c) => c.title).slice(0, 4),
    mythicTitleTypes: diagnostics.mythic_audit.map((c) => c.title_type).filter(Boolean).slice(0, 4),
  };
}
