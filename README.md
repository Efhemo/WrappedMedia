# Wrapped Media — Full-Stack Demo

A full-stack demo for [Wrapped Media](https://wrappedmedia.ca), an out-of-home advertising platform that wraps gig-economy vehicles with brand ads.

Built as a job application demo for the Full-Stack Developer role.

> **For the Wrapped Media team:** See [DEMO.md](./DEMO.md) for the demo guide, credentials, and walkthrough.

---

## What's in the box

| App | Stack | Purpose |
|-----|-------|---------|
| `apps/mobile` | Expo / React Native / TypeScript | Driver-facing app — onboarding, campaign acceptance, GPS tracking |
| `apps/web` | Next.js 16 / TypeScript / Tailwind CSS | Admin dashboard — driver management, campaign CRUD, live map |
| `packages/shared` | TypeScript | Shared types used by both apps |
| Backend | Supabase | Auth, Postgres DB, Storage, RLS |

---

## Features

### Mobile (Driver App)
- Email sign-up and login
- 3-step onboarding: personal info → vehicle info → vehicle photos
- Pending review screen while admin evaluates the application
- Campaign assignment notification with accept flow (upload wrap confirmation photo)
- Live GPS tracking screen — pings location every 30 seconds while driving
- Pull-to-refresh home screen showing campaign status

### Web (Admin Dashboard)
- Admin-only login (role-checked via Supabase `profiles` table)
- Overview dashboard with live stats (drivers, campaigns, statuses)
- Drivers table with vehicle photos, status badges, assign/reject actions
- Campaign management with create form (React Hook Form + Zod)
- Live map (Mapbox GL) showing active driver locations, auto-refreshes every 15 seconds, clears stale pins after 2 minutes

---

## Tech Highlights

- **Monorepo** — Turborepo + npm workspaces; shared types across mobile and web
- **Auth** — Supabase Auth; admin role enforced at login via `profiles.role`
- **RLS** — Row-level security on every table; service role key used server-side for admin reads
- **Live map** — 15-second polling (Supabase free tier compatible, no realtime replication needed)
- **Driver status machine** — `pending → assigned → active → inactive`

---

## Setup

### Prerequisites
- Node.js 20+
- Expo CLI (`npm install -g expo`)
- Supabase account + project
- Mapbox account + public token

### 1. Clone and install
```bash
git clone <repo>
cd wrapped_media
npm install
```

### 2. Supabase setup

1. Create a new Supabase project
2. Go to **SQL Editor** and run `supabase/reset.sql` to create all tables, RLS policies, and helper functions
3. Run `supabase/seed.sql` to populate demo data
4. In **Project Settings → API**, note your:
   - Project URL
   - `anon` public key
   - `service_role` secret key
5. In **Authentication → Providers → Email**, disable "Confirm email"
6. In **Storage**, create a bucket named `wrap-photos` and set it to **Public**
7. Add storage RLS policies (run in SQL Editor):

```sql
-- Allow authenticated users to upload to their own folder
create policy "Driver uploads own photos" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'wrap-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow authenticated users to update their own photos
create policy "Driver updates own photos" on storage.objects
  for update to authenticated
  using (bucket_id = 'wrap-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Public read for all photos
create policy "Public read wrap photos" on storage.objects
  for select using (bucket_id = 'wrap-photos');
```

8. Set your admin account (replace the email):

```sql
insert into public.profiles (user_id, role)
values (
  (select id from auth.users where email = 'your@email.com'),
  'admin'
)
on conflict (user_id) do update set role = 'admin';
```

### 3. Web — environment
Create `apps/web/.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_MAPBOX_TOKEN=pk.your_mapbox_token
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 4. Mobile — environment
Create `apps/mobile/.env` (or update `apps/mobile/lib/supabase.ts` directly):
```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### 5. Run

```bash
# Web (admin dashboard)
cd apps/web
npm run dev
# → http://localhost:3000

# Mobile (driver app)
cd apps/mobile
npx expo start
# Scan QR code with Expo Go on your phone
```

---

## Demo Credentials

### Admin (Web Dashboard)
Login at `http://localhost:3000/login`
> Use whatever email you registered and set as admin in step 2.8 above

### Demo Drivers (Mobile App)
All seeded drivers use password: **`Demo1234!`**

| Email | Status | Notes |
|-------|--------|-------|
| alex.chen@demo.com | Active | Assigned to McDonald's campaign |
| maria.santos@demo.com | Active | Assigned to Nike campaign |
| jordan.lee@demo.com | Assigned | Has pending campaign to accept |
| sam.wilson@demo.com | Pending | Awaiting admin review |
| taylor.brown@demo.com | Pending | Awaiting admin review |

---

## Demo Walkthrough

1. **Admin assigns a driver** — log into the web dashboard, go to Drivers, click "Assign Campaign" on a pending driver
2. **Driver accepts** — log into the mobile app as that driver, see the campaign card, tap "Accept Campaign", upload a photo
3. **Driver goes active** — status updates to Active, "Start Drive" button appears
4. **GPS tracking** — tap "Start Drive" on mobile, switch to the web Live Map tab — pin appears within 15 seconds
5. **End drive** — tap "End Drive" on mobile, pin disappears from the map within 2 minutes

---

## Project Structure

```
wrapped_media/
├── apps/
│   ├── mobile/               # Expo React Native app
│   │   ├── app/
│   │   │   ├── (auth)/       # Login, register, onboarding, pending
│   │   │   └── (app)/        # Home, drive, accept-campaign
│   │   ├── lib/supabase.ts
│   │   └── store/auth.ts
│   └── web/                  # Next.js admin dashboard
│       └── src/
│           ├── app/
│           │   ├── login/
│           │   └── (admin)/  # Dashboard, drivers, campaigns, map
│           ├── components/
│           └── lib/
├── packages/shared/          # Shared TypeScript types
└── supabase/
    ├── reset.sql             # Full schema + RLS
    └── seed.sql              # Demo data
```
