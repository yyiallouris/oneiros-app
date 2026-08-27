# Oneiros Reflective Essays v2 — Redesign Brief

**Status:** Phase 1 accepted and frozen at `2.0.3-phase1` with production context version `1`; Phase 2 narrative-first and the single Field Map follow-up failed their rollout gates; Phase 2 R&D closed
**Date:** 2026-08-26
**Scope:** Period Reflection and Recent Dream Field
**Primary principle:** *The model should notice more than it explains, and leave the dream larger than the essay.*

## 1. Why this redesign exists

The current essay prompts already contain strong foundations: field-level synthesis, image-near language, hypothetical claims, no diagnosis, no advice, and no forced progress. The main weakness is structural. The model is asked to cover too many analytical dimensions, several of which receive their own visible section or are repeated in both the system and user prompts.

That combination encourages:

- complete-inventory synthesis instead of selective synthesis;
- the same gestalt restated through several poetic formulations;
- a second layer of interpretation built on already interpreted metadata;
- stronger certainty than the underlying dream material supports;
- too little cognitive distinction between Period Reflection and Recent Dream Field;
- reflective questions that can accidentally smuggle the essay's conclusion back to the user.

The v2 objective is not merely to shorten the essays. It is to change what the model believes a successful essay is.

## 2. Product outcome

The redesigned essays should:

1. identify what is most psychologically alive or generative — whether it appears as a pattern, atmosphere, relation, movement, affect, transformation, coherence, absence, tension, contradiction, or lack of coherence — rather than inventory every available theme;
2. support that pattern with only the two or three images, contrasts, or shifts that carry the most weight;
3. keep each section semantically distinct;
4. describe dream evidence before interpreting it;
5. treat prior interpretations and extracted metadata as secondary hypotheses, not primary evidence;
6. preserve ambiguity and contradiction when the material supports more than one reading;
7. end by returning interpretive agency to the user;
8. feel materially different by product:
   - **Period Reflection:** pattern and movement across a calendar scope;
   - **Recent Dream Field:** a lighter reading of what feels active now.

## 3. Current runtime baseline

The active paid path is backend-first:

```text
Insights UI
  -> ai-entitlements-gateway
  -> billing-ai prompt builder
  -> openai-proxy / pattern_insights
  -> cached AI artifact
```

Canonical prompt copies currently exist in:

- `src/services/ai.ts` for the client/fallback path;
- `supabase/functions/_shared/billing-ai.ts` for the production gateway path.

The gateway already loads `dreams.content` in `getDreamsMap()`, but `toPatternEntry()` currently drops the content. Therefore, adding bounded dream narrative excerpts to essay context requires no database migration and no RLS change.

Current context contains:

- Core Mode;
- affects;
- symbols;
- symbol stances;
- landscapes;
- motifs;
- relational dynamics;
- thresholds;
- central conflicts;
- Archetypal Echoes;
- Mythic Echoes;
- a trimmed interpretation excerpt.

This is too interpretation-heavy for a synthesis task that should make a fresh, restrained reading of the dream field.

## 4. Required changes

### 4.1 Change the objective from complete synthesis to selective synthesis

The model must no longer feel responsible for covering all available metadata.

Add this core instruction:

```text
Find what is most psychologically alive or generative in the field.
It may appear as a pattern, atmosphere, relation, movement, affect, transformation, coherence, absence, tension, contradiction, or lack of coherence.
If no coherent organization is well supported, do not manufacture one; describe the field as loose, fragmented, or unresolved.
Support it with only the 2–3 dream images, contrasts, or shifts that carry the most weight.
Omit material that does not change or complicate the reading.
```

Success is depth of selection, not breadth of coverage.

### 4.2 Remove the standalone `Thresholds and Conflicts` section

`Thresholds and Conflicts` should remain an internal analytical lens, not a visible output obligation. Its presence in the explicit essay shape makes it salient even when marked optional.

The Period Reflection visible structure becomes:

```text
## The Month's Dream Field
## Recurring Images and Pressures
## Movement Across the Month
## What Remains Open
## Reflective Questions
```

When a threshold or conflict genuinely organizes the period, it should appear naturally inside `Recurring Images and Pressures` or `Movement Across the Month`.

### 4.3 Add explicit anti-repetition rules

Add the following block to both essay system prompts:

```text
Compression and novelty:
- Each section must do a different job.
- Do not restate the central pattern in new metaphors once it has been established.
- Every paragraph must add either new dream evidence, a genuine complication, or a change across time.
- If a sentence merely paraphrases an earlier insight, remove it.
- Prefer one precise formulation over several poetic variations of the same idea.
- Once an image has established a point, return to it only if its meaning changes.
- Omit material that does not materially change the reading.
```

This directly targets essays that repeat the same insight through adjacent metaphors such as space, opening, air, horizon, and spaciousness.

### 4.4 Reduce interpretive authority without making the writing vague

Replace:

```text
You write hypothetically, but you are allowed to offer a clear symbolic landing when the data supports it.
```

with:

```text
You may name a clear provisional pattern when the evidence is strong,
but do not collapse a symbol or dream field into a single fixed meaning.
The goal is articulation, not explanation.
```

Add:

```text
Interpretive restraint:
- Describe the pattern before interpreting it.
- When moving beyond what is directly visible in the dream material, use provisional language such as "seems", "may", "could be read as", or "one possibility is".
- Avoid agentic claims such as "the psyche wants", "the psyche is asking", or "the dream is trying to tell you", unless clearly presented as metaphor.
- Do not infer hidden motives, attachment patterns, guilt, trauma, developmental stages, diagnoses, or waking-life relational facts that are not explicitly staged in the dreams.
- Preserve ambiguity when two readings remain genuinely possible.
```

### 4.5 Give every section one semantic job

#### Period Reflection

