# Oneiros M2.1 broad live regression review

Date: `2026-07-28`

## Runtime line

```text
prompt_id: dream-field-map-interpretive-v4.1.10-M2.1
prompt_version: 4.1.10-M2.1
schema_version: 13
archetype_catalog_version: 1.7.0
myth_catalog_version: 1.2.0
model_request: gpt-5.4-mini
disable_anthropic_fallback: true
debugInterpretiveEchoes: true
concurrency: 5
```

## Token delta versus M2

```json
{
  "current_system_prompt_tokens_approx": 7315,
  "head_system_prompt_tokens_approx": 2361,
  "delta_tokens_approx": 4954,
  "method": "approximate whitespace-token comparison between current built prompt and HEAD template literal"
}
```

## Acceptance summary

```json
{
  "sea_mattress": {
    "lover_hits": 0,
    "unrelated_archetype_runs": 0,
    "empty_conflicts": 5,
    "null_main_tension": 5,
    "no_myth_runs": 5,
    "accepted": false
  },
  "lover_behavior": {
    "harmonious_hits": 3,
    "longing_hits": 3,
    "incidental_partner_lover": 0,
    "non_romantic_lover": 1,
    "romance_cue_only_lover": 0,
    "spillover_labels": []
  },
  "calm_field": {
    "mother_hits": 3,
    "father_hits": 3,
    "divine_child_hits": 2
  },
  "inner_tensions": {
    "complementarity_empty": 3,
    "complementarity_null_tension": 3,
    "kitchen_empty": 1,
    "kitchen_null_tension": 1,
    "spatial_supported": 3,
    "persona_supported": 3
  },
  "archetype_density": {
    "total_runs": 41,
    "negative_runs_with_any_archetype": 1
  },
  "branch": "D",
  "recommendation": "revise global calibration"
}
```

## Fixtures and gold expectations

### Exact Greek sea-mattress

```json
{
  "id": "sea_mattress_el",
  "category": "sea_mattress",
  "reps": 5,
  "dream_language": "el",
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
  "notes": "Exact regression fixture from reviewer packet.",
  "dream": "Είδα ένα όνειρο. Ήμουν ξαπλωμένη σε ένα θαλάσσιο στρώμα, σε μια πολύ γαλήνια θάλασσα και πάνω μου ήταν ξαπλωμένος ο φίλος μου και κοιτούσαμε το βυθό και εξερευνούσαμε όλο το βυθό. Ήταν πολύ ήρεμα, γαλήνια, όμορφα, πάντα πολύ ήρεμα."
}
```

### Harmonious Lover positive

```json
{
  "id": "F_pos_lover_shared_depth_en",
  "category": "lover_positive_harmonious",
  "reps": 3,
  "dream_language": "en",
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
  "notes": "Harmonious Lover positive with shared attention and no dramatic outcome.",
  "dream": "My partner and I lie wrapped in the same blanket on a quiet pier, watching lantern fish move beneath the water. Neither of us speaks. The closeness makes the dark depth feel welcoming rather than risky, and we keep looking together for a long time."
}
```

### Longing/separation Lover positive

```json
{
  "id": "F_pos_lover_bench_rain_en",
  "category": "lover_positive_longing",
  "reps": 3,
  "dream_language": "en",
  "required_archetype_ids": [
    "lover"
  ],
  "forbidden_archetype_ids": [
    "persona",
    "anima",
    "animus",
    "sacred_marriage"
  ],
  "expected_central_conflicts": [],
  "expected_main_tension": null,
  "notes": "Quiet devoted proximity organizes the field.",
  "dream": "Someone I lost finds me at a bus stop in light rain. We stand close without speaking. The bus arrives but neither of us boards."
}
```

### Incidental-partner negative

```json
{
  "id": "F_neg_partner_logistics_en",
  "category": "lover_negative_incidental_partner",
  "reps": 3,
  "dream_language": "en",
  "required_archetype_ids": [],
  "forbidden_archetype_ids": [
    "lover"
  ],
  "expected_central_conflicts": [],
  "expected_main_tension": null,
  "notes": "Incidental partner presence without a bond-organized scene.",
  "dream": "My partner drops grocery bags by the kitchen island, asks whether I paid the electricity bill, and leaves again to park the car. I stack the cans by expiry date and text him the door code. The apartment stays ordinary before and after he passes through."
}
```

### Close non-romantic companionship negative

```json
{
  "id": "F_neg_warm_friends_en",
  "category": "lover_negative_non_romantic",
  "reps": 3,
  "dream_language": "en",
  "required_archetype_ids": [],
  "forbidden_archetype_ids": [
    "lover"
  ],
  "expected_central_conflicts": [],
  "expected_main_tension": null,
  "notes": "Warm companionship should not become Lover.",
  "dream": "A close friend and I paddle a canoe across a still lake, joking softly while we look for the right campsite. We work well together and unload the bags without friction. It feels companionable and easy, but nothing in the scene turns toward romance, devotion, or beloved risk."
}
```

### Romance-cue-only negative

```json
{
  "id": "F_neg_romance_cue_only_en",
  "category": "lover_negative_romance_cue_only",
  "reps": 3,
  "dream_language": "en",
  "required_archetype_ids": [],
  "forbidden_archetype_ids": [
    "lover"
  ],
  "expected_central_conflicts": null,
  "expected_main_tension": null,
  "notes": "Romance cue and wedding scenery alone should stay empty.",
  "dream": "I walk through a wedding reception in a silver dress while strangers smile and toss rose petals. A handsome person kisses my cheek for a photo and disappears into the crowd. I spend the rest of the dream searching for the table number on my card."
}
```

### Calm Mother positive

```json
{
  "id": "F_pos_mother_kitchen_en",
  "category": "mother_positive",
  "reps": 3,
  "dream_language": "en",
  "required_archetype_ids": [
    "mother"
  ],
  "forbidden_archetype_ids": [],
  "expected_central_conflicts": null,
  "expected_main_tension": null,
  "notes": "Nurturing containment that organizes safety.",
  "dream": "An enormous woman fills a stone kitchen. She feeds me broth that warms my chest and wraps me in a shawl that smells like rain soil. Outside a storm tears roofs away, but her table stays steady. When I try to stand without her arm I feel cold immediately; when I lean back into her the storm softens."
}
```

### Calm Father positive

```json
{
  "id": "m21_calm_father_en",
  "category": "father_positive",
  "reps": 3,
  "dream_language": "en",
  "required_archetype_ids": [
    "father"
  ],
  "forbidden_archetype_ids": [],
  "expected_central_conflicts": null,
  "expected_main_tension": null,
  "notes": "Protective paternal order without aggression or dramatic conflict.",
  "dream": "At dusk my father stands at the garden gate and quietly tells me which tools must come inside before the rain. He does not raise his voice. As I follow his calm instruction, the whole yard feels ordered and protected, and even the wind seems to fall into place around that steady authority."
}
```

### Quiet Divine Child positive

```json
{
  "id": "P_divine_child_a",
  "category": "divine_child_positive",
  "reps": 3,
  "dream_language": "en",
  "required_archetype_ids": [
    "divine_child"
  ],
  "forbidden_archetype_ids": [],
  "expected_central_conflicts": null,
  "expected_main_tension": null,
  "notes": "Existing benchmark Divine Child fixture with calm luminous center.",
  "dream": "During a city blackout an infant in my arms remains calmly luminous while adults panic in the streets below. When officials demand I hand the child over for safekeeping, I refuse and climb the stairwell. Sirens fade as we reach rooms above the roofline filled with daylight that had been unavailable all evening."
}
```

### No-tension complementarity

```json
{
  "id": "F_neg_surface_depth_harmony_el",
  "category": "no_tension_complementarity",
  "reps": 3,
  "dream_language": "el",
  "required_archetype_ids": [],
  "forbidden_archetype_ids": [],
  "expected_central_conflicts": [],
  "expected_main_tension": null,
  "notes": "Complementary spatial layering should not become inner conflict.",
  "dream": "Ήμουν σε μια ξύλινη αποβάθρα πάνω από καθαρό νερό και κοίταζα ήρεμα τα φυτά στον βυθό. Από πάνω περνούσε ένα απαλό αεράκι και από κάτω κινούνταν αργά τα ψάρια. Δεν υπήρχε φόβος ούτε δίλημμα· η επιφάνεια και το βάθος έμοιαζαν να ανήκουν στην ίδια γαλήνη."
}
```

### Genuine spatial-conflict positive

```json
{
  "id": "F_neg_spatial_conflict_control_el",
  "category": "genuine_spatial_conflict",
  "reps": 3,
  "dream_language": "el",
  "required_archetype_ids": [],
  "forbidden_archetype_ids": [],
  "expected_central_conflicts": [
    "μπαλκόνι vs υπόγειο"
  ],
  "expected_main_tension": "μπαλκόνι vs υπόγειο",
  "notes": "Control fixture for genuine spatial opposition.",
  "dream": "Στεκόμουν σε ένα στενό μπαλκόνι του τρίτου ορόφου και άκουγα το υπόγειο να με τραβά σαν μαγνήτης. Κάθε φορά που πήγαινα να μπω μέσα για να κατέβω, το πάτωμα έσπαγε κάτω από τα πόδια μου και με ανάγκαζε να μείνω έξω. Ήθελα να κατέβω, αλλά το κτίριο δεν με άφηνε."
}
```

### Persona staged-conflict positive

```json
{
  "id": "F_pos_persona_stage_suit_el",
  "category": "persona_conflict",
  "reps": 3,
  "dream_language": "el",
  "required_archetype_ids": [
    "persona"
  ],
  "forbidden_archetype_ids": [],
  "expected_central_conflicts": null,
  "expected_main_tension": null,
  "notes": "Public mask / role adhesion vs private voice.",
  "dream": "Ήμουν σε ένα μεγάλο θέατρο όπου όλοι περίμεναν να παρουσιάσω τα οικονομικά μιας εταιρείας. Πριν βγω στη σκηνή, μου φόρεσαν μια τέλεια σκούρα στολή με το όνομά μου κεντημένο στο στήθος. Μόλις στάθηκα μπροστά στο κοινό, η φωνή μου έγινε ψυχρή και επίσημη, παρότι μέσα μου ήθελα να πω ότι δεν γνώριζα τις απαντήσεις. Κάθε φορά που προσπαθούσα να μιλήσω με τη δική μου φωνή, ο γιακάς έσφιγγε και το κοινό σταματούσε να με βλέπει. Όταν επέστρεψα στα παρασκήνια, προσπάθησα να βγάλω τη στολή, αλλά τα μανίκια είχαν κολλήσει πάνω μου."
}
```

### Ordinary-kitchen no-conflict

```json
{
  "id": "F_neg_kitchen_glass_el",
  "category": "ordinary_kitchen",
  "reps": 3,
  "dream_language": "el",
  "required_archetype_ids": [],
  "forbidden_archetype_ids": [],
  "expected_central_conflicts": [],
  "expected_main_tension": null,
  "notes": "Ordinary chore dream.",
  "dream": "Ήμουν στην κουζίνα μου και ήθελα να πιω νερό. Άνοιξα το ντουλάπι, αλλά όλα τα ποτήρια ήταν άπλυτα. Πήρα το λιγότερο βρώμικο, το έπλυνα με σαπούνι, το ξέβγαλα δύο φορές και το γέμισα από τη βρύση. Η γάτα πέρασε από τον πάγκο και έριξε ένα κουταλάκι στο πάτωμα. Το σήκωσα, ήπια το νερό και ξύπνησα ελαφρώς εκνευρισμένος επειδή θυμήθηκα ότι είχα αφήσει πιάτα στον νεροχύτη."
}
```

## Per-run results

### Exact Greek sea-mattress — runs

#### sea_mattress_el_r1

```json
{
  "fixture_id": "sea_mattress_el",
  "category": "sea_mattress",
  "raw_dream": "Είδα ένα όνειρο. Ήμουν ξαπλωμένη σε ένα θαλάσσιο στρώμα, σε μια πολύ γαλήνια θάλασσα και πάνω μου ήταν ξαπλωμένος ο φίλος μου και κοιτούσαμε το βυθό και εξερευνούσαμε όλο το βυθό. Ήταν πολύ ήρεμα, γαλήνια, όμορφα, πάντα πολύ ήρεμα.",
  "ok": true,
  "latency_ms": 29138,
  "model": "gpt-5.4-mini-2026-03-17",
  "prompt_id": "dream-field-map-interpretive-v4.1.10-M2.1",
  "prompt_version": "4.1.10-M2.1",
  "schema_version": 13,
  "archetype_catalog_version": "1.7.0",
  "myth_catalog_version": "1.2.0",
  "target_language": {
    "code": "el",
    "name": "Greek"
  },
  "cost_usd": 0.0045762,
  "raw_archetypes": [],
  "validator_decisions": [],
  "post_validation_archetypes": [],
  "archetype_reject_reasons": [],
  "central_conflicts": [],
  "main_tension": null,
  "core_mode": "Core State",
  "raw_amplifications": [],
  "post_validation_amplifications": [],
  "mythic_reject_reasons": [],
  "interpretive_diagnostics": {
    "selection_notes": {
      "archetype_reasons": [
        "[]"
      ],
      "mythic_reason": "[]",
      "near_misses": [
        "Δεν επιλέχθηκε μυθικός κύκλος επειδή δεν υπάρχει δοκιμασία, απώλεια, κάθοδος ή μεταβολή· η σκηνή είναι σταθερή και συνεκτική.",
        "Δεν επιλέχθηκε αρχετυπικός ρόλος επειδή η σχέση και το περιβάλλον δεν οργανώνονται από ένταση, όριο ή μετασχηματισμό."
      ]
    }
  }
}
```

#### sea_mattress_el_r2

