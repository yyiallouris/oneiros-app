# Oneiros — 5-dream combination acceptance set

Run each dream **3 fresh uncached times** with `temperature: 0`, debug OFF, and no prompt changes between runs.

Machine-readable twin: [`ONEIROS_5_DREAM_ACCEPTANCE_SET.jsonl`](./ONEIROS_5_DREAM_ACCEPTANCE_SET.jsonl).

## How to run (reusable)

**Always run fully parallel by default** (concurrency = job count). Do not run sequentially unless throttling for rate limits.

```bash
bash scripts/run-5-dream-acceptance.sh
# throttle only when needed:
ACCEPTANCE_CONCURRENCY=5 bash scripts/run-5-dream-acceptance.sh
# closed-catalog copper-vessel + holdouts (also parallel by default):
bash tmp/runClosedMythCatalogBenchmark.sh
```

Writes results under `tmp/5-dream-acceptance-<stamp>/`:
- `summary.json` — suite pass/fail + costs (myth counts derived from `acceptance_runs.json` only)
- `acceptance_runs.json` — canonical per-run records (`expected_myth_catalog_id`, `raw_myth_catalog_id`, `post_myth_catalog_id`, `source_run_file`, …)
- `reviewer_packet.json` — self-contained packet; exits non-zero if reconciliation fails (`packet_valid: false`)
- `tmp/ONEIROS_FIVE_DREAM_REVIEWER_PACKET.json` — copy of the latest valid packet at repo root of `tmp/`
- `<run>.json` — full packet including `acceptance_run` + `validator_decisions` + `mythic_rejected`
- `<run>.stages.json` — pro-reviewer stage shape (`raw` → `parsed` → `normalized` → `validator_decisions` → `post_validation`)

**Harness rule:** one output directory is the sole source of truth. Summary myth counts must reconcile with `acceptance_runs.json`; do not merge stale summaries or glob-latest directories into reviewer packets.

**Layer reporting:** `summary.json` includes `integrity_pass`, `myth_layer_pass`, `archetype_layer_pass`, and `overall_pass` so a passing myth layer is visible even when archetype acceptance fails.

**Archetype diagnostics (no new model calls):** `npx tsx scripts/build-archetype-diagnostic-packet.ts <c11_dir> <five_dream_dir>` → `tmp/ONEIROS_ARCHETYPE_DIAGNOSTIC_PACKET.json`.

### Pro-reviewer logs (where they live)

| Package | Path |
| --- | --- |
| Phase 0 (requested diagnostics, pre-patch) | `tmp/phase0-v411-diagnostics-2026-07-26T23-14-00-608Z/` — start at `PHASE0_PACKAGE.json` |
| Phase 1 5-dream acceptance (latest parallel) | `tmp/5-dream-acceptance-2026-07-26T23-22-01-526Z/` — per-run `.json` (+ next runs also write `.stages.json`) |
| Phase 1 closed copper-vessel | `tmp/v4.1.1-closed-myth-benchmark/` — `summary.json` + per-run packets |

Phase 0 files the reviewer asked for:
- `fisherman_T1.json` … `fisherman_T5.json`
- `C1_*.stages.json`, `C5_*.stages.json`
- `archetype_defs_and_validator_rules.json`
- `myth_pack.json`
- `metrics.json`
- `PHASE0_PACKAGE.json` (bundle)

## Authoritative catalog IDs (`mythic_narrative_catalog.v1.json`)

| Required myth title | `catalog_id` |
| --- | --- |
| Orpheus and Eurydice | `greek.orpheus_eurydice` |
| The Descent of Inanna | `sumerian.inanna_descent` |
| Sisyphus | `greek.sisyphus` |

The catalog ID—not the displayed title—is authoritative.

## 1. 2 archetypes + 1 myth

