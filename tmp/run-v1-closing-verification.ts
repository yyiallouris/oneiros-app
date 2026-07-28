import { execSync } from 'child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import {
  buildDreamExtractionSystemPrompt,
  buildDreamExtractionUserPrompt,
  DREAM_EXTRACTION_PROMPT_ID,
  DREAM_EXTRACTION_PROMPT_VERSION,
  DREAM_EXTRACTION_SCHEMA_VERSION,
  DREAM_EXTRACTION_TEMPERATURE,
  DREAM_EXTRACTION_TOKEN_LIMIT,
} from '../src/ai/dreamExtractionPrompt';
import { buildDreamExtractionResponseFormat } from '../src/ai/dreamExtractionResponseFormat';
import {
  buildLanguageRepairMessages,
  evaluateDreamExtractionOutputLanguage,
  resolveDreamOutputLanguage,
  type DreamOutputLanguage,
} from '../src/ai/dreamOutputLanguage';
import { estimateAiCallCost } from '../src/billing/aiPricing';
import { buildEchoBenchmarkStages } from '../scripts/lib/echoBenchmarkStages';

type DreamFixture = {
  id: string;
  label: string;
  dream: string;
  dreamLanguage: 'el' | 'en';
  kind: 'smoke' | 'reviewed';
  smokeExpectation?: 'tension' | 'empty' | 'language_only';
};

type MythCatalogEntry = {
  id: string;
  canonical_title: string;
  tradition_display: string;
  core_synopsis: string;
};

type LocalizationResult = {
  source: string;
  localized: string | null;
  usedCache: boolean;
  helperCallMade: boolean;
  ok: boolean;
  fallbackReason: string | null;
};

type RunArtifact = {
  fixture: DreamFixture;
  runId: string;
  cacheBust: string;
  latencyMs: number;
  model: string | null;
  provider: string | null;
  estimatedUsd: number | null;
  content: string;
  rawParsed: Record<string, unknown>;
  post: ReturnType<typeof buildEchoBenchmarkStages>;
  extractionLanguageGate: ReturnType<typeof evaluateDreamExtractionOutputLanguage>;
};

type RenderedArchetype = {
  title: string;
  copy: string;
  characterCount: number;
  approxLineCount: number;
  duplicationNotes: string[];
};

type RenderedMyth = {
  title: string;
  tradition: string;
  sourceSynopsis: string;
  localizedSynopsis: string | null;
  localization: LocalizationResult;
  copy: string;
  characterCount: number;
  approxLineCount: number;
  duplicationNotes: string[];
};

const APPROX_CARD_CHARS_PER_LINE = 42;

const SMOKE_FIXTURES: DreamFixture[] = [
  {
    id: 'smoke_el_tension_persona_stage',
    label: 'Greek smoke — staged tension',
    dreamLanguage: 'el',
    kind: 'smoke',
    smokeExpectation: 'tension',
    dream:
      'Ήμουν σε ένα μεγάλο θέατρο όπου όλοι περίμεναν να παρουσιάσω τα οικονομικά μιας εταιρείας. Πριν βγω στη σκηνή, μου φόρεσαν μια τέλεια σκούρα στολή με το όνομά μου κεντημένο στο στήθος. Μόλις στάθηκα μπροστά στο κοινό, η φωνή μου έγινε ψυχρή και επίσημη, παρότι μέσα μου ήθελα να πω ότι δεν γνώριζα τις απαντήσεις. Κάθε φορά που προσπαθούσα να μιλήσω με τη δική μου φωνή, ο γιακάς έσφιγγε και το κοινό σταματούσε να με βλέπει. Όταν επέστρεψα στα παρασκήνια, προσπάθησα να βγάλω τη στολή, αλλά τα μανίκια είχαν κολλήσει πάνω μου. Ξύπνησα την ώρα που έσκιζα προσεκτικά μία ραφή για να μπορέσω να αναπνεύσω.',
  },
  {
    id: 'smoke_el_empty_ordinary_kitchen',
    label: 'Greek smoke — no real opposition',
    dreamLanguage: 'el',
    kind: 'smoke',
    smokeExpectation: 'empty',
    dream:
      'Ήμουν στην κουζίνα μου και ήθελα να πιω νερό. Άνοιξα το ντουλάπι, αλλά όλα τα ποτήρια ήταν άπλυτα. Πήρα το λιγότερο βρώμικο, το έπλυνα με σαπούνι, το ξέβγαλα δύο φορές και το γέμισα από τη βρύση. Η γάτα πέρασε από τον πάγκο και έριξε ένα κουταλάκι στο πάτωμα. Το σήκωσα, ήπια το νερό και ξύπνησα ελαφρώς εκνευρισμένος επειδή θυμήθηκα ότι είχα αφήσει πιάτα στον νεροχύτη.',
  },
  {
    id: 'smoke_en_language_bus_stop',
    label: 'English smoke — no mixed-language leakage',
    dreamLanguage: 'en',
    kind: 'smoke',
    smokeExpectation: 'language_only',
    dream:
      'Someone I lost finds me at a bus stop in light rain. We stand close without speaking. The bus arrives but neither of us boards.',
  },
];

