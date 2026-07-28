/**
 * Patch F DIAGNOSTIC-ONLY fixtures — archetype selection stability.
 * Dreams must not paste production prompt / catalog selectWhen wording.
 */

export const PATCH_F_SUITE_VERSION = 'patch-f-stability.v1.1.0' as const;

export type PatchFPolarity = 'positive' | 'negative';

export type PatchFFixture = {
  id: string;
  polarity: PatchFPolarity;
  phase: 1 | 2;
  dream_language: 'en' | 'el';
  /** Required primary id for positives; empty for true negatives. */
  required_archetype_ids: string[];
  /** Optional secondaries that do not count as label flips when alone with required. */
  acceptable_secondary_ids: string[];
  /** Optional deterministic expectation for the Inner Tensions layer. */
  expected_central_conflicts?: string[];
  /** Explicit null required when no conflict should remain. */
  expected_main_tension?: string | null;
  dream: string;
  notes: string;
};

/** Exact Greek sea-mattress dream from the confirmed ×5 omission issue. */
export const SEA_MATTRESS_EL_DREAM =
  'Είδα ένα όνειρο. Ήμουν ξαπλωμένη σε ένα θαλάσσιο στρώμα, σε μια πολύ γαλήνια θάλασσα και πάνω μου ήταν ξαπλωμένος ο φίλος μου και κοιτούσαμε το βυθό και εξερευνούσαμε όλο το βυθό. Ήταν πολύ ήρεμα, γαλήνια, όμορφα, πάντα πολύ ήρεμα.';

export const PATCH_F_PHASE1_FIXTURE: PatchFFixture = {
  id: 'F_phase1_lover_sea_mattress_el',
  polarity: 'positive',
  phase: 1,
  dream_language: 'el',
  required_archetype_ids: ['lover'],
  acceptable_secondary_ids: [],
  expected_central_conflicts: [],
  expected_main_tension: null,
  dream: SEA_MATTRESS_EL_DREAM,
  notes: 'Confirmed instability seed — mutual intimacy + shared seabed exploration.',
};

