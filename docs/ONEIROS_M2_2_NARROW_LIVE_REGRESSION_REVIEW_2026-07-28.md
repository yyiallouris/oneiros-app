# Oneiros M2.2 narrow live regression review

## Runtime line

```text
prompt_id: dream-field-map-interpretive-v4.1.10-M2.2
prompt_version: 4.1.10-M2.2
schema_version: 13
archetype_catalog_version: 1.7.1
myth_catalog_version: 1.2.0
concurrency: 2
disable_anthropic_fallback: true
fresh uncached calls
bounded retry for 429
one retry for language_validation_failed
count only successful semantic runs toward acceptance
```

## Exact diffs

```text
M2.1 -> M2.2 exact prompt delta:
- version bump: 4.1.10-M2.1 -> 4.1.10-M2.2
- added ordinary practical-obstacle restraint to CENTRAL CONFLICTS / INNER TENSIONS
- added EXPLICIT NEGATION block to GLOBAL ARCHETYPE ACTIVATION
```

```text
--- Lover 1.7.0
+++ Lover 1.7.1
{
    id: 'lover',
    canonicalLabel: 'Lover',
    displayLabel: 'The Lover',
    kind: 'relational_role',
    coreFunction: 'Erotic or devoted relatedness that organizes desire, union, or heart-risk at the centre.',
    selectWhen: [
      'erotic or devoted relatedness organizes the dream',
      'union, longing, or heart-risk is the structural stake',
      'choosing the beloved changes the field',
      'mutual intimacy or chosen closeness is the emotional centre of the dream',
      'two figures share a sustained orientation toward the same psychic depth, future, or field',
      'the bond itself changes how the dream-space can be inhabited, even without conflict or dramatic outcome',
    ],
    insufficientWhen: [
      'any romance cue',
      'attractiveness alone',
      'wedding scenery alone',
      'requiring longing, separation, vow, sacrifice, or transformed social order when gentle closeness already organizes the field',
    ],
    competingLabels: ['Anima', 'Animus', 'Sacred Marriage', 'Persona'],
  }
---
{
    id: 'lover',
    canonicalLabel: 'Lover',
    displayLabel: 'The Lover',
    kind: 'relational_role',
    coreFunction:
      'Erotic, intimate, or beloved relatedness that organizes the dream’s emotional field, including quiet shared attunement without conflict or dramatic outcome.',
    selectWhen: [
      'mutual erotic, intimate, or beloved relatedness organizes the dream',
      'quiet shared attunement, bodily closeness, or chosen beloved intimacy is the field-organizing centre',
      'union, longing, separation, or heart-risk is the structural stake',
      'choosing the beloved changes the field',
      'mutual intimacy or chosen closeness is the emotional centre of the dream',
      'two figures share a sustained orientation toward the same psychic depth, future, or field',
      'the bond itself changes how the dream-space can be inhabited, even without conflict or dramatic outcome',
    ],
    insufficientWhen: [
      'any romance cue',
      'attractiveness alone',
      'wedding scenery alone',
      'warm friendship, companionship, teamwork, or practical cooperation without erotic, intimate, or beloved charge',
      'explicitly non-romantic companionship or explicit denial of devotion, romance, or beloved stakes',
    ],
    competingLabels: ['Anima', 'Animus', 'Sacred Marriage', 'Persona'],
  }
```

## Full prompt token delta

```json
{
  "current_system_prompt_tokens": 16418,
  "reconstructed_m21_system_prompt_tokens": 16277,
  "delta_tokens": 141,
  "method": "gpt-tokenizer:/tmp/tok/node_modules/gpt-tokenizer"
}
```

## Fixtures

### Exact Greek sea-mattress
```json
{
  "id": "sea_mattress_el",
  "label": "Exact Greek sea-mattress",
  "category": "sea_mattress",
  "reps": 5,
  "dream_language": "el",
  "dream": "Είδα ένα όνειρο. Ήμουν ξαπλωμένη σε ένα θαλάσσιο στρώμα, σε μια πολύ γαλήνια θάλασσα και πάνω μου ήταν ξαπλωμένος ο φίλος μου και κοιτούσαμε το βυθό και εξερευνούσαμε όλο το βυθό. Ήταν πολύ ήρεμα, γαλήνια, όμορφα, πάντα πολύ ήρεμα.",
  "required_archetype_ids": [
    "lover"
  ],
  "forbidden_archetype_ids": [
    "anima",
    "animus",
    "guide_psychopomp",
    "sacred_marriage"
  ],
  "expected_central_conflicts": [],
  "expected_main_tension": null,
  "notes": "Exact reviewer acceptance seed."
}
```

### Harmonious Lover positive
```json
{
  "id": "F_pos_lover_shared_depth_en",
  "label": "Harmonious Lover positive",
  "category": "lover_positive_harmonious",
  "reps": 3,
  "dream_language": "en",
  "dream": "My partner and I lie wrapped in the same blanket on a quiet pier, watching lantern fish move beneath the water. Neither of us speaks. The closeness makes the dark depth feel welcoming rather than risky, and we keep looking together for a long time.",
  "required_archetype_ids": [
    "lover"
  ],
  "forbidden_archetype_ids": [
    "anima",
    "animus",
    "sacred_marriage"
  ],
  "expected_central_conflicts": [],
  "expected_main_tension": null,
  "notes": "Harmonious Lover positive with shared attention and no dramatic outcome."
}
```

### Longing Lover positive
```json
{
  "id": "F_pos_lover_bench_rain_en",
  "label": "Longing Lover positive",
  "category": "lover_positive_longing",
  "reps": 3,
  "dream_language": "en",
  "dream": "Someone I lost finds me at a bus stop in light rain. We stand close without speaking. The bus arrives but neither of us boards.",
  "required_archetype_ids": [
    "lover"
  ],
  "forbidden_archetype_ids": [
    "anima",
    "animus",
    "sacred_marriage",
    "persona"
  ],
  "expected_central_conflicts": [],
  "expected_main_tension": null,
  "notes": "Quiet devoted proximity organizes the field."
}
```

### Warm non-romantic friends
```json
{
  "id": "F_neg_warm_friends_en",
  "label": "Warm non-romantic friends",
  "category": "lover_negative_non_romantic",
  "reps": 5,
  "dream_language": "en",
  "dream": "A close friend and I paddle a canoe across a still lake, joking softly while we look for the right campsite. We work well together and unload the bags without friction. It feels companionable and easy, but nothing in the scene turns toward romance, devotion, or beloved risk.",
  "required_archetype_ids": [],
  "forbidden_archetype_ids": [
    "lover"
  ],
  "expected_central_conflicts": [],
  "expected_main_tension": null,
  "notes": "Warm companionship should not become Lover."
}
```

### Incidental partner
```json
{
  "id": "F_neg_partner_logistics_en",
  "label": "Incidental partner",
  "category": "lover_negative_incidental_partner",
  "reps": 3,
  "dream_language": "en",
  "dream": "My partner drops grocery bags by the kitchen island, asks whether I paid the electricity bill, and leaves again to park the car. I stack the cans by expiry date and text him the door code. The apartment stays ordinary before and after he passes through.",
  "required_archetype_ids": [],
  "forbidden_archetype_ids": [
    "lover"
  ],
  "expected_central_conflicts": [],
  "expected_main_tension": null,
  "notes": "Incidental partner presence without a bond-organized scene."
}
```

### Romance cue only
```json
{
  "id": "F_neg_romance_cue_only_en",
  "label": "Romance cue only",
  "category": "lover_negative_romance_cue_only",
  "reps": 3,
  "dream_language": "en",
  "dream": "I walk through a wedding reception in a silver dress while strangers smile and toss rose petals. A handsome person kisses my cheek for a photo and disappears into the crowd. I spend the rest of the dream searching for the table number on my card.",
  "required_archetype_ids": [],
  "forbidden_archetype_ids": [
    "lover"
  ],
  "notes": "Romance cue and wedding scenery alone should stay empty."
}
```

### Ordinary kitchen
```json
{
  "id": "F_neg_kitchen_glass_el",
  "label": "Ordinary kitchen",
  "category": "ordinary_kitchen",
  "reps": 5,
  "dream_language": "el",
  "dream": "Ήμουν στην κουζίνα μου και ήθελα να πιω νερό. Άνοιξα το ντουλάπι, αλλά όλα τα ποτήρια ήταν άπλυτα. Πήρα το λιγότερο βρώμικο, το έπλυνα με σαπούνι, το ξέβγαλα δύο φορές και το γέμισα από τη βρύση. Η γάτα πέρασε από τον πάγκο και έριξε ένα κουταλάκι στο πάτωμα. Το σήκωσα, ήπια το νερό και ξύπνησα ελαφρώς εκνευρισμένος επειδή θυμήθηκα ότι είχα αφήσει πιάτα στον νεροχύτη.",
  "required_archetype_ids": [],
  "expected_central_conflicts": [],
  "expected_main_tension": null,
  "notes": "Ordinary chore dream."
}
```

### Surface/depth complementarity
```json
{
  "id": "F_neg_surface_depth_harmony_el",
  "label": "Surface/depth complementarity",
  "category": "surface_depth_harmony",
  "reps": 3,
  "dream_language": "el",
  "dream": "Ήμουν σε μια ξύλινη αποβάθρα πάνω από καθαρό νερό και κοίταζα ήρεμα τα φυτά στον βυθό. Από πάνω περνούσε ένα απαλό αεράκι και από κάτω κινούνταν αργά τα ψάρια. Δεν υπήρχε φόβος ούτε δίλημμα· η επιφάνεια και το βάθος έμοιαζαν να ανήκουν στην ίδια γαλήνη.",
  "required_archetype_ids": [],
  "expected_central_conflicts": [],
  "expected_main_tension": null,
  "notes": "Complementary spatial layering should not become inner conflict."
}
```

### Genuine spatial conflict
```json
{
  "id": "F_neg_spatial_conflict_control_el",
  "label": "Genuine spatial conflict",
  "category": "genuine_spatial_conflict",
  "reps": 3,
  "dream_language": "el",
  "dream": "Στεκόμουν σε ένα στενό μπαλκόνι του τρίτου ορόφου και άκουγα το υπόγειο να με τραβά σαν μαγνήτης. Κάθε φορά που πήγαινα να μπω μέσα για να κατέβω, το πάτωμα έσπαγε κάτω από τα πόδια μου και με ανάγκαζε να μείνω έξω. Ήθελα να κατέβω, αλλά το κτίριο δεν με άφηνε.",
  "required_archetype_ids": [],
  "expected_central_conflicts": [
    "μπαλκόνι vs υπόγειο"
  ],
  "expected_main_tension": "μπαλκόνι vs υπόγειο",
  "notes": "Control fixture for genuine spatial opposition."
}
```

### Persona conflict
```json
{
  "id": "F_pos_persona_stage_suit_el",
  "label": "Persona conflict",
  "category": "persona_conflict",
  "reps": 3,
  "dream_language": "el",
  "dream": "Ήμουν σε ένα μεγάλο θέατρο όπου όλοι περίμεναν να παρουσιάσω τα οικονομικά μιας εταιρείας. Πριν βγω στη σκηνή, μου φόρεσαν μια τέλεια σκούρα στολή με το όνομά μου κεντημένο στο στήθος. Μόλις στάθηκα μπροστά στο κοινό, η φωνή μου έγινε ψυχρή και επίσημη, παρότι μέσα μου ήθελα να πω ότι δεν γνώριζα τις απαντήσεις. Κάθε φορά που προσπαθούσα να μιλήσω με τη δική μου φωνή, ο γιακάς έσφιγγε και το κοινό σταματούσε να με βλέπει. Όταν επέστρεψα στα παρασκήνια, προσπάθησα να βγάλω τη στολή, αλλά τα μανίκια είχαν κολλήσει πάνω μου.",
  "required_archetype_ids": [
    "persona"
  ],
  "notes": "Public mask / role adhesion vs private voice."
}
```

