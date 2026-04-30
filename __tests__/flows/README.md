# Flow tests (Jest)

Automated coverage for journeys described under [`documentation/`](../documentation/README.md). These are **unit and service-level** tests with mocks—not full UI navigation (use Detox in `e2e/` for that).

| Test file | Maps to doc |
|-----------|----------------|
| `authDeepLink.flow.test.ts` | flows-02 (deep links, recovery, OAuth URL handling) |
| `onboardingService.flow.test.ts` | flows-03 (per-user onboarding flag) |
| `insightsPeriodsAndKeys.flow.test.ts` | flows-07 (periods, labels, filter key matching, collective placeholder) |
| `patternInsightsService.flow.test.ts` | flows-07 (month/week/report keys, pattern entry filtering) |
| `symbolTaxonomy.flow.test.ts` | flows-07 (safe labels, archetype taxonomy, modal key mapping, date labels) |
| `symbolGroupingService.flow.test.ts` | flows-07 (semantic grouping cache, invalidation, canonical merges) |
| `syncService.flow.test.ts` | flows-05 (unsynced queue, merge, offline short-circuit) |
| `network.flow.test.ts` | flows-05 (forced offline, subscription callback) |
| `constants.flow.test.ts` | flows-02 / flows-06 (password length, AI message cap) |

Run only these:

```bash
npm run test:flows
```
