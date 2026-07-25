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
 * Product mapping (A/B-backed, 2026-07):
 * - Nano + Haiku fallback  → mechanical classify/update (conversation element update / candidates)
 * - Mini + Haiku fallback  → dream metadata extraction (Fabric + Interpretive Echoes need judgment) + chat follow-up
 * - GPT-5.4 + Sonnet 5    → user-facing analysis (reflection / pattern essay)
 * - Missing/unknown task  → reject (no silent unrouted default)
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

/** Cheapest tier — light classify / candidate grouping. */
const OPENAI_NANO = "gpt-5.4-nano";
/** Mid tier — dream metadata extraction + follow-up chat. */
const OPENAI_MINI = "gpt-5.4-mini";
/** Full tier — core dream reflection + pattern essays. */
const OPENAI_FULL = "gpt-5.4";
/** Operational Anthropic fallback (extract / classify / chat). */
const ANTHROPIC_HAIKU = "claude-haiku-4-5";
/** Quality Anthropic fallback for premium user-facing analysis. */
const ANTHROPIC_SONNET = "claude-sonnet-5";

export const TASK_AI_BY_TASK: Record<OneirosTask, TaskAiEntry> = {
  // dream_metadata_extract — needs enough capacity for Interpretive Echoes judgment
  dream_extraction: {
    provider: "openai",
    model: OPENAI_MINI,
    fallbackAnthropicModel: ANTHROPIC_HAIKU,
  },
  conversation_element_update: {
    provider: "openai",
    model: OPENAI_NANO,
    fallbackAnthropicModel: ANTHROPIC_HAIKU,
  },
  // pattern_candidates
  semantic_grouping: {
    provider: "openai",
    model: OPENAI_NANO,
    fallbackAnthropicModel: ANTHROPIC_HAIKU,
  },
  // pattern_essay
  pattern_insights: {
    provider: "openai",
    model: OPENAI_FULL,
    fallbackAnthropicModel: ANTHROPIC_SONNET,
  },
  pattern_insights_retry_compact: {
    provider: "openai",
    model: OPENAI_FULL,
    fallbackAnthropicModel: ANTHROPIC_SONNET,
  },
  // reflection (all depths — primary product)
  interpretation_quick: {
    provider: "openai",
    model: OPENAI_FULL,
    fallbackAnthropicModel: ANTHROPIC_SONNET,
  },
  interpretation_standard: {
    provider: "openai",
    model: OPENAI_FULL,
    fallbackAnthropicModel: ANTHROPIC_SONNET,
  },
  interpretation_advanced: {
    provider: "openai",
    model: OPENAI_FULL,
    fallbackAnthropicModel: ANTHROPIC_SONNET,
  },
  // compact regenerate/deepen retry — same quality bar as reflection
  interpretation_retry_compact: {
    provider: "openai",
    model: OPENAI_FULL,
    fallbackAnthropicModel: ANTHROPIC_SONNET,
  },
  // chat_followup
  chat_followup: {
    provider: "openai",
    model: OPENAI_MINI,
    fallbackAnthropicModel: ANTHROPIC_HAIKU,
  },
};

export function getTaskAiConfig(task: OneirosTask): TaskAiEntry {
  return TASK_AI_BY_TASK[task];
}

/** Reject missing/unknown tasks instead of silently routing to a default model. */
export function missingOrUnknownTaskMessage(rawTask: unknown): string {
  if (typeof rawTask === "string" && rawTask.trim().length > 0) {
    return `Unknown AI task: ${rawTask.trim()}`;
  }
  return "Missing AI task — pass a known task in the request body";
}