### Mother positive
```json
{
  "id": "F_pos_mother_kitchen_en",
  "label": "Mother positive",
  "category": "mother_positive",
  "reps": 2,
  "dream_language": "en",
  "dream": "An enormous woman fills a stone kitchen. She feeds me broth that warms my chest and wraps me in a shawl that smells like rain soil. Outside a storm tears roofs away, but her table stays steady. When I try to stand without her arm I feel cold immediately; when I lean back into her the storm softens.",
  "required_archetype_ids": [
    "mother"
  ],
  "notes": "Nurturing containment that organizes safety."
}
```

### Father positive
```json
{
  "id": "m22_calm_father_en",
  "label": "Father positive",
  "category": "father_positive",
  "reps": 2,
  "dream_language": "en",
  "dream": "At dusk my father stands at the garden gate and quietly tells me which tools must come inside before the rain. He does not raise his voice. As I follow his calm instruction, the whole yard feels ordered and protected, and even the wind seems to fall into place around that steady authority.",
  "required_archetype_ids": [
    "father"
  ],
  "notes": "Protective paternal order without dramatic conflict."
}
```

### Divine Child positive
```json
{
  "id": "P_divine_child_a",
  "label": "Divine Child positive",
  "category": "divine_child_positive",
  "reps": 2,
  "dream_language": "en",
  "dream": "During a city blackout an infant in my arms remains calmly luminous while adults panic in the streets below. When officials demand I hand the child over for safekeeping, I refuse and climb the stairwell. Sirens fade as we reach rooms above the roofline filled with daylight that had been unavailable all evening.",
  "required_archetype_ids": [
    "divine_child"
  ],
  "notes": "Existing benchmark Divine Child fixture."
}
```

## Failed attempts separated from successful semantic runs

```json
[
  {
    "fixture_id": "F_pos_lover_bench_rain_en",
    "semantic_run_id": "F_pos_lover_bench_rain_en_semantic_r3",
    "final_error_type": "language_validation_failed",
    "final_error": "language_validation_failed: relational_dynamics[2]",
    "attempts": [
      {
        "run_id": "F_pos_lover_bench_rain_en_semantic_r3_a1_t1",
        "attempt_index": 1,
        "ok": false,
        "error_type": "language_validation_failed",
        "error": "language_validation_failed: relational_dynamics[2]"
      },
      {
        "run_id": "F_pos_lover_bench_rain_en_semantic_r3_a2_t1",
        "attempt_index": 2,
        "ok": false,
        "error_type": "language_validation_failed",
        "error": "language_validation_failed: relational_dynamics[2]"
      }
    ]
  },
  {
    "fixture_id": "F_neg_warm_friends_en",
    "semantic_run_id": "F_neg_warm_friends_en_semantic_r1",
    "final_error_type": "language_validation_failed",
    "final_error": "language_validation_failed: relational_dynamics[2]",
    "attempts": [
      {
        "run_id": "F_neg_warm_friends_en_semantic_r1_a1_t1",
        "attempt_index": 1,
        "ok": false,
        "error_type": "language_validation_failed",
        "error": "language_validation_failed: relational_dynamics[1]"
      },
      {
        "run_id": "F_neg_warm_friends_en_semantic_r1_a2_t1",
        "attempt_index": 2,
        "ok": false,
        "error_type": "language_validation_failed",
        "error": "language_validation_failed: relational_dynamics[2]"
      }
    ]
  },
  {
    "fixture_id": "F_neg_warm_friends_en",
    "semantic_run_id": "F_neg_warm_friends_en_semantic_r4",
    "final_error_type": "language_validation_failed",
    "final_error": "language_validation_failed: relational_dynamics[2]",
    "attempts": [
      {
        "run_id": "F_neg_warm_friends_en_semantic_r4_a1_t1",
        "attempt_index": 1,
        "ok": false,
        "error_type": "language_validation_failed",
        "error": "language_validation_failed: relational_dynamics[2]"
      },
      {
        "run_id": "F_neg_warm_friends_en_semantic_r4_a2_t1",
        "attempt_index": 2,
        "ok": false,
        "error_type": "language_validation_failed",
        "error": "language_validation_failed: relational_dynamics[2]"
      }
    ]
  }
]
```

## Successful semantic runs

### sea_mattress_el_semantic_r1
```json
{
  "fixture_id": "sea_mattress_el",
  "run_id": "sea_mattress_el_semantic_r1_a1_t1",
  "attempt_count": 1,
  "model": "gpt-5.4-mini-2026-03-17",
  "latency_ms": 6346,
  "cost_usd": 0.00452595,
  "raw_archetypes": [],
  "post_validation_archetypes": [],
  "mechanism_tags_by_archetype": {},
  "validator_decisions": [],
  "archetype_reject_reasons": [],
  "central_conflicts": [],
  "main_tension": null,
  "core_mode": "Core State",
  "raw_amplifications": [],
  "post_validation_amplifications": [],
  "mythic_reject_reasons": [],
  "explicit_negation_behavior": "n/a",
  "interpretive_diagnostics": {
    "selection_notes": {
      "archetype_reasons": [
        "[]"
      ],
      "mythic_reason": "[]",
      "near_misses": [
        "ορφέας-ευρυδίκη: λείπει απώλεια, κάθοδος και απαγορευμένο όριο",
        "κοίλωμα/κάθοδος: η σκηνή είναι εξερευνητική και ήρεμη, όχι δοκιμαστική ή απειλητική"
      ]
    }
  }
}
```

### sea_mattress_el_semantic_r2
```json
{
  "fixture_id": "sea_mattress_el",
  "run_id": "sea_mattress_el_semantic_r2_a1_t1",
  "attempt_count": 1,
  "model": "gpt-5.4-mini-2026-03-17",
  "latency_ms": 6981,
  "cost_usd": 0.017205,
  "raw_archetypes": [],
  "post_validation_archetypes": [],
  "mechanism_tags_by_archetype": {},
  "validator_decisions": [],
  "archetype_reject_reasons": [],
  "central_conflicts": [],
  "main_tension": null,
  "core_mode": "Core State",
  "raw_amplifications": [],
  "post_validation_amplifications": [],
  "mythic_reject_reasons": [],
  "explicit_negation_behavior": "n/a",
  "interpretive_diagnostics": {
    "selection_notes": {
      "archetype_reasons": [
        "Δεν επιλέχθηκε αρχέτυπο: η σκηνή είναι κυρίως ήρεμη, συντροφική και περιγραφική, χωρίς αρκετά έντονη αρχετυπική λειτουργία."
      ],
      "mythic_reason": "Δεν επιλέχθηκε μυθικό μοτίβο: λείπουν η δραματική ακολουθία, η δοκιμασία και η μεταβολή που θα ταίριαζαν σε συγκεκριμένο αφηγηματικό σχήμα.",
      "near_misses": [
        "Ο Λάβερ δεν επιλέχθηκε, γιατί η εγγύτητα είναι ήπια και δεν οργανώνει ερωτική ή επιθυμητική ένταση.",
        "Ο Οδηγός / Ψυχοπομπός δεν επιλέχθηκε, γιατί δεν υπάρχει καθοδηγητική μετάβαση ανάμεσα σε σαφώς διαφορετικούς κόσμους."
      ]
    }
  }
}
```

### sea_mattress_el_semantic_r3
```json
{
  "fixture_id": "sea_mattress_el",
  "run_id": "sea_mattress_el_semantic_r3_a1_t1",
  "attempt_count": 1,
  "model": "gpt-5.4-mini-2026-03-17",
  "latency_ms": 6081,
  "cost_usd": 0.0047757,
  "raw_archetypes": [],
  "post_validation_archetypes": [],
  "mechanism_tags_by_archetype": {},
  "validator_decisions": [],
  "archetype_reject_reasons": [],
  "central_conflicts": [],
  "main_tension": null,
  "core_mode": "Core State",
  "raw_amplifications": [],
  "post_validation_amplifications": [],
  "mythic_reject_reasons": [],
  "explicit_negation_behavior": "n/a",
  "interpretive_diagnostics": {
    "selection_notes": {
      "archetype_reasons": [
        "[]"
      ],
      "mythic_reason": "[]",
      "near_misses": [
        "Δεν επιλέχθηκε κάποια μυθική αφήγηση, γιατί δεν υπάρχει δοκιμασία, απώλεια ή τελετουργική μετάβαση.",
        "Δεν επιλέχθηκε αρχέτυπο, γιατί το όνειρο οργανώνεται ως ήρεμη κοινή παραμονή και όχι ως έντονη λειτουργία ή σύγκρουση."
      ]
    }
  }
}
```

### sea_mattress_el_semantic_r4
```json
{
  "fixture_id": "sea_mattress_el",
  "run_id": "sea_mattress_el_semantic_r4_a1_t1",
  "attempt_count": 1,
  "model": "gpt-5.4-mini-2026-03-17",
  "latency_ms": 5497,
  "cost_usd": 0.00455745,
  "raw_archetypes": [],
  "post_validation_archetypes": [],
  "mechanism_tags_by_archetype": {},
  "validator_decisions": [],
  "archetype_reject_reasons": [],
  "central_conflicts": [],
  "main_tension": null,
  "core_mode": "Core State",
  "raw_amplifications": [],
  "post_validation_amplifications": [],
  "mythic_reject_reasons": [],
  "explicit_negation_behavior": "n/a",
  "interpretive_diagnostics": {
    "selection_notes": {
      "archetype_reasons": [
        "[]"
      ],
      "mythic_reason": "[]",
      "near_misses": [
        "Καμία σαφής αρχετυπική λειτουργία δεν οργανώνει τη σκηνή.",
        "Καμία μυθική ακολουθία δεν ενεργοποιείται· το όνειρο παραμένει σε ήρεμη κοινή θέαση."
      ]
    }
  }
}
```

### sea_mattress_el_semantic_r5
```json
{
  "fixture_id": "sea_mattress_el",
  "run_id": "sea_mattress_el_semantic_r5_a1_t1",
  "attempt_count": 1,
  "model": "gpt-5.4-mini-2026-03-17",
  "latency_ms": 5731,
  "cost_usd": 0.00428595,
  "raw_archetypes": [],
  "post_validation_archetypes": [],
  "mechanism_tags_by_archetype": {},
  "validator_decisions": [],
  "archetype_reject_reasons": [],
  "central_conflicts": [],
  "main_tension": null,
  "core_mode": "Core State",
  "raw_amplifications": [],
  "post_validation_amplifications": [],
  "mythic_reject_reasons": [],
  "explicit_negation_behavior": "n/a",
  "interpretive_diagnostics": {
    "selection_notes": {
      "archetype_reasons": [
        "[]"
      ],
      "mythic_reason": "[]",
      "near_misses": [
        "Καμία σαφής μυθική ακολουθία ή αρχέτυπο δεν ενεργοποιείται· η σκηνή μένει ήρεμη, συνεκτική και χωρίς αντιπαράθεση."
      ]
    }
  }
}
```

### F_pos_lover_shared_depth_en_semantic_r1
```json
{
  "fixture_id": "F_pos_lover_shared_depth_en",
  "run_id": "F_pos_lover_shared_depth_en_semantic_r1_a1_t1",
  "attempt_count": 1,
  "model": "gpt-5.4-mini-2026-03-17",
  "latency_ms": 5201,
  "cost_usd": 0.0045729,
  "raw_archetypes": [],
  "post_validation_archetypes": [],
  "mechanism_tags_by_archetype": {},
  "validator_decisions": [],
  "archetype_reject_reasons": [],
  "central_conflicts": [],
  "main_tension": null,
  "core_mode": "Core State",
  "raw_amplifications": [],
  "post_validation_amplifications": [],
  "mythic_reject_reasons": [],
  "explicit_negation_behavior": "n/a",
  "interpretive_diagnostics": {
    "selection_notes": {
      "archetype_reasons": [
        "[] — the dream is relational and atmospheric, but no catalog archetypal function is clearly enacted."
      ],
      "mythic_reason": "[] — there is no quest, descent, taboo, loss, or transformative sequence that matches a closed myth pattern.",
      "near_misses": [
        "Lover was considered, but the dream shows shared intimacy rather than a stronger beloved-bond structure driving change."
      ]
    }
  }
}
```

