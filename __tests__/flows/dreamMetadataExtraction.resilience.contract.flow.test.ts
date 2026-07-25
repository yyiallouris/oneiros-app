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
            canonical_label: 'Shadow',
            expression: 'the watching figure outside the locked house',
            resonance: 'An unseen presence holds the edge between approach and entry.',
            evidence: ['someone watches from outside'],
          },
          {
            canonical_label: 'Guide / Psychopomp',
            expression: 'the older voice at the threshold',
            resonance: 'A guiding presence orients the dreamer across a real crossing.',
            evidence: ['the older voice speaks at the door'],
            evaluation: { centrality: 4, activeInMainAction: true, actualCrossing: true },
          },
        ],
        amplifications: [
          {
            title: 'Ariadne and the Labyrinth',
            tradition: 'Greek mythology',
            resonance: 'The thread and branching corridors recall the Cretan labyrinth cycle.',
            divergence: 'Here the waiting figure is fed rather than defeated.',
            evidence: ['thread-like guidance', 'branching corridors', 'waiting figure'],
          },
        ],
      })
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const data = result.data as {
      archetypes: Array<{ confidence: string; evaluation?: unknown }>;
      amplifications: Array<{ confidence: string; title: string; divergence: string }>;
    };
    expect(data.archetypes).toHaveLength(2);
    expect(data.archetypes[0].confidence).toBe('medium');
    expect(data.archetypes[1].confidence).toBe('medium');
    expect(data.archetypes[1].evaluation).toBeUndefined();
    expect(data.amplifications).toHaveLength(1);
    expect(data.amplifications[0].confidence).toBe('medium');
    expect(data.amplifications[0].title).toMatch(/Ariadne/);
  });

  it('maps legacy difference key to divergence on Mythic Echo objects', () => {
    const result = validateStructuredTaskContent(
      'dream_extraction',
      JSON.stringify({
        symbols: ['gate'],
        amplifications: [
          {
            title: 'Inanna’s Descent to the Underworld',
            tradition: 'Mesopotamian',
            resonance: 'Descent through gates without a secured return.',
            difference: 'No completed ascent is staged.',
            evidence: ['gates', 'descent', 'stripped adornment'],
            confidence: 'high',
          },
        ],
      })
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const data = result.data as {
      amplifications: Array<{ divergence: string; title: string }>;
    };
    expect(data.amplifications).toHaveLength(1);
    expect(data.amplifications[0].divergence).toBe('No completed ascent is staged.');
  });

  it('keeps prompt examples mentioning confidence + direct amplifications without evaluation bags', () => {
    const system = buildDreamExtractionSystemPrompt();
    expect(system).toMatch(/"confidence": "high" \| "medium"/);
    expect(system).toMatch(/"amplifications"/);
    expect(system).toMatch(/Do not include an evaluation bag in production output/);
    expect(system).not.toMatch(/"mythic_signature"/);
    expect(DREAM_EXTRACTION_SCHEMA_VERSION).toBeGreaterThanOrEqual(4);
    expect(DREAM_EXTRACTION_PROMPT_VERSION).toBe('3.6.3');
  });
});
