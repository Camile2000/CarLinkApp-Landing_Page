# GitHub CI Workflows

**Source**: Xixu-me (`xixu-me/skills` → `github-actions-docs`)  
**Installs**: 150K  
**Install Command**: `npx skilladd xixu-me/skills --skill github-actions-docs`

## Purpose
GitHub Actions automation — understand & maintain CI/CD workflows that run on every PR (security audit, lint, typecheck, build).

## Your Role
Every PR you merge triggers a full CI pipeline. This skill helps Claude write & debug workflows so you know exactly what happens between commit and "ready to deploy."

## Real-World Example
```
You push to claude/backend-supabase
  ↓ GitHub Actions triggered
  ↓ Security scan (npm audit, Gitleaks, Semgrep)
  ↓ Lint & Typecheck (ESLint, TypeScript strict)
  ↓ Build (Next.js, Expo)
  ↓ If any step fails → PR blocks merge (good!)
  ↓ You see the error in GitHub UI → Claude fixes it
```

## What It Covers
- Workflow syntax (triggers, jobs, steps)
- Actions (setup, caching, checkout)
- Secrets & environment variables
- Matrix builds (multiple Node versions, platforms)
- Conditional jobs (`if:` statements)
- Artifact uploads & downloads
- Badge status in README

## Integration with CarLink
- `.github/workflows/ci.yml` — main CI pipeline
- `.github/workflows/codeql.yml` — static analysis
- CODEOWNERS rules trigger required reviews
- Branch protection rules enforce CI success

## When to Use
When debugging CI failures or adding new build steps. It's your "build orchestrator."
