/**
 * Flow coverage: documentation/flows-06-jungian-ai-reflection.md
 * (Edge reflection prompt language, reflective-question contract, and depth routing).
 */
import { readFileSync } from 'fs';
import path from 'path';

const repoRoot = path.resolve(__dirname, '../..');

describe('edge reflection prompt flow', () => {
  it('keeps gateway reflections aligned with the canonical initial interpretation prompt', () => {
    const billingAi = readFileSync(path.join(repoRoot, 'supabase/functions/_shared/billing-ai.ts'), 'utf8');
    const clientAi = readFileSync(path.join(repoRoot, 'src/services/ai.ts'), 'utf8');

    expect(clientAi).toMatch(/Core Constitution — non-negotiable principles/);
    expect(clientAi).toMatch(/ADVANCED mode \(Deeper Dive\)/);
    expect(clientAi).toMatch(/Length: aim for 550–800 words/);

    expect(billingAi).toMatch(/Keep this initial reflection contract in parity with src\/services\/ai\.ts/);
    expect(billingAi).toMatch(/Core Constitution — non-negotiable principles/);
    expect(billingAi).toMatch(/INTERPRETATION_ROLE_PROMPT/);
    expect(billingAi).toMatch(/DREAM_FIRST_READING_DIRECTIVE/);
    expect(billingAi).toMatch(/BRIEF mode \(Quick Glance\)/);
    expect(billingAi).toMatch(/STANDARD mode \(Core Reading\)/);
    expect(billingAi).toMatch(/ADVANCED mode \(Deeper Dive\)/);
    expect(billingAi).toMatch(/same primary language as the dream narrative and any user notes/);
    expect(billingAi).toMatch(/Exactly 2 questions/);
    expect(billingAi).toMatch(/First question: somatic-observational when possible/);
    expect(billingAi).toMatch(/Second question: symbolic, relational, or imaginal/);
    expect(billingAi).toMatch(/Length: aim for 550–800 words/);
    expect(billingAi).toMatch(/After the complete response, append this exact hidden marker/);
    expect(billingAi).toMatch(/messages:\s*\[\s*\{\s*role: 'system' as const, content: DREAM_CONSTITUTION_PROMPT\s*\},\s*\{\s*role: 'system' as const, content: INTERPRETATION_ROLE_PROMPT\s*\},\s*\{\s*role: 'system' as const, content: formatPrompt\s*\},\s*\{\s*role: 'user' as const, content: userPrompt\s*\},\s*\]/);
    expect(billingAi).toMatch(/temperature: depth === 'quick' \? 0\.68 : depth === 'advanced' \? 0\.60 : 0\.55/);
    expect(billingAi).toMatch(/tokenLimit: depth === 'quick' \? 550 : depth === 'advanced' \? 2200 : 1600/);
    expect(billingAi).toMatch(/timeoutMs: DEFAULT_AI_PROXY_TIMEOUT_MS/);
    expect(billingAi).toMatch(/stripEndMarker\(extractContent\(reflectionPayload\), END_MARKER_DREAM_READING\)/);
  });

  it('routes interpretation depths to the accountant cost-tier models', () => {
    const taskConfig = readFileSync(path.join(repoRoot, 'supabase/functions/openai-proxy/task-config.ts'), 'utf8');
    const proxyIndex = readFileSync(path.join(repoRoot, 'supabase/functions/openai-proxy/index.ts'), 'utf8');

    expect(taskConfig).toMatch(/const OPENAI_NANO = "gpt-5\.4-nano"/);
    expect(taskConfig).toMatch(/const OPENAI_MINI = "gpt-5\.4-mini"/);
    expect(taskConfig).toMatch(/const OPENAI_FULL = "gpt-5\.4"/);
    expect(taskConfig).toMatch(/const ANTHROPIC_HAIKU = "claude-haiku-4-5"/);
    expect(taskConfig).toMatch(/const ANTHROPIC_SONNET = "claude-sonnet-5"/);
    expect(taskConfig).toMatch(/interpretation_quick:\s*{\s*provider: "openai",\s*model: OPENAI_FULL,\s*fallbackAnthropicModel: ANTHROPIC_SONNET,\s*}/);
    expect(taskConfig).toMatch(/interpretation_standard:\s*{\s*provider: "openai",\s*model: OPENAI_FULL,\s*fallbackAnthropicModel: ANTHROPIC_SONNET,\s*}/);
    expect(taskConfig).toMatch(/interpretation_advanced:\s*{\s*provider: "openai",\s*model: OPENAI_FULL,\s*fallbackAnthropicModel: ANTHROPIC_SONNET,\s*}/);
    expect(taskConfig).toMatch(/interpretation_retry_compact:\s*{\s*provider: "openai",\s*model: OPENAI_FULL,\s*fallbackAnthropicModel: ANTHROPIC_SONNET,\s*}/);
    expect(taskConfig).toMatch(/pattern_insights:\s*{\s*provider: "openai",\s*model: OPENAI_FULL,\s*fallbackAnthropicModel: ANTHROPIC_SONNET,\s*}/);
    expect(taskConfig).toMatch(/dream_extraction:\s*{\s*provider: "openai",\s*model: OPENAI_NANO,\s*fallbackAnthropicModel: ANTHROPIC_HAIKU,\s*}/);
    expect(taskConfig).toMatch(/conversation_element_update:\s*{\s*provider: "openai",\s*model: OPENAI_NANO,\s*fallbackAnthropicModel: ANTHROPIC_HAIKU,\s*}/);
    expect(taskConfig).toMatch(/semantic_grouping:\s*{\s*provider: "openai",\s*model: OPENAI_NANO,\s*fallbackAnthropicModel: ANTHROPIC_HAIKU,\s*}/);
    expect(taskConfig).toMatch(/chat_followup:\s*{\s*provider: "openai",\s*model: OPENAI_MINI,\s*fallbackAnthropicModel: ANTHROPIC_HAIKU,\s*}/);
    expect(taskConfig).not.toMatch(/UNROUTED_TASK_AI/);
    expect(taskConfig).toMatch(/missingOrUnknownTaskMessage/);
    expect(proxyIndex).toMatch(/missingOrUnknownTaskMessage\(body\.task\)/);
    expect(proxyIndex).toMatch(/proxyJsonError\(missingOrUnknownTaskMessage\(body\.task\), 400\)/);
  });
});