```json
{
  "fixture_id": "sea_mattress_el",
  "category": "sea_mattress",
  "raw_dream": "Είδα ένα όνειρο. Ήμουν ξαπλωμένη σε ένα θαλάσσιο στρώμα, σε μια πολύ γαλήνια θάλασσα και πάνω μου ήταν ξαπλωμένος ο φίλος μου και κοιτούσαμε το βυθό και εξερευνούσαμε όλο το βυθό. Ήταν πολύ ήρεμα, γαλήνια, όμορφα, πάντα πολύ ήρεμα.",
  "ok": true,
  "latency_ms": 7252,
  "model": "gpt-5.4-mini-2026-03-17",
  "prompt_id": "dream-field-map-interpretive-v4.1.10-M2.1",
  "prompt_version": "4.1.10-M2.1",
  "schema_version": 13,
  "archetype_catalog_version": "1.7.0",
  "myth_catalog_version": "1.2.0",
  "target_language": {
    "code": "el",
    "name": "Greek"
  },
  "cost_usd": 0.0048417,
  "raw_archetypes": [],
  "validator_decisions": [],
  "post_validation_archetypes": [],
  "archetype_reject_reasons": [],
  "central_conflicts": [],
  "main_tension": null,
  "core_mode": "Core State",
  "raw_amplifications": [],
  "post_validation_amplifications": [],
  "mythic_reject_reasons": [],
  "interpretive_diagnostics": {
    "selection_notes": {
      "archetype_reasons": [
        "[] — δεν αναδύεται συγκεκριμένη αρχέτυπη λειτουργία πέρα από μια ήπια κοινή σκηνή"
      ],
      "mythic_reason": "[] — λείπει η δραματική ακολουθία ή η καθορισμένη δοκιμασία που θα στήριζε μυθική αντιστοιχία",
      "near_misses": [
        "Όχι Οδηγός/Ψυχοπομπός: δεν υπάρχει καθοδήγηση σε πραγματικό κατώφλι",
        "Όχι Έρως/Λάβερ: η οικειότητα υπάρχει, αλλά χωρίς έντονη επιθυμία ή δομικό στοίχημα ένωσης"
      ]
    }
  }
}
```

#### sea_mattress_el_r3

```json
{
  "fixture_id": "sea_mattress_el",
  "category": "sea_mattress",
  "raw_dream": "Είδα ένα όνειρο. Ήμουν ξαπλωμένη σε ένα θαλάσσιο στρώμα, σε μια πολύ γαλήνια θάλασσα και πάνω μου ήταν ξαπλωμένος ο φίλος μου και κοιτούσαμε το βυθό και εξερευνούσαμε όλο το βυθό. Ήταν πολύ ήρεμα, γαλήνια, όμορφα, πάντα πολύ ήρεμα.",
  "ok": true,
  "latency_ms": 6338,
  "model": "gpt-5.4-mini-2026-03-17",
  "prompt_id": "dream-field-map-interpretive-v4.1.10-M2.1",
  "prompt_version": "4.1.10-M2.1",
  "schema_version": 13,
  "archetype_catalog_version": "1.7.0",
  "myth_catalog_version": "1.2.0",
  "target_language": {
    "code": "el",
    "name": "Greek"
  },
  "cost_usd": 0.00875625,
  "raw_archetypes": [],
  "validator_decisions": [],
  "post_validation_archetypes": [],
  "archetype_reject_reasons": [],
  "central_conflicts": [],
  "main_tension": null,
  "core_mode": "Core State",
  "raw_amplifications": [],
  "post_validation_amplifications": [],
  "mythic_reject_reasons": [],
  "interpretive_diagnostics": {
    "selection_notes": {
      "archetype_reasons": [
        "[]"
      ],
      "mythic_reason": "[]",
      "near_misses": [
        "Καμία σαφής αρχετυπική λειτουργία ή μυθική ακολουθία δεν οργανώνει τη σκηνή πέρα από τη γαλήνια συν-παρουσία και την κοινή θέαση του βυθού."
      ]
    }
  }
}
```

#### sea_mattress_el_r4

```json
{
  "fixture_id": "sea_mattress_el",
  "category": "sea_mattress",
  "raw_dream": "Είδα ένα όνειρο. Ήμουν ξαπλωμένη σε ένα θαλάσσιο στρώμα, σε μια πολύ γαλήνια θάλασσα και πάνω μου ήταν ξαπλωμένος ο φίλος μου και κοιτούσαμε το βυθό και εξερευνούσαμε όλο το βυθό. Ήταν πολύ ήρεμα, γαλήνια, όμορφα, πάντα πολύ ήρεμα.",
  "ok": true,
  "latency_ms": 7262,
  "model": "gpt-5.4-mini-2026-03-17",
  "prompt_id": "dream-field-map-interpretive-v4.1.10-M2.1",
  "prompt_version": "4.1.10-M2.1",
  "schema_version": 13,
  "archetype_catalog_version": "1.7.0",
  "myth_catalog_version": "1.2.0",
  "target_language": {
    "code": "el",
    "name": "Greek"
  },
  "cost_usd": 0.00480045,
  "raw_archetypes": [],
  "validator_decisions": [],
  "post_validation_archetypes": [],
  "archetype_reject_reasons": [],
  "central_conflicts": [],
  "main_tension": null,
  "core_mode": "Core State",
  "raw_amplifications": [],
  "post_validation_amplifications": [],
  "mythic_reject_reasons": [],
  "interpretive_diagnostics": {
    "selection_notes": {
      "archetype_reasons": [
        "[] — η σκηνή είναι κυρίως μια ήρεμη, κοινή κατάσταση χωρίς επαρκή ενεργοποίηση καταλόγου αρχετύπων."
      ],
      "mythic_reason": "[] — δεν υπάρχει σαφής διαδοχή δοκιμασιών, απώλειας, καθόδου ή μετασχηματισμού που να ταιριάζει σε συγκεκριμένο μυθικό σχήμα.",
      "near_misses": [
        "Δεν επιλέχθηκε Lover επειδή η εγγύτητα υπάρχει, αλλά δεν οργανώνει εδώ ερωτική ή δεσμευτική δυναμική ως κεντρικό stake.",
        "Δεν επιλέχθηκε Guide / Psychopomp επειδή η εξερεύνηση του βυθού δεν συνοδεύεται από καθοδήγηση μεταξύ διαφορετικών πεδίων ή πραγματικό κατώφλι."
      ]
    }
  }
}
```

#### sea_mattress_el_r5

```json
{
  "fixture_id": "sea_mattress_el",
  "category": "sea_mattress",
  "raw_dream": "Είδα ένα όνειρο. Ήμουν ξαπλωμένη σε ένα θαλάσσιο στρώμα, σε μια πολύ γαλήνια θάλασσα και πάνω μου ήταν ξαπλωμένος ο φίλος μου και κοιτούσαμε το βυθό και εξερευνούσαμε όλο το βυθό. Ήταν πολύ ήρεμα, γαλήνια, όμορφα, πάντα πολύ ήρεμα.",
  "ok": true,
  "latency_ms": 7251,
  "model": "gpt-5.4-mini-2026-03-17",
  "prompt_id": "dream-field-map-interpretive-v4.1.10-M2.1",
  "prompt_version": "4.1.10-M2.1",
  "schema_version": 13,
  "archetype_catalog_version": "1.7.0",
  "myth_catalog_version": "1.2.0",
  "target_language": {
    "code": "el",
    "name": "Greek"
  },
  "cost_usd": 0.01712625,
  "raw_archetypes": [],
  "validator_decisions": [],
  "post_validation_archetypes": [],
  "archetype_reject_reasons": [],
  "central_conflicts": [],
  "main_tension": null,
  "core_mode": "Core State",
  "raw_amplifications": [],
  "post_validation_amplifications": [],
  "mythic_reject_reasons": [],
  "interpretive_diagnostics": {
    "selection_notes": {
      "archetype_reasons": [
        "Δεν επιλέχθηκε αρχέτυπο, γιατί η σκηνή είναι κυρίως μια ήρεμη κοινή παραμονή και εξερεύνηση χωρίς σαφή λειτουργία-πυρήνα πέρα από τη σχέση και το τοπίο."
      ],
      "mythic_reason": "Δεν επιλέχθηκε μυθικό ανάλογο, γιατί δεν υπάρχει σαφής αλυσιδωτή δομή δοκιμασίας, απώλειας, καθόδου ή μετασχηματισμού.",
      "near_misses": [
        "Lover: υπάρχει τρυφερή εγγύτητα, αλλά όχι ερωτικό κέντρο που να οργανώνει το όνειρο.",
        "Guide / Psychopomp: υπάρχει βλέμμα προς τα κάτω και εξερεύνηση, αλλά όχι ενεργή καθοδήγηση σε πραγματικό κατώφλι."
      ]
    }
  }
}
```

### Harmonious Lover positive — runs

#### F_pos_lover_shared_depth_en_r1

```json
{
  "fixture_id": "F_pos_lover_shared_depth_en",
  "category": "lover_positive_harmonious",
  "raw_dream": "My partner and I lie wrapped in the same blanket on a quiet pier, watching lantern fish move beneath the water. Neither of us speaks. The closeness makes the dark depth feel welcoming rather than risky, and we keep looking together for a long time.",
  "ok": true,
  "latency_ms": 5077,
  "model": "gpt-5.4-mini-2026-03-17",
  "prompt_id": "dream-field-map-interpretive-v4.1.10-M2.1",
  "prompt_version": "4.1.10-M2.1",
  "schema_version": 13,
  "archetype_catalog_version": "1.7.0",
  "myth_catalog_version": "1.2.0",
  "target_language": {
    "code": "en",
    "name": "English"
  },
  "cost_usd": 0.00476715,
  "raw_archetypes": [
    {
      "archetype_id": "lover",
      "expression": "My partner and I wrapped in the same blanket, looking together into the water",
      "resonance": "The shared blanket and long mutual watching make the bond itself the center of the scene, and the depth becomes habitable through closeness.",
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
  "post_validation_archetypes": [
    {
      "canonical_label": "Lover",
      "expression": "My partner and I wrapped in the same blanket, looking together into the water",
      "resonance": "The shared blanket and long mutual watching make the bond itself the center of the scene, and the depth becomes habitable through closeness.",
      "evidence": [
        "My partner and I lie wrapped in the same blanket on a quiet pier, watching lantern fish move beneath the water. Neither of us speaks. The closeness makes the dark depth feel welcoming rather than risky, and we keep looking together for a long time."
      ],
      "confidence": "high",
      "archetype_id": "lover",
      "archetype_catalog_version": "1.7.0",
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
  "interpretive_diagnostics": {
    "selection_notes": {
      "archetype_reasons": [
        "lover was earned because the partner bond, shared blanket, and sustained mutual looking organize the whole dream-space."
      ],
      "mythic_reason": "[]",
      "near_misses": [
        "No mythic catalog entry was strong enough; the dream is cohesive and relational rather than a full descent, retrieval, or quest sequence."
      ]
    }
  }
}
```

#### F_pos_lover_shared_depth_en_r2

```json
{
  "fixture_id": "F_pos_lover_shared_depth_en",
  "category": "lover_positive_harmonious",
  "raw_dream": "My partner and I lie wrapped in the same blanket on a quiet pier, watching lantern fish move beneath the water. Neither of us speaks. The closeness makes the dark depth feel welcoming rather than risky, and we keep looking together for a long time.",
  "ok": true,
  "latency_ms": 4905,
  "model": "gpt-5.4-mini-2026-03-17",
  "prompt_id": "dream-field-map-interpretive-v4.1.10-M2.1",
  "prompt_version": "4.1.10-M2.1",
  "schema_version": 13,
  "archetype_catalog_version": "1.7.0",
  "myth_catalog_version": "1.2.0",
  "target_language": {
    "code": "en",
    "name": "English"
  },
  "cost_usd": 0.0041277,
  "raw_archetypes": [
    {
      "archetype_id": "lover",
      "expression": "my partner and I wrapped in the same blanket and looking together",
      "resonance": "The shared blanket and sustained mutual looking make the bond itself the organizing center, softening the dark depth into something held and inhabitable.",
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
  "post_validation_archetypes": [
    {
      "canonical_label": "Lover",
      "expression": "my partner and I wrapped in the same blanket and looking together",
      "resonance": "The shared blanket and sustained mutual looking make the bond itself the organizing center, softening the dark depth into something held and inhabitable.",
      "evidence": [
        "My partner and I lie wrapped in the same blanket on a quiet pier, watching lantern fish move beneath the water. Neither of us speaks. The closeness makes the dark depth feel welcoming rather than risky, and we keep looking together for a long time."
      ],
      "confidence": "high",
      "archetype_id": "lover",
      "archetype_catalog_version": "1.7.0",
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
  "interpretive_diagnostics": {
    "selection_notes": {
      "archetype_reasons": [
        "lover: the dream centers a sustained, mutually oriented bond that shapes the whole field; the blanket, silence, and shared looking are structurally intimate rather than incidental."
      ],
      "mythic_reason": "[]",
      "near_misses": [
        "No mythic sequence is clearly earned; the dream is too compact and cohesive for a specific narrative match."
      ]
    }
  }
}
```

#### F_pos_lover_shared_depth_en_r3

```json
{
  "fixture_id": "F_pos_lover_shared_depth_en",
  "category": "lover_positive_harmonious",
  "raw_dream": "My partner and I lie wrapped in the same blanket on a quiet pier, watching lantern fish move beneath the water. Neither of us speaks. The closeness makes the dark depth feel welcoming rather than risky, and we keep looking together for a long time.",
  "ok": true,
  "latency_ms": 5694,
  "model": "gpt-5.4-mini-2026-03-17",
  "prompt_id": "dream-field-map-interpretive-v4.1.10-M2.1",
  "prompt_version": "4.1.10-M2.1",
  "schema_version": 13,
  "archetype_catalog_version": "1.7.0",
  "myth_catalog_version": "1.2.0",
  "target_language": {
    "code": "en",
    "name": "English"
  },
  "cost_usd": 0.0041202,
  "raw_archetypes": [
    {
      "archetype_id": "lover",
      "expression": "partner and shared blanket",
      "resonance": "A sustained bond organizes the dream-space, with mutual closeness making the depth feel safe enough to share and watch together.",
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
  "post_validation_archetypes": [
    {
      "canonical_label": "Lover",
      "expression": "partner and shared blanket",
      "resonance": "A sustained bond organizes the dream-space, with mutual closeness making the depth feel safe enough to share and watch together.",
      "evidence": [
        "My partner and I lie wrapped in the same blanket on a quiet pier, watching lantern fish move beneath the water. Neither of us speaks. The closeness makes the dark depth feel welcoming rather than risky, and we keep looking together for a long time."
      ],
      "confidence": "high",
      "archetype_id": "lover",
      "archetype_catalog_version": "1.7.0",
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
  "interpretive_diagnostics": {
    "selection_notes": {
      "archetype_reasons": [
        "lover: the partner bond is central and sustained, with shared wrapping, silent mutual attention, and the whole field organized by closeness and devotion."
      ],
      "mythic_reason": "[]",
      "near_misses": [
        "No mythic echo was earned: the dream is a calm shared scene without the required quest, loss, ordeal, or underworld sequence."
      ]
    }
  }
}
```

### Longing/separation Lover positive — runs

#### F_pos_lover_bench_rain_en_r1

