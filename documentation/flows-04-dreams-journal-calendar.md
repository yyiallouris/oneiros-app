# Dreams: Write, Journal, detail, editor, calendar

## Write tab (`WriteScreen`) — happy path

1. On focus: load **today’s non-archived dream** if any (`archived === false`; legacy treats missing flag as archived), else **draft** for today, else empty form.
2. **Auto-save draft:** after ~2s idle when `content` non-empty → `saveDraft` (today’s date).
3. **Voice (offline-first):** `VoiceRecordButton` requests microphone access and records a single app-wide 16 kHz mono clip through `expo-audio` for up to five minutes, regardless of connectivity. A native stop bound backs up the UI timer. On stop it safely stores the local clip and queues transcription; only a quality-gated transcript appends on a new line to dream content.
   - Before microphone permission/native preparation, stale-orphan cleanup finishes, iOS/Android free storage is checked, and `Documents/voice_pending/` is created and verified readable. The sweep deletes only old audio with no strict queue/inbox/sidecar attribution; unreadable evidence protects files rather than guessing. Below 50 MiB the app returns a dedicated **Not enough storage** explanation and keeps typing available; if the recovery directory is unavailable, the native recorder never starts.
   - On Write, the mic stays anchored at the lower-right of the notebook page, with reserved writing-space padding so status copy never overlaps dream text.
   - Pressing Stop swaps the stop control directly to the compact progress state while the native file is finalized and queued; the idle microphone must never flash between Stop and transcription. The control remains busy while transcribing and cannot start another recording.
   - Synchronous module/UI start guards reject rapid double taps before permission or native recorder preparation can overlap.
   - A module generation fence covers async start: unmount/cleanup invalidates the pending start before the recorder is globally visible, and the candidate is released after any outstanding native preparation settles instead of being left recording without a surface.
   - Normal finalization moves the cache file into the dedicated backup-excluded `Documents/voice_pending/` directory without creating a second full audio copy. A non-storage move failure uses verified copy fallback and deletes the source only after persistence succeeds. Once `moveAsync` succeeds, a metadata-verification error never falls back to copying the now-missing source.
   - Older Android builds that stored queue audio directly under Documents are migrated into `voice_pending/`. File move precedes the queue-URI snapshot; the deterministic destination lets the next read repair a crash between those two operations. If source and destination both exist, the source is deleted only after equal sizes and matching MD5 when both hashes are available; partial/corrupt destinations use a temporary no-backup repair copy verified both before and after promotion, while the source remains authoritative.
   - Before Stop returns, the clip is represented in both a file-sidecar inbox and a checksummed/revisioned AsyncStorage inbox. Queue recovery accepts either copy and removes them only after the queue snapshot is durable. If both writes fail for any reason, Stop still returns the live clip for UI enqueue and keeps owner/target in the process-lifetime recovery inbox; low-storage detection changes messaging, not salvage.
   - A recoverable network, timeout, upstream, or rate-limit failure preserves the local clip for retry logic; audio is deleted only after success, discard, or stale-file cleanup.
   - Backgrounding, navigation away, a native duration stop, a detected audio-session interruption, or a recorder `hasError` event finalizes and queues the available recording exactly once instead of silently abandoning it.
   - If storage fills during stop/move/manifest/queue persistence, out-of-space errors are reclassified as `insufficient_storage`; a readable partial clip is retained and salvaged when possible. If the pending directory itself becomes unavailable after start, Stop still inspects and returns the readable cache source instead of abandoning it. The UI explains that it may still be recoverable after space is freed.
   - `gpt-transcribe` output is checked for known caption-credit hallucinations (`Υπότιτλοι AUTHORWAVE`, Amara/subtitle boilerplate), repetition loops, empty output, and extreme duration/text mismatch. Suspicious output receives one recovery pass; if still unsafe, it is not appended and the clip remains available for retry.
   - Write feedback stays intentionally minimal: concise inline states for offline save / active transcription / retry-needed only. Once the transcript lands in the text, there is no extra “ready” confirmation line. Permission denial still offers **Open Settings**; typing remains available throughout.
   - The Write surface uses a stable target key (`active`) so pending notes remain visible across midnight and re-entry.
   - Transcript delivery is staged: `peekCompleted` leaves queue/audio intact; an owner-bound target command durably commits full composer text with clip-ID dedupe; the visible input is updated immediately; then the screen explicitly acknowledges the clip ID against the committed composer revision. Queue/audio/sidecar cleanup follows independently. Repeated identical speech remains a distinct insertion because integration never relies on `text.includes(transcript)`. Commands capture their owner and visible base revision when created; logout/account switch invalidates queued commands, drains any write already inside storage, and blocks new-owner commands until cleanup ends. Hydration is edit-revision guarded. Cleanup failure preserves `deletion_pending` for retry but cannot hide already committed text. App kill or unmount at any boundary resumes without loss, cross-account write, or duplicate append.
   - The client repeats the quality gate before delivery, preventing a legacy cached hallucination from being appended.
   - Each queue cycle has at most two HTTP attempts; automatic retry stops after three cycles, and three consecutive systemic failures open a five-minute per-user circuit breaker. Stuck `transcribing` clips reclaim only after the full client budget plus safety buffer (~9+ minutes) and never while this process still owns the upload; Retry/Discard appear for queued / retrying / needs-attention only.
   - Dream detail and the standalone interpretation chat use the same control and contract, appending a successful transcript to their chat input with a space.

