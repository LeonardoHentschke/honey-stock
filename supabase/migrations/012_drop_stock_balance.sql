-- =====================================================
-- 012 — remove o saldo de estoque do produto
-- =====================================================
-- Contexto: o app deixa de manter um saldo de estoque calculado
-- (products.stock_quantity / min_stock). Não existe mais entrada/saída/ajuste
-- manual — o único registro que passa a existir é o de vendas, já gerado
-- automaticamente em stock_movements (tipo 'sale') pelas triggers
-- create_sale_movement()/on_sale_status_change(), que continuam existindo.
--
-- A trigger apply_stock_movement() é quem hoje escreve em
-- products.stock_quantity a cada insert em stock_movements (inclusive os de
-- tipo 'sale'). Ela precisa ser removida antes da coluna, senão toda venda
-- passaria a quebrar com "column stock_quantity does not exist".

drop trigger if exists trg_apply_stock on stock_movements;
drop function if exists apply_stock_movement();

alter table products
  drop column if exists stock_quantity,
  drop column if exists min_stock;
