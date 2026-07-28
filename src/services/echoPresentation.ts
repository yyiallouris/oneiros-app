import {
  normalizeArchetypalEchoes,
  type ArchetypalEcho,
  type EchoDisplayCard,
} from '../ai/archetypalEchoes.ts';
import { normalizeAmplifications, type MythicEcho } from '../ai/mythicEchoes.ts';
import { getArchetypeDisplayLabel } from '../ai/catalogs/archetypeCatalog.v1.ts';
import {
  getMythicCatalogEntry,
  MYTHIC_CATALOG_VERSION,
} from '../ai/catalogs/mythicNarrativeCatalog.ts';
import {
  resolveDreamOutputLanguage,
  type DreamOutputLanguageCode,
} from '../ai/dreamOutputLanguage.ts';

type EchoPresentationLanguage = DreamOutputLanguageCode;

type MythSynopsisLocalizationInput = {
  mythCatalogVersion: string;
  catalogId: string;
  canonicalTitle: string;
  coreSynopsis: string;
  targetLanguage: EchoPresentationLanguage;
};

const mythSynopsisCache = new Map<string, string>();
const mythCatalogJson = require('../ai/catalogs/mythic_narrative_catalog.v1.json') as {
  entries?: Array<{
    id: string;
    canonical_title: string;
    tradition_display: string;
    core_synopsis?: string;
  }>;
};

const GREEK_TRADITION_LABELS: Record<string, string> = {
  'Akan / Asante folklore': 'Λαϊκή παράδοση Ακάν / Ασάντε',
  'Ancient Egyptian': 'Αρχαία αιγυπτιακή παράδοση',
  'Andean / Inca tradition': 'Ανδεανή / Ίνκα παράδοση',
  'Buddhist narrative tradition': 'Βουδιστική αφηγηματική παράδοση',
  'Chinese mythic and literary tradition': 'Κινεζική μυθική και λογοτεχνική παράδοση',
  'French literary fairy-tale tradition': 'Γαλλική λογοτεχνική παραμυθιακή παράδοση',
  'German fairy-tale tradition': 'Γερμανική παραμυθιακή παράδοση',
  'Greek mythology': 'Ελληνική μυθολογία',
  'Hebrew Bible / Tanakh': 'Εβραϊκή Βίβλος / Τανάκ',
  'Hindu epic and Puranic tradition': 'Ινδουιστική επική και πουρανική παράδοση',
  'Hindu epic and Purāṇic tradition': 'Ινδουιστική επική και πουρανική παράδοση',
  'Irish / Scottish tradition': 'Ιρλανδική / σκωτσέζικη παράδοση',
  'Japanese Shinto and tale tradition': 'Ιαπωνική σιντοϊστική και αφηγηματική παράδοση',
  "K'iche' Maya tradition": "Παράδοση των Μάγια Κ'ιτσε'",
  'Māori tradition': 'Παράδοση των Μαορί',
  'Nahua / Mexica tradition': 'Παράδοση Νάουα / Μεσίκα',
  'Norse mythology': 'Νορβηγική μυθολογία',
  'One Thousand and One Nights': 'Χίλιες και Μία Νύχτες',
  'Qur’anic and Islamic tradition': 'Κορανική και ισλαμική παράδοση',
  'Slavic folklore': 'Σλαβική λαϊκή παράδοση',
  'Sumerian / Mesopotamian': 'Σουμεριακή / Μεσοποταμιακή παράδοση',
  'Welsh medieval tradition': 'Ουαλική μεσαιωνική παράδοση',
  'West and Central African epic tradition': 'Δυτικοαφρικανική και κεντροαφρικανική επική παράδοση',
  'Western alchemical tradition': 'Δυτική αλχημική παράδοση',
  'Yorùbá tradition': 'Παράδοση Γιορούμπα',
};

