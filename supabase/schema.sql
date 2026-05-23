-- Profiles (auto-created on auth.users insert)
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  full_name text not null,
  role text not null check (role in ('USER','RECYCLER')) default 'USER',
  phone text,
  avatar_url text,
  rating_avg numeric(3,2) default 0,
  rating_count int default 0,
  created_at timestamptz default now()
);

-- Requests
create table if not exists public.requests (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  recycler_id uuid references public.profiles(id) on delete set null,
  title text not null,
  description text not null,
  waste_type text not null,
  estimated_weight numeric,
  address text not null,
  latitude numeric not null,
  longitude numeric not null,
  status text not null check (status in ('PENDING','ACCEPTED','IN_PROGRESS','EVIDENCE_UPLOADED','COMPLETED')) default 'PENDING',
  scheduled_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Evidence
create table if not exists public.evidence (
  id uuid default gen_random_uuid() primary key,
  request_id uuid references public.requests(id) on delete cascade not null,
  recycler_id uuid references public.profiles(id) on delete cascade not null,
  image_url text not null,
  latitude numeric not null,
  longitude numeric not null,
  notes text,
  created_at timestamptz default now()
);

-- Rating
create table if not exists public.rating (
  id uuid default gen_random_uuid() primary key,
  request_id uuid references public.requests(id) on delete cascade not null unique,
  rater_id uuid references public.profiles(id) on delete cascade not null,
  rated_id uuid references public.profiles(id) on delete cascade not null,
  score int not null check (score between 1 and 5),
  comment text,
  created_at timestamptz default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id, new.email,
    coalesce(new.raw_user_meta_data->>'full_name', 'Usuario'),
    coalesce(new.raw_user_meta_data->>'role', 'USER')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Update rating avg
create or replace function public.update_rating_avg()
returns trigger language plpgsql as $$
begin
  update public.profiles
  set rating_avg = (select avg(score) from public.rating where rated_id = new.rated_id),
      rating_count = (select count(*) from public.rating where rated_id = new.rated_id)
  where id = new.rated_id;
  return new;
end;
$$;

drop trigger if exists on_rating_inserted on public.rating;
create trigger on_rating_inserted
  after insert on public.rating
  for each row execute procedure public.update_rating_avg();

-- RLS
alter table public.profiles enable row level security;
alter table public.requests enable row level security;
alter table public.evidence enable row level security;
alter table public.rating enable row level security;

create policy "profiles_select" on public.profiles for select using (true);
create policy "profiles_insert" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_update" on public.profiles for update using (auth.uid() = id);

create policy "requests_select" on public.requests for select using (true);
create policy "requests_insert" on public.requests for insert with check (auth.uid() = user_id);
create policy "requests_update" on public.requests for update using (auth.uid() = user_id or auth.uid() = recycler_id or (status = 'PENDING' and auth.uid() is not null));

create policy "evidence_select" on public.evidence for select using (true);
create policy "evidence_insert" on public.evidence for insert with check (auth.uid() = recycler_id);

create policy "rating_select" on public.rating for select using (true);
create policy "rating_insert" on public.rating for insert with check (auth.uid() = rater_id);

-- Storage
insert into storage.buckets (id, name, public) values ('evidence', 'evidence', true) on conflict do nothing;
create policy "evidence_storage_select" on storage.objects for select using (bucket_id = 'evidence');
create policy "evidence_storage_insert" on storage.objects for insert with check (bucket_id = 'evidence' and auth.uid() is not null);
