# Progress Log

## Session 1 — 2026-04-02

### Done
- Researched Wrapped Media (wrappedmedia.ca)
- Reviewed JD — first software dev hire, building from scratch
- Decided on: Expo (mobile) + Next.js (web) + Supabase + TypeScript + Turborepo
- Wireframed all screens (mobile + web)
- Created monorepo skeleton
- Created PLAN.md with full phase breakdown and Supabase schema

### Session 1 Lessons — Monorepo + Expo
- Removed mobile from npm workspace → caused missing hoisted packages (whack-a-mole)
- Final fix: keep mobile in workspace, add `"overrides": { "react": "19.1.0" }` to root package.json
- Forces single React version across all packages — eliminates "Invalid hook call" error
- Added `legacy-peer-deps=true` to root `.npmrc`
- Metro config: `extraNodeModules` pins react/react-native to workspace root copy
- Mobile also needs: react-native-gesture-handler, reanimated, worklets, safe-area-context, screens, expo-linking, @expo/metro-runtime

---

## Session 2 — 2026-04-03

### Done
- Fixed all monorepo React duplication issues
- Mobile app runs on iOS simulator
- Login screen visible

### Up Next
- Phase 3: Driver onboarding (vehicle info, wrap photo upload)

---

_Update this file at the start/end of each session._