const GREEK_SYNOPSIS_BY_CATALOG_ID: Record<string, string> = {
  'greek.cretan_labyrinth':
    'Η Αριάδνη δίνει το νήμα που επιτρέπει την είσοδο και την επιστροφή από τον λαβύρινθο, όπου περιμένει το τέρας στο κέντρο. Η διάσωση εξαρτάται από το να φτάσει κανείς στο κέντρο και να βρει τον δρόμο της επιστροφής.',
  'greek.orpheus_eurydice':
    'Ο Ορφέας κατεβαίνει για να ξαναφέρει την Ευρυδίκη από τον κόσμο των νεκρών. Η επιστροφή επιτρέπεται μόνο αν δεν κοιτάξει πίσω πριν βγουν στο φως, αλλά το απαγορευμένο γύρισμα φέρνει μια δεύτερη και οριστική απώλεια.',
  'greek.psyche_eros':
    'Η Ψυχή ενώνεται κρυφά με τον Έρωτα, αλλά η περιέργεια σπάει τον όρο της ένωσής τους και τον χάνει. Οι δοκιμασίες και η κάθοδός της στον κάτω κόσμο οδηγούν τελικά σε επανένωση και μεταμόρφωση.',
  'greek.demeter_persephone':
    'Η Περσεφόνη κατεβαίνει στον κάτω κόσμο και μια δεσμευτική πράξη την κρατά δεμένη εκεί. Η επιστροφή της γίνεται μόνο μερικά και κυκλικά, κι έτσι αλλάζει ο ρυθμός της γονιμότητας και των εποχών.',
  'japanese.amaterasu_cave':
    'Η Αματεράσου αποσύρεται σε μια σπηλιά έπειτα από βίαιη προσβολή και ο κόσμος βυθίζεται στο σκοτάδι. Οι άλλοι θεοί τη δελεάζουν να βγει με τελετουργία, γέλιο και καθρέφτη, και μετά κλείνουν τη σπηλιά για να μη ξανακλειστεί.',
  'greek.narcissus_echo':
    'Οι άλλοι ζητούν σχέση από τον Νάρκισσο, αλλά εκείνος τους απορρίπτει και παγιδεύεται στη δική του αντανάκλαση. Η επιθυμία δεν μπορεί να ολοκληρωθεί και η ιστορία οδηγεί σε θάνατο και μεταμόρφωση.',
  'hebrew_bible.tower_babel':
    'Μια συλλογικότητα με μία γλώσσα χτίζει πύργο προς τα πάνω και συγκεντρώνει τη δύναμή της σε ένα κοινό έργο. Η γλώσσα διασπάται, ο συντονισμός σπάει και ο πύργος μένει ατελείωτος καθώς οι άνθρωποι διασκορπίζονται.',
  'greek.cronus_devouring_children':
    'Ο Κρόνος φοβάται ότι θα εκτοπιστεί από τα παιδιά του και τα καταπίνει ή τα κρατά κλεισμένα για να εμποδίσει τη διαδοχή. Ένα παιδί κρύβεται, επιστρέφει αργότερα και απελευθερώνει τους νεότερους από την παλιά πατρική τάξη.',
  'hebrew_bible.joseph':
    'Τα όνειρα του Ιωσήφ προκαλούν φθόνο και τον ρίχνουν σε πηγάδι, δουλεία και αλλεπάλληλες ανατροπές. Το χάρισμά του τον φέρνει από τη φυλακή στην αυλή, ώσπου η πείνα φέρνει ξανά την οικογένεια και ανοίγει τον δρόμο για αναγνώριση και συμφιλίωση.',
  'quranic.night_journey':
    'Το ταξίδι αρχίζει τη νύχτα, περνά από ιερή οριζόντια μετακίνηση και συνεχίζει με κάθετη ανάβαση μέσα από διατεταγμένους ουρανούς. Οι συναντήσεις και η διδασκαλία ολοκληρώνονται πριν από την επιστροφή στον συνηθισμένο κόσμο.',
  'german.sleeping_beauty':
    'Μια κατάρα οδηγεί μια νεαρή μορφή σε βαθύ ύπνο και ολόκληρος ο τόπος παγώνει γύρω της. Όταν περάσει ο ορισμένος χρόνος, η απομόνωση λύνει, ο ύπνος σπάει και η ζωή επιστρέφει.',
  'german.six_swans':
    'Έξι αδέλφια μεταμορφώνονται σε κύκνους και μόνο η αδελφή τους μπορεί να τους λυτρώσει. Η σωτηρία τους απαιτεί μακρά σιωπή, επίπονη εργασία και μια λύση που μένει για λίγο ατελής.',
  'japanese.izanagi_izanami':
    'Ο Ιζανάγκι κατεβαίνει στο Γιόμι για να ξαναβρεί την Ιζανάμι μετά τον θάνατό της. Όταν σπάει την υπόσχεση να μην την κοιτάξει, ακολουθούν τρόμος, καταδίωξη, σφράγισμα του ορίου και καθαρμός.',
};

