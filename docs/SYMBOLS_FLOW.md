# How we handle Symbols (after recent updates)

## Summary

Symbols come **from the interpretation text** (prose-based extraction), not from a separate AI call. The chips are a **strict reflection** of the text the user read.

---

## 1. Extraction sources

### Primary: `extractSymbolsAndArchetypes(aiResponse)`
- **Input:** The AI interpretation text
- **Source:** Only the **## Key Symbols** section — takes bullets from there
- **Limit:** Max **4 symbols** (`MAX_SYMBOL_CHIPS = 4`)
- **Filter:** Removes affect words (worry, fear, sadness, etc.)

### Fallback: `extractDreamSymbolsAndArchetypes(dream)`
- Used **only if** prose extraction returns empty
- Separate AI call (JSON extraction) on dream content
- Same limit: max 4 symbols

---

## 2. Flow in screens

### DreamDetailScreen & InterpretationChatScreen

```
1. AI returns aiResponse (interpretation text)
2. proseExtracted = extractSymbolsAndArchetypes(aiResponse)
3. If proseExtracted has symbols or archetypes:
   → symbols = proseExtracted.symbols
   → archetypes = filterArchetypesForDisplay(proseExtracted.archetypes, aiResponse)
4. Otherwise (fallback):
   → extracted = extractDreamSymbolsAndArchetypes(dream)
   → symbols = extracted.symbols
   → archetypes = filterArchetypesForDisplay(extracted.archetypes, aiResponse)
5. Save: interpretation.symbols, interpretation.archetypes
```

---

## 3. Limits & rules

| | Symbols | Archetypes |
|---|---------|------------|
| **Max chips** | 4 | 2 |
| **Source** | Key Symbols section | Archetypal Dynamics section |
| **Filter** | Affect words removed | Self-suppression if false center etc. |

---

## 4. Where they appear

- **Dream card (symbolsCard):** `dream.symbols`, `dream.archetypes`
- **Interpretation card:** `interpretation.symbols`, `interpretation.archetypes` ("Main symbols")

*Note:* The dream is not automatically updated with symbols/archetypes when we save the interpretation. The chips you see come from the interpretation object.

---

## 5. AI prompts (consistency)

- **INTERPRETATION_FORMAT_PROMPT:** "Key Symbols (STRICT 3–4 bullets max)"
- **EXTRACTION_SYSTEM_PROMPT:** "3–5 key symbolic elements max, prefer 2–3 most psychologically active"

---

## 6. Files involved

- `src/services/ai.ts`: `extractSymbolsAndArchetypes`, `extractDreamSymbolsAndArchetypes`, `filterArchetypesForDisplay`, `MAX_SYMBOL_CHIPS`
- `src/screens/DreamDetailScreen.tsx`: `generateInitialAIInterpretation`, `handleUpdateInterpretation`
- `src/screens/InterpretationChatScreen.tsx`: initial interpretation flow
