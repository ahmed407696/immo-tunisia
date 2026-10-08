-- Immo Tunisia — initial schema
-- Phase 2: Database + authentication
--
-- How to run this:
--   Option A (quick start): paste this whole file into the Supabase
--   Dashboard → SQL Editor → New query, and click "Run".
--   Option B (Supabase CLI): `supabase link --project-ref <ref>` then
--   `supabase db push` from the repo root (this file already lives at the
--   path the CLI expects: supabase/migrations/<timestamp>_<name>.sql).
--
-- This file is idempotent-ish (uses IF NOT EXISTS / OR REPLACE where
-- possible) but it is meant to run ONCE against a fresh project. Re-running
-- it against a database that already has these tables will fail on the
-- `create table` statements — that's intentional; future changes should be
-- added as new, separate migration files rather than edits to this one.

-- ============================================================================
-- Extensions
-- ============================================================================

-- Geospatial support for the `properties.location` column (map search).
create extension if not exists postgis;

-- ============================================================================
-- Helper functions (created before the tables/policies that use them)
-- ============================================================================

-- Returns true if the currently authenticated user has the 'admin' role.
-- SECURITY DEFINER + a pinned search_path lets this safely read
-- public.profiles from inside a policy on another table without RLS
-- recursion and without being hijackable via a hostile search_path.
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public, pg_temp
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- Generic updated_at maintenance trigger.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================================
-- Table: profiles
-- One row per auth.users row (1:1), created automatically on signup via the
-- trigger below. This is where app-specific user data lives, since
-- auth.users itself is managed by Supabase Auth and shouldn't be modified
-- directly.
-- ============================================================================

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null default 'user' check (role in ('user', 'admin')),
  display_name text,
  phone text,
  locale text not null default 'fr' check (locale in ('fr', 'ar', 'en')),
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'App-specific data for each authenticated user, 1:1 with auth.users.';
comment on column public.profiles.role is 'Authorization role, enforced via RLS (see is_admin()). Not editable by the user themselves.';

create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Auto-create a profile row whenever a new auth user is created (email/password
-- signup or OAuth). SECURITY DEFINER is required here because this runs
-- during the signup transaction, before the new user has any session/JWT of
-- their own to satisfy RLS with.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================================
-- Table: categories
-- Property type lookup (apartment, villa, land, ...), trilingual labels.
-- Admin-editable so new categories don't require a code deploy.
-- ============================================================================

create table public.categories (
  id smallint generated always as identity primary key,
  slug text not null unique,
  name_fr text not null,
  name_ar text not null,
  name_en text not null,
  icon text,
  sort_order smallint not null default 0
);

comment on table public.categories is 'Property type lookup (apartment, villa, land, ...), trilingual labels.';

insert into public.categories (slug, name_fr, name_ar, name_en, icon, sort_order) values
  ('apartment',  'Appartement',        'شقة',           'Apartment',  'building-2',  1),
  ('house',      'Maison',             'منزل',          'House',      'home',        2),
  ('villa',      'Villa',              'فيلا',          'Villa',      'landmark',    3),
  ('land',       'Terrain',            'أرض',           'Land',       'map',         4),
  ('office',     'Bureau',             'مكتب',          'Office',     'briefcase',   5),
  ('shop',       'Local commercial',   'محل تجاري',      'Shop',       'store',       6),
  ('warehouse',  'Entrepôt / Hangar',  'مستودع',        'Warehouse',  'warehouse',   7),
  ('farm',       'Ferme / Agricole',   'أرض فلاحية',     'Farm',       'tractor',     8);

-- ============================================================================
-- Table: locations
-- Reference list of Tunisia's governorates (and optionally delegations),
-- used to populate search filter dropdowns and to center/zoom the map.
-- Coordinates are approximate governorate-capital centroids, not surveyed —
-- good enough for map defaults, not for anything precision-dependent.
-- ============================================================================

create table public.locations (
  id smallint generated always as identity primary key,
  governorate text not null,
  delegation text,
  latitude double precision not null,
  longitude double precision not null,
  unique (governorate, delegation)
);

