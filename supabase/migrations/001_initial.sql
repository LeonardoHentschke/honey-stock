-- =============================================================================
-- Honey Stock — Schema inicial
-- Sprint 0: aplicar este arquivo no SQL Editor do Supabase
--
-- Pré-requisitos (Database → Extensions):
--   ✅ pgcrypto   (provavelmente já habilitado)
--   ✅ pg_cron    (habilitar manualmente)
--   ✅ pg_net     (habilitar manualmente)
-- =============================================================================

-- =====================================================
-- Extensões
-- =====================================================
create extension if not exists "pgcrypto";
create extension if not exists "pg_cron";
create extension if not exists "pg_net";

-- =====================================================
-- companies
-- =====================================================
create table companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  invite_code text unique not null default upper(substr(md5(random()::text), 1, 6)),
  created_at timestamptz not null default now()
);

-- =====================================================
-- profiles
-- =====================================================
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  company_id uuid not null references companies(id) on delete restrict,
  full_name text not null,
  created_at timestamptz not null default now()
);
create index on profiles(company_id);

-- =====================================================
-- device_tokens
-- =====================================================
create table device_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  company_id uuid not null references companies(id) on delete cascade,
  expo_push_token text not null unique,
  platform text not null,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);
create index on device_tokens(user_id);

-- =====================================================
-- categories
-- =====================================================
create table categories (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique (company_id, name)
);
create index on categories(company_id);

-- =====================================================
-- products
-- =====================================================
create table products (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  category_id uuid references categories(id) on delete set null,
  name text not null,
  description text,
  honey_type text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on products(company_id);

-- =====================================================
-- product_variants
-- =====================================================
create table product_variants (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  sku text not null,
  packaging text,
  weight_grams numeric(10,2),
  unit text not null default 'un',
  cost_price numeric(12,2) not null default 0,
  sale_price numeric(12,2) not null default 0,
  reseller_price numeric(12,2),
  stock_quantity numeric(12,3) not null default 0,
  min_stock numeric(12,3) not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, sku)
);
create index on product_variants(company_id);
create index on product_variants(product_id);

-- =====================================================
-- batches
-- =====================================================
create table batches (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  code text not null,
  harvested_at date,
  expires_at date,
  notes text,
  created_at timestamptz not null default now(),
  unique (company_id, code)
);
create index on batches(company_id);