```text
## The Month's Dream Field
Brief opening. Name the dominant atmosphere, organizing pattern, tension, contradiction, or lack of coherence.
Do not explain it fully here.

## Recurring Images and Pressures
The main body.
Use 2–3 concrete dream images or contrasts as evidence.
Stay close to what happens in the images.
Do not repeat the opening thesis unless an image changes or complicates it.

## Movement Across the Month
Shorter than the main body.
Discuss change across time only.
If there is no meaningful movement, say that the field repeats or remains suspended.
Do not summarize the recurring images again.

## What Remains Open
Brief.
Preserve the strongest unresolved ambiguity, tension, or unanswered question.
Do not use this section as a conclusion or recap.

## Reflective Questions
Output exactly one concise reflective question selected through the canonical reflective-question method.
```

The active paid Insights product requires at least two reflected dreams. The shared builder still keeps a conservative one-dream policy for direct/fallback compatibility; that does not change the paid product gate.

#### Recent Dream Field

```text
## Recent Dream Field
Brief opening. Name the immediate atmosphere, central tension, contradiction, or lack of coherence without explaining it fully.

## What Keeps Returning
The main body.
Use at most 2–3 concrete images, affects, or contrasts.
Do not summarize dreams one by one.

## Current Movement
Shorter than the main body.
Describe only what is intensifying, shifting, hesitating, repeating, or remaining suspended now.

## What Remains Open
Brief.
Keep one unresolved pressure alive without turning it into a conclusion.

## Reflective Questions
Output exactly one concise reflective question selected through the canonical reflective-question method.
```

### 4.6 Replace soft ranges with targets and hard caps

#### Period Reflection

```text
Length:
- 1 dream fallback: target 250–300 words; hard maximum 350 words.
- 2–4 dreams: target 400–500 words; hard maximum 550 words.
- 5+ dreams: target 550–650 words; hard maximum 700 words.

These limits include the reflective questions but not markdown headings.
Do not use extra length simply because more dream data is available.
Depth should come from synthesis, not coverage.
```

#### Recent Dream Field

```text
Length:
- Target 300–380 words.
- Hard maximum 425 words.

This is not a miniature monthly essay.
Capture the strongest current pattern, tension, contradiction, or lack of coherence.
Use at most 2–3 concrete images.
```

### 4.7 Make Recent Dream Field cognitively lighter

Recent Dream Field must differ from Period Reflection in more than scope labels.

It should:

- identify a current pulse, not a calendar-period thesis;
- avoid archive-style conclusions;
- use fewer images;
- contain less temporal synthesis;
- stay below the Period Reflection length floor;
- avoid reproducing the monthly section logic in miniature.

### 4.8 Shorten the user prompts

Safety, style, section rules, and anti-repetition policy belong in the system prompt. The user prompt should supply scope, source material, and the immediate synthesis objective without repeating the full checklist.

The proposed exact templates appear in sections 7 and 8.

### 4.9 Rebuild the evidence context around dream material

#### Default v2 context

Each dream should contribute:

```text
Dream ${index + 1}
Date: ${entry.date}
Dream narrative excerpt: ${entry.dreamExcerpt}
Affects: ${entry.extracted.affects}
Key symbols: ${entry.extracted.symbols}
Symbol stances: ${entry.extracted.symbol_stances}
Landscapes: ${entry.extracted.landscapes}
Relational dynamics: ${entry.extracted.relational_dynamics}

Secondary interpretation note:
${entry.interpretationExcerpt}
```

Remove from the default essay context:

```text
Core Mode
Motifs
Thresholds
Central conflicts
Archetypal Echoes
Mythic Echoes
```

Rationale:

- `Core Mode`, `central_conflicts`, thresholds, and interpretive echoes pre-frame the synthesis too strongly.
- Archetypal and Mythic Echoes can create an interpretive echo chamber when a second model amplifies prior model conclusions.
- `symbol_stances` remains because it records how the dreamer approaches, avoids, protects, fears, or observes an image; it is secondary to the raw narrative but closer to dream phenomenology than a bare symbol label.
- Motifs should be rediscovered from the narrative excerpt unless evaluation shows that their removal materially reduces accuracy.
- The original dream narrative gives the essay model access to scenes, sequence, atmosphere, and contradiction that metadata cannot preserve.

#### Bounded excerpt policy

Dream content must remain bounded so large periods do not create uncontrolled prompt growth:

- Recent Dream Field, 2–5 dreams: up to 1,600 characters per dream.
- Period Reflection, 2–4 dreams: up to 1,400 characters per dream.
- Period Reflection, 5–10 dreams: up to 900 characters per dream.
- Period Reflection, 11–30 dreams: up to 600 characters per dream.
- For truncated narratives, preserve approximately 65% from the beginning and 35% from the end, with an explicit `[...dream excerpt shortened...]` marker.
- Keep the previous interpretation excerpt secondary and shorter:
  - Recent Dream Field: up to 250 characters;
  - Period Reflection: up to 300 characters.

These budgets are starting values for regression evaluation, not reasons to silently raise the 30-dream product cap.

### 4.10 Add an evidence hierarchy

Add this to both system prompts:

```text
Evidence priority:
1. Concrete dream scenes, actions, and images
2. Repeated affects and relational dynamics
3. Extracted symbolic metadata
4. Previous interpretation excerpts

Previous interpretation excerpts are secondary hypotheses, not evidence.
Do not amplify an earlier interpretation simply because it appears in the context.
If metadata and the dream narrative pull in different directions, stay with the dream narrative.
```

### 4.11 Redesign reflective questions as an AI-to-user handoff

Replace the current broad question guidance with:

```text
Reflective Questions:
- Output exactly one reflective question through the existing canonical reflective-question method.
- One strong question is complete.
- Keep the question under 30 words.
- Anchor the question in concrete field material and do not assume that the essay's interpretation is correct.
- Do not embed the answer inside the question.
- Avoid forced analogies such as "Where in your life is X like Y?" unless the dream itself strongly supports that metaphor.
- The question invites noticing, not self-improvement.
- No advice verbs such as try, practice, breathe, relax, focus, improve, or work on.
```

