# Supabase Migrations

This directory contains SQL migration files for the Supabase database.

## Current Migrations

### `20260126143400_enable_rls_policies.sql`
Enables Row Level Security (RLS) on the `dreams` and `interpretations` tables and creates policies to ensure users can only access their own data.

**Security Policies:**
- Users can only SELECT, INSERT, UPDATE, and DELETE their own dreams
- Users can only SELECT, INSERT, UPDATE, and DELETE their own interpretations
- All policies use `auth.uid() = user_id` to enforce ownership

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