```json
{
  "fixture_id": "F_pos_lover_bench_rain_en",
  "category": "lover_positive_longing",
  "raw_dream": "Someone I lost finds me at a bus stop in light rain. We stand close without speaking. The bus arrives but neither of us boards.",
  "ok": true,
  "latency_ms": 8253,
  "model": "gpt-5.4-mini-2026-03-17",
  "prompt_id": "dream-field-map-interpretive-v4.1.10-M2.1",
  "prompt_version": "4.1.10-M2.1",
  "schema_version": 13,
  "archetype_catalog_version": "1.7.0",
  "myth_catalog_version": "1.2.0",
  "target_language": {
    "code": "en",
    "name": "English"
  },
  "cost_usd": 0.00513015,
  "raw_archetypes": [
    {
      "archetype_id": "lover",
      "expression": "someone I lost finds me and stands close without speaking",
      "resonance": "A lost bond returns at a public waiting place and holds the scene in quiet closeness, with no movement toward resolution.",
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
  "post_validation_archetypes": [
    {
      "canonical_label": "Lover",
      "expression": "someone I lost finds me and stands close without speaking",
      "resonance": "A lost bond returns at a public waiting place and holds the scene in quiet closeness, with no movement toward resolution.",
      "evidence": [
        "Someone I lost finds me at a bus stop in light rain. We stand close without speaking. The bus arrives but neither of us boards."
      ],
      "confidence": "medium",
      "archetype_id": "lover",
      "archetype_catalog_version": "1.7.0",
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
  "interpretive_diagnostics": {
    "selection_notes": {
      "archetype_reasons": [
        "lover: the dream centers on a lost person reappearing, sustained closeness, and a bond that organizes the whole scene; the bus stop and non-boarding preserve longing rather than mere reunion."
      ],
      "mythic_reason": "[]",
      "near_misses": [
        "guide_psychopomp: there is a threshold scene, but no guidance across it.",
        "orphan: loss is present, but the dream is organized by returned relation rather than abandonment."
      ]
    }
  }
}
```

#### F_pos_lover_bench_rain_en_r2

```json
{
  "fixture_id": "F_pos_lover_bench_rain_en",
  "category": "lover_positive_longing",
  "raw_dream": "Someone I lost finds me at a bus stop in light rain. We stand close without speaking. The bus arrives but neither of us boards.",
  "ok": true,
  "latency_ms": 5537,
  "model": "gpt-5.4-mini-2026-03-17",
  "prompt_id": "dream-field-map-interpretive-v4.1.10-M2.1",
  "prompt_version": "4.1.10-M2.1",
  "schema_version": 13,
  "archetype_catalog_version": "1.7.0",
  "myth_catalog_version": "1.2.0",
  "target_language": {
    "code": "en",
    "name": "English"
  },
  "cost_usd": 0.00420195,
  "raw_archetypes": [
    {
      "archetype_id": "lover",
      "expression": "someone I lost stands close with me without words",
      "resonance": "A lost bond returns in immediate nearness, and the silence itself becomes the shape of longing at the stop.",
      "confidence": "medium",
      "mechanism_tags": [
        "devotion_or_longing",
        "bond_organizes_dream",
        "union_separation_or_loss"
      ],
      "evidence_ids": [
        "D1"
      ]
    }
  ],
  "validator_decisions": [
    {
      "archetype_id": "lover",
      "canonical_label": "Lover",
      "accepted": true,
      "rejection_codes": [],
      "rejection_reason": null,
      "mechanism_tags": [
        "devotion_or_longing",
        "bond_organizes_dream",
        "union_separation_or_loss"
      ],
      "evidence_ids": [
        "D1"
      ]
    }
  ],
  "post_validation_archetypes": [
    {
      "canonical_label": "Lover",
      "expression": "someone I lost stands close with me without words",
      "resonance": "A lost bond returns in immediate nearness, and the silence itself becomes the shape of longing at the stop.",
      "evidence": [
        "Someone I lost finds me at a bus stop in light rain. We stand close without speaking. The bus arrives but neither of us boards."
      ],
      "confidence": "medium",
      "archetype_id": "lover",
      "archetype_catalog_version": "1.7.0",
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
  "core_mode": "Core Shift",
  "raw_amplifications": [],
  "post_validation_amplifications": [],
  "mythic_reject_reasons": [],
  "interpretive_diagnostics": {
    "selection_notes": {
      "archetype_reasons": [
        "lover: a lost person returns, closeness is sustained, and the bond organizes the scene more than the transit setting."
      ],
      "mythic_reason": "[]",
      "near_misses": [
        "guide_psychopomp: no active guiding across a realm-shift is staged.",
        "orpheus_eurydice: there is no underworld, no retrieval crossing, and no conditional return structure."
      ]
    }
  }
}
```

#### F_pos_lover_bench_rain_en_r3

```json
{
  "fixture_id": "F_pos_lover_bench_rain_en",
  "category": "lover_positive_longing",
  "raw_dream": "Someone I lost finds me at a bus stop in light rain. We stand close without speaking. The bus arrives but neither of us boards.",
  "ok": true,
  "latency_ms": 5002,
  "model": "gpt-5.4-mini-2026-03-17",
  "prompt_id": "dream-field-map-interpretive-v4.1.10-M2.1",
  "prompt_version": "4.1.10-M2.1",
  "schema_version": 13,
  "archetype_catalog_version": "1.7.0",
  "myth_catalog_version": "1.2.0",
  "target_language": {
    "code": "en",
    "name": "English"
  },
  "cost_usd": 0.00397845,
  "raw_archetypes": [
    {
      "archetype_id": "lover",
      "expression": "someone I lost finds me and we stand close without speaking",
      "resonance": "A lost bond returns at the threshold, and the closeness itself holds the dream more than any action or speech.",
      "confidence": "high",
      "mechanism_tags": [
        "devotion_or_longing",
        "bond_organizes_dream",
        "union_separation_or_loss"
      ],
      "evidence_ids": [
        "D1"
      ]
    }
  ],
  "validator_decisions": [
    {
      "archetype_id": "lover",
      "canonical_label": "Lover",
      "accepted": true,
      "rejection_codes": [],
      "rejection_reason": null,
      "mechanism_tags": [
        "devotion_or_longing",
        "bond_organizes_dream",
        "union_separation_or_loss"
      ],
      "evidence_ids": [
        "D1"
      ]
    }
  ],
  "post_validation_archetypes": [
    {
      "canonical_label": "Lover",
      "expression": "someone I lost finds me and we stand close without speaking",
      "resonance": "A lost bond returns at the threshold, and the closeness itself holds the dream more than any action or speech.",
      "evidence": [
        "Someone I lost finds me at a bus stop in light rain. We stand close without speaking. The bus arrives but neither of us boards."
      ],
      "confidence": "high",
      "archetype_id": "lover",
      "archetype_catalog_version": "1.7.0",
      "evidence_ids": [
        "D1"
      ]
    }
  ],
  "archetype_reject_reasons": [],
  "central_conflicts": [
    "contact vs departure"
  ],
  "main_tension": "contact vs departure",
  "core_mode": "Core Tension",
  "raw_amplifications": [],
  "post_validation_amplifications": [],
  "mythic_reject_reasons": [],
  "interpretive_diagnostics": {
    "selection_notes": {
      "archetype_reasons": [
        "lover: a lost person finds the dreamer, closeness is sustained, and the bond itself organizes the scene at a threshold."
      ],
      "mythic_reason": "[]",
      "near_misses": [
        "guide_psychopomp was not selected because there is no guidance across a realm-shift, only waiting and non-boarding.",
        "orphan was not selected because the dream centers recovered closeness more than abandonment."
      ]
    }
  }
}
```

### Incidental-partner negative — runs

#### F_neg_partner_logistics_en_r1

```json
{
  "fixture_id": "F_neg_partner_logistics_en",
  "category": "lover_negative_incidental_partner",
  "raw_dream": "My partner drops grocery bags by the kitchen island, asks whether I paid the electricity bill, and leaves again to park the car. I stack the cans by expiry date and text him the door code. The apartment stays ordinary before and after he passes through.",
  "ok": true,
  "latency_ms": 5180,
  "model": "gpt-5.4-mini-2026-03-17",
  "prompt_id": "dream-field-map-interpretive-v4.1.10-M2.1",
  "prompt_version": "4.1.10-M2.1",
  "schema_version": 13,
  "archetype_catalog_version": "1.7.0",
  "myth_catalog_version": "1.2.0",
  "target_language": {
    "code": "en",
    "name": "English"
  },
  "cost_usd": 0.0045279,
  "raw_archetypes": [],
  "validator_decisions": [],
  "post_validation_archetypes": [],
  "archetype_reject_reasons": [],
  "central_conflicts": [],
  "main_tension": null,
  "core_mode": "Core State",
  "raw_amplifications": [],
  "post_validation_amplifications": [],
  "mythic_reject_reasons": [],
  "interpretive_diagnostics": {
    "selection_notes": {
      "archetype_reasons": [
        "[] — the dream shows practical coordination and brief contact, but no distinct archetypal function is clearly enacted."
      ],
      "mythic_reason": "[] — the dream is a small domestic logistics scene, without the required mythic sequence of descent, trial, loss, or return.",
      "near_misses": [
        "Persona was considered but the scene lacks a socially adapted mask or public/private tension.",
        "Lover was considered but the bond is not staged through longing, union, or heart-risk; it remains routine and practical."
      ]
    }
  }
}
```

#### F_neg_partner_logistics_en_r2

```json
{
  "fixture_id": "F_neg_partner_logistics_en",
  "category": "lover_negative_incidental_partner",
  "raw_dream": "My partner drops grocery bags by the kitchen island, asks whether I paid the electricity bill, and leaves again to park the car. I stack the cans by expiry date and text him the door code. The apartment stays ordinary before and after he passes through.",
  "ok": true,
  "latency_ms": 5087,
  "model": "gpt-5.4-mini-2026-03-17",
  "prompt_id": "dream-field-map-interpretive-v4.1.10-M2.1",
  "prompt_version": "4.1.10-M2.1",
  "schema_version": 13,
  "archetype_catalog_version": "1.7.0",
  "myth_catalog_version": "1.2.0",
  "target_language": {
    "code": "en",
    "name": "English"
  },
  "cost_usd": 0.0040302,
  "raw_archetypes": [],
  "validator_decisions": [],
  "post_validation_archetypes": [],
  "archetype_reject_reasons": [],
  "central_conflicts": [],
  "main_tension": null,
  "core_mode": "Core State",
  "raw_amplifications": [],
  "post_validation_amplifications": [],
  "mythic_reject_reasons": [],
  "interpretive_diagnostics": {
    "selection_notes": {
      "archetype_reasons": [
        "[] — the dream shows routine domestic coordination, but no sustained archetypal function is clearly enacted."
      ],
      "mythic_reason": "[] — there is no qualifying sequence of departure, trial, loss, or return; only ordinary household logistics.",
      "near_misses": [
        "No guide or threshold escort: the partner leaves, but does not structure a crossing.",
        "No persona/double/orphan: no split identity, exclusion, or role replacement is staged."
      ]
    }
  }
}
```

#### F_neg_partner_logistics_en_r3

```json
{
  "fixture_id": "F_neg_partner_logistics_en",
  "category": "lover_negative_incidental_partner",
  "raw_dream": "My partner drops grocery bags by the kitchen island, asks whether I paid the electricity bill, and leaves again to park the car. I stack the cans by expiry date and text him the door code. The apartment stays ordinary before and after he passes through.",
  "ok": false,
  "latency_ms": 526,
  "model": null,
  "prompt_id": "dream-field-map-interpretive-v4.1.10-M2.1",
  "prompt_version": "4.1.10-M2.1",
  "schema_version": 13,
  "archetype_catalog_version": "1.7.0",
  "myth_catalog_version": "1.2.0",
  "target_language": {
    "code": "en",
    "name": "English"
  },
  "cost_usd": null,
  "raw_archetypes": [],
  "validator_decisions": [],
  "post_validation_archetypes": [],
  "archetype_reject_reasons": [],
  "central_conflicts": [],
  "main_tension": null,
  "core_mode": null,
  "raw_amplifications": [],
  "post_validation_amplifications": [],
  "mythic_reject_reasons": [],
  "interpretive_diagnostics": null
}
```

### Close non-romantic companionship negative — runs

#### F_neg_warm_friends_en_r1

```json
{
  "fixture_id": "F_neg_warm_friends_en",
  "category": "lover_negative_non_romantic",
  "raw_dream": "A close friend and I paddle a canoe across a still lake, joking softly while we look for the right campsite. We work well together and unload the bags without friction. It feels companionable and easy, but nothing in the scene turns toward romance, devotion, or beloved risk.",
  "ok": true,
  "latency_ms": 4200,
  "model": "gpt-5.4-mini-2026-03-17",
  "prompt_id": "dream-field-map-interpretive-v4.1.10-M2.1",
  "prompt_version": "4.1.10-M2.1",
  "schema_version": 13,
  "archetype_catalog_version": "1.7.0",
  "myth_catalog_version": "1.2.0",
  "target_language": {
    "code": "en",
    "name": "English"
  },
  "cost_usd": 0.00375495,
  "raw_archetypes": [],
  "validator_decisions": [],
  "post_validation_archetypes": [],
  "archetype_reject_reasons": [],
  "central_conflicts": [],
  "main_tension": null,
  "core_mode": "Core State",
  "raw_amplifications": [],
  "post_validation_amplifications": [],
  "mythic_reject_reasons": [],
  "interpretive_diagnostics": {
    "selection_notes": {
      "archetype_reasons": [
        "[]: the dream shows companionship and coordination, but no archetypal function is strongly enacted."
      ],
      "mythic_reason": "[]: no distinctive mythic sequence or required role pattern is present beyond a simple shared outing.",
      "near_misses": [
        "Lover: explicitly not supported by the dream.",
        "Guide / Psychopomp: no threshold-crossing guidance is staged."
      ]
    }
  }
}
```

#### F_neg_warm_friends_en_r2

