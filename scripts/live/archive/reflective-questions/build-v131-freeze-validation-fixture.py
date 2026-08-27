#!/usr/bin/env python3
"""Build the unseen v1.3.1 freeze-validation fixture. Does not touch the prompt."""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path("/Users/yiannisyiallouris/Documents/perso/oneiros-app")
OUT = ROOT / "testing/live-scenarios/reflective-questions-v131-freeze-validation.v1.json"
HIST = ROOT / "testing/live-scenarios/reflective-questions-live-benchmark.v1.json"


def words(text: str) -> int:
    return len([token for token in text.strip().split() if token])


def case(
    id: str,
    title: str,
    band: str,
    categories: list[str],
    features: list[str],
    content: str,
    focus: str,
    forbidden: list[str],
    buckets: list[str],
) -> dict:
    return {
        "id": id,
        "language": "el",
        "title": title,
        "length_band": band,
        "categories": categories,
        "narrative_features": features,
        "validation_buckets": buckets,
        "content": content.strip(),
        "reviewer_focus": focus,
        "forbidden_inventions": forbidden,
    }


CASES = [
    # --- 8 ultra-short banal ---
    case("yellow-ticket-on-table", "Το κίτρινο εισιτήριο", "ultra_short",
         ["ordinary_banal_low_affect"], ["ultra_short"],
         "Βρήκα ένα κίτρινο εισιτήριο στην τσέπη του σακακιού και το άφησα στο τραπέζι.",
         "One custodial gesture; do not inflate a ticket into missed destiny.",
         ["Fear of missing a journey", "A hidden appointment"],
         ["ultra_short", "banal_low_affect"]),
    case("tap-drips-on-counter", "Η βρύση στην κουζίνα", "ultra_short",
         ["ordinary_banal_low_affect"], ["ultra_short"],
         "Η βρύση έσταζε στην κουζίνα. Σκούπισα τον πάγκο και έφυγα.",
         "A tiny practical act; resist leakage or invented irritation.",
         ["Domestic resentment", "Anxiety about waste"],
         ["ultra_short", "banal_low_affect"]),
    case("grey-sock-on-radiator", "Η κάλτσα στο καλοριφέρ", "ultra_short",
         ["ordinary_banal_low_affect"], ["ultra_short"],
         "Μια γκρι κάλτσα στέγνωνε στο καλοριφέρ. Δεν την πήρα.",
         "Neutral noticing of an object; do not invent neglect or loneliness.",
         ["Loneliness", "Shame about housework"],
         ["ultra_short", "banal_low_affect"]),
    case("closed-kiosk-at-noon", "Το κλειστό περίπτερο", "ultra_short",
         ["ordinary_banal_low_affect"], ["ultra_short"],
         "Πέρασα μπροστά από ένα κλειστό περίπτερο το μεσημέρι και συνέχισα.",
         "A closed kiosk is not exclusion. Keep it modest.",
         ["Feeling shut out", "A thwarted need"],
         ["ultra_short", "banal_low_affect"]),
    case("two-identical-keys", "Τα δύο ίδια κλειδιά", "ultra_short",
         ["ordinary_banal_low_affect"], ["ultra_short"],
         "Είχα δύο ίδια κλειδιά στο μπρελόκ και δεν ήξερα ποιο να χρησιμοποιήσω.",
         "Practical uncertainty only; do not invent identity split.",
         ["Split self", "Fear of choosing wrongly in life"],
         ["ultra_short", "banal_low_affect"]),
    case("cat-on-sill-looking-out", "Η γάτα στο περβάζι", "ultra_short",
         ["ordinary_banal_low_affect"], ["ultra_short"],
         "Η γάτα καθόταν στο περβάζι και κοιτούσε έξω. Εγώ έπινα νερό.",
         "Co-presence without staged relation. Do not force a bond.",
         ["The cat as a guide", "Mutual longing"],
         ["ultra_short", "banal_low_affect", "relational_looking_unstaged"]),
    case("half-drunk-tea", "Το μισοπιωμένο τσάι", "ultra_short",
         ["ordinary_banal_low_affect"], ["ultra_short"],
         "Άφησα το τσάι μισοπιωμένο στο περβάζι και κατέβηκα.",
         "An unfinished cup is not abandonment of a life.",
         ["Giving up", "Depression inferred from tea"],
         ["ultra_short", "banal_low_affect"]),
    case("neighbor-says-morning", "Η καλημέρα του γείτονα", "ultra_short",
         ["ordinary_banal_low_affect", "relational_looking_unstaged"],
         ["ultra_short", "unstaged_cooccurrence", "multiple_characters"],
         "Ο γείτονας είπε καλημέρα χωρίς να σταματήσει. Εγώ απάντησα το ίδιο.",
         "Greeting without contact or follow-through is not a relationship opening.",
         ["A wish for closeness", "Fear of neighbors"],
         ["ultra_short", "banal_low_affect", "relational_looking_unstaged"]),
    # --- 2 more ordinary short ---
    case("lining-shoes-in-hallway", "Τα παπούτσια στον διάδρομο", "short",
         ["ordinary_banal_low_affect"], ["irrelevant_detail"],
         "Στεκόμουν στον διάδρομο και έβαζα τα παπούτσια σε μια σειρά δίπλα στον τοίχο. Δύο ήταν καφέ και ένα μαύρο. Το μαύρο είχε λίγο χώμα στη σόλα και το χτύπησα μια φορά στο χαλάκι. Από την κουζίνα ακουγόταν το ψυγείο. Δεν βιαζόμουν και δεν περίμενα κανέναν. Όταν τέλειωσα, έμεινα λίγο να κοιτάζω τη σειρά χωρίς να σκέφτομαι κάτι συγκεκριμένο.",
         "A modest arranging task; do not invent control pathology.",
         ["Obsessive order", "Waiting for a visitor who never comes"],
         ["banal_low_affect"]),
    case("wiping-fogged-bathroom-mirror", "Ο θολωμένος καθρέφτης", "short",
         ["ordinary_banal_low_affect"], ["partial_memory"],
         "Στο μπάνιο ο καθρέφτης ήταν θολωμένος από τον ατμό. Τον σκούπισα με την πετσέτα στο κέντρο μόνο, αρκετά για να δω το πρόσωπό μου. Δεν θυμάμαι αν χτένισα τα μαλλιά. Άφησα την πετσέτα στην άκρη του νιπτήρα και άνοιξα λίγο το παράθυρο. Ο αέρας μύριζε σαπούνι. Έφυγα χωρίς να κοιτάξω ξανά.",
         "A practical wipe; do not invent self-recognition crisis.",
         ["Identity confusion", "Shame about appearance"],
         ["banal_low_affect"]),
    # --- 8 dense intense ---
    case("smoke-stair-mother-calls", "Ο καπνός στη σκάλα", "medium",
         ["emotionally_intense"], ["multiple_characters", "affect_shift", "scene_shift", "incomplete_ending"],
         "Κατέβαινα τη σκάλα της πολυκατοικίας όταν ο καπνός γέμισε τον όροφο τόσο γρήγορα που δεν έβλεπα τα σκαλιά. Άκουσα τη μητέρα μου να φωνάζει το όνομά μου από πάνω, κοφτά, δύο φορές. Προσπάθησα να γυρίσω αλλά το κάγκελο κάηκε στο χέρι μου και το τράβηξα πίσω. Κάποιος άνοιξε μια πόρτα στο πλατύσκαλο και ξανάκλεισε. Ο καπνός μπήκε στο στόμα μου και έβηχα μέχρι να γονατίσω. Η φωνή της σταμάτησε απότομα. Έμεινα εκεί με τα μάτια κλειστά, περιμένοντας να ξαναφωνάξει, και δεν ξαναφώναξε. Κάτω ακουγόταν ένα κουδούνι ανελκυστήρα που δεν ερχόταν.",
         "Dense danger plus a cut-off call; stay with the staged halt, do not invent why she stopped.",
         ["The mother is dying offstage", "Guilt for not saving her", "A waking fire trauma"],
         ["dense_emotionally_intense"]),
    case("teeth-crumble-during-speech", "Τα δόντια στην ομιλία", "short",
         ["emotionally_intense"], ["affect_shift", "incomplete_ending"],
         "Στεκόμουν όρθια μπροστά σε κόσμο και μιλούσα όταν τα μπροστινά δόντια μου έγιναν μαλακά και θρυμματίστηκαν στο στόμα. Προσπάθησα να συνεχίσω την πρόταση και έβγαλα μικρά κομμάτια στην παλάμη. Κάποιοι γύρισαν αλλού το κεφάλι. Δεν μπορούσα να κλείσω το στόμα χωρίς να νιώθω άμμο. Το μικρόφωνο έμεινε ανοιχτό. Κατέβηκα από τη σκηνή κρατώντας τα θρύμματα και δεν θυμάμαι αν μίλησε κανείς.",
         "Bodily collapse during speech is already the charge; do not invent career failure.",
         ["Public humiliation as life theme", "Fear of aging", "Punishment for speaking"],
         ["dense_emotionally_intense"]),
    case("child-falls-you-catch-air", "Το παιδί στο μπαλκόνι", "medium",
         ["emotionally_intense"], ["multiple_characters", "affect_shift", "incomplete_ending"],
         "Στεκόμουν στην αυλή όταν ένα μικρό παιδί γλίστρησε από το μπαλκόνι του πρώτου. Άπλωσα τα χέρια χωρίς να προλάβω να σκεφτώ και έπιασα μόνο αέρα. Το σώμα πέρασε δίπλα μου και χτύπησε μαλακά στα χόρτα, μετά σηκώθηκε και με κοίταξε σαν να μην είχε συμβεί. Εγώ δεν μπορούσα να κατεβάσω τα χέρια. Μια γυναίκα από πάνω έκλεισε την μπαλκονόπορτα χωρίς να μιλήσει. Το παιδί περπάτησε προς τη βρύση. Εγώ έμεινα με τα χέρια ανοιχτά μέχρι που άρχισαν να τρέμουν.",
         "The miss and the unchanged child are staged; do not invent death that did not happen.",
         ["The child dies", "You are a bad parent", "Waking accident guilt"],
         ["dense_emotionally_intense"]),
    case("train-doors-on-partners-hand", "Οι πόρτες του τρένου", "short",
         ["emotionally_intense", "relational_intimate_erotic_vital"],
         ["multiple_characters", "staged_relation", "affect_shift"],
         "Στεκόμουν μέσα στο βαγόνι και εκείνος έξω στην αποβάθρα. Οι πόρτες έκλεισαν πάνω στο χέρι του. Είδε το πρόσωπό μου και δεν τράβηξε πίσω. Πάτησα το κουμπί ανοίγματος δύο φορές και δεν άνοιξε. Το τρένο ξεκίνησε με το χέρι του ακόμα σφιγμένο. Άκουσα τον ήχο του μετάλλου και μετά τίποτα. Κάθισα στο πάτωμα του διαδρόμου κοιτάζοντας την πόρτα.",
         "Contact is staged through the trapped hand; do not invent breakup motive.",
         ["He wanted to leave you", "You caused the injury", "A real commuting trauma"],
         ["dense_emotionally_intense", "relational_staged"]),
    case("fire-you-save-wrong-object", "Το λάθος αντικείμενο", "medium",
         ["emotionally_intense"], ["affect_shift", "irrelevant_detail", "incomplete_ending"],
         "Το σπίτι καιγόταν από την κουζίνα. Έτρεξα μέσα για να βγάλω κάτι και έπιασα το μεταλλικό τασάκι από το τραπέζι του σαλονιού, παρόλο που δίπλα ήταν τα κλειδιά και μια φωτογραφία. Βγήκα έξω με το τασάκι καυτό στην παλάμη. Οι γείτονες φώναζαν για τα παράθυρα. Κοίταξα το τασάκι και δεν ήξερα γιατί το είχα. Δεν μπήκα ξανά. Ο καπνός έβγαινε από τη στέγη σε σταθερή στήλη. Κάθισα στο πεζοδρόμιο με το αντικείμενο ανάμεσα στα γόνατα μέχρι που ήρθαν οι σειρήνες.",
         "The wrong rescue is staged; do not invent what the ashtray 'means'.",
         ["Unconscious death wish", "You do not love your family", "Addiction inferred from the ashtray"],
         ["dense_emotionally_intense"]),
    case("drown-in-shallow-laughter", "Το ρηχό νερό", "short",
         ["emotionally_intense"], ["multiple_characters", "affect_shift"],
         "Ήμουν σε μια ρηχή πισίνα όπου το νερό έφτανε ως τα γόνατα, αλλά όταν έσκυψα δεν μπορούσα να σηκώσω το κεφάλι. Οι άλλοι γελούσαν στην άκρη και έπιναν. Προσπάθησα να φωνάξω και βγήκε μόνο νερό. Κάποιος πέρασε δίπλα μου περπατώντας κανονικά. Τα νύχια μου άγγιζαν τον πάτο. Ξύπνησα πριν βγω.",
         "Inability to rise in shallow water is the charge; laughter is staged, not cruelty you must explain.",
         ["They want you dead", "Social anxiety as diagnosis", "A real drowning"],
         ["dense_emotionally_intense"]),
    case("exam-blood-on-paper", "Το αίμα στο γραπτό", "short",
         ["emotionally_intense"], ["affect_shift", "incomplete_ending"],
         "Καθόμουν σε μια εξέταση και το στυλό μου άφησε μια γραμμή αίματος πάνω στη σελίδα. Δεν είχα κοπεί πουθενά που να βλέπω. Η επιτηρήτρια πέρασε και δεν είπε τίποτα. Προσπάθησα να γράψω γύρω από τον λεκέ και ο λεκές μεγάλωσε. Τα χέρια μου έτρεμαν τόσο που δεν κρατούσα τη σειρά. Παρέδωσα το γραπτό έτσι. Έξω στον διάδρομο κάθισα στο πάτωμα χωρίς να κοιτάξω κανέναν.",
         "Bodily stain during a test; do not invent failure of the self.",
         ["You are failing life", "Self-harm", "Menstruation shame not in the dream"],
         ["dense_emotionally_intense"]),
    case("chased-through-hospital", "Το νοσοκομείο τη νύχτα", "long",
         ["emotionally_intense"],
         ["multiple_characters", "scene_shift", "affect_shift", "changing_locations", "incomplete_ending", "irrelevant_detail"],
         "Με κυνηγούσαν σε έναν διάδρομο νοσοκομείου που μύριζε απολυμαντικό και πορτοκάλι. Δεν έβλεπα πρόσωπα, μόνο βήματα πίσω μου που επιτάχυναν όταν επιτάχυνα κι εγώ. Πέρασα από μια αίθουσα αναμονής όπου μια τηλεόραση έπαιζε χωρίς ήχο ένα δελτίο και τα καθίσματα ήταν όλα στραμμένα προς τον τοίχο. Άνοιξα μια πόρτα που έγραφε ακτινολογία και βρέθηκα σε σκάλα υπηρεσίας. Κάτω ακουγόταν ένα καρότσι. Ανέβηκα. Στο πλατύσκαλο ένα ποτήρι νερό ήταν γεμάτο ως επάνω και δεν το άγγιξα. Τα βήματα ήρθαν στη σκάλα. Βγήκα σε έναν όροφο με τζαμαρία όπου έξω ήταν νύχτα και φαίνονταν φώτα πόλης πολύ μακριά. Κάποιος είπε το όνομά μου ήσυχα από πίσω, μία φορά. Δεν γύρισα. Έτρεξα προς το ασανσέρ, πάτησα το κουμπί, οι πόρτες άνοιξαν σε ένα σκοτεινό φρεάτιο χωρίς καμπίνα. Στάθηκα στο χείλος με τα γόνατα μαλακά. Τα βήματα πλησίασαν στην άκρη του χαλιού. Ξύπνησα πριν πέσω ή πριν με πιάσουν.",
         "Pursuit through changing rooms is the charge; do not invent who the pursuers are.",
         ["A specific abuser", "Hospital trauma from waking life", "You deserve punishment"],
         ["dense_emotionally_intense"]),
    # --- 8 contradictory affect ---
    case("funeral-cannot-stop-laughing", "Το γέλιο στην κηδεία", "short",
         ["contradictory_paradoxical"], ["multiple_characters", "affect_shift"],
         "Ήμουν σε κηδεία και δεν μπορούσα να σταματήσω να γελάω, ήσυχα στην αρχή και μετά με λυγμούς. Οι άλλοι με κοιτούσαν χωρίς θυμό. Προσπάθησα να βάλω το χέρι στο στόμα και το γέλιο έβγαινε από τη μύτη. Το φέρετρο ήταν κλειστό. Έξω έβρεχε λίγο. Κάθισα στο πίσω στασίδι μέχρι να τελειώσει η ακολουθία, ακόμα γελώντας.",
         "Laughter against a funeral is staged contradiction; do not invent disrespect or relief that the dream does not name.",
         ["You are glad they died", "Hysteria diagnosis", "Hidden hatred"],
         ["contradictory_affect"]),
    case("wedding-only-grief", "Ο γάμος με πένθος", "short",
         ["contradictory_paradoxical"], ["multiple_characters", "affect_shift"],
         "Στον γάμο φορούσα άσπρα και ένιωθα μόνο λύπη, βαριά και σταθερή, χωρίς να κλαίω. Χορεύαμε αργά. Εκείνος χαμογελούσε. Εγώ κοίταζα το πάτωμα. Κάποιος έδωσε συγχαρητήρια και εγώ είπα ευχαριστώ με φωνή κανονική. Στο τέλος κάθισα μόνη στο τραπέζι με το ποτήρι γεμάτο.",
         "Named grief inside a wedding is enough; do not invent that the marriage is a mistake.",
         ["The marriage will fail", "You do not love him", "Depression as diagnosis"],
         ["contradictory_affect"]),
    case("hug-that-hurts-and-comforts", "Η αγκαλιά που πονά", "short",
         ["contradictory_paradoxical", "relational_intimate_erotic_vital"],
         ["multiple_characters", "staged_relation", "affect_shift"],
         "Με αγκάλιασε σφιχτά μέχρι να πονέσουν τα πλευρά και ταυτόχρονα η αγκαλιά με ηρεμούσε. Δεν τραβήχτηκα. Άκουγα την αναπνοή του στον ώμο μου. Όταν με άφησε, το σημάδι έμεινε στο δέρμα. Μείναμε όρθιοι στο πλατύσκαλο χωρίς να μιλήσουμε.",
         "Pain and comfort are co-staged in one contact; do not invent abuse.",
         ["This is an abusive partner", "You cannot leave", "Masochism"],
         ["contradictory_affect", "relational_staged"]),
    case("victory-feels-like-loss", "Η νίκη σαν απώλεια", "short",
         ["contradictory_paradoxical"], ["affect_shift", "multiple_characters"],
         "Κέρδισα έναν αγώνα δρόμου και τη στιγμή που έκοψα το νήμα ένιωσα σαν να είχα χάσει κάτι που δεν μπορούσα να ονομάσω. Ο κόσμος χειροκροτούσε. Μου έδωσαν ένα μικρό κύπελλο. Το κρατούσα και ήθελα να το αφήσω κάτω. Κάθισα στο χορτάρι δίπλα στη γραμμή χωρίς να χαμογελάσω.",
         "Victory with unnamed loss is staged; do not supply the lost object.",
         ["You sabotaged yourself", "Fear of success", "A dead rival"],
         ["contradictory_affect"]),
    case("homecoming-feels-like-exile", "Ο γυρισμός σαν εξορία", "medium",
         ["contradictory_paradoxical"], ["scene_shift", "affect_shift", "changing_locations", "partial_memory"],
         "Γύρισα στο πατρικό και όλα ήταν στη θέση τους: το ίδιο χαλάκι, η μυρωδιά του σαπουνιού, η καρέκλα στη γωνία. Ταυτόχρονα ένιωθα σαν να μην επιτρεπόταν να μείνω, χωρίς να μου το έχει πει κανείς. Η μητέρα μου έβγαλε φαγητό. Έφαγα. Μετά βγήκα στην αυλή και κοίταξα τον δρόμο σαν να έφευγα για πάντα, ενώ ήξερα ότι θα κοιμόμουν εκεί. Δεν θυμάμαι αν έκλεισα την πόρτα.",
         "Familiar home plus exile-feeling is the paradox; do not invent a fight.",
         ["You were thrown out", "Family rejection", "Immigration trauma"],
         ["contradictory_affect"]),
    case("kiss-metal-and-honey", "Το φιλί μέταλλο και μέλι", "short",
         ["contradictory_paradoxical", "relational_intimate_erotic_vital"],
         ["multiple_characters", "staged_relation"],
         "Με φίλησε και το στόμα είχε γεύση μέταλλο και μέλι μαζί. Δεν τραβήχτηκα. Μετά καθίσαμε στον τοίχο του λιμανιού και δεν ξαναφιληθήκαμε. Τα φώτα των καραβιών περνούσαν αργά. Κρατούσα την περίεργη γεύση χωρίς να τη σχολιάσω.",
         "Double taste is staged; do not invent poison or danger.",
         ["The kiss is toxic", "You are being harmed", "Addiction"],
         ["contradictory_affect", "relational_staged"]),
    case("safe-and-cannot-breathe", "Ασφαλής χωρίς ανάσα", "short",
         ["contradictory_paradoxical"], ["affect_shift"],
         "Ήμουν σε ένα δωμάτιο που ήξερα ότι ήταν ασφαλές, με κλειδωμένη πόρτα από μέσα, και δεν μπορούσα να αναπνεύσω βαθιά. Τα παράθυρα άνοιγαν. Ο αέρας μύριζε καθαρός. Κάθισα στο πάτωμα και μετρούσα μικρές ανάσες. Δεν με κυνηγούσε κανείς. Έμεινα εκεί μέχρι να ξυπνήσω.",
         "Safety and restricted breath coexist; do not invent a pursuer.",
         ["Panic disorder", "Someone is outside", "You trapped yourself as self-punishment"],
         ["contradictory_affect"]),
    case("wanted-gift-makes-you-sick", "Το δώρο που ναυτιά", "short",
         ["contradictory_paradoxical"], ["multiple_characters", "affect_shift"],
         "Μου έδωσαν ακριβώς το βιβλίο που ήθελα και μόλις το άνοιξα με πήρε ναυτία. Ευχαρίστησα. Κάθισα και το κράτησα κλειστό στα γόνατα. Οι άλλοι περίμεναν να διαβάσω την πρώτη σελίδα. Χαμογέλασα και δεν την άνοιξα. Η ναυτία έμεινε μέχρι το τέλος του ονείρου.",
         "Wanted object plus nausea is staged; do not invent that the giver is harmful.",
         ["The giver is an enemy", "You cannot receive love", "Eating disorder"],
         ["contradictory_affect"]),
    # --- 8 numinous ---
    case("white-horse-empty-church", "Το άλογο στην εκκλησία", "medium",
         ["numinous"], ["scene_shift", "irrelevant_detail", "incomplete_ending"],
         "Μπήκα σε μια άδεια εκκλησία το πρωί και στη μέση του κλίτους στεκόταν ένα λευκό άλογο, ακίνητο, χωρίς καβαλάρη. Τα κεριά ήταν σβηστά. Το άλογο γύρισε το κεφάλι και με κοίταξε χωρίς φόβο. Πλησίασα μέχρι το πρώτο στασίδι και σταμάτησα. Άκουγα μόνο την αναπνοή του και ένα πουλί έξω στον τρούλο. Δεν το άγγιξα. Όταν γύρισα προς την πόρτα, το φως είχε γίνει πιο χρυσό. Δεν θυμάμαι αν έμεινε εκεί όταν έφυγα.",
         "Stay with the encounter; do not invent a message from the horse.",
         ["A divine command", "Death as the horse", "You must leave your old life"],
         ["numinous"]),
    case("sun-stands-still-over-sea", "Ο ήλιος που σταμάτησε", "short",
         ["numinous", "positive_peaceful_beautiful_coherent"], ["incomplete_ending"],
         "Καθόμουν σε μια ακτή και ο ήλιος σταμάτησε ακριβώς πάνω από τη γραμμή του νερού, χωρίς να δύει. Η θάλασσα έμεινε φωτεινή για πολλή ώρα. Δεν φοβήθηκα. Έβγαλα τα παπούτσια και μπήκα λίγο στα ρηχά. Το νερό ήταν χλιαρό. Κοίταζα τον ήλιο χωρίς να πονάνε τα μάτια. Κάποια στιγμή κατάλαβα ότι δεν φυσούσε καθόλου.",
         "Still sun is atmosphere, not apocalypse.",
         ["The world is ending", "A prophetic vision", "You are chosen"],
         ["numinous"]),
    case("voiceless-in-olive-grove", "Η φωνή χωρίς στόμα", "medium",
         ["numinous"], ["incomplete_ending", "partial_memory"],
         "Περπατούσα σε έναν ελαιώνα το απόγευμα και μια φωνή με φώναξε με το όνομά μου, καθαρά, χωρίς να βλέπω στόμα ή σώμα. Σταμάτησα ανάμεσα σε δύο κορμούς. Η φωνή δεν επανέλαβε λέξη πέρα από το όνομα. Τα φύλλα κουνήθηκαν λίγο. Έβαλα το χέρι στον κορμό και ήταν ζεστός από τον ήλιο. Περίμενα. Δεν ήρθε δεύτερη φράση. Συνέχισα μέχρι το τέλος του χωραφιού όπου υπήρχε ένα πέτρινο πεζούλι και κάθισα. Δεν θυμάμαι αν απάντησα.",
         "A name without a body; do not invent the speaker's identity.",
         ["God spoke", "A dead parent", "You must change your life"],
         ["numinous"]),
    case("gold-dust-from-ordinary-cup", "Η σκόνη από το φλιτζάνι", "short",
         ["numinous"], ["irrelevant_detail"],
         "Ήπια από ένα συνηθισμένο λευκό φλιτζάνι στο πάτωμα της κουζίνας και καθώς το άδειασα έπεσε από μέσα λεπτή χρυσή σκόνη στο ξύλο. Δεν έλαμπε σαν κόσμημα, πιο πολύ σαν γύρη. Την άγγιξα με το δάχτυλο και ήταν στεγνή. Το φλιτζάνι από μέσα ήταν πάλι άσπρο. Κάθισα και κοίταξα τη σκόνη χωρίς να την μαζέψω.",
         "Ordinary vessel, unusual residue; do not invent alchemy of the self.",
         ["You are being initiated", "Wealth coming", "Sacred feminine"],
         ["numinous"]),
    case("mountain-door-of-light", "Η πόρτα στο βουνό", "medium",
         ["numinous"], ["scene_shift", "incomplete_ending", "changing_locations"],
         "Ανέβαινα ένα μονοπάτι και η πλαγιά άνοιξε σαν πόρτα από φως, χωρίς κάγκελα. Μέσα δεν έβλεπα δωμάτιο, μόνο φωτεινό αέρα. Δεν μπήκα. Στάθηκα στο κατώφλι με τα πόδια ακόμα στο χώμα. Ένας μικρός άνεμος έβγαινε από μέσα ζεστός. Άκουσα νερό πολύ μακριά. Έκανα ένα βήμα πίσω και η πόρτα έμεινε ανοιχτή. Κάθισα σε μια πέτρα και την κοίταζα μέχρι να ξυπνήσω.",
         "Threshold without entry is the image; do not invent what lies beyond.",
         ["Enlightenment", "Death's door", "You refused your calling"],
         ["numinous"]),
    case("dead-grandmother-silent-garden", "Η γιαγιά στον κήπο", "medium",
         ["numinous"], ["multiple_characters", "incomplete_ending"],
         "Η γιαγιά μου, που έχει πεθάνει, καθόταν στον κήπο σε μια πλαστική καρέκλα και χαμογελούσε χωρίς να μιλά. Τα λουλούδια ήταν κανονικά, όχι υπερβολικά. Της έφερα νερό και το άφησα δίπλα της. Το πήρε και ήπιε. Με κοίταξε σαν να με αναγνώριζε. Δεν με αγκάλιασε. Εγώ κάθισα στο χώμα μπροστά της. Ο ήλιος έπεφτε πίσω από τον τοίχο. Έμεινα εκεί μέχρι που ο κήπος άρχισε να σκοτεινιάζει και εκείνη ήταν ακόμα καθιστή.",
         "Recognition without speech; do not invent a farewell message.",
         ["She forgives you", "Unresolved grief work", "A warning from the dead"],
         ["numinous"]),
    case("black-lake-stars-at-noon", "Η λίμνη το μεσημέρι", "short",
         ["numinous", "strange_surreal"], ["incomplete_ending"],
         "Στεκόμουν σε μια μαύρη λίμνη το μεσημέρι και στην επιφάνεια φαίνονταν αστέρια σαν να ήταν νύχτα. Ο ουρανός πάνω μου ήταν φωτεινός. Έσκυψα και τα αστέρια δεν κουνήθηκαν. Έβαλα ένα δάχτυλο στο νερό και ήταν κρύο. Τράβηξα το χέρι. Περίμενα να δω το πρόσωπό μου και έβλεπα μόνο τον έναστρο μαύρο.",
         "Noon sky versus star-lake; do not invent a cosmic self.",
         ["You have no identity", "The unconscious as textbook", "Apocalypse"],
         ["numinous"]),
    case("nameless-bird-on-chest", "Το πουλί στο στήθος", "short",
         ["numinous"], ["incomplete_ending"],
         "Ένα πουλί χωρίς όνομα κάθισε στο στήθος μου ενώ ήμουν ξαπλωμένη στο γρασίδι. Ζύγιζε λίγο και ήταν ζεστό. Δεν πέταξε όταν αναπνεύσα. Το κοίταξα και δεν αναγνώρισα το είδος. Τα μάτια του ήταν στρογγυλά και ήρεμα. Έμεινε μέχρι που ξύπνησα με το βάρος ακόμα στη μνήμη του δέρματος.",
         "Warm weight on the chest; do not invent a soul-animal.",
         ["A spirit guide", "Heart disease omen", "You must become free"],
         ["numinous"]),
    # --- 8 transformations ---
    case("hands-become-paper-fold", "Τα χαρτοχέρια", "short",
         ["transformation_body_change_metamorphosis"], ["affect_shift"],
         "Τα χέρια μου έγιναν λεπτό χαρτί ενώ καθόμουν στο τραπέζι. Τα δίπλωσα στη μέση χωρίς να σκιστούν. Ένιωθα ακόμα τις αρθρώσεις σαν τσακίσεις. Δεν φοβήθηκα αμέσως. Προσπάθησα να πιάσω το ποτήρι και το χαρτί λύγισε γύρω από το γυαλί. Μετά τα χέρια ξεδίπλωσαν μόνα τους και ήταν πάλι δέρμα, λίγο ζεστά.",
         "Paper-fold then return; do not invent fragility of character.",
         ["You are weak", "Self-erasure", "A wish not to act"],
         ["transformation"]),
    case("mouth-fills-with-seeds", "Οι σπόροι στο στόμα", "medium",
         ["transformation_body_change_metamorphosis"], ["affect_shift", "incomplete_ending"],
         "Το στόμα μου γέμισε μικρούς σπόρους ενώ μιλούσα σε κάποιον που δεν έβλεπα καθαρά. Τους έφτυσα στην παλάμη και φύτρωναν αμέσως λεπτά πράσινα. Δεν πονούσα. Ένιωθα μόνο ότι δεν χωρούσαν λέξεις. Έβαλα τους βλαστούς στο περβάζι. Το στόμα άδειασε. Δοκίμασα να πω μια λέξη και βγήκε κανονικά. Οι βλαστοί συνέχισαν να στέκονται στο φως.",
         "Seeds replacing speech then speech returns; do not invent silenced truth as diagnosis.",
         ["You cannot speak your truth", "Fertility symbolism", "Oral fixation"],
         ["transformation"]),
    case("you-split-into-two-walkers", "Οι δύο περπατητές", "medium",
         ["transformation_body_change_metamorphosis"], ["scene_shift", "changing_locations", "partial_memory"],
         "Στον δρόμο χωρίστηκα σε δύο σώματα που περπατούσαν παράλληλα στο ίδιο πεζοδρόμιο. Το ένα φορούσε το παλτό μου και το άλλο όχι. Δεν μίλησαν μεταξύ τους. Εγώ ήμουν και τα δύο χωρίς να διαλέξω. Στο φανάρι σταμάτησαν μαζί. Μετά το ένα μπήκε σε ένα περίπτερο και το άλλο περίμενε έξω. Δεν θυμάμαι ποιο ήμουν όταν ξύπνησα.",
         "Split walk is staged; do not invent which self is authentic.",
         ["Dissociation disorder", "A false self", "You must choose a life"],
         ["transformation"]),
    case("skin-turns-glass-then-back", "Το γυάλινο δέρμα", "short",
         ["transformation_body_change_metamorphosis"], ["affect_shift"],
         "Το δέρμα στα μπράτσα έγινε γυαλί και έβλεπα τις φλέβες σαν γραμμές. Κάποιος στο λεωφορείο με κοίταξε και μετά κοίταξε αλλού. Δεν ράγισε. Σε δύο στάσεις ξανάγινε δέρμα, λίγο πιο κρύο. Κράτησα την τσάντα στους μηρούς μέχρι να κατέβω.",
         "Glass then skin; do not invent exposure as character.",
         ["You have no boundaries", "People can see your secrets", "Paranoia"],
         ["transformation"]),
    case("child-body-adult-clothes", "Το παιδικό σώμα", "short",
         ["transformation_body_change_metamorphosis"], ["multiple_characters", "scene_shift"],
         "Είχα σώμα παιδιού και φορούσα τα ενήλικα ρούχα μου, μεγάλα στα μανίκια. Περπάτησα σε ένα γραφείο όπου με ήξεραν με το μεγάλο όνομα. Κάθισα σε καρέκλα που τα πόδια μου δεν άγγιζαν το πάτωμα. Μου έδωσαν ένα φάκελο. Τον κράτησα με τα δύο χέρια. Δεν με κορόιδεψε κανείς. Έφυγα από τον διάδρομο σέρνοντας το σακάκι.",
         "Size mismatch is the change; do not invent humiliation unless staged.",
         ["You are immature", "Imposter syndrome", "Regression as diagnosis"],
         ["transformation"]),
    case("house-becomes-boat", "Το σπίτι-βάρκα", "medium",
         ["transformation_body_change_metamorphosis", "strange_surreal"],
         ["scene_shift", "changing_locations", "irrelevant_detail"],
         "Το σπίτι μου στη μέση του δρόμου άρχισε να γέρνει και έγινε βάρκα, με τα έπιπλα να γλιστρούν προς τον τοίχο της κουζίνας. Βγήκα στο μπαλκόνι που ήταν πια πλώρη. Ο δρόμος από κάτω είχε γίνει ρηχό νερό. Οι γείτονες στεκόντουσαν στα πεζοδρόμια και κοιτούσαν χωρίς να φωνάζουν. Έπιασα το κάγκελο. Ένα μαξιλάρι έπεσε στο νερό και έμεινε να επιπλέει. Το σπίτι κουνήθηκε μια φορά και σταθεροποιήθηκε. Δεν αρμένισα πουθενά.",
         "House-to-boat without voyage; do not invent leaving home as life task.",
         ["You must emigrate", "Unstable psyche", "Family is sinking"],
         ["transformation"]),
    case("name-on-arm-fades-and-burns", "Το όνομα στο χέρι", "short",
         ["transformation_body_change_metamorphosis"], ["affect_shift"],
         "Είχα γραμμένο το όνομά μου στο αντιβράχιο με στυλό. Ξέβαφε και την ίδια στιγμή καίγονταν τα γράμματα χωρίς φλόγα, σαν ζεστό σημάδι. Δεν το έσβησα με νερό. Κοίταξα μέχρι που έμεινε μόνο ένα αχνό Ο. Το δέρμα ήταν άθικτο. Κατέβασα το μανίκι στο λεωφορείο.",
         "Name fading and burning together; do not invent identity death.",
         ["You are losing yourself", "A curse", "Need to change your name"],
         ["transformation"]),
    case("eyes-see-from-the-ceiling", "Τα μάτια στο ταβάνι", "medium",
         ["transformation_body_change_metamorphosis"], ["scene_shift", "partial_memory", "incomplete_ending"],
         "Ξάπλωσα στο κρεβάτι και ξαφνικά έβλεπα το δωμάτιο από το ταβάνι, ενώ το σώμα έμενε κάτω με τα μάτια κλειστά. Είδα τα παπούτσια δίπλα στην πόρτα και ένα ποτήρι στο κομοδίνο. Προσπάθησα να κατέβω και δεν ήξερα πώς. Άκουγα την αναπνοή του σώματος. Κάποια στιγμή η θέα κατέβηκε σαν αργό ασανσέρ και ξαναμπήκα πίσω από τα βλέφαρα. Δεν θυμάμαι αν άνοιξα τα μάτια στο κρεβάτι.",
         "Displacement of seeing; do not invent astral doctrine.",
         ["Out-of-body as spiritual attainment", "You are dissociating pathologically", "Death rehearsal"],
         ["transformation"]),
    # --- 6 many unrelated objects ---
    case("attic-clock-pineapple-passport", "Η σοφίτα με τα άσχετα", "medium",
         ["ordinary_banal_low_affect", "strange_surreal"],
         ["many_unrelated_objects", "irrelevant_detail", "incomplete_ending"],
         "Στη σοφίτα υπήρχαν μαζί ένα ξυπνητήρι χωρίς δείκτες, ένας ολόκληρος ανανάς, ένα διαβατήριο ανοιχτό σε κενή σελίδα, ένα βιολί χωρίς δοξάρι και μια νάιλον σακούλα με καπάκια βάζων. Δεν τα άγγιξα όλα. Πήρα μόνο το καπάκι ενός βάζου και το ξαναέβαλα στη σακούλα. Το ρολόι δεν χτύπησε. Ο ανανάς μύριζε ελαφρά. Κάθισα στην άκρη μιας μπαούλας και κοίταξα τα πράγματα χωρίς να τα τακτοποιήσω. Από κάτω ακουγόταν τηλεόραση. Έφυγα από τη σκάλα κρατώντας τα χέρια άδεια.",
         "Many co-present objects, no staged relation among them. Do not build a secret system.",
         ["Each object is a life domain", "You are disorganized as a person", "Travel longing from the passport"],
         ["many_unrelated_objects"]),
    case("beach-typewriter-snowboot-cactus", "Η παραλία με τα άσχετα", "short",
         ["strange_surreal"], ["many_unrelated_objects", "irrelevant_detail"],
         "Στην άμμο υπήρχαν μια γραφομηχανή, μια μπότα του χιονιού, ένας μικρός κάκτος σε γλάστρα και ένα κόκκινο νήμα τυλιγμένο. Κάθισα δίπλα τους. Δεν τα έδεσα μεταξύ τους. Το κύμα δεν τα πήρε. Έγραψα ένα γράμμα στον αέρα πάνω στα πλήκτρα χωρίς χαρτί. Μετά σηκώθηκα και άφησα τα αντικείμενα όπως ήταν.",
         "Inventory without plot; do not invent a code.",
         ["Writer's block", "Emotional coldness from the boot", "The thread is fate"],
         ["many_unrelated_objects"]),
    case("office-fishbowl-saddle-cake", "Το γραφείο με τα άσχετα", "medium",
         ["ordinary_banal_low_affect", "strange_surreal"],
         ["many_unrelated_objects", "multiple_characters", "irrelevant_detail"],
         "Σε ένα γραφείο πάνω στο ίδιο τραπέζι ήταν ένα ενυδρείο χωρίς ψάρια, μια δερμάτινη σέλα αλόγου, μια τούρτα γενεθλίων με σβηστά κεριά και ένα συρραπτικό. Πέρασε μια συνάδελφος και πήρε μόνο το συρραπτικό. Εγώ δεν μετακίνησα τα άλλα. Το νερό στο ενυδρείο ήταν ακίνητο. Η τούρτα μύριζε βανίλια. Κάθισα και άνοιξα έναν υπολογιστή που έδειχνε κενή επιφάνεια. Δεν έκοψα τούρτα. Δεν κάθισα στη σέλα.",
         "Colleague takes one tool; other objects remain unlinked. Do not force a birthday meaning.",
         ["Uncelebrated self", "You missed your own party", "Work has replaced life"],
         ["many_unrelated_objects"]),
    case("bus-aquarium-ladder-dress", "Το λεωφορείο με τα άσχετα", "long",
         ["strange_surreal"],
         ["many_unrelated_objects", "multiple_characters", "scene_shift", "changing_locations", "irrelevant_detail", "incomplete_ending"],
         "Μπήκα σε ένα λεωφορείο όπου στις θέσεις δεν κάθονταν μόνο άνθρωποι. Δίπλα σε μια ηλικιωμένη υπήρχε ένα μικρό ενυδρείο με ένα ψάρι, στον διάδρομο ήταν ακουμπισμένη μια σκάλα αλουμινίου, και πάνω από μια κενή θέση κρεμόταν ένα άσπρο νυφικό χωρίς σώμα μέσα. Κάθισα πίσω. Ο οδηγός δεν σχολίασε τίποτα. Σε μια στάση ανέβηκε κάποιος με ένα καρπούζι και το έβαλε στην αγκαλιά του. Το ψάρι γύρισε μια φορά. Η σκάλα κουνήθηκε όταν φρέναρε το όχημα. Εγώ κρατούσα το εισιτήριο. Κατέβηκα σε μια στάση που δεν αναγνώρισα, άφησα το νυφικό εκεί που ήταν, και περπάτησα σε έναν δρόμο με κλειστά μαγαζιά. Δεν πήρα τίποτα μαζί μου. Δεν μίλησα στον οδηγό. Το λεωφορείο έφυγε με όλα τα αντικείμενα ακόμα μέσα.",
         "Crowded co-presence of unrelated things; do not marry dress to fish to ladder.",
         ["Unlived wedding", "You need to climb out", "The fish is the soul"],
         ["many_unrelated_objects"]),
    case("kitchen-globe-skate-trumpet", "Η κουζίνα με τα άσχετα", "short",
         ["ordinary_banal_low_affect"], ["many_unrelated_objects", "irrelevant_detail"],
         "Στο τραπέζι της κουζίνας ήταν μια υδρόγειος, ένα παγοπέδιλο και μια τρομπέτα. Έβραζα νερό. Δεν τα άγγιξα. Το νερό έβρασε. Έκανα ένα τσάι. Η υδρόγειος είχε μια μικρή γρατζουνιά στην Αφρική. Έφυγα με την κούπα και τα άφησα εκεί.",
         "Three objects plus tea; no staged link.",
         ["World-travel desire", "A silenced voice in the trumpet", "Frozen emotion"],
         ["many_unrelated_objects", "banal_low_affect"]),
    case("yard-fax-watermelon-helmet", "Η αυλή με τα άσχετα", "short",
         ["strange_surreal"], ["many_unrelated_objects", "irrelevant_detail"],
         "Στην αυλή ήταν ένα παλιό φαξ στο χώμα, ένα καρπούζι κομμένο στη μέση και ένα κράνος μηχανής ανάποδα που μάζευε βρόχινο νερό. Πέρασα ανάμεσά τους για να βγω στη ρόδα. Δεν τα μετακίνησα. Το φαξ δεν είχε καλώδιο. Το καρπούζι μύριζε γλυκά. Έφυγα από την καγκελόπορτα.",
         "Yard inventory; do not invent a ritual.",
         ["Communication breakdown from the fax", "Protection from the helmet", "Summer nostalgia"],
         ["many_unrelated_objects"]),
    # --- 6 relational staged ---
    case("sister-braids-then-stops", "Το πλεξούδι της αδελφής", "short",
         ["relational_intimate_erotic_vital"], ["multiple_characters", "staged_relation", "affect_shift"],
         "Η αδελφή μου έπλεκε τα μαλλιά μου αργά και μετά σταμάτησε απότομα στη μέση, με τα χέρια ακόμα στα μαλλιά. Δεν εξήγησε. Περίμενα. Ξεκίνησε πάλι για δύο κινήσεις και ξανασταμάτησε. Άφησε την πλεξούδα μισοτελειωμένη και σηκώθηκε. Εγώ έμεινα στην καρέκλα. Ακούστηκε η πόρτα του μπάνιου. Δεν γύρισα.",
         "Start-stop contact is staged; do not invent a fight.",
         ["She is angry at you", "Childhood trauma", "You were abandoned"],
         ["relational_staged"]),
    case("lover-walks-you-follow-they-wait", "Το ακολουθήμα", "medium",
         ["relational_intimate_erotic_vital"], ["multiple_characters", "staged_relation", "changing_locations"],
         "Εκείνη έφυγε από την πλατεία χωρίς να με καλέσει. Την ακολούθησα. Στη γωνία σταμάτησε και περίμενε χωρίς να γυρίσει, σαν να ήξερε ότι ερχόμουν. Πλησίασα. Ξεκίνησε πάλι. Το κάναμε ως τη γέφυρα. Εκεί γύρισε, με κοίταξε μία φορά, και δώσαμε τα χέρια. Προχωρήσαμε δίπλα-δίπλα ως τη μέση της γέφυρας και σταθήκαμε. Ο αέρας τραβούσε τα μαλλιά της. Δεν μιλήσαμε.",
         "Approach, wait, join is staged relation; do not invent a test of love.",
         ["She is testing you", "Fear of abandonment", "You must commit"],
         ["relational_staged"]),
    case("father-wet-coat-you-refuse", "Το βρεγμένο παλτό", "short",
         ["relational_intimate_erotic_vital"], ["multiple_characters", "staged_relation"],
         "Ο πατέρας μου μου έτεινε ένα βρεγμένο παλτό στην είσοδο. Το άγγιξα και το αρνήθηκα, το έσπρωξα πίσω στα χέρια του. Δεν θύμωσε φανερά. Το κρέμασε στην καρέκλα. Πέρασα δίπλα του για να μπω. Τα παπούτσια μου άφησαν νερό στο πάτωμα. Εκείνος έμεινε στην είσοδο.",
         "Offer and refusal are staged; do not invent lifelong conflict.",
         ["You reject paternal care", "Oedipal reading", "He is disappointed forever"],
         ["relational_staged"]),
    case("friend-pulls-you-pull-back", "Το τράβηγμα στο πλήθος", "short",
         ["relational_intimate_erotic_vital"], ["multiple_characters", "staged_relation", "affect_shift"],
         "Σε ένα πλήθος ο φίλος μου με τράβηξε από το μανίκι προς μια πόρτα. Τράβηξα πίσω το χέρι. Με κοίταξε. Ξαναέπιασε τον καρπό πιο απαλά. Αυτή τη φορά πήγα μαζί του δύο βήματα και μετά στάθηκα. Με άφησε. Μείναμε στο ίδιο σημείο με τον κόσμο να περνά ανάμεσά μας.",
         "Pull and counter-pull are staged; do not invent rescue or control as character.",
         ["He is controlling", "You cannot trust friends", "Agoraphobia"],
         ["relational_staged"]),
    case("stranger-matches-pace", "Το ίδιο βήμα", "medium",
         ["relational_intimate_erotic_vital"], ["multiple_characters", "staged_relation"],
         "Ένας άγνωστος στον δρόμο προσαρμοζόταν στο βήμα μου. Όταν επιτάχυνα, επιτάχυνε. Όταν σταμάτησα μπροστά σε μια βιτρίνα, σταμάτησε κι εκείνος χωρίς να με κοιτάξει. Ξεκίνησα πάλι. Μετά από ένα τετράγωνο σταμάτησα απότομα και σταμάτησε μαζί μου. Τότε με κοίταξε για πρώτη φορά και χαμήλωσε το κεφάλι. Εγώ δεν μίλησα. Συνέχισα μόνη και δεν με ακολούθησε άλλο.",
         "Matched pace then release is staged; do not invent stalking as waking crime.",
         ["You are in danger", "A secret admirer story", "Street harassment as the meaning"],
         ["relational_staged"]),
    case("child-string-you-let-go", "Το σπάγκο του παιδιού", "short",
         ["relational_intimate_erotic_vital"], ["multiple_characters", "staged_relation"],
         "Ένα παιδί μου έδωσε το σπάγκο ενός μπαλονιού και τον κράτησα. Το μπαλόνι τράβηξε λίγο το χέρι. Με κοίταξε. Μετά άφησα τον σπάγκο και το μπαλόνι ανέβηκε. Το παιδί δεν έκλαψε. Έπιασε το άδειο χέρι μου για ένα δευτερόλεπτο και το άφησε. Έφυγε προς τις κούνιες. Εγώ κοίταξα το μπαλόνι μέχρι που έγινε τελεία.",
         "Give, hold, release is staged; do not invent parental failure.",
         ["You fail children", "You cannot commit", "Loss of innocence lecture"],
         ["relational_staged"]),
    # --- 6 relational-looking unstaged ---
    case("two-people-same-cafe-no-look", "Το καφέ χωρίς βλέμμα", "short",
         ["relational_looking_unstaged", "ordinary_banal_low_affect"],
         ["multiple_characters", "unstaged_cooccurrence"],
         "Καθόμουν σε ένα καφέ και σε διπλανό τραπέζι καθόταν κάποιος με μια τσάντα ίδια σχεδόν με τη δική μου. Δεν κοιταχτήκαμε. Ήπια τον καφέ. Εκείνος διάβαζε. Πλήρωσα και έφυγα. Δεν ξέρω πότε έφυγε εκείνος. Η καρέκλα του ήταν ακόμα τραβηγμένη όταν βγήκα.",
         "Same room, similar bag, no look or exchange. Co-occurrence is not relation.",
         ["A soulmate missed", "Fear of intimacy", "You should have spoken"],
         ["relational_looking_unstaged"]),
    case("couple-on-bench-you-apart", "Το παγκάκι", "short",
         ["relational_looking_unstaged"], ["multiple_characters", "unstaged_cooccurrence"],
         "Ένα ζευγάρι καθόταν στο παγκάκι και εγώ κάθισα στο άλλο άκρο χωρίς να μιλήσουμε. Κρατιόντουσαν από το χέρι μεταξύ τους, όχι με μένα. Κοίταζα τα περιστέρια. Σηκώθηκαν και έφυγαν. Εγώ έμεινα. Δεν με κοίταξαν φεύγοντας.",
         "Their relation is with each other; you are co-present only.",
         ["You are excluded from love", "Envy as the topic", "Third-wheel psychology"],
         ["relational_looking_unstaged"]),
    case("elevator-coworker-silence", "Το ασανσέρ", "short",
         ["relational_looking_unstaged", "ordinary_banal_low_affect"],
         ["multiple_characters", "unstaged_cooccurrence"],
         "Μπήκα στο ασανσέρ με μια συνάδελφο. Κανείς δεν μίλησε. Και οι δύο κοιτάξαμε τον αριθμό των ορόφων. Εκείνη κατέβηκε στο τρία. Εγώ συνέχισα στο πέντε. Δεν ανταλλάξαμε ούτε νεύμα.",
         "Shared cabin without gesture is not a relationship opening.",
         ["Workplace tension", "Unspoken attraction", "You are invisible"],
         ["relational_looking_unstaged"]),
    case("ex-across-square-no-approach", "Η πλατεία με τον πρώην", "medium",
         ["relational_looking_unstaged"],
         ["multiple_characters", "unstaged_cooccurrence", "incomplete_ending"],
         "Τον είδα στην απέναντι πλευρά της πλατείας. Κι οι δύο περιμέναμε πράσινο. Δεν πλησίασε. Δεν πλησίασα. Τα φώτα άλλαξαν. Περπάτησε ευθεία. Περπάτησα ευθεία στον άλλον δρόμο. Για μια στιγμή ήμασταν στο ίδιο πλάτος του σταυροδρομίου χωρίς να γυρίσουμε κεφάλι. Μετά χάθηκε πίσω από ένα λεωφορείο. Δεν έτρεξα.",
         "Recognition across space without approach; do not invent unfinished business as the question.",
         ["You still love him", "You must get closure", "Cowardice"],
         ["relational_looking_unstaged"]),
    case("waiting-room-two-strangers", "Η αίθουσα αναμονής", "short",
         ["relational_looking_unstaged", "ordinary_banal_low_affect"],
         ["multiple_characters", "unstaged_cooccurrence"],
         "Στην αίθουσα αναμονής καθόμασταν δύο άγνωστοι σε αντικριστές καρέκλες. Φύλλαξε ένα περιοδικό. Εγώ κοίταζα την οθόνη με τους αριθμούς. Μας φώναξαν με διαφορετικά ονόματα. Σηκωθήκαμε σχεδόν μαζί και μπήκαμε σε διαφορετικές πόρτες. Δεν μιλήσαμε.",
         "Parallel waiting is not a dyad.",
         ["Shared fate", "You missed a connection", "Hospital anxiety"],
         ["relational_looking_unstaged"]),
    case("library-same-table-no-talk", "Το κοινό τραπέζι", "short",
         ["relational_looking_unstaged"], ["multiple_characters", "unstaged_cooccurrence", "irrelevant_detail"],
         "Στη βιβλιοθήκη καθίσαμε στο ίδιο μακρύ τραπέζι με έναν άνθρωπο που δεν ήξερα. Τα βιβλία μας δεν ακουμπούσαν. Κάποια στιγμή έπεσε το μολύβι του προς το μέρος μου και το μάζεψε μόνος του πριν φτάσω. Συνέχισα να διαβάζω. Έφυγε πρώτος. Άφησε μια γόμες. Δεν την πήρα.",
         "Near-contact that does not complete; do not turn the pencil into a bond.",
         ["A missed romance", "You are closed off", "The eraser means wiping the past"],
         ["relational_looking_unstaged"]),
]

