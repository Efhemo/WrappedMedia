-- Run this in your Supabase SQL Editor

-- Drivers table
create table if not exists public.drivers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null unique,
  full_name text not null,
  phone text,
  city text,
  platform text check (platform in ('uber','lyft','doordash','skip','instacart')),
  vehicle_make text,
  vehicle_model text,
  vehicle_year int,
  license_plate text,
  status text not null default 'pending' check (status in ('pending','assigned','active','inactive')),
  created_at timestamptz default now()
);

-- Driver locations (for live map)
create table if not exists public.driver_locations (
  id uuid primary key default gen_random_uuid(),
  driver_id uuid references public.drivers(id) on delete cascade not null,
  lat float not null,
  lng float not null,
  recorded_at timestamptz default now()
);

-- Campaigns
create table if not exists public.campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  brand text not null,
  markets text[] default '{}',
  driver_count int default 0,
  wrap_type text check (wrap_type in ('full','partial')),
  status text not null default 'scheduled' check (status in ('scheduled','live','completed')),
  start_date date,
  end_date date,
  notes text,
  created_at timestamptz default now()
);

-- Driver <-> Campaign assignments
create table if not exists public.driver_campaigns (
  driver_id uuid references public.drivers(id) on delete cascade,
  campaign_id uuid references public.campaigns(id) on delete cascade,
  -- pending_acceptance: assigned by admin, driver hasn't confirmed yet
  -- active: driver uploaded wrap photo, confirmed wrap is on car
  -- completed: campaign ended
  acceptance_status text not null default 'pending_acceptance'
    check (acceptance_status in ('pending_acceptance','active','completed')),
  wrap_photo_url text,         -- uploaded by driver when accepting campaign
  assigned_at timestamptz default now(),
  accepted_at timestamptz,
  primary key (driver_id, campaign_id)
);

-- Wrap photos
create table if not exists public.wrap_photos (
  id uuid primary key default gen_random_uuid(),
  driver_id uuid references public.drivers(id) on delete cascade not null,
  photo_url text not null,
  angle text check (angle in ('front','side','rear')),
  uploaded_at timestamptz default now()
);

-- RLS: enable for all tables
alter table public.drivers enable row level security;
alter table public.driver_locations enable row level security;
alter table public.campaigns enable row level security;
alter table public.driver_campaigns enable row level security;
alter table public.wrap_photos enable row level security;

-- Drivers: users can read/write their own row
create policy "Driver owns their row" on public.drivers
  for all using (auth.uid() = user_id);

-- Driver locations: driver can insert their own
create policy "Driver inserts own location" on public.driver_locations
  for insert with check (
    driver_id in (select id from public.drivers where user_id = auth.uid())
  );

-- Wrap photos: driver can insert their own
create policy "Driver inserts own photos" on public.wrap_photos
  for insert with check (
    driver_id in (select id from public.drivers where user_id = auth.uid())
  );

-- Campaigns: readable by authenticated users (drivers need to see assigned campaign)
create policy "Authenticated users read campaigns" on public.campaigns
  for select using (auth.role() = 'authenticated');

-- Driver campaigns: driver can read their own assignments
create policy "Driver reads own assignments" on public.driver_campaigns
  for select using (
    driver_id in (select id from public.drivers where user_id = auth.uid())
  );

-- Storage: create a bucket called 'wrap-photos' in your Supabase Storage dashboard
-- Then add this policy to allow authenticated uploads:
-- Bucket: wrap-photos | Policy: Allow authenticated uploads
-- INSERT: (auth.role() = 'authenticated')
-- SELECT: true (public reads)
