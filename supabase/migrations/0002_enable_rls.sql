-- Row Level Security for profiles and templates.
-- Apply this after scripts/migrate-users-to-auth.mjs has set auth_id on every existing row.

alter table public."user" enable row level security;
alter table public.template enable row level security;

-- user: each person can read, update, and delete only their own profile row.
drop policy if exists "user_select_own" on public."user";
create policy "user_select_own" on public."user"
  for select using (auth_id = auth.uid());

drop policy if exists "user_update_own" on public."user";
create policy "user_update_own" on public."user"
  for update using (auth_id = auth.uid()) with check (auth_id = auth.uid());

drop policy if exists "user_delete_own" on public."user";
create policy "user_delete_own" on public."user"
  for delete using (auth_id = auth.uid());

-- template: anyone can read public templates.
drop policy if exists "template_select_public" on public.template;
create policy "template_select_public" on public.template
  for select using (public = true);

-- template: owners can read, insert, update, and delete their own templates.
-- Ids are compared as text so this works whether "user".id is numeric or uuid.
drop policy if exists "template_select_own" on public.template;
create policy "template_select_own" on public.template
  for select using (
    user_id::text in (select id::text from public."user" where auth_id = auth.uid())
  );

drop policy if exists "template_insert_own" on public.template;
create policy "template_insert_own" on public.template
  for insert with check (
    user_id::text in (select id::text from public."user" where auth_id = auth.uid())
  );

drop policy if exists "template_update_own" on public.template;
create policy "template_update_own" on public.template
  for update
  using (user_id::text in (select id::text from public."user" where auth_id = auth.uid()))
  with check (user_id::text in (select id::text from public."user" where auth_id = auth.uid()));

drop policy if exists "template_delete_own" on public.template;
create policy "template_delete_own" on public.template
  for delete using (
    user_id::text in (select id::text from public."user" where auth_id = auth.uid())
  );

-- Passwords now live only in Supabase Auth.
alter table public."user" drop column if exists password;