PADS = {
    "smoke-stair-mother-calls": """
Ο σοβάς στον τοίχο ήταν ζεστός όταν τον άγγιξα με τον ώμο. Κάτω στο πλατύσκαλο ένα χαλάκι είχε μαζέψει στάχτη στις άκρες. Το κουδούνι του ανελκυστήρα χτύπησε άλλη μια φορά, πιο αδύναμα. Από κάποιο διαμέρισμα ακουγόταν νερό σε νιπτήρα που δεν έκλεισε. Το φως του κλιμακοστασίου τρεμόπαιξε και έμεινε κίτρινο. Δεν είδα φλόγα, μόνο τον καπνό να κατεβαίνει σαν ύφασμα. Τα παπούτσια μου γλίστρησαν στο πλακάκι. Κάθισα στα σκαλιά με την παλάμη ανοιχτή, ακόμα ζεστή από το κάγκελο. Κάποιος στον κάτω όροφο έκλεισε ένα παράθυρο. Ο καπνός μύριζε πλαστικό και μαγειρεμένο λάδι. Περίμενα να ακούσω ξανά το όνομά μου και άκουγα μόνο τον ανελκυστήρα να μην έρχεται.
""",
    "child-falls-you-catch-air": """
Τα χόρτα είχαν δροσιά και κόλλησαν στα γόνατά μου όταν έσκυψα. Το παιδί άνοιξε τη βρύση και το νερό έπεφτε στο χώμα κάνοντας μικρό λάκκο. Η γυναίκα πίσω από το τζάμι κούνησε μια φορά την κουρτίνα και σταμάτησε. Ακουγόταν ένα ραδιόφωνο από άλλο μπαλκόνι. Τα χέρια μου έμειναν μπροστά σαν να κρατούσαν ακόμα αέρα. Ένας σκύλος γάβγισε πίσω από έναν φράχτη και σώπασε. Το παιδί έπλυνε τα χέρια του και τα σκούπισε στο παντελόνι. Εγώ κοίταξα το μπαλκόνι: το κάγκελο ήταν στη θέση του, ένα πλαστικό ποτήρι είχε μείνει στο πάτωμα. Ο ήλιος έπεφτε λοξά στον τοίχο. Τα χέρια συνέχιζαν να τρέμουν χωρίς να πέφτουν.
""",
    "fire-you-save-wrong-object": """
Το τασάκι άφησε μια γκρίζα γραμμή στην παλάμη μου. Στον δρόμο μια γάτα πέρασε χωρίς να σταματήσει. Οι σειρήνες πλησίασαν από τη γωνία και το φως τους χτύπησε τα παράθυρα απέναντι. Κάποιος έβγαλε λάστιχο και το άφησε στο πεζοδρόμιο χωρίς να το ανοίξει. Η μυρωδιά ήταν γλυκιά και πικρή μαζί. Κοίταξα τα κλειδιά στο περβάζι από έξω, ακόμα εκεί, και δεν μπήκα. Το τασάκι είχε ένα μικρό αποτσίγαρο κολλημένο στο χείλος. Κάθισα με την πλάτη στον κορμό ενός δέντρου. Ο καπνός συνέχιζε σταθερός. Ένας γείτονας είπε κάτι για τους μετρητές. Εγώ δεν απάντησα. Κρατούσα το μέταλλο μέχρι να κρυώσει αρκετά για να μην καίει.
""",
    "chased-through-hospital": """
Ο διάδρομος είχε πράσινο λινέλαιο που έτριζε κάτω από τα παπούτσια. Σε έναν τοίχο κρεμόταν αφίσα για δωρεά αίματος με μια γωνία ξεκολλημένη. Πέρασα ένα καρότσι με σεντόνια και το σπρώξιμο έκανε μεταλλικό ήχο. Η σκάλα υπηρεσίας μύριζε σκόνη και πορτοκάλι ακόμα πιο έντονα. Το ποτήρι στο πλατύσκαλο είχε μια φυσαλίδα στην επιφάνεια που δεν έσπαγε. Στην τζαμαρία φάνηκε ένα λεωφορείο μακριά, με όλα τα φώτα αναμμένα, να στρίβει. Το χαλί μπροστά στο ασανσέρ είχε ένα μικρό κάψιμο σαν από τσιγάρο. Πάτησα ξανά το κουμπί από συνήθεια και άκουσα μόνο τον άδειο άξονα. Τα βήματα πίσω σταμάτησαν για ένα δευτερόλεπτο και ξανάρχισαν πιο αργά. Έβαλα το χέρι στο πλαίσιο της πόρτας. Το μέταλλο ήταν κρύο. Κάτω στον όροφο μια πόρτα έκλεισε μαλακά. Δεν γύρισα. Το φρεάτιο μύριζε λάδι μηχανής. Τα γόνατα λύγισαν λίγο ακόμα. Περίμενα είτε το άγγιγμα είτε την πτώση και δεν ήρθε κανένα πριν ξυπνήσω. Ένα ρολόι στον τοίχο έδειχνε μια ώρα που δεν πρόλαβα να διαβάσω. Ο διάδρομος πίσω μου έμεινε άδειος στο πλάι του ματιού.
""",
    "wedding-only-grief": """
Το τραπεζομάντιλο είχε έναν λεκέ από κρασί κοντά στο πιάτο μου. Κάποιος χτύπησε το ποτήρι για λόγο και εγώ σήκωσα το δικό μου χωρίς να πιω. Η μουσική άλλαξε σε πιο αργό κομμάτι. Τα παπούτσια μου πίεζαν τις φτέρνες. Κοίταξα τα χέρια μου στο τραπέζι και ήταν ακίνητα.
""",
    "hug-that-hurts-and-comforts": """
Το σακάκι του μύριζε βροχή. Άκουγα μια πόρτα στον κάτω όροφο να κλείνει. Το σημάδι στα πλευρά ζεσταινόταν σιγά. Δεν άλλαξα στάση. Το φως του κλιμακοστασίου έμεινε το ίδιο.
""",
    "homecoming-feels-like-exile": """
Στην κουζίνα το ρολόι του τοίχου χτυπούσε κανονικά. Το φαγητό ήταν ζεστό και χωρίς αλάτι αρκετό. Έπιασα το ποτήρι νερό και το άδειασα. Έξω στην αυλή μια πλαστική καρέκλα ήταν ανάποδα δίπλα στον τοίχο. Ο δρόμος είχε ένα αυτοκίνητο σταθμευμένο με τα φώτα σβηστά. Ένα σκυλί γάβγισε μακριά. Η μητέρα μου μάζεψε τα πιάτα χωρίς να ρωτήσει τίποτα. Εγώ έμεινα στην πόρτα της αυλής με το χέρι στο κούφωμα. Το χαλάκι μέσα είχε ακόμα το σχήμα του παλιού παπουτσιού. Ο ουρανός ήταν γκρίζος χωρίς βροχή. Δεν θυμάμαι αν είπα καληνύχτα. Κάθισα λίγο στην καρέκλα της γωνίας πριν βγω ξανά. Η μυρωδιά του σαπουνιού έμεινε στα ρούχα.
""",
    "kiss-metal-and-honey": """
Το κάγκελο του λιμανιού ήταν κρύο στα δάχτυλα. Ένα σχοινί χτυπούσε ρυθμικά σε δέστρα. Δεν ρώτησα για τη γεύση. Εκείνος κοίταζε τα φώτα. Εγώ κατάπια άλλη μια φορά και η γεύση έμεινε.
""",
    "safe-and-cannot-breathe": """
Το πάτωμα είχε ένα χαλί με γεωμετρικό σχέδιο που μπορούσα να μετρήσω. Άκουγα ψυγείο από την κουζίνα. Το παράθυρο χτύπησε μια φορά στον άνεμο και σταμάτησε. Μετρούσα ως το τέσσερα και ξανά.
""",
    "wanted-gift-makes-you-sick": """
Το εξώφυλλο είχε μια μικρή γρατζουνιά στη γωνία. Κάποιος γέμισε ξανά τα ποτήρια. Η ναυτία ανέβαινε όταν μύριζα τη σελίδα χωρίς να τη διαβάσω. Χαμήλωσα το βιβλίο στο τραπέζι και το ξανάπιασα.
""",
    "white-horse-empty-church": """
Τα πατώματα έτριζαν όταν μετακίνησα το βάρος. Ένα στασίδι είχε σκαλισμένο σταυρό ξεθωριασμένο. Το άλογο χτύπησε μια φορά την οπλή στο μάρμαρο και ξανάγινε ακίνητο. Σκόνη χόρευε στο χρυσό φως. Έξω πέρασε ένα μηχανάκι και ο ήχος έσβησε. Δεν άνοιξα κανένα κερί. Η πόρτα πίσω μου έμεινε μισάνοιχτη. Κάθισα στο στασίδι με τα χέρια στους μηρούς. Το πουλί στον τρούλο μετακινήθηκε. Το άλογο ανέπνεε ορατά στον δροσερό αέρα. Δεν πλησίασα άλλο. Όταν σηκώθηκα, τα γόνατά μου είχαν σημάδι από το ξύλο.
""",
    "voiceless-in-olive-grove": """
Το χώμα ήταν στεγνό και γλιστερό από μικρές πέτρες. Άκουσα ένα τρακτέρ πολύ μακριά. Τα φύλλα είχαν σκόνη ανοιχτόχρωμη. Περίμενα με το αυτί γυρισμένο προς το κέντρο του χωραφιού. Δεν ήρθε λέξη. Μια μέλισσα πέρασε δίπλα στο αυτί μου. Κάθισα στο πεζούλι και έβγαλα ένα μικρό κλαδί από το παπούτσι. Ο ήλιος είχε κατέβει πίσω από τον λόφο χωρίς να φύγει εντελώς. Τα χέρια μου μύριζαν ρητίνη. Σηκώθηκα και κοίταξα πίσω ανάμεσα στους κορμούς. Τίποτα δεν κουνήθηκε. Περπάτησα ως το μονοπάτι του χωριού και σταμάτησα στην πρώτη λάμπα που δεν είχε ανάψει ακόμα.
""",
    "mountain-door-of-light": """
Το μονοπάτι είχε ρίζες που σήκωναν την πέτρα. Κάθισα στη πέτρα μέχρι να κρυώσουν τα γόνατα. Ο ζεστός αέρας από την πόρτα μύριζε σκόνη και θυμάρι. Άκουσα πάλι το νερό, πιο καθαρά όταν έκλεισα τα μάτια. Δεν έβαλα το χέρι μέσα στο φως. Ένα μικρό έντομο πέρασε το κατώφλι και χάθηκε. Τα παπούτσια μου είχαν λάσπη στις σόλες. Ο ουρανός πίσω μου ήταν κανονικός, γκρίζος. Η πόρτα δεν στένεψε. Έμεινα με την πλάτη στο χώμα του μονοπατιού και τα πόδια προς το φως. Δεν μέτρησα τον χρόνο. Όταν ξύπνησα, θυμόμουν μόνο τη θερμοκρασία του αέρα.
""",
    "dead-grandmother-silent-garden": """
Το ποτήρι που της άφησα είχε δαχτυλίδι νερό στη βάση. Τα μυρμήγκια περπατούσαν στην άκρη του πλακόστρωτου. Εκείνη ήπιε και άφησε το ποτήρι στο χώμα δίπλα στην καρέκλα. Δεν μίλησα για αρρώστια ή για σπίτι. Ένα πουλί κάθισε στο σύρμα και έφυγε. Ο τοίχος είχε ξεφλουδισμένο χρώμα. Κάθισα μέχρι να φαίνονται λιγότερο τα λουλούδια. Το χαμόγελό της δεν μεγάλωσε και δεν έσβησε. Άκουγα μακριά ένα αυτοκίνητο. Έμεινα. Μια πλαστική ποτιστήρα ήταν δίπλα στον τοίχο, άδεια. Το χώμα στα παπούτσια μου κόλλησε. Δεν τη ρώτησα τίποτα.
""",
    "mouth-fills-with-seeds": """
Οι βλαστοί στο περβάζι ήταν λεπτοί σαν κλωστές. Το στόμα μύριζε χώμα γλυκό. Ο άλλος άνθρωπος έμεινε θολός, σαν πίσω από τζάμι. Κατάπια σάλιο χωρίς σπόρο. Δοκίμασα δεύτερη λέξη και βγήκε κι αυτή καθαρή. Το φως στο περβάζι δεν κουνήθηκε. Άφησα τα χέρια ανοιχτά πάνω στο τραπέζι. Δεν ξανάφτυσα. Οι βλαστοί έμειναν όρθιοι χωρίς γλάστρα, απλώς στο ξύλο. Δεν τους πότισα. Το τραπέζι είχε ένα ποτήρι νερό που δεν ήπια. Άκουγα πουλιά έξω. Ο θολός άνθρωπος δεν πλησίασε. Έμεινα να κοιτάζω τους βλαστούς μέχρι να μην μεγαλώνουν άλλο μπροστά μου. Ο ήχος του ρολογιού ήταν κανονικός.
""",
    "you-split-into-two-walkers": """
Το πεζοδρόμιο είχε μια σχισμή που και τα δύο σώματα την προσπέρασαν με το ίδιο βήμα. Στο περίπτερο φάνηκαν πακέτα τσίχλες και ένα ψυγείο με νερά. Το σώμα χωρίς παλτό περίμενε με τα χέρια στις τσέπες. Το άλλο πλήρωσε κάτι που δεν είδα. Ένα λεωφορείο πέρασε και τα δύο κεφάλια γύρισαν μαζί. Μετά ξανακοίταξαν μπροστά. Στο επόμενο φανάρι το ένα σώμα έμεινε πίσω μισό βήμα και ξαναίσιωσε. Δεν μίλησαν. Ο αέρας κουνούσε μόνο το παλτό. Δεν θυμάμαι ποιο χέρι κρατούσε το κλειδί του σπιτιού. Ένας σκύλος πέρασε ανάμεσα τους χωρίς να τα μυρίσει χωριστά. Συνέχισαν παράλληλα ως τη στάση και στάθηκαν στην ίδια γραμμή.
""",
    "skin-turns-glass-then-back": """
Το λεωφορείο σταμάτησε σε φανάρι. Είδα τις φλέβες σαν χάρτη και μετά δέρμα. Κράτησα την τσάντα πιο σφιχτά. Κανείς δεν ξανακοίταξε. Κατέβηκα στην ίδια στάση που κατεβαίνω πάντα.
""",
    "house-becomes-boat": """
Στην κουζίνα ένα ποτήρι κύλησε ως το ντουλάπι και σταμάτησε. Το μαξιλάρι στο νερό του δρόμου γύρισε αργά. Οι γείτονες έβγαλαν τηλέφωνα και τα κατέβασαν χωρίς να βγάλουν φωτογραφία. Το κάγκελο έτριζε. Ένα ποδήλατο στο απέναντι πεζοδρόμιο έμεινε δεμένο. Το νερό δεν ανέβηκε στις μπότες κανενός. Η βάρκα-σπίτι έγειρε ελάχιστα προς τα δεξιά και ισορρόπησε. Κοίταξα το σαλόνι μέσα από το τζάμι: ο καναπές είχε μαζευτεί στον τοίχο. Δεν άνοιξα πόρτα προς το νερό. Κάθισα στην πλώρη με τα πόδια μέσα.
""",
    "name-on-arm-fades-and-burns": """
Το μανίκι μύριζε πλαστικό από το λεωφορείο. Το αχνό Ο φαινόταν μόνο όταν έστριβα τον καρπό στο φως. Δεν το έδειξα σε κανέναν. Κράτησα την τσάντα πάνω από το χέρι.
""",
    "eyes-see-from-the-ceiling": """
Από πάνω είδα μια κάλτσα κάτω από το κρεβάτι και το καλώδιο του φορτιστή στο πάτωμα. Η αναπνοή του σώματος ήταν κανονική. Προσπάθησα να κουνήσω ένα δάχτυλο κάτω και δεν ήξερα αν κουνήθηκε. Το ποτήρι στο κομοδίνο είχε δαχτυλίδι νερό. Η θέα κατέβηκε αργά σαν να με τραβούσε ένα αόρατο νήμα πίσω στα βλέφαρα. Στο τέλος ήμουν πάλι στο σκοτάδι των ματιών. Δεν σηκώθηκα. Το ταβάνι από μέσα δεν φαινόταν πια. Άκουγα το ψυγείο από την κουζίνα. Η κουρτίνα κουνήθηκε λίγο. Έμεινα στο κρεβάτι χωρίς να ανοίξω τα μάτια για να ελέγξω το δωμάτιο.
""",
    "attic-clock-pineapple-passport": """
Η μπαούλα μύριζε ναφθαλίνη. Το βιολί είχε μια χορδή χαλαρή. Το διαβατήριο δεν είχε σφραγίδα στη σελίδα που έβλεπα. Άκουσα την τηλεόραση να αλλάζει κανάλι. Το ξυπνητήρι είχε σκόνη στα κουμπιά. Δεν το κούρδισα. Ο ανανάς άφησε μια μικρή υγρασία στο χαρτόνι από κάτω. Τα καπάκια χτύπησαν μεταξύ τους όταν ξαναέβαλα αυτό που είχα πιάσει. Κατέβηκα τη σκάλα κρατώντας το κάγκελο. Κάτω η κουζίνα ήταν σκοτεινή εκτός από το φως του απορροφητήρα. Δεν πήρα τίποτα μαζί μου.
""",
    "office-fishbowl-saddle-cake": """
Ο υπολογιστής έβγαλε έναν χαμηλό ήχο ανεμιστήρα. Η σέλα είχε μυρωδιά δέρματος παλιού. Το ενυδρείο είχε μια φυσαλίδα κολλημένη στο γυαλί. Η συνάδελφος έκλεισε την πόρτα πίσω της με το συρραπτικό στο χέρι. Εγώ άνοιξα ένα συρτάρι με συνδετήρες και το ξανάκλεισα. Δεν έκοψα τούρτα. Το κερί το άγγιξα και ήταν κρύο. Κάθισα μέχρι να σβήσει η οθόνη μόνη της. Από τον διάδρομο ακουγόταν εκτυπωτής. Ένα ποτήρι νερό δίπλα στην τούρτα έμεινε γεμάτο. Δεν κάθισα στη σέλα και δεν έβαλα χέρι στο νερό του ενυδρείου. Η καρέκλα έτριξε όταν μετακινήθηκα.
""",
    "bus-aquarium-ladder-dress": """
Το λεωφορείο μύριζε ζεστό πλαστικό και πορτοκάλι από κάποιο σακουλάκι. Η ηλικιωμένη άνοιξε μια τσάντα και έβγαλε ένα εισιτήριο χωρίς να κοιτάξει το ενυδρείο. Το ψάρι γύρισε προς το γυαλί και έμεινε. Η σκάλα χτύπησε ξανά στο φρενάρισμα και κανείς δεν την κράτησε. Το νυφικό κουνήθηκε σαν να υπήρχε αεράκι από το παράθυρο της οροφής. Ο άνθρωπος με το καρπούζι το ακούμπησε στα γόνατα και το κράτησε με τα δύο χέρια. Εγώ κοίταξα έξω: κλειστά φαρμακεία, ένα περίπτερο ανοιχτό, ένα σκυλί δεμένο. Στην άγνωστη στάση το χώμα του πεζοδρομίου ήταν βρεγμένο χωρίς βροχή εκείνη τη στιγμή. Περπάτησα δύο τετράγωνα. Άκουγα ακόμα τον κινητήρα να φεύγει. Δεν γύρισα να δω αν το νυφικό έμεινε κρεμασμένο. Ένα φανάρι άναψε κόκκινο σε άδειο σταυροδρόμι. Στάθηκα μέχρι να πρασινίσει χωρίς να διασταυρωθώ με κανέναν. Μετά συνέχισα δίπλα σε ρολά κατεβασμένα. Ένα περίπτερο είχε εφημερίδες δεμένες. Ένα σκυλί γάβγισε πίσω από κάγκελο. Πέρασα ένα κλειστό σχολείο με αυλή άδεια. Δεν πήρα ταξί. Κάθισα λίγο σε μια στάση χωρίς πινακίδα και σηκώθηκα πάλι. Τα παπούτσια μου είχαν λάσπη. Ο ουρανός ήταν ανοιχτός χωρίς σύννεφα που να θυμάμαι. Συνέχισα ίσια μέχρι που ο δρόμος στένεψε.
""",
    "kitchen-globe-skate-trumpet": """
Η τρομπέτα είχε ένα πανί σκονισμένο στο στόμιο. Το παγοπέδιλο έσταζε ελάχιστα στο τραπεζομάντιλο. Η υδρόγειος γύρισε μισή μοίρα όταν ακούμπησα το τραπέζι σηκώνοντας την κούπα. Δεν την ξαναγύρισα.
""",
    "lover-walks-you-follow-they-wait": """
Η πλατεία είχε περιστέρια γύρω από ένα παγκάκι. Στη γωνία μια βιτρίνα έδειχνε παπούτσια. Στη γέφυρα το νερό από κάτω ήταν σκοτεινό και αργό. Τα δάχτυλά της ήταν κρύα. Μείναμε στη μέση χωρίς να κοιτάξουμε πίσω. Ένα ποδήλατο πέρασε. Ο άνεμος μύριζε ποτάμι. Δεν ρώτησα πού πάμε. Κάτω από τη γέφυρα πέρασε ένα μικρό σκάφος με ένα φως. Τα μαλλιά της χτυπούσαν στο πρόσωπό μου όταν γύριζε ο αέρας. Κρατηθήκαμε ακόμα. Δεν προχωρήσαμε στην άλλη όχθη. Ένα αυτοκίνητο πέρασε αργά. Μείναμε. Το ξύλο της γέφυρας έτριζε λίγο κάτω από τα παπούτσια.
""",
    "stranger-matches-pace": """
Η βιτρίνα έδειχνε ρολόγια σταματημένα στην ίδια ώρα. Όταν σταμάτησα, εκείνος έδεσε τα κορδόνια χωρίς να τα χρειάζεται. Μετά το τετράγωνο ένα σκυλί γάβγισε πίσω από πόρτα. Συνέχισα μόνη και άκουσα μόνο τα δικά μου βήματα. Δεν γύρισα να δω αν έμεινε στη γωνία. Ο δρόμος είχε υγρά φύλλα στο πεζοδρόμιο. Πέρασα ένα κλειστό ταχυδρομείο. Ένα λεωφορείο σταμάτησε χωρίς να κατέβει κανείς. Συνέχισα δύο τετράγωνα ακόμα με σταθερό βήμα. Δεν άκουσα δεύτερο βήμα πίσω μου. Ένα παράθυρο άνοιξε πάνω και έκλεισε. Συνέχισα ίσια. Η σκιά μου ήταν μόνη στον τοίχο. Πέρασα μια στάση χωρίς να σταματήσω.
""",
    "two-people-same-cafe-no-look": """
Ο καφές είχε λίγο αφρό που έσπασε. Η καρέκλα έτριξε όταν σηκώθηκα. Άφησα ρέστα στο πιατάκι. Η τσάντα μου χτύπησε ελαφρά το τραπέζι. Εκείνος δεν σήκωσε τα μάτια από τη σελίδα.
""",
    "couple-on-bench-you-apart": """
Τα περιστέρια πλησίασαν ψίχουλα που δεν είχα ρίξει εγώ. Το ζευγάρι μιλούσε χαμηλά μεταξύ τους. Εγώ έδεσα τα κορδόνια. Έμεινα μέχρι να φύγουν τα πουλιά.
""",
    "elevator-coworker-silence": """
Το ασανσέρ μύριζε μέταλλο και σαπούνι. Κάποιος όροφος είχε αυτοκόλλητο με αριθμό ξεφλουδισμένο. Οι πόρτες άνοιξαν στο τρία με έναν μικρό ήχο. Εγώ κοίταξα το ταβάνι μέχρι το πέντε.
""",
    "ex-across-square-no-approach": """
Η πλατεία είχε σκαλωσιές σε μια πρόσοψη. Το πράσινο κράτησε πολύ. Ένα μηχανάκι πέρασε ανάμεσα στις διαβάσεις. Το λεωφορείο που τον έκρυψε είχε διαφήμιση που δεν διάβασα. Περπάτησα μέχρι τη στάση χωρίς να σταματήσω. Δεν έβγαλα τηλέφωνο. Ο δρόμος μύριζε βρεγμένη άσφαλτο. Ένα παιδί έτρεχε μπροστά σε έναν ενήλικα. Εγώ συνέχισα ευθεία. Στη γωνία ένας άνθρωπος πουλούσε καστανά. Δεν σταμάτησα. Πέρασα το περίπτερο και ένα κλειστό βιβλιοπωλείο. Ο δικός μου δρόμος στένεψε. Δεν γύρισα κεφάλι προς την πλατεία. Ένα ρολόι στον τοίχο μιας τράπεζας έδειχνε μεσημέρι. Τα παπούτσια μου χτύπησαν στο πεζοδρόμιο με σταθερό ρυθμό. Ένα φύλλο κόλλησε στη σόλα και το έβγαλα. Συνέχισα.
""",
    "waiting-room-two-strangers": """
Η οθόνη άλλαξε αριθμό με έναν μπιπ. Το περιοδικό είχε σελίδα σκισμένη. Σηκωθήκαμε χωρίς να πούμε συγγνώμη που σχεδόν σκουντηθήκαμε. Οι πόρτες έκλεισαν χώρια.
""",
}


