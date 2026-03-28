-- ============================================================
-- EC Web Co — Supabase Schema
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- 1. RESTAURANTS
create table if not exists restaurants (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  slug         text unique not null,
  owner_id     uuid references auth.users(id) on delete cascade,
  created_at   timestamptz default now()
);

-- 2. MENU SECTIONS
create table if not exists menu_sections (
  id             uuid primary key default gen_random_uuid(),
  restaurant_id  uuid references restaurants(id) on delete cascade,
  name           text not null,
  sort_order     int default 0
);

-- 3. MENU ITEMS
create table if not exists menu_items (
  id             uuid primary key default gen_random_uuid(),
  section_id     uuid references menu_sections(id) on delete cascade,
  restaurant_id  uuid references restaurants(id) on delete cascade,
  name           text not null,
  price          numeric(10,2),
  description    text,
  photo_url      text,
  available      boolean default true,
  sort_order     int default 0
);

-- 4. HOURS
create table if not exists hours (
  id             uuid primary key default gen_random_uuid(),
  restaurant_id  uuid references restaurants(id) on delete cascade,
  day_of_week    int,      -- 0=Sunday ... 6=Saturday, NULL for special
  open_time      time,
  close_time     time,
  closed         boolean default false,
  label          text      -- NULL = regular hours; value = special (e.g. "Thanksgiving")
);

-- 5. LINKS
create table if not exists links (
  id                uuid primary key default gen_random_uuid(),
  restaurant_id     uuid references restaurants(id) on delete cascade,
  order_url         text,
  reservation_url   text,
  phone             text,
  updated_at        timestamptz default now()
);

-- 6. PHOTOS
create table if not exists photos (
  id             uuid primary key default gen_random_uuid(),
  restaurant_id  uuid references restaurants(id) on delete cascade,
  storage_path   text not null,
  url            text,
  is_hero        boolean default false,
  sort_order     int default 0
);

-- 7. ANALYTICS EVENTS
create table if not exists analytics_events (
  id             uuid primary key default gen_random_uuid(),
  restaurant_id  uuid references restaurants(id),
  event_type     text,   -- 'page_view' | 'order_click' | 'reserve_click' | 'phone_click'
  created_at     timestamptz default now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table restaurants      enable row level security;
alter table menu_sections    enable row level security;
alter table menu_items       enable row level security;
alter table hours            enable row level security;
alter table links            enable row level security;
alter table photos           enable row level security;
alter table analytics_events enable row level security;

-- Helper: get the restaurant_id for the logged-in user
create or replace function my_restaurant_id()
returns uuid language sql stable as $$
  select id from restaurants where owner_id = auth.uid() limit 1;
$$;

-- Restaurants: owner can read/write their own row
create policy "owner restaurants" on restaurants
  for all using (owner_id = auth.uid());

-- Menu sections
create policy "owner menu_sections" on menu_sections
  for all using (restaurant_id = my_restaurant_id());

-- Menu items
create policy "owner menu_items" on menu_items
  for all using (restaurant_id = my_restaurant_id());

-- Hours
create policy "owner hours" on hours
  for all using (restaurant_id = my_restaurant_id());

-- Links
create policy "owner links" on links
  for all using (restaurant_id = my_restaurant_id());

-- Photos
create policy "owner photos" on photos
  for all using (restaurant_id = my_restaurant_id());

-- Analytics: anyone can insert (public site), only owner can read
create policy "public insert analytics" on analytics_events
  for insert with check (true);

create policy "owner read analytics" on analytics_events
  for select using (restaurant_id = my_restaurant_id());

-- Public read for restaurant sites (optional, uncomment if your site uses anon key)
-- create policy "public read menu" on menu_sections for select using (true);
-- create policy "public read menu items" on menu_items for select using (true);
-- create policy "public read hours" on hours for select using (true);
-- create policy "public read links" on links for select using (true);
-- create policy "public read photos" on photos for select using (true);

-- ============================================================
-- STORAGE BUCKETS
-- Run in SQL Editor or create manually in Storage tab
-- ============================================================

-- insert into storage.buckets (id, name, public) values ('restaurant-photos', 'restaurant-photos', true);
-- insert into storage.buckets (id, name, public) values ('menu-photos', 'menu-photos', true);

-- ============================================================
-- HOW TO ADD A NEW RESTAURANT CLIENT
-- 1. Create user in Auth → Users (set their email/password)
-- 2. Run this (replace values):
-- ============================================================

-- insert into restaurants (name, slug, owner_id)
-- values (
--   'La Bella Cucina',           -- restaurant display name
--   'la-bella-cucina',           -- URL-safe slug used by the website
--   'PASTE-USER-UUID-FROM-AUTH'  -- from Auth → Users table
-- );
