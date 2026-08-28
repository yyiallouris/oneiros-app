# Oneiros Reflective Intelligence — multilingual recovery plan

**Plan/version record:** `1.4.0`
**Date:** 2026-08-28
**Scope:** initial reflective question, Reflective Dialogue answer, optional progressive question, typed question card, benchmark and deploy gate
**Historical failed candidate:** Dialogue `oneiros-reflective-dialogue-v1.1.0` + Questions `oneiros-reflective-question-v2.2.0`, bundle SHA `295a65ef…`
**Denied diagnosis candidate:** architecture `2.4.0`, Dialogue `1.4.0`, Questions `2.4.0`, schema `3`, SHA `046c22a6…`
**Implemented local candidate:** architecture `2.5.0`, Dialogue `oneiros-reflective-dialogue-v1.5.0`, Questions `oneiros-reflective-question-v2.5.0`, artifact schema `4`, bundle SHA `ca2ac55b…`
**Current decision:** v2.4 human gate failed and is denied; v2.5 is implemented locally but not externally evaluated; fail-closed; do not deploy
**Implementation status:** runtime, schema compatibility, localized card, fail-closed reading cache, tests, 35-dream corpus, and 16 dialogue trajectories implemented; no v2.5 external run; no production deploy

**v1.4 implementation:** preserves the multilingual boundary and removes three failed architectural pressures exposed by v2.4: full-reading input to the initial question model, validator rewriting, and minimum dialogue length.

## Implementation checkpoint

Implemented on 2026-08-28:

- shared 12-language registry and request-local reflective language contract;
- latest-substantive-user language selection with established-language fallback for ambiguous brief replies;
- Dialogue `1.5.0` absence/non-event restraint, explicit no-pain epistemic boundary, evidence-led length, and strict `{ answer, output_language }` commit envelope;
- Questions `2.5.0` raw-dream-only initial input, evidence-bound `living_edge`, real-unknown predicate boundary, concrete-movement realization, and judge-only validator ownership;
- Structured Outputs schemas plus local parsers/commit checks for dialogue, generator, and validator;
- cross-script structural validation for Japanese/Chinese and Unicode question punctuation;
- artifact schema `4` with `languageCode`, while schema-3, schema-2, and schema-1 artifacts remain readable;
- card copy selected from artifact metadata in all 12 product languages, with English fallback for legacy/unknown metadata;
- frozen acceptance corpus of `35` initial dreams: unchanged Greek `20` plus multilingual `15` covering all 12 product languages;
- `16` synthetic dialogue trajectories: historical Greek `8` plus multilingual `8`, including language switch and ambiguous short-reply inheritance;
- benchmark protocol `1.5.0`, language mismatch, committed-candidate quality, stage cost, and validated reading-cache provenance.

V2.4's final live model execution and human scoring are complete and failed: initial `12 PASS / 12 WEAK / 11 FAIL`, only `5/16` clear PASS among untouched accepts, and dialogue continued-question quality `0 PASS / 3 WEAK / 3 FAIL`. Full record: [`ONEIROS_REFLECTIVE_V2_4_ROOT_CAUSE_REVIEW_2026-08-28.md`](./ONEIROS_REFLECTIVE_V2_4_ROOT_CAUSE_REVIEW_2026-08-28.md).

Still pending: any v2.5 external run, blind human scoring, fluent review of target-language output and localized card copy, and production approval/deploy. The earlier authorization does not authorize a new paid run. The hold remains active.

## Product decision

Oneiros is multilingual. Greek was the language of the first frozen depth corpus, not the language of the product contract. The correct contract is:

- the initial reading and its opening question use the dreamer's primary narrative language;
- a follow-up answer uses the latest substantive user turn's language when that turn clearly establishes one;
- if the latest turn is too short to establish a language, the exchange continues in its established language;
- quoted or deliberately code-switched phrases stay as the user wrote them;
- internal machine fields may remain English, but no internal framework label appears in user-facing prose;
- idiomatic naturalness is judged in the target language, never by an English or Greek template.

No production prompt should contain a Greek-specific, Spanish-specific, Japanese-specific, or other locale-specific psychological instruction. Locale knowledge belongs in the language contract, localized UI resources, tests, and human review — not inside the post-Jungian method.

## Pre-implementation review findings

