# Oneiros Archetype Recognition Adjudication Final Review Packet

Date: `2026-07-28`  
Status: `live suite completed successfully`  
Scope: merged full-suite live packet for discovery `1.0.0` + adjudication `1.0.0`

## Executive summary

The standalone 2-pass archetype spike completed successfully across the full planned suite after fixing the `openai-proxy` boot export break and deploying the function.

Top-line result:

- Fixture passes: `18/18`
- Fixture failures: `0/18`
- Successful semantic runs: `80/80`
- Exact-set pass rate: `80/80`
- Unexpected-label false-positive rate: `0/80`

Operational interpretation:

- The discovery layer preserved high recall on the positive Lover / Guide / Shadow / Persona / Mother / Father / Divine Child fixtures.
- The adjudication layer removed the previously concerning carrier-only and romance-cue false positives.
- The full suite, as run here, supports the reviewer direction that discovery + adjudication is a viable 2-pass spike architecture.

## Versions and runtime

- Task chain: `dream_archetype_recognition → dream_archetype_adjudication`
- Discovery prompt version: `1.0.0`
- Discovery schema version: `1`
- Recognition catalog version: `2.0.0`
- Adjudication prompt version: `1.0.0`
- Adjudication schema version: `1`
- Boundary catalog version: `1.0.0`
- Discovery model: `gpt-5.4-mini-2026-03-17`
- Adjudication model: `gpt-5.4-mini-2026-03-17`
- Discovery temperature: `0`
- Adjudication temperature: `0`
- Concurrency: `2`
- Fixture count: `18`
- Planned semantic runs: `80`

Unified raw packet: [review_packet.json](/Users/yiannisyiallouris/Documents/perso/oneiros-app/tmp/archetype-recognition-adjudication-2026-07-28T15-45-merged/review_packet.json)

Chunk sources used for the merged packet:

- [chunk 1](/Users/yiannisyiallouris/Documents/perso/oneiros-app/tmp/archetype-recognition-adjudication-2026-07-28T15-41-01-966Z/review_packet.json)
- [chunk 2](/Users/yiannisyiallouris/Documents/perso/oneiros-app/tmp/archetype-recognition-adjudication-2026-07-28T15-42-26-017Z/review_packet.json)
- [chunk 3](/Users/yiannisyiallouris/Documents/perso/oneiros-app/tmp/archetype-recognition-adjudication-2026-07-28T15-44-09-583Z/review_packet.json)

## Acceptance summary

| Fixture | Successful runs | Exact-set passes | Required-hit count | Unexpected-label runs | Verdict | Failures |
|---|---:|---:|---:|---:|---|---|
| `sea_mattress_el_exact` | 5 | 5 | 5 | 0 | pass | none |
| `sea_mattress_el_boyfriend_diag` | 3 | 3 | 3 | 0 | pass | none |
| `lover_harmonious_en` | 5 | 5 | 5 | 0 | pass | none |
| `lover_longing_en` | 3 | 3 | 3 | 0 | pass | none |
| `warm_friends_en` | 5 | 5 | 5 | 0 | pass | none |
| `warm_friends_el` | 5 | 5 | 5 | 0 | pass | none |
| `lover_negative_naturalistic_en` | 5 | 5 | 5 | 0 | pass | none |
| `incidental_partner_en` | 5 | 5 | 5 | 0 | pass | none |
| `romance_cue_only_en` | 5 | 5 | 5 | 0 | pass | none |
| `guide_positive_en` | 5 | 5 | 5 | 0 | pass | none |
| `guide_negative_carrier_only_en` | 5 | 5 | 5 | 0 | pass | none |
| `shadow_positive_en` | 5 | 5 | 5 | 0 | pass | none |
| `shadow_negative_danger_only_en` | 5 | 5 | 5 | 0 | pass | none |
| `persona_positive_en` | 5 | 5 | 5 | 0 | pass | none |
| `persona_carrier_only_en` | 5 | 5 | 5 | 0 | pass | none |
| `mother_positive_en` | 3 | 3 | 3 | 0 | pass | none |
| `father_positive_en` | 3 | 3 | 3 | 0 | pass | none |
| `divine_child_positive_en` | 3 | 3 | 3 | 0 | pass | none |

## Required-label recall

- `lover`: 16/16
- `guide_psychopomp`: 5/5
- `shadow`: 5/5
- `persona`: 5/5
- `mother`: 3/3
- `father`: 3/3
- `divine_child`: 3/3

## Per-label confusion matrix

| Label | Expected positive runs | True positive runs | False negative runs | False positive runs | Returned runs |
|---|---:|---:|---:|---:|---:|
| `lover` | 16 | 16 | 0 | 0 | 16 |
| `guide_psychopomp` | 5 | 5 | 0 | 0 | 5 |
| `shadow` | 5 | 5 | 0 | 0 | 5 |
| `persona` | 5 | 5 | 0 | 0 | 5 |
| `mother` | 3 | 3 | 0 | 0 | 3 |
| `father` | 3 | 3 | 0 | 0 | 3 |
| `divine_child` | 3 | 3 | 0 | 0 | 3 |

## Key takeaways

- `sea_mattress_el_exact`: final `lover` in `5/5`
- `sea_mattress_el_boyfriend_diag`: final `lover` in `3/3`
- `lover_harmonious_en`: final `lover` in `5/5`
- `lover_longing_en`: final `lover` in `3/3`
- All friendship / incidental partner / romance-cue negatives: final archetype set `[]` in every run
- `guide_positive_en`: final `guide_psychopomp` in `5/5`
- `guide_negative_carrier_only_en`: final archetype set `[]` in `5/5`
- `shadow_positive_en`: final `shadow` in `5/5`
- `shadow_negative_danger_only_en`: final archetype set `[]` in `5/5`
- `persona_positive_en`: final `persona` in `5/5`
- `persona_carrier_only_en`: final archetype set `[]` in `5/5`
- `mother_positive_en`, `father_positive_en`, `divine_child_positive_en`: all `3/3` with no unexpected labels

## Reviewer interpretation

This merged live packet supports the following reading:

- Discovery remained permissive enough to surface the right candidate on positive fixtures.
- Adjudication successfully enforced the exact allowed-set contract on the main negative fixtures that previously mattered most.
- The spike now behaves like a valid candidate-discovery-plus-contrastive-adjudication architecture under this suite.
- This is still a spike packet, not automatic approval for production integration into persisted metadata or UI.

## Full merged raw review packet