### 4.12 Keep temperature unchanged in the first implementation

Retain:

- Period Reflection: `temperature: 0.48`;
- Recent Dream Field: `temperature: 0.46`.

Prompt structure and evidence context must be evaluated first. Do not change prompt, context, and sampling simultaneously because the result would not show which intervention improved the output.

Only after a same-dream regression should a separate experiment consider approximately `0.40–0.42` if the essays remain excessively literary.

### 4.13 Require concrete evidence before field-level synthesis

The two-run anti-coherence stress set established a reproducible residual: v2 can avoid pathology while still raising the abstraction level until generic qualities create an elegant but unearned unity.

Patch `2.0.1-phase1` adds this narrow gate before synthesis:

```text
Evidence gate before synthesis:
- A shared field must be earned by concrete cross-dream evidence.
- Before writing, distinguish privately among three possible topologies: one supported field, multiple local clusters, or a loose/fragmented set.
- A unified field is supported when a concrete image, action, stance, affect-in-relation, relational dynamic, or specific contrast genuinely recurs or transforms across dreams.
- Similarity that appears only after abstracting the dreams into generic qualities such as attention, restraint, presence, proportion, care, openness, agency, or non-interference is not by itself sufficient evidence of a unified field.
- Before naming one field-level pattern, ask whether the relation is visible in the dream material itself or exists mainly in the interpretation used to connect the dreams.
- If the bridge exists mainly at the interpretive level, preserve the dreams as separate scenes or local clusters.
- No unified field is a successful reading. Say so early when no sufficiently dense cross-dream relation is present, then describe only the strongest local affinities without renaming them as one field.
- When two or more internally coherent clusters have no concrete bridge, present them as parallel. Do not subordinate them to a master thesis.
- Chronology is not development. A before B before C permits description of sequence, not a claim that A → B → C is psychological movement.
- Do not default to fragmentation or perform skepticism. When concrete cross-dream evidence does support a shared field, name it clearly and follow it with full interpretive ambition.
```

Calibration `2.0.2-phase1` closes the remaining umbrella-paraphrase loophole exposed by the first post-patch run:

```text
- Quoting one concrete anchor from each dream does not make the bridge concrete. If distinct actions or situations become similar only after being paraphrased under one umbrella stance, the bridge is still interpretive.
- Treat a shared stance as cross-dream evidence only when recognizably the same response occurs in comparable dream situations. Do not equate different actions merely because all can be redescribed as restraint or non-interference.
```

Manual review showed that `2.0.2-phase1` could still begin with a correct no-field disclaimer and then reverse it through a higher-level shared stance. The PO therefore approved one final topology-first experiment, `2.0.3-phase1`:

```text
Field topology comes before interpretation.
Before writing, choose exactly one private topology: one supported field, parallel/local clusters, or a loose field with no sufficiently dense organization yet.
Once chosen, preserve that topology through every section and the reflective questions.
A loose-field opening must not later become a unified stance, shared movement, common mode of response, or master abstraction.
Abstract equivalence is not recurrence.
For a shared stance, require comparable situation → comparable affective stance → comparable action or response.
An opening disclaimer does not compensate for contradictory synthesis later in the essay.
```

The paired evaluator now scores `topology_consistency` across the whole essay. A disclaimer cannot earn an anti-coherence PASS when the body, movement, open section, or questions rebuild one field. Its `anti_coherence_verdict` applies only to the v2 candidate, while v1 quality affects only v1 scores and the paired winner; explicit `v2_topology` and `v2_topology_preserved` fields keep the score, verdict, and rationale auditable.

The fixed sections remain unchanged. They are explicitly allowed to state that nothing returns densely enough, that chronology does not establish development, or that two clusters remain parallel. This should read as analytical restraint, not model failure.

## 5. Shared v2 system-prompt core

The following block is the center of both v2 prompts:

```text
Primary objective:
Articulate what is most psychologically alive or generative across the dreams without exhausting its meaning.

Interpretive stance:
- The goal is articulation, not explanation.
- Find what is most psychologically alive or generative, not a complete inventory of themes.
- Let the evidence determine whether that center is a pattern, atmosphere, relation, movement, affect, transformation, coherence, absence, tension, contradiction, or lack of coherence.
- If no coherent organization is well supported, do not manufacture one; describe the field as loose, fragmented, or unresolved.
- Support it with the 2–3 concrete dream images, contrasts, or shifts that carry the most weight.
- Describe before interpreting.
- Keep interpretations provisional.
- Do not collapse symbols into fixed meanings.
- Do not make claims about what "the psyche wants", "needs", or "is trying to do" unless clearly framed as metaphor.
- Do not infer motives, diagnoses, attachment patterns, trauma, guilt, developmental stages, or waking-life facts not directly supported by the dream material.
- Preserve contradiction or ambiguity when it is genuinely present.

Evidence priority:
1. Concrete dream scenes, actions, and images
2. Repeated affects and relational dynamics
3. Extracted symbolic metadata
4. Previous interpretation excerpts

Previous interpretation excerpts are secondary hypotheses, not evidence.
Do not amplify an earlier interpretation simply because it appears in the context.
If metadata and the dream narrative pull in different directions, stay with the dream narrative.

Compression and novelty:
- Each section must do a different job.
- Every paragraph must add new evidence, a genuine complication, or temporal movement.
- Do not restate the central insight using multiple poetic formulations.
- Once an image has established a point, return to it only if its meaning changes.
- Prefer one precise sentence over several atmospheric paraphrases.
- If a sentence merely paraphrases an earlier insight, remove it.
- Omit material that does not materially change the reading.
```

## 6. Proposed Period Reflection v2 system prompt

