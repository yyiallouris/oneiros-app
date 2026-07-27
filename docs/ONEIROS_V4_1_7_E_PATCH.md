# Oneiros v4.1.7-E / E.1.1 — FREEZE

Three systemic layers (E) + deterministic language commit gate (E.1.1).  
Hero D.1, myth C.1.1, schema 12, one-call architecture unchanged.

## Status (frozen 2026-07-27)

```text
production_status: accepted_with_known_residuals
prompt_version: 4.1.7-E.1
archetype_catalog_version: 1.6.0
schema_version: 12
```

**Deploy approved after:**

1. Patch E calibration accepted (86.1% → E.1.1 88.9% contract)
2. Committed language match 72/72
3. A-vs-B clarification: repair + preserve (never drop)
4. Forced-invalid preservation suite pass
5. Local repair payload validation + faithful semantic repair contract pass

Canonical runs:

- Patch E: `tmp/global-archetype-benchmark-2026-07-27T13-25-17-779Z/`
- E.1.1: `tmp/global-archetype-benchmark-2026-07-27T15-16-35-686Z/`

| Metric (E.1.1) | Result |
|---|---|
| Contract pass | **64/72 = 88.9%** |
| Committed language | **100%** |
| Catalog | **52/59 = 88.1%** |
| Naturalistic | **12/13 = 92.3%** |
| Macro P / R | **95.3% / 92.1%** |
| Persona precision | **0.80** |
| Empty-dream accuracy | **77.8%** |

### Known selection residuals (not language)

- Mixed Shadow/Double competition
- `M_self_sacred` Self vs Sacred Marriage
- Persona FP residual (`P_double_b`)
- Hero/Sisyphus D.1 residual when present

## E.1.1 contract (frozen)

```text
resolve language → generate → validate before commit
→ field-scoped repair (freeze semantic structure)
→ local validate Record<ExactPath, NonEmptyString>
→ merge + fingerprint
→ commit only if language OK AND structure preserved
```

- **A:** repair mismatched strings; preserve packet
- **B forbidden:** drop field/archetype/myth
- Gateway validates repair payload locally even when proxy uses `skip_structured_validation`
- Repair faithfully: preserve claims, images, relationships, negations, modality, names, numbers; change only natural language

Tests:

- `__tests__/dreamOutputLanguage.test.ts`
- `__tests__/dreamOutputLanguage.forcedInvalid.e11.test.ts`
- `__tests__/dreamOutputLanguage.faithfulRepair.e11.test.ts`

## Deploy

```bash
supabase functions deploy openai-proxy              # skip_structured_validation (done)
supabase functions deploy ai-entitlements-gateway   # language gate + local repair validate
```

Do not change archetype selection, catalog, schema, Hero D.1, myth layer, or candidate limit without a new patch.
