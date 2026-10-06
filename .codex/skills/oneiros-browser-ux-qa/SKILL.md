---
name: oneiros-browser-ux-qa
description: Audit Oneiros web surfaces and browser-reproducible app journeys with a real browser. Use for interactive UX reviews, responsive checks, keyboard and focus behavior, loading/error/empty states, visual regressions, or post-change browser verification. Do not treat browser results as proof of native-only iOS or Android behavior.
---

# Oneiros Browser UX QA

Use this skill to exercise Oneiros as a user would in a real browser and return evidence-backed UX findings. Pair it with `.codex/skills/oneiros-repo/SKILL.md` for repository obligations. Load `.codex/skills/oneiros-visual-qa/SKILL.md` when the review includes visual hierarchy, surfaces, gradients, iconography, CTA placement, or screenshot-level polish.

## Required reads

1. Read `AGENTS.md` and `.codex/skills/oneiros-repo/SKILL.md`.
2. Read `documentation/README.md` and the flow document for the journey being tested.
3. For visual review, read `src/theme/DESIGN.md` and the relevant theme docs.
4. Inspect the implementation only as needed to identify intended states, selectors, test data, and platform boundaries. Do not let source inspection replace the browser pass.

## Choose the target

- Use an existing user-provided or already-open browser tab when it is the requested target.
- For the Expo web app, start or reuse the repository's `npm run web` server and open its reported local URL. Do not guess the port when the command reports a different one.
- For the public legal/support pages, start or reuse `npm run site:preview` and open the relevant route under the reported local address.
- Do not start a second server when a healthy matching server already exists.
- Treat authenticated, destructive, paid, quota-consuming, or externally messaging actions as normal authorization boundaries. A UX audit does not imply permission to submit them.

## Browser audit workflow

1. Define the journey, expected outcome, important states, and the evidence required before interacting.
2. Record the browser, viewport, URL/route, auth/test-data assumptions, and whether the target is local, staging, or production.
3. Establish a clean baseline: load the entry route, wait for intentional loading to settle, and note console-visible or on-screen failures before changing state.
4. Exercise the journey through visible controls. Verify navigation, feedback, validation, recovery, persistence after refresh when relevant, and back/forward behavior.
5. Check representative viewports rather than resizing aimlessly:
   - narrow phone: about 390 x 844
   - short phone: about 390 x 667 when bottom actions or the floating tab bar matter
   - tablet: about 768 x 1024
   - desktop: about 1440 x 900
   Use only the viewports relevant to the surface and risk.
6. Run a keyboard pass for forms and dialogs: logical tab order, visible focus, Enter/Space activation, Escape dismissal when expected, and focus restoration after overlays close.
7. Check loading, empty, validation, offline/error, disabled, and long-content states when they are safely reproducible. Never fabricate a pass for an inaccessible state.
8. Capture screenshots at decisive states and record exact reproduction steps for each issue. Recheck after any fix instead of relying on code inspection.

For the detailed audit and reporting rubric, read [references/browser-ux-checklist.md](references/browser-ux-checklist.md).

## Oneiros-specific guardrails

- Preserve the centered phone-scale `WebContentShell` contract on wide web viewports; desktop width is not permission to stretch mobile content edge to edge.
- On short viewports, verify that primary CTAs and scrollable content clear the floating tab bar and remain reachable.
- Check long translated/generated content without changing the English-only v1 structural chrome contract.
- A browser audit may observe DreamDetail reflection streaming, but must not remove, shorten, or replace the locked `PhasedTypingText` experience.
- Never enter real dream content, credentials, payment data, or other personal information into screenshots, logs, issue notes, or test fixtures.
- Never claim native coverage for biometrics, microphone/audio recording, store purchase flows, push/deep-link handoff, native permissions, haptics, or platform safe-area behavior. Route those to simulator/device or Detox verification and say what remains untested.

## Findings and severity

Report findings in priority order with:

- severity: `blocker`, `high`, `medium`, or `low`
- route and viewport
- concise observed behavior versus expected behavior
- exact reproduction steps
- screenshot or other evidence when available
- likely owning component only when supported by evidence
- platform boundary and confidence

Separate confirmed defects from observations and recommendations. If no defect is found, describe the journeys and states actually covered; never report a generic “looks good.”

## When edits follow the audit

- Ask before changing product behavior when the requested task is review-only.
- If the user asked for fixes, make the smallest in-scope change, update relevant docs/tests under the Oneiros repo rules, then repeat the failing browser steps.
- Browser evidence complements Jest, flow tests, typecheck, and native E2E; it does not replace them.
- Final reporting must list commands run, browser/viewport coverage, screenshots or states inspected, fixes made, and remaining native or inaccessible coverage gaps.
