-- ============================================================
-- ROLES — run this in Supabase SQL Editor
-- ============================================================

-- 1. Profiles table
create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role    text not null default 'driver' check (role in ('admin', 'driver')),
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

-- Users can read their own profile
create policy "User reads own profile" on public.profiles
  for select using (auth.uid() = user_id);

-- Users can insert their own profile (on signup)
create policy "User inserts own profile" on public.profiles
  for insert with check (auth.uid() = user_id);

-- 2. Helper function — get current user's role (used in RLS policies)
create or replace function public.current_user_role()
returns text as $$
  select role from public.profiles where user_id = auth.uid()
$$ language sql security definer stable;

-- 3. Drop old permissive read policies, replace with role-aware ones

-- drivers
drop policy if exists "Authenticated users read all drivers" on public.drivers;
create policy "Admins read all drivers" on public.drivers
  for select using (public.current_user_role() = 'admin');

create policy "Driver reads own row" on public.drivers
  for select using (auth.uid() = user_id);

-- campaigns
drop policy if exists "Authenticated users read campaigns" on public.campaigns;
create policy "Admins read all campaigns" on public.campaigns
  for select using (public.current_user_role() = 'admin');

create policy "Drivers read assigned campaigns" on public.campaigns
  for select using (
    id in (
      select campaign_id from public.driver_campaigns
      where driver_id in (
        select id from public.drivers where user_id = auth.uid()
      )
    )
  );

-- admin can insert/update campaigns
create policy "Admins write campaigns" on public.campaigns
  for all using (public.current_user_role() = 'admin');

-- driver_campaigns
drop policy if exists "Authenticated users read driver_campaigns" on public.driver_campaigns;
create policy "Admins read all driver_campaigns" on public.driver_campaigns
  for select using (public.current_user_role() = 'admin');

create policy "Driver reads own assignments" on public.driver_campaigns
  for select using (
    driver_id in (select id from public.drivers where user_id = auth.uid())
  );

-- admin can write driver_campaigns
create policy "Admins write driver_campaigns" on public.driver_campaigns
  for all using (public.current_user_role() = 'admin');

-- wrap_photos
drop policy if exists "Authenticated users read wrap_photos" on public.wrap_photos;
create policy "Admins read all wrap_photos" on public.wrap_photos
  for select using (public.current_user_role() = 'admin');

-- driver_locations
drop policy if exists "Authenticated users read locations" on public.driver_locations;
create policy "Admins read all locations" on public.driver_locations
  for select using (public.current_user_role() = 'admin');

-- admin can update driver status
create policy "Admins update drivers" on public.drivers
  for update using (public.current_user_role() = 'admin');

-- 4. Set YOUR admin account
-- Replace the email below with your admin email, then run this:
update public.profiles
  set role = 'admin'
  where user_id = (
    select id from auth.users where email = 'YOUR_ADMIN_EMAIL_HERE'
  );
