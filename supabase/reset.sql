-- ============================================================
-- FULL RESET — run AFTER dropping all tables
-- ============================================================

-- ============================================================
-- PROFILES
-- ============================================================
create table public.profiles (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  role       text not null default 'driver' check (role in ('admin', 'driver')),
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "User reads own profile" on public.profiles
  for select using (auth.uid() = user_id);

create policy "User inserts own profile" on public.profiles
  for insert with check (auth.uid() = user_id);

-- Helper: get current user role (placed here so profiles table exists)
create or replace function public.current_user_role()
returns text as $$
  select role from public.profiles where user_id = auth.uid()
$$ language sql security definer stable;

-- ============================================================
-- DRIVERS
-- ============================================================
create table public.drivers (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references auth.users(id) on delete cascade not null unique,
  full_name     text not null,
  phone         text,
  city          text,
  platform      text check (platform in ('uber','lyft','doordash','skip','instacart')),
  vehicle_make  text,
  vehicle_model text,
  vehicle_year  int,
  license_plate text,
  status        text not null default 'pending'
                  check (status in ('pending','assigned','active','inactive')),
  created_at    timestamptz default now()
);

alter table public.drivers enable row level security;

create policy "Driver owns their row" on public.drivers
  for all using (auth.uid() = user_id);

create policy "Admins read all drivers" on public.drivers
  for select using (public.current_user_role() = 'admin');

create policy "Admins update drivers" on public.drivers
  for update using (public.current_user_role() = 'admin');

-- ============================================================
-- DRIVER LOCATIONS
-- ============================================================
create table public.driver_locations (
  id          uuid primary key default gen_random_uuid(),
  driver_id   uuid references public.drivers(id) on delete cascade not null,
  lat         float not null,
  lng         float not null,
  recorded_at timestamptz default now()
);

alter table public.driver_locations enable row level security;

create policy "Driver inserts own location" on public.driver_locations
  for insert with check (
    driver_id in (select id from public.drivers where user_id = auth.uid())
  );

create policy "Admins read all locations" on public.driver_locations
  for select using (public.current_user_role() = 'admin');

-- ============================================================
-- CAMPAIGNS
-- ============================================================
create table public.campaigns (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  brand        text not null,
  markets      text[] default '{}',
  driver_count int default 0,
  wrap_type    text check (wrap_type in ('full','partial')),
  status       text not null default 'scheduled'
                 check (status in ('scheduled','live','completed')),
  start_date   date,
  end_date     date,
  notes        text,
  created_at   timestamptz default now()
);

alter table public.campaigns enable row level security;

create policy "Admins manage campaigns" on public.campaigns
  for all using (public.current_user_role() = 'admin');

-- ============================================================
-- DRIVER CAMPAIGNS
-- ============================================================
create table public.driver_campaigns (
  driver_id         uuid references public.drivers(id) on delete cascade,
  campaign_id       uuid references public.campaigns(id) on delete cascade,
  acceptance_status text not null default 'pending_acceptance'
                      check (acceptance_status in ('pending_acceptance','active','completed')),
  wrap_photo_url    text,
  assigned_at       timestamptz default now(),
  accepted_at       timestamptz,
  primary key (driver_id, campaign_id)
);

alter table public.driver_campaigns enable row level security;

create policy "Admins manage driver_campaigns" on public.driver_campaigns
  for all using (public.current_user_role() = 'admin');

create policy "Driver reads own assignments" on public.driver_campaigns
  for select using (
    driver_id in (select id from public.drivers where user_id = auth.uid())
  );

create policy "Driver updates own assignment" on public.driver_campaigns
  for update using (
    driver_id in (select id from public.drivers where user_id = auth.uid())
  );

-- NOW safe to add this policy — driver_campaigns exists
create policy "Drivers read assigned campaigns" on public.campaigns
  for select using (
    id in (
      select campaign_id from public.driver_campaigns
      where driver_id in (
        select id from public.drivers where user_id = auth.uid()
      )
    )
  );

-- ============================================================
-- WRAP PHOTOS
-- ============================================================
create table public.wrap_photos (
  id          uuid primary key default gen_random_uuid(),
  driver_id   uuid references public.drivers(id) on delete cascade not null,
  photo_url   text not null,
  angle       text check (angle in ('front','side','rear')),
  uploaded_at timestamptz default now()
);

alter table public.wrap_photos enable row level security;

create policy "Driver inserts own photos" on public.wrap_photos
  for insert with check (
    driver_id in (select id from public.drivers where user_id = auth.uid())
  );

create policy "Admins read all photos" on public.wrap_photos
  for select using (public.current_user_role() = 'admin');

-- ============================================================
-- SET YOUR ADMIN ACCOUNT
-- Replace the email below with your admin email
-- ============================================================
insert into public.profiles (user_id, role)
values (
  (select id from auth.users where email = 'YOUR_ADMIN_EMAIL_HERE'),
  'admin'
);
