# Supabase Backend Client

**Source**: Supabase (`supabase/agent-skills` → `supabase`)  
**Installs**: 76.3K  
**Install Command**: `npx skilladd supabase/agent-skills --skill supabase`

## Purpose
Complete Supabase integration guide — authentication, database queries, realtime subscriptions, storage buckets, edge functions, webhooks.

## Your Role
Supabase is your entire backend. This skill bridges your code to the Supabase platform — signup, login, fetch data, upload files, listen for live updates.

## Real-World Example
```
Conductor signup flow:
  1. Form (email, password, phone) → sent to Supabase Auth
  2. Supabase validates & creates user account
  3. User profile auto-created in RLS-protected table
  4. Session token returned → stored in app
  5. Conductor now logged in → can fetch own devis via RLS policy

Garage dashboard:
  1. Admin logs in → fetches their suspended/active status
  2. Realtime subscription watches for new quote requests
  3. Photo upload → goes to `garage-photos` bucket with RLS
  4. Webhook fires on quote creation → sends notification email
```

## What It Covers
- `supabase.auth.signUp/signIn/signOut` (authentication)
- `supabase.from('table').select/insert/update/delete` (CRUD)
- `.on('INSERT', ...)` (realtime subscriptions)
- Storage bucket operations (upload, download, delete)
- Edge functions (serverless logic)
- Webhooks (events to external services)
- RLS policies verification
- Connection pooling & performance

## Integration with CarLink
- `packages/shared/src/supabase/client.ts` (centralized client)
- `apps/mobile` & `apps/web` (use shared client)
- `supabase/migrations/` (schema versioning)
- Environment variables (URL + anon key)

## When to Use
Every backend interaction. It's your "backend connector."
