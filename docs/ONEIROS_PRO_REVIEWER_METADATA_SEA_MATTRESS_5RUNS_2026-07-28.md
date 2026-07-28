# Oneiros Pro Reviewer Packet

## Sea-mattress dream

Date: `2026-07-28`  
Scope: live metadata extraction reviewer packet for the same dream run `5` times with `concurrency = 5`

## Exact dream

```text
Είδα ένα όνειρο. Ήμουν ξαπλωμένη σε ένα θαλάσσιο στρώμα, σε μια πολύ γαλήνια θάλασσα και πάνω μου ήταν ξαπλωμένος ο φίλος μου και κοιτούσαμε το βυθό και εξερευνούσαμε όλο το βυθό. Ήταν πολύ ήρεμα, γαλήνια, όμορφα, πάντα πολύ ήρεμα.
```

## Frozen runtime line used

```text
prompt_id: dream-field-map-interpretive-v4.1.10-M2
prompt_version: 4.1.10-M2
schema_version: 13
model: gpt-5.4-mini-2026-03-17
temperature: 0
token_limit: 4200
debugInterpretiveEchoes: false
finalInterpretation: null
```

## Method

```text
- live proxy calls
- fresh cache-busted runs
- same raw dream text on every run
- direct dream_extraction task
- Promise.all concurrency: 5
- one result packet per run
- post-validation review included
```

Artifacts were generated under:

```text
tmp/adhoc-archetype-five-runs-concurrency5-2026-07-28T12-51-23-328Z/
```

This document is the self-contained reviewer file so the reviewer does not need the artifact directory.

## Console log summary

```text
sea_mattress_r4 latency 4858 raw_archetypes [] post_validation_archetypes [] rejects []
sea_mattress_r2 latency 4880 raw_archetypes [] post_validation_archetypes [] rejects []
sea_mattress_r5 latency 5021 raw_archetypes [] post_validation_archetypes [] rejects []
sea_mattress_r3 latency 5566 raw_archetypes [] post_validation_archetypes [] rejects []
sea_mattress_r1 latency 5617 raw_archetypes [] post_validation_archetypes [] rejects []
```

## Reviewer verdict

```text
- All 5 concurrent runs returned archetypes = [] at raw model output.
- All 5 concurrent runs remained archetypes = [] after validation.
- All 5 concurrent runs returned amplifications = [] at raw model output.
- All 5 concurrent runs remained amplifications = [] after validation.
- No archetype reject reasons fired.
- No mythic reject reasons fired.
- The model consistently read the dream as calm, relational, image-led, and integrating.
- The only variability was in display_distillation wording and whether a light image-near central_conflicts line was emitted.
```

## Decision log for this 5-run batch

```text
Archetypal decision:
- production result for this concurrent packet = no archetype committed

Mythic decision:
- production result for this concurrent packet = no mythic parallel committed

Interpretive reading:
- accepted stable core = calm shared intimacy + safe contemplation of depth
- not accepted as stable archetype evidence in this batch

Operational decision:
- treat this packet as a no-archetype / no-myth outcome
- do not claim Lover stability from this concurrent run set
```

## Batch overview

| Run | Latency ms | Cost USD | Central conflicts | Raw archetypes | Post-validation archetypes | Raw myths | Post-validation myths |
|---|---:|---:|---|---|---|---|---|
| `r1` | `5617` | `0.0037716` | `[]` | `[]` | `[]` | `[]` | `[]` |
| `r2` | `4880` | `0.0037236` | `["επιφάνεια vs βάθος"]` | `[]` | `[]` | `[]` | `[]` |
| `r3` | `5566` | `0.0038196` | `["επιφάνεια vs βάθος"]` | `[]` | `[]` | `[]` | `[]` |
| `r4` | `4858` | `0.00353385` | `[]` | `[]` | `[]` | `[]` | `[]` |
| `r5` | `5021` | `0.00364785` | `[]` | `[]` | `[]` | `[]` | `[]` |

## Exact run packets

### Run `sea_mattress_r1`

Decision:

```text
archetypes: none
myths: none
rejects: none
schema_ok: true
```

Metadata:

