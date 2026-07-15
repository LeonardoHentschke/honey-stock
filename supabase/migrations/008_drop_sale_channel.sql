-- =====================================================
-- 008 — remover canal de venda (sales.channel)
-- =====================================================
-- O app não informa mais o canal de venda. Remove a coluna `channel` da tabela
-- `sales` e o enum `sale_channel`. A coluna precisa ser dropada antes do tipo,
-- pois depende dele.
--
-- Rodar no SQL editor do Supabase.

alter table sales drop column if exists channel;
drop type if exists sale_channel;
