# Oneiros v4.1.3 — Post-Patch-A Dev Brief

## Executive decision

Patch A is accepted.

Keep the v4.1.2 evidence-ID architecture exactly as deployed:

- one `dream_metadata_extract` call
- temperature `0`
- closed myth catalog
- raw dream sent once with `[Dn]` spans
- model returns `evidence_ids`
- server resolves exact source text
- no fuzzy evidence traceability
- no open-world fallback

Do **not** enlarge the production prompt with dream-specific or archetype-specific examples.

The next work is split into two isolated patches:

1. Patch B — Trickster carrier taxonomy and carrier/mechanism alignment
2. Patch C — myth prompt-index redesign and candidate-specific catalog gates

Do not implement B and C in one benchmark batch.

---

# Findings from Patch A

## Evidence transport is fixed

Observed:

```text
Fisherman raw/post: 4/5
Sisyphus raw/post: 2/3
evidence_not_traceable_to_dream: 0
```

Do not revisit the evidence architecture unless a new deterministic ID bug appears.

## Trickster issue is confirmed

Current catalog record:

```text
kind: archetypal_figure
allowedCarrierKinds: absent
```

Observed behavior:

- older runs frequently assigned Trickster to the giant/shape-shifting figure
- Patch A target:
  - one correct `dream_ego_action`
  - one incorrect/blurred `relationship`
  - three omissions
- validator accepts figure or relationship because there is no Trickster carrier-kind gate

The problem is not missing mechanism tags.
The problem is carrier taxonomy, carrier ownership, and raw recall.

## Myth compact-index issue is confirmed

The generated compact lines truncate decisive narrative information.

Examples:

- Inanna sequence stops at `deathlike immobilization`, omitting revival/return.
- Orpheus sequence stops at ascent, omitting backward look and second loss.
- Fisherman sequence stops at proof challenge, omitting re-entry/resealing/bargain.
- Sisyphus sequence stops at descent to base, omitting exact restart.
- only the first disqualifier is retained.
- later relational roles are dropped.
- synopsis strings are cut with ellipses, sometimes mid-phrase.

This is a generator architecture problem, not a reason to add examples to the prompt.

## Catalog contamination detected

The Fisherman record contains:

```text
optional later guide animal
```

as a relational role.

That is target-dream accommodation, not part of the canonical tale structure.
Remove it.

Catalog records must represent the source narrative.
Dream-specific additions belong only in `divergence`, never in the catalog.

---

# Patch B — Trickster carrier architecture

## Versioning

```text
prompt_version: 4.1.3-B
archetype_catalog_version: 1.2.0
schema_version: remain 7 unless the raw object changes
```

## Catalog record

Replace the current Trickster record with a functional record:

```ts
{
  id: "trickster",
  canonicalLabel: "Trickster",
  displayLabel: "The Trickster",
  kind: "archetypal_function",

  coreFunction:
    "Cunning, inversion, or rule-bending that changes leverage, exposes a false structure, or opens a new possibility.",

  allowedCarrierKinds: [
    "dream_ego_action",
    "figure",
    "relationship"
  ],

  preferredCarrierKinds: [
    "dream_ego_action",
    "figure",
    "relationship"
  ],

  requiredTagGroups: {
    anyOfGroups: [
      [
        "deception_or_feigned_belief",
        "inversion_or_rule_bending"
      ]
    ],
    allOf: [
      "power_asymmetry_reversed"
    ]
  },

  insufficientWhen: [
    "shape-shifting alone",
    "unpredictability alone",
    "changing promises alone",
    "humor alone",
    "lying without a structural reversal",
    "rule-breaking without changed leverage"
  ]
}
```

Do not mention:

- giants
- vessels
- resealing
- this benchmark dream

## Carrier ownership

Add to the raw archetype object:

```ts
mechanism_actor:
  | "dream_ego"
  | "other_figure"
  | "relationship"
  | "whole_process";
```

Validation:

```text
dream_ego_action  → mechanism_actor must be dream_ego
figure            → mechanism_actor must be other_figure
relationship      → mechanism_actor must be relationship
whole_dream_process → mechanism_actor must be whole_process
```

For Trickster, the actor performing the qualifying cunning/inversion must be
the carrier.

A figure must not receive Trickster merely because:

- it changes shape,
- it makes escalating promises,
- another actor tricks it,
- the relationship as a whole ends in reversal.

## Evidence role separation

Keep `evidence_ids`, but add:

```ts
carrier_evidence_ids: string[];
mechanism_evidence_ids: string[];
```

Constraints:

- all IDs must exist
- both arrays must be non-empty
- mechanism evidence must support the qualifying action
- the same IDs may appear in both arrays
- app-facing evidence may still be a merged, deduplicated list

Do not add explanatory prose to the prompt.
The schema fields themselves provide the structure.

## Validator

For Trickster require:

```text
carrier kind allowed
AND carrier/mechanism actor aligned
AND
(deception_or_feigned_belief OR inversion_or_rule_bending)
AND power_asymmetry_reversed
```

Reject:

```text
figure + dream_ego mechanism actor
relationship + dream_ego mechanism actor
shape-shifting figure without its own leverage reversal
```

