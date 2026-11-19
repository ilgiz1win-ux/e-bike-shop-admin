-- Жолдош phase 1: profiles, cars, trips, bookings with row level security.

-- ---------- profiles ----------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null default '',
  phone text,
  lang text not null default 'ky' check (lang in ('ky', 'ru')),
  avatar_url text,
  location_granted boolean not null default false,
  role text not null default 'user' check (role in ('user', 'operator', 'admin')),
  blocked boolean not null default false,
  created_at timestamptz not null default now()
);

-- Every new auth user gets a profile carrying their verified phone.
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, phone) values (new.id, new.phone);
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Signed-in users cannot change their own role, block flag or verified phone.
create function public.protect_profile_fields() returns trigger
language plpgsql as $$
begin
  if current_user = 'authenticated' then
    new.role := old.role;
    new.blocked := old.blocked;
    new.phone := old.phone;
  end if;
  return new;
end $$;
create trigger protect_profile_fields before update on public.profiles
  for each row execute function public.protect_profile_fields();

alter table public.profiles enable row level security;
create policy "own profile read" on public.profiles for select to authenticated using (id = auth.uid());
create policy "own profile update" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- ---------- cars ----------
create table public.cars (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null unique references public.profiles (id) on delete cascade,
  brand text not null,
  model text not null,
  year int check (year between 1970 and 2100),
  color text not null default 'black',
  wheel text not null default 'L' check (wheel in ('L', 'R')),
  plate text,
  created_at timestamptz not null default now()
);
alter table public.cars enable row level security;
create policy "own car read" on public.cars for select to authenticated using (owner = auth.uid());
create policy "own car insert" on public.cars for insert to authenticated with check (owner = auth.uid());
create policy "own car update" on public.cars for update to authenticated using (owner = auth.uid()) with check (owner = auth.uid());
create policy "own car delete" on public.cars for delete to authenticated using (owner = auth.uid());

-- ---------- trips ----------
create table public.trips (
  id uuid primary key default gen_random_uuid(),
  driver uuid not null references public.profiles (id) on delete cascade,
  from_city text not null,
  to_city text not null check (to_city <> from_city),
  starts_at timestamptz not null,
  ends_at timestamptz,
  seats int not null check (seats > 0 and seats <= 8),
  price int not null check (price >= 0),
  takes_parcels boolean not null default false,
  parcel_price int check (parcel_price >= 0),
  payment text not null default 'cash' check (payment in ('cash', 'transfer', 'both')),
  comment text not null default '',
  status text not null default 'active' check (status in ('active', 'cancelled')),
  created_at timestamptz not null default now()
);
create index trips_search on public.trips (to_city, starts_at) where status = 'active';
alter table public.trips enable row level security;
create policy "trips readable" on public.trips for select to anon, authenticated using (true);
create policy "driver with car creates" on public.trips for insert to authenticated
  with check (driver = auth.uid() and exists (select 1 from public.cars c where c.owner = auth.uid()));
create policy "driver updates own" on public.trips for update to authenticated
  using (driver = auth.uid()) with check (driver = auth.uid());

-- ---------- bookings ----------
create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  trip uuid not null references public.trips (id) on delete cascade,
  passenger uuid not null references public.profiles (id) on delete cascade,
  seats int not null check (seats > 0),
  status text not null default 'active' check (status in ('active', 'cancelled')),
  created_at timestamptz not null default now()
);
alter table public.bookings enable row level security;
-- Passengers and the trip's driver can read; writes only through the functions below.
create policy "booking parties read" on public.bookings for select to authenticated
  using (passenger = auth.uid() or exists (select 1 from public.trips t where t.id = trip and t.driver = auth.uid()));

-- Atomic booking: locks the trip row so the last seat is sold once.
create function public.book_seats(p_trip uuid, p_seats int) returns public.bookings
language plpgsql security definer set search_path = public as $$
declare
  t public.trips;
  taken int;
  b public.bookings;
begin
  if auth.uid() is null then raise exception 'not_signed_in'; end if;
  if p_seats is null or p_seats < 1 then raise exception 'no_seats'; end if;
  select * into t from public.trips where id = p_trip and status = 'active' for update;
  if not found or t.starts_at <= now() then raise exception 'not_found'; end if;
  if t.driver = auth.uid() then raise exception 'own_trip'; end if;
  select coalesce(sum(seats), 0) into taken from public.bookings where trip = p_trip and status = 'active';
  if taken + p_seats > t.seats then raise exception 'no_seats'; end if;
  insert into public.bookings (trip, passenger, seats) values (p_trip, auth.uid(), p_seats) returning * into b;
  return b;
end $$;

create function public.cancel_booking(p_booking uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  update public.bookings set status = 'cancelled'
   where id = p_booking and passenger = auth.uid() and status = 'active';
  if not found then raise exception 'not_found'; end if;
end $$;

-- Driver phone: only for the driver and passengers with an active booking.
create function public.trip_contact(p_trip uuid) returns text
language sql stable security definer set search_path = public as $$
  select p.phone from public.trips t join public.profiles p on p.id = t.driver
   where t.id = p_trip
     and (t.driver = auth.uid()
          or exists (select 1 from public.bookings b where b.trip = t.id and b.passenger = auth.uid() and b.status = 'active'))
$$;

-- Public trip list: safe driver/car fields only (no phone, no plate), upcoming trips.
create view public.trip_cards as
  select t.*, p.name as driver_name,
         c.brand as car_brand, c.model as car_model, c.year as car_year, c.color as car_color,
         t.seats - coalesce((select sum(b.seats) from public.bookings b where b.trip = t.id and b.status = 'active'), 0)::int as seats_left
    from public.trips t
    join public.profiles p on p.id = t.driver
    left join public.cars c on c.owner = t.driver
   where t.status = 'active' and t.starts_at > now() and not p.blocked;

-- ---------- grants (Supabase grants these by default; explicit for portability) ----------
grant usage on schema public to anon, authenticated;
grant select, update on public.profiles to authenticated;
grant select, insert, update, delete on public.cars to authenticated;
grant select on public.trips to anon, authenticated;
grant insert, update on public.trips to authenticated;
grant select on public.bookings to authenticated;
grant select on public.trip_cards to anon, authenticated;
revoke execute on function public.book_seats(uuid, int), public.cancel_booking(uuid), public.trip_contact(uuid) from public;
grant execute on function public.book_seats(uuid, int), public.cancel_booking(uuid), public.trip_contact(uuid) to authenticated;