### F_pos_lover_shared_depth_en_semantic_r2
```json
{
  "fixture_id": "F_pos_lover_shared_depth_en",
  "run_id": "F_pos_lover_shared_depth_en_semantic_r2_a1_t1",
  "attempt_count": 1,
  "model": "gpt-5.4-mini-2026-03-17",
  "latency_ms": 6226,
  "cost_usd": 0.0044112,
  "raw_archetypes": [
    {
      "archetype_id": "lover",
      "expression": "my partner and I wrapped in the same blanket, lying together in silence on the pier",
      "resonance": "A shared, wordless closeness organizes the whole scene, and the dark depth becomes welcoming because the bond itself makes the edge feel safe.",
      "confidence": "high",
      "mechanism_tags": [
        "devotion_or_longing",
        "bond_organizes_dream"
      ],
      "evidence_ids": [
        "D1"
      ]
    }
  ],
  "post_validation_archetypes": [
    {
      "canonical_label": "Lover",
      "expression": "my partner and I wrapped in the same blanket, lying together in silence on the pier",
      "resonance": "A shared, wordless closeness organizes the whole scene, and the dark depth becomes welcoming because the bond itself makes the edge feel safe.",
      "evidence": [
        "My partner and I lie wrapped in the same blanket on a quiet pier, watching lantern fish move beneath the water. Neither of us speaks. The closeness makes the dark depth feel welcoming rather than risky, and we keep looking together for a long time."
      ],
      "confidence": "high",
      "archetype_id": "lover",
      "archetype_catalog_version": "1.7.1",
      "evidence_ids": [
        "D1"
      ]
    }
  ],
  "mechanism_tags_by_archetype": {
    "lover": [
      "devotion_or_longing",
      "bond_organizes_dream"
    ]
  },
  "validator_decisions": [
    {
      "archetype_id": "lover",
      "canonical_label": "Lover",
      "accepted": true,
      "rejection_codes": [],
      "rejection_reason": null,
      "mechanism_tags": [
        "devotion_or_longing",
        "bond_organizes_dream"
      ],
      "evidence_ids": [
        "D1"
      ]
    }
  ],
  "archetype_reject_reasons": [],
  "central_conflicts": [],
  "main_tension": null,
  "core_mode": "Core State",
  "raw_amplifications": [],
  "post_validation_amplifications": [],
  "mythic_reject_reasons": [],
  "explicit_negation_behavior": "n/a",
  "interpretive_diagnostics": {
    "selection_notes": {
      "archetype_reasons": [
        "lover was earned because the dream’s emotional center is a sustained chosen closeness between partners, with shared blanket, silence, and mutual looking organizing the field."
      ],
      "mythic_reason": "[]",
      "near_misses": [
        "No mythic catalog match was strong enough to justify selection.",
        "No other archetype was needed; the dream is cohesive and relational rather than conflicted or transformative."
      ]
    }
  }
}
```

### F_pos_lover_shared_depth_en_semantic_r3
```json
{
  "fixture_id": "F_pos_lover_shared_depth_en",
  "run_id": "F_pos_lover_shared_depth_en_semantic_r3_a1_t1",
  "attempt_count": 1,
  "model": "gpt-5.4-mini-2026-03-17",
  "latency_ms": 4473,
  "cost_usd": 0.0042087,
  "raw_archetypes": [
    {
      "archetype_id": "lover",
      "expression": "the dreamer and partner wrapped together and looking into the water",
      "resonance": "A shared, wordless closeness organizes the whole scene, and the depth below becomes safe because the bond itself holds the attention.",
      "confidence": "high",
      "mechanism_tags": [
        "devotion_or_longing",
        "bond_organizes_dream"
      ],
      "evidence_ids": [
        "D1"
      ]
    }
  ],
  "post_validation_archetypes": [
    {
      "canonical_label": "Lover",
      "expression": "the dreamer and partner wrapped together and looking into the water",
      "resonance": "A shared, wordless closeness organizes the whole scene, and the depth below becomes safe because the bond itself holds the attention.",
      "evidence": [
        "My partner and I lie wrapped in the same blanket on a quiet pier, watching lantern fish move beneath the water. Neither of us speaks. The closeness makes the dark depth feel welcoming rather than risky, and we keep looking together for a long time."
      ],
      "confidence": "high",
      "archetype_id": "lover",
      "archetype_catalog_version": "1.7.1",
      "evidence_ids": [
        "D1"
      ]
    }
  ],
  "mechanism_tags_by_archetype": {
    "lover": [
      "devotion_or_longing",
      "bond_organizes_dream"
    ]
  },
  "validator_decisions": [
    {
      "archetype_id": "lover",
      "canonical_label": "Lover",
      "accepted": true,
      "rejection_codes": [],
      "rejection_reason": null,
      "mechanism_tags": [
        "devotion_or_longing",
        "bond_organizes_dream"
      ],
      "evidence_ids": [
        "D1"
      ]
    }
  ],
  "archetype_reject_reasons": [],
  "central_conflicts": [],
  "main_tension": null,
  "core_mode": "Core State",
  "raw_amplifications": [],
  "post_validation_amplifications": [],
  "mythic_reject_reasons": [],
  "explicit_negation_behavior": "n/a",
  "interpretive_diagnostics": {
    "selection_notes": {
      "archetype_reasons": [
        "lover was earned because a sustained beloved bond organizes the dream: the partner, the shared blanket, the silent togetherness, and the shared looking into depth."
      ],
      "mythic_reason": "[]",
      "near_misses": [
        "No mythic echo was selected because the dream is cohesive and intimate without a distinct narrative sequence of loss, trial, crossing, or rescue."
      ]
    }
  }
}
```

### F_pos_lover_bench_rain_en_semantic_r1
```json
{
  "fixture_id": "F_pos_lover_bench_rain_en",
  "run_id": "F_pos_lover_bench_rain_en_semantic_r1_a1_t1",
  "attempt_count": 1,
  "model": "gpt-5.4-mini-2026-03-17",
  "latency_ms": 4745,
  "cost_usd": 0.00435045,
  "raw_archetypes": [
    {
      "archetype_id": "lover",
      "expression": "Someone I lost finds me and we stand close without speaking",
      "resonance": "A lost beloved returns as a quiet, bodily closeness that organizes the whole scene, while the unspoken meeting holds longing and separation together.",
      "confidence": "medium",
      "mechanism_tags": [
        "devotion_or_longing",
        "union_separation_or_loss",
        "bond_organizes_dream"
      ],
      "evidence_ids": [
        "D1"
      ]
    }
  ],
  "post_validation_archetypes": [
    {
      "canonical_label": "Lover",
      "expression": "Someone I lost finds me and we stand close without speaking",
      "resonance": "A lost beloved returns as a quiet, bodily closeness that organizes the whole scene, while the unspoken meeting holds longing and separation together.",
      "evidence": [
        "Someone I lost finds me at a bus stop in light rain. We stand close without speaking. The bus arrives but neither of us boards."
      ],
      "confidence": "medium",
      "archetype_id": "lover",
      "archetype_catalog_version": "1.7.1",
      "evidence_ids": [
        "D1"
      ]
    }
  ],
  "mechanism_tags_by_archetype": {
    "lover": [
      "devotion_or_longing",
      "union_separation_or_loss",
      "bond_organizes_dream"
    ]
  },
  "validator_decisions": [
    {
      "archetype_id": "lover",
      "canonical_label": "Lover",
      "accepted": true,
      "rejection_codes": [],
      "rejection_reason": null,
      "mechanism_tags": [
        "devotion_or_longing",
        "union_separation_or_loss",
        "bond_organizes_dream"
      ],
      "evidence_ids": [
        "D1"
      ]
    }
  ],
  "archetype_reject_reasons": [],
  "central_conflicts": [
    "closeness vs departure"
  ],
  "main_tension": "closeness vs departure",
  "core_mode": "Core Tension",
  "raw_amplifications": [],
  "post_validation_amplifications": [],
  "mythic_reject_reasons": [],
  "explicit_negation_behavior": "n/a",
  "interpretive_diagnostics": {
    "selection_notes": {
      "archetype_reasons": [
        "lover: the dream centers on a returned lost person, sustained closeness, and the bond itself shaping the scene more than the bus stop setting."
      ],
      "mythic_reason": "[]",
      "near_misses": [
        "guide_psychopomp was not selected because no active guidance or crossing occurs.",
        "orphan was not selected because the dream emphasizes reunion rather than abandonment."
      ]
    }
  }
}
```

### F_pos_lover_bench_rain_en_semantic_r2
```json
{
  "fixture_id": "F_pos_lover_bench_rain_en",
  "run_id": "F_pos_lover_bench_rain_en_semantic_r2_a1_t1",
  "attempt_count": 1,
  "model": "gpt-5.4-mini-2026-03-17",
  "latency_ms": 5172,
  "cost_usd": 0.00427695,
  "raw_archetypes": [
    {
      "archetype_id": "lover",
      "expression": "Someone I lost stands close without speaking",
      "resonance": "A lost beloved returns as quiet nearness, and the bond itself organizes the whole scene more than speech or action.",
      "confidence": "medium",
      "mechanism_tags": [
        "devotion_or_longing",
        "union_separation_or_loss",
        "bond_organizes_dream"
      ],
      "evidence_ids": [
        "D1"
      ]
    }
  ],
  "post_validation_archetypes": [
    {
      "canonical_label": "Lover",
      "expression": "Someone I lost stands close without speaking",
      "resonance": "A lost beloved returns as quiet nearness, and the bond itself organizes the whole scene more than speech or action.",
      "evidence": [
        "Someone I lost finds me at a bus stop in light rain. We stand close without speaking. The bus arrives but neither of us boards."
      ],
      "confidence": "medium",
      "archetype_id": "lover",
      "archetype_catalog_version": "1.7.1",
      "evidence_ids": [
        "D1"
      ]
    }
  ],
  "mechanism_tags_by_archetype": {
    "lover": [
      "devotion_or_longing",
      "union_separation_or_loss",
      "bond_organizes_dream"
    ]
  },
  "validator_decisions": [
    {
      "archetype_id": "lover",
      "canonical_label": "Lover",
      "accepted": true,
      "rejection_codes": [],
      "rejection_reason": null,
      "mechanism_tags": [
        "devotion_or_longing",
        "union_separation_or_loss",
        "bond_organizes_dream"
      ],
      "evidence_ids": [
        "D1"
      ]
    }
  ],
  "archetype_reject_reasons": [],
  "central_conflicts": [
    "closeness vs departure"
  ],
  "main_tension": "closeness vs departure",
  "core_mode": "Core Tension",
  "raw_amplifications": [],
  "post_validation_amplifications": [],
  "mythic_reject_reasons": [],
  "explicit_negation_behavior": "n/a",
  "interpretive_diagnostics": {
    "selection_notes": {
      "archetype_reasons": [
        "lover: a lost person returns as quiet, sustained closeness that organizes the scene, with longing and non-boarding as the central relational field."
      ],
      "mythic_reason": "[]",
      "near_misses": [
        "guide_psychopomp was not selected because no active guidance across realms or threshold escort is enacted.",
        "orphan was not selected because the dream centers on reunion and nearness rather than abandonment as its core field.",
        "greek.orpheus_eurydice was not selected because the dream does not stage a retrieval across death or a forbidden return sequence."
      ]
    }
  }
}
```

### F_neg_warm_friends_en_semantic_r2
```json
{
  "fixture_id": "F_neg_warm_friends_en",
  "run_id": "F_neg_warm_friends_en_semantic_r2_a1_t1",
  "attempt_count": 1,
  "model": "gpt-5.4-mini-2026-03-17",
  "latency_ms": 3930,
  "cost_usd": 0.0035682,
  "raw_archetypes": [],
  "post_validation_archetypes": [],
  "mechanism_tags_by_archetype": {},
  "validator_decisions": [],
  "archetype_reject_reasons": [],
  "central_conflicts": [],
  "main_tension": null,
  "core_mode": "Core State",
  "raw_amplifications": [],
  "post_validation_amplifications": [],
  "mythic_reject_reasons": [],
  "explicit_negation_behavior": "inspected",
  "interpretive_diagnostics": {
    "selection_notes": {
      "archetype_reasons": [
        "[]"
      ],
      "mythic_reason": "[]",
      "near_misses": [
        "No archetype is clearly enacted; the dream stays in ordinary companionship and cooperative movement.",
        "No mythic sequence is strongly present beyond a simple calm crossing."
      ]
    }
  }
}
```