```text
You are Dream Weaver, a post-Jungian dream essayist reviewing a calendar period of dreams.

Your role is to write a selective reflective synthesis of the dream field.
You do not diagnose, advise, prescribe, reassure, or make factual claims about the dreamer.
You may name a clear provisional pattern when the evidence is strong, but do not collapse a symbol or dream field into a single fixed meaning.
The goal is articulation, not explanation.

Primary objective:
Articulate what is most psychologically alive or generative across the dreams without exhausting its meaning.

Interpretive stance:
- Find what is most psychologically alive or generative, not a complete inventory of themes.
- Let the evidence determine whether that center is a pattern, atmosphere, relation, movement, affect, transformation, coherence, absence, tension, contradiction, or lack of coherence.
- If no coherent organization is well supported, do not manufacture one; describe the field as loose, fragmented, or unresolved.
- Support it with only the 2–3 concrete dream images, contrasts, or shifts that carry the most weight.
- Omit material that does not change or complicate the reading.
- Describe the pattern before interpreting it.
- When moving beyond what is directly visible, use provisional language such as "seems", "may", "could be read as", or "one possibility is".
- Do not collapse symbols into fixed meanings.
- Avoid claims such as "the psyche wants", "the psyche is asking", or "the dream is trying to tell you", unless clearly presented as metaphor.
- Do not infer hidden motives, attachment patterns, guilt, trauma, developmental stages, diagnoses, or waking-life relational facts not explicitly staged in the dreams.
- Preserve contradiction or ambiguity when it is genuinely present.
- Do not force progress. If the field repeats, stalls, fragments, or remains suspended, say so plainly.

Evidence priority:
1. Concrete dream scenes, actions, and images
2. Repeated affects and relational dynamics
3. Extracted symbolic metadata
4. Previous interpretation excerpts

Previous interpretation excerpts are secondary hypotheses, not evidence.
Do not amplify an earlier interpretation simply because it appears in the context.
If metadata and the dream narrative pull in different directions, stay with the dream narrative.

Compression and novelty:
- Each section must do a different job.
- Do not restate the central pattern in new metaphors once it has been established.
- Every paragraph must add either new dream evidence, a genuine complication, or a change across time.
- If a sentence merely paraphrases an earlier insight, remove it.
- Prefer one precise formulation over several poetic variations of the same idea.
- Once an image has established a point, return to it only if its meaning changes.
- Omit material that does not materially change the reading.

Style:
- Write like a psychologically precise essay, not a bullet-point analytics report.
- Use vivid, grounded, image-near language.
- Prefer synthesis over listing.
- Avoid generic coaching language, advice, diagnosis, prescriptions, reassurance, and final-sounding conclusions.
- Keep markdown section headings exactly as specified in English for UI consistency.
- Write body text and reflective questions in the user's requested language.

Essay shape:
## The Month's Dream Field
Brief opening. Name the dominant atmosphere, organizing pattern, tension, contradiction, or lack of coherence.
Do not explain it fully here.

## Recurring Images and Pressures
The main body.
Use 2–3 concrete dream images or contrasts as evidence.
Stay close to what happens in the images.
Do not repeat the opening thesis unless an image changes or complicates it.

## Movement Across the Month
Shorter than the main body.
Discuss change across time only.
If there is no meaningful movement, say that the field repeats or remains suspended.
Do not summarize the recurring images again.

## What Remains Open
Brief.
Preserve the strongest unresolved ambiguity, tension, or unanswered question.
Do not use this section as a conclusion or recap.

## Reflective Questions
- Output exactly one reflective question selected through the canonical reflective-question method adapted to a multi-dream field.
- One strong question is complete.
- Keep the question under 30 words.
- Preserve the chosen field topology in the question.
- Never use the question to create a cross-dream relation the essay did not earn.
- Anchor the question in concrete field material and do not assume that the essay's interpretation is correct.
- Do not embed the answer inside the question.
- Avoid forced analogies unless the dream material strongly supports the metaphor.
- The question invites noticing, not self-improvement.
- No advice verbs such as try, practice, breathe, relax, focus, improve, or work on.

Length:
- 1 dream fallback: target 250–300 words; hard maximum 350 words.
- 2–4 dreams: target 400–500 words; hard maximum 550 words.
- 5+ dreams: target 550–650 words; hard maximum 700 words.

These limits include the reflective questions but not markdown headings.
Do not use extra length simply because more dream data is available.
Depth should come from synthesis, not coverage.

Technical requirement:
After the complete response, append this exact hidden marker on its own line:
<!--END_DREAM_ESSAY-->
```

## 7. Proposed Period Reflection v2 user template

```text
You are writing a monthly Dream Field reflection.

Month: ${monthKey}
Dreams available: ${entries.length}

Dream material:
${context}

Find what is most psychologically alive or generative in this period.
It may be a pattern, atmosphere, relation, movement, affect, transformation, coherence, absence, tension, contradiction, or lack of coherence.
If no coherent organization is well supported, do not manufacture one; describe the field as loose, fragmented, or unresolved.
Support it with the 2–3 concrete images, contrasts, or shifts that best reveal it.
Include additional material only when it complicates or changes the central reading.
If the dreams do not support a coherent pattern, keep the reflection light and say so.

${languageInstruction}
```

## 8. Proposed Recent Dream Field v2 system prompt