The defects below describe v2.2 and the path through v2.4. The v2.3.1 and v2.4 benchmarks proved that multilingual/schema health and a stronger selection objective did not solve over-composition. These findings remain as architectural provenance and regression targets; v2.5 removes the failed responsibilities.

### P0 — reflective language selection is incorrectly coupled to an `en | el` metadata resolver

`supabase/functions/_shared/billing-ai.ts` currently calls `resolveDreamOutputLanguage` before reflective-question generation and validation. That resolver is typed and implemented only for English and Greek. A Spanish, French, German, Italian, Portuguese, Dutch, Polish, Russian, Japanese, or Chinese dream can therefore receive prose that follows its own language while the separate question subsystem is explicitly told to produce English.

The two live benchmark runners reproduce the same coupling, so the current benchmark cannot reveal it. This is a runtime correctness defect, not a matter of tone.

### P0 — deterministic question validation assumes space-delimited language

`questionWordCount` uses whitespace splitting with a minimum of six words. A natural Japanese or Chinese question may contain no spaces and be rejected as a length violation. The final punctuation contract recognizes `?` and `？`, but not all question-mark forms used by supported or future languages.

The deterministic advice/diagnosis and sterile-literalism patterns are English/Greek diagnostics. They create unequal protection and must leave the multilingual runtime commit contract. If retained at all, they belong in offline telemetry for their original corpora; the language-capable semantic validator owns those meanings in production.

### P0 — the typed question card has a Greek-or-English language branch

`ReflectiveQuestionCard` inspects the generated question and chooses only Greek or English eyebrow/CTA copy. Latin-script languages cannot be identified this way; Spanish, French, German, Italian, Portuguese, Dutch, and Polish all fall into English UI copy. The artifact currently does not persist its output language.

### P1 — Reflective Dialogue inherits an initial-reading heading directive

`buildChatFollowupRequest` reuses `INTERPRETATION_OUTPUT_LANGUAGE_DIRECTIVE`, which combines natural-language choice with a requirement to keep section headings in English. Follow-up dialogue does not need that structural rule. Language choice and reading-format tokens must become separate contracts so an English UI/parser convention cannot steer multilingual conversation prose.

This plan does not silently redesign initial-reading markdown. If localized reading headings are desired, they need a separate presentation/parser migration; Dialogue v1.2 should simply stop inheriting that irrelevant heading instruction.

### P1 — the Greek-only benchmark is a depth probe, not a multilingual release gate

The 20-dream corpus and all eight trajectories are Greek. They remain valuable because they expose ordinary, intense, peaceful, numinous, relational, transformation, and incomplete scenes. They cannot certify cross-language parity, idiom handling, CJK length behavior, or code-switch continuity.

The human-quality dimension named `natural_greek` encodes the corpus instead of the product property. It must become `target_language_naturalness` in the next benchmark protocol.

### P1 — dialogue still sometimes manufactures depth

Two v1.1 failures are language-independent:

- a user's “nothing changed” became latent symbolic selection and cold interiority;
- absence of pain became unsupported reduced sensitivity, indifference, and protection.

The shared error is epistemic: absence of affect, change, pain, or knowledge was treated as evidence for a hidden mechanism. The fix should be one general principle, not a growing list of scenarios.

### P1 — selection and repair remain the question-quality bottleneck

V2.2 strongly preserves evidence but reaches for abstract aperture language and repairs too often. `13/19` committed initial questions were validator rewrites. Some repairs improved safety; others degraded idiom or introduced an unstaged future event.

Previous Candidate C and remainder-first R&D already proved that another write-side instruction does not reliably fix selection. Those branches remain closed. The next candidate must not import them, copy their prompts wholesale, or restart a suffix of prompt experiments.

## Non-negotiable invariants

The recovery must preserve:

- one initial conversation-opening question in normal operation;
- zero or one optional question after a non-final chat answer;
- no question on the final chat answer;
- exact visible-question restoration in model history;
- raw dream `D#` and user-only `U#` evidence ownership;
- assistant prose as provisional context, never evidence;
- one generator and one judge-only validator; byte-identical accept or abstain, with no rewrite, tournament, or recursive loop;
- a question failure never failing a completed reading or answer;
- typed artifact persistence and card reveal only after locked typing settles;
- the ~15s streamed `PhasedTypingText` experience;
- unchanged metadata extraction, `archetypes`, `amplifications`, and reflective essays;
- R&D and production-hold modules outside runtime.