Detailed runbook: [`../docs/TRANSCRIPTION_RELIABILITY.md`](../docs/TRANSCRIPTION_RELIABILITY.md).
4. **Save dream / Update dream:** requires non-empty trimmed content.
   - Builds or updates `Dream` with `archived: true` (so it leaves the “today’s active” slot on Write).
   - `saveDream` via `StorageService` (local + sync queue).
   - Clears draft and navigates to **`DreamDetail`** with `dreamId`.
   - The save button disables immediately to prevent double taps, but the visible save loader is delayed for short local saves so the user does not see a reflection-style loading flash during normal Save → DreamDetail navigation.
5. Visual treatment: the writing surface is a single notebook-like page with soft paper tint and hairline edges; nested dashboard cards are intentionally avoided on this screen. **Save dream** docks in the layout above the floating tab shelf, using the shared `floatingTabBar` clearance so the CTA stays fully visible on short viewports (web, iPhone SE, Android) instead of overlaying the nav. The notebook page grows to fill the paper between the greeting and that Save dock; compact min-heights only set a floor, they do not shrink the writing well into a stub.

## Regression — Write

- Multiple dreams same calendar day: only `archived === false` shows on Write; legacy dreams without explicit `archived` may behave as archived.
- Draft from **previous** day cleared when opening Write on new day.
- Save with only title / no content: button disabled.
- Menu: Account, Privacy, Contact, **Log out** (`signOut` from Write menu only).

## Journal tab (`JournalScreen`)

- Loads all dreams from storage; sort by date then created/updated.
- **Search** debounced over title + content.
- **Filter params** from route: `filterSymbol`, `filterLandscape`, `filterMotif` (from Insights — see [flows-07-insights-reports.md](./flows-07-insights-reports.md)).
- Dream entries render as lightweight archive slips, not heavy cards. Each slip shows a small date seal, then copy: an explicit title stays a strong one-line heading plus a two-line excerpt. An untitled dream keeps that same hierarchy — a one-line title from the opening words, ending with `...` so it still reads as a title, then a two-line excerpt that continues those words on a word boundary, with no mid-word cut. Tiny symbolic markers (Image, Place, Atmosphere when available) follow as separate soft capsules using natural `Label: value` syntax, so adjacent metadata never runs together as slash-delimited text.
- Tap dream → **`DreamDetail`**.
- Header calendar icon → **`Calendar`**.

## Dream detail (`DreamDetailScreen`)

- Shows the dream as an open page section with hairline edges rather than a heavy card; **Dream essence**, anchors, and movement remain unboxed ritual text blocks/rows. **Explore symbolic layers** continues that editorial rhythm as a transparent, borderless 60dp disclosure row directly after the preceding section hairline, with only its animated chevron identifying the interaction. It has no decorative leading icon or isolated whitespace island and remains distinct from the separate **Continue the conversation** chat action; **Jungian reflection** section (interpretation) — see [flows-06-jungian-ai-reflection.md](./flows-06-jungian-ai-reflection.md).
- Initial load uses `DreamDetailSkeleton` — a layout-faithful placeholder for the dream page + reflection summary. Do **not** use journal-list `LinoSkeletonCard` rows here (those look like two small cards and do not match the loaded layout).
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