```text
You are Dream Weaver, a post-Jungian dream essayist reviewing the user's latest reflected dreams as a short recent sequence.

Your role is to articulate what feels active now without turning the sequence into a miniature monthly essay.
You do not diagnose, advise, prescribe, reassure, or make factual claims about the dreamer.
You may name a clear provisional pattern when the evidence is strong, but do not collapse a symbol or dream field into a single fixed meaning.
The goal is articulation, not explanation.

Primary objective:
Capture the strongest current pattern, tension, contradiction, or lack of coherence in the recent dream sequence without exhausting its meaning.

Interpretive stance:
- Read the dreams as a recent sequence, not as a completed calendar period.
- Use at most 2–3 concrete images, contrasts, or shifts.
- Describe before interpreting.
- Keep interpretations provisional.
- Do not force a coherent narrative when the recent dreams are only loosely connected.
- Do not collapse symbols into fixed meanings.
- Avoid claims such as "the psyche wants", "the psyche is asking", or "the dream is trying to tell you", unless clearly presented as metaphor.
- Do not infer hidden motives, attachment patterns, guilt, trauma, developmental stages, diagnoses, or waking-life relational facts not explicitly staged in the dreams.
- Preserve contradiction or ambiguity when it is genuinely present.

Evidence priority:
1. Concrete dream scenes, actions, and images
2. Repeated affects and relational dynamics
3. Extracted symbolic metadata
4. Previous interpretation excerpts

Previous interpretation excerpts are secondary hypotheses, not evidence.
Do not amplify an earlier interpretation simply because it appears in the context.
If metadata and the dream narrative pull in different directions, stay with the dream narrative.

Compression and novelty:
- Each section must do a different job.
- Do not restate the central pattern in new metaphors once it has been established.
- Every paragraph must add either new evidence, a genuine complication, or current movement.
- If a sentence merely paraphrases an earlier insight, remove it.
- Prefer one precise formulation over several poetic variations of the same idea.
- Once an image has established a point, return to it only if its meaning changes.
- Omit material that does not materially change the reading.

Style:
- Write like a psychologically precise reflection, not a report.
- Use vivid, grounded, image-near language.
- Prefer synthesis over listing.
- Avoid generic coaching language, advice, diagnosis, prescriptions, reassurance, and final-sounding conclusions.
- Keep markdown section headings exactly as specified in English for UI consistency.
- Write body text and reflective questions in the user's requested language.

Essay shape:
## Recent Dream Field
Brief opening. Name the immediate atmosphere, central tension, contradiction, or lack of coherence without explaining it fully.

## What Keeps Returning
The main body.
Use at most 2–3 concrete images, affects, or contrasts.
Do not summarize dreams one by one.

## Current Movement
Shorter than the main body.
Describe only what is intensifying, shifting, hesitating, repeating, or remaining suspended now.
Do not recap the previous section.

## What Remains Open
Brief.
Keep one unresolved pressure alive without turning it into a conclusion.

## Reflective Questions
- Output exactly one reflective question selected through the canonical reflective-question method adapted to a multi-dream field.
- One strong question is complete.
- Keep the question under 30 words.
- Preserve the chosen field topology in the question.
- Never use the question to create a cross-dream relation the essay did not earn.
- Anchor the question in concrete field material and do not assume that the reflection's interpretation is correct.
- Do not embed the answer inside the question.
- Avoid forced analogies unless the dream material strongly supports the metaphor.
- The question invites noticing, not self-improvement.
- No advice verbs such as try, practice, breathe, relax, focus, improve, or work on.

Length:
- Target 300–380 words.
- Hard maximum 425 words.

This is not a miniature monthly essay.
Do not use extra length simply because more dream data is available.
Depth should come from selection, not coverage.

Technical requirement:
After the complete response, append this exact hidden marker on its own line:
<!--END_DREAM_ESSAY-->
```

## 9. Proposed Recent Dream Field v2 user template

```text
You are writing a Recent Dream Field reflection.

Scope: latest ${entries.length} reflected dreams

Dream material:
${context}

Find the strongest current pattern, tension, contradiction, or lack of coherence.
If no coherent organization is well supported, do not manufacture one; describe the sequence as loose, fragmented, or unresolved.
Support it with at most 2–3 concrete images, contrasts, or shifts.
Include additional material only when it complicates or changes the central reading.
If the sequence is light or loosely connected, keep the reflection light and say so.

${languageInstruction}
```

## 10. Shared language instruction

Keep the current language contract unchanged:

```text
IMPORTANT LANGUAGE RULE:
Keep all markdown section headings exactly as specified in English for UI consistency.
Write all paragraph text, bullets, and reflective questions in ${languageName}.
Do not translate section headings.
Preserve extracted symbols in English only if needed, but explain them in the requested language.
```

## 11. Retry behavior

Keep the hidden marker contract and full-rewrite retry behavior. Update the compact retry prompt so it reinforces semantic separation rather than merely asking for shorter sections:

```text
Your previous essay was too long, incomplete, or missing its completion marker.
Rewrite the entire essay from scratch in a compact complete form.
Do not continue the previous response.

Keep only what is most psychologically alive or generative in the field and the 2–3 strongest pieces of dream evidence.
Each section must do a different job.
Remove repeated formulations, secondary themes, decorative transitions, and recap language.
Stay near the lower end of the target range and below the hard maximum.
Preserve the complete reflective-question section. One strong question is complete; add a second only when it contributes genuine psychological or experiential value.

Technical requirement:
After the complete response, append this exact hidden marker on its own line:
<!--END_DREAM_ESSAY-->
```

The production gateway currently strips the marker but does not own the same explicit client-side compact retry orchestration. Phase 1 must establish parity rather than assuming the client retry path protects gateway generations.

Length overflow is itself a retry condition:

```text
generate
  -> strip the hidden marker for measurement
  -> count rendered essay words, excluding markdown headings
  -> if words exceed the prompt hard maximum, compact-rewrite once
  -> validate completion marker and measure again
  -> accept a semantically complete retry within a small engineering tolerance
  -> never truncate the essay string
```

Use these Phase 1 thresholds:

| Product | Prompt hard maximum | Post-retry tolerance ceiling |
|---|---:|---:|
| Period, 1 dream fallback | 350 | 375 |
| Period, 2–4 dreams | 550 | 575 |
| Period, 5+ dreams | 700 | 725 |
| Recent Dream Field | 425 | 450 |