```json
{
  "run_id": "sea_mattress_r1",
  "latency_ms": 5617,
  "prompt_id": "dream-field-map-interpretive-v4.1.10-M2",
  "prompt_version": "4.1.10-M2",
  "schema_version": 13,
  "model": "gpt-5.4-mini-2026-03-17",
  "cost_usd": 0.0037716,
  "usage": {
    "prompt_tokens": 16322,
    "completion_tokens": 537,
    "total_tokens": 16859,
    "cached_prompt_tokens": 16128
  },
  "central_conflicts": [],
  "symbols": [
    "θαλάσσιο στρώμα",
    "θάλασσα",
    "φίλος",
    "βυθός"
  ],
  "landscapes": [
    "θάλασσα",
    "βυθός"
  ],
  "affects": [
    "γαλήνη",
    "ηρεμία",
    "ομορφιά"
  ],
  "motifs": [
    "ξαπλωμένη σε θαλάσσιο στρώμα",
    "εξερεύνηση του βυθού",
    "κοινό βλέμμα προς τα κάτω"
  ],
  "relational_dynamics": [
    "συν-παρουσία με τρυφερή εγγύτητα"
  ],
  "core_mode": "Core State",
  "display_distillation": {
    "essence_title": "Ήρεμη κατάδυση μαζί",
    "essence_line": "Ξαπλωμένη σε ένα θαλάσσιο στρώμα με τον φίλο σου, κοιτάζετε και εξερευνάτε τον βυθό μέσα σε βαθιά γαλήνη.",
    "dominant_lens": "image",
    "main_tension": "εγγύτητα vs βάθος",
    "dream_movement": "integrating",
    "movement_line": "Μένει μέσα στην ηρεμία ενώ το βλέμμα κατεβαίνει μαζί προς τον βυθό."
  },
  "symbol_stances": [
    {
      "symbol": "θαλάσσιο στρώμα",
      "stance": "στηρικτικό, επιπλέον"
    },
    {
      "symbol": "θάλασσα",
      "stance": "απόλυτα γαλήνια"
    },
    {
      "symbol": "φίλος",
      "stance": "κοντινός, συν-παρών"
    },
    {
      "symbol": "βυθός",
      "stance": "ήρεμα εξερευνήσιμος"
    }
  ],
  "raw_archetypes": [],
  "post_validation_archetypes": [],
  "raw_amplifications": [],
  "post_validation_amplifications": [],
  "archetype_reject_reasons": [],
  "mythic_reject_reasons": []
}
```

### Run `sea_mattress_r2`

Decision:

```text
archetypes: none
myths: none
rejects: none
schema_ok: true
```

Metadata:

```json
{
  "run_id": "sea_mattress_r2",
  "latency_ms": 4880,
  "prompt_id": "dream-field-map-interpretive-v4.1.10-M2",
  "prompt_version": "4.1.10-M2",
  "schema_version": 13,
  "model": "gpt-5.4-mini-2026-03-17",
  "cost_usd": 0.0037236,
  "usage": {
    "prompt_tokens": 16318,
    "completion_tokens": 527,
    "total_tokens": 16845,
    "cached_prompt_tokens": 16128
  },
  "central_conflicts": [
    "επιφάνεια vs βάθος"
  ],
  "symbols": [
    "θαλάσσιο στρώμα",
    "θάλασσα",
    "φίλος",
    "βυθός"
  ],
  "landscapes": [
    "θάλασσα",
    "βυθός"
  ],
  "affects": [
    "γαλήνη",
    "ηρεμία",
    "ομορφιά"
  ],
  "motifs": [
    "ξαπλωμένη εξερεύνηση βυθού",
    "κοινή παρατήρηση του βυθού",
    "επιπλέουσα εγγύτητα"
  ],
  "relational_dynamics": [
    "τρυφερή συνύπαρξη",
    "κοινή εξερεύνηση",
    "στενή σωματική εγγύτητα"
  ],
  "core_mode": "Core State",
  "display_distillation": {
    "essence_title": "Ήρεμη εξερεύνηση στον βυθό",
    "essence_line": "Ξαπλωμένη σε θαλάσσιο στρώμα με τον φίλο μου, κοιτάζαμε μαζί τον βυθό μέσα σε μια πολύ γαλήνια θάλασσα.",
    "dominant_lens": "image",
    "main_tension": "επιφάνεια vs βάθος",
    "dream_movement": "integrating",
    "movement_line": "Η κίνηση μένει ήρεμη και κοινή, σαν να εξερευνάται ο βυθός χωρίς διατάραξη."
  },
  "symbol_stances": [
    {
      "symbol": "θαλάσσιο στρώμα",
      "stance": "σταθερό, επιπλέον στήριγμα"
    },
    {
      "symbol": "θάλασσα",
      "stance": "γαλήνια, προστατευτική"
    },
    {
      "symbol": "φίλος",
      "stance": "κοντά, ξαπλωμένος από πάνω μου"
    },
    {
      "symbol": "βυθός",
      "stance": "ήσυχα εξερευνήσιμος"
    }
  ],
  "raw_archetypes": [],
  "post_validation_archetypes": [],
  "raw_amplifications": [],
  "post_validation_amplifications": [],
  "archetype_reject_reasons": [],
  "mythic_reject_reasons": []
}
```

