# Native UI Components

**Source**: Expo (`expo/skills` → `building-native-ui`)  
**Installs**: 41.4K  
**Install Command**: `npx skilladd expo/skills --skill building-native-ui`

## Purpose
Official Expo guide for **native iOS/Android UI components** — animations, gestures, bottom sheets, modals, scrolling, accessibility, platform-specific behavior.

## Your Role
This is the *official* Expo skill (from Expo's creators). It ensures your conductor app feels like a "real" native iOS/Android app, not a web app pretending to be mobile.

## Real-World Example
```
Conductor map screen:
  → Swipe card up = native gesture animation
  → Bottom sheet slides up = smooth gesture-driven animation
  → Garage list scrolls = performant 60fps animation
  → Tap rating = haptic feedback (buzz on device)
  → Dark mode toggle = respects system setting (iOS/Android)

Result: Feels like a professionally built native app
```

## What It Covers
- Native components (View, ScrollView, FlatList, SectionList)
- Gesture handling (swipe, pinch, long-press via React Native Gesture Handler)
- Animations (Animated API, Reanimated)
- Bottom sheets & modals
- Status bar & safe area handling
- Platform-specific styles (iOS vs Android)
- Accessibility (VoiceOver, TalkBack)
- Performance optimization (reconciler, bridge optimization)
- Dark mode & theming
- Haptic feedback & vibration

## Integration with CarLink
- `apps/mobile/src/components/*` (reusable native components)
- `apps/mobile/src/features/*` (screens using native patterns)
- Complements `ui-design-system` (design guidelines)
- Complements `expo-react-native-dev` (navigation & forms)

## When to Use
Every screen in Expo mobile. It's your "native polisher" — the difference between "works" and "feels professional."
