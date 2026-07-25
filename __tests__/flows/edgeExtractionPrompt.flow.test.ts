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
  DREAM_EXTRACTION_PROMPT_VERSION,
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
    expect(system).toMatch(/SOURCE BOUNDARY/);
    expect(system).toMatch(/DREAM FABRIC/);
    expect(system).toMatch(/INTERPRETIVE ECHOES/);
    expect(system).toMatch(/Do not derive Dream Fabric fields from the generated reflection/);
    expect(system).toMatch(/same primary language as the dream narrative/);
    expect(system).not.toMatch(/Return every field value in English only/);
    expect(user).toMatch(/same primary language as the dream/);
    expect(system).toMatch(/symbol_stances: 1–5 items, only for genuinely charged symbols/);
    expect(system).toMatch(/AFFECTS \/ EMOTIONAL WEATHER/);
    expect(system).toMatch(/MOTIFS \/ DREAM MOTIFS/);
    expect(system).toMatch(/protecting a vulnerable child/);
    expect(system).toMatch(/RELATIONSHIP FIELD \/ RELATIONAL DYNAMICS/);
    expect(system).toMatch(/never sensory objects/);
    expect(system).toMatch(/Map the relational field; do not retell the plot/);
    expect(system).toMatch(/THRESHOLDS/);
    expect(system).toMatch(/self-opening basement door/);
    expect(system).toMatch(/ARCHETYPAL ECHOES/);
    expect(system).toMatch(/Return 0–2 classical archetypal patterns/);
    expect(system).toMatch(/Invalid: \["Divine Child", "Guide \/ Psychopomp"\]/);
    expect(system).toMatch(/canonical_label/);
    expect(system).toMatch(/expression/);
    expect(system).toMatch(/Do not invent poetic archetype names/);
    expect(system).toMatch(/prefer one coherent canonical pattern/i);
    expect(system).toMatch(/structural convergence across several elements/);
    expect(system).toMatch(/converging/);
    expect(system).toMatch(/Guide \/ Psychopomp/);
    expect(system).toMatch(/Shadow merely from darkness/);
    expect(system).toMatch(/AMPLIFICATIONS \/ MYTHIC ECHOES/);
    expect(system).toMatch(/Return 0–1 named parallel from world mythology/);
    expect(system).toMatch(/tradition/);
    expect(system).toMatch(/difference/);
    expect(system).toMatch(/mythology-roulette/);
    expect(system).toMatch(/claim a completed return, integration, rebirth, or transformation/);
    expect(system).toMatch(/"title": "Ariadne and the Labyrinth"/);
    expect(user).toMatch(/Do not withhold a clearly supported echo/);
    expect(system).toMatch(/locked room vs open street/);
    expect(system).toMatch(/Avoid generic pairs like "fear vs desire"/);
    expect(system).toMatch(/Self, Ego, Shadow, Persona, Anima, Animus/);
    expect(system).toMatch(/visible_anchors/);
    expect(system).toMatch(/core_mode may be null/);

    expect(user).toMatch(/Catalog this dream into pattern metadata and immediate UI display distillation after the final interpretation/);
    expect(user).toMatch(/Final interpretation:/);
    expect(user).toMatch(/maximum 5 anchors, ideal 3/);
    expect(user).toMatch(/Ground Dream Fabric fields/);
    expect(user).toMatch(/Map Fabric fields compactly/);
    expect(user).toMatch(/door holds contact and protection/);

    expect(DREAM_EXTRACTION_TEMPERATURE).toBe(0.25);
    expect(DREAM_EXTRACTION_TOKEN_LIMIT).toBe(4200);
    expect(DREAM_EXTRACTION_PROMPT_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
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
