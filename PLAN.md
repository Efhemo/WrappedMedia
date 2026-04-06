# Wrapped Media — Demo App Plan

## Goal
Build a demo app for the Wrapped Media fullstack developer job application.
Show we can build exactly what they described in the JD — from scratch.

## Stack
| Layer | Tech |
|---|---|
| Mobile | Expo (React Native) + TypeScript |
| Web Admin | Next.js 14 + TypeScript + Tailwind CSS |
| Backend | Supabase (Auth, DB, Realtime, Storage) |
| Maps | React Native Maps (mobile) + Mapbox GL JS (web) |
| State | Zustand |
| Forms | React Hook Form + Zod |
| Monorepo | Turborepo |

## Products
1. **Driver Mobile App** (`apps/mobile`) — Expo
2. **Admin Web Dashboard** (`apps/web`) — Next.js
3. **Shared Types/Utils** (`packages/shared`) — TypeScript

---

## Phases & Progress

### Phase 1 — Project Setup ✅
- [x] Create monorepo structure (Turborepo)
- [x] Scaffold `apps/mobile` (Expo + TypeScript)
- [x] Scaffold `apps/web` (Next.js + TypeScript + Tailwind)
- [x] Scaffold `packages/shared` (shared types)
- [x] Add Supabase + dependencies to both apps
- [ ] Configure Supabase project at supabase.com (you do this manually)
- [ ] Copy `.env.local.example` → `.env.local` in web, `.env.example` → `.env` in mobile, fill in keys

### Phase 2 — Auth ✅
- [x] Supabase client setup (mobile + web)
- [x] Zustand auth store (mobile + web)
- [x] Mobile: Login screen + Register screen (step 1)
- [x] Mobile: Expo Router layout with auth guard
- [x] Web: Admin login page
- [x] Web: Sidebar component
- [x] Web: proxy.ts route protection
- [x] Web: AuthProvider client component

### Phase 3 — Driver Onboarding (Mobile) ✅
- [x] Screen 2: Vehicle info form (platform chips, make/model/year/plate/city)
- [x] Screen 3: Wrap photo upload (expo-image-picker → Supabase Storage)
- [x] Screen 4: Pending approval screen
- [x] Save driver record to Supabase `drivers` table
- [x] Save photos to Supabase Storage + `wrap_photos` table
- [x] Smart redirect on login: active → home, pending → pending screen, no record → onboarding

### Phase 4 — Driver Home + GPS Tracking (Mobile)
- [ ] Home dashboard screen (earnings, campaign, status)
- [ ] Active drive screen with live map
- [ ] GPS location ping to Supabase (Realtime)
- [ ] Start/end drive logic

### Phase 5 — Admin Dashboard (Web)
- [ ] Overview page (stats cards)
- [ ] Live map page (driver dots, Mapbox)
- [ ] Driver management page (table, approve/reject)
- [ ] Campaign management page (list + create form)

### Phase 6 — Polish & Demo Prep
- [ ] Seed data (fake drivers, campaigns)
- [ ] Demo flow scripted
- [ ] README with screenshots

---

## Supabase Schema (planned)

### `drivers`
| Column | Type |
|---|---|
| id | uuid (PK) |
| user_id | uuid (FK → auth.users) |
| full_name | text |
| phone | text |
| city | text |
| platform | text (uber/doordash/lyft/skip) |
| vehicle_make | text |
| vehicle_model | text |
| vehicle_year | int |
| license_plate | text |
| status | enum (pending/active/inactive) |
| created_at | timestamp |

### `driver_locations`
| Column | Type |
|---|---|
| id | uuid (PK) |
| driver_id | uuid (FK → drivers) |
| lat | float |
| lng | float |
| recorded_at | timestamp |

### `campaigns`
| Column | Type |
|---|---|
| id | uuid (PK) |
| name | text |
| brand | text |
| markets | text[] |
| driver_count | int |
| wrap_type | enum (full/partial) |
| status | enum (scheduled/live/completed) |
| start_date | date |
| end_date | date |
| notes | text |
| created_at | timestamp |

### `driver_campaigns`
| Column | Type |
|---|---|
| driver_id | uuid (FK) |
| campaign_id | uuid (FK) |
| assigned_at | timestamp |

### `wrap_photos`
| Column | Type |
|---|---|
| id | uuid (PK) |
| driver_id | uuid (FK) |
| photo_url | text |
| angle | text (front/side/rear) |
| uploaded_at | timestamp |
