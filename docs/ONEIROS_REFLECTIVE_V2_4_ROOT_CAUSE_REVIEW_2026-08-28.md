# Oneiros Reflective Questions v2.4 — root-cause review

**Date:** 2026-08-28  
**Evaluated identity:** Dialogue `oneiros-reflective-dialogue-v1.4.0` + Questions `oneiros-reflective-question-v2.4.0`  
**Artifact schema:** `3`  
**Bundle SHA:** `046c22a679e06ad210db36466516e971eb2ecd8152da37cdb72a3e744dca39de`  
**Decision:** `FAIL — DENIED; DO NOT DEPLOY`  
**Successor:** Dialogue `1.5.0` + Questions `2.5.0`, schema `4`, fail-closed and unbenchmarked

## Executive verdict

V2.4 was mechanically stable but experientially unfit for release. It reproduced the architecture's core failure rather than merely exposing a few weak phrasings:

- the initial run returned `28/35` questions, `7` abstentions, and `0` technical failures;
- the validator rewrote `12/28` committed questions: `42.86%` repair dependency, above the `35%` blocker;
- only `16/28` committed questions survived untouched;
- the expert severity screen found `12 PASS / 12 WEAK / 11 FAIL` across the full initial packet;
- among the `16` untouched validator accepts, only `5` were clear `PASS` (`31.25%`), far below the `80%` gate;
- the dialogue packet returned `6` optional questions and `10` abstentions with `0` technical failures, but none of the six continued questions was a clear pass: `0 PASS / 3 WEAK / 3 FAIL`;
- dialogue-answer review was `6 PASS / 6 WEAK / 4 FAIL`.

This review was evidence- and provenance-aware, not blind. It is sufficient to deny the bundle because hard failure families and mechanical blockers are already present. It does **not** claim fluent-native certification for all 12 languages; that gate would still be required for any future passing candidate.

## Safety and cost record

The external run used only tracked synthetic fixtures through the authenticated Oneiros proxy. No production dream, account record, database write, migration, function deploy, or user-visible mutation occurred. Raw outputs exist only under ignored `tmp/` paths.

| Packet | Cost | Notes |
|---|---:|---|
| 35 initial questions | `$0.1820180` | cached readings `$0`; generator `$0.0816960`; validator `$0.1003215` |
| 16 dialogue trajectories | `$0.0764775` | answer `$0.0284055`; generator `$0.0257445`; validator `$0.0223275` |
| **Total new spend** | **`$0.2584955`** | one authorized run of each packet; no rerun |

The validated reading cache avoided repeating approximately `$0.590797` of full-reading calls from the prior 35-case run.

## Root cause

The failure was not a missing safety instruction. It came from three architectural incentives.

### 1. The validator remained a second copywriter

Although repair was described as surgical, the model treated stylistic unease as permission to rewrite. Nine of twelve repairs were labeled `language_realization`. Several were worse than the candidate:

- `Τι σε κάνει να κρατάς την ξεθωριασμένη απόδειξη…;` became the more abstract `Τι μένει από την απόδειξη όταν την κρατάς…;`
- `Τι χώρο σού άφηνε αυτό το ασανσέρ…;` became the semantically stranger `Τι άφηνε να συμβεί αυτό το ασανσέρ…;`
- the Japanese `HOME` question became a construction equivalent to asking what the dreamer's eyes feel.

At the same time, the validator accepted generic or unsupported predicates it was meant to reject: `τι αλλάζει`, an imagined desire in the dreamer's hands, a change assigned to the ridge, and a forced Chinese binary.

### 2. The initial question model read the entire interpretation

The full reading was labeled provisional, but its long interpretive prose still dominated the linguistic field. The question model imitated abstract operators such as change, remainder, holding, inner movement, and assigned agency instead of speaking from the raw dream's exact action. Treating the reading as “orientation” did not remove this style contamination.

### 3. Dialogue had a minimum-length pressure

