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
  archetypes: string[];
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
  /** Brief echoes/resonances for 1–2 key symbols (pattern/amplification) */
  amplifications?: string[];
  /** How each key symbol was experienced in the dream (e.g. playful, painful, stressful). */
  symbol_stances?: { symbol: string; stance: string }[];
  /** Minimal user-facing dream-field summary for DreamDetail. */
  display_distillation?: DisplayDistillation;
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
