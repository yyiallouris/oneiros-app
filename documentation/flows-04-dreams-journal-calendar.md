# Dreams: Write, Journal, detail, editor, calendar

## Write tab (`WriteScreen`) — happy path

1. On focus: load **today’s non-archived dream** if any (`archived === false`; legacy treats missing flag as archived), else **draft** for today, else empty form.
2. **Auto-save draft:** after ~2s idle when `content` non-empty → `saveDraft` (today’s date).
3. **Voice (offline-first):** `VoiceRecordButton` requests microphone access and records a single app-wide clip for up to five minutes, regardless of connectivity. On stop it safely stores the local clip and queues transcription; a confirmed transcript appends on a new line to dream content.
   - While transcribing, the mic shows progress and cannot start another recording.
   - A recoverable network, timeout, upstream, or rate-limit failure preserves the local clip and offers **Retry** (same audio) or **Discard**; audio is deleted only after success, discard, or stale-file cleanup.
   - Friendly status copy explains recording, safe local save, waiting for connection, and delivery. Permission denial offers **Open Settings**; typing remains available throughout.
   - The Write surface uses a stable target key (`active`) so pending notes remain visible across midnight and re-entry.
   - Transcript delivery goes only through `claimCompleted` so the same clip cannot append twice after remount.
   - Stuck `transcribing` clips reclaim only after the full client upload budget (~7+ minutes) and never while this process still owns the upload; Retry/Discard appear for queued / retrying / needs-attention only.
   - Dream detail and the standalone interpretation chat use the same control and contract, appending a successful transcript to their chat input with a space.
4. **Save dream / Update dream:** requires non-empty trimmed content.
   - Builds or updates `Dream` with `archived: true` (so it leaves the “today’s active” slot on Write).
   - `saveDream` via `StorageService` (local + sync queue).
   - Clears draft and navigates to **`DreamDetail`** with `dreamId`.
   - The save button disables immediately to prevent double taps, but the visible save loader is delayed for short local saves so the user does not see a reflection-style loading flash during normal Save → DreamDetail navigation.
5. Visual treatment: the writing surface is a single notebook-like page with soft paper tint and hairline edges; nested dashboard cards are intentionally avoided on this screen.

## Regression — Write

- Multiple dreams same calendar day: only `archived === false` shows on Write; legacy dreams without explicit `archived` may behave as archived.
- Draft from **previous** day cleared when opening Write on new day.
- Save with only title / no content: button disabled.
- Menu: Account, Privacy, Contact, **Log out** (`signOut` from Write menu only).

## Journal tab (`JournalScreen`)

- Loads all dreams from storage; sort by date then created/updated.
- **Search** debounced over title + content.
- **Filter params** from route: `filterSymbol`, `filterLandscape`, `filterMotif` (from Insights — see [flows-07-insights-reports.md](./flows-07-insights-reports.md)).
- Dream entries render as lightweight archive slips, not heavy cards. Each slip shows a small date seal, strong title, two-line excerpt, tiny symbolic markers (image/place/atmosphere when available), and reflected/not-reflected state from stored interpretations.
- Tap dream → **`DreamDetail`**.
- Header calendar icon → **`Calendar`**.

## Dream detail (`DreamDetailScreen`)

- Shows the dream as an open page section with hairline edges rather than a heavy card; **Dream essence**, anchors, movement, and symbolic layers are presented as unboxed ritual text blocks/rows; **Jungian reflection** section (interpretation) — see [flows-06-jungian-ai-reflection.md](./flows-06-jungian-ai-reflection.md).
- Header **Edit** → **`DreamEditor`** with `dreamId`.

## Dream editor (`DreamEditorScreen`)

- **Existing dream:** `dreamId` loads dream; save updates fields and date; `saveDream`; `goBack`.
- **New dream for date:** `DreamEditor` with `date` param from Calendar (no `dreamId`) creates new id + random symbol on save.
- **Delete:** confirm dialog → `deleteDream` → `goBack`.

## Calendar (`CalendarScreen`)

- Visualize days with dreams; select date.
- Tap entry → `DreamDetail`.
- Add/new for date → `DreamEditor` with `{ date: selectedDate }`.

## Header calendar from Write

- Navigates to **`Calendar`** without `initialDate`.

## Symbols and archetypes on Dream detail

- Tapping chips opens **info modals** (`SymbolInfoModal` / archetype info keys), not the Journal stack. Landscapes are emphasized in the Insights tab rather than this Dream detail summary area.
