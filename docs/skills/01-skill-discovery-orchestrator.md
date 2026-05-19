# Skill Discovery Orchestrator

**Source**: Vercel Labs (`vercel-labs/skills` → `find-skills`)  
**Installs**: 1.6M (Most downloaded globally)  
**Install Command**: `npx skilladd vercel-labs/skills --skill find-skills`

## Purpose
Meta-skill that **automatically detects the best skill to load** for any given task. Analyzes user intent and recommends appropriate skills without explicit requests.

## Your Role
As a PM piloting CarLink without deep coding expertise, this skill ensures Claude automatically selects the right tools for each task — no manual skill management needed.

## Real-World Example
```
You: "I want a roadmap for S3/S4"
  ↓
Skill Discovery detects: [planning, timeline, roadmap]
  ↓
Automatically loads: project-management skills + timeline tools
  ↓
Claude executes with full context
```

## Integration
- Placed at start of Claude's reasoning
- Scans incoming tasks for patterns (security, mobile, backend, etc.)
- Loads complementary skills silently
- No extra work for you

## When to Use
Every session. It's the "smart dispatcher" that keeps your team coordinated.