### Run `sea_mattress_r3`

Decision:

```text
archetypes: none
myths: none
rejects: none
schema_ok: true
```

Metadata:

```json
{
  "run_id": "sea_mattress_r3",
  "latency_ms": 5566,
  "prompt_id": "dream-field-map-interpretive-v4.1.10-M2",
  "prompt_version": "4.1.10-M2",
  "schema_version": 13,
  "model": "gpt-5.4-mini-2026-03-17",
  "cost_usd": 0.0038196,
  "usage": {
    "prompt_tokens": 16320,
    "completion_tokens": 548,
    "total_tokens": 16868,
    "cached_prompt_tokens": 16128
  },
  "central_conflicts": [
    "επιφάνεια vs βάθος"
  ],
  "symbols": [
    "θαλάσσιο στρώμα",
    "θάλασσα",
    "φίλος",
    "βυθός"
  ],
  "landscapes": [
    "θάλασσα",
    "βυθός"
  ],
  "affects": [
    "γαλήνη",
    "ηρεμία",
    "ομορφιά"
  ],
  "motifs": [
    "ξάπλωμα πάνω στο νερό",
    "κοινή εξερεύνηση του βυθού"
  ],
  "relational_dynamics": [
    "ήρεμη συνύπαρξη",
    "κοινή εξερεύνηση"
  ],
  "core_mode": "Core State",
  "display_distillation": {
    "essence_title": "Γαλήνη πάνω στο βάθος",
    "essence_line": "Ξαπλωμένη σε θαλάσσιο στρώμα με τον φίλο σου, κοιτούσες τον βυθό μέσα σε μια ήρεμη, όμορφη θάλασσα.",
    "dominant_lens": "image",
    "main_tension": "επιφάνεια vs βάθος",
    "dream_movement": "integrating",
    "movement_line": "Μένεις ακίνητη στην επιφάνεια ενώ η προσοχή σας κατεβαίνει απαλά στο βάθος."
  },
  "symbol_stances": [
    {
      "symbol": "θαλάσσιο στρώμα",
      "stance": "ήρεμη, υποστηρικτική βάση"
    },
    {
      "symbol": "θάλασσα",
      "stance": "γαλανή και καθησυχαστική"
    },
    {
      "symbol": "φίλος",
      "stance": "στενή, ήσυχη εγγύτητα"
    },
    {
      "symbol": "βυθός",
      "stance": "ανοιχτός προς εξερεύνηση"
    }
  ],
  "raw_archetypes": [],
  "post_validation_archetypes": [],
  "raw_amplifications": [],
  "post_validation_amplifications": [],
  "archetype_reject_reasons": [],
  "mythic_reject_reasons": []
}
```

### Run `sea_mattress_r4`

Decision:

```text
archetypes: none
myths: none
rejects: none
schema_ok: true
```

Metadata:

```json
{
  "run_id": "sea_mattress_r4",
  "latency_ms": 4858,
  "prompt_id": "dream-field-map-interpretive-v4.1.10-M2",
  "prompt_version": "4.1.10-M2",
  "schema_version": 13,
  "model": "gpt-5.4-mini-2026-03-17",
  "cost_usd": 0.00353385,
  "usage": {
    "prompt_tokens": 16323,
    "completion_tokens": 484,
    "total_tokens": 16807,
    "cached_prompt_tokens": 16128
  },
  "central_conflicts": [],
  "symbols": [
    "θαλάσσιο στρώμα",
    "φίλος",
    "θάλασσα",
    "βυθός"
  ],
  "landscapes": [
    "θάλασσα",
    "βυθός"
  ],
  "affects": [
    "γαλήνη",
    "ηρεμία",
    "ομορφιά"
  ],
  "motifs": [
    "ξαπλωμένη πλεύση",
    "κοινή εξέταση του βυθού",
    "παραμονή σε ήρεμη θάλασσα"
  ],
  "relational_dynamics": [
    "κοινή εξερεύνηση",
    "ήρεμη εγγύτητα"
  ],
  "core_mode": "Core State",
  "display_distillation": {
    "essence_title": "Ήρεμη κατάδυση μαζί",
    "essence_line": "Ξαπλώνεις σε θαλάσσιο στρώμα με τον φίλο σου, κοιτάζοντας μαζί τον βυθό μέσα σε μια πολύ γαλήνια θάλασσα.",
    "dominant_lens": "image",
    "main_tension": "παράδοση vs εξερεύνηση",
    "dream_movement": "integrating",
    "movement_line": "Η κίνηση μένει ήρεμη και κοινή, σαν να εξερευνάτε χωρίς να απομακρύνεστε."
  },
  "symbol_stances": [
    {
      "symbol": "θαλάσσιο στρώμα",
      "stance": "σταθερό και υποστηρικτικό"
    },
    {
      "symbol": "φίλος",
      "stance": "κοντά, ήρεμα συντονισμένος"
    },
    {
      "symbol": "θάλασσα",
      "stance": "γαλήνια και ασφαλής"
    },
    {
      "symbol": "βυθός",
      "stance": "ανοιχτός για εξερεύνηση"
    }
  ],
  "raw_archetypes": [],
  "post_validation_archetypes": [],
  "raw_amplifications": [],
  "post_validation_amplifications": [],
  "archetype_reject_reasons": [],
  "mythic_reject_reasons": []
}
```

