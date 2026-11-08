-- YumGo initial schema
-- Run this in the Supabase SQL Editor (or with `supabase db push`).
-- Defines the production tables, row-level security and triggers used by the
-- Vercel deployment.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
do $$ begin
  create type public.user_role as enum ('customer', 'admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.account_status as enum ('active', 'blocked');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.order_status as enum (
    'pending_payment',
    'confirmed',
    'preparing',
    'on_the_way',
    'delivered',
    'cancelled'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.payment_method as enum (
    'cod'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.payment_status as enum ('unpaid', 'paid', 'refunded');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.promotion_type as enum ('percentage', 'fixed');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Profiles (one row per Supabase auth user)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default 'YumGo User',
  email text not null unique,
  phone text not null default '',
  role public.user_role not null default 'customer',
  avatar_color text not null default '#00B14F',
  status public.account_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Security-definer helper so admin policies can inspect profiles without
-- triggering recursive row-level-security checks. Defined after the table
-- because SQL functions are validated when they are created.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
      and status = 'active'
  );
$$;

-- Automatically create a profile when someone signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, email, phone, role)
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data->>'full_name', ''),
      nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
      'YumGo User'
    ),
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'phone', ''),
    'customer'::public.user_role
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Prevent a signed-in customer from promoting or unblocking themselves.
create or replace function public.protect_profile_privileges()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- auth.uid() is null for service-role and SQL-editor sessions.
  if auth.uid() is null or public.is_admin() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if new.role <> 'customer'::public.user_role
      or new.status <> 'active'::public.account_status then
      raise exception 'New profiles must start as active customers';
    end if;
  else
    if new.role <> old.role then
      raise exception 'Only an admin can change a profile role';
    end if;
    if new.status <> old.status then
      raise exception 'Only an admin can change a profile status';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_protect_privileges on public.profiles;
create trigger profiles_protect_privileges
  before insert or update on public.profiles
  for each row execute function public.protect_profile_privileges();

-- ---------------------------------------------------------------------------
-- Addresses
-- ---------------------------------------------------------------------------
create table if not exists public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  label text not null default 'Home',
  line text not null,
  township text not null,
  city text not null default 'Yangon',
  lat double precision not null default 16.8505,
  lng double precision not null default 96.1315,
  phone text not null default '',
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists addresses_user_id_idx on public.addresses(user_id);

drop trigger if exists addresses_set_updated_at on public.addresses;
create trigger addresses_set_updated_at
  before update on public.addresses
  for each row execute function public.set_updated_at();

create or replace function public.enforce_single_default_address()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.addresses
  set is_default = false
  where user_id = new.user_id
    and id <> new.id
    and is_default;
  return new;
end;
$$;

drop trigger if exists addresses_single_default on public.addresses;
create trigger addresses_single_default
  after insert or update of is_default on public.addresses
  for each row when (new.is_default)
  execute function public.enforce_single_default_address();