```json
{
  "fixture_id": "F_neg_warm_friends_en",
  "category": "lover_negative_non_romantic",
  "raw_dream": "A close friend and I paddle a canoe across a still lake, joking softly while we look for the right campsite. We work well together and unload the bags without friction. It feels companionable and easy, but nothing in the scene turns toward romance, devotion, or beloved risk.",
  "ok": true,
  "latency_ms": 4545,
  "model": "gpt-5.4-mini-2026-03-17",
  "prompt_id": "dream-field-map-interpretive-v4.1.10-M2.1",
  "prompt_version": "4.1.10-M2.1",
  "schema_version": 13,
  "archetype_catalog_version": "1.7.0",
  "myth_catalog_version": "1.2.0",
  "target_language": {
    "code": "en",
    "name": "English"
  },
  "cost_usd": 0.00385395,
  "raw_archetypes": [],
  "validator_decisions": [],
  "post_validation_archetypes": [],
  "archetype_reject_reasons": [],
  "central_conflicts": [],
  "main_tension": null,
  "core_mode": "Core State",
  "raw_amplifications": [],
  "post_validation_amplifications": [],
  "mythic_reject_reasons": [],
  "interpretive_diagnostics": {
    "selection_notes": {
      "archetype_reasons": [
        "[] — the dream shows companionship and ease, but no enacted archetypal function beyond ordinary friendship."
      ],
      "mythic_reason": "[] — there is no ordeal, loss, descent, rescue, or other mythic sequence; only a simple shared crossing and search for camp.",
      "near_misses": [
        "Lover: the dream explicitly says the scene does not turn toward romance or beloved risk.",
        "Guide / Psychopomp: there is movement across water, but no threshold escort or guided realm-shift.",
        "Hero: no ordeal, confrontation, or boon is present."
      ]
    }
  }
}
```

#### F_neg_warm_friends_en_r3

```json
{
  "fixture_id": "F_neg_warm_friends_en",
  "category": "lover_negative_non_romantic",
  "raw_dream": "A close friend and I paddle a canoe across a still lake, joking softly while we look for the right campsite. We work well together and unload the bags without friction. It feels companionable and easy, but nothing in the scene turns toward romance, devotion, or beloved risk.",
  "ok": true,
  "latency_ms": 5536,
  "model": "gpt-5.4-mini-2026-03-17",
  "prompt_id": "dream-field-map-interpretive-v4.1.10-M2.1",
  "prompt_version": "4.1.10-M2.1",
  "schema_version": 13,
  "archetype_catalog_version": "1.7.0",
  "myth_catalog_version": "1.2.0",
  "target_language": {
    "code": "en",
    "name": "English"
  },
  "cost_usd": 0.0040077,
  "raw_archetypes": [
    {
      "archetype_id": "lover",
      "expression": "the close companionship and easy shared movement",
      "resonance": "A bonded pair moves with ease and mutual attunement, and the shared passage itself becomes the center of the scene without romantic escalation.",
      "confidence": "medium",
      "mechanism_tags": [
        "devotion_or_longing",
        "bond_organizes_dream"
      ],
      "evidence_ids": [
        "D1"
      ]
    }
  ],
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
  "post_validation_archetypes": [
    {
      "canonical_label": "Lover",
      "expression": "the close companionship and easy shared movement",
      "resonance": "A bonded pair moves with ease and mutual attunement, and the shared passage itself becomes the center of the scene without romantic escalation.",
      "evidence": [
        "A close friend and I paddle a canoe across a still lake, joking softly while we look for the right campsite. We work well together and unload the bags without friction. It feels companionable and easy, but nothing in the scene turns toward romance, devotion, or beloved risk."
      ],
      "confidence": "medium",
      "archetype_id": "lover",
      "archetype_catalog_version": "1.7.0",
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
  "interpretive_diagnostics": {
    "selection_notes": {
      "archetype_reasons": [
        "lover: the dream's emotional center is a warm two-person bond organizing movement and shared orientation, even without explicit romance."
      ],
      "mythic_reason": "[]",
      "near_misses": [
        "No mythic echo: the dream lacks a qualifying transformative sequence, ordeal, loss, or threshold narrative beyond simple cooperative travel."
      ]
    }
  }
}
```

### Romance-cue-only negative — runs

#### F_neg_romance_cue_only_en_r1

```json
{
  "fixture_id": "F_neg_romance_cue_only_en",
  "category": "lover_negative_romance_cue_only",
  "raw_dream": "I walk through a wedding reception in a silver dress while strangers smile and toss rose petals. A handsome person kisses my cheek for a photo and disappears into the crowd. I spend the rest of the dream searching for the table number on my card.",
  "ok": true,
  "latency_ms": 5362,
  "model": "gpt-5.4-mini-2026-03-17",
  "prompt_id": "dream-field-map-interpretive-v4.1.10-M2.1",
  "prompt_version": "4.1.10-M2.1",
  "schema_version": 13,
  "archetype_catalog_version": "1.7.0",
  "myth_catalog_version": "1.2.0",
  "target_language": {
    "code": "en",
    "name": "English"
  },
  "cost_usd": 0.0040587,
  "raw_archetypes": [],
  "validator_decisions": [],
  "post_validation_archetypes": [],
  "archetype_reject_reasons": [],
  "central_conflicts": [
    "recognition vs finding my place"
  ],
  "main_tension": "recognition vs finding my place",
  "core_mode": "Core Tension",
  "raw_amplifications": [],
  "post_validation_amplifications": [],
  "mythic_reject_reasons": [],
  "interpretive_diagnostics": {
    "selection_notes": {
      "archetype_reasons": [
        "[]: the dream contains social warmth and a brief kiss, but no sustained archetypal function is clearly enacted."
      ],
      "mythic_reason": "[]: the dream is too brief and ordinary in sequence to match a closed mythic narrative.",
      "near_misses": [
        "Lover was not selected because the bond is momentary and does not organize the dream.",
        "Persona was not selected because no stable public mask or role tension is staged."
      ]
    }
  }
}
```

#### F_neg_romance_cue_only_en_r2

```json
{
  "fixture_id": "F_neg_romance_cue_only_en",
  "category": "lover_negative_romance_cue_only",
  "raw_dream": "I walk through a wedding reception in a silver dress while strangers smile and toss rose petals. A handsome person kisses my cheek for a photo and disappears into the crowd. I spend the rest of the dream searching for the table number on my card.",
  "ok": true,
  "latency_ms": 5609,
  "model": "gpt-5.4-mini-2026-03-17",
  "prompt_id": "dream-field-map-interpretive-v4.1.10-M2.1",
  "prompt_version": "4.1.10-M2.1",
  "schema_version": 13,
  "archetype_catalog_version": "1.7.0",
  "myth_catalog_version": "1.2.0",
  "target_language": {
    "code": "en",
    "name": "English"
  },
  "cost_usd": 0.0048639,
  "raw_archetypes": [],
  "validator_decisions": [],
  "post_validation_archetypes": [],
  "archetype_reject_reasons": [],
  "central_conflicts": [
    "arrival vs not finding your place"
  ],
  "main_tension": "arrival vs not finding your place",
  "core_mode": "Core Tension",
  "raw_amplifications": [],
  "post_validation_amplifications": [],
  "mythic_reject_reasons": [],
  "interpretive_diagnostics": {
    "selection_notes": {
      "archetype_reasons": [
        "[] — the dream shows social closeness and searching, but no archetypal function is clearly enacted beyond ordinary relational imagery."
      ],
      "mythic_reason": "[] — there is no sustained causal sequence, ordeal, or transformation that matches a closed mythic pattern.",
      "near_misses": [
        "Lover was not selected because the kiss is brief and does not organize the dream as a bond.",
        "Persona was not selected because the dress is ceremonial, but there is no clear social-mask tension.",
        "No myth was selected because the dream remains a single social scene without a qualifying narrative sequence."
      ]
    }
  }
}
```

#### F_neg_romance_cue_only_en_r3

```json
{
  "fixture_id": "F_neg_romance_cue_only_en",
  "category": "lover_negative_romance_cue_only",
  "raw_dream": "I walk through a wedding reception in a silver dress while strangers smile and toss rose petals. A handsome person kisses my cheek for a photo and disappears into the crowd. I spend the rest of the dream searching for the table number on my card.",
  "ok": true,
  "latency_ms": 7568,
  "model": "gpt-5.4-mini-2026-03-17",
  "prompt_id": "dream-field-map-interpretive-v4.1.10-M2.1",
  "prompt_version": "4.1.10-M2.1",
  "schema_version": 13,
  "archetype_catalog_version": "1.7.0",
  "myth_catalog_version": "1.2.0",
  "target_language": {
    "code": "en",
    "name": "English"
  },
  "cost_usd": 0.0041382,
  "raw_archetypes": [],
  "validator_decisions": [],
  "post_validation_archetypes": [],
  "archetype_reject_reasons": [],
  "central_conflicts": [
    "glimpse of closeness vs finding your place"
  ],
  "main_tension": "glimpse of closeness vs finding your place",
  "core_mode": "Core Tension",
  "raw_amplifications": [],
  "post_validation_amplifications": [],
  "mythic_reject_reasons": [],
  "interpretive_diagnostics": {
    "selection_notes": {
      "archetype_reasons": [
        "[] — the dream shows social contact and a search for placement, but no archetypal function is strongly enacted."
      ],
      "mythic_reason": "[] — this is a brief social-search dream without the distinctive causal sequence required for a catalog match.",
      "near_misses": [
        "greek.cinderella — only a partial recognition/placement feeling, without disguise, loss, token-fits-only-true-person, or marriage outcome.",
        "german.cinderella — the dress and reception suggest social presentation, but the dream lacks humiliation, aid, concealment, and recognition structure."
      ]
    }
  }
}
```

### Calm Mother positive — runs

#### F_pos_mother_kitchen_en_r1

```json
{
  "fixture_id": "F_pos_mother_kitchen_en",
  "category": "mother_positive",
  "raw_dream": "An enormous woman fills a stone kitchen. She feeds me broth that warms my chest and wraps me in a shawl that smells like rain soil. Outside a storm tears roofs away, but her table stays steady. When I try to stand without her arm I feel cold immediately; when I lean back into her the storm softens.",
  "ok": true,
  "latency_ms": 5869,
  "model": "gpt-5.4-mini-2026-03-17",
  "prompt_id": "dream-field-map-interpretive-v4.1.10-M2.1",
  "prompt_version": "4.1.10-M2.1",
  "schema_version": 13,
  "archetype_catalog_version": "1.7.0",
  "myth_catalog_version": "1.2.0",
  "target_language": {
    "code": "en",
    "name": "English"
  },
  "cost_usd": 0.00549165,
  "raw_archetypes": [
    {
      "archetype_id": "mother",
      "expression": "An enormous woman feeds and wraps the dreamer, and her arm keeps warmth and steadiness against the storm.",
      "resonance": "Maternal holding organizes the whole scene: warmth, food, cloth, and bodily support keep the dreamer from immediate cold.",
      "confidence": "high",
      "mechanism_tags": [
        "bond_organizes_dream"
      ],
      "evidence_ids": [
        "D1"
      ]
    }
  ],
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
  "post_validation_archetypes": [
    {
      "canonical_label": "Mother",
      "expression": "An enormous woman feeds and wraps the dreamer, and her arm keeps warmth and steadiness against the storm.",
      "resonance": "Maternal holding organizes the whole scene: warmth, food, cloth, and bodily support keep the dreamer from immediate cold.",
      "evidence": [
        "An enormous woman fills a stone kitchen. She feeds me broth that warms my chest and wraps me in a shawl that smells like rain soil. Outside a storm tears roofs away, but her table stays steady. When I try to stand without her arm I feel cold immediately; when I lean back into her the storm softens."
      ],
      "confidence": "high",
      "archetype_id": "mother",
      "archetype_catalog_version": "1.7.0",
      "evidence_ids": [
        "D1"
      ]
    }
  ],
  "archetype_reject_reasons": [],
  "central_conflicts": [
    "support vs immediate cold"
  ],
  "main_tension": "support vs immediate cold",
  "core_mode": "Core Restoration",
  "raw_amplifications": [
    {
      "catalog_id": "alchemy.solutio_coagulatio",
      "resonance": "A fixed, exposed state is softened by a wet, warming substance and then held together again in a steadier form.",
      "divergence": "The dream is intimate and domestic rather than laboratory-like, and the restoration comes through care, not process.",
      "evidence_ids": [
        "D1"
      ],
      "evidence": [],
      "confidence": "medium"
    }
  ],
  "post_validation_amplifications": [
    {
      "catalog_id": "alchemy.solutio_coagulatio",
      "title": "Solutio and Coagulatio",
      "tradition": "Western alchemical tradition",
      "source_type": "alchemical_sequence",
      "resonance": "A fixed, exposed state is softened by a wet, warming substance and then held together again in a steadier form.",
      "divergence": "The dream is intimate and domestic rather than laboratory-like, and the restoration comes through care, not process.",
      "evidence": [
        "An enormous woman fills a stone kitchen. She feeds me broth that warms my chest and wraps me in a shawl that smells like rain soil. Outside a storm tears roofs away, but her table stays steady. When I try to stand without her arm I feel cold immediately; when I lean back into her the storm softens."
      ],
      "confidence": "medium",
      "catalog_myth_version": "1.3.0"
    }
  ],
  "mythic_reject_reasons": [],
  "interpretive_diagnostics": {
    "selection_notes": {
      "archetype_reasons": [
        "mother: selected because maternal holding, feeding, wrapping, and anti-separation support organize the entire dream-space."
      ],
      "mythic_reason": "[]",
      "near_misses": [
        "mother goddess or enchantress were not selected because the dream gives a concrete maternal holding scene, not a mythic or hostile one.",
        "No mythic echo was earned because the dream is a single restorative sheltering moment without the required sequence structure."
      ]
    }
  }
}
```

#### F_pos_mother_kitchen_en_r2

