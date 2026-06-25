-- =====================================================
-- 006 — remover fornecedores (suppliers)
-- =====================================================
-- O app não usa mais fornecedores. `cascade` derruba a FK supplier_id de stock_movements;
-- a coluna supplier_id permanece (órfã, nullable, ignorada pelo app) — nenhum trigger a usa.
--
-- Rodar no SQL editor do Supabase.

drop table if exists suppliers cascade;
