# Shot 3 vs production — frozen blind product rubric

Freeze this rubric before model calls. Do not consult theoretical
`enacted / imaginal / both` target labels; none exist for this fixture.

## Independent review — score A and B before comparing them

For each ending answer:

1. `would_ship_to_a_real_oneiros_user`: `YES | NO`
2. `earned_cardinality`: `PASS | FAIL`
3. `vital_specific`: `PASS | FAIL`
4. `fabricated_dream_fact`: `NO | SERIOUS_FAIL`
5. `manufactured_answer_menu`: `NO | SERIOUS_FAIL`
6. `structure_language`: `PASS | HARD_FAIL`
7. `failure_families`: zero or more concise identifiers
8. `notes`: one concrete reason

`earned_cardinality` passes when every visible question deserves its place:

- if there are two, the second adds a genuinely distinct opening rather than
  filling a slot or paraphrasing the first;
- if there is one, no obvious second opening is missing from the completed
  reading and dream;
- one strong question may hold multiple dream elements together when it does so
  naturally. It does not fail merely because a theoretical taxonomy might have
  split those elements into two jobs.

Bold, poetic, psychologically suggestive interpretation is allowed. A question
does not fail because it is enacted rather than imaginal, imaginal rather than
enacted, or less “safe” than generic phenomenology.

A `SERIOUS_FAIL` requires more than interpretive boldness:

- `fabricated_dream_fact`: the question makes the dreamer accept an unreported
  event, detail, memory, causal sequence, or relationship as something the dream
  actually staged;
- `manufactured_answer_menu`: the question supplies a bounded candidate answer
  space or conceptual alternatives that effectively answer/frame the question.
  Natural poetic descriptors or a dream-staged contrast are not automatically a
  menu.

## Pairwise review — only after both independent verdicts

Record:

1. `ending_preference`: `A | B | TIE | NEITHER`
2. `full_reading_preference`: `A | B | TIE | NEITHER`
3. `preference_is_driven_by_reflective_ending`: `YES | NO`
4. `pair_reason`: one concrete sentence

Primary product question:

> Which reflective ending would you actually rather deliver to a real Oneiros
> user after this dream and reading?

Do not prefer an output merely because it is shorter or safer. Do not prefer two
questions merely because two feels more complete. Judge whether the visible
opening or openings have earned their place.

## Pre-registered acceptance gate

The adaptive candidate becomes an editorial SHIP-candidate only if all are true:

- adaptive clear ending wins: at least `13/20`;
- production clear ending wins: at most `4/20`;
- adaptive independent `would_ship`: at least `15/20`;
- adaptive earned-cardinality PASS: at least `17/20`;
- adaptive serious fabricated-fact failures: `0`;
- adaptive serious answer-menu failures: `0`;
- adaptive structural hard failures: `0`;
- no adaptive failure family occurs more than once;
- production clear full-reading wins: at most `3/20`.

Any tie-like, mixed, or failed result parks adaptive openings for Oneiros v2.
Passing this editorial gate does not authorize deployment: it triggers a
separate deterministic engineering review for the `1–2` extraction,
normalization, persistence, streaming, and UI contracts.