/** Phase 2 positives: clear but subtle single-primary (12). */
export const PATCH_F_PHASE2_POSITIVES: PatchFFixture[] = [
  {
    id: 'F_pos_lover_sea_mattress_el',
    polarity: 'positive',
    phase: 2,
    dream_language: 'el',
    required_archetype_ids: ['lover'],
    acceptable_secondary_ids: [],
    expected_central_conflicts: [],
    expected_main_tension: null,
    dream: SEA_MATTRESS_EL_DREAM,
    notes: 'Same seed as Phase 1, scored in the ×5 suite.',
  },
  {
    id: 'F_pos_lover_bench_rain_en',
    polarity: 'positive',
    phase: 2,
    dream_language: 'en',
    required_archetype_ids: ['lover'],
    acceptable_secondary_ids: [],
    expected_central_conflicts: [],
    expected_main_tension: null,
    dream:
      'Someone I lost finds me at a bus stop in light rain. We stand close without speaking. The bus arrives but neither of us boards.',
    notes: 'Quiet devoted proximity organizes the field.',
  },
  {
    id: 'F_pos_anima_garden_gate_en',
    polarity: 'positive',
    phase: 2,
    dream_language: 'en',
    required_archetype_ids: ['anima'],
    acceptable_secondary_ids: [],
    dream:
      'A woman I have never met opens a garden gate behind my childhood house and leads me to a room of unfinished letters. She does not speak my name, yet each letter she hands me rearranges what I thought I wanted. When I try to leave alone the garden dims; when I follow her the path brightens without becoming hers.',
    notes: 'Mediating soul-image opening unknown inner/relational life.',
  },
  {
    id: 'F_pos_guide_black_river_en',
    polarity: 'positive',
    phase: 2,
    dream_language: 'en',
    required_archetype_ids: ['guide_psychopomp'],
    acceptable_secondary_ids: [],
    dream:
      'At a flooded subway platform a quiet ferryman waits with a small boat. He will not take me until I stop shouting for the missing train. When I sit still he poles us through a dark tunnel and leaves me at a dry stairwell marked EXIT, then turns back without following.',
    notes: 'Psychopomp transit across a threshold; guide does not stay.',
  },
  {
    id: 'F_pos_shadow_parking_en',
    polarity: 'positive',
    phase: 2,
    dream_language: 'en',
    required_archetype_ids: ['shadow'],
    acceptable_secondary_ids: ['double'],
    dream:
      'A man with my face chases me through parking garages. I turn a corner and lose him. My reflection waits at the car window, smiling with a key I refused to use.',
    notes: 'Disowned twin / rejected agency pressure.',
  },
  {
    id: 'F_pos_orphan_empty_dorm_en',
    polarity: 'positive',
    phase: 2,
    dream_language: 'en',
    required_archetype_ids: ['orphan'],
    acceptable_secondary_ids: [],
    dream:
      'I return to a boarding school after summer and every bed is stripped. My locker holds only a torn name tag. Staff say the others moved on weeks ago. I walk the halls calling for anyone until the lights click off floor by floor, leaving me alone with my suitcase.',
    notes: 'Abandonment / no belonging structure.',
  },
  {
    id: 'F_pos_mother_kitchen_en',
    polarity: 'positive',
    phase: 2,
    dream_language: 'en',
    required_archetype_ids: ['mother'],
    acceptable_secondary_ids: [],
    dream:
      'An enormous woman fills a stone kitchen. She feeds me broth that warms my chest and wraps me in a shawl that smells like rain soil. Outside a storm tears roofs away, but her table stays steady. When I try to stand without her arm I feel cold immediately; when I lean back into her the storm softens.',
    notes: 'Nurturing containment that organizes safety.',
  },
  {
    id: 'F_pos_father_orchard_en',
    polarity: 'positive',
    phase: 2,
    dream_language: 'en',
    required_archetype_ids: ['father'],
    acceptable_secondary_ids: ['persona', 'shadow'],
    dream:
      'In a cherry orchard I reach for fruit when my father’s call fills the whole field. He demands I drop everything and report my whereabouts now. When I pause, he shouts until the claim owns the hour I had set aside for harvest, though his body is nowhere in the trees.',
    notes: 'Paternal claim on time/attention — expression carries polarity.',
  },
  {
    id: 'F_pos_persona_stage_suit_el',
    polarity: 'positive',
    phase: 2,
    dream_language: 'el',
    required_archetype_ids: ['persona'],
    acceptable_secondary_ids: [],
    dream:
      'Ήμουν σε ένα μεγάλο θέατρο όπου όλοι περίμεναν να παρουσιάσω τα οικονομικά μιας εταιρείας. Πριν βγω στη σκηνή, μου φόρεσαν μια τέλεια σκούρα στολή με το όνομά μου κεντημένο στο στήθος. Μόλις στάθηκα μπροστά στο κοινό, η φωνή μου έγινε ψυχρή και επίσημη, παρότι μέσα μου ήθελα να πω ότι δεν γνώριζα τις απαντήσεις. Κάθε φορά που προσπαθούσα να μιλήσω με τη δική μου φωνή, ο γιακάς έσφιγγε και το κοινό σταματούσε να με βλέπει. Όταν επέστρεψα στα παρασκήνια, προσπάθησα να βγάλω τη στολή, αλλά τα μανίκια είχαν κολλήσει πάνω μου.',
    notes: 'Public mask / role adhesion vs private voice.',
  },
  {
    id: 'F_pos_death_rebirth_seven_doors_el',
    polarity: 'positive',
    phase: 2,
    dream_language: 'el',
    required_archetype_ids: ['death_rebirth'],
    acceptable_secondary_ids: ['guide_psychopomp'],
    dream:
      'Κατέβαινα σε ένα υπόγειο παλάτι περνώντας από επτά διαδοχικές πόρτες. Σε κάθε πόρτα ένας φύλακας μου ζητούσε να αφήσω κάτι: πρώτα το δαχτυλίδι μου, μετά το παλτό, τα παπούτσια, μια κάρτα με το όνομά μου, το περιδέραιο, τη ζώνη και τέλος ένα μικρό στέμμα που δεν ήξερα ότι φορούσα. Στην τελευταία αίθουσα στεκόταν μια σιωπηλή βασίλισσα. Με κοίταξε χωρίς να μιλήσει και έπεσα στο πάτωμα σαν να είχε φύγει όλη η ζωή από μέσα μου. Αργότερα δύο μικρές μορφές έριξαν νερό στο πρόσωπό μου και ξύπνησα μέσα στο όνειρο. Ανέβηκα ξανά από τις επτά πόρτες, αλλά δεν μπορούσα να πάρω πίσω όλα όσα είχα αφήσει. Βγήκα στην επιφάνεια φορώντας μόνο ένα απλό λευκό κορδόνι στον καρπό.',
    notes: 'Descent, stripping, death-like stilling, return changed.',
  },
  {
    id: 'F_pos_animus_compass_en',
    polarity: 'positive',
    phase: 2,
    dream_language: 'en',
    required_archetype_ids: ['animus'],
    acceptable_secondary_ids: ['guide_psychopomp'],
    dream:
      'A stern stranger in a grey coat corrects my map with a single pencil stroke. He does not comfort me; he names the false turn I keep choosing. After he leaves, the correct road stays lit and my earlier excuses look thin. I follow the new line without knowing his name.',
    notes: 'Discriminating logos redirect; not merely a male presence.',
  },
  {
    id: 'F_pos_lover_shared_mattress_en',
    polarity: 'positive',
    phase: 2,
    dream_language: 'en',
    required_archetype_ids: ['lover'],
    acceptable_secondary_ids: [],
    expected_central_conflicts: [],
    expected_main_tension: null,
    dream:
      'I float peacefully on a sea mattress while my boyfriend lies close above me. Together we look down into the water and explore the seabed below us. The whole scene stays calm, beautiful, and safe.',
    notes: 'EN twin of the Greek seed — gentle mutual relatedness.',
  },
  {
    id: 'F_pos_lover_shared_depth_en',
    polarity: 'positive',
    phase: 2,
    dream_language: 'en',
    required_archetype_ids: ['lover'],
    acceptable_secondary_ids: [],
    expected_central_conflicts: [],
    expected_main_tension: null,
    dream:
      'My partner and I lie wrapped in the same blanket on a quiet pier, watching lantern fish move beneath the water. Neither of us speaks. The closeness makes the dark depth feel welcoming rather than risky, and we keep looking together for a long time.',
    notes: 'Harmonious Lover positive with shared attention and no dramatic outcome.',
  },
  {
    id: 'F_pos_orphan_locked_gate_en',
    polarity: 'positive',
    phase: 2,
    dream_language: 'en',
    required_archetype_ids: ['orphan'],
    acceptable_secondary_ids: [],
    dream:
      'My family celebrates inside a glass house. I stand outside with the right key that no longer turns. They wave kindly through the window but do not open the door. Night falls and I sleep on the porch steps with my backpack as a pillow.',
    notes: 'Exclusion from belonging despite proximity.',
  },
];

