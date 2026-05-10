/**
 * `task` from the app → matched in `task-config.ts` (provider + model per task).
 */

export type OneirosTask =
  | "interpretation_quick"
  | "interpretation_standard"
  | "interpretation_advanced"
  | "interpretation_retry_compact"
  | "chat_followup"
  | "dream_extraction"
  | "conversation_element_update"
  | "pattern_insights"
  | "pattern_insights_retry_compact"
  | "semantic_grouping";

export const TASKS = new Set<OneirosTask>([
  "interpretation_quick",
  "interpretation_standard",
  "interpretation_advanced",
  "interpretation_retry_compact",
  "chat_followup",
  "dream_extraction",
  "conversation_element_update",
  "pattern_insights",
  "pattern_insights_retry_compact",
  "semantic_grouping",
]);

export function normalizeTask(task: unknown): OneirosTask | null {
  return typeof task === "string" && TASKS.has(task as OneirosTask)
    ? (task as OneirosTask)
    : null;
}
