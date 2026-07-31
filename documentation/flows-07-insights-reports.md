# Insights, periods, recent dream field, pattern reports, journal drill-down

## Insights tab (`InsightsScreen`)

- The landing screen no longer exposes a top-level period dropdown.
- It loads the current-month insights overview via `getInsightsOverview(getPeriodThisMonth())` to preview the active field and the forming-pattern entry points.
- Returning from an Insights section (e.g. Thresholds) soft-refreshes overview data without a full-screen loading remount, and restores the previous Insights scroll offset so Forming Patterns stays in view.

### Main structure and navigation

- **Legacy hidden:** the old Dream Field Overview summary block is kept behind a legacy gate in `InsightsScreen` and is no longer part of the active Insights layout.
- **Recent Dream Field:** living reflection on the latest interpreted dreams; paid users default to Last 3 and can switch between Last 2 / Last 3 / Last 5; uses the global Insights language selected in Account; cached locally by exact dream-id sequence + language; not saved to the monthly archive and not shown in Past reflections.
  - Free users see this as a deactivated but tappable Premium surface.
  - Free users do not see a preselected recent-scope chip; the scope options stay faded/unselected until Premium unlocks them, while the scope label keeps the same copy as paid but in a muted style.
  - In the free locked state, the CTA is inline clickable text (`Unlock Premium`) rather than a filled button, matching the nearby Period Reflection pattern.
  - The top-right uppercase Premium tag is not shown in the free locked state.
  - Locked taps open a premium-only upsell card rather than a full free-vs-premium compare view.
  - The inline “recent field is forming” helper box is not shown anymore when the current scope is still too light.
- **Period Reflection:** primary card to `pattern-recognition` in **`InsightsSection`** for archived calendar-period reports.
  - Free users see a locked paid-plan card with tappable upsell behavior rather than a dead end.
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

- Horizontal pager order: **images → recurring scenes → emotional weather → thresholds → tensions → places**.
- Each page embeds `InsightsSectionScreen` with `embedded` props (same period).

## Insights section (`InsightsSectionScreen`)

Visual treatment: detail sections avoid dashboard-style nested cards. Pattern controls, report output, empty states, symbol associations, archetype overviews, and collective placeholders render as open text blocks/rows with hairline separators. Insight report language is configured from Account rather than inside report screens.

- **Forming pattern period picker:** `Returning Images`, `Recurring Scenes`, `Emotional Weather`, `Thresholds`, `Inner Tensions`, and `Dream Places` own the period picker locally. The selector offers This month, Last month, Last 3 months, Last 6 months, and All time from inside the section screen itself, and updates the section header period label in place. Archetypal Echoes remain extractable and routable for Dream Detail / deep links, but are no longer one of the six main Forming Patterns tiles.
- **Insights icon refresh:** the Period Reflection entry and the six forming-pattern categories now render from the supplied PNG icon set, including a dedicated Emotional Weather asset (`oneiros_insight_emotional_weather.png`). The shared icon renderer crops the transparent 900×900 RGBA source canvases to their visible artwork bounds, and the previous generated SVG insights icons are kept under `src/components/icons/generated/legacy/` for reference only.

Per `sectionId`:

- **Returning Images / symbol details:** clusters, associations, bars; links to **`JournalFilter`** with `filterSymbol`. Single appearances are collapsed by default.
- **Recurring Scenes / Dream Places:** similar aggregations; journal links with `filterMotif` / `filterLandscape`. Single/other items are collapsed by default.
- **Emotional Weather:** recurring felt tones from `affects` (`sectionId: emotional-weather`); count is distinct dreams per tone; single appearances are collapsed by default; no journal filter in this pass.
- **Thresholds / Inner Tensions:** recurring transition points and tensions; single crossings/tensions are collapsed by default.
- **Archetypal Echoes:** still routable for deep/legacy views, but removed from the main Forming Patterns grid.
- **Period Reflection:** AI calendar-period reports; month picker (last 12 months); requires at least 2 interpreted dreams in the selected period; Premium current month uses a month-level report key, while Deeper keeps week keys for the current month via `getReportKeyForGeneration`; uses the global Insights language selected in Account; saves reports via `remoteSavePatternReport` / loads `remoteGetPatternReports` when online; uses interpreted dream entries from `getPatternInsightEntries` (capped, period-filtered); generation now routes through `generateEntitledPeriodReflection`.
- **Recent Dream Field:** AI recent-sequence reflection lives on `InsightsScreen`; uses `getRecentPatternInsightEntries`, `getRecentSequenceScopeKey`, and `generateEntitledRecentDreamField` for the standard paid path; requires at least 2 interpreted dreams; reads the global Insights language from `patternInsightLanguageService`; local cache key is based on the exact `dreamIds` hash and language; does not use `monthKey`, `LocalStorage.savePatternReport`, `remoteSavePatternReport`, or the Past reflections archive.
- **Collective:** `getCollectiveInsights()` — currently **placeholder** empty aggregates (`insightsService` TODO).