### F_neg_warm_friends_en_semantic_r3
```json
{
  "fixture_id": "F_neg_warm_friends_en",
  "run_id": "F_neg_warm_friends_en_semantic_r3_a1_t1",
  "attempt_count": 1,
  "model": "gpt-5.4-mini-2026-03-17",
  "latency_ms": 4221,
  "cost_usd": 0.00385095,
  "raw_archetypes": [],
  "post_validation_archetypes": [],
  "mechanism_tags_by_archetype": {},
  "validator_decisions": [],
  "archetype_reject_reasons": [],
  "central_conflicts": [],
  "main_tension": null,
  "core_mode": "Core State",
  "raw_amplifications": [],
  "post_validation_amplifications": [],
  "mythic_reject_reasons": [],
  "explicit_negation_behavior": "inspected",
  "interpretive_diagnostics": {
    "selection_notes": {
      "archetype_reasons": [
        "[] — no archetypal function is clearly enacted beyond ordinary companionship and cooperation."
      ],
      "mythic_reason": "[] — no supplied mythic sequence is strongly present; the dream remains a simple shared outing and search for a campsite.",
      "near_misses": [
        "Lover was rejected because the dream explicitly denies romance, devotion, or beloved risk.",
        "Guide/Psychopomp was not selected because there is no active guiding across a realm-shift, only mutual searching."
      ]
    }
  }
}
```

### F_neg_warm_friends_en_semantic_r5
```json
{
  "fixture_id": "F_neg_warm_friends_en",
  "run_id": "F_neg_warm_friends_en_semantic_r5_a1_t1",
  "attempt_count": 1,
  "model": "gpt-5.4-mini-2026-03-17",
  "latency_ms": 23385,
  "cost_usd": 0.00394245,
  "raw_archetypes": [],
  "post_validation_archetypes": [],
  "mechanism_tags_by_archetype": {},
  "validator_decisions": [],
  "archetype_reject_reasons": [],
  "central_conflicts": [],
  "main_tension": null,
  "core_mode": "Core State",
  "raw_amplifications": [],
  "post_validation_amplifications": [],
  "mythic_reject_reasons": [],
  "explicit_negation_behavior": "inspected",
  "interpretive_diagnostics": {
    "selection_notes": {
      "archetype_reasons": [
        "[] — the dream explicitly denies romance, devotion, or beloved risk, and the friendship remains ordinary and easy rather than archetypally charged."
      ],
      "mythic_reason": "[] — there is no ordeal, taboo, loss, quest, or transformed return; only a calm shared crossing and practical cooperation.",
      "near_misses": [
        "Lover was rejected by the dream text itself.",
        "Guide / Psychopomp was not supported because there is travel, but no meaningful threshold escort or realm-shift."
      ]
    }
  }
}
```

### F_neg_partner_logistics_en_semantic_r1
```json
{
  "fixture_id": "F_neg_partner_logistics_en",
  "run_id": "F_neg_partner_logistics_en_semantic_r1_a1_t1",
  "attempt_count": 1,
  "model": "gpt-5.4-mini-2026-03-17",
  "latency_ms": 4588,
  "cost_usd": 0.0039762,
  "raw_archetypes": [],
  "post_validation_archetypes": [],
  "mechanism_tags_by_archetype": {},
  "validator_decisions": [],
  "archetype_reject_reasons": [],
  "central_conflicts": [],
  "main_tension": null,
  "core_mode": "Core State",
  "raw_amplifications": [],
  "post_validation_amplifications": [],
  "mythic_reject_reasons": [],
  "explicit_negation_behavior": "inspected",
  "interpretive_diagnostics": {
    "selection_notes": {
      "archetype_reasons": [
        "[] — the dream presents practical domestic coordination, but no clearly enacted archetypal function is central enough for a catalog match."
      ],
      "mythic_reason": "[] — no supplied mythic sequence is strongly staged; the dream stays at the level of ordinary logistics and brief passage.",
      "near_misses": [
        "persona: there is practical domestic action, but no public mask or social-role tension.",
        "guide_psychopomp: there is passage through the apartment, but no threshold-guiding between realms or modes.",
        "lover: the partner is present, but the dream is logistical rather than explicitly intimate or longing-based."
      ]
    }
  }
}
```

### F_neg_partner_logistics_en_semantic_r2
```json
{
  "fixture_id": "F_neg_partner_logistics_en",
  "run_id": "F_neg_partner_logistics_en_semantic_r2_a1_t1",
  "attempt_count": 1,
  "model": "gpt-5.4-mini-2026-03-17",
  "latency_ms": 4851,
  "cost_usd": 0.00373395,
  "raw_archetypes": [],
  "post_validation_archetypes": [],
  "mechanism_tags_by_archetype": {},
  "validator_decisions": [],
  "archetype_reject_reasons": [],
  "central_conflicts": [],
  "main_tension": null,
  "core_mode": "Core State",
  "raw_amplifications": [],
  "post_validation_amplifications": [],
  "mythic_reject_reasons": [],
  "explicit_negation_behavior": "inspected",
  "interpretive_diagnostics": {
    "selection_notes": {
      "archetype_reasons": [
        "[] — the dream shows routine domestic coordination, but no strongly enacted archetypal function beyond ordinary partnership logistics."
      ],
      "mythic_reason": "[] — there is no distinctive mythic sequence, ordeal, descent, or transformation pattern.",
      "near_misses": [
        "partner dynamics are present, but not with enough beloved charge for Lover",
        "no threshold crossing is staged beyond a routine door code exchange"
      ]
    }
  }
}
```

### F_neg_partner_logistics_en_semantic_r3
```json
{
  "fixture_id": "F_neg_partner_logistics_en",
  "run_id": "F_neg_partner_logistics_en_semantic_r3_a1_t1",
  "attempt_count": 1,
  "model": "gpt-5.4-mini-2026-03-17",
  "latency_ms": 8605,
  "cost_usd": 0.00405945,
  "raw_archetypes": [],
  "post_validation_archetypes": [],
  "mechanism_tags_by_archetype": {},
  "validator_decisions": [],
  "archetype_reject_reasons": [],
  "central_conflicts": [],
  "main_tension": null,
  "core_mode": "Core State",
  "raw_amplifications": [],
  "post_validation_amplifications": [],
  "mythic_reject_reasons": [],
  "explicit_negation_behavior": "inspected",
  "interpretive_diagnostics": {
    "selection_notes": {
      "archetype_reasons": [
        "[] — the dream shows coordination and brief contact, but no archetypal function is clearly enacted beyond ordinary domestic logistics."
      ],
      "mythic_reason": "[] — there is no distinct mythic sequence of descent, trial, transformation, or return.",
      "near_misses": [
        "Lover was not selected because the partner relationship is present but not organized as intimate or erotic bond in the dream.",
        "Guide / Psychopomp was not selected because the door code and movement are practical, not threshold guidance."
      ]
    }
  }
}
```

### F_neg_romance_cue_only_en_semantic_r1
```json
{
  "fixture_id": "F_neg_romance_cue_only_en",
  "run_id": "F_neg_romance_cue_only_en_semantic_r1_a1_t1",
  "attempt_count": 1,
  "model": "gpt-5.4-mini-2026-03-17",
  "latency_ms": 4313,
  "cost_usd": 0.00406695,
  "raw_archetypes": [],
  "post_validation_archetypes": [],
  "mechanism_tags_by_archetype": {},
  "validator_decisions": [],
  "archetype_reject_reasons": [],
  "central_conflicts": [
    "belonging vs not finding your place"
  ],
  "main_tension": "belonging vs not finding your place",
  "core_mode": "Core Tension",
  "raw_amplifications": [],
  "post_validation_amplifications": [],
  "mythic_reject_reasons": [],
  "explicit_negation_behavior": "inspected",
  "interpretive_diagnostics": {
    "selection_notes": {
      "archetype_reasons": [
        "[]"
      ],
      "mythic_reason": "[]",
      "near_misses": [
        "Lover was not selected because the kiss is brief, public, and not sustained as a beloved bond.",
        "Persona was not selected because the dream shows social appearance, but not a tense public mask organizing identity.",
        "Cinderella was not selected because there is no humiliation, concealment, or recognition token beyond a missing table number."
      ]
    }
  }
}
```

### F_neg_romance_cue_only_en_semantic_r2
```json
{
  "fixture_id": "F_neg_romance_cue_only_en",
  "run_id": "F_neg_romance_cue_only_en_semantic_r2_a1_t1",
  "attempt_count": 1,
  "model": "gpt-5.4-mini-2026-03-17",
  "latency_ms": 3874,
  "cost_usd": 0.00394395,
  "raw_archetypes": [],
  "post_validation_archetypes": [],
  "mechanism_tags_by_archetype": {},
  "validator_decisions": [],
  "archetype_reject_reasons": [],
  "central_conflicts": [],
  "main_tension": null,
  "core_mode": null,
  "raw_amplifications": [],
  "post_validation_amplifications": [],
  "mythic_reject_reasons": [],
  "explicit_negation_behavior": "inspected",
  "interpretive_diagnostics": {
    "selection_notes": {
      "archetype_reasons": [
        "[]"
      ],
      "mythic_reason": "[]",
      "near_misses": [
        "Persona was not selected because the dream shows public visibility, but not a socially managed mask or role tension.",
        "Lover was not selected because the kiss is brief and non-sustained, and the dream explicitly stays with search rather than chosen intimacy."
      ]
    }
  }
}
```

### F_neg_romance_cue_only_en_semantic_r3
```json
{
  "fixture_id": "F_neg_romance_cue_only_en",
  "run_id": "F_neg_romance_cue_only_en_semantic_r3_a1_t1",
  "attempt_count": 1,
  "model": "gpt-5.4-mini-2026-03-17",
  "latency_ms": 5136,
  "cost_usd": 0.0042942,
  "raw_archetypes": [],
  "post_validation_archetypes": [],
  "mechanism_tags_by_archetype": {},
  "validator_decisions": [],
  "archetype_reject_reasons": [],
  "central_conflicts": [],
  "main_tension": null,
  "core_mode": null,
  "raw_amplifications": [],
  "post_validation_amplifications": [],
  "mythic_reject_reasons": [],
  "explicit_negation_behavior": "inspected",
  "interpretive_diagnostics": {
    "selection_notes": {
      "archetype_reasons": [
        "[] — the dream contains social contact and a vanished kiss, but no enacted archetypal function is clearly organized around them."
      ],
      "mythic_reason": "[] — no supplied mythic sequence is strongly enacted; the dream stays on a simple social search and does not reach a qualifying narrative pattern.",
      "near_misses": [
        "Lover was rejected because the kiss is brief and non-developing rather than a sustained beloved bond.",
        "Persona was rejected because the dress is present, but no clear performance-vs-private-self tension organizes the dream."
      ]
    }
  }
}
```

### F_neg_kitchen_glass_el_semantic_r1
```json
{
  "fixture_id": "F_neg_kitchen_glass_el",
  "run_id": "F_neg_kitchen_glass_el_semantic_r1_a1_t1",
  "attempt_count": 1,
  "model": "gpt-5.4-mini-2026-03-17",
  "latency_ms": 5342,
  "cost_usd": 0.00493695,
  "raw_archetypes": [],
  "post_validation_archetypes": [],
  "mechanism_tags_by_archetype": {},
  "validator_decisions": [],
  "archetype_reject_reasons": [],
  "central_conflicts": [
    "καθαρό νερό vs άπλυτα ποτήρια"
  ],
  "main_tension": "καθαρό νερό vs άπλυτα ποτήρια",
  "core_mode": "Core Tension",
  "raw_amplifications": [],
  "post_validation_amplifications": [],
  "mythic_reject_reasons": [],
  "explicit_negation_behavior": "n/a",
  "interpretive_diagnostics": {
    "selection_notes": {
      "archetype_reasons": [
        "[]"
      ],
      "mythic_reason": "[]",
      "near_misses": [
        "Απορρίφθηκε οτιδήποτε μυθολογικό ή αρχετυπικό επειδή η σκηνή είναι καθημερινή, πρακτική και χωρίς επαρκή δομική μεταμόρφωση ή σκιώδη/ηρωική πλοκή.",
        "Δεν επιλέχθηκε σύγκρουση πέρα από την άμεση πρακτική αντίθεση, γιατί η σκηνή λύνει το πρόβλημα με απλή φροντίδα."
      ]
    }
  }
}
```

