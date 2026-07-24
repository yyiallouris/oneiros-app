import type {
  DisplayDistillation,
  DisplayDistillationAnchorType,
  DisplayDistillationDominantLens,
  Dream,
  Interpretation,
} from '../types/dream';

export type VisibleDreamAnchor = {
  label: string;
  type: DisplayDistillationAnchorType;
  salience: 1 | 2 | 3 | 4 | 5;
  uiMeaning?: string;
  source:
    | 'display_distillation'
    | 'symbol_stances'
    | 'symbols'
    | 'affects'
    | 'thresholds'
    | 'central_conflicts'
    | 'relational_dynamics'
    | 'archetypes';
};

export type DreamDetailDisplayModel = {
  essenceTitle?: string | null;
  essenceLine?: string | null;
  dominantLens: DisplayDistillationDominantLens;
  anchors: VisibleDreamAnchor[];
  mainTension?: string | null;
  movementLine?: string | null;
  symbolicLayers: {
    emotionalWeather: string[];
    dreamSetting: string[];
    thresholds: string[];
    relationshipField: string[];
    repeatingPatterns: string[];
    innerTensions: string[];
    archetypalEchoes: string[];
    mythicParallels: string[];
  };
};

const MAX_VISIBLE_ANCHORS = 5;
const MAX_LAYER_ITEMS = 6;

const compactUnique = (items: Array<string | undefined | null>, max: number): string[] => {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const item of items) {
    const value = item?.trim().replace(/\s+/g, ' ');
    if (!value) continue;
    const key = value.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(value);
    if (result.length >= max) break;
  }
  return result;
};

const normalizeAnchorLabel = (value: string): string => {
  const trimmed = value.trim().replace(/\s+/g, ' ');
  if (!trimmed) return '';
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
};

const clampSalience = (value: number): 1 | 2 | 3 | 4 | 5 => {
  if (value >= 5) return 5;
  if (value >= 4) return 4;
  if (value >= 3) return 3;
  if (value >= 2) return 2;
  return 1;
};

const dedupeAnchors = (anchors: VisibleDreamAnchor[]): VisibleDreamAnchor[] => {
  const seen = new Set<string>();
  const result: VisibleDreamAnchor[] = [];
  for (const anchor of anchors) {
    const label = normalizeAnchorLabel(anchor.label);
    if (!label) continue;
    const key = label.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push({ ...anchor, label });
  }
  return result;
};

const anchorsFromDisplayDistillation = (display: DisplayDistillation): VisibleDreamAnchor[] =>
  (Array.isArray(display.visible_anchors) ? display.visible_anchors : [])
    .slice(0, MAX_VISIBLE_ANCHORS)
    .map((anchor) => ({
      label: normalizeAnchorLabel(anchor?.label ?? ''),
      type: anchor?.type ?? 'image',
      salience: clampSalience(Number(anchor?.salience) || 1),
      uiMeaning: anchor?.ui_meaning || undefined,
      source: 'display_distillation' as const,
    }))
    .filter((anchor) => anchor.label.length > 0);

