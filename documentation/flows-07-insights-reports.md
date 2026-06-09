# Insights, periods, dream-field overview, pattern reports, journal drill-down

## Insights tab (`InsightsScreen`)

- **Period presets:** This month, Last month, Last 3 / 6 months, All time.
- “All time” resolves period asynchronously via `getPeriodAllTime()`; others use fixed date ranges.
- Loads a computed dream-field overview via `getInsightsOverview(period)`: logged dreams, reflected dreams, top images, motifs, thresholds, tensions, places, archetypal echoes, affects, strongest cross-category patterns, and a deterministic field summary.

### Main structure and navigation

- **Dream Field Overview:** summary + logged/reflected counts + top images/affects.
- **Recent Dream Field:** living reflection on the latest interpreted dreams; default Last 3, selectable Last 2 / Last 3 / Last 5; cached locally by exact dream-id sequence + language; not saved to the monthly archive and not shown in Past reflections.
- **Period Reflection:** primary card to `pattern-recognition` in **`InsightsSection`** for archived calendar-period reports.
- **Returning Patterns:** unified strongest patterns across categories.
  - Images → **`JournalFilter`** with `filterSymbol`.
  - Motifs → **`JournalFilter`** with `filterMotif`.
  - Places → **`JournalFilter`** with `filterLandscape`.
  - Thresholds / inner tensions / archetypal echoes → **`InsightsSection`**.
- **Pattern Explorer:** vertical category overview with strongest signals and top previews; category “View all” links to **`InsightsSection`**.
- **Explore Deeper:** direct links to category detail screens using human-facing labels.
- `InsightsJourneyScreen` remains in code for compatibility/design export, but is no longer the main Insights entry path.
- `collective` remains routable but is hidden from the primary Insights UX until the aggregate layer is real.

## Insights journey (`InsightsJourneyScreen`)

- Horizontal pager order: **images → motifs → thresholds → tensions → archetypes → places**.
- Each page embeds `InsightsSectionScreen` with `embedded` props (same period).

## Insights section (`InsightsSectionScreen`)

Visual treatment: detail sections avoid dashboard-style nested cards. Pattern controls, report output, empty states, symbol associations, archetype overviews, and collective placeholders render as open text blocks/rows with hairline separators; small interactive controls such as language chips remain contained.

Per `sectionId`:

- **Returning Images / symbol details:** clusters, associations, bars; links to **`JournalFilter`** with `filterSymbol`. Single appearances are collapsed by default.
- **Repeating Patterns / Dream Places:** similar aggregations; journal links with `filterMotif` / `filterLandscape`. Single/other items are collapsed by default.
- **Thresholds / Inner Tensions:** recurring transition points and tensions; single crossings/tensions are collapsed by default.
- **Archetypal Echoes:** lower-hierarchy archetypal recurrence display.
- **Period Reflection:** AI **monthly / quarterly** reflective reports; month picker (last 12 months); requires at least 2 interpreted dreams in the selected period; current month uses month-to-date entries while report keys stay weekly via `getReportKeyForGeneration`; language picker (`PATTERN_INSIGHT_LANGUAGES`); saves reports via `remoteSavePatternReport` / loads `remoteGetPatternReports` when online; uses interpreted dream entries from `getPatternInsightEntries` (capped, period-filtered).
- **Recent Dream Field:** AI recent-sequence reflection lives on `InsightsScreen`; uses `getRecentPatternInsightEntries`, `getRecentSequenceScopeKey`, and `generateRecentDreamFieldReflection`; requires at least 2 interpreted dreams; local cache key is based on the exact `dreamIds` hash and language; does not use `monthKey`, `LocalStorage.savePatternReport`, `remoteSavePatternReport`, or the Past reflections archive.
- **Collective:** `getCollectiveInsights()` — currently **placeholder** empty aggregates (`insightsService` TODO).

### Online checks

- Pattern generation, including Recent Dream Field, and some remote report fetches use `isOnline()` — offline → user messaging / disabled actions per UI.

## Journal filter stack (`JournalFilterScreen`)

- Wraps `JournalScreen` with `overrideParams` so back returns to insights context; header title reflects symbol/landscape/motif.

## Insights ↔ data dependencies

- Aggregations use **local dreams** and interpretations. Full pattern metadata remains available for Insights: symbols, archetypes, landscapes, affects, motifs, relational dynamics, thresholds, central conflicts, core mode, amplifications, and symbol stances.
- `display_distillation` is for immediate DreamDetail presentation only; monthly/quarterly reports and recent reflections continue to synthesize from full metadata and interpretation excerpts.
- **Regression:** insights empty until user has reflections with extracted fields; changing period changes all section data.

## Calendar + insights

- From Insights → Calendar opens focused date; user can still open dreams and editor from Calendar (see [flows-04-dreams-journal-calendar.md](./flows-04-dreams-journal-calendar.md)).