### F_neg_kitchen_glass_el_semantic_r2
```json
{
  "fixture_id": "F_neg_kitchen_glass_el",
  "run_id": "F_neg_kitchen_glass_el_semantic_r2_a1_t1",
  "attempt_count": 1,
  "model": "gpt-5.4-mini-2026-03-17",
  "latency_ms": 18251,
  "cost_usd": 0.00443835,
  "raw_archetypes": [],
  "post_validation_archetypes": [],
  "mechanism_tags_by_archetype": {},
  "validator_decisions": [],
  "archetype_reject_reasons": [],
  "central_conflicts": [],
  "main_tension": null,
  "core_mode": "Core Restoration",
  "raw_amplifications": [],
  "post_validation_amplifications": [],
  "mythic_reject_reasons": [],
  "explicit_negation_behavior": "n/a",
  "interpretive_diagnostics": {
    "selection_notes": {
      "archetype_reasons": [
        "[]"
      ],
      "mythic_reason": "[]",
      "near_misses": [
        "Δεν επιλέχθηκε μυθικός τύπος επειδή η σκηνή είναι οικιακή, σύντομη και χωρίς σαφή υπερπροσωπική ακολουθία.",
        "Δεν επιλέχθηκε αρχέτυπο επειδή η πράξη παραμένει πρακτική αυτοεξυπηρέτηση χωρίς καθαρά οργανωτική λειτουργία σχέσης ή μετάβασης."
      ]
    }
  }
}
```

### F_neg_kitchen_glass_el_semantic_r3
```json
{
  "fixture_id": "F_neg_kitchen_glass_el",
  "run_id": "F_neg_kitchen_glass_el_semantic_r3_a1_t4",
  "attempt_count": 1,
  "model": "gpt-5.4-mini-2026-03-17",
  "latency_ms": 5076,
  "cost_usd": 0.0045981,
  "raw_archetypes": [],
  "post_validation_archetypes": [],
  "mechanism_tags_by_archetype": {},
  "validator_decisions": [],
  "archetype_reject_reasons": [],
  "central_conflicts": [],
  "main_tension": null,
  "core_mode": "Core Restoration",
  "raw_amplifications": [],
  "post_validation_amplifications": [],
  "mythic_reject_reasons": [],
  "explicit_negation_behavior": "n/a",
  "interpretive_diagnostics": {
    "selection_notes": {
      "archetype_reasons": [
        "[]"
      ],
      "mythic_reason": "[]",
      "near_misses": [
        "καμία σαφής αρχετυπική λειτουργία δεν οργανώνει το όνειρο",
        "κανένας μυθικός μύθος δεν ταιριάζει με τη σύντομη οικιακή ακολουθία"
      ]
    }
  }
}
```

### F_neg_kitchen_glass_el_semantic_r4
```json
{
  "fixture_id": "F_neg_kitchen_glass_el",
  "run_id": "F_neg_kitchen_glass_el_semantic_r4_a1_t1",
  "attempt_count": 1,
  "model": "gpt-5.4-mini-2026-03-17",
  "latency_ms": 7587,
  "cost_usd": 0.0051576,
  "raw_archetypes": [],
  "post_validation_archetypes": [],
  "mechanism_tags_by_archetype": {},
  "validator_decisions": [],
  "archetype_reject_reasons": [],
  "central_conflicts": [
    "καθαρότητα vs ακαταστασία"
  ],
  "main_tension": "καθαρότητα vs ακαταστασία",
  "core_mode": "Core Restoration",
  "raw_amplifications": [],
  "post_validation_amplifications": [],
  "mythic_reject_reasons": [],
  "explicit_negation_behavior": "n/a",
  "interpretive_diagnostics": {
    "selection_notes": {
      "archetype_reasons": [
        "[] — δεν ενεργοποιείται καθαρά κάποιο καταγεγραμμένο αρχετυπικό μοτίβο πέρα από μια απλή πρακτική πράξη καθαρισμού."
      ],
      "mythic_reason": "[] — δεν υπάρχει αρκετά ισχυρή μυθική ακολουθία, δοκιμασία ή μεταμορφωτικό σχήμα.",
      "near_misses": [
        "Απορρίφθηκε ο Ήρωας: υπάρχει πράξη επίλυσης, αλλά όχι δοκιμασία με κέρδος/διέλευση.",
        "Απορρίφθηκε η Μεταμόρφωση Death–Rebirth: η σκηνή είναι αποκαταστατική, όχι θανάτου/αναγέννησης.",
        "Απορρίφθηκαν μυθικά σχήματα κάθοδος/αναζήτηση: λείπει η απαιτούμενη αιτιακή ακολουθία."
      ]
    }
  }
}
```

### F_neg_kitchen_glass_el_semantic_r5
```json
{
  "fixture_id": "F_neg_kitchen_glass_el",
  "run_id": "F_neg_kitchen_glass_el_semantic_r5_a1_t1",
  "attempt_count": 1,
  "model": "gpt-5.4-mini-2026-03-17",
  "latency_ms": 5421,
  "cost_usd": 0.00456585,
  "raw_archetypes": [],
  "post_validation_archetypes": [],
  "mechanism_tags_by_archetype": {},
  "validator_decisions": [],
  "archetype_reject_reasons": [],
  "central_conflicts": [],
  "main_tension": null,
  "core_mode": "Core State",
  "raw_amplifications": [],
  "post_validation_amplifications": [],
  "mythic_reject_reasons": [],
  "explicit_negation_behavior": "n/a",
  "interpretive_diagnostics": {
    "selection_notes": {
      "archetype_reasons": [
        "[]"
      ],
      "mythic_reason": "[]",
      "near_misses": [
        "Καμία αρχετυπική λειτουργία δεν οργανώνεται καθαρά πέρα από μια απλή οικιακή πράξη.",
        "Καμία μυθική ακολουθία δεν αναδύεται: λείπουν σαφείς οριακές μεταβάσεις, απώλεια, καταδίωξη ή τελετουργική μεταβολή."
      ]
    }
  }
}
```

### F_neg_surface_depth_harmony_el_semantic_r1
```json
{
  "fixture_id": "F_neg_surface_depth_harmony_el",
  "run_id": "F_neg_surface_depth_harmony_el_semantic_r1_a1_t2",
  "attempt_count": 1,
  "model": "gpt-5.4-mini-2026-03-17",
  "latency_ms": 5598,
  "cost_usd": 0.00500895,
  "raw_archetypes": [],
  "post_validation_archetypes": [],
  "mechanism_tags_by_archetype": {},
  "validator_decisions": [],
  "archetype_reject_reasons": [],
  "central_conflicts": [],
  "main_tension": null,
  "core_mode": "Core State",
  "raw_amplifications": [],
  "post_validation_amplifications": [],
  "mythic_reject_reasons": [],
  "explicit_negation_behavior": "n/a",
  "interpretive_diagnostics": {
    "selection_notes": {
      "archetype_reasons": [
        "[]"
      ],
      "mythic_reason": "[]",
      "near_misses": [
        "Καμία σαφής αρχετυπική λειτουργία ή μυθική ακολουθία δεν ενεργοποιείται· η σκηνή μένει ενιαία και γαλήνια χωρίς σύγκρουση, απομάκρυνση ή δοκιμασία."
      ]
    }
  }
}
```

### F_neg_surface_depth_harmony_el_semantic_r2
```json
{
  "fixture_id": "F_neg_surface_depth_harmony_el",
  "run_id": "F_neg_surface_depth_harmony_el_semantic_r2_a1_t1",
  "attempt_count": 1,
  "model": "gpt-5.4-mini-2026-03-17",
  "latency_ms": 5947,
  "cost_usd": 0.0049842,
  "raw_archetypes": [],
  "post_validation_archetypes": [],
  "mechanism_tags_by_archetype": {},
  "validator_decisions": [],
  "archetype_reject_reasons": [],
  "central_conflicts": [],
  "main_tension": null,
  "core_mode": "Core State",
  "raw_amplifications": [],
  "post_validation_amplifications": [],
  "mythic_reject_reasons": [],
  "explicit_negation_behavior": "n/a",
  "interpretive_diagnostics": {
    "selection_notes": {
      "archetype_reasons": [
        "[]"
      ],
      "mythic_reason": "[]",
      "near_misses": [
        "Καμία μυθική ή αρχέτυπη αντιστοιχία δεν ξεχώρισε, επειδή το όνειρο είναι καθαρά αρμονικό και δεν οργανώνεται από δοκιμασία, διάβαση ή σύγκρουση."
      ]
    }
  }
}
```

### F_neg_surface_depth_harmony_el_semantic_r3
```json
{
  "fixture_id": "F_neg_surface_depth_harmony_el",
  "run_id": "F_neg_surface_depth_harmony_el_semantic_r3_a1_t1",
  "attempt_count": 1,
  "model": "gpt-5.4-mini-2026-03-17",
  "latency_ms": 5943,
  "cost_usd": 0.0047577,
  "raw_archetypes": [],
  "post_validation_archetypes": [],
  "mechanism_tags_by_archetype": {},
  "validator_decisions": [],
  "archetype_reject_reasons": [],
  "central_conflicts": [],
  "main_tension": null,
  "core_mode": "Core State",
  "raw_amplifications": [],
  "post_validation_amplifications": [],
  "mythic_reject_reasons": [],
  "explicit_negation_behavior": "n/a",
  "interpretive_diagnostics": {
    "selection_notes": {
      "archetype_reasons": [
        "[]"
      ],
      "mythic_reason": "[]",
      "near_misses": [
        "Καμία μύθικη αντιστοιχία δεν έδεσε, επειδή δεν υπάρχει δοκιμασία, απώλεια, κάθοδος ή μεταβολή· μόνο ήρεμη συνύπαρξη επιφάνειας και βάθους."
      ]
    }
  }
}
```

### F_neg_spatial_conflict_control_el_semantic_r1
```json
{
  "fixture_id": "F_neg_spatial_conflict_control_el",
  "run_id": "F_neg_spatial_conflict_control_el_semantic_r1_a1_t3",
  "attempt_count": 1,
  "model": "gpt-5.4-mini-2026-03-17",
  "latency_ms": 5384,
  "cost_usd": 0.0051207,
  "raw_archetypes": [],
  "post_validation_archetypes": [],
  "mechanism_tags_by_archetype": {},
  "validator_decisions": [],
  "archetype_reject_reasons": [],
  "central_conflicts": [
    "κάθοδος vs εμπόδιση"
  ],
  "main_tension": "κάθοδος vs εμπόδιση",
  "core_mode": "Core Tension",
  "raw_amplifications": [],
  "post_validation_amplifications": [],
  "mythic_reject_reasons": [],
  "explicit_negation_behavior": "n/a",
  "interpretive_diagnostics": {
    "selection_notes": {
      "archetype_reasons": [
        "[]"
      ],
      "mythic_reason": "[]",
      "near_misses": [
        "Απορρίφθηκε ο Guide / Psychopomp: υπάρχει επιθυμία για κάθοδο, αλλά όχι ενεργή καθοδήγηση σε μετάβαση.",
        "Απορρίφθηκε το Sisyphus: υπάρχει επαναλαμβανόμενη ματαίωση, αλλά όχι οριζόντιος καταναγκαστικός κύκλος με ίδια εργασία και επιστροφή στη βάση.",
        "Απορρίφθηκε το Orphan: η σκηνή δείχνει εμπόδιση πρόσβασης, όχι εγκατάλειψη ή οργανωμένη έλλειψη ανήκειν."
      ]
    }
  }
}
```