```json
{
  "fixture_id": "F_pos_mother_kitchen_en",
  "category": "mother_positive",
  "raw_dream": "An enormous woman fills a stone kitchen. She feeds me broth that warms my chest and wraps me in a shawl that smells like rain soil. Outside a storm tears roofs away, but her table stays steady. When I try to stand without her arm I feel cold immediately; when I lean back into her the storm softens.",
  "ok": true,
  "latency_ms": 5503,
  "model": "gpt-5.4-mini-2026-03-17",
  "prompt_id": "dream-field-map-interpretive-v4.1.10-M2.1",
  "prompt_version": "4.1.10-M2.1",
  "schema_version": 13,
  "archetype_catalog_version": "1.7.0",
  "myth_catalog_version": "1.2.0",
  "target_language": {
    "code": "en",
    "name": "English"
  },
  "cost_usd": 0.00439695,
  "raw_archetypes": [
    {
      "archetype_id": "mother",
      "expression": "an enormous woman who feeds me broth and wraps me in a shawl",
      "resonance": "The maternal figure organizes the whole scene through feeding, covering, and steady holding, making warmth and protection available only through closeness.",
      "confidence": "high",
      "mechanism_tags": [
        "bond_organizes_dream"
      ],
      "evidence_ids": [
        "D1"
      ]
    }
  ],
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
  "post_validation_archetypes": [
    {
      "canonical_label": "Mother",
      "expression": "an enormous woman who feeds me broth and wraps me in a shawl",
      "resonance": "The maternal figure organizes the whole scene through feeding, covering, and steady holding, making warmth and protection available only through closeness.",
      "evidence": [
        "An enormous woman fills a stone kitchen. She feeds me broth that warms my chest and wraps me in a shawl that smells like rain soil. Outside a storm tears roofs away, but her table stays steady. When I try to stand without her arm I feel cold immediately; when I lean back into her the storm softens."
      ],
      "confidence": "high",
      "archetype_id": "mother",
      "archetype_catalog_version": "1.7.0",
      "evidence_ids": [
        "D1"
      ]
    }
  ],
  "archetype_reject_reasons": [],
  "central_conflicts": [
    "protection vs cold"
  ],
  "main_tension": "protection vs cold",
  "core_mode": "Core Restoration",
  "raw_amplifications": [],
  "post_validation_amplifications": [],
  "mythic_reject_reasons": [],
  "interpretive_diagnostics": {
    "selection_notes": {
      "archetype_reasons": [
        "mother: the dream is structurally organized by a large woman who feeds, wraps, steadies, and regulates warmth and safety through her holding presence."
      ],
      "mythic_reason": "[]",
      "near_misses": [
        "No mythic sequence is strongly earned from a single sheltered kitchen scene.",
        "No guide, hero, or threshold-crossing pattern is structurally central here."
      ]
    }
  }
}
```

#### F_pos_mother_kitchen_en_r3

```json
{
  "fixture_id": "F_pos_mother_kitchen_en",
  "category": "mother_positive",
  "raw_dream": "An enormous woman fills a stone kitchen. She feeds me broth that warms my chest and wraps me in a shawl that smells like rain soil. Outside a storm tears roofs away, but her table stays steady. When I try to stand without her arm I feel cold immediately; when I lean back into her the storm softens.",
  "ok": true,
  "latency_ms": 5450,
  "model": "gpt-5.4-mini-2026-03-17",
  "prompt_id": "dream-field-map-interpretive-v4.1.10-M2.1",
  "prompt_version": "4.1.10-M2.1",
  "schema_version": 13,
  "archetype_catalog_version": "1.7.0",
  "myth_catalog_version": "1.2.0",
  "target_language": {
    "code": "en",
    "name": "English"
  },
  "cost_usd": 0.00442395,
  "raw_archetypes": [
    {
      "archetype_id": "mother",
      "expression": "The enormous woman in the stone kitchen feeds and wraps the dreamer, holding the room steady against the storm.",
      "resonance": "A maternal field organizes the dream through feeding, covering, and steady holding while the outside weather becomes bearable.",
      "confidence": "high",
      "mechanism_tags": [
        "bond_organizes_dream"
      ],
      "evidence_ids": [
        "D1"
      ]
    }
  ],
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
  "post_validation_archetypes": [
    {
      "canonical_label": "Mother",
      "expression": "The enormous woman in the stone kitchen feeds and wraps the dreamer, holding the room steady against the storm.",
      "resonance": "A maternal field organizes the dream through feeding, covering, and steady holding while the outside weather becomes bearable.",
      "evidence": [
        "An enormous woman fills a stone kitchen. She feeds me broth that warms my chest and wraps me in a shawl that smells like rain soil. Outside a storm tears roofs away, but her table stays steady. When I try to stand without her arm I feel cold immediately; when I lean back into her the storm softens."
      ],
      "confidence": "high",
      "archetype_id": "mother",
      "archetype_catalog_version": "1.7.0",
      "evidence_ids": [
        "D1"
      ]
    }
  ],
  "archetype_reject_reasons": [],
  "central_conflicts": [
    "contact vs coldness"
  ],
  "main_tension": "contact vs coldness",
  "core_mode": "Core Restoration",
  "raw_amplifications": [],
  "post_validation_amplifications": [],
  "mythic_reject_reasons": [],
  "interpretive_diagnostics": {
    "selection_notes": {
      "archetype_reasons": [
        "mother: the dream stages maternal containing and nourishment as the organizing field, not just a woman or food."
      ],
      "mythic_reason": "[]",
      "near_misses": [
        "guide_psychopomp was not selected because there is no cross-realm guidance; the scene is protective containment, not passage.",
        "french.beauty_beast and similar bond tales were not selected because the bond does not hinge on courtship, trial, or transformation."
      ]
    }
  }
}
```

### Calm Father positive — runs

#### m21_calm_father_en_r1

```json
{
  "fixture_id": "m21_calm_father_en",
  "category": "father_positive",
  "raw_dream": "At dusk my father stands at the garden gate and quietly tells me which tools must come inside before the rain. He does not raise his voice. As I follow his calm instruction, the whole yard feels ordered and protected, and even the wind seems to fall into place around that steady authority.",
  "ok": true,
  "latency_ms": 5047,
  "model": "gpt-5.4-mini-2026-03-17",
  "prompt_id": "dream-field-map-interpretive-v4.1.10-M2.1",
  "prompt_version": "4.1.10-M2.1",
  "schema_version": 13,
  "archetype_catalog_version": "1.7.0",
  "myth_catalog_version": "1.2.0",
  "target_language": {
    "code": "en",
    "name": "English"
  },
  "cost_usd": 0.00497565,
  "raw_archetypes": [
    {
      "archetype_id": "father",
      "expression": "father at the garden gate giving calm instruction",
      "resonance": "A fatherly presence stands at the boundary and quietly orients what needs to be gathered in before the weather changes.",
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
  "post_validation_archetypes": [
    {
      "canonical_label": "Father",
      "expression": "father at the garden gate giving calm instruction",
      "resonance": "A fatherly presence stands at the boundary and quietly orients what needs to be gathered in before the weather changes.",
      "evidence": [
        "At dusk my father stands at the garden gate and quietly tells me which tools must come inside before the rain. He does not raise his voice. As I follow his calm instruction, the whole yard feels ordered and protected, and even the wind seems to fall into place around that steady authority."
      ],
      "confidence": "high",
      "archetype_id": "father",
      "archetype_catalog_version": "1.7.0",
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
  "interpretive_diagnostics": {
    "selection_notes": {
      "archetype_reasons": [
        "father: the dream centers a paternal authority that gives calm, consequence-shaping guidance at a boundary; this directly fits the father function.",
        "No other archetype is better enacted: the scene does not stage quest, deception, split identity, or transformative ordeal."
      ],
      "mythic_reason": "[]",
      "near_misses": [
        "Guide / Psychopomp was rejected because there is no crossing between domains, only boundary guidance within a familiar setting.",
        "Ruler was rejected because the authority is intimate and situational rather than sovereign or court-like."
      ]
    }
  }
}
```

#### m21_calm_father_en_r2

```json
{
  "fixture_id": "m21_calm_father_en",
  "category": "father_positive",
  "raw_dream": "At dusk my father stands at the garden gate and quietly tells me which tools must come inside before the rain. He does not raise his voice. As I follow his calm instruction, the whole yard feels ordered and protected, and even the wind seems to fall into place around that steady authority.",
  "ok": true,
  "latency_ms": 20128,
  "model": "gpt-5.4-mini-2026-03-17",
  "prompt_id": "dream-field-map-interpretive-v4.1.10-M2.1",
  "prompt_version": "4.1.10-M2.1",
  "schema_version": 13,
  "archetype_catalog_version": "1.7.0",
  "myth_catalog_version": "1.2.0",
  "target_language": {
    "code": "en",
    "name": "English"
  },
  "cost_usd": 0.00412695,
  "raw_archetypes": [
    {
      "archetype_id": "father",
      "expression": "father at the garden gate gives quiet instruction about what must come inside before the rain",
      "resonance": "A paternal presence sets the boundary and orients action, turning an approaching weather change into a quiet, protected order.",
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
  "post_validation_archetypes": [
    {
      "canonical_label": "Father",
      "expression": "father at the garden gate gives quiet instruction about what must come inside before the rain",
      "resonance": "A paternal presence sets the boundary and orients action, turning an approaching weather change into a quiet, protected order.",
      "evidence": [
        "At dusk my father stands at the garden gate and quietly tells me which tools must come inside before the rain. He does not raise his voice. As I follow his calm instruction, the whole yard feels ordered and protected, and even the wind seems to fall into place around that steady authority."
      ],
      "confidence": "high",
      "archetype_id": "father",
      "archetype_catalog_version": "1.7.0",
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
  "interpretive_diagnostics": {
    "selection_notes": {
      "archetype_reasons": [
        "Father is earned because paternal authority and orientation organize the scene; the father quietly directs what must be brought inside before the rain, and the dream's order follows his guidance."
      ],
      "mythic_reason": "[]",
      "near_misses": [
        "No mythic catalog match is strongly supported; the dream is brief, cohesive, and restorative rather than sequence-driven."
      ]
    }
  }
}
```

#### m21_calm_father_en_r3

```json
{
  "fixture_id": "m21_calm_father_en",
  "category": "father_positive",
  "raw_dream": "At dusk my father stands at the garden gate and quietly tells me which tools must come inside before the rain. He does not raise his voice. As I follow his calm instruction, the whole yard feels ordered and protected, and even the wind seems to fall into place around that steady authority.",
  "ok": true,
  "latency_ms": 5687,
  "model": "gpt-5.4-mini-2026-03-17",
  "prompt_id": "dream-field-map-interpretive-v4.1.10-M2.1",
  "prompt_version": "4.1.10-M2.1",
  "schema_version": 13,
  "archetype_catalog_version": "1.7.0",
  "myth_catalog_version": "1.2.0",
  "target_language": {
    "code": "en",
    "name": "English"
  },
  "cost_usd": 0.00417195,
  "raw_archetypes": [
    {
      "archetype_id": "father",
      "expression": "The father at the garden gate gives calm instruction about what must come inside before the rain.",
      "resonance": "The father organizes the boundary and the timing, and his quiet authority turns the yard from exposure into protected order.",
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
  "post_validation_archetypes": [
    {
      "canonical_label": "Father",
      "expression": "The father at the garden gate gives calm instruction about what must come inside before the rain.",
      "resonance": "The father organizes the boundary and the timing, and his quiet authority turns the yard from exposure into protected order.",
      "evidence": [
        "At dusk my father stands at the garden gate and quietly tells me which tools must come inside before the rain. He does not raise his voice. As I follow his calm instruction, the whole yard feels ordered and protected, and even the wind seems to fall into place around that steady authority."
      ],
      "confidence": "high",
      "archetype_id": "father",
      "archetype_catalog_version": "1.7.0",
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
  "interpretive_diagnostics": {
    "selection_notes": {
      "archetype_reasons": [
        "father: the dream centers a paternal figure who sets the boundary, names what must be moved, and shapes the protected field through calm authority."
      ],
      "mythic_reason": "[]",
      "near_misses": [
        "No mythic sequence is earned: there is no quest, loss, descent, trial, or transformation beyond a brief moment of orderly guidance."
      ]
    }
  }
}
```

### Quiet Divine Child positive — runs

#### P_divine_child_a_r1

```json
{
  "fixture_id": "P_divine_child_a",
  "category": "divine_child_positive",
  "raw_dream": "During a city blackout an infant in my arms remains calmly luminous while adults panic in the streets below. When officials demand I hand the child over for safekeeping, I refuse and climb the stairwell. Sirens fade as we reach rooms above the roofline filled with daylight that had been unavailable all evening.",
  "ok": false,
  "latency_ms": 5629,
  "model": "gpt-5.4-mini-2026-03-17",
  "prompt_id": "dream-field-map-interpretive-v4.1.10-M2.1",
  "prompt_version": "4.1.10-M2.1",
  "schema_version": 13,
  "archetype_catalog_version": "1.7.0",
  "myth_catalog_version": "1.2.0",
  "target_language": {
    "code": "en",
    "name": "English"
  },
  "cost_usd": 0.0053229,
  "raw_archetypes": [],
  "validator_decisions": [],
  "post_validation_archetypes": [],
  "archetype_reject_reasons": [],
  "central_conflicts": [],
  "main_tension": null,
  "core_mode": null,
  "raw_amplifications": [],
  "post_validation_amplifications": [],
  "mythic_reject_reasons": [],
  "interpretive_diagnostics": null
}
```

#### P_divine_child_a_r2

```json
{
  "fixture_id": "P_divine_child_a",
  "category": "divine_child_positive",
  "raw_dream": "During a city blackout an infant in my arms remains calmly luminous while adults panic in the streets below. When officials demand I hand the child over for safekeeping, I refuse and climb the stairwell. Sirens fade as we reach rooms above the roofline filled with daylight that had been unavailable all evening.",
  "ok": true,
  "latency_ms": 6377,
  "model": "gpt-5.4-mini-2026-03-17",
  "prompt_id": "dream-field-map-interpretive-v4.1.10-M2.1",
  "prompt_version": "4.1.10-M2.1",
  "schema_version": 13,
  "archetype_catalog_version": "1.7.0",
  "myth_catalog_version": "1.2.0",
  "target_language": {
    "code": "en",
    "name": "English"
  },
  "cost_usd": 0.00458145,
  "raw_archetypes": [
    {
      "archetype_id": "divine_child",
      "expression": "the calmly luminous infant in your arms",
      "resonance": "The luminous infant carries a protected future that steadies the whole scene and seems to bring its own sustaining light.",
      "confidence": "high",
      "mechanism_tags": [
        "boon_or_changed_outcome",
        "revival_or_return"
      ],
      "evidence_ids": [
        "D1"
      ]
    }
  ],
  "validator_decisions": [
    {
      "archetype_id": "divine_child",
      "canonical_label": "Divine Child",
      "accepted": true,
      "rejection_codes": [],
      "rejection_reason": null,
      "mechanism_tags": [
        "boon_or_changed_outcome",
        "revival_or_return"
      ],
      "evidence_ids": [
        "D1"
      ]
    }
  ],
  "post_validation_archetypes": [
    {
      "canonical_label": "Divine Child",
      "expression": "the calmly luminous infant in your arms",
      "resonance": "The luminous infant carries a protected future that steadies the whole scene and seems to bring its own sustaining light.",
      "evidence": [
        "During a city blackout an infant in my arms remains calmly luminous while adults panic in the streets below. When officials demand I hand the child over for safekeeping, I refuse and climb the stairwell. Sirens fade as we reach rooms above the roofline filled with daylight that had been unavailable all evening."
      ],
      "confidence": "high",
      "archetype_id": "divine_child",
      "archetype_catalog_version": "1.7.0",
      "evidence_ids": [
        "D1"
      ]
    }
  ],
  "archetype_reject_reasons": [],
  "central_conflicts": [
    "handing over vs carrying upward"
  ],
  "main_tension": "handing over vs carrying upward",
  "core_mode": "Core Shift",
  "raw_amplifications": [],
  "post_validation_amplifications": [],
  "mythic_reject_reasons": [],
  "interpretive_diagnostics": {
    "selection_notes": {
      "archetype_reasons": [
        "divine_child was selected because the infant is central, unusually luminous, and structurally changes the scene by carrying a protected future through public panic.",
        "No other archetype is as precise: the dream does not stage a guide, ruler, mother, father, or hero sequence."
      ],
      "mythic_reason": "[]",
      "near_misses": [
        "mother was considered because of holding and safekeeping, but the dream centers the child's charged presence rather than maternal containment.",
        "guide_psychopomp was rejected because the ascent is self-directed and no guiding figure escorts the crossing."
      ]
    }
  }
}
```

