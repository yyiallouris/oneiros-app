# Dreams: Write, Journal, detail, editor, calendar

## Write tab (`WriteScreen`) — happy path

1. On focus: load **today’s non-archived dream** if any (`archived === false`; legacy treats missing flag as archived), else **draft** for today, else empty form.
2. **Auto-save draft:** after ~2s idle when `content` non-empty → `saveDraft` (today’s date).
3. **Voice:** `VoiceRecordButton` records audio → `transcribeAudio` (network/API) appends transcript to content. Failure → alert (user can still type).
4. **Save dream / Update dream:** requires non-empty trimmed content.
   - Builds or updates `Dream` with `archived: true` (so it leaves the “today’s active” slot on Write).
   - `saveDream` via `StorageService` (local + sync queue).
   - Clears draft and navigates to **`DreamDetail`** with `dreamId`.

## Regression — Write

- Multiple dreams same calendar day: only `archived === false` shows on Write; legacy dreams without explicit `archived` may behave as archived.
- Draft from **previous** day cleared when opening Write on new day.
- Save with only title / no content: button disabled.
- Menu: Account, Privacy, Contact, **Log out** (`signOut` from Write menu only).

## Journal tab (`JournalScreen`)

- Loads all dreams from storage; sort by date then created/updated.
- **Search** debounced over title + content.
- **Filter params** from route: `filterSymbol`, `filterLandscape`, `filterMotif` (from Insights — see [flows-07-insights-reports.md](./flows-07-insights-reports.md)).
- Tap dream → **`DreamDetail`**.
- Header calendar icon → **`Calendar`**.

## Dream detail (`DreamDetailScreen`)

- Shows dream card; **Jungian reflection** section (interpretation) — see [flows-06-jungian-ai-reflection.md](./flows-06-jungian-ai-reflection.md).
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

- Tapping chips opens **info modals** (`SymbolInfoModal` / archetype info keys), not the Journal stack. Landscapes are emphasized in the Insights tab rather than this card.
