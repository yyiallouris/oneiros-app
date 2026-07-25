/**
 * Dev/test-only Interpretive Echoes candidate diagnostics.
 * Never persist into interpretation rows or surface in Dream Detail UI.
 */

export type ArchetypeCandidateDiagnostic = {
  label: string;
  carrier: string;
  support: string[];
  counterevidence: string[];
  centrality: number;
  selected: boolean;
  rejection_reason?: string;
};

export type MythicCandidateDiagnostic = {
  title: string;
  tradition: string;
  distinctive_cluster: string[];
  structural_strength: 'high' | 'medium' | 'low' | string;
  selected: boolean;
  rejection_reason?: string;
};

export type InterpretiveEchoDiagnostics = {
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

function asArchetypeCandidate(raw: unknown): ArchetypeCandidateDiagnostic | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const label = typeof o.label === 'string' ? o.label.trim() : '';
  if (!label) return null;
  const centralityRaw = typeof o.centrality === 'number' ? o.centrality : Number(o.centrality);
  return {
    label,
    carrier: typeof o.carrier === 'string' ? o.carrier.trim() : '',
    support: asStringArray(o.support),
    counterevidence: asStringArray(o.counterevidence),
    centrality: Number.isFinite(centralityRaw) ? Math.max(0, Math.min(5, Math.round(centralityRaw))) : 0,
    selected: Boolean(o.selected),
    rejection_reason: typeof o.rejection_reason === 'string' ? o.rejection_reason.trim() : undefined,
  };
}

function asMythicCandidate(raw: unknown): MythicCandidateDiagnostic | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const title = typeof o.title === 'string' ? o.title.trim() : '';
  if (!title) return null;
  return {
    title,
    tradition: typeof o.tradition === 'string' ? o.tradition.trim() : '',
    distinctive_cluster: asStringArray(o.distinctive_cluster),
    structural_strength: typeof o.structural_strength === 'string' ? o.structural_strength.trim() : 'low',
    selected: Boolean(o.selected),
    rejection_reason: typeof o.rejection_reason === 'string' ? o.rejection_reason.trim() : undefined,
  };
}

/** Parse diagnostics from model JSON; never throws. */
export function parseInterpretiveEchoDiagnostics(raw: unknown): InterpretiveEchoDiagnostics | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const archetype_candidates = Array.isArray(o.archetype_candidates)
    ? o.archetype_candidates.map(asArchetypeCandidate).filter((item): item is ArchetypeCandidateDiagnostic => item != null)
    : [];
  const mythic_candidates = Array.isArray(o.mythic_candidates)
    ? o.mythic_candidates.map(asMythicCandidate).filter((item): item is MythicCandidateDiagnostic => item != null)
    : [];
  if (archetype_candidates.length === 0 && mythic_candidates.length === 0) return null;
  return { archetype_candidates, mythic_candidates };
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
    archetypeCandidateCount: diagnostics.archetype_candidates.length,
    mythicCandidateCount: diagnostics.mythic_candidates.length,
    selectedArchetypeLabels: diagnostics.archetype_candidates.filter((c) => c.selected).map((c) => c.label).slice(0, 4),
    rejectedArchetypeLabels: diagnostics.archetype_candidates.filter((c) => !c.selected).map((c) => c.label).slice(0, 6),
    selectedMythicTitles: diagnostics.mythic_candidates.filter((c) => c.selected).map((c) => c.title).slice(0, 2),
    rejectedMythicTitles: diagnostics.mythic_candidates.filter((c) => !c.selected).map((c) => c.title).slice(0, 4),
  };
}