#### P_divine_child_a_r3

```json
{
  "fixture_id": "P_divine_child_a",
  "category": "divine_child_positive",
  "raw_dream": "During a city blackout an infant in my arms remains calmly luminous while adults panic in the streets below. When officials demand I hand the child over for safekeeping, I refuse and climb the stairwell. Sirens fade as we reach rooms above the roofline filled with daylight that had been unavailable all evening.",
  "ok": true,
  "latency_ms": 6125,
  "model": "gpt-5.4-mini-2026-03-17",
  "prompt_id": "dream-field-map-interpretive-v4.1.10-M2.1",
  "prompt_version": "4.1.10-M2.1",
  "schema_version": 13,
  "archetype_catalog_version": "1.7.0",
  "myth_catalog_version": "1.2.0",
  "target_language": {
    "code": "en",
    "name": "English"
  },
  "cost_usd": 0.00460395,
  "raw_archetypes": [
    {
      "archetype_id": "divine_child",
      "expression": "the calmly luminous infant in my arms",
      "resonance": "A vulnerable yet radiant child organizes the whole scene, drawing protection upward and carrying a sense of renewed possibility through the blackout.",
      "confidence": "high",
      "mechanism_tags": [
        "bond_organizes_dream",
        "guidance_changes_action_or_outcome",
        "boon_or_changed_outcome"
      ],
      "evidence_ids": [
        "D1"
      ]
    }
  ],
  "validator_decisions": [
    {
      "archetype_id": "divine_child",
      "canonical_label": "Divine Child",
      "accepted": true,
      "rejection_codes": [],
      "rejection_reason": null,
      "mechanism_tags": [
        "bond_organizes_dream",
        "guidance_changes_action_or_outcome",
        "boon_or_changed_outcome"
      ],
      "evidence_ids": [
        "D1"
      ]
    }
  ],
  "post_validation_archetypes": [
    {
      "canonical_label": "Divine Child",
      "expression": "the calmly luminous infant in my arms",
      "resonance": "A vulnerable yet radiant child organizes the whole scene, drawing protection upward and carrying a sense of renewed possibility through the blackout.",
      "evidence": [
        "During a city blackout an infant in my arms remains calmly luminous while adults panic in the streets below. When officials demand I hand the child over for safekeeping, I refuse and climb the stairwell. Sirens fade as we reach rooms above the roofline filled with daylight that had been unavailable all evening."
      ],
      "confidence": "high",
      "archetype_id": "divine_child",
      "archetype_catalog_version": "1.7.0",
      "evidence_ids": [
        "D1"
      ]
    }
  ],
  "archetype_reject_reasons": [],
  "central_conflicts": [
    "care vs official removal"
  ],
  "main_tension": "care vs official removal",
  "core_mode": "Core Shift",
  "raw_amplifications": [],
  "post_validation_amplifications": [],
  "mythic_reject_reasons": [],
  "interpretive_diagnostics": {
    "selection_notes": {
      "archetype_reasons": [
        "divine_child was earned because the infant is central, luminous, and changes the action by organizing protection and upward movement; the child is not merely present in the background."
      ],
      "mythic_reason": "[]",
      "near_misses": [
        "Mother was rejected because the dream centers an infant and protective holding, not a maternal matrix or binding maternal field.",
        "Guide / Psychopomp was rejected because there is upward movement, but no distinct guiding figure across realms."
      ]
    }
  }
}
```

### No-tension complementarity — runs

#### F_neg_surface_depth_harmony_el_r1

```json
{
  "fixture_id": "F_neg_surface_depth_harmony_el",
  "category": "no_tension_complementarity",
  "raw_dream": "Ήμουν σε μια ξύλινη αποβάθρα πάνω από καθαρό νερό και κοίταζα ήρεμα τα φυτά στον βυθό. Από πάνω περνούσε ένα απαλό αεράκι και από κάτω κινούνταν αργά τα ψάρια. Δεν υπήρχε φόβος ούτε δίλημμα· η επιφάνεια και το βάθος έμοιαζαν να ανήκουν στην ίδια γαλήνη.",
  "ok": true,
  "latency_ms": 5300,
  "model": "gpt-5.4-mini-2026-03-17",
  "prompt_id": "dream-field-map-interpretive-v4.1.10-M2.1",
  "prompt_version": "4.1.10-M2.1",
  "schema_version": 13,
  "archetype_catalog_version": "1.7.0",
  "myth_catalog_version": "1.2.0",
  "target_language": {
    "code": "el",
    "name": "Greek"
  },
  "cost_usd": 0.00542265,
  "raw_archetypes": [],
  "validator_decisions": [],
  "post_validation_archetypes": [],
  "archetype_reject_reasons": [],
  "central_conflicts": [],
  "main_tension": null,
  "core_mode": "Core State",
  "raw_amplifications": [],
  "post_validation_amplifications": [],
  "mythic_reject_reasons": [],
  "interpretive_diagnostics": {
    "selection_notes": {
      "archetype_reasons": [
        "[]"
      ],
      "mythic_reason": "[]",
      "near_misses": [
        "Δεν επιλέχθηκε μυθικός ή αρχέτυπικός συσχετισμός, επειδή το όνειρο μένει σε ενιαία γαλήνη χωρίς μεταβατική δοκιμασία ή ρητή σύγκρουση."
      ]
    }
  }
}
```

#### F_neg_surface_depth_harmony_el_r2

```json
{
  "fixture_id": "F_neg_surface_depth_harmony_el",
  "category": "no_tension_complementarity",
  "raw_dream": "Ήμουν σε μια ξύλινη αποβάθρα πάνω από καθαρό νερό και κοίταζα ήρεμα τα φυτά στον βυθό. Από πάνω περνούσε ένα απαλό αεράκι και από κάτω κινούνταν αργά τα ψάρια. Δεν υπήρχε φόβος ούτε δίλημμα· η επιφάνεια και το βάθος έμοιαζαν να ανήκουν στην ίδια γαλήνη.",
  "ok": false,
  "latency_ms": 414,
  "model": null,
  "prompt_id": "dream-field-map-interpretive-v4.1.10-M2.1",
  "prompt_version": "4.1.10-M2.1",
  "schema_version": 13,
  "archetype_catalog_version": "1.7.0",
  "myth_catalog_version": "1.2.0",
  "target_language": {
    "code": "el",
    "name": "Greek"
  },
  "cost_usd": null,
  "raw_archetypes": [],
  "validator_decisions": [],
  "post_validation_archetypes": [],
  "archetype_reject_reasons": [],
  "central_conflicts": [],
  "main_tension": null,
  "core_mode": null,
  "raw_amplifications": [],
  "post_validation_amplifications": [],
  "mythic_reject_reasons": [],
  "interpretive_diagnostics": null
}
```

#### F_neg_surface_depth_harmony_el_r3

```json
{
  "fixture_id": "F_neg_surface_depth_harmony_el",
  "category": "no_tension_complementarity",
  "raw_dream": "Ήμουν σε μια ξύλινη αποβάθρα πάνω από καθαρό νερό και κοίταζα ήρεμα τα φυτά στον βυθό. Από πάνω περνούσε ένα απαλό αεράκι και από κάτω κινούνταν αργά τα ψάρια. Δεν υπήρχε φόβος ούτε δίλημμα· η επιφάνεια και το βάθος έμοιαζαν να ανήκουν στην ίδια γαλήνη.",
  "ok": true,
  "latency_ms": 8009,
  "model": "gpt-5.4-mini-2026-03-17",
  "prompt_id": "dream-field-map-interpretive-v4.1.10-M2.1",
  "prompt_version": "4.1.10-M2.1",
  "schema_version": 13,
  "archetype_catalog_version": "1.7.0",
  "myth_catalog_version": "1.2.0",
  "target_language": {
    "code": "el",
    "name": "Greek"
  },
  "cost_usd": 0.0044397,
  "raw_archetypes": [],
  "validator_decisions": [],
  "post_validation_archetypes": [],
  "archetype_reject_reasons": [],
  "central_conflicts": [],
  "main_tension": null,
  "core_mode": "Core State",
  "raw_amplifications": [],
  "post_validation_amplifications": [],
  "mythic_reject_reasons": [],
  "interpretive_diagnostics": {
    "selection_notes": {
      "archetype_reasons": [
        "[]"
      ],
      "mythic_reason": "[]",
      "near_misses": [
        "Καμία μορφή ορίου, δοκιμασίας ή μετακίνησης δεν έγινε αρκετά έντονη για αρχετυπική ή μυθική αντιστοίχιση."
      ]
    }
  }
}
```

### Genuine spatial-conflict positive — runs

#### F_neg_spatial_conflict_control_el_r1

```json
{
  "fixture_id": "F_neg_spatial_conflict_control_el",
  "category": "genuine_spatial_conflict",
  "raw_dream": "Στεκόμουν σε ένα στενό μπαλκόνι του τρίτου ορόφου και άκουγα το υπόγειο να με τραβά σαν μαγνήτης. Κάθε φορά που πήγαινα να μπω μέσα για να κατέβω, το πάτωμα έσπαγε κάτω από τα πόδια μου και με ανάγκαζε να μείνω έξω. Ήθελα να κατέβω, αλλά το κτίριο δεν με άφηνε.",
  "ok": true,
  "latency_ms": 6268,
  "model": "gpt-5.4-mini-2026-03-17",
  "prompt_id": "dream-field-map-interpretive-v4.1.10-M2.1",
  "prompt_version": "4.1.10-M2.1",
  "schema_version": 13,
  "archetype_catalog_version": "1.7.0",
  "myth_catalog_version": "1.2.0",
  "target_language": {
    "code": "el",
    "name": "Greek"
  },
  "cost_usd": 0.0058389,
  "raw_archetypes": [],
  "validator_decisions": [],
  "post_validation_archetypes": [],
  "archetype_reject_reasons": [],
  "central_conflicts": [
    "κάθοδος vs εμπόδιση"
  ],
  "main_tension": "κάθοδος vs εμπόδιση",
  "core_mode": "Core Tension",
  "raw_amplifications": [],
  "post_validation_amplifications": [],
  "mythic_reject_reasons": [],
  "interpretive_diagnostics": {
    "selection_notes": {
      "archetype_reasons": [
        "[]"
      ],
      "mythic_reason": "[]",
      "near_misses": [
        "Απορρίφθηκε ο οποιοσδήποτε μυθικός συσχετισμός, επειδή η σκηνή μένει σε απλό χωρικό μπλοκάρισμα χωρίς επαρκή ακολουθία μοτίβων.",
        "Απορρίφθηκε αρχέτυπο τύπου Οδηγός/Ψυχοπομπός, επειδή δεν υπάρχει πραγματική καθοδήγηση μέσα από κατώφλι.",
        "Απορρίφθηκε αρχέτυπο τύπου Ήρωας, επειδή δεν υπάρχει επιτυχής δοκιμασία, έπαθλο ή μεταβολή κατάστασης."
      ]
    }
  }
}
```

#### F_neg_spatial_conflict_control_el_r2

```json
{
  "fixture_id": "F_neg_spatial_conflict_control_el",
  "category": "genuine_spatial_conflict",
  "raw_dream": "Στεκόμουν σε ένα στενό μπαλκόνι του τρίτου ορόφου και άκουγα το υπόγειο να με τραβά σαν μαγνήτης. Κάθε φορά που πήγαινα να μπω μέσα για να κατέβω, το πάτωμα έσπαγε κάτω από τα πόδια μου και με ανάγκαζε να μείνω έξω. Ήθελα να κατέβω, αλλά το κτίριο δεν με άφηνε.",
  "ok": true,
  "latency_ms": 5591,
  "model": "gpt-5.4-mini-2026-03-17",
  "prompt_id": "dream-field-map-interpretive-v4.1.10-M2.1",
  "prompt_version": "4.1.10-M2.1",
  "schema_version": 13,
  "archetype_catalog_version": "1.7.0",
  "myth_catalog_version": "1.2.0",
  "target_language": {
    "code": "el",
    "name": "Greek"
  },
  "cost_usd": 0.0046497,
  "raw_archetypes": [],
  "validator_decisions": [],
  "post_validation_archetypes": [],
  "archetype_reject_reasons": [],
  "central_conflicts": [
    "κάθοδος vs αποκλεισμός"
  ],
  "main_tension": "κάθοδος vs αποκλεισμός",
  "core_mode": "Core Tension",
  "raw_amplifications": [],
  "post_validation_amplifications": [],
  "mythic_reject_reasons": [],
  "interpretive_diagnostics": {
    "selection_notes": {
      "archetype_reasons": [
        "[]"
      ],
      "mythic_reason": "[]",
      "near_misses": [
        "Κανένα αρχετυπικό σχήμα δεν οργανώνει επαρκώς το όνειρο πέρα από την απλή χωρική σύγκρουση.",
        "Καμία μυθική ακολουθία δεν ταιριάζει: λείπει διαδοχική δοκιμασία, πρόσωπα ρόλων ή μετασχηματιστική πορεία."
      ]
    }
  }
}
```

#### F_neg_spatial_conflict_control_el_r3