function collapseWhitespace(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

function uppercaseFirstVisibleCharacter(value: string): string {
  const text = collapseWhitespace(value);
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function ensureTerminalPunctuation(value: string): string {
  const text = uppercaseFirstVisibleCharacter(value);
  if (!text) return '';
  return /[.!;:;…?]$/u.test(text) ? text : `${text}.`;
}

function formatUserFacingLine(value: string): string {
  return ensureTerminalPunctuation(value);
}

function toSentenceCase(value: string): string {
  const text = collapseWhitespace(value);
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function lowerCaseLeadingCharacter(value: string): string {
  const text = collapseWhitespace(value);
  if (!text) return '';
  return text.charAt(0).toLowerCase() + text.slice(1);
}

function startsWithAny(value: string, prefixes: string[]): boolean {
  const normalized = collapseWhitespace(value).toLowerCase();
  return prefixes.some((prefix) => normalized.startsWith(prefix.toLowerCase()));
}

function buildMythComparisonParagraph(
  targetLanguage: EchoPresentationLanguage,
  resonance: string,
  divergence: string
): string {
  const normalizedResonance = ensureTerminalPunctuation(resonance);
  if (!normalizedResonance) return '';

  const normalizedDivergence = ensureTerminalPunctuation(divergence);
  const resonanceLead =
    targetLanguage === 'el'
      ? startsWithAny(normalizedResonance, ['στο όνειρό σου', 'στο όνειρο'])
        ? normalizedResonance
        : `Στο όνειρό σου, ${lowerCaseLeadingCharacter(normalizedResonance)}`
      : startsWithAny(normalizedResonance, ['in your dream', 'within your dream'])
        ? normalizedResonance
        : `In your dream, ${lowerCaseLeadingCharacter(normalizedResonance)}`;

  if (!normalizedDivergence) return resonanceLead;

  const divergenceLead =
    targetLanguage === 'el'
      ? startsWithAny(normalizedDivergence, ['ωστόσο', 'όμως', 'παρ’ όλα αυτά', 'παρ ολα αυτα'])
        ? normalizedDivergence
        : `Ωστόσο, ${lowerCaseLeadingCharacter(normalizedDivergence)}`
      : startsWithAny(normalizedDivergence, ['here, however', 'however', 'but here', 'here '])
        ? normalizedDivergence
        : `Here, however, ${lowerCaseLeadingCharacter(normalizedDivergence)}`;

  return `${resonanceLead} ${divergenceLead}`.trim();
}

export function buildMythSynopsisCacheKey(params: {
  mythCatalogVersion: string;
  catalogId: string;
  targetLanguage: EchoPresentationLanguage;
}): string {
  return `${params.mythCatalogVersion}:${params.catalogId}:${params.targetLanguage}`;
}

function naturalizeEnglishSynopsis(coreSynopsis: string): string | null {
  const clauses = coreSynopsis
    .split(';')
    .map(collapseWhitespace)
    .filter(Boolean);
  if (clauses.length === 0) return null;
  if (clauses.length === 1) {
    return ensureTerminalPunctuation(clauses[0]);
  }
  const midpoint = Math.ceil(clauses.length / 2);
  const first = `${uppercaseFirstVisibleCharacter(clauses.slice(0, midpoint).join(', '))}.`;
  const second = `${uppercaseFirstVisibleCharacter(clauses.slice(midpoint).join(', '))}.`;
  return [first, second].join(' ');
}

function localizeGreekTraditionLabel(tradition: string): string {
  return GREEK_TRADITION_LABELS[tradition] ?? tradition;
}

export function localizeTraditionLabel(
  tradition: string,
  targetLanguage: EchoPresentationLanguage
): string {
  const trimmed = collapseWhitespace(tradition);
  if (!trimmed) return '';
  if (targetLanguage === 'el') return localizeGreekTraditionLabel(trimmed);
  return trimmed;
}

export function localizeCatalogSynopsis(
  input: MythSynopsisLocalizationInput
): string | null {
  const key = buildMythSynopsisCacheKey({
    mythCatalogVersion: input.mythCatalogVersion,
    catalogId: input.catalogId,
    targetLanguage: input.targetLanguage,
  });
  const cached = mythSynopsisCache.get(key);
  if (cached) return cached;

  const localized = catalogSynopsisTranslator.translate(input);

  if (!localized) return null;
  const normalized = ensureTerminalPunctuation(localized);
  mythSynopsisCache.set(key, normalized);
  return normalized;
}

export function translateCatalogSynopsisDeterministically(
  input: Pick<
    MythSynopsisLocalizationInput,
    'catalogId' | 'canonicalTitle' | 'coreSynopsis' | 'targetLanguage'
  >
): string | null {
  if (input.targetLanguage === 'el') {
    return GREEK_SYNOPSIS_BY_CATALOG_ID[input.catalogId] ?? null;
  }
  return naturalizeEnglishSynopsis(input.coreSynopsis);
}

export const catalogSynopsisTranslator = {
  translate: translateCatalogSynopsisDeterministically,
};

export function clearEchoPresentationCaches(): void {
  mythSynopsisCache.clear();
}

export function resolveEchoPresentationLanguage(dreamText: string): EchoPresentationLanguage {
  return resolveDreamOutputLanguage(dreamText).code;
}

export function formatArchetypalEchoesForDreamDetail(
  raw: unknown,
  dreamText: string,
  max: number = 2
): EchoDisplayCard[] {
  return normalizeArchetypalEchoes(raw, max)
    .filter((echo) => echo.canonical_label !== 'Ego')
    .map((echo: ArchetypalEcho) => {
      const title = getArchetypeDisplayLabel(echo.canonical_label);
      const body = echo.resonance
        ? formatUserFacingLine(echo.resonance)
        : echo.expression
          ? formatUserFacingLine(echo.expression)
          : '';
      return {
        title,
        body,
      };
    })
    .filter((card) => card.body.trim().length > 0);
}

export function formatMythicEchoesForDreamDetail(
  raw: unknown,
  dreamText: string,
  max: number = 1
): EchoDisplayCard[] {
  const targetLanguage = resolveEchoPresentationLanguage(dreamText);

  return normalizeAmplifications(raw, max)
    .map((item: MythicEcho) => {
      const entry = item.catalog_id ? getMythicCatalogEntry(item.catalog_id) : null;
      const synopsisSource =
        item.catalog_id && mythCatalogJson.entries
          ? mythCatalogJson.entries.find((candidate) => candidate.id === item.catalog_id) ?? null
          : null;
      const title = collapseWhitespace(entry?.canonical_title ?? item.title ?? '') || 'Mythic echo';
      const subtitle = localizeTraditionLabel(
        entry?.tradition_display ?? item.tradition ?? '',
        targetLanguage
      );
      const synopsis =
        entry && item.catalog_id && synopsisSource?.core_synopsis
          ? localizeCatalogSynopsis({
              mythCatalogVersion:
                collapseWhitespace(item.catalog_myth_version ?? '') || MYTHIC_CATALOG_VERSION,
              catalogId: item.catalog_id,
              canonicalTitle: entry.canonical_title,
              coreSynopsis: synopsisSource.core_synopsis,
              targetLanguage,
            })
          : null;
      const comparisonParagraph = buildMythComparisonParagraph(
        targetLanguage,
        item.resonance,
        item.divergence
      );
      const sections = [synopsis, comparisonParagraph].filter(Boolean);

      return {
        title,
        ...(subtitle ? { subtitle } : {}),
        body: sections.join('\n\n'),
      };
    })
    .filter((card) => card.body.trim().length > 0);
}

export const __testing = {
  naturalizeEnglishSynopsis,
  formatUserFacingLine,
  mythSynopsisCache,
  localizeGreekTraditionLabel,
  GREEK_SYNOPSIS_BY_CATALOG_ID,
  buildMythComparisonParagraph,
  toSentenceCase,
  lowerCaseLeadingCharacter,
};
