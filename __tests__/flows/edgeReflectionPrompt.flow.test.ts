/**
 * Flow coverage: documentation/flows-06-jungian-ai-reflection.md
 * Shared Edge/client combined reflection/question prompt and routing.
 */
import { readFileSync } from 'fs';
import path from 'path';
import {
  buildChatFollowupRequest,
  buildInitialReflectionRequest,
  DREAM_REFLECTION_PROMPT_ID,
  DREAM_REFLECTION_PROMPT_VERSION,
  REFLECTIVE_DIALOGUE_PROMPT_ID,
  REFLECTIVE_DIALOGUE_PROMPT_VERSION,
} from '../../src/ai/dreamReflectionPrompt';

const repoRoot = path.resolve(__dirname, '../..');

describe('edge reflection prompt flow', () => {
  it('keeps gateway and client reflections aligned through one canonical module', () => {
    const billingAi = readFileSync(path.join(repoRoot, 'supabase/functions/_shared/billing-ai.ts'), 'utf8');
    const clientAi = readFileSync(path.join(repoRoot, 'src/services/ai.ts'), 'utf8');
    const promptSource = readFileSync(path.join(repoRoot, 'src/ai/dreamReflectionPrompt.ts'), 'utf8');
    const editorialArcSource = readFileSync(path.join(repoRoot, 'src/ai/reflectionEditorialArc.ts'), 'utf8');

    expect(DREAM_REFLECTION_PROMPT_ID).toBe('oneiros-dream-reflection-v3.1.0-candidate');
    expect(DREAM_REFLECTION_PROMPT_VERSION).toBe('3.1.0-candidate');
    expect(REFLECTIVE_DIALOGUE_PROMPT_ID).toBe('oneiros-reflective-dialogue-v1.9.1');
    expect(REFLECTIVE_DIALOGUE_PROMPT_VERSION).toBe('1.9.1');
    expect(clientAi).toMatch(/buildInitialReflectionRequest/);
    expect(clientAi).toMatch(/buildChatFollowupRequest/);
    expect(billingAi).toMatch(/buildInitialReflectionRequest/);
    expect(billingAi).toMatch(/buildChatFollowupRequest/);
    expect(promptSource).toMatch(/Core constitution:/);
    expect(promptSource).toMatch(/ADVANCED mode \(Deeper Dive\)/);
    expect(promptSource).toMatch(/same primary language as the dream narrative and any user notes/);
    expect(editorialArcSource).toMatch(/Before writing the reading, decide whether this dream holds one honest opening/);
    expect(editorialArcSource).toMatch(/ONEIROS_REFLECTION_OPENING_V2/);
    expect(editorialArcSource).toMatch(/BEGIN_DREAM_READING/);
    expect(editorialArcSource).toMatch(/question_evidence_ids/);
    expect(promptSource).toMatch(/user turn is the center/);
    expect(promptSource).toMatch(/buildReflectiveDialogueModelHistory/);
    expect(promptSource).not.toMatch(/content: REFLECTIVE_QUESTION_METHOD_PROMPT/);

    const advanced = buildInitialReflectionRequest(
      { title: 'Sea', date: '2026-08-27', content: 'I enter the sea and wake on the shore.' },
      'advanced'
    );
    expect(advanced.messages).toHaveLength(4);
    expect(advanced.messages[2].content).toContain('Linger longer, not explain more');
    expect(advanced.messages[2].content).not.toContain('Return zero or one question');
    expect(advanced.temperature).toBe(0.6);
    expect(advanced.tokenLimit).toBe(2600);
    const chat = buildChatFollowupRequest({
      dream: { title: 'Sea', date: '2026-08-27', content: 'I enter the sea.' },
      conversation: [],
      userMessage: 'The water felt warm.',
      isFinalResponse: false,
    });
    const chatSystem = chat.messages
      .filter((message) => message.role === 'system')
      .map((message) => message.content)
      .join('\n');
    expect(chatSystem).toContain('Reflective Dialogue — Oneiros method 1.9.1');
    expect(chatSystem).not.toContain('Core Constitution — non-negotiable principles');
    expect(chatSystem).not.toContain('Core Mode Logic');
    expect(billingAi).toMatch(/finalizeSameCallReading/);
    expect(billingAi).toMatch(/visibleSameCallReading/);
    expect(billingAi).toMatch(/generateProductionReflectiveQuestion/);
    expect(billingAi).toMatch(/src\/ai\/reflectiveQuestionPipeline\.ts/);
    expect(billingAi).toMatch(/visibleEditorialArcReading/);
  });

  it('passes response_format into structured validation without ReferenceError', () => {
    const proxyIndex = readFileSync(path.join(repoRoot, 'supabase/functions/openai-proxy/index.ts'), 'utf8');
    expect(proxyIndex).toMatch(/responseFormat: response_format/);
    expect(proxyIndex.match(/responseFormat: response_format/g)?.length ?? 0).toBeGreaterThanOrEqual(3);
    expect(proxyIndex).not.toMatch(/^\s*responseFormat,$/m);
  });

  it('routes combined reflections, extraction, chat, and compatibility question tasks explicitly', () => {
    const taskConfig = readFileSync(path.join(repoRoot, 'supabase/functions/openai-proxy/task-config.ts'), 'utf8');
    const proxyIndex = readFileSync(path.join(repoRoot, 'supabase/functions/openai-proxy/index.ts'), 'utf8');

    expect(taskConfig).toMatch(/const OPENAI_NANO = "gpt-5\.4-nano"/);
    expect(taskConfig).toMatch(/const OPENAI_MINI = "gpt-5\.4-mini"/);
    expect(taskConfig).toMatch(/const OPENAI_FULL = "gpt-5\.4"/);
    expect(taskConfig).toMatch(/const ANTHROPIC_HAIKU = "claude-haiku-4-5"/);
    expect(taskConfig).toMatch(/const ANTHROPIC_SONNET = "claude-sonnet-5"/);
    expect(taskConfig).toMatch(/interpretation_quick:\s*{\s*provider: "openai",\s*model: OPENAI_FULL/);
    expect(taskConfig).toMatch(/interpretation_standard:\s*{\s*provider: "openai",\s*model: OPENAI_FULL/);
    expect(taskConfig).toMatch(/interpretation_advanced:\s*{\s*provider: "openai",\s*model: OPENAI_FULL/);
    expect(taskConfig).toMatch(/dream_extraction:\s*{\s*provider: "openai",\s*model: OPENAI_MINI/);
    expect(taskConfig).toMatch(/chat_followup:\s*{\s*provider: "openai",\s*model: OPENAI_MINI/);
    expect(taskConfig).toMatch(/reflective_question_generate:\s*{\s*provider: "openai",\s*model: OPENAI_FULL/);
    expect(taskConfig).toMatch(/reflective_question_validate:\s*{\s*provider: "openai",\s*model: OPENAI_FULL/);
    expect(taskConfig).not.toMatch(/UNROUTED_TASK_AI/);
    expect(taskConfig).toMatch(/missingOrUnknownTaskMessage/);
    expect(proxyIndex).toMatch(/missingOrUnknownTaskMessage\(body\.task\)/);
  });
});
