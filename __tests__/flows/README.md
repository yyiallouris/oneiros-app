# Flow tests (Jest)

Automated coverage for journeys described under [`documentation/`](../documentation/README.md). These are **unit and service-level** tests with mocks—not full UI navigation (use Detox in `e2e/` for that).

| Test file | Maps to doc |
|-----------|----------------|
| `authDeepLink.flow.test.ts` | flows-02 (deep links, recovery, OAuth URL handling) |
| `authOAuth.flow.test.ts` | flows-02 (Apple/Google/Discord provider config, OAuth token parsing, new-user detection) |
| `onboardingService.flow.test.ts` | flows-03 (per-user onboarding flag) |
| `onboardingSubscription.flow.test.tsx` | flows-03 / flows-10 (plan selection step, free continuation, premium purchase entry) |
| `subscriptionSurface.flow.test.tsx` | flows-03 / flows-10 (dedicated Subscription destination, Account entry row, premium-first compare surface) |
| `legalCopy.flow.test.ts` | flows-08 (consent/privacy/AI disclaimer boundary wording) |
| `legalSite.flow.test.ts` | flows-08 / release docs (public landing, privacy, and terms pages for store review) |
| `insightsPeriodsAndKeys.flow.test.ts` | flows-07 (periods, labels, filter key matching, seeded aggregation updates, collective placeholder) |
| `patternInsightsService.flow.test.ts` | flows-07 (month/week/report keys, pattern entry filtering) |
| `dreamMetadataPrefetchService.flow.test.ts` | architecture-interpretation (extraction cache, dream content hashes, in-flight prefetch, offline prefetch skip) |
| `entitledAiService.flow.test.ts` | flows-06 / flows-07 / flows-10 (gateway AI actions, local persistence/cache, entitlement denial reasons) |
| `symbolTaxonomy.flow.test.ts` | flows-07 (safe labels, archetype taxonomy, modal key mapping, date labels) |
| `symbolGroupingService.flow.test.ts` | flows-07 (semantic grouping cache, invalidation, canonical merges) |
| `syncService.flow.test.ts` | flows-05 / architecture-interpretation (unsynced queue, interpretation metadata merge, offline short-circuit) |
| `remoteStorage.interpretationMetadata.flow.test.ts` | architecture-interpretation (Supabase row mapping for interpretation metadata and display distillation) |
| `network.flow.test.ts` | flows-05 (forced offline, subscription callback) |
| `constants.flow.test.ts` | flows-02 / flows-06 (password length, AI message cap) |
| `openaiProxySecurity.flow.test.ts` | architecture-interpretation / openai-proxy README (authenticated AI proxy boundary) |
| `dreamDetail.offlineMessage.flow.test.tsx` | flows-05 / flows-06 (offline AI actions, DreamDetail reflection presentation) |
| `interpretationChat.offlineMessage.flow.test.tsx` | flows-05 / flows-06 (alternate chat route offline guard) |
| `voiceTranscription.flow.test.tsx` | flows-04 / flows-05 / flows-06 / flows-09 (record → transcribe → append, successful local-audio cleanup, retryable clip contract) |
| `whisperTranscriptionReliability.flow.test.ts` | flows-04 / flows-09 / whisper README (auth-first upload validation, durable reservation, stale-lock recovery, safe completion/release) |
| `storageService.flow.test.ts` | flows-05 (offline-first storage orchestration) |
| `subscriptionBilling.policy.flow.test.ts` | flows-10 (quota math, monthly cadence, cache/read-only rules) |
| `subscriptionBilling.runtime.flow.test.ts` | flows-10 (purchase persistence, webhook dedupe, reserve/commit/release orchestration) |
| `insightsScreen.recentDreamField.flow.test.tsx` | flows-07 / flows-10 (Recent Dream Field generation, cache display, premium lock state) |
| `insightsSection.offlineMessage.flow.test.tsx` | flows-05 / flows-07 / flows-10 (period reflection offline guard and premium lock state) |

Run only these:

```bash
npm run test:flows
```