The validator must only reject.
It must not replace the carrier or generate a Trickster candidate.

## Minimal prompt-facing line

```text
- Trickster
  function: cunning or inversion that changes leverage or exposes false structure
  carriers: action | figure | relationship; prefer the actor that performs the reversal
  require: (deception_or_feigned_belief | inversion_or_rule_bending) & power_asymmetry_reversed
  not enough: shape-shifting, promises, lying, humor, or strangeness alone
```

This replaces the older line. Do not add an example.

## Patch-B benchmark

Run the Fisherman target 7 fresh uncached times.

Acceptance:

```text
Trickster raw: >= 5/7
Trickster post: >= 5/7
correct carrier:
  dream_ego_action + mechanism_actor=dream_ego: >= 5/7
wrong giant/shape-shifter carrier: 0/7 post
blurred relationship carrier: <= 1/7 raw and 0/7 post
Guide / Psychopomp: allowed as second
Wise Old Woman: <= 1/7
```

Also run 5 negative Trickster cases:

- shape-shifter with no cunning reversal
- liar who gains no leverage
- chaotic animal causing confusion only
- ordinary joke
- rule-breaking with no structural consequence

Expected Trickster post: `0/5`.

Do not tune between runs.

---

# Patch C — Myth prompt-index redesign

## Versioning

```text
prompt_version: 4.1.3-C
myth_catalog_version: 1.2.0
myth_prompt_index_version: 2
schema_version: increment only if `matched_feature_ids` is added
```

## Design goal

Replace the current prefix-truncated line generator.

Do not add more prose to the general Mythic Echo prompt.

The model should see a compact, complete, candidate-specific signature.

## Prompt-facing index should not include title/tradition

The model returns only `catalog_id`.

Canonical title/tradition are resolved server-side.

Remove title and tradition from the selection index to save tokens and reduce
famous-name bias.

Recommended line:

```text
[id]
sig:<complete compact causal signature>
roles:<compact defining roles>
req:<candidate-specific required feature groups>
anti:<strong nearest-false-match exclusions>
```

## New catalog fields

```ts
type MythFeature = {
  id: string;
  text: string;
};

type MythCatalogEntryV2 = {
  // existing canonical/display fields remain server-side
  prompt_signature: string;
  signature_features: MythFeature[];
  required_feature_groups: string[][];
  anti_features: MythFeature[];
};
```

## Model-facing myth object

```ts
type RawClosedCatalogMythicEchoV8 = {
  catalog_id: string;
  evidence_ids: string[];
  matched_feature_ids: string[];
  divergence_type:
    | "outcome_changed"
    | "emphasis_changed"
    | "pattern_interrupted"
    | "pattern_unfinished";
  resonance: string;
  divergence: string;
  confidence: "high" | "medium";
};
```

Remove model-authored generic `matched_dimensions` from the acceptance gate.
It may remain as debug-only metadata but must not decide validity.

## Server validation

1. catalog ID exists
2. every matched feature ID belongs to the selected record
3. every required feature group has at least one matched feature
4. minimum total matched features:
   - medium: 3
   - high: 4, where available
5. evidence IDs exist
6. evidence spans at least two units
7. anti-feature triggered → reject
8. canonical display metadata resolved from the catalog

Do not let the model self-declare generic dimensions and pass from that alone.

## Generator requirements

The generator must never:

- truncate a signature with `…`
- cut a sequence after the first N items
- keep only prefix roles when later roles are distinctive
- keep only one disqualifier by default
- cut text mid-word or mid-clause

Use curated `prompt_signature` and compact feature IDs.

If a record lacks V2 fields, fail the build or exclude it behind an explicit
migration status. Do not silently fall back to prefix truncation.

## Token budget

Current myth index is approximately 9,485 tokens.

Target for V2:

```text
<= 9,485 tokens
preferred: 6,000–8,000
hard stop: 10,000
```

This must be a replacement, not an additive layer.

Report:

- old myth-index token count
- new myth-index token count
- total system-prompt token count
- average cost delta

---

# Required V2 records

## `arabian.fisherman_and_jinni`

Remove:

```text
optional later guide animal
```

Suggested signature:

```text
sealed vessel found → captive power released → liberator threatened →
feigned disbelief/proof challenge → being re-enters confinement →
resealing reverses leverage → bargaining becomes possible
```

Required groups:

```ts
[
  ["sealed_vessel", "released_captive_power"],
  ["threat_against_liberator"],
  ["proof_challenge", "induced_reentry"],
  ["resealing", "leverage_reversal"]
]
```

Anti-features:

```text
wish-granting without threat/reseal
magical being only
vessel only
```

## `greek.sisyphus`

Signature:

```text
solitary uphill stone labor → near summit → inevitable rollback →
return to base → exact same labor restarts without completion
```

Required groups:

```ts
[
  ["uphill_stone_labor"],
  ["near_summit", "rollback"],
  ["return_to_base", "exact_restart"],
  ["no_completion"]
]
```

## `greek.orpheus_eurydice`

Signature:

