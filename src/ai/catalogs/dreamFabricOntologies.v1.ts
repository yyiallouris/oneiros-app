/**
 * Dream Fabric normalization ontologies v1 (starter).
 * Expand synonym clusters over time — used for Insights aggregation, not UI copy rewriting.
 */

export type LocalizedLabels = {
  en: string;
  el?: string;
};

export type OntologyEntry = {
  canonicalKey: string;
  localizedLabels: LocalizedLabels;
  aliases: string[];
  exclusions?: string[];
};

export const AFFECT_ONTOLOGY_V1: OntologyEntry[] = [
  {
    canonicalKey: 'anxiety',
    localizedLabels: { en: 'anxiety', el: 'ανησυχία' },
    aliases: ['άγχος', 'αγωνία', 'νευρικότητα', 'anxiousness', 'unease'],
    exclusions: ['fear of abandonment'],
  },
  {
    canonicalKey: 'fear',
    localizedLabels: { en: 'fear', el: 'φόβος' },
    aliases: ['terror', 'dread', 'τρόμος', 'φόβος'],
  },
  {
    canonicalKey: 'tenderness',
    localizedLabels: { en: 'tenderness', el: 'τρυφερότητα' },
    aliases: ['warmth', 'gentleness', 'στοργή'],
  },
  {
    canonicalKey: 'grief',
    localizedLabels: { en: 'grief', el: 'πένθος' },
    aliases: ['mourning', 'sorrow', 'θλίψη', 'λύπη'],
  },
  {
    canonicalKey: 'shame',
    localizedLabels: { en: 'shame', el: 'ντροπή' },
    aliases: ['humiliation', 'ενοχή', 'ντροπή'],
  },
  {
    canonicalKey: 'awe',
    localizedLabels: { en: 'awe', el: 'δέος' },
    aliases: ['wonder', 'θαυμασμός', 'δέος'],
  },
  {
    canonicalKey: 'anger',
    localizedLabels: { en: 'anger', el: 'θυμός' },
    aliases: ['rage', 'οργή', 'θυμός'],
  },
  {
    canonicalKey: 'relief',
    localizedLabels: { en: 'relief', el: 'ανακούφιση' },
    aliases: ['ease', 'ανακούφιση'],
  },
];

export const RELATIONAL_DYNAMICS_ONTOLOGY_V1: OntologyEntry[] = [
  {
    canonicalKey: 'maternal_urgency',
    localizedLabels: { en: 'maternal urgency', el: 'μητρική επείγουσα πίεση' },
    aliases: ['mother pressing', 'μητρική πίεση'],
  },
  {
    canonicalKey: 'watched_from_distance',
    localizedLabels: { en: 'watched from a distance', el: 'παρακολούθηση από απόσταση' },
    aliases: ['being watched', 'με κοιτούν'],
  },
  {
    canonicalKey: 'conditional_guidance',
    localizedLabels: { en: 'conditional guidance', el: 'καθοδήγηση υπό όρους' },
    aliases: ['help with conditions'],
  },
];

export const THRESHOLD_ONTOLOGY_V1: OntologyEntry[] = [
  {
    canonicalKey: 'descent',
    localizedLabels: { en: 'descent', el: 'κατάβαση' },
    aliases: ['going down', 'κατάβαση', 'υπόγειο'],
  },
  {
    canonicalKey: 'door_crossing',
    localizedLabels: { en: 'door crossing', el: 'πέρασμα πόρτας' },
    aliases: ['threshold door', 'πόρτα', 'κατώφλι'],
  },
];

/** Best-effort canonicalization; returns original if unknown. */
export function canonicalizeOntologyLabel(raw: string, ontology: OntologyEntry[]): string {
  const n = raw.trim().toLowerCase();
  if (!n) return raw;
  for (const entry of ontology) {
    if (entry.canonicalKey === n) return entry.localizedLabels.en;
    if (entry.localizedLabels.en.toLowerCase() === n) return entry.localizedLabels.en;
    if (entry.localizedLabels.el?.toLowerCase() === n) return entry.localizedLabels.en;
    if (entry.aliases.some((a) => a.toLowerCase() === n)) return entry.localizedLabels.en;
    if (entry.exclusions?.some((e) => e.toLowerCase() === n)) return raw;
  }
  return raw;
}
