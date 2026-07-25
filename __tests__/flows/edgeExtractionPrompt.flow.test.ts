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
    expect(clientAi).toMatch(/validateMythicEchoes/);
    expect(clientAi).not.toMatch(/mythicEchoResolver/);

    expect(billingAi).toMatch(
      /Keep this metadata extraction contract in parity with src\/services\/ai\.ts/
    );
    expect(billingAi).toMatch(/from ['"].*src\/ai\/dreamExtractionPrompt\.ts['"]/);
    expect(billingAi).toMatch(/buildDreamExtractionSystemPrompt\(\)/);
    expect(billingAi).toMatch(/buildDreamExtractionUserPrompt\(/);
    expect(billingAi).toMatch(/temperature: DREAM_EXTRACTION_TEMPERATURE/);
    expect(billingAi).toMatch(/tokenLimit: DREAM_EXTRACTION_TOKEN_LIMIT/);
    expect(billingAi).toMatch(/debugInterpretiveEchoes/);
    expect(billingAi).toMatch(/parseInterpretiveEchoDiagnostics/);
    expect(billingAi).toMatch(/validateMythicEchoes/);
    expect(billingAi).not.toMatch(/mythicEchoResolver/);
    expect(billingAi).not.toMatch(/Return a single JSON object with keys:\s*\ndisplay_distillation, symbols, symbol_stances/);

    expect(gateway).toMatch(/debug_interpretive_echoes/);
    expect(gateway).toMatch(/Never persist interpretive_diagnostics/);
    expect(gateway).not.toMatch(/mythic_resolver_version/);
  });

  it('keeps the proven Fabric pedagogy and only the cleaned echo contract', () => {
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

    // Echo cleanup contract
    expect(system).toMatch(/ARCHETYPAL ECHOES/);
    expect(system).toMatch(/Hard gates/);
    expect(system).toMatch(/Do not include an evaluation bag in production output/);
    expect(system).toMatch(/MYTHIC ECHO \(0–1\)/);
    expect(system).toMatch(/A false Mythic Echo is more harmful than no Mythic Echo/);
    expect(system).toMatch(/must not omit an unusually direct, high-confidence structural match/);
    expect(system).toMatch(/at least four concrete correspondences/);
    expect(system).toMatch(/Do not allow a mythic figure name alone/);
    expect(system).toMatch(/recognized localized myth title when available/);
    expect(system).toMatch(/"archetypes": \[\]/);
    expect(system).toMatch(/"amplifications": \[\]/);
    expect(system).not.toMatch(/mythic_signature/);
    expect(system).not.toMatch(/Named descent \/ underworld \/ labyrinth narratives remain valid/);
    expect(system).not.toMatch(/do not withhold them out of excessive caution/i);
    expect(system).not.toMatch(/"canonical_label": "Shadow"/);
    expect(system).not.toMatch(/Ariadne and the Labyrinth/);
    expect(system).not.toMatch(/"evaluation"\?: object/);

    expect(user).toMatch(/Catalog this dream into pattern metadata and immediate UI display distillation after the final interpretation/);
    expect(user).toMatch(/Final interpretation:/);
    expect(user).toMatch(/no evaluation bag/);
    expect(user).toMatch(/not a bare figure/);
    expect(user).toMatch(/a false Mythic Echo is more harmful than no Mythic Echo/i);
    expect(user).toMatch(/highly distinctive multi-stage structural match/i);
    expect(user).not.toMatch(/do not withhold/i);
    expect(user).not.toMatch(/maximum 5 anchors, ideal 3/);

    expect(DREAM_EXTRACTION_TEMPERATURE).toBe(0.25);
    expect(DREAM_EXTRACTION_TOKEN_LIMIT).toBe(4200);
    expect(DREAM_EXTRACTION_PROMPT_VERSION).toBe('3.6.3');
    expect(DREAM_EXTRACTION_PROMPT_ID).toBe('dream-field-map-interpretive-v3.6');
    expect(DREAM_EXTRACTION_SCHEMA_VERSION).toBe(4);
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
