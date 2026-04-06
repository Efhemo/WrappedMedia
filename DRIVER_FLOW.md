# Driver Flow — Wrapped Media

## Overview
Wrapped Media assigns ad wraps to gig economy drivers (Uber, DoorDash, etc).
The driver app handles onboarding, campaign acceptance, and drive tracking.

---

## 1. Onboarding

**Who does it:** New driver signing up for the first time.

### Steps
1. **Register** — name, email, phone, password
2. **Email confirmation** — Supabase sends confirmation email, driver must confirm
3. **Vehicle Info** — platform (Uber/DoorDash/etc), make, model, year, plate, city
4. **Vehicle Photos** — driver uploads photos of their car (front, side, rear)
   - Purpose: admin can assess the vehicle condition before assigning a wrap
   - These are NOT wrap photos — the car is unwrapped at this point
5. **Pending screen** — driver sees "We're reviewing your vehicle" status

> ⚠️ Driver can sign in as soon as email is confirmed — no admin approval gate.
> The pending screen is shown until admin assigns them a campaign.

---

## 2. Admin Assigns Campaign

**Who does it:** Wrapped Media admin via the web dashboard.

### Steps
1. Admin reviews incoming drivers (sees vehicle photos, vehicle details)
2. Admin creates or selects an existing campaign (e.g. "Wendy's Q2 Toronto")
3. Admin assigns one or more approved drivers to the campaign
4. Driver's status moves from `pending` → `assigned`
5. Driver receives a push notification / email: "You've been assigned a campaign!"

---

## 3. Campaign Acceptance (In-App)

**Who does it:** Driver, after receiving campaign assignment notification.

### Steps
1. Driver opens the app → Home screen shows a **campaign card** with status `Pending Acceptance`
2. Driver taps "Accept Campaign" → sees campaign details (brand, wrap type, instructions)
3. Driver taps "Upload Wrap Photo" → uploads photo of wrapped vehicle (front/side/rear)
   - Purpose: confirms the wrap has been physically installed by Wrapped Media
   - This is the actual wrap confirmation photo
4. Admin can see uploaded wrap photos in the dashboard
5. Campaign status moves to `active` for that driver

---

## 4. Active Driving & Tracking

**Who does it:** Driver, during their shift.

### Steps
1. Driver taps "Start Drive" on Home screen
2. App begins GPS tracking — pings location every 30s to Supabase
3. Admin live map shows active drivers as dots
4. Driver taps "End Drive" — tracking stops, session is saved
5. Home screen shows earnings + hours for the month

---

## Driver Status State Machine

```
registered (email unconfirmed)
    ↓  confirms email
onboarding (vehicle info + photos submitted)
    ↓  admin assigns campaign
assigned (campaign pending acceptance)
    ↓  driver uploads wrap photo
active (driving and being tracked)
    ↓  campaign ends
inactive
```

---

## Campaign Assignment Status (per driver)

```
pending_acceptance  → driver assigned, wrap not yet confirmed
active              → wrap photo uploaded, driver is live
completed           → campaign ended
```

---

## Key Rules
- Driver can log in as soon as email is confirmed (no admin approval gate)
- Vehicle photos (onboarding) = car condition for admin review
- Wrap photos (campaign acceptance) = proof wrap is installed, taken in-app
- A driver can be assigned to one campaign at a time
- GPS tracking only runs while a drive session is active (not passively in background)