-- =====================================================
-- suppliers
-- =====================================================
create table suppliers (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  name text not null,
  document text, phone text, email text, address text, notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on suppliers(company_id);

-- =====================================================
-- customers
-- =====================================================
create type customer_type as enum ('final', 'reseller');

create table customers (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  type customer_type not null default 'final',
  name text not null,
  business_name text,
  document text,
  phone text,
  email text,
  address text,
  reseller_discount_percent numeric(5,2),
  notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on customers(company_id);
create index on customers(type);

-- =====================================================
-- stock_movements
-- =====================================================
create type stock_movement_type as enum ('in', 'out', 'adjust', 'sale');

create table stock_movements (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  variant_id uuid not null references product_variants(id) on delete restrict,
  batch_id uuid references batches(id) on delete set null,
  type stock_movement_type not null,
  quantity numeric(12,3) not null,
  unit_cost numeric(12,2),
  supplier_id uuid references suppliers(id) on delete set null,
  reference_type text,
  reference_id uuid,
  notes text,
  user_id uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);
create index on stock_movements(company_id);
create index on stock_movements(variant_id);
create index on stock_movements(created_at desc);

-- =====================================================
-- sales
-- =====================================================
create type sale_status as enum ('scheduled', 'completed', 'delivered', 'canceled');
create type payment_method as enum ('cash', 'card', 'pix', 'credit', 'other');
create type sale_channel as enum ('store', 'fair', 'delivery', 'resale', 'other');

create table sales (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  customer_id uuid references customers(id) on delete set null,
  user_id uuid not null references auth.users(id),
  total numeric(12,2) not null default 0,
  discount numeric(12,2) not null default 0,
  payment_method payment_method not null default 'cash',
  channel sale_channel not null default 'store',
  status sale_status not null default 'completed',
  scheduled_for timestamptz,
  notes text,
  created_at timestamptz not null default now()
);
create index on sales(company_id);
create index on sales(created_at desc);
create index on sales(scheduled_for) where scheduled_for is not null;

-- =====================================================
-- sale_items
-- =====================================================
create table sale_items (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references sales(id) on delete cascade,
  variant_id uuid not null references product_variants(id) on delete restrict,
  batch_id uuid references batches(id) on delete set null,
  quantity numeric(12,3) not null,
  unit_price numeric(12,2) not null,
  subtotal numeric(12,2) not null
);
create index on sale_items(sale_id);

-- =====================================================
-- reminders
-- =====================================================
create type reminder_status as enum ('pending', 'sent', 'canceled', 'failed');

create table reminders (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  sale_id uuid references sales(id) on delete cascade,
  created_by uuid not null references auth.users(id),
  title text not null,
  body text,
  remind_at timestamptz not null,
  status reminder_status not null default 'pending',
  sent_at timestamptz,
  error text,
  created_at timestamptz not null default now()
);
create index on reminders(company_id);
create index on reminders(remind_at) where status = 'pending';
create index on reminders(sale_id);

create table reminder_recipients (
  reminder_id uuid not null references reminders(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  primary key (reminder_id, user_id)
);

-- =====================================================
-- Triggers — updated_at
-- =====================================================
create or replace function set_updated_at() returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

create trigger trg_products_updated   before update on products
  for each row execute function set_updated_at();
create trigger trg_variants_updated   before update on product_variants
  for each row execute function set_updated_at();
create trigger trg_customers_updated  before update on customers
  for each row execute function set_updated_at();
create trigger trg_suppliers_updated  before update on suppliers
  for each row execute function set_updated_at();

-- =====================================================
-- Trigger — aplica movimentação de estoque
-- =====================================================
create or replace function apply_stock_movement() returns trigger as $$
begin
  if new.type = 'in' then
    update product_variants set stock_quantity = stock_quantity + new.quantity
    where id = new.variant_id;
  elsif new.type in ('out', 'sale') then
    update product_variants set stock_quantity = stock_quantity - new.quantity
    where id = new.variant_id;
  elsif new.type = 'adjust' then
    update product_variants set stock_quantity = new.quantity
    where id = new.variant_id;
  end if;
  return new;
end; $$ language plpgsql;

create trigger trg_apply_stock after insert on stock_movements
  for each row execute function apply_stock_movement();

-- =====================================================
-- Trigger — ao inserir sale_item, cria movement de venda
-- (apenas para vendas não agendadas/canceladas)
-- =====================================================
create or replace function create_sale_movement() returns trigger as $$
declare v_company uuid; v_user uuid; v_status sale_status;
begin
  select company_id, user_id, status into v_company, v_user, v_status
  from sales where id = new.sale_id;
  if v_status in ('scheduled','canceled') then return new; end if;
  insert into stock_movements
    (company_id, variant_id, batch_id, type, quantity, reference_type, reference_id, user_id)
  values
    (v_company, new.variant_id, new.batch_id, 'sale', new.quantity, 'sale', new.sale_id, v_user);
  return new;
end; $$ language plpgsql;

create trigger trg_sale_item_movement after insert on sale_items
  for each row execute function create_sale_movement();

-- =====================================================
-- Trigger — ao marcar venda agendada como entregue/concluída
-- =====================================================
create or replace function on_sale_status_change() returns trigger as $$
begin
  if old.status = 'scheduled' and new.status in ('completed','delivered') then
    insert into stock_movements
      (company_id, variant_id, batch_id, type, quantity, reference_type, reference_id, user_id)
    select new.company_id, si.variant_id, si.batch_id, 'sale', si.quantity, 'sale', new.id, new.user_id
    from sale_items si where si.sale_id = new.id;
  end if;
  return new;
end; $$ language plpgsql;

create trigger trg_sale_status_change after update of status on sales
  for each row execute function on_sale_status_change();

-- =====================================================
-- RLS — habilitar em todas as tabelas
-- =====================================================
alter table companies            enable row level security;
alter table profiles             enable row level security;
alter table device_tokens        enable row level security;
alter table categories           enable row level security;
alter table products             enable row level security;
alter table product_variants     enable row level security;
alter table batches              enable row level security;
alter table suppliers            enable row level security;
alter table customers            enable row level security;
alter table stock_movements      enable row level security;
alter table sales                enable row level security;
alter table sale_items           enable row level security;
alter table reminders            enable row level security;
alter table reminder_recipients  enable row level security;

-- Helper: retorna company_id do usuário autenticado
create or replace function current_company_id() returns uuid
language sql stable security definer as $$
  select company_id from profiles where id = auth.uid()
$$;

-- Políticas por tabela
create policy "own_company_all" on categories       for all using (company_id = current_company_id());
create policy "own_company_all" on products         for all using (company_id = current_company_id());
create policy "own_company_all" on product_variants for all using (company_id = current_company_id());
create policy "own_company_all" on batches          for all using (company_id = current_company_id());
create policy "own_company_all" on suppliers        for all using (company_id = current_company_id());
create policy "own_company_all" on customers        for all using (company_id = current_company_id());
create policy "own_company_all" on stock_movements  for all using (company_id = current_company_id());
create policy "own_company_all" on sales            for all using (company_id = current_company_id());
create policy "own_company_all" on reminders        for all using (company_id = current_company_id());

create policy "own_company_companies" on companies for all using (id = current_company_id());
create policy "own_profile_select"    on profiles  for select using (company_id = current_company_id());
create policy "own_profile_update"    on profiles  for update using (id = auth.uid());

create policy "own_company_sale_items" on sale_items for all using (
  exists (select 1 from sales s where s.id = sale_id and s.company_id = current_company_id())
);
create policy "own_company_reminder_recipients" on reminder_recipients for all using (
  exists (select 1 from reminders r where r.id = reminder_id and r.company_id = current_company_id())
);
create policy "own_device_tokens" on device_tokens for all using (user_id = auth.uid());

-- =====================================================
-- RPC — pick_due_reminders (usado pelo Edge Function)
-- =====================================================
create or replace function pick_due_reminders(p_limit int default 100)
returns table (
  id uuid,
  title text,
  body text,
  sale_id uuid,
  recipient_ids uuid[]
)
language sql security definer as $$
  with picked as (
    select r.id
    from reminders r
    where r.status = 'pending' and r.remind_at <= now()
    order by r.remind_at
    limit p_limit
    for update skip locked
  ),
  updated as (
    update reminders
    set status = 'sent', sent_at = now()
    where id in (select id from picked)
    returning *
  )
  select
    u.id,
    u.title,
    u.body,
    u.sale_id,
    array(
      select rr.user_id from reminder_recipients rr where rr.reminder_id = u.id
    ) as recipient_ids
  from updated u;
$$;
