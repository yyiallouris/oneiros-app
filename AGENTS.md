# Oneiros Agent Instructions

These instructions apply to the whole repository.

## Collaboration Tone

- Address the user as bro, browski, μπρο, μπροκολοκο, or similar friendly variants.
- Stay warm and direct, but keep the work 1000% professional.

## Documentation Must Stay Current

For every code, configuration, schema, flow, or UX change:

- Start by checking `documentation/README.md` and the repo-local skill at `.codex/skills/oneiros-repo/SKILL.md`.
- Use `documentation/flows-00-complete-app-journey.md` for the end-to-end app map.
- Use `documentation/architecture-app-map.md` and `documentation/architecture-features.md` to understand feature ownership and change impact.
- Use `documentation/architecture-interpretation.md` plus `docs/SYMBOLS_FLOW.md` for AI interpretation, extraction, `display_distillation`, and Insights metadata changes.
- Check whether any Markdown documentation needs an update.
- Update all relevant `.md` files in the same change, not later.
- Prefer the existing documentation structure before adding a new file.
- When a behavior changes, update the matching flow doc under `documentation/`.
- When a new flow doc or flow test is added, update the index files that point to it, especially `documentation/README.md` and `__tests__/flows/README.md`.
- Keep setup docs current when changing build, auth, AI, Supabase, Detox, native project, or environment variable behavior.
- If no docs need changing, mention that explicitly in the final response.

Common documentation locations:

- `documentation/` for product and app flows.
- `documentation/architecture-app-map.md`, `documentation/architecture-features.md`, and `documentation/architecture-interpretation.md` for practical architecture and impact maps.
- `docs/` for focused technical notes.
- Root Markdown files for setup, architecture, build, auth, AI, and offline testing.
- `supabase/functions/*/README.md` for Edge Function behavior.
- `src/theme/COLORS.md` for theme/token changes.

## Database And Supabase Changes

When a change adds, edits, or requires a Supabase migration, database schema change, RLS policy change, Edge Function deployment, or remote persistence update:

- Clearly tell the user in the final response what must be pushed or deployed.
- Name the exact migration file or Supabase function involved.
- Include the command when known, e.g. `supabase db push` or `supabase functions deploy <function-name>`.
- If the code works locally but remote sync/storage needs the database push, say that explicitly.
- If no database push is needed, mention that only when the task touched storage, Supabase, remote sync, or schema-adjacent code.

## Tests Must Track Behavior

For every non-trivial change:

- Add or update tests that cover the changed behavior.
- Prefer fast Jest/unit/service tests when logic can be isolated.
- Add or update flow tests under `__tests__/flows/` when a documented user/system flow changes.
- Keep the top-level flow test mapping in `__tests__/flows/README.md` aligned.
- Update existing tests rather than adding duplicate coverage.
- If a change does not need tests, explain why in the final response.

Useful commands:

```bash
npm test
npm run test:flows
npm run typecheck
```

## iPhone and Android Coverage

When a change affects mobile UI, navigation, native configuration, permissions, deep links, auth, storage, biometrics, voice recording, networking, or platform-specific behavior:

- Consider both iPhone/iOS and Android behavior before finishing.
- Add or update platform-aware tests when behavior can differ by platform.
- Update Detox/E2E coverage when the change affects visible app flows that Jest cannot validate well.
- Keep Android E2E commands/config current, including `detox.config.js` and `e2e/` expectations.
- Add or update iOS/iPhone Detox configuration and tests when an iOS-specific or cross-platform UI/native flow needs E2E coverage.
- If full device/simulator E2E cannot be run locally, still update the relevant test files/config and clearly say which checks were not run.

Current Android Detox commands:

```bash
npm run detox:build:android
npm run detox:test:android
```

## Worktree Safety

- Do not revert or overwrite user changes.
- Check `git status --short` before editing.
- If existing modified files are unrelated, leave them alone.
- If existing modified files affect the task, read them and work with the changes.

## Completion Checklist

Before final response, verify:

- Relevant Markdown docs were updated, or no doc update was needed.
- Relevant Jest/flow tests were added or updated, or no test update was needed.
- Any required Supabase/database push or function deploy was called out explicitly.
- iPhone/iOS and Android impact was considered for mobile-facing changes.
- Commands run are reported, including failures or skipped checks.
