# Test Driven Quality

**Source**: Mattpocock (`mattpocock/skills` → `tdd`)  
**Installs**: 127.2K  
**Install Command**: `npx skilladd mattpocock/skills --skill tdd`

## Purpose
**Test Driven Development (TDD)** — write tests *before* code to guarantee features work correctly in all scenarios (happy path + edge cases + errors).

## Your Role
You don't code, so you trust Claude blindly. TDD flips that: every feature is *proven to work* before merge. You get confidence + safety without understanding the code.

## Real-World Example
```
Feature: "Conductors can request a quote from a garage"

Test 1: Happy path
  → Conductor A submits form → Quote created → Notification sent ✅

Test 2: Conductor has no vehicles
  → Form disables "submit" button → Shows error ✅

Test 3: Garage is suspended
  → Quote blocked → Error message "Garage not accepting quotes" ✅

Test 4: Network fails mid-submit
  → Form shows "Retry" button → State preserved ✅

All tests pass → Feature is solid
```

## What It Covers
- Unit tests (functions, hooks, utilities)
- Integration tests (API calls, RLS policies)
- E2E tests (full user flows in Expo/web)
- Test structure (arrange-act-assert)
- Mocking (databases, API calls, timers)
- Edge cases & error scenarios
- Test coverage metrics
- Continuous testing (CI on every PR)

## Integration with CarLink
- `apps/mobile/__tests__/` (Expo test suite)
- `apps/web/__tests__/` (Next.js test suite)
- `packages/shared/__tests__/` (validator tests, client tests)
- CI runs `npm test` before allowing merge

## When to Use
**Every feature**. TDD ensures features are bulletproof before you ship.

## Why It Matters for You
- Reduces surprises in production
- Proves Claude's code works
- Speeds up debugging (tests pinpoint the bug)
- Documents "how features should work"