-- ---------------------------------------------------------------------------
-- Catalog
-- ---------------------------------------------------------------------------
create table if not exists public.restaurants (
  id text primary key,
  slug text not null unique,
  name text not null,
  cuisine text not null,
  description text not null default '',
  cover text not null default '',
  logo_color text not null default '#00B14F',
  rating numeric(2, 1) not null default 4.8 check (rating between 0 and 5),
  rating_count integer not null default 0 check (rating_count >= 0),
  delivery_fee integer not null default 0 check (delivery_fee >= 0),
  min_order integer not null default 0 check (min_order >= 0),
  eta_min integer not null default 20 check (eta_min > 0),
  eta_max integer not null default 30 check (eta_max >= eta_min),
  distance_km numeric(4, 1) not null default 1.0 check (distance_km >= 0),
  is_open boolean not null default true,
  is_featured boolean not null default false,
  township text not null default 'Hlaing',
  address text not null default '',
  hours text not null default '',
  lat double precision not null default 16.8505,
  lng double precision not null default 96.1315,
  tags text[] not null default '{}',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists restaurants_set_updated_at on public.restaurants;
create trigger restaurants_set_updated_at
  before update on public.restaurants
  for each row execute function public.set_updated_at();

create table if not exists public.menu_categories (
  id text primary key,
  restaurant_id text not null references public.restaurants(id) on delete cascade,
  name text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists menu_categories_restaurant_idx
  on public.menu_categories(restaurant_id);

create table if not exists public.menu_items (
  id text primary key,
  category_id text not null references public.menu_categories(id) on delete cascade,
  name text not null,
  description text not null default '',
  price integer not null check (price >= 0),
  image text not null default '',
  is_popular boolean not null default false,
  is_available boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists menu_items_category_idx on public.menu_items(category_id);

drop trigger if exists menu_items_set_updated_at on public.menu_items;
create trigger menu_items_set_updated_at
  before update on public.menu_items
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Orders
-- ---------------------------------------------------------------------------
create table if not exists public.orders (
  id text primary key default ('ord-' || replace(gen_random_uuid()::text, '-', '')),
  code text not null unique,
  user_id uuid references public.profiles(id) on delete set null,
  user_email text not null,
  customer_name text not null,
  customer_phone text not null default '',
  restaurant_id text references public.restaurants(id) on delete set null,
  restaurant_name text not null,
  restaurant_image text not null default '',
  restaurant_township text not null default '',
  items jsonb not null default '[]'::jsonb,
  subtotal integer not null default 0 check (subtotal >= 0),
  delivery_fee integer not null default 0 check (delivery_fee >= 0),
  service_fee integer not null default 0 check (service_fee >= 0),
  discount integer not null default 0 check (discount >= 0),
  total integer not null default 0 check (total >= 0),
  status public.order_status not null default 'pending_payment',
  payment_method public.payment_method not null default 'cod',
  payment_status public.payment_status not null default 'unpaid',
  address text not null default '',
  lat double precision not null default 16.8505,
  lng double precision not null default 96.1315,
  notes text not null default '',
  driver jsonb not null default '{}'::jsonb,
  events jsonb not null default '[]'::jsonb,
  auto_advance boolean not null default false,
  placed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists orders_user_id_idx on public.orders(user_id);
create index if not exists orders_user_email_idx on public.orders(user_email);
create index if not exists orders_status_idx on public.orders(status);
create index if not exists orders_placed_at_idx on public.orders(placed_at desc);
create index if not exists orders_restaurant_id_idx on public.orders(restaurant_id);

drop trigger if exists orders_set_updated_at on public.orders;
create trigger orders_set_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Reviews, promotions, favorites and saved payment methods
-- ---------------------------------------------------------------------------
create table if not exists public.reviews (
  id text primary key default ('rev-' || replace(gen_random_uuid()::text, '-', '')),
  restaurant_id text not null references public.restaurants(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  user_name text not null,
  rating integer not null check (rating between 1 and 5),
  comment text not null default '',
  is_approved boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists reviews_restaurant_idx on public.reviews(restaurant_id);
create index if not exists reviews_approved_idx on public.reviews(is_approved);

drop trigger if exists reviews_set_updated_at on public.reviews;
create trigger reviews_set_updated_at
  before update on public.reviews
  for each row execute function public.set_updated_at();

create table if not exists public.promotions (
  id text primary key default ('promo-' || replace(gen_random_uuid()::text, '-', '')),
  code text not null unique,
  description text not null,
  type public.promotion_type not null default 'percentage',
  value integer not null check (value > 0),
  min_order integer not null default 0 check (min_order >= 0),
  max_discount integer check (max_discount is null or max_discount >= 0),
  ends_at timestamptz not null,
  is_active boolean not null default true,
  usage_count integer not null default 0 check (usage_count >= 0),
  usage_limit integer not null default 1000 check (usage_limit > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists promotions_active_idx on public.promotions(is_active, ends_at);

drop trigger if exists promotions_set_updated_at on public.promotions;
create trigger promotions_set_updated_at
  before update on public.promotions
  for each row execute function public.set_updated_at();

create table if not exists public.favorites (
  user_id uuid not null references public.profiles(id) on delete cascade,
  restaurant_id text not null references public.restaurants(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, restaurant_id)
);

create table if not exists public.payment_methods (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type public.payment_method not null,
  label text not null,
  detail text not null default '',
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists payment_methods_user_idx on public.payment_methods(user_id);

drop trigger if exists payment_methods_set_updated_at on public.payment_methods;
create trigger payment_methods_set_updated_at
  before update on public.payment_methods
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.addresses enable row level security;
alter table public.restaurants enable row level security;
alter table public.menu_categories enable row level security;
alter table public.menu_items enable row level security;
alter table public.orders enable row level security;
alter table public.reviews enable row level security;
alter table public.promotions enable row level security;
alter table public.favorites enable row level security;
alter table public.payment_methods enable row level security;

-- Profiles
drop policy if exists "Profiles are readable by owner or admin" on public.profiles;
create policy "Profiles are readable by owner or admin"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id or public.is_admin());

drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id or public.is_admin())
  with check (auth.uid() = id or public.is_admin());

-- Addresses
drop policy if exists "Addresses are managed by their owner" on public.addresses;
create policy "Addresses are managed by their owner"
  on public.addresses for all
  to authenticated
  using (auth.uid() = user_id or public.is_admin())
  with check (auth.uid() = user_id or public.is_admin());

-- Catalog: public read, admin write
drop policy if exists "Restaurants are publicly readable" on public.restaurants;
create policy "Restaurants are publicly readable"
  on public.restaurants for select
  using (true);

drop policy if exists "Admins can manage restaurants" on public.restaurants;
create policy "Admins can manage restaurants"
  on public.restaurants for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Menu categories are publicly readable" on public.menu_categories;
create policy "Menu categories are publicly readable"
  on public.menu_categories for select
  using (true);

drop policy if exists "Admins can manage menu categories" on public.menu_categories;
create policy "Admins can manage menu categories"
  on public.menu_categories for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Menu items are publicly readable" on public.menu_items;
create policy "Menu items are publicly readable"
  on public.menu_items for select
  using (true);

drop policy if exists "Admins can manage menu items" on public.menu_items;
create policy "Admins can manage menu items"
  on public.menu_items for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Orders
drop policy if exists "Customers can read their own orders" on public.orders;
create policy "Customers can read their own orders"
  on public.orders for select
  to authenticated
  using (
    auth.uid() = user_id
    or user_email = (auth.jwt() ->> 'email')
    or public.is_admin()
  );

drop policy if exists "Customers can create their own orders" on public.orders;
create policy "Customers can create their own orders"
  on public.orders for insert
  to authenticated
  with check (auth.uid() = user_id or user_id is null);

drop policy if exists "Admins can update orders" on public.orders;
create policy "Admins can update orders"
  on public.orders for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Admins can delete orders" on public.orders;
create policy "Admins can delete orders"
  on public.orders for delete
  to authenticated
  using (public.is_admin());

-- Reviews
drop policy if exists "Approved reviews are publicly readable" on public.reviews;
create policy "Approved reviews are publicly readable"
  on public.reviews for select
  using (is_approved or public.is_admin());

drop policy if exists "Customers can submit reviews" on public.reviews;
create policy "Customers can submit reviews"
  on public.reviews for insert
  to authenticated
  with check (auth.uid() = user_id and is_approved = false);

drop policy if exists "Admins can moderate reviews" on public.reviews;
create policy "Admins can moderate reviews"
  on public.reviews for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Admins can delete reviews" on public.reviews;
create policy "Admins can delete reviews"
  on public.reviews for delete
  to authenticated
  using (public.is_admin());

-- Promotions
drop policy if exists "Active promotions are publicly readable" on public.promotions;
create policy "Active promotions are publicly readable"
  on public.promotions for select
  using ((is_active and ends_at > now()) or public.is_admin());

drop policy if exists "Admins can manage promotions" on public.promotions;
create policy "Admins can manage promotions"
  on public.promotions for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Favorites
drop policy if exists "Favorites belong to their owner" on public.favorites;
create policy "Favorites belong to their owner"
  on public.favorites for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Payment methods
drop policy if exists "Payment methods belong to their owner" on public.payment_methods;
create policy "Payment methods belong to their owner"
  on public.payment_methods for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Storage buckets for menu photography and avatars
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values
  ('menu-images', 'menu-images', true),
  ('avatars', 'avatars', true)
on conflict (id) do nothing;

drop policy if exists "Public can read YumGo images" on storage.objects;
create policy "Public can read YumGo images"
  on storage.objects for select
  using (bucket_id in ('menu-images', 'avatars'));

drop policy if exists "Admins can upload YumGo images" on storage.objects;
create policy "Admins can upload YumGo images"
  on storage.objects for insert
  to authenticated
  with check (bucket_id in ('menu-images', 'avatars') and public.is_admin());

drop policy if exists "Admins can update YumGo images" on storage.objects;
create policy "Admins can update YumGo images"
  on storage.objects for update
  to authenticated
  using (bucket_id in ('menu-images', 'avatars') and public.is_admin())
  with check (bucket_id in ('menu-images', 'avatars') and public.is_admin());

drop policy if exists "Admins can delete YumGo images" on storage.objects;
create policy "Admins can delete YumGo images"
  on storage.objects for delete
  to authenticated
  using (bucket_id in ('menu-images', 'avatars') and public.is_admin());

-- ---------------------------------------------------------------------------
-- Realtime
-- ---------------------------------------------------------------------------
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'orders'
    ) then
      execute 'alter publication supabase_realtime add table public.orders';
    end if;

    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'reviews'
    ) then
      execute 'alter publication supabase_realtime add table public.reviews';
    end if;

    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'restaurants'
    ) then
      execute 'alter publication supabase_realtime add table public.restaurants';
    end if;
  end if;
end $$;
