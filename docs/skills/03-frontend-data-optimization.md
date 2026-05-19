# Frontend Data Optimization

**Source**: Vercel (`vercel-labs/agent-skills` → `vercel-react-best-practices`)  
**Installs**: 410.2K  
**Install Command**: `npx skilladd vercel-labs/agent-skills --skill vercel-react-best-practices`

## Purpose
React best practices for **smooth data flow** between Supabase (backend) and screens (web admin + mobile Expo) — state management, caching, loading states, error handling.

## Your Role
The "fluidity" of your app lives here. A conductor waiting 5 seconds for devis to load = bad UX. This skill optimizes the backend↔frontend bridge.

## Real-World Example
```
Conductor opens "My Quotes" screen
  ↓ Supabase fetch triggered
  ↓ Loading spinner shows (not blank screen)
  ↓ Data arrives & animates in
  ↓ If connection fails, graceful error + retry button
  ↓ User experience = smooth, not janky
```

## What It Covers
- State management (React hooks, Context, Redux patterns)
- Data fetching & caching strategies
- Loading/skeleton states
- Error handling & user feedback
- Performance optimization (memoization, lazy loading)
- TypeScript for data flows

## Integration with CarLink
- `apps/web` (admin dashboard) ← React queries
- `apps/mobile` (Expo) ← Supabase realtime subscriptions
- `packages/shared` ← shared hooks & data management

## When to Use
Every screen that fetches data from Supabase. It's your "smooth experience" guarantee.