```json
{
  "fixture_id": "F_neg_spatial_conflict_control_el",
  "category": "genuine_spatial_conflict",
  "raw_dream": "Στεκόμουν σε ένα στενό μπαλκόνι του τρίτου ορόφου και άκουγα το υπόγειο να με τραβά σαν μαγνήτης. Κάθε φορά που πήγαινα να μπω μέσα για να κατέβω, το πάτωμα έσπαγε κάτω από τα πόδια μου και με ανάγκαζε να μείνω έξω. Ήθελα να κατέβω, αλλά το κτίριο δεν με άφηνε.",
  "ok": true,
  "latency_ms": 6702,
  "model": "gpt-5.4-mini-2026-03-17",
  "prompt_id": "dream-field-map-interpretive-v4.1.10-M2.1",
  "prompt_version": "4.1.10-M2.1",
  "schema_version": 13,
  "archetype_catalog_version": "1.7.0",
  "myth_catalog_version": "1.2.0",
  "target_language": {
    "code": "el",
    "name": "Greek"
  },
  "cost_usd": 0.00560145,
  "raw_archetypes": [
    {
      "archetype_id": "guide_psychopomp",
      "expression": "η έλξη προς το υπόγειο και η ματαίωση της καθόδου στο κατώφλι",
      "resonance": "Η σκηνή οργανώνεται ως τάση προς ένα κατώτερο πεδίο που ζητά πέρασμα, ενώ το ίδιο το όριο δεν επιτρέπει τη μετάβαση.",
      "confidence": "medium",
      "mechanism_tags": [
        "active_threshold_guidance",
        "crossing_between_domains"
      ],
      "evidence_ids": [
        "D1"
      ]
    }
  ],
  "validator_decisions": [
    {
      "archetype_id": "guide_psychopomp",
      "canonical_label": "Guide / Psychopomp",
      "accepted": true,
      "rejection_codes": [],
      "rejection_reason": null,
      "mechanism_tags": [
        "active_threshold_guidance",
        "crossing_between_domains"
      ],
      "evidence_ids": [
        "D1"
      ]
    }
  ],
  "post_validation_archetypes": [
    {
      "canonical_label": "Guide / Psychopomp",
      "expression": "η έλξη προς το υπόγειο και η ματαίωση της καθόδου στο κατώφλι",
      "resonance": "Η σκηνή οργανώνεται ως τάση προς ένα κατώτερο πεδίο που ζητά πέρασμα, ενώ το ίδιο το όριο δεν επιτρέπει τη μετάβαση.",
      "evidence": [
        "Στεκόμουν σε ένα στενό μπαλκόνι του τρίτου ορόφου και άκουγα το υπόγειο να με τραβά σαν μαγνήτης. Κάθε φορά που πήγαινα να μπω μέσα για να κατέβω, το πάτωμα έσπαγε κάτω από τα πόδια μου και με ανάγκαζε να μείνω έξω. Ήθελα να κατέβω, αλλά το κτίριο δεν με άφηνε."
      ],
      "confidence": "medium",
      "archetype_id": "guide_psychopomp",
      "archetype_catalog_version": "1.7.0",
      "evidence_ids": [
        "D1"
      ]
    }
  ],
  "archetype_reject_reasons": [],
  "central_conflicts": [
    "κάθοδος vs εμποδισμένο πέρασμα"
  ],
  "main_tension": "κάθοδος vs εμποδισμένο πέρασμα",
  "core_mode": "Core Tension",
  "raw_amplifications": [],
  "post_validation_amplifications": [],
  "mythic_reject_reasons": [],
  "interpretive_diagnostics": {
    "selection_notes": {
      "archetype_reasons": [
        "Επιλέχθηκε το guide_psychopomp επειδή το όνειρο δείχνει σαφή κατωφλιακή κίνηση προς άλλο πεδίο και αποτυχία διάβασης, με το υπόγειο να λειτουργεί ως προσανατολισμένη έλξη."
      ],
      "mythic_reason": "[]",
      "near_misses": [
        "Απορρίφθηκαν hero και death_rebirth: δεν υπάρχει δοκιμασία, boon ή μετασχηματιστική ολοκλήρωση.",
        "Απορρίφθηκε any mythic echo: λείπει η απαιτούμενη διαδοχική μυθική δομή και το όνειρο παραμένει σύντομο, αμιγώς χωρικό κατώφλι."
      ]
    }
  }
}
```

### Persona staged-conflict positive — runs

#### F_pos_persona_stage_suit_el_r1

```json
{
  "fixture_id": "F_pos_persona_stage_suit_el",
  "category": "persona_conflict",
  "raw_dream": "Ήμουν σε ένα μεγάλο θέατρο όπου όλοι περίμεναν να παρουσιάσω τα οικονομικά μιας εταιρείας. Πριν βγω στη σκηνή, μου φόρεσαν μια τέλεια σκούρα στολή με το όνομά μου κεντημένο στο στήθος. Μόλις στάθηκα μπροστά στο κοινό, η φωνή μου έγινε ψυχρή και επίσημη, παρότι μέσα μου ήθελα να πω ότι δεν γνώριζα τις απαντήσεις. Κάθε φορά που προσπαθούσα να μιλήσω με τη δική μου φωνή, ο γιακάς έσφιγγε και το κοινό σταματούσε να με βλέπει. Όταν επέστρεψα στα παρασκήνια, προσπάθησα να βγάλω τη στολή, αλλά τα μανίκια είχαν κολλήσει πάνω μου.",
  "ok": true,
  "latency_ms": 8304,
  "model": "gpt-5.4-mini-2026-03-17",
  "prompt_id": "dream-field-map-interpretive-v4.1.10-M2.1",
  "prompt_version": "4.1.10-M2.1",
  "schema_version": 13,
  "archetype_catalog_version": "1.7.0",
  "myth_catalog_version": "1.2.0",
  "target_language": {
    "code": "el",
    "name": "Greek"
  },
  "cost_usd": 0.00704115,
  "raw_archetypes": [
    {
      "archetype_id": "persona",
      "expression": "η τέλεια σκούρα στολή με το κεντημένο όνομα και η επίσημη φωνή μπροστά στο κοινό",
      "resonance": "Η σκηνή οργανώνεται από μια τέλεια δημόσια περσόνα που μιλά αντί για σένα, ενώ η ιδιωτική φωνή πιέζεται να μείνει πίσω από το κοινό βλέμμα.",
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
  "post_validation_archetypes": [
    {
      "canonical_label": "Persona",
      "expression": "η τέλεια σκούρα στολή με το κεντημένο όνομα και η επίσημη φωνή μπροστά στο κοινό",
      "resonance": "Η σκηνή οργανώνεται από μια τέλεια δημόσια περσόνα που μιλά αντί για σένα, ενώ η ιδιωτική φωνή πιέζεται να μείνει πίσω από το κοινό βλέμμα.",
      "evidence": [
        "Ήμουν σε ένα μεγάλο θέατρο όπου όλοι περίμεναν να παρουσιάσω τα οικονομικά μιας εταιρείας.",
        "Μόλις στάθηκα μπροστά στο κοινό, η φωνή μου έγινε ψυχρή και επίσημη, παρότι μέσα μου ήθελα να πω ότι δεν γνώριζα τις απαντήσεις."
      ],
      "confidence": "high",
      "archetype_id": "persona",
      "archetype_catalog_version": "1.7.0",
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
  "interpretive_diagnostics": {
    "selection_notes": {
      "archetype_reasons": [
        "Το όνειρο οργανώνεται από δημόσιο ρόλο που φοριέται πριν από την εμφάνιση, από την ψυχρή επίσημη φωνή και από την πίεση ανάμεσα σε αυτό που θέλω να πω και σε αυτό που επιτρέπεται να ακουστεί."
      ],
      "mythic_reason": "[]",
      "near_misses": [
        "Δεν επιλέχθηκε άλλος αρχέτυπος, γιατί δεν υπάρχει αρκετή δομή για ήρωα, οδηγό, διπλό ή σκιά πέρα από τη σαφή περσόνα.",
        "Δεν επιλέχθηκε μυθικό μοτίβο, γιατί λείπει η συγκεκριμένη αφηγηματική ακολουθία που απαιτεί ο κατάλογος."
      ]
    }
  }
}
```

#### F_pos_persona_stage_suit_el_r2

```json
{
  "fixture_id": "F_pos_persona_stage_suit_el",
  "category": "persona_conflict",
  "raw_dream": "Ήμουν σε ένα μεγάλο θέατρο όπου όλοι περίμεναν να παρουσιάσω τα οικονομικά μιας εταιρείας. Πριν βγω στη σκηνή, μου φόρεσαν μια τέλεια σκούρα στολή με το όνομά μου κεντημένο στο στήθος. Μόλις στάθηκα μπροστά στο κοινό, η φωνή μου έγινε ψυχρή και επίσημη, παρότι μέσα μου ήθελα να πω ότι δεν γνώριζα τις απαντήσεις. Κάθε φορά που προσπαθούσα να μιλήσω με τη δική μου φωνή, ο γιακάς έσφιγγε και το κοινό σταματούσε να με βλέπει. Όταν επέστρεψα στα παρασκήνια, προσπάθησα να βγάλω τη στολή, αλλά τα μανίκια είχαν κολλήσει πάνω μου.",
  "ok": true,
  "latency_ms": 7615,
  "model": "gpt-5.4-mini-2026-03-17",
  "prompt_id": "dream-field-map-interpretive-v4.1.10-M2.1",
  "prompt_version": "4.1.10-M2.1",
  "schema_version": 13,
  "archetype_catalog_version": "1.7.0",
  "myth_catalog_version": "1.2.0",
  "target_language": {
    "code": "el",
    "name": "Greek"
  },
  "cost_usd": 0.00618945,
  "raw_archetypes": [
    {
      "archetype_id": "persona",
      "expression": "η τέλεια σκούρα στολή με το όνομά μου και η επίσημη φωνή μπροστά στο κοινό",
      "resonance": "Η σκηνή οργανώνεται από μια άψογη δημόσια εμφάνιση που επιτρέπει ομιλία μόνο όσο η ιδιωτική φωνή μένει κρυμμένη.",
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
  "post_validation_archetypes": [
    {
      "canonical_label": "Persona",
      "expression": "η τέλεια σκούρα στολή με το όνομά μου και η επίσημη φωνή μπροστά στο κοινό",
      "resonance": "Η σκηνή οργανώνεται από μια άψογη δημόσια εμφάνιση που επιτρέπει ομιλία μόνο όσο η ιδιωτική φωνή μένει κρυμμένη.",
      "evidence": [
        "Ήμουν σε ένα μεγάλο θέατρο όπου όλοι περίμεναν να παρουσιάσω τα οικονομικά μιας εταιρείας.",
        "Μόλις στάθηκα μπροστά στο κοινό, η φωνή μου έγινε ψυχρή και επίσημη, παρότι μέσα μου ήθελα να πω ότι δεν γνώριζα τις απαντήσεις."
      ],
      "confidence": "high",
      "archetype_id": "persona",
      "archetype_catalog_version": "1.7.0",
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
    "δική μου φωνή vs επίσημη εμφάνιση"
  ],
  "main_tension": "δική μου φωνή vs επίσημη εμφάνιση",
  "core_mode": "Core Tension",
  "raw_amplifications": [],
  "post_validation_amplifications": [],
  "mythic_reject_reasons": [],
  "interpretive_diagnostics": {
    "selection_notes": {
      "archetype_reasons": [
        "Το persona επιλέχθηκε γιατί το όνομα κεντημένο στη στολή, η επίσημη παρουσία στη σκηνή και η μετατόπιση της φωνής σε ψυχρή/επίσημη μορφή δείχνουν καθαρά δημόσιο προσωπείο που δεσμεύει την ιδιωτική έκφραση."
      ],
      "mythic_reason": "[]",
      "near_misses": [
        "double: δεν υπάρχει ανταγωνιστική διπλή ταυτότητα ή υποκατάσταση",
        "ruler: υπάρχει ακροατήριο, αλλά όχι ενεργή κυριαρχία ή προσωπική εξουσία",
        "tower_babel: λείπει συλλογικό οικοδόμημα ή διάσπαση κοινής γλώσσας",
        "cinderella: λείπει μεταμόρφωση αναγνώρισης μέσω συμβόλου ή κοινωνική δοκιμασία ταυτότητας"
      ]
    }
  }
}
```

#### F_pos_persona_stage_suit_el_r3

```json
{
  "fixture_id": "F_pos_persona_stage_suit_el",
  "category": "persona_conflict",
  "raw_dream": "Ήμουν σε ένα μεγάλο θέατρο όπου όλοι περίμεναν να παρουσιάσω τα οικονομικά μιας εταιρείας. Πριν βγω στη σκηνή, μου φόρεσαν μια τέλεια σκούρα στολή με το όνομά μου κεντημένο στο στήθος. Μόλις στάθηκα μπροστά στο κοινό, η φωνή μου έγινε ψυχρή και επίσημη, παρότι μέσα μου ήθελα να πω ότι δεν γνώριζα τις απαντήσεις. Κάθε φορά που προσπαθούσα να μιλήσω με τη δική μου φωνή, ο γιακάς έσφιγγε και το κοινό σταματούσε να με βλέπει. Όταν επέστρεψα στα παρασκήνια, προσπάθησα να βγάλω τη στολή, αλλά τα μανίκια είχαν κολλήσει πάνω μου.",
  "ok": true,
  "latency_ms": 10191,
  "model": "gpt-5.4-mini-2026-03-17",
  "prompt_id": "dream-field-map-interpretive-v4.1.10-M2.1",
  "prompt_version": "4.1.10-M2.1",
  "schema_version": 13,
  "archetype_catalog_version": "1.7.0",
  "myth_catalog_version": "1.2.0",
  "target_language": {
    "code": "el",
    "name": "Greek"
  },
  "cost_usd": 0.00635745,
  "raw_archetypes": [
    {
      "archetype_id": "persona",
      "expression": "η τέλεια στολή με το κεντημένο όνομα και η επίσημη φωνή μπροστά στο κοινό",
      "resonance": "Η δημόσια εικόνα οργανώνει όλη τη σκηνή, ενώ η προσωπική φωνή πιέζεται να μείνει κρυφή και το σώμα αντιστέκεται στην αποκαρδίωση του ρόλου.",
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
  "post_validation_archetypes": [
    {
      "canonical_label": "Persona",
      "expression": "η τέλεια στολή με το κεντημένο όνομα και η επίσημη φωνή μπροστά στο κοινό",
      "resonance": "Η δημόσια εικόνα οργανώνει όλη τη σκηνή, ενώ η προσωπική φωνή πιέζεται να μείνει κρυφή και το σώμα αντιστέκεται στην αποκαρδίωση του ρόλου.",
      "evidence": [
        "Ήμουν σε ένα μεγάλο θέατρο όπου όλοι περίμεναν να παρουσιάσω τα οικονομικά μιας εταιρείας.",
        "Μόλις στάθηκα μπροστά στο κοινό, η φωνή μου έγινε ψυχρή και επίσημη, παρότι μέσα μου ήθελα να πω ότι δεν γνώριζα τις απαντήσεις."
      ],
      "confidence": "high",
      "archetype_id": "persona",
      "archetype_catalog_version": "1.7.0",
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
  "interpretive_diagnostics": {
    "selection_notes": {
      "archetype_reasons": [
        "persona: το όνομα ραμμένο στο στήθος, η τέλεια στολή, η επίσημη φωνή και η δημόσια απαίτηση οργανώνουν τον ρόλο ως μάσκα που συγκρούεται με το ιδιωτικό εγώ."
      ],
      "mythic_reason": "[]",
      "near_misses": [
        "double: δεν υπάρχει ανταγωνιστής ή αντικαταστάτης του ονειρευόμενου.",
        "ruler: υπάρχει εταιρική παρουσία, αλλά όχι ενσώματη κυριαρχία που να οργανώνει το πεδίο.",
        "greek.odysseus_return: λείπουν μεταμφίεση, δοκιμές πίστης και ανάκτηση οίκου."
      ]
    }
  }
}
```