def main() -> None:
    hist = json.loads(HIST.read_text())
    hist_ids = {c["id"] for c in hist["cases"]}
    hist_text = {c["content"].strip() for c in hist["cases"]}
    for c in CASES:
        extra = PADS.get(c["id"])
        if extra:
            c["content"] = (c["content"].rstrip() + " " + extra.strip()).strip()
    ids = [c["id"] for c in CASES]
    if len(ids) != 60:
        raise SystemExit(f"expected 60 cases, got {len(ids)}")
    if len(set(ids)) != 60:
        raise SystemExit("duplicate ids")
    overlap = set(ids) & hist_ids
    if overlap:
        raise SystemExit(f"id overlap with historical fixture: {overlap}")
    for c in CASES:
        n = words(c["content"])
        band = c["length_band"]
        lo, hi = {
            "ultra_short": (8, 44),
            "short": (45, 149),
            "medium": (150, 300),
            "long": (300, 600),
        }[band]
        if not lo <= n <= hi:
            raise SystemExit(f"{c['id']} {band} has {n} words; need {lo}-{hi}")
        if c["content"].strip() in hist_text:
            raise SystemExit(f"content overlap: {c['id']}")
    payload = {
        "version": "1.0.0",
        "benchmark_id": "reflective-question-v1-3-1-freeze-validation-v1",
        "method_id": "reflective-question-oneiros-v1-3-selection-language-decoupling-rd-v0.1.0",
        "source": "synthetic-unseen",
        "prompt_sha256_required": "5d4ba2fe63ca8932064d97b1a0decb36003fb37d20d6dc44f1d6044f54a1d6bf",
        "note": "Unseen adversarial freeze-validation set. Do not retune the frozen decoupling prompt. Historical live-benchmark.v1.json remains untouched.",
        "cases": CASES,
    }
    OUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n")
    buckets: dict[str, int] = {}
    bands: dict[str, int] = {}
    for c in CASES:
        bands[c["length_band"]] = bands.get(c["length_band"], 0) + 1
        for b in c["validation_buckets"]:
            buckets[b] = buckets.get(b, 0) + 1
    print("wrote", OUT)
    print("bands", bands)
    print("buckets", buckets)


if __name__ == "__main__":
    main()
