/**
 * Guards Anthropic fallback chains in openai-proxy task-config.
 * Flow docs: documentation/flows-06-jungian-ai-reflection.md
 * Proxy docs: supabase/functions/openai-proxy/README.md
 */
import {
  getAnthropicFallbackModels,
  TASK_AI_BY_TASK,
} from '../../supabase/functions/openai-proxy/task-config';

describe('openai-proxy Anthropic fallback chains', () => {
  it('keeps Haiku safety net after Sonnet for user-facing reflective work', () => {
    for (const task of [
      'interpretation_quick',
      'interpretation_standard',
      'interpretation_advanced',
      'interpretation_retry_compact',
      'pattern_insights',
      'pattern_insights_retry_compact',
      'reflective_question_generate',
      'reflective_question_validate',
    ] as const) {
      expect(getAnthropicFallbackModels(TASK_AI_BY_TASK[task])).toEqual([
        'claude-sonnet-5',
        'claude-haiku-4-5',
      ]);
    }
    expect(TASK_AI_BY_TASK.reflective_question_generate.model).toBe('gpt-5.4');
    expect(TASK_AI_BY_TASK.reflective_question_generate.model).not.toMatch(/mini|nano/);
    expect(TASK_AI_BY_TASK.chat_followup.model).toBe('gpt-5.4-mini');
  });

  it('uses Haiku-only fallbacks for lighter tasks', () => {
    for (const task of [
      'dream_extraction',
      'conversation_element_update',
      'semantic_grouping',
      'chat_followup',
    ] as const) {
      expect(getAnthropicFallbackModels(TASK_AI_BY_TASK[task])).toEqual(['claude-haiku-4-5']);
    }
  });
});
