-- Inkloom V3 schema: profiles keyed by Supabase Auth id, templates and generation jobs owned by profiles.
-- Supersedes the legacy "user" and "template" tables (left in place, unused) and migration 0003.
--
-- Legacy templates were all saved under a placeholder owner, so real owners can't be recovered.
-- They are copied to the account named by legacy_owner_email (near the bottom) or, when that is left
-- empty, to the earliest-created legacy account.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------- profiles
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  username text unique,
  first_name text,
  favorite_medium text,
  avatar_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------- generations
create table if not exists public.generations (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  batch_id uuid not null default gen_random_uuid(),
  status text not null default 'queued' check (status in ('queued', 'running', 'succeeded', 'failed')),
  provider text,
  prompt text not null,
  options jsonb not null default '{}'::jsonb,
  result_path text,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  finished_at timestamptz
);

create index if not exists generations_owner_created_idx on public.generations (owner_id, created_at desc);
create index if not exists generations_batch_idx on public.generations (batch_id);

-- ---------------------------------------------------------------- templates
create table if not exists public.templates (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  generation_id uuid references public.generations (id) on delete set null,
  title text not null default 'Untitled template',
  medium text not null,
  difficulty text not null default 'intermediate' check (difficulty in ('beginner', 'intermediate', 'advanced')),
  prompt text,
  concept_path text not null,
  settings jsonb not null default '{}'::jsonb,
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists templates_owner_created_idx on public.templates (owner_id, created_at desc);
create index if not exists templates_public_created_idx on public.templates (created_at desc) where is_public;

-- ---------------------------------------------------------------- updated_at
create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists profiles_touch on public.profiles;
create trigger profiles_touch before update on public.profiles for each row execute function public.touch_updated_at();
drop trigger if exists generations_touch on public.generations;
create trigger generations_touch before update on public.generations for each row execute function public.touch_updated_at();
drop trigger if exists templates_touch on public.templates;
create trigger templates_touch before update on public.templates for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------- profile on signup
-- Creates the profile when Supabase Auth creates a user. Username and first name come from sign-up metadata.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, username, first_name)
  values (
    new.id,
    new.email,
    nullif(trim(new.raw_user_meta_data ->> 'username'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'first_name'), '')
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- Keeps profiles.email in step when the Auth email changes.
create or replace function public.handle_user_email_change() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update public.profiles set email = new.email where id = new.id;
  return new;
end $$;

drop trigger if exists on_auth_user_email_changed on auth.users;
create trigger on_auth_user_email_changed after update of email on auth.users
  for each row when (old.email is distinct from new.email) execute function public.handle_user_email_change();

-- ---------------------------------------------------------------- row level security
alter table public.profiles enable row level security;
alter table public.generations enable row level security;
alter table public.templates enable row level security;

drop policy if exists "profiles_owner_all" on public.profiles;
create policy "profiles_owner_all" on public.profiles
  for all using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "generations_owner_all" on public.generations;
create policy "generations_owner_all" on public.generations
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

drop policy if exists "templates_owner_all" on public.templates;
create policy "templates_owner_all" on public.templates
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

drop policy if exists "templates_public_read" on public.templates;
create policy "templates_public_read" on public.templates
  for select using (is_public);

-- Public maker names for the gallery: only id and username are exposed.
create or replace view public.public_profiles as
  select id, username from public.profiles;
grant select on public.public_profiles to anon, authenticated;

-- ---------------------------------------------------------------- storage
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', false), ('templates', 'templates', false)
on conflict (id) do nothing;

-- Users may write only under a folder named with their own id: "<uid>/...".
drop policy if exists "studio_own_folder_insert" on storage.objects;
create policy "studio_own_folder_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id in ('avatars', 'templates') and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "studio_own_folder_update" on storage.objects;
create policy "studio_own_folder_update" on storage.objects
  for update to authenticated
  using (bucket_id in ('avatars', 'templates') and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "studio_own_folder_delete" on storage.objects;
create policy "studio_own_folder_delete" on storage.objects
  for delete to authenticated
  using (bucket_id in ('avatars', 'templates') and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "studio_own_folder_select" on storage.objects;
create policy "studio_own_folder_select" on storage.objects
  for select to authenticated
  using (bucket_id in ('avatars', 'templates') and (storage.foldername(name))[1] = auth.uid()::text);

-- ---------------------------------------------------------------- copy legacy data
do $$
declare
  legacy_owner_email text := '';
  legacy_owner uuid;
begin
  -- Profiles: one per legacy "user" row that was linked to Supabase Auth by scripts/migrate-users-to-auth.mjs.
  if to_regclass('public."user"') is not null then
    insert into public.profiles (id, email, username, first_name, favorite_medium, avatar_path)
    select u.auth_id, u.email, u.username, u.first_name, u.favorite_medium, u.avatar_url
    from public."user" u
    where u.auth_id is not null
    on conflict (id) do nothing;
  end if;

  -- Templates: all legacy rows go to one owner (see the note at the top).
  if to_regclass('public.template') is not null then
    if legacy_owner_email <> '' then
      select id into legacy_owner from public.profiles where email = legacy_owner_email;
      if legacy_owner is null then
        raise exception 'No profile with email %', legacy_owner_email;
      end if;
    elsif to_regclass('public."user"') is not null then
      select p.id into legacy_owner
      from public.profiles p
      join public."user" u on u.auth_id = p.id
      join auth.users a on a.id = p.id
      order by a.created_at
      limit 1;
    end if;

    if legacy_owner is not null then
      insert into public.templates (owner_id, title, medium, difficulty, prompt, concept_path, is_public, created_at)
      select
        legacy_owner,
        coalesce(t.title, 'Untitled template'),
        case when lower(t.medium) in ('pencil', 'watercolor', 'acrylic', 'paint-by-number', 'embroidery', 'tattoo') then lower(t.medium) else 'pencil' end,
        case when lower(t.difficulty) in ('beginner', 'intermediate', 'advanced') then lower(t.difficulty) else 'intermediate' end,
        t.source,
        t.image_url,
        coalesce(t.public, false),
        coalesce(t.created_at, now())
      from public.template t
      where t.image_url is not null
        and not exists (select 1 from public.templates n where n.concept_path = t.image_url);
    end if;
  end if;
end $$;
