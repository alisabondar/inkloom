-- template.user_id was a bigint while "user".id is a uuid, so templates were all saved under a placeholder id (1).
-- This converts template.user_id to uuid and links it to "user".id.
--
-- BEFORE RUNNING: set legacy_owner_email to the account that should own the existing templates
-- (every legacy row has the same placeholder id, so there is no way to tell real owners apart).
-- Leave it as '' to leave legacy templates without an owner: public ones stay visible in the gallery,
-- private ones become unreachable.

do $$
declare
  legacy_owner_email text := '';
  legacy_owner_id uuid;
  fk record;
begin
  -- Drop any existing foreign keys on template.user_id (they point at the wrong type).
  for fk in
    select con.conname
    from pg_constraint con
    join pg_attribute att on att.attrelid = con.conrelid and att.attnum = any (con.conkey)
    where con.conrelid = 'public.template'::regclass and con.contype = 'f' and att.attname = 'user_id'
  loop
    execute format('alter table public.template drop constraint %I', fk.conname);
  end loop;

  if legacy_owner_email <> '' then
    select id into legacy_owner_id from public."user" where email = legacy_owner_email;
    if legacy_owner_id is null then
      raise exception 'No "user" row with email %', legacy_owner_email;
    end if;
  end if;

  -- Policies reference user_id, so they must be dropped before the type change and recreated after.
  drop policy if exists "template_select_own" on public.template;
  drop policy if exists "template_insert_own" on public.template;
  drop policy if exists "template_update_own" on public.template;
  drop policy if exists "template_delete_own" on public.template;

  alter table public.template alter column user_id drop not null;
  alter table public.template alter column user_id type uuid using null;

  if legacy_owner_id is not null then
    update public.template set user_id = legacy_owner_id where user_id is null;
  end if;

  alter table public.template
    add constraint template_user_id_fkey foreign key (user_id) references public."user" (id) on delete cascade;
end $$;

create policy "template_select_own" on public.template
  for select using (user_id in (select id from public."user" where auth_id = auth.uid()));

create policy "template_insert_own" on public.template
  for insert with check (user_id in (select id from public."user" where auth_id = auth.uid()));

create policy "template_update_own" on public.template
  for update
  using (user_id in (select id from public."user" where auth_id = auth.uid()))
  with check (user_id in (select id from public."user" where auth_id = auth.uid()));

create policy "template_delete_own" on public.template
  for delete using (user_id in (select id from public."user" where auth_id = auth.uid()));