### Run `sea_mattress_r5`

Decision:

```text
archetypes: none
myths: none
rejects: none
schema_ok: true
```

Metadata:

```json
{
  "run_id": "sea_mattress_r5",
  "latency_ms": 5021,
  "prompt_id": "dream-field-map-interpretive-v4.1.10-M2",
  "prompt_version": "4.1.10-M2",
  "schema_version": 13,
  "model": "gpt-5.4-mini-2026-03-17",
  "cost_usd": 0.00364785,
  "usage": {
    "prompt_tokens": 16325,
    "completion_tokens": 509,
    "total_tokens": 16834,
    "cached_prompt_tokens": 16128
  },
  "central_conflicts": [],
  "symbols": [
    "θαλάσσιο στρώμα",
    "θάλασσα",
    "φίλος",
    "βυθός"
  ],
  "landscapes": [
    "θάλασσα"
  ],
  "affects": [
    "γαλήνη",
    "ηρεμία",
    "ομορφιά"
  ],
  "motifs": [
    "ξάπλωμα σε θαλάσσιο στρώμα",
    "κοινή παρατήρηση του βυθού",
    "ήρεμη εξερεύνηση στο νερό"
  ],
  "relational_dynamics": [
    "κοινή παραμονή",
    "ήπια συντροφικότητα"
  ],
  "core_mode": "Core State",
  "display_distillation": {
    "essence_title": "Ήρεμη κατάδυση μαζί",
    "essence_line": "Σε ένα ήρεμο θαλάσσιο στρώμα, εσύ και ο φίλος σου κοιτάτε και εξερευνάτε τον βυθό μέσα σε γαλήνη.",
    "dominant_lens": "image",
    "main_tension": null,
    "dream_movement": "integrating",
    "movement_line": "Η σκηνή μένει σταθερή και ήρεμη, σαν κοινή παραμονή μέσα στο βάθος."
  },
  "symbol_stances": [
    {
      "symbol": "θαλάσσιο στρώμα",
      "stance": "σταθερό, επιτρέπει αιώρηση"
    },
    {
      "symbol": "θάλασσα",
      "stance": "γαλήνια, προστατευτική"
    },
    {
      "symbol": "φίλος",
      "stance": "κοντινός, ξαπλωμένος μαζί σου"
    },
    {
      "symbol": "βυθός",
      "stance": "ανοιχτός για εξερεύνηση"
    }
  ],
  "raw_archetypes": [],
  "post_validation_archetypes": [],
  "raw_amplifications": [],
  "post_validation_amplifications": [],
  "archetype_reject_reasons": [],
  "mythic_reject_reasons": []
}
```

## Comparison-only note from the earlier sequential batch

This was not the requested official concurrent packet, but it is worth preserving because it shows selection variability under a separate earlier batch on the same date:

```text
Earlier sequential 5-run batch:
- r1 []
- r2 Lover
- r3 []
- r4 Lover
- r5 []
```

Reviewer reading:

```text
- the concurrent 5-run packet should be treated as the main decision packet
- the earlier sequential packet shows that the dream can drift toward Lover in some runs
- that drift was not reproduced in the concurrent packet
- therefore the most conservative production reading remains: no stable archetype committed from this sample
```

## Final closeout

```text
Final packet decision:
- archetypes: none
- mythic parallels: none
- confidence in calm relational/image field: high
- confidence in stable Lover assignment from this 5-run concurrent packet: not established
```
