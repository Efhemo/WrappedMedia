-- Fix driver RLS — split 'for all' into explicit per-operation policies
-- Run in Supabase SQL Editor

drop policy if exists "Driver owns their row" on public.drivers;

create policy "Driver inserts own row" on public.drivers
  for insert with check (auth.uid() = user_id);

create policy "Driver reads own row" on public.drivers
  for select using (auth.uid() = user_id);

create policy "Driver updates own row" on public.drivers
  for update using (auth.uid() = user_id);