comment on table public.locations is 'Tunisia governorates (delegation NULL = governorate-level centroid). Reference data for filters + map defaults.';

insert into public.locations (governorate, delegation, latitude, longitude) values
  ('Tunis',          null, 36.8065, 10.1815),
  ('Ariana',         null, 36.8625, 10.1956),
  ('Ben Arous',      null, 36.7531, 10.2189),
  ('Manouba',        null, 36.8081, 10.0972),
  ('Nabeul',         null, 36.4561, 10.7376),
  ('Zaghouan',       null, 36.4028, 10.1429),
  ('Bizerte',        null, 37.2746, 9.8739),
  ('Béja',           null, 36.7256, 9.1817),
  ('Jendouba',       null, 36.5011, 8.7757),
  ('Le Kef',         null, 36.1742, 8.7049),
  ('Siliana',        null, 36.0836, 9.3708),
  ('Sousse',         null, 35.8254, 10.6360),
  ('Monastir',       null, 35.7780, 10.8262),
  ('Mahdia',         null, 35.5047, 11.0622),
  ('Sfax',           null, 34.7406, 10.7603),
  ('Kairouan',       null, 35.6781, 10.0963),
  ('Kasserine',      null, 35.1676, 8.8365),
  ('Sidi Bouzid',    null, 35.0381, 9.4858),
  ('Gabès',          null, 33.8881, 10.0975),
  ('Médenine',       null, 33.3399, 10.5055),
  ('Tataouine',      null, 32.9297, 10.4518),
  ('Gafsa',          null, 34.4250, 8.7842),
  ('Tozeur',         null, 33.9197, 8.1335),
  ('Kébili',         null, 33.7044, 8.9690);

-- ============================================================================
-- Table: properties
-- The core listing. `status` drives the moderation workflow: new listings
-- are created as 'draft' or 'pending' by their owner; only an admin (via a
-- service-role-backed moderation action, added in a later phase) can move a
-- listing to 'published' or 'rejected' — see the RLS policies below, which
-- enforce this at the database level, not just in app code.
-- ============================================================================

create table public.properties (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  category_id smallint references public.categories (id),
  transaction_type text not null check (transaction_type in ('sale', 'rent')),
  title text not null check (char_length(title) between 3 and 200),
  description text,
  price numeric(12, 2) not null check (price >= 0),
  currency text not null default 'TND',
  surface_area numeric(10, 2) check (surface_area is null or surface_area > 0),
  rooms smallint check (rooms is null or rooms >= 0),
  bedrooms smallint check (bedrooms is null or bedrooms >= 0),
  bathrooms smallint check (bathrooms is null or bathrooms >= 0),
  governorate text not null,
  city text not null,
  address_text text,
  location geography(Point, 4326),
  status text not null default 'pending'
    check (status in ('draft', 'pending', 'published', 'rejected', 'archived')),
  rejection_reason text,
  views_count integer not null default 0,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.properties is 'Property listings. status=pending is the moderation queue; only admins can set published/rejected (enforced by RLS).';

create trigger set_properties_updated_at
  before update on public.properties
  for each row execute function public.set_updated_at();

-- Matches the filter bar: location + transaction/category + price range.
create index properties_filter_idx
  on public.properties (governorate, city, transaction_type, category_id, price);

-- Map / "search this area" queries.
create index properties_location_gix
  on public.properties using gist (location);

create index properties_owner_idx on public.properties (owner_id);
create index properties_status_idx on public.properties (status);

-- ============================================================================
-- Table: property_images
-- ============================================================================

create table public.property_images (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties (id) on delete cascade,
  storage_path text not null,
  position smallint not null default 0,
  width int,
  height int,
  created_at timestamptz not null default now()
);

comment on column public.property_images.storage_path is 'Object key in Supabase Storage (early phases) or Cloudflare R2 (post-launch), not a full URL.';

create index property_images_property_idx on public.property_images (property_id, position);

-- ============================================================================
-- Table: favorites
-- ============================================================================

create table public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  property_id uuid not null references public.properties (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, property_id)
);

