-- ============================================================
-- SEED DATA — Run in Supabase SQL Editor AFTER reset.sql
-- Creates demo drivers, campaigns, and assignments
-- Demo driver password: Demo1234!
-- ============================================================

DO $$
DECLARE
  -- Fixed UUIDs for deterministic seed
  u1 uuid := 'a0000001-0000-0000-0000-000000000001';
  u2 uuid := 'a0000002-0000-0000-0000-000000000002';
  u3 uuid := 'a0000003-0000-0000-0000-000000000003';
  u4 uuid := 'a0000004-0000-0000-0000-000000000004';
  u5 uuid := 'a0000005-0000-0000-0000-000000000005';

  d1 uuid := 'b0000001-0000-0000-0000-000000000001';
  d2 uuid := 'b0000002-0000-0000-0000-000000000002';
  d3 uuid := 'b0000003-0000-0000-0000-000000000003';
  d4 uuid := 'b0000004-0000-0000-0000-000000000004';
  d5 uuid := 'b0000005-0000-0000-0000-000000000005';

  c1 uuid := 'c0000001-0000-0000-0000-000000000001';
  c2 uuid := 'c0000002-0000-0000-0000-000000000002';
  c3 uuid := 'c0000003-0000-0000-0000-000000000003';

  pw text := crypt('Demo1234!', gen_salt('bf'));
BEGIN

  -- ============================================================
  -- AUTH USERS
  -- ============================================================
  INSERT INTO auth.users (
    id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at
  ) VALUES
    (u1, 'authenticated', 'authenticated', 'alex.chen@demo.com',    pw, now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
    (u2, 'authenticated', 'authenticated', 'maria.santos@demo.com', pw, now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
    (u3, 'authenticated', 'authenticated', 'jordan.lee@demo.com',   pw, now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
    (u4, 'authenticated', 'authenticated', 'sam.wilson@demo.com',   pw, now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
    (u5, 'authenticated', 'authenticated', 'taylor.brown@demo.com', pw, now(), '{"provider":"email","providers":["email"]}', '{}', now(), now())
  ON CONFLICT (id) DO NOTHING;

  -- ============================================================
  -- PROFILES
  -- ============================================================
  INSERT INTO public.profiles (user_id, role) VALUES
    (u1, 'driver'), (u2, 'driver'), (u3, 'driver'),
    (u4, 'driver'), (u5, 'driver')
  ON CONFLICT (user_id) DO NOTHING;

  -- ============================================================
  -- DRIVERS
  -- ============================================================
  INSERT INTO public.drivers (
    id, user_id, full_name, phone, city, platform,
    vehicle_make, vehicle_model, vehicle_year, license_plate, status
  ) VALUES
    (d1, u1, 'Alex Chen',     '403-555-0101', 'Calgary',   'uber',      'Toyota',   'Camry',   2022, 'ABC-1234', 'active'),
    (d2, u2, 'Maria Santos',  '403-555-0102', 'Calgary',   'lyft',      'Honda',    'Civic',   2021, 'DEF-5678', 'active'),
    (d3, u3, 'Jordan Lee',    '403-555-0103', 'Calgary',   'doordash',  'Hyundai',  'Elantra', 2023, 'GHI-9012', 'assigned'),
    (d4, u4, 'Sam Wilson',    '403-555-0104', 'Calgary',   'uber',      'Ford',     'Fusion',  2020, 'JKL-3456', 'pending'),
    (d5, u5, 'Taylor Brown',  '403-555-0105', 'Calgary',   'instacart', 'Chevrolet','Malibu',  2019, 'MNO-7890', 'pending')
  ON CONFLICT (id) DO NOTHING;

  -- ============================================================
  -- CAMPAIGNS
  -- ============================================================
  INSERT INTO public.campaigns (
    id, name, brand, markets, driver_count, wrap_type,
    status, start_date, end_date, notes
  ) VALUES
    (c1, 'Golden Summer',       'McDonald''s', ARRAY['Calgary', 'Edmonton'], 10, 'full',    'live',      '2026-03-01', '2026-06-30', 'Summer promo for McD''s new lineup'),
    (c2, 'Just Move',           'Nike',        ARRAY['Calgary'],             5,  'partial', 'live',      '2026-04-01', '2026-07-31', 'Spring athletic campaign'),
    (c3, 'Listen Everywhere',   'Spotify',     ARRAY['Calgary', 'Vancouver'],8,  'full',    'scheduled', '2026-05-01', '2026-08-31', 'Podcast awareness push')
  ON CONFLICT (id) DO NOTHING;

  -- ============================================================
  -- DRIVER CAMPAIGNS
  -- ============================================================
  INSERT INTO public.driver_campaigns (
    driver_id, campaign_id, acceptance_status, accepted_at
  ) VALUES
    (d1, c1, 'active',              now() - interval '10 days'),
    (d2, c2, 'active',              now() - interval '5 days'),
    (d3, c3, 'pending_acceptance',  null)
  ON CONFLICT (driver_id, campaign_id) DO NOTHING;

  -- ============================================================
  -- WRAP PHOTOS (vehicle onboarding photos for seeded drivers)
  -- ============================================================
  INSERT INTO public.wrap_photos (driver_id, photo_url, angle) VALUES
    (d1, 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800', 'front'),
    (d1, 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800', 'side'),
    (d2, 'https://images.unsplash.com/photo-1546614042-7df3c24c9e5d?w=800', 'front'),
    (d2, 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=800', 'side'),
    (d3, 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800', 'front'),
    (d4, 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800', 'front'),
    (d4, 'https://images.unsplash.com/photo-1542362567-b07e54358753?w=800', 'rear'),
    (d5, 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800', 'front')
  ON CONFLICT DO NOTHING;

  -- ============================================================
  -- DRIVER LOCATIONS (simulated positions around Calgary)
  -- ============================================================
  INSERT INTO public.driver_locations (driver_id, lat, lng, recorded_at) VALUES
    (d1, 51.0447, -114.0719, now() - interval '20 seconds'),
    (d1, 51.0461, -114.0634, now() - interval '50 seconds'),
    (d2, 51.0534, -114.0812, now() - interval '25 seconds'),
    (d2, 51.0521, -114.0756, now() - interval '55 seconds')
  ON CONFLICT DO NOTHING;

END $$;
