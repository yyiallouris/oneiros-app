# delete-account

Deletes the authenticated user's Oneiros data and then deletes the Supabase Auth user.

Required env:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

The function must be deployed with JWT verification enabled. It resolves the caller from the incoming bearer token, deletes rows with `user_id` from Oneiros-owned tables, then calls the Supabase Auth Admin delete-user endpoint.
