# Oneiros Reflective Questions v5 — Gate 1 review

Date: 2026-08-28  
Candidate: `oneiros-reflective-question-v5.0.0`  
Prompt: `reflective-question-single-pass-v5.0.0`  
Bundle SHA: `759b4726a666ea12ac087c7fae61c9a7681def2f7ecadbf04e08a3bb36555472`  
Status: **HUMAN GATE FAILED — HOLD**

## Execution record

The first authorized attempt cost `$0.06433` and exposed a deterministic language-infrastructure defect: all six Greek candidates used the natural terminal question mark `;`, which the parser misclassified as `compound_question`. The parser was repaired without changing prompt text or SHA. The benchmark was also changed to retain structurally rejected candidate text in the post-blind audit.

The explicitly authorized rerun used the same frozen eight, validated reading cache, GPT-5.4, concurrency `1`, no retries, and disabled provider fallback. It cost `$0.04891` and produced:

- `8/8` committed question artifacts;
- zero provider failures;
- zero deterministic validation rejections;
- zero reported language mismatches;
- p50 latency `3416 ms`, p95 `4001 ms`.

This satisfies the mechanical gate only. It does not satisfy the human gate.

## Internal expert screen

This is a post-diagnostic expert screen, not the required blind/fluent release review. It is sufficient to stop the candidate because several hard failure families are visible without resolving the remaining JA/ZH naturalness judgments.

| Case | Question | Verdict | Finding |
|---|---|---|---|
| `elevator-missing-button` | Πώς είναι για σένα να μένεις εκεί, ανάμεσα σε δύο ορόφους, χωρίς να έχεις φτάσει και χωρίς να φοβάσαι; | **FAIL** | Exact image is present, but the opening collapses into a portable felt-quality shell and repeats supplied non-fear. It also shifts the elevator's stopping toward the dreamer's “remaining”. The explicit elevator gate forbids this family. |
| `words-rest-on-table` | Καθώς περιμένατε ποιος θα αγγίξει πρώτος μία από τις άρρητες λέξεις, τι ήταν πιο ζωντανό μέσα σου εκεί; | **FAIL** | No missing footage, but “τι ήταν πιο ζωντανό” is a reusable shell. The dream has already supplied dense, significant silence without awkwardness, so the shortest answer is partly present. |
| `dinner-for-absent-host` | Καθώς κρατάς το τελευταίο δαμάσκηνο στην τσέπη, τι το κάνει να μοιάζει πως ανήκει στον απόντα ή σε σένα; | **PASS** | The concrete verb and object carry a genuinely unanswered relation. Waiting polarity and agency are preserved; no host identity or motive is invented. |
| `zh-faguo-mingzi` | 当你把那张发光的「Camille」轻轻盖在那杯水上时，你当时是在怎样对着它？ | **FAIL pending fluent confirmation** | Evidence and Camille identity are preserved, but `是在怎样对着它` appears non-native/awkward and the relation target remains abstract. Fluent review is still required, but the candidate cannot receive a clear PASS as written. |
| `sunrise-on-quiet-ridge` | Καθώς κάθεσαι εκεί χωρίς να θέλεις τίποτε άλλο, τι ζεις εσύ βλέποντας το φως να απλώνεται; | **FAIL** | Directly re-asks experience already supplied as calm, strength, gratitude, sufficiency, and watching the light. This violates the explicit peaceful-dream gate despite `completed_relation` existing in the contract. |
| `skin-turns-to-bark` | Τη στιγμή που γελούσες με τα παιδιά αλλά δεν μπορούσες να λυγίσεις τα γόνατα, τι ήταν πιο ζωντανό για σένα; | **FAIL** | Repackages already staged laughter plus anxiety into the same portable “most alive” shell. It does not find a new answer target in the metamorphosis. |
| `ja-neon-home` | 岸を離れずに海の上の「HOME」を見ているあなたは、その場所にどんな感じで立っていますか？ | **FAIL pending fluent confirmation** | HOME and shore are preserved, but `立っています` adds an unstaged standing posture and the felt-position phrasing is generic/possibly awkward. Fluent review remains required; the missing-footage premise is already a hard concern. |
| `shared-scarf-at-harbor` | Καθώς εκείνη ξετυλίγει πολύ αργά το κασκόλ, τι είναι αυτό που σε τραβά να μείνετε δεμένες λίγο ακόμη; | **PASS / narrow** | Concrete unwrapping carries a genuinely answerable opening and avoids pathology. It privileges the stay-bound pole over the equally staged wish for release, but remains alive and defensible enough to preserve the positive control. |

Internal screen: `2 PASS / 6 FAIL` (two language judgments still require fluent confirmation). This is below the required `7/8` clear PASS and includes hard failures. Gate 2 must not run.

## Root-cause diagnosis

The rerun disproves the idea that the main remaining problem was mechanical validation. Once punctuation was repaired, the single-pass model produced valid JSON and questions consistently, but its private self-audit was not reliable:

- it marked `shortest_answer_already_supplied: false` for the sunrise and body-change questions even though the dream had already supplied the experience;
- it marked `portable_generic_shell: false` while repeatedly using “what was most alive” / “how is it for you” shells;
- it marked `spoken_native_form: true` for JA/ZH constructions that still require — and may fail — fluent review;
- `answer_target` often restated “what is alive for you” instead of specifying genuinely new first-person material;
- `completed_relation` did not prevent a peaceful dream from being re-questioned at the level of its already-complete feeling.

The defect is therefore semantic commit discipline, not missing theory and not another absent deterministic rule. The model can state the correct checks without obeying them. More prompt stuffing or another unverified self-check is not justified.

## Decision

- `APPROVED_REFLECTIVE_QUESTION_PRODUCTION` stays `null`.
- No Gate 2, full `35 + dialogue`, gateway deploy, or production activation.
- Do not auto-iterate the prompt or add another repair/judge call.
- Reopen the topology diagnosis. Separation of concerns may return only as a concrete hypothesis with bounded design and new cost approval.
- Revisit whether initial “always one question” is forcing false openings in completed dreams before adding more psychology rules.

Generated live artifacts remain under:

`tmp/reflective-question-v2-production-benchmark-2026-08-28T11-07-44-293Z/`