### Ordinary-kitchen no-conflict — runs

#### F_neg_kitchen_glass_el_r1

```json
{
  "fixture_id": "F_neg_kitchen_glass_el",
  "category": "ordinary_kitchen",
  "raw_dream": "Ήμουν στην κουζίνα μου και ήθελα να πιω νερό. Άνοιξα το ντουλάπι, αλλά όλα τα ποτήρια ήταν άπλυτα. Πήρα το λιγότερο βρώμικο, το έπλυνα με σαπούνι, το ξέβγαλα δύο φορές και το γέμισα από τη βρύση. Η γάτα πέρασε από τον πάγκο και έριξε ένα κουταλάκι στο πάτωμα. Το σήκωσα, ήπια το νερό και ξύπνησα ελαφρώς εκνευρισμένος επειδή θυμήθηκα ότι είχα αφήσει πιάτα στον νεροχύτη.",
  "ok": true,
  "latency_ms": 5980,
  "model": "gpt-5.4-mini-2026-03-17",
  "prompt_id": "dream-field-map-interpretive-v4.1.10-M2.1",
  "prompt_version": "4.1.10-M2.1",
  "schema_version": 13,
  "archetype_catalog_version": "1.7.0",
  "myth_catalog_version": "1.2.0",
  "target_language": {
    "code": "el",
    "name": "Greek"
  },
  "cost_usd": 0.0057549,
  "raw_archetypes": [],
  "validator_decisions": [],
  "post_validation_archetypes": [],
  "archetype_reject_reasons": [],
  "central_conflicts": [
    "καθαρό νερό vs άπλυτα πιάτα"
  ],
  "main_tension": "καθαρό νερό vs άπλυτα πιάτα",
  "core_mode": "Core Tension",
  "raw_amplifications": [],
  "post_validation_amplifications": [],
  "mythic_reject_reasons": [],
  "interpretive_diagnostics": {
    "selection_notes": {
      "archetype_reasons": [
        "[]"
      ],
      "mythic_reason": "[]",
      "near_misses": [
        "Απορρίφθηκε ο μύθος της δοκιμασίας/κάθαρσης, επειδή δεν υπάρχει κεντρική μυθική ακολουθία ούτε μεταμορφωτική έκβαση.",
        "Απορρίφθηκε αρχετυπική ανάγνωση, επειδή η σκηνή μένει σε οικιακή ρύθμιση χωρίς σταθερή λειτουργία μορφής ή σχέσης πέρα από τη μικρή ενόχληση."
      ]
    }
  }
}
```

#### F_neg_kitchen_glass_el_r2

```json
{
  "fixture_id": "F_neg_kitchen_glass_el",
  "category": "ordinary_kitchen",
  "raw_dream": "Ήμουν στην κουζίνα μου και ήθελα να πιω νερό. Άνοιξα το ντουλάπι, αλλά όλα τα ποτήρια ήταν άπλυτα. Πήρα το λιγότερο βρώμικο, το έπλυνα με σαπούνι, το ξέβγαλα δύο φορές και το γέμισα από τη βρύση. Η γάτα πέρασε από τον πάγκο και έριξε ένα κουταλάκι στο πάτωμα. Το σήκωσα, ήπια το νερό και ξύπνησα ελαφρώς εκνευρισμένος επειδή θυμήθηκα ότι είχα αφήσει πιάτα στον νεροχύτη.",
  "ok": true,
  "latency_ms": 7026,
  "model": "gpt-5.4-mini-2026-03-17",
  "prompt_id": "dream-field-map-interpretive-v4.1.10-M2.1",
  "prompt_version": "4.1.10-M2.1",
  "schema_version": 13,
  "archetype_catalog_version": "1.7.0",
  "myth_catalog_version": "1.2.0",
  "target_language": {
    "code": "el",
    "name": "Greek"
  },
  "cost_usd": 0.0043497,
  "raw_archetypes": [],
  "validator_decisions": [],
  "post_validation_archetypes": [],
  "archetype_reject_reasons": [],
  "central_conflicts": [],
  "main_tension": null,
  "core_mode": "Core Restoration",
  "raw_amplifications": [],
  "post_validation_amplifications": [],
  "mythic_reject_reasons": [],
  "interpretive_diagnostics": {
    "selection_notes": {
      "archetype_reasons": [
        "[]"
      ],
      "mythic_reason": "[]",
      "near_misses": [
        "Καμία μυθική ακολουθία ή αρχέτυπο δεν οργανώνει τη σκηνή πέρα από την απλή οικιακή αποκατάσταση."
      ]
    }
  }
}
```

#### F_neg_kitchen_glass_el_r3

```json
{
  "fixture_id": "F_neg_kitchen_glass_el",
  "category": "ordinary_kitchen",
  "raw_dream": "Ήμουν στην κουζίνα μου και ήθελα να πιω νερό. Άνοιξα το ντουλάπι, αλλά όλα τα ποτήρια ήταν άπλυτα. Πήρα το λιγότερο βρώμικο, το έπλυνα με σαπούνι, το ξέβγαλα δύο φορές και το γέμισα από τη βρύση. Η γάτα πέρασε από τον πάγκο και έριξε ένα κουταλάκι στο πάτωμα. Το σήκωσα, ήπια το νερό και ξύπνησα ελαφρώς εκνευρισμένος επειδή θυμήθηκα ότι είχα αφήσει πιάτα στον νεροχύτη.",
  "ok": true,
  "latency_ms": 5695,
  "model": "gpt-5.4-mini-2026-03-17",
  "prompt_id": "dream-field-map-interpretive-v4.1.10-M2.1",
  "prompt_version": "4.1.10-M2.1",
  "schema_version": 13,
  "archetype_catalog_version": "1.7.0",
  "myth_catalog_version": "1.2.0",
  "target_language": {
    "code": "el",
    "name": "Greek"
  },
  "cost_usd": 0.00450495,
  "raw_archetypes": [],
  "validator_decisions": [],
  "post_validation_archetypes": [],
  "archetype_reject_reasons": [],
  "central_conflicts": [
    "άμεση ανάγκη vs καθαρή προετοιμασία"
  ],
  "main_tension": "άμεση ανάγκη vs καθαρή προετοιμασία",
  "core_mode": "Core Tension",
  "raw_amplifications": [],
  "post_validation_amplifications": [],
  "mythic_reject_reasons": [],
  "interpretive_diagnostics": {
    "selection_notes": {
      "archetype_reasons": [
        "[]"
      ],
      "mythic_reason": "[]",
      "near_misses": [
        "Δεν επιλέχθηκε μυθικό μοτίβο, επειδή η σκηνή μένει οικιακή και δεν οργανώνεται από σαφή ακολουθία καθόδου, δοκιμής ή μεταμόρφωσης."
      ]
    }
  }
}
```

## Central conflicts / main_tension table

| Run | Fixture | central_conflicts | main_tension | core_mode |
|---|---|---|---|---|
| `sea_mattress_el_r1` | `sea_mattress_el` | `[]` | `null` | `Core State` |
| `sea_mattress_el_r2` | `sea_mattress_el` | `[]` | `null` | `Core State` |
| `sea_mattress_el_r3` | `sea_mattress_el` | `[]` | `null` | `Core State` |
| `sea_mattress_el_r4` | `sea_mattress_el` | `[]` | `null` | `Core State` |
| `sea_mattress_el_r5` | `sea_mattress_el` | `[]` | `null` | `Core State` |
| `F_pos_lover_shared_depth_en_r1` | `F_pos_lover_shared_depth_en` | `[]` | `null` | `Core State` |
| `F_pos_lover_shared_depth_en_r2` | `F_pos_lover_shared_depth_en` | `[]` | `null` | `Core State` |
| `F_pos_lover_shared_depth_en_r3` | `F_pos_lover_shared_depth_en` | `[]` | `null` | `Core State` |
| `F_pos_lover_bench_rain_en_r1` | `F_pos_lover_bench_rain_en` | `["closeness vs departure"]` | `closeness vs departure` | `Core Tension` |
| `F_pos_lover_bench_rain_en_r2` | `F_pos_lover_bench_rain_en` | `["closeness vs departure"]` | `closeness vs departure` | `Core Shift` |
| `F_pos_lover_bench_rain_en_r3` | `F_pos_lover_bench_rain_en` | `["contact vs departure"]` | `contact vs departure` | `Core Tension` |
| `F_neg_partner_logistics_en_r1` | `F_neg_partner_logistics_en` | `[]` | `null` | `Core State` |
| `F_neg_partner_logistics_en_r2` | `F_neg_partner_logistics_en` | `[]` | `null` | `Core State` |
| `F_neg_partner_logistics_en_r3` | `F_neg_partner_logistics_en` | `[]` | `null` | `null` |
| `F_neg_warm_friends_en_r1` | `F_neg_warm_friends_en` | `[]` | `null` | `Core State` |
| `F_neg_warm_friends_en_r2` | `F_neg_warm_friends_en` | `[]` | `null` | `Core State` |
| `F_neg_warm_friends_en_r3` | `F_neg_warm_friends_en` | `[]` | `null` | `Core State` |
| `F_neg_romance_cue_only_en_r1` | `F_neg_romance_cue_only_en` | `["recognition vs finding my place"]` | `recognition vs finding my place` | `Core Tension` |
| `F_neg_romance_cue_only_en_r2` | `F_neg_romance_cue_only_en` | `["arrival vs not finding your place"]` | `arrival vs not finding your place` | `Core Tension` |
| `F_neg_romance_cue_only_en_r3` | `F_neg_romance_cue_only_en` | `["glimpse of closeness vs finding your place"]` | `glimpse of closeness vs finding your place` | `Core Tension` |
| `F_pos_mother_kitchen_en_r1` | `F_pos_mother_kitchen_en` | `["support vs immediate cold"]` | `support vs immediate cold` | `Core Restoration` |
| `F_pos_mother_kitchen_en_r2` | `F_pos_mother_kitchen_en` | `["protection vs cold"]` | `protection vs cold` | `Core Restoration` |
| `F_pos_mother_kitchen_en_r3` | `F_pos_mother_kitchen_en` | `["contact vs coldness"]` | `contact vs coldness` | `Core Restoration` |
| `m21_calm_father_en_r1` | `m21_calm_father_en` | `[]` | `null` | `Core Restoration` |
| `m21_calm_father_en_r2` | `m21_calm_father_en` | `[]` | `null` | `Core Restoration` |
| `m21_calm_father_en_r3` | `m21_calm_father_en` | `[]` | `null` | `Core Restoration` |
| `P_divine_child_a_r1` | `P_divine_child_a` | `[]` | `null` | `null` |
| `P_divine_child_a_r2` | `P_divine_child_a` | `["handing over vs carrying upward"]` | `handing over vs carrying upward` | `Core Shift` |
| `P_divine_child_a_r3` | `P_divine_child_a` | `["care vs official removal"]` | `care vs official removal` | `Core Shift` |
| `F_neg_surface_depth_harmony_el_r1` | `F_neg_surface_depth_harmony_el` | `[]` | `null` | `Core State` |
| `F_neg_surface_depth_harmony_el_r2` | `F_neg_surface_depth_harmony_el` | `[]` | `null` | `null` |
| `F_neg_surface_depth_harmony_el_r3` | `F_neg_surface_depth_harmony_el` | `[]` | `null` | `Core State` |
| `F_neg_spatial_conflict_control_el_r1` | `F_neg_spatial_conflict_control_el` | `["κάθοδος vs εμπόδιση"]` | `κάθοδος vs εμπόδιση` | `Core Tension` |
| `F_neg_spatial_conflict_control_el_r2` | `F_neg_spatial_conflict_control_el` | `["κάθοδος vs αποκλεισμός"]` | `κάθοδος vs αποκλεισμός` | `Core Tension` |
| `F_neg_spatial_conflict_control_el_r3` | `F_neg_spatial_conflict_control_el` | `["κάθοδος vs εμποδισμένο πέρασμα"]` | `κάθοδος vs εμποδισμένο πέρασμα` | `Core Tension` |
| `F_pos_persona_stage_suit_el_r1` | `F_pos_persona_stage_suit_el` | `["δική μου φωνή vs επίσημος ρόλος"]` | `δική μου φωνή vs επίσημος ρόλος` | `Core Tension` |
| `F_pos_persona_stage_suit_el_r2` | `F_pos_persona_stage_suit_el` | `["δική μου φωνή vs επίσημη εμφάνιση"]` | `δική μου φωνή vs επίσημη εμφάνιση` | `Core Tension` |
| `F_pos_persona_stage_suit_el_r3` | `F_pos_persona_stage_suit_el` | `["δημόσιος ρόλος vs δική μου φωνή"]` | `δημόσιος ρόλος vs δική μου φωνή` | `Core Tension` |
| `F_neg_kitchen_glass_el_r1` | `F_neg_kitchen_glass_el` | `["καθαρό νερό vs άπλυτα πιάτα"]` | `καθαρό νερό vs άπλυτα πιάτα` | `Core Tension` |
| `F_neg_kitchen_glass_el_r2` | `F_neg_kitchen_glass_el` | `[]` | `null` | `Core Restoration` |
| `F_neg_kitchen_glass_el_r3` | `F_neg_kitchen_glass_el` | `["άμεση ανάγκη vs καθαρή προετοιμασία"]` | `άμεση ανάγκη vs καθαρή προετοιμασία` | `Core Tension` |

## Cost summary

```json
{
  "total_runs": 41,
  "total_cost_usd": 0.20190734999999999,
  "average_cost_usd": 0.0049245695121951216
}
```

## Final recommendation

```text
decision_branch: D
recommendation: revise global calibration
```
