# Insights, periods, recent dream field, pattern reports, journal drill-down

## Insights tab (`InsightsScreen`)

- The landing screen no longer exposes a top-level period dropdown.
- It loads the current-month insights overview via `getInsightsOverview(getPeriodThisMonth())` to preview the active field and grouped section entry points.
- Returning from an Insights section (e.g. Thresholds) soft-refreshes overview data without a full-screen loading remount, and restores the previous Insights scroll offset so the same spot in the Insights list stays in view.

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
- **Insights categories:** the landing page no longer places every insight tile under a single `Forming Patterns` umbrella. It now groups the category entry points into:
  - `Dream Fabric`: Images, Motifs, Emotional Atmosphere, Dream Landscapes
  - `Dream Movement`: Thresholds, Inner Tensions
  - `Deeper Echoes`: Archetypal Echoes
  Each group uses descriptive copy about what kind of dream material it represents, while recurrence language is reserved for the Pattern Explorer surface.
- **Returning Patterns:** unified strongest patterns across categories.
  - Images → **`JournalFilter`** with `filterSymbol`.
  - Motifs → **`JournalFilter`** with `filterMotif`.
  - Landscapes → **`JournalFilter`** with `filterLandscape`.
  - Thresholds / inner tensions / archetypal echoes → **`InsightsSection`**.
- **Pattern Explorer:** vertical category overview with strongest signals and top previews; category “View all” links to **`InsightsSection`**. This is the one Insights surface that explicitly uses recurrence language (`gathers`, `returns`, `reappears`, `persists`, `revisits`) to describe how a type of material behaves across many dreams.
- The landing screen no longer renders a dedicated `Forming Patterns` / `Open Pattern Explorer` entry card; Pattern Explorer remains a secondary surface rather than a main landing block.
- **Explore Deeper:** direct links to category detail screens using human-facing labels.
- Insights landing and detail sections keep enough bottom scroll clearance to remain fully scrollable to the final rows above the floating tab shelf / home-indicator area.
- `InsightsJourneyScreen` remains in code for compatibility/design export, but is no longer the main Insights entry path.
- `collective` remains routable but is hidden from the primary Insights UX until the aggregate layer is real.

## Insights journey (`InsightsJourneyScreen`)

- Horizontal pager order: **images → motifs → emotional atmosphere → crossings → tensions → dream landscapes**.
- Each page embeds `InsightsSectionScreen` with `embedded` props (same period).

## Insights section (`InsightsSectionScreen`)

Visual treatment: detail sections avoid dashboard-style nested cards. Pattern controls, report output, empty states, symbol associations, archetype overviews, and collective placeholders render as open text blocks/rows with hairline separators. Insight report language is configured from Account rather than inside report screens.

- **Forming pattern period picker:** `Images`, `Motifs`, `Emotional Atmosphere`, `Thresholds`, `Inner Tensions`, `Dream Landscapes`, and `Archetypal Echoes` own the period picker locally. The selector offers This month, Last month, Last 3 months, Last 6 months, and All time from inside the section screen itself, and updates the section header period label in place.
- **Insights icon refresh:** the Period Reflection entry, grouped landing categories, and Pattern Explorer render from the supplied PNG icon set using the corrected Archetypal Echoes asset (`oneiros_isnights_archetypes.png`), the corrected Period Reflection asset (`pattern_recognition_essay/oneiros_pattern_recognition_essay.png`), and the dedicated Emotional Weather asset (`oneiros_insight_emotional_weather.png`). Those two 1024px sources are now stored as true-transparent artwork, and the shared icon renderer crops each canvas to its visible bounds so the icons read at consistent sizes without white backing plates. The previous generated SVG insights icons are kept under `src/components/icons/generated/legacy/` for reference only.

Per `sectionId`:

- **Images / symbol details:** the section definition stays image-near and non-reductive (`Figures, objects, and forms that carry weight in the dream`), while the list itself still aggregates repeated images. Links to **`JournalFilter`** with `filterSymbol`. `Single Appearances` now render inline from the start instead of hiding behind an expand toggle.
- **Motifs / Dream Landscapes:** section definitions describe what kind of dream material they are, not whether repetition has already been established. Journal links use `filterMotif` / `filterLandscape`. Motif `Single Appearances` now render inline from the start.
- **Emotional Atmosphere:** defined as the felt climate around the dream, while the underlying counts still aggregate recurring `affects` across dreams. `Single Appearances` now render inline from the start; no journal filter in this pass.
- **Thresholds / Inner Tensions:** the section intro defines the material (`passage, hesitation, and change`; `opposing pulls or demands`) without collapsing immediately into recurrence language, even though the list still shows period counts.
- **Archetypal Echoes:** restored to the grouped landing categories and still available through direct routing / deep links, using the same aggregated `topArchetypalEchoes` metadata pipeline as the detail section.
- **Period Reflection:** AI calendar-period reports; month picker (last 12 months); requires at least 2 interpreted dreams in the selected period; Premium current month uses a month-level report key, while Deeper keeps week keys for the current month via `getReportKeyForGeneration`; uses the global Insights language selected in Account; saves reports via `remoteSavePatternReport` / loads `remoteGetPatternReports` when online; uses interpreted dream entries from `getPatternInsightEntries` (capped, period-filtered); generation now routes through `generateEntitledPeriodReflection`.
- **Recent Dream Field:** AI recent-sequence reflection lives on `InsightsScreen`; uses `getRecentPatternInsightEntries`, `getRecentSequenceScopeKey`, and `generateEntitledRecentDreamField` for the standard paid path; requires at least 2 interpreted dreams; reads the global Insights language from `patternInsightLanguageService`; local cache key is based on the exact `dreamIds` hash and language; does not use `monthKey`, `LocalStorage.savePatternReport`, `remoteSavePatternReport`, or the Past reflections archive.
- **Collective:** `getCollectiveInsights()` — currently **placeholder** empty aggregates (`insightsService` TODO).

