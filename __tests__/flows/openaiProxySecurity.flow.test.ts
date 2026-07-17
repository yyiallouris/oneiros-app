/**
 * Flow coverage: documentation/architecture-interpretation.md and
 * supabase/functions/openai-proxy/README.md (AI proxy auth boundary).
 */
import fs from 'fs';
import path from 'path';

const proxySource = fs.readFileSync(
  path.join(__dirname, '../../supabase/functions/openai-proxy/index.ts'),
  'utf8'
);

describe('openai-proxy security boundary', () => {
  it('requires a Supabase user before reading or forwarding AI payloads', () => {
    expect(proxySource).toContain('import { requireUser }');

    const requireUserIndex = proxySource.indexOf('await requireUser(req)');
    const parseBodyIndex = proxySource.indexOf('await req.json()');
    const callOpenAIIndex = proxySource.indexOf('await callOpenAI(');
    const callAnthropicIndex = proxySource.indexOf('await callAnthropic(');

    expect(requireUserIndex).toBeGreaterThan(-1);
    expect(parseBodyIndex).toBeGreaterThan(requireUserIndex);
    expect(callOpenAIIndex).toBeGreaterThan(requireUserIndex);
    expect(callAnthropicIndex).toBeGreaterThan(requireUserIndex);
  });

  it('keeps OPTIONS preflight unauthenticated but rejects non-POST calls', () => {
    const optionsIndex = proxySource.indexOf('req.method === "OPTIONS"');
    const requireUserIndex = proxySource.indexOf('await requireUser(req)');
    const methodGuardIndex = proxySource.indexOf('req.method !== "POST"');

    expect(optionsIndex).toBeGreaterThan(-1);
    expect(optionsIndex).toBeLessThan(requireUserIndex);
    expect(methodGuardIndex).toBeGreaterThan(optionsIndex);
    expect(methodGuardIndex).toBeLessThan(requireUserIndex);
  });
});
