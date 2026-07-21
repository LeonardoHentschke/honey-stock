-- =============================================================================
-- Honey Stock — Seed de DESENVOLVIMENTO
-- =============================================================================
-- Aplicado APENAS no banco local, pelo `supabase start` / `supabase db reset`
-- (config.toml → [db.seed]). O `supabase db push` NÃO roda este arquivo, então
-- o banco remoto (produção) nunca recebe estes dados.
--
-- Login de desenvolvimento:
--   email:    dev@honeystock.local
--   senha:    devdev123
--   convite:  DEV001
-- =============================================================================

-- ── Empresa ──────────────────────────────────────────────────────────────────
insert into companies (id, name, invite_code) values
  ('11111111-1111-1111-1111-111111111111', 'Mel do Vale (DEV)', 'DEV001');

-- ── Usuário de auth + profile ────────────────────────────────────────────────
-- Insert direto em auth.users: os tokens em '' (e não null) evitam erro de scan
-- do GoTrue no login.
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change,
  email_change_token_new, email_change_token_current,
  phone_change, phone_change_token, reauthentication_token
) values (
  '00000000-0000-0000-0000-000000000000',
  '22222222-2222-2222-2222-222222222222',
  'authenticated', 'authenticated',
  'dev@honeystock.local',
  crypt('devdev123', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"Dev Local"}'::jsonb,
  now(), now(),
  '', '', '', '', '', '', '', ''
);

insert into auth.identities (
  id, user_id, provider_id, identity_data, provider,
  last_sign_in_at, created_at, updated_at
) values (
  gen_random_uuid(),
  '22222222-2222-2222-2222-222222222222',
  '22222222-2222-2222-2222-222222222222',
  jsonb_build_object(
    'sub', '22222222-2222-2222-2222-222222222222',
    'email', 'dev@honeystock.local',
    'email_verified', true
  ),
  'email', now(), now(), now()
);

insert into profiles (id, company_id, full_name) values
  ('22222222-2222-2222-2222-222222222222',
   '11111111-1111-1111-1111-111111111111',
   'Dev Local');

-- ── Produtos ─────────────────────────────────────────────────────────────────
-- Sem saldo de estoque — o único registro que existe é o de vendas
-- (stock_movements tipo 'sale', gerado por trigger a partir de sale_items).
insert into products (id, company_id, name, description, cost_price, sale_price) values
  ('33333333-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111',
   'Mel Silvestre 500g', 'Pote de vidro 500g', 12.00, 25.00),
  ('33333333-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111',
   'Mel Silvestre 1kg', 'Pote de vidro 1kg', 22.00, 45.00),
  ('33333333-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111',
   'Mel de Eucalipto 500g', 'Pote de vidro 500g', 13.00, 28.00),
  ('33333333-0000-0000-0000-000000000004', '11111111-1111-1111-1111-111111111111',
   'Mel de Laranjeira 250g', 'Bisnaga 250g', 8.00, 16.00);

-- ── Clientes ─────────────────────────────────────────────────────────────────
insert into customers (id, company_id, type, name, business_name, phone, email, reseller_discount_percent) values
  ('44444444-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111',
   'final', 'Maria Souza', null, '51999990001', 'maria@example.com', null),
  ('44444444-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111',
   'reseller', 'João Empório', 'Empório do João LTDA', '51999990002', 'joao@example.com', 15.00);

-- ── Vendas ───────────────────────────────────────────────────────────────────
-- s1: concluída, cliente final, paga integralmente.
insert into sales (id, company_id, customer_id, user_id, total, discount, payment_method, status) values
  ('55555555-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111',
   '44444444-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222',
   95.00, 0, 'pix', 'completed');

insert into sale_items (sale_id, product_id, quantity, unit_price, subtotal) values
  ('55555555-0000-0000-0000-000000000001', '33333333-0000-0000-0000-000000000001', 2, 25.00, 50.00),
  ('55555555-0000-0000-0000-000000000001', '33333333-0000-0000-0000-000000000002', 1, 45.00, 45.00);

insert into sale_payments (company_id, sale_id, amount, method, created_by) values
  ('11111111-1111-1111-1111-111111111111', '55555555-0000-0000-0000-000000000001',
   95.00, 'pix', '22222222-2222-2222-2222-222222222222');

-- s2: concluída, revenda com desconto, paga parcialmente (testa saldo devedor).
insert into sales (id, company_id, customer_id, user_id, total, discount, payment_method, status) values
  ('55555555-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111',
   '44444444-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222',
   238.00, 42.00, 'credit', 'completed');

insert into sale_items (sale_id, product_id, quantity, unit_price, subtotal) values
  ('55555555-0000-0000-0000-000000000002', '33333333-0000-0000-0000-000000000003', 10, 23.80, 238.00);

insert into sale_payments (company_id, sale_id, amount, method, created_by) values
  ('11111111-1111-1111-1111-111111111111', '55555555-0000-0000-0000-000000000002',
   100.00, 'cash', '22222222-2222-2222-2222-222222222222');

-- s3: agendada para amanhã — NÃO baixa estoque até virar delivered/completed.
insert into sales (id, company_id, customer_id, user_id, total, discount, payment_method, status, scheduled_for, notes) values
  ('55555555-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111',
   '44444444-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222',
   50.00, 0, 'cash', 'scheduled', now() + interval '1 day', 'Entregar na feira');

insert into sale_items (sale_id, product_id, quantity, unit_price, subtotal) values
  ('55555555-0000-0000-0000-000000000003', '33333333-0000-0000-0000-000000000001', 2, 25.00, 50.00);

-- ── Lembrete vinculado à venda agendada ──────────────────────────────────────
insert into reminders (id, company_id, sale_id, created_by, title, body, remind_at, status) values
  ('66666666-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111',
   '55555555-0000-0000-0000-000000000003', '22222222-2222-2222-2222-222222222222',
   'Entrega Maria Souza', 'Levar 2x Mel Silvestre 500g para a feira',
   now() + interval '1 day', 'pending');

insert into reminder_recipients (reminder_id, user_id) values
  ('66666666-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222');
