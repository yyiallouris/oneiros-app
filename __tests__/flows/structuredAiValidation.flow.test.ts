/**
 * Flow coverage: structured AI Zod validation + one repair attempt in openai-proxy
 * for dream_extraction, conversation_element_update, and semantic_grouping.
 */
import { readFileSync } from 'fs';
import path from 'path';

const repoRoot = path.resolve(__dirname, '../..');

describe('structured AI validation flow', () => {
  it('keeps Zod schemas and proxy repair wiring for structured tasks', () => {
    const validation = readFileSync(path.join(repoRoot, 'src/ai/structuredTaskValidation.ts'), 'utf8');
    const proxy = readFileSync(path.join(repoRoot, 'supabase/functions/openai-proxy/index.ts'), 'utf8');
    const proxyReadme = readFileSync(path.join(repoRoot, 'supabase/functions/openai-proxy/README.md'), 'utf8');
    const billingAi = readFileSync(path.join(repoRoot, 'supabase/functions/_shared/billing-ai.ts'), 'utf8');
    const clientAi = readFileSync(path.join(repoRoot, 'src/services/ai.ts'), 'utf8');

    expect(validation).toMatch(/from 'zod'/);
    expect(validation).toMatch(/dreamExtractionSchema/);
    expect(validation).toMatch(/conversationElementUpdateSchema/);
    expect(validation).toMatch(/semanticGroupingSchema/);
    expect(validation).toMatch(/status: z\.literal\('no_change'\)/);
    expect(validation).toMatch(/buildStructuredRepairMessages/);
    expect(validation).toMatch(/safeStructuredValidationLog/);
    expect(validation).toMatch(/DREAM_EXTRACTION_SOFT_DEFAULTS/);
    expect(validation).toMatch(/withSoftEchoConfidence/);
    expect(validation).toMatch(/missingEchoConfidence: 'medium'/);

    expect(proxy).toMatch(/maybeValidateAndRepairStructured/);
    expect(proxy).toMatch(/Structured AI response failed schema validation/);
    expect(proxy).toMatch(/provider: "anthropic"/);
    expect(proxyReadme).toMatch(/Zod/);
    expect(proxyReadme).toMatch(/one repair on the same provider/);
    expect(proxyReadme).toMatch(/DREAM_EXTRACTION_SOFT_DEFAULTS/);

    expect(billingAi).toMatch(/validateStructuredTaskContent\('dream_extraction'/);
    expect(billingAi).toMatch(/parsed\.extraction\.archetypes\.length > 0/);
    expect(billingAi).toMatch(/archetypesWithEvaluation\(rawForLanguage\?\.archetypes\)/);
    expect(clientAi).toMatch(/validateStructuredTaskContent\('conversation_element_update'/);
    expect(clientAi).toMatch(/validateStructuredTaskContent\('semantic_grouping'/);
    expect(clientAi).toMatch(/"status":"no_change"/);
  });
});
