# Flow tests (Jest)

Automated coverage for journeys described under [`documentation/`](../documentation/README.md). These are **unit and service-level** tests with mocks—not full UI navigation (use Detox in `e2e/` for that).

| Test file | Maps to doc |
|-----------|----------------|
| `authDeepLink.flow.test.ts` | flows-02 (deep links, recovery, OAuth URL handling) |
| `authOAuth.flow.test.ts` | flows-02 (Apple/Google/Discord provider config, OAuth token parsing, new-user detection) |
| `rootNavigator.offline.flow.test.tsx` | flows-01 / flows-02 / flows-05 (synchronous auth-state callback, per-session local route gate, offline session preservation, reconnect sync, serialized owner-scoped logout/account-start cleanup before routing, cleanup-incomplete owner-fence retention, LoadingScreen gate) |
| `onboardingService.flow.test.ts` | flows-03 (per-user onboarding flag) |
| `onboardingSubscription.flow.test.tsx` | flows-03 / flows-10 (plan selection step, free continuation, premium purchase entry, unavailable-price lock) |
| `onboardingLanguage.flow.test.tsx` | flows-03 (Insights language step between depth and subscription; no false Skip on defaulted preference screens) |
| `onboardingLanguageOptions.flow.test.ts` | flows-03 (device-language default ordering for onboarding language list) |
| `subscriptionSurface.flow.test.tsx` | flows-03 / flows-10 (dedicated Subscription destination, Account entry row, premium-first compare surface, fail-closed store pricing) |
| `accountProfileSave.flow.test.tsx` | flows-03 (sticky Account header Save only for dirty nickname; depth/language remain instant-save; Save redirects to Write) |
| `legalCopy.flow.test.ts` | flows-08 (consent/privacy/AI disclaimer boundary wording) |
| `legalSurfaces.flow.test.tsx` | flows-08 (calm consent entry and user-facing privacy screen copy) |
| `legalSite.flow.test.ts` | flows-08 / release docs (public landing, privacy, and terms pages for store review) |
| `supportContactDelivery.contract.flow.test.ts` | flows-08 (signed-in and signed-out support share the server-owned Resend path; authenticated persistence bypasses no client RLS; support routing is not exposed in Expo config) |
| `supportSubmissionFeedback.flow.test.tsx` | flows-08 (cross-platform inline success/error feedback, failure draft retention, signed-in return to Write, and signed-out reset to Auth) |
| `supportWebDelivery.flow.test.ts` | flows-08 / release docs (public support form validates input, absorbs honeypot spam, keeps credentials server-side, and proxies only to the canonical support function) |
| `insightsPeriodsAndKeys.flow.test.ts` | flows-07 (periods, labels, filter key matching, seeded aggregation updates, collective placeholder) |
| `patternInsightsService.flow.test.ts` | flows-07 (month/week/report keys, pattern entry filtering, pending metadata skip) |
| `dreamMetadataPrefetchService.flow.test.ts` | architecture-interpretation (extraction cache, dream content hashes, in-flight prefetch, offline prefetch skip) |
| `entitledAiService.flow.test.ts` | flows-06 / flows-07 / flows-10 (gateway AI actions, async reflection polling/resume handles, stable generate keys, direct interpretation payloads, local persistence/cache, entitlement denial reasons) |
| `dreamDetail.reflectionResume.flow.test.tsx` | flows-06 (DreamDetail focus resumes pending reflection loading / remote attach without Reflect again) |
| `gatewayReflectionResume.flow.test.ts` | flows-06 (gateway async_background_started prevents second Edge worker on idempotency replay) |
| `edgeReflectionPrompt.flow.test.ts` | flows-06 (shared client/Edge `oneiros-dream-reflection-v3.2.3-candidate`, deterministic language routing, follow-up chat v2.0.1) |
| `reflectiveQuestions.shadowValidation.contract.flow.test.ts` | flows-06/07 (post-completion fail-open shadow validation telemetry; contract failures and observer exceptions cannot retry/block/buffer; preserves live stream, ~15s reveal, typewriter, and operational-only essay retry) |
| `reflectiveQuestions.productionSurfaces.contract.flow.test.ts` | flows-06 **same-call question lock** (approved Reader v3.2.3-candidate + enacted-relation Q1 in-reading; Quick 1 / Standard-Advanced 2; chat open 1 / close 0; essays 2; exact English `Reflective Questions` / `Continue the conversation` v1 chrome; completed-output normalizer runs before extraction/persistence but outside `onProgress`; no Composer/Gate/Repair runtime) |
| `edgeExtractionPrompt.flow.test.ts` | flows-06 / architecture-interpretation / SYMBOLS_FLOW (Edge dream metadata extraction prompt parity via shared canonical module) |
| `archetypeTwoPassIntegration.contract.flow.test.ts` | flows-06 / architecture-interpretation / SYMBOLS_FLOW (dedicated recognition→adjudication production archetype persistence; no monolithic fallback; retry-once failure contract) |
| `interpretiveEchoesV31.ranking.flow.test.ts` | flows-06 / SYMBOLS_FLOW (Interpretive Echoes v4.1.6-D.1 Hero gate + frozen C.1.1 myth) |
| `catalogNamespaceEnforcement.test.ts` | C.1.1 provider enum + id= prompt formatting |
| `../mythicEchoPipelineDebug.test.ts` | flows-06 / SYMBOLS_FLOW (mythic raw→normalize→validate debug packet + selected-audit vs production title invariant) |
| `../ai/interpretiveCatalogs.v1.test.ts` | catalogs / retrieval / validators for archetypes + myths (v1 knowledge architecture) |
| `edgePatternEssayPrompt.flow.test.ts` | flows-07 (Edge/client frozen prompt parity and Phase 2 narrative-first context-v2 parity) |
| `aiCostLogging.flow.test.ts` | architecture-interpretation / flows-07 / flows-10 (safe AI token-cost logging for reflection, metadata, Recent Dream Field, and Period Reflection via shared pricing table, plus metadata extraction duplicate-spend guard) |
| `symbolTaxonomy.flow.test.ts` | flows-07 (safe labels, archetype taxonomy, modal key mapping, date labels) |
| `symbolGroupingService.flow.test.ts` | flows-07 (semantic grouping cache, invalidation, canonical merges) |
| `syncService.flow.test.ts` | flows-05 / architecture-interpretation (unsynced queue, interpretation metadata merge, offline short-circuit) |
| `remoteStorage.interpretationMetadata.flow.test.ts` | architecture-interpretation (Supabase row mapping for interpretation metadata and display distillation) |
| `network.flow.test.ts` | flows-05 (forced offline, subscription callback) |
| `constants.flow.test.ts` | flows-02 / flows-06 (password length, AI message cap) |
| `openaiProxySecurity.flow.test.ts` | architecture-interpretation / openai-proxy README (authenticated AI proxy boundary) |
| `openaiProxySamplingParams.flow.test.ts` | flows-06 / openai-proxy README (omit forbidden temperature so Sonnet 5 / gpt-5 fallback stays alive) |
| `openaiProxyFallbackChain.flow.test.ts` | flows-06 / openai-proxy README (Sonnet→Haiku fallback chains for reflection/essay tasks) |
| `structuredAiValidation.flow.test.ts` | architecture-interpretation / openai-proxy README (Zod schemas + one repair for structured AI tasks) |
| `dreamDetail.offlineMessage.flow.test.tsx` | flows-05 / flows-06 (offline AI actions, DreamDetail reflection presentation) |
| `dreamDetail.chatScroll.flow.test.tsx` | flows-06 (DreamDetail Exploring nested chat keeps full multi-section reflection scrollable; no overflow:hidden) |
| `dreamDetail.streamingTyping.contract.flow.test.ts` | flows-06 **locked UX** (DreamDetail ~15s streamed reflection must keep `PhasedTypingText`; user approval required to change; forbids instant full-text dump shortcut) |
| `dreamDetail.skeleton.flow.test.ts` | flows-04 (DreamDetail initial load uses layout-faithful `DreamDetailSkeleton`, not dual journal `LinoSkeletonCard`) |
| `dreamMetadataExtraction.resilience.contract.flow.test.ts` | flows-06 / architecture-interpretation / SYMBOLS_FLOW **locked resilience** (metadata extract soft-defaults missing echo confidence; dual deploy; forbids recurring `structured_schema_invalid` after schema edits) |
| `reflectiveQuestions.productionDeployGuard.contract.flow.test.ts` | flows-06 **fail-closed deploy identity + transitive R&D isolation** (approved same-call `v1.0.3-candidate` / `f5399a49…`; runtime bundle `oneiros-reflective-questions-runtime-v1.0.3+structure-v1.0.0`; Composer/Gate/Repair/Premise denied; failed Inviter/editorial SHAs denied) |
| `billingCommitQuota.interpretationIdText.contract.flow.test.ts` | flows-10 / flows-06 (billing_commit_quota keeps interpretation_id as text — never uuid; prevents dream_followup_reply Failed to commit quota) |
| `dreamFollowupCommittedReplay.contract.flow.test.ts` | flows-06 / flows-10 (committed `dream_followup_reply` replay reconstructs persisted reply/messages, with no second model call, quota commit, or missing-`result.value` crash) |
| `billingDreamReflectionLimitOverride.contract.flow.test.ts` | flows-10 (paid dream-reflection cycle limit override via entitlement raw.dream_reflection_limit + grant-test-user-200-dreams.sql) |
| `dreamSaveLoading.flow.test.ts` | flows-04 (Save dream disables immediately but delays visible loading to avoid fast-save flashes) |
| `writeSaveDock.contract.flow.test.ts` | flows-04 (Write Save CTA docks above the floating tab shelf via shared `floatingTabBar` clearance; no overlay/fudge offsets) |
| `journalUntitledSlip.contract.flow.test.ts` | flows-04 (untitled Journal slips keep title + excerpt; title ends with `...`; excerpt continues on a word boundary; no mid-word 50-char cut) |
| `interpretationChat.offlineMessage.flow.test.tsx` | flows-05 / flows-06 (alternate chat route offline guard) |
| `voiceTranscription.flow.test.tsx` | flows-04 / flows-05 / flows-06 / flows-09 (single-start record → low-storage preflight/typing fallback or uninterrupted Stop/progress handoff → recoverable inbox/revisioned queue → quality-gated append, successful local-audio cleanup, bounded retry contract) |
| `whisperTranscriptionReliability.flow.test.ts` | flows-04 / flows-09 / transcription reliability + function README (`gpt-transcribe`, strict idempotency, language-neutral server strategy, rolling/concurrency guards, indexed retention, exclusion-only native backup rules + legacy iOS clips, hallucination recovery gate, fenced reservation/completion) |
| `storageService.flow.test.ts` | flows-05 (offline-first storage orchestration, signed-out cold-start owner fence, unreadable-queue/failed-audio-delete cleanup retention, scoped account-switch cleanup) |
| `subscriptionBilling.policy.flow.test.ts` | flows-10 (quota math, monthly cadence, cache/read-only rules) |
| `subscriptionBilling.runtime.flow.test.ts` | flows-10 (purchase persistence, webhook dedupe, reserve/commit/release orchestration) |
| `insightsScreen.recentDreamField.flow.test.tsx` | flows-07 / flows-10 (Recent Dream Field generation, cache display, premium lock state) |
| `patternExplorerCategories.flow.test.ts` | flows-07 (Pattern Explorer recurrence copy, category labels, and restored Archetypal Echoes category) |
| `insightsAndPaywallScroll.flow.test.ts` | flows-07 / flows-10 (Insights landing/detail bottom scroll clearance and premium upsell sheet scroll envelope) |
| `insightsScrollRestore.flow.test.ts` | flows-07 (Insights landing soft-refresh + scroll restore when returning from a section) |
| `insightsSection.offlineMessage.flow.test.tsx` | flows-05 / flows-07 / flows-10 (period reflection offline guard and premium lock state) |
| `webContentShell.flow.test.tsx` | architecture-features / DESIGN.md (Expo web centered content column; native passthrough; content width context) |

Run only these:

```bash
npm run test:flows
```
