-- =====================================================
-- 007 — finalizar pivô "sem variantes" (product_id direto)
-- =====================================================
-- Contexto: o código já usa product_id em sale_items e stock_movements e lê
-- estoque/preço direto de products, mas o banco ainda referenciava
-- product_variants (variant_id) em ambas as tabelas, e os triggers de estoque
-- operavam sobre product_variants. Isso quebrava:
--   • dashboard  → embed sale_items→products (PGRST200, 400)
--   • criação de venda / movimentação de estoque → coluna product_id inexistente
--
-- Seguro: no momento da migração as tabelas variantes/itens/movimentos estão
-- vazias (0 variants, 0 sale_items, 0 stock_movements), então não há backfill.
-- Idempotente onde possível.

-- ── sale_items: variant_id → product_id ────────────────────────────────
alter table sale_items add column if not exists product_id uuid references products(id) on delete restrict;
alter table sale_items drop column if exists variant_id;
alter table sale_items drop column if exists batch_id;
alter table sale_items alter column product_id set not null;

-- ── stock_movements: variant_id → product_id ───────────────────────────
alter table stock_movements add column if not exists product_id uuid references products(id) on delete restrict;
alter table stock_movements drop column if exists variant_id;
alter table stock_movements drop column if exists batch_id;
alter table stock_movements drop column if exists supplier_id;
alter table stock_movements alter column product_id set not null;
create index if not exists stock_movements_product_id_idx on stock_movements(product_id);

-- ── triggers de estoque: operar sobre products ─────────────────────────
create or replace function apply_stock_movement() returns trigger as $$
begin
  if new.type = 'in' then
    update products set stock_quantity = stock_quantity + new.quantity where id = new.product_id;
  elsif new.type in ('out', 'sale') then
    update products set stock_quantity = stock_quantity - new.quantity where id = new.product_id;
  elsif new.type = 'adjust' then
    update products set stock_quantity = new.quantity where id = new.product_id;
  end if;
  return new;
end; $$ language plpgsql;

create or replace function create_sale_movement() returns trigger as $$
declare v_company uuid; v_user uuid; v_status sale_status;
begin
  select company_id, user_id, status into v_company, v_user, v_status
  from sales where id = new.sale_id;
  if v_status in ('scheduled','canceled') then return new; end if;
  insert into stock_movements
    (company_id, product_id, type, quantity, reference_type, reference_id, user_id)
  values
    (v_company, new.product_id, 'sale', new.quantity, 'sale', new.sale_id, v_user);
  return new;
end; $$ language plpgsql;

create or replace function on_sale_status_change() returns trigger as $$
begin
  if old.status = 'scheduled' and new.status in ('completed','delivered') then
    insert into stock_movements
      (company_id, product_id, type, quantity, reference_type, reference_id, user_id)
    select new.company_id, si.product_id, 'sale', si.quantity, 'sale', new.id, new.user_id
    from sale_items si where si.sale_id = new.id;
  end if;
  return new;
end; $$ language plpgsql;

-- ── remover product_variants (0 linhas) ────────────────────────────────
drop table if exists product_variants cascade;