export const buildVisibleAnchorsFromMetadata = (
  dream: Dream,
  interpretation?: Interpretation | null
): VisibleDreamAnchor[] => {
  const anchors: VisibleDreamAnchor[] = [];
  const symbolStances = interpretation?.symbol_stances ?? [];
  const symbols =
    interpretation?.symbols && interpretation.symbols.length > 0
      ? interpretation.symbols
      : dream.symbols ?? [];

  symbolStances.slice(0, 3).forEach((stance) => {
    anchors.push({
      label: stance.symbol,
      type: 'image',
      salience: 5,
      uiMeaning: stance.stance || undefined,
      source: 'symbol_stances',
    });
  });

  (interpretation?.central_conflicts ?? []).slice(0, 1).forEach((conflict) => {
    anchors.push({
      label: conflict,
      type: 'tension',
      salience: 4,
      uiMeaning: 'A central opposing pressure in the dream.',
      source: 'central_conflicts',
    });
  });

  (interpretation?.thresholds ?? []).slice(0, 1).forEach((threshold) => {
    anchors.push({
      label: threshold,
      type: 'threshold',
      salience: 4,
      uiMeaning: 'A crossing, edge, or point of transition.',
      source: 'thresholds',
    });
  });

  (interpretation?.relational_dynamics ?? []).slice(0, 1).forEach((dynamic) => {
    anchors.push({
      label: dynamic,
      type: 'relationship',
      salience: 3,
      uiMeaning: 'A relational pattern active in the dream.',
      source: 'relational_dynamics',
    });
  });

  (interpretation?.affects ?? []).slice(0, 1).forEach((affect) => {
    anchors.push({
      label: affect,
      type: 'feeling',
      salience: 3,
      uiMeaning: 'A dominant emotional atmosphere in the dream.',
      source: 'affects',
    });
  });

  const dedupedBeforeSymbols = dedupeAnchors(anchors);
  if (dedupedBeforeSymbols.length < 3) {
    symbols.slice(0, 3 - dedupedBeforeSymbols.length).forEach((symbol) => {
      anchors.push({
        label: symbol,
        type: 'image',
        salience: 2,
        source: 'symbols',
      });
    });
  }

  return dedupeAnchors(anchors)
    .sort((a, b) => b.salience - a.salience)
    .slice(0, MAX_VISIBLE_ANCHORS);
};

const buildFallbackMovementLine = (interpretation?: Interpretation | null): string | null => {
  if (!interpretation) return null;
  if (interpretation.thresholds?.[0]) return interpretation.thresholds[0];
  if (interpretation.relational_dynamics?.[0]) return interpretation.relational_dynamics[0];
  if (interpretation.motifs?.[0]) return interpretation.motifs[0];

  switch (interpretation.core_mode) {
    case 'Core Tension':
      return 'The dream is holding an unresolved tension.';
    case 'Core State':
      return 'The dream reveals a state the psyche is inhabiting.';
    case 'Core Shift':
      return 'The dream shows movement from one state toward another.';
    case 'Core Restoration':
      return 'The dream carries a movement of repair or return.';
    default:
      return null;
  }
};

export const buildDreamDetailDisplayModel = (
  dream: Dream,
  interpretation?: Interpretation | null
): DreamDetailDisplayModel => {
  const display = interpretation?.display_distillation;
  // Partial AI/gateway distillation must never crash DreamDetail — fall back to metadata.
  const distillationAnchors = display ? anchorsFromDisplayDistillation(display) : [];
  const anchors =
    distillationAnchors.length > 0
      ? distillationAnchors
      : buildVisibleAnchorsFromMetadata(dream, interpretation);

  return {
    essenceTitle: display?.essence_title || null,
    essenceLine: display?.essence_line || null,
    dominantLens: display?.dominant_lens ?? 'unclear',
    anchors,
    mainTension: display?.main_tension ?? interpretation?.central_conflicts?.[0] ?? null,
    movementLine: display?.movement_line ?? buildFallbackMovementLine(interpretation),
    symbolicLayers: {
      emotionalWeather: compactUnique(interpretation?.affects ?? [], MAX_LAYER_ITEMS),
      dreamSetting: compactUnique(interpretation?.landscapes ?? dream.landscapes ?? [], MAX_LAYER_ITEMS),
      thresholds: compactUnique(interpretation?.thresholds ?? [], MAX_LAYER_ITEMS),
      relationshipField: compactUnique(interpretation?.relational_dynamics ?? [], MAX_LAYER_ITEMS),
      repeatingPatterns: compactUnique(interpretation?.motifs ?? [], MAX_LAYER_ITEMS),
      innerTensions: compactUnique(interpretation?.central_conflicts ?? [], MAX_LAYER_ITEMS),
      archetypalEchoes: compactUnique(interpretation?.archetypes ?? dream.archetypes ?? [], 3),
      mythicParallels: compactUnique(interpretation?.amplifications ?? [], 2),
    },
  };
};
