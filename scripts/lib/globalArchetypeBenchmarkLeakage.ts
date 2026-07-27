import { ARCHETYPE_CATALOG_V1 } from '../../src/ai/catalogs/archetypeCatalog.v1';
import { ARCHETYPE_MECHANISM_TAGS } from '../../src/ai/archetypeMechanisms';
import type { GlobalArchetypeFixture } from './globalArchetypeBenchmark';

export type LeakageHit = {
  fixture_id: string;
  kind:
    | 'catalog_id'
    | 'canonical_label'
    | 'core_function_phrase'
    | 'select_when_phrase'
    | 'insufficient_when_phrase'
    | 'mechanism_tag'
    | 'interpretive_meta'
    | 'forbidden_term';
  match: string;
  context: string;
};

const FORBIDDEN_DREAM_TERMS = [
  'psychopomp',
  'hieros gamos',
  'anima',
  'animus',
  'persona',
  'archetypal',
  'soul-image',
  'soul image',
  'inner logos',
  'maternal matrix',
  'divine child',
  'death-rebirth',
  'death–rebirth',
  'shadow function',
  'trickster inversion',
  'dream-ego',
  'dream ego',
];

const INTERPRETIVE_META_PATTERNS: RegExp[] = [
  /\bthe dream turns on\b/i,
  /\bthe dream hinges on\b/i,
  /\bthe dream organi[sz]es around\b/i,
  /\bthe dream(?:'s| is) centre is\b/i,
  /\bthe dream(?:'s| is) center is\b/i,
  /\bthe dream(?:'s| is) stake is\b/i,
  /\bthe dream(?:'s| is) engine is\b/i,
  /\bthe structural function\b/i,
  /\bstructural(?:ly)? (?:function|centre|center)\b/i,
  /\bpsychic integration\b/i,
  /\bnot merely\b/i,
  /\bnot ordinary\b/i,
  /\bchanged leverage\b/i,
  /\bboon or changed outcome\b/i,
  /\bno escort\b/i,
  /\bno realm[- ]shift\b/i,
  /\bno guidance across\b/i,
  /\bno disowned counterpart\b/i,
  /\bdeath imagery without\b/i,
  /\bsequenced renewal\b/i,
  /\bemergent renewal\b/i,
  /\bdissolution and emergent\b/i,
  /\bwithout symbolic\b/i,
  /\borganis(?:es|es) the(?: emotional)? (?:gravity|centre|center)\b/i,
  /\boperate together\b/i,
  /\bco-determine\b/i,
  /\bintertwine as dual engines\b/i,
];

/** Ordinary dream-language whitelist for otherwise suspicious tokens. */
const TERM_WHITELIST: Record<string, RegExp[]> = {
  persona: [/\bname tag\b/i, /\bperformance\b/i, /\bpublic role\b/i],
  anima: [],
  animus: [],
};

function snippet(text: string, index: number, radius = 40): string {
  const start = Math.max(0, index - radius);
  const end = Math.min(text.length, index + radius);
  return text.slice(start, end).replace(/\s+/g, ' ').trim();
}

function findRegexHits(
  fixture: GlobalArchetypeFixture,
  pattern: RegExp,
  kind: LeakageHit['kind']
): LeakageHit[] {
  const hits: LeakageHit[] = [];
  const text = fixture.dream;
  const match = text.match(pattern);
  if (match?.index != null) {
    hits.push({
      fixture_id: fixture.id,
      kind,
      match: match[0],
      context: snippet(text, match.index),
    });
  }
  return hits;
}

function containsWholeWord(haystack: string, needle: string): boolean {
  const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`\\b${escaped}\\b`, 'i').test(haystack);
}

function containsCatalogId(lower: string, id: string): boolean {
  const spaced = id.replace(/_/g, ' ');
  if (containsWholeWord(lower, spaced)) return true;
  if (id === 'self') {
    return /\bself\b/i.test(lower) && !/\b(?:my|him|her|it|your|our|them)self\b/i.test(lower);
  }
  return false;
}

function containsForbiddenTerm(lower: string, term: string): boolean {
  if (term === 'anima') {
    return /\banima\b/i.test(lower) && !/\banimal/i.test(lower);
  }
  if (term === 'persona') {
    return /\bpersona\b/i.test(lower) && !/\bpersonal\b/i.test(lower);
  }
  return lower.includes(term);
}

function catalogPhraseHits(fixture: GlobalArchetypeFixture): LeakageHit[] {
  const hits: LeakageHit[] = [];
  const lower = fixture.dream.toLowerCase();

  for (const def of ARCHETYPE_CATALOG_V1) {
    if (def.id && containsCatalogId(lower, def.id)) {
      hits.push({
        fixture_id: fixture.id,
        kind: 'catalog_id',
        match: def.id,
        context: def.id,
      });
    }
    const label = def.canonicalLabel.toLowerCase();
    if (label.length > 4 && containsWholeWord(lower, label)) {
      hits.push({
        fixture_id: fixture.id,
        kind: 'canonical_label',
        match: def.canonicalLabel,
        context: label,
      });
    }
    for (const phrase of def.coreFunction
      .split(/[.;]/)
      .map((p) => p.trim())
      .filter((p) => p.length > 24)) {
      const probe = phrase.toLowerCase().slice(0, 32);
      if (lower.includes(probe)) {
        hits.push({
          fixture_id: fixture.id,
          kind: 'core_function_phrase',
          match: probe,
          context: phrase.slice(0, 80),
        });
      }
    }
    for (const phrase of [...def.selectWhen, ...def.insufficientWhen]) {
      const probe = phrase.toLowerCase();
      if (probe.length > 18 && lower.includes(probe)) {
        hits.push({
          fixture_id: fixture.id,
          kind: def.selectWhen.includes(phrase) ? 'select_when_phrase' : 'insufficient_when_phrase',
          match: phrase,
          context: phrase,
        });
      }
    }
  }

  for (const tag of ARCHETYPE_MECHANISM_TAGS) {
    const readable = tag.replace(/_/g, ' ');
    if (containsWholeWord(lower, readable)) {
      hits.push({
        fixture_id: fixture.id,
        kind: 'mechanism_tag',
        match: tag,
        context: readable,
      });
    }
  }

  return hits;
}

export function detectGlobalArchetypeFixtureLeakage(
  fixture: GlobalArchetypeFixture
): LeakageHit[] {
  const hits: LeakageHit[] = [];
  const lower = fixture.dream.toLowerCase();

  for (const term of FORBIDDEN_DREAM_TERMS) {
    if (!containsForbiddenTerm(lower, term)) continue;
    const idx = lower.indexOf(term);
    const whitelisted = TERM_WHITELIST[term]?.some((re) => re.test(fixture.dream));
    if (whitelisted) continue;
    hits.push({
      fixture_id: fixture.id,
      kind: 'forbidden_term',
      match: term,
      context: snippet(fixture.dream, idx),
    });
  }

  for (const pattern of INTERPRETIVE_META_PATTERNS) {
    hits.push(...findRegexHits(fixture, pattern, 'interpretive_meta'));
  }

  hits.push(...catalogPhraseHits(fixture));

  const seen = new Set<string>();
  return hits.filter((hit) => {
    const key = `${hit.kind}:${hit.match}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function detectGlobalArchetypeDatasetLeakage(fixtures: GlobalArchetypeFixture[]): {
  total_hits: number;
  fixtures_with_hits: number;
  by_fixture: Record<string, LeakageHit[]>;
} {
  const by_fixture: Record<string, LeakageHit[]> = {};
  let total_hits = 0;
  for (const fixture of fixtures) {
    const hits = detectGlobalArchetypeFixtureLeakage(fixture);
    if (hits.length > 0) by_fixture[fixture.id] = hits;
    total_hits += hits.length;
  }
  return {
    total_hits,
    fixtures_with_hits: Object.keys(by_fixture).length,
    by_fixture,
  };
}