## Historical candidate architecture 2.3–2.4

```text
raw dream + conversation
  -> request-local language source contract
       initial: primary language of D# narrative
       chat: latest substantive U# language
             -> established conversation language when U# is ambiguous
       no dependency on the Insights-language preference
  -> Dialogue v1.2 answer (chat only)
  -> question generator v2.3
       evidence ids
       living relation
       one question
       output_language (BCP-47 / ISO language tag)
  -> validator v2.3
       evidence + epistemic review
       target-language naturalness
       accept / one repair / abstain
       output_language verified with the question
  -> cross-script structural commit gate
  -> typed artifact schema 3
       question + evidenceIds + languageCode
  -> localized question card
```

This diagram records the boundary that established multilingual support but still allowed one validator repair. V2.5 preserves the language-source contract and removes the repair branch. The model does not receive per-language psychological rules. `output_language` remains machine metadata for continuity, audit, and card localization; it is not psychological evidence.

## Implementation sequence

### Phase 1 — separate reflective language from metadata language — implemented

1. Add a small shared `ReflectiveLanguageContext` module, independent of `dreamOutputLanguage.ts`. It carries the source (`dream`, `latest_user`, or `established_conversation`), the relevant source text, and any previously validated language tag; it does not guess shared-Latin languages with script heuristics.
2. Replace `targetLanguage: "English|Greek"` in question builders with a request-local language-source instruction:
   - initial: infer from numbered dream evidence;
   - chat: infer from latest substantive `U#`, falling back to the most recent validated artifact/conversation language when the turn is ambiguous.
3. Split the dialogue language directive from the initial-reading markdown-heading directive. Dialogue follows the latest substantive user language and receives no English-heading instruction.
4. Add `output_language` to generator and validator JSON contracts. The validator checks the candidate text against the same language-source context and returns the validated tag.
5. Persist the validated language tag on `ReflectiveQuestionArtifact` and bump artifact schema `1 → 2`.
6. Keep schema-1 artifacts readable. The normalizer supplies a conservative legacy fallback without rewriting the stored question.
7. Remove reflective-question runtime and benchmark imports of the `en | el` extraction resolver. Do not change the extraction resolver in this workstream.

Primary files:

- `src/ai/reflectiveQuestionPrompt.ts`
- `src/ai/dreamReflectionPrompt.ts`
- new shared reflective-language module under `src/ai/`
- `supabase/functions/_shared/billing-ai.ts`
- `src/types/dream.ts`
- `src/services/localStorage.ts`
- `src/services/remoteStorage.ts`
- a new shared Oneiros language-code/locale resource under `src/constants/`
- live reflective-question and dialogue runners

No database migration is expected: the artifact remains inside existing message JSONB. Backward-compatible parsing is mandatory.

### Phase 2 — make structural validation cross-script — implemented

1. Replace whitespace-only length measurement with a cross-script measurement:
   - use word segmentation where reliable;
   - use bounded grapheme/letter length for scripts that do not normally separate words with spaces;
   - keep the existing absolute character ceiling.
2. Support common Unicode question punctuation, including RTL question marks, without counting an opening Spanish `¿` as a second movement.
3. Remove English/Greek lexical regexes from the runtime accept/reject contract. They may remain only as named offline diagnostics for historical corpora, never as asymmetric production enforcement.
4. Keep semantic safety, evidence fidelity, advice/diagnosis, unstaged relation, and dream continuation in the language-capable validator.
5. Add tests proving that valid Japanese and Chinese questions commit while malformed compound questions still fail.

No dictionary of 12 translated forbidden phrases should be added to the prompt or deterministic gate.

### Phase 3 — revise Dialogue v1.2 with two compact invariants — implemented

Change the prompt by replacement, not accumulation. Keep its total instruction size approximately neutral.

1. **Absence is not hidden mechanism:** a stated absence of change, feeling, pain, knowledge, or significance does not establish defense, numbness, compensation, avoidance, or latent symbolic importance. Develop only what the user and image support; a small answer may remain small. Express this as a semantic invariant, not through literal English or Greek reply examples.
2. **Internal language stays internal:** never expose Core mode names, evaluator vocabulary, evidence ids, method names, or product ontology in the answer.

