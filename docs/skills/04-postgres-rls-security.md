# Postgres RLS Security

**Source**: Supabase (`supabase/agent-skills` → `supabase-postgres-best-practices`)  
**Installs**: 175.4K  
**Install Command**: `npx skilladd supabase/agent-skills --skill supabase-postgres-best-practices`

## Purpose
PostgreSQL & Supabase best practices for **secure, optimized database** — schema design, Row-Level Security (RLS) policies, indexes, constraints, grants.

## Your Role
As Security Engineer on this project, this is your foundation. It guides Claude on creating tables, policies, and permissions so conductors can't see each other's data, and suspended garages don't receive requests.

## Real-World Example
```sql
-- Conductor A queries their own devis
SELECT * FROM devis WHERE owner_id = current_user_id;
  ↓ RLS policy allows (owner matches current user)
  
-- Conductor B tries to see Conductor A's devis
SELECT * FROM devis WHERE owner_id = 'A';
  ↓ RLS policy BLOCKS (not the current user)
```

## What It Covers
- Table schema design (constraints, types)
- Row-Level Security (RLS) policies
- Column-level security
- Indexes & query optimization
- Foreign key relationships
- Grant statements (GRANT SELECT/INSERT/UPDATE/DELETE)
- Performance monitoring

## Integration with CarLink
- `supabase/migrations/` — every schema change uses this
- `supabase/policies/` — RLS rules documented
- Database types in `packages/shared/src/types.ts`

## When to Use
**Every database migration**. It's non-negotiable per CLAUDE.md §8.