The `70–170` word target forced expansion when the honest response was short. That pressure caused the answer model to generate meaning after `nothing`, simple joy, an ambiguous `yes`, an explicit wish to stop, or absence of pain. The clearest hard failure repeated the known prohibited inference: no pain became a transformation “already accepted by the body of the dream.”

The Japanese one-word reply `はい` was treated as meaningful evidence, expanded into an interpretation, and followed by essentially the same question again. This is not depth; it is unsupported uptake.

## Initial packet — case-level severity screen

`PASS` means the output or abstention was preferable and genuinely usable. `WEAK` means safe enough but low-pull, repetitive, awkward, or a missed opening. `FAIL` means generic/invented premise, forced choice, malformed language, intrusive continuation, or a serious missed commit.

| Case | Provenance | Verdict | Main finding |
|---|---|---:|---|
| bus-stop-faded-receipt | repair | WEAK | repair replaced a concrete custodial act with generic “what remains” |
| elevator-missing-button | repair | FAIL | unnatural agency: the elevator “allowed something to happen” |
| refrigerator-light-and-lemon | accept | WEAK | specific but asks past the dream's already stated small satisfaction |
| child-lost-at-station | repair | WEAK | abstract “what stayed in your gaze” avoids the hand, guilt, and uncertain hat |
| red-water-under-door | accept | FAIL | reusable `τι αλλάζει για σένα` shell accepted unchanged |
| sunrise-on-quiet-ridge | accept | FAIL | assigns an unstaged inner change to the ridge |
| snowfield-with-warm-stones | accept | WEAK | asks for a cause already substantially answered by peace and curiosity |
| humming-stone-chamber | validation abstain | FAIL | malformed generator wording loses a rich, safe numinous opening |
| shadow-arrives-first | repair | WEAK | dream-specific nouns inside generic `τι κάνει σε σένα` grammar |
| words-rest-on-table | repair | PASS | concrete imaginal contact; answerable without diagnosis |
| backward-train-forward-city | validator abstain | WEAK | correctly rejects abstraction but misses a vivid directional opening |
| two-suns-midnight-market | validator abstain | WEAK | safe rejection, but no question survives a rich contradiction |
| shared-scarf-at-harbor | accept | FAIL | presupposes difficulty although the dream explicitly stages ambivalence |
| shared-bed-changing-faces | accept | PASS | stays with touch, changing faces, and constant pleasure |
| skin-turns-to-bark | validator abstain | PASS | correctly rejects a forced root-or-travel binary |
| voice-becomes-colored-thread | validator abstain | PASS | rejects hidden-content grammar rather than inventing what light reveals |
| transparent-body-at-family-picnic | repair | PASS | embodied uncertainty remains at the attempted hand contact |
| airport-gate-never-opens | accept | WEAK | evocative but semantically unclear about what the bell “held behind it” |
| dinner-for-absent-host | validator abstain | PASS | correctly rejects a generic change frame around absence |
| archive-stairs-during-earthquake | accept | PASS | exact relation to the closed named envelope and held cord |
| en-watch-runs-backward | repair | WEAK | natural and safe, but largely restates backward time plus calm waiting |
| es-paraguas-en-la-cocina | repair | FAIL | generic inner-movement formula replaces the umbrella's own turning |
| fr-grand-mere-noeud | accept | PASS | simple, image-near attention to the knot being untied |
| de-zug-im-wald | accept | FAIL | assigns a holder/causal agent to doors that are merely open |
| it-mare-nella-ciotola | accept | WEAK | asks what changes although the dream already says the sea grows calmer |
| pt-casa-sem-portas | accept | PASS | inhabitable relation among arranging flowers, light, and no wish to leave |
| nl-fiets-krijgt-wortels | repair | PASS | concrete bodily movement with roots touching the street |
| pl-oddychajace-ksiazki | repair | WEAK | moves the change into the book although the dream stages the breath slowing |
| ru-siniy-klyuch | accept | FAIL | semantically unnatural question about what “makes” the key blue |
| ja-yoru-no-eki | accept | WEAK | stays calm but asks where an already stated reassurance remained |
| zh-niuli-de-he | repair | FAIL | forced binary survives both generator and validator |
| en-spanish-door-phrase | accept | FAIL | invents what the dreamer's hands “wanted” to do |
| fr-enseigne-stay | accept | PASS | specific tension between the lit word and continuing to walk calmly |
| ja-neon-home | repair | FAIL | awkward assigned feeling to the dreamer's eyes |
| zh-faguo-mingzi | validator abstain | PASS | correctly rejects a forced water/paper binary |

