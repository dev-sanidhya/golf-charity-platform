-- Golf Charity Subscription Platform — Supabase Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─── PROFILES ─────────────────────────────────────────────────────────────────
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null unique,
  full_name text,
  role text not null default 'user' check (role in ('user', 'admin')),
  subscription_status text not null default 'inactive'
    check (subscription_status in ('active', 'inactive', 'cancelled', 'past_due')),
  subscription_plan text check (subscription_plan in ('monthly', 'yearly')),
  subscription_end_date timestamptz,
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  charity_id uuid,
  charity_percentage numeric not null default 10 check (charity_percentage >= 10 and charity_percentage <= 100),
  country text default 'GB',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ─── SCORES ───────────────────────────────────────────────────────────────────
create table public.scores (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  score integer not null check (score >= 1 and score <= 45),
  played_at date not null,
  created_at timestamptz not null default now()
);

-- ─── CHARITIES ────────────────────────────────────────────────────────────────
create table public.charities (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text not null,
  logo_url text,
  website_url text,
  category text,
  is_featured boolean not null default false,
  is_active boolean not null default true,
  total_raised numeric not null default 0,
  created_at timestamptz not null default now()
);

-- ─── DRAWS ────────────────────────────────────────────────────────────────────
create table public.draws (
  id uuid primary key default uuid_generate_v4(),
  month integer not null check (month >= 1 and month <= 12),
  year integer not null,
  draw_numbers integer[] not null default '{}',
  draw_type text not null default 'random' check (draw_type in ('random', 'algorithmic')),
  status text not null default 'draft' check (status in ('draft', 'simulated', 'published')),
  jackpot_amount numeric not null default 0,
  jackpot_rollover numeric not null default 0,
  four_match_pool numeric not null default 0,
  three_match_pool numeric not null default 0,
  total_participants integer not null default 0,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  unique(month, year)
);

-- ─── DRAW RESULTS ─────────────────────────────────────────────────────────────
create table public.draw_results (
  id uuid primary key default uuid_generate_v4(),
  draw_id uuid not null references public.draws(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  user_scores integer[] not null,
  match_count integer not null check (match_count >= 0 and match_count <= 5),
  prize_amount numeric not null default 0,
  payment_status text not null default 'pending'
    check (payment_status in ('pending', 'paid', 'rejected')),
  proof_url text,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  unique(draw_id, user_id)
);

-- ─── CHARITY CONTRIBUTIONS ────────────────────────────────────────────────────
create table public.charity_contributions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  charity_id uuid not null references public.charities(id) on delete cascade,
  amount numeric not null check (amount > 0),
  type text not null default 'subscription' check (type in ('subscription', 'donation')),
  period text, -- e.g. '2026-03'
  created_at timestamptz not null default now()
);

-- ─── FK: profiles.charity_id ─────────────────────────────────────────────────
alter table public.profiles
  add constraint profiles_charity_id_fkey
  foreign key (charity_id) references public.charities(id) on delete set null;

-- ─── ROW LEVEL SECURITY ───────────────────────────────────────────────────────
alter table public.profiles enable row level security;
alter table public.scores enable row level security;
alter table public.charities enable row level security;
alter table public.draws enable row level security;
alter table public.draw_results enable row level security;
alter table public.charity_contributions enable row level security;

-- Profiles: users see own, admins see all
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);
create policy "Admins can view all profiles" on public.profiles
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Scores: users manage own
create policy "Users can manage own scores" on public.scores
  for all using (auth.uid() = user_id);
create policy "Admins can manage all scores" on public.scores
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Charities: public read, admin write
create policy "Anyone can view active charities" on public.charities
  for select using (is_active = true);
create policy "Admins can manage charities" on public.charities
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Draws: subscribers can read published
create policy "Subscribers can view published draws" on public.draws
  for select using (status = 'published');
create policy "Admins can manage draws" on public.draws
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Draw results: users see own
create policy "Users can view own draw results" on public.draw_results
  for select using (auth.uid() = user_id);
create policy "Users can update own draw results (proof upload)" on public.draw_results
  for update using (auth.uid() = user_id);
create policy "Admins can manage all draw results" on public.draw_results
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Charity contributions: users see own
create policy "Users can view own contributions" on public.charity_contributions
  for select using (auth.uid() = user_id);
create policy "Admins can view all contributions" on public.charity_contributions
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- ─── TRIGGER: auto-create profile on signup ───────────────────────────────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    coalesce(new.raw_user_meta_data->>'role', 'user')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─── TRIGGER: updated_at ──────────────────────────────────────────────────────
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.handle_updated_at();

-- ─── SEED: sample charities ───────────────────────────────────────────────────
insert into public.charities (name, description, category, is_featured, is_active) values
  ('Cancer Research UK', 'Fighting cancer through world-class research, ensuring more people survive.', 'Health', true, true),
  ('Age UK', 'Providing vital services for older people including advice, homecare and befriending.', 'Social', false, true),
  ('RNLI', 'The Royal National Lifeboat Institution saves lives at sea around the UK and Ireland.', 'Emergency Services', true, true),
  ('Macmillan Cancer Support', 'Providing medical, emotional, practical and financial support for people with cancer.', 'Health', false, true),
  ('British Heart Foundation', 'Funding research into heart and circulatory diseases to save and improve lives.', 'Health', false, true),
  ('Shelter', 'Providing expert advice on housing issues and campaigning for better housing policies.', 'Housing', false, true);

-- ─── SEED: admin user (update after creating via Supabase Auth) ───────────────
-- Run after creating admin user: UPDATE public.profiles SET role = 'admin' WHERE email = 'admin@golfcharity.com';
