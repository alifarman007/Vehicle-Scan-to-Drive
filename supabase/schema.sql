-- RidePass database schema.
-- Run once on a fresh Supabase project (SQL Editor → New query → paste → Run).
-- The app talks to these tables only from the server, with the secret key.

-- One row per registered person
create table profiles (
  id          uuid primary key default gen_random_uuid(),
  code        text not null unique,        -- the code inside the QR, e.g. K7M2QX
  role        text not null check (role in ('driver', 'passenger')),
  name        text not null,
  phone       text,
  id_number   text,                        -- passenger, optional (e.g. employee ID)
  vehicle_no  text,                        -- driver's current vehicle
  created_at  timestamptz not null default now()
);

create table trips (
  id               uuid primary key default gen_random_uuid(),
  trip_no          bigint generated always as identity (start with 1001) unique,  -- "Trip #1001"
  driver_id        uuid not null references profiles(id),
  passenger_id     uuid not null references profiles(id),
  vehicle_no       text,                   -- copied from the driver at start
  status           text not null default 'active' check (status in ('active', 'completed')),
  start_photo_path text not null,
  started_at       timestamptz not null default now(),
  ended_at         timestamptz,
  rating           smallint check (rating between 1 and 5),
  review_tags      text[] not null default '{}',
  review_comment   text,
  reviewed_at      timestamptz
);

-- A passenger can be on only one active trip at a time
create unique index trips_one_active_per_passenger on trips (passenger_id) where status = 'active';
create index trips_driver_recent    on trips (driver_id, started_at desc);
create index trips_passenger_recent on trips (passenger_id, started_at desc);

-- Only the server (secret key) can read/write: RLS on, no policies
alter table profiles enable row level security;
alter table trips    enable row level security;
grant all on table profiles, trips to service_role;

-- Private bucket for dashboard photos
insert into storage.buckets (id, name, public)
values ('dashboard-photos', 'dashboard-photos', false);
