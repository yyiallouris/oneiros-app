/**
 * Flow coverage: documentation/flows-06-jungian-ai-reflection.md
 * → “Locked contract: metadata extraction resilience”
 *
 * Goal: stop recurring dream_metadata_extract structured_schema_invalid
 * failures after prompt/schema edits (e.g. confidence: Required).
 */
import { readFileSync } from 'fs';
import path from 'path';
import {
  DREAM_EXTRACTION_SOFT_DEFAULTS,
  validateStructuredTaskContent,
} from '../../src/ai/structuredTaskValidation';
import {
  DREAM_EXTRACTION_PROMPT_VERSION,
  DREAM_EXTRACTION_SCHEMA_VERSION,
  buildDreamExtractionSystemPrompt,
} from '../../src/ai/dreamExtractionPrompt';

const repoRoot = path.resolve(__dirname, '../..');

function read(rel: string): string {
  return readFileSync(path.join(repoRoot, rel), 'utf8');
}

describe('dream metadata extraction resilience contract', () => {
  const validationSrc = read('src/ai/structuredTaskValidation.ts');
  const flowDoc = read('documentation/flows-06-jungian-ai-reflection.md');
  const agents = read('AGENTS.md');
  const skill = read('.codex/skills/oneiros-repo/SKILL.md');
  const proxyReadme = read('supabase/functions/openai-proxy/README.md');
  const gatewayReadme = read('supabase/functions/ai-entitlements-gateway/README.md');
  const symbolsFlow = read('docs/SYMBOLS_FLOW.md');

  it('documents the resilience lock and dual-deploy requirement', () => {
    expect(flowDoc).toMatch(/Locked contract: metadata extraction resilience/);
    expect(flowDoc).toMatch(/structured_schema_invalid/);
    expect(flowDoc).toMatch(/missingEchoConfidence/);
    expect(flowDoc).toMatch(/openai-proxy` and `ai-entitlements-gateway/);

    expect(flowDoc).toMatch(/Locked contract: output-language commit gate/);
    expect(flowDoc).toMatch(/language_validation_failed/);
    expect(flowDoc).toMatch(/committed output language match: 100%/);
    expect(agents).toMatch(/Metadata Extraction Must Stay Bulletproof/);
    expect(agents).toMatch(/missing echo `confidence` → `medium`/);
    expect(agents).toMatch(/Deploy \*\*both\*\* `openai-proxy` and `ai-entitlements-gateway`/);

    expect(skill).toMatch(/Metadata extract resilience/);
    expect(skill).toMatch(/missing echo `confidence` → `medium`/);
    expect(proxyReadme).toMatch(/DREAM_EXTRACTION_SOFT_DEFAULTS/);
    expect(gatewayReadme).toMatch(/missing echo `confidence` → `medium`/);
    expect(symbolsFlow).toMatch(/Resilience lock/);
  });

  it('keeps coerce + Zod preprocess soft defaults for missing echo confidence', () => {
    expect(DREAM_EXTRACTION_SOFT_DEFAULTS.missingEchoConfidence).toBe('medium');
    expect(validationSrc).toMatch(/export const DREAM_EXTRACTION_SOFT_DEFAULTS/);
    expect(validationSrc).toMatch(/withSoftEchoConfidence/);
    expect(validationSrc).toMatch(/withDefaultMediumConfidence/);
    expect(validationSrc).toMatch(/coerceExtractionAmplifications/);
    expect(validationSrc).toMatch(/coerceExtractionArchetypes/);
  });

  it('accepts rich echoes when the model omits confidence and strips evaluation bags', () => {
    const result = validateStructuredTaskContent(
      'dream_extraction',
      JSON.stringify({
        symbols: ['door'],
        archetypes: [
          {
            archetype_id: 'shadow',
            expression: 'the watching figure outside the locked house',
            mechanism_tags: ['private_self_conflict'],
            evidence_ids: ['D1'],
            resonance: 'An unseen presence holds the edge between approach and entry.',
          },
          {
            archetype_id: 'guide_psychopomp',
            expression: 'the older voice at the threshold',
            mechanism_tags: [
              'active_threshold_guidance',
              'crossing_between_domains',
              'guidance_changes_action_or_outcome',
            ],
            evidence_ids: ['D2', 'D3'],
            resonance: 'A guiding presence orients the dreamer across a real crossing.',
            evaluation: { centrality: 4, activeInMainAction: true, actualCrossing: true },
          },
        ],
        amplifications: [
          {
            catalog_id: 'greek.cretan_labyrinth',
            resonance: 'The thread and branching corridors recall the Cretan labyrinth cycle.',
            divergence: 'Here the waiting figure is fed rather than defeated.',
            evidence: ['thread-like guidance', 'branching corridors', 'waiting figure'],
            evaluation: {
              matched_dimensions: [
                'distinctive_cluster',
                'narrative_sequence',
                'relational_roles',
              ],
              divergence_type: 'outcome_changed',
              disqualifiers_triggered: [],
            },
          },
        ],
      })
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const data = result.data as {
      archetypes: Array<{ confidence: string; evaluation?: unknown }>;
      amplifications: Array<{ confidence: string; catalog_id: string; divergence: string }>;
    };
    expect(data.archetypes).toHaveLength(2);
    expect(data.archetypes[0].confidence).toBe('medium');
    expect(data.archetypes[1].confidence).toBe('medium');
    expect(data.archetypes[1].evaluation).toBeUndefined();
    expect(data.amplifications).toHaveLength(1);
    expect(data.amplifications[0].confidence).toBe('medium');
    expect(data.amplifications[0].catalog_id).toBe('greek.cretan_labyrinth');
  });

  it('maps legacy difference key to divergence on Mythic Echo objects', () => {
    const result = validateStructuredTaskContent(
      'dream_extraction',
      JSON.stringify({
        symbols: ['gate'],
        amplifications: [
          {
            catalog_id: 'sumerian.inanna_descent',
            resonance: 'Descent through gates without a secured return.',
            difference: 'No completed ascent is staged.',
            evidence: ['gates', 'descent', 'stripped adornment'],
            confidence: 'high',
            evaluation: {
              matched_dimensions: [
                'distinctive_cluster',
                'narrative_sequence',
                'relational_roles',
              ],
              divergence_type: 'pattern_unfinished',
              disqualifiers_triggered: [],
            },
          },
        ],
      })
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const data = result.data as {
      amplifications: Array<{ divergence: string; catalog_id: string }>;
    };
    expect(data.amplifications).toHaveLength(1);
    expect(data.amplifications[0].catalog_id).toBe('sumerian.inanna_descent');
    expect(data.amplifications[0].divergence).toBe('No completed ascent is staged.');
  });

  it('keeps v4.1.9-M1 closed-catalog namespace enums + integrity-only myth contract', () => {
    const system = buildDreamExtractionSystemPrompt();
    expect(system).toMatch(/"confidence": "high" \| "medium"/);
    expect(system).toMatch(/"amplifications"/);
    expect(system).toMatch(/CLOSED_MYTH_CATALOG/);
    expect(system).toMatch(/CLOSED MECHANISM TAGS/);
    expect(system).toMatch(/"catalog_id"/);
    expect(system).not.toMatch(/"matched_feature_ids"/);
    expect(system).not.toMatch(/"mythic_signature"/);
    expect(DREAM_EXTRACTION_SCHEMA_VERSION).toBe(13);
    expect(system).toMatch(/id=shadow label:Shadow/);
    expect(system).not.toMatch(/\[shadow\]/);
    expect(DREAM_EXTRACTION_PROMPT_VERSION).toBe('4.1.9-M1');
    expect(system).toMatch(/evidence_ids/);
    expect(system).toMatch(/archetype_id/);
    expect(system).toMatch(/enacted archetypal function or movement/);
    expect(system).not.toMatch(/trickster\.action/);
    expect(system).not.toMatch(/carrier_evidence_ids/);
  });

  it('clamps archetype evidence_ids above six without rejecting extraction', () => {
    const result = validateStructuredTaskContent(
      'dream_extraction',
      JSON.stringify({
        symbols: ['jar'],
        archetypes: [
          {
            archetype_id: 'trickster',
            expression: 'feigned disbelief',
            mechanism_tags: ['deception_or_feigned_belief', 'power_asymmetry_reversed'],
            evidence_ids: ['D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7'],
            resonance: 'Cunning reverses leverage through feigned disbelief and resealing.',
            confidence: 'high',
          },
        ],
        amplifications: [],
      })
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const data = result.data as {
      archetypes: Array<{
        evidence_ids: string[];
      }>;
    };
    expect(data.archetypes[0].evidence_ids).toHaveLength(6);
  });

  it('rejects archetype objects missing required archetype_id', () => {
    const result = validateStructuredTaskContent(
      'dream_extraction',
      JSON.stringify({
        symbols: ['jar'],
        archetypes: [
          {
            expression: 'feigned disbelief',
            resonance: 'Cunning reverses leverage through feigned disbelief and resealing.',
            mechanism_tags: ['deception_or_feigned_belief', 'power_asymmetry_reversed'],
            evidence_ids: ['D1'],
          },
        ],
        amplifications: [],
      })
    );
    expect(result.ok).toBe(false);
  });

  it('clamps mythic evidence_ids above six without rejecting extraction', () => {
    const result = validateStructuredTaskContent(
      'dream_extraction',
      JSON.stringify({
        symbols: ['jar'],
        archetypes: [],
        amplifications: [
          {
            catalog_id: 'arabian.fisherman_and_jinni',
            resonance: 'A sealed vessel releases a threatening captive who is resealed by cunning.',
            divergence: 'The dream adds a dry lake setting around the reseal bargain.',
            evidence_ids: ['D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7'],
            confidence: 'high',
            evaluation: {
              matched_dimensions: [
                'distinctive_cluster',
                'narrative_sequence',
                'relational_roles',
              ],
              divergence_type: 'outcome_changed',
              disqualifiers_triggered: [],
            },
          },
        ],
      })
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const data = result.data as { amplifications: Array<{ evidence_ids: string[] }> };
    expect(data.amplifications[0].evidence_ids).toHaveLength(6);
  });
});