## Backend entitlement model (active screen path)

- Recent Dream Field now has a backend quota contract: Premium gets 10 generations per billing cycle, Deeper is unlimited, and cache reuse still applies for exact same sequence + language.
- Recent Dream Field and Period Reflection keep the shared topology-first prompt from `src/ai/reflectiveEssayPrompt.ts`: `oneiros-recent-dream-field-v2` and `oneiros-period-reflection-v2`, both frozen at `2.0.3-phase1`. The shippable path uses metadata-heavy context version `1`; model routing, temperatures, sections, word policy, and retry remain unchanged. Before interpretation, the prompt privately chooses one supported field, parallel/local clusters, or a loose field and must preserve that topology through every section and its exactly one reflective question. A shared stance requires comparable situation → comparable affective stance → comparable response; abstract equivalence and an opening disclaimer cannot substitute for recurrence. Weekly scopes receive week headings; monthly scopes receive month headings; Recent remains a lighter current sequence rather than a miniature monthly essay. Essay cardinality is owned by this surface (exactly one question). The recovered production reflective-question method is not injected into essay requests. Headings stay in English; body and the question use the requested language; hidden essay completion markers are stripped before persistence.
- Context version `1` contributes Core Mode, affects, symbols, symbol stances, landscapes, motifs, relational dynamics, thresholds, central conflicts, Archetypal/Mythic Echo summaries, and a bounded interpretation excerpt. Narrative-first context version `2` still exists in `src/ai/reflectiveEssayContext.ts` only for reproducible research; it is not selected by client or gateway generation.
- Essay length control is semantic-first: Period targets 400–500 words with a 550 hard maximum for 2–4 dreams and 550–650 / 700 for 5+; Recent targets 300–380 / 425. An incomplete or initially over-limit output receives one compact full rewrite. A complete retry is never string-truncated; small tolerance ceilings (575, 725, and 450) are measured and logged without raw essay content.
- Phase 1 is accepted and frozen. The PO treats weak atmospheric affinity in a loose field as a documented ambiguity rather than a blocker: “no sufficiently dense unified field” does not forbid every cross-dream similarity, provided it is not promoted into a dense symbolic or developmental thesis. Phase 2 narrative-first scored `7 PASS / 2 FAIL`; its one permitted Field Map architecture spike then scored manual `2 PASS / 7 FAIL`, failed the parallel-cluster target, and degraded coherent-field sensitivity. The stop rule closes Phase 2 R&D. Phase 1 `2.0.3-phase1` plus context version `1` is the shippable baseline; see `docs/ONEIROS_REFLECTIVE_ESSAYS_FIELD_MAP_SPIKE_REVIEW_2026-08-26.md`.
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
- The premium upsell sheet opened from locked Insights actions keeps enough bottom clearance to scroll cleanly to its final CTA/content.
- Reflections whose extraction metadata is still `pending` are temporarily skipped by Recent Dream Field and Essay inputs; they become eligible when the post-reflection metadata action marks metadata `ready`.

### Online checks

- Pattern generation, including Recent Dream Field, and some remote report fetches use `isOnline()` — offline → user messaging / disabled actions per UI.

## Journal filter stack (`JournalFilterScreen`)

- Wraps `JournalScreen` with `overrideParams` so back returns to insights context; header title reflects symbol/landscape/motif.

## Insights ↔ data dependencies

- Aggregations still use **local dreams** and interpretations, and full pattern metadata remains available to Insights sections: symbols, archetypes, landscapes, affects, motifs, relational dynamics, thresholds, central conflicts, core mode, amplifications, and symbol stances. The accepted Phase 1 essay builder consumes this metadata-heavy context; narrative-first selective context is research-only. Forming Patterns grid counts still use archetype `canonical_label` only and do not include amplifications.
- `display_distillation` is for immediate DreamDetail presentation only; monthly/quarterly reports and recent reflections continue to synthesize from full metadata and interpretation excerpts.
- The new backend gateway assumes remote dream + interpretation data is available and is now the default path for gated premium actions.
- **Regression:** insights empty until user has reflections with extracted fields; changing period changes all section data.
- **Regression:** adding a newly interpreted dream to an existing period updates interpreted counts, strongest patterns, recurring images, motifs, thresholds, and the field summary.
- **Regression:** Recent Dream Field and Essay gateway responses persist to their local caches/reports using the returned scope key, including cached gateway artifacts.

## Calendar + insights

- From Insights → Calendar opens focused date; user can still open dreams and editor from Calendar (see [flows-04-dreams-journal-calendar.md](./flows-04-dreams-journal-calendar.md)).