## Backend entitlement model (active screen path)

- Recent Dream Field now has a backend quota contract: Premium gets 10 generations per billing cycle, Deeper is unlimited, and cache reuse still applies for exact same sequence + language.
- Recent Dream Field and Period Reflection gateway prompts keep parity with the canonical June 9 essay contracts from `src/services/ai.ts`: post-Jungian symbolic essayist role, image-near synthesis over tag listing, grounded hypothetical claims, exact English section headings, requested-language body/questions, two reflective questions, and hidden essay completion markers stripped before persistence.
- Gateway generation for Recent Dream Field and Period Reflection emits reflect-style sanitized AI cost logs (`recent_dream_field_*` / `period_reflection_*` cost fields) from provider usage tokens and the shared monthly pricing table in `src/billing/aiPricing.ts`. Logs never include essay text or prompts.
- Essays now have a backend cadence contract:
  - paid-only
  - at least 2 reflected dreams
  - Premium current month = month-to-date, 1 essay per calendar month
  - Deeper current month = 1 essay per calendar week
  - finished months = immutable archived artifact per scope key
- First paid quota exhaustion can surface the one-time grace-bundle gift message (`+5` reflections, `+5` recent-field reports) before future denials fall back to upgrade copy only.
- Backend artifacts live in `ai_generation_artifacts` and period reflections are mirrored into `pattern_reports` for compatibility.
- Lapsed paid users can still read stored premium artifacts, but generation entrypoints become read-only and route to renewal messaging.
- Locked paid-plan taps across Insights now use the premium-only paywall mode for Recent Dream Field, Period Reflection, regenerate, and paid follow-up entrypoints.
- Reflections whose extraction metadata is still `pending` are temporarily skipped by Recent Dream Field and Essay inputs; they become eligible when the post-reflection metadata action marks metadata `ready`.

### Online checks

- Pattern generation, including Recent Dream Field, and some remote report fetches use `isOnline()` — offline → user messaging / disabled actions per UI.

## Journal filter stack (`JournalFilterScreen`)

- Wraps `JournalScreen` with `overrideParams` so back returns to insights context; header title reflects symbol/landscape/motif.

## Insights ↔ data dependencies

- Aggregations use **local dreams** and interpretations. Full pattern metadata remains available for Insights synthesis: symbols, archetypes, landscapes, affects, motifs, relational dynamics, thresholds, central conflicts, core mode, amplifications, and symbol stances. Recent Dream Field and Essay context includes Fabric fields plus formatted Archetypal Echoes (`canonical (expression) — resonance`) and Mythic Echoes (`title (tradition) — resonance/divergence`) — never raw object dumps or bare disconnected tags. Dream Detail UI differs: archetypal cards show canonical + resonance only; mythic cards show high and medium parallels as `title — tradition` with natural resonance/divergence. Forming Patterns grid counts use archetype `canonical_label` only and do not include amplifications.
- `display_distillation` is for immediate DreamDetail presentation only; monthly/quarterly reports and recent reflections continue to synthesize from full metadata and interpretation excerpts.
- The new backend gateway assumes remote dream + interpretation data is available and is now the default path for gated premium actions.
- **Regression:** insights empty until user has reflections with extracted fields; changing period changes all section data.
- **Regression:** adding a newly interpreted dream to an existing period updates interpreted counts, strongest patterns, recurring images, motifs, thresholds, and the field summary.
- **Regression:** Recent Dream Field and Essay gateway responses persist to their local caches/reports using the returned scope key, including cached gateway artifacts.

## Calendar + insights

- From Insights → Calendar opens focused date; user can still open dreams and editor from Calendar (see [flows-04-dreams-journal-calendar.md](./flows-04-dreams-journal-calendar.md)).