-- ============================================================================
-- Table: reports
-- Anonymous reporting is allowed on purpose (fraud/spam reporting shouldn't
-- require an account), but only admins can read the queue.
-- ============================================================================

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties (id) on delete cascade,
  reporter_id uuid references public.profiles (id) on delete set null,
  reason text not null
    check (reason in ('fraud', 'duplicate', 'sold', 'wrong_info', 'inappropriate', 'other')),
  details text,
  status text not null default 'pending'
    check (status in ('pending', 'reviewed', 'dismissed', 'actioned')),
  created_at timestamptz not null default now()
);

create index reports_property_idx on public.reports (property_id);
create index reports_status_idx on public.reports (status);

-- ============================================================================
-- Table: contact_requests
-- Contacting a seller doesn't require an account either (consistent with
-- the "no-account browsing" requirement); the property owner can read the
-- requests addressed to their own listings.
-- ============================================================================

create table public.contact_requests (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties (id) on delete cascade,
  sender_name text not null,
  sender_email text,
  sender_phone text,
  message text not null,
  ip_address inet,
  created_at timestamptz not null default now()
);

create index contact_requests_property_idx on public.contact_requests (property_id);

-- ============================================================================
-- Table: admin_users
-- Extra metadata about admin accounts (who granted the role, with what
-- permissions). The authorization check itself uses profiles.role /
-- is_admin() — this table is bookkeeping, not the source of truth for
-- "is this user an admin", and has no client-facing write policy: granting
-- admin access is a deliberate, out-of-band action (SQL console / service
-- role), never something the app exposes a button for.
-- ============================================================================

create table public.admin_users (
  profile_id uuid primary key references public.profiles (id) on delete cascade,
  granted_by uuid references public.profiles (id),
  permissions text[] not null default array['moderate_listings'],
  notes text,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- Table: property_views
-- Lightweight view log for view counts / basic fraud signals (e.g. one
-- account or IP spamming views on its own listing). ip_hash should be a
-- salted hash computed by the server, never a raw IP, to avoid storing PII
-- longer than needed.
-- ============================================================================

create table public.property_views (
  id bigint generated always as identity primary key,
  property_id uuid not null references public.properties (id) on delete cascade,
  viewer_id uuid references public.profiles (id) on delete set null,
  ip_hash text,
  viewed_at timestamptz not null default now()
);

create index property_views_property_idx on public.property_views (property_id, viewed_at desc);

-- ============================================================================
-- Row Level Security
-- ============================================================================

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.locations enable row level security;
alter table public.properties enable row level security;
alter table public.property_images enable row level security;
alter table public.favorites enable row level security;
alter table public.reports enable row level security;
alter table public.contact_requests enable row level security;
alter table public.admin_users enable row level security;
alter table public.property_views enable row level security;

-- profiles: read own row (or any row, if admin); update own row only.
-- No client-side insert policy — rows are created solely by handle_new_user().
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

create policy "profiles_select_admin" on public.profiles
  for select using (public.is_admin());

create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id)
  with check (auth.uid() = id);

-- categories / locations: public read-only reference data, admin-managed.
create policy "categories_select_all" on public.categories
  for select using (true);

create policy "categories_admin_write" on public.categories
  for all using (public.is_admin()) with check (public.is_admin());

create policy "locations_select_all" on public.locations
  for select using (true);

create policy "locations_admin_write" on public.locations
  for all using (public.is_admin()) with check (public.is_admin());

-- properties: published listings are public; owners always see their own;
-- admins see everything. Owners may create/update drafts and pending
-- listings, but cannot set status to 'published'/'rejected' themselves —
-- that transition is admin-only (moderation).
create policy "properties_select_published" on public.properties
  for select using (status = 'published');

create policy "properties_select_own" on public.properties
  for select using (auth.uid() = owner_id);

create policy "properties_select_admin" on public.properties
  for select using (public.is_admin());

create policy "properties_insert_own" on public.properties
  for insert with check (auth.uid() = owner_id and status in ('draft', 'pending'));

