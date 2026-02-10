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
  /** One of: Core Tension, Core State, Core Shift, Core Restoration */
  core_mode?: string;
  /** Brief echoes/resonances for 1–2 key symbols (pattern/amplification) */
  amplifications?: string[];
  summary?: string;
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

