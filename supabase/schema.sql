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

-- ── Coaching Calls tab content (single row, editable from admin panel) ──
create table if not exists coaching_settings (
  id int primary key default 1,
  zoom_link text not null default '',
  details text not null default '',
  constraint coaching_settings_single_row check (id = 1)
);

insert into coaching_settings (id, zoom_link, details)
values (1, '', '')
on conflict (id) do nothing;

alter table coaching_settings enable row level security;

create policy "anyone can read coaching settings" on coaching_settings
  for select to anon using (true);

create policy "admin panel can update coaching settings" on coaching_settings
  for update to anon using (true);
