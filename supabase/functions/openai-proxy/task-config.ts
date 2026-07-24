/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  ΡΥΘΜΙΣΕ ΕΔΩ — provider + model ανά task (ένα μέρος στο repo)
 *  EDIT HERE — one place for provider + model per task
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * - provider: "openai" | "anthropic" (default here: openai)
 * - model:
 *     - string π.χ. "gpt-5.4-mini" / "gpt-5.4" → πάντα αυτό το id
 *     - null → χρησιμοποιεί secrets (OPENAI_MODEL_*) ή το model της εφαρμογής
 * - fallbackAnthropicModel (optional, μόνο όταν provider = "openai"):
 *     Αν το OpenAI αποτύχει (429, 5xx, ή κενό completion) και υπάρχει ANTHROPIC_API_KEY, μία προσπάθεια με αυτό το Anthropic model.
 *
 * Μετά: `supabase functions deploy openai-proxy`
 */

import type { OneirosTask } from "./ai-routing.ts";

export type TaskProvider = "openai" | "anthropic";

export type TaskAiEntry = {
  provider: TaskProvider;
  /** Non-null = fixed model id. Null = use Supabase secrets + app `model` (see README). */
  model: string | null;
  /**
   * OpenAI-only: retry once on failure (429 / 5xx / empty assistant text) when `ANTHROPIC_API_KEY` is set.
   */
  fallbackAnthropicModel?: string | null;
};

/** Unrouted requests (no `task` in body) use this. */
export const UNROUTED_TASK_AI: TaskAiEntry = {
  provider: "openai",
  model: "gpt-5.4-mini",
};

/** Latency-first tasks used in the reflection critical path. */
const OPENAI_CHEAP = "gpt-5.4-mini";
/** Long-form synthesis tasks where the user is already in an explicitly generative flow. */
const OPENAI_PREMIUM = "gpt-5.4";
/** Fallback when OpenAI errors or returns empty (needs ANTHROPIC_API_KEY on the function). */
const ANTHROPIC_FALLBACK = "claude-haiku-4-5";

export const TASK_AI_BY_TASK: Record<OneirosTask, TaskAiEntry> = {
  dream_extraction: {
    provider: "openai",
    model: OPENAI_CHEAP,
  },
  conversation_element_update: {
    provider: "openai",
    model: OPENAI_CHEAP,
  },
  semantic_grouping: {
    provider: "openai",
    model: OPENAI_CHEAP,
  },
  pattern_insights: {
    provider: "openai",
    model: OPENAI_PREMIUM,
    fallbackAnthropicModel: ANTHROPIC_FALLBACK,
  },
  pattern_insights_retry_compact: {
    provider: "openai",
    model: OPENAI_PREMIUM,
    fallbackAnthropicModel: ANTHROPIC_FALLBACK,
  },
  interpretation_quick: {
    provider: "openai",
    model: OPENAI_PREMIUM,
    fallbackAnthropicModel: ANTHROPIC_FALLBACK,
  },
  interpretation_standard: {
    provider: "openai",
    model: OPENAI_PREMIUM,
    fallbackAnthropicModel: ANTHROPIC_FALLBACK,
  },
  interpretation_advanced: {
    provider: "openai",
    model: OPENAI_PREMIUM,
    fallbackAnthropicModel: ANTHROPIC_FALLBACK,
  },
  interpretation_retry_compact: {
    provider: "openai",
    model: OPENAI_PREMIUM,
    fallbackAnthropicModel: ANTHROPIC_FALLBACK,
  },
  chat_followup: {
    provider: "openai",
    model: OPENAI_PREMIUM,
    fallbackAnthropicModel: ANTHROPIC_FALLBACK,
  },
};

export function getTaskAiConfig(task: OneirosTask | null): TaskAiEntry {
  if (!task) return UNROUTED_TASK_AI;
  return TASK_AI_BY_TASK[task] ?? UNROUTED_TASK_AI;
}
