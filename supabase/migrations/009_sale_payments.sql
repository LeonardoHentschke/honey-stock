-- =====================================================
-- 009 — histórico de pagamentos das vendas
-- =====================================================
-- Cada pagamento de uma venda vira um registro (valor, forma, data). O saldo pago
-- de uma venda é a soma dos pagamentos; o que falta = total - pago. Isso é ortogonal
-- ao status de entrega da venda (scheduled/completed/delivered/canceled).
--
-- Reutiliza o enum payment_method e o helper current_company_id().
-- Rodar no SQL editor / via `supabase db query --linked -f`.

create table if not exists sale_payments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  sale_id uuid not null references sales(id) on delete cascade,
  amount numeric(12,2) not null check (amount > 0),
  method payment_method not null default 'cash',
  paid_at timestamptz not null default now(),
  notes text,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);
create index if not exists sale_payments_company_id_idx on sale_payments(company_id);
create index if not exists sale_payments_sale_id_idx on sale_payments(sale_id);

alter table sale_payments enable row level security;

drop policy if exists "own_company_all" on sale_payments;
create policy "own_company_all" on sale_payments
  for all using (company_id = current_company_id());

-- Backfill: vendas concluídas/entregues existentes eram pagas integralmente →
-- 1 pagamento = total. Só insere se ainda não houver pagamento para a venda.
insert into sale_payments (company_id, sale_id, amount, method, paid_at, created_by)
select s.company_id, s.id, s.total, s.payment_method, s.created_at, s.user_id
from sales s
where s.status in ('completed','delivered')
  and s.total > 0
  and not exists (select 1 from sale_payments p where p.sale_id = s.id);
