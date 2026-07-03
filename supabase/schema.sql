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
