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
import { estimateAiCallCost } from '../src/billing/aiPricing';
import { buildEchoBenchmarkStages, resolveBenchmarkConcurrency } from '../scripts/lib/echoBenchmarkStages';

type ExpectedSpec = {
  required_archetypes: string[];
  acceptable_secondary_archetypes?: string[];
  forbidden_archetypes?: string[];
  required_myth_title?: string | null;
  preferred_myth_title?: string | null;
  acceptable_empty_myth?: boolean;
  forbidden_myth_titles?: string[];
};

type Fixture = {
  id: string;
  label: string;
  expected: ExpectedSpec;
  dream: string;
};

type RunArtifact = {
  run_id: string;
  fixture_id: string;
  prompt_id: string;
  prompt_version: string;
  schema_version: number;
  model: string | null;
  raw_dream_only: true;
  schema_ok: boolean;
  latency_ms: number;
  estimated_usd: number | null;
  archetype_labels: string[];
  archetype_ids: string[];
  myth_titles: string[];
  myth_catalog_ids: string[];
  pass: {
    required_archetypes: boolean;
    forbidden_archetypes: boolean;
    myth: boolean;
  };
  stage_file: string;
  error?: {
    message: string;
  };
};

const FIXTURES: Fixture[] = [
  {
    id: 'myth_regression_orpheus_theatre',
    label: 'Lost woman beneath the theatre',
    expected: {
      required_archetypes: ['The Lover', 'The Guide / Psychopomp'],
      forbidden_archetypes: ['Anima'],
      required_myth_title: 'Orpheus and Eurydice',
    },
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
    label: 'Expanding apartment and route-less bus',
    expected: {
      required_archetypes: [],
      forbidden_archetypes: ['The Guide / Psychopomp', 'The Self', 'The Divine Child'],
      acceptable_empty_myth: true,
    },
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
    label: 'Underground child and divided spring',
    expected: {
      required_archetypes: ['The Wise Old Woman', 'The Divine Child'],
      forbidden_archetypes: ['The Guide / Psychopomp'],
      required_myth_title: 'Demeter and Persephone',
      forbidden_myth_titles: ['Eros and Psyche'],
    },
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
    label: 'Tower, lost name and restored song',
    expected: {
      required_archetypes: ['The Divine Child'],
      acceptable_secondary_archetypes: ['The Self', 'The Guide / Psychopomp'],
      preferred_myth_title: 'Tower of Babel',
      acceptable_empty_myth: true,
      forbidden_myth_titles: ['The Night Journey and Ascension'],
    },
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
    label: 'Father, crown and chained lion',
    expected: {
      required_archetypes: ['The Father', 'The Guide / Psychopomp'],
      acceptable_empty_myth: true,
      preferred_myth_title: 'Cronus and the devouring of his children',
      forbidden_myth_titles: ['Joseph'],
    },
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

function normalizeLabel(value: string): string {
  return value.trim().replace(/^The\s+/i, '');
}

function labelsFromPost(post: ReturnType<typeof buildEchoBenchmarkStages>): string[] {
  return post.post_validation_archetypes
    .map((row) => firstString(row.canonical_label))
    .filter((row): row is string => row != null);
}

function idsFromPost(post: ReturnType<typeof buildEchoBenchmarkStages>): string[] {
  return post.post_validation_archetypes
    .map((row) => firstString(row.archetype_id))
    .filter((row): row is string => row != null);
}

function mythTitlesFromPost(post: ReturnType<typeof buildEchoBenchmarkStages>): string[] {
  return post.post_validation_amplifications
    .map((row) => firstString(row.title))
    .filter((row): row is string => row != null);
}

function mythIdsFromPost(post: ReturnType<typeof buildEchoBenchmarkStages>): string[] {
  return post.post_validation_amplifications
    .map((row) => firstString(row.catalog_id))
    .filter((row): row is string => row != null);
}

function evaluateFixture(fixture: Fixture, post: ReturnType<typeof buildEchoBenchmarkStages>) {
  const labels = labelsFromPost(post);
  const normalizedLabels = labels.map(normalizeLabel);
  const mythTitles = mythTitlesFromPost(post);
  const requiredExpected = fixture.expected.required_archetypes.map(normalizeLabel);
  const forbiddenExpected = (fixture.expected.forbidden_archetypes || []).map(normalizeLabel);
  const required_archetypes =
    requiredExpected.every((label) => normalizedLabels.includes(label)) &&
    (requiredExpected.length > 0 || labels.length === 0);
  const forbidden_archetypes = forbiddenExpected.every(
    (label) => !normalizedLabels.includes(label)
  );

  const requiredMyth = fixture.expected.required_myth_title;
  const preferredMyth = fixture.expected.preferred_myth_title;
  const acceptableEmpty = fixture.expected.acceptable_empty_myth === true;
  const forbiddenMyths = fixture.expected.forbidden_myth_titles || [];

  let myth = false;
  if (requiredMyth) myth = mythTitles[0] === requiredMyth;
  else if (preferredMyth) myth = mythTitles.length === 0 ? acceptableEmpty : mythTitles[0] === preferredMyth;
  else myth = acceptableEmpty ? mythTitles.length === 0 : true;

  if (forbiddenMyths.some((title) => mythTitles.includes(title))) myth = false;

  return { required_archetypes, forbidden_archetypes, myth };
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
    const res = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: anon },
      body: JSON.stringify({ email, password }),
    });
    const text = await res.text();
    if (!res.ok) throw new Error(`auth failed ${res.status}: ${text.slice(0, 300)}`);
    token = (JSON.parse(text) as { access_token?: string }).access_token || '';
    if (!token) throw new Error('no access token');
  }

  const runsPerFixture = Math.max(1, Number(process.env.REGRESSION_RUNS_PER_DREAM || 3));
  const jobs = FIXTURES.flatMap((fixture) =>
    Array.from({ length: runsPerFixture }, (_, index) => ({
      fixture,
      repeatIndex: index + 1,
      cacheBust: randomUUID(),
    }))
  );
  const concurrency = resolveBenchmarkConcurrency(jobs.length);
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outDir = path.join(process.cwd(), 'tmp', `reviewed-m2-regression-dreams-${stamp}`);
  mkdirSync(outDir, { recursive: true });

  const system = buildDreamExtractionSystemPrompt();

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
    if (!res.ok) throw new Error(`proxy ${res.status}: ${text.slice(0, 600)}`);
    const body = JSON.parse(text) as Record<string, unknown>;
    const content =
      (body.choices as Array<{ message?: { content?: string } }> | undefined)?.[0]?.message?.content ??
      (typeof body.content === 'string' ? body.content : '') ??
      (typeof body.text === 'string' ? body.text : '');
    const costField = body.ai_call_cost ?? body.cost ?? null;
    const estimated =
      costField && typeof costField === 'object'
        ? costField
        : estimateAiCallCost(body, typeof body.provider === 'string' ? body.provider : 'openai');
    return { body, content: String(content), latencyMs, cost: estimated };
  }

  async function mapPool<T, R>(items: T[], limit: number, worker: (item: T, index: number) => Promise<R>): Promise<R[]> {
    const results = new Array<R>(items.length);
    let next = 0;
    async function runOne() {
      while (true) {
        const index = next++;
        if (index >= items.length) return;
        results[index] = await worker(items[index], index);
      }
    }
    const size = Math.max(1, Math.min(limit, items.length));
    await Promise.all(Array.from({ length: size }, () => runOne()));
    return results;
  }

  console.log(
    JSON.stringify(
      {
        phase: 'reviewed_m2_regression_dreams',
        fixtures: FIXTURES.length,
        runs_per_fixture: runsPerFixture,
        total_runs: jobs.length,
        concurrency,
        outDir,
        prompt_version: DREAM_EXTRACTION_PROMPT_VERSION,
        raw_dream_only: true,
      },
      null,
      2
    )
  );

  const runs = await mapPool(jobs, concurrency, async (job) => {
    const runId = `${job.fixture.id}_r${job.repeatIndex}`;
    const stageFile = path.join(outDir, `${runId}.json`);
    try {
      const user = `${buildDreamExtractionUserPrompt({
        date: '2026-07-28',
        content: job.fixture.dream,
        finalInterpretation: null,
        debugInterpretiveEchoes: false,
        dreamLanguage: 'el',
      })}\n\n[regression_run_id: ${job.cacheBust}]`;

      const { body, content, latencyMs, cost } = await callProxy({
        task: 'dream_extraction',
        model: 'gpt-5.4-mini',
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
        temperature: DREAM_EXTRACTION_TEMPERATURE,
        max_completion_tokens: DREAM_EXTRACTION_TOKEN_LIMIT,
        max_tokens: DREAM_EXTRACTION_TOKEN_LIMIT,
        response_format: { type: 'json_object' },
      });

      const rawParsed = parseJson(content);
      const post = buildEchoBenchmarkStages(rawParsed, job.fixture.dream);
      const pass = evaluateFixture(job.fixture, post);
      const model = firstString(body.model);
      const estimatedUsd =
        cost && typeof cost === 'object' && typeof (cost as { estimatedUsd?: unknown }).estimatedUsd === 'number'
          ? ((cost as { estimatedUsd: number }).estimatedUsd ?? null)
          : null;
      const artifact: RunArtifact = {
        run_id: runId,
        fixture_id: job.fixture.id,
        prompt_id: DREAM_EXTRACTION_PROMPT_ID,
        prompt_version: DREAM_EXTRACTION_PROMPT_VERSION,
        schema_version: DREAM_EXTRACTION_SCHEMA_VERSION,
        model,
        raw_dream_only: true,
        schema_ok: true,
        latency_ms: latencyMs,
        estimated_usd: estimatedUsd,
        archetype_labels: labelsFromPost(post),
        archetype_ids: idsFromPost(post),
        myth_titles: mythTitlesFromPost(post),
        myth_catalog_ids: mythIdsFromPost(post),
        pass,
        stage_file: stageFile,
      };

      writeFileSync(
        artifact.stage_file,
        JSON.stringify(
          {
            ...artifact,
            validator_decisions: post.validator_decisions,
            archetype_rejected: post.archetype_rejected,
            mythic_validator_logs: post.mythic_validator_logs,
            mythic_rejected: post.mythic_rejected,
            post_validation_archetypes: post.post_validation_archetypes,
            post_validation_amplifications: post.post_validation_amplifications,
          },
          null,
          2
        )
      );

      console.log(
        `${runId}: archetypes=${JSON.stringify(artifact.archetype_labels)} myths=${JSON.stringify(artifact.myth_titles)} pass=${JSON.stringify(pass)}`
      );

      return artifact;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const artifact: RunArtifact = {
        run_id: runId,
        fixture_id: job.fixture.id,
        prompt_id: DREAM_EXTRACTION_PROMPT_ID,
        prompt_version: DREAM_EXTRACTION_PROMPT_VERSION,
        schema_version: DREAM_EXTRACTION_SCHEMA_VERSION,
        model: null,
        raw_dream_only: true,
        schema_ok: false,
        latency_ms: 0,
        estimated_usd: null,
        archetype_labels: [],
        archetype_ids: [],
        myth_titles: [],
        myth_catalog_ids: [],
        pass: {
          required_archetypes: false,
          forbidden_archetypes: false,
          myth: false,
        },
        stage_file: stageFile,
        error: { message },
      };
      writeFileSync(artifact.stage_file, JSON.stringify(artifact, null, 2));
      console.log(`${runId}: ERROR ${message}`);
      return artifact;
    }
  });

  const summary = FIXTURES.map((fixture) => {
    const fixtureRuns = runs.filter((run) => run.fixture_id === fixture.id);
    return {
      fixture_id: fixture.id,
      label: fixture.label,
      runs: fixtureRuns.length,
      error_runs: fixtureRuns.filter((run) => run.error).length,
      required_archetypes_pass_runs: fixtureRuns.filter((run) => run.pass.required_archetypes).length,
      forbidden_archetypes_pass_runs: fixtureRuns.filter((run) => run.pass.forbidden_archetypes).length,
      myth_pass_runs: fixtureRuns.filter((run) => run.pass.myth).length,
      archetype_labels_by_run: fixtureRuns.map((run) => run.archetype_labels),
      myth_titles_by_run: fixtureRuns.map((run) => run.myth_titles),
    };
  });

  const summaryFile = path.join(outDir, 'summary.json');
  writeFileSync(
    summaryFile,
    JSON.stringify(
      {
        title: 'Oneiros M2 reviewed regression dreams',
        generated_at: new Date().toISOString(),
        prompt_id: DREAM_EXTRACTION_PROMPT_ID,
        prompt_version: DREAM_EXTRACTION_PROMPT_VERSION,
        schema_version: DREAM_EXTRACTION_SCHEMA_VERSION,
        raw_dream_only: true,
        runs_per_fixture: runsPerFixture,
        total_runs: runs.length,
        fixtures: summary,
        run_files: runs.map((run) => run.stage_file),
      },
      null,
      2
    )
  );

  console.log(`summary_file=${summaryFile}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack || error.message : String(error));
  process.exit(1);
});