Preserve correction uptake, provisional meaning, user-led waking associations, grief without therapy script, and mature completion. The answer remains separate from the optional question.

### Phase 4 — revise Questions v2.3 without prompt stuffing — implemented

1. Keep evidence boundary → living relation → psychic opening as the entire positive spine.
2. Separate selection from realization in one short instruction: after selecting the living relation, let the dream's concrete movement carry the opening through target-language grammar. This will often be the dream's own verb; in a static or atmospheric dream it may instead be a spatial relation, bodily orientation, image quality, or held tension. Never invent motion merely to satisfy the method, and never surface the evaluator's abstraction as the question.
3. Do not ban a Greek or English phrase such as “what changes for you”. The defect is portable abstraction, not one string.
4. Tighten validator repair ownership:
   - a repair may not introduce an event, choice, motive, relation, or future action absent from evidence;
   - a repair must be idiomatic in the target language;
   - a repair may correct only the realization of an already valid selected hinge: remove an extra movement, clarify reference, restore target-language naturalness, or remove advice/overreach without changing the premise;
   - selecting a different hinge, reframing the user's relation, or replacing a generic premise is regeneration, not repair;
   - when a valid surgical repair is not available, abstain.
5. Keep one generator and one validator. Do not add a language-polisher call, candidate tournament, or recursive repair.
6. Treat repair dependency as a compound release signal, not a vanity metric. Lower repairs count only when untouched accepts also pass blind human review; the validator may not improve the number by accepting weak candidates or converting difficult initial cases into avoidable abstentions.

Prompt additions must be balanced by deleting redundant wording. The candidate bundle should not grow by more than roughly 5% without a separate review justification.

### Phase 4b — replace novelty-seeking with a living edge — implemented in v2.4

The v2.3.1 run was mechanically healthy but human-weak. The generator had learned to treat the reading as “already explored,” so it avoided the image that carried the dream and searched for unused material. On short dreams this produced generic “what changes” shells, forced alternatives, imagined next actions, and awkward target-language realization.

V2.4 changes the selection objective rather than adding a list of banned phrases:

1. `living_edge` is the exact evidence-bound place where an image or action still has experiential room around it; it is not unused content.
2. The reading/answer is provisional orientation, never evidence or territory that must be avoided.
3. Returning to the reading's central image is valid when the question changes the dreamer's relation to it instead of requesting confirmation or recap.
4. On chat, a new question must arise from a relation changed or opened by `U#`; it cannot restate the already answered visible question with the user's answer inserted.
5. The validator applies a portability test and abstains on a wrong premise; it does not become the dominant copywriter.

### Phase 4c — remove over-composition — implemented in v2.5

The v2.4 human diagnosis showed that “surgical repair” still made the validator a dominant copywriter, while the initial reading primed generic interpretive language and a dialogue word floor manufactured significance from brief replies.

V2.5 therefore changes responsibility rather than adding more style rules:

1. Initial question generation receives `D#` raw-dream evidence and language context only. The completed reading remains visible to the user but is omitted from the question-model request.
2. Chat retains the current provisional answer and role history only because continuity requires knowing what the user just answered; neither becomes evidence.
3. A question may ask only into a real unknown. It may not assign wanting, keeping, allowing, changing, accepting, or meaning unless the evidence stages that predicate.
4. The validator is judge-only: accept the candidate byte-for-byte or abstain. It cannot repair, paraphrase, translate, polish, or trim.
5. Dialogue has no word minimum. One natural sentence may be complete, and the model must not fill space with significance the user did not provide.
6. No pain changes the scene's tone but cannot by itself establish acceptance, harmlessness, integration, distance, or bodily knowledge.

The v2.5 prompt bundle is smaller in responsibility, not richer in theory. It is unbenchmarked and remains held.

### Phase 5 — localize the reflective-question card from artifact metadata — implemented, fluent copy review pending

1. Replace script guessing in `ReflectiveQuestionCard` with `artifact.languageCode`.
2. Create a shared Oneiros language-code registry and move eyebrow, CTA, and accessibility copy into locale resources keyed by it. The existing Insights language preference may reuse the codes, but it must not silently become the reflective conversation-language selector.
3. Cover the current 12 product languages: `en`, `el`, `es`, `fr`, `de`, `it`, `pt`, `nl`, `pl`, `ru`, `ja`, `zh`.
4. Require fluent-language review for this small copy set. Do not ask the generation prompt to translate UI chrome.
5. For an unknown language tag, use one documented fallback consistently; never infer a Latin-script language from the question text.