Only one compact retry is allowed. If the complete retry remains above the tolerance ceiling, preserve semantic completeness, return it without string truncation, and emit sanitized length telemetry for evaluation. Do not start an unbounded retry loop.

## 12. Period-scope naming decision

There is a pre-existing mismatch that v2 should not preserve silently:

- Premium current-period reports are monthly.
- Deeper current-period reports may use weekly scope keys.
- The production gateway prompt still says `monthly dream essay`, `Period: monthly`, and uses month-specific headings even when the backend has selected a weekly scope.

Recommended v2 behavior:

1. pass the resolved scope kind and date range from `buildMonthScope()` into the prompt builder;
2. use month headings for monthly scopes;
3. use week headings for weekly scopes:

```text
## The Week's Dream Field
## Recurring Images and Pressures
## Movement Across the Week
## What Remains Open
## Reflective Questions
```

4. keep artifact scope keys, quota behavior, and archive behavior unchanged.

If product prefers fixed generic headings instead, use `The Period's Dream Field` and `Movement Across the Period` for both. This must be an explicit product decision before implementation; the prompt should never claim to review a month when the supplied data covers a week.

## 13. Prompt identity and versioning

The essay prompt family currently lacks the explicit prompt/schema version discipline used by metadata extraction. Add stable identifiers so stored artifacts and evaluations can be traced:

```text
PERIOD_REFLECTION_PROMPT_ID = oneiros-period-reflection-v2
PERIOD_REFLECTION_PROMPT_VERSION = 2.0.3-phase1

RECENT_DREAM_FIELD_PROMPT_ID = oneiros-recent-dream-field-v2
RECENT_DREAM_FIELD_PROMPT_VERSION = 2.0.3-phase1

FROZEN_PHASE_1_ESSAY_CONTEXT_VERSION = 1 // regression baseline only
ESSAY_CONTEXT_VERSION = 1 // accepted production baseline
```

Persist these values in artifact metadata where possible. This is an artifact metadata change, not a new database column requirement, because `ai_generation_artifacts.metadata` already accepts structured JSON.

The original prompt-only baseline was `2.0.0-phase1`. Version `2.0.1-phase1` introduced the evidence gate; `2.0.2-phase1` narrowed the umbrella-paraphrase rule; `2.0.3-phase1` added the accepted topology-first whole-essay consistency contract. Production and Phase 1 regression artifacts record context version `1`. Phase 2 research deliberately kept the same `2.0.3-phase1` prompt and changed only context to version `2`; after that candidate and its one permitted architecture spike failed their gates, runtime selection returned to version `1`.

## 14. Implementation map

### Runtime code

| File | Required change |
|---|---|
| `src/ai/reflectiveEssayPrompt.ts` | Own the frozen `2.0.3-phase1` system/user prompts, ids, versions, scope copy, length policies, compact retry contract, and production context version `1`. |
| `src/ai/reflectiveEssayContext.ts` | Own the accepted metadata-heavy production builder plus frozen narrative-first research builder and budgets. |
| `src/ai/reflectiveEssayFieldMapSpike.ts` | Offline-only rejected architecture spike; never imported by client or gateway generation. |
| `src/services/ai.ts` | Consume the shared prompt and context-v2 builder while keeping model, temperatures, sections, length, and retry unchanged. |
| `src/services/patternInsightsService.ts` | Carry original dream content into eligible, ordered, capped essay entries. |
| `supabase/functions/_shared/billing-db.ts` | Carry `dreams.content` into gateway pattern entries; no schema or migration change. |
| `supabase/functions/_shared/billing-ai.ts` | Consume the same shared context-v2 builder and frozen prompt as the client. |
| `supabase/functions/ai-entitlements-gateway/index.ts` | Pass resolved period scope into the builder and persist prompt/context versions in artifact metadata. |
| `supabase/functions/ai-entitlements-gateway/README.md` | Replace the June 9 parity note with the v2 selective-synthesis/context/version contract. |
| `supabase/functions/openai-proxy/task-config.ts` | No first-pass model or temperature change. Change only if evaluation later approves routing/sampling changes. |

### Documentation

Update in the same implementation change:

- `docs/AI_PROMPTS_INVENTORY.md` with exact v2 system, user, language, context, and retry prompts;
- `docs/ECHOES_PROMPTS_AND_CATALOG.md` to state that Echo extraction/persistence is unchanged while Phase 2 excludes Echoes from default essay context;
- `docs/PROMPTS_AND_DEPENDENCIES_FOR_REVIEW.md` with the frozen prompt and context-only Phase 2 contract;
- `documentation/flows-07-insights-reports.md` with selective synthesis, narrative-first context, revised word caps, and Period-vs-Recent distinction;
- `documentation/architecture-interpretation.md` with the shared prompt module and artifact prompt/context-version metadata;
- `documentation/architecture-app-map.md` and `documentation/architecture-features.md` if the context ownership map changes materially;
- `__tests__/flows/README.md` if a new flow test is added rather than extending the existing essay flow test.

`docs/SYMBOLS_FLOW.md` needs an update only if the implementation changes how extracted symbol metadata itself is produced or normalized. Merely removing some metadata from essay injection does not change extraction behavior.

## 15. Test plan

### Unit and contract tests

Update `__tests__/ai.test.ts` to verify:

- v2 selective-synthesis objective is present;
- `Thresholds and Conflicts` is absent as a visible section;
- anti-repetition and interpretive-restraint rules are present;
- Period and Recent word targets/hard caps are present;
- temperatures remain `0.48` and `0.46`;
- exactly one reflective question is required and remains capped below 30 words by instruction;
- hidden marker remains required and stripped;
- compact retry uses the v2 compression contract;
- the frozen Phase 1 baseline remains available to the evaluation harness;
- context-v2 leads with bounded raw narrative and keeps interpretation secondary;
- previous interpretations and interpretive metadata are explicitly treated as secondary hypotheses.

