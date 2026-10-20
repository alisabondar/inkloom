-- Links each profile row in "user" to its Supabase Auth account.
-- Apply this before running scripts/migrate-users-to-auth.mjs.

alter table public."user"
  add column if not exists auth_id uuid unique references auth.users (id) on delete cascade;

-- New accounts no longer write a password to this table.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'user' and column_name = 'password'
  ) then
    alter table public."user" alter column password drop not null;
  end if;
end $$;
