# Wrapped Media — Demo Guide

**Prepared by:** Femi Adegbite
**Role applied for:** Full-Stack Developer
**Date:** April 2026

---

## Overview

This is a full-stack demo of the core product described in the Wrapped Media job description — a platform for managing gig-economy drivers who carry brand advertising wraps on their vehicles.

The demo consists of two applications:

| Application               | Access                          |
| ------------------------- | ------------------------------- |
| **Admin Dashboard** (web) | Deployed on Vercel — link below |
| **Driver App** (mobile)   | Scan QR code below with Expo Go |

Both apps share a live Supabase backend. Any action you take in one is instantly reflected in the other.

---

## How to Access

### Admin Dashboard (Web)

> **URL:** `https://your-vercel-url.vercel.app`

Login with:

```
Email:    admin@wrappedmedia.ca
Password: (share separately)
```

No installation required — works in any browser.

---

### Driver App (Mobile)

**Step 1** — Install the free **Expo Go** app on your phone:

- iPhone: [App Store → search "Expo Go"](https://apps.apple.com/app/expo-go/id982107779)
- Android: [Play Store → search "Expo Go"](https://play.google.com/store/apps/details?id=host.exp.exponent)

**Step 2** — Scan this QR code or open the link below:

> **Link:** `exp://your-tunnel-url` _(see QR code in attached image)_

**Step 3** — Log in with any demo driver account:

| Name         | Email                 | Password  | Status                                      |
| ------------ | --------------------- | --------- | ------------------------------------------- |
| Alex Chen    | alex.chen@demo.com    | Demo1234! | Active — driving McDonald's campaign        |
| Maria Santos | maria.santos@demo.com | Demo1234! | Active — driving Nike campaign              |
| Jordan Lee   | jordan.lee@demo.com   | Demo1234! | Assigned — has a campaign waiting to accept |
| Sam Wilson   | sam.wilson@demo.com   | Demo1234! | Pending — awaiting admin review             |
| Taylor Brown | taylor.brown@demo.com | Demo1234! | Pending — awaiting admin review             |

---

## What to Test

The platform covers the full lifecycle of a driver from sign-up to active campaign. Below are the key flows to explore.

---

### Flow 1 — Admin reviews and assigns a driver

1. Log into the **Admin Dashboard**
2. Click **Drivers** in the sidebar
3. Find **Sam Wilson** or **Taylor Brown** (status: Pending)
4. Click **Assign Campaign** → select a campaign → click Assign
5. The driver's status immediately changes to **Assigned**
6. Log into the **Driver App** as that driver — they'll see an "Action Required" card

---

### Flow 2 — Driver accepts a campaign

1. Log into the **Driver App** as **Jordan Lee** (or the driver you just assigned)
2. On the home screen, tap **Accept Campaign**
3. Upload or take a photo of the wrapped vehicle
4. Tap **Confirm & Activate**
5. The driver's status changes to **Active** and a green "Start Drive" button appears
6. Switch to the **Admin Dashboard → Drivers** — the status update is live

---

### Flow 3 — Live GPS tracking

1. Log into the **Driver App** as **Alex Chen** or **Maria Santos** (status: Active)
2. Tap **Start Drive**
3. The app begins tracking GPS and pings location every 30 seconds
4. Open the **Admin Dashboard → Live Map**
5. The driver's pin appears on the map within 15 seconds
6. Back in the app, tap **End Drive**
7. The pin disappears from the map within 2 minutes (staleness detection)

---

### Flow 4 — New driver sign-up (full onboarding)

You can also register a brand new driver to test the full onboarding flow:

1. Open the **Driver App** and tap **Create account**
2. Fill in personal details → vehicle details → upload at least 2 vehicle photos
3. The app lands on the **Pending** screen
4. Switch to the **Admin Dashboard → Drivers** — the new driver appears immediately
5. Assign them a campaign (Flow 1 above) to continue

---

## Feature Summary

### Admin Dashboard

- **Overview** — live stats: total drivers, active drivers, pending reviews, live campaigns
- **Drivers** — full driver table with vehicle details, onboarding photos, status badges, and inline assign/reject actions
- **Campaigns** — create and manage ad campaigns (brand, markets, wrap type, dates, driver targets)
- **Live Map** — Mapbox-powered real-time driver location map with 15-second polling and auto-clearing stale pins

### Driver App

- Email sign-up and login
- 3-step onboarding: personal info → vehicle info → vehicle photos
- Pending screen while under review
- Campaign assignment card with accept flow (wrap confirmation photo upload)
- Live GPS tracking screen with elapsed timer and ping status
- Pull-to-refresh home screen

---

## Tech Stack

| Layer        | Technology                                    |
| ------------ | --------------------------------------------- |
| Mobile       | Expo / React Native / TypeScript              |
| Web          | Next.js 16 / TypeScript / Tailwind CSS        |
| Backend      | Supabase (Auth, Postgres, Storage)            |
| Map          | Mapbox GL JS                                  |
| Monorepo     | Turborepo + npm workspaces                    |
| Shared types | Custom TypeScript package (`@wrapped/shared`) |
| Forms        | React Hook Form + Zod                         |
| State        | Zustand                                       |

### Architecture notes

- **RLS everywhere** — every Supabase table has row-level security. Drivers can only read/write their own rows. The admin dashboard uses a server-side service role key that bypasses RLS for admin operations.
- **No real-time subscription needed** — the live map uses 15-second polling, which works on the Supabase free tier without enabling replication.
- **Shared types** — the `@wrapped/shared` package defines `Driver`, `Campaign`, `WrapAngle` etc., used by both mobile and web to keep the data model consistent.

---

## Source Code

> GitHub: `https://github.com/your-username/wrapped-media-demo`

The `supabase/` folder contains:

- `reset.sql` — full schema with all tables and RLS policies (run once to set up a fresh project)
- `seed.sql` — demo data (the 5 drivers, 3 campaigns, and assignments above)

---

_Questions? Reach out at femiadegbite@email.com_
