# Supabase Migrations

This directory contains SQL migration files for the Supabase database.

## Current Migrations

### `20260126143400_enable_rls_policies.sql`
Enables Row Level Security (RLS) on the `dreams` and `interpretations` tables and creates policies to ensure users can only access their own data.

**Security Policies:**
- Users can only SELECT, INSERT, UPDATE, and DELETE their own dreams
- Users can only SELECT, INSERT, UPDATE, and DELETE their own interpretations
- All policies use `auth.uid() = user_id` to enforce ownership

### `20260511120000_add_display_distillation_to_interpretations.sql`
Adds nullable `display_distillation jsonb` to `interpretations`.

This stores the immediate user-facing DreamDetail summary generated during metadata extraction: dream essence, visible anchors, main tension, and movement line. Long-term pattern metadata remains in the existing columns.

### `20260710130000_create_billing_domain.sql`
Creates the backend billing / entitlement domain:

- `billing_accounts`
- `subscription_entitlements`
- `subscription_transactions`
- `billing_webhook_events`
- `quota_buckets`
- `quota_events`
- `ai_generation_artifacts`

Also extends:

- `interpretations` with reflection origin and follow-up reply counters
- `user_settings` with `time_zone`

Adds SQL RPC helpers for:

- `billing_ensure_account`
- `billing_reserve_quota`
- `billing_commit_quota`
- `billing_release_quota`
- `billing_subscription_status`

### `20260724120000_add_interpretation_metadata_status.sql`
Adds extraction status fields to `interpretations`:

- `metadata_status` (`pending`, `ready`, `failed`)
- `metadata_generated_at`
- `metadata_error_code`

This lets the gateway commit and return the user-facing reflection before background extraction finishes, while Insights can skip only still-pending metadata.

### `20260725100000_add_metadata_extraction_claims.sql`
Adds `interpretation_metadata_extraction_jobs` plus `billing_claim_metadata_extraction` / `billing_finish_metadata_extraction`.

This is a server-side lease for `dream_metadata_extract`, preventing overlapping app retries or multiple Edge isolates from starting duplicate OpenAI metadata calls for the same pending interpretation. Stuck jobs can be reclaimed after the lease expires.

Implementation note: `interpretation_metadata_extraction_jobs.interpretation_id` is `text` because `interpretations.id` is an app-generated text id, not a UUID.

### `20260725120000_amplifications_to_jsonb.sql`
Converts `interpretations.amplifications` from `text[]` to `jsonb`.

Mythic Echoes are rare interpretive enrichment objects. Current shape: `{ title, tradition, resonance, divergence, evidence[], confidence }`. Legacy strings, `echo_name`, older `{ dream_image, echo, resonance }` objects, and legacy `difference` keys are still normalized by app readers to canonical `divergence`. Prefer empty arrays; not used in Forming Patterns aggregation.

### `20260725130000_archetypes_to_jsonb.sql`
Converts `interpretations.archetypes` from `text[]` to `jsonb`.

Uses a two-step transform (Postgres forbids subqueries in `ALTER ... USING`): `to_jsonb(text[])` first, then an `UPDATE` that wraps bare JSON strings into `{ canonical_label, expression, resonance, evidence[] }`. App readers also normalize legacy strings / `display_label`. Current readers may additionally preserve optional audit fields such as `archetype_id`, `archetype_catalog_version`, `evidence_ids`, and `legacy_source_id` when older ontology rows are canonicalized (for example `terrible_mother` → `mother`). No extra database migration is needed for those fields because the column is already `jsonb`. Insights aggregates `canonical_label`. Prefer 0–2.

### `20260725140000_add_extraction_prompt_versioning.sql`
Adds `extraction_prompt_version` and `extraction_schema_version` to `interpretations`.

Successful metadata extraction stores the current prompt architecture id (`dream-field-map-interpretive-v3.9`, prompt_version `3.9.0`) and schema generation (`4`) so version bumps can selectively reopen ready rows for re-extraction without auto-busting legacy null versions.

### `20260725150000_fix_billing_commit_quota_interpretation_id_text.sql`
Rewrites `billing_commit_quota` so follow-up `interpretation_id` stays **text** (matching `interpretations.id`).

The original billing-domain RPC cast `interpretation_id` to `uuid`, which made `dream_followup_reply` fail at commit with gateway `Failed to commit quota` after the model reply had already been generated. Do not reintroduce `::uuid` casts on interpretation ids.

### `20260727010000_billing_dream_reflection_limit_override.sql`
Adds `billing_paid_dream_reflection_limit(raw)` so paid dream-reflection cycle limits can be overridden via `subscription_entitlements.raw.dream_reflection_limit` (default remains **60**).

`billing_reserve_quota` and `billing_subscription_status` both honor that override and sync the active paid bucket `limit_count`. Use `scripts/sql/grant-test-user-200-dreams.sql` for manual/test grants (currently `yyiallouris@gmail.com` → 200 / month).

## Running Migrations

### Prerequisites

1. Install Supabase CLI:
   ```bash
   npm install -g supabase
   ```

2. Login to Supabase:
   ```bash
   supabase login
   ```

3. Link your project (if not already linked):
   ```bash
   supabase link --project-ref your-project-ref
   ```
   You can find your project ref in your Supabase dashboard URL: `https://supabase.com/dashboard/project/your-project-ref`

### Apply Migrations

To apply all pending migrations to your database:

```bash
supabase db push
```

Or to apply a specific migration:

```bash
supabase migration up
```

### Verify Migrations

After running migrations, verify the policies are active:

1. Go to your Supabase Dashboard
2. Navigate to **Database** → **Policies**
3. You should see policies for both `dreams` and `interpretations` tables

## Migration Safety Checklist

Before adding a foreign key, RPC argument, lock table, or claim table against an existing table:

- Verify the referenced column type from existing migrations and the app's remote mapping code.
- Match the referenced type exactly; do not infer UUID from naming alone.
- Remember that Oneiros app-generated ids such as `dreams.id` and `interpretations.id` are `text`, while auth/billing ids such as `auth.users.id` and billing entity ids are UUIDs.
- For Edge Function migrations, push the database migration before deploying function code that calls newly added RPCs.

### Rollback (if needed)

If you need to rollback a migration:

```bash
supabase migration down
```

## Security Notes

⚠️ **IMPORTANT**: These RLS policies are critical for data security. They ensure that:
- Users cannot access other users' dreams
- Users cannot modify other users' data
- All database operations are automatically filtered by `user_id`

The application code also includes additional security checks, but RLS provides defense-in-depth at the database level.

## Testing RLS Policies

After applying migrations, test that RLS is working:

1. Create two test users in Supabase Auth
2. Create a dream as User A
3. Try to access that dream as User B (should fail)
4. Verify User A can only see their own dreams