Βρισκόμουν σε έναν τεράστιο υπόγειο σταθμό, αλλά αντί για τρένα υπήρχε ένα μαύρο ποτάμι. Η σύντροφός μου είχε χαθεί πίσω από μια σιδερένια πύλη στην άλλη όχθη. Ένας σιωπηλός βαρκάρης αρνήθηκε να με περάσει, ώσπου έβγαλα ένα μικρό βιολί και έπαιξα. Τότε άνοιξε τη βάρκα και με πέρασε απέναντι. Βρήκα τη σύντροφό μου και μια φωνή μάς είπε ότι μπορούσαμε να επιστρέψουμε, αρκεί να μη γυρίσω να την κοιτάξω πριν φτάσουμε στο φως. Άκουγα τα βήματά της πίσω μου σε όλη τη διαδρομή. Λίγο πριν από την έξοδο σταμάτησα να τα ακούω. Γύρισα από φόβο και την είδα να τραβιέται πάλι πίσω από την πύλη, ενώ εγώ έμενα μόνος στο φως.

**Expected**

- Required archetypes: Lover
- Acceptable secondary archetypes: Guide / Psychopomp
- Forbidden archetypes: Death–Rebirth, Wise Old Man, Hero, Shadow
- Required myth: Orpheus and Eurydice (`greek.orpheus_eurydice`)
- Forbidden myths: Persephone, generic underworld descent

## 2. 1 archetype + 0 myth

Ήμουν σε ένα μεγάλο θέατρο όπου όλοι περίμεναν να παρουσιάσω τα οικονομικά μιας εταιρείας. Πριν βγω στη σκηνή, μου φόρεσαν μια τέλεια σκούρα στολή με το όνομά μου κεντημένο στο στήθος. Μόλις στάθηκα μπροστά στο κοινό, η φωνή μου έγινε ψυχρή και επίσημη, παρότι μέσα μου ήθελα να πω ότι δεν γνώριζα τις απαντήσεις. Κάθε φορά που προσπαθούσα να μιλήσω με τη δική μου φωνή, ο γιακάς έσφιγγε και το κοινό σταματούσε να με βλέπει. Όταν επέστρεψα στα παρασκήνια, προσπάθησα να βγάλω τη στολή, αλλά τα μανίκια είχαν κολλήσει πάνω μου. Ξύπνησα την ώρα που έσκιζα προσεκτικά μία ραφή για να μπορέσω να αναπνεύσω.

**Expected**

- Required archetypes: Persona
- Acceptable secondary archetypes: []
- Forbidden archetypes: Ruler, Shadow, Hero, Ego
- Required myth: []
- Forbidden myths: The Emperor's New Clothes, Cinderella, generic mask motif

## 3. 0 archetype + 1 myth

Βρισκόμουν σε έναν γυμνό λόφο και έσπρωχνα μια τεράστια στρογγυλή πέτρα προς την κορυφή. Δεν υπήρχε κανείς να με παρακολουθεί και δεν ένιωθα ούτε γενναίος ούτε φοβισμένος· μόνο ήξερα ότι έπρεπε να τη φτάσω πάνω. Κάθε φορά που η πέτρα πλησίαζε στην κορυφή, ακουγόταν ένα μικρό κουδούνι και η πέτρα γλιστρούσε από τα χέρια μου, κυλούσε μέχρι κάτω και σταματούσε ακριβώς στο ίδιο σημείο. Κατέβαινα, έβαζα πάλι τα χέρια μου πάνω της και ξεκινούσα από την αρχή. Ξύπνησα λίγο πριν την σπρώξω για ακόμη μία φορά.

**Expected**

- Required archetypes: []
- Acceptable secondary archetypes: []
- Forbidden archetypes: Hero, Death–Rebirth, Orphan, Self
- Required myth: Sisyphus (`greek.sisyphus`)
- Forbidden myths: Prometheus, Heracles, generic endless task motif

## 4. 0 archetype + 0 myth

