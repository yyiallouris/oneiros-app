# Oneiros v1 echo presentation implementation closeout

Last updated: 2026-07-28

This file is intentionally self-contained.

It captures the final approved implementation direction after the v1 closing verification packet.

## Final decision

```text
ready for v1 presentation
after a small deterministic composition adjustment
```

Do not open a new prompt, schema, or catalog tuning cycle.

## 1. Archetype presentation — approved

Implement the archetype cards from the existing structured fields only:

```text
canonical_label
expression
resonance
```

Use this structure:

```text
[Archetype title]

Πώς εμφανίζεται
[expression]

Τι φέρνει στο όνειρο
[resonance]
```

Add only deterministic typography cleanup:

```text
- uppercase first visible character
- ensure final punctuation
- collapse accidental repeated whitespace
- do not rewrite or summarize the content
```

Hide the entire section when:

```text
archetypes = []
```

No new model fields are required.

## 2. Myth presentation — approved architecture, naturalize the synopsis

Keep the three-part structure:

```text
Ο μύθος
Πού συναντά το όνειρό σου
Πού διαφέρει
```

The localized `core_synopsis` must render as 1–2 natural sentences, not as a compressed database list split by `·` or `;`.

Not acceptable:

```text
χωρισμός· μητρική θλίψη και στέρηση· λιμός·
θεϊκή διαπραγμάτευση· κυκλική επανένωση
```

Acceptable shape:

```text
Η Περσεφόνη χωρίζεται από τη Δήμητρα και μένει στον κάτω κόσμο.
Η επιστροφή της γίνεται κυκλική, συνδέοντας τον αποχωρισμό και την
επανένωση με τη μεταβολή των εποχών.
```

For Orpheus:

```text
Ο Ορφέας κατεβαίνει στον κάτω κόσμο για να φέρει πίσω την Ευρυδίκη.
Του επιτρέπεται να επιστρέψει μαζί της υπό τον όρο να μην κοιτάξει
πίσω· όταν παραβιάζει τον όρο, τη χάνει για δεύτερη φορά.
```

Rules:

```text
- catalog core_synopsis remains the semantic source of truth
- canonical title may supply the mythic names
- preserve actors, causal sequence, conditions and outcome
- natural grammatical translation is allowed
- no dream interpretation inside the synopsis
- no invented myth details
- no resonance or divergence passed into localization
```

Cache remains:

```text
myth_catalog_version + catalog_id + target_language
```

Also localize the tradition label deterministically:

```text
Greek mythology -> Ελληνική μυθολογία
Hebrew Bible / Tanakh -> Εβραϊκή Βίβλος / Τανάκ
```

Canonical myth title may remain under the existing product convention.

## 3. Empty subsections

Use:

```text
amplifications = []
-> hide the entire Mythic Parallel section

divergence empty
-> omit only “Πού διαφέρει”

synopsis localization failure
-> omit only “Ο μύθος”
-> preserve resonance and divergence
```

No placeholder copy and no fabricated explanation.

## 4. Inner Tensions — close with one accepted residual

Language and image-near phrasing passed.

The ordinary-kitchen smoke produced:

```text
καθαρό ποτήρι vs άπλυτα ποτήρια
```

This is a real restraint false positive, but it is not a release blocker.

Do not add a brittle lexical filter and do not retune the extraction prompt before v1.

Document this as:

```text
Known v1 residual:
central_conflicts may occasionally elevate a small practical obstacle
into a low-significance tension.
```

Keep the current behavior for the first release.

Do not hide all single-item tensions, because that would suppress legitimate results such as:

```text
closeness vs departure
```

## 5. Implementation scope

Implement only:

```text
archetype card composition
myth card composition
natural synopsis localization
localized tradition labels
empty-subsection behavior
```

Do not change:

```text
dream extraction prompt
schema version
archetype catalog
myth catalog
archetype/myth selection logic
central_conflicts generation
model routing
persisted metadata
```

## 6. Tests required

Add deterministic unit tests for:

```text
archetype sentence casing and punctuation
natural localized myth synopsis
localized tradition label
missing divergence
missing synopsis
empty archetypes
empty amplifications
cache key includes catalog version + id + language
localization does not mutate persisted metadata
```

One UI snapshot/example each is sufficient for:

```text
two archetypes + one myth
archetype only
no echoes
myth without divergence
```

No new live five-dream benchmark is required.

## Final release status

After these deterministic adjustments:

```text
Inner Tensions: release-ready with known restraint residual
Archetypal Echo presentation: ready
Mythic Parallel presentation: ready
new model fields: not required
new prompt tuning: not required
```

Close this thread after the implementation tests pass.
