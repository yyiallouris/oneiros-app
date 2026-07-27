import type { ArchetypalValidationResult } from './validators/archetypalEchoValidator.ts';
import { normalizeMechanismTags } from './archetypeMechanisms.ts';

export type HeroArchetypeTelemetry = {
  hero_raw_count: number;
  hero_post_count: number;
  hero_rejected_mechanism_count: number;
  accepted_confidence_high: number;
  accepted_confidence_medium: number;
  accepted_mechanism_tags: string[];
};

function readArchetypeId(value: unknown): string {
  if (!value || typeof value !== 'object') return '';
  const id = (value as { archetype_id?: unknown }).archetype_id;
  return typeof id === 'string' ? id.trim() : '';
}

function isMechanismRejection(reason: string): boolean {
  return (
    reason === 'missing_mechanism_tags_for_hard_gate' ||
    reason.startsWith('missing_required_mechanism:') ||
    reason.startsWith('missing_any_of_mechanisms:')
  );
}

/** Aggregate Hero counters for production logs — no dream text or resonance. */
export function summarizeHeroArchetypeTelemetry(params: {
  rawCandidates: unknown[];
  validation: ArchetypalValidationResult;
}): HeroArchetypeTelemetry {
  const heroRaw = params.rawCandidates.filter((row) => readArchetypeId(row) === 'hero').length;
  const heroPost = params.validation.accepted.filter((echo) => echo.archetype_id === 'hero').length;
  const heroRejectedMechanism = params.validation.rejected.filter(
    (row) => readArchetypeId(row.echo) === 'hero' && isMechanismRejection(row.reason)
  ).length;

  const acceptedHero = params.validation.accepted.filter((echo) => echo.archetype_id === 'hero');
  const tagSet = new Set<string>();
  for (const raw of params.rawCandidates) {
    if (readArchetypeId(raw) !== 'hero' || typeof raw !== 'object') continue;
    for (const tag of normalizeMechanismTags((raw as { mechanism_tags?: unknown }).mechanism_tags)) {
      tagSet.add(tag);
    }
  }

  return {
    hero_raw_count: heroRaw,
    hero_post_count: heroPost,
    hero_rejected_mechanism_count: heroRejectedMechanism,
    accepted_confidence_high: acceptedHero.filter((e) => e.confidence === 'high').length,
    accepted_confidence_medium: acceptedHero.filter((e) => e.confidence === 'medium').length,
    accepted_mechanism_tags: [...tagSet],
  };
}