Ήμουν στην κουζίνα μου και ήθελα να πιω νερό. Άνοιξα το ντουλάπι, αλλά όλα τα ποτήρια ήταν άπλυτα. Πήρα το λιγότερο βρώμικο, το έπλυνα με σαπούνι, το ξέβγαλα δύο φορές και το γέμισα από τη βρύση. Η γάτα πέρασε από τον πάγκο και έριξε ένα κουταλάκι στο πάτωμα. Το σήκωσα, ήπια το νερό και ξύπνησα ελαφρώς εκνευρισμένος επειδή θυμήθηκα ότι είχα αφήσει πιάτα στον νεροχύτη.

**Expected**

- Required archetypes: []
- Acceptable secondary archetypes: []
- Forbidden archetypes: Great Mother, Self, Hero, Death–Rebirth, Guide / Psychopomp
- Required myth: []
- Forbidden myths: any myth

## 5. 1 archetype + 1 myth

Κατέβαινα σε ένα υπόγειο παλάτι περνώντας από επτά διαδοχικές πόρτες. Σε κάθε πόρτα ένας φύλακας μου ζητούσε να αφήσω κάτι: πρώτα το δαχτυλίδι μου, μετά το παλτό, τα παπούτσια, μια κάρτα με το όνομά μου, το περιδέραιο, τη ζώνη και τέλος ένα μικρό στέμμα που δεν ήξερα ότι φορούσα. Στην τελευταία αίθουσα στεκόταν μια σιωπηλή βασίλισσα. Με κοίταξε χωρίς να μιλήσει και έπεσα στο πάτωμα σαν να είχε φύγει όλη η ζωή από μέσα μου. Αργότερα δύο μικρές μορφές έριξαν νερό στο πρόσωπό μου και ξύπνησα μέσα στο όνειρο. Ανέβηκα ξανά από τις επτά πόρτες, αλλά δεν μπορούσα να πάρω πίσω όλα όσα είχα αφήσει. Βγήκα στην επιφάνεια φορώντας μόνο ένα απλό λευκό κορδόνι στον καρπό.

**Expected**

- Required archetypes: Death–Rebirth (≥2/3 runs; target 3/3)
- Acceptable secondary archetypes: Guide / Psychopomp
- Forbidden archetypes: Terrible Mother, Ruler, Hero, Self
- Required myth: The Descent of Inanna (`sumerian.inanna_descent`)
- Forbidden myths: Persephone, Orpheus and Eurydice, generic descent motif

## Global acceptance criteria

### Closed-catalog integrity
- Unknown catalog IDs: 0/15 runs.
- Model-authored title/tradition reaching UI: 0/15.
- Generic motif labels reaching UI: 0/15.
- Displayed title and tradition must equal the catalog record: 100%.

### Stability
- Required primary archetype: 3/3 on strong archetype-positive dreams.
- Required myth catalog ID: 3/3 ideal; 2/3 minimum provisional pass.
- Myth-negative dreams: `amplifications: []` in 3/3.
- Fully negative dream: both arrays empty in 3/3.
- Any forbidden myth on any run is a test failure.

### Grounding and language
- Evidence must come from the raw dream, not the reflection.
- Exact quotes remain in Greek; paraphrases must not be presented as quotes.
- Resonance and divergence should be in Greek.
- Reflection-only names or parallels must not affect selection.

### Output discipline
- Archetypes: 0–2 only.
- Mythic Echo: 0–1 only.
- No low-confidence outputs.
- No duplicate archetypes or duplicate myth records.

## Pass rule for the set

A production-ready pass requires:
- all closed-catalog integrity criteria at 100%;
- no false-positive myth on C2 or C4;
- exact myth ID on at least 2/3 runs for C1, C3, and C5;
- required primary archetype: 3/3 on C1 and C2; Death–Rebirth on ≥2/3 for C5;
- zero archetypes on all three C3 and C4 runs;
- no forbidden archetype more than once across the entire 15-run set.