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
  DREAM_EXTRACTION_TEMPERATURE,
  DREAM_EXTRACTION_TOKEN_LIMIT,
} from '../../src/ai/dreamExtractionPrompt';

const repoRoot = path.resolve(__dirname, '../..');

describe('edge extraction prompt flow', () => {
  it('keeps client and gateway extraction on the shared canonical module', () => {
    const billingAi = readFileSync(path.join(repoRoot, 'supabase/functions/_shared/billing-ai.ts'), 'utf8');
    const clientAi = readFileSync(path.join(repoRoot, 'src/services/ai.ts'), 'utf8');
    const sharedPrompt = readFileSync(path.join(repoRoot, 'src/ai/dreamExtractionPrompt.ts'), 'utf8');

    expect(sharedPrompt).toMatch(/Canonical dream metadata extraction contract/);
    expect(sharedPrompt).toMatch(/buildDreamExtractionSystemPrompt/);
    expect(sharedPrompt).toMatch(/buildDreamExtractionUserPrompt/);

    expect(clientAi).toMatch(/from ['"]\.\.\/ai\/dreamExtractionPrompt['"]/);
    expect(clientAi).toMatch(/buildDreamExtractionSystemPrompt\(\)/);
    expect(clientAi).toMatch(/buildDreamExtractionUserPrompt\(/);
    expect(clientAi).toMatch(/DREAM_EXTRACTION_TEMPERATURE/);
    expect(clientAi).toMatch(/DREAM_EXTRACTION_TOKEN_LIMIT/);

    expect(billingAi).toMatch(
      /Keep this metadata extraction contract in parity with src\/services\/ai\.ts/
    );
    expect(billingAi).toMatch(/from ['"].*src\/ai\/dreamExtractionPrompt\.ts['"]/);
    expect(billingAi).toMatch(/buildDreamExtractionSystemPrompt\(\)/);
    expect(billingAi).toMatch(/buildDreamExtractionUserPrompt\(/);
    expect(billingAi).toMatch(/temperature: DREAM_EXTRACTION_TEMPERATURE/);
    expect(billingAi).toMatch(/tokenLimit: DREAM_EXTRACTION_TOKEN_LIMIT/);
    expect(billingAi).not.toMatch(/Return a single JSON object with keys:\s*\ndisplay_distillation, symbols, symbol_stances/);
  });

  it('preserves the rich field pedagogy and sampling settings in the shared contract', () => {
    const system = buildDreamExtractionSystemPrompt();
    const user = buildDreamExtractionUserPrompt({
      title: 'Guarded door',
      date: '2026-07-25',
      content: 'A closed door stands between me and a warm room.',
      finalInterpretation: 'The door holds contact and protection in tension.',
    });

    expect(system).toMatch(/map dream elements for two different purposes/i);
    expect(system).toMatch(/Immediate UI display distillation/);
    expect(system).toMatch(/poetic mirror, not a metadata report/);
    expect(system).toMatch(/symbol_stances: 1–5 items, only for genuinely charged symbols/);
    expect(system).toMatch(/Do not infer archetypes unless strongly staged/);
    expect(system).toMatch(/locked room vs open street/);
    expect(system).toMatch(/Avoid generic pairs like "fear vs desire"/);
    expect(system).toMatch(/Self, Ego, Shadow, Persona, Anima, Animus/);
    expect(system).toMatch(/visible_anchors/);
    expect(system).toMatch(/core_mode may be null/);

    expect(user).toMatch(/Catalog this dream into pattern metadata and immediate UI display distillation after the final interpretation/);
    expect(user).toMatch(/Final interpretation:/);
    expect(user).toMatch(/maximum 5 anchors, ideal 3/);
    expect(user).toMatch(/door holds contact and protection/);

    expect(DREAM_EXTRACTION_TEMPERATURE).toBe(0.25);
    expect(DREAM_EXTRACTION_TOKEN_LIMIT).toBe(2600);
  });
});
