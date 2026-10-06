# Browser UX Checklist

Use only the sections relevant to the requested journey. Depth is more useful than mechanically checking every item.

## Journey integrity

- Entry point is discoverable and the current location is understandable.
- Primary and secondary actions have clear hierarchy and accurate labels.
- Every action produces timely feedback and resists accidental duplicate submission.
- Back, refresh, and retry behavior preserve or discard state intentionally.
- Success has a visible completion state and a sensible next action.
- Cancellation and recovery do not trap the user or silently lose meaningful input.

## Responsive layout

- No horizontal scroll, clipped text, overlapping controls, or unreachable content.
- Text reflows without truncating meaning; long values and generated prose remain readable.
- Fixed, sticky, and floating elements do not obscure content or each other.
- Modals and menus stay inside the viewport and remain dismissible.
- Oneiros web content stays within the intended centered phone-scale shell on wider screens.
- Short viewport height is tested whenever bottom navigation, a keyboard, or a docked CTA is present.

## Interaction and forms

- Click/tap targets are distinguishable and large enough for the intended device class.
- Hover is enhancement only; essential actions remain usable without it.
- Labels, hints, validation, and errors explain how to recover without exposing sensitive data.
- Disabled actions communicate why they are unavailable when the reason is not obvious.
- Password, autocomplete, paste, submit, and double-click behavior match the form's intent.
- Destructive actions have appropriate friction and are not executed during review without authorization.

## Keyboard and accessibility smoke checks

- Tab order follows the visual and logical reading order.
- Focus is always visible and does not enter hidden or inert content.
- Buttons, links, checkboxes, menus, tabs, and dialogs work from the keyboard.
- Dialog focus is contained while open and restored to the trigger after close.
- Page title, headings, labels, landmarks, and accessible names make the screen understandable.
- Status and validation changes are conveyed by more than color alone.
- At browser zoom, the journey remains usable without content loss or two-dimensional scrolling where avoidable.

This is a browser smoke audit, not a substitute for a formal WCAG conformance audit or assistive-technology testing.

## State coverage

Prefer state transitions that reveal behavior:

- first load and slow load
- empty and populated
- valid and invalid input
- disabled and enabled action
- recoverable network failure and retry
- long content, translated content, and narrow/short viewport
- refresh or revisit after a meaningful local state change

Do not simulate production failures through destructive data changes when a safe fixture, local state, or test double is not available.

## Visual evidence

Capture the smallest useful evidence set:

- entry or baseline state
- the exact broken or high-risk state
- post-fix state when a change was requested
- full viewport plus a focused crop only when both are needed to understand hierarchy

Exclude credentials, tokens, real dream text, emails, payment details, and other personal information. Use synthetic content and redact incidental sensitive data before sharing.

## Severity rubric

- `blocker`: prevents completion of a critical journey or risks irreversible harm/data exposure
- `high`: major journey failure with no reasonable recovery, or a serious accessibility barrier
- `medium`: degraded completion, confusing recovery, layout breakage, or inconsistent state with a workaround
- `low`: polish, copy, minor hierarchy, or edge-case inconsistency that does not materially block completion

## Recommended finding format

```text
[severity] Short finding title
Route / viewport:
Observed:
Expected:
Steps:
Evidence:
Platform boundary:
Confidence:
```