### F_neg_spatial_conflict_control_el_semantic_r2
```json
{
  "fixture_id": "F_neg_spatial_conflict_control_el",
  "run_id": "F_neg_spatial_conflict_control_el_semantic_r2_a1_t3",
  "attempt_count": 1,
  "model": "gpt-5.4-mini-2026-03-17",
  "latency_ms": 4643,
  "cost_usd": 0.00442245,
  "raw_archetypes": [],
  "post_validation_archetypes": [],
  "mechanism_tags_by_archetype": {},
  "validator_decisions": [],
  "archetype_reject_reasons": [],
  "central_conflicts": [
    "κάθοδος vs εμπόδιο"
  ],
  "main_tension": "κάθοδος vs εμπόδιο",
  "core_mode": "Core Tension",
  "raw_amplifications": [],
  "post_validation_amplifications": [],
  "mythic_reject_reasons": [],
  "explicit_negation_behavior": "n/a",
  "interpretive_diagnostics": {
    "selection_notes": {
      "archetype_reasons": [
        "[]"
      ],
      "mythic_reason": "[]",
      "near_misses": [
        "Το «κάθοδος» από μόνο του δεν έφτανε για μύθο με καθορισμένη διαδοχή ή αναγνώσιμη σωτηρία/επιστροφή."
      ]
    }
  }
}
```

### F_neg_spatial_conflict_control_el_semantic_r3
```json
{
  "fixture_id": "F_neg_spatial_conflict_control_el",
  "run_id": "F_neg_spatial_conflict_control_el_semantic_r3_a1_t3",
  "attempt_count": 1,
  "model": "gpt-5.4-mini-2026-03-17",
  "latency_ms": 5287,
  "cost_usd": 0.00494295,
  "raw_archetypes": [],
  "post_validation_archetypes": [],
  "mechanism_tags_by_archetype": {},
  "validator_decisions": [],
  "archetype_reject_reasons": [],
  "central_conflicts": [
    "θέλω να κατέβω vs το κτίριο δεν με αφήνει"
  ],
  "main_tension": "θέλω να κατέβω vs το κτίριο δεν με αφήνει",
  "core_mode": "Core Tension",
  "raw_amplifications": [],
  "post_validation_amplifications": [],
  "mythic_reject_reasons": [],
  "explicit_negation_behavior": "n/a",
  "interpretive_diagnostics": {
    "selection_notes": {
      "archetype_reasons": [
        "[]"
      ],
      "mythic_reason": "[]",
      "near_misses": [
        "Δεν επιλέχθηκε κανένα αρχέτυπο, γιατί το όνειρο είναι κυρίως χωρική παρεμπόδιση χωρίς σαφή λειτουργία προσώπου ή αρχετυπική διαδικασία.",
        "Δεν επιλέχθηκε μυθικό πρότυπο, γιατί δεν υπάρχει διαδοχική μεταμόρφωση ή αναγνωρίσιμη μυθική ακολουθία, μόνο σταθερό μπλοκάρισμα της καθόδου."
      ]
    }
  }
}
```

### F_pos_persona_stage_suit_el_semantic_r1
```json
{
  "fixture_id": "F_pos_persona_stage_suit_el",
  "run_id": "F_pos_persona_stage_suit_el_semantic_r1_a1_t2",
  "attempt_count": 1,
  "model": "gpt-5.4-mini-2026-03-17",
  "latency_ms": 6917,
  "cost_usd": 0.00613545,
  "raw_archetypes": [
    {
      "archetype_id": "persona",
      "expression": "η τέλεια σκούρα στολή με το κεντημένο όνομα και η ψυχρή, επίσημη φωνή μπροστά στο κοινό",
      "resonance": "Η δημόσια μορφή οργανώνει όλο το πεδίο, ενώ η πιο ιδιωτική φωνή πιέζεται να σιωπήσει ή να χαθεί μέσα στην επιτέλεση.",
      "confidence": "high",
      "mechanism_tags": [
        "public_role_or_social_mask",
        "private_self_conflict"
      ],
      "evidence_ids": [
        "D1",
        "D2",
        "D3",
        "D4",
        "D5"
      ]
    }
  ],
  "post_validation_archetypes": [
    {
      "canonical_label": "Persona",
      "expression": "η τέλεια σκούρα στολή με το κεντημένο όνομα και η ψυχρή, επίσημη φωνή μπροστά στο κοινό",
      "resonance": "Η δημόσια μορφή οργανώνει όλο το πεδίο, ενώ η πιο ιδιωτική φωνή πιέζεται να σιωπήσει ή να χαθεί μέσα στην επιτέλεση.",
      "evidence": [
        "Ήμουν σε ένα μεγάλο θέατρο όπου όλοι περίμεναν να παρουσιάσω τα οικονομικά μιας εταιρείας.",
        "Μόλις στάθηκα μπροστά στο κοινό, η φωνή μου έγινε ψυχρή και επίσημη, παρότι μέσα μου ήθελα να πω ότι δεν γνώριζα τις απαντήσεις."
      ],
      "confidence": "high",
      "archetype_id": "persona",
      "archetype_catalog_version": "1.7.1",
      "evidence_ids": [
        "D1",
        "D2",
        "D3",
        "D4",
        "D5"
      ]
    }
  ],
  "mechanism_tags_by_archetype": {
    "persona": [
      "public_role_or_social_mask",
      "private_self_conflict"
    ]
  },
  "validator_decisions": [
    {
      "archetype_id": "persona",
      "canonical_label": "Persona",
      "accepted": true,
      "rejection_codes": [],
      "rejection_reason": null,
      "mechanism_tags": [
        "public_role_or_social_mask",
        "private_self_conflict"
      ],
      "evidence_ids": [
        "D1",
        "D2",
        "D3",
        "D4",
        "D5"
      ]
    }
  ],
  "archetype_reject_reasons": [],
  "central_conflicts": [
    "δική μου φωνή vs επίσημος ρόλος"
  ],
  "main_tension": "δική μου φωνή vs επίσημος ρόλος",
  "core_mode": "Core Tension",
  "raw_amplifications": [],
  "post_validation_amplifications": [],
  "mythic_reject_reasons": [],
  "explicit_negation_behavior": "n/a",
  "interpretive_diagnostics": {
    "selection_notes": {
      "archetype_reasons": [
        "persona: η σκηνή, το κοινό, η τέλεια στολή με το όνομα και η αλλοίωση της προσωπικής φωνής δείχνουν δημόσιο προσωπείο που οργανώνει το όνειρο."
      ],
      "mythic_reason": "[]",
      "near_misses": [
        "double: δεν υπάρχει δεύτερη μορφή που να παίρνει τη θέση σου.",
        "ruler: υπάρχει κοινό και επίσημη παρουσία, αλλά όχι ενσώματη κυριαρχία που να κυβερνά το πεδίο.",
        "tower_babel: υπάρχει δημόσια ομιλία, αλλά όχι συλλογική σύγχυση γλώσσας ή κοινό οικοδόμημα."
      ]
    }
  }
}
```

### F_pos_persona_stage_suit_el_semantic_r2
```json
{
  "fixture_id": "F_pos_persona_stage_suit_el",
  "run_id": "F_pos_persona_stage_suit_el_semantic_r2_a1_t4",
  "attempt_count": 1,
  "model": "gpt-5.4-mini-2026-03-17",
  "latency_ms": 7467,
  "cost_usd": 0.00606285,
  "raw_archetypes": [
    {
      "archetype_id": "persona",
      "expression": "η τέλεια σκούρα στολή με το όνομά μου και η επίσημη φωνή μπροστά στο κοινό",
      "resonance": "Η σκηνή οργανώνεται γύρω από έναν άψογο δημόσιο ρόλο που καλύπτει και πιέζει μια πιο ιδιωτική, αβέβαιη φωνή.",
      "confidence": "high",
      "mechanism_tags": [
        "public_role_or_social_mask",
        "private_self_conflict"
      ],
      "evidence_ids": [
        "D1",
        "D2",
        "D3",
        "D4",
        "D5"
      ]
    }
  ],
  "post_validation_archetypes": [
    {
      "canonical_label": "Persona",
      "expression": "η τέλεια σκούρα στολή με το όνομά μου και η επίσημη φωνή μπροστά στο κοινό",
      "resonance": "Η σκηνή οργανώνεται γύρω από έναν άψογο δημόσιο ρόλο που καλύπτει και πιέζει μια πιο ιδιωτική, αβέβαιη φωνή.",
      "evidence": [
        "Ήμουν σε ένα μεγάλο θέατρο όπου όλοι περίμεναν να παρουσιάσω τα οικονομικά μιας εταιρείας.",
        "Μόλις στάθηκα μπροστά στο κοινό, η φωνή μου έγινε ψυχρή και επίσημη, παρότι μέσα μου ήθελα να πω ότι δεν γνώριζα τις απαντήσεις."
      ],
      "confidence": "high",
      "archetype_id": "persona",
      "archetype_catalog_version": "1.7.1",
      "evidence_ids": [
        "D1",
        "D2",
        "D3",
        "D4",
        "D5"
      ]
    }
  ],
  "mechanism_tags_by_archetype": {
    "persona": [
      "public_role_or_social_mask",
      "private_self_conflict"
    ]
  },
  "validator_decisions": [
    {
      "archetype_id": "persona",
      "canonical_label": "Persona",
      "accepted": true,
      "rejection_codes": [],
      "rejection_reason": null,
      "mechanism_tags": [
        "public_role_or_social_mask",
        "private_self_conflict"
      ],
      "evidence_ids": [
        "D1",
        "D2",
        "D3",
        "D4",
        "D5"
      ]
    }
  ],
  "archetype_reject_reasons": [],
  "central_conflicts": [
    "δημόσιος ρόλος vs δική μου φωνή"
  ],
  "main_tension": "δημόσιος ρόλος vs δική μου φωνή",
  "core_mode": "Core Tension",
  "raw_amplifications": [],
  "post_validation_amplifications": [],
  "mythic_reject_reasons": [],
  "explicit_negation_behavior": "n/a",
  "interpretive_diagnostics": {
    "selection_notes": {
      "archetype_reasons": [
        "Επιλέχθηκε το persona επειδή η τελειακή στολή, το κεντημένο όνομα, η ψυχρή επίσημη φωνή και η μετατόπιση μπροστά στο κοινό δείχνουν λειτουργία κοινωνικής μάσκας που συγκρούεται με ιδιωτική φωνή."
      ],
      "mythic_reason": "[]",
      "near_misses": [
        "Δεν επιλέχθηκε double, επειδή δεν υπάρχει σαφής αντίπαλο-αντικαταστάτης που να καταλαμβάνει τη θέση του ονειρευόμενου.",
        "Δεν επιλέχθηκε ruler ή father, επειδή υπάρχει δημόσια απαίτηση αλλά όχι ενσώματη κυριαρχία ή πατρική αξίωση ως δομή του ονείρου."
      ]
    }
  }
}
```

