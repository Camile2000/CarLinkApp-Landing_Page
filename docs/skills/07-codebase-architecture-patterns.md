# Codebase Architecture Patterns

**Source**: Mattpocock (`mattpocock/skills` → `improve-codebase-architecture`)  
**Installs**: 131.1K  
**Install Command**: `npx skilladd mattpocock/skills --skill improve-codebase-architecture`

## Purpose
Guide for **code structure & architectural decisions** — how to organize folders, files, modules, dependencies to keep CarLink maintainable as it grows.

## Your Role
As PM, you make decisions like "should this feature be mobile-first or web-first?" This skill helps Claude understand architecture trade-offs so decisions are sound.

## Real-World Example
```
You: "Add invoice generation feature"
  ↓ `codebase-architecture` suggests:
    - Shared logic → `packages/shared/invoices/`
    - Web admin page → `apps/web/admin/invoices/`
    - Mobile view → `apps/mobile/invoices/`
    - Backend → Supabase function + RLS policy
  ↓ Avoids: Code duplication across mobile & web
  ↓ Result: One feature, well-organized, reusable
```

## What It Covers
- Monorepo workspace structure (apps/ + packages/)
- Module organization (features, utilities, types)
- Shared vs. app-specific code
- Import paths & circular dependency prevention
- Component composition & reusability
- Type definitions location (single source of truth)
- Testing folder structure
- Configuration inheritance
- Dependency direction (nothing imports upward)

## Integration with CarLink
- `apps/mobile/src/features/*` (feature-based structure)
- `apps/web/app/admin/*` (Next.js App Router)
- `packages/shared/src/*` (centralized types, validators, clients)
- `.github/CODEOWNERS` (enforces review by owners)

## When to Use
When adding new features or refactoring. It's your "blueprint" for clean growth.
