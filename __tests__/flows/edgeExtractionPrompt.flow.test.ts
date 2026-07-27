/**
 * Flow coverage: documentation/flows-06-jungian-ai-reflection.md
 * + docs/SYMBOLS_FLOW.md / architecture-interpretation.md
 * (backend dream metadata extraction prompt parity with the canonical client contract).
 */
import { readFileSync } from 'fs';
import path from 'path';
import {
  buildDreamExtractionSystemPrompt,
  buildDreamExtractionUserPrompt,
  DREAM_EXTRACTION_PROMPT_ID,
  DREAM_EXTRACTION_PROMPT_VERSION,
  DREAM_EXTRACTION_SCHEMA_VERSION,
  DREAM_EXTRACTION_TEMPERATURE,
  DREAM_EXTRACTION_TOKEN_LIMIT,
} from '../../src/ai/dreamExtractionPrompt';

const repoRoot = path.resolve(__dirname, '../..');

describe('edge extraction prompt flow', () => {
  it('keeps client and gateway extraction on the shared canonical module', () => {
    const billingAi = readFileSync(path.join(repoRoot, 'supabase/functions/_shared/billing-ai.ts'), 'utf8');
    const clientAi = readFileSync(path.join(repoRoot, 'src/services/ai.ts'), 'utf8');
    const sharedPrompt = readFileSync(path.join(repoRoot, 'src/ai/dreamExtractionPrompt.ts'), 'utf8');
    const gateway = readFileSync(path.join(repoRoot, 'supabase/functions/ai-entitlements-gateway/index.ts'), 'utf8');

    expect(sharedPrompt).toMatch(/Canonical dream metadata extraction contract/);
    expect(sharedPrompt).toMatch(/buildDreamExtractionSystemPrompt/);
    expect(sharedPrompt).toMatch(/buildDreamExtractionUserPrompt/);

    expect(clientAi).toMatch(/from ['"]\.\.\/ai\/dreamExtractionPrompt['"]/);
    expect(clientAi).toMatch(/buildDreamExtractionSystemPrompt\(\)/);
    expect(clientAi).toMatch(/buildDreamExtractionUserPrompt\(/);
    expect(clientAi).toMatch(/DREAM_EXTRACTION_TEMPERATURE/);
    expect(clientAi).toMatch(/DREAM_EXTRACTION_TOKEN_LIMIT/);
    expect(clientAi).toMatch(/validateClosedCatalogMythicEchoes/);
    expect(clientAi).toMatch(/mythicEchoPipelineDebug/);
    expect(clientAi).toMatch(/mythic_audit_production_invariant_failed/);
    expect(clientAi).not.toMatch(/mythicEchoResolver/);

    expect(billingAi).toMatch(
      /Keep this metadata extraction contract in parity with src\/services\/ai\.ts/
    );
    expect(billingAi).toMatch(/from ['"].*src\/ai\/dreamExtractionPrompt\.ts['"]/);
    expect(billingAi).toMatch(/buildDreamExtractionSystemPrompt\(\)/);
    expect(billingAi).toMatch(/buildDreamExtractionUserPrompt\(/);
    expect(billingAi).toMatch(/temperature: DREAM_EXTRACTION_TEMPERATURE/);
    expect(billingAi).toMatch(/DREAM_EXTRACTION_TOKEN_LIMIT/);
    expect(billingAi).toMatch(/DREAM_EXTRACTION_DEBUG_TOKEN_LIMIT/);
    expect(billingAi).toMatch(/tokenLimit/);
    expect(billingAi).toMatch(/echo-debug-flow/);
    expect(billingAi).toMatch(/debugInterpretiveEchoes/);
    expect(billingAi).toMatch(/parseInterpretiveEchoDiagnostics/);
    expect(billingAi).toMatch(/validateClosedCatalogMythicEchoes/);
    expect(billingAi).toMatch(/mythic_echo_pipeline_debug/);
    expect(billingAi).toMatch(/mythic_audit_production_invariant_failed/);
    expect(billingAi).not.toMatch(/mythicEchoResolver/);
    expect(billingAi).not.toMatch(/Return a single JSON object with keys:\s*\ndisplay_distillation, symbols, symbol_stances/);

    expect(gateway).toMatch(/debug_interpretive_echoes/);
    expect(gateway).toMatch(/mythic_echo_pipeline/);
    expect(gateway).toMatch(/Never persist interpretive_diagnostics/);
    expect(gateway).not.toMatch(/mythic_resolver_version/);
  });

  it('keeps Fabric pedagogy and closed Mythic catalog selection', () => {
    const system = buildDreamExtractionSystemPrompt();
    const user = buildDreamExtractionUserPrompt({
      title: 'Guarded door',
      date: '2026-07-25',
      content: 'A closed door stands between me and a warm room.',
      finalInterpretation: 'The door holds contact and protection in tension.',
    });

    // Fabric / display — unchanged proven contract
    expect(system).toMatch(/map dream elements for two different purposes/i);
    expect(system).toMatch(/Immediate UI display distillation/);
    expect(system).toMatch(/poetic mirror, not a metadata report/);
    expect(system).toMatch(/SOURCE BOUNDARY/);
    expect(system).toMatch(/DREAM FABRIC/);
    expect(system).toMatch(/AFFECTS \/ EMOTIONAL WEATHER/);
    expect(system).toMatch(/MOTIFS \/ DREAM MOTIFS/);
    expect(system).toMatch(/RELATIONSHIP FIELD \/ RELATIONAL DYNAMICS/);
    expect(system).toMatch(/THRESHOLDS/);
    expect(system).toMatch(/locked room vs open street/);
    expect(system).toMatch(/visible_anchors/);

    // Echo v4.1 — archetypes contrastive + closed myth catalog
    expect(system).toMatch(/GLOBAL ARCHETYPE ACTIVATION/);
    expect(system).toMatch(/medium confidence rather than omitting it/);
    expect(system).toMatch(/CLOSED MECHANISM TAGS/);
    expect(system).toMatch(/CLOSED_MYTH_CATALOG/);
    expect(system).toMatch(/sumerian\.inanna_descent/);
    expect(system).toMatch(/ONEIROS ARCHETYPE CATALOG/);
    expect(system).toMatch(/Never return Ego/);
    expect(system).toMatch(/MYTHIC ECHO — CLOSED CATALOG/);
    expect(system).toMatch(/"catalog_id"/);
    expect(system).toMatch(/"archetypes": \[\]/);
    expect(system).toMatch(/"amplifications": \[\]/);
    expect(system).not.toMatch(/Return one myth only when a SPECIFIC/);
    expect(system).not.toMatch(/STEP 1 — ORDERED EVENT MAP/);
    expect(system).not.toMatch(/ROLE–VERB MECHANISM/);
    expect(system).not.toMatch(/DECISIVE SPAN/);
    expect(system).not.toMatch(/PLOT-CONTAMINATION TEST/);
    expect(system).not.toMatch(/mythic_signature/);
    expect(system).not.toMatch(/Hard gates \(do not select if unmet\)/);
    expect(system).not.toMatch(/WINNER CONSISTENCY/);
    expect(system).not.toMatch(/FIRST: FORM A DREAM MAP SILENTLY/);
    expect(system).not.toMatch(/leverage_transfer/);
    expect(system).not.toMatch(/pivot_beat/);
    expect(system).not.toMatch(/Example A — decisive cunning/);

    expect(user).toMatch(/TARGET OUTPUT LANGUAGE:/);
    expect(user).toMatch(/Catalog this dream into pattern metadata and immediate UI display distillation after the final interpretation/);
    expect(user).toMatch(/Final interpretation:/);
    expect(user).toMatch(/Keep archetype and myth selections independent/);
    expect(user).toMatch(/Treat the reflection as absent until archetype_id and myth catalog_id are fixed/);
    expect(user).not.toMatch(/do not withhold/i);
    expect(user).not.toMatch(/maximum 5 anchors, ideal 3/);

    expect(DREAM_EXTRACTION_TEMPERATURE).toBe(0);
    expect(DREAM_EXTRACTION_TOKEN_LIMIT).toBe(4200);
    expect(DREAM_EXTRACTION_PROMPT_VERSION).toBe('4.1.9-M1');
    expect(DREAM_EXTRACTION_PROMPT_ID).toBe('dream-field-map-interpretive-v4.1.9-M1');
    expect(DREAM_EXTRACTION_SCHEMA_VERSION).toBe(13);
    expect(
      buildDreamExtractionUserPrompt({
        title: 'Long',
        date: '2026-07-25',
        content: 'A short dream.',
        finalInterpretation: 'x'.repeat(5000),
      })
    ).toMatch(/truncated for extraction context/);
  });
});
