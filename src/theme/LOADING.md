# Loading System Guide

Centralized async feedback lives in **`src/theme/loading.ts`** and **`src/components/ui/LoadingState.tsx`**.

The app does **not** spin inside buttons. When work starts, hide the trigger control and show a shared loading visual in its place.

## Core rule

> **Hide the action, show the visual.**

Use `ActionLoadingSlot` for CTAs and `LoadingState` directly for screen/section fetch states.

```tsx
import { Button, ActionLoadingSlot } from '../components/ui';

<ActionLoadingSlot
  loading={isSaving}
  loadingProps={{ preset: 'saveDream' }}
>
  <Button title="Save dream" onPress={handleSave} disabled={!canSave} />
</ActionLoadingSlot>
```

For fast local actions such as **Save dream**, disable the trigger immediately but delay the visible `ActionLoadingSlot` loader briefly. This preserves double-tap protection without flashing the heavier reflection-style visual during normal Save → DreamDetail navigation.

## Variants

| Variant | Visual | Use for |
|---------|--------|---------|
| `breath` | `BreathingLine` | Fetch, navigation, auth, send message, short waits |
| `reflect` | `PrintPatchLoader` | AI reflection, dream save, chat send, deep processing |

## Contexts

| Context | Layout | Use for |
|---------|--------|---------|
| `screen` | Full route center | Loading a screen's first payload |
| `panel` | Parchment card (replaces CTA row) | Generate reflection, save dream, auth submit |
| `inline` | Thin centered strip | Journal header, calendar day sheet |
| `compact` | 44×44 | Icon send buttons via `PrimaryIconButton` |

## Presets

Named bundles in `loadingPresets` (`src/theme/loading.ts`):

- `saveDream`, `deleteDream`
- `recentReflection`, `dreamReflection`, `analyzeDream`
- `loadDream`, `loadSection`, `loadJournal`, `loadDayDreams`
- `authSubmit`, `sendSupport`, `consentSave`, `setPassword`, `biometricUnlock`
- `sendMessage` (compact icon)

Prefer presets over one-off copy. Override `message` / `submessage` only when the preset text is wrong for the flow.

## Long-form AI output

When generating essays/reports:

1. Hide the generate button row (`ActionLoadingSlot` or conditional render).
2. Show `LoadingState` with `preset="recentReflection"` (or `dreamReflection`).
3. Add `ContentSkeleton` beneath it while the report body is forming.

Example: Insights period reflection (`InsightsSectionScreen`).

## List placeholders

Journal initial load still uses `LinoSkeletonCard` rows — that is list scaffolding, not action loading. Do not replace list skeletons with `LoadingState`.

## Do not use

- `ActivityIndicator` inside `Button` (removed).
- Opacity hacks on disabled buttons to imply loading.
- Ad-hoc `BreathingLine` + `Text` pairs in screens — use `LoadingState`.
- `ThreadDrift` for new loading states (legacy; use `reflect`).

## Exceptions

Keep local micro-spinners only for:

- `VoiceRecordButton` transcription/recording feedback.
- Inline toggle rows (biometric switch) while hardware state resolves.
- `LoadingScreen` app launch splash (brand emblem, not async work).

## Adding a new loading state

1. Check whether an existing preset fits.
2. If not, add a preset to `loading.ts` with variant + context + copy.
3. Wrap the CTA in `ActionLoadingSlot` or render `LoadingState` for screen fetch.
4. Add/adjust a test in `__tests__/loading.test.ts` when introducing a new preset or component behavior.

## Related files

| What | File |
|------|------|
| Presets + layout tokens | `src/theme/loading.ts` |
| Shared visual component | `src/components/ui/LoadingState.tsx` |
| CTA swap helper | `src/components/ui/ActionLoadingSlot.tsx` |
| Report body skeleton | `src/components/ui/ContentSkeleton.tsx` |
| Icon actions while sending | `src/components/ui/PrimaryIconButton.tsx` |
| Colors for loaders | `src/theme/colors.ts` → `accent.buttonPrimary` |

See also: `src/theme/DESIGN.md` and `src/theme/COLORS.md`.