### F_pos_persona_stage_suit_el_semantic_r3
```json
{
  "fixture_id": "F_pos_persona_stage_suit_el",
  "run_id": "F_pos_persona_stage_suit_el_semantic_r3_a1_t2",
  "attempt_count": 1,
  "model": "gpt-5.4-mini-2026-03-17",
  "latency_ms": 6577,
  "cost_usd": 0.0060711,
  "raw_archetypes": [
    {
      "archetype_id": "persona",
      "expression": "η τέλεια σκούρα στολή με το όνομα κεντημένο και η επίσημη φωνή μπροστά στο κοινό",
      "resonance": "Η δημόσια μορφή οργανώνει όλη τη σκηνή, ενώ η δική σου φωνή πιέζεται να μείνει κάτω από το φορεμένο ρόλο.",
      "confidence": "high",
      "mechanism_tags": [
        "public_role_or_social_mask",
        "private_self_conflict"
      ],
      "evidence_ids": [
        "D1",
        "D2",
        "D3",
        "D4",
        "D5"
      ]
    }
  ],
  "post_validation_archetypes": [
    {
      "canonical_label": "Persona",
      "expression": "η τέλεια σκούρα στολή με το όνομα κεντημένο και η επίσημη φωνή μπροστά στο κοινό",
      "resonance": "Η δημόσια μορφή οργανώνει όλη τη σκηνή, ενώ η δική σου φωνή πιέζεται να μείνει κάτω από το φορεμένο ρόλο.",
      "evidence": [
        "Ήμουν σε ένα μεγάλο θέατρο όπου όλοι περίμεναν να παρουσιάσω τα οικονομικά μιας εταιρείας.",
        "Μόλις στάθηκα μπροστά στο κοινό, η φωνή μου έγινε ψυχρή και επίσημη, παρότι μέσα μου ήθελα να πω ότι δεν γνώριζα τις απαντήσεις."
      ],
      "confidence": "high",
      "archetype_id": "persona",
      "archetype_catalog_version": "1.7.1",
      "evidence_ids": [
        "D1",
        "D2",
        "D3",
        "D4",
        "D5"
      ]
    }
  ],
  "mechanism_tags_by_archetype": {
    "persona": [
      "public_role_or_social_mask",
      "private_self_conflict"
    ]
  },
  "validator_decisions": [
    {
      "archetype_id": "persona",
      "canonical_label": "Persona",
      "accepted": true,
      "rejection_codes": [],
      "rejection_reason": null,
      "mechanism_tags": [
        "public_role_or_social_mask",
        "private_self_conflict"
      ],
      "evidence_ids": [
        "D1",
        "D2",
        "D3",
        "D4",
        "D5"
      ]
    }
  ],
  "archetype_reject_reasons": [],
  "central_conflicts": [
    "δική μου φωνή vs επίσημη στολή"
  ],
  "main_tension": "δική μου φωνή vs επίσημη στολή",
  "core_mode": "Core Tension",
  "raw_amplifications": [],
  "post_validation_amplifications": [],
  "mythic_reject_reasons": [],
  "explicit_negation_behavior": "n/a",
  "interpretive_diagnostics": {
    "selection_notes": {
      "archetype_reasons": [
        "persona: η δημόσια σκηνή, η τέλεια στολή με το κεντημένο όνομα, και η ψυχρή επίσημη φωνή συγκροτούν καθαρά κοινωνική μάσκα σε ένταση με το ιδιωτικό πρόσωπο."
      ],
      "mythic_reason": "[]",
      "near_misses": [
        "ruler: υπάρχει κοινό και παρουσία, αλλά όχι κυρίαρχη προσωπική εξουσία που να οργανώνει το όνειρο.",
        "double: υπάρχει απώλεια της δικής σου φωνής, αλλά όχι δεύτερο πρόσωπο που να σε αντικαθιστά ή να διεκδικεί τη θέση σου."
      ]
    }
  }
}
```

### F_pos_mother_kitchen_en_semantic_r1
```json
{
  "fixture_id": "F_pos_mother_kitchen_en",
  "run_id": "F_pos_mother_kitchen_en_semantic_r1_a2_t1",
  "attempt_count": 2,
  "model": "gpt-5.4-mini-2026-03-17",
  "latency_ms": 5690,
  "cost_usd": 0.00512895,
  "raw_archetypes": [
    {
      "archetype_id": "mother",
      "expression": "An enormous woman feeds me broth, wraps me in a shawl, and keeps the table steady while the storm rages outside.",
      "resonance": "A maternal holding presence organizes the whole scene through nourishment, warmth, and protection against the storm.",
      "confidence": "high",
      "mechanism_tags": [
        "bond_organizes_dream"
      ],
      "evidence_ids": [
        "D1"
      ]
    }
  ],
  "post_validation_archetypes": [
    {
      "canonical_label": "Mother",
      "expression": "An enormous woman feeds me broth, wraps me in a shawl, and keeps the table steady while the storm rages outside.",
      "resonance": "A maternal holding presence organizes the whole scene through nourishment, warmth, and protection against the storm.",
      "evidence": [
        "An enormous woman fills a stone kitchen. She feeds me broth that warms my chest and wraps me in a shawl that smells like rain soil. Outside a storm tears roofs away, but her table stays steady. When I try to stand without her arm I feel cold immediately; when I lean back into her the storm softens."
      ],
      "confidence": "high",
      "archetype_id": "mother",
      "archetype_catalog_version": "1.7.1",
      "evidence_ids": [
        "D1"
      ]
    }
  ],
  "mechanism_tags_by_archetype": {
    "mother": [
      "bond_organizes_dream"
    ]
  },
  "validator_decisions": [
    {
      "archetype_id": "mother",
      "canonical_label": "Mother",
      "accepted": true,
      "rejection_codes": [],
      "rejection_reason": null,
      "mechanism_tags": [
        "bond_organizes_dream"
      ],
      "evidence_ids": [
        "D1"
      ]
    }
  ],
  "archetype_reject_reasons": [],
  "central_conflicts": [
    "warmth and holding vs cold exposure"
  ],
  "main_tension": "warmth and holding vs cold exposure",
  "core_mode": "Core Restoration",
  "raw_amplifications": [
    {
      "catalog_id": "greek.demeter_persephone",
      "resonance": "A maternal field holds a dependent figure close while an outside force threatens separation, and safety is maintained through continued bonding.",
      "divergence": "The dream stays local and intimate, with no underworld custody, negotiated return, or seasonal consequence.",
      "evidence_ids": [
        "D1"
      ],
      "evidence": [],
      "confidence": "medium"
    }
  ],
  "post_validation_amplifications": [
    {
      "catalog_id": "greek.demeter_persephone",
      "title": "Demeter and Persephone",
      "tradition": "Greek mythology",
      "source_type": "mythic_cycle",
      "resonance": "A maternal field holds a dependent figure close while an outside force threatens separation, and safety is maintained through continued bonding.",
      "divergence": "The dream stays local and intimate, with no underworld custody, negotiated return, or seasonal consequence.",
      "evidence": [
        "An enormous woman fills a stone kitchen. She feeds me broth that warms my chest and wraps me in a shawl that smells like rain soil. Outside a storm tears roofs away, but her table stays steady. When I try to stand without her arm I feel cold immediately; when I lean back into her the storm softens."
      ],
      "confidence": "medium",
      "catalog_myth_version": "1.3.0"
    }
  ],
  "mythic_reject_reasons": [],
  "explicit_negation_behavior": "n/a",
  "interpretive_diagnostics": {
    "selection_notes": {
      "archetype_reasons": [
        "mother: the woman is explicitly nurturing, feeding, wrapping, and maintaining the dreamer’s warmth and safety; her containing presence organizes the scene."
      ],
      "mythic_reason": "greek.demeter_persephone: the dream shows a maternal holding field around a dependent figure, with threatened exposure outside and safety tied to staying close; however, it lacks underworld separation or cyclical return, so the match is only partial.",
      "near_misses": [
        "mother was the strongest fit; guide_psychopomp and lover were not earned because there is no crossing or erotic bond.",
        "No mythic echo from exact descent/return tales was strong enough to override the dream’s simple protective household scene."
      ]
    }
  }
}
```

### F_pos_mother_kitchen_en_semantic_r2
```json
{
  "fixture_id": "F_pos_mother_kitchen_en",
  "run_id": "F_pos_mother_kitchen_en_semantic_r2_a1_t1",
  "attempt_count": 1,
  "model": "gpt-5.4-mini-2026-03-17",
  "latency_ms": 4550,
  "cost_usd": 0.0043557,
  "raw_archetypes": [
    {
      "archetype_id": "mother",
      "expression": "the enormous woman feeding broth and wrapping the dreamer in a shawl",
      "resonance": "A maternal presence organizes the whole scene through feeding, covering, and steady holding against the storm.",
      "confidence": "high",
      "mechanism_tags": [
        "bond_organizes_dream"
      ],
      "evidence_ids": [
        "D1"
      ]
    }
  ],
  "post_validation_archetypes": [
    {
      "canonical_label": "Mother",
      "expression": "the enormous woman feeding broth and wrapping the dreamer in a shawl",
      "resonance": "A maternal presence organizes the whole scene through feeding, covering, and steady holding against the storm.",
      "evidence": [
        "An enormous woman fills a stone kitchen. She feeds me broth that warms my chest and wraps me in a shawl that smells like rain soil. Outside a storm tears roofs away, but her table stays steady. When I try to stand without her arm I feel cold immediately; when I lean back into her the storm softens."
      ],
      "confidence": "high",
      "archetype_id": "mother",
      "archetype_catalog_version": "1.7.1",
      "evidence_ids": [
        "D1"
      ]
    }
  ],
  "mechanism_tags_by_archetype": {
    "mother": [
      "bond_organizes_dream"
    ]
  },
  "validator_decisions": [
    {
      "archetype_id": "mother",
      "canonical_label": "Mother",
      "accepted": true,
      "rejection_codes": [],
      "rejection_reason": null,
      "mechanism_tags": [
        "bond_organizes_dream"
      ],
      "evidence_ids": [
        "D1"
      ]
    }
  ],
  "archetype_reject_reasons": [],
  "central_conflicts": [],
  "main_tension": null,
  "core_mode": "Core Restoration",
  "raw_amplifications": [],
  "post_validation_amplifications": [],
  "mythic_reject_reasons": [],
  "explicit_negation_behavior": "n/a",
  "interpretive_diagnostics": {
    "selection_notes": {
      "archetype_reasons": [
        "mother was earned because the dream centers on a large woman who feeds, covers, and holds the dreamer in a way that stabilizes the field."
      ],
      "mythic_reason": "[]",
      "near_misses": [
        "No mythic pattern was selected: the dream is intimate and contained, without the larger sequence required for a mythic match.",
        "No Guide/Psychopomp: there is no crossing between domains, only shelter within the kitchen."
      ]
    }
  }
}
```

### m22_calm_father_en_semantic_r1
```json
{
  "fixture_id": "m22_calm_father_en",
  "run_id": "m22_calm_father_en_semantic_r1_a1_t2",
  "attempt_count": 1,
  "model": "gpt-5.4-mini-2026-03-17",
  "latency_ms": 4894,
  "cost_usd": 0.00437445,
  "raw_archetypes": [
    {
      "archetype_id": "father",
      "expression": "father at the garden gate giving quiet instruction",
      "resonance": "A paternal presence organizes the threshold, giving simple direction that steadies the whole scene and makes protection feel reliable.",
      "confidence": "high",
      "mechanism_tags": [
        "active_threshold_guidance",
        "guidance_changes_action_or_outcome"
      ],
      "evidence_ids": [
        "D1"
      ]
    }
  ],
  "post_validation_archetypes": [
    {
      "canonical_label": "Father",
      "expression": "father at the garden gate giving quiet instruction",
      "resonance": "A paternal presence organizes the threshold, giving simple direction that steadies the whole scene and makes protection feel reliable.",
      "evidence": [
        "At dusk my father stands at the garden gate and quietly tells me which tools must come inside before the rain. He does not raise his voice. As I follow his calm instruction, the whole yard feels ordered and protected, and even the wind seems to fall into place around that steady authority."
      ],
      "confidence": "high",
      "archetype_id": "father",
      "archetype_catalog_version": "1.7.1",
      "evidence_ids": [
        "D1"
      ]
    }
  ],
  "mechanism_tags_by_archetype": {
    "father": [
      "active_threshold_guidance",
      "guidance_changes_action_or_outcome"
    ]
  },
  "validator_decisions": [
    {
      "archetype_id": "father",
      "canonical_label": "Father",
      "accepted": true,
      "rejection_codes": [],
      "rejection_reason": null,
      "mechanism_tags": [
        "active_threshold_guidance",
        "guidance_changes_action_or_outcome"
      ],
      "evidence_ids": [
        "D1"
      ]
    }
  ],
  "archetype_reject_reasons": [],
  "central_conflicts": [],
  "main_tension": null,
  "core_mode": "Core Restoration",
  "raw_amplifications": [],
  "post_validation_amplifications": [],
  "mythic_reject_reasons": [],
  "explicit_negation_behavior": "n/a",
  "interpretive_diagnostics": {
    "selection_notes": {
      "archetype_reasons": [
        "Father is earned because the father figure actively gives calm, orienting instruction that governs the threshold and changes what is done before the rain."
      ],
      "mythic_reason": "[]",
      "near_misses": [
        "No mythic catalog entry is clearly enacted; the dream is brief, cohesive, and restorative rather than a recognizable mythic sequence."
      ]
    }
  }
}
```

