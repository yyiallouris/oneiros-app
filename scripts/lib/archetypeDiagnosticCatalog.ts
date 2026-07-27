import type { ArchetypeDefinition } from '../../src/ai/catalogs/archetypeCatalog.v1';
import { getArchetypeDefinitionById } from '../../src/ai/catalogs/archetypeCatalog.v1';
import {
  ARCHETYPE_MECHANISM_HARD_GATES,
  formatHardGateForPrompt,
  type MechanismHardGate,
} from '../../src/ai/archetypeMechanisms';

export type ArchetypeProductionSnapshot = {
  archetype_id: string;
  catalog_record: ArchetypeDefinition;
  mechanism_hard_gate: MechanismHardGate | null;
  mechanism_hard_gate_prompt: string | null;
  prompt_facing_line: string;
  validator_note: string;
};

function formatPromptFacingLine(def: ArchetypeDefinition): string {
  const lines = [
    `id=${def.id} label:${def.canonicalLabel}`,
    `  function: ${def.coreFunction}`,
    `  select when: ${def.selectWhen.join('; ')}`,
    `  not enough: ${def.insufficientWhen.join('; ')}`,
  ];
  const gate = ARCHETYPE_MECHANISM_HARD_GATES[def.id];
  if (gate) {
    lines.push(`  require mechanisms: ${formatHardGateForPrompt(gate)}`);
  }
  return lines.join('\n');
}

export function getArchetypeProductionSnapshot(
  archetypeId: string
): ArchetypeProductionSnapshot | null {
  const def = getArchetypeDefinitionById(archetypeId);
  if (!def) return null;
  const gate = ARCHETYPE_MECHANISM_HARD_GATES[archetypeId] ?? null;
  const validatorNote = gate
    ? 'Rejected when required mechanism tags are missing after normalization.'
    : 'No mechanism hard gate; acceptance depends on catalog select/insufficient semantics and general validator rules only.';
  return {
    archetype_id: archetypeId,
    catalog_record: def,
    mechanism_hard_gate: gate,
    mechanism_hard_gate_prompt: gate ? formatHardGateForPrompt(gate) : null,
    prompt_facing_line: formatPromptFacingLine(def),
    validator_note: validatorNote,
  };
}

export type ArchetypeStageRunExtract = {
  run_id: string;
  source_run_file: string;
  raw_archetypes: unknown[];
  parsed_archetypes: unknown[];
  normalized_archetypes: unknown[];
  validator_decisions: unknown[];
  post_validation_archetypes: unknown[];
  archetype_rejected: unknown[];
  post_archetype_ids: string[];
};

export function extractArchetypeStageRun(
  packet: Record<string, unknown>,
  sourceRunFile: string
): ArchetypeStageRunExtract {
  const postIds = Array.isArray(packet.post_validation_archetypes)
    ? (packet.post_validation_archetypes as Array<{ archetype_id?: string }>)
        .map((a) => a.archetype_id)
        .filter((id): id is string => typeof id === 'string' && id.length > 0)
    : [];
  return {
    run_id: String(packet.run ?? packet.run_id ?? ''),
    source_run_file: sourceRunFile,
    raw_archetypes: Array.isArray(packet.raw_archetypes) ? packet.raw_archetypes : [],
    parsed_archetypes: Array.isArray(packet.parsed_archetypes) ? packet.parsed_archetypes : [],
    normalized_archetypes: Array.isArray(packet.normalized_archetypes)
      ? packet.normalized_archetypes
      : [],
    validator_decisions: Array.isArray(packet.validator_decisions)
      ? packet.validator_decisions
      : [],
    post_validation_archetypes: Array.isArray(packet.post_validation_archetypes)
      ? packet.post_validation_archetypes
      : [],
    archetype_rejected: Array.isArray(packet.archetype_rejected) ? packet.archetype_rejected : [],
    post_archetype_ids: postIds,
  };
}

export function countPostArchetype(runs: ArchetypeStageRunExtract[], archetypeId: string): number {
  return runs.filter((run) => run.post_archetype_ids.includes(archetypeId)).length;
}
