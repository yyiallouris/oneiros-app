import { readFileSync } from 'fs';
import path from 'path';

const repoRoot = path.join(__dirname, '..', '..');

function read(relPath: string): string {
  return readFileSync(path.join(repoRoot, relPath), 'utf8');
}

describe('two-pass archetype production integration contract', () => {
  it('routes persisted archetypes through dedicated recognition and adjudication', () => {
    const billingAi = read('supabase/functions/_shared/billing-ai.ts');

    expect(billingAi).toContain("task: 'dream_archetype_recognition'");
    expect(billingAi).toContain("task: 'dream_archetype_adjudication'");
    expect(billingAi).toContain('const dedicatedArchetypePipeline = await generateDedicatedArchetypesWithCost');
    expect(billingAi).toContain('parsed.extraction.archetypes = dedicatedArchetypePipeline.archetypes;');
  });

  it('forbids monolithic fallback and retries the dedicated pipeline once before failing metadata', () => {
    const billingAi = read('supabase/functions/_shared/billing-ai.ts');
    const gateway = read('supabase/functions/ai-entitlements-gateway/index.ts');
    const gatewayReadme = read('supabase/functions/ai-entitlements-gateway/README.md');

    expect(billingAi).toContain('const DEDICATED_ARCHETYPE_PIPELINE_MAX_ATTEMPTS = 2;');
    expect(billingAi).toContain("failureCode: 'dedicated_archetype_pipeline_failed'");
    expect(gateway).toContain("metadata_status: 'failed'");
    expect(gatewayReadme).toMatch(/never fall back to legacy monolithic archetypes/);
  });

  it('keeps archetypes frozen after the raw-dream extraction pass and out of follow-up chat updates', () => {
    const clientAi = read('src/services/ai.ts');
    const interpretationDoc = read('documentation/architecture-interpretation.md');

    expect(clientAi).toContain('const archetypes = normalizeArchetypalEchoes(current.archetypes, MAX_ARCHETYPAL_ECHOES);');
    expect(clientAi).toMatch(/Do NOT return or revise archetypes in follow-up chat for v1/);
    expect(interpretationDoc).toMatch(/are not revised by follow-up chat/);
  });
});
