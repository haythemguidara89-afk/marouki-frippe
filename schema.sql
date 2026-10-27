-- ==============================================================================
-- MAROUKI FRIPPE - SUPABASE POSTGRESQL DATABASE SCHEMA
-- Real-time Luxury Vintage Boutique & Cloud Inventory System
-- ==============================================================================

-- 1. Table: Products (Catalogue des Pièces Uniques)
create table if not exists public.products (
    id text primary key,
    name text not null,
    price numeric(10, 2) not null default 0.00,
    category text not null default 'Autres',
    size text not null default 'Unique',
    color text not null default 'Standard',
    status text not null default 'available' check (status in ('available', 'reserved', 'sold')),
    images jsonb not null default '[]'::jsonb,
    description text default '',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists idx_products_status on public.products(status);
create index if not exists idx_products_category on public.products(category);
create index if not exists idx_products_created_at on public.products(created_at desc);

-- 2. Table: Orders (Commandes WhatsApp & Panier Sélections)
create table if not exists public.orders (
    id text primary key,
    customer_name text not null,
    customer_phone text not null,
    customer_city text not null,
    customer_address text not null,
    items jsonb not null default '[]'::jsonb,
    total numeric(10, 2) not null default 0.00,
    status text not null default 'pending' check (status in ('pending', 'confirmed', 'delivered', 'cancelled')),
    mode text not null default 'single' check (mode in ('single', 'bag')),
    notes text default '',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists idx_orders_status on public.orders(status);
create index if not exists idx_orders_created_at on public.orders(created_at desc);

-- 3. Table: Boutique Config (Paramètres & Liens Officiels)
create table if not exists public.boutique_config (
    id text primary key default 'main',
    store_name text not null default 'Marouki Frippe',
    whatsapp_number text not null default '21699000000',
    instagram_url text not null default 'https://www.instagram.com/marouki.fripe/',
    instagram_handle text not null default '@marouki.fripe',
    facebook_url text not null default 'https://www.facebook.com/profile.php?id=100089787764565',
    admin_pin text not null default '1234',
    updated_at timestamptz not null default now()
);

-- Insert default boutique config row if not exists
insert into public.boutique_config (id, store_name, whatsapp_number, instagram_url, instagram_handle, facebook_url, admin_pin)
values (
    'main',
    'Marouki Frippe',
    '21699000000',
    'https://www.instagram.com/marouki.fripe/',
    '@marouki.fripe',
    'https://www.facebook.com/profile.php?id=100089787764565',
    '1234'
) on conflict (id) do nothing;

-- 4. Table: One-Time Passkey Setup Tokens
create table if not exists public.admin_invite_tokens (
    token text primary key,
    admin_name text not null,
    created_by text not null default 'Owner',
    expires_at timestamptz not null default (now() + interval '48 hours'),
    used boolean not null default false,
    used_at timestamptz default null,
    created_at timestamptz not null default now()
);

create index if not exists idx_invite_tokens_used on public.admin_invite_tokens(used);
create index if not exists idx_invite_tokens_expires on public.admin_invite_tokens(expires_at);

-- 5. Table: Registered Admin Passkeys (Biométrie Touch ID / Face ID)
create table if not exists public.admin_passkeys (
    credential_id text primary key,
    admin_name text not null,
    public_key text not null default '',
    raw_id text not null default '',
    recovery_code text default null,
    transports jsonb not null default '["internal"]'::jsonb,
    created_at timestamptz not null default now(),
    last_used_at timestamptz default null
);

create index if not exists idx_admin_passkeys_created on public.admin_passkeys(created_at desc);
create index if not exists idx_admin_passkeys_recovery on public.admin_passkeys(recovery_code);

-- ==============================================================================
-- 6. Row Level Security (RLS) & Permissive Public Policies
-- ==============================================================================

alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.boutique_config enable row level security;
alter table public.admin_invite_tokens enable row level security;
alter table public.admin_passkeys enable row level security;

-- Products Policies
drop policy if exists "Allow public select on products" on public.products;
create policy "Allow public select on products" on public.products for select using (true);

drop policy if exists "Allow public insert on products" on public.products;
create policy "Allow public insert on products" on public.products for insert with check (true);

drop policy if exists "Allow public update on products" on public.products;
create policy "Allow public update on products" on public.products for update using (true) with check (true);

drop policy if exists "Allow public delete on products" on public.products;
create policy "Allow public delete on products" on public.products for delete using (true);

-- Orders Policies
drop policy if exists "Allow public select on orders" on public.orders;
create policy "Allow public select on orders" on public.orders for select using (true);

drop policy if exists "Allow public insert on orders" on public.orders;
create policy "Allow public insert on orders" on public.orders for insert with check (true);

drop policy if exists "Allow public update on orders" on public.orders;
create policy "Allow public update on orders" on public.orders for update using (true) with check (true);

drop policy if exists "Allow public delete on orders" on public.orders;
create policy "Allow public delete on orders" on public.orders for delete using (true);

-- Boutique Config Policies
drop policy if exists "Allow public select on boutique_config" on public.boutique_config;
create policy "Allow public select on boutique_config" on public.boutique_config for select using (true);

drop policy if exists "Allow public update on boutique_config" on public.boutique_config;
create policy "Allow public update on boutique_config" on public.boutique_config for update using (true) with check (true);

drop policy if exists "Allow public insert on boutique_config" on public.boutique_config;
create policy "Allow public insert on boutique_config" on public.boutique_config for insert with check (true);

-- Admin Invite Tokens Policies
drop policy if exists "Allow public select on admin_invite_tokens" on public.admin_invite_tokens;
create policy "Allow public select on admin_invite_tokens" on public.admin_invite_tokens for select using (true);

drop policy if exists "Allow public insert on admin_invite_tokens" on public.admin_invite_tokens;
create policy "Allow public insert on admin_invite_tokens" on public.admin_invite_tokens for insert with check (true);

drop policy if exists "Allow public update on admin_invite_tokens" on public.admin_invite_tokens;
create policy "Allow public update on admin_invite_tokens" on public.admin_invite_tokens for update using (true) with check (true);

drop policy if exists "Allow public delete on admin_invite_tokens" on public.admin_invite_tokens;
create policy "Allow public delete on admin_invite_tokens" on public.admin_invite_tokens for delete using (true);

-- Admin Passkeys Policies
drop policy if exists "Allow public select on admin_passkeys" on public.admin_passkeys;
create policy "Allow public select on admin_passkeys" on public.admin_passkeys for select using (true);

drop policy if exists "Allow public insert on admin_passkeys" on public.admin_passkeys;
create policy "Allow public insert on admin_passkeys" on public.admin_passkeys for insert with check (true);

drop policy if exists "Allow public update on admin_passkeys" on public.admin_passkeys;
create policy "Allow public update on admin_passkeys" on public.admin_passkeys for update using (true) with check (true);

drop policy if exists "Allow public delete on admin_passkeys" on public.admin_passkeys;
create policy "Allow public delete on admin_passkeys" on public.admin_passkeys for delete using (true);

-- ==============================================================================
-- 7. Realtime Publication (Instant live push for products, orders, settings)
-- ==============================================================================
do $$
begin
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'products') then
        alter publication supabase_realtime add table public.products;
    end if;
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'orders') then
        alter publication supabase_realtime add table public.orders;
    end if;
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'boutique_config') then
        alter publication supabase_realtime add table public.boutique_config;
    end if;
end $$;

-- 8. Updated At Trigger
create or replace function public.update_modified_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

drop trigger if exists set_products_updated_at on public.products;
create trigger set_products_updated_at before update on public.products for each row execute function public.update_modified_column();

drop trigger if exists set_orders_updated_at on public.orders;
create trigger set_orders_updated_at before update on public.orders for each row execute function public.update_modified_column();

drop trigger if exists set_boutique_config_updated_at on public.boutique_config;
create trigger set_boutique_config_updated_at before update on public.boutique_config for each row execute function public.update_modified_column();
