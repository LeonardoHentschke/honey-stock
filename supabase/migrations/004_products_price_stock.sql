-- =====================================================
-- 004 — preço/estoque direto em products
-- =====================================================
-- Contexto: o app foi refatorado para tratar preço e estoque no próprio produto
-- (variantes removidas), mas o banco real ainda não tinha essas colunas em `products`,
-- fazendo a listagem mostrar "R$ NaN" / "NaN un".
--
-- Idempotente (add column if not exists) — seguro de rodar mesmo se já existirem.
-- Rodar no SQL editor do Supabase e depois regenerar os tipos:
--   npx supabase gen types typescript --project-id <id> > src/shared/types/database.types.ts

alter table products add column if not exists cost_price     numeric(12,2) not null default 0;
alter table products add column if not exists sale_price     numeric(12,2) not null default 0;
alter table products add column if not exists stock_quantity numeric(12,3) not null default 0;
alter table products add column if not exists min_stock      numeric(12,3) not null default 0;