This phase changes shared mobile copy only. It does not alter layout, card timing, animation, or navigation.

## Benchmark architecture v1.5

### Preserve the Greek depth corpus

Keep the unchanged 20-case Greek slice as the historical depth and regression reference. Rename its language dimension in the protocol to `target_language_naturalness`; in that packet the target happens to be Greek.

### Add a multilingual sentinel corpus

The tracked multilingual fixture adds 15 synthetic initial dreams and covers each supported product language:

`en`, `el`, `es`, `fr`, `de`, `it`, `pt`, `nl`, `pl`, `ru`, `ja`, `zh`.

The cases should not be literal translations of one master dream. They must vary affect and dream form so language and psychological quality are not confounded with one repeated scene. Across the set include ordinary, peaceful, intense, relational, numinous, transformation, and incomplete dreams.

### Add multilingual trajectories

The frozen 16-case trajectory set spans:

- correction of the reading;
- “I don't know” / no change;
- direct meaning request;
- joy without hidden problem;
- grief association;
- brief natural completion;
- a clear language switch in the latest user turn;
- a very short reply whose language is ambiguous and must inherit conversation language.

Cover Latin, Greek, Cyrillic, and CJK scripts. At least the correction, not-knowing, direct-meaning, and completion behaviors should run in more than one language family.

### Human scoring

Initial dimensions:

- evidence fidelity;
- image specificity;
- psychological aliveness;
- psychic expansion;
- unforced ambiguity;
- human pull;
- genuine desire to answer;
- target-language naturalness;
- preferable to abstention.

Dialogue dimensions remain uptake, continuity, image-near depth, psychic expansion, epistemic restraint, warmth, desire to continue, and next-opening quality, with an added target-language naturalness score for both answer and optional question.

Naturalness scores require a fluent reviewer for that language. Automated language detection or an LLM judge may flag material for review but cannot approve it.

Keep validator provenance hidden during primary scoring, then segment the completed scores by `accept` / `abstain`. Report:

- clear-PASS rate for byte-identical committed generator candidates;
- justified abstention rate by surface and language;
- zero validator rewrite events by schema and commit contract.

This prevents a permissive judge from passing because it simply accepts weaker language.

### Acceptance gate

The implemented candidate may be considered for production only when all are true:

- zero wrong-language outputs across supported-language sentinels;
- zero hard evidence, advice, diagnosis, unstaged relation, invented event, or forced-continuation failures;
- zero invalid rejections caused by CJK/Unicode length or punctuation handling;
- every supported language receives `2/2` target-language naturalness on the final frozen acceptance packet;
- at least 80% clear `PASS` on each reported stratum independently: Greek initial 20, Greek dialogue 8, multilingual initial sentinels, and multilingual trajectories;
- not-knowing, calm, joy, correction, painless transformation, grief, language switch, and natural completion have no `FAIL`;
- initial normal-operation question rate remains at least `95%` with every abstention manually justified;
- validator rewrite dependency is exactly `0%` by construction;
- committed generator candidates reach at least `80%` clear `PASS` with zero hard failures;
- chat abstention remains available and preferable endings are not reopened;
- no regression in latency, failure isolation, visible-question continuity, or locked typing reveal;
- exact candidate method, schema, prompts, and bundle SHA are recorded before the acceptance run.

Run one calibration pass on the named failure fixtures, freeze the candidate and fixtures, then run the unchanged Greek `20 + 8` and the separate multilingual packets as one acceptance suite twice. Report the strata separately and do not tune between acceptance repeats.

## Test plan

### Unit and contract tests