## Dialogue packet — case-level severity screen

| Scenario | Verdict | Next question | Main finding |
|---|---:|---:|---|
| transparent-warm-hand | WEAK | WEAK | vivid warmth, but adds possession language and ends in generic change |
| calm-correction | PASS | abstain | genuinely surrenders the earlier tension frame |
| ordinary-not-knowing | FAIL | FAIL | says nothing may remain nothing, then immediately asks what remains from the lemon |
| user-led-life-bridge | FAIL | FAIL | inflates the user's association into inner warmth and revelation becoming relationship |
| direct-meaning-request | FAIL | abstain | no pain is interpreted as bodily acceptance: explicit epistemic violation |
| joy-without-hidden-problem | PASS | abstain | preserves simple enoughness without manufacturing lack |
| grief-without-therapy-script | WEAK | WEAK | image-near grief, but adds presence/absence metaphysics and a generic change question |
| brief-natural-completion | WEAK | abstain | respects the ending but supplies more interpretation than the closing turn warrants |
| spanish-calm-correction | PASS | abstain | protection genuinely revises tension; no intrusive follow-up |
| french-nothing-changed | WEAK | abstain | no question, but still insists that the lemon “counts” |
| russian-painless-meaning | PASS | abstain | explicitly refuses numbness/defense and stays provisional |
| japanese-simple-joy | PASS* | abstain | preserves enoughness; native fluency still requires independent review |
| chinese-grief-chair | PASS* | abstain | concrete grief uptake without advice; native fluency still requires review |
| english-to-spanish-switch | WEAK | WEAK | language switch works, but the new question repeats the user's answer |
| japanese-ambiguous-brief | FAIL | FAIL | treats `はい` as substantive evidence and repeats the same inquiry |
| polish-natural-completion | WEAK | abstain | stops correctly but over-explains after an explicit wish to finish |

## Implemented successor: v2.5 simplification

V2.5 does not add a tournament, another repair layer, a new psychological taxonomy, or language-specific prompt rules.

1. Initial question generation receives raw `D#` dream evidence only. The full reading remains user-visible but is not sent into the question generator or validator.
2. The validator schema permits `accept | abstain` only. Accept must be byte-identical; any attempted `repair` is rejected again by deterministic commit validation.
3. The validator is explicitly judge-only. Naturalness problems, generic predicates, and weak hinges abstain rather than becoming rewritten copy.
4. The question contract adds one epistemic predicate test: do not ask for an experience the dream already states or assign wanting/changing/accepting/meaning not staged by evidence.
5. Dialogue has no minimum word quota. One sentence may be the complete response to an ambiguous, corrective, ordinary, or closing turn.
6. Dialogue explicitly states that absence of pain cannot establish acceptance, integration, distance, harmlessness, or bodily knowledge.
7. V2.4 is added to the denied deploy identities. V2.5 remains unapproved and receives no live rerun in this work session.

## Release status

- V2.4: denied permanently.
- V2.5: implemented locally, fail-closed, tests required, no human-quality claim.
- Production gateway: unchanged; no deploy performed.
- Initial reading typing/streaming: unchanged.
- `archetypes`, `amplifications`, extraction schemas, Echoes, and lower Dream Detail metadata: unchanged.

Raw evidence:

- `tmp/reflective-question-v2-production-benchmark-2026-08-28T08-01-46-788Z/results.json`
- `tmp/reflective-dialogue-v1-benchmark-2026-08-28T08-02-38-603Z/results.json`