const REVIEWED_FIXTURES: DreamFixture[] = [
  {
    id: 'myth_regression_orpheus_theatre',
    label: 'Underground theatre / lost beloved',
    dreamLanguage: 'el',
    kind: 'reviewed',
    dream: `Βρισκόμουν σε ένα παλιό υπόγειο θέατρο κάτω από την πόλη. Η αίθουσα ήταν άδεια, αλλά πάνω στη σκηνή υπήρχε ένα πιάνο που έπαιζε μόνο του. Κάθε νότα άνοιγε για λίγο μια ρωγμή στο πάτωμα και μέσα από τη ρωγμή έβγαινε κρύος αέρας.

Ήξερα ότι κάτω από τη σκηνή βρισκόταν μια γυναίκα που αγαπούσα και την οποία είχα χάσει πριν από πολύ καιρό. Δεν θυμόμουν το πρόσωπό της, αλλά αναγνώριζα τη φωνή της. Με καλούσε από κάτω και μου έλεγε ότι δεν μπορούσε να βρει μόνη της τον δρόμο προς τα πάνω.

Πλησίασα το πιάνο. Παρόλο που δεν ήξερα να παίζω, τα χέρια μου άρχισαν να κινούνται μόνα τους. Όσο έπαιζα, η ρωγμή άνοιγε περισσότερο, μέχρι που εμφανίστηκε μια πέτρινη σκάλα.

Κατέβηκα κρατώντας ένα μικρό φανάρι. Στο τέλος της σκάλας υπήρχε ένας υπόγειος ποταμός. Στην όχθη με περίμενε ένας ηλικιωμένος άντρας μέσα σε μια μαύρη βάρκα. Το πρόσωπό του ήταν κρυμμένο κάτω από μια κουκούλα.

Μου είπε ότι μπορούσε να με περάσει απέναντι, αλλά στην επιστροφή έπρεπε να ακολουθήσω έναν κανόνα: η γυναίκα θα περπατούσε πίσω μου και δεν έπρεπε να γυρίσω να τη δω μέχρι να ακουμπήσω το φως της επιφάνειας. Ακόμη κι αν με φώναζε, ακόμη κι αν έπεφτε, έπρεπε να συνεχίσω.

Περάσαμε τον ποταμό. Στην άλλη πλευρά υπήρχε ένας κήπος χωρίς χρώμα. Τα δέντρα ήταν γκρίζα και στα κλαδιά τους κρέμονταν άδεια μουσικά όργανα.

Βρήκα τη γυναίκα καθισμένη κάτω από ένα δέντρο. Φορούσε ένα λευκό φόρεμα, αλλά το πρόσωπό της ήταν σκεπασμένο με χώμα. Όταν άγγιξα το χέρι της, άνοιξε τα μάτια της και όλα τα όργανα του κήπου έβγαλαν μαζί μία μοναδική νότα.

Αρχίσαμε να επιστρέφουμε. Εκείνη περπατούσε πίσω μου, χωρίς να με αγγίζει. Στην αρχή άκουγα μόνο τα βήματά της. Έπειτα άρχισε να ψιθυρίζει το όνομά μου. Μου έλεγε ότι φοβόταν, ότι δεν μπορούσε να αναπνεύσει και ότι κάτι την τραβούσε πίσω.

Συνέχισα να ανεβαίνω χωρίς να κοιτάζω. Όταν πλησιάσαμε την κορυφή, είδα μπροστά μου το πρώτο φως της ημέρας. Τότε άκουσα τη γυναίκα να πέφτει και να με φωνάζει με ένα όνομα που μόνο εκείνη γνώριζε.

Γύρισα.

Την είδα λίγα σκαλιά πιο κάτω. Το μισό σώμα της ήταν ζωντανό και το άλλο μισό είχε γίνει πέτρα. Άπλωσε το χέρι της προς εμένα, αλλά το σκοτάδι άνοιξε πίσω της και την τράβηξε μέσα.

Προσπάθησα να την κρατήσω, όμως στο χέρι μου έμεινε μόνο μια λεπτή χρυσή χορδή.

Βγήκα μόνος στη σκηνή. Το πιάνο είχε σταματήσει. Έδεσα τη χρυσή χορδή σε μία σπασμένη χορδή του πιάνου και πάτησα ένα πλήκτρο.

Από κάτω ακούστηκε ξανά η φωνή της, αλλά αυτή τη φορά δεν ζητούσε να επιστρέψω. Τραγουδούσε.

Ξύπνησα με την αίσθηση ότι είχα χάσει κάτι δεύτερη φορά, αλλά ότι η φωνή του είχε μείνει μαζί μου.`,
  },
  {
    id: 'negative_apartment_bus',
    label: 'Expanding apartment / route-less bus',
    dreamLanguage: 'el',
    kind: 'reviewed',
    dream: `Βρισκόμουν σε ένα διαμέρισμα που είχα μόλις νοικιάσει. Ήταν μεγαλύτερο απ’ όσο θυμόμουν, και κάθε φορά που άνοιγα μια πόρτα ανακάλυπτα ακόμη ένα δωμάτιο.

Στο πρώτο δωμάτιο υπήρχαν κουτιά με παλιά βιβλία. Στο δεύτερο υπήρχε ένα τραπέζι στρωμένο για τέσσερα άτομα, παρόλο που ήμουν μόνος. Στο τρίτο υπήρχαν δεκάδες φυτά που είχαν ξεραθεί επειδή κανείς δεν τα είχε ποτίσει.

Άκουγα τον γείτονα από πάνω να μετακινεί συνεχώς έπιπλα. Προσπάθησα να κοιμηθώ, αλλά κάθε φορά που έκλεινα τα μάτια μου ακουγόταν ένα τηλέφωνο να χτυπά σε κάποιο άλλο δωμάτιο.

Έψαχνα να το βρω, όμως το κουδούνισμα άλλαζε θέση. Κάποια στιγμή βρήκα ένα παλιό σταθερό τηλέφωνο μέσα σε μια ντουλάπα. Όταν απάντησα, άκουσα τη δική μου φωνή να μου λέει ότι είχα ξεχάσει να κλειδώσω την εξώπορτα.

Πήγα στην είσοδο και είδα ότι η πόρτα ήταν πράγματι ανοιχτή. Έξω δεν υπήρχε ο διάδρομος της πολυκατοικίας αλλά ο δρόμος όπου έμενα παιδί. Έβρεχε και ένα λεωφορείο περίμενε με ανοιχτές πόρτες.

Ο οδηγός με ρώτησε αν θα ανέβαινα. Του είπα ότι δεν ήξερα πού πήγαινε. Μου απάντησε ότι ούτε εκείνος ήξερε ακόμη, επειδή κανείς δεν είχε επιλέξει τη διαδρομή.

Γύρισα μέσα για να πάρω ένα παλτό. Όταν επέστρεψα, το λεωφορείο είχε φύγει. Στο πεζοδρόμιο είχε μείνει μόνο μια κίτρινη ομπρέλα.

Την άνοιξα και αμέσως σταμάτησε να βρέχει, αλλά μόνο στον μικρό κύκλο γύρω μου. Όλος ο υπόλοιπος δρόμος συνέχιζε να βρέχεται.

Ξύπνησα καθώς προσπαθούσα να αποφασίσω αν θα επέστρεφα στο διαμέρισμα ή αν θα περπατούσα μόνος μου προς την άγνωστη κατεύθυνση του λεωφορείου.`,
  },
  {
    id: 'myth_regression_persephone_child',
    label: 'Underground child / divided spring',
    dreamLanguage: 'el',
    kind: 'reviewed',
    dream: `Βρισκόμουν σε έναν μεγάλο κήπο στο τέλος του χειμώνα. Όλα τα δέντρα ήταν γυμνά, όμως το χώμα ήταν γεμάτο μικρά πράσινα φύλλα που μόλις είχαν αρχίσει να βγαίνουν.

Στο κέντρο του κήπου υπήρχε ένα παλιό πέτρινο σπίτι. Η πόρτα ήταν τόσο χαμηλή που έπρεπε να σκύψω για να μπω.

Μέσα καθόταν μια ηλικιωμένη γυναίκα μπροστά σε έναν σβηστό φούρνο. Φορούσε ένα μαύρο φόρεμα και καθάριζε σπόρους από χώμα και μικρές πέτρες. Δεν με κοίταξε όταν μπήκα.

Μου είπε:

«Άργησες. Το παιδί έχει ήδη αρχίσει να ξεχνά το όνομά του.»

Τη ρώτησα ποιο παιδί εννοούσε. Έδειξε μια ξύλινη πόρτα στο πάτωμα.

Όταν την άνοιξα, είδα μια στενή σκάλα που κατέβαινε κάτω από το σπίτι. Η γυναίκα μου έδωσε ένα πήλινο μπολ γεμάτο σπόρους και μου είπε να μην αφήσω κανέναν να τους φάει.

Κατέβηκα.

Στο τέλος της σκάλας υπήρχε μια τεράστια υπόγεια αίθουσα. Από την οροφή κρέμονταν ρίζες, και ανάμεσά τους πετούσαν λευκά πουλιά χωρίς μάτια.

Στο βάθος καθόταν ένα μικρό παιδί πάνω σε έναν θρόνο φτιαγμένο από χώμα. Δεν μπορούσα να καταλάβω αν ήταν αγόρι ή κορίτσι. Φορούσε ένα στεφάνι από ξερά κλαδιά και κρατούσε στα χέρια του ένα κόκκινο μήλο.

Όταν πλησίασα, μου είπε:

«Ήρθες να με πάρεις ή να με κρατήσεις εδώ;»

Του απάντησα ότι είχα έρθει για να το οδηγήσω έξω. Το παιδί γέλασε και δάγκωσε το μήλο.

Αμέσως οι ρίζες άρχισαν να κινούνται και να τυλίγονται γύρω από τα πόδια του. Τα λευκά πουλιά κατέβηκαν προς το μπολ που κρατούσα και προσπάθησαν να φάνε τους σπόρους.

Έκλεισα το μπολ στο στήθος μου και άρχισα να τραβάω το παιδί από τον θρόνο. Ήταν πολύ πιο βαρύ απ’ όσο φαινόταν, σαν να ήταν γεμάτο πέτρες.

Τότε άκουσα τη φωνή της ηλικιωμένης γυναίκας να έρχεται από παντού:

«Δεν μπορείς να το ανεβάσεις ολόκληρο. Κάτι πρέπει να μείνει κάτω.»

Ρώτησα το παιδί τι έπρεπε να αφήσει πίσω.

Εκείνο έβγαλε το στεφάνι από το κεφάλι του και το ακούμπησε στον θρόνο. Μόλις το έκανε, οι ρίζες χαλάρωσαν.

Αρχίσαμε να ανεβαίνουμε τη σκάλα. Σε κάθε σκαλοπάτι το παιδί γινόταν λίγο μικρότερο. Όταν φτάσαμε στην ξύλινη πόρτα, είχε γίνει βρέφος και κοιμόταν μέσα στα χέρια μου.

Η ηλικιωμένη γυναίκα περίμενε δίπλα στον φούρνο. Πήρε το μπολ με τους σπόρους, τους έριξε μέσα στον σβηστό φούρνο και φύσηξε πάνω τους.

Μια μικρή φωτιά άναψε.

Έξω από το σπίτι, τα γυμνά δέντρα άρχισαν να ανθίζουν, αλλά μόνο στη μία πλευρά του κήπου. Η άλλη πλευρά παρέμεινε χειμωνιάτικη και σκοτεινή.

Τη ρώτησα γιατί δεν είχε έρθει η άνοιξη παντού.

Μου απάντησε:

«Επειδή το παιδί επέστρεψε, αλλά θυμάται ακόμη τον δρόμο προς τα κάτω.»

Κοίταξα το βρέφος. Τα μάτια του ήταν ανοιχτά και μέσα στις κόρες του φαινόταν η υπόγεια αίθουσα.

Ξύπνησα κρατώντας τα χέρια μου σαν να κουβαλούσα ακόμη κάτι μικρό και βαρύ.`,
  },
  {
    id: 'myth_regression_tower_voice',
    label: 'Tower / lost name / collective song',
    dreamLanguage: 'el',
    kind: 'reviewed',
    dream: `Βρισκόμουν σε μια πόλη χτισμένη πάνω σε τεράστιες ξύλινες γέφυρες. Κάτω από τις γέφυρες δεν υπήρχε γη, μόνο ένα βαθύ σύννεφο που κινούνταν αργά σαν θάλασσα.

Όλοι οι κάτοικοι φορούσαν μικρά γυάλινα κουδούνια δεμένα στον λαιμό τους. Όταν μιλούσαν, τα κουδούνια χτυπούσαν, αλλά από τα στόματά τους δεν έβγαινε φωνή.

Εγώ δεν φορούσα κουδούνι. Προσπαθούσα να ρωτήσω πού βρισκόμουν, όμως κανείς δεν με κοιτούσε. Συνέχιζαν να περπατούν προς έναν ψηλό πύργο στο κέντρο της πόλης.

Ακολούθησα το πλήθος.

Στην είσοδο του πύργου στεκόταν μια γυναίκα με κόκκινο μανδύα. Το πρόσωπό της ήταν κρυμμένο πίσω από μια χρυσή μάσκα που είχε δύο διαφορετικά μάτια: το ένα ανοιχτό και το άλλο κλειστό.

Μου ζήτησε να της δώσω το όνομά μου.

Όταν της το είπα, άνοιξε ένα μεγάλο βιβλίο, αλλά στις σελίδες του δεν υπήρχαν λέξεις. Υπήρχαν μόνο μικρές ζωγραφιές από πράγματα που θυμόμουν: το παιδικό μου κρεβάτι, ένα σκυλί που είχα χάσει, το χέρι της μητέρας μου, μια πόρτα που δεν είχα ανοίξει ποτέ.

Η γυναίκα μου είπε:

«Το όνομά σου δεν βρίσκεται εδώ. Βρίσκεται στην κορυφή, αλλά για να το πάρεις πρέπει να ανέβεις χωρίς να χρησιμοποιήσεις τη φωνή σου.»

Άρχισα να ανεβαίνω μια κυκλική σκάλα.

Σε κάθε όροφο υπήρχε ένα δωμάτιο γεμάτο ανθρώπους που έμοιαζαν να με γνωρίζουν. Άλλοι με κατηγορούσαν, άλλοι με παρακαλούσαν να μείνω, άλλοι μου έλεγαν ότι είχα ήδη φτάσει και δεν χρειαζόταν να συνεχίσω.

Δεν μπορούσα να τους απαντήσω. Κάθε φορά που προσπαθούσα, ένιωθα κάτι σκληρό να σχηματίζεται μέσα στον λαιμό μου.

Στον τελευταίο όροφο βρήκα ένα παιδί καθισμένο μπροστά σε ένα παράθυρο. Κρατούσε στα χέρια του ένα μικρό ξύλινο πουλί χωρίς φτερά.

Το παιδί με κοίταξε και είπε:

«Άργησες τόσο πολύ που το όνομά σου έμαθε να ζει χωρίς εσένα.»

Του ζήτησα να μου το δώσει.

Εκείνο έδειξε το παράθυρο. Έξω, πάνω από το σύννεφο, πετούσε ένα τεράστιο λευκό πουλί. Από το ράμφος του κρεμόταν μια μακριά μαύρη κορδέλα, και πάνω στην κορδέλα ήταν γραμμένο το όνομά μου.

Το παιδί μου έδωσε το ξύλινο πουλί και είπε ότι για να καλέσω το μεγάλο πουλί κοντά έπρεπε να τραγουδήσω.

Του είπα ότι η γυναίκα στην είσοδο μού είχε απαγορεύσει να χρησιμοποιήσω τη φωνή μου.

Το παιδί απάντησε:

«Σου απαγόρευσε να μιλήσεις. Δεν σου απαγόρευσε να τραγουδήσεις.»

Άρχισα να τραγουδώ, χωρίς να γνωρίζω το τραγούδι.

Το σκληρό πράγμα μέσα στον λαιμό μου έσπασε και έπεσε στο πάτωμα σαν μικρή πέτρα. Το λευκό πουλί πλησίασε το παράθυρο και άφησε τη μαύρη κορδέλα μέσα στα χέρια μου.

Μόλις διάβασα το όνομά μου, όλες οι γυάλινες καμπάνες στην πόλη έσπασαν ταυτόχρονα.

Οι κάτοικοι άρχισαν να φωνάζουν. Στην αρχή οι φωνές τους ακούγονταν σαν κραυγές φόβου, έπειτα όμως μετατράπηκαν σε τραγούδι.

Κοίταξα ξανά το παιδί, αλλά είχε εξαφανιστεί. Στη θέση του υπήρχε μόνο ένα ανοιχτό παράθυρο και το ξύλινο πουλί είχε αποκτήσει δύο μικρά φτερά.

Κατέβηκα στον δρόμο κρατώντας την κορδέλα με το όνομά μου.

Η γυναίκα με τη χρυσή μάσκα περίμενε ακόμη στην είσοδο. Έβγαλε τη μάσκα της, αλλά από κάτω δεν υπήρχε πρόσωπο — μόνο ένας καθρέφτης.

Όταν κοίταξα μέσα, δεν είδα τον εαυτό μου. Είδα το παιδί να πετά πάνω από την πόλη κρατώντας το ξύλινο πουλί.

Ξύπνησα με την αίσθηση ότι είχα ξαναβρεί κάτι που δεν ήξερα ότι μου είχε αφαιρεθεί.`,
  },
  {
    id: 'myth_regression_devouring_father_lion',
    label: 'Father / crown / chained lion',
    dreamLanguage: 'el',
    kind: 'reviewed',
    dream: `Βρισκόμουν σε ένα μεγάλο παλάτι χτισμένο μέσα σε έναν γκρεμό. Τα δωμάτια ήταν λαξευμένα στην πέτρα και από τα παράθυρα φαινόταν μόνο θάλασσα.

Φορούσα μια βαριά χρυσή κορώνα, παρόλο που δεν θυμόμουν να είμαι βασιλιάς. Κάθε φορά που προσπαθούσα να τη βγάλω, τα δάχτυλά μου πάγωναν.

Οι υπηρέτες του παλατιού δεν είχαν πρόσωπα. Αντί για μάτια και στόμα, είχαν λείες ασημένιες επιφάνειες που αντανακλούσαν το δωμάτιο.

Με οδηγούσαν προς μια αίθουσα όπου γινόταν γιορτή. Στο κέντρο υπήρχε ένα τεράστιο τραπέζι γεμάτο φαγητά, αλλά όλα ήταν φτιαγμένα από κερί.

Στην άκρη του τραπεζιού καθόταν ο πατέρας μου. Ήταν πολύ νεότερος απ’ όσο τον θυμόμουν και φορούσε την ίδια κορώνα με εμένα.

Μου είπε:

«Κάθισε. Η θέση σου ήταν πάντα εδώ.»

Τον ρώτησα ποιοι ήταν όλοι αυτοί οι άνθρωποι. Μου απάντησε ότι ήταν όσοι είχαν υπακούσει πριν από εμένα.

Όταν κάθισα, οι υπηρέτες έφεραν ένα ασημένιο πιάτο. Πάνω του υπήρχε η καρδιά ενός μικρού λιονταριού, που ακόμη χτυπούσε.

Ο πατέρας μου μου έδωσε ένα μαχαίρι και είπε:

«Φάε την και δεν θα φοβηθείς ποτέ ξανά.»

Δεν ήθελα να την αγγίξω, αλλά όλοι γύρω από το τραπέζι άρχισαν να χτυπούν ρυθμικά τα χέρια τους.

Τότε άκουσα ένα ξύσιμο κάτω από το πάτωμα.

Σηκώθηκα και ακολούθησα τον ήχο μέχρι μια κλειδωμένη πόρτα πίσω από τον θρόνο. Ο πατέρας μου φώναξε να μην την ανοίξω.

Έσπασα την κλειδαριά με το μαχαίρι.

Πίσω από την πόρτα υπήρχε μια στενή σκάλα που κατέβαινε μέσα στον βράχο. Στο τέλος της βρήκα ένα μικρό λιοντάρι δεμένο με αλυσίδα.

Ήταν το ίδιο ζώο του οποίου η καρδιά βρισκόταν στο πιάτο, αλλά εδώ ήταν ζωντανό. Το σώμα του ήταν γεμάτο πληγές και τα μάτια του είχαν το χρώμα της φωτιάς.

Όταν πλησίασα, μου είπε με ανθρώπινη φωνή:

«Δεν μπορείς να φας το θάρρος σου. Πρέπει να με ελευθερώσεις.»

Προσπάθησα να σπάσω την αλυσίδα, αλλά κάθε κρίκος είχε χαραγμένο πάνω του ένα διαφορετικό όνομα της οικογένειάς μου.

Από πάνω ακούστηκε η φωνή του πατέρα μου:

«Αν το λύσεις, το παλάτι θα πέσει.»

Το λιοντάρι με κοίταξε και είπε:

«Αν δεν το λύσεις, θα μείνεις βασιλιάς σε ένα σπίτι χωρίς ζωή.»

Έβαλα την κορώνα γύρω από την αλυσίδα και την πίεσα μέχρι που λύγισε. Η κορώνα έσπασε στα δύο και η αλυσίδα άνοιξε.

Το λιοντάρι ανέβηκε τρέχοντας τη σκάλα. Όταν φτάσαμε στην αίθουσα, όλα τα κέρινα φαγητά είχαν αρχίσει να λιώνουν.

Ο πατέρας μου σηκώθηκε και για πρώτη φορά φάνηκε φοβισμένος.

Το λιοντάρι στάθηκε ανάμεσά μας. Δεν του επιτέθηκε. Μόνο βρυχήθηκε.

Ο ήχος έκανε τις ασημένιες επιφάνειες στα πρόσωπα των υπηρετών να ραγίσουν. Από κάτω εμφανίστηκαν κανονικά ανθρώπινα πρόσωπα, κουρασμένα και τρομαγμένα.

Το παλάτι άρχισε να τρέμει. Οι τοίχοι έσπασαν και μέσα από τις ρωγμές μπήκε θαλασσινό νερό.

Ο πατέρας μου μου άπλωσε το χέρι και είπε:

«Βοήθησέ με να κρατήσουμε το παλάτι όρθιο.»

Για μια στιγμή πήγα να τον πιάσω.

Τότε το λιοντάρι κατέβηκε προς τη θάλασσα και γύρισε να με κοιτάξει.

Άφησα το χέρι του πατέρα μου και το ακολούθησα.

Περπατήσαμε μέσα στο νερό ώσπου το παλάτι κατέρρευσε πίσω μας. Όταν γύρισα, είδα την κορώνα να επιπλέει στην επιφάνεια σαν άδειο χρυσό κέλυφος.

Το λιοντάρι μεγάλωσε ώσπου έγινε αρκετά μεγάλο για να ανέβω στη ράχη του.

Ξύπνησα καθώς με μετέφερε προς την ανοιχτή θάλασσα.`,
  },
];

