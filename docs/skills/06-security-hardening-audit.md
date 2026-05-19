# Security Hardening Audit

**Source**: Pbakaus/Impeccable (`pbakaus/impeccable` → `harden`)  
**Installs**: 53.3K  
**Install Command**: `npx skilladd pbakaus/impeccable --skill harden`

## Purpose
**Vulnerability detection & app hardening** — scans code for security flaws you won't see (SQL injection, XSS, exposed secrets, weak permissions, missing headers).

## Your Role
You're the Security Engineer. You can't audit code line-by-line, but this skill acts as your "security scanner." It flags what needs fixing before deployment.

## Real-World Example
```
Login form coded without validation
  ↓ `harden` detects: "Missing email format validation"
  ↓ Catches: SQL injection attempt ready to fail
  ↓ Flags: "Password length < 12 chars"
  ↓ Blocks: Merge until fixed

Conductor photo upload without auth check
  ↓ `harden` detects: "No owner verification on file upload"
  ↓ Danger: Conductor A uploads as Conductor B
  ↓ Blocks: Merge
```

## What It Covers
- Input validation & sanitization
- Authentication & authorization checks
- Secret exposure (API keys, tokens, DB credentials)
- SQL/NoSQL injection prevention
- XSS (cross-site scripting) protection
- CSRF tokens
- CORS & HTTPS headers
- File upload validation
- Rate limiting patterns
- Error messages (don't leak info)

## Integration with CarLink
- Runs as part of CI security audit (`npm audit`, Semgrep, Gitleaks)
- Complements `SECURITY.md` checklist §2
- Focuses on code-level hardening (not just infrastructure)

## When to Use
Every PR. It's your "security bouncer" before anything goes to production.
