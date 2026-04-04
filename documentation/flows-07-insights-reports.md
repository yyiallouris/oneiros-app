# Insights, periods, journey, pattern reports, journal drill-down

## Insights tab (`InsightsScreen`)

- **Period presets:** This month, Last month, Last 3 / 6 months, All time.
- “All time” resolves period asynchronously via `getPeriodAllTime()`; others use fixed date ranges.
- Loads counts: dreams in period, recurring **symbols**, **archetypes**, **landscapes** (`insightsService`).

### Navigation from carousel / cards

- **Linked sections** (open swipe **InsightsJourney**): `recurring-symbols`, `symbolic-motifs`, `recurring-archetypes`, `space-landscapes` — passed `periodStart`, `periodEnd`, `periodLabel`.
- **Standalone section screen:** `pattern-recognition`, `collective` → **`InsightsSection`**.
- **Calendar shortcut:** navigates to **`Calendar`** with `initialDate` = current period start.
- **“Symbolic elements”** entry → **InsightsJourney** starting at recurring symbols.

## Insights journey (`InsightsJourneyScreen`)

- Horizontal pager order: **symbols → motifs → archetypes → landscapes**.
- Each page embeds `InsightsSectionScreen` with `embedded` props (same period).

## Insights section (`InsightsSectionScreen`)

Per `sectionId`:

- **Recurring symbols / symbol details:** clusters, associations, bars; links to **`JournalFilter`** with `filterSymbol`.
- **Archetypes, motifs, landscapes:** similar aggregations; journal links with `filterMotif` / `filterLandscape` / symbol.
- **Pattern recognition:** AI **monthly / quarterly** reflective reports; month picker (last 12 months); weekly variant where `isFirstWeekOfMonthFinished` applies; language picker (`PATTERN_INSIGHT_LANGUAGES`); saves reports via `remoteSavePatternReport` / loads `remoteGetPatternReports` when online; uses interpreted dream entries from `getPatternInsightEntries` (capped, period-filtered).
- **Collective:** `getCollectiveInsights()` — currently **placeholder** empty aggregates (`insightsService` TODO).

### Online checks

- Pattern generation and some remote report fetches use `isOnline()` — offline → user messaging / disabled actions per UI.

## Journal filter stack (`JournalFilterScreen`)

- Wraps `JournalScreen` with `overrideParams` so back returns to insights context; header title reflects symbol/landscape/motif.

## Insights ↔ data dependencies

- Aggregations use **local dreams** and interpretations (symbols/archetypes/landscapes/motifs often from interpretation extraction).
- **Regression:** insights empty until user has reflections with extracted fields; changing period changes all section data.

## Calendar + insights

- From Insights → Calendar opens focused date; user can still open dreams and editor from Calendar (see [flows-04-dreams-journal-calendar.md](./flows-04-dreams-journal-calendar.md)).
