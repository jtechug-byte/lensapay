-- =========================================================
-- LensaPay Uganda - Supabase Database Schema & Storage Setup
-- =========================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. USERS TABLE
create table if not exists public.users (
  id uuid primary key default uuid_generate_v4(),
  full_name text not null,
  phone text unique not null,
  password_hash text not null,
  balance numeric not null default 0,
  package_id text references public.packages(id) on delete set null,
  package_start timestamp with time zone,
  package_expiry timestamp with time zone,
  free_trial_used boolean not null default false,
  role text not null default 'user',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Ensure role column exists if table was previously created
alter table public.users add column if not exists role text not null default 'user';

-- Set Takia Namuddu (0791388644) as admin and all others as user
update public.users set role = 'user' where role is null;
update public.users set role = 'admin' where phone like '%791388644%';


-- 2. PACKAGES TABLE
create table if not exists public.packages (
  id text primary key,
  name text not null,
  price numeric not null,
  per_photo numeric not null,
  per_day numeric not null,
  validity_days integer not null default 180,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Seed Packages (VIP Option B Final)
insert into public.packages (id, name, price, per_photo, per_day, validity_days)
values 
  ('starter', 'Starter VIP', 20000, 67, 335, 180),
  ('bronze', 'Bronze VIP', 100000, 333, 1665, 180),
  ('silver', 'Silver VIP', 500000, 1667, 8335, 180),
  ('gold', 'Gold VIP', 1000000, 3333, 16665, 180),
  ('platinum', 'Platinum VIP', 2500000, 8333, 41665, 180),
  ('diamond', 'Diamond VIP', 5000000, 16667, 83335, 180)
on conflict (id) do update set
  price = excluded.price,
  per_photo = excluded.per_photo,
  per_day = excluded.per_day;

-- 3. PHOTOS TABLE
create table if not exists public.photos (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  image_url text not null,
  status text not null default 'pending', -- pending, approved, rejected
  earning_amount numeric not null default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  approved_at timestamp with time zone
);

-- Index for counting today's user uploads quickly
create index if not exists idx_photos_user_created on public.photos (user_id, created_at);

-- 4. PAYMENTS TABLE
create table if not exists public.payments (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  package_id text not null,
  amount numeric not null,
  transaction_id text not null,
  screenshot_url text not null,
  status text not null default 'pending', -- pending, approved, rejected
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. WITHDRAWALS TABLE
create table if not exists public.withdrawals (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  amount numeric not null,
  phone_number text not null,
  account_name text not null,
  status text not null default 'pending', -- pending, completed, rejected
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  processed_at timestamp with time zone
);

-- Row Level Security (RLS) setup
alter table public.users enable row level security;
alter table public.packages enable row level security;
alter table public.photos enable row level security;
alter table public.payments enable row level security;
alter table public.withdrawals enable row level security;

-- Public read access for packages
create policy "Allow public read access to packages" on public.packages
  for select using (true);

-- Allow all operations for authenticated/anon during development
create policy "Allow all users access" on public.users for all using (true);
create policy "Allow all photos access" on public.photos for all using (true);
create policy "Allow all payments access" on public.payments for all using (true);
create policy "Allow all withdrawals access" on public.withdrawals for all using (true);
