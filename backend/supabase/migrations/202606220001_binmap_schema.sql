create extension if not exists postgis with schema extensions;

create type public.app_role as enum ('user', 'admin');
create type public.dustbin_status as enum ('available', 'full', 'damaged');
create type public.moderation_status as enum ('pending', 'approved', 'rejected', 'removed');
create type public.report_type as enum ('missing', 'full', 'damaged');
create type public.report_status as enum ('pending', 'resolved', 'dismissed');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  role public.app_role not null default 'user',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.dustbins (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 3 and 120),
  description text not null check (char_length(description) between 6 and 500),
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  location extensions.geography(point, 4326)
    generated always as (
      extensions.st_setsrid(extensions.st_makepoint(longitude, latitude), 4326)::extensions.geography
    ) stored,
  operational_status public.dustbin_status not null default 'available',
  moderation_status public.moderation_status not null default 'pending',
  image_path text,
  submitted_by uuid references auth.users(id) on delete set null,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.dustbin_reports (
  id uuid primary key default gen_random_uuid(),
  dustbin_id uuid not null references public.dustbins(id) on delete cascade,
  type public.report_type not null default 'missing',
  note text not null default '' check (char_length(note) <= 500),
  reported_latitude double precision not null check (reported_latitude between -90 and 90),
  reported_longitude double precision not null check (reported_longitude between -180 and 180),
  status public.report_status not null default 'pending',
  submitted_by uuid references auth.users(id) on delete set null,
  resolved_by uuid references auth.users(id) on delete set null,
  resolved_at timestamptz,
  resolution_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index dustbins_location_gix on public.dustbins using gist (location);
create index dustbins_public_lookup_idx
  on public.dustbins (moderation_status, operational_status);
create index dustbin_reports_queue_idx
  on public.dustbin_reports (status, created_at desc);
create index dustbin_reports_dustbin_idx
  on public.dustbin_reports (dustbin_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger dustbins_set_updated_at
before update on public.dustbins
for each row execute function public.set_updated_at();

create trigger dustbin_reports_set_updated_at
before update on public.dustbin_reports
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, coalesce(new.email, ''));
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.nearby_dustbins(
  p_latitude double precision,
  p_longitude double precision,
  p_radius_meters integer default 3000
)
returns table (
  id uuid,
  name text,
  description text,
  latitude double precision,
  longitude double precision,
  operational_status public.dustbin_status,
  image_path text,
  updated_at timestamptz,
  distance_meters double precision
)
language sql
stable
security invoker
set search_path = public, extensions
as $$
  select
    d.id,
    d.name,
    d.description,
    d.latitude,
    d.longitude,
    d.operational_status,
    d.image_path,
    d.updated_at,
    extensions.st_distance(
      d.location,
      extensions.st_setsrid(extensions.st_makepoint(p_longitude, p_latitude), 4326)::extensions.geography
    ) as distance_meters
  from public.dustbins d
  where d.moderation_status = 'approved'
    and extensions.st_dwithin(
      d.location,
      extensions.st_setsrid(extensions.st_makepoint(p_longitude, p_latitude), 4326)::extensions.geography,
      least(greatest(p_radius_meters, 1), 25000)
    )
  order by distance_meters;
$$;

alter table public.profiles enable row level security;
alter table public.dustbins enable row level security;
alter table public.dustbin_reports enable row level security;

create policy "profiles can read own record"
on public.profiles for select
to authenticated
using (id = auth.uid() or public.is_admin());

create policy "admins can update profiles"
on public.profiles for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "public can read approved dustbins"
on public.dustbins for select
to anon, authenticated
using (moderation_status = 'approved');

create policy "admins can read all dustbins"
on public.dustbins for select
to authenticated
using (public.is_admin());

create policy "admins can update dustbins"
on public.dustbins for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "admins can read reports"
on public.dustbin_reports for select
to authenticated
using (public.is_admin());

create policy "admins can update reports"
on public.dustbin_reports for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

grant execute on function public.nearby_dustbins(double precision, double precision, integer)
to anon, authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'dustbin-images',
  'dustbin-images',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "admins can read dustbin images"
on storage.objects for select
to authenticated
using (bucket_id = 'dustbin-images' and public.is_admin());

create policy "admins can delete dustbin images"
on storage.objects for delete
to authenticated
using (bucket_id = 'dustbin-images' and public.is_admin());
