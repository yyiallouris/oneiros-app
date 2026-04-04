# Instructions for AI: tests and flows (Oneiros)

Use this document when implementing features, fixing bugs, or refactoring. Goal: **keep flow documentation, Jest tests, and E2E smoke aligned** so regressions are caught early.

## 1. When you add a **new** user or system flow

1. **Document it**  
   - Add or extend the right file under [`documentation/`](./README.md) (e.g. new screen → update the matching `flows-*.md`, or add a new `flows-XX-….md` and a row in [`documentation/README.md`](./README.md)).

2. **Add automated tests** (pick what fits; prefer fast Jest where logic is testable without full UI):
   - **Pure logic / services / utils** → add or extend a file in [`__tests__/flows/`](../__tests__/flows/) named `*.flow.test.ts`, or use `__tests__/<area>.test.ts` if not flow-specific.
   - **New flow file** → prefer `__tests__/flows/<feature>.flow.test.ts` and a top comment: `/** Flow coverage: documentation/flows-XX-….md */`.
   - **Auth, navigation, or visible copy on Auth** → update or extend [`e2e/login.e2e.ts`](../e2e/login.e2e.ts) (Detox) if the change is user-visible on the auth stack.

3. **Register the mapping**  
   - Add a row to [`__tests__/flows/README.md`](../__tests__/flows/README.md) linking the test file to the `documentation/flows-*.md` section.

4. **Run tests** (see §4) before finishing the task.

## 2. When you **change** existing code (any PR-sized edit)

1. **Identify affected flows**  
   - From the change, infer which `documentation/flows-*.md` areas apply (auth, sync, insights, dreams, AI, etc.).

2. **Run the narrowest meaningful checks first**  
   - If you touched `src/utils/authDeepLink.ts` → run Jest for `authDeepLink.flow.test.ts`.  
   - If you touched `src/services/syncService.ts` or `StorageService` / `LocalStorage` sync paths → run `syncService.flow.test.ts` and related flow tests.  
   - If you touched `src/utils/network.ts` → run `network.flow.test.ts`.  
   - If you touched insights periods, keys, or pattern reports → run `insightsPeriodsAndKeys.flow.test.ts` and/or `patternInsightsService.flow.test.ts`.  
   - If you touched Supabase client init → run `__tests__/supabaseClient.test.ts`.  
   - If you touched `generateInitialInterpretation` or AI fetch paths → run `__tests__/ai.test.ts`.

3. **Run the full Jest suite** before considering the change complete:

   ```bash
   cd /path/to/oneiros-app && JEST_DISABLE_WATCHMAN=1 npx jest --watchman=false
   ```

   Or use the project script:

   ```bash
   npm test
   ```

4. **E2E**  
   - If Auth UI text, buttons, or navigation from the auth stack changed → run Detox (after a dev build), or at minimum re-read `e2e/login.e2e.ts` and update expectations if labels changed.

## 3. Conventions

| Item | Convention |
|------|----------------|
| Flow Jest tests | `__tests__/flows/<name>.flow.test.ts` |
| Doc reference | Comment at top pointing to `documentation/flows-….md` |
| Mocks | Mock `expo-auth-session/build/QueryParams`, `react-native-url-polyfill`, `remoteStorage`, `network`, etc. when importing modules that pull ESM or native-heavy deps (see existing flow tests). |
| New constants tied to UX | Add assertions in `constants.flow.test.ts` or a dedicated small test file. |

## 4. Commands (copy-paste)

```bash
# All Jest tests (required after non-trivial changes)
npm test

# Only flow-oriented tests (faster feedback while iterating)
npm run test:flows

# Single file
JEST_DISABLE_WATCHMAN=1 npx jest __tests__/flows/authDeepLink.flow.test.ts --watchman=false

# Detox (Android example; requires prior detox build)
npm run detox:build:android && npm run detox:test:android
```

## 5. Minimum checklist before closing a task

- [ ] Relevant `documentation/flows-*.md` updated if behavior or routes changed.  
- [ ] New or updated Jest tests for new logic or changed contracts.  
- [ ] `__tests__/flows/README.md` updated if a new flow test file was added.  
- [ ] `npm test` passes.  
- [ ] E2E or test strings updated if Auth (or other covered) UI labels changed.

## 6. Related files

- Flow catalog: [`documentation/README.md`](./README.md)  
- Flow test index: [`__tests__/flows/README.md`](../__tests__/flows/README.md)  
- Jest config / polyfill stub: [`jest.config.js`](../jest.config.js), [`__mocks__/react-native-url-polyfill-auto.js`](../__mocks__/react-native-url-polyfill-auto.js)

---

**Optional for Cursor:** add this file to project rules (e.g. “always apply when editing `src/` or tests”) so every agent session follows the same steps.