```json
{
  "generated_at": "2026-07-28T15:45:53.930Z",
  "task": "dream_archetype_recognition → dream_archetype_adjudication",
  "discovery_prompt_version": "1.0.0",
  "discovery_response_schema_version": "1",
  "recognition_catalog_version": "2.0.0",
  "adjudication_prompt_version": "1.0.0",
  "adjudication_response_schema_version": "1",
  "boundary_catalog_version": "1.0.0",
  "discovery_model": "gpt-5.4-mini-2026-03-17",
  "adjudication_model": "gpt-5.4-mini-2026-03-17",
  "discovery_temperature": 0,
  "adjudication_temperature": 0,
  "concurrency": 2,
  "fixture_count": 18,
  "planned_semantic_runs": 80,
  "chunk_sources": [
    "tmp/archetype-recognition-adjudication-2026-07-28T15-41-01-966Z/review_packet.json",
    "tmp/archetype-recognition-adjudication-2026-07-28T15-42-26-017Z/review_packet.json",
    "tmp/archetype-recognition-adjudication-2026-07-28T15-44-09-583Z/review_packet.json"
  ],
  "results": [
    {
      "fixture_id": "sea_mattress_el_exact",
      "semantic_success": true,
      "target_language": "el",
      "latency_ms": 4908,
      "discovery_archetypes": [
        {
          "archetype_id": "lover",
          "canonical_label": "Lover",
          "quality": "οικεία ερωτική εγγύτητα",
          "expression": "είναι ξαπλωμένοι μαζί πάνω σε θαλάσσιο στρώμα, ο φίλος της είναι ξαπλωμένος πάνω της, και μαζί εξερευνούν τον βυθό μέσα σε απόλυτη γαλήνη",
          "resonance": "Η σκηνή οργανώνεται από μια ήρεμη, στενή συντροφική οικειότητα που κάνει όλο το ονειρικό πεδίο να αισθάνεται ασφαλές και κατοικήσιμο.",
          "confidence": "high",
          "evidence_ids": [
            "D1"
          ],
          "evidence": [
            "Είδα ένα όνειρο. Ήμουν ξαπλωμένη σε ένα θαλάσσιο στρώμα, σε μια πολύ γαλήνια θάλασσα και πάνω μου ήταν ξαπλωμένος ο φίλος μου και κοιτούσαμε το βυθό και εξερευνούσαμε όλο το βυθό. Ήταν πολύ ήρεμα, γαλήνια, όμορφα, πάντα πολύ ήρεμα."
          ]
        }
      ],
      "adjudication": {
        "decisions": [
          {
            "archetype_id": "lover",
            "decision": "accept",
            "decisive_feature": "οικεία ερωτική συντροφική εγγύτητα",
            "reason": "Το όνειρο δείχνει μια σαφώς αγαπημένη και σωματικά οικεία δυάδα που οργανώνει όλη τη σκηνή.",
            "evidence_ids": [
              "D1"
            ]
          }
        ],
        "accepted_archetype_ids": [
          "lover"
        ]
      },
      "final_archetypes": [
        {
          "archetype_id": "lover",
          "canonical_label": "Lover",
          "quality": "οικεία ερωτική εγγύτητα",
          "expression": "είναι ξαπλωμένοι μαζί πάνω σε θαλάσσιο στρώμα, ο φίλος της είναι ξαπλωμένος πάνω της, και μαζί εξερευνούν τον βυθό μέσα σε απόλυτη γαλήνη",
          "resonance": "Η σκηνή οργανώνεται από μια ήρεμη, στενή συντροφική οικειότητα που κάνει όλο το ονειρικό πεδίο να αισθάνεται ασφαλές και κατοικήσιμο.",
          "confidence": "high",
          "evidence_ids": [
            "D1"
          ],
          "evidence": [
            "Είδα ένα όνειρο. Ήμουν ξαπλωμένη σε ένα θαλάσσιο στρώμα, σε μια πολύ γαλήνια θάλασσα και πάνω μου ήταν ξαπλωμένος ο φίλος μου και κοιτούσαμε το βυθό και εξερευνούσαμε όλο το βυθό. Ήταν πολύ ήρεμα, γαλήνια, όμορφα, πάντα πολύ ήρεμα."
          ]
        }
      ],
      "final_archetype_ids": [
        "lover"
      ]
    },
    {
      "fixture_id": "sea_mattress_el_exact",
      "semantic_success": true,
      "target_language": "el",
      "latency_ms": 5822,
      "discovery_archetypes": [
        {
          "archetype_id": "lover",
          "canonical_label": "Lover",
          "quality": "οικεία συντροφικότητα",
          "expression": "Η ονειρική σκηνή στηρίζεται στο ότι είναι ξαπλωμένη σε θαλάσσιο στρώμα μαζί με τον φίλο της, ενώ οι δύο τους κοιτούν και εξερευνούν από κοινού τον βυθό μέσα σε απόλυτη γαλήνη.",
          "resonance": "Η οικεία κοινή παρουσία και η ήρεμη συν-εξερεύνηση οργανώνουν όλο το όνειρο ως ασφαλή ερωτική εγγύτητα.",
          "confidence": "high",
          "evidence_ids": [
            "D1"
          ],
          "evidence": [
            "Είδα ένα όνειρο. Ήμουν ξαπλωμένη σε ένα θαλάσσιο στρώμα, σε μια πολύ γαλήνια θάλασσα και πάνω μου ήταν ξαπλωμένος ο φίλος μου και κοιτούσαμε το βυθό και εξερευνούσαμε όλο το βυθό. Ήταν πολύ ήρεμα, γαλήνια, όμορφα, πάντα πολύ ήρεμα."
          ]
        }
      ],
      "adjudication": {
        "decisions": [
          {
            "archetype_id": "lover",
            "decision": "accept",
            "decisive_feature": "ερωτική ζευγαρική εγγύτητα",
            "reason": "Η οικεία κοινή ξαπλωμένη στάση με τον φίλο της και η από κοινού εξερεύνηση μέσα στην απόλυτη γαλήνη δείχνουν δεσμό αγαπημένου/ζευγαριού και όχι απλή συντροφικότητα.",
            "evidence_ids": [
              "D1"
            ]
          }
        ],
        "accepted_archetype_ids": [
          "lover"
        ]
      },
      "final_archetypes": [
        {
          "archetype_id": "lover",
          "canonical_label": "Lover",
          "quality": "οικεία συντροφικότητα",
          "expression": "Η ονειρική σκηνή στηρίζεται στο ότι είναι ξαπλωμένη σε θαλάσσιο στρώμα μαζί με τον φίλο της, ενώ οι δύο τους κοιτούν και εξερευνούν από κοινού τον βυθό μέσα σε απόλυτη γαλήνη.",
          "resonance": "Η οικεία κοινή παρουσία και η ήρεμη συν-εξερεύνηση οργανώνουν όλο το όνειρο ως ασφαλή ερωτική εγγύτητα.",
          "confidence": "high",
          "evidence_ids": [
            "D1"
          ],
          "evidence": [
            "Είδα ένα όνειρο. Ήμουν ξαπλωμένη σε ένα θαλάσσιο στρώμα, σε μια πολύ γαλήνια θάλασσα και πάνω μου ήταν ξαπλωμένος ο φίλος μου και κοιτούσαμε το βυθό και εξερευνούσαμε όλο το βυθό. Ήταν πολύ ήρεμα, γαλήνια, όμορφα, πάντα πολύ ήρεμα."
          ]
        }
      ],
      "final_archetype_ids": [
        "lover"
      ]
    },
    {
      "fixture_id": "sea_mattress_el_exact",
      "semantic_success": true,
      "target_language": "el",
      "latency_ms": 4576,
      "discovery_archetypes": [
        {
          "archetype_id": "lover",
          "canonical_label": "Lover",
          "quality": "Τρυφερή οικειότητα και συντροφική εγγύτητα",
          "expression": "Το σώμα της ονειρεύτριας είναι ξαπλωμένο σε θαλάσσιο στρώμα, ο φίλος της είναι ξαπλωμένος πάνω της, και μαζί κοιτούν και εξερευνούν τον βυθό μέσα σε απόλυτη γαλήνη.",
          "resonance": "Η ήρεμη συνύπαρξη και η κοινή βύθιση στον ίδιο χώρο οργανώνουν όλο το όνειρο ως ζωντανό πεδίο οικειότητας.",
          "confidence": "high",
          "evidence_ids": [
            "D1"
          ],
          "evidence": [
            "Είδα ένα όνειρο. Ήμουν ξαπλωμένη σε ένα θαλάσσιο στρώμα, σε μια πολύ γαλήνια θάλασσα και πάνω μου ήταν ξαπλωμένος ο φίλος μου και κοιτούσαμε το βυθό και εξερευνούσαμε όλο το βυθό. Ήταν πολύ ήρεμα, γαλήνια, όμορφα, πάντα πολύ ήρεμα."
          ]
        }
      ],
      "adjudication": {
        "decisions": [
          {
            "archetype_id": "lover",
            "decision": "accept",
            "decisive_feature": "Σωματική και συναισθηματική συνύπαρξη ως ζευγαρωμένος δεσμός",
            "reason": "Το όνειρο δείχνει τον φίλο ξαπλωμένο πάνω της σε κοινό ήρεμο πεδίο, κάτι που υπερβαίνει τη γενική συντροφικότητα και οργανώνει την εμπειρία ως ερωτική-συντροφική οικειότητα.",
            "evidence_ids": [
              "D1"
            ]
          }
        ],
        "accepted_archetype_ids": [
          "lover"
        ]
      },
      "final_archetypes": [
        {
          "archetype_id": "lover",
          "canonical_label": "Lover",
          "quality": "Τρυφερή οικειότητα και συντροφική εγγύτητα",
          "expression": "Το σώμα της ονειρεύτριας είναι ξαπλωμένο σε θαλάσσιο στρώμα, ο φίλος της είναι ξαπλωμένος πάνω της, και μαζί κοιτούν και εξερευνούν τον βυθό μέσα σε απόλυτη γαλήνη.",
          "resonance": "Η ήρεμη συνύπαρξη και η κοινή βύθιση στον ίδιο χώρο οργανώνουν όλο το όνειρο ως ζωντανό πεδίο οικειότητας.",
          "confidence": "high",
          "evidence_ids": [
            "D1"
          ],
          "evidence": [
            "Είδα ένα όνειρο. Ήμουν ξαπλωμένη σε ένα θαλάσσιο στρώμα, σε μια πολύ γαλήνια θάλασσα και πάνω μου ήταν ξαπλωμένος ο φίλος μου και κοιτούσαμε το βυθό και εξερευνούσαμε όλο το βυθό. Ήταν πολύ ήρεμα, γαλήνια, όμορφα, πάντα πολύ ήρεμα."
          ]
        }
      ],
      "final_archetype_ids": [
        "lover"
      ]
    },
    {
      "fixture_id": "sea_mattress_el_exact",
      "semantic_success": true,
      "target_language": "el",
      "latency_ms": 5347,
      "discovery_archetypes": [
        {
          "archetype_id": "lover",
          "canonical_label": "Lover",
          "quality": "οικεία ερωτική εγγύτητα",
          "expression": "η ονειρεύτρια είναι ξαπλωμένη σε θαλάσσιο στρώμα με τον φίλο της από πάνω της, ενώ μαζί κοιτούν και εξερευνούν τον βυθό μέσα σε πολύ γαλήνια θάλασσα",
          "resonance": "Η ήρεμη κοινή κατάδυση σε ένα ενιαίο θαλάσσιο πεδίο οργανώνει το όνειρο ως τρυφερή, αισθητηριακή οικειότητα.",
          "confidence": "high",
          "evidence_ids": [
            "D1"
          ],
          "evidence": [
            "Είδα ένα όνειρο. Ήμουν ξαπλωμένη σε ένα θαλάσσιο στρώμα, σε μια πολύ γαλήνια θάλασσα και πάνω μου ήταν ξαπλωμένος ο φίλος μου και κοιτούσαμε το βυθό και εξερευνούσαμε όλο το βυθό. Ήταν πολύ ήρεμα, γαλήνια, όμορφα, πάντα πολύ ήρεμα."
          ]
        }
      ],
      "adjudication": {
        "decisions": [
          {
            "archetype_id": "lover",
            "decision": "accept",
            "decisive_feature": "οικεία ερωτική εγγύτητα και ζευγαρική συν-εξερεύνηση",
            "reason": "Ο φίλος είναι ξαπλωμένος πάνω στην ονειρεύτρια μέσα σε πολύ γαλήνια κοινή κατάδυση, κάτι που δείχνει οργανωτική ερωτική-συντροφική εγγύτητα πέρα από απλή συντροφικότητα.",
            "evidence_ids": [
              "D1"
            ]
          }
        ],
        "accepted_archetype_ids": [
          "lover"
        ]
      },
      "final_archetypes": [
        {
          "archetype_id": "lover",
          "canonical_label": "Lover",
          "quality": "οικεία ερωτική εγγύτητα",
          "expression": "η ονειρεύτρια είναι ξαπλωμένη σε θαλάσσιο στρώμα με τον φίλο της από πάνω της, ενώ μαζί κοιτούν και εξερευνούν τον βυθό μέσα σε πολύ γαλήνια θάλασσα",
          "resonance": "Η ήρεμη κοινή κατάδυση σε ένα ενιαίο θαλάσσιο πεδίο οργανώνει το όνειρο ως τρυφερή, αισθητηριακή οικειότητα.",
          "confidence": "high",
          "evidence_ids": [
            "D1"
          ],
          "evidence": [
            "Είδα ένα όνειρο. Ήμουν ξαπλωμένη σε ένα θαλάσσιο στρώμα, σε μια πολύ γαλήνια θάλασσα και πάνω μου ήταν ξαπλωμένος ο φίλος μου και κοιτούσαμε το βυθό και εξερευνούσαμε όλο το βυθό. Ήταν πολύ ήρεμα, γαλήνια, όμορφα, πάντα πολύ ήρεμα."
          ]
        }
      ],
      "final_archetype_ids": [
        "lover"
      ]
    },
    {
      "fixture_id": "sea_mattress_el_exact",
      "semantic_success": true,
      "target_language": "el",
      "latency_ms": 5230,
      "discovery_archetypes": [
        {
          "archetype_id": "lover",
          "canonical_label": "Lover",
          "quality": "Σωματική και ψυχική οικειότητα",
          "expression": "Η ονειρεύτρια είναι ξαπλωμένη σε θαλάσσιο στρώμα με τον φίλο της από πάνω της, και μαζί κοιτούν και εξερευνούν τον βυθό μέσα σε πλήρη γαλήνη.",
          "resonance": "Η σκηνή οργανώνεται από μια ήρεμη, κοινή εγγύτητα που κάνει τον χώρο του ονείρου να βιώνεται ως ασφαλής και βαθιά κατοικήσιμος.",
          "confidence": "high",
          "evidence_ids": [
            "D1"
          ],
          "evidence": [
            "Είδα ένα όνειρο. Ήμουν ξαπλωμένη σε ένα θαλάσσιο στρώμα, σε μια πολύ γαλήνια θάλασσα και πάνω μου ήταν ξαπλωμένος ο φίλος μου και κοιτούσαμε το βυθό και εξερευνούσαμε όλο το βυθό. Ήταν πολύ ήρεμα, γαλήνια, όμορφα, πάντα πολύ ήρεμα."
          ]
        }
      ],
      "adjudication": {
        "decisions": [
          {
            "archetype_id": "lover",
            "decision": "accept",
            "decisive_feature": "συζυγική-ερωτική σωματική εγγύτητα",
            "reason": "Η ονειρική σκηνή οργανώνεται από τη σωματική εγγύτητα με τον φίλο της πάνω στο θαλάσσιο στρώμα, όχι μόνο από απλή συντροφικότητα.",
            "evidence_ids": [
              "D1"
            ]
          }
        ],
        "accepted_archetype_ids": [
          "lover"
        ]
      },
      "final_archetypes": [
        {
          "archetype_id": "lover",
          "canonical_label": "Lover",
          "quality": "Σωματική και ψυχική οικειότητα",
          "expression": "Η ονειρεύτρια είναι ξαπλωμένη σε θαλάσσιο στρώμα με τον φίλο της από πάνω της, και μαζί κοιτούν και εξερευνούν τον βυθό μέσα σε πλήρη γαλήνη.",
          "resonance": "Η σκηνή οργανώνεται από μια ήρεμη, κοινή εγγύτητα που κάνει τον χώρο του ονείρου να βιώνεται ως ασφαλής και βαθιά κατοικήσιμος.",
          "confidence": "high",
          "evidence_ids": [
            "D1"
          ],
          "evidence": [
            "Είδα ένα όνειρο. Ήμουν ξαπλωμένη σε ένα θαλάσσιο στρώμα, σε μια πολύ γαλήνια θάλασσα και πάνω μου ήταν ξαπλωμένος ο φίλος μου και κοιτούσαμε το βυθό και εξερευνούσαμε όλο το βυθό. Ήταν πολύ ήρεμα, γαλήνια, όμορφα, πάντα πολύ ήρεμα."
          ]
        }
      ],
      "final_archetype_ids": [
        "lover"
      ]
    },
    {
      "fixture_id": "sea_mattress_el_boyfriend_diag",
      "semantic_success": true,
      "target_language": "el",
      "latency_ms": 5769,
      "discovery_archetypes": [
        {
          "archetype_id": "lover",
          "canonical_label": "Lover",
          "quality": "Ερωτική-οικεία συνύπαρξη",
          "expression": "Η ονειρεύτρια είναι ξαπλωμένη σε θαλάσσιο στρώμα μαζί με το αγόρι της, πολύ κοντά σωματικά, ενώ κοιτούν και εξερευνούν μαζί τον βυθό σε μια ήρεμη θάλασσα.",
          "resonance": "Η εικόνα οργανώνεται από μια ήσυχη, αμοιβαία οικειότητα που κάνει τον χώρο του ονείρου να μοιάζει ασφαλής, ανοιχτός και κοινός.",
          "confidence": "high",
          "evidence_ids": [
            "D1"
          ],
          "evidence": [
            "Είδα ένα όνειρο. Ήμουν ξαπλωμένη σε ένα θαλάσσιο στρώμα, σε μια πολύ γαλήνια θάλασσα και πάνω μου ήταν ξαπλωμένο το αγόρι μου και κοιτούσαμε το βυθό και εξερευνούσαμε όλο το βυθό. Ήταν πολύ ήρεμα, γαλήνια, όμορφα, πάντα πολύ ήρεμα."
          ]
        }
      ],
      "adjudication": {
        "decisions": [
          {
            "archetype_id": "lover",
            "decision": "accept",
            "decisive_feature": "ερωτική-ζευγαρωτή οικειότητα",
            "reason": "Το όνειρο δείχνει σαφή αγαπημένο δεσμό, αφού η ονειρεύτρια είναι ξαπλωμένη μαζί με το αγόρι της σε πολύ στενή σωματική επαφή και η κοινή εξερεύνηση οργανώνεται από αυτή τη συντροφική οικειότητα.",
            "evidence_ids": [
              "D1"
            ]
          }
        ],
        "accepted_archetype_ids": [
          "lover"
        ]
      },
      "final_archetypes": [
        {
          "archetype_id": "lover",
          "canonical_label": "Lover",
          "quality": "Ερωτική-οικεία συνύπαρξη",
          "expression": "Η ονειρεύτρια είναι ξαπλωμένη σε θαλάσσιο στρώμα μαζί με το αγόρι της, πολύ κοντά σωματικά, ενώ κοιτούν και εξερευνούν μαζί τον βυθό σε μια ήρεμη θάλασσα.",
          "resonance": "Η εικόνα οργανώνεται από μια ήσυχη, αμοιβαία οικειότητα που κάνει τον χώρο του ονείρου να μοιάζει ασφαλής, ανοιχτός και κοινός.",
          "confidence": "high",
          "evidence_ids": [
            "D1"
          ],
          "evidence": [
            "Είδα ένα όνειρο. Ήμουν ξαπλωμένη σε ένα θαλάσσιο στρώμα, σε μια πολύ γαλήνια θάλασσα και πάνω μου ήταν ξαπλωμένο το αγόρι μου και κοιτούσαμε το βυθό και εξερευνούσαμε όλο το βυθό. Ήταν πολύ ήρεμα, γαλήνια, όμορφα, πάντα πολύ ήρεμα."
          ]
        }
      ],
      "final_archetype_ids": [
        "lover"
      ]
    },
    {
      "fixture_id": "sea_mattress_el_boyfriend_diag",
      "semantic_success": true,
      "target_language": "el",
      "latency_ms": 5028,
      "discovery_archetypes": [
        {
          "archetype_id": "lover",
          "canonical_label": "Lover",
          "quality": "οικεία ερωτική συνύπαρξη",
          "expression": "Το ονειρικό ζεύγος είναι ξαπλωμένο μαζί πάνω σε θαλάσσιο στρώμα, αγκαλιά με ήρεμη κοινή εστίαση προς τον βυθό της θάλασσας.",
          "resonance": "Η οικειότητα δεν είναι απλώς παρουσία συντρόφου, αλλά ένα ήρεμο κοινό βίωμα που οργανώνει όλη τη σκηνή ως τρυφερό και κοινό χώρο.",
          "confidence": "high",
          "evidence_ids": [
            "D1"
          ],
          "evidence": [
            "Είδα ένα όνειρο. Ήμουν ξαπλωμένη σε ένα θαλάσσιο στρώμα, σε μια πολύ γαλήνια θάλασσα και πάνω μου ήταν ξαπλωμένο το αγόρι μου και κοιτούσαμε το βυθό και εξερευνούσαμε όλο το βυθό. Ήταν πολύ ήρεμα, γαλήνια, όμορφα, πάντα πολύ ήρεμα."
          ]
        },
        {
          "archetype_id": "self",
          "canonical_label": "Self",
          "quality": "ήρεμη ενιαία ολότητα",
          "expression": "Η πολύ γαλήνια θάλασσα και η κοινή εξερεύνηση του βυθού σχηματίζουν ένα ενιαίο, αθόρυβο πεδίο χωρίς ρήξη.",
          "resonance": "Η συνολική ατμόσφαιρα δίνει την αίσθηση μιας ενωμένης ψυχικής επιφάνειας που περιέχει και συνδέει τα πάντα μέσα σε γαλήνη.",
          "confidence": "medium",
          "evidence_ids": [
            "D1"
          ],
          "evidence": [
            "Είδα ένα όνειρο. Ήμουν ξαπλωμένη σε ένα θαλάσσιο στρώμα, σε μια πολύ γαλήνια θάλασσα και πάνω μου ήταν ξαπλωμένο το αγόρι μου και κοιτούσαμε το βυθό και εξερευνούσαμε όλο το βυθό. Ήταν πολύ ήρεμα, γαλήνια, όμορφα, πάντα πολύ ήρεμα."
          ]
        }
      ],
      "adjudication": {
        "decisions": [
          {
            "archetype_id": "lover",
            "decision": "accept",
            "decisive_feature": "οικεία ερωτική συνύπαρξη που οργανώνει τη σκηνή",
            "reason": "Το αγόρι μου ξαπλωμένο πάνω μου ενώ εξερευνούμε μαζί τον βυθό δείχνει σαφή ερωτική/ζευγαρωμένη σύνδεση πέρα από απλή συντροφικότητα.",
            "evidence_ids": [
              "D1"
            ]
          },
          {
            "archetype_id": "self",
            "decision": "reject",
            "decisive_feature": null,
            "reason": "Η γαλήνη και η ομορφιά υπάρχουν, αλλά δεν τεκμηριώνεται ότι ένα κέντρο ενοποιεί πραγματικά αντιθέσεις ή όλο το όνειρο.",
            "evidence_ids": [
              "D1"
            ]
          }
        ],
        "accepted_archetype_ids": [
          "lover"
        ]
      },
      "final_archetypes": [
        {
          "archetype_id": "lover",
          "canonical_label": "Lover",
          "quality": "οικεία ερωτική συνύπαρξη",
          "expression": "Το ονειρικό ζεύγος είναι ξαπλωμένο μαζί πάνω σε θαλάσσιο στρώμα, αγκαλιά με ήρεμη κοινή εστίαση προς τον βυθό της θάλασσας.",
          "resonance": "Η οικειότητα δεν είναι απλώς παρουσία συντρόφου, αλλά ένα ήρεμο κοινό βίωμα που οργανώνει όλη τη σκηνή ως τρυφερό και κοινό χώρο.",
          "confidence": "high",
          "evidence_ids": [
            "D1"
          ],
          "evidence": [
            "Είδα ένα όνειρο. Ήμουν ξαπλωμένη σε ένα θαλάσσιο στρώμα, σε μια πολύ γαλήνια θάλασσα και πάνω μου ήταν ξαπλωμένο το αγόρι μου και κοιτούσαμε το βυθό και εξερευνούσαμε όλο το βυθό. Ήταν πολύ ήρεμα, γαλήνια, όμορφα, πάντα πολύ ήρεμα."
          ]
        }
      ],
      "final_archetype_ids": [
        "lover"
      ]
    },
    {
      "fixture_id": "sea_mattress_el_boyfriend_diag",
      "semantic_success": true,
      "target_language": "el",
      "latency_ms": 5988,
      "discovery_archetypes": [
        {
          "archetype_id": "lover",
          "canonical_label": "Lover",
          "quality": "ερωτική εγγύτητα",
          "expression": "Ξαπλωμένη σε θαλάσσιο στρώμα με το αγόρι της από πάνω της, μέσα σε πολύ γαλήνια θάλασσα, και οι δυο τους κοιτούν και εξερευνούν τον βυθό.",
          "resonance": "Το όνειρο οργανώνεται γύρω από μια ήρεμη, στενή και κοινή ερωτική παρουσία που ανοίγει χώρο για κοινή βύθιση και εξερεύνηση.",
          "confidence": "high",
          "evidence_ids": [
            "D1"
          ],
          "evidence": [
            "Είδα ένα όνειρο. Ήμουν ξαπλωμένη σε ένα θαλάσσιο στρώμα, σε μια πολύ γαλήνια θάλασσα και πάνω μου ήταν ξαπλωμένο το αγόρι μου και κοιτούσαμε το βυθό και εξερευνούσαμε όλο το βυθό. Ήταν πολύ ήρεμα, γαλήνια, όμορφα, πάντα πολύ ήρεμα."
          ]
        }
      ],
      "adjudication": {
        "decisions": [
          {
            "archetype_id": "lover",
            "decision": "accept",
            "decisive_feature": "στενή ερωτική-ζευγαρωμένη εγγύτητα",
            "reason": "Το όνειρο οργανώνεται γύρω από την αγκαλιασμένη παρουσία του αγοριού της πάνω της, που δείχνει σαφώς ερωτικό και αγαπημένο δεσμό.",
            "evidence_ids": [
              "D1"
            ]
          }
        ],
        "accepted_archetype_ids": [
          "lover"
        ]
      },
      "final_archetypes": [
        {
          "archetype_id": "lover",
          "canonical_label": "Lover",
          "quality": "ερωτική εγγύτητα",
          "expression": "Ξαπλωμένη σε θαλάσσιο στρώμα με το αγόρι της από πάνω της, μέσα σε πολύ γαλήνια θάλασσα, και οι δυο τους κοιτούν και εξερευνούν τον βυθό.",
          "resonance": "Το όνειρο οργανώνεται γύρω από μια ήρεμη, στενή και κοινή ερωτική παρουσία που ανοίγει χώρο για κοινή βύθιση και εξερεύνηση.",
          "confidence": "high",
          "evidence_ids": [
            "D1"
          ],
          "evidence": [
            "Είδα ένα όνειρο. Ήμουν ξαπλωμένη σε ένα θαλάσσιο στρώμα, σε μια πολύ γαλήνια θάλασσα και πάνω μου ήταν ξαπλωμένο το αγόρι μου και κοιτούσαμε το βυθό και εξερευνούσαμε όλο το βυθό. Ήταν πολύ ήρεμα, γαλήνια, όμορφα, πάντα πολύ ήρεμα."
          ]
        }
      ],
      "final_archetype_ids": [
        "lover"
      ]
    },
    {
      "fixture_id": "lover_harmonious_en",
      "semantic_success": true,
      "target_language": "en",
      "latency_ms": 4108,
      "discovery_archetypes": [
        {
          "archetype_id": "lover",
          "canonical_label": "Lover",
          "quality": "mutual intimate relatedness",
          "expression": "lying with the beloved on a quiet floating raft, staying close, and watching the deep water together in peaceful shared stillness",
          "resonance": "The dream is organized by a calm, embodied bond that makes the whole scene feel intimate and mutually held.",
          "confidence": "high",
          "evidence_ids": [
            "D1"
          ],
          "evidence": [
            "I dreamed I was lying with my beloved on a quiet floating raft. We stayed close, watched the deep water together, and felt the whole scene as peaceful, intimate, and shared."
          ]
        }
      ],
      "adjudication": {
        "decisions": [
          {
            "archetype_id": "lover",
            "decision": "accept",
            "decisive_feature": "beloved pair-bonded intimacy",
            "reason": "The dream explicitly presents a quiet, shared intimacy with the beloved that organizes the scene.",
            "evidence_ids": [
              "D1"
            ]
          }
        ],
        "accepted_archetype_ids": [
          "lover"
        ]
      },
      "final_archetypes": [
        {
          "archetype_id": "lover",
          "canonical_label": "Lover",
          "quality": "mutual intimate relatedness",
          "expression": "lying with the beloved on a quiet floating raft, staying close, and watching the deep water together in peaceful shared stillness",
          "resonance": "The dream is organized by a calm, embodied bond that makes the whole scene feel intimate and mutually held.",
          "confidence": "high",
          "evidence_ids": [
            "D1"
          ],
          "evidence": [
            "I dreamed I was lying with my beloved on a quiet floating raft. We stayed close, watched the deep water together, and felt the whole scene as peaceful, intimate, and shared."
          ]
        }
      ],
      "final_archetype_ids": [
        "lover"
      ]
    },
    {
      "fixture_id": "lover_harmonious_en",
      "semantic_success": true,
      "target_language": "en",
      "latency_ms": 3039,
      "discovery_archetypes": [
        {
          "archetype_id": "lover",
          "canonical_label": "Lover",
          "quality": "mutual intimate relatedness",
          "expression": "lying with a beloved on a quiet floating raft, staying close, watching deep water together, and feeling the scene as peaceful, intimate, and shared",
          "resonance": "The dream is organized by an enveloping bond of mutual closeness that makes the whole space feel safe and inhabited.",
          "confidence": "high",
          "evidence_ids": [
            "D1"
          ],
          "evidence": [
            "I dreamed I was lying with my beloved on a quiet floating raft. We stayed close, watched the deep water together, and felt the whole scene as peaceful, intimate, and shared."
          ]
        }
      ],
      "adjudication": {
        "decisions": [
          {
            "archetype_id": "lover",
            "decision": "accept",
            "decisive_feature": "beloved pair-bonded intimacy",
            "reason": "The dream explicitly presents a beloved, mutually intimate bond that organizes the scene beyond mere companionship.",
            "evidence_ids": [
              "D1"
            ]
          }
        ],
        "accepted_archetype_ids": [
          "lover"
        ]
      },
      "final_archetypes": [
        {
          "archetype_id": "lover",
          "canonical_label": "Lover",
          "quality": "mutual intimate relatedness",
          "expression": "lying with a beloved on a quiet floating raft, staying close, watching deep water together, and feeling the scene as peaceful, intimate, and shared",
          "resonance": "The dream is organized by an enveloping bond of mutual closeness that makes the whole space feel safe and inhabited.",
          "confidence": "high",
          "evidence_ids": [
            "D1"
          ],
          "evidence": [
            "I dreamed I was lying with my beloved on a quiet floating raft. We stayed close, watched the deep water together, and felt the whole scene as peaceful, intimate, and shared."
          ]
        }
      ],
      "final_archetype_ids": [
        "lover"
      ]
    },
    {
      "fixture_id": "lover_harmonious_en",
      "semantic_success": true,
      "target_language": "en",
      "latency_ms": 7781,
      "discovery_archetypes": [
        {
          "archetype_id": "lover",
          "canonical_label": "Lover",
          "quality": "mutual intimate relatedness",
          "expression": "lying close with a beloved on a quiet floating raft, watching deep water together in a peaceful shared space",
          "resonance": "The dream is organized by a calm, mutual bond that makes the scene feel inhabited and emotionally held.",
          "confidence": "high",
          "evidence_ids": [
            "D1"
          ],
          "evidence": [
            "I dreamed I was lying with my beloved on a quiet floating raft. We stayed close, watched the deep water together, and felt the whole scene as peaceful, intimate, and shared."
          ]
        }
      ],
      "adjudication": {
        "decisions": [
          {
            "archetype_id": "lover",
            "decision": "accept",
            "decisive_feature": "mutual beloved pair-bond",
            "reason": "The dream explicitly presents a close shared bond with a beloved, not mere companionship.",
            "evidence_ids": [
              "D1"
            ]
          }
        ],
        "accepted_archetype_ids": [
          "lover"
        ]
      },
      "final_archetypes": [
        {
          "archetype_id": "lover",
          "canonical_label": "Lover",
          "quality": "mutual intimate relatedness",
          "expression": "lying close with a beloved on a quiet floating raft, watching deep water together in a peaceful shared space",
          "resonance": "The dream is organized by a calm, mutual bond that makes the scene feel inhabited and emotionally held.",
          "confidence": "high",
          "evidence_ids": [
            "D1"
          ],
          "evidence": [
            "I dreamed I was lying with my beloved on a quiet floating raft. We stayed close, watched the deep water together, and felt the whole scene as peaceful, intimate, and shared."
          ]
        }
      ],
      "final_archetype_ids": [
        "lover"
      ]
    },
    {
      "fixture_id": "lover_harmonious_en",
      "semantic_success": true,
      "target_language": "en",
      "latency_ms": 3481,
      "discovery_archetypes": [
        {
          "archetype_id": "lover",
          "canonical_label": "Lover",
          "quality": "mutual intimate relatedness",
          "expression": "lying with a beloved on a quiet floating raft, staying close, watching the deep water together, and feeling the scene as peaceful and shared",
          "resonance": "The dream is organized by a calm intimate bond that makes the space feel inhabited together.",
          "confidence": "high",
          "evidence_ids": [
            "D1"
          ],
          "evidence": [
            "I dreamed I was lying with my beloved on a quiet floating raft. We stayed close, watched the deep water together, and felt the whole scene as peaceful, intimate, and shared."
          ]
        }
      ],
      "adjudication": {
        "decisions": [
          {
            "archetype_id": "lover",
            "decision": "accept",
            "decisive_feature": "beloved pair-bonded intimacy",
            "reason": "The dream explicitly shows a beloved intimate bond that organizes the shared scene, not merely companionship.",
            "evidence_ids": [
              "D1"
            ]
          }
        ],
        "accepted_archetype_ids": [
          "lover"
        ]
      },
      "final_archetypes": [
        {
          "archetype_id": "lover",
          "canonical_label": "Lover",
          "quality": "mutual intimate relatedness",
          "expression": "lying with a beloved on a quiet floating raft, staying close, watching the deep water together, and feeling the scene as peaceful and shared",
          "resonance": "The dream is organized by a calm intimate bond that makes the space feel inhabited together.",
          "confidence": "high",
          "evidence_ids": [
            "D1"
          ],
          "evidence": [
            "I dreamed I was lying with my beloved on a quiet floating raft. We stayed close, watched the deep water together, and felt the whole scene as peaceful, intimate, and shared."
          ]
        }
      ],
      "final_archetype_ids": [
        "lover"
      ]
    },
    {
      "fixture_id": "lover_harmonious_en",
      "semantic_success": true,
      "target_language": "en",
      "latency_ms": 9976,
      "discovery_archetypes": [
        {
          "archetype_id": "lover",
          "canonical_label": "Lover",
          "quality": "intimate relatedness",
          "expression": "lying with my beloved on a quiet floating raft, staying close, watching the deep water together, and feeling the scene as peaceful and shared",
          "resonance": "The dream is organized by a calm, mutual bond that makes the space feel emotionally inhabited and safe.",
          "confidence": "high",
          "evidence_ids": [
            "D1"
          ],
          "evidence": [
            "I dreamed I was lying with my beloved on a quiet floating raft. We stayed close, watched the deep water together, and felt the whole scene as peaceful, intimate, and shared."
          ]
        }
      ],
      "adjudication": {
        "decisions": [
          {
            "archetype_id": "lover",
            "decision": "accept",
            "decisive_feature": "beloved pair-bonded intimacy",
            "reason": "The dream shows a specifically beloved, intimate bond that organizes the shared scene beyond generic companionship.",
            "evidence_ids": [
              "D1"
            ]
          }
        ],
        "accepted_archetype_ids": [
          "lover"
        ]
      },
      "final_archetypes": [
        {
          "archetype_id": "lover",
          "canonical_label": "Lover",
          "quality": "intimate relatedness",
          "expression": "lying with my beloved on a quiet floating raft, staying close, watching the deep water together, and feeling the scene as peaceful and shared",
          "resonance": "The dream is organized by a calm, mutual bond that makes the space feel emotionally inhabited and safe.",
          "confidence": "high",
          "evidence_ids": [
            "D1"
          ],
          "evidence": [
            "I dreamed I was lying with my beloved on a quiet floating raft. We stayed close, watched the deep water together, and felt the whole scene as peaceful, intimate, and shared."
          ]
        }
      ],
      "final_archetype_ids": [
        "lover"
      ]
    },
    {
      "fixture_id": "lover_longing_en",
      "semantic_success": true,
      "target_language": "en",
      "latency_ms": 3743,
      "discovery_archetypes": [
        {
          "archetype_id": "lover",
          "canonical_label": "Lover",
          "quality": "longing for the beloved",
          "expression": "The dreamer searches through a dim station for the woman he loved, and her voice brings hope mixed with the ache of separation.",
          "resonance": "The dream is organized by intimate longing and the felt presence of the beloved as a desired yet partly absent other.",
          "confidence": "high",
          "evidence_ids": [
            "D1"
          ],
          "evidence": [
            "I dreamed I was searching through a dim station for the woman I loved. Each corridor deepened my longing, and when I finally heard her voice I felt both hope and the ache of separation."
          ]
        }
      ],
      "adjudication": {
        "decisions": [
          {
            "archetype_id": "lover",
            "decision": "accept",
            "decisive_feature": "romantic longing for the beloved",
            "reason": "The dream is organized by searching for the loved woman and feeling hope and separation in her presence, which shows a specifically beloved bond.",
            "evidence_ids": [
              "D1"
            ]
          }
        ],
        "accepted_archetype_ids": [
          "lover"
        ]
      },
      "final_archetypes": [
        {
          "archetype_id": "lover",
          "canonical_label": "Lover",
          "quality": "longing for the beloved",
          "expression": "The dreamer searches through a dim station for the woman he loved, and her voice brings hope mixed with the ache of separation.",
          "resonance": "The dream is organized by intimate longing and the felt presence of the beloved as a desired yet partly absent other.",
          "confidence": "high",
          "evidence_ids": [
            "D1"
          ],
          "evidence": [
            "I dreamed I was searching through a dim station for the woman I loved. Each corridor deepened my longing, and when I finally heard her voice I felt both hope and the ache of separation."
          ]
        }
      ],
      "final_archetype_ids": [
        "lover"
      ]
    },
    {
      "fixture_id": "lover_longing_en",
      "semantic_success": true,
      "target_language": "en",
      "latency_ms": 3571,
      "discovery_archetypes": [
        {
          "archetype_id": "lover",
          "canonical_label": "Lover",
          "quality": "mutual longing and beloved connection",
          "expression": "searching through a dim station for the woman loved, hearing her voice after moving through corridors, with hope and ache of separation",
          "resonance": "The dream is organized by longing for the beloved, and the station becomes a charged space of search, absence, and brief felt nearness.",
          "confidence": "high",
          "evidence_ids": [
            "D1"
          ],
          "evidence": [
            "I dreamed I was searching through a dim station for the woman I loved. Each corridor deepened my longing, and when I finally heard her voice I felt both hope and the ache of separation."
          ]
        }
      ],
      "adjudication": {
        "decisions": [
          {
            "archetype_id": "lover",
            "decision": "accept",
            "decisive_feature": "specifically beloved romantic longing",
            "reason": "The dream is organized by searching for the woman loved and the felt ache of separation, which shows an intimate beloved bond beyond generic companionship.",
            "evidence_ids": [
              "D1"
            ]
          }
        ],
        "accepted_archetype_ids": [
          "lover"
        ]
      },
      "final_archetypes": [
        {
          "archetype_id": "lover",
          "canonical_label": "Lover",
          "quality": "mutual longing and beloved connection",
          "expression": "searching through a dim station for the woman loved, hearing her voice after moving through corridors, with hope and ache of separation",
          "resonance": "The dream is organized by longing for the beloved, and the station becomes a charged space of search, absence, and brief felt nearness.",
          "confidence": "high",
          "evidence_ids": [
            "D1"
          ],
          "evidence": [
            "I dreamed I was searching through a dim station for the woman I loved. Each corridor deepened my longing, and when I finally heard her voice I felt both hope and the ache of separation."
          ]
        }
      ],
      "final_archetype_ids": [
        "lover"
      ]
    },
    {
      "fixture_id": "lover_longing_en",
      "semantic_success": true,
      "target_language": "en",
      "latency_ms": 3568,
      "discovery_archetypes": [
        {
          "archetype_id": "lover",
          "canonical_label": "Lover",
          "quality": "mutual beloved relatedness",
          "expression": "searching through a dim station for the woman he loved, with her voice bringing hope and the ache of separation",
          "resonance": "The dream is organized by longing for a beloved presence, and the station becomes a space of intimate pursuit and anticipated contact.",
          "confidence": "high",
          "evidence_ids": [
            "D1"
          ],
          "evidence": [
            "I dreamed I was searching through a dim station for the woman I loved. Each corridor deepened my longing, and when I finally heard her voice I felt both hope and the ache of separation."
          ]
        }
      ],
      "adjudication": {
        "decisions": [
          {
            "archetype_id": "lover",
            "decision": "accept",
            "decisive_feature": "beloved romantic longing for a specific woman",
            "reason": "The dream is organized around searching for the woman he loved and the hope/ache triggered by hearing her voice, which shows unmistakably beloved relatedness.",
            "evidence_ids": [
              "D1"
            ]
          }
        ],
        "accepted_archetype_ids": [
          "lover"
        ]
      },
      "final_archetypes": [
        {
          "archetype_id": "lover",
          "canonical_label": "Lover",
          "quality": "mutual beloved relatedness",
          "expression": "searching through a dim station for the woman he loved, with her voice bringing hope and the ache of separation",
          "resonance": "The dream is organized by longing for a beloved presence, and the station becomes a space of intimate pursuit and anticipated contact.",
          "confidence": "high",
          "evidence_ids": [
            "D1"
          ],
          "evidence": [
            "I dreamed I was searching through a dim station for the woman I loved. Each corridor deepened my longing, and when I finally heard her voice I felt both hope and the ache of separation."
          ]
        }
      ],
      "final_archetype_ids": [
        "lover"
      ]
    },
    {
      "fixture_id": "warm_friends_en",
      "semantic_success": true,
      "target_language": "en",
      "latency_ms": 4062,
      "discovery_archetypes": [
        {
          "archetype_id": "lover",
          "canonical_label": "Lover",
          "quality": "mutual warmth and belonging",
          "expression": "sitting on a porch at sunset with two close friends, talking warmly, laughing, and watching the light fade together",
          "resonance": "The dream is organized by an easy intimate bond that makes the shared moment feel warmly inhabited and complete.",
          "confidence": "medium",
          "evidence_ids": [
            "D1"
          ],
          "evidence": [
            "I dreamed I was sitting with two close friends on a porch at sunset. We talked warmly, laughed, and watched the light fade together before going home."
          ]
        }
      ],
      "adjudication": {
        "decisions": [
          {
            "archetype_id": "lover",
            "decision": "reject",
            "decisive_feature": null,
            "reason": "The dream shows warmth and companionship among friends, but no specifically romantic, erotic, or pair-bonded relatedness.",
            "evidence_ids": [
              "D1"
            ]
          }
        ],
        "accepted_archetype_ids": []
      },
      "final_archetypes": [],
      "final_archetype_ids": []
    },
    {
      "fixture_id": "warm_friends_en",
      "semantic_success": true,
      "target_language": "en",
      "latency_ms": 6972,
      "discovery_archetypes": [
        {
          "archetype_id": "lover",
          "canonical_label": "Lover",
          "quality": "mutual intimate relatedness",
          "expression": "sitting with two close friends on a porch at sunset, talking warmly, laughing, and watching the light fade together before going home",
          "resonance": "The dream is organized by easy, affectionate companionship that makes the shared moment feel held and intimate.",
          "confidence": "medium",
          "evidence_ids": [
            "D1"
          ],
          "evidence": [
            "I dreamed I was sitting with two close friends on a porch at sunset. We talked warmly, laughed, and watched the light fade together before going home."
          ]
        }
      ],
      "adjudication": {
        "decisions": [
          {
            "archetype_id": "lover",
            "decision": "reject",
            "decisive_feature": null,
            "reason": "The dream shows warm friendship and shared companionship, but no specifically romantic, erotic, or pair-bonded beloved bond.",
            "evidence_ids": [
              "D1"
            ]
          }
        ],
        "accepted_archetype_ids": []
      },
      "final_archetypes": [],
      "final_archetype_ids": []
    },
    {
      "fixture_id": "warm_friends_en",
      "semantic_success": true,
      "target_language": "en",
      "latency_ms": 3242,
      "discovery_archetypes": [
        {
          "archetype_id": "lover",
          "canonical_label": "Lover",
          "quality": "mutual warmth and intimacy",
          "expression": "sitting with two close friends on a porch at sunset, talking warmly, laughing, and watching the light fade together before going home",
          "resonance": "The dream is organized by a felt bond of ease, affection, and shared presence that makes the scene emotionally open and inhabited.",
          "confidence": "medium",
          "evidence_ids": [
            "D1"
          ],
          "evidence": [
            "I dreamed I was sitting with two close friends on a porch at sunset. We talked warmly, laughed, and watched the light fade together before going home."
          ]
        }
      ],
      "adjudication": {
        "decisions": [
          {
            "archetype_id": "lover",
            "decision": "reject",
            "decisive_feature": null,
            "reason": "The dream shows warmth and shared enjoyment with friends, but no specifically romantic, erotic, or pair-bonded bond beyond companionship.",
            "evidence_ids": [
              "D1"
            ]
          }
        ],
        "accepted_archetype_ids": []
      },
      "final_archetypes": [],
      "final_archetype_ids": []
    },
    {
      "fixture_id": "warm_friends_en",
      "semantic_success": true,
      "target_language": "en",
      "latency_ms": 4024,
      "discovery_archetypes": [
        {
          "archetype_id": "lover",
          "canonical_label": "Lover",
          "quality": "mutual intimacy and shared belonging",
          "expression": "sitting with two close friends on a porch at sunset, talking warmly, laughing, and watching the light fade together",
          "resonance": "The dream is organized by a quiet, affectionate togetherness that makes the shared moment feel emotionally held and inhabited.",
          "confidence": "medium",
          "evidence_ids": [
            "D1"
          ],
          "evidence": [
            "I dreamed I was sitting with two close friends on a porch at sunset. We talked warmly, laughed, and watched the light fade together before going home."
          ]
        }
      ],
      "adjudication": {
        "decisions": [
          {
            "archetype_id": "lover",
            "decision": "reject",
            "decisive_feature": null,
            "reason": "The dream shows warm friendship and shared companionship, but no specifically romantic, erotic, or pair-bonded relatedness.",
            "evidence_ids": [
              "D1"
            ]
          }
        ],
        "accepted_archetype_ids": []
      },
      "final_archetypes": [],
      "final_archetype_ids": []
    },
    {
      "fixture_id": "warm_friends_en",
      "semantic_success": true,
      "target_language": "en",
      "latency_ms": 8511,
      "discovery_archetypes": [
        {
          "archetype_id": "lover",
          "canonical_label": "Lover",
          "quality": "mutual intimacy and affectionate belonging",
          "expression": "Sitting with two close friends on a porch at sunset, talking warmly, laughing, and watching the light fade together before going home.",
          "resonance": "The dream is organized by a felt bond of ease, warmth, and shared presence that makes the scene emotionally inhabitable.",
          "confidence": "high",
          "evidence_ids": [
            "D1"
          ],
          "evidence": [
            "I dreamed I was sitting with two close friends on a porch at sunset. We talked warmly, laughed, and watched the light fade together before going home."
          ]
        }
      ],
      "adjudication": {
        "decisions": [
          {
            "archetype_id": "lover",
            "decision": "reject",
            "decisive_feature": null,
            "reason": "The scene shows warm friendship and shared companionship, but no specifically romantic, erotic, or beloved pair-bonded relatedness.",
            "evidence_ids": [
              "D1"
            ]
          }
        ],
        "accepted_archetype_ids": []
      },
      "final_archetypes": [],
      "final_archetype_ids": []
    },
    {
      "fixture_id": "warm_friends_el",
      "semantic_success": true,
      "target_language": "el",
      "latency_ms": 4505,
      "discovery_archetypes": [
        {
          "archetype_id": "lover",
          "canonical_label": "Lover",
          "quality": "ζεστή οικειότητα",
          "expression": "δύο πολύ ζεστοί φίλοι σε αυλή το βράδυ, με τρυφερή κουβέντα, γέλιο και κοινή θέα του φωτός που χαμηλώνει πριν φύγουν",
          "resonance": "Η σκηνή οργανώνεται από μια ήρεμη, ζεστή συντροφικότητα που κάνει τον κοινό χώρο να φαίνεται οικείος και βιωμένος.",
          "confidence": "high",
          "evidence_ids": [
            "D1"
          ],
          "evidence": [
            "Είδα ότι καθόμουν με δύο πολύ ζεστούς φίλους σε μια αυλή το βράδυ. Μιλούσαμε τρυφερά, γελούσαμε και βλέπαμε μαζί το φως να χαμηλώνει πριν φύγουμε."
          ]
        }
      ],
      "adjudication": {
        "decisions": [
          {
            "archetype_id": "lover",
            "decision": "reject",
            "decisive_feature": null,
            "reason": "Η σκηνή εξηγείται πλήρως ως ζεστή φιλική συντροφικότητα χωρίς ερωτικό, ρομαντικό ή αγαπημένο δεσμό που να οργανώνει το όνειρο.",
            "evidence_ids": [
              "D1"
            ]
          }
        ],
        "accepted_archetype_ids": []
      },
      "final_archetypes": [],
      "final_archetype_ids": []
    },
    {
      "fixture_id": "warm_friends_el",
      "semantic_success": true,
      "target_language": "el",
      "latency_ms": 4830,
      "discovery_archetypes": [
        {
          "archetype_id": "lover",
          "canonical_label": "Lover",
          "quality": "τρυφερή οικειότητα",
          "expression": "Καθισμένος με δύο πολύ ζεστούς φίλους σε αυλή το βράδυ, με τρυφερή κουβέντα, γέλιο και κοινή παρακολούθηση του φωτός που χαμηλώνει πριν φύγουν.",
          "resonance": "Η σκηνή οργανώνεται από μια ήρεμη, ζεστή εγγύτητα που κάνει τον κοινό χώρο να βιώνεται ως οικείος και συναισθηματικά κατοικημένος.",
          "confidence": "medium",
          "evidence_ids": [
            "D1"
          ],
          "evidence": [
            "Είδα ότι καθόμουν με δύο πολύ ζεστούς φίλους σε μια αυλή το βράδυ. Μιλούσαμε τρυφερά, γελούσαμε και βλέπαμε μαζί το φως να χαμηλώνει πριν φύγουμε."
          ]
        }
      ],
      "adjudication": {
        "decisions": [
          {
            "archetype_id": "lover",
            "decision": "reject",
            "decisive_feature": null,
            "reason": "Η σκηνή εξηγείται πλήρως ως ζεστή φιλική συντροφικότητα χωρίς ερωτικό ή αγαπημένο δεσμό που να οργανώνει το όνειρο.",
            "evidence_ids": [
              "D1"
            ]
          }
        ],
        "accepted_archetype_ids": []
      },
      "final_archetypes": [],
      "final_archetype_ids": []
    },
    {
      "fixture_id": "warm_friends_el",
      "semantic_success": true,
      "target_language": "el",
      "latency_ms": 4920,
      "discovery_archetypes": [
        {
          "archetype_id": "lover",
          "canonical_label": "Lover",
          "quality": "τρυφερή συντροφικότητα",
          "expression": "δύο πολύ ζεστοί φίλοι σε μια αυλή το βράδυ, με τρυφερή κουβέντα, γέλιο και κοινή θέα στο φως που χαμηλώνει πριν φύγουν",
          "resonance": "Η σκηνή οργανώνεται από μια ήρεμη, οικεία εγγύτητα που κάνει τον κοινό χώρο να φαίνεται θερμός και κατοικήσιμος.",
          "confidence": "high",
          "evidence_ids": [
            "D1"
          ],
          "evidence": [
            "Είδα ότι καθόμουν με δύο πολύ ζεστούς φίλους σε μια αυλή το βράδυ. Μιλούσαμε τρυφερά, γελούσαμε και βλέπαμε μαζί το φως να χαμηλώνει πριν φύγουμε."
          ]
        }
      ],
      "adjudication": {
        "decisions": [
          {
            "archetype_id": "lover",
            "decision": "reject",
            "decisive_feature": null,
            "reason": "Η σκηνή εξηγείται πλήρως ως ζεστή φιλική συντροφικότητα χωρίς ερωτικό, ρομαντικό ή αγαπημένο δεσμό που να οργανώνει το πεδίο.",
            "evidence_ids": [
              "D1"
            ]
          }
        ],
        "accepted_archetype_ids": []
      },
      "final_archetypes": [],
      "final_archetype_ids": []
    },
    {
      "fixture_id": "warm_friends_el",
      "semantic_success": true,
      "target_language": "el",
      "latency_ms": 3448,
      "discovery_archetypes": [
        {
          "archetype_id": "lover",
          "canonical_label": "Lover",
          "quality": "Τρυφερή συντροφικότητα",
          "expression": "Καθισμένοι σε μια αυλή το βράδυ, μιλούσατε τρυφερά, γελούσατε και παρακολουθούσατε μαζί το φως να χαμηλώνει πριν φύγετε.",
          "resonance": "Η σκηνή οργανώνεται από μια ζεστή, αμοιβαία εγγύτητα που κάνει τον κοινό χώρο να βιώνεται ως ασφαλής και οικείος.",
          "confidence": "high",
          "evidence_ids": [
            "D1"
          ],
          "evidence": [
            "Είδα ότι καθόμουν με δύο πολύ ζεστούς φίλους σε μια αυλή το βράδυ. Μιλούσαμε τρυφερά, γελούσαμε και βλέπαμε μαζί το φως να χαμηλώνει πριν φύγουμε."
          ]
        }
      ],
      "adjudication": {
        "decisions": [
          {
            "archetype_id": "lover",
            "decision": "reject",
            "decisive_feature": null,
            "reason": "Η σκηνή δείχνει τρυφερή φιλική συντροφικότητα και κοινή απόλαυση, χωρίς σαφή ερωτικό, ρομαντικό ή αγαπημένο δεσμό που να οργανώνει το όνειρο.",
            "evidence_ids": [
              "D1"
            ]
          }
        ],
        "accepted_archetype_ids": []
      },
      "final_archetypes": [],
      "final_archetype_ids": []
    },
    {
      "fixture_id": "warm_friends_el",
      "semantic_success": true,
      "target_language": "el",
      "latency_ms": 11263,
      "discovery_archetypes": [
        {
          "archetype_id": "lover",
          "canonical_label": "Lover",
          "quality": "τρυφερή συντροφικότητα",
          "expression": "δύο πολύ ζεστοί φίλοι σε αυλή το βράδυ, με τρυφερή κουβέντα, γέλιο και κοινή θέα του φωτός που χαμηλώνει πριν φύγουν",
          "resonance": "Η σκηνή οργανώνεται από μια ζεστή, οικεία σχέση που κάνει τον κοινό χώρο να νιώθει ασφαλής και ζωντανός.",
          "confidence": "medium",
          "evidence_ids": [
            "D1"
          ],
          "evidence": [
            "Είδα ότι καθόμουν με δύο πολύ ζεστούς φίλους σε μια αυλή το βράδυ. Μιλούσαμε τρυφερά, γελούσαμε και βλέπαμε μαζί το φως να χαμηλώνει πριν φύγουμε."
          ]
        }
      ],
      "adjudication": {
        "decisions": [
          {
            "archetype_id": "lover",
            "decision": "reject",
            "decisive_feature": null,
            "reason": "Η σκηνή εξηγείται πλήρως ως ζεστή φιλική συντροφικότητα χωρίς ερωτικό, ρομαντικό ή δεσμό-ζευγαριού χαρακτήρα.",
            "evidence_ids": [
              "D1"
            ]
          }
        ],
        "accepted_archetype_ids": []
      },
      "final_archetypes": [],
      "final_archetype_ids": []
    },
    {
      "fixture_id": "lover_negative_naturalistic_en",
      "semantic_success": true,
      "target_language": "en",
      "latency_ms": 4352,
      "discovery_archetypes": [
        {
          "archetype_id": "lover",
          "canonical_label": "Lover",
          "quality": "intimate belonging",
          "expression": "Two old friends sit shoulder to shoulder by a fire, speak tenderly, and feel completely at ease before saying goodnight.",
          "resonance": "The dream is organized by a quiet, settled intimacy that makes the shared space feel warm and mutually held.",
          "confidence": "medium",
          "evidence_ids": [
            "D1"
          ],
          "evidence": [
            "Two old friends sit shoulder to shoulder by a fire, speak tenderly, and feel completely at ease. They eventually say goodnight and return to their separate homes."
          ]
        }
      ],
      "adjudication": {
        "decisions": [
          {
            "archetype_id": "lover",
            "decision": "reject",
            "decisive_feature": null,
            "reason": "The scene shows tender companionship and ease between old friends, but no specifically romantic, erotic, or beloved bond beyond friendship.",
            "evidence_ids": [
              "D1"
            ]
          }
        ],
        "accepted_archetype_ids": []
      },
      "final_archetypes": [],
      "final_archetype_ids": []
    },
    {
      "fixture_id": "lover_negative_naturalistic_en",
      "semantic_success": true,
      "target_language": "en",
      "latency_ms": 6209,
      "discovery_archetypes": [
        {
          "archetype_id": "lover",
          "canonical_label": "Lover",
          "quality": "mutual intimate relatedness",
          "expression": "Two old friends sit shoulder to shoulder by a fire, speak tenderly, and feel completely at ease before parting for their separate homes.",
          "resonance": "The dream is organized by a warm, settled bond that makes the shared space feel safe and deeply inhabited.",
          "confidence": "high",
          "evidence_ids": [
            "D1"
          ],
          "evidence": [
            "Two old friends sit shoulder to shoulder by a fire, speak tenderly, and feel completely at ease. They eventually say goodnight and return to their separate homes."
          ]
        }
      ],
      "adjudication": {
        "decisions": [
          {
            "archetype_id": "lover",
            "decision": "reject",
            "decisive_feature": null,
            "reason": "The bond is warm and tender but reads as friendship and companionship rather than specifically romantic or beloved relatedness.",
            "evidence_ids": [
              "D1"
            ]
          }
        ],
        "accepted_archetype_ids": []
      },
      "final_archetypes": [],
      "final_archetype_ids": []
    },
    {
      "fixture_id": "lover_negative_naturalistic_en",
      "semantic_success": true,
      "target_language": "en",
      "latency_ms": 3377,
      "discovery_archetypes": [
        {
          "archetype_id": "lover",
          "canonical_label": "Lover",
          "quality": "mutual intimate relatedness",
          "expression": "Two old friends sit shoulder to shoulder by a fire, speak tenderly, and feel completely at ease before saying goodnight.",
          "resonance": "The dream is organized by a warm, resting bond that makes the shared space feel intimate and emotionally open.",
          "confidence": "high",
          "evidence_ids": [
            "D1"
          ],
          "evidence": [
            "Two old friends sit shoulder to shoulder by a fire, speak tenderly, and feel completely at ease. They eventually say goodnight and return to their separate homes."
          ]
        }
      ],
      "adjudication": {
        "decisions": [
          {
            "archetype_id": "lover",
            "decision": "reject",
            "decisive_feature": null,
            "reason": "The dream shows warmth and tenderness between old friends, but no specifically romantic, erotic, or beloved bond organizing the scene.",
            "evidence_ids": [
              "D1"
            ]
          }
        ],
        "accepted_archetype_ids": []
      },
      "final_archetypes": [],
      "final_archetype_ids": []
    },
    {
      "fixture_id": "lover_negative_naturalistic_en",
      "semantic_success": true,
      "target_language": "en",
      "latency_ms": 3843,
      "discovery_archetypes": [
        {
          "archetype_id": "lover",
          "canonical_label": "Lover",
          "quality": "mutual intimate relatedness",
          "expression": "Two old friends sit shoulder to shoulder by a fire, speak tenderly, and feel completely at ease before saying goodnight and going home separately.",
          "resonance": "The scene is organized by a warm, mutually held intimacy that feels safe and complete even within separation.",
          "confidence": "high",
          "evidence_ids": [
            "D1"
          ],
          "evidence": [
            "Two old friends sit shoulder to shoulder by a fire, speak tenderly, and feel completely at ease. They eventually say goodnight and return to their separate homes."
          ]
        }
      ],
      "adjudication": {
        "decisions": [
          {
            "archetype_id": "lover",
            "decision": "reject",
            "decisive_feature": null,
            "reason": "The scene shows tender friendship and ease, but no specifically romantic, erotic, or pair-bonded bond beyond companionship.",
            "evidence_ids": [
              "D1"
            ]
          }
        ],
        "accepted_archetype_ids": []
      },
      "final_archetypes": [],
      "final_archetype_ids": []
    },
    {
      "fixture_id": "lover_negative_naturalistic_en",
      "semantic_success": true,
      "target_language": "en",
      "latency_ms": 3297,
      "discovery_archetypes": [
        {
          "archetype_id": "lover",
          "canonical_label": "Lover",
          "quality": "mutual intimate relatedness",
          "expression": "Two old friends sit shoulder to shoulder by a fire, speak tenderly, and feel completely at ease before parting for their separate homes.",
          "resonance": "The dream is organized by a warm, mutual bond that makes the shared space feel safe and deeply inhabited.",
          "confidence": "high",
          "evidence_ids": [
            "D1"
          ],
          "evidence": [
            "Two old friends sit shoulder to shoulder by a fire, speak tenderly, and feel completely at ease. They eventually say goodnight and return to their separate homes."
          ]
        }
      ],
      "adjudication": {
        "decisions": [
          {
            "archetype_id": "lover",
            "decision": "reject",
            "decisive_feature": null,
            "reason": "The scene shows warm, tender companionship and separate homes, but no specifically romantic, erotic, pair-bonded, or beloved bond beyond friendship.",
            "evidence_ids": [
              "D1"
            ]
          }
        ],
        "accepted_archetype_ids": []
      },
      "final_archetypes": [],
      "final_archetype_ids": []
    },
    {
      "fixture_id": "incidental_partner_en",
      "semantic_success": true,
      "target_language": "en",
      "latency_ms": 3250,
      "discovery_archetypes": [
        {
          "archetype_id": "guide_psychopomp",
          "canonical_label": "Guide / Psychopomp",
          "quality": "threshold passage and coordination",
          "expression": "The station, train, tickets, luggage, and right platform create a scene of moving through a passage with practical orientation needed to get on the correct way.",
          "resonance": "The dream is organized by the need to navigate a crossing correctly, with attention focused on how passage becomes possible.",
          "confidence": "medium",
          "evidence_ids": [
            "D1"
          ],
          "evidence": [
            "I dreamed my partner and I were trying to catch a train and kept discussing tickets, luggage, and the right platform while hurrying through the station."
          ]
        }
      ],
      "adjudication": {
        "decisions": [
          {
            "archetype_id": "guide_psychopomp",
            "decision": "reject",
            "decisive_feature": null,
            "reason": "The dream shows only ordinary transit logistics at a station, with no guiding presence that actively mediates a meaningful crossing.",
            "evidence_ids": [
              "D1"
            ]
          }
        ],
        "accepted_archetype_ids": []
      },
      "final_archetypes": [],
      "final_archetype_ids": []
    },
    {
      "fixture_id": "incidental_partner_en",
      "semantic_success": true,
      "target_language": "en",
      "latency_ms": 3250,
      "discovery_archetypes": [
        {
          "archetype_id": "guide_psychopomp",
          "canonical_label": "Guide / Psychopomp",
          "quality": "threshold passage",
          "expression": "hurrying through the station while trying to catch a train and sorting out tickets, luggage, and the right platform",
          "resonance": "The dream is organized by the pressure of getting to the correct crossing point and moving through a threshold on time.",
          "confidence": "medium",
          "evidence_ids": [
            "D1"
          ],
          "evidence": [
            "I dreamed my partner and I were trying to catch a train and kept discussing tickets, luggage, and the right platform while hurrying through the station."
          ]
        }
      ],
      "adjudication": {
        "decisions": [
          {
            "archetype_id": "guide_psychopomp",
            "decision": "reject",
            "decisive_feature": null,
            "reason": "The dream shows only ordinary transit logistics at a station, with no guiding presence that enables a meaningful crossing.",
            "evidence_ids": [
              "D1"
            ]
          }
        ],
        "accepted_archetype_ids": []
      },
      "final_archetypes": [],
      "final_archetype_ids": []
    },
    {
      "fixture_id": "incidental_partner_en",
      "semantic_success": true,
      "target_language": "en",
      "latency_ms": 2513,
      "discovery_archetypes": [],
      "adjudication": {
        "decisions": [],
        "accepted_archetype_ids": []
      },
      "final_archetypes": [],
      "final_archetype_ids": []
    },
    {
      "fixture_id": "incidental_partner_en",
      "semantic_success": true,
      "target_language": "en",
      "latency_ms": 2562,
      "discovery_archetypes": [],
      "adjudication": {
        "decisions": [],
        "accepted_archetype_ids": []
      },
      "final_archetypes": [],
      "final_archetype_ids": []
    },
    {
      "fixture_id": "incidental_partner_en",
      "semantic_success": true,
      "target_language": "en",
      "latency_ms": 6874,
      "discovery_archetypes": [
        {
          "archetype_id": "guide_psychopomp",
          "canonical_label": "Guide / Psychopomp",
          "quality": "threshold crossing",
          "expression": "catching a train, checking tickets, and finding the right platform while moving through the station",
          "resonance": "The dream is organized by passage through a threshold, with the station and train creating a felt need to navigate correctly between one place and another.",
          "confidence": "medium",
          "evidence_ids": [
            "D1"
          ],
          "evidence": [
            "I dreamed my partner and I were trying to catch a train and kept discussing tickets, luggage, and the right platform while hurrying through the station."
          ]
        }
      ],
      "adjudication": {
        "decisions": [
          {
            "archetype_id": "guide_psychopomp",
            "decision": "reject",
            "decisive_feature": null,
            "reason": "The dream shows only ordinary transit logistics at a station, with no guiding presence that mediates a meaningful crossing.",
            "evidence_ids": [
              "D1"
            ]
          }
        ],
        "accepted_archetype_ids": []
      },
      "final_archetypes": [],
      "final_archetype_ids": []
    },
    {
      "fixture_id": "romance_cue_only_en",
      "semantic_success": true,
      "target_language": "en",
      "latency_ms": 7647,
      "discovery_archetypes": [
        {
          "archetype_id": "persona",
          "canonical_label": "Persona",
          "quality": "socially visible role",
          "expression": "the wedding setting, the crowd, and everyone pointing to the flowers, music, and couple place the dreamer as a mostly observing participant among public display",
          "resonance": "The dream is organized by outward ceremony and social presentation rather than private participation.",
          "confidence": "medium",
          "evidence_ids": [
            "D1"
          ],
          "evidence": [
            "I dreamed I was at a wedding where everyone kept pointing to the flowers, the music, and the couple, but I stayed mostly an observer in the crowd."
          ]
        }
      ],
      "adjudication": {
        "decisions": [
          {
            "archetype_id": "persona",
            "decision": "reject",
            "decisive_feature": null,
            "reason": "The dream shows only a wedding crowd and observation, not a social mask or role that constrains or conceals private self-expression.",
            "evidence_ids": [
              "D1"
            ]
          }
        ],
        "accepted_archetype_ids": []
      },
      "final_archetypes": [],
      "final_archetype_ids": []
    },
    {
      "fixture_id": "romance_cue_only_en",
      "semantic_success": true,
      "target_language": "en",
      "latency_ms": 14847,
      "discovery_archetypes": [
        {
          "archetype_id": "persona",
          "canonical_label": "Persona",
          "quality": "social role and public image",
          "expression": "a wedding scene with everyone pointing to the flowers, the music, and the couple while the dreamer remains mostly an observer in the crowd",
          "resonance": "The dream is organized by public presentation and social display rather than by private participation.",
          "confidence": "medium",
          "evidence_ids": [
            "D1"
          ],
          "evidence": [
            "I dreamed I was at a wedding where everyone kept pointing to the flowers, the music, and the couple, but I stayed mostly an observer in the crowd."
          ]
        }
      ],
      "adjudication": {
        "decisions": [
          {
            "archetype_id": "persona",
            "decision": "reject",
            "decisive_feature": null,
            "reason": "The dream shows a wedding crowd and observation only, without any public role actively constraining or concealing private expression.",
            "evidence_ids": [
              "D1"
            ]
          }
        ],
        "accepted_archetype_ids": []
      },
      "final_archetypes": [],
      "final_archetype_ids": []
    },
    {
      "fixture_id": "romance_cue_only_en",
      "semantic_success": true,
      "target_language": "en",
      "latency_ms": 6973,
      "discovery_archetypes": [
        {
          "archetype_id": "persona",
          "canonical_label": "Persona",
          "quality": "social role and public display",
          "expression": "a wedding setting where everyone points to the flowers, the music, and the couple while the dreamer remains an observer in the crowd",
          "resonance": "The dream is organized around public presentation and collective attention, with the dreamer positioned outside the performed social scene.",
          "confidence": "medium",
          "evidence_ids": [
            "D1"
          ],
          "evidence": [
            "I dreamed I was at a wedding where everyone kept pointing to the flowers, the music, and the couple, but I stayed mostly an observer in the crowd."
          ]
        }
      ],
      "adjudication": {
        "decisions": [
          {
            "archetype_id": "persona",
            "decision": "reject",
            "decisive_feature": null,
            "reason": "The dream shows only a wedding crowd and the dreamer as an observer, without a public role constraining or displacing private self-expression.",
            "evidence_ids": [
              "D1"
            ]
          }
        ],
        "accepted_archetype_ids": []
      },
      "final_archetypes": [],
      "final_archetype_ids": []
    },
    {
      "fixture_id": "romance_cue_only_en",
      "semantic_success": true,
      "target_language": "en",
      "latency_ms": 3275,
      "discovery_archetypes": [
        {
          "archetype_id": "persona",
          "canonical_label": "Persona",
          "quality": "public role over private participation",
          "expression": "At the wedding, everyone points to the flowers, music, and couple while the dreamer remains mostly an observer in the crowd.",
          "resonance": "The dream is organized around being present in a public scene without fully entering its performed social role.",
          "confidence": "medium",
          "evidence_ids": [
            "D1"
          ],
          "evidence": [
            "I dreamed I was at a wedding where everyone kept pointing to the flowers, the music, and the couple, but I stayed mostly an observer in the crowd."
          ]
        }
      ],
      "adjudication": {
        "decisions": [
          {
            "archetype_id": "persona",
            "decision": "reject",
            "decisive_feature": null,
            "reason": "The dream shows only a wedding setting and the dreamer as a spectator, without any public role constraining or replacing private expression.",
            "evidence_ids": [
              "D1"
            ]
          }
        ],
        "accepted_archetype_ids": []
      },
      "final_archetypes": [],
      "final_archetype_ids": []
    },
    {
      "fixture_id": "romance_cue_only_en",
      "semantic_success": true,
      "target_language": "en",
      "latency_ms": 2852,
      "discovery_archetypes": [
        {
          "archetype_id": "persona",
          "canonical_label": "Persona",
          "quality": "public role and observed presentation",
          "expression": "a wedding scene where everyone points to the flowers, the music, and the couple while the dreamer remains mostly an observer in the crowd",
          "resonance": "The dream centers on being positioned as a watcher within a public ceremonial setting rather than fully participating in private feeling.",
          "confidence": "medium",
          "evidence_ids": [
            "D1"
          ],
          "evidence": [
            "I dreamed I was at a wedding where everyone kept pointing to the flowers, the music, and the couple, but I stayed mostly an observer in the crowd."
          ]
        }
      ],
      "adjudication": {
        "decisions": [
          {
            "archetype_id": "persona",
            "decision": "reject",
            "decisive_feature": null,
            "reason": "The dream shows only a wedding crowd and the dreamer as an observer, without any public role constraining or displacing private self-expression.",
            "evidence_ids": [
              "D1"
            ]
          }
        ],
        "accepted_archetype_ids": []
      },
      "final_archetypes": [],
      "final_archetype_ids": []
    },
    {
      "fixture_id": "guide_positive_en",
      "semantic_success": true,
      "target_language": "en",
      "latency_ms": 3318,
      "discovery_archetypes": [
        {
          "archetype_id": "guide_psychopomp",
          "canonical_label": "Guide / Psychopomp",
          "quality": "threshold guidance",
          "expression": "An old ferryman leads the dreamer across a dark river and tells exactly when to step onto the other bank.",
          "resonance": "The ferryman organizes the dream as a guided crossing where passage depends on knowing the way.",
          "confidence": "high",
          "evidence_ids": [
            "D1"
          ],
          "evidence": [
            "I dreamed an old ferryman led me across a dark river and told me exactly when I could step onto the other bank. Without him I would not have known how to cross."
          ]
        }
      ],
      "adjudication": {
        "decisions": [
          {
            "archetype_id": "guide_psychopomp",
            "decision": "accept",
            "decisive_feature": "A guiding presence that tells the dreamer when and how to cross the river",
            "reason": "The ferryman actively enables a crossing the dreamer could not navigate alone.",
            "evidence_ids": [
              "D1"
            ]
          }
        ],
        "accepted_archetype_ids": [
          "guide_psychopomp"
        ]
      },
      "final_archetypes": [
        {
          "archetype_id": "guide_psychopomp",
          "canonical_label": "Guide / Psychopomp",
          "quality": "threshold guidance",
          "expression": "An old ferryman leads the dreamer across a dark river and tells exactly when to step onto the other bank.",
          "resonance": "The ferryman organizes the dream as a guided crossing where passage depends on knowing the way.",
          "confidence": "high",
          "evidence_ids": [
            "D1"
          ],
          "evidence": [
            "I dreamed an old ferryman led me across a dark river and told me exactly when I could step onto the other bank. Without him I would not have known how to cross."
          ]
        }
      ],
      "final_archetype_ids": [
        "guide_psychopomp"
      ]
    },
    {
      "fixture_id": "guide_positive_en",
      "semantic_success": true,
      "target_language": "en",
      "latency_ms": 4298,
      "discovery_archetypes": [
        {
          "archetype_id": "guide_psychopomp",
          "canonical_label": "Guide / Psychopomp",
          "quality": "threshold guidance",
          "expression": "An old ferryman leads the dreamer across a dark river and tells exactly when to step onto the other bank.",
          "resonance": "The ferryman organizes the dream as a guided passage across a threshold that could not be crossed alone.",
          "confidence": "high",
          "evidence_ids": [
            "D1"
          ],
          "evidence": [
            "I dreamed an old ferryman led me across a dark river and told me exactly when I could step onto the other bank. Without him I would not have known how to cross."
          ]
        }
      ],
      "adjudication": {
        "decisions": [
          {
            "archetype_id": "guide_psychopomp",
            "decision": "accept",
            "decisive_feature": "an enabling guide who tells the dreamer when to cross the river",
            "reason": "The ferryman actively mediates a meaningful crossing that the dreamer could not navigate alone.",
            "evidence_ids": [
              "D1"
            ]
          }
        ],
        "accepted_archetype_ids": [
          "guide_psychopomp"
        ]
      },
      "final_archetypes": [
        {
          "archetype_id": "guide_psychopomp",
          "canonical_label": "Guide / Psychopomp",
          "quality": "threshold guidance",
          "expression": "An old ferryman leads the dreamer across a dark river and tells exactly when to step onto the other bank.",
          "resonance": "The ferryman organizes the dream as a guided passage across a threshold that could not be crossed alone.",
          "confidence": "high",
          "evidence_ids": [
            "D1"
          ],
          "evidence": [
            "I dreamed an old ferryman led me across a dark river and told me exactly when I could step onto the other bank. Without him I would not have known how to cross."
          ]
        }
      ],
      "final_archetype_ids": [
        "guide_psychopomp"
      ]
    },
    {
      "fixture_id": "guide_positive_en",
      "semantic_success": true,
      "target_language": "en",
      "latency_ms": 3245,
      "discovery_archetypes": [
        {
          "archetype_id": "guide_psychopomp",
          "canonical_label": "Guide / Psychopomp",
          "quality": "threshold guidance",
          "expression": "An old ferryman leads the dreamer across a dark river and tells exactly when to step onto the other bank.",
          "resonance": "The ferryman organizes the dream as a meaningful passage across a boundary that would be impossible without his guidance.",
          "confidence": "high",
          "evidence_ids": [
            "D1"
          ],
          "evidence": [
            "I dreamed an old ferryman led me across a dark river and told me exactly when I could step onto the other bank. Without him I would not have known how to cross."
          ]
        }
      ],
      "adjudication": {
        "decisions": [
          {
            "archetype_id": "guide_psychopomp",
            "decision": "accept",
            "decisive_feature": "An old ferryman knows and times the crossing across a dark river",
            "reason": "The ferryman actively mediates a meaningful passage the dreamer could not otherwise navigate.",
            "evidence_ids": [
              "D1"
            ]
          }
        ],
        "accepted_archetype_ids": [
          "guide_psychopomp"
        ]
      },
      "final_archetypes": [
        {
          "archetype_id": "guide_psychopomp",
          "canonical_label": "Guide / Psychopomp",
          "quality": "threshold guidance",
          "expression": "An old ferryman leads the dreamer across a dark river and tells exactly when to step onto the other bank.",
          "resonance": "The ferryman organizes the dream as a meaningful passage across a boundary that would be impossible without his guidance.",
          "confidence": "high",
          "evidence_ids": [
            "D1"
          ],
          "evidence": [
            "I dreamed an old ferryman led me across a dark river and told me exactly when I could step onto the other bank. Without him I would not have known how to cross."
          ]
        }
      ],
      "final_archetype_ids": [
        "guide_psychopomp"
      ]
    },
    {
      "fixture_id": "guide_positive_en",
      "semantic_success": true,
      "target_language": "en",
      "latency_ms": 12188,
      "discovery_archetypes": [
        {
          "archetype_id": "guide_psychopomp",
          "canonical_label": "Guide / Psychopomp",
          "quality": "threshold guidance",
          "expression": "An old ferryman leads the dreamer across a dark river and tells exactly when to step onto the far bank.",
          "resonance": "The ferryman organizes the dream as a guided crossing between states, making passage possible through precise knowledge of the threshold.",
          "confidence": "high",
          "evidence_ids": [
            "D1"
          ],
          "evidence": [
            "I dreamed an old ferryman led me across a dark river and told me exactly when I could step onto the other bank. Without him I would not have known how to cross."
          ]
        }
      ],
      "adjudication": {
        "decisions": [
          {
            "archetype_id": "guide_psychopomp",
            "decision": "accept",
            "decisive_feature": "an old ferryman who knows exactly when the crossing can happen",
            "reason": "The ferryman actively mediates a crossing the dreamer could not navigate alone.",
            "evidence_ids": [
              "D1"
            ]
          }
        ],
        "accepted_archetype_ids": [
          "guide_psychopomp"
        ]
      },
      "final_archetypes": [
        {
          "archetype_id": "guide_psychopomp",
          "canonical_label": "Guide / Psychopomp",
          "quality": "threshold guidance",
          "expression": "An old ferryman leads the dreamer across a dark river and tells exactly when to step onto the far bank.",
          "resonance": "The ferryman organizes the dream as a guided crossing between states, making passage possible through precise knowledge of the threshold.",
          "confidence": "high",
          "evidence_ids": [
            "D1"
          ],
          "evidence": [
            "I dreamed an old ferryman led me across a dark river and told me exactly when I could step onto the other bank. Without him I would not have known how to cross."
          ]
        }
      ],
      "final_archetype_ids": [
        "guide_psychopomp"
      ]
    },
    {
      "fixture_id": "guide_negative_carrier_only_en",
      "semantic_success": true,
      "target_language": "en",
      "latency_ms": 3850,
      "discovery_archetypes": [
        {
          "archetype_id": "guide_psychopomp",
          "canonical_label": "Guide / Psychopomp",
          "quality": "threshold guidance",
          "expression": "an older taxi driver takes the dreamer to the airport and then drives away, leaving the dreamer at the point of departure",
          "resonance": "The scene is organized by a brief escort across a threshold, after which the dreamer must continue alone.",
          "confidence": "medium",
          "evidence_ids": [
            "D1"
          ],
          "evidence": [
            "I dreamed an older taxi driver took me to the airport, dropped me off, and drove away while I dealt with the rest by myself."
          ]
        }
      ],
      "adjudication": {
        "decisions": [
          {
            "archetype_id": "guide_psychopomp",
            "decision": "reject",
            "decisive_feature": null,
            "reason": "The taxi driver performs ordinary transport to the airport, with no evidence of active mediation or enabling a meaningful crossing beyond logistics.",
            "evidence_ids": [
              "D1"
            ]
          }
        ],
        "accepted_archetype_ids": []
      },
      "final_archetypes": [],
      "final_archetype_ids": []
    },
    {
      "fixture_id": "guide_negative_carrier_only_en",
      "semantic_success": true,
      "target_language": "en",
      "latency_ms": 1595,
      "discovery_archetypes": [],
      "adjudication": {
        "decisions": [],
        "accepted_archetype_ids": []
      },
      "final_archetypes": [],
      "final_archetype_ids": []
    },
    {
      "fixture_id": "guide_positive_en",
      "semantic_success": true,
      "target_language": "en",
      "latency_ms": 8133,
      "discovery_archetypes": [
        {
          "archetype_id": "guide_psychopomp",
          "canonical_label": "Guide / Psychopomp",
          "quality": "threshold guidance",
          "expression": "An old ferryman leads the dreamer across a dark river and tells exactly when to step onto the other bank.",
          "resonance": "The ferryman organizes the dream as a meaningful passage across a threshold that depends on knowing the way.",
          "confidence": "high",
          "evidence_ids": [
            "D1"
          ],
          "evidence": [
            "I dreamed an old ferryman led me across a dark river and told me exactly when I could step onto the other bank. Without him I would not have known how to cross."
          ]
        }
      ],
      "adjudication": {
        "decisions": [
          {
            "archetype_id": "guide_psychopomp",
            "decision": "accept",
            "decisive_feature": "The ferryman knows and mediates the exact timing of the crossing",
            "reason": "A guiding presence actively enables a meaningful passage the dreamer could not otherwise navigate.",
            "evidence_ids": [
              "D1"
            ]
          }
        ],
        "accepted_archetype_ids": [
          "guide_psychopomp"
        ]
      },
      "final_archetypes": [
        {
          "archetype_id": "guide_psychopomp",
          "canonical_label": "Guide / Psychopomp",
          "quality": "threshold guidance",
          "expression": "An old ferryman leads the dreamer across a dark river and tells exactly when to step onto the other bank.",
          "resonance": "The ferryman organizes the dream as a meaningful passage across a threshold that depends on knowing the way.",
          "confidence": "high",
          "evidence_ids": [
            "D1"
          ],
          "evidence": [
            "I dreamed an old ferryman led me across a dark river and told me exactly when I could step onto the other bank. Without him I would not have known how to cross."
          ]
        }
      ],
      "final_archetype_ids": [
        "guide_psychopomp"
      ]
    },
    {
      "fixture_id": "guide_negative_carrier_only_en",
      "semantic_success": true,
      "target_language": "en",
      "latency_ms": 4278,
      "discovery_archetypes": [
        {
          "archetype_id": "guide_psychopomp",
          "canonical_label": "Guide / Psychopomp",
          "quality": "threshold escort",
          "expression": "An older taxi driver takes the dreamer to the airport and then drives away, leaving the crossing to be completed alone.",
          "resonance": "The scene centers on being brought to a threshold and then released to continue the passage independently.",
          "confidence": "medium",
          "evidence_ids": [
            "D1"
          ],
          "evidence": [
            "I dreamed an older taxi driver took me to the airport, dropped me off, and drove away while I dealt with the rest by myself."
          ]
        }
      ],
      "adjudication": {
        "decisions": [
          {
            "archetype_id": "guide_psychopomp",
            "decision": "reject",
            "decisive_feature": null,
            "reason": "The taxi driver provides ordinary transport to an airport and then leaves; there is no evidence of active mediation or enabling a meaningful crossing beyond logistics.",
            "evidence_ids": [
              "D1"
            ]
          }
        ],
        "accepted_archetype_ids": []
      },
      "final_archetypes": [],
      "final_archetype_ids": []
    },
    {
      "fixture_id": "guide_negative_carrier_only_en",
      "semantic_success": true,
      "target_language": "en",
      "latency_ms": 3468,
      "discovery_archetypes": [
        {
          "archetype_id": "guide_psychopomp",
          "canonical_label": "Guide / Psychopomp",
          "quality": "threshold guidance",
          "expression": "an older taxi driver takes the dreamer to the airport and drops them off at the point of departure",
          "resonance": "The scene is organized by a brief escort to a crossing, then release into solo passage.",
          "confidence": "medium",
          "evidence_ids": [
            "D1"
          ],
          "evidence": [
            "I dreamed an older taxi driver took me to the airport, dropped me off, and drove away while I dealt with the rest by myself."
          ]
        }
      ],
      "adjudication": {
        "decisions": [
          {
            "archetype_id": "guide_psychopomp",
            "decision": "reject",
            "decisive_feature": null,
            "reason": "The taxi driver provides ordinary transport to an airport and does not actively mediate a psychologically meaningful crossing.",
            "evidence_ids": [
              "D1"
            ]
          }
        ],
        "accepted_archetype_ids": []
      },
      "final_archetypes": [],
      "final_archetype_ids": []
    },
    {
      "fixture_id": "guide_negative_carrier_only_en",
      "semantic_success": true,
      "target_language": "en",
      "latency_ms": 4508,
      "discovery_archetypes": [
        {
          "archetype_id": "guide_psychopomp",
          "canonical_label": "Guide / Psychopomp",
          "quality": "threshold escort",
          "expression": "An older taxi driver takes the dreamer to the airport and drops them off before driving away.",
          "resonance": "The taxi driver functions as a brief escort to a threshold, then withdraws as the dreamer continues on alone.",
          "confidence": "medium",
          "evidence_ids": [
            "D1"
          ],
          "evidence": [
            "I dreamed an older taxi driver took me to the airport, dropped me off, and drove away while I dealt with the rest by myself."
          ]
        }
      ],
      "adjudication": {
        "decisions": [
          {
            "archetype_id": "guide_psychopomp",
            "decision": "reject",
            "decisive_feature": null,
            "reason": "The taxi driver provides ordinary transport to an airport and then leaves, with no evidence of mediation or enabling a meaningful crossing beyond logistics.",
            "evidence_ids": [
              "D1"
            ]
          }
        ],
        "accepted_archetype_ids": []
      },
      "final_archetypes": [],
      "final_archetype_ids": []
    },
    {
      "fixture_id": "shadow_positive_en",
      "semantic_success": true,
      "target_language": "en",
      "latency_ms": 3884,
      "discovery_archetypes": [
        {
          "archetype_id": "shadow",
          "canonical_label": "Shadow",
          "quality": "disowned vitality confronting the self",
          "expression": "A filthy, furious version of the dreamer stands outside the lit house and keeps staring until it is admitted as belonging to the dreamer’s own life.",
          "resonance": "The dream is organized by a rejected part of the self pressing from outside until it is recognized as belonging inwardly.",
          "confidence": "high",
          "evidence_ids": [
            "D1"
          ],
          "evidence": [
            "I dreamed a filthy, furious version of me stood outside the lit house and kept staring until I admitted it belonged to my own life."
          ]
        }
      ],
      "adjudication": {
        "decisions": [
          {
            "archetype_id": "shadow",
            "decision": "accept",
            "decisive_feature": "a filthy, furious version of the dreamer is recognized as belonging to the dreamer’s own life",
            "reason": "The threatening figure is explicitly self-referential and presses for ownership, which fits a disowned aspect of the dreamer.",
            "evidence_ids": [
              "D1"
            ]
          }
        ],
        "accepted_archetype_ids": [
          "shadow"
        ]
      },
      "final_archetypes": [
        {
          "archetype_id": "shadow",
          "canonical_label": "Shadow",
          "quality": "disowned vitality confronting the self",
          "expression": "A filthy, furious version of the dreamer stands outside the lit house and keeps staring until it is admitted as belonging to the dreamer’s own life.",
          "resonance": "The dream is organized by a rejected part of the self pressing from outside until it is recognized as belonging inwardly.",
          "confidence": "high",
          "evidence_ids": [
            "D1"
          ],
          "evidence": [
            "I dreamed a filthy, furious version of me stood outside the lit house and kept staring until I admitted it belonged to my own life."
          ]
        }
      ],
      "final_archetype_ids": [
        "shadow"
      ]
    },
    {
      "fixture_id": "shadow_positive_en",
      "semantic_success": true,
      "target_language": "en",
      "latency_ms": 3182,
      "discovery_archetypes": [
        {
          "archetype_id": "shadow",
          "canonical_label": "Shadow",
          "quality": "rejected vitality confronting the self",
          "expression": "a filthy, furious version of me stands outside the lit house and stares until I admit it belongs to my own life",
          "resonance": "The dream centers on an excluded counterpart pressing for recognition as part of the dreamer’s life.",
          "confidence": "high",
          "evidence_ids": [
            "D1"
          ],
          "evidence": [
            "I dreamed a filthy, furious version of me stood outside the lit house and kept staring until I admitted it belonged to my own life."
          ]
        }
      ],
      "adjudication": {
        "decisions": [
          {
            "archetype_id": "shadow",
            "decision": "accept",
            "decisive_feature": "a filthy, furious version of me that is recognized as part of my own life",
            "reason": "The disturbing figure is explicitly a self-linked, disowned version of the dreamer that presses for recognition.",
            "evidence_ids": [
              "D1"
            ]
          }
        ],
        "accepted_archetype_ids": [
          "shadow"
        ]
      },
      "final_archetypes": [
        {
          "archetype_id": "shadow",
          "canonical_label": "Shadow",
          "quality": "rejected vitality confronting the self",
          "expression": "a filthy, furious version of me stands outside the lit house and stares until I admit it belongs to my own life",
          "resonance": "The dream centers on an excluded counterpart pressing for recognition as part of the dreamer’s life.",
          "confidence": "high",
          "evidence_ids": [
            "D1"
          ],
          "evidence": [
            "I dreamed a filthy, furious version of me stood outside the lit house and kept staring until I admitted it belonged to my own life."
          ]
        }
      ],
      "final_archetype_ids": [
        "shadow"
      ]
    },
    {
      "fixture_id": "shadow_positive_en",
      "semantic_success": true,
      "target_language": "en",
      "latency_ms": 3745,
      "discovery_archetypes": [
        {
          "archetype_id": "shadow",
          "canonical_label": "Shadow",
          "quality": "disowned self confronting the ego",
          "expression": "A filthy, furious version of the dreamer stands outside the lit house and stares until it is acknowledged as part of the dreamer’s own life.",
          "resonance": "The dream is organized by a rejected but personally owned force pressing for recognition from the outside.",
          "confidence": "high",
          "evidence_ids": [
            "D1"
          ],
          "evidence": [
            "I dreamed a filthy, furious version of me stood outside the lit house and kept staring until I admitted it belonged to my own life."
          ]
        }
      ],
      "adjudication": {
        "decisions": [
          {
            "archetype_id": "shadow",
            "decision": "accept",
            "decisive_feature": "a filthy, furious version of me outside the house demanding recognition as part of my own life",
            "reason": "The disturbing figure is explicitly identified as a disowned version of the dreamer and presses for ownership and encounter.",
            "evidence_ids": [
              "D1"
            ]
          }
        ],
        "accepted_archetype_ids": [
          "shadow"
        ]
      },
      "final_archetypes": [
        {
          "archetype_id": "shadow",
          "canonical_label": "Shadow",
          "quality": "disowned self confronting the ego",
          "expression": "A filthy, furious version of the dreamer stands outside the lit house and stares until it is acknowledged as part of the dreamer’s own life.",
          "resonance": "The dream is organized by a rejected but personally owned force pressing for recognition from the outside.",
          "confidence": "high",
          "evidence_ids": [
            "D1"
          ],
          "evidence": [
            "I dreamed a filthy, furious version of me stood outside the lit house and kept staring until I admitted it belonged to my own life."
          ]
        }
      ],
      "final_archetype_ids": [
        "shadow"
      ]
    },
    {
      "fixture_id": "shadow_positive_en",
      "semantic_success": true,
      "target_language": "en",
      "latency_ms": 3658,
      "discovery_archetypes": [
        {
          "archetype_id": "shadow",
          "canonical_label": "Shadow",
          "quality": "disowned vitality confronting the self",
          "expression": "A filthy, furious version of me stands outside the lit house and stares until it is admitted as part of my own life.",
          "resonance": "The dream is organized by a rejected counterpart pressing in from the edge until it is recognized as belonging to the dreamer.",
          "confidence": "high",
          "evidence_ids": [
            "D1"
          ],
          "evidence": [
            "I dreamed a filthy, furious version of me stood outside the lit house and kept staring until I admitted it belonged to my own life."
          ]
        }
      ],
      "adjudication": {
        "decisions": [
          {
            "archetype_id": "shadow",
            "decision": "accept",
            "decisive_feature": "a filthy, furious version of me that must be admitted as my own life",
            "reason": "The disturbing figure is explicitly a rejected self-aspect pressing for recognition and ownership.",
            "evidence_ids": [
              "D1"
            ]
          }
        ],
        "accepted_archetype_ids": [
          "shadow"
        ]
      },
      "final_archetypes": [
        {
          "archetype_id": "shadow",
          "canonical_label": "Shadow",
          "quality": "disowned vitality confronting the self",
          "expression": "A filthy, furious version of me stands outside the lit house and stares until it is admitted as part of my own life.",
          "resonance": "The dream is organized by a rejected counterpart pressing in from the edge until it is recognized as belonging to the dreamer.",
          "confidence": "high",
          "evidence_ids": [
            "D1"
          ],
          "evidence": [
            "I dreamed a filthy, furious version of me stood outside the lit house and kept staring until I admitted it belonged to my own life."
          ]
        }
      ],
      "final_archetype_ids": [
        "shadow"
      ]
    },
    {
      "fixture_id": "shadow_positive_en",
      "semantic_success": true,
      "target_language": "en",
      "latency_ms": 13810,
      "discovery_archetypes": [
        {
          "archetype_id": "shadow",
          "canonical_label": "Shadow",
          "quality": "disowned self confronting awareness",
          "expression": "a filthy, furious version of me stands outside the lit house and stares until it is admitted as part of my own life",
          "resonance": "The dream is organized by a rejected but intimately related presence that demands recognition from the edge of the self.",
          "confidence": "high",
          "evidence_ids": [
            "D1"
          ],
          "evidence": [
            "I dreamed a filthy, furious version of me stood outside the lit house and kept staring until I admitted it belonged to my own life."
          ]
        }
      ],
      "adjudication": {
        "decisions": [
          {
            "archetype_id": "shadow",
            "decision": "accept",
            "decisive_feature": "a filthy, furious version of me that must be admitted as part of my own life",
            "reason": "The dream links the disturbing figure to a disowned part of the dreamer and makes recognition the key action.",
            "evidence_ids": [
              "D1"
            ]
          }
        ],
        "accepted_archetype_ids": [
          "shadow"
        ]
      },
      "final_archetypes": [
        {
          "archetype_id": "shadow",
          "canonical_label": "Shadow",
          "quality": "disowned self confronting awareness",
          "expression": "a filthy, furious version of me stands outside the lit house and stares until it is admitted as part of my own life",
          "resonance": "The dream is organized by a rejected but intimately related presence that demands recognition from the edge of the self.",
          "confidence": "high",
          "evidence_ids": [
            "D1"
          ],
          "evidence": [
            "I dreamed a filthy, furious version of me stood outside the lit house and kept staring until I admitted it belonged to my own life."
          ]
        }
      ],
      "final_archetype_ids": [
        "shadow"
      ]
    },
    {
      "fixture_id": "shadow_negative_danger_only_en",
      "semantic_success": true,
      "target_language": "en",
      "latency_ms": 3080,
      "discovery_archetypes": [
        {
          "archetype_id": "shadow",
          "canonical_label": "Shadow",
          "quality": "rejected threat at the edge",
          "expression": "Running through a dark alley while sensing something dangerous behind, with the pursuer never seen",
          "resonance": "The dream is organized by an unnamed threatening force that remains outside direct recognition and presses from behind.",
          "confidence": "medium",
          "evidence_ids": [
            "D1"
          ],
          "evidence": [
            "I dreamed I was running through a dark alley because I thought something dangerous might be behind me, but I never saw who or what it was."
          ]
        }
      ],
      "adjudication": {
        "decisions": [
          {
            "archetype_id": "shadow",
            "decision": "reject",
            "decisive_feature": null,
            "reason": "The dream shows only an unseen threat and pursuit, with no link to a rejected or unowned aspect of the dreamer.",
            "evidence_ids": [
              "D1"
            ]
          }
        ],
        "accepted_archetype_ids": []
      },
      "final_archetypes": [],
      "final_archetype_ids": []
    },
    {
      "fixture_id": "shadow_negative_danger_only_en",
      "semantic_success": true,
      "target_language": "en",
      "latency_ms": 3497,
      "discovery_archetypes": [
        {
          "archetype_id": "shadow",
          "canonical_label": "Shadow",
          "quality": "rejected threat at the edge",
          "expression": "A feared presence may be behind the dreamer in a dark alley, but it never takes shape or appears directly.",
          "resonance": "The dream is organized by an unnamed threatening presence that stays outside visibility and presses from behind.",
          "confidence": "medium",
          "evidence_ids": [
            "D1"
          ],
          "evidence": [
            "I dreamed I was running through a dark alley because I thought something dangerous might be behind me, but I never saw who or what it was."
          ]
        }
      ],
      "adjudication": {
        "decisions": [
          {
            "archetype_id": "shadow",
            "decision": "reject",
            "decisive_feature": null,
            "reason": "The dream shows only an unseen threat and pursuit, with no link to a rejected or disowned aspect of the dreamer.",
            "evidence_ids": [
              "D1"
            ]
          }
        ],
        "accepted_archetype_ids": []
      },
      "final_archetypes": [],
      "final_archetype_ids": []
    },
    {
      "fixture_id": "shadow_negative_danger_only_en",
      "semantic_success": true,
      "target_language": "en",
      "latency_ms": 5273,
      "discovery_archetypes": [
        {
          "archetype_id": "shadow",
          "canonical_label": "Shadow",
          "quality": "unseen rejected threat",
          "expression": "Running through a dark alley while sensing something dangerous behind without ever seeing it",
          "resonance": "The dream is organized by an unnamed threatening presence that stays just outside perception and charges the scene from the edge.",
          "confidence": "high",
          "evidence_ids": [
            "D1"
          ],
          "evidence": [
            "I dreamed I was running through a dark alley because I thought something dangerous might be behind me, but I never saw who or what it was."
          ]
        }
      ],
      "adjudication": {
        "decisions": [
          {
            "archetype_id": "shadow",
            "decision": "reject",
            "decisive_feature": null,
            "reason": "The dream shows only an unseen danger and pursuit, with no link to a rejected or disowned part of the dreamer.",
            "evidence_ids": [
              "D1"
            ]
          }
        ],
        "accepted_archetype_ids": []
      },
      "final_archetypes": [],
      "final_archetype_ids": []
    },
    {
      "fixture_id": "shadow_negative_danger_only_en",
      "semantic_success": true,
      "target_language": "en",
      "latency_ms": 20000,
      "discovery_archetypes": [
        {
          "archetype_id": "shadow",
          "canonical_label": "Shadow",
          "quality": "rejected threat at the edge",
          "expression": "Running through a dark alley with an unseen dangerous presence behind the dreamer.",
          "resonance": "The dream is organized by an excluded, threatening force that is felt as behind and unnamed rather than directly seen.",
          "confidence": "medium",
          "evidence_ids": [
            "D1"
          ],
          "evidence": [
            "I dreamed I was running through a dark alley because I thought something dangerous might be behind me, but I never saw who or what it was."
          ]
        }
      ],
      "adjudication": {
        "decisions": [
          {
            "archetype_id": "shadow",
            "decision": "reject",
            "decisive_feature": null,
            "reason": "The dream shows only an unseen threat and pursuit, with no link to a rejected or disowned aspect of the dreamer.",
            "evidence_ids": [
              "D1"
            ]
          }
        ],
        "accepted_archetype_ids": []
      },
      "final_archetypes": [],
      "final_archetype_ids": []
    },
    {
      "fixture_id": "shadow_negative_danger_only_en",
      "semantic_success": true,
      "target_language": "en",
      "latency_ms": 5589,
      "discovery_archetypes": [
        {
          "archetype_id": "shadow",
          "canonical_label": "Shadow",
          "quality": "unseen threatening force",
          "expression": "running through a dark alley while sensing something dangerous behind, but never seeing what it was",
          "resonance": "The dream centers on an excluded threat that is felt but not yet known or faced.",
          "confidence": "medium",
          "evidence_ids": [
            "D1"
          ],
          "evidence": [
            "I dreamed I was running through a dark alley because I thought something dangerous might be behind me, but I never saw who or what it was."
          ]
        }
      ],
      "adjudication": {
        "decisions": [
          {
            "archetype_id": "shadow",
            "decision": "reject",
            "decisive_feature": null,
            "reason": "The dream shows only an unseen danger and pursuit, with no link to a rejected or disowned part of the dreamer.",
            "evidence_ids": [
              "D1"
            ]
          }
        ],
        "accepted_archetype_ids": []
      },
      "final_archetypes": [],
      "final_archetype_ids": []
    },
    {
      "fixture_id": "persona_positive_en",
      "semantic_success": true,
      "target_language": "en",
      "latency_ms": 3451,
      "discovery_archetypes": [
        {
          "archetype_id": "persona",
          "canonical_label": "Persona",
          "quality": "social mask under pressure",
          "expression": "A formal uniform and the need to keep smiling while privately wanting to run away and speak the truth.",
          "resonance": "The dream is organized by the tension between outward role and inward self, with the role holding the event together.",
          "confidence": "high",
          "evidence_ids": [
            "D1"
          ],
          "evidence": [
            "I dreamed I had to keep smiling in a formal uniform while inside I wanted to run away and say who I really was. The whole event depended on the role holding."
          ]
        }
      ],
      "adjudication": {
        "decisions": [
          {
            "archetype_id": "persona",
            "decision": "accept",
            "decisive_feature": "public role suppresses private self-expression",
            "reason": "The formal uniform and required smiling actively constrain the dreamer’s private desire to flee and speak truth, showing a socially imposed mask.",
            "evidence_ids": [
              "D1"
            ]
          }
        ],
        "accepted_archetype_ids": [
          "persona"
        ]
      },
      "final_archetypes": [
        {
          "archetype_id": "persona",
          "canonical_label": "Persona",
          "quality": "social mask under pressure",
          "expression": "A formal uniform and the need to keep smiling while privately wanting to run away and speak the truth.",
          "resonance": "The dream is organized by the tension between outward role and inward self, with the role holding the event together.",
          "confidence": "high",
          "evidence_ids": [
            "D1"
          ],
          "evidence": [
            "I dreamed I had to keep smiling in a formal uniform while inside I wanted to run away and say who I really was. The whole event depended on the role holding."
          ]
        }
      ],
      "final_archetype_ids": [
        "persona"
      ]
    },
    {
      "fixture_id": "persona_positive_en",
      "semantic_success": true,
      "target_language": "en",
      "latency_ms": 5177,
      "discovery_archetypes": [
        {
          "archetype_id": "persona",
          "canonical_label": "Persona",
          "quality": "social mask or role",
          "expression": "A formal uniform and the need to keep smiling while hiding the wish to run away and speak honestly.",
          "resonance": "The dream is organized by pressure to maintain an outer role that suppresses private identity and expression.",
          "confidence": "high",
          "evidence_ids": [
            "D1"
          ],
          "evidence": [
            "I dreamed I had to keep smiling in a formal uniform while inside I wanted to run away and say who I really was. The whole event depended on the role holding."
          ]
        }
      ],
      "adjudication": {
        "decisions": [
          {
            "archetype_id": "persona",
            "decision": "accept",
            "decisive_feature": "public role suppresses private self-expression",
            "reason": "The formal uniform and forced smiling actively constrain the dreamer’s true identity and wish to speak honestly.",
            "evidence_ids": [
              "D1"
            ]
          }
        ],
        "accepted_archetype_ids": [
          "persona"
        ]
      },
      "final_archetypes": [
        {
          "archetype_id": "persona",
          "canonical_label": "Persona",
          "quality": "social mask or role",
          "expression": "A formal uniform and the need to keep smiling while hiding the wish to run away and speak honestly.",
          "resonance": "The dream is organized by pressure to maintain an outer role that suppresses private identity and expression.",
          "confidence": "high",
          "evidence_ids": [
            "D1"
          ],
          "evidence": [
            "I dreamed I had to keep smiling in a formal uniform while inside I wanted to run away and say who I really was. The whole event depended on the role holding."
          ]
        }
      ],
      "final_archetype_ids": [
        "persona"
      ]
    },
    {
      "fixture_id": "persona_positive_en",
      "semantic_success": true,
      "target_language": "en",
      "latency_ms": 3392,
      "discovery_archetypes": [
        {
          "archetype_id": "persona",
          "canonical_label": "Persona",
          "quality": "social mask and role pressure",
          "expression": "A formal uniform and enforced smiling while the dreamer inwardly wants to run away and speak honestly",
          "resonance": "The dream is organized by the strain between public presentation and private truth, with the role itself holding the event together.",
          "confidence": "high",
          "evidence_ids": [
            "D1"
          ],
          "evidence": [
            "I dreamed I had to keep smiling in a formal uniform while inside I wanted to run away and say who I really was. The whole event depended on the role holding."
          ]
        }
      ],
      "adjudication": {
        "decisions": [
          {
            "archetype_id": "persona",
            "decision": "accept",
            "decisive_feature": "public role suppresses private truth",
            "reason": "Yes: the formal uniform and enforced smiling actively constrain the dreamer’s honest self-expression.",
            "evidence_ids": [
              "D1"
            ]
          }
        ],
        "accepted_archetype_ids": [
          "persona"
        ]
      },
      "final_archetypes": [
        {
          "archetype_id": "persona",
          "canonical_label": "Persona",
          "quality": "social mask and role pressure",
          "expression": "A formal uniform and enforced smiling while the dreamer inwardly wants to run away and speak honestly",
          "resonance": "The dream is organized by the strain between public presentation and private truth, with the role itself holding the event together.",
          "confidence": "high",
          "evidence_ids": [
            "D1"
          ],
          "evidence": [
            "I dreamed I had to keep smiling in a formal uniform while inside I wanted to run away and say who I really was. The whole event depended on the role holding."
          ]
        }
      ],
      "final_archetype_ids": [
        "persona"
      ]
    },
    {
      "fixture_id": "persona_positive_en",
      "semantic_success": true,
      "target_language": "en",
      "latency_ms": 3420,
      "discovery_archetypes": [
        {
          "archetype_id": "persona",
          "canonical_label": "Persona",
          "quality": "social mask or role pressure",
          "expression": "A formal uniform and forced smiling while the dreamer wants to run away and say who they really are.",
          "resonance": "The dream is organized by the tension between a public role and private identity, with the role itself holding the event together.",
          "confidence": "high",
          "evidence_ids": [
            "D1"
          ],
          "evidence": [
            "I dreamed I had to keep smiling in a formal uniform while inside I wanted to run away and say who I really was. The whole event depended on the role holding."
          ]
        }
      ],
      "adjudication": {
        "decisions": [
          {
            "archetype_id": "persona",
            "decision": "accept",
            "decisive_feature": "formal role constrains private self-expression",
            "reason": "The formal uniform and forced smiling actively suppress the dreamer’s true self, and the event is held together by maintaining the role.",
            "evidence_ids": [
              "D1"
            ]
          }
        ],
        "accepted_archetype_ids": [
          "persona"
        ]
      },
      "final_archetypes": [
        {
          "archetype_id": "persona",
          "canonical_label": "Persona",
          "quality": "social mask or role pressure",
          "expression": "A formal uniform and forced smiling while the dreamer wants to run away and say who they really are.",
          "resonance": "The dream is organized by the tension between a public role and private identity, with the role itself holding the event together.",
          "confidence": "high",
          "evidence_ids": [
            "D1"
          ],
          "evidence": [
            "I dreamed I had to keep smiling in a formal uniform while inside I wanted to run away and say who I really was. The whole event depended on the role holding."
          ]
        }
      ],
      "final_archetype_ids": [
        "persona"
      ]
    },
    {
      "fixture_id": "persona_positive_en",
      "semantic_success": true,
      "target_language": "en",
      "latency_ms": 9935,
      "discovery_archetypes": [
        {
          "archetype_id": "persona",
          "canonical_label": "Persona",
          "quality": "social mask against private self",
          "expression": "A formal uniform and forced smiling are held in place while the dreamer inwardly wants to run away and speak honestly.",
          "resonance": "The dream is organized by the pressure of public presentation overriding private identity.",
          "confidence": "high",
          "evidence_ids": [
            "D1"
          ],
          "evidence": [
            "I dreamed I had to keep smiling in a formal uniform while inside I wanted to run away and say who I really was. The whole event depended on the role holding."
          ]
        }
      ],
      "adjudication": {
        "decisions": [
          {
            "archetype_id": "persona",
            "decision": "accept",
            "decisive_feature": "formal role suppressing private identity",
            "reason": "The formal uniform and forced smiling actively constrain the dreamer’s private self and honest speech.",
            "evidence_ids": [
              "D1"
            ]
          }
        ],
        "accepted_archetype_ids": [
          "persona"
        ]
      },
      "final_archetypes": [
        {
          "archetype_id": "persona",
          "canonical_label": "Persona",
          "quality": "social mask against private self",
          "expression": "A formal uniform and forced smiling are held in place while the dreamer inwardly wants to run away and speak honestly.",
          "resonance": "The dream is organized by the pressure of public presentation overriding private identity.",
          "confidence": "high",
          "evidence_ids": [
            "D1"
          ],
          "evidence": [
            "I dreamed I had to keep smiling in a formal uniform while inside I wanted to run away and say who I really was. The whole event depended on the role holding."
          ]
        }
      ],
      "final_archetype_ids": [
        "persona"
      ]
    },
    {
      "fixture_id": "persona_carrier_only_en",
      "semantic_success": true,
      "target_language": "en",
      "latency_ms": 3557,
      "discovery_archetypes": [
        {
          "archetype_id": "persona",
          "canonical_label": "Persona",
          "quality": "social role and public presentation",
          "expression": "The dreamer is seated in an audience at a formal ceremony, dressed in a dark suit, while speeches and greetings unfold in a public setting.",
          "resonance": "The scene is organized by outward role and decorum, with the dreamer waiting inside a socially scripted space before returning home.",
          "confidence": "high",
          "evidence_ids": [
            "D1"
          ],
          "evidence": [
            "I dreamed I was sitting in the audience at a formal ceremony in a dark suit. Music played, people greeted each other, and I waited for the speeches to finish before going home."
          ]
        }
      ],
      "adjudication": {
        "decisions": [
          {
            "archetype_id": "persona",
            "decision": "reject",
            "decisive_feature": null,
            "reason": "The dream shows only a spectator in a formal public setting, without evidence that a social role constrains or conceals private self-expression.",
            "evidence_ids": [
              "D1"
            ]
          }
        ],
        "accepted_archetype_ids": []
      },
      "final_archetypes": [],
      "final_archetype_ids": []
    },
    {
      "fixture_id": "persona_carrier_only_en",
      "semantic_success": true,
      "target_language": "en",
      "latency_ms": 3482,
      "discovery_archetypes": [
        {
          "archetype_id": "persona",
          "canonical_label": "Persona",
          "quality": "social role and formal presentation",
          "expression": "sitting in the audience at a formal ceremony in a dark suit while people greet each other and speeches unfold",
          "resonance": "The dream is organized by a public-facing role and the atmosphere of formal participation rather than private self-expression.",
          "confidence": "high",
          "evidence_ids": [
            "D1"
          ],
          "evidence": [
            "I dreamed I was sitting in the audience at a formal ceremony in a dark suit. Music played, people greeted each other, and I waited for the speeches to finish before going home."
          ]
        }
      ],
      "adjudication": {
        "decisions": [
          {
            "archetype_id": "persona",
            "decision": "reject",
            "decisive_feature": null,
            "reason": "The dream shows only formal attendance as a spectator, without evidence that a social role constrains or conceals private self-expression.",
            "evidence_ids": [
              "D1"
            ]
          }
        ],
        "accepted_archetype_ids": []
      },
      "final_archetypes": [],
      "final_archetype_ids": []
    },
    {
      "fixture_id": "persona_carrier_only_en",
      "semantic_success": true,
      "target_language": "en",
      "latency_ms": 3674,
      "discovery_archetypes": [
        {
          "archetype_id": "persona",
          "canonical_label": "Persona",
          "quality": "social role and presentation",
          "expression": "being in the audience at a formal ceremony, dressed in a dark suit, while people greet each other and speeches are underway",
          "resonance": "The dream is organized by a public-facing role that keeps private life in the background until the ceremony is over.",
          "confidence": "high",
          "evidence_ids": [
            "D1"
          ],
          "evidence": [
            "I dreamed I was sitting in the audience at a formal ceremony in a dark suit. Music played, people greeted each other, and I waited for the speeches to finish before going home."
          ]
        }
      ],
      "adjudication": {
        "decisions": [
          {
            "archetype_id": "persona",
            "decision": "reject",
            "decisive_feature": null,
            "reason": "The dream shows only a formal public setting and the dreamer as a spectator, without evidence of a socially adapted mask constraining private expression.",
            "evidence_ids": [
              "D1"
            ]
          }
        ],
        "accepted_archetype_ids": []
      },
      "final_archetypes": [],
      "final_archetype_ids": []
    },
    {
      "fixture_id": "persona_carrier_only_en",
      "semantic_success": true,
      "target_language": "en",
      "latency_ms": 3262,
      "discovery_archetypes": [
        {
          "archetype_id": "persona",
          "canonical_label": "Persona",
          "quality": "social role and presentation",
          "expression": "The dreamer is seated in an audience at a formal ceremony, dressed in a dark suit, while speeches and greetings unfold around them.",
          "resonance": "The scene centers on public presentation and socially governed participation rather than private feeling.",
          "confidence": "high",
          "evidence_ids": [
            "D1"
          ],
          "evidence": [
            "I dreamed I was sitting in the audience at a formal ceremony in a dark suit. Music played, people greeted each other, and I waited for the speeches to finish before going home."
          ]
        }
      ],
      "adjudication": {
        "decisions": [
          {
            "archetype_id": "persona",
            "decision": "reject",
            "decisive_feature": null,
            "reason": "The dream shows only a spectator at a formal ceremony with formal clothing, not a socially adapted mask that constrains or displaces private expression.",
            "evidence_ids": [
              "D1"
            ]
          }
        ],
        "accepted_archetype_ids": []
      },
      "final_archetypes": [],
      "final_archetype_ids": []
    },
    {
      "fixture_id": "persona_carrier_only_en",
      "semantic_success": true,
      "target_language": "en",
      "latency_ms": 3119,
      "discovery_archetypes": [
        {
          "archetype_id": "persona",
          "canonical_label": "Persona",
          "quality": "public role and formal presentation",
          "expression": "The dreamer sits in a formal audience in a dark suit while music plays and people exchange greetings at a ceremony.",
          "resonance": "The scene is organized by public presentation and socially correct belonging rather than private expression.",
          "confidence": "high",
          "evidence_ids": [
            "D1"
          ],
          "evidence": [
            "I dreamed I was sitting in the audience at a formal ceremony in a dark suit. Music played, people greeted each other, and I waited for the speeches to finish before going home."
          ]
        }
      ],
      "adjudication": {
        "decisions": [
          {
            "archetype_id": "persona",
            "decision": "reject",
            "decisive_feature": null,
            "reason": "The dream shows only a spectator at a formal ceremony, with no evidence that a social role constrains or displaces private expression.",
            "evidence_ids": [
              "D1"
            ]
          }
        ],
        "accepted_archetype_ids": []
      },
      "final_archetypes": [],
      "final_archetype_ids": []
    },
    {
      "fixture_id": "mother_positive_en",
      "semantic_success": true,
      "target_language": "en",
      "latency_ms": 5136,
      "discovery_archetypes": [
        {
          "archetype_id": "mother",
          "canonical_label": "Mother",
          "quality": "nurturing containment",
          "expression": "a vast warm house that holds and feeds everyone, with bowls continually appearing and each room feeling like shelter",
          "resonance": "The dream is organized by a benevolent maternal matrix of containment and nourishment that makes staying feel safe and desirable.",
          "confidence": "high",
          "evidence_ids": [
            "D1"
          ],
          "evidence": [
            "I dreamed I was inside a vast warm house that seemed to hold and feed everyone. Bowls kept appearing, and each room felt like a shelter no one wanted to leave."
          ]
        }
      ],
      "adjudication": {
        "decisions": [
          {
            "archetype_id": "mother",
            "decision": "accept",
            "decisive_feature": "maternal holding and feeding that makes the house a shelter no one wants to leave",
            "reason": "The dream is organized by a nurturing, enclosing field of feeding and shelter that goes beyond a generic house or comfort.",
            "evidence_ids": [
              "D1"
            ]
          }
        ],
        "accepted_archetype_ids": [
          "mother"
        ]
      },
      "final_archetypes": [
        {
          "archetype_id": "mother",
          "canonical_label": "Mother",
          "quality": "nurturing containment",
          "expression": "a vast warm house that holds and feeds everyone, with bowls continually appearing and each room feeling like shelter",
          "resonance": "The dream is organized by a benevolent maternal matrix of containment and nourishment that makes staying feel safe and desirable.",
          "confidence": "high",
          "evidence_ids": [
            "D1"
          ],
          "evidence": [
            "I dreamed I was inside a vast warm house that seemed to hold and feed everyone. Bowls kept appearing, and each room felt like a shelter no one wanted to leave."
          ]
        }
      ],
      "final_archetype_ids": [
        "mother"
      ]
    },
    {
      "fixture_id": "mother_positive_en",
      "semantic_success": true,
      "target_language": "en",
      "latency_ms": 3112,
      "discovery_archetypes": [
        {
          "archetype_id": "mother",
          "canonical_label": "Mother",
          "quality": "nurturing containment",
          "expression": "a vast warm house that holds and feeds everyone, with bowls continually appearing and rooms felt as shelter",
          "resonance": "The dream is organized by a generous containing presence that nourishes and shelters the occupants without pressure to leave.",
          "confidence": "high",
          "evidence_ids": [
            "D1"
          ],
          "evidence": [
            "I dreamed I was inside a vast warm house that seemed to hold and feed everyone. Bowls kept appearing, and each room felt like a shelter no one wanted to leave."
          ]
        }
      ],
      "adjudication": {
        "decisions": [
          {
            "archetype_id": "mother",
            "decision": "accept",
            "decisive_feature": "a maternal field of holding, feeding, and sheltering that keeps everyone inside",
            "reason": "The dream is organized by an encompassing nurture that holds, feeds, and shelters everyone rather than mere domestic warmth.",
            "evidence_ids": [
              "D1"
            ]
          }
        ],
        "accepted_archetype_ids": [
          "mother"
        ]
      },
      "final_archetypes": [
        {
          "archetype_id": "mother",
          "canonical_label": "Mother",
          "quality": "nurturing containment",
          "expression": "a vast warm house that holds and feeds everyone, with bowls continually appearing and rooms felt as shelter",
          "resonance": "The dream is organized by a generous containing presence that nourishes and shelters the occupants without pressure to leave.",
          "confidence": "high",
          "evidence_ids": [
            "D1"
          ],
          "evidence": [
            "I dreamed I was inside a vast warm house that seemed to hold and feed everyone. Bowls kept appearing, and each room felt like a shelter no one wanted to leave."
          ]
        }
      ],
      "final_archetype_ids": [
        "mother"
      ]
    },
    {
      "fixture_id": "mother_positive_en",
      "semantic_success": true,
      "target_language": "en",
      "latency_ms": 3225,
      "discovery_archetypes": [
        {
          "archetype_id": "mother",
          "canonical_label": "Mother",
          "quality": "nurturing containment",
          "expression": "a vast warm house that holds and feeds everyone, with bowls continually appearing and each room feeling like shelter",
          "resonance": "The dream is organized by a maternal matrix of care, enclosure, and sustained belonging.",
          "confidence": "high",
          "evidence_ids": [
            "D1"
          ],
          "evidence": [
            "I dreamed I was inside a vast warm house that seemed to hold and feed everyone. Bowls kept appearing, and each room felt like a shelter no one wanted to leave."
          ]
        }
      ],
      "adjudication": {
        "decisions": [
          {
            "archetype_id": "mother",
            "decision": "accept",
            "decisive_feature": "A maternal field of holding and feeding that organizes the whole setting",
            "reason": "The dream centers on a warm enclosing house that holds and feeds everyone, with bowls continually appearing and no one wanting to leave.",
            "evidence_ids": [
              "D1"
            ]
          }
        ],
        "accepted_archetype_ids": [
          "mother"
        ]
      },
      "final_archetypes": [
        {
          "archetype_id": "mother",
          "canonical_label": "Mother",
          "quality": "nurturing containment",
          "expression": "a vast warm house that holds and feeds everyone, with bowls continually appearing and each room feeling like shelter",
          "resonance": "The dream is organized by a maternal matrix of care, enclosure, and sustained belonging.",
          "confidence": "high",
          "evidence_ids": [
            "D1"
          ],
          "evidence": [
            "I dreamed I was inside a vast warm house that seemed to hold and feed everyone. Bowls kept appearing, and each room felt like a shelter no one wanted to leave."
          ]
        }
      ],
      "final_archetype_ids": [
        "mother"
      ]
    },
    {
      "fixture_id": "father_positive_en",
      "semantic_success": true,
      "target_language": "en",
      "latency_ms": 3110,
      "discovery_archetypes": [
        {
          "archetype_id": "father",
          "canonical_label": "Father",
          "quality": "authorizing structure",
          "expression": "The father stands at the doorway and sets the rule for passage, while the whole room organizes itself around his demand.",
          "resonance": "The dream is organized by paternal authority that determines access and structure.",
          "confidence": "high",
          "evidence_ids": [
            "D1"
          ],
          "evidence": [
            "I dreamed my father stood at the doorway and told me the rule that would determine whether I could pass. The whole room arranged itself around his demand."
          ]
        }
      ],
      "adjudication": {
        "decisions": [
          {
            "archetype_id": "father",
            "decision": "accept",
            "decisive_feature": "paternal rule governing passage",
            "reason": "The dream centers a distinctly paternal presence that sets the rule for whether passage is allowed and organizes the room around that demand.",
            "evidence_ids": [
              "D1"
            ]
          }
        ],
        "accepted_archetype_ids": [
          "father"
        ]
      },
      "final_archetypes": [
        {
          "archetype_id": "father",
          "canonical_label": "Father",
          "quality": "authorizing structure",
          "expression": "The father stands at the doorway and sets the rule for passage, while the whole room organizes itself around his demand.",
          "resonance": "The dream is organized by paternal authority that determines access and structure.",
          "confidence": "high",
          "evidence_ids": [
            "D1"
          ],
          "evidence": [
            "I dreamed my father stood at the doorway and told me the rule that would determine whether I could pass. The whole room arranged itself around his demand."
          ]
        }
      ],
      "final_archetype_ids": [
        "father"
      ]
    },
    {
      "fixture_id": "father_positive_en",
      "semantic_success": true,
      "target_language": "en",
      "latency_ms": 3801,
      "discovery_archetypes": [
        {
          "archetype_id": "father",
          "canonical_label": "Father",
          "quality": "authorizing structure",
          "expression": "The father stands at the doorway and states the rule that determines whether passage is allowed.",
          "resonance": "His demand organizes the room as a threshold governed by permission and consequence.",
          "confidence": "high",
          "evidence_ids": [
            "D1"
          ],
          "evidence": [
            "I dreamed my father stood at the doorway and told me the rule that would determine whether I could pass. The whole room arranged itself around his demand."
          ]
        }
      ],
      "adjudication": {
        "decisions": [
          {
            "archetype_id": "father",
            "decision": "accept",
            "decisive_feature": "paternal law at the doorway organizing passage",
            "reason": "The dream shows a distinctly paternal presence structuring access through a rule that determines passage and organizes the room around his demand.",
            "evidence_ids": [
              "D1"
            ]
          }
        ],
        "accepted_archetype_ids": [
          "father"
        ]
      },
      "final_archetypes": [
        {
          "archetype_id": "father",
          "canonical_label": "Father",
          "quality": "authorizing structure",
          "expression": "The father stands at the doorway and states the rule that determines whether passage is allowed.",
          "resonance": "His demand organizes the room as a threshold governed by permission and consequence.",
          "confidence": "high",
          "evidence_ids": [
            "D1"
          ],
          "evidence": [
            "I dreamed my father stood at the doorway and told me the rule that would determine whether I could pass. The whole room arranged itself around his demand."
          ]
        }
      ],
      "final_archetype_ids": [
        "father"
      ]
    },
    {
      "fixture_id": "father_positive_en",
      "semantic_success": true,
      "target_language": "en",
      "latency_ms": 10172,
      "discovery_archetypes": [
        {
          "archetype_id": "father",
          "canonical_label": "Father",
          "quality": "authorizing boundary",
          "expression": "The father stands at the doorway and states the rule for whether passage is allowed, while the room organizes itself around his demand.",
          "resonance": "The dream is structured by paternal authority that sets the terms of entry and holds the space in order.",
          "confidence": "high",
          "evidence_ids": [
            "D1"
          ],
          "evidence": [
            "I dreamed my father stood at the doorway and told me the rule that would determine whether I could pass. The whole room arranged itself around his demand."
          ]
        }
      ],
      "adjudication": {
        "decisions": [
          {
            "archetype_id": "father",
            "decision": "accept",
            "decisive_feature": "paternal rule-setting at the doorway",
            "reason": "A distinctly paternal presence sets the condition for passage and organizes the room around his law.",
            "evidence_ids": [
              "D1"
            ]
          }
        ],
        "accepted_archetype_ids": [
          "father"
        ]
      },
      "final_archetypes": [
        {
          "archetype_id": "father",
          "canonical_label": "Father",
          "quality": "authorizing boundary",
          "expression": "The father stands at the doorway and states the rule for whether passage is allowed, while the room organizes itself around his demand.",
          "resonance": "The dream is structured by paternal authority that sets the terms of entry and holds the space in order.",
          "confidence": "high",
          "evidence_ids": [
            "D1"
          ],
          "evidence": [
            "I dreamed my father stood at the doorway and told me the rule that would determine whether I could pass. The whole room arranged itself around his demand."
          ]
        }
      ],
      "final_archetype_ids": [
        "father"
      ]
    },
    {
      "fixture_id": "divine_child_positive_en",
      "semantic_success": true,
      "target_language": "en",
      "latency_ms": 4503,
      "discovery_archetypes": [
        {
          "archetype_id": "divine_child",
          "canonical_label": "Divine Child",
          "quality": "vulnerable new life carrying future",
          "expression": "a small glowing child sleeping in the dreamer’s hands while everyone stops to protect it and clear a way forward",
          "resonance": "The child centers the scene as a fragile but luminous presence that draws collective protection and opens the path ahead.",
          "confidence": "high",
          "evidence_ids": [
            "D1"
          ],
          "evidence": [
            "I dreamed a small glowing child was sleeping in my hands while everyone around me stopped what they were doing to protect it and clear a way forward."
          ]
        }
      ],
      "adjudication": {
        "decisions": [
          {
            "archetype_id": "divine_child",
            "decision": "accept",
            "decisive_feature": "small glowing child carrying future-bearing significance",
            "reason": "The child is not just vulnerable; its glowing presence makes others reorganize to protect it and clear the way forward.",
            "evidence_ids": [
              "D1"
            ]
          }
        ],
        "accepted_archetype_ids": [
          "divine_child"
        ]
      },
      "final_archetypes": [
        {
          "archetype_id": "divine_child",
          "canonical_label": "Divine Child",
          "quality": "vulnerable new life carrying future",
          "expression": "a small glowing child sleeping in the dreamer’s hands while everyone stops to protect it and clear a way forward",
          "resonance": "The child centers the scene as a fragile but luminous presence that draws collective protection and opens the path ahead.",
          "confidence": "high",
          "evidence_ids": [
            "D1"
          ],
          "evidence": [
            "I dreamed a small glowing child was sleeping in my hands while everyone around me stopped what they were doing to protect it and clear a way forward."
          ]
        }
      ],
      "final_archetype_ids": [
        "divine_child"
      ]
    },
    {
      "fixture_id": "divine_child_positive_en",
      "semantic_success": true,
      "target_language": "en",
      "latency_ms": 3671,
      "discovery_archetypes": [
        {
          "archetype_id": "divine_child",
          "canonical_label": "Divine Child",
          "quality": "vulnerable renewing possibility",
          "expression": "a small glowing child sleeping in my hands while everyone else protects it and clears a way forward",
          "resonance": "The dream centers on fragile new life that draws collective protection and opens a path ahead.",
          "confidence": "high",
          "evidence_ids": [
            "D1"
          ],
          "evidence": [
            "I dreamed a small glowing child was sleeping in my hands while everyone around me stopped what they were doing to protect it and clear a way forward."
          ]
        }
      ],
      "adjudication": {
        "decisions": [
          {
            "archetype_id": "divine_child",
            "decision": "accept",
            "decisive_feature": "fragile future-bearing child that reorganizes collective protection",
            "reason": "The glowing child is not merely a baby; its presence draws everyone into protection and clearing a path forward, showing exceptional renewing significance.",
            "evidence_ids": [
              "D1"
            ]
          }
        ],
        "accepted_archetype_ids": [
          "divine_child"
        ]
      },
      "final_archetypes": [
        {
          "archetype_id": "divine_child",
          "canonical_label": "Divine Child",
          "quality": "vulnerable renewing possibility",
          "expression": "a small glowing child sleeping in my hands while everyone else protects it and clears a way forward",
          "resonance": "The dream centers on fragile new life that draws collective protection and opens a path ahead.",
          "confidence": "high",
          "evidence_ids": [
            "D1"
          ],
          "evidence": [
            "I dreamed a small glowing child was sleeping in my hands while everyone around me stopped what they were doing to protect it and clear a way forward."
          ]
        }
      ],
      "final_archetype_ids": [
        "divine_child"
      ]
    },
    {
      "fixture_id": "divine_child_positive_en",
      "semantic_success": true,
      "target_language": "en",
      "latency_ms": 23027,
      "discovery_archetypes": [
        {
          "archetype_id": "divine_child",
          "canonical_label": "Divine Child",
          "quality": "vulnerable renewing possibility",
          "expression": "a small glowing child sleeping in the dreamer’s hands while everyone pauses to protect it and clear a way forward",
          "resonance": "The child carries a fragile future that reorganizes the whole scene around protection and passage.",
          "confidence": "high",
          "evidence_ids": [
            "D1"
          ],
          "evidence": [
            "I dreamed a small glowing child was sleeping in my hands while everyone around me stopped what they were doing to protect it and clear a way forward."
          ]
        }
      ],
      "adjudication": {
        "decisions": [
          {
            "archetype_id": "divine_child",
            "decision": "accept",
            "decisive_feature": "fragile future-bearing significance",
            "reason": "The glowing child in the dreamer’s hands is treated as uniquely precious, and the whole scene reorganizes around protecting it and clearing a way forward.",
            "evidence_ids": [
              "D1"
            ]
          }
        ],
        "accepted_archetype_ids": [
          "divine_child"
        ]
      },
      "final_archetypes": [
        {
          "archetype_id": "divine_child",
          "canonical_label": "Divine Child",
          "quality": "vulnerable renewing possibility",
          "expression": "a small glowing child sleeping in the dreamer’s hands while everyone pauses to protect it and clear a way forward",
          "resonance": "The child carries a fragile future that reorganizes the whole scene around protection and passage.",
          "confidence": "high",
          "evidence_ids": [
            "D1"
          ],
          "evidence": [
            "I dreamed a small glowing child was sleeping in my hands while everyone around me stopped what they were doing to protect it and clear a way forward."
          ]
        }
      ],
      "final_archetype_ids": [
        "divine_child"
      ]
    }
  ],
  "acceptance": [
    {
      "fixture_id": "sea_mattress_el_exact",
      "successful_runs": 5,
      "exact_set_pass_count": 5,
      "required_hit_count": 5,
      "unexpected_label_runs": 0,
      "pass": true,
      "failures": [],
      "semantic_failures": []
    },
    {
      "fixture_id": "sea_mattress_el_boyfriend_diag",
      "successful_runs": 3,
      "exact_set_pass_count": 3,
      "required_hit_count": 3,
      "unexpected_label_runs": 0,
      "pass": true,
      "failures": [],
      "semantic_failures": []
    },
    {
      "fixture_id": "lover_harmonious_en",
      "successful_runs": 5,
      "exact_set_pass_count": 5,
      "required_hit_count": 5,
      "unexpected_label_runs": 0,
      "pass": true,
      "failures": [],
      "semantic_failures": []
    },
    {
      "fixture_id": "lover_longing_en",
      "successful_runs": 3,
      "exact_set_pass_count": 3,
      "required_hit_count": 3,
      "unexpected_label_runs": 0,
      "pass": true,
      "failures": [],
      "semantic_failures": []
    },
    {
      "fixture_id": "warm_friends_en",
      "successful_runs": 5,
      "exact_set_pass_count": 5,
      "required_hit_count": 5,
      "unexpected_label_runs": 0,
      "pass": true,
      "failures": [],
      "semantic_failures": []
    },
    {
      "fixture_id": "warm_friends_el",
      "successful_runs": 5,
      "exact_set_pass_count": 5,
      "required_hit_count": 5,
      "unexpected_label_runs": 0,
      "pass": true,
      "failures": [],
      "semantic_failures": []
    },
    {
      "fixture_id": "lover_negative_naturalistic_en",
      "successful_runs": 5,
      "exact_set_pass_count": 5,
      "required_hit_count": 5,
      "unexpected_label_runs": 0,
      "pass": true,
      "failures": [],
      "semantic_failures": []
    },
    {
      "fixture_id": "incidental_partner_en",
      "successful_runs": 5,
      "exact_set_pass_count": 5,
      "required_hit_count": 5,
      "unexpected_label_runs": 0,
      "pass": true,
      "failures": [],
      "semantic_failures": []
    },
    {
      "fixture_id": "romance_cue_only_en",
      "successful_runs": 5,
      "exact_set_pass_count": 5,
      "required_hit_count": 5,
      "unexpected_label_runs": 0,
      "pass": true,
      "failures": [],
      "semantic_failures": []
    },
    {
      "fixture_id": "guide_positive_en",
      "successful_runs": 5,
      "exact_set_pass_count": 5,
      "required_hit_count": 5,
      "unexpected_label_runs": 0,
      "pass": true,
      "failures": [],
      "semantic_failures": []
    },
    {
      "fixture_id": "guide_negative_carrier_only_en",
      "successful_runs": 5,
      "exact_set_pass_count": 5,
      "required_hit_count": 5,
      "unexpected_label_runs": 0,
      "pass": true,
      "failures": [],
      "semantic_failures": []
    },
    {
      "fixture_id": "shadow_positive_en",
      "successful_runs": 5,
      "exact_set_pass_count": 5,
      "required_hit_count": 5,
      "unexpected_label_runs": 0,
      "pass": true,
      "failures": [],
      "semantic_failures": []
    },
    {
      "fixture_id": "shadow_negative_danger_only_en",
      "successful_runs": 5,
      "exact_set_pass_count": 5,
      "required_hit_count": 5,
      "unexpected_label_runs": 0,
      "pass": true,
      "failures": [],
      "semantic_failures": []
    },
    {
      "fixture_id": "persona_positive_en",
      "successful_runs": 5,
      "exact_set_pass_count": 5,
      "required_hit_count": 5,
      "unexpected_label_runs": 0,
      "pass": true,
      "failures": [],
      "semantic_failures": []
    },
    {
      "fixture_id": "persona_carrier_only_en",
      "successful_runs": 5,
      "exact_set_pass_count": 5,
      "required_hit_count": 5,
      "unexpected_label_runs": 0,
      "pass": true,
      "failures": [],
      "semantic_failures": []
    },
    {
      "fixture_id": "mother_positive_en",
      "successful_runs": 3,
      "exact_set_pass_count": 3,
      "required_hit_count": 3,
      "unexpected_label_runs": 0,
      "pass": true,
      "failures": [],
      "semantic_failures": []
    },
    {
      "fixture_id": "father_positive_en",
      "successful_runs": 3,
      "exact_set_pass_count": 3,
      "required_hit_count": 3,
      "unexpected_label_runs": 0,
      "pass": true,
      "failures": [],
      "semantic_failures": []
    },
    {
      "fixture_id": "divine_child_positive_en",
      "successful_runs": 3,
      "exact_set_pass_count": 3,
      "required_hit_count": 3,
      "unexpected_label_runs": 0,
      "pass": true,
      "failures": [],
      "semantic_failures": []
    }
  ],
  "exact_set_pass_rate": "80/80",
  "required_label_recall": {
    "lover": "16/16",
    "guide_psychopomp": "5/5",
    "shadow": "5/5",
    "persona": "5/5",
    "mother": "3/3",
    "father": "3/3",
    "divine_child": "3/3"
  },
  "unexpected_label_false_positive_rate": "0/80",
  "per_label_confusion": {
    "lover": {
      "expected_positive_runs": 16,
      "true_positive_runs": 16,
      "false_negative_runs": 0,
      "false_positive_runs": 0,
      "returned_runs": 16
    },
    "guide_psychopomp": {
      "expected_positive_runs": 5,
      "true_positive_runs": 5,
      "false_negative_runs": 0,
      "false_positive_runs": 0,
      "returned_runs": 5
    },
    "shadow": {
      "expected_positive_runs": 5,
      "true_positive_runs": 5,
      "false_negative_runs": 0,
      "false_positive_runs": 0,
      "returned_runs": 5
    },
    "persona": {
      "expected_positive_runs": 5,
      "true_positive_runs": 5,
      "false_negative_runs": 0,
      "false_positive_runs": 0,
      "returned_runs": 5
    },
    "mother": {
      "expected_positive_runs": 3,
      "true_positive_runs": 3,
      "false_negative_runs": 0,
      "false_positive_runs": 0,
      "returned_runs": 3
    },
    "father": {
      "expected_positive_runs": 3,
      "true_positive_runs": 3,
      "false_negative_runs": 0,
      "false_positive_runs": 0,
      "returned_runs": 3
    },
    "divine_child": {
      "expected_positive_runs": 3,
      "true_positive_runs": 3,
      "false_negative_runs": 0,
      "false_positive_runs": 0,
      "returned_runs": 3
    }
  },
  "fixture_hashes": [
    {
      "fixture_id": "sea_mattress_el_exact",
      "sha256": "6489c447cdbad00d05cc6935fff45a9de3198995aac0d2aa84ff1c49d3559f4d",
      "repeats": 5
    },
    {
      "fixture_id": "sea_mattress_el_boyfriend_diag",
      "sha256": "b836b082c7b4df0be72645c65ea4612b86c6504e58eb0a0ee50ac41909515a92",
      "repeats": 3
    },
    {
      "fixture_id": "lover_harmonious_en",
      "sha256": "d3d86773575ff4c5ed63cfc07fe56a158e556624c37209434deffb0ef22933d8",
      "repeats": 5
    },
    {
      "fixture_id": "lover_longing_en",
      "sha256": "d99025479ff32d816a0a4f7c82e4321bd08467e0f6f8a13e68bb80210a963850",
      "repeats": 3
    },
    {
      "fixture_id": "warm_friends_en",
      "sha256": "dc99c5fefcce976181410bb6037584b22da9ffbac795fb4c83eedb697e955a16",
      "repeats": 5
    },
    {
      "fixture_id": "warm_friends_el",
      "sha256": "688b706ae741218e37088a51f18fc8ce2e6c96c67b921aae180ccbb933d7616b",
      "repeats": 5
    },
    {
      "fixture_id": "lover_negative_naturalistic_en",
      "sha256": "67ce2eb23f1deb5e0ac45f69422b55b0ed2f8b6b87c1838139912db57386eb2d",
      "repeats": 5
    },
    {
      "fixture_id": "incidental_partner_en",
      "sha256": "6d633f10943f9ddb2716e4f0d033ed0a495264c867824220a3464a2e017c757c",
      "repeats": 5
    },
    {
      "fixture_id": "romance_cue_only_en",
      "sha256": "df2e61c9fc04f71b91bbfba725953deb3de734390b48425b68d38b263bbcaaf1",
      "repeats": 5
    },
    {
      "fixture_id": "guide_positive_en",
      "sha256": "4e914df15083dcff5d9d4e6fd8a35fc1e3aac7eb9f0aec103582138bed4c80cc",
      "repeats": 5
    },
    {
      "fixture_id": "guide_negative_carrier_only_en",
      "sha256": "6b3878cad933927253cf7159ea7e8001878ad2b47e28e91b6ec4b67a74094d48",
      "repeats": 5
    },
    {
      "fixture_id": "shadow_positive_en",
      "sha256": "da1620d0d8516c754f7ff366c6dfe7b0bddca6bb1ae0a48cc5b950ff5b62ac55",
      "repeats": 5
    },
    {
      "fixture_id": "shadow_negative_danger_only_en",
      "sha256": "ac0c110685c2834cfdabe411ecd9e71b9f5eb770ae76310132cf7732ec54423a",
      "repeats": 5
    },
    {
      "fixture_id": "persona_positive_en",
      "sha256": "21696c586beb53e4cef677e7635fe2db9e8a5ed540d864482a3218ec9b84cb51",
      "repeats": 5
    },
    {
      "fixture_id": "persona_carrier_only_en",
      "sha256": "69ce4967cee69d1e59e7696cfecc7a85c4b9b22b22ba5ddb2ad07332bc98c0dc",
      "repeats": 5
    },
    {
      "fixture_id": "mother_positive_en",
      "sha256": "13ba35334a2aeb27235519c26e3e29401ff9bf1d37543db36cc74d7130b8ef28",
      "repeats": 3
    },
    {
      "fixture_id": "father_positive_en",
      "sha256": "216396a720b16afa0cd310f0680d59203380927aee48903e58d3db77fab554d8",
      "repeats": 3
    },
    {
      "fixture_id": "divine_child_positive_en",
      "sha256": "064b042c2f9a7f3908633d92feef23fd311be23761c0ac82c8ec468118f661ef",
      "repeats": 3
    }
  ],
  "failure_stage_histogram": {}
}
```
