create table if not exists profiles (
  id bigint generated always as identity primary key,
  email text not null unique,
  approved boolean not null default false,
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

-- Portal calls Supabase directly from the browser with the anon key,
-- so these policies must stay open (matches the original site's setup).
create policy "anyone can request access" on profiles
  for insert to anon with check (true);

create policy "anyone can check their own status" on profiles
  for select to anon using (true);

create policy "admin panel can approve/revoke" on profiles
  for update to anon using (true);

create policy "admin panel can reject" on profiles
  for delete to anon using (true);

-- ── Proof-of-subscription submissions (Rewards + Elite Status uploads) ──
create table if not exists proof_submissions (
  id bigint generated always as identity primary key,
  email text not null,
  tab text not null,
  action_key text not null,
  status text not null default 'pending', -- 'pending' | 'approved' | 'rejected'
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

alter table proof_submissions enable row level security;

create policy "anyone can submit proof" on proof_submissions
  for insert to anon with check (true);

create policy "anyone can read submissions" on proof_submissions
  for select to anon using (true);

create policy "admin panel can review submissions" on proof_submissions
  for update to anon using (true);

-- ── Coaching Calls tab content ──
-- One row per named coaching call track (e.g. 'wix-yearly', 'constant-contact').
-- Each track is unlocked independently via its own proof_submissions action_key,
-- and the admin panel edits each track's Zoom link/date/time/details separately.
create table if not exists coaching_settings (
  id bigint generated always as identity primary key,
  slug text not null unique,
  name text not null,
  zoom_link text not null default '',
  call_date text not null default '',
  call_time text not null default '',
  details text not null default ''
);

insert into coaching_settings (slug, name) values
  ('wix-yearly', 'Wix Yearly Coaching Call'),
  ('constant-contact', 'Constant Contact Coaching Call')
on conflict (slug) do nothing;

alter table coaching_settings enable row level security;

create policy "anyone can read coaching settings" on coaching_settings
  for select to anon using (true);

create policy "admin panel can update coaching settings" on coaching_settings
  for update to anon using (true);
