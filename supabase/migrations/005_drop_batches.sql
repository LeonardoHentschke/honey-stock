-- =====================================================
-- 005 — remover lotes de produção (batches)
-- =====================================================
-- O app não usa mais lotes. `cascade` derruba as FKs batch_id de stock_movements e
-- sale_items automaticamente; as colunas batch_id permanecem (órfãs, nullable, ignoradas
-- pelo app) — assim os triggers create_sale_movement/on_sale_status_change seguem válidos.
--
-- Rodar no SQL editor do Supabase.

drop table if exists batches cascade;