create policy "properties_update_own" on public.properties
  for update using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id and status in ('draft', 'pending', 'archived'));

create policy "properties_update_admin" on public.properties
  for update using (public.is_admin()) with check (public.is_admin());

create policy "properties_delete_own" on public.properties
  for delete using (auth.uid() = owner_id);

create policy "properties_delete_admin" on public.properties
  for delete using (public.is_admin());

-- property_images: visible wherever the parent property is visible;
-- manageable by the property's owner or an admin.
create policy "property_images_select_published" on public.property_images
  for select using (
    exists (
      select 1 from public.properties p
      where p.id = property_images.property_id and p.status = 'published'
    )
  );

create policy "property_images_select_own" on public.property_images
  for select using (
    exists (
      select 1 from public.properties p
      where p.id = property_images.property_id and p.owner_id = auth.uid()
    )
  );

create policy "property_images_select_admin" on public.property_images
  for select using (public.is_admin());

create policy "property_images_write_own" on public.property_images
  for all using (
    exists (
      select 1 from public.properties p
      where p.id = property_images.property_id and p.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.properties p
      where p.id = property_images.property_id and p.owner_id = auth.uid()
    )
  );

create policy "property_images_write_admin" on public.property_images
  for all using (public.is_admin()) with check (public.is_admin());

-- favorites: fully private to each user.
create policy "favorites_owner_only" on public.favorites
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- reports: anyone (incl. anonymous) can file one; only admins can read/triage.
create policy "reports_insert_any" on public.reports
  for insert with check (true);

create policy "reports_select_admin" on public.reports
  for select using (public.is_admin());

create policy "reports_update_admin" on public.reports
  for update using (public.is_admin());

-- contact_requests: anyone can send one; the listing owner and admins can read.
create policy "contact_requests_insert_any" on public.contact_requests
  for insert with check (true);

create policy "contact_requests_select_owner" on public.contact_requests
  for select using (
    exists (
      select 1 from public.properties p
      where p.id = contact_requests.property_id and p.owner_id = auth.uid()
    )
  );

create policy "contact_requests_select_admin" on public.contact_requests
  for select using (public.is_admin());

-- admin_users: admin-readable only; no policy grants client-side writes.
create policy "admin_users_select_admin" on public.admin_users
  for select using (public.is_admin());

-- property_views: anyone can record a view; owner/admin can read analytics.
create policy "property_views_insert_any" on public.property_views
  for insert with check (true);

create policy "property_views_select_owner" on public.property_views
  for select using (
    exists (
      select 1 from public.properties p
      where p.id = property_views.property_id and p.owner_id = auth.uid()
    )
  );

create policy "property_views_select_admin" on public.property_views
  for select using (public.is_admin());

-- ============================================================================
-- Grants
-- Supabase's default template already grants table privileges on `public`
-- to anon/authenticated and relies on RLS as the real gate, but we set this
-- explicitly so the migration is self-contained and doesn't depend on
-- dashboard defaults that can vary between projects.
-- ============================================================================

grant usage on schema public to anon, authenticated;

-- Public reference data.
grant select on public.categories, public.locations to anon, authenticated;

-- Listings + images: readable by anyone (RLS narrows anon to status='published'),
-- fully manageable by authenticated users (RLS narrows to own rows / admin).
grant select on public.properties, public.property_images to anon;
grant select, insert, update, delete on public.properties, public.property_images to authenticated;

-- Favorites and the user's own profile: authenticated users only.
grant select, insert, update, delete on public.favorites to authenticated;
grant select, update on public.profiles to authenticated;

-- Reports / contact requests / view log: anyone may insert (RLS allows
-- anonymous submissions by design); only authenticated users ever read rows
-- back, and RLS further narrows that to the listing's owner or an admin.
grant insert on public.reports, public.contact_requests, public.property_views to anon, authenticated;
grant select, update on public.reports to authenticated;
grant select on public.contact_requests, public.property_views to authenticated;

-- Admin bookkeeping: readable only (RLS: admins only); no client-side writes.
grant select on public.admin_users to authenticated;
