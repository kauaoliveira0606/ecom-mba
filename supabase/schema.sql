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
-- Each track is unlocked independently via its own proof_submissions action_key.
-- calendar_link is a full Google Calendar "add event" URL pasted in directly by
-- the admin (date/time/location/details are already baked into that URL).
create table if not exists coaching_settings (
  id bigint generated always as identity primary key,
  slug text not null unique,
  name text not null,
  calendar_link text not null default '',
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

-- ── Leaderboard ──
create table if not exists leaderboard (
  id bigint generated always as identity primary key,
  email text not null unique,
  name text not null,
  entries integer not null default 0,
  is_seeded boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table leaderboard enable row level security;

create policy "anyone can read leaderboard" on leaderboard
  for select to anon using (true);

create policy "anyone can upsert their leaderboard row" on leaderboard
  for insert to anon with check (true);

create policy "anyone can update their leaderboard row" on leaderboard
  for update to anon using (true);

-- Seed data imported from previous portal (2026-07-03)
insert into leaderboard (email, name, entries, is_seeded) values
  ('theolungu2013@lb.seed',        'Theo Lungu2013',        70, true),
  ('jordanmills@lb.seed',          'Jordan Mills',          47, true),
  ('tylereeves@lb.seed',           'Tyler Reeves',          39, true),
  ('caseybrooks@lb.seed',          'Casey Brooks',          31, true),
  ('morganprice@lb.seed',          'Morgan Price',          26, true),
  ('devonchase@lb.seed',           'Devon Chase',           22, true),
  ('struanbell@lb.seed',           'Struanbell',            20, true),
  ('rileysantos@lb.seed',          'Riley Santos',          18, true),
  ('zacharytomazic@lb.seed',       'Zacharytomazic',        17, true),
  ('kauabage@lb.seed',             'Kaua Bage',             16, true),
  ('kentlipkowski@lb.seed',        'Kentlipkowski',         16, true),
  ('quinnharper@lb.seed',          'Quinn Harper',          14, true),
  ('jaydenmoran2009@lb.seed',      'Jaydenmoran2009',       13, true),
  ('gurshanbasi1313@lb.seed',      'Gurshanbasi1313',       12, true),
  ('scotthostetler25@lb.seed',     'Scotthostetler25',      12, true),
  ('averycoleman@lb.seed',         'Avery Coleman',         11, true),
  ('oneydalooez008@lb.seed',       'Oneydalooez008',        11, true),
  ('cruzworksinc@lb.seed',         'Cruz Works Inc',        11, true),
  ('alarnasutton@lb.seed',         'Alarna Sutton',         10, true),
  ('oscaralexander27@lb.seed',     'Oscaralexander27',      10, true),
  ('jeadara2008@lb.seed',          'Jeadara2008',           10, true),
  ('arifu22co@lb.seed',            'Arifu22co',             10, true),
  ('gratefultommy@lb.seed',        'Gratefultommy',          9, true),
  ('sagemitchell@lb.seed',         'Sage Mitchell',          8, true),
  ('bhmarketingllc@lb.seed',       'Bhmarketingllc',         8, true),
  ('akramyessir5@lb.seed',         'Akramyessir5',           8, true),
  ('jaydenhutch880@lb.seed',       'Jaydenhutch880',         7, true),
  ('tylervnguye222@lb.seed',       'Tylervnguye222',         7, true),
  ('ethancheese10@lb.seed',        'Ethancheese10',          6, true),
  ('blaketurner@lb.seed',          'Blake Turner',           5, true),
  ('stephencook026@lb.seed',       'Stephen Cook026',        5, true),
  ('mattgaf2010@lb.seed',          'Mattgaf2010',            5, true),
  ('bpscaling@lb.seed',            'Bpscaling',              5, true),
  ('alphafofanah440@lb.seed',      'Alphafofanah440',        5, true),
  ('beastvexz@lb.seed',            'Beastvexz',              5, true),
  ('ovrochowdhury12345@lb.seed',   'Ovro Chowdhury12345',    5, true),
  ('namdaromid@lb.seed',           'Namdaromid',             5, true),
  ('stewiekudron10@lb.seed',       'Stewiekudron10',         5, true),
  ('wendellexavier17@lb.seed',     'Wendellexavier17',       5, true),
  ('fusionwonder21@lb.seed',       'Fusionwonder21',         4, true),
  ('jjstorti710@lb.seed',          'Jjstorti710',            3, true),
  ('ary3s6464@lb.seed',            'Ary3s6464',              3, true)
on conflict (email) do nothing;
