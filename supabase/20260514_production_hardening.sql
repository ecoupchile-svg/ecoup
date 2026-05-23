-- Production hardening pass for ReciclaMarket.
-- Run this after supabase/schema.sql in the Supabase SQL editor.

alter table public.profiles
  add column if not exists phone text;

create index if not exists requests_user_id_created_at_idx
  on public.requests (user_id, created_at desc);

create index if not exists requests_recycler_id_created_at_idx
  on public.requests (recycler_id, created_at desc);

create index if not exists requests_status_created_at_idx
  on public.requests (status, created_at desc);

create index if not exists evidence_request_id_idx
  on public.evidence (request_id);

create index if not exists rating_rated_id_idx
  on public.rating (rated_id);

create or replace function public.is_recycler(user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = user_id
      and role = 'RECYCLER'
  );
$$;

create or replace function public.is_request_participant(request_row public.requests)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select auth.uid() = request_row.user_id
      or auth.uid() = request_row.recycler_id;
$$;

create or replace function public.validate_request_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  actor uuid := auth.uid();
begin
  if actor is null then
    raise exception 'not authenticated';
  end if;

  if new.id <> old.id
    or new.user_id <> old.user_id
    or new.title <> old.title
    or new.description <> old.description
    or new.waste_type <> old.waste_type
    or coalesce(new.estimated_weight, -1) <> coalesce(old.estimated_weight, -1)
    or new.address <> old.address
    or new.latitude <> old.latitude
    or new.longitude <> old.longitude
    or coalesce(new.scheduled_at, 'epoch'::timestamptz) <> coalesce(old.scheduled_at, 'epoch'::timestamptz)
    or new.created_at <> old.created_at then
    raise exception 'request core fields are immutable';
  end if;

  if old.status = 'PENDING'
    and new.status = 'ACCEPTED'
    and old.recycler_id is null
    and new.recycler_id = actor
    and public.is_recycler(actor) then
    return new;
  end if;

  if old.status = 'ACCEPTED'
    and new.status = 'IN_PROGRESS'
    and old.recycler_id = actor
    and new.recycler_id = old.recycler_id then
    return new;
  end if;

  if old.status = 'IN_PROGRESS'
    and new.status = 'EVIDENCE_UPLOADED'
    and old.recycler_id = actor
    and new.recycler_id = old.recycler_id
    and exists (
      select 1
      from public.evidence
      where request_id = old.id
        and recycler_id = actor
    ) then
    return new;
  end if;

  if old.status = 'EVIDENCE_UPLOADED'
    and new.status = 'COMPLETED'
    and old.user_id = actor
    and new.recycler_id = old.recycler_id
    and exists (
      select 1
      from public.rating
      where request_id = old.id
        and rater_id = actor
    ) then
    return new;
  end if;

  raise exception 'invalid request status transition';
end;
$$;

drop trigger if exists validate_request_update on public.requests;
create trigger validate_request_update
  before update on public.requests
  for each row execute procedure public.validate_request_update();

create or replace function public.validate_evidence_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or new.recycler_id <> auth.uid() then
    raise exception 'not allowed to upload evidence';
  end if;

  if not exists (
    select 1
    from public.requests
    where id = new.request_id
      and recycler_id = auth.uid()
      and status = 'IN_PROGRESS'
  ) then
    raise exception 'evidence requires an assigned in-progress request';
  end if;

  return new;
end;
$$;

drop trigger if exists validate_evidence_insert on public.evidence;
create trigger validate_evidence_insert
  before insert on public.evidence
  for each row execute procedure public.validate_evidence_insert();

create or replace function public.validate_rating_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or new.rater_id <> auth.uid() then
    raise exception 'not allowed to rate';
  end if;

  if not exists (
    select 1
    from public.requests
    where id = new.request_id
      and user_id = auth.uid()
      and recycler_id = new.rated_id
      and status = 'EVIDENCE_UPLOADED'
  ) then
    raise exception 'rating requires completed evidence for your request';
  end if;

  return new;
end;
$$;

drop trigger if exists validate_rating_insert on public.rating;
create trigger validate_rating_insert
  before insert on public.rating
  for each row execute procedure public.validate_rating_insert();

drop policy if exists "profiles_select" on public.profiles;
drop policy if exists "profiles_insert" on public.profiles;
drop policy if exists "profiles_update" on public.profiles;
drop policy if exists "requests_select" on public.requests;
drop policy if exists "requests_insert" on public.requests;
drop policy if exists "requests_update" on public.requests;
drop policy if exists "evidence_select" on public.evidence;
drop policy if exists "evidence_insert" on public.evidence;
drop policy if exists "rating_select" on public.rating;
drop policy if exists "rating_insert" on public.rating;

create policy "profiles_select_authenticated"
  on public.profiles for select
  using (auth.uid() is not null);

create policy "profiles_insert_self"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "profiles_update_self"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "requests_select_participants_or_available"
  on public.requests for select
  using (
    auth.uid() = user_id
    or auth.uid() = recycler_id
    or (
      status = 'PENDING'
      and auth.uid() is not null
      and public.is_recycler(auth.uid())
    )
  );

create policy "requests_insert_owner"
  on public.requests for insert
  with check (
    auth.uid() = user_id
    and recycler_id is null
    and status = 'PENDING'
    and not public.is_recycler(auth.uid())
  );

create policy "requests_update_transition_actor"
  on public.requests for update
  using (
    auth.uid() = user_id
    or auth.uid() = recycler_id
    or (
      status = 'PENDING'
      and recycler_id is null
      and auth.uid() is not null
      and public.is_recycler(auth.uid())
    )
  )
  with check (
    auth.uid() = user_id
    or auth.uid() = recycler_id
  );

create policy "evidence_select_participants"
  on public.evidence for select
  using (
    exists (
      select 1
      from public.requests r
      where r.id = request_id
        and (r.user_id = auth.uid() or r.recycler_id = auth.uid())
    )
  );

create policy "evidence_insert_assigned_recycler"
  on public.evidence for insert
  with check (
    auth.uid() = recycler_id
    and exists (
      select 1
      from public.requests r
      where r.id = request_id
        and r.recycler_id = auth.uid()
        and r.status = 'IN_PROGRESS'
    )
  );

create policy "rating_select_participants"
  on public.rating for select
  using (
    auth.uid() = rater_id
    or auth.uid() = rated_id
  );

create policy "rating_insert_request_owner"
  on public.rating for insert
  with check (
    auth.uid() = rater_id
    and exists (
      select 1
      from public.requests r
      where r.id = request_id
        and r.user_id = auth.uid()
        and r.recycler_id = rated_id
        and r.status = 'EVIDENCE_UPLOADED'
    )
  );

drop policy if exists "evidence_storage_select" on storage.objects;
drop policy if exists "evidence_storage_insert" on storage.objects;

update storage.buckets
set public = true
where id = 'evidence';

create policy "evidence_storage_select_authenticated"
  on storage.objects for select
  using (
    bucket_id = 'evidence'
    and auth.uid() is not null
  );

create policy "evidence_storage_insert_authenticated_evidence_path"
  on storage.objects for insert
  with check (
    bucket_id = 'evidence'
    and auth.uid() is not null
    and (storage.foldername(name))[1] = 'evidence'
  );