- prompt builders express the initial/chat language-source rules without locale-specific psychological text;
- dialogue/generator/validator parsers require and validate `output_language` for their strict schemas;
- schema-3, schema-2, and schema-1 artifacts still normalize and render;
- target language survives generator → validator → artifact → storage → sync → UI;
- Japanese, Chinese, Russian, Greek, English, Spanish, and Arabic-punctuation probes exercise structural measurement; supported product language tests cover all 12 tags;
- latest clear user-language switch wins on chat;
- ambiguous brief reply inherits the established language;
- no-change and no-pain trajectories do not produce hidden-deficit readings;
- internal mode labels do not appear in user-facing answers;
- initial question prompts omit the completed reading while chat retains role-preserving continuity;
- validator response schema exposes only accept/abstain and accepted text is byte-identical;
- legacy repair decisions fail at the current validator parser boundary;
- benchmark reports committed-candidate quality and abstentions without exposing validator provenance during primary human scoring;
- client/gateway imports remain shared rather than prompt copies;
- deploy guard rejects v2.2/v2.3.x/v2.4 and rejects any unapproved v2.5 SHA.
- reading-cache validation fails closed on missing/duplicate cases, changed full dream text, or empty readings before paid model work.

### Flow tests

- initial question remains one in normal operation;
- chat remains zero or one; final remains none;
- visible-question replay and `U#` ownership stay intact;
- question failure still preserves completed reading/answer;
- localized card CTA opens and focuses the existing Exploring composer;
- card remains hidden until typing settles;
- iOS and Android render long/short/CJK questions without clipping.

Detox is needed only if Jest plus a focused device visual check cannot establish CJK wrapping and accessibility behavior. No navigation or native-permission change is planned.

## Versioning and documentation checklist

Implementation updates these together:

- Dialogue prompt id/version to `1.5.0`;
- question method, generator, and validator ids/versions to `2.5.0`;
- question artifact schema to `4`;
- complete production bundle SHA and deploy guard;
- benchmark protocol to `1.5.0` while preserving the frozen fixture version and case ids;
- `docs/AI_PROMPTS_INVENTORY.md`;
- `docs/ECHOES_PROMPTS_AND_CATALOG.md` with an explicit no-extraction-change note;
- `docs/REFLECTIVE_QUESTION_PRODUCTION_HOLD.md`;
- `docs/REFLECTIVE_QUESTIONS_V2_ARCHITECTURE.md`;
- `documentation/flows-06-jungian-ai-reflection.md`;
- `documentation/architecture-interpretation.md`;
- `documentation/architecture-app-map.md` and `documentation/architecture-features.md`;
- `testing/live-scenarios/README.md` and `__tests__/flows/README.md`;
- `supabase/functions/ai-entitlements-gateway/README.md`;
- `AGENTS.md` and `.codex/skills/oneiros-repo/SKILL.md` after the production identity/status changes.

## Deployment boundary

No deployment belongs to planning or calibration.

After the exact v2.5 bundle passes both frozen acceptance packets and is explicitly approved:

```bash
npm run deploy:ai-entitlements-gateway
```

Use the wrapper only. No raw gateway deploy. Deploy `openai-proxy` first if the two explicit question routes from this worktree are not already remote, then deploy the gateway through the wrapper. No database migration or `supabase db push` is expected.

The mobile app must also ship the schema-4 reader and localized card resources before or with the gateway candidate. The gateway must not emit schema-4 artifacts to clients that cannot read them.

## Separate multilingual metadata workstream

The audit also found that `DreamOutputLanguageCode`, the metadata output-language commit gate, and Mythic Echo presentation are currently English/Greek-oriented while Insights exposes 12 languages. That issue is real, but it must not be folded into the reflective-question patch.

Broadening metadata language detection/repair affects extraction validation, `display_distillation`, Archetypal/Mythic Echo presentation, and the locked E.1.1 gate. It requires its own brief, multilingual fixtures, resilience tests, and — if implemented — deployment of both:

```bash
supabase functions deploy openai-proxy
npm run deploy:ai-entitlements-gateway
```

No extraction prompt, schema, soft default, `archetypes`, or `amplifications` behavior changes during Reflective architecture 2.5.

## Stop rules

Stop and keep the hold if any of these occur:

- the candidate needs locale-specific psychological prompt branches;
- prompt size grows through accumulated examples, bans, or translated rule lists;
- a valid CJK or shared-Latin-language question is rejected by deterministic assumptions;
- validator output ever rewrites a candidate or becomes a second copywriter;
- weak candidates pass only because the judge becomes permissive or normal initial questions abstain;
- not-knowing or painless transformation still becomes hidden deficit;
- multilingual naturalness depends on machine scoring without fluent review;
- any fix removes the initial question, optional progressive conversation, typed artifact, or streaming reveal;
- metadata/Echo changes leak into this workstream.