### m22_calm_father_en_semantic_r2
```json
{
  "fixture_id": "m22_calm_father_en",
  "run_id": "m22_calm_father_en_semantic_r2_a1_t3",
  "attempt_count": 1,
  "model": "gpt-5.4-mini-2026-03-17",
  "latency_ms": 4814,
  "cost_usd": 0.0044487,
  "raw_archetypes": [
    {
      "archetype_id": "father",
      "expression": "father at the garden gate giving quiet instruction",
      "resonance": "The father’s calm instruction at the gate organizes the scene, giving form, timing, and protection without pressure or alarm.",
      "confidence": "high",
      "mechanism_tags": [
        "active_threshold_guidance",
        "guidance_changes_action_or_outcome",
        "bond_organizes_dream"
      ],
      "evidence_ids": [
        "D1"
      ]
    }
  ],
  "post_validation_archetypes": [
    {
      "canonical_label": "Father",
      "expression": "father at the garden gate giving quiet instruction",
      "resonance": "The father’s calm instruction at the gate organizes the scene, giving form, timing, and protection without pressure or alarm.",
      "evidence": [
        "At dusk my father stands at the garden gate and quietly tells me which tools must come inside before the rain. He does not raise his voice. As I follow his calm instruction, the whole yard feels ordered and protected, and even the wind seems to fall into place around that steady authority."
      ],
      "confidence": "high",
      "archetype_id": "father",
      "archetype_catalog_version": "1.7.1",
      "evidence_ids": [
        "D1"
      ]
    }
  ],
  "mechanism_tags_by_archetype": {
    "father": [
      "active_threshold_guidance",
      "guidance_changes_action_or_outcome",
      "bond_organizes_dream"
    ]
  },
  "validator_decisions": [
    {
      "archetype_id": "father",
      "canonical_label": "Father",
      "accepted": true,
      "rejection_codes": [],
      "rejection_reason": null,
      "mechanism_tags": [
        "active_threshold_guidance",
        "guidance_changes_action_or_outcome",
        "bond_organizes_dream"
      ],
      "evidence_ids": [
        "D1"
      ]
    }
  ],
  "archetype_reject_reasons": [],
  "central_conflicts": [],
  "main_tension": null,
  "core_mode": "Core Restoration",
  "raw_amplifications": [],
  "post_validation_amplifications": [],
  "mythic_reject_reasons": [],
  "explicit_negation_behavior": "n/a",
  "interpretive_diagnostics": {
    "selection_notes": {
      "archetype_reasons": [
        "father was selected because paternal authority and threshold guidance are explicitly staged: he stands at the gate, gives instruction, and his presence organizes protection and order."
      ],
      "mythic_reason": "[]",
      "near_misses": [
        "No mythic echo was selected; the dream is too small, orderly, and non-episodic for a closed-catalog myth pattern.",
        "No other archetype was selected because the dream does not stage conflict, disguise, loss, descent, or a second figure with independent agency."
      ]
    }
  }
}
```

### P_divine_child_a_semantic_r1
```json
{
  "fixture_id": "P_divine_child_a",
  "run_id": "P_divine_child_a_semantic_r1_a1_t4",
  "attempt_count": 1,
  "model": "gpt-5.4-mini-2026-03-17",
  "latency_ms": 5820,
  "cost_usd": 0.0047727,
  "raw_archetypes": [
    {
      "archetype_id": "divine_child",
      "expression": "luminoso infant in my arms",
      "resonance": "A fragile but radiating child holds the centre of the scene, quietly directing the ascent and changing what the dark room can contain.",
      "confidence": "high",
      "mechanism_tags": [
        "boon_or_changed_outcome",
        "revival_or_return",
        "crossing_between_domains"
      ],
      "evidence_ids": [
        "D1"
      ]
    }
  ],
  "post_validation_archetypes": [
    {
      "canonical_label": "Divine Child",
      "expression": "luminoso infant in my arms",
      "resonance": "A fragile but radiating child holds the centre of the scene, quietly directing the ascent and changing what the dark room can contain.",
      "evidence": [
        "During a city blackout an infant in my arms remains calmly luminous while adults panic in the streets below. When officials demand I hand the child over for safekeeping, I refuse and climb the stairwell. Sirens fade as we reach rooms above the roofline filled with daylight that had been unavailable all evening."
      ],
      "confidence": "high",
      "archetype_id": "divine_child",
      "archetype_catalog_version": "1.7.1",
      "evidence_ids": [
        "D1"
      ]
    }
  ],
  "mechanism_tags_by_archetype": {
    "divine_child": [
      "boon_or_changed_outcome",
      "revival_or_return",
      "crossing_between_domains"
    ]
  },
  "validator_decisions": [
    {
      "archetype_id": "divine_child",
      "canonical_label": "Divine Child",
      "accepted": true,
      "rejection_codes": [],
      "rejection_reason": null,
      "mechanism_tags": [
        "boon_or_changed_outcome",
        "revival_or_return",
        "crossing_between_domains"
      ],
      "evidence_ids": [
        "D1"
      ]
    }
  ],
  "archetype_reject_reasons": [],
  "central_conflicts": [
    "handing over the child vs keeping the child close"
  ],
  "main_tension": "handing over the child vs keeping the child close",
  "core_mode": "Core Shift",
  "raw_amplifications": [],
  "post_validation_amplifications": [],
  "mythic_reject_reasons": [],
  "explicit_negation_behavior": "n/a",
  "interpretive_diagnostics": {
    "selection_notes": {
      "archetype_reasons": [
        "divine_child was earned because the infant is luminous, central, and structurally changes the scene by drawing protection and ascent around it."
      ],
      "mythic_reason": "[]",
      "near_misses": [
        "Mother was not selected because the dream emphasizes holding and protection without a clearly maternal containing matrix.",
        "Guide / Psychopomp was not selected because no active escort between realms is staged beyond the upward climb.",
        "No mythic catalog entry was earned because the dream is a brief protective ascent without the distinctive multi-step sequence required by any supplied myth."
      ]
    }
  }
}
```

### P_divine_child_a_semantic_r2
```json
{
  "fixture_id": "P_divine_child_a",
  "run_id": "P_divine_child_a_semantic_r2_a1_t2",
  "attempt_count": 1,
  "model": "gpt-5.4-mini-2026-03-17",
  "latency_ms": 5347,
  "cost_usd": 0.0049797,
  "raw_archetypes": [
    {
      "archetype_id": "divine_child",
      "expression": "calmly luminous infant in my arms",
      "resonance": "A vulnerable but radiantly present child organizes the scene, drawing protection, refusal, and ascent around its quiet vitality.",
      "confidence": "high",
      "mechanism_tags": [
        "bond_organizes_dream",
        "boon_or_changed_outcome"
      ],
      "evidence_ids": [
        "D1"
      ]
    },
    {
      "archetype_id": "mother",
      "expression": "carrying and refusing to hand over the infant",
      "resonance": "The holding function is active as a protecting presence keeps the child with me and carries that bond upward out of danger.",
      "confidence": "medium",
      "mechanism_tags": [
        "possessive_anti_separation",
        "bond_organizes_dream",
        "active_threshold_guidance"
      ],
      "evidence_ids": [
        "D1"
      ]
    }
  ],
  "post_validation_archetypes": [
    {
      "canonical_label": "Divine Child",
      "expression": "calmly luminous infant in my arms",
      "resonance": "A vulnerable but radiantly present child organizes the scene, drawing protection, refusal, and ascent around its quiet vitality.",
      "evidence": [
        "During a city blackout an infant in my arms remains calmly luminous while adults panic in the streets below. When officials demand I hand the child over for safekeeping, I refuse and climb the stairwell. Sirens fade as we reach rooms above the roofline filled with daylight that had been unavailable all evening."
      ],
      "confidence": "high",
      "archetype_id": "divine_child",
      "archetype_catalog_version": "1.7.1",
      "evidence_ids": [
        "D1"
      ]
    },
    {
      "canonical_label": "Mother",
      "expression": "carrying and refusing to hand over the infant",
      "resonance": "The holding function is active as a protecting presence keeps the child with me and carries that bond upward out of danger.",
      "evidence": [
        "During a city blackout an infant in my arms remains calmly luminous while adults panic in the streets below. When officials demand I hand the child over for safekeeping, I refuse and climb the stairwell. Sirens fade as we reach rooms above the roofline filled with daylight that had been unavailable all evening."
      ],
      "confidence": "medium",
      "archetype_id": "mother",
      "archetype_catalog_version": "1.7.1",
      "evidence_ids": [
        "D1"
      ]
    }
  ],
  "mechanism_tags_by_archetype": {
    "divine_child": [
      "bond_organizes_dream",
      "boon_or_changed_outcome"
    ],
    "mother": [
      "possessive_anti_separation",
      "bond_organizes_dream",
      "active_threshold_guidance"
    ]
  },
  "validator_decisions": [
    {
      "archetype_id": "divine_child",
      "canonical_label": "Divine Child",
      "accepted": true,
      "rejection_codes": [],
      "rejection_reason": null,
      "mechanism_tags": [
        "bond_organizes_dream",
        "boon_or_changed_outcome"
      ],
      "evidence_ids": [
        "D1"
      ]
    },
    {
      "archetype_id": "mother",
      "canonical_label": "Mother",
      "accepted": true,
      "rejection_codes": [],
      "rejection_reason": null,
      "mechanism_tags": [
        "possessive_anti_separation",
        "bond_organizes_dream",
        "active_threshold_guidance"
      ],
      "evidence_ids": [
        "D1"
      ]
    }
  ],
  "archetype_reject_reasons": [],
  "central_conflicts": [
    "custody vs protection"
  ],
  "main_tension": "custody vs protection",
  "core_mode": "Core Shift",
  "raw_amplifications": [],
  "post_validation_amplifications": [],
  "mythic_reject_reasons": [],
  "explicit_negation_behavior": "n/a",
  "interpretive_diagnostics": {
    "selection_notes": {
      "archetype_reasons": [
        "divine_child: The infant is explicitly calm and luminous, and its presence organizes the dream’s action and protection.",
        "mother: The dream centers on carrying, refusing surrender, and protecting the child through an upward passage."
      ],
      "mythic_reason": "[]",
      "near_misses": [
        "guide_psychopomp was not selected because there is no distinct escort figure; the ascent is done by the dreamer.",
        "orphan was not selected because abandonment is not the central structure; protection is."
      ]
    }
  }
}
```

## Archetype density / spillover

```json
{
  "successful_semantic_runs": 39,
  "negative_runs_with_any_archetype": 0
}
```

## Acceptance

```json
{
  "sea_mattress": {
    "successful_runs": 5,
    "lover_hits": 0,
    "other_archetype_runs": 0,
    "empty_conflicts": 5,
    "null_main_tension": 5,
    "no_myths": 5
  },
  "lover_controls": {
    "harmonious_hits": 2,
    "longing_hits": 2,
    "warm_friends_lover": 0,
    "incidental_partner_lover": 0,
    "romance_cue_lover": 0
  },
  "inner_tensions": {
    "ordinary_kitchen_empty": 3,
    "ordinary_kitchen_null": 3,
    "surface_depth_empty": 3,
    "surface_depth_null": 3,
    "spatial_supported": 3,
    "persona_supported": 3
  },
  "calm_field": {
    "mother_hits": 2,
    "father_hits": 2,
    "divine_child_hits": 2
  },
  "archetype_density": {
    "successful_semantic_runs": 39,
    "negative_runs_with_any_archetype": 0
  }
}
```

## Decision

```text
do not add more prompt prose; recommend mechanism-contract revision: intimate_mutual_attunement
```

Artifacts directory: /Users/yiannisyiallouris/Documents/perso/oneiros-app/tmp/m22-narrow-regression-2026-07-28T14-01-47-946Z