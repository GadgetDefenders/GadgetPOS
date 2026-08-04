create extension if not exists pgcrypto;

create table if not exists public.shops (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  address text,
  created_at timestamptz not null default now()
);

create table if not exists public.shop_members (
  shop_id uuid not null references public.shops(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'owner' check (role in ('owner','manager','technician','cashier')),
  created_at timestamptz not null default now(),
  primary key (shop_id, user_id)
);

create table if not exists public.customers (
  id uuid primary key,
  shop_id uuid not null references public.shops(id) on delete cascade,
  name text not null,
  phone text not null,
  email text,
  notes text,
  created_at timestamptz not null,
  updated_at timestamptz
);

create index if not exists customers_shop_phone_idx on public.customers(shop_id, phone);
create index if not exists customers_shop_name_idx on public.customers(shop_id, lower(name));

create table if not exists public.repairs (
  id uuid primary key,
  shop_id uuid not null references public.shops(id) on delete cascade,
  number text not null,
  customer_id uuid not null references public.customers(id) on delete restrict,
  customer_name text not null,
  customer_phone text not null,
  device_type text not null,
  brand text not null,
  model text not null,
  color text,
  serial text,
  passcode text,
  issue text not null,
  part text,
  status text not null,
  technician text,
  priority text not null default 'Normal',
  estimate numeric(12,2) not null default 0,
  created_at timestamptz not null,
  due_date date,
  notes text,
  updated_at timestamptz,
  unique (shop_id, number)
);

create index if not exists repairs_shop_status_idx on public.repairs(shop_id, status);
create index if not exists repairs_shop_customer_idx on public.repairs(shop_id, customer_id);
create index if not exists repairs_shop_serial_idx on public.repairs(shop_id, serial);

create table if not exists public.repair_timeline (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  repair_id uuid not null references public.repairs(id) on delete cascade,
  status text,
  note text not null,
  employee_name text,
  created_at timestamptz not null default now()
);

create index if not exists repair_timeline_repair_idx on public.repair_timeline(repair_id, created_at desc);

create table if not exists public.inventory_items (
  id uuid primary key,
  shop_id uuid not null references public.shops(id) on delete cascade,
  name text not null,
  model text,
  sku text,
  quantity integer not null default 0,
  minimum integer not null default 0,
  cost numeric(12,2) not null default 0,
  price numeric(12,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

create index if not exists inventory_shop_sku_idx on public.inventory_items(shop_id, sku);

alter table public.shops enable row level security;
alter table public.shop_members enable row level security;
alter table public.customers enable row level security;
alter table public.repairs enable row level security;
alter table public.repair_timeline enable row level security;
alter table public.inventory_items enable row level security;

create or replace function public.is_shop_member(target_shop uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.shop_members
    where shop_id = target_shop and user_id = (select auth.uid())
  );
$$;

create policy "members can view shops" on public.shops
for select to authenticated
using (public.is_shop_member(id));

create policy "members can view membership" on public.shop_members
for select to authenticated
using (user_id = (select auth.uid()) or public.is_shop_member(shop_id));

create policy "members manage customers" on public.customers
for all to authenticated
using (public.is_shop_member(shop_id))
with check (public.is_shop_member(shop_id));

create policy "members manage repairs" on public.repairs
for all to authenticated
using (public.is_shop_member(shop_id))
with check (public.is_shop_member(shop_id));

create policy "members manage timeline" on public.repair_timeline
for all to authenticated
using (public.is_shop_member(shop_id))
with check (public.is_shop_member(shop_id));

create policy "members manage inventory" on public.inventory_items
for all to authenticated
using (public.is_shop_member(shop_id))
with check (public.is_shop_member(shop_id));

alter publication supabase_realtime add table public.customers;
alter publication supabase_realtime add table public.repairs;
alter publication supabase_realtime add table public.inventory_items;