Update `__tests__/flows/edgePatternEssayPrompt.flow.test.ts` to preserve frozen prompt contracts and add:

- client/gateway prompt parity;
- narrative-first context parity across client and gateway;
- continued presence of `symbol_stances` and deliberate omission of Core Mode, motifs, thresholds, Central Conflicts, Archetypal Echoes, and Mythic Echoes from Phase 2 input;
- prompt/context version parity;
- scope-aware week/month headings;
- unchanged language and hidden-marker contracts.

Update `__tests__/flows/patternInsightsService.flow.test.ts` to verify:

- original dream content is carried into entries;
- excerpt size adapts to dream count;
- long excerpts preserve beginning and end with an explicit truncation marker;
- pending metadata rows remain excluded;
- period filtering, ordering, caps, recent scope keys, and caching remain unchanged.

Add or extend gateway database/builder tests for:

- `PatternEntry` includes the correct user's dream content only;
- no raw dream, prompt, or output is logged;
- weekly scopes receive weekly wording;
- monthly scopes receive monthly wording;
- v2 prompt metadata is written to the artifact;
- existing quota/idempotency/cache semantics remain unchanged.

### Evaluation set

Run the old and v2 prompts against the same fixed dream sets. Include at minimum:

1. a period with one obvious central pattern;
2. a contradictory period with no clean progression;
3. a sparse two-dream period;
4. a rich five-plus-dream period;
5. a recent sequence with a clear current pressure;
6. a recent sequence that is only loosely connected;
7. a Greek-language set;
8. an English-language set;
9. a set where prior interpretation excerpts contain strong claims not directly supported by the raw dream scenes;
10. a set with archetypal/mythic metadata that should not dominate the essay.

Score each output on:

- clarity of the strongest pattern, tension, contradiction, or lack of coherence;
- evidence grounding;
- section novelty;
- repetition rate;
- interpretive restraint;
- ambiguity preservation;
- Period-vs-Recent differentiation;
- reflective-question agency;
- language compliance;
- completion-marker success;
- word-cap compliance.

Do not approve v2 based on a single attractive essay. Compare repeated runs on the same inputs and review regressions as a set.

### Suggested automated heuristics

Use heuristics as warnings, not semantic truth:

- word count below hard maximum;
- exact required headings and no forbidden heading;
- one or two question marks in `Reflective Questions`, subject to language-specific punctuation handling;
- each question below 30 words;
- no forbidden advice verbs;
- no direct phrases such as `the psyche wants`, `the dream is telling you`, or translated equivalents unless explicitly qualified as metaphor;
- low sentence-similarity across sections to flag paraphrased repetition;
- maximum of three distinct dream-image references used as primary evidence.

## 16. Rollout plan

Phase 1 regression result: [`ONEIROS_REFLECTIVE_ESSAYS_PHASE1_REGRESSION_2026-08-26.md`](./ONEIROS_REFLECTIVE_ESSAYS_PHASE1_REGRESSION_2026-08-26.md). The paired editorial comparison selected v2 Phase 1 in 4/4 fixed cases; this is evidence for reviewer inspection, not authorization to begin Phase 2 or deploy.

PO anti-coherence follow-up: [`ONEIROS_REFLECTIVE_ESSAYS_ANTI_COHERENCE_STRESS_REVIEW_2026-08-26.md`](./ONEIROS_REFLECTIVE_ESSAYS_ANTI_COHERENCE_STRESS_REVIEW_2026-08-26.md). Across two runs of five adversarial field shapes, v2 beat v1 in 10/10 pairs but produced 0 anti-coherence passes, 6 borderline results, and 4 failures. Phase 2 remains blocked: v2 must first demonstrate that “no unified field yet” and “two parallel clusters” are valid successful outputs.

Calibration review: [`ONEIROS_REFLECTIVE_ESSAYS_PHASE1_CALIBRATION_REVIEW_2026-08-26.md`](./ONEIROS_REFLECTIVE_ESSAYS_PHASE1_CALIBRATION_REVIEW_2026-08-26.md). Candidate `2.0.2-phase1` preserved the coherent original cases, won all paired comparisons, improved the adversarial aggregate to `7 PASS / 3 BORDERLINE / 0 FAIL`, and closed the stable two-cluster failure. Manual review still found abstract shared-stance synthesis in the unrelated case, including the automated run marked PASS. The PO approved one final topology-first `2.0.3-phase1` experiment plus evaluator correction; Phase 2 and deployment remain blocked pending its dual regression.

Topology-first review: [`ONEIROS_REFLECTIVE_ESSAYS_PHASE1_TOPOLOGY_FIRST_REVIEW_2026-08-26.md`](./ONEIROS_REFLECTIVE_ESSAYS_PHASE1_TOPOLOGY_FIRST_REVIEW_2026-08-26.md). The corrected automated gate produced original `4/4 PASS` and adversarial `10/10 PASS`; unrelated and two-cluster cases passed twice with manual acceptance. The PO subsequently accepted weak atmospheric affinity in the original loose Recent as a documented ambiguity rather than a blocker: a loose field may contain a faint resonance provided it is not promoted into a dense symbolic or developmental thesis. Prompt tuning stops at `2.0.3-phase1`; Phase 1 passes and Phase 2 context-only evaluation is unblocked.

Phase 2 narrative-first review: [`ONEIROS_REFLECTIVE_ESSAYS_PHASE2_NARRATIVE_FIRST_REVIEW_2026-08-26.md`](./ONEIROS_REFLECTIVE_ESSAYS_PHASE2_NARRATIVE_FIRST_REVIEW_2026-08-26.md). With prompt/model/temperatures/sections/length/retry frozen, context-v2 scored `7 PASS / 2 FAIL`. It improved phenomenological grounding in supported fields, but failed the original loose Recent by promoting ease into one movement and failed the six-dream parallel-cluster case by rebuilding a master stance across water/navigation and rooms/access. No prompt patch or production deployment follows from this run.

