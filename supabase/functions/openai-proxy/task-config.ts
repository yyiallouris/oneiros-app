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
 * - fallbackAnthropicModels (optional, μόνο όταν provider = "openai"):
 *     Ordered list. Αν το OpenAI αποτύχει (400 / 429 / 5xx, ή κενό completion)
 *     και υπάρχει ANTHROPIC_API_KEY, δοκιμάζονται με τη σειρά μέχρι να πετύχει ένα.
 *
 * CRITICAL — sampling params:
 * - `claude-sonnet-5` (and newer Opus) REJECT temperature/top_p/top_k (HTTP 400).
 * - Many `gpt-5*` / `o*` configs also reject custom temperature.
 * - `openai-proxy` must omit forbidden sampling params per model. Never "fix" a
 *   fallback by only changing the model id in this file without verifying the
 *   proxy still strips incompatible params — otherwise reflection fails with
 *   "AI proxy request failed" and quota is released.
 *
 * Product mapping (A/B-backed, 2026-07) — while OpenAI primary is flaky, reflection
 * keeps a Haiku safety net after Sonnet:
 * - Nano + Haiku          → mechanical classify/update
 * - Mini + Haiku          → dream metadata extraction + chat follow-up
 * - Mini/requested + Haiku → standalone archetype recognition spike
 * - GPT-5.4 + Sonnet→Haiku → user-facing analysis (reflection / reflective questions / pattern essay)
 * - Missing/unknown task  → reject (no silent unrouted default)
 *
 * After any change here: deploy openai-proxy AND smoke-test Advanced reflection
 * (confirm logs show anthropic fallback start/success when OpenAI fails).
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
   * OpenAI-only: ordered Anthropic fallbacks when OpenAI fails
   * (400 / 429 / 5xx / empty assistant text) and `ANTHROPIC_API_KEY` is set.
   */
  fallbackAnthropicModels?: string[];
};

/** Cheapest tier — light classify / candidate grouping. */
const OPENAI_NANO = "gpt-5.4-nano";
/** Mid tier — dream metadata extraction + follow-up chat. */
const OPENAI_MINI = "gpt-5.4-mini";
/** Full tier — core dream reflection + pattern essays. */
const OPENAI_FULL = "gpt-5.4";
/** Operational Anthropic fallback (extract / classify / chat / last-resort). */
const ANTHROPIC_HAIKU = "claude-haiku-4-5";
/** Quality Anthropic fallback for premium user-facing analysis. */
const ANTHROPIC_SONNET = "claude-sonnet-5";

/** Reflection / essay: try Sonnet first, Haiku as proven safety net. */
const FALLBACK_PREMIUM = [ANTHROPIC_SONNET, ANTHROPIC_HAIKU];
/** Lighter tasks: Haiku only. */
const FALLBACK_HAIKU = [ANTHROPIC_HAIKU];

export const TASK_AI_BY_TASK: Record<OneirosTask, TaskAiEntry> = {
  // dream_metadata_extract — needs enough capacity for Interpretive Echoes judgment
  dream_extraction: {
    provider: "openai",
    model: OPENAI_MINI,
    fallbackAnthropicModels: FALLBACK_HAIKU,
  },
  // standalone archetype recognition spike — runner may compare mini vs full model
  dream_archetype_recognition: {
    provider: "openai",
    model: null,
    fallbackAnthropicModels: FALLBACK_HAIKU,
  },
  // standalone archetype adjudication spike — discovery stays separate
  dream_archetype_adjudication: {
    provider: "openai",
    model: null,
    fallbackAnthropicModels: FALLBACK_HAIKU,
  },
  conversation_element_update: {
    provider: "openai",
    model: OPENAI_NANO,
    fallbackAnthropicModels: FALLBACK_HAIKU,
  },
  // pattern_candidates
  semantic_grouping: {
    provider: "openai",
    model: OPENAI_NANO,
    fallbackAnthropicModels: FALLBACK_HAIKU,
  },
  // pattern_essay
  pattern_insights: {
    provider: "openai",
    model: OPENAI_FULL,
    fallbackAnthropicModels: FALLBACK_PREMIUM,
  },
  pattern_insights_retry_compact: {
    provider: "openai",
    model: OPENAI_FULL,
    fallbackAnthropicModels: FALLBACK_PREMIUM,
  },
  // reflection (all depths — primary product)
  interpretation_quick: {
    provider: "openai",
    model: OPENAI_FULL,
    fallbackAnthropicModels: FALLBACK_PREMIUM,
  },
  interpretation_standard: {
    provider: "openai",
    model: OPENAI_FULL,
    fallbackAnthropicModels: FALLBACK_PREMIUM,
  },
  interpretation_advanced: {
    provider: "openai",
    model: OPENAI_FULL,
    fallbackAnthropicModels: FALLBACK_PREMIUM,
  },
  // compact regenerate/deepen retry — same quality bar as reflection
  interpretation_retry_compact: {
    provider: "openai",
    model: OPENAI_FULL,
    fallbackAnthropicModels: FALLBACK_PREMIUM,
  },
  // chat_followup — Dialogue v1.9.1 stays gpt-5.4-mini. Do not "upgrade" this.
  chat_followup: {
    provider: "openai",
    model: OPENAI_MINI,
    fallbackAnthropicModels: FALLBACK_HAIKU,
  },
  // Reflective Question Composer v1 — must stay full GPT-5.4, never mini/nano.
  reflective_question_generate: {
    provider: "openai",
    model: OPENAI_FULL,
    fallbackAnthropicModels: FALLBACK_PREMIUM,
  },
  reflective_question_validate: {
    provider: "openai",
    model: OPENAI_FULL,
    fallbackAnthropicModels: FALLBACK_PREMIUM,
  },
};

export function getTaskAiConfig(task: OneirosTask): TaskAiEntry {
  return TASK_AI_BY_TASK[task];
}

/** Deduped ordered Anthropic fallback model ids for a task. */
export function getAnthropicFallbackModels(taskCfg: TaskAiEntry): string[] {
  const raw = Array.isArray(taskCfg.fallbackAnthropicModels)
    ? taskCfg.fallbackAnthropicModels
    : [];
  const out: string[] = [];
  const seen = new Set<string>();
  for (const item of raw) {
    const model = typeof item === "string" ? item.trim() : "";
    if (!model || seen.has(model)) continue;
    seen.add(model);
    out.push(model);
  }
  return out;
}

/** Reject missing/unknown tasks instead of silently routing to a default model. */
export function missingOrUnknownTaskMessage(rawTask: unknown): string {
  if (typeof rawTask === "string" && rawTask.trim().length > 0) {
    return `Unknown AI task: ${rawTask.trim()}`;
  }
  return "Missing AI task — pass a known task in the request body";
}
