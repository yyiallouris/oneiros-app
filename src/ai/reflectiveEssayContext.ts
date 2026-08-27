export type ReflectiveEssaySurface = 'period' | 'recent';

export type NarrativeFirstEssayContextEntry = {
  date: string;
  dreamNarrative: string;
  affects: string[];
  symbols: string[];
  symbolStances: string[];
  landscapes: string[];
  relationalDynamics: string[];
  interpretation: string;
};

export type MetadataFirstEssayContextEntry = {
  date: string;
  coreMode: string;
  affects: string[];
  symbols: string[];
  symbolStances: string[];
  landscapes: string[];
  motifs: string[];
  relationalDynamics: string[];
  thresholds: string[];
  centralConflicts: string[];
  archetypalEchoes: string;
  mythicEchoes: string;
  interpretation: string;
};

export const DREAM_EXCERPT_SHORTENED_MARKER = '[...dream excerpt shortened...]';

const normalizeContextText = (value: string): string => value.replace(/\s+/g, ' ').trim();

export function getDreamNarrativeExcerptLimit(
  surface: ReflectiveEssaySurface,
  dreamCount: number
): number {
  if (surface === 'recent') return 1600;
  if (dreamCount <= 4) return 1400;
  if (dreamCount <= 10) return 900;
  return 600;
}

export function getInterpretationExcerptLimit(surface: ReflectiveEssaySurface): number {
  return surface === 'recent' ? 250 : 300;
}

export function buildBoundedDreamExcerpt(value: string, maximum: number): string {
  const clean = normalizeContextText(value);
  if (clean.length <= maximum) return clean;

  const separator = ` ${DREAM_EXCERPT_SHORTENED_MARKER} `;
  const available = Math.max(0, maximum - separator.length);
  const beginningLength = Math.floor(available * 0.65);
  const endingLength = available - beginningLength;

  return `${clean.slice(0, beginningLength).trimEnd()}${separator}${clean
    .slice(-endingLength)
    .trimStart()}`;
}

function buildLeadingExcerpt(value: string, maximum: number): string {
  const clean = normalizeContextText(value);
  if (!clean) return '(none)';
  return clean.length > maximum ? `${clean.slice(0, Math.max(0, maximum - 3)).trimEnd()}...` : clean;
}

function joinValues(values: string[], separator = ', '): string {
  return values.filter((value) => value.trim()).join(separator) || '(none)';
}

export function buildNarrativeFirstEssayContext(
  entries: NarrativeFirstEssayContextEntry[],
  surface: ReflectiveEssaySurface
): string {
  const dreamExcerptLimit = getDreamNarrativeExcerptLimit(surface, entries.length);
  const interpretationExcerptLimit = getInterpretationExcerptLimit(surface);

  return entries
    .map((entry, index) => `Dream ${index + 1}
Date: ${entry.date}
Dream narrative excerpt: ${buildBoundedDreamExcerpt(entry.dreamNarrative, dreamExcerptLimit) || '(none)'}
Affects: ${joinValues(entry.affects)}
Key symbols: ${joinValues(entry.symbols.slice(0, 5))}
Symbol stances: ${joinValues(entry.symbolStances, '; ')}
Landscapes: ${joinValues(entry.landscapes.slice(0, 3))}
Relational dynamics: ${joinValues(entry.relationalDynamics, '; ')}

Secondary interpretation note:
${buildLeadingExcerpt(entry.interpretation, interpretationExcerptLimit)}`)
    .join('\n\n');
}

/** Accepted Phase 1 production context. Narrative-first context remains evaluation-only. */
export function buildMetadataFirstEssayContext(
  entries: MetadataFirstEssayContextEntry[],
  surface: ReflectiveEssaySurface
): string {
  const interpretationLimit = surface === 'recent' ? 520 : 650;
  return entries
    .map((entry, index) => `Dream ${index + 1}
Date: ${entry.date}
Core Mode: ${entry.coreMode || '(not set)'}
Affects: ${joinValues(entry.affects)}
Symbols: ${joinValues(entry.symbols)}
Symbol stances: ${joinValues(entry.symbolStances, '; ')}
Landscapes: ${joinValues(entry.landscapes.slice(0, 3))}
Motifs: ${joinValues(entry.motifs, '; ')}
Relational dynamics: ${joinValues(entry.relationalDynamics, '; ')}
Thresholds: ${joinValues(entry.thresholds, '; ')}
Central conflicts: ${joinValues(entry.centralConflicts, '; ')}
Archetypal Echoes: ${entry.archetypalEchoes || '(none)'}
Mythic Echoes: ${entry.mythicEchoes || '(none)'}
Interpretation excerpt: ${buildLeadingExcerpt(entry.interpretation, interpretationLimit)}`)
    .join('\n\n');
}
