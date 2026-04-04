# Jungian AI: reflection, chat, and interpretation storage

Primary UX is **`DreamDetailScreen`** (embedded reflection + chat). The stack also registers **`InterpretationChat`** with the same conceptual flow, but **no in-app `navigation.navigate('InterpretationChat')` call** was found in the repo — treat it as a **maintained alternate route** (e.g. future linking or tests).

## Settings that affect AI output

- **Interpretation depth** and **Mythic Resonance** from `userSettingsService` (Account screen).
- Constants in `constants/interpretation.ts` (e.g. `MAX_AI_RESPONSES`).

## Happy path — first reflection

1. User opens dream with no interpretation (or stale handling per screen logic).
2. User triggers **generate** / initial reflection (online required — see below).
3. `generateInitialInterpretation` → AI text; symbols/archetypes extracted from prose or fallback extraction (see [`docs/SYMBOLS_FLOW.md`](../docs/SYMBOLS_FLOW.md)).
4. `saveInterpretation` persists messages + metadata; syncs in background when logged in.

## Follow-up chat (same screen)

- Inline chat after initial assistant message.
- `sendChatMessage` with history; updates interpretation messages locally + sync.
- **Assistant message cap:** when `assistantCount >= MAX_AI_RESPONSES`, further sends blocked (UI reflects limit).

## Offline behavior

- Before **initial** generation or **update** reflection: `isOnline()` check; if offline → **OfflineMessage** (timed).
- **Send chat message** while offline: same offline message pattern; no request sent.

## Regenerate / update interpretation

- User can request an updated reflection (e.g. after editing dream — flows in `DreamDetailScreen`); uses structured extraction path when applicable.

## Delete interpretation

- Possible from detail flow (e.g. reset / delete path) via `deleteInterpretation` — local + remote best-effort.

## `InterpretationChatScreen`

- Parallel implementation: dream load, interpretation load, generate, chat, offline checks, voice button.
- For regression: if product wires navigation here later, mirror tests from DreamDetail.

## Regression ideas

- Reflection with each depth level + mythic on/off (advanced only).
- Hit message limit → send disabled / messaging.
- Network drop mid-request → error alert, input restored where implemented.
- Interpretation sync: create on device A, login device B → merge (depends on remote storage).