function loadDotenvValue(key: string): string | undefined {
  const envPath = path.join(process.cwd(), '.env');
  if (!existsSync(envPath)) return undefined;
  const raw = readFileSync(envPath, 'utf8');
  const match = raw.match(new RegExp(`^${key}\\s*=\\s*(.*)$`, 'm'));
  if (!match) return undefined;
  return match[1].trim().replace(/^['"]|['"]$/g, '');
}

function getEnv(keys: string[]): string {
  for (const key of keys) {
    const value = process.env[key] ?? loadDotenvValue(key);
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
}

function parseJson(content: string): Record<string, unknown> {
  const trimmed = content.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fenced?.[1]?.trim() || trimmed;
  return JSON.parse(raw) as Record<string, unknown>;
}

function firstString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function safeJson(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

function approxLineCount(text: string): number {
  return Math.max(1, Math.ceil(text.length / APPROX_CARD_CHARS_PER_LINE));
}

function normalizeWords(text: string): string[] {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .map((word) => word.trim())
    .filter((word) => word.length >= 3);
}

function overlapRatio(a: string, b: string): number {
  const aWords = new Set(normalizeWords(a));
  const bWords = new Set(normalizeWords(b));
  if (aWords.size === 0 || bWords.size === 0) return 0;
  let intersection = 0;
  for (const word of aWords) {
    if (bWords.has(word)) intersection += 1;
  }
  return intersection / Math.min(aWords.size, bWords.size);
}

function detectDuplicationNotes(params: {
  title: string;
  expression?: string | null;
  resonance?: string | null;
  synopsis?: string | null;
  divergence?: string | null;
}): string[] {
  const notes: string[] = [];
  if (params.expression && params.resonance && overlapRatio(params.expression, params.resonance) >= 0.6) {
    notes.push('expression and resonance are unusually close in wording/content');
  }
  if (params.synopsis && params.resonance && overlapRatio(params.synopsis, params.resonance) >= 0.6) {
    notes.push('resonance restates too much of the myth synopsis');
  }
  if (params.synopsis && params.divergence && overlapRatio(params.synopsis, params.divergence) >= 0.5) {
    notes.push('divergence overlaps heavily with the synopsis instead of marking a difference');
  }
  if (params.resonance && /\b(είναι|είσαι|θα|must|definitely|certainly|proves)\b/i.test(params.resonance)) {
    notes.push('resonance may read as too assertive; check for overclaiming tone');
  }
  return notes;
}

function buildArchetypeCopy(row: Record<string, unknown>, language: DreamOutputLanguage): RenderedArchetype {
  const title = firstString(row.canonical_label) ?? '(missing archetype title)';
  const expression = firstString(row.expression) ?? '';
  const resonance = firstString(row.resonance) ?? '';
  const labels =
    language.code === 'el'
      ? { appear: 'Πώς εμφανίζεται', carries: 'Τι φέρνει στο όνειρο' }
      : { appear: 'How it appears', carries: 'What it carries' };
  const copy = [
    title,
    '',
    labels.appear,
    expression,
    '',
    labels.carries,
    resonance,
  ].join('\n');
  return {
    title,
    copy,
    characterCount: copy.length,
    approxLineCount: approxLineCount(copy),
    duplicationNotes: detectDuplicationNotes({ title, expression, resonance }),
  };
}

function buildMythCopy(params: {
  row: Record<string, unknown>;
  language: DreamOutputLanguage;
  sourceSynopsis: string;
  localizedSynopsis: string | null;
  localization: LocalizationResult;
}): RenderedMyth {
  const title = firstString(params.row.title) ?? firstString(params.row.canonical_title) ?? '(missing myth title)';
  const tradition = firstString(params.row.tradition) ?? '(missing tradition)';
  const resonance = firstString(params.row.resonance) ?? '';
  const divergence = firstString(params.row.divergence) ?? '';
  const labels =
    params.language.code === 'el'
      ? {
          myth: 'Ο μύθος',
          meets: 'Πού συναντά το όνειρό σου',
          differs: 'Πού διαφέρει',
        }
      : {
          myth: 'The myth',
          meets: 'Where it meets your dream',
          differs: 'Where it differs',
        };
  const sections = [title, tradition, ''];
  if (params.localizedSynopsis) {
    sections.push(labels.myth, params.localizedSynopsis, '');
  }
  sections.push(labels.meets, resonance);
  if (divergence) {
    sections.push('', labels.differs, divergence);
  }
  const copy = sections.join('\n');
  return {
    title,
    tradition,
    sourceSynopsis: params.sourceSynopsis,
    localizedSynopsis: params.localizedSynopsis,
    localization: params.localization,
    copy,
    characterCount: copy.length,
    approxLineCount: approxLineCount(copy),
    duplicationNotes: detectDuplicationNotes({
      title,
      resonance,
      synopsis: params.localizedSynopsis ?? params.sourceSynopsis,
      divergence,
    }),
  };
}

function evaluateTextLanguage(text: string, language: DreamOutputLanguage) {
  return evaluateDreamExtractionOutputLanguage(
    { symbols: [text] },
    language
  );
}

function loadProductionCatalogSnapshot(): {
  version: string;
  entriesById: Record<string, MythCatalogEntry>;
} {
  const versionTs = execSync(
    'git show HEAD:src/ai/catalogs/generated/mythicPromptIndex.v1.ts',
    { cwd: process.cwd(), encoding: 'utf8' }
  );
  const versionMatch = versionTs.match(/MYTHIC_CATALOG_VERSION = "([^"]+)"/);
  if (!versionMatch) throw new Error('Could not resolve production myth catalog version from HEAD');
  const catalogJson = execSync(
    'git show HEAD:src/ai/catalogs/mythic_narrative_catalog.v1.json',
    { cwd: process.cwd(), encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 }
  );
  const parsed = JSON.parse(catalogJson) as {
    version?: unknown;
    entries?: Array<Record<string, unknown>>;
  };
  const rows = Array.isArray(parsed.entries) ? parsed.entries : [];
  if (rows.length === 0) {
    throw new Error('Could not resolve production myth catalog entries from HEAD');
  }
  const entriesById: Record<string, MythCatalogEntry> = {};
  for (const row of rows) {
    const id = firstString(row.id);
    const canonical_title = firstString(row.canonical_title);
    const tradition_display = firstString(row.tradition_display);
    const core_synopsis = firstString(row.core_synopsis);
    if (!id || !canonical_title || !tradition_display || !core_synopsis) continue;
    entriesById[id] = {
      id,
      canonical_title,
      tradition_display,
      core_synopsis,
    };
  }
  return { version: versionMatch[1]!, entriesById };
}

async function main() {
  if (DREAM_EXTRACTION_TEMPERATURE !== 0) {
    throw new Error(`Expected temperature 0, got ${DREAM_EXTRACTION_TEMPERATURE}`);
  }

  const supabaseUrl = getEnv(['EXPO_PUBLIC_SUPABASE_URL', 'SUPABASE_URL']).replace(/\/$/, '');
  const anon = getEnv(['EXPO_PUBLIC_SUPABASE_ANON_KEY', 'SUPABASE_ANON_KEY']);
  const endpoint = getEnv(['EXPO_PUBLIC_CUSTOM_GPT_ENDPOINT', 'CUSTOM_GPT_ENDPOINT']);
  const email = getEnv(['LIVE_SUPABASE_EMAIL']);
  const password = getEnv(['LIVE_SUPABASE_PASSWORD']);
  let token = getEnv(['LIVE_SUPABASE_ACCESS_TOKEN', 'SUPABASE_ACCESS_TOKEN']);
  if (!supabaseUrl || !anon || !endpoint) throw new Error('Missing supabase/proxy env');
  if (!token) {
    if (!email || !password) throw new Error('Missing LIVE_SUPABASE_EMAIL/PASSWORD');
    const authRes = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: anon },
      body: JSON.stringify({ email, password }),
    });
    const text = await authRes.text();
    if (!authRes.ok) throw new Error(`auth failed ${authRes.status}: ${text.slice(0, 300)}`);
    token = (JSON.parse(text) as { access_token?: string }).access_token || '';
    if (!token) throw new Error('No access token returned from auth');
  }

  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outDir = path.join(process.cwd(), 'tmp', `v1-closing-verification-${stamp}`);
  mkdirSync(outDir, { recursive: true });

  const productionCatalog = loadProductionCatalogSnapshot();
  const synopsisCache = new Map<string, string>();
  const systemPrompt = buildDreamExtractionSystemPrompt();

  async function callProxy(payload: Record<string, unknown>) {
    const started = Date.now();
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: anon,
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    const text = await res.text();
    const latencyMs = Date.now() - started;
    if (!res.ok) throw new Error(`proxy ${res.status}: ${text.slice(0, 800)}`);
    const body = JSON.parse(text) as Record<string, unknown>;
    const content =
      (body.choices as Array<{ message?: { content?: string } }> | undefined)?.[0]?.message?.content ??
      (typeof body.content === 'string' ? body.content : '') ??
      (typeof body.text === 'string' ? body.text : '') ??
      '';
    const estimated =
      body.ai_call_cost && typeof body.ai_call_cost === 'object'
        ? (body.ai_call_cost as { estimatedUsd?: number })
        : estimateAiCallCost(body, typeof body.provider === 'string' ? body.provider : 'openai');
    return {
      body,
      content: String(content),
      latencyMs,
      estimatedUsd:
        estimated && typeof estimated === 'object' && typeof estimated.estimatedUsd === 'number'
          ? estimated.estimatedUsd
          : null,
      provider: firstString(body.provider),
      model: firstString(body.model),
    };
  }

  async function runExtraction(fixture: DreamFixture): Promise<RunArtifact> {
    const cacheBust = randomUUID();
    const userPrompt = `${buildDreamExtractionUserPrompt({
      title: fixture.label,
      date: '2026-07-28',
      content: fixture.dream,
      finalInterpretation: null,
      debugInterpretiveEchoes: false,
      dreamLanguage: fixture.dreamLanguage,
    })}\n\n[v1_closing_verification_run_id: ${cacheBust}]`;
    const response = await callProxy({
      task: 'dream_extraction',
      model: 'gpt-5.4-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: DREAM_EXTRACTION_TEMPERATURE,
      max_completion_tokens: DREAM_EXTRACTION_TOKEN_LIMIT,
      max_tokens: DREAM_EXTRACTION_TOKEN_LIMIT,
      response_format: buildDreamExtractionResponseFormat(),
    });
    const rawParsed = parseJson(response.content);
    const post = buildEchoBenchmarkStages(rawParsed, fixture.dream);
    const targetLanguage = resolveDreamOutputLanguage(fixture.dream, fixture.dreamLanguage);
    const extractionLanguageGate = evaluateDreamExtractionOutputLanguage(rawParsed, targetLanguage);
    return {
      fixture,
      runId: `${fixture.id}_r1`,
      cacheBust,
      latencyMs: response.latencyMs,
      model: response.model,
      provider: response.provider,
      estimatedUsd: response.estimatedUsd,
      content: response.content,
      rawParsed,
      post,
      extractionLanguageGate,
    };
  }

  async function localizeSynopsis(params: {
    catalogId: string;
    entry: MythCatalogEntry;
    targetLanguage: DreamOutputLanguage;
  }): Promise<LocalizationResult> {
    const source = params.entry.core_synopsis;
    if (params.targetLanguage.code === 'en') {
      return {
        source,
        localized: source,
        usedCache: false,
        helperCallMade: false,
        ok: true,
        fallbackReason: null,
      };
    }

    const cacheKey = [productionCatalog.version, params.catalogId, params.targetLanguage.code].join('::');
    const cached = synopsisCache.get(cacheKey);
    if (cached) {
      return {
        source,
        localized: cached,
        usedCache: true,
        helperCallMade: false,
        ok: true,
        fallbackReason: null,
      };
    }

    const messages = buildLanguageRepairMessages({
      target: params.targetLanguage,
      fieldsToRepair: {
        'catalog_synopsis.source': source,
      },
    });
    const system = `${messages[0]!.content}

CATALOG SYNOPSIS TRANSLATION CONTRACT
- You are translating canonical myth catalog synopsis text for presentation only.
- Treat the supplied catalog synopsis as the sole semantic source.
- Preserve every mythic actor, causal step, negation, condition, and qualification.
- Do not connect the synopsis to the dream.
- Do not add interpretation.
- Do not summarize, expand, or retell from memory.
- Return ONLY:
{"localized_synopsis":"..."}
- Non-empty string only.`;
    const user = `TARGET OUTPUT LANGUAGE: ${params.targetLanguage.name} (${params.targetLanguage.code})

catalog_id: ${params.catalogId}
canonical_title: ${params.entry.canonical_title}
tradition: ${params.entry.tradition_display}
source_core_synopsis: ${JSON.stringify(source)}

Return only JSON {"localized_synopsis":"..."} with a faithful translation.`;

    const response = await callProxy({
      task: 'interpretation_quick',
      model: 'gpt-5.4-mini',
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      temperature: 0,
      max_completion_tokens: 300,
      max_tokens: 300,
      response_format: { type: 'json_object' },
    });

    try {
      const parsed = parseJson(response.content);
      const localized = firstString(parsed.localized_synopsis);
      if (!localized) {
        return {
          source,
          localized: null,
          usedCache: false,
          helperCallMade: true,
          ok: false,
          fallbackReason: 'localization helper returned empty synopsis',
        };
      }
      const languageGate = evaluateTextLanguage(localized, params.targetLanguage);
      if (!languageGate.ok) {
        return {
          source,
          localized: null,
          usedCache: false,
          helperCallMade: true,
          ok: false,
          fallbackReason: `localized synopsis failed language gate (${languageGate.mismatched_field_paths.join(', ')})`,
        };
      }
      synopsisCache.set(cacheKey, localized);
      return {
        source,
        localized,
        usedCache: false,
        helperCallMade: true,
        ok: true,
        fallbackReason: null,
      };
    } catch (error) {
      return {
        source,
        localized: null,
        usedCache: false,
        helperCallMade: true,
        ok: false,
        fallbackReason: error instanceof Error ? error.message : String(error),
      };
    }
  }

  const smokeRuns: RunArtifact[] = [];
  for (const fixture of SMOKE_FIXTURES) {
    smokeRuns.push(await runExtraction(fixture));
  }

  const reviewedRuns: RunArtifact[] = [];
  for (const fixture of REVIEWED_FIXTURES) {
    reviewedRuns.push(await runExtraction(fixture));
  }

  const smokeResults = smokeRuns.map((run) => {
    const display = run.rawParsed.display_distillation as Record<string, unknown> | undefined;
    const relevantDisplay = {
      essence_title: firstString(display?.essence_title),
      essence_line: firstString(display?.essence_line),
      main_tension: firstString(display?.main_tension),
      movement_line: firstString(display?.movement_line),
    };
    const centralConflicts = Array.isArray(run.rawParsed.central_conflicts)
      ? run.rawParsed.central_conflicts
      : [];
    const pass =
      run.fixture.smokeExpectation === 'tension'
        ? Array.isArray(centralConflicts) && centralConflicts.length >= 1
        : run.fixture.smokeExpectation === 'empty'
          ? Array.isArray(centralConflicts) && centralConflicts.length === 0
          : run.extractionLanguageGate.ok;
    return {
      run,
      relevantDisplay,
      centralConflicts,
      languageVerdict: run.extractionLanguageGate,
      pass,
    };
  });

  const reviewedResults = [];
  for (const run of reviewedRuns) {
    const targetLanguage = resolveDreamOutputLanguage(run.fixture.dream, run.fixture.dreamLanguage);
    const rawArchetypes = Array.isArray(run.rawParsed.archetypes) ? run.rawParsed.archetypes : [];
    const rawAmplifications = Array.isArray(run.rawParsed.amplifications) ? run.rawParsed.amplifications : [];
    const postArchetypes = run.post.post_validation_archetypes.map((row) => row as Record<string, unknown>);
    const postAmplifications = run.post.post_validation_amplifications.map((row) => row as Record<string, unknown>);
    const renderedArchetypes = postArchetypes.map((row) => buildArchetypeCopy(row, targetLanguage));
    const renderedMyths: RenderedMyth[] = [];

    for (const row of postAmplifications) {
      const catalogId = firstString(row.catalog_id);
      if (!catalogId) continue;
      const entry = productionCatalog.entriesById[catalogId];
      if (!entry) {
        const fallback: LocalizationResult = {
          source: '',
          localized: null,
          usedCache: false,
          helperCallMade: false,
          ok: false,
          fallbackReason: `catalog_id ${catalogId} not found in frozen production catalog ${productionCatalog.version}`,
        };
        renderedMyths.push(
          buildMythCopy({
            row,
            language: targetLanguage,
            sourceSynopsis: '',
            localizedSynopsis: null,
            localization: fallback,
          })
        );
        continue;
      }
      const localization = await localizeSynopsis({
        catalogId,
        entry,
        targetLanguage,
      });
      renderedMyths.push(
        buildMythCopy({
          row,
          language: targetLanguage,
          sourceSynopsis: entry.core_synopsis,
          localizedSynopsis: localization.ok ? localization.localized : null,
          localization,
        })
      );
    }

    const renderedStrings = [
      ...renderedArchetypes.map((item) => item.copy),
      ...renderedMyths.map((item) => item.copy),
    ];
    const renderedLanguageGate = evaluateDreamExtractionOutputLanguage(
      { symbols: renderedStrings },
      targetLanguage
    );
    reviewedResults.push({
      run,
      targetLanguage,
      rawArchetypes,
      rawAmplifications,
      postArchetypes,
      postAmplifications,
      renderedArchetypes,
      renderedMyths,
      renderedLanguageGate,
    });
  }

  const emptyStateExamples = {
    archetypes_empty: {
      behavior: 'hide_archetype_section',
      exact_rendered_state:
        'Archetypal Echo section is not rendered when post-validation archetypes[] is empty.',
    },
    amplifications_empty: {
      behavior: 'hide_myth_section',
      exact_rendered_state:
        'Mythic Echo section is not rendered when post-validation amplifications[] is empty.',
    },
    divergence_missing: {
      behavior: 'omit_divergence_subsection_only',
      exact_rendered_state:
        'Render title, tradition, localized synopsis, and resonance only. Omit the "Πού διαφέρει" / "Where it differs" subsection when divergence is empty.',
    },
    synopsis_localization_failure: {
      behavior: 'hide_synopsis_subsection_only',
      exact_rendered_state:
        'Do not render the "Ο μύθος" / "The myth" subsection. Preserve title, tradition, resonance, and divergence. Log a non-sensitive localization fallback.',
    },
  };

  let verdict: 'ready for v1 presentation' | 'needs small deterministic composition adjustment' | 'requires new model fields' =
    'ready for v1 presentation';

  const hardLocalizationFailure = reviewedResults.some((result) =>
    result.renderedMyths.some((myth) => !myth.localization.ok)
  );
  const strongDuplication = reviewedResults.some((result) =>
    result.renderedArchetypes.some((item) => item.duplicationNotes.length > 0) ||
    result.renderedMyths.some((item) => item.duplicationNotes.length > 0)
  );
  const languageIssue = reviewedResults.some((result) => !result.renderedLanguageGate.ok) ||
    smokeResults.some((result) => !result.languageVerdict.ok);

  if (languageIssue || hardLocalizationFailure || strongDuplication) {
    verdict = 'needs small deterministic composition adjustment';
  }

  const packetPath = path.join(
    outDir,
    'ONEIROS_V1_CLOSING_VERIFICATION_RESULTS_PACKET_2026-07-28.md'
  );

  const lines: string[] = [];
  lines.push('# Oneiros v1 closing verification results packet');
  lines.push('');
  lines.push(`Date run: 2026-07-28`);
  lines.push(`Output directory: \`${outDir}\``);
  lines.push('');
  lines.push('## Frozen runtime used');
  lines.push('');
  lines.push('```text');
  lines.push(`prompt_id: ${DREAM_EXTRACTION_PROMPT_ID}`);
  lines.push(`prompt_version: ${DREAM_EXTRACTION_PROMPT_VERSION}`);
  lines.push(`schema_version: ${DREAM_EXTRACTION_SCHEMA_VERSION}`);
  lines.push(`archetype_catalog_version: 1.7.0`);
  lines.push(`myth_catalog_version: ${productionCatalog.version}`);
  lines.push(`temperature: ${DREAM_EXTRACTION_TEMPERATURE}`);
  lines.push('```');
  lines.push('');
  lines.push('## A. Inner Tensions smoke results');
  lines.push('');

  for (const result of smokeResults) {
    lines.push(`### ${result.run.fixture.label}`);
    lines.push('');
    lines.push('```text');
    lines.push(`fixture_id: ${result.run.fixture.id}`);
    lines.push(`model: ${result.run.model ?? '(unknown)'}`);
    lines.push(`latency_ms: ${result.run.latencyMs}`);
    lines.push(`estimated_usd: ${result.run.estimatedUsd ?? 0}`);
    lines.push(`pass: ${result.pass ? 'PASS' : 'FAIL'}`);
    lines.push('```');
    lines.push('');
    lines.push('#### Full raw dream');
    lines.push('');
    lines.push('```text');
    lines.push(result.run.fixture.dream);
    lines.push('```');
    lines.push('');
    lines.push('#### Exact central_conflicts');
    lines.push('');
    lines.push('```json');
    lines.push(safeJson(result.centralConflicts));
    lines.push('```');
    lines.push('');
    lines.push('#### Relevant display_distillation');
    lines.push('');
    lines.push('```json');
    lines.push(safeJson(result.relevantDisplay));
    lines.push('```');
    lines.push('');
    lines.push('#### Language verdict');
    lines.push('');
    lines.push('```json');
    lines.push(safeJson(result.languageVerdict));
    lines.push('```');
    lines.push('');
  }

  lines.push('## B. Echo-presentation results');
  lines.push('');

  for (const result of reviewedResults) {
    lines.push(`### ${result.run.fixture.label}`);
    lines.push('');
    lines.push('```text');
    lines.push(`fixture_id: ${result.run.fixture.id}`);
    lines.push(`model: ${result.run.model ?? '(unknown)'}`);
    lines.push(`provider: ${result.run.provider ?? '(unknown)'}`);
    lines.push(`latency_ms: ${result.run.latencyMs}`);
    lines.push(`estimated_usd: ${result.run.estimatedUsd ?? 0}`);
    lines.push(`target_language: ${result.targetLanguage.code}`);
    lines.push('```');
    lines.push('');
    lines.push('#### Full raw dream');
    lines.push('');
    lines.push('```text');
    lines.push(result.run.fixture.dream);
    lines.push('```');
    lines.push('');
    lines.push('#### Exact raw archetypes[]');
    lines.push('');
    lines.push('```json');
    lines.push(safeJson(result.rawArchetypes));
    lines.push('```');
    lines.push('');
    lines.push('#### Exact raw amplifications[]');
    lines.push('');
    lines.push('```json');
    lines.push(safeJson(result.rawAmplifications));
    lines.push('```');
    lines.push('');
    lines.push('#### Post-validation archetypes[] used for rendering');
    lines.push('');
    lines.push('```json');
    lines.push(safeJson(result.postArchetypes));
    lines.push('```');
    lines.push('');
    lines.push('#### Post-validation amplifications[] used for rendering');
    lines.push('');
    lines.push('```json');
    lines.push(safeJson(result.postAmplifications));
    lines.push('```');
    lines.push('');

    if (result.renderedArchetypes.length > 0) {
      lines.push('#### Exact rendered archetype copy');
      lines.push('');
      for (const archetype of result.renderedArchetypes) {
        lines.push(`##### ${archetype.title}`);
        lines.push('');
        lines.push('```text');
        lines.push(archetype.copy);
        lines.push('```');
        lines.push('');
        lines.push('```text');
        lines.push(`character_count: ${archetype.characterCount}`);
        lines.push(`approx_line_count: ${archetype.approxLineCount}`);
        lines.push(`truncation_or_expand: no`);
        lines.push(`duplication_notes: ${archetype.duplicationNotes.length ? archetype.duplicationNotes.join(' | ') : 'none'}`);
        lines.push('```');
        lines.push('');
      }
    }

    if (result.renderedMyths.length > 0) {
      lines.push('#### Localized myth synopses and exact rendered myth copy');
      lines.push('');
      for (const myth of result.renderedMyths) {
        lines.push(`##### ${myth.title}`);
        lines.push('');
        lines.push('```text');
        lines.push(`source_synopsis_en: ${myth.sourceSynopsis}`);
        lines.push(`localized_synopsis_rendered: ${myth.localizedSynopsis ?? '(hidden due to localization fallback)'}`);
        lines.push('```');
        lines.push('');
        lines.push('```json');
        lines.push(safeJson(myth.localization));
        lines.push('```');
        lines.push('');
        lines.push('```text');
        lines.push(myth.copy);
        lines.push('```');
        lines.push('');
        lines.push('```text');
        lines.push(`character_count: ${myth.characterCount}`);
        lines.push(`approx_line_count: ${myth.approxLineCount}`);
        lines.push(`truncation_or_expand: no`);
        lines.push(`duplication_notes: ${myth.duplicationNotes.length ? myth.duplicationNotes.join(' | ') : 'none'}`);
        lines.push('```');
        lines.push('');
      }
    }

    lines.push('#### Language verdict');
    lines.push('');
    lines.push('```json');
    lines.push(
      safeJson({
        extraction_fields: result.run.extractionLanguageGate,
        rendered_copy: result.renderedLanguageGate,
      })
    );
    lines.push('```');
    lines.push('');
  }

  lines.push('## C. Empty-state examples');
  lines.push('');
  lines.push('```json');
  lines.push(safeJson(emptyStateExamples));
  lines.push('```');
  lines.push('');
  lines.push('## D. Final verdict');
  lines.push('');
  lines.push('```text');
  lines.push(verdict);
  lines.push('```');
  lines.push('');

  writeFileSync(packetPath, `${lines.join('\n')}\n`);

  writeFileSync(
    path.join(outDir, 'artifacts.json'),
    JSON.stringify(
      {
        smokeResults: smokeResults.map((result) => ({
          fixture_id: result.run.fixture.id,
          central_conflicts: result.centralConflicts,
          relevant_display_distillation: result.relevantDisplay,
          language_verdict: result.languageVerdict,
          pass: result.pass,
        })),
        reviewedResults: reviewedResults.map((result) => ({
          fixture_id: result.run.fixture.id,
          raw_archetypes: result.rawArchetypes,
          raw_amplifications: result.rawAmplifications,
          post_archetypes: result.postArchetypes,
          post_amplifications: result.postAmplifications,
          rendered_archetypes: result.renderedArchetypes,
          rendered_myths: result.renderedMyths,
          extraction_language_gate: result.run.extractionLanguageGate,
          rendered_language_gate: result.renderedLanguageGate,
        })),
        packetPath,
        verdict,
      },
      null,
      2
    )
  );

  console.log(
    JSON.stringify(
      {
        outDir,
        packetPath,
        verdict,
        smokeCount: smokeResults.length,
        reviewedCount: reviewedResults.length,
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
