import type { ArchetypalEcho } from '../ai/archetypalEchoes.ts';
import type { MythicEcho } from '../ai/mythicEchoes.ts';

export interface Dream {
  id: string;
  date: string; // ISO date string
  title?: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  symbol?: JungianSymbol;
  archived?: boolean; // If true, dream won't show on WriteScreen
  symbols?: string[]; // Extracted symbols from AI analysis
  archetypes?: string[]; // Extracted archetypes from AI analysis
  landscapes?: string[]; // Extracted settings/places (e.g. forest, beach, childhood home)
}

export type VoiceTranscriptionTarget =
  | { surface: 'write'; key: string }
  | { surface: 'dream-chat'; key: string }
  | { surface: 'interpretation-chat'; key: string };

export interface PendingVoiceTranscription {
  id: string;
  userId: string;
  audioUri: string;
  sizeBytes: number;
  durationMs: number | null;
  target: VoiceTranscriptionTarget;
  status: 'queued' | 'transcribing' | 'retrying' | 'completed' | 'needs_attention';
  lastErrorCode?: string;
  createdAt: string;
  nextAttemptAt: string;
  attemptCount: number;
  transcript?: string;
}

export type JungianSymbol = 'moon' | 'sun' | 'key' | 'eye' | 'labyrinth';

export type DisplayDistillationDominantLens =
  | 'image'
  | 'affect'
  | 'threshold'
  | 'relationship'
  | 'conflict'
  | 'archetypal'
  | 'restoration'
  | 'unclear';

export type DisplayDistillationAnchorType =
  | 'image'
  | 'feeling'
  | 'tension'
  | 'threshold'
  | 'relationship'
  | 'archetypal_echo';

export type DisplayDistillationDreamMovement =
  | 'stuck'
  | 'approaching'
  | 'crossing'
  | 'descending'
  | 'confronting'
  | 'hiding'
  | 'returning'
  | 'integrating'
  | 'restoring'
  | 'unclear';

export type CoreMode =
  | 'Core Tension'
  | 'Core State'
  | 'Core Shift'
  | 'Core Restoration';

export type InterpretationMetadataStatus = 'pending' | 'ready' | 'failed';

export type DisplayDistillationAnchor = {
  label: string;
  type: DisplayDistillationAnchorType;
  salience: 1 | 2 | 3 | 4 | 5;
  ui_meaning: string;
};

export type DisplayDistillation = {
  essence_title: string;
  essence_line: string;
  dominant_lens: DisplayDistillationDominantLens;
  visible_anchors: DisplayDistillationAnchor[];
  main_tension: string | null;
  dream_movement: DisplayDistillationDreamMovement;
  movement_line: string | null;
};

export interface Interpretation {
  id: string;
  dreamId: string;
  messages: ChatMessage[];
  symbols: string[];
  /**
   * Archetypal Echoes: catalog canonical labels with dream-specific expression.
   * Prefer 0–2 objects. Readers should normalize via `normalizeArchetypalEchoes`.
   * Legacy rows may still arrive as whitelist strings / display_label objects.
   */
  archetypes: ArchetypalEcho[];
  landscapes?: string[]; // Settings/places where the dream takes place
  /** Dominant emotional/bodily energies (felt-sense language) for pattern tracking */
  affects?: string[];
  /** Recurring action patterns with verbs of psychic action for pattern tracking */
  motifs?: string[];
  /** How figures regulate pace, permission, urgency, etc. for pattern tracking */
  relational_dynamics?: string[];
  /** Moments of transition, crossing, departure, work, sleep, or change of ground */
  thresholds?: string[];
  /** Psychological oppositions staged by the dream, stated as "X vs Y" */
  central_conflicts?: string[];
  /** One of: Core Tension, Core State, Core Shift, Core Restoration */
  core_mode?: CoreMode;
  /**
   * Mythic Echoes: rare provisional interpretive enrichment (not Dream Fabric).
   * Prefer 0–1 named parallels `{ title, tradition, resonance, divergence, evidence, confidence }`.
   * Dream Detail shows high and medium confidence (legacy missing confidence still displays).
   * Readers should normalize via `normalizeAmplifications` (legacy `difference` → `divergence` on read).
   */
  amplifications?: MythicEcho[];
  /** How each key symbol was experienced in the dream (e.g. playful, painful, stressful). */
  symbol_stances?: { symbol: string; stance: string }[];
  /** Minimal user-facing dream-field summary for DreamDetail. */
  display_distillation?: DisplayDistillation;
  /** Background extraction status for display/Insights metadata. */
  metadata_status?: InterpretationMetadataStatus;
  metadata_generated_at?: string | null;
  metadata_error_code?: string | null;
  /** Stable prompt architecture id used for this extraction (re-extract when outdated). */
  extraction_prompt_version?: string | null;
  /** Structured echo schema generation used for this extraction. */
  extraction_schema_version?: number | null;
  reflection_origin?: 'free_weekly' | 'paid_cycle';
  chat_replies_used?: number;
  chat_replies_limit?: number;
  origin_quota_event_id?: string | null;
  origin_entitlement_id?: string | null;
  createdAt: string;
  updatedAt: string;
  dreamContentAtCreation?: string; // Store the dream content when interpretation was created
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface DreamDraft {
  date: string;
  title?: string;
  content: string;
  lastSaved: string;
}