/** Phase 2 true negatives (8). */
export const PATCH_F_PHASE2_NEGATIVES: PatchFFixture[] = [
  {
    id: 'F_neg_partner_logistics_en',
    polarity: 'negative',
    phase: 2,
    dream_language: 'en',
    required_archetype_ids: [],
    acceptable_secondary_ids: [],
    expected_central_conflicts: [],
    expected_main_tension: null,
    dream:
      'My partner drops grocery bags by the kitchen island, asks whether I paid the electricity bill, and leaves again to park the car. I stack the cans by expiry date and text him the door code. The apartment stays ordinary before and after he passes through.',
    notes: 'Incidental partner presence without a bond-organized scene.',
  },
  {
    id: 'F_neg_warm_friends_en',
    polarity: 'negative',
    phase: 2,
    dream_language: 'en',
    required_archetype_ids: [],
    acceptable_secondary_ids: [],
    expected_central_conflicts: [],
    expected_main_tension: null,
    dream:
      'A close friend and I paddle a canoe across a still lake, joking softly while we look for the right campsite. We work well together and unload the bags without friction. It feels companionable and easy, but nothing in the scene turns toward romance, devotion, or beloved risk.',
    notes: 'Warm companionship should not become Lover.',
  },
  {
    id: 'F_neg_romance_cue_only_en',
    polarity: 'negative',
    phase: 2,
    dream_language: 'en',
    required_archetype_ids: [],
    acceptable_secondary_ids: [],
    dream:
      'I walk through a wedding reception in a silver dress while strangers smile and toss rose petals. A handsome person kisses my cheek for a photo and disappears into the crowd. I spend the rest of the dream searching for the table number on my card.',
    notes: 'Romance cue and wedding scenery alone should stay empty.',
  },
  {
    id: 'F_neg_surface_depth_harmony_el',
    polarity: 'negative',
    phase: 2,
    dream_language: 'el',
    required_archetype_ids: [],
    acceptable_secondary_ids: [],
    expected_central_conflicts: [],
    expected_main_tension: null,
    dream:
      'Ήμουν σε μια ξύλινη αποβάθρα πάνω από καθαρό νερό και κοίταζα ήρεμα τα φυτά στον βυθό. Από πάνω περνούσε ένα απαλό αεράκι και από κάτω κινούνταν αργά τα ψάρια. Δεν υπήρχε φόβος ούτε δίλημμα· η επιφάνεια και το βάθος έμοιαζαν να ανήκουν στην ίδια γαλήνη.',
    notes: 'Complementary spatial layering should not become inner conflict.',
  },
  {
    id: 'F_neg_spatial_conflict_control_el',
    polarity: 'negative',
    phase: 2,
    dream_language: 'el',
    required_archetype_ids: [],
    acceptable_secondary_ids: [],
    expected_central_conflicts: ['μπαλκόνι vs υπόγειο'],
    expected_main_tension: 'μπαλκόνι vs υπόγειο',
    dream:
      'Στεκόμουν σε ένα στενό μπαλκόνι του τρίτου ορόφου και άκουγα το υπόγειο να με τραβά σαν μαγνήτης. Κάθε φορά που πήγαινα να μπω μέσα για να κατέβω, το πάτωμα έσπαγε κάτω από τα πόδια μου και με ανάγκαζε να μείνω έξω. Ήθελα να κατέβω, αλλά το κτίριο δεν με άφηνε.',
    notes: 'Control fixture for genuine spatial opposition.',
  },
  {
    id: 'F_neg_sisyphus_hill_el',
    polarity: 'negative',
    phase: 2,
    dream_language: 'el',
    required_archetype_ids: [],
    acceptable_secondary_ids: [],
    dream:
      'Βρισκόμουν σε έναν γυμνό λόφο και έσπρωχνα μια τεράστια στρογγυλή πέτρα προς την κορυφή. Δεν υπήρχε κανείς να με παρακολουθεί και δεν ένιωθα ούτε γενναίος ούτε φοβισμένος· μόνο ήξερα ότι έπρεπε να τη φτάσω πάνω. Κάθε φορά που η πέτρα πλησίαζε στην κορυφή, ακουγόταν ένα μικρό κουδούνι και η πέτρα γλιστρούσε από τα χέρια μου, κυλούσε μέχρι κάτω και σταματούσε ακριβώς στο ίδιο σημείο. Κατέβαινα, έβαζα πάλι τα χέρια μου πάνω της και ξεκινούσα από την αρχή.',
    notes: 'Repetitive labor without archetypal ordeal/boon frame.',
  },
  {
    id: 'F_neg_kitchen_glass_el',
    polarity: 'negative',
    phase: 2,
    dream_language: 'el',
    required_archetype_ids: [],
    acceptable_secondary_ids: [],
    dream:
      'Ήμουν στην κουζίνα μου και ήθελα να πιω νερό. Άνοιξα το ντουλάπι, αλλά όλα τα ποτήρια ήταν άπλυτα. Πήρα το λιγότερο βρώμικο, το έπλυνα με σαπούνι, το ξέβγαλα δύο φορές και το γέμισα από τη βρύση. Η γάτα πέρασε από τον πάγκο και έριξε ένα κουταλάκι στο πάτωμα. Το σήκωσα, ήπια το νερό και ξύπνησα ελαφρώς εκνευρισμένος επειδή θυμήθηκα ότι είχα αφήσει πιάτα στον νεροχύτη.',
    notes: 'Ordinary chore dream.',
  },
  {
    id: 'F_neg_commute_en',
    polarity: 'negative',
    phase: 2,
    dream_language: 'en',
    required_archetype_ids: [],
    acceptable_secondary_ids: [],
    dream:
      'I ride the commuter train to the office, check two emails, and eat a sandwich at my desk. A colleague asks about a meeting time. I confirm three o’clock and save a spreadsheet. The afternoon passes without anything unusual happening.',
    notes: 'Flat weekday logistics.',
  },
  {
    id: 'F_neg_elevator_en',
    polarity: 'negative',
    phase: 2,
    dream_language: 'en',
    required_archetype_ids: [],
    acceptable_secondary_ids: [],
    dream:
      'Elevator opens on the wrong floor. Grey corridor. No numbers. Door shuts before I step out.',
    notes: 'Brief oddity without sustained function.',
  },
  {
    id: 'F_neg_teeth_en',
    polarity: 'negative',
    phase: 2,
    dream_language: 'en',
    required_archetype_ids: [],
    acceptable_secondary_ids: [],
    dream:
      'Teeth loosen one by one into my palm. I spit into the sink. They are just teeth. The mirror stays ordinary.',
    notes: 'Body oddity without death–rebirth structure.',
  },
  {
    id: 'F_neg_crossroads_shrug_en',
    polarity: 'negative',
    phase: 2,
    dream_language: 'en',
    required_archetype_ids: [],
    acceptable_secondary_ids: ['wise_old_woman'],
    dream:
      'An old woman at a crossroads points down three paths without naming them. I ask which leads home; she shrugs and hands me a folded map I cannot open. Traffic sounds fade. I stand holding the paper while the roads look equally worn.',
    notes: 'Ambiguous pointer — empty preferred; wise_old_woman acceptable secondary only.',
  },
  {
    id: 'F_neg_basement_flood_en',
    polarity: 'negative',
    phase: 2,
    dream_language: 'en',
    required_archetype_ids: [],
    acceptable_secondary_ids: [],
    dream:
      'Water rises in a basement where I stored old boxes. I wade out through a side door into morning sunlight on wet grass. The house behind me looks the same from outside, but my clothes are dry and the street sounds sharper than I remember.',
    notes: 'Mild atmosphere shift without earned transformation label.',
  },
  {
    id: 'F_neg_babysit_juice_en',
    polarity: 'negative',
    phase: 2,
    dream_language: 'en',
    required_archetype_ids: [],
    acceptable_secondary_ids: [],
    dream:
      'I babysit a neighbour’s toddler who spills juice and cries for his mother. I comfort him until she returns. The sticky floor remains a chore, and once the door closes the apartment returns to adult quiet exactly as before he arrived.',
    notes: 'Literal childcare — not Divine Child / Mother echo.',
  },
];

export const PATCH_F_PHASE2_FIXTURES: PatchFFixture[] = [
  ...PATCH_F_PHASE2_POSITIVES,
  ...PATCH_F_PHASE2_NEGATIVES,
];

export function validatePatchFFixtures(fixtures: PatchFFixture[]): void {
  const ids = new Set<string>();
  for (const f of fixtures) {
    if (ids.has(f.id)) throw new Error(`duplicate fixture id: ${f.id}`);
    ids.add(f.id);
    if (!f.dream.trim()) throw new Error(`empty dream: ${f.id}`);
    if (f.polarity === 'positive' && f.required_archetype_ids.length === 0) {
      throw new Error(`positive without required: ${f.id}`);
    }
    if (f.polarity === 'negative' && f.required_archetype_ids.length > 0) {
      throw new Error(`negative with required: ${f.id}`);
    }
    if (f.expected_central_conflicts && f.expected_main_tension === undefined) {
      throw new Error(`expected_central_conflicts requires explicit expected_main_tension: ${f.id}`);
    }
  }
}
