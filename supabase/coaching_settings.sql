create table if not exists coaching_settings (
  id bigint generated always as identity primary key,
  zoom_link text not null default '',
  details text not null default '{}'
);
insert into coaching_settings (zoom_link, details) values ('', '{}');
alter table coaching_settings enable row level security;
create policy "read" on coaching_settings for select to anon using (true);
create policy "update" on coaching_settings for update to anon using (true);
create policy "insert" on coaching_settings for insert to anon with check (true);