```text
beloved lost beyond death/threshold → lover crosses to retrieve →
conditional return with no-look rule → ascent toward life/light →
backward look before threshold cleared → second irreversible loss
```

Required groups:

```ts
[
  ["lost_beloved", "retrieval_crossing"],
  ["conditional_return", "no_look_rule"],
  ["backward_look", "second_loss"]
]
```

## `sumerian.inanna_descent`

Signature:

```text
voluntary underworld descent → seven successive gates →
one regalia/status item removed at each gate → arrival before underworld queen →
deathlike suspension → revival by two small rescuing beings →
return under altered conditions
```

Required groups:

```ts
[
  ["seven_gates", "successive_stripping"],
  ["underworld_queen_encounter"],
  ["deathlike_suspension"],
  ["two_rescuing_beings", "revival"],
  ["altered_return"]
]
```

## `kiche_maya.hero_twins_xibalba`

Signature:

```text
paired hero twins descend to Xibalba → deceptive lords impose trials →
twins strategically endure sacrifice/death → revive →
defeat or humiliate underworld lords → celestial transformation
```

Required groups:

```ts
[
  ["paired_twins"],
  ["xibalba_trials", "adversarial_contests"],
  ["strategic_death", "self_revival"],
  ["defeat_underworld_lords"]
]
```

Anti-features:

```text
two helper figures only
single descending protagonist
revival performed by helpers
```

## `greek.psyche_eros`

Signature:

```text
secret union with hidden lover → forbidden sight/trust condition broken →
lover lost → imposed tasks → underworld task/descent →
reunion and transformation
```

Required groups:

```ts
[
  ["hidden_lover", "forbidden_sight"],
  ["taboo_breach", "lover_lost"],
  ["imposed_tasks"],
  ["descent_for_reunion", "reunion"]
]
```

Anti-features:

```text
descent without lover separation
stripping without imposed tasks
revival without hidden-lover structure
```

---

# Patch-C benchmark

## Inanna target

Run 7 fresh uncached times.

Acceptance:

```text
sumerian.inanna_descent raw: >= 6/7
post: >= 6/7
Hero Twins raw: 0/7 preferred; post: 0/7 mandatory
Psyche/Eros post: 0/7
unknown IDs: 0/7
```

## Competitor regression

Run:

- 3 genuine Hero Twins dreams
- 3 genuine Psyche/Eros dreams
- 3 generic descent dreams that should return []

Acceptance:

```text
Hero Twins correct: >= 2/3
Psyche/Eros correct: >= 2/3
generic descents empty: 3/3
```

## Existing positives

Re-run:

- Fisherman 3 times
- Sisyphus 3 times
- Orpheus 3 times

Acceptance:

```text
Fisherman >= 3/3
Sisyphus >= 2/3
Orpheus >= 2/3
wrong myth post: 0
```

---

# Evidence display quality

Patch A currently returns up to six evidence IDs but materializes only the
first three in several runs.

Do not simply take the first three chronological IDs.

For UI display, choose up to three evidence units that maximize sequence coverage:

```text
first qualifying stage
decisive/reversal stage
ending or consequence stage
```

Implement deterministic spread selection, for example:

```ts
function selectDisplayEvidence(ids: string[], max = 3): string[] {
  if (ids.length <= max) return ids;
  return unique([
    ids[0],
    ids[Math.floor((ids.length - 1) / 2)],
    ids[ids.length - 1],
  ]).slice(0, max);
}
```

This is display-only.
Validation continues to use all supplied evidence IDs.

---

# Revised suite acceptance

## C1 Orpheus

```text
Guide / Psychopomp: expected
Lover: optional/desirable second
Orpheus catalog ID: >= 2/3
```

Do not fail solely because Lover is absent.

## C2 Persona

```text
Persona: 3/3
myth: [] 3/3
```

## C3 Sisyphus

```text
Sisyphus: >= 2/3
post retention of correct raw selection: 100%
archetypes: [] 3/3
```

## C4 Neither

```text
archetypes: [] 3/3
myth: [] 3/3
```

## C5 Inanna

```text
Inanna: >= 2/3, target 3/3
Death–Rebirth: 3/3 target
Terrible Mother: 0/3
wrong myth: 0/3
```

---

# Rollout order

1. Freeze v4.1.2 evidence-ID path.
2. Implement Patch B only.
3. Run Patch-B Fisherman + negative Trickster benchmark.
4. Freeze Patch B.
5. Implement Patch C index V2.
6. Run Inanna + competitor regression benchmark.
7. Re-run Fisherman/Sisyphus/Orpheus positives.
8. Run full five-dream suite once.
9. Do not tune between individual runs.

---

# Do not do

- Do not add dream-specific examples to the prompt.
- Do not expand the general prompt with Inanna/Trickster prose.
- Do not restore model-authored evidence strings.
- Do not weaken closed-catalog integrity.
- Do not add a second model call.
- Do not use myth selection to force archetype selection.
- Do not use archetype selection to force myth selection.
- Do not retain `optional later guide animal` in the Fisherman catalog.
- Do not use prefix truncation or ellipses in the prompt index.
- Do not change Death–Rebirth or Terrible Mother in this iteration.
