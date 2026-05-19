# Expo React Native Dev

**Source**: Vercel (`vercel-labs/agent-skills` → `vercel-react-native-skills`)  
**Installs**: 120.8K  
**Install Command**: `npx skilladd vercel-labs/agent-skills --skill vercel-react-native-skills`

## Purpose
React Native best practices for **mobile Expo development** — navigation, forms, permissions (GPS), camera, image uploads, offline support, performance.

## Your Role
Your conductor app is Expo (iOS + Android from one codebase). This skill ensures it works smooth on real devices, not just in simulators.

## Real-World Example
```
Conductor flow:
  1. Map screen → Request GPS permission → Show garage locations
  2. Tap garage → Open details (images, reviews)
  3. Tap "Request Quote" → Form (vehicle, urgency, photos)
  4. Submit → Upload photos to Storage, create RLS-protected quote
  5. Notification arrives in real-time via Supabase Realtime

All of this = React Native patterns + Supabase integration
```

## What It Covers
- Navigation (React Navigation, deep linking)
- Forms & validation (Zod in `packages/shared`)
- Native APIs (GPS, Camera, Contacts, Notifications)
- Image handling (upload, cache, compression)
- Offline support (sync when reconnected)
- Performance (FlatList optimization, memoization)
- Platform-specific code (iOS vs Android)
- App lifecycle (background, foreground, startup)
- Package management (Expo modules)

## Integration with CarLink
- `apps/mobile/src/features/*` (feature screens)
- `packages/shared/src/validators/` (Zod schemas)
- `packages/shared/src/supabase/` (client & queries)
- Runs on iOS/Android via Expo Go or EAS Build

## When to Use
Every mobile feature. It's your "native mobile expertise."