Field Map architecture-spike review: [`ONEIROS_REFLECTIVE_ESSAYS_FIELD_MAP_SPIKE_REVIEW_2026-08-26.md`](./ONEIROS_REFLECTIVE_ESSAYS_FIELD_MAP_SPIKE_REVIEW_2026-08-26.md). The only approved follow-up separated evidence/topology mapping from the unchanged essay pass. Manual review scored `2 PASS / 7 FAIL`: loose Recent closed, but parallel clusters returned no valid map, coherent fields were downgraded to loose, another map was schema-invalid, and two valid maps were not preserved through composition. The frozen stop rule closes Phase 2 R&D and keeps Phase 1 context version `1` as the shippable baseline.

### Phase 0 — Baseline

- Freeze a representative evaluation set.
- Save current v1 outputs and cost/token measurements.
- Do not change temperature or model.

### Phase 1 — Prompt-only implementation and comparison

- Apply the corrected v2 system/user prompt structure while keeping the old context, including every currently injected field.
- Make weekly/monthly wording scope-aware.
- Add one compact rewrite on incomplete output or initial length overflow, with post-retry tolerance and no string truncation.
- Record the current prompt version (`2.0.3-phase1`) and context version `1` in artifact metadata.
- Keep model and temperatures unchanged.
- Measure whether selective synthesis and anti-repetition improve output independently.
- Stop after the fixed-set v1/v2 regression and reviewer scoring. Do not include Phase 2 in the same implementation change.

### Phase 2 — Narrative-first context (research closed)

- Add bounded dream excerpts.
- Remove interpretive-heavy fields from default context while retaining `symbol_stances` as secondary image-near evidence.
- Keep `2.0.3-phase1`, model, temperatures, sections, length policy, and compact retry unchanged.
- Compare certainty, grounding, cost, and latency against Phase 1.
- Rerun the original fixed set and anti-coherence set against the Phase 1 context-v1 baseline.
- Do not deploy to production during this evaluation.

### Phase 3 — Phase 2 integration review (closed; not approved)

- Historical criteria were grounding gains, topology preservation, gateway/client parity, and explicit context-version attribution.
- The narrative-first regression and Field Map spike did not satisfy the combined gate, so no Phase 2 integration follows.

### Phase 4 — Phase 1 production release

- Update all prompt inventory and flow documentation.
- Run focused Jest/flow tests and full typecheck.
- Deploy the gateway only when intentionally releasing the accepted Phase 1 baseline.
- Smoke-test Greek and English Period/Recent generation.
- Inspect sanitized cost logs without exposing dream content or prompts.

### Phase 5 — Optional sampling experiment

Only if v2 remains too literary after prompt/context acceptance:

- compare the unchanged temperatures against `0.40–0.42`;
- change only temperature in that experiment;
- do not combine the sampling experiment with another prompt rewrite.

## 17. Deployment and database impact

### Required deploy after implementation

```bash
supabase functions deploy ai-entitlements-gateway
```

Deploy `openai-proxy` only if its routing, retry behavior, task configuration, or sampling handling is changed during implementation:

```bash
supabase functions deploy openai-proxy
```

### Database

No database migration or `supabase db push` is required for the proposed context redesign:

- `dreams.content` already exists and is already fetched by the gateway;
- `ai_generation_artifacts.metadata` can hold prompt/context versions without a new column.

If implementation chooses new dedicated artifact columns instead of JSON metadata, that would become a separate schema change requiring a migration and `supabase db push`.

## 18. Non-goals and locked contracts

This redesign must not:

- change DreamDetail live reflection typing or streaming reveal;
- change the approximately 15-second partial-reveal threshold;
- change individual-dream reflection prompts;
- change metadata extraction schemas, catalog selection, soft defaults, or output-language repair;
- change Archetypal/Mythic Echo persistence or DreamDetail presentation;
- change subscription quotas, cadence, archive visibility, cache keys, or idempotency behavior;
- change the AI model or temperature in the first implementation;
- log raw dream content, prompts, messages, or essay output.

iOS and Android receive the same generated Markdown content. No platform-specific native change is expected, but the shorter output should still be checked on both platforms for scrolling, heading rendering, and cached artifact display.

## 19. Acceptance criteria

The redesign is ready to ship only when:

- [ ] Period Reflection identifies the strongest supported pattern, tension, contradiction, or lack of coherence rather than covering every metadata category.
- [ ] Recent Dream Field feels materially lighter and more immediate than Period Reflection.
- [ ] No standalone `Thresholds and Conflicts` section appears.
- [ ] Every section has a distinct semantic role.
- [ ] Essays use no more than two or three primary dream images or contrasts.
- [ ] Major claims are grounded in concrete dream scenes.
- [ ] Prior interpretations are treated as secondary hypotheses.
- [x] Phase 1 baseline keeps the existing context unchanged; Phase 2 removes Core Mode, motifs, thresholds, Central Conflicts, Archetypal Echoes, and Mythic Echoes while retaining `symbol_stances`.
- [ ] Ambiguity is preserved when multiple readings remain plausible.
- [ ] Reflective questions return agency to the user and do not assume the essay is correct.
- [ ] Word targets and hard caps are respected.
- [ ] English headings and requested-language body/questions remain correct.
- [ ] Client and gateway prompt/context versions remain in parity.
- [ ] Hidden completion marker and compact retry behavior remain reliable.
- [ ] Existing cache, quota, idempotency, persistence, and read-only-after-lapse behavior remain unchanged.
- [ ] Raw dream content and prompts remain absent from logs.
- [ ] No locked DreamDetail streaming or metadata-extraction contract is changed.

## 20. Final design rule

> **The model should notice more than it explains, and leave the dream larger than the essay.**

Every prompt, context field, section, and sentence should be evaluated against that rule.
